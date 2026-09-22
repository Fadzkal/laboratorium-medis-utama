-- =====================================================================
--  RME Laboratorium Medis Utama - PEMERIKSAAN FISIK
--  Tabel untuk menyimpan hasil pemeriksaan fisik (medical check-up)
--  per lembar lab_permintaan.
--
--  Item pemeriksaan fisik bersifat tetap (hardcoded di frontend):
--    ID 100-104  : Body Mass Index
--    ID 200-204  : Tanda Vital
--    ID 300-1800 : Sistem organ (Normal/Abnormal)
--    ID 1900     : Kesimpulan
--    ID 2000     : Saran
--
--  Jalankan SETELAH 11_penunjang.sql
-- =====================================================================


-- =====================================================================
--  A. TABEL HASIL PEMERIKSAAN FISIK
-- =====================================================================

create table if not exists lab_fisik (
  id             uuid primary key default uuid_generate_v4(),
  permintaan_id  uuid not null references lab_permintaan(id) on delete cascade,
  item_id        integer not null,           -- ID item (100, 101, 200, dst)
  nama_item      text not null,              -- Snapshot nama saat disimpan
  hasil          text,                       -- Nilai hasil (angka/teks/'0' = Normal)
  unit           text,                       -- Satuan (cm, kg, dll)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (permintaan_id, item_id)
);

create index if not exists idx_lab_fisik_permintaan on lab_fisik (permintaan_id);

-- Trigger updated_at
drop trigger if exists trg_updated_lab_fisik on lab_fisik;
create trigger trg_updated_lab_fisik before update on lab_fisik
for each row execute function set_updated_at();

comment on table lab_fisik is
  'Hasil pemeriksaan fisik (medical check-up) per lembar lab. '
  'Satu baris = satu item pemeriksaan. Item_id merujuk ke daftar '
  'tetap yang didefinisikan di frontend (LabCore.REF_FISIK).';


-- =====================================================================
--  B. ROW LEVEL SECURITY
-- =====================================================================

alter table lab_fisik enable row level security;

-- Semua authenticated boleh SELECT (sama seperti lab_hasil)
drop policy if exists lab_fisik_select on lab_fisik;
create policy lab_fisik_select on lab_fisik for select to authenticated using (true);

-- INSERT/UPDATE: hanya yang punya hak lab
drop policy if exists lab_fisik_insert on lab_fisik;
create policy lab_fisik_insert on lab_fisik for insert to authenticated
  with check (public.boleh_lab());

drop policy if exists lab_fisik_update on lab_fisik;
create policy lab_fisik_update on lab_fisik for update to authenticated
  using (public.boleh_lab());

drop policy if exists lab_fisik_delete on lab_fisik;
create policy lab_fisik_delete on lab_fisik for delete to authenticated
  using (public.boleh_lab());

grant select, insert, update, delete on lab_fisik to authenticated;


-- =====================================================================
--  C. FUNGSI SIMPAN BATCH (UPSERT)
-- =====================================================================
--  Menerima array JSONB berisi item pemeriksaan fisik,
--  lalu upsert ke tabel lab_fisik.

create or replace function public.lab_fisik_simpan(
  p_permintaan_id uuid,
  p_items jsonb     -- [{item_id, nama_item, hasil, unit}, ...]
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  item jsonb;
begin
  -- Validasi: permintaan harus ada dan belum BATAL
  if not exists (
    select 1 from lab_permintaan where id = p_permintaan_id and status <> 'BATAL'
  ) then
    raise exception 'Permintaan lab tidak ditemukan atau sudah dibatalkan.';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    insert into lab_fisik (permintaan_id, item_id, nama_item, hasil, unit)
    values (
      p_permintaan_id,
      (item->>'item_id')::integer,
      item->>'nama_item',
      item->>'hasil',
      item->>'unit'
    )
    on conflict (permintaan_id, item_id) do update set
      hasil = excluded.hasil,
      unit = excluded.unit,
      updated_at = now();
  end loop;
end $$;

grant execute on function public.lab_fisik_simpan(uuid, jsonb) to authenticated;

comment on function public.lab_fisik_simpan is
  'Upsert batch item pemeriksaan fisik untuk satu lab_permintaan.';
