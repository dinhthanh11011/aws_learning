'use client'
import { useMemo, useState } from 'react'
import { certById, domainsFor, questionsForDomain, questionsFor } from '@/content'
import { samplePractice, sample } from '@/engines/exam/sampler'
import { isCorrect } from '@/engines/exam/score'
import { comboMultiplier, XP } from '@/engines/gamify/rules'
import { awardXp, recordAttempt } from '@/db/repo'
import { useProfile } from '@/hooks/useProfile'
import { useMasteryInput } from '@/hooks/useMastery'
import { domainMastery } from '@/engines/progress/mastery'
import { servicesFor } from '@/content'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { MasteryRing } from '@/components/ui/MasteryRing'
import { cn } from '@/lib/cn'
import type { Question } from '@/content'

const QUIZ_SIZE = 10

/**
 * Short, immediate-feedback quizzes. Unlike the exam simulator these reveal the
 * answer straight away — for learning that is the right trade, because the gap
 * between answering and finding out is where the learning happens.
 */
export function QuizRunner() {
  const profile = useProfile()
  const cert = certById.get(profile.targetCert)!
  const domains = domainsFor(profile.targetCert)
  const masteryInput = useMasteryInput()
  const certServices = useMemo(() => servicesFor(profile.targetCert), [profile.targetCert])

  const [queue, setQueue] = useState<Question[] | null>(null)
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [combo, setCombo] = useState(0)
  const [label, setLabel] = useState('')

  const startDomain = (domainId: string, title: string) => {
    const pool = questionsForDomain(domainId)
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, QUIZ_SIZE)
    setQueue(picked)
    setLabel(title)
    reset()
  }

  const startWeakest = () => {
    if (!masteryInput) return
    const weak: Record<string, number> = {}
    for (const d of domains) {
      // Lower mastery → higher weakness weight, so sampling favours the gaps.
      weak[d.id] = 1 - domainMastery(d, certServices, masteryInput).score
    }
    const picked = samplePractice({
      cert,
      pool: questionsFor(profile.targetCert),
      count: QUIZ_SIZE,
      weakDomains: weak,
    })
    setQueue(picked.questions)
    setLabel('Your weakest areas')
    reset()
  }

  const startMixed = () => {
    const picked = sample({ cert, pool: questionsFor(profile.targetCert), count: QUIZ_SIZE })
    setQueue(picked.questions)
    setLabel('Mixed, domain-weighted')
    reset()
  }

  const reset = () => {
    setI(0)
    setChosen([])
    setRevealed(false)
    setResults([])
    setCombo(0)
  }

  const check = async () => {
    if (!queue) return
    const q = queue[i]
    const ok = isCorrect(q, chosen)
    setRevealed(true)
    setResults([...results, ok])
    setCombo(ok ? combo + 1 : 0)

    const domainId = cert.domains.find((d) => d.tasks.some((t) => t.id === q.taskId))!.id
    await recordAttempt({
      questionId: q.id,
      certId: profile.targetCert,
      taskId: q.taskId,
      domainId,
      serviceSlugs: q.serviceSlugs,
      chosen,
      correct: ok,
      ms: 0,
      source: 'quiz',
    })
    const base = ok ? XP.questionCorrect(q.difficulty) : XP.questionWrongButReviewed
    await awardXp(Math.round(base * (ok ? comboMultiplier(combo + 1) : 1)))
  }

  const next = () => {
    if (!queue) return
    if (i + 1 >= queue.length) {
      setQueue(null)
      return
    }
    setI(i + 1)
    setChosen([])
    setRevealed(false)
  }

  /* ── Picker ────────────────────────────────────────────────────────────── */
  if (!queue) {
    const right = results.filter(Boolean).length
    return (
      <div className="flex flex-col gap-4">
        {results.length ? (
          <div className="surface border-accent/30 p-5 text-center">
            <p className="nums text-[32px] font-semibold leading-none">
              {right}/{results.length}
            </p>
            <p className="mt-1 text-[13px] text-fg-subtle">
              {right === results.length
                ? 'Clean sweep. Take a harder set.'
                : right / results.length >= 0.8
                  ? 'Strong. The misses are in your mistake log if you wrote them up.'
                  : 'Worth reviewing the explanations before moving on.'}
            </p>
          </div>
        ) : null}

        <div className="surface p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">Ten questions</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
            Immediate feedback after each answer, with every option explained. About twelve minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={startWeakest} disabled={!masteryInput}>
              My weakest areas
            </Button>
            <Button variant="secondary" onClick={startMixed}>
              Mixed, domain-weighted
            </Button>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="mb-1 text-[15px] font-semibold tracking-tight">By domain</h2>
          <p className="mb-3 text-[12.5px] text-fg-subtle">
            Rings show your current mastery. The percentage is the domain’s share of the real paper.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {domains.map((d) => {
              const m = masteryInput ? domainMastery(d, certServices, masteryInput) : null
              const available = questionsForDomain(d.id).length
              return (
                <li key={d.id}>
                  <button
                    onClick={() => startDomain(d.id, d.title)}
                    disabled={available === 0}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border border-border bg-bg-inset p-3 text-left transition-colors',
                      available ? 'hover:border-border-strong hover:bg-bg-overlay' : 'opacity-50',
                    )}
                  >
                    <MasteryRing rings={m?.rings ?? 0} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">{d.title}</span>
                      <span className="block text-[11.5px] text-fg-subtle">
                        {d.weight}% of the paper · {available} question{available === 1 ? '' : 's'}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }

  /* ── Running ───────────────────────────────────────────────────────────── */
  const q = queue[i]
  return (
    <div className="flex flex-col gap-4">
      <div className="surface flex flex-wrap items-center gap-3 p-3">
        <span className="text-[12.5px] font-medium">{label}</span>
        <div className="min-w-[80px] flex-1">
          <Progress value={i} max={queue.length} height={5} />
        </div>
        <span className="nums text-[12px] text-fg-subtle">
          {results.filter(Boolean).length}/{results.length}
        </span>
        {combo >= 3 ? (
          <Badge tone="accent">🔥 {comboMultiplier(combo).toFixed(1)}× combo</Badge>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => setQueue(null)}>
          Stop
        </Button>
      </div>

      <div className="surface p-5">
        <QuestionCard
          question={q}
          chosen={chosen}
          onChoose={setChosen}
          revealed={revealed}
          index={i}
          total={queue.length}
        />

        <div className="mt-6 border-t border-border pt-4">
          {revealed ? (
            <Button variant="primary" size="lg" className="w-full" onClick={next}>
              {i + 1 >= queue.length ? 'See the result' : 'Next question →'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={chosen.length === 0}
              onClick={() => void check()}
            >
              {chosen.length === 0 ? 'Pick an answer' : 'Check'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
