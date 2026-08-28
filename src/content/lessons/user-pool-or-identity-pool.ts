import type { Lesson } from '../schema'

/**
 * Cognito is two products under one name and the exam knows it. Almost every
 * DVA identity question is decided by one reading: is the requirement about
 * *signing someone in*, or about *what AWS credentials they then hold*?
 *
 * So the picture comes before either name. One customer, one sign-in, and the
 * token going two different places — to your API, and to a pool that trades it
 * for credentials. The two boxes at the junction are the two pools, and they
 * are named only after the reader has watched them do different jobs.
 *
 * The wrong answer is written as two real CLI calls that would succeed: an IAM
 * user and an access key per customer. "IAM users are for AWS principals" is a
 * sentence; `aws iam create-access-key --user-name customer-8fd21e` is a
 * demonstration of what the wrong model actually asks you to type.
 *
 * `requires` is deliberately empty even though the identity pool half is role
 * assumption: the two lessons that cover that ground are SAA-only, and a
 * "read this first" card pointing at a lesson outside the reader's cert is
 * worse than no card.
 */
export const userPoolOrIdentityPool: Lesson = {
  id: 'user-pool-or-identity-pool',
  families: ['saa', 'dva'],
  taskId: 'dva-2.1',
  title: 'Two pools, and only one of them logs anybody in',
  subtitle:
    'A user pool and an identity pool are constantly presented as alternatives, and they are not — they are consecutive steps that a question can ask for one of, or both of. Reading which one a stem wants takes a single sentence, once you have watched them do different things to the same token.',
  minutes: 15,
  tier: 1,
  serviceSlugs: ['cognito'],
  requires: [],
  cardIds: [
    'which:cognito',
    'not:cognito',
    'num:cognito:user-pool',
    'num:cognito:identity-pool-federated-identities',
    'num:cognito:token-lifetimes',
    'num:cognito:lambda-triggers',
    'num:cognito:guest-access',
    'trap:cognito:authentication-user-pool-aws-credentials-identity-pool',
    'trap:cognito:a-cognito-user-pool-authoriser-on-api-gateway-validates-the',
    'trap:cognito:identity-pool-role-policies-can-use-policy-variables-like',
    'trap:cognito:cognito-user-pools-support-mfa-and-adaptive-authentication',
    'trap:cognito:a-lambda-authoriser-is-the-answer-when-the-token-is-a-third',
    'vs:cognito:iam',
    'vs:cognito:iam-identity-center',
    'vs:iam:cognito',
    'vs:sts:cognito',
    'idea:role-assumption',
    'define:role-assumption',
    'num:concept:role-assumption:session-duration',
    'trigger:t-app-users',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'The most common wrong answer in this whole area is not a service — it is a model. Somebody reads “each customer needs their own permissions” and reaches for an IAM user per customer. [[cognito|Cognito]] exists because your customers are not AWS principals, and it does that in two pieces that get confused constantly. Watch the same token go to two different places and the distinction stops needing to be memorised.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'upip-two-pools',
        title: 'One sign-in, one token, and two entirely different things done with it',
        caption:
          'Nothing about the customer or the token differs between the two branches. What differs is what the application needs next — to call your own API, or to call AWS itself.',
        // Template B, fan-in-the-middle: the same journey, forking on which
        // pool the token is handed to.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'customer',
            label: 'Your customer',
            sub: 'in a mobile app',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'cognito',
            label: 'User pool',
            sub: 'the directory',
            kind: 'service',
            category: 'security',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'api-gateway',
            label: 'Your API',
            sub: 'user pool authoriser',
            kind: 'service',
            category: 'frontend',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'cognito-identity',
            label: 'Identity pool',
            sub: 'the exchange desk',
            kind: 'service',
            category: 'security',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'lambda',
            label: 'Your function',
            sub: 'runs with its own role',
            kind: 'service',
            category: 'serverless',
            x: 17,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 's3',
            label: 'S3, from the phone',
            sub: 'no API in between',
            kind: 'service',
            category: 'storage',
            x: 17,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'signin', from: 'customer', to: 'cognito', label: 'sign in', tone: 'default' },
          { id: 'present', from: 'cognito', to: 'api-gateway', label: 'the JWT', tone: 'ok' },
          { id: 'backend', from: 'api-gateway', to: 'lambda', label: 'invoke', tone: 'ok' },
          { id: 'trade', from: 'cognito', to: 'cognito-identity', label: 'same JWT', tone: 'info' },
          { id: 'creds', from: 'cognito-identity', to: 's3', label: 'STS keys', tone: 'info' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['signin'],
            title: 'The user pool signs them in — and that is all it does',
            detail:
              'Registration, login, MFA, password policies, social and SAML federation. What comes back is **three JWTs: ID, access and refresh**. None of them is an AWS credential.',
            tone: 'default',
          },
          {
            edgeIds: ['present', 'backend'],
            title: 'Branch one: the token is presented to your own API',
            detail:
              'A **Cognito user pool authoriser on API Gateway validates the JWT for you** — no Lambda authoriser needed unless the logic is custom. Your function then runs with its own execution role, which has nothing to do with the customer.',
            tone: 'ok',
          },
          {
            edgeIds: ['trade'],
            title: 'Branch two: the identical token is handed to an identity pool instead',
            detail:
              'An identity pool takes a token — from a user pool, from Google, from Facebook, from SAML, or **nothing at all for guests** — and does one job with it.',
            tone: 'info',
          },
          {
            edgeIds: ['creds'],
            title: 'And that job is an exchange, via STS, for temporary AWS credentials',
            detail:
              'Now the phone holds real AWS credentials, scoped by an IAM role, and can call S3 directly with no API of yours in the path. That is the capability the top branch never had.',
            tone: 'info',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the sentence, and it decides most of these questions on its own',
      md: '**Authentication → user pool. AWS credentials → identity pool.** If a question asks for both — “sign in, then upload straight to S3” — the answer uses both, in that order. The exam builds options that offer one where you need two, so read the requirement for the second half before you pick.',
    },

    /* ── 3. The policy, read out one line at a time ───────────────────────── */
    { kind: 'heading', text: 'What the credentials on that phone are allowed to do' },
    {
      kind: 'code',
      lang: 'json',
      caption:
        'One policy on the identity pool’s authenticated role, for every user you will ever have',
      code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource":
        "arn:aws:s3:::app-uploads/\${cognito-identity.amazonaws.com:sub}/*"
    }
  ]
}`,
    },
    {
      kind: 'steps',
      title: 'Three things that policy is quietly telling you',
      items: [
        {
          title: 'It is attached to a role, not to a person',
          md: 'The identity pool hands out a role, and [[role-assumption|assuming a role]] is what produces the temporary credentials. There is no user object anywhere in this design, which is the whole point.',
        },
        {
          title: 'The variable is what makes one policy behave like millions',
          md: 'Identity-pool role policies can use policy variables like `${cognito-identity.amazonaws.com:sub}` to **confine each user to their own S3 prefix**. That is the standard per-user-folder answer, and “without writing a policy per user” is the phrasing that asks for it.',
        },
        {
          title: 'An unauthenticated user can be given a different role entirely',
          md: 'Identity pools support **unauthenticated identities with their own role**, so a guest browsing without an account is not an exception you code around — it is a second role with a smaller policy.',
        },
      ],
    },

    /* ── 4. The wrong answer, as real syntax ──────────────────────────────── */
    { kind: 'heading', text: 'What the other model asks you to type' },
    {
      kind: 'code',
      lang: 'bash',
      caption: '“Every customer needs their own permissions, so every customer gets an IAM user”',
      code: `aws iam create-user --user-name customer-8fd21e
