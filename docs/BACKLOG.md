# What is done, what is not, what to do next

State as of the initial build (August 2026). Update this when you finish
something — it is the file that saves the next session from re-deriving all this.

## Built and verified

Verified means: driven in a real browser, not just compiled.

- **Content backbone** — both cert trees verbatim, 141 services, 37 concepts,
  47 triggers, 5 decision trees, 5 phases, big-picture with 7 flows, idle costs
- **Engines** — IAM policy evaluation, VPC packet simulation, FSRS scheduling,
  exam sampling and scoring, mastery and readiness, plan generation, gamification.
  104 tests
- **Exam loop** — start → 65 questions with flagging and grid → resume across
  reload → submit → scaled score and domain breakdown → per-question review →
  mistake logging. Driven end to end in the browser
- **Drill** — card seeding, FSRS grading, forecast, keyboard path
- **Labs** — VPC packet tracer with 7 break-it challenges, IAM puzzle with 12
  scenarios and a live trace, storage/teardown cost lab
- **Everything else** — Mission Control, Big Picture, Roadmap, Service Atlas,
  Keyword Decoder, Decision Trees, Quiz, Progress, Settings, Onboarding
- **Quick-look service panel** — `s` in a question or drill card, ⌘K → Enter, or
  any inline service reference opens the full atlas card in a drawer over what
  you were doing, with a back stack for "commonly confused with". Driven in the
  browser on `/quiz`, `/drill` and `/services/aurora`
- **Quality gates** — 0 lint messages, strict typecheck clean, Lighthouse 100 for
  best practices / SEO and 96 for accessibility (see the sidebar contrast note
  below), dark + light + system themes, mobile layout,
  `prefers-reduced-motion` paths

## Added since the initial build

### Study steps on the roadmap (August 2026)

The roadmap used to show a phase's purpose, exit criteria, task statements and
labs — a syllabus. Opening it told you that Foundations covers two task
statements and sixteen services, and nothing about what to do first. Every phase
now carries an ordered `steps` array: 61 sittings across the five phases, each
with the AWS pages to read in order, the atlas entries to internalise, the app
surface to do the work in, and a `doneWhen` that is always something produced
from memory.

- `src/content/phases.ts` — the steps. 84 doc URLs, all curled before committing
- `src/content/schema.ts` — `StudyStepSchema`, `ReadingSchema`, `STEP_KINDS`
- `src/engines/plan/steps.ts` — `nextStep`, `phaseStepProgress`, `guidedProgress`,
  11 tests
- `src/db` v2 — a `steps` table; row presence *is* the tick, so untick is a delete
- `src/components/map/NextStepCard.tsx` — the next step, on `/map` and Mission
  Control. `?step=` deep-links into it
- `src/app/map/StudySteps.tsx` — the per-phase list
- `scripts/content-check.ts` — step ids must match position, actions must point at
  real routes, reading minutes must fit the step, steps must fit the phase

Driven in a real browser at 1440 and 500 px, light and dark, both certs: ticking,
persistence across navigation, the deep link, and the next-step card advancing.

Deliberately **not** done: ticking a step awards no XP and moves no mastery ring.
A checkbox is a self-report and mastery is measured from what was recalled,
answered or built. Guided minutes total 108 h of the 178 h the phases budget, and
the UI says so rather than padding the list to look complete.

**Done, differently than proposed here.** A step can now name a lesson, via
`StudyStep.lessonIds` — not the union on `reading` this entry suggested. Those
minutes are budget-checked against external pages and a lesson is in-app work, so
folding them together would have made the budget check lie. Thirty-one steps
across four phases point at a lesson today; the rest still read AWS docs,
because no lesson has been written for what they cover.

## Not built

### The concepts corpus (August 2026)

The Service Atlas is keyed by service slug, so the primitives the exam assumes
had nowhere to live. "CIDR" was used ten times in the network atlas and defined
nowhere; "RTO" had one real explanation, in an unrelated service's trap list.
Because `cards.ts` derives from service entries, none of them was drilled by a
single card. 37 concepts in six groups now close that.

