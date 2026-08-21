import type { Phase } from './schema'

/**
 * Doc-path prefixes. Every URL below has been checked to resolve; a reading list
 * that 404s is worse than no reading list, because it costs the trust that makes
 * the learner follow the next one.
 */
const D = 'https://docs.aws.amazon.com'
const IAM = `${D}/IAM/latest/UserGuide`
const VPC = `${D}/vpc/latest/userguide`
const EC2 = `${D}/AWSEC2/latest/UserGuide`
const S3 = `${D}/AmazonS3/latest/userguide`
const RDS = `${D}/AmazonRDS/latest`
const DDB = `${D}/amazondynamodb/latest/developerguide`
const ELB = `${D}/elasticloadbalancing/latest`
const ASG = `${D}/autoscaling/ec2/userguide`
const SQS = `${D}/AWSSimpleQueueService/latest/SQSDeveloperGuide`
const LAM = `${D}/lambda/latest/dg`
const APIGW = `${D}/apigateway/latest/developerguide`
const COG = `${D}/cognito/latest/developerguide`
const CW = `${D}/AmazonCloudWatch/latest/monitoring`
const R53 = `${D}/Route53/latest/DeveloperGuide`
const WA = `${D}/wellarchitected/latest`

/**
 * The learning path. Weeks and hours assume ~6 hours per week, which is what
 * the plan generator scales from — if you tell it 10 hours a week, the same
 * phases compress rather than change shape.
 *
 * The order is deliberate: SAA before DVA, because SAA teaches the
 * architectural vocabulary (Multi-AZ, decoupling, DR patterns, the shared
 * responsibility line) that DVA assumes you already have.
 *
 * `steps` is the part a learner actually follows. A phase on its own only says
 * what a stretch of weeks is about, which leaves someone staring at sixteen
 * services with no first move — so every phase carries an ordered list of
 * sittings, each with what to read, where to do the work, and the retrieval test
 * that closes it. The step minutes deliberately total less than `hours`: the
 * remainder is unstructured building and drilling, and pretending otherwise
 * would be a padded plan rather than an honest one.
 */
