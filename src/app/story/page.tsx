import { Page } from '@/components/shell/AppShell'
import { CardLink } from '@/components/ui/Card'
import { FamilyBadges } from '@/components/service/FamilyBadges'
import { stories } from '@/content'

export const metadata = {
  title: 'Story Mode · AWS Trainer',
  description: 'One system, built in order, with the reason for every service.',
}

/**
 * The storyline index. There is exactly one storyline today and the page says so
 * rather than implying a library — a list of one dressed up as a catalogue is the
 * kind of small dishonesty that makes a learner stop trusting the rest.
 */
export default function StoryIndex() {
  return (
    <Page
      title="Story Mode"
      lede="The atlas tells you what each service is. This tells you why you would ever reach for it — in order, one system, each chapter caused by the last one’s limitation."
    >
      <div className="flex flex-col gap-4">
        {stories.map((s) => {
          const minutes = s.chapters.reduce((n, c) => n + c.minutes, 0)
          return (
            <CardLink key={s.slug} href={`/story/${s.slug}?chapter=1`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[17px] font-semibold">{s.title}</h2>
                <FamilyBadges item={s} />
              </div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-fg-muted">{s.premise}</p>
              <p className="nums mt-2 text-[12.5px] text-fg-subtle">
                {s.chapters.length} chapters · about {Math.round((minutes / 60) * 10) / 10} h
              </p>
            </CardLink>
          )
        })}
        {stories.length === 1 ? (
          <p className="text-[13px] text-fg-subtle">
            One storyline so far, covering the SAA material. A developer-focused arc for DVA-C02 is
            not written yet.
          </p>
        ) : null}
      </div>
    </Page>
  )
}
