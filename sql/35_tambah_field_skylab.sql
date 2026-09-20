-- =====================================================================
--  MIGRASI: Tambah field tambahan ke tabel pasien
--  Tanggal : 2026-09-19
--  Tujuan  : Menyamakan field form registrasi
--             (Title, NRP, Bagian, Plant, No. Telp)
--  Cara    : Jalankan di Supabase SQL Editor (satu kali saja)
-- =====================================================================

-- Sapaan / gelar pasien (Tn., Ny., Sdra., Sdri., An., By.)
alter table pasien
  add column if not exists title text;

-- Nomor Registrasi Pegawai (untuk pasien dari instansi/perusahaan)
alter table pasien
  add column if not exists nrp text;

-- Bagian / Departemen (untuk pasien dari instansi/perusahaan)
alter table pasien
  add column if not exists bagian text;

-- Plant / Lokasi (untuk pasien dari instansi/perusahaan)
alter table pasien
  add column if not exists plant text;

-- Nomor telepon rumah / kantor (berbeda dari no_hp / WhatsApp)
alter table pasien
  add column if not exists no_telp text;

-- Indeks untuk pencarian cepat berdasarkan NRP
create index if not exists idx_pasien_nrp on pasien (nrp) where nrp is not null;