aws iam create-access-key --user-name customer-8fd21e
        ^^^^^^^^^^^^^^^^^
        A long-lived key, for a person who is not an AWS principal, to
        be shipped to a phone you do not control. Then repeat it for
        the next hundred thousand sign-ups, and revoke it on deletion.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'This one is always wrong, and it is offered every time',
      md: '**IAM users are for AWS principals, never for your customers. Creating an IAM user per app user is always wrong.** IAM authorises AWS API calls for your own principals; Cognito authenticates your customers and can then hand them scoped IAM credentials. The scale argument is the obvious objection, but the modelling argument is the one that makes it unconditional.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The neighbouring pair: which authoriser',
      md: '**A Lambda authoriser is the answer when the token is a third-party JWT or the authorisation logic is custom — not when it is a Cognito token.** A Cognito token in front of a Cognito authoriser needs no code at all, and an option offering a Lambda authoriser for it is offering you work you do not have to do.',
    },
    {
      kind: 'callout',
      tone: 'ok',
      title: 'And the two features people forget the user pool already has',
      md: '**Cognito user pools support MFA and adaptive authentication** — that is the answer to “add MFA to our application’s users”, with nothing bolted on. **Lambda triggers** — pre-sign-up, pre-authentication, post-confirmation, custom message and more — are where your own logic goes when the requirement is “do something at sign-up” rather than “replace the sign-up”.',
    },

    /* ── 5. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'The sentence in the stem, and which half of Cognito it is asking for',
      columns: ['What it is asking for', 'The answer sitting next to it'],
      rows: [
        {
          label: '“Sign-up and sign-in for our application’s users”',
          cells: [
            'A user pool — a directory that issues JWTs',
            'An identity pool, which authenticates nobody',
          ],
        },
        {
          label: '“The app must upload straight to S3 from the device”',
          cells: [
            'An identity pool, for temporary AWS credentials via STS',
            'A user pool token, which no AWS service accepts as a credential',
          ],
        },
        {
          label: '“Each user may only see their own files”',
          cells: [
            'One role policy with a Cognito policy variable in the prefix',
            'A policy or a role per user, which is what the variable exists to avoid',
          ],
        },
        {
          label: '“Browsing works without an account”',
          cells: [
            'An identity pool unauthenticated identity, with its own role',
            'A shared long-lived key in the app bundle',
          ],
        },
        {
          label: '“Our staff need access to the AWS console”',
          cells: [
            'IAM Identity Center — workforce, not customers',
            'A Cognito user pool, which is the customer-facing directory',
          ],
        },
        {
          label: '“These two backend services must authenticate to each other”',
          cells: [
            'IAM roles — both sides are AWS principals',
            'Cognito, which is for the humans using your application',
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
          label: 'User pool',
          value: 'Directory + authentication; issues ID, access and refresh JWTs',
        },
        {
          label: 'Identity pool (federated identities)',
          value: 'Exchanges a token for temporary AWS credentials via STS',
        },
        {
          label: 'Token lifetimes',
          value: 'ID and access tokens 1 hour by default; refresh tokens up to 10 years',
        },
        {
          label: 'Lambda triggers',
          value: 'Pre-sign-up, pre-authentication, post-confirmation, custom message, and more',
        },
        {
          label: 'Guest access',
          value: 'Identity pools support unauthenticated identities with their own role',
        },
      ],
    },

    /* ── 7. Next ──────────────────────────────────────────────────────────── */
    { kind: 'services', title: 'Where these facts live', slugs: ['cognito'] },
    {
      kind: 'prose',
      md: 'The top branch of that diagram was drawn as a single arrow into your API, and there is a whole lesson inside it: what the front door does with the request once the authoriser has said yes, and which status code it produces when something further along goes wrong.',
    },
  ],

  checks: [
    {
      id: 'user-pool-or-identity-pool-both',
      prompt:
        'A mobile app must let customers sign in with email or Google, and then upload photos directly to S3 from the device. What does it need?',
      options: [
        {
          text: 'A user pool to authenticate, and an identity pool to exchange the resulting token for temporary AWS credentials',
          correct: true,
          why: 'Authentication is the user pool’s job; AWS credentials are the identity pool’s. A requirement with both halves needs both pools, in that order.',
        },
        {
          text: 'A user pool alone — the app sends its JWT to S3 as the credential',
          correct: false,
          why: 'A user pool issues JWTs, and no AWS service accepts a JWT as a credential. Something has to exchange it for AWS keys, and that is the identity pool.',
        },
        {
          text: 'An IAM user per customer with an access key stored in the app’s keychain',
          correct: false,
          why: 'IAM users are for AWS principals, never for your customers. This is the model Cognito exists to replace, and it is always the wrong answer.',
        },
      ],
    },
    {
      id: 'user-pool-or-identity-pool-prefix',
      prompt:
        'Each user must be able to read and write only their own folder in one bucket, and the team does not want to maintain a policy per user. What does that?',
      options: [
        {
          text: 'One role policy whose resource ARN embeds ${cognito-identity.amazonaws.com:sub}',
          correct: true,
          why: 'Policy variables turn a single policy into per-user isolation. "Without a policy per user" is the phrasing that asks for them directly.',
        },
        {
          text: 'A separate IAM role per user, assumed after sign-in',
          correct: false,
          why: 'This is the maintenance burden the requirement rules out. The identity pool hands out one role, and the variable does the per-user part.',
        },
        {
          text: 'A bucket policy listing each user’s prefix',
          correct: false,
          why: 'That is a policy per user wearing a different hat — and it grows with every sign-up, which is exactly what the requirement forbids.',
        },
      ],
    },
    {
      id: 'user-pool-or-identity-pool-authoriser',
      prompt:
        'An API Gateway REST API must accept the JWT that your Cognito user pool issues. What is the least work that achieves it?',
      options: [
        {
          text: 'A Cognito user pool authoriser, which validates the token for you',
          correct: true,
          why: 'No custom logic is needed for a Cognito token — the authoriser type exists for exactly this and requires no code.',
        },
        {
          text: 'A Lambda authoriser that fetches the pool’s public keys and verifies the signature',
          correct: false,
          why: 'A Lambda authoriser is the answer when the token is a third-party JWT or the logic is custom. Here it is code you would maintain for a feature you already have.',
        },
        {
          text: 'IAM authorisation, with the app signing each request',
          correct: false,
          why: 'IAM authorisation is for AWS principals signing requests. Your customer holds a user pool JWT, not AWS credentials.',
        },
      ],
    },
    {
      id: 'user-pool-or-identity-pool-guest',
      prompt:
        'Visitors with no account must be able to read from a DynamoDB table, with narrower permissions than signed-in users. What supports that?',
      options: [
        {
          text: 'An identity pool unauthenticated identity, with its own IAM role',
          correct: true,
          why: 'Identity pools support unauthenticated identities and give them a separate role, so guest permissions are a policy rather than a special case in your code.',
        },
        {
          text: 'A shared user pool account whose credentials ship with the application',
          correct: false,
          why: 'That is a long-lived shared secret in a client you do not control, and it makes every guest indistinguishable in every log.',
        },
        {
          text: 'A user pool with the password policy disabled for guest accounts',
          correct: false,
          why: 'A user pool authenticates people who have accounts. Guest access is an identity pool feature, and the requirement says there is no account.',
        },
      ],
    },
  ],
}