- `src/content/concepts/*` — networking (10), resilience (7), data (6),
  identity (5), delivery (4), operations (5). 33 doc URLs, all curled
- `src/content/schema.ts` — `ConceptSchema`, `CONCEPT_GROUPS`,
  `CONCEPT_GROUP_META`, and a new `define` card kind
- `src/content/concept-registry.ts` — aggregate, groups in reading order
- `src/lib/peek.ts` — was `service-peek.ts`; the stack now holds
  `{kind, slug}`, so one back stack walks concept → concept → service
- `ConceptAtlas`, `ConceptMeta`, `ConceptRef`, `ConceptTile`; `ServiceAtlas`
  gained an "Assumes you know" panel driven by `conceptsForService()`
- `/concepts` and `/concepts/[slug]`; ⌘K searches concepts, scoring `aka` too
- `cards.ts` — 1,391 → 1,709 cards, 318 of them concept-derived
- `content-check` — schema, duplicate and cross-corpus slug collisions,
  reference integrity, and depth warnings for traps/phrasings/service links

Driven in a real browser: the list page, a full concept page, the quick look
opened from ⌘K, a concept → concept → service back stack, dark theme and 500 px.

**The obvious next thing here:** the atlas-gap audit in `content:check` reads
quantities out of question explanations and checks them against the *service*
entries a question points at. It does not yet look at concepts, so a question
teaching "251 usable addresses" is still reported as an orphan even though the
CIDR concept now carries it. Widening `atlasText()` to include
`conceptsForService()` output is a few lines.

### Story mode and `whyItExists` (August 2026)

Two gaps a learner named directly: nothing said *why* a service exists — "why do
I need a Region at all?" — and nothing joined the corpus into a single arc.

`whyItExists` is now an optional field on `ServiceSchema` and `ConceptSchema`,
rendered as the leading section of both atlases and of the quick-look panel.
Optional with a counted `content:check` warning rather than required: making it
required turned the gate red 178 times on the first run. **21 of 135 are written**
— the tier-1/2 services and concepts that chapters 1–4 lean on. The rest is
mechanical authoring and the warning tracks it.

Story mode is `/story` and `/story/[slug]`, with one 13-chapter SAA arc
(`startup-saa`, 9 h) from creating a root account to surviving the loss of a
Region. What landed:

- `src/content/stories/startup-saa.ts` — the arc, ~1,450 lines. One complete
  `DiagramSpec` (20 nodes, 15 edges, 10 nested groups) plus per-chapter `adds`
- `src/content/story-registry.ts`, wired into the barrel with the
  import-then-export-local-binding rule
- `src/engines/story/cumulative.ts` — `visibleAt`, `storyProgress`,
  `nextChapter`. 11 tests
- **`src/components/diagram/Diagram.tsx` + `layout.ts`** — the inline-SVG
  `DiagramSpec` renderer, with nested group layout. 13 tests. This is the piece
  the lesson player has been blocked on
- `src/lib/md.tsx` — the inline formatter (`**bold**`, `` `code` ``, `[[slug]]` →
  a real `ServiceRef`). Returns ReactNode, so no `dangerouslySetInnerHTML`. 10 tests
- `src/components/lesson/Sections.tsx` — a renderer for every `LessonSection`
  kind, not just the ones this arc uses
- Dexie **v4**: a `storyChapters` table, additive as v2 was. `Attempt.source`
  gains `'story'` (no migration — the index is by value). 4 persistence tests
  including the export/import round trip and restoring a pre-story backup
- `content:check` gains the whole story integrity section, and prints
  `stories  1  (13 chapters, 9 h)`
- `NextChapterCard` on `/map` and Mission Control, kept separate from
  `NextStepCard` rather than overloading it

