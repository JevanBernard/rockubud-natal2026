import { db } from '@/lib/supabase'
import { CATATAN, LOKASI_NAMA, LOKASI_URL, PENGANTAR } from '@/lib/acara'
import { Hero, Logo } from './hero'
import { IkonInfo, IkonKalender, IkonPeta, IkonTautan } from './icons'
import Form from './form'

export const dynamic = 'force-dynamic'

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('id-ID', { ...o, timeZone: 'Asia/Makassar' }).format(new Date(iso))

function Kuota({ judul, sisa, total, warna }: { judul: string; sisa: number; total: number; warna: 'a' | 'b' }) {
  const terisi = total ? Math.min(100, Math.round(((total - sisa) / total) * 100)) : 100
  return (
    <div className="kuota-kartu">
      <div className="kuota-atas">
        <b>{judul}</b>
        <span className="kuota-max">{total} maks.</span>
      </div>
      <div className="kuota-angka">
        <span className={`kuota-n ${warna}`}>{sisa}</span> kursi sisa
      </div>
      <div className="bar" role="progressbar" aria-valuenow={terisi} aria-valuemin={0} aria-valuemax={100} aria-label={`${judul} terisi`}>
        <div className={`bar-isi ${warna}`} style={{ width: `${terisi}%` }} />
      </div>
      <span className="kuota-ket">Terisi {terisi}%</span>
    </div>
  )
}

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
    <div className="shell">
      <header className="topbar">
        <div className="topbar-merek">
          <Logo />
          <span>GBI ROCK UBUD</span>
        </div>
        <span className={`status-chip ${tutup ? 'tutup' : 'buka'}`}>
          <i />{tutup ? 'Pendaftaran Ditutup' : 'Pendaftaran Dibuka'}
        </span>
      </header>

      <Hero />

      <main className="isi">
        <section className="kartu kartu-acara">
          <span className="lencana">✦ Ibadah Natal 2026</span>
          <h1>{ev.nama}</h1>
          <p className="pengantar">{PENGANTAR}</p>

          <div className="info-baris">
            <span className="info-ikon magenta"><IkonKalender /></span>
            <div>
              <b>{fmt(ev.tanggal, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b>
              <span>Pukul {fmt(ev.tanggal, { hour: '2-digit', minute: '2-digit' }).replace(':', '.')} WITA</span>
            </div>
          </div>
          <div className="info-baris">
            <span className="info-ikon emas"><IkonPeta /></span>
            <div>
              <b>{ev.lokasi || LOKASI_NAMA}</b>
              <a href={LOKASI_URL} target="_blank" rel="noopener noreferrer">
                Buka di Google Maps <IkonTautan />
              </a>
            </div>
          </div>

          <details className="catatan-lipat">
            <summary>
              <IkonInfo /> {CATATAN.length} Informasi Penting Ibadah
              <span className="panah" aria-hidden="true">▾</span>
            </summary>
            <ul>{CATATAN.map((c) => <li key={c}>{c}</li>)}</ul>
          </details>
        </section>

        {tutup ? (
          <div className="err">Pendaftaran sudah ditutup.</div>
        ) : (
          <>
            <section aria-label="Ketersediaan kuota kursi">
              <div className="judul-kecil">
                <h2><i /> Ketersediaan Kuota Kursi</h2>
                <span>Terbaru saat halaman dibuka</span>
              </div>
              <div className="kuota-grid">
                <Kuota judul="Dewasa (13+)" sisa={sisaDewasa} total={ev.kuota_dewasa} warna="a" />
                <Kuota judul="Anak (≤12)" sisa={sisaAnak} total={ev.kuota_anak} warna="b" />
              </div>
              <div className={`kuota-info ${penuh ? 'penuh' : ''}`}>
                <IkonInfo />
                <p>
                  {penuh
                    ? <>Kuota salah satu kategori sudah penuh. Pendaftaran Anda tetap diterima sebagai <b>Daftar Tunggu</b>; panitia akan menghubungi jika ada kursi kosong.</>
                    : <>Jika kuota habis, pendaftaran Anda tetap diterima dengan status <b>Daftar Tunggu</b>.</>}
                </p>
              </div>
            </section>

            <Form eventId={ev.id} komsel={komsel ?? []} />
          </>
        )}

        <section className="jalur-khusus">
          <p>Pendaftaran Khusus Internal</p>
          <div>
            <a href="/pelayan">Jalur Pelayan Ibadah</a>
            <a href="/komsel">Jalur Gembala Komsel</a>
          </div>
        </section>
      </main>

      <footer className="kaki">
        <b>GBI ROCK UBUD</b>
        <p>“Damai Sejahtera dan Sukacita Natal Kiranya Tinggal di Hati Kita Bersama.”</p>
      </footer>
    </div>
  )
}
