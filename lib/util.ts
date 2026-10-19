export function normalisasiWA(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('0')) d = '62' + d.slice(1)
  else if (d.startsWith('8')) d = '62' + d
  return d
}

// Format yang diterima dari pengguna: hanya angka, diawali 08, total 10-13 digit
// (mis. 081234567890). Dipakai di browser (peringatan langsung) dan di server (validasi akhir).
export const FORMAT_WA = /^08[1-9][0-9]{7,10}$/

// Mengembalikan pesan kesalahan, atau null jika nomor sudah sesuai.
// Kolom kosong dianggap valid di sini; cek "wajib diisi" dilakukan terpisah.
export function pesanWA(raw: string): string | null {
  if (raw === '') return null
  if (/\D/.test(raw)) return 'Hanya boleh angka. Jangan pakai +, spasi, tanda hubung, atau simbol lain.'
  if (!raw.startsWith('08')) return 'Nomor harus diawali 08 (contoh: 081234567890), bukan +62 atau 62.'
  if (raw.length < 10) return 'Nomor terlalu pendek. Contoh: 081234567890.'
  if (raw.length > 13) return 'Nomor terlalu panjang. Maksimal 13 digit.'
  if (!FORMAT_WA.test(raw)) return 'Format nomor tidak sesuai. Contoh: 081234567890.'
  return null
}