Verified: 178 tests pass, typecheck and `eslint src scripts` clean, build
prerenders both story routes, `content:check` valid. The cumulative fold and the
nesting geometry were verified against the **served HTML** — chapter 1 renders one
node, chapter 13 renders all 20 with 19 settled, and Region ⊃ VPC ⊃ AZ ⊃ subnet
containment plus region non-overlap were asserted numerically and are now pinned
by `startup-saa.test.ts`.

**Not verified in a real browser.** A Chrome instance from another session held
the devtools profile throughout, so the visual result — the three theme states,
1440 px and 500 px layouts, the sticky diagram, clicking a node to open the peek,
and a Lighthouse pass on `/story/[slug]` — has **not** been driven. That is the
repo's standard for "verified" and it is outstanding. Do it before trusting the
look of this.

**The obvious next things here:**
- Backfill the remaining 114 `whyItExists` entries
- A DVA arc — build-and-ship rather than infrastructure. The frame is proven now
- Point study steps at chapters. `StudyStepSchema.actions` validates against an
  exact `ROUTES` match, so a `?chapter=` deep link needs the checker to strip the
  query string first — which also unblocks the `?domain=` item below
- `@xyflow/react` is in `package.json` and imported nowhere. `BigPictureCanvas`
  is hand-rolled CSS grid and `Diagram.tsx` is hand-rolled SVG, so the dependency
  can probably just go
- `BigPictureCanvas` uses `opacity-25` to dim a node outside the selected flow.
  It is transient rather than a persistent locked state, so it is not the
  invariant-6 case, but it is the same contrast risk and the story diagram's
  fill/stroke/dash recipe is the fix if the audit ever flags it

### Option matrices (August 2026)

The exam asks "which storage class / volume type / purchase option", and the
corpus had no way to say a service *has* mutually exclusive options. The facts
were mostly present but flat inside `keyNumbers`, and wildly inconsistent about
it: Route 53 listed all seven routing policies as rows, while **S3 never named
S3 Standard as a class at all** and Intelligent-Tiering existed only inside an
`examTrap`. EC2 purchase options were prose split across three entries, with
Dedicated Hosts and Dedicated Instances absent from the corpus entirely. Of
1,709 cards, **none** drilled the "which one" recall path.

- `src/content/schema.ts` — `ServiceOptionSchema`, `ServiceOptionSetSchema`,
  `optionSets` on `ServiceSchema` (optional, not `.default([])`: the `Service`
  type is zod's *output* type, so a default would have made the field required
  on all 141 entries). New `whichOption` card kind
- `src/content/cards.ts` — three card shapes per set: `opt:` (the requirement →
  the option name), `trap:opt:` where an option carries a `gotcha`, and an
  `optset:` roster card for tier 1. **1,709 → 1,851 cards**, 83 of them
  `whichOption`
- 17 sets / 77 options across the 15 services in
  `src/content/option-coverage.ts`: s3, ebs, ec2, route53, elb, rds, lambda,
  dynamodb (×2), efs (×2), ec2-auto-scaling, aurora (×2), kms, api-gateway (×2),
  fsx, sqs
- `ServiceAtlas.tsx` — a derived four-column table on the page, a stacked list
  in the 400px panel. Same data, same component, following the `alongside`
  precedent, so invariant 11 holds. `legacy` options (gp2, io1, CLB) use a
  dashed border and a muted background, never `opacity`
- `content-check` — the duplication failure, plus `atlasText()` widened to read
  option fields. That last one is not cosmetic: without it every figure moved
  out of `keyNumbers` reappears as a phantom atlas gap and every figure authored
  in a matrix counts as invisible
- The depth warning now counts options as well as key numbers, so migrating a
  service no longer looks like thinning it

**The id hazard this exposed, and the fix.** Card ids were positional
(`num:<slug>:<i>`) and the SRS schedule is keyed by card id, so deleting a
`keyNumbers` row silently re-pointed a learner's reps, ease and due date at
whichever fact slid up into the slot — invisible, and triggered by exactly this
migration. Ids are now label-keyed, every pre-existing row orphaned once,
`orphanCardIds`/`pruneOrphanCards` clear orphans on the next drill seed, and
`src/content/cards.test.ts` (new) fails any id containing a digits-only segment.
Verified in the browser: 0 positional ids left in the table, 83 `opt:` rows
seeded.

