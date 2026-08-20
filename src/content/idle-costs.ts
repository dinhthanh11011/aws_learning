import type { IdleCost } from './schema'

/**
 * Approximate us-east-1 costs for things left running and unused. These are
 * the charges that turn a learning account into a bad surprise, and several of
 * them are also exam answers in cost-optimisation questions.
 *
 * Figures are indicative, not billing-accurate — they exist to build intuition
 * about orders of magnitude, which is what the exam actually tests.
 */
export const idleCosts: IdleCost[] = [
  {
    slug: 'nat-gateway',
    label: 'NAT Gateway',
    usdPerMonth: 32,
    note: 'The number one accidental charge — about $1.10 a day just for existing, before any data passes through it.',
    teardown:
      'Delete the NAT gateway and release its Elastic IP. For AWS-service traffic, use a gateway VPC endpoint instead — those are free.',
  },
  {
    slug: 'elb',
    label: 'Application Load Balancer',
    usdPerMonth: 16,
    note: 'Charged per hour whether or not a single request arrives.',
    teardown: 'Delete the load balancer after every lab. Target groups alone cost nothing.',
  },
  {
    slug: 'rds',
    label: 'RDS db.t3.micro',
    usdPerMonth: 15,
    note: 'May be covered by a free-tier allowance depending on when your account was created — verify rather than assume.',
    teardown:
      'Delete the instance, and delete the final snapshot too if you do not need it. Snapshots keep costing.',
  },
  {
    slug: 'ec2',
    label: 'Unattached Elastic IP',
    usdPerMonth: 4,
    note: 'Free while attached to a running instance, billed while idle — AWS charges you for hoarding addresses.',
    teardown: 'Release any Elastic IP you are not using.',
  },
  {
    slug: 'ebs',
    label: 'Orphaned EBS volumes',
    usdPerMonth: 8,
    note: 'A 100 GB gp3 volume is about $8 a month, and volumes survive instance termination unless delete-on-termination is set.',
    teardown:
      'Check for available (unattached) volumes and delete them. Delete old snapshots as well.',
  },
  {
    slug: 'eks',
    label: 'EKS cluster control plane',
    usdPerMonth: 73,
    note: 'Charged per cluster-hour with zero nodes running. The most expensive thing to forget.',
    teardown: 'Delete the cluster, not just the node group.',
  },
  {
    slug: 'privatelink',
    label: 'Interface VPC endpoint',
    usdPerMonth: 7,
    note: 'Per endpoint per AZ. Three AZs means three times the charge. Gateway endpoints (S3, DynamoDB) are free.',
    teardown:
      'Delete interface endpoints you are not using; prefer gateway endpoints where the service supports them.',
  },
  {
    slug: 'transit-gateway',
    label: 'Transit Gateway attachment',
    usdPerMonth: 36,
    note: 'Per attachment per hour, plus per GB processed. Cheap at scale, expensive for a two-VPC lab.',
    teardown:
      'Delete attachments first, then the gateway. Peering is cheaper for a lab with two VPCs.',
  },
  {
    slug: 'lambda',
    label: 'Lambda, DynamoDB on-demand, SQS, SNS, S3 at lab scale',
    usdPerMonth: 0,
    note: 'Generous always-free tiers. You can leave these deployed between sessions without worrying.',
    teardown: 'Nothing urgent. Still worth cleaning up so the console stays legible.',
  },
]
