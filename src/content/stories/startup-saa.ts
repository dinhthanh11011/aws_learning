import type { Story } from '../schema'

/**
 * One founder, one product, thirteen sittings — from an email address and a
 * credit card to a design that survives losing a Region.
 *
 * The rule this file is written to: **every chapter's `pain` is caused by the
 * previous chapter's design.** That is the difference between a story and a
 * syllabus. If a chapter could be moved without the prose breaking, it has not
 * earned its place and should be merged or cut.
 *
 * The architecture below is declared once, complete. Chapters reveal parts of
 * it and none of them redefines it, so a node cannot drift two grid units
 * sideways between chapter 8 and chapter 9 — the learner watches the system grow
 * rather than jump. `visibleAt()` in `src/engines/story/cumulative.ts` does the
 * fold; `content:check` fails a chapter that adds an id this spec does not have,
 * and fails an id here that no chapter ever introduces.
 *
 * Group boxes are laid out from the *whole* spec, not from what is currently
 * visible. That is deliberate: the Region rectangle is the same size in chapter
 * 4 as in chapter 13, so revealing a node inside it never resizes it. A box that
 * grew as content appeared would undo the one thing this shape exists to give.
 *
 * Node ids are service slugs, optionally suffixed where a real system shows the
 * same service twice (`ec2-a`, `ec2-b`) — see `serviceSlugForNode`.
 */
