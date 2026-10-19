'use client'

import { useEffect, useRef, useState } from 'react'
import { IkonHamburger } from '../icons'

// Kerangka admin: menyimpan status menu hamburger. Sidebar (side) dirender server dan dilempar ke sini.
// Di layar lebar sidebar selalu tampil; di layar ≤ 960px ia menjadi laci yang dibuka lewat tombol hamburger.
export default function Kerangka({
  side, judul, children,
}: { side: React.ReactNode; judul: string; children: React.ReactNode }) {
  const [buka, setBuka] = useState(false)
  const tombol = useRef<HTMLButtonElement>(null)
  const pernahBuka = useRef(false)

  useEffect(() => {
    if (!buka) {
      if (pernahBuka.current) tombol.current?.focus() // kembalikan fokus ke tombol hamburger
      return
    }
    pernahBuka.current = true
    document.querySelector<HTMLElement>('#ad-side a, #ad-side button')?.focus()
    const tekan = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false) }
    const ubahUkuran = () => { if (window.innerWidth > 960) setBuka(false) }
    document.addEventListener('keydown', tekan)
    window.addEventListener('resize', ubahUkuran)
    const lama = document.body.style.overflow
    document.body.style.overflow = 'hidden' // cegah halaman ikut bergulir di belakang laci
    return () => {
      document.removeEventListener('keydown', tekan)
      window.removeEventListener('resize', ubahUkuran)
      document.body.style.overflow = lama
    }
  }, [buka])

  return (
    <div className={buka ? 'ad menu-buka' : 'ad'}>
      {/* Klik tautan atau tombol tutup di dalam sidebar menutup laci */}
      <div
        className="ad-side-bungkus"
        onClick={(e) => {
          const el = e.target as HTMLElement
          if (el.closest('[data-tutup]') || el.closest('a')) setBuka(false)
        }}
      >
        {side}
      </div>
      <div className="ad-latar" onClick={() => setBuka(false)} aria-hidden="true" />

      <div className="ad-kanan">
        <header className="ad-atas">
          <button
            ref={tombol}
            type="button"
            className="ad-hamburger"
            aria-label={buka ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={buka}
            aria-controls="ad-side"
            onClick={() => setBuka((b) => !b)}
          >
            <IkonHamburger />
          </button>
          <b>{judul}</b>
          <span className="ad-chip-emas">Admin Portal</span>
        </header>
        <main className="ad-isi">{children}</main>
      </div>
    </div>
  )
}
