import type { Lesson } from '../schema'

/**
 * Batch 2, lesson 3 — the identity cluster.
 *
 * Every fact is in the atlas: `kms` and `secrets-manager` in the service
 * corpus, plus the `encryption-at-rest-vs-in-transit` and
 * `identity-vs-resource-policy` concepts. Per invariant 21 the key-type matrix
 * is already an `optionSet` on the KMS entry and is deliberately *not* repeated
 * as a `compare` here — the comparison this lesson earns is the one it spends
 * the whole page building, the KMS key against the data key.
 *
 * Depends on `how-iam-decides`, because "the key policy is authoritative" is
 * only a surprise if you already believe an IAM Allow is usually enough.
 */
export const kmsAndEnvelopeEncryption: Lesson = {
  id: 'kms-and-envelope-encryption',
  families: ['saa'],
  taskId: 'saa-1.3',
  title: 'KMS and envelope encryption',
  subtitle:
    'Two keys, one of which never leaves the service and one of which you hold for a moment — and the policy that decides everything, which is not the one you were looking at.',
  minutes: 13,
  tier: 1,
  serviceSlugs: ['kms', 's3', 'ebs', 'secrets-manager', 'cloudhsm'],
  requires: ['how-iam-decides'],
  cardIds: [
    'num:kms:direct-encrypt-limit',
    'num:kms:key-policy',
    'num:kms:automatic-rotation',
    'num:kms:deletion',
    'num:kms:multi-region-keys',
    'trap:kms:the-key-policy-is-authoritative-if-the-key-policy-does-not',
    'trap:kms:envelope-encryption-is-examined-explicitly-kms-never-sees-y',
    'trap:kms:a-cross-region-encrypted-snapshot-copy-needs-a-key-in-the-d',
    'trap:kms:only-customer-managed-keys-give-you-control-over-the-policy',
    'optset:kms:key-type',
    'idea:encryption-at-rest-vs-in-transit',
    'vs:kms:secrets-manager',
  ],

  sections: [
    /* ── 1. The hook ─────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'A KMS key can only encrypt about **4 KB** directly. That is not a quota anybody is going to raise for you — it is a consequence of the key material never coming out of the service in the clear. So the obvious question is how a 1 GB file, a 500 GB volume or an entire database ends up encrypted by a service that will not accept them. The answer is that they are not encrypted by it, and watching that happen once makes the rest of the domain fall into place.',
    },

    /* ── 2. Watch it happen, before the word ─────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'kms-envelope',
        title: 'One file, two keys',
        caption:
          'Follow the 1 GB. Note which box it never enters, and what ends up stored next to it.',
        // Template B, the variant where the fan is in the middle: two parallel
        // tails that are the same journey carrying a different object.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'plaintext',
            label: '1 GB file',
            sub: 'plaintext',
            kind: 'data',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'ec2',
            label: 'Your application',
            sub: 'holds the key briefly',
            kind: 'service',
            category: 'compute',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'kms',
            label: 'KMS',
            sub: 'key material never leaves',
            kind: 'service',
            category: 'security',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'ciphertext',
            label: 'Encrypted file',
            sub: 'ciphertext',
            kind: 'data',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'wrapped',
            label: 'Data key',
            sub: 'the encrypted copy',
            kind: 'data',
            x: 17,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 's3',
            label: 'S3',
            sub: 'both, side by side',
            kind: 'service',
            category: 'storage',
            x: 17,
            y: 5.7,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'load', from: 'plaintext', to: 'ec2', label: 'the data', tone: 'info' },
          { id: 'ask', from: 'ec2', to: 'kms', label: 'data key?', tone: 'info' },
          { id: 'wrap', from: 'kms', to: 'wrapped', label: 'wrapped', tone: 'ok' },
          { id: 'enc', from: 'ec2', to: 'ciphertext', label: 'encrypt', tone: 'ok' },
          { id: 'store', from: 'ciphertext', to: 's3', label: 'store', tone: 'ok' },
          { id: 'beside', from: 'wrapped', to: 's3', label: 'alongside', tone: 'ok' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['load'],
            title: 'The data is 1 GB, and it is never going to KMS',
            detail:
              'The direct encrypt limit is 4 KB. Sending bulk data through the API is not slow or expensive here — it is simply not possible, and an exam option offering it is fabricated.',
            tone: 'info',
          },
          {
            edgeIds: ['ask', 'wrap'],
            title: 'So ask KMS for a key instead of for encryption',
            detail:
              '`GenerateDataKey` returns two things: a plaintext data key your application can use immediately, and a copy of that same data key encrypted under the KMS key. The KMS key itself stays inside the service, as it always does.',
            tone: 'info',
          },
          {
            edgeIds: ['enc'],
            title: 'The encryption happens on your side',
            detail:
              'Your application encrypts the file locally with the plaintext data key. KMS never saw a byte of the file — this is the part the exam asks about explicitly.',
            tone: 'ok',
          },
          {
            edgeIds: ['store', 'beside'],
            title: 'Store the encrypted data key next to the ciphertext',
            detail:
              'That is the envelope. To read the file back, hand the encrypted data key to KMS, get the plaintext data key returned, and decrypt locally — which is why `Decrypt` and `GenerateDataKey` are the two permissions that matter on a key.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the word',
      md: 'That is **envelope encryption**, and it is what "encryption at rest" means almost everywhere on AWS: a data key encrypts the data, and KMS encrypts the data key. SSE-KMS on [[s3|S3]] does exactly this for you; client-side encryption means doing it explicitly in your own code. [[encryption-at-rest-vs-in-transit]] is the concept card, and its other half is worth holding on to — enabling bucket encryption does nothing for data in transit, so "encrypted end to end" means both controls.',
    },

    /* ── 3. The policy that actually decides, read line by line ──────────── */
    { kind: 'heading', text: 'The policy that decides, which is on the key' },
    {
      kind: 'code',
      lang: 'json',
      caption: 'One statement from the key policy on the customer managed key',
      code: `{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::111122223333:role/AppServerRole" },
  "Action": ["kms:GenerateDataKey", "kms:Decrypt"],
  "Resource": "*"
}`,
    },
    {
      kind: 'steps',
      title: 'The same statement, one line at a time',
      items: [
        {
          title: 'It has a Principal, so it is a resource policy',
          md: 'A key policy is the resource policy of the key. Everything you know about [[identity-vs-resource-policy|where a permission is written]] applies — except for one difference that makes KMS unlike every other service, in the next line but one.',
        },
        {
          title: 'The two actions are exactly the two halves of the envelope',
          md: '`GenerateDataKey` to write, `Decrypt` to read. An application that can encrypt but not decrypt has one of these and not the other, which is a real and confusing failure rather than a contrived one.',
        },
        {
          title: 'Resource: "*" means this key, not every key',
          md: 'A key policy is attached to one key, so the resource is already decided by the attachment. The wildcard here is not the least-privilege violation it looks like — unlike the same wildcard in an identity policy, which is the classic one the exam wants you to reject.',
        },
        {
          title: 'And this document is authoritative',
          md: 'The key policy is **required**. An IAM policy alone cannot grant use of a key unless the key policy delegates to IAM. If the key policy does not permit the principal, no IAM policy can rescue it — and that is a one-way rule with no equivalent on a bucket.',
        },
      ],
    },

    /* ── 4. The wrong answer, written out ────────────────────────────────── */
    { kind: 'heading', text: 'The fix that changes nothing' },
    {
      kind: 'prose',
      md: 'A user reports `AccessDenied` reading an SSE-KMS object. They have `AmazonS3FullAccess`. The instinct is to add more permissions, and it is easy to write something that looks decisive:',
    },
    {
      kind: 'code',
      lang: 'json',
      caption: 'Attached to the user’s identity — broad, alarming, and completely ineffective',
      code: `{
  "Effect": "Allow",
  "Action": "kms:*",
  "Resource": "*"
}`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Full S3 permissions and still denied is the key policy',
      md: 'Reading an SSE-KMS object is **two** authorisations: S3 for the object, and KMS for the key. Adding IAM permissions changes nothing if the key policy excludes the principal. This is one of the most reliably examined facts in the security domain, and "AccessDenied on an encrypted object despite full S3 permissions" is the exact wording it hides behind.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The same shape, one step removed',
      md: "Whenever an AWS service writes to an encrypted resource on your behalf — SNS to SQS, EventBridge to SQS, S3 to an encrypted bucket — the key policy must name that service principal. It is a very common silent failure, and nothing in the sending service's configuration hints at it. `ViaService` conditions are the opposite move: they restrict a key to use *through* a specific service, which is a least-privilege detail worth recognising.",
    },

    /* ── 5. Which key leaves the Region ──────────────────────────────────── */
    { kind: 'heading', text: 'Which key leaves the Region' },
    {
      kind: 'prose',
      md: 'The data key travelled to your application and back. The KMS key has not moved at all, and by default it never will — which is the whole of one recurring question:',
    },
    {
      kind: 'diagram',
      spec: {
        id: 'kms-regions',
        title: 'Copying an encrypted snapshot to another Region',
        caption:
          'A single-Region key cannot decrypt anywhere else. The copy needs a key in the destination, or a multi-Region key created for the purpose.',
        // Template C: two peers, one container each. Widened a little because
        // each node carries its own Region box.
        cols: 11,
        rows: 3,
        nodes: [
          {
            id: 'ebs',
            label: 'Snapshot',
            sub: 'encrypted, key A',
            kind: 'service',
            category: 'storage',
            x: 0.6,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'ebs-copy',
            label: 'The copy',
            sub: 'needs a key here',
            kind: 'service',
            category: 'storage',
            x: 7.4,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
        ],
        edges: [{ id: 'copy', from: 'ebs', to: 'ebs-copy', label: 're-encrypted', tone: 'warn' }],
        groups: [
          { id: 'r1', label: 'eu-west-1', kind: 'region', nodeIds: ['ebs'] },
          { id: 'r2', label: 'us-east-1', kind: 'region', nodeIds: ['ebs-copy'] },
        ],
        steps: [],
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'And the retrofit that does not exist',
      md: 'You cannot encrypt an existing [[ebs|EBS]] volume or RDS instance **in place**. The answer is always snapshot, copy the snapshot with encryption, restore — and the exam reliably offers a plausible "enable encryption" option that is not a thing. Turning on encryption by default is what stops it happening again.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Which key type, in one line',
      md: 'Any question mentioning **control, audit, rotation you choose, cross-account sharing, or disabling a key** is a customer managed key. An AWS managed key cannot have its policy edited and cannot be shared across accounts, so "share the encrypted snapshot with another account" fails on one and needs the other. The full matrix, including imported material and the CloudHSM-backed store, is on the [[kms|KMS]] entry — and [[cloudhsm|CloudHSM]] itself is only the answer when a named hardware or single-tenancy requirement appears, not merely "highly secure".',
    },

    /* ── 6. The comparison this lesson earned ────────────────────────────── */
    {
      kind: 'compare',
      title: 'The KMS key against the data key',
      columns: ['KMS key', 'Data key'],
      rows: [
        {
          label: 'Where the material lives',
          cells: [
            'Inside KMS — it never leaves the service unencrypted',
            'In your application’s memory, and encrypted next to the ciphertext',
          ],
        },
        {
          label: 'What it encrypts',
          cells: ['The data key', 'Your actual data, locally'],
        },
        {
          label: 'Size it can handle',
          cells: ['4 KB directly', 'Anything — a file, a volume, a database'],
        },
        {
          label: 'Who does the work',
          cells: ['KMS, as an API call you are charged for', 'Your own code or the AWS service'],
        },
        {
          label: 'Lifetime',
          cells: [
            'Years — rotated annually, old material retained so old ciphertext still decrypts',
            'One object, and thrown away after use',
          ],
        },
        {
          label: 'Crosses a Region',
          cells: [
            'Only as a multi-Region key',
            'It is stored with the data, so it goes where the data goes',
          ],
        },
        {
          label: 'Deleting it',
          cells: [
            '7–30 day mandatory wait; disabling is instant',
            'Losing it means losing the data',
          ],
        },
      ],
    },

    /* ── 7. Numbers ──────────────────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Direct encrypt limit', value: '4 KB' },
        {
          label: 'Automatic rotation',
          value: 'Annual for customer-managed keys, and AWS-managed keys rotate too',
          note: 'Old key material is retained so existing ciphertext still decrypts.',
        },
        { label: 'Deletion', value: '7–30 day mandatory waiting period' },
        {
          label: 'Key policy',
          value:
            'Required — an IAM policy alone cannot grant use of a key unless the key policy delegates to IAM',
        },
        {
          label: 'Multi-Region keys',
          value:
            'Same key material replicated across Regions, for cross-Region encrypted workloads',
        },
        {
          label: 'S3 default',
          value: 'SSE-S3 applied to all new objects automatically',
          note: 'Since January 2023 — older material says encryption is opt-in.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'money',
      title: 'The cost shape, since it decides one question',
      md: 'You pay per customer-managed key-month plus per 10,000 API requests; AWS-managed keys are free to store. At very high request volumes the shared KMS request quota is what bites, and data-key caching through the Encryption SDK is what exists to solve it — reusing one data key across many objects rather than calling KMS per object.',
    },

    /* ── 8. Where to go next ─────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'The layers either side of the key',
      slugs: ['kms', 'secrets-manager', 'cloudhsm', 'acm'],
    },
    {
      kind: 'prose',
      md: 'Keep the layers separate and a whole class of question stops being ambiguous: [[kms|KMS]] holds the key that encrypts the secret, [[secrets-manager|Secrets Manager]] holds the secret and is the only one of the two that **rotates** it, and [[acm|ACM]] manages the TLS certificates that protect the same data in transit. Different layers, not alternatives — and rotation is the single word that separates Secrets Manager from Parameter Store, which also encrypts with KMS.',
    },
  ],

  /* ── Checks ───────────────────────────────────────────────────────────── */
  checks: [
    {
      id: 'kms-and-envelope-encryption-key-policy',
      prompt:
        'A role with AmazonS3FullAccess gets AccessDenied downloading an object from an SSE-KMS bucket. What is wrong?',
      options: [
        {
          text: 'The key policy on the KMS key does not permit that role',
          correct: true,
          why: 'The read is two authorisations, S3 and KMS, and the key policy is authoritative. "Full S3 permissions but still denied" is nearly always this.',
        },
        {
          text: 'The role is missing s3:GetObjectVersion',
          correct: false,
          why: 'A full-access managed policy already includes it. The stem has deliberately removed every S3 explanation.',
        },
        {
          text: 'The object needs to be re-uploaded without encryption',
          correct: false,
          why: 'Working, unencrypted, and the opposite of what any requirement wants. The access problem is a policy, not the ciphertext.',
        },
      ],
    },
    {
      id: 'kms-and-envelope-encryption-4kb',
      prompt: 'Why does envelope encryption exist at all?',
      options: [
        {
          text: 'A KMS key can encrypt only about 4 KB directly, so a separate data key encrypts the bulk data locally',
          correct: true,
          why: 'The 4 KB limit is the reason, and KMS never sees your data — only the data key. The exam asks this explicitly.',
        },
        {
          text: 'It lets KMS encrypt large objects faster by splitting them into parts',
          correct: false,
          why: 'The data never goes to KMS at all, in parts or otherwise. This option describes multipart upload wearing a disguise.',
        },
        {
          text: 'It allows the key material to be exported so applications can hold it',
          correct: false,
          why: 'Backwards. KMS key material never leaves the service unencrypted — that constraint is what forces the envelope.',
        },
      ],
    },
    {
      id: 'kms-and-envelope-encryption-cross-region',
      prompt:
        'An encrypted EBS snapshot in eu-west-1 must be copied to us-east-1 for disaster recovery. What does the copy need?',
      options: [
        {
          text: 'A KMS key in the destination Region, or a multi-Region key',
          correct: true,
          why: 'Single-Region keys are the default and never leave their Region, so the copy has to be re-encrypted with a key that exists there.',
        },
        {
          text: 'Nothing — KMS keys are global, like IAM',
          correct: false,
          why: 'IAM is global; KMS keys are regional. Confusing the two is exactly what this question is built on.',
        },
        {
          text: 'The snapshot decrypted first, then copied, then re-encrypted at the destination',
          correct: false,
          why: 'The copy operation re-encrypts for you when given a destination key. Manually decrypting creates a plaintext copy nobody asked for.',
        },
      ],
    },
    {
      id: 'kms-and-envelope-encryption-key-type',
      prompt:
        'A requirement says the security team must control rotation, audit every use of the key, and share an encrypted snapshot with a second account. Which key type?',
      options: [
        {
          text: 'A customer managed key',
          correct: true,
          why: 'Only customer managed keys give you an editable key policy, control over rotation and cross-account sharing. Control, audit or sharing in a stem all point here.',
        },
        {
          text: 'The AWS managed key for the service, such as aws/ebs',
          correct: false,
          why: 'Its policy cannot be edited and it cannot be shared across accounts, so the sharing half of the requirement fails outright.',
        },
        {
          text: 'An AWS owned key',
          correct: false,
          why: 'You cannot see it, audit it or scope it. Any mention of controlling the key rules it out immediately.',
        },
      ],
    },
  ],
}