Verified in a real browser at 1440 and 500 px, light and dark: the page table on
`/services/s3` and `/services/ebs`, the stacked panel via ⌘K quick look, no
horizontal page overflow at 500 px, the `legacy` treatment in dark theme, and a
`whichOption` card drilled end to end on `/drill` (front, flip, FSRS grading).

**Backlog:** `ecs` launch types, `storage-gateway`, `snow-family`,
`direct-connect` VIF types, `cloudfront` origin types, `elasticache` Redis vs
Memcached, `redshift` node types. `ConceptSchema` deliberately has no
`optionSets` — a product option is a vendor artefact and a primitive has none.

### Decision-tree matrices, and a validation hole (August 2026)

Only 1 of the 5 trees (`compute`) had a `matrix`. The other four now do:
`database`, `storage`, `integration` and `edge`. The storage tree also gained
One Zone-IA and Glacier Instant Retrieval, which it had been missing — it
offered 4 of the 7 S3 classes.

More importantly, **`decision-trees.ts` and `labs.ts` had never been
`safeParse`d**. `content-check` parsed nine content types and not those two.
They happened to be valid, which is not the same as being guarded. Now checked:
schema shape, `rootId` and every `answers[].next` resolving to a real node,
answer slugs resolving to services, and for a matrix — rows that are services,
rows that are actually answers in *that* tree, no duplicate rows, and
`cells.length === columns.length` (a short row used to render as silently
missing table cells). The new rules caught two bad rows in the matrices being
added in the same commit, which is a fair advertisement for them.

### 1. The lesson player — built, batches 1–8 written

**Done (August 2026).** `/learn` and `/learn/[id]` exist. The route was the last
20% of a feature whose hard parts story mode had already built: the `DiagramSpec`
renderer, the section renderer for all nine `LessonSection` kinds, and the inline
markdown formatter.

What landed with it:

- `src/content/lessons/security-groups.ts` — the first lesson, and the template
  the next ones copy. 25 sections, 4 checks, 12 minutes
- `src/content/lesson-registry.ts` — same naming rule as the service, concept and
  story registries, for the same Turbopack reason
- `src/engines/lesson/trace.ts` — `DiagramSpecSchema.steps` had been in the
  schema since the beginning and the renderer never implemented it. It did not
  need to: `traceAt()` folds a step index into the `VisibleAt` shape `Diagram`
  already accepts, so a spec that declares `steps` becomes a walkthrough the
  reader advances a hop at a time. Pure, and unit-tested
- `src/components/lesson/Walkthrough.tsx` — the play control. Arrow keys, and it
  bails while a `[role="dialog"]` is open, per invariant 11
- `src/components/lesson/LessonChecks.tsx` — near-copy of `ChapterChecks`
- `content:check` section 4d, and `checkDiagram()` lifted out of the story
  validator so both share one copy of the diagram rules

Three bugs in the shared diagram renderer surfaced while driving the first lesson
in a browser, and all three had been silently wrong in story mode too:

1. **No arrowhead ever rendered.** Edges were drawn centre-to-centre, so every
   `marker-end` sat underneath the target node's own rectangle, which is painted
   afterwards. `clipToBox()` in `layout.ts` now stops both ends on the node
   boundary. Story mode gained arrowheads it never had
2. **Edge labels sat at the centre-to-centre midpoint**, which lands on top of a
   node. Clipping both ends moved every label into the gap where it belongs
3. **An elbow's label was placed on the straight line it does not follow.** It
   now sits on the horizontal leg

Also fixed, both pre-existing in `Sections.tsx`: the `numbers` section emitted
`dl > div > span`, which is invalid HTML and an axe failure, and the `heading`
kind was hardcoded to `h3` — correct under a story chapter's `h2`, a skipped
level under a lesson's `h1`. `Sections` now takes `headingLevel`. Lighthouse
accessibility on `/learn/security-groups` is **100** in dark and 96 in light, the
96 being only the pre-existing `--warn` / `text-accent` token contrast issue in
§4 below.

