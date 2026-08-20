import { Page } from '@/components/shell/AppShell'
import { CostLab } from './CostLab'
import { labById } from '@/content'

export const metadata = { title: 'Storage & Teardown Cost Lab · AWS Trainer' }

export default function CostLabPage() {
  const lab = labById.get('storage-cost')!
  return (
    <Page title={lab.title} lede={lab.objective}>
      <CostLab />
    </Page>
  )
}
