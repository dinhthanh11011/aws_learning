# What is done, what is not, what to do next

State as of the initial build (August 2026). Update this when you finish
something — it is the file that saves the next session from re-deriving all this.

## Built and verified

Verified means: driven in a real browser, not just compiled.

- **Content backbone** — both cert trees verbatim, 141 services, 47 triggers,
  5 decision trees, 5 phases, big-picture with 7 flows, idle costs
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
- **Quality gates** — 0 lint messages, strict typecheck clean, Lighthouse 100 for
  accessibility / best practices / SEO (desktop `/map`, mobile `/`), dark + light +
  system themes, mobile layout, `prefers-reduced-motion` paths

## Not built

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

Until it exists the teaching lives in the atlas, decoder, trees and labs — which
is genuinely most of it. This is an enhancement, not a hole.

### 2. DVA question bank — highest value per hour

30 questions against the 65 a full paper needs. Per-domain gaps are in
[`CONTENT.md`](CONTENT.md). Roughly 35 more questions makes DVA papers as good as
SAA ones. Nothing else in the app is blocked on anything.

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
- **CLS 0.068** on `/map` from client-side data hydration. Under the 0.1 "good"
  threshold; reserving space for the live-query regions would clear it
- **`Tooltip` and `Card`/`CardLink`/`SectionTitle`** are written but barely used

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
npm test                # 104 passing
npx eslint src scripts  # 0 messages, warnings included
```

If `content:check` warns about DVA coverage, that is expected and documented
above — not a regression.
