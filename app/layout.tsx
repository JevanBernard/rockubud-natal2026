import './globals.css'
import './form-publik.css'
import './tiket.css'
import './scan.css'
import './admin.css'
import './responsif.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Pendaftaran Natal GBI ROCK Ubud',
  description: 'Pendaftaran kehadiran Ibadah Natal GBI ROCK Ubud 2026',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#852139' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@1,600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
