-- =====================================================================
--  RME Laboratorium Medis Utama - PENAMBAHAN PERAN 'karyawan'
--  Berkas: sql/51_tambah_peran_karyawan.sql
--
--  Peran 'karyawan':
--  Memiliki hak akses dan fungsi yang sama seperti 'master', KECUALI
--  modul HRIS & Bonus (tetap eksklusif hanya untuk master klinik).
-- =====================================================================

-- 1. Tambahkan nilai enum 'karyawan' ke peran_pegawai
alter type public.peran_pegawai add value if not exists 'karyawan';

-- 2. Perbarui fungsi hak_akses_cek untuk mengenali peran 'karyawan'
--    karyawan lolos semua kode hak akses KECUALI menu_hris dan hris_kelola.
create or replace function public.hak_akses_cek(p_kode text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.peran_saya() = 'master'
      or (public.peran_saya() = 'karyawan' and p_kode not in ('menu_hris', 'hris_kelola', 'master', 'hak_akses'))
      or exists (
        select 1 from public.hak_akses
         where kode = p_kode and peran = public.peran_saya() and diizinkan
      )
$$;

grant execute on function public.hak_akses_cek(text) to authenticated;

-- 3. Masukkan entri hak akses untuk peran 'karyawan' di tabel hak_akses
--    (Diisi untuk semua kode yang ada di sistem KECUALI 'menu_hris')
insert into public.hak_akses (kode, peran, diizinkan)
select distinct kode, 'karyawan'::public.peran_pegawai, true
  from public.hak_akses
 where kode not in ('menu_hris', 'hris_kelola')
on conflict (kode, peran) do update set diizinkan = excluded.diizinkan;

-- Pastikan 'menu_hris' dimatikan untuk karyawan jika ada
insert into public.hak_akses (kode, peran, diizinkan) values
  ('menu_hris', 'karyawan', false)
on conflict (kode, peran) do update set diizinkan = false;
