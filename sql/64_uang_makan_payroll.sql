-- =====================================================================
--  RME Laboratorium Medis Utama - PENGGAJIAN, UANG MAKAN & BONUS KARYAWAN
--  Berkas: sql/64_uang_makan_payroll.sql
--
--  Tujuan:
--  1. Menambahkan tarif uang makan harian di tabel pengaturan_absensi
--  2. Menambahkan rincian uang makan dan total transfer di tabel pegawai_bonus
--  3. Menambahkan data rekening bank karyawan di tabel pegawai untuk transfer manual
--  Formula Penggajian: Gaji Pokok + Uang Makan + Bonus = Total Transfer
--  Uang makan dihitung 1 kali per kehadiran lengkap (absen masuk DAN absen pulang)
-- =====================================================================

-- 1. Tambah tarif uang makan pada pengaturan_absensi (default Rp 20.000 / hari kehadiran lengkap)
alter table if exists public.pengaturan_absensi
  add column if not exists tarif_uang_makan integer default 20000;

-- Pastikan record id = 1 terupdate dengan default jika masih null
update public.pengaturan_absensi
set tarif_uang_makan = 20000
where tarif_uang_makan is null;

-- 2. Tambah kolom uang makan dan total transfer pada tabel pegawai_bonus
alter table if exists public.pegawai_bonus
  add column if not exists uang_makan numeric(12,2) default 0,
  add column if not exists hari_uang_makan integer default 0,
  add column if not exists tarif_uang_makan integer default 20000,
  add column if not exists total_gaji_transfer numeric(12,2) default 0;

-- 3. Tambah kolom data rekening bank pada tabel pegawai (untuk keperluan transfer manual oleh Master)
alter table if exists public.pegawai
  add column if not exists nama_bank text,
  add column if not exists nomor_rekening text,
  add column if not exists atas_nama_rekening text;

-- 4. Komentar dokumentasi kolom
comment on column public.pengaturan_absensi.tarif_uang_makan is 'Tarif standar uang makan per kehadiran lengkap (masuk dan pulang)';
comment on column public.pegawai_bonus.uang_makan is 'Total nominal uang makan bulan ini (hari_uang_makan * tarif)';
comment on column public.pegawai_bonus.hari_uang_makan is 'Jumlah hari hadir dengan absensi masuk DAN pulang lengkap';
comment on column public.pegawai_bonus.total_gaji_transfer is 'Total dana yang ditransfer = gaji_pokok + uang_makan + total_bonus';
comment on column public.pegawai.nomor_rekening is 'Nomor rekening bank karyawan untuk transfer penggajian manual';
