-- =====================================================================
--  RME Laboratorium Medis Utama - VIEW PASIEN LENGKAP & STATISTIK
--  Berkas: sql/62_view_pasien_lengkap.sql
--
--  Tujuan:
--  Menyediakan view gabungan data pasien dengan:
--  1. Agregasi jumlah kunjungan per pasien (jml_kunjungan)
--  2. Tanggal kunjungan terakhir (kunjungan_terakhir)
--  3. Evaluasi kelengkapan data pasien untuk bridging (kekurangan)
-- =====================================================================

create or replace view public.v_pasien_lengkap with (security_invoker = true) as
select
  p.id,
  p.no_rm,
  p.nik,
  p.no_bpjs,
  p.nama,
  p.title,
  p.nrp,
  p.bagian,
  p.plant,
  p.tanggal_lahir,
  p.jenis_kelamin,
  p.alamat,
  p.no_hp,
  p.no_telp,
  p.catatan_penting,
  p.aktif,
  p.created_at,
  coalesce((select count(*) from public.kunjungan k where k.pasien_id = p.id), 0)::integer as jml_kunjungan,
  (select max(k.tanggal) from public.kunjungan k where k.pasien_id = p.id) as kunjungan_terakhir,
  array_remove(array[
    case when p.nik is null or p.nik !~ '^[0-9]{16}$'
         then 'NIK belum diisi atau bukan 16 angka' end,
    case when exists (select 1 from public.kunjungan k
                       where k.pasien_id = p.id and k.cara_bayar = 'BPJS')
              and (p.no_bpjs is null or p.no_bpjs !~ '^[0-9]{13}$')
         then 'Nomor BPJS belum diisi atau bukan 13 angka' end,
    case when p.tanggal_lahir is null then 'Tanggal lahir belum diisi' end,
    case when p.jenis_kelamin is null then 'Jenis kelamin belum diisi' end
  ], null) as kekurangan
from public.pasien p
where p.aktif;

comment on view public.v_pasien_lengkap is
  'View data pasien lengkap dengan agregasi kunjungan dan kelengkapan data untuk filter & sorting canggih.';

grant select on public.v_pasien_lengkap to authenticated;
grant select on public.v_pasien_lengkap to anon;