**What is owed here.** Five batches are written. Batch 1 — the reachability
cluster — is `security-groups`, `subnets-and-route-tables`,
`why-cant-it-reach-the-internet` and `network-acls`, 83 sections and 16 checks.
Batch 2 — identity — is `how-iam-decides`, `roles-not-keys` and
`kms-and-envelope-encryption`, 61 sections and 12 checks, 39 minutes; both of the
latter declare `requires: ['how-iam-decides']`, making it the first three-lesson
chain in the corpus. Batch 3 — storage — is `block-file-object`,
`s3-storage-classes` and `s3-durability-vs-availability`, 46 sections and 11
checks, 39 minutes, and it is a *linear* chain: each one declares `requires` on
the one before, so `/learn` reads in the order it should be read in. Batch 4 —
resilience, the largest SAA domain — is `multi-az-vs-read-replica`,
`rto-rpo-and-the-four-dr-strategies` and `which-load-balancer`, 60 sections and
12 checks, 44 minutes, a linear chain again and the first batch whose middle
lesson restates almost nothing from a service card: RTO, RPO and the four
strategies are all concept entries, so `lesson:brief` had to be called a second
time with concept slugs. Batch 5 — serverless and events — is
`lambda-execution-model`, `queue-topic-bus` and `retries-dlqs-and-idempotency`,
48 sections and 12 checks, 45 minutes, and it is not a chain: the first two are
independent and the third declares `requires` on both. Batch 6 — data and cost —
is `partition-keys`, `where-to-cache` and `paying-less-for-the-same-thing`, 48
sections and 12 checks, 46 minutes, and it is not a chain either: all three
declare `requires: []`, because none of the three depends on either of the
others. Batch 7 — the developer cluster, and the first batch written for DVA
rather than adapted to it — is `api-gateway-request-path`,
`user-pool-or-identity-pool`, `shipping-a-change-safely` and
`metrics-traces-and-logs`, 70 sections and 16 checks, 66 minutes, and it is not
a chain: all four declare `requires: []`, because none of the four needs
another. Batch 8 — the long tail the previous revision of this section listed
as what was owed — is `templates-and-stacks`, `two-roles-and-no-servers`,
`queue-or-stream` and `orchestrate-dont-chain`, 65 sections and 16 checks, 65
minutes; all four are tagged for both families, and only `queue-or-stream`
declares a prerequisite. **Twenty-seven lessons, 481 sections, 107 checks, 398
minutes.**

**Every batch in [`LESSONS-BATCHES.md`](LESSONS-BATCHES.md) is now marked done**,
including the long tail that the previous revision of this section named as the
outstanding work. Thirteen of the twenty-seven now carry the DVA family and one
— the CI/CD lesson — is DVA only, which is the first lesson in the corpus that
an SAA reader will never see. What is owed here is no longer a cluster or a
tail; it is a second rank of individual study steps, and the honest list is
below.

Batch 5 settled the DVA question the first four deferred. Batches 1–4 are all
`families: ['saa']`, and the worry recorded here was that a DVA-tagged lesson
wired into an SAA-only phase would be invisible to the reader who needs it most.
It turns out nothing filters `lessonIds` by family at the step or phase level, so
the answer is **both families with the task statement that fits**: batch 5's
three are `['saa', 'dva']`, `lambda-execution-model` and
`retries-dlqs-and-idempotency` carry `dva-1.2` and `dva-1.1`, `queue-topic-bus`
carries `saa-2.1`, and all three render on SAA phases 1 and 2 *and* on DVA phase
4. Phase 4 had no lesson on it at all before this; it now has all three.
Batch 6 added two more to that set — `partition-keys` carries `dva-1.3` and
`where-to-cache` carries `saa-3.3`, both tagged for both families — and
`paying-less-for-the-same-thing` is deliberately SAA-only, because Spot and
Savings Plans are not on the developer paper.

