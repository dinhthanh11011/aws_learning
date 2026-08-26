/**
 * Reports what is wrong with a diagram's geometry, without opening a browser.
 *
 * Run: npm run diagram:audit
 *      npm run diagram:audit -- sg-chain      (one spec)
 *
 * Why this exists: `content:check` verifies that every id in a `DiagramSpec`
 * resolves, which catches the diagram that draws *nothing*. It says nothing
 * about the diagram that draws something illegible — a label sitting on top of a
 * node, a node that appears to be inside a VPC it is not in, half the frame
 * empty because `rows` was over-declared. Those were all found by screenshotting
 * in a browser and nudging coordinates, which is the most expensive debugging
 * loop in this repo and produced every layout bug in the first lesson.
 *
 * Everything here is computed from `layout.ts` — the same functions the renderer
 * uses — so the numbers are what would actually be drawn. Text width is the one
 * estimate: SVG text has no measurable width outside a browser, so it is
 * approximated from the character count, deliberately slightly generously.
 *
 * These are warnings, not failures. A dense architecture diagram sometimes has
 * to accept a tight label, and a gate that cannot be satisfied gets ignored.
 */
import { lessons, stories, type DiagramSpec } from '../src/content'
import {
  type Box,
  edgeGeometry,
  layoutGroups,
  nodeBox,
  viewBox,
} from '../src/components/diagram/layout'

/** Rendered at fontSize 9. Roughly 0.52 em per character for this font stack. */
const CHAR_W = 4.7
const TEXT_H = 9
const labelBox = (text: string, x: number, y: number): Box => ({
  x: x - (text.length * CHAR_W) / 2,
  y: y - TEXT_H,
  w: text.length * CHAR_W,
  h: TEXT_H + 2,
})

const overlaps = (a: Box, b: Box, slack = 0): boolean =>
  a.x < b.x + b.w - slack &&
  b.x < a.x + a.w - slack &&
  a.y < b.y + b.h - slack &&
  b.y < a.y + a.h - slack

const inside = (inner: Box, outer: Box): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h

interface Note {
  spec: string
  msg: string
}
const notes: Note[] = []
const note = (spec: string, msg: string) => notes.push({ spec, msg })

