import type { Lesson } from '../schema'

/**
 * The two features look the same on a diagram — one primary, one second copy —
 * and the paper exploits exactly that. `saa-d2-003` offers both to a question
 * about either availability or read scaling, and it is the single most reliable
 * way to lose a mark in domain 2.
 *
 * So the order is: watch one write leave the application and take both paths at
 * once, before either feature is named. The fan-in-the-middle template is used
 * deliberately — the claim being made *is* "the same journey, differing at one
 * point", and that point is what the reader should be looking at when the words
 * "synchronous" and "asynchronous" finally arrive.
 *
 * Then the two commands that create them, then the endpoint that does not exist,
 * then the Region the standby never crosses, then Aurora — which collapses the
 * distinction and is therefore the payoff rather than the introduction.
 */
export const multiAzVsReadReplica: Lesson = {
  id: 'multi-az-vs-read-replica',
  families: ['saa'],
  taskId: 'saa-2.2',
  cluster: 'resilience',
  title: 'Multi-AZ is not a read replica',
  subtitle:
    'Both make a second database in another Availability Zone. One of them will not serve you a single row, and the other will not fail over on its own. Questions that offer you both are testing precisely this.',
  minutes: 15,
  tier: 1,
  serviceSlugs: ['rds', 'aurora'],
  requires: [],
  cardIds: [
    'optset:rds:deployment',
    'opt:rds:deployment:multi-az-instance',
    'opt:rds:deployment:multi-az-db-cluster',
    'opt:rds:deployment:read-replica',
    'opt:rds:deployment:cross-region-read-replica',
    'trap:rds:multi-az-is-for-availability-not-performance-the-standby',
    'trap:rds:failover-changes-what-the-dns-endpoint-resolves-to-applicat',
    'trap:rds:a-read-replica-can-be-promoted-to-a-standalone-writer-and-t',
    'trap:rds:cross-region-read-replicas-serve-dr-and-local-reads-multi-a',
    'trap:rds:the-rds-proxy-answer-appears-whenever-too-many-connections',
    'trap:aurora:multi-az-is-inherent-in-aurora-storage-there-is-no-separate',
    'trap:aurora:use-the-reader-endpoint-for-read-traffic-pointing-reads-a',
    'opt:aurora:endpoint:cluster-endpoint',
    'opt:aurora:endpoint:reader-endpoint',
    'num:aurora:replicas',
    'num:aurora:failover',
    'trap:concept:multi-az-vs-multi-region:multi-az-rds-does-not-scale-reads-and-does-not-survive-a-reg',
    'trap:concept:backup-vs-replication:a-read-replica-is-not-a-backup-deleting-a-row-on-the-primar',
    'vs:rds:aurora',
  ],

  sections: [
    /* ── 1. The hook: name the confusion, explain nothing ────────────────── */
    {
      kind: 'prose',
      md: 'Draw them and they are the same picture. [[rds]] Multi-AZ puts a second database in a second [[availability-zone]]. A read replica puts a second database in a second Availability Zone. The exam knows they look identical, so it describes a problem and offers you both — and the two of them solve **different problems**, in ways that are invisible until you follow one write out of the application.',
    },

    /* ── 2. One write, both paths, before either is named ─────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'mazrr-one-write',
        title: 'One write, and the two things that can happen to the copy',
        caption:
          'The same journey as far as the primary. What differs is one property of the arrow leaving it — and everything downstream follows from that one difference.',
        // Template B, the fan-in-the-middle variant: two parallel tails that are
        // the same journey with a different object at the junction.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'app',
            label: 'Application',
            sub: 'one connection string',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'rds-primary',
            label: 'Primary',
            sub: 'the only writer',
            kind: 'service',
            category: 'database',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'rds-standby',
            label: 'Standby',
            sub: 'AZ b · serves nothing',
            kind: 'service',
            category: 'database',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'rds-replica',
            label: 'Read replica',
            sub: 'AZ b · readable',
            kind: 'service',
            category: 'database',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'takeover',
            label: 'Same endpoint',
            sub: 'automatic failover',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'promotion',
            label: 'A new writer',
            sub: 'promoted by hand',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'w', from: 'app', to: 'rds-primary', label: 'a write', tone: 'default' },
          {
            id: 'sync',
            from: 'rds-primary',
            to: 'rds-standby',
            label: 'synchronous',
            tone: 'ok',
          },
          {
            id: 'async',
            from: 'rds-primary',
            to: 'rds-replica',
            label: 'asynchronous',
            tone: 'info',
          },
          { id: 'fail', from: 'rds-standby', to: 'takeover', label: '60–120s', tone: 'ok' },
          { id: 'prom', from: 'rds-replica', to: 'promotion', label: 'irreversible', tone: 'warn' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['w'],
            title: 'The write reaches the primary, which is the only thing that takes writes',
            detail:
              'Whatever else is standing in this picture, there is exactly one writer. Nothing that follows changes that.',
            tone: 'default',
          },
          {
            edgeIds: ['sync'],
            title: 'The standby is updated synchronously — the write is not done until it lands',
            detail:
              'That is what makes it a **Multi-AZ instance** deployment. The cost is a little write latency. The benefit is that the second copy is never behind. And the standby **serves no reads**: there is no endpoint pointing at it and no traffic reaching it.',
            tone: 'ok',
          },
          {
            edgeIds: ['async'],
            title: 'The replica is updated asynchronously — the write finished without it',
            detail:
              'That is a **read replica**. The primary does not wait, so writes are not slowed and the replica lags. It is readable, and your application must be changed to send reads to it. Up to 15 for MySQL, MariaDB and PostgreSQL.',
            tone: 'info',
          },
          {
            edgeIds: ['fail'],
            title: 'When the AZ fails, the standby is promoted for you',
            detail:
              'Failover is automatic and typically takes **60–120 seconds**. The endpoint is unchanged — what changes is what it *resolves to*, which is why the application has to reconnect and must not cache DNS forever.',
            tone: 'ok',
          },
          {
            edgeIds: ['prom'],
            title: 'The replica can become a writer too — but somebody has to decide that',
            detail:
              'Promotion is **manual and irreversible**. Nothing watches the primary on this path, nothing triggers, and the replica may be behind at the moment you promote it. This is why a read replica is not an availability feature.',
            tone: 'warn',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the names',
      md: '**Multi-AZ is availability. Read replicas are performance.** That sentence is worth more marks than any other in this lesson, and both halves have a sharp edge: the standby takes no read traffic at all, and failing over to a replica is a manual promotion you perform, not a mechanism that protects you.',
    },

    /* ── 3. The two commands, read out one line at a time ─────────────────── */
    { kind: 'heading', text: 'What that picture is, written down' },
    {
      kind: 'code',
      lang: 'bash',
      caption: 'Two arrows from the diagram, and the two commands that draw them',
      code: `aws rds create-db-instance \\
  --db-instance-identifier prod-orders \\
  --engine postgres \\
  --multi-az \\
  --backup-retention-period 7

aws rds create-db-instance-read-replica \\
  --db-instance-identifier prod-orders-reader \\
  --source-db-instance-identifier prod-orders`,
    },
    {
      kind: 'steps',
      title: 'Four things those two commands are quietly telling you',
      items: [
        {
          title: 'One is a flag, the other is a whole database',
          md: '`--multi-az` is a property of the instance you already have. A read replica is a separate `create` call producing a separate instance with a separate identifier and a separate endpoint — which is the first hint that your application has to know about it.',
        },
        {
          title: 'Only one of them has anything to say about backups',
          md: 'Backup retention sits on the primary, and the standby has no schedule of its own. A replica is not a backup either: **delete a row on the primary and it is deleted on the replica moments later**. Going back in time is the automated backup and point-in-time recovery, never the copy that keeps up.',
        },
        {
          title: 'Nothing here names an Availability Zone for the standby',
          md: 'You do not place it. AWS does, in another AZ in the same Region, and that is the whole of the resilience you bought. What it does not buy is anything at all outside that Region.',
        },
        {
          title: 'And nothing here changes your connection string',
          md: 'The `--multi-az` instance answers on the endpoint it already had. The replica answers on a new one, and every read that is supposed to go there is a change somebody has to make in the application.',
        },
      ],
    },

    /* ── 4. The endpoint that does not exist ──────────────────────────────── */
    { kind: 'heading', text: 'The connection string nobody can write' },
    {
      kind: 'code',
      lang: 'bash',
      caption:
        'The standard wrong design: "we made it Multi-AZ, so point the reports at the standby"',
      code: `WRITE_URL=prod-orders.abc123.eu-west-1.rds.amazonaws.com
READ_URL=prod-orders-standby.abc123.eu-west-1.rds.amazonaws.com
         ^^^^^^^^^^^^^^^^^^^ there is no such host
     The Multi-AZ standby is not published, not resolvable and not
     readable. Reports pointed here do not run slowly — they do not run.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Multi-AZ is for availability, not performance',
      md: 'The standby **takes no read traffic**, so choosing Multi-AZ to "spread read load" is the classic wrong answer and it is offered on purpose. The mirror image is offered just as often: adding read replicas to a database that is falling over because of **too many connections** does nothing, because connection exhaustion is not a read-throughput problem — that stem wants [[rds-proxy|RDS Proxy]].',
    },
    {
      kind: 'callout',
      tone: 'ok',
      title: 'The deployment that does both, and the reason it is not always offered',
      md: 'The **Multi-AZ DB cluster** is one writer plus two *readable* standbys, with faster failover than the instance deployment. It genuinely gives availability and read capacity at once. It supports a narrower set of engines and versions, so it is not a drop-in for every workload — which is why the exam still expects you to know the two-feature version above.',
    },

    /* ── 5. The Region the standby never crosses ──────────────────────────── */
    { kind: 'heading', text: 'Where the standby will not go' },
    {
      kind: 'prose',
      md: 'Everything so far happened inside one [[region]]. A stem that says "the entire Region becomes unavailable" has just moved the failure outside everything Multi-AZ can see.',
    },
    {
      kind: 'diagram',
      spec: {
        id: 'mazrr-two-regions',
        title: 'Multi-AZ never crosses this line',
        caption:
          'Both AZs of a Multi-AZ deployment are on the left. Getting to the right takes a cross-Region read replica, which is asynchronous and which you promote yourself.',
        // Template C: two peers, one container each, deliberately under-declared.
        cols: 11,
        rows: 3,
        nodes: [
          {
            id: 'rds-home',
            label: 'Primary + standby',
            sub: 'two AZs, one Region',
            kind: 'service',
            category: 'database',
            x: 0.6,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'rds-far',
            label: 'Read replica',
            sub: 'promote to recover',
            kind: 'service',
            category: 'database',
            x: 7.4,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
        ],
        edges: [
          {
            id: 'xregion',
            from: 'rds-home',
            to: 'rds-far',
            label: 'asynchronous',
            tone: 'warn',
          },
        ],
        groups: [
          { id: 'r1', label: 'eu-west-1', kind: 'region', nodeIds: ['rds-home'] },
          { id: 'r2', label: 'us-east-1', kind: 'region', nodeIds: ['rds-far'] },
        ],
        steps: [],
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Two distractors, one sentence',
      md: '**Multi-AZ RDS does not scale reads and does not survive a Region failure.** Both wrong answers are built on that one sentence, and a stem usually contains the tell: "survive the loss of an Availability Zone" is Multi-AZ; "the entire Region becomes unavailable" needs a **cross-Region read replica** or [[aurora|Aurora Global Database]]. A question that asks for local reads in a distant Region *and* regional DR is asking for the same object twice, which is why the cross-Region replica answers it.',
    },

    /* ── 6. Aurora: the payoff, not the introduction ──────────────────────── */
    { kind: 'heading', text: 'What Aurora does to this distinction' },
    {
      kind: 'prose',
      md: '[[aurora|Aurora]] keeps six copies of your data across three AZs in a shared storage volume, and separates that storage from the compute instances in front of it. Read that sentence against the diagram above and something collapses: because replicas read the *same volume* rather than replaying a log, the thing that scales your reads and the thing you fail over to are **the same object**.',
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'There is no "enable Multi-AZ" toggle on Aurora',
      md: '**Multi-AZ is inherent in Aurora storage.** You get availability by having a replica in another AZ to fail over to — up to **15** of them, with typically under 10 ms lag, and failover usually **under 30 seconds**. Those three numbers together are the Aurora signature, and they are the reason "same engine, better availability and replica lag" is always Aurora rather than RDS.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Which endpoint, though',
      md: 'Aurora gives you a **cluster endpoint** that always resolves to the writer and follows a failover, and a **reader endpoint** that load-balances across the replicas. **Use the reader endpoint for read traffic** — pointing reads at the cluster endpoint puts every query on the writer, and it is the most common wrong design in Aurora questions. The instance endpoint is for diagnosing one instance: it does not follow a failover, so an application using it survives until the first one and no longer.',
    },

    /* ── 7. Compare, last, on axes the option set does not carry ──────────── */
    {
      kind: 'compare',
      title: 'The sentence in the stem, and what it has just ruled out',
      columns: ['What it is asking for', 'The option sitting next to it that is wrong'],
      rows: [
        {
          label: '"Must survive the loss of an Availability Zone"',
          cells: [
            'Multi-AZ — synchronous standby, automatic failover',
            'A read replica. Promotion is manual, so nothing recovers while nobody is watching',
          ],
        },
        {
          label: '"Reporting queries are slowing the application down"',
          cells: [
            'Read replicas, and the application changed to use them',
            'Multi-AZ. The standby serves no traffic, so read capacity is unchanged',
          ],
        },
        {
          label: '"Continue operating if the entire Region is unavailable"',
          cells: [
            'A cross-Region read replica, or Aurora Global Database',
            'Multi-AZ, which never leaves the Region it was created in',
          ],
        },
        {
          label: '"Too many connections" or "Lambda exhausts the connection pool"',
          cells: [
            'RDS Proxy — a connection-count problem',
            'More read replicas. They add read capacity and no connections at all',
          ],
        },
        {
          label: '"Someone deleted a table an hour ago"',
          cells: [
            'Point-in-time recovery, to any second in the retention window',
            'Any replica or standby. Both faithfully reproduced the delete',
          ],
        },
      ],
    },

    /* ── 8. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'Multi-AZ instance failover',
          value: 'Typically 60–120 seconds, automatic, same Region',
          volatile: true,
        },
        {
          label: 'Read replicas',
          value: 'Up to 15 for MySQL/MariaDB/PostgreSQL · asynchronous',
        },
        {
          label: 'Automated backup retention',
          value: '1–35 days',
          note: 'Setting it to 0 disables automated backups and point-in-time recovery.',
        },
        {
          label: 'Point-in-time recovery',
          value: 'To any second within the retention window, typically to within 5 minutes of now',
        },
        {
          label: 'Aurora replicas',
          value: 'Up to 15 Aurora Replicas, typically <10 ms lag',
        },
        {
          label: 'Aurora failover',
          value: 'Usually under 30 seconds to an existing replica',
        },
        {
          label: 'Aurora storage replication',
          value: '6 copies across 3 AZs, self-healing',
        },
      ],
    },

    /* ── 9. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['rds', 'aurora'],
    },
    {
      kind: 'prose',
      md: 'One phrase in this lesson was answered rather than examined: "the entire Region becomes unavailable". A cross-Region replica is one answer to it, and it is only the cheapest answer for some of the numbers a stem can state. Which numbers, and which of four architectures each one buys, is the next lesson — **Two numbers choose the architecture**.',
    },
  ],

  checks: [
    {
      id: 'multi-az-vs-read-replica-reports',
      prompt:
        'A finance team runs heavy reports against a Multi-AZ RDS instance and the application slows down while they run. What fixes it?',
      options: [
        {
          text: 'Add a read replica and point the reports at its endpoint',
          correct: true,
          why: 'Read replicas are the read-capacity feature, and the reports tolerate lag. The application change — sending those queries somewhere else — is part of the answer, not an objection to it.',
        },
        {
          text: 'Nothing — Multi-AZ already spreads the read load across two Availability Zones',
          correct: false,
          why: 'The standby serves no traffic at all. There is no endpoint for it and no query ever reaches it, so read capacity is exactly what it was with one instance.',
        },
        {
          text: 'Enable a second Multi-AZ standby so reads can be balanced across both',
          correct: false,
          why: 'A Multi-AZ instance deployment has one standby and it is not readable. The deployment that does give you readable standbys is the Multi-AZ DB cluster, which is a different choice with narrower engine support.',
        },
      ],
    },
    {
      id: 'multi-az-vs-read-replica-region',
      prompt:
        'A stem requires the database to keep operating if the entire Region becomes unavailable. Which option meets it?',
      options: [
        {
          text: 'A cross-Region read replica, promoted when the Region is lost',
          correct: true,
          why: 'Replication across Regions is asynchronous and promotion is manual, but it is the only one of these that puts a copy outside the failed Region at all.',
        },
        {
          text: 'Multi-AZ, so the standby takes over automatically',
          correct: false,
          why: 'Multi-AZ never crosses a Region. Both copies are inside the Region the stem has just described as unavailable.',
        },
        {
          text: 'Automated backups with a 35-day retention period',
          correct: false,
          why: 'Backups are a recovery mechanism with an RTO measured in hours, and by default they live with the instance. This is the answer to "we deleted something", not to "the Region is gone".',
        },
      ],
    },
    {
      id: 'multi-az-vs-read-replica-endpoint',
      prompt:
        'An Aurora cluster has three replicas, and the application reads and writes through the cluster endpoint. What is wrong with that?',
      options: [
        {
          text: 'Every read is landing on the writer — read traffic belongs on the reader endpoint',
          correct: true,
          why: 'The cluster endpoint always resolves to the current writer. The three replicas are idle, which is the most common wrong design in Aurora questions.',
        },
        {
          text: 'Nothing — the cluster endpoint load-balances across the writer and the replicas',
          correct: false,
          why: 'That is the reader endpoint. The cluster endpoint follows the writer, which is exactly what makes it right for writes and wrong for reads.',
        },
        {
          text: 'The application will not survive a failover, because the cluster endpoint is pinned to one instance',
          correct: false,
          why: 'The cluster endpoint follows a failover automatically. The endpoint that does not is the instance endpoint, and using that one in an application is a separate mistake.',
        },
      ],
    },
    {
      id: 'multi-az-vs-read-replica-delete',
      prompt:
        'An hour ago a deployment script dropped a table on the primary. There is a Multi-AZ standby and two read replicas. Where is the table?',
      options: [
        {
          text: 'Nowhere — restore to a point in time before the drop',
          correct: true,
          why: 'A standby and a replica are copies that keep up, so both reproduced the drop. Going backwards in time is point-in-time recovery, which reaches any second inside the retention window.',
        },
        {
          text: 'On the read replicas, because they replicate asynchronously and can be promoted',
          correct: false,
          why: 'Asynchronous means seconds behind, not an hour behind. The drop replicated moments after it ran.',
        },
        {
          text: 'On the Multi-AZ standby, which is only used for failover',
          correct: false,
          why: 'The standby is synchronous, so it had the drop before the statement returned. It is a copy, not a backup.',
        },
      ],
    },
  ],
}
