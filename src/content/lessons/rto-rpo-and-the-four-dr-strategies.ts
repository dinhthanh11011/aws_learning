import type { Lesson } from '../schema'

/**
 * RPO and RTO get swapped more often than any other pair on this paper, and the
 * reason is that both are usually *defined* — backwards, forwards, data, time —
 * before either has been seen. So this lesson refuses to define them first: one
 * failure is drawn on a line, and the two arrows leaving it point in opposite
 * directions. Only then do they get their names.
 *
 * The four strategies then arrive as a walkthrough rather than a table, because
 * the sequence really is the teaching: each rung is the previous rung with one
 * more thing already switched on, and the cost rises for exactly that reason.
 * The concept's `keyNumbers` already hold the rung-by-rung table (invariant 21's
 * argument applies to any derived table), so the `compare` here is on the axis
 * a table cannot carry — the sentence in the stem, and the distractor beside it.
 */
export const rtoRpoAndTheFourDrStrategies: Lesson = {
  id: 'rto-rpo-and-the-four-dr-strategies',
  families: ['saa'],
  taskId: 'saa-2.2',
  title: 'Two numbers choose the architecture',
  subtitle:
    'A disaster recovery question is arithmetic wearing a scenario. Two numbers are stated, four designs are available, and the mark goes to the cheapest one that clears both — not the most resilient one on the list.',
  minutes: 14,
  tier: 1,
  serviceSlugs: ['rds', 'route53', 'aurora'],
  requires: ['multi-az-vs-read-replica'],
  cardIds: [
    'idea:rpo',
    'idea:rto',
    'idea:dr-strategies',
    'define:rpo',
    'define:rto',
    'num:concept:dr-strategies:backup-and-restore',
    'num:concept:dr-strategies:pilot-light',
    'num:concept:dr-strategies:warm-standby',
    'num:concept:dr-strategies:multi-site-active-active',
    'trap:concept:rpo:rpo-and-rto-get-swapped-more-often-than-any-other-pair-on-th',
    'trap:concept:rpo:snapshots-are-point-in-time-so-the-rpo-is-the-snapshot-inte',
    'trap:concept:rto:dns-time-to-live-is-part-of-your-rto-a-route-53-failover-wi',
    'trap:concept:rto:a-low-rto-does-not-imply-a-low-rpo-pilot-light-restores-fas',
    'trap:concept:rto:auto-scaling-replacing-a-failed-instance-is-not-disaster-rec',
    'trap:concept:dr-strategies:pilot-light-and-warm-standby-are-separated-by-one-thing-in',
    'trap:concept:dr-strategies:active-active-is-the-answer-far-less-often-than-it-looks-un',
    'trap:concept:dr-strategies:a-dr-strategy-is-not-tested-until-you-have-run-a-failover-a',
    'trap:concept:multi-az-vs-multi-region:multi-az-rds-does-not-scale-reads-and-does-not-survive-a-reg',
    'num:concept:rpo:aurora-global-database',
    'vs:concept:rpo:rto',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'A disaster recovery stem hands you two numbers and four options. The numbers are the whole question — and they are also the pair that gets swapped more often than anything else on this exam, usually because both were learnt as definitions rather than seen. So before either of them is named, here is one failure on a line, and the two directions you can walk away from it.',
    },

    /* ── 2. One failure, two directions, before either has a name ─────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'drs-two-directions',
        title: 'One failure, and the two things it costs you',
        caption:
          'Both arrows start at the same instant. They point in opposite directions, and each one is bought with a different thing: one with copies, one with idle capacity.',
        // Template B without a fan — a plain chain, spaced so both labels land
        // in the gaps between boxes.
        cols: 19,
        rows: 3,
        nodes: [
          {
            id: 'lastcopy',
            label: 'Last copy taken',
            sub: 'a snapshot, or a replication tick',
            kind: 'data',
            x: 0.2,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'boom',
            label: 'The failure',
            sub: 't = 0',
            kind: 'note',
            x: 7,
            y: 1.4,
            w: 3,
            h: 1.3,
          },
          {
            id: 'serving',
            label: 'Serving again',
            sub: 'requests answered',
            kind: 'note',
            x: 14,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'back', from: 'lastcopy', to: 'boom', label: 'data lost', tone: 'bad' },
          { id: 'fwd', from: 'boom', to: 'serving', label: 'time down', tone: 'warn' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['back'],
            title: 'Backwards: everything written since the last copy is gone',
            detail:
              'That gap is your **Recovery Point Objective**, and in practice it is simply the interval between your copies. Hourly snapshots give you an RPO of an hour. Continuous replication gives you an RPO of seconds. You buy a smaller number by copying more often.',
            tone: 'bad',
          },
          {
            edgeIds: ['fwd'],
            title: 'Forwards: nobody is being served until the replacement is up',
            detail:
              'That gap is your **Recovery Time Objective**, and everything has to fit inside it — detection, decision, failover, DNS propagation, warm-up. You buy a smaller number by having the replacement already running, which is why a low RTO always costs more than a low RPO.',
            tone: 'warn',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'The letter is the mnemonic',
      md: '**RPO is the P for "point in time you can return to" — it is about data. RTO is the T for time — it is about downtime.** They are separate numbers and a stem states them separately: a low RTO does not imply a low RPO. Pilot light restores fast once triggered and can still lose everything since the last replication tick, so read both.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'And a snapshot interval is an RPO, however fast the restore is',
      md: 'Snapshots are point-in-time, so **the RPO is the snapshot interval, not the restore speed**. An hourly snapshot cannot meet a five-minute RPO no matter how quickly it restores — and a stem that offers "faster restore" against a stated RPO is offering you the wrong axis on purpose.',
    },

    /* ── 3. The ladder, as a sequence rather than a table ─────────────────── */
    { kind: 'heading', text: 'Four designs, and the one variable behind them' },
    {
      kind: 'prose',
      md: 'AWS names four strategies, and they differ in exactly one variable: **how much is already running while everything is fine**. That is what you are paying for, and it is why cost rises in the same order as recovery speed. Start at the left, where nothing is running but the copies.',
    },
    {
      kind: 'diagram',
      spec: {
        id: 'drs-ladder',
        title: 'Each rung is the one before it with something switched on',
        caption:
          'Backup and restore keeps copies and nothing else. Every arrow turns one more thing on in the recovery Region — and raises the bill for the years in which nothing fails.',
        cols: 21,
        rows: 3,
        nodes: [
          {
            id: 'backup',
            label: 'Backup & restore',
            sub: 'copies only',
            kind: 'data',
            x: 0.2,
            y: 1.4,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'pilot',
            label: 'Pilot light',
            sub: 'data live, compute off',
            kind: 'note',
            x: 5.6,
            y: 1.4,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'warm',
            label: 'Warm standby',
            sub: 'a scaled-down live copy',
            kind: 'note',
            x: 11,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'active',
            label: 'Multi-site active-active',
            sub: 'both taking traffic',
            kind: 'note',
            x: 16.6,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'r1', from: 'backup', to: 'pilot', label: 'replicate', tone: 'info' },
          { id: 'r2', from: 'pilot', to: 'warm', label: 'switch on', tone: 'info' },
          { id: 'r3', from: 'warm', to: 'active', label: 'scale up', tone: 'warn' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['r1'],
            title: 'Turn on replication, and the data stops being hours old',
            detail:
              'Pilot light is **RPO minutes · RTO tens of minutes**: the data is live in the recovery Region and the compute is switched off. Recovery means starting things, which is why the RTO is still measured in tens of minutes rather than minutes.',
            tone: 'info',
          },
          {
            edgeIds: ['r2'],
            title: 'Turn the compute on, small, and the RTO drops to minutes',
            detail:
              'Warm standby is **RPO seconds · RTO minutes**. Pilot light and warm standby are separated by exactly one thing: in pilot light the compute is off, in warm standby it is running but small. A stem saying "a minimal version is always running" is warm standby, and nothing else.',
            tone: 'info',
          },
          {
            edgeIds: ['r3'],
            title: 'Scale it to full and let it take traffic, and there is nothing left to recover',
            detail:
              'Multi-site active-active is **RPO near zero · RTO near zero**, because both sides were already live. It is also the answer far less often than it looks: unless the stem asks for near-zero downtime or serving from both Regions, it is the over-engineered distractor.',
            tone: 'warn',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'money',
      title: 'Cheapest that clears the numbers, not most resilient available',
      md: '"The cheapest option that meets a 4-hour RTO" is an instruction **not** to buy warm standby. Read the numbers, then take the **leftmost** strategy on that ladder that still fits. Choosing the most resilient option available is the most expensive way to get a question wrong, and it is offered every time.',
    },

    /* ── 4. The failover written out, then the one that cannot work ───────── */
    { kind: 'heading', text: 'The RTO you wrote down, and the RTO you will get' },
    {
      kind: 'prose',
      md: 'Most of a DR design is replication, which is where attention goes. The last hop is usually DNS, which is where the RTO quietly gets decided. Here is an active-passive failover in [[route53|Route 53]], as it is actually configured.',
    },
    {
      kind: 'code',
      lang: 'json',
      caption: 'Failover routing: a primary record, a secondary record, and a health check',
      code: `{
  "Name": "app.example.com",
  "Type": "A",
  "SetIdentifier": "primary-eu-west-1",
  "Failover": "PRIMARY",
  "HealthCheckId": "8a1b...",
  "TTL": 60,
  "ResourceRecords": [{ "Value": "203.0.113.10" }]
}`,
    },
    {
      kind: 'steps',
      title: 'Three things that record is quietly telling you',
      items: [
        {
          title: 'The health check is on the primary, and it is not optional',
          md: 'Failover routing needs a health check attached to the primary record, or it will never fail over. A stem describing a failover that "did not happen" is very often describing this and nothing else.',
        },
        {
          title: 'Simple routing could not have done this',
          md: 'Simple is the one routing policy that cannot use a health check, which is exactly why it is wrong for anything about failover. The policy is the mechanism, not a preference.',
        },
        {
          title: 'And the TTL is part of your recovery time',
          md: 'Sixty seconds here means resolvers may keep answering with the dead address for up to another minute after the health check turns. That minute is inside your RTO whether you counted it or not.',
        },
      ],
    },
    {
      kind: 'code',
      lang: 'json',
      caption: 'The same design, with an RTO that cannot be delivered',
      code: `  "Failover": "PRIMARY",
  "TTL": 300,
         ^^^ five minutes of cached answers, before anything else happens
     Stated requirement: "the application must be serving again within
     60 seconds". The health check has not even reported yet.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'DNS time-to-live is part of your RTO',
      md: '**A Route 53 failover with a 300-second TTL cannot deliver a 60-second RTO**, and the exam does test this. Lowering the TTL has to happen *before* the failover, not during it — the old value is already cached. When "seconds" is a hard requirement, the answer is usually not DNS at all: anycast addresses are not cached by clients, which is why [[global-accelerator|Global Accelerator]] fails over faster.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'And two things that are not disaster recovery at all',
      md: '**Auto Scaling replacing a failed instance is high availability, not DR.** If the stem describes losing a Region, [[ec2-auto-scaling|Auto Scaling]] is a distractor. Likewise **a DR strategy is not tested until you have run a failover** — a question asking "how do we know it works" wants a regular DR drill, not more replication.',
    },

    /* ── 5. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'The sentence in the stem, and the option waiting next to it',
      columns: ['What it is telling you', 'The distractor beside it'],
      rows: [
        {
          label: '"No more than 15 minutes of data may be lost"',
          cells: [
            'An RPO. Anything backed up nightly is already eliminated',
            'A faster restore. Restore speed is the other number entirely',
          ],
        },
        {
          label: '"Serving traffic again within 10 minutes"',
          cells: [
            'An RTO, and it rules out restoring from backup',
            'More frequent snapshots, which improve the number you were not asked about',
          ],
        },
        {
          label: '"A minimal version is always running"',
          cells: [
            'Warm standby, by definition — the compute is on but small',
            'Pilot light, which is the same design with the compute off',
          ],
        },
        {
          label: '"The standby must handle production load immediately"',
          cells: [
            'Active-active, or at minimum a standby already at full size',
            'Warm standby. Scaled-down means it cannot take the load on arrival',
          ],
        },
        {
          label: '"The cheapest option that meets a 4-hour RTO"',
          cells: [
            'Pilot light or backup and restore — the leftmost that fits',
            'Warm standby, which clears the number and costs more all year',
          ],
        },
        {
          label: '"Near-zero RPO, relational, across Regions"',
          cells: [
            'Aurora Global Database — replication lag typically under a second',
            'A cross-Region read replica, which is the slower, coarser version',
          ],
        },
      ],
    },

    /* ── 6. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Backup and restore', value: 'RPO hours · RTO hours · nothing running' },
        {
          label: 'Pilot light',
          value: 'RPO minutes · RTO tens of minutes · data live, compute off',
        },
        { label: 'Warm standby', value: 'RPO seconds · RTO minutes · a scaled-down live copy' },
        { label: 'Multi-site active-active', value: 'RPO near zero · RTO near zero · both live' },
        {
          label: 'RDS Multi-AZ failover',
          value: 'Typically 60–120 seconds',
          note: 'Automatic, and within one Region only.',
          volatile: true,
        },
        {
          label: 'Aurora Global Database',
          value: 'Typical replication lag under 1 second',
          note: 'The usual answer to a near-zero cross-Region RPO for a relational store.',
        },
      ],
    },

    /* ── 7. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['rds', 'route53', 'aurora'],
    },
    {
      kind: 'prose',
      md: 'Both lessons so far have leaned on a phrase without inspecting it: "already running and taking traffic". The component that decides which of several already-running things a request actually reaches — and which of them is quietly taken out of service — is the load balancer, and choosing between four of them is the next lesson, **Which load balancer, and why the layer decides**.',
    },
  ],

  checks: [
    {
      id: 'rto-rpo-and-the-four-dr-strategies-which',
      prompt:
        'A stem states an RTO of 4 hours and an RPO of 1 hour, and asks for the most cost-effective design. Which strategy?',
      options: [
        {
          text: 'Backup and restore, with backups taken at least hourly',
          correct: true,
          why: 'Hours of RTO is exactly what backup and restore delivers, and an hourly backup interval is an hourly RPO. It is the leftmost rung that clears both numbers, so it is the cheapest.',
        },
        {
          text: 'Warm standby, so recovery is well inside the window',
          correct: false,
          why: 'It clears the numbers comfortably and pays for a live scaled-down copy every day of every year in which nothing fails. "Most cost-effective" is an instruction not to buy it.',
        },
        {
          text: 'Pilot light, because the data must be replicated to meet a 1-hour RPO',
          correct: false,
          why: 'Reasonable, but replication is not required for a one-hour RPO — an hourly backup interval already delivers it, and pilot light costs more.',
        },
      ],
    },
    {
      id: 'rto-rpo-and-the-four-dr-strategies-swap',
      prompt:
        '"The business can tolerate losing up to five minutes of orders." Which number is that?',
      options: [
        {
          text: 'The RPO — it is measured backwards from the failure, in data',
          correct: true,
          why: 'Losing orders is data loss, and five minutes of it is the gap between copies you are willing to accept. It says nothing about how long the site is down.',
        },
        {
          text: 'The RTO — five minutes is a recovery window',
          correct: false,
          why: 'This is the swap the exam is built on. RTO is time down, measured forwards. Nothing in the sentence mentions being unavailable.',
        },
        {
          text: 'Both — a five-minute RPO implies a five-minute RTO',
          correct: false,
          why: 'They are independent. A design can lose five minutes of data and still take four hours to come back, which is roughly what backup and restore does.',
        },
      ],
    },
    {
      id: 'rto-rpo-and-the-four-dr-strategies-ttl',
      prompt:
        'A Route 53 failover record has a health check on the primary and a TTL of 300. The requirement is to be serving again within 60 seconds. What is the problem?',
      options: [
        {
          text: 'The TTL alone can hold clients on the dead endpoint for longer than the whole RTO',
          correct: true,
          why: 'Cached answers survive the failover, and lowering the TTL afterwards changes nothing for resolvers that already hold the old value. DNS TTL is part of the RTO.',
        },
        {
          text: 'Failover routing cannot be used with a health check on the primary record',
          correct: false,
          why: 'It requires one. Without a health check on the primary the record would never fail over at all.',
        },
        {
          text: 'Nothing — Route 53 ignores the TTL once a health check fails',
          correct: false,
          why: 'Route 53 stops answering with the unhealthy record, but it cannot reach into resolvers and caches that already have the old answer.',
        },
      ],
    },
    {
      id: 'rto-rpo-and-the-four-dr-strategies-ha',
      prompt:
        'A stem describes losing an entire Region and offers "an Auto Scaling group across three Availability Zones" as an option. Why is it wrong?',
      options: [
        {
          text: 'All three Availability Zones are inside the Region that has just been lost',
          correct: true,
          why: 'Auto Scaling replacing failed instances is high availability, not disaster recovery. It answers an AZ failure and has nothing to work with when the Region is gone.',
        },
        {
          text: 'Auto Scaling groups cannot span more than two Availability Zones',
          correct: false,
          why: 'They can span every AZ whose subnet you attach. The limitation being tested is geographic scope, not the number of zones.',
        },
        {
          text: 'It is right, provided the launch template references an AMI copied to another Region',
          correct: false,
          why: 'An AMI in another Region is a useful ingredient of a DR plan, but the ASG itself is still a regional resource and launches nothing outside its own Region.',
        },
      ],
    },
  ],
}
