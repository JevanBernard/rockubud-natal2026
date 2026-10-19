import { wajibAdmin } from '@/lib/admin'
import { ambilData, asal, rekap, type Reg } from '@/lib/admin-data'
import { LOKASI_NAMA } from '@/lib/acara'
import { linkWA, pesanKonfirmasi } from '@/lib/pesan'
import { IkonCari, IkonCek, IkonGrup, IkonHadir, IkonInfo, IkonKalender, IkonMakan, IkonPasir, IkonPeta, IkonQR, IkonScan, IkonSetelan, IkonSilang, IkonUnduh, IkonVerifikasi, IkonWA, IkonMenuBawah, IkonJam } from '../icons'
import { checkInDashboard, simpanPengaturan, ubahStatus } from './actions'
import AdminShell from './shell'
import TombolKonfirmasi from './tombol-konfirmasi'

export const dynamic = 'force-dynamic'

type SP = { q?: string; status?: string; kategori?: string; err?: string; ok?: string }

const LABEL = { terdaftar: 'Terdaftar', daftar_tunggu: 'Daftar Tunggu', batal: 'Batal' } as const

const WITA = 'Asia/Makassar'
const jam = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: WITA }).format(new Date(iso)).replace(':', '.')
const tglJam = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: WITA }).format(new Date(iso)) + ' · ' + jam(iso)

// "2026-12-20T09:00" dalam WITA untuk input datetime-local
const keInputWITA = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 8 * 3600_000).toISOString().slice(0, 16) : ''

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0)

