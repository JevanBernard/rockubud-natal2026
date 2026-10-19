import { adaAdmin } from '@/lib/admin'
import { ambilData } from '@/lib/admin-data'
import { buatPdf } from '@/lib/pdf'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await adaAdmin())) return new Response('Tidak diizinkan', { status: 401 })
  const data = await ambilData()
  if (!data) return new Response('Acara belum tersedia', { status: 404 })

  const pdf = buatPdf(data.ev, data.regs)
  const tgl = new Date().toISOString().slice(0, 10)
  return new Response(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pendaftaran-natal-${tgl}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
