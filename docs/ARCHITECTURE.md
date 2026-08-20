# Architecture

How the app is put together, and why. Read [`../AGENTS.md`](../AGENTS.md) first for
the invariants; this is the map.

## Shape of the thing

```
Content (typed data, zod-validated)
        │
        ├──► Engines (pure TS, unit-tested)  ◄── Dexie state
        │            │
        └────────────┴──► React components ──► Routes
```

Content is inert data. Engines are pure functions over content plus learner
state. Components read both and render. Nothing flows the other way: an engine
never imports a component, and content never imports an engine.

## Stack

| Concern | Choice | Note |
|---|---|---|
| Framework | Next.js 16 App Router, Turbopack | Most pages are static; only `/exam/[id]` is dynamic |
| Styling | Tailwind v4, CSS-first `@theme` | Tokens in `src/app/globals.css` |
| Animation | `motion` (Framer Motion successor) | Always gated on `useReducedMotion()` |
| Local DB | `dexie` + `dexie-react-hooks` | `useLiveQuery` gives free reactivity on writes |
| SRS | `ts-fsrs` (FSRS-6) | We own the *policy*, not the algorithm |
| Validation | `zod` | Build-time via `scripts/content-check.ts` |
| Tests | `vitest` | Engines only; UI is verified in a real browser |

No backend, no auth, no env vars, no API keys. That is a deliberate constraint,
not a stage — it is why there is no account to create and why the `/settings`
export is the only backup that exists.

## Content layer — `src/content/`

`schema.ts` is the contract. Everything else conforms to it.

