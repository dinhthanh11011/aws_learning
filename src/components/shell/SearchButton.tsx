'use client'
import { openCommandPalette } from '@/lib/command-palette'
import { IconSearch } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/**
 * The visible way in to search. ⌘K and "/" are faster, but they are invisible,
 * and a learner who never finds the palette navigates 141 services by hand — so
 * the button also prints its own shortcut, which is how people learn one.
 *
 * `variant="icon"` is the mobile top bar, where there is no room for a field.
 */
export function SearchButton({
  variant = 'field',
  className,
}: {
  variant?: 'field' | 'icon'
  className?: string
}) {
  if (variant === 'icon') {
    return (
      <button
        onClick={openCommandPalette}
        aria-label="Search services and concepts (press / or ⌘K)"
        className={cn(
          'grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-bg-overlay',
          className,
        )}
      >
        <IconSearch width={16} height={16} />
      </button>
    )
  }

  return (
    <button
      onClick={openCommandPalette}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border border-border bg-bg px-2.5 py-1.5',
        'text-[12.5px] text-fg-subtle transition-colors hover:border-border-strong hover:text-fg-muted',
        className,
      )}
    >
      <IconSearch className="shrink-0 text-fg-subtle" width={14} height={14} />
      <span className="min-w-0 flex-1 truncate text-left">Search services, concepts…</span>
      <kbd className="shrink-0 rounded border border-border px-1 py-px text-[10px] text-fg-subtle">
        ⌘K
      </kbd>
    </button>
  )
}
