// Pesan konfirmasi WhatsApp untuk dikirim MANUAL lewat tautan wa.me
// (tidak ada pengiriman otomatis / pihak ketiga).

type Acara = { nama: string; tanggal: string; lokasi?: string | null }

// Alamat situs publik tanpa garis miring di akhir, mis. https://natal.gbirockubud.org
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

const fmt = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar',
  }).format(new Date(iso)) + ' WITA'

export function pesanKonfirmasi(
  r: { nama: string; kode_daftar: string; status: string },
  ev: Acara,
): string {
  const tunggu = r.status === 'daftar_tunggu'
  return [
    `Shalom ${r.nama},`,
    tunggu
      ? `pendaftaran di ${ev.nama} masuk *DAFTAR TUNGGU*. Panitia akan menghubungi jika ada kursi kosong.`
      : `pendaftaran di ${ev.nama} *berhasil*.`,
    `Kode: *${r.kode_daftar}*`,
    `Waktu: ${fmt(ev.tanggal)}`,
    ...(ev.lokasi ? [`Tempat: ${ev.lokasi}`] : []),
    ...(SITE && !tunggu ? [`QR check-in: ${SITE}/sukses/${r.kode_daftar}`] : []),
    'Simpan pesan ini, kode dipakai saat check-in.',
    'GBI ROCK Ubud',
  ].join('\n')
}

// nomor sudah dinormalisasi (62...), pesan akan di-encode otomatis
export const linkWA = (nomor: string, pesan: string) =>
  `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`
