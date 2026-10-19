'use client'

import { useActionState, useState } from 'react'
import { daftar } from './actions'
import InputWA from './input-wa'

type Komsel = { id: number; nama: string }
type Kelompok = 'dewasa' | 'anak'
type Gender = 'L' | 'P' | ''
type Orang = { id: number; nama: string; kelompok: Kelompok; gender: Gender }

const MAKS = 40

export default function Form({ eventId, komsel }: { eventId: string; komsel: Komsel[] }) {
  const [state, action, pending] = useActionState(daftar, null)
  const [kategori, setKategori] = useState<'jemaat' | 'tamu'>('jemaat')
  const [orang, setOrang] = useState<Orang[]>([{ id: 1, nama: '', kelompok: 'dewasa', gender: '' }])
  const [nextId, setNextId] = useState(2)

  const tambah = () => {
    setOrang((l) => [...l, { id: nextId, nama: '', kelompok: 'dewasa', gender: '' }])
    setNextId((n) => n + 1)
  }
  const hapus = (id: number) => setOrang((l) => l.filter((o) => o.id !== id))
  const ubah = (id: number, patch: Partial<Orang>) =>
    setOrang((l) => l.map((o) => (o.id === id ? { ...o, ...patch } : o)))

  return (
    <form action={action}>
      <input type="hidden" name="event_id" value={eventId} />
      {state?.error && <div className="err">{state.error}</div>}

      <div className="card">
        <h2>Data pendaftar</h2>
        <InputWA id="wa" name="wa" required />

        <label>Status</label>
        <div className="choice">
          <label>
            <input type="radio" name="kategori" value="jemaat" checked={kategori === 'jemaat'}
              onChange={() => setKategori('jemaat')} /> Jemaat
          </label>
          <label>
            <input type="radio" name="kategori" value="tamu" checked={kategori === 'tamu'}
              onChange={() => setKategori('tamu')} /> Tamu
          </label>
        </div>

        {kategori === 'jemaat' && (
          <>
            <label htmlFor="komsel_id">Komsel</label>
            <select id="komsel_id" name="komsel_id" defaultValue="" required>
              <option value="" disabled>Pilih komsel</option>
              {komsel.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="card">
        <h2>Yang akan hadir</h2>
        <p className="sub">
          Isi nama setiap orang yang akan hadir, termasuk Anda sendiri.
        </p>
        {orang.map((o, i) => (
          <div key={o.id} style={{ marginBottom: 14 }}>
            <label htmlFor={`nama-${o.id}`}>
              {i === 0 ? 'Nama Anda (pendaftar)' : `Nama orang ke-${i + 1}`}
            </label>
            <input
              id={`nama-${o.id}`}
              name="peserta_nama"
              type="text"
              required
              value={o.nama}
              onChange={(e) => ubah(o.id, { nama: e.target.value })}
            />
            {/* Nilai dikirim lewat input tersembunyi agar urutannya sejajar dengan nama; radio hanya untuk tampilan */}
            <input type="hidden" name="peserta_gender" value={o.gender} />
            <div className="lbl">Gender</div>
            <div className="choice" role="radiogroup" aria-label={`Gender ${o.nama || `orang ke-${i + 1}`}`}>
              <label>
                <input type="radio" name={`gender-${o.id}`} required checked={o.gender === 'L'}
                  onChange={() => ubah(o.id, { gender: 'L' })} /> Laki-laki
              </label>
              <label>
                <input type="radio" name={`gender-${o.id}`} required checked={o.gender === 'P'}
                  onChange={() => ubah(o.id, { gender: 'P' })} /> Perempuan
              </label>
            </div>
            <input type="hidden" name="peserta_kelompok" value={o.kelompok} />
            <div className="lbl">Kategori usia</div>
            <div className="choice" role="radiogroup" aria-label={`Kategori usia ${o.nama || `orang ke-${i + 1}`}`}>
              <label>
                <input type="radio" name={`usia-${o.id}`} required checked={o.kelompok === 'dewasa'}
                  onChange={() => ubah(o.id, { kelompok: 'dewasa' })} /> Dewasa <span className="sub" style={{ margin: 0 }}>(13 th ke atas)</span>
              </label>
              <label>
                <input type="radio" name={`usia-${o.id}`} required checked={o.kelompok === 'anak'}
                  onChange={() => ubah(o.id, { kelompok: 'anak' })} /> Anak <span className="sub" style={{ margin: 0 }}>(12 th ke bawah)</span>
              </label>
            </div>
            {i > 0 && (
              <button type="button" className="ghost" onClick={() => hapus(o.id)} style={{ marginTop: 6 }}>
                Hapus
              </button>
            )}
          </div>
        ))}
        {orang.length < MAKS && (
          <button type="button" className="ghost" onClick={tambah}>+ Tambah orang</button>
        )}
      </div>

      <button type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Daftar'}</button>
    </form>
  )
}