export const startupSaa: Story = {
  slug: 'startup-saa',
  title: 'Building a startup on AWS',
  premise:
    'You and two friends are building a photo-sharing product. Today it runs on a laptop. By the end it serves users on three continents, survives losing a data centre, and costs roughly what you expected. Every chapter opens with something that has just gone wrong — and the thing that went wrong is always a consequence of the last chapter’s design.',
  families: ['saa'],
  architecture: {
    id: 'startup-arch',
    title: 'The system, once it is finished',
    caption:
      'Everything the thirteen chapters build. Each chapter highlights only what it added; earlier work settles back but stays where it was.',
    cols: 16,
    rows: 18,
    nodes: [
      // ── Governance. Top-left, deliberately out of the request path.
      {
        id: 'organizations',
        label: 'Organizations',
        sub: 'accounts + SCPs',
        kind: 'service',
        category: 'security',
        x: 0.5,
        y: 0.4,
        w: 3,
        h: 1.2,
      },
      {
        id: 'iam',
        label: 'IAM',
        sub: 'roles, MFA',
        kind: 'service',
        category: 'security',
        x: 0.5,
        y: 2.3,
        w: 3,
        h: 1.2,
      },

      // ── The user, and the edge that answers before any Region does.
      {
        id: 'user',
        label: 'Users',
        sub: 'three continents',
        kind: 'user',
        x: 7,
        y: 0.4,
        w: 2.6,
        h: 1.2,
      },
      {
        id: 'route53',
        label: 'Route 53',
        sub: 'DNS + failover',
        kind: 'service',
        category: 'network',
        x: 5.5,
        y: 2.3,
        w: 3.2,
        h: 1.2,
      },
      {
        id: 'cloudfront',
        label: 'CloudFront',
        sub: 'edge cache',
        kind: 'service',
        category: 'network',
        x: 9.5,
        y: 2.3,
        w: 3.2,
        h: 1.2,
      },

      // ── Regional, but outside the VPC.
      {
        id: 's3',
        label: 'S3',
        sub: 'uploads',
        kind: 'service',
        category: 'storage',
        x: 0.5,
        y: 8.2,
        w: 2.6,
        h: 1.2,
      },
      {
        id: 'sqs',
        label: 'SQS',
        sub: 'the buffer',
        kind: 'service',
        category: 'appint',
        x: 0.5,
        y: 10.8,
        w: 2.6,
        h: 1.2,
      },
      {
        id: 'lambda',
        label: 'Lambda',
        sub: 'the worker',
        kind: 'service',
        category: 'serverless',
        x: 0.5,
        y: 13.2,
        w: 2.6,
        h: 1.2,
      },

      // ── The VPC: load balancer and NAT on top, two AZs beneath.
      {
        id: 'elb',
        label: 'ALB',
        sub: 'health checks',
        kind: 'service',
        category: 'network',
        x: 5.5,
        y: 5.7,
        w: 3.2,
        h: 1.2,
      },
      {
        id: 'nat-gateway',
        label: 'NAT gateway',
        kind: 'service',
        category: 'network',
        x: 10.5,
        y: 5.7,
        w: 3.2,
        h: 1.2,
      },

      {
        id: 'ec2-a',
        label: 'EC2',
        sub: 'AZ a',
        kind: 'service',
        category: 'compute',
        x: 5.2,
        y: 8.5,
        w: 2.6,
        h: 1.2,
      },
      {
        id: 'ec2-b',
        label: 'EC2',
        sub: 'AZ b',
        kind: 'service',
        category: 'compute',
        x: 9,
        y: 8.5,
        w: 2.6,
        h: 1.2,
      },
      {
        id: 'ec2-auto-scaling',
        label: 'Auto Scaling',
        sub: 'replaces the dead',
        kind: 'service',
        category: 'compute',
        x: 12.6,
        y: 8.5,
        w: 3,
        h: 1.2,
      },

      {
        id: 'rds',
        label: 'RDS',
        sub: 'primary, AZ a',
        kind: 'service',
        category: 'database',
        x: 5.2,
        y: 11.1,
        w: 2.6,
        h: 1.2,
      },
      {
        id: 'rds-standby',
        label: 'RDS',
        sub: 'standby, AZ b',
        kind: 'service',
        category: 'database',
        x: 9,
        y: 11.1,
        w: 2.6,
        h: 1.2,
      },
      {
        id: 'elasticache',
        label: 'ElastiCache',
        sub: 'sessions + reads',
        kind: 'service',
        category: 'database',
        x: 12.6,
        y: 11.1,
        w: 3,
        h: 1.2,
      },

      // ── Cross-cutting. Along the bottom: they touch everything and sit in no
      //    request path, which is exactly how the big picture draws them too.
      {
        id: 'cloudwatch',
        label: 'CloudWatch',
        sub: 'logs + alarms',
        kind: 'service',
        category: 'mgmt',
        x: 5.2,
        y: 16.2,
        w: 3,
        h: 1.2,
      },
      {
        id: 'cloudtrail',
        label: 'CloudTrail',
        sub: 'who did it',
        kind: 'service',
        category: 'mgmt',
        x: 8.6,
        y: 16.2,
        w: 3,
        h: 1.2,
      },
      {
        id: 'budgets',
        label: 'Budgets',
        sub: 'tell me early',
        kind: 'service',
        category: 'cost',
        x: 12,
        y: 16.2,
        w: 3,
        h: 1.2,
      },

      // ── The second Region. Bottom-left, clear of Region 1's rectangle.
      {
        id: 's3-dr',
        label: 'S3',
        sub: 'replica',
        kind: 'service',
        category: 'storage',
        x: 0.5,
        y: 16.2,
        w: 2.6,
        h: 1.2,
      },
    ],
    edges: [
      { id: 'e-user-r53', from: 'user', to: 'route53', tone: 'default' },
      { id: 'e-r53-cf', from: 'route53', to: 'cloudfront', tone: 'default' },
      { id: 'e-cf-elb', from: 'cloudfront', to: 'elb', tone: 'default' },
      { id: 'e-r53-elb', from: 'route53', to: 'elb', tone: 'default' },
      { id: 'e-elb-a', from: 'elb', to: 'ec2-a', tone: 'default' },
      { id: 'e-elb-b', from: 'elb', to: 'ec2-b', tone: 'default' },
      { id: 'e-asg-b', from: 'ec2-auto-scaling', to: 'ec2-b', dashed: true, tone: 'info' },
      { id: 'e-a-rds', from: 'ec2-a', to: 'rds', tone: 'default' },
      {
        id: 'e-rds-standby',
        from: 'rds',
        to: 'rds-standby',
        label: 'sync',
        dashed: true,
        tone: 'ok',
      },
      { id: 'e-a-cache', from: 'ec2-a', to: 'elasticache', tone: 'default' },
      { id: 'e-a-nat', from: 'ec2-a', to: 'nat-gateway', dashed: true, tone: 'warn' },
      { id: 'e-a-s3', from: 'ec2-a', to: 's3', tone: 'default' },
      { id: 'e-s3-sqs', from: 's3', to: 'sqs', tone: 'default' },
      { id: 'e-sqs-lambda', from: 'sqs', to: 'lambda', tone: 'default' },
      { id: 'e-s3-dr', from: 's3', to: 's3-dr', label: 'replicate', dashed: true, tone: 'ok' },
    ],
    groups: [
      {
        id: 'g-account',
        label: 'Management account',
        kind: 'account',
        nodeIds: ['organizations', 'iam'],
      },
      {
        id: 'g-edge',
        label: 'Edge — belongs to no Region',
        kind: 'edge',
        nodeIds: ['route53', 'cloudfront'],
      },
      {
        id: 'g-region',
        label: 'Region 1 — ap-southeast-1',
        kind: 'region',
        nodeIds: ['s3', 'sqs', 'lambda'],
      },
      {
        id: 'g-vpc',
        label: 'VPC 10.0.0.0/16',
        kind: 'vpc',
        nodeIds: ['ec2-auto-scaling', 'elasticache'],
        parent: 'g-region',
      },
      {
        id: 'g-public',
        label: 'Public subnets',
        kind: 'subnet-public',
        nodeIds: ['elb', 'nat-gateway'],
        parent: 'g-vpc',
      },
      { id: 'g-az-a', label: 'Availability Zone a', kind: 'az', nodeIds: [], parent: 'g-vpc' },
      { id: 'g-az-b', label: 'Availability Zone b', kind: 'az', nodeIds: [], parent: 'g-vpc' },
      {
        id: 'g-priv-a',
        label: 'Private subnet a',
        kind: 'subnet-private',
        nodeIds: ['ec2-a', 'rds'],
        parent: 'g-az-a',
      },
      {
        id: 'g-priv-b',
        label: 'Private subnet b',
        kind: 'subnet-private',
        nodeIds: ['ec2-b', 'rds-standby'],
        parent: 'g-az-b',
      },
      { id: 'g-region-2', label: 'Region 2 — ap-northeast-1', kind: 'region', nodeIds: ['s3-dr'] },
    ],
    steps: [],
  },
  chapters: [
    {
      id: 'startup-saa-c1',
      title: 'The account',
      pain: 'You signed up with your personal email and a card. That one login can now delete every resource you will ever create and spend without limit — and there is no second one to take it away.',
      minutes: 25,
      taskId: 'saa-1.1',
      serviceSlugs: ['iam', 'budgets'],
      conceptSlugs: ['least-privilege'],
      adds: { nodeIds: ['iam'], edgeIds: [], groupIds: ['g-account'] },
      decision: {
        situation:
          'It is day one. There is an AWS account, one set of credentials, and three of you who need to work in it. Your co-founder asks you to send them the password.',
        prompt: 'What do you set up before anyone does any work?',
        options: [
          {
            slug: 'iam',
            correct: true,
            why: 'Right. Each person gets their own identity, so access can be granted and revoked per person and an audit trail can name who did what. The root login gets MFA and then goes in a drawer.',
          },
          {
            slug: 'organizations',
            correct: false,
            why: 'Not yet — and this is a good instinct arriving early. Separate accounts are the answer to *teams damaging each other*, which is chapter 8. With three people in one product you do not have that problem yet, and you would be building a management structure around nothing.',
          },
          {
            slug: 'cloudtrail',
            correct: false,
            why: 'A recording of who did what is essential, but it answers questions after the fact. It does not stop the shared login existing, and a log of "root deleted the database" is not the control you needed.',
          },
          {
            slug: 'secrets-manager',
            correct: false,
            why: 'This stores secrets an application uses — database passwords, API keys. Human sign-in is a different problem, and putting the shared root password in a vault still leaves one shared identity.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'The account you signed up with is the **root user**. It is not an administrator that happens to be powerful — it is the owner, and a handful of things (closing the account, changing the support plan) can only ever be done by it. It cannot be restricted by any policy, because there is nothing above it to write one.',
        },
        {
          kind: 'prose',
          md: 'So the first job is to stop using it. Turn on MFA, create a separate identity for yourself with administrative permissions, and sign in as that from then on. This is the one piece of setup where the *reason* is not security theatre: a shared credential cannot be revoked for one person, and it cannot be attributed to one person either.',
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'The trap the exam builds on this',
          md: 'A question that says "the company wants to restrict what the root user can do" is looking for an answer above the account — a service control policy from [[organizations]]. Inside a single account, nothing constrains root. An IAM policy attached to root is not the answer, and a permissions boundary is not either.',
        },
        {
          kind: 'steps',
          title: 'What you actually do, in order',
          items: [
            {
              title: 'MFA on root',
              md: 'Then stop using it. Write down where the MFA device lives, because you will need root again roughly once a year.',
            },
            {
              title: 'An admin identity for each person',
              md: 'Named after the person, never after the role. `alice`, not `admin2`.',
            },
            {
              title: 'A budget alarm',
              md: 'Set it at a number that would annoy you — ten dollars is fine. [[budgets]] exists so that a mistake stops being invisible, and the thing that stops people practising in a real account is not the cost, it is the not knowing.',
            },
          ],
        },
      ],
      checks: [
        {
          id: 'startup-saa-c1-k1',
          prompt: 'Why is a shared login worse than two logins with identical permissions?',
          options: [
            {
              text: 'It cannot be revoked for one person, and no action can be attributed to one person.',
              correct: true,
              why: 'Both halves matter. Revocation and attribution are the two things identity buys you, and a shared credential gives up both.',
            },
            {
              text: 'Shared logins are slower to authenticate.',
              correct: false,
              why: 'There is no performance difference. The cost is entirely in control and accountability.',
            },
            {
              text: 'AWS charges per sign-in.',
              correct: false,
              why: 'IAM identities and sign-ins are free. Cost is never the argument here.',
            },
          ],
        },
        {
          id: 'startup-saa-c1-k2',
          prompt: 'What can the root user do that an administrator identity cannot?',
          options: [
            {
              text: 'Close the account and change the support plan — a short list only root can perform.',
              correct: true,
              why: 'That short list is the whole reason root still exists after you stop using it day to day.',
            },
            {
              text: 'Nothing — an administrator policy is equivalent.',
              correct: false,
              why: 'A common and expensive assumption. Some account-level operations are reserved for root regardless of policy.',
            },
            {
              text: 'Only root can create IAM users.',
              correct: false,
              why: 'Any identity with the right permissions can create IAM users.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c2',
      title: 'Where in the world',
      pain: 'Your first fifty users are in Vietnam. Your test instance is in Virginia, because that was the box already selected when you clicked Launch. Every tap in the app waits about a third of a second before anything happens — and your lawyer has just asked where the photos are physically stored.',
      minutes: 25,
      taskId: 'saa-1.2',
      serviceSlugs: ['global-infrastructure'],
      conceptSlugs: ['region', 'availability-zone', 'edge-location'],
      adds: { nodeIds: [], edgeIds: [], groupIds: [] },
      decision: {
        situation:
          'You need to pick where this runs. Users are in Vietnam, the team is in Vietnam, and there is a written requirement that user photos stay in South-East Asia.',
        prompt: 'What decides the answer here?',
        options: [
          {
            slug: 'region',
            correct: true,
            why: 'Right. A Region is the unit of both latency and legal geography, and it is the choice everything else inherits. Pick ap-southeast-1 and the residency requirement is satisfied by construction rather than by policy.',
          },
          {
            slug: 'edge-location',
            correct: false,
            why: 'Tempting, and it will genuinely help later — but an edge location caches content, it does not run your workload or store your database. You cannot satisfy "the data lives in South-East Asia" by putting a cache there, and you cannot launch an instance at one.',
          },
          {
            slug: 'availability-zone',
            correct: false,
            why: 'An AZ is a choice *inside* a Region, and it answers "does this survive a data centre failing", not "where in the world is this". Picking AZs before picking a Region is picking a room before picking a city.',
          },
          {
            slug: 'cloudfront',
            correct: false,
            why: 'A CDN is the right shape of answer for the latency half and does nothing for the residency half. It also cannot be configured until there is an origin to put behind it.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'This chapter builds nothing. That is the point: the Region is a decision, and it is the one decision that is genuinely expensive to change later, because almost every resource you create lives in exactly one Region and cannot be moved — only copied.',
        },
        {
          kind: 'prose',
          md: 'Two forces pick it for you and they sometimes disagree. **Latency** is physics: light takes roughly 70 ms to cross the Pacific and come back, and no amount of money makes Virginia feel close to Hanoi. **Residency** is law: a growing list of countries require their citizens’ data to stay inside their borders. When the two disagree, residency wins, because it is not negotiable.',
        },
        {
          kind: 'compare',
          title: 'The three levels, and what each one protects you from',
          columns: ['What it is', 'What it protects against', 'What it cannot do'],
          rows: [
            {
              label: 'Region',
              cells: [
                'A geographic area with several AZs',
                'A whole geography failing; a residency requirement',
                'Nothing crosses to another Region unless you configure and pay for it',
              ],
            },
            {
              label: 'Availability Zone',
              cells: [
                'One isolated set of data centres in a Region',
                'A building, a flood, a power event',
                'Cannot survive the Region itself going dark',
              ],
            },
            {
              label: 'Edge location',
              cells: [
                'A cache in a city, in no Region',
                'Distance, for content that is cacheable',
                'Cannot run your code or hold your database',
              ],
            },
          ],
        },
        {
          kind: 'callout',
          tone: 'info',
          title: 'The short list worth memorising',
          md: 'Almost everything is Regional. The exceptions are IAM, [[route53]], [[cloudfront]] and [[organizations]] — global, one namespace, no Region to pick. Knowing that list is reliably worth a mark, because a question that says "deploy it in every Region" is wrong the moment the service is one of these.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c2-k1',
          prompt:
            'A requirement says the workload must survive an entire Region becoming unavailable. What does Multi-AZ give you?',
          options: [
            {
              text: 'Nothing for that requirement — AZs are inside one Region.',
              correct: true,
              why: 'Exactly, and this is the single most reliably tested confusion on the paper. Multi-AZ is the distractor whenever the stem says "Region".',
            },
            {
              text: 'Full protection, since AZs are physically separate.',
              correct: false,
              why: 'They are separate buildings, but they are all in the same Region. Losing the Region loses all of them.',
            },
            {
              text: 'Partial protection, degrading to read-only.',
              correct: false,
              why: 'There is no such intermediate behaviour. The Region is the boundary.',
            },
          ],
        },
        {
          id: 'startup-saa-c2-k2',
          prompt:
            'Why is "nothing replicates between Regions unless you configure it" a deliberate design rather than a limitation?',
          options: [
            {
              text: 'Silent cross-Region copying would break every data-residency promise.',
              correct: true,
              why: 'Isolation is the only default that can honestly support a residency guarantee.',
            },
            {
              text: 'Cross-Region networking is technically impossible.',
              correct: false,
              why: 'It is entirely possible — replication, peering and global tables all do it. It is opt-in, not unavailable.',
            },
            {
              text: 'AWS has not built the feature yet.',
              correct: false,
              why: 'The features exist. The default is a choice.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c3',
      title: 'One box',
      pain: 'The Region is chosen, so you launch an instance in it and ship. Everything is on that one machine: the web app, the uploaded photos, and the database. It works, and it has a public IP address, and so does the database listening on port 5432.',
      minutes: 30,
      taskId: 'saa-3.1',
      serviceSlugs: ['ec2', 'ebs', 'security-group'],
      conceptSlugs: ['private-vs-public-ip', 'stateful-filtering', 'scaling-up-vs-out'],
      adds: { nodeIds: ['user', 'ec2-a'], edgeIds: [], groupIds: [] },
      decision: {
        situation:
          'The instance is running and serving traffic. Restarting it to resize loses nothing you care about — except the photos and the database, which are on its disk. You want the disk to outlive the machine.',
        prompt: 'What gives the data a life independent of the instance?',
        options: [
          {
            slug: 'ebs',
            correct: true,
            why: 'Right. An EBS volume is a separate resource that happens to be attached. Terminate the instance and, if you asked it to, the volume survives — which is what makes the instance disposable and therefore replaceable.',
          },
          {
            slug: 's3',
            correct: false,
            why: 'This is where the photos will end up, in chapter 7, and it is the better answer for files. But it is not a disk: your database cannot run on it, and the application as written expects a filesystem.',
          },
          {
            slug: 'efs',
            correct: false,
            why: 'A shared filesystem several instances can mount at once — a real answer to a problem you do not have yet, since there is exactly one instance. It also costs considerably more per gigabyte than EBS.',
          },
          {
            slug: 'instance-store',
            correct: false,
            why: 'This is precisely the thing to avoid: instance store is physically attached to the host and its contents are gone when the instance stops. Fast, free with the instance, and the wrong place for anything you want to keep.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'Renting a machine by the hour changes what a machine *is*. Before this, capacity was a purchase order and a three-year bet placed before you had users. Now it is a decision you can undo this afternoon — but only if nothing important lives inside the machine itself.',
        },
        {
          kind: 'prose',
          md: 'That is the whole reason to separate the disk from the instance now, while it is cheap to do. Every later chapter — replacing a dead box, running two boxes, scaling to five — assumes an instance is disposable. An instance that holds the only copy of your data is not disposable, and the architecture stops there.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'What is actually wrong with this design',
          md: 'Two things, and only one of them is obvious. The obvious one: the database accepts connections from the internet, because there is nowhere else to put it — that is chapter 4. The less obvious one: **there is one of everything.** One instance, one AZ, one disk. Nothing here survives a single failure, and no amount of tuning changes that.',
        },
        {
          kind: 'prose',
          md: 'A security group is your only real control at this point, and it is worth understanding why it is shaped the way it is. Rules name *other groups* rather than IP addresses, because under any kind of automatic replacement the addresses change constantly and a hand-maintained address list is wrong within a day. It is also **stateful**: allow a request out and the reply comes back automatically. Tracking return ports by hand is where hand-written firewall rules mostly go wrong.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c3-k1',
          prompt:
            'Why does a security group rule reference another security group instead of an IP range?',
          options: [
            {
              text: 'Because instances come and go, so an address list is wrong almost immediately.',
              correct: true,
              why: 'The rule stays true however many instances exist, which is what makes automatic scaling safe to turn on.',
            },
            {
              text: 'Because IP-based rules are not supported.',
              correct: false,
              why: 'CIDR rules are fully supported and often correct — for a fixed office range, for example.',
            },
            {
              text: 'Because group references are evaluated faster.',
              correct: false,
              why: 'Performance is not the motivation.',
            },
          ],
        },
        {
          id: 'startup-saa-c3-k2',
          prompt: 'What does "stateful" mean for a security group?',
          options: [
            {
              text: 'Return traffic for an allowed connection is permitted automatically.',
              correct: true,
              why: 'Which is exactly why you never write ephemeral-port rules for a security group — and exactly why you must for a NACL.',
            },
            {
              text: 'It remembers which instances were attached to it.',
              correct: false,
              why: 'Attachment is not what "stateful" describes here.',
            },
            {
              text: 'Its rules persist across an instance restart.',
              correct: false,
              why: 'True but trivial, and not what the term means.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c4',
      title: 'The private half',
      pain: 'A security researcher emails you: your database is answering on the public internet. You did not open it deliberately — the instance has one network interface with a public address, and everything on that machine shares it. There is nowhere private to move the database to.',
      minutes: 45,
      taskId: 'saa-1.2',
      serviceSlugs: ['vpc', 'nat-gateway', 'nacl'],
      conceptSlugs: ['cidr', 'subnet', 'route-table', 'internet-gateway', 'nat'],
      adds: {
        nodeIds: ['nat-gateway'],
        edgeIds: ['e-a-nat'],
        groupIds: ['g-region', 'g-vpc', 'g-public', 'g-az-a', 'g-priv-a'],
      },
      decision: {
        situation:
          'You want the web tier reachable and the database not reachable, on machines that still need to download operating-system patches from the internet.',
        prompt: 'What actually makes a subnet private?',
        options: [
          {
            slug: 'route-table',
            correct: true,
            why: 'Right, and it is the single most useful fact in the networking domain. A subnet is public because its route table sends 0.0.0.0/0 to an internet gateway. Remove that route and the same subnet is private. Nothing else — no flag, no setting, no name — decides it.',
          },
          {
            slug: 'security-group',
            correct: false,
            why: 'A security group filters what reaches an instance, but the instance is still in a subnet with a path to the internet, and the group is owned by whoever launches the instance. Filtering is not the same as being unreachable.',
          },
          {
            slug: 'nacl',
            correct: false,
            why: 'A subnet-level backstop, and genuinely useful as a second layer owned by the network administrator rather than the workload owner. But a NACL denying traffic on a subnet that still routes to an internet gateway is a filter in front of a door, not a wall.',
          },
          {
            slug: 'nat-gateway',
            correct: false,
            why: 'This is how a private subnet reaches *out*, which is the second half of this chapter. It is a consequence of the subnet being private, not the cause of it.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'A VPC is your own network, not just hosts on somebody else’s. That is what gives you somewhere to put a machine that has no internet presence at all — which the previous chapter had no way to express.',
        },
        {
          kind: 'numbers',
          title: 'The arithmetic you will be asked to do from memory',
          items: [
            {
              label: 'A /16',
              value: '65,536 addresses',
              note: 'The conventional VPC size. 10.0.0.0/16 covers 10.0.0.0 to 10.0.255.255.',
            },
            {
              label: 'A /24',
              value: '256 addresses',
              note: 'The conventional subnet size — 10.0.1.0/24. A /16 splits into 256 of these.',
            },
            {
              label: 'Usable in a /24',
              value: '251',
              note: 'AWS reserves five per subnet: network, VPC router, DNS, future use, and broadcast.',
            },
            {
              label: 'Smallest and largest subnet',
              value: '/28 and /16',
              note: 'A /28 gives you 11 usable addresses. Smaller is rejected.',
            },
          ],
        },
        {
          kind: 'prose',
          md: 'Now the second half. A private instance still has to fetch patches, and the obvious fix — give it a public address — is exactly what you just spent the chapter undoing. A [[nat-gateway]] exists to make *outbound* and *inbound* separable: connections can start from inside and never from outside.',
        },
        {
          kind: 'callout',
          tone: 'money',
          title: 'Where this quietly costs you',
          md: 'A NAT gateway is charged per hour **and** per gigabyte processed. It is a real fleet of managed machines, not a routing rule, which is why it shows up as the surprise line on so many first bills. One per AZ is both safer and usually cheaper than one shared, because a shared one means an AZ failure kills egress everywhere — and every packet crossing an AZ boundary is billed on top.',
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'Two traps that live here',
          md: 'First: a NACL is **stateless**, so allowing a request out does not allow the reply back — you need the ephemeral port range too. This is the most-tested NACL mistake. Second: overlapping CIDR blocks are why two VPCs cannot be peered, and the stem will mention the ranges a sentence before it asks.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c4-k1',
          prompt:
            'An instance in a private subnet times out reaching the internet, with no error message. What do you check first?',
          options: [
            {
              text: 'Whether the route table has a 0.0.0.0/0 route to a NAT gateway that still exists.',
              correct: true,
              why: 'A deleted NAT gateway leaves a blackhole route, and a missing route gives silent timeouts rather than a refusal. Silence points at routing.',
            },
            {
              text: 'Whether the security group allows outbound traffic.',
              correct: false,
              why: 'Worth checking, but security groups allow all outbound by default, so this is rarely it.',
            },
            {
              text: 'Whether the instance has a public IP.',
              correct: false,
              why: 'It deliberately does not — that is what makes the subnet private.',
            },
          ],
        },
        {
          id: 'startup-saa-c4-k2',
          prompt: 'How many usable addresses are in a /26?',
          options: [
            {
              text: '59',
              correct: true,
              why: '64 addresses minus the five AWS reserves in every subnet.',
            },
            {
              text: '64',
              correct: false,
              why: 'That is the total. AWS reserves five, so you never get all of them.',
            },
            {
              text: '62',
              correct: false,
              why: 'That is the answer for a traditional network reserving two. AWS reserves five.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c5',
      title: 'The box dies',
      pain: 'At 04:00 the instance stops responding. The AZ it was in had a power event. You are asleep, there is one instance, and the product is simply gone until you wake up and click Launch.',
      minutes: 45,
      taskId: 'saa-2.1',
      serviceSlugs: ['elb', 'ec2-auto-scaling'],
      conceptSlugs: ['high-availability-vs-fault-tolerance', 'failover', 'blast-radius'],
      adds: {
        nodeIds: ['elb', 'ec2-b', 'ec2-auto-scaling'],
        edgeIds: ['e-elb-a', 'e-elb-b', 'e-asg-b'],
        groupIds: ['g-az-b', 'g-priv-b'],
      },
      decision: {
        situation:
          'You want a second instance in a second AZ, and you want traffic to stop going to a dead one without you being awake.',
        prompt: 'Which component decides that an instance is dead and stops sending it traffic?',
        options: [
          {
            slug: 'elb',
            correct: true,
            why: 'Right. Health checks are what make a load balancer a resilience component rather than a traffic splitter — an unhealthy target is out of rotation before a user meets it. Spreading load is almost a side effect.',
          },
          {
            slug: 'ec2-auto-scaling',
            correct: false,
            why: 'Close, and you need it too — but it *replaces* the dead instance, which takes minutes. Something has to stop routing to it in seconds, and that is the load balancer. The two solve adjacent problems and the exam separates them on exactly this line.',
          },
          {
            slug: 'route53',
            correct: false,
            why: 'Route 53 health checks are real and do exactly this, but at DNS level and between Regions or endpoints — with a TTL in front of them. Inside one Region, in front of instances, the load balancer is the right layer.',
          },
          {
            slug: 'cloudwatch',
            correct: false,
            why: 'CloudWatch can observe that an instance is unhealthy and raise an alarm, but observing is not acting. It tells you; it does not reroute.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'Everything so far has had exactly one of each thing. This chapter is where that stops, and it is worth being precise about what you gain: not *fault tolerance*, which means no user notices, but **high availability**, which means the system recovers quickly without a human.',
        },
        {
          kind: 'steps',
          title: 'What has to be true for this to work',
          items: [
            {
              title: 'Two subnets in two AZs',
              md: 'Which chapter 4 already gave you. A load balancer needs targets in at least two AZs, and this is why the subnet layout came first.',
            },
            {
              title: 'A health check that tests the app, not the port',
              md: 'Checking that port 80 is open tells you the web server started, not that it can serve a page. Point it at a path that touches what matters.',
            },
            {
              title: 'A grace period longer than the boot',
              md: 'If the health check grace period expires while the application is still starting, the group kills the instance and launches another — forever. Instances launching in a loop is nearly always this.',
            },
          ],
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'The 503 that is not the load balancer',
          md: 'HTTP 503 from an ALB means it has no healthy targets. That is almost never a load balancer problem: it is a wrong health-check path, a security group that does not allow the balancer to reach the instance, or a grace period shorter than the boot time. The exam states one of those three in the stem.',
        },
        {
          kind: 'prose',
          md: 'Note what you did **not** fix. There are two web instances now, but still one database, and users are about to start getting logged out at random — because the thing that makes an instance disposable is that it holds no state, and yours still does. That is the next chapter, and it is caused entirely by this one.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c5-k1',
          prompt:
            'Instances in an Auto Scaling group launch, run for two minutes, get terminated, and launch again. Why?',
          options: [
            {
              text: 'The health check grace period is shorter than the application’s boot time.',
              correct: true,
              why: 'The group marks a still-booting instance unhealthy and replaces it, forever. The fix is the grace period, not the instance size.',
            },
            {
              text: 'The AZ is out of capacity.',
              correct: false,
              why: 'That would prevent launches, not terminate healthy-looking ones on a cycle.',
            },
            {
              text: 'The load balancer is misconfigured.',
              correct: false,
              why: 'The balancer would stop sending traffic, but it does not terminate instances — the scaling group does.',
            },
          ],
        },
        {
          id: 'startup-saa-c5-k2',
          prompt: 'What is the difference between high availability and fault tolerance?',
          options: [
            {
              text: 'HA recovers fast without a human; fault tolerance means no user notices at all.',
              correct: true,
              why: 'A stem asking for "no interruption to users" is asking for more than Multi-AZ with health checks.',
            },
            {
              text: 'They are two names for the same property.',
              correct: false,
              why: 'They differ by whether a request in flight is lost, which is exactly what a well-written stem turns on.',
            },
            {
              text: 'Fault tolerance applies only across Regions.',
              correct: false,
              why: 'It is about tolerating a failure without impact, at whatever scope, not about geography.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c6',
      title: 'State cannot scale',
      pain: 'Two instances now, and support is filling up with the same complaint: people are logged out at random. Half the requests land on the instance that has their session on disk and half do not. The database is also still a single process on one of the web servers.',
      minutes: 45,
      taskId: 'saa-3.2',
      serviceSlugs: ['rds', 'elasticache'],
      conceptSlugs: [
        'sticky-sessions',
        'multi-az-vs-multi-region',
        'eventual-vs-strong-consistency',
      ],
      adds: {
        nodeIds: ['rds', 'rds-standby', 'elasticache'],
        edgeIds: ['e-a-rds', 'e-rds-standby', 'e-a-cache'],
        groupIds: [],
      },
      decision: {
        situation:
          'Sessions live on each instance’s local disk, so a user’s next request only works if it lands on the same machine. You could pin each user to one instance, or you could move the session somewhere both instances can see.',
        prompt: 'What is the right fix?',
        options: [
          {
            slug: 'elasticache',
            correct: true,
            why: 'Right. Move the session out of the instance and both instances become interchangeable again — which is the property every later chapter depends on. It also gives you somewhere to cache reads, which is the highest-leverage optimisation in most systems.',
          },
          {
            slug: 'elb',
            correct: false,
            why: 'This is the sticky-sessions answer, and it works — which is what makes it the good distractor. But it fixes the symptom by making instances *not* interchangeable: now losing one instance logs out exactly the users pinned to it, and scaling in does the same. You have traded a bug for a worse design.',
          },
          {
            slug: 'dynamodb',
            correct: false,
            why: 'A genuinely common and correct session store in production, so this is not wrong so much as heavier than needed here — you would be adding a second database technology to solve a problem a cache solves, and you still need the cache for reads.',
          },
          {
            slug: 'efs',
            correct: false,
            why: 'A shared filesystem would let both instances see the same session files, and it would be slow, awkward and expensive for something read and written on every single request.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'The rule this chapter is really about: **an instance that holds state is not disposable, and everything after chapter 5 assumes disposability.** Sessions on local disk broke that quietly, and the database living on a web server breaks it loudly.',
        },
        {
          kind: 'prose',
          md: 'So the database moves to a managed service and gains a standby in the other AZ. Be precise about what Multi-AZ actually is: a **synchronous standby you cannot read from**, which exists for failover, not for capacity. If you need more read capacity, that is a read replica, and it is a different feature with different consistency.',
        },
        {
          kind: 'compare',
          title: 'Two things that look alike and are not',
          columns: ['Multi-AZ standby', 'Read replica'],
          rows: [
            {
              label: 'What it is for',
              cells: ['Surviving an AZ or instance failure', 'Serving more read traffic'],
            },
            { label: 'Can you read from it', cells: ['No', 'Yes — that is the point'] },
            { label: 'Replication', cells: ['Synchronous', 'Asynchronous, so it can lag'] },
            {
              label: 'Failover',
              cells: ['Automatic, DNS moves to the standby', 'Manual promotion'],
            },
          ],
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'Reads sent to the writer',
          md: 'Once there is a reader endpoint, sending read queries to the writer is a design error the exam tests directly. And when the symptom is "too many connections" under load, the answer is a connection pool — RDS Proxy — not more read replicas. More replicas does not reduce connections to the writer.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c6-k1',
          prompt: 'Why are sticky sessions a worse answer than an external session store?',
          options: [
            {
              text: 'They make instances non-interchangeable, so losing or scaling in an instance logs those users out.',
              correct: true,
              why: 'It fixes the symptom by giving up the property that makes the rest of the architecture work.',
            },
            {
              text: 'They are not supported by an Application Load Balancer.',
              correct: false,
              why: 'They are supported. Being available is what makes it a plausible wrong answer.',
            },
            {
              text: 'They require a public subnet.',
              correct: false,
              why: 'Unrelated to subnet placement.',
            },
          ],
        },
        {
          id: 'startup-saa-c6-k2',
          prompt:
            'A stem says reads are slow and asks for more read capacity. Multi-AZ is one option. Is it right?',
          options: [
            {
              text: 'No — the standby cannot be read from. That needs a read replica.',
              correct: true,
              why: 'Multi-AZ is about availability. Offering it for a read-capacity requirement is one of the paper’s standard traps.',
            },
            {
              text: 'Yes, the standby serves reads automatically.',
              correct: false,
              why: 'It does not. This is the misconception being tested.',
            },
            {
              text: 'Yes, but only for eventually consistent reads.',
              correct: false,
              why: 'The standby serves no reads at all, consistent or otherwise.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c7',
      title: 'The files',
      pain: 'The disk is 84% full of photos and climbing. Worse: a photo uploaded to instance A returns a broken image when the next request lands on instance B, because the file is on A’s volume and nowhere else.',
      minutes: 40,
      taskId: 'saa-3.3',
      serviceSlugs: ['s3'],
      conceptSlugs: ['durability-vs-availability', 'encryption-at-rest-vs-in-transit'],
      adds: { nodeIds: ['s3'], edgeIds: ['e-a-s3'], groupIds: [] },
      decision: {
        situation:
          'User-uploaded photos need to be visible to every instance, must not be lost, and will grow without any obvious limit. Nobody wants to think about how big the disk should be.',
        prompt: 'Where do the photos go?',
        options: [
          {
            slug: 's3',
            correct: true,
            why: 'Right. No size to choose, no instance to attach it to, reachable from everywhere, and eleven nines of durability without a backup plan of your own. This is the default home for anything that is a file rather than live database state.',
          },
          {
            slug: 'ebs',
            correct: false,
            why: 'A volume attaches to one instance at a time, which is the exact problem you are trying to solve — and you would still be choosing a size and growing it by hand.',
          },
          {
            slug: 'efs',
            correct: false,
            why: 'This genuinely solves the sharing problem and needs no capacity planning, so it is the strongest distractor here. It costs several times more per gigabyte, and it gives you a filesystem when what you want is a URL per object.',
          },
          {
            slug: 'rds',
            correct: false,
            why: 'Photos in a relational database is a classic and expensive mistake: it inflates backups, makes restores slow, and pays database prices for bytes that need no transactions.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'This is the first chapter where the answer is not "a better version of the thing you had" but "stop using that category of thing". Storage stops being a device with a size and becomes a service you put objects into.',
        },
        {
          kind: 'numbers',
          title: 'The figures worth recalling exactly',
          items: [
            {
              label: 'Durability',
              value: '99.999999999% — eleven nines',
              note: 'Durability is "will not be lost". Availability is "can be reached now", and it is a lower number.',
            },
            {
              label: 'Largest single object',
              value: '5 TB',
              note: 'But a single PUT is capped at 5 GB — above that you must use multipart upload.',
            },
            { label: 'Multipart recommended above', value: '100 MB', note: 'Required above 5 GB.' },
          ],
        },
        {
          kind: 'callout',
          tone: 'money',
          title: 'Lifecycle is the whole cost story',
          md: 'Photos are read constantly for a week and then almost never. A lifecycle rule moves them to a cheaper class on a schedule without anybody remembering to — which is the difference between storage costs that grow with your users and storage costs that grow with your *active* users. Retrieval from the archive tiers costs money and takes time, so the rule is a real trade, not free.',
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'Global namespace is not global storage',
          md: 'Bucket names are globally unique, which makes it tempting to think a bucket is global. It lives in exactly one Region. Surviving the loss of that Region needs replication you configure and pay for — which is chapter 13.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c7-k1',
          prompt: 'What is the difference between durability and availability?',
          options: [
            {
              text: 'Durability is whether the data still exists; availability is whether you can reach it right now.',
              correct: true,
              why: 'S3’s eleven nines is a durability figure. Its availability number is deliberately lower, and a stem that says "must be retrievable at all times" is asking about the second one.',
            },
            {
              text: 'They are the same measure at different time scales.',
              correct: false,
              why: 'They are different properties, and the exam separates them.',
            },
            {
              text: 'Durability applies to backups only.',
              correct: false,
              why: 'It applies to the stored object itself.',
            },
          ],
        },
        {
          id: 'startup-saa-c7-k2',
          prompt: 'Full S3 permissions, and the request is still denied. What is the usual cause?',
          options: [
            {
              text: 'The object is encrypted with a customer-managed key whose policy does not permit the caller.',
              correct: true,
              why: 'The KMS key policy is a separate gate and can veto a policy granting s3:*. This is the standard explanation for "allowed but still 403".',
            },
            {
              text: 'The bucket is in another Region.',
              correct: false,
              why: 'A different Region is not an authorisation failure.',
            },
            {
              text: 'The object is too large.',
              correct: false,
              why: 'Size limits produce a different error entirely.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c8',
      title: 'Five teams',
      pain: 'You are fifteen people in five teams now, all working in the one account. Yesterday somebody testing a cleanup script deleted the production photo bucket. They had permission to, because everybody has broadly the same permission, because splitting it up never seemed urgent.',
      minutes: 45,
      taskId: 'saa-1.1',
      serviceSlugs: ['organizations', 'iam'],
      conceptSlugs: ['blast-radius', 'least-privilege', 'tagging'],
      adds: { nodeIds: ['organizations'], edgeIds: [], groupIds: [] },
      decision: {
        situation:
          'Five teams need to work without being able to damage each other’s environments — and without you reviewing every IAM policy anybody writes. One team even asked for "a subnet each".',
        prompt: 'What is the right boundary between five teams?',
        options: [
          {
            slug: 'organizations',
            correct: true,
            why: 'Right — an account per team or per environment. An account is the only boundary that still holds when someone inside it has administrator rights, and an SCP is a ceiling nobody inside can raise. Billing, quotas and blast radius all follow the account line.',
          },
          {
            slug: 'subnet',
            correct: false,
            why: 'This is the intuitive answer and it is worth being precise about why it is wrong. **Subnets separate what is reachable; accounts separate who can do damage.** Five subnets do not stop a script with delete permissions from deleting a bucket — buckets are not even in a subnet. Reaching for the network when the problem is authority is a common and expensive mistake.',
          },
          {
            slug: 'iam',
            correct: false,
            why: 'You do need finer-grained policies, and this is genuinely half the answer. But policies inside one account are written by people who can also change them, and one wrong wildcard is still account-wide. IAM cannot express a limit its own administrators cannot lift.',
          },
          {
            slug: 'control-tower',
            correct: false,
            why: 'The right *shape* of answer and ahead of where you are: it automates the multi-account setup with guardrails, which is valuable once you know why you want the accounts. Reach for it after the boundary decision, not instead of it.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'Chapter 4 separated the network. This chapter separates authority, and they are genuinely different axes — which is why the intuitive answer above is wrong in a way worth remembering.',
        },
        {
          kind: 'compare',
          title: 'Two boundaries people mix up',
          columns: ['Subnet', 'Account'],
          rows: [
            { label: 'Separates', cells: ['What can reach what', 'Who can do what'] },
            { label: 'Stops a mistyped delete', cells: ['No', 'Yes'] },
            {
              label: 'Applies to S3, IAM, DynamoDB',
              cells: ['No — they are not in a subnet', 'Yes — everything is in an account'],
            },
            { label: 'Survives an insider with admin', cells: ['No', 'Yes, via an SCP above it'] },
          ],
        },
        {
          kind: 'prose',
          md: 'The key property of a service control policy is that it can only ever take permission away. It never grants anything — so a call needs an SCP to permit it *and* an identity or resource policy to allow it. That asymmetry is the whole reason it can act as a ceiling.',
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'Why "allowed but denied" happens here',
          md: 'The evaluation order is: an explicit Deny anywhere wins; then any SCP or permissions boundary must permit it; then something must actually allow it; otherwise it is denied by default. An administrator policy granting `*` in an account whose SCP does not permit a service still cannot use that service — and the error will not mention the SCP.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c8-k1',
          prompt: 'Can a service control policy grant a permission?',
          options: [
            {
              text: 'No — it only restricts. Something else must still allow the call.',
              correct: true,
              why: 'This is the fact that makes SCPs a ceiling rather than a policy, and it is tested directly.',
            },
            {
              text: 'Yes, for principals in member accounts.',
              correct: false,
              why: 'It never grants. It defines the maximum, and the grant must come from an identity or resource policy.',
            },
            {
              text: 'Yes, when no identity policy exists.',
              correct: false,
              why: 'With no allow anywhere, the call is denied by default.',
            },
          ],
        },
        {
          id: 'startup-saa-c8-k2',
          prompt: 'Why is an account a stronger boundary than an IAM policy?',
          options: [
            {
              text: 'It still holds when someone inside has administrator rights.',
              correct: true,
              why: 'An administrator can rewrite policies in their own account; they cannot escape the account or the SCP above it.',
            },
            {
              text: 'Accounts are physically isolated on separate hardware.',
              correct: false,
              why: 'Isolation here is logical, not physical, and that is not the argument.',
            },
            {
              text: 'IAM policies expire and accounts do not.',
              correct: false,
              why: 'IAM policies do not expire.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c9',
      title: 'Slow far away',
      pain: 'You launch in Europe. Vietnamese users see the app open instantly; German users wait two and a half seconds, almost all of it downloading photos and stylesheets that have not changed in weeks. Users also still reach you by IP address, because there has never been a name.',
      minutes: 40,
      taskId: 'saa-3.4',
      serviceSlugs: ['cloudfront', 'route53'],
      conceptSlugs: ['edge-location', 'cache-ttl-and-invalidation'],
      adds: {
        nodeIds: ['route53', 'cloudfront'],
        edgeIds: ['e-user-r53', 'e-r53-cf', 'e-cf-elb', 'e-r53-elb'],
        groupIds: ['g-edge'],
      },
      decision: {
        situation:
          'German users are slow. The slow part is images and static assets that are identical for every user and change rarely. Running the whole stack in a second Region would work and would roughly double your operational surface.',
        prompt: 'What is the cheapest thing that fixes this?',
        options: [
          {
            slug: 'cloudfront',
            correct: true,
            why: 'Right. The content is cacheable, so it can be served from a city near the user without you running anything there. A cache hit ends the request at the edge — the fastest and cheapest possible outcome — and needs no second Region.',
          },
          {
            slug: 'region',
            correct: false,
            why: 'A second Region does fix latency, and it is the correct answer when the slow part is *computed per user*. Here it is not: you would be running a duplicate stack, a second database and a replication story to serve files that never change.',
          },
          {
            slug: 'global-accelerator',
            correct: false,
            why: 'The right answer for a different question — non-cacheable or non-HTTP traffic that needs the AWS backbone and static anycast IPs. For cacheable web assets it costs more and caches nothing.',
          },
          {
            slug: 'elasticache',
            correct: false,
            why: 'This caches database reads inside your Region. It does nothing about the distance between Frankfurt and Singapore, which is the entire problem.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'The word that decides this chapter is **cacheable**. If what the user waits for is the same for everybody, move a copy closer. If it is computed for that specific user, you have to move the computation, and that means another Region. Nearly every latency question on the paper turns on that one distinction.',
        },
        {
          kind: 'prose',
          md: 'Route 53 joins at the same time, because a CDN needs a name in front of it and because DNS is the first decision in every request — which makes it the cheapest place to make a routing one. That matters again in chapter 13, when the routing decision becomes "which Region is still alive".',
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'Everything works but nothing is cached',
          md: 'The classic symptom, and it is a cache-key problem: forwarding all headers and cookies to the origin makes every request unique, so every request is a miss. You have added cost and a hop and gained nothing. Forward only what actually varies the response.',
        },
        {
          kind: 'callout',
          tone: 'info',
          title: 'Invalidation is not the versioning strategy',
          md: 'Invalidating paths works and is rate-limited and slow. Changing the object name — a content hash in the filename — is instant, free and cannot serve a stale copy. Reach for invalidation when you got it wrong, not as the deployment mechanism.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c9-k1',
          prompt:
            'A stem says users worldwide see high latency on personalised, per-user API responses. Is CloudFront the answer?',
          options: [
            {
              text: 'No — the content is not cacheable, so this needs the workload closer, not a cache.',
              correct: true,
              why: 'The cacheable/not-cacheable split is what the question is testing. CloudFront can still help by terminating TLS at the edge, but it is not the answer to the stem.',
            },
            {
              text: 'Yes, CloudFront caches personalised responses per user.',
              correct: false,
              why: 'Caching per user defeats the purpose and multiplies storage for no hit rate.',
            },
            {
              text: 'Yes, always — CloudFront fronts everything.',
              correct: false,
              why: '"Always" is never the reasoning the exam rewards.',
            },
          ],
        },
        {
          id: 'startup-saa-c9-k2',
          prompt: 'Why is a content hash in the filename better than an invalidation?',
          options: [
            {
              text: 'It takes effect immediately, costs nothing, and cannot serve a stale copy.',
              correct: true,
              why: 'A new name is a new object, so there is no old cached version to race with.',
            },
            {
              text: 'Invalidations are not supported on CloudFront.',
              correct: false,
              why: 'They are supported — just rate-limited and slower.',
            },
            { text: 'Hashes compress better.', correct: false, why: 'Unrelated.' },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c10',
      title: 'The long job',
      pain: 'You add video. Processing an upload takes about thirty seconds, and the request holds a web worker for the whole time. Under any load the instances run out of workers, the load balancer starts timing out, and photo uploads — which were fine — start failing too.',
      minutes: 45,
      taskId: 'saa-3.5',
      serviceSlugs: ['sqs', 'lambda'],
      conceptSlugs: ['idempotency', 'scaling-up-vs-out'],
      adds: {
        nodeIds: ['sqs', 'lambda'],
        edgeIds: ['e-s3-sqs', 'e-sqs-lambda'],
        groupIds: [],
      },
      decision: {
        situation:
          'A thirty-second job is running inside a request. You need the user to get an answer immediately and the work to happen anyway, without a traffic spike turning into ten thousand concurrent jobs.',
        prompt: 'What goes between the upload and the processing?',
        options: [
          {
            slug: 'sqs',
            correct: true,
            why: 'Right. A queue is what absorbs a spike: ten thousand uploads become ten thousand messages, not ten thousand concurrent workers. The request returns as soon as the message is enqueued, and consumers drain it at whatever rate they can manage.',
          },
          {
            slug: 'sns',
            correct: false,
            why: 'Close, and the distinction matters. SNS fans a message out to subscribers immediately — it pushes, and it does not hold work for later. If no consumer is keeping up, SNS has nowhere to put the backlog. Buffering is exactly what you need here.',
          },
          {
            slug: 'ec2-auto-scaling',
            correct: false,
            why: 'More instances is the intuitive answer and it does not fix the shape of the problem: the request still blocks for thirty seconds, and you are now scaling the web tier to absorb work that has nothing to do with serving pages.',
          },
          {
            slug: 'step-functions',
            correct: false,
            why: 'The right answer once the processing has several steps that must be ordered and retried independently. For a single job that needs buffering, it is orchestration you do not need yet.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'The lesson is about coupling, not about queues. The upload path and the processing path had nothing to do with each other, yet a slow video made photo uploads fail — because they shared a pool of workers. Decoupling means a failure or a slowdown in one stops being a failure in the other.',
        },
        {
          kind: 'steps',
          title: 'The three settings that decide whether this works',
          items: [
            {
              title: 'Visibility timeout longer than processing',
              md: 'If a message takes 30 seconds and the visibility timeout is 30 seconds, a second consumer will be handed the same message. This is the single most-tested SQS failure, and the symptom is every job running twice.',
            },
            {
              title: 'A dead-letter queue with a maxReceiveCount',
              md: 'Without one, a message that always fails is retried forever and blocks the queue behind it. With one, it steps aside after N attempts and you can look at it later.',
            },
            {
              title: 'Idempotent handlers',
              md: 'A standard queue delivers *at least* once, so your handler will occasionally see a duplicate. A conditional write makes processing the same message twice harmless — which is what makes at-least-once delivery acceptable rather than alarming.',
            },
          ],
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'Ordering and exactly-once',
          md: 'A stem that requires strict ordering or no duplicates is asking for a FIFO queue, and the standard queue is the distractor. A stem that just says "handle the spike" is asking for a standard queue, and FIFO is the distractor — it has far lower throughput.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c10-k1',
          prompt: 'Every job is being processed twice. What is the cause?',
          options: [
            {
              text: 'The visibility timeout is shorter than the processing time.',
              correct: true,
              why: 'The message becomes visible again mid-processing and a second consumer picks it up.',
            },
            {
              text: 'The queue is FIFO instead of standard.',
              correct: false,
              why: 'FIFO reduces duplicates rather than causing them.',
            },
            {
              text: 'There are too many consumers.',
              correct: false,
              why: 'More consumers alone does not cause redelivery; the timeout does.',
            },
          ],
        },
        {
          id: 'startup-saa-c10-k2',
          prompt: 'Why does at-least-once delivery not make a standard queue unusable?',
          options: [
            {
              text: 'Because an idempotent handler makes a duplicate harmless.',
              correct: true,
              why: 'Idempotency is what turns a delivery guarantee you cannot change into a property you do not need to care about.',
            },
            {
              text: 'Because duplicates are rare enough to ignore.',
              correct: false,
              why: '"Rare" is not a correctness argument, and the exam does not accept it.',
            },
            {
              text: 'Because the DLQ removes duplicates.',
              correct: false,
              why: 'A DLQ handles repeated failures, not duplicate successes.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c11',
      title: 'Who broke it',
      pain: 'Uploads failed for forty minutes last night. Nobody knows why. The instances that were running then have already been replaced by the scaling group, and their logs went with them. Separately, the production bucket’s policy changed at some point and nobody knows who changed it.',
      minutes: 40,
      taskId: 'saa-2.2',
      serviceSlugs: ['cloudwatch', 'cloudtrail'],
      conceptSlugs: ['shared-responsibility'],
      adds: { nodeIds: ['cloudwatch', 'cloudtrail'], edgeIds: [], groupIds: [] },
      decision: {
        situation:
          'You need to answer two different questions after an incident: what was the application doing, and who changed the configuration.',
        prompt: 'Which service answers "who changed the bucket policy"?',
        options: [
          {
            slug: 'cloudtrail',
            correct: true,
            why: 'Right. CloudTrail records API calls — including the console clicks that are really API calls — independently of the resource they acted on. That independence is the point: a deleted resource cannot tell you who deleted it.',
          },
          {
            slug: 'cloudwatch',
            correct: false,
            why: 'CloudWatch answers the *other* question — metrics and application logs, what the system was doing. It is half of what you need here, and the half that does not know who called the API.',
          },
          {
            slug: 'config',
            correct: false,
            why: 'A strong distractor: AWS Config records what a resource’s configuration *was* over time and whether it complied. It tells you the policy changed and what it changed to; CloudTrail tells you which identity made the call.',
          },
          {
            slug: 'guardduty',
            correct: false,
            why: 'Threat detection — it consumes these logs to find suspicious behaviour. It is a consumer of the record, not the record.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'Once instances are disposable, anything written to their local disk is temporary — which quietly means **you have no logs** unless they are shipped somewhere else as they are written. Auto Scaling gave you resilience and took away your evidence, and this chapter is the bill for chapter 5.',
        },
        {
          kind: 'compare',
          title: 'Three services that all sound like "logging"',
          columns: ['Answers', 'Typical stem wording'],
          rows: [
            {
              label: 'CloudWatch',
              cells: [
                'What was the system doing — metrics, logs, alarms',
                '"high latency", "alert when", "how many errors"',
              ],
            },
            {
              label: 'CloudTrail',
              cells: ['Who made which API call, and when', '"who deleted", "audit", "which user"'],
            },
            {
              label: 'AWS Config',
              cells: [
                'What a resource’s configuration was, and whether it complied',
                '"configuration drift", "compliance", "was it ever public"',
              ],
            },
          ],
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'Data events are not on by default',
          md: 'CloudTrail records management events — `PutBucketPolicy`, `RunInstances` — by default. Per-object reads and writes like `GetObject` are **data events** and must be turned on separately, at extra cost. A question asking who read a specific object has no answer unless data events were already enabled.',
        },
        {
          kind: 'prose',
          md: 'An alarm is what turns a metric into something that wakes somebody up. A metric nobody looks at is a graph you consult after the incident — which is what you had last night.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c11-k1',
          prompt:
            'A question asks who deleted a specific S3 object last Tuesday. Data events were never enabled. What is the honest answer?',
          options: [
            {
              text: 'There is no record — object-level events are not captured by default.',
              correct: true,
              why: 'And no configuration change made today can recover last Tuesday. Recording is not retroactive, which is why the default matters.',
            },
            {
              text: 'CloudTrail management events include it.',
              correct: false,
              why: 'Management events cover control-plane actions such as PutBucketPolicy, not per-object reads and writes.',
            },
            {
              text: 'AWS Config can reconstruct it.',
              correct: false,
              why: 'Config tracks resource configuration, not individual object operations.',
            },
          ],
        },
        {
          id: 'startup-saa-c11-k2',
          prompt: 'Why does an Auto Scaling group make application logging harder?',
          options: [
            {
              text: 'Instances are replaced, so anything on local disk disappears with them.',
              correct: true,
              why: 'Logs must be shipped as they are written, not collected afterwards.',
            },
            {
              text: 'Auto Scaling disables the logging agent.',
              correct: false,
              why: 'It does not interfere with the agent.',
            },
            {
              text: 'Log files cannot be written in a private subnet.',
              correct: false,
              why: 'Subnet placement does not affect local writes.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c12',
      title: 'The bill',
      pain: 'The invoice tripled. Nobody deployed anything that month. The three largest lines are a NAT gateway, something called "inter-AZ data transfer", and a development database that has been running since chapter 6 and is used by nobody.',
      minutes: 40,
      taskId: 'saa-4.1',
      serviceSlugs: ['budgets', 'cost-explorer'],
      conceptSlugs: ['tagging', 'quota-vs-limit'],
      adds: { nodeIds: ['budgets'], edgeIds: [], groupIds: [] },
      decision: {
        situation:
          'You want to know which team is responsible for which portion of the bill, and you want to find out about a mistake in hours rather than at the end of the month.',
        prompt: 'What lets you attribute cost to a team?',
        options: [
          {
            slug: 'tagging',
            correct: true,
            why: 'Right — cost allocation tags, activated in the billing console. Attribution is a data problem, and the tag is the data. The multiple accounts from chapter 8 do much of this for you, which is a second reason that boundary was worth drawing.',
          },
          {
            slug: 'cost-explorer',
            correct: false,
            why: 'This is where you *look* at the answer, and you will use it constantly. But it can only group by dimensions that exist — untagged resources appear as untagged, and Explorer cannot invent the attribution.',
          },
          {
            slug: 'budgets',
            correct: false,
            why: 'Budgets tells you when a number is exceeded, which is the other half of this chapter. It alerts on a threshold; it does not divide spend between teams.',
          },
          {
            slug: 'organizations',
            correct: false,
            why: 'Consolidated billing genuinely gives per-account cost, and with an account per team that is most of the answer. It is the right instinct — but it cannot break down spend *within* an account, which is where tags remain the only tool.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'Renting by the hour means a mistake keeps costing money quietly for as long as nobody looks, and the bill arrives a month after the decision that caused it. Every previous chapter added something that charges while idle; this is where that becomes visible.',
        },
        {
          kind: 'numbers',
          title: 'The three lines that surprise people, and why',
          items: [
            {
              label: 'NAT gateway',
              value: 'Per hour + per GB',
              note: 'From chapter 4. It runs whether or not anything uses it, and processing is charged on top. A gateway VPC endpoint removes this entirely for S3 and DynamoDB traffic — and gateway endpoints are free.',
              volatile: true,
            },
            {
              label: 'Inter-AZ data transfer',
              value: 'Charged in both directions',
              note: 'From chapter 5. Spreading across AZs bought you resilience and a per-gigabyte charge for every packet that crosses.',
              volatile: true,
            },
            {
              label: 'An idle database',
              value: 'Full price, all month',
              note: 'From chapter 6. A provisioned database costs the same whether it serves a million queries or none.',
              volatile: true,
            },
          ],
        },
        {
          kind: 'callout',
          tone: 'money',
          title: 'The one that is nearly free to fix',
          md: 'Most of the NAT bill in a system like this is S3 traffic. A gateway VPC endpoint routes it inside the AWS network, costs nothing, and needs no application change — the instance calls the same API. Interface endpoints, for everything that is not S3 or DynamoDB, are charged per AZ per hour, so they are a real trade rather than a free win.',
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'Activating a tag does not backfill',
          md: 'A question about last quarter’s spend by team, on resources that were untagged at the time, has no tagging answer. Cost allocation tags apply from activation onward. If the stem is retrospective, tagging is the distractor.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c12-k1',
          prompt: 'Most of your NAT gateway processing charge is traffic to S3. What removes it?',
          options: [
            {
              text: 'A gateway VPC endpoint for S3 — free, and no application change.',
              correct: true,
              why: 'Gateway endpoints serve S3 and DynamoDB only, and cost nothing. Everything else needs an interface endpoint, charged per AZ per hour.',
            },
            {
              text: 'A second NAT gateway to spread the load.',
              correct: false,
              why: 'That doubles the hourly charge and processes the same gigabytes.',
            },
            {
              text: 'Moving the instances to a public subnet.',
              correct: false,
              why: 'It would avoid NAT and undo chapter 4, which is the wrong trade.',
            },
          ],
        },
        {
          id: 'startup-saa-c12-k2',
          prompt: 'Why did spreading across two AZs increase the bill?',
          options: [
            {
              text: 'Data crossing an AZ boundary is charged per gigabyte, in both directions.',
              correct: true,
              why: 'Resilience has a running cost, and it is the line people are most surprised by.',
            },
            {
              text: 'Instances in a second AZ cost more per hour.',
              correct: false,
              why: 'Instance pricing does not vary by AZ within a Region.',
            },
            {
              text: 'Multi-AZ doubles storage charges.',
              correct: false,
              why: 'A Multi-AZ database does duplicate storage, but the line in question here is transfer.',
            },
          ],
        },
      ],
    },
    {
      id: 'startup-saa-c13',
      title: 'The Region goes dark',
      pain: 'A whole Region has a bad afternoon. Your Multi-AZ database fails over to a standby in the same Region, which is also having the bad afternoon. Everything you built survives losing a building and none of it survives losing the city. The board asks how long recovery would take, and you do not have a number.',
      minutes: 50,
      taskId: 'saa-2.1',
      serviceSlugs: ['s3', 'route53'],
      conceptSlugs: [
        'rpo',
        'rto',
        'dr-strategies',
        'multi-az-vs-multi-region',
        'backup-vs-replication',
      ],
      adds: {
        nodeIds: ['s3-dr'],
        edgeIds: ['e-s3-dr'],
        groupIds: ['g-region-2'],
      },
      decision: {
        situation:
          'The board wants to know the recovery time. Before you can design anything you need the two numbers that decide which design is even a candidate.',
        prompt: 'What has to be agreed before you choose a DR approach?',
        options: [
          {
            slug: 'rpo',
            correct: true,
            why: 'Right — RPO and RTO together. How much data you can afford to lose, and how long you can afford to be down. Every DR pattern is available at some price, so without the numbers the conversation is two people asserting how important the data is.',
          },
          {
            slug: 'dr-strategies',
            correct: false,
            why: 'These are the *answers* — backup and restore, pilot light, warm standby, active-active — and you cannot choose between them without the numbers. Picking a pattern first is picking a price before knowing the requirement.',
          },
          {
            slug: 'failover',
            correct: false,
            why: 'The mechanism that executes the switch once you have somewhere to switch to. Necessary, and downstream of the decision.',
          },
          {
            slug: 'backup-vs-replication',
            correct: false,
            why: 'A genuinely important distinction — a backup is a point in time you can go back to, replication is a live copy that faithfully copies your mistakes too. But it is a property of the options, not the requirement that selects among them.',
          },
        ],
      },
      sections: [
        {
          kind: 'prose',
          md: 'This is the chapter that reframes every earlier one. Multi-AZ was not a weaker version of multi-Region — it answers a different question. AZs protect against a building; only crossing Regions protects against the Region. Nothing crosses that boundary unless you configured it, which was the point of chapter 2.',
        },
        {
          kind: 'compare',
          title: 'The four patterns, and what each one costs',
          columns: ['RTO', 'RPO', 'What runs in Region 2'],
          rows: [
            {
              label: 'Backup and restore',
              cells: ['Hours', 'Hours', 'Nothing — just copies of data'],
            },
            {
              label: 'Pilot light',
              cells: ['Tens of minutes', 'Minutes', 'Data replicating; compute switched off'],
            },
            {
              label: 'Warm standby',
              cells: ['Minutes', 'Seconds', 'A small but running copy of everything'],
            },
            {
              label: 'Active-active',
              cells: ['Near zero', 'Near zero', 'A full second estate, serving traffic'],
            },
          ],
        },
        {
          kind: 'prose',
          md: 'For this product, the photos matter most and are the easiest thing to protect: S3 cross-Region replication copies new objects continuously, and the bucket in Region 2 is useful the moment you need it. [[route53]] then becomes the switch — a failover record with a health check stops answering with a Region that is not responding. DNS is the first decision in every request, which is what makes it the right place for the last one.',
        },
        {
          kind: 'callout',
          tone: 'trap',
          title: 'Replication is not a backup',
          md: 'Replication copies a deletion or a corruption as faithfully as it copies a photo. If the requirement is "recover from someone deleting the wrong thing", the answer is versioning and backups, not a second copy that is kept perfectly in step with the mistake.',
        },
        {
          kind: 'callout',
          tone: 'info',
          title: 'Where you have arrived',
          md: 'Thirteen chapters, and every service on this diagram is here because something specific went wrong without it. That is the thing worth carrying into the exam: a scenario question is a chapter of this story, told in one paragraph, and the constraint in the stem is the pain that decides the answer.',
        },
      ],
      checks: [
        {
          id: 'startup-saa-c13-k1',
          prompt:
            'A stem requires recovery within minutes with almost no data loss, at the lowest cost that meets it. Which pattern?',
          options: [
            {
              text: 'Warm standby — a small running copy that can be scaled up.',
              correct: true,
              why: 'Pilot light is too slow for minutes; active-active meets it but is not the lowest cost that does.',
            },
            {
              text: 'Active-active across both Regions.',
              correct: false,
              why: 'It meets the recovery requirement, which is what makes it the strongest distractor — but the stem asks for the lowest cost that meets it, and this is the most expensive option.',
            },
            {
              text: 'Backup and restore.',
              correct: false,
              why: 'Restoring from backups takes hours, not minutes.',
            },
          ],
        },
        {
          id: 'startup-saa-c13-k2',
          prompt: 'Why does Multi-AZ not satisfy "survive the loss of a Region"?',
          options: [
            {
              text: 'All the AZs are inside that one Region.',
              correct: true,
              why: 'The most reliably tested confusion on the paper, and the reason chapter 2 came before anything was built.',
            },
            {
              text: 'Multi-AZ has no automatic failover.',
              correct: false,
              why: 'It does fail over automatically — but only to a standby in the same Region.',
            },
            {
              text: 'Multi-AZ applies only to databases.',
              correct: false,
              why: 'Not the reason, and not accurate as a general statement.',
            },
          ],
        },
      ],
    },
  ],
}
