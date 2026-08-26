'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { useProfile } from '@/hooks/useProfile'
import { levelFromXp, levelTitle } from '@/engines/gamify/rules'
import { certById } from '@/content'
import { cn } from '@/lib/cn'
import { ThemeToggle } from './ThemeToggle'
import { SearchButton } from './SearchButton'
import { ICONS, type IconName } from '@/components/ui/Icon'

interface NavItem {
  href: string
  label: string
  icon: IconName
  hint: string
  /** Shows a live count badge. */
  counter?: 'due' | 'mistakes'
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Orient',
    items: [
      {
        href: '/',
        label: 'Mission Control',
        icon: 'target',
        hint: 'Today’s plan and where you stand',
      },
      {
        href: '/big-picture',
        label: 'Big Picture',
        icon: 'layers',
        hint: 'Every service on one canvas',
      },
      {
        href: '/story',
        label: 'Story Mode',
        icon: 'book',
        hint: 'One system, built in order — why each service exists',
      },
      { href: '/map', label: 'Roadmap', icon: 'route', hint: 'The 29-week path, phase by phase' },
    ],
  },
  {
    title: 'Learn',
    items: [
      {
        href: '/learn',
        label: 'Lessons',
        icon: 'cap',
        hint: 'One idea at a time, in the order that makes it stick',
      },
      {
        href: '/services',
        label: 'Service Atlas',
        icon: 'list',
        hint: '141 services, tiered by exam weight',
      },
      {
        href: '/concepts',
        label: 'Concepts',
        icon: 'blocks',
        hint: 'CIDR, RPO, idempotency — what the exam assumes',
      },
      {
        href: '/decoder',
        label: 'Keyword Decoder',
        icon: 'key',
        hint: 'The phrases that give the answer away',
      },
      {
        href: '/compare',
        label: 'Decision Trees',
        icon: 'branch',
        hint: 'Which database? Which compute?',
      },
    ],
  },
  {
    title: 'Practise',
    items: [
      {
        href: '/drill',
        label: 'Recall Drill',
        icon: 'refresh',
        hint: 'Spaced repetition',
        counter: 'due',
      },
      { href: '/labs', label: 'Labs', icon: 'wrench', hint: 'Build it, then break it' },
      { href: '/exam', label: 'Exam Simulator', icon: 'paper', hint: 'A full timed paper' },
    ],
  },
  {
    title: 'Review',
    items: [
      {
        href: '/progress',
        label: 'Progress',
        icon: 'chart',
        hint: 'Mastery, readiness, mistake log',
        counter: 'mistakes',
      },
      { href: '/settings', label: 'Settings', icon: 'sliders', hint: 'Theme, export, reset' },
    ],
  },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const profile = useProfile()
  const level = levelFromXp(profile.xp)
  const cert = certById.get(profile.targetCert)

  const dueCount = useLiveQuery(
    () => db.srsCards.where('due').belowOrEqual(Date.now()).count(),
    [],
    0,
  )
  const mistakeCount = useLiveQuery(() => db.mistakes.filter((m) => !m.resolved).count(), [], 0)

  const counters = { due: dueCount, mistakes: mistakeCount }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-bg-overlay"
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[15px] font-bold text-accent-fg"
          style={{ background: 'var(--accent)' }}
          aria-hidden
        >
          λ
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold leading-tight">
            AWS Trainer
          </span>
          <span className="block truncate text-[11px] leading-tight text-fg-subtle">
            {cert?.shortTitle ?? 'Solutions Architect'}
          </span>
        </span>
      </Link>

      {/* Search has to be visible, not only ⌘K — see SearchButton. */}
      <SearchButton />

      {/* Level and streak: the two numbers worth a permanent home. */}
      <div className="surface-inset px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold">Level {level.level}</span>
          <span className="nums text-[11px] text-fg-subtle">{profile.xp.toLocaleString()} XP</span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-accent">{levelTitle(level.level)}</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${(level.into / level.span) * 100}%`, background: 'var(--accent)' }}
          />
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-fg-subtle">
          <span title={`Best streak: ${profile.bestStreak} days`}>
            🔥 <span className="nums text-fg-muted">{profile.streak}</span> day
            {profile.streak === 1 ? '' : 's'}
          </span>
          {profile.freezes > 0 ? (
            <span title="Streak freezes — each one covers a single missed day">
              ❄ <span className="nums text-fg-muted">{profile.freezes}</span>
            </span>
          ) : null}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
              {group.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                const count = item.counter ? counters[item.counter] : 0
                const Glyph = ICONS[item.icon]
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={item.hint}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors',
                        active
                          ? 'bg-accent-soft font-medium text-accent'
                          : 'text-fg-muted hover:bg-bg-overlay hover:text-fg',
                      )}
                    >
                      <Glyph
                        className={cn('h-4 w-4 shrink-0', active ? '' : 'text-fg-subtle')}
                        width={16}
                        height={16}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count ? (
                        <span
                          className="nums shrink-0 rounded-full bg-accent px-1.5 py-px text-[10px] font-semibold text-accent-fg"
                          aria-label={`${count} pending`}
                        >
                          {count > 99 ? '99+' : count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <ThemeToggle />
        <span className="text-[10px] text-fg-subtle">Local only</span>
      </div>
    </div>
  )
}
