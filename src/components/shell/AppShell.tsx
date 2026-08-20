'use client'
import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { ServicePeek } from '@/components/service/ServicePeek'

/**
 * The layer ladder, in one place so it cannot drift: mobile top bar `z-20`,
 * nav drawer `z-30`, service quick look `z-40`, command palette `z-50`. All
 * four are Tailwind's built-in steps on purpose — an arbitrary `z-[90]` that
 * the class scan misses silently becomes `z-index: auto`, and then the sticky
 * top bar paints over the panel on a narrow screen.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-dvh">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 border-r border-border bg-bg-raised lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="h-full w-[264px] border-r border-border bg-bg-raised"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-bg/85 px-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-bg-overlay"
          >
            ☰
          </button>
          <span className="text-[13px] font-semibold">AWS Trainer</span>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <CommandPalette />
      <ServicePeek />
    </div>
  )
}

/** Standard page frame: a title block plus content, consistent everywhere. */
export function Page({
  title,
  lede,
  actions,
  children,
  wide,
}: {
  title: string
  lede?: ReactNode
  actions?: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div
      className={wide ? 'w-full' : 'mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10'}
    >
      {wide ? null : (
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
            {lede ? (
              <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-fg-muted">{lede}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      )}
      {children}
    </div>
  )
}
