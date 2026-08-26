import { Page } from '@/components/shell/AppShell'
import { CardLink } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FamilyBadges } from '@/components/service/FamilyBadges'
import { lessons, taskById } from '@/content'

export const metadata = {
  title: 'Lessons · AWS Trainer',
  description: 'One idea at a time, in the order that makes it stick.',
}

/**
 * The lesson index. One lesson today, and the page says so plainly — the same
 * honesty rule the story index follows. A list of one dressed up as a library is
 * the kind of small lie that makes a learner stop trusting the rest of the app,
 * and here it would also hide the useful information: where the teaching for
 * everything else currently lives.
 */
export default function LearnIndex() {
  return (
    <Page
      title="Lessons"
      lede="The atlas is a reference: every fact about a service, all at once, in no particular order. That is the right shape for looking something up and the wrong shape for meeting an idea for the first time. A lesson is the same facts in an order — a picture before the definition, the wrong answer written out before it is rejected, and a recall check at the end of each idea."
    >
      <div className="flex flex-col gap-4">
        {lessons.map((l) => {
          const task = taskById.get(l.taskId)
          return (
            <CardLink key={l.id} href={`/learn/${l.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[17px] font-semibold">{l.title}</h2>
                <div className="flex shrink-0 items-center gap-1.5">
                  {task ? <Badge tone="neutral">{task.code}</Badge> : null}
                  <FamilyBadges item={l} />
                </div>
              </div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-fg-muted">{l.subtitle}</p>
              <p className="nums mt-2 text-[12.5px] text-fg-subtle">
                {l.minutes} min · {l.checks.length} recall{' '}
                {l.checks.length === 1 ? 'check' : 'checks'}
              </p>
            </CardLink>
          )
        })}

        <p className="text-[13px] leading-relaxed text-fg-subtle">
          {lessons.length === 1 ? 'One lesson so far' : `${lessons.length} lessons so far`} — this
          is the first, and the format is deliberately being proved on one topic before more are
          written. Everything else is taught through the Service Atlas, Concepts, Story Mode, the
          Keyword Decoder and the labs.
        </p>
      </div>
    </Page>
  )
}
