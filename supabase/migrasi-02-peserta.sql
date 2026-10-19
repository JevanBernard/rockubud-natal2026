-- Migrasi untuk database yang SUDAH menjalankan schema.sql versi Tahap 1.
-- Hapus konsumsi & kebutuhan khusus, tambah tabel peserta (nama per orang).
-- Database baru cukup menjalankan schema.sql terbaru, tidak perlu file ini.
-- Jalankan di Supabase: SQL Editor -> paste -> Run

drop view if exists v_kuota;

alter table registrations drop column if exists porsi_dewasa;
alter table registrations drop column if exists porsi_anak;
alter table registrations drop column if exists kebutuhan_khusus;

create table if not exists peserta (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  nama text not null,
  kelompok text not null check (kelompok in ('dewasa','anak','balita')),
  checked_in_at timestamptz
);
create index if not exists idx_peserta_reg on peserta (registration_id);
alter table peserta enable row level security;

-- Setelah ini jalankan ulang bagian VIEW dan FUNGSI di schema.sql
-- (create view v_kuota ... dan drop/create function daftar_hadir).
-- Pendaftaran lama (data uji) tidak punya baris peserta; hapus saja:
--   delete from registrations;
