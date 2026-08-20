import { z } from 'zod'

/* ═══════════════════════════════════════════════════════════════════════════
   The content contract.

   Everything the app teaches is data validated by these schemas, and
   `npm run content:check` fails the build on a bad shape or a dangling id.
   The point: a typo in a question's taskId is a build error, not a blank
   screen at 11pm the night before your exam.
   ═══════════════════════════════════════════════════════════════════════════ */

export const CERT_IDS = ['SAA-C03', 'DVA-C02'] as const
export const CertIdSchema = z.enum(CERT_IDS)
export type CertId = (typeof CERT_IDS)[number]

/* ── Service categories ──────────────────────────────────────────────────── */

export const CATEGORY_IDS = [
  'compute',
  'containers',
  'serverless',
  'storage',
  'database',
  'network',
  'security',
  'analytics',
  'appint',
  'mgmt',
  'devtools',
  'ml',
  'migration',
  'cost',
  'frontend',
  'media',
] as const
export const CategoryIdSchema = z.enum(CATEGORY_IDS)
export type CategoryId = (typeof CATEGORY_IDS)[number]

export const CATEGORIES: Record<
  CategoryId,
  { id: CategoryId; label: string; short: string; token: string; blurb: string }
> = {
  compute: {
    id: 'compute',
    label: 'Compute',
    short: 'Compute',
    token: 'var(--cat-compute)',
    blurb: 'Where your code runs.',
  },
  containers: {
    id: 'containers',
    label: 'Containers',
    short: 'Containers',
    token: 'var(--cat-containers)',
    blurb: 'Packaged workloads and their orchestrators.',
  },
  serverless: {
    id: 'serverless',
    label: 'Serverless',
    short: 'Serverless',
    token: 'var(--cat-serverless)',
    blurb: 'No servers to manage, pay per invocation.',
  },
  storage: {
    id: 'storage',
    label: 'Storage',
    short: 'Storage',
    token: 'var(--cat-storage)',
    blurb: 'Objects, blocks and file systems.',
  },
  database: {
    id: 'database',
    label: 'Database',
    short: 'Database',
    token: 'var(--cat-database)',
    blurb: 'Relational, key-value, in-memory, graph.',
  },
  network: {
    id: 'network',
    label: 'Networking & Content Delivery',
    short: 'Network',
    token: 'var(--cat-network)',
    blurb: 'How packets find your workload.',
  },
  security: {
    id: 'security',
    label: 'Security, Identity & Compliance',
    short: 'Security',
    token: 'var(--cat-security)',
    blurb: 'Who may do what, to which resource.',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    short: 'Analytics',
    token: 'var(--cat-analytics)',
    blurb: 'Query, stream and warehouse your data.',
  },
  appint: {
    id: 'appint',
    label: 'Application Integration',
    short: 'App Int',
    token: 'var(--cat-appint)',
    blurb: 'Decoupling: queues, topics, buses, workflows.',
  },
  mgmt: {
    id: 'mgmt',
    label: 'Management & Governance',
    short: 'Mgmt',
    token: 'var(--cat-mgmt)',
    blurb: 'Observe, audit, configure, constrain.',
  },
  devtools: {
    id: 'devtools',
    label: 'Developer Tools',
    short: 'Dev Tools',
    token: 'var(--cat-devtools)',
    blurb: 'Build, test, trace, ship.',
  },
  ml: {
    id: 'ml',
    label: 'Machine Learning',
    short: 'ML / AI',
    token: 'var(--cat-ml)',
    blurb: 'Managed AI you call as an API.',
  },
  migration: {
    id: 'migration',
    label: 'Migration & Transfer',
    short: 'Migration',
    token: 'var(--cat-migration)',
    blurb: 'Getting data and servers into AWS.',
  },
  cost: {
    id: 'cost',
    label: 'Cloud Financial Management',
    short: 'Cost',
    token: 'var(--cat-cost)',
    blurb: 'Seeing, forecasting and cutting the bill.',
  },
  frontend: {
    id: 'frontend',
    label: 'Front-End Web & Mobile',
    short: 'Front-End',
    token: 'var(--cat-frontend)',
    blurb: 'The edge your users actually touch.',
  },
  media: {
    id: 'media',
    label: 'Media Services',
    short: 'Media',
    token: 'var(--cat-media)',
    blurb: 'Transcode and stream audio/video.',
  },
}

