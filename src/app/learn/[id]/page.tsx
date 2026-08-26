import { notFound } from 'next/navigation'
import Link from 'next/link'
import { lessons, lesson as findLesson, taskById, domainOfTask, serviceBySlug } from '@/content'
import { Page } from '@/components/shell/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Sections } from '@/components/lesson/Sections'
import { LessonChecks } from '@/components/lesson/LessonChecks'
import { FamilyBadges } from '@/components/service/FamilyBadges'
import { ServiceRef } from '@/components/service/ServiceRef'

export function generateStaticParams() {
  return lessons.map((l) => ({ id: l.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = findLesson(id)
  return l ? { title: `${l.title} · AWS Trainer`, description: l.subtitle } : {}
}

/**
 * The lesson player. No `?step=` state of its own — a walkthrough diagram owns
 * its own position, so there is nothing here to put in the URL and nothing to
 * wrap in Suspense.
 */
export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = findLesson(id)
  if (!l) notFound()

  const task = taskById.get(l.taskId)
  const domain = domainOfTask(l.taskId)

  return (
    <Page title={l.title} lede={l.subtitle}>
      {/* A reading measure, not the page width. Prose at 1150 px is unreadable,
          and the diagrams are SVGs that scale to their container — given the
          whole page they render at roughly twice the size they were drawn for. */}
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <FamilyBadges item={l} />
          {task ? (
            <Badge tone="neutral" title={domain?.title}>
              {task.code} {task.title}
            </Badge>
          ) : null}
          <Badge tone="neutral">{l.minutes} min</Badge>
        </div>

        <article className="flex flex-col gap-5">
          <Sections sections={l.sections} headingLevel={2} />
        </article>

        {l.checks.length ? (
          <div className="border-t border-border pt-6">
            <LessonChecks lessonId={l.id} checks={l.checks} />
          </div>
        ) : null}

        {/* The atlas entries behind the lesson, so the reference is one tap away
            without the lesson having had to restate it. */}
        {l.serviceSlugs.length ? (
          <section className="surface p-4">
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-fg-subtle">
              The atlas cards behind this lesson
            </p>
            <div className="flex flex-wrap gap-1.5">
              {l.serviceSlugs
                .filter((s) => serviceBySlug.has(s))
                .map((s) => (
                  <ServiceRef key={s} slug={s} />
                ))}
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 text-[13px]">
          <Link href="/learn" className="text-fg-muted underline-offset-2 hover:underline">
            All lessons
          </Link>
          <Link href="/drill" className="text-fg-muted underline-offset-2 hover:underline">
            Drill the cards behind it
          </Link>
          <Link href="/quiz" className="text-fg-muted underline-offset-2 hover:underline">
            Answer real exam questions on it
          </Link>
        </div>
      </div>
    </Page>
  )
}
