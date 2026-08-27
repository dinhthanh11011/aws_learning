import type { Lesson } from '../schema'

/**
 * Every picture in the previous two lessons showed a message arriving once.
 * None of them do. The exam knows this and asks about it constantly — "the
 * customer was charged twice", "a bad message is being retried forever", "the
 * event vanished and nothing logged it" — and all three are the same subject
 * seen at three different moments of the second delivery.
 *
 * So the order is: watch the duplicate happen from a cause that has nothing to
 * do with a bug (the visibility timeout, which is a *setting*), name it, then
 * write the two fixes as real code. The wrong answers come next as real
 * commands, because "add a dead-letter queue" and "switch to FIFO" are both
 * things a person actually types and both are wrong for the double-charge
 * question in a way a sentence does not convey.
 *
 * The Lambda half arrives last on purpose: retries you configured are easier to
 * reason about than retries somebody else is doing on your behalf.
 */
export const retriesDlqsAndIdempotency: Lesson = {
  id: 'retries-dlqs-and-idempotency',
  families: ['saa', 'dva'],
  taskId: 'dva-1.1',
  title: 'What happens on the second delivery',
  subtitle:
    'At-least-once is not a caveat in the small print, it is the contract — and the most-asked failure in the messaging domain is caused by a timeout setting rather than by any bug. Here is the duplicate happening, and the three fixes people confuse with each other.',
  minutes: 15,
  tier: 1,
  serviceSlugs: ['sqs', 'sns', 'lambda'],
  requires: ['lambda-execution-model', 'queue-topic-bus'],
  cardIds: [
    'idea:idempotency',
    'define:idempotency',
    'num:concept:idempotency:sqs-fifo-deduplication-window',
    'num:concept:idempotency:lambda-async-retries',
    'trap:concept:idempotency:fifo-exactly-once-applies-within-the-five-minute-deduplicati',
    'trap:concept:idempotency:a-dead-letter-queue-does-not-prevent-duplicates-it-collects',
    'trap:concept:idempotency:choosing-fifo-purely-to-avoid-duplicates-costs-you-throughpu',
    'trap:sqs:the-visibility-timeout-must-exceed-the-processing-time-if-i',
    'trap:sqs:a-dead-letter-queue-plus-a-maxreceivecount-is-the-answer-to',
    'trap:sqs:standard-queues-are-at-least-once-so-consumers-must-be-idem',
    'trap:sqs:long-polling-reduces-cost-and-empty-responses-short-polling',
    'trap:lambda:async-invocations-s3-sns-eventbridge-retry-twice-more-t',
    'trap:lambda:sqs-as-an-event-source-uses-long-polling-with-batches-the-b',
    'trap:sns:an-sns-dlq-is-configured-per-subscription-not-per-topic',
    'opt:sqs:queue-type:standard-queue',
    'opt:sqs:queue-type:fifo-queue',
    'trap:opt:sqs:queue-type:standard-queue',
    'num:sqs:visibility-timeout',
    'num:sqs:retention',
    'num:sqs:batch',
    'num:sqs:long-polling',
    'vs:concept:idempotency:eventual-vs-strong-consistency',
    'trigger:t-dup-messages',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'Here is a failure with no bug in it. A payment consumer is correct, the queue is healthy, nobody has deployed anything — and a customer is charged twice. It happens because of a number somebody set to its default and never looked at again, and it is the most-asked failure mode in the whole messaging domain.',
    },

    /* ── 2. Watch it happen ───────────────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'rdi-double-charge',
        title: 'One message, 45 seconds of work, a 30-second visibility timeout',
        caption:
          'Read it as a clock running left to right. Nothing here is broken; the second worker is behaving exactly as designed, and that is the point.',
        // Template B, fan-in-the-middle: the same journey, differing at one point.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'sqs',
            label: 'Payments queue',
            sub: 'one message',
            kind: 'service',
            category: 'appint',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'worker-a',
            label: 'Worker A',
            sub: '45 seconds of work',
            kind: 'note',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'visible',
            label: 'Visible again',
            sub: 'at 30 seconds',
            kind: 'note',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'delete',
            label: 'DeleteMessage',
            sub: 'at 45 seconds',
            kind: 'note',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'worker-b',
            label: 'Worker B charges',
            sub: 'the same card again',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'too-late',
            label: 'Deleted, too late',
            sub: 'the charge already ran',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'recv', from: 'sqs', to: 'worker-a', label: 'received', tone: 'default' },
          { id: 'expire', from: 'worker-a', to: 'visible', label: '30 s passes', tone: 'warn' },
          { id: 'redeliver', from: 'visible', to: 'worker-b', label: 'delivered', tone: 'bad' },
          { id: 'finish', from: 'worker-a', to: 'delete', label: 'finishes', tone: 'default' },
          { id: 'gone', from: 'delete', to: 'too-late', label: 'succeeds', tone: 'warn' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['recv'],
            title: 'Worker A receives the message and starts work that takes 45 seconds',
            detail:
              'The message is not removed from the queue — it is hidden from other consumers for the length of the **visibility timeout**, which is 30 seconds by default and which nobody changed.',
            tone: 'default',
          },
          {
            edgeIds: ['expire', 'redeliver'],
            title: 'At 30 seconds the message becomes visible again, and Worker B takes it',
            detail:
              'SQS has no way to know that Worker A is still working; the only signal it has is the timeout, and the timeout said the work should have been over. Worker B polls, receives the same message, and charges the same card. **Nothing has malfunctioned.**',
            tone: 'bad',
          },
          {
            edgeIds: ['finish', 'gone'],
            title: 'At 45 seconds Worker A finishes and deletes the message',
            detail:
              'The delete succeeds and the queue is empty, so nothing in the metrics looks wrong afterwards. The duplicate charge is the only trace, which is why this is described in a stem as a business symptom rather than an error.',
            tone: 'warn',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'The rule, now that you have watched it break',
      md: '**The visibility timeout must exceed the processing time.** It is configurable from 0 seconds to 12 hours and defaults to 30 seconds, and if it is shorter than the work then another consumer picks the same message up and you get duplicate processing. Raise it, or extend it while working — but notice that this fixed one *cause* of a duplicate, not duplicates.',
    },

    /* ── 3. The two fixes, as code ────────────────────────────────────────── */
    { kind: 'heading', text: 'The other cause, which no setting can remove' },
    {
      kind: 'prose',
      md: 'A standard queue is **at-least-once**: the same message can be delivered more than once even with a perfectly-sized timeout, because a distributed system cannot tell a lost request from a lost reply. So duplicates are not an error condition to be prevented — they are a normal event the handler has to absorb. That property has a name, and it is the answer to every double-charge question.',
    },
    {
      kind: 'code',
      lang: 'javascript',
      caption: 'A deduplication key: record the id first, and let the second delivery lose',
      code: `export const handler = async (event) => {
  for (const record of event.Records) {
    const { orderId, amount } = JSON.parse(record.body)

    try {
      await ddb.send(new PutItemCommand({
        TableName: 'processed',
        Item: { pk: { S: orderId } },
        ConditionExpression: 'attribute_not_exists(pk)',   // the whole fix
      }))
    } catch (e) {
      if (e.name === 'ConditionalCheckFailedException') continue
      throw e
    }

    await charge(orderId, amount)
  }
}`,
    },
    {
      kind: 'steps',
      title: 'What that handler is actually claiming',
      items: [
        {
          title: 'Setting a value is idempotent; adding to one is not',
          md: 'That is the whole distinction. [[idempotency|An idempotent operation]] can be safely retried, so doing it twice has the same effect as doing it once — and a charge is the classic example of an operation that is not, which is why it needs a key rather than a retry policy.',
        },
        {
          title: 'The conditional write is what makes the second delivery lose',
          md: 'The usual implementation is a deduplication key: record the message or request id, and skip work you have already done. The condition makes that record-and-check a single atomic step, so two workers racing on the same message cannot both pass it.',
        },
        {
          title: 'It loops over Records, because SQS arrives in batches',
          md: 'An event-source mapping polls on your behalf, using long polling, and hands your function up to 10 messages at a time. Which raises the question the next block answers: what happens to the other nine when one of them throws?',
        },
        {
          title: 'And this is required of you whatever the source is',
          md: 'Nearly every AWS event source is at-least-once — S3 notifications, SNS, standard SQS, EventBridge, Lambda asynchronous retries. Idempotency is not a refinement of event-driven design; it is a precondition for it.',
        },
      ],
    },

    /* ── 4. The two answers that get chosen instead ───────────────────────── */
    { kind: 'heading', text: 'Two commands that get typed at this problem' },
    {
      kind: 'code',
      lang: 'bash',
      caption: 'Both are real, useful settings. Neither one stops a duplicate.',
      code: `# "Add a dead-letter queue so bad messages stop being reprocessed"
aws sqs set-queue-attributes --queue-url .../payments --attributes \\
  'RedrivePolicy={"deadLetterTargetArn":"...","maxReceiveCount":"5"}'
                                               ^^^^^^^^^^^^^^^
     Receives, not failures — and it moves a message *after* it has been
     handed out five times. A DLQ collects what failed; it has never
     prevented a duplicate.

# "Then make the queue FIFO, which is exactly-once"
aws sqs create-queue --queue-name payments.fifo
                                  ^^^^^^^^^^^^^
     Exactly-once, within a five-minute deduplication window. A retry an
     hour later is a new message — and you have just capped throughput to
     buy a guarantee the handler still cannot rely on.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Three settings, three different questions',
      md: 'A **dead-letter queue plus a maxReceiveCount** is the answer to *"a bad message is being retried forever"* or *"we need to inspect what failed"* — and a silent DLQ is a silent outage, so the depth is worth an alarm. **FIFO** is the answer to *ordering*, and choosing it purely to avoid duplicates costs throughput and is usually the more expensive wrong answer when a deduplication key would do. **A deduplication key in the consumer** is the answer to *"the customer was charged twice"*. The exam offers all three against all three prompts.',
    },

    /* ── 5. The retries you did not configure ─────────────────────────────── */
    { kind: 'heading', text: 'And the retries somebody else is doing for you' },
    {
      kind: 'steps',
      title: 'Three invocation shapes, three different fates for a failed event',
      items: [
        {
          title: 'Asynchronous — S3, SNS, EventBridge — retries twice more, then it is gone',
          md: 'Two automatic retries by default, and then the event goes to a **dead-letter queue or an on-failure destination**. If neither is configured, the event is simply gone, and that is the stem describing an event that vanished with nothing logging it.',
        },
        {
          title: 'Synchronous does not retry at all — the caller owns it',
          md: 'This is the pair the exam sets against each other. An asynchronous invocation gets the two retries; a synchronous one gets none, so whatever called the function is the only thing that can try again.',
        },
        {
          title: 'Poll-based batches fail as a batch unless you say otherwise',
          md: 'For an SQS, Kinesis or DynamoDB Streams event source, a failed batch without partial-failure reporting **redelivers the whole batch** — including the nine messages that succeeded, which your handler will now process a second time. `ReportBatchItemFailures` is the specific fix, narrowing the retry to the failing records.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Where the dead letters attach, which is asked directly',
      md: 'An **SNS dead-letter queue is configured per subscription, not per topic** — so "add a DLQ to the topic" is a wrong answer with the right word in it. On an SQS queue the DLQ is a redrive policy on the source queue. Two different services, two different attachment points, and the exam asks which is which.',
    },

    /* ── 6. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'The symptom, the cause, and the answer that will be sitting next to it',
      columns: ['What is actually happening', 'The plausible wrong answer'],
      rows: [
        {
          label: '"Messages are being processed twice"',
          cells: [
            'The visibility timeout is shorter than the processing time',
            'Switch to a FIFO queue — a bigger change than needed, and it caps throughput',
          ],
        },
        {
          label: '"The customer was charged twice"',
          cells: [
            'At-least-once delivery met a handler with no deduplication key',
            'Add a dead-letter queue, which collects failures and prevents nothing',
          ],
        },
        {
          label: '"One bad message is retried forever"',
          cells: [
            'No redrive policy — a DLQ with a maxReceiveCount is the fix',
            'Raise the visibility timeout, which only makes each retry cycle longer',
          ],
        },
        {
          label: '"Nine good messages were reprocessed because one failed"',
          cells: [
            'A poll-based batch failing whole — turn on ReportBatchItemFailures',
            'A smaller batch size, which shrinks the blast radius without fixing it',
          ],
        },
        {
          label: '"The event disappeared and nothing recorded it"',
          cells: [
            'An asynchronous invocation exhausted its two retries with no DLQ or destination',
            'A synchronous retry setting, which does not exist — sync never retries',
          ],
        },
        {
          label: '"A duplicate arrived an hour after the original"',
          cells: [
            'Outside the five-minute FIFO deduplication window, so it is a new message',
            'A FIFO misconfiguration. The window behaved exactly as documented',
          ],
        },
      ],
    },

    /* ── 7. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Visibility timeout', value: '0 seconds to 12 hours (30 seconds default)' },
        { label: 'Retention', value: '60 seconds to 14 days (4 days default)' },
        { label: 'Batch', value: 'Up to 10 messages per send or receive call' },
        {
          label: 'Long polling',
          value: 'ReceiveMessageWaitTimeSeconds up to 20 seconds',
          note: 'Cuts empty-receive charges — always prefer it.',
        },
        {
          label: 'SQS FIFO deduplication window',
          value: '5 minutes',
          note: 'Outside it, the same message id is treated as new.',
        },
        {
          label: 'Lambda async retries',
          value: '2 automatic retries by default',
          note: 'Then the event goes to the destination or dead-letter queue if configured.',
        },
      ],
    },

    /* ── 8. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['sqs', 'sns', 'lambda'],
    },
    {
      kind: 'prose',
      md: 'One distinction worth keeping straight, because the two get offered as alternatives and are not: idempotency is about a repeated operation being safe, while [[eventual-vs-strong-consistency|consistency]] is about whether a read is current. A duplicate write and a stale read are different problems with different fixes, and a stem that describes one will always put the other in the options.',
    },
  ],

  checks: [
    {
      id: 'retries-dlqs-and-idempotency-visibility',
      prompt:
        'A consumer takes about 45 seconds per message on a queue left at its defaults, and operations report that some work is being done twice. What is the first fix?',
      options: [
        {
          text: 'Raise the visibility timeout above the processing time',
          correct: true,
          why: 'The default is 30 seconds, so the message becomes visible again while the first consumer is still working and a second consumer receives it. The timeout must exceed the processing time.',
        },
        {
          text: 'Convert the queue to FIFO so each message is delivered exactly once',
          correct: false,
          why: 'A much bigger change that caps throughput, and it addresses the wrong cause. The redelivery here is produced by a timeout setting, which a queue type does not change.',
        },
        {
          text: 'Attach a dead-letter queue with a maxReceiveCount of 1',
          correct: false,
          why: 'A DLQ collects what failed after the retries. Nothing here has failed — the work is succeeding, twice — so the message would be moved out of a healthy queue.',
        },
      ],
    },
    {
      id: 'retries-dlqs-and-idempotency-double-charge',
      prompt:
        'The visibility timeout is already generous, and very occasionally a customer is still charged twice on a standard queue. What is the answer?',
      options: [
        {
          text: 'A deduplication key in the consumer — record the message id and skip work already done',
          correct: true,
          why: 'Standard queues are at-least-once, so duplicates are guaranteed to happen eventually. Idempotency is the consumer’s job, and a conditional write on a unique id is the standard implementation.',
        },
        {
          text: 'A dead-letter queue, so duplicates are diverted instead of processed',
          correct: false,
          why: 'A dead-letter queue does not prevent duplicates; it collects what failed after the retries. Answering "add a DLQ" to a double-charge question is the classic wrong answer.',
        },
        {
          text: 'Nothing — this is a bug in the consumer that should be found and fixed',
          correct: false,
          why: 'At-least-once delivery is the documented contract rather than a defect. A correct consumer on a standard queue will still see the same message twice.',
        },
      ],
    },
    {
      id: 'retries-dlqs-and-idempotency-batch',
      prompt:
        'A Lambda function reads batches of 10 from SQS. One malformed message throws, and the CloudWatch logs show the other nine being processed repeatedly. What turns this off?',
      options: [
        {
          text: 'ReportBatchItemFailures, so only the failing records are retried',
          correct: true,
          why: 'Without partial-failure reporting a failed batch is redelivered whole, including the records that succeeded. It applies to SQS, Kinesis and DynamoDB Streams event sources.',
        },
        {
          text: 'Reduce the batch size to 1 so a failure cannot take others with it',
          correct: false,
          why: 'It shrinks the blast radius and multiplies the invocations. The malformed message still retries forever, and the batching benefit is gone.',
        },
        {
          text: 'Raise the visibility timeout so the batch has longer to complete',
          correct: false,
          why: 'The batch is not running out of time — one record in it is throwing. More time changes nothing about the outcome.',
        },
      ],
    },
    {
      id: 'retries-dlqs-and-idempotency-async',
      prompt:
        'A function invoked asynchronously by S3 fails on every attempt for a particular object, and the team finds no record of the event anywhere afterwards. Why?',
      options: [
        {
          text: 'Asynchronous invocations retry twice more and then discard the event unless a DLQ or on-failure destination is configured',
          correct: true,
          why: 'Two automatic retries by default, then the event goes to a destination or dead-letter queue — and if neither exists, it is gone. That is precisely the "vanished with nothing logging it" description.',
        },
        {
          text: 'S3 event notifications are best-effort and are not retried at all',
          correct: false,
          why: 'The retry behaviour belongs to the asynchronous invocation model, and there are two retries. The absence of a record comes from the missing failure destination, not from the absence of retries.',
        },
        {
          text: 'The function timed out, and timed-out invocations are never sent to a dead-letter queue',
          correct: false,
          why: 'Nothing distinguishes a timeout here, and the failure destination covers a function that keeps failing regardless of how it fails. The missing configuration is the cause.',
        },
      ],
    },
  ],
}
