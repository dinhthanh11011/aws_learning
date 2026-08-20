'use client'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { evaluate } from '@/engines/policy/evaluate'
import { puzzles } from '@/engines/policy/puzzles'
import type { PolicyKind, TraceLine } from '@/engines/policy/types'
import { recordLab } from '@/db/repo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/cn'

const KIND_LABEL: Record<PolicyKind, string> = {
  identity: 'Identity policy',
  resource: 'Resource policy',
  scp: 'Service control policy',
  boundary: 'Permissions boundary',
  session: 'Session policy',
}

const KIND_TONE: Record<PolicyKind, 'accent' | 'info' | 'warn' | 'bad' | 'neutral'> = {
  identity: 'accent',
  resource: 'info',
  scp: 'warn',
  boundary: 'warn',
  session: 'neutral',
}

export function IamLab() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [guess, setGuess] = useState<boolean | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  const puzzle = puzzles[i]
  const decision = useMemo(() => evaluate(puzzle.policies, puzzle.request), [puzzle])

  const commit = async (g: boolean) => {
    setGuess(g)
    setRevealed(true)
    const right = g === decision.allowed
    setResults((r) => [...r, right])
    if (right) await recordLab('iam-puzzle', results.filter(Boolean).length + 1, puzzle.id)
  }

  const next = () => {
    if (i + 1 >= puzzles.length) {
      setI(0)
    } else {
      setI(i + 1)
    }
    setGuess(null)
    setRevealed(false)
  }

  const right = results.filter(Boolean).length
  const correct = guess === decision.allowed

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="nums text-[12px] text-fg-subtle">
            {i + 1} / {puzzles.length}
          </span>
          <Progress value={i} max={puzzles.length} height={5} className="flex-1" />
          {results.length ? (
            <span className="nums text-[12px] text-fg-subtle">
              {right}/{results.length} called correctly
            </span>
          ) : null}
        </div>

        <div className="surface p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-semibold tracking-tight">{puzzle.title}</h2>
            <Badge tone={puzzle.difficulty === 3 ? 'bad' : puzzle.difficulty === 2 ? 'warn' : 'ok'}>
              {puzzle.difficulty === 3 ? 'Hard' : puzzle.difficulty === 2 ? 'Medium' : 'Easier'}
            </Badge>
          </div>
          <p className="text-[14.5px] leading-relaxed">{puzzle.scenario}</p>

          <div className="mt-4 rounded-xl border border-border bg-bg-inset p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
              The request
            </p>
            <dl className="mt-1.5 grid gap-x-4 gap-y-1 text-[12.5px] sm:grid-cols-[auto_1fr]">
              <dt className="text-fg-subtle">Principal</dt>
              <dd className="nums break-all">{puzzle.request.principal}</dd>
              <dt className="text-fg-subtle">Action</dt>
              <dd className="nums font-medium">{puzzle.request.action}</dd>
              <dt className="text-fg-subtle">Resource</dt>
              <dd className="nums break-all">{puzzle.request.resource}</dd>
              {puzzle.request.crossAccount ? (
                <>
                  <dt className="text-fg-subtle">Accounts</dt>
                  <dd className="text-warn">Cross-account</dd>
                </>
              ) : null}
              {puzzle.request.context
                ? Object.entries(puzzle.request.context).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-fg-subtle">{k}</dt>
                      <dd className="nums">{v}</dd>
                    </div>
                  ))
                : null}
            </dl>
          </div>

          {!revealed ? (
            <div className="mt-5">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
                Allowed or denied?
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="lg" className="flex-1" onClick={() => void commit(true)}>
                  Allowed
                </Button>
                <Button variant="secondary" size="lg" className="flex-1" onClick={() => void commit(false)}>
                  Denied
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'mt-5 rounded-xl border p-4',
                correct ? 'border-ok/40 bg-ok-soft' : 'border-bad/40 bg-bad-soft',
              )}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone={decision.allowed ? 'ok' : 'bad'}>
                  {decision.allowed ? 'Allowed' : 'Denied'}
                </Badge>
                <Badge tone={correct ? 'ok' : 'warn'}>
                  {correct ? '✓ You called it' : '✗ Not what you predicted'}
                </Badge>
              </div>
              <p className="text-[14px] leading-relaxed">{decision.summary}</p>
              <p className="mt-3 border-t border-border pt-3 text-[13.5px] leading-relaxed">
                <strong className="font-semibold">The rule:</strong> {puzzle.lesson}
              </p>
              <Button variant="primary" className="mt-4 w-full" onClick={next}>
                {i + 1 >= puzzles.length ? 'Start again' : 'Next scenario →'}
              </Button>
            </motion.div>
          )}
        </div>

        {/* The policies, shown as real JSON — reading them is the skill. */}
        <div className="flex flex-col gap-3">
          {puzzle.policies.map((p) => (
            <div key={p.id} className="surface overflow-hidden p-0">
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
                <Badge tone={KIND_TONE[p.kind]}>{KIND_LABEL[p.kind]}</Badge>
                <span className="text-[13px] font-medium">{p.name}</span>
                {p.kind === 'scp' || p.kind === 'boundary' || p.kind === 'session' ? (
                  <span className="ml-auto text-[11px] text-fg-subtle">
                    Caps permissions — never grants
                  </span>
                ) : null}
              </div>
              <pre className="overflow-x-auto px-4 py-3 text-[11.5px] leading-relaxed">
                <code>{JSON.stringify(p.doc, null, 2)}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="surface p-4">
          <h2 className="text-[14px] font-semibold tracking-tight">Evaluation order</h2>
          <ol className="mt-2 flex flex-col gap-2">
            {[
              ['1', 'Explicit Deny anywhere', 'Wins immediately. No exceptions.'],
              ['2', 'Ceilings must permit', 'SCP, boundary, session policy. They only remove.'],
              ['3', 'Something must Allow', 'Cross-account needs both sides.'],
              ['4', 'Otherwise deny', 'The default is always deny.'],
            ].map(([n, title, detail]) => (
              <li key={n} className="flex gap-2.5">
                <span className="nums mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full bg-bg-overlay text-[10px] font-bold text-fg-subtle">
                  {n}
                </span>
                <span>
                  <span className="block text-[12.5px] font-medium">{title}</span>
                  <span className="block text-[12px] leading-snug text-fg-subtle">{detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <AnimatePresence>
          {revealed ? (
            <motion.div
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="surface p-4"
            >
              <h2 className="text-[14px] font-semibold tracking-tight">The trace</h2>
              <p className="mt-1 text-[12px] text-fg-subtle">
                Every statement, in order, and what it decided.
              </p>
              <ol className="mt-3 flex flex-col gap-2">
                {decision.trace.map((line, n) => (
                  <TraceRow key={n} line={line} decided={line === decision.decidedBy} />
                ))}
              </ol>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </aside>
    </div>
  )
}

function TraceRow({ line, decided }: { line: TraceLine; decided: boolean }) {
  const tone =
    line.outcome === 'allow'
      ? 'ok'
      : line.outcome === 'explicit-deny' || line.outcome === 'not-permitted-by-ceiling'
        ? 'bad'
        : 'neutral'
  return (
    <li
      className={cn(
        'rounded-lg border p-2.5',
        decided ? 'border-accent bg-accent-soft' : 'border-border bg-bg-inset',
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={tone as 'ok' | 'bad' | 'neutral'}>
          {line.outcome === 'no-match'
            ? 'no match'
            : line.outcome === 'not-permitted-by-ceiling'
              ? 'ceiling'
              : line.outcome}
        </Badge>
        <span className="nums text-[11.5px] font-medium">{line.sid}</span>
        {decided ? <span className="ml-auto text-[10px] font-semibold text-accent">DECIDED</span> : null}
      </div>
      <p className="mt-1 text-[12px] leading-snug text-fg-muted">
        <span className="text-fg-subtle">{line.policyName}:</span> {line.reason}
      </p>
    </li>
  )
}
