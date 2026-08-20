import { Page } from '@/components/shell/AppShell'
import { ServicesBrowser } from './ServicesBrowser'
import { contentStats } from '@/content'

export const metadata = { title: 'Service Atlas · AWS Trainer' }

export default function ServicesPage() {
  const stats = contentStats()
  return (
    <Page
      title="Service Atlas"
      lede={
        <>
          All {stats.services} in-scope services, tiered by how deeply you actually need to know
          them: <strong className="font-semibold text-fg">{stats.tier1} core</strong> you must know
          cold, {stats.tier2} to know when to reach for, and {stats.tier3} to merely recognise so you
          can eliminate them. Every card carries the numbers to memorise and the traps that use them.
        </>
      }
    >
      <ServicesBrowser />
    </Page>
  )
}
