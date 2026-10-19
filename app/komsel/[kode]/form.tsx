'use client'

import { useActionState, useState } from 'react'
import { daftarKomsel } from '../actions'

type Kelompok = 'dewasa' | 'anak' | 'balita'
type Orang = { id: number; nama: string; kelompok: Kelompok }
type Keluarga = { id: number; wa: string; orang: Orang[] }

let seq = 1
const orangBaru = (): Orang => ({ id: seq++, nama: '', kelompok: 'dewasa' })
const keluargaBaru = (): Keluarga => ({ id: seq++, wa: '', orang: [orangBaru()] })

export default function FormKomsel({ eventId, kode }: { eventId: string; kode: string }) {
  const [state, action, pending] = useActionState(daftarKomsel, null)
  const [kel, setKel] = useState<Keluarga[]>(() => [keluargaBaru()])

  const ubahKel = (id: number, fn: (k: Keluarga) => Keluarga) =>
    setKel((l) => l.map((k) => (k.id === id ? fn(k) : k)))

  const payload = JSON.stringify(
    kel.map((k) => ({ wa: k.wa, peserta: k.orang.map((o) => ({ nama: o.nama, kelompok: o.kelompok })) })),
  )

  return (
    <form action={action}>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="kode" value={kode} />
      <input type="hidden" name="keluarga" value={payload} />
      {state?.error && <div className="err">{state.error}</div>}

      <div className="card">
        <h2>Gembala Komsel</h2>
        <label htmlFor="wa">Nomor WhatsApp Anda</label>
        <input id="wa" name="wa" type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" required />
        <p className="sub" style={{ marginTop: 8 }}>
          Dipakai sebagai kontak untuk keluarga yang tidak punya nomor sendiri.
        </p>
      </div>

      {kel.map((k, ki) => (
        <div key={k.id} className="fam">
          <h2>Keluarga {ki + 1}</h2>
          <label htmlFor={`wa-${k.id}`}>WhatsApp keluarga (opsional)</label>
          <input id={`wa-${k.id}`} type="tel" inputMode="tel" value={k.wa}
            onChange={(e) => ubahKel(k.id, (x) => ({ ...x, wa: e.target.value }))} />

          {k.orang.map((o, oi) => (
            <div key={o.id} className="person">
              <label htmlFor={`n-${o.id}`}>
                {oi === 0 ? 'Nama perwakilan keluarga' : `Nama orang ke-${oi + 1}`}
              </label>
              <input id={`n-${o.id}`} type="text" required value={o.nama}
                onChange={(e) => ubahKel(k.id, (x) => ({
                  ...x, orang: x.orang.map((y) => (y.id === o.id ? { ...y, nama: e.target.value } : y)),
                }))} />
              <select aria-label={`Kelompok usia ${o.nama || `orang ke-${oi + 1}`}`} value={o.kelompok}
                style={{ marginTop: 6 }}
                onChange={(e) => ubahKel(k.id, (x) => ({
                  ...x, orang: x.orang.map((y) => (y.id === o.id ? { ...y, kelompok: e.target.value as Kelompok } : y)),
                }))}>
                <option value="dewasa">Dewasa (13 th ke atas)</option>
                <option value="anak">Anak (5–12 th)</option>
                <option value="balita">Balita (0–4 th)</option>
              </select>
              {oi > 0 && (
                <button type="button" className="ghost" style={{ marginTop: 6 }}
                  onClick={() => ubahKel(k.id, (x) => ({ ...x, orang: x.orang.filter((y) => y.id !== o.id) }))}>
                  Hapus orang
                </button>
              )}
            </div>
          ))}

          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <button type="button" className="ghost"
              onClick={() => ubahKel(k.id, (x) => ({ ...x, orang: [...x.orang, orangBaru()] }))}>
              + Tambah orang
            </button>
            {kel.length > 1 && (
              <button type="button" className="ghost" onClick={() => setKel((l) => l.filter((x) => x.id !== k.id))}>
                Hapus keluarga ini
              </button>
            )}
          </div>
        </div>
      ))}

      <button type="button" className="ghost" style={{ marginBottom: 14 }}
        onClick={() => setKel((l) => [...l, keluargaBaru()])}>
        + Tambah keluarga
      </button>

      <div className="card">
        <label className="check">
          <input type="checkbox" name="setuju" />
          <span>Data ini sudah disetujui keluarga yang bersangkutan dan hanya dipakai panitia untuk acara Natal.</span>
        </label>
      </div>

      <button type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Daftarkan semua'}</button>
    </form>
  )
}
