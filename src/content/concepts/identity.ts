import type { Concept } from '../schema'

/**
 * IAM has a service atlas entry; these are the primitives that entry assumes.
 * An ARN, a principal and the difference between an identity policy and a
 * resource policy are vocabulary, not features, and a learner who cannot state
 * them reads every IAM question twice.
 */
export const identityConcepts: Concept[] = [
  {
    slug: 'arn',
    term: 'Amazon Resource Name',
    abbr: 'ARN',
    aka: ['ARN'],
    group: 'identity',
    families: ['saa', 'dva'],
    oneLiner:
      'The globally unique identifier for any AWS resource, in a fixed colon-separated shape.',
    whatItIs:
      'Every resource has an ARN, and every policy that names a resource names it by ARN. The shape is arn:partition:service:region:account-id:resource — for example arn:aws:s3:::my-bucket/key.txt, or arn:aws:iam::123456789012:role/AppRole. Some fields are deliberately empty: S3 bucket ARNs have no Region or account because bucket names are globally unique, and IAM ARNs have no Region because IAM is global.',
    keyIdea:
      'The empty fields are information, not omissions. An ARN with no Region belongs to a global service; one with no account belongs to a globally unique namespace.',
    onTheExam: [
      'A policy that grants access to a bucket needs two ARNs: the bucket for list operations and bucket/* for object operations. Only one of them is the common wrong answer.',
      'Wildcards are allowed in the resource portion, and a policy with Resource "*" is what "least privilege" questions are usually asking you to narrow.',
      "Cross-account policies are recognisable by an account id in the principal or resource ARN that differs from the caller's.",
    ],
    keyNumbers: [
      {
        label: 'Format',
        value: 'arn:partition:service:region:account-id:resource',
      },
      {
        label: 'Partitions',
        value: 'aws · aws-cn (China) · aws-us-gov (GovCloud)',
        note: 'Resources cannot be referenced across partitions.',
      },
      {
        label: 'S3 object ARN',
        value: 'arn:aws:s3:::bucket/key — no Region, no account',
      },
    ],
    examTraps: [
      'arn:aws:s3:::bucket and arn:aws:s3:::bucket/* are different resources. ListBucket needs the first, GetObject needs the second, and a policy with only one of them fails in a way the exam describes as puzzling.',
      'An IAM role ARN and the ARN of the session it produces are different strings. Trust policies use the role; some resource policies see the assumed-role session.',
    ],
    confusedWith: [
      {
        slug: 'principal',
        difference:
          'An ARN names any resource. A principal is specifically the identity making a request — often written as an ARN, but a role or user rather than a bucket.',
      },
    ],
    serviceSlugs: ['iam', 's3', 'kms', 'sts'],
    related: ['principal', 'identity-vs-resource-policy', 'least-privilege'],
    docsUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference-arns.html',
  },
  {
    slug: 'principal',
    term: 'Principal',
    group: 'identity',
    families: ['saa', 'dva'],
    oneLiner: 'The entity making a request: a user, a role session, a service, or another account.',
    whatItIs:
      'A principal is whoever is asking. It might be an IAM user, a role that something has assumed, an AWS service acting on your behalf such as lambda.amazonaws.com, another account, or an anonymous caller. Identity policies are attached to a principal; resource policies name one. Every authorisation decision starts by establishing which principal is asking.',
    keyIdea:
      'Only resource policies have a Principal element, because an identity policy is already attached to one. Seeing Principal in a policy tells you it is a resource policy without reading anything else.',
    onTheExam: [
      'A service principal such as lambda.amazonaws.com in a trust policy is what lets that service assume the role.',
      'Principal "*" with no condition is public access, and it is the answer to "how did this bucket become public".',
      'Cross-account access needs the other account named as a principal on one side and permission to call on the other. Both halves, always.',
    ],
    keyNumbers: [
      {
        label: 'Principal types',
        value: 'AWS account or IAM entity · service · federated · canonical user · anonymous',
      },
      {
        label: 'Trust policy',
        value: 'The resource policy of a role — it says who may assume it',
      },
    ],
    examTraps: [
      'Principal "*" combined with a condition is not necessarily public. The exam uses conditions such as aws:PrincipalOrgID or aws:SourceVpce to make a wildcard principal safe, and expects you to read the condition.',
      'A role has two policies and the exam relies on people forgetting one: the trust policy saying who can assume it, and the permissions policy saying what it can then do.',
    ],
    confusedWith: [
      {
        slug: 'role-assumption',
        difference:
          'A principal is who is asking. Role assumption is how a principal temporarily becomes a different one.',
      },
    ],
    serviceSlugs: ['iam', 'sts', 's3', 'kms', 'organizations'],
    related: ['arn', 'identity-vs-resource-policy', 'role-assumption'],
    docsUrl:
      'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html',
  },
  {
    slug: 'identity-vs-resource-policy',
    term: 'Identity policy versus resource policy',
    group: 'identity',
    families: ['saa', 'dva'],
    oneLiner: 'A policy attached to who is asking, versus one attached to what is being asked for.',
    whatItIs:
      'An identity-based policy hangs off a user, group or role and says what that identity may do. A resource-based policy hangs off the resource — a bucket, a queue, a KMS key, a Lambda function — and says who may act on it. Within one account, either can grant access on its own. Across accounts, you need both: the resource must allow the outside principal, and the outside principal must be allowed to call.',
    keyIdea:
      'Same account: either policy granting is enough. Cross-account: both must grant. An explicit Deny anywhere always wins, and so does an SCP that never allowed the action.',
    onTheExam: [
      '"Access denied despite a correct IAM policy" in a cross-account scenario means the resource policy is missing.',
      'A KMS key always needs its key policy to grant access. IAM permissions alone are never sufficient, and this is one of the most reliably examined facts in the security domain.',
      'An SCP is a ceiling, not a grant. It can only take permissions away, so "add an SCP to allow" is always wrong.',
    ],
    keyNumbers: [
      {
        label: 'Evaluation order',
        value:
          'Explicit Deny → SCP ceiling → resource policy or identity policy Allow → implicit Deny',
      },
      {
        label: 'Resource policies exist on',
        value: 'S3, SQS, SNS, KMS, Lambda, Secrets Manager, API Gateway, ECR, EFS, and others',
        note: 'Not on EC2 instances or DynamoDB tables — a distinction the exam uses.',
      },
    ],
    examTraps: [
      'An explicit Deny cannot be overridden by any Allow anywhere. Questions that pile on permissions to fix a Deny are testing this.',
      'A permissions boundary and an SCP both cap what an identity can do without granting anything. Neither ever appears as the answer to "how do we allow this".',
      'DynamoDB has no resource-based policy for table access, so cross-account access to a table goes through a role. An option offering a table policy is fabricated.',
    ],
    confusedWith: [
      {
        slug: 'least-privilege',
        difference:
          'This is about where a permission is written. Least privilege is about how narrow it should be. A resource policy can be just as over-broad as an identity one.',
      },
    ],
    serviceSlugs: ['iam', 's3', 'kms', 'sqs', 'lambda', 'organizations'],
    related: ['principal', 'arn', 'least-privilege', 'role-assumption'],
    docsUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html',
  },
  {
    slug: 'role-assumption',
    term: 'Role assumption',
    aka: ['AssumeRole', 'temporary credentials', 'instance profile'],
    group: 'identity',
    families: ['saa', 'dva'],
    oneLiner:
      'Trading your identity for a short-lived set of credentials with a different permission set.',
    whatItIs:
      "Calling sts:AssumeRole returns temporary credentials — an access key, a secret and a session token — that expire. The role's trust policy decides who may assume it; its permissions policy decides what the session can then do. This is the mechanism behind almost every access pattern AWS recommends: EC2 instance profiles, Lambda execution roles, cross-account access, and federated sign-in from an external identity provider.",
    keyIdea:
      'Roles exist so that nothing has to hold a long-lived credential. Any exam option that stores an access key on an instance, in code, or in an environment variable is wrong, and the correct answer is a role.',
    onTheExam: [
      '"How should the application on EC2 access S3" — an instance profile with a role. Never an access key in a config file.',
      '"Grant a team in another account read access" — a role in this account with their account as the trusted principal.',
      '"Users sign in with the corporate directory" — federation with IAM Identity Center or SAML, which issues role sessions.',
    ],
    keyNumbers: [
      {
        label: 'Session duration',
        value: '15 minutes to 12 hours, 1 hour by default',
        note: 'Role chaining caps the maximum at 1 hour.',
      },
      {
        label: 'ExternalId',
        value: 'The condition that prevents the confused-deputy problem',
        note: 'Expected whenever a third party assumes a role in your account.',
      },
      {
        label: 'Credentials source on EC2',
        value: 'The instance metadata service — IMDSv2 is the token-protected version',
      },
    ],
    examTraps: [
      "Role chaining reduces the maximum session to one hour regardless of the role's configured maximum. A long-running job that fails after an hour is describing this.",
      'A role needs both policies. Granting permissions without editing the trust policy produces an assume-role failure that reads like a permissions problem.',
      'IMDSv1 allows a server-side request forgery to steal instance credentials. When a stem mentions SSRF or credential theft from an instance, the answer is enforcing IMDSv2.',
    ],
    confusedWith: [
      {
        slug: 'principal',
        difference:
          'A principal is who is asking right now. Assuming a role replaces that principal with a temporary one for the length of the session.',
      },
    ],
    serviceSlugs: ['sts', 'iam', 'iam-identity-center', 'ec2', 'lambda', 'cognito'],
    related: ['principal', 'identity-vs-resource-policy', 'least-privilege'],
    docsUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html',
  },
  {
    slug: 'least-privilege',
    term: 'Least privilege',
    group: 'identity',
    families: ['saa', 'dva'],
    oneLiner: 'Granting only the permissions actually needed, and no more.',
    whatItIs:
      'Least privilege means starting from nothing and adding only what a task requires — specific actions, specific resources, and conditions that narrow when the permission applies. AWS gives you several tools for it: policy conditions, permissions boundaries, SCPs, and IAM Access Analyzer, which can generate a policy from what an identity has actually used.',
    keyIdea:
      'On this exam, least privilege is a tie-breaker. When two options both work, the one that names specific actions and specific resource ARNs is the answer, and the one with a wildcard is not.',
    onTheExam: [
      'An option using a managed policy such as AmazonS3FullAccess is almost always the distractor when a narrower custom policy is offered.',
      '"Generate a policy based on actual usage" is IAM Access Analyzer policy generation, which reads CloudTrail.',
      'Conditions such as aws:SourceIp, aws:PrincipalOrgID, aws:SourceArn and s3:prefix are how the exam expresses "narrow it further".',
    ],
    keyNumbers: [
      {
        label: 'Managed policy limit',
        value: '10 managed policies per identity',
        volatile: true,
      },
      {
        label: 'Inline policy size',
        value: '2,048 characters for a user, 10,240 for a role',
        volatile: true,
      },
      {
        label: 'Access Analyzer',
        value:
          'Finds resources shared outside a zone of trust, and generates policies from CloudTrail',
      },
    ],
    examTraps: [
      'Least privilege applies to resource policies too. A bucket policy with Principal "*" is over-broad however tight the IAM side is.',
      'A permissions boundary does not grant anything. It caps what an identity policy can grant, and an answer that uses one to allow an action is wrong.',
      'Root user access keys should not exist at all. Any option that uses the root user for routine work is wrong on this exam without further reading.',
    ],
    confusedWith: [
      {
        slug: 'blast-radius',
        difference:
          'Least privilege narrows what one identity may do. Blast radius narrows how far any single failure or compromise reaches, which is usually an account boundary rather than a policy.',
      },
    ],
    serviceSlugs: ['iam', 'organizations', 'iam-identity-center', 'cloudtrail'],
    related: ['identity-vs-resource-policy', 'role-assumption', 'blast-radius', 'arn'],
    docsUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html',
  },
]
