import type { AttachedPolicy, AuthRequest } from './types'

/**
 * Scenarios that isolate one rule of the evaluation model each. The point is to
 * predict the decision before seeing the trace — reading a policy and knowing
 * the answer are different skills, and only the second one is examined.
 */
export interface Puzzle {
  id: string
  title: string
  /** What the reader should reason about. */
  scenario: string
  policies: AttachedPolicy[]
  request: AuthRequest
  expected: boolean
  /** The rule this scenario isolates. */
  lesson: string
  difficulty: 1 | 2 | 3
}

const P = (
  id: string,
  name: string,
  kind: AttachedPolicy['kind'],
  doc: AttachedPolicy['doc'],
): AttachedPolicy => ({ id, name, kind, doc })

const ROLE = 'arn:aws:iam::111122223333:role/AppRole'

export const puzzles: Puzzle[] = [
  {
    id: 'explicit-deny',
    title: 'Explicit Deny versus AdministratorAccess',
    scenario:
      'The role has AdministratorAccess. A second policy denies s3:* on one bucket. The call is s3:GetObject on that bucket.',
    difficulty: 1,
    policies: [
      P('p1', 'AdministratorAccess', 'identity', {
        Statement: [{ Sid: 'AllowAll', Effect: 'Allow', Action: '*', Resource: '*' }],
      }),
      P('p2', 'DenyReports', 'identity', {
        Statement: [
          { Sid: 'BlockReports', Effect: 'Deny', Action: 's3:*', Resource: 'arn:aws:s3:::reports/*' },
        ],
      }),
    ],
    request: { principal: ROLE, action: 's3:GetObject', resource: 'arn:aws:s3:::reports/q3.pdf' },
    expected: false,
    lesson:
      'An explicit Deny wins over every Allow, from any policy type, with no exceptions. This is the first rule of IAM evaluation and the most-tested fact in the security domain.',
  },
  {
    id: 'scp-ceiling',
    title: 'An SCP that does not permit the action',
    scenario:
      'The identity policy allows s3:*. An SCP on the account only permits ec2:* and cloudwatch:*. The call is s3:GetObject.',
    difficulty: 2,
    policies: [
      P('p1', 'S3FullAccess', 'identity', {
        Statement: [{ Sid: 'S3All', Effect: 'Allow', Action: 's3:*', Resource: '*' }],
      }),
      P('p2', 'SandboxSCP', 'scp', {
        Statement: [
          { Sid: 'OnlyCompute', Effect: 'Allow', Action: ['ec2:*', 'cloudwatch:*'], Resource: '*' },
        ],
      }),
    ],
    request: { principal: ROLE, action: 's3:GetObject', resource: 'arn:aws:s3:::data/file.csv' },
    expected: false,
    lesson:
      'An SCP sets the maximum available permissions. Anything it does not permit is unavailable, and no identity policy can raise the ceiling — the effective permission is the intersection.',
  },
  {
    id: 'scp-alone',
    title: 'An SCP on its own',
    scenario:
      'An SCP allows s3:*. There is no identity policy granting anything. The call is s3:GetObject.',
    difficulty: 2,
    policies: [
      P('p1', 'PermissiveSCP', 'scp', {
        Statement: [{ Sid: 'AllowS3', Effect: 'Allow', Action: 's3:*', Resource: '*' }],
      }),
    ],
    request: { principal: ROLE, action: 's3:GetObject', resource: 'arn:aws:s3:::data/file.csv' },
    expected: false,
    lesson:
      'An SCP never grants anything — it only removes. Without an identity or resource policy that allows the action, the default deny stands. This is the most misunderstood fact about Organizations.',
  },
  {
    id: 'boundary',
    title: 'A permissions boundary narrowing an admin policy',
    scenario:
      'The role has s3:* through its identity policy, but a permissions boundary allows only s3:GetObject and s3:ListBucket. The call is s3:DeleteObject.',
    difficulty: 3,
    policies: [
      P('p1', 'S3FullAccess', 'identity', {
        Statement: [{ Sid: 'S3All', Effect: 'Allow', Action: 's3:*', Resource: '*' }],
      }),
      P('p2', 'ReadOnlyBoundary', 'boundary', {
        Statement: [
          { Sid: 'ReadOnly', Effect: 'Allow', Action: ['s3:GetObject', 's3:ListBucket'], Resource: '*' },
        ],
      }),
    ],
    request: { principal: ROLE, action: 's3:DeleteObject', resource: 'arn:aws:s3:::data/file.csv' },
    expected: false,
    lesson:
      'A permissions boundary caps the maximum permissions an identity can have. It is how you safely let developers create their own roles without letting them escalate.',
  },
  {
    id: 'cross-account-one-side',
    title: 'Cross-account with only the identity policy',
    scenario:
      'A role in account 1111 has s3:* on a bucket owned by account 9999. The bucket policy says nothing about this role. The call is cross-account s3:GetObject.',
    difficulty: 2,
    policies: [
      P('p1', 'S3FullAccess', 'identity', {
        Statement: [{ Sid: 'S3All', Effect: 'Allow', Action: 's3:*', Resource: '*' }],
      }),
    ],
    request: {
      principal: ROLE,
      action: 's3:GetObject',
      resource: 'arn:aws:s3:::partner-bucket/data.csv',
      crossAccount: true,
    },
    expected: false,
    lesson:
      'Cross-account access needs an Allow on both sides: the caller’s identity policy and the resource policy (or a role trust policy). An answer that configures only one side is wrong.',
  },
  {
    id: 'cross-account-both',
    title: 'Cross-account done correctly',
    scenario:
      'Same as before, but the bucket policy now explicitly allows this role. The call is cross-account s3:GetObject.',
    difficulty: 2,
    policies: [
      P('p1', 'S3FullAccess', 'identity', {
        Statement: [{ Sid: 'S3All', Effect: 'Allow', Action: 's3:*', Resource: '*' }],
      }),
      P('p2', 'PartnerBucketPolicy', 'resource', {
        Statement: [
          {
            Sid: 'AllowPartner',
            Effect: 'Allow',
            Action: 's3:GetObject',
            Resource: 'arn:aws:s3:::partner-bucket/*',
            Principal: ROLE,
          },
        ],
      }),
    ],
    request: {
      principal: ROLE,
      action: 's3:GetObject',
      resource: 'arn:aws:s3:::partner-bucket/data.csv',
      crossAccount: true,
    },
    expected: true,
    lesson:
      'Both halves are present, so the call succeeds. Note the resource policy names the principal explicitly — a wildcard Principal here would be a serious misconfiguration.',
  },
  {
    id: 'mfa-condition',
    title: 'A condition key that is not present',
    scenario:
      'The only Allow requires aws:MultiFactorAuthPresent to be true. The caller authenticated without MFA, so the key is false.',
    difficulty: 2,
    policies: [
      P('p1', 'MfaOnly', 'identity', {
        Statement: [
          {
            Sid: 'RequireMfa',
            Effect: 'Allow',
            Action: 's3:*',
            Resource: '*',
            Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } },
          },
        ],
      }),
    ],
    request: {
      principal: ROLE,
      action: 's3:DeleteObject',
      resource: 'arn:aws:s3:::data/file.csv',
      context: { 'aws:MultiFactorAuthPresent': 'false' },
    },
    expected: false,
    lesson:
      'A condition that is not satisfied means the statement does not apply at all. With no other Allow, the default deny stands — which is how you require MFA for sensitive actions.',
  },
  {
    id: 'region-lock',
    title: 'A conditional Deny outside approved Regions',
    scenario:
      'AdministratorAccess is attached, plus a Deny on everything when aws:RequestedRegion is not eu-west-1. The call targets us-east-1.',
    difficulty: 3,
    policies: [
      P('p1', 'AdministratorAccess', 'identity', {
        Statement: [{ Sid: 'AllowAll', Effect: 'Allow', Action: '*', Resource: '*' }],
      }),
      P('p2', 'RegionLock', 'scp', {
        Statement: [
          { Sid: 'AllowAll', Effect: 'Allow', Action: '*', Resource: '*' },
          {
            Sid: 'OnlyEu',
            Effect: 'Deny',
            Action: '*',
            Resource: '*',
            Condition: { StringNotEquals: { 'aws:RequestedRegion': 'eu-west-1' } },
          },
        ],
      }),
    ],
    request: {
      principal: ROLE,
      action: 'ec2:RunInstances',
      resource: '*',
      context: { 'aws:RequestedRegion': 'us-east-1' },
    },
    expected: false,
    lesson:
      'This is how "prevent anyone, even an administrator, from using unapproved Regions" is implemented: an SCP with a Deny on a aws:RequestedRegion condition.',
  },
  {
    id: 'ip-restriction',
    title: 'A source-IP condition that is satisfied',
    scenario:
      'The Allow is conditional on the request coming from the office range 203.0.113.0/24. The caller is at 203.0.113.42.',
    difficulty: 2,
    policies: [
      P('p1', 'OfficeOnly', 'identity', {
        Statement: [
          {
            Sid: 'OfficeIps',
            Effect: 'Allow',
            Action: 's3:GetObject',
            Resource: 'arn:aws:s3:::data/*',
            Condition: { IpAddress: { 'aws:SourceIp': '203.0.113.0/24' } },
          },
        ],
      }),
    ],
    request: {
      principal: ROLE,
      action: 's3:GetObject',
      resource: 'arn:aws:s3:::data/file.csv',
      context: { 'aws:SourceIp': '203.0.113.42' },
    },
    expected: true,
    lesson:
      'Condition keys are how you narrow permissions by network location, MFA, tag, time or VPC endpoint. Move the caller outside the range and the same policy denies.',
  },
  {
    id: 'resource-scope',
    title: 'An Allow scoped to the wrong resource',
    scenario:
      'The policy allows s3:* on arn:aws:s3:::public/* only. The call targets a different bucket.',
    difficulty: 1,
    policies: [
      P('p1', 'PublicBucketOnly', 'identity', {
        Statement: [
          { Sid: 'OneBucket', Effect: 'Allow', Action: 's3:*', Resource: 'arn:aws:s3:::public/*' },
        ],
      }),
    ],
    request: { principal: ROLE, action: 's3:GetObject', resource: 'arn:aws:s3:::private/secret.csv' },
    expected: false,
    lesson:
      'Resource ARNs are matched with wildcards, not ignored. A policy scoped to one bucket grants nothing on another — and note that bucket-level and object-level ARNs differ.',
  },
  {
    id: 'not-action',
    title: 'NotAction as everything except',
    scenario:
      'The policy allows every action except s3:DeleteObject. The call is s3:DeleteObject.',
    difficulty: 3,
    policies: [
      P('p1', 'AllButDelete', 'identity', {
        Statement: [
          { Sid: 'AllExceptDelete', Effect: 'Allow', NotAction: 's3:DeleteObject', Action: [], Resource: '*' },
        ],
      }),
    ],
    request: { principal: ROLE, action: 's3:DeleteObject', resource: 'arn:aws:s3:::data/file.csv' },
    expected: false,
    lesson:
      'NotAction means "every action except these". It is powerful and easy to get wrong — an Allow with NotAction grants far more than most people intend.',
  },
  {
    id: 'session-policy',
    title: 'A session policy passed at assume time',
    scenario:
      'The assumed role allows s3:*. A session policy passed during AssumeRole allows only s3:GetObject. The call is s3:PutObject.',
    difficulty: 3,
    policies: [
      P('p1', 'RolePolicy', 'identity', {
        Statement: [{ Sid: 'S3All', Effect: 'Allow', Action: 's3:*', Resource: '*' }],
      }),
      P('p2', 'SessionPolicy', 'session', {
        Statement: [{ Sid: 'ReadOnly', Effect: 'Allow', Action: 's3:GetObject', Resource: '*' }],
      }),
    ],
    request: { principal: ROLE, action: 's3:PutObject', resource: 'arn:aws:s3:::data/file.csv' },
    expected: false,
    lesson:
      'A session policy narrows a session further at assume time and can never expand it. It is how a broker service hands out deliberately restricted credentials from a broader role.',
  },
]
