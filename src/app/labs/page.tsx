import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { CATEGORIES, labs } from '@/content'
import { Badge } from '@/components/ui/Badge'

export const metadata = { title: 'Labs · AWS Trainer' }

export default function LabsPage() {
  return (
    <Page
      title="Labs"
      lede="Reading produces recognition; building produces recall — and the exam tests recall under time pressure against four plausible options. Every lab has a break-it mode, because most questions are “this is broken, why?” rather than “what is this?”. Nothing here touches a real AWS account, so there is no bill and nothing to tear down."
    >
      <ul className="grid gap-3 lg:grid-cols-2">
        {labs.map((lab) => {
          const cat = CATEGORIES[lab.category]
          return (
            <li key={lab.id}>
              <Link
                href={`/labs/${lab.id}`}
                className="surface group relative flex h-full flex-col gap-3 overflow-hidden p-5 transition-colors hover:border-border-strong hover:bg-bg-overlay"
              >
                <span
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: cat.token }}
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[16px] font-semibold tracking-tight">{lab.title}</h2>
                  <Badge tone="neutral">{lab.minutes} min</Badge>
                </div>
                <p className="text-[13.5px] font-medium text-accent">{lab.tagline}</p>
                <p className="text-[13.5px] leading-relaxed text-fg-muted">{lab.objective}</p>
                <ul className="mt-auto flex flex-col gap-1.5 border-t border-border pt-3">
                  {lab.teaches.map((t) => (
                    <li key={t} className="flex gap-2 text-[12.5px] leading-snug text-fg-subtle">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-fg-subtle" aria-hidden />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-1.5">
                  {lab.certs.map((c) => (
                    <Badge key={c}>{c}</Badge>
                  ))}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </Page>
  )
}