| File | Holds |
|---|---|
| `schema.ts` | zod schemas + types + `CATEGORIES`, `TIER_META`, `CARD_KIND_META` |
| `certs/saa-c03.ts`, `certs/dva-c02.ts` | Domain and task-statement trees. **Titles and every Knowledge/Skills bullet are verbatim from the official AWS exam guides.** `blurb` and `serviceSlugs` are ours |
| `services/*.ts` | 141 service cards by category |
| `service-registry.ts` | Aggregates the service files. Must **not** live at `services/index.ts` — see invariant 3 |
| `questions/*.ts` | Exam-format questions; every option has a `why` |
| `cards.ts` | **Derives** ~1,391 SRS cards from services + triggers + idle costs |
| `triggers.ts` | 47 keyword→answer mappings, each with its distractor |
| `decision-trees.ts` | 5 which-service-should-I-use trees |
| `big-picture.ts` | The 5-layer system view, 25 nodes, 7 traceable flows |
| `phases.ts` | The 5-phase learning path (mirrors the user's Notion roadmap) |
| `idle-costs.ts` | What a forgotten lab costs per month |
| `labs.ts` | Lab metadata |
| `index.ts` | The `@/content` barrel: lookups, reverse indexes, `search()`, `contentStats()`, `examCoverage()` |

### Reaching the atlas from anywhere

`ServiceAtlas` (`src/components/service/ServiceAtlas.tsx`) renders one service
card and is used by both `/services/[slug]` and `ServicePeek`, the quick-look
drawer mounted once in `AppShell`. `src/lib/service-peek.ts` is the store — a
stack of slugs, so following "commonly confused with" inside the panel can be
walked back. Anything mentioning a service inline uses `ServiceRef` or
`serviceLinkProps`, and `useServicePeekKey` binds `s` to the services a question
or drill card points at. The panel exists because navigating away mid-question
costs the question, so without it the lookup simply does not happen.

### The tier system

`tier: 1 | 2 | 3` on every service is the single most load-bearing content
decision. It is what stops 141 services from being a flat, hopeless list:

- **1 · Core** — know cold; it is an answer or a trap in real questions
- **2 · Working** — know when to reach for it and its one differentiator
- **3 · Recognise** — know the name and its one job, enough to eliminate it

Tier drives card generation (tier 3 gets no number cards), the "weakest first"
ordering, mastery weighting, and the roadmap. Changing a tier changes behaviour
in six places, which is the point.

### Why cards are derived

A hand-written card set and a hand-written atlas drift apart, and then the
learner drills something the atlas contradicts. `buildCards()` generates five
kinds from existing content:

| Kind | From | Tiers |
|---|---|---|
| `number` | `keyNumbers` (skipping `volatile: true`) | 1–2 |
| `trap` | `examTraps` | all |
| `contrast` | `confusedWith` | all |
| `whichService` | `oneLiner`, plus every trigger phrase | 1–2 |
| `fact` | `whenNotToUse` | 1 |

Card ids are stable and derived (`num:s3:0`, `trap:lambda:3`), so FSRS state
survives content edits. If you *delete* a service, its stored cards become
orphans — `DrillSession` skips them gracefully rather than crashing.

### `content:check`

`scripts/content-check.ts` does four things beyond schema validation:

1. **Uniqueness** — duplicate ids across services, tasks, questions, triggers, phases
2. **Referential integrity** — every `serviceSlug`, `taskId`, `domainId`, `confusedWith`, `related` resolves; nothing points at itself
3. **Exam-shape invariants** — domain weights sum to 100, `scoredCount ≤ questionCount`, domain indexes are 1..n
4. **Coverage warnings** — services no task statement references; core services with fewer than three traps or numbers; a question bank that cannot fill a full paper

Warnings do not fail the build; problems do.

## Engines — `src/engines/`

Pure TypeScript, no React, no I/O. The only tested layer (104 tests). Every
engine that needs the clock takes it as a parameter so tests are deterministic.

### `policy/` — IAM evaluation

`evaluate(policies, request)` implements the real rule order and returns a
**decision trace**, not a boolean:

1. Explicit `Deny` anywhere wins, immediately
2. Every ceiling present (`scp`, `boundary`, `session`) must *permit* the action
3. Something must `Allow` — cross-account needs **both** identity and resource
4. Otherwise implicit deny

Only `identity` and `resource` policies can grant. A ceiling that permits has
removed an obstacle, not created a permission — that distinction is what the exam
tests and it is enforced in code (`const granting = identityAllow ?? resourceAllow`).
A test caught this exact bug during the build.

`puzzles.ts` holds 12 scenarios, each isolating one rule.

### `network/` — VPC packet simulator

`routePacket(topology, packet)` returns hop-by-hop `Hop[]` where each failed hop
carries `blockedBy` **and** `fix`. That is the product: *"route table has no
0.0.0.0/0 entry"* teaches something; *"unreachable"* does not.

Models what the exam actually tests: stateful SGs vs stateless NACLs (including
the ephemeral-port return-traffic trap), longest-prefix route matching, NAT
placement and zonality, gateway endpoints, blackhole routes, cross-AZ cost.

`topologies.ts` has the canonical three-tier VPC plus 7 `breakIts`. **The test
suite asserts every break-it actually breaks what it claims to** and that every
failure names a cause and offers a fix — so a badly written challenge fails CI.

### `srs/` — spaced repetition

Thin policy layer over `ts-fsrs`. We do not invent scheduling. What lives here:
queue building (overdue first, new interleaved ~1-in-4 so a session is not a wall
of unfamiliar material), daily caps, `retrievability()` for mastery, and
`forecast()` so a review spike the week of the exam is visible early.

### `exam/` — sampling and scoring

`allocate()` splits a paper by published domain weight using floor-then-largest-
remainder, so the split is faithful rather than favouring domain 1. For SAA at 65
questions that is 19/17/16/13. `sample()` prefers unseen questions but **reports a
`shortfall` rather than silently returning a short paper**.

`score()` maps accuracy to the 100–1000 scale with a hinge at 72% → 720, since
AWS does not publish its scaling. Every surface that shows a score says it is an
estimate. `marksAtStake()` ranks domains by `(1 - accuracy) × weight`, because
being weak in a 30% domain costs more than being weak in a 20% one.

### `progress/` — mastery and readiness

Mastery blends four kinds of evidence so no single one can be gamed: FSRS
retrievability (recall), time-decayed answer accuracy, coverage, and the
learner's own 1–5 self-rating. Someone who watched every lesson but cannot answer
a question scores low, which is the entire point.

`readiness()` is **capped at 70% until there is real timed-exam evidence**
(`0.7 + 0.3 × examEvidence`). Content mastery is necessary but it is not proof you
can do it in 130 minutes against four plausible options.

### `plan/` and `gamify/`

`generate()` turns exam date + weekly hours into weeks, protecting `phase-2`
(building) from compression because that is the phase whose loss reliably costs
marks. It states plainly when a date is not achievable.

`plan/steps.ts` answers "what do I do next" as a pure function of the phases and
the set of ticked step ids: `nextStep()` returns the first unticked step in phase
order, `phaseStepProgress()` counts one phase, `guidedProgress()` weights by
minutes so a 45-minute reading does not count the same as a two-hour build. The
rule is deliberately the simplest honest one — it does not skip ahead and it
hides nothing; phases are not gated at all, the order is advice. A "next step"
the learner cannot predict is one they stop trusting.

`gamify/rules.ts`: XP only ever rewards recall (a correct hard question pays more
than finishing a lesson). Streaks have earned freezes, because a streak that
punishes one bad day trains people to quit. Nothing is purchasable and nothing is
random enough to feel like a slot machine.

## Data layer — `src/db/`

`index.ts` is the Dexie schema (11 tables, version 2 — v2 adds `steps`, the roadmap's checklist, additively). `repo/index.ts` is the
**only** thing that touches Dexie — components never do. That keeps the
persistence choice swappable and, more usefully, means there is no way to award
XP and forget to advance the streak: `awardXp()` is the single write path and it
also touches the streak and the daily stat.

`exportAll()` / `importAll()` / `resetAll()` back `/settings`. `importAll`
validates a `format` sentinel and version before clearing anything.

## UI

- `AppShell` — sidebar rail (desktop) / drawer (mobile), plus the ⌘K palette
- `Page` — the standard title/lede/actions frame every route uses
- `QuestionCard` — one component shared by the simulator, quizzes and review, so
  the interaction and keyboard path are identical everywhere
- `MasteryRing` — 5 rings; deliberately harder to misread at a glance than a
  percentage, and legible across a whole map
- `NextStepCard` (`components/map/`) — the one instruction on the screen, on both
  `/map` and Mission Control. `StudySteps` (`app/map/`) renders a phase's ordered
  steps, expanding the first unticked one so opening a phase needs no click

Keyboard paths matter because sessions are long: number keys pick options, `F`
flags, `Space` flips a card, `1–4` grades it, `⌘K` or `/` searches.

## Routes

| Route | Notes |
|---|---|
| `/` | Mission Control. Server component passes `nowMs` so the client never reads the clock in render |
| `/big-picture` | 5 layers, 7 animated flows, failure list per flow |
| `/map` | Phases gated on 3-ring average of the previous phase. `?phase=` holds the open phase, `?step=` opens and scrolls to one step |
| `/services`, `/services/[slug]` | 141 SSG pages |
| `/decoder`, `/compare` | Trigger drill; decision-tree walker |
| `/drill` | FSRS session. Seeds `srsCards` idempotently on first visit |
| `/quiz`, `/exam`, `/exam/[id]` | Immediate-feedback quiz; timed simulator; per-question review with mistake logging |
| `/labs/*` | vpc-builder, iam-puzzle, storage-cost |
| `/progress`, `/settings`, `/onboarding` | Analytics + mistake log; data; plan generator |

## Accessibility

Lighthouse is 100 for accessibility, best practices and SEO on both desktop
`/map` and mobile `/`. Keep it there:

- Every `role="progressbar"` needs an accessible name (`Progress` defaults one)
- Never use `opacity` to dim a state — see invariant 6
- `--fg-subtle` is tuned to clear 4.5:1 on raised surfaces in both themes; do not
  lighten it in dark or darken it in light without re-auditing
- Every animation is gated on `useReducedMotion()`, and reduced motion swaps
  travel animations for stepped state changes so labs stay fully usable
