import type { Lesson } from '../schema'

/**
 * The first lesson, and deliberately this topic.
 *
 * The atlas already holds every fact below — `security-group` and `nacl` in
 * `services/network.ts`, and the `stateful-filtering` concept. Nothing here is
 * new information, which is the point: the complaint that prompted this lesson
 * was not that the atlas was wrong or thin, it was that eight correct paragraphs
 * arriving at once in no particular order is a reference format, and nobody
 * meets an idea for the first time in a reference format.
 *
 * So this file contains no facts. It contains an *order*: a picture before a
 * definition, a rule block read out one line at a time, the wrong answer written
 * down before it is rejected, and "stateful" demonstrated with two arrows before
 * the word is ever used. If a fact here is not in the atlas, the atlas is what
 * needs editing — see invariant 10.
 *
 * `families: ['saa']` rather than both, because a lesson carries one `taskId` and
 * this one is SAA task 1.2. Security groups matter to a DVA candidate too; they
 * meet them through the atlas until a DVA-tasked lesson exists.
 */
export const securityGroups: Lesson = {
  id: 'security-groups',
  families: ['saa'],
  taskId: 'saa-1.2',
  cluster: 'reachability',
  title: 'Security groups',
  subtitle:
    'A firewall where you write the rule for the request and never write one for the reply. Once that stops being surprising, half the VPC questions on the paper get easier.',
  minutes: 12,
  tier: 1,
  serviceSlugs: ['security-group', 'nacl', 'ec2', 'elb', 'rds'],
  requires: [],
  cardIds: [
    'num:security-group:stateful',
    'num:security-group:rule-types',
    'num:security-group:default-behaviour',
    'num:security-group:evaluation',
    'vs:security-group:nacl',
    'which:security-group',
    'define:stateful-filtering',
  ],

  sections: [
    /* ── 1. The hook ─────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'A [[security-group|security group]] is a firewall, and every firewall you have met before made you write two rules for one conversation: let the request in, let the reply out. This one does not. You write the rule for the request, and the reply is allowed because the group *remembers* that it let the request through. Almost everything else about security groups follows from that, so it is worth watching happen before reading the word for it.',
    },

    /* ── 1b. The two directions, named before anything else uses them ────── */
    { kind: 'heading', text: 'Inbound and outbound are directions, not features' },
    {
      kind: 'prose',
      md: 'Every rule you write sits in one of two lists, and the only thing separating them is which way the traffic is travelling **relative to the resource the group is attached to** — this instance, this load balancer, this database. The rule itself looks identical either way; the direction is a point of view.',
    },
    {
      kind: 'steps',
      title: 'Which list a rule belongs in',
      items: [
        {
          title: 'Inbound — something else started it, and it is arriving here',
          md: 'A browser asking your web server for a page. A load balancer forwarding a request to your app. Your app opening a connection to RDS — from the point of view of the *database*, that one is inbound. An inbound rule answers "who may start a conversation with me, and on which port?"',
        },
        {
          title: 'Outbound — this resource started it, and it is leaving',
          md: 'The same instance running a package install, calling the S3 API, or connecting to that database. An outbound rule answers "where may this resource reach out to?" A new group allows **all** of it, which is why you have probably never written one.',
        },
        {
          title: 'The two lists even name their columns differently',
          md: 'An inbound rule has a **source** — where the traffic is coming from. An outbound rule has a **destination** — where it is going. Same protocol and port columns; the address column flips meaning with the direction.',
        },
        {
          title: 'One conversation always uses both directions',
          md: 'A request travels one way and its reply comes back the other, so a single HTTPS call is inbound *and* outbound traffic at the server. That is where the confusion usually starts, and it is what the next section is about.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'The direction belongs to the resource, not to the port',
      md: 'Port 443 arriving at the web server is an inbound rule on that server, and the *same* conversation is outbound at the client. So "is 443 inbound or outbound?" has no answer until you say whose group you are editing. Ask instead: who started this connection, and am I the one being reached?',
    },

    /* ── 2. Watch it happen, before the definition ───────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'sg-trace',
        title: 'One inbound rule, a two-way conversation',
        caption:
          'The rule you wrote is on the first arrow. Nothing you wrote is on the second one.',
        cols: 13,
        rows: 6,
        nodes: [
          {
            id: 'internet',
            label: 'Client',
            sub: 'somewhere on the internet',
            kind: 'internet',
            x: 0.4,
            y: 0.4,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'ec2',
            label: 'EC2',
            sub: 'your web server',
            kind: 'service',
            category: 'compute',
            x: 8.6,
            y: 3.4,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          {
            id: 'req',
            from: 'internet',
            to: 'ec2',
            label: 'TCP 443',
            tone: 'ok',
            elbow: true,
          },
          // Deliberately not an elbow, unlike the request: an elbow from the
          // instance would send a vertical line straight up through the subnet
          // and VPC boxes it sits in. A diagonal reads as leaving them, and
          // being a different *shape* from the request is the whole point.
          {
            id: 'res',
            from: 'ec2',
            to: 'internet',
            label: 'the reply',
            tone: 'info',
          },
        ],
        groups: [
          { id: 'vpc', label: 'VPC', kind: 'vpc', nodeIds: [] },
          {
            id: 'subnet',
            label: 'Public subnet',
            kind: 'subnet-public',
            nodeIds: [],
            parent: 'vpc',
          },
          {
            id: 'sg',
            label: 'sg-web',
            kind: 'plain',
            nodeIds: ['ec2'],
            parent: 'subnet',
          },
        ],
        steps: [
          {
            edgeIds: ['req'],
            title: 'The request arrives on port 443',
            detail:
              'You wrote one inbound rule: allow TCP 443 from anywhere. The packet matches it, so it reaches the instance. Nothing surprising yet.',
            tone: 'ok',
          },
          {
            edgeIds: ['res'],
            title: 'The reply goes back — on a port you never named',
            detail:
              'The client is listening on an ephemeral port it chose itself, so you could not have written a rule for it even if you had wanted to. You also wrote no outbound rule. The reply is allowed anyway.',
            tone: 'info',
          },
          {
            edgeIds: ['req', 'res'],
            title: 'That is what stateful means',
            detail:
              'The group tracked the connection it allowed, so the reply was never judged on its own. Put a [[nacl|network ACL]] in the same position and the second arrow is dropped unless you separately allow ports 1024–65535 back out — which is most of the protection gone, and the single most common reason return traffic mysteriously vanishes.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the word',
      md: 'Security groups are **stateful**. Network ACLs are **stateless**. That one distinction is the most-asked networking fact on the paper, and [[stateful-filtering]] is the concept card for it.',
    },

    /* ── 3. A real rule block, read out one line at a time ───────────────── */
    { kind: 'heading', text: 'What a rule actually looks like' },
    {
      kind: 'code',
      lang: 'text',
      caption: 'sg-web — the whole configuration of a working web server',
      code: `INBOUND                                    (source = who may reach me)
  protocol   port   source              why
  TCP        443    0.0.0.0/0           anyone, over HTTPS
  TCP         22    203.0.113.4/32      me, over SSH, from this address only

OUTBOUND                                   (destination = where I may reach)
  protocol   port   destination         why
  ALL        ALL    0.0.0.0/0           the default on a new group — left alone`,
    },
    {
      kind: 'steps',
      title: 'The same block, one line at a time',
      items: [
        {
          title: 'TCP 443 from 0.0.0.0/0',
          md: '`0.0.0.0/0` is every address there is, so this is "the public may reach me over HTTPS". On a web server that is correct and not a finding. On a database it is the wrong answer the exam is hoping you will pick.',
        },
        {
          title: 'TCP 22 from 203.0.113.4/32',
          md: "A `/32` is exactly one address — mine. Same port, same protocol as anyone else's SSH rule; the *source* is what makes it least privilege. Change that `/32` to `/0` and you have the second-most-common wrong answer on the paper.",
        },
        {
          title: 'Nothing about the reply, anywhere',
          md: 'No inbound rule mentions the response, and the outbound line is only the default allow-all — it is not what lets the reply out. Delete it and the reply still gets back, because of the diagram above. Two inbound lines run a public web server.',
        },
        {
          title: 'And nothing that is not listed',
          md: 'Ports 80, 3306, 8080 and every other port are closed, because a new group **denies all inbound** and you never opened them. There is no "deny the rest" line to write — that is the default.',
        },
      ],
    },

    /* ── 4. The rule you cannot write ────────────────────────────────────── */
    { kind: 'heading', text: 'The rule you cannot write' },
    {
      kind: 'prose',
      md: 'One address is scraping your site. The obvious move is to block it, so write the rule out:',
    },
    {
      kind: 'code',
      lang: 'text',
      caption: 'sg-web — not expressible',
      code: `INBOUND
  protocol   port   source              action
  TCP        443    0.0.0.0/0           allow
  TCP        443    198.51.100.7/32     deny     <-- there is no such column`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Security groups have no deny',
      md: 'Every rule is an allow rule; there is no action to choose. So if a requirement contains the word **block**, or names a single bad address, the answer is not a security group — it is a [[nacl|network ACL]], or [[waf|AWS WAF]] if the thing to block is an HTTP pattern rather than an address. This is the cleanest keyword-to-answer mapping in the whole networking domain and it is worth over-learning.',
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Which also means order never matters',
      md: 'Because there is no deny, no rule can ever contradict another — so **all** rules across **all** the groups attached to an interface are evaluated together, and any single match allows the traffic. There is no first-match-wins and no rule numbering. A NACL is the opposite: numbered, lowest first, stops at the first match, so a deny at 100 beats an allow at 200. If a question is about rule *order*, it is not about a security group.',
    },

    /* ── 5. Where it attaches, and why that is not the subnet ────────────── */
    { kind: 'heading', text: 'It attaches to the interface, not the subnet' },
    {
      kind: 'prose',
      md: 'A security group is attached to a network interface, which is why two instances sitting in the same subnet can have completely different rules — and why a subnet-level filter cannot separate them at all.',
    },
    {
      kind: 'diagram',
      spec: {
        id: 'sg-eni',
        title: 'Two instances, one subnet, different rules',
        caption:
          'The dashed arrow is traffic inside one subnet. A NACL sits at the subnet edge and never sees it, so only a security group can stop it.',
        // Declared smaller than the content needs on purpose: `viewBox` unions
        // the declared grid with what is actually drawn, so under-declaring
        // crops to the content and over-declaring leaves dead space below it.
        cols: 10,
        rows: 3,
        nodes: [
          {
            id: 'ec2-a',
            label: 'EC2 A',
            sub: 'web',
            kind: 'service',
            category: 'compute',
            x: 1,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'ec2-b',
            label: 'EC2 B',
            sub: 'admin tooling',
            kind: 'service',
            category: 'compute',
            x: 7,
            y: 1.4,
            w: 2.8,
            h: 1.3,
          },
        ],
        edges: [
          {
            id: 'lateral',
            from: 'ec2-a',
            to: 'ec2-b',
            label: 'same subnet',
            tone: 'warn',
            dashed: true,
          },
        ],
        groups: [
          { id: 'vpc2', label: 'VPC', kind: 'vpc', nodeIds: [] },
          {
            id: 'subnet2',
            label: 'One private subnet, one NACL',
            kind: 'subnet-private',
            nodeIds: [],
            parent: 'vpc2',
          },
          { id: 'sg-a', label: 'sg-web', kind: 'plain', nodeIds: ['ec2-a'], parent: 'subnet2' },
          { id: 'sg-b', label: 'sg-admin', kind: 'plain', nodeIds: ['ec2-b'], parent: 'subnet2' },
        ],
        steps: [],
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The corollary the exam likes',
      md: 'A [[nacl|network ACL]] is subnet-scoped, so it **cannot filter between two instances in the same subnet** — the traffic never crosses the subnet boundary it guards. If a requirement is about isolating two resources that sit together, a NACL is a wrong answer however well it is dressed up.',
    },

    /* ── 6. The pattern you will see in every real architecture ──────────── */
    { kind: 'heading', text: 'A group can name another group' },
    {
      kind: 'prose',
      md: 'Under Auto Scaling, instances come and go hourly, so a rule written in terms of addresses stops being true almost immediately and no human can maintain the list. So the source of a rule can be another security group instead of a CIDR range — and then the rule survives every scaling event without being touched. This is the shape production architectures actually have:',
    },
    {
      kind: 'diagram',
      spec: {
        id: 'sg-chain',
        title: 'Each tier names the tier in front of it',
        caption:
          'No address appears anywhere except on the public edge. Scale any tier to a thousand instances and not one rule changes.',
        // Laid out as one left-to-right chain with the data tier fanning out,
        // because the edge labels are the teaching here and they need clear air
        // between the boxes to sit in. The internet node is deliberately outside
        // every group — the VPC rectangle is the union of its subnets, so a node
        // placed level with them would appear to be inside it.
        cols: 19,
        rows: 8,
        nodes: [
          {
            id: 'internet',
            label: 'Internet',
            kind: 'internet',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'elb',
            label: 'ALB',
            sub: 'sg-alb',
            kind: 'service',
            category: 'network',
            x: 5.4,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'ec2',
            label: 'App tier',
            sub: 'sg-app',
            kind: 'service',
            category: 'compute',
            x: 10.4,
            y: 3.3,
            w: 3,
            h: 1.3,
          },
          {
            id: 'rds',
            label: 'RDS',
            sub: 'sg-db',
            kind: 'service',
            category: 'database',
            x: 15.2,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'elasticache',
            label: 'ElastiCache',
            sub: 'sg-cache',
            kind: 'service',
            category: 'database',
            x: 15.2,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'c-in', from: 'internet', to: 'elb', label: '443 from 0.0.0.0/0', tone: 'ok' },
          { id: 'c-app', from: 'elb', to: 'ec2', label: '8080 from sg-alb', tone: 'ok' },
          { id: 'c-db', from: 'ec2', to: 'rds', label: '3306 from sg-app', tone: 'ok' },
          { id: 'c-cache', from: 'ec2', to: 'elasticache', label: '6379 from sg-app', tone: 'ok' },
        ],
        groups: [
          { id: 'vpc3', label: 'VPC', kind: 'vpc', nodeIds: [] },
          {
            id: 'pub3',
            label: 'Public subnet',
            kind: 'subnet-public',
            nodeIds: ['elb'],
            parent: 'vpc3',
          },
          {
            id: 'app3',
            label: 'Private subnet: app',
            kind: 'subnet-private',
            nodeIds: ['ec2'],
            parent: 'vpc3',
          },
          {
            id: 'data3',
            label: 'Private subnet: data',
            kind: 'subnet-private',
            nodeIds: ['rds', 'elasticache'],
            parent: 'vpc3',
          },
        ],
        steps: [],
      },
    },
    {
      kind: 'code',
      lang: 'text',
      caption: 'The database rule, written both ways',
      code: `sg-db INBOUND
  TCP  3306  from  sg-app          correct: only the app tier, whatever it scales to
  TCP  3306  from  10.0.0.0/16     weaker:  every resource in the VPC, forever
  TCP  3306  from  0.0.0.0/0       the answer the question wants you to reject`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'What a group reference does not mean',
      md: 'Naming `sg-app` as a source means "any interface that is a member of that group". It does **not** inherit that group\'s rules, and it is not nesting — so sg-alb naming sg-app, and sg-app naming sg-db, does not let the ALB reach the database. Nothing is transitive here.',
    },

    /* ── 7. The comparison, now that both halves have been seen ──────────── */
    {
      kind: 'compare',
      title: 'Security group against network ACL',
      columns: ['Security group', 'Network ACL'],
      rows: [
        { label: 'Attached to', cells: ['A network interface', 'A subnet'] },
        {
          label: 'Remembers connections',
          cells: ['Yes — stateful', 'No — stateless, the reply needs its own rule'],
        },
        { label: 'Can deny', cells: ['No, allow only', 'Yes, allow and deny'] },
        {
          label: 'Rule order',
          cells: [
            'Irrelevant — all rules evaluated, any match allows',
            'Lowest number first, first match wins',
          ],
        },
        {
          label: 'Return traffic',
          cells: ['Automatic', 'Needs ports 1024–65535 explicitly'],
        },
        {
          label: 'Empty one does what',
          cells: ['Denies all inbound, allows all outbound', 'A custom NACL denies everything'],
        },
        {
          label: 'Two instances, one subnet',
          cells: ['Can separate them', 'Cannot — the traffic never crosses the subnet edge'],
        },
        { label: 'Blocking one bad address', cells: ['Impossible', 'This is what it is for'] },
      ],
    },

    /* ── 8. The numbers, last, because they are the least of it ──────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Stateful', value: 'Return traffic is automatically allowed' },
        { label: 'Rule types', value: 'Allow only — deny is impossible' },
        {
          label: 'A new group',
          value: 'Denies all inbound, allows all outbound',
        },
        {
          label: 'Rules per group',
          value: '60 inbound and 60 outbound by default',
          volatile: true,
        },
        { label: 'Groups per interface', value: '5 by default, raisable to 16', volatile: true },
        {
          label: 'Evaluation',
          value: 'All rules across all attached groups; any match allows',
        },
        { label: 'Cost', value: 'Free' },
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The one that catches people in production',
      md: 'Tightening the default outbound allow-all feels like good hygiene and breaks package installs, the SSM agent and NFS mounts. A troubleshooting question about an instance that came up healthy and then could not do anything is sometimes hiding here.',
    },

    /* ── 9. Where to go next ─────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'The rest of the reachability picture',
      slugs: ['nacl', 'waf', 'network-firewall', 'vpc'],
    },
    {
      kind: 'prose',
      md: 'A packet needs both a **route** and **permission**, and the exam removes one of the two. This lesson was permission. For the other half, read [[route-table]] and [[subnet]] — and when a question says an instance cannot be reached, check the route table, then the security group, then the NACL, then whether it has a public address, in that order.',
    },
  ],

  /* ── Checks: the only part of this page that is retrieval ─────────────── */
  checks: [
    {
      id: 'security-groups-direction',
      prompt:
        'Your application instances open connections to an RDS database. Which rules govern that traffic?',
      options: [
        {
          text: "An outbound rule on the app tier's group and an inbound rule on the database's group",
          correct: true,
          why: 'Direction is read from each resource separately: the same connection leaves the app tier, so it is outbound there, and arrives at the database, so it is inbound there.',
        },
        {
          text: "An inbound rule on the app tier's group and an outbound rule on the database's group",
          correct: false,
          why: 'That is the same connection read backwards. The app tier started it, so at the app tier it is outbound.',
        },
        {
          text: 'An inbound rule on both groups, since both ends receive traffic',
          correct: false,
          why: 'Both ends do send and receive, but only the end being reached is inbound. Whoever opened the connection is doing something outbound.',
        },
      ],
    },
    {
      id: 'security-groups-stateful',
      prompt:
        'You allow inbound TCP 443 on a security group and delete every outbound rule it has. A client opens an HTTPS connection. What happens?',
      options: [
        {
          text: 'The request arrives and the reply gets back to the client',
          correct: true,
          why: 'Stateful. The group tracked the connection it allowed inbound, so the reply is permitted regardless of what the outbound rules say.',
        },
        {
          text: 'The request arrives but the reply is dropped',
          correct: false,
          why: 'That is how a stateless filter behaves — a NACL. A security group remembers the connection.',
        },
        {
          text: 'The request is dropped, because a group with no outbound rules cannot respond',
          correct: false,
          why: 'Inbound and outbound are separate. The inbound rule is what decides whether the request arrives.',
        },
      ],
    },
    {
      id: 'security-groups-deny',
      prompt:
        'One address is scraping your public site and you need it blocked at the network layer. Which will do it?',
      options: [
        {
          text: 'A NACL deny rule on the subnet',
          correct: true,
          why: 'NACLs support deny, and blocking a specific address is the job they exist for. WAF would also work if the pattern to block were an HTTP one rather than an address.',
        },
        {
          text: 'A security group deny rule on the instance',
          correct: false,
          why: 'There is no such thing. Every security group rule is an allow rule — the word "block" in a requirement rules them out.',
        },
        {
          text: 'Removing 0.0.0.0/0 from the security group inbound rule',
          correct: false,
          why: 'That blocks the whole internet, not one address. The site goes down, which is a worse outcome than the scraping.',
        },
      ],
    },
    {
      id: 'security-groups-reference',
      prompt:
        "A database must accept traffic only from an Auto Scaling group of application servers whose addresses change hourly. What goes in the database group's inbound rule as the source?",
      options: [
        {
          text: "The application tier's security group",
          correct: true,
          why: 'A group reference means "any interface in that group", so it stays correct through every scaling event with no maintenance.',
        },
        {
          text: 'The CIDR range of the private subnet the application servers sit in',
          correct: false,
          why: 'It works, and it is weaker than asked for: it admits everything else in that subnet too, now and in future. On the exam the group reference is the intended answer.',
        },
        {
          text: 'A list of the current instance private addresses',
          correct: false,
          why: 'Correct for about an hour. This is precisely the maintenance problem group references exist to remove.',
        },
      ],
    },
    {
      id: 'security-groups-scope',
      prompt:
        'Two instances share one private subnet and must not be able to reach each other. What can enforce that?',
      options: [
        {
          text: 'Security groups, because they attach to each interface separately',
          correct: true,
          why: 'The boundary is the interface, so two instances in one subnet can have entirely different rules.',
        },
        {
          text: 'A NACL, because it controls the subnet they are both in',
          correct: false,
          why: 'A NACL guards the subnet edge, and this traffic never crosses it. It cannot see the packets at all.',
        },
        {
          text: 'Neither — they have to be moved into separate subnets first',
          correct: false,
          why: 'No move is needed. The local route means they can reach each other at the network layer, and a security group is what stops them.',
        },
      ],
    },
  ],
}
