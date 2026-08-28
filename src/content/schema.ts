import { z } from 'zod'

/* ═══════════════════════════════════════════════════════════════════════════
   The content contract.

   Everything the app teaches is data validated by these schemas, and
   `npm run content:check` fails the build on a bad shape or a dangling id.
   The point: a typo in a question's taskId is a build error, not a blank
   screen at 11pm the night before your exam.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Cert families and cert versions ─────────────────────────────────────
   A *family* is the exam ("Solutions Architect – Associate"); a *version* is
   the paper currently set for it (SAA-C03, then SAA-C04). Content tags the
   family, never the version, because a fact about S3 does not change when AWS
   revises the guide. That is what makes a version bump one new file in
   ./certs/ rather than a retag of every service, concept and question.

   When a genuine difference exists — a service dropped from a new version's
   scope — the item carries a `versionScope` override with a stated reason, and
   content:check prints every one of them on every run so the list cannot grow
   unseen. See invariant 16 in AGENTS.md.
   ──────────────────────────────────────────────────────────────────────── */

export const CERT_FAMILY_IDS = ['saa', 'dva'] as const
export const CertFamilySchema = z.enum(CERT_FAMILY_IDS)
export type CertFamily = (typeof CERT_FAMILY_IDS)[number]

export const CERT_FAMILIES: Record<CertFamily, { id: CertFamily; short: string; label: string }> = {
  saa: { id: 'saa', short: 'SAA', label: 'Solutions Architect – Associate' },
  dva: { id: 'dva', short: 'DVA', label: 'Developer – Associate' },
}

/**
 * Exam versions. Nothing in the corpus references these — only ./certs/*, the
 * cert registry, and the two persisted history columns that record which paper
 * a learner actually sat. Adding a version is one entry here plus one file.
 */
export const CERT_IDS = ['SAA-C03', 'DVA-C02'] as const
export const CertIdSchema = z.enum(CERT_IDS)
export type CertId = (typeof CERT_IDS)[number]

export const CERT_STATUSES = ['upcoming', 'current', 'retired'] as const
export const CertStatusSchema = z.enum(CERT_STATUSES)
export type CertStatus = (typeof CERT_STATUSES)[number]

/**
 * The escape hatch for content that really is version-specific. `note` is
 * required because an override is debt, and debt with no stated reason never
 * gets paid off — content:check audits these rather than letting them
 * accumulate quietly.
 */
export const VersionScopeSchema = z
  .object({
    /** In scope for *only* these versions. */
    onlyIn: z.array(CertIdSchema).min(1).optional(),
    /** In scope for the whole family except these versions. */
    notIn: z.array(CertIdSchema).min(1).optional(),
    /** What in the published exam guide makes this version-specific. */
    note: z.string().min(1),
  })
  .refine((s) => Boolean(s.onlyIn) !== Boolean(s.notIn), {
    message: 'versionScope sets exactly one of onlyIn / notIn',
  })
export type VersionScope = z.infer<typeof VersionScopeSchema>

/**
 * The shape every cert-scoped content kind shares. `inScope()` in the cert
 * registry takes this rather than a union of nine content types, so adding a
 * tenth kind needs no change there.
 */
export interface Scoped {
  families: CertFamily[]
  versionScope?: VersionScope
}

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

/**
 * A mutually exclusive choice *within* one service: an S3 storage class, an EBS
 * volume type, an EC2 purchase option, a Route 53 routing policy.
 *
 * These deserve their own shape rather than more `keyNumbers` rows for one
 * reason: the exam does not ask what Standard-IA costs, it describes an access
 * pattern and makes you name the class. `pick` is that requirement, in the
 * wording the exam uses, and it is required precisely so `cards.ts` can turn it
 * into the front of a card. A flat label/value pair cannot say which half is the
 * requirement, which is why the `compare` lesson section — free-form cells —
 * derives nothing and is invisible to the SRS.
 *
 * The migration rule, which `content:check` enforces: a `keyNumbers` row whose
 * label is the *name of one option* moves here. A row that is a property of the
 * whole service stays. S3 keeps `Durability` and `Max object size`; its
 * per-class minimums move. Never both — two sources for one fact is the drift
 * invariant 2 exists to prevent, even when both sides are derived.
 */
