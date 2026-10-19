import { db } from '@/lib/supabase'
import { linkWA, pesanKonfirmasi } from '@/lib/pesan'
import Banner from '../../banner'
import FormKomsel from './form'

export const dynamic = 'force-dynamic'

type Reg = {
  kode_daftar: string
  nama: string
  wa: string
  status: string
  peserta: { nama: string; kelompok: string }[]
}

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
  if (!km) return <main><p>Kode komsel tidak dikenal.</p></main>

  const { data: ev } = await sb.from('events').select('*').order('tanggal').limit(1).single()
  if (!ev) return <main><p>Acara belum tersedia.</p></main>

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
    <main>
      <Banner />
      <h1>Komsel {km.nama}</h1>
      <p className="sub">{ev.nama} · pendaftaran oleh Gembala Komsel</p>

      {ok && <div className="note">Berhasil mendaftarkan {ok} keluarga. Daftar lengkap ada di bawah.</div>}

      {tutup ? (
        <div className="err">Pendaftaran sudah ditutup.</div>
      ) : (
        <FormKomsel eventId={ev.id} kode={km.kode!} />
      )}

      <div className="card">
        <h2>Sudah didaftarkan ({regs.length} keluarga)</h2>
        {regs.length === 0 && <p className="sub">Belum ada.</p>}
        {regs.map((r) => (
          <div key={r.kode_daftar} className="person">
            <b>{r.kode_daftar}</b>{' '}
            <span className={`badge ${r.status === 'daftar_tunggu' ? 'wait' : 'ok'}`}>
              {r.status === 'daftar_tunggu' ? 'Daftar tunggu' : 'Terdaftar'}
            </span>
            <ul className="names">
              {r.peserta.map((p, i) => (
                <li key={i}>{p.nama} <span className="sub">({p.kelompok})</span></li>
              ))}
            </ul>
            <a href={linkWA(r.wa, pesanKonfirmasi(r, ev))} target="_blank" rel="noopener noreferrer"
              className="btn ghost" style={{ marginTop: 8 }}>
              Kirim ke WhatsApp ({r.wa})
            </a>
          </div>
        ))}
      </div>
    </main>
  )
}