/* ── Tier: how deeply you need to know a service ─────────────────────────── */

/**
 * 1 — Know cold. Appears in scenario questions as the answer or the trap.
 * 2 — Know when to reach for it, and its one differentiator.
 * 3 — Recognise the name and its single job, so you can eliminate it.
 *
 * This is what stops ~135 services from being a flat, hopeless list.
 */
export const TierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export type Tier = z.infer<typeof TierSchema>

export const TIER_META: Record<Tier, { label: string; blurb: string }> = {
  1: { label: 'Core', blurb: 'Know cold — this is an answer or a trap in real questions.' },
  2: { label: 'Working', blurb: 'Know when to reach for it and what makes it different.' },
  3: { label: 'Recognise', blurb: 'Know the name and its one job, enough to eliminate it.' },
}

/* ── Services ────────────────────────────────────────────────────────────── */

export const KeyNumberSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  note: z.string().optional(),
  /** AWS changes this one often — the UI shows a "verify" nudge. */
  volatile: z.boolean().optional(),
})
export type KeyNumber = z.infer<typeof KeyNumberSchema>

export const ServiceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  /** Short form used on dense canvases: "S3", "DDB", "ALB". */
  abbr: z.string().optional(),
  category: CategoryIdSchema,
  certs: z.array(CertIdSchema).min(1),
  tier: TierSchema,
  /** One sentence. Shown on the canvas and in search results. */
  oneLiner: z.string().min(1),
  whatItIs: z.string().min(1),
  whenToUse: z.array(z.string().min(1)),
  whenNotToUse: z.array(z.string().min(1)),
  keyNumbers: z.array(KeyNumberSchema).default([]),
  examTraps: z.array(z.string().min(1)).default([]),
  confusedWith: z.array(z.object({ slug: z.string(), difference: z.string().min(1) })).default([]),
  pricing: z.string().optional(),
  docsUrl: z.string().url(),
  related: z.array(z.string()).default([]),
})
export type Service = z.infer<typeof ServiceSchema>

/* ── Exam structure: cert → domain → task statement ──────────────────────── */

export const TaskSchema = z.object({
  /** e.g. "saa-1.1" */
  id: z.string().regex(/^[a-z]+-\d+\.\d+$/),
  domainId: z.string().min(1),
  /** e.g. "1.1" */
  code: z.string().regex(/^\d+\.\d+$/),
  title: z.string().min(1),
  /** Verbatim from the AWS exam guide. */
  knowledge: z.array(z.string().min(1)),
  skills: z.array(z.string().min(1)),
  serviceSlugs: z.array(z.string()).default([]),
})
export type Task = z.infer<typeof TaskSchema>

export const DomainSchema = z.object({
  /** e.g. "saa-d1" */
  id: z.string().min(1),
  certId: CertIdSchema,
  index: z.number().int().positive(),
  title: z.string().min(1),
  /** Percentage of scored content, 0–100. Drives exam sampling and roadmap size. */
  weight: z.number().min(1).max(100),
  /** Our framing of why this domain exists — not AWS's words. */
  blurb: z.string().min(1),
  tasks: z.array(TaskSchema).min(1),
})
export type Domain = z.infer<typeof DomainSchema>

export const CertSchema = z.object({
  id: CertIdSchema,
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  role: z.string().min(1),
  minutes: z.number().int().positive(),
  questionCount: z.number().int().positive(),
  scoredCount: z.number().int().positive(),
  passScore: z.number().int().positive(),
  scaleMin: z.number().int(),
  scaleMax: z.number().int(),
  guideUrl: z.string().url(),
  blurb: z.string().min(1),
  domains: z.array(DomainSchema).min(1),
})
export type Cert = z.infer<typeof CertSchema>

