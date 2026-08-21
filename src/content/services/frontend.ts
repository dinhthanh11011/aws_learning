import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const frontendServices: Service[] = [
  {
    slug: 'api-gateway',
    name: 'Amazon API Gateway',
    abbr: 'APIGW',
    category: 'frontend',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Managed front door for APIs — auth, throttling, caching, transformation.',
    whatItIs:
      'A managed API front end in three flavours. *REST APIs* have the full feature set: request and response transformation, caching, API keys and usage plans, WAF, and multiple authoriser types. *HTTP APIs* are cheaper, faster and simpler, with JWT authorisers but no caching or transformation. *WebSocket APIs* handle bidirectional real-time connections.',
    whenToUse: [
      'Fronting Lambda functions as an HTTP API',
      'Authentication and authorisation at the edge of your API — Cognito, IAM or a Lambda authoriser',
      'Throttling and usage plans for third-party or tiered API consumers',
      'Caching responses to reduce backend load',
      'Request validation and payload transformation before the backend sees it',
    ],
    whenNotToUse: [
      'Plain HTTP load balancing to containers or instances — an ALB is cheaper at volume',
      'GraphQL — AppSync',
      'Very high throughput simple proxying, where API Gateway request pricing dominates',
    ],
    keyNumbers: [
      {
        label: 'Default throttle',
        value: '10,000 requests per second per Region, 5,000 burst',
        volatile: true,
      },
      {
        label: 'Integration timeout',
        value: '29 seconds maximum',
        note: 'Longer work must be made asynchronous.',
      },
      { label: 'Payload size', value: '10 MB request payload for REST APIs' },
      { label: 'Endpoint types', value: 'Edge-optimized · Regional · Private' },
      {
        label: 'Authorisers',
        value: 'IAM · Cognito user pool · Lambda (token or request) · JWT (HTTP APIs)',
      },
      { label: 'Caching', value: '0.5 GB to 237 GB, TTL up to 3600 seconds — REST APIs only' },
      {
        label: 'Integration types',
        value: 'Lambda proxy · Lambda · HTTP · AWS service · Mock · VPC Link',
      },
      { label: 'Stages', value: 'Named deployments (dev, prod) with stage variables' },
    ],
    examTraps: [
      'The 29-second integration timeout is a hard ceiling. A long-running backend needs an asynchronous pattern — return a 202 and poll, or use Step Functions.',
      'Usage plans plus API keys are the answer to "give each customer a different rate limit". Throttling alone does not identify callers.',
      'Stage variables are how one deployment points at different Lambda aliases per environment — a named DVA skill.',
      'A private endpoint type plus a VPC interface endpoint is the answer to "the API must only be reachable from inside our VPC".',
      'HTTP APIs cannot cache and cannot transform payloads. A question requiring either rules them out in favour of REST APIs.',
      'Lambda proxy integration passes the whole request through and expects a specific response shape — a malformed response gives a 502.',
      'A 429 means throttling; a 504 means the integration timed out. These specific codes get asked.',
      'CORS must be configured explicitly, and for Lambda proxy integration the headers must come from your function.',
    ],
    confusedWith: [
      {
        slug: 'elb',
        difference:
          'An ALB routes HTTP to targets. API Gateway adds authorisation, throttling, keys, caching, transformation and per-stage management — and charges per request.',
      },
      {
        slug: 'appsync',
        difference: 'REST/HTTP/WebSocket versus managed GraphQL with subscriptions.',
      },
      {
        slug: 'cloudfront',
        difference:
          'CloudFront caches globally at the edge; API Gateway is the API control plane (and edge-optimized endpoints use CloudFront underneath).',
      },
    ],
    pricing:
      'Per million requests (HTTP APIs cost roughly 70% less than REST), plus caching per hour and data transfer.',
    docsUrl: `${D}/apigateway/latest/developerguide/welcome.html`,
    related: ['lambda', 'cognito', 'waf', 'cloudfront', 'appsync', 'xray', 'dynamodb'],
  },
  {
    slug: 'amplify',
    name: 'AWS Amplify',
    category: 'frontend',
    families: ['saa', 'dva'],
    tier: 2,
    oneLiner: 'Full-stack hosting and backend scaffolding for web and mobile front ends.',
    whatItIs:
      'Amplify Hosting builds and serves front-end applications from a Git branch on a global CDN with atomic deploys, branch-based preview environments and pull-request previews. The Amplify libraries and backend tooling provision auth (Cognito), data (AppSync/DynamoDB), storage (S3) and functions from a declarative definition.',
    whenToUse: [
      'Hosting a React, Vue, Angular, Next.js or static site with CI/CD from Git',
      'Per-branch preview environments for review',
      'Rapidly scaffolding auth, API and storage for a front-end-led application',
    ],
    whenNotToUse: [
      'Complex bespoke backend architecture — build it explicitly with CDK or CloudFormation',
      'Static files with no build step — S3 plus CloudFront is cheaper and simpler',
    ],
    keyNumbers: [
      { label: 'Hosting', value: 'Git-connected build and deploy, on a CloudFront-backed CDN' },
      { label: 'Environments', value: 'One per branch, with pull-request previews' },
      { label: 'Backend categories', value: 'Auth · Data · Storage · Functions · Analytics' },
    ],
    examTraps: [
      'Amplify branch environments are named in DVA-C02 as a way to create integration-test environments from approved versions.',
      'For a purely static site with no build pipeline, S3 plus CloudFront is the cheaper answer.',
    ],
    confusedWith: [
      {
        slug: 's3',
        difference:
          'S3 plus CloudFront is manual static hosting; Amplify adds Git-driven builds, environments and backend scaffolding.',
      },
      {
        slug: 'elastic-beanstalk',
        difference: 'Beanstalk is server-side application PaaS; Amplify is front-end-first.',
      },
    ],
    pricing: 'Per build-minute plus per GB served and stored.',
    docsUrl: `${D}/amplify/latest/userguide/welcome.html`,
    related: ['s3', 'cloudfront', 'cognito', 'appsync', 'api-gateway'],
  },
  {
    slug: 'device-farm',
    name: 'AWS Device Farm',
    category: 'frontend',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Test mobile and web apps on real physical devices in the cloud.',
    whatItIs:
      'A device lab: run automated test suites, or interact remotely, across hundreds of real phones, tablets and browsers, with video, logs and performance data per run.',
    whenToUse: [
      'Testing a mobile app across many real device and OS combinations',
      'Reproducing a device-specific bug you cannot reproduce locally',
    ],
    whenNotToUse: ['Backend or unit testing — CodeBuild'],
    keyNumbers: [{ label: 'Modes', value: 'Automated test runs · remote manual access' }],
    examTraps: ['The tell is "real devices" for mobile testing. Nothing else in AWS does this.'],
    confusedWith: [
      {
        slug: 'codebuild',
        difference:
          'CodeBuild runs your build and unit tests; Device Farm runs on physical hardware.',
      },
    ],
    pricing: 'Per device-minute, or unmetered per device slot per month.',
    docsUrl: `${D}/devicefarm/latest/developerguide/welcome.html`,
    related: ['amplify', 'codebuild', 'codepipeline'],
  },
]
