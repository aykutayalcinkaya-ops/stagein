import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'
import { Providers } from './providers'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { AuthSync } from '@/components/AuthSync'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const display = Oswald({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'StageIn — Müzisyenlerin Platformu',
    template: '%s | StageIn',
  },
  description:
    'Video yükle, şehrindeki müzisyenler tarafından keşfedil, doğrudan mesajla. Grup arayanlar, session müzisyenleri ve eğitmenler için StageIn.',
  keywords: ['müzisyen', 'grup arıyorum', 'session müzisyen', 'müzik ilanları', 'enstrüman dersi'],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE_URL,
    siteName: 'StageIn',
    title: 'StageIn — Müzisyenlerin Platformu',
    description: 'Video yükle, keşfedil, bağlan. Müzisyenler için dikey sosyal ağ.',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${display.variable}`}>
      <body className="bg-dark text-text font-sans antialiased">
        <Providers>
          <AuthSync />
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}
