import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const containerServices: Service[] = [
  {
    slug: 'ecs',
    name: 'Amazon ECS',
    abbr: 'ECS',
    category: 'containers',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: "AWS's own container orchestrator — simpler than Kubernetes, deeply integrated.",
    whatItIs:
      'You describe a task definition (which images, how much CPU and memory, which IAM role, which log driver) and ECS places tasks onto capacity. That capacity is either EC2 instances you own or Fargate, which you do not. A *service* keeps N tasks running behind a load balancer and replaces failures; a *task* is a one-off run.',
    whenToUse: [
      'Containerised workloads where you want AWS integration and no Kubernetes to operate',
      'Teams without Kubernetes experience — the learning curve is much shorter',
      'Anything where the question stresses "minimal operational overhead" but still needs containers',
    ],
    whenNotToUse: [
      'You need Kubernetes APIs, existing Helm charts, or portability across clouds — that is EKS',
      'A single short function — Lambda',
    ],
    keyNumbers: [
      { label: 'Launch types', value: 'Fargate (serverless) or EC2 (you manage the hosts)' },
      {
        label: 'Two IAM roles per task',
        value:
          'Task execution role pulls the image and writes logs; task role is what your code uses',
      },
      {
        label: 'Network modes',
        value: 'awsvpc (each task gets its own ENI, required by Fargate), bridge, host, none',
      },
      {
        label: 'Service auto scaling',
        value: 'Target tracking, step, and scheduled — via Application Auto Scaling',
      },
    ],
    examTraps: [
      'The two-roles distinction is examined directly: if the task cannot pull its image from ECR, it is the *execution* role. If your application code gets AccessDenied calling S3, it is the *task* role.',
      'awsvpc mode gives each task its own security group — the answer whenever per-task network isolation is required.',
      'ECS Anywhere runs the agent on your own hardware while the control plane stays in AWS.',
      'For "capacity managed automatically as tasks grow" on the EC2 launch type, the answer is an ECS capacity provider with managed scaling, not a raw ASG policy.',
    ],
    confusedWith: [
      {
        slug: 'eks',
        difference:
          'Same job, different API. ECS is AWS-proprietary and simpler; EKS is upstream Kubernetes with its own ecosystem and more operational weight.',
      },
      {
        slug: 'fargate',
        difference:
          'Fargate is not an alternative to ECS — it is a launch type *for* ECS (and EKS). ECS is the orchestrator, Fargate is the capacity.',
      },
      {
        slug: 'lambda',
        difference:
          'Lambda is per-invocation with a 15-minute ceiling; ECS tasks are long-running processes you keep warm.',
      },
    ],
    pricing:
      'No charge for ECS itself. You pay for the EC2 instances or the Fargate vCPU/memory used.',
    docsUrl: `${D}/AmazonECS/latest/developerguide/Welcome.html`,
    related: ['fargate', 'ecr', 'eks', 'elb', 'ecs-anywhere', 'cloudwatch'],
  },
  {
    slug: 'eks',
    name: 'Amazon EKS',
    abbr: 'EKS',
    category: 'containers',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 2,
    oneLiner: 'Managed upstream Kubernetes control plane.',
    whatItIs:
      'AWS runs and patches the Kubernetes control plane across multiple AZs; you supply worker capacity as managed node groups, self-managed nodes, or Fargate profiles. The API is standard Kubernetes, so existing manifests, Helm charts and operators work.',
    whenToUse: [
      'Existing Kubernetes investment — manifests, Helm, operators, team skills',
      'Multi-cloud or hybrid portability is a stated requirement',
      'You need the Kubernetes ecosystem specifically (custom controllers, service meshes, CRDs)',
    ],
    whenNotToUse: [
      'A team new to containers with no Kubernetes requirement — ECS is materially less work',
      'Simple event handlers — Lambda',
    ],
    keyNumbers: [
      { label: 'Control plane cost', value: 'Charged per hour per cluster, independent of nodes' },
      {
        label: 'Node options',
        value: 'Managed node groups · self-managed nodes · Fargate profiles',
      },
      {
        label: 'Pod networking',
        value: 'VPC CNI gives every pod a real VPC IP address',
        note: 'Plan CIDR space accordingly — IP exhaustion is a real design constraint.',
      },
      {
        label: 'Pod-level IAM',
        value: 'IRSA (IAM Roles for Service Accounts), or EKS Pod Identity',
      },
    ],
    examTraps: [
      'The exam signal for EKS is the word "Kubernetes" appearing in the requirement. If it does not appear, ECS is usually the cheaper, lower-overhead answer.',
      'EKS charges for the control plane whether or not you run any pods — relevant to cost questions comparing it with ECS.',
      'IRSA is the correct way to give a pod AWS permissions. Attaching a broad role to the node lets every pod on that node use it — a least-privilege violation the exam likes to test.',
      'EKS Distro is the open-source distribution you run yourself; EKS Anywhere runs on your own infrastructure. Neither is the managed AWS service.',
    ],
    confusedWith: [
      {
        slug: 'ecs',
        difference: 'ECS has no Kubernetes API and no control-plane charge; EKS has both.',
      },
    ],
    pricing: 'Per-cluster hourly control-plane fee plus the node or Fargate capacity.',
    docsUrl: `${D}/eks/latest/userguide/what-is-eks.html`,
    related: ['ecs', 'fargate', 'ecr', 'eks-anywhere', 'eks-distro', 'iam'],
  },
  {
    slug: 'ecr',
    name: 'Amazon ECR',
    abbr: 'ECR',
    category: 'containers',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 2,
    oneLiner: 'Private (and public) container registry with IAM-based access.',
    whatItIs:
      'A managed Docker/OCI registry. Repositories are IAM-controlled, images are encrypted at rest, and image scanning can find OS-package vulnerabilities. Lifecycle policies expire old images so the bill and the clutter stay bounded.',
    whenToUse: [
      'Storing images for ECS, EKS, Lambda container packaging or App Runner',
      'You want IAM — not a separate registry credential — controlling who can pull',
      'Cross-Region or cross-account image replication',
    ],
    whenNotToUse: [
      'Storing application artifacts that are not container images — that is CodeArtifact or S3',
    ],
    keyNumbers: [
      { label: 'Auth', value: 'A 12-hour token from `aws ecr get-login-password`' },
      { label: 'Scanning', value: 'Basic (on push, free) or Enhanced via Amazon Inspector' },
      { label: 'Lifecycle policies', value: 'Expire images by age or count' },
      {
        label: 'Lambda container images',
        value: 'Up to 10 GB',
        note: 'Versus 250 MB unzipped for a .zip deployment package.',
      },
    ],
    examTraps: [
      'Pull failures from a private subnet with no NAT gateway are solved with ECR *and* S3 VPC endpoints — ECR stores layers in S3, so the interface endpoint alone is not enough.',
      'ECR access is IAM plus an optional repository policy — the same identity/resource-policy pair as S3.',
    ],
    confusedWith: [
      {
        slug: 'codeartifact',
        difference:
          'CodeArtifact hosts language package formats (npm, Maven, PyPI, NuGet). ECR hosts container images.',
      },
    ],
    pricing: 'Per GB-month of storage plus data transfer out.',
    docsUrl: `${D}/AmazonECR/latest/userguide/what-is-ecr.html`,
    related: ['ecs', 'eks', 'lambda', 'inspector', 'privatelink', 'codebuild'],
  },
  {
    slug: 'ecs-anywhere',
    name: 'Amazon ECS Anywhere',
    category: 'containers',
    certs: ['SAA-C03'],
    tier: 3,
    oneLiner: 'Run ECS tasks on your own on-premises hardware.',
    whatItIs:
      'You register external instances — your servers, in your data centre — with an ECS cluster. The control plane stays in AWS; the containers run on your hardware.',
    whenToUse: ['Standardising on ECS tooling while some workloads must stay on premises'],
    whenNotToUse: ['Anything that can run in a Region'],
    keyNumbers: [],
    examTraps: [
      'External instances only support the bridge, host and none network modes — not awsvpc.',
    ],
    confusedWith: [
      {
        slug: 'outposts',
        difference:
          'Outposts is AWS-owned hardware in your building; ECS Anywhere uses hardware you already own.',
      },
    ],
    pricing: 'Per external instance-hour.',
    docsUrl: `${D}/AmazonECS/latest/developerguide/ecs-anywhere.html`,
    related: ['ecs', 'outposts', 'eks-anywhere'],
  },
  {
    slug: 'eks-anywhere',
    name: 'Amazon EKS Anywhere',
    category: 'containers',
    certs: ['SAA-C03'],
    tier: 3,
    oneLiner: 'Run and manage your own Kubernetes clusters on premises, AWS-supported.',
    whatItIs:
      'A deployable Kubernetes distribution based on EKS Distro that you operate on your own infrastructure, with AWS support and consistent tooling.',
    whenToUse: ['On-premises Kubernetes with AWS-consistent tooling and support'],
    whenNotToUse: ['You want AWS to run the control plane — that is EKS'],
    keyNumbers: [],
    examTraps: [
      'EKS Anywhere has its own local control plane. Unlike ECS Anywhere, AWS does not run it for you.',
    ],
    confusedWith: [
      {
        slug: 'eks-distro',
        difference:
          'EKS Distro is just the Kubernetes distribution; EKS Anywhere is the full installable, supported product built on it.',
      },
    ],
    pricing: 'Free to use; optional per-cluster support subscription.',
    docsUrl: 'https://anywhere.eks.amazonaws.com/',
    related: ['eks', 'eks-distro', 'ecs-anywhere', 'outposts'],
  },
  {
    slug: 'eks-distro',
    name: 'Amazon EKS Distro',
    category: 'containers',
    certs: ['SAA-C03'],
    tier: 3,
    oneLiner: 'The open-source Kubernetes distribution EKS itself is built from.',
    whatItIs:
      'The same Kubernetes and dependency versions AWS runs in EKS, published for you to deploy and operate entirely yourself, anywhere.',
    whenToUse: ['You want version parity with EKS while running everything yourself'],
    whenNotToUse: ['You want a managed or supported product'],
    keyNumbers: [],
    examTraps: [
      'Distro is bring-your-own-everything. If the question wants AWS to manage anything, it is not the answer.',
    ],
    confusedWith: [
      {
        slug: 'eks-anywhere',
        difference: 'Anywhere is a supported installable product; Distro is just the bits.',
      },
    ],
    pricing: 'Free, open source.',
    docsUrl: 'https://distro.eks.amazonaws.com/',
    related: ['eks', 'eks-anywhere'],
  },
]
