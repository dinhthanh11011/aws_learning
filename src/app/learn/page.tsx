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
 * The lesson index. It says plainly how much of the syllabus the layer covers —
 * the same honesty rule the story index follows. A short list dressed up as a
 * library is the kind of small lie that makes a learner stop trusting the rest of
 * the app, and here it would also hide the useful information: where the teaching
 * for everything else currently lives.
 *
 * The counts are derived, but the *topic* sentence is hand-written, so it needs
 * editing when a batch lands. That is deliberate: a generated list of covered
 * services would be accurate and would not tell a learner what is missing.
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
          {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}, covering eight clusters:
          reachability — routing, the two filters, and why something cannot reach the internet;
          identity — how IAM decides, why a role beats an access key, and the two keys behind
          envelope encryption; storage — the three shapes, choosing an S3 storage class, and what
          eleven nines actually measures; resilience — Multi-AZ against a read replica, the two
          numbers that choose a disaster recovery architecture, and which load balancer the layer
          decides; serverless and events — what actually runs a Lambda function, whether the
          hand-off is a queue, a topic or a bus, and what happens on the second delivery; data and
          cost — why the partition key is the whole design, four caches at four distances from the
          user, and paying less for exactly the same thing; and the developer cluster — what the API
          Gateway front door does before your code runs, which of Cognito’s two pools a requirement
          is asking for, which of the three Code-something services owns which job, and which of
          CloudWatch, X-Ray and CloudTrail can answer the sentence in front of you; and the long
          tail — why a stack rather than a resource is the thing CloudFormation acts on, which of a
          container task’s two IAM roles has just failed and who owns the server underneath it, when
          a queue is the wrong shape for events more than one team needs, and where the state lives
          when step three of a workflow fails. That is every cluster with real question weight on
          either paper. What is still unwritten is the rank below it: DNS and the Route 53 routing
          policies, joining networks together with peering, Transit Gateway and PrivateLink, Auto
          Scaling and what it cannot fix, migration and hybrid, and secrets and configuration in
          code. Until those exist, those topics are taught through the Service Atlas, Concepts,
          Story Mode, the Keyword Decoder and the labs — the atlas holds every fact either way, and
          a lesson only ever puts facts in an order.
        </p>
      </div>
    </Page>
  )
}
