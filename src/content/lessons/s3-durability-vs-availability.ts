import type { Lesson } from '../schema'

/**
 * The short third lesson of batch 3, and the one that resolves a sentence the
 * previous one had to leave standing: every S3 class has the same eleven nines,
 * *and* One Zone-IA loses the data with its Availability Zone. Both are true, and
 * they only fit together once durability and availability are two measurements
 * rather than one word.
 *
 * Every fact is on the `durability-vs-availability` concept and the `s3` and
 * `ebs` entries. The contribution is that the contradiction is set up first — the
 * reader watches the same object survive and vanish under one unchanged
 * durability figure — before either word is used.
 */
export const s3DurabilityVsAvailability: Lesson = {
  id: 's3-durability-vs-availability',
  families: ['saa'],
  taskId: 'saa-2.2',
  title: 'Eleven nines is durability',
  subtitle:
    'The most quoted number in AWS, almost always quoted for the wrong thing. Durability and availability fail separately, are sold separately, and a requirement always means exactly one of them.',
  minutes: 10,
  tier: 1,
  serviceSlugs: ['s3', 'ebs', 'efs'],
  requires: ['s3-storage-classes'],
  cardIds: [
    'idea:durability-vs-availability',
    'define:durability-vs-availability',
    'num:concept:durability-vs-availability:s3-durability',
    'num:concept:durability-vs-availability:s3-standard-availability',
    'num:concept:durability-vs-availability:s3-one-zone-ia',
    'trap:concept:durability-vs-availability:eleven-nines-is-often-misquoted-as-availability-it-is-durab',
    'trap:concept:durability-vs-availability:an-ebs-snapshot-is-stored-in-s3-and-is-regional-the-volume',
    'trap:concept:durability-vs-availability:raid-inside-an-instance-improves-neither-in-the-way-the-exam',
    'vs:concept:durability-vs-availability:backup-vs-replication',
    'num:s3:durability',
    'trap:ebs:ebs-is-single-az-volume-must-survive-an-az-failure-points',
  ],

  sections: [
    /* ── 1. The hook: the sentence the last lesson left standing ─────────── */
    {
      kind: 'prose',
      md: 'Two things you have just been told are both true. Every [[s3]] storage class has the same eleven nines. And S3 One Zone-IA keeps its only copies in a single Availability Zone, so losing that Availability Zone loses the data. If eleven nines meant "you will not lose this", those two sentences could not both stand. Watch what actually happens.',
    },

    /* ── 2. The same object, surviving and not ───────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'dva-one-az',
        title: 'One PUT, two classes, one Availability Zone failure',
        caption:
          'The two journeys are identical except for how many Availability Zones hold a copy. The durability figure quoted for them is also identical.',
        // Template B, fan-in-the-middle: the same journey twice, differing only
        // at the junction — which is precisely the claim being made.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 's3-object',
            label: 'Your object',
            sub: 'one PUT',
            kind: 'data',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 's3',
            label: 'S3, one Region',
            sub: 'you pick a class',
            kind: 'service',
            category: 'storage',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 's3-standard',
            label: 'S3 Standard',
            sub: 'copies in ≥3 AZs',
            kind: 'service',
            category: 'storage',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 's3-one-zone-ia',
            label: 'One Zone-IA',
            sub: 'copies in one AZ',
            kind: 'service',
            category: 'storage',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'survived',
            label: 'Still there',
            sub: 'read it again',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'lost-data',
            label: 'Gone',
            sub: 'nothing to restore',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'put', from: 's3-object', to: 's3', label: 'one PUT', tone: 'info' },
          { id: 'std', from: 's3', to: 's3-standard', label: '≥3 AZs', tone: 'ok' },
          { id: 'one', from: 's3', to: 's3-one-zone-ia', label: 'one AZ', tone: 'warn' },
          { id: 'survives', from: 's3-standard', to: 'survived', label: 'AZ lost', tone: 'ok' },
          { id: 'lost', from: 's3-one-zone-ia', to: 'lost-data', label: 'AZ lost', tone: 'bad' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['put'],
            title: 'One object, and the same figure quoted either way',
            detail:
              '99.999999999% — eleven nines — is published for **all** storage classes. Nothing about choosing a class changes it, which is already a clue about what it is measuring.',
            tone: 'info',
          },
          {
            edgeIds: ['std', 'one'],
            title: 'The only difference is how far apart the copies are',
            detail:
              'S3 Standard replicates across at least three Availability Zones within the [[region|Region]]. One Zone-IA keeps its copies in one, which is where roughly 20% of the price goes.',
            tone: 'default',
          },
          {
            edgeIds: ['survives'],
            title: 'An Availability Zone is lost. Standard answers the next request.',
            detail:
              'The other copies are in other Availability Zones, so nothing was lost and nothing stopped answering.',
            tone: 'ok',
          },
          {
            edgeIds: ['lost'],
            title: 'And One Zone-IA — same eleven nines — has nothing left',
            detail:
              'The figure was never a promise about Availability Zones failing. It is a probability that the copies **which exist** are not silently corrupted or lost, and every copy of this object was in the Availability Zone that just went.',
            tone: 'bad',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the two words',
      md: '**Durability** is the probability that stored data survives — that it is not lost. **Availability** is the probability that you can read or write it at a given moment. They are quoted as separate figures because they fail separately: a class can keep every byte safe while being briefly unreachable, and a single very available disk can lose everything at once. [[durability-vs-availability]] is the concept card.',
    },

    /* ── 3. The misquote, written out ────────────────────────────────────── */
    {
      kind: 'code',
      lang: 'text',
      caption: 'The sentence almost everyone says, and the three numbers AWS actually publishes',
      code: `WHAT PEOPLE SAY
  "S3 is 99.999999999% available"
                       ^^^^^^^^^ no such figure exists, for any AWS service

WHAT AWS PUBLISHES
  durability      99.999999999%   the same for every S3 storage class
  availability    99.99%          S3 Standard
                  99.5%           S3 One Zone-IA`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Eleven nines is durability, and it never varies',
      md: 'It is misquoted as availability constantly, including in study material. Two consequences worth holding: an option that offers a **more durable S3 storage class** is offering something that does not exist, and an option that reads "eleven nines of availability" is fabricated. Availability is the figure that moves between classes — 99.99% for Standard, 99.5% for One Zone-IA.',
    },

    /* ── 4. The same split, on a volume ──────────────────────────────────── */
    { kind: 'heading', text: 'The same two words decide an EBS question' },
    {
      kind: 'steps',
      title: 'Two requirements that sound alike and have different answers',
      items: [
        {
          title: 'Back up the volume — that is a durability requirement',
          md: 'An [[ebs|EBS]] snapshot is stored in [[s3]] and is **Regional**. It is incremental, and it is how a volume crosses an Availability Zone or Region boundary at all. Nothing about taking one makes the running volume easier to reach.',
        },
        {
          title: 'Make the volume highly available — that is a different answer',
          md: 'The volume itself lives in one Availability Zone and cannot leave it. So this requirement is asking for a second instance, or for [[efs|EFS]] instead — "volume must survive an AZ failure" points at snapshots or at EFS, never at a setting on the volume.',
        },
        {
          title: 'And RAID inside one instance improves neither, in the way the exam means',
          md: 'It is a favourite distractor because it sounds like redundancy. The durable answer is a snapshot; the available answer is a second instance. RAID across volumes attached to one instance in one Availability Zone is neither.',
        },
      ],
    },

    /* ── 5. The head-to-head, last ───────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'Which of the two the requirement is actually naming',
      columns: ['The measurement', 'What the answer is'],
      rows: [
        {
          label: '"We can recreate this data if it is lost"',
          cells: [
            'Durability, and it matters less here',
            'One Zone-IA — you are being told to stop paying for Availability Zone redundancy',
          ],
        },
        {
          label: '"Must not be lost under any circumstances"',
          cells: [
            'Durability',
            'S3 Standard, versioning, or a second copy in another [[region|Region]]',
          ],
        },
        {
          label: 'A quoted availability SLA in the stem',
          cells: [
            'Availability',
            'A hint about which storage class or which deployment the question wants',
          ],
        },
        {
          label: '"Back up the volume"',
          cells: ['Durability', 'An [[ebs|EBS]] snapshot — stored in S3, and Regional'],
        },
        {
          label: '"The volume must survive an Availability Zone failure"',
          cells: [
            'Availability',
            'Snapshots and a restore elsewhere, or [[efs|EFS]] — the volume is single-AZ either way',
          ],
        },
        {
          label: 'RAID across several volumes inside one instance',
          cells: [
            'Neither, in the way the exam means',
            'The durable answer is a snapshot; the available answer is a second instance',
          ],
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'And the pair this one is most often confused with',
      md: 'Durability and availability are properties you are **given**. [[backup-vs-replication|Backup and replication]] are the two things you **add** when the published figures are not enough — a copy you can go back to, versus a copy that keeps up with the original. A question that has already told you the durability figure is fine is usually asking about one of those two instead.',
    },

    /* ── 6. Numbers, last of all ─────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'S3 durability',
          value: '99.999999999% — eleven nines — for all storage classes',
          note: 'Durability does not vary between classes. Availability does.',
        },
        { label: 'S3 Standard availability', value: '99.99%' },
        {
          label: 'S3 One Zone-IA',
          value: '99.5% availability, one AZ',
          note: 'Same durability figure, but it is gone if the AZ is.',
        },
        {
          label: 'EBS volume durability',
          value: '99.8–99.999% depending on volume type',
          volatile: true,
        },
      ],
    },

    /* ── 7. Next ─────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['s3', 'ebs', 'efs'],
    },
    {
      kind: 'prose',
      md: 'That closes the storage cluster. A storage question resolves in three moves: which **shape** — block, file or object; then, if it is object, which **class**, from the access pattern and the retrieval window; and then which of the two **measurements** the requirement is really naming. Getting the first one wrong is what makes the other two unanswerable.',
    },
  ],

  checks: [
    {
      id: 's3-durability-vs-availability-misquote',
      prompt:
        'An option in a question offers "a more durable S3 storage class" for data that must not be lost. What is wrong with it?',
      options: [
        {
          text: 'There is no such thing — every S3 storage class has the same eleven nines of durability',
          correct: true,
          why: 'Durability does not vary between classes. Availability does, and so does the cost of retrieval. An option offering more durability within S3 is fabricated.',
        },
        {
          text: 'Nothing is wrong — Standard is more durable than One Zone-IA',
          correct: false,
          why: 'One Zone-IA carries the same durability figure. What it has less of is availability, and its copies are all in one Availability Zone.',
        },
        {
          text: 'It is right in principle but you would need versioning enabled first',
          correct: false,
          why: 'Versioning protects against deletion and overwrite, which is a different risk again. It does not change the published durability of any class.',
        },
      ],
    },
    {
      id: 's3-durability-vs-availability-onezone',
      prompt:
        'If One Zone-IA has the same eleven nines as Standard, how can losing an Availability Zone lose the data?',
      options: [
        {
          text: 'The figure is about the copies that exist not being lost — and here they were all in that one AZ',
          correct: true,
          why: 'Durability is a probability about stored data surviving. It says nothing about how far apart the copies are, which is what an AZ failure tests.',
        },
        {
          text: 'It cannot — the data is recoverable from the other Availability Zones',
          correct: false,
          why: 'One Zone-IA keeps its copies in a single Availability Zone. That is what makes it about 20% cheaper than Standard-IA.',
        },
        {
          text: 'The eleven nines figure only applies once the object is older than 30 days',
          correct: false,
          why: 'There is no such condition. Minimum durations are billing rules, not durability rules.',
        },
      ],
    },
    {
      id: 's3-durability-vs-availability-ebs',
      prompt:
        'A requirement says a database on EC2 must keep serving if its Availability Zone fails. The team proposes hourly EBS snapshots. What is wrong?',
      options: [
        {
          text: 'Snapshots are a durability answer, and the requirement is an availability one',
          correct: true,
          why: 'A snapshot is Regional and lets you rebuild elsewhere. "Keep serving" needs something already running in another Availability Zone.',
        },
        {
          text: 'Nothing is wrong, as long as the snapshots are copied to a second Region',
          correct: false,
          why: 'A second Region raises the durability further and still leaves a restore between the failure and the database serving anything.',
        },
        {
          text: 'Snapshots are stored in the same Availability Zone as the volume, so they fail with it',
          correct: false,
          why: 'They are stored in S3 and are Regional. The problem is what a snapshot is for, not where it sits.',
        },
      ],
    },
  ],
}
