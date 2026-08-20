import type { Topology } from './types'

/**
 * The canonical three-tier VPC: two AZs, a public tier holding the load
 * balancer and NAT, a private app tier, and a private data tier reachable only
 * from the app tier. This is the shape the exam draws in its head.
 */
export function threeTierVpc(): Topology {
  return {
    vpc: { id: 'vpc-main', cidr: '10.0.0.0/16', internetGatewayId: 'igw-1' },
    subnets: [
      { id: 'subnet-public-a', vpcId: 'vpc-main', cidr: '10.0.1.0/24', az: 'eu-west-1a', routeTableId: 'rtb-public', naclId: 'acl-default' },
      { id: 'subnet-public-b', vpcId: 'vpc-main', cidr: '10.0.2.0/24', az: 'eu-west-1b', routeTableId: 'rtb-public', naclId: 'acl-default' },
      { id: 'subnet-app-a', vpcId: 'vpc-main', cidr: '10.0.11.0/24', az: 'eu-west-1a', routeTableId: 'rtb-private-a', naclId: 'acl-default' },
      { id: 'subnet-app-b', vpcId: 'vpc-main', cidr: '10.0.12.0/24', az: 'eu-west-1b', routeTableId: 'rtb-private-b', naclId: 'acl-default' },
      { id: 'subnet-data-a', vpcId: 'vpc-main', cidr: '10.0.21.0/24', az: 'eu-west-1a', routeTableId: 'rtb-data', naclId: 'acl-default' },
    ],
    routeTables: [
      {
        id: 'rtb-public',
        name: 'public',
        routes: [
          { destination: '10.0.0.0/16', target: { kind: 'local' } },
          { destination: '0.0.0.0/0', target: { kind: 'igw', id: 'igw-1' } },
        ],
      },
      {
        id: 'rtb-private-a',
        name: 'private-a',
        routes: [
          { destination: '10.0.0.0/16', target: { kind: 'local' } },
          { destination: '0.0.0.0/0', target: { kind: 'nat', id: 'nat-a' } },
        ],
      },
      {
        id: 'rtb-private-b',
        name: 'private-b',
        routes: [
          { destination: '10.0.0.0/16', target: { kind: 'local' } },
          { destination: '0.0.0.0/0', target: { kind: 'nat', id: 'nat-a' } },
        ],
      },
      {
        // No internet route at all — the data tier has no business reaching out.
        id: 'rtb-data',
        name: 'data',
        routes: [{ destination: '10.0.0.0/16', target: { kind: 'local' } }],
      },
    ],
    nacls: [
      {
        id: 'acl-default',
        name: 'default',
        rules: [
          { number: 100, direction: 'inbound', action: 'allow', protocol: 'all', from: 0, to: 65535, cidr: '0.0.0.0/0' },
          { number: 100, direction: 'outbound', action: 'allow', protocol: 'all', from: 0, to: 65535, cidr: '0.0.0.0/0' },
        ],
      },
    ],
    securityGroups: [
      {
        id: 'sg-alb',
        name: 'alb-sg',
        rules: [
          { direction: 'inbound', protocol: 'tcp', from: 443, to: 443, source: '0.0.0.0/0' },
          { direction: 'inbound', protocol: 'tcp', from: 80, to: 80, source: '0.0.0.0/0' },
          { direction: 'outbound', protocol: 'all', from: 0, to: 65535, source: '0.0.0.0/0' },
        ],
      },
      {
        id: 'sg-app',
        name: 'app-sg',
        rules: [
          // Referencing the ALB's group, not a CIDR — the idiomatic tier rule.
          { direction: 'inbound', protocol: 'tcp', from: 8080, to: 8080, source: 'sg-alb' },
          { direction: 'outbound', protocol: 'all', from: 0, to: 65535, source: '0.0.0.0/0' },
        ],
      },
      {
        id: 'sg-db',
        name: 'db-sg',
        rules: [
          { direction: 'inbound', protocol: 'tcp', from: 5432, to: 5432, source: 'sg-app' },
          { direction: 'outbound', protocol: 'all', from: 0, to: 65535, source: '0.0.0.0/0' },
        ],
      },
    ],
    natGateways: [{ id: 'nat-a', subnetId: 'subnet-public-a' }],
    instances: [
      { id: 'i-alb', name: 'Load balancer', subnetId: 'subnet-public-a', privateIp: '10.0.1.10', publicIp: '52.1.2.3', securityGroupIds: ['sg-alb'] },
      { id: 'i-app-a', name: 'App server A', subnetId: 'subnet-app-a', privateIp: '10.0.11.20', publicIp: null, securityGroupIds: ['sg-app'] },
      { id: 'i-app-b', name: 'App server B', subnetId: 'subnet-app-b', privateIp: '10.0.12.20', publicIp: null, securityGroupIds: ['sg-app'] },
      { id: 'i-db', name: 'Database', subnetId: 'subnet-data-a', privateIp: '10.0.21.30', publicIp: null, securityGroupIds: ['sg-db'] },
    ],
  }
}

