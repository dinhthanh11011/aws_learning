/**
 * Prints where an id lives, and optionally the lines themselves.
 *
 * Run: npm run where -- kms
 *      npm run where -- kms --print
 *      npm run where -- dva-d1-001 network-acls --print
 *
 * Why this exists: editing one `keyNumbers` row on `kms` meant opening
 * `services/security.ts` — 1,212 lines — to change three of them. The same is
 * true of every question, concept, trigger, step and lesson section: the corpus
 * is a handful of long typed arrays, so the file is never the unit of work but
 * is always the unit of reading. That cost is paid on every content edit, which
 * makes it the most-repeated waste in the repo.
 *
 * This resolves an id to `file:start-end` and, with `--print`, emits exactly
 * those lines with line numbers. It is deliberately textual — no imports from
 * `src/content` — so it still answers while the corpus does not compile, which
 * is precisely when you most need to find the thing you broke.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const CONTENT = join(ROOT, 'src', 'content')

const args = process.argv.slice(2)
const print = args.includes('--print')
const ids = args.filter((a) => !a.startsWith('--'))

if (!ids.length) {
  console.error('usage: npm run where -- <id|slug> [id...] [--print]')
  process.exit(1)
}

const files: string[] = []
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full)
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) files.push(full)
  }
}
walk(CONTENT)

/** Braces inside string literals must not count, or a `'{'` shifts every range. */
const stripStrings = (line: string) =>
  line
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')

type Hit = { file: string; start: number; end: number }

/**
 * An entry is found from its `id:`/`slug:` line, not from a parse. The anchor is
 * only accepted at the shallowest indent any anchor uses in that file, which is
 * what separates a real entry from the `slug:` inside a `confusedWith` row.
 */
const findHits = (id: string): Hit[] => {
  const hits: Hit[] = []
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const anchor = new RegExp(`^(\\s+)(?:id|slug): '${escaped}',?$`)

  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n')

    let shallowest = Infinity
    for (const line of lines) {
      const m = /^(\s+)(?:id|slug): '/.exec(line)
      if (m) shallowest = Math.min(shallowest, m[1].length)
    }

    // Top-level entries first; only if the id names nothing at that level do we
    // accept a nested one, which is how a diagram or section id inside a lesson
    // resolves to its own object rather than to the 350-line lesson around it.
    const depths = lines.flatMap((l) => (anchor.exec(l) ? [anchor.exec(l)![1].length] : []))
    if (!depths.length) continue
    const wanted = depths.includes(shallowest) ? shallowest : Math.min(...depths)

    for (let i = 0; i < lines.length; i++) {
      const m = anchor.exec(lines[i])
      if (!m || m[1].length !== wanted) continue

      // Walk back to the `{` that opens this entry, then match braces forward.
      let start = i
      while (start > 0 && !/\{\s*$/.test(stripStrings(lines[start]))) start--

      let depth = 0
      let end = start
      for (let j = start; j < lines.length; j++) {
        const s = stripStrings(lines[j])
        depth += (s.match(/\{/g) ?? []).length - (s.match(/\}/g) ?? []).length
        if (depth === 0 && j > start) {
          end = j
          break
        }
        end = j
      }

      hits.push({ file: relative(ROOT, file), start: start + 1, end: end + 1 })
    }
  }
  return hits
}

let missing = 0
for (const id of ids) {
  const hits = findHits(id)
  if (!hits.length) {
    console.error(`${id}  — NOT FOUND in src/content`)
    missing++
    continue
  }
  // Largest first: an id that is both a service entry and a two-line diagram
  // node in four lessons should lead with the entry, and `--print` should not
  // dump all five. Printing only the leader is the whole point of the tool.
  hits.sort((a, b) => b.end - b.start - (a.end - a.start))

  for (const [rank, h] of hits.entries()) {
    console.log(`${id}  ${h.file}:${h.start}-${h.end}  (${h.end - h.start + 1} lines)`)
    if (print && rank === 0) {
      const lines = readFileSync(join(ROOT, h.file), 'utf8').split('\n')
      const width = String(h.end).length
      for (let n = h.start; n <= h.end; n++) {
        console.log(`${String(n).padStart(width)}\t${lines[n - 1]}`)
      }
      console.log('')
    }
  }
}

process.exit(missing ? 1 : 0)
