'use client'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { routePacket } from '@/engines/network/route'
import { breakIts, cloneTopology, threeTierVpc } from '@/engines/network/topologies'
import type { Hop, Packet, RouteResult, Topology } from '@/engines/network/types'
import { recordLab } from '@/db/repo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

type Guess = 'pass' | 'drop' | null

const SCENARIOS: { id: string; label: string; packet: Packet; hint: string }[] = [
  { id: 'app-internet', label: 'App server A → internet (443)', packet: { fromId: 'i-app-a', toId: 'internet', protocol: 'tcp', port: 443 }, hint: 'Private subnet outbound. Which device does it need?' },
  { id: 'app-db', label: 'App server A → Database (5432)', packet: { fromId: 'i-app-a', toId: 'i-db', protocol: 'tcp', port: 5432 }, hint: 'Tier-to-tier, via a security-group reference.' },
  { id: 'alb-db', label: 'Load balancer → Database (5432)', packet: { fromId: 'i-alb', toId: 'i-db', protocol: 'tcp', port: 5432 }, hint: 'Only the app tier is allowed. Is the ALB the app tier?' },
  { id: 'net-alb', label: 'Internet → Load balancer (443)', packet: { fromId: 'internet', toId: 'i-alb', protocol: 'tcp', port: 443 }, hint: 'Inbound needs four things, not one.' },
  { id: 'net-app', label: 'Internet → App server A (8080)', packet: { fromId: 'internet', toId: 'i-app-a', protocol: 'tcp', port: 8080 }, hint: 'Should the internet reach a private subnet?' },
  { id: 'app-s3', label: 'App server A → S3', packet: { fromId: 'i-app-a', toId: 's3', protocol: 'tcp', port: 443 }, hint: 'It works — but what does it cost, and what is the cheaper path?' },
  { id: 'db-internet', label: 'Database → internet (443)', packet: { fromId: 'i-db', toId: 'internet', protocol: 'tcp', port: 443 }, hint: 'The data tier has no internet route at all.' },
  { id: 'appb-internet', label: 'App server B (AZ-b) → internet', packet: { fromId: 'i-app-b', toId: 'internet', protocol: 'tcp', port: 443 }, hint: 'Which AZ is the NAT gateway in?' },
]

/**
 * The packet tracer. Everything meaningful here is the *reason* a packet died:
 * "route table has no 0.0.0.0/0 entry" teaches something, "unreachable" does not.
 * The prediction step exists because guessing before you look is what converts
 * this from a demo into practice.
 */
