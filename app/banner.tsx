'use client'

import { useState } from 'react'

// Banner di atas form, seperti header Google Form (rasio 4:1).
// Taruh gambarnya di public/banner.jpg (disarankan 1600 x 400 px).
// Selama file belum ada, banner disembunyikan otomatis.
export default function Banner() {
  const [ada, setAda] = useState(true)
  if (!ada) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="banner" src="/banner.jpg" alt="Banner Natal GBI ROCK Ubud 2026" onError={() => setAda(false)} />
}
