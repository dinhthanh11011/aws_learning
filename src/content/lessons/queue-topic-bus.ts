import type { Lesson } from '../schema'

/**
 * "Decouple these two components" is the single most common phrasing in the
 * loosely-coupled domain, and it is answered by three different services. The
 * atlas says what each of them is; what it cannot say is that they are not
 * alternatives — they are three different shapes of hand-off, and the stem
 * always describes the shape without naming it.
 *
 * So the order here is: watch a queue deliver to exactly one consumer (which is
 * the thing everybody assumes is a copy), then watch a topic turn one publish
 * into two, then read the one artefact only a bus can hold — an event pattern
 * that matches on the inside of somebody else's event. Step Functions arrives
 * last and only as a boundary: the moment the requirement stops being "who gets
 * this" and starts being "what happens next, and what if it fails".
 *
 * The `optionSet`s on `sqs` already hold standard-versus-FIFO (invariant 21),
 * so `compare` takes the axis they cannot: the phrase in the stem, and the
 * plausible wrong answer sitting beside it.
 */
export const queueTopicBus: Lesson = {
  id: 'queue-topic-bus',
  families: ['saa', 'dva'],
  taskId: 'saa-2.1',
  cluster: 'serverless-and-events',
  title: 'Queue, topic or bus',
  subtitle:
    'Three services answer "decouple these two components" and a stem never names which. It describes the shape of the hand-off instead — one consumer or all of them, a message that must survive an outage, a decision made by reading the inside of an event.',
  minutes: 16,
  tier: 1,
  serviceSlugs: ['sqs', 'sns', 'eventbridge', 'step-functions'],
  requires: [],
  cardIds: [
    'which:sqs',
    'which:sns',
    'which:eventbridge',
    'which:step-functions',
    'vs:sqs:sns',
    'vs:sqs:eventbridge',
    'vs:sqs:kinesis-data-streams',
    'vs:sns:eventbridge',
    'vs:eventbridge:step-functions',
    'optset:sqs:queue-type',
    'opt:sqs:queue-type:standard-queue',
    'opt:sqs:queue-type:fifo-queue',
    'trap:opt:sqs:queue-type:fifo-queue',
    'trap:sqs:sqs-never-pushes-if-the-requirement-is-push-it-is-sns-eve',
    'trap:sqs:fifo-ordering-is-per-message-group-id-different-group-ids-p',
    'trap:sqs:long-polling-reduces-cost-and-empty-responses-short-polling',
    'trap:sqs:scaling-an-asg-on-queue-depth-a-backlog-per-instance-target',
    'trap:sns:sns-multiple-sqs-queues-is-the-fan-out-pattern-and-it-a',
    'trap:sns:sns-has-no-retention-messages-must-not-be-lost-if-the-cons',
    'trap:sns:filter-policies-are-the-answer-to-each-subscriber-should-on',
    'trap:sns:sns-fifo-topics-can-only-deliver-to-sqs-fifo-queues',
    'trap:sns:an-sns-dlq-is-configured-per-subscription-not-per-topic',
    'trap:eventbridge:the-tell-for-eventbridge-is-reacting-to-an-aws-service-eve',
    'trap:eventbridge:eventbridge-scheduler-is-the-current-answer-to-run-this-eve',
    'trap:eventbridge:archive-and-replay-is-unique-among-the-messaging-services-he',
    'trap:eventbridge:eventbridge-pipes-replaces-glue-lambda-functions-between-a-s',
    'trap:step-functions:the-tell-is-coordinate-orchestrate-workflow-multip',
    'trap:step-functions:standard-versus-express-is-decided-by-duration-and-volume-o',
    'trap:step-functions:choreography-services-reacting-to-events-via-eventbridge-v',
    'num:sqs:max-message-size',
    'num:sqs:retention',
    'num:sqs:long-polling',
    'num:sqs:batch',
    'num:sns:retention',
    'num:sns:topic-types',
    'num:sns:message-filtering',
    'num:eventbridge:targets-per-rule',
    'num:eventbridge:archive-replay',
    'num:eventbridge:latency',
    'num:step-functions:standard-workflows',
    'num:step-functions:express-workflows',
    'trigger:t-decouple',
    'trigger:t-fanout',
    'trigger:t-orchestrate',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: '"Decouple these two components", "they should scale independently", "handle traffic spikes" — the answer to all three is to put something between the producer and the consumer so the producer stops waiting. The trouble is that [[sqs]], [[sns]] and [[eventbridge]] all do that, and the stem never says which. It describes the *shape* of the hand-off, and the shape is decided by one question asked first: **how many of them get this message?**',
    },

    /* ── 2. A queue, shown doing the thing people assume it does not ──────── */
    {
      kind: 'diagram',
      spec: {
        id: 'qtb-one-consumer',
        title: 'One order, two workers polling the same queue',
        caption:
          'Both workers are healthy, both are polling, and only one of them will ever see this order. That is not a failure — it is the definition.',
        // Template B, left-to-right chain fanning out at the end.
        cols: 19,
        rows: 8,
        nodes: [
          {
            id: 'orders',
            label: 'Order service',
            sub: 'the producer',
            kind: 'note',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'sqs',
            label: 'SQS queue',
            sub: 'holds it, pushes nothing',
            kind: 'service',
            category: 'appint',
            x: 5.4,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'receive',
            label: 'Receive',
            sub: 'one call wins',
            kind: 'note',
            x: 10.4,
            y: 3.3,
            w: 3,
            h: 1.3,
          },
          {
            id: 'worker-a',
            label: 'Worker A',
            sub: 'gets the order',
            kind: 'note',
            x: 15.2,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'worker-b',
            label: 'Worker B',
            sub: 'gets an empty response',
            kind: 'note',
            x: 15.2,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'send', from: 'orders', to: 'sqs', label: 'SendMessage', tone: 'default' },
          { id: 'poll', from: 'sqs', to: 'receive', label: 'polled', tone: 'default' },
          { id: 'won', from: 'receive', to: 'worker-a', label: 'delivered', tone: 'ok' },
          {
            id: 'lost',
            from: 'receive',
            to: 'worker-b',
            label: 'nothing',
            dashed: true,
            tone: 'bad',
          },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['send'],
            title: 'The producer hands the order over, and its job is finished',
            detail:
              'It does not wait for the work to be done and does not care whether a worker exists yet. That hand-over is what "decouple" means, and it is why a queue absorbs a spike that would otherwise pass straight through to whatever is least able to take it.',
            tone: 'default',
          },
          {
            edgeIds: ['poll', 'won'],
            title: 'A worker polls, receives the order, and the order goes invisible',
            detail:
              'Nothing was pushed — the worker asked. The message stays in the queue but becomes invisible to everyone else while Worker A has it, and it is deleted only when Worker A says so.',
            tone: 'ok',
          },
          {
            edgeIds: ['lost'],
            title: 'The second worker polls at the same moment and gets nothing back',
            detail:
              'Two consumers on one queue **split** the work; they do not both get it. If the requirement is that billing *and* analytics each receive every order, a second consumer on this queue is the wrong shape entirely.',
            tone: 'bad',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'That is a queue: pull, retention, one consumer per message',
      md: 'Producers send, consumers **poll**, process and delete. **SQS never pushes** — if the requirement is push, it is SNS, EventBridge, or a Lambda event-source mapping that polls on your behalf. Because the queue holds work when consumers are down, "decouple" and "absorb bursts" turn out to be the same answer, and the canonical architecture is an Auto Scaling group sized on **queue depth** rather than CPU: an idle worker waiting on a queue shows low CPU while the work piles up.',
    },

    /* ── 3. The same event, when everyone needs a copy ────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'qtb-fanout',
        title: 'The same order, when billing and analytics must both receive it',
        caption:
          'One publish, two copies, two queues. The topic supplies the fan-out and the queues supply the durability — which is why this pair, and not either half alone, is the standard answer.',
        // Template B, fan-in-the-middle: two parallel tails that are the same
        // journey with a different object at the junction.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'orders2',
            label: 'Order service',
            sub: 'one call, not two',
            kind: 'note',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'sns',
            label: 'SNS topic',
            sub: 'pushes, keeps nothing',
            kind: 'service',
            category: 'appint',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'sqs-billing',
            label: 'Billing queue',
            sub: 'holds its copy',
            kind: 'service',
            category: 'appint',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'sqs-analytics',
            label: 'Analytics queue',
            sub: 'holds its copy',
            kind: 'service',
            category: 'appint',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'billing-app',
            label: 'Billing',
            sub: 'up, works now',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'analytics-app',
            label: 'Analytics',
            sub: 'down until 09:00',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'publish', from: 'orders2', to: 'sns', label: 'Publish', tone: 'default' },
          { id: 'tobill', from: 'sns', to: 'sqs-billing', label: 'a copy', tone: 'ok' },
          { id: 'toanl', from: 'sns', to: 'sqs-analytics', label: 'a copy', tone: 'ok' },
          { id: 'billrun', from: 'sqs-billing', to: 'billing-app', label: 'polled', tone: 'ok' },
          {
            id: 'anlrun',
            from: 'sqs-analytics',
            to: 'analytics-app',
            label: 'later',
            tone: 'info',
          },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['publish'],
            title: 'The producer publishes once and does not know who is listening',
            detail:
              'It names a topic, not a list of endpoints. Adding a third consumer next month is a subscription, not a change to this service — which is the whole point of publishing rather than calling.',
            tone: 'default',
          },
          {
            edgeIds: ['tobill', 'toanl'],
            title: 'SNS pushes a copy to every subscriber',
            detail:
              'One publish became two deliveries, and it would have become five just as easily. A **filter policy** on a subscription is how each subscriber receives only the subset it cares about — filtering at the source rather than in the consumer.',
            tone: 'ok',
          },
          {
            edgeIds: ['billrun', 'anlrun'],
            title: 'Each queue holds its copy until its own consumer is ready',
            detail:
              'Billing processes now; analytics is down and processes at nine. **This is the half SNS cannot do** — it has no retention, so a subscriber that is offline simply misses the message. The queues are what make the fan-out durable.',
            tone: 'info',
          },
        ],
      },
    },

    /* ── 4. The two things that look simpler and are wrong ────────────────── */
    { kind: 'heading', text: 'Two shortcuts, written out' },
    {
      kind: 'code',
      lang: 'bash',
      caption: 'Both remove a moving part. Both change what the system guarantees.',
      code: `# "Each system just subscribes to the topic directly — skip the queues"
aws sns subscribe --topic-arn arn:aws:sns:eu-west-1:111122223333:orders \\
  --protocol lambda --notification-endpoint arn:aws:lambda:...:billing
  ^^^^^^^^^^^^^^^^^
     Fine while billing is up. SNS has no retention: it retries, then drops
     the message unless the *subscription* has a dead-letter queue — and a
     DLQ is configured per subscription, never per topic.

# "Then give both systems a consumer on the one queue instead"
ReceiveMessage(QueueUrl=orders)  ->  worker-a  gets order #1
ReceiveMessage(QueueUrl=orders)  ->  worker-b  gets order #2
                                     ^^^^^^^^  not a copy of #1
     One queue delivers each message to one consumer. Two consumers on one
     queue split the work; they do not both get it.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The sentence that decides between them',
      md: '**"Multiple systems must each receive a copy of every event"** is SNS fan-out to one SQS queue per consumer. **"Messages must not be lost if the consumer is offline"** means there must be an SQS queue in the path, because SNS keeps nothing. The two phrases nearly always appear together, and the pair is the reason the standard answer is a topic *in front of* queues rather than either one alone.',
    },

    /* ── 5. The artefact only a bus can hold ──────────────────────────────── */
    { kind: 'heading', text: 'And then there is the event nobody published to you' },
    {
      kind: 'prose',
      md: 'Both pictures so far started with **your** producer. EventBridge starts somewhere else: AWS services, your applications and SaaS partners publish JSON events onto a bus, and a rule matches on any field inside them. Here is a rule, and the thing to notice is that nothing in it is a topic name.',
    },
    {
      kind: 'code',
      lang: 'json',
      caption: 'An EventBridge rule pattern — matched against the inside of the event',
      code: `{
  "source": ["aws.ec2"],
  "detail-type": ["EC2 Instance State-change Notification"],
  "detail": {
    "state": ["stopped", "terminated"]
  }
}`,
    },
    {
      kind: 'steps',
      title: 'Three things that pattern is telling you',
      items: [
        {
          title: 'The source is an AWS service, and nobody wired it up',
          md: 'Reacting to an AWS service event — an EC2 state change, a GuardDuty finding, a CodePipeline stage failing — is the tell for EventBridge. AWS service events arrive on the default bus whether or not anyone was waiting for them, and they are free to publish there.',
        },
        {
          title: 'The match reaches inside detail, which is the other tell',
          md: 'Routing on event **content** — "only orders over £1,000 from the EU" — is an event pattern matching arbitrary JSON structure. SNS filter policies work on message attributes or the message body and cannot inspect structure the way a pattern can, so a stem describing content-based routing across services has already chosen.',
        },
        {
          title: 'And a rule fans out too, up to five targets, to twenty-plus kinds of thing',
          md: 'Lambda, Step Functions, SQS, SNS, ECS tasks, API destinations. The trade against SNS is speed and price: EventBridge is typically sub-second but higher-latency than SNS, and SNS is cheaper at high volume. **Very high-throughput, latency-sensitive fan-out is SNS**; routing, schema discovery and partner events are EventBridge.',
        },
        {
          title: 'It is also where "run this every night" now lives',
          md: '**EventBridge Scheduler** is the current answer to a schedule — not a Lambda function with its own timer, and not the legacy CloudWatch Events wording. And **archive and replay** is unique among these three: it is the answer to "we need to reprocess last week’s events", which a queue cannot do because it deletes a message once it is processed.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Where routing stops and orchestration starts',
      md: 'All three services above route *one* message and then forget it. The moment the requirement mentions **"multiple steps", "retries and error handling" or "we need to see which step failed"**, it has stopped describing routing: that is [[step-functions|Step Functions]], which holds the state, the backoff policy and the fallback path outside your code. Chaining Lambda functions that call each other hides the state and hand-rolls the retries — that is the distractor. The named DVA distinction is choreography (services reacting to events via EventBridge) versus orchestration (a central workflow).',
    },

    /* ── 6. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'The phrase in the stem, and the option waiting beside it',
      columns: ['What it is telling you', 'The wrong answer next to it'],
      rows: [
        {
          label: '"Each of these systems must receive every event"',
          cells: [
            'SNS fan-out to one SQS queue per consumer',
            'One queue with several consumers, which splits the work instead of copying it',
          ],
        },
        {
          label: '"Nothing may be lost while a consumer is offline"',
          cells: [
            'An SQS queue in the path — retention is what supplies it',
            'SNS with retries. It retries and then drops; there is nothing holding the message',
          ],
        },
        {
          label: '"React when an EC2 instance changes state"',
          cells: [
            'EventBridge — an AWS service event, on the default bus',
            'SNS, which can only carry what somebody published to your topic',
          ],
        },
        {
          label: '"Reprocess everything from last Tuesday"',
          cells: [
            'EventBridge archive and replay',
            'SQS retention, which tops out at 14 days and deletes on processing anyway',
          ],
        },
        {
          label: '"Ordered per customer, but parallel across customers"',
          cells: [
            'A FIFO queue, with the customer id as the message group id',
            'A standard queue, whose ordering is best-effort and whose throughput you did not need to give up',
          ],
        },
        {
          label: '"Multiple steps, retries, and see where it failed"',
          cells: [
            'Step Functions — state and error policy outside the code',
            'EventBridge rules chained together, which route single events and hold no state',
          ],
        },
        {
          label: '"Replay the last N hours, ordered, several independent readers"',
          cells: [
            'Kinesis Data Streams — an ordered, replayable log',
            'SQS, which deletes a message once it is processed, so there is nothing to replay',
          ],
        },
      ],
    },

    /* ── 7. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'SQS max message size',
          value: '256 KB',
          note: 'Larger payloads go to S3 with the Extended Client Library holding a pointer.',
        },
        { label: 'SQS retention', value: '60 seconds to 14 days (4 days default)' },
        {
          label: 'SQS long polling',
          value: 'ReceiveMessageWaitTimeSeconds up to 20 seconds',
          note: 'Cuts empty-receive charges — always prefer it.',
        },
        { label: 'SQS batch', value: 'Up to 10 messages per send or receive call' },
        {
          label: 'SNS retention',
          value: 'None — undelivered messages are retried then dropped (or sent to a DLQ)',
        },
        {
          label: 'SNS topic types',
          value:
            'Standard (best-effort order, at-least-once) · FIFO (ordered, deduplicated, SQS FIFO subscribers only)',
        },
        {
          label: 'SNS message filtering',
          value: 'Filter policies on message attributes or message body',
        },
        { label: 'EventBridge targets per rule', value: '5' },
        {
          label: 'EventBridge archive & replay',
          value: 'Archive events and replay them to a bus later',
        },
        { label: 'EventBridge latency', value: 'Typically sub-second, but higher than SNS' },
        {
          label: 'Step Functions Standard workflows',
          value:
            'Up to 1 year duration · exactly-once · full execution history · per state transition',
        },
        {
          label: 'Step Functions Express workflows',
          value:
            'Up to 5 minutes · at-least-once · per invocation and duration · far cheaper at volume',
        },
      ],
    },

    /* ── 8. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['sqs', 'sns', 'eventbridge', 'step-functions'],
    },
    {
      kind: 'prose',
      md: 'One thing every picture above quietly assumed: that a message arrives once. It does not. A standard queue is at-least-once, SNS is at-least-once, an EventBridge delivery is at-least-once — so [[idempotency]] is not an optional refinement of this design, it is a property the consumer has to have. That is the next lesson, and it is the one that decides the "the customer was charged twice" questions.',
    },
  ],

  checks: [
    {
      id: 'queue-topic-bus-fanout',
      prompt:
        'Billing, analytics and a fraud checker must each process every order. Analytics is frequently down for maintenance and must not miss anything. What is the design?',
      options: [
        {
          text: 'An SNS topic with one SQS queue subscribed per consumer',
          correct: true,
          why: 'The topic supplies the fan-out and the queues supply the retention. Each consumer gets its own durable copy and processes at its own pace, which is exactly what the maintenance window requires.',
        },
        {
          text: 'One SQS queue with all three consumers polling it',
          correct: false,
          why: 'A queue delivers each message to one consumer. Three consumers on one queue would split the orders between them rather than each receiving all of them.',
        },
        {
          text: 'An SNS topic with all three services subscribed directly',
          correct: false,
          why: 'That gives the fan-out and loses the durability. SNS has no retention, so anything published while analytics is down is retried and then dropped.',
        },
      ],
    },
    {
      id: 'queue-topic-bus-service-event',
      prompt:
        'A compliance process must run whenever any EC2 instance in the account enters the stopped state, and only for instances tagged production. Which service?',
      options: [
        {
          text: 'EventBridge, with a rule whose pattern matches the event detail',
          correct: true,
          why: 'Reacting to an AWS service event is the EventBridge tell, and matching on fields inside the event is the second one. No producer of yours has to be changed.',
        },
        {
          text: 'SNS, with a filter policy on the message attributes',
          correct: false,
          why: 'A filter policy can narrow what a subscriber receives, but the EC2 state change was never published to a topic of yours. There is nothing for SNS to filter.',
        },
        {
          text: 'An SQS queue that the compliance process polls',
          correct: false,
          why: 'SQS never pushes and holds only what a producer sends it. The problem here is that nothing is producing yet.',
        },
      ],
    },
    {
      id: 'queue-topic-bus-orchestrate',
      prompt:
        'A media pipeline has six stages, each of which can fail and needs its own retry policy, and the operations team must be able to see which stage a stuck job is in. Which service?',
      options: [
        {
          text: 'Step Functions, which holds the state, the retries and the execution history',
          correct: true,
          why: '"Multiple steps", "retries and error handling" and "see which step failed" are the three tells together. The retry policy and the fallback path live in the definition rather than in the code.',
        },
        {
          text: 'EventBridge rules, with each stage publishing an event that triggers the next',
          correct: false,
          why: 'That is choreography, and it routes single events without holding state. Nothing in the system can then answer "which stage is this job in", which the question asked for directly.',
        },
        {
          text: 'A chain of Lambda functions, each invoking the next when it finishes',
          correct: false,
          why: 'This is the named distractor: chaining functions hides the state and hand-rolls the retries, so the failure path exists only in code nobody can inspect while a job is stuck.',
        },
      ],
    },
    {
      id: 'queue-topic-bus-fifo-groups',
      prompt:
        'Events for any one customer must be processed strictly in order, but different customers should be processed in parallel. What decides this?',
      options: [
        {
          text: 'A FIFO queue, using the customer id as the message group id',
          correct: true,
          why: 'FIFO ordering is per message group id, not per queue. Different group ids process in parallel, which is exactly the "ordered per customer, parallel across customers" requirement.',
        },
        {
          text: 'A FIFO queue, because a FIFO queue is ordered end to end',
          correct: false,
          why: 'Ordering that applied to the whole queue would serialise every customer behind every other one, giving up the parallelism the question requires. The group id is the unit of both.',
        },
        {
          text: 'A standard queue with one consumer, so nothing can overtake',
          correct: false,
          why: 'Standard queues give best-effort ordering, so a single consumer still sees messages out of order. It also removes the parallelism entirely.',
        },
      ],
    },
  ],
}
