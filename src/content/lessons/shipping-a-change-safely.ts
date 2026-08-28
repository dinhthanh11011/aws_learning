import type { Lesson } from '../schema'

/**
 * Three services whose names all start with Code, and the paper's favourite
 * move is to offer all three as options to a question only one of them owns.
 * So the first picture is the division of labour, walked one stage at a time,
 * and the naming callout arrives after the reader has watched each box do its
 * single job.
 *
 * The second walkthrough is the release itself, because "canary" and "linear"
 * are words until you have seen the alarm sitting in the middle of the shift
 * deciding which way traffic goes next. Two `steps` diagrams on one page is
 * fine — `traceAt` is per diagram, so they advance independently.
 *
 * The wrong answer is a buildspec with the database password in a plaintext
 * env var and no `artifacts` section: one is the security question this file
 * always generates, and the other breaks the pipeline while the build stays
 * green, which is the more instructive of the two failures.
 *
 * `families` is DVA only. CodePipeline, CodeBuild and CodeDeploy are all
 * tier 2 and dva-tagged in the atlas; tagging the lesson for SAA would put a
 * developer-tools reading list on a phase that never mentions them.
 */
export const shippingAChangeSafely: Lesson = {
  id: 'shipping-a-change-safely',
  families: ['dva'],
  taskId: 'dva-3.4',
  cluster: 'developer',
  title: 'Three services called Code-something, and one release',
  subtitle:
    'CodePipeline, CodeBuild and CodeDeploy are offered as alternatives in questions where only one of them owns the job being described. They are not alternatives — they are three consecutive layers, and the exam is testing whether you know which layer a given sentence belongs to.',
  minutes: 18,
  tier: 2,
  serviceSlugs: ['codepipeline', 'codebuild', 'codedeploy'],
  requires: [],
  cardIds: [
    'which:codepipeline',
    'which:codebuild',
    'which:codedeploy',
    'num:codepipeline:structure',
    'num:codepipeline:action-types',
    'num:codepipeline:artifact-store',
    'num:codepipeline:triggers',
    'num:codepipeline:failure-behaviour',
    'trap:codepipeline:a-manual-approval-action-is-the-answer-to-require-sign-off',
    'trap:codepipeline:pipeline-events-go-to-eventbridge-which-is-how-you-notify-s',
    'trap:codepipeline:codepipeline-orchestrates-codebuild-compiles-codedeploy-re',
    'num:codebuild:buildspec-yml-phases',
    'num:codebuild:default-location',
    'num:codebuild:caching',
    'num:codebuild:vpc-access',
    'num:codebuild:environment-variables',
    'trap:codebuild:secrets-belong-in-secrets-manager-or-parameter-store-var',
    'trap:codebuild:to-reach-a-private-rds-instance-during-integration-tests-co',
    'trap:codebuild:the-artifacts-section-is-what-passes-output-to-the-next-pi',
    'trap:codebuild:a-build-needing-docker-requires-privileged-mode',
    'num:codedeploy:deployment-types',
    'num:codedeploy:lambda-ecs-configs',
    'num:codedeploy:ec2-configs',
    'num:codedeploy:appspec-yml',
    'num:codedeploy:ec2-requirement',
    'num:codedeploy:rollback',
    'trap:codedeploy:in-place-deployment-is-not-available-for-lambda-or-ecs-onl',
    'trap:codedeploy:the-lifecycle-hook-order-on-ec2-is-examined-applicationstop',
    'trap:codedeploy:canary-means-two-jumps-a-small-percentage-wait-then-the-r',
    'trap:codedeploy:blue-green-needs-spare-capacity-for-the-replacement-environm',
    'trap:codedeploy:allowtraffic-and-beforeallowtraffic-hooks-are-where-you-run',
    'vs:codepipeline:codebuild',
    'vs:codepipeline:codedeploy',
    'vs:codebuild:codeartifact',
    'vs:codedeploy:elastic-beanstalk',
    'idea:deployment-strategies',
    'define:deployment-strategies',
    'num:concept:deployment-strategies:codedeploy-lambda-and-ecs',
    'num:concept:deployment-strategies:lambda-aliases',
    'num:concept:deployment-strategies:elastic-beanstalk',
    'num:concept:deployment-strategies:api-gateway-canary',
    'trap:concept:deployment-strategies:rolling-deployments-run-two-versions-simultaneously-so-a-ba',
    'trap:concept:deployment-strategies:a-blue-green-swap-in-elastic-beanstalk-is-a-cname-swap-so-d',
    'trigger:t-canary',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'Every release is a bet that the new version works, and the only real variable is how many users are exposed while you find out — plus how fast you can undo it. AWS splits that bet across three services with confusingly similar names, and each one owns exactly one part of it. Get the division of labour right and a whole domain of the developer paper becomes recall.',
    },

    /* ── 2. Show the division of labour before naming it ──────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'scs-who-does-what',
        title: 'One commit, and the four things that happen to it',
        caption:
          'Read the arrows as ownership, not as data flow. Each box is doing the one job its name claims, and no box is doing another box’s job.',
        // Template B without the fan — a plain left-to-right chain, because
        // nothing here branches. Spacing keeps every label in a gap.
        cols: 21,
        rows: 3,
        nodes: [
          {
            id: 'commit',
            label: 'A commit',
            sub: 'pushed to main',
            kind: 'note',
            x: 0.2,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'codepipeline',
            label: 'CodePipeline',
            sub: 'decides the order',
            kind: 'service',
            category: 'devtools',
            x: 5.6,
            y: 1.4,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'codebuild',
            label: 'CodeBuild',
            sub: 'runs buildspec.yml',
            kind: 'service',
            category: 'devtools',
            x: 11,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'codedeploy',
            label: 'CodeDeploy',
            sub: 'runs appspec.yml',
            kind: 'service',
            category: 'devtools',
            x: 16.6,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          {
            id: 'trigger',
            from: 'commit',
            to: 'codepipeline',
            label: 'EventBridge',
            tone: 'default',
          },
          {
            id: 'build',
            from: 'codepipeline',
            to: 'codebuild',
            label: 'build stage',
            tone: 'info',
          },
          {
            id: 'release',
            from: 'codebuild',
            to: 'codedeploy',
            label: 'the artifact',
            tone: 'ok',
          },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['trigger'],
            title: 'The commit starts a pipeline execution, and EventBridge is how',
            detail:
              'A pipeline is triggered by a **source change (via EventBridge), a schedule, or manually**. A pipeline is stages, and a stage is actions — source, build, test, approve, deploy, invoke — which can run in parallel within a stage.',
            tone: 'default',
          },
          {
            edgeIds: ['build'],
            title: 'The build stage hands the work to CodeBuild, which owns the commands',
            detail:
              'CodeBuild compiles, tests and produces artifacts in **ephemeral containers**, and everything it does is described in `buildspec.yml`. CodePipeline does not know what a build is; it knows there is a stage and whether the stage succeeded.',
            tone: 'info',
          },
          {
            edgeIds: ['release'],
            title: 'And the artifact travels to the next stage through an S3 bucket',
            detail:
              'Artifacts pass between stages through an **S3 bucket, encrypted with KMS**. That bucket is the reason a cross-account deploy needs the artifact KMS key shared as well as a role to assume.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the sentence that resolves most of these questions',
      md: '**CodePipeline orchestrates; CodeBuild compiles; CodeDeploy releases.** Questions test which layer owns which job, and they do it by offering all three. “In what order do these run” is CodePipeline. “How is this compiled and tested” is CodeBuild. “How does the new version reach the fleet” is CodeDeploy — and Beanstalk has its own deployment policies for its own environments, so it is the wrong layer unless the workload is already a Beanstalk environment.',
    },

    /* ── 3. The buildspec, read out one line at a time ────────────────────── */
    { kind: 'heading', text: 'The file that is the build' },
    {
      kind: 'code',
      lang: 'yaml',
      caption: 'buildspec.yml, in the source root — everything CodeBuild does is here',
      code: `version: 0.2

env:
  secrets-manager:
    DB_PASSWORD: prod/api/db:password

phases:
  install:
    runtime-versions: { nodejs: 20 }
  pre_build:
    commands: [npm ci]
  build:
    commands: [npm run build, npm test]
  post_build:
    commands: [docker build -t $REPO:$CODEBUILD_RESOLVED_SOURCE_VERSION .]

artifacts:
  files: [appspec.yml, dist/**/*]

cache:
  paths: ['/root/.npm/**/*']`,
    },
    {
      kind: 'steps',
      title: 'Four things that file is quietly telling you',
      items: [
        {
          title: 'The four phase names are examinable in order',
          md: '**install · pre_build · build · post_build.** The file lives in the source root by default, or is overridden inline on the project — and “where does the build definition live” is a question that has been asked in exactly that shape.',
        },
        {
          title: 'The secret is a reference, not a value',
          md: 'Environment variables can be **plaintext, Parameter Store, or Secrets Manager references**, and secrets belong in the latter two, never in plaintext env vars. This is asked as a security question, and the plaintext option is always present.',
        },
        {
          title: 'The artifacts section is what the next stage receives',
          md: 'The `artifacts` section is **what passes output to the next pipeline stage. Omitting it breaks the pipeline, not the build** — which is why the symptom is a green build followed by a deploy stage that has nothing to deploy.',
        },
        {
          title: 'And two things this build would need adding for',
          md: 'A build that produces a container image **requires privileged mode**. A build that runs integration tests against a private RDS instance **must be configured for VPC access** — the ephemeral container is not in your VPC unless you put it there. Caching is S3 or local, and it is the lever for build time.',
        },
      ],
    },

    /* ── 4. The wrong answer, as real syntax ──────────────────────────────── */
    { kind: 'heading', text: 'The same file, written the way it usually is first' },
    {
      kind: 'code',
      lang: 'yaml',
      caption: 'The build passes. Both of these are still wrong.',
      code: `env:
  variables:
    DB_PASSWORD: "hunter2-prod"
                 ^^^^^^^^^^^^^^
                 In the repository, in every build log that echoes the
                 environment, and readable by anyone with access to the
                 project. Use the secrets-manager or parameter-store type.

phases:
  build:
    commands: [npm run build]
# artifacts: omitted
# ^^^^^^^^^^^^^^^^^^
#  The build goes green and the deploy stage fails with nothing to
#  deploy. The failure is one stage away from its cause, which is what
#  makes this one worth recognising rather than reasoning out.`,
    },

    /* ── 5. The release itself ────────────────────────────────────────────── */
    { kind: 'heading', text: 'And now the part the exam actually weighs: the shift' },
    {
      kind: 'diagram',
      spec: {
        id: 'scs-canary',
        title: 'A canary release, and the alarm that decides how it ends',
        caption:
          'The new version is already live for some users at step two. Everything after that is a question about what the metrics say, which is why the alarm has to exist before the deployment starts.',
        // Template B, fan-at-the-end: one shift, forking on what the alarm says.
        cols: 19,
        rows: 8,
        nodes: [
          {
            id: 'codedeploy',
            label: 'CodeDeploy',
            sub: 'canary: two jumps',
            kind: 'service',
            category: 'devtools',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'alias',
            label: 'Lambda alias',
            sub: 'weighted between versions',
            kind: 'note',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'cloudwatch',
            label: 'CloudWatch alarm',
            sub: 'named before the deploy',
            kind: 'service',
            category: 'mgmt',
            x: 10.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'shifted',
            label: 'The rest shifts',
            sub: 'deployment succeeds',
            kind: 'note',
            x: 15.6,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'rolled-back',
            label: 'Traffic goes back',
            sub: 'automatically',
            kind: 'note',
            x: 15.6,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'shift', from: 'codedeploy', to: 'alias', label: 'first jump', tone: 'info' },
          { id: 'watch', from: 'alias', to: 'cloudwatch', label: 'errors', tone: 'default' },
          { id: 'proceed', from: 'cloudwatch', to: 'shifted', label: 'OK', tone: 'ok' },
          { id: 'revert', from: 'cloudwatch', to: 'rolled-back', label: 'ALARM', tone: 'bad' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['shift'],
            title: 'A small percentage of real traffic moves to the new version',
            detail:
              '**Canary means two jumps** — a small percentage, a wait, then the rest. On Lambda, **weighted routing between two versions on an alias is how canary works there**; on ECS it is a second task set behind the load balancer.',
            tone: 'info',
          },
          {
            edgeIds: ['watch'],
            title: 'During the wait, one named alarm is the whole decision',
            detail:
              'This is why the alarm has to be defined before the deployment: “roll back if errors rise” is not a judgement made at the time, it is a threshold agreed in advance. **BeforeAllowTraffic and AllowTraffic hooks are where you run smoke tests before shifting users.**',
            tone: 'default',
          },
          {
            edgeIds: ['proceed'],
            title: 'If it stays OK, the second jump moves everyone',
            detail:
              'Linear would have done this in equal increments on a timer instead, and AllAtOnce would have skipped the wait entirely. All three names apply to both Lambda and ECS.',
            tone: 'ok',
          },
          {
            edgeIds: ['revert'],
            title: 'If it fires, the shift reverses without anybody being paged',
            detail:
              '**Rollback is automatic on a failed deployment or a CloudWatch alarm.** The users on the old version never noticed, and the ones on the new version were a small percentage for a bounded number of minutes. That is the entire value of the strategy.',
            tone: 'bad',
          },
        ],
      },
    },
    {
      kind: 'steps',
      title: 'On EC2 there is no traffic weighting, so there are hooks instead — in this order',
      items: [
        {
          title: 'ApplicationStop, then DownloadBundle, then BeforeInstall',
          md: 'The old version is stopped and the new bundle arrives before anything of yours runs. The order is examined as an order, so learn it as one.',
        },
        {
          title: 'Install, AfterInstall, ApplicationStart',
          md: 'Your files are placed, your post-install work runs, and the application is started. Nothing has been checked yet.',
        },
        {
          title: 'ValidateService — and this is the one that matters',
          md: 'The last hook is where you prove the instance is actually serving. For blue/green, **BeforeAllowTraffic** sits either side of the moment traffic moves, which is the distinction most hook questions are decided by.',
        },
        {
          title: 'And every one of them needs the agent',
          md: '**The CodeDeploy agent must be on each EC2 instance.** No agent, no hooks, no deployment — and that is the first thing to check when a deployment never starts on one instance in a fleet.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Two things that are true of EC2 and not of the others',
      md: '**In-place deployment is not available for Lambda or ECS — only EC2 and on-premises.** And **blue/green needs spare capacity for the replacement environment**, which the exam sometimes raises as a cost consideration rather than a technical one. If a stem says there is no budget for a duplicate environment, blue/green has been ruled out by the sentence about money.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The failure mode of the cheap strategy',
      md: '**Rolling deployments run two versions simultaneously, so a backwards-incompatible database migration breaks the old instances still serving traffic.** The exam describes this as intermittent errors during deployment — some requests fine, some failing, for the length of the rollout. That symptom is the tell, and the answer is a compatible schema rather than a different deployment configuration.',
    },
    {
      kind: 'callout',
      tone: 'ok',
      title: 'And two pipeline-level answers that are pure recall',
      md: '**A manual approval action is the answer to “require sign-off before production”** — a modelled stage, not an email. **Pipeline events go to EventBridge, which is how you notify Slack or email on failure — usually via SNS.** When a stage fails, the pipeline stops there and you retry that stage.',
    },

    /* ── 6. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'The requirement as a stem phrases it, and the named thing it is asking for',
      columns: ['What it is asking for', 'The answer sitting next to it'],
      rows: [
        {
          label: '“Roll back immediately if there is a problem”',
          cells: [
            'Blue/green — a complete second environment, kept ready',
            'Rolling, which has nothing to roll back to',
          ],
        },
        {
          label: '“Expose the change to a small percentage of users first”',
          cells: [
            'Canary — a percentage, a wait, then the rest',
            'Linear, which is equal increments on a timer',
          ],
        },
        {
          label: '“Shift in equal steps every ten minutes”',
          cells: ['Linear', 'Canary, which is two jumps and not a series'],
        },
        {
          label: '“No downtime and no extra capacity”',
          cells: [
            'Rolling — and the schema must suit both versions at once',
            'Blue/green, which is a duplicate environment you are paying for',
          ],
        },
        {
          label: '“Somebody must sign off before production”',
          cells: [
            'A manual approval action in the pipeline',
            'A notification, which informs somebody but gates nothing',
          ],
        },
        {
          label: '“Tell the team in Slack when a deployment fails”',
          cells: [
            'Pipeline events to EventBridge, usually on to SNS',
            'A build-log alarm, which is a stage away from the pipeline’s own state',
          ],
        },
      ],
    },

    /* ── 7. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Deployment types', value: 'In-place (EC2 only) · Blue/green (EC2, Lambda, ECS)' },
        {
          label: 'Lambda & ECS configs',
          value: 'Canary (two steps) · Linear (increments) · AllAtOnce',
        },
        { label: 'EC2 configs', value: 'OneAtATime · HalfAtATime · AllAtOnce' },
        {
          label: 'appspec.yml',
          value: 'YAML for EC2/on-premises; YAML or JSON for Lambda and ECS',
        },
        {
          label: 'Rollback',
          value: 'Automatic on a failed deployment or a CloudWatch alarm',
        },
        { label: 'buildspec.yml phases', value: 'install · pre_build · build · post_build' },
        {
          label: 'CodePipeline structure',
          value: 'Pipeline → stages → actions (which can run in parallel within a stage)',
        },
        { label: 'Artifact store', value: 'An S3 bucket, encrypted with KMS' },
        {
          label: 'API Gateway canary',
          value: 'A percentage of requests to a canary stage deployment',
        },
        {
          label: 'Elastic Beanstalk',
          value:
            'All-at-once · rolling · rolling with additional batch · immutable · blue/green by URL swap',
          note: 'The blue/green swap is a CNAME swap, so DNS TTL applies to how fast it takes effect.',
        },
      ],
    },

    /* ── 8. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['codepipeline', 'codebuild', 'codedeploy'],
    },
    {
      kind: 'prose',
      md: 'The alarm in the middle of that second diagram was drawn as a box that simply knows. It does not — somebody had to decide which metric means “this deployment is bad” and at what threshold, before the deploy button was pressed. That is an observability decision rather than a deployment one, and it has a lesson of its own.',
    },
  ],

  checks: [
    {
      id: 'shipping-a-change-safely-layer',
      prompt:
        'A team wants unit tests to run and a container image to be built on every commit, with no build servers to maintain. Which service owns that?',
      options: [
        {
          text: 'CodeBuild, driven by buildspec.yml in ephemeral containers',
          correct: true,
          why: 'CodeBuild compiles and tests. CodePipeline would decide when it runs, but the compiling itself is CodeBuild’s job and its configuration is buildspec.yml.',
        },
        {
          text: 'CodePipeline, which runs the test and build commands between stages',
          correct: false,
          why: 'CodePipeline orchestrates — it decides when and in what order. It does not run build commands itself; it invokes an action that does.',
        },
        {
          text: 'CodeDeploy, using appspec.yml hooks to build before installing',
          correct: false,
          why: 'CodeDeploy handles the release onto compute. Its hooks run around installing an artifact that already exists.',
        },
      ],
    },
    {
      id: 'shipping-a-change-safely-config',
      prompt:
        'A Lambda function must be released so that a small share of real traffic hits the new version, then the remainder after a wait, rolling back automatically if errors rise. Which configuration is that?',
      options: [
        {
          text: 'A canary deployment via CodeDeploy, with a CloudWatch alarm as the rollback trigger',
          correct: true,
          why: 'Canary is precisely two jumps — a percentage, a wait, then the rest — and rollback is automatic on a failed deployment or an alarm.',
        },
        {
          text: 'A linear deployment, which increases the share until the alarm clears',
          correct: false,
          why: 'Linear shifts in equal increments on a timer. The requirement describes one small step and then the remainder, which is the canary shape.',
        },
        {
          text: 'An in-place deployment with the ValidateService hook checking the error rate',
          correct: false,
          why: 'In-place deployment is not available for Lambda at all — only EC2 and on-premises.',
        },
      ],
    },
    {
      id: 'shipping-a-change-safely-secret',
      prompt:
        'A buildspec needs a database password for integration tests against a private RDS instance. What does the build need?',
      options: [
        {
          text: 'A secrets-manager environment variable reference, and VPC access configured on the project',
          correct: true,
          why: 'Secrets belong in Secrets Manager or Parameter Store variable types, never plaintext — and the ephemeral build container cannot reach a private RDS instance unless the project is configured for VPC access.',
        },
        {
          text: 'A plaintext environment variable, since the buildspec is in a private repository',
          correct: false,
          why: 'It is still in the repository, in build logs that echo the environment, and readable by anyone with project access. The variable types exist precisely to avoid this.',
        },
        {
          text: 'Privileged mode, which grants the build container the network access it needs',
          correct: false,
          why: 'Privileged mode is about building container images, not about network placement or secrets.',
        },
      ],
    },
    {
      id: 'shipping-a-change-safely-rolling',
      prompt:
        'During every rolling deployment, a fraction of requests fail for a few minutes and then everything is fine. What is the most likely cause?',
      options: [
        {
          text: 'Old and new versions run simultaneously, and the change is not backwards compatible with the running one',
          correct: true,
          why: 'A rolling deployment replaces instances in batches, so both versions serve traffic at once. A backwards-incompatible migration breaks the instances still on the old version, and the symptom is exactly intermittent errors for the length of the rollout.',
        },
        {
          text: 'The deployment configuration should be changed to AllAtOnce so both versions never coexist',
          correct: false,
          why: 'That removes the overlap by taking everything down at once, which trades intermittent errors for an outage. The incompatibility is still there.',
        },
        {
          text: 'The CodeDeploy agent is missing on some of the instances in the fleet',
          correct: false,
          why: 'A missing agent means those instances never deploy at all — a stuck or failed deployment, not a few minutes of partial errors that resolve on their own.',
        },
      ],
    },
  ],
}
