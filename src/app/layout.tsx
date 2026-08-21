import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppShell } from '@/components/shell/AppShell'
import { currentCerts } from '@/content'

export const metadata: Metadata = {
  title: `AWS Trainer — ${currentCerts.map((c) => c.id).join(' & ')}`,
  description:
    'Learn AWS by seeing the whole picture, recalling it under pressure, and building it until it breaks. Solutions Architect and Developer Associate.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0d1017' },
    { media: '(prefers-color-scheme: light)', color: '#fbfbfc' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
