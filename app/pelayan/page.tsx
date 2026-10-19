import { db } from '@/lib/supabase'
import { Hero } from '../hero'
import Topbar from '../topbar'
import { IkonInfo } from '../icons'
import FormPelayan from './form'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const sb = db()
  const { data: ev } = await sb.from('events').select('*').order('tanggal').limit(1).single()
  if (!ev) {
    return (
      <div className="shell"><Topbar /><main className="isi halaman-awal"><div className="err">Acara belum tersedia.</div></main></div>
    )
  }

  const { data: kuota } = await sb.from('v_kuota').select('*').eq('event_id', ev.id).single()
  const tutup = !ev.pendaftaran_dibuka || (ev.batas_daftar && new Date() > new Date(ev.batas_daftar))
  const terpakai = kuota?.terpakai_pelayan ?? 0
  const sisa = Math.max(0, ev.kuota_pelayan - terpakai)
  const terisi = ev.kuota_pelayan ? Math.min(100, Math.round((terpakai / ev.kuota_pelayan) * 100)) : 100

  return (
    <div className="shell">
      <Topbar chip={{ teks: tutup ? 'Pendaftaran Ditutup' : 'Pendaftaran Dibuka', jenis: tutup ? 'tutup' : 'buka' }} />
      <Hero kecil />
      <main className="isi">
        <section className="kartu kartu-acara">
          <span className="lencana">✦ Khusus pelayan ibadah</span>
          <h1>Pendaftaran Pelayan</h1>
          <p className="pengantar">{ev.nama}</p>
        </section>

        {tutup ? (
          <div className="err">Pendaftaran sudah ditutup.</div>
        ) : (
          <>
            <section className="kuota-kartu" aria-label="Kuota pelayan">
              <div className="kuota-atas"><b>Kursi pelayan</b><span className="kuota-max">{ev.kuota_pelayan} maks.</span></div>
              <div className="kuota-angka"><span className="kuota-n a">{sisa}</span> kursi sisa</div>
              <div className="bar" role="progressbar" aria-valuenow={terisi} aria-valuemin={0} aria-valuemax={100} aria-label="Kursi pelayan terisi">
                <div className="bar-isi a" style={{ width: `${terisi}%` }} />
              </div>
              <span className="kuota-ket">Terisi {terisi}%</span>
            </section>
            {sisa === 0 && (
              <div className="kuota-info penuh">
                <IkonInfo />
                <p>Kuota pelayan penuh. Pendaftaran Anda tetap diterima sebagai <b>Daftar Tunggu</b>.</p>
              </div>
            )}
            <FormPelayan eventId={ev.id} perluKode={!!process.env.KODE_PELAYAN} />
          </>
        )}
      </main>
    </div>
  )
}
