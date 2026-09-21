-- =====================================================================
--  RME Laboratorium Medis Utama - PENYELARASAN HAK AKSES INVENTORI
--  Berkas: sql/60_inventori_akses_karyawan.sql
--
--  Memberikan hak kelola penuh pada modul Inventori & Logistik Lab
--  kepada peran 'karyawan', setara dengan 'master' dan 'admin'.
-- =====================================================================

-- 1. Pastikan RLS untuk inventori_barang mencakup peran 'karyawan'
drop policy if exists "Master kelola inventori" on inventori_barang;
create policy "Master kelola inventori" on inventori_barang for all 
using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin', 'karyawan')));

-- 2. Pastikan RLS untuk inventori_batch mencakup peran 'karyawan'
drop policy if exists "Master kelola batch" on inventori_batch;
create policy "Master kelola batch" on inventori_batch for all 
using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin', 'karyawan')));

-- 3. Pastikan RLS untuk lab_resep mencakup peran 'karyawan'
drop policy if exists "Master kelola resep" on lab_resep;
create policy "Master kelola resep" on lab_resep for all 
using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin', 'karyawan')));

-- 4. Pastikan RLS untuk inventori_mutasi mencakup peran 'karyawan'
drop policy if exists "Master kelola mutasi" on inventori_mutasi;
create policy "Master kelola mutasi" on inventori_mutasi for all 
using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin', 'karyawan')));