export const ServiceOptionSchema = z.object({
  /** Verbatim AWS wording: 'S3 Intelligent-Tiering', 'gp3', 'Dedicated Hosts'. */
  name: z.string().min(1),
  abbr: z.string().optional(),
  /** Set when the option is also a corpus entry in its own right (spot, s3-glacier). */
  slug: z.string().optional(),
  /** The requirement, as the exam phrases it: 'access pattern is unknown or changing'. */
  pick: z.string().min(1),
  /** The cost or limit tell. Deliberately derives no `number` card — those come from keyNumbers. */
  signal: z.string().optional(),
  gotcha: z.string().optional(),
  /** gp2, CLB: still an option the exam offers, never the right answer. Never dimmed with opacity. */
  legacy: z.boolean().optional(),
  volatile: z.boolean().optional(),
})
export type ServiceOption = z.infer<typeof ServiceOptionSchema>

/**
 * An array of sets rather than one set per service, because DynamoDB has
 * capacity modes *and* index types, and EFS has storage classes *and*
 * throughput modes. One set would push the second back into `keyNumbers`, which
 * is the disease being treated.
 *
 * Note there are no author-supplied columns: the table is derived, and its axes
 * are always Option / When to pick / Signal / Gotcha. Uniform axes across every
 * service is the point — per-service axes are how `keyNumbers` drifted into
 * meaning something different on every entry.
 */
export const ServiceOptionSetSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** 'Storage classes', 'Volume types'. */
  label: z.string().min(1),
  /** The card-front stem, lower case and without a question mark: 'which storage class'. */
  prompt: z.string().min(1),
  note: z.string().optional(),
  options: z.array(ServiceOptionSchema).min(2),
})
export type ServiceOptionSet = z.infer<typeof ServiceOptionSetSchema>

export const ServiceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  /** Short form used on dense canvases: "S3", "DDB", "ALB". */
  abbr: z.string().optional(),
  category: CategoryIdSchema,
  families: z.array(CertFamilySchema).min(1),
  versionScope: VersionScopeSchema.optional(),
  tier: TierSchema,
  /** One sentence. Shown on the canvas and in search results. */
  oneLiner: z.string().min(1),
  whatItIs: z.string().min(1),
  /**
   * The pain that existed before this did. Not what it is (`whatItIs`) and not
   * when to reach for it (`whenToUse`) — what someone was doing instead, and
   * why that hurt. A learner who cannot say what a service replaces is
   * memorising a name, and on a scenario question a name eliminates nothing.
   */
  whyItExists: z.string().min(1).optional(),
  whenToUse: z.array(z.string().min(1)),
  whenNotToUse: z.array(z.string().min(1)),
  keyNumbers: z.array(KeyNumberSchema).default([]),
  /**
   * Mutually exclusive choices within this service. Not on `ConceptSchema`, and
   * deliberately so: a product option is a vendor artefact, and a primitive has
   * none. Adding it there later is this field plus a card loop.
   */
  optionSets: z.array(ServiceOptionSetSchema).optional(),
  examTraps: z.array(z.string().min(1)).default([]),
  confusedWith: z.array(z.object({ slug: z.string(), difference: z.string().min(1) })).default([]),
  pricing: z.string().optional(),
  docsUrl: z.string().url(),
  related: z.array(z.string()).default([]),
})
export type Service = z.infer<typeof ServiceSchema>

/* ── Concepts: the primitives the exam assumes you already know ──────────── */

/**
 * A concept is a thing the exam tests that is *not* an AWS service: CIDR,
 * subnet, RTO, idempotency, the shape of an ARN.
 *
 * These needed their own corpus rather than a fourth service tier. The atlas is
 * keyed by service slug, so a primitive had nowhere to live — "CIDR" appeared in
 * ten places in the network atlas and was defined in none of them, and because
 * `cards.ts` derives from service entries, a primitive with no entry was drilled
 * by exactly zero cards. Vocabulary you have only ever seen used is recognised,
 * not recalled, and the exam tests recall.
 *
 * Deliberately *not* a `Service` with `tier: 4`: a subnet has no pricing page,
 * no idle cost and no console, and widening `Service` to cover it would make
 * every tier badge, category filter and atlas grouping in the app lie a little.
 */
export const CONCEPT_GROUPS = [
  'networking',
  'resilience',
  'data',
  'identity',
  'delivery',
  'operations',
] as const
export const ConceptGroupSchema = z.enum(CONCEPT_GROUPS)
export type ConceptGroup = (typeof CONCEPT_GROUPS)[number]

/**
 * Groups borrow the service categories' hues on purpose — a CIDR card and the
 * VPC card reading as the same colour family is true, not a coincidence.
 */
export const CONCEPT_GROUP_META: Record<
  ConceptGroup,
  { id: ConceptGroup; label: string; token: string; blurb: string }
