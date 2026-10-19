'use client'

import { useActionState } from 'react'
import { daftarPelayan } from './actions'
import InputWA from '../input-wa'

export default function FormPelayan({ eventId, perluKode }: { eventId: string; perluKode: boolean }) {
  const [state, action, pending] = useActionState(daftarPelayan, null)

  return (
    <form action={action}>
      <input type="hidden" name="event_id" value={eventId} />
      {state?.error && <div className="err">{state.error}</div>}

      <div className="card">
        {perluKode && (
          <>
            <label htmlFor="kode_pelayan">Kode pelayan</label>
            <input id="kode_pelayan" name="kode_pelayan" type="text" required />
          </>
        )}
        <label htmlFor="nama">Nama lengkap</label>
        <input id="nama" name="nama" type="text" autoComplete="name" required />

        <div className="lbl">Gender</div>
        <div className="choice" role="radiogroup" aria-label="Gender">
          <label><input type="radio" name="gender" value="L" required /> Laki-laki</label>
          <label><input type="radio" name="gender" value="P" required /> Perempuan</label>
        </div>

        <InputWA id="wa" name="wa" required />

        <label htmlFor="bidang">Bidang pelayanan</label>
        <input id="bidang" name="bidang" type="text" placeholder="Contoh: Musik, Multimedia, Usher" required />
      </div>

      <button type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Daftar'}</button>
    </form>
  )
}
