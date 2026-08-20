import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const analyticsServices: Service[] = [
  {
    slug: 'kinesis-data-streams',
    name: 'Amazon Kinesis Data Streams',
    abbr: 'KDS',
    category: 'analytics',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: 'Ordered, replayable real-time stream that many consumers can read independently.',
    whatItIs:
      'A stream of records split into shards. Records are ordered within a shard, kept for a retention period (24 hours by default, up to 365 days), and read by multiple independent consumers each tracking its own position. That replayability and multi-consumer independence is what separates it from a queue — and what makes it the answer whenever "real-time" and "multiple analytics consumers" appear together.',
    whenToUse: [
      'Clickstreams, IoT telemetry, application logs, metrics — high-volume ordered ingestion',
      'Several different consumers processing the same data for different purposes',
      'Replaying the last N hours or days after fixing a consumer bug',
      'Sub-second processing latency with ordering guarantees per key',
    ],
    whenNotToUse: [
      'Simple work distribution where a message is processed once and deleted — SQS',
      'You just want the data landed in S3 or Redshift with no code — Data Firehose',
      'Kafka-specific APIs or an existing Kafka estate — MSK',
    ],
    keyNumbers: [
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
    examTraps: [
      'Kinesis versus SQS is a recurring decision. Ordering, replay, or multiple independent consumers → Kinesis. Otherwise → SQS, which is simpler and cheaper.',
      'ProvisionedThroughputExceededException means a hot shard: too many records share one partition key. The fix is a higher-cardinality partition key, or more shards.',
      'Enhanced fan-out is the answer when several consumers are competing for the shared 2 MB/s per shard and each needs full throughput.',
      'A Lambda event-source mapping on a stream processes records per shard in order, and a failing batch blocks that shard until it succeeds or expires. Configure a bisect-on-error and a maximum retry age.',
      'On-demand mode is the answer to "unpredictable throughput" — no shard maths required.',
      'The Kinesis Producer Library aggregates records for efficiency; the Kinesis Client Library handles checkpointing and shard rebalancing.',
    ],
    confusedWith: [
      {
        slug: 'data-firehose',
        difference:
          'Firehose is zero-code delivery to a destination with a buffering delay and no replay. Data Streams is a durable, replayable stream you write consumers against.',
      },
      {
        slug: 'sqs',
        difference:
          'A queue message is deleted after processing; a stream record stays for the retention period and can be re-read.',
      },
      {
        slug: 'msk',
        difference:
          'MSK is Apache Kafka, chosen for API compatibility and an existing Kafka ecosystem. Kinesis is the AWS-native equivalent with less to operate.',
      },
    ],
    pricing:
      'Per shard-hour plus per million PUT payload units (provisioned), or per GB ingested and retrieved (on-demand), plus extended retention and enhanced fan-out.',
    docsUrl: `${D}/streams/latest/dev/introduction.html`,
    related: ['data-firehose', 'msk', 'lambda', 'sqs', 'kinesis-video-streams', 'opensearch'],
  },
  {
    slug: 'data-firehose',
    name: 'Amazon Data Firehose',
    abbr: 'Firehose',
    category: 'analytics',
    certs: ['SAA-C03'],
    tier: 1,
    oneLiner: 'Zero-code streaming delivery into S3, Redshift, OpenSearch or Splunk.',
    whatItIs:
      'A fully managed delivery stream. It buffers incoming records by size or time, optionally transforms them with a Lambda function, optionally converts JSON to Parquet or ORC, compresses, and writes to the destination. There is no shard management, no consumer code, and no replay — it is a pipe, not a log.',
    whenToUse: [
      'Landing streaming data in S3 for a data lake with no code to maintain',
      'Loading a stream into Redshift, OpenSearch or a third-party endpoint',
      'Converting incoming JSON to Parquet on the way in, to make Athena queries cheap',
      'Near-real-time is good enough (buffering introduces a delay by design)',
    ],
    whenNotToUse: [
      'Sub-second processing latency — the buffer makes that impossible',
      'Multiple independent consumers, or replay — that is Data Streams',
      'Custom stream processing logic beyond a transformation function',
    ],
    keyNumbers: [
      { label: 'Buffer size', value: '1–128 MB depending on destination' },
      {
        label: 'Buffer interval',
        value: '0–900 seconds',
        note: 'Delivery happens when size *or* time is hit, whichever first.',
      },
      {
        label: 'Destinations',
        value: 'S3 · Redshift · OpenSearch · Splunk · HTTP endpoints · partner destinations',
      },
      { label: 'Transformation', value: 'Optional Lambda; built-in JSON→Parquet/ORC conversion' },
      { label: 'Replay', value: 'None' },
      { label: 'Scaling', value: 'Fully automatic — no shards' },
    ],
    examTraps: [
      'Firehose is *near*-real-time. Any requirement for sub-second or true real-time processing rules it out and points to Data Streams.',
      '"Stream data into S3 with the least operational effort" is Firehose, essentially always.',
      'Firehose can read *from* a Kinesis Data Stream — the two are often used together, stream for processing, Firehose for archiving.',
      'Parquet conversion in Firehose is the standard answer to "make our Athena queries cheaper" for streaming data.',
      'Redshift delivery goes via S3 and a COPY command underneath, which matters for troubleshooting questions.',
    ],
    confusedWith: [
      {
        slug: 'kinesis-data-streams',
        difference:
          'Firehose delivers with no code and no replay; Data Streams is a replayable log you write consumers for.',
      },
      {
        slug: 'glue',
        difference:
          'Glue is batch (or streaming) ETL with a full Spark engine; Firehose does light transformation on the way to a destination.',
      },
    ],
    pricing: 'Per GB ingested, plus format conversion and VPC delivery charges.',
    docsUrl: `${D}/firehose/latest/dev/what-is-this-service.html`,
    related: ['kinesis-data-streams', 's3', 'redshift', 'opensearch', 'lambda', 'athena'],
  },
  {
    slug: 'msk',
    name: 'Amazon MSK',
    abbr: 'MSK',
    category: 'analytics',
    certs: ['SAA-C03'],
    tier: 2,
    oneLiner: 'Managed Apache Kafka — for when the requirement says "Kafka".',
    whatItIs:
      'Fully managed Apache Kafka clusters, with AWS handling broker provisioning, patching and replication across AZs. MSK Serverless removes capacity planning entirely. It exists on the exam for the same reason Amazon MQ does: existing tooling and API compatibility.',
    whenToUse: [
      'An existing Kafka application, Kafka Connect connectors, or Kafka Streams code',
      'Requirements naming Kafka explicitly',
      'Very long retention with Kafka semantics',
    ],
    whenNotToUse: [
      'Greenfield streaming on AWS — Kinesis has less to operate and no brokers to size',
      'Simple queueing — SQS',
    ],
    keyNumbers: [
      { label: 'Modes', value: 'Provisioned (you choose broker types and counts) or Serverless' },
      { label: 'Auth', value: 'IAM · SASL/SCRAM · mutual TLS' },
      { label: 'Replication', value: 'Across AZs, with configurable replication factor' },
    ],
    examTraps: [
      'The tell is the word "Kafka". Without it, Kinesis is the expected AWS-native answer.',
      'MSK is inside your VPC and is not a public endpoint.',
    ],
    confusedWith: [
      {
        slug: 'kinesis-data-streams',
        difference:
          'Same problem, different API and operational model. Kafka compatibility versus AWS-native simplicity.',
      },
      {
        slug: 'mq',
        difference: 'MSK is a streaming log; MQ is a traditional broker with queues and topics.',
      },
    ],
    pricing:
      'Per broker-hour plus storage (provisioned), or per cluster-hour plus partition-hours and throughput (serverless).',
    docsUrl: `${D}/msk/latest/developerguide/what-is-msk.html`,
    related: ['kinesis-data-streams', 'mq', 'glue', 'lambda'],
  },
  {
    slug: 'athena',
    name: 'Amazon Athena',
    category: 'analytics',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: 'Serverless SQL directly over data sitting in S3 — pay per terabyte scanned.',
    whatItIs:
      'A Presto/Trino-based query engine that reads S3 objects in place using table definitions from the Glue Data Catalog. Nothing is loaded, nothing is provisioned, and you are billed per terabyte scanned — which makes the file format and partitioning your main cost lever, not the query itself.',
    whenToUse: [
      'Ad-hoc or occasional SQL over logs, exports and data-lake files in S3',
      'Querying CloudTrail logs, VPC Flow Logs, ALB access logs, Cost and Usage Reports',
      'Exploration before deciding whether a warehouse is justified',
      'Combining with QuickSight for serverless dashboards',
    ],
    whenNotToUse: [
      'Frequent, complex, latency-sensitive queries by many users — Redshift',
      'Transactional workloads — Athena is read-oriented analytics',
      'Sub-second query latency',
    ],
    keyNumbers: [
      { label: 'Pricing', value: 'Per TB of data scanned' },
      {
        label: 'Cost levers',
        value:
          'Columnar formats (Parquet, ORC) · compression · partitioning · fewer columns selected',
      },
      { label: 'Catalog', value: 'AWS Glue Data Catalog' },
      {
        label: 'Federated query',
        value: 'Connectors to RDS, DynamoDB, Redshift and more via Lambda',
      },
      { label: 'Engine', value: 'Trino/Presto SQL; Athena for Apache Spark also available' },
    ],
    examTraps: [
      'Converting CSV or JSON to Parquet and partitioning by date is the standard "reduce Athena cost" answer, and it is asked repeatedly. Compression and partition pruning cut the bytes scanned, and bytes scanned is the bill.',
      'Athena versus Redshift: "serverless", "occasional", "no infrastructure" → Athena. "Repeated complex analytics for a BI team" → Redshift.',
      'Query results are written to an S3 results location you must configure.',
      'Athena needs a table definition. Glue crawlers are how that gets created without hand-writing DDL.',
      'Workgroups are how you separate teams and enforce per-query data-scan limits.',
    ],
    confusedWith: [
      {
        slug: 'redshift',
        difference:
          'Athena provisions nothing and bills per scan; Redshift is a running warehouse tuned for repeated heavy queries.',
      },
      { slug: 'glue', difference: 'Glue transforms and catalogues data; Athena queries it.' },
      {
        slug: 'emr',
        difference:
          'EMR runs arbitrary Spark/Hadoop code on a cluster; Athena runs SQL with no cluster.',
      },
    ],
    pricing:
      'Per TB scanned, plus S3 storage and request charges. Provisioned capacity is available for predictable workloads.',
    docsUrl: `${D}/athena/latest/ug/what-is.html`,
    related: ['s3', 'glue', 'redshift', 'quick-suite', 'lake-formation', 'cloudtrail'],
  },
  {
    slug: 'glue',
    name: 'AWS Glue',
    category: 'analytics',
    certs: ['SAA-C03'],
    tier: 1,
    oneLiner: 'Serverless ETL plus the Data Catalog every other analytics service reads.',
    whatItIs:
      'Two things worth separating. The *Data Catalog* is a metadata store — table definitions, schemas, partitions — that Athena, Redshift Spectrum, EMR and Lake Formation all use. *Glue ETL* is serverless Apache Spark: jobs that read, transform and write data, with crawlers that infer schemas automatically and a visual editor for building the transformations.',
    whenToUse: [
      'Serverless ETL with no cluster to manage',
      'Cataloguing a data lake so Athena and Redshift Spectrum can query it',
      'Crawling S3 to discover schemas and partitions automatically',
      'Format conversion (CSV → Parquet), deduplication, joins and enrichment at scale',
    ],
    whenNotToUse: [
      'Fine control over Spark or Hadoop cluster configuration — EMR',
      'Streaming delivery with no transformation — Firehose',
      'Simple scheduled scripts — Lambda or Step Functions',
    ],
    keyNumbers: [
      {
        label: 'Data Catalog',
        value: 'Shared metadata store for Athena, Redshift Spectrum, EMR, Lake Formation',
      },
      {
        label: 'Crawlers',
        value: 'Infer schema and partitions from S3, JDBC and DynamoDB sources',
      },
      { label: 'Job types', value: 'Spark · Spark Streaming · Python shell · Ray' },
      { label: 'Billing unit', value: 'DPU-hours' },
      { label: 'Glue DataBrew', value: 'Visual data preparation with no code' },
      {
        label: 'Bookmarks',
        value: 'Track processed data so incremental runs do not reprocess everything',
      },
    ],
    examTraps: [
      '"Serverless ETL" is Glue. "Managed Hadoop/Spark cluster with full control" is EMR. That is the whole distinction most questions test.',
      'The Data Catalog is what makes Athena work at all — a question about "making S3 data queryable by SQL" usually involves a crawler.',
      'Job bookmarks are the answer to "avoid reprocessing data we have already handled".',
      'Glue can write directly in Parquet with partitioning, which is the setup half of every Athena cost-optimisation answer.',
    ],
    confusedWith: [
      {
        slug: 'emr',
        difference: 'EMR gives you the cluster and all its knobs; Glue hides the cluster entirely.',
      },
      {
        slug: 'dms',
        difference: 'DMS moves and replicates databases; Glue transforms data for analytics.',
      },
      {
        slug: 'data-firehose',
        difference:
          'Firehose is a streaming pipe with light transformation; Glue is a full ETL engine.',
      },
    ],
    pricing:
      'Per DPU-hour for jobs and crawlers, plus Data Catalog storage and requests beyond the free tier.',
    docsUrl: `${D}/glue/latest/dg/what-is-glue.html`,
    related: ['athena', 's3', 'redshift', 'emr', 'lake-formation', 'data-firehose'],
  },
  {
    slug: 'emr',
    name: 'Amazon EMR',
    abbr: 'EMR',
    category: 'analytics',
    certs: ['SAA-C03'],
    tier: 2,
    oneLiner: 'Managed Hadoop, Spark, Hive, Presto and friends on a cluster you control.',
    whatItIs:
      'Managed big-data clusters. AWS provisions and configures the frameworks; you keep control of instance types, cluster sizing, bootstrap actions and framework tuning. Node roles matter: the primary node coordinates, core nodes hold HDFS data, and task nodes are compute-only — which is why task nodes are the ones you run on Spot.',
    whenToUse: [
      'Existing Spark, Hadoop, Hive, HBase or Presto workloads',
      'Very large batch processing where cluster tuning pays off',
      'Machine learning or genomics pipelines built on Spark',
      'Cost optimisation via Spot task nodes on transient clusters',
    ],
    whenNotToUse: [
      'Simple serverless ETL — Glue',
      'Plain SQL over S3 — Athena',
      'Data warehousing — Redshift',
    ],
    keyNumbers: [
      {
        label: 'Node types',
        value: 'Primary (coordinates) · Core (HDFS + compute) · Task (compute only)',
      },
      {
        label: 'Spot strategy',
        value: 'Task nodes on Spot; keep core nodes On-Demand so HDFS data survives',
      },
      {
        label: 'Cluster modes',
        value: 'Long-running or transient (terminates when the step completes)',
      },
      { label: 'Storage', value: 'HDFS on local disks, or EMRFS to read and write S3 directly' },
      { label: 'Deployment options', value: 'EMR on EC2 · EMR on EKS · EMR Serverless' },
    ],
    examTraps: [
      'Put Spot capacity on *task* nodes only. Losing a core node loses HDFS blocks — a favourite trap.',
      'A transient cluster that terminates after its step is the cost-optimised answer for scheduled batch jobs.',
      'EMRFS lets a transient cluster keep its data in S3, decoupling storage from the cluster lifecycle.',
      'If the question does not name a framework and stresses low operational effort, the answer is Glue or Athena, not EMR.',
    ],
    confusedWith: [
      { slug: 'glue', difference: 'Serverless and opinionated versus a cluster you tune.' },
      {
        slug: 'batch',
        difference:
          'Batch runs containerised jobs with no framework; EMR runs big-data frameworks.',
      },
      {
        slug: 'redshift',
        difference: 'EMR processes data with code; Redshift answers SQL over a warehouse.',
      },
    ],
    pricing:
      'Per instance-hour plus a small EMR surcharge per instance, or per vCPU/memory-second for EMR Serverless.',
    docsUrl: `${D}/emr/latest/ManagementGuide/emr-what-is-emr.html`,
    related: ['glue', 'athena', 's3', 'spot', 'redshift'],
  },
  {
    slug: 'lake-formation',
    name: 'AWS Lake Formation',
    category: 'analytics',
    certs: ['SAA-C03'],
    tier: 2,
    oneLiner: 'Builds a governed data lake with table-, column- and row-level permissions.',
    whatItIs:
      'A governance layer over S3 and the Glue Data Catalog. It centralises fine-grained permissions — down to columns, rows and cells — and enforces them consistently across Athena, Redshift Spectrum, EMR and QuickSight, so you stop expressing analytics permissions as S3 bucket policies.',
    whenToUse: [
      'Column-, row- or cell-level access control over data-lake tables',
      'Central permissions across several analytics engines',
      'Cross-account data sharing with governed access',
      'Building a data lake with blueprints and centralised auditing',
    ],
    whenNotToUse: ['A small lake where bucket-level IAM permissions are sufficient'],
    keyNumbers: [
      { label: 'Granularity', value: 'Database · table · column · row · cell' },
      { label: 'Enforced in', value: 'Athena · Redshift Spectrum · EMR · QuickSight · Glue' },
      {
        label: 'Tag-based access control',
        value: 'LF-Tags scale permissions without per-table grants',
      },
    ],
    examTraps: [
      'Column-level or row-level security over S3 data is Lake Formation. An S3 bucket policy cannot express it — objects are all-or-nothing.',
      'Lake Formation permissions layer on top of the Glue Data Catalog; it does not replace it.',
    ],
    confusedWith: [
      {
        slug: 'glue',
        difference:
          'Glue holds the metadata and runs ETL; Lake Formation governs who may read which parts of it.',
      },
    ],
    pricing: 'No charge for Lake Formation permissions; you pay for the underlying services.',
    docsUrl: `${D}/lake-formation/latest/dg/what-is-lake-formation.html`,
    related: ['glue', 'athena', 's3', 'redshift', 'quick-suite'],
  },
  {
    slug: 'opensearch',
    name: 'Amazon OpenSearch Service',
    category: 'analytics',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 2,
    oneLiner: 'Managed search and log analytics with dashboards.',
    whatItIs:
      'Managed OpenSearch (the Elasticsearch fork) plus OpenSearch Dashboards. Its two exam roles are full-text search over application data, and centralised log analytics where you need to search and visualise logs interactively rather than just query them.',
    whenToUse: [
      'Full-text search: fuzzy matching, relevance ranking, autocomplete, faceting',
      'Log and trace analytics with interactive dashboards',
      'Real-time application and infrastructure monitoring at scale',
      'Vector search for semantic and retrieval-augmented generation workloads',
    ],
    whenNotToUse: [
      'A primary transactional data store — it is a search index, not a system of record',
      'Occasional SQL over archived logs in S3 — Athena is far cheaper',
      'Simple key-value lookups — DynamoDB',
    ],
    keyNumbers: [
      { label: 'Deployment', value: 'Managed domains (you size nodes) or Serverless (automatic)' },
      { label: 'HA', value: 'Multi-AZ with dedicated primary nodes for production' },
      { label: 'Tiers', value: 'Hot · UltraWarm · Cold storage for cost-tiered log retention' },
      { label: 'Ingestion', value: 'Data Firehose · OpenSearch Ingestion · Logstash · direct API' },
    ],
    examTraps: [
      '"Search" with relevance, typo tolerance or faceting means OpenSearch. DynamoDB and RDS cannot do it well.',
      'UltraWarm and Cold tiers are the answer to "keep a year of logs searchable but cut the cost".',
      'CloudWatch Logs plus a subscription filter into OpenSearch is the standard "make our logs searchable and visual" pipeline.',
      'For occasional queries over archived logs, Athena over S3 beats keeping an OpenSearch cluster running.',
    ],
    confusedWith: [
      {
        slug: 'cloudwatch',
        difference:
          'CloudWatch Logs Insights queries logs AWS already collects; OpenSearch gives richer search, dashboards and longer interactive retention.',
      },
      {
        slug: 'kendra',
        difference:
          'Kendra is natural-language enterprise search with ML ranking over documents; OpenSearch is a search engine you index and query yourself.',
      },
    ],
    pricing: 'Per instance-hour plus EBS storage (managed domains), or per OCU-hour (serverless).',
    docsUrl: `${D}/opensearch-service/latest/developerguide/what-is.html`,
    related: ['cloudwatch', 'data-firehose', 'kinesis-data-streams', 'kendra', 's3'],
  },
  {
    slug: 'quick-suite',
    name: 'Amazon Quick Suite (QuickSight)',
    category: 'analytics',
    certs: ['SAA-C03'],
    tier: 2,
    oneLiner: 'Serverless business intelligence dashboards, priced per user.',
    whatItIs:
      'A managed BI service that connects to Redshift, Athena, RDS, S3, Aurora and third-party sources, builds interactive dashboards, and embeds them in your own applications. SPICE is its in-memory engine, which caches data so dashboards stay fast without hammering the source. AWS has been consolidating QuickSight into the Quick Suite brand.',
    whenToUse: [
      'Dashboards and reports for business users with no infrastructure to run',
      'Embedding analytics in a customer-facing application',
      'Serverless BI on top of Athena or Redshift',
      'ML-powered anomaly detection and natural-language questions over your data',
    ],
    whenNotToUse: [
      'Ad-hoc SQL exploration by engineers — Athena',
      'Log search and troubleshooting — OpenSearch Dashboards',
    ],
    keyNumbers: [
      { label: 'SPICE', value: 'In-memory calculation engine that caches datasets for speed' },
      {
        label: 'Editions',
        value:
          'Standard and Enterprise (Enterprise adds row-level security, AD integration, VPC connectivity)',
      },
      {
        label: 'Pricing model',
        value: 'Per author and per reader (readers can be pay-per-session)',
      },
      { label: 'Row-level security', value: 'Enterprise edition' },
    ],
    examTraps: [
      'Row-level security and VPC connectivity require the Enterprise edition — a detail worth recognising.',
      'The tell is "dashboards", "visualise", "business users" or "embed analytics".',
      'SPICE is the answer to "dashboards are slow and hitting the database too hard".',
    ],
    confusedWith: [
      {
        slug: 'athena',
        difference:
          'Athena runs the query; QuickSight draws the chart. They are usually used together.',
      },
      {
        slug: 'managed-grafana',
        difference:
          'Grafana is for operational and time-series metrics; QuickSight is for business reporting.',
      },
    ],
    pricing: 'Per author-month plus per reader-month or per session.',
    docsUrl: `${D}/quicksight/latest/user/welcome.html`,
    related: ['athena', 'redshift', 's3', 'lake-formation', 'managed-grafana'],
  },
  {
    slug: 'data-exchange',
    name: 'AWS Data Exchange',
    category: 'analytics',
    certs: ['SAA-C03'],
    tier: 3,
    oneLiner: 'Marketplace for finding, subscribing to and publishing third-party datasets.',
    whatItIs:
      'A catalogue of licensed third-party data — financial, weather, healthcare, demographic — delivered into your S3 buckets or accessible through APIs, with subscription management and revision tracking handled for you.',
    whenToUse: [
      'Acquiring commercial third-party data without bespoke contracts and transfer plumbing',
      'Publishing your own data commercially',
    ],
    whenNotToUse: [
      'Sharing data within your own organisation — RAM, Lake Formation or S3 policies',
    ],
    keyNumbers: [{ label: 'Delivery', value: 'Into S3, or via API and Redshift datashares' }],
    examTraps: ['The tell is "third-party data provider" or "subscribe to a dataset".'],
    confusedWith: [
      {
        slug: 'lake-formation',
        difference:
          "Lake Formation governs your own lake; Data Exchange acquires someone else's data.",
      },
    ],
    pricing: 'Free to subscribe to free datasets; paid subscriptions vary by provider.',
    docsUrl: `${D}/data-exchange/latest/userguide/what-is.html`,
    related: ['s3', 'redshift', 'lake-formation'],
  },
]
