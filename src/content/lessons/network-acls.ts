import type { Lesson } from '../schema'

/**
 * The contrast lesson, and the reason it is third: it only works once
 * `security-groups` has established that a firewall can remember a connection.
 * Stateless is not a property you can teach cold — it is only surprising, and
 * therefore only memorable, against something stateful.
 *
 * Every fact is on the `nacl` service entry and the `stateful-filtering` concept.
 * The order is the contribution: the reply is dropped in front of the reader
 * before the word "stateless" appears, then the rule that would have saved it is
 * added and the same walkthrough succeeds. That second half is what turns the
 * ephemeral-port rule from trivia into the obvious consequence of one idea.
 */
export const networkAcls: Lesson = {
  id: 'network-acls',
  families: ['saa'],
  taskId: 'saa-1.2',
  title: 'Network ACLs',
  subtitle:
    'A filter that does not remember anything. The reply to a request it just allowed is, as far as it is concerned, a new packet arriving from a stranger — and everything people get wrong about NACLs follows from that.',
  minutes: 13,
  tier: 1,
  serviceSlugs: ['nacl', 'security-group', 'vpc', 'network-firewall'],
  requires: ['security-groups'],
  cardIds: [
    'num:nacl:stateless',
    'num:nacl:rule-evaluation',
    'num:nacl:ephemeral-port-range',
    'num:nacl:default-nacl',
    'num:nacl:custom-nacl',
    'num:nacl:association',
    'define:stateful-filtering',
    'trap:nacl:the-last-rule-is-always-an-unnumbered-deny-that-cannot-b',
    'trap:nacl:rule-order-matters-a-deny-at-rule-100-beats-an-allow-at-rul',
    'trap:nacl:a-newly-created-custom-nacl-blocks-everything-attaching-one',
    'trap:nacl:add-the-ephemeral-port-outbound-allow-rule-or-nothing-will',
    'which:nacl',
  ],

  sections: [
    /* ── 1. The hook, which only works because of the previous lesson ────── */
    {
      kind: 'prose',
      md: 'A [[security-group|security group]] allows the reply to a request it let through, because it remembers letting it through. A [[nacl|network ACL]] sits one layer out, at the subnet edge, and remembers **nothing at all**. So the reply to a request it just allowed is not a reply — it is a new packet, arriving from a stranger, on a port nobody has ever mentioned. Here is the same walkthrough as the security groups lesson, at the subnet boundary instead of the interface.',
    },

    /* ── 2. Watch the reply be dropped, before the word ──────────────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'nacl-drop',
        title: 'Inbound 443 allowed, and the reply still does not arrive',
        caption:
          'The rules are the ones almost everybody writes first. Advance the walkthrough and watch where it fails.',
        // Template A, deliberately the same coordinates as the security-groups
        // lesson: the reader should recognise the picture and notice that only
        // the box the filter sits on has moved outwards.
        cols: 13,
        rows: 6,
        nodes: [
          {
            id: 'internet',
            label: 'Client',
            sub: 'source port 51234',
            kind: 'internet',
            x: 0.4,
            y: 0.4,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'ec2',
            label: 'EC2',
            sub: 'listening on 443',
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
          { id: 'res', from: 'ec2', to: 'internet', label: 'to port 51234', tone: 'bad' },
        ],
        groups: [
          { id: 'vpc', label: 'VPC', kind: 'vpc', nodeIds: [] },
          {
            id: 'subnet',
            label: 'Public subnet — custom NACL',
            kind: 'subnet-public',
            nodeIds: ['ec2'],
            parent: 'vpc',
          },
        ],
        steps: [
          {
            edgeIds: ['req'],
            title: 'Inbound rule 100 allows TCP 443. The request arrives.',
            detail:
              'Exactly as intended, and exactly as a security group would have behaved. Nothing has gone wrong yet, which is what makes the next step land.',
            tone: 'ok',
          },
          {
            edgeIds: ['res'],
            title: 'The reply is judged on its own, and dropped',
            detail:
              'It is leaving, so the **outbound** rules apply — and it is addressed to port 51234, which the client chose for itself. There is no outbound rule covering it, so the unnumbered `*` deny catches it. The client sees a connection that opened and then hung.',
            tone: 'bad',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the word',
      md: 'Network ACLs are **stateless**: inbound and outbound are judged independently, and the response to an allowed inbound request is not automatically permitted out. [[stateful-filtering]] is the concept card, and this one distinction is the most-asked networking fact on the paper.',
    },

    /* ── 3. The real rule table, read out line by line ───────────────────── */
    { kind: 'heading', text: 'What the rules actually look like' },
    {
      kind: 'code',
      lang: 'text',
      caption: 'The NACL from the diagram — the version that does not work',
      code: `INBOUND
  rule    protocol   port    source          action
   100    TCP         443    0.0.0.0/0       allow
     *    all         all    0.0.0.0/0       deny      <-- cannot be edited

OUTBOUND
     *    all         all    0.0.0.0/0       deny      <-- and this is the bug`,
    },
    {
      kind: 'code',
      lang: 'text',
      caption: 'The one line that fixes it',
      code: `OUTBOUND
  rule    protocol   port           destination     action
   100    TCP        1024-65535     0.0.0.0/0       allow
     *    all        all            0.0.0.0/0       deny`,
    },
    {
      kind: 'steps',
      title: 'The same table, one line at a time',
      items: [
        {
          title: 'Rules are numbered, and evaluated lowest number first',
          md: 'Evaluation **stops at the first match**. This is the opposite of a security group, where all rules across all attached groups are evaluated together and order is irrelevant. If a question is about rule *order*, it is about a NACL.',
        },
        {
          title: 'Which means a deny at 100 beats an allow at 200',
          md: 'For the same traffic, whichever rule has the lower number wins, regardless of which is more specific and regardless of which was added first. Renumbering is how you change the outcome, and this is the only filter in the VPC where that sentence is true.',
        },
        {
          title: 'The last rule is always an unnumbered `*` deny',
          md: 'It cannot be edited or removed. A packet that matches nothing is dropped — so every NACL is closed at the bottom, on both directions independently.',
        },
        {
          title: '1024–65535 on the outbound side, because the client picked the port',
          md: 'The client chose 51234 itself, so no rule could have named it in advance. The **ephemeral port range** is the whole range it might have chosen. Add that outbound allow, or nothing will get a reply — and note that allowing it is most of the protection gone, which is the honest cost of a stateless filter.',
        },
        {
          title: 'And the same asymmetry in reverse',
          md: 'A NACL that denies *inbound* on the ephemeral range breaks every outbound connection made from inside the subnet — package installs, API calls, agent traffic — while leaving inbound web traffic working perfectly. That is a very confusing failure to read, and it is a favourite scenario.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'The default one and a new one behave oppositely',
      md: 'The **default** NACL that comes with a VPC allows all inbound and all outbound, which is why NACLs are invisible in most working accounts. A **custom** NACL denies everything until you add rules — so attaching a freshly created one to a working subnet takes it offline immediately. That is the single most common NACL troubleshooting scenario there is.',
    },

    /* ── 4. What it is actually for, which is the one thing SGs cannot do ── */
    { kind: 'heading', text: 'So why use one at all?' },
    {
      kind: 'prose',
      md: 'Given all that, a NACL looks like a worse security group. For ordinary tier-to-tier access control it is: security groups are stateful and far easier to get right. A NACL earns its place for two things, and the first one is the reason it exists at all.',
    },
    {
      kind: 'steps',
      title: 'The two jobs',
      items: [
        {
          title: 'Deny — which a security group physically cannot express',
          md: 'Every security group rule is an allow rule; there is no action to choose. So *"block this address or range"* is a NACL, and if the thing to block is an HTTP pattern rather than an address, [[waf|AWS WAF]]. This is the cleanest keyword-to-answer mapping in the networking domain.',
        },
        {
          title: 'A boundary the workload owner does not control',
          md: 'A security group attaches to an interface, so anyone who can launch an instance chooses its rules. There is no way to say *"nothing in this subnet may ever talk to that range"* and have it hold. A NACL is subnet-scoped and belongs to whoever administers the network, which is why compliance requirements ask for one.',
        },
      ],
    },
    {
      kind: 'compare',
      title: 'What the requirement says, and which filter it is pointing at',
      columns: ['The answer', 'Why the other is wrong'],
      rows: [
        {
          label: '"Block a specific IP address or range"',
          cells: ['Network ACL', 'Security groups are allow-only — no deny exists to write'],
        },
        {
          label: '"Isolate two instances in the same subnet"',
          cells: [
            'Security group',
            'The traffic never crosses the subnet edge, so the NACL never sees it',
          ],
        },
        {
          label: '"Traffic goes out but nothing comes back"',
          cells: [
            'Network ACL, missing the ephemeral range',
            'A security group would have allowed the reply automatically',
          ],
        },
        {
          label: '"Rules must be evaluated in a defined order"',
          cells: ['Network ACL', 'Security group rules have no numbering and no order'],
        },
        {
          label: '"Only these approved domain names"',
          cells: [
            '[[network-firewall|AWS Network Firewall]]',
            'NACLs match IP, port and protocol only — they cannot see a hostname',
          ],
        },
        {
          label: '"An SQL injection attempt in the request body"',
          cells: ['[[waf|AWS WAF]]', 'Neither filter reads above layer 4'],
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'They are not alternatives, they are layers',
      md: 'A packet entering a subnet is judged by the NACL first and the security group second, and it needs to pass both. In practice almost every design leaves the default permissive NACL in place and does its real work in security groups, adding a NACL only for the two jobs above. An exam question that has both in play is nearly always testing the stateful/stateless split.',
    },

    /* ── 5. Numbers, last ────────────────────────────────────────────────── */
    {
      kind: 'numbers',
      title: 'Worth knowing cold',
      items: [
        { label: 'Stateless', value: 'Return traffic needs its own explicit rule' },
        { label: 'Rule evaluation', value: 'Lowest rule number first, stops at the first match' },
        {
          label: 'Ephemeral port range',
          value: '1024–65535 for return traffic',
          note: 'Linux typically uses 32768–60999.',
        },
        { label: 'Default NACL', value: 'Allows all inbound and outbound' },
        { label: 'Custom NACL', value: 'Denies everything until you add rules' },
        { label: 'Association', value: 'One NACL per subnet; one NACL can cover many subnets' },
        { label: 'Cost', value: 'Free' },
      ],
    },

    /* ── 6. Next ─────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'The filters, end to end',
      slugs: ['nacl', 'security-group', 'network-firewall', 'waf'],
    },
    {
      kind: 'prose',
      md: 'That closes the reachability cluster: a packet needs a **route** ([[route-table]]), and it needs **permission** at two layers ([[nacl|NACL]] then [[security-group|security group]]). When something cannot be reached, check them in the order the previous lesson gave — route table, security group, NACL, public address — and you will have named the fault before you have finished reading the options.',
    },
  ],

  checks: [
    {
      id: 'network-acls-ephemeral',
      prompt:
        'A subnet has a custom NACL allowing inbound TCP 443 and nothing else. Clients connect and then hang. What is missing?',
      options: [
        {
          text: 'An outbound allow rule for TCP 1024–65535',
          correct: true,
          why: 'Stateless means the reply is judged by the outbound rules, and it is addressed to the ephemeral port the client chose. With no rule covering it, the unnumbered deny drops it.',
        },
        {
          text: 'An outbound allow rule for TCP 443',
          correct: false,
          why: 'The reply leaves *from* 443 and is addressed *to* the client’s ephemeral port. Outbound rules match the destination port, so this rule would not cover it.',
        },
        {
          text: 'Nothing — the security group must be denying the reply',
          correct: false,
          why: 'A security group is stateful and allows the reply automatically. It cannot be the cause of this symptom.',
        },
      ],
    },
    {
      id: 'network-acls-order',
      prompt:
        'A NACL has an allow for 0.0.0.0/0 on port 443 at rule 200, and a deny for 198.51.100.7/32 at rule 100. What happens to traffic from 198.51.100.7?',
      options: [
        {
          text: 'It is denied — evaluation is lowest number first and stops at the first match',
          correct: true,
          why: 'Rule 100 matches, so rule 200 is never reached. Ordering is the mechanism, not specificity and not the order the rules were created in.',
        },
        {
          text: 'It is allowed, because the more specific /32 rule loses to the broader allow',
          correct: false,
          why: 'Specificity decides routing, not NACL evaluation. Here the lower rule number wins.',
        },
        {
          text: 'It is allowed, because a deny cannot override an existing allow',
          correct: false,
          why: 'NACLs support deny as a first-class action, and a lower-numbered deny is exactly how you block an address.',
        },
      ],
    },
    {
      id: 'network-acls-custom',
      prompt:
        'You create a new custom NACL and associate it with a working production subnet, intending to add rules afterwards. What happens?',
      options: [
        {
          text: 'The subnet goes offline immediately — a new custom NACL denies everything',
          correct: true,
          why: 'Only the default NACL is permissive. A custom one starts closed in both directions, which is why this is a favourite troubleshooting scenario.',
        },
        {
          text: 'Nothing changes until you add a deny rule',
          correct: false,
          why: 'That describes the default NACL. A custom one needs allow rules before anything passes.',
        },
        {
          text: 'Traffic continues, because the security groups still allow it',
          correct: false,
          why: 'A packet must pass both layers. The NACL is judged first, and it is denying everything.',
        },
      ],
    },
    {
      id: 'network-acls-scope',
      prompt:
        'A requirement says two instances sharing one private subnet must not be able to reach each other. Can a NACL enforce it?',
      options: [
        {
          text: 'No — the traffic never crosses the subnet edge, so the NACL never sees it',
          correct: true,
          why: 'A NACL is subnet-scoped. Traffic between two interfaces inside the same subnet is filtered only by security groups, which attach per interface.',
        },
        {
          text: 'Yes, with a deny rule naming each instance’s private address',
          correct: false,
          why: 'The rules would be correct and never consulted. Scope, not expressiveness, is what rules the NACL out here.',
        },
        {
          text: 'Yes, but only if the two instances are in different Availability Zones',
          correct: false,
          why: 'A subnet lives in exactly one AZ, so two instances sharing a subnet share an AZ by definition.',
        },
      ],
    },
  ],
}
