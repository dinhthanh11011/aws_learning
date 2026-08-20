import { ipInCidr } from '../policy/evaluate'
import type {
  Hop,
  Nacl,
  NaclRule,
  Packet,
  RouteResult,
  RouteTable,
  SecurityGroup,
  Subnet,
  Topology,
} from './types'

const INTERNET = 'internet'
const EPHEMERAL: [number, number] = [1024, 65535]

/* ── Lookups ─────────────────────────────────────────────────────────────── */

const byId = <T extends { id: string }>(list: T[], id: string) => list.find((x) => x.id === id)

function subnetOf(t: Topology, instanceId: string): Subnet | undefined {
  const inst = byId(t.instances, instanceId)
  return inst ? byId(t.subnets, inst.subnetId) : undefined
}

function protoMatches(rule: { protocol: string }, packet: Packet): boolean {
  return rule.protocol === 'all' || rule.protocol === packet.protocol
}

/**
 * Security groups are stateful and allow-only: any matching rule permits the
 * traffic, and the return direction is implicit.
 */
function sgAllows(
  groups: SecurityGroup[],
  ids: string[],
  direction: 'inbound' | 'outbound',
  packet: Packet,
  sourceIp: string,
  sourceSgIds: string[],
): { ok: boolean; detail: string } {
  const attached = ids.map((id) => byId(groups, id)).filter((g): g is SecurityGroup => Boolean(g))
  for (const g of attached) {
    for (const r of g.rules) {
      if (r.direction !== direction) continue
      if (!protoMatches(r, packet)) continue
      if (packet.protocol !== 'icmp' && (packet.port < r.from || packet.port > r.to)) continue
      const isSgRef = r.source.startsWith('sg-')
      const matched = isSgRef ? sourceSgIds.includes(r.source) : ipInCidr(sourceIp, r.source)
      if (matched) {
        return {
          ok: true,
          detail: `${g.name}: ${direction} ${r.protocol}/${r.from}-${r.to} from ${r.source}`,
        }
      }
    }
  }
  return {
    ok: false,
    detail: attached.length
      ? `no ${direction} rule in ${attached.map((g) => g.name).join(', ')} matches ${packet.protocol}/${packet.port} from ${sourceIp}`
      : 'no security group attached',
  }
}

/**
 * NACLs are stateless and ordered: rules are evaluated lowest-number-first and
 * the first match wins, allow or deny. Anything unmatched hits the implicit
 * `*` deny.
 */
function naclDecision(
  nacl: Nacl | undefined,
  direction: 'inbound' | 'outbound',
  packet: Packet,
  peerIp: string,
  portRange: [number, number],
): { ok: boolean; detail: string; rule?: NaclRule } {
  if (!nacl) return { ok: true, detail: 'no NACL associated (default allow)' }
  const ordered = nacl.rules
    .filter((r) => r.direction === direction)
    .sort((a, b) => a.number - b.number)

  for (const r of ordered) {
    if (!protoMatches(r, packet)) continue
    const overlaps = r.from <= portRange[1] && r.to >= portRange[0]
    if (packet.protocol !== 'icmp' && !overlaps) continue
    if (!ipInCidr(peerIp, r.cidr)) continue
    return {
      ok: r.action === 'allow',
      rule: r,
      detail: `${nacl.name} rule ${r.number}: ${r.action} ${r.protocol}/${r.from}-${r.to} ${r.cidr}`,
    }
  }
  return {
    ok: false,
    detail: `${nacl.name}: no rule matched, so the implicit * deny applies`,
  }
}

function findRoute(table: RouteTable | undefined, destIp: string): { route?: RouteTable['routes'][number]; detail: string } {
  if (!table) return { detail: 'no route table associated' }
  // Longest-prefix match, exactly like a real route table.
  const candidates = table.routes
    .filter((r) => r.destination === '0.0.0.0/0' || ipInCidr(destIp, r.destination))
    .sort((a, b) => Number(b.destination.split('/')[1] ?? 0) - Number(a.destination.split('/')[1] ?? 0))
  const route = candidates[0]
  if (!route) return { detail: `${table.name}: no route matches ${destIp}` }
  return { route, detail: `${table.name}: ${route.destination} → ${route.target.kind}` }
}

