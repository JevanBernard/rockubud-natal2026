import { Logo } from './hero'

// Header lengket bersama untuk halaman publik. chip: keterangan status di kanan (opsional).
export default function Topbar({ chip }: { chip?: { teks: string; jenis: 'buka' | 'tutup' } }) {
  return (
    <header className="topbar">
      <a href="/" className="topbar-merek" aria-label="GBI ROCK Ubud, ke halaman pendaftaran">
        <Logo />
        <span>GBI ROCK UBUD</span>
      </a>
      {chip && <span className={`status-chip ${chip.jenis}`}><i />{chip.teks}</span>}
    </header>
  )
}
