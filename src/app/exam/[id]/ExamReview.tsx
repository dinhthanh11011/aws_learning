'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { certById, questionById, domainById } from '@/content'
import { isCorrect, score } from '@/engines/exam/score'
import { logMistake } from '@/db/repo'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

type Filter = 'wrong' | 'flagged' | 'all'

export function ExamReview({ examId }: { examId: string }) {
  const exam = useLiveQuery(() => db.exams.get(examId), [examId])
  const [filter, setFilter] = useState<Filter>('wrong')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const rows = useMemo(() => {
    if (!exam) return []
    return exam.questionIds
      .map((id) => questionById.get(id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .map((q) => {
        const chosen = exam.answers[q.id] ?? []
        return { q, chosen, correct: chosen.length > 0 && isCorrect(q, chosen) }
      })
  }, [exam])

  const filtered = rows.filter((r) =>
    filter === 'all' ? true : filter === 'wrong' ? !r.correct : exam?.flagged.includes(r.q.id),
  )

  if (!exam) {
    return (
      <div className="surface p-10 text-center">
        <p className="text-[14px] text-fg-muted">That exam session was not found.</p>
        <Link href="/exam" className="mt-3 inline-block text-[13px] text-accent hover:underline">
          Back to the simulator
        </Link>
      </div>
    )
  }

  // A stored session records the paper actually sat, which can outlive the
  // registry if a version is ever removed rather than retired. Scoring needs
  // that cert's scale and weights, so say so plainly instead of crashing on a
  // non-null assertion.
  const cert = certById.get(exam.certId)
  if (!cert) {
    return (
      <div className="surface p-6">
        <h2 className="text-[15px] font-semibold tracking-tight">Cannot score this paper</h2>
        <p className="mt-1 text-[14px] text-fg-muted">
          It was sat against {exam.certId}, which this version of the app no longer knows about, so
          its domain weighting and scale are unavailable. Your answers are still stored.
        </p>
        <Link href="/exam" className="mt-3 inline-block text-[13px] text-accent hover:underline">
          Back to the simulator
        </Link>
      </div>
    )
  }

  const result = score(
    cert,
    rows.map((r) => r.q),
    exam.answers,
  )
  const wrongCount = rows.filter((r) => !r.correct).length

  const chip = (active: boolean) =>
    cn(
      'rounded-lg border px-2.5 py-1 text-[12px] transition-colors',
      active
        ? 'border-accent/40 bg-accent-soft font-medium text-accent'
        : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <Badge tone={exam.passed ? 'ok' : 'bad'}>
          {exam.scaled} · {exam.passed ? 'Pass' : `Below ${cert.passScore}`}
        </Badge>
        <span className="text-[13px] text-fg-subtle">
          {result.rawCorrect}/{result.rawTotal} correct ·{' '}
          {new Date(exam.startedAt).toLocaleString()}
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button className={chip(filter === 'wrong')} onClick={() => setFilter('wrong')}>
            Wrong ({wrongCount})
          </button>
          <button className={chip(filter === 'flagged')} onClick={() => setFilter('flagged')}>
            Flagged ({exam.flagged.length})
          </button>
          <button className={chip(filter === 'all')} onClick={() => setFilter('all')}>
            All ({rows.length})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="surface p-10 text-center">
          <p className="text-[15px] font-medium">
            {filter === 'wrong' ? 'Nothing wrong on this paper.' : 'Nothing to show here.'}
          </p>
          <p className="mt-1 text-[13px] text-fg-subtle">
            {filter === 'wrong'
              ? 'Worth reviewing "All" anyway — a right answer you cannot justify is a future wrong one.'
              : 'Try a different filter.'}
          </p>
        </div>
      ) : null}

      <ol className="flex flex-col gap-4">
        {filtered.map(({ q, chosen, correct }) => {
          const domain = domainById.get(
            cert.domains.find((d) => d.tasks.some((t) => t.id === q.taskId))!.id,
          )
          return (
            <li key={q.id} className="surface p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={correct ? 'ok' : 'bad'}>{correct ? 'Correct' : 'Wrong'}</Badge>
                {chosen.length === 0 ? <Badge tone="warn">Unanswered</Badge> : null}
                <span className="text-[11.5px] text-fg-subtle">{domain?.title}</span>
              </div>

              {/* Same seed as the sitting, so the letters match what was picked. */}
              <QuestionCard
                question={q}
                chosen={chosen}
                onChoose={() => {}}
                revealed
                shuffleSeed={exam.id}
              />

              {/* The mistake log: writing it in your own words is the point. */}
              {!correct ? (
                <div className="mt-4 border-t border-border pt-4">
                  {saved[q.id] ? (
                    <p className="text-[13px] text-ok">
                      ✓ Logged. It will appear in your mistake log, grouped by service.
                    </p>
                  ) : (
                    <>
                      <label
                        htmlFor={`note-${q.id}`}
                        className="block text-[12px] font-semibold uppercase tracking-wide text-fg-subtle"
                      >
                        What did you actually get wrong?
                      </label>
                      <p className="mb-2 mt-0.5 text-[12.5px] text-fg-subtle">
                        One line, in your own words. Writing it is what makes it stick — a service
                        appearing three times means a conceptual hole, not a memory lapse.
                      </p>
                      <div className="flex gap-2">
                        <input
                          id={`note-${q.id}`}
                          value={notes[q.id] ?? ''}
                          onChange={(e) => setNotes({ ...notes, [q.id]: e.target.value })}
                          placeholder="e.g. I forgot the Multi-AZ standby serves no reads"
                          className="h-9 flex-1 rounded-lg border border-border bg-bg-inset px-3 text-[13px] outline-none placeholder:text-fg-subtle focus-visible:border-accent"
                        />
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={!(notes[q.id] ?? '').trim()}
                          onClick={async () => {
                            await logMistake({
                              questionId: q.id,
                              serviceSlugs: q.serviceSlugs,
                              domainId: domain?.id ?? '',
                              note: notes[q.id].trim(),
                              resolved: false,
                            })
                            setSaved({ ...saved, [q.id]: true })
                          }}
                        >
                          Log it
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
