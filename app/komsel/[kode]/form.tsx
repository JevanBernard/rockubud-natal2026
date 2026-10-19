'use client'

import { useActionState, useState } from 'react'
import { daftarKomsel } from '../actions'
import InputWA from '../../input-wa'

type Kelompok = 'dewasa' | 'anak'
type Gender = 'L' | 'P' | ''
type Orang = { id: number; nama: string; kelompok: Kelompok; gender: Gender }
type Keluarga = { id: number; wa: string; orang: Orang[] }

let seq = 1
const orangBaru = (): Orang => ({ id: seq++, nama: '', kelompok: 'dewasa', gender: '' })
const keluargaBaru = (): Keluarga => ({ id: seq++, wa: '', orang: [orangBaru()] })

export default function FormKomsel({ eventId, kode }: { eventId: string; kode: string }) {
  const [state, action, pending] = useActionState(daftarKomsel, null)
  const [kel, setKel] = useState<Keluarga[]>(() => [keluargaBaru()])

  const ubahKel = (id: number, fn: (k: Keluarga) => Keluarga) =>
    setKel((l) => l.map((k) => (k.id === id ? fn(k) : k)))

  const payload = JSON.stringify(
    kel.map((k) => ({ wa: k.wa, peserta: k.orang.map((o) => ({ nama: o.nama, kelompok: o.kelompok, gender: o.gender })) })),
  )

  return (
    <form action={action}>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="kode" value={kode} />
      <input type="hidden" name="keluarga" value={payload} />
      {state?.error && <div className="err">{state.error}</div>}

      <div className="card">
        <h2>Gembala Komsel</h2>
        <InputWA id="wa" name="wa" label="Nomor WhatsApp Anda" required />
        <p className="sub" style={{ marginTop: 8 }}>
          Dipakai sebagai kontak untuk keluarga yang tidak punya nomor sendiri.
        </p>
      </div>

      {kel.map((k, ki) => (
        <div key={k.id} className="fam">
          <h2>Keluarga {ki + 1}</h2>
          <InputWA id={`wa-${k.id}`} label="WhatsApp keluarga (opsional)"
            onValue={(v) => ubahKel(k.id, (x) => ({ ...x, wa: v }))} />

          {k.orang.map((o, oi) => (
            <div key={o.id} className="person">
              <label htmlFor={`n-${o.id}`}>
                {oi === 0 ? 'Nama perwakilan keluarga' : `Nama orang ke-${oi + 1}`}
              </label>
              <input id={`n-${o.id}`} type="text" required value={o.nama}
                onChange={(e) => ubahKel(k.id, (x) => ({
                  ...x, orang: x.orang.map((y) => (y.id === o.id ? { ...y, nama: e.target.value } : y)),
                }))} />
              <div className="lbl">Gender</div>
              <div className="choice" role="radiogroup" aria-label={`Gender ${o.nama || `orang ke-${oi + 1}`}`}>
                {([['L', 'Laki-laki'], ['P', 'Perempuan']] as const).map(([v, teks]) => (
                  <label key={v}>
                    <input type="radio" name={`gender-${o.id}`} required checked={o.gender === v}
                      onChange={() => ubahKel(k.id, (x) => ({
                        ...x, orang: x.orang.map((y) => (y.id === o.id ? { ...y, gender: v } : y)),
                      }))} /> {teks}
                  </label>
                ))}
              </div>
              <div className="lbl">Kategori usia</div>
              <div className="choice" role="radiogroup" aria-label={`Kategori usia ${o.nama || `orang ke-${oi + 1}`}`}>
                {([['dewasa', 'Dewasa', '13 th ke atas'], ['anak', 'Anak', '12 th ke bawah']] as const).map(([v, teks, ket]) => (
                  <label key={v}>
                    <input type="radio" name={`usia-${o.id}`} required checked={o.kelompok === v}
                      onChange={() => ubahKel(k.id, (x) => ({
                        ...x, orang: x.orang.map((y) => (y.id === o.id ? { ...y, kelompok: v } : y)),
                      }))} /> {teks} <span className="sub" style={{ margin: 0 }}>({ket})</span>
                  </label>
                ))}
              </div>
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

      <button type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Daftarkan semua'}</button>
    </form>
  )
}
