import type { Lesson } from '../schema'

/**
 * Batch 1 of the reachability cluster, and the lesson the other two stand on.
 *
 * Every fact here is already in the atlas — the `vpc` service entry and the
 * `subnet`, `route-table`, `internet-gateway` and `cidr` concepts. What the atlas
 * cannot do is put them in this order, and the order is the whole teaching: two
 * subnets that are identical in every visible way behave differently, and the
 * reader watches the packet reach the table and stop before the word "route" is
 * doing any work.
 *
 * `saa-3.4` rather than 1.2: the task statement names "subnet tiers, routing, IP
 * addressing" explicitly, and `security-groups` already carries 1.2. The
 * reachability *troubleshooting* lesson is the 1.2 one.
 */
export const subnetsAndRouteTables: Lesson = {
  id: 'subnets-and-route-tables',
  families: ['saa'],
  taskId: 'saa-3.4',
  cluster: 'reachability',
  title: 'Subnets and route tables',
  subtitle:
    'There is no setting that makes a subnet public. Two subnets can be identical in every visible way and behave differently, and the difference is one line in a table that is not part of either of them.',
  minutes: 14,
  tier: 1,
  serviceSlugs: ['vpc', 'nat-gateway', 'ec2'],
  requires: [],
  cardIds: [
    'define:subnet',
    'define:route-table',
    'num:concept:subnet:azs-per-subnet',
    'num:concept:subnet:usable-addresses',
    'num:concept:route-table:the-local-route',
    'num:vpc:reserved-addresses-per-subnet',
    'num:vpc:cidr-size',
    'trap:concept:subnet:there-is-no-public-subnet-setting-a-subnet-is-public-beca',
    'trap:concept:route-table:attaching-an-internet-gateway-to-the-vpc-does-nothing-on-its',
    'vs:concept:route-table:stateful-filtering',
  ],

  sections: [
    /* ── 1. The hook: name the surprise, do not explain it ───────────────── */
    {
      kind: 'prose',
      md: 'Two [[subnet|subnets]] in one [[vpc]]. Same size, same [[availability-zone|AZ]], same kind of instance inside, both created the same way. One can reach the internet and one cannot, and nothing you can see on either subnet says which is which. There is no checkbox. The thing that decides it is a single line in a [[route-table|route table]] — an object that is not part of the subnet at all, and that a subnet merely points at. Watch a packet run into it.',
    },

    /* ── 2. Watch it happen, before the definition ───────────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'srt-two-tables',
        title: 'One VPC, two subnets, two route tables',
        caption:
          'Both instances send a packet to the same place. Follow each one as far as its route table and stop there.',
        // Template B: a left-to-right chain that fans out. The fan is in the
        // middle rather than at the end because the two tails are the teaching —
        // they are the same journey with a different table at the junction.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'internet',
            label: 'Internet',
            sub: '1.1.1.1, say',
            kind: 'internet',
            x: 18,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'igw',
            label: 'Internet gateway',
            sub: 'attached to the VPC',
            kind: 'note',
            x: 12.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'rt-public',
            label: 'rtb-public',
            sub: 'local + 0.0.0.0/0',
            kind: 'note',
            x: 6.2,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'rt-private',
            label: 'rtb-private',
            sub: 'local only',
            kind: 'note',
            x: 6.2,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'ec2-web',
            label: 'EC2',
            sub: '10.0.1.20',
            kind: 'service',
            category: 'compute',
            x: 0.2,
            y: 0.9,
            w: 3,
            h: 1.3,
          },
          {
            id: 'dropped',
            label: 'Dropped',
            sub: 'inside the VPC',
            kind: 'note',
            x: 12.4,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'ec2-db',
            label: 'EC2',
            sub: '10.0.2.30',
            kind: 'service',
            category: 'compute',
            x: 0.2,
            y: 5.7,
            w: 3,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'web-rt', from: 'ec2-web', to: 'rt-public', label: 'the packet', tone: 'default' },
          { id: 'rt-igw', from: 'rt-public', to: 'igw', label: '0.0.0.0/0', tone: 'ok' },
          { id: 'igw-net', from: 'igw', to: 'internet', label: 'out', tone: 'ok' },
          { id: 'db-rt', from: 'ec2-db', to: 'rt-private', label: 'the packet', tone: 'default' },
          { id: 'db-dead', from: 'rt-private', to: 'dropped', label: 'no match', tone: 'bad' },
        ],
        groups: [
          {
            id: 'vpc',
            label: 'VPC 10.0.0.0/16',
            kind: 'vpc',
            nodeIds: ['igw', 'rt-public', 'rt-private', 'dropped'],
          },
          {
            id: 'sn-pub',
            label: 'subnet-a 10.0.1.0/24',
            kind: 'subnet-public',
            nodeIds: ['ec2-web'],
            parent: 'vpc',
          },
          {
            id: 'sn-priv',
            label: 'subnet-b 10.0.2.0/24',
            kind: 'subnet-private',
            nodeIds: ['ec2-db'],
            parent: 'vpc',
          },
        ],
        steps: [
          {
            edgeIds: ['web-rt'],
            title: 'The packet leaves the first instance',
            detail:
              'It is addressed to something outside 10.0.0.0/16, so the instance cannot deliver it locally. It goes to whichever route table subnet-a is associated with, which is the only question that matters.',
            tone: 'default',
          },
          {
            edgeIds: ['rt-igw', 'igw-net'],
            title: 'That table has a 0.0.0.0/0 entry, so out it goes',
            detail:
              'One line: destination `0.0.0.0/0`, target the internet gateway. That line, and nothing else, is what makes subnet-a a public subnet.',
            tone: 'ok',
          },
          {
            edgeIds: ['db-rt', 'db-dead'],
            title: 'The identical packet from the second instance stops here',
            detail:
              'subnet-b points at a table holding only the local route. Nothing matches `1.1.1.1`, so the packet is dropped inside the VPC — it never reaches a firewall, so no security group or [[nacl|network ACL]] is involved and none of them can help.',
            tone: 'bad',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the word',
      md: 'A **public subnet** is a subnet whose route table sends `0.0.0.0/0` to an [[internet-gateway|internet gateway]]. That is the entire definition. Associate `rtb-public` with subnet-b and subnet-b is public; associate `rtb-private` with subnet-a and the web server goes dark. Nothing about either subnet changed.',
    },

    /* ── 3. The real tables, read out one line at a time ─────────────────── */
    { kind: 'heading', text: 'What a route table actually looks like' },
    {
      kind: 'code',
      lang: 'text',
      caption: 'The two tables from the diagram, complete',
      code: `rtb-public                          rtb-private
  destination     target              destination     target
  10.0.0.0/16     local               10.0.0.0/16     local
  0.0.0.0/0       igw-0abc1234

associated with: subnet-a            associated with: subnet-b`,
    },
    {
      kind: 'steps',
      title: 'The same two tables, one line at a time',
      items: [
        {
          title: '10.0.0.0/16 → local, in both',
          md: 'The **local route** is the VPC [[cidr]] itself. It is always present, and it cannot be deleted or overridden. It is why anything in a VPC can reach anything else in it at the network layer — including across subnets and across AZs, with no configuration at all.',
        },
        {
          title: '0.0.0.0/0 → igw-0abc1234, in one of them',
          md: 'Everything that is not in the VPC. `0.0.0.0/0` is the *least* specific prefix there is, so it only ever applies to traffic no other entry claims — which is exactly what a default route should do.',
        },
        {
          title: 'Two entries beat each other by prefix length, not by position',
          md: 'Routing is **most-specific-prefix-wins**, not top-to-bottom. A `10.0.5.0/24` entry beats `0.0.0.0/0` for an address inside it whatever order they are printed in. There is no rule numbering here and no first-match — that is a [[nacl|network ACL]], and confusing the two is a straightforward lost mark.',
        },
        {
          title: 'One table, many subnets — and a main table for the rest',
          md: 'A subnet is associated with exactly one route table, but a table can serve any number of subnets. A subnet you never explicitly associate inherits the VPC **main** route table, which is the quiet way a subnet you thought was isolated turns out to have a `0.0.0.0/0` route.',
        },
      ],
    },

    /* ── 4. The wrong answer, written out as real configuration ──────────── */
    { kind: 'heading', text: 'Two things that look like they would work' },
    {
      kind: 'prose',
      md: 'The instance in subnet-b needs to reach the internet. Two moves feel right and neither of them does anything. Here they are, written out:',
    },
    {
      kind: 'code',
      lang: 'text',
      caption: 'Attempt 1 — attach an internet gateway to the VPC',
      code: `VPC 10.0.0.0/16
  internet gateway: igw-0abc1234   attached  <-- already was, for subnet-a

rtb-private
  destination     target
  10.0.0.0/16     local                      <-- unchanged, so nothing changed`,
    },
    {
      kind: 'code',
      lang: 'text',
      caption: 'Attempt 2 — give the instance a public address',
      code: `subnet-b
  auto-assign public IPv4: enabled           <-- now the instance has 54.x.x.x

rtb-private
  destination     target
  10.0.0.0/16     local                      <-- still no way out`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Both of these are wrong answers on the paper',
      md: 'Attaching an internet gateway **does nothing on its own** — and only one can be attached to a VPC at a time, so in almost every scenario it is already attached. A public address on an instance in a subnet with no `0.0.0.0/0` route is an address nothing can use. When an option offers you either of these as the fix, the question is testing whether you know the route is the load-bearing part.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'The one that bites in the other direction',
      md: 'Auto-assign public IPv4 is a **subnet** setting, and it catches people both ways round: on, and a resource you meant to keep private is addressable the moment its route table gains a default route; off, and an instance in a genuinely public subnet still cannot be reached, because it has no public address for the gateway to translate.',
    },

    /* ── 5. The three shapes of subnet, which is what the exam asks for ──── */
    { kind: 'heading', text: 'So there are three shapes, not two' },
    {
      kind: 'prose',
      md: '"Public or private" is the way people talk, but a route table gives you three distinct outcomes, and a requirement usually describes one of them precisely enough to pick it. The middle one is the one designs actually use for application and database tiers: it can fetch patches, and nothing can start a conversation with it.',
    },
    {
      kind: 'compare',
      title: 'The 0.0.0.0/0 entry decides which one you have',
      columns: ['Public', 'Private with egress', 'Isolated'],
      rows: [
        {
          label: '0.0.0.0/0 target',
          cells: ['Internet gateway', 'NAT gateway', 'No 0.0.0.0/0 entry at all'],
        },
        {
          label: 'Can start outbound connections',
          cells: ['Yes', 'Yes', 'No'],
        },
        {
          label: 'Can receive inbound connections',
          cells: ['Yes, if it has a public address', 'No, ever', 'No'],
        },
        {
          label: 'Typical occupant',
          cells: [
            'Load balancer, NAT gateway, bastion',
            'App servers, Lambda in a VPC',
            'Database tier, regulated data',
          ],
        },
        {
          label: 'Costs anything',
          cells: ['Gateway is free', 'NAT: hourly plus per GB', 'Nothing'],
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'money',
      title: 'And the third one is where the endpoint questions live',
      md: 'An isolated subnet can still reach [[s3]] and [[dynamodb]] privately, by adding a **gateway endpoint** — which works by putting a prefix-list route in the table, so it is the same mechanism this whole lesson is about. It is free, and it keeps that traffic off both the internet and the [[nat-gateway|NAT gateway]] bill. Whenever a requirement says traffic *must not traverse the public internet*, this is the shape being asked for, and NAT is the distractor.',
    },

    /* ── 6. The other decision a subnet makes, which is not about routing ── */
    { kind: 'heading', text: 'The other half of what a subnet decides' },
    {
      kind: 'prose',
      md: 'Everything above is about the route table, and a subnet is two decisions at once. The second one has nothing to do with reachability: a subnet lives in **exactly one** [[availability-zone|Availability Zone]], always. So "which subnet" is simultaneously "which route table applies" and "which failure domain am I in", and that is why the answer to a resilience question is so often *more subnets*.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'What "multi-AZ" means when you are reading options',
      md: 'It means at least two subnets in different AZs, on **every component in the path** — the load balancer will not even accept a configuration with fewer than two, and the NAT gateway is the one most designs forget, because it is zonal too. An option with a single subnet is wrong however good the rest of it looks.',
    },
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        {
          label: 'AZs per subnet',
          value: 'Exactly 1',
          note: 'This is the whole reason subnets exist.',
        },
        { label: 'Usable addresses', value: 'Block size minus 5' },
        {
          label: 'Reserved addresses per subnet',
          value: '5',
          note: 'Network address, VPC router, DNS, future use, broadcast. A /28 gives you 11 usable.',
        },
        { label: 'CIDR size', value: '/16 (65,536 addresses) down to /28 (16)' },
        {
          label: 'The local route',
          value: 'The VPC CIDR, always present, cannot be deleted or overridden',
        },
        { label: 'Internet gateways per VPC', value: '1' },
        { label: 'Subnets per VPC', value: '200 by default', volatile: true },
        { label: 'Route tables per VPC', value: '200 by default', volatile: true },
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Subtract five before you compare against a requirement',
      md: 'A `/24` has 256 addresses and 251 usable. A question that gives you a host count and a block size is testing exactly this, and it is engineered so that the answer you get without subtracting is one of the options.',
    },

    /* ── 7. Where this goes next ─────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'The rest of the reachability picture',
      slugs: ['vpc', 'nat-gateway', 'security-group', 'nacl'],
    },
    {
      kind: 'prose',
      md: 'A packet needs a **route** and it needs **permission**, and an exam question removes exactly one of the two. This lesson was the route. Permission is [[security-group|security groups]] and [[nacl|network ACLs]] — and when something that should work does not, the next lesson is the order to check the four possible causes in.',
    },
  ],

  checks: [
    {
      id: 'subnets-and-route-tables-public',
      prompt:
        'An instance in a subnet has a public IPv4 address, a security group allowing all traffic, and the VPC has an internet gateway attached. It still cannot reach the internet. What is missing?',
      options: [
        {
          text: 'A 0.0.0.0/0 route to the internet gateway in the subnet’s route table',
          correct: true,
          why: 'The gateway being attached does nothing until a route table points at it. This is the definition of a public subnet and there is no other way to get one.',
        },
        {
          text: 'The public subnet setting on the subnet',
          correct: false,
          why: 'There is no such setting. "Public subnet" is a description of what the route table says, not a property you can turn on.',
        },
        {
          text: 'A second internet gateway, because one is already serving the public subnets',
          correct: false,
          why: 'Only one internet gateway can be attached to a VPC at a time, and one is all a VPC ever needs — it is horizontally scaled with no bandwidth limit of its own.',
        },
      ],
    },
    {
      id: 'subnets-and-route-tables-local',
      prompt:
        'Two subnets are in the same VPC and must not be able to reach each other at all. You remove every route between them. What happens?',
      options: [
        {
          text: 'Nothing changes — they can still reach each other, and you need security groups or NACLs',
          correct: true,
          why: 'The local route covers the whole VPC CIDR and cannot be deleted or overridden, so routing cannot isolate two subnets from each other. Isolation inside a VPC is always a filtering job.',
        },
        {
          text: 'They become isolated, because a subnet with no route to the other cannot reach it',
          correct: false,
          why: 'There was never a route between them to remove. The local route is what carried that traffic, and it is not removable.',
        },
        {
          text: 'They become isolated only if they are in different Availability Zones',
          correct: false,
          why: 'The local route is VPC-wide and crosses AZs freely. AZ boundaries are about failure domains, not reachability.',
        },
      ],
    },
    {
      id: 'subnets-and-route-tables-shapes',
      prompt:
        'An application tier must be able to download OS patches from the internet, but nothing on the internet may be able to open a connection to it. What does its route table need?',
      options: [
        {
          text: '0.0.0.0/0 pointing at a NAT gateway',
          correct: true,
          why: 'Outbound-only is exactly what NAT is for: connections can start from inside and never from outside. This is the private-with-egress shape, and it is what most application and database tiers use.',
        },
        {
          text: '0.0.0.0/0 pointing at the internet gateway, with a security group allowing no inbound',
          correct: false,
          why: 'It would work today and it is the wrong shape: the subnet is now public, and one over-permissive group away from being reachable. The requirement says the path must not exist, not that it must be filtered.',
        },
        {
          text: 'No 0.0.0.0/0 entry, so that nothing can get in',
          correct: false,
          why: 'That is the isolated shape, and it also stops the patch downloads the requirement asks for.',
        },
      ],
    },
    {
      id: 'subnets-and-route-tables-usable',
      prompt:
        'A team needs a subnet with room for 12 instances and wants the smallest block that fits. Which one?',
      options: [
        {
          text: 'A /28, which has 16 addresses and 11 usable — so it does not fit, and they need a /27',
          correct: true,
          why: 'AWS reserves five addresses in every subnet, so a /28 leaves 11. Always subtract five before comparing against a host count.',
        },
        {
          text: 'A /28, which has 16 addresses and therefore room for 12 instances with 4 spare',
          correct: false,
          why: 'This is the answer the question is engineered to produce if you forget the five reserved addresses.',
        },
        {
          text: 'A /29, because 8 addresses are enough once the instances share an ENI',
          correct: false,
          why: 'Instances do not share network interfaces that way, and a /29 leaves 3 usable addresses.',
        },
      ],
    },
  ],
}
