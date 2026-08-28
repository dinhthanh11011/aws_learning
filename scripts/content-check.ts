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
  LessonSchema,
  lessons,
  lessonById,
  LESSON_CLUSTERS,
  lessonClusterById,
  cardById,
  type DiagramSpec,
  type LessonSection,
  OPTION_SET_OWED,
  DecisionTreeSchema,
  decisionTrees,
  LabSchema,
  labs,
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
  '/learn',
])

const stepIds = new Set<string>()

for (const p of phases) {
  for (const id of p.taskIds) {
    if (!taskById.has(id)) fail(`phase ${p.id}`, `references unknown task "${id}"`)
  }
  if (p.weekTo < p.weekFrom) fail(`phase ${p.id}`, 'weekTo is before weekFrom')

  for (const id of p.lessonIds) {
    if (!lessonById.has(id)) fail(`phase ${p.id}`, `lessonIds names unknown lesson "${id}"`)
  }

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
    for (const id of step.lessonIds) {
      if (!lessonById.has(id)) fail(where, `lessonIds names unknown lesson "${id}"`)
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

/* ── 3b. Option matrices ─────────────────────────────────────────────────── */

/**
 * The rules that keep an option matrix from becoming a second, competing copy
 * of the atlas. The duplication rule is the important one: two sources for one
 * fact is the drift invariant 2 exists to prevent, and it still counts when
 * both sides are derived — the learner drills the fact twice under two labels
 * and the atlas prints the row twice.
 */
for (const s of services) {
  const setIds = new Set<string>()
  for (const set of s.optionSets ?? []) {
    const where = `service ${s.slug} optionSet "${set.id}"`
    if (setIds.has(set.id)) fail(where, 'duplicate optionSet id on this service')
    setIds.add(set.id)

    if (s.tier === 3) {
      fail(where, 'sits on a tier-3 service, where it derives no cards — nobody would drill it')
    }

    const names = new Set<string>()
    const keyNumberLabels = new Set(s.keyNumbers.map((n) => n.label.toLowerCase()))
    for (const o of set.options) {
      const what = `${where} option "${o.name}"`
      if (names.has(o.name.toLowerCase())) fail(what, 'duplicate option name within the set')
      names.add(o.name.toLowerCase())

      if (o.pick.toLowerCase() === o.name.toLowerCase()) {
        fail(what, 'pick restates the name — it must be the requirement the exam describes')
      }
      if (o.slug && !serviceBySlug.get(o.slug) && !conceptBySlug.get(o.slug)) {
        fail(what, `slug "${o.slug}" matches no service or concept`)
      }
      for (const name of [o.name, o.abbr].filter(Boolean) as string[]) {
        if (keyNumberLabels.has(name.toLowerCase())) {
          fail(
            what,
            `"${name}" is also a keyNumbers label on this service — a fact must live in one ` +
              `place, so move the row rather than copying it`,
          )
        }
      }
    }
  }
}

/* ── 3c. Decision trees and labs ─────────────────────────────────────────── */

/**
 * Neither of these was schema-validated before. They happened to be valid,
 * which is not the same as being guarded — a short matrix row rendered as
 * silently missing table cells, and a dangling `next` would have been a dead
 * end in the UI with nothing to say so.
 */
for (const t of decisionTrees) {
  const where = `decision tree ${t.id}`
  const parsed = DecisionTreeSchema.safeParse(t)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      fail(where, `${issue.path.join('.')} ${issue.message}`)
    }
    continue
  }

  const nodeIds = new Set(t.nodes.map((n) => n.id))
  if (!nodeIds.has(t.rootId)) fail(where, `rootId "${t.rootId}" is not one of its nodes`)

  const answerSlugs = new Set<string>()
  for (const n of t.nodes) {
    if (n.kind === 'question') {
      for (const a of n.answers) {
        if (!nodeIds.has(a.next)) {
          fail(where, `node "${n.id}" answers to "${a.next}", which is not a node`)
        }
      }
    } else {
      answerSlugs.add(n.slug)
      if (!serviceBySlug.has(n.slug)) {
        fail(where, `answer "${n.id}" names service "${n.slug}", which does not exist`)
      }
    }
  }

  if (!t.matrix) continue
  const seen = new Set<string>()
  for (const row of t.matrix.rows) {
    if (!serviceBySlug.has(row.slug)) {
      fail(where, `matrix row "${row.slug}" is not a service`)
    }
    // A row for a service the tree never reaches is comparing something the
    // learner was not offered — the matrix is meant to summarise this tree.
    if (!answerSlugs.has(row.slug)) {
      fail(where, `matrix row "${row.slug}" is not an answer in this tree`)
    }
    if (seen.has(row.slug)) fail(where, `matrix has two rows for "${row.slug}"`)
    seen.add(row.slug)
    if (row.cells.length !== t.matrix.columns.length) {
      fail(
        where,
        `matrix row "${row.slug}" has ${row.cells.length} cells for ` +
          `${t.matrix.columns.length} columns`,
      )
    }
  }
}

