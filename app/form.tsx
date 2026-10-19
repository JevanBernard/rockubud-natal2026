'use client'

import { useActionState, useState } from 'react'
import { daftar } from './actions'
import InputWA from './input-wa'
import { IkonGereja, IkonHapus, IkonPanah, IkonPlus, IkonTamu } from './icons'

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
    <form action={action} className="form-natal">
      <input type="hidden" name="event_id" value={eventId} />
      {state?.error && <div className="err" role="alert">{state.error}</div>}

      <section className="kartu">
        <header className="kartu-kepala">
          <h2><span className="nomor">1</span> Data Kontak Utama Pendaftar</h2>
          <p>Panitia memakai nomor ini untuk menghubungi Anda. Kode &amp; QR tampil setelah mendaftar.</p>
        </header>

        <InputWA id="wa" name="wa" required label="Nomor WhatsApp Aktif" />

        <div className="lbl">Status Keanggotaan</div>
        <div className="pil-dua" role="radiogroup" aria-label="Status keanggotaan">
          <div className="pil">
            <input className="sr" type="radio" id="st-jemaat" name="kategori" value="jemaat"
              checked={kategori === 'jemaat'} onChange={() => setKategori('jemaat')} />
            <label htmlFor="st-jemaat" className="pil-besar"><IkonGereja /> Jemaat GBI ROCK</label>
          </div>
          <div className="pil">
            <input className="sr" type="radio" id="st-tamu" name="kategori" value="tamu"
              checked={kategori === 'tamu'} onChange={() => setKategori('tamu')} />
            <label htmlFor="st-tamu" className="pil-besar"><IkonTamu /> Tamu / Pengunjung</label>
          </div>
        </div>

        {kategori === 'jemaat' && (
          <>
            <label htmlFor="komsel_id">Pilihan Komsel / Wilayah</label>
            <select id="komsel_id" name="komsel_id" defaultValue="" required>
              <option value="" disabled>Pilih komsel Anda…</option>
              {komsel.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </>
        )}
      </section>

      <section className="kartu">
        <header className="kartu-kepala kepala-baris">
          <div>
            <h2><span className="nomor">2</span> Daftar Rombongan Hadir</h2>
            <p>Isi nama setiap orang yang akan hadir, termasuk Anda sendiri.</p>
          </div>
          <span className="jumlah-chip" aria-live="polite">{orang.length} Orang</span>
        </header>

        <div className="daftar-orang">
          {orang.map((o, i) => (
            <div key={o.id} className="orang">
              <div className="orang-kepala">
                <span className={i === 0 ? 'utama' : ''}>
                  {i === 0 ? 'Orang ke-1 (Pendaftar Utama)' : `Orang ke-${i + 1} (Keluarga / Teman)`}
                </span>
                {i > 0 && (
                  <button type="button" className="ikon-hapus" onClick={() => hapus(o.id)}
                    aria-label={`Hapus orang ke-${i + 1}`} title="Hapus orang ini">
                    <IkonHapus />
                  </button>
                )}
              </div>

              <label htmlFor={`nama-${o.id}`}>Nama Lengkap</label>
              <input
                id={`nama-${o.id}`}
                name="peserta_nama"
                type="text"
                required
                autoComplete={i === 0 ? 'name' : 'off'}
                placeholder={i === 0 ? 'Contoh: I Wayan Kristianto' : 'Ketik nama lengkap…'}
                value={o.nama}
                onChange={(e) => ubah(o.id, { nama: e.target.value })}
              />

              {/* Nilai dikirim lewat input tersembunyi agar urutannya sejajar dengan nama; radio hanya untuk tampilan */}
              <input type="hidden" name="peserta_gender" value={o.gender} />
              <input type="hidden" name="peserta_kelompok" value={o.kelompok} />

              <div className="pil-grup">
                <div>
                  <div className="lbl-kecil">Jenis Kelamin</div>
                  <div className="pil-dua" role="radiogroup" aria-label={`Jenis kelamin ${o.nama || `orang ke-${i + 1}`}`}>
                    {([['L', 'Laki-laki'], ['P', 'Perempuan']] as const).map(([v, teks]) => (
                      <div className="pil" key={v}>
                        <input className="sr" type="radio" id={`g-${o.id}-${v}`} name={`gender-${o.id}`} required
                          checked={o.gender === v} onChange={() => ubah(o.id, { gender: v })} />
                        <label htmlFor={`g-${o.id}-${v}`}>{teks}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="lbl-kecil">Kategori Usia</div>
                  <div className="pil-dua" role="radiogroup" aria-label={`Kategori usia ${o.nama || `orang ke-${i + 1}`}`}>
                    {([['dewasa', 'Dewasa (13+)'], ['anak', 'Anak (≤12)']] as const).map(([v, teks]) => (
                      <div className="pil" key={v}>
                        <input className="sr" type="radio" id={`u-${o.id}-${v}`} name={`usia-${o.id}`} required
                          checked={o.kelompok === v} onChange={() => ubah(o.id, { kelompok: v })} />
                        <label htmlFor={`u-${o.id}-${v}`}>{teks}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {orang.length < MAKS && (
          <button type="button" className="tambah" onClick={tambah}>
            <IkonPlus /> Tambah Anggota Keluarga / Teman
          </button>
        )}
      </section>

      <div className="aksi-kirim">
        <button type="submit" className="kirim" disabled={pending}>
          {pending ? 'Mengirim…' : <>Daftar Sekarang ({orang.length} Orang) <IkonPanah /></>}
        </button>
        <p>Satu kode &amp; QR check-in untuk seluruh rombongan akan tampil setelah Anda mendaftar. Simpan atau screenshot halamannya.</p>
      </div>
    </form>
  )
}
