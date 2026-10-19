import { redirect } from 'next/navigation'
import { adaAdmin } from '@/lib/admin'
import { masuk } from '../actions'

export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  if (await adaAdmin()) redirect('/admin')
  const { err } = await searchParams
  return (
    <main>
      <h1>Admin Natal GBI ROCK Ubud</h1>
      {err === 'salah' && <div className="err">Kata sandi salah.</div>}
      {err === 'config' && <div className="err">ADMIN_PASSWORD belum diisi di .env server.</div>}
      <form action={masuk} className="card">
        <label htmlFor="password">Kata sandi</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          style={{ width: '100%', padding: '11px 12px', fontSize: '1rem', border: '1px solid var(--line)', borderRadius: 8 }} />
        <div style={{ marginTop: 14 }}><button type="submit">Masuk</button></div>
      </form>
    </main>
  )
}
