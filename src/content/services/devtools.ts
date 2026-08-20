import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const devToolServices: Service[] = [
  {
    slug: 'xray',
    name: 'AWS X-Ray',
    category: 'devtools',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: 'Distributed tracing — follow one request across every service it touches.',
    whatItIs:
      'Your instrumented application emits *segments*; downstream calls emit *subsegments*; X-Ray stitches them into a trace and draws a service map showing latency and errors per hop. Where CloudWatch tells you a service is slow, X-Ray tells you which call inside it is slow.',
    whenToUse: [
      'Finding the slow hop in a microservice or serverless chain',
      'Debugging why a Lambda function times out — is it the database, the third-party API, or the code?',
      'Understanding the real call graph of a system nobody fully remembers',
      'Sampling production traffic without tracing everything',
    ],
    whenNotToUse: [
      'Aggregate metrics and alarms — CloudWatch',
      'API audit history — CloudTrail',
      'Log search — CloudWatch Logs Insights or OpenSearch',
    ],
    keyNumbers: [
      {
        label: 'Lambda setup',
        value: 'Enable Active tracing, and the role needs AWSXRayDaemonWriteAccess',
      },
      {
        label: 'EC2 / ECS setup',
        value: 'Run the X-Ray daemon (or the ADOT collector) alongside the application',
      },
      { label: 'Annotations', value: 'Indexed key–value pairs — filterable in queries' },
      { label: 'Metadata', value: 'Not indexed — extra context only' },
      { label: 'Sampling', value: 'Default 1 request per second plus 5% of the remainder' },
      {
        label: 'Segment vs subsegment',
        value: 'Segment = work by one service · subsegment = a downstream call it made',
      },
    ],
    examTraps: [
      'Annotations are indexed and searchable; metadata is not. "Filter traces by customer id" therefore means an annotation. This is asked directly on DVA.',
      'X-Ray needs the daemon on EC2 and ECS, but on Lambda you just switch on Active tracing — no daemon.',
      'Missing traces from a Lambda function is usually a missing IAM permission on the execution role.',
      'Sampling rules are how you control cost while keeping enough traces to be useful.',
      'A gap in the service map between two services means the calling side is not instrumented — the SDK must be patched to trace downstream calls.',
    ],
    confusedWith: [
      {
        slug: 'cloudwatch',
        difference:
          'CloudWatch aggregates metrics per resource; X-Ray follows one request end to end.',
      },
      {
        slug: 'cloudtrail',
        difference:
          "CloudTrail logs AWS API calls for audit; X-Ray traces your application's own calls for performance.",
      },
    ],
    pricing: 'Per million traces recorded, retrieved and scanned, with a free tier.',
    docsUrl: `${D}/xray/latest/devguide/aws-xray.html`,
    related: ['cloudwatch', 'lambda', 'api-gateway', 'ecs', 'step-functions'],
  },
  {
    slug: 'sam',
    name: 'AWS SAM',
    abbr: 'SAM',
    category: 'devtools',
    certs: ['DVA-C02'],
    tier: 1,
    oneLiner: 'Serverless shorthand for CloudFormation, plus a CLI that runs Lambda locally.',
    whatItIs:
      'The Serverless Application Model is a CloudFormation transform: `AWS::Serverless::Function`, `::Api`, `::HttpApi`, `::StateMachine`, `::SimpleTable` expand into dozens of raw resources. The SAM CLI is the other half — `sam local invoke` and `sam local start-api` run your functions in Docker on your machine, and `sam deploy --guided` packages and ships them.',
    whenToUse: [
      'Any serverless application defined as infrastructure as code',
      'Local testing and debugging of Lambda functions before deploying',
      'Gradual, alarm-guarded Lambda deployments via the built-in CodeDeploy integration',
      'Generating test events for Lambda triggers',
    ],
    whenNotToUse: [
      'Non-serverless infrastructure — plain CloudFormation or CDK',
      'Teams that prefer general-purpose code — CDK',
    ],
    keyNumbers: [
      { label: 'Transform header', value: 'Transform: AWS::Serverless-2016-10-31 — required' },
      {
        label: 'Key CLI commands',
        value:
          'sam init · sam build · sam local invoke · sam local start-api · sam deploy · sam logs · sam sync',
      },
      {
        label: 'Deployment preferences',
        value:
          'Canary10Percent5Minutes, Linear10PercentEvery1Minute, AllAtOnce — with alarms and hooks',
      },
      { label: 'Local requirement', value: 'Docker' },
      {
        label: 'Globals section',
        value: 'Shared defaults (runtime, memory, timeout) across every function',
      },
    ],
    examTraps: [
      'SAM templates *are* CloudFormation templates; the Transform line is what makes them valid. Forgetting it is a classic error.',
      '`sam local start-api` emulates API Gateway locally — the answer to "test the API before deploying".',
      'AutoPublishAlias plus DeploymentPreference is how SAM gives you canary Lambda deployments with automatic rollback on a CloudWatch alarm.',
      'SAM Accelerate (`sam sync`) shortens the inner development loop by skipping full CloudFormation deploys.',
    ],
    confusedWith: [
      {
        slug: 'cloudformation',
        difference:
          'SAM is a macro over CloudFormation with far less YAML for serverless resources.',
      },
      {
        slug: 'cdk',
        difference:
          'CDK is code in a real language for any resource; SAM is concise YAML specialised for serverless.',
      },
    ],
    pricing: 'Free. You pay for the deployed resources.',
    docsUrl: `${D}/serverless-application-model/latest/developerguide/what-is-sam.html`,
    related: ['lambda', 'cloudformation', 'cdk', 'api-gateway', 'codedeploy'],
  },
  {
    slug: 'codepipeline',
    name: 'AWS CodePipeline',
    category: 'devtools',
    certs: ['DVA-C02'],
    tier: 2,
    oneLiner: 'Orchestrates the CI/CD pipeline: source → build → test → deploy.',
    whatItIs:
      'A continuous delivery service made of stages, each containing actions. Actions can be source (Git, S3, ECR), build (CodeBuild, Jenkins), test, approval (a human gate), deploy (CodeDeploy, CloudFormation, ECS, Elastic Beanstalk, S3) or invoke (Lambda, Step Functions). Artifacts pass between stages through an S3 bucket.',
    whenToUse: [
      'Automating build and deploy on every commit',
      'A manual approval gate before production',
      'Fan-out to several deployment targets or Regions',
    ],
    whenNotToUse: [
      'You already run GitHub Actions or GitLab CI and only need the deploy step — use CodeDeploy or CloudFormation directly',
    ],
    keyNumbers: [
      {
        label: 'Structure',
        value: 'Pipeline → stages → actions (which can run in parallel within a stage)',
      },
      { label: 'Action types', value: 'Source · Build · Test · Approve · Deploy · Invoke' },
      { label: 'Artifact store', value: 'An S3 bucket, encrypted with KMS' },
      { label: 'Triggers', value: 'Source change (via EventBridge), schedule, or manual' },
      {
        label: 'Failure behaviour',
        value: 'The pipeline stops at the failed stage; you can retry that stage',
      },
    ],
    examTraps: [
      'A manual approval action is the answer to "require sign-off before production".',
      'Pipeline events go to EventBridge, which is how you notify Slack or email on failure — usually via SNS.',
      'Cross-account deploys need the pipeline role to assume a role in the target account, and the artifact KMS key must be shared.',
      'CodePipeline orchestrates; CodeBuild compiles; CodeDeploy releases. Questions test which layer owns which job.',
    ],
    confusedWith: [
      {
        slug: 'codebuild',
        difference:
          'CodeBuild runs the build commands; CodePipeline decides when and in what order.',
      },
      {
        slug: 'codedeploy',
        difference:
          'CodeDeploy handles the release strategy onto compute; CodePipeline invokes it as one stage.',
      },
    ],
    pricing: 'Per active pipeline per month, with a free tier.',
    docsUrl: `${D}/codepipeline/latest/userguide/welcome.html`,
    related: ['codebuild', 'codedeploy', 'cloudformation', 'ecs', 'lambda', 'eventbridge'],
  },
  {
    slug: 'codebuild',
    name: 'AWS CodeBuild',
    category: 'devtools',
    certs: ['DVA-C02'],
    tier: 2,
    oneLiner: 'Managed build service driven by a buildspec.yml file.',
    whatItIs:
      'Compiles source, runs tests and produces artifacts in ephemeral containers, with no build servers to maintain. Everything it does is described in `buildspec.yml`: install, pre_build, build, post_build phases, artifacts and cache configuration.',
    whenToUse: [
      'Compiling and testing on every commit with no CI servers to run',
      'Building container images and pushing to ECR',
      'Running integration tests inside a pipeline',
    ],
    whenNotToUse: [
      'Deploying — that is CodeDeploy or CloudFormation',
      'Long-running non-build compute — Batch or ECS',
    ],
    keyNumbers: [
      { label: 'buildspec.yml phases', value: 'install · pre_build · build · post_build' },
      {
        label: 'Default location',
        value: 'buildspec.yml in the source root, or an inline override',
      },
      { label: 'Caching', value: 'S3 cache or local cache, to speed up dependency installs' },
      { label: 'VPC access', value: 'Optional, for builds needing private resources' },
      {
        label: 'Environment variables',
        value: 'Plaintext, Parameter Store, or Secrets Manager references',
      },
    ],
    examTraps: [
      'Secrets belong in `secrets-manager` or `parameter-store` variable types, never in plaintext env vars — asked as a security question.',
      'To reach a private RDS instance during integration tests, CodeBuild must be configured for VPC access.',
      'The `artifacts` section is what passes output to the next pipeline stage. Omitting it breaks the pipeline, not the build.',
      'A build needing Docker requires privileged mode.',
    ],
    confusedWith: [
      { slug: 'codepipeline', difference: 'Orchestration versus execution of the build itself.' },
      {
        slug: 'codeartifact',
        difference: 'CodeArtifact hosts the dependencies CodeBuild downloads.',
      },
    ],
    pricing: 'Per build-minute by compute type, with a free tier.',
    docsUrl: `${D}/codebuild/latest/userguide/welcome.html`,
    related: ['codepipeline', 'codedeploy', 'ecr', 'codeartifact', 'secrets-manager'],
  },
  {
    slug: 'codedeploy',
    name: 'AWS CodeDeploy',
    category: 'devtools',
    certs: ['DVA-C02'],
    tier: 2,
    oneLiner: 'Releases application versions to EC2, Lambda or ECS with a chosen strategy.',
    whatItIs:
      'Handles the *release* step, driven by `appspec.yml`. On EC2 it runs lifecycle hooks (BeforeInstall, AfterInstall, ApplicationStart, ValidateService) via an agent. On Lambda and ECS it shifts traffic gradually — canary or linear — and rolls back automatically if a CloudWatch alarm fires.',
    whenToUse: [
      'Blue/green or canary releases with automatic rollback',
      'In-place rolling updates across an EC2 fleet',
      'Gradual traffic shifting to a new Lambda version',
      'ECS blue/green deployments behind an ALB',
    ],
    whenNotToUse: [
      'Provisioning infrastructure — CloudFormation',
      'Building artifacts — CodeBuild',
    ],
    keyNumbers: [
      { label: 'Deployment types', value: 'In-place (EC2 only) · Blue/green (EC2, Lambda, ECS)' },
      {
        label: 'Lambda & ECS configs',
        value: 'Canary (two steps) · Linear (increments) · AllAtOnce',
      },
      { label: 'EC2 configs', value: 'OneAtATime · HalfAtATime · AllAtOnce' },
      { label: 'appspec.yml', value: 'YAML for EC2/on-premises; YAML or JSON for Lambda and ECS' },
      { label: 'EC2 requirement', value: 'The CodeDeploy agent on each instance' },
      { label: 'Rollback', value: 'Automatic on a failed deployment or a CloudWatch alarm' },
    ],
    examTraps: [
      'In-place deployment is not available for Lambda or ECS — only EC2 and on-premises.',
      'The lifecycle hook order on EC2 is examined: ApplicationStop → DownloadBundle → BeforeInstall → Install → AfterInstall → ApplicationStart → ValidateService.',
      'Canary means two jumps (a small percentage, wait, then the rest); linear means equal increments. Picking between them from a risk requirement is a standard question.',
      'Blue/green needs spare capacity for the replacement environment — a cost consideration the exam sometimes raises.',
      'AllowTraffic and BeforeAllowTraffic hooks are where you run smoke tests before shifting users.',
    ],
    confusedWith: [
      {
        slug: 'elastic-beanstalk',
        difference:
          'Beanstalk has its own deployment policies for its own environments; CodeDeploy works against resources you manage.',
      },
      { slug: 'codepipeline', difference: 'CodePipeline calls CodeDeploy as a stage.' },
    ],
    pricing: 'Free for EC2 and Lambda; per on-premises instance update.',
    docsUrl: `${D}/codedeploy/latest/userguide/welcome.html`,
    related: ['codepipeline', 'codebuild', 'lambda', 'ecs', 'ec2', 'cloudwatch'],
  },
  {
    slug: 'codeartifact',
    name: 'AWS CodeArtifact',
    category: 'devtools',
    certs: ['DVA-C02'],
    tier: 3,
    oneLiner: 'Private package repository for npm, PyPI, Maven, NuGet and more.',
    whatItIs:
      'A managed artifact repository with upstream proxying to public registries, so you get caching, an audit trail and IAM-controlled access to internal packages.',
    whenToUse: [
      'Sharing internal libraries privately',
      'Controlling and caching third-party dependencies',
      'Supply-chain requirements for approved packages only',
    ],
    whenNotToUse: ['Container images — ECR'],
    keyNumbers: [
      { label: 'Formats', value: 'npm · PyPI · Maven · NuGet · generic · Swift · Ruby' },
      { label: 'Auth', value: 'A 12-hour token from `aws codeartifact get-authorization-token`' },
      { label: 'Upstreams', value: 'Proxy and cache public registries' },
    ],
    examTraps: [
      'CodeArtifact is language packages; ECR is container images. The pair gets offered together.',
    ],
    confusedWith: [{ slug: 'ecr', difference: 'Language packages versus OCI container images.' }],
    pricing: 'Per GB-month stored plus requests.',
    docsUrl: `${D}/codeartifact/latest/ug/welcome.html`,
    related: ['codebuild', 'ecr', 'codepipeline'],
  },
  {
    slug: 'cloudshell',
    name: 'AWS CloudShell',
    category: 'devtools',
    certs: ['DVA-C02'],
    tier: 3,
    oneLiner: 'Browser shell with the CLI installed and your credentials already loaded.',
    whatItIs:
      'A pre-authenticated Linux shell in the console, with the AWS CLI, Python, Node and Git preinstalled and persistent home storage, running with the permissions of your console identity.',
    whenToUse: [
      'Quick CLI work with no local setup',
      'Running commands from a machine that has no credentials configured',
    ],
    whenNotToUse: ['Long-running or heavy compute — it has modest resources and idle timeouts'],
    keyNumbers: [
      { label: 'Persistent storage', value: '1 GB per Region in the home directory' },
      { label: 'Session timeout', value: 'Around 20–30 minutes idle', volatile: true },
      { label: 'Credentials', value: 'Inherited from your console session' },
    ],
    examTraps: [
      'CloudShell runs as your console identity — it cannot exceed your own permissions.',
    ],
    confusedWith: [
      {
        slug: 'cli',
        difference: 'CloudShell is a hosted environment that has the CLI already set up.',
      },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/cloudshell/latest/userguide/welcome.html`,
    related: ['cli', 'iam'],
  },
  {
    slug: 'sdk',
    name: 'AWS SDKs',
    category: 'devtools',
    certs: ['DVA-C02'],
    tier: 1,
    oneLiner:
      'Language libraries for calling AWS APIs, with retries and credential resolution built in.',
    whatItIs:
      'Official libraries for JavaScript/TypeScript, Python (boto3), Java, .NET, Go, Rust, PHP, Ruby, Kotlin, Swift and C++. They handle request signing (SigV4), credential resolution from the environment, pagination, and — importantly for the exam — automatic retries with exponential backoff and jitter on throttling and transient errors.',
    whenToUse: [
      'Any application code that talks to AWS',
      'Anywhere you would otherwise hand-sign HTTP requests',
    ],
    whenNotToUse: [
      'Shell automation — the CLI',
      'Declarative infrastructure — CloudFormation or CDK',
    ],
    keyNumbers: [
      {
        label: 'Credential chain',
        value: 'Env vars → shared config/credentials file → container role → instance profile role',
      },
      {
        label: 'Retries',
        value:
          'Exponential backoff with jitter, on by default; configurable max attempts and retry mode',
      },
      {
        label: 'Retry modes',
        value: 'legacy · standard · adaptive (adaptive adds client-side rate limiting)',
      },
      {
        label: 'Pagination',
        value: 'Paginator helpers, or manual NextToken / LastEvaluatedKey loops',
      },
      { label: 'Signing', value: 'Signature Version 4, handled for you' },
    ],
    examTraps: [
      'The SDKs already retry with exponential backoff. Answers proposing that you write your own backoff for a ThrottlingException are usually wrong — the right answer is to raise the retry configuration, or fix the root cause.',
      'Never embed access keys in code. The credential chain is what makes roles work automatically — asked constantly.',
      'A DynamoDB Query returning fewer results than expected is usually unhandled pagination, not missing data.',
      'Reuse SDK clients across invocations by initialising them outside the Lambda handler.',
    ],
    confusedWith: [
      { slug: 'cli', difference: 'Application code versus shell commands, over the same APIs.' },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/sdkref/latest/guide/overview.html`,
    related: ['cli', 'iam', 'sts', 'lambda', 'dynamodb'],
  },
  {
    slug: 'q-developer',
    name: 'Amazon Q Developer',
    category: 'devtools',
    certs: ['DVA-C02'],
    tier: 2,
    oneLiner: 'AI coding assistant for generating, reviewing, testing and modernising code.',
    whatItIs:
      'An AI assistant in the IDE, CLI and console. It completes and generates code, explains and reviews it, generates unit tests, scans for security issues, and can perform guided upgrades. DVA-C02 now lists AI-assisted development among its emerging topics, so it appears in unscored pretest questions.',
    whenToUse: [
      'Generating code, tests and documentation from a specification',
      'Reviewing code for defects and security findings',
      'Explaining unfamiliar code or diagnosing an AWS error',
      'Language and framework upgrades',
    ],
    whenNotToUse: [
      'Anywhere a human must verify correctness and does not — AI output still needs review',
    ],
    keyNumbers: [
      { label: 'Surfaces', value: 'IDE plugins · CLI · AWS Console · chat' },
      {
        label: 'Capabilities',
        value:
          'Inline completion · code generation · test generation · security scanning · code transformation',
      },
      {
        label: 'Exam status',
        value: 'DVA-C02 emerging-topic — appears as unscored pretest content',
      },
    ],
    examTraps: [
      'Emerging AI topics on DVA-C02 are *unscored* pretest items. Worth recognising, not worth deep study time.',
      'The security half of the emerging topics matters more: controlling model inputs and outputs, and keeping sensitive content out of logs.',
    ],
    confusedWith: [
      {
        slug: 'sagemaker',
        difference:
          'SageMaker is for building and training your own models; Q Developer is a ready-made assistant.',
      },
    ],
    pricing: 'Free tier plus a per-user Pro subscription.',
    docsUrl: `${D}/amazonq/latest/qdeveloper-ug/what-is.html`,
    related: ['sdk', 'codebuild', 'sagemaker'],
  },
]
