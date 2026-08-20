/**
 * A small VPC model: enough to make the stateful/stateless distinction, route
 * tables, and the NAT-gateway path behave the way they really do — which is
 * what the VPC lab needs in order to teach anything.
 */

export type SubnetTier = 'public' | 'private'

export interface Vpc {
  id: string
  cidr: string
  /** An internet gateway exists only if this is set. */
  internetGatewayId: string | null
}

export interface Subnet {
  id: string
  vpcId: string
  cidr: string
  az: string
  routeTableId: string
  naclId: string
}

export type RouteTarget =
  | { kind: 'local' }
  | { kind: 'igw'; id: string }
  | { kind: 'nat'; id: string }
  | { kind: 'endpoint-gateway'; service: 's3' | 'dynamodb' }
  | { kind: 'peering'; id: string }
  | { kind: 'tgw'; id: string }
  | { kind: 'blackhole' }

export interface Route {
  destination: string
  target: RouteTarget
}

export interface RouteTable {
  id: string
  name: string
  routes: Route[]
}

export interface NaclRule {
  number: number
  direction: 'inbound' | 'outbound'
  action: 'allow' | 'deny'
  protocol: 'tcp' | 'udp' | 'icmp' | 'all'
  /** Inclusive port range. */
  from: number
  to: number
  cidr: string
}

export interface Nacl {
  id: string
  name: string
  rules: NaclRule[]
}

export interface SgRule {
  direction: 'inbound' | 'outbound'
  protocol: 'tcp' | 'udp' | 'icmp' | 'all'
  from: number
  to: number
  /** Either a CIDR or another security group's id — the tier-to-tier idiom. */
  source: string
}

export interface SecurityGroup {
  id: string
  name: string
  rules: SgRule[]
}

export interface NatGateway {
  id: string
  /** NAT lives in a public subnet, and it is zonal. */
  subnetId: string
}

export interface Instance {
  id: string
  name: string
  subnetId: string
  privateIp: string
  publicIp: string | null
  securityGroupIds: string[]
}

export interface Topology {
  vpc: Vpc
  subnets: Subnet[]
  routeTables: RouteTable[]
  nacls: Nacl[]
  securityGroups: SecurityGroup[]
  natGateways: NatGateway[]
  instances: Instance[]
}

export interface Packet {
  /** Instance id, or 'internet' for inbound traffic from outside. */
  fromId: string
  /** Instance id, 'internet', or an AWS service name. */
  toId: string
  protocol: 'tcp' | 'udp' | 'icmp'
  port: number
  /** Source IP used for NACL and SG matching when the origin is the internet. */
  externalIp?: string
}

export type HopKind =
  | 'source'
  | 'sg-egress'
  | 'nacl-egress'
  | 'route'
  | 'nat'
  | 'igw'
  | 'endpoint'
  | 'nacl-ingress'
  | 'sg-ingress'
  | 'destination'
  | 'return-nacl'
  | 'return-sg'

export interface Hop {
  kind: HopKind
  label: string
  /** The specific rule or route consulted. */
  detail: string
  ok: boolean
  /** Set when this hop is where the packet died. */
  blockedBy?: string
  /** How to fix it — the whole point of the simulator. */
  fix?: string
}

export interface RouteResult {
  delivered: boolean
  hops: Hop[]
  /** One-sentence verdict, phrased the way an exam explanation would be. */
  summary: string
  /** The exam concept this path demonstrates. */
  lesson: string
}
