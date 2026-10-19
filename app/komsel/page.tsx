import { masukKomsel } from './actions'

export default async function Page({ searchParams }: { searchParams: Promise<{ salah?: string }> }) {
  const { salah } = await searchParams
  return (
    <main>
      <h1>Pendaftaran oleh Gembala Komsel</h1>
      <p className="sub">Untuk mendaftarkan banyak keluarga sekaligus, termasuk lansia yang tidak memakai HP.</p>
      {salah && <div className="err">Kode tidak valid. Format: KOM-01.</div>}
      <form action={masukKomsel} className="card">
        <label htmlFor="kode">Kode komsel</label>
        <input id="kode" name="kode" type="text" placeholder="KOM-01" autoCapitalize="characters" required />
        <div style={{ marginTop: 14 }}><button type="submit">Masuk</button></div>
      </form>
    </main>
  )
}
