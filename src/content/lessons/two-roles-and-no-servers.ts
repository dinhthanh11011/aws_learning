import type { Lesson } from '../schema'

/**
 * The container half of the long tail. Two things are actually examined about
 * ECS — the two roles, and who owns the capacity — and they are examined as
 * symptoms rather than as definitions: a task that will not start, or code that
 * gets AccessDenied while the task runs happily.
 *
 * So the walkthrough forks on *when* IAM is consulted rather than on which role
 * has which policy. A reader who has watched the image pull happen before the
 * container exists cannot then put the application's permissions on the
 * execution role, because there is nothing of theirs running at that point to
 * use them.
 *
 * The launch-type picture comes second and deliberately without steps: it is a
 * fork, not a sequence, and the claim it makes — the scheduler is identical on
 * both branches — is only visible if both branches are on screen at once.
 *
 * Secret injection through the execution role is deliberately absent. It lives
 * in a question takeaway and on no atlas entry (invariant 23).
 */
export const twoRolesAndNoServers: Lesson = {
  id: 'two-roles-and-no-servers',
  families: ['saa', 'dva'],
  taskId: 'saa-3.2',
  title: 'Two roles, and who owns the server',
  subtitle:
    'A container task fails in two completely different ways that both read as “permissions”: it never starts, or it starts and your code cannot do its job. Which one you are looking at tells you which of the two IAM roles in the task definition is wrong — and neither of them is the one most people reach for.',
  minutes: 16,
  tier: 1,
  serviceSlugs: ['ecs', 'fargate'],
  requires: [],
  cardIds: [
    'which:ecs',
    'not:ecs',
    'num:ecs:launch-types',
    'num:ecs:two-iam-roles-per-task',
    'num:ecs:network-modes',
    'num:ecs:service-auto-scaling',
    'trap:ecs:the-two-roles-distinction-is-examined-directly-if-the-task',
    'trap:ecs:awsvpc-mode-gives-each-task-its-own-security-group-the-ans',
    'trap:ecs:ecs-anywhere-runs-the-agent-on-your-own-hardware-while-the-c',
    'trap:ecs:for-capacity-managed-automatically-as-tasks-grow-on-the-ec',
    'vs:ecs:eks',
    'vs:ecs:fargate',
    'vs:ecs:lambda',
    'which:fargate',
    'not:fargate',
    'num:fargate:task-sizes',
    'num:fargate:ephemeral-storage',
    'num:fargate:network-mode',
    'num:fargate:spot',
    'trap:fargate:fargate-is-not-a-separate-orchestrator-the-orchestrator-is',
    'trap:fargate:no-daemon-set-style-patterns-and-no-privileged-containers-on',
    'trap:fargate:a-fargate-task-in-a-private-subnet-still-needs-a-nat-gateway',
    'vs:fargate:lambda',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'Two tickets, the same week. In the first, a task will not start at all and the event log says it could not pull the image. In the second, the task is running, healthy, serving traffic — and every upload to [[s3]] comes back `AccessDenied`. Both are IAM problems and they are on **different roles**, because a container task has two of them and they are used at two different moments. Seeing when each one is consulted is the whole lesson; the exam then asks it back to you as a symptom.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'trns-two-roles',
        title: 'One task starting, and the two moments IAM is asked a question',
        caption:
          'The dividing line is your container’s first instruction. Everything before it is the platform acting on your behalf; everything after it is your code acting as itself.',
        // Template B, fan-in-the-middle: one task launch, forked on whether the
        // permission is needed before your code exists or after.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'taskdef',
            label: 'Task definition',
            sub: 'image, CPU, memory, roles',
            kind: 'note',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'ecs',
            label: 'Amazon ECS',
            sub: 'places the task',
            kind: 'service',
            category: 'containers',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'before',
            label: 'Before your code exists',
            sub: 'pull the image, open the log',
            kind: 'note',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'after',
            label: 'Your code, running',
            sub: 'PutObject to a bucket',
            kind: 'note',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'iam-execution',
            label: 'Task execution role',
            sub: 'used by the platform',
            kind: 'service',
            category: 'security',
            x: 17,
            y: 0.9,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'iam-task',
            label: 'Task role',
            sub: 'used by your application',
            kind: 'service',
            category: 'security',
            x: 17,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'place', from: 'taskdef', to: 'ecs', label: 'run this', tone: 'default' },
          { id: 'startup', from: 'ecs', to: 'before', label: 'startup', tone: 'warn' },
          { id: 'exec', from: 'before', to: 'iam-execution', label: 'asks', tone: 'warn' },
          { id: 'running', from: 'ecs', to: 'after', label: 'container up', tone: 'ok' },
          { id: 'task', from: 'after', to: 'iam-task', label: 'asks', tone: 'ok' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['place'],
            title: 'You describe a task; ECS decides where it goes',
            detail:
              'A **task definition** says which images, how much CPU and memory, which IAM role and which log driver. A **service** keeps N of them running behind a load balancer and replaces failures; a **task** is a one-off run.',
            tone: 'default',
          },
          {
            edgeIds: ['startup', 'exec'],
            title: 'First the platform does work on your behalf — and none of it is your code',
            detail:
              'The image has to be fetched and the log stream opened before there is a container at all. **The task execution role pulls the image and writes the logs.** If the task cannot pull from ECR, this is the role that is wrong, and no amount of policy on the other one helps.',
            tone: 'warn',
          },
          {
            edgeIds: ['running', 'task'],
            title: 'Only then does your process start, and it uses the other role',
            detail:
              '**The task role is what your code uses.** If your application gets `AccessDenied` calling S3, it is this one. The task started fine, which is exactly why the failure looks like an application bug rather than a permissions problem.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the name for it: two IAM roles per task',
      md: '**Task execution role pulls the image and writes logs; task role is what your code uses.** That split **is examined directly** and it is worth carrying as the two symptoms rather than as two definitions: *cannot pull its image* → execution role, *your code gets AccessDenied* → task role. ECS itself is the orchestrator underneath both — you describe a task definition and it places tasks onto capacity, keeping the count right and replacing failures.',
    },

    /* ── 3. The real configuration, read out a line at a time ─────────────── */
    { kind: 'heading', text: 'The task definition, downwards' },
    {
      kind: 'code',
      lang: 'json',
      caption: 'Both roles are in the file, four lines apart, and named almost identically',
      code: `{
  "family": "checkout",
  "networkMode": "awsvpc",
  "executionRoleArn": "arn:aws:iam::111122223333:role/checkoutTaskExecution",
  "taskRoleArn": "arn:aws:iam::111122223333:role/checkoutTask",
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "111122223333.dkr.ecr.eu-west-1.amazonaws.com/checkout:9f2c1a",
      "logConfiguration": { "logDriver": "awslogs" }
    }
  ]
}`,
    },
    {
      kind: 'steps',
      title: 'Four fields worth reading properly',
      items: [
        {
          title: 'networkMode: awsvpc is not a detail — it changes what a task is on the network',
          md: 'The modes are `awsvpc` — **each task gets its own ENI, and it is required by Fargate** — plus `bridge`, `host` and `none`. Under `awsvpc` **each task gets its own security group**, which is the answer whenever per-task network isolation is required — and it is the reason a container question can turn into a [[security-group]] question.',
        },
        {
          title:
            'executionRoleArn is the platform’s, and it is needed before anything of yours runs',
          md: 'This is the role that fetches the image named four lines below and creates the log stream configured beneath that. It is used and finished with before your process has a PID.',
        },
        {
          title: 'taskRoleArn is your application’s, and it is the one your SDK picks up',
          md: 'Nothing in your code references it. The credentials arrive the way they do on any AWS compute — which is the same reason an access key in an environment variable is never the right answer here either.',
        },
        {
          title: 'cpu and memory are a request, and on Fargate they are the whole bill',
          md: 'Fargate task sizes run **0.25 to 16 vCPU with matching memory ranges**, and you are billed per vCPU-second and GB-second of the size you asked for, from image pull to task stop. On the EC2 launch type the same numbers are a placement constraint against hosts you are already paying for.',
        },
      ],
    },

    /* ── 4. The wrong answer, as real syntax ──────────────────────────────── */
    { kind: 'heading', text: 'The fix that makes perfect sense and changes nothing' },
    {
      kind: 'code',
      lang: 'json',
      caption:
        'The task starts, the logs are clean, and every upload still fails. There is only one role in this file.',
      code: `{
  "family": "checkout",
  "executionRoleArn": "arn:aws:iam::111122223333:role/checkoutTaskExecution",
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                      s3:PutObject was attached to this role, because it
                      was the only role in the task definition and the
                      failure said AccessDenied. But this is the role the
                      platform used to pull the image, minutes before your
                      container existed. Your code never assumes it, so the
                      upload fails exactly as it did before — and the task
                      still starts perfectly, which is what makes this so
                      hard to see.
  "cpu": "1024"
}`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Read the moment, not the message',
      md: '`AccessDenied` from your own code is always the **task role**, however plausible the other one looks in the file. The reliable test is whether the task reached a running state: if it did, the execution role already did its job and cannot be the problem. **If the task cannot pull its image from ECR, it is the execution role.** If your application code gets `AccessDenied` calling S3, **it is the task role**.',
    },

    /* ── 5. The second question: who owns the servers ─────────────────────── */
    { kind: 'heading', text: 'And the other thing every container question asks' },
    {
      kind: 'diagram',
      spec: {
        id: 'trns-launch-types',
        title: 'The same task definition, the same scheduler, two answers to one question',
        caption:
          'Nothing to the left of the fork changes. Fargate is not an alternative to ECS — it is a launch type for it, and the only thing it decides is who owns the machines.',
        // Template B, fan-at-the-end. No steps: this is a fork rather than a
        // sequence, and the claim is that both branches share everything before
        // it — which is only visible with both on screen at once.
        cols: 19,
        rows: 8,
        nodes: [
          {
            id: 'image',
            label: 'Your image',
            sub: 'in Amazon ECR',
            kind: 'note',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'taskdef-b',
            label: 'Task definition',
            sub: 'unchanged either way',
            kind: 'note',
            x: 5.4,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'ecs-b',
            label: 'Amazon ECS',
            sub: 'the orchestrator, both times',
            kind: 'service',
            category: 'containers',
            x: 10.4,
            y: 3.3,
            w: 3,
            h: 1.3,
          },
          {
            id: 'fargate',
            label: 'AWS Fargate',
            sub: 'no host to patch',
            kind: 'service',
            category: 'containers',
            x: 15.2,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'ec2',
            label: 'EC2 launch type',
            sub: 'instances you own',
            kind: 'service',
            category: 'compute',
            x: 15.2,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'b1', from: 'image', to: 'taskdef-b', label: 'named in', tone: 'default' },
          { id: 'b2', from: 'taskdef-b', to: 'ecs-b', label: 'run this', tone: 'default' },
          { id: 'b3', from: 'ecs-b', to: 'fargate', label: 'placed on', tone: 'ok' },
          { id: 'b4', from: 'ecs-b', to: 'ec2', label: 'or on', tone: 'info' },
        ],
        groups: [],
        steps: [],
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Fargate is not a separate orchestrator',
      md: '**The orchestrator is still ECS or EKS; Fargate only answers “who owns the servers”.** An option that offers "Fargate instead of ECS" is offering a category error, and it appears often enough to be worth recognising on sight. Two consequences the paper does test: **no daemon-set-style patterns and no privileged containers on Fargate**, so a requirement for a host-level agent is pointing at the EC2 launch type — and **a Fargate task in a private subnet still needs a NAT gateway or VPC endpoints to pull from ECR**, which is the one that turns a container failure into a [[route-table|routing]] problem.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Two more one-line answers',
      md: 'For "capacity managed automatically as tasks grow" on the EC2 launch type, the answer is **an ECS capacity provider with managed scaling, not a raw Auto Scaling group policy** — the distinction being that the capacity provider knows about pending tasks and the scaling policy only knows about metrics. And **ECS Anywhere runs the agent on your own hardware while the control plane stays in AWS**, which is the answer to a stem about containers in a factory or a retail site.',
    },

    /* ── 6. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'What the stem says, and what it has just ruled out',
      columns: ['The answer', 'Why the neighbouring option is not'],
      rows: [
        {
          label: 'The word “Kubernetes”, or existing Helm charts',
          cells: [
            'EKS — upstream Kubernetes, its own ecosystem',
            'ECS is AWS-proprietary and simpler, and cannot run your charts',
          ],
        },
        {
          label: 'Containers, “minimal operational overhead”, no Kubernetes named',
          cells: [
            'ECS on Fargate — nothing to patch or size',
            'EKS carries more operational weight than the stem asked for',
          ],
        },
        {
          label: 'GPUs, host access, privileged mode, specific instance features',
          cells: [
            'The EC2 launch type — you own the hosts',
            'Fargate has no host to give you, whatever the task size',
          ],
        },
        {
          label: 'Dense, steady, high-utilisation fleets run all year',
          cells: [
            'EC2 launch type with reserved capacity',
            'Fargate bills the requested task size and works out dearer here',
          ],
        },
        {
          label: 'A long-running process you keep warm',
          cells: [
            'An ECS service — tasks that stay up',
            'Lambda is per-invocation with a 15-minute ceiling',
          ],
        },
        {
          label: 'Each task needs its own security group',
          cells: [
            'awsvpc network mode, which gives each task its own ENI',
            'bridge and host modes share the instance’s network',
          ],
        },
        {
          label: 'Interruptible, restartable container work',
          cells: [
            'Fargate Spot',
            'Savings Plans and Reserved capacity are for steady baseline load',
          ],
        },
      ],
    },

    /* ── 7. Numbers, last of all ──────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Launch types', value: 'Fargate (serverless) or EC2 (you manage the hosts)' },
        {
          label: 'Two IAM roles per task',
          value:
            'Task execution role pulls the image and writes logs; task role is what your code uses',
        },
        {
          label: 'Network modes',
          value: 'awsvpc (each task gets its own ENI, required by Fargate), bridge, host, none',
        },
        {
          label: 'Service auto scaling',
          value: 'Target tracking, step, and scheduled — via Application Auto Scaling',
        },
        { label: 'Fargate task sizes', value: '0.25–16 vCPU with matching memory ranges' },
        {
          label: 'Fargate ephemeral storage',
          value: '20 GB by default, configurable to 200 GB',
        },
        { label: 'Fargate network mode', value: 'awsvpc only — every task gets its own ENI' },
        { label: 'Fargate Spot', value: 'Available for interruption-tolerant tasks' },
      ],
    },

    /* ── 8. Next ──────────────────────────────────────────────────────────── */
    { kind: 'services', title: 'Where these facts live', slugs: ['ecs', 'fargate'] },
    {
      kind: 'prose',
      md: 'One thing this lesson drew as a single box: the image, sitting in a registry, already built and tagged. Getting it there is a separate question with its own answers — and the deployment side, where a bad image has to stop rolling out on its own, is the subject of **Shipping a change safely**.',
    },
  ],

  checks: [
    {
      id: 'two-roles-and-no-servers-execution',
      prompt:
        'A new ECS task never reaches a running state. The service event log says it could not pull the container image from ECR. Which role is wrong?',
      options: [
        {
          text: 'The task execution role, which is what pulls the image and writes the logs',
          correct: true,
          why: 'The pull happens before your container exists, so it is done by the platform on your behalf using the execution role. Nothing of yours is running yet to use the task role.',
        },
        {
          text: 'The task role, which needs ecr:GetDownloadUrlForLayer added to it',
          correct: false,
          why: 'The task role is assumed by your application code once it is running. It plays no part in starting the container.',
        },
        {
          text: 'The instance profile on the container instance, which must allow ECR',
          correct: false,
          why: 'On Fargate there is no instance to carry a profile at all, and the exam’s answer to this symptom is the execution role either way.',
        },
      ],
    },
    {
      id: 'two-roles-and-no-servers-task-role',
      prompt:
        'A Fargate task is running and healthy, but every S3 upload from the application returns AccessDenied. Where does the permission belong?',
      options: [
        {
          text: 'On the task role, which is the identity the application code uses',
          correct: true,
          why: 'The task started, so the execution role already did its job. Anything your own code calls is authorised through the task role.',
        },
        {
          text: 'On the task execution role, since that is the role the task definition already names',
          correct: false,
          why: 'This is the standard distractor. The execution role pulled the image and opened the log stream; your process never assumes it, so a policy added there has no effect.',
        },
        {
          text: 'In an environment variable holding an access key with S3 permissions',
          correct: false,
          why: 'A long-lived key on compute that can assume a role is the wrong answer to every question of this shape, and it does not become right because the role is confusing.',
        },
      ],
    },
    {
      id: 'two-roles-and-no-servers-launch-type',
      prompt:
        'A containerised workload needs a monitoring agent running on every host, with privileged access. Which launch type does that require?',
      options: [
        {
          text: 'The EC2 launch type, because Fargate supports neither daemon-set-style patterns nor privileged containers',
          correct: true,
          why: 'A requirement for a host-level agent is the standard signal for EC2 capacity: Fargate gives you no host to put one on.',
        },
        {
          text: 'Fargate, sizing the task large enough to run the agent as a sidecar',
          correct: false,
          why: 'A sidecar runs per task, not per host, and privileged mode is unavailable on Fargate whatever size you ask for.',
        },
        {
          text: 'EKS on Fargate, since Kubernetes daemon sets solve exactly this',
          correct: false,
          why: 'The restriction is a property of Fargate capacity rather than of the orchestrator above it. Moving to EKS does not give Fargate a host.',
        },
      ],
    },
    {
      id: 'two-roles-and-no-servers-isolation',
      prompt:
        'Each container task in a shared cluster must have its own firewall rules, distinct from every other task on the same infrastructure. What provides that?',
      options: [
        {
          text: 'awsvpc network mode, which gives each task its own ENI and its own security group',
          correct: true,
          why: 'Per-task network isolation is exactly what awsvpc is the answer to, and it is mandatory on Fargate for the same reason.',
        },
        {
          text: 'bridge network mode with distinct host port mappings per task',
          correct: false,
          why: 'Under bridge mode tasks share the instance’s network interface, so they share its security group. Port mappings separate traffic, not permissions.',
        },
        {
          text: 'A separate cluster per task so that the security groups cannot overlap',
          correct: false,
          why: 'A cluster is a logical grouping for placement. It is an expensive way to avoid a setting that already exists on the task definition.',
        },
      ],
    },
  ],
}
