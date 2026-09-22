-- =====================================================================
--  RME Laboratorium Medis Utama — EKSPOR KESESUAIAN PORTAL KE PROLANIS / PCARE
--  Berkas: sql/67_kronis_ekspor_kesesuaian.sql
--  
--  Menyediakan fungsi RPC untuk mengekspor data pencocokan portal (COCOK)
--  beserta rincian pemeriksaan lab, tanda vital, diagnosa, dan identitas
--  pasien terdaftar ke dalam struktur siap ekspor sesuai templat Prolanis.
-- =====================================================================

create or replace function public.kronis_ekspor_kesesuaian(p_status text default 'COCOK')
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_hasil jsonb;
begin
  if not (public.boleh_kronis_migrasi() or public.hak_akses_cek('laporan')) then
    raise exception 'Tidak punya izin mengakses data migrasi.' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(row_data), '[]'::jsonb)
    into v_hasil
    from (
      select 
        p.id,
        p.kunci,
        p.nama_pasien,
        p.no_bpjs,
        p.no_telp,
        p.diagnosis_teks,
        p.status,
        p.pasien_id,
        p.dicocokkan_pada,
        case when pas.id is not null then
          jsonb_build_object(
            'id', pas.id,
            'no_rm', pas.no_rm,
            'nama', pas.nama,
            'nik', pas.nik,
            'no_bpjs', pas.no_bpjs,
            'alamat', pas.alamat,
            'tanggal_lahir', pas.tanggal_lahir,
            'jenis_kelamin', pas.jenis_kelamin,
            'no_telp', pas.no_telp,
            'no_hp', pas.no_hp
          )
        else null end as pasien,
        coalesce(
          (select jsonb_agg(
                    jsonb_build_object(
                      'id', b.id,
                      'impor_id', b.impor_id,
                      'sumber', b.sumber,
                      'tanggal', b.tanggal,
                      'isi', b.isi
                    ) order by b.tanggal asc nulls last
                  )
             from kronis_impor_baris b
            where b.impor_id = p.id),
          '[]'::jsonb
        ) as baris,
        case when p.pasien_id is not null then
          coalesce(
            (select jsonb_agg(
                      jsonb_build_object(
                        'id', lp.id,
                        'pasien_id', lp.pasien_id,
                        'no_lab', lp.no_lab,
                        'tanggal', lp.tanggal,
                        'status', lp.status,
                        'kunjungan', case when k.id is not null then
                          jsonb_build_object(
                            'id', k.id,
                            'keluhan_singkat', k.keluhan_singkat,
                            'dokter_nama', pg.nama,
                            'kajian_awal', (
                              select row_to_json(ka)::jsonb
                                from kajian_awal ka
                               where ka.kunjungan_id = k.id limit 1
                            )
                          ) else null end,
                        'hasil', coalesce(
                          (select jsonb_agg(
                                    jsonb_build_object(
                                      'id', lh.id,
                                      'lab_id', lh.lab_id,
                                      'nama', lh.nama,
                                      'satuan', lh.satuan,
                                      'nilai_angka', lh.nilai_angka,
                                      'nilai_teks', lh.nilai_teks,
                                      'kode', rl.kode
                                    )
                                  )
                             from lab_hasil lh
                             left join ref_lab rl on rl.id = lh.lab_id
                            where lh.permintaan_id = lp.id),
                          '[]'::jsonb
                        )
                      ) order by lp.tanggal asc
                    )
               from lab_permintaan lp
               left join kunjungan k on k.id = lp.kunjungan_id
               left join pegawai pg on pg.id = k.dokter_id
              where lp.pasien_id = p.pasien_id and lp.status = 'SELESAI'),
            '[]'::jsonb
          )
        else '[]'::jsonb end as lab_rme
      from kronis_impor_pasien p
      left join pasien pas on pas.id = p.pasien_id
      where (p_status is null or p.status = p_status)
      order by p.id asc
    ) row_data;

  return v_hasil;
end;
$$;

grant execute on function public.kronis_ekspor_kesesuaian(text) to authenticated;

comment on function public.kronis_ekspor_kesesuaian(text) is 
  'Mengambil data kesesuaian migrasi portal (status COCOK/lainnya) beserta baris portal dan hasil lab RME untuk ekspor spreadsheet Prolanis.';