/** Deep clone so a lab can mutate freely without touching the template. */
export function cloneTopology(t: Topology): Topology {
  return structuredClone(t)
}

/**
 * The break-it challenges. Each one applies a single realistic
 * misconfiguration; the learner has to predict the symptom before running the
 * packet. Predicting the symptom is the skill the exam actually tests.
 */
export interface BreakIt {
  id: string
  title: string
  /** What the learner should predict before pressing send. */
  question: string
  apply: (t: Topology) => Topology
  expectDelivered: boolean
  /** The concept it proves. */
  answer: string
}

export const breakIts: BreakIt[] = [
  {
    id: 'no-nat-route',
    title: 'Delete the private subnet’s 0.0.0.0/0 route',
    question: 'App server A tries to download a patch from the internet. What happens, and where exactly does it stop?',
    apply: (t) => {
      const rt = t.routeTables.find((r) => r.id === 'rtb-private-a')!
      rt.routes = rt.routes.filter((r) => r.destination !== '0.0.0.0/0')
      return t
    },
    expectDelivered: false,
    answer:
      'It dies at the route table, not at the security group. Egress rules still allow it out of the instance — there is simply nowhere for the packet to go. This is why "check the security group" is often the wrong first instinct.',
  },
  {
    id: 'nacl-ephemeral',
    title: 'Remove the NACL’s outbound rule',
    question: 'A client on the internet requests the load balancer on port 443. The inbound rule still allows it. Does the request succeed?',
    apply: (t) => {
      const acl = t.nacls.find((n) => n.id === 'acl-default')!
      acl.rules = acl.rules.filter((r) => r.direction !== 'outbound')
      return t
    },
    expectDelivered: false,
    answer:
      'No. The request arrives, but the *reply* is dropped outbound. NACLs are stateless, so return traffic needs its own rule on the ephemeral range 1024–65535. A security group would have allowed the reply automatically — this is the single most-tested difference between the two.',
  },
  {
    id: 'nat-in-private',
    title: 'Move the NAT gateway into a private subnet',
    question: 'The NAT gateway now sits in subnet-app-b. App server A still routes to it. What happens?',
    apply: (t) => {
      t.natGateways[0].subnetId = 'subnet-app-b'
      return t
    },
    expectDelivered: false,
    answer:
      'Nothing gets out. A NAT gateway must live in a subnet with a route to the internet gateway — otherwise it has no way out itself. Putting NAT in the private subnet it serves is self-defeating, and it looks correct in the console.',
  },
  {
    id: 'deleted-nat',
    title: 'Delete the NAT gateway but leave the route',
    question: 'The NAT gateway is gone; the route table still points at it. What does the route table show, and what does the packet do?',
    apply: (t) => {
      t.natGateways = []
      return t
    },
    expectDelivered: false,
    answer:
      'The route becomes a blackhole and the packet is discarded. The route table still lists an entry, so the configuration looks intact — which is what makes this one hard to spot in an incident.',
  },
  {
    id: 'sg-cidr-instead-of-ref',
    title: 'Point the database rule at the wrong CIDR',
    question: 'The database security group now allows 5432 from 10.0.99.0/24 instead of referencing the app security group. Can App server A reach it?',
    apply: (t) => {
      const sg = t.securityGroups.find((s) => s.id === 'sg-db')!
      sg.rules = sg.rules.map((r) =>
        r.direction === 'inbound' ? { ...r, source: '10.0.99.0/24' } : r,
      )
      return t
    },
    expectDelivered: false,
    answer:
      'No. This is why referencing the source security group beats hard-coding a CIDR: the reference keeps working as subnets change and instances come and go, and it expresses the intent ("only the app tier") rather than an address that happens to be true today.',
  },
  {
    id: 'no-igw',
    title: 'Detach the internet gateway',
    question: 'The internet gateway is detached. Which breaks first — the public load balancer or the private app server’s outbound patching?',
    apply: (t) => {
      t.vpc.internetGatewayId = null
      return t
    },
    expectDelivered: false,
    answer:
      'Both, and for the same reason. NAT depends on the internet gateway too, so detaching it takes out private egress as well as public ingress. The internet gateway is a VPC-level single point the whole design rests on.',
  },
  {
    id: 'app-no-public-ip',
    title: 'Try to reach the internet from a public subnet with no public IP',
    question: 'Move App server A into subnet-public-a so it uses the public route table, but leave it without a public IP. Does it reach the internet?',
    apply: (t) => {
      const app = t.instances.find((i) => i.id === 'i-app-a')!
      app.subnetId = 'subnet-public-a'
      return t
    },
    expectDelivered: false,
    answer:
      'No. An internet gateway performs one-to-one NAT for instances that have a public address; with none, there is nothing to translate. A "public subnet" is not enough on its own — which is precisely why private instances need a NAT gateway.',
  },
]
