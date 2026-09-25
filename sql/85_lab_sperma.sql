-- =====================================================================
--  RME Laboratorium Medis Utama - ANALISA SPERMA LABORATORIUM
--  Berkas: sql/85_lab_sperma.sql
--
--  Tabel dan fungsi untuk menyimpan dan mencetak hasil Analisa Sperma
--  (analisis sperma/semen) per lembar lab_permintaan.
--
--  Item Analisa Sperma:
--    Urut 110     : Keterangan Klinik
--    Urut 120     : KETERANGAN SAMPEL (Header)
--    Urut 121-125 : Item Keterangan Sampel (Pemeriksaan Ke, Lama Menikah, dll)
--    Urut 200     : SEMEN (Header)
--    Urut 201-206 : Item Makroskopis Semen (Kelengkapan, Penampilan, Volume, dll)
--    Urut 220     : SPERMA (Header)
--    Urut 221-232 : Item Mikroskopis Sperma (Jumlah, Gerakan, Bentuk, Vitalitas, dll)
--    Urut 250     : SEL-SEL LAIN (Header)
--    Urut 251-254 : Item Sel-sel Lain (Leukosit, Eritrosit, Bakteri, Debris)
--    Urut 270     : Komentar
--
--  Jalankan SETELAH 73_lab_anamnesa.sql
-- =====================================================================

create table if not exists lab_sperma (
  id             uuid primary key default gen_random_uuid(),
  permintaan_id  uuid not null references lab_permintaan(id) on delete cascade,
  urutan         integer not null,
  parameter      text not null,
  hasil          text,                       -- Nilai hasil input manual
  satuan         text,                       -- ml, 10^6/ml, %, dll
  bawah          text,                       -- Nilai rujukan bawah
  tengah         text,                       -- Nilai rujukan tengah
  atas           text,                       -- Nilai rujukan atas
  flag           text default '1',           -- Tingkat flag (1=Header/Utama, 2=Item, 3=Sub-item)
  keterangan     text,                       -- Catatan tambahan
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (permintaan_id, urutan)
);

create index if not exists idx_lab_sperma_permintaan on lab_sperma (permintaan_id);

-- Trigger updated_at
drop trigger if exists trg_updated_lab_sperma on lab_sperma;
create trigger trg_updated_lab_sperma before update on lab_sperma
for each row execute function set_updated_at();

comment on table lab_sperma is
  'Hasil pencatatan analisa sperma dan karakteristik semen per lab_permintaan.';

-- RLS
alter table lab_sperma enable row level security;

drop policy if exists lab_sperma_select on lab_sperma;
create policy lab_sperma_select on lab_sperma for select to authenticated using (true);

drop policy if exists lab_sperma_insert on lab_sperma;
create policy lab_sperma_insert on lab_sperma for insert to authenticated
  with check (public.boleh_lab());

drop policy if exists lab_sperma_update on lab_sperma;
create policy lab_sperma_update on lab_sperma for update to authenticated
  using (public.boleh_lab());

drop policy if exists lab_sperma_delete on lab_sperma;
create policy lab_sperma_delete on lab_sperma for delete to authenticated
  using (public.boleh_lab());

grant select, insert, update, delete on lab_sperma to authenticated;

