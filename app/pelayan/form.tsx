'use client'

import { useActionState } from 'react'
import { daftarPelayan } from './actions'

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

        <label htmlFor="wa">Nomor WhatsApp</label>
        <input id="wa" name="wa" type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" required />

        <label htmlFor="bidang">Bidang pelayanan</label>
        <input id="bidang" name="bidang" type="text" placeholder="Contoh: Musik, Multimedia, Usher" required />
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
