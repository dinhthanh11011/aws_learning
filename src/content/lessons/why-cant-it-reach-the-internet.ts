import type { Lesson } from '../schema'

/**
 * The troubleshooting lesson, and the one that turns the reachability facts into
 * a procedure. Every fact is in the atlas — the `internet-gateway`, `nat`,
 * `private-vs-public-ip` and `subnet` concepts, and the `nat-gateway` service.
 *
 * The order here is the contribution: four gates on one request, advanced one at
 * a time, before any of them is named. The exam removes exactly one of the four,
 * so a reader who has watched all four be checked has a procedure rather than a
 * list — and the procedure is the thing the atlas cannot hand them.
 *
 * `requires: ['subnets-and-route-tables']` because gate one is a route, and this
 * lesson does not re-teach what a route table is.
 */
export const whyCantItReachTheInternet: Lesson = {
  id: 'why-cant-it-reach-the-internet',
  families: ['saa'],
  taskId: 'saa-1.2',
  title: 'Why can’t it reach the internet?',
  subtitle:
    'Four things have to be true, and an exam question removes exactly one of them. Knowing which order to check them in turns the most common scenario on the paper into about fifteen seconds of work.',
  minutes: 15,
  tier: 1,
  serviceSlugs: ['vpc', 'nat-gateway', 'security-group', 'nacl', 'lambda'],
  requires: ['subnets-and-route-tables'],
  cardIds: [
    'num:concept:internet-gateway:internet-gateways-per-vpc',
    'num:concept:internet-gateway:cost',
    'num:nat-gateway:placement',
    'num:nat-gateway:availability',
    'num:nat-gateway:cost',
    'num:nat-gateway:ports',
    'vs:concept:nat:internet-gateway',
    'trap:nat-gateway:a-nat-gateway-is-zonal-one-nat-gateway-shared-by-private-su',
    'trap:nat-gateway:the-nat-gateway-must-be-in-a-different-subnet-from-the-ins',
    'trap:concept:private-vs-public-ip:stopping-and-starting-an-instance-releases-its-public-ip-a',
    'which:nat-gateway',
  ],

  sections: [
    /* ── 1. The hook ─────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: 'This is the most common troubleshooting scenario on the paper, and it always reads like a mystery: an instance that should be reachable is not, and four of the options are plausible. It is not a mystery. **Exactly four things** have to be true for a public instance to hold a conversation with the internet, and a question is built by taking one of them away. So the work is not diagnosis, it is a checklist — and it is worth watching the checklist run before reading it.',
    },

    /* ── 2. The four gates, one at a time, before any of them is named ───── */
    {
      kind: 'diagram',
      spec: {
        id: 'reach-four-gates',
        title: 'One request, four gates',
        caption:
          'The same two arrows as always. Advance a step for each thing that has to be true before either of them is drawn.',
        // Template A: the request an elbow, the reply a diagonal. The shapes must
        // differ — two elbows between one pair draw on top of each other.
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
            sub: '10.0.1.20 + 54.x.x.x',
            kind: 'service',
            category: 'compute',
            x: 8.6,
            y: 3.4,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'req', from: 'internet', to: 'ec2', label: 'TCP 443', tone: 'ok', elbow: true },
          { id: 'res', from: 'ec2', to: 'internet', label: 'the reply', tone: 'info' },
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
          { id: 'sg', label: 'sg-web', kind: 'plain', nodeIds: ['ec2'], parent: 'subnet' },
        ],
        steps: [
          {
            edgeIds: ['req'],
            title: 'One — a route to the internet gateway',
            detail:
              'The subnet’s route table needs `0.0.0.0/0` pointing at the internet gateway. Without it the subnet is private, whatever else is true, and no filter is even consulted.',
            tone: 'info',
          },
          {
            edgeIds: ['req'],
            title: 'Two — a public or Elastic IP on the instance',
            detail:
              'A private address is not routable on the internet; no ISP will carry a packet to `10.0.1.20`. The gateway performs a one-to-one translation, which is why the instance never sees its own public address in its own operating system configuration.',
            tone: 'info',
          },
          {
            edgeIds: ['req'],
            title: 'Three — a security group that allows it inbound',
            detail:
              'Allow-only, and a new group denies all inbound. This is the gate people check first and it is the third one worth checking, because a group is visible in the console and a missing route is not.',
            tone: 'info',
          },
          {
            edgeIds: ['res'],
            title: 'Four — a network ACL that allows both directions',
            detail:
              'The default ACL allows everything, so this gate is usually already open — but a custom one is stateless, so the reply needs its own outbound rule on ports 1024–65535. This is the gate that fails asymmetrically: the request arrives and the reply vanishes.',
            tone: 'warn',
          },
          {
            edgeIds: ['req', 'res'],
            title: 'All four, and only then',
            detail:
              'Every question in this family has three of these four in place and is asking you to notice the fourth. Nothing here is about the instance, the AMI or the application.',
            tone: 'ok',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'The order to check them in',
      md: 'Not the order above, which is the order the packet meets them. When you are reading a question: **route table, then the security group, then the NACL, then whether it has a public address.** That order is by how often each one is the answer, and by how easy each is to overlook — a missing route is invisible unless you go and look at a different object, and a default NACL is almost never the problem.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The address that goes away on its own',
      md: 'Stopping and starting an instance **releases its automatically-assigned public IPv4 address** and it gets a different one on the next start. If a scenario says something worked yesterday and stopped working after a maintenance window, and something else hard-codes that address, this is what happened — and an [[private-vs-public-ip|Elastic IP]] is the fix. Note an Elastic IP costs money precisely when it is *not* attached to anything.',
    },

    /* ── 3. The other half: the private subnet ───────────────────────────── */
    { kind: 'heading', text: 'Now the harder version: outbound only' },
    {
      kind: 'prose',
      md: 'The four gates are for something the internet may reach. Far more often, the requirement is the opposite: a server that must be able to fetch patches and call a third-party API, and that nothing on the internet may be able to open a connection to. Giving it a public address would satisfy the first half and destroy the second, which is what NAT exists to separate.',
    },
    {
      kind: 'diagram',
      spec: {
        id: 'reach-nat-path',
        title: 'The outbound-only path',
        caption:
          'Four hops, all of them outbound. The NAT gateway is in a different subnet from the instance that routes to it, and that is not a style choice — it is a requirement. There is no arrow in the other direction because there is no way to draw one.',
        // Template B: a left-to-right chain, spaced so the edge labels land in
        // the gaps between the boxes rather than on top of them.
        cols: 22,
        rows: 6,
        nodes: [
          {
            id: 'internet',
            label: 'Internet',
            kind: 'internet',
            x: 18.6,
            y: 2.2,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'igw',
            label: 'Internet gateway',
            kind: 'note',
            x: 12.6,
            y: 2.2,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'nat-gateway',
            label: 'NAT gateway',
            sub: 'with an Elastic IP',
            kind: 'service',
            category: 'network',
            x: 6.4,
            y: 0.4,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'ec2-app',
            label: 'EC2',
            sub: '10.0.2.30, no public IP',
            kind: 'service',
            category: 'compute',
            x: 0.2,
            y: 3.6,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          {
            id: 'app-nat',
            from: 'ec2-app',
            to: 'nat-gateway',
            label: '0.0.0.0/0',
            tone: 'ok',
          },
          { id: 'nat-igw', from: 'nat-gateway', to: 'igw', label: '0.0.0.0/0', tone: 'ok' },
          { id: 'igw-out', from: 'igw', to: 'internet', label: 'out', tone: 'ok' },
        ],
        groups: [
          { id: 'vpc2', label: 'VPC', kind: 'vpc', nodeIds: ['igw'] },
          {
            id: 'sn-pub2',
            label: 'Public subnet',
            kind: 'subnet-public',
            nodeIds: ['nat-gateway'],
            parent: 'vpc2',
          },
          {
            id: 'sn-priv2',
            label: 'Private subnet',
            kind: 'subnet-private',
            nodeIds: ['ec2-app'],
            parent: 'vpc2',
          },
        ],
        steps: [],
      },
    },
    {
      kind: 'code',
      lang: 'text',
      caption: 'The two route tables that make the picture above work',
      code: `rtb-private                          rtb-public
  destination     target               destination     target
  10.0.0.0/16     local                10.0.0.0/16     local
  0.0.0.0/0       nat-0abc1234         0.0.0.0/0       igw-0abc1234

associated with: the app subnet       associated with: the NAT subnet`,
    },
    {
      kind: 'steps',
      title: 'Why it has to be two subnets',
      items: [
        {
          title: 'The NAT gateway must be in a different subnet from the instances routing to it',
          md: 'A subnet has one route table. If the NAT gateway sat in the private subnet, its own default route would point at itself, and the packet would never leave. Putting it in the subnet it serves is a wrong answer that looks tidy, which is exactly why it is offered.',
        },
        {
          title: 'And the subnet it sits in must have an internet gateway route',
          md: 'The NAT gateway is doing the same thing any public resource does — it has an Elastic IP and it needs a way out. It is a *public-subnet* resource whose whole job is serving private ones.',
        },
        {
          title: 'And every arrow points one way',
          md: 'Nothing on the internet can initiate a connection inward, because there is no inbound translation and no public address to aim at. Connections start from inside and only from inside — that is the entire point of NAT, and it is what a public IP would have thrown away.',
        },
      ],
    },

    /* ── 4. The wrong answers, which are the expensive ones ──────────────── */
    { kind: 'heading', text: 'The three things this is confused with' },
    {
      kind: 'compare',
      title: 'All three change reachability, and only one of them reaches the internet',
      columns: ['Internet gateway', 'NAT gateway', 'Gateway endpoint'],
      rows: [
        {
          label: 'Direction',
          cells: ['Both ways', 'Outbound only', 'Outbound only, to one AWS service'],
        },
        {
          label: 'For resources with',
          cells: ['A public or Elastic IP', 'Private addresses only', 'Private addresses only'],
        },
        {
          label: 'Reaches the actual internet',
          cells: ['Yes', 'Yes', 'No — and that is the selling point'],
        },
        {
          label: 'Mechanism',
          cells: [
            'A route target, plus 1:1 address translation',
            'A route target, in a public subnet',
            'A prefix-list route in the table',
          ],
        },
        {
          label: 'Costs',
          cells: ['Nothing', 'Hourly plus per GB', 'Nothing'],
        },
        {
          label: 'Scope',
          cells: ['One per VPC, regional', 'Zonal — one per AZ', 'S3 and DynamoDB only'],
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'money',
      title: 'Two requirement phrasings, two different answers',
      md: '*"Our NAT gateway data-processing charges are too high"* is a **gateway endpoint** question for [[s3]] and [[dynamodb]] traffic, and interface endpoints for other AWS APIs. *"Traffic must not traverse the public internet"* is also an endpoint question, and NAT is the thing that requirement is ruling out. Consolidating three NAT gateways into one is the trap in both: it cuts the hourly fee, and it adds cross-AZ data charges and a single point of failure.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'And two devices that are not what their names suggest',
      md: 'An **egress-only internet gateway** is the IPv6 equivalent of a NAT gateway, not of an internet gateway — IPv6 addresses are all public, so "outbound only" needs its own device. A **NAT instance** is the legacy self-managed alternative: you patch it, you size it, and you must disable source/destination checking. The NAT gateway is the default correct answer.',
    },

    /* ── 5. The case that catches developers ─────────────────────────────── */
    { kind: 'heading', text: 'The same four gates, wearing a Lambda costume' },
    {
      kind: 'prose',
      md: 'A [[lambda]] function attached to a VPC is subject to all of this, and nothing about it is special. It belongs in **private** subnets: put it in a public one and it still has no internet access, because it gets no public address for the gateway to translate. If it needs to call a third-party API, its subnet needs a NAT gateway route like anything else private — and if it only calls AWS APIs, an endpoint is cheaper. This is one of the most common real-world surprises and a recurring exam item.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'A security group cannot create a route',
      md: 'When a question about something that cannot reach out offers you a more permissive security group, that option is always wrong. Permission and routing are different questions: **a packet needs a route and it needs permission**, and the paper removes one of the two. If the security groups and the NACLs both look correct, it is a missing route — and peering, VPN and Transit Gateway all need entries added on *both* sides.',
    },

    /* ── 6. Numbers, last ────────────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Internet gateways per VPC', value: '1' },
        {
          label: 'Internet gateway cost',
          value: 'No hourly or per-GB charge for the gateway itself',
        },
        { label: 'NAT gateway placement', value: 'In a public subnet, with an Elastic IP' },
        {
          label: 'NAT gateway availability',
          value: 'Highly available *within its AZ only* — one per AZ for AZ-fault tolerance',
        },
        { label: 'NAT gateway cost', value: 'Hourly charge plus per-GB data processing' },
        { label: 'NAT gateway bandwidth', value: 'Scales automatically to 100 Gbps' },
        {
          label: 'NAT gateway ports',
          value: 'Up to 55,000 simultaneous connections per unique destination',
        },
        { label: 'Ephemeral port range', value: '1024–65535 for return traffic' },
      ],
    },

    /* ── 7. Next ─────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'The objects in this lesson',
      slugs: ['vpc', 'nat-gateway', 'privatelink', 'nacl'],
    },
    {
      kind: 'prose',
      md: 'Gate four is the one this lesson treated most lightly, and it is the one that fails in the strangest way: the request arrives, and the reply disappears. That is [[nacl|network ACLs]], and [[stateful-filtering|statelessness]] is why. It is the next lesson.',
    },
  ],

  checks: [
    {
      id: 'why-cant-it-reach-the-internet-order',
      prompt:
        'A public instance is unreachable from the internet. Which single object should you look at first?',
      options: [
        {
          text: 'The subnet’s route table',
          correct: true,
          why: 'It is the gate that fails most often and the only one that is invisible from the instance itself — you have to go and look at a separate object. If there is no 0.0.0.0/0 route, no filter is even consulted.',
        },
        {
          text: 'The network ACL on the subnet',
          correct: false,
          why: 'Check it third. The default ACL allows everything in both directions, so it is only the answer when a custom one has been attached.',
        },
        {
          text: 'The instance’s operating system firewall',
          correct: false,
          why: 'Almost never the subject of an exam question in this family, and there are three AWS-layer gates to eliminate first.',
        },
      ],
    },
    {
      id: 'why-cant-it-reach-the-internet-nat-subnet',
      prompt:
        'You create a NAT gateway in the private subnet whose instances need outbound access, and point that subnet’s 0.0.0.0/0 at it. What happens?',
      options: [
        {
          text: 'Nothing gets out — the NAT gateway must be in a different subnet from the instances routing to it',
          correct: true,
          why: 'A subnet has one route table, so the NAT gateway’s own default route would point at itself. It belongs in a public subnet whose table points at the internet gateway.',
        },
        {
          text: 'It works, and it saves the cross-subnet data charge',
          correct: false,
          why: 'There is no such charge to save, and it does not work. This is the tidy-looking wrong answer.',
        },
        {
          text: 'It works only if the private subnet also has a route to the internet gateway',
          correct: false,
          why: 'A subnet with a route to the internet gateway is a public subnet by definition, which throws away the reason for using NAT at all.',
        },
      ],
    },
    {
      id: 'why-cant-it-reach-the-internet-endpoint',
      prompt:
        'Private instances write large volumes to an S3 bucket through a NAT gateway, and the data-processing charge has become the biggest line on the bill. What is the fix?',
      options: [
        {
          text: 'A gateway VPC endpoint for S3, which adds a route and is free',
          correct: true,
          why: 'Gateway endpoints cover S3 and DynamoDB only, work by changing the route table, and cost nothing — so the traffic leaves the NAT gateway’s meter entirely.',
        },
        {
          text: 'Consolidating the three NAT gateways into one to cut the hourly charge',
          correct: false,
          why: 'The hourly charge is the smaller half, and this adds cross-AZ data charges plus a single point of failure for egress. It is the classic cost-question trap: saving money by removing redundancy.',
        },
        {
          text: 'An interface endpoint for S3, since interface endpoints are the general-purpose kind',
          correct: false,
          why: 'It would work and it is the wrong half of the pair: interface endpoints bill hourly and per GB. S3 and DynamoDB have the free gateway kind, and knowing which is which is the point of the question.',
        },
      ],
    },
    {
      id: 'why-cant-it-reach-the-internet-lambda',
      prompt:
        'A Lambda function attached to a VPC cannot reach a third-party HTTPS API. It is in a public subnet with a 0.0.0.0/0 route to the internet gateway. Why?',
      options: [
        {
          text: 'It has no public address, so it needs a private subnet with a NAT gateway route',
          correct: true,
          why: 'A VPC-attached function gets no public IP, and a route to an internet gateway is useless without one. Private subnets plus NAT is the only shape that works.',
        },
        {
          text: 'Lambda cannot make outbound HTTPS calls when attached to a VPC',
          correct: false,
          why: 'It can. Attaching it to a VPC gives it private-subnet networking, with everything that implies — not a prohibition.',
        },
        {
          text: 'Its execution role is missing a permission for outbound network access',
          correct: false,
          why: 'IAM does not govern network reachability. This is a routing and addressing problem, and no policy can create a path.',
        },
      ],
    },
  ],
}
