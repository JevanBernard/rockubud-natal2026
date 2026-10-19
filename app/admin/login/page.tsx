import { redirect } from 'next/navigation'
import { adaAdmin } from '@/lib/admin'
import Topbar from '../../topbar'
import { IkonPanah } from '../../icons'
import { masuk } from '../actions'

export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  if (await adaAdmin()) redirect('/admin')
  const { err } = await searchParams
  return (
    <div className="shell">
      <Topbar chip={{ teks: 'Admin Portal', jenis: 'buka' }} />
      <main className="isi halaman-awal">
        <section className="kartu">
          <header className="kartu-kepala">
            <h2><span className="nomor">A</span> Admin Natal GBI ROCK Ubud</h2>
            <p>Masuk dengan kata sandi panitia.</p>
          </header>
          {err === 'salah' && <div className="err" role="alert">Kata sandi salah.</div>}
          {err === 'config' && <div className="err" role="alert">ADMIN_PASSWORD belum diisi di .env server.</div>}
          <form action={masuk}>
            <label htmlFor="password">Kata sandi</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
            <div className="aksi-kirim">
              <button type="submit" className="kirim">Masuk <IkonPanah /></button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
