# AWS Trainer — SAA-C03 & DVA-C02

A learning app for the AWS Solutions Architect Associate and Developer Associate
exams. Built on one idea: reading produces recognition, and the exam tests
*recall* under time pressure against four plausible options. So everything here
is built around retrieval, not reading.

Runs entirely in the browser. No backend, no account, no API keys, no AWS bill.

```bash
npm install
npm run dev          # http://localhost:3000
```

## What's in it

| | |
|---|---|
| **Big Picture** | Every layer of a real AWS system on one canvas, tinted by your own mastery, with seven traceable flows (a web request, private egress, async work, identity, AZ failure, where the money goes) and the failure symptom for each hop. |
| **Roadmap** | Five phases over ~22–29 weeks, gated on mastery. Foundations → core services → build & break → exam prep → DVA delta. |
| **Service Atlas** | 141 in-scope services, tiered by how deeply you actually need each one. Every card carries when *not* to use it, the numbers to memorise, the exam traps, and the services it gets confused with. |
| **Concepts** | 37 primitives the exam assumes and never defines — CIDR, subnet, route table, RTO and RPO, consistency, idempotency, ARNs. Each one leads with the sentence that decides questions rather than a definition, and every service card links back to the ones it takes for granted. |
| **Keyword Decoder** | 47 trigger phrases — the wording that gives the answer away — each with the plausible option it was engineered to make you pick instead. |
| **Decision Trees** | Which compute / database / storage / integration / edge service, walked one question at a time. |
| **Recall Drill** | 1,709 cards, scheduled with FSRS-6. Derived from the atlas, so they can never contradict it. |
| **Exam Simulator** | 65 questions in 130 minutes, sampled to the real domain weighting, resumable after a reload. Scaled-score estimate, per-domain breakdown, marks-at-stake advice. |
| **Labs** | VPC packet tracer (build it, then break it seven ways and predict the symptom), IAM policy puzzle (predict the decision, then read the evaluation trace), storage & teardown cost lab. |
| **Progress** | Mastery per domain and service, readiness forecast, activity heatmap, exam-score trend, and a mistake log clustered by service. |

## Content

Domain titles, task statements and every "Knowledge of"/"Skills in" bullet are
verbatim from the official AWS exam guides. The tiering, traps, trigger phrases
and questions are written for this app.

```
141  services       37  concepts
656  key numbers   561  exam traps
274  questions      47  trigger phrases
 27  task statements  5  decision trees   3  labs
1,709 spaced-repetition cards (derived)
```

`npm run content:check` validates every piece of content against its zod schema
and fails on a dangling reference — a question pointing at a renamed task
statement is a build error, not a blank screen the night before your exam. It
also warns when the question bank cannot fill a full paper for a certification.
SAA-C03 has 142 questions and DVA-C02 has 132 — two consecutive full papers each,
with no question repeated between them.

## Architecture

Full map in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). In brief:

```
src/
  content/            All teaching content, validated by zod
    schema.ts           The contract — types + validators
    certs/              SAA-C03 and DVA-C02 domain/task trees (verbatim)
    services/           141 service cards, by category
    service-registry.ts Aggregate (deliberately not services/index.ts)
    concepts/           37 primitives the exam assumes, by group
    concept-registry.ts Aggregate (same rule as service-registry.ts)
    questions/          Exam-format questions, every option explained
    cards.ts            SRS cards *derived* from services + concepts
    triggers.ts         Keyword decoder
    decision-trees.ts   Which-service-should-I-use trees
    big-picture.ts      The layered system view and its flows
    phases.ts           The learning path
    idle-costs.ts       What a forgotten lab costs per month
  engines/            Pure, unit-tested logic — the app's spine
    policy/             IAM evaluation with a full decision trace
    network/            VPC packet simulator with hop-by-hop reasons
    srs/                FSRS-6 scheduling policy and queue building
    exam/               Domain-weighted sampling and scaled scoring
    progress/           Mastery and readiness
    plan/               Study-plan and daily-mission generation
    gamify/             XP, levels, streaks, achievements
  db/                 Dexie schema + one repo per table
  components/         UI primitives, shell, shared question card
  app/                Routes
```

The engines are the interesting part. They are plain TypeScript with no React
and no I/O, which is why they can be tested properly:

```bash
npm test        # 104 tests
```

Notably the IAM evaluator implements the real rule order — explicit Deny →
SCP/boundary/session ceiling → Allow → implicit deny, with cross-account needing
both sides — and returns the line that decided it. The network simulator answers
"why was this dropped, and how do I fix it" rather than just pass/fail.

## Data

Everything lives in this browser's IndexedDB. Nothing is sent anywhere, which is
why there is no account — and also why clearing your browser data would lose your
progress. **/settings has an export, and it is the only backup that exists.**

## Adding content

Content is data, so adding to it is editing a typed array and re-running the
checker. Full guide, including the quality bar for questions and the per-domain
counts a full paper needs: [`docs/CONTENT.md`](docs/CONTENT.md).

- **A service** — add to the right file in `src/content/services/`. Cards for its
  numbers, traps and confusions are generated automatically.
- **A concept** — a primitive that is not an AWS service goes in
  `src/content/concepts/`, in the group file it belongs to and after anything it
  depends on. `keyIdea` is the load-bearing field: state the rule that decides
  questions, not a dictionary definition.
- **A question** — add to `src/content/questions/`. Every option needs a `why`
  explaining the specific misconception it targets, and `taskId` must resolve.
- **A trigger phrase** — add to `src/content/triggers.ts`, including the trap.
- **A lab break-it challenge** — add to `breakIts` in
  `src/engines/network/topologies.ts`. The test suite asserts every challenge
  actually breaks what it claims to.

Then:

```bash
npm run content:check
npm run typecheck
npm test
```

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build and serve |
| `npm run typecheck` | TypeScript, strict |
| `npm test` | Vitest over the engines |
| `npm run content:check` | Schema + referential integrity + coverage report |

## Working on this

| | |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Invariants that bite if undone — read first |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Content model, engines, data flow, routes |
| [`docs/CONTENT.md`](docs/CONTENT.md) | How to add services, questions, triggers, labs |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | What is built, what is not, and what to do next |

## Notes on accuracy

Every service card links the AWS documentation page it was written against, and
every question carries a source link. Figures AWS changes often (soft quotas) are
marked "verify" in the UI rather than presented as fact. The scaled-score
estimate is a linear model anchored at 72% raw = 720, because AWS does not
publish its scaling — the UI says so wherever a score appears.

Confirm the current exam code, price, question count and duration in your AWS
Certification account before booking, rather than trusting any guide, including
this one.
