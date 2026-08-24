import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const databaseServices: Service[] = [
  {
    slug: 'rds',
    name: 'Amazon RDS',
    abbr: 'RDS',
    category: 'database',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Managed relational databases — six engines, patched and backed up for you.',
    whatItIs:
      'MySQL, PostgreSQL, MariaDB, Oracle, SQL Server and Db2 as managed instances. AWS handles provisioning, patching, backups and failover; you still choose instance size, storage type and topology. Two features carry most of the exam weight, and they are different things: Multi-AZ is for availability, read replicas are for read scale.',
    whyItExists:
      'Running a database on an instance means somebody owns the parts nobody wants to own: minor version patches, a backup that has actually been tested, and a failover procedure written down and rehearsed. That work is identical at every company, and it is skipped until the night it is needed. RDS exists to take the operational half and leave you the schema — which is why the exam expects you to reach for it unless something forces self-management.',
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
    /**
     * Multi-AZ versus read replicas is the single most reliably examined RDS
     * distinction, and it was three keyNumbers rows that each described one
     * option without ever making you choose between them.
     */
    optionSets: [
      {
        id: 'deployment',
        label: 'Deployment options',
        prompt: 'which deployment',
        note: 'Availability and read scale are separate purchases here. A question that wants both wants two of these.',
        options: [
          {
            name: 'Single-AZ',
            pick: 'Development and test, where an hour of downtime costs nothing',
            signal: 'One instance, one AZ · backups still taken',
            gotcha: 'Maintenance and failure both mean downtime. Never the answer when any availability target is stated.',
          },
          {
            name: 'Multi-AZ instance',
            pick: 'The database must survive an AZ failure with no manual step',
            signal: 'Synchronous standby in another AZ · automatic failover, typically 60–120s',
            gotcha:
              'Availability only — the standby serves no reads. Choosing it to "spread read load" is the classic wrong answer.',
          },
          {
            name: 'Multi-AZ DB cluster',
            pick: 'You want automatic failover and the standbys to be useful for reads',
            signal: 'One writer plus two readable standbys · faster failover than the instance deployment',
            gotcha:
              'A narrower set of engines and versions than the plain Multi-AZ instance, so it is not a drop-in for every workload.',
          },
          {
            name: 'Read replica',
            pick: 'Read traffic is the bottleneck and the reads can tolerate lag',
            signal: 'Up to 15 for MySQL/MariaDB/PostgreSQL · asynchronous',
            gotcha:
              'Not an availability feature: promotion is manual and irreversible, and the application must be changed to send reads to it.',
          },
          {
            name: 'Cross-Region read replica',
            pick: 'Local reads in another Region, or a warm standby for regional DR',
            signal: 'Asynchronous across Regions · promotable to a standalone writer',
            gotcha: 'Multi-AZ never crosses a Region. Anything about surviving a Region loss needs this, not Multi-AZ.',
          },
        ],
      },
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
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: "AWS's own MySQL/PostgreSQL-compatible engine on a distributed storage layer.",
    whatItIs:
      'Aurora keeps six copies of your data across three AZs in a shared storage volume that grows automatically, and separates that storage from the compute instances in front of it. Because replicas read the same volume rather than replaying a log, there are up to 15 of them with millisecond replica lag, and failover is seconds rather than a minute.',
    whyItExists:
      'Bolting a managed service onto MySQL or PostgreSQL left the hard part untouched: the storage was still a volume attached to one instance, so a replica replayed a log to keep up, failover took a minute or more, and growing the disk was a planned event. Aurora exists because AWS rewrote that storage layer instead — replicas read the same six-way replicated volume rather than chasing it — which is why the answer to "same engine, better availability and replica lag" is Aurora.',
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
      { label: 'Backtrack', value: 'Rewind an Aurora MySQL cluster in place, without a restore' },
    ],
    optionSets: [
      {
        id: 'endpoint',
        label: 'Endpoints',
        prompt: 'which endpoint',
        note: 'Choosing the wrong one is a design error the exam writes into scenarios rather than asking about directly.',
        options: [
          {
            name: 'Cluster endpoint',
            pick: 'Writes, and anything that must reach the current primary',
            signal: 'Always resolves to the writer · follows a failover automatically',
            gotcha:
              'Sending reads here puts every query on the writer. That is the most common wrong design in Aurora questions.',
          },
          {
            name: 'Reader endpoint',
            pick: 'Read traffic that should be spread over the replicas',
            signal: 'Load-balances across all available replicas',
            gotcha: 'Round-robins per connection, not per query, so a long-lived pool can still land unevenly.',
          },
          {
            name: 'Custom endpoint',
            pick: 'A subset of instances should serve a particular workload — reporting on the big instances, say',
            signal: 'A named set of instances you define',
            gotcha: 'The answer when a question separates analytics traffic from application traffic inside one cluster.',
          },
          {
            name: 'Instance endpoint',
            pick: 'Diagnosing one specific instance',
            signal: 'Points at exactly one instance',
            gotcha: 'Does not follow a failover. Using it in an application is how a design survives until the first failover and no longer.',
          },
        ],
      },
      {
        id: 'deployment',
        label: 'Deployment and billing options',
        prompt: 'which Aurora configuration',
        options: [
          {
            name: 'Provisioned',
            pick: 'Steady, well-understood load',
            signal: 'Instances you size · cheapest for predictable throughput',
            gotcha: 'Idle capacity is still billed, which is what makes it wrong for intermittent workloads.',
          },
          {
            name: 'Aurora Serverless v2',
            slug: 'aurora-serverless',
            pick: 'Load is intermittent or varies widely and you do not want to size instances',
            signal: 'Scales in fine ACU increments, per ACU-second, without dropping connections',
            gotcha:
              'For genuinely steady load, provisioned plus a commitment is cheaper. Do not answer from v1 behaviour — v1 scaled coarsely and paused.',
          },
          {
            name: 'Aurora Global Database',
            pick: 'Cross-Region disaster recovery with sub-second replication, or local reads far away',
            signal: 'Up to 5 secondary Regions · lag typically under 1 second · RTO under 1 minute',
            gotcha:
              'Secondary Regions are read-only. Multi-Region *writes* is DynamoDB Global Tables, not this.',
          },
          {
            name: 'Aurora Standard',
            pick: 'I/O is a modest share of the bill',
            signal: 'Billed per I/O request',
            gotcha: 'Cheaper right up until I/O passes roughly 25% of Aurora spend, at which point it quietly stops being so.',
          },
          {
            name: 'Aurora I/O-Optimized',
            pick: 'The bill is dominated by I/O charges and predictable cost matters',
            signal: 'No per-request I/O charge · higher instance and storage rate',
            gotcha:
              'A cluster configuration, not a different engine, and it makes nothing faster. The threshold is roughly 25% of spend going on I/O.',
          },
        ],
      },
    ],
    examTraps: [
      'Use the *reader* endpoint for read traffic. Pointing reads at the cluster endpoint sends every query to the writer — a common design error in questions.',
      'Aurora Global Database is the answer for cross-Region DR with sub-second replication and fast promotion. A cross-Region read replica on RDS is slower and coarser.',
      'Backtrack is Aurora MySQL only and is not a backup — it is a limited-window in-place rewind for "undo that bad migration".',
      'Aurora Serverless v2 scales in fine-grained ACUs and can be mixed with provisioned instances in the same cluster. v1 scaled coarsely and had to pause — do not answer from v1 behaviour.',
      'Aurora Replica auto scaling adds replicas based on CPU or connections — the answer to "read load varies unpredictably".',
      'Multi-AZ is inherent in Aurora storage. There is no separate "enable Multi-AZ" toggle; you get availability by having a replica in another AZ to fail over to.',
      'Aurora I/O-Optimized is the answer to "our bill is dominated by I/O charges and we want predictable cost" — roughly 25% of spend going on I/O is the threshold. It is a cluster configuration, not a different engine, and it does not make the workload faster.',
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
      'Per instance-hour (or ACU-hour for Serverless), plus storage consumed, I/O requests, and backups. Two cluster storage configurations: Aurora Standard bills I/O per request, Aurora I/O-Optimized bundles it into a higher instance and storage rate and is cheaper above roughly 25% I/O spend.',
    docsUrl: `${D}/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html`,
    related: ['rds', 'aurora-serverless', 'rds-proxy', 'dynamodb', 'dms'],
  },
  {
    slug: 'aurora-serverless',
    name: 'Amazon Aurora Serverless v2',
    category: 'database',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Aurora capacity that scales in fine steps with load, billed per ACU-second.',
    whatItIs:
      'A capacity mode for Aurora. Instead of choosing an instance size, you set a minimum and maximum in Aurora Capacity Units and the cluster scales between them in fractions of a second, without dropping connections. Mixed clusters — some provisioned instances, some serverless — are supported.',
    whyItExists:
      "An instance size is a guess about tomorrow's load, so a spiky or unpredictable workload was either sized for the peak and paid for around the clock, or sized for the average and slow when it mattered. Resizing meant a maintenance window. Aurora Serverless v2 exists so capacity follows load in fine steps without dropping connections — the answer whenever a question stresses unpredictable or intermittent traffic.",
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
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner:
      'Serverless key-value and document store with single-digit-millisecond latency at any scale.',
    whatItIs:
      'A fully managed NoSQL table. Every item has a partition key, optionally plus a sort key, and the partition key decides which physical partition the item lives on — which is why key design is the whole game. There are no servers, no version upgrades, and no practical size ceiling. For DVA this is the most heavily examined data service; for SAA it is the default answer whenever the access pattern is key-based.',
    whyItExists:
      'Scaling a relational database past one machine meant sharding it yourself: a routing layer, a rebalancing plan, cross-shard queries that no longer worked, and an upgrade that everyone dreaded. Teams paid that price for workloads that only ever looked items up by key. DynamoDB exists to give up joins and ad-hoc queries in exchange for flat latency at any size — which is why key design, not tuning, is the whole game.',
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
        label: 'Key size',
        value: 'Partition key up to 2,048 bytes · sort key up to 1,024 bytes',
        note: 'Hard limits, like the 400 KB item — no support ticket raises them.',
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
    /**
     * Two sets, which is why `optionSets` is an array. Capacity mode and index
     * type are unrelated decisions that the exam asks about separately, and
     * folding either back into `keyNumbers` would leave one of them undrilled.
     */
    optionSets: [
      {
        id: 'capacity-mode',
        label: 'Capacity modes',
        prompt: 'which capacity mode',
        options: [
          {
            name: 'On-demand',
            pick: 'Traffic is unpredictable, spiky, or brand new with no history',
            signal: 'Billed per request · no capacity to plan · absorbs spikes instantly',
            gotcha:
              'Considerably more expensive per request than provisioned. "Unpredictable" in the stem is what justifies it; steady load does not.',
          },
          {
            name: 'Provisioned',
            pick: 'Traffic is steady and predictable, and cost matters',
            signal: 'RCU/WCU you set · cheapest per request',
            gotcha: 'A spike beyond the provisioned ceiling is throttled. Burst capacity buys minutes, not headroom.',
          },
          {
            name: 'Provisioned with auto scaling',
            pick: 'Predictable daily or weekly shape, with peaks you do not want to pay for all day',
            signal: 'Target utilisation between a floor and a ceiling',
            gotcha:
              'Reacts over minutes, so it does not save you from a sudden spike — that is on-demand. It is the answer for a diurnal curve, not a flash sale.',
          },
        ],
      },
      {
        id: 'index-type',
        label: 'Index types',
        prompt: 'which index type',
        options: [
          {
            name: 'Global secondary index',
            abbr: 'GSI',
            pick: 'Query on an attribute that is not the table partition key',
            signal: 'Different partition and sort key · own capacity · up to 20 per table',
            gotcha:
              'Eventually consistent, always. A question demanding a strongly consistent read on a non-key attribute cannot be answered with a GSI. Throttling a GSI throttles writes to the base table.',
          },
          {
            name: 'Local secondary index',
            abbr: 'LSI',
            pick: 'Same partition key, but you need a second sort order — and reads must be strongly consistent',
            signal: 'Shares the table capacity · 10 GB per partition-key limit',
            gotcha:
              'Must be created with the table and can never be added later. That single fact decides most GSI-versus-LSI questions.',
          },
        ],
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
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Managed Redis (Valkey) or Memcached — microsecond reads in front of a slower store.',
    whatItIs:
      'In-memory caching as a managed service. The engine choice is the exam question: Memcached is a simple, multi-threaded, horizontally shardable cache with no persistence and no replication. Redis/Valkey adds replication, automatic failover, persistence, transactions, pub/sub, sorted sets and other data structures.',
    whyItExists:
      'The same expensive query ran thousands of times a second because the answer changed once an hour, so the database was scaled up to serve work it had already done. Caching in each application process meant every instance had a different, colder copy. ElastiCache exists to make that memory a shared tier the fleet can hit in microseconds, so the database only sees the reads that genuinely need it.',
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
    families: ['saa'],
    tier: 1,
    oneLiner: 'Petabyte-scale columnar data warehouse for analytical SQL.',
    whatItIs:
      'A columnar, massively-parallel warehouse. Data is distributed across compute nodes by a distribution key and sorted by a sort key, so an aggregation over a billion rows touches only the columns it needs. Redshift Spectrum queries data left in S3 without loading it; Redshift Serverless removes cluster sizing entirely.',
    whyItExists:
      'Analytical questions — sum this column across two years — were asked of a database built to fetch whole rows one at a time, so it read every field of every row to add up one of them. Teams scaled the transactional database until reporting hurt the application it shared. Redshift exists because columnar storage across parallel nodes is a different machine for a different question, and separating it means a report cannot slow down checkout.',
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
    families: ['saa'],
    tier: 2,
    oneLiner: 'Connection pooler in front of RDS/Aurora — the fix for Lambda connection storms.',
    whatItIs:
      'A managed, highly available proxy that pools and reuses database connections. Applications connect to the proxy instead of the database, so thousands of short-lived clients share a small number of real connections. It also shortens failover: the proxy holds client connections open and reroutes them to the new writer.',
    whyItExists:
      'A relational database charges real memory for every connection, and serverless compute breaks that assumption: a thousand concurrent Lambda invocations open a thousand connections, each used for 40 ms, and the database falls over from the handshakes alone. Pooling inside the function is impossible, because the function is the thing being multiplied. RDS Proxy exists to hold the pool outside — and, as a bonus, to hide a failover from clients.',
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
    families: ['saa'],
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
    families: ['saa'],
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
    families: ['saa'],
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
