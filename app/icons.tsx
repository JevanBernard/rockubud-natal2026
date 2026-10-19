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
export const IkonKamera = () => <svg {...dasar}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
export const IkonUnduh = () => <svg {...dasar}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
export const IkonGrup = () => <svg {...dasar}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" /></svg>
export const IkonCek = () => <svg {...dasar}><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></svg>
export const IkonJam = () => <svg {...dasar}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
export const IkonScan = () => <svg {...dasar}><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" /></svg>
export const IkonKembali = () => <svg {...dasar}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
export const IkonSenter = () => <svg {...dasar}><path d="M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12zM6 5h12M12 12v3" /></svg>
export const IkonBalik = () => <svg {...dasar}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></svg>
export const IkonCari = () => <svg {...dasar}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
export const IkonRiwayat = () => <svg {...dasar}><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2" /></svg>
export const IkonHadir = () => <svg {...dasar}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 11l2 2 4-4" /></svg>
export const IkonSilang = () => <svg {...dasar}><path d="M18 6 6 18M6 6l12 12" /></svg>
export const IkonVerifikasi = () => <svg {...dasar}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z" /><path d="m9 12 2 2 4-4" /></svg>
export const IkonGrid = () => <svg {...dasar}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
export const IkonTabel = () => <svg {...dasar}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></svg>
export const IkonPdf = () => <svg {...dasar}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4" /></svg>
export const IkonKeluar = () => <svg {...dasar}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
export const IkonSetelan = () => <svg {...dasar}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
export const IkonMakan = () => <svg {...dasar}><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M6 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></svg>
export const IkonQR = () => <svg {...dasar}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4" /></svg>
export const IkonPasir = () => <svg {...dasar}><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>
export const IkonMenuBawah = () => <svg {...dasar}><path d="m6 9 6 6 6-6" /></svg>
export const IkonHamburger = () => <svg {...dasar}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
