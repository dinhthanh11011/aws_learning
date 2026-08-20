import { Page } from '@/components/shell/AppShell'
import { RoadmapView } from './RoadmapView'

export const metadata = { title: 'Roadmap · AWS Trainer' }

export default function MapPage() {
  return (
    <Page
      title="Roadmap"
      lede="The exam guide tells you what is examined; it says nothing about the order to learn it in. This is the order: foundations first, then the services that carry most of the paper, then building, then drilling. Each phase unlocks when the one before it averages three rings."
    >
      <RoadmapView />
    </Page>
  )
}
