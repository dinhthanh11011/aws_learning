import type { Service } from '../schema'

const D = 'https://docs.aws.amazon.com'

export const networkServices: Service[] = [
  {
    slug: 'vpc',
    name: 'Amazon VPC',
    abbr: 'VPC',
    category: 'network',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Your own private network inside a Region — subnets, routes, gateways.',
    whatItIs:
      'A logically isolated network you define with a CIDR block, divided into subnets that each live in exactly one Availability Zone. What makes a subnet "public" is nothing about the subnet itself — it is a route table entry sending 0.0.0.0/0 to an internet gateway. Everything else in AWS networking hangs off that one idea.',
    whyItExists:
      "Early cloud servers each had a public address and were neighbours with every other tenant, so the only thing standing between the internet and your database was a host firewall — and there was nowhere to put a machine that should have no internet presence at all. The VPC exists to give you the network itself, not just hosts on someone else's: your own address range, your own routing, and therefore the ability to have a private half that simply cannot be reached from outside.",
    whenToUse: [
      'Any workload needing network isolation, private IP addressing or on-premises connectivity',
      'Multi-tier designs where the web tier is reachable and the database tier is not',
      'Wherever a compliance requirement says "not reachable from the internet"',
    ],
    whenNotToUse: [
      'Purely serverless designs using only S3, DynamoDB, Lambda and API Gateway need no VPC of their own',
      'Putting a Lambda function in a VPC when it only calls public AWS APIs adds cost and complexity for nothing',
    ],
    keyNumbers: [
      { label: 'CIDR size', value: '/16 (65,536 addresses) down to /28 (16)' },
      {
        label: 'Reserved addresses per subnet',
        value: '5',
        note: 'Network address, VPC router, DNS, future use, broadcast. A /28 gives you 11 usable.',
      },
      { label: 'Subnet scope', value: 'One Availability Zone, always' },
      { label: 'VPCs per Region', value: '5 by default (soft quota)', volatile: true },
      {
        label: 'Default route table',
        value: 'Every subnet is associated with one; the main route table is the fallback',
      },
      {
        label: 'Flow Logs',
        value: 'Capture accepted/rejected traffic metadata to CloudWatch Logs, S3 or Firehose',
      },
    ],
    examTraps: [
      'A subnet is public if and only if its route table sends 0.0.0.0/0 to an internet gateway. An instance also needs a public IP and permissive security groups to actually be reachable.',
      'CIDR blocks cannot overlap if the VPCs will ever be peered or joined by Transit Gateway. Design address space before you build.',
      'You cannot shrink a VPC CIDR. You can add secondary CIDR blocks.',
      '"Instance in a private subnet cannot reach the internet" is a NAT gateway question. "Instance in a private subnet cannot reach S3 without going through NAT" is a gateway VPC endpoint question, and the endpoint is free.',
      'VPC Flow Logs record metadata, not payloads. They cannot tell you what was in the request — that needs Traffic Mirroring.',
      'Only one internet gateway can be attached to a VPC at a time.',
    ],
    confusedWith: [
      {
        slug: 'security-group',
        difference: 'The VPC is the network; security groups and NACLs are the filters inside it.',
      },
      {
        slug: 'privatelink',
        difference:
          'PrivateLink and VPC endpoints let you reach AWS or partner services without leaving the private network — they are features within a VPC, not alternatives to it.',
      },
    ],
    pricing:
      'The VPC itself is free. NAT gateways, VPC endpoints, Transit Gateway attachments, and cross-AZ and egress data transfer are where the cost is.',
    docsUrl: `${D}/vpc/latest/userguide/what-is-amazon-vpc.html`,
    related: [
      'security-group',
      'nacl',
      'nat-gateway',
      'privatelink',
      'vpc-peering',
      'transit-gateway',
      'route53',
    ],
  },
  {
    slug: 'security-group',
    name: 'Security Groups',
    abbr: 'SG',
    category: 'network',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Stateful, allow-only firewall attached to an elastic network interface.',
    whatItIs:
      'An instance-level (really ENI-level) firewall. Rules only ever *allow* — there is no deny rule — and it is stateful: if a request is allowed in, the response is allowed out regardless of outbound rules. A security group can reference another security group as its source, which is how you express "only the web tier may reach the database tier" without hard-coding IP addresses.',
    whyItExists:
      'A firewall rule written in terms of IP addresses stops being true the moment machines come and go, which under Auto Scaling is constantly — and no human can maintain an address list that changes hourly. Security groups exist so a rule can name another *group* instead of an address: "the database accepts traffic from the web tier" stays correct however many web servers exist. Being stateful is part of the same motivation, because tracking return ports by hand is where hand-written rules mostly go wrong.',
    whenToUse: [
      'The default and primary access control for EC2, RDS, ELB, Lambda-in-VPC, ECS tasks in awsvpc mode',
      "Tier-to-tier rules expressed by referencing the other tier's security group",
    ],
    whenNotToUse: [
      'Blocking a specific malicious IP — security groups cannot deny. Use a NACL, or WAF at Layer 7',
      'Subnet-wide rules that must apply regardless of the resource — that is a NACL',
    ],
    keyNumbers: [
      { label: 'Stateful', value: 'Return traffic is automatically allowed' },
      { label: 'Rule types', value: 'Allow only — deny is impossible' },
      { label: 'Default behaviour', value: 'A new SG denies all inbound and allows all outbound' },
      { label: 'Rules per SG', value: '60 inbound and 60 outbound by default', volatile: true },
      { label: 'SGs per ENI', value: '5 by default, raisable to 16', volatile: true },
      {
        label: 'Evaluation',
        value: 'All rules across all attached SGs are evaluated; any match allows',
      },
    ],
    examTraps: [
      'Stateful versus stateless is the single most-asked networking distinction. Security group: stateful, allow-only, ENI-level. NACL: stateless, allow *and* deny, subnet-level, evaluated in rule-number order.',
      'Because NACLs are stateless, they need an explicit rule for return traffic on ephemeral ports (1024–65535). Forgetting that is the classic "outbound works, responses do not come back" scenario.',
      'Referencing a source security group is the right answer to "allow only traffic from the application tier" — not a CIDR range, which breaks when instances change.',
      'A security group cannot block a single bad IP. If the question says "deny", it is not a security group.',
      'Removing the default outbound allow-all rule breaks package installs, SSM agents and NFS mounts. Questions about mysteriously broken instances sometimes hide here.',
    ],
    confusedWith: [
      {
        slug: 'nacl',
        difference:
          'NACLs are stateless, subnet-level, support deny, and are evaluated in numeric order until a match. Security groups are stateful, ENI-level, allow-only, and evaluate everything.',
      },
      {
        slug: 'waf',
        difference:
          'Security groups filter on IP, port and protocol (Layers 3–4). WAF inspects HTTP content (Layer 7) — SQL injection, XSS, rate limits.',
      },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/vpc/latest/userguide/vpc-security-groups.html`,
    related: ['nacl', 'vpc', 'waf', 'network-firewall', 'elb'],
  },
  {
    slug: 'nacl',
    name: 'Network ACLs',
    abbr: 'NACL',
    category: 'network',
    families: ['saa'],
    tier: 1,
    oneLiner: 'Stateless, ordered allow/deny rules at the subnet boundary.',
    whatItIs:
      'A firewall at the subnet edge. Rules are numbered and evaluated lowest-first until one matches, and both allow and deny are available. It is stateless, so inbound and outbound are judged independently — the response to an allowed inbound request is not automatically permitted out.',
    whyItExists:
      'Security groups attach to instances, so anyone who can launch an instance can choose its rules — there is no way to say "nothing in this subnet may ever talk to that range" and have it hold. NACLs exist as a subnet-level backstop owned by the network administrator rather than the workload owner. They are stateless because a rule that outlives the connections it describes cannot rely on remembering them, which is also why the ephemeral-port mistake is so common.',
    whenToUse: [
      'Blocking specific IP addresses or ranges — the thing a security group cannot do',
      'A coarse second layer of defence around a whole subnet',
      'Compliance requirements for explicit subnet-level deny rules',
    ],
    whenNotToUse: [
      'Ordinary tier-to-tier access control — security groups are stateful and far easier to get right',
      'Application-layer attacks — WAF',
    ],
    keyNumbers: [
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
    ],
    examTraps: [
      'The last rule is always an unnumbered `*` deny that cannot be edited. A packet matching nothing is dropped.',
      'Rule order matters: a deny at rule 100 beats an allow at rule 200 for the same traffic. This is the opposite of security-group behaviour, where order is irrelevant.',
      'A newly created custom NACL blocks everything. Attaching one to a working subnet without adding rules takes it offline — a favourite troubleshooting scenario.',
      'Add the ephemeral-port outbound allow rule, or nothing will get a reply.',
    ],
    confusedWith: [
      {
        slug: 'security-group',
        difference:
          'See the security-group card — the stateful/stateless split is the whole exam point.',
      },
      {
        slug: 'network-firewall',
        difference:
          'Network Firewall does deep packet inspection, domain filtering and IPS/IDS. NACLs only match IP, port and protocol.',
      },
    ],
    pricing: 'Free.',
    docsUrl: `${D}/vpc/latest/userguide/vpc-network-acls.html`,
    related: ['security-group', 'vpc', 'network-firewall'],
  },
  {
    slug: 'nat-gateway',
    name: 'NAT Gateway',
    abbr: 'NATGW',
    category: 'network',
    families: ['saa'],
    tier: 1,
    oneLiner:
      'Lets private subnets reach the internet outbound, while staying unreachable inbound.',
    whatItIs:
      "A managed network address translation device that lives in a *public* subnet and gets a route from the private subnets. Outbound connections from private instances get translated to the NAT gateway's Elastic IP; nothing from the internet can initiate a connection inward. It is also one of the most common surprises on an AWS bill — you pay hourly *and* per gigabyte processed.",
    whyItExists:
      'A private instance still needs to fetch patches and call APIs, but the obvious fix — giving it a public IP — also makes it reachable from the internet, which is exactly what putting it in a private subnet was for. NAT exists to make outbound and inbound separable: connections can start from inside and never from outside. It is metered per hour and per gigabyte because it is a real fleet of machines, which is why it turns up so often as the surprise on a bill.',
    whenToUse: [
      'Private instances need to download patches, call third-party APIs or reach the internet outbound',
      'You want managed, highly available NAT rather than maintaining a NAT instance',
    ],
    whenNotToUse: [
      'Reaching AWS services like S3 or DynamoDB — a gateway VPC endpoint is free and avoids the per-GB charge',
      'Inbound connections — that is a load balancer or an internet gateway',
      'IPv6 — use an egress-only internet gateway',
    ],
    keyNumbers: [
      { label: 'Placement', value: 'In a public subnet, with an Elastic IP' },
      {
        label: 'Availability',
        value: 'Highly available *within its AZ only* — one per AZ for AZ-fault tolerance',
      },
      { label: 'Bandwidth', value: 'Scales automatically to 100 Gbps' },
      { label: 'Cost', value: 'Hourly charge plus per-GB data processing' },
      { label: 'Ports', value: 'Up to 55,000 simultaneous connections per unique destination' },
    ],
    examTraps: [
      'A NAT gateway is zonal. One NAT gateway shared by private subnets in three AZs means an AZ failure takes out egress for the other two, and generates cross-AZ data charges. One per AZ is the resilient (and often cheaper) answer.',
      'Cost-optimisation questions about NAT almost always want either a gateway VPC endpoint for S3/DynamoDB traffic, or interface endpoints for other AWS APIs.',
      'A NAT *instance* is the legacy self-managed alternative — cheaper at tiny scale, but you patch it, you size it, and you must disable source/destination checks. NAT gateway is the default correct answer.',
      'The NAT gateway must be in a *different* subnet from the instances routing to it, and that subnet must have an internet gateway route.',
    ],
    confusedWith: [
      {
        slug: 'privatelink',
        difference:
          'VPC endpoints reach AWS/partner services privately with no internet path at all; NAT reaches the actual internet.',
      },
      {
        slug: 'vpc',
        difference:
          'An internet gateway makes inbound and outbound possible for public subnets; a NAT gateway is outbound-only for private ones.',
      },
    ],
    pricing: 'Per NAT gateway-hour plus per GB processed, plus normal data transfer out.',
    docsUrl: `${D}/vpc/latest/userguide/vpc-nat-gateway.html`,
    related: ['vpc', 'privatelink', 'security-group', 'cost-explorer'],
  },
  {
    slug: 'privatelink',
    name: 'AWS PrivateLink & VPC Endpoints',
    category: 'network',
    families: ['saa'],
    tier: 1,
    oneLiner: 'Reach AWS or partner services privately, without an internet gateway or NAT.',
    whatItIs:
      'Two shapes, and knowing which is which is the exam point. A *gateway* endpoint is a route-table entry for S3 and DynamoDB only — free, and it never leaves the AWS network. An *interface* endpoint is an ENI with a private IP in your subnet, powered by PrivateLink, available for most AWS services and for third-party or your own services shared across accounts — charged hourly plus per GB.',
    whyItExists:
      "Calling S3 or another team's service from a private subnet meant routing through a NAT gateway and out to a public endpoint — traffic on the internet, per-GB NAT charges, and a security review asking why a private workload needs internet access at all. Peering the two VPCs instead exposed far more than the one service. PrivateLink and VPC endpoints exist so a private subnet can reach exactly one service and nothing else, without an internet path.",
    whenToUse: [
      'Private subnets calling S3 or DynamoDB — use a gateway endpoint and remove the NAT cost',
      'Private access to other AWS APIs (KMS, Secrets Manager, SSM, ECR, SQS…) — interface endpoints',
      'Exposing your own service to another VPC or account without peering or public IPs',
      'Compliance requiring that traffic never traverse the public internet',
    ],
    whenNotToUse: [
      'General internet access — that is a NAT gateway',
      'Full network-to-network routing between VPCs — that is peering or Transit Gateway',
    ],
    keyNumbers: [
      { label: 'Gateway endpoints', value: 'S3 and DynamoDB only · free · route-table based' },
      {
        label: 'Interface endpoints',
        value: 'Most AWS services · an ENI per subnet · hourly plus per GB',
      },
      {
        label: 'Endpoint policies',
        value: 'Restrict which resources may be reached through the endpoint',
      },
      {
        label: 'Private DNS',
        value: "Interface endpoints can take over the service's public hostname inside the VPC",
      },
    ],
    examTraps: [
      'Gateway = S3 and DynamoDB and free. Interface = everything else and charged. Nearly every endpoint question hinges on that split.',
      'Interface endpoints need a security group allowing HTTPS from your instances, and private DNS enabled if you want the standard service hostname to resolve to them.',
      'An endpoint policy plus an S3 bucket policy condition on `aws:sourceVpce` is how you prove data cannot leave via the internet — a common compliance answer.',
      'PrivateLink is one-directional service access, not routing. The consumer can call the service; the service cannot initiate calls back.',
    ],
    confusedWith: [
      {
        slug: 'vpc-peering',
        difference:
          'Peering routes whole networks together bidirectionally; PrivateLink exposes a single service endpoint one way with no CIDR overlap concerns.',
      },
      {
        slug: 'nat-gateway',
        difference:
          'NAT reaches the internet and costs per GB; endpoints reach AWS services privately, and the gateway kind is free.',
      },
    ],
    pricing:
      'Gateway endpoints are free. Interface endpoints charge per endpoint-hour per AZ plus per GB processed.',
    docsUrl: `${D}/vpc/latest/privatelink/what-is-privatelink.html`,
    related: ['vpc', 'nat-gateway', 's3', 'vpc-peering', 'transit-gateway'],
  },
  {
    slug: 'vpc-peering',
    name: 'VPC Peering',
    category: 'network',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Private one-to-one routing between two VPCs, any account, any Region.',
    whatItIs:
      'A direct network connection between exactly two VPCs, using private IP addresses. It is not transitive: if A peers with B and B peers with C, A still cannot reach C. Every side must add route-table entries pointing at the peering connection.',
    whyItExists:
      'Two VPCs that need to talk otherwise route through the internet — public IPs, egress charges and an attack surface — for traffic that never needed to leave AWS. Peering exists as the cheapest possible answer to that one case: a private route between exactly two VPCs. Its limits are the reason Transit Gateway exists, so the exam is usually asking you to notice when two has become ten.',
    whenToUse: [
      'A small number of VPCs that need to talk directly',
      'Cross-account or cross-Region private connectivity between two specific networks',
    ],
    whenNotToUse: [
      'More than a handful of VPCs — the mesh grows as n(n−1)/2 and becomes unmanageable. Use Transit Gateway',
      'Overlapping CIDR blocks — peering is impossible',
      'Exposing one service rather than a whole network — PrivateLink',
    ],
    keyNumbers: [
      { label: 'Transitivity', value: 'None — every pair needs its own peering' },
      { label: 'CIDR overlap', value: 'Not allowed' },
      {
        label: 'Edge-to-edge routing',
        value: 'Not supported — a peer cannot use your NAT gateway, VPN or Direct Connect',
      },
      { label: 'Cost', value: 'No hourly charge; you pay data transfer' },
    ],
    examTraps: [
      'Non-transitive routing is the most examined property. Any question describing a hub-and-spoke or "all VPCs must reach all others" is pointing at Transit Gateway.',
      'Edge-to-edge routing being unsupported means a peered VPC cannot borrow your internet egress or your Direct Connect link.',
      'Both VPCs must update route tables and security groups. Accepting the peering request alone does not create connectivity.',
    ],
    confusedWith: [
      {
        slug: 'transit-gateway',
        difference:
          'Transit Gateway is a transitive hub for many VPCs and on-premises links; peering is a single non-transitive pair.',
      },
      {
        slug: 'privatelink',
        difference: 'Peering joins networks; PrivateLink exposes one service.',
      },
    ],
    pricing:
      'No hourly fee. Data transfer charges apply, and cross-AZ or cross-Region rates apply.',
    docsUrl: `${D}/vpc/latest/peering/what-is-vpc-peering.html`,
    related: ['transit-gateway', 'privatelink', 'vpc'],
  },
  {
    slug: 'transit-gateway',
    name: 'AWS Transit Gateway',
    abbr: 'TGW',
    category: 'network',
    families: ['saa'],
    tier: 2,
    oneLiner: 'A regional routing hub connecting many VPCs, VPNs and Direct Connect links.',
    whatItIs:
      'A cloud router. Every VPC, VPN and Direct Connect gateway attaches once to the Transit Gateway, and routing between them is handled by route tables on the gateway itself. That turns an n² peering mesh into n attachments, and it supports transitive routing, which peering does not.',
    whyItExists:
      'Connecting VPCs with peering works until there are ten of them: peering is one-to-one and non-transitive, so full connectivity costs 45 connections and 45 sets of route-table entries, and adding one more VPC means touching every existing one. The VPN and Direct Connect attachments then had to be duplicated per VPC as well. Transit Gateway exists to make that a hub: each network attaches once, and routing is decided in a single place.',
    whenToUse: [
      'Dozens or hundreds of VPCs needing any-to-any or hub-and-spoke connectivity',
      'Sharing one Direct Connect or VPN connection across many VPCs',
      'Segmentation: separate TGW route tables keep prod and dev from routing to each other',
      'Cross-Region connectivity via TGW peering',
    ],
    whenNotToUse: [
      'Two VPCs — peering is free of hourly charges and simpler',
      'A single exposed service — PrivateLink',
    ],
    keyNumbers: [
      { label: 'Transitive routing', value: 'Yes — this is the point' },
      {
        label: 'Attachment types',
        value: 'VPC · VPN · Direct Connect gateway · TGW peering · Connect',
      },
      { label: 'Cost', value: 'Per attachment-hour plus per GB of data processed' },
      { label: 'Sharing', value: 'Shareable across accounts with AWS RAM' },
      { label: 'Multicast', value: 'Supported (peering and VPC do not support it)' },
    ],
    examTraps: [
      'Transit Gateway is the standard answer to "simplify a growing VPC peering mesh" or "share one Direct Connect across many VPCs".',
      'The per-attachment-hour plus per-GB charge makes it more expensive than peering at small scale. Cost questions with only two or three VPCs may still want peering.',
      'Separate TGW route tables are the mechanism for network segmentation between environments — asked as an isolation requirement.',
    ],
    confusedWith: [
      {
        slug: 'vpc-peering',
        difference:
          'Peering is a non-transitive pair with no hourly cost; TGW is a transitive hub with per-attachment cost.',
      },
      {
        slug: 'direct-connect',
        difference:
          'Direct Connect is the physical link to your data centre; TGW is what distributes it to many VPCs.',
      },
    ],
    pricing: 'Per attachment-hour plus per GB processed.',
    docsUrl: `${D}/vpc/latest/tgw/what-is-transit-gateway.html`,
    related: ['vpc-peering', 'direct-connect', 'site-to-site-vpn', 'ram', 'vpc'],
  },
  {
    slug: 'direct-connect',
    name: 'AWS Direct Connect',
    abbr: 'DX',
    category: 'network',
    families: ['saa'],
    tier: 2,
    oneLiner: 'A private physical circuit from your data centre into AWS.',
    whatItIs:
      'A dedicated network connection, provisioned through an AWS Direct Connect location, that bypasses the public internet entirely. It gives consistent latency, higher and more predictable throughput, and lower per-GB data transfer rates than internet egress. It also takes weeks to provision, which is itself an exam fact.',
    whyItExists:
      'Hybrid traffic over the internet is fine on average and unacceptable at the tail: latency wanders, throughput depends on the day, and a bulk transfer pays internet egress rates. For a database replicating to AWS or a trading floor, "usually fine" is a failure. Direct Connect exists to sell a private circuit with predictable behaviour — at the cost of weeks of provisioning, which is exactly why the exam pairs it with a VPN for the interim.',
    whenToUse: [
      'Consistent, predictable latency for hybrid workloads',
      'Large sustained data transfer where the lower egress rate pays for the circuit',
      'Regulatory requirements that traffic not cross the public internet',
      'High-throughput hybrid links (1, 10, 100 Gbps)',
    ],
    whenNotToUse: [
      'You need connectivity this week — a Site-to-Site VPN is up in minutes',
      'Small or occasional transfers where the fixed cost dominates',
      'A one-off petabyte migration — Snowball is cheaper and faster',
    ],
    keyNumbers: [
      { label: 'Port speeds', value: 'Dedicated: 1, 10 or 100 Gbps · Hosted: 50 Mbps to 10 Gbps' },
      { label: 'Provisioning time', value: 'Weeks to months for a dedicated connection' },
      {
        label: 'Encryption',
        value:
          'None by default — it is private, not encrypted. Run an IPsec VPN over it, or use MACsec',
      },
      {
        label: 'Virtual interfaces',
        value:
          'Private (to a VPC) · Public (to public AWS services) · Transit (to Transit Gateway)',
      },
      {
        label: 'Resilient designs',
        value: 'Two connections at two locations for the highest AWS-recommended resilience',
      },
    ],
    examTraps: [
      '"Private" does not mean "encrypted". If the requirement says data must be encrypted in transit, you need a VPN over the Direct Connect link, or MACsec.',
      'A single Direct Connect connection is a single point of failure. The standard resilient answer is a second connection, or a Site-to-Site VPN as the cheaper backup path.',
      'If the question stresses "as quickly as possible", Direct Connect is usually wrong — lead times are long. VPN now, DX later, is a valid combined answer.',
      'Direct Connect Gateway is what lets one connection reach VPCs in multiple Regions and accounts.',
    ],
    confusedWith: [
      {
        slug: 'site-to-site-vpn',
        difference:
          'VPN is encrypted over the internet, minutes to set up, variable latency. DX is private, unencrypted by default, weeks to set up, consistent latency.',
      },
      {
        slug: 'snow-family',
        difference: 'Snow moves a large dataset once, offline. DX is an ongoing network link.',
      },
    ],
    pricing:
      'Per port-hour plus data transfer out at reduced DX rates, plus whatever your carrier charges for the cross-connect.',
    docsUrl: `${D}/directconnect/latest/UserGuide/Welcome.html`,
    related: ['site-to-site-vpn', 'transit-gateway', 'vpc', 'snow-family'],
  },
  {
    slug: 'site-to-site-vpn',
    name: 'AWS Site-to-Site VPN',
    category: 'network',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Encrypted IPsec tunnels from your network to AWS, over the internet.',
    whatItIs:
      'Two IPsec tunnels between a customer gateway (your device) and either a virtual private gateway or a Transit Gateway. Encrypted, quick to establish, and dependent on internet quality for latency and throughput.',
    whyItExists:
      'Connecting an office to a VPC otherwise means exposing something publicly and defending it, or waiting weeks for a private circuit before any hybrid work can begin. Site-to-Site VPN exists because encryption over the internet you already have can be up in an hour: not as steady as a dedicated link, which is why it is the standard stopgap while Direct Connect is provisioned, and the standard backup once it is.',
    whenToUse: [
      'Hybrid connectivity needed quickly, or as a cheap backup for Direct Connect',
      'Encryption in transit is required by policy',
      'Moderate, bursty hybrid traffic where dedicated bandwidth is not justified',
    ],
    whenNotToUse: [
      'Consistent low latency or very high sustained throughput — Direct Connect',
      'Bulk one-time migration — Snow Family',
    ],
    keyNumbers: [
      { label: 'Tunnels', value: 'Two per connection, for redundancy' },
      {
        label: 'Throughput',
        value: 'Up to ~1.25 Gbps per tunnel',
        note: 'Use ECMP over multiple tunnels on a Transit Gateway to go higher.',
      },
      { label: 'Setup time', value: 'Minutes' },
      { label: 'Routing', value: 'Static or dynamic with BGP' },
    ],
    examTraps: [
      'Both tunnels should be configured. Many designs use only one and then fail an availability requirement.',
      'VPN over Direct Connect is the standard answer to "private *and* encrypted".',
      'A virtual private gateway attaches to a single VPC. Reaching many VPCs over one VPN means terminating it on a Transit Gateway.',
    ],
    confusedWith: [
      {
        slug: 'direct-connect',
        difference:
          'See the Direct Connect card — encrypted-over-internet versus private-dedicated is the trade.',
      },
      {
        slug: 'client-vpn',
        difference: 'Site-to-Site joins networks; Client VPN connects individual user devices.',
      },
    ],
    pricing: 'Per VPN connection-hour plus data transfer out.',
    docsUrl: `${D}/vpn/latest/s2svpn/VPC_VPN.html`,
    related: ['direct-connect', 'transit-gateway', 'client-vpn', 'vpc'],
  },
  {
    slug: 'client-vpn',
    name: 'AWS Client VPN',
    category: 'network',
    families: ['saa'],
    tier: 3,
    oneLiner: 'Managed OpenVPN endpoint for individual users to reach your VPC.',
    whatItIs:
      'A managed remote-access VPN. Users run an OpenVPN client, authenticate with certificates, Active Directory or SAML, and get routed access into your VPC and optionally on-premises networks.',
    whenToUse: [
      'Remote employees or contractors needing access to private resources',
      'Replacing a bastion-host workflow for developer access',
    ],
    whenNotToUse: [
      'Joining two networks — that is Site-to-Site VPN',
      'Administrative shell access to instances — Systems Manager Session Manager needs no VPN at all',
    ],
    keyNumbers: [
      { label: 'Auth', value: 'Mutual certificates · Active Directory · SAML federation' },
      { label: 'Authorization rules', value: 'Per-network-CIDR, optionally per AD group' },
    ],
    examTraps: [
      'For "administrators need shell access to private instances without opening ports or running a bastion", the answer is Session Manager, not Client VPN.',
    ],
    confusedWith: [
      {
        slug: 'site-to-site-vpn',
        difference: 'Client VPN is per-user devices; Site-to-Site is network-to-network.',
      },
      {
        slug: 'systems-manager',
        difference: 'Session Manager gives shell access with no inbound ports and no VPN client.',
      },
    ],
    pricing: 'Per endpoint-association-hour plus per connected client-hour.',
    docsUrl: `${D}/vpn/latest/clientvpn-admin/what-is.html`,
    related: ['site-to-site-vpn', 'systems-manager', 'directory-service'],
  },
  {
    slug: 'elb',
    name: 'Elastic Load Balancing',
    abbr: 'ELB',
    category: 'network',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Four load balancers; picking the right one is a guaranteed exam question.',
    whatItIs:
      'ALB works at Layer 7 and can route on host, path, header, query string and HTTP method. NLB works at Layer 4, handles millions of requests per second at ultra-low latency, and can give you a static IP per AZ. GWLB inserts third-party security appliances into the traffic path. CLB is legacy. Every load balancer performs health checks and only sends traffic to healthy targets, which is what makes it a resilience component and not just a distributor.',
    whyItExists:
      'Handing clients the address of a specific server means the client learns about your servers: replacing one requires a DNS change, an unhealthy one keeps taking traffic until someone notices, and load is shared only by luck. Home-grown solutions were a reverse proxy on an instance, which was itself the single point of failure. Load balancers exist so the fleet can change shape and lose members without the client ever learning about it.',
    whenToUse: [
      'ALB: HTTP/HTTPS applications, containers, path- or host-based routing, Lambda targets, WAF integration, OIDC/Cognito authentication',
      'NLB: TCP/UDP/TLS, extreme throughput, static or Elastic IPs, preserving the client source IP, PrivateLink service front end',
      'GWLB: transparently routing traffic through firewall, IDS/IPS or deep-inspection appliances',
    ],
    whenNotToUse: [
      'Global traffic steering across Regions — that is Route 53 or Global Accelerator',
      'Caching static content — CloudFront',
      'A single instance with no availability requirement',
    ],
    keyNumbers: [
      {
        label: 'ALB',
        value:
          'Layer 7 · host/path/header/query routing · Lambda, IP and instance targets · WAF-compatible',
      },
      {
        label: 'NLB',
        value:
          'Layer 4 · millions of rps · static IP per AZ · preserves source IP · TLS termination',
      },
      { label: 'GWLB', value: 'Layer 3 gateway plus Layer 4 balancing, using GENEVE on port 6081' },
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
    ],
    examTraps: [
      "Static IP requirement means NLB. ALB's addresses change, so clients that must allowlist an IP need NLB (or an NLB in front of an ALB).",
      'Preserving the client source IP means NLB. ALB puts the client IP in the X-Forwarded-For header instead.',
      'WAF attaches to ALB, CloudFront and API Gateway — not to NLB. "Block SQL injection at the load balancer" therefore implies ALB.',
      'A 504 means the target timed out; a 502 means a malformed response; a 503 usually means no healthy targets. These specific codes get asked.',
      'Health check settings live on the *target group*, not the load balancer.',
      'An internet-facing load balancer needs public subnets; the targets themselves should sit in private subnets. That split is the standard secure three-tier answer.',
      'NLB cross-zone load balancing is off by default and, when enabled, incurs cross-AZ data charges — a cost-question detail.',
    ],
    confusedWith: [
      {
        slug: 'cloudfront',
        difference:
          'CloudFront caches at the edge globally; ELB distributes to targets inside one Region without caching.',
      },
      {
        slug: 'global-accelerator',
        difference:
          'Global Accelerator gives static anycast IPs and routes users to the best Region over the AWS backbone; ELB balances within a Region.',
      },
      {
        slug: 'route53',
        difference:
          'Route 53 answers DNS queries and can steer between endpoints; a load balancer terminates and forwards the actual connection.',
      },
    ],
    pricing:
      'Per load balancer-hour plus capacity units (LCU/NLCU/GLCU) measured on connections, bandwidth and rule evaluations.',
    docsUrl: `${D}/elasticloadbalancing/latest/userguide/what-is-load-balancing.html`,
    related: ['ec2-auto-scaling', 'cloudfront', 'route53', 'global-accelerator', 'waf', 'ecs'],
  },
  {
    slug: 'cloudfront',
    name: 'Amazon CloudFront',
    abbr: 'CF',
    category: 'network',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'Global CDN — caches at hundreds of edge locations close to your users.',
    whatItIs:
      'A content delivery network. Requests hit the nearest edge location; if the object is cached there it is served immediately, otherwise CloudFront fetches it from the origin (S3, ALB, API Gateway, or any HTTP server) over the AWS backbone. Beyond caching it terminates TLS at the edge, integrates WAF and Shield, and can run code at the edge with CloudFront Functions or Lambda@Edge.',
    whyItExists:
      "Serving a global audience from one Region means every request from Sydney crosses an ocean twice, and popular objects cross it again for every user who asks. The fix used to be renting servers on other continents and copying content to them yourself, then keeping those copies honest. CloudFront exists so distance becomes AWS's problem: the content moves to the user, and the origin only answers the first request.",
    whenToUse: [
      'Static assets, images, video and downloads served to a geographically spread audience',
      'Reducing origin load and S3 or EC2 data-transfer cost',
      'Terminating TLS and applying WAF rules at the edge, away from your origin',
      'Restricting content by geography, or by signed URLs and signed cookies',
      'Even dynamic APIs benefit — the AWS backbone path is faster than the open internet',
    ],
    whenNotToUse: [
      'All users in one Region close to the origin — the benefit is small',
      'Content unique to every request with no cacheable component and no latency concern',
      'Non-HTTP protocols — that is Global Accelerator',
    ],
    keyNumbers: [
      {
        label: 'Origin Access Control (OAC)',
        value: 'The current way to let only CloudFront read a private S3 bucket',
        note: 'OAI is the legacy predecessor.',
      },
      {
        label: 'TTLs',
        value: 'Minimum, maximum and default TTL, overridable by Cache-Control headers',
      },
      { label: 'Invalidation', value: 'By path; the first 1,000 paths per month are free' },
      {
        label: 'Edge compute',
        value:
          'CloudFront Functions (lightweight, viewer events) · Lambda@Edge (heavier, all four events)',
      },
      { label: 'Price classes', value: 'All · 200 · 100 — fewer edge locations for less money' },
      { label: 'Signed URLs vs cookies', value: 'URL for one file; cookie for many files' },
      {
        label: 'Certificates',
        value: 'For a custom domain, the ACM certificate must be in us-east-1',
      },
    ],
    examTraps: [
      'The ACM certificate for a CloudFront distribution must live in us-east-1, no matter where the origin is. This is asked directly.',
      'OAC plus a bucket policy is how you serve S3 content through CloudFront while blocking direct bucket access.',
      'Cache key configuration decides your hit ratio. Forwarding all headers, cookies and query strings makes almost everything a miss.',
      'Versioned object names (`app.v2.js`) are cheaper and more reliable than invalidations for cache busting.',
      'Signed URLs and cookies are CloudFront-level private content; S3 presigned URLs are S3-level. Different mechanisms, both appear as options.',
      'Geo-restriction in CloudFront blocks by country. WAF geo-match rules are the more flexible variant.',
      'CloudFront reduces cost as well as latency: origin egress to CloudFront is free, and CloudFront-to-user rates are lower than S3-to-internet.',
    ],
    confusedWith: [
      {
        slug: 'global-accelerator',
        difference:
          'CloudFront caches HTTP content at the edge. Global Accelerator does not cache — it gives static anycast IPs and routes any TCP/UDP traffic to the healthiest Region.',
      },
      {
        slug: 'elb',
        difference: 'CloudFront is global and caching; ELB is regional and does not cache.',
      },
      {
        slug: 'elasticache',
        difference:
          'CloudFront caches responses for users; ElastiCache caches data for your application.',
      },
    ],
    pricing:
      'Per GB transferred out to viewers by Region, plus per 10,000 requests, plus optional features. Origin fetches from AWS origins are free.',
    docsUrl: `${D}/AmazonCloudFront/latest/DeveloperGuide/Introduction.html`,
    related: ['s3', 'elb', 'waf', 'shield', 'route53', 'global-accelerator', 'acm', 'lambda'],
  },
  {
    slug: 'global-accelerator',
    name: 'AWS Global Accelerator',
    abbr: 'AGA',
    category: 'network',
    families: ['saa'],
    tier: 2,
    oneLiner: 'Two static anycast IPs that route users over the AWS backbone to the best Region.',
    whatItIs:
      'You get two static anycast IP addresses advertised from AWS edge locations worldwide. Traffic enters the AWS backbone at the nearest edge and travels privately to your endpoint — ALB, NLB, EC2 or an Elastic IP — in whichever Region is healthy and closest. Failover between Regions happens in seconds because nothing depends on DNS TTLs.',
    whyItExists:
      'Steering users to the nearest healthy Region was a DNS problem, and DNS is a bad failover mechanism: resolvers and clients cache records past their TTL, so a Region can be down for minutes while traffic keeps arriving. Clients that need a fixed IP to allowlist were stuck as well. Global Accelerator exists to move the decision from DNS into the network: the IPs never change, and the path does.',
    whenToUse: [
      'Non-HTTP protocols: gaming, VoIP, IoT, MQTT, custom TCP/UDP',
      'A static IP that clients or firewalls can allowlist, in front of a multi-Region deployment',
      'Fast regional failover without waiting for DNS to re-resolve',
      'Cutting jitter and packet loss by keeping traffic off the public internet',
    ],
    whenNotToUse: [
      'Cacheable HTTP content — CloudFront caches, which Global Accelerator does not',
      'A single-Region application with no static-IP need — the fixed hourly charge buys you little',
    ],
    keyNumbers: [
      { label: 'IPs', value: 'Two static anycast addresses' },
      { label: 'Failover', value: 'Seconds, independent of DNS caching' },
      { label: 'Caching', value: 'None' },
      {
        label: 'Traffic dials & weights',
        value: 'Shift traffic between Regions and endpoints by percentage',
      },
      { label: 'Cost', value: 'Fixed hourly charge plus a data-transfer premium' },
    ],
    examTraps: [
      'Global Accelerator versus CloudFront is a recurring pair. Static IPs, non-HTTP, or fast regional failover → Global Accelerator. Cacheable HTTP content → CloudFront.',
      'DNS-based failover with Route 53 is subject to client TTL caching. When the requirement says failover must be near-instant, that rules out plain DNS and points here.',
      'Global Accelerator does not cache anything. Do not use it to reduce origin load.',
    ],
    confusedWith: [
      {
        slug: 'cloudfront',
        difference:
          'CloudFront caches HTTP at the edge; Global Accelerator routes any TCP/UDP traffic without caching.',
      },
      {
        slug: 'route53',
        difference:
          'Route 53 steers by returning different DNS answers, which clients cache. Global Accelerator steers at the network layer with fixed IPs.',
      },
    ],
    pricing: 'Fixed per-accelerator-hour fee plus a per-GB data-transfer premium by route.',
    docsUrl: `${D}/global-accelerator/latest/dg/what-is-global-accelerator.html`,
    related: ['cloudfront', 'route53', 'elb', 'shield'],
  },
  {
    slug: 'route53',
    name: 'Amazon Route 53',
    abbr: 'R53',
    category: 'network',
    families: ['saa', 'dva'],
    tier: 1,
    oneLiner: 'DNS with health checks and seven routing policies — the global traffic director.',
    whatItIs:
      'A highly available authoritative DNS service, plus domain registration, plus health checking. The exam interest is almost entirely in the routing policies, because they are how you express global architecture in DNS: failover, latency-based, geolocation, geoproximity, weighted, multivalue and simple.',
    whyItExists:
      'Users type a name, but every failover, every new Region and every load balancer replacement changes an address — and a DNS server that only maps names to addresses cannot tell whether the address it is handing out still works. Route 53 exists because DNS is the first decision in every request and therefore the cheapest place to make a routing one: health checks let it stop answering with a dead endpoint, and latency or geolocation policies let the answer depend on who asked.',
    whenToUse: [
      'Public DNS for your domains, and private DNS inside VPCs via private hosted zones',
      'Active-passive DR with failover routing plus health checks',
      'Sending users to the lowest-latency Region',
      'Weighted routing for canary releases or blue/green traffic shifting',
      'Compliance or licensing rules requiring geolocation-based answers',
    ],
    whenNotToUse: [
      'Near-instant failover — DNS TTL caching gets in the way; use Global Accelerator',
      'Load balancing within a Region — that is an ELB',
      'Content caching — CloudFront',
    ],
    keyNumbers: [
      { label: 'Simple', value: 'One record, no health checks' },
      { label: 'Failover', value: 'Primary/secondary with a health check — active-passive DR' },
      { label: 'Latency-based', value: 'Lowest measured network latency to the client' },
      {
        label: 'Geolocation',
        value: "By the user's country or continent — compliance and localisation",
      },
      {
        label: 'Geoproximity',
        value: "By geographic distance, with a bias dial to expand or shrink a Region's pull",
      },
      { label: 'Weighted', value: 'By percentage — canary and blue/green' },
      {
        label: 'Multivalue answer',
        value: "Up to 8 healthy records returned, with health checks — poor-man's load balancing",
      },
      {
        label: 'Alias records',
        value: 'Free, point at AWS resources, and can sit at the zone apex where CNAME cannot',
      },
      {
        label: 'Resolver endpoints',
        value: 'Inbound and outbound, for hybrid DNS with on-premises resolvers',
      },
    ],
    examTraps: [
      'An alias record is the answer whenever you must point the zone apex (example.com, not www) at an ALB, CloudFront distribution or S3 website. A CNAME is illegal at the apex.',
      'Alias record queries to AWS resources are free; CNAME queries are charged. That shows up in cost questions.',
      'Latency-based routing sends users to the fastest Region. Geolocation sends them to the Region their *location* dictates, which may be slower. Compliance wording means geolocation; performance wording means latency.',
      'Geoproximity requires traffic flow and is the only policy with a bias setting.',
      'Failover routing needs a health check attached to the primary record, or it will never fail over.',
      'Private hosted zones require both `enableDnsHostnames` and `enableDnsSupport` on the VPC.',
      'Route 53 is a global service, and its hosted zones are not regional.',
    ],
    confusedWith: [
      {
        slug: 'global-accelerator',
        difference:
          'DNS answers are cached by clients; anycast IPs are not. That is why Global Accelerator fails over faster.',
      },
      {
        slug: 'elb',
        difference:
          'Route 53 chooses which endpoint a name resolves to; ELB distributes connections across targets behind one endpoint.',
      },
    ],
    pricing:
      'Per hosted zone-month, per million queries (alias queries to AWS resources free), plus health checks and domain registration.',
    docsUrl: `${D}/Route53/latest/DeveloperGuide/Welcome.html`,
    related: ['elb', 'cloudfront', 'global-accelerator', 's3', 'acm', 'vpc'],
  },
]
