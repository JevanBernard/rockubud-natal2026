'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/supabase'
import { normalisasiWA, pesanWA } from '@/lib/util'

export type FormState = { error?: string } | null

const toInt = (v: FormDataEntryValue | null) => {
  const n = parseInt(String(v ?? '0'), 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

const KELOMPOK = ['dewasa', 'anak']
const GENDER = ['L', 'P']

const PESAN: Record<string, string> = {
  PENDAFTARAN_TUTUP: 'Pendaftaran sudah ditutup.',
  JUMLAH_KOSONG: 'Isi minimal satu orang yang akan hadir.',
  NAMA_PESERTA_KOSONG: 'Nama, kelompok usia, dan gender setiap orang wajib diisi.',
  EVENT_TIDAK_ADA: 'Acara tidak ditemukan.',
}

export async function daftar(_prev: FormState, fd: FormData): Promise<FormState> {
  const eventId = String(fd.get('event_id') ?? '')
  const waRaw = String(fd.get('wa') ?? '').trim()
  const wa = normalisasiWA(waRaw)
  const kategori = String(fd.get('kategori') ?? '')
  const komselId = toInt(fd.get('komsel_id'))

  const namaList = fd.getAll('peserta_nama').map((v) => String(v).trim())
  const kelompokList = fd.getAll('peserta_kelompok').map((v) => String(v))
  const genderList = fd.getAll('peserta_gender').map((v) => String(v))
  const peserta = namaList.map((nama, i) => ({ nama, kelompok: kelompokList[i], gender: genderList[i] }))

  if (peserta.length === 0) return { error: 'Isi minimal satu orang yang akan hadir.' }
  if (peserta.length > 40) return { error: 'Jumlah terlalu besar. Hubungi panitia untuk rombongan besar.' }
  if (peserta.some((p) => p.nama.length < 2)) return { error: 'Setiap orang yang hadir wajib diisi namanya.' }
  if (peserta.some((p) => !KELOMPOK.includes(p.kelompok))) return { error: 'Pilih kelompok usia untuk setiap orang.' }
  if (peserta.some((p) => !GENDER.includes(p.gender))) return { error: 'Pilih gender untuk setiap orang.' }
  if (!waRaw) return { error: 'Nomor WhatsApp wajib diisi.' }
  { const e = pesanWA(waRaw); if (e) return { error: `Nomor WhatsApp: ${e}` } }
  if (kategori !== 'jemaat' && kategori !== 'tamu') return { error: 'Pilih status: jemaat atau tamu.' }
  if (kategori === 'jemaat' && !komselId) return { error: 'Pilih komsel Anda.' }

  const { data, error } = await db().rpc('daftar_hadir', {
    p_event: eventId,
    p_nama: peserta[0].nama, // orang pertama = pendaftar / perwakilan
    p_wa: wa,
    p_kategori: kategori,
    p_komsel: kategori === 'jemaat' ? komselId : null,
    p_diundang: null,
    p_bidang: null,
    p_oleh: 'mandiri',
    p_peserta: peserta,
  })

  if (error) {
    console.error('[daftar] rpc gagal:', error)
    const kunci = Object.keys(PESAN).find((k) => error.message.includes(k))
    return { error: kunci ? PESAN[kunci] : 'Terjadi kesalahan. Coba lagi atau hubungi panitia.' }
  }

  const row = Array.isArray(data) ? data[0] : data
  redirect(`/sukses/${row.kode}`)
}
