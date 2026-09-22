-- =====================================================================
--  RME Laboratorium Medis Utama - INDEKS LAPORAN AKTIVITAS KARYAWAN
--  Berkas: sql/69_laporan_aktivitas_karyawan.sql
--
--  Mengoptimalkan pencarian dan agregasi data kinerja karyawan untuk:
--  1. Pendaftaran Pasien (kunjungan.created_by)
--  2. Verifikasi Hasil Lab (lab_permintaan.selesai_oleh)
--  3. Pembuatan Surat (surat.dibuat_oleh)
--  4. Transaksi Kasir (kasir_pembayaran.dibuat_oleh)
-- =====================================================================

-- Indeks pelacakan pendaftaran pasien oleh petugas
create index if not exists idx_kunjungan_petugas_tanggal
  on public.kunjungan (created_by, tanggal desc);

-- Indeks pelacakan verifikasi hasil lab oleh analis/petugas lab
create index if not exists idx_lab_selesai_oleh_tanggal
  on public.lab_permintaan (selesai_oleh, tanggal desc);

-- Indeks pelacakan pembuatan surat keterangan oleh staf
create index if not exists idx_surat_petugas_tanggal
  on public.surat (dibuat_oleh, tanggal_surat desc);

-- Indeks pelacakan penerimaan pembayaran kasir oleh staf
create index if not exists idx_kasir_pembayaran_petugas_tanggal
  on public.kasir_pembayaran (dibuat_oleh, tanggal desc);
