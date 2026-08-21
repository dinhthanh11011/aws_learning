import type { Concept } from '../schema'

/**
 * The framing AWS grades answers against. The shared responsibility model and
 * the Well-Architected pillars are not trivia — they are the reason a
 * particular option is "correct but not best", which is this exam's main trap.
 */
export const operationsConcepts: Concept[] = [
  {
    slug: 'shared-responsibility',
    term: 'Shared responsibility model',
    group: 'operations',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner:
      'AWS secures the cloud; you secure what you put in it — and the line moves by service.',
    whatItIs:
      'AWS is responsible for the security of the cloud: hardware, the hypervisor, the physical facilities, and the managed service software itself. You are responsible for security in the cloud: your data, your identity configuration, your network rules, your encryption choices, and — on EC2 — the guest operating system and everything above it. The line moves depending on how managed the service is.',
    keyIdea:
      'The more managed the service, the less falls to you — but data, identity and access configuration are yours in every single case, including on serverless.',
    onTheExam: [
      '"Who patches the operating system" — you on EC2, AWS on RDS, Fargate and Lambda.',
      '"Who patches the database engine" — AWS applies it, you choose the maintenance window and the version.',
      'A question naming a compliance standard is usually asking for AWS Artifact, which is where the audit reports live.',
    ],
    keyNumbers: [
      {
        label: 'AWS responsibility',
        value: 'Hardware, facilities, hypervisor, managed service software, global infrastructure',
      },
      {
        label: 'Your responsibility',
        value:
          'Data, classification, IAM, security group and NACL rules, encryption choices, guest OS on EC2',
      },
      {
        label: 'Always yours',
        value: 'Data and access management, on every service without exception',
      },
    ],
    examTraps: [
      'On RDS, AWS patches the engine but you still own the users, the parameter groups, the encryption decision and the network placement.',
      'On S3, AWS guarantees durability; the bucket being public is entirely your side of the line.',
      'Fargate removes the host from your responsibility but not the container image. You still patch what is inside it.',
    ],
    confusedWith: [
      {
        slug: 'well-architected-pillars',
        difference:
          'Shared responsibility says who owns what. The pillars say what good looks like on the parts you own.',
      },
    ],
    serviceSlugs: ['artifact', 'iam', 'ec2', 'rds', 'lambda', 'fargate'],
    related: ['well-architected-pillars', 'least-privilege', 'encryption-at-rest-vs-in-transit'],
    docsUrl: 'https://aws.amazon.com/compliance/shared-responsibility-model/',
  },
  {
    slug: 'well-architected-pillars',
    term: 'The Well-Architected pillars',
    group: 'operations',
    certs: ['SAA-C03'],
    oneLiner:
      'The six dimensions AWS judges a design on, and the tie-breaker between two working answers.',
    whatItIs:
      'The Well-Architected Framework names six pillars: operational excellence, security, reliability, performance efficiency, cost optimisation, and sustainability. The exam is written against them, which is why so many questions have two technically correct options and one qualifying word — "most cost-effective", "with the least operational overhead", "most secure" — that names the pillar being tested.',
    keyIdea:
      'Find the qualifying phrase before comparing the options. "Least operational overhead" and "most cost-effective" usually point at different answers, and the stem tells you which one it is grading.',
    onTheExam: [
      '"Least operational overhead" favours managed and serverless over anything you run yourself.',
      '"Most cost-effective" favours the cheapest option that still meets every stated requirement — not the cheapest option overall.',
      '"Minimal changes to the application" rules out re-architecting, however much better the re-architected answer would be.',
    ],
    keyNumbers: [
      {
        label: 'The six pillars',
        value:
          'Operational excellence · Security · Reliability · Performance efficiency · Cost optimisation · Sustainability',
      },
      {
        label: 'The phrase that decides',
        value: 'Usually the last clause of the stem',
        note: 'Reading it first changes which option looks right surprisingly often.',
      },
    ],
    examTraps: [
      'The best-engineered answer loses to the one that matches the stated pillar. An active-active multi-Region design is wrong when the question asked for cost-effective.',
      'Two options can both work. The exam is not asking whether an option functions, it is asking which one the qualifying phrase selects.',
      'Sustainability is the newest pillar and appears rarely, usually as managed services and right-sizing rather than anything exotic.',
    ],
    confusedWith: [
      {
        slug: 'shared-responsibility',
        difference:
          'The pillars are how a design is judged. Shared responsibility is who owns which part of it.',
      },
    ],
    serviceSlugs: ['well-architected-tool', 'trusted-advisor', 'compute-optimizer'],
    related: ['shared-responsibility', 'scaling-up-vs-out', 'blast-radius'],
    docsUrl: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html',
  },
  {
    slug: 'quota-vs-limit',
    term: 'Service quotas',
    aka: ['service limits', 'soft limit', 'hard limit'],
    group: 'operations',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner: 'Per-account, per-Region ceilings — some you can raise, some you cannot.',
    whatItIs:
      'Almost every AWS service caps what one account can create or consume in one Region. Adjustable quotas can be raised on request through Service Quotas or a support case. Hard limits cannot be raised at all, and a design that needs more has to change shape. Quotas are also a containment mechanism: they stop one runaway workload consuming everything.',
    keyIdea:
      'Quotas are per account and per Region, so the same design in two Regions gets two allowances — and an account boundary is therefore also a quota boundary.',
    onTheExam: [
      '"The launch failed after N instances" is a quota, and the answer is a quota increase request rather than a redesign.',
      'A hard limit in an option means that option is impossible: 5 VPCs per Region is adjustable, 1 internet gateway per VPC is not.',
      '"Prevent one team exhausting capacity" is a separate account, because that is where the quota boundary is.',
    ],
    keyNumbers: [
      { label: 'Scope', value: 'Per account, per Region, almost always' },
      {
        label: 'Adjustable examples',
        value: 'VPCs per Region · Elastic IPs · on-demand vCPUs · Lambda concurrency',
      },
      {
        label: 'Not adjustable',
        value:
          'Internet gateways per VPC · S3 object size of 5 TB · Lambda 15-minute timeout · DynamoDB 400 KB item',
      },
      {
        label: 'Lambda concurrency',
        value: '1,000 per account per Region by default, adjustable',
        volatile: true,
      },
    ],
    examTraps: [
      "A hard limit is a design constraint, not a support case. Lambda's 15-minute maximum is why long jobs move to Fargate or Batch, and no option that asks for a raise is correct.",
      'Reserved concurrency on one Lambda function subtracts from the account pool, so setting it too high starves everything else.',
      'Quotas apply per Region, so a solution that "works in the other Region" may simply have unused allowance rather than a better design.',
    ],
    confusedWith: [
      {
        slug: 'blast-radius',
        difference:
          'A quota is a ceiling you may hit. Blast radius is why putting workloads in separate accounts — and therefore separate quota pools — is a design decision, not just paperwork.',
      },
    ],
    serviceSlugs: ['organizations', 'lambda', 'ec2', 'trusted-advisor', 'cloudwatch'],
    related: ['blast-radius', 'scaling-up-vs-out'],
    docsUrl: 'https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html',
  },
  {
    slug: 'scaling-up-vs-out',
    term: 'Scaling up versus scaling out',
    aka: ['vertical scaling', 'horizontal scaling'],
    group: 'operations',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner:
      'A bigger instance, versus more instances — and why the exam nearly always wants more.',
    whatItIs:
      'Scaling up (vertical) replaces a resource with a larger one: a bigger instance type, more provisioned IOPS, more Lambda memory. It is simple, needs no application change, and has a ceiling and usually a restart. Scaling out (horizontal) adds more copies behind a load balancer or a queue. It has no practical ceiling and it heals itself, but the workload has to be stateless enough to spread.',
    keyIdea:
      'Scaling up has a maximum and a restart; scaling out has neither, which is why "elastic", "highly available" and "handle unpredictable traffic" all point outwards. Up is the answer only when the workload cannot be split.',
    onTheExam: [
      '"Unpredictable or spiky traffic" and "highly available" are both scale-out signals.',
      '"A single-threaded application" or "a licence tied to one host" forces scaling up.',
      'Databases are the common exception: reads scale out with replicas, writes usually scale up until you shard or move to Aurora.',
    ],
    keyNumbers: [
      {
        label: 'Auto Scaling policies',
        value: 'Target tracking · step · simple · scheduled · predictive',
        note: 'Target tracking is the default recommendation and the usual answer.',
      },
      {
        label: 'Vertical scaling on EC2',
        value: 'Requires a stop and start',
      },
      {
        label: 'Lambda',
        value: 'Scales out automatically; you only tune memory, which scales CPU with it',
      },
    ],
    examTraps: [
      'Adding read replicas does not help write throughput. When the stem says writes are the bottleneck, replicas are the distractor.',
      'Auto Scaling replaces failed instances, which makes it an availability mechanism as well as a capacity one — but never a disaster recovery mechanism.',
      'Scheduled scaling is for known patterns and predictive scaling for learned ones. Target tracking handles everything else, and choosing a more complicated policy than the stem justifies is usually wrong.',
    ],
    confusedWith: [
      {
        slug: 'high-availability-vs-fault-tolerance',
        difference:
          'Scaling is about capacity matching demand. Availability is about surviving failure. Scaling out happens to give you some of both, which is why the exam likes it.',
      },
    ],
    serviceSlugs: ['ec2-auto-scaling', 'elb', 'lambda', 'aurora', 'dynamodb', 'fargate'],
    related: [
      'high-availability-vs-fault-tolerance',
      'quota-vs-limit',
      'partition-key',
      'sticky-sessions',
    ],
    docsUrl: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/scaling-overview.html',
  },
  {
    slug: 'tagging',
    term: 'Tagging',
    group: 'operations',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner:
      'Key-value labels on resources — the basis of cost allocation and of attribute-based access.',
    whatItIs:
      'A tag is a key-value pair attached to a resource. Tags drive three things the exam cares about: cost allocation, once activated in the billing console; automation, since Systems Manager and Backup select resources by tag; and authorisation, since IAM conditions can require or match a tag, which is attribute-based access control.',
    keyIdea:
      'Tags are the only way to attribute cost to a team or project, and they are not retroactive — activating a cost allocation tag applies from that point forwards, never backwards.',
    onTheExam: [
      '"Break down the bill by department" is cost allocation tags plus Cost Explorer, and the tags must be activated first.',
      '"Enforce that every resource is tagged" is a tag policy in Organizations, or an SCP that denies creation without the tag.',
      '"Grant access only to resources belonging to the user\'s team" is ABAC with an aws:PrincipalTag condition.',
    ],
    keyNumbers: [
      { label: 'Tags per resource', value: '50', volatile: true },
      { label: 'Key length', value: '128 characters; value 256' },
      {
        label: 'Cost allocation tags',
        value: 'Must be activated in Billing, and apply only from activation forwards',
      },
      {
        label: 'Case sensitivity',
        value: 'Tag keys are case-sensitive — Env and env are different tags',
      },
    ],
    examTraps: [
      "Activating a cost allocation tag does not backfill history. A question asking about last quarter's spend by team, on untagged resources, has no tagging answer.",
      'A tag policy in Organizations standardises tags but does not by itself prevent creating an untagged resource. That takes an SCP.',
      'Tags are not a security boundary on their own. ABAC works only where the service supports the relevant condition key, and not every service does.',
    ],
    confusedWith: [
      {
        slug: 'least-privilege',
        difference:
          'Least privilege is about how narrow a permission is. Tagging is one mechanism for expressing it — attribute-based rather than resource-by-resource.',
      },
    ],
    serviceSlugs: ['organizations', 'cost-explorer', 'systems-manager', 'backup', 'config', 'iam'],
    related: ['least-privilege', 'blast-radius', 'quota-vs-limit'],
    docsUrl: 'https://docs.aws.amazon.com/tag-editor/latest/userguide/tagging.html',
  },
]
