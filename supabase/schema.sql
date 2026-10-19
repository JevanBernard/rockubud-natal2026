-- Skema pendaftaran Natal GBI ROCK Ubud 2026 (Tahap 1)
-- Jalankan di Supabase: SQL Editor -> paste -> Run

create extension if not exists pgcrypto;

-- ============ TABEL ============

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tanggal timestamptz not null,
  lokasi text,
  kuota_dewasa int not null,            -- kursi dewasa jemaat + tamu
  kuota_anak int not null,              -- kursi anak (terpisah dari dewasa)
  kuota_pelayan int not null,           -- kursi pelayan ibadah (terpisah)
  cadangan_konsumsi_persen int not null default 10,
  batas_daftar timestamptz,             -- null = belum ditentukan
  pendaftaran_dibuka boolean not null default true,
  catatan_menu text                     -- diisi setelah menu katering jelas
);

create table if not exists komsel (
  id serial primary key,
  nama text not null unique,
  kode text unique,                     -- kode untuk Gembala Komsel (Tahap 2)
  urutan int not null
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  kode_daftar text not null unique,
  event_id uuid not null references events(id),
  nama text not null,
  wa text not null,
  kategori text not null check (kategori in ('jemaat','tamu','pelayan')),
  komsel_id int references komsel(id),
  diundang_oleh text,
  bidang_pelayanan text,
  didaftarkan_oleh text not null default 'mandiri',  -- 'mandiri' atau kode komsel
  jml_dewasa int not null default 0 check (jml_dewasa >= 0),
  jml_anak int not null default 0 check (jml_anak >= 0),
  jml_balita int not null default 0 check (jml_balita >= 0),
  status text not null default 'terdaftar'
    check (status in ('terdaftar','daftar_tunggu','batal')),
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

-- Satu baris per orang yang hadir (termasuk balita). jml_* di registrations
-- selalu dihitung dari tabel ini oleh daftar_hadir.
create table if not exists peserta (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  nama text not null,
  kelompok text not null check (kelompok in ('dewasa','anak','balita')),
  checked_in_at timestamptz
);
create index if not exists idx_peserta_reg on peserta (registration_id);

-- Cegah pendaftaran mandiri ganda dengan nomor WA yang sama
create unique index if not exists uq_reg_mandiri_wa
  on registrations (event_id, wa)
  where didaftarkan_oleh = 'mandiri' and status <> 'batal';

-- Akses hanya lewat server (service role). Tidak ada policy publik.
alter table events enable row level security;
alter table komsel enable row level security;
alter table registrations enable row level security;
alter table peserta enable row level security;

-- ============ VIEW SISA KUOTA ============

create or replace view v_kuota as
select
  e.id as event_id,
  e.kuota_dewasa, e.kuota_anak, e.kuota_pelayan,
  coalesce(sum(r.jml_dewasa) filter (where r.status='terdaftar' and r.kategori in ('jemaat','tamu')),0)::int as terpakai_dewasa,
  coalesce(sum(r.jml_anak)   filter (where r.status='terdaftar' and r.kategori in ('jemaat','tamu')),0)::int as terpakai_anak,
  coalesce(sum(r.jml_dewasa) filter (where r.status='terdaftar' and r.kategori = 'pelayan'),0)::int as terpakai_pelayan
from events e
left join registrations r on r.event_id = e.id
group by e.id;

-- ============ FUNGSI PENDAFTARAN (ATOMIK) ============
-- Baris event dikunci (FOR UPDATE) sehingga dua pendaftaran bersamaan
-- tidak bisa sama-sama lolos di kursi terakhir.

-- Signature berubah (p_peserta jsonb menggantikan jumlah & porsi): hapus versi lama
drop function if exists daftar_hadir(uuid,text,text,text,int,text,text,text,int,int,int,int,int,text);

-- p_peserta: [{"nama":"...","kelompok":"dewasa|anak|balita"}, ...]
create or replace function daftar_hadir(
  p_event uuid, p_nama text, p_wa text, p_kategori text,
  p_komsel int, p_diundang text, p_bidang text, p_oleh text,
  p_peserta jsonb
) returns table (kode text, status text)
language plpgsql security definer set search_path = public as $$
declare
  ev events%rowtype;
  t_d int; t_a int; t_p int;
  p_dewasa int; p_anak int; p_balita int;
  st text; k text; coba int := 0; reg_id uuid;
begin
  select * into ev from events where id = p_event for update;
  if not found then raise exception 'EVENT_TIDAK_ADA'; end if;

  if not ev.pendaftaran_dibuka
     or (ev.batas_daftar is not null and now() > ev.batas_daftar) then
    raise exception 'PENDAFTARAN_TUTUP';
  end if;

  if p_peserta is null or jsonb_typeof(p_peserta) <> 'array'
     or jsonb_array_length(p_peserta) = 0 then
    raise exception 'JUMLAH_KOSONG';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_peserta) as x(nama text, kelompok text)
     where coalesce(trim(x.nama),'') = ''
        or x.kelompok not in ('dewasa','anak','balita')
  ) then
    raise exception 'NAMA_PESERTA_KOSONG';
  end if;

  select count(*) filter (where kelompok='dewasa'),
         count(*) filter (where kelompok='anak'),
         count(*) filter (where kelompok='balita')
    into p_dewasa, p_anak, p_balita
    from jsonb_to_recordset(p_peserta) as x(nama text, kelompok text);

  if p_kategori in ('jemaat','tamu') then
    select coalesce(sum(jml_dewasa),0), coalesce(sum(jml_anak),0)
      into t_d, t_a
      from registrations
     where event_id = p_event and registrations.status = 'terdaftar'
       and kategori in ('jemaat','tamu');
    if t_d + p_dewasa <= ev.kuota_dewasa and t_a + p_anak <= ev.kuota_anak then
      st := 'terdaftar'; else st := 'daftar_tunggu';
    end if;
  else
    -- pelayan: dihitung per orang lewat jml_dewasa
    select coalesce(sum(jml_dewasa),0) into t_p
      from registrations
     where event_id = p_event and registrations.status = 'terdaftar'
       and kategori = 'pelayan';
    if t_p + p_dewasa <= ev.kuota_pelayan then
      st := 'terdaftar'; else st := 'daftar_tunggu';
    end if;
  end if;

  loop
    k := 'NTL-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into registrations (
        kode_daftar, event_id, nama, wa, kategori, komsel_id, diundang_oleh,
        bidang_pelayanan, didaftarkan_oleh, jml_dewasa, jml_anak, jml_balita, status
      ) values (
        k, p_event, p_nama, p_wa, p_kategori, p_komsel, p_diundang,
        p_bidang, coalesce(p_oleh,'mandiri'), p_dewasa, p_anak, p_balita, st
      ) returning id into reg_id;
      exit;
    exception when unique_violation then
      coba := coba + 1;
      -- bedakan tabrakan kode dengan pendaftaran ganda
      if exists (select 1 from registrations
                  where event_id = p_event and wa = p_wa
                    and didaftarkan_oleh = 'mandiri'
                    and registrations.status <> 'batal') and coalesce(p_oleh,'mandiri') = 'mandiri' then
        raise exception 'SUDAH_TERDAFTAR';
      end if;
      if coba > 5 then raise; end if;
    end;
  end loop;

  insert into peserta (registration_id, nama, kelompok)
  select reg_id, trim(x.nama), x.kelompok
    from jsonb_to_recordset(p_peserta) as x(nama text, kelompok text);

  return query select k, st;
