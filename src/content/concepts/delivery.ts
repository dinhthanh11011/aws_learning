import type { Concept } from '../schema'

/**
 * How a request or a release reaches the other end. These four are the
 * primitives behind most of the DVA deployment domain and a good part of the
 * SAA performance domain — none of them is a service, and all of them decide
 * questions.
 */
export const deliveryConcepts: Concept[] = [
  {
    slug: 'cold-start',
    term: 'Cold start',
    group: 'delivery',
    certs: ['DVA-C02', 'SAA-C03'],
    oneLiner: 'The extra latency of the first invocation on a new execution environment.',
    whatItIs:
      'When Lambda has no warm environment available it creates one: download the code, start the runtime, run the initialisation code outside your handler, then invoke. That setup is the cold start, and only the first request pays it. Subsequent requests reuse the environment until it is reclaimed. Larger deployment packages, VPC attachment with new network interfaces, and heavy initialisation all lengthen it.',
    keyIdea:
      'Initialisation code outside the handler runs once per environment, not once per request. Putting SDK clients and database connections there is the single biggest thing you control.',
    onTheExam: [
      '"Consistent low latency for a spiky workload" is provisioned concurrency, which keeps environments initialised.',
      '"Predictable traffic ramp" is provisioned concurrency with Application Auto Scaling; "steady high volume" needs neither.',
      'A question about the first request after a deployment being slow is a cold start, because every deployment discards the warm environments.',
    ],
    keyNumbers: [
      {
        label: 'Init phase timeout',
        value: '10 seconds',
        note: 'Initialisation that exceeds it is retried as part of the invocation.',
      },
      {
        label: 'Provisioned concurrency',
        value: 'Keeps environments warm — charged whether used or not',
      },
      {
        label: 'Memory and CPU',
        value: 'CPU scales with configured memory',
        note: 'More memory can make a function both faster and cheaper.',
      },
      {
        label: 'Reserved concurrency',
        value: "Caps a function's concurrency; does not keep anything warm",
      },
    ],
    examTraps: [
      'Reserved concurrency and provisioned concurrency sound alike and do opposite things. Reserved is a limit; provisioned is warm capacity.',
      'Increasing the timeout does nothing for a cold start. It is initialisation time, not execution time.',
      'VPC-attached Lambda cold starts improved substantially with Hyperplane network interfaces. An option claiming VPC attachment adds many seconds is stale.',
    ],
    confusedWith: [
      {
        slug: 'scaling-up-vs-out',
        difference:
          'A cold start is the cost of adding one more environment. Scaling is the decision to add them at all. Provisioned concurrency pre-pays the cold start; it is not a scaling limit.',
      },
    ],
    serviceSlugs: ['lambda', 'api-gateway', 'fargate'],
    related: ['scaling-up-vs-out', 'deployment-strategies'],
    docsUrl: 'https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html',
  },
  {
    slug: 'sticky-sessions',
    term: 'Sticky sessions and session state',
    aka: ['session affinity', 'stateless application'],
    group: 'delivery',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner: 'Pinning a user to one backend, and why the exam almost always wants the opposite.',
    whatItIs:
      "Sticky sessions make a load balancer send a given client back to the same target, usually with a cookie, so that state held in that target's memory stays available. It works, and it costs you: uneven load, lost sessions when a target is replaced, and a scale-in event that logs people out. The alternative is to keep no state in the instance and put it in a shared store instead — ElastiCache, DynamoDB, or a signed token held by the client.",
    keyIdea:
      'Stickiness makes a stateful design survive a load balancer. Externalising session state makes the design stateless, which is what lets it scale and self-heal — and that is the answer the exam wants unless it says otherwise.',
    onTheExam: [
      '"Users are logged out when the group scales in" — move session state out of the instance, usually to ElastiCache for Redis or DynamoDB.',
      '"Traffic is unevenly distributed across instances" is often stickiness combined with long-lived connections.',
      'A stem that explicitly says the application cannot be modified is the case where stickiness is the correct answer.',
    ],
    keyNumbers: [
      {
        label: 'ALB stickiness duration',
        value: '1 second to 7 days',
        volatile: true,
      },
      {
        label: 'Cookie types',
        value: 'Application-based (your cookie) or duration-based (AWSALB)',
      },
      {
        label: 'ElastiCache for session state',
        value: 'Redis when you need replication and persistence; Memcached for a simple cache',
      },
    ],
    examTraps: [
      "Sticky sessions do not survive the loss of the target. The session is in that instance's memory, and it is gone.",
      'Storing session state on an EBS volume does not help, because the volume is attached to the same instance that just failed.',
      'A JWT held by the client is stateless and scales perfectly, but cannot be revoked before it expires. The exam sometimes tests that trade-off.',
    ],
    confusedWith: [
      {
        slug: 'cache-ttl-and-invalidation',
        difference:
          'Stickiness routes a user to where their state already is. Caching keeps a copy of a response so it need not be recomputed. Different problems, different layers.',
      },
    ],
    serviceSlugs: ['elb', 'elasticache', 'dynamodb', 'ec2-auto-scaling', 'cognito'],
    related: ['scaling-up-vs-out', 'cache-ttl-and-invalidation'],
    docsUrl:
      'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/sticky-sessions.html',
  },
  {
    slug: 'cache-ttl-and-invalidation',
    term: 'TTL and cache invalidation',
    group: 'delivery',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner: 'How long a cached copy is considered fresh, and how you get rid of it sooner.',
    whatItIs:
      'A cache serves a stored copy instead of recomputing or refetching. Time to live is how long that copy is treated as fresh; once it expires the cache revalidates or fetches again. Invalidation is forcing the copy out before its TTL. The same idea appears at every layer — CloudFront objects, DNS records, ElastiCache entries, browser caches — and each layer has its own TTL that adds to the total staleness a user can see.',
    keyIdea:
      'A long TTL is cheap and stale; a short TTL is fresh and expensive. Every TTL between the user and the origin adds up, which is why DNS TTL is part of your failover time and CloudFront TTL is part of your deployment time.',
    onTheExam: [
      '"Users still see the old file after a deployment" — a CloudFront invalidation, or better, a versioned object name so the URL changes.',
      '"Failover takes five minutes" with a DNS-based design — the Route 53 record TTL.',
      '"Reduce load on the database" is a cache; "reduce load on the origin for static files" is CloudFront.',
    ],
    keyNumbers: [
      {
        label: 'CloudFront default TTL',
        value: '24 hours when the origin sends no cache headers',
        volatile: true,
      },
      {
        label: 'CloudFront invalidation',
        value: 'First 1,000 paths per month free, then charged per path',
        volatile: true,
      },
      {
        label: 'Route 53 TTL',
        value: 'Seconds to days — 60 seconds is typical where failover matters',
      },
      {
        label: 'Cache-Control',
        value: 'Origin headers override CloudFront defaults',
      },
    ],
    examTraps: [
      'Versioned object names beat invalidation. Invalidation costs money and takes minutes; changing the URL is instant and free, and the exam prefers it.',
      'Lowering the DNS TTL has to happen before the failover, not during it. Clients already hold the old value for the old TTL.',
      'A cache in front of a database hides the problem when the requirement is actually about write throughput. Caching only helps reads.',
    ],
    confusedWith: [
      {
        slug: 'edge-location',
        difference:
          'The edge is where the cache lives. TTL is how long anything it holds stays valid. A question about staleness is about TTL, not about the network.',
      },
    ],
    serviceSlugs: ['cloudfront', 'route53', 'elasticache', 'api-gateway', 's3'],
    related: ['edge-location', 'sticky-sessions', 'failover'],
    docsUrl: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html',
  },
  {
    slug: 'deployment-strategies',
    term: 'Deployment strategies',
    aka: ['blue/green', 'canary', 'rolling', 'linear', 'all-at-once'],
    group: 'delivery',
    certs: ['DVA-C02', 'SAA-C03'],
    oneLiner: 'Named patterns for releasing a change, ordered by how much risk each one takes.',
    whatItIs:
      'All-at-once replaces everything and accepts downtime. Rolling replaces instances in batches, so old and new versions run together. Blue/green stands up a complete second environment and shifts traffic to it, keeping the old one ready for an instant rollback. Canary sends a small percentage to the new version first, then the rest. Linear shifts in equal increments on a timer.',
    keyIdea:
      'Blue/green buys instant rollback by paying for a duplicate environment. Canary buys early detection by exposing a few real users. Rolling buys neither and is simply cheap.',
    onTheExam: [
      '"Roll back immediately if there is a problem" is blue/green.',
      '"Expose the change to a small percentage of users first" is canary.',
      '"No downtime and no extra cost" points at rolling, and the exam expects you to notice that both versions run at once — so the database schema has to be compatible with both.',
    ],
    keyNumbers: [
      {
        label: 'CodeDeploy Lambda and ECS',
        value: 'Canary, linear or all-at-once, with automatic rollback on alarm',
      },
      {
        label: 'Lambda aliases',
        value: 'Weighted routing between two versions is how canary works there',
      },
      {
        label: 'Elastic Beanstalk',
        value:
          'All-at-once · rolling · rolling with additional batch · immutable · blue/green by URL swap',
      },
      {
        label: 'API Gateway canary',
        value: 'A percentage of requests to a canary stage deployment',
      },
    ],
    examTraps: [
      'Rolling deployments run two versions simultaneously, so a backwards-incompatible database migration breaks the old instances still serving traffic. The exam describes this as intermittent errors during deployment.',
      'A blue/green swap in Elastic Beanstalk is a CNAME swap, so DNS TTL applies to how fast it takes effect.',
      'Immutable deployments in Beanstalk create a whole new set of instances and are the safest of its non-blue/green options — often confused with rolling with additional batch.',
    ],
    confusedWith: [
      {
        slug: 'cold-start',
        difference:
          'Deployment strategy is how a new version reaches production. A cold start is the latency of the first request to a freshly created environment, which every deployment causes.',
      },
    ],
    serviceSlugs: [
      'codedeploy',
      'lambda',
      'ecs',
      'elastic-beanstalk',
      'api-gateway',
      'codepipeline',
    ],
    related: ['cold-start', 'cache-ttl-and-invalidation', 'blast-radius'],
    docsUrl:
      'https://docs.aws.amazon.com/whitepapers/latest/overview-deployment-options/introduction.html',
  },
]