export const phases: Phase[] = [
  {
    id: 'phase-0',
    index: 0,
    title: 'Foundations',
    purpose:
      'The four things every VPC and security question reduces to: CIDR arithmetic, DNS resolution, the IAM evaluation model, and a safely configured account. Skip these and everything after is a list of terms.',
    weekFrom: 1,
    weekTo: 2,
    hours: 12,
    families: ['saa', 'dva'],
    exitCriteria: [
      'You can subnet a /16 into /24s and say how many usable addresses each has, without a calculator',
      'You can trace a DNS query from browser to origin and name what each step returns',
      'You can state the IAM evaluation order and predict the outcome of a deny/allow conflict',
      'Root MFA is on, an admin identity exists, and a $10 budget alarm is configured',
    ],
    taskIds: ['saa-1.1', 'saa-1.2'],
    lessonIds: [],
    labIds: ['iam-puzzle'],
    steps: [
      {
        id: 'phase-0-s1',
        title: 'How AWS is laid out',
        why: 'Half of the wrong answers in a scenario question are wrong because they put something in the wrong place. Get the geography first and those options disqualify themselves.',
        kind: 'read',
        minutes: 45,
        serviceSlugs: ['global-infrastructure', 'well-architected-tool'],
        reading: [
          {
            label: 'Regions, Availability Zones and Local Zones',
            url: `${EC2}/using-regions-availability-zones.html`,
            minutes: 15,
          },
          {
            label: 'Shared responsibility model',
            url: 'https://aws.amazon.com/compliance/shared-responsibility-model/',
            minutes: 10,
          },
          {
            label: 'Well-Architected Framework — the six pillars',
            url: `${WA}/framework/welcome.html`,
            minutes: 15,
          },
        ],
        actions: [{ label: 'Big Picture', href: '/big-picture' }],
        doneWhen:
          'You can say what a Region, an AZ and an edge location each are, and which of the three you are choosing when you deploy something.',
      },
      {
        id: 'phase-0-s2',
        title: 'Make the account safe to use',
        why: 'Do this before anything else costs money. An unsecured root account and no budget alarm is the one mistake in this whole plan that can hurt you outside the exam.',
        kind: 'build',
        minutes: 45,
        serviceSlugs: ['iam', 'iam-identity-center', 'budgets'],
        reading: [
          {
            label: 'Root user — and why you stop using it today',
            url: `${IAM}/id_root-user.html`,
            minutes: 10,
          },
          { label: 'IAM security best practices', url: `${IAM}/best-practices.html`, minutes: 15 },
          {
            label: 'Create a budget',
            url: `${D}/cost-management/latest/userguide/budgets-create.html`,
            minutes: 10,
          },
        ],
        actions: [],
        doneWhen:
          'Root has MFA, you are signed in as a non-root admin identity, and a $10 budget alarm has actually emailed you.',
      },
      {
        id: 'phase-0-s3',
        title: 'CIDR arithmetic until it is boring',
        why: 'Every VPC question is subnetting in costume. This is the single highest-leverage hour in the whole plan, because it turns arithmetic you would otherwise guess at into something you read off the page.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['vpc'],
        reading: [
          { label: 'What is Amazon VPC', url: `${VPC}/what-is-amazon-vpc.html`, minutes: 15 },
          { label: 'Subnet CIDR blocks and sizing', url: `${VPC}/subnet-sizing.html`, minutes: 20 },
          { label: 'Route tables', url: `${VPC}/VPC_Route_Tables.html`, minutes: 20 },
        ],
        actions: [{ label: 'VPC Packet Tracer', href: '/labs/vpc-builder' }],
        doneWhen:
          'On paper, you can split 10.0.0.0/16 into /24s, say how many usable addresses each holds and name the five AWS reserves — no calculator.',
      },
      {
        id: 'phase-0-s4',
        title: 'The two filters, and which one is stateful',
        why: 'Security group versus NACL is asked on both exams, and it is asked as a symptom: "traffic goes out but nothing comes back". You want the table in your head, not a vague sense of it.',
        kind: 'read',
        minutes: 45,
        serviceSlugs: ['security-group', 'nacl'],
        reading: [
          { label: 'Security groups', url: `${VPC}/vpc-security-groups.html`, minutes: 15 },
          {
            label: 'Network ACLs — note the ephemeral port range',
            url: `${VPC}/vpc-network-acls.html`,
            minutes: 15,
          },
        ],
        actions: [{ label: 'VPC Packet Tracer', href: '/labs/vpc-builder' }],
        doneWhen:
          'From memory you can write the security group versus NACL table, and predict the exact symptom when a NACL allows inbound 443 but not the ephemeral return range.',
      },
      {
        id: 'phase-0-s5',
        title: 'DNS from browser to origin',
        why: 'Route 53 routing policies are free marks once you can see the query path. They are guesswork until then.',
        kind: 'read',
        minutes: 60,
        serviceSlugs: ['route53', 'cloudfront'],
        reading: [
          {
            label: 'How DNS resolution works',
            url: `${R53}/welcome-dns-service.html`,
            minutes: 20,
          },
          { label: 'Routing policies — all seven', url: `${R53}/routing-policy.html`, minutes: 25 },
        ],
        actions: [{ label: 'Big Picture', href: '/big-picture' }],
        doneWhen:
          'You can trace a query for app.example.com through resolver, root, TLD and authoritative server, saying what each returns — and name which routing policy answers "lowest latency" versus "fail over".',
      },
      {
        id: 'phase-0-s6',
        title: 'How IAM actually decides',
        why: 'The evaluation order is a mechanical rule, and questions are built to catch people who half-remember it. Learn it as an algorithm and the deny/allow conflict questions become free.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['iam', 'sts', 'organizations'],
        reading: [
          {
            label: 'Policy evaluation logic — read this one twice',
            url: `${IAM}/reference_policies_evaluation-logic.html`,
            minutes: 30,
          },
          {
            label: 'Policy types and where each attaches',
            url: `${IAM}/access_policies.html`,
            minutes: 20,
          },
          {
            label: 'Roles, trust policies and assume-role',
            url: `${IAM}/id_roles_terms-and-concepts.html`,
            minutes: 15,
          },
          {
            label: 'Service control policies',
            url: `${D}/organizations/latest/userguide/orgs_manage_policies_scps.html`,
            minutes: 15,
          },
        ],
        actions: [{ label: 'IAM Policy Puzzle', href: '/labs/iam-puzzle' }],
        doneWhen:
          'You can state the evaluation order out loud, and predict the outcome when an SCP denies what an identity policy allows — and say why an SCP can never grant.',
      },
      {
        id: 'phase-0-s7',
        title: 'Build the network, then read the trace',
        why: 'Reading the two labs is not the point; being wrong in them is. Both give you a live trace, so a wrong guess tells you which rule you had backwards.',
        kind: 'build',
        minutes: 120,
        serviceSlugs: ['vpc', 'nat-gateway', 'security-group', 'nacl'],
        reading: [{ label: 'NAT gateways', url: `${VPC}/vpc-nat-gateway.html`, minutes: 15 }],
        actions: [
          { label: 'VPC Packet Tracer', href: '/labs/vpc-builder' },
          { label: 'IAM Policy Puzzle', href: '/labs/iam-puzzle' },
        ],
        doneWhen:
          'A packet reaches the internet from a private subnet in the tracer, and you have worked all twelve IAM scenarios with the trace matching your prediction before you reveal it.',
      },
      {
        id: 'phase-0-s8',
        title: 'Break it on purpose',
        why: 'Exam questions ask "this is broken, why?" far more often than "what is this?". The only way to recognise a symptom is to have caused it.',
        kind: 'break',
        minutes: 60,
        serviceSlugs: ['vpc', 'nat-gateway'],
        reading: [],
        actions: [{ label: 'Break-it challenges', href: '/labs/vpc-builder' }],
        doneWhen:
          'You can remove a route, a NAT gateway and a NACL rule in turn and predict the failure symptom before running the trace.',
      },
      {
        id: 'phase-0-s9',
        title: 'Close the phase from memory',
        why: 'Writing it out cold is the only honest test of whether it stuck. Anything you cannot produce here you have recognised, not learned.',
        kind: 'recall',
        minutes: 60,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'Recall Drill', href: '/drill' },
          { label: 'Keyword Decoder', href: '/decoder' },
        ],
        doneWhen:
          'On a blank page: the CIDR table, security group versus NACL, the IAM evaluation order and the DNS chain. All four, no notes.',
      },
      {
        id: 'phase-0-s10',
        title: 'Checkpoint quiz on 1.1 and 1.2',
        why: 'A short quiz with immediate feedback tells you whether the phase is done. If you are under 70% here, the phase is not finished, whatever the checkboxes say.',
        kind: 'quiz',
        minutes: 45,
        serviceSlugs: [],
        reading: [],
        actions: [{ label: 'Quick Quiz', href: '/quiz' }],
        doneWhen:
          'You score 70% or better on a domain 1 quiz, and can say why each wrong option is wrong rather than only why the right one is right.',
      },
    ],
  },
  {
    id: 'phase-1',
    index: 1,
    title: 'Core Services',
    purpose:
      'The ~15 services that carry most of both exams, in dependency order: identity, network, compute, storage, database, load balancing, then decoupling. Breadth is a trap here — depth on these fifteen beats familiarity with fifty.',
    weekFrom: 3,
    weekTo: 12,
    hours: 60,
    families: ['saa'],
    exitCriteria: [
      'You can reproduce every decision rule (which database, which storage, which compute) from memory',
      'You have built IAM, VPC, EC2, S3, RDS and an ALB at least once each',
      'You can explain stateful versus stateless filtering without looking it up',
    ],
    taskIds: [
      'saa-1.1',
      'saa-1.2',
      'saa-1.3',
      'saa-2.1',
      'saa-2.2',
      'saa-3.1',
      'saa-3.2',
      'saa-3.3',
      'saa-3.4',
    ],
    lessonIds: [],
    labIds: ['vpc-builder', 'iam-puzzle', 'storage-cost'],
    steps: [
      {
        id: 'phase-1-s1',
        title: 'IAM beyond the basics',
        why: 'Identity is the one topic that appears inside questions about every other service. Roles and STS are what make the rest of the plan legible.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['iam', 'sts', 'iam-identity-center', 'organizations'],
        reading: [
          {
            label: 'Roles, trust policies, assume-role',
            url: `${IAM}/id_roles_terms-and-concepts.html`,
            minutes: 25,
          },
          {
            label: 'Policy types — identity, resource, boundary, SCP',
            url: `${IAM}/access_policies.html`,
            minutes: 25,
          },
          {
            label: 'Service control policies',
            url: `${D}/organizations/latest/userguide/orgs_manage_policies_scps.html`,
            minutes: 15,
          },
        ],
        actions: [{ label: 'IAM Policy Puzzle', href: '/labs/iam-puzzle' }],
        doneWhen:
          'You can explain why cross-account access needs a trust policy on both ends, and name the four policy types in evaluation order.',
      },
      {
        id: 'phase-1-s2',
        title: 'Build a VPC by hand, in the console',
        why: 'Clicking it once is worth three readings, because the console forces you to supply every value the docs gloss over.',
        kind: 'build',
        minutes: 120,
        serviceSlugs: ['vpc', 'nat-gateway', 'security-group', 'nacl'],
        reading: [
          { label: 'Route tables', url: `${VPC}/VPC_Route_Tables.html`, minutes: 20 },
          { label: 'NAT gateways', url: `${VPC}/vpc-nat-gateway.html`, minutes: 20 },
        ],
        actions: [{ label: 'VPC Packet Tracer', href: '/labs/vpc-builder' }],
        doneWhen:
          'Two public and two private subnets across two AZs, one NAT gateway, and an instance in a private subnet that can reach the internet but cannot be reached from it. Then delete the NAT gateway.',
      },
      {
        id: 'phase-1-s3',
        title: 'Private access without the internet',
        why: 'Gateway endpoint versus interface endpoint versus NAT is a recurring cost-and-security question, and the answer turns on one fact: which of the three costs nothing.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['privatelink', 'nat-gateway', 's3'],
        reading: [
          {
            label: 'VPC endpoints and PrivateLink',
            url: `${D}/vpc/latest/privatelink/privatelink-access-aws-services.html`,
            minutes: 30,
          },
        ],
        actions: [{ label: 'Which storage?', href: '/compare' }],
        doneWhen:
          'You can say which two services get gateway endpoints, what everything else gets, and which option removes the NAT gateway bill.',
      },
      {
        id: 'phase-1-s4',
        title: 'Joining networks together',
        why: 'Four options that all "connect two networks", separated by scale, transitivity and whether the link crosses the public internet. Questions test exactly those three axes.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['vpc-peering', 'transit-gateway', 'site-to-site-vpn', 'direct-connect'],
        reading: [
          {
            label: 'VPC peering — and why it is not transitive',
            url: `${D}/vpc/latest/peering/what-is-vpc-peering.html`,
            minutes: 20,
          },
          {
            label: 'Transit Gateway',
            url: `${D}/vpc/latest/tgw/what-is-transit-gateway.html`,
            minutes: 20,
          },
        ],
        actions: [],
        doneWhen:
          'You can pick between peering, Transit Gateway, VPN and Direct Connect from a stated number of VPCs, a bandwidth figure and a "must not traverse the internet" constraint.',
      },
      {
        id: 'phase-1-s5',
        title: 'EC2: families, sizing and how you pay',
        why: 'Purchasing options are the most reliably examined cost topic on SAA, and they are pure recall — no reasoning required if you know them.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['ec2', 'spot', 'savings-plans', 'instance-store'],
        reading: [
          { label: 'Instance types and families', url: `${EC2}/instance-types.html`, minutes: 25 },
          {
            label: 'Purchasing options — On-Demand, RI, Savings Plans, Spot',
            url: `${EC2}/instance-purchasing-options.html`,
            minutes: 30,
          },
        ],
        actions: [{ label: 'Which compute?', href: '/compare' }],
        doneWhen:
          'Given a workload description you can name the purchasing option and justify it in one sentence, including when Spot is disqualified.',
      },
      {
        id: 'phase-1-s6',
        title: 'Block, file and object — and never mix them up',
        why: 'The storage decision is asked constantly, and almost every wrong answer is a storage type mismatch rather than a wrong product.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['ebs', 'instance-store', 'efs', 'fsx', 's3'],
        reading: [
          {
            label: 'EBS volume types — memorise the IOPS ceilings',
            url: `${D}/ebs/latest/userguide/ebs-volume-types.html`,
            minutes: 30,
          },
          {
            label: 'EFS performance and throughput modes',
            url: `${D}/efs/latest/ug/performance.html`,
            minutes: 25,
          },
        ],
        actions: [{ label: 'Which storage?', href: '/compare' }],
        doneWhen:
          'You can state which of the four survives an instance stop, which can be mounted by many instances at once, and which is not a filesystem at all.',
      },
      {
        id: 'phase-1-s7',
        title: 'S3 properly, not just "object storage"',
        why: 'S3 carries more marks than any other single service, and most of them are in the details: storage classes, lifecycle, encryption and who can make a bucket public.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['s3', 's3-glacier', 'kms'],
        reading: [
          {
            label: 'Storage classes and retrieval times',
            url: `${S3}/storage-class-intro.html`,
            minutes: 25,
          },
          {
            label: 'Lifecycle configuration',
            url: `${S3}/object-lifecycle-mgmt.html`,
            minutes: 20,
          },
          { label: 'Replication — CRR and SRR', url: `${S3}/replication.html`, minutes: 20 },
          {
            label: 'Block Public Access',
            url: `${S3}/access-control-block-public-access.html`,
            minutes: 15,
          },
        ],
        actions: [{ label: 'Storage & Teardown Cost Lab', href: '/labs/storage-cost' }],
        doneWhen:
          'You can order the storage classes by cost and by retrieval time, and say which minimum-duration charge catches a lifecycle rule that transitions too early.',
      },
      {
        id: 'phase-1-s8',
        title: 'What idle infrastructure actually costs',
        why: 'The cost lab is the fastest way to internalise which resources bill while you are asleep. It is also what stops a study account becoming a surprise.',
        kind: 'build',
        minutes: 90,
        serviceSlugs: ['s3', 'ebs', 'nat-gateway', 'elb'],
        reading: [],
        actions: [{ label: 'Storage & Teardown Cost Lab', href: '/labs/storage-cost' }],
        doneWhen:
          'You can name, from memory, the five things in a study account that charge you for existing rather than for being used.',
      },
      {
        id: 'phase-1-s9',
        title: 'RDS: Multi-AZ is not a read replica',
        why: 'This distinction is examined on nearly every paper, usually by offering both as options to a question about either availability or read scaling.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['rds', 'aurora', 'aurora-serverless', 'rds-proxy'],
        reading: [
          {
            label: 'Multi-AZ deployments',
            url: `${RDS}/UserGuide/Concepts.MultiAZ.html`,
            minutes: 25,
          },
          { label: 'Read replicas', url: `${RDS}/UserGuide/USER_ReadRepl.html`, minutes: 25 },
          {
            label: 'Aurora overview',
            url: `${RDS}/AuroraUserGuide/Aurora.Overview.html`,
            minutes: 25,
          },
          {
            label: 'RDS Proxy — and what problem it solves',
            url: `${RDS}/UserGuide/rds-proxy.html`,
            minutes: 15,
          },
        ],
        actions: [{ label: 'Which database?', href: '/compare' }],
        doneWhen:
          'You can say what Multi-AZ does for availability, what it does not do for reads, and which of the two is synchronous.',
      },
      {
        id: 'phase-1-s10',
        title: 'DynamoDB, from the access pattern backwards',
        why: 'SAA asks whether DynamoDB is the right choice; DVA asks how to model in it. This step earns marks on both, so it is worth more than its slot suggests.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['dynamodb'],
        reading: [
          {
            label: 'Core components — tables, items, keys',
            url: `${DDB}/HowItWorks.CoreComponents.html`,
            minutes: 30,
          },
          {
            label: 'Capacity modes — on-demand versus provisioned',
            url: `${DDB}/HowItWorks.ReadWriteCapacityMode.html`,
            minutes: 25,
          },
        ],
        actions: [{ label: 'Which database?', href: '/compare' }],
        doneWhen:
          'You can explain why a scan is almost always the wrong answer, and choose between on-demand and provisioned from a stated traffic shape.',
      },
      {
        id: 'phase-1-s11',
        title: 'Caching, at every layer',
        why: 'Latency and database-load questions are usually solved by a cache, and the mark turns on choosing the right layer — edge, application or database.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['elasticache', 'cloudfront', 'dynamodb'],
        reading: [
          {
            label: 'ElastiCache — Redis versus Memcached',
            url: `${D}/AmazonElastiCache/latest/dg/WhatIs.html`,
            minutes: 25,
          },
          {
            label: 'CloudFront introduction',
            url: `${D}/AmazonCloudFront/latest/DeveloperGuide/Introduction.html`,
            minutes: 25,
          },
        ],
        actions: [{ label: 'Which edge or global service?', href: '/compare' }],
        doneWhen:
          'Given "the database is the bottleneck" you can name three places to cache and say what each one stops reaching the database.',
      },
      {
        id: 'phase-1-s12',
        title: 'Load balancing: which listener, which target',
        why: 'ALB versus NLB versus Global Accelerator is decided by protocol and by whether you need a fixed IP. Two facts, reliably worth marks.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['elb', 'global-accelerator'],
        reading: [
          {
            label: 'Application Load Balancer',
            url: `${ELB}/application/introduction.html`,
            minutes: 30,
          },
          { label: 'Network Load Balancer', url: `${ELB}/network/introduction.html`, minutes: 25 },
          {
            label: 'Global Accelerator',
            url: `${D}/global-accelerator/latest/dg/what-is-global-accelerator.html`,
            minutes: 20,
          },
        ],
        actions: [{ label: 'Which edge or global service?', href: '/compare' }],
        doneWhen:
          'You can route a question to ALB, NLB or Global Accelerator from the protocol alone, and say which one gives you a static IP.',
      },
      {
        id: 'phase-1-s13',
        title: 'Auto Scaling, and what it cannot fix',
        why: 'Scaling policy questions are formulaic once you know the four kinds. The trap is a question where scaling is offered but the bottleneck is the database.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['ec2-auto-scaling', 'auto-scaling', 'cloudwatch'],
        reading: [
          {
            label: 'Scaling your group — the policy types',
            url: `${ASG}/scale-your-group.html`,
            minutes: 25,
          },
          {
            label: 'Target tracking policies',
            url: `${ASG}/as-scaling-target-tracking.html`,
            minutes: 20,
          },
        ],
        actions: [],
        doneWhen:
          'You can name the four scaling policy types and pick the right one from a described traffic pattern, including the predictable-daily-peak case.',
      },
      {
        id: 'phase-1-s14',
        title: 'Decoupling: queue, topic or bus',
        why: 'This is the heart of the "design resilient architectures" domain. The three are not interchangeable and the exam knows it.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['sqs', 'sns', 'eventbridge', 'mq'],
        reading: [
          {
            label: 'SQS visibility timeout — the classic trap',
            url: `${SQS}/sqs-visibility-timeout.html`,
            minutes: 25,
          },
          { label: 'FIFO queues', url: `${SQS}/FIFO-queues.html`, minutes: 20 },
          { label: 'SNS', url: `${D}/sns/latest/dg/welcome.html`, minutes: 20 },
          {
            label: 'EventBridge',
            url: `${D}/eventbridge/latest/userguide/eb-what-is.html`,
            minutes: 20,
          },
        ],
        actions: [{ label: 'How should these components talk?', href: '/compare' }],
        doneWhen:
          'You can say which one gives you fan-out, which gives you ordering, which gives you content-based routing — and what happens to a message when the consumer dies mid-work.',
      },
      {
        id: 'phase-1-s15',
        title: 'Containers and serverless compute',
        why: 'The compute decision tree ends in one of these, and the differentiators are operational (who patches the host) rather than technical.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['ecs', 'fargate', 'eks', 'lambda', 'elastic-beanstalk'],
        reading: [
          {
            label: 'ECS launch types — EC2 versus Fargate',
            url: `${D}/AmazonECS/latest/developerguide/launch_types.html`,
            minutes: 25,
          },
          {
            label: 'Lambda runtime environment',
            url: `${LAM}/lambda-runtime-environment.html`,
            minutes: 25,
          },
        ],
        actions: [{ label: 'Which compute?', href: '/compare' }],
        doneWhen:
          'You can walk the compute tree out loud from "I have a container" and from "I have a 20-minute batch job" and land in the right place both times.',
      },
      {
        id: 'phase-1-s16',
        title: 'Encryption, keys and secrets',
        why: 'Security questions are frequently a KMS question with the word KMS removed. Knowing who holds the key and where it is used decides them.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['kms', 'secrets-manager', 'acm', 'cloudhsm', 'systems-manager'],
        reading: [
          {
            label: 'KMS concepts — CMK, data key, envelope encryption',
            url: `${D}/kms/latest/developerguide/concepts.html`,
            minutes: 30,
          },
          { label: 'S3 encryption with KMS', url: `${S3}/UsingKMSEncryption.html`, minutes: 20 },
          {
            label: 'Rotating secrets',
            url: `${D}/secretsmanager/latest/userguide/rotating-secrets.html`,
            minutes: 15,
          },
        ],
        actions: [],
        doneWhen:
          'You can explain envelope encryption in three sentences, and say when the answer is CloudHSM rather than KMS.',
      },
      {
        id: 'phase-1-s17',
        title: 'Watching it, and paying for it',
        why: 'Two small domains that are cheap to learn and are asked in nearly identical form every time. CloudTrail versus CloudWatch versus Config is the one to get right.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: [
          'cloudwatch',
          'cloudtrail',
          'config',
          'cost-explorer',
          'budgets',
          'trusted-advisor',
        ],
        reading: [
          { label: 'CloudWatch alarms', url: `${CW}/AlarmThatSendsEmail.html`, minutes: 25 },
          {
            label: 'CloudTrail',
            url: `${D}/awscloudtrail/latest/userguide/cloudtrail-user-guide.html`,
            minutes: 20,
          },
        ],
        actions: [],
        doneWhen:
          'One sentence each, from memory: CloudWatch is for ___, CloudTrail is for ___, Config is for ___. Then say which one answers "who deleted it".',
      },
      {
        id: 'phase-1-s18',
        title: 'Migration and hybrid, in one sitting',
        why: 'A small slice of the exam that is almost pure recall. An hour and a half here is better value than another hour on EC2.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['snow-family', 'datasync', 'storage-gateway', 'dms', 'transfer-family'],
        reading: [
          {
            label: 'Storage Gateway',
            url: `${D}/storagegateway/latest/userguide/WhatIsStorageGateway.html`,
            minutes: 25,
          },
          {
            label: 'DataSync',
            url: `${D}/datasync/latest/userguide/what-is-datasync.html`,
            minutes: 20,
          },
          {
            label: 'Transfer Family',
            url: `${D}/transfer/latest/userguide/what-is-aws-transfer-family.html`,
            minutes: 15,
          },
        ],
        actions: [],
        doneWhen:
          'From a data volume and a deadline you can choose between Snowball, DataSync and Direct Connect, and say which Storage Gateway type fits which protocol.',
      },
      {
        id: 'phase-1-s19',
        title: 'Drill the decision rules, not the services',
        why: 'The exam gives you a requirement and expects the answer. Walking the trees rehearses the path, which is the thing actually being tested.',
        kind: 'drill',
        minutes: 90,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'Decision trees', href: '/compare' },
          { label: 'Keyword Decoder', href: '/decoder' },
        ],
        doneWhen:
          'You can walk every decision tree to a leaf without backtracking, and clear a decoder round without hesitating on a phrase.',
      },
      {
        id: 'phase-1-s20',
        title: 'Write the comparison tables from memory',
        why: 'Producing a table cold is the only test that distinguishes learned from familiar. It is uncomfortable, which is the point.',
        kind: 'recall',
        minutes: 120,
        serviceSlugs: [],
        reading: [],
        actions: [{ label: 'Recall Drill', href: '/drill' }],
        doneWhen:
          'Blank page, no notes: EBS volume types, S3 storage classes, Multi-AZ versus read replica, SQS versus SNS versus EventBridge, ALB versus NLB. Five tables.',
      },
      {
        id: 'phase-1-s21',
        title: 'Checkpoint: a quiz per domain',
        why: 'Four short quizzes tell you which domain to spend the build phase on. A single long paper tells you less and costs more time.',
        kind: 'quiz',
        minutes: 120,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'Quick Quiz', href: '/quiz' },
          { label: 'Progress', href: '/progress' },
        ],
        doneWhen:
          'You have taken one quiz in each of the four domains and written down which domain came out weakest — that is what phase 2 targets.',
      },
    ],
  },
  {
    id: 'phase-2',
    index: 2,
    title: 'Build & Break',
    purpose:
      'Reading produces recognition; building produces recall — and the exam tests recall under time pressure with four plausible answers. Breaking things deliberately is the highest-value step, because most questions are "this is broken, why?" rather than "what is this?".',
    weekFrom: 13,
    weekTo: 16,
    hours: 28,
    families: ['saa'],
    exitCriteria: [
      "You have built and torn down every lab, and passed each one's break-it challenge",
      'You can predict the exact failure symptom from a missing route, a missing permission, or a too-short visibility timeout',
      'You can rebuild a three-tier VPC from an empty canvas without hints',
    ],
    taskIds: ['saa-1.2', 'saa-2.1', 'saa-2.2', 'saa-3.4', 'saa-4.4'],
    lessonIds: [],
    labIds: ['vpc-builder', 'request-racer', 'az-drill', 'storage-cost', 'iam-puzzle'],
    steps: [
      {
        id: 'phase-2-s1',
        title: 'Rebuild the three-tier VPC from nothing',
        why: 'Second time round, without the guide. Whatever you have to look up is the thing you had only recognised.',
        kind: 'build',
        minutes: 120,
        serviceSlugs: ['vpc', 'nat-gateway', 'elb', 'ec2-auto-scaling'],
        reading: [],
        actions: [{ label: 'VPC Packet Tracer', href: '/labs/vpc-builder' }],
        doneWhen:
          'Public and private subnets across two AZs, a load balancer in front, instances behind, and a working path out — built without consulting notes.',
      },
      {
        id: 'phase-2-s2',
        title: 'Break the routing',
        why: 'A missing route and a missing NAT gateway produce different symptoms. Questions describe the symptom and expect you to name the cause.',
        kind: 'break',
        minutes: 90,
        serviceSlugs: ['vpc', 'nat-gateway'],
        reading: [{ label: 'Route tables', url: `${VPC}/VPC_Route_Tables.html`, minutes: 15 }],
        actions: [{ label: 'Break-it challenges', href: '/labs/vpc-builder' }],
        doneWhen:
          'You have solved every routing break-it challenge, and predicted the symptom correctly before running the trace each time.',
      },
      {
        id: 'phase-2-s3',
        title: 'Break the permissions',
        why: 'Access-denied questions all look the same and have four different causes. The trace shows you which one you are looking at.',
        kind: 'break',
        minutes: 90,
        serviceSlugs: ['iam', 'sts', 'organizations', 's3'],
        reading: [
          {
            label: 'Policy evaluation logic',
            url: `${IAM}/reference_policies_evaluation-logic.html`,
            minutes: 20,
          },
        ],
        actions: [{ label: 'IAM Policy Puzzle', href: '/labs/iam-puzzle' }],
        doneWhen:
          'Given an access-denied scenario you can name which of the four layers denied it — identity policy, resource policy, permission boundary or SCP — before looking.',
      },
      {
        id: 'phase-2-s4',
        title: 'Break the queue',
        why: 'A too-short visibility timeout is one of the most-asked failure modes on both exams, and it is invisible until you have watched it duplicate work.',
        kind: 'break',
        minutes: 90,
        serviceSlugs: ['sqs', 'sns', 'lambda'],
        reading: [
          { label: 'Visibility timeout', url: `${SQS}/sqs-visibility-timeout.html`, minutes: 20 },
          { label: 'FIFO queues and deduplication', url: `${SQS}/FIFO-queues.html`, minutes: 20 },
        ],
        actions: [],
        doneWhen:
          'You can describe what a consumer taking longer than the visibility timeout does to the queue, and name the two ways to stop it.',
      },
      {
        id: 'phase-2-s5',
        title: 'Lose an Availability Zone',
        why: 'Resilience questions are answered by asking "what still works when this AZ goes away". Rehearse that question until it is reflexive.',
        kind: 'break',
        minutes: 90,
        serviceSlugs: ['ec2-auto-scaling', 'rds', 'elb', 'efs'],
        reading: [
          {
            label: 'Well-Architected reliability pillar',
            url: `${WA}/reliability-pillar/welcome.html`,
            minutes: 30,
          },
        ],
        actions: [],
        doneWhen:
          'For each tier of your design you can say what happens when one AZ disappears, and which single-AZ resource would take the whole thing down.',
      },
      {
        id: 'phase-2-s6',
        title: 'Do it again as a template',
        why: 'Writing the same architecture as CloudFormation forces every implicit choice into the open, and it is DVA material you get for free.',
        kind: 'build',
        minutes: 120,
        serviceSlugs: ['cloudformation', 'cdk', 'sam', 'cli'],
        reading: [
          {
            label: 'CloudFormation',
            url: `${D}/AWSCloudFormation/latest/UserGuide/Welcome.html`,
            minutes: 30,
          },
        ],
        actions: [],
        doneWhen:
          'A template stands up your VPC and tears it down cleanly, and you can name which resources block a stack delete when they are not empty.',
      },
      {
        id: 'phase-2-s7',
        title: 'Recovery objectives, and what they cost',
        why: 'RTO and RPO questions map onto four named strategies. Knowing the four names and their order converts a reasoning question into recall.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['backup', 'rds', 's3', 'route53'],
        reading: [
          {
            label: 'Disaster recovery of workloads on AWS',
            url: `${D}/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-workloads-on-aws.html`,
            minutes: 45,
          },
        ],
        actions: [],
        doneWhen:
          'You can order backup-and-restore, pilot light, warm standby and multi-site by both RTO and cost, and pick one from a stated RPO.',
      },
      {
        id: 'phase-2-s8',
        title: 'Rebuild from an empty canvas, no hints',
        why: 'The exit test for the whole phase. If this is hard, more reading will not help — more building will.',
        kind: 'recall',
        minutes: 90,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'VPC Packet Tracer', href: '/labs/vpc-builder' },
          { label: 'Recall Drill', href: '/drill' },
        ],
        doneWhen:
          'A complete three-tier VPC on a blank canvas, plus the failure symptom for every component you could remove. No notes, no hints.',
      },
    ],
  },
  {
    id: 'phase-3',
    index: 3,
    title: 'SAA Exam Prep',
    purpose:
      'Diagnostic first, then repair the gaps it finds, then drill. Reviewing a practice exam properly — writing why each distractor is wrong, including on questions you got right — is worth more than taking another one.',
    weekFrom: 17,
    weekTo: 21,
    hours: 30,
    families: ['saa'],
    exitCriteria: [
      'You score 80%+ on a full exam you have never seen before',
      'Your mistake log shows no service appearing three or more times',
      'You can articulate why each wrong option is wrong, not only why the right one is right',
    ],
    taskIds: ['saa-4.1', 'saa-4.2', 'saa-4.3', 'saa-4.4', 'saa-3.5'],
    lessonIds: [],
    labIds: [],
    steps: [
      {
        id: 'phase-3-s1',
        title: 'Diagnostic paper, cold',
        why: 'Take it before any revision. A score you are unhappy with is the point — it tells you where the next thirty hours go, which no syllabus can.',
        kind: 'quiz',
        minutes: 150,
        serviceSlugs: [],
        reading: [
          {
            label: 'SAA exam guide and format',
            url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
            minutes: 15,
          },
        ],
        actions: [{ label: 'Exam simulator', href: '/exam' }],
        doneWhen:
          'A full 65-question paper submitted under time, with the domain breakdown written down somewhere you will look at again.',
      },
      {
        id: 'phase-3-s2',
        title: 'Review it properly — including what you got right',
        why: 'This is the highest-value step in the phase and the one everyone skips. Writing why each distractor is wrong is worth more than a second paper.',
        kind: 'recall',
        minutes: 150,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'Review the paper', href: '/exam' },
          { label: 'Progress and mistake log', href: '/progress' },
        ],
        doneWhen:
          'Every question you got wrong has a one-line note in the mistake log, and for every question you guessed correctly you have written why the other three are wrong.',
      },
      {
        id: 'phase-3-s3',
        title: 'Repair the clusters, not the questions',
        why: 'A service appearing three or more times in the mistake log is a conceptual hole. Fixing the hole fixes questions you have not seen yet; re-reading the question does not.',
        kind: 'drill',
        minutes: 150,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'Mistake clusters', href: '/progress' },
          { label: 'Service atlas', href: '/services' },
        ],
        doneWhen:
          'No service appears three or more times in the mistake log, and for each one you cleared you can state the rule you had wrong.',
      },
      {
        id: 'phase-3-s4',
        title: 'The three pillars that carry the marks',
        why: 'Security, reliability and cost optimisation are the framing behind most scenario wording. Reading the pillars makes the exam sound like something you have heard before.',
        kind: 'read',
        minutes: 150,
        serviceSlugs: ['well-architected-tool', 'trusted-advisor'],
        reading: [
          { label: 'Security pillar', url: `${WA}/security-pillar/welcome.html`, minutes: 45 },
          {
            label: 'Reliability pillar',
            url: `${WA}/reliability-pillar/welcome.html`,
            minutes: 45,
          },
          {
            label: 'Cost optimisation pillar',
            url: `${WA}/cost-optimization-pillar/welcome.html`,
            minutes: 45,
          },
        ],
        actions: [],
        doneWhen:
          'You can name the design principles of each pillar and recognise, in a question stem, which pillar it is testing.',
      },
      {
        id: 'phase-3-s5',
        title: 'Decoder to reflex',
        why: 'Recognising the costume eliminates two options before you have finished reading the stem. On a 130-minute paper that is the difference between finishing and rushing.',
        kind: 'drill',
        minutes: 90,
        serviceSlugs: [],
        reading: [],
        actions: [{ label: 'Keyword Decoder', href: '/decoder' }],
        doneWhen:
          'You can clear a full decoder round without pausing, and translate any trigger phrase into what it is really asking for.',
      },
      {
        id: 'phase-3-s6',
        title: 'Trees under time pressure',
        why: 'Knowing the rule and reaching it in forty seconds are different skills. The paper tests the second one.',
        kind: 'drill',
        minutes: 90,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'Decision trees', href: '/compare' },
          { label: 'Recall Drill', href: '/drill' },
        ],
        doneWhen:
          'Every decision tree walked to a leaf in under a minute, and the recall queue cleared with no card rated hard twice in a row.',
      },
      {
        id: 'phase-3-s7',
        title: 'Second paper, on unseen questions',
        why: 'The first paper measured where you started. This one measures whether the repair worked. Anything under 80% means another repair round, not another paper.',
        kind: 'quiz',
        minutes: 150,
        serviceSlugs: [],
        reading: [],
        actions: [{ label: 'Exam simulator', href: '/exam' }],
        doneWhen:
          'You score 80% or better on a paper you have never seen, and the domain breakdown has no domain under 70%.',
      },
      {
        id: 'phase-3-s8',
        title: 'Taper',
        why: 'No new material in the last week. Cramming into the final days is how people arrive with a full head and no retrieval speed.',
        kind: 'recall',
        minutes: 120,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'Recall Drill', href: '/drill' },
          { label: 'Progress', href: '/progress' },
        ],
        doneWhen:
          'The mistake log is empty, the recall queue is clear, and you have stopped adding topics. Sleep matters more than one more service.',
      },
    ],
  },
  {
    id: 'phase-4',
    index: 4,
    title: 'DVA Delta & Prep',
    purpose:
      'About 60% of DVA overlaps with what you already know, so this phase is the delta: Lambda internals, API Gateway specifics, DynamoDB data modelling, Cognito, CI/CD and observability. Take it within four to six weeks of SAA, while the overlap is still fresh.',
    weekFrom: 22,
    weekTo: 29,
    hours: 48,
    families: ['dva'],
    exitCriteria: [
      'You can design DynamoDB keys and indexes for a stated access pattern, and say why a scan would be wrong',
      'You can name every Lambda configuration knob and what it changes',
      'You have built a pipeline that deploys with a canary and rolls back on an alarm',
      'You score 80%+ on a full DVA exam you have never seen before',
    ],
    taskIds: [
      'dva-1.1',
      'dva-1.2',
      'dva-1.3',
      'dva-2.1',
      'dva-2.2',
      'dva-2.3',
      'dva-3.1',
      'dva-3.2',
      'dva-3.3',
      'dva-3.4',
      'dva-4.1',
      'dva-4.2',
      'dva-4.3',
    ],
    lessonIds: [],
    labIds: ['ddb-keys', 'event-wiring'],
    steps: [
      {
        id: 'phase-4-s1',
        title: 'What DVA asks that SAA did not',
        why: 'Roughly 60% of this exam you already know. Spending an hour marking the boundary stops you re-reading the overlap for eight weeks.',
        kind: 'read',
        minutes: 60,
        serviceSlugs: ['lambda', 'api-gateway', 'dynamodb', 'cognito', 'sam'],
        reading: [
          {
            label: 'DVA exam guide and format',
            url: 'https://aws.amazon.com/certification/certified-developer-associate/',
            minutes: 20,
          },
        ],
        actions: [{ label: 'Roadmap task statements', href: '/map' }],
        doneWhen:
          'You have gone through the four DVA domains and marked each task statement as "SAA already covered this" or "new". The new ones are your plan.',
      },
      {
        id: 'phase-4-s2',
        title: 'Lambda internals',
        why: 'DVA asks about the configuration knobs, not the concept. Memory, timeout, concurrency and the execution environment lifecycle are all directly examined.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['lambda'],
        reading: [
          {
            label: 'Execution environment lifecycle',
            url: `${LAM}/lambda-runtime-environment.html`,
            minutes: 25,
          },
          {
            label: 'Common configuration — memory, timeout, ephemeral storage',
            url: `${LAM}/configuration-function-common.html`,
            minutes: 25,
          },
          {
            label: 'Concurrency — reserved versus provisioned',
            url: `${LAM}/lambda-concurrency.html`,
            minutes: 30,
          },
          { label: 'Environment variables', url: `${LAM}/configuration-envvars.html`, minutes: 15 },
        ],
        actions: [],
        doneWhen:
          'You can name every Lambda configuration knob and say what raising it changes — including which one also raises CPU.',
      },
      {
        id: 'phase-4-s3',
        title: 'Event sources, batching and what happens when it fails',
        why: 'Sync versus async versus poll-based changes retry behaviour, error destination and where a failed event ends up. That difference is the question.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['lambda', 'sqs', 'sns', 'eventbridge', 'kinesis-data-streams'],
        reading: [
          {
            label: 'Event source mappings',
            url: `${LAM}/invocation-eventsourcemapping.html`,
            minutes: 30,
          },
          {
            label: 'Asynchronous invocation and DLQs',
            url: `${LAM}/invocation-async.html`,
            minutes: 30,
          },
        ],
        actions: [],
        doneWhen:
          'For each of the three invocation models you can say how many times it retries and where the event goes when it never succeeds.',
      },
      {
        id: 'phase-4-s4',
        title: 'Wire an event pipeline and make it idempotent',
        why: 'At-least-once delivery means your handler will see the same message twice. Building the fix once is how you stop guessing at idempotency questions.',
        kind: 'build',
        minutes: 120,
        serviceSlugs: ['lambda', 'sqs', 'dynamodb', 'sam', 'step-functions'],
        reading: [
          {
            label: 'AWS SAM',
            url: `${D}/serverless-application-model/latest/developerguide/what-is-sam.html`,
            minutes: 25,
          },
        ],
        actions: [],
        doneWhen:
          'A queue-triggered function that processes a duplicate message exactly once, with a dead-letter queue you have actually seen a message land in.',
      },
      {
        id: 'phase-4-s5',
        title: 'API Gateway specifics',
        why: 'REST versus HTTP API, the integration types, caching and throttling. Small surface, reliably examined, almost pure recall.',
        kind: 'read',
        minutes: 120,
        serviceSlugs: ['api-gateway', 'appsync', 'lambda'],
        reading: [
          { label: 'HTTP API versus REST API', url: `${APIGW}/http-api-vs-rest.html`, minutes: 30 },
          { label: 'API caching', url: `${APIGW}/apigateway-caching.html`, minutes: 25 },
        ],
        actions: [],
        doneWhen:
          'You can choose between HTTP and REST API from a stated feature requirement, and say which authoriser types each supports.',
      },
      {
        id: 'phase-4-s6',
        title: 'DynamoDB data modelling',
        why: 'The largest single block of new DVA material. Keys and indexes designed backwards from the access pattern is the whole skill.',
        kind: 'read',
        minutes: 150,
        serviceSlugs: ['dynamodb'],
        reading: [
          {
            label: 'NoSQL design — start from the access patterns',
            url: `${DDB}/bp-general-nosql-design.html`,
            minutes: 40,
          },
          {
            label: 'Secondary indexes — LSI versus GSI',
            url: `${DDB}/SecondaryIndexes.html`,
            minutes: 35,
          },
          { label: 'DynamoDB Streams', url: `${DDB}/streamsmain.html`, minutes: 25 },
        ],
        actions: [],
        doneWhen:
          'You can state every difference between an LSI and a GSI, and say which one you cannot add after the table exists.',
      },
      {
        id: 'phase-4-s7',
        title: 'Design keys for a stated access pattern',
        why: 'Reading about single-table design teaches nothing; doing it teaches the partition-key intuition the exam actually probes.',
        kind: 'build',
        minutes: 120,
        serviceSlugs: ['dynamodb'],
        reading: [],
        actions: [{ label: 'Which database?', href: '/compare' }],
        doneWhen:
          'For a written list of five access patterns you have designed the keys and indexes, and can say why a scan would be wrong for each one.',
      },
      {
        id: 'phase-4-s8',
        title: 'Cognito: two pools that do different jobs',
        why: 'User pool versus identity pool is the single most-confused pair on DVA, and the distinction is one sentence long once you have it.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['cognito', 'iam', 'sts'],
        reading: [
          {
            label: 'User pools — authentication',
            url: `${COG}/cognito-user-identity-pools.html`,
            minutes: 30,
          },
          {
            label: 'Identity pools — AWS credentials',
            url: `${COG}/identity-pools.html`,
            minutes: 30,
          },
        ],
        actions: [],
        doneWhen:
          'You can say which pool authenticates a user, which hands out AWS credentials, and in what order a mobile app uses both.',
      },
      {
        id: 'phase-4-s9',
        title: 'Secrets and configuration in code',
        why: 'Where a value lives, whether it rotates, and what it costs. Three services that overlap enough for the exam to make a question out of it.',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['secrets-manager', 'systems-manager', 'appconfig', 'kms'],
        reading: [
          {
            label: 'Rotating secrets',
            url: `${D}/secretsmanager/latest/userguide/rotating-secrets.html`,
            minutes: 25,
          },
          {
            label: 'AppConfig',
            url: `${D}/appconfig/latest/userguide/what-is-appconfig.html`,
            minutes: 20,
          },
          {
            label: 'KMS concepts',
            url: `${D}/kms/latest/developerguide/concepts.html`,
            minutes: 25,
          },
        ],
        actions: [],
        doneWhen:
          'You can choose between Secrets Manager, Parameter Store and AppConfig from a requirement, and say which one rotates for you and what that costs.',
      },
      {
        id: 'phase-4-s10',
        title: 'A pipeline that deploys a canary and rolls back',
        why: 'Deployment configurations are named things with named behaviours. This is the DVA domain that is easiest to earn full marks in.',
        kind: 'build',
        minutes: 150,
        serviceSlugs: ['codepipeline', 'codebuild', 'codedeploy', 'cloudformation', 'sam'],
        reading: [
          {
            label: 'CodeDeploy deployment configurations',
            url: `${D}/codedeploy/latest/userguide/deployment-configurations.html`,
            minutes: 30,
          },
          {
            label: 'CodePipeline',
            url: `${D}/codepipeline/latest/userguide/welcome.html`,
            minutes: 25,
          },
        ],
        actions: [],
        doneWhen:
          'A pipeline that deploys with a canary and rolls back on a CloudWatch alarm, and you can name every deployment configuration and what it shifts when.',
      },
      {
        id: 'phase-4-s11',
        title: 'Observability for developers',
        why: 'X-Ray and structured CloudWatch logging appear in the troubleshooting domain, and both are asked as "how would you find out", not "what is it".',
        kind: 'read',
        minutes: 90,
        serviceSlugs: ['xray', 'cloudwatch'],
        reading: [
          {
            label: 'X-Ray — segments, subsegments, sampling',
            url: `${D}/xray/latest/devguide/aws-xray.html`,
            minutes: 35,
          },
          { label: 'CloudWatch alarms', url: `${CW}/AlarmThatSendsEmail.html`, minutes: 20 },
        ],
        actions: [],
        doneWhen:
          'You can say what X-Ray shows you that a log line cannot, and what permissions a function needs before a trace appears.',
      },
      {
        id: 'phase-4-s12',
        title: 'Diagnostic DVA paper, cold',
        why: 'Same logic as SAA: measure before revising. The overlap means your score here will be higher than it was for SAA, and the gaps will be sharper.',
        kind: 'quiz',
        minutes: 150,
        serviceSlugs: [],
        reading: [],
        actions: [{ label: 'Exam simulator', href: '/exam' }],
        doneWhen: 'A full DVA paper submitted under time, with the domain breakdown recorded.',
      },
      {
        id: 'phase-4-s13',
        title: 'Review and repair',
        why: 'Write why each distractor is wrong, then fix the clusters. It worked for SAA and there is no reason to do it differently here.',
        kind: 'recall',
        minutes: 150,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'Progress and mistake log', href: '/progress' },
          { label: 'Service atlas', href: '/services' },
        ],
        doneWhen:
          'No service appears three or more times in the mistake log, and every wrong answer has a one-line note saying what you had wrong.',
      },
      {
        id: 'phase-4-s14',
        title: 'Second paper, then taper',
        why: 'Under 80% means another repair round rather than another paper. Above it, stop adding topics and protect your retrieval speed.',
        kind: 'quiz',
        minutes: 150,
        serviceSlugs: [],
        reading: [],
        actions: [
          { label: 'Exam simulator', href: '/exam' },
          { label: 'Recall Drill', href: '/drill' },
        ],
        doneWhen:
          'You score 80% or better on an unseen DVA paper, the recall queue is clear, and you have stopped adding new material.',
      },
    ],
  },
]
