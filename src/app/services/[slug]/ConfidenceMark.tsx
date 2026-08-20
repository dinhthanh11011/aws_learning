'use client'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { markService } from '@/db/repo'
import { cn } from '@/lib/cn'

const LABELS = [
  'No idea what this is',
  'Recognise the name only',
  'Roughly what it does',
  'Could pick it in a question',
  'Could explain it and its traps',
]

/**
 * Honest self-rating, 1–5. It feeds the weak-spot view and nudges mastery, and
 * it is deliberately separate from the algorithm's opinion — rating yourself 5
 * when you are a 2 only fools you, so the labels are written to make that hard.
 */
export function ConfidenceMark({ slug }: { slug: string }) {
  const mark = useLiveQuery(() => db.serviceMarks.get(slug), [slug])
  const value = mark?.confidence ?? 0

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[11px] uppercase tracking-wide text-fg-subtle sm:inline">
        Your call
      </span>
      <div className="flex gap-0.5 rounded-lg border border-border bg-bg-inset p-0.5" role="group" aria-label="Self-rated confidence">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            title={LABELS[n - 1]}
            aria-pressed={value === n}
            onClick={() => void markService(slug, { confidence: value === n ? 0 : n })}
            className={cn(
              'nums h-7 w-7 rounded-md text-[12px] font-medium transition-colors',
              value >= n ? 'text-accent-fg' : 'text-fg-subtle hover:text-fg',
            )}
            style={value >= n ? { background: 'var(--accent)' } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        onClick={() => void markService(slug, { starred: !mark?.starred })}
        aria-pressed={mark?.starred ?? false}
        title={mark?.starred ? 'Remove from your shortlist' : 'Add to your shortlist'}
        className={cn(
          'grid h-8 w-8 place-items-center rounded-lg border text-[13px] transition-colors',
          mark?.starred
            ? 'border-warn/40 bg-warn-soft text-warn'
            : 'border-border text-fg-subtle hover:text-fg',
        )}
      >
        ★
      </button>
    </div>
  )
}
