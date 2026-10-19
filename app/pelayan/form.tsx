'use client'

import { useActionState } from 'react'
import { daftarPelayan } from './actions'
import InputWA from '../input-wa'
import { IkonPanah } from '../icons'

export default function FormPelayan({ eventId, perluKode }: { eventId: string; perluKode: boolean }) {
  const [state, action, pending] = useActionState(daftarPelayan, null)

  return (
    <form action={action} className="form-natal">
      <input type="hidden" name="event_id" value={eventId} />
      {state?.error && <div className="err" role="alert">{state.error}</div>}

      <section className="kartu">
        <header className="kartu-kepala">
          <h2><span className="nomor">1</span> Data Pelayan</h2>
          <p>Satu pendaftaran untuk satu orang.</p>
        </header>

        {perluKode && (
          <>
            <label htmlFor="kode_pelayan">Kode pelayan</label>
            <input id="kode_pelayan" name="kode_pelayan" type="text" required autoComplete="off" />
          </>
        )}

        <label htmlFor="nama">Nama lengkap</label>
        <input id="nama" name="nama" type="text" autoComplete="name" required placeholder="Contoh: I Wayan Kristianto" />

        <div className="lbl">Jenis kelamin</div>
        <div className="pil-dua" role="radiogroup" aria-label="Jenis kelamin">
          <div className="pil">
            <input className="sr" type="radio" id="pl-L" name="gender" value="L" required />
            <label htmlFor="pl-L">Laki-laki</label>
          </div>
          <div className="pil">
            <input className="sr" type="radio" id="pl-P" name="gender" value="P" required />
            <label htmlFor="pl-P">Perempuan</label>
          </div>
        </div>

        <InputWA id="wa" name="wa" required label="Nomor WhatsApp Aktif" />

        <label htmlFor="bidang">Bidang pelayanan</label>
        <input id="bidang" name="bidang" type="text" required placeholder="Contoh: Musik, Multimedia, Usher" />
      </section>

      <div className="aksi-kirim">
        <button type="submit" className="kirim" disabled={pending}>
          {pending ? 'Mengirim…' : <>Daftar Sekarang <IkonPanah /></>}
        </button>
      </div>
    </form>
  )
}
