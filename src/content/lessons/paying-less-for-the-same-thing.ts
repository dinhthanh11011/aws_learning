import type { Lesson } from '../schema'

/**
 * The cost-optimisation questions on domain 4 are not a price list. They give
 * you the *shape* of a workload — runs every hour, or comes and goes, or must
 * never be interrupted — and every purchase option is the answer to exactly
 * one of those shapes.
 *
 * So the picture is the shape, not the prices: the same fleet, forked on one
 * question asked of each hour of capacity, and the discount arriving at the
 * end of each branch as a consequence rather than as a choice. The word
 * "commitment" is not used until the reader has seen what is being committed.
 *
 * The wrong answer is written as a real mixed-instances policy with the base
 * capacity set to zero, because "Spot is not a cheaper On-Demand you can rely
 * on" is a sentence and `OnDemandBaseCapacity: 0` under an SLA is a mistake
 * you can point at.
 *
 * The `optionSet` on `ec2` already holds the eight purchase options
 * (invariant 21), so `compare` takes the axis it cannot: the phrase in the
 * stem, and the option next to it that is there to be eliminated.
 */
export const payingLessForTheSameThing: Lesson = {
  id: 'paying-less-for-the-same-thing',
  families: ['saa'],
  taskId: 'saa-4.2',
  cluster: 'data-and-cost',
  title: 'Paying less for the same thing',
  subtitle:
    'None of these change what is running. They are billing constructs, and each one is the answer to a different sentence about the *shape* of the workload — which is why a cost question is really a comprehension question about the stem.',
  minutes: 15,
  tier: 1,
  serviceSlugs: ['ec2', 'spot', 'savings-plans'],
  requires: [],
  cardIds: [
    'optset:ec2:purchase-option',
    'opt:ec2:purchase-option:on-demand',
    'opt:ec2:purchase-option:reserved-instances-standard',
    'opt:ec2:purchase-option:reserved-instances-convertible',
    'opt:ec2:purchase-option:savings-plans',
    'opt:ec2:purchase-option:spot-instances',
    'opt:ec2:purchase-option:on-demand-capacity-reservations',
    'trap:opt:ec2:purchase-option:savings-plans',
    'trap:opt:ec2:purchase-option:spot-instances',
    'trap:opt:ec2:purchase-option:reserved-instances-standard',
    'trap:opt:ec2:purchase-option:on-demand-capacity-reservations',
    'num:savings-plans:discount',
    'num:savings-plans:terms',
    'num:savings-plans:compute-savings-plans',
    'num:savings-plans:ec2-instance-savings-plans',
    'num:savings-plans:standard-vs-convertible-ri',
    'num:savings-plans:sharing',
    'num:savings-plans:resale',
    'trap:savings-plans:compute-savings-plans-covering-fargate-and-lambda-is-a-commo',
    'trap:savings-plans:savings-plans-cannot-be-sold-or-cancelled-if-flexibility-to',
    'trap:savings-plans:the-classic-cost-optimised-architecture-is-a-savings-plan-or',
    'trap:savings-plans:for-rds-redshift-elasticache-and-opensearch-the-mechanism',
    'trap:savings-plans:commitments-are-shared-across-the-organisation-by-default-w',
    'num:spot:discount',
    'num:spot:interruption-notice',
    'num:spot:spot-blocks',
    'num:spot:allocation-strategy',
    'trap:spot:the-exam-signal-for-spot-is-fault-tolerant-interruptible',
    'trap:spot:a-mixed-instances-asg-policy-with-an-on-demand-base-capacity',
    'trap:spot:spot-does-not-mean-cheaper-on-demand-you-can-rely-on-any',
    'vs:spot:savings-plans',
    'vs:savings-plans:spot',
    'trigger:t-interruptible',
    'trigger:t-steady-commit',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'Nothing on this page changes a single thing about what is running. [[savings-plans|Savings Plans]] and Reserved Instances are billing constructs, not resources — you buy one and no instance starts, stops or moves. [[spot|Spot]] is the same [[ec2|EC2]] hardware at a different price and one extra condition. Which is why a cost-optimisation question is never asking you to price anything: it is asking you to read the *shape* of the workload out of the stem, because each option is the answer to exactly one shape.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'plst-two-bands',
        title: 'One fleet, and one question asked of each hour of capacity in it',
        caption:
          'Nothing about the instances differs — same family, same AMI, same work. What differs is the answer to one question about the hour they run in, and the discount follows from that answer rather than being chosen.',
        // Template B, fan-in-the-middle: two parallel tails that are the same
        // journey with a different object at the junction.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'fleet',
            label: 'Your fleet',
            sub: 'hour by hour',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'question',
            label: 'Ask of each hour',
            sub: 'will it run tomorrow too?',
            kind: 'note',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'baseline',
            label: 'Yes, every hour',
            sub: 'for the next year',
            kind: 'note',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'burst',
            label: 'No, it comes and goes',
            sub: 'and it can be retried',
            kind: 'note',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'savings-plans',
            label: 'Commit to it',
            sub: 'up to ~72% off',
            kind: 'service',
            category: 'cost',
            x: 17,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'spot',
            label: 'Bid for spare',
            sub: 'up to ~90% off',
            kind: 'service',
            category: 'compute',
            x: 17,
            y: 5.7,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'measure', from: 'fleet', to: 'question', label: 'the curve', tone: 'default' },
          { id: 'is-floor', from: 'question', to: 'baseline', label: 'always on', tone: 'ok' },
          { id: 'is-peak', from: 'question', to: 'burst', label: 'sometimes', tone: 'info' },
          { id: 'buy', from: 'baseline', to: 'savings-plans', label: '1 or 3 yr', tone: 'ok' },
          { id: 'bid', from: 'burst', to: 'spot', label: 'no promise', tone: 'info' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['measure'],
            title: 'Start from the demand curve, not from the price list',
            detail:
              'Every hour of capacity in the fleet is either part of a floor that never goes away, or part of a peak that does. On-Demand prices both as though you might switch them off this afternoon — honest for one of them, expensive for the other.',
            tone: 'default',
          },
          {
            edgeIds: ['is-floor', 'buy'],
            title: 'The floor has run every hour for a year, and it will run for another',
            detail:
              'Promise AWS a term of **1 or 3 years** and the rate drops by up to **~72%** for a 3-year all-upfront commitment. Nothing about the instances changes. You have sold flexibility you were not using.',
            tone: 'ok',
          },
          {
            edgeIds: ['is-peak', 'bid'],
            title: 'The peak comes and goes, and losing a node mid-flight costs nothing',
            detail:
              'That is a different thing to sell: not the promise to keep running, but the willingness to stop. Spare capacity at up to **~90% off**, reclaimable at any time with a **two-minute** notice — and the whole Spot decision is whether that sentence is survivable.',
            tone: 'info',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the names, and what each one actually promises',
      md: 'A **Savings Plan** commits to a **dollar-per-hour spend**, not to instances — Compute Savings Plans are the flexible kind, covering any family, size, Region, OS and tenancy, and covering Fargate and Lambda as well; EC2 Instance Savings Plans discount more and lock you to one family in one Region. A **Reserved Instance** commits to specific instance attributes instead: Standard discounts more, Convertible can be exchanged for different attributes. **Spot** commits to nothing at all and is priced accordingly. And whatever remains, that none of those sentences describe, stays **On-Demand** — the baseline every discount is quoted against.',
    },

    /* ── 3. The three bands, as the thing you actually configure ──────────── */
    { kind: 'heading', text: 'The same idea, as the policy you actually write' },
    {
      kind: 'code',
      lang: 'yaml',
      caption: 'A fleet behind a load balancer, with an SLA, made "as cheap as possible"',
      code: `# "Spot is 90% off, so make the whole group Spot"
MixedInstancesPolicy:
  InstancesDistribution:
    OnDemandBaseCapacity: 0
    OnDemandPercentageAboveBaseCapacity: 0
                                         ^
     Every instance in the group is now interruptible, including the ones
     the SLA depends on. Spot is not a cheaper On-Demand you can rely on.`,
    },
    {
      kind: 'code',
      lang: 'yaml',
      caption: 'The shape the exam is describing when it says "cheap, but never below N"',
      code: `MixedInstancesPolicy:
  InstancesDistribution:
    OnDemandBaseCapacity: 4
    OnDemandPercentageAboveBaseCapacity: 20
    SpotAllocationStrategy: price-capacity-optimized`,
    },
    {
      kind: 'steps',
      title: 'Three lines, and a fourth thing that is not in the file at all',
      items: [
        {
          title: 'The base capacity is the floor, and it is the reason the group has an SLA',
          md: 'Four instances that are never Spot and therefore never reclaimed. A mixed-instances policy with an On-Demand base capacity plus Spot above it is the standard answer to "as cheap as possible, but it must never drop below N instances" — and the base is the half of that sentence people forget to configure.',
        },
        {
          title: 'The percentage above the base is how much of the burst you are unwilling to risk',
          md: 'A fifth of everything above four instances stays On-Demand; the rest is Spot. This is the dial the stem is describing when it talks about tolerating some interruption but not a cliff.',
        },
        {
          title: 'The allocation strategy is a fewer-interruptions setting, not a cheaper one',
          md: '`price-capacity-optimized` is the recommended default because it draws from pools with spare capacity as well as low price, so it is interrupted less often than a strategy that only chases the lowest price.',
        },
        {
          title: 'And the discount on those four base instances is nowhere in this file',
          md: 'It cannot be. A Savings Plan or Reserved Instance is a billing construct applied to usage after the fact, so the same template runs identically whether or not one has been bought. That is the whole reason cost questions and architecture questions can be answered separately.',
        },
      ],
    },

    /* ── 4. The traps ─────────────────────────────────────────────────────── */
    { kind: 'heading', text: 'Five things the paper checks that the price page does not say' },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Compute Savings Plans are not EC2-only',
      md: 'They cover **Fargate and Lambda** too, which is the commonly missed fact and the one that decides between the two plan types: flexibility in the question means a **Compute** Savings Plan, a fixed family means an **EC2 Instance** Savings Plan. A Savings Plan commits money rather than instances, which is precisely why it can span three services.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'A Savings Plan is a one-way door; a Standard RI is not',
      md: '**Savings Plans cannot be sold or cancelled.** If the ability to exit matters — a re-architecture is planned, or the workload may not survive the term — the answer is a **Convertible RI**, which can be exchanged for different attributes, or a **Standard RI**, which can be sold on the Marketplace. That resale route is an escape hatch a question sometimes hangs on, and Savings Plans do not have it.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Not everything takes a Savings Plan',
      md: 'For **RDS, Redshift, ElastiCache and OpenSearch** the mechanism is **Reserved Instances** — Savings Plans do not apply. An option offering a Savings Plan for a database commitment is wrong on the mechanism, whatever the numbers say.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'A discount is not a capacity guarantee',
      md: 'A Savings Plan buys no capacity reservation — that is the one thing Reserved Instances still do better, and a **Standard RI carries a capacity reservation in a specific Availability Zone**. If capacity must be guaranteed with no long commitment, an **On-Demand Capacity Reservation** does it, billed at On-Demand rates whether or not the capacity is used and offering no discount at all. Combine it with a Savings Plan when a question wants both.',
    },
    {
      kind: 'callout',
      tone: 'money',
      title: 'And they are shared across the organisation by default',
      md: 'Both Savings Plans and Reserved Instances apply across an [[organizations|Organizations]] family by default, which is one of the practical reasons to consolidate billing — an unused commitment in one account is absorbed by another rather than wasted. It is controlled from the management account.',
    },

    /* ── 5. Compare, last, on the axis the option set cannot carry ────────── */
    {
      kind: 'compare',
      title: 'The phrase in the stem, and the option waiting next to it',
      columns: ['What the phrase is asking for', 'The option that is there to be eliminated'],
      rows: [
        {
          label: '"Steady state, predictable for the next three years"',
          cells: [
            'A Savings Plan — or an RI, for RDS, Redshift, ElastiCache and OpenSearch',
            'Spot, which discounts interruptibility and not steadiness',
          ],
        },
        {
          label: '"Fault-tolerant, flexible start and end times, lowest cost"',
          cells: [
            'Spot, usually as the elastic portion above a committed baseline',
            'A commitment, which cannot price work that may not run',
          ],
        },
        {
          label: '"Cheap, but never fewer than N instances"',
          cells: [
            'A mixed-instances policy with an On-Demand base capacity',
            'An all-Spot group, which has no floor the SLA can rest on',
          ],
        },
        {
          label: '"The instance family may need to change during the term"',
          cells: [
            'A Compute Savings Plan, or a Convertible RI for a smaller discount',
            'A Standard RI, which is locked to the family it was bought for',
          ],
        },
        {
          label: '"We may need to exit the commitment early"',
          cells: [
            'A Standard RI, which can be sold on the Marketplace',
            'A Savings Plan, which can be neither sold nor cancelled',
          ],
        },
        {
          label: '"Capacity must be guaranteed in one Availability Zone"',
          cells: [
            'An On-Demand Capacity Reservation, or a Standard RI in that AZ',
            'A Savings Plan, which lowers the rate and reserves nothing',
          ],
        },
        {
          label: '"The workload also runs on Fargate and Lambda"',
          cells: [
            'A Compute Savings Plan, which commits spend rather than instances',
            'An EC2 Instance Savings Plan, locked to one family in one Region',
          ],
        },
      ],
    },

    /* ── 6. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'Savings Plans discount',
          value: 'Up to ~72% versus On-Demand for a 3-year all-upfront commitment',
        },
        { label: 'Terms', value: '1 or 3 years · No Upfront, Partial Upfront, or All Upfront' },
        {
          label: 'Compute Savings Plans',
          value: 'Most flexible — any family, size, Region, OS, tenancy; covers Fargate and Lambda',
        },
        {
          label: 'EC2 Instance Savings Plans',
          value: 'Bigger discount, locked to one family in one Region',
        },
        {
          label: 'Standard vs Convertible RI',
          value: 'Standard discounts more; Convertible can be exchanged for different attributes',
        },
        { label: 'Sharing', value: 'Both apply across an Organizations family by default' },
        {
          label: 'Resale',
          value: 'Standard RIs can be sold on the Marketplace; Savings Plans cannot',
        },
        { label: 'Spot discount', value: 'Up to ~90% vs On-Demand' },
        { label: 'Spot interruption notice', value: '2 minutes' },
        {
          label: 'Spot allocation strategy',
          value: 'price-capacity-optimized is the recommended default',
          note: 'Fewer interruptions than the lowest-price strategy.',
        },
        { label: 'Spot blocks', value: 'No longer offered to new customers' },
      ],
    },

    /* ── 7. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['savings-plans', 'spot', 'ec2'],
    },
    {
      kind: 'prose',
      md: 'Two purchase options were deliberately left out, because they are not about paying less at all. **Dedicated Instances** isolate hardware at the account level and give you no visibility of the host; **Dedicated Hosts** expose sockets, cores and the host id so a per-socket or per-core licence can be honoured. If a question mentions bring-your-own-licence for Windows Server or Oracle, Dedicated Instances is the trap and Dedicated Hosts is the answer — and neither of them is a discount.',
    },
  ],

  checks: [
    {
      id: 'paying-less-for-the-same-thing-shape',
      prompt:
        'A nightly video-encoding job runs for four hours, checkpoints its progress, and has no deadline beyond "by morning". What should it run on?',
      options: [
        {
          text: 'Spot Instances, because the work is interruptible and has flexible timing',
          correct: true,
          why: '"Fault-tolerant", "can be interrupted" and "flexible start and end times" is the phrasing that means Spot. Checkpointing is what makes losing a node mid-flight cost nothing.',
        },
        {
          text: 'A three-year Compute Savings Plan sized to the nightly peak',
          correct: false,
          why: 'A commitment discounts steady usage. Four hours a night is not steady, and paying a per-hour commitment for capacity you use a sixth of the time is worse than On-Demand.',
        },
        {
          text: 'On-Demand Capacity Reservations, so the capacity is there when the job starts',
          correct: false,
          why: 'A reservation guarantees capacity at On-Demand rates and offers no discount. The job has no hard start time, so there is nothing to guarantee.',
        },
      ],
    },
    {
      id: 'paying-less-for-the-same-thing-floor',
      prompt:
        'A production web tier must never run fewer than six instances, and the team wants the traffic peaks above that to be as cheap as possible. What expresses this?',
      options: [
        {
          text: 'A mixed-instances policy with an On-Demand base capacity of six and Spot above it',
          correct: true,
          why: 'The base capacity is the floor that is never reclaimed, and Spot handles the elastic portion. That combination is the standard answer to "cheap but must never drop below N".',
        },
        {
          text: 'An all-Spot Auto Scaling group with price-capacity-optimized allocation',
          correct: false,
          why: 'The allocation strategy reduces how often instances are interrupted; it does not stop them being interrupted. Nothing here guarantees the six instances the requirement names.',
        },
        {
          text: 'A three-year Savings Plan covering the peak, with On-Demand underneath it',
          correct: false,
          why: 'That is backwards. A commitment fits the part that runs every hour — the floor — and the part that comes and goes is what should be discounted by interruptibility instead.',
        },
      ],
    },
    {
      id: 'paying-less-for-the-same-thing-flexibility',
      prompt:
        'A steady workload will run for three years, but it spans EC2, Fargate and Lambda and the instance families are expected to change. Which commitment fits?',
      options: [
        {
          text: 'A Compute Savings Plan, which commits a dollar-per-hour spend across all three',
          correct: true,
          why: 'Compute Savings Plans are the flexible kind — any family, size, Region, OS and tenancy — and they cover Fargate and Lambda, which is the commonly missed fact this question is built on.',
        },
        {
          text: 'An EC2 Instance Savings Plan, which discounts more for the same term',
          correct: false,
          why: 'The bigger discount is bought by locking to one family in one Region, and it covers neither Fargate nor Lambda. Flexibility in the stem is what rules it out.',
        },
        {
          text: 'Standard Reserved Instances, which also carry a capacity reservation',
          correct: false,
          why: 'Standard RIs commit to specific instance attributes and cannot be exchanged for a different family, and Reserved Instances do not apply to Fargate or Lambda at all.',
        },
      ],
    },
    {
      id: 'paying-less-for-the-same-thing-exit',
      prompt:
        'A finance team wants a three-year commitment but insists on being able to get out of it if the platform is re-architected. What should you recommend?',
      options: [
        {
          text: 'Convertible RIs to exchange attributes, or Standard RIs which can be sold on the Marketplace',
          correct: true,
          why: 'Savings Plans can be neither sold nor cancelled, so when the ability to exit is the requirement the answer moves to Reserved Instances — Convertible for exchange, Standard for resale.',
        },
        {
          text: 'A Compute Savings Plan, which can be cancelled with notice to AWS',
          correct: false,
          why: 'It cannot. A Savings Plan is a one-way door for its whole term, which is exactly why this question exists.',
        },
        {
          text: 'No commitment at all — stay On-Demand until the re-architecture is decided',
          correct: false,
          why: 'That answers the exit requirement by giving up the discount entirely, when Convertible or Standard RIs satisfy both halves of what was asked.',
        },
      ],
    },
  ],
}
