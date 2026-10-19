import Topbar from '../topbar'
import { IkonGereja, IkonPanah } from '../icons'
import { masukKomsel } from './actions'

export default async function Page({ searchParams }: { searchParams: Promise<{ salah?: string }> }) {
  const { salah } = await searchParams
  return (
    <div className="shell">
      <Topbar />
      <main className="isi halaman-awal">
        <section className="kartu">
          <header className="kartu-kepala">
            <h2><span className="nomor"><IkonGereja /></span> Pendaftaran oleh Gembala Komsel</h2>
            <p>Untuk mendaftarkan banyak keluarga sekaligus, termasuk lansia yang tidak memakai HP.</p>
          </header>
          {salah && <div className="err" role="alert">Kode tidak valid. Format: KOM-01.</div>}
          <form action={masukKomsel}>
            <label htmlFor="kode">Kode komsel</label>
            <input id="kode" name="kode" type="text" placeholder="KOM-01" autoCapitalize="characters"
              autoComplete="off" spellCheck={false} required />
            <div className="aksi-kirim">
              <button type="submit" className="kirim">Masuk <IkonPanah /></button>
            </div>
          </form>
        </section>
        <a className="aksi-sekunder" href="/">Kembali ke pendaftaran umum</a>
      </main>
    </div>
  )
}
