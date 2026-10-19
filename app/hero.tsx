'use client'

import { useState } from 'react'

// Gambar hero: taruh di public/banner.jpg (disarankan 1600 x 900 px, rasio 16:9).
// Selama file belum ada, yang tampil hanya latar gradasi merah anggur.
export function Hero() {
  const [ada, setAda] = useState(true)
  return (
    <section className="hero" aria-hidden={!ada ? true : undefined}>
      {ada && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/banner.jpg" alt="Ibadah Natal GBI ROCK Ubud 2026" onError={() => setAda(false)} />
      )}
      <div className="hero-shade" />
    </section>
  )
}

// Logo bulat di header: public/logo.png. Bila belum ada, tampil inisial.
export function Logo() {
  const [ada, setAda] = useState(true)
  return (
    <span className="logo">
      {ada ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo.png" alt="Logo GBI ROCK Ubud" onError={() => setAda(false)} />
      ) : (
        <b>GR</b>
      )}
    </span>
  )
}
