import { HomeDashboard } from './HomeDashboard'
import { Page } from '@/components/shell/AppShell'

export default function Home() {
  return (
    <Page
      title="Mission Control"
      lede="What to do today, and how far off the exam you actually are. Everything here is measured from what you have recalled and answered, not from what you have read."
    >
      {/* Read the clock here so the client never does it during render. This is
          a server component, rendered once per request, so Date.now() is stable
          for the render it participates in. */}
      {/* eslint-disable-next-line react-hooks/purity */}
      <HomeDashboard nowMs={Date.now()} />
    </Page>
  )
}
