import { Page } from '@/components/shell/AppShell'
import { DecoderTrainer } from './DecoderTrainer'

export const metadata = { title: 'Keyword Decoder · AWS Trainer' }

export default function DecoderPage() {
  return (
    <Page
      title="Keyword Decoder"
      lede="Exam questions are requirements in costume. Each of these phrases gives the answer away — and each one lists the plausible option it was engineered to make you pick instead. Recognising the phrase eliminates two or three options before you finish reading the stem."
    >
      <DecoderTrainer />
    </Page>
  )
}
