-- =====================================================================
--  RME Laboratorium Medis Utama - ANAMNESA PASIEN LABORATORIUM
--  Berkas: sql/73_lab_anamnesa.sql
--
--  Tabel dan fungsi untuk menyimpan dan mencetak hasil Anamnesa
--  (medical check-up / anamnesis) per lembar lab_permintaan.
--
--  Item Anamnesa:
--    Urutan 1       : Keluhan Saat ini
--    Urutan 100     : Riwayat Penyakit Dahulu (Header)
--    Urutan 101-109 : Item RPD (Rawat Inap, TBC, Patah Tulang, dll)
--    Urutan 200     : Riwayat Penyakit Keluarga (Header)
--    Urutan 201-210 : Item RPK (Asma, Jantung, Kencing Manis, dll)
--    Urutan 300     : Kebiasaan (Header)
--    Urutan 301-304 : Item Kebiasaan (Olahraga, Merokok, Alkohol, Kopi)
--
--  Jalankan SETELAH 71_pemeriksaan_fisik.sql
-- =====================================================================

create table if not exists lab_anamnesa (
  id             uuid primary key default uuid_generate_v4(),
  permintaan_id  uuid not null references lab_permintaan(id) on delete cascade,
  urutan         integer not null,
  nama_item      text not null,
  hasil          text,                       -- '0' = Tidak, '1' = Ya, atau teks
  keterangan     text,                       -- Keterangan rinci bebas
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (permintaan_id, urutan)
);

create index if not exists idx_lab_anamnesa_permintaan on lab_anamnesa (permintaan_id);

-- Trigger updated_at
drop trigger if exists trg_updated_lab_anamnesa on lab_anamnesa;
create trigger trg_updated_lab_anamnesa before update on lab_anamnesa
for each row execute function set_updated_at();

comment on table lab_anamnesa is
  'Hasil pencatatan anamnesa (keluhan, riwayat penyakit, kebiasaan) per lab_permintaan.';

-- RLS
alter table lab_anamnesa enable row level security;

drop policy if exists lab_anamnesa_select on lab_anamnesa;
create policy lab_anamnesa_select on lab_anamnesa for select to authenticated using (true);

drop policy if exists lab_anamnesa_insert on lab_anamnesa;
create policy lab_anamnesa_insert on lab_anamnesa for insert to authenticated
  with check (public.boleh_lab());

drop policy if exists lab_anamnesa_update on lab_anamnesa;
create policy lab_anamnesa_update on lab_anamnesa for update to authenticated
  using (public.boleh_lab());

drop policy if exists lab_anamnesa_delete on lab_anamnesa;
create policy lab_anamnesa_delete on lab_anamnesa for delete to authenticated
  using (public.boleh_lab());

grant select, insert, update, delete on lab_anamnesa to authenticated;

-- Fungsi simpan batch (upsert)
create or replace function public.lab_anamnesa_simpan(
  p_permintaan_id uuid,
  p_items jsonb     -- [{urutan, nama_item, hasil, keterangan}, ...]
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  item jsonb;
begin
  if not exists (
    select 1 from lab_permintaan where id = p_permintaan_id and status <> 'BATAL'
  ) then
    raise exception 'Permintaan lab tidak ditemukan atau sudah dibatalkan.';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    insert into lab_anamnesa (permintaan_id, urutan, nama_item, hasil, keterangan)
    values (
      p_permintaan_id,
      (item->>'urutan')::integer,
      item->>'nama_item',
      item->>'hasil',
      item->>'keterangan'
    )
    on conflict (permintaan_id, urutan) do update set
      nama_item = excluded.nama_item,
      hasil = excluded.hasil,
      keterangan = excluded.keterangan,
      updated_at = now();
  end loop;
end $$;

grant execute on function public.lab_anamnesa_simpan(uuid, jsonb) to authenticated;

comment on function public.lab_anamnesa_simpan is
  'Upsert batch butir anamnesa untuk satu lab_permintaan.';
