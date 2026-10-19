'use client'

// Tombol kirim form dengan konfirmasi browser: mencegah salah pencet pada aksi yang sulit dibatalkan.
export default function TombolKonfirmasi({
  children, tanya, className,
}: { children: React.ReactNode; tanya: string; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!confirm(tanya)) e.preventDefault() }}>
      {children}
    </button>
  )
}
