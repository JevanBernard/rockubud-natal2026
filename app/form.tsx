'use client'

import { useActionState, useState } from 'react'
import { daftar } from './actions'

type Komsel = { id: number; nama: string }
type Kelompok = 'dewasa' | 'anak' | 'balita'
type Orang = { id: number; nama: string; kelompok: Kelompok }

const MAKS = 40

export default function Form({ eventId, komsel }: { eventId: string; komsel: Komsel[] }) {
  const [state, action, pending] = useActionState(daftar, null)
  const [kategori, setKategori] = useState<'jemaat' | 'tamu'>('jemaat')
  const [orang, setOrang] = useState<Orang[]>([{ id: 1, nama: '', kelompok: 'dewasa' }])
  const [nextId, setNextId] = useState(2)

  const tambah = () => {
    setOrang((l) => [...l, { id: nextId, nama: '', kelompok: 'dewasa' }])
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
        <label htmlFor="wa">Nomor WhatsApp</label>
        <input id="wa" name="wa" type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" required />

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

        {kategori === 'jemaat' ? (
          <>
            <label htmlFor="komsel_id">Komsel</label>
            <select id="komsel_id" name="komsel_id" defaultValue="" required>
              <option value="" disabled>Pilih komsel</option>
              {komsel.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label htmlFor="diundang_oleh">Diundang oleh (opsional)</label>
            <input id="diundang_oleh" name="diundang_oleh" type="text" />
          </>
        )}
      </div>

      <div className="card">
        <h2>Yang akan hadir</h2>
        <p className="sub">
          Isi nama setiap orang, termasuk Anda sendiri dan balita. Balita (0–4 th) dipangku, tidak mendapat kursi.
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
            <select
              name="peserta_kelompok"
              aria-label={`Kelompok usia ${o.nama || `orang ke-${i + 1}`}`}
              value={o.kelompok}
              onChange={(e) => ubah(o.id, { kelompok: e.target.value as Kelompok })}
              style={{ marginTop: 6 }}
            >
              <option value="dewasa">Dewasa (13 th ke atas)</option>
              <option value="anak">Anak (5–12 th)</option>
              <option value="balita">Balita (0–4 th)</option>
            </select>
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

      <div className="card">
        <label className="check">
          <input type="checkbox" name="setuju" />
          <span>Saya setuju data ini dipakai panitia hanya untuk keperluan acara Natal.</span>
        </label>
      </div>

      <button type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Daftar'}</button>
    </form>
  )
}
