-- =====================================================================
--  56_kinerja_dan_bonus_karyawan.sql
--  Modul: Kinerja & Bonus Karyawan (Laboratorium Medis Utama)
--  Penambahan kolom nomor_slip dan pelacakan persetujuan pimpinan
-- =====================================================================

alter table if exists public.pegawai_bonus
  add column if not exists gaji_pokok numeric(12,2) default 0,
  add column if not exists nomor_slip text,
  add column if not exists disetujui_oleh uuid references public.pegawai(id) on delete set null;

-- Indeks untuk pencarian cepat nomor slip
create index if not exists idx_pegawai_bonus_nomor_slip on public.pegawai_bonus(nomor_slip);

