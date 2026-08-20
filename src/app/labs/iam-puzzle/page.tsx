import { Page } from '@/components/shell/AppShell'
import { IamLab } from './IamLab'
import { labById } from '@/content'

export const metadata = { title: 'IAM Policy Puzzle · AWS Trainer' }

export default function IamLabPage() {
  const lab = labById.get('iam-puzzle')!
  return (
    <Page title={lab.title} lede={lab.objective}>
      <IamLab />
    </Page>
  )
}
