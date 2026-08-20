import { Page } from '@/components/shell/AppShell'
import { DrillSession } from './DrillSession'
import { cards } from '@/content'

export const metadata = { title: 'Recall Drill · AWS Trainer' }

export default function DrillPage() {
  return (
    <Page
      title="Recall Drill"
      lede={
        <>
          {cards.length.toLocaleString()} cards derived from the atlas — the exact numbers, the exam
          traps, the pairs that get confused, and the trigger phrases. Scheduled with FSRS-6, so
          intervals adapt to what you personally keep forgetting rather than a fixed ladder.
        </>
      }
    >
      <DrillSession />
    </Page>
  )
}