for (const l of labs) {
  const parsed = LabSchema.safeParse(l)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      fail(`lab ${l.id}`, `${issue.path.join('.')} ${issue.message}`)
    }
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

/**
 * The checks that apply to any `DiagramSpec`, wherever it is declared. Lifted
 * out of the story validator when lessons started declaring specs of their own:
 * a second copy would have been a second place for these rules to drift, and
 * every failure here is silent in the UI — a bad id draws nothing rather than
 * drawing wrong.
 */
function checkDiagram(where: string, spec: DiagramSpec): void {
  const nodeIds = new Set(spec.nodes.map((n) => n.id))
  const edgeIds = new Set(spec.edges.map((e) => e.id))
  const groupIds = new Set(spec.groups.map((g) => g.id))

  if (nodeIds.size !== spec.nodes.length) fail(where, `diagram "${spec.id}" has duplicate node ids`)
  if (edgeIds.size !== spec.edges.length) fail(where, `diagram "${spec.id}" has duplicate edge ids`)
  if (groupIds.size !== spec.groups.length)
    fail(where, `diagram "${spec.id}" has duplicate group ids`)

  // A service-kind node must name a real service, or clicking it opens nothing.
  for (const n of spec.nodes) {
    if (n.kind !== 'service') continue
    if (!serviceSlugForNode(n.id, (slug) => serviceBySlug.has(slug))) {
      fail(where, `node "${n.id}" is kind service but resolves to no service slug`)
    }
  }

  for (const e of spec.edges) {
    if (!nodeIds.has(e.from)) fail(where, `edge "${e.id}" comes from unknown node "${e.from}"`)
    if (!nodeIds.has(e.to)) fail(where, `edge "${e.id}" goes to unknown node "${e.to}"`)
  }

  // A parent chain that does not terminate would hang the layout.
  for (const g of spec.groups) {
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
      cur = spec.groups.find((x) => x.id === cur)?.parent
    }
    for (const id of g.nodeIds) {
      if (!nodeIds.has(id)) fail(where, `group "${g.id}" names unknown node "${id}"`)
    }
  }

  // The real invariant behind the relaxed schema: a group must contain
  // something, directly or through a child. An empty one draws a labelled box
  // around nothing.
  for (const g of spec.groups) {
    const hasChild = spec.groups.some((x) => x.parent === g.id)
    if (!g.nodeIds.length && !hasChild) {
      fail(where, `group "${g.id}" holds no node and has no child group`)
    }
  }

  // A walkthrough step lighting an edge that does not exist advances and draws
  // nothing, which reads as a broken button rather than as bad data.
  spec.steps.forEach((step, i) => {
    for (const id of step.edgeIds) {
      if (!edgeIds.has(id)) {
        fail(where, `diagram "${spec.id}" step ${i + 1} lights unknown edge "${id}"`)
      }
    }
  })
  const lit = new Set(spec.steps.flatMap((step) => step.edgeIds))
  if (spec.steps.length) {
    for (const e of spec.edges) {
      // In a walkthrough every edge is part of the journey. One no step reaches
      // is invisible for the whole diagram.
      if (!lit.has(e.id)) fail(where, `diagram "${spec.id}" edge "${e.id}" is lit by no step`)
    }
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
  checkDiagram(where, arch)
  const nodeIds = new Set(arch.nodes.map((n) => n.id))
  const edgeIds = new Set(arch.edges.map((e) => e.id))
  const groupIds = new Set(arch.groups.map((g) => g.id))

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

/* ── 4d. Lessons ─────────────────────────────────────────────────────────── */

/**
 * A lesson restates the atlas in an order; it introduces nothing. So the checks
 * here are all about references resolving — an unresolvable `[[slug]]` renders as
 * bare text, an unknown `cardId` silently drills nothing, and a check with no
 * correct option can never be answered right.
 */
const lessonIdsSeen = new Set<string>()

for (const l of lessons) {
  const where = `lesson ${l.id}`
  const parsed = LessonSchema.safeParse(l)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      fail(where, `${issue.path.join('.')}: ${issue.message}`)
    }
    continue
  }

  if (lessonIdsSeen.has(l.id)) fail(where, 'duplicate lesson id')
  lessonIdsSeen.add(l.id)

  // The task statement is how a lesson reaches a domain, and therefore how it
  // reaches mastery. An unresolvable one silently belongs to nothing.
  if (!taskById.has(l.taskId)) fail(where, `references unknown task "${l.taskId}"`)
  else {
    // Same rule questions live under: a lesson that resolves on no current paper
    // would vanish from every cert silently rather than loudly.
    const papers = currentCerts.filter((c) => inScope(l, c.id))
    if (!papers.length) fail(where, 'is in scope for no current paper — it is dead content')
    else if (!papers.some((c) => resolveTaskId(l.taskId, c.id))) {
      fail(where, `taskId "${l.taskId}" resolves on none of the papers this lesson is in scope for`)
    }
  }

  for (const slug of l.serviceSlugs) {
    if (!serviceBySlug.has(slug)) fail(where, `serviceSlugs names unknown service "${slug}"`)
  }
  for (const id of l.cardIds) {
    if (!cardById.has(id)) fail(where, `cardIds names unknown card "${id}"`)
  }
  for (const id of l.requires) {
    if (!lessonById.has(id)) fail(where, `requires unknown lesson "${id}"`)
    if (id === l.id) fail(where, 'requires itself')
  }

  if (!lessonClusterById.has(l.cluster)) {
    fail(where, `cluster "${l.cluster}" is not declared in lesson-clusters.ts`)
  }

  // Every `[[slug]]` in every string a reader can see. Unresolvable ones render
  // as the bare slug — visible, but only to whoever happens to read that line.
  const mdStrings = (s: LessonSection): string[] => {
    switch (s.kind) {
      case 'prose':
        return [s.md]
      case 'callout':
        return [s.title, s.md]
      case 'compare':
        return s.rows.flatMap((r) => r.cells)
      case 'steps':
        return s.items.flatMap((it) => [it.title, it.md])
      case 'diagram':
        return s.spec.steps.flatMap((st) => [st.title, st.detail ?? ''])
      default:
        return []
    }
  }
  const prose = [
    l.subtitle,
    ...l.sections.flatMap(mdStrings),
    ...l.checks.flatMap((c) => [c.prompt, ...c.options.flatMap((o) => [o.text, o.why])]),
  ]
  for (const slug of prose.flatMap(refSlugs)) {
    if (!serviceBySlug.has(slug) && !conceptBySlug.has(slug)) {
      fail(where, `prose references "[[${slug}]]", which is neither a service nor a concept`)
    }
  }

  for (const s of l.sections) {
    if (s.kind === 'diagram') checkDiagram(where, s.spec)
    if (s.kind === 'services') {
      for (const slug of s.slugs) {
        if (!serviceBySlug.has(slug))
          fail(where, `services section names unknown service "${slug}"`)
      }
    }
    // A short row renders as silently missing table cells — the same bug the
    // decision-tree matrices had.
    if (s.kind === 'compare') {
      for (const r of s.rows) {
        if (r.cells.length !== s.columns.length) {
          fail(
            where,
            `compare row "${r.label}" has ${r.cells.length} cells for ${s.columns.length} columns`,
          )
        }
      }
    }
  }

  const checkIds = new Set<string>()
  for (const c of l.checks) {
    if (!c.id.startsWith(l.id)) fail(where, `check "${c.id}" should be prefixed with the lesson id`)
    if (checkIds.has(c.id)) fail(where, `duplicate check id "${c.id}"`)
    checkIds.add(c.id)
    const correct = c.options.filter((o) => o.correct).length
    if (correct !== 1) fail(where, `check "${c.id}" has ${correct} correct options, expected 1`)
  }

  // Reading is not evidence, so a lesson with no checks teaches nothing that
  // sticks. A warning rather than a failure: a purely diagrammatic lesson could
  // legitimately exist one day.
  if (!l.checks.length) warn(where, 'has no recall checks — reading alone leaves no trace')
}