> = {
  networking: {
    id: 'networking',
    label: 'Networking',
    token: 'var(--cat-network)',
    blurb: 'Address space, placement and where a packet is allowed to go.',
  },
  resilience: {
    id: 'resilience',
    label: 'Resilience',
    token: 'var(--cat-compute)',
    blurb: 'What survives a failure, how much is lost and how long it takes.',
  },
  data: {
    id: 'data',
    label: 'Data',
    token: 'var(--cat-database)',
    blurb: 'Consistency, durability and the cost of getting a key wrong.',
  },
  identity: {
    id: 'identity',
    label: 'Identity',
    token: 'var(--cat-security)',
    blurb: 'Who is asking, what they may do and how that is decided.',
  },
  delivery: {
    id: 'delivery',
    label: 'Delivery',
    token: 'var(--cat-frontend)',
    blurb: 'Getting a change or a response to the other end safely.',
  },
  operations: {
    id: 'operations',
    label: 'Operations',
    token: 'var(--cat-devtools)',
    blurb: 'The framing AWS grades your answers against.',
  },
}

export const ConceptSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  /** The term as a question would print it: "CIDR block", "Recovery Point Objective". */
  term: z.string().min(1),
  /** Short form for chips and dense prose: "CIDR", "RPO". */
  abbr: z.string().optional(),
  /**
   * Other names the same idea travels under, so search finds it either way.
   * Optional rather than defaulted: most concepts have one name, and forcing
   * `aka: []` onto thirty entries is noise in a file meant to be read.
   */
  aka: z.array(z.string().min(1)).optional(),
  group: ConceptGroupSchema,
  families: z.array(CertFamilySchema).min(1),
  versionScope: VersionScopeSchema.optional(),
  oneLiner: z.string().min(1),
  whatItIs: z.string().min(1),
  /**
   * The one sentence that makes it click, stated as a rule rather than a
   * definition — "a subnet is public only because its route table sends
   * 0.0.0.0/0 to an internet gateway". This is the card the learner drills.
   */
  keyIdea: z.string().min(1),
  /**
   * Why the idea had to be invented at all — the constraint that forces it.
   * A Region exists because nobody can build one data centre for the world;
   * knowing that is what stops "Region" being a word the learner nods at.
   */
  whyItExists: z.string().min(1).optional(),
  /** How the exam phrases a question that is really about this concept. */
  onTheExam: z.array(z.string().min(1)).default([]),
  keyNumbers: z.array(KeyNumberSchema).default([]),
  examTraps: z.array(z.string().min(1)).default([]),
  /** Other *concepts* this one gets mixed up with. */
  confusedWith: z.array(z.object({ slug: z.string(), difference: z.string().min(1) })).default([]),
  /** Services where this concept is the thing being configured. */
  serviceSlugs: z.array(z.string()).default([]),
  /** Other concept slugs — read these together. */
  related: z.array(z.string()).default([]),
  docsUrl: z.string().url(),
})
export type Concept = z.infer<typeof ConceptSchema>

/* ── Exam structure: cert → domain → task statement ──────────────────────── */

