import type { Lesson } from '../schema'

/**
 * Every API Gateway question on DVA is really "where in the front door did this
 * request die?", and the answer is a status code the paper asks about by
 * number. So the picture comes before any of the numbers: one request, and the
 * two places it can be stopped before your code has run or after it has.
 *
 * The wrong answer is written as a real handler that works — it creates the
 * order, it returns the id — and still produces a 502, because proxy
 * integration wants an HTTP response and this is an object. "A malformed
 * response gives a 502" is a sentence; a handler you would happily merge is a
 * demonstration.
 *
 * The `optionSet` on `api-gateway` already holds the REST/HTTP/WebSocket table
 * and the endpoint-type table (invariant 21), so there is no `compare` on API
 * type here. The compare takes the axis neither table can carry: the status
 * code in front of you, and the layer it is pointing at.
 */
export const apiGatewayRequestPath: Lesson = {
  id: 'api-gateway-request-path',
  families: ['saa', 'dva'],
  taskId: 'dva-1.1',
  cluster: 'developer',
  title: 'What API Gateway does before your code runs',
  subtitle:
    'A request can fail with your function never invoked, invoked and ignored, or invoked and answered wrongly — and the caller sees a different number in each case. The exam asks for those numbers directly, and they are only memorable once you can see where along the path each one is produced.',
  minutes: 16,
  tier: 1,
  serviceSlugs: ['api-gateway'],
  requires: [],
  cardIds: [
    'which:api-gateway',
    'not:api-gateway',
    'num:api-gateway:integration-timeout',
    'num:api-gateway:payload-size',
    'num:api-gateway:authorisers',
    'num:api-gateway:caching',
    'num:api-gateway:integration-types',
    'num:api-gateway:stages',
    'trap:api-gateway:the-29-second-integration-timeout-is-a-hard-ceiling-a-long',
    'trap:api-gateway:usage-plans-plus-api-keys-are-the-answer-to-give-each-custo',
    'trap:api-gateway:stage-variables-are-how-one-deployment-points-at-different-l',
    'trap:api-gateway:a-private-endpoint-type-plus-a-vpc-interface-endpoint-is-the',
    'trap:api-gateway:http-apis-cannot-cache-and-cannot-transform-payloads-a-ques',
    'trap:api-gateway:lambda-proxy-integration-passes-the-whole-request-through-an',
    'trap:api-gateway:a-429-means-throttling-a-504-means-the-integration-timed-ou',
    'trap:api-gateway:cors-must-be-configured-explicitly-and-for-lambda-proxy-int',
    'optset:api-gateway:api-type',
    'opt:api-gateway:api-type:rest-api',
    'opt:api-gateway:api-type:http-api',
    'opt:api-gateway:api-type:websocket-api',
    'trap:opt:api-gateway:api-type:rest-api',
    'trap:opt:api-gateway:api-type:http-api',
    'trap:opt:api-gateway:api-type:websocket-api',
    'optset:api-gateway:endpoint-type',
    'opt:api-gateway:endpoint-type:edge-optimized',
    'opt:api-gateway:endpoint-type:regional',
    'opt:api-gateway:endpoint-type:private',
    'trap:opt:api-gateway:endpoint-type:private',
    'vs:api-gateway:elb',
    'vs:api-gateway:cloudfront',
    'vs:api-gateway:appsync',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'Your function is fine. It ran, it did the work, it returned. The caller got a **502** and there is nothing in your logs that looks like a failure. That is not a bug in your code — it is a fact about where your code sits. [[api-gateway|API Gateway]] is a managed API front end, and a request passes through several things it owns before your handler is invoked, and through one more on the way back. Each of those has its own way of ending the request, and the paper asks for them by number.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'agrp-front-door',
        title: 'One POST, and the two places it can end without a useful answer',
        caption:
          'The front door calls two things on your behalf: the authoriser first, the integration second. Neither of them is your handler, and both of them can finish the request without it.',
        // Template B, fan-in-the-middle: the same request, forked on which of
        // the two things API Gateway calls is the one that ends it.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'client',
            label: 'Mobile client',
            sub: 'POST /orders',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'api-gateway',
            label: 'API Gateway',
            sub: 'the managed front door',
            kind: 'service',
            category: 'frontend',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'cognito',
            label: 'Authoriser',
            sub: 'a Cognito user pool',
            kind: 'service',
            category: 'security',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'lambda',
            label: 'Your function',
            sub: 'proxy integration',
            kind: 'service',
            category: 'serverless',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'rejected',
            label: 'Rejected at the edge',
            sub: 'your code never ran',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'timeout',
            label: '504',
            sub: 'the integration timed out',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          {
            id: 'arrive',
            from: 'client',
            to: 'api-gateway',
            label: 'the request',
            tone: 'default',
          },
          { id: 'check', from: 'api-gateway', to: 'cognito', label: 'token?', tone: 'warn' },
          { id: 'deny', from: 'cognito', to: 'rejected', label: 'no', tone: 'bad' },
          { id: 'invoke', from: 'api-gateway', to: 'lambda', label: 'invoke', tone: 'ok' },
          { id: 'stall', from: 'lambda', to: 'timeout', label: '29 seconds', tone: 'bad' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['arrive'],
            title: 'The request arrives at a stage, not at your function',
            detail:
              'A **stage** is a named deployment — dev, prod — and the URL names one. Nothing of yours has run yet.',
            tone: 'default',
          },
          {
            edgeIds: ['check', 'deny'],
            title: 'The authoriser runs first, because authorisation happens at the edge',
            detail:
              'Four kinds exist to choose from: IAM, a Cognito user pool, a Lambda authoriser (token or request) and JWT on HTTP APIs. A **Cognito user pool authoriser validates the JWT for you** — no Lambda authoriser needed unless the logic is custom. When it says no, the request is finished here and your handler was never invoked.',
            tone: 'bad',
          },
          {
            edgeIds: ['invoke'],
            title: 'Only now is the integration called',
            detail:
              'The integration is what the method is wired to: Lambda proxy, Lambda, HTTP, an AWS service directly, Mock, or VPC Link. **Lambda proxy passes the whole request through** — headers, path, query string, body — as one event object.',
            tone: 'ok',
          },
          {
            edgeIds: ['stall'],
            title: 'And the front door will only wait 29 seconds for it',
            detail:
              'The **integration timeout is 29 seconds maximum**, and it is a hard ceiling. The caller gets a **504** and your function carries on running, unaware, until it finishes or hits its own timeout.',
            tone: 'bad',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the name for all of it: the front door',
      md: 'API Gateway is a managed API front end whose whole job is the part every API rebuilt by hand — authentication, throttling so one client cannot starve the rest, API keys per customer, request validation, CORS, and a public TLS endpoint. **Everything in that list happens before your integration is called**, which is why so many of its failures show up as a status code with nothing in your application logs to match.',
    },

    /* ── 3. The response your function has to produce ─────────────────────── */
    { kind: 'heading', text: 'The one contract proxy integration imposes' },
    {
      kind: 'code',
      lang: 'javascript',
      caption: 'What a Lambda proxy integration expects back — and it is not your domain object',
      code: `exports.handler = async (event) => {
  const order = await createOrder(JSON.parse(event.body))

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': 'https://shop.example.com',
    },
    body: JSON.stringify({ id: order.id, status: 'created' }),
  }
}`,
    },
    {
      kind: 'steps',
      title: 'Three things that return statement is quietly telling you',
      items: [
        {
          title: 'The handler is producing an HTTP response, not a value',
          md: 'Proxy integration passes the whole request through and **expects a specific response shape** back. `statusCode` and a string `body` are the load-bearing parts of it — the front door has nothing else to build a response from.',
        },
        {
          title: 'The CORS header is coming from your code, and that is not optional',
          md: '**CORS must be configured explicitly**, and for Lambda proxy integration the headers must come from your function. The preflight `OPTIONS` request is configuration on the method; the header on the real response is yours, and a browser that gets one without the other reports the same opaque failure for both.',
        },
        {
          title: 'And 10 MB is the ceiling on what can travel this way',
          md: 'The **request payload limit is 10 MB for REST APIs**. A requirement to move a file rather than a record is the signal to stop routing the bytes through the API at all.',
        },
      ],
    },

    /* ── 4. The wrong answer, as real syntax ──────────────────────────────── */
    { kind: 'heading', text: 'The handler that works perfectly and returns a 502' },
    {
      kind: 'code',
      lang: 'javascript',
      caption: 'The order really is created. The caller still gets a 502.',
      code: `exports.handler = async (event) => {
  const order = await createOrder(JSON.parse(event.body))

  return { id: order.id, status: 'created' }
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         A perfectly good object, and not an HTTP response. There is
         no statusCode and no string body, so API Gateway cannot turn
         it into anything to send back — that is a malformed response,
         and a malformed response is exactly what a 502 means.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Learn the three numbers as a diagnosis, not as trivia',
      md: '**A 429 means throttling; a 504 means the integration timed out**; and **a malformed proxy response gives a 502**. They get asked directly, and each one points at a different layer: 429 is the front door refusing you, 504 is the front door giving up on the backend, 502 is the backend answering in a shape the front door cannot use. Only the last one is a bug in your handler.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The 29 seconds is a design constraint, not a setting',
      md: '**The 29-second integration timeout is a hard ceiling.** No support ticket raises it. A long-running backend needs an asynchronous pattern — return a 202 and let the client poll a status endpoint, or hand the work to [[step-functions|Step Functions]]. When a stem describes work that takes minutes and asks how to expose it over HTTP, this is the whole question.',
    },

    /* ── 5. The choice the exam forces, without redrawing the option table ── */
    { kind: 'heading', text: 'Three sentences in a stem that decide the API type for you' },
    {
      kind: 'steps',
      title: 'HTTP API is the cheaper default, and these are what take it away',
      items: [
        {
          title: '“Cache the response” or “transform the payload before the backend sees it”',
          md: '**HTTP APIs cannot cache and cannot transform payloads.** Either requirement rules them out and lands you on REST. That is the usual way the exam forces the choice, and caching is REST-only at **0.5 GB to 237 GB with a TTL up to 3600 seconds**.',
        },
        {
          title: '“Each customer gets their own rate limit”',
          md: '**Usage plans plus API keys** are the answer, and they are a REST feature. Account-level throttling and a WAF rate rule are the distractors that sit next to it in the options — neither of them can tell one caller from another.',
        },
        {
          title: '“The server must push to the client”',
          md: 'A WebSocket API. The tell is push or real-time two-way traffic — chat, live dashboards, notifications — and polling over a REST API is the wrong answer to that requirement, however reasonable it sounds.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Two more configuration answers that are worth recognising cold',
      md: '**Stage variables are how one deployment points at different Lambda aliases per environment** — a named DVA skill, and the answer whenever a stem says one API definition must reach a different function per stage. And **a private endpoint type plus a VPC interface endpoint** is the answer to “the API must only be reachable from inside our VPC”. Half of that configuration fails closed, so an option offering only one of the two is wrong.',
    },

    /* ── 6. Compare, last, on the axis the option sets cannot carry ───────── */
    {
      kind: 'compare',
      title: 'The symptom in front of you, and the layer it is pointing at',
      columns: ['What it actually means', 'Where people look first, wrongly'],
      rows: [
        {
          label: '429 to the caller',
          cells: [
            'Throttling — the front door refused the request',
            'The function’s own concurrency, which never saw the request',
          ],
        },
        {
          label: '504 to the caller',
          cells: [
            'The integration timed out — 29 seconds is the ceiling',
            'The function’s timeout setting, which does not raise the ceiling',
          ],
        },
        {
          label: '502 to the caller',
          cells: [
            'A malformed proxy response — no statusCode, no string body',
            'The integration itself, which ran and succeeded',
          ],
        },
        {
          label: 'The browser reports a CORS error',
          cells: [
            'The headers must come from your function under proxy integration',
            'The preflight OPTIONS configuration alone, which is only half of it',
          ],
        },
        {
          label: '“Only reachable from inside our VPC”',
          cells: [
            'A private endpoint type and an interface endpoint, both',
            'A resource policy alone, or a private subnet, which do not apply',
          ],
        },
        {
          label: '“It is just HTTP routing to our containers”',
          cells: [
            'An ALB — cheaper at volume, and none of this applies',
            'API Gateway, which charges per request for a front door you are not using',
          ],
        },
      ],
    },

    /* ── 7. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'Integration timeout',
          value: '29 seconds maximum',
          note: 'Longer work must be made asynchronous.',
        },
        { label: 'Payload size', value: '10 MB request payload for REST APIs' },
        {
          label: 'Authorisers',
          value: 'IAM · Cognito user pool · Lambda (token or request) · JWT (HTTP APIs)',
        },
        {
          label: 'Integration types',
          value: 'Lambda proxy · Lambda · HTTP · AWS service · Mock · VPC Link',
        },
        { label: 'Caching', value: '0.5 GB to 237 GB, TTL up to 3600 seconds — REST APIs only' },
        { label: 'Stages', value: 'Named deployments (dev, prod) with stage variables' },
        {
          label: 'Default throttle',
          value: '10,000 requests per second per Region, 5,000 burst',
          volatile: true,
        },
      ],
    },

    /* ── 8. Next ──────────────────────────────────────────────────────────── */
    { kind: 'services', title: 'Where these facts live', slugs: ['api-gateway'] },
    {
      kind: 'prose',
      md: 'One thing this lesson deliberately left at a single arrow: the authoriser. It was drawn as a box that says yes or no, and the exam asks which box it should be — a [[cognito]] user pool, a third-party JWT, an AWS principal signing the request — which is a question about identity rather than about the front door, and it has a lesson of its own.',
    },
  ],

  checks: [
    {
      id: 'api-gateway-request-path-502',
      prompt:
        'A Lambda function behind a REST API with proxy integration creates the record successfully and logs no error, but every caller receives a 502. What is wrong?',
      options: [
        {
          text: 'The handler returns a plain object rather than a response with statusCode and a string body',
          correct: true,
          why: 'Proxy integration expects a specific response shape. Anything else is a malformed response, which is precisely what a 502 reports — and the work still happened, which is why the logs look clean.',
        },
        {
          text: 'The function is exceeding the 29-second integration timeout',
          correct: false,
          why: 'That produces a 504, not a 502. It is also inconsistent with the function completing its work and logging nothing unusual.',
        },
        {
          text: 'The API is being throttled and needs a higher account-level rate limit',
          correct: false,
          why: 'Throttling returns a 429 and stops the request at the front door, so the record would never have been created.',
        },
      ],
    },
    {
      id: 'api-gateway-request-path-long-job',
      prompt:
        'A report takes about four minutes to generate. The team wants to expose it as a synchronous HTTP endpoint through API Gateway. What should you tell them?',
      options: [
        {
          text: 'It cannot be synchronous — the integration timeout is a hard 29-second ceiling, so return a 202 and let the client poll, or use Step Functions',
          correct: true,
          why: 'The 29 seconds cannot be raised. Long work has to become a job with a status endpoint, which is the pattern these questions are testing for.',
        },
        {
          text: 'Raise the Lambda function timeout to five minutes so the integration has time to complete',
          correct: false,
          why: 'The function timeout and the integration timeout are different ceilings. API Gateway stops waiting at 29 seconds whatever the function is configured for.',
        },
        {
          text: 'Enable caching on the stage so the slow generation only happens once',
          correct: false,
          why: 'A cache cannot help the first request, which is the one that has to survive four minutes. It also does nothing for a report whose content differs per caller.',
        },
      ],
    },
    {
      id: 'api-gateway-request-path-api-type',
      prompt:
        'An API must transform incoming payloads before the backend sees them and give each partner a different request rate. Which API type does that require?',
      options: [
        {
          text: 'A REST API, because HTTP APIs cannot transform payloads and usage plans with API keys are a REST feature',
          correct: true,
          why: 'Either requirement on its own rules out HTTP APIs; together they land firmly on REST. Per-caller rate limits specifically mean usage plans plus API keys.',
        },
        {
          text: 'An HTTP API, which is cheaper and supports JWT authorisers for partner identity',
          correct: false,
          why: 'HTTP APIs cannot cache and cannot transform payloads. A JWT authoriser identifies a caller but does not give each one its own rate limit.',
        },
        {
          text: 'A WebSocket API, so each partner holds a persistent connection that can be rate limited',
          correct: false,
          why: 'WebSocket APIs are for bidirectional push — chat, live dashboards. Nothing in the requirement describes the server pushing to the client.',
        },
      ],
    },
    {
      id: 'api-gateway-request-path-stages',
      prompt:
        'One API definition must invoke a different Lambda alias in the dev and prod stages, without maintaining two APIs. What does that?',
      options: [
        {
          text: 'Stage variables, referenced by the integration so each stage points at its own alias',
          correct: true,
          why: 'This is exactly what stage variables exist for, and it is a named DVA skill: one deployment, different Lambda aliases per environment.',
        },
        {
          text: 'A Lambda authoriser that inspects the stage and routes to the correct alias',
          correct: false,
          why: 'An authoriser decides whether the request may proceed. It is not in the path of choosing which backend the integration calls.',
        },
        {
          text: 'Two endpoint types — regional for dev and edge-optimized for prod',
          correct: false,
          why: 'The endpoint type decides where requests enter the network, not which function they end up at. It has nothing to do with per-environment backends.',
        },
      ],
    },
  ],
}
