import type { Lesson } from '../schema'

/**
 * Batch 2, lesson 2 — the identity cluster.
 *
 * Every fact is already in the atlas: `sts` and `iam` in the service corpus,
 * and the `role-assumption` and `principal` concepts. The contribution here is
 * the order — the credential arriving on an instance nobody configured, watched
 * before the words "instance profile" are used; the role's *two* policies read
 * out side by side because forgetting one is the trap; and the access key
 * written into user-data as real shell before it is rejected.
 *
 * Depends on `how-iam-decides`: the trust policy only reads as a resource
 * policy if you already know what a resource policy is.
 */
export const rolesNotKeys: Lesson = {
  id: 'roles-not-keys',
  families: ['saa'],
  taskId: 'saa-1.1',
  cluster: 'identity',
  title: 'Roles, not keys',
  subtitle:
    'Why an access key in an environment variable is the wrong answer to every question, and what arrives instead on an instance nobody put a credential on.',
  minutes: 12,
  tier: 1,
  serviceSlugs: ['sts', 'iam', 'ec2', 'lambda'],
  requires: ['how-iam-decides'],
  cardIds: [
    'idea:role-assumption',
    'num:concept:role-assumption:session-duration',
    'num:concept:role-assumption:externalid',
    'num:concept:role-assumption:credentials-source-on-ec2',
    'trap:concept:role-assumption:role-chaining-reduces-the-maximum-session-to-one-hour-regard',
    'trap:concept:role-assumption:a-role-needs-both-policies-granting-permissions-without-edi',
    'trap:concept:role-assumption:imdsv1-allows-a-server-side-request-forgery-to-steal-instanc',
    'num:sts:session-duration',
    'num:sts:role-chaining',
    'num:sts:key-apis',
    'trap:iam:never-store-access-keys-on-an-ec2-instance-the-answer-is-an',
    'num:concept:principal:trust-policy',
  ],

  sections: [
    /* ── 1. The hook ─────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'An access key in an environment variable works. It works on your laptop, it works on the instance, it works in the pipeline — which is exactly why it is such a durable wrong answer. The reason it is wrong is not that it fails; it is that it never expires. It leaks into a repository or a laptop and stays valid until somebody notices, and revoking it means finding every copy. So watch what turns up instead on a server where nobody put a credential at all.',
    },

    /* ── 2. Watch it happen, before the definition ───────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'rnk-chain',
        title: 'Where the credential comes from when there is no key',
        caption:
          'Nothing on the instance holds a secret. Step through it and note where the only permanent thing in the picture is.',
        // Template B: a left-to-right chain fanning out at the end. The spacing
        // is what puts every edge label in the gap between two boxes rather
        // than on top of one.
        cols: 19,
        rows: 8,
        nodes: [
          {
            id: 'iam',
            label: 'IAM role',
            sub: 'AppServerRole',
            kind: 'service',
            category: 'security',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'sts',
            label: 'STS',
            sub: 'mints the session',
            kind: 'service',
            category: 'security',
            x: 5.4,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'ec2',
            label: 'App on EC2',
            sub: 'no key anywhere',
            kind: 'service',
            category: 'compute',
            x: 10.4,
            y: 3.3,
            w: 3,
            h: 1.3,
          },
          {
            id: 's3',
            label: 'S3',
            sub: 'reports-bucket',
            kind: 'service',
            category: 'storage',
            x: 15.2,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'dynamodb',
            label: 'DynamoDB',
            sub: 'orders table',
            kind: 'service',
            category: 'database',
            x: 15.2,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'assume', from: 'iam', to: 'sts', label: 'assume', tone: 'info' },
          { id: 'creds', from: 'sts', to: 'ec2', label: 'temp creds', tone: 'ok' },
          { id: 'get', from: 'ec2', to: 's3', label: 'GetObject', tone: 'ok' },
          { id: 'query', from: 'ec2', to: 'dynamodb', label: 'Query', tone: 'ok' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['assume'],
            title: 'The role is a permission set that nobody holds',
            detail:
              'It has two policies and the exam relies on people forgetting one: the **trust policy** saying who may assume it, and the **permissions policy** saying what it may then do. Nothing is signed in as this role right now — that is the point of it.',
            tone: 'info',
          },
          {
            edgeIds: ['creds'],
            title: 'STS hands back credentials that expire',
            detail:
              'An access key, a secret and a session token, with an expiry — 15 minutes to 12 hours, 1 hour by default. On EC2 they arrive through the instance metadata service, and the SDK fetches and refreshes them without the application asking. Nothing was written to disk.',
            tone: 'ok',
          },
          {
            edgeIds: ['get', 'query'],
            title: 'The application signs its calls and never sees a key',
            detail:
              'The credential provider chain looks in order: environment variables, the shared config file, container credentials, then the instance metadata service. The first two are empty here, which is the whole design — [[role-assumption]] is what makes "use a role, not access keys" the right answer to almost every access question.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the words for it',
      md: 'On EC2 that role attachment is an **instance profile**; on Lambda it is an **execution role**; on ECS there is a pair of them. Whatever it is called, the mechanism underneath is one `sts:AssumeRole` call and a credential with an expiry. [[sts|STS]] is the service doing the minting, and every federated login and every instance profile credential comes out of it.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The ECS pair, because DVA asks it directly',
      md: 'The **execution role** belongs to the platform: it pulls the image, ships the logs, and injects secrets from [[secrets-manager|Secrets Manager]] or Parameter Store. The **task role** is what your code uses. Secret injection is done by the execution role, not the task role — that is the detail most often missed, and mixing the two up is a standard distractor.',
    },

    /* ── 3. The real configuration, read one line at a time ──────────────── */
    { kind: 'heading', text: 'A role is two documents, not one' },
    {
      kind: 'code',
      lang: 'json',
      caption: 'AppServerRole — the trust policy, and then the permissions policy',
      code: `TRUST POLICY — who may become this role
{
  "Effect": "Allow",
  "Principal": { "Service": "ec2.amazonaws.com" },
  "Action": "sts:AssumeRole"
}

PERMISSIONS POLICY — what the session may then do
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::reports-bucket/*"
}`,
    },
    {
      kind: 'steps',
      title: 'The same two documents, one line at a time',
      items: [
        {
          title: 'The trust policy has a Principal, so it is a resource policy',
          md: 'It is *the* resource policy of the role — that is exactly what a trust policy is. And a service principal such as `ec2.amazonaws.com` in one is what lets that service assume the role at all. Swap it for `lambda.amazonaws.com` and the same permissions become a Lambda execution role.',
        },
        {
          title: 'sts:AssumeRole is the action being permitted',
          md: 'Not `s3:GetObject` — becoming the role and using the role are two separate authorisations. The other APIs in the family are worth recognising: `AssumeRoleWithSAML` for enterprise identity providers, `AssumeRoleWithWebIdentity` for OIDC, social login and Cognito, plus `GetSessionToken` and `GetFederationToken`.',
        },
        {
          title: 'The permissions policy is a completely separate document',
          md: 'A role needs both. Granting permissions without editing the trust policy produces an assume-role failure that reads like a permissions problem, and questions are built on breaking one and asking why access fails.',
        },
        {
          title: 'A session policy can be passed at assume time, and only narrows',
          md: 'It is one of the ceilings from [[identity-vs-resource-policy|the evaluation order]] — passed in the `AssumeRole` call to further restrict what this particular session may do. It cannot expand anything, ever.',
        },
      ],
    },

    /* ── 4. The wrong answer, written out ────────────────────────────────── */
    { kind: 'heading', text: 'The configuration to reject on sight' },
    {
      kind: 'prose',
      md: 'The alternative is not exotic. It is two lines, it is what a great many real systems do, and it is what an exam option looks like when it is dressed up as "securely store the credentials on the instance":',
    },
    {
      kind: 'code',
      lang: 'bash',
      caption: 'user-data on the instance — the option the question wants you to reject',
      code: `export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# no expiry, no rotation, and it is now in the launch template,
# the AMI, the backup of the AMI, and anybody's console session`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Never store access keys on an instance',
      md: 'The answer is an instance profile with a role, and this appears constantly. It generalises: anything that runs code should use a role — EC2 instance profiles, Lambda execution roles, ECS task roles. If a question describes access keys on a compute resource, the answer is almost always an IAM role, and you can usually pick it without reading the other options carefully.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'And the two variants of the same question',
      md: 'On-premises servers that need AWS credentials without long-lived keys are **IAM Roles Anywhere**. Root user access keys should not exist at all — any option that uses the root user for routine work is wrong on this exam without further reading.',
    },

    /* ── 5. The two limits that produce whole questions ──────────────────── */
    { kind: 'heading', text: 'Two limits, and one condition' },
    {
      kind: 'prose',
      md: 'Three details about role sessions carry more question weight than their size suggests, because each one produces a symptom that looks like something else.',
    },
    {
      kind: 'steps',
      title: 'What each one looks like in a stem',
      items: [
        {
          title: 'A long-running job fails after exactly an hour',
          md: 'Role chaining — assuming a role from a session that is itself a role session — is capped at **1 hour regardless of the role setting**, even when `MaxSessionDuration` on the role is set to 12. A question about a job losing credentials mid-flight may be pointing at this and nothing else.',
        },
        {
          title: 'A third-party vendor needs access to your account',
          md: "A role in your account with the vendor's account as the trusted principal, plus an **ExternalId** — the condition that prevents the confused-deputy problem, expected whenever a third party assumes a role in your account. It is what stops the vendor being manipulated into using its access to your account on someone else's behalf.",
        },
        {
          title: 'A stem mentions SSRF, or credentials stolen from an instance',
          md: 'IMDSv1 allows a server-side request forgery to steal instance credentials. The answer is enforcing **IMDSv2**, the token-protected version of the metadata service. Nothing about the role or its policies is wrong in that scenario.',
        },
        {
          title: 'Sensitive actions must require MFA',
          md: 'MFA can be required in a trust policy, or through an `aws:MultiFactorAuthPresent` condition on the permission itself. Both are conditions rather than new structure — reach for a condition key before inventing an account or a boundary.',
        },
      ],
    },

    /* ── 6. The comparison, last ─────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'A long-lived key against a role session',
      columns: ['Access key', 'Role session'],
      rows: [
        {
          label: 'How it reaches the workload',
          cells: ['Somebody puts it there', 'The metadata service hands it over, refreshed'],
        },
        {
          label: 'Lifetime',
          cells: ['Until a human revokes it', '15 minutes to 12 hours, 1 hour by default'],
        },
        {
          label: 'Role chaining',
          cells: ['Not applicable', 'Capped at 1 hour, whatever the role says'],
        },
        {
          label: 'Who may use it',
          cells: [
            'Anyone holding the string',
            'Whoever the trust policy names — a service, an account, a federated identity',
          ],
        },
        {
          label: 'Cross-account',
          cells: [
            'Share the secret and hope',
            'A trust policy naming their account, plus an ExternalId for a third party',
          ],
        },
        {
          label: 'On-premises servers',
          cells: ['The historical reason keys existed', 'IAM Roles Anywhere'],
        },
        {
          label: 'As an exam option',
          cells: ['Almost always the distractor', 'Almost always the answer'],
        },
      ],
    },

    /* ── 7. Numbers ──────────────────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'Session duration',
          value: '15 minutes to 12 hours, capped by the role’s maximum session duration',
        },
        { label: 'Role chaining', value: 'Capped at 1 hour, regardless of the role setting' },
        {
          label: 'Key APIs',
          value:
            'AssumeRole · AssumeRoleWithSAML · AssumeRoleWithWebIdentity · GetSessionToken · GetFederationToken',
        },
        {
          label: 'Session policies',
          value: 'Passed at assume time to further narrow permissions — they cannot expand them',
        },
        {
          label: 'ExternalId',
          value: 'The condition that prevents the confused-deputy problem',
        },
        {
          label: 'Credentials source on EC2',
          value: 'The instance metadata service — IMDSv2 is the token-protected version',
        },
      ],
    },

    /* ── 8. Where to go next ─────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these credentials get used',
      slugs: ['sts', 'iam', 'secrets-manager', 'iam-identity-center'],
    },
    {
      kind: 'prose',
      md: 'A role removes the credential from your code; it does not remove the *password your database still needs*. That is [[secrets-manager|Secrets Manager]], fetched at run time under IAM. And when the thing being protected is data rather than a call, the resource policy involved is a key policy — read **KMS and envelope encryption** next.',
    },
  ],

  /* ── Checks ───────────────────────────────────────────────────────────── */
  checks: [
    {
      id: 'roles-not-keys-instance-profile',
      prompt:
        'An application on EC2 must read objects from S3. Which option is the exam looking for?',
      options: [
        {
          text: 'An instance profile with a role granting s3:GetObject',
          correct: true,
          why: 'Anything that runs code should use a role. The credentials arrive through the metadata service and expire on their own.',
        },
        {
          text: 'An access key for a dedicated IAM user, stored in an encrypted file on the instance',
          correct: false,
          why: 'Encrypting the file changes nothing important: the key still never expires, and it is still copied into every AMI and backup taken of that instance.',
        },
        {
          text: 'An access key injected as an environment variable by the deployment pipeline',
          correct: false,
          why: 'The credential provider chain will find it — that is why this works and why it is still wrong. A long-lived key is a permanent liability wherever it is put.',
        },
      ],
    },
    {
      id: 'roles-not-keys-externalid',
      prompt:
        'A monitoring vendor needs read access to your account. You create a role and add their account as the trusted principal. What else does the exam expect?',
      options: [
        {
          text: 'An ExternalId condition in the trust policy',
          correct: true,
          why: 'It is the defence against the confused-deputy problem, and it is expected whenever a third party assumes a role in your account.',
        },
        {
          text: 'An IAM user for the vendor with an access key you send them',
          correct: false,
          why: 'This is the pattern role assumption exists to replace. The key never expires and you cannot see who used it.',
        },
        {
          text: 'A permissions boundary on the role instead of a permissions policy',
          correct: false,
          why: 'A boundary grants nothing — it only caps. Without a permissions policy the session can do nothing at all.',
        },
      ],
    },
    {
      id: 'roles-not-keys-chaining',
      prompt:
        'A batch job assumes a role from an existing role session. MaxSessionDuration on the target role is set to 12 hours. The job dies after 60 minutes. Why?',
      options: [
        {
          text: 'Role chaining is capped at 1 hour regardless of the role setting',
          correct: true,
          why: 'The cap applies whenever the caller is already a role session, and it ignores MaxSessionDuration entirely. A job failing at exactly an hour is often describing this.',
        },
        {
          text: 'The trust policy expired and needs to be reattached',
          correct: false,
          why: 'Policies do not expire. Sessions do, and this one hit the chaining cap.',
        },
        {
          text: 'The instance metadata service stopped refreshing credentials',
          correct: false,
          why: 'That path refreshes automatically and is not involved once a role has been assumed explicitly.',
        },
      ],
    },
    {
      id: 'roles-not-keys-imdsv2',
      prompt:
        'A stem describes an attacker using a server-side request forgery against a web application on EC2 to obtain AWS credentials. What is the fix?',
      options: [
        {
          text: 'Enforce IMDSv2 on the instances',
          correct: true,
          why: 'IMDSv1 allows exactly this. IMDSv2 is the token-protected version of the metadata service, and enforcing it is the direct answer.',
        },
        {
          text: 'Replace the instance profile with an access key held in Secrets Manager',
          correct: false,
          why: 'That reintroduces a long-lived credential to solve a problem with how a temporary one is fetched. Wrong direction entirely.',
        },
        {
          text: 'Narrow the role’s permissions policy',
          correct: false,
          why: 'Sound hygiene, and it limits the damage rather than closing the hole. The stem is describing the theft mechanism, not the blast radius.',
        },
      ],
    },
  ],
}