export function VpcLab() {
  const reduce = useReducedMotion()
  const [breaks, setBreaks] = useState<string[]>([])
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const [guess, setGuess] = useState<Guess>(null)
  const [result, setResult] = useState<RouteResult | null>(null)
  const [solved, setSolved] = useState<string[]>([])
  const [endpointAdded, setEndpointAdded] = useState(false)

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!

  // Topology is rebuilt from the template plus the applied breaks, so toggling a
  // break off genuinely restores the original rather than half-undoing it.
  const topology: Topology = useMemo(() => {
    let t = cloneTopology(threeTierVpc())
    if (endpointAdded) {
      for (const id of ['rtb-private-a', 'rtb-private-b']) {
        t.routeTables
          .find((r) => r.id === id)!
          .routes.push({ destination: '52.216.0.0/15', target: { kind: 'endpoint-gateway', service: 's3' } })
      }
    }
    for (const id of breaks) {
      const b = breakIts.find((x) => x.id === id)
      if (b) t = b.apply(t)
    }
    return t
  }, [breaks, endpointAdded])

  const send = () => {
    const r = routePacket(topology, scenario.packet)
    setResult(r)
    // A correct prediction is the thing worth rewarding, not merely running it.
    const correct = guess === (r.delivered ? 'pass' : 'drop')
    if (correct && breaks.length === 1 && !solved.includes(breaks[0])) {
      setSolved([...solved, breaks[0]])
      void recordLab('vpc-builder', solved.length + 1, breaks[0])
    } else if (correct) {
      void recordLab('vpc-builder', Math.max(1, solved.length))
    }
  }

  const reset = () => {
    setResult(null)
    setGuess(null)
  }

  const toggleBreak = (id: string) => {
    setBreaks((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]))
    reset()
  }

  const activeBreak = breaks.length === 1 ? breakIts.find((b) => b.id === breaks[0]) : undefined
  const guessedRight = result && guess === (result.delivered ? 'pass' : 'drop')

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        {/* Topology diagram */}
        <div className="surface p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14px] font-semibold tracking-tight">
              vpc-main · 10.0.0.0/16
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {topology.vpc.internetGatewayId ? (
                <Badge tone="ok">igw attached</Badge>
              ) : (
                <Badge tone="bad">no igw</Badge>
              )}
              <Badge tone={topology.natGateways.length ? 'ok' : 'bad'}>
                {topology.natGateways.length} NAT
              </Badge>
              {endpointAdded ? <Badge tone="info">S3 gateway endpoint</Badge> : null}
            </div>
          </div>

          <TopologyView topology={topology} result={result} />

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={endpointAdded}
                onChange={(e) => {
                  setEndpointAdded(e.target.checked)
                  reset()
                }}
                className="accent-[var(--accent)]"
              />
              Add a gateway VPC endpoint for S3
            </label>
            <span className="text-[11.5px] text-fg-subtle">
              Free, and it removes the NAT per-GB charge for S3 traffic.
            </span>
          </div>
        </div>

        {/* Send a packet */}
        <div className="surface p-4">
          <h2 className="mb-3 text-[14px] font-semibold tracking-tight">Send a packet</h2>
          <div className="flex flex-col gap-3">
            <select
              value={scenarioId}
              onChange={(e) => {
                setScenarioId(e.target.value)
                reset()
              }}
              className="h-10 rounded-lg border border-border bg-bg-inset px-3 text-[13px] outline-none"
              aria-label="Scenario"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="text-[12.5px] italic text-fg-subtle">{scenario.hint}</p>

            {!result ? (
              <>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
                  Predict first
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={guess === 'pass' ? 'primary' : 'secondary'}
                    className="flex-1"
                    onClick={() => setGuess('pass')}
                  >
                    It gets through
                  </Button>
                  <Button
                    variant={guess === 'drop' ? 'primary' : 'secondary'}
                    className="flex-1"
                    onClick={() => setGuess('drop')}
                  >
                    It gets dropped
                  </Button>
                </div>
                <Button variant="primary" size="lg" disabled={!guess} onClick={send}>
                  {guess ? 'Send it' : 'Commit to a prediction first'}
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={reset}>
                Try another prediction
              </Button>
            )}
          </div>
        </div>

        {/* Trace */}
        <AnimatePresence>
          {result ? (
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'surface p-4',
                result.delivered ? 'border-ok/40' : 'border-bad/40',
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={result.delivered ? 'ok' : 'bad'}>
                  {result.delivered ? 'Delivered' : 'Dropped'}
                </Badge>
                {guessedRight ? (
                  <Badge tone="ok">✓ You called it</Badge>
                ) : (
                  <Badge tone="warn">Not what you predicted</Badge>
                )}
              </div>

              <p className="text-[14px] leading-relaxed">{result.summary}</p>

              <ol className="mt-4 flex flex-col gap-0">
                {result.hops.map((hop, i) => (
                  <HopRow key={i} hop={hop} index={i} last={i === result.hops.length - 1} reduce={Boolean(reduce)} />
                ))}
              </ol>

              <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                  What this proves
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed">{result.lesson}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Break-it panel */}
      <aside className="flex flex-col gap-4">
        <div className="surface p-4">
          <h2 className="text-[14px] font-semibold tracking-tight">Break it</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-fg-muted">
            Apply a realistic misconfiguration, predict the symptom, then check. This is the highest
            value step in the whole app: exam questions ask “this is broken, why?” far more often
            than “what is this?”.
          </p>
          <p className="nums mt-2 text-[12px] text-fg-subtle">
            {solved.length} of {breakIts.length} diagnosed correctly
          </p>

          <ul className="mt-3 flex flex-col gap-1.5">
            {breakIts.map((b) => {
              const on = breaks.includes(b.id)
              const done = solved.includes(b.id)
              return (
                <li key={b.id}>
                  <button
                    onClick={() => toggleBreak(b.id)}
                    aria-pressed={on}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors',
                      on
                        ? 'border-bad/50 bg-bad-soft'
                        : 'border-border hover:border-border-strong hover:bg-bg-overlay',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-px grid h-4 w-4 shrink-0 place-items-center rounded text-[10px] font-bold',
                        done ? 'bg-ok text-bg' : on ? 'bg-bad text-bg' : 'border border-border-strong text-fg-subtle',
                      )}
                      aria-hidden
                    >
                      {done ? '✓' : on ? '!' : ''}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium leading-snug">{b.title}</span>
                      {on ? (
                        <span className="mt-1 block text-[12px] leading-snug text-fg-muted">
                          {b.question}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {breaks.length ? (
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => { setBreaks([]); reset() }}>
              Restore the topology
            </Button>
          ) : null}
        </div>

        {activeBreak && result ? (
          <motion.div
            initial={reduce ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="surface border-warn/30 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warn">
              Why this happens
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed">{activeBreak.answer}</p>
          </motion.div>
        ) : null}
      </aside>
    </div>
  )
}

function HopRow({ hop, index, last, reduce }: { hop: Hop; index: number; last: boolean; reduce: boolean }) {
  const tone = hop.ok ? 'ok' : 'bad'
  return (
    <motion.li
      initial={reduce ? undefined : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: reduce ? 0 : index * 0.12 }}
      className="flex gap-3"
    >
      <span className="relative flex w-4 shrink-0 flex-col items-center">
        <span
          className="mt-1.5 grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-bg"
          style={{ background: `var(--${tone})` }}
          aria-hidden
        >
          {hop.ok ? '✓' : '✗'}
        </span>
        {!last ? <span className="w-px flex-1 bg-border" aria-hidden /> : null}
      </span>
      <span className={cn('min-w-0 flex-1', last ? 'pb-0' : 'pb-3')}>
        <span className="block text-[13px] font-medium">{hop.label}</span>
        <span className="block text-[12.5px] leading-snug text-fg-muted">{hop.detail}</span>
        {hop.fix ? (
          <span className="mt-1 block text-[12.5px] leading-snug text-warn">
            <strong className="font-semibold">Fix:</strong> {hop.fix}
          </span>
        ) : null}
      </span>
    </motion.li>
  )
}

/** A schematic of the topology, drawn from the live model rather than hard-coded. */
function TopologyView({ topology, result }: { topology: Topology; result: RouteResult | null }) {
  const lit = new Set(result?.hops.map((h) => h.label) ?? [])
  const azs = [...new Set(topology.subnets.map((s) => s.az))].sort()

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[520px] gap-3">
        {azs.map((az) => {
          const subnets = topology.subnets.filter((s) => s.az === az)
          return (
            <div key={az} className="flex-1 rounded-xl border border-dashed border-border p-2.5">
              <p className="mb-2 text-[11px] font-semibold text-fg-subtle">{az}</p>
              <div className="flex flex-col gap-2">
                {subnets.map((sn) => {
                  const rt = topology.routeTables.find((r) => r.id === sn.routeTableId)
                  const isPublic = rt?.routes.some(
                    (r) => r.destination === '0.0.0.0/0' && r.target.kind === 'igw',
                  )
                  const instances = topology.instances.filter((x) => x.subnetId === sn.id)
                  const nat = topology.natGateways.find((n) => n.subnetId === sn.id)
                  return (
                    <div
                      key={sn.id}
                      className={cn(
                        'rounded-lg border p-2',
                        isPublic ? 'border-ok/40 bg-ok-soft' : 'border-border bg-bg-inset',
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11.5px] font-medium">{sn.id}</span>
                        <span className="text-[10px] text-fg-subtle">
                          {isPublic ? 'public' : 'private'}
                        </span>
                      </div>
                      <p className="nums text-[10px] text-fg-subtle">{sn.cidr}</p>
                      {nat ? (
                        <p className="mt-1 rounded bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-medium text-accent">
                          NAT {nat.id}
                        </p>
                      ) : null}
                      <ul className="mt-1 flex flex-col gap-1">
                        {instances.map((inst) => (
                          <li
                            key={inst.id}
                            className={cn(
                              'rounded border px-1.5 py-1 text-[10.5px] transition-colors',
                              lit.has(inst.name)
                                ? 'border-accent bg-accent-soft font-semibold'
                                : 'border-border bg-bg-raised',
                            )}
                          >
                            {inst.name}
                            <span className="nums block text-[9.5px] text-fg-subtle">
                              {inst.privateIp}
                              {inst.publicIp ? ` · ${inst.publicIp}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
