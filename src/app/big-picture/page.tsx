import { Page } from '@/components/shell/AppShell'
import { BigPictureCanvas } from './BigPictureCanvas'
import { BP_NODES, FLOWS } from '@/content/big-picture'
import { services } from '@/content'

export const metadata = {
  title: 'Big Picture · AWS Trainer',
  description: 'Every layer of a real AWS system on one canvas, with the flows animated.',
}

export default function BigPicturePage() {
  return (
    <Page
      title="The Big Picture"
      lede={
        <>
          Read this before anything else. AWS sells {services.length}+ services but a real production
          system uses about {BP_NODES.length}, arranged in five layers that are always the same
          shape. Learn the shape first and every service afterwards has somewhere to go — skip it and
          the rest is a list of disconnected terms. Then trace one of the {FLOWS.length} flows to see
          what actually depends on what.
        </>
      }
    >
      <BigPictureCanvas />
    </Page>
  )
}
