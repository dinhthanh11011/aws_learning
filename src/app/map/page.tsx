import { Suspense } from 'react'
import { Page } from '@/components/shell/AppShell'
import { RoadmapView } from './RoadmapView'

export const metadata = { title: 'Roadmap · AWS Trainer' }

export default function MapPage() {
  return (
    <Page
      title="Roadmap"
      lede="The exam guide tells you what is examined; it says nothing about the order to learn it in. This is the order: foundations first, then the services that carry most of the paper, then building, then drilling. Each phase unlocks when the one before it averages three rings."
    >
      {/* RoadmapView reads the expanded phase from `?phase=`, and a client hook
          on a prerendered route has to sit under a Suspense boundary. There is
          nothing to show while it resolves — the phases need the local profile
          anyway — so the fallback is empty rather than a flash of skeleton. */}
      <Suspense fallback={null}>
        <RoadmapView />
      </Suspense>
    </Page>
  )
}
