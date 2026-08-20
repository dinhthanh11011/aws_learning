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
  PhaseSchema,
  StudyStepSchema,
  TriggerSchema,
  IdleCostSchema,
  certs,
  services,
  serviceBySlug,
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
  CERT_IDS,
} from '../src/content'

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
  '/services',
  '/settings',
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

for (const certId of CERT_IDS) {
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
console.log('  ─────────────────────────────────────────')

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
