import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const appIntegrationServices: Service[] = [
  {
    slug: 'sqs',
    name: 'Amazon SQS',
    abbr: 'SQS',
    category: 'appint',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Managed message queue — the standard answer to "decouple these two components".',
    whatItIs:
      'A durable queue. Producers send messages; consumers poll, process, and delete them. Nothing is pushed. Because the queue absorbs bursts and holds work when consumers are down, it converts a synchronous, fragile call into an asynchronous, retryable one. Standard queues give near-unlimited throughput with at-least-once delivery and best-effort ordering; FIFO queues give exactly-once processing and strict ordering at lower throughput.',
    whyItExists:
      'Calling another service directly ties your fate to its availability: if it is down or slow, your request fails or hangs, and a traffic spike passes straight through to whatever is least able to take it. Retrying in-process only holds the failure open longer. SQS exists so work can be handed over durably and picked up later — which is what makes "decouple" and "absorb bursts" the same answer.',
    whenToUse: [
      'Decoupling a producer from a slower or less-reliable consumer',
      'Absorbing traffic spikes so the backend scales on queue depth rather than crashing',
      'Work distribution across a fleet of workers, or an ASG scaling on ApproximateNumberOfMessagesVisible',
      'Buffering in front of a database or a rate-limited third-party API',
    ],
    whenNotToUse: [
      'One message must reach many independent consumers — that is SNS fan-out, or SNS in front of several SQS queues',
      'Real-time streaming with replay and ordered shards — Kinesis',
      'Sub-millisecond request/response — a queue adds latency by design',
    ],
    keyNumbers: [
      {
        label: 'Max message size',
        value: '256 KB',
        note: 'Larger payloads go to S3 with the Extended Client Library holding a pointer.',
      },
      { label: 'Retention', value: '60 seconds to 14 days (4 days default)' },
      { label: 'Visibility timeout', value: '0 seconds to 12 hours (30 seconds default)' },
      {
        label: 'Long polling',
        value: 'ReceiveMessageWaitTimeSeconds up to 20 seconds',
        note: 'Cuts empty-receive charges — always prefer it.',
      },
      { label: 'Delay queues', value: 'Up to 15 minutes delivery delay' },
      { label: 'Batch', value: 'Up to 10 messages per send or receive call' },
    ],
    optionSets: [
      {
        id: 'queue-type',
        label: 'Queue types',
        prompt: 'which queue type',
        note: 'Two options, asked on essentially every paper, and decided by whether order or throughput is the stated constraint.',
        options: [
          {
            name: 'Standard queue',
            pick: 'Throughput matters and the consumer can be made idempotent',
            signal: 'Effectively unlimited throughput · at-least-once delivery · best-effort ordering',
            gotcha:
              'Duplicates are guaranteed to happen eventually, so a design that cannot tolerate reprocessing needs FIFO or an idempotency key.',
          },
          {
            name: 'FIFO queue',
            pick: 'Order must be preserved, or a message must be processed exactly once',
            signal:
              '300 messages/second, 3,000 batched, far higher in high-throughput mode · exactly-once processing',
            gotcha:
              'Ordering is per message group ID, not per queue — different groups run in parallel, which is what makes "ordered per customer, parallel across customers" work.',
          },
        ],
      },
    ],
    examTraps: [
      'The visibility timeout must exceed the processing time. If it does not, another consumer picks up the same message and you get duplicate processing — the most-asked SQS failure mode.',
      'A dead-letter queue plus a maxReceiveCount is the answer to "a bad message is being retried forever" or "we need to inspect failed messages".',
      'Standard queues are at-least-once, so consumers must be idempotent. Only FIFO gives exactly-once processing.',
      'SQS never pushes. If the requirement is push, it is SNS, EventBridge or a Lambda event-source mapping (which polls on your behalf).',
      'Long polling reduces cost and empty responses. Short polling is essentially never the right answer.',
      'FIFO ordering is per message group ID. Different group IDs process in parallel — the answer to "ordered per customer, but parallel across customers".',
      'Scaling an ASG on queue depth (a backlog-per-instance target) is the canonical "decouple and scale" architecture.',
    ],
    confusedWith: [
      {
        slug: 'sns',
        difference:
          'SQS is one-to-one pull with retention; SNS is one-to-many push with no retention. Fan-out uses SNS → many SQS queues.',
      },
      {
        slug: 'kinesis-data-streams',
        difference:
          'Kinesis keeps an ordered, replayable log that many consumers read independently; SQS deletes a message once it is processed.',
      },
      {
        slug: 'eventbridge',
        difference:
          'EventBridge routes and filters events to many target types by rule; SQS just holds messages for whoever polls.',
      },
    ],
    pricing:
      'Per million requests (each 64 KB counts as one request), with a free tier. No charge for retention.',
    docsUrl: `${D}/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html`,
    related: [
      'sns',
      'lambda',
      'eventbridge',
      'kinesis-data-streams',
      'ec2-auto-scaling',
      'step-functions',
    ],
  },
  {
    slug: 'sns',
    name: 'Amazon SNS',
    abbr: 'SNS',
    category: 'appint',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Pub/sub topics that push one message to many subscribers at once.',
    whatItIs:
      'You publish to a topic; SNS pushes to every subscriber — SQS queues, Lambda functions, HTTP endpoints, email, SMS, mobile push, Kinesis Data Firehose. There is no retention: a subscriber that is down misses the message unless it is an SQS queue holding it. Message filtering lets each subscriber receive only the subset it cares about.',
    whyItExists:
      "When several systems need the same event, the producer ends up calling each of them in turn — so it knows every consumer, it is slow as the list grows, and one unreachable endpoint fails the whole publish. SNS exists to make that one call to a topic and let the fan-out be somebody else's problem; with no retention, though, a subscriber that is down misses the message, which is why the durable pattern is a topic in front of queues.",
    whenToUse: [
      'Fan-out: one event must trigger several independent downstream processes',
      'Notifications to humans — email, SMS, mobile push',
      'CloudWatch alarm actions',
      'SNS → SQS fan-out so each consumer gets its own durable, independently-paced queue',
    ],
    whenNotToUse: [
      'Work that must be retained until a worker is ready — SQS',
      'Complex routing on event content across many AWS services — EventBridge',
      'Ordered streaming with replay — Kinesis',
    ],
    keyNumbers: [
      { label: 'Max message size', value: '256 KB' },
      {
        label: 'Topic types',
        value:
          'Standard (best-effort order, at-least-once) · FIFO (ordered, deduplicated, SQS FIFO subscribers only)',
      },
      {
        label: 'Retention',
        value: 'None — undelivered messages are retried then dropped (or sent to a DLQ)',
      },
      { label: 'Subscribers per topic', value: '12.5 million', volatile: true },
      {
        label: 'Message filtering',
        value: 'Filter policies on message attributes or message body',
      },
    ],
    examTraps: [
      'SNS → multiple SQS queues is *the* fan-out pattern, and it appears constantly. Each consumer gets durability and its own retry behaviour.',
      'SNS has no retention. "Messages must not be lost if the consumer is offline" means you need SQS in the path.',
      'Filter policies are the answer to "each subscriber should only get the relevant messages" — better than filtering in the consumer.',
      'SNS FIFO topics can only deliver to SQS FIFO queues.',
      'An SNS DLQ is configured per *subscription*, not per topic.',
    ],
    confusedWith: [
      {
        slug: 'sqs',
        difference: 'Push to many with no retention, versus pull by one with retention.',
      },
      {
        slug: 'eventbridge',
        difference:
          'EventBridge has richer content-based routing, schema discovery, a schedule, and 20+ AWS target types. SNS has higher throughput, lower latency, and SMS/email/mobile push.',
      },
    ],
    pricing:
      'Per million publishes plus per-delivery charges by protocol (SMS and mobile push cost most).',
    docsUrl: `${D}/sns/latest/dg/welcome.html`,
    related: ['sqs', 'lambda', 'eventbridge', 'cloudwatch', 'data-firehose'],
  },
  {
    slug: 'eventbridge',
    name: 'Amazon EventBridge',
    abbr: 'EB',
    category: 'appint',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Serverless event bus that routes events to targets by content-matching rules.',
    whatItIs:
      'An event bus. AWS services, your own applications and SaaS partners publish JSON events; rules match on any field in the event and route to up to five targets each — Lambda, Step Functions, SQS, SNS, ECS tasks, API destinations and more. It also carries EventBridge Scheduler (cron and one-off schedules) and Pipes (point-to-point integrations with filtering and enrichment).',
    whyItExists:
      'Making one thing happen after another meant the producer knowing every consumer: a list of endpoints in its code, redeployed whenever somebody new wanted the event. Adding a consumer became a change to a service that had no interest in it. EventBridge exists to invert that — publishers describe what happened, subscribers declare what they care about, and neither side has to be edited when the other changes.',
    whenToUse: [
      'Reacting to AWS service events: an EC2 state change, a GuardDuty finding, a CodePipeline stage failing',
      'Event-driven architecture where producers should not know their consumers',
      'Scheduled work — the modern replacement for CloudWatch Events cron rules',
      'Routing on event content: "only orders over £1,000 from the EU"',
      'Sending events to a SaaS partner or receiving them from one',
    ],
    whenNotToUse: [
      'Very high-throughput, latency-sensitive fan-out — SNS is faster and cheaper at volume',
      'Ordered streaming with replay across shards — Kinesis',
      'Simple durable work queues — SQS',
    ],
    keyNumbers: [
      { label: 'Buses', value: 'Default bus (AWS service events) · custom buses · partner buses' },
      { label: 'Targets per rule', value: '5' },
      { label: 'Rules', value: 'Match on event pattern, or run on a schedule' },
      { label: 'Archive & replay', value: 'Archive events and replay them to a bus later' },
      { label: 'Schema registry', value: 'Discovers event schemas and generates code bindings' },
      { label: 'Latency', value: 'Typically sub-second, but higher than SNS' },
      { label: 'Input transformer', value: 'Reshape the event before it reaches the target' },
    ],
    examTraps: [
      'The tell for EventBridge is reacting to an *AWS service* event, or routing on event *content*. SNS cannot inspect arbitrary JSON structure the way an event pattern can.',
      'EventBridge Scheduler is the current answer to "run this every night" — not a Lambda with its own timer, and not the legacy CloudWatch Events wording.',
      'Archive and replay is unique among the messaging services here, and is the answer to "we need to reprocess last week\'s events".',
      'EventBridge Pipes replaces glue Lambda functions between a source and a target, with optional filtering and enrichment.',
      'API destinations let a rule call an external HTTP API with managed authentication and retries.',
    ],
    confusedWith: [
      {
        slug: 'sns',
        difference:
          'EventBridge routes on content to many AWS target types and can archive; SNS is faster, cheaper at scale, and can reach humans by SMS and email.',
      },
      {
        slug: 'step-functions',
        difference:
          'EventBridge routes single events; Step Functions runs a stateful multi-step workflow.',
      },
    ],
    pricing:
      'Per million events published (AWS service events on the default bus are free). Scheduler and Pipes bill separately.',
    docsUrl: `${D}/eventbridge/latest/userguide/eb-what-is.html`,
    related: ['sns', 'sqs', 'lambda', 'step-functions', 'guardduty', 'cloudwatch'],
  },
  {
    slug: 'step-functions',
    name: 'AWS Step Functions',
    abbr: 'SFN',
    category: 'appint',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner:
      'Visual state machines that orchestrate steps with built-in retries and error handling.',
    whatItIs:
      'A workflow engine. You define states — task, choice, parallel, map, wait, pass, succeed, fail — in Amazon States Language, and Step Functions runs them, keeping the state, retrying failures with your backoff policy, catching errors, and giving you a visual execution history of exactly where things went wrong. Two flavours: Standard for long-running, auditable, exactly-once workflows, and Express for high-volume short-lived ones.',
    whyItExists:
      'Multi-step processes were expressed as functions calling functions: the state lived in whatever was running, retries and backoff were re-implemented per call, a failure halfway through left the process in an unknown condition, and diagnosis meant reconstructing the order from log timestamps. Step Functions exists to hold the state and the error policy outside the code, so the workflow is inspectable and a retry is configuration.',
    whenToUse: [
      'Multi-step business processes: order fulfilment, media pipelines, ETL sequencing',
      'Replacing Lambda functions that call other Lambda functions and hand-roll retry logic',
      'Long-running workflows with waits, human approval, or callbacks',
      'Anything where you need to see which step failed and why',
    ],
    whenNotToUse: [
      'A single function invocation — the orchestration overhead buys nothing',
      'Simple event routing — EventBridge',
      'Very high-volume event streaming — Kinesis',
    ],
    keyNumbers: [
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
    examTraps: [
      'The tell is "coordinate", "orchestrate", "workflow", "multiple steps with retries", or "we need to see where it failed".',
      'Standard versus Express is decided by duration and volume: over 5 minutes or needing exactly-once → Standard. Millions of short executions → Express.',
      '.waitForTaskToken is the human-approval pattern — the workflow pauses until something calls SendTaskSuccess.',
      'Step Functions can call AWS services directly, so a Lambda function that only makes one SDK call is often removable — a cost and simplicity answer.',
      'Choreography (services reacting to events via EventBridge) versus orchestration (a central workflow) is a named DVA distinction.',
    ],
    confusedWith: [
      {
        slug: 'eventbridge',
        difference: 'Stateful multi-step workflow versus stateless single-event routing.',
      },
      {
        slug: 'batch',
        difference:
          'Batch runs a queue of compute jobs; Step Functions sequences steps (and can submit Batch jobs as one of them).',
      },
    ],
    pricing:
      'Standard bills per state transition. Express bills per request plus duration and memory.',
    docsUrl: `${D}/step-functions/latest/dg/welcome.html`,
    related: ['lambda', 'eventbridge', 'sqs', 'batch', 'ecs', 'dynamodb'],
  },
  {
    slug: 'mq',
    name: 'Amazon MQ',
    category: 'appint',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Managed ActiveMQ or RabbitMQ for applications that need standard protocols.',
    whatItIs:
      'A managed broker speaking industry-standard protocols — JMS, AMQP 1.0, MQTT, STOMP, OpenWire, WebSocket. It exists for one reason on the exam: migrating an existing on-premises message broker without rewriting the application to the SQS or SNS APIs.',
    whyItExists:
      'An application built around JMS or AMQP, with a decade of queue semantics baked into it, cannot be moved to SQS without rewriting the messaging layer and re-testing every path through it — a large project that delivers no new feature. Amazon MQ exists so lifting an ActiveMQ or RabbitMQ workload into AWS is a broker migration rather than an application rewrite, which is why the exam uses "existing broker" or a named protocol as the tell.',
    whenToUse: [
      'Migrating an existing JMS, AMQP or MQTT application to AWS unchanged',
      'The application requires a standard messaging protocol, not a proprietary API',
      'Both queue and topic semantics from one broker, with existing client libraries',
    ],
    whenNotToUse: [
      'Greenfield AWS applications — SQS and SNS scale further, cost less and need no broker to size',
      'Massive throughput — SQS scales effectively without limit; a broker does not',
    ],
    keyNumbers: [
      { label: 'Engines', value: 'ActiveMQ and RabbitMQ' },
      { label: 'Protocols', value: 'JMS · AMQP 1.0 · MQTT · STOMP · OpenWire · WebSocket' },
      { label: 'Deployment', value: 'Single-instance or active/standby across two AZs' },
    ],
    examTraps: [
      'The tell is an *existing* application using a standard protocol plus "minimal application changes". Without that, choose SQS/SNS.',
      'Amazon MQ runs on brokers you size — it is not serverless, unlike SQS and SNS.',
    ],
    confusedWith: [
      {
        slug: 'sqs',
        difference:
          'SQS is a proprietary, serverless, effectively unlimited queue. MQ is a sized broker speaking open protocols.',
      },
      {
        slug: 'msk',
        difference: 'MSK is managed Kafka for streaming; MQ is a traditional message broker.',
      },
    ],
    pricing: 'Per broker-instance-hour plus storage.',
    docsUrl: `${D}/amazon-mq/latest/developer-guide/welcome.html`,
    related: ['sqs', 'sns', 'msk'],
  },
  {
    slug: 'appflow',
    name: 'Amazon AppFlow',
    category: 'appint',
    families: ['saa'],
    tier: 3,
    oneLiner: 'No-code data flows between SaaS applications and AWS.',
    whatItIs:
      'Managed, configurable transfers between SaaS products (Salesforce, ServiceNow, Slack, Zendesk, Google Analytics) and AWS services such as S3 and Redshift, on a schedule, on an event, or on demand — with field mapping, filtering and validation built in.',
    whenToUse: [
      'Ingesting SaaS data into a data lake or warehouse without writing integration code',
    ],
    whenNotToUse: ['Streaming data at scale — Kinesis or MSK', 'AWS-to-AWS movement — Glue or DMS'],
    keyNumbers: [{ label: 'Triggers', value: 'On demand · on schedule · on SaaS event' }],
    examTraps: [
      'The tell is a named third-party SaaS product plus "no code" or "without building an integration".',
    ],
    confusedWith: [
      {
        slug: 'glue',
        difference:
          'Glue is a Spark-based ETL engine for your own data; AppFlow is prebuilt SaaS connectors.',
      },
    ],
    pricing: 'Per flow run plus per GB processed.',
    docsUrl: `${D}/appflow/latest/userguide/what-is-appflow.html`,
    related: ['glue', 's3', 'redshift'],
  },
]
