import type { Lesson } from '../schema'

/**
 * Three services that all sound like "monitoring" and answer three different
 * questions. The exam tests the mapping — "who deleted it", "is it slow",
 * "which hop is slow" — and the mapping is only memorable if you have watched
 * one incident asked two ways and got two different-shaped answers back.
 *
 * So the picture comes before the names: one slow checkout, the metric branch
 * saying *that* it is slow, the trace branch saying *where*. The naming
 * callout then quotes the atlas line the whole lesson hangs on — where
 * CloudWatch tells you a service is slow, X-Ray tells you which call inside it
 * is slow.
 *
 * The wrong answer is one word changed in one line of real SDK code:
 * `addMetadata` instead of `addAnnotation`, and then a filter that matches
 * nothing. "Annotations are indexed and metadata is not" is a sentence; a
 * filter expression returning zero traces is a demonstration.
 *
 * CloudTrail arrives last and deliberately without a diagram, because its
 * whole contribution to this lesson is that it is *not* on the path being
 * drawn — it is a record of the calls made to the account, not of the request
 * travelling through it.
 */
export const metricsTracesAndLogs: Lesson = {
  id: 'metrics-traces-and-logs',
  families: ['saa', 'dva'],
  taskId: 'dva-4.1',
  cluster: 'developer',
  title: 'Something is wrong. Which of the three tells you?',
  subtitle:
    'CloudWatch, X-Ray and CloudTrail are offered together in questions where only one of them can answer the sentence being asked. Each is a different question about the same system, and reading which question a stem is really asking takes about four words.',
  minutes: 17,
  tier: 1,
  serviceSlugs: ['cloudwatch', 'xray', 'cloudtrail'],
  requires: [],
  cardIds: [
    'which:cloudwatch',
    'which:xray',
    'which:cloudtrail',
    'not:cloudwatch',
    'not:xray',
    'not:cloudtrail',
    'num:cloudwatch:standard-metric-resolution',
    'num:cloudwatch:high-resolution-custom-metrics',
    'num:cloudwatch:metric-retention',
    'num:cloudwatch:log-retention',
    'num:cloudwatch:alarm-states',
    'num:cloudwatch:composite-alarms',
    'num:cloudwatch:not-collected-by-default',
    'num:cloudwatch:emf',
    'trap:cloudwatch:memory-and-disk-utilisation-are-guest-os-metrics-and-are-not',
    'trap:cloudwatch:cloudwatch-is-metrics-and-logs-cloudtrail-is-api-audit-hist',
    'trap:cloudwatch:a-metric-filter-on-a-log-group-turns-a-log-pattern-into-a-me',
    'trap:cloudwatch:setting-a-log-group-retention-period-is-the-standard-our-cl',
    'trap:cloudwatch:alarms-can-act-on-three-states-and-insufficient-data-handli',
    'trap:cloudwatch:emf-is-the-dva-flavoured-answer-to-emit-custom-metrics-from',
    'num:xray:lambda-setup',
    'num:xray:ec2-ecs-setup',
    'num:xray:annotations',
    'num:xray:metadata',
    'num:xray:sampling',
    'num:xray:segment-vs-subsegment',
    'trap:xray:annotations-are-indexed-and-searchable-metadata-is-not-fi',
    'trap:xray:x-ray-needs-the-daemon-on-ec2-and-ecs-but-on-lambda-you-jus',
    'trap:xray:missing-traces-from-a-lambda-function-is-usually-a-missing-i',
    'trap:xray:a-gap-in-the-service-map-between-two-services-means-the-call',
    'num:cloudtrail:event-history',
    'num:cloudtrail:management-events',
    'num:cloudtrail:data-events',
    'num:cloudtrail:log-file-validation',
    'num:cloudtrail:delivery-latency',
    'trap:cloudtrail:s3-object-level-activity-who-downloaded-this-file-requi',
    'trap:cloudtrail:event-history-is-only-90-days-long-retention-requires-a-tra',
    'trap:cloudtrail:log-file-validation-is-the-answer-to-prove-the-audit-log-ha',
    'trap:cloudtrail:cloudtrail-is-not-real-time-for-immediate-reaction-to-an-ap',
    'vs:cloudwatch:xray',
    'vs:cloudwatch:cloudtrail',
    'vs:cloudwatch:config',
    'vs:xray:cloudtrail',
    'trigger:t-who-did',
    'trigger:t-trace-filter',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'Checkout is taking four seconds. Every dashboard you own is green, because every service in the chain is individually within its own thresholds and the four seconds belong to none of them in particular. That is not a gap in your monitoring — it is a question your monitoring was never shaped to answer, and the exam is very good at describing exactly this situation and then offering you [[cloudwatch|CloudWatch]], [[xray|X-Ray]] and [[cloudtrail|CloudTrail]] as three plausible options.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'mtl-two-questions',
        title: 'One slow checkout, asked two ways',
        caption:
          'The incident is identical down both branches. What differs is the unit each one aggregates by — a resource, or a request — and that is the whole reason both exist.',
        // Template B, fan-in-the-middle: the same incident, forked on which
        // question is being asked of it.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'shopper',
            label: 'A slow checkout',
            sub: 'four seconds',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'lambda',
            label: 'Checkout function',
            sub: 'calls three things',
            kind: 'service',
            category: 'serverless',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'cloudwatch',
            label: 'CloudWatch',
            sub: 'metrics per resource',
            kind: 'service',
            category: 'mgmt',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'xray',
            label: 'X-Ray',
            sub: 'one trace per request',
            kind: 'service',
            category: 'mgmt',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'is-slow',
            label: 'Duration is up',
            sub: 'but not where',
            kind: 'note',
            x: 17,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'which-hop',
            label: 'One subsegment',
            sub: 'is nearly all of it',
            kind: 'note',
            x: 17,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'waits', from: 'shopper', to: 'lambda', label: 'one request', tone: 'default' },
          { id: 'metric', from: 'lambda', to: 'cloudwatch', label: 'a metric', tone: 'warn' },
          { id: 'aggregate', from: 'cloudwatch', to: 'is-slow', label: 'per minute', tone: 'warn' },
          { id: 'trace', from: 'lambda', to: 'xray', label: 'segments', tone: 'ok' },
          { id: 'locate', from: 'xray', to: 'which-hop', label: 'stitched', tone: 'ok' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['waits'],
            title: 'One request goes in, and it touches a database, a queue and a payment API',
            detail:
              'Nobody disputes that it is slow. The disagreement is about which of the four things it did is responsible.',
            tone: 'default',
          },
          {
            edgeIds: ['metric', 'aggregate'],
            title: 'The metric branch answers: yes, it is slow',
            detail:
              'CloudWatch metrics are numeric time series per resource, at **1-minute standard resolution** — or **1 second** for high-resolution custom metrics. Every value here is an aggregate over a resource, so it can tell you Duration has risen and it cannot tell you which call inside the function did it.',
            tone: 'warn',
          },
          {
            edgeIds: ['trace'],
            title: 'The trace branch keeps the request as the unit instead',
            detail:
              'Your instrumented application emits **segments**; downstream calls emit **subsegments**. A segment is the work by one service; a subsegment is a downstream call it made.',
            tone: 'ok',
          },
          {
            edgeIds: ['locate'],
            title: 'And stitched together they draw a map with the latency on each hop',
            detail:
              'Where CloudWatch tells you a service is slow, **X-Ray tells you which call inside it is slow**. That is the sentence to carry into the exam, and the reason “which hop” questions have exactly one right answer.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'And the third one is not on this diagram at all',
      md: '**CloudWatch is metrics and logs; CloudTrail is API audit history.** “Who deleted the bucket?” is CloudTrail. “Is CPU too high?” is CloudWatch. Nothing about the request above involves CloudTrail, because CloudTrail records the calls made *to the account* — the control-plane operations somebody performed — not the journey of a request through your application. Config is the fourth in that family: it records what the configuration became, not who called the API.',
    },

    /* ── 3. The instrumentation, read out one line at a time ──────────────── */
    { kind: 'heading', text: 'The two lines that decide whether a trace is searchable' },
    {
      kind: 'code',
      lang: 'javascript',
      caption: 'Both attach a value to the trace. Only one of them can be filtered on.',
      code: `const AWSXRay = require('aws-xray-sdk-core')

exports.handler = async (event) => {
  const segment = AWSXRay.getSegment()

  segment.addAnnotation('customerId', event.customerId)
  segment.addMetadata('cart', event.items)

  return charge(event)
}`,
    },
    {
      kind: 'steps',
      title: 'Four things that handler is quietly telling you',
      items: [
        {
          title: 'Annotations are indexed key–value pairs, and that is the whole difference',
          md: '**Annotations are indexed and searchable; metadata is not.** “Filter traces by customer id” therefore means an annotation, and this is asked directly on the developer paper. Metadata attaches extra context you can read once you have found the trace — it cannot be the thing you find it by.',
        },
        {
          title: 'Nothing here starts the trace — the service did that',
          md: 'On Lambda you **enable Active tracing** and there is no daemon to run. On EC2 and ECS you **run the X-Ray daemon, or the ADOT collector, alongside the application**. The two setups are different and the exam knows which one you are being asked about.',
        },
        {
          title:
            'The function still needs permission, and missing traces usually mean it does not have it',
          md: 'The execution role needs `AWSXRayDaemonWriteAccess`. **Missing traces from a Lambda function is usually a missing IAM permission on the execution role** — check that before you check the code.',
        },
        {
          title: 'And not every request will be here',
          md: '**Sampling defaults to 1 request per second plus 5% of the remainder**, and sampling rules are how you control cost while keeping enough traces to be useful. A trace you cannot find is sometimes a trace that was never recorded.',
        },
      ],
    },

    /* ── 4. The wrong answer, as real syntax ──────────────────────────────── */
    { kind: 'heading', text: 'The one-word version of this mistake' },
    {
      kind: 'code',
      lang: 'javascript',
      caption: 'Deployed, tracing on, traces arriving — and the filter finds nothing',
      code: `  segment.addMetadata('customerId', event.customerId)
          ^^^^^^^^^^^
          The value is attached to every trace and visible when you open
          one. It is not indexed, so the console filter below matches no
          traces at all, and it looks exactly like tracing being broken.

  # in the X-Ray console
  annotation.customerId = "c-91f2"`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'And the other reason a trace looks broken when it is not',
      md: '**A gap in the service map between two services means the calling side is not instrumented** — the SDK must be patched to trace downstream calls. The map stopping at your function is not evidence that the downstream service is healthy; it is evidence that nobody told the client to emit a subsegment.',
    },

    /* ── 5. The metrics half nobody expects to be missing ─────────────────── */
    { kind: 'heading', text: 'Two CloudWatch facts that are asked more often than they deserve' },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Memory and disk are not there, and never were',
      md: '**Memory and disk utilisation are guest-OS metrics and are NOT collected by default. You must install the CloudWatch agent.** This is asked directly and often, and the option that says “alarm on the existing memory metric” is offered every time it is asked.',
    },
    {
      kind: 'steps',
      title: 'The chain that turns a log line into a page, in the order you build it',
      items: [
        {
          title: 'A pattern in a log group becomes a metric',
          md: '**A metric filter on a log group turns a log pattern into a metric you can alarm on** — the answer to “alert me when this error appears in the logs”. Nothing about a log line is alarmable until this step has happened.',
        },
        {
          title: 'The metric gets an alarm, and an alarm has three states',
          md: '**OK · ALARM · INSUFFICIENT_DATA.** How missing data is treated shows up in flapping-alarm questions, and **composite alarms combine alarms with AND/OR to cut noise** when one signal on its own is not enough to wake somebody.',
        },
        {
          title: 'From a Lambda function, skip the API call entirely',
          md: '**EMF — the embedded metric format — means writing structured logs and getting metrics extracted automatically.** It is the DVA-flavoured answer to “emit custom metrics from a Lambda function without extra API calls”.',
        },
        {
          title: 'And set retention, because the default is the bill',
          md: '**Log retention is configurable from 1 day to never expire, and never-expire is the default** — which makes **setting a log-group retention period the standard answer to “our CloudWatch Logs bill keeps growing”.** Metrics are kept 15 months, rolled up progressively, and that is not configurable.',
        },
      ],
    },

    /* ── 6. The audit question, which is not a performance question ───────── */
    { kind: 'heading', text: 'The question that is not about performance at all' },
    {
      kind: 'prose',
      md: 'When a resource is gone, the resource cannot tell you who deleted it, and your application logs only record what the application did — not what someone did to the account. **CloudTrail** records API activity: management events, the control-plane operations, logged by default and kept in Event history for **90 days** free. Everything past that is a trail delivering to S3.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The single most common CloudTrail trap',
      md: '**S3 object-level activity — “who downloaded this file?” — requires data events, which are not on by default.** Data events cover S3 object-level operations and Lambda invocations, they are high volume, and they have to have been switched on *before* the thing you are investigating happened. After the fact is too late, which is what makes it a good exam question and a bad surprise.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Two more, and they decide whole questions on their own',
      md: '**Log file validation — SHA-256 digest files — is the answer to “prove the audit log has not been altered”.** And **CloudTrail is not real-time**: delivery is typically within about 15 minutes, so immediate reaction to an API call means sending it to EventBridge, or to CloudWatch Logs with a metric filter, rather than reading the trail.',
    },

    /* ── 7. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'The sentence in the stem, and the one service that can answer it',
      columns: ['What can actually answer it', 'The answer sitting next to it'],
      rows: [
        {
          label: '“Who deleted that bucket?”',
          cells: [
            'CloudTrail — an audit record of API callers',
            'CloudWatch, which holds metrics and application logs and no caller identity',
          ],
        },
        {
          label: '“Who downloaded that object?”',
          cells: [
            'CloudTrail with data events, enabled beforehand',
            'CloudTrail management events, which do not record object-level access',
          ],
        },
        {
          label: '“Which hop in the chain is slow?”',
          cells: [
            'X-Ray — one request, end to end, with latency per hop',
            'CloudWatch metrics, which aggregate per resource and lose the request',
          ],
        },
        {
          label: '“Filter traces by order id”',
          cells: [
            'An X-Ray annotation — indexed, and therefore filterable',
            'Metadata, which attaches the value but cannot be filtered on',
          ],
        },
        {
          label: '“Alert me when this error appears in the logs”',
          cells: [
            'A metric filter on the log group, then an alarm',
            'Logs Insights, which queries on demand and pages nobody',
          ],
        },
        {
          label: '“Alarm when memory passes 80%”',
          cells: [
            'The CloudWatch agent first — the metric does not exist without it',
            'An alarm on the built-in metric, which is not collected by default',
          ],
        },
        {
          label: '“Was this resource compliant last Tuesday?”',
          cells: [
            'Config — configuration state and compliance over time',
            'CloudTrail, which records the call and not the resulting state',
          ],
        },
      ],
    },

    /* ── 8. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
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
        {
          label: 'Not collected by default',
          value: 'Memory usage and disk space — those need the CloudWatch agent',
        },
        { label: 'Sampling', value: 'Default 1 request per second plus 5% of the remainder' },
        {
          label: 'Segment vs subsegment',
          value: 'Segment = work by one service · subsegment = a downstream call it made',
        },
        { label: 'Annotations', value: 'Indexed key–value pairs — filterable in queries' },
        { label: 'Metadata', value: 'Not indexed — extra context only' },
        {
          label: 'Event history',
          value: 'Last 90 days of management events, free, no trail required',
        },
        {
          label: 'Data events',
          value: 'S3 object-level and Lambda invocation events — off by default, and high volume',
        },
        { label: 'Delivery latency', value: 'Typically within about 15 minutes' },
      ],
    },

    /* ── 9. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['cloudwatch', 'xray', 'cloudtrail'],
    },
    {
      kind: 'prose',
      md: 'The alarm in the middle of this lesson is the same alarm a deployment rolls back on. Naming the metric that means “this release is bad”, and the threshold, is a decision taken before the deploy starts — which is where the observability half of this and the delivery half meet.',
    },
  ],

  checks: [
    {
      id: 'metrics-traces-and-logs-which-hop',
      prompt:
        'A request crosses four services and takes four seconds. Each service’s own dashboards look normal. What finds the slow hop?',
      options: [
        {
          text: 'X-Ray, because a trace keeps the request as the unit and shows latency per hop',
          correct: true,
          why: 'CloudWatch aggregates metrics per resource, which is exactly why each service looks fine. X-Ray stitches segments and subsegments into one trace and the slow call is visible rather than inferred.',
        },
        {
          text: 'CloudWatch metrics with a 1-second high-resolution custom metric per service',
          correct: false,
          why: 'Finer resolution gives you the same per-resource aggregate more often. It still cannot attribute one user’s four seconds to one of the four hops.',
        },
        {
          text: 'CloudTrail, filtered to the API calls those services made to each other',
          correct: false,
          why: 'CloudTrail is an audit record of AWS API calls, not of your application’s own calls, and it is not a latency tool at all.',
        },
      ],
    },
    {
      id: 'metrics-traces-and-logs-annotation',
      prompt:
        'Traces are arriving, but filtering the X-Ray console by customer id returns nothing. The value is visible when a trace is opened manually. What is wrong?',
      options: [
        {
          text: 'The value was added as metadata, which is not indexed — it needs to be an annotation',
          correct: true,
          why: 'Annotations are indexed and searchable; metadata is not. Being visible on an opened trace and invisible to a filter is exactly the symptom of that distinction.',
        },
        {
          text: 'Sampling is dropping the traces for that customer before they are recorded',
          correct: false,
          why: 'Sampling would mean fewer traces overall, not traces that exist and are visible but unfilterable.',
        },
        {
          text: 'The execution role is missing AWSXRayDaemonWriteAccess',
          correct: false,
          why: 'That produces no traces at all. Here traces are arriving and can be read, so the permission is in place.',
        },
      ],
    },
    {
      id: 'metrics-traces-and-logs-data-events',
      prompt:
        'A compliance investigation needs to know who downloaded a specific S3 object last month. Nothing beyond the defaults was configured. What can you tell them?',
      options: [
        {
          text: 'It cannot be reconstructed — object-level access needs CloudTrail data events, which are off by default and had to be enabled beforehand',
          correct: true,
          why: 'This is the most common CloudTrail trap. Management events are logged by default; data events are not, and they cannot be applied retroactively.',
        },
        {
          text: 'CloudTrail Event history has it, since management events are kept for 90 days',
          correct: false,
          why: 'Event history covers management events — control-plane operations. Reading an object is a data event and is not in there.',
        },
        {
          text: 'CloudWatch Logs Insights can query the bucket’s access records for that month',
          correct: false,
          why: 'CloudWatch holds metrics and application logs, not an audit record of who called what. That distinction is the one this pair of services exists to test.',
        },
      ],
    },
    {
      id: 'metrics-traces-and-logs-memory',
      prompt:
        'A team wants an alarm when an EC2 instance passes 80% memory utilisation. What has to happen first?',
      options: [
        {
          text: 'Install the CloudWatch agent, because memory is a guest-OS metric and is not collected by default',
          correct: true,
          why: 'Memory and disk are not published by the hypervisor. Without the agent there is no metric for an alarm to watch, and this is asked directly and often.',
        },
        {
          text: 'Nothing — create the alarm on the existing MemoryUtilization metric',
          correct: false,
          why: 'That metric does not exist by default. This option is offered every time the question is asked, which is a good reason to recognise it.',
        },
        {
          text: 'Switch the instance metrics to high resolution so memory is sampled every second',
          correct: false,
          why: 'Resolution changes how often a metric is published, not which metrics exist. Memory still is not one of them.',
        },
      ],
    },
  ],
}
