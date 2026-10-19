import QRCode from 'qrcode'
import { adaAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// Gambar QR (PNG) untuk satu kode pendaftaran. Hanya untuk admin.
export async function GET(_req: Request, { params }: { params: Promise<{ kode: string }> }) {
  if (!(await adaAdmin())) return new Response('Tidak diizinkan', { status: 401 })
  const { kode } = await params
  const k = kode.toUpperCase()
  if (!/^NTL-[0-9A-F]{6}$/.test(k)) return new Response('Kode tidak valid', { status: 400 })
  const png = await QRCode.toBuffer(k, { errorCorrectionLevel: 'M', margin: 2, width: 300 })
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=3600' },
  })
}