/* ── Questions ───────────────────────────────────────────────────────────── */

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    certs: z.array(CertIdSchema).min(1),
    /** Must resolve to a real Task id; checked by content:check. */
    taskId: z.string().min(1),
    type: z.enum(['single', 'multi']),
    stem: z.string().min(1),
    options: z
      .array(
        z.object({
          id: z.string().regex(/^[A-F]$/),
          text: z.string().min(1),
          correct: z.boolean(),
          /** Why this option is right, or the specific misconception it targets. */
          why: z.string().min(1),
        }),
      )
      .min(3),
    /** The takeaway — the rule to remember, not a restatement of the answer. */
    explanation: z.string().min(1),
    serviceSlugs: z.array(z.string()).default([]),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    source: z.string().url().optional(),
  })
  .refine((q) => q.options.some((o) => o.correct), {
    message: 'question has no correct option',
  })
  .refine(
    (q) =>
      q.type === 'single'
        ? q.options.filter((o) => o.correct).length === 1
        : q.options.filter((o) => o.correct).length >= 2,
    { message: 'correct-option count does not match question type' },
  )
  .refine((q) => (q.type === 'multi' ? q.options.length >= 5 : true), {
    message: 'multi-response questions must offer at least 5 options (AWS format)',
  })
export type Question = z.infer<typeof QuestionSchema>

/* ── Spaced-repetition cards ─────────────────────────────────────────────── */

export const CARD_KINDS = ['fact', 'number', 'whichService', 'trap', 'contrast'] as const
export const CardKindSchema = z.enum(CARD_KINDS)
export type CardKind = (typeof CARD_KINDS)[number]

export const CARD_KIND_META: Record<CardKind, { label: string; hint: string }> = {
  fact: { label: 'Fact', hint: 'A property you must be able to state.' },
  number: { label: 'Number', hint: 'A limit, quota or size you must recall exactly.' },
  whichService: {
    label: 'Which service?',
    hint: 'A requirement — name the service that meets it.',
  },
  trap: { label: 'Trap', hint: 'The plausible-but-wrong answer, and why.' },
  contrast: { label: 'Contrast', hint: 'Two services that get confused. Separate them.' },
}

export const CardSchema = z.object({
  id: z.string().min(1),
  kind: CardKindSchema,
  front: z.string().min(1),
  back: z.string().min(1),
  /** Extra line shown after flipping — the "why it matters". */
  extra: z.string().optional(),
  certs: z.array(CertIdSchema).min(1),
  taskId: z.string().optional(),
  serviceSlugs: z.array(z.string()).default([]),
})
export type Card = z.infer<typeof CardSchema>

/* ── Diagrams: declarative, animatable, theme-aware ──────────────────────── */

export const DIAGRAM_NODE_KINDS = ['service', 'user', 'internet', 'onprem', 'data', 'note'] as const
export const DiagramNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sub: z.string().optional(),
  kind: z.enum(DIAGRAM_NODE_KINDS).default('service'),
  /** Tints the node with its AWS category colour. */
  category: CategoryIdSchema.optional(),
  /** Grid units, not pixels — the renderer scales to fit. */
  x: z.number(),
  y: z.number(),
  w: z.number().default(2),
  h: z.number().default(1),
})
export type DiagramNode = z.infer<typeof DiagramNodeSchema>

export const DiagramEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
  dashed: z.boolean().optional(),
  tone: z.enum(['default', 'ok', 'bad', 'warn', 'info']).default('default'),
  /** Draw as an elbow rather than a straight line. */
  elbow: z.boolean().optional(),
  bidirectional: z.boolean().optional(),
})
export type DiagramEdge = z.infer<typeof DiagramEdgeSchema>

export const DIAGRAM_GROUP_KINDS = [
  'region',
  'vpc',
  'az',
  'subnet-public',
  'subnet-private',
  'account',
  'edge',
  'plain',
] as const
export const DiagramGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(DIAGRAM_GROUP_KINDS),
  nodeIds: z.array(z.string()).min(1),
  /** Nest inside another group (a subnet inside an AZ inside a VPC). */
  parent: z.string().optional(),
})
export type DiagramGroup = z.infer<typeof DiagramGroupSchema>

