import { Page } from '@/components/shell/AppShell'
import { ExamRunner } from './ExamRunner'

export const metadata = { title: 'Exam Simulator · AWS Trainer' }

export default function ExamPage() {
  return (
    <Page
      title="Exam Simulator"
      lede="A full timed paper, sampled to the real domain weighting. This is the only honest readiness signal — content mastery tells you what you know, a timed paper tells you whether you can do it in 130 minutes against four plausible options."
    >
      <ExamRunner />
    </Page>
  )
}
