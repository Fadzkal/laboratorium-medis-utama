-- =====================================================================
--  RME Laboratorium Medis Utama - INTEGRASI PEMERIKSAAN FISIK KE LAPORAN
--  Berkas: sql/72_laporan_pemeriksaan_fisik.sql
--
--  Memastikan hasil pemeriksaan fisik (medical check-up) terdeteksi
--  dan teragregasi secara otomatis pada seluruh modul laporan:
--  1. v_lab_permintaan_lean: hitung tes lab + pemeriksaan fisik & flag ada_fisik
--  2. rpc_top_pemeriksaan_lab: deteksi 'Pemeriksaan Fisik' sebagai item top
--  3. rpc_distribusi_kategori_lab: deteksi kategori 'Pemeriksaan Fisik'
--  4. v_lab_antrean: tambahkan kolom ada_fisik dan jml_fisik
--  5. v_riwayat_kunjungan: tambahkan kolom ada_fisik untuk registrasi lab
--
--  Jalankan SETELAH 71_pemeriksaan_fisik.sql dan 65_optimasi_laporan_lab.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PERBARUI VIEW RAMPING PERMINTAAN LAB (STATISTIK RINGKASAN)
-- ---------------------------------------------------------------------
create or replace view v_lab_permintaan_lean with (security_invoker = true) as
select
  lp.id,
  lp.tanggal,
  lp.status,
  coalesce(k.cara_bayar, 'UMUM') as cara_bayar,
  coalesce(d.nama, 'APS (Atas Permintaan Sendiri)') as nama_dokter,
  (
    (select count(*) from lab_hasil h where h.permintaan_id = lp.id)
    + (case when exists(
        select 1 from lab_fisik lf
        where lf.permintaan_id = lp.id
          and nullif(trim(lf.hasil), '') is not null
          and lf.hasil <> '-'
      ) then 1 else 0 end)
  ) as jml_pemeriksaan,
  exists(
    select 1 from lab_fisik lf
    where lf.permintaan_id = lp.id
      and nullif(trim(lf.hasil), '') is not null
      and lf.hasil <> '-'
  ) as ada_fisik,
  (
    select count(*) from lab_fisik lf
    where lf.permintaan_id = lp.id
      and nullif(trim(lf.hasil), '') is not null
      and lf.hasil <> '-'
  ) as jml_fisik
from lab_permintaan lp
left join kunjungan k on k.id = lp.kunjungan_id
left join pegawai d on d.id = lp.diminta_oleh;

grant select on v_lab_permintaan_lean to authenticated;

-- ---------------------------------------------------------------------
-- 2. PERBARUI RPC TOP PEMERIKSAAN LAB (MENYERTAKAN PEMERIKSAAN FISIK)
-- ---------------------------------------------------------------------
create or replace function public.rpc_top_pemeriksaan_lab(
  p_dari date,
  p_sampai date,
  p_status text default 'SELESAI',
  p_kelompok text default null,
  p_batas integer default 15
)
returns table (
  lab_id uuid,
  nama text,
  kelompok text,
  jml bigint
)
language sql
stable
security invoker
as $$
  with gabungan as (
    -- Item hasil pemeriksaan lab reguler
    select
      h.lab_id,
      h.nama,
      coalesce(nullif(trim(rl.kelompok), ''), 'Lainnya') as kelompok,
      count(*) as jml
    from lab_hasil h
    join lab_permintaan lp on lp.id = h.permintaan_id
    left join ref_lab rl on rl.id = h.lab_id
    where lp.tanggal >= p_dari and lp.tanggal <= p_sampai
      and (p_status is null or p_status = 'SEMUA' or (p_status = 'AKTIF' and lp.status in ('DIMINTA','DIKERJAKAN')) or lp.status = p_status)
      and (p_kelompok is null or p_kelompok = 'SEMUA' or rl.kelompok = p_kelompok)
    group by h.lab_id, h.nama, coalesce(nullif(trim(rl.kelompok), ''), 'Lainnya')

    union all

    -- Pemeriksaan fisik terdeteksi per pasien/permintaan
    select
      null::uuid as lab_id,
      'Pemeriksaan Fisik'::text as nama,
      'Pemeriksaan Fisik'::text as kelompok,
      count(distinct lf.permintaan_id) as jml
    from lab_fisik lf
    join lab_permintaan lp on lp.id = lf.permintaan_id
    where lp.tanggal >= p_dari and lp.tanggal <= p_sampai
      and (p_status is null or p_status = 'SEMUA' or (p_status = 'AKTIF' and lp.status in ('DIMINTA','DIKERJAKAN')) or lp.status = p_status)
      and (p_kelompok is null or p_kelompok = 'SEMUA' or p_kelompok = 'Pemeriksaan Fisik')
      and nullif(trim(lf.hasil), '') is not null
      and lf.hasil <> '-'
    having count(distinct lf.permintaan_id) > 0
  )
  select * from gabungan
  order by jml desc
  limit coalesce(nullif(p_batas, 0), 100);
$$;

grant execute on function public.rpc_top_pemeriksaan_lab to authenticated;

