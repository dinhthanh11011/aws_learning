import type { CategoryId } from './schema'

/**
 * The layered view of a real AWS system. The point of reading this before
 * learning individual services is that AWS has 200+ offerings and a production
 * system uses about twenty — arranged in five layers that are always the same
 * shape. Learn the shape first and every service afterwards has somewhere to go.
 */

export const LAYERS = ['edge', 'network', 'compute', 'data', 'crosscut'] as const
export type LayerId = (typeof LAYERS)[number]

export interface LayerDef {
  id: LayerId
  title: string
  question: string
  blurb: string
}

export const LAYER_DEFS: Record<LayerId, LayerDef> = {
  edge: {
    id: 'edge',
    title: 'Edge',
    question: 'How does a user find you, and how fast?',
    blurb:
      'DNS resolves the name, a CDN serves what it can from a nearby city, and a firewall drops the traffic you never wanted. Everything here happens before your own infrastructure is touched — which is why it is also the cheapest place to solve latency and the best place to block an attack.',
  },
  network: {
    id: 'network',
    title: 'Network',
    question: 'What is reachable, from where?',
    blurb:
      'A VPC with public and private subnets across at least two Availability Zones. A subnet is public because its route table points at an internet gateway — nothing else makes it public. This layer is where 30% of the SAA paper lives.',
  },
  compute: {
    id: 'compute',
    title: 'Compute',
    question: 'Where does your code actually run?',
    blurb:
      'Functions, containers or instances, sized and replaced automatically. The decision is almost always made by two facts: how long a unit of work runs, and how much of the operating system you need to control.',
  },
  data: {
    id: 'data',
    title: 'Data',
    question: 'Where does state live, and how does it survive?',
    blurb:
      'Relational for joins and transactions, key-value for scale and predictable latency, object storage for everything that is a file, a cache in front of whatever is being read repeatedly. This layer is the hardest to change later, which is why it is worth getting right first.',
  },
  crosscut: {
    id: 'crosscut',
    title: 'Cross-cutting',
    question: 'Who is allowed, what happened, and what did it cost?',
    blurb:
      'Identity, encryption, observability and billing touch every other layer. They are drawn to one side because they do not sit in the request path — but every question about a permission, a mysterious failure or a surprise invoice lands here.',
  },
}

export interface BpNode {
  slug: string
  layer: LayerId
  /** Column within the layer, 0-indexed. */
  col: number
  /** Why this node exists in a real system, in one line. */
  role: string
  category: CategoryId
}

/**
 * Deliberately ~24 nodes, not 141. This is the system you would actually
 * build; the atlas is for looking things up.
 */
export const BP_NODES: BpNode[] = [
  { slug: 'route53', layer: 'edge', col: 0, role: 'Resolves the name, and steers between Regions', category: 'network' },
  { slug: 'cloudfront', layer: 'edge', col: 1, role: 'Serves cached content from a city near the user', category: 'network' },
  { slug: 'waf', layer: 'edge', col: 2, role: 'Drops SQL injection, XSS and floods before they land', category: 'security' },
  { slug: 'shield', layer: 'edge', col: 3, role: 'Absorbs volumetric DDoS — already on, for free', category: 'security' },

  { slug: 'vpc', layer: 'network', col: 0, role: 'The private network everything else lives inside', category: 'network' },
  { slug: 'elb', layer: 'network', col: 1, role: 'Spreads requests across healthy targets in several AZs', category: 'network' },
  { slug: 'nat-gateway', layer: 'network', col: 2, role: 'Lets private subnets call out, and nothing call in', category: 'network' },
  { slug: 'privatelink', layer: 'network', col: 3, role: 'Reaches AWS services without touching the internet', category: 'network' },

  { slug: 'ec2-auto-scaling', layer: 'compute', col: 0, role: 'Keeps the fleet the right size, and replaces the dead', category: 'compute' },
  { slug: 'ecs', layer: 'compute', col: 1, role: 'Runs containers without you running Kubernetes', category: 'containers' },
  { slug: 'fargate', layer: 'compute', col: 2, role: 'Provides the capacity, with no host to patch', category: 'serverless' },
  { slug: 'lambda', layer: 'compute', col: 3, role: 'Runs a function per event, and nothing while idle', category: 'serverless' },
  { slug: 'api-gateway', layer: 'compute', col: 4, role: 'Authorises, throttles and shapes API traffic', category: 'frontend' },
  { slug: 'sqs', layer: 'compute', col: 5, role: 'Absorbs the spike so the backend never sees it', category: 'appint' },

  { slug: 'rds', layer: 'data', col: 0, role: 'Relational, when you need joins and transactions', category: 'database' },
  { slug: 'aurora', layer: 'data', col: 1, role: 'The same SQL, faster, with seconds-long failover', category: 'database' },
  { slug: 'dynamodb', layer: 'data', col: 2, role: 'Key-value at any scale, at predictable latency', category: 'database' },
  { slug: 'elasticache', layer: 'data', col: 3, role: 'Absorbs repeated reads in microseconds', category: 'database' },
  { slug: 's3', layer: 'data', col: 4, role: 'Every file, log, backup and static asset', category: 'storage' },
  { slug: 'ebs', layer: 'data', col: 5, role: 'The disk an instance boots from and writes to', category: 'storage' },

  { slug: 'iam', layer: 'crosscut', col: 0, role: 'Decides every single API call in the account', category: 'security' },
  { slug: 'kms', layer: 'crosscut', col: 1, role: 'Holds the keys everything else encrypts with', category: 'security' },
  { slug: 'cloudwatch', layer: 'crosscut', col: 2, role: 'Metrics, logs and the alarms that drive scaling', category: 'mgmt' },
  { slug: 'cloudtrail', layer: 'crosscut', col: 3, role: 'The audit record of who called what, and when', category: 'mgmt' },
  { slug: 'cost-explorer', layer: 'crosscut', col: 4, role: 'Where the money went, and where it is going', category: 'cost' },
]

