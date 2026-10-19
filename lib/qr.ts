import QRCode from 'qrcode'

// QR berisi kode pendaftaran apa adanya (mis. NTL-A1B2C3).
// Halaman scan di hari H (Tahap 5) mencari pendaftaran dari kode ini.
// Dibuat di server sebagai data URL, jadi tidak ada library QR yang dikirim ke browser.
export function qrDataUrl(kode: string): Promise<string> {
  return QRCode.toDataURL(kode, { errorCorrectionLevel: 'M', margin: 2, width: 280 })
}