export const DiagramStepSchema = z.object({
  /** Edges lit up at this step, in order of travel. */
  edgeIds: z.array(z.string()).min(1),
  title: z.string().min(1),
  detail: z.string().optional(),
  tone: z.enum(['default', 'ok', 'bad', 'warn', 'info']).default('default'),
})
export type DiagramStep = z.infer<typeof DiagramStepSchema>

export const DiagramSpecSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  caption: z.string().optional(),
  cols: z.number().int().positive().default(12),
  rows: z.number().int().positive().default(7),
  nodes: z.array(DiagramNodeSchema).min(1),
  edges: z.array(DiagramEdgeSchema).default([]),
  groups: z.array(DiagramGroupSchema).default([]),
  /** If present, the diagram becomes a play/step-through walkthrough. */
  steps: z.array(DiagramStepSchema).default([]),
})
export type DiagramSpec = z.infer<typeof DiagramSpecSchema>

/* ── Lessons ─────────────────────────────────────────────────────────────── */

/**
 * Lesson bodies are typed sections rather than free MDX. That keeps the
 * animated diagrams, comparison tables and inline checks first-class and
 * schema-validated, and means one renderer handles every lesson.
 *
 * `md` fields accept a deliberately tiny inline syntax: **bold**, `code`,
 * *italic*, [text](url) and — the useful one — [[service-slug]], which links
 * to that service's card.
 */
export const LessonSectionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('prose'), md: z.string().min(1) }),
  z.object({
    kind: z.literal('callout'),
    tone: z.enum(['info', 'warn', 'trap', 'ok', 'money']),
    title: z.string().min(1),
    md: z.string().min(1),
  }),
  z.object({ kind: z.literal('diagram'), spec: DiagramSpecSchema }),
  z.object({
    kind: z.literal('compare'),
    title: z.string().min(1),
    /** First column is the row label, so `columns` excludes it. */
    columns: z.array(z.string().min(1)).min(2),
    rows: z.array(z.object({ label: z.string().min(1), cells: z.array(z.string()) })).min(1),
  }),
  z.object({
    kind: z.literal('numbers'),
    title: z.string().min(1),
    items: z.array(KeyNumberSchema).min(1),
  }),
  z.object({
    kind: z.literal('steps'),
    title: z.string().min(1),
    items: z.array(z.object({ title: z.string().min(1), md: z.string().min(1) })).min(2),
  }),
  z.object({
    kind: z.literal('code'),
    lang: z.string().min(1),
    caption: z.string().optional(),
    code: z.string().min(1),
  }),
  z.object({
    kind: z.literal('heading'),
    text: z.string().min(1),
  }),
  z.object({
    kind: z.literal('services'),
    title: z.string().min(1),
    slugs: z.array(z.string()).min(1),
  }),
])
export type LessonSection = z.infer<typeof LessonSectionSchema>

/** A fast, low-stakes recall check inside a lesson. Not exam-format. */
export const CheckSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z
    .array(z.object({ text: z.string().min(1), correct: z.boolean(), why: z.string().min(1) }))
    .min(2),
})
export type Check = z.infer<typeof CheckSchema>

export const LessonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  certs: z.array(CertIdSchema).min(1),
  taskId: z.string().min(1),
  title: z.string().min(1),
  /** The hook: why this lesson earns your next 8 minutes. */
  subtitle: z.string().min(1),
  minutes: z.number().int().positive(),
  tier: TierSchema,
  serviceSlugs: z.array(z.string()).default([]),
  sections: z.array(LessonSectionSchema).min(1),
  checks: z.array(CheckSchema).default([]),
  cardIds: z.array(z.string()).default([]),
  /** Lessons that should come first. Drives roadmap edges. */
  requires: z.array(z.string()).default([]),
})
export type Lesson = z.infer<typeof LessonSchema>

/* ── Decision engines ────────────────────────────────────────────────────── */

