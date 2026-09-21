-- =====================================================================
--  57_master_faskes_puskesmas_purbalingga.sql
--  Modul Absensi Cerdas Tanpa Batas Radius:
--  1. Menambahkan kolom 'tipe' pada master_lokasi_absensi
--  2. Seeding 22 Puskesmas se-Kabupaten Purbalingga dan RS Rujukan
--  3. Dukungan metadata lokasi pada tabel pegawai_absensi
-- =====================================================================

-- 1. Tambah kolom tipe ke master_lokasi_absensi jika belum ada
alter table public.master_lokasi_absensi
add column if not exists tipe text not null default 'LAB';

-- Tambahkan index tipe
create index if not exists idx_master_lokasi_tipe on public.master_lokasi_absensi (tipe);

-- 2. Pastikan kolom pendukung di pegawai_absensi tersedia
alter table public.pegawai_absensi
add column if not exists tipe_lokasi_masuk text,
add column if not exists tipe_lokasi_keluar text,
add column if not exists lat_masuk numeric(10, 7),
add column if not exists lng_masuk numeric(10, 7),
add column if not exists lat_keluar numeric(10, 7),
add column if not exists lng_keluar numeric(10, 7);

-- 3. Update lokasi Lab Pusat
update public.master_lokasi_absensi
set tipe = 'LAB',
    nama = 'Laboratorium Medis Utama (Pusat)',
    alamat = 'Jl. D.I. Panjaitan No.94, Purbalingga Lor, Purbalingga',
    latitude = -7.3872280,
    longitude = 109.3637170,
    radius_meter = 150
where nama like '%Laboratorium Medis Utama%' or id = (select id from public.master_lokasi_absensi order by created_at asc limit 1);

-- 4. Seeding 22 Puskesmas se-Kabupaten Purbalingga & RS Rujukan
insert into public.master_lokasi_absensi (nama, alamat, latitude, longitude, radius_meter, aktif, tipe)
values
  -- PUSKESMAS WILAYAH KOTA & SEKITARNYA
  ('Puskesmas Purbalingga', 'Jl. Jend. Soedirman No. 165, Purbalingga', -7.3895000, 109.3615000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Bojong', 'Jl. Letjen S. Parman No. 2, Bojong, Purbalingga', -7.4042000, 109.3668000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Kalimanah', 'Jl. Mayjen Sungkono, Selabaya, Kalimanah', -7.4025000, 109.3362000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Padamara', 'Jl. Raya Padamara, Padamara, Purbalingga', -7.3789000, 109.3245000, 250, true, 'PUSKESMAS'),

  -- PUSKESMAS WILAYAH UTARA & TIMUR
  ('Puskesmas Kutasari', 'Jl. Raya Kutasari No. 1, Kutasari, Purbalingga', -7.3621000, 109.3378000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Karangcegak', 'Desa Karangcegak, Kec. Kutasari, Purbalingga', -7.3480000, 109.3210000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Bojongsari', 'Jl. Raya Bojongsari, Bojongsari, Purbalingga', -7.3524000, 109.3652000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Mrebet', 'Jl. Raya Mangunnegara, Mrebet, Purbalingga', -7.3315000, 109.3551000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Bobotsari', 'Jl. Kolonel Sugiri, Bobotsari, Purbalingga', -7.3056000, 109.3784000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Karangreja', 'Jl. Raya Karangreja, Karangreja, Purbalingga', -7.2625000, 109.3289000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Serang', 'Desa Serang, Kec. Karangreja, Purbalingga', -7.2415000, 109.2882000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Karanganyar', 'Jl. Raya Karanganyar, Karanganyar, Purbalingga', -7.3182000, 109.4312000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Kertanegara', 'Jl. Raya Kertanegara, Kertanegara, Purbalingga', -7.3087000, 109.4678000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Karangmoncol', 'Jl. Raya Karangmoncol, Pekiringan, Karangmoncol', -7.2912000, 109.4895000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Rembang', 'Jl. Raya Bantarbarang, Rembang, Purbalingga', -7.2885000, 109.5281000, 250, true, 'PUSKESMAS'),

  -- PUSKESMAS WILAYAH SELATAN & TENGGARA
  ('Puskesmas Kaligondang', 'Jl. Raya Kaligondang, Kaligondang, Purbalingga', -7.3882000, 109.4185000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Pengadegan', 'Jl. Raya Pengadegan, Pengadegan, Purbalingga', -7.3712000, 109.4821000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Kejobong', 'Jl. Raya Kejobong, Kejobong, Purbalingga', -7.4125000, 109.4985000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Bukateja', 'Jl. Raya Purwandaru, Bukateja, Purbalingga', -7.4412000, 109.4325000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Kutawis', 'Desa Kutawis, Kec. Bukateja, Purbalingga', -7.4285000, 109.4562000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Kemangkon', 'Jl. Raya Panican, Kemangkon, Purbalingga', -7.4582000, 109.3782000, 250, true, 'PUSKESMAS'),
  ('Puskesmas Karangjambe', 'Desa Karangjambe, Kec. Kemangkon, Purbalingga', -7.4395000, 109.3512000, 250, true, 'PUSKESMAS'),

  -- RUMAH SAKIT UTAMA PURBALINGGA
  ('RSUD dr. R. Goeteng Taroenadibrata', 'Jl. Tentara Pelajar No.22, Kembaran Kulon, Purbalingga', -7.3948000, 109.3565000, 300, true, 'RS'),
  ('RS Harapan Ibu Purbalingga', 'Jl. Mayjen Soengkono KM.1, Blater, Kalimanah', -7.4082000, 109.3495000, 300, true, 'RS'),
  ('RS PKU Muhammadiyah Bobotsari', 'Jl. Raya Bobotsari, Bobotsari, Purbalingga', -7.3025000, 109.3812000, 300, true, 'RS'),
  ('RSU Nirmala Purbalingga', 'Jl. Mayjen Sungkono, Kalimanah, Purbalingga', -7.4015000, 109.3452000, 300, true, 'RS')
on conflict do nothing;
