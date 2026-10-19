import { db } from '@/lib/supabase'
import Form from './form'

export const dynamic = 'force-dynamic'

const fmtTanggal = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar',
  }).format(new Date(iso)) + ' WITA'

export default async function Page() {
  const sb = db()
  const { data: ev } = await sb.from('events').select('*').order('tanggal').limit(1).single()
  if (!ev) return <main><p>Acara belum tersedia.</p></main>

  const { data: kuota } = await sb.from('v_kuota').select('*').eq('event_id', ev.id).single()
  const { data: komsel } = await sb.from('komsel').select('id,nama').order('urutan')

  const tutup =
    !ev.pendaftaran_dibuka || (ev.batas_daftar && new Date() > new Date(ev.batas_daftar))
  const sisaDewasa = Math.max(0, ev.kuota_dewasa - (kuota?.terpakai_dewasa ?? 0))
  const sisaAnak = Math.max(0, ev.kuota_anak - (kuota?.terpakai_anak ?? 0))
  const penuh = sisaDewasa === 0 || sisaAnak === 0

  return (
    <main>
      <h1>{ev.nama}</h1>
      <p className="sub">
        GBI ROCK Ubud · {fmtTanggal(ev.tanggal)}
        {ev.lokasi ? ` · ${ev.lokasi}` : ''}
      </p>

      {tutup ? (
        <div className="err">Pendaftaran sudah ditutup.</div>
      ) : (
        <>
          <div className="quota">
            <div><b>{sisaDewasa}</b><span>sisa kursi dewasa</span></div>
            <div><b>{sisaAnak}</b><span>sisa kursi anak</span></div>
          </div>
          {penuh && (
            <div className="note">
              Kuota sudah penuh untuk salah satu kategori. Pendaftaran Anda tetap diterima
              sebagai <b>daftar tunggu</b> dan panitia akan menghubungi jika ada kursi kosong.
            </div>
          )}
          <Form eventId={ev.id} komsel={komsel ?? []} />
        </>
      )}
    </main>
  )
}
