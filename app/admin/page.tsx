import { wajibAdmin } from '@/lib/admin'
import { ambilData, asal, rekap, type Reg } from '@/lib/admin-data'
import { linkWA, pesanKonfirmasi } from '@/lib/pesan'
import { checkInDashboard, keluar, simpanPengaturan, ubahStatus } from './actions'

export const dynamic = 'force-dynamic'

type SP = { q?: string; status?: string; kategori?: string; err?: string; ok?: string }

const LABEL = { terdaftar: 'Terdaftar', daftar_tunggu: 'Daftar tunggu', batal: 'Batal' } as const

// "2026-12-20T09:00" dalam WITA untuk input datetime-local
const jam = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: 'Asia/Makassar' }).format(new Date(iso))

const keInputWITA = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 8 * 3600_000).toISOString().slice(0, 16) : ''

function Bar({ label, pakai, kuota }: { label: string; pakai: number; kuota: number }) {
  const persen = kuota ? Math.min(100, Math.round((pakai / kuota) * 100)) : 0
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <b>{label}</b>
      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
        {pakai}<span className="sub" style={{ fontSize: '.9rem' }}> / {kuota}</span>
      </div>
      <div style={{ height: 6, background: 'var(--line)', borderRadius: 3 }}>
        <div style={{ width: `${persen}%`, height: 6, borderRadius: 3, background: persen >= 100 ? 'var(--accent)' : 'var(--ok)' }} />
      </div>
    </div>
  )
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  await wajibAdmin()
  const sp = await searchParams
  const data = await ambilData()
  if (!data) return <main className="wide"><p>Acara belum tersedia.</p></main>
  const { ev, regs } = data
  const k = rekap(ev, regs)

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

  const Tombol = ({ r, status, label, paksa }: { r: Reg; status: string; label: string; paksa?: boolean }) => (
    <form action={ubahStatus} style={{ display: 'inline' }}>
      <input type="hidden" name="id" value={r.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="balik" value={balik} />
      {paksa && <input type="hidden" name="paksa" value="1" />}
      <button type="submit" className="ghost mini">{label}</button>
    </form>
  )

  return (
    <main className="wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <h1>Dashboard admin</h1>
          <p className="sub" style={{ marginBottom: 8 }}>{ev.nama}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin/scan" className="btn mini">Check-in</a>
          <a href="/admin/export" className="btn mini" download>Unduh Excel</a>
          <a href="/admin/export-pdf" className="btn mini" download>Unduh PDF</a>
          <form action={keluar}><button type="submit" className="ghost mini">Keluar</button></form>
        </div>
      </div>

      {sp.err && <div className="err">{sp.err}</div>}
      {sp.ok && <div className="note">{sp.ok}</div>}

      <div className="grid3">
        <Bar label="Kursi dewasa" pakai={k.umumDewasa} kuota={ev.kuota_dewasa} />
        <Bar label="Kursi anak" pakai={k.umumAnak} kuota={ev.kuota_anak} />
        <Bar label="Pelayan" pakai={k.pelayan} kuota={ev.kuota_pelayan} />
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Ringkasan</h2>
        <table className="tbl">
          <tbody>
            <tr><td>Pendaftaran terdaftar</td><td>{k.jumlahTerdaftar}</td></tr>
            <tr><td>Daftar tunggu</td><td>{k.jumlahTunggu} pendaftaran ({k.tungguOrang} orang)</td></tr>
            <tr><td>Batal</td><td>{k.jumlahBatal}</td></tr>
            <tr><td>Konsumsi: porsi + cadangan {ev.cadangan_konsumsi_persen}%</td><td>{k.porsi} + {k.cadangan} = <b>{k.totalPorsi}</b></td></tr>
            <tr><td>Sudah check-in</td><td>{k.hadir} orang</td></tr>
          </tbody>
        </table>
      </div>

      <details className="card">
        <summary><b>Pengaturan pendaftaran</b>{' '}
          <span className={`badge ${ev.pendaftaran_dibuka ? 'ok' : 'wait'}`}>{ev.pendaftaran_dibuka ? 'Dibuka' : 'Ditutup'}</span>
        </summary>
        <form action={simpanPengaturan} style={{ marginTop: 12 }}>
          <input type="hidden" name="event_id" value={ev.id} />
          <label className="check">
            <input type="checkbox" name="pendaftaran_dibuka" defaultChecked={ev.pendaftaran_dibuka} />
            <span>Pendaftaran dibuka</span>
          </label>
          <label htmlFor="batas">Batas akhir pendaftaran (WITA, kosongkan jika belum ditentukan)</label>
          <input id="batas" name="batas_daftar" type="datetime-local" defaultValue={keInputWITA(ev.batas_daftar)}
            style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: '1rem' }} />
          <div style={{ marginTop: 12, maxWidth: 220 }}><button type="submit">Simpan</button></div>
        </form>
      </details>

      <form method="get" className="card filter">
        <input type="text" name="q" placeholder="Cari kode, nama, WA, komsel…" defaultValue={sp.q ?? ''} />
        <select name="status" defaultValue={sp.status ?? ''}>
          <option value="">Semua status</option>
          <option value="terdaftar">Terdaftar</option>
          <option value="daftar_tunggu">Daftar tunggu</option>
          <option value="batal">Batal</option>
        </select>
        <select name="kategori" defaultValue={sp.kategori ?? ''}>
          <option value="">Semua kategori</option>
          <option value="jemaat">Jemaat</option>
          <option value="tamu">Tamu</option>
          <option value="pelayan">Pelayan</option>
        </select>
        <button type="submit" style={{ width: 'auto', padding: '10px 18px' }}>Cari</button>
      </form>

      <p className="sub">{tampil.length} dari {regs.length} pendaftaran</p>
      <div className="scroll">
        <table className="tbl">
          <thead>
            <tr><th>Kode</th><th>Pendaftar</th><th>Asal</th><th>Dewasa / Anak</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {tampil.map((r) => (
              <tr key={r.id} style={r.status === 'batal' ? { opacity: 0.55 } : undefined}>
                <td><b>{r.kode_daftar}</b><br /><span className="sub">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Makassar' }).format(new Date(r.created_at))}</span></td>
                <td>
                  <details>
                    <summary>{r.nama}{r.peserta.length > 1 ? ` +${r.peserta.length - 1}` : ''}</summary>
                    {r.status === 'terdaftar' ? (
                      // Daftar orang + check-in per orang tanpa membuka menu scan
                      <form action={checkInDashboard} className="ci">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="balik" value={balik} />
                        {r.peserta.map((p) => (
                          <label key={p.id} className="check">
                            <input type="checkbox" name="pid" value={p.id} defaultChecked={!p.checked_in_at} />
                            <span>
                              {p.nama} <span className="sub">({p.kelompok}{p.gender ? `, ${p.gender}` : ''})</span>
                              {p.checked_in_at && <span className="badge ok" style={{ marginLeft: 6 }}>hadir {jam(p.checked_in_at)}</span>}
                            </span>
                          </label>
                        ))}
                        <div className="aksi" style={{ marginTop: 8 }}>
                          <button type="submit" name="mode" value="masuk" className="mini">Check-in yang dicentang</button>
                          <button type="submit" name="mode" value="batal" className="ghost mini">Batalkan check-in</button>
                        </div>
                      </form>
                    ) : (
                      <ul className="names">
                        {r.peserta.map((p) => (
                          <li key={p.id}>{p.nama} <span className="sub">({p.kelompok}{p.gender ? `, ${p.gender}` : ''})</span></li>
                        ))}
                      </ul>
                    )}
                  </details>
                  <span className="sub">{r.wa}</span>
                </td>
                <td>{asal(r)}{r.didaftarkan_oleh !== 'mandiri' && <><br /><span className="sub">via {r.didaftarkan_oleh}</span></>}</td>
                <td>{r.jml_dewasa} / {r.jml_anak}</td>
                <td>
                  <span className={`badge ${r.status === 'terdaftar' ? 'ok' : 'wait'}`}>{LABEL[r.status]}</span>
                  {r.status === 'terdaftar' && (
                    <><br /><span className="sub">Hadir {r.peserta.filter((p) => p.checked_in_at).length}/{r.peserta.length}</span></>
                  )}
                </td>
                <td className="aksi">
                  <a className="btn ghost mini" target="_blank" rel="noopener noreferrer"
                    href={linkWA(r.wa, pesanKonfirmasi(r, ev))}>WA</a>
                  {r.status === 'terdaftar' && r.peserta.some((p) => !p.checked_in_at) && (
                    <form action={checkInDashboard} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="balik" value={balik} />
                      <input type="hidden" name="mode" value="masuk" />
                      {r.peserta.filter((p) => !p.checked_in_at).map((p) => (
                        <input key={p.id} type="hidden" name="pid" value={p.id} />
                      ))}
                      <button type="submit" className="mini">Check-in semua</button>
                    </form>
                  )}
                  {r.status === 'terdaftar' && (
                    <details className="qr">
                      <summary className="btn ghost mini">QR</summary>
                      <div className="qr-box">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/admin/qr/${r.kode_daftar}`} alt={`QR ${r.kode_daftar}`} width={200} height={200} loading="lazy" />
                        <div><b>{r.kode_daftar}</b></div>
                        <a href={`/admin/qr/${r.kode_daftar}`} download={`${r.kode_daftar}.png`}>Unduh PNG</a>
                        {' · '}
                        <a href={`/sukses/${r.kode_daftar}`} target="_blank" rel="noopener noreferrer">Halaman tiket</a>
                      </div>
                    </details>
                  )}
                  {r.status === 'daftar_tunggu' && <>
                    <Tombol r={r} status="terdaftar" label="Terima" />
                    <Tombol r={r} status="terdaftar" label="Terima (abaikan kuota)" paksa />
                  </>}
                  {r.status === 'terdaftar' && <Tombol r={r} status="batal" label="Batalkan" />}
                  {r.status === 'batal' && <Tombol r={r} status="terdaftar" label="Aktifkan lagi" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