export const TaskSchema = z.object({
  /** e.g. "saa-1.1", or "saa-c04-1.2" once a family has more than one version. */
  id: z.string().regex(/^[a-z]+(-c\d{2})?-\d+\.\d+$/),
  domainId: z.string().min(1),
  /** e.g. "1.1" */
  code: z.string().regex(/^\d+\.\d+$/),
  title: z.string().min(1),
  /** Verbatim from the AWS exam guide. */
  knowledge: z.array(z.string().min(1)),
  skills: z.array(z.string().min(1)),
  serviceSlugs: z.array(z.string()).default([]),
  /**
   * Task ids from earlier versions of this family that this task absorbs.
   *
   * A new exam version renumbers its domains, which would orphan every
   * question tagged with an old task id. Declaring the merge here — on the new
   * task, written by whoever is already reading both guides side by side —
   * keeps all existing questions valid with no edits to them.
   */
  supersedes: z.array(z.string()).optional(),
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
  family: CertFamilySchema,
  /** "C03". content:check asserts id === `${family.toUpperCase()}-${versionCode}`. */
  versionCode: z.string().regex(/^C\d{2}$/),
  status: CertStatusSchema,
  /** Set when this version is retired, so a learner's profile can be moved on. */
  supersededBy: CertIdSchema.optional(),
  /** Shown as "Start here" in onboarding. At most one cert may set it. */
  recommendedFirst: z.boolean().optional(),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  role: z.string().min(1),
  minutes: z.number().int().positive(),
  questionCount: z.number().int().positive(),
  scoredCount: z.number().int().positive(),
  passScore: z.number().int().positive(),
  /**
   * Raw accuracy that we treat as landing exactly on `passScore`.
   *
   * Deliberately *not* `passScore / scaleMax`: those two numbers agreeing at
   * 0.72 today is a coincidence of units. `passScore` is a point on AWS's
   * scaled axis; this is a point on the raw-accuracy axis, and AWS does not
   * publish the mapping between them. It is our estimate from the reported
   * 70–75% band, which is why every score in the app is labelled an estimate.
   */
  passAccuracy: z.number().min(0.5).max(0.95),
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
    families: z.array(CertFamilySchema).min(1),
    versionScope: VersionScopeSchema.optional(),
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

export const CARD_KINDS = [
  'fact',
  'number',
  'whichService',
  'whichOption',
  'define',
  'trap',
  'contrast',
] as const
export const CardKindSchema = z.enum(CARD_KINDS)
export type CardKind = (typeof CARD_KINDS)[number]

export const CARD_KIND_META: Record<CardKind, { label: string; hint: string }> = {
  fact: { label: 'Fact', hint: 'A property you must be able to state.' },
  number: { label: 'Number', hint: 'A limit, quota or size you must recall exactly.' },
  whichService: {
    label: 'Which service?',
    hint: 'A requirement — name the service that meets it.',
  },
  // Same reasoning as `define` below: the answer is "S3 Intelligent-Tiering",
  // which is not a service, and a card labelled "Which service?" that wants a
  // storage class teaches the learner to stop reading the labels.
  whichOption: {
    label: 'Which option?',
    hint: 'A requirement — name the option within one service.',
  },
  // Its own kind rather than reusing whichService: labelling a concept card
  // "Which service?" when the answer is "CIDR block" is exactly the kind of
  // small lie that makes a learner stop trusting the labels.
  define: { label: 'Which term?', hint: 'A description — name the concept it describes.' },
  trap: { label: 'Trap', hint: 'The plausible-but-wrong answer, and why.' },
  contrast: { label: 'Contrast', hint: 'Two things that get confused. Separate them.' },
}

export const CardSchema = z.object({
  id: z.string().min(1),
  kind: CardKindSchema,
  front: z.string().min(1),
  back: z.string().min(1),
  /** Extra line shown after flipping — the "why it matters". */
  extra: z.string().optional(),
  families: z.array(CertFamilySchema).min(1),
  versionScope: VersionScopeSchema.optional(),
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
  /**
   * Defaulted rather than `.min(1)`: a group's content can live entirely in its
   * children. An Availability Zone holds no node directly — it holds subnets,
   * and the subnets hold the instances. Requiring a direct node here would force
   * a fake one into every intermediate group. `content:check` still fails a
   * group that has neither a node nor a child, which is the real invariant.
   */
  nodeIds: z.array(z.string()).default([]),
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
  families: z.array(CertFamilySchema).min(1),
  versionScope: VersionScopeSchema.optional(),
  taskId: z.string().min(1),
  /**
   * Which of the eight clusters in `lesson-clusters.ts` this belongs to. A
   * plain string checked referentially by `content:check` rather than a zod
   * enum, so adding a cluster stays a one-file edit — same treatment `taskId`
   * and `serviceSlugs` get.
   */
  cluster: z.string().min(1),
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

/* ── Stories: one system, built in order ─────────────────────────────────── */

/**
 * A storyline is the corpus's answer to "why do I need this?" asked in
 * sequence. The atlas says what each service is; the big picture traces a
 * request through a system that is already standing. Neither shows the system
 * being *built*, and neither lets one service's limitation motivate the next
 * one — which is how anybody actually learns an architecture.
 *
 * The rule that keeps it a story rather than a syllabus: every chapter's `pain`
 * is caused by the previous chapter's design. If a chapter could be reordered,
 * it has not earned its place.
 */

/** What a chapter contributes to the growing architecture, by id. */
export const StoryAddsSchema = z.object({
  nodeIds: z.array(z.string()).default([]),
  edgeIds: z.array(z.string()).default([]),
  groupIds: z.array(z.string()).default([]),
})
export type StoryAdds = z.infer<typeof StoryAddsSchema>

/**
 * The pick that opens a chapter. The learner chooses before the prose explains,
 * because choosing first is retrieval and reading first is only recognition —
 * and this whole app is built on that difference.
 */
export const StoryDecisionSchema = z.object({
  /** The situation in the founder's words, not exam phrasing. */
  situation: z.string().min(1),
  prompt: z.string().min(1),
  options: z
    .array(
      z.object({
        /** A service *or* concept slug — they share one namespace. */
        slug: z.string().min(1),
        correct: z.boolean(),
        why: z.string().min(1),
      }),
    )
    .min(3),
})
export type StoryDecision = z.infer<typeof StoryDecisionSchema>

export const StoryChapterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+-c\d{1,2}$/),
  title: z.string().min(1),
  /** The pain the previous chapter's design created. This is the hook. */
  pain: z.string().min(1),
  minutes: z.number().int().positive(),
  /** Real task statement, so the decision's attempt rolls into domain mastery. */
  taskId: z.string().min(1),
  serviceSlugs: z.array(z.string()).default([]),
  conceptSlugs: z.array(z.string()).default([]),
  adds: StoryAddsSchema,
  decision: StoryDecisionSchema,
  sections: z.array(LessonSectionSchema).min(1),
  checks: z.array(CheckSchema).default([]),
})
export type StoryChapter = z.infer<typeof StoryChapterSchema>

export const StorySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  /** Who is building what, and why — in the learner's terms. */
  premise: z.string().min(1),
  families: z.array(CertFamilySchema).min(1),
  versionScope: VersionScopeSchema.optional(),
  /**
   * The finished architecture, declared once. Chapters reveal parts of it and
   * none of them redefines it, which is what makes drift inexpressible.
   */
  architecture: DiagramSpecSchema,
  chapters: z.array(StoryChapterSchema).min(1),
})
export type Story = z.infer<typeof StorySchema>

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
  families: z.array(CertFamilySchema).min(1),
  versionScope: VersionScopeSchema.optional(),
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
  families: z.array(CertFamilySchema).min(1),
  versionScope: VersionScopeSchema.optional(),
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

