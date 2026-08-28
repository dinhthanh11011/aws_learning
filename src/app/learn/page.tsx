import { Suspense } from 'react'
import { Page } from '@/components/shell/AppShell'
import { LessonIndex } from './LessonIndex'

export const metadata = {
  title: 'Lessons · AWS Trainer',
  description: 'One idea at a time, in the order that makes it stick.',
}

/**
 * The lesson index. The list itself is a client component, because the clusters
 * are scoped to the cert being studied and the target cert lives in IndexedDB —
 * see `LessonIndex`.
 *
 * What stays here is the honesty: the page says plainly how much of the syllabus
 * the layer covers, the same rule the story index follows. A short list dressed
 * up as a library is the kind of small lie that makes a learner stop trusting
 * the rest of the app, and here it would also hide the useful information —
 * where the teaching for everything else currently lives.
 *
 * The eight clusters used to be enumerated in this paragraph. They are data now
 * (`lesson-clusters.ts`) and each one's sentence renders above the lessons it
 * describes, so the only hand-written part left is the list of what is *not*
 * written. That half stays hand-written deliberately: a generated list of
 * covered services would be accurate and would not tell a learner what is
 * missing.
 */
export default function LearnIndex() {
  return (
    <Page
      title="Lessons"
      lede="The atlas is a reference: every fact about a service, all at once, in no particular order. That is the right shape for looking something up and the wrong shape for meeting an idea for the first time. A lesson is the same facts in an order — a picture before the definition, the wrong answer written out before it is rejected, and a recall check at the end of each idea."
    >
      {/* The list reads `?scope=` and the local profile, and a client hook on a
          prerendered route has to sit under a Suspense boundary. The fallback is
          empty rather than a skeleton: the cert is needed before there is
          anything honest to show. */}
      <Suspense fallback={null}>
        <LessonIndex />
      </Suspense>

      <p className="mt-8 text-[13px] leading-relaxed text-fg-subtle">
        Those are the clusters with real question weight on either paper. What is still unwritten is
        the rank below them: DNS and the Route 53 routing policies, joining networks together with
        peering, Transit Gateway and PrivateLink, Auto Scaling and what it cannot fix, migration and
        hybrid, and secrets and configuration in code. Until those exist, those topics are taught
        through the Service Atlas, Concepts, Story Mode, the Keyword Decoder and the labs — the
        atlas holds every fact either way, and a lesson only ever puts facts in an order.
      </p>
    </Page>
  )
}