function audit(spec: DiagramSpec, where: string): void {
  const id = `${where} · ${spec.id}`
  const boxes = new Map(spec.nodes.map((n) => [n.id, nodeBox(n)]))
  const groups = layoutGroups(spec)

  /* 1. Nodes must not overlap each other. */
  for (let i = 0; i < spec.nodes.length; i += 1) {
    for (let j = i + 1; j < spec.nodes.length; j += 1) {
      const a = spec.nodes[i]
      const b = spec.nodes[j]
      if (overlaps(boxes.get(a.id)!, boxes.get(b.id)!)) {
        note(id, `nodes "${a.id}" and "${b.id}" overlap`)
      }
    }
  }

  /* 2. A node sitting inside a group's rectangle but not belonging to it reads
        as a member of that group. This is how "Internet" ended up looking like
        it was inside the VPC. */
  for (const { group, box } of groups) {
    const members = new Set<string>()
    const collect = (gid: string): void => {
      const g = spec.groups.find((x) => x.id === gid)
      if (!g) return
      for (const n of g.nodeIds) members.add(n)
      for (const child of spec.groups.filter((x) => x.parent === gid)) collect(child.id)
    }
    collect(group.id)
    for (const n of spec.nodes) {
      if (members.has(n.id)) continue
      if (overlaps(boxes.get(n.id)!, box, 2)) {
        const verb = inside(boxes.get(n.id)!, box) ? 'sits inside' : 'overlaps'
        note(id, `node "${n.id}" ${verb} group "${group.id}" but is not in it`)
      }
    }
  }

  /* 3. Edge labels must not land on a node or on each other. */
  const labels: { edge: string; box: Box }[] = []
  for (const e of spec.edges) {
    const from = spec.nodes.find((n) => n.id === e.from)
    const to = spec.nodes.find((n) => n.id === e.to)
    if (!from || !to || !e.label) continue
    const g = edgeGeometry(from, to, { elbow: e.elbow })
    const lb = labelBox(e.label, g.label.x, g.label.y)
    labels.push({ edge: e.id, box: lb })

    for (const n of spec.nodes) {
      if (overlaps(lb, boxes.get(n.id)!, 1)) {
        note(id, `label "${e.label}" on edge "${e.id}" overlaps node "${n.id}"`)
      }
    }
  }
  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) {
      if (overlaps(labels[i].box, labels[j].box, 1)) {
        note(id, `labels on edges "${labels[i].edge}" and "${labels[j].edge}" overlap`)
      }
    }
  }

  /* 4. Over-declared cols/rows leave dead space, because `viewBox` unions the
        declared grid with the content rather than cropping to it. */
  const vb = viewBox(spec)
  const content = [...boxes.values(), ...groups.map((g) => g.box)]
  if (content.length) {
    const right = Math.max(...content.map((b) => b.x + b.w))
    const bottom = Math.max(...content.map((b) => b.y + b.h))
    const deadX = vb.minX + vb.w - right - 4
    const deadY = vb.minY + vb.h - bottom - 4
    // A third of the frame empty is the point where it looks like a mistake.
    if (deadY > vb.h / 3) {
      note(id, `${Math.round(deadY)}px dead space below content — lower \`rows\` from ${spec.rows}`)
    }
    if (deadX > vb.w / 3) {
      note(
        id,
        `${Math.round(deadX)}px dead space right of content — lower \`cols\` from ${spec.cols}`,
      )
    }
  }

  /* 5. Two edges between the same pair draw on top of each other unless one is
        an elbow — the reason the reply arrow in the first lesson is a diagonal. */
  const pairs = new Map<string, string[]>()
  for (const e of spec.edges) {
    const key = [e.from, e.to].sort().join('~')
    const shape = e.elbow ? 'elbow' : 'straight'
    const list = pairs.get(`${key}|${shape}`) ?? []
    list.push(e.id)
    pairs.set(`${key}|${shape}`, list)
  }
  for (const [key, ids] of pairs) {
    if (ids.length > 1) {
      note(
        id,
        `edges ${ids.map((x) => `"${x}"`).join(', ')} share endpoints and shape (${key.split('|')[1]}) — they will draw on top of each other`,
      )
    }
  }
}

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const specs: { spec: DiagramSpec; where: string }[] = [
  ...stories.map((s) => ({ spec: s.architecture, where: `story ${s.slug}` })),
  ...lessons.flatMap((l) =>
    l.sections.flatMap((s) =>
      s.kind === 'diagram' ? [{ spec: s.spec, where: `lesson ${l.id}` }] : [],
    ),
  ),
]
const picked = only.length ? specs.filter((s) => only.includes(s.spec.id)) : specs

if (!picked.length) {
  console.error(`no diagram matched. Known ids: ${specs.map((s) => s.spec.id).join(', ')}`)
  process.exit(1)
}

for (const { spec, where } of picked) audit(spec, where)

console.log(`\n  Diagram audit — ${picked.length} spec(s)`)
console.log('  ─────────────────────────────────────────')
if (!notes.length) {
  console.log('  ✓ no geometry problems found\n')
} else {
  const byspec = new Map<string, string[]>()
  for (const n of notes) byspec.set(n.spec, [...(byspec.get(n.spec) ?? []), n.msg])
  for (const [spec, msgs] of byspec) {
    console.log(`\n  ${spec}`)
    for (const m of msgs) console.log(`    · ${m}`)
  }
  console.log(
    `\n  ${notes.length} note(s). These are advisory — a dense diagram may accept a tight label.\n`,
  )
}
