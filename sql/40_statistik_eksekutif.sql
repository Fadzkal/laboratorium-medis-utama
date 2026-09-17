-- =====================================================================
--  40_statistik_eksekutif.sql
--  Modul Dashboard: Ringkasan Eksekutif untuk Manajemen
-- =====================================================================

create or replace function public.statistik_eksekutif()
returns json
language plpgsql
security definer
as $$
declare
  v_tgl date := public.tgl_klinik();
  v_bln integer := extract(month from v_tgl);
  v_thn integer := extract(year from v_tgl);
  v_bln_lalu integer := extract(month from (v_tgl - interval '1 month'));
  v_thn_lalu integer := extract(year from (v_tgl - interval '1 month'));
  
  v_total_pasien int := 0;
  v_kunjungan_hari_ini int := 0;
  v_kunjungan_bulan_ini int := 0;
  v_pendapatan_bulan_ini numeric := 0;
  v_pendapatan_bulan_lalu numeric := 0;
  v_stok_kritis_inventori int := 0;
  v_pegawai_hadir_hari_ini int := 0;
  v_total_bonus_bulan_ini numeric := 0;
begin
  -- 1. Pelayanan (Pasien & Kunjungan)
  select count(*) into v_total_pasien from pasien;
  select count(*) into v_kunjungan_hari_ini from kunjungan where tanggal = v_tgl;
  select count(*) into v_kunjungan_bulan_ini from kunjungan 
    where extract(month from tanggal) = v_bln and extract(year from tanggal) = v_thn;

  -- 2. Keuangan (Kasir Tagihan - Asumsi amount_paid adalah pendapatan kas)
  select coalesce(sum(amount_paid), 0) into v_pendapatan_bulan_ini 
    from kasir_tagihan 
    where extract(month from tanggal) = v_bln and extract(year from tanggal) = v_thn;
    
  select coalesce(sum(amount_paid), 0) into v_pendapatan_bulan_lalu 
    from kasir_tagihan 
    where extract(month from tanggal) = v_bln_lalu and extract(year from tanggal) = v_thn_lalu;

  -- 3. Operasional & Inventori (Stok Menipis)
  select count(*) into v_stok_kritis_inventori 
    from inventori_barang 
    where aktif = true and stok_sekarang <= stok_minimum;

  -- 4. HRIS (Kehadiran & Bonus)
  select count(distinct pegawai_id) into v_pegawai_hadir_hari_ini 
    from pegawai_absensi 
    where tanggal = v_tgl;
    
  select coalesce(sum(total_bonus), 0) into v_total_bonus_bulan_ini 
    from pegawai_bonus 
    where bulan = v_bln and tahun = v_thn;

  return json_build_object(
    'total_pasien', v_total_pasien,
    'kunjungan_hari_ini', v_kunjungan_hari_ini,
    'kunjungan_bulan_ini', v_kunjungan_bulan_ini,
    'pendapatan_bulan_ini', v_pendapatan_bulan_ini,
    'pendapatan_bulan_lalu', v_pendapatan_bulan_lalu,
    'stok_kritis_inventori', v_stok_kritis_inventori,
    'pegawai_hadir_hari_ini', v_pegawai_hadir_hari_ini,
    'total_bonus_bulan_ini', v_total_bonus_bulan_ini
  );
end;
$$;

-- Izinkan pegawai (terutama master) mengeksekusi fungsi ini
grant execute on function public.statistik_eksekutif() to authenticated;
