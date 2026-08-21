import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const securityServices: Service[] = [
  {
    slug: 'iam',
    name: 'AWS IAM',
    abbr: 'IAM',
    category: 'security',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Who may perform which action on which resource, under which conditions.',
    whatItIs:
      'The authorisation engine every AWS API call passes through. Identities (users, groups, roles) carry identity policies; resources (buckets, keys, queues) can carry resource policies. Every request is evaluated against all applicable policies, and the order is fixed and testable: an explicit Deny anywhere wins; otherwise an Allow is needed; otherwise the default is deny. Organizations SCPs and permissions boundaries cap what a policy can grant, they never grant anything themselves.',
    whyItExists:
      'The account you signed up with owns everything and can spend without limit, and there is exactly one of it. Sharing that login with a second person means neither of you can ever be told apart in an audit, and revoking one person\'s access means changing the password for everybody. IAM exists so that identity, permission and credential are three separate things you can change independently — which is what makes "this contractor may read one bucket, until Friday" expressible at all.',
    whenToUse: [
      'Always — there is no opting out',
      'Roles for anything that is code: EC2 instance profiles, Lambda execution roles, ECS task roles',
      'Cross-account access via role assumption rather than shared long-lived keys',
      'Conditions to narrow permissions by IP, MFA, tag, VPC endpoint or time',
    ],
    whenNotToUse: [
      "Authenticating your application's end users — that is Cognito",
      'Human workforce sign-in at scale — that is IAM Identity Center with an external identity provider',
      'Long-lived access keys for anything that could use a role instead',
    ],
    keyNumbers: [
      {
        label: 'Evaluation order',
        value: 'Explicit Deny → SCP/boundary/session-policy cap → Allow → implicit Deny',
      },
      {
        label: 'Policy types',
        value:
          'Identity-based · Resource-based · Permissions boundary · SCP · Session policy · ACL',
      },
      {
        label: 'Managed policies per identity',
        value: '10 attached, raisable to 20',
        volatile: true,
      },
      { label: 'Inline policy size', value: '2,048 characters for a user, 10,240 for a role' },
      {
        label: 'Roles',
        value: 'Trust policy (who may assume) plus permissions policy (what they may then do)',
      },
      { label: 'Scope', value: 'IAM is global — not regional' },
      {
        label: 'Analysis tools',
        value: 'IAM Access Analyzer for external access · policy simulator · last-accessed data',
      },
    ],
    examTraps: [
      'Explicit Deny always wins, from any policy type, no matter what else allows it. This is the single most-tested rule in the exam.',
      'An SCP does not grant permissions. If an SCP allows an action but no identity policy does, the call still fails. SCPs only remove.',
      "Cross-account access needs both sides: the resource policy (or role trust policy) must allow the caller, and the caller's identity policy must allow the action. Answers that mention only one side are wrong.",
      'Never store access keys on an EC2 instance. The answer is an instance profile with a role — this appears constantly.',
      'A permissions boundary caps the maximum permissions an identity can have. It is how you safely let developers create their own roles.',
      'IAM Roles Anywhere is how on-premises servers get temporary credentials without long-lived keys.',
      'Resource policies allow cross-account access without role assumption for services that support them (S3, KMS, SQS, SNS, Lambda). Not every service does.',
      'Wildcards in Action or Resource are the classic least-privilege violation the exam wants you to reject.',
    ],
    confusedWith: [
      {
        slug: 'iam-identity-center',
        difference:
          'Identity Center is workforce single sign-on across accounts, mapping identity-provider groups to permission sets. IAM is the underlying per-account authorisation engine.',
      },
      {
        slug: 'cognito',
        difference:
          "Cognito authenticates your application's customers; IAM authorises access to AWS APIs.",
      },
      {
        slug: 'sts',
        difference:
          'STS is the token service that mints the temporary credentials a role assumption produces.',
      },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/IAM/latest/UserGuide/introduction.html`,
    related: ['sts', 'iam-identity-center', 'organizations', 'kms', 'cognito', 'secrets-manager'],
  },
  {
    slug: 'sts',
    name: 'AWS STS',
    abbr: 'STS',
    category: 'security',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Mints short-lived credentials — the mechanism behind every role assumption.',
    whatItIs:
      'The Security Token Service issues temporary access key, secret key and session token triples with an expiry. Every role assumption, every federated login, every instance profile credential comes from STS. Temporary credentials are the answer to almost any question containing the words "long-lived access keys".',
    whyItExists:
      'Access keys used to be long-lived, so a key pasted into a script, a laptop or a repository stayed valid until a human noticed and revoked it — and on an EC2 instance the credential had to be put there somehow in the first place. STS exists so credentials expire on their own: a role is something you assume for an hour, which is what makes "use a role, not access keys" the right answer to almost every access question.',
    whenToUse: [
      'Cross-account access: AssumeRole into the target account',
      'Federation: AssumeRoleWithSAML for enterprise identity providers, AssumeRoleWithWebIdentity for OIDC/social/Cognito',
      'Any workload that should not hold a permanent credential',
      'Adding an ExternalId when a third party assumes a role in your account',
    ],
    whenNotToUse: ['Nothing much — prefer STS credentials over static keys essentially always'],
    keyNumbers: [
      {
        label: 'Session duration',
        value: "15 minutes to 12 hours, capped by the role's maximum session duration",
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
    ],
    examTraps: [
      "A role's trust policy names *who* may assume it; its permissions policy says what they can then do. Questions often break one and ask why access fails.",
      'ExternalId is specifically the defence against the confused-deputy problem when a third-party vendor assumes a role in your account.',
      'Role chaining silently caps sessions at one hour. A question about a long-running job losing credentials mid-flight may be pointing at this.',
      'MFA can be required in a trust policy or via an `aws:MultiFactorAuthPresent` condition — the answer to "require MFA for sensitive actions".',
    ],
    confusedWith: [
      {
        slug: 'iam',
        difference:
          'IAM defines the permissions; STS hands out the temporary credentials that carry them.',
      },
      {
        slug: 'cognito',
        difference:
          'Cognito identity pools call STS on your behalf to exchange a user token for AWS credentials.',
      },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/STS/latest/APIReference/welcome.html`,
    related: ['iam', 'cognito', 'iam-identity-center', 'organizations'],
  },
  {
    slug: 'iam-identity-center',
    name: 'AWS IAM Identity Center',
    category: 'security',
    families: ['saa', 'dva'],
    tier: 2,
    oneLiner: 'Workforce single sign-on across every account in the organisation.',
    whatItIs:
      'The successor to AWS SSO. It connects to an external identity provider (Okta, Entra ID, Google Workspace) or hosts its own directory, then maps groups to *permission sets* — reusable IAM policy bundles — assigned to accounts. One login, one place to revoke, no per-account IAM users.',
    whyItExists:
      "Human access used to be an IAM user per person per account, so a fifteen-account estate meant fifteen credentials to create, fifteen to remember, and fifteen to remember to delete on someone's last day — which is precisely the thing that gets missed. Identity Center exists so people log in through the identity provider that already governs employment, and access is a permission set assignment revoked in one place.",
    whenToUse: [
      'Human access to many AWS accounts',
      'Federating an existing corporate identity provider',
      'Eliminating per-account IAM users and long-lived keys for staff',
      'Central assignment and audit of who can do what, where',
    ],
    whenNotToUse: [
      'Application end users — Cognito',
      'Machine-to-machine access — IAM roles',
      'A single account with two administrators, where the setup overhead is not worth it',
    ],
    keyNumbers: [
      {
        label: 'Permission sets',
        value: 'Reusable policy bundles assigned to (account, group) pairs',
      },
      {
        label: 'Identity sources',
        value: 'Built-in directory · Active Directory · external SAML 2.0 IdP',
      },
      { label: 'Prerequisite', value: 'AWS Organizations' },
      { label: 'Protocols', value: 'SAML 2.0 and SCIM for automatic user provisioning' },
    ],
    examTraps: [
      'The exam tell is "employees", "workforce", "existing corporate directory" or "many accounts, one sign-in". IAM users are the wrong answer to all of those now.',
      'Identity Center still works through IAM roles underneath — a permission set materialises as a role in each assigned account.',
      'SCIM is what keeps users and groups in sync automatically when someone joins or leaves.',
    ],
    confusedWith: [
      {
        slug: 'cognito',
        difference:
          'Identity Center is for your staff accessing AWS; Cognito is for your customers accessing your app.',
      },
      {
        slug: 'directory-service',
        difference:
          'Directory Service provides a managed Active Directory; Identity Center consumes a directory to grant AWS access.',
      },
    ],
    pricing: 'Free (the directory or IdP may cost separately).',
    docsUrl: `${D}/singlesignon/latest/userguide/what-is.html`,
    related: ['iam', 'organizations', 'directory-service', 'sts'],
  },
  {
    slug: 'organizations',
    name: 'AWS Organizations',
    category: 'security',
    families: ['saa'],
    tier: 1,
    oneLiner: 'Multi-account structure with consolidated billing and service control policies.',
    whatItIs:
      'A management account plus member accounts, arranged into organizational units. It gives you consolidated billing with pooled volume discounts and shared Reserved Instances or Savings Plans, and — the security half — service control policies that set a permission ceiling for every principal in an account, including the root user.',
    whyItExists:
      'IAM can express what a person may do, but everything still shares one billing account, one set of service quotas, and one blast radius — so a mistyped command in a test still deletes a production table, and no policy an administrator can write also constrains that administrator. Organizations exists because some boundaries have to sit above the account: an SCP is a ceiling nobody inside can raise, and a separate account is the only isolation that survives someone having admin.',
    whenToUse: [
      'Any environment with more than one account, which in practice means any serious environment',
      'Separating prod, dev, sandbox and audit by account boundary',
      'Enforcing guardrails: deny Region use, deny disabling CloudTrail, deny leaving the organisation',
      'Consolidating the bill and sharing commitments across accounts',
    ],
    whenNotToUse: ['A genuinely single-account hobby environment'],
    keyNumbers: [
      { label: 'SCPs', value: 'Set the maximum available permissions — they never grant anything' },
      {
        label: 'SCP scope',
        value: 'Apply to member accounts, including their root user',
        note: 'They do not apply to the management account.',
      },
      {
        label: 'Feature sets',
        value: 'Consolidated billing only, or All features (required for SCPs)',
      },
      { label: 'Billing', value: 'One bill, pooled volume tiers, shared RIs and Savings Plans' },
      {
        label: 'Related services',
        value:
          'Control Tower, CloudTrail organisation trails, Config aggregators, RAM, Backup policies',
      },
    ],
    examTraps: [
      'SCPs do not apply to the management account. Putting your workloads there is therefore a security anti-pattern the exam expects you to reject.',
      'An SCP that allows an action does not grant it — the account still needs an identity policy. This is the most misunderstood Organizations fact.',
      'Tag policies, backup policies and AI opt-out policies are separate policy types from SCPs.',
      '"Prevent anyone, even an administrator, from using unapproved Regions" is an SCP with a `aws:RequestedRegion` condition.',
    ],
    confusedWith: [
      {
        slug: 'control-tower',
        difference:
          'Control Tower is an opinionated landing-zone product built *on* Organizations, with prescriptive guardrails and account provisioning.',
      },
      { slug: 'iam', difference: 'IAM grants permissions; SCPs only cap them.' },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/organizations/latest/userguide/orgs_introduction.html`,
    related: ['control-tower', 'iam', 'ram', 'cloudtrail', 'budgets', 'iam-identity-center'],
  },
  {
    slug: 'control-tower',
    name: 'AWS Control Tower',
    category: 'security',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Prescriptive, automated multi-account landing zone with guardrails.',
    whatItIs:
      'A managed setup that creates a well-architected multi-account baseline: an organisation, a log-archive account, an audit account, IAM Identity Center, centralised CloudTrail and Config, plus preventive (SCP) and detective (Config rule) controls. Account Factory provisions new accounts to that standard on request.',
    whyItExists:
      'Everyone arrived at the same multi-account baseline eventually — an organisation, a log archive, an audit account, centralised CloudTrail, SSO, some guardrails — but each got there over months of blog posts and hand-built scripts, and the tenth account rarely matched the first. Control Tower exists so that baseline is a prescribed setup rather than a project, and new accounts are minted to the standard instead of drifting from it.',
    whenToUse: [
      'Standing up a new multi-account environment quickly and correctly',
      'Enforcing and continuously monitoring guardrails across accounts',
      'Self-service account provisioning with a compliant baseline',
    ],
    whenNotToUse: [
      'A highly bespoke organisation that already has its own landing-zone automation',
      'A single account',
    ],
    keyNumbers: [
      {
        label: 'Control types',
        value: 'Preventive (SCPs) · Detective (Config rules) · Proactive (CloudFormation hooks)',
      },
      {
        label: 'Creates',
        value:
          'Log archive account, audit account, organisation, Identity Center, centralised logging',
      },
      {
        label: 'Account Factory',
        value: 'Provisioning of new accounts to the baseline, via Service Catalog',
      },
      { label: 'Drift detection', value: 'Reports when an account no longer matches the baseline' },
    ],
    examTraps: [
      'The tell is "set up a secure multi-account environment quickly following best practices". Building it by hand with Organizations plus scripts is the answer Control Tower exists to replace.',
      'Control Tower uses Organizations, Config, CloudTrail, Service Catalog and Identity Center underneath — it is orchestration, not a new primitive.',
    ],
    confusedWith: [
      {
        slug: 'organizations',
        difference:
          'Organizations is the primitive; Control Tower is the opinionated product that configures it for you.',
      },
      {
        slug: 'service-catalog',
        difference:
          'Service Catalog serves curated products to users; Control Tower uses it for Account Factory.',
      },
    ],
    pricing:
      'No charge for Control Tower; you pay for the services it enables (Config, CloudTrail, S3).',
    docsUrl: `${D}/controltower/latest/userguide/what-is-control-tower.html`,
    related: ['organizations', 'config', 'cloudtrail', 'service-catalog', 'iam-identity-center'],
  },
  {
    slug: 'ram',
    name: 'AWS Resource Access Manager',
    abbr: 'RAM',
    category: 'security',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Share specific resources across accounts without duplicating them.',
    whatItIs:
      'Lets one account share resources — VPC subnets, Transit Gateways, Route 53 Resolver rules, License Manager configurations, Aurora clusters and more — with other accounts or the whole organisation. Shared subnets are the notable one: several accounts can launch resources into the same VPC while networking stays centrally owned.',
    whyItExists:
      'Sharing meant duplicating: each account got its own VPC, its own Transit Gateway attachment, its own resolver rules, and the network team lost any single view of the estate. The alternative was one giant shared account, which throws away the isolation that separate accounts were for. RAM exists so a resource can be owned in one account and used from others — shared subnets being the case the exam cares about.',
    whenToUse: [
      'Centralised networking: one network account owns the VPC, application accounts launch into shared subnets',
      'Sharing a Transit Gateway across the organisation',
      'Avoiding duplicate infrastructure per account',
    ],
    whenNotToUse: [
      'Sharing data — that is a resource policy on S3 or KMS',
      'Granting API permissions — that is a cross-account IAM role',
    ],
    keyNumbers: [
      { label: 'Share targets', value: 'Individual accounts, OUs, or the whole organisation' },
      {
        label: 'Notable shareable resources',
        value: 'VPC subnets · Transit Gateway · Resolver rules · License Manager · Aurora',
      },
    ],
    examTraps: [
      '"Multiple accounts must deploy into the same VPC" is RAM subnet sharing, not VPC peering.',
      'RAM shares resources; it does not share permissions to call APIs. That distinction gets tested.',
    ],
    confusedWith: [
      {
        slug: 'vpc-peering',
        difference: 'Peering connects two separate VPCs; RAM lets several accounts use one VPC.',
      },
      {
        slug: 'organizations',
        difference: 'Organizations defines the account structure; RAM shares resources across it.',
      },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/ram/latest/userguide/what-is.html`,
    related: ['organizations', 'transit-gateway', 'vpc', 'iam'],
  },
  {
    slug: 'directory-service',
    name: 'AWS Directory Service',
    category: 'security',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Managed Active Directory, or a connector to the one you already run.',
    whatItIs:
      'Three options with distinct answers. AWS Managed Microsoft AD is a real, managed Active Directory in your VPC, trustable with an on-premises domain. AD Connector is a proxy that redirects requests to your existing on-premises AD without storing anything in AWS. Simple AD is a small, cheap Samba-based directory with limited features.',
    whyItExists:
      'Windows workloads, file shares and enterprise logins all assume Active Directory, and moving them to AWS otherwise meant either a VPN back to a domain controller in the office — with authentication depending on the tunnel — or running and patching domain controllers on EC2. Directory Service exists to offer both answers as managed options, which is why the exam is asking whether users must stay in the on-premises directory or can live in AWS.',
    whenToUse: [
      'Managed Microsoft AD: Windows workloads, FSx for Windows, RDS SQL Server Windows authentication, or an AWS-resident directory',
      'AD Connector: reuse the on-premises directory as the single source of truth with no directory in AWS',
      'Simple AD: small workloads needing basic LDAP and Linux/Samba joins, at low cost',
    ],
    whenNotToUse: [
      'Application end users — Cognito',
      'AWS console access for staff — Identity Center, which can consume this directory',
    ],
    keyNumbers: [
      {
        label: 'Managed Microsoft AD',
        value: 'Real AD in your VPC, supports two-way trusts, Standard and Enterprise editions',
      },
      { label: 'AD Connector', value: 'Proxy only — no directory data stored in AWS' },
      { label: 'Simple AD', value: 'Samba-based, no trusts, no MFA, limited features' },
    ],
    examTraps: [
      '"Do not store or replicate directory data in AWS" means AD Connector, every time.',
      'FSx for Windows File Server and RDS SQL Server Windows authentication both need a real Managed Microsoft AD (or a trust to one) — AD Connector will not do.',
      'Simple AD supports no trust relationships. Any trust requirement rules it out.',
    ],
    confusedWith: [
      {
        slug: 'iam-identity-center',
        difference:
          'Identity Center grants AWS access using a directory; Directory Service provides the directory.',
      },
      {
        slug: 'cognito',
        difference: 'Cognito is for application users, not domain-joined machines.',
      },
    ],
    pricing: 'Per directory-hour by type and size.',
    docsUrl: `${D}/directoryservice/latest/admin-guide/what_is.html`,
    related: ['iam-identity-center', 'fsx', 'rds', 'client-vpn'],
  },
  {
    slug: 'cognito',
    name: 'Amazon Cognito',
    category: 'security',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: "Sign-up, sign-in and AWS credentials for your application's end users.",
    whatItIs:
      'Two components that are constantly confused, and the exam knows it. A *user pool* is a user directory: it handles registration, login, MFA, password policies, social and SAML federation, and issues JWT tokens (ID, access, refresh). An *identity pool* takes a token — from a user pool, Google, Facebook, SAML, or nothing at all for guests — and exchanges it via STS for temporary AWS credentials so the client can call AWS services directly.',
    whyItExists:
      'Every application rebuilt the same login: a users table, password hashing somebody hoped was current, email verification, password reset, then MFA and "sign in with Google" bolted on later. It is security-critical code with no competitive value, and each copy was a fresh chance to leak a credential database. Cognito exists to be that directory as a service — and, through identity pools, to turn an end-user login into temporary AWS credentials so a browser never holds a long-lived key.',
    whenToUse: [
      'User pool: authenticating customers of a web or mobile app, with hosted UI or your own',
      'Identity pool: letting an authenticated (or guest) client upload directly to S3 or query DynamoDB with scoped credentials',
      'API Gateway authorisation via a Cognito user pool authoriser',
      'Federating social or enterprise logins into one consistent identity',
    ],
    whenNotToUse: [
      'Staff access to the AWS console — that is IAM Identity Center',
      'Service-to-service authentication — IAM roles',
    ],
    keyNumbers: [
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
    examTraps: [
      'Authentication → user pool. AWS credentials → identity pool. If a question asks for both ("sign in, then upload straight to S3"), the answer uses both.',
      'A Cognito user pool authoriser on API Gateway validates the JWT for you — no Lambda authoriser needed unless the logic is custom.',
      'Identity-pool role policies can use policy variables like `${cognito-identity.amazonaws.com:sub}` to confine each user to their own S3 prefix. That is the standard per-user-folder answer.',
      'Cognito user pools support MFA and adaptive authentication — the answer to "add MFA to our application\'s users".',
      'A Lambda authoriser is the answer when the token is a third-party JWT or the authorisation logic is custom, not when it is a Cognito token.',
    ],
    confusedWith: [
      {
        slug: 'iam',
        difference:
          'IAM authorises AWS API calls for your own principals; Cognito authenticates your customers and can then hand them scoped IAM credentials.',
      },
      { slug: 'iam-identity-center', difference: 'Workforce versus customers.' },
    ],
    pricing:
      'Per monthly active user, with a free tier, plus charges for advanced security features.',
    docsUrl: `${D}/cognito/latest/developerguide/what-is-amazon-cognito.html`,
    related: ['iam', 'sts', 'api-gateway', 'appsync', 's3', 'lambda'],
  },
  {
    slug: 'kms',
    name: 'AWS KMS',
    abbr: 'KMS',
    category: 'security',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Managed encryption keys, integrated into almost every AWS service.',
    whatItIs:
      'A key-management service holding KMS keys whose material never leaves the service unencrypted. Because a KMS key can only encrypt up to 4 KB directly, real data is protected with *envelope encryption*: KMS generates a data key, you encrypt the data with it locally, and store the KMS-encrypted copy of that data key alongside the ciphertext. Key policies — resource policies on the key — are what actually control use, and they are the most commonly missed half of a cross-account setup.',
    whyItExists:
      "Encryption was never the hard part; keeping the key was. It ended up in a config file, a repository, or an operator's head — and rotating it meant re-encrypting everything, so nobody rotated it. Auditing who had used it was impossible, because using a key leaves no trace. KMS exists to hold key material that never comes out in the clear, make every use an IAM-authorised and logged API call, and make envelope encryption the normal way to protect data larger than 4 KB.",
    whenToUse: [
      'Encryption at rest for S3, EBS, RDS, DynamoDB, EFS, Secrets Manager, SNS, SQS — essentially everywhere',
      'Auditable key usage: every KMS call is logged in CloudTrail',
      'Cross-account encrypted data sharing, via a key policy plus a grant',
      'Automatic annual key rotation with old versions retained for decryption',
    ],
    whenNotToUse: [
      'A regulatory requirement for a dedicated, single-tenant FIPS 140-3 Level 3 HSM you control — that is CloudHSM',
      'Storing secrets themselves — KMS holds keys, Secrets Manager holds secrets',
      'Bulk data encryption directly through the API — use envelope encryption instead of the 4 KB limit',
    ],
    keyNumbers: [
      { label: 'Direct encrypt limit', value: '4 KB' },
      {
        label: 'Key types',
        value: 'AWS owned · AWS managed (aws/service) · Customer managed (CMK)',
      },
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
        value: 'Same key material replicated across Regions, for cross-Region encrypted workloads',
      },
      {
        label: 'Key material origin',
        value:
          'KMS-generated · imported (BYOK) · CloudHSM-backed custom key store · external key store',
      },
    ],
    examTraps: [
      'The key policy is authoritative. If the key policy does not permit the principal, no IAM policy can rescue it. "Access denied on a KMS-encrypted object despite full S3 permissions" is this, essentially always.',
      'Only customer-managed keys give you control over the policy, rotation and cross-account sharing. AWS-managed keys do not — so any question about controlling or auditing rotation means a CMK.',
      'Envelope encryption is examined explicitly: KMS never sees your bulk data, only the data key.',
      'A cross-Region encrypted snapshot copy needs a key in the *destination* Region (or a multi-Region key). A single-Region key cannot decrypt elsewhere.',
      'Key deletion cannot be immediate. Disabling a key is instant; scheduling deletion takes 7–30 days.',
      'ViaService conditions restrict a key to use through a specific service — a least-privilege detail worth recognising.',
      'For very high request volumes, watch the shared KMS request quota — that is what data-key caching (via the Encryption SDK) exists to solve.',
    ],
    confusedWith: [
      {
        slug: 'cloudhsm',
        difference:
          'CloudHSM is a single-tenant HSM cluster you administer, with FIPS 140-3 Level 3 and no AWS access to your keys. KMS is multi-tenant, cheaper, and integrated everywhere.',
      },
      {
        slug: 'secrets-manager',
        difference:
          'Secrets Manager stores and rotates credentials and encrypts them with KMS. Different layers, not alternatives.',
      },
      {
        slug: 'acm',
        difference:
          'ACM manages TLS certificates for data in transit; KMS manages keys for data at rest.',
      },
    ],
    pricing:
      'Per customer-managed key-month plus per 10,000 API requests. AWS-managed keys are free to store.',
    docsUrl: `${D}/kms/latest/developerguide/overview.html`,
    related: ['cloudhsm', 'secrets-manager', 's3', 'ebs', 'acm', 'iam', 'cloudtrail'],
  },
  {
    slug: 'cloudhsm',
    name: 'AWS CloudHSM',
    category: 'security',
    families: ['saa', 'dva'],
    tier: 2,
    oneLiner: 'Dedicated single-tenant hardware security modules that only you can access.',
    whatItIs:
      'A cluster of FIPS 140-3 Level 3 validated hardware security modules in your VPC. You control the users and keys; AWS cannot access the key material and cannot recover it if you lose your credentials. Accessed through standard PKCS#11, JCE and CNG libraries rather than the AWS API.',
    whyItExists:
      'KMS is multi-tenant and AWS operates it, which is fine until a regulator or a contract requires that key material sit in single-tenant, FIPS 140-3 Level 3 hardware that the provider demonstrably cannot reach — or until an application only speaks PKCS#11. Racking your own HSMs answered that and left you owning the hardware. CloudHSM exists for those requirements, with the consequence that losing your credentials loses the keys, because AWS genuinely cannot recover them.',
    whenToUse: [
      'A regulatory requirement for single-tenant, FIPS 140-3 Level 3 hardware',
      'You must be the only party with any access to the key material',
      'Offloading SSL/TLS processing, or running a private certificate authority',
      'Workloads needing PKCS#11 or JCE rather than the KMS API',
    ],
    whenNotToUse: [
      'Ordinary encryption at rest — KMS is far cheaper and integrated with every service',
      'You want AWS to handle availability and backup of the keys for you',
    ],
    keyNumbers: [
      { label: 'Validation', value: 'FIPS 140-3 Level 3' },
      { label: 'Tenancy', value: 'Single tenant, in your VPC' },
      {
        label: 'AWS access to keys',
        value: 'None — including no recovery if you lose credentials',
      },
      { label: 'Interfaces', value: 'PKCS#11 · JCE · CNG/KSP' },
      { label: 'HA', value: 'Deploy HSMs across at least two AZs' },
    ],
    examTraps: [
      'The exam signals are "FIPS 140-3 Level 3", "single-tenant", "we must control the keys and AWS must not have access", or "PKCS#11". Without one of those, the answer is KMS.',
      'A KMS custom key store backed by CloudHSM is the hybrid answer: KMS integration with CloudHSM-held material.',
      'You are responsible for HSM users, key backup and availability. Losing credentials means losing the keys permanently.',
    ],
    confusedWith: [
      {
        slug: 'kms',
        difference:
          'KMS is multi-tenant, cheap and integrated. CloudHSM is single-tenant, expensive and yours alone to operate.',
      },
    ],
    pricing: 'Per HSM-hour — materially more than KMS.',
    docsUrl: `${D}/cloudhsm/latest/userguide/introduction.html`,
    related: ['kms', 'acm', 'vpc'],
  },
  {
    slug: 'acm',
    name: 'AWS Certificate Manager',
    abbr: 'ACM',
    category: 'security',
    families: ['saa', 'dva'],
    tier: 2,
    oneLiner: 'Free public TLS certificates that renew themselves, for AWS-integrated services.',
    whatItIs:
      'Provisions, stores and renews TLS certificates. Public certificates issued by ACM are free and auto-renew when validated by DNS. They can be attached to CloudFront, ALB, NLB, API Gateway and a few others — but the private key never leaves ACM, so you cannot install one on an EC2 instance yourself.',
    whyItExists:
      "TLS certificates were bought, installed by hand, and forgotten until they expired — usually on a weekend, usually taking a public site down, always for a task that had been on somebody's calendar for a year. Renewal touched every load balancer and instance that held a copy of the key. ACM exists to make issuance and renewal automatic, at the price that the private key never leaves it — which is exactly why you cannot put an ACM certificate on an EC2 instance yourself.",
    whenToUse: [
      'HTTPS on CloudFront, ALB, NLB or API Gateway',
      'Removing manual certificate renewal from your operations',
      'ACM Private CA for internal certificates on instances, containers and IoT devices',
    ],
    whenNotToUse: [
      'Installing a certificate directly on an EC2 web server — ACM public certificates cannot be exported',
      'Code signing or SSH keys',
    ],
    keyNumbers: [
      { label: 'Public certificates', value: 'Free, and auto-renew' },
      { label: 'Validation', value: 'DNS (recommended, enables auto-renewal) or email' },
      { label: 'CloudFront requirement', value: 'The certificate must be in us-east-1' },
      {
        label: 'Exportability',
        value: 'Public ACM certificates cannot be exported; Private CA certificates can',
      },
    ],
    examTraps: [
      'The us-east-1 requirement for CloudFront is asked directly, and it applies regardless of where the origin lives.',
      'For a regional service (ALB, API Gateway), the certificate must be in that same Region.',
      'DNS validation with a Route 53 record is what makes renewal automatic. Email validation does not renew itself reliably.',
      '"We need the certificate installed on our EC2 instances" points to ACM Private CA or a third-party certificate, not a public ACM certificate.',
    ],
    confusedWith: [
      {
        slug: 'kms',
        difference:
          'ACM secures data in transit with certificates; KMS secures data at rest with keys.',
      },
      {
        slug: 'secrets-manager',
        difference:
          'Secrets Manager can store a certificate as a secret, but it does not issue or renew it.',
      },
    ],
    pricing:
      'Public certificates free. Private CA charges per CA-month plus per certificate issued.',
    docsUrl: `${D}/acm/latest/userguide/acm-overview.html`,
    related: ['cloudfront', 'elb', 'route53', 'kms', 'api-gateway'],
  },
  {
    slug: 'secrets-manager',
    name: 'AWS Secrets Manager',
    category: 'security',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner:
      'Stores secrets, encrypts them with KMS, and rotates database credentials automatically.',
    whatItIs:
      'A secret store with a rotation engine. Secrets are KMS-encrypted, retrieved via an IAM-authorised API call, and can be rotated on a schedule by a Lambda function — with built-in rotation support for RDS, Aurora, Redshift and DocumentDB credentials. Cross-account access works through a resource policy on the secret.',
    whyItExists:
      'Database passwords lived in environment variables, config files and CI settings, which means they were copied, committed and never rotated — because rotating one required finding every copy and coordinating a deploy. Secrets Manager exists to make the credential something you fetch at run time under IAM, so rotation is a scheduled change in one place instead of a hunt.',
    whenToUse: [
      'Database credentials, API keys and third-party tokens your application needs at runtime',
      'Any requirement for *automatic* credential rotation',
      'Cross-account or cross-Region secret replication',
      'Removing credentials from code, environment variables and configuration files',
    ],
    whenNotToUse: [
      'Non-secret configuration — SSM Parameter Store standard parameters are free',
      'Encryption keys — those belong in KMS',
      'Tiny budgets where Parameter Store SecureString is enough and rotation is not required',
    ],
    keyNumbers: [
      { label: 'Cost', value: 'Per secret-month plus per 10,000 API calls' },
      { label: 'Built-in rotation', value: 'RDS, Aurora, Redshift, DocumentDB' },
      { label: 'Custom rotation', value: 'Any secret, via your own Lambda rotation function' },
      { label: 'Cross-account', value: 'Via a resource policy on the secret' },
      { label: 'Replication', value: 'Multi-Region secret replicas' },
    ],
    examTraps: [
      'Secrets Manager versus Parameter Store is a guaranteed comparison. Automatic rotation, cross-account resource policies and built-in database integration mean Secrets Manager. Free storage and simple configuration mean Parameter Store.',
      'Parameter Store SecureString also encrypts with KMS — encryption alone does not distinguish them. Rotation does.',
      'RDS Proxy retrieves credentials from Secrets Manager, which is how Lambda functions connect with no password in code.',
      'A private-subnet Lambda needs an interface VPC endpoint (or NAT) to reach the Secrets Manager API.',
    ],
    confusedWith: [
      {
        slug: 'systems-manager',
        difference:
          'Parameter Store is free for standard parameters and stores configuration; Secrets Manager costs per secret and adds automatic rotation and resource policies.',
      },
      {
        slug: 'kms',
        difference: 'KMS holds the key that encrypts the secret; Secrets Manager holds the secret.',
      },
    ],
    pricing: 'Per secret-month plus per 10,000 API calls.',
    docsUrl: `${D}/secretsmanager/latest/userguide/intro.html`,
    related: ['kms', 'systems-manager', 'rds', 'rds-proxy', 'lambda', 'iam'],
  },
  {
    slug: 'waf',
    name: 'AWS WAF',
    category: 'security',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Layer 7 web application firewall — SQL injection, XSS, bad bots, rate limits.',
    whatItIs:
      'Inspects HTTP requests before they reach your application and allows, blocks, counts or CAPTCHAs them. Rules match on IP, country, headers, body, URI, size and regex, plus managed rule groups from AWS and vendors. It attaches to CloudFront, ALB, API Gateway, AppSync, Cognito user pools and App Runner — but never to an NLB, because there is no HTTP layer to inspect there.',
    whyItExists:
      'Injection, cross-site scripting and credential stuffing arrive as perfectly valid HTTP, so a firewall that only sees IPs and ports waves them straight through, and the only defence was the application code itself — patched at the speed of your release cycle. WAF exists to put a rule layer in front that can block a pattern today, and to rate-limit a client that is technically behaving but doing it ten thousand times a minute.',
    whenToUse: [
      'Blocking SQL injection, cross-site scripting and other OWASP Top 10 patterns',
      'Rate-based rules to throttle a single IP flooding an endpoint',
      'Geo-blocking, IP allowlists and denylists',
      'Bot Control for scrapers and automated traffic',
    ],
    whenNotToUse: [
      'Layer 3/4 volumetric DDoS — that is Shield',
      'Non-HTTP traffic — Network Firewall or an NLB with security groups',
      'Simple IP-based network filtering, where a NACL is free',
    ],
    keyNumbers: [
      {
        label: 'Attach points',
        value: 'CloudFront · ALB · API Gateway · AppSync · Cognito user pool · App Runner',
      },
      { label: 'Rule actions', value: 'Allow · Block · Count · CAPTCHA · Challenge' },
      {
        label: 'Rate-based rules',
        value: 'Requests per 5-minute window per IP (or per custom key)',
      },
      {
        label: 'Managed rule groups',
        value: 'AWS-managed sets including the Core rule set and known-bad-inputs',
      },
      { label: 'Web ACL capacity', value: 'Measured in WCUs, with a per-ACL ceiling' },
    ],
    examTraps: [
      'WAF cannot attach to a Network Load Balancer. If the design uses an NLB and needs Layer 7 inspection, it needs an ALB (or CloudFront) in the path.',
      'Rate-based rules are the answer to "one IP is sending too many requests". API Gateway throttling is the answer to "protect the backend from overall volume".',
      'Count mode is how you test a rule safely before enforcing it — the answer to "avoid blocking legitimate users while tuning".',
      'WAF on CloudFront filters at the edge, before traffic reaches the Region. That is both faster and cheaper than filtering at the ALB.',
      'Firewall Manager is how you push one web ACL across many accounts.',
    ],
    confusedWith: [
      {
        slug: 'shield',
        difference:
          'Shield handles volumetric DDoS at Layers 3 and 4; WAF handles application-layer request content at Layer 7. Shield Advanced includes WAF.',
      },
      {
        slug: 'network-firewall',
        difference:
          'Network Firewall inspects all VPC traffic at the network layer; WAF inspects HTTP requests to a specific endpoint.',
      },
      {
        slug: 'security-group',
        difference: 'Security groups match IP, port and protocol only, and cannot deny.',
      },
    ],
    pricing: 'Per web ACL-month, per rule-month, and per million requests inspected.',
    docsUrl: `${D}/waf/latest/developerguide/what-is-aws-waf.html`,
    related: ['shield', 'cloudfront', 'elb', 'api-gateway', 'firewall-manager', 'network-firewall'],
  },
  {
    slug: 'shield',
    name: 'AWS Shield',
    category: 'security',
    families: ['saa'],
    tier: 2,
    oneLiner:
      'DDoS protection — Standard is free and automatic, Advanced adds response teams and cost protection.',
    whatItIs:
      'Shield Standard protects every AWS customer against common Layer 3 and 4 volumetric attacks at no charge, with nothing to configure. Shield Advanced is a paid subscription adding higher-layer detection, 24/7 access to the Shield Response Team, attack diagnostics, WAF at no extra cost, and — the commercially important part — reimbursement of scaling charges caused by an attack.',
    whyItExists:
      "A volumetric attack used to be absorbed by whoever's pipe it hit, and the cloud added a new twist: auto-scaling means an attack succeeds by working, taking your availability out through the bill instead of the servers. Shield Standard exists so basic Layer 3/4 defence is on for everyone by default; Advanced exists for the response team and for reimbursing the scaling charges an attack caused.",
    whenToUse: [
      'Standard: already on, nothing to do',
      'Advanced: business-critical public endpoints where an attack is a material risk',
      'You want financial protection against scaling costs during an attack',
      'You want expert help during an incident',
    ],
    whenNotToUse: [
      'Internal-only workloads',
      "Application-layer request filtering, which is WAF's job",
    ],
    keyNumbers: [
      { label: 'Standard', value: 'Free, automatic, Layer 3/4' },
      {
        label: 'Advanced',
        value: 'Monthly subscription with a 1-year commitment, plus data transfer',
        volatile: true,
      },
      {
        label: 'Advanced extras',
        value:
          'Shield Response Team · cost protection · WAF included · Layer 7 detection · global threat dashboard',
      },
      {
        label: 'Protected resource types',
        value: 'CloudFront · Route 53 · Global Accelerator · ALB/NLB/CLB · Elastic IPs',
      },
    ],
    examTraps: [
      'Shield Standard is already protecting you. Answers that say "enable Shield Standard" are wrong — there is nothing to enable.',
      'Cost protection against DDoS-driven scaling charges is exclusive to Advanced, and is the tell in cost-flavoured DDoS questions.',
      'The general DDoS-resilience answer is architectural: CloudFront and Global Accelerator absorb attacks at the edge, and Route 53 and ELB scale. Shield Advanced is added on top for critical endpoints.',
    ],
    confusedWith: [
      {
        slug: 'waf',
        difference: 'Shield is volumetric network defence; WAF inspects HTTP request content.',
      },
    ],
    pricing:
      'Standard free. Advanced is a fixed monthly subscription with a one-year commitment plus data-transfer fees.',
    docsUrl: `${D}/waf/latest/developerguide/ddos-advanced-summary.html`,
    related: ['waf', 'cloudfront', 'global-accelerator', 'route53', 'firewall-manager'],
  },
  {
    slug: 'guardduty',
    name: 'Amazon GuardDuty',
    category: 'security',
    families: ['saa'],
    tier: 1,
    oneLiner: 'Continuous threat detection from logs — no agents, one click to enable.',
    whatItIs:
      'A managed detection service that analyses CloudTrail management and data events, VPC Flow Logs, DNS logs, and optionally EKS audit logs, S3 data events, RDS login activity, Lambda network activity and EBS volumes for malware. It applies machine learning and threat intelligence to produce findings — cryptomining, credential exfiltration, communication with known-bad hosts, unusual API calls from unusual places.',
    whyItExists:
      'The evidence of a compromise was already in CloudTrail, Flow Logs and DNS logs; nobody was reading them, because spotting an unusual API call from an unusual country in millions of events is not a job a person does. Building the detection yourself meant a log pipeline, threat feeds and rules to maintain. GuardDuty exists so detection is a switch rather than a project, and it reads the logs from the service side — which is why there is no agent to deploy.',
    whenToUse: [
      'Continuous, low-effort threat detection across accounts',
      'Detecting compromised instances or credentials',
      'Feeding findings into EventBridge for automated response',
      'Organisation-wide detection with a delegated administrator account',
    ],
    whenNotToUse: [
      'Finding software vulnerabilities and unpatched CVEs — that is Inspector',
      'Discovering sensitive data in S3 — that is Macie',
      'Checking resource configuration compliance — that is Config or Security Hub',
    ],
    keyNumbers: [
      { label: 'Agents', value: 'None — it reads logs AWS already has' },
      {
        label: 'Log sources',
        value: 'CloudTrail · VPC Flow Logs · DNS logs · plus optional protection plans',
      },
      { label: 'Finding severity', value: 'Low, Medium, High, with numeric scores' },
      { label: 'Automation', value: 'Findings emit EventBridge events for automated remediation' },
    ],
    examTraps: [
      'GuardDuty needs no agent and no log configuration — it reads the sources directly. Answers requiring you to first enable and ship logs somewhere are wrong.',
      'The service trio gets tested together: GuardDuty = threats · Inspector = vulnerabilities · Macie = sensitive data.',
      'Turning GuardDuty off does not delete existing findings; suspending versus disabling differ.',
      'GuardDuty plus EventBridge plus Lambda is the canonical "automatically respond to a security finding" pattern.',
    ],
    confusedWith: [
      {
        slug: 'inspector',
        difference:
          'Inspector scans workloads for known vulnerabilities and unintended network exposure. GuardDuty detects active malicious behaviour.',
      },
      {
        slug: 'macie',
        difference: 'Macie classifies sensitive data in S3. GuardDuty watches for attacks.',
      },
      {
        slug: 'detective',
        difference: 'Detective investigates a finding after the fact; GuardDuty generates it.',
      },
    ],
    pricing: 'Per GB of logs analysed and per million events, by source, with a 30-day trial.',
    docsUrl: `${D}/guardduty/latest/ug/what-is-guardduty.html`,
    related: ['inspector', 'macie', 'security-hub', 'detective', 'cloudtrail', 'eventbridge'],
  },
  {
    slug: 'inspector',
    name: 'Amazon Inspector',
    category: 'security',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Automated vulnerability scanning for EC2, container images and Lambda.',
    whatItIs:
      'Continuously scans EC2 instances (via the SSM agent), ECR container images and Lambda functions for known CVEs and unintended network exposure, and scores findings for prioritisation. Scanning is triggered by change, not by a schedule you maintain.',
    whyItExists:
      'Vulnerability scanning was a scheduled event: a scanner ran on Sunday, produced a spreadsheet, and by Wednesday the fleet had changed and the spreadsheet was fiction. Anything launched and terminated between scans was never looked at. Inspector exists to make the trigger the change itself, so a new instance or a freshly pushed image is assessed when it appears rather than when the calendar says so.',
    whenToUse: [
      'Continuous CVE scanning of instances, images and functions',
      'Detecting unintended network paths to an instance',
      'Compliance requirements for regular vulnerability assessment',
    ],
    whenNotToUse: ['Detecting active attacks — GuardDuty', 'Configuration compliance — Config'],
    keyNumbers: [
      { label: 'Targets', value: 'EC2 · ECR images · Lambda functions' },
      { label: 'EC2 requirement', value: 'SSM agent, managed by Systems Manager' },
      { label: 'Trigger', value: 'Continuous and event-driven, not on a schedule' },
    ],
    examTraps: [
      'Inspector needs the SSM agent on EC2. "No agents" is GuardDuty, not Inspector.',
      'The tell is "vulnerabilities", "CVE", "unpatched software" or "scan our container images".',
    ],
    confusedWith: [
      {
        slug: 'guardduty',
        difference: 'Vulnerabilities that could be exploited versus attacks actually happening.',
      },
      {
        slug: 'config',
        difference:
          'Config checks whether configuration matches your rules; Inspector checks software for known flaws.',
      },
    ],
    pricing: 'Per instance-hour, per image scan and per Lambda function scanned.',
    docsUrl: `${D}/inspector/latest/user/what-is-inspector.html`,
    related: ['guardduty', 'security-hub', 'ecr', 'systems-manager'],
  },
  {
    slug: 'macie',
    name: 'Amazon Macie',
    category: 'security',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Finds and classifies sensitive data — PII, credentials, financial data — in S3.',
    whatItIs:
      'Uses machine learning and pattern matching to discover sensitive data in S3 buckets, and reports on bucket security posture — public access, unencrypted buckets, buckets shared outside the account. You can add custom data identifiers with your own regex for organisation-specific formats.',
    whyItExists:
      'Nobody could answer "do we have customer PII in S3", because the buckets were created by dozens of teams over years and the only way to check was to read the objects. So the honest answer at audit time was a guess, and the first real inventory arrived with a breach notification. Macie exists to make that a scan you can run and repeat, and to flag the buckets whose exposure makes the answer urgent.',
    whenToUse: [
      'Discovering where PII, PHI or payment data has ended up in S3',
      'GDPR, HIPAA and PCI data-inventory requirements',
      'Continuous monitoring of S3 buckets for newly-added sensitive data',
    ],
    whenNotToUse: ['Data outside S3 — Macie only scans S3', 'Threat detection — GuardDuty'],
    keyNumbers: [
      { label: 'Scope', value: 'S3 only' },
      { label: 'Detection', value: 'Managed data identifiers plus custom regex identifiers' },
      { label: 'Automation', value: 'Findings go to EventBridge and Security Hub' },
    ],
    examTraps: [
      'Macie is S3-only. A question about sensitive data in RDS or EBS is not answered by Macie.',
      'The tell is "PII", "personally identifiable", "sensitive data discovery" or "know what is in our buckets".',
    ],
    confusedWith: [
      {
        slug: 'guardduty',
        difference: 'Macie classifies data at rest; GuardDuty detects malicious activity.',
      },
    ],
    pricing: 'Per bucket evaluated per month plus per GB of objects inspected.',
    docsUrl: `${D}/macie/latest/user/what-is-macie.html`,
    related: ['guardduty', 's3', 'security-hub', 'kms'],
  },
  {
    slug: 'detective',
    name: 'Amazon Detective',
    category: 'security',
    families: ['saa'],
    tier: 3,
    oneLiner: "Builds a behaviour graph so you can investigate a finding's root cause.",
    whatItIs:
      'Automatically ingests CloudTrail, VPC Flow Logs and GuardDuty findings into a linked graph model, letting you pivot across entities and time to answer "how did this happen, and what else was touched?".',
    whenToUse: [
      'Investigating a GuardDuty finding in depth',
      'Security incident root-cause analysis',
    ],
    whenNotToUse: [
      'Generating findings in the first place — GuardDuty',
      'Vulnerability scanning — Inspector',
    ],
    keyNumbers: [
      {
        label: 'Sources',
        value: 'CloudTrail · VPC Flow Logs · GuardDuty findings · EKS audit logs',
      },
    ],
    examTraps: [
      'GuardDuty *detects*; Detective *investigates*. The verb in the question tells you which.',
    ],
    confusedWith: [{ slug: 'guardduty', difference: 'Detection versus investigation.' }],
    pricing: 'Per GB of data ingested.',
    docsUrl: `${D}/detective/latest/userguide/what-is-detective.html`,
    related: ['guardduty', 'cloudtrail', 'security-hub'],
  },
  {
    slug: 'security-hub',
    name: 'AWS Security Hub',
    category: 'security',
    families: ['saa'],
    tier: 2,
    oneLiner:
      'One dashboard aggregating findings from every security service, with compliance scores.',
    whatItIs:
      'Aggregates and normalises findings from GuardDuty, Inspector, Macie, Firewall Manager, IAM Access Analyzer and partner tools into a single format, then runs automated compliance checks against standards like CIS AWS Foundations, PCI DSS and AWS Foundational Security Best Practices.',
    whyItExists:
      'Turning on GuardDuty, Inspector, Macie and Access Analyzer gave you four consoles, four finding formats and four sets of severities — so nobody could say what the top ten problems in the account actually were, and compliance evidence was assembled by hand before each audit. Security Hub exists to normalise all of it into one stream and score it against published standards continuously.',
    whenToUse: [
      'A single pane of glass across accounts and security services',
      'Continuous compliance scoring against a recognised standard',
      'Centralised, normalised findings for a security team or SIEM',
    ],
    whenNotToUse: ['You only use one security service and its own console is enough'],
    keyNumbers: [
      {
        label: 'Standards',
        value: 'CIS AWS Foundations · PCI DSS · AWS Foundational Security Best Practices · NIST',
      },
      { label: 'Finding format', value: 'AWS Security Finding Format (ASFF)' },
      { label: 'Multi-account', value: 'Delegated administrator via AWS Organizations' },
    ],
    examTraps: [
      'The tell is "centralised view", "aggregate findings across accounts" or "compliance standard score".',
      'Security Hub aggregates; it does not itself detect threats. Answers that use it to find a compromised instance are wrong — GuardDuty does that and Security Hub displays it.',
    ],
    confusedWith: [
      {
        slug: 'config',
        difference:
          'Config evaluates resource configuration against rules; Security Hub aggregates security findings and runs standards checks (using Config underneath).',
      },
      {
        slug: 'audit-manager',
        difference:
          'Audit Manager collects evidence for a formal audit report; Security Hub is an operational dashboard.',
      },
    ],
    pricing: 'Per compliance check and per finding ingested.',
    docsUrl: `${D}/securityhub/latest/userguide/what-is-securityhub.html`,
    related: ['guardduty', 'inspector', 'macie', 'config', 'organizations', 'audit-manager'],
  },
  {
    slug: 'network-firewall',
    name: 'AWS Network Firewall',
    category: 'security',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Managed stateful network firewall and IPS for an entire VPC.',
    whatItIs:
      'A managed firewall deployed into dedicated subnets, with traffic routed through it. It does stateful inspection, Suricata-compatible IPS rules, domain-name filtering and protocol detection — the things security groups and NACLs cannot do.',
    whyItExists:
      'Security groups and NACLs decide whether a flow may exist; they cannot look inside it, so "block traffic to this domain" or "stop this known exploit payload" had no answer without routing everything through a firewall appliance you built and scaled on EC2 yourself. Network Firewall exists to be that inspection point as a managed, AZ-redundant service that takes Suricata rules — the layer above what a security group can express.',
    whenToUse: [
      'Egress filtering by domain name — "instances may only reach these hostnames"',
      'Intrusion detection and prevention inside the VPC',
      'Centralised inspection for a Transit Gateway hub',
      'Deep packet inspection requirements',
    ],
    whenNotToUse: [
      'Ordinary instance-to-instance access control — security groups',
      'HTTP request content for a public application — WAF',
      'Simple IP blocking — a NACL is free',
    ],
    keyNumbers: [
      {
        label: 'Rule types',
        value: 'Stateless · stateful (5-tuple, domain list, Suricata-compatible)',
      },
      {
        label: 'Deployment',
        value:
          'Firewall endpoint per AZ in its own subnet, with route tables sending traffic through it',
      },
      { label: 'Central management', value: 'Via Firewall Manager across accounts' },
    ],
    examTraps: [
      'Domain-name-based *egress* filtering is the signature Network Firewall answer — no other AWS network control does it.',
      'It needs its own subnets and explicit routing. Simply enabling it does not put traffic through it.',
    ],
    confusedWith: [
      {
        slug: 'waf',
        difference:
          'WAF protects a specific HTTP endpoint; Network Firewall inspects VPC-wide network traffic.',
      },
      {
        slug: 'nacl',
        difference:
          'NACLs are free, stateless and match only IP/port/protocol. Network Firewall is stateful and content-aware.',
      },
    ],
    pricing: 'Per firewall endpoint-hour per AZ plus per GB processed.',
    docsUrl: `${D}/network-firewall/latest/developerguide/what-is-aws-network-firewall.html`,
    related: ['waf', 'nacl', 'transit-gateway', 'firewall-manager', 'vpc'],
  },
  {
    slug: 'firewall-manager',
    name: 'AWS Firewall Manager',
    category: 'security',
    families: ['saa'],
    tier: 3,
    oneLiner:
      'Central policy manager for WAF, Shield Advanced, Network Firewall and security groups.',
    whatItIs:
      'Applies firewall policies across every account and resource in an organisation, and automatically covers resources created later. Requires AWS Organizations.',
    whenToUse: [
      'Enforcing one WAF web ACL across all accounts',
      'Guaranteeing new resources inherit required protections automatically',
      'Auditing and remediating non-compliant security groups organisation-wide',
    ],
    whenNotToUse: ['A single account, where you can configure WAF directly'],
    keyNumbers: [{ label: 'Prerequisite', value: 'AWS Organizations with all features enabled' }],
    examTraps: [
      'The tell is "across all accounts" plus "automatically applied to new resources". Configuring WAF per account is the answer Firewall Manager replaces.',
    ],
    confusedWith: [
      {
        slug: 'waf',
        difference:
          'WAF is the firewall; Firewall Manager is how you deploy the same rules everywhere.',
      },
    ],
    pricing: 'Per protected policy per Region per month, plus the underlying service charges.',
    docsUrl: `${D}/waf/latest/developerguide/fms-chapter.html`,
    related: ['waf', 'shield', 'network-firewall', 'organizations', 'security-group'],
  },
  {
    slug: 'audit-manager',
    name: 'AWS Audit Manager',
    category: 'security',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Continuously collects evidence and assembles audit-ready reports.',
    whatItIs:
      'Maps your AWS usage to controls in frameworks such as SOC 2, PCI DSS, HIPAA and GDPR, then continuously collects supporting evidence and produces assessment reports for auditors.',
    whenToUse: [
      'Preparing for a formal external audit',
      'Continuous evidence collection against a compliance framework',
    ],
    whenNotToUse: ['Operational security monitoring — Security Hub'],
    keyNumbers: [
      {
        label: 'Frameworks',
        value: 'Prebuilt SOC 2, PCI DSS, HIPAA, GDPR, plus custom frameworks',
      },
    ],
    examTraps: [
      'The tell is "audit evidence" or "audit report". Security Hub gives you a posture dashboard, not an auditor deliverable.',
    ],
    confusedWith: [
      {
        slug: 'artifact',
        difference:
          "Artifact gives you *AWS's* compliance reports; Audit Manager builds evidence about *your* workloads.",
      },
      { slug: 'security-hub', difference: 'Operational dashboard versus formal audit package.' },
    ],
    pricing: 'Per assessment resource evaluated.',
    docsUrl: `${D}/audit-manager/latest/userguide/what-is.html`,
    related: ['artifact', 'security-hub', 'config'],
  },
  {
    slug: 'artifact',
    name: 'AWS Artifact',
    category: 'security',
    families: ['saa'],
    tier: 3,
    oneLiner: "Self-service portal for AWS's own compliance reports and agreements.",
    whatItIs:
      'A download portal for AWS audit artefacts — SOC reports, ISO certifications, PCI attestations — and a place to accept agreements such as the AWS BAA for HIPAA workloads.',
    whenToUse: [
      "An auditor asks for AWS's SOC 2 report",
      'Accepting a HIPAA Business Associate Addendum',
    ],
    whenNotToUse: [
      "Anything about your own workloads' compliance — Audit Manager, Config or Security Hub",
    ],
    keyNumbers: [{ label: 'Contents', value: 'AWS SOC, ISO, PCI reports and customer agreements' }],
    examTraps: ["Artifact is about AWS's side of the shared responsibility model, never yours."],
    confusedWith: [
      {
        slug: 'audit-manager',
        difference: "AWS's reports versus evidence about your own environment.",
      },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/artifact/latest/ug/what-is-aws-artifact.html`,
    related: ['audit-manager', 'security-hub'],
  },
]