/**
 * The registry array is the reading order and `LESSON_CLUSTERS` is the cluster
 * order; before this check they were two independent orderings with nothing
 * holding them together, so a lesson appended to the wrong run would have been
 * invisible until somebody read `/learn` and noticed the heading was wrong.
 *
 * Requiring contiguity rather than sorting on render keeps the array the single
 * source of order — a sort would quietly accept a corpus whose file no longer
 * reads in the order the learner gets.
 */
{
  const runs: string[] = []
  for (const l of lessons) {
    if (runs[runs.length - 1] !== l.cluster) runs.push(l.cluster)
  }
  const seen = new Set<string>()
  for (const id of runs) {
    if (seen.has(id)) {
      fail(
        `cluster ${id}`,
        'appears in more than one run in lesson-registry.ts — a cluster\u2019s lessons must be contiguous',
      )
    }
    seen.add(id)
  }

  const declared = LESSON_CLUSTERS.map((c) => c.id)
  const expected = declared.filter((id) => seen.has(id))
  const actual = runs.filter((id, i) => runs.indexOf(id) === i)
  if (expected.join() !== actual.join()) {
    fail(
      'lesson clusters',
      `lesson-registry.ts orders them ${actual.join(' → ')}, lesson-clusters.ts declares ${expected.join(' → ')}`,
    )
  }

  for (const c of LESSON_CLUSTERS) {
    // An empty cluster renders as a heading with nothing under it.
    if (!seen.has(c.id)) fail(`cluster ${c.id}`, 'is declared but no lesson is in it')
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
  // Option sets count towards depth. A service whose per-option rows moved into
  // a matrix did not get thinner — the same facts are there, in a shape that
  // drills better — and a check that says otherwise punishes the migration it
  // should be neutral about.
  const quantified =
    s.keyNumbers.length + (s.optionSets ?? []).reduce((n, set) => n + set.options.length, 0)
  if (s.tier === 1 && quantified < 3) {
    warn('depth', `core service "${s.slug}" has only ${quantified} key numbers and options`)
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
 * Answer-length bias. Options are shuffled before display, so position is no
 * longer a tell — but length still is: an option that is visibly the longest is
 * pickable without reading the stem, and the learner who notices that stops
 * practising the discrimination the question was written for. Counted in one
 * aggregated line, because on a corpus authored correct-first-and-fullest this
 * starts high and comes down question by question. Multi-response questions are
 * excluded: with two or more correct options the signal means nothing.
 *
 * Reference point: pure chance puts the longest option on the answer about
 * 1-in-n of the time, so a four-option bank should sit near 25%.
 */
const singles = questions.filter((q) => q.type === 'single')
const longestIsAnswer = singles.filter((q) => {
  const lengths = q.options.map((o) => o.text.length)
  const max = Math.max(...lengths)
  return q.options.find((o) => o.correct)!.text.length === max
})
if (singles.length) {
  const pct = Math.round((longestIsAnswer.length / singles.length) * 100)
  const chance = Math.round(
    (singles.reduce((n, q) => n + 1 / q.options.length, 0) / singles.length) * 100,
  )
  if (pct > chance + 10) {
    warn(
      'answer-length',
      `the correct option is the longest in ${longestIsAnswer.length} of ${singles.length} ` +
        `single-answer questions (${pct}%, chance is about ${chance}%) — length is a tell ` +
        `shuffling cannot remove; lengthen a distractor or tighten the answer`,
    )
  }
}

/**
 * Option-matrix coverage. One aggregated line, for the same reason as
 * `whyItExists` above: fifteen separate warnings would bury the depth and
 * atlas-gap signals that are actionable today. The list is curated rather than
 * inferred — see `src/content/option-coverage.ts` for why.
 */
const missingOptions = OPTION_SET_OWED.filter(
  (slug) => !serviceBySlug.get(slug)?.optionSets?.length,
)
if (missingOptions.length) {
  warn(
    'options',
    `${missingOptions.length} of ${OPTION_SET_OWED.length} services the exam asks ` +
      `"which option" about have no optionSets: ` +
      `${missingOptions.slice(0, 10).join(', ')}${missingOptions.length > 10 ? ', …' : ''}`,
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
    // Option matrices are atlas content too. Omitting them would make this
    // audit lie in both directions: every figure moved out of keyNumbers would
    // reappear as a phantom gap, and every figure authored in a matrix would
    // count as taught only in a question (invariant 10).
    ...(s.optionSets ?? []).flatMap((set) => [
      set.label,
      set.note ?? '',
      ...set.options.flatMap((o) => [o.name, o.abbr ?? '', o.pick, o.signal ?? '', o.gotcha ?? '']),
    ]),
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
console.log(`  options         ${stats.options}  (${stats.optionSets} sets)`)
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
console.log(
  `  lessons         ${lessons.length}  (${lessons.reduce(
    (n, l) => n + l.sections.length,
    0,
  )} sections, ${lessons.reduce((n, l) => n + l.checks.length, 0)} checks, ${lessons.reduce(
    (n, l) => n + l.minutes,
    0,
  )} min)`,
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
