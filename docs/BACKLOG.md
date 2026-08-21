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
answered or built. Guided minutes total 107 h of the 178 h the phases budget, and
the UI says so rather than padding the list to look complete.

**The obvious next thing here:** steps' `read` targets are external AWS pages
because there are no lessons. When the lesson player lands, a step should be able
to point at a lesson id instead of a URL — the schema change is a union on
`reading`, and the step frame already survives it.

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

### 1. The lesson player — `/learn/[cert]/[lesson]`

The **only** deviation from the approved plan. `LessonSchema`, `LessonSection`
and `DiagramSpec` are fully defined in `src/content/schema.ts` but there are no
lessons and no route.

Lesson bodies are typed section arrays rather than MDX, deliberately: it makes
the animated diagrams and inline checks schema-validated and lets one renderer
handle every lesson. Section kinds already specified: `prose`, `callout`,
`diagram`, `compare`, `numbers`, `steps`, `code`, `heading`, `services`.

To build it you need: a `DiagramSpec` renderer (inline SVG, groups for
VPC/AZ/subnet nesting, optional step-through), a section renderer, a tiny inline
markdown formatter (`**bold**`, `` `code` ``, `[[service-slug]]` links), the route,
and lessons. `phases.ts` already has empty `lessonIds` arrays waiting.

Until it exists the teaching lives in the atlas, concepts, decoder, trees and
labs — which is genuinely most of it. This is an enhancement, not a hole.

That claim was too comfortable before the concepts corpus landed: the vocabulary
layer *was* a hole, and calling it an enhancement is what let it survive. What is
left for the lesson player is sequencing and diagrams, which is a real
enhancement.

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
npm test                # 115 passing
npx eslint src scripts  # 0 messages, warnings included
npm run build           # 198 prerendered pages
```

If `content:check` warns about DVA coverage, that is expected and documented
above — not a regression.
