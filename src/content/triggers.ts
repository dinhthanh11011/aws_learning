import type { Trigger } from './schema'

/**
 * Exam questions are requirements in costume. Each entry here is a phrase that
 * gives the answer away, what it actually means, and — the useful half — the
 * plausible answer it is engineered to make you pick instead.
 *
 * Drill these and you eliminate two or three options before finishing the stem.
 */
export const triggers: Trigger[] = [
  {
    id: 't-least-op',
    phrase: '"least operational overhead" · "no servers to manage" · "fully managed"',
    means:
      'Choose the most managed option that still meets the functional requirement. This phrase is doing elimination work, not describing a feature.',
    slugs: ['lambda', 'fargate', 'aurora-serverless', 's3', 'dynamodb', 'athena'],
    notThis: [
      {
        slug: 'ec2',
        why: 'Anything you patch and scale yourself is what this phrase exists to rule out.',
      },
      {
        slug: 'emr',
        why: 'A cluster you size and tune is the opposite of least overhead — Glue or Athena is the managed answer.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d2', 'saa-d3', 'saa-d4'],
  },
  {
    id: 't-ha-az',
    phrase: '"highly available" · "survive the loss of an Availability Zone"',
    means:
      'Multi-AZ. Spread across at least two AZs, with health checks and automatic replacement.',
    slugs: ['elb', 'ec2-auto-scaling', 'rds', 'aurora', 'efs', 'global-infrastructure'],
    notThis: [
      {
        slug: 'ebs',
        why: 'EBS volumes are single-AZ. If shared, AZ-durable storage is needed, it is EFS.',
      },
      {
        slug: 'instance-store',
        why: 'Ephemeral and host-bound — it does not survive a stop, let alone an AZ.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d2'],
  },
  {
    id: 't-dr-region',
    phrase: '"disaster recovery" · "the entire Region becomes unavailable" · "RTO/RPO"',
    means:
      'Cross-Region. Match the strategy to the stated numbers: hours → backup and restore; tens of minutes → pilot light; minutes → warm standby; near zero → active-active.',
    slugs: ['route53', 'aurora', 's3', 'backup', 'global-accelerator', 'global-infrastructure'],
    notThis: [
      {
        slug: 'rds',
        why: 'RDS Multi-AZ is within one Region. A Region failure needs a cross-Region read replica or Aurora Global Database.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d2'],
  },
  {
    id: 't-decouple',
    phrase: '"decouple" · "components should scale independently" · "handle traffic spikes"',
    means: 'Put a queue, topic or bus between them so the producer stops waiting on the consumer.',
    slugs: ['sqs', 'sns', 'eventbridge', 'kinesis-data-streams'],
    notThis: [
      {
        slug: 'elb',
        why: 'A load balancer distributes synchronous requests; it does not buffer work or absorb a spike.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d2', 'dva-d1'],
  },
  {
    id: 't-fanout',
    phrase: '"multiple systems must each receive a copy of every event"',
    means:
      'Fan-out: SNS topic with one SQS queue per consumer, so each gets durability and its own pace.',
    slugs: ['sns', 'sqs', 'eventbridge'],
    notThis: [
      {
        slug: 'sqs',
        why: 'A single queue delivers each message to one consumer. Two consumers on one queue split the work, they do not both get it.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d2', 'dva-d1'],
  },
  {
    id: 't-realtime',
    phrase:
      '"real-time" · "ordered" · "replay the last N hours" · "several consumers of the same stream"',
    means:
      'Kinesis Data Streams. Ordering per shard, retention, and independent consumers are exactly what a queue does not give you.',
    slugs: ['kinesis-data-streams', 'msk'],
    notThis: [
      {
        slug: 'data-firehose',
        why: 'Firehose buffers and delivers — it is near-real-time and cannot replay.',
      },
      { slug: 'sqs', why: 'Messages are deleted after processing, so there is nothing to replay.' },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d3', 'dva-d1'],
  },
  {
    id: 't-nearrealtime',
    phrase: '"near real-time" · "load streaming data into S3 / Redshift with no code"',
    means:
      'Amazon Data Firehose. The buffering delay is acceptable and there are no consumers to write.',
    slugs: ['data-firehose'],
    notThis: [
      {
        slug: 'kinesis-data-streams',
        why: 'Correct only if you must write a consumer, need ordering, or need replay — otherwise it is more work than the question asked for.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d3'],
  },
  {
    id: 't-no-internet',
    phrase: '"must not traverse the public internet" · "private connectivity to AWS services"',
    means:
      'VPC endpoints. Gateway for S3 and DynamoDB (free), interface/PrivateLink for everything else.',
    slugs: ['privatelink', 'direct-connect', 'vpc'],
    notThis: [
      {
        slug: 'nat-gateway',
        why: 'NAT reaches the actual internet. It is the thing this requirement is ruling out.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d1', 'saa-d4'],
  },
  {
    id: 't-block-ip',
    phrase: '"block a specific IP address or range"',
    means:
      'A network ACL (subnet-level deny) or WAF (Layer 7 IP rule). Security groups have no deny rule at all.',
    slugs: ['nacl', 'waf'],
    notThis: [
      {
        slug: 'security-group',
        why: 'Security groups are allow-only. They physically cannot express a deny.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d1'],
  },
  {
    id: 't-no-code-change',
    phrase: '"without modifying the application" · "application changes are not possible"',
    means:
      'A transparent layer in front: a cache, a proxy, or a load balancer that the application does not know about.',
    slugs: ['elasticache', 'rds-proxy', 'elb', 'cloudfront', 'global-accelerator'],
    notThis: [
      {
        slug: 'dynamodb',
        why: 'Switching database engine is the largest application change there is.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d2', 'saa-d3'],
  },
  {
    id: 't-unpredictable-access',
    phrase: '"access patterns are unknown / unpredictable / changing" (for stored objects)',
    means: 'S3 Intelligent-Tiering, which moves objects between tiers for you.',
    slugs: ['s3'],
    notThis: [
      {
        slug: 's3-glacier',
        why: "Naming a specific cold class requires knowing the pattern. If you knew it, Intelligent-Tiering's monitoring fee would be waste.",
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d4'],
  },
  {
    id: 't-worm',
    phrase: '"retain for seven years" · "must not be deleted, even by an administrator"',
    means:
      'S3 Object Lock in compliance mode, usually with Glacier Deep Archive for the storage class.',
    slugs: ['s3', 's3-glacier', 'backup'],
    notThis: [{ slug: 'kms', why: 'Encryption controls who can read it, not who can delete it.' }],
    families: ['saa'],
    domainIds: ['saa-d1', 'saa-d4'],
  },
  {
    id: 't-interruptible',
    phrase:
      '"fault-tolerant" · "can be interrupted" · "flexible start and end times" · "lowest cost"',
    means:
      'Spot Instances, usually as the elastic portion above an On-Demand or committed baseline.',
    slugs: ['spot', 'batch', 'ec2-auto-scaling'],
    notThis: [
      {
        slug: 'savings-plans',
        why: 'A commitment discounts steady usage; it is not the answer to "interruptible".',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d4'],
  },
  {
    id: 't-steady-commit',
    phrase: '"steady state" · "predictable usage for the next three years" · "reduce compute cost"',
    means: 'Savings Plans (or Reserved Instances for RDS, Redshift, ElastiCache and OpenSearch).',
    slugs: ['savings-plans'],
    notThis: [
      {
        slug: 'spot',
        why: 'Interruption risk is unacceptable when the requirement is steady production capacity.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d4'],
  },
  {
    id: 't-sql-on-s3',
    phrase: '"query files in S3 using SQL" · "occasionally" · "no infrastructure"',
    means: 'Athena. If it becomes frequent and complex for many users, it becomes Redshift.',
    slugs: ['athena', 'glue'],
    notThis: [
      {
        slug: 'redshift',
        why: 'A running warehouse for occasional queries is provisioned cost you were told to avoid.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d3'],
  },
  {
    id: 't-apex-dns',
    phrase: '"point the root domain (example.com) at an AWS resource"',
    means:
      'A Route 53 alias record. CNAMEs are illegal at the zone apex, and alias queries to AWS resources are free.',
    slugs: ['route53'],
    notThis: [
      {
        slug: 'cloudfront',
        why: 'CloudFront may be the target, but the mechanism the question is testing is the alias record.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d3'],
  },
  {
    id: 't-app-users',
    phrase: '"sign-up and sign-in for our application\'s users" · "social login"',
    means:
      'Cognito user pool. Add an identity pool if the client then needs AWS credentials directly.',
    slugs: ['cognito', 'api-gateway'],
    notThis: [
      {
        slug: 'iam',
        why: 'IAM users are for AWS principals, never for your customers. Creating an IAM user per app user is always wrong.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d1', 'dva-d2'],
  },
  {
    id: 't-static-ip',
    phrase: '"static IP address" · "clients must allowlist our IP" · "non-HTTP protocol"',
    means:
      'NLB within a Region; Global Accelerator if it must be global with fast regional failover.',
    slugs: ['elb', 'global-accelerator'],
    notThis: [
      {
        slug: 'cloudfront',
        why: 'CloudFront caches HTTP; it gives you a domain name, not static IPs, and it does not carry arbitrary TCP/UDP.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d3'],
  },
  {
    id: 't-queue-scale',
    phrase: '"scale workers according to the amount of pending work"',
    means:
      'An Auto Scaling policy on queue depth — a backlog-per-instance target using ApproximateNumberOfMessagesVisible.',
    slugs: ['ec2-auto-scaling', 'sqs', 'cloudwatch'],
    notThis: [
      {
        slug: 'ec2',
        why: 'CPU utilisation is the wrong metric for a worker fleet — an idle worker waiting on a queue shows low CPU while work piles up.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d2', 'saa-d3'],
  },
  {
    id: 't-no-ssh',
    phrase: '"access private instances without opening port 22" · "no bastion host"',
    means:
      'Systems Manager Session Manager. In a private subnet with no NAT it needs three interface endpoints: ssm, ssmmessages and ec2messages.',
    slugs: ['systems-manager', 'privatelink'],
    notThis: [
      {
        slug: 'client-vpn',
        why: 'A VPN is more machinery than the question needs, and still leaves you managing SSH.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d1'],
  },
  {
    id: 't-who-did',
    phrase: '"who deleted / changed / accessed that resource?"',
    means:
      'CloudTrail. For S3 object-level access specifically, data events must be enabled first.',
    slugs: ['cloudtrail'],
    notThis: [
      {
        slug: 'cloudwatch',
        why: 'CloudWatch holds metrics and application logs, not an audit record of API callers.',
      },
      {
        slug: 'config',
        why: 'Config shows what the configuration became, not who called the API.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d1', 'dva-d4'],
  },
  {
    id: 't-compliance-check',
    phrase: '"ensure no resource is ever created unencrypted / untagged / public"',
    means: 'Preventive → an SCP. Detective plus auto-fix → Config rule with remediation.',
    slugs: ['organizations', 'config'],
    notThis: [
      {
        slug: 'security-hub',
        why: 'Security Hub aggregates and scores findings; it is not the enforcement mechanism.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d1'],
  },
  {
    id: 't-too-many-conns',
    phrase: '"too many database connections" · "Lambda exhausts the connection pool"',
    means: 'RDS Proxy. This is a connection-count problem, not a read-throughput problem.',
    slugs: ['rds-proxy'],
    notThis: [
      {
        slug: 'rds',
        why: 'Adding read replicas adds read capacity. It does nothing about connection exhaustion.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d3', 'dva-d1'],
  },
  {
    id: 't-read-heavy',
    phrase: '"read-heavy" · "the same queries repeat" · "reduce database load"',
    means:
      'A cache first (ElastiCache, or DAX for DynamoDB), then read replicas if the reads are genuinely distinct.',
    slugs: ['elasticache', 'rds', 'aurora', 'cloudfront'],
    notThis: [
      {
        slug: 'rds',
        why: 'Multi-AZ adds no read capacity at all — the standby serves no traffic.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d3', 'dva-d4'],
  },
  {
    id: 't-scan-slow',
    phrase: '"DynamoDB scans are slow and expensive" · "filter on a non-key attribute"',
    means:
      'Redesign the keys or add a global secondary index so the access pattern becomes a Query.',
    slugs: ['dynamodb'],
    notThis: [
      {
        slug: 'dynamodb',
        why: 'Raising provisioned capacity makes an inefficient scan faster and more expensive — it does not fix the design.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d3', 'dva-d1'],
  },
  {
    id: 't-windows-smb',
    phrase: '"Windows" · "SMB share" · "Active Directory-integrated file system"',
    means: 'FSx for Windows File Server.',
    slugs: ['fsx', 'directory-service'],
    notThis: [
      {
        slug: 'efs',
        why: 'EFS is NFS and Linux-only. Any mention of Windows or SMB rules it out.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d3'],
  },
  {
    id: 't-hpc-s3',
    phrase: '"HPC" · "machine learning training" · "extreme throughput over data in S3"',
    means: 'FSx for Lustre, linked to the S3 bucket.',
    slugs: ['fsx', 's3'],
    notThis: [
      { slug: 'efs', why: 'EFS does not reach the parallel throughput HPC questions describe.' },
    ],
    families: ['saa'],
    domainIds: ['saa-d3'],
  },
  {
    id: 't-tape',
    phrase: '"existing backup software expects a tape library"',
    means: 'Storage Gateway in Tape Gateway mode.',
    slugs: ['storage-gateway'],
    notThis: [
      {
        slug: 'backup',
        why: 'AWS Backup replaces the backup software; the question said the software stays.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d4'],
  },
  {
    id: 't-petabyte-move',
    phrase: '"petabytes" · "limited bandwidth" · "would take months over the network"',
    means:
      'Snow Family. Do the arithmetic the question gives you: if the transfer exceeds about a week, ship the data.',
    slugs: ['snow-family'],
    notThis: [
      {
        slug: 'direct-connect',
        why: 'Lead times run to weeks or months — longer than the migration itself.',
      },
      {
        slug: 'datasync',
        why: 'Right for recurring network transfer, wrong when the link is the bottleneck.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d3', 'saa-d4'],
  },
  {
    id: 't-min-downtime-db',
    phrase: '"migrate the database with minimal downtime"',
    means:
      'DMS with full load plus change data capture. Add the Schema Conversion Tool only if the engine changes.',
    slugs: ['dms'],
    notThis: [
      {
        slug: 'backup',
        why: 'A snapshot-and-restore migration means downtime for the whole restore.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d3', 'saa-d4'],
  },
  {
    id: 't-sqli',
    phrase: '"SQL injection" · "cross-site scripting" · "OWASP Top 10" · "rate-limit one IP"',
    means: 'AWS WAF, attached to CloudFront, an ALB or API Gateway.',
    slugs: ['waf', 'cloudfront'],
    notThis: [
      { slug: 'shield', why: 'Shield handles volumetric Layer 3/4 DDoS, not request content.' },
      {
        slug: 'elb',
        why: 'WAF cannot attach to an NLB — there is no HTTP layer there to inspect.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d1', 'dva-d2'],
  },
  {
    id: 't-lambda-vpc-internet',
    phrase: '"Lambda in a VPC cannot reach the internet / a third-party API"',
    means:
      'The subnet needs a NAT gateway route. For AWS APIs specifically, a VPC endpoint is cheaper.',
    slugs: ['lambda', 'nat-gateway', 'privatelink'],
    notThis: [
      {
        slug: 'security-group',
        why: 'A permissive security group cannot create a route that does not exist.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d1', 'dva-d1'],
  },
  {
    id: 't-dup-messages',
    phrase: '"messages are being processed twice"',
    means:
      'The visibility timeout is shorter than the processing time. Raise it, or extend the heartbeat.',
    slugs: ['sqs'],
    notThis: [
      {
        slug: 'sqs',
        why: 'Switching to a FIFO queue is a bigger change than needed and caps throughput — fix the timeout first.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d2', 'dva-d1'],
  },
  {
    id: 't-canary',
    phrase:
      '"gradually shift traffic to the new version" · "roll back automatically if errors rise"',
    means:
      'CodeDeploy canary or linear deployment, with a CloudWatch alarm as the rollback trigger. On Lambda, a weighted alias.',
    slugs: ['codedeploy', 'lambda', 'sam'],
    notThis: [
      {
        slug: 'elastic-beanstalk',
        why: 'Right only if the workload is already a Beanstalk environment — otherwise it is the wrong layer.',
      },
    ],
    families: ['dva'],
    domainIds: ['dva-d3'],
  },
  {
    id: 't-feature-flag',
    phrase: '"turn a feature on without redeploying" · "roll configuration back safely"',
    means: 'AWS AppConfig, with a validator and an alarm-triggered rollback.',
    slugs: ['appconfig'],
    notThis: [
      {
        slug: 'systems-manager',
        why: 'Parameter Store stores the value but has no gradual rollout, validation or rollback.',
      },
    ],
    families: ['dva'],
    domainIds: ['dva-d3'],
  },
  {
    id: 't-trace-filter',
    phrase: '"filter traces by user id / order id"',
    means: 'An X-Ray annotation — annotations are indexed, metadata is not.',
    slugs: ['xray'],
    notThis: [
      {
        slug: 'xray',
        why: 'Metadata attaches the value but cannot be filtered on. That is the entire distinction being tested.',
      },
    ],
    families: ['dva'],
    domainIds: ['dva-d4'],
  },
  {
    id: 't-rotate-creds',
    phrase: '"credentials must be rotated automatically"',
    means: 'Secrets Manager. Rotation is the one thing Parameter Store cannot do.',
    slugs: ['secrets-manager'],
    notThis: [
      { slug: 'systems-manager', why: 'Parameter Store SecureString encrypts but never rotates.' },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d1', 'dva-d2'],
  },
  {
    id: 't-kms-denied',
    phrase: '"AccessDenied on an encrypted object despite full S3 permissions"',
    means:
      'The KMS key policy does not permit the principal. The key policy is authoritative; no IAM policy can override it.',
    slugs: ['kms', 'iam'],
    notThis: [
      {
        slug: 'iam',
        why: 'Adding more IAM permissions changes nothing if the key policy excludes the principal.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d1', 'dva-d2'],
  },
  {
    id: 't-many-vpcs',
    phrase: '"dozens of VPCs must reach each other" · "simplify our peering mesh"',
    means: 'Transit Gateway. Peering is not transitive, and a full mesh grows as n(n−1)/2.',
    slugs: ['transit-gateway'],
    notThis: [
      {
        slug: 'vpc-peering',
        why: 'Correct for two or three VPCs, unmanageable beyond that — and never transitive.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d3', 'saa-d4'],
  },
  {
    id: 't-workforce-sso',
    phrase:
      '"employees sign in once across all our AWS accounts" · "use our existing corporate directory"',
    means: 'IAM Identity Center with permission sets, federated to your identity provider.',
    slugs: ['iam-identity-center', 'organizations'],
    notThis: [
      {
        slug: 'iam',
        why: 'Creating IAM users per account per person is the anti-pattern this replaces.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d1'],
  },
  {
    id: 't-cold-start',
    phrase: '"eliminate cold starts" · "consistent latency on the first request"',
    means: 'Provisioned concurrency, which keeps environments initialised and warm.',
    slugs: ['lambda'],
    notThis: [
      {
        slug: 'lambda',
        why: 'Reserved concurrency guarantees and caps *how many* can run — it does not pre-warm anything.',
      },
    ],
    families: ['dva'],
    domainIds: ['dva-d1', 'dva-d4'],
  },
  {
    id: 't-athena-cost',
    phrase: '"reduce the cost of our Athena queries"',
    means:
      'Fewer bytes scanned: convert to Parquet or ORC, compress, and partition so queries prune.',
    slugs: ['athena', 'glue', 's3'],
    notThis: [
      {
        slug: 'redshift',
        why: 'Migrating to a warehouse is a bigger change than the question asked for.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d3', 'saa-d4'],
  },
  {
    id: 't-nat-cost',
    phrase: '"our NAT gateway data-processing charges are too high"',
    means:
      'A gateway VPC endpoint for S3 and DynamoDB traffic (free), and interface endpoints for other AWS APIs.',
    slugs: ['privatelink', 'nat-gateway'],
    notThis: [
      {
        slug: 'nat-gateway',
        why: 'Consolidating to one NAT gateway cuts the hourly fee but adds cross-AZ charges and a single point of failure.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d4'],
  },
  {
    id: 't-column-security',
    phrase: '"restrict access to specific columns or rows of data in S3"',
    means: 'Lake Formation. Object storage permissions are all-or-nothing per object.',
    slugs: ['lake-formation'],
    notThis: [
      {
        slug: 's3',
        why: 'A bucket policy cannot express column- or row-level access — an object is a single unit.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d1', 'saa-d3'],
  },
  {
    id: 't-pii-discovery',
    phrase: '"find out whether our buckets contain personal data"',
    means: 'Macie, which classifies sensitive data in S3.',
    slugs: ['macie'],
    notThis: [
      {
        slug: 'guardduty',
        why: 'GuardDuty detects malicious activity, not the content of your data.',
      },
      {
        slug: 'inspector',
        why: 'Inspector scans software for vulnerabilities, not data for sensitivity.',
      },
    ],
    families: ['saa'],
    domainIds: ['saa-d1'],
  },
  {
    id: 't-domain-egress',
    phrase: '"instances may only reach an approved list of domain names"',
    means:
      'AWS Network Firewall with a domain-list rule — the only AWS network control that filters egress by hostname.',
    slugs: ['network-firewall'],
    notThis: [
      { slug: 'nacl', why: 'NACLs match IP, port and protocol. They cannot see a domain name.' },
      { slug: 'security-group', why: 'Same limitation, and allow-only besides.' },
    ],
    families: ['saa'],
    domainIds: ['saa-d1'],
  },
  {
    id: 't-orchestrate',
    phrase: '"multiple steps" · "retries and error handling" · "see which step failed"',
    means:
      'Step Functions. Standard for long or exactly-once workflows, Express for high-volume short ones.',
    slugs: ['step-functions'],
    notThis: [
      {
        slug: 'lambda',
        why: 'Chaining Lambda functions that call each other hides the state and hand-rolls the retries.',
      },
    ],
    families: ['saa', 'dva'],
    domainIds: ['saa-d2', 'dva-d1'],
  },
]
