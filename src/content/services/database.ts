import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const databaseServices: Service[] = [
  {
    slug: 'rds',
    name: 'Amazon RDS',
    abbr: 'RDS',
    category: 'database',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: 'Managed relational databases — six engines, patched and backed up for you.',
    whatItIs:
      'MySQL, PostgreSQL, MariaDB, Oracle, SQL Server and Db2 as managed instances. AWS handles provisioning, patching, backups and failover; you still choose instance size, storage type and topology. Two features carry most of the exam weight, and they are different things: Multi-AZ is for availability, read replicas are for read scale.',
    whenToUse: [
      'Existing relational schema, joins, transactions and SQL you do not want to rewrite',
      'Lift-and-shift of an on-premises database onto a managed platform',
      'A commercial engine (Oracle, SQL Server) where Aurora is not an option',
    ],
    whenNotToUse: [
      'Key-value access at any scale with single-digit-millisecond latency — DynamoDB',
      'Analytics over billions of rows — Redshift',
      'You want Aurora-class throughput and failover on MySQL or PostgreSQL — use Aurora instead',
      'Unpredictable, spiky load where paying for a running instance hurts — Aurora Serverless v2',
    ],
    keyNumbers: [
      {
        label: 'Multi-AZ',
        value: 'Synchronous standby in another AZ, automatic failover, typically 60–120s',
        note: 'The standby serves no reads in the classic single-standby deployment.',
      },
      {
        label: 'Multi-AZ DB cluster',
        value: 'One writer plus two *readable* standbys, faster failover',
      },
      {
        label: 'Read replicas',
        value: 'Up to 15 for MySQL/MariaDB/PostgreSQL, asynchronous, cross-AZ and cross-Region',
      },
      {
        label: 'Automated backup retention',
        value: '1–35 days',
        note: 'Setting it to 0 disables automated backups and point-in-time recovery.',
      },
      {
        label: 'Point-in-time recovery',
        value: 'To any second within the retention window, typically to within 5 minutes of now',
      },
      {
        label: 'Storage',
        value: 'gp2/gp3 general purpose, io1/io2 provisioned IOPS, magnetic (legacy)',
      },
      { label: 'Storage auto scaling', value: 'Grows automatically up to a ceiling you set' },
    ],
    examTraps: [
      'Multi-AZ is for availability, not performance — the standby takes no read traffic. Read replicas are for performance, not availability, and failing over to one is a manual promotion. Questions that mix the two are testing exactly this.',
      'Failover changes what the DNS endpoint resolves to. Applications must reconnect and must not cache DNS forever.',
      'A read replica can be promoted to a standalone writer, and that promotion is irreversible.',
      'Cross-Region read replicas serve DR and local reads. Multi-AZ never crosses a Region.',
      'RDS does not give you OS or host access. "We need to install an agent on the database server" rules RDS out and points to EC2.',
      'Encryption at rest must be enabled at creation. To encrypt an existing unencrypted instance: snapshot, copy the snapshot with encryption, restore.',
      'The RDS Proxy answer appears whenever "too many connections", "connection storms" or "Lambda exhausting the connection pool" shows up.',
      'IAM database authentication removes stored passwords for MySQL and PostgreSQL — the answer to "no database credentials in the application".',
    ],
    confusedWith: [
      {
        slug: 'aurora',
        difference:
          'Aurora is an AWS-built MySQL/PostgreSQL-compatible engine with a shared distributed storage layer — faster, faster to fail over, more replicas. RDS runs the community engines as-is.',
      },
      {
        slug: 'dynamodb',
        difference:
          'RDS gives SQL, joins and ACID across tables; DynamoDB gives predictable single-digit-millisecond key-value access and horizontal scale but no joins.',
      },
      {
        slug: 'redshift',
        difference: 'RDS is row-oriented OLTP; Redshift is columnar OLAP for analytical scans.',
      },
    ],
    pricing:
      'Per instance-hour plus provisioned storage and IOPS, backup storage beyond the free allowance, and data transfer.',
    docsUrl: `${D}/AmazonRDS/latest/UserGuide/Welcome.html`,
    related: ['aurora', 'rds-proxy', 'dynamodb', 'elasticache', 'dms', 'backup', 'kms'],
  },
  {
    slug: 'aurora',
    name: 'Amazon Aurora',
    category: 'database',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: "AWS's own MySQL/PostgreSQL-compatible engine on a distributed storage layer.",
    whatItIs:
      'Aurora keeps six copies of your data across three AZs in a shared storage volume that grows automatically, and separates that storage from the compute instances in front of it. Because replicas read the same volume rather than replaying a log, there are up to 15 of them with millisecond replica lag, and failover is seconds rather than a minute.',
    whenToUse: [
      'MySQL- or PostgreSQL-compatible workloads wanting more throughput and faster failover than RDS',
      'Heavy read scale-out — up to 15 low-lag replicas behind a single reader endpoint',
      'Global read distribution or cross-Region DR via Aurora Global Database',
      'Storage that must grow without planning',
    ],
    whenNotToUse: [
      'Oracle, SQL Server, MariaDB or Db2 — those stay on RDS',
      'Very small or intermittent workloads where a t-class RDS instance is cheaper (or Serverless v2 is the fix)',
      'Non-relational access patterns — DynamoDB',
    ],
    keyNumbers: [
      { label: 'Storage replication', value: '6 copies across 3 AZs, self-healing' },
      { label: 'Storage growth', value: 'Automatic, in 10 GB increments, up to 128 TiB' },
      { label: 'Replicas', value: 'Up to 15 Aurora Replicas, typically <10 ms lag' },
      { label: 'Failover', value: 'Usually under 30 seconds to an existing replica' },
      {
        label: 'Endpoints',
        value: 'Cluster (writer) · Reader (load-balanced) · Custom · Instance',
      },
      {
        label: 'Global Database',
        value:
          'Up to 5 secondary Regions · typical replication lag under 1 second · RTO under 1 minute',
      },
      { label: 'Backtrack', value: 'Rewind an Aurora MySQL cluster in place, without a restore' },
    ],
    examTraps: [
      'Use the *reader* endpoint for read traffic. Pointing reads at the cluster endpoint sends every query to the writer — a common design error in questions.',
      'Aurora Global Database is the answer for cross-Region DR with sub-second replication and fast promotion. A cross-Region read replica on RDS is slower and coarser.',
      'Backtrack is Aurora MySQL only and is not a backup — it is a limited-window in-place rewind for "undo that bad migration".',
      'Aurora Serverless v2 scales in fine-grained ACUs and can be mixed with provisioned instances in the same cluster. v1 scaled coarsely and had to pause — do not answer from v1 behaviour.',
      'Aurora Replica auto scaling adds replicas based on CPU or connections — the answer to "read load varies unpredictably".',
      'Multi-AZ is inherent in Aurora storage. There is no separate "enable Multi-AZ" toggle; you get availability by having a replica in another AZ to fail over to.',
    ],
    confusedWith: [
      {
        slug: 'rds',
        difference:
          'Same management surface, different engine. Aurora replaces the storage layer, which is where the performance and failover gains come from.',
      },
      {
        slug: 'aurora-serverless',
        difference: 'Serverless is a capacity mode for Aurora, not a separate database.',
      },
    ],
    pricing:
      'Per instance-hour (or ACU-hour for Serverless), plus storage consumed, I/O requests, and backups.',
    docsUrl: `${D}/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html`,
    related: ['rds', 'aurora-serverless', 'rds-proxy', 'dynamodb', 'dms'],
  },
  {
    slug: 'aurora-serverless',
    name: 'Amazon Aurora Serverless v2',
    category: 'database',
    certs: ['SAA-C03'],
    tier: 2,
    oneLiner: 'Aurora capacity that scales in fine steps with load, billed per ACU-second.',
    whatItIs:
      'A capacity mode for Aurora. Instead of choosing an instance size, you set a minimum and maximum in Aurora Capacity Units and the cluster scales between them in fractions of a second, without dropping connections. Mixed clusters — some provisioned instances, some serverless — are supported.',
    whenToUse: [
      'Unpredictable or spiky load where a fixed instance is either too small at peak or wasted at trough',
      'Dev, test and staging databases that are idle most of the day',
      'Multi-tenant SaaS where per-tenant load is impossible to forecast',
      'New applications with no load history to size against',
    ],
    whenNotToUse: [
      'Steady, predictable load — a provisioned instance with a Reserved Instance or Savings Plan is cheaper',
      'Engines or versions Serverless v2 does not support',
    ],
    keyNumbers: [
      { label: 'ACU', value: '~2 GiB of memory with matching CPU and networking' },
      { label: 'Range', value: 'From 0 (or 0.5) ACU up to 256 ACUs', volatile: true },
      { label: 'Scaling', value: 'Sub-second, in fine increments, without dropping connections' },
      { label: 'Billing', value: 'Per ACU-second' },
    ],
    examTraps: [
      'The exam signal is "unpredictable", "infrequent", "intermittent" or "spiky" load on a relational database. Steady load points back to provisioned.',
      "v2 does not have v1's coarse doubling steps or forced pause-and-resume delay. Older question banks describe v1 behaviour — check which version is named.",
    ],
    confusedWith: [
      {
        slug: 'aurora',
        difference: 'Same engine; Serverless is only how capacity is allocated and billed.',
      },
      {
        slug: 'dynamodb',
        difference:
          'DynamoDB on-demand is serverless NoSQL. Aurora Serverless is serverless *SQL* — pick on the data model, not the billing mode.',
      },
    ],
    pricing: 'Per ACU-second plus storage, I/O and backups.',
    docsUrl: `${D}/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html`,
    related: ['aurora', 'rds', 'dynamodb', 'rds-proxy'],
  },
  {
    slug: 'dynamodb',
    name: 'Amazon DynamoDB',
    abbr: 'DDB',
    category: 'database',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner:
      'Serverless key-value and document store with single-digit-millisecond latency at any scale.',
    whatItIs:
      'A fully managed NoSQL table. Every item has a partition key, optionally plus a sort key, and the partition key decides which physical partition the item lives on — which is why key design is the whole game. There are no servers, no version upgrades, and no practical size ceiling. For DVA this is the most heavily examined data service; for SAA it is the default answer whenever the access pattern is key-based.',
    whenToUse: [
      'Known, simple access patterns: get by id, query a partition, list by time within a partition',
      'Session state, shopping carts, user profiles, device state, leaderboards, event logs',
      'Serverless applications — it scales the way Lambda does and needs no connection pool',
      'Workloads needing predictable latency as traffic grows by orders of magnitude',
    ],
    whenNotToUse: [
      'Ad-hoc queries, joins, aggregations or reporting — that is RDS, Aurora, Athena or Redshift',
      'Access patterns you cannot enumerate in advance',
      'Items regularly larger than 400 KB — store the blob in S3 and keep a pointer',
      'Complex transactions across many entities (though DynamoDB Transactions cover limited cases)',
    ],
    keyNumbers: [
      { label: 'Max item size', value: '400 KB, including attribute names' },
      {
        label: 'Capacity modes',
        value: 'On-demand (per request) or Provisioned (RCU/WCU, with auto scaling)',
      },
      { label: '1 WCU', value: '1 write per second for an item up to 1 KB' },
      {
        label: '1 RCU',
        value: '1 strongly consistent read per second up to 4 KB, or 2 eventually consistent reads',
      },
      {
        label: 'Per-partition ceiling',
        value: '3,000 RCU and 1,000 WCU',
        note: 'Exceeding it on one key is a hot partition.',
      },
      { label: 'Query result page', value: '1 MB, then you paginate with LastEvaluatedKey' },
      {
        label: 'GSI',
        value:
          'Different partition and sort key · eventually consistent only · own capacity · up to 20 per table',
      },
      {
        label: 'LSI',
        value:
          'Same partition key, different sort key · can be strongly consistent · must be created with the table · 10 GB per partition-key limit',
      },
      { label: 'DAX', value: 'In-memory cache in front of DynamoDB, microsecond reads' },
      {
        label: 'Streams',
        value: '24-hour change log · KEYS_ONLY, NEW_IMAGE, OLD_IMAGE or NEW_AND_OLD_IMAGES',
      },
      {
        label: 'TTL',
        value: 'Automatic expiry of items by a timestamp attribute, at no cost',
        note: 'Deletion happens within ~48 hours of expiry, not instantly.',
      },
    ],
    examTraps: [
      'Query reads one partition using the key; Scan reads the entire table and then filters. A FilterExpression is applied *after* the read, so it does not reduce consumed capacity. "Our scans are slow and expensive" always means "redesign the keys or add a GSI".',
      'A low-cardinality partition key (status, country, "2026-08-19") creates a hot partition. High cardinality spreads the load — this is examined explicitly on DVA.',
      'GSIs are eventually consistent, always. If a question demands a strongly consistent read on a non-key attribute, a GSI cannot deliver it.',
      'An LSI must exist when the table is created and can never be added later. A GSI can be added any time.',
      'If a GSI is throttled, writes to the *base table* are throttled too. Under-provisioning an index breaks the table.',
      'On-demand is the answer for unknown or spiky traffic; provisioned with auto scaling is cheaper for steady, forecastable traffic.',
      'Global Tables give multi-Region, multi-active replication with last-writer-wins conflict resolution — the answer to "low-latency writes from several Regions".',
      'DAX accelerates *reads* only, and only through the DAX endpoint. It does nothing for write-heavy workloads.',
      'ProvisionedThroughputExceededException means capacity throttling; use exponential backoff, which the AWS SDKs already do.',
      'Conditional writes plus optimistic locking with a version attribute is the answer to "prevent two clients overwriting each other".',
    ],
    confusedWith: [
      {
        slug: 'rds',
        difference:
          'DynamoDB has no joins, no SQL, no ad-hoc queries — and no scaling ceiling. RDS is the reverse trade.',
      },
      {
        slug: 'elasticache',
        difference:
          'ElastiCache is a volatile cache you populate; DynamoDB is a durable store. DAX is the cache designed for DynamoDB specifically.',
      },
      {
        slug: 'documentdb',
        difference:
          'DocumentDB is MongoDB-compatible with rich document queries; DynamoDB is key-value first with a proprietary API.',
      },
    ],
    pricing:
      'On-demand bills per read and write request unit. Provisioned bills per RCU/WCU-hour. Both bill storage per GB-month, plus streams, backups and Global Tables replication.',
    docsUrl: `${D}/amazondynamodb/latest/developerguide/Introduction.html`,
    related: [
      'lambda',
      'elasticache',
      'rds',
      'api-gateway',
      'kinesis-data-streams',
      'athena',
      'backup',
    ],
  },
  {
    slug: 'elasticache',
    name: 'Amazon ElastiCache',
    category: 'database',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: 'Managed Redis (Valkey) or Memcached — microsecond reads in front of a slower store.',
    whatItIs:
      'In-memory caching as a managed service. The engine choice is the exam question: Memcached is a simple, multi-threaded, horizontally shardable cache with no persistence and no replication. Redis/Valkey adds replication, automatic failover, persistence, transactions, pub/sub, sorted sets and other data structures.',
    whenToUse: [
      'Read-heavy workloads hammering the same rows — cache in front of RDS or Aurora',
      'Session stores for a stateless web tier behind a load balancer',
      'Leaderboards, rate limiting, real-time counters, queues (Redis data structures)',
      'Reducing database cost by absorbing repeated reads',
    ],
    whenNotToUse: [
      'Durable storage — a cache is not a system of record',
      'Write-heavy workloads with little read reuse',
      'Caching DynamoDB specifically — DAX is purpose-built and needs no application cache logic',
    ],
    keyNumbers: [
      {
        label: 'Memcached',
        value: 'Multi-threaded · shards by client · no replication · no persistence · no failover',
      },
      {
        label: 'Redis/Valkey',
        value:
          'Replication · Multi-AZ automatic failover · persistence · pub/sub · sorted sets · transactions',
      },
      {
        label: 'Redis cluster mode',
        value: 'Enabled = data sharded across shards; disabled = one shard with replicas',
      },
      { label: 'Latency', value: 'Sub-millisecond, typically microseconds' },
      { label: 'Encryption in transit', value: 'Redis supports TLS and AUTH; Memcached does not' },
    ],
    examTraps: [
      'Anything requiring high availability, failover, persistence or a data structure beyond a plain string means Redis. Memcached only wins on "simplest possible cache, scale horizontally, multi-threaded".',
      'Lazy loading only caches on a miss (stale data risk, no wasted memory). Write-through caches on every write (always fresh, wasted memory on unread items). A TTL is what bounds staleness in both. This trade-off is asked directly.',
      'ElastiCache is not a database. A question about durable storage of the cached data is not answered by ElastiCache.',
      'Storing session state in ElastiCache is the standard answer to "make the web tier stateless so instances can be replaced".',
    ],
    confusedWith: [
      {
        slug: 'dynamodb',
        difference:
          'DynamoDB is durable at single-digit-millisecond latency; ElastiCache is volatile at microsecond latency.',
      },
      {
        slug: 'cloudfront',
        difference:
          'CloudFront caches HTTP responses at the edge for users; ElastiCache caches data inside your VPC for your application.',
      },
    ],
    pricing:
      'Per node-hour by node type, plus data transfer. Serverless mode bills by data stored and ElastiCache Processing Units.',
    docsUrl: `${D}/AmazonElastiCache/latest/dg/WhatIs.html`,
    related: ['rds', 'aurora', 'dynamodb', 'cloudfront', 'ec2'],
  },
  {
    slug: 'redshift',
    name: 'Amazon Redshift',
    category: 'database',
    certs: ['SAA-C03'],
    tier: 1,
    oneLiner: 'Petabyte-scale columnar data warehouse for analytical SQL.',
    whatItIs:
      'A columnar, massively-parallel warehouse. Data is distributed across compute nodes by a distribution key and sorted by a sort key, so an aggregation over a billion rows touches only the columns it needs. Redshift Spectrum queries data left in S3 without loading it; Redshift Serverless removes cluster sizing entirely.',
    whenToUse: [
      'Business intelligence and dashboards over large historical datasets',
      'Complex analytical SQL — joins and aggregations across many large tables',
      'Consolidating data from many sources into one warehouse for reporting',
      'Spectrum: querying S3 data alongside warehouse tables in one query',
    ],
    whenNotToUse: [
      'OLTP — high-volume small reads and writes belong in RDS, Aurora or DynamoDB',
      'Occasional ad-hoc queries over S3 with no warehouse to maintain — that is Athena',
      'Real-time streaming ingestion as the primary pattern — Kinesis or MSK feed it, they do not replace it',
    ],
    keyNumbers: [
      {
        label: 'Architecture',
        value: 'Leader node plus compute nodes, columnar storage, MPP execution',
      },
      { label: 'Distribution styles', value: 'KEY · EVEN · ALL · AUTO' },
      { label: 'Spectrum', value: 'Query S3 directly, no load step' },
      {
        label: 'Concurrency Scaling',
        value: 'Adds transient clusters automatically during query bursts',
      },
      { label: 'AQUA / RA3', value: 'RA3 nodes separate compute from managed storage' },
      { label: 'Snapshots', value: 'Automated and manual, copyable cross-Region' },
    ],
    examTraps: [
      'Redshift versus Athena is a recurring question. Athena is serverless, per-query, best for occasional or exploratory work over S3. Redshift is a provisioned warehouse for repeated, complex, performance-sensitive queries. "No infrastructure to manage" plus "occasional" means Athena.',
      'Redshift is not multi-AZ in the classic single-cluster deployment — it is a warehouse, and DR is handled with snapshots and cross-Region copies (RA3 multi-AZ exists but is not the default assumption).',
      'A DISTSTYLE ALL copy of a small dimension table on every node is the fix for join-heavy queries shuffling data across the network.',
      'Federated Query reads live RDS/Aurora data; Spectrum reads S3. Different features, both named in questions.',
    ],
    confusedWith: [
      {
        slug: 'athena',
        difference:
          'Athena is serverless and charges per TB scanned with nothing to provision; Redshift is a running warehouse tuned for repeated heavy queries.',
      },
      {
        slug: 'rds',
        difference:
          'Row-oriented OLTP versus column-oriented OLAP. Same SQL, opposite optimisation.',
      },
      {
        slug: 'emr',
        difference:
          'EMR runs Spark/Hadoop code over data; Redshift answers SQL against a warehouse.',
      },
    ],
    pricing:
      'Per node-hour (or RPU-hour for Serverless), plus managed storage on RA3, plus per TB scanned for Spectrum.',
    docsUrl: `${D}/redshift/latest/gsg/new-user-serverless.html`,
    related: ['athena', 'glue', 's3', 'emr', 'quick-suite', 'dms', 'lake-formation'],
  },
  {
    slug: 'rds-proxy',
    name: 'Amazon RDS Proxy',
    category: 'database',
    certs: ['SAA-C03'],
    tier: 2,
    oneLiner: 'Connection pooler in front of RDS/Aurora — the fix for Lambda connection storms.',
    whatItIs:
      'A managed, highly available proxy that pools and reuses database connections. Applications connect to the proxy instead of the database, so thousands of short-lived clients share a small number of real connections. It also shortens failover: the proxy holds client connections open and reroutes them to the new writer.',
    whenToUse: [
      'Lambda functions or containers scaling out and exhausting the database connection limit',
      'Many short-lived connections where each new connection costs the database real work',
      'Reducing failover impact — the proxy cuts observed failover time significantly',
      'Removing database credentials from application code, using IAM plus Secrets Manager',
    ],
    whenNotToUse: [
      'A small fixed fleet of long-lived connections with no connection pressure',
      'Read scaling — that is read replicas, not a proxy',
    ],
    keyNumbers: [
      {
        label: 'Engines',
        value: 'RDS/Aurora MySQL and PostgreSQL, plus RDS MariaDB and SQL Server',
      },
      { label: 'Failover impact', value: 'Reduces observed failover time by up to ~66%' },
      {
        label: 'Credentials',
        value: 'Retrieved from Secrets Manager; clients can authenticate with IAM',
      },
    ],
    examTraps: [
      '"Too many connections" or "Lambda exhausts the database" is the tell. Adding read replicas does not fix a connection-count problem.',
      'RDS Proxy sits inside the VPC and is not publicly accessible.',
    ],
    confusedWith: [
      {
        slug: 'elasticache',
        difference:
          'The proxy reuses connections; a cache removes the query entirely. Different bottlenecks.',
      },
    ],
    pricing: 'Per vCPU-hour of the underlying database instance size.',
    docsUrl: `${D}/AmazonRDS/latest/UserGuide/rds-proxy.html`,
    related: ['rds', 'aurora', 'lambda', 'secrets-manager', 'iam'],
  },
  {
    slug: 'documentdb',
    name: 'Amazon DocumentDB',
    category: 'database',
    certs: ['SAA-C03'],
    tier: 3,
    oneLiner: 'MongoDB-compatible managed document database.',
    whatItIs:
      'A managed document store speaking the MongoDB API, built on the same distributed storage design as Aurora — six copies across three AZs, up to 15 read replicas.',
    whenToUse: [
      'Migrating an existing MongoDB workload to a managed service',
      'JSON documents with rich queries and secondary indexes',
    ],
    whenNotToUse: [
      'Simple key-value access — DynamoDB is cheaper and scales further',
      'Relational schemas with joins — Aurora',
    ],
    keyNumbers: [{ label: 'Storage', value: '6 copies across 3 AZs, auto-growing' }],
    examTraps: ['The tell is the word "MongoDB". Without it, DynamoDB is the usual NoSQL answer.'],
    confusedWith: [
      {
        slug: 'dynamodb',
        difference:
          'DocumentDB speaks MongoDB and does rich document queries; DynamoDB is key-value first with its own API and no scaling ceiling.',
      },
    ],
    pricing: 'Per instance-hour plus storage, I/O and backups.',
    docsUrl: `${D}/documentdb/latest/developerguide/what-is.html`,
    related: ['dynamodb', 'aurora', 'dms'],
  },
  {
    slug: 'neptune',
    name: 'Amazon Neptune',
    category: 'database',
    certs: ['SAA-C03'],
    tier: 3,
    oneLiner: 'Managed graph database for highly connected data.',
    whatItIs:
      'A purpose-built graph database supporting Gremlin, openCypher and SPARQL, designed for queries that traverse relationships rather than filter rows.',
    whenToUse: [
      'Social networks, recommendation engines, fraud rings, knowledge graphs, network topology',
    ],
    whenNotToUse: ['Anything expressible as tables or key-value lookups'],
    keyNumbers: [{ label: 'Query languages', value: 'Gremlin, openCypher, SPARQL' }],
    examTraps: [
      'The tell is "relationships", "connections between entities", "recommendation" or "fraud detection" over a graph.',
    ],
    confusedWith: [
      {
        slug: 'dynamodb',
        difference:
          'Modelling a deep graph in DynamoDB means many round trips; Neptune traverses it in one query.',
      },
    ],
    pricing: 'Per instance-hour plus storage, I/O and backups.',
    docsUrl: `${D}/neptune/latest/userguide/intro.html`,
    related: ['dynamodb', 'aurora'],
  },
  {
    slug: 'keyspaces',
    name: 'Amazon Keyspaces',
    category: 'database',
    certs: ['SAA-C03'],
    tier: 3,
    oneLiner: 'Serverless, Cassandra-compatible wide-column database.',
    whatItIs:
      'A managed service speaking the Cassandra Query Language, with no clusters to size or nodes to patch, and on-demand or provisioned capacity.',
    whenToUse: ['Migrating an existing Cassandra workload without rewriting the application'],
    whenNotToUse: ['Greenfield NoSQL where DynamoDB would serve as well'],
    keyNumbers: [{ label: 'Compatibility', value: 'Apache Cassandra CQL' }],
    examTraps: ['The tell is the word "Cassandra".'],
    confusedWith: [
      {
        slug: 'dynamodb',
        difference:
          'Keyspaces exists mainly for CQL compatibility; DynamoDB is the native choice otherwise.',
      },
    ],
    pricing: 'On-demand or provisioned read/write units plus storage.',
    docsUrl: `${D}/keyspaces/latest/devguide/what-is-keyspaces.html`,
    related: ['dynamodb'],
  },
]
