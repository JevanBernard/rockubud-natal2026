'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/supabase'
import { COOKIE_ADMIN, MASA_SESI_DETIK, passwordBenar, tokenSesi, wajibAdmin } from '@/lib/admin'

export async function masuk(fd: FormData) {
  const pw = String(fd.get('password') ?? '')
  const token = tokenSesi()
  if (!token) redirect('/admin/login?err=config')
  if (!passwordBenar(pw)) {
    await new Promise((r) => setTimeout(r, 1000)) // perlambat tebak-tebakan
    redirect('/admin/login?err=salah')
  }
  ;(await cookies()).set(COOKIE_ADMIN, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MASA_SESI_DETIK,
  })
  redirect('/admin')
}

export async function keluar() {
  ;(await cookies()).delete(COOKIE_ADMIN)
  redirect('/admin/login')
}

const PESAN: Record<string, string> = {
  KUOTA_PENUH: 'Kuota kategori ini masih penuh. Pakai "Terima (abaikan kuota)" jika memang disengaja.',
  REG_TIDAK_ADA: 'Pendaftaran tidak ditemukan.',
  STATUS_TIDAK_VALID: 'Status tidak valid.',
}

// Hanya izinkan kembali ke halaman /admin (cegah open redirect)
const aman = (p: string) => (p.startsWith('/admin') && !p.startsWith('//') ? p : '/admin')

export async function ubahStatus(fd: FormData) {
  await wajibAdmin()
  const id = String(fd.get('id') ?? '')
  const status = String(fd.get('status') ?? '')
  const paksa = fd.get('paksa') === '1'
  const balik = aman(String(fd.get('balik') ?? '/admin'))
  const sep = balik.includes('?') ? '&' : '?'

  const { error } = await db().rpc('ubah_status', { p_reg: id, p_status: status, p_paksa: paksa })
  if (error) {
    const kunci = Object.keys(PESAN).find((k) => error.message.includes(k))
    redirect(`${balik}${sep}err=${encodeURIComponent(kunci ? PESAN[kunci] : 'Gagal mengubah status.')}`)
  }
  redirect(balik)
}

export async function simpanPengaturan(fd: FormData) {
  await wajibAdmin()
  const eventId = String(fd.get('event_id') ?? '')
  const dibuka = fd.get('pendaftaran_dibuka') === 'on'
  const batasRaw = String(fd.get('batas_daftar') ?? '').trim() // datetime-local, waktu WITA
  const batas = batasRaw ? new Date(`${batasRaw}:00+08:00`) : null
  if (batas && Number.isNaN(batas.getTime())) redirect('/admin?err=' + encodeURIComponent('Format batas pendaftaran tidak valid.'))

  const { error } = await db()
    .from('events')
    .update({ pendaftaran_dibuka: dibuka, batas_daftar: batas ? batas.toISOString() : null })
    .eq('id', eventId)
  if (error) redirect('/admin?err=' + encodeURIComponent('Gagal menyimpan pengaturan.'))
  redirect('/admin?ok=' + encodeURIComponent('Pengaturan tersimpan.'))
}
