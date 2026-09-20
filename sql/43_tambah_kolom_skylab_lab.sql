-- =====================================================================
--  MIGRASI: Tambah kolom Skylab ke ref_lab
--  Tanggal : 2026-09-20
--  Tujuan  : Melengkapi ref_lab dengan kolom-kolom yg ada di Skylab:
--             Display LOINC, Kode Specimen, Nama Specimen,
--             Barcode, Ket./Janji Hasil, Metode
--  Cara    : Jalankan di Supabase SQL Editor (satu kali saja)
-- =====================================================================

-- Display / nama panjang dari kode LOINC (untuk SatuSehat)
alter table ref_lab
  add column if not exists display_loinc text;

-- Kode spesimen SNOMED (misal: 119297000 = Blood specimen)
alter table ref_lab
  add column if not exists kode_specimen text;

-- Nama spesimen dalam bahasa Indonesia / Inggris
alter table ref_lab
  add column if not exists nama_specimen text;

-- Barcode / kode stiker tabung
alter table ref_lab
  add column if not exists barcode text;

-- Keterangan janji waktu hasil (misal: "Janji : 3 jam")
alter table ref_lab
  add column if not exists janji_hasil text;

-- Metode pemeriksaan (misal: "Non Cyanide hemoglobine analysis")
alter table ref_lab
  add column if not exists metode text;

-- Min & Max Normal (berlaku untuk semua gender)
-- dipakai untuk pemeriksaan yang range-nya sama untuk semua jenis kelamin
alter table ref_lab_rujukan
  add column if not exists min_normal numeric(14,4);
alter table ref_lab_rujukan
  add column if not exists max_normal numeric(14,4);