end $$;

revoke all on function daftar_hadir(uuid,text,text,text,int,text,text,text,jsonb) from public, anon, authenticated;

-- ============ DATA AWAL ============

insert into events (nama, tanggal, kuota_dewasa, kuota_anak, kuota_pelayan)
select 'Natal GBI ROCK Ubud 2026', '2026-12-20 09:00:00+08', 150, 75, 50
where not exists (select 1 from events);

insert into komsel (nama, kode, urutan) values
  ('Bangli 2',        'KOM-01', 1),
  ('Batubulan 7',     'KOM-02', 2),
  ('Batubulan 8',     'KOM-03', 3),
  ('Darmasaba 1',     'KOM-04', 4),
  ('Guwang 1',        'KOM-05', 5),
  ('Guwang 2',        'KOM-06', 6),
  ('Kerta 1',         'KOM-07', 7),
  ('Mas 1',           'KOM-08', 8),
  ('Melinggih 1',     'KOM-09', 9),
  ('Peliatan 1',      'KOM-10', 10),
  ('Peliatan 2',      'KOM-11', 11),
  ('Peliatan 3',      'KOM-12', 12),
  ('Pering 1',        'KOM-13', 13),
  ('Tegalalang 1',    'KOM-14', 14),
  ('Belum Berkomsel', null,     15),
  ('Lainnya',         null,     16)
on conflict (nama) do nothing;
