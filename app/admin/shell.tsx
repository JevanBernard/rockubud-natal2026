import { Logo } from '../hero'
import { IkonGrid, IkonKeluar, IkonPdf, IkonScan, IkonTabel } from '../icons'
import { keluar } from './actions'

// Kerangka halaman admin: sidebar kiri (di layar sempit menjadi bilah atas) + bilah judul.
export default function AdminShell({
  judul, buka, children,
}: { judul: string; buka?: boolean; children: React.ReactNode }) {
  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-merek">
          <Logo />
          <div>
            <b>GBI ROCK Ubud</b>
            <span>Panitia Natal 2026</span>
          </div>
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

      <div className="ad-kanan">
        <header className="ad-atas">
          <b>{judul}</b>
          <span className="ad-chip-emas">Admin Portal</span>
        </header>
        <main className="ad-isi">{children}</main>
      </div>
    </div>
  )
}