Batch 7 closed the gap that paragraph named. `api-gateway-request-path`
(`dva-1.1`), `user-pool-or-identity-pool` (`dva-2.1`) and
`metrics-traces-and-logs` (`dva-4.1`) are tagged for both families, because API
Gateway, Cognito, CloudWatch, X-Ray and CloudTrail are all tier 1 and carry SAA
questions as well; `shipping-a-change-safely` (`dva-3.4`) is the corpus's first
**DVA-only** lesson, because CodePipeline, CodeBuild and CodeDeploy are tier 2
and dva-tagged in the atlas and tagging the lesson for SAA would put a
developer-tools reading list on a phase that never mentions them. So nine of the
twenty-three are DVA lessons, twenty-two are SAA lessons, and phase 4 goes from
five lessons to nine.

Batch 8 wrote that long tail out: `templates-and-stacks` (`dva-3.1`),
`two-roles-and-no-servers` (`saa-3.2`), `queue-or-stream` (`saa-3.5`) and
`orchestrate-dont-chain` (`saa-2.1`), all four `['saa', 'dva']`. It moved one
step budget — `phase-1-s14` from 120 to 150 minutes, because 85 minutes of
reading and three lessons do not fit in 120 — and added `kinesis-data-streams`
and `step-functions` to that step's `serviceSlugs`, so the step's service list
and its lesson list agree. The other five wirings had the room: `phase-1-s15`
(120 against 50 and one lesson), `phase-2-s6` (120 against 30 and none),
`phase-4-s3` (120 against 60 and two), `phase-4-s4` (120 against 25 and one) and
`phase-4-s10` (150 against 55 and one).

What is left is no longer a tail with a theme. It is a second rank of study
steps that carry no lesson at all: DNS and the Route 53 routing policies
(`phase-0-s5`), joining networks together (`phase-1-s4`), what idle
infrastructure costs (`phase-1-s8`), Auto Scaling and what it cannot fix
(`phase-1-s13`), migration and hybrid (`phase-1-s18`), and secrets and
configuration in code (`phase-4-s9`). None of them is close to the question
weight of the eight batches that are written, which is why the batch list
stopped being a queue at batch 6 and is now a record.

Two gate gaps batch 8 found, both worth fixing before batch 9 rather than
rediscovering: **the inline formatter's non-nesting bug has three shapes**, not
the one batch 7 recorded — a `[[slug]]` or a code span inside `**bold**`, and a
code span inside `*italic*` — and no gate sees any of them, only a text-node
walk in the browser. And **`diagram:audit` cannot see an edge crossing a node it
is unrelated to**: the Step Functions walkthrough drew a legal, clean-auditing
edge straight over the node between its endpoints.

Batch 2 also moved two step budgets: `phase-0-s6` and `phase-1-s1` each went from
90 to 105 minutes, because 80 and 65 minutes of external reading plus a lesson on
top does not fit in 90, and assuming the reader is faster would make the plan a
lie. `phase-1-s16` had the room already. That is the one number a lesson can
silently invalidate, so check it every time — see
[`LESSONS.md` § Wiring a lesson in](LESSONS.md). Batch 3 moved none: its two
steps, `phase-1-s6` and `phase-1-s7`, are 120 minutes each against 55 and 80
minutes of reading, so 14 and 25 minutes of lesson fit without touching them.
Batch 4 moved none either — `phase-1-s9` (120 against 90), `phase-1-s12` (120
against 75) and `phase-2-s7` (90 against 45) all had the room. It also wired
`multi-az-vs-read-replica` a second time, onto `phase-2-s5` "Lose an Availability
Zone", which is the step that rehearses the lesson's whole question; the phase
lists it too, so the card and the step agree. Batch 5 moved none either, and it
is the first to wire across both exams: `phase-1-s14` (120 against 85),
`phase-1-s15` (120 against 50), `phase-2-s4` (90 against 40), `phase-4-s2` (120
against 95), `phase-4-s3` (120 against 60) and `phase-4-s4` (120 against 25) all
had the room for a 14- to 16-minute lesson on top. Batch 7 moved none either:
`phase-4-s5` (120 against 55 and a lesson already on it), `phase-4-s8` (90
against 60), `phase-4-s10` (150 against 55), `phase-4-s11` (90 against 55) and
`phase-1-s17` (90 against 45) all had room for a 15- to 18-minute lesson. Batch 6 moved none either:
`phase-1-s5` (120 against 55), `phase-1-s10` (120 against 55), `phase-1-s11` (90
against 50), `phase-4-s5` (120 against 55), `phase-4-s6` (150 against 100) and
`phase-4-s7` (120 against nothing) all had 40 minutes or more spare. It wires two
lessons twice — `partition-keys` onto the SAA DynamoDB step and both DVA
key-design steps, `where-to-cache` onto the SAA caching step and the DVA API
Gateway step — and both phases list them, so the cards and the steps agree.

