-- Update view antrian_hari_ini untuk menambahkan field ada_lab
drop view if exists v_antrian_hari_ini cascade;

create or replace view v_antrian_hari_ini with (security_invoker = true) as
select k.id, k.no_kunjungan, k.no_antrian, k.tanggal, k.status, k.cara_bayar,
       k.keluhan_singkat, k.waktu_daftar,
       p.id as pasien_id, p.no_rm, p.nama as nama_pasien, p.tanggal_lahir,
       p.jenis_kelamin, p.no_bpjs, p.no_hp,
       date_part('year', age(p.tanggal_lahir))::int as umur,
       po.nama as nama_poli, po.id as poli_id,
       d.nama as nama_dokter, k.dokter_id,
       (ka.kunjungan_id is not null) as sudah_kajian,
       (pm.kunjungan_id is not null) as sudah_periksa,
       (exists (select 1 from lab_permintaan lp where lp.kunjungan_id = k.id)) as ada_lab
from kunjungan k
join pasien p on p.id = k.pasien_id
join poli po on po.id = k.poli_id
left join pegawai d on d.id = k.dokter_id
left join kajian_awal ka on ka.kunjungan_id = k.id
left join pemeriksaan pm on pm.kunjungan_id = k.id
where k.tanggal = current_date
order by k.no_antrian;

-- Update view rujukan
create or replace view v_riwayat_kunjungan with (security_invoker = true) as
select k.id, k.no_kunjungan, k.tanggal, k.status, k.cara_bayar,
       p.id as pasien_id, p.no_rm, p.nama as nama_pasien,
       po.nama as nama_poli,
       d.nama as nama_dokter,
       (select string_agg(dg.kode_icd10 || ' - ' || dg.nama, '; ' order by dg.jenis)
          from diagnosa dg where dg.kunjungan_id = k.id) as daftar_diagnosa,
       (exists (select 1 from lab_permintaan lp where lp.kunjungan_id = k.id)) as ada_lab
from kunjungan k
join pasien p on p.id = k.pasien_id
join poli po on po.id = k.poli_id
left join pegawai d on d.id = k.dokter_id
order by k.tanggal desc, k.no_antrian desc;