export interface Flow {
  id: string
  title: string
  question: string
  /** Ordered node slugs the animation travels through. */
  path: string[]
  /** What each hop does, aligned with `path`. */
  steps: string[]
  /** What breaks, and the symptom you would see. */
  failures: { at: string; symptom: string }[]
}

/**
 * The flows are the point of the whole page. A static diagram tells you what
 * exists; watching a request travel tells you what depends on what — and the
 * failure list turns that into the "this is broken, why?" reasoning the exam
 * actually rewards.
 */
export const FLOWS: Flow[] = [
  {
    id: 'web-request',
    title: 'A web request',
    question: 'Someone opens your site. What happens, in order?',
    path: ['route53', 'cloudfront', 'waf', 'elb', 'ec2-auto-scaling', 'elasticache', 'aurora'],
    steps: [
      'Route 53 answers the DNS query — and if you use latency or failover routing, this is where the Region is chosen.',
      'CloudFront checks its edge cache. A hit ends the journey here, which is the cheapest and fastest possible outcome.',
      'AWS WAF inspects the request. Injection attempts, bad bots and per-IP floods are dropped at the edge, before your Region.',
      'The load balancer picks a healthy target. Unhealthy ones are already out of rotation, which is what makes this a resilience component and not just a distributor.',
      'A container or instance from the Auto Scaling group handles it. If the group is at capacity, this is where scaling is triggered.',
      'The application checks the cache first. A hit here avoids the database entirely — the single highest-leverage optimisation in most systems.',
      'On a miss, the database is queried. Reads should go to the reader endpoint; sending them to the writer is a common design error.',
    ],
    failures: [
      { at: 'route53', symptom: 'Name does not resolve at all, or resolves to a dead Region because no health check is attached to the failover record.' },
      { at: 'cloudfront', symptom: 'Everything works but nothing is cached — usually a cache key forwarding all headers and cookies, making every request a miss.' },
      { at: 'elb', symptom: 'HTTP 503. No healthy targets: the health check path is wrong, or the grace period is shorter than the application takes to boot.' },
      { at: 'ec2-auto-scaling', symptom: 'Instances launch and are killed in a loop, because the health check grace period expires mid-boot.' },
      { at: 'aurora', symptom: '"Too many connections" under load — the fix is RDS Proxy, not more read replicas.' },
    ],
  },
  {
    id: 'private-egress',
    title: 'Outbound from a private subnet',
    question: 'A private instance needs to download a patch. How does it get out, and what does it cost?',
    path: ['ec2-auto-scaling', 'nat-gateway', 'vpc'],
    steps: [
      'The instance has no public IP, so it cannot use the internet gateway directly. Its route table decides what happens next.',
      'The 0.0.0.0/0 route sends it to the NAT gateway, which lives in a public subnet and translates the source address. This is charged hourly and per gigabyte.',
      'The NAT gateway uses the VPC internet gateway to reach the internet. Return traffic is allowed automatically; nothing can initiate a connection inward.',
    ],
    failures: [
      { at: 'nat-gateway', symptom: 'Timeouts with no error: the route table has no 0.0.0.0/0 entry, or the NAT gateway was deleted and the route is now a blackhole.' },
      { at: 'vpc', symptom: 'A single shared NAT gateway means an AZ failure kills egress for every other AZ, and every packet crossing an AZ is billed twice.' },
    ],
  },
  {
    id: 'private-aws',
    title: 'Reaching S3 without the internet',
    question: 'Your NAT bill is enormous and most of the traffic is S3. What changes?',
    path: ['ec2-auto-scaling', 'privatelink', 's3'],
    steps: [
      'The instance calls the S3 API as normal — no application change is needed for any of this.',
      'A gateway VPC endpoint intercepts the traffic via a route-table entry. It never leaves the AWS network, and gateway endpoints are free.',
      'S3 serves the request. The per-gigabyte NAT processing charge disappears entirely, and an endpoint policy can prove data never left the private network.',
    ],
    failures: [
      { at: 'privatelink', symptom: 'Still going through NAT: gateway endpoints only serve S3 and DynamoDB. Everything else needs an interface endpoint, which is charged per AZ per hour.' },
    ],
  },
  {
    id: 'async',
    title: 'Work that should not block',
    question: 'An upload triggers thirty seconds of processing. How do you stop the user waiting?',
    path: ['api-gateway', 'sqs', 'lambda', 'dynamodb', 's3'],
    steps: [
      'API Gateway accepts the request and returns immediately. Its 29-second integration timeout is itself a reason to make this asynchronous.',
      'The job goes onto a queue. The queue is what absorbs a spike: ten thousand uploads become ten thousand messages, not ten thousand concurrent database connections.',
      'Lambda polls the queue in batches. Set the visibility timeout longer than the processing time, or the same message will be handed to a second consumer.',
      'State is written to DynamoDB. Conditional writes make the handler idempotent, which matters because standard queues deliver at least once.',
      'The output lands in S3. From there a lifecycle rule can tier it to cheaper storage without anyone remembering to.',
    ],
    failures: [
      { at: 'sqs', symptom: 'Every job processed twice — the visibility timeout is shorter than the processing time. This is the single most-tested SQS failure.' },
      { at: 'lambda', symptom: 'A poison message retried forever, blocking the queue. It needs a dead-letter queue with a maxReceiveCount.' },
      { at: 'dynamodb', symptom: 'ProvisionedThroughputExceededException — either a hot partition key, or provisioned capacity that should be on-demand.' },
    ],
  },
  {
    id: 'identity',
    title: 'Who is allowed to do this?',
    question: 'Your code calls S3 and gets AccessDenied. Walk the decision.',
    path: ['iam', 's3', 'kms', 'cloudtrail'],
    steps: [
      'IAM evaluates the call. An explicit Deny anywhere wins immediately; then any SCP or permissions boundary must permit it; then something must actually allow it; otherwise it is denied by default.',
      'The bucket policy is evaluated too. Same-account needs one Allow; cross-account needs both the identity policy and the resource policy to agree.',
      'If the object is encrypted with a customer-managed key, the KMS key policy must also permit the caller. This is the usual cause of "full S3 permissions but still denied".',
      'Whatever the outcome, CloudTrail recorded the call. For object-level reads you must have enabled data events first — they are off by default.',
    ],
    failures: [
      { at: 'iam', symptom: 'An explicit Deny in a policy you forgot about, or an SCP that never permitted the action. No amount of extra Allow fixes either.' },
      { at: 'kms', symptom: 'AccessDenied that survives granting s3:* — the key policy is authoritative and no IAM policy can override it.' },
      { at: 'cloudtrail', symptom: 'No record of the access at all, because S3 data events were never turned on.' },
    ],
  },
  {
    id: 'failure',
    title: 'An Availability Zone disappears',
    question: 'One AZ goes dark. What keeps serving, and what quietly does not?',
    path: ['route53', 'elb', 'ec2-auto-scaling', 'aurora', 's3'],
    steps: [
      'Route 53 is global and unaffected. Within a Region it changes nothing, which is why AZ resilience is not a DNS problem.',
      'The load balancer stops sending traffic to the failed AZ within a health-check interval or two, provided you attached subnets in more than one AZ.',
      'The Auto Scaling group launches replacements in the surviving AZs — if its subnet list includes them. One subnet means a single-AZ fleet, however many instances it holds.',
      'Aurora promotes a replica in another AZ, typically in under thirty seconds. RDS Multi-AZ takes a minute or two. Single-AZ RDS is simply down.',
      'S3 is already replicated across at least three AZs. EBS is not — it lives in one AZ, and this is where "shared storage must survive an AZ" becomes EFS.',
    ],
    failures: [
      { at: 'ec2-auto-scaling', symptom: 'No replacement capacity, because the ASG only had subnets in the failed AZ.' },
      { at: 'nat-gateway', symptom: 'Surviving AZs lose internet egress, because they all routed through one NAT gateway in the dead AZ.' },
      { at: 'ebs', symptom: 'Volumes are unreachable and cannot be attached elsewhere — EBS never crosses an AZ boundary.' },
    ],
  },
  {
    id: 'money',
    title: 'Where the money actually goes',
    question: 'The bill doubled and nothing was deployed. Where do you look?',
    path: ['nat-gateway', 'elb', 'ebs', 'cloudwatch', 'cost-explorer'],
    steps: [
      'NAT gateways: about $32 a month each just for existing, plus per gigabyte. Three AZs means three of them, and S3 traffic through them is pure waste.',
      'Load balancers charge by the hour whether or not a request arrives. A forgotten one from a lab costs about $16 a month.',
      'Orphaned EBS volumes and snapshots survive instance termination and keep billing. So do unattached Elastic IPs.',
      'CloudWatch Logs default to never expiring. A chatty application quietly builds a large storage bill nobody notices.',
      'Cost Explorer shows the shape; the Cost and Usage Report gives the line items. Budgets is what tells you *before* it happens.',
    ],
    failures: [
      { at: 'nat-gateway', symptom: 'The most common surprise charge in a learning account, at roughly $1.10 a day, doing nothing.' },
      { at: 'cloudwatch', symptom: 'Log storage growing without limit because no retention period was ever set on the log group.' },
    ],
  },
]