Batch 4 also surfaced one thing worth stating as a rule: **`serviceSlugs` is a
promise about backlinks, not a topic list.** The DR lesson was first written with
the four slugs its study step carries, which put a link to it on the S3 and AWS
Backup atlas entries for a lesson that names neither service. `content:check`
cannot see this — four resolving slugs are four resolving slugs — so it is a
browser-pass check, and the fix is to list only the entries the lesson actually
restates.

That document is also where the workflow lives, because the first lesson cost far
more than writing it: most of the effort went on re-reading content files to find
facts, and on getting diagram geometry right by screenshotting in a browser. Both
are now single commands — `npm run lesson:brief` prints every corpus fact about a
set of slugs, and `npm run diagram:audit` reports overlaps, label collisions and
dead space from `layout.ts` without opening a browser. The audit was checked
against the actual broken geometry of the first lesson: it reports all five bugs
that screenshot loop found.

Both smaller follow-ups are closed. `phases.lessonIds` is now read by
`RoadmapView` and populated on three phases, and a step names lessons through its
own `lessonIds` field (see §"Study steps" above for why not `reading`). Batch 1
also wired the two discovery paths that were missing: lessons are in the ⌘K index
(scored just *below* the atlas entry for the same words, deliberately — the
palette's default is "remind me", and a lesson is the one hit kind that navigates
rather than opening a peek), and every atlas entry for a slug in a lesson's
`serviceSlugs` links back — first on the page, last in the peek, because
mid-question a prominent link out of the peek costs the question.

One thing batch 1 surfaced and fixed: `Lesson.requires` had been in the schema
since the start and was rendered nowhere, so the two lessons that declare a
prerequisite would have dropped a reader into the middle of a chain. `/learn/[id]`
now renders it as a "read this one first" card — a pointer, not a gate.

### 2. Question banks — done, with one engine caveat

**Done (August 2026):** SAA 80 → 142 (40/36/34/32) and DVA 30 → 132
(42/34/32/24). Both certs now serve two consecutive full 65-question papers with
zero overlap, verified by sampling twice with the first paper's ids excluded.
Per-domain counts are in [`CONTENT.md`](CONTENT.md).

**The caveat, and the next real task here:** `sample()` in
`src/engines/exam/sampler.ts` prefers unseen questions but falls back to the full
candidate set when a domain has too few unseen ones — and reports no shortfall
when it does. So a *third* consecutive paper is 100% repeats and the learner is
not told. That contradicts invariant 9. The fix is small: return a repeat count
from `SampleResult` and surface it in `/exam` before the paper starts. Do that
before adding a third paper's worth of questions.

When writing more, the current bank is the style guide: a scenario stem with the
constraint that decides the answer, four plausible options with a `why` on every
one including the correct one — several distractors are deliberately "correct but
not best", because that is the real exam's main trap — an `explanation` that
states the general rule rather than restating the answer, and a `source` pointing
at the specific AWS doc page. Multi-response questions need 5+ options.

