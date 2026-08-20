'use client'
import { useId, useState, type ReactNode } from 'react'

/**
 * A hover/focus tooltip that is also reachable by keyboard. Deliberately not a
 * library: the only positioning we need is "above, centred, flipped if it would
 * clip", and that is cheaper to write than to depend on.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={
            'pointer-events-none absolute left-1/2 z-50 w-max max-w-[280px] -translate-x-1/2 ' +
            'rounded-lg border border-border-strong bg-bg-overlay px-2.5 py-1.5 text-[12px] ' +
            'leading-snug text-fg shadow-float ' +
            (side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2')
          }
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}
