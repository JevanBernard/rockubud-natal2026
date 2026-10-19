'use server'

import { db } from '@/lib/supabase'
import { wajibAdmin } from '@/lib/admin'
import { terapkanCheckIn } from '@/lib/checkin'

export type PesertaScan = { id: string; nama: string; kelompok: string; checked_in_at: string | null }
export type HasilScan = {
  id: string
  kode: string
  nama: string
  status: 'terdaftar' | 'daftar_tunggu' | 'batal'
  asal: string
  peserta: PesertaScan[]
}
export type Hitung = { hadir: number; total: number }
export type Balasan = { error: string } | { reg: HasilScan; hitung: Hitung }

// Terima kode apa adanya, atau teks yang memuat kode (mis. tautan /sukses/NTL-XXXXXX)
function ambilKode(raw: string): string | null {
  const m = raw.toUpperCase().match(/NTL-[0-9A-F]{6}/)
  return m ? m[0] : null
}

async function hitung(eventId: string): Promise<Hitung> {
  const sb = db()
  const dasar = () =>
    sb.from('peserta')
      .select('id, registrations!inner(event_id, status)', { count: 'exact', head: true })
      .eq('registrations.event_id', eventId)
      .eq('registrations.status', 'terdaftar')
  const [total, hadir] = await Promise.all([dasar(), dasar().not('checked_in_at', 'is', null)])
  return { hadir: hadir.count ?? 0, total: total.count ?? 0 }
}

async function muat(where: { kode?: string; id?: string }): Promise<Balasan> {
  const sb = db()
  let q = sb
    .from('registrations')
    .select('id, event_id, kode_daftar, nama, status, kategori, diundang_oleh, bidang_pelayanan, komsel(nama), peserta(id, nama, kelompok, checked_in_at)')
  q = where.kode ? q.eq('kode_daftar', where.kode) : q.eq('id', where.id!)
  const { data: r } = await q.maybeSingle()
  if (!r) return { error: 'Kode tidak ditemukan.' }

  const row = r as unknown as {
    id: string; event_id: string; kode_daftar: string; nama: string
    status: HasilScan['status']; kategori: string; diundang_oleh: string | null
    bidang_pelayanan: string | null; komsel: { nama: string } | null; peserta: PesertaScan[]
  }
  const asal =
    row.kategori === 'jemaat' ? (row.komsel?.nama ?? 'Jemaat')
    : row.kategori === 'tamu' ? 'Tamu'
    : `Pelayan${row.bidang_pelayanan ? ` · ${row.bidang_pelayanan}` : ''}`

  const urutan = { dewasa: 0, anak: 1, balita: 2 } as Record<string, number>
  return {
    reg: {
      id: row.id, kode: row.kode_daftar, nama: row.nama, status: row.status, asal,
      peserta: [...row.peserta].sort((a, b) => (urutan[a.kelompok] ?? 9) - (urutan[b.kelompok] ?? 9)),
    },
    hitung: await hitung(row.event_id),
  }
}

export async function cariKode(raw: string): Promise<Balasan> {
  await wajibAdmin()
  const kode = ambilKode(String(raw ?? ''))
  if (!kode) return { error: 'Format kode tidak dikenal. Contoh: NTL-A1B2C3.' }
  return muat({ kode })
}

// batal=false: tandai hadir. batal=true: batalkan tanda hadir (salah scan).
export async function checkIn(regId: string, pesertaIds: string[], batal: boolean): Promise<Balasan> {
  await wajibAdmin()
  const hasil = await terapkanCheckIn(regId, pesertaIds, batal)
  if ('error' in hasil) return { error: hasil.error }
  return muat({ id: regId })
}

// Angka hadir/total saat halaman scan dibuka (sebelum ada yang di-scan)
export async function hitungAwal(): Promise<Hitung | null> {
  await wajibAdmin()
  const { data: ev } = await db().from('events').select('id').order('tanggal').limit(1).maybeSingle()
  return ev ? hitung(ev.id) : null
}
