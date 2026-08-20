'use client'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, search, TIER_META, type SearchHit } from '@/content'
import { openService } from '@/lib/service-peek'
import {
  closeCommandPalette,
  getCommandPaletteOpen,
  getServerCommandPaletteOpen,
  openCommandPalette,
  subscribeCommandPalette,
} from '@/lib/command-palette'
import { IconSearch } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/**
 * ⌘K search over services, task statements and trigger phrases. On a corpus
 * this size, getting to a service card in two keystrokes matters more than any
 * amount of navigation hierarchy.
 *
 * Open state lives in a module store rather than here, because a shortcut
 * nobody is told about is a feature nobody has: `SearchButton` in the sidebar
 * and the mobile top bar open the same palette, and they are not below this
 * component in the tree.
 */
export function CommandPalette() {
  const open = useSyncExternalStore(
    subscribeCommandPalette,
    getCommandPaletteOpen,
    getServerCommandPaletteOpen,
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) closeCommandPalette()
        else openCommandPalette()
      }
      if (e.key === 'Escape') closeCommandPalette()
      // Bare "/" opens search, the way it does everywhere else — but never
      // while the user is typing into something.
      if (e.key === '/' && !open) {
        const el = document.activeElement
        const typing =
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          (el as HTMLElement | null)?.isContentEditable
        if (!typing) {
          e.preventDefault()
          openCommandPalette()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return open ? <PaletteDialog /> : null
}

/**
 * The dialog is a separate component so that it mounts fresh on every open:
 * that is what resets the query, with no effect writing state during render.
 */
function PaletteDialog() {
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const hits = useMemo(() => (q.length >= 2 ? search(q, undefined, 12) : []), [q])

  /**
   * A service opens in the quick-look panel by default and only navigates on
   * ⌘/Ctrl+Enter. Searching for a service is nearly always "remind me", not
   * "take me there", and mid-exam the second one costs the question.
   */
  const go = (hit: SearchHit, navigate = false) => {
    closeCommandPalette()
    if (hit.kind === 'service') {
      if (navigate) router.push(`/services/${hit.service.slug}`)
      else openService(hit.service.slug)
    } else if (hit.kind === 'task') router.push(`/map#${hit.task.id}`)
    else router.push('/decoder')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => closeCommandPalette()}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      data-dialog="command-palette"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border-strong bg-bg-raised shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <IconSearch className="shrink-0 text-fg-subtle" width={16} height={16} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setCursor(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setCursor((c) => Math.min(c + 1, hits.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setCursor((c) => Math.max(c - 1, 0))
              }
              if (e.key === 'Enter' && hits[cursor]) go(hits[cursor], e.metaKey || e.ctrlKey)
            }}
            placeholder="Search services, task statements, trigger phrases…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg-subtle"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-fg-subtle">
            esc
          </kbd>
        </div>

        {q.length >= 2 ? (
          hits.length ? (
            <ul className="max-h-[52vh] overflow-y-auto p-1.5">
              {hits.map((hit, i) => (
                <li key={`${hit.kind}-${i}`}>
                  <button
                    onMouseEnter={() => setCursor(i)}
                    onClick={(e) => go(hit, e.metaKey || e.ctrlKey)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                      i === cursor ? 'bg-bg-overlay' : 'hover:bg-bg-overlay/60',
                    )}
                  >
                    {hit.kind === 'service' ? (
                      <>
                        <span
                          className="h-6 w-1 shrink-0 rounded-full"
                          style={{ background: CATEGORIES[hit.service.category].token }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">
                            {hit.service.name}
                          </span>
                          <span className="block truncate text-[11px] text-fg-subtle">
                            {hit.service.oneLiner}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] text-fg-subtle">
                          {TIER_META[hit.service.tier].label}
                        </span>
                      </>
                    ) : hit.kind === 'task' ? (
                      <>
                        <span className="h-6 w-1 shrink-0 rounded-full bg-info" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">
                            {hit.task.code} {hit.task.title}
                          </span>
                          <span className="block truncate text-[11px] text-fg-subtle">
                            {hit.domain.title} · {hit.domain.weight}% of the paper
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-6 w-1 shrink-0 rounded-full bg-warn" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">
                            {hit.trigger.phrase}
                          </span>
                          <span className="block truncate text-[11px] text-fg-subtle">
                            {hit.trigger.means}
                          </span>
                        </span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-[13px] text-fg-subtle">
              Nothing matches “{q}”.
            </p>
          )
        ) : (
          <p className="px-4 py-8 text-center text-[13px] text-fg-subtle">
            Type at least two characters. Try <span className="text-fg-muted">nat</span>,{' '}
            <span className="text-fg-muted">visibility timeout</span>, or{' '}
            <span className="text-fg-muted">least operational</span>.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-fg-subtle">
          <span>
            <kbd className="rounded border border-border px-1 py-px">↵</kbd> quick look
          </span>
          <span>
            <kbd className="rounded border border-border px-1 py-px">⌘↵</kbd> open the full page
          </span>
          <span>
            <kbd className="rounded border border-border px-1 py-px">↑↓</kbd> move
          </span>
        </div>
      </div>
    </div>
  )
}
