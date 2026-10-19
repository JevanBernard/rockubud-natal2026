import { db } from '@/lib/supabase'
import { linkWA, pesanKonfirmasi } from '@/lib/pesan'
import { Hero } from '../../hero'
import Topbar from '../../topbar'
import { IkonCek, IkonWA } from '../../icons'
import FormKomsel from './form'

export const dynamic = 'force-dynamic'

type Reg = {
  kode_daftar: string
  nama: string
  wa: string
  status: string
  peserta: { nama: string; kelompok: string }[]
}

const Kosong = ({ teks }: { teks: string }) => (
  <div className="shell"><Topbar /><main className="isi halaman-awal"><div className="err">{teks}</div></main></div>
)

export default async function Page({
  params, searchParams,
}: {
  params: Promise<{ kode: string }>
  searchParams: Promise<{ ok?: string }>
}) {
  const { kode } = await params
  const { ok } = await searchParams
  const sb = db()

  const { data: km } = await sb.from('komsel').select('id,nama,kode').eq('kode', kode.toUpperCase()).maybeSingle()
  if (!km) return <Kosong teks="Kode komsel tidak dikenal." />

  const { data: ev } = await sb.from('events').select('*').order('tanggal').limit(1).single()
  if (!ev) return <Kosong teks="Acara belum tersedia." />

  const tutup = !ev.pendaftaran_dibuka || (ev.batas_daftar && new Date() > new Date(ev.batas_daftar))

  const { data: daftar } = await sb
    .from('registrations')
    .select('kode_daftar, nama, wa, status, peserta(nama, kelompok)')
    .eq('event_id', ev.id)
    .eq('didaftarkan_oleh', km.kode)
    .neq('status', 'batal')
    .order('created_at')
  const regs = (daftar ?? []) as unknown as Reg[]

  return (
    <div className="shell lebar">
      <Topbar chip={{ teks: tutup ? 'Pendaftaran Ditutup' : 'Pendaftaran Dibuka', jenis: tutup ? 'tutup' : 'buka' }} />
      <Hero kecil />
      <main className="isi">
        <section className="kartu kartu-acara">
          <span className="lencana">✦ Pendaftaran oleh Gembala Komsel</span>
          <h1>Komsel {km.nama}</h1>
          <p className="pengantar">{ev.nama}</p>
        </section>

        {ok && <div className="pesan-ok" role="status"><IkonCek /> Berhasil mendaftarkan {ok} keluarga. Daftar lengkap ada di bawah.</div>}

        {tutup ? <div className="err">Pendaftaran sudah ditutup.</div> : <FormKomsel eventId={ev.id} kode={km.kode!} />}

        <section className="kartu">
          <header className="kartu-kepala kepala-baris">
            <div>
              <h2>Sudah didaftarkan</h2>
              <p>Kirim konfirmasi ke tiap keluarga lewat WhatsApp.</p>
            </div>
            <span className="jumlah-chip">{regs.length} keluarga</span>
          </header>
          {regs.length === 0 && <p className="kosong-teks">Belum ada.</p>}
          <ul className="daftar-keluarga">
            {regs.map((r) => (
              <li key={r.kode_daftar}>
                <div className="df-kepala">
                  <span className="kode-chip">{r.kode_daftar}</span>
                  <span className={`status-pil ${r.status === 'daftar_tunggu' ? 'daftar_tunggu' : ''}`}>
                    {r.status === 'daftar_tunggu' ? 'Daftar tunggu' : 'Terdaftar'}
                  </span>
                </div>
                <ul className="df-nama">
                  {r.peserta.map((p, i) => (
                    <li key={i}>{p.nama} <small>({p.kelompok})</small></li>
                  ))}
                </ul>
                <a className="aksi-wa kecil" href={linkWA(r.wa, pesanKonfirmasi(r, ev))} target="_blank" rel="noopener noreferrer">
                  <IkonWA /> Kirim ke WhatsApp ({r.wa})
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
