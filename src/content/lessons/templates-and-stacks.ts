import type { Lesson } from '../schema'

/**
 * The long tail after batch 7, and the first of the four: infrastructure as
 * code as the thing a developer actually deploys with.
 *
 * The order here is chosen against one specific failure. Everybody meets
 * CloudFormation as syntax — sections, intrinsic functions, a wall of YAML —
 * and the exam does not ask about syntax. It asks what happens to a resource
 * when the stack changes, which is a question about the *stack* being the unit
 * rather than the resource. So the walkthrough of one update comes first, and
 * every piece of syntax afterwards is read as an answer to something already
 * seen going wrong.
 *
 * SAM arrives last and deliberately without a walkthrough of its own: its whole
 * contribution is that it is the same engine with less to type, and drawing it
 * as a separate journey would teach the opposite.
 *
 * UpdateReplacePolicy is deliberately absent. It appears in a question takeaway
 * and on no atlas entry, so using it here would be the lesson introducing a
 * fact (invariant 23).
 */
export const templatesAndStacks: Lesson = {
  id: 'templates-and-stacks',
  families: ['saa', 'dva'],
  taskId: 'dva-3.1',
  title: 'The stack is the unit, not the resource',
  subtitle:
    'Somebody deletes the staging stack on a Friday to stop paying for it, and the database goes with it. Nothing was misconfigured — that is what a stack is. Every CloudFormation question on either paper is really asking whether you know which of your resources the stack owns and what it will do to them next.',
  minutes: 17,
  tier: 1,
  serviceSlugs: ['cloudformation', 'sam'],
  requires: [],
  cardIds: [
    'which:cloudformation',
    'not:cloudformation',
    'num:cloudformation:template-sections',
    'num:cloudformation:intrinsic-functions',
    'num:cloudformation:cross-stack-references',
    'num:cloudformation:deletionpolicy',
    'num:cloudformation:change-sets',
    'num:cloudformation:nested-stacks',
    'num:cloudformation:helper-scripts',
    'trap:cloudformation:deletionpolicy-retain-or-snapshot-on-a-database-is-the-an',
    'trap:cloudformation:failed-create-rolls-back-and-deletes-everything-by-default',
    'trap:cloudformation:stack-updates-can-replace-a-resource-which-changes-its-phys',
    'trap:cloudformation:stacksets-is-the-answer-to-deploy-this-to-every-account-and',
    'trap:cloudformation:drift-detection-is-the-answer-to-someone-modified-our-resou',
    'trap:cloudformation:creationpolicy-plus-cfn-signal-is-how-a-stack-waits-for-an-a',
    'vs:cloudformation:cdk',
    'vs:cloudformation:sam',
    'vs:cloudformation:elastic-beanstalk',
    'which:sam',
    'not:sam',
    'num:sam:transform-header',
    'num:sam:key-cli-commands',
    'num:sam:deployment-preferences',
    'num:sam:local-requirement',
    'num:sam:globals-section',
    'trap:sam:sam-templates-are-cloudformation-templates-the-transform',
    'trap:sam:sam-local-start-api-emulates-api-gateway-locally-the-ans',
    'trap:sam:autopublishalias-plus-deploymentpreference-is-how-sam-gives',
    'trap:sam:sam-accelerate-sam-sync-shortens-the-inner-development-l',
    'vs:sam:cdk',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'You change one property in a template — a name, a size, something that reads like an edit — and run the update. It succeeds. The stack is green. The table is empty. Nobody made a mistake, and no alarm fired, because [[cloudformation|CloudFormation]] did exactly what it was asked: it creates, updates and deletes the resources in a template **as a stack**, in dependency order. The unit it acts on is the stack, and the question the exam keeps asking is what that means for the one resource in it that holds your data.',
    },

    /* ── 2. Show it before naming it ──────────────────────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'tas-one-update',
        title: 'One update, submitted twice, and the two things it can do to a resource',
        caption:
          'Both paths report success. Only one of them still has the rows in it afterwards, and which one you get is decided by the property you edited — not by anything the update tells you at the time.',
        // Template B, fan-in-the-middle: the same submitted update, forked on
        // whether CloudFormation can change the resource or has to remake it.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'template',
            label: 'Your template',
            sub: 'one property edited',
            kind: 'note',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'cloudformation',
            label: 'CloudFormation',
            sub: 'the stack, in dependency order',
            kind: 'service',
            category: 'mgmt',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'inplace',
            label: 'Updated in place',
            sub: 'same resource, changed',
            kind: 'note',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'replaced',
            label: 'Replaced',
            sub: 'a new physical id',
            kind: 'note',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'kept',
            label: 'Your rows are there',
            sub: 'update complete',
            kind: 'data',
            x: 17,
            y: 0.9,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'gone',
            label: 'A new, empty one',
            sub: 'update complete',
            kind: 'data',
            x: 17,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          {
            id: 'submit',
            from: 'template',
            to: 'cloudformation',
            label: 'the update',
            tone: 'default',
          },
          { id: 'edit', from: 'cloudformation', to: 'inplace', label: 'can change', tone: 'ok' },
          { id: 'keeps', from: 'inplace', to: 'kept', tone: 'ok' },
          { id: 'remake', from: 'cloudformation', to: 'replaced', label: 'cannot', tone: 'bad' },
          { id: 'drops', from: 'replaced', to: 'gone', label: 'old deleted', tone: 'bad' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['submit'],
            title: 'You submit a template, not a change',
            detail:
              'CloudFormation compares what the template says to what the stack currently is. Nothing you wrote said "modify" — the template is a description of the finished state, and working out how to get there is its job, not yours.',
            tone: 'default',
          },
          {
            edgeIds: ['edit', 'keeps'],
            title: 'Where it can, it changes the resource you already have',
            detail:
              'The resource keeps its identity. This is the case everyone pictures when they say "update", and it is why the other case is such a surprise.',
            tone: 'ok',
          },
          {
            edgeIds: ['remake', 'drops'],
            title: 'Where it cannot, an update is a Replace',
            detail:
              '**Stack updates can Replace a resource, which changes its physical id** — the reason an "update" sometimes silently recreates your database. A new one is created, the stack is pointed at it, and the old one is deleted. The stack reports success either way.',
            tone: 'bad',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the name for it: a stack',
      md: 'A stack is one template’s resources managed as **one unit** — created, updated and deleted together, in dependency order, and rolled back when a step fails. That is the whole idea, and everything else is a way of controlling it: **change sets preview what an update will do** before it does it, **drift detection tells you when someone changed something by hand**, and **StackSets deploy the same template across many accounts and Regions**.',
    },

    /* ── 3. The real configuration, read out a line at a time ─────────────── */
    { kind: 'heading', text: 'The four lines that answer the four questions' },
    {
      kind: 'code',
      lang: 'yaml',
      caption: 'A fragment of a real template. Every line here is a question the exam asks.',
      code: `Parameters:
  Environment:
    Type: String

Resources:
  Orders:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Retain
    Properties:
      TableName: !Sub '\${Environment}-orders'

Outputs:
  OrdersTable:
    Value: !Ref Orders
    Export:
      Name: !Sub '\${AWS::StackName}-orders-table'`,
    },
    {
      kind: 'steps',
      title: 'Reading it downwards',
      items: [
        {
          title: 'Parameters is one of seven sections, and only one of them is required',
          md: 'The sections are `Parameters`, `Mappings`, `Conditions`, `Resources`, `Outputs`, `Transform` and `Metadata` — and `Resources` is **the only required one**. A template with nothing but a `Resources` block is a valid template.',
        },
        {
          title: 'DeletionPolicy sits beside Type, not inside Properties',
          md: 'It is an attribute of the resource in the stack rather than a setting on the thing itself, which is exactly what it means: `Retain`, `Snapshot` or `Delete`, **the way to keep a database when the stack goes**. This one line is the answer to a question that gets asked on both papers.',
        },
        {
          title: '!Sub and !Ref are intrinsic functions, and there are seven worth knowing',
          md: '`!Ref` · `!GetAtt` · `!Sub` · `!ImportValue` · `!FindInMap` · `!If` · `!Join`. They exist because a template is data, not a program — anything that has to be computed at deployment time is computed by one of these.',
        },
        {
          title: 'Export turns an Output into something another stack can consume',
          md: 'The pair is **export an Output**, then `!ImportValue` it in the other stack. It comes with a catch worth remembering: **an exported value cannot be deleted while another stack imports it**, so a shared network stack becomes very hard to tear down once four stacks depend on it.',
        },
      ],
    },

    /* ── 4. The wrong answer, as real syntax ──────────────────────────────── */
    { kind: 'heading', text: 'The edit that looks like a rename' },
    {
      kind: 'code',
      lang: 'yaml',
      caption: 'A one-word change, reviewed by two people, and approved in seconds.',
      code: `Resources:
  Orders:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: orders-v2
                 ^^^^^^^^^
                 Some properties can be changed on the resource you have.
                 Others cannot, and for those this is not an edit at all —
                 it is a Replace: a new resource with a new physical id,
                 the stack repointed at it, and the old one deleted. There
                 is no DeletionPolicy on this resource to stop that, and
                 nothing in the diff you are reading says which kind of
                 property you just touched.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Change sets are the answer to "we did not know it would do that"',
      md: '**Change sets reveal a Replace before it happens** — that is what they are for, and a stem describing an update that must be reviewed before it is applied is asking for one by name. Pair it with the line from the previous block: `DeletionPolicy: Retain` (or `Snapshot`) on a database is **the answer to "deleting the stack must not destroy the data"**. The change set is what tells you; the deletion policy is what saves you when nobody looked.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'And the failure everyone meets on their first stack',
      md: '**A failed create rolls back and deletes everything by default**, which means the resource whose error message you needed is gone by the time you go looking for it. **Disabling rollback is how you keep the resources to debug them** — the one time the answer to a CloudFormation question is to turn a safety feature off. Two more that get asked as one-liners: **drift detection** for "someone modified our resources outside the template", and `CreationPolicy` plus `cfn-signal` for a stack that must wait until the application is genuinely ready rather than merely launched.',
    },

    /* ── 5. The same engine, with less to type ────────────────────────────── */
    { kind: 'heading', text: 'SAM is not a different tool' },
    {
      kind: 'diagram',
      spec: {
        id: 'tas-sam-transform',
        title: 'What the transform line does',
        caption:
          'Five lines of SAM and a hundred of CloudFormation deploy the same stack, because they are the same stack. SAM is a transform, so the second box is where every SAM template ends up.',
        // A plain chain at rows 3: no fan, because there is no fork here —
        // the whole point is that there is only one destination.
        cols: 21,
        rows: 3,
        nodes: [
          {
            id: 'sam',
            label: 'AWS SAM',
            sub: 'AWS::Serverless::Function',
            kind: 'service',
            category: 'devtools',
            x: 0.2,
            y: 1.4,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'cloudformation',
            label: 'CloudFormation',
            sub: 'the transform expands it',
            kind: 'service',
            category: 'mgmt',
            x: 5.6,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'expanded',
            label: 'A function, a role',
            sub: 'a log group, a permission',
            kind: 'note',
            x: 11,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'stack',
            label: 'One stack',
            sub: 'exactly as before',
            kind: 'note',
            x: 16.6,
            y: 1.4,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'x1', from: 'sam', to: 'cloudformation', label: 'Transform', tone: 'info' },
          {
            id: 'x2',
            from: 'cloudformation',
            to: 'expanded',
            label: 'expands to',
            tone: 'default',
          },
          { id: 'x3', from: 'expanded', to: 'stack', tone: 'ok' },
        ],
        groups: [],
        steps: [],
      },
    },
    {
      kind: 'code',
      lang: 'yaml',
      caption: 'The header is the whole trick, and leaving it out is the classic error',
      code: `Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 10
    MemorySize: 512

Resources:
  CreateOrder:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      AutoPublishAlias: live
      DeploymentPreference:
        Type: Canary10Percent5Minutes
        Alarms:
          - !Ref ErrorRateAlarm`,
    },
    {
      kind: 'steps',
      title: 'Four lines, four things worth knowing cold',
      items: [
        {
          title: 'Transform: AWS::Serverless-2016-10-31 is required',
          md: '**SAM templates *are* CloudFormation templates**; the `Transform` line is what makes them valid. Forgetting it is the classic error, and the symptom is an unhelpful complaint about an unknown resource type rather than anything mentioning SAM.',
        },
        {
          title: 'Globals is where the repetition goes',
          md: 'Shared defaults — runtime, memory, timeout — across every function in the template. It exists for the same reason the rest of SAM does: the shape of that boilerplate is identical every time.',
        },
        {
          title: 'AWS::Serverless::Function expands into dozens of raw resources',
          md: 'Along with `::Api`, `::HttpApi`, `::StateMachine` and `::SimpleTable`. Describing one [[lambda|Lambda]] function properly in raw CloudFormation takes a function, a role, a log group, a permission and several [[api-gateway|API Gateway]] resources. That is the compression, and it is the entire reason SAM exists.',
        },
        {
          title: 'AutoPublishAlias plus DeploymentPreference is the canary',
          md: 'That pair **is how SAM gives you canary Lambda deployments with automatic rollback on a CloudWatch alarm**. The three preference types are `Canary10Percent5Minutes`, `Linear10PercentEvery1Minute` and `AllAtOnce`, with alarms and hooks. When a stem says "gradually shift traffic to the new version" and "roll back automatically if errors rise", this is the serverless spelling of it.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'ok',
      title: 'The other half of SAM is the CLI, and it is examined separately',
      md: '`sam init` · `sam build` · `sam local invoke` · `sam local start-api` · `sam deploy` · `sam logs` · `sam sync`. Two of those are answers to specific stems: `sam local start-api` **emulates API Gateway locally** — the answer to "test the API before deploying" — and **SAM Accelerate** (`sam sync`) **shortens the inner development loop** by skipping full CloudFormation deploys. Both need **Docker** on your machine, which is the prerequisite a question will occasionally make the deciding detail.',
    },

    /* ── 6. Compare, last ─────────────────────────────────────────────────── */
    {
      kind: 'compare',
      title: 'The sentence in the stem, and the line it is asking for',
      columns: ['What it is asking for', 'The plausible answer that is not it'],
      rows: [
        {
          label: '“Deleting the stack must not destroy the data”',
          cells: [
            'DeletionPolicy: Retain, or Snapshot',
            'A backup taken by the pipeline, which does not stop the delete',
          ],
        },
        {
          label: '“We must review the effect before applying it”',
          cells: [
            'A change set',
            'Reading the template diff, which does not say what will be replaced',
          ],
        },
        {
          label: '“Deploy this to every account and Region”',
          cells: ['StackSets', 'A pipeline stage per account, hand-maintained'],
        },
        {
          label: '“Someone modified our resources outside the template”',
          cells: [
            'Drift detection',
            'Re-deploying the template, which hides the difference rather than reporting it',
          ],
        },
        {
          label: '“The stack must wait until the app is genuinely ready”',
          cells: [
            'CreationPolicy plus cfn-signal',
            'A longer timeout, which waits without checking anything',
          ],
        },
        {
          label: '“Test the API before we deploy it”',
          cells: ['sam local start-api', 'A dev stage in the account, which is a deploy'],
        },
        {
          label: '“We want to write infrastructure in TypeScript”',
          cells: [
            'CDK, which synthesises CloudFormation — same engine',
            'SAM, which is concise YAML specialised for serverless',
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
        {
          label: 'Change sets',
          value: 'Preview the effect of an update before applying it',
        },
        { label: 'Nested stacks', value: 'Reuse common components as child stacks' },
        {
          label: 'Helper scripts',
          value: 'cfn-init, cfn-signal, cfn-hup with CreationPolicy and WaitCondition',
        },
        {
          label: 'SAM transform header',
          value: 'Transform: AWS::Serverless-2016-10-31 — required',
        },
        {
          label: 'SAM CLI commands',
          value:
            'sam init · sam build · sam local invoke · sam local start-api · sam deploy · sam logs · sam sync',
        },
        {
          label: 'SAM deployment preferences',
          value:
            'Canary10Percent5Minutes, Linear10PercentEvery1Minute, AllAtOnce — with alarms and hooks',
        },
        { label: 'SAM local requirement', value: 'Docker' },
      ],
    },

    /* ── 8. Next ──────────────────────────────────────────────────────────── */
    { kind: 'services', title: 'Where these facts live', slugs: ['cloudformation', 'sam'] },
    {
      kind: 'prose',
      md: 'Two neighbours this lesson kept at arm’s length. [[cdk]] is TypeScript, Python or Java that *synthesises* CloudFormation templates — same engine, better authoring experience — so every stack fact above survives the switch unchanged. [[elastic-beanstalk|Elastic Beanstalk]] is the opposite trade: an opinionated application platform rather than arbitrary infrastructure, which is why a question that says "any resource" or "our own network" is never answered by it.',
    },
  ],

  checks: [
    {
      id: 'templates-and-stacks-deletion',
      prompt:
        'A stack contains an RDS database. The team needs to be able to delete the stack when the project ends without losing the data. What goes in the template?',
      options: [
        {
          text: 'DeletionPolicy: Retain (or Snapshot) on the database resource',
          correct: true,
          why: 'This is the attribute that decouples the resource’s fate from the stack’s. Retain leaves it in place; Snapshot takes one on the way out. It is asked close to verbatim on both papers.',
        },
        {
          text: 'A stack policy denying Delete on the database resource',
          correct: false,
          why: 'A stack policy protects resources during *updates*. It is not what decides what happens when the stack itself is deleted.',
        },
        {
          text: 'Move the database into a nested stack so the parent delete does not reach it',
          correct: false,
          why: 'A nested stack is still owned by its parent, and deleting the parent deletes the child. Nested stacks are for reusing common components, not for shielding resources.',
        },
      ],
    },
    {
      id: 'templates-and-stacks-rollback',
      prompt:
        'A stack creation fails on the last resource. By the time an engineer looks, every resource is gone and there is nothing to inspect. What lets them investigate next time?',
      options: [
        {
          text: 'Disable rollback for the create, so the resources stay behind after the failure',
          correct: true,
          why: 'A failed create rolls back and deletes everything by default. Disabling rollback is the documented way to keep the failed resources long enough to read their state.',
        },
        {
          text: 'Enable drift detection on the stack before deploying it',
          correct: false,
          why: 'Drift detection compares live resources against the template. It answers "someone changed this by hand", not "the create failed and I need the wreckage".',
        },
        {
          text: 'Create a change set first, which will show why the resource fails',
          correct: false,
          why: 'A change set previews what an update will do to which resources. It cannot predict a runtime failure inside a resource that has not been created yet.',
        },
      ],
    },
    {
      id: 'templates-and-stacks-transform',
      prompt:
        'A template declaring AWS::Serverless::Function is rejected with a complaint about an unrecognised resource type. What is missing?',
      options: [
        {
          text: 'The Transform: AWS::Serverless-2016-10-31 header',
          correct: true,
          why: 'SAM templates are CloudFormation templates, and the Transform line is what makes the serverless resource types valid. Forgetting it is the classic SAM error.',
        },
        {
          text: 'The SAM CLI, which must be used instead of the CloudFormation console to deploy',
          correct: false,
          why: 'The CLI is a convenience for building, local testing and deploying. It is not what makes the resource type resolve — the transform is.',
        },
        {
          text: 'A Globals section declaring the runtime for every function',
          correct: false,
          why: 'Globals removes repetition between functions. Its absence means more typing, not an invalid template.',
        },
      ],
    },
    {
      id: 'templates-and-stacks-stacksets',
      prompt:
        'A security baseline must be deployed identically into forty accounts across three Regions, and kept in step as it changes. What is the answer?',
      options: [
        {
          text: 'StackSets, which deploy the same template across many accounts and Regions',
          correct: true,
          why: 'This is exactly the phrase StackSets answers, and the giveaway is "every account and Region" rather than any detail of what the template contains.',
        },
        {
          text: 'A nested stack per account, referenced from one parent template',
          correct: false,
          why: 'Nested stacks reuse components within one stack in one account. They do not cross an account or a Region boundary.',
        },
        {
          text: 'Export the baseline as Outputs and !ImportValue it from each account',
          correct: false,
          why: 'Cross-stack references work between stacks in the same account and Region, and they share a value rather than deploying resources.',
        },
      ],
    },
  ],
}
