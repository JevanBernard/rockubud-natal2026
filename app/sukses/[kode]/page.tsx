import { db } from '@/lib/supabase'
import { linkWA, pesanKonfirmasi } from '@/lib/pesan'
import { qrDataUrl } from '@/lib/qr'

export const dynamic = 'force-dynamic'

export default async function Sukses({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params
  const sb = db()
  const { data: r } = await sb
    .from('registrations')
    .select('*, events(nama, tanggal, lokasi), peserta(nama, kelompok, gender)')
    .eq('kode_daftar', kode)
    .single()

  if (!r) return <main><p>Kode pendaftaran tidak ditemukan.</p></main>

  const tunggu = r.status === 'daftar_tunggu'
  const qr = tunggu || r.status === 'batal' ? null : await qrDataUrl(r.kode_daftar)
  const tanggal = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar',
  }).format(new Date(r.events.tanggal))

  return (
    <main>
      <div className="card">
        <p style={{ margin: 0, textAlign: 'center' }}>
          <span className={`badge ${tunggu ? 'wait' : 'ok'}`}>
            {tunggu ? 'Daftar tunggu' : 'Pendaftaran berhasil'}
          </span>
        </p>
        {qr && (
          <p style={{ textAlign: 'center', margin: '12px 0 0' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={220} height={220} alt={`QR check-in ${r.kode_daftar}`} />
          </p>
        )}
        <div className="kode">{r.kode_daftar}</div>
        <p className="sub" style={{ textAlign: 'center' }}>
          {qr
            ? 'Tunjukkan QR ini saat check-in (screenshot halaman ini). Satu QR untuk seluruh rombongan.'
            : 'Simpan kode ini. QR check-in akan tersedia jika Anda mendapat kursi.'}
        </p>
        {tunggu && (
          <div className="note">
            Kuota sedang penuh. Panitia akan menghubungi lewat WhatsApp jika ada kursi kosong.
          </div>
        )}
        <table>
          <tbody>
            <tr><td>Acara</td><td>{r.events.nama}</td></tr>
            <tr><td>Waktu</td><td>{tanggal} WITA</td></tr>
            <tr><td>Nama</td><td>{r.nama}</td></tr>
            <tr><td>Dewasa</td><td>{r.jml_dewasa}</td></tr>
            <tr><td>Anak</td><td>{r.jml_anak}</td></tr>
          </tbody>
        </table>
        <h2 style={{ marginTop: 16 }}>Yang hadir</h2>
        <ul>
          {r.peserta.map((p: { nama: string; kelompok: string; gender: string | null }, i: number) => (
            <li key={i}>{p.nama} <span className="sub">({p.kelompok}{p.gender ? `, ${p.gender === 'L' ? 'laki-laki' : 'perempuan'}` : ''})</span></li>
          ))}
        </ul>
        <a href={linkWA(r.wa, pesanKonfirmasi(r, r.events))} target="_blank" rel="noopener noreferrer"
          className="btn" style={{ marginTop: 14 }}>
          Kirim kode ke WhatsApp saya
        </a>
      </div>
    </main>
  )
}
