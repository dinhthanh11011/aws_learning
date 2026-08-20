'use client'
import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { exportAll, importAll, resetAll, updateProfile } from '@/db/repo'
import { certById, CERT_IDS } from '@/content'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

export function SettingsPanel() {
  const profile = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const counts = useLiveQuery(async () => {
    const [cards, attempts, exams, mistakes, marks, labs] = await Promise.all([
      db.srsCards.count(),
      db.attempts.count(),
      db.exams.count(),
      db.mistakes.count(),
      db.serviceMarks.count(),
      db.labs.count(),
    ])
    return { cards, attempts, exams, mistakes, marks, labs }
  }, [])

  const download = async () => {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aws-trainer-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus({ ok: true, text: 'Exported. Keep it somewhere other than this browser.' })
  }

  const upload = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      const res = await importAll(parsed)
      setStatus({ ok: res.ok, text: res.message })
    } catch {
      setStatus({ ok: false, text: 'That file could not be parsed as JSON.' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">Target certification</h2>
        <p className="mt-1 text-[13px] text-fg-muted">
          Changes which questions, cards and services the whole app shows. Your progress on the other
          certification is kept.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CERT_IDS.map((id) => {
            const cert = certById.get(id)!
            const active = profile.targetCert === id
            return (
              <button
                key={id}
                onClick={() => void updateProfile({ targetCert: id })}
                aria-pressed={active}
                className={cn(
                  'flex-1 rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-border hover:border-border-strong hover:bg-bg-overlay',
                )}
              >
                <span className="block text-[13.5px] font-semibold">{cert.id}</span>
                <span className="block text-[12px] text-fg-subtle">{cert.title}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">Schedule</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
              Exam date
            </span>
            <input
              type="date"
              value={profile.examDate ?? ''}
              onChange={(e) => void updateProfile({ examDate: e.target.value || null })}
              className="h-10 rounded-lg border border-border bg-bg-inset px-3 text-[13px] outline-none focus-visible:border-accent"
            />
            <span className="text-[11.5px] text-fg-subtle">
              A date turns open-ended study into focused study. Leave it empty and the plan stays
              open-ended.
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
              Hours per week
            </span>
            <input
              type="number"
              min={1}
              max={40}
              value={profile.weeklyHours}
              onChange={(e) =>
                void updateProfile({ weeklyHours: Math.max(1, Math.min(40, Number(e.target.value))) })
              }
              className="h-10 rounded-lg border border-border bg-bg-inset px-3 text-[13px] outline-none focus-visible:border-accent"
            />
            <span className="text-[11.5px] text-fg-subtle">
              Be honest rather than aspirational — the plan is only useful if the number is real.
            </span>
          </label>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">Your data</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
          Everything lives in this browser’s IndexedDB. Nothing is sent anywhere, which is why there
          is no account to create — and also why clearing your browser data would lose your progress.
          The export below is the only backup that exists.
        </p>

        {counts ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            <Badge>{counts.cards.toLocaleString()} cards</Badge>
            <Badge>{counts.attempts.toLocaleString()} answers</Badge>
            <Badge>{counts.exams} exam sessions</Badge>
            <Badge>{counts.mistakes} logged mistakes</Badge>
            <Badge>{counts.marks} self-ratings</Badge>
            <Badge>{counts.labs} lab records</Badge>
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => void download()}>
            Export a backup
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Restore from a backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void upload(f)
              e.target.value = ''
            }}
          />
        </div>

        {status ? (
          <p
            className={cn('mt-3 text-[13px]', status.ok ? 'text-ok' : 'text-bad')}
            role="status"
          >
            {status.text}
          </p>
        ) : null}
      </section>

      <section className="surface border-bad/30 p-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-bad">Start over</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
          Deletes every answer, review, exam session, mistake note and self-rating. This cannot be
          undone, and there is no server-side copy — export first if there is any doubt.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {confirmReset ? (
            <>
              <Button
                variant="danger"
                onClick={async () => {
                  await resetAll()
                  setConfirmReset(false)
                  setStatus({ ok: true, text: 'Everything has been reset.' })
                }}
              >
                Yes, delete everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Reset all progress
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
