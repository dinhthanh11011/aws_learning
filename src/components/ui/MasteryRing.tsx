import { cn } from '@/lib/cn'

/**
 * Five rings, filled by mastery. A ring is deliberately harder to misread than
 * a percentage: you can see at a glance across a whole map which nodes are
 * empty, and nobody mistakes "2 of 5" for "40% done".
 */
export function MasteryRing({
  rings,
  size = 28,
  className,
  showEmpty = true,
  confident = true,
}: {
  rings: number
  size?: number
  className?: string
  showEmpty?: boolean
  confident?: boolean
}) {
  const total = 5
  const filled = Math.max(0, Math.min(total, Math.round(rings)))
  if (!filled && !showEmpty) return null

  const stroke = Math.max(2, size / 11)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const gap = c * 0.035
  const seg = c / total - gap

  const tone =
    filled >= 5 ? 'var(--ok)' : filled >= 3 ? 'var(--accent)' : filled >= 1 ? 'var(--warn)' : 'var(--border-strong)'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0', className)}
      role="img"
      aria-label={`Mastery ${filled} of ${total}${confident ? '' : ', low confidence'}`}
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {Array.from({ length: total }, (_, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={i < filled ? tone : 'var(--border)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${seg} ${c - seg}`}
            strokeDashoffset={-(i * (seg + gap))}
            opacity={i < filled ? (confident ? 1 : 0.55) : 1}
          />
        ))}
      </g>
      {filled === 5 ? (
        <circle cx={size / 2} cy={size / 2} r={size / 8} fill="var(--ok)" />
      ) : null}
    </svg>
  )
}
