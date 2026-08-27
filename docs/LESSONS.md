# Writing the next lesson

The first lesson (`security-groups`) cost far more than it should have, and most
of that cost was **not** writing it. This document exists so the next twenty do
not repeat it. Read this before starting one; it replaces exploring the codebase.

For the _shape_ of a lesson — which section kinds, in what order, and why —
see [`CONTENT.md` § A lesson](CONTENT.md). This document is the **process**.

---

## Where the first lesson's effort actually went

Ranked, largest first, from what the session actually did:

1. **Re-reading content files to find facts.** A lesson introduces no facts
   (invariant 23), so writing one is entirely selection and ordering. Finding the
   material meant reading `services/network.ts`, `concepts/networking.ts`,
   `triggers.ts` and a questions file — thousands of lines, to use about sixty.
   **Fixed:** `npm run lesson:brief`.
2. **Getting diagram geometry right by screenshotting.** Every layout bug — a
   node that looked like it was inside the VPC, four labels sitting on top of
   nodes, a return arrow drawn through three group boxes, a third of a frame
   empty — was found by rendering in a browser, looking, nudging coordinates and
   rendering again. Each cycle costs a screenshot and a rebuild.
   **Fixed:** `npm run diagram:audit`.
3. **Discovering the machinery.** Which schema, which renderer, which registry
   naming rule, which invariants apply, where XP is awarded, how `ServiceRef`
   works. Paid once. **Fixed:** this document plus `CONTENT.md`.
4. **Bugs in the shared renderer.** Real, worth the cost, and now paid: arrowheads
   never rendered, labels were placed centre-to-centre, elbow labels were placed
   on the wrong line. Not recurring.
5. **Writing the lesson.** The part that is actually the work, and the smallest
   share of it.

The pipeline below is arranged so that 1–3 are near zero and step 5 is most of
the effort.

---

## The pipeline

### 1. Pick a batch, not a lesson

Lessons that share a subsystem share a brief, share diagram coordinates, and
share the invariants you have just loaded into your head. Writing four related
lessons in one pass costs far less than four times one lesson. The batches are
listed at the bottom of this document.

### 2. Get the brief

```bash
npm run lesson:brief -- sqs sns eventbridge
npm run lesson:brief -- s3 --questions      # --questions adds full stems
```

That prints, for every slug: the atlas entry, `keyNumbers` to copy verbatim,
`optionSets`, `examTraps` (each a candidate `trap` callout), `confusedWith` (each
a candidate `compare` row), the concepts it assumes, every `cardId` to cite, the
trigger phrases the exam actually uses, the `taskId` candidates, and the takeaway
of every question in the bank that touches it.

A brief slug must be a **service or concept slug**. Some things the exam names are
facts on a parent entry rather than entries of their own — DAX is a `keyNumber` on
`dynamodb`, gateway endpoints are traps on `route-table` — so ask for the parent
and the brief prints them.

**Do not read the content files.** If the brief does not contain a fact you want,
that is the signal to add it to the atlas — not to the lesson. Add it there, and
`cards.ts` derives the card, search finds it, and the quick-look panel shows it.

### 3. Write the file

Copy `src/content/lessons/security-groups.ts` and keep its section order —
[`CONTENT.md`](CONTENT.md) explains why each position is where it is. Add one
line to `src/content/lesson-registry.ts`.

Diagram coordinates: **do not invent them.** Use a template below.

### 4. Check it — no browser

```bash
npm run content:check     # ids resolve, checks well-formed, walkthrough sane
npm run diagram:audit     # geometry: overlaps, labels, dead space
npm run typecheck
npx eslint src scripts
npx prettier --write src/content/lessons/<id>.ts
```

Loop on `content:check` and `diagram:audit` until both are clean. They are text,
they are fast, and between them they catch every mistake the first lesson made
except one — see step 5.

**No unit test.** A lesson is data validated by `content:check`; a test would
assert the same thing twice and break every time a sentence is reworded. The
engines (`trace.ts`, `layout.ts`) are tested because they are logic; content is
not. Do not add `*.test.ts` for a lesson.

### 5. One browser pass, at the end

Only once the two checks are clean, and only once per batch:

```bash
npm run dev
```

Open each lesson, read it top to bottom, and step the walkthrough. Look for the
one class of problem no script can catch: **whether the order actually teaches**.
Does the picture land before the definition? Does the payoff step read as a
payoff? Take **one** full-page screenshot per lesson at most.

Token traps in this step, all of which the first lesson hit:

- **Never take a full-page accessibility snapshot** (`take_snapshot`) of a
  lesson. It returns the entire text of the page as a tree — enormous, and you
  wrote the text. Use `evaluate_script` returning a small object instead.
- **Do not screenshot to check geometry.** That is `diagram:audit`'s job now.
- Prefer `evaluate_script` for facts (`heading order`, `dl` validity, XP moved,
  step index changed) over screenshots for impressions.

