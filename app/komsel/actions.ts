'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/supabase'
import { normalisasiWA, pesanWA } from '@/lib/util'

export type FormState = { error?: string } | null

const KELOMPOK = ['dewasa', 'anak']
const GENDER = ['L', 'P']

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

type Keluarga = { wa?: string; peserta?: { nama?: string; kelompok?: string; gender?: string }[] }

export async function daftarKomsel(_prev: FormState, fd: FormData): Promise<FormState> {
  const eventId = String(fd.get('event_id') ?? '')
  const kode = String(fd.get('kode') ?? '')
  const waRaw = String(fd.get('wa') ?? '').trim()
  const wa = normalisasiWA(waRaw)

  let keluarga: Keluarga[]
  try {
    keluarga = JSON.parse(String(fd.get('keluarga') ?? '[]'))
  } catch {
    return { error: 'Data tidak terbaca. Muat ulang halaman.' }
  }
  if (!Array.isArray(keluarga) || keluarga.length === 0) return { error: 'Isi minimal satu keluarga.' }

  let total = 0
  const bersih: { wa: string; peserta: { nama: string; kelompok: string; gender: string }[] }[] = []
  for (let i = 0; i < keluarga.length; i++) {
    const peserta = (keluarga[i].peserta ?? []).map((p) => ({
      nama: String(p.nama ?? '').trim(),
      kelompok: String(p.kelompok ?? ''),
      gender: String(p.gender ?? ''),
    }))
    if (peserta.length === 0) return { error: `Keluarga ${i + 1}: isi minimal satu orang.` }
    if (peserta.some((p) => p.nama.length < 2)) return { error: `Keluarga ${i + 1}: setiap orang wajib diisi namanya.` }
    if (peserta.some((p) => !KELOMPOK.includes(p.kelompok))) return { error: `Keluarga ${i + 1}: pilih kelompok usia.` }
    if (peserta.some((p) => !GENDER.includes(p.gender))) return { error: `Keluarga ${i + 1}: pilih gender setiap orang.` }
    const waKelRaw = String(keluarga[i].wa ?? '').trim()
    const eKel = pesanWA(waKelRaw)
    if (eKel) return { error: `Keluarga ${i + 1}, nomor WhatsApp: ${eKel}` }
    const waKel = waKelRaw ? normalisasiWA(waKelRaw) : ''
    total += peserta.length
    bersih.push({ wa: waKel, peserta })
  }
  if (total > 200) return { error: 'Terlalu banyak sekaligus. Kirim dalam beberapa kali.' }
  if (!waRaw) return { error: 'Nomor WhatsApp Gembala Komsel wajib diisi.' }
  { const e = pesanWA(waRaw); if (e) return { error: `Nomor WhatsApp Gembala Komsel: ${e}` } }

  const { error } = await db().rpc('daftar_komsel', {
    p_event: eventId,
    p_kode_komsel: kode,
    p_wa: wa,
    p_keluarga: bersih,
  })

  if (error) {
    console.error('[daftarKomsel] rpc gagal:', error)
    const kunci = Object.keys(PESAN).find((k) => error.message.includes(k))
    return { error: kunci ? PESAN[kunci] : 'Terjadi kesalahan. Tidak ada data yang tersimpan, coba lagi.' }
  }

  redirect(`/komsel/${kode}?ok=${bersih.length}`)
}
