import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { stories, story as findStory } from '@/content'
import { Page } from '@/components/shell/AppShell'
import { StoryReader } from '../StoryReader'

export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = findStory(slug)
  return s ? { title: `${s.title} · AWS Trainer`, description: s.premise } : {}
}

/**
 * The reader. Wrapped in Suspense because `StoryReader` reads `?chapter=` — the
 * same reason `/map` wraps `RoadmapView`.
 */
export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = findStory(slug)
  if (!s) notFound()

  return (
    <Page title={s.title} lede={s.premise}>
      <Suspense fallback={null}>
        <StoryReader story={s} />
      </Suspense>
    </Page>
  )
}