-- ---------------------------------------------------------------------
-- 3. PERBARUI RPC DISTRIBUSI KATEGORI LAB (DONUT CHART & REKAP KELOMPOK)
-- ---------------------------------------------------------------------
create or replace function public.rpc_distribusi_kategori_lab(
  p_dari date,
  p_sampai date
)
returns table (
  kelompok text,
  jml bigint
)
language sql
stable
security invoker
as $$
  with gabungan as (
    select
      coalesce(nullif(trim(rl.kelompok), ''), 'Lainnya') as kelompok,
      count(*) as jml
    from lab_hasil h
    join lab_permintaan lp on lp.id = h.permintaan_id
    left join ref_lab rl on rl.id = h.lab_id
    where lp.tanggal >= p_dari and lp.tanggal <= p_sampai
      and lp.status <> 'BATAL'
    group by coalesce(nullif(trim(rl.kelompok), ''), 'Lainnya')

    union all

    select
      'Pemeriksaan Fisik'::text as kelompok,
      count(distinct lf.permintaan_id) as jml
    from lab_fisik lf
    join lab_permintaan lp on lp.id = lf.permintaan_id
    where lp.tanggal >= p_dari and lp.tanggal <= p_sampai
      and lp.status <> 'BATAL'
      and nullif(trim(lf.hasil), '') is not null
      and lf.hasil <> '-'
    having count(distinct lf.permintaan_id) > 0
  )
  select kelompok, sum(jml)::bigint as jml
  from gabungan
  group by kelompok
  order by jml desc;
$$;

grant execute on function public.rpc_distribusi_kategori_lab to authenticated;

-- ---------------------------------------------------------------------
-- 4. PERBARUI VIEW ANTREAN LAB DENGAN FLAG DAN JUMLAH FISIK
-- ---------------------------------------------------------------------
create or replace view v_lab_antrean with (security_invoker = true) as
select lp.id, lp.no_lab, lp.tanggal, lp.status, lp.asal, lp.nama_lab_luar,
       lp.catatan_klinis, lp.diminta_pada, lp.kunjungan_id,
       p.id as pasien_id, p.no_rm, p.nama as nama_pasien, p.jenis_kelamin,
       p.tanggal_lahir,
       date_part('year', age(p.tanggal_lahir))::int as umur,
       k.no_kunjungan, k.cara_bayar,
       po.nama as nama_poli,
       d.nama as nama_dokter,
       (select count(*) from lab_hasil h where h.permintaan_id = lp.id) as jml_pemeriksaan,
       (select count(*) from lab_hasil h where h.permintaan_id = lp.id
         and (h.nilai_angka is not null or nullif(h.nilai_teks,'') is not null)) as jml_terisi,
       (select count(*) from lab_hasil h where h.permintaan_id = lp.id
         and h.tanda in ('KRITIS_RENDAH','KRITIS_TINGGI')) as jml_kritis,
       (select count(*) from lab_hasil h where h.permintaan_id = lp.id
         and h.tanda in ('RENDAH','TINGGI','ABNORMAL','KRITIS_RENDAH','KRITIS_TINGGI')) as jml_tak_normal,
       exists(
         select 1 from lab_fisik lf
         where lf.permintaan_id = lp.id
           and nullif(trim(lf.hasil), '') is not null
           and lf.hasil <> '-'
       ) as ada_fisik,
       (
         select count(*) from lab_fisik lf
         where lf.permintaan_id = lp.id
           and nullif(trim(lf.hasil), '') is not null
           and lf.hasil <> '-'
       ) as jml_fisik
  from lab_permintaan lp
  join pasien p on p.id = lp.pasien_id
  left join kunjungan k on k.id = lp.kunjungan_id
  left join poli po on po.id = k.poli_id
  left join pegawai d on d.id = lp.diminta_oleh;

grant select on v_lab_antrean to authenticated;

-- ---------------------------------------------------------------------
-- 5. PERBARUI VIEW RIWAYAT KUNJUNGAN UNTUK REGISTRASI LAB
-- ---------------------------------------------------------------------
create or replace view v_riwayat_kunjungan with (security_invoker = true) as
select k.id, k.no_kunjungan, k.tanggal, k.status, k.cara_bayar,
       p.id as pasien_id, p.no_rm, p.nama as nama_pasien,
       po.nama as nama_poli,
       d.nama as nama_dokter,
       (select string_agg(dg.kode_icd10 || ' - ' || dg.nama, '; ' order by dg.jenis)
          from diagnosa dg where dg.kunjungan_id = k.id) as daftar_diagnosa,
       (select dg.kode_icd10 from diagnosa dg
         where dg.kunjungan_id = k.id and dg.jenis = 'PRIMER' limit 1) as icd_primer,
       k.satusehat_status, k.pcare_status,
       po.jenis as jenis_poli,
       k.jenis_kunjungan,
       k.dokter_id,
       k.poli_id,
       k.waktu_daftar,
       extract(hour from k.waktu_daftar at time zone 'Asia/Makassar')::smallint as jam_daftar,
       p.tanggal_lahir,
       p.jenis_kelamin,
       p.no_bpjs,
       p.no_hp,
       exists(
         select 1 from lab_permintaan lp
         join lab_fisik lf on lf.permintaan_id = lp.id
         where lp.kunjungan_id = k.id
           and nullif(trim(lf.hasil), '') is not null
           and lf.hasil <> '-'
       ) as ada_fisik
from kunjungan k
join pasien p on p.id = k.pasien_id
join poli po on po.id = k.poli_id
left join pegawai d on d.id = k.dokter_id
order by k.tanggal desc, k.no_antrian desc;

grant select on v_riwayat_kunjungan to authenticated;
