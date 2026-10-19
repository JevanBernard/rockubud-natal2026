'use client'

import { useActionState, useState } from 'react'
import { daftarKomsel } from '../actions'
import InputWA from '../../input-wa'
import { IkonHapus, IkonPanah, IkonPlus } from '../../icons'

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
  const ubahOrang = (kid: number, oid: number, patch: Partial<Orang>) =>
    ubahKel(kid, (x) => ({ ...x, orang: x.orang.map((y) => (y.id === oid ? { ...y, ...patch } : y)) }))

  const payload = JSON.stringify(
    kel.map((k) => ({ wa: k.wa, peserta: k.orang.map((o) => ({ nama: o.nama, kelompok: o.kelompok, gender: o.gender })) })),
  )
  const totalOrang = kel.reduce((a, k) => a + k.orang.length, 0)

  return (
    <form action={action} className="form-natal">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="kode" value={kode} />
      <input type="hidden" name="keluarga" value={payload} />
      {state?.error && <div className="err" role="alert">{state.error}</div>}

      <section className="kartu">
        <header className="kartu-kepala">
          <h2><span className="nomor">1</span> Gembala Komsel</h2>
          <p>Dipakai sebagai kontak untuk keluarga yang tidak punya nomor sendiri.</p>
        </header>
        <InputWA id="wa" name="wa" label="Nomor WhatsApp Anda" required />
      </section>

      {kel.map((k, ki) => (
        <section key={k.id} className="kartu keluarga">
          <header className="kartu-kepala kepala-baris">
            <div>
              <h2><span className="nomor">{ki + 2}</span> Keluarga {ki + 1}</h2>
              <p>{k.orang.length} orang</p>
            </div>
            {kel.length > 1 && (
              <button type="button" className="ikon-hapus" onClick={() => setKel((l) => l.filter((x) => x.id !== k.id))}
                aria-label={`Hapus keluarga ${ki + 1}`} title="Hapus keluarga ini">
                <IkonHapus />
              </button>
            )}
          </header>

          <InputWA id={`wa-${k.id}`} label="WhatsApp keluarga (opsional)" onValue={(v) => ubahKel(k.id, (x) => ({ ...x, wa: v }))} />

          <div className="daftar-orang" style={{ marginTop: 14 }}>
            {k.orang.map((o, oi) => (
              <div key={o.id} className="orang">
                <div className="orang-kepala">
                  <span className={oi === 0 ? 'utama' : ''}>{oi === 0 ? 'Perwakilan keluarga' : `Orang ke-${oi + 1}`}</span>
                  {oi > 0 && (
                    <button type="button" className="ikon-hapus" aria-label={`Hapus orang ke-${oi + 1}`} title="Hapus orang ini"
                      onClick={() => ubahKel(k.id, (x) => ({ ...x, orang: x.orang.filter((y) => y.id !== o.id) }))}>
                      <IkonHapus />
                    </button>
                  )}
                </div>

                <label htmlFor={`n-${o.id}`}>Nama lengkap</label>
                <input id={`n-${o.id}`} type="text" required autoComplete="off" placeholder="Ketik nama lengkap…" value={o.nama}
                  onChange={(e) => ubahOrang(k.id, o.id, { nama: e.target.value })} />

                <div className="pil-grup">
                  <div>
                    <div className="lbl-kecil">Jenis Kelamin</div>
                    <div className="pil-dua" role="radiogroup" aria-label={`Jenis kelamin ${o.nama || `orang ke-${oi + 1}`}`}>
                      {([['L', 'Laki-laki'], ['P', 'Perempuan']] as const).map(([v, teks]) => (
                        <div className="pil" key={v}>
                          <input className="sr" type="radio" id={`kg-${o.id}-${v}`} name={`gender-${o.id}`} required
                            checked={o.gender === v} onChange={() => ubahOrang(k.id, o.id, { gender: v })} />
                          <label htmlFor={`kg-${o.id}-${v}`}>{teks}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="lbl-kecil">Kategori Usia</div>
                    <div className="pil-dua" role="radiogroup" aria-label={`Kategori usia ${o.nama || `orang ke-${oi + 1}`}`}>
                      {([['dewasa', 'Dewasa (13+)'], ['anak', 'Anak (≤12)']] as const).map(([v, teks]) => (
                        <div className="pil" key={v}>
                          <input className="sr" type="radio" id={`ku-${o.id}-${v}`} name={`usia-${o.id}`} required
                            checked={o.kelompok === v} onChange={() => ubahOrang(k.id, o.id, { kelompok: v })} />
                          <label htmlFor={`ku-${o.id}-${v}`}>{teks}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="tambah" onClick={() => ubahKel(k.id, (x) => ({ ...x, orang: [...x.orang, orangBaru()] }))}>
            <IkonPlus /> Tambah orang
          </button>
        </section>
      ))}

      <button type="button" className="tambah" onClick={() => setKel((l) => [...l, keluargaBaru()])}>
        <IkonPlus /> Tambah keluarga
      </button>

      <div className="aksi-kirim">
        <button type="submit" className="kirim" disabled={pending}>
          {pending ? 'Mengirim…' : <>Daftarkan Semua ({kel.length} keluarga, {totalOrang} orang) <IkonPanah /></>}
        </button>
      </div>
    </form>
  )
}
