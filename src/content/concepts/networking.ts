import type { Concept } from '../schema'

/**
 * The address-space primitives. These are the ones the exam never defines and
 * every VPC question depends on — a stem that says "the subnet has no route to
 * 0.0.0.0/0" is not testing a service, it is testing whether you know what a
 * route table is.
 *
 * Ordered as they build on each other rather than alphabetically: geography,
 * then address space, then placement, then reachability. Read top to bottom
 * once and the VPC atlas entry stops being a list of nouns.
 */
export const networkingConcepts: Concept[] = [
  {
    slug: 'region',
    term: 'Region',
    aka: ['AWS Region'],
    group: 'networking',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner: 'A named geographic area containing several isolated Availability Zones.',
    whatItIs:
      'A Region is a separate physical area of the world — eu-west-1 in Ireland, ap-southeast-1 in Singapore — made up of multiple Availability Zones. Regions are isolated from one another by design: nothing replicates between them unless you configure it to. Most services are Regional, meaning a resource you create exists in one Region and is invisible from the others.',
    keyIdea:
      'Regions are isolated by default. Cross-Region anything — replication, failover, a second copy of your data — is a feature you turn on and pay for, never something you get for free.',
    onTheExam: [
      '"Data must not leave the country" — a data-residency constraint, so the answer keeps everything in one Region.',
      '"Users in Europe see high latency" — either a Region closer to them or an edge service, and the question decides which by whether the content is cacheable.',
      '"Survive the loss of an entire Region" — the answer is cross-Region, and Multi-AZ is the distractor.',
    ],
    keyNumbers: [
      {
        label: 'AZs per Region',
        value: 'At least 3 in most Regions',
        note: 'A few older Regions have 2.',
      },
      {
        label: 'Global services',
        value: 'IAM, Route 53, CloudFront, WAF for CloudFront, Organizations',
        note: 'Everything else is Regional. Knowing this short list is worth a mark.',
      },
    ],
    examTraps: [
      'S3 bucket names are globally unique, but a bucket still lives in one Region. A global namespace is not global storage — cross-Region durability needs replication.',
      'Choosing a Region purely on price ignores the data-residency constraint the stem usually states one sentence earlier.',
    ],
    confusedWith: [
      {
        slug: 'availability-zone',
        difference:
          'A Region is the geography and contains AZs; an AZ is one isolated set of data centres inside it. Region protects against a regional disaster, AZ against a single facility failing.',
      },
      {
        slug: 'edge-location',
        difference:
          'A Region runs your workload; an edge location only caches or terminates connections close to users. You cannot launch an instance at an edge location.',
      },
    ],
    serviceSlugs: ['global-infrastructure', 'vpc', 's3', 'route53'],
    related: ['availability-zone', 'edge-location', 'multi-az-vs-multi-region'],
    docsUrl:
      'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html',
  },
  {
    slug: 'availability-zone',
    term: 'Availability Zone',
    abbr: 'AZ',
    aka: ['AZ'],
    group: 'networking',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner:
      'One or more discrete data centres inside a Region, with independent power and cooling.',
    whatItIs:
      'An Availability Zone is a failure domain. Each AZ has its own power, cooling and physical security, and is far enough from the others that one flooding or losing power does not take its neighbours with it — while still close enough for single-digit-millisecond latency between them. An AZ is the unit you spread across to survive a facility failure.',
    keyIdea:
      'An AZ is a failure boundary, and a subnet lives in exactly one of them. "Make it highly available" therefore always means "put it in at least two subnets in two different AZs".',
    onTheExam: [
      '"Highly available" with no mention of Regions — the answer is Multi-AZ, and cross-Region is the over-engineered distractor.',
      '"The application must survive an AZ failure" — look for what is still single-AZ in the proposed design, usually the database or a NAT gateway.',
    ],
    keyNumbers: [
      { label: 'Inter-AZ latency', value: 'Single-digit milliseconds' },
      {
        label: 'Inter-AZ data transfer',
        value: 'Charged in both directions',
        note: 'The reason a chatty tier is sometimes deliberately kept in one AZ.',
        volatile: true,
      },
      {
        label: 'AZ names are per-account',
        value: 'us-east-1a is a different physical AZ in another account',
        note: 'AZ IDs such as use1-az1 are the stable identifier across accounts.',
      },
    ],
    examTraps: [
      'A NAT gateway is an AZ-scoped resource. One NAT gateway serving private subnets in three AZs is a single point of failure and an inter-AZ data-transfer bill — the highly available answer is one per AZ.',
      'An EBS volume cannot be attached across AZs. If the design moves an instance to another AZ, the volume does not follow; a snapshot does.',
      'Multi-AZ on RDS is for failover, not for read scaling. Read replicas scale reads. Answering the wrong one is the most common RDS mistake there is.',
    ],
    confusedWith: [
      {
        slug: 'region',
        difference:
          'Many AZs make up one Region. Spreading across AZs is cheap and usually the intended answer; spreading across Regions is expensive and only needed when the stem says so.',
      },
    ],
    serviceSlugs: ['global-infrastructure', 'vpc', 'ec2', 'rds', 'elb', 'ebs'],
    related: [
      'region',
      'subnet',
      'high-availability-vs-fault-tolerance',
      'multi-az-vs-multi-region',
    ],
    docsUrl:
      'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html',
  },
  {
    slug: 'edge-location',
    term: 'Edge location',
    aka: ['Point of presence', 'PoP'],
    group: 'networking',
    certs: ['SAA-C03'],
    oneLiner: 'A small site close to users that caches content and terminates connections.',
    whatItIs:
      'Edge locations are a much larger and more widely spread set of sites than Regions. They run CloudFront caches, Route 53 DNS, Global Accelerator entry points, AWS WAF and Shield. You never deploy your own workload to one; you put a managed service in front of your workload and the edge fronts it.',
    keyIdea:
      'The edge shortens the network path, not the compute. It helps a slow response either by serving a cached copy or by getting the request onto the AWS backbone sooner — and the exam separates those two cases by whether the content is cacheable.',
    onTheExam: [
      '"Static content, users worldwide, reduce latency" — CloudFront, because caching solves it.',
      '"Dynamic, non-cacheable traffic, reduce latency" — Global Accelerator, because only the path can be improved.',
      '"Two static IP addresses" in the requirements is Global Accelerator almost every time.',
    ],
    keyNumbers: [
      {
        label: 'Edge locations',
        value: 'Hundreds, in far more cities than there are Regions',
        volatile: true,
      },
    ],
    examTraps: [
      'CloudFront in front of an S3 bucket is a latency and cost answer, not a durability answer. It does not give you a second copy of anything.',
      'Regional edge caches sit between edge locations and your origin. They reduce origin load; they are not somewhere you deploy code.',
    ],
    confusedWith: [
      {
        slug: 'region',
        difference:
          'A Region runs your workload. An edge location only fronts it — caching, DNS, TLS termination and DDoS absorption.',
      },
    ],
    serviceSlugs: ['cloudfront', 'route53', 'global-accelerator', 'waf', 'shield'],
    related: ['region', 'cache-ttl-and-invalidation'],
    docsUrl: 'https://aws.amazon.com/cloudfront/features/',
  },
  {
    slug: 'cidr',
    term: 'CIDR block',
    abbr: 'CIDR',
    aka: ['CIDR notation', 'prefix length', 'netmask'],
    group: 'networking',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner:
      'A range of IP addresses written as an address and a prefix length, such as 10.0.0.0/16.',
    whatItIs:
      'Classless Inter-Domain Routing notation describes a block of addresses. In 10.0.0.0/16 the /16 says the first 16 bits are fixed; the remaining 16 bits vary, so the block holds 2^16 = 65,536 addresses. A smaller prefix number means a larger block: /16 is big, /28 is tiny. Every VPC, every subnet, every security group rule and every route table entry is expressed in this notation.',
    keyIdea:
      'The prefix number counts fixed bits, so it moves opposite to size: each step up — /16 to /17 — halves the block. 0.0.0.0/0 fixes nothing and therefore means "everywhere".',
    onTheExam: [
      'A stem that gives you subnet sizes and asks whether a design fits — count usable addresses, remembering AWS takes five per subnet.',
      '"The two VPCs cannot be peered" — check for overlapping CIDR blocks before looking at anything else.',
      'Any rule or route printed as 0.0.0.0/0 is "all IPv4 addresses"; ::/0 is its IPv6 equivalent.',
    ],
    keyNumbers: [
      { label: 'VPC CIDR size', value: '/16 (65,536 addresses) down to /28 (16)' },
      { label: 'Subnet CIDR size', value: 'Same range: /16 down to /28' },
      {
        label: 'Reserved per subnet',
        value: '5 addresses',
        note: 'Network address, VPC router, DNS, reserved for future use, broadcast. A /24 gives 251 usable, not 256.',
      },
      { label: 'Secondary CIDRs per VPC', value: 'Up to 5 by default', volatile: true },
      {
        label: 'Handy sizes',
        value: '/28 = 16 · /24 = 256 · /20 = 4,096 · /16 = 65,536',
        note: 'Every 4 bits of prefix is a factor of 16.',
      },
    ],
    examTraps: [
      'A /24 has 256 addresses but only 251 usable. A question that sizes a subnet to exactly the number of instances is testing the five reserved addresses.',
      'You cannot shrink or change a VPC CIDR after creation. You can add secondary CIDR blocks — so the answer to "we ran out of addresses" is a secondary block or a new VPC, never a resize.',
      'Overlapping CIDRs make VPC peering and Transit Gateway attachment impossible. This is why address space is designed before anything is built, and why the fix is re-addressing one side, which the exam prices as painful.',
      'Referencing a security group is not the same as referencing a CIDR. When the stem says "only from the application tier", the answer is a source security group; a CIDR range breaks the moment instances change.',
    ],
    confusedWith: [
      {
        slug: 'subnet',
        difference:
          'A CIDR block is the notation for a range of addresses. A subnet is a range you have actually carved out of a VPC and pinned to one AZ.',
      },
    ],
    serviceSlugs: ['vpc', 'security-group', 'nacl', 'vpc-peering', 'transit-gateway'],
    related: ['subnet', 'route-table', 'private-vs-public-ip'],
    docsUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html',
  },
  {
    slug: 'subnet',
    term: 'Subnet',
    group: 'networking',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner: 'A slice of a VPC CIDR block that lives in exactly one Availability Zone.',
    whatItIs:
      'A subnet is a sub-range of the VPC address space, bound to a single AZ, into which you place resources. A VPC with 10.0.0.0/16 might hold 10.0.1.0/24 in one AZ and 10.0.2.0/24 in another. Every network interface you create sits in a subnet, and that subnet decides both which AZ the resource is in and which route table governs its traffic.',
    keyIdea:
      'A subnet is two decisions at once: which failure domain the resource lives in, and which route table applies to it. Nothing about a subnet is inherently public or private — the route table decides that.',
    onTheExam: [
      '"Multi-AZ" in a requirement means at least two subnets in different AZs, and the answer that only has one subnet is wrong however good it otherwise looks.',
      '"The instance cannot reach the internet" — check the route table, then the security group, then the NACL, then whether it has a public IP. In that order.',
      'A load balancer needs subnets in at least two AZs before it will accept the configuration at all.',
    ],
    keyNumbers: [
      {
        label: 'AZs per subnet',
        value: 'Exactly 1',
        note: 'This is the whole reason subnets exist.',
      },
      { label: 'Subnets per VPC', value: '200 by default', volatile: true },
      { label: 'Usable addresses', value: 'Block size minus 5' },
    ],
    examTraps: [
      'There is no "public subnet" setting. A subnet is public because its route table has 0.0.0.0/0 pointing at an internet gateway — attach a different route table and the same subnet is private.',
      'Auto-assign public IPv4 is a subnet setting that catches people out in both directions: on, and a resource you meant to keep private is addressable; off, and an instance in a genuinely public subnet still cannot be reached.',
      'A NAT gateway goes in a public subnet and serves private ones. Putting it in the private subnet it is meant to serve is a wrong answer that looks tidy.',
      'A Lambda function attached to a VPC belongs in private subnets. In a public subnet it still has no internet access, because it gets no public IP — it needs a NAT gateway like anything else private.',
    ],
    confusedWith: [
      {
        slug: 'cidr',
        difference:
          'CIDR is the notation. A subnet is an actual allocation of that range inside a VPC, tied to one AZ and one route table.',
      },
      {
        slug: 'availability-zone',
        difference:
          'An AZ is the physical failure domain. A subnet is your logical slice inside one — several subnets can share an AZ, but no subnet spans two.',
      },
    ],
    serviceSlugs: ['vpc', 'ec2', 'elb', 'lambda', 'rds', 'nat-gateway'],
    related: ['cidr', 'route-table', 'availability-zone', 'internet-gateway', 'nat'],
    docsUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html',
  },
  {
    slug: 'route-table',
    term: 'Route table',
    group: 'networking',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner: 'The set of destination-to-target rules that decides where a subnet sends traffic.',
    whatItIs:
      'A route table is a list of entries, each pairing a destination CIDR with a target: an internet gateway, a NAT gateway, a peering connection, a Transit Gateway, a gateway endpoint, a network interface. Every subnet is associated with exactly one route table; a table can serve many subnets, and the VPC has a main table that any unassociated subnet inherits.',
    keyIdea:
      'Routing is most-specific-prefix-wins, not top-to-bottom. A 10.0.5.0/24 entry beats a 0.0.0.0/0 entry for an address inside it, whatever order they are printed in.',
    onTheExam: [
      'A public subnet is a route table with 0.0.0.0/0 to an internet gateway. Private with outbound access is 0.0.0.0/0 to a NAT gateway. Isolated has no 0.0.0.0/0 route at all.',
      'Any connectivity question where the security groups and NACLs both look correct is usually a missing route — and peering, VPN and Transit Gateway all need routes added on both sides.',
      'Keeping S3 traffic off the internet without a NAT gateway is a gateway endpoint, and a gateway endpoint works by adding a prefix-list route to the table.',
    ],
    keyNumbers: [
      {
        label: 'The local route',
        value: 'The VPC CIDR, always present, cannot be deleted or overridden',
        note: 'It is why anything in a VPC can reach anything else in it at the network layer.',
      },
      { label: 'Route tables per VPC', value: '200 by default', volatile: true },
      { label: 'Routes per table', value: '50 non-propagated by default', volatile: true },
    ],
    examTraps: [
      'The local route cannot be removed, so you cannot isolate two subnets from each other with routing. Use security groups or NACLs for that.',
      'Peering is not transitive and the routes are not automatic. A to B and B to C does not give A to C, and each connection needs entries on both sides.',
      'A gateway endpoint for S3 or DynamoDB changes the route table; an interface endpoint for everything else puts a network interface in your subnet and changes DNS instead. Naming the wrong mechanism is a common slip.',
      'Attaching an internet gateway to the VPC does nothing on its own. Until a route table points 0.0.0.0/0 at it, no subnet is public.',
    ],
    confusedWith: [
      {
        slug: 'stateful-filtering',
        difference:
          'A route table decides where a packet may be sent. Security groups and NACLs decide whether it is allowed. A packet needs a route and permission — the exam removes one of the two.',
      },
    ],
    serviceSlugs: ['vpc', 'nat-gateway', 'vpc-peering', 'transit-gateway', 'privatelink'],
    related: ['subnet', 'internet-gateway', 'nat', 'cidr', 'stateful-filtering'],
    docsUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/VpcSubnetRouting.html',
  },
  {
    slug: 'internet-gateway',
    term: 'Internet gateway',
    abbr: 'IGW',
    group: 'networking',
    certs: ['SAA-C03'],
    oneLiner: 'The VPC attachment that allows two-way traffic between public IPs and the internet.',
    whatItIs:
      'An internet gateway is a horizontally scaled, redundant VPC component with no bandwidth constraint and no charge of its own. It does two things: it provides a target for internet-bound routes, and it performs the one-to-one address translation between an instance private IP and its public or Elastic IP. One internet gateway attaches to one VPC.',
    keyIdea:
      'An internet gateway allows traffic in both directions, and only for resources that have a public address. Its presence changes nothing until a route table points at it.',
    onTheExam: [
      'The four things a public instance needs, of which the exam removes exactly one: a public or Elastic IP, a route to the internet gateway, an allowing security group, and an allowing NACL in both directions.',
      '"Outbound only" in a requirement rules the internet gateway out for that subnet and points at a NAT gateway.',
    ],
    keyNumbers: [
      { label: 'Internet gateways per VPC', value: '1' },
      { label: 'Cost', value: 'No hourly or per-GB charge for the gateway itself' },
      { label: 'Bandwidth limit', value: 'None imposed by the gateway' },
    ],
    examTraps: [
      'An egress-only internet gateway is the IPv6 equivalent of a NAT gateway, not of an internet gateway. It exists because IPv6 addresses are all public, so "outbound only" needs its own device.',
      'The gateway performs the translation for public IPs, which is why the instance never sees its own public address in its operating system configuration. A question about an application hard-coding its address is usually about this.',
    ],
    confusedWith: [
      {
        slug: 'nat',
        difference:
          'An internet gateway allows traffic in both directions for publicly addressed resources. NAT allows outbound only, for privately addressed ones.',
      },
    ],
    serviceSlugs: ['vpc', 'ec2'],
    related: ['route-table', 'subnet', 'nat', 'private-vs-public-ip'],
    docsUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html',
  },
  {
    slug: 'nat',
    term: 'Network address translation',
    abbr: 'NAT',
    aka: ['NAT gateway', 'NAT instance'],
    group: 'networking',
    certs: ['SAA-C03'],
    oneLiner:
      'Lets privately addressed resources reach the internet outbound without being reachable inbound.',
    whatItIs:
      'NAT rewrites the source address of outbound packets to one the internet can route back to, and keeps a translation table so replies find their way home. In a VPC this is a managed NAT gateway — placed in a public subnet, with an Elastic IP — that private subnets route 0.0.0.0/0 to. The older NAT instance is an EC2 instance doing the same job that you have to scale and patch yourself.',
    keyIdea:
      'NAT is asymmetric on purpose: replies to connections you started come back, and connections started from outside do not. That is exactly what a private subnet that still needs to download patches requires.',
    onTheExam: [
      '"Private instances must download updates but must not be reachable from the internet" — NAT gateway, every time.',
      '"Highly available NAT" means one NAT gateway per AZ, each with a route table for the private subnets in its own AZ.',
      '"Reduce NAT gateway data-processing charges for S3 traffic" — a gateway endpoint, which bypasses NAT entirely and is free.',
    ],
    keyNumbers: [
      { label: 'Bandwidth', value: 'Scales to 100 Gbps', volatile: true },
      {
        label: 'Charges',
        value: 'Hourly rate plus a per-GB data-processing charge',
        note: 'Both are why endpoints and instance placement come up in cost questions.',
        volatile: true,
      },
      { label: 'Scope', value: 'One AZ — a NAT gateway does not fail over' },
    ],
    examTraps: [
      'A NAT gateway lives in a public subnet and serves private ones. Placing it in the private subnet is the wrong answer that looks tidy.',
      'One NAT gateway for three AZs is both a single point of failure and a source of inter-AZ transfer charges. Any "highly available" or "reduce cost" stem is probably about this.',
      'A NAT instance needs source and destination checking disabled; a NAT gateway does not. That detail only ever appears to make the NAT instance option look plausible.',
      'NAT does not help inbound. If the requirement is to receive traffic from the internet, the answer is a load balancer or a public IP, not NAT.',
    ],
    confusedWith: [
      {
        slug: 'internet-gateway',
        difference:
          'NAT is outbound only and for private addresses. An internet gateway is bidirectional and for public ones. Private subnets route to NAT; public subnets route to the internet gateway.',
      },
    ],
    serviceSlugs: ['nat-gateway', 'vpc', 'privatelink'],
    related: ['internet-gateway', 'route-table', 'subnet', 'private-vs-public-ip'],
    docsUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html',
  },
  {
    slug: 'private-vs-public-ip',
    term: 'Private, public and Elastic IP',
    group: 'networking',
    certs: ['SAA-C03'],
    oneLiner: 'Three kinds of address with different lifetimes and different reachability.',
    whatItIs:
      'A private IPv4 address comes from the subnet CIDR, is assigned for the life of the network interface and is only routable inside the VPC and anything connected to it. A public IPv4 address is drawn from an AWS pool, assigned at launch if the subnet says so, and released when the instance stops — so it changes. An Elastic IP is a public address you allocate to your account and keep until you release it.',
    keyIdea:
      'Private addresses persist and are not reachable; public addresses are reachable and do not persist. An Elastic IP is what you use when you need both, and it is the one that costs money while unused.',
    onTheExam: [
      '"The address changed after a reboot" — it was a public IP, and the fix is an Elastic IP or, better, a DNS name in front of a load balancer.',
      '"A fixed IP the firewall team can allow-list" — Elastic IP, or Global Accelerator when they need two static addresses at the edge.',
    ],
    keyNumbers: [
      { label: 'Elastic IPs per Region', value: '5 by default', volatile: true },
      {
        label: 'Idle Elastic IP',
        value: 'Charged per hour when not associated with a running instance',
        note: 'Public IPv4 addresses now also carry an hourly charge whether idle or not.',
        volatile: true,
      },
      { label: 'IPv6', value: 'All AWS IPv6 addresses are public — there is no private IPv6' },
    ],
    examTraps: [
      'Stopping and starting an instance releases its public IP; a reboot does not. A question that distinguishes stop-start from reboot is testing exactly this.',
      'An Elastic IP costs money precisely when it is not attached. Cost questions use unattached Elastic IPs as the answer more often than people expect.',
      'Because IPv6 has no private range, outbound-only IPv6 needs an egress-only internet gateway rather than NAT.',
    ],
    confusedWith: [
      {
        slug: 'cidr',
        difference:
          'CIDR describes ranges. These are individual addresses drawn from ranges — the private one from your subnet, the public one from an AWS pool.',
      },
    ],
    serviceSlugs: ['ec2', 'vpc', 'elb', 'global-accelerator'],
    related: ['subnet', 'internet-gateway', 'nat'],
    docsUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html',
  },
  {
    slug: 'stateful-filtering',
    term: 'Stateful versus stateless filtering',
    group: 'networking',
    certs: ['SAA-C03', 'DVA-C02'],
    oneLiner:
      'Whether a firewall remembers the connection it already allowed, or judges every packet alone.',
    whatItIs:
      'A stateful filter tracks connections: if it allowed the outbound request, it allows the reply automatically, whatever the inbound rules say. A stateless filter has no memory, so the reply is evaluated on its own and needs its own rule. In a VPC, security groups are stateful and network ACLs are stateless — which is why NACLs need rules for ephemeral ports and security groups do not.',
    keyIdea:
      'Stateful means the reply is allowed automatically. Stateless means the reply is a separate packet needing its own rule — in practice, an outbound rule for ports 1024 to 65535.',
    onTheExam: [
      'Any question where outbound works and the reply never arrives is a stateless filter missing an ephemeral-port rule.',
      'Security groups only have allow rules, so "block this one IP address" cannot be a security group — it has to be a NACL, WAF or Network Firewall.',
      '"Allow only the application tier" is a security group referencing another security group, not a CIDR.',
    ],
    keyNumbers: [
      {
        label: 'Ephemeral port range',
        value: '1024–65535',
        note: 'What a stateless outbound rule must allow.',
      },
      {
        label: 'NACL rule evaluation',
        value: 'Lowest rule number first, first match wins',
        note: 'Unlike security groups, where all rules are evaluated together.',
      },
      { label: 'Security group default', value: 'Deny all inbound, allow all outbound' },
      {
        label: 'Default NACL',
        value: 'Allows all traffic both ways; a custom NACL denies everything until you add rules',
      },
    ],
    examTraps: [
      'A NACL denying inbound on the ephemeral range breaks every outbound connection the instance makes, which presents as a routing or DNS problem.',
      'Security groups cannot deny. If the requirement contains the word "block", the answer is somewhere else.',
      'NACLs are subnet-scoped and security groups are interface-scoped, so a NACL cannot filter between two instances in the same subnet.',
    ],
    confusedWith: [
      {
        slug: 'route-table',
        difference:
          'Filtering decides whether a packet is permitted; routing decides where it goes. A blocked packet had a route; an unroutable one was never filtered.',
      },
    ],
    serviceSlugs: ['security-group', 'nacl', 'network-firewall', 'waf'],
    related: ['route-table', 'subnet', 'least-privilege'],
    docsUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html',
  },
]
