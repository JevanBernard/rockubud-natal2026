-- Tahap 2: input banyak keluarga oleh Gembala Komsel.
-- Jalankan SETELAH schema.sql (baik database baru maupun lama).
-- Aman dijalankan ulang.

-- p_keluarga: [{"wa":"" (opsional), "peserta":[{"nama":"...","kelompok":"dewasa|anak|balita"}, ...]}, ...]
-- Semua keluarga masuk dalam satu transaksi: kalau satu gagal, tidak ada yang tersimpan.
-- Orang pertama di tiap keluarga menjadi perwakilan keluarga tsb.
create or replace function daftar_komsel(
  p_event uuid, p_kode_komsel text, p_wa text, p_keluarga jsonb
) returns table (nama text, kode text, status text)
language plpgsql security definer set search_path = public as $$
declare
  km komsel%rowtype;
  f jsonb;
  r record;
begin
  select * into km from komsel where komsel.kode = p_kode_komsel;
  if not found then raise exception 'KOMSEL_TIDAK_ADA'; end if;

  if p_keluarga is null or jsonb_typeof(p_keluarga) <> 'array'
     or jsonb_array_length(p_keluarga) = 0 then
    raise exception 'JUMLAH_KOSONG';
  end if;

  for f in select * from jsonb_array_elements(p_keluarga) loop
    select * into r from daftar_hadir(
      p_event,
      f->'peserta'->0->>'nama',
      coalesce(nullif(trim(f->>'wa'), ''), p_wa),
      'jemaat', km.id, null, null, km.kode,
      f->'peserta'
    );
    nama := f->'peserta'->0->>'nama';
    kode := r.kode;
    status := r.status;
    return next;
  end loop;
end $$;

revoke all on function daftar_komsel(uuid,text,text,jsonb) from public, anon, authenticated;
