import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const computeServices: Service[] = [
  {
    slug: 'ec2',
    name: 'Amazon EC2',
    abbr: 'EC2',
    category: 'compute',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Virtual machines you rent by the second and administer yourself.',
    whatItIs:
      'Resizable virtual servers. You pick an instance family (what the hardware is optimised for), a size (how much of it you get), an AMI (the disk image it boots), and a purchase model (how you pay). Everything above the hypervisor is yours to patch, scale and secure — which is exactly why the exam usually wants you to choose something else, unless the question gives you a reason you cannot.',
    whyItExists:
      'Buying a server meant a purchase order, a delivery, a rack, and a three-year bet on how much capacity you would need — placed before you had any users. Getting it wrong cost either an outage or a room full of idle metal. EC2 exists to turn that capital bet into an hourly one: the same machine, rented by the hour, returnable when you are wrong. Almost every other AWS service is an argument about what you should stop running on it.',
    whenToUse: [
      'A workload needs a specific OS, kernel module, licensed agent or long-running process that will not fit in a container or a 15-minute function',
      'Lift-and-shift of an existing server where "no application changes" is stated or implied',
      'Sustained, predictable load where a committed purchase model beats per-request pricing',
      'You need GPU, high-memory, bare-metal or specialised hardware',
    ],
    whenNotToUse: [
      'Short, spiky, event-driven work — Lambda is cheaper and has no idle cost',
      'Stateless HTTP containers with no OS requirements — Fargate removes the patching',
      'When the question emphasises "minimal operational overhead" or "no servers to manage": that phrasing is almost always ruling EC2 out',
    ],
    keyNumbers: [
      {
        label: 'Billing granularity',
        value: 'Per second (Linux, 60s minimum)',
        note: 'Windows and some marketplace AMIs bill per hour.',
      },
      {
        label: 'Instance family letters',
        value:
          'T/M = general, C = compute, R/X/z = memory, I/D = storage, P/G/Inf/Trn = accelerated',
      },
      {
        label: 'Spot discount',
        value: 'Up to ~90% off On-Demand',
        note: 'Two-minute interruption notice.',
      },
      {
        label: 'Reserved / Savings Plan discount',
        value: 'Up to ~72% for a 3-year, all-upfront commitment',
      },
      {
        label: 'Placement groups',
        value: 'Cluster = low latency, one AZ · Spread = max isolation · Partition = rack-aware',
      },
      {
        label: 'Hibernation',
        value: 'RAM saved to the root EBS volume',
        note: 'Root volume must be encrypted and large enough to hold RAM.',
      },
    ],
    examTraps: [
      'A "burstable" T-family instance running out of CPU credits is the hidden cause in performance questions. Unlimited mode fixes it for a fee; switching to M/C fixes it properly.',
      'Instance store is ephemeral. Stop or terminate the instance and the data is gone. Only EBS survives a stop.',
      'Changing instance type requires a stop/start — it is not a live operation. That makes vertical scaling a downtime event, which is why horizontal scaling wins resilience questions.',
      'A cluster placement group gives you low latency but concentrates every instance in one AZ. It is the wrong answer to any high-availability question.',
      'You cannot attach an instance to more than one placement group, and you cannot move a running instance between them.',
    ],
    confusedWith: [
      {
        slug: 'lambda',
        difference:
          'EC2 is always on and you patch it; Lambda runs only during an invocation, caps at 15 minutes, and AWS patches it.',
      },
      {
        slug: 'fargate',
        difference:
          'Fargate runs containers with no instance to manage. Choose EC2 launch type only when you need host access, GPUs, or specific instance features.',
      },
      {
        slug: 'elastic-beanstalk',
        difference:
          'Beanstalk provisions and manages EC2 for you from your code bundle. Same EC2 underneath, less to configure.',
      },
    ],
    pricing:
      'Per second of instance runtime plus EBS, plus data transfer out. On-Demand, Spot, Reserved Instances and Savings Plans are four ways to pay for the same compute.',
    docsUrl: `${D}/ec2/latest/userguide/concepts.html`,
    related: [
      'ec2-auto-scaling',
      'ebs',
      'elb',
      'spot',
      'savings-plans',
      'instance-store',
      'compute-optimizer',
    ],
  },
  {
    slug: 'ec2-auto-scaling',
    name: 'Amazon EC2 Auto Scaling',
    abbr: 'ASG',
    category: 'compute',
    families: ['saa'],
    tier: 1,
    oneLiner: 'Keeps a fleet of EC2 instances at the right size, and replaces the dead ones.',
    whatItIs:
      'An Auto Scaling group holds a launch template, a min/desired/max count, a list of subnets, and scaling policies. It launches and terminates instances to hold the desired count, replaces instances that fail a health check, and spreads them across the AZs you gave it. The resilience half matters as much as the elasticity half: an ASG with min=max=2 across two AZs is still doing useful work.',
    whenToUse: [
      'Any EC2 workload that must survive an instance or AZ failure — the ASG is what makes it self-healing',
      'Load that varies over the day, week or in bursts',
      'You want instance replacement without a human being paged',
    ],
    whenNotToUse: [
      'Single stateful server that cannot be cloned (though an ASG of min=max=1 is still a valid self-healing pattern)',
      'Container task counts — use ECS service auto scaling instead',
      'Scaling a database — use read replicas, Aurora Auto Scaling or DynamoDB auto scaling',
    ],
    keyNumbers: [
      {
        label: 'Default cooldown',
        value: '300 seconds',
        note: 'Applies to simple scaling policies only.',
      },
      {
        label: 'Health check grace period',
        value: '300 seconds default',
        note: 'Too short and the ASG kills instances mid-boot — a classic misconfiguration.',
      },
      {
        label: 'Default termination policy',
        value: 'AZ with most instances → oldest launch template → closest to the next billing hour',
      },
      {
        label: 'Lifecycle hooks',
        value: 'Pause at Pending:Wait and Terminating:Wait',
        note: 'Default heartbeat 3600s, max 48h — how you drain connections or fetch logs.',
      },
      { label: 'Warm pools', value: 'Pre-initialised, stopped instances for fast scale-out' },
    ],
    examTraps: [
      'Target tracking is the default right answer for "keep utilisation around X". Step scaling is for staged responses to a big metric jump. Simple scaling is legacy — it waits for a cooldown between actions.',
      'Scheduled scaling is the answer when the load pattern is known by the clock ("traffic triples every weekday at 9am"), not by a metric.',
      'Predictive scaling uses historical CloudWatch data to scale *before* the load arrives. It is the answer when a metric-based policy would react too late.',
      'An ASG only balances across the AZs whose subnets you attached. Attaching one subnet gives you a single-AZ fleet, no matter how many instances.',
      'Turning on ELB health checks (not just EC2 status checks) is what makes the ASG replace an instance whose application has died but whose OS is fine.',
    ],
    confusedWith: [
      {
        slug: 'auto-scaling',
        difference:
          'AWS Auto Scaling is the multi-service planner across ECS, DynamoDB, Aurora and EC2. EC2 Auto Scaling is only the EC2 group.',
      },
      {
        slug: 'elb',
        difference:
          'The load balancer distributes requests; the ASG changes how many targets exist. Almost every resilient design uses both.',
      },
    ],
    pricing: 'No charge for the service. You pay for the instances it launches.',
    docsUrl: `${D}/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html`,
    related: ['ec2', 'elb', 'cloudwatch', 'auto-scaling', 'spot'],
  },
  {
    slug: 'auto-scaling',
    name: 'AWS Auto Scaling',
    category: 'compute',
    families: ['saa'],
    tier: 3,
    oneLiner: 'One console for scaling plans across several services at once.',
    whatItIs:
      'A unified scaling-plan layer over EC2 Auto Scaling groups, ECS services, DynamoDB tables and indexes, Aurora replicas and Spot Fleets. You state an optimisation goal — availability, cost, or a balance — and it configures the underlying target-tracking policies.',
    whenToUse: [
      'You want one scaling plan spanning several resource types',
      'Predictive scaling driven by a stated availability-versus-cost preference',
    ],
    whenNotToUse: ['A single EC2 fleet — configure the ASG policy directly'],
    keyNumbers: [],
    examTraps: [
      'If a question names only EC2, the answer is EC2 Auto Scaling. AWS Auto Scaling appears when several different resource types must scale together.',
    ],
    confusedWith: [
      {
        slug: 'ec2-auto-scaling',
        difference:
          'EC2 Auto Scaling scales one EC2 group. AWS Auto Scaling coordinates scaling across multiple services.',
      },
    ],
    pricing: 'No additional charge.',
    docsUrl: `${D}/autoscaling/plans/userguide/what-is-aws-auto-scaling.html`,
    related: ['ec2-auto-scaling', 'dynamodb', 'ecs', 'aurora'],
  },
  {
    slug: 'spot',
    name: 'EC2 Spot Instances',
    abbr: 'Spot',
    category: 'compute',
    families: ['saa'],
    tier: 1,
    oneLiner: 'Spare capacity at up to 90% off, reclaimable with two minutes notice.',
    whatItIs:
      'Unused EC2 capacity sold at a steep discount. AWS can reclaim an instance at any time with a two-minute interruption notice delivered through instance metadata and EventBridge. That single constraint decides every Spot question: can this workload lose a node mid-flight and carry on?',
    whenToUse: [
      'Batch, rendering, CI builds, big-data processing — anything that checkpoints or retries',
      'Stateless web tiers behind a load balancer, mixed with On-Demand for a guaranteed floor',
      'Queue-driven workers: an interrupted job simply returns to the queue after the visibility timeout',
    ],
    whenNotToUse: [
      'Anything that cannot tolerate interruption: a single database node, a licence server, a long non-checkpointed job',
      'Workloads with a hard, immediate capacity guarantee — that is On-Demand Capacity Reservations',
    ],
    keyNumbers: [
      { label: 'Discount', value: 'Up to ~90% vs On-Demand' },
      { label: 'Interruption notice', value: '2 minutes' },
      { label: 'Spot blocks', value: 'No longer offered to new customers' },
      {
        label: 'Allocation strategy',
        value: 'price-capacity-optimized is the recommended default',
        note: 'Fewer interruptions than the lowest-price strategy.',
      },
    ],
    examTraps: [
      'The exam signal for Spot is "fault-tolerant", "interruptible", "flexible start and end times", or "lowest possible cost for batch".',
      'A mixed-instances ASG policy with an On-Demand base capacity plus Spot above it is the standard answer to "cheap but must never drop below N instances".',
      'Spot does not mean "cheaper On-Demand you can rely on". Any question with a strict SLA on the same tier is ruling Spot out.',
    ],
    confusedWith: [
      {
        slug: 'savings-plans',
        difference:
          'Savings Plans discount steady, committed usage with no interruption risk. Spot discounts interruptible usage with no commitment.',
      },
    ],
    pricing: 'Fluctuating per-second price per instance type per AZ, always at or below On-Demand.',
    docsUrl: `${D}/ec2/latest/userguide/using-spot-instances.html`,
    related: ['ec2', 'ec2-auto-scaling', 'batch', 'savings-plans', 'sqs'],
  },
  {
    slug: 'batch',
    name: 'AWS Batch',
    category: 'compute',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Managed job queue that provisions compute to drain it, then shuts it down.',
    whatItIs:
      'You submit jobs — each a container image plus resource requirements — to a job queue. Batch sizes and launches a compute environment (EC2, Spot or Fargate) to run them, handles dependencies and retries, and scales back to zero when the queue empties. It is the "run 40,000 of these overnight" service.',
    whenToUse: [
      'Large-scale batch or HPC work with queueing, priorities and job dependencies',
      "Jobs longer than Lambda's 15-minute limit that still need to scale to zero",
      'Array jobs over a big parameter sweep',
    ],
    whenNotToUse: [
      'Request/response APIs — that is ECS, Fargate or Lambda',
      'Step-by-step business workflows with human approval — that is Step Functions',
      'Short event-driven functions — Lambda is simpler',
    ],
    keyNumbers: [
      {
        label: 'Job timeout',
        value: 'You set it per job definition; there is no 15-minute ceiling',
      },
    ],
    examTraps: [
      '"Batch processing" + "thousands of jobs" + "minimise cost" = AWS Batch on Spot.',
      'Batch is not a scheduler you use to run something every night at 2am on its own — EventBridge Scheduler triggers it.',
    ],
    confusedWith: [
      {
        slug: 'emr',
        difference:
          'EMR runs Hadoop/Spark frameworks on a cluster. Batch runs arbitrary containerised jobs with no framework opinion.',
      },
      {
        slug: 'step-functions',
        difference:
          'Step Functions orchestrates a workflow of steps. Batch executes a queue of independent compute jobs.',
      },
    ],
    pricing:
      'No charge for Batch itself — you pay for the EC2, Spot or Fargate capacity it launches.',
    docsUrl: `${D}/batch/latest/userguide/what-is-batch.html`,
    related: ['ec2', 'spot', 'fargate', 'ecs', 'step-functions', 'emr'],
  },
  {
    slug: 'elastic-beanstalk',
    name: 'AWS Elastic Beanstalk',
    abbr: 'EB',
    category: 'compute',
    families: ['saa', 'dva'],
    tier: 2,
    oneLiner: 'Hand it your application bundle; it builds the EC2, ASG and ELB around it.',
    whatItIs:
      'A platform-as-a-service layer over EC2. You upload code for a supported platform (Java, .NET, Node, Python, Ruby, Go, PHP, Docker) and Beanstalk provisions the load balancer, Auto Scaling group, instances and CloudWatch alarms, then manages deployments and platform updates. The resources it creates are ordinary resources — you can still see and tune them.',
    whenToUse: [
      'A developer wants a running, scalable web app without designing the infrastructure',
      'Standard three-tier web application on a supported runtime',
      'You want managed platform patching but still need EC2 underneath',
    ],
    whenNotToUse: [
      'Fine-grained control over the architecture — write CloudFormation or CDK instead',
      'Serverless targets — SAM plus Lambda is the DVA-flavoured answer',
      'Container orchestration at scale — ECS or EKS',
    ],
    keyNumbers: [
      {
        label: 'Deployment policies',
        value:
          'All at once · Rolling · Rolling with additional batch · Immutable · Traffic splitting',
      },
      { label: 'Zero-downtime, safest', value: 'Immutable, or blue/green via a CNAME swap' },
      { label: 'Config directory', value: '.ebextensions/*.config in the bundle' },
      {
        label: 'Environment types',
        value: 'Web server tier and worker tier',
        note: 'The worker tier reads from an SQS queue via a local daemon.',
      },
    ],
    examTraps: [
      '"All at once" is fastest but drops the site. "Immutable" is the answer whenever a question asks for no reduced capacity and easy rollback.',
      'Blue/green on Beanstalk means two environments and a URL swap, not a deployment policy.',
      'The RDS instance Beanstalk can create inside an environment is deleted with that environment. Production databases belong outside it — a favourite exam trap.',
      'The worker tier plus SQS is the Beanstalk answer to long-running background jobs.',
    ],
    confusedWith: [
      {
        slug: 'cloudformation',
        difference:
          'Beanstalk is opinionated PaaS for applications; CloudFormation is a general-purpose infrastructure template engine (and is what Beanstalk uses underneath).',
      },
      {
        slug: 'ecs',
        difference:
          'Beanstalk deploys application bundles onto managed EC2; ECS orchestrates containers you have already built.',
      },
    ],
    pricing: 'No charge for Beanstalk. You pay for the EC2, ELB, EBS and RDS it creates.',
    docsUrl: `${D}/elasticbeanstalk/latest/dg/Welcome.html`,
    related: ['ec2', 'elb', 'ec2-auto-scaling', 'cloudformation', 'codepipeline', 'sqs'],
  },
  {
    slug: 'outposts',
    name: 'AWS Outposts',
    category: 'compute',
    families: ['saa'],
    tier: 3,
    oneLiner: 'AWS-managed racks installed in your own data centre.',
    whatItIs:
      'Physical AWS infrastructure delivered to and operated inside your facility, presenting the same APIs as a Region. Used when data must stay on premises or when local latency to on-premises systems is non-negotiable.',
    whenToUse: [
      'Regulatory or contractual requirement that data physically remain on site',
      'Single-digit-millisecond latency to on-premises equipment (factory floor, trading systems)',
      'Local data processing with a slow or intermittent link to the Region',
    ],
    whenNotToUse: ['Anything that can run in a Region — Outposts is expensive and capacity-bound'],
    keyNumbers: [{ label: 'Form factors', value: '42U racks and 1U/2U servers' }],
    examTraps: [
      'The tell is "must remain in our data centre" or "cannot leave the premises" combined with "same AWS APIs". Local Zones and Wavelength are about latency to *users*, not about on-premises residency.',
    ],
    confusedWith: [
      {
        slug: 'wavelength',
        difference:
          'Wavelength puts compute inside telecom 5G networks for mobile-user latency. Outposts puts it in your own building.',
      },
      {
        slug: 'storage-gateway',
        difference:
          'Storage Gateway gives on-premises systems access to AWS storage. Outposts runs AWS compute and storage on premises.',
      },
    ],
    pricing:
      'Purchase or 1/3-year commitment per configuration, including installation and maintenance.',
    docsUrl: `${D}/outposts/latest/userguide/what-is-outposts.html`,
    related: ['wavelength', 'vmware-cloud', 'storage-gateway', 'direct-connect'],
  },
  {
    slug: 'wavelength',
    name: 'AWS Wavelength',
    category: 'compute',
    families: ['saa'],
    tier: 3,
    oneLiner: 'AWS compute embedded in telecom providers 5G networks.',
    whatItIs:
      'Wavelength Zones place EC2 and EBS inside carrier data centres so mobile traffic never leaves the provider network to reach your application. Built for ultra-low-latency mobile use cases.',
    whenToUse: [
      'AR/VR, live mobile gaming, connected vehicles, real-time video analysis on 5G devices',
    ],
    whenNotToUse: [
      'Ordinary web latency problems — CloudFront or Global Accelerator are the right tools',
    ],
    keyNumbers: [],
    examTraps: [
      'Wavelength = 5G / mobile devices. If the question does not mention mobile or 5G, it is not Wavelength.',
    ],
    confusedWith: [
      {
        slug: 'cloudfront',
        difference:
          'CloudFront caches content at edge locations for any client. Wavelength runs your compute inside a mobile carrier network.',
      },
      {
        slug: 'outposts',
        difference: 'Outposts is your premises; Wavelength is the carrier premises.',
      },
    ],
    pricing: 'EC2/EBS rates for the Wavelength Zone plus carrier data transfer.',
    docsUrl: `${D}/wavelength/latest/developerguide/what-is-wavelength.html`,
    related: ['outposts', 'cloudfront', 'global-accelerator'],
  },
  {
    slug: 'vmware-cloud',
    name: 'VMware Cloud on AWS',
    category: 'compute',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Run your existing VMware vSphere estate on AWS bare-metal hosts.',
    whatItIs:
      'A VMware software-defined data centre running on dedicated AWS infrastructure, so existing vSphere tooling, VMs and skills transfer unchanged.',
    whenToUse: [
      'Migrating a large VMware estate quickly without re-platforming',
      'Hybrid operations using existing vCenter tooling',
    ],
    whenNotToUse: ['Cloud-native builds — use EC2, containers or serverless'],
    keyNumbers: [],
    examTraps: [
      'The tell is "existing VMware / vSphere workloads" plus "minimal changes" and "fastest migration".',
    ],
    confusedWith: [
      {
        slug: 'application-migration-service',
        difference:
          'MGN replatforms servers into native EC2 instances. VMware Cloud keeps them as VMware VMs.',
      },
    ],
    pricing: 'Per host, on-demand or 1/3-year subscription.',
    docsUrl: 'https://aws.amazon.com/vmware/',
    related: ['outposts', 'application-migration-service', 'ec2'],
  },
  {
    slug: 'serverless-application-repository',
    name: 'AWS Serverless Application Repository',
    abbr: 'SAR',
    category: 'compute',
    families: ['saa'],
    tier: 3,
    oneLiner: 'A catalogue of publishable, deployable SAM applications.',
    whatItIs:
      'A store of packaged serverless applications defined as SAM templates, which you can deploy into your account or publish privately for your organisation.',
    whenToUse: ['Reusing or sharing a ready-made serverless component across teams or accounts'],
    whenNotToUse: ['Building your own application from scratch — use SAM or CDK directly'],
    keyNumbers: [],
    examTraps: [
      'Do not confuse it with Service Catalog, which governs approved products of any type, not just serverless.',
    ],
    confusedWith: [
      {
        slug: 'service-catalog',
        difference:
          'Service Catalog governs curated CloudFormation products for an organisation; SAR is a marketplace of serverless apps.',
      },
    ],
    pricing: 'No charge for the repository; you pay for the deployed resources.',
    docsUrl: `${D}/serverlessrepo/latest/devguide/what-is-serverlessrepo.html`,
    related: ['sam', 'lambda', 'cloudformation', 'service-catalog'],
  },
]
