/**
 * Validates every piece of content against the zod schemas and, more usefully,
 * checks that no id points at something that does not exist. A question tagged
 * with a task statement that was renamed is a build failure here rather than a
 * blank screen at 11pm the night before the exam.
 *
 * Run: npm run content:check
 */
import {
  CertSchema,
  ServiceSchema,
  ConceptSchema,
  PhaseSchema,
  StudyStepSchema,
  TriggerSchema,
  IdleCostSchema,
  certs,
  services,
  serviceBySlug,
  concepts,
  conceptBySlug,
  labById,
  phases,
  triggers,
  idleCosts,
  tasks,
  taskById,
  domains,
  contentStats,
  QuestionSchema,
  questions,
  examCoverage,
  CERT_FAMILY_IDS,
  CERT_IDS,
  currentCerts,
  type Scoped,
  resolveTaskId,
  inScope,
  StorySchema,
  stories,
} from '../src/content'
import { serviceSlugForNode } from '../src/components/diagram/layout'
import { refSlugs } from '../src/lib/md'

const problems: string[] = []
const warnings: string[] = []

const fail = (where: string, msg: string) => problems.push(`${where}: ${msg}`)
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`)

/* ── 1. Shape validation ─────────────────────────────────────────────────── */

for (const cert of certs) {
  const r = CertSchema.safeParse(cert)
  if (!r.success)
    fail(
      `cert ${cert.id}`,
      r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; '),
    )
}
for (const s of services) {
  const r = ServiceSchema.safeParse(s)
  if (!r.success)
    fail(
      `service ${s.slug}`,
      r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; '),
    )
}
for (const c of concepts) {
  const r = ConceptSchema.safeParse(c)
  if (!r.success)
    fail(
      `concept ${c.slug}`,
      r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; '),
    )
}
for (const p of phases) {
  const r = PhaseSchema.safeParse(p)
  if (!r.success)
    fail(`phase ${p.id}`, r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; '))
}
for (const t of triggers) {
  const r = TriggerSchema.safeParse(t)
  if (!r.success)
    fail(
      `trigger ${t.id}`,
      r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; '),
    )
}
for (const c of idleCosts) {
  const r = IdleCostSchema.safeParse(c)
  if (!r.success)
    fail(
      `idleCost ${c.slug}`,
      r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; '),
    )
}

for (const q of questions) {
  const r = QuestionSchema.safeParse(q)
  if (!r.success)
    fail(
      `question ${q.id}`,
      r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; '),
    )
}

/* ── 2. Uniqueness ───────────────────────────────────────────────────────── */

const dupes = <T>(items: T[], key: (t: T) => string) => {
  const seen = new Set<string>()
  const dup = new Set<string>()
  for (const i of items) {
    const k = key(i)
    if (seen.has(k)) dup.add(k)
    seen.add(k)
  }
  return [...dup]
}

for (const d of dupes(services, (s) => s.slug)) fail('services', `duplicate slug "${d}"`)
for (const d of dupes(concepts, (c) => c.slug)) fail('concepts', `duplicate slug "${d}"`)
// Concepts and services share the peek stack and the search result list, so a
// slug colliding across the two corpora would make one of them unreachable.
for (const c of concepts) {
  if (serviceBySlug.has(c.slug))
    fail('concepts', `slug "${c.slug}" collides with a service of the same slug`)
}
for (const d of dupes(tasks, (t) => t.id)) fail('tasks', `duplicate task id "${d}"`)
for (const d of dupes(domains, (x) => x.id)) fail('domains', `duplicate domain id "${d}"`)
for (const d of dupes(triggers, (t) => t.id)) fail('triggers', `duplicate trigger id "${d}"`)
for (const d of dupes(phases, (p) => p.id)) fail('phases', `duplicate phase id "${d}"`)
for (const d of dupes(questions, (q) => q.id)) fail('questions', `duplicate question id "${d}"`)

/* ── 3. Referential integrity ────────────────────────────────────────────── */

for (const task of tasks) {
  for (const slug of task.serviceSlugs) {
    if (!serviceBySlug.has(slug)) fail(`task ${task.id}`, `references unknown service "${slug}"`)
  }
}

for (const s of services) {
  for (const c of s.confusedWith) {
    if (!serviceBySlug.has(c.slug))
      fail(`service ${s.slug}`, `confusedWith unknown service "${c.slug}"`)
    if (c.slug === s.slug) fail(`service ${s.slug}`, 'confusedWith points at itself')
  }
  for (const r of s.related) {
    if (!serviceBySlug.has(r)) fail(`service ${s.slug}`, `related unknown service "${r}"`)
    if (r === s.slug) fail(`service ${s.slug}`, 'related points at itself')
  }
}

for (const c of concepts) {
  for (const other of c.confusedWith) {
    if (!conceptBySlug.has(other.slug))
      fail(`concept ${c.slug}`, `confusedWith unknown concept "${other.slug}"`)
    if (other.slug === c.slug) fail(`concept ${c.slug}`, 'confusedWith points at itself')
  }
  for (const r of c.related) {
    if (!conceptBySlug.has(r)) fail(`concept ${c.slug}`, `related unknown concept "${r}"`)
    if (r === c.slug) fail(`concept ${c.slug}`, 'related points at itself')
  }
  for (const slug of c.serviceSlugs) {
    if (!serviceBySlug.has(slug))
      fail(`concept ${c.slug}`, `serviceSlugs references unknown service "${slug}"`)
  }
}

for (const t of triggers) {
  for (const slug of t.slugs) {
    if (!serviceBySlug.has(slug)) fail(`trigger ${t.id}`, `references unknown service "${slug}"`)
  }
  for (const n of t.notThis) {
    if (!serviceBySlug.has(n.slug)) fail(`trigger ${t.id}`, `notThis unknown service "${n.slug}"`)
  }
  for (const d of t.domainIds) {
    if (!domains.some((x) => x.id === d))
      fail(`trigger ${t.id}`, `references unknown domain "${d}"`)
  }
}

/**
 * Routes a step is allowed to send someone to. Hard-coded rather than derived
 * from the filesystem because a step pointing at a route that does not exist yet
 * should fail here, not 404 in front of the learner.
 */
const ROUTES = new Set([
  '/',
  '/big-picture',
  '/compare',
  '/decoder',
  '/drill',
  '/exam',
  '/labs',
  '/labs/iam-puzzle',
  '/labs/storage-cost',
  '/labs/vpc-builder',
  '/map',
  '/progress',
  '/quiz',
  '/concepts',
  '/services',
  '/settings',
  '/story',
])

const stepIds = new Set<string>()

for (const p of phases) {
  for (const id of p.taskIds) {
    if (!taskById.has(id)) fail(`phase ${p.id}`, `references unknown task "${id}"`)
  }
  if (p.weekTo < p.weekFrom) fail(`phase ${p.id}`, 'weekTo is before weekFrom')

  for (const id of p.labIds) {
    // A warning rather than a failure: the roadmap already skips unknown lab
    // ids, and several planned labs are still in the backlog.
    if (!labById.has(id)) warn(`phase ${p.id}`, `labIds names lab "${id}", which does not exist`)
  }

  if (!p.steps.length)
    warn(`phase ${p.id}`, 'has no steps — the roadmap will show it as a syllabus')

  for (const [i, step] of p.steps.entries()) {
    const where = `step ${step.id}`
    const r = StudyStepSchema.safeParse(step)
    if (!r.success) {
      fail(where, r.error.issues.map((x) => `${x.path.join('.')} ${x.message}`).join('; '))
    }
    if (stepIds.has(step.id)) fail(where, 'duplicate step id')
    stepIds.add(step.id)
    // The id encodes its position, so a reordered array with stale ids would
    // silently renumber what the learner sees.
    const expected = `${p.id}-s${i + 1}`
    if (step.id !== expected)
      fail(where, `is at position ${i + 1}, so its id should be "${expected}"`)

    for (const slug of step.serviceSlugs) {
      if (!serviceBySlug.has(slug)) fail(where, `references unknown service "${slug}"`)
    }
    for (const a of step.actions) {
      if (!ROUTES.has(a.href))
        fail(where, `action "${a.label}" points at unknown route "${a.href}"`)
    }
    const readMinutes = step.reading.reduce((n, x) => n + x.minutes, 0)
    if (readMinutes > step.minutes) {
      fail(where, `reading is ${readMinutes} min but the step budget is ${step.minutes} min`)
    }
    if (step.kind === 'read' && !step.reading.length) {
      warn(where, 'is a read step with nothing to read')
    }
  }

  // Steps are the guided spine, not the whole phase — but they must not claim
  // more time than the phase has.
  const stepMinutes = p.steps.reduce((n, x) => n + x.minutes, 0)
  if (stepMinutes > p.hours * 60) {
    fail(
      `phase ${p.id}`,
      `steps total ${Math.round(stepMinutes / 60)} h but the phase is budgeted at ${p.hours} h`,
    )
  }
}

for (const c of idleCosts) {
  if (!serviceBySlug.has(c.slug)) fail(`idleCost ${c.slug}`, 'references unknown service')
}

for (const q of questions) {
  if (!taskById.has(q.taskId)) fail(`question ${q.id}`, `references unknown task "${q.taskId}"`)
  for (const slug of q.serviceSlugs) {
    if (!serviceBySlug.has(slug)) fail(`question ${q.id}`, `references unknown service "${slug}"`)
  }
  const ids = q.options.map((o) => o.id)
  if (new Set(ids).size !== ids.length) fail(`question ${q.id}`, 'duplicate option ids')
  // Options must be lettered contiguously from A, or the keyboard shortcuts lie.
  const expected = ids.map((_, i) => String.fromCharCode(65 + i))
  if (ids.join('') !== expected.join('')) {
    fail(`question ${q.id}`, `option ids are ${ids.join('')}, expected ${expected.join('')}`)
  }
}

/* ── 4. Exam-shape invariants ────────────────────────────────────────────── */

for (const cert of certs) {
  const total = cert.domains.reduce((n, d) => n + d.weight, 0)
  if (total !== 100) fail(`cert ${cert.id}`, `domain weights sum to ${total}, not 100`)
  if (cert.scoredCount > cert.questionCount) {
    fail(`cert ${cert.id}`, 'scoredCount exceeds questionCount')
  }
  const indexes = cert.domains.map((d) => d.index).sort((a, b) => a - b)
  if (indexes.some((v, i) => v !== i + 1)) fail(`cert ${cert.id}`, 'domain indexes are not 1..n')
}

/* ── 4b. Cert identity, lifecycle and scope ──────────────────────────────── */

/*
 * Every id in the CERT_IDS tuple must have a definition in the registry.
 * Several components do `certById.get(profile.targetCert)!`, and this is what
 * makes that assertion sound rather than optimistic: the type says the value is
 * one of CERT_IDS, so as long as CERT_IDS and the registry agree, the lookup
 * cannot miss.
 */
for (const id of CERT_IDS) {
  if (!certs.some((c) => c.id === id)) {
    fail('certs', `CERT_IDS lists "${id}" but no cert file defines it`)
  }
}
for (const cert of certs) {
  if (!(CERT_IDS as readonly string[]).includes(cert.id)) {
    fail(`cert ${cert.id}`, 'is defined but missing from the CERT_IDS tuple')
  }
}

for (const cert of certs) {
  const expectedId = `${cert.family.toUpperCase()}-${cert.versionCode}`
  if (cert.id !== expectedId) {
    fail(`cert ${cert.id}`, `family and versionCode imply id "${expectedId}"`)
  }
  if (cert.supersededBy) {
    const next = certs.find((c) => c.id === cert.supersededBy)
    if (!next) fail(`cert ${cert.id}`, `supersededBy names unknown cert "${cert.supersededBy}"`)
    else if (next.family !== cert.family) {
      fail(`cert ${cert.id}`, `supersededBy points at ${next.id}, a different exam family`)
    } else if (next.id === cert.id) fail(`cert ${cert.id}`, 'supersededBy points at itself')
    if (cert.status !== 'retired') {
      warn(`cert ${cert.id}`, 'has supersededBy but is not marked retired')
    }
  }
  if (cert.status === 'retired' && !cert.supersededBy) {
    // Otherwise a learner on this version has nowhere to be moved to.
    fail(`cert ${cert.id}`, 'is retired but names no supersededBy')
  }
}

// A retirement chain must terminate, or getProfile() would loop forever.
for (const cert of certs) {
  const seen = new Set<string>([cert.id])
  let at = cert.supersededBy
  while (at) {
    if (seen.has(at)) {
      fail(`cert ${cert.id}`, `supersededBy chain cycles back to "${at}"`)
      break
    }
    seen.add(at)
    at = certs.find((c) => c.id === at)?.supersededBy
  }
}

for (const family of CERT_FAMILY_IDS) {
  const live = currentCerts.filter((c) => c.family === family)
  if (live.length > 1) {
    fail(
      `family ${family}`,
      `has ${live.length} current versions: ${live.map((c) => c.id).join(', ')}`,
    )
  }
  if (!live.length) warn(`family ${family}`, 'has no current exam version')
}

const firsts = certs.filter((c) => c.recommendedFirst)
if (firsts.length > 1) {
  fail(
    'certs',
    `${firsts.length} certs set recommendedFirst: ${firsts.map((c) => c.id).join(', ')}`,
  )
}

/*
 * Every question must land on a live task statement of some current paper.
 * Without this rule a version bump that renumbered its domains would silently
 * empty the exam sampler — the questions would still validate, still count in
 * the stats, and simply never be sampled.
 */
for (const q of questions) {
  const lands = currentCerts.some((cert) => inScope(q, cert.id) && resolveTaskId(q.taskId, cert.id))
  if (!lands) {
    fail(
      `question ${q.id}`,
      `taskId "${q.taskId}" resolves to no task on any current paper it is tagged for — ` +
        'add a `supersedes` entry on the task that absorbed it',
    )
  }
}

/*
 * The versionScope audit. Printed on every run, green or not: an override is
 * debt, and the only way it stays small is by staying visible.
 */
const scoped: { where: string; note: string; detail: string }[] = []
const collectScope = (where: string, item: Scoped) => {
  const v = item.versionScope
  if (!v) return
  scoped.push({
    where,
    note: v.note,
    detail: v.onlyIn ? `only ${v.onlyIn.join(', ')}` : `not ${v.notIn!.join(', ')}`,
  })
  const named = v.onlyIn ?? v.notIn!
  for (const id of named) {
    const cert = certs.find((c) => c.id === id)
    if (!cert) fail(where, `versionScope names unknown cert "${id}"`)
    else if (!item.families.includes(cert.family)) {
      fail(
        where,
        `versionScope names ${id} but the item is not tagged for the ${cert.family} family`,
      )
    } else if (cert.status === 'retired') {
      warn(where, `versionScope names retired ${id} — the override can be deleted`)
    }
  }
}
for (const s of services) collectScope(`service ${s.slug}`, s)
for (const c of concepts) collectScope(`concept ${c.slug}`, c)
for (const q of questions) collectScope(`question ${q.id}`, q)
for (const t of triggers) collectScope(`trigger ${t.id}`, t)
for (const p of phases) collectScope(`phase ${p.id}`, p)

// Content excluded from every current paper is drilled by nobody.
for (const item of [
  ...services.map((s) => [`service ${s.slug}`, s] as const),
  ...concepts.map((c) => [`concept ${c.slug}`, c] as const),
  ...questions.map((q) => [`question ${q.id}`, q] as const),
]) {
  const [where, data] = item
  if (!data.versionScope) continue
  if (!currentCerts.some((cert) => inScope(data, cert.id))) {
    fail(where, 'versionScope excludes it from every current paper — it is dead content')
  }
}

/* ── 4c. Stories ─────────────────────────────────────────────────────────── */

/**
 * The architecture is declared once and chapters reveal parts of it, so the
 * failure modes are all about the two halves disagreeing: a chapter adding an id
 * that does not exist, or an id existing that no chapter ever introduces. Both
 * are silent in the UI — the first draws nothing, the second draws nothing ever
 * — which is exactly why they are failures here.
 */
for (const st of stories) {
  const where = `story ${st.slug}`
  const parsed = StorySchema.safeParse(st)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      fail(where, `${issue.path.join('.')}: ${issue.message}`)
    }
    continue
  }

  const arch = st.architecture
  const nodeIds = new Set(arch.nodes.map((n) => n.id))
  const edgeIds = new Set(arch.edges.map((e) => e.id))
  const groupIds = new Set(arch.groups.map((g) => g.id))

  if (nodeIds.size !== arch.nodes.length) fail(where, 'architecture has duplicate node ids')
  if (edgeIds.size !== arch.edges.length) fail(where, 'architecture has duplicate edge ids')
  if (groupIds.size !== arch.groups.length) fail(where, 'architecture has duplicate group ids')

  // A service-kind node must name a real service, or clicking it opens nothing.
  for (const n of arch.nodes) {
    if (n.kind !== 'service') continue
    if (!serviceSlugForNode(n.id, (slug) => serviceBySlug.has(slug))) {
      fail(where, `node "${n.id}" is kind service but resolves to no service slug`)
    }
  }

  for (const e of arch.edges) {
    if (!nodeIds.has(e.from)) fail(where, `edge "${e.id}" comes from unknown node "${e.from}"`)
    if (!nodeIds.has(e.to)) fail(where, `edge "${e.id}" goes to unknown node "${e.to}"`)
  }

  // A parent chain that does not terminate would hang the layout.
  for (const g of arch.groups) {
    if (!g.parent) continue
    if (!groupIds.has(g.parent)) {
      fail(where, `group "${g.id}" names unknown parent "${g.parent}"`)
      continue
    }
    const seen = new Set([g.id])
    let cur: string | undefined = g.parent
    while (cur) {
      if (seen.has(cur)) {
        fail(where, `group "${g.id}" is in a parent cycle`)
        break
      }
      seen.add(cur)
      cur = arch.groups.find((x) => x.id === cur)?.parent
    }
    for (const id of g.nodeIds) {
      if (!nodeIds.has(id)) fail(where, `group "${g.id}" names unknown node "${id}"`)
    }
  }

  // The real invariant behind the relaxed schema: a group must contain
  // something, directly or through a child. An empty one draws a labelled box
  // around nothing.
  for (const g of arch.groups) {
    const hasChild = arch.groups.some((x) => x.parent === g.id)
    if (!g.nodeIds.length && !hasChild) {
      fail(where, `group "${g.id}" holds no node and has no child group`)
    }
  }

  // Chapter ids must match position, exactly as study-step ids do — so a
  // reordered chapter is a build error rather than a wrong deep link.
  const introduced = {
    nodes: new Map<string, string>(),
    edges: new Map<string, string>(),
    groups: new Map<string, string>(),
  }
  st.chapters.forEach((c, i) => {
    const cw = `story ${st.slug} chapter ${c.id}`
    const expected = `${st.slug}-c${i + 1}`
    if (c.id !== expected) fail(cw, `id should be "${expected}" for position ${i + 1}`)

    if (!taskById.has(c.taskId)) fail(cw, `references unknown task "${c.taskId}"`)
    else {
      const lands = currentCerts.some(
        (cert) => inScope(st, cert.id) && resolveTaskId(c.taskId, cert.id),
      )
      if (!lands) fail(cw, `task "${c.taskId}" resolves on no current paper`)
    }

    for (const slug of c.serviceSlugs) {
      if (!serviceBySlug.has(slug)) fail(cw, `serviceSlugs names unknown service "${slug}"`)
    }
    for (const slug of c.conceptSlugs) {
      if (!conceptBySlug.has(slug)) fail(cw, `conceptSlugs names unknown concept "${slug}"`)
    }

    // Decision options point into the shared service+concept namespace.
    if (!c.decision.options.some((o) => o.correct)) {
      fail(cw, 'decision has no correct option')
    }
    if (c.decision.options.filter((o) => o.correct).length > 1) {
      fail(cw, 'decision has more than one correct option — the reveal assumes one')
    }
    for (const o of c.decision.options) {
      if (!serviceBySlug.has(o.slug) && !conceptBySlug.has(o.slug)) {
        fail(cw, `decision option "${o.slug}" is neither a service nor a concept`)
      }
    }

    for (const k of c.checks) {
      if (!k.id.startsWith(c.id)) fail(cw, `check "${k.id}" should be prefixed with the chapter id`)
      const right = k.options.filter((o) => o.correct).length
      if (right !== 1) fail(cw, `check "${k.id}" has ${right} correct options, expected exactly 1`)
    }

    // Every [[slug]] in the prose must resolve, or the reader sees a bare slug.
    for (const sec of c.sections) {
      const texts: string[] = []
      if (sec.kind === 'prose' || sec.kind === 'callout') texts.push(sec.md)
      if (sec.kind === 'steps') texts.push(...sec.items.map((it) => it.md))
      if (sec.kind === 'compare') texts.push(...sec.rows.flatMap((r) => r.cells))
      if (sec.kind === 'services') {
        for (const slug of sec.slugs) {
          if (!serviceBySlug.has(slug)) fail(cw, `services section names unknown "${slug}"`)
        }
      }
      for (const t of texts) {
        for (const slug of refSlugs(t)) {
          if (!serviceBySlug.has(slug) && !conceptBySlug.has(slug)) {
            fail(cw, `prose references [[${slug}]], which is neither a service nor a concept`)
          }
        }
      }
    }

    const claim = (kind: 'nodes' | 'edges' | 'groups', ids: string[], known: Set<string>): void => {
      for (const id of ids) {
        if (!known.has(id)) {
          fail(cw, `adds ${kind} "${id}", which the architecture does not contain`)
          continue
        }
        const first = introduced[kind].get(id)
        if (first) fail(cw, `adds ${kind} "${id}", already introduced by ${first}`)
        else introduced[kind].set(id, c.id)
      }
    }
    claim('nodes', c.adds.nodeIds, nodeIds)
    claim('edges', c.adds.edgeIds, edgeIds)
    claim('groups', c.adds.groupIds, groupIds)

    // An edge cannot be drawn before both its endpoints exist.
    for (const id of c.adds.edgeIds) {
      const e = arch.edges.find((x) => x.id === id)
      if (!e) continue
      for (const end of [e.from, e.to]) {
        if (!introduced.nodes.has(end)) {
          fail(cw, `adds edge "${id}" but node "${end}" is not introduced by now`)
        }
      }
    }

    // A group must hold something the moment it appears — a node of its own or a
    // child group. A parent (Region → VPC) legitimately has neither of its own.
    for (const id of c.adds.groupIds) {
      const g = arch.groups.find((x) => x.id === id)
      if (!g) continue
      if (g.parent && !introduced.groups.has(g.parent)) {
        fail(cw, `adds group "${id}" before its parent "${g.parent}"`)
      }
      const hasNode = g.nodeIds.some((n) => introduced.nodes.has(n))
      const hasChild = arch.groups.some((x) => x.parent === g.id && c.adds.groupIds.includes(x.id))
      if (!hasNode && !hasChild) {
        fail(cw, `adds group "${id}" while it would be empty — no visible node or child group`)
      }
    }
  })

  // Nothing may be declared and never revealed: it would draw exactly never.
  for (const n of arch.nodes) {
    if (!introduced.nodes.has(n.id)) fail(where, `node "${n.id}" is introduced by no chapter`)
  }
  for (const e of arch.edges) {
    if (!introduced.edges.has(e.id)) fail(where, `edge "${e.id}" is introduced by no chapter`)
  }
  for (const g of arch.groups) {
    if (!introduced.groups.has(g.id)) fail(where, `group "${g.id}" is introduced by no chapter`)
  }
}

/* ── 5. Coverage warnings (not failures) ─────────────────────────────────── */

const referenced = new Set(tasks.flatMap((t) => t.serviceSlugs))
for (const s of services) {
  if (!referenced.has(s.slug)) {
    warn('coverage', `service "${s.slug}" is not referenced by any task statement`)
  }
  if (s.tier === 1 && s.examTraps.length < 3) {
    warn('depth', `core service "${s.slug}" has only ${s.examTraps.length} exam traps`)
  }
  if (s.tier === 1 && s.keyNumbers.length < 3) {
    warn('depth', `core service "${s.slug}" has only ${s.keyNumbers.length} key numbers`)
  }
  if (!s.whenNotToUse.length) warn('depth', `service "${s.slug}" has no whenNotToUse entries`)
}

for (const c of concepts) {
  // A concept with no traps and no exam phrasings is a dictionary entry, and a
  // dictionary is the thing this corpus exists to not be.
  if (!c.examTraps.length) warn('depth', `concept "${c.slug}" has no exam traps`)
  if (!c.onTheExam.length) warn('depth', `concept "${c.slug}" has no onTheExam phrasings`)
  if (!c.serviceSlugs.length)
    warn('coverage', `concept "${c.slug}" names no service — nothing links to it from the atlas`)
}

/**
 * `whyItExists` coverage. Aggregated into one counted line rather than one
 * warning per entry: this starts life absent on almost the whole corpus, and 180
 * separate warnings would bury the depth and atlas-gap signals that are actually
 * actionable today. Tier 3 is excluded — a recognise-only service needs a name
 * and one job, not a paragraph on its origins.
 */
const missingWhy = [
  ...services.filter((s) => s.tier <= 2 && !s.whyItExists).map((s) => s.slug),
  ...concepts.filter((c) => !c.whyItExists).map((c) => c.slug),
]
if (missingWhy.length) {
  const owed = services.filter((s) => s.tier <= 2).length + concepts.length
  warn(
    'why',
    `${missingWhy.length} of ${owed} tier-1/2 services and concepts have no whyItExists: ` +
      `${missingWhy.slice(0, 10).join(', ')}${missingWhy.length > 10 ? ', …' : ''}`,
  )
}

/**
 * Facts taught only in a question explanation are invisible: the atlas does not
 * carry them, so `cards.ts` cannot derive a card from them, and searching for
 * them finds nothing. This audit reads the quantities out of every explanation
 * and checks that each one also appears somewhere in the atlas entry of a
 * service the question points at. A hit here means "promote this into
 * `src/content/services/*` and let the question restate it", not "delete it".
 */
