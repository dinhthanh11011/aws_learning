import { Page } from '@/components/shell/AppShell'
import { QuizRunner } from './QuizRunner'

export const metadata = { title: 'Quiz · AWS Trainer' }

export default function QuizPage() {
  return (
    <Page
      title="Quick Quiz"
      lede="Ten questions with immediate feedback and every option explained. Shorter than a full paper and better for learning, because the gap between answering and finding out is where it sticks."
    >
      <QuizRunner />
    </Page>
  )
}
