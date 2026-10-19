import { db } from '@/lib/supabase'
import Banner from '../banner'
import FormPelayan from './form'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const sb = db()
  const { data: ev } = await sb.from('events').select('*').order('tanggal').limit(1).single()
  if (!ev) return <main><p>Acara belum tersedia.</p></main>

  const { data: kuota } = await sb.from('v_kuota').select('*').eq('event_id', ev.id).single()
  const tutup = !ev.pendaftaran_dibuka || (ev.batas_daftar && new Date() > new Date(ev.batas_daftar))
  const sisa = Math.max(0, ev.kuota_pelayan - (kuota?.terpakai_pelayan ?? 0))

  return (
    <main>
      <Banner />
      <h1>Pendaftaran Pelayan</h1>
      <p className="sub">{ev.nama} · khusus pelayan ibadah</p>

      {tutup ? (
        <div className="err">Pendaftaran sudah ditutup.</div>
      ) : (
        <>
          <div className="quota">
            <div><b>{sisa}</b><span>sisa kursi pelayan</span></div>
          </div>
          {sisa === 0 && (
            <div className="note">
              Kuota pelayan penuh. Pendaftaran Anda tetap diterima sebagai <b>daftar tunggu</b>.
            </div>
          )}
          <FormPelayan eventId={ev.id} perluKode={!!process.env.KODE_PELAYAN} />
        </>
      )}
    </main>
  )
}
