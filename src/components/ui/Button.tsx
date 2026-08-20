'use client'
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-fg hover:brightness-110 active:brightness-95 shadow-sm font-medium',
  secondary:
    'bg-bg-overlay text-fg border border-border-strong hover:border-fg-subtle hover:bg-bg-raised',
  ghost: 'text-fg-muted hover:text-fg hover:bg-bg-overlay',
  danger: 'bg-bad-soft text-bad border border-bad/40 hover:bg-bad hover:text-bg',
  quiet: 'text-fg-subtle hover:text-fg',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-xl',
}

const BASE =
  'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 ' +
  'disabled:opacity-45 disabled:pointer-events-none select-none'

interface Common {
  variant?: Variant
  size?: Size
  children: ReactNode
  className?: string
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: Common & ComponentProps<'button'>) {
  return <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest} />
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  className,
  href,
  ...rest
}: Common & { href: string } & Omit<ComponentProps<typeof Link>, 'href'>) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest} />
  )
}
