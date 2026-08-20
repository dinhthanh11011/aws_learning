import { Page } from '@/components/shell/AppShell'
import { SettingsPanel } from './SettingsPanel'

export const metadata = { title: 'Settings · AWS Trainer' }

export default function SettingsPage() {
  return (
    <Page
      title="Settings"
      lede="Your target, your schedule, and your data — which lives entirely in this browser."
    >
      <SettingsPanel />
    </Page>
  )
}