### 6. Ship

```bash
npm run content:fingerprint   # the `lessons` part changes; nothing else should
npm run build                 # +1 page per lesson
```

`npm test` only if you touched an engine. `npm run build` catches nothing
`typecheck` did not, for a content-only change — run it once per batch, not per
lesson.

---

## Diagram templates

Three shapes cover almost everything, and all three are in
`security-groups.ts` already auditing clean. Copy the coordinates; change the
labels. Then run `npm run diagram:audit` — it will tell you if you broke them.

### A. Request and reply — for anything about direction or state

Two nodes, the request an **elbow**, the reply a **straight diagonal**. The
shapes must differ: two elbows between the same pair draw on top of each other,
and `diagram:audit` says so. `steps` makes it a walkthrough.

```
internet  x 0.4  y 0.4  w 3.2  h 1.3      cols 13  rows 6
target    x 8.6  y 3.4  w 3.0  h 1.3
edge req: internet → target, elbow: true
edge res: target → internet            (no elbow — the diagonal is the point)
```

Nest the target in `vpc → subnet → sg` groups with **`nodeIds: []` on all but
the innermost**; each level adds padding, so three levels read as containment.

### B. Left-to-right chain, fanning out at the end — for tiers and pipelines

Spacing is chosen so edge labels land in the gaps between boxes. Narrower gaps
put labels on top of nodes.

```
cols 19  rows 8
a  x  0.2  y 3.3  w 2.8  h 1.3      (outside every group)
b  x  5.4  y 3.3  w 2.8  h 1.3
c  x 10.4  y 3.3  w 3.0  h 1.3
d  x 15.2  y 0.9  w 3.0  h 1.3      (fan up)
e  x 15.2  y 5.7  w 3.4  h 1.3      (fan down)
```

Batch 1 added a variant that also audits clean, for when the **fan is in the
middle** — two parallel tails that are the same journey with a different object at
the junction (`srt-two-tables` in `subnets-and-route-tables.ts`):

```
cols 21  rows 8
a  x  0.2  y 3.3  w 2.8  h 1.3      (outside every group)
b  x  5.4  y 3.3  w 3.4  h 1.3
c  x 11.0  y 0.9  w 3.2  h 1.3      (junction, up)
d  x 11.0  y 5.7  w 3.2  h 1.3      (junction, down)
e  x 17.0  y 0.9  w 3.0  h 1.3      (tail, up)
f  x 17.0  y 5.7  w 3.0  h 1.3      (tail, down)
```

Two things that cost a round of audit there, both worth knowing in advance:
**a self-edge cannot carry a legible label** — a packet that dies needs a node to
die at, which is also better teaching — and **edge labels want a gap of about 2.5
grid units**, so `the packet` fits between two boxes where
`where does this go?` does not. Shortening the label is usually the right fix;
the caption is where the sentence belongs.

**A node that should be outside a group must be well clear of it.** A group's
rectangle is the union of its members' boxes plus padding, so a node placed level
with the group's members lands inside the rectangle and reads as a member.
`diagram:audit` reports this as _"node X sits inside group Y but is not in it"_ —
it is the single most misleading layout bug, and it is invisible in the data.

### C. Two peers in one container — for "the boundary is not where you think"

```
cols 10  rows 3                      (deliberately under-declared: `viewBox`
a  x 1  y 1.4  w 2.8  h 1.3           unions the grid with the content, so
b  x 7  y 1.4  w 2.8  h 1.3           under-declaring crops, over-declaring
                                      leaves dead space)
```

### Rules that are not obvious

- **`cols`/`rows` are a minimum, not a frame.** `viewBox` unions them with the
  content. Over-declare and you get an empty third of a frame;
  `diagram:audit` reports the pixel count and which value to lower.
- **Group labels do not wrap.** A long one runs out of its box. Keep them to
  about 30 characters; put the explanation in `caption`.
- **Edge labels are centred on the midpoint of the clipped segment.** Keep them
  short and leave a gap between the boxes they sit between.
- **Only use `steps` when the sequence is the teaching.** If the whole picture
  must be seen at once, leave `steps: []`. `content:check` fails a walkthrough
  with an edge no step lights, because it would never be drawn.
- A `kind: 'service'` node id must resolve to a real slug, by longest prefix —
  so `ec2-a` and `ec2-b` both resolve to `ec2`.

---

## Prose that is worth the tokens

The first lesson's format works because of a few specific moves. They are cheap
to repeat and they are what the atlas cannot do:

- **Show, then name.** The diagram of a reply arriving with no outbound rule
  comes before the word "stateful". A named idea is something to memorise; a seen
  idea is something you know.
- **Read the block out line by line.** A `code` section followed by a `steps`
  section that takes one line each. Dense syntax is legible one line at a time
  and opaque as a block.
