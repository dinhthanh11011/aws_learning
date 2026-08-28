import type { Lesson } from '../schema'

/**
 * Batch 2, lesson 1 — the identity cluster.
 *
 * Every fact below is already in the atlas: `iam`, `sts` and `organizations` in
 * the service corpus, and the `principal`, `identity-vs-resource-policy`,
 * `least-privilege` and `arn` concepts. Nothing here is new, per invariant 23.
 * What the lesson contributes is the order — the algorithm watched running on
 * one call before it is stated as a rule, the policy read one line at a time,
 * and the SCP that "allows" written out as real JSON before it is rejected.
 *
 * `families: ['saa']` and `taskId: 'saa-1.1'`, matching batch 1: a lesson
 * carries exactly one task, and DVA candidates meet this material through the
 * atlas until a DVA-tasked lesson exists.
 */
export const howIamDecides: Lesson = {
  id: 'how-iam-decides',
  families: ['saa'],
  taskId: 'saa-1.1',
  cluster: 'identity',
  title: 'How IAM decides',
  subtitle:
    'One request, four checks, in an order that never varies. Learn it as an algorithm and every deny-versus-allow question on the paper becomes arithmetic.',
  minutes: 14,
  tier: 1,
  serviceSlugs: ['iam', 'sts', 'organizations', 's3', 'kms'],
  requires: [],
  cardIds: [
    'num:iam:evaluation-order',
    'num:iam:policy-types',
    'num:iam:scope',
    'trap:iam:explicit-deny-always-wins-from-any-policy-type-no-matter-w',
    'trap:iam:an-scp-does-not-grant-permissions-if-an-scp-allows-an-actio',
    'trap:iam:cross-account-access-needs-both-sides-the-resource-policy',
    'idea:identity-vs-resource-policy',
    'num:concept:identity-vs-resource-policy:evaluation-order',
    'define:principal',
    'idea:least-privilege',
  ],

  sections: [
    /* ── 1. The hook ─────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'A developer with an identity policy that says `Allow` on exactly the action they are calling gets `AccessDenied`. Nothing is broken and nothing is inconsistent — the same fixed sequence of checks that lets most calls through stopped this one, and it stopped it at a specific step. The order never varies, which means it is not something to have a feel for. It is something to run.',
    },

    /* ── 2. Watch it run, before the rule is stated ──────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'iam-order',
        title: 'One call, four checks',
        caption:
          'The whole decision happens on the first arrow. Step through it and watch which check is the one that ends the call.',
        cols: 13,
        rows: 6,
        nodes: [
          {
            id: 'dev',
            label: 'Developer',
            sub: 'an assumed role session',
            kind: 'user',
            x: 0.4,
            y: 0.4,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 's3',
            label: 'S3',
            sub: 'reports-bucket',
            kind: 'service',
            category: 'storage',
            x: 8.6,
            y: 3.4,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          // Template A: the call is the elbow, the answer is the diagonal. Two
          // elbows between the same pair would draw on top of each other, and
          // the shapes differing is what makes the return leg readable.
          { id: 'call', from: 'dev', to: 's3', label: 's3:GetObject', tone: 'info', elbow: true },
          { id: 'deny', from: 's3', to: 'dev', label: 'AccessDenied', tone: 'bad' },
        ],
        groups: [
          { id: 'ou', label: 'OU: Production — one SCP', kind: 'plain', nodeIds: [] },
          {
            id: 'acct',
            label: 'Account 111122223333',
            kind: 'account',
            nodeIds: ['s3'],
            parent: 'ou',
          },
        ],
        steps: [
          {
            edgeIds: ['call'],
            title: 'The call carries four things',
            detail:
              'Who is asking, what action, on which resource, and the context it is asking in — the source address, whether MFA was used, which VPC endpoint it came through. Every one of those can be tested by a policy. "Who is asking" is the [[principal]], and establishing it is where the decision starts.',
            tone: 'info',
          },
          {
            edgeIds: ['call'],
            title: '1. Is there an explicit Deny anywhere?',
            detail:
              'Anywhere means anywhere: the identity policy, a bucket policy, an SCP, a permissions boundary, a session policy. One Deny in any of them ends the decision here, and nothing that follows can rescue it. This is the single most-tested rule on the paper.',
            tone: 'warn',
          },
          {
            edgeIds: ['call'],
            title: '2. Do the ceilings permit it?',
            detail:
              'The SCP on that OU, the permissions boundary on the role, and any session policy passed at assume time. All three are caps — they subtract, and none of them grants anything. The effective permission is the intersection of every ceiling with the identity policy, so the least permissive layer wins.',
            tone: 'warn',
          },
          {
            edgeIds: ['call'],
            title: '3. Is there an Allow?',
            detail:
              'Either the identity policy attached to the caller, or a resource policy on the bucket. Inside one account, either one granting is enough. The developer has this one — their identity policy names `s3:GetObject` on this bucket.',
            tone: 'ok',
          },
          {
            edgeIds: ['deny'],
            title: '4. Otherwise, deny — and here, that is what happened',
            detail:
              'The SCP on the OU never listed `s3` at all. It denied nothing explicitly; it simply never let the action through the ceiling at step 2, so the Allow at step 3 had nothing to apply to. The default is deny, and no amount of adding permissions to the identity policy changes a ceiling.',
            tone: 'bad',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the rule, in the words the exam uses',
      md: '**Explicit Deny → SCP/boundary/session-policy cap → Allow → implicit Deny.** That is the whole of it, and [[identity-vs-resource-policy]] is the concept card. Two consequences do most of the work on the paper: a Deny anywhere has already answered the question, and a cap can only ever take permissions away.',
    },

    /* ── 3. A real policy, read out one line at a time ───────────────────── */
    { kind: 'heading', text: 'What a policy actually looks like' },
    {
      kind: 'code',
      lang: 'json',
      caption: 'One statement from the developer’s identity policy',
      code: `{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::reports-bucket/*",
  "Condition": { "Bool": { "aws:MultiFactorAuthPresent": "true" } }
}`,
    },
    {
      kind: 'steps',
      title: 'The same statement, one line at a time',
      items: [
        {
          title: 'Effect is Allow or Deny, and Deny is not a last resort',
          md: 'A `Deny` written here is the explicit Deny from step 1 of the algorithm — it wins over every Allow anywhere else. That is why "when a requirement says a thing **must be rejected**, the answer contains a Deny with a condition key" is a reliable move rather than a heavy-handed one.',
        },
        {
          title: 'Action names the API call, and naming it narrowly is the tie-breaker',
          md: 'When two options both work, the one naming specific actions is the answer and the one with a wildcard is not — that is what [[least-privilege]] means in practice on this paper. An option offering a managed policy such as `AmazonS3FullAccess` alongside a narrower custom policy is almost always the distractor.',
        },
        {
          title: 'Resource is an ARN, and one ARN is usually not enough',
          md: '`arn:aws:s3:::reports-bucket` and `arn:aws:s3:::reports-bucket/*` are **different resources**. `ListBucket` needs the first, `GetObject` needs the second, and a policy with only one of them fails in the way the exam describes as puzzling. The empty Region and account fields are information too: bucket names are globally unique, so they are not scoped that way.',
        },
        {
          title: 'Condition is how a static permission becomes a contextual one',
          md: 'Reach for these before inventing structure: `aws:MultiFactorAuthPresent`, `aws:SourceIp`, `aws:SecureTransport`, `aws:RequestedRegion`, `aws:PrincipalOrgID`. That last one turns organisation membership into an authorisation condition, which is what "all accounts in the organisation, including future ones" is asking for.',
        },
        {
          title: 'There is no Principal line — and its absence is the tell',
          md: 'Only resource policies have a `Principal` element, because an identity policy is already attached to one. Seeing `Principal` in a policy tells you it is a resource policy without reading anything else. It is the fastest way to tell which half of a cross-account setup you are looking at.',
        },
      ],
    },

    /* ── 4. The policy that looks like it grants, and does not ───────────── */
    { kind: 'heading', text: 'The policy that grants nothing' },
    {
      kind: 'prose',
      md: 'The call above failed at the ceiling, so the obvious fix is to open the ceiling up. Write it out as a real service control policy and it looks entirely convincing:',
    },
    {
      kind: 'code',
      lang: 'json',
      caption: 'SCP on OU “Production” — valid, attachable, and grants nobody anything',
      code: `{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'An SCP never grants',
      md: 'An SCP sets the **maximum available permissions**. If an SCP allows an action but no identity policy does, the call still fails — SCPs only remove. So "add an SCP to allow it" is always a wrong answer, and so is every option that treats a permissions boundary or a session policy as a way to hand out a permission. All three are ceilings, and the effective permission is always the intersection.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'And you cannot out-permission a Deny',
      md: 'The other half of the same misunderstanding: an explicit Deny cannot be overridden by any Allow anywhere. A question that piles on permissions, attaches a broader managed policy, or adds a bucket policy in order to fix a Deny is testing exactly this. Find the Deny and remove it, or the answer is not in the options.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Two scoping facts that decide whole questions',
      md: 'SCPs apply to member accounts **including their root user**, and they do **not** apply to the management account — which is why running workloads there is an anti-pattern the exam expects you to reject. And the root user sits outside every guardrail anyway: no SCPs, no boundaries. That is why the controls on it are physical ones — MFA, no access keys, credentials locked away, an alarm on its use.',
    },

    /* ── 5. Where the second policy lives ────────────────────────────────── */
    { kind: 'heading', text: 'Across an account line, one Allow is not enough' },
    {
      kind: 'prose',
      md: "Inside one account, either the identity policy or the resource policy granting is enough. Cross the account line and that stops being true, because there are now two owners with different interests and neither should be able to give the other's consent:",
    },
    {
      kind: 'diagram',
      spec: {
        id: 'iam-two-sides',
        title: 'Two accounts, two policies, one call',
        caption:
          'Both halves, always. Writing only one of them is the usual cause of “access denied despite a correct IAM policy”.',
        // Template C, widened a little because each node carries a group box of
        // its own — the two rectangles need clear air between them or they read
        // as one.
        cols: 11,
        rows: 3,
        nodes: [
          {
            id: 'ec2',
            label: 'App server',
            sub: 'an instance profile role',
            kind: 'service',
            category: 'compute',
            x: 0.6,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 's3',
            label: 'S3',
            sub: 'reports-bucket',
            kind: 'service',
            category: 'storage',
            x: 7.4,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
        ],
        edges: [{ id: 'x', from: 'ec2', to: 's3', label: 's3:GetObject', tone: 'info' }],
        groups: [
          {
            id: 'acct-a',
            label: 'Account A — identity policy',
            kind: 'account',
            nodeIds: ['ec2'],
          },
          { id: 'acct-b', label: 'Account B — bucket policy', kind: 'account', nodeIds: ['s3'] },
        ],
        steps: [],
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Answers that mention only one side are wrong',
      md: "The resource policy — or the role's trust policy, if the access goes through [[role-assumption|assuming a role]] — must allow the caller, **and** the caller's identity policy must allow the action. An option that fixes one and says nothing about the other is the standard distractor. Note also that resource policies exist on S3, SQS, SNS, [[kms|KMS]], Lambda, [[secrets-manager|Secrets Manager]], API Gateway, ECR, EFS and others — but **not** on EC2 instances or DynamoDB tables, so cross-account access to a table goes through a role and an option offering a table policy is fabricated.",
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The one that hides behind S3',
      md: 'A [[kms|KMS]] key always needs its **key policy** to grant access; IAM permissions alone are never sufficient. So `AccessDenied` on an encrypted object despite full S3 permissions is the key policy, essentially always — reading an SSE-KMS object is two authorisations, S3 for the object and KMS for the key. Adding more IAM permissions changes nothing if the key policy excludes the principal.',
    },

    /* ── 6. The comparison, now that all three have been seen ────────────── */
    {
      kind: 'compare',
      title: 'The three places a permission can be written',
      columns: ['Identity policy', 'Resource policy', 'SCP'],
      rows: [
        {
          label: 'Attached to',
          cells: [
            'A user, group or role',
            'The resource — bucket, queue, key, function',
            'An organizational unit or account',
          ],
        },
        {
          label: 'Has a Principal element',
          cells: ['No — it is already attached to one', 'Yes', 'No'],
        },
        { label: 'Can grant', cells: ['Yes', 'Yes', 'Never — it only removes'] },
        {
          label: 'Same account',
          cells: ['Either one granting is enough', 'Either one granting is enough', 'Still caps'],
        },
        {
          label: 'Cross-account',
          cells: [
            'Must allow the action',
            'Must name the outside principal',
            'Caps both ends of it',
          ],
        },
        {
          label: 'Exists on',
          cells: [
            'Every identity',
            'S3, SQS, SNS, KMS, Lambda, Secrets Manager, API Gateway, ECR, EFS — not EC2 instances or DynamoDB tables',
            'Member accounts, including their root user — never the management account',
          ],
        },
      ],
    },

    /* ── 7. The numbers, last ────────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'Evaluation order',
          value: 'Explicit Deny → SCP/boundary/session-policy cap → Allow → implicit Deny',
        },
        {
          label: 'Policy types',
          value:
            'Identity-based · Resource-based · Permissions boundary · SCP · Session policy · ACL',
        },
        { label: 'Scope', value: 'IAM is global — not regional' },
        {
          label: 'Roles',
          value: 'Trust policy (who may assume) plus permissions policy (what they may then do)',
        },
        {
          label: 'Inline policy size',
          value: '2,048 characters for a user, 10,240 for a role',
        },
        {
          label: 'Managed policies per identity',
          value: '10 attached, raisable to 20',
          volatile: true,
        },
        {
          label: 'Analysis tools',
          value: 'IAM Access Analyzer for external access · policy simulator · last-accessed data',
        },
      ],
    },

    /* ── 8. Where to go next ─────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'The rest of the identity picture',
      slugs: ['sts', 'organizations', 'iam-identity-center', 'kms'],
    },
    {
      kind: 'prose',
      md: 'This lesson was the decision. The next one is the **credential** the decision is made about: read **Roles, not keys** for why an access key in an environment variable is the wrong answer to every question, and **KMS and envelope encryption** for the one resource policy that no IAM policy can override.',
    },
  ],

  /* ── Checks ───────────────────────────────────────────────────────────── */
  checks: [
    {
      id: 'how-iam-decides-explicit-deny',
      prompt:
        "A role's identity policy allows s3:DeleteObject. The bucket policy contains an explicit Deny on s3:DeleteObject for that role. What is the fastest fix that actually works?",
      options: [
        {
          text: 'Remove the Deny from the bucket policy — nothing else will do it',
          correct: true,
          why: 'An explicit Deny cannot be overridden by any Allow anywhere. It is check 1 of 4, and it ends the decision.',
        },
        {
          text: 'Attach AmazonS3FullAccess to the role',
          correct: false,
          why: 'Piling on permissions to fix a Deny is the exact misunderstanding this rule is examined for. The Deny still wins.',
        },
        {
          text: 'Add an SCP allowing s3:DeleteObject on the account',
          correct: false,
          why: 'Two errors at once: an SCP never grants, and even a grant would not survive an explicit Deny.',
        },
      ],
    },
    {
      id: 'how-iam-decides-scp-ceiling',
      prompt:
        'An SCP on the account allows ec2:*. The role calling ec2:RunInstances has no policy mentioning EC2 at all. What happens?',
      options: [
        {
          text: 'Denied — the SCP raised the ceiling but granted nothing',
          correct: true,
          why: 'SCPs filter; they never grant. The effective permission is the intersection of every ceiling and the identity policy, and the identity policy is empty here.',
        },
        {
          text: 'Allowed — the SCP is the highest-precedence Allow',
          correct: false,
          why: 'There is no such precedence. An SCP is a cap, and a cap with nothing underneath it permits nothing.',
        },
        {
          text: 'Allowed, but only in the Region the SCP was attached in',
          correct: false,
          why: 'IAM is global and SCPs are not regional either. The Region has nothing to do with this decision.',
        },
      ],
    },
    {
      id: 'how-iam-decides-cross-account',
      prompt:
        'An application in Account A must read a bucket in Account B. Account B adds a bucket policy naming the role in Account A. The call still fails. What is missing?',
      options: [
        {
          text: "An Allow for s3:GetObject in the role's own identity policy in Account A",
          correct: true,
          why: 'Cross-account access needs both sides. Within one account either policy is enough; across the line the resource must allow the caller and the caller must be allowed to call.',
        },
        {
          text: 'Nothing — the bucket policy is authoritative for the bucket',
          correct: false,
          why: 'That is true of a KMS key policy, not of a bucket policy across accounts. Both halves are required here.',
        },
        {
          text: 'A resource policy on the EC2 instance in Account A',
          correct: false,
          why: 'EC2 instances have no resource-based policy. An option offering one is fabricated, and the exam uses that.',
        },
      ],
    },
    {
      id: 'how-iam-decides-principal-element',
      prompt:
        'You are shown a policy document with no filename and no context. It contains a Principal element. What kind of policy is it?',
      options: [
        {
          text: 'A resource policy — a bucket policy, key policy, queue policy or role trust policy',
          correct: true,
          why: 'Only resource policies have a Principal element, because an identity policy is already attached to one. It is a one-glance identification.',
        },
        {
          text: 'An identity policy attached to a role',
          correct: false,
          why: 'An identity policy never names a principal — the attachment already says who it applies to.',
        },
        {
          text: 'A permissions boundary',
          correct: false,
          why: 'A boundary is written in the same shape as an identity policy and caps what it can grant. It names no principal.',
        },
      ],
    },
  ],
}
