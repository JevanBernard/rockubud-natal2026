import { db } from '@/lib/supabase'

// Logika check-in bersama: dipakai halaman scan (/admin/scan) dan dashboard (/admin).
// Hanya dipanggil dari server action yang sudah memeriksa login admin.
//
// batal=false: tandai hadir (tidak menimpa jam hadir yang sudah ada).
// batal=true : hapus tanda hadir (salah scan / salah centang).
export async function terapkanCheckIn(
  regId: string,
  pesertaIds: string[],
  batal: boolean,
): Promise<{ error: string } | { ok: true; jumlah: number }> {
  const sb = db()
  const { data: reg } = await sb.from('registrations').select('id, status').eq('id', regId).maybeSingle()
  if (!reg) return { error: 'Pendaftaran tidak ditemukan.' }
  if (reg.status !== 'terdaftar') {
    return { error: reg.status === 'daftar_tunggu' ? 'Pendaftaran ini masih daftar tunggu, belum dapat kursi.' : 'Pendaftaran ini sudah dibatalkan.' }
  }
  if (pesertaIds.length === 0) return { error: 'Pilih minimal satu orang.' }

  const sekarang = new Date().toISOString()
  // registration_id ikut difilter supaya id dari pendaftaran lain tidak bisa ikut berubah
  const upd = sb.from('peserta').update({ checked_in_at: batal ? null : sekarang }).eq('registration_id', regId).in('id', pesertaIds)
  const { data, error } = await (batal ? upd : upd.is('checked_in_at', null)).select('id')
  if (error) return { error: 'Gagal menyimpan check-in. Coba lagi.' }

  const { count } = await sb
    .from('peserta').select('id', { count: 'exact', head: true })
    .eq('registration_id', regId).not('checked_in_at', 'is', null)
  await sb.from('registrations').update({ checked_in_at: (count ?? 0) > 0 ? sekarang : null }).eq('id', regId)

  return { ok: true, jumlah: data?.length ?? 0 }
}
