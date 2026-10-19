import { Logo } from '../hero'
import { IkonGrid, IkonKeluar, IkonPdf, IkonScan, IkonSilang, IkonTabel } from '../icons'
import { keluar } from './actions'
import Kerangka from './kerangka'

// Kerangka halaman admin: sidebar kiri (di layar ≤ 960px menjadi laci hamburger) + bilah judul.
export default function AdminShell({
  judul, buka, children,
}: { judul: string; buka?: boolean; children: React.ReactNode }) {
  const side = (
    <aside className="ad-side" id="ad-side" aria-label="Navigasi admin">
      <div className="ad-merek">
        <Logo />
        <div>
          <b>GBI ROCK Ubud</b>
          <span>Panitia Natal 2026</span>
        </div>
        <button type="button" className="ad-tutup" data-tutup aria-label="Tutup menu"><IkonSilang /></button>
      </div>
      {buka !== undefined && (
        <span className={`ad-chip-status ${buka ? 'buka' : 'tutup'}`}>
          <i />{buka ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'}
        </span>
      )}
      <nav className="ad-nav" aria-label="Menu admin">
        <a href="/admin" aria-current="page" className="aktif"><IkonGrid /> Dashboard Rekap</a>
        <a href="/admin/scan"><IkonScan /> Scan Check-In Hari-H</a>
        <a href="/admin/export" download><IkonTabel /> Export Excel (.xlsx)</a>
        <a href="/admin/export-pdf" download><IkonPdf /> Export PDF</a>
      </nav>
      <form action={keluar} className="ad-keluar">
        <button type="submit"><IkonKeluar /> Keluar</button>
      </form>
    </aside>
  )

  return <Kerangka side={side} judul={judul}>{children}</Kerangka>
}