- **Write the wrong answer as real syntax, then reject it.** "There is no deny
  rule" is a sentence. A deny rule written out with `<-- there is no such column`
  is a demonstration.
- **`compare` last.** A table before both halves are understood is something to
  memorise. After, it is a summary of what you just followed.
- **Say what the exam does with it.** Every lesson should contain at least one
  "if the question says X, the answer is not Y" — that is the whole reason a
  study tool differs from documentation.
- **Use `[[slug|display text]]`** when the short label reads badly mid-sentence.
  `[[security-group]]` renders "SG", and "a SG is a firewall" is not a sentence.

---

## The batches

Ranked by questions in the bank that touch each service, which is the best proxy
available for exam weight. Each batch is one `lesson:brief` call and one browser
pass. Sizes are the four to six sections that carry the idea, not a limit.

### Batch 1 — the reachability cluster _(done)_

`npm run lesson:brief -- vpc subnet route-table nat-gateway internet-gateway nacl`

All four written: `security-groups`, `subnets-and-route-tables`,
`why-cant-it-reach-the-internet` and `network-acls`. Worth reading as a set
before writing batch 2 — they are the only worked examples of a lesson that
_depends_ on another (`requires`), and of the same template A coordinates reused
deliberately so the reader recognises the picture and notices what moved.

### Batch 2 — identity, the highest-value cluster on the paper _(done)_

`npm run lesson:brief -- iam sts organizations secrets-manager kms`

All three written: `how-iam-decides`, `roles-not-keys` and
`kms-and-envelope-encryption` — 61 sections and 12 checks, 39 minutes. Both of
the latter declare `requires: ['how-iam-decides']`, so this is the first
three-lesson chain in the corpus.

| Lesson                        |                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `how-iam-decides`             | Explicit deny → SCP → resource policy → allow → implicit deny, as a walkthrough down one request. Template A, exactly as predicted here. |
| `roles-not-keys`              | Why an access key in an environment variable is the wrong answer to every question. Template B, the fan-at-the-end variant.              |
| `kms-and-envelope-encryption` | Two keys, and which one leaves the region. Template B fan-in-the-middle, plus template C for the two Regions.                            |

Three things this batch cost that the next one need not.

**Only `md` fields and `compare` cells go through `formatMd`.** A `steps` item
`title`, a `compare` row `label` or column heading, and every string in a
`check` — prompt, option text, `why` — render as plain text, so a backtick or a
`[[slug]]` in one of them appears on screen verbatim. `content:check` does not
catch it, because the slug resolves perfectly well; only the browser does. Write
those fields as plain prose and keep the markup in the `md` beneath them.

**A `DiagramSpec` written as a TypeScript literal must spell out `groups: []`**
even when it has none. The zod defaults apply to parsed data, not to an object
literal typed as `Lesson`, and the omission crashes `content:check` inside
`checkDiagram` with a bare `Cannot read properties of undefined` that names
neither the lesson nor the diagram.

**A lesson cannot link to another lesson** — there is no `[[lesson-id]]`. Name
it in bold by its title and let `requires` and `/learn` carry the navigation.

### Batch 3 — storage, where the exam asks you to choose _(done)_

`npm run lesson:brief -- s3 ebs efs s3-glacier`

All three written: `block-file-object`, `s3-storage-classes` and
`s3-durability-vs-availability` — 46 sections and 11 checks, 39 minutes. The
first chain where every lesson depends on the one before it, so the order on
`/learn` is the order to read them in.

| Lesson                          |                                                                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `block-file-object`             | Three shapes of storage and the sentence in a requirement that picks each. Template B fan-in-the-middle for the second server, plus template C for "S3 is not in the VPC".                          |
| `s3-storage-classes`            | The `optionSet` already holds the table; the lesson is the _decision_, driven by what the requirement says about access pattern. Template B with **no** fan — a plain four-node chain at `rows: 3`. |
| `s3-durability-vs-availability` | Eleven nines of one thing is not the other thing. Template B fan-in-the-middle again, because the claim being made _is_ "the same journey, differing at one point".                                 |

Two things this batch cost that the next one need not.

**A caret line in a `code` block must sit directly under what it points at**, and
"directly" means counting the columns rather than eyeballing them. Both wrong-answer
blocks were written with the annotation a line or two below its target and the
carets a few columns off; nothing catches it — `content:check` sees a valid
string and `diagram:audit` never looks at code — and in the browser it reads as a
stray row of punctuation. Compute the index of the token and pad to it.

**An `optionSet` on the service is a reason to pick different `compare` axes, not
a reason to skip `compare`.** The seven storage classes are already a derived
table (invariant 21), so a class-by-class comparison here would have been a second
copy of it. The retrieval windows are not on that table — they live in
`s3-glacier`'s `keyNumbers` — so "the window the question names → the retrieval
you must ask for" is a table the option set cannot render, and it is the one
`saa-d4-001` actually tests.

