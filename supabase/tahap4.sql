-- Tahap 4: dashboard admin.
-- Jalankan SETELAH schema.sql dan tahap2.sql. Aman dijalankan ulang.

-- Ubah status pendaftaran (terima dari daftar tunggu / batalkan) secara atomik.
-- Baris event dikunci seperti di daftar_hadir, jadi tidak bisa bentrok dengan
-- pendaftaran baru. Menaikkan ke 'terdaftar' ditolak (KUOTA_PENUH) jika melewati
-- kuota, kecuali p_paksa = true (keputusan sadar panitia).
create or replace function ubah_status(
  p_reg uuid, p_status text, p_paksa boolean default false
) returns text
language plpgsql security definer set search_path = public as $$
declare
  r registrations%rowtype;
  ev events%rowtype;
  t_d int; t_a int; t_p int;
begin
  if p_status not in ('terdaftar','daftar_tunggu','batal') then
    raise exception 'STATUS_TIDAK_VALID';
  end if;

  select * into r from registrations where id = p_reg;
  if not found then raise exception 'REG_TIDAK_ADA'; end if;

  select * into ev from events where id = r.event_id for update;
  select * into r from registrations where id = p_reg;   -- baca ulang setelah kunci

  if p_status = 'terdaftar' and r.status <> 'terdaftar' and not p_paksa then
    if r.kategori in ('jemaat','tamu') then
      select coalesce(sum(jml_dewasa),0), coalesce(sum(jml_anak),0) into t_d, t_a
        from registrations
       where event_id = r.event_id and registrations.status = 'terdaftar'
         and kategori in ('jemaat','tamu');
      if t_d + r.jml_dewasa > ev.kuota_dewasa or t_a + r.jml_anak > ev.kuota_anak then
        raise exception 'KUOTA_PENUH';
      end if;
    else
      select coalesce(sum(jml_dewasa),0) into t_p
        from registrations
       where event_id = r.event_id and registrations.status = 'terdaftar'
         and kategori = 'pelayan';
      if t_p + r.jml_dewasa > ev.kuota_pelayan then raise exception 'KUOTA_PENUH'; end if;
    end if;
  end if;

  update registrations set status = p_status where id = p_reg;
  return p_status;
end $$;

revoke all on function ubah_status(uuid,text,boolean) from public, anon, authenticated;
