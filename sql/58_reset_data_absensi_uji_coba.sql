-- =====================================================================
-- 58_reset_data_absensi_uji_coba.sql
-- Reset / Kosongkan riwayat absensi dan permohonan izin untuk keperluan uji coba
-- =====================================================================

-- 1. Kosongkan riwayat absensi seluruh pegawai
truncate table public.pegawai_absensi cascade;

-- 2. (Opsional) Kosongkan permohonan cuti / izin / sakit jika ingin bersih total
truncate table public.pegawai_izin cascade;