### Batch 4 — resilience, the largest SAA domain _(done)_

`npm run lesson:brief -- rds aurora elb ec2-auto-scaling route53`

All three written: `multi-az-vs-read-replica`, `rto-rpo-and-the-four-dr-strategies`
and `which-load-balancer` — 60 sections and 12 checks, 44 minutes. A linear chain
like batch 3, so the order on `/learn` is the order to read them in. The concept
brief is a second call worth making here: `npm run lesson:brief -- rto rpo
dr-strategies multi-az-vs-multi-region high-availability-vs-fault-tolerance`
prints the entire DR lesson's material, and none of it is on a service entry.

| Lesson                               |                                                                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `multi-az-vs-read-replica`           | Two features that both make a second database and solve different problems. Template B fan-in-the-middle — the claim _is_ "the same journey, differing at one point" — plus template C for the Region. |
| `rto-rpo-and-the-four-dr-strategies` | Two numbers that choose an architecture. Two walkthroughs: one failure with an arrow going each way, then the four strategies as rungs you switch on in order.                                         |
| `which-load-balancer`                | Four of them; the `optionSet` is the table, the lesson is the layer. Template B fan-in-the-middle again, forking at the point where the request is opened.                                             |

Three things this batch cost that the next one need not.

**A lesson's material may be entirely on concept entries, and `lesson:brief`
takes concept slugs.** The DR lesson restates `rto`, `rpo` and `dr-strategies`
and almost nothing from a service card, so the service brief for the batch was
the wrong brief for one third of it. Ask for the concepts by slug rather than
inferring them from the "concepts this service assumes" list, which prints one
line each and not the `keyNumbers` you need.

**`serviceSlugs` is a promise about backlinks, not a topic list.** The DR lesson
was first written with `['rds', 'route53', 'backup', 's3']` because those are the
step's services — which put a link to it on the S3 and AWS Backup atlas entries,
for a lesson that names neither. Put a slug there only if the lesson actually
restates that entry's facts; the browser pass is where this shows up, because
`content:check` sees four slugs that resolve perfectly well.

**A second walkthrough in one lesson is fine, and cheap.** `traceAt` is per
diagram, so two `steps` diagrams on one page advance independently. The audit and
the checker both handle it, and the only cost is remembering that the reader has
to press two play controls rather than one.

### Batch 5 — serverless and events (the DVA weight)

`npm run lesson:brief -- lambda api-gateway sqs sns eventbridge step-functions`

| Lesson                         |                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `lambda-execution-model`       | Cold start, concurrency, and why the handler must be idempotent.              |
| `queue-topic-bus`              | SQS vs SNS vs EventBridge — the most-confused trio in the corpus. Template B. |
| `retries-dlqs-and-idempotency` | What happens on the second delivery.                                          |

### Batch 6 — data and cost

`npm run lesson:brief -- dynamodb elasticache cloudfront savings-plans spot`

| Lesson                           |                                                                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `partition-keys`                 | Why the key choice is the whole design.                                                                                                                                                |
| `where-to-cache`                 | CloudFront, ElastiCache, API Gateway and DAX — four caches, four distances from the user. DAX has no slug of its own; its facts are on the `dynamodb` entry, so the brief prints them. |
| `paying-less-for-the-same-thing` | On-demand, Spot, Savings Plans, Reserved — a decision, not a price list.                                                                                                               |

After batch 6 the tier-1 services with real question weight are covered. Tier 2
and 3 stay in the atlas: a lesson is expensive and they are recognise-only.

### Wiring a lesson in, once it exists

Three places, all in `phases.ts` unless noted, and none of them optional — an
unwired lesson is reachable only from `/learn` and from a search someone has to
know to type:

1. The **step** that teaches its idea gets `lessonIds: ['<id>']`. This is a field
   of its own rather than an entry in `reading` (whose minutes are budget-checked
   against external pages) or in `actions` (which is where the _practice_
   happens). The roadmap renders it above the reading list. If the step's budget
   does not cover the lesson on top of its docs, raise the budget — do not
   quietly assume the reader reads faster.
2. The **phase** gets the id in `lessonIds`. `RoadmapView` renders that as
   "Lessons in this phase". A lesson revisited by a later phase's step should be
   listed on that phase too, so the card and the step agree.
3. `/learn`'s closing paragraph in `src/app/learn/page.tsx` names which clusters
   are covered and which are not. The counts are derived; that sentence is not,
   deliberately — a generated list of covered services would be accurate and
   would not tell a learner what is still missing.

Nothing else needs touching: ⌘K picks lessons up from the registry, and every
atlas entry for a slug in `serviceSlugs` grows a link back on its own.
