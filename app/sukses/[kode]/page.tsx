import { db } from '@/lib/supabase'
import { LOKASI_NAMA, LOKASI_URL } from '@/lib/acara'
import { linkWA, pesanKonfirmasi } from '@/lib/pesan'
import { qrDataUrl } from '@/lib/qr'
import Topbar from '../../topbar'
import { IkonCek, IkonGrup, IkonInfo, IkonJam, IkonKalender, IkonKamera, IkonPeta, IkonScan, IkonTautan, IkonUnduh, IkonWA } from '../../icons'

export const dynamic = 'force-dynamic'

type Orang = { nama: string; kelompok: string; gender: string | null; checked_in_at: string | null }

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('id-ID', { ...o, timeZone: 'Asia/Makassar' }).format(new Date(iso))

const jam = (iso: string) => fmt(iso, { hour: '2-digit', minute: '2-digit' }).replace(':', '.')

export default async function Sukses({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params
  const sb = db()
  const { data: r } = await sb
    .from('registrations')
    .select('*, events(nama, tanggal, lokasi), peserta(nama, kelompok, gender, checked_in_at)')
    .eq('kode_daftar', kode)
    .single()

  if (!r) {
    return (
      <div className="shell">
        <Topbar />
        <main className="isi tiket-isi">
          <div className="err">Kode pendaftaran tidak ditemukan.</div>
          <a className="aksi-sekunder" href="/">Kembali ke pendaftaran</a>
        </main>
      </div>
    )
  }

  const status = r.status as 'terdaftar' | 'daftar_tunggu' | 'batal'
  const qr = status === 'terdaftar' ? await qrDataUrl(r.kode_daftar) : null
  const peserta = r.peserta as Orang[]
  const utama = peserta.findIndex((p) => p.nama === r.nama)
  const jumlah = peserta.length

  const judul = { terdaftar: 'Pendaftaran Berhasil!', daftar_tunggu: 'Masuk Daftar Tunggu', batal: 'Pendaftaran Dibatalkan' }[status]
  const subjudul = { terdaftar: 'E-Tiket Ibadah Natal 2026', daftar_tunggu: 'Kuota sedang penuh', batal: 'Tiket tidak berlaku' }[status]

  return (
    <div className="shell">
      <Topbar />

      <main className="isi tiket-isi">
        <section className={`sukses-banner ${status}`}>
          <div className="sukses-kepala">
            <span className="sukses-ikon"><IkonCek /></span>
            <div>
              <span className={`status-pil ${status}`}>{judul}</span>
              <h1>{subjudul}</h1>
            </div>
          </div>
          {qr && (
            <div className="sukses-saran">
              <IkonKamera />
              <p><b>Screenshot halaman ini</b> sekarang, atau simpan QR-nya, agar siap dipindai saat tiba di lokasi.</p>
            </div>
          )}
        </section>

        <article className={`tiket ${status}`}>
          <div className="tiket-atas">
            <span>✦ {r.events.nama.toUpperCase()} ✦</span>
          </div>

          <div className="tiket-badan">
            <div className="kode-kotak">
              <span className="kode-label">Kode Reservasi Check-In</span>
              <span className="kode-tiket">{r.kode_daftar}</span>
              <span className="kode-waktu">
                Terdaftar: {fmt(r.created_at, { day: 'numeric', month: 'short', year: 'numeric' })} · {jam(r.created_at)} WITA
              </span>
            </div>

            {qr ? (
              <div className="qr-bingkai">
                <div className="qr-area">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} width={220} height={220} alt={`QR check-in ${r.kode_daftar}`} />
                </div>
                <span className="qr-chip">1 QR untuk seluruh rombongan ({jumlah} orang)</span>
              </div>
            ) : (
              <div className={`tiket-catatan ${status}`}>
                <IkonJam />
                <p>
                  {status === 'daftar_tunggu'
                    ? 'Simpan kode ini. Panitia akan menghubungi lewat WhatsApp jika ada kursi kosong, dan QR check-in baru tersedia setelah Anda mendapat kursi.'
                    : 'Pendaftaran ini sudah dibatalkan, jadi tidak ada QR check-in. Hubungi panitia atau Gembala Komsel bila ini keliru.'}
                </p>
              </div>
            )}
          </div>

          <div className="sobekan" aria-hidden="true" />

          <div className="tiket-detail">
            <div className="detail-baris">
              <span className="detail-ikon magenta"><IkonKalender /></span>
              <div>
                <small>Hari &amp; Tanggal</small>
                <b>{fmt(r.events.tanggal, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b>
                <span className="detail-aksen">Pukul {jam(r.events.tanggal)} WITA</span>
              </div>
            </div>
            <div className="detail-baris">
              <span className="detail-ikon emas"><IkonPeta /></span>
              <div>
                <small>Lokasi Ibadah</small>
                <b>{r.events.lokasi || LOKASI_NAMA}</b>
                <a className="tautan-peta" href={LOKASI_URL} target="_blank" rel="noopener noreferrer">
                  Buka di Google Maps <IkonTautan />
                </a>
              </div>
            </div>
          </div>
        </article>

        <section className="kartu">
          <header className="rombongan-kepala">
            <div>
              <h2>Rombongan Terdaftar</h2>
              <p>
                {status === 'terdaftar' ? `Total ${jumlah} kursi dialokasikan` : `${jumlah} orang`} ({r.jml_dewasa} dewasa, {r.jml_anak} anak)
              </p>
            </div>
            <span className="jumlah-chip">{jumlah} Jiwa</span>
          </header>
          <ul className="rombongan">
            {peserta.map((p, i) => (
              <li key={i}>
                <span className={`urut ${i === utama ? 'utama' : ''}`}>{i + 1}</span>
                <div className="rombongan-nama">
                  <b>{p.nama}</b>
                  {i === utama && <em className="tanda utama">Utama</em>}
                  {p.kelompok === 'anak' && <em className="tanda anak">Anak</em>}
                  <small>
                    {p.gender === 'L' ? 'Laki-laki' : p.gender === 'P' ? 'Perempuan' : '—'} · {p.kelompok === 'anak' ? 'Anak (≤12 th)' : 'Dewasa (13+)'}
                  </small>
                </div>
                {status === 'terdaftar' && (
                  p.checked_in_at
                    ? <span className="hadir-chip sudah"><i />Hadir {jam(p.checked_in_at)}</span>
                    : <span className="hadir-chip"><i />Menunggu Hari-H</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="aksi-tiket">
          <a className="aksi-wa" href={linkWA(r.wa, pesanKonfirmasi(r, r.events))} target="_blank" rel="noopener noreferrer">
            <IkonWA /> Kirim kode ke WhatsApp saya
          </a>
          <div className="aksi-dua">
            {qr && (
              <a className="aksi-sekunder magenta" href={qr} download={`${r.kode_daftar}.png`}>
                <IkonUnduh /> Unduh QR
              </a>
            )}
            <a className="aksi-sekunder" href="/">
              <IkonGrup /> Daftar Lainnya
            </a>
          </div>
        </div>

        <section className="kartu petunjuk">
          <h2><IkonInfo /> Petunjuk Kehadiran</h2>
          <ul>
            <li><IkonScan /><span><b>Meja registrasi:</b> tunjukkan QR atau kode reservasi di atas kepada petugas untuk verifikasi cepat. Satu QR berlaku untuk seluruh rombongan.</span></li>
            <li><IkonJam /><span><b>Datang lebih awal:</b> ibadah dimulai pukul {jam(r.events.tanggal)} WITA dan hanya satu sesi.</span></li>
            <li><IkonInfo /><span><b>Perubahan data:</b> hubungi panitia atau Gembala Komsel Anda dengan menyebutkan kode {r.kode_daftar}.</span></li>
          </ul>
        </section>
      </main>

      <footer className="kaki">
        <b>GBI ROCK UBUD</b>
        <p>“Damai Sejahtera dan Sukacita Natal Kiranya Tinggal di Hati Kita Bersama.”</p>
      </footer>
    </div>
  )
}
