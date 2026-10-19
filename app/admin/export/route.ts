import ExcelJS from 'exceljs'
import { adaAdmin } from '@/lib/admin'
import { ambilData, asal, rekap } from '@/lib/admin-data'

export const dynamic = 'force-dynamic'

const STATUS = { terdaftar: 'Terdaftar', daftar_tunggu: 'Daftar tunggu', batal: 'Batal' } as const
const waktu = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Makassar' }).format(new Date(iso))
    : ''

function header(ws: ExcelJS.Worksheet) {
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } }
}

export async function GET() {
  if (!(await adaAdmin())) return new Response('Tidak diizinkan', { status: 401 })
  const data = await ambilData()
  if (!data) return new Response('Acara belum tersedia', { status: 404 })
  const { ev, regs } = data

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Pendaftaran Natal GBI ROCK Ubud'

  // --- Rekap (untuk katering & kuota) ---
  const k = rekap(ev, regs)
  const ws0 = wb.addWorksheet('Rekap')
  ws0.columns = [{ width: 38 }, { width: 14 }, { width: 14 }]
  ws0.addRow([ev.nama]).font = { bold: true, size: 14 }
  ws0.addRow(['Diekspor', waktu(new Date().toISOString())])
  ws0.addRow([])
  const sub = ws0.addRow(['Kursi (status terdaftar)', 'Terpakai', 'Kuota'])
  sub.font = { bold: true }
  ws0.addRow(['Dewasa (jemaat + tamu)', k.umumDewasa, ev.kuota_dewasa])
  ws0.addRow(['Anak (jemaat + tamu)', k.umumAnak, ev.kuota_anak])
  ws0.addRow(['Pelayan', k.pelayan, ev.kuota_pelayan])
  ws0.addRow(['Balita (tanpa kursi)', k.balita, ''])
  ws0.addRow([])
  const kons = ws0.addRow(['Konsumsi', 'Jumlah', ''])
  kons.font = { bold: true }
  ws0.addRow(['Porsi (dewasa + anak, termasuk pelayan)', k.porsi, ''])
  ws0.addRow([`Cadangan ${ev.cadangan_konsumsi_persen}%`, k.cadangan, ''])
  ws0.addRow(['Total porsi dipesan', k.totalPorsi, '']).font = { bold: true }
  ws0.addRow([])
  ws0.addRow(['Pendaftaran daftar tunggu (keluarga)', k.jumlahTunggu, ''])
  ws0.addRow(['Orang di daftar tunggu (dewasa+anak)', k.tungguOrang, ''])

  // --- Per komsel ---
  const perKomsel = new Map<string, { kel: number; d: number; a: number; b: number }>()
  for (const r of regs.filter((x) => x.status === 'terdaftar')) {
    const kunci = asal(r).startsWith('Pelayan') ? 'Pelayan' : r.kategori === 'tamu' ? 'Tamu' : asal(r)
    const v = perKomsel.get(kunci) ?? { kel: 0, d: 0, a: 0, b: 0 }
    v.kel++; v.d += r.jml_dewasa; v.a += r.jml_anak; v.b += r.jml_balita
    perKomsel.set(kunci, v)
  }
  const ws1 = wb.addWorksheet('Per Komsel')
  ws1.columns = [
    { header: 'Komsel / Kelompok', width: 26 }, { header: 'Pendaftaran', width: 13 },
    { header: 'Dewasa', width: 10 }, { header: 'Anak', width: 10 }, { header: 'Balita', width: 10 },
  ]
  for (const [nama, v] of [...perKomsel.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    ws1.addRow([nama, v.kel, v.d, v.a, v.b])
  }
  header(ws1)

  // --- Pendaftaran (satu baris per pendaftaran) ---
  const ws2 = wb.addWorksheet('Pendaftaran')
  ws2.columns = [
    { header: 'Kode', width: 13 }, { header: 'Nama perwakilan', width: 26 }, { header: 'WhatsApp', width: 16 },
    { header: 'Kategori', width: 10 }, { header: 'Komsel / Asal', width: 28 }, { header: 'Didaftarkan oleh', width: 16 },
    { header: 'Dewasa', width: 9 }, { header: 'Anak', width: 8 }, { header: 'Balita', width: 8 },
    { header: 'Status', width: 14 }, { header: 'Daftar pada', width: 18 },
  ]
  for (const r of regs) {
    ws2.addRow([
      r.kode_daftar, r.nama, r.wa, r.kategori, asal(r), r.didaftarkan_oleh,
      r.jml_dewasa, r.jml_anak, r.jml_balita, STATUS[r.status], waktu(r.created_at),
    ])
  }
  header(ws2)
  ws2.getColumn(3).numFmt = '@' // nomor WA tetap teks

  // --- Peserta (satu baris per orang) ---
  const ws3 = wb.addWorksheet('Peserta')
  ws3.columns = [
    { header: 'Kode', width: 13 }, { header: 'Nama', width: 28 }, { header: 'Kelompok', width: 10 },
    { header: 'Komsel / Asal', width: 28 }, { header: 'Status', width: 14 }, { header: 'Check-in', width: 18 },
  ]
  for (const r of regs) {
    for (const p of r.peserta) {
      ws3.addRow([r.kode_daftar, p.nama, p.kelompok, asal(r), STATUS[r.status], waktu(p.checked_in_at)])
    }
  }
  header(ws3)

  const buf = await wb.xlsx.writeBuffer()
  const tgl = new Date().toISOString().slice(0, 10)
  return new Response(buf as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="pendaftaran-natal-${tgl}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