export const DecisionNodeSchema = z.union([
  z.object({
    id: z.string().min(1),
    kind: z.literal('question'),
    prompt: z.string().min(1),
    hint: z.string().optional(),
    answers: z.array(z.object({ label: z.string().min(1), next: z.string().min(1) })).min(2),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('answer'),
    slug: z.string().min(1),
    headline: z.string().min(1),
    because: z.string().min(1),
    watchOut: z.string().optional(),
  }),
])
export type DecisionNode = z.infer<typeof DecisionNodeSchema>

export const DecisionTreeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  question: z.string().min(1),
  certs: z.array(CertIdSchema).min(1),
  category: CategoryIdSchema,
  rootId: z.string().min(1),
  nodes: z.array(DecisionNodeSchema).min(2),
  /** Side-by-side matrix shown beneath the tree. */
  matrix: z
    .object({
      columns: z.array(z.string().min(1)).min(2),
      rows: z.array(z.object({ slug: z.string(), cells: z.array(z.string()) })).min(2),
    })
    .optional(),
})
export type DecisionTree = z.infer<typeof DecisionTreeSchema>

/* ── Labs ────────────────────────────────────────────────────────────────── */

export const LabSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  tagline: z.string().min(1),
  certs: z.array(CertIdSchema).min(1),
  taskIds: z.array(z.string()).min(1),
  minutes: z.number().int().positive(),
  category: CategoryIdSchema,
  objective: z.string().min(1),
  teaches: z.array(z.string().min(1)).min(1),
})
export type Lab = z.infer<typeof LabSchema>

/* ═══════════════════════════════════════════════════════════════════════════
   Roadmap phases — the study plan, not the exam outline.

   The exam guide tells you *what* is examined; it says nothing about the order
   to learn it in. These phases are the learning path: foundations first, then
   the ~15 services that carry most of both papers, then building, then drilling.
   ═══════════════════════════════════════════════════════════════════════════ */

export const PhaseSchema = z.object({
  id: z.string().regex(/^phase-\d$/),
  index: z.number().int().min(0),
  title: z.string().min(1),
  /** The one-line reason this phase exists. */
  purpose: z.string().min(1),
  weekFrom: z.number().int().positive(),
  weekTo: z.number().int().positive(),
  hours: z.number().int().positive(),
  certs: z.array(CertIdSchema).min(1),
  /** What must be true to leave this phase. */
  exitCriteria: z.array(z.string().min(1)).min(1),
  lessonIds: z.array(z.string()).default([]),
  labIds: z.array(z.string()).default([]),
  /** Task statements this phase covers, for progress roll-up. */
  taskIds: z.array(z.string()).default([]),
})
export type Phase = z.infer<typeof PhaseSchema>

/* ── Keyword decoder ─────────────────────────────────────────────────────────
   Exam questions are requirements in costume. Recognising the costume
   eliminates two or three options before you have finished reading. This is a
   drillable index of the phrases that give the answer away.
   ─────────────────────────────────────────────────────────────────────────── */

export const TriggerSchema = z.object({
  id: z.string().min(1),
  /** The phrase as it appears in a question. */
  phrase: z.string().min(1),
  /** What it is really asking for. */
  means: z.string().min(1),
  /** Services to reach for. */
  slugs: z.array(z.string()).min(1),
  /** Plausible answers this phrase is designed to make you pick wrongly. */
  notThis: z.array(z.object({ slug: z.string(), why: z.string().min(1) })).default([]),
  certs: z.array(CertIdSchema).min(1),
  domainIds: z.array(z.string()).default([]),
})
export type Trigger = z.infer<typeof TriggerSchema>

/* ── Idle-cost facts ────────────────────────────────────────────────────────
   The single most expensive mistake a learner makes is leaving something
   running. These drive the cost lab and the teardown checklist.
   ─────────────────────────────────────────────────────────────────────────── */

export const IdleCostSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  /** Approximate USD per month if left running and unused. */
  usdPerMonth: z.number().min(0),
  note: z.string().min(1),
  teardown: z.string().min(1),
})
export type IdleCost = z.infer<typeof IdleCostSchema>