const atlasText = (slug: string): string => {
  const s = serviceBySlug.get(slug)
  if (!s) return ''
  return [
    s.oneLiner,
    s.whatItIs,
    ...s.whenToUse,
    ...s.whenNotToUse,
    ...s.keyNumbers.flatMap((n) => [n.label, n.value, n.note ?? '']),
    ...s.examTraps,
    ...s.confusedWith.map((c) => c.difference),
    s.pricing ?? '',
  ]
    .join(' \n ')
    .toLowerCase()
    .replace(/,(?=\d)/g, '')
}

/** Only quantities carrying a unit — a bare "3" is noise, "15 minutes" is a fact. */
const UNIT =
  '%|gb\\/s|gib|tib|kib|mib|gb|tb|mb|kb|kib|bytes?|gbps|mbps|kbps|ms|tps|rps|iops|wcus?|rcus?|' +
  'seconds?|minutes?|hours?|days?|weeks?|months?|years?|copies|replicas?|azs?|regions?|' +
  'shards?|partitions?|vcpus?|acus?|connections?|attempts?|retries|nodes?|characters?|kilobytes?'
// A trailing \\b would not fire after "%", which is exactly the case that matters most.
const QUANTITY = new RegExp(`\\b(\\d[\\d.]*)\\s?(${UNIT})(?!\\w)`, 'gi')

