# The lesson batches — what was written, and why in that order

Moved out of [`LESSONS.md`](LESSONS.md) once every batch was marked done. It stopped
being a queue and became a record, and a record does not need re-reading before each
lesson — [`LESSONS.md`](LESSONS.md) keeps a one-line summary of each batch and the
process around it.

Read a batch's entry when you are writing the *next* lesson on that subsystem: it says
which brief was used, what the diagrams settled on, and which decisions were argued out
already.

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

### Batch 5 — serverless and events (the DVA weight) _(done)_

`npm run lesson:brief -- lambda api-gateway sqs sns eventbridge step-functions`

All three written: `lambda-execution-model`, `queue-topic-bus` and
`retries-dlqs-and-idempotency` — 48 sections and 12 checks, 45 minutes. The
first batch tagged `families: ['saa', 'dva']`, and the first three lessons in
the corpus to carry a DVA task statement, so `phase-4` stops being the one phase
with no lesson on it. Not a linear chain: the first two are independent and the
third declares `requires` on **both**, which is what the material actually does.

| Lesson                         |                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lambda-execution-model`       | The execution environment outlives the invocation, and every other Lambda fact follows from it. Template B fan-in-the-middle — the same request twice, forking on whether one exists. |
| `queue-topic-bus`              | Two walkthroughs: a queue delivering to exactly one consumer, then a topic turning one publish into two. Template B fan-at-the-end, then fan-in-the-middle.                           |
| `retries-dlqs-and-idempotency` | A duplicate charge produced by a timeout setting rather than a bug. Template B fan-in-the-middle read as a clock.                                                                     |

Three things this batch cost that the next one need not.

**A lesson's `families` and its `taskId` do not have to agree, and the checker
only requires that the task resolves on _one_ paper the lesson is in scope for.**
All three here are `['saa', 'dva']`, two carry DVA tasks and one carries
`saa-2.1`. Nothing filters `lessonIds` by family at the step or phase level, so
a DVA-tasked lesson listed on an SAA step still renders — which is what makes
the dual tagging safe, and it is worth knowing before agonising over the choice
the way `BACKLOG.md` did for batches 2 and 3.

**Curly apostrophes are the house style in lesson prose.** Sixteen files use `’`
and nothing enforces it; a straight `'` introduced by a search-and-replace is
invisible to every gate and visible on screen next to a curly one.

**Phase 4 is invisible on `/map` under the SAA cert**, so verifying a DVA
wiring in the browser means flipping `profile.targetCert` to `DVA-C02` in
IndexedDB and back again. Curling the route does not help — phase selection is
client-side, so the served HTML is always phase 0.

### Batch 6 — data and cost _(done)_

`npm run lesson:brief -- dynamodb elasticache cloudfront savings-plans spot`

All three written: `partition-keys`, `where-to-cache` and
`paying-less-for-the-same-thing` — 48 sections and 12 checks, 46 minutes. Not a
chain: all three declare `requires: []`, because nothing here depends on
anything else here. Two are `['saa', 'dva']` and one is SAA-only, which is what
the material actually is — Spot and Savings Plans are not on the developer paper.

| Lesson                           |                                                                                                                                                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `partition-keys`                 | Throughput is per partition, not per table. Template B fan-in-the-middle — the identical thousand writes a second, forked on nothing but the attribute chosen as the key.                                                               |
| `where-to-cache`                 | CloudFront, ElastiCache, API Gateway and DAX — four caches, four distances from the user. Two walkthroughs: template B fan-at-the-end for one request travelling inward, then fan-in-the-middle for lazy loading against write-through. |
| `paying-less-for-the-same-thing` | On-demand, Spot, Savings Plans, Reserved — a decision, not a price list. Template B fan-in-the-middle, forked on one question asked of each hour of capacity.                                                                           |

Three things this batch cost that a later one need not.

**A `kind: 'service'` node id must resolve to a slug, and a plain-English id
will not.** `table`, `app` and `commit` all failed `content:check` with _"node X
is kind service but resolves to no service slug"_. The fix is either the real
slug as the id — `dynamodb`, `savings-plans`, which is what the longest-prefix
rule is for — or `kind: 'note'` when the box is not an AWS service at all, which
is what "Your application" actually is. Decide that when placing the node, not
after the checker says so.

**DAX and API Gateway caching have no slugs of their own**, and neither needed
one. DAX is a `keyNumber` and a trap on `dynamodb`; the API Gateway cache is a
`keyNumber` and an `optionSet` gotcha on `api-gateway`. `lesson:brief` prints
both when you ask for the parent, which is the case the brief's "ask for the
parent" note was written for — and it means a four-cache lesson needs four
`serviceSlugs` and no new atlas entry.

**A fact that exists only in a question's takeaway is not in the atlas, and a
lesson may not use it.** "DAX does not accelerate strongly consistent reads"
comes from `dva-d4-010`, not from the `dynamodb` entry, so it is deliberately
absent here. Invariant 23 permits restating the atlas and the concepts; a
question explanation is neither. The honest options are to leave it out or to
add it to the atlas first — and adding it changes `cards`, which is a bigger
decision than one sentence in one lesson.

After batch 6 the tier-1 services with real question weight are covered. Tier 2
and 3 stay in the atlas: a lesson is expensive and they are recognise-only.

### Batch 7 — the developer cluster _(done)_

```bash
npm run lesson:brief -- api-gateway cognito
npm run lesson:brief -- codepipeline codebuild codedeploy
npm run lesson:brief -- cloudwatch xray cloudtrail
npm run lesson:brief -- deployment-strategies    # the concept the CI/CD lesson leans on
```

