import type { Lesson } from '../schema'

/**
 * The last of the long tail. Step Functions is normally taught as a list of
 * state types, which is the one framing that guarantees nobody remembers why
 * they would use it — the exam never asks what a Pass state is, it asks what to
 * do about a multi-step process that failed halfway and nobody can say where.
 *
 * So the walkthrough is one failing step, run twice, forked on where the state
 * lives. The state types then arrive as answers to something already seen going
 * wrong, and Standard against Express is left to the compare at the end, where
 * it is a two-number decision rather than a feature list.
 *
 * The Map state's concurrency and payload limits are deliberately absent: they
 * live in a question takeaway and on no atlas entry (invariant 23).
 */
export const orchestrateDontChain: Lesson = {
  id: 'orchestrate-dont-chain',
  families: ['saa', 'dva'],
  taskId: 'saa-2.1',
  cluster: 'long-tail',
  title: 'Where the state lives when step three fails',
  subtitle:
    'A function calls a function calls a function, and one day the middle one fails. The card is charged, the stock may or may not be reserved, nothing shipped, and the only record of the order is a timestamp in three separate log groups. That is not a bug to fix — it is what happens when the workflow exists only as the call stack of whatever was running.',
  minutes: 16,
  tier: 1,
  serviceSlugs: ['step-functions'],
  requires: [],
  cardIds: [
    'which:step-functions',
    'not:step-functions',
    'num:step-functions:standard-workflows',
    'num:step-functions:express-workflows',
    'num:step-functions:service-integrations',
    'num:step-functions:patterns',
    'num:step-functions:map-state',
    'num:step-functions:error-handling',
    'trap:step-functions:the-tell-is-coordinate-orchestrate-workflow-multip',
    'trap:step-functions:standard-versus-express-is-decided-by-duration-and-volume-o',
    'trap:step-functions:waitfortasktoken-is-the-human-approval-pattern-the-workfl',
    'trap:step-functions:step-functions-can-call-aws-services-directly-so-a-lambda-f',
    'trap:step-functions:choreography-services-reacting-to-events-via-eventbridge-v',
    'vs:step-functions:eventbridge',
    'vs:step-functions:batch',
    'vs:lambda:step-functions',
    'trigger:t-orchestrate',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'Three things have to happen to an order: charge the card, reserve the stock, ship it. The obvious way to write that is a [[lambda|Lambda]] function that does all three, or three functions that call each other. Both work perfectly until the second step fails — and then the question "which orders are half-finished right now?" has no answer anywhere, because the only thing that ever knew the order of the steps was a process that has since exited.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'odc-where-state-lives',
        title: 'The same failing step, in two designs',
        caption:
          'The failure is identical on both branches — the stock service returned an error. What differs is whether anything outside the failing code knew what was supposed to happen next.',
        // Template B, fan-in-the-middle: one failure, forked on where the state
        // and the error policy live.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'order',
            label: 'Order received',
            sub: 'card already charged',
            kind: 'note',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'reserve',
            label: 'Reserve stock',
            sub: 'and it fails',
            kind: 'note',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'lambda',
            label: 'Function calls function',
            sub: 'state is the call stack',
            kind: 'service',
            category: 'serverless',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'step-functions',
            label: 'Step Functions',
            sub: 'state is the execution',
            kind: 'service',
            category: 'appint',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'unknown',
            label: 'Where did it stop?',
            sub: 'three log groups, no order',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'caught',
            label: 'Retried, then caught',
            sub: 'and the card refunded',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'start', from: 'order', to: 'reserve', label: 'step two', tone: 'default' },
          { id: 'chained', from: 'reserve', to: 'lambda', label: 'thrown', tone: 'bad' },
          { id: 'lost', from: 'lambda', to: 'unknown', label: 'nobody catches', tone: 'bad' },
          {
            id: 'orchestrated',
            from: 'reserve',
            to: 'step-functions',
            label: 'reported',
            tone: 'ok',
          },
          {
            id: 'handled',
            from: 'step-functions',
            to: 'caught',
            label: 'Retry, Catch',
            tone: 'ok',
          },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['start'],
            title: 'Step two fails, having already taken the money',
            detail:
              'Nothing unusual — a downstream service throttled. The interesting part is what each design knows at this instant.',
            tone: 'default',
          },
          {
            edgeIds: ['chained', 'lost'],
            title: 'Chained functions: the error goes up a stack that is about to disappear',
            detail:
              'The state lived in whatever was running, the retry and backoff were re-implemented inside this call, and the failure halfway through leaves the process in an unknown condition. Diagnosis means reconstructing the order from log timestamps across three functions.',
            tone: 'bad',
          },
          {
            edgeIds: ['orchestrated', 'handled'],
            title: 'Orchestrated: the failure is reported to something that outlives it',
            detail:
              'The workflow engine holds the state and the error policy **outside the code**, so the retry is configuration and the fallback path is a state like any other. The execution history shows exactly which step failed and why.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the name for it: a state machine',
      md: 'You define states — **task, choice, parallel, map, wait, pass, succeed, fail** — in Amazon States Language, and Step Functions runs them: keeping the state, retrying failures with your backoff policy, catching errors, and giving you a **visual execution history of exactly where things went wrong**. The tell in a stem is **"coordinate", "orchestrate", "workflow", "multiple steps with retries", or "we need to see where it failed"**, and any of those five phrasings is worth more than the rest of the paragraph around it.',
    },

    /* ── 3. The real configuration, read out a line at a time ─────────────── */
    { kind: 'heading', text: 'One state, and everything the code no longer has to do' },
    {
      kind: 'code',
      lang: 'json',
      caption: 'The middle step of the workflow above. Note what is not a function.',
      code: `"ReserveStock": {
  "Type": "Task",
  "Resource": "arn:aws:states:::aws-sdk:dynamodb:updateItem",
  "TimeoutSeconds": 30,
  "Retry": [
    {
      "ErrorEquals": ["DynamoDb.ProvisionedThroughputExceededException"],
      "IntervalSeconds": 2,
      "BackoffRate": 2,
      "MaxAttempts": 4
    }
  ],
  "Catch": [
    { "ErrorEquals": ["States.ALL"], "Next": "RefundCard" }
  ],
  "Next": "ShipOrder"
}`,
    },
    {
      kind: 'steps',
      title: 'Reading it downwards',
      items: [
        {
          title: 'There is no Lambda function here at all',
          md: 'The resource is an AWS API call. Optimised integrations plus **the AWS SDK integration cover 200+ services**, which means **a Lambda function that only makes one SDK call is often removable** — a cost and simplicity answer the exam likes, and one that surprises people who assume every task is a function.',
        },
        {
          title: 'Retry is a policy, not a loop',
          md: 'Error class, first interval, backoff rate, attempt cap. **Retry with backoff, Catch to a fallback state, and per-state timeouts** are the three parts of the error idiom, and all three are visible to anyone reading the definition rather than buried in one runtime’s source.',
        },
        {
          title: 'Catch names the state to go to, so failure has a path',
          md: '`States.ALL` after the specific errors is the usual shape. The fallback is a state like any other — here it refunds the card, which is the compensating action the chained version had nowhere to put.',
        },
        {
          title: 'Next is what makes the order exist outside the code',
          md: 'The sequence is data. That is the whole difference: in the chained design the order of the steps was an implementation detail of a function body, and here it is the thing being executed.',
        },
      ],
    },

    /* ── 4. The wrong answer, as real syntax ──────────────────────────────── */
    { kind: 'heading', text: 'The retry loop everybody writes' },
    {
      kind: 'code',
      lang: 'javascript',
      caption: 'Correct, tested, and reviewed. It also ships orders that were never reserved.',
      code: `for (let attempt = 0; attempt < 4; attempt++) {
  try {
    await reserveStock(order)
    break
  } catch (err) {
    await sleep(2 ** attempt * 1000)
  }
}

await shipOrder(order)
^^^^^^^^^^^^^^^^^^^^^^
After four failed attempts the loop simply ends and control arrives
here anyway. There is no Catch, because there is nowhere for one to
go — and if the function times out mid-loop instead, the order stops
existing halfway through with the card already charged. The retry
policy, the timeout and the fallback are all real; they are just
invisible to everyone who is not reading this file.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'That is the reason to orchestrate, and it is asked as a scenario',
      md: 'The distractor is always some version of "chain the functions and add error handling in code". It is wrong for a stated reason: **chaining Lambda functions that call each other hides the state and hand-rolls the retries**. When a stem says the team cannot tell which step failed, the answer is not better logging.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Two patterns worth recognising by name',
      md: 'The three service-integration patterns are **request-response**, **run-a-job** (`.sync`) and **wait-for-callback** (`.waitForTaskToken`), and the last one is the one that gets asked: `.waitForTaskToken` **is the human-approval pattern — the workflow pauses until something calls** `SendTaskSuccess`. The other is the **Map state: parallel iteration, with Distributed Map for very large datasets in S3**, which is what a stem about processing thousands of files is pointing at.',
    },

    /* ── 5. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'What the stem says, and what it has just chosen',
      columns: ['The answer', 'Why the neighbouring option is not'],
      rows: [
        {
          label: 'Over 5 minutes, or “must not run twice”',
          cells: [
            'A Standard workflow — up to 1 year, exactly-once',
            'Express caps at 5 minutes and is at-least-once',
          ],
        },
        {
          label: 'Millions of short executions, cost matters',
          cells: [
            'An Express workflow — far cheaper at volume',
            'Standard bills per state transition, which adds up fast at that rate',
          ],
        },
        {
          label: '“Wait for a manager to approve it”',
          cells: [
            '.waitForTaskToken, resumed by SendTaskSuccess',
            'A polling loop in a function burns the timeout without ever pausing',
          ],
        },
        {
          label: '“Services should react to events as they happen”',
          cells: [
            'EventBridge — choreography, stateless routing',
            'Step Functions is orchestration: one central workflow holding the state',
          ],
        },
        {
          label: '“Run this queue of compute jobs”',
          cells: [
            'AWS Batch — it manages the job queue and the compute',
            'Step Functions sequences steps, and can submit a Batch job as one of them',
          ],
        },
        {
          label: 'A single function invocation, no steps',
          cells: [
            'Just Lambda — the orchestration buys nothing',
            'A one-state machine adds a state transition charge and a second thing to operate',
          ],
        },
      ],
    },

    /* ── 6. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'Standard workflows',
          value:
            'Up to 1 year duration · exactly-once · full execution history · per state transition',
        },
        {
          label: 'Express workflows',
          value:
            'Up to 5 minutes · at-least-once · per invocation and duration · far cheaper at volume',
        },
        {
          label: 'Service integrations',
          value: 'Optimised integrations plus the AWS SDK integration covering 200+ services',
        },
        {
          label: 'Patterns',
          value: 'Request-response · run-a-job (.sync) · wait-for-callback (.waitForTaskToken)',
        },
        {
          label: 'Map state',
          value: 'Parallel iteration, with Distributed Map for very large datasets in S3',
        },
        {
          label: 'Error handling',
          value: 'Retry with backoff, Catch to a fallback state, per-state timeouts',
        },
      ],
    },

    /* ── 7. Next ──────────────────────────────────────────────────────────── */
    { kind: 'services', title: 'Where these facts live', slugs: ['step-functions'] },
    {
      kind: 'prose',
      md: 'One word in the compare table above is a whole design argument: **choreography** — services reacting to events via [[eventbridge|EventBridge]] — against **orchestration**, a central workflow that knows the order. It is a named distinction on the developer paper, and the honest answer is that a system usually has both: events between bounded contexts, a state machine inside the one that owes somebody a completed order.',
    },
  ],

  checks: [
    {
      id: 'orchestrate-dont-chain-visibility',
      prompt:
        'A five-step order process is implemented as five Lambda functions invoking each other. Failures leave orders half-finished and the team cannot tell which step failed. What do you propose?',
      options: [
        {
          text: 'Step Functions, so the state and the error policy live outside the code and the execution history shows the failing step',
          correct: true,
          why: 'Multiple steps, retries and "we cannot see where it failed" are the three tells together. Orchestration is what puts the sequence somewhere that outlives the process running it.',
        },
        {
          text: 'Structured logging with a correlation id passed between the functions',
          correct: false,
          why: 'That improves diagnosis after the fact and changes nothing about the half-finished orders. The state is still only in whatever was running.',
        },
        {
          text: 'EventBridge rules between the functions so each step reacts to the previous one',
          correct: false,
          why: 'That is choreography — stateless routing. It decouples the steps but still leaves no single place that knows how far an order got.',
        },
      ],
    },
    {
      id: 'orchestrate-dont-chain-standard-express',
      prompt:
        'A workflow runs about two million times a day, each execution finishing in under a minute, and occasional duplicate processing is tolerable. Which flavour?',
      options: [
        {
          text: 'Express, which is far cheaper at volume and is at-least-once',
          correct: true,
          why: 'Volume and duration decide it: under five minutes and millions of executions is exactly the Express case, and the requirement has already waived exactly-once.',
        },
        {
          text: 'Standard, because exactly-once execution is safer and the duration is well within its limit',
          correct: false,
          why: 'Standard bills per state transition, which at two million executions a day is the expensive answer to a requirement that explicitly tolerates duplicates.',
        },
        {
          text: 'Standard, since Express workflows keep no execution history at all',
          correct: false,
          why: 'The distinction the exam draws is duration, delivery semantics and price. Full execution history is a Standard property, but the stem asks for neither history nor exactly-once.',
        },
      ],
    },
    {
      id: 'orchestrate-dont-chain-approval',
      prompt:
        'A refund over £500 must pause until a manager approves it, which may take two days. How is that expressed?',
      options: [
        {
          text: 'A task using .waitForTaskToken, resumed when the approval calls SendTaskSuccess',
          correct: true,
          why: 'This is the human-in-the-loop pattern by name: the workflow pauses indefinitely and something outside it resumes the execution with the token.',
        },
        {
          text: 'A Wait state of 48 hours followed by a Choice state reading an approvals table',
          correct: false,
          why: 'That guesses at the delay rather than waiting for the event, and it delays every refund by two days whether or not anyone approved it sooner.',
        },
        {
          text: 'An Express workflow that polls the approvals table until the decision is recorded',
          correct: false,
          why: 'Express workflows cap at five minutes, so a two-day wait is impossible — and polling is what the callback pattern exists to replace.',
        },
      ],
    },
    {
      id: 'orchestrate-dont-chain-sdk-integration',
      prompt:
        'A workflow includes a Lambda function whose entire body is one PutItem call to DynamoDB. What does a reviewer suggest?',
      options: [
        {
          text: 'Delete the function and call DynamoDB directly from the task state, using the AWS SDK integration',
          correct: true,
          why: 'Step Functions can call AWS services directly across 200+ of them, so a function that only makes one SDK call is removable — one less deployment artefact, one less invocation charge and one less cold start.',
        },
        {
          text: 'Keep it, because a task state can only invoke Lambda or run an Activity',
          correct: false,
          why: 'That was never true of optimised integrations and is comprehensively untrue with the SDK integration. It is the misconception this question targets.',
        },
        {
          text: 'Replace it with an EventBridge rule targeting DynamoDB',
          correct: false,
          why: 'EventBridge routes events to targets; it is not a step inside a workflow, and swapping one indirection for another does not simplify anything.',
        },
      ],
    },
  ],
}
