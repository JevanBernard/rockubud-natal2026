'use client'

import { useEffect, useRef, useState } from 'react'
import { pesanWA } from '@/lib/util'
import { IkonWA } from './icons'

// Kolom nomor WhatsApp dengan peringatan langsung saat mengetik.
// Format: hanya angka, diawali 08 (contoh 081234567890).
export default function InputWA({
  id, name, required, onValue, label = 'Nomor WhatsApp',
}: {
  id: string
  name?: string
  required?: boolean
  onValue?: (v: string) => void
  label?: string
}) {
  const [nilai, setNilai] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const [sudahBlur, setSudahBlur] = useState(false)
  const pesan = pesanWA(nilai)
  // Sedang mengetik angka awal yang masih wajar (0, 08, 081…): jangan dulu protes "terlalu pendek"
  const masihMengetik = /^\d*$/.test(nilai) && nilai.length < 10 && '08'.startsWith(nilai.slice(0, 2))
  const tampilPesan = pesan && (!masihMengetik || sudahBlur) ? pesan : null

  // Cegah kirim form selama format salah (muncul gelembung bawaan browser)
  useEffect(() => { ref.current?.setCustomValidity(pesan ?? '') }, [pesan])

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="wa-field">
      <span className="wa-ikon"><IkonWA /></span>
      <input
        ref={ref}
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="081234567890"
        required={required}
        value={nilai}
        aria-invalid={tampilPesan ? true : undefined}
        aria-describedby={`${id}-info`}
        className={tampilPesan ? 'invalid' : undefined}
        onBlur={() => setSudahBlur(true)}
        onChange={(e) => { setNilai(e.target.value); onValue?.(e.target.value) }}
      />
      </div>
      <div id={`${id}-info`} role="alert" className={tampilPesan ? 'wa-err' : 'wa-hint'}>
        {tampilPesan ?? 'Hanya angka, diawali 08. Contoh: 081234567890'}
      </div>
    </>
  )
}
