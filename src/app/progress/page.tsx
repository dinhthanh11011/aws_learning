import { Page } from '@/components/shell/AppShell'
import { ProgressPanel } from './ProgressPanel'

export const metadata = { title: 'Progress · AWS Trainer' }

export default function ProgressPage() {
  return (
    <Page
      title="Progress"
      lede="Measured from what you have recalled, answered and built — not from what you have read. The weakest-first ordering and the mistake log together are a better study plan than any generic syllabus."
    >
      <ProgressPanel />
    </Page>
  )
}
