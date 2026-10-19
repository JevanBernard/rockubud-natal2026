'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/supabase'
import { normalisasiWA } from '@/lib/util'

export type FormState = { error?: string } | null

const toInt = (v: FormDataEntryValue | null) => {
  const n = parseInt(String(v ?? '0'), 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

const KELOMPOK = ['dewasa', 'anak', 'balita']

const PESAN: Record<string, string> = {
  PENDAFTARAN_TUTUP: 'Pendaftaran sudah ditutup.',
  SUDAH_TERDAFTAR: 'Nomor WhatsApp ini sudah terdaftar. Hubungi panitia jika ingin mengubah data.',
  JUMLAH_KOSONG: 'Isi minimal satu orang yang akan hadir.',
  NAMA_PESERTA_KOSONG: 'Setiap orang yang hadir wajib diisi namanya.',
  EVENT_TIDAK_ADA: 'Acara tidak ditemukan.',
}

export async function daftar(_prev: FormState, fd: FormData): Promise<FormState> {
  const eventId = String(fd.get('event_id') ?? '')
  const wa = normalisasiWA(String(fd.get('wa') ?? ''))
  const kategori = String(fd.get('kategori') ?? '')
  const komselId = toInt(fd.get('komsel_id'))
  const diundang = String(fd.get('diundang_oleh') ?? '').trim()
  const setuju = fd.get('setuju') === 'on'

  const namaList = fd.getAll('peserta_nama').map((v) => String(v).trim())
  const kelompokList = fd.getAll('peserta_kelompok').map((v) => String(v))
  const peserta = namaList.map((nama, i) => ({ nama, kelompok: kelompokList[i] }))

  if (peserta.length === 0) return { error: 'Isi minimal satu orang yang akan hadir.' }
  if (peserta.length > 40) return { error: 'Jumlah terlalu besar. Hubungi panitia untuk rombongan besar.' }
  if (peserta.some((p) => p.nama.length < 2)) return { error: 'Setiap orang yang hadir wajib diisi namanya.' }
  if (peserta.some((p) => !KELOMPOK.includes(p.kelompok))) return { error: 'Pilih kelompok usia untuk setiap orang.' }
  if (wa.length < 10 || wa.length > 15) return { error: 'Nomor WhatsApp tidak valid.' }
  if (kategori !== 'jemaat' && kategori !== 'tamu') return { error: 'Pilih status: jemaat atau tamu.' }
  if (kategori === 'jemaat' && !komselId) return { error: 'Pilih komsel Anda.' }
  if (!setuju) return { error: 'Centang persetujuan penggunaan data.' }

  const { data, error } = await db().rpc('daftar_hadir', {
    p_event: eventId,
    p_nama: peserta[0].nama, // orang pertama = pendaftar / perwakilan
    p_wa: wa,
    p_kategori: kategori,
    p_komsel: kategori === 'jemaat' ? komselId : null,
    p_diundang: kategori === 'tamu' && diundang ? diundang : null,
    p_bidang: null,
    p_oleh: 'mandiri',
    p_peserta: peserta,
  })

  if (error) {
    const kunci = Object.keys(PESAN).find((k) => error.message.includes(k))
    return { error: kunci ? PESAN[kunci] : 'Terjadi kesalahan. Coba lagi atau hubungi panitia.' }
  }

  const row = Array.isArray(data) ? data[0] : data
  redirect(`/sukses/${row.kode}`)
}
