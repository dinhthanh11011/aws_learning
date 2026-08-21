'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { certById, examCoverage, questionById, questionsFor, taskAliasFor } from '@/content'
import { sample } from '@/engines/exam/sampler'
import { isCorrect, marksAtStake, score } from '@/engines/exam/score'
import { XP } from '@/engines/gamify/rules'
import { awardXp, recordAttempt, saveExam, seenQuestionIds } from '@/db/repo'
import { db, type ExamSession } from '@/db'
import { useProfile } from '@/hooks/useProfile'
import { useLiveQuery } from 'dexie-react-hooks'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/cn'

type Stage = 'idle' | 'running' | 'submitted'

/**
 * The full timed simulator, sized from the cert's own questionCount and
 * minutes. It writes its state to IndexedDB
 * on every answer so a reload — or a closed laptop — resumes exactly where you
 * were, which is the difference between a usable simulator and a toy.
 */
export function ExamRunner() {
  const profile = useProfile()
  const certId = profile.targetCert
  const cert = certById.get(certId)!
  const coverage = useMemo(() => examCoverage(certId), [certId])

  const [stage, setStage] = useState<Stage>('idle')
  const [session, setSession] = useState<ExamSession | null>(null)
  const [remaining, setRemaining] = useState(cert.minutes * 60)
  const [paused, setPaused] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [expired, setExpired] = useState(false)
  const tick = useRef<number | null>(null)
  const submitted = useRef(false)

  const resumable = useLiveQuery(
    async () =>
      (await db.exams.orderBy('startedAt').reverse().limit(5).toArray()).find(
        (e) => e.endedAt === null && e.mode === 'full',
      ),
    [],
  )
  const history = useLiveQuery(
    async () =>
      (await db.exams.orderBy('startedAt').reverse().limit(20).toArray()).filter(
        (e) => e.endedAt !== null,
      ),
    [],
    [],
  )

  /* ── Timer ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (stage !== 'running' || paused) return
    tick.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(tick.current!)
          setExpired(true)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (tick.current) window.clearInterval(tick.current)
    }
  }, [stage, paused])

  const persist = useCallback(
    async (patch: Partial<ExamSession>) => {
      if (!session) return
      const next = { ...session, ...patch, remaining }
      setSession(next)
      await saveExam(next)
    },
    [session, remaining],
  )

  /* Auto-submit when the clock runs out — as the real exam does. */
  const submit = useCallback(async () => {
    if (!session) return
    const qs = session.questionIds.map((id) => questionById.get(id)!).filter(Boolean)
    const result = score(cert, qs, session.answers)

    for (const q of qs) {
      const chosen = session.answers[q.id] ?? []
      await recordAttempt({
        questionId: q.id,
        certId,
        taskId: q.taskId,
        domainId: cert.domains.find((d) => d.tasks.some((t) => t.id === q.taskId))!.id,
        serviceSlugs: q.serviceSlugs,
        chosen,
        correct: chosen.length > 0 && isCorrect(q, chosen),
        ms: 0,
        source: 'exam',
      })
    }

    const finished: ExamSession = {
      ...session,
      endedAt: Date.now(),
      remaining,
      scaled: result.scaled,
      passed: result.passed,
    }
    await saveExam(finished)
    setSession(finished)
    await awardXp(XP.examCompleted)
    setStage('submitted')
  }, [session, cert, certId, remaining])

  // Auto-submit when the clock runs out. The timer flags expiry; a ref guard
  // makes this run once, so the effect never has to reset state and cause a
  // cascading render.
  useEffect(() => {
    if (!expired || submitted.current) return
    submitted.current = true
    void submit()
  }, [expired, submit])

  /* ── Start / resume ────────────────────────────────────────────────────── */
  const start = async () => {
    const exclude = await seenQuestionIds(10)
    const picked = sample({
      cert,
      pool: questionsFor(certId),
      count: cert.questionCount,
      exclude,
      // `questionsFor` has already applied scope, so the pool needs no further
      // filtering — but the alias must be supplied, or a question written
      // against a superseded task statement lands in no domain and silently
      // drops out of the paper.
      inScope: () => true,
      alias: taskAliasFor(certId),
    })
    submitted.current = false
    const fresh: ExamSession = {
      id: `exam-${Date.now()}`,
      certId,
      mode: 'full',
      startedAt: Date.now(),
      endedAt: null,
      remaining: cert.minutes * 60,
      questionIds: picked.questions.map((q) => q.id),
      answers: {},
      flagged: [],
      cursor: 0,
      scaled: null,
      passed: null,
    }
    await saveExam(fresh)
    setSession(fresh)
    setRemaining(cert.minutes * 60)
    setStage('running')
  }

  const resume = (e: ExamSession) => {
    setSession(e)
    setRemaining(e.remaining)
    setStage('running')
  }

  /* ── Idle screen ───────────────────────────────────────────────────────── */
  if (stage === 'idle') {
    const short = coverage.perDomain.filter((d) => d.have < d.need)
    const best = history?.reduce((m, e) => Math.max(m, e.scaled ?? 0), 0) ?? 0

    return (
      <div className="flex flex-col gap-5">
        <div className="surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold tracking-tight">
                {cert.id} — full simulation
              </h2>
              <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-fg-muted">
                {cert.questionCount} questions in {cert.minutes} minutes, sampled to the real domain
                weighting. Unanswered counts as wrong, as it does in the real exam. Your state is
                saved continuously, so a reload resumes rather than restarts.
              </p>
            </div>
            <div className="text-right">
              {best ? (
                <>
                  <p className="nums text-[26px] font-semibold leading-none">{best}</p>
                  <p className="text-[11px] text-fg-subtle">best scaled score</p>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {resumable ? (
              <Button variant="primary" size="lg" onClick={() => resume(resumable)}>
                Resume — {Math.floor(resumable.remaining / 60)} min left
              </Button>
            ) : null}
            <Button
              variant={resumable ? 'secondary' : 'primary'}
              size="lg"
              onClick={() => void start()}
            >
              {resumable ? 'Start a new paper' : `Start the ${cert.minutes}-minute paper`}
            </Button>
            <ButtonLink href="/quiz" variant="ghost" size="lg">
              Or a 10-question domain quiz
            </ButtonLink>
          </div>
        </div>

        {short.length ? (
          <div className="surface border-warn/30 p-4">
            <p className="text-[13px] font-semibold text-warn">
              The {cert.id} bank cannot fill a full paper yet
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
              You will get a shorter, still domain-weighted paper. Rather than repeat questions and
              flatter your score, the simulator tells you instead:
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {short.map((d) => (
                <li key={d.domainId} className="nums text-[12.5px] text-fg-muted">
                  {d.title}: {d.have} of {d.need}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {history?.length ? (
          <div className="surface p-4">
            <h3 className="mb-3 text-[14px] font-semibold tracking-tight">Previous papers</h3>
            <ul className="flex flex-col divide-y divide-border">
              {history.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <Badge tone={e.passed ? 'ok' : 'bad'}>
                    {e.passed ? 'Pass' : `Below ${cert.passScore}`}
                  </Badge>
                  <span className="nums text-[14px] font-semibold">{e.scaled}</span>
                  <span className="text-[12px] text-fg-subtle">
                    {new Date(e.startedAt).toLocaleDateString()} · {e.questionIds.length} questions
                  </span>
                  <Link
                    href={`/exam/${e.id}`}
                    className="ml-auto text-[12.5px] text-accent hover:underline"
                  >
                    Review →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  if (!session) return null
  const qs = session.questionIds.map((id) => questionById.get(id)!).filter(Boolean)

  /* ── Result screen ─────────────────────────────────────────────────────── */
  if (stage === 'submitted') {
    const result = score(cert, qs, session.answers)
    const stake = marksAtStake(result)
    return (
      <div className="flex flex-col gap-5">
        <div
          className={cn(
            'surface p-6 text-center',
            result.passed ? 'border-ok/40' : 'border-warn/40',
          )}
        >
          <p className="text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
            Estimated scaled score
          </p>
          <p
            className="nums mt-1 text-[64px] font-semibold leading-none"
            style={{ color: result.passed ? 'var(--ok)' : 'var(--warn)' }}
          >
            {result.scaled}
          </p>
          <p className="mt-1 text-[13px] text-fg-subtle">
            {result.rawCorrect} of {result.rawTotal} correct ({Math.round(result.accuracy * 100)}%)
            · pass mark {cert.passScore}
          </p>
          <p className="mt-3 text-[14px] font-medium">
            {result.passed
              ? result.accuracy >= 0.8
                ? 'Above 80% on a fresh paper. This is the signal to book the exam.'
                : 'A pass — but keep going until you clear 80% on a paper you have never seen.'
              : 'Below the line. The domain breakdown below is a precise study plan.'}
          </p>
          <p className="mt-2 text-[11.5px] text-fg-subtle">
            AWS does not publish its scaling formula. This is a linear estimate anchored at 72% raw
            = 720, so treat it as indicative rather than exact.
          </p>
        </div>

        <div className="surface p-5">
          <h3 className="mb-3 text-[15px] font-semibold tracking-tight">By domain</h3>
          <div className="flex flex-col gap-3">
            {result.domains.map((d) => (
              <div key={d.domainId} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="w-full min-w-0 truncate text-[13px] sm:w-[38%]">{d.title}</span>
                <Badge tone="neutral">{d.weight}%</Badge>
                <span className="nums text-[12px] text-fg-subtle">
                  {d.correct}/{d.answered}
                </span>
                <Progress
                  value={d.accuracy}
                  tone={d.accuracy >= 0.85 ? 'ok' : d.accuracy >= 0.66 ? 'accent' : 'bad'}
                  height={6}
                  className="min-w-[100px] flex-1"
                />
                <Badge
                  tone={
                    d.classification === 'Exceeds competencies'
                      ? 'ok'
                      : d.classification === 'Meets competencies'
                        ? 'accent'
                        : 'bad'
                  }
                >
                  {d.classification}
                </Badge>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-[13px] leading-relaxed text-fg-muted">
            <strong className="font-semibold text-fg">Study next:</strong> {stake[0].title} — about{' '}
            {stake[0].points.toFixed(0)} marks of the paper are currently going begging there. Marks
            at stake matters more than raw accuracy, because a weak 30% domain costs more than a
            weak 20% one.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/exam/${session.id}`} variant="primary" size="lg">
            Review every question
          </ButtonLink>
          <Button variant="secondary" size="lg" onClick={() => setStage('idle')}>
            Back to the simulator
          </Button>
        </div>
        <p className="text-[12.5px] leading-relaxed text-fg-subtle">
          Review the ones you got right as well as the ones you got wrong. If you cannot say why a
          distractor is wrong, you got it right by luck and will get its sibling wrong.
        </p>
      </div>
    )
  }

  /* ── Live exam ─────────────────────────────────────────────────────────── */
  const q = qs[session.cursor]
  const answeredCount = Object.values(session.answers).filter((a) => a.length > 0).length
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const low = remaining < 600

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky exam chrome: clock, progress, navigation. */}
      <div className="surface sticky top-0 z-20 flex flex-wrap items-center gap-3 p-3 backdrop-blur">
        <span
          className={cn('nums text-[18px] font-semibold tabular-nums', low && 'text-bad')}
          aria-label="Time remaining"
        >
          {mins}:{String(secs).padStart(2, '0')}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setPaused((p) => !p)}>
          {paused ? '▶ Resume' : '❚❚ Pause'}
        </Button>
        <div className="min-w-[80px] flex-1">
          <Progress value={answeredCount} max={qs.length} height={5} />
        </div>
        <span className="nums text-[12px] text-fg-subtle">
          {answeredCount}/{qs.length}
        </span>
        <Button size="sm" variant="secondary" onClick={() => setShowGrid((g) => !g)}>
          {showGrid ? 'Hide grid' : 'Grid'}
        </Button>
        <Button size="sm" variant="primary" onClick={() => void submit()}>
          Submit
        </Button>
      </div>

      {paused ? (
        <div className="surface p-10 text-center">
          <p className="text-[15px] font-medium">Paused</p>
          <p className="mt-1 text-[13px] text-fg-subtle">
            The real exam has no pause button. Useful for practice, misleading if you lean on it.
          </p>
        </div>
      ) : showGrid ? (
        <div className="surface p-4">
          <p className="mb-3 text-[13px] text-fg-subtle">
            Jump to a question. Flagged questions are outlined.
          </p>
          <ul className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
            {qs.map((item, i) => {
              const done = (session.answers[item.id] ?? []).length > 0
              const isFlagged = session.flagged.includes(item.id)
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      void persist({ cursor: i })
                      setShowGrid(false)
                    }}
                    className={cn(
                      'nums h-8 w-full rounded-lg border text-[12px] font-medium transition-colors',
                      done
                        ? 'border-transparent bg-accent text-accent-fg'
                        : 'border-border text-fg-subtle hover:border-border-strong',
                      isFlagged && 'ring-2 ring-warn ring-offset-1 ring-offset-[var(--bg-raised)]',
                    )}
                  >
                    {i + 1}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="surface p-5">
          <QuestionCard
            question={q}
            chosen={session.answers[q.id] ?? []}
            onChoose={(ids) => void persist({ answers: { ...session.answers, [q.id]: ids } })}
            revealed={false}
            shuffleSeed={session.id}
            index={session.cursor}
            total={qs.length}
            flagged={session.flagged.includes(q.id)}
            onFlag={() =>
              void persist({
                flagged: session.flagged.includes(q.id)
                  ? session.flagged.filter((f) => f !== q.id)
                  : [...session.flagged, q.id],
              })
            }
          />

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              variant="secondary"
              disabled={session.cursor === 0}
              onClick={() => void persist({ cursor: session.cursor - 1 })}
            >
              ← Previous
            </Button>
            <span className="nums text-[12px] text-fg-subtle">
              {session.flagged.length} flagged
            </span>
            {session.cursor < qs.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => void persist({ cursor: session.cursor + 1 })}
              >
                Next →
              </Button>
            ) : (
              <Button variant="primary" onClick={() => void submit()}>
                Finish
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
