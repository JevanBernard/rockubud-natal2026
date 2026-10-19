import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { LOKASI_NAMA } from './acara'
import { asal, rekap, type Event, type Reg } from './rekap'

// PDF untuk dicetak: rekap, daftar hadir (dengan kotak centang untuk dicentang manual
// di lokasi, cadangan jika internet bermasalah), dan daftar tunggu.
// Font bawaan PDF hanya mendukung huruf Latin: nama non-Latin akan tampil tidak sempurna.

const MARGIN = 14
const AKSEN: [number, number, number] = [155, 28, 28]

const tgl = (iso: string, opsi: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('id-ID', { ...opsi, timeZone: 'Asia/Makassar' }).format(new Date(iso))

export function buatPdf(ev: Event, regs: Reg[]): Uint8Array {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const lebar = doc.internal.pageSize.getWidth()
  const k = rekap(ev, regs)

  // ---------- Halaman 1: judul + rekap ----------
  doc.setFont('helvetica', 'bold').setFontSize(16)
  doc.text(ev.nama, MARGIN, 18)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(90)
  doc.text(`${tgl(ev.tanggal, { dateStyle: 'full', timeStyle: 'short' })} WITA`, MARGIN, 24)
  doc.text(ev.lokasi || LOKASI_NAMA, MARGIN, 29)
  doc.text(`Diekspor ${tgl(new Date().toISOString(), { dateStyle: 'medium', timeStyle: 'short' })} WITA`, MARGIN, 34)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 40,
    head: [['Kursi (status terdaftar)', 'Terpakai', 'Kuota', 'Sisa']],
    body: [
      ['Dewasa (jemaat + tamu)', k.umumDewasa, ev.kuota_dewasa, ev.kuota_dewasa - k.umumDewasa],
      ['Anak (jemaat + tamu)', k.umumAnak, ev.kuota_anak, ev.kuota_anak - k.umumAnak],
      ['Pelayan', k.pelayan, ev.kuota_pelayan, ev.kuota_pelayan - k.pelayan],
    ],
    theme: 'grid',
    headStyles: { fillColor: AKSEN },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: MARGIN, right: MARGIN },
  })
  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

  autoTable(doc, {
    startY: y1 + 8,
    head: [['Ringkasan', 'Jumlah']],
    body: [
      ['Pendaftaran terdaftar', k.jumlahTerdaftar],
      ['Pendaftaran daftar tunggu', `${k.jumlahTunggu} (${k.tungguOrang} orang)`],
      ['Pendaftaran batal', k.jumlahBatal],
      ['Porsi (dewasa + anak, termasuk pelayan)', k.porsi],
      [`Cadangan ${ev.cadangan_konsumsi_persen}%`, k.cadangan],
      ['Total porsi dipesan', k.totalPorsi],
      ['Sudah check-in', `${k.hadir} orang`],
    ],
    theme: 'grid',
    headStyles: { fillColor: AKSEN },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: MARGIN, right: MARGIN },
  })

  // ---------- Daftar hadir (status terdaftar), urut asal lalu nama ----------
  const terdaftar = regs
    .filter((r) => r.status === 'terdaftar')
    .sort((a, b) => asal(a).localeCompare(asal(b)) || a.nama.localeCompare(b.nama))

  const baris: string[][] = []
  let no = 1
  for (const r of terdaftar) {
    for (const p of r.peserta) {
      baris.push([
        String(no++), p.nama, p.gender ?? '-', p.kelompok === 'anak' ? 'Anak' : p.kelompok === 'dewasa' ? 'Dewasa' : 'Balita',
        asal(r), r.kode_daftar, '',
      ])
    }
  }

  doc.addPage()
  doc.setFont('helvetica', 'bold').setFontSize(13)
  doc.text(`Daftar Hadir (${baris.length} orang)`, MARGIN, 16)

  autoTable(doc, {
    startY: 20,
    head: [['No', 'Nama', 'L/P', 'Usia', 'Komsel / Asal', 'Kode', 'Hadir']],
    body: baris,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 1.6 },
    headStyles: { fillColor: AKSEN },
    columnStyles: { 0: { cellWidth: 10, halign: 'right' }, 2: { cellWidth: 11, halign: 'center' }, 3: { cellWidth: 16 }, 5: { cellWidth: 24 }, 6: { cellWidth: 14 } },
    margin: { left: MARGIN, right: MARGIN },
    // Kotak kosong di kolom "Hadir" untuk dicentang manual
    didDrawCell: (d) => {
      if (d.section === 'body' && d.column.index === 6) {
        const s = 4
        doc.setDrawColor(80).rect(d.cell.x + (d.cell.width - s) / 2, d.cell.y + (d.cell.height - s) / 2, s, s)
      }
    },
  })

  // ---------- Daftar tunggu ----------
  const tunggu = regs.filter((r) => r.status === 'daftar_tunggu').sort((a, b) => a.created_at.localeCompare(b.created_at))
  if (tunggu.length > 0) {
    doc.addPage()
    doc.setFont('helvetica', 'bold').setFontSize(13)
    doc.text(`Daftar Tunggu (${tunggu.length} pendaftaran)`, MARGIN, 16)
    autoTable(doc, {
      startY: 20,
      head: [['Kode', 'Nama perwakilan', 'WhatsApp', 'Komsel / Asal', 'Dewasa', 'Anak', 'Daftar pada']],
      body: tunggu.map((r) => [
        r.kode_daftar, r.nama, r.wa, asal(r), r.jml_dewasa, r.jml_anak,
        tgl(r.created_at, { dateStyle: 'short', timeStyle: 'short' }),
      ]),
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 1.6 },
      headStyles: { fillColor: AKSEN },
      columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: { left: MARGIN, right: MARGIN },
    })
  }

  // ---------- Nomor halaman ----------
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(120)
    doc.text(`${ev.nama}  |  Halaman ${i} / ${total}`, lebar / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
  }

  return new Uint8Array(doc.output('arraybuffer'))
}
