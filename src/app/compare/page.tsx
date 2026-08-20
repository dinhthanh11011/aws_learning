import { Page } from '@/components/shell/AppShell'
import { DecisionTreeView } from './DecisionTreeView'

export const metadata = { title: 'Decision Trees · AWS Trainer' }

export default function ComparePage() {
  return (
    <Page
      title="Decision Trees"
      lede="The exam never asks what DynamoDB is. It describes a requirement and makes you choose. These walk the reasoning one question at a time, because the thing worth learning is the path — not the list of destinations."
    >
      <DecisionTreeView />
    </Page>
  )
}
