-- =====================================================================
-- 59_update_lokasi_baru_lab_pusat.sql
-- Update titik koordinat resmi Laboratorium Medis Utama (Pusat) ke lokasi baru
-- =====================================================================

update public.master_lokasi_absensi
set latitude = -7.3864160,
    longitude = 109.3659890,
    alamat = 'Jl. D.I. Panjaitan No. 94, Purbalingga Lor, Purbalingga'
where tipe = 'LAB' or nama like '%Laboratorium Medis Utama%';
