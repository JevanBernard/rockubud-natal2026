-- Untuk database yang SUDAH berjalan: tambah gender per orang dan isi lokasi acara.
-- Jalankan di Supabase SQL Editor, LALU jalankan ulang bagian fungsi
-- daftar_hadir di schema.sql (mulai dari "drop function if exists daftar_hadir"
-- sampai "revoke all on function daftar_hadir"), karena fungsi itu kini
-- memeriksa & menyimpan gender.

alter table peserta add column if not exists gender text check (gender in ('L','P'));

update events set lokasi = 'The Westin Resort & Spa Ubud, Bali'
 where lokasi is null or lokasi = '';

-- Nomor WA boleh dipakai berulang: hapus batasan unik pendaftaran mandiri.
-- (Fungsi daftar_hadir di schema.sql juga sudah tidak memakai SUDAH_TERDAFTAR.)
drop index if exists uq_reg_mandiri_wa;
create index if not exists idx_reg_wa on registrations (event_id, wa);

-- Kategori usia kini hanya Dewasa & Anak: jalankan ulang fungsi daftar_hadir di schema.sql
-- (validasi kelompok diperbarui). Kolom balita lama dibiarkan agar data lama tidak rusak.
