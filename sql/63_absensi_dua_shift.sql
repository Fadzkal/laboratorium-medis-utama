-- =====================================================================
--  RME Laboratorium Medis Utama - SISTEM ABSENSI 2 SHIFT
--  Berkas: sql/63_absensi_dua_shift.sql
--
--  Tujuan:
--  1. Menambahkan kolom konfigurasi Shift 1 dan Shift 2 pada tabel pengaturan_absensi
--  2. Menambahkan kolom shift pada tabel pegawai_absensi
--  3. Memperbarui constraint indeks unik agar mendukung absensi per shift
-- =====================================================================

-- 1. Buat / Perluas tabel pengaturan_absensi
create table if not exists public.pengaturan_absensi (
  id integer primary key default 1,
  jam_masuk text default '08:00',
  jam_pulang text default '16:00',
  toleransi_keterlambatan_menit integer default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tambahkan kolom Shift 1 dan Shift 2 jika belum ada
alter table public.pengaturan_absensi
  add column if not exists shift1_masuk text default '07:30',
  add column if not exists shift1_pulang text default '14:30',
  add column if not exists shift1_toleransi integer default 15,
  add column if not exists shift2_masuk text default '14:00',
  add column if not exists shift2_pulang text default '21:00',
  add column if not exists shift2_toleransi integer default 15;

-- Masukkan data awal baris id = 1 jika belum ada
insert into public.pengaturan_absensi (id, shift1_masuk, shift1_pulang, shift1_toleransi, shift2_masuk, shift2_pulang, shift2_toleransi)
values (1, '07:30', '14:30', 15, '14:00', '21:00', 15)
on conflict (id) do update set
  shift1_masuk = coalesce(excluded.shift1_masuk, public.pengaturan_absensi.shift1_masuk, '07:30'),
  shift1_pulang = coalesce(excluded.shift1_pulang, public.pengaturan_absensi.shift1_pulang, '14:30'),
  shift1_toleransi = coalesce(excluded.shift1_toleransi, public.pengaturan_absensi.shift1_toleransi, 15),
  shift2_masuk = coalesce(excluded.shift2_masuk, public.pengaturan_absensi.shift2_masuk, '14:00'),
  shift2_pulang = coalesce(excluded.shift2_pulang, public.pengaturan_absensi.shift2_pulang, '21:00'),
  shift2_toleransi = coalesce(excluded.shift2_toleransi, public.pengaturan_absensi.shift2_toleransi, 15);

-- 2. Perluas tabel pegawai_absensi dengan kolom shift
alter table public.pegawai_absensi
  add column if not exists shift integer not null default 1 check (shift in (1, 2));

-- 3. Perbarui indeks unik agar mendukung 1 absensi per shift per hari
-- Hapus indeks lama jika ada
drop index if exists public.uq_absensi_harian;
drop index if exists public.uq_absensi_pegawai_shift;

-- Buat indeks unik baru berbasis (pegawai_id, tanggal, shift)
create unique index if not exists uq_absensi_pegawai_shift
  on public.pegawai_absensi (pegawai_id, tanggal, shift);

comment on column public.pegawai_absensi.shift is 'Nomor shift kerja: 1 = Shift Pagi, 2 = Shift Siang/Sore';

-- RLS: Izinkan authenticated membaca pengaturan_absensi
alter table public.pengaturan_absensi enable row level security;

create policy "Semua pegawai bisa melihat pengaturan absensi"
on public.pengaturan_absensi for select
using (auth.uid() is not null);

create policy "Master bisa ubah pengaturan absensi"
on public.pengaturan_absensi for all
using (exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master'));
