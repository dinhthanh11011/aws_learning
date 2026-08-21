import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const mgmtServices: Service[] = [
  {
    slug: 'cloudwatch',
    name: 'Amazon CloudWatch',
    abbr: 'CW',
    category: 'mgmt',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Metrics, logs, alarms and dashboards for everything running in AWS.',
    whatItIs:
      'Four products under one name. *Metrics* are numeric time series, published by AWS services automatically and by you as custom metrics. *Logs* are log streams grouped into log groups, searchable with Logs Insights. *Alarms* watch a metric and act — notify via SNS, scale an ASG, reboot an instance. *Dashboards, Synthetics canaries and RUM* cover the presentation and end-user-experience side.',
    whenToUse: [
      'Alarming on any metric, and driving Auto Scaling from it',
      'Centralised application logs from EC2, Lambda, ECS and on-premises servers',
      'Logs Insights queries during an incident',
      'Custom business metrics, ideally via the embedded metric format',
      'Synthetic canaries checking an endpoint from outside',
    ],
    whenNotToUse: [
      'Recording *who called which API* — that is CloudTrail',
      'Rich interactive log search over long retention — OpenSearch',
      'Distributed request tracing across services — X-Ray',
      'Configuration compliance history — Config',
    ],
    keyNumbers: [
      { label: 'Standard metric resolution', value: '1 minute' },
      {
        label: 'High-resolution custom metrics',
        value: '1 second',
        note: 'Alarms on them can evaluate at 10 or 30 seconds.',
      },
      { label: 'Metric retention', value: '15 months, rolled up progressively' },
      {
        label: 'Log retention',
        value: 'Configurable from 1 day to never expire',
        note: 'The default of never-expire is a common cost problem.',
      },
      { label: 'Alarm states', value: 'OK · ALARM · INSUFFICIENT_DATA' },
      { label: 'Composite alarms', value: 'Combine alarms with AND/OR to cut noise' },
      {
        label: 'Not collected by default',
        value: 'Memory usage and disk space — those need the CloudWatch agent',
      },
      {
        label: 'EMF',
        value:
          'Embedded metric format — write structured logs, get metrics extracted automatically',
      },
    ],
    examTraps: [
      'Memory and disk utilisation are guest-OS metrics and are NOT collected by default. You must install the CloudWatch agent. This is asked directly and often.',
      'CloudWatch is metrics and logs; CloudTrail is API audit history. "Who deleted the bucket?" is CloudTrail. "Is CPU too high?" is CloudWatch.',
      'A metric filter on a log group turns a log pattern into a metric you can alarm on — the answer to "alert me when this error appears in the logs".',
      'Setting a log-group retention period is the standard "our CloudWatch Logs bill keeps growing" answer.',
      'Alarms can act on three states, and INSUFFICIENT_DATA handling ("treat missing data as") shows up in flapping-alarm questions.',
      'EMF is the DVA-flavoured answer to "emit custom metrics from a Lambda function without extra API calls".',
      'CloudWatch Contributor Insights finds top-N contributors, useful for "which key is hot".',
    ],
    confusedWith: [
      {
        slug: 'cloudtrail',
        difference:
          'CloudWatch = performance and application telemetry. CloudTrail = an audit log of API calls.',
      },
      {
        slug: 'xray',
        difference:
          'X-Ray traces one request across many services; CloudWatch aggregates metrics and logs per resource.',
      },
      {
        slug: 'config',
        difference:
          'Config records configuration state and compliance over time; CloudWatch records performance.',
      },
    ],
    pricing:
      'Per custom metric, per alarm, per GB of logs ingested and stored, per dashboard, plus queries and canaries.',
    docsUrl: `${D}/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html`,
    related: ['cloudtrail', 'xray', 'sns', 'ec2-auto-scaling', 'lambda', 'opensearch', 'config'],
  },
  {
    slug: 'cloudtrail',
    name: 'AWS CloudTrail',
    category: 'mgmt',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Audit log of every API call — who did what, when, from where.',
    whatItIs:
      'Records API activity across your account. Management events (control-plane operations like RunInstances or DeleteBucket) are logged for the last 90 days free in Event history. Data events (object-level S3 reads and writes, Lambda invocations) are high-volume and off by default. A *trail* delivers events durably to S3 — and optionally to CloudWatch Logs — for long retention and analysis.',
    whenToUse: [
      'Security investigations and forensics: who deleted it, who changed the policy',
      'Compliance requirements for an immutable audit record',
      'Organisation trails covering every account from one place',
      'Alerting on sensitive API calls, via CloudWatch Logs metric filters or EventBridge',
    ],
    whenNotToUse: [
      'Performance monitoring — CloudWatch',
      'Configuration drift and compliance rules — Config',
      'Tracing a request through your application — X-Ray',
    ],
    keyNumbers: [
      {
        label: 'Event history',
        value: 'Last 90 days of management events, free, no trail required',
      },
      { label: 'Management events', value: 'Control-plane operations, logged by default' },
      {
        label: 'Data events',
        value: 'S3 object-level and Lambda invocation events — off by default, and high volume',
      },
      { label: 'Insights events', value: 'Detect unusual API call-rate patterns' },
      {
        label: 'Log file validation',
        value: 'SHA-256 digest files prove logs were not tampered with',
      },
      { label: 'Organisation trail', value: 'One trail covering every member account' },
      { label: 'Delivery latency', value: 'Typically within about 15 minutes' },
    ],
    examTraps: [
      'S3 object-level activity ("who downloaded this file?") requires *data events*, which are not on by default. This is the most common CloudTrail trap.',
      'Event history is only 90 days. Long retention requires a trail delivering to S3.',
      'Log file validation is the answer to "prove the audit log has not been altered". Combine with S3 Object Lock and a dedicated log-archive account for the full compliance answer.',
      'CloudTrail is not real-time. For immediate reaction to an API call, send it to EventBridge or to CloudWatch Logs with a metric filter.',
      'A trail can be a single-Region or all-Regions trail. Global service events (IAM, CloudFront, Route 53) are recorded in us-east-1.',
    ],
    confusedWith: [
      { slug: 'cloudwatch', difference: 'API audit trail versus performance telemetry.' },
      {
        slug: 'config',
        difference:
          'CloudTrail records the *call* that changed something; Config records the resulting *configuration state* and whether it is compliant.',
      },
    ],
    pricing:
      'First trail of management events free. Additional trails, data events and Insights are charged per event, plus S3 storage.',
    docsUrl: `${D}/awscloudtrail/latest/userguide/cloudtrail-user-guide.html`,
    related: ['cloudwatch', 'config', 's3', 'guardduty', 'organizations', 'athena'],
  },
  {
    slug: 'config',
    name: 'AWS Config',
    category: 'mgmt',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Records resource configuration over time and evaluates it against rules.',
    whatItIs:
      'Continuously records the configuration of your resources, keeps a timeline of every change, and evaluates each configuration against rules — managed rules from AWS or custom rules backed by Lambda or Guard. Non-compliant resources can be remediated automatically via Systems Manager Automation documents.',
    whenToUse: [
      'Compliance requirements: "no unencrypted volumes", "no public buckets", "all resources tagged"',
      'Answering "what did this security group look like last Tuesday?"',
      'Automatic remediation of non-compliant resources',
      'Organisation-wide compliance via aggregators',
    ],
    whenNotToUse: [
      'Auditing API calls — CloudTrail',
      'Performance metrics — CloudWatch',
      'Scanning for software vulnerabilities — Inspector',
    ],
    keyNumbers: [
      { label: 'Rules', value: 'AWS managed rules · custom Lambda rules · Guard rules' },
      { label: 'Conformance packs', value: 'Bundles of rules mapped to a compliance framework' },
      { label: 'Remediation', value: 'Automatic, via Systems Manager Automation documents' },
      { label: 'Aggregators', value: 'Multi-account, multi-Region compliance views' },
      { label: 'Configuration timeline', value: 'Full history of changes per resource' },
    ],
    examTraps: [
      'Config answers "is this resource configured correctly, and what changed?" CloudTrail answers "who made the call?" Questions frequently offer both.',
      'Config plus a remediation action is the standard "automatically fix non-compliant resources" answer.',
      'Preventing a change before it happens is an SCP or a CloudFormation hook. Config is *detective* — it reports after the fact.',
    ],
    confusedWith: [
      {
        slug: 'cloudtrail',
        difference: 'Configuration state and compliance versus API call history.',
      },
      {
        slug: 'security-hub',
        difference:
          'Security Hub aggregates findings across security services (using Config rules underneath) and scores you against standards.',
      },
    ],
    pricing: 'Per configuration item recorded, per rule evaluation, plus conformance-pack charges.',
    docsUrl: `${D}/config/latest/developerguide/WhatIsConfig.html`,
    related: ['cloudtrail', 'security-hub', 'systems-manager', 'organizations', 'control-tower'],
  },
  {
    slug: 'cloudformation',
    name: 'AWS CloudFormation',
    abbr: 'CFN',
    category: 'mgmt',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Declarative infrastructure as code — templates in, stacks out.',
    whatItIs:
      'You describe resources in a JSON or YAML template; CloudFormation creates, updates and deletes them as a *stack*, in dependency order, rolling back on failure. Change sets preview what an update will do. StackSets deploy the same template across many accounts and Regions. Drift detection tells you when someone changed something by hand.',
    whenToUse: [
      'Repeatable environment provisioning — dev, staging, prod from one template',
      'Version-controlled, reviewable infrastructure changes',
      'Multi-account and multi-Region deployment via StackSets',
      'Disaster recovery: rebuild the environment from a template',
    ],
    whenNotToUse: [
      'Writing infrastructure in a real programming language — that is CDK (which compiles to CloudFormation)',
      'Serverless-specific shorthand — SAM (also a CloudFormation transform)',
      'Application code deployment — CodeDeploy',
    ],
    keyNumbers: [
      {
        label: 'Template sections',
        value:
          'Parameters · Mappings · Conditions · Resources (the only required one) · Outputs · Transform · Metadata',
      },
      {
        label: 'Intrinsic functions',
        value: '!Ref · !GetAtt · !Sub · !ImportValue · !FindInMap · !If · !Join',
      },
      {
        label: 'Cross-stack references',
        value: 'Export an Output, then !ImportValue it',
        note: 'An exported value cannot be deleted while another stack imports it.',
      },
      {
        label: 'DeletionPolicy',
        value: 'Retain · Snapshot · Delete — the way to keep a database when the stack goes',
      },
      { label: 'Change sets', value: 'Preview the effect of an update before applying it' },
      { label: 'Nested stacks', value: 'Reuse common components as child stacks' },
      {
        label: 'Helper scripts',
        value: 'cfn-init, cfn-signal, cfn-hup with CreationPolicy and WaitCondition',
      },
    ],
    examTraps: [
      'DeletionPolicy: Retain (or Snapshot) on a database is the answer to "deleting the stack must not destroy the data".',
      'Failed create rolls back and deletes everything by default. Disabling rollback is how you keep the resources to debug them.',
      'Stack updates can Replace a resource, which changes its physical id — the reason an "update" sometimes silently recreates your database. Change sets reveal this.',
      'StackSets is the answer to "deploy this to every account and Region".',
      'Drift detection is the answer to "someone modified our resources outside the template".',
      'CreationPolicy plus cfn-signal is how a stack waits for an application to be genuinely ready rather than merely launched.',
    ],
    confusedWith: [
      {
        slug: 'cdk',
        difference:
          'CDK is TypeScript/Python/Java that *synthesises* CloudFormation templates. Same engine, better authoring experience.',
      },
      {
        slug: 'sam',
        difference:
          'SAM is a CloudFormation transform with concise serverless resource types plus a local testing CLI.',
      },
      {
        slug: 'elastic-beanstalk',
        difference:
          'Beanstalk is opinionated application PaaS; CloudFormation provisions arbitrary infrastructure.',
      },
    ],
    pricing:
      'Free for AWS resource types; you pay for the resources created. Third-party registry resources are charged per handler operation.',
    docsUrl: `${D}/AWSCloudFormation/latest/UserGuide/Welcome.html`,
    related: ['cdk', 'sam', 'service-catalog', 'organizations', 'codepipeline', 'config'],
  },
  {
    slug: 'cdk',
    name: 'AWS Cloud Development Kit',
    abbr: 'CDK',
    category: 'mgmt',
    families: ['dva'],
    tier: 2,
    oneLiner:
      'Define infrastructure in TypeScript, Python, Java, C# or Go — it compiles to CloudFormation.',
    whatItIs:
      'A framework where infrastructure is real code: loops, conditionals, functions, unit tests, IDE completion. `cdk synth` produces a CloudFormation template and `cdk deploy` applies it. Constructs come in three levels — L1 mirrors CloudFormation exactly, L2 adds sensible defaults and helper methods, L3 packages whole patterns.',
    whenToUse: [
      'Developers who would rather write code than 2,000 lines of YAML',
      'Reusable infrastructure abstractions shared across teams as libraries',
      'Unit-testable infrastructure, with assertions on the synthesised template',
      'Complex conditional infrastructure that YAML expresses badly',
    ],
    whenNotToUse: [
      'Teams that want a declarative artefact with no build step — plain CloudFormation',
      'Simple serverless applications — SAM is lighter',
    ],
    keyNumbers: [
      { label: 'Languages', value: 'TypeScript · JavaScript · Python · Java · C# · Go' },
      { label: 'Construct levels', value: 'L1 (Cfn* raw) · L2 (curated defaults) · L3 (patterns)' },
      {
        label: 'Key commands',
        value: 'cdk init · cdk synth · cdk diff · cdk deploy · cdk destroy',
      },
      {
        label: 'Bootstrapping',
        value: '`cdk bootstrap` creates the staging bucket and roles the account needs',
      },
    ],
    examTraps: [
      'CDK is not a separate deployment engine — it produces CloudFormation. Anything CloudFormation cannot do, CDK cannot do either.',
      '`cdk diff` is the change-set preview equivalent.',
      'Forgetting `cdk bootstrap` in a new account or Region is the classic first-deploy failure.',
    ],
    confusedWith: [
      {
        slug: 'cloudformation',
        difference: 'Imperative authoring that generates the declarative template.',
      },
      {
        slug: 'sam',
        difference: 'SAM is YAML shorthand for serverless; CDK is general-purpose code.',
      },
    ],
    pricing: 'Free. You pay for the resources deployed.',
    docsUrl: `${D}/cdk/v2/guide/home.html`,
    related: ['cloudformation', 'sam', 'codepipeline', 'lambda'],
  },
  {
    slug: 'systems-manager',
    name: 'AWS Systems Manager',
    abbr: 'SSM',
    category: 'mgmt',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Operate your fleet: patching, shell access without SSH, and Parameter Store.',
    whatItIs:
      'A collection of capabilities over instances running the SSM agent. *Session Manager* gives browser or CLI shell access with no open ports, no bastion and no SSH keys, fully logged. *Patch Manager* patches on a schedule with baselines. *Run Command* executes commands fleet-wide. *Parameter Store* holds configuration and secrets, including encrypted SecureString values. *Automation* runs runbooks, including Config remediations.',
    whenToUse: [
      'Shell access to private instances with no inbound ports and a full audit trail',
      'Fleet-wide patching with compliance reporting',
      'Application configuration and licence keys in Parameter Store',
      'Automated remediation runbooks',
      'Inventory of installed software across the fleet',
    ],
    whenNotToUse: [
      'Automatic secret *rotation* — Secrets Manager',
      'Infrastructure provisioning — CloudFormation',
      'Application deployment pipelines — CodeDeploy',
    ],
    keyNumbers: [
      {
        label: 'Session Manager',
        value: 'No inbound ports, no bastion, no SSH keys; sessions logged to S3 or CloudWatch',
      },
      { label: 'Parameter Store standard', value: 'Free · 4 KB per parameter · 10,000 parameters' },
      {
        label: 'Parameter Store advanced',
        value: 'Charged · 8 KB · policies including expiry · higher throughput',
      },
      { label: 'SecureString', value: 'KMS-encrypted parameters' },
      {
        label: 'Requirements',
        value: 'SSM agent plus an instance profile with the SSM managed policy',
      },
      {
        label: 'Private-subnet access',
        value: 'Interface VPC endpoints for ssm, ssmmessages and ec2messages',
      },
    ],
    examTraps: [
      'Session Manager is the answer to almost every "access private instances without a bastion host or open SSH port" question. Client VPN and bastions are the distractors.',
      'For SSM to work in a private subnet with no NAT, you need three interface endpoints: ssm, ssmmessages and ec2messages. This exact detail is examined.',
      'Parameter Store SecureString versus Secrets Manager: rotation is the deciding factor. Parameter Store is free, Secrets Manager rotates.',
      'An instance not appearing as a managed node means either the agent is missing or the instance profile lacks AmazonSSMManagedInstanceCore.',
      'Patch Manager with a maintenance window is the "keep hundreds of instances patched with reporting" answer.',
    ],
    confusedWith: [
      {
        slug: 'secrets-manager',
        difference:
          'Parameter Store is free and static; Secrets Manager costs money and rotates automatically.',
      },
      {
        slug: 'client-vpn',
        difference: 'Session Manager needs no VPN, no client software and no open ports.',
      },
    ],
    pricing:
      'Most features free. Advanced parameters, Automation beyond the free tier and OpsCenter are charged.',
    docsUrl: `${D}/systems-manager/latest/userguide/what-is-systems-manager.html`,
    related: ['secrets-manager', 'ec2', 'config', 'cloudwatch', 'iam', 'privatelink'],
  },
  {
    slug: 'appconfig',
    name: 'AWS AppConfig',
    category: 'mgmt',
    families: ['dva'],
    tier: 2,
    oneLiner:
      'Deploy configuration changes and feature flags safely, with validation and rollback.',
    whatItIs:
      'A Systems Manager capability for *configuration deployment*. Configuration is versioned, validated (JSON Schema or a Lambda validator), and rolled out gradually to your application with CloudWatch alarms watching — if an alarm fires, AppConfig rolls the configuration back automatically. It also provides feature flags.',
    whenToUse: [
      'Feature flags to turn functionality on without redeploying code',
      'Environment-specific configuration deployed gradually and safely',
      'Configuration changes that must roll back automatically if error rates rise',
      'Operational toggles like rate limits and log verbosity',
    ],
    whenNotToUse: [
      'Storing a static value nothing deploys — Parameter Store',
      'Secrets — Secrets Manager',
      'Deploying code — CodeDeploy',
    ],
    keyNumbers: [
      {
        label: 'Deployment strategies',
        value: 'Linear · exponential · all-at-once, with bake time',
      },
      { label: 'Validators', value: 'JSON Schema or a Lambda function' },
      { label: 'Rollback', value: 'Automatic, on a CloudWatch alarm' },
      {
        label: 'Retrieval',
        value: 'The AppConfig Agent Lambda extension, or the GetLatestConfiguration API',
      },
    ],
    examTraps: [
      'The tell is "feature flag", "gradual configuration rollout" or "roll back configuration automatically". Parameter Store has none of that machinery.',
      'The Lambda extension caches configuration so you are not calling the API on every invocation.',
    ],
    confusedWith: [
      {
        slug: 'systems-manager',
        difference:
          'Parameter Store stores values; AppConfig deploys and validates them progressively.',
      },
    ],
    pricing: 'Per configuration request and per hour of active deployment.',
    docsUrl: `${D}/appconfig/latest/userguide/what-is-appconfig.html`,
    related: ['systems-manager', 'lambda', 'cloudwatch', 'codedeploy'],
  },
  {
    slug: 'compute-optimizer',
    name: 'AWS Compute Optimizer',
    category: 'mgmt',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Machine-learning right-sizing recommendations from your actual utilisation.',
    whatItIs:
      'Analyses CloudWatch metrics for EC2 instances, Auto Scaling groups, EBS volumes, Lambda functions and ECS-on-Fargate services, and recommends specific instance types or memory settings, with projected savings and performance risk.',
    whenToUse: [
      'Right-sizing an over-provisioned estate',
      'Choosing Lambda memory sizes from real data',
    ],
    whenNotToUse: [
      'Purchase-commitment decisions — Cost Explorer recommends RIs and Savings Plans',
    ],
    keyNumbers: [
      {
        label: 'Resources analysed',
        value: 'EC2 · ASGs · EBS volumes · Lambda functions · ECS on Fargate',
      },
      { label: 'Enhanced accuracy', value: 'Activate the CloudWatch agent for memory metrics' },
    ],
    examTraps: [
      '"Which instance type should we move to?" is Compute Optimizer. "Should we buy a Savings Plan?" is Cost Explorer. "General best-practice checks" is Trusted Advisor.',
    ],
    confusedWith: [
      {
        slug: 'trusted-advisor',
        difference:
          'Trusted Advisor gives broad best-practice checks; Compute Optimizer gives specific ML-driven sizing recommendations.',
      },
      {
        slug: 'cost-explorer',
        difference:
          'Cost Explorer analyses spend and recommends commitments; Compute Optimizer recommends resource sizes.',
      },
    ],
    pricing: 'Free (enhanced metrics via the CloudWatch agent are charged).',
    docsUrl: `${D}/compute-optimizer/latest/ug/what-is-compute-optimizer.html`,
    related: ['cost-explorer', 'trusted-advisor', 'ec2', 'lambda'],
  },
  {
    slug: 'trusted-advisor',
    name: 'AWS Trusted Advisor',
    category: 'mgmt',
    families: ['saa'],
    tier: 2,
    oneLiner:
      'Automated best-practice checks across cost, performance, security, resilience and quotas.',
    whatItIs:
      'A checklist service. It inspects your account and flags issues across five pillars — cost optimisation, performance, security, fault tolerance and service quotas — such as idle load balancers, unassociated Elastic IPs, open security groups, missing MFA on root, and quotas you are approaching.',
    whenToUse: [
      'A quick, broad review of an unfamiliar account',
      'Watching service quotas before you hit them',
      'Finding obvious waste and obvious security gaps',
    ],
    whenNotToUse: [
      'Detailed right-sizing — Compute Optimizer',
      'Compliance frameworks — Security Hub or Audit Manager',
    ],
    keyNumbers: [
      {
        label: 'Pillars',
        value: 'Cost · Performance · Security · Fault tolerance · Service quotas',
      },
      {
        label: 'Free checks',
        value: 'A limited set, including core security checks and service quotas',
      },
      { label: 'Full checks', value: 'Require Business, Enterprise On-Ramp or Enterprise Support' },
    ],
    examTraps: [
      'The full check set requires at least Business Support. Questions sometimes hinge on the support plan.',
      'Trusted Advisor is broad and shallow; Compute Optimizer is narrow and deep.',
    ],
    confusedWith: [
      {
        slug: 'compute-optimizer',
        difference: 'Breadth of best-practice checks versus depth of sizing recommendations.',
      },
      {
        slug: 'well-architected-tool',
        difference:
          'The Well-Architected Tool is a guided self-assessment questionnaire; Trusted Advisor inspects the account automatically.',
      },
    ],
    pricing: 'Core checks free; the full set requires a paid support plan.',
    docsUrl: `${D}/awssupport/latest/user/trusted-advisor.html`,
    related: ['compute-optimizer', 'cost-explorer', 'well-architected-tool', 'security-hub'],
  },
  {
    slug: 'well-architected-tool',
    name: 'AWS Well-Architected Tool',
    category: 'mgmt',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Guided review of a workload against the six Well-Architected pillars.',
    whatItIs:
      'A questionnaire-driven self-assessment. You answer questions about a workload and receive identified risks and improvement plans, mapped to the pillars: operational excellence, security, reliability, performance efficiency, cost optimisation and sustainability.',
    whenToUse: [
      'Formally reviewing a workload design',
      'Documenting architectural risk for stakeholders',
    ],
    whenNotToUse: ['Automated account inspection — Trusted Advisor'],
    keyNumbers: [
      {
        label: 'Six pillars',
        value:
          'Operational Excellence · Security · Reliability · Performance Efficiency · Cost Optimization · Sustainability',
      },
    ],
    examTraps: [
      'The six pillars themselves are worth memorising — SAA-C03 is explicitly framed around the Well-Architected Framework.',
      'It is a self-assessment, not an automated scanner.',
    ],
    confusedWith: [
      { slug: 'trusted-advisor', difference: 'Manual guided review versus automatic checks.' },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/wellarchitected/latest/userguide/intro.html`,
    related: ['trusted-advisor', 'security-hub'],
  },
  {
    slug: 'service-catalog',
    name: 'AWS Service Catalog',
    category: 'mgmt',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Curated, pre-approved infrastructure products users can self-service deploy.',
    whatItIs:
      'Administrators publish CloudFormation templates as *products* in portfolios, with constraints on regions, sizes and IAM. Users then launch them without needing permissions to the underlying services — they get a compliant environment, not a blank console.',
    whenToUse: [
      'Letting developers self-serve infrastructure within guardrails',
      'Standardising approved architectures across an organisation',
      'Granting launch capability without granting broad IAM permissions',
    ],
    whenNotToUse: ['A small team that can just run CloudFormation directly'],
    keyNumbers: [
      {
        label: 'Structure',
        value: 'Products (templates) grouped into portfolios, shared to accounts or OUs',
      },
      {
        label: 'Launch constraints',
        value: 'A role Service Catalog assumes, so users need no direct service permissions',
      },
    ],
    examTraps: [
      'The tell is "self-service" plus "only approved configurations" plus "without giving users broad permissions".',
      'Control Tower Account Factory is built on Service Catalog.',
    ],
    confusedWith: [
      {
        slug: 'cloudformation',
        difference:
          'Service Catalog governs and publishes CloudFormation templates for consumption.',
      },
      {
        slug: 'serverless-application-repository',
        difference:
          'SAR is a serverless-app marketplace; Service Catalog is enterprise governance of any product.',
      },
    ],
    pricing: 'Per API call, with a free tier.',
    docsUrl: `${D}/servicecatalog/latest/adminguide/introduction.html`,
    related: ['cloudformation', 'control-tower', 'organizations'],
  },
  {
    slug: 'health-dashboard',
    name: 'AWS Health Dashboard',
    category: 'mgmt',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Personalised alerts about AWS events affecting your specific resources.',
    whatItIs:
      'Beyond the public service-status page, the Health Dashboard reports events that affect *your* account — scheduled instance retirements, certificate rotations, degraded services in your Regions — and the Health API emits them to EventBridge for automation.',
    whenToUse: [
      'Reacting to scheduled maintenance and instance retirements',
      'Automating responses to AWS-side events',
    ],
    whenNotToUse: ['Monitoring your own application — CloudWatch'],
    keyNumbers: [
      {
        label: 'Health API',
        value: 'Requires Business Support or above; integrates with EventBridge and Organizations',
      },
    ],
    examTraps: [
      'The tell is "AWS notified us of a scheduled retirement" or "events affecting our resources", not application metrics.',
    ],
    confusedWith: [
      {
        slug: 'cloudwatch',
        difference: 'AWS-side platform events versus your own workload telemetry.',
      },
    ],
    pricing: 'Dashboard free; the Health API requires a paid support plan.',
    docsUrl: `${D}/health/latest/ug/what-is-aws-health.html`,
    related: ['cloudwatch', 'eventbridge', 'organizations'],
  },
  {
    slug: 'license-manager',
    name: 'AWS License Manager',
    category: 'mgmt',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Track and enforce software licence usage, including BYOL on dedicated hosts.',
    whatItIs:
      'Defines licensing rules — per core, per socket, per vCPU, per instance — and tracks or hard-enforces them as instances launch, including host-affinity requirements for bring-your-own-licence Windows and Oracle workloads.',
    whenToUse: [
      'BYOL compliance for Oracle, SQL Server or Windows Server',
      'Preventing launches that would breach a licence agreement',
    ],
    whenNotToUse: ['AWS-provided licence-included instances, where AWS handles it'],
    keyNumbers: [
      { label: 'Enforcement', value: 'Soft (track and alert) or hard (block the launch)' },
    ],
    examTraps: [
      'The tell is "BYOL", "licence compliance" or "dedicated hosts for licensing reasons".',
    ],
    confusedWith: [
      {
        slug: 'config',
        difference:
          'Config checks configuration compliance; License Manager tracks licence entitlements.',
      },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/license-manager/latest/userguide/license-manager.html`,
    related: ['ec2', 'config', 'systems-manager'],
  },
  {
    slug: 'managed-grafana',
    name: 'Amazon Managed Grafana',
    category: 'mgmt',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Managed Grafana for operational dashboards across many data sources.',
    whatItIs:
      'Fully managed Grafana workspaces that query CloudWatch, Managed Prometheus, OpenSearch, Timestream, X-Ray and third-party sources, with IAM Identity Center authentication.',
    whenToUse: [
      'Unified operational dashboards over metrics from several systems',
      'Teams already standardised on Grafana',
    ],
    whenNotToUse: [
      'Business reporting — QuickSight',
      'Basic AWS metrics — CloudWatch dashboards are cheaper',
    ],
    keyNumbers: [
      {
        label: 'Sources',
        value: 'CloudWatch · Managed Prometheus · OpenSearch · X-Ray · Timestream · third parties',
      },
    ],
    examTraps: [
      'Grafana = operational and time-series visualisation. QuickSight = business intelligence.',
    ],
    confusedWith: [
      { slug: 'quick-suite', difference: 'Operational metrics versus business reporting.' },
    ],
    pricing: 'Per active user per month by role.',
    docsUrl: `${D}/grafana/latest/userguide/what-is-Amazon-Managed-Service-Grafana.html`,
    related: ['managed-prometheus', 'cloudwatch', 'quick-suite'],
  },
  {
    slug: 'managed-prometheus',
    name: 'Amazon Managed Service for Prometheus',
    category: 'mgmt',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Managed Prometheus-compatible metric store for container workloads.',
    whatItIs:
      'A scalable, managed store for Prometheus metrics with PromQL querying and alerting, typically fed from EKS or ECS workloads and visualised in Managed Grafana.',
    whenToUse: [
      'Kubernetes monitoring with existing Prometheus exporters and PromQL',
      'High-cardinality container metrics at scale',
    ],
    whenNotToUse: ['Standard AWS service metrics — CloudWatch already has them'],
    keyNumbers: [{ label: 'Query language', value: 'PromQL' }],
    examTraps: ['The tell is "Prometheus" or "existing PromQL dashboards", usually alongside EKS.'],
    confusedWith: [
      {
        slug: 'cloudwatch',
        difference: 'Prometheus ecosystem compatibility versus AWS-native metrics.',
      },
    ],
    pricing: 'Per metric sample ingested, per GB stored and per query sample processed.',
    docsUrl: `${D}/prometheus/latest/userguide/what-is-Amazon-Managed-Service-Prometheus.html`,
    related: ['managed-grafana', 'eks', 'cloudwatch'],
  },
  {
    slug: 'cli',
    name: 'AWS CLI',
    category: 'mgmt',
    families: ['saa', 'dva'],
    tier: 2,
    oneLiner: 'Command-line access to every AWS API, with profiles and named credentials.',
    whatItIs:
      'A unified command-line tool over the AWS APIs. Credentials resolve in a fixed order — command-line options, environment variables, the credentials file, then the instance or container role — and that order is examinable.',
    whenToUse: [
      'Scripting and automation',
      'Operations that have no console equivalent (MFA Delete, some S3 batch operations)',
      'CI/CD pipeline steps',
    ],
    whenNotToUse: [
      'Repeatable infrastructure — CloudFormation or CDK are declarative and reviewable',
    ],
    keyNumbers: [
      {
        label: 'Credential precedence',
        value:
          'CLI options → environment variables → credentials file → container role → instance profile',
      },
      {
        label: 'Profiles',
        value: '`--profile`, with `role_arn` plus `source_profile` for role assumption',
      },
      { label: 'Pagination', value: '`--query` (JMESPath), `--max-items`, `--starting-token`' },
      {
        label: 'S3 commands',
        value: 'High-level `aws s3` (cp, sync, mv) versus low-level `aws s3api`',
      },
    ],
    examTraps: [
      'The credential resolution order explains "it works on my laptop but not on the instance" scenarios.',
      'Some operations are CLI/API-only. MFA Delete on an S3 bucket is the classic example.',
      '`aws s3 sync` is the answer to "copy only what changed".',
    ],
    confusedWith: [
      {
        slug: 'sdk',
        difference: 'The CLI is for humans and shell scripts; SDKs are for application code.',
      },
      {
        slug: 'cloudshell',
        difference:
          'CloudShell is a browser shell with the CLI preinstalled and credentials already present.',
      },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/cli/latest/userguide/cli-chap-welcome.html`,
    related: ['sdk', 'cloudshell', 'iam', 'systems-manager'],
  },
  {
    slug: 'console',
    name: 'AWS Management Console',
    category: 'mgmt',
    families: ['saa'],
    tier: 3,
    oneLiner: 'The browser interface — and the thing you should stop using for repeatable work.',
    whatItIs:
      'The web UI for AWS. Worth knowing on the exam mainly for what it *cannot* do (MFA Delete, certain batch operations) and for the principle that console-driven changes create drift, which is why Config and CloudFormation drift detection exist.',
    whenToUse: ['Exploration, learning, one-off investigation', 'Reading dashboards and findings'],
    whenNotToUse: ['Anything that must be repeatable, reviewable or audited as code'],
    keyNumbers: [
      {
        label: 'Console access for federated users',
        value: 'Via a sign-in URL generated from an STS federation token',
      },
    ],
    examTraps: ['MFA Delete cannot be enabled from the console — CLI or API only.'],
    confusedWith: [{ slug: 'cli', difference: 'Manual clicks versus scriptable commands.' }],
    pricing: 'Free.',
    docsUrl: `${D}/awsconsolehelpdocs/latest/gsg/getting-started.html`,
    related: ['cli', 'iam', 'cloudtrail'],
  },
]