const orphanFacts: string[] = []
for (const q of questions) {
  const atlas = q.serviceSlugs.map(atlasText).join(' \n ')
  const explanation = q.explanation.toLowerCase().replace(/,(?=\d)/g, '')
  const missing = new Set<string>()
  for (const [, value, unit] of explanation.matchAll(QUANTITY)) {
    // Match on the number alone: the atlas may say "128 TiB" where the
    // explanation says "128 TiB volume", and the unit wording varies more than
    // the figure does.
    if (!new RegExp(`\\b${value.replace('.', '\\.')}\\b`).test(atlas)) {
      missing.add(`${value} ${unit}`)
    }
  }
  if (missing.size) {
    orphanFacts.push(
      `question ${q.id} teaches ${[...missing].map((m) => `"${m}"`).join(', ')} but ` +
        (q.serviceSlugs.length
          ? `no atlas entry for ${q.serviceSlugs.join(', ')} mentions the figure`
          : 'it references no service at all'),
    )
  }
}
if (orphanFacts.length) {
  const shown = orphanFacts.slice(0, 12)
  for (const o of shown) warn('atlas gap', o)
  if (orphanFacts.length > shown.length) {
    warn(
      'atlas gap',
      `…and ${orphanFacts.length - shown.length} more (${orphanFacts.length} total)`,
    )
  }
}