The batch the previous paragraph here asked for: DVA coverage beyond Lambda,
messaging, keys and caching. All four written: `api-gateway-request-path`,
`user-pool-or-identity-pool`, `shipping-a-change-safely` and
`metrics-traces-and-logs` — 70 sections and 16 checks, 66 minutes. Not a chain;
all four declare `requires: []`. Three are `['saa', 'dva']` and
`shipping-a-change-safely` is the corpus's first **DVA-only** lesson.

| Lesson                       |                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api-gateway-request-path`   | 429, 502 and 504 as three points on one path rather than three numbers. Template B fan-in-the-middle, forked on which of the two things the front door calls is the one that ends the request.    |
| `user-pool-or-identity-pool` | The same JWT going two places. Template B fan-in-the-middle again — the branches _are_ the two pools, which is what makes the shape earn its place rather than being reused.                      |
| `shipping-a-change-safely`   | Two walkthroughs: the division of labour as a plain four-node chain at `rows: 3`, then the canary release as template B fan-at-the-end, forked on what the alarm says.                            |
| `metrics-traces-and-logs`    | One slow checkout asked two ways. Template B fan-in-the-middle; CloudTrail arrives last and deliberately without a diagram, because its whole contribution is that it is _not_ on the path drawn. |

Three things this batch cost that a later one need not.

**The inline formatter does not nest.** A code span inside a bold span renders
its backticks literally — a bolded sentence with a code span inside it came out
on screen with the backticks visible. Nothing catches it: `content:check` sees a
valid string, and it took a text-node scan in the browser to find. Keep code
spans and bold spans as siblings, never one inside the other.

**A status code is a fact, and only some of them are in the atlas.** The first
draft of the API Gateway diagram ended a rejected request at a `403`, which is
in a question takeaway and in no atlas entry — so it would have been the lesson
introducing a fact (invariant 23). 429, 502 and 504 _are_ on the entry; 401 and
403 are not. The node became "Rejected at the edge" instead, which is a
restatement of `whenToUse`, and it teaches better anyway.

**Not every service the lesson names belongs in `serviceSlugs`.** The Cognito
lesson draws API Gateway, Lambda and S3 boxes and restates no fact from any of
those entries, so `serviceSlugs` is `['cognito']` alone — a diagram node is not
a promise about backlinks, and only `serviceSlugs` is. Same rule batch 4 wrote
down, applied to nodes rather than to a study step's service list.

### Batch 8 — the long tail _(done)_

```bash
npm run lesson:brief -- cloudformation sam
npm run lesson:brief -- ecs fargate
npm run lesson:brief -- kinesis-data-streams
npm run lesson:brief -- step-functions
```

The four items the paragraph here used to list as "a long tail rather than a
cluster". All four written: `templates-and-stacks`, `two-roles-and-no-servers`,
`queue-or-stream` and `orchestrate-dont-chain` — 65 sections and 16 checks, 65
minutes. All four are `['saa', 'dva']`; only `queue-or-stream` declares a
prerequisite (`queue-topic-bus`), because it is the one that starts from a shape
another lesson already established.

| Lesson                     |                                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `templates-and-stacks`     | One update, and the two things it can do to a resource. Template B fan-in-the-middle, plus a plain four-node chain at `rows: 3` for the SAM transform — deliberately with **no** steps, because the claim is that there is only one destination. |
| `two-roles-and-no-servers` | The two moments IAM is consulted while a task starts. Template B fan-in-the-middle for the roles, then fan-at-the-end for the launch types, the second one stepless for the same reason.                                                         |
| `queue-or-stream`          | One event sent two ways, stopping at the moment the second consumer looks. Template B fan-in-the-middle.                                                                                                                                         |
| `orchestrate-dont-chain`   | One failing step in two designs. Template B fan-in-the-middle, forked on where the state lives.                                                                                                                                                  |

Three things this batch cost that a later one need not.

**The nesting bug from batch 7 has three more shapes, and only one of them was
written down.** A `[[slug]]` inside a `**bold**` span renders its brackets
literally; so does a code span inside a bold span; and so does a code span
inside an `*italic*` span. Five strings across three of these lessons hit it and
every gate passed. The cheap detector is a text-node walk in the browser —
`document.querySelectorAll('*')`, skip `script` and `pre`, and report any text
node matching ``/\[\[|\*\*|`/`` — which finds all three shapes in one pass and
costs no screenshot. Run it against every page in the batch before looking at
anything.

**`diagram:audit` cannot see that an edge crosses a node it has nothing to do
with.** The Step Functions walkthrough first drew its dead-end edge from the
_fork_ node to the far-right box, so it passed straight over the branch node
between them and collided with the other branch's label. The audit was clean;
the browser was not. When both branches of a fan-in-the-middle end in a tail,
draw the tail from the branch node, never from the fork — the geometry is legal
either way and only one of them reads.

**A `DiagramEdge` written as a TypeScript literal must spell out `tone`**, the
same way `groups: []` must be spelled out (batch 2). The zod default applies to
parsed data, not to an object literal typed as `Lesson`, and seven edges across
the batch failed `typecheck` — after `content:check` and `diagram:audit` had
both passed, because both of those parse.

What is left after this batch is a second rank rather than a tail: DNS and the
Route 53 routing policies, joining networks together (peering, Transit Gateway,
PrivateLink), Auto Scaling and what it cannot fix, migration and hybrid, and
secrets and configuration in code. Each is a study step with no lesson on it
today. The list in this document has stopped being a queue and is now a record.
