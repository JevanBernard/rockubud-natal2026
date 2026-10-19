// Ikon garis sederhana (24x24), warna mengikuti teks sekitarnya.
const dasar = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, viewBox: '0 0 24 24' } as const

export const IkonKalender = () => <svg {...dasar}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
export const IkonPeta = () => <svg {...dasar}><path d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" /><circle cx="12" cy="11" r="3" /></svg>
export const IkonTautan = () => <svg {...dasar}><path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6v6M20 4 10 14" /></svg>
export const IkonInfo = () => <svg {...dasar}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
export const IkonPanah = () => <svg {...dasar}><path d="M5 12h14M13 5l7 7-7 7" /></svg>
export const IkonPlus = () => <svg {...dasar}><path d="M12 5v14M5 12h14" /></svg>
export const IkonHapus = () => <svg {...dasar}><path d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" /></svg>
export const IkonGereja = () => <svg {...dasar}><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" /></svg>
export const IkonTamu = () => <svg {...dasar}><path d="M15 21H3v-1a6 6 0 0 1 12 0v1zm0 0h6v-1a6 6 0 0 0-9-5.2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" /></svg>
export const IkonWA = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163A11.9 11.9 0 0 1 .157 11.89C.16 5.334 5.495 0 12.05 0c3.181 0 6.167 1.24 8.413 3.488a11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
  </svg>
)
