-- =====================================================================
--  80_tambah_kolom_verifikator_lab.sql
--  Menambahkan kolom verifikator dan tgl_verifikasi di lab_permintaan
-- =====================================================================

alter table public.lab_permintaan add column if not exists verifikator text;
alter table public.lab_permintaan add column if not exists tgl_verifikasi timestamptz;
