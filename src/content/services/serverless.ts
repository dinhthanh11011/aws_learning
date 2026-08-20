import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const serverlessServices: Service[] = [
  {
    slug: 'lambda',
    name: 'AWS Lambda',
    abbr: 'λ',
    category: 'serverless',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: 'Run a function in response to an event; pay only while it runs.',
    whatItIs:
      'You upload code (a .zip up to 250 MB unzipped, or a container image up to 10 GB) and declare a handler. An event source invokes it, AWS provisions an execution environment, runs your handler, and freezes or discards the environment afterwards. You configure memory, and CPU scales proportionally with it — which is why increasing memory often makes a function both faster *and* cheaper.',
    whenToUse: [
      'Event-driven work: S3 uploads, DynamoDB streams, SQS messages, EventBridge rules, API Gateway requests',
      'Spiky or unpredictable traffic where idle capacity would be wasted',
      'Glue code between services, and lightweight data transformation',
      'Anything where the requirement says "no servers to manage"',
    ],
    whenNotToUse: [
      'Work that runs longer than 15 minutes — use ECS, Fargate or Batch',
      'Steady, high-volume, always-on compute where per-request pricing loses to a reserved instance',
      'Very large in-memory datasets, or workloads needing GPUs or specialised hardware',
      'Latency-critical paths that cannot absorb a cold start (unless you buy Provisioned Concurrency)',
    ],
    keyNumbers: [
      { label: 'Max timeout', value: '15 minutes (900 seconds)' },
      {
        label: 'Memory',
        value: '128 MB – 10,240 MB, in 1 MB steps',
        note: 'CPU is allocated in proportion; ~1,769 MB ≈ one full vCPU.',
      },
      {
        label: 'Deployment package',
        value: '50 MB zipped direct upload · 250 MB unzipped · 10 GB container image',
        note: 'The console code editor only opens a package under 3 MB — the usual reason to move dependencies into a layer.',
      },
      { label: '/tmp ephemeral storage', value: '512 MB default, configurable to 10,240 MB' },
      {
        label: 'Default concurrency',
        value: '1,000 per Region',
        note: 'A soft quota you can raise.',
        volatile: true,
      },
      { label: 'Layers', value: 'Up to 5 per function, counting toward the 250 MB unzipped limit' },
      { label: 'Environment variables', value: '4 KB total' },
      { label: 'Synchronous payload', value: '6 MB request/response · 256 KB asynchronous' },
      {
        label: 'Response streaming',
        value: 'Up to 20 MB soft limit, via a function URL or InvokeWithResponseStream',
        note: 'Bytes reach the client as they are produced — the way past the 6 MB buffered response.',
      },
    ],
    examTraps: [
      'Async invocations (S3, SNS, EventBridge) retry twice more, then send the event to a DLQ or an on-failure Destination. Synchronous invocations do not retry — the *caller* must.',
      'Reserved concurrency does two things at once: it guarantees that many concurrent executions *and* caps the function at that number. Provisioned concurrency is the different thing — pre-warmed environments that remove cold starts, and it costs money while idle.',
      'A function in a VPC can reach private resources but has no internet route unless the subnet has a NAT gateway. For AWS APIs, a VPC endpoint is the cheaper fix.',
      'Code outside the handler runs once per execution environment, not once per invocation. Initialise SDK clients and database connections there — this is asked directly.',
      'SQS as an event source uses long polling with batches; the batch size and `ReportBatchItemFailures` control partial-failure behaviour. A failed batch without partial reporting redelivers the whole batch.',
      'Aliases and versions are how you do canary releases: an alias can weight traffic across two versions. $LATEST cannot be weighted.',
      '429 TooManyRequestsException means concurrency throttling, not a code bug.',
    ],
    confusedWith: [
      {
        slug: 'fargate',
        difference:
          'Fargate runs long-lived containers with no time limit; Lambda runs short handlers with a 15-minute ceiling and much finer-grained billing.',
      },
      {
        slug: 'step-functions',
        difference:
          'Step Functions coordinates Lambda functions into a workflow with retries and state; it does not run your code itself.',
      },
      {
        slug: 'ec2',
        difference:
          'EC2 bills for uptime whether or not requests arrive; Lambda bills per millisecond of execution.',
      },
    ],
    pricing:
      'Per request plus GB-seconds of memory×duration. Provisioned concurrency adds an hourly charge for kept-warm environments.',
    docsUrl: `${D}/lambda/latest/dg/welcome.html`,
    related: [
      'api-gateway',
      'sqs',
      'sns',
      'eventbridge',
      'dynamodb',
      'step-functions',
      'xray',
      'sam',
    ],
  },
  {
    slug: 'fargate',
    name: 'AWS Fargate',
    category: 'serverless',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 1,
    oneLiner: 'Serverless capacity for containers — no instances to patch or scale.',
    whatItIs:
      'A launch type for ECS and a node option for EKS. You declare the CPU and memory a task needs; AWS finds and manages the underlying capacity. There is no host to log into, patch or right-size. Each task gets its own ENI in your VPC and its own kernel-level isolation.',
    whenToUse: [
      'Containerised workloads where you do not want to manage instances',
      'Variable or bursty container load where paying for idle EC2 hurts',
      'Compliance requirements around task-level isolation',
    ],
    whenNotToUse: [
      'You need GPUs, host access, privileged mode, or specific instance features — use the EC2 launch type',
      'Very dense, steady, high-utilisation fleets, where reserved EC2 works out cheaper',
      'Sub-second event handlers — Lambda',
    ],
    keyNumbers: [
      { label: 'Task sizes', value: '0.25–16 vCPU with matching memory ranges' },
      { label: 'Ephemeral storage', value: '20 GB by default, configurable to 200 GB' },
      { label: 'Network mode', value: 'awsvpc only — every task gets its own ENI' },
      { label: 'Spot', value: 'Fargate Spot is available for interruption-tolerant tasks' },
    ],
    examTraps: [
      'Fargate is not a separate orchestrator. The orchestrator is still ECS or EKS; Fargate only answers "who owns the servers".',
      'No daemon-set-style patterns and no privileged containers on Fargate. A question requiring a host-level agent is pointing at the EC2 launch type.',
      'A Fargate task in a private subnet still needs a NAT gateway or VPC endpoints to pull from ECR.',
    ],
    confusedWith: [
      {
        slug: 'lambda',
        difference:
          'No time limit and always-on processes on Fargate; 15-minute ceiling and per-millisecond billing on Lambda.',
      },
      {
        slug: 'ecs',
        difference:
          'ECS is the orchestrator that decides *what* runs; Fargate is the capacity that decides *where*.',
      },
    ],
    pricing:
      'Per vCPU-second and GB-second of the requested task size, from image pull to task stop.',
    docsUrl: `${D}/AmazonECS/latest/developerguide/AWS_Fargate.html`,
    related: ['ecs', 'eks', 'lambda', 'ecr', 'elb'],
  },
  {
    slug: 'appsync',
    name: 'AWS AppSync',
    category: 'serverless',
    certs: ['SAA-C03', 'DVA-C02'],
    tier: 2,
    oneLiner: 'Managed GraphQL API with real-time subscriptions.',
    whatItIs:
      'A managed GraphQL endpoint. You define a schema, attach resolvers to data sources (DynamoDB, Lambda, RDS via Data API, OpenSearch, HTTP), and AppSync handles the query execution, authorisation and WebSocket subscriptions for real-time updates.',
    whenToUse: [
      'A mobile or web client that wants exactly the fields it asks for, in one round trip',
      'Real-time features — live dashboards, chat, collaborative editing — via GraphQL subscriptions',
      'Offline-capable mobile apps with client-side sync',
    ],
    whenNotToUse: [
      'A conventional REST API — API Gateway is simpler and cheaper',
      'Server-to-server RPC where GraphQL adds nothing',
    ],
    keyNumbers: [
      {
        label: 'Auth modes',
        value: 'API key · IAM · Cognito user pools · OIDC · Lambda authoriser',
      },
      { label: 'Real-time', value: 'GraphQL subscriptions over WebSockets, managed for you' },
    ],
    examTraps: [
      'The exam tell for AppSync is "GraphQL" or "real-time updates to many clients" combined with "multiple data sources in one request".',
      'AppSync can do per-field authorisation, which API Gateway cannot.',
    ],
    confusedWith: [
      {
        slug: 'api-gateway',
        difference:
          'API Gateway fronts REST, HTTP and WebSocket APIs; AppSync is specifically GraphQL with managed subscriptions.',
      },
    ],
    pricing:
      'Per million query/mutation operations, plus real-time messages and connection minutes.',
    docsUrl: `${D}/appsync/latest/devguide/what-is-appsync.html`,
    related: ['api-gateway', 'dynamodb', 'lambda', 'cognito', 'amplify'],
  },
]
