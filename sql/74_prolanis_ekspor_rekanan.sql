-- =====================================================================
--  RME Laboratorium Medis Utama — EKSPOR DATA PELAYANAN PROLANIS & LAB
--  Berkas: sql/74_prolanis_ekspor_rekanan.sql
-- =====================================================================

create or replace function public.prolanis_ekspor_pelayanan(
  p_tgl_mulai date,
  p_tgl_selesai date,
  p_cara_bayar text default null,
  p_rekanan text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as \$\$
begin
  if not (public.hak_akses_cek('laporan') or public.boleh_kronis_migrasi() or public.hak_akses_cek('lab')) then
    raise exception 'Tidak punya izin mengakses data laporan/pelayanan.' using errcode = '42501';
  end if;

  return (
    select coalesce(jsonb_agg(row_data), '[]'::jsonb)
    from (
      select
        lp.id as lab_id,
        k.id as kunjungan_id,
        lp.no_lab as no_lab,
        lp.tanggal as tgl_pelayanan,
        lp.created_at as waktu_daftar,
        coalesce(k.cara_bayar, 'BPJS') as cara_bayar,
        lp.catatan_klinis,
        pas.id as pasien_id,
        pas.no_rm,
        pas.nama as nama_pasien,
        pas.nik,
        pas.no_bpjs,
        pas.alamat,
        coalesce(nullif(trim(pas.bpjs_faskes),''), nullif(trim(pas.plant),''), nullif(trim(pas.bagian),''), 'Klinik Griya Medica') as fktp,
        pas.tanggal_lahir,
        pas.jenis_kelamin,
        coalesce(pg_lab.nama, pg_kunj.nama, 'dr. Minto Rahaju, Sp.PK') as dokter_nama,
        
        -- Tanda vital & Fisik (Cek lab_fisik dahulu, lalu fallback ke kajian_awal)
        coalesce(
          (select lf.hasil from lab_fisik lf where lf.permintaan_id = lp.id and lf.item_id = 200 limit 1),
          case 
            when ka.sistolik is not null and ka.diastolik is not null 
            then concat(ka.sistolik, '/', ka.diastolik)
            else null 
          end,
          '120/80'
        ) as tensi,
        coalesce(
          (select lf.hasil from lab_fisik lf where lf.permintaan_id = lp.id and lf.item_id = 100 limit 1),
          ka.tinggi_badan::text,
          ''
        ) as tinggi_badan,
        coalesce(
          (select lf.hasil from lab_fisik lf where lf.permintaan_id = lp.id and lf.item_id = 101 limit 1),
          ka.berat_badan::text,
          ''
        ) as berat_badan,
        coalesce(
          (select lf.hasil from lab_fisik lf where lf.permintaan_id = lp.id and lf.item_id = 103 limit 1),
          ka.lingkar_perut::text,
          ''
        ) as lingkar_perut,
        coalesce(
          (select lf.hasil from lab_fisik lf where lf.permintaan_id = lp.id and lf.item_id = 203 limit 1),
          ka.nafas::text,
          '20'
        ) as rr,
        coalesce(
          (select lf.hasil from lab_fisik lf where lf.permintaan_id = lp.id and lf.item_id = 202 limit 1),
          ka.nadi::text,
          '80'
        ) as hr,
        coalesce(ka.suhu::text, '36.0') as suhu,
        coalesce(ka.keluhan_utama, k.keluhan_singkat, 'Pemeriksaan Rutin Prolanis') as keluhan,
        coalesce(pem.subjective, 'Pemeriksaan Rutin Prolanis') as anamnesa,
        pem.terapi_non_obat,
        coalesce(pem.status_pulang, 'BEROBAT JALAN') as status_pulang,
        coalesce(
          (select diag.kode_icd10 
             from diagnosa diag 
            where diag.kunjungan_id = k.id 
            order by (diag.jenis = 'PRIMER') desc, diag.urutan asc 
            limit 1),
          'E11.9'
        ) as diagnosa_icd,
        (select string_agg(coalesce(ri.nama_obat, obat.nama, 'Obat'), ', ')
           from resep res
           join resep_item ri on ri.resep_id = res.id
           left join obat on obat.id = ri.obat_id
          where res.kunjungan_id = k.id
        ) as terapi_obat,
        
        -- Hasil Laboratorium
        (select jsonb_agg(
                  jsonb_build_object(
                    'nama', lh.nama,
                    'satuan', lh.satuan,
                    'nilai_angka', lh.nilai_angka,
                    'nilai_teks', lh.nilai_teks,
                    'kode', coalesce(rl.kode, '')
                  )
                )
           from lab_hasil lh
           left join ref_lab rl on rl.id = lh.lab_id
          where lh.permintaan_id = lp.id
        ) as lab_hasil

      from lab_permintaan lp
      join pasien pas on pas.id = lp.pasien_id
      left join kunjungan k on k.id = lp.kunjungan_id
      left join pegawai pg_lab on pg_lab.id = lp.diminta_oleh
      left join pegawai pg_kunj on pg_kunj.id = k.dokter_id
      left join kajian_awal ka on ka.kunjungan_id = k.id
      left join pemeriksaan pem on pem.kunjungan_id = k.id
      where lp.tanggal >= p_tgl_mulai 
        and lp.tanggal <= p_tgl_selesai
        and (p_cara_bayar is null or p_cara_bayar = 'SEMUA' or k.cara_bayar = p_cara_bayar or (k.cara_bayar is null and p_cara_bayar = 'BPJS'))
        and (
          p_rekanan is null or p_rekanan = '' or p_rekanan = 'SEMUA'
          or coalesce(pas.bpjs_faskes, pas.plant, pas.bagian, '') ilike '%' || p_rekanan || '%'
          or coalesce(k.keluhan_singkat, '') ilike '%' || p_rekanan || '%'
          or coalesce(pg_lab.nama, pg_kunj.nama, '') ilike '%' || p_rekanan || '%'
        )

      order by tgl_pelayanan asc, nama_pasien asc
    ) row_data
  );
end;
\$\$;

create or replace function public.prolanis_ekspor_pelayanan(
  p_tgl_mulai date,
  p_tgl_selesai date,
  p_cara_bayar text
)
returns jsonb
language sql security definer set search_path = public
as \$\$
  select public.prolanis_ekspor_pelayanan(p_tgl_mulai, p_tgl_selesai, p_cara_bayar, null);
\$\$;

grant execute on function public.prolanis_ekspor_pelayanan(date, date, text, text) to authenticated;
grant execute on function public.prolanis_ekspor_pelayanan(date, date, text) to authenticated;