-- Fungsi simpan batch (upsert)
create or replace function public.lab_sperma_simpan(
  p_permintaan_id uuid,
  p_items jsonb     -- [{urutan, parameter, hasil, satuan, bawah, tengah, atas, flag, keterangan}, ...]
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
    insert into lab_sperma (
      permintaan_id, urutan, parameter, hasil, satuan, bawah, tengah, atas, flag, keterangan
    )
    values (
      p_permintaan_id,
      (item->>'urutan')::integer,
      coalesce(item->>'parameter', item->>'nama_item', ''),
      item->>'hasil',
      item->>'satuan',
      item->>'bawah',
      item->>'tengah',
      item->>'atas',
      coalesce(item->>'flag', '1'),
      item->>'keterangan'
    )
    on conflict (permintaan_id, urutan) do update set
      parameter  = excluded.parameter,
      hasil      = excluded.hasil,
      satuan     = excluded.satuan,
      bawah      = excluded.bawah,
      tengah     = excluded.tengah,
      atas       = excluded.atas,
      flag       = excluded.flag,
      keterangan = excluded.keterangan,
      updated_at = now();
  end loop;
end $$;

grant execute on function public.lab_sperma_simpan(uuid, jsonb) to authenticated;

comment on function public.lab_sperma_simpan is
  'Upsert batch butir analisa sperma untuk satu lab_permintaan.';

-- =====================================================================
--  SEEDING MASTER DATA: ref_lab (Analisa Sperma)
-- =====================================================================
insert into ref_lab (kode, nama, kelompok, satuan, jenis_nilai, nilai_normal, min_normal, max_normal, desimal, urutan, aktif)
values
  ('SPM_ALL', 'Analisa Sperma', 'Analisa Sperma', '', 'TEKS', 'Normal', null, null, 1, 100, true),
  ('SPM_KLINIK', 'Keterangan Klinik', 'Analisa Sperma', '', 'TEKS', '-', null, null, 1, 110, true),
  ('SPM_SAMPEL', 'KETERANGAN SAMPEL', 'Analisa Sperma', '', 'TEKS', '-', null, null, 1, 120, true),
  ('SPM_KE', 'Pemeriksaan Ke', 'Analisa Sperma', '', 'TEKS', '1', null, null, 1, 121, true),
  ('SPM_NIKAH', 'Lama Menikah', 'Analisa Sperma', 'tahun', 'TEKS', '-', null, null, 1, 122, true),
  ('SPM_PANTANG', 'Lama Berpantang', 'Analisa Sperma', 'hari', 'TEKS', '2 - 7 Hari', null, null, 1, 123, true),
  ('SPM_JAM_KELUAR', 'Pengeluaran Jam', 'Analisa Sperma', 'WIB', 'TEKS', '-', null, null, 1, 124, true),
  ('SPM_JAM_PERIKSA', 'Pemeriksaan Jam', 'Analisa Sperma', 'WIB', 'TEKS', '-', null, null, 1, 125, true),
  ('SPM_SEMEN', 'SEMEN', 'Analisa Sperma', '', 'TEKS', '-', null, null, 1, 200, true),
  ('SPM_LENGKAP', '1. Kelengkapan Sampel', 'Analisa Sperma', 'L/TL', 'TEKS', 'Lengkap', null, null, 1, 201, true),
  ('SPM_RUPA', '2. Penampilan', 'Analisa Sperma', 'N/Abn', 'TEKS', 'Putih Mutiara / "Grey-Opalescent"', null, null, 1, 202, true),
  ('SPM_KENTAL', '3. Kekentalan', 'Analisa Sperma', 'N/Abn', 'TEKS', 'Tetesan Kecil (<2 cm)', null, null, 1, 203, true),
  ('SPM_CAIR', '4. Pencairan', 'Analisa Sperma', 'N/Abn', 'TEKS', '<60 Menit', null, null, 1, 204, true),
  ('SPM_PH', '5. pH', 'Analisa Sperma', '', 'ANGKA', '7,2 - 7,8', 7.2, 7.8, 1, 205, true),
  ('SPM_VOL', '6. Volume', 'Analisa Sperma', 'ml', 'ANGKA', '1,5 - 6,8', 1.5, 6.8, 1, 206, true),
  ('SPM_SPERMA', 'SPERMA', 'Analisa Sperma', '', 'TEKS', '-', null, null, 1, 220, true),
  ('SPM_JML', '1. Jumlah Sperma', 'Analisa Sperma', '', 'TEKS', '-', null, null, 1, 221, true),
  ('SPM_KONS', 'a. Konsentrasi', 'Analisa Sperma', '10^6/ml', 'ANGKA', '15,0 - 213,0', 15.0, 213.0, 1, 222, true),
  ('SPM_TOT', 'b. Jumlah Total (Kons x Vol)', 'Analisa Sperma', '10^6/ejk', 'ANGKA', '39,0 - 802,0', 39.0, 802.0, 1, 223, true),
  ('SPM_GERAK', '2. Gerakan Sperma', 'Analisa Sperma', '', 'TEKS', '-', null, null, 1, 224, true),
  ('SPM_PR', 'a. Bergerak Progresif (PR)', 'Analisa Sperma', '%', 'ANGKA', '32,0 - 72,0', 32.0, 72.0, 0, 225, true),
  ('SPM_TP', 'b. Bergerak Tidak Progresif(TP)', 'Analisa Sperma', '%', 'ANGKA', '1,0 - 18,0', 1.0, 18.0, 0, 226, true),
  ('SPM_MOT', 'c. Total Bergerak(PR+TP)', 'Analisa Sperma', '%', 'ANGKA', '40,0 - 78,0', 40.0, 78.0, 0, 227, true),
  ('SPM_TG', 'd. Tidak Bergerak(TG)', 'Analisa Sperma', '%', 'ANGKA', '22,0 - 59,0', 22.0, 59.0, 0, 228, true),
  ('SPM_BENTUK', '3. Bentuk Sperma', 'Analisa Sperma', '', 'TEKS', '-', null, null, 1, 229, true),
  ('SPM_NORM', 'a. Bentuk Normal', 'Analisa Sperma', '%', 'ANGKA', '4,0 - 44,0', 4.0, 44.0, 0, 230, true),
  ('SPM_VIT', '4. Vitalitas Sperma', 'Analisa Sperma', '%', 'ANGKA', '58,0 - 91,0', 58.0, 91.0, 0, 231, true),
  ('SPM_AGL', '5. Aglutinasi Sperma', 'Analisa Sperma', 'Neg/1-4', 'TEKS', 'Negatif', null, null, 1, 232, true),
  ('SPM_SEL', 'SEL-SEL LAIN', 'Analisa Sperma', '', 'TEKS', '-', null, null, 1, 250, true),
  ('SPM_LEU', '1. Leukosit', 'Analisa Sperma', '10^6/ml', 'ANGKA', '<1.0 (10^6/ml)', null, 1.0, 2, 251, true),
  ('SPM_ERI', '2. Eritrosit', 'Analisa Sperma', 'Neg/Pos', 'TEKS', 'Negatif', null, null, 1, 252, true),
  ('SPM_BAK', '3. Bakteri', 'Analisa Sperma', 'Neg/Pos', 'TEKS', 'Negatif', null, null, 1, 253, true),
  ('SPM_DEBRIS', '4. Lain-lain/Debris', 'Analisa Sperma', 'Neg/Pos', 'TEKS', 'Negatif', null, null, 1, 254, true),
  ('SPM_KOMEN', 'Komentar', 'Analisa Sperma', '', 'TEKS', '-', null, null, 1, 270, true)
on conflict (kode) do update set
  nama         = excluded.nama,
  kelompok     = excluded.kelompok,
  satuan       = excluded.satuan,
  jenis_nilai  = excluded.jenis_nilai,
  nilai_normal = excluded.nilai_normal,
  min_normal   = excluded.min_normal,
  max_normal   = excluded.max_normal,
  desimal      = excluded.desimal,
  urutan       = excluded.urutan,
  aktif        = excluded.aktif;
