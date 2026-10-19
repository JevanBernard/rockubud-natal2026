'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/supabase'
import { normalisasiWA, pesanWA } from '@/lib/util'

export type FormState = { error?: string } | null

const PESAN: Record<string, string> = {
  PENDAFTARAN_TUTUP: 'Pendaftaran sudah ditutup.',
  EVENT_TIDAK_ADA: 'Acara tidak ditemukan.',
}

export async function daftarPelayan(_prev: FormState, fd: FormData): Promise<FormState> {
  const eventId = String(fd.get('event_id') ?? '')
  const nama = String(fd.get('nama') ?? '').trim()
  const waRaw = String(fd.get('wa') ?? '').trim()
  const wa = normalisasiWA(waRaw)
  const bidang = String(fd.get('bidang') ?? '').trim()
  const kodeInput = String(fd.get('kode_pelayan') ?? '').trim()
  const gender = String(fd.get('gender') ?? '')

  const kodeBenar = process.env.KODE_PELAYAN
  if (kodeBenar && kodeInput.toUpperCase() !== kodeBenar.toUpperCase()) {
    return { error: 'Kode pelayan salah. Tanyakan ke koordinator pelayanan.' }
  }
  if (nama.length < 2) return { error: 'Nama lengkap wajib diisi.' }
  if (!waRaw) return { error: 'Nomor WhatsApp wajib diisi.' }
  { const e = pesanWA(waRaw); if (e) return { error: `Nomor WhatsApp: ${e}` } }
  if (bidang.length < 2) return { error: 'Isi bidang pelayanan.' }
  if (gender !== 'L' && gender !== 'P') return { error: 'Pilih gender.' }

  const { data, error } = await db().rpc('daftar_hadir', {
    p_event: eventId,
    p_nama: nama,
    p_wa: wa,
    p_kategori: 'pelayan',
    p_komsel: null,
    p_diundang: null,
    p_bidang: bidang,
    p_oleh: 'mandiri',
    p_peserta: [{ nama, kelompok: 'dewasa', gender }],
  })

  if (error) {
    console.error('[daftarPelayan] rpc gagal:', error)
    const kunci = Object.keys(PESAN).find((k) => error.message.includes(k))
    return { error: kunci ? PESAN[kunci] : 'Terjadi kesalahan. Coba lagi atau hubungi panitia.' }
  }

  const row = Array.isArray(data) ? data[0] : data
  redirect(`/sukses/${row.kode}`)
}
