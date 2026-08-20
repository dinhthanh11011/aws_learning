import type { Lab } from './schema'

export const labs: Lab[] = [
  {
    id: 'vpc-builder',
    title: 'VPC Packet Tracer',
    tagline: 'Fire a packet through a real topology and watch exactly where it dies.',
    certs: ['SAA-C03', 'DVA-C02'],
    taskIds: ['saa-1.2', 'saa-3.4', 'saa-4.4'],
    minutes: 20,
    category: 'network',
    objective:
      'Send traffic between instances, out to the internet and to S3, and read the hop-by-hop trace. Then break the topology seven ways and predict the symptom before you press send.',
    teaches: [
      'Why a subnet is public: the route table, and nothing else',
      'Stateful security groups versus stateless NACLs, including the ephemeral-port trap',
      'What a NAT gateway costs, and why one per AZ is both safer and cheaper',
      'Why a gateway VPC endpoint removes the NAT bill for S3 and DynamoDB',
      'The specific failure symptom for each misconfiguration — which is what the exam asks',
    ],
  },
  {
    id: 'iam-puzzle',
    title: 'IAM Policy Puzzle',
    tagline: 'Predict the decision, then see the evaluation trace line by line.',
    certs: ['SAA-C03', 'DVA-C02'],
    taskIds: ['saa-1.1', 'saa-1.3', 'dva-2.1'],
    minutes: 20,
    category: 'security',
    objective:
      'Work through scenarios of stacked policies — identity, resource, SCP, boundary, conditions — and call allow or deny before revealing the trace. Security is 30% of SAA and this is the concept most people get wrong.',
    teaches: [
      'The evaluation order: explicit Deny → ceiling → Allow → implicit Deny',
      'Why an SCP or permissions boundary can never grant anything',
      'Why cross-account access needs an Allow on both sides',
      'How condition keys narrow a statement, and what happens when the key is absent',
      'Why a KMS key policy can veto a policy that grants s3:*',
    ],
  },
  {
    id: 'storage-cost',
    title: 'Storage & Teardown Cost Lab',
    tagline: 'See what an idle account actually costs, and what a lifecycle rule saves.',
    certs: ['SAA-C03'],
    taskIds: ['saa-4.1', 'saa-4.2', 'saa-4.4'],
    minutes: 12,
    category: 'cost',
    objective:
      'Model S3 lifecycle transitions against an access pattern, and total up what a forgotten lab environment bills per month. Cost intuition is 20% of SAA and it is also what keeps your own learning account cheap.',
    teaches: [
      'Which S3 class fits which access pattern, and what the minimum durations cost you',
      'Why Intelligent-Tiering wins only when the pattern is genuinely unknown',
      'The hourly-billed resources that cost money doing nothing',
      'Why data transfer, not storage, is usually the surprise on the bill',
    ],
  },
]

export const labById = new Map(labs.map((l) => [l.id, l]))
