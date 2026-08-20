import type { DecisionTree } from './schema'

/**
 * The exam does not ask "what is DynamoDB". It describes a requirement and makes
 * you choose. These are that reasoning written down — learn the *path*, not the
 * list of destinations.
 */
export const decisionTrees: DecisionTree[] = [
  {
    id: 'compute',
    title: 'Which compute?',
    question: 'You need to run code. Where should it run?',
    certs: ['SAA-C03', 'DVA-C02'],
    category: 'compute',
    rootId: 'duration',
    nodes: [
      {
        id: 'duration',
        kind: 'question',
        prompt: 'How long does one unit of work run?',
        hint: 'This single question settles most compute decisions.',
        answers: [
          { label: 'Under 15 minutes, triggered by an event', next: 'lambda' },
          { label: 'Continuously, or longer than 15 minutes', next: 'packaged' },
          { label: 'A large batch of independent jobs', next: 'batch' },
        ],
      },
      {
        id: 'packaged',
        kind: 'question',
        prompt: 'Is it already containerised?',
        answers: [
          { label: 'Yes', next: 'k8s' },
          { label: 'No — a traditional application', next: 'oscontrol' },
        ],
      },
      {
        id: 'k8s',
        kind: 'question',
        prompt: 'Do you need Kubernetes specifically?',
        hint: 'Existing manifests, Helm charts, operators, or a portability requirement.',
        answers: [
          { label: 'No — we just want containers to run', next: 'fargate' },
          { label: 'Yes, and the team knows Kubernetes', next: 'eks' },
        ],
      },
      {
        id: 'oscontrol',
        kind: 'question',
        prompt: 'Do you need control of the OS, kernel, or a licensed agent?',
        answers: [
          { label: 'Yes', next: 'ec2' },
          { label: 'No — just deploy the app', next: 'beanstalk' },
        ],
      },
      { id: 'lambda', kind: 'answer', slug: 'lambda', headline: 'AWS Lambda', because: 'Event-driven, under 15 minutes, and you pay nothing while idle.', watchOut: 'A VPC-attached function has no internet route without NAT, and cold starts need provisioned concurrency.' },
      { id: 'fargate', kind: 'answer', slug: 'fargate', headline: 'ECS on Fargate', because: 'Containers with no hosts to patch and no Kubernetes to operate — the least-overhead container option.', watchOut: 'No privileged containers or host-level agents. A private-subnet task still needs NAT or endpoints to pull from ECR.' },
      { id: 'eks', kind: 'answer', slug: 'eks', headline: 'Amazon EKS', because: 'You need the Kubernetes API and its ecosystem, and the team can carry the operational weight.', watchOut: 'The control plane is charged per hour whether or not you run pods. Use IRSA for pod permissions, not a broad node role.' },
      { id: 'ec2', kind: 'answer', slug: 'ec2', headline: 'Amazon EC2', because: 'Something about the OS, kernel or licensing means nothing more managed will do.', watchOut: 'Put it in an Auto Scaling group across two AZs even at a fixed size — that is what makes it self-healing.' },
      { id: 'beanstalk', kind: 'answer', slug: 'elastic-beanstalk', headline: 'AWS Elastic Beanstalk', because: 'A standard web application on a supported runtime, with the infrastructure built for you.', watchOut: 'Never let Beanstalk own your production database — it is deleted with the environment.' },
      { id: 'batch', kind: 'answer', slug: 'batch', headline: 'AWS Batch', because: 'Queued, independent jobs with dependencies and retries, scaling to zero when the queue empties.', watchOut: 'Run it on Spot for cost. If a framework like Spark is named, it is EMR instead.' },
    ],
    matrix: {
      columns: ['Time limit', 'You patch the host', 'Billing', 'Best for'],
      rows: [
        { slug: 'lambda', cells: ['15 min', 'No', 'Per ms × memory', 'Events, glue, spiky traffic'] },
        { slug: 'fargate', cells: ['None', 'No', 'Per vCPU/GB-second', 'Long-running containers'] },
        { slug: 'ec2', cells: ['None', 'Yes', 'Per second of uptime', 'OS control, licences, GPUs'] },
        { slug: 'batch', cells: ['None', 'No', 'Underlying capacity', 'Thousands of queued jobs'] },
      ],
    },
  },
  {
    id: 'database',
    title: 'Which database?',
    question: 'You need to store data. What should hold it?',
    certs: ['SAA-C03', 'DVA-C02'],
    category: 'database',
    rootId: 'relational',
    nodes: [
      {
        id: 'relational',
        kind: 'question',
        prompt: 'Do you need joins and multi-row transactions?',
        hint: 'If the data model is genuinely relational, say so now — retrofitting is expensive.',
        answers: [
          { label: 'Yes', next: 'load' },
          { label: 'No', next: 'shape' },
        ],
      },
      {
        id: 'load',
        kind: 'question',
        prompt: 'What does the load look like?',
        answers: [
          { label: 'Steady and predictable', next: 'rds' },
          { label: 'High throughput, needs fast failover and many readers', next: 'aurora' },
          { label: 'Spiky, intermittent or unknown', next: 'aurora-serverless' },
          { label: 'Global reads from several continents', next: 'aurora-global' },
        ],
      },
      {
        id: 'shape',
        kind: 'question',
        prompt: 'What shape is the data, and how is it read?',
        answers: [
          { label: 'Key-value, access patterns known in advance', next: 'dynamodb' },
          { label: 'Temporary — a cache or session store', next: 'elasticache' },
          { label: 'Full-text search, or log analytics', next: 'opensearch' },
          { label: 'Analytical scans over terabytes', next: 'redshift' },
          { label: 'Relationships and traversals', next: 'neptune' },
          { label: 'Time-series or IoT telemetry', next: 'timestream' },
        ],
      },
      { id: 'rds', kind: 'answer', slug: 'rds', headline: 'Amazon RDS', because: 'Managed relational on a community engine, with predictable load.', watchOut: 'Multi-AZ is availability only — the standby serves no reads. Read scale means read replicas.' },
      { id: 'aurora', kind: 'answer', slug: 'aurora', headline: 'Amazon Aurora', because: 'Up to 15 low-lag replicas and sub-30-second failover, from the shared storage layer.', watchOut: 'Send reads to the reader endpoint. Pointing them at the cluster endpoint hits the writer.' },
      { id: 'aurora-serverless', kind: 'answer', slug: 'aurora-serverless', headline: 'Aurora Serverless v2', because: 'Capacity follows the load in fine increments and is billed per ACU-second.', watchOut: 'For genuinely steady load, provisioned plus a commitment is cheaper.' },
      { id: 'aurora-global', kind: 'answer', slug: 'aurora', headline: 'Aurora Global Database', because: 'Sub-second cross-Region replication with fast promotion.', watchOut: 'Secondary Regions are read-only. Multi-Region *writes* means DynamoDB Global Tables.' },
      { id: 'dynamodb', kind: 'answer', slug: 'dynamodb', headline: 'Amazon DynamoDB', because: 'Predictable single-digit-millisecond latency at any scale, with no servers.', watchOut: 'Key design is everything. A low-cardinality partition key is a hot partition, and a scan means the design is wrong.' },
      { id: 'elasticache', kind: 'answer', slug: 'elasticache', headline: 'ElastiCache', because: 'Microsecond reads for data that is read far more than it changes.', watchOut: 'It is not durable storage. Redis for HA and data structures; Memcached only for the simplest case.' },
      { id: 'opensearch', kind: 'answer', slug: 'opensearch', headline: 'OpenSearch Service', because: 'Relevance ranking, fuzzy matching and dashboards over logs or documents.', watchOut: 'For occasional queries over archived logs, Athena over S3 costs far less.' },
      { id: 'redshift', kind: 'answer', slug: 'redshift', headline: 'Amazon Redshift', because: 'Columnar MPP for repeated complex analytics by many users.', watchOut: 'For occasional ad-hoc queries with nothing to provision, Athena is the answer instead.' },
      { id: 'neptune', kind: 'answer', slug: 'neptune', headline: 'Amazon Neptune', because: 'Queries that traverse relationships rather than filter rows.', watchOut: 'The tell is "recommendation", "fraud ring" or "connections between entities".' },
      { id: 'timestream', kind: 'answer', slug: 'timestream', headline: 'Amazon Timestream', because: 'Time-series queries with automatic hot-to-cold tiering.', watchOut: 'Only when time is the primary axis of the data, not merely a column.' },
    ],
  },
  {
    id: 'storage',
    title: 'Which storage?',
    question: 'You need to store files. Which service?',
    certs: ['SAA-C03'],
    category: 'storage',
    rootId: 'access',
    nodes: [
      {
        id: 'access',
        kind: 'question',
        prompt: 'How does the application reach it?',
        answers: [
          { label: 'Over HTTP, as objects', next: 'frequency' },
          { label: 'As a disk attached to one instance', next: 'ebs' },
          { label: 'As a shared folder, several Linux machines', next: 'efs' },
          { label: 'As a Windows or SMB share', next: 'fsx-windows' },
          { label: 'HPC — extreme parallel throughput', next: 'fsx-lustre' },
        ],
      },
      {
        id: 'frequency',
        kind: 'question',
        prompt: 'How often is each object read?',
        answers: [
          { label: 'Frequently', next: 's3-standard' },
          { label: 'Rarely, but must open immediately', next: 's3-ia' },
          { label: 'Unpredictably — it varies per object', next: 's3-it' },
          { label: 'Almost never; hours to retrieve is fine', next: 'glacier' },
        ],
      },
      { id: 's3-standard', kind: 'answer', slug: 's3', headline: 'S3 Standard', because: 'No minimum duration and no retrieval fee — the right default for hot data.', watchOut: 'Put CloudFront in front for global readers: it cuts both latency and egress cost.' },
      { id: 's3-ia', kind: 'answer', slug: 's3', headline: 'S3 Standard-IA', because: 'Much cheaper storage with millisecond access, for genuinely infrequent reads.', watchOut: '30-day minimum duration and a per-GB retrieval fee. Read it often and it costs more than Standard.' },
      { id: 's3-it', kind: 'answer', slug: 's3', headline: 'S3 Intelligent-Tiering', because: 'Each object moves tier based on its own access pattern.', watchOut: 'There is a per-object monitoring fee, so it is waste when the pattern is actually known.' },
      { id: 'glacier', kind: 'answer', slug: 's3-glacier', headline: 'S3 Glacier Deep Archive', because: 'The cheapest storage AWS sells, for the compliance tail you hope never to read.', watchOut: 'Standard retrieval is about 12 hours and there is a 180-day minimum. Match the class to the stated retrieval window exactly.' },
      { id: 'ebs', kind: 'answer', slug: 'ebs', headline: 'Amazon EBS', because: 'Block storage for a boot volume or a single-instance filesystem.', watchOut: 'Single-AZ, and one instance at a time. Use gp3 to buy IOPS without buying capacity.' },
      { id: 'efs', kind: 'answer', slug: 'efs', headline: 'Amazon EFS', because: 'A shared POSIX filesystem many instances mount across AZs, with no capacity to plan.', watchOut: 'Linux only. Add lifecycle policies, and One Zone if AZ resilience is genuinely not needed.' },
      { id: 'fsx-windows', kind: 'answer', slug: 'fsx', headline: 'FSx for Windows File Server', because: 'Real SMB with NTFS ACLs and Active Directory integration.', watchOut: 'It needs a Managed Microsoft AD or a trust to one — AD Connector will not do.' },
      { id: 'fsx-lustre', kind: 'answer', slug: 'fsx', headline: 'FSx for Lustre', because: 'Hundreds of GB/s for HPC and ML training, linked directly to S3.', watchOut: 'Scratch deployments have no replication — S3 stays the source of truth.' },
    ],
  },
  {
    id: 'integration',
    title: 'How should these components talk?',
    question: 'Two parts of the system need to communicate. How?',
    certs: ['SAA-C03', 'DVA-C02'],
    category: 'appint',
    rootId: 'sync',
    nodes: [
      {
        id: 'sync',
        kind: 'question',
        prompt: 'Does the caller need an answer immediately?',
        answers: [
          { label: 'Yes — request/response', next: 'direct' },
          { label: 'No — fire and forget', next: 'consumers' },
          { label: 'It is a multi-step process with branching and retries', next: 'sfn' },
        ],
      },
      {
        id: 'consumers',
        kind: 'question',
        prompt: 'How many parties care about the event?',
        answers: [
          { label: 'Exactly one worker', next: 'sqs' },
          { label: 'Several, each needing its own copy', next: 'fanout' },
          { label: 'Several, routed by event content', next: 'eventbridge' },
          { label: 'A high-volume stream needing order and replay', next: 'kinesis' },
        ],
      },
      { id: 'direct', kind: 'answer', slug: 'api-gateway', headline: 'API Gateway or an ALB', because: 'Synchronous calls need a front door — API Gateway for authorisation, throttling and keys; an ALB when you only need routing.', watchOut: 'API Gateway has a hard 29-second integration timeout. Longer work must become asynchronous.' },
      { id: 'sqs', kind: 'answer', slug: 'sqs', headline: 'Amazon SQS', because: 'A durable queue that absorbs the spike and lets the consumer work at its own pace.', watchOut: 'The visibility timeout must exceed the processing time, or messages are processed twice.' },
      { id: 'fanout', kind: 'answer', slug: 'sns', headline: 'SNS → one SQS queue per consumer', because: 'SNS delivers to all of them; each SQS queue gives that consumer durability and its own pace.', watchOut: 'SNS alone has no retention — an offline HTTP subscriber loses the event.' },
      { id: 'eventbridge', kind: 'answer', slug: 'eventbridge', headline: 'Amazon EventBridge', because: 'Content-based routing to many AWS target types, plus schedules, archive and replay.', watchOut: 'Higher latency and cost per message than SNS at very high volume.' },
      { id: 'kinesis', kind: 'answer', slug: 'kinesis-data-streams', headline: 'Kinesis Data Streams', because: 'An ordered, replayable log that several consumers read independently.', watchOut: 'Ordering is per shard, so partition-key cardinality decides whether you get a hot shard.' },
      { id: 'sfn', kind: 'answer', slug: 'step-functions', headline: 'AWS Step Functions', because: 'It owns the state, the retries and the error handling, and shows exactly which step failed.', watchOut: 'Standard for long or exactly-once workflows; Express for millions of short ones.' },
    ],
  },
  {
    id: 'edge',
    title: 'Which edge or global service?',
    question: 'Users are far away, or you need a fixed address. What goes in front?',
    certs: ['SAA-C03'],
    category: 'network',
    rootId: 'protocol',
    nodes: [
      {
        id: 'protocol',
        kind: 'question',
        prompt: 'What is the traffic?',
        answers: [
          { label: 'HTTP/HTTPS, and much of it is cacheable', next: 'cloudfront' },
          { label: 'HTTP, but every response is unique', next: 'aga-or-cf' },
          { label: 'TCP or UDP — gaming, VoIP, IoT', next: 'aga' },
          { label: 'Just needs to resolve to the right Region', next: 'r53' },
        ],
      },
      {
        id: 'aga-or-cf',
        kind: 'question',
        prompt: 'Do clients need static IP addresses to allowlist?',
        answers: [
          { label: 'Yes', next: 'aga' },
          { label: 'No — but latency still matters', next: 'cloudfront' },
        ],
      },
      { id: 'cloudfront', kind: 'answer', slug: 'cloudfront', headline: 'Amazon CloudFront', because: 'Caches at the edge, terminates TLS there, and carries WAF — cutting latency and egress cost together.', watchOut: 'The ACM certificate must be in us-east-1, and the cache key decides your hit ratio.' },
      { id: 'aga', kind: 'answer', slug: 'global-accelerator', headline: 'AWS Global Accelerator', because: 'Two static anycast IPs, any TCP/UDP protocol, and regional failover in seconds rather than DNS TTLs.', watchOut: 'It does not cache anything, and there is a fixed hourly charge.' },
      { id: 'r53', kind: 'answer', slug: 'route53', headline: 'Amazon Route 53', because: 'Latency, geolocation, weighted or failover routing, with health checks.', watchOut: 'Client DNS caching bounds how fast failover can be. If "seconds" is required, use Global Accelerator.' },
    ],
  },
]

export const treeById = new Map(decisionTrees.map((t) => [t.id, t]))
