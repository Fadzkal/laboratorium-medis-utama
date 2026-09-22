-- =====================================================================
--  RME Laboratorium Medis Utama — DOKUMEN HASIL LAB PADA SURAT KETERANGAN
--  Berkas: sql/68_surat_lab_keterangan.sql
-- =====================================================================

insert into public.ref_jenis_surat (kode, nama, judul_cetak, keterangan, perlu_kunjungan, urutan, aktif)
values
  ('LAB_UMUM',  'Hasil Lab Umum',       'HASIL PEMERIKSAAN LABORATORIUM', 'Format lengkap dengan metode dan nilai rujukan (5 kolom).', false, 7, true),
  ('LAB_BPJS',  'Hasil Lab BPJS',       'HASIL PEMERIKSAAN LABORATORIUM', 'Format klaim / verifikasi BPJS dengan logo dan instansi (4 kolom).', false, 8, true),
  ('LAB_KIRIM', 'Kirim PDF / Sederhana','HASIL PEMERIKSAAN LABORATORIUM', 'Format pengantar / hasil ringkas kirim PDF.', false, 9, true)
on conflict (kode) do update set
  nama = excluded.nama,
  judul_cetak = excluded.judul_cetak,
  keterangan = excluded.keterangan,
  perlu_kunjungan = excluded.perlu_kunjungan,
  urutan = excluded.urutan,
  aktif = true;
