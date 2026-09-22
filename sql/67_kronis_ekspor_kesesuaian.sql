-- =====================================================================
--  RME Laboratorium Medis Utama — EKSPOR DATA PELAYANAN PROLANIS & LAB
--  Berkas: sql/67_kronis_ekspor_kesesuaian.sql
--  
--  Menyediakan fungsi RPC untuk mengekspor data pelayanan pasien Prolanis,
--  kunjungan dokter, tanda vital, dan pemeriksaan kimia darah/gula darah
--  langsung dari database RME berdasarkan rentang tanggal / bulan.
-- =====================================================================

create or replace function public.prolanis_ekspor_pelayanan(
  p_tgl_mulai date,
  p_tgl_selesai date,
  p_cara_bayar text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_hasil jsonb;
begin
  if not (public.hak_akses_cek('laporan') or public.boleh_kronis_migrasi() or public.hak_akses_cek('lab')) then
    raise exception 'Tidak punya izin mengakses data laporan/pelayanan.' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(row_data), '[]'::jsonb)
    into v_hasil
    from (
      -- 1. Dari Kunjungan yang berada dalam rentang tanggal
      select
        k.id as kunjungan_id,
        k.no_kunjungan,
        k.tanggal as tgl_pelayanan,
        k.waktu_daftar,
        k.cara_bayar,
        k.keluhan_singkat,
        pas.id as pasien_id,
        pas.no_rm,
        pas.nama as nama_pasien,
        pas.nik,
        pas.no_bpjs,
        pas.alamat,
        pas.fktp,
        pas.tanggal_lahir,
        pas.jenis_kelamin,
        pg.nama as dokter_nama,
        -- Tanda vital & Kajian awal
        ka.sistolik,
        ka.diastolik,
        case 
          when ka.sistolik is not null and ka.diastolik is not null 
          then concat(ka.sistolik, '/', ka.diastolik)
          else null 
        end as tensi,
        ka.tinggi_badan,
        ka.berat_badan,
        ka.lingkar_perut,
        ka.nafas as rr,
        ka.nadi as hr,
        ka.suhu,
        coalesce(ka.keluhan_utama, k.keluhan_singkat) as keluhan,
        -- Pemeriksaan dokter (SOAP)
        pem.subjective as anamnesa,
        pem.terapi_non_obat,
        pem.status_pulang,
        -- Diagnosa primer
        coalesce(
          (select diag.kode_icd10 
             from diagnosa diag 
            where diag.kunjungan_id = k.id 
            order by (diag.jenis = 'PRIMER') desc, diag.urutan asc 
            limit 1),
          'I10'
        ) as diagnosa_icd,
        -- Terapi obat
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
           from lab_permintaan lp
           join lab_hasil lh on lh.permintaan_id = lp.id
           left join ref_lab rl on rl.id = lh.lab_id
          where lp.kunjungan_id = k.id and lp.status = 'SELESAI'
        ) as lab_hasil
      from kunjungan k
      join pasien pas on pas.id = k.pasien_id
      left join pegawai pg on pg.id = k.dokter_id
      left join kajian_awal ka on ka.kunjungan_id = k.id
      left join pemeriksaan pem on pem.kunjungan_id = k.id
      where k.tanggal >= p_tgl_mulai 
        and k.tanggal <= p_tgl_selesai
        and (p_cara_bayar is null or p_cara_bayar = 'SEMUA' or k.cara_bayar = p_cara_bayar)
      
      union all

      -- 2. Dari Lab Langsung (tanpa kunjungan poli) dalam rentang tanggal
      select
        null as kunjungan_id,
        lp.nomor as no_kunjungan,
        lp.tanggal as tgl_pelayanan,
        lp.created_at as waktu_daftar,
        'BPJS' as cara_bayar,
        null as keluhan_singkat,
        pas.id as pasien_id,
        pas.no_rm,
        pas.nama as nama_pasien,
        pas.nik,
        pas.no_bpjs,
        pas.alamat,
        pas.fktp,
        pas.tanggal_lahir,
        pas.jenis_kelamin,
        null as dokter_nama,
        null::smallint as sistolik,
        null::smallint as diastolik,
        null as tensi,
        null::numeric as tinggi_badan,
        null::numeric as berat_badan,
        null::numeric as lingkar_perut,
        null::smallint as rr,
        null::smallint as hr,
        null::numeric as suhu,
        'Pemeriksaan Laboratorium Prolanis' as keluhan,
        null as anamnesa,
        null as terapi_non_obat,
        'BEROBAT JALAN' as status_pulang,
        'Z01.7' as diagnosa_icd,
        null as terapi_obat,
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
      where lp.kunjungan_id is null
        and lp.status = 'SELESAI'
        and lp.tanggal >= p_tgl_mulai
        and lp.tanggal <= p_tgl_selesai
        and (p_cara_bayar is null or p_cara_bayar = 'SEMUA' or pas.no_bpjs is not null)

      order by tgl_pelayanan asc, nama_pasien asc
    ) row_data;

  return v_hasil;
end;
$$;

grant execute on function public.prolanis_ekspor_pelayanan(date, date, text) to authenticated;

comment on function public.prolanis_ekspor_pelayanan(date, date, text) is 
  'Mengambil data pelayanan pasien Prolanis & laboratorium berdasarkan rentang tanggal/bulan langsung dari database RME.';
