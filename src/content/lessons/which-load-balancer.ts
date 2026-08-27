import type { Lesson } from '../schema'

/**
 * The `optionSet` on the `elb` entry already holds the four-type table, so a
 * type-by-type `compare` here would be a second copy of it (invariant 21). What
 * a table cannot say is *why* the four exist, and the answer is one thing: how
 * far into the request the load balancer is willing to look. Every tell the exam
 * uses — content routing, a static IP, the real client IP, WAF — is a
 * consequence of that single choice.
 *
 * So the picture comes first and it is the same request twice, forking at the
 * point where one of them gets opened. Then the listener rule that could only be
 * written at layer 7, then the two configurations that do not exist, then the
 * half of the service that is not distribution at all — the health check, which
 * is what makes an ELB a resilience component and what an Auto Scaling group is
 * really asking when it says "ELB health check type".
 */
export const whichLoadBalancer: Lesson = {
  id: 'which-load-balancer',
  families: ['saa'],
  taskId: 'saa-3.4',
  title: 'Which load balancer, and why the layer decides',
  subtitle:
    'Four of them, and the choice is never really a preference. It is decided by how deep into the request you need something to look — and every exam tell, from a static IP to a WAF rule, follows from that one answer.',
  minutes: 15,
  tier: 1,
  serviceSlugs: ['elb', 'ec2-auto-scaling'],
  requires: ['rto-rpo-and-the-four-dr-strategies'],
  cardIds: [
    'optset:elb:lb-type',
    'opt:elb:lb-type:application-load-balancer',
    'opt:elb:lb-type:network-load-balancer',
    'opt:elb:lb-type:gateway-load-balancer',
    'opt:elb:lb-type:classic-load-balancer',
    'num:elb:cross-zone-load-balancing',
    'num:elb:sticky-sessions',
    'num:elb:deregistration-delay',
    'num:elb:subnets',
    'trap:elb:static-ip-requirement-means-nlb-alb-s-addresses-change-so',
    'trap:elb:preserving-the-client-source-ip-means-nlb-alb-puts-the-clie',
    'trap:elb:waf-attaches-to-alb-cloudfront-and-api-gateway-not-to-nlb',
    'trap:elb:a-504-means-the-target-timed-out-a-502-means-a-malformed-re',
    'trap:elb:health-check-settings-live-on-the-target-group-not-the-lo',
    'trap:elb:an-internet-facing-load-balancer-needs-public-subnets-the-t',
    'trap:elb:nlb-cross-zone-load-balancing-is-off-by-default-and-when-en',
    'trap:ec2-auto-scaling:turning-on-elb-health-checks-not-just-ec2-status-checks-is',
    'num:ec2-auto-scaling:health-check-grace-period',
    'vs:elb:global-accelerator',
    'vs:elb:route53',
    'vs:ec2-auto-scaling:elb',
  ],

  sections: [
    /* ── 1. The hook ──────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      md: '[[elb|Elastic Load Balancing]] is four products, and a question never names the one it wants. It describes a requirement — routing on a URL path, an address a partner can allowlist, a backend that must log the real caller — and expects you to arrive at a type. Every one of those requirements is answered by the same underlying question, asked once: **how far into the request is this thing willing to look?**',
    },

    /* ── 2. The same request, twice, forking where it is opened ───────────── */
    {
      kind: 'diagram',
      spec: {
        id: 'wlb-how-deep',
        title: 'The same request, and the one decision that changes everything after it',
        caption:
          'As far as the load balancer, nothing differs. What differs is whether the request is opened and read, and both consequences on the right follow from that alone.',
        // Template B, fan-in-the-middle: two parallel tails that are the same
        // journey with a different object at the junction.
        cols: 21,
        rows: 8,
        nodes: [
          {
            id: 'client',
            label: 'Client',
            sub: '203.0.113.7',
            kind: 'user',
            x: 0.2,
            y: 3.3,
            w: 2.8,
            h: 1.3,
          },
          {
            id: 'elb',
            label: 'Load balancer',
            sub: 'two AZs, minimum',
            kind: 'service',
            category: 'network',
            x: 5.4,
            y: 3.3,
            w: 3.4,
            h: 1.3,
          },
          {
            id: 'elb-l7',
            label: 'Opened and read',
            sub: 'Layer 7',
            kind: 'note',
            x: 11,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'elb-l4',
            label: 'Forwarded, unread',
            sub: 'Layer 4',
            kind: 'note',
            x: 11,
            y: 5.7,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'ec2-api',
            label: 'The /api targets',
            sub: 'caller in a header',
            kind: 'service',
            category: 'compute',
            x: 17,
            y: 0.9,
            w: 3.2,
            h: 1.3,
          },
          {
            id: 'ec2-tcp',
            label: 'The target',
            sub: 'caller is 203.0.113.7',
            kind: 'service',
            category: 'compute',
            x: 17,
            y: 5.7,
            w: 3.4,
            h: 1.3,
          },
        ],
        edges: [
          { id: 'req', from: 'client', to: 'elb', label: 'GET /api/v2', tone: 'default' },
          { id: 'up', from: 'elb', to: 'elb-l7', label: 'reads the path', tone: 'info' },
          { id: 'down', from: 'elb', to: 'elb-l4', label: 'reads the port', tone: 'info' },
          { id: 'toapi', from: 'elb-l7', to: 'ec2-api', label: 'routed', tone: 'ok' },
          { id: 'totcp', from: 'elb-l4', to: 'ec2-tcp', label: 'relayed', tone: 'ok' },
        ],
        groups: [],
        steps: [
          {
            edgeIds: ['req'],
            title: 'One request arrives, from one client, at one address',
            detail:
              'Nothing has been decided yet. A load balancer at either layer accepts this connection, and both need subnets in **at least two Availability Zones** to exist at all.',
            tone: 'default',
          },
          {
            edgeIds: ['up', 'toapi'],
            title: 'Open it, and the path becomes something you can route on',
            detail:
              'This is an **Application Load Balancer**: Layer 7, routing on host, path, header, query string and HTTP method. It terminates the connection and opens a new one to the target — so the target sees the load balancer as its caller, and the real client address arrives in the **X-Forwarded-For** header.',
            tone: 'info',
          },
          {
            edgeIds: ['down', 'totcp'],
            title: 'Leave it closed, and the target sees the client itself',
            detail:
              'This is a **Network Load Balancer**: Layer 4, forwarding TCP, UDP and TLS at millions of requests per second. It never reads `/api/v2` — it cannot route on something it has not opened — and in exchange the target sees the genuine source IP and the whole thing runs at ultra-low latency.',
            tone: 'info',
          },
        ],
      },
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'Now the names, and the two other types',
      md: '**ALB is Layer 7, NLB is Layer 4** — and the two remaining types are recognition rather than decision. **Gateway Load Balancer** exists to route traffic transparently through third-party firewall or IDS/IPS appliances, so its tell is a *named security appliance* rather than an application. **Classic Load Balancer** is legacy: never the right answer for a new design, and its presence in an option list is usually there to be eliminated.',
    },

    /* ── 3. The rule only Layer 7 could write, read out line by line ──────── */
    { kind: 'heading', text: 'What "reads the path" is, written down' },
    {
      kind: 'code',
      lang: 'json',
      caption: 'An ALB listener rule — the top arrow from the diagram, as configuration',
      code: `{
  "Priority": 10,
  "Conditions": [
    { "Field": "path-pattern",  "Values": ["/api/*"] },
    { "Field": "http-header",
      "HttpHeaderConfig": { "HttpHeaderName": "X-Tenant", "Values": ["beta"] } }
  ],
  "Actions": [
    { "Type": "forward", "TargetGroupArn": "arn:aws:...:targetgroup/api-beta/..." }
  ]
}`,
    },
    {
      kind: 'steps',
      title: 'Four things that rule is quietly telling you',
      items: [
        {
          title: 'Every condition names something inside the request',
          md: 'A path and a header. Neither exists at Layer 4 — a TCP segment carries a port, not a URL — which is why no equivalent rule can be written for an NLB. Content-based routing means Layer 7, and Layer 7 means ALB.',
        },
        {
          title: 'The action points at a target group, not at instances',
          md: 'The target group is the unit everything attaches to, and it can hold instances, raw IP addresses or a Lambda function. Lambda as a target is ALB-only, and it is the answer to "run this without a server behind the load balancer".',
        },
        {
          title: 'Priority means the rules are ordered and the first match wins',
          md: 'A broad rule placed above a narrow one silently swallows it. That is a debugging fact rather than an exam fact, and it is the reason the default rule sits last.',
        },
        {
          title: 'And nothing here mentions the load balancer itself',
          md: 'Health check settings live on the **target group**, not on the load balancer. A question about changing a health check path, interval or threshold is asking you where that setting lives, and half of the wrong answers put it on the listener.',
        },
      ],
    },

    /* ── 4. The two configurations that do not exist ──────────────────────── */
    { kind: 'heading', text: 'Two things people try to configure, and cannot' },
    {
      kind: 'code',
      lang: 'bash',
      caption: 'Both look reasonable. Neither works.',
      code: `# 1. The partner asks for an address to allowlist, so we resolve the ALB
allow from 52.14.90.11/32
           ^^^^^^^^^^^^^^ today's answer, and not yours
     An ALB's addresses are managed by AWS and change without notice.
     A fixed address is an NLB, which has a static IP per AZ.

# 2. And we would like to block SQL injection at the load balancer
aws wafv2 associate-web-acl --web-acl-arn ... \\
  --resource-arn arn:aws:elasticloadbalancing:...:loadbalancer/net/edge-nlb/...
                                                              ^^^ net = NLB
     WAF inspects HTTP requests. An NLB never opens one, so there is
     nothing for a rule to read and no association to make.`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      title: 'Three tells, all of them consequences of the layer',
      md: '**A static IP requirement means NLB** — ALB addresses change, so a client that must allowlist an address needs an NLB, or an NLB in front of an ALB. **Preserving the client source IP means NLB** — an ALB puts the client address in `X-Forwarded-For` instead. And **WAF attaches to ALB, CloudFront and API Gateway, never to NLB**, so "block SQL injection at the load balancer" implies ALB by elimination.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'What the error code is telling you',
      md: 'These get asked by number. A **504** means the target timed out, a **502** means it returned something malformed, and a **503** usually means there are no healthy targets at all. The third one is a health check question wearing a status code.',
    },

    /* ── 5. The half that is not distribution ─────────────────────────────── */
    { kind: 'heading', text: 'The health check, which is the resilience half' },
    {
      kind: 'prose',
      md: 'Every load balancer health-checks its targets and sends traffic only to the healthy ones. That is what makes an ELB a resilience component rather than a distributor — and it is also the setting that decides whether an [[ec2-auto-scaling|Auto Scaling group]] ever notices a broken instance.',
    },
    {
      kind: 'steps',
      title: 'Three settings, and the failure each one produces when it is wrong',
      items: [
        {
          title: 'EC2 health checks see the instance; ELB health checks see the application',
          md: 'An instance whose process has died but whose OS is fine passes an EC2 status check forever. **Turning on ELB health checks is what makes the Auto Scaling group replace it** — and any question about a running instance serving errors is asking for exactly that setting.',
        },
        {
          title:
            'The grace period is 300 seconds, and it is a launch-terminate loop when it is short',
          md: 'The **health check grace period** is how long a new instance is left alone before its checks count. Too short and the group kills instances mid-boot, then launches replacements that are killed mid-boot too. A stem describing instances cycling endlessly is usually describing this against a real start-up time.',
        },
        {
          title: 'Deregistration delay is 300 seconds, and it is why removal is not instant',
          md: 'Also called connection draining: in-flight requests are allowed to finish before a target is removed. It is the reason a scale-in or a deployment takes minutes rather than seconds, and the reason a target stuck in `draining` is not a fault.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'money',
      title: 'The default that differs between the two, and costs money',
      md: "**Cross-zone load balancing is on by default for ALB and off by default for NLB**, set per target group. It is a distribution difference — off, each AZ's share of traffic is split only among that AZ's targets — and a cost one, because turning it on for an NLB means traffic crosses AZs and cross-AZ transfer is charged.",
    },
    {
      kind: 'callout',
      tone: 'ok',
      title: 'Where the thing actually sits',
      md: 'An internet-facing load balancer needs **public subnets**, and the targets themselves should sit in **private subnets**. That split is the standard secure three-tier answer, and a stem that puts instances in public subnets behind a load balancer has usually done so to be corrected.',
    },

    /* ── 6. Compare, last, on axes the option set does not carry ──────────── */
    {
      kind: 'compare',
      title: 'The phrase in the stem, and the option waiting beside it',
      columns: ['What it is telling you', 'The wrong answer next to it'],
      rows: [
        {
          label: '"Route /images and /api to different fleets"',
          cells: [
            'ALB — the decision is inside the request',
            'NLB. It never opens the request, so there is no path to route on',
          ],
        },
        {
          label: '"Clients must allowlist our IP address"',
          cells: [
            'NLB — a static IP per Availability Zone',
            'ALB with a fixed DNS name. The name is stable, the addresses behind it are not',
          ],
        },
        {
          label: '"The backend must log the real client IP"',
          cells: [
            'NLB — the source address is preserved',
            'ALB. It works, but the address arrives in X-Forwarded-For, which is a code change',
          ],
        },
        {
          label: '"Block the OWASP Top 10 at the load balancer"',
          cells: [
            'ALB, because WAF can attach to it',
            'NLB with security groups. Those filter addresses and ports, not request content',
          ],
        },
        {
          label: '"Traffic must pass through our vendor firewall appliances"',
          cells: [
            'Gateway Load Balancer — the tell is the named appliance',
            'A NAT gateway or a proxy fleet, neither of which is transparent to the traffic',
          ],
        },
        {
          label: '"Static IPs, non-HTTP, and failover between Regions in seconds"',
          cells: [
            'Global Accelerator — anycast addresses that clients do not cache',
            'Route 53 failover, whose speed is capped by the TTL, and an NLB, which is regional',
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
          label: 'Cross-zone load balancing',
          value: 'On by default for ALB; off by default for NLB (per target group)',
        },
        {
          label: 'Sticky sessions',
          value: 'ALB via an application or duration cookie; NLB via source-IP affinity',
        },
        { label: 'Deregistration delay', value: '300 seconds default — connection draining' },
        { label: 'Subnets', value: 'At least two AZs required' },
        {
          label: 'Health check grace period',
          value: '300 seconds default',
          note: 'Too short and the ASG kills instances mid-boot — a classic misconfiguration.',
        },
      ],
    },

    /* ── 8. Next ──────────────────────────────────────────────────────────── */
    {
      kind: 'services',
      title: 'Where these facts live',
      slugs: ['elb', 'ec2-auto-scaling'],
    },
    {
      kind: 'prose',
      md: 'Sticky sessions appear twice above and were never recommended once. That is deliberate: pinning a user to one target defers the problem rather than solving it, and the exam almost always wants the opposite — the session state moved out of the instance entirely. [[sticky-sessions]] is the concept entry that carries it, and it is worth reading before the next practice paper.',
    },
  ],

  checks: [
    {
      id: 'which-load-balancer-static-ip',
      prompt:
        'A payments partner will only call your service from an allowlist, and needs a fixed IP address to allow. Which load balancer?',
      options: [
        {
          text: 'A Network Load Balancer, which has a static IP per Availability Zone',
          correct: true,
          why: 'A fixed address is the NLB tell. It is the only ELB type that gives you an address you can hand to somebody else and expect to keep working.',
        },
        {
          text: 'An Application Load Balancer — its DNS name never changes',
          correct: false,
          why: "The name is stable and the addresses behind it are not. AWS changes an ALB's addresses without notice, so an allowlist built from a resolution breaks silently.",
        },
        {
          text: 'An Application Load Balancer with an Elastic IP attached to each node',
          correct: false,
          why: 'You cannot attach Elastic IPs to an ALB. If both a fixed address and Layer 7 routing are needed, the design is an NLB in front of an ALB.',
        },
      ],
    },
    {
      id: 'which-load-balancer-waf',
      prompt:
        'A stem asks you to block SQL injection and cross-site scripting at the load balancer for a public HTTPS API. Which type, and why?',
      options: [
        {
          text: 'ALB, because WAF attaches to ALB, CloudFront and API Gateway',
          correct: true,
          why: 'WAF inspects HTTP requests, so it can only attach where HTTP is terminated. That eliminates NLB by mechanism rather than by preference.',
        },
        {
          text: 'NLB, with a WAF web ACL associated to the load balancer',
          correct: false,
          why: 'There is no such association. An NLB never opens the request, so there is nothing for a WAF rule to read.',
        },
        {
          text: 'Either, since AWS Shield inspects request content on both',
          correct: false,
          why: 'Shield handles volumetric Layer 3/4 DDoS, not request content. Request-content wording is always WAF.',
        },
      ],
    },
    {
      id: 'which-load-balancer-health-check',
      prompt:
        'Instances behind an ALB keep passing their status checks while the application on them returns 500s, and the Auto Scaling group never replaces them. What is missing?',
      options: [
        {
          text: 'The Auto Scaling group is using EC2 health checks — it needs the ELB health check type',
          correct: true,
          why: 'An EC2 status check sees a healthy instance and a dead process looks identical to it. The ELB health check tests the application, which is what makes the group act.',
        },
        {
          text: 'The health check settings need to be moved from the target group to the listener',
          correct: false,
          why: 'Health check settings live on the target group, and there is nowhere else to put them. Nothing is misplaced here.',
        },
        {
          text: 'The deregistration delay is too long, so unhealthy targets are never removed',
          correct: false,
          why: 'Deregistration delay only governs how long in-flight requests are allowed to finish once removal has started. Nothing has decided to remove these targets in the first place.',
        },
      ],
    },
    {
      id: 'which-load-balancer-source-ip',
      prompt:
        'An existing TCP service is moved behind a load balancer, and its access log now records the same handful of addresses for every connection. Which change fixes it without touching the application?',
      options: [
        {
          text: 'Put it behind an NLB, which preserves the client source IP',
          correct: true,
          why: 'A Layer 4 forward leaves the source address intact, so the target logs the genuine caller with no code change. "Without modifying the application" is the phrase that rules the alternative out.',
        },
        {
          text: 'Keep the ALB and read the client address from X-Forwarded-For',
          correct: false,
          why: 'That is the right mechanism for an ALB and it is a code change to the logging path, which the question has excluded.',
        },
        {
          text: 'Enable sticky sessions so each client is pinned to one target',
          correct: false,
          why: 'Stickiness changes which target a client reaches, not which address that target sees. The logs would still record the load balancer.',
        },
      ],
    },
  ],
}
