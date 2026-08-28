import type { Lesson } from '../schema'

/**
 * Almost everything the exam asks about Lambda is a consequence of one fact:
 * the execution environment outlives the invocation. Cold starts, the two
 * concurrency settings, "initialise your SDK client outside the handler", and
 * the reason a retry can see state a previous request left behind are all the
 * same sentence read from different angles.
 *
 * So the environment is shown before it is named. The walkthrough is the same
 * request twice — once with nothing to run it on, once with the environment
 * from the first still sitting there — and only then does the word "cold start"
 * appear. The handler is read out line by line afterwards, because the position
 * of a line in that file is the whole teaching and a block hides it.
 *
 * The `optionSet` on `lambda` already holds the concurrency table (invariant
 * 21), so `compare` here takes the axis the table cannot: the symptom quoted in
 * a stem, and the diagnosis it is pointing at.
 */
export const lambdaExecutionModel: Lesson = {
  id: 'lambda-execution-model',
  families: ['saa', 'dva'],
  taskId: 'dva-1.2',
  cluster: 'serverless-and-events',
  title: 'What actually runs your Lambda function',
  subtitle:
    'The environment outlives the invocation, and almost every Lambda question on either paper is that one fact wearing a different hat — cold starts, the two concurrency settings that sound alike, and why the line your SDK client sits on decides your latency.',
  minutes: 14,
  tier: 1,
  serviceSlugs: ['lambda'],
  requires: [],
  cardIds: [
    'idea:cold-start',
    'define:cold-start',
    'num:concept:cold-start:init-phase-timeout',
    'num:concept:cold-start:memory-and-cpu',
    'trap:concept:cold-start:reserved-concurrency-and-provisioned-concurrency-sound-alike',
    'trap:concept:cold-start:increasing-the-timeout-does-nothing-for-a-cold-start-it-is',
    'trap:concept:cold-start:vpc-attached-lambda-cold-starts-improved-substantially-with',
    'optset:lambda:concurrency',
    'opt:lambda:concurrency:unreserved-concurrency',
    'opt:lambda:concurrency:reserved-concurrency',
    'opt:lambda:concurrency:provisioned-concurrency',
    'trap:opt:lambda:concurrency:reserved-concurrency',
    'trap:opt:lambda:concurrency:provisioned-concurrency',
    'trap:lambda:code-outside-the-handler-runs-once-per-execution-environment',
    'trap:lambda:429-toomanyrequestsexception-means-concurrency-throttling-n',
    'trap:lambda:a-function-in-a-vpc-can-reach-private-resources-but-has-no-i',
    'trap:lambda:async-invocations-s3-sns-eventbridge-retry-twice-more-t',
    'num:lambda:max-timeout',
    'num:lambda:memory',
    'num:lambda:deployment-package',
    'num:lambda:tmp-ephemeral-storage',
    'num:lambda:layers',
    'num:lambda:environment-variables',
    'num:lambda:synchronous-payload',
    'num:lambda:response-streaming',
    'vs:lambda:fargate',
    'vs:lambda:ec2',
    'trigger:t-cold-start',
    'trigger:t-lambda-vpc-internet',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'There is a thing between your function and the request, and it is not the function. [[lambda|AWS Lambda]] provisions an **execution environment**, runs your handler in it, then freezes it — and the next request may well land in the same one. Nothing in the programming model announces this, which is why the most-asked Lambda question on either paper is really asking whether you know that a variable can survive a request.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'lem-two-requests',
        title: 'The same function, invoked twice, a few seconds apart',
        caption:
          'Nothing about the two requests differs. What differs is whether an environment already exists — and the second request is the one that inherits everything the first one set up.',
        // Template B, fan-in-the-middle: two parallel tails that are the same
        // journey with a different object at the junction.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'caller',
            label: 'Two requests',
            sub: 'seconds apart',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'lambda',
            label: 'Lambda service',
            sub: 'finds somewhere to run it',
            kind: 'service',
            category: 'serverless',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'env-new',
            label: 'A new environment',
            sub: 'code, runtime, init',
            kind: 'note',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'env-kept',
            label: 'The same environment',
            sub: 'frozen, not discarded',
            kind: 'note',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'run-first',
            label: 'Handler runs',
            sub: 'the slow one',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'run-again',
            label: 'Handler runs',
            sub: 'client already open',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'invoke', from: 'caller', to: 'lambda', label: 'invoke', tone: 'default' },
          { id: 'build', from: 'lambda', to: 'env-new', label: 'nothing free', tone: 'warn' },
          { id: 'reuse', from: 'lambda', to: 'env-kept', label: 'one is free', tone: 'ok' },
          { id: 'first', from: 'env-new', to: 'run-first', label: 'after init', tone: 'warn' },
          { id: 'again', from: 'env-kept', to: 'run-again', label: 'straight in', tone: 'ok' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['invoke'],
            title: 'A request arrives, and Lambda goes looking for somewhere to run it',
            detail:
              'You did not ask for a server and there is not one waiting. The service decides, per invocation, whether it already has an environment it can use.',
            tone: 'default',
          },
          {
            edgeIds: ['build', 'first'],
            title: 'Nothing is free, so one is built — download, start the runtime, initialise',
            detail:
              'The code is downloaded, the runtime starts, and everything **outside** your handler runs. Only then is the handler invoked. That whole preamble is paid by this request alone, and the init phase has its own **10-second** ceiling.',
            tone: 'warn',
          },
          {
            edgeIds: ['reuse', 'again'],
            title: 'The second request finds the environment still sitting there',
            detail:
              'Lambda froze the environment rather than discarding it, so the download, the runtime start and the initialisation are all skipped — and the database connection the first request opened is **still open**. Subsequent requests reuse the environment until it is reclaimed.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the name: that top path is a cold start',
      md: 'A [[cold-start|cold start]] is the extra latency of the first invocation on a new execution environment — and the rule that follows from it is the single most directly examined sentence about Lambda: **initialisation code outside the handler runs once per environment, not once per request.** Larger deployment packages, VPC attachment and heavy initialisation all lengthen it. It is not a defect; it is the bill for paying nothing while idle.',
    },

    /* ── 3. The file, read out one line at a time ─────────────────────────── */
    { kind: 'heading', text: 'The same idea, as the file you actually write' },
    {
      kind: 'code',
      lang: 'javascript',
      caption: 'Two regions of one file, and the boundary between them is the handler',
      code: `import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { readFileSync } from 'node:fs'

// ── runs ONCE per execution environment ──────────────────────────
const client = new DynamoDBClient({})
const rules = JSON.parse(readFileSync('./rules.json', 'utf8'))

export const handler = async (event) => {
  // ── runs on EVERY invocation ───────────────────────────────────
  const order = JSON.parse(event.body)
  return client.send(buildGet(order.id, rules))
}`,
    },
    {
      kind: 'steps',
      title: 'Four things that file is quietly telling you',
      items: [
        {
          title: 'The client is constructed above the handler, and that is the exam answer',
          md: 'Anything expensive and reusable — SDK clients, connection pools, parsed configuration — belongs there. It is built once per environment and reused by every invocation that lands in it. Move it inside the handler and you rebuild it on every single request, for nothing.',
        },
        {
          title: 'So state can leak from one request into the next, on purpose and by accident',
          md: 'That is the same sentence read the other way. A counter left at module scope keeps counting across invocations that were never meant to know about each other, and a cached value goes stale without any expiry logic to blame.',
        },
        {
          title: 'CPU is not on this page, because you do not configure it',
          md: 'You configure **memory**, from 128 MB to 10,240 MB, and CPU is allocated in proportion — roughly one full vCPU at about 1,769 MB. Which is why raising memory often makes a function both faster and cheaper: you pay for memory multiplied by duration, and you have just cut the duration.',
        },
        {
          title: 'And the file has a ceiling the language will never mention',
          md: 'Fifteen minutes. A handler that runs longer is not a Lambda function, whatever the code says — that is [[fargate|Fargate]], ECS or Batch. Lambda runs short handlers with a 15-minute ceiling and much finer-grained billing; Fargate runs long-lived containers with no time limit.',
        },
      ],
    },

    /* ── 4. The two things people configure that do not do what they think ── */
    { kind: 'heading', text: 'Two settings that get reached for, and what they actually do' },
    {
      kind: 'code',
      lang: 'bash',
      caption: 'A slow first request, and the two commands that will not fix it',
      code: `# "It is slow on the first request, so guarantee the function some capacity"
aws lambda put-function-concurrency \\
  --function-name checkout --reserved-concurrent-executions 50
                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     Reserved concurrency guarantees 50 and caps at 50 — it is a limit at
     both ends. Nothing is kept warm, so the first request still pays init.

# "Then give it longer to start up"
aws lambda update-function-configuration \\
  --function-name checkout --timeout 900
                           ^^^^^^^^^^^^^
     A cold start is initialisation time, not execution time. The timeout
     governs how long the handler may run once it is already running.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The pair the exam exploits, in one sentence each',
      md: '**Reserved** concurrency guarantees a function that many concurrent executions *and* caps it at that number — the guarantee and the ceiling are the same number, it is free, and setting it to `0` is how you switch a function off without deleting it. **Provisioned** concurrency pre-initialises environments and keeps them warm, and it is the only one of the three that costs money while nothing is happening. If the stem is about **latency on the first request**, it is provisioned. If it is about **throttling or protecting a downstream database**, it is reserved.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The error code, and the one that is not a code bug',
      md: '**429 TooManyRequestsException means concurrency throttling, not a bug in your code.** The default account pool is 1,000 concurrent executions per Region and it is shared, so a noisy function can exhaust it and throttle every other function in the account — which is the failure a question describes as "unrelated functions started failing". Reserved concurrency on the noisy one is the fix, and it is subtracted from the shared pool.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'And the network, which the programming model hides completely',
      md: 'A function attached to a VPC can reach private resources and **has no internet route unless the subnet has a NAT gateway** — it lands in a [[subnet|private subnet]] with everything that implies. For AWS APIs specifically, a VPC endpoint is the cheaper fix. Note also that an option claiming VPC attachment adds many seconds of cold start is **stale**: Hyperplane network interfaces improved that substantially.',
    },

    /* ── 5. Compare, last, on the axis the option set cannot carry ────────── */
    {
      kind: 'compare',
      title: 'The symptom in the stem, and what it is actually describing',
      columns: ['What is really being described', 'The answer sitting next to it'],
      rows: [
        {
          label: '"The first request after a deployment is slow"',
          cells: [
            'A cold start — every deployment discards the warm environments',
            'A timeout increase, which changes nothing about initialisation',
          ],
        },
        {
          label: '"Consistent latency for a spiky, user-facing path"',
          cells: [
            'Provisioned concurrency, which keeps environments initialised',
            'Reserved concurrency, which guarantees a count and warms nothing',
          ],
        },
        {
          label: '"Unrelated functions started failing"',
          cells: [
            'One function exhausted the shared per-Region pool',
            'A code bug, when the 429 has already named the cause',
          ],
        },
        {
          label: '"It must stop overwhelming our database"',
          cells: [
            'Reserved concurrency, because the cap is the point',
            'Provisioned concurrency, which pre-warms and caps nothing',
          ],
        },
        {
          label: '"The job takes about 25 minutes"',
          cells: [
            'Not Lambda at all — the ceiling is 15 minutes',
            'A larger memory setting, which shortens duration but not the ceiling',
          ],
        },
        {
          label: '"It cannot reach a third-party API"',
          cells: [
            'It is in a VPC and the subnet has no NAT gateway route',
            'A security group change, which cannot create a route that does not exist',
          ],
        },
      ],
    },

    /* ── 6. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Max timeout', value: '15 minutes (900 seconds)' },
        {
          label: 'Memory',
          value: '128 MB – 10,240 MB, in 1 MB steps',
          note: 'CPU is allocated in proportion; ~1,769 MB ≈ one full vCPU.',
        },
        {
          label: 'Deployment package',
          value: '50 MB zipped direct upload · 250 MB unzipped · 10 GB container image',
          note: 'The console code editor only opens a package under 3 MB — the usual reason to move dependencies into a layer.',
        },
        { label: '/tmp ephemeral storage', value: '512 MB default, configurable to 10,240 MB' },
        {
          label: 'Layers',
          value: 'Up to 5 per function, counting toward the 250 MB unzipped limit',
        },
        { label: 'Environment variables', value: '4 KB total' },
        {
          label: 'Synchronous payload',
          value: '6 MB request/response · 256 KB asynchronous',
        },
        {
          label: 'Response streaming',
          value: 'Up to 20 MB soft limit, via a function URL or InvokeWithResponseStream',
          note: 'Bytes reach the client as they are produced — the way past the 6 MB buffered response.',
        },
        {
          label: 'Default concurrency',
          value: '1,000 per Region',
          note: 'A soft quota you can raise.',
          volatile: true,
        },
        {
          label: 'Init phase timeout',
          value: '10 seconds',
          note: 'Initialisation that exceeds it is retried as part of the invocation.',
        },
      ],
    },

    /* ── 7. Next ──────────────────────────────────────────────────────────── */
    { kind: 'services', title: 'Where these facts live', slugs: ['lambda'] },
    {
      kind: 'prose',
      md: 'One thing this lesson deliberately did not cover: what happens when the handler *fails*. Asynchronous invocations from S3, [[sns]] and [[eventbridge]] retry twice more and then send the event to a dead-letter queue or an on-failure destination, while synchronous invocations do not retry at all — the caller owns that. Which means the same request can reach your handler more than once, and the handler is the only thing that can do anything about it.',
    },
  ],

  checks: [
    {
      id: 'lambda-execution-model-init',
      prompt:
        'A function opens a database connection and parses a 200 KB configuration file. Latency is fine under sustained load and terrible in bursts. Where should that work go?',
      options: [
        {
          text: 'Outside the handler, at module scope, so it runs once per execution environment',
          correct: true,
          why: 'Initialisation code outside the handler runs once per environment rather than once per request, so every invocation that lands in that environment inherits the open connection and the parsed configuration.',
        },
        {
          text: 'At the top of the handler, so each invocation gets a clean connection',
          correct: false,
          why: 'That is exactly the arrangement being described. Every single request rebuilds the client and re-parses the file, which is the cost the environment exists to amortise.',
        },
        {
          text: 'In a Lambda layer, which is loaded once and cached across functions',
          correct: false,
          why: 'A layer ships code and dependencies into the package; it does not execute anything on its own. Where the initialisation runs is decided by where you put the call, not by which artefact holds the file.',
        },
      ],
    },
    {
      id: 'lambda-execution-model-concurrency',
      prompt:
        'A user-facing checkout function shows unacceptable latency on the first request after quiet periods. Which setting addresses it?',
      options: [
        {
          text: 'Provisioned concurrency, which keeps a number of environments initialised and warm',
          correct: true,
          why: 'Cold-start latency is the provisioned concurrency signal. It is the only one of the three controls that pre-initialises anything, and the only one billed while idle.',
        },
        {
          text: 'Reserved concurrency, which guarantees the function that many executions',
          correct: false,
          why: 'Reserved concurrency guarantees a count and caps at the same count. It keeps nothing warm, so the first request after a quiet spell still pays the whole initialisation.',
        },
        {
          text: 'A longer function timeout, so initialisation has room to complete',
          correct: false,
          why: 'A cold start is initialisation time, not execution time. The timeout governs how long the handler may run once it is already running.',
        },
      ],
    },
    {
      id: 'lambda-execution-model-throttle',
      prompt:
        'Several unrelated functions in one account begin returning 429 TooManyRequestsException during a traffic spike on one busy function. What has happened?',
      options: [
        {
          text: 'The busy function has exhausted the shared per-Region concurrency pool',
          correct: true,
          why: 'Unreserved concurrency draws from one account-wide pool, 1,000 per Region by default. A noisy function can consume it and throttle everything else — which is why reserved concurrency on the noisy one is the fix.',
        },
        {
          text: 'The busy function has a bug that is propagating errors to its callers',
          correct: false,
          why: '429 means concurrency throttling, not a code bug. The status code has already named the cause, and the spread across unrelated functions confirms it is an account-level resource.',
        },
        {
          text: 'The functions need provisioned concurrency so they are not cold-started under load',
          correct: false,
          why: 'This is the pair the exam exploits. Provisioned concurrency addresses latency, not throttling; nothing here says the requests were slow, only that they were rejected.',
        },
      ],
    },
    {
      id: 'lambda-execution-model-vpc',
      prompt:
        'A function that worked fine begins timing out on calls to a third-party HTTPS API immediately after being attached to a VPC so it can reach a private database. What is missing?',
      options: [
        {
          text: 'A route to the internet — the private subnet needs a NAT gateway',
          correct: true,
          why: 'A VPC-attached function has private-subnet networking, with everything that implies. It can reach private resources and has no internet route until one exists.',
        },
        {
          text: 'An outbound rule on the security group allowing HTTPS to 0.0.0.0/0',
          correct: false,
          why: 'A permissive security group cannot create a route that does not exist. The packet has nowhere to go before a rule ever gets consulted.',
        },
        {
          text: 'A longer timeout, because VPC attachment adds many seconds of cold start',
          correct: false,
          why: 'That claim is stale — Hyperplane network interfaces improved VPC cold starts substantially. An option asserting it is usually there to be eliminated.',
        },
      ],
    },
  ],
}
