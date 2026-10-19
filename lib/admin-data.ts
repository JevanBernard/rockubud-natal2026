import { db } from '@/lib/supabase'

export type Peserta = { nama: string; kelompok: 'dewasa' | 'anak' | 'balita'; checked_in_at: string | null }

export type Reg = {
  id: string
  kode_daftar: string
  nama: string
  wa: string
  kategori: 'jemaat' | 'tamu' | 'pelayan'
  diundang_oleh: string | null
  bidang_pelayanan: string | null
  didaftarkan_oleh: string
  jml_dewasa: number
  jml_anak: number
  jml_balita: number
  status: 'terdaftar' | 'daftar_tunggu' | 'batal'
  checked_in_at: string | null
  created_at: string
  komsel: { nama: string } | null
  peserta: Peserta[]
}

export type Event = {
  id: string
  nama: string
  tanggal: string
  lokasi: string | null
  kuota_dewasa: number
  kuota_anak: number
  kuota_pelayan: number
  cadangan_konsumsi_persen: number
  batas_daftar: string | null
  pendaftaran_dibuka: boolean
}

export async function ambilData() {
  const sb = db()
  const { data: ev } = await sb.from('events').select('*').order('tanggal').limit(1).single()
  if (!ev) return null
  const { data } = await sb
    .from('registrations')
    .select('*, komsel(nama), peserta(nama, kelompok, checked_in_at)')
    .eq('event_id', ev.id)
    .order('created_at', { ascending: false })
    .limit(5000)
  return { ev: ev as Event, regs: (data ?? []) as unknown as Reg[] }
}

// Asal pendaftar dalam satu kolom: komsel / tamu / bidang pelayanan
export function asal(r: Reg): string {
  if (r.kategori === 'jemaat') return r.komsel?.nama ?? '-'
  if (r.kategori === 'tamu') return r.diundang_oleh ? `Tamu (diundang ${r.diundang_oleh})` : 'Tamu'
  return `Pelayan${r.bidang_pelayanan ? ` · ${r.bidang_pelayanan}` : ''}`
}

// Rekap angka untuk dashboard dan sheet Rekap. Hanya status 'terdaftar'.
export function rekap(ev: Event, regs: Reg[]) {
  const t = regs.filter((r) => r.status === 'terdaftar')
  const sum = (f: (r: Reg) => number, rs = t) => rs.reduce((a, r) => a + f(r), 0)
  const umum = t.filter((r) => r.kategori !== 'pelayan')
  const pel = t.filter((r) => r.kategori === 'pelayan')
  const dewasa = sum((r) => r.jml_dewasa)
  const anak = sum((r) => r.jml_anak)
  const porsi = dewasa + anak // balita tidak mendapat porsi
  const cadangan = Math.ceil((porsi * ev.cadangan_konsumsi_persen) / 100)
  return {
    umumDewasa: sum((r) => r.jml_dewasa, umum),
    umumAnak: sum((r) => r.jml_anak, umum),
    pelayan: sum((r) => r.jml_dewasa, pel),
    balita: sum((r) => r.jml_balita),
    porsi, cadangan, totalPorsi: porsi + cadangan,
    jumlahTerdaftar: t.length,
    jumlahTunggu: regs.filter((r) => r.status === 'daftar_tunggu').length,
    jumlahBatal: regs.filter((r) => r.status === 'batal').length,
    tungguOrang: regs.filter((r) => r.status === 'daftar_tunggu').reduce((a, r) => a + r.jml_dewasa + r.jml_anak, 0),
    hadir: t.reduce((a, r) => a + r.peserta.filter((p) => p.checked_in_at).length, 0),
  }
}