/**
 * One sitting. The phases say what a stretch of weeks is *about*; the steps say
 * what to actually do on Tuesday evening, in order, and how you know you are
 * done. A phase without steps is a syllabus, and a syllabus is what leaves
 * someone staring at a list of sixteen services with no first move.
 *
 * `kind` is the shape of the work, and it maps onto the weekly loop: read,
 * build, break, drill, quiz, recall. Anything a step points at must already
 * exist — `content:check` fails on an unknown service slug or a relative href
 * that is not a real route.
 */
export const STEP_KINDS = ['read', 'build', 'break', 'drill', 'quiz', 'recall'] as const
export const StepKindSchema = z.enum(STEP_KINDS)
export type StepKind = (typeof STEP_KINDS)[number]

/** External reading, in the order it should be read. */
export const ReadingSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  /** Rough reading time, so a step's budget is visibly accounted for. */
  minutes: z.number().int().positive(),
})
export type Reading = z.infer<typeof ReadingSchema>

export const StudyStepSchema = z.object({
  id: z.string().regex(/^phase-\d-s\d{1,2}$/),
  title: z.string().min(1),
  /** Why this sitting earns its place, in one line. Not a restatement of the title. */
  why: z.string().min(1),
  kind: StepKindSchema,
  minutes: z.number().int().positive(),
  /** Atlas entries to internalise. Rendered as quick-look references. */
  serviceSlugs: z.array(z.string()).default([]),
  /**
   * Lessons that teach this step's idea in order. Deliberately not folded into
   * `reading`: those minutes are budget-checked against external pages, and a
   * lesson is in-app work. Nor into `actions`, which is where the practice
   * happens. Rendered before the docs, which is the point of the layer.
   */
  lessonIds: z.array(z.string()).default([]),
  reading: z.array(ReadingSchema).default([]),
  /** Where in the app the work happens. */
  actions: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) })).default([]),
  /**
   * The retrieval test that closes the step. Always something you produce from
   * memory, never "you have read the page" — reading is not evidence of anything.
   */
  doneWhen: z.string().min(1),
})
export type StudyStep = z.infer<typeof StudyStepSchema>

export const PhaseSchema = z.object({
  id: z.string().regex(/^phase-\d$/),
  index: z.number().int().min(0),
  title: z.string().min(1),
  /** The one-line reason this phase exists. */
  purpose: z.string().min(1),
  weekFrom: z.number().int().positive(),
  weekTo: z.number().int().positive(),
  hours: z.number().int().positive(),
  families: z.array(CertFamilySchema).min(1),
  versionScope: VersionScopeSchema.optional(),
  /** What must be true to leave this phase. */
  exitCriteria: z.array(z.string().min(1)).min(1),
  lessonIds: z.array(z.string()).default([]),
  labIds: z.array(z.string()).default([]),
  /** The ordered work inside the phase. This is the part a learner follows. */
  steps: z.array(StudyStepSchema).default([]),
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
  families: z.array(CertFamilySchema).min(1),
  versionScope: VersionScopeSchema.optional(),
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
