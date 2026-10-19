'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import jsQR from 'jsqr'
import { cariKode, checkIn, type Hitung, type HasilScan } from './actions'

const KEL = { dewasa: 'Dewasa', anak: 'Anak', balita: 'Balita' } as Record<string, string>

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aktif = useRef(true) // false saat hasil sedang ditampilkan: kamera berhenti membaca

  const [reg, setReg] = useState<HasilScan | null>(null)
  const [hitung, setHitung] = useState<Hitung | null>(null)
  const [pilih, setPilih] = useState<Set<string>>(new Set())
  const [pesan, setPesan] = useState<{ jenis: 'err' | 'ok'; teks: string } | null>(null)
  const [kamera, setKamera] = useState<'mulai' | 'jalan' | 'gagal'>('mulai')
  const [manual, setManual] = useState('')
  const [sibuk, mulaiTransisi] = useTransition()

  const tampilkan = useCallback((r: HasilScan, h: Hitung) => {
    setReg(r)
    setHitung(h)
    // Otomatis pilih yang belum hadir
    setPilih(new Set(r.peserta.filter((p) => !p.checked_in_at).map((p) => p.id)))
  }, [])

  const cari = useCallback((kode: string) => {
    aktif.current = false
    setPesan(null)
    mulaiTransisi(async () => {
      const res = await cariKode(kode)
      if ('error' in res) {
        setPesan({ jenis: 'err', teks: res.error })
        setReg(null)
        setTimeout(() => { aktif.current = true }, 1500) // beri jeda agar pesan terbaca
      } else {
        tampilkan(res.reg, res.hitung)
      }
    })
  }, [tampilkan])

  // Kamera + pembacaan QR
  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let berhenti = false
    let terakhir = 0

    async function mulai() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (berhenti) { stream.getTracks().forEach((t) => t.stop()); return }
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
    }
  }, [cari])

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
    })
  }

  const bisa = reg?.status === 'terdaftar'
  const sudahSemua = reg ? reg.peserta.every((p) => p.checked_in_at) : false

  return (
    <>
      {hitung && (
        <div className="quota">
          <div><b>{hitung.hadir}</b><span>sudah hadir</span></div>
          <div><b>{hitung.total}</b><span>total terdaftar</span></div>
        </div>
      )}

      {!reg && (
        <div className="card">
          <div className="kamera">
            <video ref={videoRef} playsInline muted />
            <canvas ref={canvasRef} hidden />
            {kamera !== 'jalan' && (
              <div className="kamera-info">
                {kamera === 'mulai' ? 'Membuka kamera…' : 'Kamera tidak bisa dipakai. Izinkan akses kamera di browser (butuh HTTPS), atau ketik kode di bawah.'}
              </div>
            )}
          </div>
          {sibuk && <p className="sub" style={{ textAlign: 'center', margin: '10px 0 0' }}>Mencari…</p>}
        </div>
      )}

      {pesan && <div className={pesan.jenis === 'err' ? 'err' : 'note'}>{pesan.teks}</div>}

      {!reg && (
        <form
          className="card"
          onSubmit={(e) => { e.preventDefault(); if (manual.trim()) cari(manual) }}
        >
          <label htmlFor="manual">Atau ketik kode pendaftaran</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="manual" type="text" placeholder="NTL-A1B2C3" autoCapitalize="characters" autoComplete="off"
              value={manual} onChange={(e) => setManual(e.target.value)} />
            <button type="submit" disabled={sibuk} style={{ width: 'auto', padding: '0 18px' }}>Cari</button>
          </div>
        </form>
      )}

      {reg && (
        <div className="card">
          <p style={{ margin: 0 }}>
            <span className={`badge ${bisa ? 'ok' : 'wait'}`}>
              {reg.status === 'terdaftar' ? 'Terdaftar' : reg.status === 'daftar_tunggu' ? 'Daftar tunggu' : 'Batal'}
            </span>{' '}
            <b>{reg.kode}</b>
          </p>
          <h2 style={{ margin: '8px 0 2px', fontSize: '1.2rem' }}>{reg.nama}</h2>
          <p className="sub" style={{ marginBottom: 10 }}>{reg.asal}</p>

          {!bisa && (
            <div className="err">
              {reg.status === 'daftar_tunggu'
                ? 'Masih daftar tunggu: belum mendapat kursi. Arahkan ke panitia.'
                : 'Pendaftaran ini sudah dibatalkan. Arahkan ke panitia.'}
            </div>
          )}

          {reg.peserta.map((p) => (
            <label key={p.id} className="check" style={{ padding: '8px 0', borderTop: '1px solid var(--line)', margin: 0 }}>
              <input type="checkbox" disabled={!bisa || !!p.checked_in_at}
                checked={!!p.checked_in_at || pilih.has(p.id)}
                onChange={(e) => setPilih((s) => { const n = new Set(s); e.target.checked ? n.add(p.id) : n.delete(p.id); return n })} />
              <span>
                {p.nama} <span className="sub">({KEL[p.kelompok] ?? p.kelompok})</span>
                {p.checked_in_at && (
                  <span className="sub"> · hadir {new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: 'Asia/Makassar' }).format(new Date(p.checked_in_at))}</span>
                )}
              </span>
            </label>
          ))}

          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {bisa && !sudahSemua && (
              <button type="button" disabled={sibuk || pilih.size === 0} onClick={() => simpan(false)}>
                {sibuk ? 'Menyimpan…' : `Check-in (${pilih.size} orang)`}
              </button>
            )}
            {bisa && reg.peserta.some((p) => p.checked_in_at) && (
              <button type="button" className="ghost" disabled={sibuk}
                onClick={() => { if (confirm('Batalkan SEMUA check-in untuk pendaftaran ini?')) simpan(true) }}>
                Batalkan check-in
              </button>
            )}
            <button type="button" className="ghost" onClick={lanjut}>Scan berikutnya</button>
          </div>
        </div>
      )}
    </>
  )
}
