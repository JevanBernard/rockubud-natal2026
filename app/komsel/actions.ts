'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/supabase'
import { normalisasiWA } from '@/lib/util'

export type FormState = { error?: string } | null

const KELOMPOK = ['dewasa', 'anak', 'balita']

const PESAN: Record<string, string> = {
  PENDAFTARAN_TUTUP: 'Pendaftaran sudah ditutup.',
  JUMLAH_KOSONG: 'Isi minimal satu keluarga dan satu orang.',
  NAMA_PESERTA_KOSONG: 'Setiap orang yang hadir wajib diisi namanya.',
  KOMSEL_TIDAK_ADA: 'Kode komsel tidak dikenal.',
  EVENT_TIDAK_ADA: 'Acara tidak ditemukan.',
}

export async function masukKomsel(fd: FormData) {
  const kode = String(fd.get('kode') ?? '').trim().toUpperCase()
  if (!/^KOM-\d{2}$/.test(kode)) redirect('/komsel?salah=1')
  redirect(`/komsel/${kode}`)
}

type Keluarga = { wa?: string; peserta?: { nama?: string; kelompok?: string }[] }

export async function daftarKomsel(_prev: FormState, fd: FormData): Promise<FormState> {
  const eventId = String(fd.get('event_id') ?? '')
  const kode = String(fd.get('kode') ?? '')
  const wa = normalisasiWA(String(fd.get('wa') ?? ''))
  const setuju = fd.get('setuju') === 'on'

  let keluarga: Keluarga[]
  try {
    keluarga = JSON.parse(String(fd.get('keluarga') ?? '[]'))
  } catch {
    return { error: 'Data tidak terbaca. Muat ulang halaman.' }
  }
  if (!Array.isArray(keluarga) || keluarga.length === 0) return { error: 'Isi minimal satu keluarga.' }

  let total = 0
  const bersih: { wa: string; peserta: { nama: string; kelompok: string }[] }[] = []
  for (let i = 0; i < keluarga.length; i++) {
    const peserta = (keluarga[i].peserta ?? []).map((p) => ({
      nama: String(p.nama ?? '').trim(),
      kelompok: String(p.kelompok ?? ''),
    }))
    if (peserta.length === 0) return { error: `Keluarga ${i + 1}: isi minimal satu orang.` }
    if (peserta.some((p) => p.nama.length < 2)) return { error: `Keluarga ${i + 1}: setiap orang wajib diisi namanya.` }
    if (peserta.some((p) => !KELOMPOK.includes(p.kelompok))) return { error: `Keluarga ${i + 1}: pilih kelompok usia.` }
    const waKel = keluarga[i].wa ? normalisasiWA(String(keluarga[i].wa)) : ''
    if (waKel && (waKel.length < 10 || waKel.length > 15)) return { error: `Keluarga ${i + 1}: nomor WhatsApp tidak valid.` }
    total += peserta.length
    bersih.push({ wa: waKel, peserta })
  }
  if (total > 200) return { error: 'Terlalu banyak sekaligus. Kirim dalam beberapa kali.' }
  if (wa.length < 10 || wa.length > 15) return { error: 'Nomor WhatsApp Gembala Komsel tidak valid.' }
  if (!setuju) return { error: 'Centang persetujuan penggunaan data.' }

  const { error } = await db().rpc('daftar_komsel', {
    p_event: eventId,
    p_kode_komsel: kode,
    p_wa: wa,
    p_keluarga: bersih,
  })

  if (error) {
    const kunci = Object.keys(PESAN).find((k) => error.message.includes(k))
    return { error: kunci ? PESAN[kunci] : 'Terjadi kesalahan. Tidak ada data yang tersimpan, coba lagi.' }
  }

  redirect(`/komsel/${kode}?ok=${bersih.length}`)
}
