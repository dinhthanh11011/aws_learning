import type { Concept } from '../schema'

/**
 * The data-layer primitives. Consistency and idempotency in particular are
 * assumed rather than taught by most study material, and they decide whole
 * DVA questions — a stem describing a duplicate SQS delivery is not testing
 * SQS, it is testing whether you know what idempotent means.
 */
export const dataConcepts: Concept[] = [
  {
    slug: 'eventual-vs-strong-consistency',
    term: 'Eventual versus strong consistency',
    group: 'data',
    families: ['saa', 'dva'],
    oneLiner: 'Whether a read is guaranteed to see the write that just succeeded.',
    whatItIs:
      'A strongly consistent read always reflects every write that completed before it. An eventually consistent read may return a slightly stale copy, because the write has not yet reached the replica that answered you — it will, usually within milliseconds. Eventual consistency is the default in distributed stores because it is cheaper and faster: the read can be served by whichever replica is nearest rather than the one that owns the write.',
    keyIdea:
      'Eventual consistency trades correctness-right-now for throughput and cost. You choose strong only where a stale read would actually cause harm, because it costs roughly twice as much and rules out some replicas.',
    onTheExam: [
      '"The application read the value it just wrote and got the old one" is an eventually consistent read, and the fix is to request a strongly consistent one.',
      'A DynamoDB question that mentions read capacity cost is usually testing that a strongly consistent read consumes twice as much.',
      '"Read replicas" in any relational question implies replication lag, so anything read-after-write must go to the primary.',
    ],
    keyNumbers: [
      {
        label: 'DynamoDB default',
        value: 'Eventually consistent',
        note: 'Strongly consistent reads are opt-in per request.',
      },
      {
        label: 'DynamoDB read cost',
        value: 'A strongly consistent read costs 2× an eventually consistent one',
      },
      {
        label: 'Global secondary indexes',
        value: 'Eventually consistent only',
        note: 'A local secondary index can be strongly consistent. This distinction is examined.',
      },
      {
        label: 'S3',
        value: 'Strong read-after-write consistency for all operations',
        note: 'Changed in December 2020 — older material still says eventual, and so do some distractors.',
      },
    ],
    examTraps: [
      'S3 has been strongly consistent since 2020. An option that offers to "work around S3 eventual consistency" is a stale distractor.',
      'A global secondary index cannot be read strongly consistent, whatever the request asks for. If the requirement is read-after-write on an indexed attribute, the answer is not a GSI.',
      'DynamoDB global tables are eventually consistent across Regions and resolve conflicts last-writer-wins. A stem needing cross-Region strong consistency is describing something DynamoDB does not do.',
    ],
    confusedWith: [
      {
        slug: 'durability-vs-availability',
        difference:
          'Consistency is about whether a read is current. Durability is about whether the data still exists at all. A store can be extremely durable and still hand you a stale read.',
      },
    ],
    serviceSlugs: ['dynamodb', 's3', 'rds', 'aurora', 'elasticache'],
    related: ['durability-vs-availability', 'partition-key', 'backup-vs-replication'],
    docsUrl:
      'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html',
  },
  {
    slug: 'durability-vs-availability',
    term: 'Durability versus availability',
    group: 'data',
    families: ['saa'],
    oneLiner: 'Whether your data still exists, versus whether you can reach it right now.',
    whatItIs:
      'Durability is the probability that stored data survives — that it is not lost. Availability is the probability that you can read or write it at a given moment. They are quoted as separate figures because they fail separately: an S3 storage class can keep every byte safe while being briefly unreachable, and a single very available disk can lose everything at once.',
    keyIdea:
      'Durability is about the bytes surviving; availability is about the service answering. S3 One Zone-IA has the same eleven nines of durability as Standard within its AZ, and lower availability — losing the AZ loses the data.',
    onTheExam: [
      '"We can recreate this data if it is lost" points at One Zone-IA, because you are being told durability matters less.',
      '"Must not be lost under any circumstances" is a durability requirement, which usually means Standard, versioning, or a second copy in another Region.',
      'A quoted availability SLA in the stem is a hint about which storage class or deployment the question wants.',
    ],
    keyNumbers: [
      {
        label: 'S3 durability',
        value: '99.999999999% — eleven nines — for all storage classes',
        note: 'Durability does not vary between classes. Availability does.',
      },
      { label: 'S3 Standard availability', value: '99.99%' },
      {
        label: 'S3 One Zone-IA',
        value: '99.5% availability, one AZ',
        note: 'Same durability figure, but it is gone if the AZ is.',
      },
      {
        label: 'EBS volume durability',
        value: '99.8–99.999% depending on volume type',
        volatile: true,
      },
    ],
    examTraps: [
      'Eleven nines is often misquoted as availability. It is durability, and every S3 class shares it.',
      'An EBS snapshot is stored in S3 and is Regional; the volume itself is in one AZ. "Back up the volume" and "make the volume highly available" are different answers.',
      'RAID inside an instance improves neither in the way the exam means — the durable answer is a snapshot, and the available answer is a second instance.',
    ],
    confusedWith: [
      {
        slug: 'backup-vs-replication',
        difference:
          'Durability and availability are properties you are given. Backup and replication are the two things you add when the built-in figures are not enough.',
      },
    ],
    serviceSlugs: ['s3', 'ebs', 'efs', 's3-glacier'],
    related: ['eventual-vs-strong-consistency', 'backup-vs-replication', 'availability-zone'],
    docsUrl: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html',
  },
  {
    slug: 'idempotency',
    term: 'Idempotency',
    group: 'data',
    families: ['saa', 'dva'],
    oneLiner: 'Doing the same operation twice has the same effect as doing it once.',
    whatItIs:
      'An idempotent operation can be safely retried. Setting a value to 42 is idempotent; adding 42 to it is not. This matters because almost every AWS messaging and eventing service guarantees at-least-once delivery, which means duplicates are not an error condition to be prevented but a normal event your handler has to absorb. The usual implementation is a deduplication key: record the message or request id, and skip work you have already done.',
    keyIdea:
      "At-least-once delivery makes duplicates inevitable, so idempotency is the consumer's job, not the queue's. If the exam describes a charge being applied twice, the answer is a deduplication key in the handler.",
    onTheExam: [
      '"The customer was charged twice" or "the record was inserted twice" — the answer is idempotency in the consumer, usually a conditional write on a unique id.',
      'A standard SQS queue delivers at least once and does not preserve order; FIFO delivers exactly once within the deduplication window and does preserve it.',
      'Lambda retries a failed asynchronous invocation automatically, so a non-idempotent Lambda handler is a bug the exam likes to describe rather than name.',
    ],
    keyNumbers: [
      {
        label: 'SQS FIFO deduplication window',
        value: '5 minutes',
        note: 'Outside it, the same message id is treated as new.',
      },
      {
        label: 'SQS FIFO throughput',
        value: '300 messages/second, or 3,000 with batching',
        note: 'Per API action; high-throughput mode raises this considerably.',
        volatile: true,
      },
      {
        label: 'Lambda async retries',
        value: '2 automatic retries by default',
        note: 'Then the event goes to the destination or dead-letter queue if configured.',
      },
    ],
    examTraps: [
      'FIFO exactly-once applies within the five-minute deduplication window only. A retry an hour later is a new message, so the handler still needs to be idempotent.',
      'A dead-letter queue does not prevent duplicates; it collects what failed after the retries. Answering "add a DLQ" to a double-charge question is wrong.',
      'Choosing FIFO purely to avoid duplicates costs you throughput and is usually the more expensive wrong answer when a deduplication key in the consumer would do.',
    ],
    confusedWith: [
      {
        slug: 'eventual-vs-strong-consistency',
        difference:
          'Idempotency is about repeated operations being safe. Consistency is about whether a read is current. A duplicate write and a stale read are different problems with different fixes.',
      },
    ],
    serviceSlugs: ['sqs', 'sns', 'lambda', 'eventbridge', 'step-functions', 'dynamodb'],
    related: ['partition-key', 'eventual-vs-strong-consistency'],
    docsUrl:
      'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html',
  },
  {
    slug: 'partition-key',
    term: 'Partition key and hot partitions',
    aka: ['hash key', 'shard key', 'hot key'],
    group: 'data',
    families: ['saa', 'dva'],
    oneLiner:
      'The attribute that decides which physical partition a row lands on — and how evenly.',
    whatItIs:
      'A distributed store splits data across partitions by hashing one attribute. In DynamoDB that is the partition key; in Kinesis it is the partition key that chooses a shard. Throughput is provisioned per partition, so an unevenly distributed key concentrates traffic on one partition and throttles it while the rest of the table sits idle. This is a hot partition, and the fix is always a key with higher cardinality.',
    keyIdea:
      'Throughput is per partition, not per table. A key with few distinct values — a status, a date, a country — throttles at a fraction of the capacity you are paying for, however much you provision.',
    onTheExam: [
      '"Throttling despite low overall utilisation" is a hot partition, and the answer is a better partition key or write sharding.',
      'A date used as a partition key is the classic wrong design: every write on a given day goes to one partition.',
      '"Queries need a different access pattern" is a global secondary index; "writes are uneven" is a key change. The exam distinguishes them.',
    ],
    keyNumbers: [
      { label: 'DynamoDB per-partition write', value: '1,000 WCU' },
      { label: 'DynamoDB per-partition read', value: '3,000 RCU' },
      { label: 'DynamoDB item size', value: '400 KB maximum, including attribute names' },
      {
        label: 'Adaptive capacity',
        value: 'Absorbs short imbalances automatically',
        note: 'It softens hot partitions; it does not fix a badly chosen key.',
      },
    ],
    examTraps: [
      "You cannot change a table's partition key. The answer to a bad key is a new table and a migration, which is why the exam treats key design as a decision made once.",
      'Adding capacity does not fix a hot partition, because the limit is per partition. The distractor that offers more provisioned throughput is there for exactly this.',
      'Write sharding — appending a random suffix to the key — spreads writes but makes reads fan out. The exam expects you to know that trade-off exists.',
    ],
    confusedWith: [
      {
        slug: 'blast-radius',
        difference:
          'A hot partition is a throughput problem inside one table. Blast radius is about how far a failure spreads. They meet in multi-tenant designs, where one noisy tenant is both.',
      },
    ],
    serviceSlugs: ['dynamodb', 'kinesis-data-streams', 'redshift'],
    related: ['idempotency', 'eventual-vs-strong-consistency', 'scaling-up-vs-out'],
    docsUrl:
      'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html',
  },
  {
    slug: 'encryption-at-rest-vs-in-transit',
    term: 'Encryption at rest versus in transit',
    group: 'data',
    families: ['saa', 'dva'],
    oneLiner: 'Protecting stored bytes, versus protecting bytes moving over a network.',
    whatItIs:
      'Encryption at rest protects data on disk, so that a stolen volume or an exposed bucket yields ciphertext. On AWS it is almost always envelope encryption with KMS: a data key encrypts the data, and KMS encrypts the data key. Encryption in transit protects data on the wire, which in practice means TLS. They are independent — you can have either, both, or neither — and compliance requirements usually name both.',
    keyIdea:
      'At rest and in transit are separate controls with separate mechanisms. A requirement saying "encrypted end to end" means both, and an answer that only enables bucket encryption has done half the job.',
    onTheExam: [
      '"Customer must control and rotate the keys" is a customer managed KMS key, not an AWS managed one.',
      '"The customer must supply and hold the keys, and AWS must not store them" is SSE-C, or CloudHSM if they need a dedicated hardware module.',
      '"Encrypt an existing unencrypted RDS instance or EBS volume" — you cannot, in place. Snapshot, copy the snapshot with encryption, restore.',
    ],
    keyNumbers: [
      {
        label: 'S3 default',
        value: 'SSE-S3 applied to all new objects automatically',
        note: 'Since January 2023 — older material says encryption is opt-in.',
      },
      {
        label: 'KMS automatic rotation',
        value: 'Yearly for customer managed keys, when enabled',
        volatile: true,
      },
      {
        label: 'KMS key policy',
        value: 'Required — IAM alone cannot grant access to a KMS key',
        note: 'A very common cause of "access denied" in exam scenarios.',
      },
    ],
    examTraps: [
      'You cannot encrypt an existing EBS volume or RDS instance in place. The answer is always snapshot, copy with encryption, restore — and the exam offers a plausible "enable encryption" option that does not exist.',
      'Enabling bucket encryption does nothing for data in transit. If the requirement mentions interception on the network, the answer involves TLS or a bucket policy denying non-TLS requests.',
      'An AWS managed key cannot be shared across accounts and its policy cannot be edited. Cross-account access needs a customer managed key.',
    ],
    confusedWith: [
      {
        slug: 'least-privilege',
        difference:
          'Encryption makes data unreadable without a key. Least privilege controls who may ask for it. A KMS question usually needs both an IAM policy and a key policy.',
      },
    ],
    serviceSlugs: ['kms', 'cloudhsm', 's3', 'ebs', 'rds', 'acm', 'secrets-manager'],
    related: ['least-privilege', 'identity-vs-resource-policy', 'durability-vs-availability'],
    docsUrl: 'https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html',
  },
  {
    slug: 'backup-vs-replication',
    term: 'Backup versus replication',
    group: 'data',
    families: ['saa'],
    oneLiner: 'A copy you can go back to, versus a copy that keeps up with the original.',
    whatItIs:
      'A backup is a point-in-time copy kept separately, restored deliberately, and retained on a schedule. Replication continuously mirrors changes to another copy so it stays current. They protect against different things: replication protects against losing the original, and backup protects against destroying the contents — because replication faithfully copies the deletion too.',
    keyIdea:
      'Replication copies your mistakes; backup is how you undo them. A design with replication and no backup has no answer to accidental deletion or ransomware, and the exam tests exactly that gap.',
    onTheExam: [
      '"Recover from accidental deletion" is backup, versioning or point-in-time recovery — never a read replica.',
      '"Keep a second copy current for failover" is replication.',
      '"Protect against a malicious administrator" adds immutability: S3 Object Lock, Vault Lock, or a separate account holding the backups.',
    ],
    keyNumbers: [
      {
        label: 'RDS automated backups',
        value: 'Retention 0–35 days',
        note: '0 disables them; the default is 7.',
      },
      {
        label: 'DynamoDB point-in-time recovery',
        value: 'Any second in the last 35 days',
      },
      {
        label: 'S3 Cross-Region Replication',
        value: 'Requires versioning on both buckets',
        note: 'And it only replicates objects written after it is enabled, unless you run Batch Replication.',
      },
    ],
    examTraps: [
      'A read replica is not a backup. Deleting a row on the primary deletes it on the replica within seconds.',
      'S3 replication does not copy existing objects. Enabling it and assuming the bucket is now mirrored is a documented wrong answer.',
      'RDS automated backups are deleted with the instance unless you have taken a manual snapshot. Manual snapshots persist; automated ones do not.',
    ],
    confusedWith: [
      {
        slug: 'rpo',
        difference:
          'RPO is the number you have to meet. Backup and replication are the two mechanisms, and the size of the number decides which one is affordable.',
      },
    ],
    serviceSlugs: ['backup', 's3', 'rds', 'dynamodb', 'aurora', 'ebs'],
    related: ['rpo', 'dr-strategies', 'durability-vs-availability'],
    docsUrl: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html',
  },
]