### 3. Labs from the plan that were not built

- **Request Racer** — tune Route 53 → CloudFront → ALB → ASG → RDS, watch
  latency and cost meters
- **AZ Drill** — kill an AZ and see whether the design survives. `threeTierVpc()`
  and `routePacket()` already give you most of the engine
- **Event Wiring** (DVA) — Lambda event sources, batching, DLQ, idempotency
- **DynamoDB Key Design** (DVA) — design keys and GSIs against a stated workload;
  would pair well with a partition-heat visualisation

### 4. Smaller gaps

- **Achievements are displayed but never unlocked.** `ACHIEVEMENTS` and
  `unlock()` both exist; nothing calls `unlock()`. Wiring the predicates is an
  afternoon and makes `/progress` honest
- **`/notes`** — the planned MDX drop-in for the user's Notion export
- **Bilingual summaries** — the user's own Notion docs are English body with
  Vietnamese "Nói ngắn gọn" callouts. An optional `viTldr` on services and lessons
  would match how they already study. Not in the schema yet
- **Accessibility is 96, not 100, and has been for a while.** Lighthouse desktop
  now fails one `color-contrast` check on *every* page, all of it in the
  sidebar: the `text-accent` "Solutions Architect" subtitle, the accent pending
  badge on Recall Drill, and the small accent badges. Pre-existing and unrelated
  to any one page — fixing it is a token change in `globals.css`, not a layout
  change
- **CLS 0.068** on `/map` from client-side data hydration. Under the 0.1 "good"
  threshold; reserving space for the live-query regions would clear it
- **`Tooltip` and `Card`/`CardLink`/`SectionTitle`** are written but barely used
- **Four phases name labs that do not exist** (`request-racer`, `az-drill`,
  `ddb-keys`, `event-wiring` — the ones in section 3 below). `RoadmapView` skips
  unknown ids so nothing breaks, and `content:check` now *warns* rather than
  failing, because the intent is to build them. Either build them or drop the ids
- **`/quiz` and `/exam` take no target in the URL.** The roadmap's "40 questions →"
  and every step's quiz action land on the picker rather than the domain in
  question. A `?domain=` param on `/quiz` would make several steps land exactly
  where they say they will
- **The quick-look panel is not wired into the labs' inline prose.** The VPC and
  IAM labs mention services in body text that is still plain strings; making
  those `ServiceRef`s is a small, obvious win
- **Three atlas gaps were closed by the new `content:check` audit** (Aurora
  Standard vs I/O-Optimized, Lambda response streaming and the 3 MB console
  editing threshold, DynamoDB key-size limits). The audit only reads
  *quantities* — a question that teaches a named feature or a behaviour the
  atlas lacks still slips through. Extending it to capitalised feature names is
  the obvious next step, and noisier

## Bugs found and fixed during the build

Recorded because the symptoms pointed away from the causes.

| Symptom | Actual cause |
|---|---|
| `evaluate()` allowed a call an SCP never permitted | Step 3 accepted *any* `allow` in the trace, including from a ceiling. Only identity/resource policies may grant |
| Plan weeks landed on Sunday | `toISOString()` on a local midnight shifts back a day in UTC+7. Format from local components |
| `serviceBySlug` was `undefined` at runtime | The `@/content` barrel both imported and re-exported the same binding, giving the bundler two paths to it |
| `module factory is not available` | `src/content/services/index.ts` — a directory index the barrel also re-exported. Renamed to `service-registry.ts` |
| Lighthouse contrast failures on locked cards | `opacity-60` on the container dims text below 4.5:1 |
| React 19 script-tag warning | The blocking inline theme script. Removed; pure CSS covers all three theme states |

## Sanity checks before you start

```bash
npm run content:check   # should print counts and "all content valid"
npm run typecheck
npm test                # 226 passing
npx eslint src scripts  # 0 messages, warnings included
npm run build           # 211 prerendered pages
```

If `content:check` warns about DVA coverage, that is expected and documented
above — not a regression.
