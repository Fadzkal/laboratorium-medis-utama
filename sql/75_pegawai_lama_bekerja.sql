-- ============================================================================
-- Migrasi 75: Penambahan Kolom Tanggal Mulai Bekerja Pegawai
-- Laboratorium Medis Utama
-- Digunakan untuk menghitung lama masa kerja staf (Bulan & Tahun awal bekerja)
-- ============================================================================

ALTER TABLE IF EXISTS public.pegawai 
  ADD COLUMN IF NOT EXISTS tgl_mulai_kerja date;

COMMENT ON COLUMN public.pegawai.tgl_mulai_kerja IS 'Tanggal awal mulai bekerja staf/karyawan (YYYY-MM-01)';

-- Berikan izin akses select, insert, update kepada role authenticated dan anon (jika ada)
GRANT SELECT, UPDATE ON public.pegawai TO authenticated;
