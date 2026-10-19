import { wajibAdmin } from '@/lib/admin'
import Scanner from './scanner'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await wajibAdmin()
  return (
    <main>
      <p style={{ margin: '0 0 8px' }}><a href="/admin">← Dashboard</a></p>
      <h1>Check-in</h1>
      <p className="sub">Arahkan kamera ke QR pendaftar, lalu centang siapa saja yang datang.</p>
      <Scanner />
    </main>
  )
}
