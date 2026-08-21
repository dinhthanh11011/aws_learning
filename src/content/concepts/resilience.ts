import type { Concept } from '../schema'

/**
 * RTO and RPO are two numbers on opposite sides of the outage, and the exam
 * hands you one or both and expects a strategy back. They are split into
 * separate entries rather than one "RTO/RPO" card on purpose: confusing them is
 * the failure mode, and two entries give the drill a contrast card that puts
 * them side by side.
 */
export const resilienceConcepts: Concept[] = [
  {
    slug: 'rpo',
    term: 'Recovery Point Objective',
    abbr: 'RPO',
    aka: ['RPO', 'acceptable data loss'],
    group: 'resilience',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner: 'How much data you can afford to lose, measured backwards from the failure.',
    whatItIs:
      'RPO is the maximum age of the data you are willing to come back with. An RPO of one hour means that when the system returns, the most recent hour of writes may be gone and the business has accepted that. Because it describes data loss, RPO is set by how often you copy data somewhere safe — the interval between snapshots, or the lag of a replication stream.',
    keyIdea:
      'RPO looks backwards and buys replication frequency. Your RPO is, in practice, the gap between your copies: hourly snapshots give you an RPO of an hour, continuous replication gives you an RPO of seconds.',
    onTheExam: [
      '"No more than 15 minutes of data may be lost" is an RPO, and it rules out anything backed up nightly.',
      '"Near-zero RPO" is continuous replication: read replicas, S3 Cross-Region Replication, Aurora Global Database, or AWS Elastic Disaster Recovery.',
      'When only an RPO is stated and the recovery time is unconstrained, the cheapest correct answer is usually backup and restore with a short enough backup interval.',
    ],
    keyNumbers: [
      {
        label: 'Backup and restore',
        value: 'RPO of hours',
        note: 'Set by the backup schedule.',
      },
      { label: 'Pilot light', value: 'RPO of minutes' },
      { label: 'Warm standby', value: 'RPO of seconds' },
      { label: 'Multi-site active-active', value: 'RPO near zero' },
      {
        label: 'Aurora Global Database',
        value: 'Typical replication lag under 1 second',
        note: 'The usual answer to a near-zero cross-Region RPO for a relational store.',
      },
    ],
    examTraps: [
      'RPO and RTO get swapped more often than any other pair on this exam. RPO is the P for "point in time you can return to" — it is about data. RTO is the T for time — it is about downtime.',
      'A Multi-AZ RDS deployment gives you a very low RPO for an AZ failure and none at all for a Region failure. Check which failure the stem describes before choosing.',
      'Snapshots are point-in-time, so the RPO is the snapshot interval, not the restore speed. An hourly snapshot cannot meet a five-minute RPO however fast the restore is.',
    ],
    confusedWith: [
      {
        slug: 'rto',
        difference:
          'RPO is data lost, measured backwards from the failure. RTO is time down, measured forwards from it. RPO buys replication; RTO buys standby capacity.',
      },
      {
        slug: 'backup-vs-replication',
        difference:
          'RPO is the target. Backup and replication are the two mechanisms that meet it, and which one you need is decided by how small the number is.',
      },
    ],
    serviceSlugs: ['backup', 'rds', 'aurora', 's3', 'ebs', 'dynamodb'],
    related: ['rto', 'dr-strategies', 'backup-vs-replication', 'multi-az-vs-multi-region'],
    docsUrl:
      'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html',
  },
  {
    slug: 'rto',
    term: 'Recovery Time Objective',
    abbr: 'RTO',
    aka: ['RTO', 'acceptable downtime'],
    group: 'resilience',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner: 'How long you can afford to be down, measured forwards from the failure.',
    whatItIs:
      'RTO is the maximum time between the failure and the service answering requests again. An RTO of 15 minutes means everything — detection, decision, failover, DNS propagation, warm-up — has to fit inside a quarter of an hour. Because it describes downtime, RTO is set by how much of the recovery environment is already running before the failure happens.',
    keyIdea:
      'RTO looks forwards and buys idle capacity. The only way to recover in minutes is for the replacement to already exist, which is why a low RTO always costs more than a low RPO.',
    onTheExam: [
      '"The application must be serving traffic again within 10 minutes" is an RTO, and it rules out restoring from backup.',
      '"Near-zero RTO" means something is already running and taking traffic: Multi-AZ, warm standby, or multi-site active-active.',
      '"The cheapest option that meets a 4-hour RTO" is an instruction not to buy warm standby — pilot light or backup and restore is the intended answer.',
    ],
    keyNumbers: [
      { label: 'Backup and restore', value: 'RTO of hours' },
      { label: 'Pilot light', value: 'RTO of tens of minutes' },
      { label: 'Warm standby', value: 'RTO of minutes' },
      { label: 'Multi-site active-active', value: 'RTO near zero' },
      {
        label: 'RDS Multi-AZ failover',
        value: 'Typically 60–120 seconds',
        note: 'Automatic, and within one Region only.',
        volatile: true,
      },
    ],
    examTraps: [
      'DNS time-to-live is part of your RTO. A Route 53 failover with a 300-second TTL cannot deliver a 60-second RTO, and the exam does test this.',
      'A low RTO does not imply a low RPO. Pilot light restores fast once triggered but can still lose everything since the last replication tick — read both numbers separately.',
      'Auto Scaling replacing a failed instance is not disaster recovery, it is high availability. If the stem describes losing a Region, Auto Scaling is a distractor.',
    ],
    confusedWith: [
      {
        slug: 'rpo',
        difference:
          'RTO is time down, measured forwards from the failure. RPO is data lost, measured backwards. RTO buys standby capacity; RPO buys replication.',
      },
      {
        slug: 'high-availability-vs-fault-tolerance',
        difference:
          'RTO is a target you are given. High availability and fault tolerance are properties of a design — a fault-tolerant design has an RTO of zero because nothing went down.',
      },
    ],
    serviceSlugs: ['route53', 'ec2-auto-scaling', 'elb', 'rds', 'cloudformation'],
    related: ['rpo', 'dr-strategies', 'failover', 'high-availability-vs-fault-tolerance'],
    docsUrl:
      'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html',
  },
  {
    slug: 'dr-strategies',
    term: 'The four disaster recovery strategies',
    aka: ['backup and restore', 'pilot light', 'warm standby', 'multi-site active-active'],
    group: 'resilience',
    certs: ['SAA-C03'],
    oneLiner: 'Four named designs, ordered by what is already running when nothing has failed.',
    whatItIs:
      'AWS names four DR strategies and the exam expects you to map a stated RTO and RPO onto one of them. Backup and restore keeps copies and nothing else. Pilot light keeps the data replicated and the compute switched off. Warm standby keeps a scaled-down but live copy serving nothing. Multi-site active-active runs full capacity in both places, both taking traffic.',
    keyIdea:
      'The four strategies differ in one variable: how much is already running while everything is fine. That is what you are buying, and it is why cost rises in the same order as recovery speed.',
    onTheExam: [
      'Read the numbers first, then pick: hours to backup and restore, tens of minutes to pilot light, minutes to warm standby, near zero to active-active.',
      '"Cheapest that meets the requirement" means the leftmost strategy that still fits, never the most resilient one.',
      '"The standby must handle production load immediately" rules out pilot light and usually warm standby too.',
    ],
    keyNumbers: [
      { label: 'Backup and restore', value: 'RPO hours · RTO hours · nothing running' },
      { label: 'Pilot light', value: 'RPO minutes · RTO tens of minutes · data live, compute off' },
      { label: 'Warm standby', value: 'RPO seconds · RTO minutes · a scaled-down live copy' },
      { label: 'Multi-site active-active', value: 'RPO near zero · RTO near zero · both live' },
    ],
    examTraps: [
      'Pilot light and warm standby are separated by one thing: in pilot light the compute is off, in warm standby it is running but small. A stem saying "a minimal version is always running" is warm standby.',
      'Active-active is the answer far less often than it looks. Unless the stem asks for near-zero downtime or serving from both Regions, it is the over-engineered distractor.',
      'A DR strategy is not tested until you have run a failover. A question about "how do we know it works" is asking for a regular DR drill, not more replication.',
    ],
    confusedWith: [
      {
        slug: 'multi-az-vs-multi-region',
        difference:
          'The four strategies describe how much standby you keep. Multi-AZ versus multi-Region describes how far apart you keep it. A stem gives you both dimensions.',
      },
    ],
    serviceSlugs: ['backup', 'cloudformation', 'route53', 'aurora', 's3'],
    related: ['rto', 'rpo', 'failover', 'multi-az-vs-multi-region'],
    docsUrl:
      'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html',
  },
  {
    slug: 'high-availability-vs-fault-tolerance',
    term: 'High availability versus fault tolerance',
    group: 'resilience',
    certs: ['SAA-C03'],
    oneLiner: 'Recovering quickly from a failure, versus not being affected by one at all.',
    whatItIs:
      'A highly available design detects a failure and recovers from it fast — with a brief interruption. A fault-tolerant design absorbs the failure with no interruption at all, because the redundancy was already carrying load. Multi-AZ RDS is highly available: there is a failover, and it takes a minute or two. An Auto Scaling group behind a load balancer across three AZs is closer to fault tolerant: losing one AZ drops no requests.',
    keyIdea:
      'High availability tolerates a short outage; fault tolerance tolerates none. The exam signals which it wants with words like "minimal downtime" against "no interruption to users".',
    onTheExam: [
      '"No downtime" or "no impact to users" is asking for fault tolerance — active redundancy, not a standby.',
      '"Minimise downtime" accepts a failover, so Multi-AZ and similar answers are in scope.',
      'Disaster recovery is a third thing again: it is about surviving the loss of a whole Region, not a component.',
    ],
    keyNumbers: [
      {
        label: 'Availability targets',
        value: '99.9% ≈ 8.8 h/year · 99.99% ≈ 52 min/year · 99.999% ≈ 5 min/year',
        note: 'Each extra nine costs roughly an order of magnitude more.',
      },
      {
        label: 'Serial components',
        value: 'Availabilities multiply',
        note: 'Two 99.9% components in series give 99.8%, which is why dependencies matter.',
      },
    ],
    examTraps: [
      'Redundancy that is not actually independent buys nothing. Three instances in one AZ, or three AZs behind one NAT gateway, still have a single point of failure.',
      'A backup is neither. It is a recovery mechanism with an RTO measured in hours, and it never answers an availability question.',
    ],
    confusedWith: [
      {
        slug: 'dr-strategies',
        difference:
          'Availability is about surviving component and AZ failures inside a Region. Disaster recovery is about surviving the loss of the Region itself.',
      },
    ],
    serviceSlugs: ['elb', 'ec2-auto-scaling', 'rds', 'route53'],
    related: ['availability-zone', 'rto', 'failover', 'blast-radius'],
    docsUrl: 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html',
  },
  {
    slug: 'multi-az-vs-multi-region',
    term: 'Multi-AZ versus multi-Region',
    group: 'resilience',
    certs: ['SAA-C03'],
    oneLiner: 'How far apart the redundancy is, and therefore what failure it survives.',
    whatItIs:
      'Multi-AZ spreads a workload across Availability Zones inside one Region: cheap, low-latency, mostly a configuration flag, and it survives losing a data centre. Multi-Region duplicates the workload in another Region: expensive, latency-bound, needs explicit replication and a failover mechanism, and it survives losing the Region or meets a data-residency or global-latency requirement.',
    keyIdea:
      'Multi-AZ is the default answer for availability, and multi-Region is only correct when the stem names a Region-level failure, a legal requirement, or users on another continent. Reaching for multi-Region unprompted is the most expensive wrong answer on the paper.',
    onTheExam: [
      '"Survive an AZ outage", "highly available", "no single data centre" — Multi-AZ.',
      '"Survive a Region outage", "continue if us-east-1 is unavailable" — multi-Region.',
      '"Users in three continents complain about latency" — multi-Region or an edge service, depending on whether the content is cacheable.',
    ],
    keyNumbers: [
      { label: 'Inter-AZ latency', value: 'Single-digit milliseconds' },
      {
        label: 'Inter-Region latency',
        value: 'Tens to hundreds of milliseconds',
        note: 'Why synchronous cross-Region writes are generally not an option.',
      },
      {
        label: 'RDS Multi-AZ',
        value: 'Synchronous standby, automatic failover, same Region',
        note: 'Cross-Region needs a read replica you promote yourself.',
      },
    ],
    examTraps: [
      'Multi-AZ RDS does not scale reads and does not survive a Region failure. Two different distractors are built on that one sentence.',
      'S3 is already resilient across AZs within a Region. Cross-Region Replication is for Region failure, latency or compliance — not durability.',
      'DynamoDB global tables and Aurora Global Database are the multi-Region answers for their engines; a plain read replica is the cheaper, more manual one.',
    ],
    confusedWith: [
      {
        slug: 'dr-strategies',
        difference:
          'This is the distance dimension. The four strategies are the how-much-is-running dimension. A warm standby can be in another AZ or another Region.',
      },
    ],
    serviceSlugs: ['rds', 'aurora', 'dynamodb', 's3', 'route53'],
    related: ['availability-zone', 'region', 'dr-strategies', 'rto'],
    docsUrl:
      'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html',
  },
  {
    slug: 'failover',
    term: 'Failover',
    group: 'resilience',
    certs: ['SAA-C03'],
    oneLiner: 'Moving traffic from a failed component to a healthy one, and how long that takes.',
    whatItIs:
      'Failover is the mechanism that redirects work when something breaks: a load balancer stops sending requests to an unhealthy target, RDS promotes its standby, Route 53 answers with the secondary record, Auto Scaling replaces a terminated instance. Every failover has a detection time and a switch time, and the sum of the two is most of your RTO.',
    keyIdea:
      'Failover time is detection plus switching, and detection is usually the larger half. Health check interval, failure threshold and DNS TTL are the three dials the exam expects you to know are part of the total.',
    onTheExam: [
      'A question where "failover works but takes too long" is about health check frequency, the unhealthy threshold, or the DNS TTL — not about adding more capacity.',
      'Route 53 failover routing needs a health check on the primary record; without one it will not fail over at all.',
      'Connection draining, called deregistration delay on an ALB, is why removing a target is not instant.',
    ],
    keyNumbers: [
      {
        label: 'ELB health check',
        value: 'Interval and threshold are configurable; detection is interval × threshold',
      },
      {
        label: 'Route 53 health check',
        value: '30 seconds standard, 10 seconds fast',
        volatile: true,
      },
      { label: 'Deregistration delay', value: '300 seconds by default', volatile: true },
      { label: 'RDS Multi-AZ failover', value: 'Typically 60–120 seconds', volatile: true },
    ],
    examTraps: [
      'A long DNS TTL silently caps how fast any DNS-based failover can be. Clients keep using the cached answer for the whole TTL.',
      'A health check that only tests whether the port is open will happily keep sending traffic to an application that is returning errors. When the stem says the application is unhealthy but traffic still arrives, the check is at the wrong layer.',
      'Failing over is easy; failing back is what the exam sometimes asks about, and it usually needs the replication direction reversed first.',
    ],
    confusedWith: [
      {
        slug: 'rto',
        difference:
          'Failover is the mechanism; RTO is the target it has to fit inside. Detection plus switching plus DNS propagation is what you compare against the RTO.',
      },
    ],
    serviceSlugs: ['route53', 'elb', 'rds', 'ec2-auto-scaling', 'aurora'],
    related: ['rto', 'high-availability-vs-fault-tolerance', 'dr-strategies'],
    docsUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-types.html',
  },
  {
    slug: 'blast-radius',
    term: 'Blast radius',
    group: 'resilience',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner: 'How much breaks when one thing breaks — and the boundaries you use to limit it.',
    whatItIs:
      'Blast radius is the scope of damage from a single failure, mistake or compromise. AWS gives you boundaries to contain it at several scales: the Availability Zone for physical failure, the account for permissions and quotas, the Region for regional events, the cell or shard for a noisy tenant. Choosing a boundary is choosing what a single bad event can take down.',
    keyIdea:
      'Every boundary you add costs coordination and buys containment. The exam usually wants the account boundary for isolation between environments or teams, and the AZ boundary for physical failure.',
    onTheExam: [
      '"Isolate production from development" is separate accounts under Organizations, not separate VPCs.',
      '"One customer\'s traffic must not affect the others" is sharding, throttling or separate cells.',
      '"A compromised credential must not affect other workloads" is a smaller permission scope or a separate account.',
    ],
    keyNumbers: [
      {
        label: 'Boundaries, smallest first',
        value: 'Instance · AZ · VPC · Region · account · organization',
        note: 'Quotas are per-account per-Region, which is itself a containment property.',
      },
    ],
    examTraps: [
      'A VPC is a network boundary, not a permission or quota boundary. Isolation questions that mention IAM or service limits want separate accounts.',
      'Sharing one account across environments means one runaway workload can exhaust a quota that production also needs.',
    ],
    confusedWith: [
      {
        slug: 'least-privilege',
        difference:
          'Least privilege limits what one identity may do. Blast radius limits how much one failure or compromise can reach, whoever caused it.',
      },
    ],
    serviceSlugs: ['organizations', 'control-tower', 'iam', 'vpc'],
    related: [
      'availability-zone',
      'high-availability-vs-fault-tolerance',
      'least-privilege',
      'quota-vs-limit',
    ],
    docsUrl:
      'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/use-bulkhead-architectures-to-limit-scope-of-impact.html',
  },
]
