import { describe, expect, it } from 'vitest'
import { routePacket } from './route'
import { breakIts, cloneTopology, threeTierVpc } from './topologies'
import type { Packet } from './types'

const p = (over: Partial<Packet>): Packet => ({
  fromId: 'i-app-a',
  toId: 'internet',
  protocol: 'tcp',
  port: 443,
  ...over,
})

describe('routePacket — the happy paths', () => {
  it('lets a private instance reach the internet through NAT', () => {
    const r = routePacket(threeTierVpc(), p({}))
    expect(r.delivered).toBe(true)
    expect(r.hops.map((h) => h.kind)).toContain('nat')
  })

  it('lets the app tier reach the database on 5432 via a security-group reference', () => {
    const r = routePacket(threeTierVpc(), p({ fromId: 'i-app-a', toId: 'i-db', port: 5432 }))
    expect(r.delivered).toBe(true)
  })

  it('lets an internet client reach the public load balancer on 443', () => {
    const r = routePacket(threeTierVpc(), p({ fromId: 'internet', toId: 'i-alb', port: 443 }))
    expect(r.delivered).toBe(true)
  })

  it('sends a public instance straight out through the internet gateway, no NAT', () => {
    const r = routePacket(threeTierVpc(), p({ fromId: 'i-alb', toId: 'internet' }))
    expect(r.delivered).toBe(true)
    expect(r.hops.map((h) => h.kind)).not.toContain('nat')
  })
})

describe('routePacket — the denials that carry exam marks', () => {
  it('refuses the app tier reaching the database on the wrong port', () => {
    const r = routePacket(threeTierVpc(), p({ fromId: 'i-app-a', toId: 'i-db', port: 3306 }))
    expect(r.delivered).toBe(false)
    expect(r.hops.at(-1)?.blockedBy).toBe('security group inbound')
  })

  it('refuses the load balancer reaching the database, since only sg-app is allowed', () => {
    const r = routePacket(threeTierVpc(), p({ fromId: 'i-alb', toId: 'i-db', port: 5432 }))
    expect(r.delivered).toBe(false)
  })

  it('refuses an internet client reaching a private app server', () => {
    const r = routePacket(threeTierVpc(), p({ fromId: 'internet', toId: 'i-app-a', port: 8080 }))
    expect(r.delivered).toBe(false)
    expect(r.summary).toMatch(/private subnet/i)
  })

  it('stops the data tier from reaching the internet at the route table', () => {
    const r = routePacket(threeTierVpc(), p({ fromId: 'i-db', toId: 'internet' }))
    expect(r.delivered).toBe(false)
    expect(r.hops.at(-1)?.blockedBy).toBe('no usable route')
  })
})

describe('routePacket — NAT versus gateway endpoint', () => {
  it('charges S3 traffic through NAT when there is no endpoint', () => {
    const r = routePacket(threeTierVpc(), p({ toId: 's3' }))
    expect(r.delivered).toBe(true)
    expect(r.summary).toMatch(/billed per GB/i)
  })

  it('carries S3 traffic free once a gateway endpoint route exists', () => {
    const t = threeTierVpc()
    t.routeTables
      .find((x) => x.id === 'rtb-private-a')!
      .routes.push({ destination: '52.216.0.0/15', target: { kind: 'endpoint-gateway', service: 's3' } })
    const r = routePacket(t, p({ toId: 's3' }))
    expect(r.delivered).toBe(true)
    expect(r.hops.map((h) => h.kind)).toContain('endpoint')
    expect(r.summary).toMatch(/no NAT charge/i)
  })

  it('flags cross-AZ NAT traffic as both a cost and a resilience problem', () => {
    const r = routePacket(threeTierVpc(), p({ fromId: 'i-app-b' }))
    expect(r.delivered).toBe(true)
    expect(r.lesson).toMatch(/single point of failure/i)
  })
})

describe('routePacket — the stateless NACL trap', () => {
  it('drops the reply when only the outbound NACL rule is missing', () => {
    const t = threeTierVpc()
    const acl = t.nacls[0]
    acl.rules = acl.rules.filter((r) => r.direction !== 'outbound')
    const r = routePacket(t, p({ fromId: 'internet', toId: 'i-alb', port: 443 }))
    expect(r.delivered).toBe(false)
    expect(r.hops.at(-1)?.kind).toBe('return-nacl')
    expect(r.lesson).toMatch(/stateless/i)
  })

  it('honours NACL rule order — a low-numbered deny beats a higher-numbered allow', () => {
    const t = threeTierVpc()
    t.nacls[0].rules.unshift({
      number: 50,
      direction: 'inbound',
      action: 'deny',
      protocol: 'tcp',
      from: 443,
      to: 443,
      cidr: '0.0.0.0/0',
    })
    const r = routePacket(t, p({ fromId: 'internet', toId: 'i-alb', port: 443 }))
    expect(r.delivered).toBe(false)
    expect(r.hops.at(-1)?.blockedBy).toBe('NACL inbound')
  })
})

describe('breakIts — every challenge actually breaks what it claims to', () => {
  for (const b of breakIts) {
    it(`"${b.title}" produces the predicted outcome`, () => {
      const t = b.apply(cloneTopology(threeTierVpc()))
      const packet =
        b.id === 'nacl-ephemeral'
          ? p({ fromId: 'internet', toId: 'i-alb', port: 443 })
          : b.id === 'sg-cidr-instead-of-ref'
            ? p({ fromId: 'i-app-a', toId: 'i-db', port: 5432 })
            : p({})
      const r = routePacket(t, packet)
      expect(r.delivered).toBe(b.expectDelivered)
      // Every failure must name a cause and offer a fix, or the lab teaches nothing.
      if (!r.delivered) {
        const last = r.hops.at(-1)!
        expect(last.blockedBy).toBeTruthy()
        expect(last.fix).toBeTruthy()
      }
    })
  }
})
