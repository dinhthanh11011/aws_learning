import type { Lesson } from '../schema'

/**
 * The `optionSet` on the `s3` entry already holds the table of seven classes,
 * and invariant 21 is explicit that a table on screen is derived from it — so a
 * `compare` of the classes here would be a second copy of the same fact. What is
 * missing from a table is the *decision*: the paper never says "use Standard-IA",
 * it describes an access pattern and a retrieval window, and the whole skill is
 * turning one into the other.
 *
 * So the order is: watch one object age through the lifecycle first, because the
 * minimum durations are what make every timing question non-obvious; then the
 * rule written out as real JSON, including the two versions of it that S3 will
 * refuse; then the decision, driven by the sentence in the requirement. The only
 * table is the retrieval-window one, whose axes the option set does not carry.
 */
export const s3StorageClasses: Lesson = {
  id: 's3-storage-classes',
  families: ['saa'],
  taskId: 'saa-4.1',
  cluster: 'storage',
  title: 'S3 storage classes',
  subtitle:
    'Seven classes, one durability figure between them, and a question that never names the class it wants. What varies is not how safe the bytes are — it is what it costs to reach them, and how long you wait.',
  minutes: 15,
  tier: 1,
  serviceSlugs: ['s3', 's3-glacier'],
  requires: ['block-file-object'],
  cardIds: [
    'optset:s3:storage-class',
    'opt:s3:storage-class:s3-standard',
    'opt:s3:storage-class:s3-intelligent-tiering',
    'opt:s3:storage-class:s3-standard-ia',
    'opt:s3:storage-class:s3-one-zone-ia',
    'opt:s3:storage-class:s3-glacier-instant-retrieval',
    'opt:s3:storage-class:s3-glacier-flexible-retrieval',
    'opt:s3:storage-class:s3-glacier-deep-archive',
    'num:s3-glacier:instant-retrieval',
    'num:s3-glacier:flexible-retrieval',
    'num:s3-glacier:deep-archive',
    'num:s3-glacier:expedited-capacity',
    'trap:s3:intelligent-tiering-is-the-answer-whenever-access-patterns-a',
    'trap:s3:s3-standard-has-no-minimum-duration-or-retrieval-fee-every',
    'trap:s3-glacier:match-the-retrieval-window-to-the-requirement-exactly-with',
    'trap:s3-glacier:you-cannot-use-a-lifecycle-rule-to-move-data-to-a-warmer-c',
    'trap:s3-glacier:lifecycle-transitions-must-respect-the-minimum-durations-s',
    'which:s3-glacier',
  ],

  sections: [
    /* ── 1. The hook: the number that does not vary ──────────────────────── */
    {
      kind: 'prose',
      md: 'Every [[s3]] storage class has the same **eleven nines** of durability. Not one of them is safer than another, so a class is never chosen for safety. What a class actually buys is a position on one trade — cheaper to keep, more expensive and slower to reach — and the exam asks about it by describing an access pattern and a retrieval window, never by naming the class. Start with what happens to one object over its first six months.',
    },

    /* ── 2. Watch an object age, before any table ────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 's3sc-lifecycle',
        title: 'One report, six months, four classes',
        caption:
          'It lands in Standard on day 0. Each arrow is a lifecycle transition, and each one commits the object to a minimum billed duration in the class it enters.',
        // A plain left-to-right chain — template B without the fan, because
        // nothing here branches. Spacing keeps every label in a gap.
        cols: 21,
        rows: 3,
        nodes: [
          {
            id: 's3-standard',
            label: 'S3 Standard',
            sub: 'no minimum, no retrieval fee',
            kind: 'service',
            category: 'storage',
            x: 0.2,
            y: 1.4,
            w: 3,
            h: 1.3,
          },
          {
            id: 's3-standard-ia',
            label: 'Standard-IA',
            sub: 'rare, but instant',
            kind: 'service',
            category: 'storage',
            x: 5.6,
            y: 1.4,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 's3-glacier-flexible',
            label: 'Glacier Flexible',
            sub: 'minutes to hours',
            kind: 'service',
            category: 'storage',
            x: 11,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 's3-glacier-deep',
            label: 'Deep Archive',
            sub: 'the cheapest AWS sells',
            kind: 'service',
            category: 'storage',
            x: 16.6,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 't1', from: 's3-standard', to: 's3-standard-ia', label: '30 days', tone: 'info' },
          {
            id: 't2',
            from: 's3-standard-ia',
            to: 's3-glacier-flexible',
            label: '90 days',
            tone: 'info',
          },
          {
            id: 't3',
            from: 's3-glacier-flexible',
            to: 's3-glacier-deep',
            label: '180 days',
            tone: 'warn',
          },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['t1'],
            title: 'Into Standard-IA, and now there is a floor under the bill',
            detail:
              'Standard-IA has a **30-day minimum duration**, a **128 KB billed minimum** per object and a **per-GB retrieval fee**. Delete on day 20 and you are charged to day 30 anyway. Read it often and it costs more than Standard did — "infrequent" has to be real, not aspirational.',
            tone: 'info',
          },
          {
            edgeIds: ['t2'],
            title: 'Into Glacier Flexible Retrieval, and now it is not instant',
            detail:
              '**90-day minimum**, and getting the object back is a restore job rather than a `GET`: Expedited 1–5 minutes, Standard 3–5 hours, Bulk 5–12 hours. This is the step where a retrieval window in the question starts deciding the answer.',
            tone: 'info',
          },
          {
            edgeIds: ['t3'],
            title: 'Into Deep Archive, which is a 180-day commitment',
            detail:
              'The cheapest storage AWS sells, and Standard retrieval takes 12 hours, Bulk 48. The **180-day minimum** is what makes it the wrong answer for anything with a shorter retention period, however cold the data sounds.',
            tone: 'warn',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'money',
      title: 'The one class with no strings, and why that matters',
      md: '**S3 Standard has no minimum duration and no retrieval fee.** Every other class has at least one of the two — which is exactly what makes lifecycle timing questions non-obvious, and why Standard wins whenever a question refuses to state an access pattern at all.',
    },

    /* ── 3. The rule itself, read out line by line ───────────────────────── */
    { kind: 'heading', text: 'What that picture is, written down' },
    {
      kind: 'code',
      lang: 'json',
      caption: 'A lifecycle configuration — the three arrows from the diagram, in order',
      code: `{
  "Rules": [
    {
      "ID": "reports-cooling",
      "Filter": { "Prefix": "reports/" },
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30,  "StorageClass": "STANDARD_IA" },
        { "Days": 90,  "StorageClass": "GLACIER" },
        { "Days": 180, "StorageClass": "DEEP_ARCHIVE" }
      ]
    }
  ]
}`,
    },
    {
      kind: 'steps',
      title: 'Four things that rule is quietly telling you',
      items: [
        {
          title: 'Days counts from object creation, not from the last read',
          md: 'A lifecycle rule is a calendar, not an access monitor. It has no idea whether anything read the object yesterday — which is the entire reason the next section exists.',
        },
        {
          title: 'The order of Transitions is fixed, because the temperatures are',
          md: 'Each entry moves the object colder than the last. There is no entry that moves it back, and adding one does not make S3 accept it.',
        },
        {
          title: 'Filter is what stops the rule eating the whole bucket',
          md: 'A prefix or a tag scopes it. Without one the rule applies to every object in the bucket, including the ones somebody is reading right now.',
        },
        {
          title: 'And every Days value is a commitment, not a schedule',
          md: 'Arriving in a class starts its minimum billed duration. The 30, 90 and 180 above are not chosen for tidiness — they are the minimums of the classes being entered, which is the cheapest place to put each boundary.',
        },
      ],
    },

    /* ── 4. The two rules S3 refuses, written out ────────────────────────── */
    { kind: 'heading', text: 'Two rules S3 will not run' },
    {
      kind: 'code',
      lang: 'json',
      caption: 'Both look reasonable. Neither is possible.',
      code: `"Transitions": [ { "Days": 10, "StorageClass": "STANDARD_IA" } ]
                           ^^ too early
     A transition must respect the minimum duration, and moving on day 10
     does not dodge the 30 days you are billed for anyway

"Transitions": [ { "Days": 400, "StorageClass": "STANDARD" } ]
                                                ^^^^^^^^^^ no such transition
     Lifecycle rules only ever go one way: hot to cold, and never back`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Transitions are one-way, and the minimums are real',
      md: 'You **cannot use a lifecycle rule to move data to a warmer class** — getting an archived object back into Standard is a restore and a copy, not a transition. And lifecycle transitions **must respect the minimum durations**, so a rule that chains one class into the next early is not a clever way to avoid the charge. Both of these are asked directly.',
    },

    /* ── 5. The decision, which is what the table cannot give you ────────── */
    { kind: 'heading', text: 'Reading the requirement instead of the class list' },
    {
      kind: 'prose',
      md: 'The class list is on the [[s3]] atlas entry and it is worth having open. What a list cannot do is tell you which sentence in a 90-word stem is the one that decides. There are four, and they are always phrased in more or less the same way.',
    },
    {
      kind: 'steps',
      title: 'The four sentences that decide it',
      items: [
        {
          title: 'Unknown, unpredictable or changing — Intelligent-Tiering',
          md: 'Those three words are the trigger, and they are close to verbatim on the paper. Intelligent-Tiering moves objects between tiers for you and charges a **per-object monitoring fee** with **no retrieval fee**. The trap is the mirror image: if the question *does* state the pattern, naming the class directly is cheaper and the monitoring fee is pure waste.',
        },
        {
          title: 'Can be regenerated, or a copy exists elsewhere — One Zone-IA',
          md: 'You are being told durability matters less. One Zone-IA is about 20% cheaper than Standard-IA and lives in a single Availability Zone at 99.5% availability — so losing that AZ loses the data, and it is wrong for anything that is the only copy.',
        },
        {
          title: 'Archive, and it must open immediately — Glacier Instant Retrieval',
          md: 'The one archive class with no wait: **millisecond retrieval**, 90-day minimum, for data touched perhaps quarterly. If a question says "archive" *and* "immediately", this is it and Deep Archive is the trap sitting next to it.',
        },
        {
          title: 'A named retrieval window — match it exactly',
          md: '"Within 12 hours" is Deep Archive on Standard retrieval. "Within an hour" is not — that needs Glacier Flexible, Expedited. Matching the window to the tier is the whole question, and the option one tier off is always present.',
        },
      ],
    },
    {
      kind: 'compare',
      title: 'The window the question names, and the retrieval it is describing',
      columns: ['What you must ask for', 'What it costs you'],
      rows: [
        {
          label: 'Milliseconds, on data that is genuinely an archive',
          cells: [
            'Glacier Instant Retrieval — an ordinary GET',
            '90-day minimum, and a higher storage price than the other two archive tiers',
          ],
        },
        {
          label: '"Within five minutes" or "within an hour"',
          cells: [
            'Glacier Flexible Retrieval, Expedited (1–5 min)',
            'The most expensive retrieval tier, and capacity is not guaranteed during a spike',
          ],
        },
        {
          label: '"Within a few hours", no urgency stated',
          cells: [
            'Glacier Flexible Retrieval, Standard (3–5 h)',
            'Nothing much — this is the tier the others are compared against',
          ],
        },
        {
          label: '"Overnight" or "within 12 hours"',
          cells: [
            'Deep Archive, Standard (12 h)',
            'A 180-day minimum, so the retention period has to be longer than that',
          ],
        },
        {
          label: '"Within two days", and cost is the stated priority',
          cells: [
            'Deep Archive, Bulk (48 h)',
            'The cheapest combination there is, and 48 hours is a long time to explain to anyone',
          ],
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'When a restore has to be guaranteed',
      md: '**Provisioned capacity units** guarantee Expedited retrievals during a spike. That is the answer to a question describing an audit or an incident where several Expedited restores must all succeed at once — otherwise Expedited is best-effort.',
    },

    /* ── 6. Numbers, last of all ─────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'S3 durability',
          value: '99.999999999% (11 nines) across ≥3 AZs',
          note: 'The same figure for every storage class.',
        },
        { label: 'Instant Retrieval', value: 'Milliseconds · 90-day minimum' },
        {
          label: 'Flexible Retrieval',
          value: 'Expedited 1–5 min · Standard 3–5 h · Bulk 5–12 h (free) · 90-day minimum',
        },
        { label: 'Deep Archive', value: 'Standard 12 h · Bulk 48 h · 180-day minimum' },
        {
          label: 'Expedited capacity',
          value: 'Provisioned capacity units guarantee expedited retrievals during a spike',
        },
      ],
    },

    /* ── 7. Next ─────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['s3', 's3-glacier'],
    },
    {
      kind: 'prose',
      md: 'One sentence in this lesson is doing more work than it looks: every class has the same eleven nines, and One Zone-IA still loses the data with its Availability Zone. Both are true, and they are only compatible because durability and availability are two different measurements. That is the next lesson, **Eleven nines is durability**.',
    },
  ],

  checks: [
    {
      id: 's3-storage-classes-unknown',
      prompt:
        'A bucket holds 40 TB of analytics extracts. The team says access patterns are unpredictable and change month to month. Which class?',
      options: [
        {
          text: 'S3 Intelligent-Tiering',
          correct: true,
          why: 'Unknown, unpredictable or changing is the trigger phrase, close to verbatim. Intelligent-Tiering moves objects between tiers automatically and charges no retrieval fee.',
        },
        {
          text: 'S3 Standard-IA, with a lifecycle rule to Glacier at 90 days',
          correct: false,
          why: 'Both halves assume you know the pattern. If access is genuinely unpredictable, the retrieval fees on IA will land on exactly the objects somebody turns out to need.',
        },
        {
          text: 'S3 Standard, since it has no minimum duration or retrieval fee',
          correct: false,
          why: 'Safe but not the answer here. The question has told you the pattern is unknown, which is the one condition Intelligent-Tiering exists for.',
        },
      ],
    },
    {
      id: 's3-storage-classes-window',
      prompt:
        'Compliance archives must be kept for seven years and, if regulators ask, produced within 12 hours. Cost is the priority. Which class and which retrieval?',
      options: [
        {
          text: 'Glacier Deep Archive, Standard retrieval',
          correct: true,
          why: 'Deep Archive Standard is 12 hours exactly, the seven-year retention clears the 180-day minimum comfortably, and it is the cheapest storage AWS sells.',
        },
        {
          text: 'Glacier Flexible Retrieval, Bulk retrieval',
          correct: false,
          why: 'Bulk on Flexible is 5–12 hours and would meet the window, but Flexible costs more to store — and cost is the stated priority over seven years.',
        },
        {
          text: 'Glacier Instant Retrieval',
          correct: false,
          why: 'It buys millisecond access nobody asked for, at a materially higher storage price, for data that will almost certainly never be read.',
        },
      ],
    },
    {
      id: 's3-storage-classes-onezone',
      prompt:
        'Rendered thumbnails are read rarely and can be regenerated from the originals in another bucket. Which class is the requirement pointing at?',
      options: [
        {
          text: 'S3 One Zone-IA',
          correct: true,
          why: '"Can be regenerated" is the sentence that waives AZ resilience, which is exactly what One Zone-IA charges about 20% less for.',
        },
        {
          text: 'S3 Standard-IA',
          correct: false,
          why: 'Correct on access pattern and paying for redundancy the requirement has just told you it does not need.',
        },
        {
          text: 'S3 Glacier Instant Retrieval',
          correct: false,
          why: 'Thumbnails are read rarely but they are served to users, and a 90-day minimum on regenerable derivatives is a commitment with nothing behind it.',
        },
      ],
    },
    {
      id: 's3-storage-classes-transition',
      prompt:
        'A lifecycle rule is edited to move objects from Glacier Deep Archive back to S3 Standard after 400 days, so that an annual reporting run is fast. What happens?',
      options: [
        {
          text: 'It is not a valid transition — lifecycle rules only move data colder, never warmer',
          correct: true,
          why: 'Getting an archived object back is a restore and a copy, not a transition. The reporting run has to restore what it needs and pay the retrieval.',
        },
        {
          text: 'It works, but the 180-day minimum charge is applied again on the way out',
          correct: false,
          why: 'There is no way out to apply a charge to. The rule itself is rejected.',
        },
        {
          text: 'It works only if the objects were originally uploaded to Standard',
          correct: false,
          why: 'Where an object started makes no difference. No lifecycle transition moves data to a warmer class under any circumstances.',
        },
      ],
    },
  ],
}
