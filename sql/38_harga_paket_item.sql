-- =====================================================================
--  MIGRASI: Tambah kolom harga ke ref_lab_paket_item
--  Tanggal : 2026-09-19
--  Cara    : Jalankan di Supabase SQL Editor (satu kali saja)
-- =====================================================================

alter table ref_lab_paket_item
  add column if not exists harga numeric(12,2) default 0;
