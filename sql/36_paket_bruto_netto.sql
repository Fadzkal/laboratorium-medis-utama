-- =====================================================================
--  MIGRASI: Tambah kolom bruto & netto ke ref_lab_paket
--  Tanggal : 2026-09-19
--  Tujuan  : Mendukung CRUD Master Paket/Panel pemeriksaan
--  Cara    : Jalankan di Supabase SQL Editor (satu kali saja)
-- =====================================================================

-- Harga total sebelum diskon (diisi manual atau dari jumlah item)
alter table ref_lab_paket
  add column if not exists bruto numeric(12,2) default 0;

-- Harga setelah diskon / harga jual paket
alter table ref_lab_paket
  add column if not exists netto numeric(12,2) default 0;

-- Keterangan singkat paket (opsional)
alter table ref_lab_paket
  add column if not exists keterangan text;
