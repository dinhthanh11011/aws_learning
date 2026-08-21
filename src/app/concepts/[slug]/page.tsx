import { notFound } from 'next/navigation'
import { concept as findConcept, concepts } from '@/content'
import { Page } from '@/components/shell/AppShell'
import { ConceptAtlas, ConceptMeta } from '@/components/service/ConceptAtlas'

export function generateStaticParams() {
  return concepts.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = findConcept(slug)
  return c ? { title: `${c.term} · AWS Trainer`, description: c.oneLiner } : {}
}

/**
 * The full concept card. Identical content to the quick-look panel — both
 * render `ConceptAtlas`, for the same reason the service pages do.
 */
export default async function ConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = findConcept(slug)
  if (!c) notFound()

  return (
    <Page
      title={c.term}
      lede={c.aka?.length ? `${c.oneLiner} Also written: ${c.aka.join(', ')}.` : c.oneLiner}
    >
      <ConceptMeta concept={c} className="mb-6" />
      <ConceptAtlas concept={c} />
    </Page>
  )
}
