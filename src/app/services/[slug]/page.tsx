import { notFound } from 'next/navigation'
import { service as findService, services } from '@/content'
import { Page } from '@/components/shell/AppShell'
import { ServiceAtlas, ServiceMeta } from '@/components/service/ServiceAtlas'
import { ConfidenceMark } from '@/components/service/ConfidenceMark'

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = findService(slug)
  return s ? { title: `${s.name} · AWS Trainer`, description: s.oneLiner } : {}
}

/**
 * The full atlas card. Identical content to the quick-look panel — both render
 * `ServiceAtlas`, so a fact is never on one and missing from the other.
 */
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = findService(slug)
  if (!s) notFound()

  return (
    <Page title={s.name} lede={s.oneLiner} actions={<ConfidenceMark slug={s.slug} />}>
      <ServiceMeta service={s} className="mb-6" />
      <ServiceAtlas service={s} />
    </Page>
  )
}
