import { Page } from '@/components/shell/AppShell'
import { OnboardingFlow } from './OnboardingFlow'

export const metadata = { title: 'Set your plan · AWS Trainer' }

export default function OnboardingPage() {
  return (
    <Page
      title="Set your plan"
      lede="Three questions, then a week-by-week plan. It will tell you plainly if the date you have in mind does not work at the hours you have — which is more useful than a comfortable answer."
    >
      <OnboardingFlow />
    </Page>
  )
}
