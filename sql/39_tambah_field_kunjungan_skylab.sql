-- =====================================================================
--  MIGRASI: Tambah field financial/POS ke tabel kunjungan
--  Tanggal : 2026-09-19
--  Cara    : Jalankan di Supabase SQL Editor (satu kali saja)
-- =====================================================================

alter table kunjungan
  add column if not exists bruto numeric(12,2) default 0,
  add column if not exists diskon_persen numeric(5,2) default 0,
  add column if not exists netto numeric(12,2) default 0,
  add column if not exists bayar_sekarang numeric(12,2) default 0,
  add column if not exists kurang_bayar numeric(12,2) default 0,
  add column if not exists uang_pasien numeric(12,2) default 0,
  add column if not exists kembalian numeric(12,2) default 0,
  add column if not exists cara_pengambilan text,
  add column if not exists waktu_janji timestamp;

create table if not exists kunjungan_lab_item (
  id uuid primary key default uuid_generate_v4(),
  kunjungan_id uuid not null references kunjungan(id) on delete cascade,
  lab_id uuid not null references ref_lab(id),
  harga numeric(12,2) default 0,
  diskon_persen numeric(5,2) default 0,
  netto numeric(12,2) default 0,
  keterangan text
);
