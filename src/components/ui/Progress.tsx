import { cn } from '@/lib/cn'

export function Progress({
  value,
  max = 1,
  tone = 'accent',
  className,
  height = 6,
  label,
}: {
  value: number
  max?: number
  tone?: 'accent' | 'ok' | 'warn' | 'bad' | 'info'
  className?: string
  height?: number
  label?: string
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const color = `var(--${tone})`
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-bg-inset', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      // A progressbar with no accessible name is an accessibility failure, so
      // fall back to something truthful rather than leaving it unlabelled.
      aria-label={label ?? `${Math.round(pct * 100)}% complete`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct * 100}%`, background: color }}
      />
    </div>
  )
}

/** Segmented bar showing how a whole splits — used for domain weighting. */
export function StackedBar({
  segments,
  height = 8,
  className,
}: {
  segments: { id: string; value: number; color: string; label: string }[]
  height?: number
  className?: string
}) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1
  return (
    <div className={cn('flex w-full overflow-hidden rounded-full bg-bg-inset', className)} style={{ height }}>
      {segments.map((s) => (
        <div
          key={s.id}
          title={`${s.label} — ${Math.round((s.value / total) * 100)}%`}
          style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
          className="h-full first:rounded-l-full last:rounded-r-full"
        />
      ))}
    </div>
  )
}
