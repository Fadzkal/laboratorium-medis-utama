-- =====================================================================
--  RME & LIS Laboratorium Medis Utama
--  92_optimasi_kasir_menunggu.sql
--
--  Optimasi View v_kasir_menunggu dan Penambahan Index Kunci untuk
--  Mengatasi Error 500 Statement Timeout (PostgreSQL 57014).
-- =====================================================================

-- 1. Index pada tabel kunjungan (tanggal/tgl_kunjungan, status, pasien_id)
create index if not exists idx_kunjungan_tanggal_desc on public.kunjungan (tanggal desc);
create index if not exists idx_kunjungan_status on public.kunjungan (status);
create index if not exists idx_kunjungan_pasien on public.kunjungan (pasien_id, tanggal desc);
create index if not exists idx_kunjungan_tgl_status on public.kunjungan (tanggal desc, status);
create index if not exists idx_kunjungan_kasir_aktif on public.kunjungan (tanggal desc, status)
  where status not in ('BATAL');

-- 2. Index pada tabel antrean (tanggal, status, pasien_id)
create index if not exists idx_antrean_tanggal on public.antrean (tanggal desc);
create index if not exists idx_antrean_status on public.antrean (status);
create index if not exists idx_antrean_pasien on public.antrean (pasien_id);
create index if not exists idx_antrean_tgl_status on public.antrean (tanggal desc, status);

-- 3. Index tabel penunjang untuk relasi subquery kasir
create index if not exists idx_kasir_tagihan_kunjungan on public.kasir_tagihan (kunjungan_id)
  where kunjungan_id is not null;
create index if not exists idx_apotek_transaksi_kunjungan on public.apotek_transaksi (kunjungan_id)
  where kunjungan_id is not null;
create index if not exists idx_tindakan_kunjungan on public.tindakan (kunjungan_id);
create index if not exists idx_resep_kunjungan on public.resep (kunjungan_id);

-- 4. Optimasi View v_kasir_menunggu:
--    Menyaring hanya kunjungan aktif 7 hari terakhir (k.tanggal >= current_date - interval '7 days')
--    serta mengabaikan data poli impor/histori yang tidak memerlukan penagihan kasir.
create or replace view public.v_kasir_menunggu with (security_invoker = true) as
select k.id            as kunjungan_id,
       k.no_kunjungan,
       k.no_antrian,
       k.tanggal,
       k.cara_bayar,
       k.status        as status_kunjungan,
       p.id            as pasien_id,
       p.no_rm,
       p.nama          as nama_pasien,
       p.tanggal_lahir,
       p.jenis_kelamin,
       po.nama         as nama_poli,
       d.nama          as nama_dokter,
       (select count(*) from public.tindakan t where t.kunjungan_id = k.id)          as jumlah_tindakan,
       (select count(*) from public.apotek_transaksi at
         where at.kunjungan_id = k.id and at.jenis='KELUAR'
           and at.kategori='Resep Pasien' and not at.dibatalkan)                     as jumlah_obat,
       exists (select 1 from public.resep r where r.kunjungan_id = k.id
                 and r.status <> 'DISERAHKAN')                                       as resep_belum_diserahkan
  from public.kunjungan k
  join public.pasien p on p.id = k.pasien_id
  join public.poli po  on po.id = k.poli_id
  left join public.pegawai d on d.id = k.dokter_id
 where k.status not in ('BATAL')
   and k.tanggal >= (current_date - interval '7 days')
   and lower(coalesce(po.nama, '')) not like '%impor%'
   and lower(coalesce(po.nama, '')) not like '%histori%'
   and not exists (select 1 from public.kasir_tagihan tg where tg.kunjungan_id = k.id);

grant select on public.v_kasir_menunggu to authenticated;
grant select on public.v_kasir_menunggu to anon;

comment on view public.v_kasir_menunggu is
  'Daftar kunjungan aktif 7 hari terakhir yang siap ditagih kasir namun belum memiliki invoice tagihan.';