for (const cert of currentCerts) {
  const certId = cert.id
  const cov = examCoverage(certId)
  for (const d of cov.perDomain) {
    if (d.have < d.need) {
      warn(
        'exam coverage',
        `${certId} ${d.title}: ${d.have} questions, needs ${d.need} to fill a full paper without repeats`,
      )
    }
  }
}

/* ── Report ──────────────────────────────────────────────────────────────── */

const stats = contentStats()
console.log('\n  Content check')
console.log('  ─────────────────────────────────────────')
console.log(`  certs           ${certs.length}`)
console.log(`  domains         ${stats.domains}`)
console.log(`  task statements ${stats.tasks}`)
console.log(
  `  services        ${stats.services}  (core ${stats.tier1} · working ${stats.tier2} · recognise ${stats.tier3})`,
)
console.log(`  concepts        ${stats.concepts}`)
console.log(`  key numbers     ${stats.keyNumbers}`)
console.log(`  exam traps      ${stats.examTraps}`)
console.log(`  questions       ${questions.length}`)
console.log(`  triggers        ${stats.triggers}`)
console.log(`  phases          ${phases.length}`)
console.log(
  `  study steps     ${phases.flatMap((p) => p.steps).length}  (${Math.round(
    phases.flatMap((p) => p.steps).reduce((n, x) => n + x.minutes, 0) / 60,
  )} h guided of ${phases.reduce((n, p) => n + p.hours, 0)} h)`,
)
console.log(
  `  stories         ${stories.length}  (${stories.reduce(
    (n, st) => n + st.chapters.length,
    0,
  )} chapters, ${Math.round(
    stories.flatMap((st) => st.chapters).reduce((n, c) => n + c.minutes, 0) / 60,
  )} h)`,
)
console.log('  ─────────────────────────────────────────')

if (scoped.length) {
  console.log(`\n  ${scoped.length} versionScope override(s) — each one is debt:`)
  for (const v of scoped) console.log(`    · ${v.where} (${v.detail}) — ${v.note}`)
  if (scoped.length > 15) {
    console.log(
      '    Over 15 overrides: the family model has stopped fitting reality.\n' +
        '    Read invariant 16 in AGENTS.md before adding another.',
    )
  }
}

if (warnings.length) {
  console.log(`\n  ${warnings.length} warning(s):`)
  for (const w of warnings) console.log(`    · ${w}`)
}

if (problems.length) {
  console.error(`\n  ✗ ${problems.length} problem(s):`)
  for (const p of problems) console.error(`    · ${p}`)
  console.error('')
  process.exit(1)
}

console.log('\n  ✓ all content valid, no dangling references\n')
