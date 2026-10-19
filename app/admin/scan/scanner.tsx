'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import jsQR from 'jsqr'
import { cariKode, checkIn, hitungAwal, type Hitung, type HasilScan } from './actions'
import { IkonBalik, IkonCari, IkonCek, IkonHadir, IkonJam, IkonKembali, IkonRiwayat, IkonScan, IkonSenter, IkonSilang, IkonVerifikasi } from '../../icons'

const KEL = { dewasa: 'Dewasa', anak: 'Anak ≤12 th', balita: 'Balita' } as Record<string, string>
const STATUS = { terdaftar: 'Terdaftar (Valid)', daftar_tunggu: 'Daftar tunggu', batal: 'Dibatalkan' } as const

const jam = (iso: string | Date) =>
  new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }).format(new Date(iso)).replace(':', '.')

const inisial = (nama: string) =>
  nama.trim().split(/\s+/).slice(0, 2).map((k) => k[0]?.toUpperCase() ?? '').join('') || '?'

type Riwayat = { kode: string; nama: string; orang: number; waktu: string }

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const aktif = useRef(true) // false saat hasil sedang ditampilkan: kamera berhenti membaca

  const [reg, setReg] = useState<HasilScan | null>(null)
  const [hitung, setHitung] = useState<Hitung | null>(null)
  const [pilih, setPilih] = useState<Set<string>>(new Set())
  const [pesan, setPesan] = useState<{ jenis: 'err' | 'ok'; teks: string } | null>(null)
  const [kamera, setKamera] = useState<'mulai' | 'jalan' | 'gagal'>('mulai')
  const [lensa, setLensa] = useState<'environment' | 'user'>('environment')
  const [bisaSenter, setBisaSenter] = useState(false)
  const [senter, setSenter] = useState(false)
  const [manual, setManual] = useState('')
  const [dipindai, setDipindai] = useState<Date | null>(null)
  const [riwayat, setRiwayat] = useState<Riwayat[]>([])
  const [sibuk, mulaiTransisi] = useTransition()

  useEffect(() => { hitungAwal().then((h) => h && setHitung(h)).catch(() => {}) }, [])

  const tampilkan = useCallback((r: HasilScan, h: Hitung) => {
    setReg(r)
    setHitung(h)
    // Otomatis pilih yang belum hadir
    setPilih(new Set(r.peserta.filter((p) => !p.checked_in_at).map((p) => p.id)))
  }, [])

  const cari = useCallback((kode: string) => {
    aktif.current = false
    setPesan(null)
    navigator.vibrate?.(60)
    mulaiTransisi(async () => {
      const res = await cariKode(kode)
      if ('error' in res) {
        setPesan({ jenis: 'err', teks: res.error })
        setReg(null)
        setTimeout(() => { aktif.current = true }, 1500) // beri jeda agar pesan terbaca
      } else {
        setDipindai(new Date())
        tampilkan(res.reg, res.hitung)
      }
    })
  }, [tampilkan])

  // Kamera + pembacaan QR (dijalankan ulang saat lensa dibalik)
  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let berhenti = false
    let terakhir = 0
    setKamera('mulai')
    setSenter(false)
    setBisaSenter(false)

    async function mulai() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: lensa } }, audio: false })
        if (berhenti) { stream.getTracks().forEach((t) => t.stop()); return }
        const track = stream.getVideoTracks()[0]
        trackRef.current = track
        setBisaSenter(!!(track.getCapabilities?.() as { torch?: boolean } | undefined)?.torch)
        const v = videoRef.current!
        v.srcObject = stream
        await v.play()
        setKamera('jalan')
        loop()
      } catch {
        setKamera('gagal')
      }
    }

    function loop() {
      raf = requestAnimationFrame(loop)
      const v = videoRef.current, c = canvasRef.current
      if (!v || !c || !aktif.current || v.readyState < 2) return
      const now = performance.now()
      if (now - terakhir < 150) return // cukup ~6x/detik, hemat baterai
      terakhir = now
      const w = Math.min(640, v.videoWidth), h = Math.round((w / v.videoWidth) * v.videoHeight)
      if (!w || !h) return
      c.width = w; c.height = h
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(v, 0, 0, w, h)
      const hasil = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })
      if (hasil?.data) cari(hasil.data)
    }

    mulai()
    return () => {
      berhenti = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      trackRef.current = null
    }
  }, [cari, lensa])

  const ubahSenter = async () => {
    const t = trackRef.current
    if (!t) return
    try {
      await t.applyConstraints({ advanced: [{ torch: !senter } as MediaTrackConstraintSet] })
      setSenter(!senter)
    } catch {
      setBisaSenter(false)
    }
  }

  const lanjut = () => {
    setReg(null)
    setPesan(null)
    aktif.current = true
  }

  const simpan = (batal: boolean) => {
    if (!reg) return
    const ids = batal ? reg.peserta.filter((p) => p.checked_in_at).map((p) => p.id) : [...pilih]
    mulaiTransisi(async () => {
      const res = await checkIn(reg.id, ids, batal)
      if ('error' in res) { setPesan({ jenis: 'err', teks: res.error }); return }
      tampilkan(res.reg, res.hitung)
      setPesan({ jenis: 'ok', teks: batal ? 'Check-in dibatalkan.' : `Check-in berhasil (${ids.length} orang).` })
      if (!batal) {
        setRiwayat((l) => [{ kode: res.reg.kode, nama: res.reg.nama, orang: ids.length, waktu: jam(new Date()) }, ...l].slice(0, 20))
      }
    })
  }

  const bisa = reg?.status === 'terdaftar'
  const sudahSemua = reg ? reg.peserta.every((p) => p.checked_in_at) : false
  const persen = hitung && hitung.total ? Math.round((hitung.hadir / hitung.total) * 100) : 0
  const sudahHadir = reg ? reg.peserta.filter((p) => p.checked_in_at).length : 0

  return (
    <div className="sc">
      <header className="sc-bar">
        <a href="/admin" className="sc-kembali" aria-label="Kembali ke dashboard admin"><IkonKembali /></a>
        <div>
          <span className={`sc-kamera ${kamera}`}>
            <i />
            {kamera === 'jalan' ? 'Kamera aktif / siap scan' : kamera === 'mulai' ? 'Membuka kamera…' : 'Kamera tidak aktif'}
          </span>
          <h1>Admin Scanner</h1>
        </div>
      </header>

      <main className="sc-isi">
        <section className="sc-stat" aria-label="Jumlah kehadiran">
          <div className="sc-tile">
            <div className="sc-tile-atas hijau"><span><IkonHadir /> Sudah hadir</span><b className="sc-pct">{hitung ? `${persen}%` : '–'}</b></div>
            <div className="sc-angka"><b className="hijau">{hitung?.hadir ?? '–'}</b><span>/ {hitung?.total ?? '–'} orang</span></div>
            <div className="sc-bar-kecil"><div style={{ width: `${persen}%` }} /></div>
          </div>
          <div className="sc-tile">
            <div className="sc-tile-atas magenta"><span><IkonScan /> Total terdaftar</span></div>
            <div className="sc-angka"><b>{hitung?.total ?? '–'}</b><span>orang berkursi</span></div>
            <div className="sc-ket">Belum hadir: {hitung ? hitung.total - hitung.hadir : '–'}</div>
          </div>
        </section>

        {/* Kamera tetap terpasang (hanya disembunyikan) agar video tidak kosong saat kembali scan */}
        <section className="sc-pemindai" hidden={!!reg}>
          <div className="sc-layar">
            <video ref={videoRef} playsInline muted />
            <canvas ref={canvasRef} hidden />
            <div className="sc-bingkai" aria-hidden="true">
              <i className="p a" /><i className="p b" /><i className="p c" /><i className="p d" />
              {kamera === 'jalan' && !sibuk && <span className="sc-laser" />}
            </div>
            {kamera !== 'jalan' && (
              <div className="sc-info-kamera">
                {kamera === 'mulai' ? 'Membuka kamera…' : 'Kamera tidak bisa dipakai. Izinkan akses kamera di browser (butuh HTTPS), atau ketik kode di bawah.'}
              </div>
            )}
            <div className="sc-petunjuk">
              <p>{sibuk ? 'Mencari…' : 'Arahkan kamera ke QR E-Tiket jemaat'}</p>
              <small>Bisa dari layar WhatsApp atau screenshot</small>
            </div>
          </div>
          <div className="sc-kontrol">
            {bisaSenter && (
              <button type="button" className={senter ? 'nyala' : ''} onClick={ubahSenter} aria-pressed={senter}>
                <IkonSenter /> Senter
              </button>
            )}
            <button type="button" onClick={() => setLensa((l) => (l === 'environment' ? 'user' : 'environment'))}>
              <IkonBalik /> Balik lensa
            </button>
          </div>
        </section>

        {pesan && <div className={`sc-pesan ${pesan.jenis}`} role="alert">{pesan.teks}</div>}

        {!reg && (
          <form className="sc-manual" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) cari(manual) }}>
            <label htmlFor="manual"><IkonCari /> Pencarian manual tiket <small>Jika QR rusak / layar buram</small></label>
            <div>
              <input id="manual" type="text" placeholder="Ketik kode, mis. NTL-7X9K2M" autoCapitalize="characters"
                autoComplete="off" spellCheck={false} value={manual} onChange={(e) => setManual(e.target.value)} />
              <button type="submit" disabled={sibuk}>Verifikasi</button>
            </div>
          </form>
        )}

        {reg && (
          <section className={`sc-hasil ${reg.status}`}>
            <div className="sc-pita" />
            <div className="sc-hasil-isi">
              <div className="sc-hasil-kepala">
                <div>
                  <b className="sc-kode">{reg.kode}</b>
                  <span className={`sc-status ${reg.status}`}>
                    {reg.status === 'terdaftar' ? <IkonCek /> : <IkonSilang />}{STATUS[reg.status]}
                  </span>
                  {dipindai && <p className="sc-waktu"><IkonJam /> Dipindai {jam(dipindai)} WITA</p>}
                </div>
              </div>

              <div className="sc-utama">
                <span className="sc-avatar">{inisial(reg.nama)}</span>
                <div>
                  <b>{reg.nama}</b>
                  <small>{reg.asal}</small>
                </div>
              </div>

              {!bisa && (
                <div className="sc-pesan err">
                  {reg.status === 'daftar_tunggu'
                    ? 'Masih daftar tunggu: belum mendapat kursi. Arahkan ke panitia.'
                    : 'Pendaftaran ini sudah dibatalkan. Arahkan ke panitia.'}
                </div>
              )}

              <div className="sc-daftar-kepala">
                <b>Daftar anggota rombongan</b>
                <small>{bisa ? 'Centang yang hadir' : `${reg.peserta.length} orang`}</small>
              </div>
              <ul className="sc-orang">
                {reg.peserta.map((p) => {
                  const hadir = !!p.checked_in_at
                  return (
                    <li key={p.id}>
                      <label className={`${hadir ? 'hadir' : ''} ${!bisa ? 'mati' : ''}`}>
                        <input type="checkbox" disabled={!bisa || hadir}
                          checked={hadir || pilih.has(p.id)}
                          onChange={(e) => setPilih((s) => { const n = new Set(s); if (e.target.checked) n.add(p.id); else n.delete(p.id); return n })} />
                        <span className="sc-orang-teks">
                          <b>{p.nama}</b>
                          <em className={p.kelompok === 'anak' ? 'anak' : ''}>{KEL[p.kelompok] ?? p.kelompok}</em>
                          <small>{hadir ? `✓ Hadir ${jam(p.checked_in_at!)}` : bisa ? 'Centang bila hadir bersama rombongan' : '—'}</small>
                        </span>
                        {hadir && <span className="sc-verif"><IkonVerifikasi /></span>}
                      </label>
                    </li>
                  )
                })}
              </ul>

              <div className="sc-aksi">
                {bisa && !sudahSemua && (
                  <button type="button" className="utama" disabled={sibuk || pilih.size === 0} onClick={() => simpan(false)}>
                    <IkonHadir /> {sibuk ? 'Menyimpan…' : `Konfirmasi check-in (${pilih.size} dari ${reg.peserta.length - sudahHadir} belum hadir)`}
                  </button>
                )}
                {bisa && sudahSemua && (
                  <div className="sc-lengkap"><IkonCek /> Seluruh rombongan sudah check-in</div>
                )}
                <div className="sc-aksi-dua">
                  {bisa && sudahHadir > 0 ? (
                    <button type="button" disabled={sibuk}
                      onClick={() => { if (confirm('Batalkan SEMUA check-in untuk pendaftaran ini?')) simpan(true) }}>
                      <IkonSilang /> Batalkan check-in
                    </button>
                  ) : <span />}
                  <button type="button" onClick={lanjut}><IkonScan /> Scan berikutnya</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {riwayat.length > 0 && (
          <section className="sc-riwayat">
            <h2><IkonRiwayat /> Check-in di perangkat ini <span>{riwayat.length}</span></h2>
            <ul>
              {riwayat.map((r, i) => (
                <li key={`${r.kode}-${i}`}>
                  <span className="sc-riwayat-ikon"><IkonCek /></span>
                  <div>
                    <b>{r.kode}</b> <small>· {r.nama}</small>
                    <small className="blok">{r.orang} orang</small>
                  </div>
                  <div className="kanan"><b>{r.waktu} WITA</b><small>Sukses</small></div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
