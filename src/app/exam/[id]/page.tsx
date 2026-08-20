import { Page } from '@/components/shell/AppShell'
import { ExamReview } from './ExamReview'

export const metadata = { title: 'Exam review · AWS Trainer' }

export default async function ExamReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Page
      title="Exam review"
      lede="Go through the ones you got right as well as the ones you got wrong. If you cannot say why a distractor is wrong, you got that question right by luck and will get its sibling wrong."
    >
      <ExamReview examId={id} />
    </Page>
  )
}
