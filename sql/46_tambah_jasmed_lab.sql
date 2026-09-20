-- =====================================================================
--  MIGRASI: Tambah kolom Grup CN dan Jasmed ke ref_lab
-- =====================================================================

alter table ref_lab add column if not exists grup_cn text;
alter table ref_lab add column if not exists jasmed numeric(14,2);
