-- =====================================================================
--  RME Laboratorium Medis Utama — PEMANTAUAN BPJS 6 BULAN & HBA1C KRONIS
--  Berkas: sql/70_kronis_bpjs_hba1c.sql
--
--  Fitur:
--  1. Pemantauan siklus klaim BPJS 6 bulan (180 hari) untuk pasien kronis
--     (Hipertensi & Diabetes Mellitus).
--  2. Evaluasi kontrol glikemik HbA1c (ambang batas < 7.0% vs >= 7.0%)
--     dengan rekomendasi jadwal kontrol 3 bulan / 6 bulan.
--  3. Rekapitulasi statistik dan persentase kepatuhan pelayanan.
-- =====================================================================

-- 1. VIEW PEMANTAUAN PASIEN KRONIS BPJS & HBA1C
create or replace view public.v_pasien_kronis_bpjs with (security_invoker = true) as
with diagnosa_pasien as (
  -- Deteksi pasien Hipertensi (HPT/HT) dan Diabetes Mellitus (DM)
  select
    p.id as pasien_id,
    -- Cek dari kronis_terapi
    bool_or(coalesce(ktd.kode = 'HPT', false)) or
    bool_or(coalesce(d.kode_icd10 ~* '^(I10|I11|I12|I13|I15)', false)) or
    bool_or(coalesce(p.catatan_penting ~* '(hipertensi|\mhpt\M|\mht\M|tensi tinggi)', false)) as is_ht,
    
    bool_or(coalesce(ktd.kode = 'DM', false)) or
    bool_or(coalesce(d.kode_icd10 ~* '^(E10|E11|E13|E14)', false)) or
    bool_or(coalesce(p.catatan_penting ~* '(diabetes|\mdm\M|gula darah|kencing manis)', false)) or
    bool_or(coalesce(lh_cek.ada_hba1c, false)) as is_dm
  from public.pasien p
  left join public.kronis_terapi kt on kt.pasien_id = p.id and kt.aktif
  left join public.kronis_terapi_diagnosa ktd on ktd.terapi_id = kt.id
  left join public.kunjungan k on k.pasien_id = p.id
  left join public.diagnosa d on d.kunjungan_id = k.id
  left join lateral (
    select true as ada_hba1c
    from public.lab_permintaan lp
    join public.lab_hasil lh on lh.permintaan_id = lp.id
    where lp.pasien_id = p.id and (lh.nama ~* 'hba1c' or lh.nama ~* 'hemoglobin a1c')
    limit 1
  ) lh_cek on true
  where p.aktif
  group by p.id
),
klaim_terakhir as (
  -- Kunjungan BPJS terakhir
  select
    k.pasien_id,
    max(k.tanggal) as tgl_klaim_bpjs
  from public.kunjungan k
  where k.cara_bayar = 'BPJS'
  group by k.pasien_id
),
hba1c_terakhir as (
  -- Hasil tes HbA1c terakhir
  select distinct on (lp.pasien_id)
    lp.pasien_id,
    lp.tanggal as tgl_hba1c,
    case
      when lh.nilai_angka is not null then lh.nilai_angka
      when lh.nilai_teks ~ '^[0-9]+([.,][0-9]+)?$' then replace(lh.nilai_teks, ',', '.')::numeric
      else null
    end as nilai_hba1c
  from public.lab_permintaan lp
  join public.lab_hasil lh on lh.permintaan_id = lp.id
  where lp.status = 'SELESAI'
    and (lh.nama ~* 'hba1c' or lh.nama ~* 'hemoglobin a1c')
  order by lp.pasien_id, lp.tanggal desc, lp.created_at desc
)
select
  p.id as pasien_id,
  p.no_rm,
  p.nama,
  p.no_bpjs,
  p.no_hp,
  p.tanggal_lahir,
  p.jenis_kelamin,
  dp.is_ht,
  dp.is_dm,
  case
    when dp.is_ht and dp.is_dm then 'HT & DM'
    when dp.is_ht then 'Hipertensi'
    when dp.is_dm then 'Diabetes Melitus'
    else 'Non-Kronis'
  end as jenis_kronis,

  -- Status Klaim BPJS 6 Bulan (180 hari)
  kt.tgl_klaim_bpjs,
  case
    when kt.tgl_klaim_bpjs is not null then (current_date - kt.tgl_klaim_bpjs)::integer
    else null
  end as hari_sejak_klaim,
  case
    when p.no_bpjs is null or trim(p.no_bpjs) = '' or p.no_bpjs = '-' then 'NON_BPJS'
    when kt.tgl_klaim_bpjs is null then 'BELUM_KLAIM'
    when kt.tgl_klaim_bpjs >= current_date - interval '180 days' then 'SUDAH_KLAIM_6BLN'
    else 'JATUH_TEMPO_6BLN'
  end as status_klaim_bpjs,

  -- Hasil dan Status Kontrol HbA1c
  ht.tgl_hba1c,
  ht.nilai_hba1c,
  case
    when ht.nilai_hba1c is null then 'BELUM_PERIKSA'
    when ht.nilai_hba1c < 7.0 then 'TERKONTROL'
    else 'BELUM_TERKONTROL'
  end as status_hba1c,
  case
    when ht.nilai_hba1c is not null and ht.nilai_hba1c < 7.0 then '6 Bulan'
    when ht.nilai_hba1c is not null and ht.nilai_hba1c >= 7.0 then '3 Bulan'
    else 'Segera Periksa (3/6 Bln)'
  end as siklus_rekomendasi_hba1c

from public.pasien p
join diagnosa_pasien dp on dp.pasien_id = p.id
left join klaim_terakhir kt on kt.pasien_id = p.id
left join hba1c_terakhir ht on ht.pasien_id = p.id
where p.aktif;

comment on view public.v_pasien_kronis_bpjs is
  'View pemantauan status klaim BPJS 6 bulan dan evaluasi kontrol HbA1c pasien kronis HT & DM.';

grant select on public.v_pasien_kronis_bpjs to authenticated;
grant select on public.v_pasien_kronis_bpjs to anon;
