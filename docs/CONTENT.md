# Adding and editing content

Content is typed data. Adding to it means editing an array and re-running the
checker — you should almost never need to write a component.

```bash
npm run content:check && npm run typecheck && npm test
```

## Where things live

| Adding | Edit | Notes |
|---|---|---|
| A service | `src/content/services/<category>.ts` | Cards generate automatically |
| A question | `src/content/questions/` — `saa-d1.ts` … `saa-d4.ts`, `dva.ts` | Every option needs a `why` |
| A trigger phrase | `src/content/triggers.ts` | Include `notThis` — the trap is the value |
| A decision tree | `src/content/decision-trees.ts` | |
| A break-it challenge | `src/engines/network/topologies.ts` | Tests assert it really breaks |
| An IAM puzzle | `src/engines/policy/puzzles.ts` | One rule per puzzle |
| A big-picture node or flow | `src/content/big-picture.ts` | Keep it ~25 nodes; the atlas is for lookup |
| A phase change | `src/content/phases.ts` | Mirrors the user's Notion roadmap — keep in sync |

## A service card

The fields that carry the teaching load, in order of value:

1. **`whenNotToUse`** — the half most study material skips, and the half that
   decides scenario questions. Never leave it empty.
2. **`examTraps`** — the specific ways this service makes a *wrong* answer look
   right. Core services should have 3+; `content:check` warns otherwise.
3. **`confusedWith`** — the pair that appears as two plausible options in one
   question, plus the dividing line. Generates `contrast` cards.
4. **`keyNumbers`** — only what generates questions. Mark anything AWS changes
   often as `volatile: true`; those are excluded from card generation and shown
   with a "verify" nudge instead of stated as fact.
5. **`oneLiner`** — one sentence, used on dense canvases and to generate the
   `whichService` card. Write it so it reads as a *requirement* when reversed.

```ts
{
  slug: 'kebab-case',                 // must match /^[a-z0-9-]+$/
  name: 'Amazon Thing',               // AWS product name, verbatim
  abbr: 'THG',                        // optional; used on dense canvases
  category: 'storage',
  certs: ['SAA-C03'],
  tier: 1,                            // see the tier system in ARCHITECTURE.md
  oneLiner: '…',
  whatItIs: '…',                      // a paragraph; explain the mechanism
  whenToUse: ['…'],
  whenNotToUse: ['…'],                // required in practice
  keyNumbers: [{ label: '…', value: '…', note: '…', volatile: false }],
  examTraps: ['…'],
  confusedWith: [{ slug: 'other', difference: '…' }],
  pricing: '…',
  docsUrl: 'https://docs.aws.amazon.com/…',   // must be a real URL
  related: ['other-slug'],
}
```

Every slug in `confusedWith`, `related` and any task's `serviceSlugs` must
resolve, and nothing may point at itself. Add the slug to the relevant task
statement in `certs/*.ts` too, or `content:check` warns that nothing references it.

## A question

The bar: it must be a **scenario**, not a definition, and every option must
explain the specific misconception it targets. "This is wrong" is not a `why`.

```ts
{
  id: 'saa-d1-021',                   // <cert>-<domain>-<n>, unique
  certs: ['SAA-C03'],
  taskId: 'saa-1.2',                  // must resolve to a real task statement
  type: 'single',                     // 'multi' needs 5+ options and 2+ correct
  difficulty: 2,                      // 1 easier, 2 medium, 3 hard
  serviceSlugs: ['nacl', 'security-group'],
  stem: '…',
  options: [
    { id: 'A', text: '…', correct: true,  why: 'Why this is right.' },
    { id: 'B', text: '…', correct: false, why: 'The specific misconception this targets.' },
  ],
  explanation: '…',                   // the RULE to remember, not a restatement
  source: 'https://docs.aws.amazon.com/…',
}
```

Enforced by schema or checker:

- Option ids must be contiguous from `A` — the keyboard shortcuts depend on it
- `single` needs exactly one correct; `multi` needs 2+ correct and 5+ options
- `explanation` should generalise. A good one is quotable in isolation.
- `explanation` may only **restate** facts the atlas already holds. If you write
  a question around a figure or a behaviour that is not yet in
  `src/content/services/*`, put it there first — a fact that lives only in an
  explanation derives no SRS card, appears in no search, and is missing from the
  quick-look panel the learner opens mid-question. `content:check` warns as
  `atlas gap: question <id> teaches "25 %" but no atlas entry for aurora
  mentions the figure`; the fix is always to add it to the service card, never
  to soften the explanation.

### How many you need

A full paper needs `round(weight% × questionCount)` per domain with no repeats:

| Cert | Domain | Need | Have |
|---|---|---|---|
| SAA-C03 | d1 Secure 30% | 19 | 40 |
| | d2 Resilient 26% | 17 | 36 |
| | d3 High-Performing 24% | 16 | 34 |
| | d4 Cost-Optimized 20% | 13 | 32 |
| DVA-C02 | d1 Development 32% | 21 | 42 |
| | d2 Security 26% | 17 | 34 |
| | d3 Deployment 24% | 16 | 32 |
| | d4 Troubleshooting 18% | 12 | 24 |

Both certs now serve **two** consecutive full 65-question papers with zero
overlap — verified by sampling twice with the first paper's ids excluded. A third
consecutive paper cannot be filled from unseen questions.

Note a sampler behaviour that matters when you extend this: `sample()` prefers
unseen questions but falls back to the full candidate set when a domain has too
few, and it does *not* report that as a shortfall. So a third paper silently
repeats rather than warning. If you add a repeat count to `SampleResult`, surface
it in `/exam` — invariant 9 says the learner should be told.

`content:check` prints exactly this and warns on shortfalls; `/exam` tells the
learner rather than repeating questions.

## A trigger phrase

The `notThis` array is the point. A phrase without its distractor is a flashcard;
with it, it is exam technique.

```ts
{
  id: 't-something',
  phrase: '"least operational overhead" · "no servers to manage"',
  means: 'What it is actually asking for.',
  slugs: ['lambda', 'fargate'],
  notThis: [{ slug: 'ec2', why: 'Why this plausible answer is what the phrase rules out.' }],
  certs: ['SAA-C03'],
  domainIds: ['saa-d2'],
}
```

## A break-it challenge

```ts
{
  id: 'kebab-id',
  title: 'What you are doing to the topology',
  question: 'The prediction to make before pressing send.',
  apply: (t) => { /* mutate the cloned topology */ return t },
  expectDelivered: false,
  answer: 'Why it happens, and the concept it proves.',
}
```

`route.test.ts` asserts every challenge produces `expectDelivered`, and that a
dropped packet's last hop names a `blockedBy` **and** a `fix`. If `VpcLab` sends a
non-default packet for your challenge, add the mapping in the test's ternary.

## Writing register

The content carries the pedagogy, so the prose matters:

- Explain the **mechanism**, not the marketing. "A subnet is public because its
  route table sends 0.0.0.0/0 to an internet gateway" beats "public subnets are
  internet-facing".
- Name the trade-off. Every service card should make clear what you give up.
- No hedging and no breathlessness. No emoji in content prose.
- Say when something is an estimate, a soft quota, or our framing rather than
  AWS's. The `blurb` fields are explicitly ours; the task-statement bullets are
  explicitly verbatim — do not blur that line.

## Verbatim content — do not paraphrase

Domain titles, task-statement titles and every "Knowledge of" / "Skills in"
bullet in `certs/*.ts` are copied from the official AWS exam guides:

- SAA-C03 — <https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html>
- DVA-C02 — <https://docs.aws.amazon.com/aws-certification/latest/developer-associate-02/developer-associate-02.html>

If AWS revises a guide, re-fetch and diff rather than editing from memory. Note
DVA states its content as numbered *skills* rather than SAA's Knowledge/Skills
split, which is why `knowledge` is empty for DVA tasks by design.