/* ── The simulator ───────────────────────────────────────────────────────── */

/**
 * Sends a packet through the topology and returns every hop it passed or failed
 * at, with the specific rule responsible and how to fix it.
 *
 * The failure messages are the product here: "route table has no 0.0.0.0/0
 * entry" teaches far more than "unreachable".
 */
export function routePacket(t: Topology, packet: Packet): RouteResult {
  const hops: Hop[] = []
  const push = (h: Hop) => hops.push(h)

  const outbound = packet.fromId !== INTERNET
  const src = outbound ? byId(t.instances, packet.fromId) : undefined
  const dstInstance = packet.toId === INTERNET ? undefined : byId(t.instances, packet.toId)
  const toInternet = packet.toId === INTERNET
  const toAwsService = packet.toId === 's3' || packet.toId === 'dynamodb'

  /* Inbound from the internet — the "is my web tier reachable?" case. */
  if (!outbound) {
    if (!dstInstance) {
      return {
        delivered: false,
        hops,
        summary: 'No destination instance.',
        lesson: 'Pick a target before sending a packet.',
      }
    }
    const dstSubnet = byId(t.subnets, dstInstance.subnetId)!
    const dstTable = byId(t.routeTables, dstSubnet.routeTableId)
    const isPublic = dstTable?.routes.some(
      (r) => r.destination === '0.0.0.0/0' && r.target.kind === 'igw',
    )
    const extIp = packet.externalIp ?? '203.0.113.10'

    push({ kind: 'source', label: 'Internet', detail: `client ${extIp}`, ok: true })

    if (!t.vpc.internetGatewayId) {
      push({
        kind: 'igw',
        label: 'Internet gateway',
        detail: 'no internet gateway attached to the VPC',
        ok: false,
        blockedBy: 'missing internet gateway',
        fix: 'Attach an internet gateway to the VPC.',
      })
      return {
        delivered: false,
        hops,
        summary: 'Dropped at the VPC edge — there is no internet gateway, so no traffic can enter or leave.',
        lesson: 'An internet gateway is a VPC-level attachment. Without it, nothing about the subnets matters.',
      }
    }
    push({ kind: 'igw', label: 'Internet gateway', detail: t.vpc.internetGatewayId, ok: true })

    if (!isPublic) {
      push({
        kind: 'route',
        label: 'Route table',
        detail: `${dstTable?.name ?? 'none'}: no 0.0.0.0/0 → igw route`,
        ok: false,
        blockedBy: 'subnet is private',
        fix: 'Add a 0.0.0.0/0 route to the internet gateway, or put the target in a public subnet behind a load balancer.',
      })
      return {
        delivered: false,
        hops,
        summary: `Dropped: ${dstSubnet.id} is a private subnet, because its route table has no route to the internet gateway.`,
        lesson: 'A subnet is public if and only if its route table sends 0.0.0.0/0 to an internet gateway. Nothing else makes it public.',
      }
    }
    push({ kind: 'route', label: 'Route table', detail: `${dstTable!.name}: 0.0.0.0/0 → igw`, ok: true })

    if (!dstInstance.publicIp) {
      push({
        kind: 'destination',
        label: dstInstance.name,
        detail: 'instance has no public IP address',
        ok: false,
        blockedBy: 'no public IP',
        fix: 'Assign a public or Elastic IP, or place the instance behind an internet-facing load balancer.',
      })
      return {
        delivered: false,
        hops,
        summary: 'Dropped: the subnet is public but the instance has no public IP, so nothing on the internet can address it.',
        lesson: 'A public subnet plus a public IP plus permissive security groups — all three are needed for inbound reachability.',
      }
    }

    const inNacl = naclDecision(byId(t.nacls, dstSubnet.naclId), 'inbound', packet, extIp, [
      packet.port,
      packet.port,
    ])
    push({
      kind: 'nacl-ingress',
      label: 'NACL inbound',
      detail: inNacl.detail,
      ok: inNacl.ok,
      ...(inNacl.ok ? {} : { blockedBy: 'NACL inbound', fix: `Add an inbound allow rule for ${packet.protocol}/${packet.port} from ${extIp}.` }),
    })
    if (!inNacl.ok) {
      return {
        delivered: false,
        hops,
        summary: `Dropped by the network ACL on the way in: ${inNacl.detail}.`,
        lesson: 'NACL rules are evaluated in ascending number order and the first match wins. An unmatched packet hits the implicit * deny.',
      }
    }

    const inSg = sgAllows(t.securityGroups, dstInstance.securityGroupIds, 'inbound', packet, extIp, [])
    push({
      kind: 'sg-ingress',
      label: 'Security group inbound',
      detail: inSg.detail,
      ok: inSg.ok,
      ...(inSg.ok ? {} : { blockedBy: 'security group inbound', fix: `Add an inbound rule allowing ${packet.protocol}/${packet.port} from ${extIp} (or 0.0.0.0/0 for a public web tier).` }),
    })
    if (!inSg.ok) {
      return {
        delivered: false,
        hops,
        summary: `Dropped by the security group: ${inSg.detail}.`,
        lesson: 'Security groups are allow-only. A new group denies all inbound traffic until you add a rule.',
      }
    }

    // Stateless NACLs must also permit the reply, on an ephemeral port.
    const outNacl = naclDecision(byId(t.nacls, dstSubnet.naclId), 'outbound', packet, extIp, EPHEMERAL)
    push({
      kind: 'return-nacl',
      label: 'NACL outbound (the reply)',
      detail: outNacl.detail,
      ok: outNacl.ok,
      ...(outNacl.ok ? {} : { blockedBy: 'NACL outbound (ephemeral ports)', fix: 'Add an outbound allow rule for TCP 1024–65535 — NACLs are stateless, so the reply needs its own rule.' }),
    })
    if (!outNacl.ok) {
      return {
        delivered: false,
        hops,
        summary: 'The request arrived, but the reply was dropped outbound by the NACL on the ephemeral port range.',
        lesson: 'This is the classic stateless trap: the security group allowed the reply automatically, the NACL did not. NACLs need an explicit ephemeral-port rule (1024–65535) for return traffic.',
      }
    }

    push({ kind: 'destination', label: dstInstance.name, detail: `${dstInstance.privateIp}:${packet.port}`, ok: true })
    return {
      delivered: true,
      hops,
      summary: `Delivered. ${extIp} reached ${dstInstance.name} on ${packet.protocol}/${packet.port}, and the reply got back out.`,
      lesson: 'Inbound from the internet needs all four: an internet gateway, a 0.0.0.0/0 route, a public IP, and permissive security group and NACL rules in both directions.',
    }
  }

  /* Outbound from an instance. */
  if (!src) {
    return { delivered: false, hops, summary: 'No source instance.', lesson: 'Pick a source.' }
  }
  const srcSubnet = subnetOf(t, src.id)!
  const srcTable = byId(t.routeTables, srcSubnet.routeTableId)
  push({
    kind: 'source',
    label: src.name,
    detail: `${src.privateIp} in ${srcSubnet.id} (${srcSubnet.az})`,
    ok: true,
  })

  const destIp = dstInstance?.privateIp ?? (toAwsService ? '52.216.0.1' : '93.184.216.34')

  const outSg = sgAllows(t.securityGroups, src.securityGroupIds, 'outbound', packet, destIp, [])
  push({
    kind: 'sg-egress',
    label: 'Security group outbound',
    detail: outSg.detail,
    ok: outSg.ok,
    ...(outSg.ok ? {} : { blockedBy: 'security group outbound', fix: 'Add an outbound rule, or restore the default allow-all egress rule.' }),
  })
  if (!outSg.ok) {
    return {
      delivered: false,
      hops,
      summary: `Dropped leaving the instance: ${outSg.detail}.`,
      lesson: 'A new security group allows all outbound by default. Removing that rule breaks package installs, NFS mounts and SSM — a commonly overlooked cause.',
    }
  }

  const outNacl = naclDecision(byId(t.nacls, srcSubnet.naclId), 'outbound', packet, destIp, [
    packet.port,
    packet.port,
  ])
  push({
    kind: 'nacl-egress',
    label: 'NACL outbound',
    detail: outNacl.detail,
    ok: outNacl.ok,
    ...(outNacl.ok ? {} : { blockedBy: 'NACL outbound', fix: `Add an outbound allow rule for ${packet.protocol}/${packet.port}.` }),
  })
  if (!outNacl.ok) {
    return {
      delivered: false,
      hops,
      summary: `Dropped by the subnet's network ACL on the way out: ${outNacl.detail}.`,
      lesson: 'NACLs filter at the subnet boundary, before the packet ever leaves the subnet.',
    }
  }

  const { route, detail: routeDetail } = findRoute(srcTable, destIp)
  push({
    kind: 'route',
    label: 'Route table',
    detail: routeDetail,
    ok: Boolean(route) && route!.target.kind !== 'blackhole',
    ...(route && route.target.kind !== 'blackhole'
      ? {}
      : {
          blockedBy: 'no usable route',
          fix: toInternet
            ? 'Add a 0.0.0.0/0 route to a NAT gateway (private subnet) or an internet gateway (public subnet).'
            : 'Add a route to the destination CIDR.',
        }),
  })
  if (!route || route.target.kind === 'blackhole') {
    return {
      delivered: false,
      hops,
      summary: `Dropped: ${routeDetail}. With no matching route the packet has nowhere to go.`,
      lesson: 'Routing is checked after the security group and NACL let the packet out. A permissive security group cannot create a route that does not exist.',
    }
  }

  /* Same-VPC delivery. */
  if (route.target.kind === 'local' && dstInstance) {
    const dstSubnet = byId(t.subnets, dstInstance.subnetId)!
    const inNacl = naclDecision(byId(t.nacls, dstSubnet.naclId), 'inbound', packet, src.privateIp, [
      packet.port,
      packet.port,
    ])
    push({
      kind: 'nacl-ingress',
      label: 'NACL inbound',
      detail: inNacl.detail,
      ok: inNacl.ok,
      ...(inNacl.ok ? {} : { blockedBy: 'NACL inbound', fix: `Allow inbound ${packet.protocol}/${packet.port} from ${srcSubnet.cidr}.` }),
    })
    if (!inNacl.ok) {
      return {
        delivered: false,
        hops,
        summary: `Dropped by the destination subnet's NACL: ${inNacl.detail}.`,
        lesson: 'Traffic inside a VPC still crosses subnet boundaries, so NACLs on both subnets apply.',
      }
    }

    const inSg = sgAllows(
      t.securityGroups,
      dstInstance.securityGroupIds,
      'inbound',
      packet,
      src.privateIp,
      src.securityGroupIds,
    )
    push({
      kind: 'sg-ingress',
      label: 'Security group inbound',
      detail: inSg.detail,
      ok: inSg.ok,
      ...(inSg.ok ? {} : { blockedBy: 'security group inbound', fix: `Add an inbound rule on ${dstInstance.name}'s security group allowing ${packet.protocol}/${packet.port} from the source security group — referencing the group is better than hard-coding a CIDR.` }),
    })
    if (!inSg.ok) {
      return {
        delivered: false,
        hops,
        summary: `Dropped at the destination: ${inSg.detail}.`,
        lesson: 'Referencing the source security group as the rule source is the idiomatic way to express "only the app tier may reach the database" — it keeps working as instances come and go.',
      }
    }

    push({ kind: 'destination', label: dstInstance.name, detail: `${dstInstance.privateIp}:${packet.port}`, ok: true })
    const crossAz = dstSubnet.az !== srcSubnet.az
    return {
      delivered: true,
      hops,
      summary: `Delivered inside the VPC${crossAz ? ` — and note it crossed from ${srcSubnet.az} to ${dstSubnet.az}, which is billed in both directions` : ''}.`,
      lesson: crossAz
        ? 'Cross-AZ traffic is charged both ways. It buys resilience, and the cost is a real design consideration.'
        : 'The local route handles all intra-VPC traffic and cannot be deleted.',
    }
  }

  /* Gateway VPC endpoint — the free path to S3 and DynamoDB. */
  if (route.target.kind === 'endpoint-gateway') {
    if (!toAwsService || route.target.service !== packet.toId) {
      push({
        kind: 'endpoint',
        label: 'Gateway endpoint',
        detail: `endpoint serves ${route.target.service}, not ${packet.toId}`,
        ok: false,
        blockedBy: 'wrong endpoint service',
        fix: 'Gateway endpoints only serve S3 and DynamoDB. Everything else needs an interface endpoint or NAT.',
      })
      return {
        delivered: false,
        hops,
        summary: `Dropped: the gateway endpoint serves ${route.target.service}, but this packet is bound for ${packet.toId}.`,
        lesson: 'Gateway endpoints exist for S3 and DynamoDB only. Every other AWS service needs an interface endpoint (PrivateLink) or a NAT gateway.',
      }
    }
    push({
      kind: 'endpoint',
      label: 'Gateway VPC endpoint',
      detail: `${route.target.service} — stays on the AWS network, and costs nothing`,
      ok: true,
    })
    push({ kind: 'destination', label: packet.toId.toUpperCase(), detail: 'reached privately', ok: true })
    return {
      delivered: true,
      hops,
      summary: `Delivered to ${packet.toId.toUpperCase()} through a gateway endpoint — no internet, no NAT charge.`,
      lesson: 'This is the standard fix for a large NAT gateway bill: S3 and DynamoDB traffic should go through a free gateway endpoint instead.',
    }
  }

  /* NAT gateway — the private-subnet egress path. */
  if (route.target.kind === 'nat') {
    const nat = byId(t.natGateways, route.target.id)
    if (!nat) {
      push({
        kind: 'nat',
        label: 'NAT gateway',
        detail: `route points at ${route.target.id}, which does not exist`,
        ok: false,
        blockedBy: 'deleted NAT gateway (blackhole route)',
        fix: 'Recreate the NAT gateway, or repoint the route. A route to a deleted target shows as "blackhole".',
      })
      return {
        delivered: false,
        hops,
        summary: 'Dropped: the route points at a NAT gateway that no longer exists — a blackhole route.',
        lesson: 'Deleting a NAT gateway leaves the route behind as a blackhole. The route table looks configured, and nothing works.',
      }
    }
    const natSubnet = byId(t.subnets, nat.subnetId)!
    const natTable = byId(t.routeTables, natSubnet.routeTableId)
    const natHasIgw = natTable?.routes.some(
      (r) => r.destination === '0.0.0.0/0' && r.target.kind === 'igw',
    )
    if (!natHasIgw || !t.vpc.internetGatewayId) {
      push({
        kind: 'nat',
        label: 'NAT gateway',
        detail: `${nat.id} is in ${natSubnet.id}, which has no route to an internet gateway`,
        ok: false,
        blockedBy: 'NAT gateway is not in a public subnet',
        fix: 'Move the NAT gateway to a subnet whose route table sends 0.0.0.0/0 to the internet gateway.',
      })
      return {
        delivered: false,
        hops,
        summary: 'Dropped: the NAT gateway itself has no way out, because its own subnet is not public.',
        lesson: 'A NAT gateway must live in a public subnet. Putting it in the private subnet it serves is a classic self-defeating configuration.',
      }
    }
    if (natSubnet.az !== srcSubnet.az) {
      push({
        kind: 'nat',
        label: 'NAT gateway',
        detail: `${nat.id} in ${natSubnet.az} — traffic is crossing AZs from ${srcSubnet.az}`,
        ok: true,
        fix: 'Deploy one NAT gateway per AZ: it removes the cross-AZ data charge and stops one AZ failure from cutting egress for the others.',
      })
    } else {
      push({ kind: 'nat', label: 'NAT gateway', detail: `${nat.id} in ${natSubnet.az}`, ok: true })
    }
    push({ kind: 'igw', label: 'Internet gateway', detail: t.vpc.internetGatewayId, ok: true })
    push({
      kind: 'destination',
      label: toAwsService ? packet.toId.toUpperCase() : 'Internet',
      detail: 'reached — outbound only, nothing can initiate a connection back',
      ok: true,
    })
    const crossAz = natSubnet.az !== srcSubnet.az
    return {
      delivered: true,
      hops,
      summary: `Delivered outbound via NAT${crossAz ? ', crossing an AZ boundary on the way' : ''}.${toAwsService ? ' This traffic is billed per GB — a gateway endpoint would carry it for free.' : ''}`,
      lesson: crossAz
        ? 'A single shared NAT gateway is both a single point of failure and a cross-AZ data charge. One per AZ is the resilient and usually cheaper answer.'
        : 'NAT allows outbound connections and their replies, but nothing on the internet can start a connection inward. That is what makes the subnet private.',
    }
  }

  /* Public subnet straight out through the internet gateway. */
  if (route.target.kind === 'igw') {
    if (!t.vpc.internetGatewayId) {
      push({
        kind: 'igw',
        label: 'Internet gateway',
        detail: 'route references an internet gateway that is not attached',
        ok: false,
        blockedBy: 'missing internet gateway',
        fix: 'Attach an internet gateway to the VPC.',
      })
      return {
        delivered: false,
        hops,
        summary: 'Dropped: the route points at an internet gateway the VPC does not have.',
        lesson: 'A route entry is not the same as an attachment. Both must exist.',
      }
    }
    if (!src.publicIp) {
      push({
        kind: 'igw',
        label: 'Internet gateway',
        detail: 'instance has no public IP, so the internet gateway cannot translate its address',
        ok: false,
        blockedBy: 'no public IP',
        fix: 'Assign a public IP, or route through a NAT gateway instead.',
      })
      return {
        delivered: false,
        hops,
        summary: 'Dropped: an instance in a public subnet still needs a public IP to use the internet gateway.',
        lesson: 'The internet gateway performs one-to-one NAT for instances that have a public address. Without one there is nothing to translate — which is exactly why private instances need a NAT gateway.',
      }
    }
    push({ kind: 'igw', label: 'Internet gateway', detail: `${src.publicIp} → internet`, ok: true })
    push({ kind: 'destination', label: 'Internet', detail: 'reached directly', ok: true })
    return {
      delivered: true,
      hops,
      summary: 'Delivered straight out through the internet gateway, using the instance’s own public IP.',
      lesson: 'A public instance needs no NAT gateway — and paying for NAT in front of a public subnet is wasted money.',
    }
  }

  push({
    kind: 'route',
    label: 'Route target',
    detail: `${route.target.kind} is not modelled in this lab`,
    ok: false,
  })
  return {
    delivered: false,
    hops,
    summary: `The route sends this traffic to a ${route.target.kind}, which this simulator does not model.`,
    lesson: 'Peering and Transit Gateway paths are covered in the topology labs.',
  }
}
