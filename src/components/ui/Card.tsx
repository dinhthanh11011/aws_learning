import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
}) {
  return <As className={cn('surface p-4', className)}>{children}</As>
}

export function CardLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'surface block p-4 transition-all duration-150',
        'hover:border-border-strong hover:bg-bg-overlay',
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function SectionTitle({
  children,
  hint,
  right,
}: {
  children: ReactNode
  hint?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{children}</h2>
        {hint ? <p className="mt-0.5 text-[13px] text-fg-subtle">{hint}</p> : null}
      </div>
      {right}
    </div>
  )
}
