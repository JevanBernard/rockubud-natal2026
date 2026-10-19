import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pendaftaran Natal GBI ROCK Ubud',
  description: 'Pendaftaran kehadiran Ibadah Natal GBI ROCK Ubud 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
