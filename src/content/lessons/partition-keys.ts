import type { Lesson } from '../schema'

/**
 * Every DynamoDB throttling scenario on either paper is the same question
 * wearing a different hat: the limit is per partition, and the key decides how
 * many partitions the traffic reaches. The distractor is always more capacity.
 *
 * So the picture comes before the phrase "hot partition": the same thousand
 * writes a second, forked on nothing but the attribute chosen as the key, and
 * one branch throttling while the other does not. Only then is it named.
 *
 * The wrong answer is written as two real CLI calls — one that buys capacity
 * that cannot help, and one that does not exist at all, because "you cannot
 * change a table's partition key" is a sentence and `--key-schema` with no
 * such parameter under it is a demonstration.
 *
 * The `optionSet` on `dynamodb` already holds the GSI/LSI table (invariant 21),
 * so `compare` takes the axis the table cannot: the symptom quoted in a stem,
 * and which of the two — an index or a key — it is actually pointing at.
 */
export const partitionKeys: Lesson = {
  id: 'partition-keys',
  families: ['saa', 'dva'],
  taskId: 'dva-1.3',
  cluster: 'data-and-cost',
  title: 'The partition key is the design',
  subtitle:
    'A table can throttle at 5% of the capacity you are paying for, and nothing in the console will look wrong. Every exam question that describes that symptom is asking about one attribute — the one you chose before there was any data in the table.',
  minutes: 15,
  tier: 1,
  serviceSlugs: ['dynamodb'],
  requires: [],
  cardIds: [
    'idea:partition-key',
    'define:partition-key',
    'num:concept:partition-key:dynamodb-per-partition-write',
    'num:concept:partition-key:dynamodb-per-partition-read',
    'num:concept:partition-key:dynamodb-item-size',
    'num:concept:partition-key:adaptive-capacity',
    'trap:concept:partition-key:you-cannot-change-a-table-s-partition-key-the-answer-to-a-b',
    'trap:concept:partition-key:adding-capacity-does-not-fix-a-hot-partition-because-the-li',
    'trap:concept:partition-key:write-sharding-appending-a-random-suffix-to-the-key-spre',
    'num:dynamodb:per-partition-ceiling',
    'num:dynamodb:1-wcu',
    'num:dynamodb:1-rcu',
    'num:dynamodb:max-item-size',
    'num:dynamodb:key-size',
    'num:dynamodb:query-result-page',
    'trap:dynamodb:query-reads-one-partition-using-the-key-scan-reads-the-enti',
    'trap:dynamodb:a-low-cardinality-partition-key-status-country-2026-08-1',
    'trap:dynamodb:gsis-are-eventually-consistent-always-if-a-question-demand',
    'trap:dynamodb:an-lsi-must-exist-when-the-table-is-created-and-can-never-be',
    'trap:dynamodb:if-a-gsi-is-throttled-writes-to-the-base-table-are-thrott',
    'trap:dynamodb:provisionedthroughputexceededexception-means-capacity-thrott',
    'optset:dynamodb:index-type',
    'opt:dynamodb:index-type:global-secondary-index',
    'opt:dynamodb:index-type:local-secondary-index',
    'trap:opt:dynamodb:index-type:global-secondary-index',
    'trap:opt:dynamodb:index-type:local-secondary-index',
    'trigger:t-scan-slow',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'The capacity you buy for a [[dynamodb|DynamoDB]] table is not the capacity any single write can use. Throughput belongs to **partitions**, and one attribute — the one you named as the key when the table was empty — decides how many partitions your traffic actually reaches. Get it wrong and the table throttles while the graph of consumed capacity sits comfortably below the line you provisioned, which is exactly the scenario the exam likes to describe.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'pk-two-keys',
        title: 'The same thousand writes a second, into the same table, twice',
        caption:
          'Nothing about the traffic differs. What differs is the attribute the table hashes to decide where each item goes — and that decision is also the load distribution.',
        // Template B, fan-in-the-middle: two parallel tails that are the same
        // journey with a different object at the junction.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'writers',
            label: '1,000 writes/sec',
            sub: 'orders arriving',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'dynamodb',
            label: 'Orders table',
            sub: 'hashes one attribute',
            kind: 'service',
            category: 'database',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'key-status',
            label: 'Key: status',
            sub: 'four distinct values',
            kind: 'note',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'key-order',
            label: 'Key: orderId',
            sub: 'one per order',
            kind: 'note',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'one-partition',
            label: 'One partition',
            sub: 'and it is throttling',
            kind: 'data',
            x: 17,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'many-partitions',
            label: 'Every partition',
            sub: 'nothing throttles',
            kind: 'data',
            x: 17,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'write', from: 'writers', to: 'dynamodb', label: 'PutItem', tone: 'default' },
          { id: 'hash-status', from: 'dynamodb', to: 'key-status', label: 'hash it', tone: 'warn' },
          { id: 'hash-order', from: 'dynamodb', to: 'key-order', label: 'hash it', tone: 'ok' },
          {
            id: 'pile-up',
            from: 'key-status',
            to: 'one-partition',
            label: 'all of it',
            tone: 'bad',
          },
          {
            id: 'spread',
            from: 'key-order',
            to: 'many-partitions',
            label: 'spread out',
            tone: 'ok',
          },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['write'],
            title: 'A thousand orders a second arrive, and the table has 20,000 WCU provisioned',
            detail:
              'Comfortably enough on paper. One WCU is one write per second for an item up to 1 KB, so a thousand small writes a second needs about a thousand of them.',
            tone: 'default',
          },
          {
            edgeIds: ['hash-status', 'pile-up'],
            title: 'With status as the key, almost every order hashes to the same place',
            detail:
              'A key with four distinct values can reach at most four partitions, and new orders all carry the same one. That partition hits its own ceiling — **1,000 WCU** — and starts rejecting writes, while the other 19,000 WCU you are paying for sit idle somewhere else.',
            tone: 'bad',
          },
          {
            edgeIds: ['hash-order', 'spread'],
            title: 'With orderId as the key, the identical traffic lands everywhere',
            detail:
              'Every item hashes to a different value, so the thousand writes spread across every partition the table has and no single one of them comes close to its limit. Same table, same capacity, same traffic — one attribute different.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the name: the top branch is a hot partition',
      md: 'A [[partition-key|hot partition]] is what you get when a key has too few distinct values to spread the load. The rule underneath it is the one sentence to carry into the exam: **throughput is per partition, not per table.** The ceilings are **3,000 RCU** and **1,000 WCU** on any one partition, whatever the table is provisioned for. Adaptive capacity absorbs short imbalances on its own — it softens a spike, it does not rescue a badly chosen key.',
    },

    /* ── 3. The table definition, read out one line at a time ─────────────── */
    { kind: 'heading', text: 'The same idea, as the definition you actually write' },
    {
      kind: 'code',
      lang: 'json',
      caption: 'The whole decision is four lines long, and it is made once',
      code: `{
  "TableName": "Orders",
  "KeySchema": [
    { "AttributeName": "status",    "KeyType": "HASH"  },
    { "AttributeName": "createdAt", "KeyType": "RANGE" }
  ],
  "BillingMode": "PROVISIONED",
  "ProvisionedThroughput": {
    "ReadCapacityUnits": 3000, "WriteCapacityUnits": 20000
  }
}`,
    },
    {
      kind: 'steps',
      title: 'Four things that definition is quietly telling you',
      items: [
        {
          title: 'HASH is the partition key, and it is the only line that chooses a machine',
          md: 'The value of that attribute is hashed, and the hash picks the physical partition. RANGE is the **sort key**: it orders items *within* one partition and chooses nothing about where they live. Both together are the item’s identity, which is why a partition key up to 2,048 bytes and a sort key up to 1,024 are hard limits rather than tunables.',
        },
        {
          title: 'So this table can only ever use as many partitions as status has values',
          md: 'A status, a country, a date — a low-cardinality key is the classic wrong design, and a date is the classic wrong date: every write on a given day goes to one partition. High cardinality is the fix, and it is examined explicitly on the developer paper.',
        },
        {
          title: 'The provisioned numbers are a table-wide budget, not a per-write allowance',
          md: '20,000 WCU is what the table may consume in total. What any one write may consume is bounded by the partition it lands on, and no line in this document raises that. That gap between the two numbers is where every "capacity looks fine but it is throttling" question lives.',
        },
        {
          title: 'And this is the last moment the decision is cheap',
          md: 'You cannot change a table’s partition key. The answer to a bad key is a new table and a migration, which is why the exam treats key design as something decided once and asks you to decide it correctly here rather than fix it later.',
        },
      ],
    },

    /* ── 4. The wrong answers, as real syntax ─────────────────────────────── */
    { kind: 'heading', text: 'Two things people type when that table starts throttling' },
    {
      kind: 'code',
      lang: 'bash',
      caption: 'ProvisionedThroughputExceededException on a table that is 5% utilised',
      code: `# "It is throttling, so buy the table more capacity"
aws dynamodb update-table --table-name Orders \\
  --provisioned-throughput ReadCapacityUnits=3000,WriteCapacityUnits=40000
                                                  ^^^^^^^^^^^^^^^^^^^^^^^^
     The ceiling being hit is 1,000 WCU on one partition. Forty thousand
     table-wide does not raise that partition's share of it by one write.

# "Then change the key to something that spreads"
aws dynamodb update-table --table-name Orders \\
  --key-schema AttributeName=orderId,KeyType=HASH
  ^^^^^^^^^^^^
     There is no such parameter on update-table. A table's key schema is
     fixed at creation — the real answer is a new table and a migration.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The distractor is always more capacity',
      md: '**Adding capacity does not fix a hot partition, because the limit is per partition.** An option offering more provisioned throughput exists in these questions for exactly this reason, and it is wrong however generous the number is. `ProvisionedThroughputExceededException` means capacity throttling — the SDKs already retry it with exponential backoff — but a retry loop against a hot key just spreads the same rejection over more seconds.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The fix that is right, and the cost it carries',
      md: '**Write sharding** — appending a random suffix, so `2026-08-27` becomes `2026-08-27#7` across ten values — spreads writes over ten partitions instead of one. The exam expects you to know the trade-off comes with it: a read that used to be one Query now has to fan out across every suffix and merge the results. You have bought write throughput with read complexity.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'And the sibling question, which is not about the key at all',
      md: '**"Queries need a different access pattern" is an index; "writes are uneven" is a key change.** The exam distinguishes them deliberately. Query reads one partition using the key; **Scan reads the entire table and then filters**, and a `FilterExpression` is applied *after* the read, so it does not reduce consumed capacity by a single unit. "Our scans are slow and expensive" therefore always means redesign the keys or add a global secondary index — never raise capacity, which makes an inefficient scan faster *and* more expensive.',
    },

    /* ── 5. Compare, last, on the axis the option set cannot carry ────────── */
    {
      kind: 'compare',
      title: 'The sentence in the stem, and what it is actually describing',
      columns: ['What is really being described', 'The answer sitting next to it'],
      rows: [
        {
          label: '"Throttling, but overall utilisation is low"',
          cells: [
            'A hot partition — the per-partition ceiling, not the table’s',
            'More provisioned capacity, which cannot raise a partition’s share',
          ],
        },
        {
          label: '"Our scans are slow and expensive"',
          cells: [
            'The access pattern is not a Query — redesign the keys or add a GSI',
            'A FilterExpression, which runs after the read and saves nothing',
          ],
        },
        {
          label: '"We need to query on an attribute that is not the key"',
          cells: [
            'A global secondary index — its own keys, added any time',
            'A local secondary index, which is stuck with the table’s partition key',
          ],
        },
        {
          label: '"That query must be strongly consistent"',
          cells: [
            'A local secondary index, and only if the table already has one',
            'A global secondary index, which is eventually consistent always',
          ],
        },
        {
          label: '"The index is throttling"',
          cells: [
            'The base table is throttling too — an under-provisioned GSI breaks it',
            'An index-only problem, when writes to the table are already failing',
          ],
        },
        {
          label: '"The key we chose turned out to be wrong"',
          cells: [
            'A new table and a migration — the key schema is fixed at creation',
            'An update-table call, which has no parameter that could do it',
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
          label: 'Per-partition ceiling',
          value: '3,000 RCU and 1,000 WCU',
          note: 'Exceeding it on one key is a hot partition.',
        },
        { label: '1 WCU', value: '1 write per second for an item up to 1 KB' },
        {
          label: '1 RCU',
          value:
            '1 strongly consistent read per second up to 4 KB, or 2 eventually consistent reads',
        },
        { label: 'Max item size', value: '400 KB, including attribute names' },
        {
          label: 'Key size',
          value: 'Partition key up to 2,048 bytes · sort key up to 1,024 bytes',
          note: 'Hard limits, like the 400 KB item — no support ticket raises them.',
        },
        { label: 'Query result page', value: '1 MB, then you paginate with LastEvaluatedKey' },
        {
          label: 'Adaptive capacity',
          value: 'Absorbs short imbalances automatically',
          note: 'It softens hot partitions; it does not fix a badly chosen key.',
        },
      ],
    },

    /* ── 7. Next ──────────────────────────────────────────────────────────── */
    { kind: 'services', title: 'Where these facts live', slugs: ['dynamodb'] },
    {
      kind: 'prose',
      md: 'One thing this lesson deliberately left alone: what to do when the reads are fine in shape but simply repeat. A better key spreads work; it does not remove it. The answer to the same read arriving a thousand times is a cache in front of the table — DAX for [[dynamodb]] specifically, [[elasticache]] for anything else — and that is a separate decision about distance rather than distribution.',
    },
  ],

  checks: [
    {
      id: 'partition-keys-hot',
      prompt:
        'A table provisioned at 20,000 WCU is returning throttling errors while CloudWatch shows consumed write capacity at around 1,200 WCU. What is happening?',
      options: [
        {
          text: 'One partition is at its own 1,000 WCU ceiling because the key has few distinct values',
          correct: true,
          why: 'Throughput is per partition, not per table. A low-cardinality key concentrates traffic on one partition, which throttles at 1,000 WCU however much the table is provisioned for.',
        },
        {
          text: 'The table needs more provisioned write capacity to absorb the peak',
          correct: false,
          why: 'This is the distractor these questions are built around. The limit being hit is per partition, so raising the table-wide number changes nothing about the partition that is rejecting writes.',
        },
        {
          text: 'The items are exceeding the 400 KB maximum item size',
          correct: false,
          why: 'An oversized item fails with a validation error naming the item, not with capacity throttling — and 400 KB is a limit on one item, not on a partition’s throughput.',
        },
      ],
    },
    {
      id: 'partition-keys-fix',
      prompt:
        'An events table uses the current date as its partition key. Writes throttle every afternoon. Which change actually addresses it?',
      options: [
        {
          text: 'Create a new table with a higher-cardinality key, or shard the date with a random suffix, and migrate',
          correct: true,
          why: 'A date sends every write on a given day to one partition. Since a key schema is fixed at creation, the fix is a new table — or write sharding, accepting that reads must then fan out across the suffixes.',
        },
        {
          text: 'Call update-table with a new key schema so the existing data is redistributed',
          correct: false,
          why: 'There is no such parameter. A table’s partition key cannot be changed, which is why the exam treats key design as a decision made once.',
        },
        {
          text: 'Switch the table to on-demand capacity so it scales with the afternoon peak',
          correct: false,
          why: 'On-demand removes the need to plan table-wide capacity, but the per-partition ceiling applies in both billing modes. The traffic still lands on one partition.',
        },
      ],
    },
    {
      id: 'partition-keys-index',
      prompt:
        'An application must query orders by customer email, which is not part of the table’s key, and the result may be a moment out of date. What does it need?',
      options: [
        {
          text: 'A global secondary index with email as its partition key',
          correct: true,
          why: 'A GSI has its own partition and sort key, can be added to an existing table at any time, and is eventually consistent — which the requirement explicitly allows.',
        },
        {
          text: 'A local secondary index with email as its partition key',
          correct: false,
          why: 'An LSI shares the table’s partition key and only changes the sort order, so it cannot be keyed on email. It also has to exist from the moment the table is created.',
        },
        {
          text: 'A Scan with a FilterExpression on the email attribute',
          correct: false,
          why: 'The filter is applied after every item has been read, so it reduces the response and not the capacity consumed. "Scans are slow and expensive" is the phrasing that means redesign the keys or add an index.',
        },
      ],
    },
    {
      id: 'partition-keys-scan',
      prompt:
        'A nightly report runs a Scan with a FilterExpression and is both slow and expensive. The team proposes doubling read capacity. What should you tell them?',
      options: [
        {
          text: 'The filter runs after the read, so more capacity makes the same full-table read faster and dearer',
          correct: true,
          why: 'A FilterExpression does not reduce consumed capacity. The access pattern needs to become a Query — through a better key or an index — for the cost to change at all.',
        },
        {
          text: 'Doubling capacity is correct, because the Scan is being throttled by the current provisioning',
          correct: false,
          why: 'Speed was never the complaint on its own; cost was. Raising capacity buys a faster read of every item in the table and a larger bill for it.',
        },
        {
          text: 'A projection expression on the Scan will cut the capacity it consumes',
          correct: false,
          why: 'ProjectionExpression, like FilterExpression, acts after DynamoDB has read the item. Reading less means storing less in the index you read, not asking for fewer attributes back.',
        },
      ],
    },
  ],
}
