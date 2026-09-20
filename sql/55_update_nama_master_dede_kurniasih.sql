-- =====================================================================
--  55_update_nama_master_dede_kurniasih.sql
--  Update Nama Akun Master Menjadi DEDE KURNIASIH (Pemilik Lab)
-- =====================================================================

UPDATE public.pegawai
SET nama = 'DEDE KURNIASIH'
WHERE peran = 'master';