function Kursi({ judul, label, pakai, kuota, warna }: { judul: string; label: string; pakai: number; kuota: number; warna: 'a' | 'b' | 'c' }) {
  const persen = pct(pakai, kuota)
  const sisa = Math.max(0, kuota - pakai)
  const tingkat = persen >= 100 ? 'penuh' : persen >= 85 ? 'hampir' : 'lega'
  return (
    <div className={`ad-kartu ad-kursi ${warna}`}>
      <div className="ad-kursi-atas">
        <span className="ad-kecil-kapital">{label}</span>
      </div>
      <h2>{judul}</h2>
      <div className="ad-kursi-angka">
        <b className="besar">{pakai}</b>
        <span>/ {kuota}</span>
        <em className={`ad-sisa ${tingkat}`}>{persen >= 100 ? 'Penuh' : `Sisa ${sisa}`}</em>
      </div>
      <div className="ad-bar" role="progressbar" aria-valuenow={Math.min(100, persen)} aria-valuemin={0} aria-valuemax={100} aria-label={`${judul} terisi`}>
        <div style={{ width: `${Math.min(100, persen)}%` }} />
      </div>
      <div className="ad-bar-ket"><span>Kapasitas terisi</span><b>{persen}%</b></div>
    </div>
  )
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  await wajibAdmin()
  const sp = await searchParams
  const data = await ambilData()
  if (!data) {
    return <AdminShell judul="Admin Portal"><p>Acara belum tersedia.</p></AdminShell>
  }
  const { ev, regs } = data
  const k = rekap(ev, regs)

  const terdaftar = regs.filter((r) => r.status === 'terdaftar')
  const totalOrang = terdaftar.reduce((a, r) => a + r.peserta.length, 0)
  const belum = Math.max(0, totalOrang - k.hadir)
  const persenHadir = pct(k.hadir, totalOrang)

  const q = (sp.q ?? '').trim().toLowerCase()
  const tampil = regs.filter((r) => {
    if (sp.status && r.status !== sp.status) return false
    if (sp.kategori && r.kategori !== sp.kategori) return false
    if (!q) return true
    return (
      r.kode_daftar.toLowerCase().includes(q) ||
      r.nama.toLowerCase().includes(q) ||
      r.wa.includes(q.replace(/\D/g, '') || '\0') ||
      asal(r).toLowerCase().includes(q) ||
      r.peserta.some((p) => p.nama.toLowerCase().includes(q))
    )
  })

  const params = new URLSearchParams()
  if (sp.q) params.set('q', sp.q)
  if (sp.status) params.set('status', sp.status)
  if (sp.kategori) params.set('kategori', sp.kategori)
  const balik = '/admin' + (params.size ? `?${params}` : '')

  const FormStatus = ({ r, status, children, paksa, tanya, kelas }: { r: Reg; status: string; children: React.ReactNode; paksa?: boolean; tanya?: string; kelas: string }) => (
    <form action={ubahStatus}>
      <input type="hidden" name="id" value={r.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="balik" value={balik} />
      {paksa && <input type="hidden" name="paksa" value="1" />}
      {tanya
        ? <TombolKonfirmasi tanya={tanya} className={kelas}>{children}</TombolKonfirmasi>
        : <button type="submit" className={kelas}>{children}</button>}
    </form>
  )

  const buka = ev.pendaftaran_dibuka && !(ev.batas_daftar && new Date() > new Date(ev.batas_daftar))
  const tanggalPanjang = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: WITA }).format(new Date(ev.tanggal))

  return (
    <AdminShell judul={ev.nama} buka={buka}>
      <section className="ad-hero">
        <div className="ad-hero-teks">
          <div className="ad-hero-chip">
            <span className="ad-chip-magenta">Natal GBI ROCK Ubud</span>
            <span className="ad-chip-putih"><IkonJam /> Zona waktu WITA (UTC+8)</span>
          </div>
          <h1>Dashboard Admin Registrasi &amp; Operasional</h1>
          <p>
            <span><IkonKalender /> {tanggalPanjang}</span>
            <span><IkonJam /> Pukul {jam(ev.tanggal)} WITA</span>
            <span><IkonPeta /> {ev.lokasi || LOKASI_NAMA}</span>
          </p>
        </div>
        <div className="ad-hero-aksi">
          <a href="/admin/scan" className="ad-btn utama"><IkonScan /> Buka Scanner QR</a>
          <details className="ad-menu">
            <summary className="ad-btn putih"><IkonUnduh /> Ekspor &amp; Cetak <IkonMenuBawah /></summary>
            <div className="ad-menu-isi">
              <a href="/admin/export" download><b>Export Excel (.xlsx)</b><small>Rekap 4 sheet terpadu</small></a>
              <a href="/admin/export-pdf" download><b>Cetak PDF Presensi</b><small>Daftar hadir &amp; daftar tunggu</small></a>
            </div>
          </details>
        </div>
      </section>

      {sp.err && <div className="ad-pesan err" role="alert"><IkonSilang />{sp.err}</div>}
      {sp.ok && <div className="ad-pesan ok" role="status"><IkonCek />{sp.ok}</div>}

      <details className="ad-kartu ad-setelan">
        <summary>
          <span className="ad-setelan-ikon"><IkonSetelan /></span>
          <span><b>Pengaturan pendaftaran</b><small>Buka/tutup form publik dan atur batas waktu.</small></span>
          <span className={`ad-status ${ev.pendaftaran_dibuka ? 'ok' : 'wait'}`}>{ev.pendaftaran_dibuka ? 'Dibuka' : 'Ditutup'}</span>
        </summary>
        <form action={simpanPengaturan} className="ad-setelan-form">
          <input type="hidden" name="event_id" value={ev.id} />
          <label className="ad-sakelar">
            <input type="checkbox" name="pendaftaran_dibuka" defaultChecked={ev.pendaftaran_dibuka} />
            <span>Pendaftaran dibuka</span>
          </label>
          <div className="ad-medan">
            <label htmlFor="batas">Batas akhir pendaftaran (WITA)</label>
            <input id="batas" name="batas_daftar" type="datetime-local" className="ad-in" defaultValue={keInputWITA(ev.batas_daftar)} />
            <small>Kosongkan jika belum ditentukan.</small>
          </div>
          <button type="submit" className="ad-btn utama"><IkonCek /> Simpan perubahan</button>
        </form>
      </details>

      <section className="ad-grid3" aria-label="Kuota kursi">
        <Kursi label="Kategori ibadah · 13+ tahun" judul="Kursi Dewasa" pakai={k.umumDewasa} kuota={ev.kuota_dewasa} warna="a" />
        <Kursi label="Anak · ≤ 12 tahun" judul="Kursi Anak-Anak" pakai={k.umumAnak} kuota={ev.kuota_anak} warna="b" />
        <Kursi label="Tim pelayanan" judul="Pelayan Ibadah" pakai={k.pelayan} kuota={ev.kuota_pelayan} warna="c" />
      </section>

      <section className="ad-dua">
        <div className="ad-kartu ad-konsumsi">
          <header>
            <span className="ad-ikon-emas"><IkonMakan /></span>
            <div>
              <h3>Kalkulasi Katering &amp; Konsumsi</h3>
              <p>1 menu tetap + cadangan {ev.cadangan_konsumsi_persen}% otomatis</p>
            </div>
          </header>
          <div className="ad-konsumsi-grid">
            <div className="ad-kotak">
              <small>Porsi terdaftar</small>
              <b>{k.porsi} <i>porsi</i></b>
              <span>{k.umumDewasa} dws + {k.umumAnak} ank + {k.pelayan} ply</span>
            </div>
            <div className="ad-kotak">
              <small>Cadangan (+{ev.cadangan_konsumsi_persen}%)</small>
              <b className="emas">+{k.cadangan} <i>porsi</i></b>
              <span>Dibulatkan ke atas</span>
            </div>
            <div className="ad-kotak final">
              <small>Total pesanan katering</small>
              <b>{k.totalPorsi} <i>porsi</i></b>
              <span>Hanya hitungan status Terdaftar</span>
            </div>
          </div>
        </div>

        <div className="ad-kartu ad-presensi">
          <header>
            <div>
              <h3>Ringkasan Presensi Hari-H</h3>
              <p>Progres kedatangan di lokasi</p>
            </div>
            <div className="ad-presensi-angka"><b>{k.hadir}</b><span>/ {totalOrang} orang</span></div>
          </header>
          <div className="ad-presensi-isi">
            <div className="ad-donat" role="img" aria-label={`${persenHadir}% sudah hadir`}>
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" className="alas" />
                <circle cx="18" cy="18" r="15.9155" className="isi" strokeDasharray={`${persenHadir}, 100`} />
              </svg>
              <b>{persenHadir}%</b>
            </div>
            <ul>
              <li><span><i className="hijau" /> Sudah check-in</span><b>{k.hadir} orang</b></li>
              <li><span><i className="abu" /> Belum hadir</span><b>{belum} orang</b></li>
              <li className="amber"><span><i className="emas" /> Daftar tunggu</span><b>{k.tungguOrang} orang ({k.jumlahTunggu} pendaftaran)</b></li>
            </ul>
          </div>
          <footer>
            <span><IkonGrup /> Pendaftaran terdaftar: <b>{k.jumlahTerdaftar}</b></span>
            <span className="merah"><IkonSilang /> Batal: <b>{k.jumlahBatal}</b></span>
          </footer>
        </div>
      </section>

      <section className="ad-kartu ad-data">
        <form method="get" className="ad-filter" role="search">
          <div className="ad-cari">
            <IkonCari />
            <input type="text" name="q" className="ad-in" placeholder="Cari kode tiket, nama, nomor WA, atau komsel…" defaultValue={sp.q ?? ''} aria-label="Cari pendaftaran" />
          </div>
          <select name="status" className="ad-in" defaultValue={sp.status ?? ''} aria-label="Filter status">
            <option value="">Semua status</option>
            <option value="terdaftar">Terdaftar</option>
            <option value="daftar_tunggu">Daftar tunggu</option>
            <option value="batal">Batal</option>
          </select>
          <select name="kategori" className="ad-in" defaultValue={sp.kategori ?? ''} aria-label="Filter kategori">
            <option value="">Semua kategori</option>
            <option value="jemaat">Jemaat</option>
            <option value="tamu">Tamu</option>
            <option value="pelayan">Pelayan</option>
          </select>
          <button type="submit" className="ad-btn utama">Cari</button>
          {(sp.q || sp.status || sp.kategori) && <a href="/admin" className="ad-btn abu">Reset</a>}
        </form>

        <p className="ad-hitung">
          Menampilkan <b>{tampil.length}</b> dari <b>{regs.length}</b> pendaftaran
        </p>

        <div className="ad-gulir">
          <table className="ad-tabel">
            <thead>
              <tr><th>Kode &amp; waktu</th><th>Pendaftar &amp; anggota</th><th>Asal</th><th className="tengah">Kursi</th><th className="tengah">Status</th><th className="kanan">Aksi</th></tr>
            </thead>
            <tbody>
              {tampil.length === 0 && (
                <tr><td colSpan={6} className="kosong">Tidak ada pendaftaran yang cocok.</td></tr>
              )}
              {tampil.map((r) => {
                const hadir = r.peserta.filter((p) => p.checked_in_at).length
                const semua = r.peserta.length
                const pelayan = r.kategori === 'pelayan'
                return (
                  <tr key={r.id} className={r.status === 'batal' ? 'batal' : r.status === 'daftar_tunggu' ? 'tunggu' : ''}>
                    <td>
                      <span className={`ad-kode ${pelayan ? 'ply' : r.status === 'daftar_tunggu' ? 'tgg' : ''}`}>{r.kode_daftar}</span>
                      <small className="ad-redup">{tglJam(r.created_at)}</small>
                    </td>
                    <td>
                      <details className="ad-anggota">
                        <summary>
                          <b>{r.nama}</b>
                          {semua > 1 && <em>+{semua - 1} orang</em>}
                        </summary>
                        {r.status === 'terdaftar' ? (
                          <form action={checkInDashboard} className="ad-ci">
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="balik" value={balik} />
                            {r.peserta.map((p) => (
                              <label key={p.id}>
                                <input type="checkbox" name="pid" value={p.id} defaultChecked={!p.checked_in_at} />
                                <span>
                                  {p.nama} <small className="ad-redup">({p.kelompok}{p.gender ? `, ${p.gender}` : ''})</small>
                                  {p.checked_in_at && <span className="ad-status ok kecil">hadir {jam(p.checked_in_at)}</span>}
                                </span>
                              </label>
                            ))}
                            <div className="ad-baris">
                              <button type="submit" name="mode" value="masuk" className="ad-btn utama kecil">Check-in yang dicentang</button>
                              <button type="submit" name="mode" value="batal" className="ad-btn abu kecil">Batalkan check-in</button>
                            </div>
                          </form>
                        ) : (
                          <ul className="ad-daftar">
                            {r.peserta.map((p) => (
                              <li key={p.id}>{p.nama} <small className="ad-redup">({p.kelompok}{p.gender ? `, ${p.gender}` : ''})</small></li>
                            ))}
                          </ul>
                        )}
                      </details>
                      <small className="ad-redup">{r.wa}</small>
                    </td>
                    <td>
                      <span className={`ad-asal ${pelayan ? 'ply' : r.kategori === 'tamu' ? 'tamu' : ''}`}>{asal(r)}</span>
                      {r.didaftarkan_oleh !== 'mandiri' && <small className="ad-redup">via {r.didaftarkan_oleh}</small>}
                    </td>
                    <td className="tengah">
                      <div className="ad-kursi-chip">
                        {pelayan
                          ? <span className="ply">{r.jml_dewasa} Ply</span>
                          : <><span>{r.jml_dewasa} Dws</span><span className="ank">{r.jml_anak} Ank</span></>}
                      </div>
                      <small className="ad-redup">{r.jml_dewasa + r.jml_anak} orang</small>
                    </td>
                    <td className="tengah">
                      <span className={`ad-status ${r.status === 'terdaftar' ? 'ok' : r.status === 'daftar_tunggu' ? 'wait' : 'err'}`}>{LABEL[r.status]}</span>
                      {r.status === 'terdaftar' && (
                        <small className={`ad-hadir ${hadir === semua && semua > 0 ? 'penuh' : hadir > 0 ? 'sebagian' : ''}`}>Hadir {hadir}/{semua}</small>
                      )}
                    </td>
                    <td className="kanan">
                      <div className="ad-aksi">
                        <a className="ad-ikon-btn wa" target="_blank" rel="noopener noreferrer" title="Kirim konfirmasi lewat WhatsApp"
                          aria-label={`Kirim WhatsApp ke ${r.nama}`} href={linkWA(r.wa, pesanKonfirmasi(r, ev))}><IkonWA /></a>
                        {r.status === 'terdaftar' && (
                          <details className="ad-qr">
                            <summary className="ad-ikon-btn" title="Lihat QR" aria-label={`QR ${r.kode_daftar}`}><IkonQR /></summary>
                            <div className="ad-qr-kotak">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`/admin/qr/${r.kode_daftar}`} alt={`QR ${r.kode_daftar}`} width={180} height={180} loading="lazy" />
                              <b>{r.kode_daftar}</b>
                              <a href={`/admin/qr/${r.kode_daftar}`} download={`${r.kode_daftar}.png`}>Unduh PNG</a>
                              <a href={`/sukses/${r.kode_daftar}`} target="_blank" rel="noopener noreferrer">Halaman tiket</a>
                            </div>
                          </details>
                        )}
                        {r.status === 'terdaftar' && r.peserta.some((p) => !p.checked_in_at) && (
                          <form action={checkInDashboard}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="balik" value={balik} />
                            <input type="hidden" name="mode" value="masuk" />
                            {r.peserta.filter((p) => !p.checked_in_at).map((p) => (
                              <input key={p.id} type="hidden" name="pid" value={p.id} />
                            ))}
                            <button type="submit" className="ad-btn utama kecil"><IkonHadir /> Check-in semua</button>
                          </form>
                        )}
                        {r.status === 'terdaftar' && r.peserta.length > 0 && hadir === semua && (
                          <span className="ad-tuntas"><IkonVerifikasi /> Tuntas</span>
                        )}
                        {r.status === 'daftar_tunggu' && <>
                          <FormStatus r={r} status="terdaftar" kelas="ad-btn hijau kecil"><IkonCek /> Terima</FormStatus>
                          <FormStatus r={r} status="terdaftar" paksa kelas="ad-btn abu kecil"
                            tanya={`Terima ${r.kode_daftar} dengan MENGABAIKAN kuota? Kursi bisa melebihi batas.`}>Abaikan kuota</FormStatus>
                        </>}
                        {r.status === 'terdaftar' && (
                          <FormStatus r={r} status="batal" kelas="ad-btn bahaya kecil"
                            tanya={`Batalkan pendaftaran ${r.kode_daftar} (${r.nama})? Kursinya dikembalikan ke kuota dan QR tidak berlaku.`}>Batalkan</FormStatus>
                        )}
                        {r.status === 'batal' && <FormStatus r={r} status="terdaftar" kelas="ad-btn abu kecil"><IkonPasir /> Aktifkan lagi</FormStatus>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="ad-catatan"><IkonInfo /> Semua pendaftaran ditampilkan dalam satu halaman. Pakai kolom cari untuk menyaring.</p>
      </section>
    </AdminShell>
  )
}
