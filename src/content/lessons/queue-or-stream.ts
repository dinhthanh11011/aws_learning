import type { Lesson } from '../schema'

/**
 * The third of the long tail: Kinesis against SQS, which the atlas calls "a
 * recurring decision" and which the bank asks five times.
 *
 * `queue-topic-bus` already established what a queue is, so this lesson
 * declares `requires` on it and starts from the one property that decision
 * turns on: a queue deletes, a stream retains. Everything else — replay,
 * several consumers, ordering — falls out of that single difference, so the
 * walkthrough shows the same event going both ways and stops at the moment the
 * second consumer looks.
 *
 * The wrong answer is a constant partition key, because it is real code that
 * ships, passes review, works in staging with four orders a minute, and then
 * produces ProvisionedThroughputExceededException on a stream with plenty of
 * spare capacity. "A hot shard" is a phrase; one string literal is a
 * demonstration.
 */
export const queueOrStream: Lesson = {
  id: 'queue-or-stream',
  families: ['saa', 'dva'],
  taskId: 'saa-3.5',
  title: 'When a queue is the wrong shape',
  subtitle:
    'Processing a message destroys it. That is the entire difference between a queue and a stream, and it is why the second team who asks for the same events cannot have them — no matter how much capacity you add. Three words in a stem tell you which of the two the question is really about.',
  minutes: 16,
  tier: 1,
  serviceSlugs: ['kinesis-data-streams', 'sqs'],
  requires: ['queue-topic-bus'],
  cardIds: [
    'which:kinesis-data-streams',
    'not:kinesis-data-streams',
    'num:kinesis-data-streams:shard-write-capacity',
    'num:kinesis-data-streams:shard-read-capacity',
    'num:kinesis-data-streams:max-record-size',
    'num:kinesis-data-streams:retention',
    'num:kinesis-data-streams:capacity-modes',
    'num:kinesis-data-streams:ordering',
    'num:kinesis-data-streams:latency',
    'trap:kinesis-data-streams:kinesis-versus-sqs-is-a-recurring-decision-ordering-replay',
    'trap:kinesis-data-streams:provisionedthroughputexceededexception-means-a-hot-shard-to',
    'trap:kinesis-data-streams:enhanced-fan-out-is-the-answer-when-several-consumers-are-co',
    'trap:kinesis-data-streams:a-lambda-event-source-mapping-on-a-stream-processes-records',
    'trap:kinesis-data-streams:on-demand-mode-is-the-answer-to-unpredictable-throughput',
    'trap:kinesis-data-streams:the-kinesis-producer-library-aggregates-records-for-efficien',
    'vs:kinesis-data-streams:data-firehose',
    'vs:kinesis-data-streams:sqs',
    'vs:kinesis-data-streams:msk',
    'vs:sqs:kinesis-data-streams',
    'trigger:t-realtime',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'The order pipeline has worked for a year. Then the analytics team asks to see the same orders, and you discover there is nothing to give them — not because of permissions, and not because of throughput, but because billing already processed each message and a processed message is gone. Adding a consumer to a queue does not give you two copies of the work; it gives you two workers racing for the same one. That single property, and nothing else, is what the exam is testing when it puts [[sqs]] and [[kinesis-data-streams|Kinesis Data Streams]] in the same set of options.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'qos-delete-or-retain',
        title: 'The same order event, sent two ways, with two teams reading it',
        caption:
          'Nothing to the left differs. The two endings are produced entirely by what happens to a record after somebody reads it.',
        // Template B, fan-in-the-middle: one event, forked on whether reading
        // it destroys it.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'event',
            label: 'Order placed',
            sub: 'one event, once',
            kind: 'note',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'producer',
            label: 'Your producer',
            sub: 'sends it somewhere',
            kind: 'note',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'sqs',
            label: 'Amazon SQS',
            sub: 'billing polls and deletes',
            kind: 'service',
            category: 'appint',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'kinesis-data-streams',
            label: 'Kinesis Data Streams',
            sub: 'billing reads, record stays',
            kind: 'service',
            category: 'analytics',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'nothing',
            label: 'Analytics finds nothing',
            sub: 'it was deleted',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'both',
            label: 'Analytics reads it too',
            sub: 'own position, own pace',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'emit', from: 'event', to: 'producer', label: 'happens', tone: 'default' },
          { id: 'toq', from: 'producer', to: 'sqs', label: 'send', tone: 'warn' },
          { id: 'qread', from: 'sqs', to: 'nothing', label: 'later', tone: 'bad' },
          {
            id: 'tostream',
            from: 'producer',
            to: 'kinesis-data-streams',
            label: 'put',
            tone: 'ok',
          },
          { id: 'sread', from: 'kinesis-data-streams', to: 'both', label: 'later', tone: 'ok' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['emit'],
            title: 'One event, and two teams who both need it',
            detail:
              'Billing has to charge the card. Analytics has to count the order. Neither is a retry of the other — they are two different jobs over the same fact.',
            tone: 'default',
          },
          {
            edgeIds: ['toq', 'qread'],
            title: 'Down the queue path, billing consumes it — and consuming means deleting',
            detail:
              'Producers send, consumers poll, process and **delete**. When analytics comes looking an hour later there is nothing there, and there is no setting that changes this: it is what a queue is. Fan-out to several consumers is [[sns]] in front of several queues, which is **a different design, decided up front**.',
            tone: 'bad',
          },
          {
            edgeIds: ['tostream', 'sread'],
            title: 'Down the stream path, reading changes nothing',
            detail:
              'Records are **kept for a retention period and read by multiple independent consumers, each tracking its own position**. Analytics reads the same records billing already read, at its own pace — and if its code was wrong, it can go back and read them again.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the name for it: a retained, ordered log',
      md: 'A stream is records split into **shards**: ordered within a shard, kept for the retention period, and read by consumers who each hold their own position in it. **A queue message is deleted after processing; a stream record stays for the retention period and can be re-read.** That is the sentence to carry into the exam, because the three things the paper actually asks about — replay, multiple independent consumers, and ordering — are all consequences of it.',
    },

    /* ── 3. The real configuration, read out a line at a time ─────────────── */
    { kind: 'heading', text: 'The one field that decides everything about throughput' },
    {
      kind: 'code',
      lang: 'javascript',
      caption: 'Writing a record. Three of these four lines are uninteresting.',
      code: `await kinesis.send(
  new PutRecordCommand({
    StreamName: 'orders',
    PartitionKey: order.customerId,
    Data: Buffer.from(JSON.stringify(order)),
  }),
)`,
    },
    {
      kind: 'steps',
      title: 'What the partition key is doing',
      items: [
        {
          title: 'It chooses the shard, and the shard is the unit of capacity',
          md: 'A shard takes **1 MB/s or 1,000 records per second in**, and gives **2 MB/s out, shared across consumers**. Those are per-shard numbers, not per-stream — so a stream with twenty shards has twenty times the capacity only if the keys spread across them.',
        },
        {
          title: 'It is also the unit of ordering',
          md: '**Ordering is guaranteed within a shard, by partition key.** Everything with the same key arrives at one shard in the order it was written, which is what makes "ordered per customer, parallel across customers" possible — and it is why the key is usually an entity id rather than anything about the event.',
        },
        {
          title: 'The record itself has a ceiling of 1 MB',
          md: 'Anything larger is not a record, and the answer is the same one it always is: put the payload somewhere addressable and stream the pointer.',
        },
        {
          title: 'And there is a library whose whole job is this write',
          md: '**The Kinesis Producer Library aggregates records for efficiency; the Kinesis Client Library handles checkpointing and shard rebalancing.** Those two names are asked as a pair, and the split between them is producer-side batching against consumer-side position keeping.',
        },
      ],
    },

    /* ── 4. The wrong answer, as real syntax ──────────────────────────────── */
    { kind: 'heading', text: 'The literal that throttles a stream with capacity to spare' },
    {
      kind: 'code',
      lang: 'javascript',
      caption:
        'It passed review. It worked in staging. Production has twelve shards and throttles.',
      code: `    PartitionKey: 'orders',
                  ^^^^^^^^
                  Every record now carries the same key, so every record
                  hashes to the same shard. Eleven shards sit idle while
                  one of them takes the entire stream and starts refusing
                  writes at 1 MB/s. The stream is not out of capacity —
                  one shard is, and the metric on the stream looks fine.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The exception names the symptom, not the cause',
      md: '`ProvisionedThroughputExceededException` **means a hot shard: too many records share one partition key. The fix is a higher-cardinality partition key, or more shards** — and adding shards alone does not help if the key is a constant, because the constant still hashes to one of them. This is the same failure as a hot partition in [[dynamodb|DynamoDB]], wearing a different exception, and [[partition-key|partition key]] is the concept both of them are an instance of.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The read side has its own ceiling, and its own answer',
      md: 'Those **2 MB/s per shard are shared across consumers**, so the third analytics team to attach is taking throughput from the first two. **Enhanced fan-out is the answer when several consumers are competing for the shared 2 MB/s per shard and each needs full throughput** — it gives each consumer its own dedicated 2 MB/s, and brings latency down to sub-second where the typical figure is around 200 ms. And if the shard arithmetic itself is the problem, **on-demand mode is the answer to "unpredictable throughput"** — no shard maths required.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'One consequence of ordering that surprises people in production',
      md: '**A Lambda event-source mapping on a stream processes records per shard in order, and a failing batch blocks that shard until it succeeds or expires.** Ordering is not free: one poison record stops everything behind it on that shard, and the throughput graph goes flat rather than red. **Configure a bisect-on-error and a maximum retry age** — that pair is the standard fix and it is asked by name.',
    },

    /* ── 5. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'The sentence in the stem, and what it is choosing',
      columns: ['The answer', 'Why the other one is not'],
      rows: [
        {
          label: '“Replay the last N hours after fixing a bug”',
          cells: [
            'Kinesis Data Streams — the records are still there',
            'SQS deletes on processing, so there is nothing left to replay',
          ],
        },
        {
          label: '“Several teams consume the same events independently”',
          cells: [
            'Kinesis Data Streams — each consumer holds its own position',
            'Extra SQS consumers compete for one message rather than each getting a copy',
          ],
        },
        {
          label: '“Process each job once, then it is done”',
          cells: [
            'SQS — simpler and cheaper, and this is what it is for',
            'A stream buys retention and ordering that nothing in the requirement asked for',
          ],
        },
        {
          label: '“Near real-time, into S3 or Redshift, with no code”',
          cells: [
            'Amazon Data Firehose — zero-code delivery to a destination',
            'Data Streams needs a consumer written, and Firehose cannot replay',
          ],
        },
        {
          label: '“Our existing Kafka producers must keep working”',
          cells: [
            'Amazon MSK — API compatibility is the deciding factor',
            'Kinesis is the AWS-native equivalent with less to operate, and a different API',
          ],
        },
        {
          label: '“Ordered per customer, parallel across customers”',
          cells: [
            'Either — a Kinesis partition key, or an SQS FIFO message group id',
            'The choice then falls back to replay and multiple consumers',
          ],
        },
      ],
    },

    /* ── 6. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Shard write capacity', value: '1 MB/s or 1,000 records per second' },
        {
          label: 'Shard read capacity',
          value: '2 MB/s shared across consumers',
          note: 'Enhanced fan-out gives each consumer its own dedicated 2 MB/s.',
        },
        { label: 'Max record size', value: '1 MB' },
        { label: 'Retention', value: '24 hours default · up to 365 days' },
        {
          label: 'Capacity modes',
          value: 'Provisioned (you manage shards) or On-demand (automatic)',
        },
        { label: 'Ordering', value: 'Guaranteed within a shard, by partition key' },
        { label: 'Latency', value: 'Sub-second with enhanced fan-out; ~200 ms typical' },
      ],
    },

    /* ── 7. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['kinesis-data-streams', 'sqs'],
    },
    {
      kind: 'prose',
      md: 'The failure mode in the last callout — one bad record stopping a shard — is the streaming version of a problem the queue side solves with a dead-letter queue and a visibility timeout. **Retries, DLQs and idempotency** is the lesson that takes that apart, and it is worth reading straight after this one if the words "poison pill" meant nothing above.',
    },
  ],

  checks: [
    {
      id: 'queue-or-stream-second-consumer',
      prompt:
        'Clickstream events are processed by one consumer today. A second team now needs to run its own analysis over the same events, including the last two days of history. What do you use?',
      options: [
        {
          text: 'Kinesis Data Streams, where records are retained and each consumer tracks its own position',
          correct: true,
          why: 'Two independent consumers plus history is the Kinesis signature. A retained, ordered log is exactly what lets the second team read what the first has already read.',
        },
        {
          text: 'A second SQS consumer on the existing queue, scaled to match the first',
          correct: false,
          why: 'Consumers on one queue compete for each message rather than each receiving a copy, and a processed message is deleted — so there is no history to give the second team.',
        },
        {
          text: 'Amazon Data Firehose, delivering the events to S3 for both teams to query',
          correct: false,
          why: 'Firehose is zero-code delivery to a destination with a buffering delay and no replay. It is the answer when nobody is writing a consumer, which is not this question.',
        },
      ],
    },
    {
      id: 'queue-or-stream-hot-shard',
      prompt:
        'A stream with twelve shards is returning ProvisionedThroughputExceededException, although total traffic is well within twelve shards’ capacity. What is the likely cause?',
      options: [
        {
          text: 'A hot shard — too many records share one partition key, so one shard takes everything',
          correct: true,
          why: 'The limits are per shard. A low-cardinality partition key sends every record to the same shard while the others sit idle, and the fix is a better key or more shards.',
        },
        {
          text: 'Consumers are reading faster than the shared 2 MB/s per shard allows',
          correct: false,
          why: 'That is a read-side constraint, answered by enhanced fan-out. This exception is raised on writes.',
        },
        {
          text: 'Records are exceeding the 1 MB maximum record size',
          correct: false,
          why: 'An oversized record is rejected on its own terms rather than reported as exceeded throughput, and it would not depend on total traffic.',
        },
      ],
    },
    {
      id: 'queue-or-stream-simple-work',
      prompt:
        'Uploaded images must each be resized once by a pool of workers, with no history kept and nobody else consuming them. Which service?',
      options: [
        {
          text: 'SQS, because the work is processed once and then finished',
          correct: true,
          why: 'Nothing in the requirement asks for ordering, replay or independent consumers, so the simpler and cheaper option is correct. Choosing a stream here buys retention nobody wants and shard maths nobody needs.',
        },
        {
          text: 'Kinesis Data Streams, so the resize can be replayed if a worker crashes',
          correct: false,
          why: 'A crashed worker is what visibility timeout and redelivery already handle in a queue. Replay is for re-processing after a code fix, not for a single failed attempt.',
        },
        {
          text: 'SNS, so every worker in the pool is notified of every upload',
          correct: false,
          why: 'That would have every worker resize every image. Fan-out delivers a copy to each subscriber, which is the opposite of distributing work.',
        },
      ],
    },
    {
      id: 'queue-or-stream-fan-out',
      prompt:
        'Four consumers read one stream and all of them are now falling behind, though the producers have not sped up. What is the fix the exam wants?',
      options: [
        {
          text: 'Enhanced fan-out, giving each consumer its own dedicated 2 MB/s per shard',
          correct: true,
          why: 'The default 2 MB/s per shard is shared across consumers, so each new consumer takes throughput from the others. Enhanced fan-out is the named answer to exactly this.',
        },
        {
          text: 'Switch the stream to on-demand mode so it scales with the consumers',
          correct: false,
          why: 'On-demand removes the shard maths for unpredictable *ingest*. It does not change the fact that standard consumers share a shard’s read throughput.',
        },
        {
          text: 'Increase the retention period so consumers have longer to catch up',
          correct: false,
          why: 'Longer retention buys time before data expires, which is worth having, but it does nothing about the read throughput the consumers are competing for.',
        },
      ],
    },
  ],
}
