-- =====================================================================
-- 65_OPTIMASI_LAPORAN_LAB.SQL
-- Optimasi performa kueri analitik 6 bulan & Laporan Laboratorium
-- Mencegah "canceling statement due to statement timeout" pada rentang
-- tanggal panjang dengan indexing, view ramping, dan fungsi agregasi RPC.
-- =====================================================================

-- 1. INDEKS KOMPOSIT UNTUK FILTER TANGGAL & GROUPING CEPAT
create index if not exists idx_kunjungan_tgl_poli on kunjungan (tanggal, poli_id);
create index if not exists idx_kunjungan_dokter on kunjungan (dokter_id);
create index if not exists idx_lab_permintaan_tgl_stat on lab_permintaan (tanggal, status);
create index if not exists idx_lab_permintaan_kunjungan_id on lab_permintaan (kunjungan_id);
create index if not exists idx_lab_hasil_permintaan_lab on lab_hasil (permintaan_id, lab_id);

-- 2. VIEW RAMPING KUNJUNGAN KHUSUS ANALITIK OVERVIEW (BEBAS SUBQUERY DIAGNOSA)
-- View ini hanya memuat kolom yang dibutuhkan grafik tren & overview
-- tanpa mengeksekusi subquery diagnosa (string_agg) yang sangat lambat pada ribuan baris.
create or replace view v_laporan_kunjungan_lean with (security_invoker = true) as
select
  k.id,
  k.tanggal,
  k.cara_bayar,
  k.jenis_kunjungan,
  k.dokter_id,
  coalesce(d.nama, 'APS (Atas Permintaan Sendiri)') as nama_dokter,
  coalesce(po.jenis::text, 'LAB') as jenis_poli,
  extract(hour from k.waktu_daftar at time zone 'Asia/Makassar')::smallint as jam_daftar
from kunjungan k
left join poli po on po.id = k.poli_id
left join pegawai d on d.id = k.dokter_id;

grant select on v_laporan_kunjungan_lean to authenticated;

-- 3. VIEW RAMPING PERMINTAAN LAB (RINGKASAN & STATISTIK)
create or replace view v_lab_permintaan_lean with (security_invoker = true) as
select
  lp.id,
  lp.tanggal,
  lp.status,
  coalesce(k.cara_bayar, 'UMUM') as cara_bayar,
  coalesce(d.nama, 'APS (Atas Permintaan Sendiri)') as nama_dokter,
  (select count(*) from lab_hasil h where h.permintaan_id = lp.id) as jml_pemeriksaan
from lab_permintaan lp
left join kunjungan k on k.id = lp.kunjungan_id
left join pegawai d on d.id = lp.diminta_oleh;

grant select on v_lab_permintaan_lean to authenticated;

-- 4. FUNGSI RPC TOP 10 / TOP N PEMERIKSAAN LAB (AGREGASI DATABASE LANGSUNG)
-- Agregasi GROUP BY langsung di Postgres, sangat cepat (< 50ms) dan mengembalikan
-- hanya N baris, bukan menarik ribuan baris JSON ke browser.
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
  order by jml desc
  limit coalesce(nullif(p_batas, 0), 100);
$$;

grant execute on function public.rpc_top_pemeriksaan_lab to authenticated;

-- 5. FUNGSI RPC DISTRIBUSI KATEGORI PEMERIKSAAN (DONUT CHART)
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
  select
    coalesce(nullif(trim(rl.kelompok), ''), 'Lainnya') as kelompok,
    count(*) as jml
  from lab_hasil h
  join lab_permintaan lp on lp.id = h.permintaan_id
  left join ref_lab rl on rl.id = h.lab_id
  where lp.tanggal >= p_dari and lp.tanggal <= p_sampai
    and lp.status <> 'BATAL'
  group by coalesce(nullif(trim(rl.kelompok), ''), 'Lainnya')
  order by jml desc;
$$;

grant execute on function public.rpc_distribusi_kategori_lab to authenticated;
