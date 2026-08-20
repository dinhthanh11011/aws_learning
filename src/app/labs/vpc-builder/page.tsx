import { Page } from '@/components/shell/AppShell'
import { VpcLab } from './VpcLab'
import { labById } from '@/content'

export const metadata = { title: 'VPC Packet Tracer · AWS Trainer' }

export default function VpcLabPage() {
  const lab = labById.get('vpc-builder')!
  return (
    <Page title={lab.title} lede={lab.objective}>
      <VpcLab />
    </Page>
  )
}
