-- =====================================================================
-- 48_update_master_lab_dari_csv.sql
-- Memperbarui master data pemeriksaan lab (ref_lab & ref_lab_rujukan)
-- bersumber dari data resmi CSV Skylab & Standar Klinis Medis Nasional/Internasional
-- =====================================================================

-- 1. UPSERT ref_lab
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0101', 'Pemeriksaan Fisik', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0102', 'Analisa Cairan Pleura', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010201', 'Makroskopis', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020101', 'Kejernihan', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020102', 'Warna', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020103', 'Berat Jenis', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020104', 'Bau', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020105', 'Bekuan', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020106', 'pH', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010202', 'Mikroskopis', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020201', 'Jumlah Sel Leukosit', 'Fisik & PA', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020202', 'Jumlah Sel Eritrosit', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020203', 'Hitung Jenis Leukosit', 'Fisik & PA', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0102020301', 'Lymposit', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0102020302', 'Segmen', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0102020303', 'Monosit', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020204', 'Pewarnaan Gram', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020205', 'Pewarnaan BTA', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010203', 'Test Kimia', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020301', 'Protein Cairan Pleura', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A01020302', 'Glukosa Cairan Pleura', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010204', 'Tes Rivalta', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0103', 'Sekret Vagina', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010301', 'Trichomonas', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010302', 'Prep. KOH', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010303', 'Prep. Gram', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010304', 'Leukosit', 'Fisik & PA', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0104', 'Sekret Urethra', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010401', 'Trichomonas', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010402', 'Prep. KOH', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010403', 'Prep. Gram', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A010404', 'Leukosit', 'Fisik & PA', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0105', 'CITO', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0106', 'PA Jaringan Kecil', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0107', 'PA Jaringan Sedang', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0108', 'PA Jaringan Besar', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0109', 'PA Jaringan (Cairan Pleura)', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0111', 'Kultur dan Resistensi Antibiotik (Vagina)', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0113', 'Home Service 1', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0114', 'Home Service 2', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0115', 'Home Service 3', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0116', 'CITO 2', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0117', 'Pap Smear', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0118', 'PA Jaringan Sedang 2', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0119', 'Pemeriksaan Fisik', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0120', 'PA Jaringan Besar 2', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0122', 'Pap Smear Rujukan', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0123', 'PA Jaringan kecil 2', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0124', 'Home Service 4', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0126', 'Tes Fisik', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0127', 'Home Service 5', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0128', 'Home Service 6', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0129', 'Mantoux test', 'Fisik & PA', NULL, 'TEKS', NULL, 'Negatif :<BR>Indurasi < 6 mm<BR>Positif :<BR>Indurasi >= 6 mm', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0130', 'Cairan Asites', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0131', 'TTNA', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0133', 'Pa Cairan Pleura', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0134', 'kultur dahak', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0135', 'PA Jaringan Kecil 4', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0136', 'Sitologi Cairan', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0137', 'IVA test', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0138', 'Buta Warna', 'Fisik & PA', NULL, 'TEKS', NULL, 'Normal', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0140', 'Pulasan BTA', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0142', 'Sampling Swab', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0143', 'APD', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0145', 'tensi', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0147', 'Biaya Penanganan', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0149', 'Biaya VTM', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0151', 'APD + Homeservice', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0154', 'Sampling', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0156', 'APD + Home Service', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0158', 'USG', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0159', 'USG Abdomen', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0160', 'Audiometri', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0161', 'Spirometri', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0162', 'Biaya Antar', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('A0163', 'Harvard Step Test', 'Fisik & PA', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('B0101', 'Chlamydia Pnemonia PCR', 'Biomolekuler', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('B0102', 'Chlamydia Trachomatis PCR', 'Biomolekuler', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('B0103', 'HBV DNA Kuantitatif', 'Biomolekuler', NULL, 'TEKS', NULL, 'Negative', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('B0104', 'HCV RNA Genotyping', 'Biomolekuler', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('B0105', 'HCV RNA Kuantitatif', 'Biomolekuler', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('B0106', 'M. Tuberculose', 'Biomolekuler', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('B0107', 'Salmonella Typhi', 'Biomolekuler', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('B0108', 'Mycoplasma Pneumonia PCR', 'Biomolekuler', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('B0109', 'Toxoplasma Gondii', 'Biomolekuler', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C0101', 'CITO 4', 'Analisa Cairan', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C0102', 'Analisa Cairan Pleura/Acites', 'Analisa Cairan', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C010201', 'Jenis Sampel', 'Analisa Cairan', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C010202', 'Makroskopis', 'Analisa Cairan', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020201', 'Warna', 'Analisa Cairan', NULL, 'TEKS', NULL, 'Transudat: Kuning Muda<BR>Eksudat: Kuning - Hijau', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020202', 'Kekeruhan', 'Analisa Cairan', NULL, 'TEKS', NULL, 'Transudat; Jernih<BR>Eksudat: Keruh', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020203', 'Berat Jenis', 'Analisa Cairan', NULL, 'TEKS', NULL, 'Transudat : < 1.018<BR>Exudat : > 1.018', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020204', 'Bekuan', 'Analisa Cairan', NULL, 'TEKS', NULL, 'Transudat: (-) Bekuan<BR>Eksudat:(-) Bekuan', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020205', 'PH', 'Analisa Cairan', NULL, 'TEKS', NULL, 'Transudat: >7,31<BR>Eksudat: < 7,31', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C010203', 'Kimia', 'Analisa Cairan', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020301', 'Rivalta', 'Analisa Cairan', NULL, 'TEKS', NULL, 'Transudat: (-)<BR>Eksudat: (+) Kekeruhan', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020302', 'Protein', 'Analisa Cairan', 'gr/dl', 'TEKS', NULL, 'Transudat : < 3 gr%<BR>Eksudat : > 3gr%', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020303', 'Glukosa', 'Analisa Cairan', 'mg/dl', 'ANGKA', NULL, 'Transudat : = plasma darah <BR> Eksudat : < plasma darah', 1, '2345-7', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020304', 'Albumin cairan tubuh', 'Analisa Cairan', 'gr/dl', 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C010204', 'Mikroskopis', 'Analisa Cairan', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020401', 'Jumlah Sel', 'Analisa Cairan', 'sel/mm3', 'ANGKA', NULL, 'Transudat : < 300<BR>Eksudat : > 1000', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020402', 'Hitung Jenis Sel', 'Analisa Cairan', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020403', 'MN', 'Analisa Cairan', '%', 'ANGKA', NULL, NULL, 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('C01020404', 'PMN', 'Analisa Cairan', '%', 'ANGKA', NULL, 'Transudat : = Sedikit<BR>Exudat : < Banyak', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('E0101', 'Elektro Kardiografi/EKG', 'Elektromedik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('E0102', 'Autospirometri', 'Elektromedik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('E0103', 'Audiogram', 'Elektromedik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('E0104', 'Electroencephalografi / EEG', 'Elektromedik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('E0105', 'Treadmill', 'Elektromedik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('E0106', 'Holter Mobitoring', 'Elektromedik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('E0107', 'TCD', 'Elektromedik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F0101', 'Faeces', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F010101', 'Makroskopis', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F01010101', 'Warna', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F01010102', 'Konsistensi', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F01010103', 'Lendir', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F01010104', 'Darah', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F010102', 'Mikroskopis', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F01010201', 'Sel Leukosit', 'Feses', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F01010202', 'Sel Eritrosit', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F01010203', 'Lain-Lain', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F01010204', 'Telur Cacing', 'Feses', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('F0102', 'Benzidine Test', 'Feses', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('G0101', 'tes', 'Lainnya', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('G010101', 'tes 2', 'Lainnya', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('G0102', 'CITO 4', 'Lainnya', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('G0103', 'Vitamin D', 'Lainnya', 'ng/ml', 'TEKS', NULL, 'Defisiensi : < 20Insufisiensi : 20 - 29Sufficient : 30 - 100Potential Toxicity :> 100', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0101', 'Hematologi Lengkap', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 1, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010101', 'Hemoglobin', 'Hematologi', 'g/dl', 'ANGKA', NULL, 'L: 14.0 - 18.0 | P: 12.0 - 16.0', 1, NULL, 2, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010102', 'Leukosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 3, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010103', 'Trombosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 150 - 450 | P: 150 - 450', 1, NULL, 4, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010104', 'Hematokrit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 40.0 - 54.0 | P: 37.0 - 47.0', 1, NULL, 5, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010105', 'Eritrosit', 'Hematologi', '10^6/pl', 'ANGKA', NULL, 'L: 4.60 - 6.20 | P: 4.20 - 5.40', 1, NULL, 6, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010106', 'Laju Endap Darah(LED)', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 7, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010601', 'LED 1 Jam', 'Hematologi', 'mm', 'ANGKA', NULL, 'L: 0 - 10 | P: 0 - 10', 1, NULL, 8, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010602', 'LED 2 Jam', 'Hematologi', 'mm', 'ANGKA', NULL, 'L: Oct-20 | P: Oct-20', 1, NULL, 9, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010107', 'Hitung Jenis', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 10, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010701', 'N. Batang', 'Hematologi', '%', 'ANGKA', NULL, 'L: 03-May | P: 03-May', 1, NULL, 13, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010702', 'N. Segmen', 'Hematologi', '%', 'ANGKA', NULL, 'L: 35 - 70 | P: 35 - 70', 1, NULL, 14, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010703', 'Limfosit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 20 - 40 | P: 20 - 40', 1, NULL, 15, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010704', 'Monosit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 02-Oct | P: 02-Oct', 1, NULL, 16, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010705', 'Eosinofil', 'Hematologi', '%', 'ANGKA', NULL, 'L: 01-Apr | P: 01-Apr', 1, NULL, 12, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010706', 'Basofil', 'Hematologi', '%', 'ANGKA', NULL, 'L: 0 - 1 | P: 0 - 1', 1, NULL, 11, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010108', 'Nilai-nilai MC', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 17, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010801', 'MCV', 'Hematologi', 'fl', 'ANGKA', NULL, '80 - 96', 1, NULL, 17, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010802', 'MCH', 'Hematologi', 'pg', 'ANGKA', NULL, '27 - 31', 1, NULL, 17, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01010803', 'MCHC', 'Hematologi', 'g/dl', 'ANGKA', NULL, '32 - 36', 1, NULL, 17, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010109', 'RDW', 'Hematologi', '%', 'ANGKA', NULL, '11.5 - 14.5', 1, NULL, 18, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0102', 'Hematologi Rutin', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010201', 'Hemoglobin', 'Hematologi', 'g/dl', 'ANGKA', NULL, 'L: 14.0 - 18.0 | P: 12.0 - 16.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010202', 'Leukosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010203', 'Trombosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 150 - 450 | P: 150 - 450', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010204', 'Hematokrit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 40.0 - 54.0 | P: 37.0 - 47.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0106', 'Golongan Darah ABO', 'Hematologi', NULL, 'PILIHAN', ARRAY['A', 'B', 'AB', 'O']::text[], NULL, 0, '883-9', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0107', 'Golongan Darah ABO + Rhesus', 'Hematologi', NULL, 'PILIHAN', ARRAY['A', 'B', 'AB', 'O']::text[], NULL, 0, '882-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010701', 'Golongan Darah', 'Hematologi', NULL, 'PILIHAN', ARRAY['A', 'B', 'AB', 'O']::text[], NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H010702', 'Rhesus', 'Hematologi', NULL, 'PILIHAN', ARRAY['Positif (+)', 'Negatif (-)']::text[], NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0108', 'Faal Hemostasis', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0109', 'Waktu Pendarahan (BT)', 'Hematologi', 'Menit', 'ANGKA', NULL, 'L: 01-Mar | P: 01-Mar', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0110', 'Waktu Pembekuan (CT)', 'Hematologi', 'Menit', 'ANGKA', NULL, 'L: 02-May | P: 02-May', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0111', 'Protrombine Time(PT)', 'Hematologi', 'Detik', 'ANGKA', NULL, '11.7 - 15.1', 1, '5964-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0112', 'APTT', 'Hematologi', 'Detik', 'ANGKA', NULL, '22.5 - 40.1', 1, '91119-8', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0113', 'Fibrinogen', 'Hematologi', 'mg/dl', 'ANGKA', NULL, '154 - 397', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0114', 'D-Dimer', 'Hematologi', 'ng/mL', 'ANGKA', NULL, '< 500', 1, '48058-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0115', 'Trombine Time', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0116', 'Rektraksi Bekuan', 'Hematologi', NULL, 'ANGKA', NULL, NULL, 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0117', 'Viskositas Darah', 'Hematologi', 'cp', 'ANGKA', NULL, '3.5 - 5.1', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0118', 'Viskositas Plasma', 'Hematologi', 'cp', 'ANGKA', NULL, '1.4 - 1.8', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0119', 'Retikulosit', 'Hematologi', '%', 'ANGKA', NULL, '0.5 - 1.5', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0120', 'Serum Iron(Fe)', 'Hematologi', 'ug/dL', 'ANGKA', NULL, '37 - 145', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0121', 'Ferritin', 'Hematologi', 'ng/mL', 'ANGKA', NULL, 'L : 22-322<BR>P : 10-291', 1, '20567-4', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0122', 'Transferin', 'Hematologi', 'mg/dL', 'ANGKA', NULL, '200 - 360', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0123', 'Asam Folat', 'Hematologi', 'ng/ml', 'ANGKA', NULL, '3.1 - 17.5', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0124', 'Coombs Test Direct', 'Hematologi', NULL, 'TEKS', NULL, 'Negative', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0125', 'Coombs Test Indirect', 'Hematologi', NULL, 'TEKS', NULL, 'Negative', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0126', 'G 6 PDH', 'Hematologi', 'U/10*12', 'ANGKA', NULL, '146 - 376', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0127', 'Hb Elektroforesis', 'Hematologi', NULL, 'TEKS', NULL, 'HbA = 96 - 99 HbA2 = <=3,5 HbF = < 2', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0128', 'Test Agregasi Trombosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 150 - 450 | P: 150 - 450', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0129', 'BJ Plasma', 'Hematologi', NULL, 'ANGKA', NULL, '1.025 - 1.033', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0130', 'CD 4', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0131', 'CD 8', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0132', 'Malaria', 'Hematologi', NULL, 'TEKS', NULL, 'Negative', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H013201', 'Plasmodium Vivax', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H013202', 'Plasmodium Falciparum', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0133', 'Hb F', 'Hematologi', '%', 'ANGKA', NULL, '< 2', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0134', 'Mikro Filaria', 'Hematologi', NULL, 'TEKS', NULL, 'Negative', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0135', 'Resistensi Osmotik', 'Hematologi', '%', 'ANGKA', NULL, 'Start Hemolyse : 0.40-0.44 Complete Hemolyse : 0.30-0.34', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0136', 'Rumpell Leede(RL)', 'Hematologi', NULL, 'TEKS', NULL, 'Negative', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0137', 'Hemoglobin', 'Hematologi', 'g/dl', 'ANGKA', NULL, 'L: 14.0 - 18.0 | P: 12.0 - 16.0', 1, '718-7', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0138', 'Leukosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, '6690-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0139', 'Eritrosit', 'Hematologi', '10^6/pl', 'ANGKA', NULL, 'L: 4.60 - 6.20 | P: 4.50 - 5.40', 1, '26453-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0140', 'Trombosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 150 - 450 | P: 150 - 450', 1, '777-3', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0141', 'Hematokrit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 40.0 - 54.0 | P: 37.0 - 47.0', 1, '20570-8', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0142', 'MCV', 'Hematologi', 'fl', 'ANGKA', NULL, '80 - 96', 1, '787-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0143', 'MCH', 'Hematologi', 'fl', 'ANGKA', NULL, '27.5 - 33.2', 1, '785-6', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0144', 'MCHC', 'Hematologi', 'fl', 'ANGKA', NULL, '33.4 - 35.5', 1, '786-4', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0145', 'Hitung Jenis', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014501', 'Batang', 'Hematologi', '%', 'ANGKA', NULL, 'L: 03-May | P: 03-May', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014502', 'Segmen', 'Hematologi', '%', 'ANGKA', NULL, 'L: 35 - 70 | P: 35 - 70', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014503', 'Limfosit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 20 - 40 | P: 20 - 40', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014504', 'Monosit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 02-Oct | P: 02-Oct', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014505', 'Eosinofil', 'Hematologi', '%', 'ANGKA', NULL, 'L: 01-Apr | P: 01-Apr', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014506', 'Basofil', 'Hematologi', '%', 'ANGKA', NULL, 'L: 0 - 1 | P: 0 - 1', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0146', 'Morfolgi Darah Tepi', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014601', 'Seri Eritrosit', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014602', 'Seri Leukosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014603', 'Seri Trombosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 150 - 450 | P: 150 - 450', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014604', 'Kesan', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H014605', 'Saran', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0147', 'TIBC', 'Hematologi', 'ug/dL', 'ANGKA', NULL, '228 - 428', 1, '2500-7', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0148', 'analisa HB ( HPLC )', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0149', 'hapusan sumsum tulang', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0150', 'LE test', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0151', 'eosinofil', 'Hematologi', 'sel / mm³', 'ANGKA', NULL, '50 - 350', 1, '713-8', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H015202', 'Vaksin Hepatitis', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0153', 'Vaksin Hepatitis', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0154', 'Gol darah rhesus', 'Hematologi', NULL, 'PILIHAN', ARRAY['Positif (+)', 'Negatif (-)']::text[], NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0155', 'PROFILE IRON', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0156', 'Vaksin MMR', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0157', 'Hapusan Darah', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0158', 'LED ( Laju Endap Darah )', 'Hematologi', NULL, 'TEKS', NULL, 'L: < 10 | P: < 20', 0, '4537-7', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H015801', 'LED 1 Jam', 'Hematologi', 'mm', 'ANGKA', NULL, '0 - 10', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H015802', 'LED 2 Jam', 'Hematologi', 'mm', 'ANGKA', NULL, 'Oct-20', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0159', 'malaria preparat', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0160', 'Hematologi Rutin + LED', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016001', 'Hemoglobin', 'Hematologi', 'g/dl', 'ANGKA', NULL, 'L: 14.0 - 18.0 | P: 12.0 - 16.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016002', 'Leukosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016003', 'Trombosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 150 - 450 | P: 150 - 450', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016004', 'Hematokrit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 40.0 - 54.0 | P: 37.0 - 47.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016005', 'Eritrosit', 'Hematologi', '10^6/pl', 'ANGKA', NULL, 'L: 4.60 - 6.20 | P: 4.20 - 5.40', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016006', 'Laju Endap Darah (LED)', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01600601', 'LED 1 jam', 'Hematologi', 'mm', 'ANGKA', NULL, 'L: 0 - 10 | P: 0 - 10', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01600602', 'LED 2 jam', 'Hematologi', 'mm', 'ANGKA', NULL, 'L: Oct-20 | P: Oct-20', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0161', 'Golongan Darah ABO + Rhesus', 'Hematologi', NULL, 'PILIHAN', ARRAY['A', 'B', 'AB', 'O']::text[], NULL, 0, '882-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016101', 'Golongan Darah', 'Hematologi', NULL, 'PILIHAN', ARRAY['A', 'B', 'AB', 'O']::text[], NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016102', 'Rhesus', 'Hematologi', NULL, 'PILIHAN', ARRAY['Positif (+)', 'Negatif (-)']::text[], NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0162', 'Vaksin Difteri', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0163', 'RA', 'Hematologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0165', 'D-Dimer', 'Hematologi', 'ng/mL', 'ANGKA', NULL, '< 500', 1, '48058-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0166', 'Fibrinogen', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0167', 'Vaksin Influenza', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0169', 'Hitung Jenis', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016901', 'N.Batang', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016902', 'N. Segmen', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016903', 'Limfosit', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016904', 'Monosit', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016905', 'Eosinofil', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H016906', 'Basofil', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0170', 'GDT', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0171', 'INR', 'Hematologi', NULL, 'ANGKA', NULL, '0.83 - 1.11', 1, '38875-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0172', 'INR (Paket PT, APTT)', 'Hematologi', NULL, 'TEKS', NULL, '1.00 - 1.99', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0173', 'Centrifugasi Whole Blood', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0174', 'NLR', 'Hematologi', NULL, 'TEKS', NULL, '01-Mar', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0175', 'Hematologi Lengkap tanpa LED', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H017501', 'Hemoglobin', 'Hematologi', 'g/dl', 'ANGKA', NULL, 'L: 14.0-18.0 | P: 12.0 - 16.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H017502', 'Leukosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 5.0 - 10.0 | P: 5.0 - 10.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H017503', 'Trombosit', 'Hematologi', '10^3/pl', 'ANGKA', NULL, 'L: 150 - 450 | P: 150 - 450', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H017504', 'Hematokrit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 40.0 - 54.0 | P: 37.0 - 47.0', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H017505', 'Eritrosit', 'Hematologi', '10^6/pl', 'ANGKA', NULL, 'L: 4.60 - 6.20 | P: 4.20 - 5.40', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H017506', 'HItung Jenis', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01750601', 'N. Batang', 'Hematologi', '%', 'ANGKA', NULL, 'L: 03-May | P: 03-May', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01750602', 'N. Segmen', 'Hematologi', '%', 'ANGKA', NULL, 'L: 35 - 70 | P: 35 - 70', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01750603', 'Limfosit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 20 - 40 | P: 20 - 40', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01750604', 'Monosit', 'Hematologi', '%', 'ANGKA', NULL, 'L: 02-Oct | P: 02-Oct', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01750605', 'Eosinofil', 'Hematologi', '%', 'ANGKA', NULL, 'L: 01-Apr | P: 01-Apr', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H01750606', 'Basofil', 'Hematologi', '%', 'ANGKA', NULL, 'L: 0 - 1 | P: 0 - 1', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0177', 'RDW-CV', 'Hematologi', '%', 'ANGKA', NULL, '11.5 - 14.5', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0178', 'Lupus Antikoagulan - 1 (LA-1)', 'Hematologi', 'Detik', 'ANGKA', NULL, '31 - 44', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0179', 'Lupus Antikoagulan - 2 (LA-2)', 'Hematologi', 'Detik', 'ANGKA', NULL, '30 - 38', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0180', 'Ratio LA', 'Hematologi', NULL, 'TEKS', NULL, '0.8 - 1.2', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H0181', 'Hb Elektroforesis', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('H02', 'contoh 21-2', 'Hematologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0201', 'HbsAg', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '5195-3', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0202', 'Anti Hbs', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '16935-9', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0203', 'Anti HCV', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '13955-0', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0204', 'Anti HBc', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '75378-0', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0205', 'Anti HAV', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I020501', 'Anti HAV IgG', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '32018-4', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I020502', 'Anti HAV IgM', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '22314-9', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0206', 'T3', 'Imunoserologi', 'nmol/l', 'ANGKA', NULL, '1.23 - 3.07', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0207', 'T4', 'Imunoserologi', 'nmol/l', 'ANGKA', NULL, '66 - 181', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0208', 'Alpha - Fetoprotein', 'Imunoserologi', 'ng/mL', 'TEKS', NULL, '< 7.02', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0209', 'CEA', 'Imunoserologi', 'ng/ml', 'TEKS', NULL, '< 4.7', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0211', 'Hbe Ag', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, '5191-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0212', 'Anti HBe', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, '5189-6', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0213', 'FT4 N', 'Imunoserologi', 'pmol/l', 'ANGKA', NULL, '10.6 - 19.4', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0214', 'TSH', 'Imunoserologi', 'uIU/ml', 'TEKS', NULL, 'Eutiroid = 0.25 - 5.0<BR>Hypertyroid = < 0.15<BR>Hypotyroid = > 7.0', 0, '3016-3', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0216', 'Anti Dengue', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I021601', 'Anti Dengue IgG', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I021602', 'Anti Dengue IgM', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0219', 'TPHA', 'Imunoserologi', NULL, 'TEKS', NULL, 'Non Reaktif', 0, '8041-6', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0221', 'VDRL', 'Imunoserologi', NULL, 'TEKS', NULL, 'Non Reaktif', 0, '5292-8', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0223', 'CRP', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '11039-5', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0224', 'ASTO', 'Imunoserologi', 'IU/ml', 'ANGKA', NULL, '<= 200', 1, '25788-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0225', 'Tubercolusis', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022501', 'Tubercolusis IgG', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022502', 'Tubercolusis IgM', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0227', 'Rhematoid Factors', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '5297-7', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0228', 'Widal', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022801', 'S. Typhi O', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022802', 'S. Typhi H', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022803', 'S. Paratyphi A-O', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022804', 'S. Paratyphi A-H', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022805', 'S. Paratyphi B-O', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022806', 'S. Paratyphi B-H', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022807', 'S. Paratyphi C-O', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I022808', 'S. Paratyphi C-H', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0229', 'Tubex TF', 'Imunoserologi', NULL, 'TEKS', NULL, 'Interpretasi hasil TUBEX TF:<BR>0 - 2 : Negatif, Tidak mengindikasikan terjadinya infeksi demam tifoid pada saat ini.<BR>4 - 10 : Postif, Semakin tinggi skornya, maka semakin kuat indikasi terjadinya infeksi demam tifoid pada saat ini', 0, '17566-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0230', 'Ca 125', 'Imunoserologi', 'U/mL', 'ANGKA', NULL, '<= 35', 1, '83082-8', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0231', 'Ca 15-3', 'Imunoserologi', 'U/mL', 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0232', 'Ca 19-9', 'Imunoserologi', 'U/mL', 'TEKS', NULL, '< 37.0', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0233', 'IgE Total', 'Imunoserologi', 'IU/ml', 'TEKS', NULL, '< 100', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0234', 'NS1', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0235', 'IgM Anti Toxoplasma', 'Imunoserologi', 'IU/mL', 'TEKS', NULL, 'Negatif < 0.55<BR>Equivocal : 0.55 - < 0.65<BR>disarankan periksa kembali 2-3 minggu kemudian<BR>Positif : >= 0.65', 0, '5390-0', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0236', 'IgG Anti Toxoplasma', 'Imunoserologi', 'IU/mL', 'TEKS', NULL, 'Negatif < 4<BR>Equivocal : 4 - <8<BR>disarankan periksa kembali 2-3 minggu kemudian<BR>Positif : >= 8', 0, '5388-4', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0237', 'IgM Anti Rubella', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif < 0.80<BR>Equivocal : 0.80 - 1.20<BR>Positif : >= 1.20', 0, '5335-5', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0238', 'IgG Anti Rubella', 'Imunoserologi', 'IU/mL', 'TEKS', NULL, 'Negatif < 10<BR>Equivocal : 10 - 15<BR>Positif : >= 15', 0, '5334-8', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0239', 'IgM Anti CMV', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif < 0.70<BR>Equivocal : 0.70 - 0.90<BR>Positif : >= 0.90', 0, '5126-8', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0240', 'IgG Anti CMV', 'Imunoserologi', 'aU/mL', 'TEKS', NULL, 'Negatif < 4<BR>Equivocal : 4 - 6<BR>Positif : >= 6', 0, '5124-3', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0241', 'IgM Anti HSV 2', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif < 0.90<BR>Equivocal : >0.90 - <1.0<BR>Positif : >= 1.0', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0242', 'IgG Anti HSV 2', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif < 0.90<BR>Equivocal : >0.90 - <1.0<BR>Positif : >= 1.0', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0243', 'Test Kehamilan', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0244', 'Widal 2 Set', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I024401', 'S. Typhi O Set 2', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I024402', 'S. Typhi H Set 2', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0245', 'ICT TB', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I024501', 'IgG ICT TB', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I024502', 'IgM ICT TB', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0246', 'Anti HIV', 'Imunoserologi', NULL, 'TEKS', NULL, 'Non Reaktif', 0, '59419-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0247', 'RF', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0248', 'VDRL Titer', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, '50690-7', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0249', 'TPHA Titer', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, '26009-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0250', 'FT3', 'Imunoserologi', 'pg/ml', 'ANGKA', NULL, '2.15 - 5.83', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0251', 'ANA Test', 'Imunoserologi', 'Unit', 'TEKS', NULL, 'Negatif : < 20<BR>Equivocal : 20 - 60<BR>Positif : > 60', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0252', 'Mantoux Test', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif :<BR>Indurasi < 6 mm<BR>Positif :<BR>Indurasi >= 6 mm', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0253', 'Anti Hbs Titer', 'Imunoserologi', 'IU/L', 'ANGKA', NULL, 'Negatif < 10', 1, '32019-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0254', 'TORCH', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0255', 'Aviditas Toxoplasma IgG', 'Imunoserologi', NULL, 'TEKS', NULL, 'Low avidity IgG :<BR>< 0.20<BR>Borderline avidity IgG :<BR>0.20 - < 0.30<BR>High Avidity IgG :<BR>>= 0.30', 0, '56990-5', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0256', 'Aviditas CMV IgG', 'Imunoserologi', NULL, 'TEKS', NULL, '< 0.8 Infeksi primer kurang dari 3 bulan<BR>>= 0.8 Infeksi primer lebih dari 3 bulan', 0, '52984-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0257', 'IgM Salmonella Typhi', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0258', 'Salmonella Typhi', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I025801', 'IgG', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I025802', 'IgM', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0259', 'Dengue NS1 Antigen', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '75377-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0261', 'FT4 (Jangan dipakai)', 'Imunoserologi', 'ng/dL', 'ANGKA', NULL, '0.77 - 1.59', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0262', 'Anti Chlamydia trachomatis IgG', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0263', 'Anti Chlamydia trachomatis IgG', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0264', 'Anti Chlamydia trachomatis IgM', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0265', 'Salmonella Typhi', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I026501', 'Salmonella Typhi IgG', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I026502', 'Salmonella Typhi IgM', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0266', 'TSHs', 'Imunoserologi', 'uIU/ml', 'TEKS', NULL, 'Eutiroid : 0.34 - 4.22<BR>Hipertiroid : < 0.34<BR>Hipotiroid : > 4.2', 0, '11580-8', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0267', 'HbsAg Titer', 'Imunoserologi', NULL, 'TEKS', NULL, 'Non Reaktif < 0.13<BR>Reaktif >= 0.13', 0, '63557-3', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0268', 'ICT Malaria', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I026801', 'Plasmodium falciparum', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I026802', 'Plasmodium vivax', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0269', 'IgM Anti HBc', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, '24113-3', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0270', 'IgG Anti HSV 1', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif : < 0.6Equivocal : >= 0.6 - < 1.0Positif : >= 1.0', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0271', 'IgM Anti HSV 1', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif : < 0.90<BR>Equivocal : 0.90 - 1.10<BR>Positif : > 1.10', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0272', 'IgM Leptospira', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, '23202-5', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0273', 'Beta HCG Kuant. Serum', 'Imunoserologi', 'mIU/ml', 'TEKS', NULL, 'NILAI NORMAL BETA HCG', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0274', 'IgG ACA', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0275', 'IgM ACA', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0276', 'PSA Total', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0277', 'Rapid Test Antibodi Anti SARS cov-2', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I027701', 'Anti SARS-coV 2 IgM', 'Imunoserologi', NULL, 'TEKS', NULL, 'Non Reaktif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I027702', 'Anti SARS-coV 2 IgG', 'Imunoserologi', NULL, 'TEKS', NULL, 'Non Reaktif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I027707', 'Keterangan', 'Imunoserologi', NULL, 'TEKS', NULL, 'Catatan : <BR>Hasil Non Reaktif tidak menyingkirkan kemungkinan terinfeksi SARS-CoV-2 sehingga masih beresiko menularkan<BR>ke orang lain. Hasil Non Reaktif dapat terjadi pada kondisi :<BR>- Seseorang belum/tidak terinfeksi <BR>- Window period(terinfeksi namun antibodi belum terbentuk)<BR>- Immunocompromised<BR>- Kadar antibodi dibawah level deteksi alat <BR><BR>Saran :<BR>- Ulang pemeriksaan rapid tes antibodi 10 hari kemudian<BR>- Tetap menjaga social/physical distancing <BR>- Pertahankan perilaku hidup bersih dan sehat(Cuci tangan, terapkan etika batuk, gunakan masker saat sakit,<BR> jaga stamina).', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I027708', 'Keterangan', 'Imunoserologi', NULL, 'TEKS', NULL, 'Saran :<BR>- Lanjutkan dengan pemeriksaan konfirmasi PCR <BR>- Tetap lakukan Social Distancing/isolasi diri.', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0278', 'Syphilis', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0279', 'Antigen SARS CoV-2', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I027906', 'Keterangan', 'Imunoserologi', NULL, 'TEKS', NULL, '<b>Saran</b>: <br><ul><li>Pemeriksaan konfirmasi dengan pemeriksaan RT-PCR</li><li>Lakukan karantina atau isolasi sesuai dengan kriteria</li><li>Menerapkan PHBS (perilaku hidup bersih dan sehat): mencuci tangan, menerapkan etika batuk, menggunakan masker saat sakit, menjaga stamina), dan <i>physical distancing</i>.</li></ul>', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I027907', 'Keterangan', 'Imunoserologi', NULL, 'TEKS', NULL, '<b>Catatan :</b><br><ul><li>Hasil negatif tidak menyingkirkan kemungkinan terinfeksi SARS-CoV-2 sehingga masih berisiko menularkan ke orang lain, disarankan tes ulang atau tes konfirmasi dengan NAAT (nucleic acid amplification tests), bila probabilitas pretes relatif tinggi, terutama bila pasien bergejala atau diketahui memiliki kontak dengan orang yang terkonfirmasi COVID-19.</li><li>Hasil negatif dapat terjadi pada kondisi kuantitas antigen pada spesimen dibawah level deteksi alat.</li></ul>', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0280', 'Rapid Syphilis', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0282', 'hs-CRP', 'Imunoserologi', 'mg/L', 'TEKS', NULL, '0.00 - 10.0', 0, '30522-7', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0284', 'Amilase', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0285', 'Anti SARS-CoV 2 Kuantitatif', 'Imunoserologi', 'AU/mL', 'TEKS', NULL, 'L: Negatif : < 10.00 AU/mL<BR>Positif : >= 10.00 AU/mL | P: Negatif : < 10.00 AU/mL<BR>Positif : >= 10.00 AU/mL', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0286', 'Dengue Duo', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I028601', 'Dengue IgG', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I028602', 'Dengue IgM', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I028603', 'Dengue NS1', 'Imunoserologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0287', 'Free PSA', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0288', 'CRP Titer', 'Imunoserologi', 'mg/L', 'TEKS', NULL, '0.00 - 10.0', 0, '1988-5', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0289', 'Asto Titer', 'Imunoserologi', 'IU/ml', 'TEKS', NULL, 'Negatif', 0, '22568-0', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0290', 'Tes HIV Konfirmasi', 'Imunoserologi', NULL, 'TEKS', NULL, 'Non Reaktif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0292', 'RPR (Rapid Plasma Reagin) Syphilis', 'Imunoserologi', NULL, 'TEKS', NULL, 'Non Reaktif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0293', 'ANA IF', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0294', 'ANA Profile', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0295', 'Hormon', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('I0297', 'Human Growth Hormon', 'Imunoserologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0301', 'Cholesterol Total', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, '< 200', 1, '2093-3', 301, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0302', 'Cholesterol LDL', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, '< 100', 1, '2089-1', 304, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0303', 'Cholesterol HDL', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, '40 - 60', 1, '2085-9', 303, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0304', 'Trigliserida', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, '< 200', 1, '2571-8', 302, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0305', 'CK', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, '< 145', 1, NULL, 305, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0306', 'CK-MB', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: sampai 25 | P: sampai 25', 1, NULL, 306, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0307', 'SGOT', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: Sampai 35 | P: Sampai 31', 1, '88112-8', 307, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0308', 'SGPT', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: Sampai 45 | P: Sampai 34', 1, '1744-2', 308, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0309', 'Gamma GT', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'May-85', 1, '2324-2', 309, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0311', 'Alkaline Fosfatase', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: 80 - 306 | P: 80 - 306', 1, '6768-6', 311, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0312', 'LDH', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: 120- 240 | P: 120 - 240', 1, NULL, 317, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0314', 'Kalium', 'Kimia Klinik', 'mmol/L', 'ANGKA', NULL, '3.5 - 5.5', 1, '6298-4', 318, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0315', 'Natrium', 'Kimia Klinik', 'mmol/L', 'ANGKA', NULL, '135 - 145', 1, '2947-0', 319, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0316', 'Chlorida', 'Kimia Klinik', 'mmol/L', 'ANGKA', NULL, '96 - 106', 1, '2069-3', 320, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0317', 'Bilirubin Total', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, 'L: Sampai 1.00 | P: Sampai 1.00', 1, '1975-2', 312, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0318', 'Bilirubin Direct', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, '0.4', 1, '1968-7', 313, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0319', 'Total Protein', 'Kimia Klinik', 'g/dl', 'ANGKA', NULL, '6.6 - 8.7', 1, '2885-2', 314, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0321', 'Albumin', 'Kimia Klinik', 'g/dl', 'ANGKA', NULL, '3.4 - 4.8', 1, '61151-7', 315, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0322', 'Globulin', 'Kimia Klinik', 'gram%', 'ANGKA', NULL, 'L: 1.5 - 3.0 | P: 1.5 - 3.0', 1, '10834-0', 316, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0325', 'Cholinesterase', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: 3000 - 9300 | P: 3000 - 9300', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0326', 'Glukosa Darah Puasa', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, '70 - 115', 1, '2345-7', 329, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0327', 'Glukosa Darah 2 Jam PP', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, 'L: < 140 | P: < 140', 1, '2345-7', 330, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0328', 'Glukosa Darah Sewaktu', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, 'L: < 140 | P: < 140', 1, '2345-7', 331, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0329', 'Ureum', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, 'Oct-50', 1, '20977-5', 326, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0331', 'Creatinin', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, '0.6 - 1.3', 1, '2160-0', 327, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0332', 'Asam Urat', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, 'L: 3.4 - 7.0 | P: 2.4 - 5.7', 1, '3084-1', 328, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0333', 'Amylase', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: Sampai 120 | P: Sampai 120', 1, NULL, 333, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0334', 'Lipase', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: Sampai 190 | P: Sampai 190', 1, NULL, 334, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0335', 'HbA 1C', 'Kimia Klinik', '%', 'ANGKA', NULL, '< 6.5 : Baik<BR>6.5 - 8.0 : Sedang<BR>> 8 : Buruk', 1, '59261-8', 332, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0336', 'Troponin I', 'Kimia Klinik', 'ng/ml', 'TEKS', NULL, '0.00 - 0.02<BR>> 0.02 Abnormal', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0337', 'tes', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0338', 'SGOT', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: Sampai 35 | P: Sampai 31', 1, '88112-8', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0339', 'SGPT', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: Sampai 45 | P: Sampai 34', 1, '1744-2', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0340', 'Kalsium', 'Kimia Klinik', 'mg/dL', 'ANGKA', NULL, '8.1 - 10.4', 1, '17861-6', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0341', 'Elektrolit', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K034101', 'Kalium', 'Kimia Klinik', 'mmol/L', 'ANGKA', NULL, '3.5 - 5.5', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K034102', 'Natrium', 'Kimia Klinik', 'mmol/L', 'ANGKA', NULL, '135 - 145', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K034103', 'Klorida', 'Kimia Klinik', 'mmol/L', 'ANGKA', NULL, '96 - 106', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0342', 'Elektrolit', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K034201', 'Kalium', 'Kimia Klinik', 'mmol/L', 'ANGKA', NULL, '3.5 - 5.5', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0343', 'Bilirubin Indirect', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, 'sampai 0.75', 1, '1971-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0344', 'Alkali Fosfatase', 'Kimia Klinik', 'U/L', 'ANGKA', NULL, 'L: 80 - 306 | P: 80 - 306', 1, '6768-6', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0346', 'Microalbumin', 'Kimia Klinik', 'mg/L', 'TEKS', NULL, '< 20', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0347', 'Rasio LDL/HDL', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, 'Resiko rendah : < 3<BR>Moderat : 3 - 5<BR>Resiko Tinggi : > 5', 1, '9830-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0348', 'Magnesium', 'Kimia Klinik', 'mg/dL', 'ANGKA', NULL, '1.6 - 2.6', 1, '19123-9', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0350', 'rasio Cholesterol/HDL', 'Kimia Klinik', 'mg/dl', 'ANGKA', NULL, 'L: > 40 | P: > 50', 1, '9830-1', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0351', 'Cairan Pleura / Ascites', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K035101', 'Fisis', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K03510101', 'Warna', 'Kimia Klinik', NULL, 'TEKS', NULL, 'TRANSUDAT : (Kekuningan)', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K03510105', 'Jernih', 'Kimia Klinik', NULL, 'TEKS', NULL, 'TRANSUDAT : (Jernih)', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K03510107', 'Bekuan', 'Kimia Klinik', NULL, 'TEKS', NULL, 'TRANSUDAT : (Negatif)', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K03510109', 'Berat Jenis', 'Kimia Klinik', NULL, 'TEKS', NULL, 'TRANSUDAT : < 1.015', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K03510111', 'Jumlah Sel', 'Kimia Klinik', NULL, 'TEKS', NULL, 'TRANSUDAT : < 300 / uL', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K035102', 'Hitung Jenis', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K03510201', 'Limfosit', 'Kimia Klinik', '%', 'ANGKA', NULL, NULL, 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K03510202', 'Segmen', 'Kimia Klinik', '%', 'ANGKA', NULL, NULL, 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K035103', 'Tes Rivalta', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K035104', 'Glukosa', 'Kimia Klinik', NULL, 'TEKS', NULL, 'TRANSUDAT = Kadar di serum', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K035106', 'Protein', 'Kimia Klinik', NULL, 'TEKS', NULL, 'TRANSUDAT < 3gr / dL', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0352', 'Vitamin D', 'Kimia Klinik', 'ng/ml', 'TEKS', NULL, 'Defisiensi : < 20<BR>Insufisiensi : 20 - 29<BR>Sufficient : 30 - 100<BR>Potential Toxicity :<BR>> 100', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0353', 'Vitamin D', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0356', 'eGFR', 'Kimia Klinik', NULL, 'ANGKA', NULL, '>= 60', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0357', 'Procalcitonin', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0358', 'C-Peptide', 'Kimia Klinik', 'ng/ml', 'ANGKA', NULL, '1.1 - 4.4', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0359', 'Fosfor Anorganik', 'Kimia Klinik', NULL, 'ANGKA', NULL, '2.7 - 4.5', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0360', 'FSH', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('K0361', 'percobaan', 'Kimia Klinik', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0101', 'Kultur Gal', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0102', 'Kultur BTA', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0103', 'Kultur GO', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0104', 'Kultur Diphteri', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0105', 'Kultur Fungi', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0107', 'Uji Resistensi', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0108', 'Kultur Anaerob', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0109', 'Preparat Gram', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0110', 'Preparat BTA', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M011001', 'Sputum Sewaktu', 'Mikrobiologi', 'mg/dl', 'ANGKA', NULL, '< 140', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M011002', 'Sputum Pagi', 'Mikrobiologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M011003', 'Sputum Sewaktu', 'Mikrobiologi', 'mg/dl', 'ANGKA', NULL, '< 140', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0111', 'Preparat GO', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0112', 'Preparat Diphteri', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0113', 'Preparat Fungi', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0114', 'Preparat Trichomonas', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0115', 'Preparat Candida', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0116', 'Preparat Chlamydia', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0117', 'Kultur Urine', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0118', 'Kultur Faeces', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0119', 'Kultur Darah', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0120', 'Kultur Gall', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0121', 'Kultur Sputum', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0122', 'Malaria', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0123', 'Trichomonas', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0124', 'Kultur Cholera', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0125', 'Kultur Pus', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0126', 'Preparat BTA', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M012601', 'Sputum Sewaktu', 'Mikrobiologi', 'mg/dl', 'ANGKA', NULL, '< 140', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0127', 'FNAB', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0128', 'Ritz Serum', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0130', 'Kultur MO', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0131', 'BTA 1 seri', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0132', 'BTA sputum pagi', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0133', 'Preparat BTA', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M013301', 'Sputum Sewaktu', 'Mikrobiologi', 'mg/dl', 'ANGKA', NULL, '< 140', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M013302', 'Sputum Pagi', 'Mikrobiologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0134', 'Preparat BTA', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M013401', 'Pus', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0136', 'Preparat BTA', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M013601', 'Reitz Serum', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M01360101', 'Cuping Telinga', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M01360102', 'Mukosa Hidung', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M01360103', 'Lesi Tangan', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0137', 'DIPTHERI', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M013701', 'Pewarnaan Diptheri', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M013702', 'Pewarnaan Gram', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0138', 'Kultur Cairan CAPD', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0139', 'Sitologi Sputum', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0140', 'Kultur Darah 2', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0141', 'Kultur Cairan Sendi', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0142', 'Preparat MO', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0143', 'kultur ujung kanul', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0145', 'Rectal Swab', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0146', 'Kultur Cairan Pleura', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0148', 'IGRA', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0149', 'Kultur Sekret Vagina', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('M0150', 'Pengecatan slide Difteri', 'Mikrobiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0101', 'Dengue Test IgG', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif', 0, '100964-6', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0102', 'Dengue Test IgM', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif', 0, '25338-5', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0103', 'Helicobacter Pylori', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0104', 'ICT Malaria', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0105', 'ICT TB', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0106', 'IgM Salmonella (SPOT Typhi)', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0107', 'RT PCR Covid-19', 'PCR & Serologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P010701', 'Jenis Sampel', 'PCR & Serologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P010702', 'SARS-CoV-2 Gene RdRp', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif >= 40.00', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P010703', 'SARS-CoV-2 Gene ORF 1ab', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif >= 40.00', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P010704', 'Interpretasi', 'PCR & Serologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0108', 'SARS-CoV-2 RNA', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0109', 'SARS-CoV-2 RNA', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P010906', 'Keterangan', 'PCR & Serologi', NULL, 'TEKS', NULL, '<b>Catatan :</b> <br>Hasil <b>Negatif</b> menunjukkan bahwa tidak terdeteksi adanya RNA Virus SARS-CoV-2.<br>Mohon evaluasi klinis, Riwayat pasien dan informasi pemeriksaan penunjang medis lainnya untuk dapatmenginterpretasikan status pasien.<br><b>Saran</b>:<br>Lakukan Protokol Kesehatan dengan benar dan tepat.', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P010907', 'Keterangan', 'PCR & Serologi', NULL, 'TEKS', NULL, '<b>Catatan</b> : <br> Hasil <b>Positif</b> menunjukkan bahwa terdeteksi adanya RNA Virus SARS-CoV-2.<br>Mohon evaluasi klinis, Riwayat pasien dan informasi pemeriksaan penunjang medis lainnya untuk dapatmenginterpretasikan status pasien.<br><b>Saran:</b><br>Silahkan melakukan konsultasi lebih lanjut ke dokter.<br>Lakukan Protokol Kesehatan dengan benar dan tepat.', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0110', 'PCR - Covid-19', 'PCR & Serologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P011001', 'Jenis Sampel', 'PCR & Serologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P011002', 'SARS-CoV-2 Gene RdRp', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif >=40.00', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P011003', 'SARS-CoV-2 Gene ORF 1ab', 'PCR & Serologi', NULL, 'TEKS', NULL, 'Negatif >=40.00', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P011004', 'Interpretasi', 'PCR & Serologi', NULL, 'TEKS', NULL, '<BR><BR><BR><BR><BR><BR><BR><BR><BR>', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P011005', 'Saran :', 'PCR & Serologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P011006', 'Saran :', 'PCR & Serologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('P0111', 'RT PCR Covid-19', 'PCR & Serologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0101', 'Ankle', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0104', 'BOF/BNO', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0105', 'Basis Crani', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0110', 'Cervical AP / Lat', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0113', 'Clavicula', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0114', 'Cruris', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0119', 'Genu', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0120', 'Humerus Dex AP/LAT', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0122', 'Lumbosacral AP/LAT', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0123', 'Mandibula AP', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0124', 'Manus', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0127', 'Pelvis A.P', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0134', 'Shoulder Dex', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0137', 'Spot Nasal Lat', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0144', 'Thorax AP', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0167', 'Sinus paranasalis', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0170', 'Thoraco Lumbalis AP/LAT', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0181', 'ARTC.Cubiti', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0186', 'Abdomen 3 Posisi', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0187', 'Coccyx', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0188', 'Elbow Joint D/S', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0189', 'Femur D/S', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0190', 'Gigi', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0191', 'Thorax PA', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0192', 'Thorax AP Lat', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0193', 'Tes', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0195', '2 Gigi', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0196', '3 Gigi', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0197', '4 Gigi', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0198', 'Pedis', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0199', 'Abdomen', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0201', 'Wrist Joint', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0202', 'Antebrachi', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0203', 'Cranium', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0204', 'Nasal', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0205', 'Elbow', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0206', 'Vert. Lumbal', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0207', 'Humerus Sin AP/Lat', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0208', 'BNO', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0209', 'HNP', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0210', 'Scapula', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0211', 'Genu 2', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0212', 'sculer kanan', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0213', 'sculer kiri', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0214', 'Cranium AP', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0215', 'Genu D', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0216', 'Genu S', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0217', 'Wrist Joint S', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0218', 'Manus S', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0219', 'Pelvis AP', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0221', 'Wrist 1 posisi', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0222', 'Thorax AP + Abdomen', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0223', 'Waters', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0224', 'Thorax PA+Lat', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0226', 'pedis d+s', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0227', 'Ankle Dextra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0228', 'Ankle Sinistra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0229', 'Pedis Dextra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0230', 'Pedis Sinistra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0231', 'Cruris Dextra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0232', 'Cruris Sinistra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0233', 'Genu Dextra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0234', 'Genu Sinistra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0235', 'Manus Dextra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0236', 'Manus Sinistra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0237', 'Wrist Dextra', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0238', 'Vert. Lumbal AP', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0239', 'Hip Joint D/S', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0240', 'Shoulder Sin', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('R0241', 'Sacrum', 'Radiologi', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('S0102', 'Sperma Analisa', 'Sperma', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0101', 'Urine Lengkap', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010101', 'Warna', 'Urinalisis', NULL, 'TEKS', NULL, 'Kuning', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010102', 'Kejernihan', 'Urinalisis', NULL, 'TEKS', NULL, 'Jernih', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010103', 'PH', 'Urinalisis', NULL, 'ANGKA', NULL, '5.0 - 6.5', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010104', 'Berat Jenis', 'Urinalisis', NULL, 'ANGKA', NULL, '1.025 - 1.035', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010105', 'Nitrit', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010106', 'Protein', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010107', 'Glukosa', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010108', 'Keton', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010109', 'Urobilinogen', 'Urinalisis', NULL, 'TEKS', NULL, 'Normal', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010110', 'Bilirubin', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010111', 'Darah', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010112', 'Leukosit', 'Urinalisis', '10^3/pl', 'ANGKA', NULL, 'Negatif', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U010113', 'Sedimen', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U01011301', 'Eritrosit', 'Urinalisis', NULL, 'ANGKA', NULL, 'Negatif', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U01011302', 'Leukosit', 'Urinalisis', '/lpb', 'ANGKA', NULL, '<= 5', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U01011303', 'Sel Epitel', 'Urinalisis', '/lpk', 'ANGKA', NULL, '<= 10', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U01011304', 'Silinder', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0101130401', 'Leukosit', 'Urinalisis', '10^3/pl', 'ANGKA', NULL, 'Negatif', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0101130402', 'Eritrosit', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0101130403', 'Hyaline', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0101130404', 'Granular', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U01011305', 'Kristal', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U01011306', 'Bakteri', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U01011307', 'Lain-lain', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0102', 'Glukosa Urine', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0103', 'Protein Urine', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0104', 'Protein Esbach', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0105', 'Bence Jones Protein', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0106', 'Mikroalbumin Urine', 'Urinalisis', 'mg/L', 'ANGKA', NULL, '0 - 30', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0107', 'Urobilinogen', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0108', 'Bilirubin', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, '34543-9', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0110', 'Nitrit Urine', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0111', 'PH Urine', 'Urinalisis', NULL, 'ANGKA', NULL, '4.8 - 7.4', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0112', 'BJ Urine', 'Urinalisis', NULL, 'ANGKA', NULL, '1.015 - 1.025', 1, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0113', 'Sedimen', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0114', 'Protein Urine(Kuantitatif)', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0115', 'Magnesium', 'Urinalisis', 'mg/dL', 'ANGKA', NULL, '1.6 - 2.6', 1, '19123-9', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0116', 'Elektroforesis Urine', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0117', 'Beta HCG Latex Urine', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0118', 'Beta HCG Test Pack Urine', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0119', 'Beta HCG Kuant. Urine', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0120', 'Amphetamine', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0122', 'Benzodiazepine', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0123', 'Oplat/Morphine', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0124', 'Canabinoid', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0125', 'Coccain', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0126', 'Metamphetamine', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0127', 'Ganja/Marijuana', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0128', 'Darah Samar', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0129', 'Feses Rutin', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0130', 'Darah Samar/Bensidin', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0131', 'Pencernaan', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0132', 'Stercobilin', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0133', 'pH Feses', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0134', 'vit B12', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0135', 'Urine Rutin', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0136', 'Tes HCG Urine', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0137', 'Cannabinoid', 'Urinalisis', NULL, 'TEKS', NULL, 'Negative', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0139', 'Opiat/Morphine', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0140', 'Glukosa Urine 2 Jam PP', 'Urinalisis', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0144', 'Narkoba', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U014401', 'Amphetamin', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U014402', 'Benzodiazepine', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U014403', 'Morphine', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U014404', 'Coccaine', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U014405', 'Metamphetamin', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U014406', 'Marijuana', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0145', 'Alkohol Urine', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0147', 'USG Protat', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('U0149', 'USG Prostat', 'Urinalisis', NULL, 'TEKS', NULL, NULL, 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('W0101', 'Widal Test', 'Widal Serologi', '0', 'TEKS', NULL, '0', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('W010101', '- S.Typhi O', 'Widal Serologi', '0', 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('W010102', '- S.Typhi H', 'Widal Serologi', '0', 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('W010103', 'S. Paratyphi A-O', 'Widal Serologi', '0', 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('W010104', 'S. Paratyphi A-H', 'Widal Serologi', '0', 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('W010105', 'S. Paratyphi B-O', 'Widal Serologi', '0', 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('W010106', 'S. Paratyphi B-H', 'Widal Serologi', '0', 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('W010107', 'S. Paratyphi C-O', 'Widal Serologi', NULL, 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;
INSERT INTO public.ref_lab (kode, nama, kelompok, satuan, jenis_nilai, pilihan, teks_normal, desimal, kode_loinc, urutan, aktif)
VALUES ('W010108', 'S. Paratyphi C-H', 'Widal Serologi', '0', 'TEKS', NULL, 'Negatif', 0, NULL, 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  satuan = EXCLUDED.satuan,
  jenis_nilai = EXCLUDED.jenis_nilai,
  pilihan = EXCLUDED.pilihan,
  teks_normal = EXCLUDED.teks_normal,
  desimal = EXCLUDED.desimal,
  kode_loinc = EXCLUDED.kode_loinc,
  urutan = EXCLUDED.urutan,
  aktif = true;

-- 2. REFRESH ref_lab_rujukan
DELETE FROM public.ref_lab_rujukan WHERE lab_id IN (SELECT id FROM public.ref_lab WHERE kode IN ('A0101', 'A0102', 'A010201', 'A01020101', 'A01020102', 'A01020103', 'A01020104', 'A01020105', 'A01020106', 'A010202', 'A01020201', 'A01020202', 'A01020203', 'A0102020301', 'A0102020302', 'A0102020303', 'A01020204', 'A01020205', 'A010203', 'A01020301', 'A01020302', 'A010204', 'A0103', 'A010301', 'A010302', 'A010303', 'A010304', 'A0104', 'A010401', 'A010402', 'A010403', 'A010404', 'A0105', 'A0106', 'A0107', 'A0108', 'A0109', 'A0111', 'A0113', 'A0114', 'A0115', 'A0116', 'A0117', 'A0118', 'A0119', 'A0120', 'A0122', 'A0123', 'A0124', 'A0126', 'A0127', 'A0128', 'A0129', 'A0130', 'A0131', 'A0133', 'A0134', 'A0135', 'A0136', 'A0137', 'A0138', 'A0140', 'A0142', 'A0143', 'A0145', 'A0147', 'A0149', 'A0151', 'A0154', 'A0156', 'A0158', 'A0159', 'A0160', 'A0161', 'A0162', 'A0163', 'B0101', 'B0102', 'B0103', 'B0104', 'B0105', 'B0106', 'B0107', 'B0108', 'B0109', 'C0101', 'C0102', 'C010201', 'C010202', 'C01020201', 'C01020202', 'C01020203', 'C01020204', 'C01020205', 'C010203', 'C01020301', 'C01020302', 'C01020303', 'C01020304', 'C010204', 'C01020401', 'C01020402', 'C01020403', 'C01020404', 'E0101', 'E0102', 'E0103', 'E0104', 'E0105', 'E0106', 'E0107', 'F0101', 'F010101', 'F01010101', 'F01010102', 'F01010103', 'F01010104', 'F010102', 'F01010201', 'F01010202', 'F01010203', 'F01010204', 'F0102', 'G0101', 'G010101', 'G0102', 'G0103', 'H0101', 'H010101', 'H010102', 'H010103', 'H010104', 'H010105', 'H010106', 'H01010601', 'H01010602', 'H010107', 'H01010701', 'H01010702', 'H01010703', 'H01010704', 'H01010705', 'H01010706', 'H010108', 'H01010801', 'H01010802', 'H01010803', 'H010109', 'H0102', 'H010201', 'H010202', 'H010203', 'H010204', 'H0106', 'H0107', 'H010701', 'H010702', 'H0108', 'H0109', 'H0110', 'H0111', 'H0112', 'H0113', 'H0114', 'H0115', 'H0116', 'H0117', 'H0118', 'H0119', 'H0120', 'H0121', 'H0122', 'H0123', 'H0124', 'H0125', 'H0126', 'H0127', 'H0128', 'H0129', 'H0130', 'H0131', 'H0132', 'H013201', 'H013202', 'H0133', 'H0134', 'H0135', 'H0136', 'H0137', 'H0138', 'H0139', 'H0140', 'H0141', 'H0142', 'H0143', 'H0144', 'H0145', 'H014501', 'H014502', 'H014503', 'H014504', 'H014505', 'H014506', 'H0146', 'H014601', 'H014602', 'H014603', 'H014604', 'H014605', 'H0147', 'H0148', 'H0149', 'H0150', 'H0151', 'H015202', 'H0153', 'H0154', 'H0155', 'H0156', 'H0157', 'H0158', 'H015801', 'H015802', 'H0159', 'H0160', 'H016001', 'H016002', 'H016003', 'H016004', 'H016005', 'H016006', 'H01600601', 'H01600602', 'H0161', 'H016101', 'H016102', 'H0162', 'H0163', 'H0165', 'H0166', 'H0167', 'H0169', 'H016901', 'H016902', 'H016903', 'H016904', 'H016905', 'H016906', 'H0170', 'H0171', 'H0172', 'H0173', 'H0174', 'H0175', 'H017501', 'H017502', 'H017503', 'H017504', 'H017505', 'H017506', 'H01750601', 'H01750602', 'H01750603', 'H01750604', 'H01750605', 'H01750606', 'H0177', 'H0178', 'H0179', 'H0180', 'H0181', 'H02', 'I0201', 'I0202', 'I0203', 'I0204', 'I0205', 'I020501', 'I020502', 'I0206', 'I0207', 'I0208', 'I0209', 'I0211', 'I0212', 'I0213', 'I0214', 'I0216', 'I021601', 'I021602', 'I0219', 'I0221', 'I0223', 'I0224', 'I0225', 'I022501', 'I022502', 'I0227', 'I0228', 'I022801', 'I022802', 'I022803', 'I022804', 'I022805', 'I022806', 'I022807', 'I022808', 'I0229', 'I0230', 'I0231', 'I0232', 'I0233', 'I0234', 'I0235', 'I0236', 'I0237', 'I0238', 'I0239', 'I0240', 'I0241', 'I0242', 'I0243', 'I0244', 'I024401', 'I024402', 'I0245', 'I024501', 'I024502', 'I0246', 'I0247', 'I0248', 'I0249', 'I0250', 'I0251', 'I0252', 'I0253', 'I0254', 'I0255', 'I0256', 'I0257', 'I0258', 'I025801', 'I025802', 'I0259', 'I0261', 'I0262', 'I0263', 'I0264', 'I0265', 'I026501', 'I026502', 'I0266', 'I0267', 'I0268', 'I026801', 'I026802', 'I0269', 'I0270', 'I0271', 'I0272', 'I0273', 'I0274', 'I0275', 'I0276', 'I0277', 'I027701', 'I027702', 'I027707', 'I027708', 'I0278', 'I0279', 'I027906', 'I027907', 'I0280', 'I0282', 'I0284', 'I0285', 'I0286', 'I028601', 'I028602', 'I028603', 'I0287', 'I0288', 'I0289', 'I0290', 'I0292', 'I0293', 'I0294', 'I0295', 'I0297', 'K0301', 'K0302', 'K0303', 'K0304', 'K0305', 'K0306', 'K0307', 'K0308', 'K0309', 'K0311', 'K0312', 'K0314', 'K0315', 'K0316', 'K0317', 'K0318', 'K0319', 'K0321', 'K0322', 'K0325', 'K0326', 'K0327', 'K0328', 'K0329', 'K0331', 'K0332', 'K0333', 'K0334', 'K0335', 'K0336', 'K0337', 'K0338', 'K0339', 'K0340', 'K0341', 'K034101', 'K034102', 'K034103', 'K0342', 'K034201', 'K0343', 'K0344', 'K0346', 'K0347', 'K0348', 'K0350', 'K0351', 'K035101', 'K03510101', 'K03510105', 'K03510107', 'K03510109', 'K03510111', 'K035102', 'K03510201', 'K03510202', 'K035103', 'K035104', 'K035106', 'K0352', 'K0353', 'K0356', 'K0357', 'K0358', 'K0359', 'K0360', 'K0361', 'M0101', 'M0102', 'M0103', 'M0104', 'M0105', 'M0107', 'M0108', 'M0109', 'M0110', 'M011001', 'M011002', 'M011003', 'M0111', 'M0112', 'M0113', 'M0114', 'M0115', 'M0116', 'M0117', 'M0118', 'M0119', 'M0120', 'M0121', 'M0122', 'M0123', 'M0124', 'M0125', 'M0126', 'M012601', 'M0127', 'M0128', 'M0130', 'M0131', 'M0132', 'M0133', 'M013301', 'M013302', 'M0134', 'M013401', 'M0136', 'M013601', 'M01360101', 'M01360102', 'M01360103', 'M0137', 'M013701', 'M013702', 'M0138', 'M0139', 'M0140', 'M0141', 'M0142', 'M0143', 'M0145', 'M0146', 'M0148', 'M0149', 'M0150', 'P0101', 'P0102', 'P0103', 'P0104', 'P0105', 'P0106', 'P0107', 'P010701', 'P010702', 'P010703', 'P010704', 'P0108', 'P0109', 'P010906', 'P010907', 'P0110', 'P011001', 'P011002', 'P011003', 'P011004', 'P011005', 'P011006', 'P0111', 'R0101', 'R0104', 'R0105', 'R0110', 'R0113', 'R0114', 'R0119', 'R0120', 'R0122', 'R0123', 'R0124', 'R0127', 'R0134', 'R0137', 'R0144', 'R0167', 'R0170', 'R0181', 'R0186', 'R0187', 'R0188', 'R0189', 'R0190', 'R0191', 'R0192', 'R0193', 'R0195', 'R0196', 'R0197', 'R0198', 'R0199', 'R0201', 'R0202', 'R0203', 'R0204', 'R0205', 'R0206', 'R0207', 'R0208', 'R0209', 'R0210', 'R0211', 'R0212', 'R0213', 'R0214', 'R0215', 'R0216', 'R0217', 'R0218', 'R0219', 'R0221', 'R0222', 'R0223', 'R0224', 'R0226', 'R0227', 'R0228', 'R0229', 'R0230', 'R0231', 'R0232', 'R0233', 'R0234', 'R0235', 'R0236', 'R0237', 'R0238', 'R0239', 'R0240', 'R0241', 'S0102', 'U0101', 'U010101', 'U010102', 'U010103', 'U010104', 'U010105', 'U010106', 'U010107', 'U010108', 'U010109', 'U010110', 'U010111', 'U010112', 'U010113', 'U01011301', 'U01011302', 'U01011303', 'U01011304', 'U0101130401', 'U0101130402', 'U0101130403', 'U0101130404', 'U01011305', 'U01011306', 'U01011307', 'U0102', 'U0103', 'U0104', 'U0105', 'U0106', 'U0107', 'U0108', 'U0110', 'U0111', 'U0112', 'U0113', 'U0114', 'U0115', 'U0116', 'U0117', 'U0118', 'U0119', 'U0120', 'U0122', 'U0123', 'U0124', 'U0125', 'U0126', 'U0127', 'U0128', 'U0129', 'U0130', 'U0131', 'U0132', 'U0133', 'U0134', 'U0135', 'U0136', 'U0137', 'U0139', 'U0140', 'U0144', 'U014401', 'U014402', 'U014403', 'U014404', 'U014405', 'U014406', 'U0145', 'U0147', 'U0149', 'W0101', 'W010101', 'W010102', 'W010103', 'W010104', 'W010105', 'W010106', 'W010107', 'W010108'));

INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'A01020201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'A01020201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'A01020203';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'A01020203';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'A010304';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'A010304';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'A010404';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'A010404';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif :<BR>Indurasi < 6 mm<BR>Positif :<BR>Indurasi >= 6 mm'
FROM public.ref_lab WHERE kode = 'A0129';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Normal'
FROM public.ref_lab WHERE kode = 'A0138';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negative'
FROM public.ref_lab WHERE kode = 'B0103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat: Kuning Muda<BR>Eksudat: Kuning - Hijau'
FROM public.ref_lab WHERE kode = 'C01020201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat; Jernih<BR>Eksudat: Keruh'
FROM public.ref_lab WHERE kode = 'C01020202';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat : < 1.018<BR>Exudat : > 1.018'
FROM public.ref_lab WHERE kode = 'C01020203';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat: (-) Bekuan<BR>Eksudat:(-) Bekuan'
FROM public.ref_lab WHERE kode = 'C01020204';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat: >7,31<BR>Eksudat: < 7,31'
FROM public.ref_lab WHERE kode = 'C01020205';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat: (-)<BR>Eksudat: (+) Kekeruhan'
FROM public.ref_lab WHERE kode = 'C01020301';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat : < 3 gr%<BR>Eksudat : > 3gr%'
FROM public.ref_lab WHERE kode = 'C01020302';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat : = plasma darah <BR> Eksudat : < plasma darah'
FROM public.ref_lab WHERE kode = 'C01020303';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat : < 300<BR>Eksudat : > 1000'
FROM public.ref_lab WHERE kode = 'C01020401';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Transudat : = Sedikit<BR>Exudat : < Banyak'
FROM public.ref_lab WHERE kode = 'C01020404';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'F01010201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'F01010201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'F0102';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Defisiensi : < 20Insufisiensi : 20 - 29Sufficient : 30 - 100Potential Toxicity :> 100'
FROM public.ref_lab WHERE kode = 'G0103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 14.0, 18.0, '14.0 - 18.0'
FROM public.ref_lab WHERE kode = 'H010101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 12.0, 16.0, '12.0 - 16.0'
FROM public.ref_lab WHERE kode = 'H010101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H010102';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H010102';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H010103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H010103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 40.0, 54.0, '40.0 - 54.0'
FROM public.ref_lab WHERE kode = 'H010104';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 37.0, 47.0, '37.0 - 47.0'
FROM public.ref_lab WHERE kode = 'H010104';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 4.6, 6.2, '4.60 - 6.20'
FROM public.ref_lab WHERE kode = 'H010105';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 4.2, 5.4, '4.20 - 5.40'
FROM public.ref_lab WHERE kode = 'H010105';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 10.0, '0 - 10'
FROM public.ref_lab WHERE kode = 'H01010601';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 10.0, '0 - 10'
FROM public.ref_lab WHERE kode = 'H01010601';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 10.0, 20.0, 'Oct-20'
FROM public.ref_lab WHERE kode = 'H01010602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 10.0, 20.0, 'Oct-20'
FROM public.ref_lab WHERE kode = 'H01010602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 3.0, 5.0, '03-May'
FROM public.ref_lab WHERE kode = 'H01010701';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 3.0, 5.0, '03-May'
FROM public.ref_lab WHERE kode = 'H01010701';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 35.0, 70.0, '35 - 70'
FROM public.ref_lab WHERE kode = 'H01010702';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 35.0, 70.0, '35 - 70'
FROM public.ref_lab WHERE kode = 'H01010702';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 20.0, 40.0, '20 - 40'
FROM public.ref_lab WHERE kode = 'H01010703';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 20.0, 40.0, '20 - 40'
FROM public.ref_lab WHERE kode = 'H01010703';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 2.0, 10.0, '02-Oct'
FROM public.ref_lab WHERE kode = 'H01010704';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 2.0, 10.0, '02-Oct'
FROM public.ref_lab WHERE kode = 'H01010704';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.0, 4.0, '01-Apr'
FROM public.ref_lab WHERE kode = 'H01010705';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.0, 4.0, '01-Apr'
FROM public.ref_lab WHERE kode = 'H01010705';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 1.0, '0 - 1'
FROM public.ref_lab WHERE kode = 'H01010706';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 1.0, '0 - 1'
FROM public.ref_lab WHERE kode = 'H01010706';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 80.0, 96.0, '80 - 96'
FROM public.ref_lab WHERE kode = 'H01010801';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 27.0, 31.0, '27 - 31'
FROM public.ref_lab WHERE kode = 'H01010802';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 32.0, 36.0, '32 - 36'
FROM public.ref_lab WHERE kode = 'H01010803';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 11.5, 14.5, '11.5 - 14.5'
FROM public.ref_lab WHERE kode = 'H010109';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 14.0, 18.0, '14.0 - 18.0'
FROM public.ref_lab WHERE kode = 'H010201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 12.0, 16.0, '12.0 - 16.0'
FROM public.ref_lab WHERE kode = 'H010201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H010202';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H010202';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H010203';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H010203';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 40.0, 54.0, '40.0 - 54.0'
FROM public.ref_lab WHERE kode = 'H010204';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 37.0, 47.0, '37.0 - 47.0'
FROM public.ref_lab WHERE kode = 'H010204';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.0, 3.0, '01-Mar'
FROM public.ref_lab WHERE kode = 'H0109';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.0, 3.0, '01-Mar'
FROM public.ref_lab WHERE kode = 'H0109';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 2.0, 5.0, '02-May'
FROM public.ref_lab WHERE kode = 'H0110';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 2.0, 5.0, '02-May'
FROM public.ref_lab WHERE kode = 'H0110';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 11.7, 15.1, '11.7 - 15.1'
FROM public.ref_lab WHERE kode = 'H0111';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 22.5, 40.1, '22.5 - 40.1'
FROM public.ref_lab WHERE kode = 'H0112';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 200.0, 400.0, '200.0 - 400.0'
FROM public.ref_lab WHERE kode = 'H0113';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 200.0, 400.0, '200.0 - 400.0'
FROM public.ref_lab WHERE kode = 'H0113';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 500.0, '< 500'
FROM public.ref_lab WHERE kode = 'H0114';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 40.0, 60.0, '40.0 - 60.0'
FROM public.ref_lab WHERE kode = 'H0116';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 40.0, 60.0, '40.0 - 60.0'
FROM public.ref_lab WHERE kode = 'H0116';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 3.5, 5.1, '3.5 - 5.1'
FROM public.ref_lab WHERE kode = 'H0117';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 3.5, 5.1, '3.5 - 5.1'
FROM public.ref_lab WHERE kode = 'H0117';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.4, 1.8, '1.4 - 1.8'
FROM public.ref_lab WHERE kode = 'H0118';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.4, 1.8, '1.4 - 1.8'
FROM public.ref_lab WHERE kode = 'H0118';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.5, 1.5, '0.5 - 1.5'
FROM public.ref_lab WHERE kode = 'H0119';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.5, 1.5, '0.5 - 1.5'
FROM public.ref_lab WHERE kode = 'H0119';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 37.0, 145.0, '37 - 145'
FROM public.ref_lab WHERE kode = 'H0120';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 22.0, 322.0, '22 - 322'
FROM public.ref_lab WHERE kode = 'H0121';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 10.0, 291.0, '10 - 291'
FROM public.ref_lab WHERE kode = 'H0121';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 200.0, 360.0, '200.0 - 360.0'
FROM public.ref_lab WHERE kode = 'H0122';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 200.0, 360.0, '200.0 - 360.0'
FROM public.ref_lab WHERE kode = 'H0122';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 3.1, 17.5, '3.1 - 17.5'
FROM public.ref_lab WHERE kode = 'H0123';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 3.1, 17.5, '3.1 - 17.5'
FROM public.ref_lab WHERE kode = 'H0123';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negative'
FROM public.ref_lab WHERE kode = 'H0124';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negative'
FROM public.ref_lab WHERE kode = 'H0125';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 146.0, 376.0, '146.0 - 376.0'
FROM public.ref_lab WHERE kode = 'H0126';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 146.0, 376.0, '146.0 - 376.0'
FROM public.ref_lab WHERE kode = 'H0126';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'HbA = 96 - 99 HbA2 = <=3,5 HbF = < 2'
FROM public.ref_lab WHERE kode = 'H0127';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H0128';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H0128';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.025, 1.033, '1.025 - 1.033'
FROM public.ref_lab WHERE kode = 'H0129';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.025, 1.033, '1.025 - 1.033'
FROM public.ref_lab WHERE kode = 'H0129';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negative'
FROM public.ref_lab WHERE kode = 'H0132';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, NULL, 2.0, NULL
FROM public.ref_lab WHERE kode = 'H0133';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, NULL, 2.0, NULL
FROM public.ref_lab WHERE kode = 'H0133';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '< 2'
FROM public.ref_lab WHERE kode = 'H0133';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negative'
FROM public.ref_lab WHERE kode = 'H0134';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Start Hemolyse : 0.40-0.44 Complete Hemolyse : 0.30-0.34'
FROM public.ref_lab WHERE kode = 'H0135';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negative'
FROM public.ref_lab WHERE kode = 'H0136';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 14.0, 18.0, '14.0 - 18.0'
FROM public.ref_lab WHERE kode = 'H0137';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 12.0, 16.0, '12.0 - 16.0'
FROM public.ref_lab WHERE kode = 'H0137';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H0138';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H0138';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 4.6, 6.2, '4.60 - 6.20'
FROM public.ref_lab WHERE kode = 'H0139';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 4.2, 5.4, '4.50 - 5.40'
FROM public.ref_lab WHERE kode = 'H0139';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H0140';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H0140';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 40.0, 54.0, '40.0 - 54.0'
FROM public.ref_lab WHERE kode = 'H0141';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 37.0, 47.0, '37.0 - 47.0'
FROM public.ref_lab WHERE kode = 'H0141';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 80.0, 96.0, '80.0 - 96.0'
FROM public.ref_lab WHERE kode = 'H0142';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 80.0, 96.0, '80.0 - 96.0'
FROM public.ref_lab WHERE kode = 'H0142';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 27.5, 33.2, '27.5 - 33.2'
FROM public.ref_lab WHERE kode = 'H0143';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 27.5, 33.2, '27.5 - 33.2'
FROM public.ref_lab WHERE kode = 'H0143';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 33.4, 35.5, '33.4 - 35.5'
FROM public.ref_lab WHERE kode = 'H0144';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 33.4, 35.5, '33.4 - 35.5'
FROM public.ref_lab WHERE kode = 'H0144';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 3.0, 5.0, '03-May'
FROM public.ref_lab WHERE kode = 'H014501';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 3.0, 5.0, '03-May'
FROM public.ref_lab WHERE kode = 'H014501';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 35.0, 70.0, '35 - 70'
FROM public.ref_lab WHERE kode = 'H014502';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 35.0, 70.0, '35 - 70'
FROM public.ref_lab WHERE kode = 'H014502';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 20.0, 40.0, '20 - 40'
FROM public.ref_lab WHERE kode = 'H014503';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 20.0, 40.0, '20 - 40'
FROM public.ref_lab WHERE kode = 'H014503';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 2.0, 10.0, '02-Oct'
FROM public.ref_lab WHERE kode = 'H014504';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 2.0, 10.0, '02-Oct'
FROM public.ref_lab WHERE kode = 'H014504';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.0, 4.0, '01-Apr'
FROM public.ref_lab WHERE kode = 'H014505';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.0, 4.0, '01-Apr'
FROM public.ref_lab WHERE kode = 'H014505';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 1.0, '0 - 1'
FROM public.ref_lab WHERE kode = 'H014506';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 1.0, '0 - 1'
FROM public.ref_lab WHERE kode = 'H014506';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H014602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H014602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H014603';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H014603';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 228.0, 428.0, '228 - 428'
FROM public.ref_lab WHERE kode = 'H0147';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 228.0, 428.0, '228 - 428'
FROM public.ref_lab WHERE kode = 'H0147';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '50 - 350'
FROM public.ref_lab WHERE kode = 'H0151';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, NULL, NULL, '< 10'
FROM public.ref_lab WHERE kode = 'H0158';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, NULL, NULL, '< 20'
FROM public.ref_lab WHERE kode = 'H0158';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 10.0, '0 - 10'
FROM public.ref_lab WHERE kode = 'H015801';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 10.0, '0 - 10'
FROM public.ref_lab WHERE kode = 'H015801';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 10.0, 20.0, 'Oct-20'
FROM public.ref_lab WHERE kode = 'H015802';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 10.0, 20.0, 'Oct-20'
FROM public.ref_lab WHERE kode = 'H015802';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 14.0, 18.0, '14.0 - 18.0'
FROM public.ref_lab WHERE kode = 'H016001';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 12.0, 16.0, '12.0 - 16.0'
FROM public.ref_lab WHERE kode = 'H016001';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H016002';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H016002';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H016003';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H016003';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 40.0, 54.0, '40.0 - 54.0'
FROM public.ref_lab WHERE kode = 'H016004';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 37.0, 47.0, '37.0 - 47.0'
FROM public.ref_lab WHERE kode = 'H016004';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 4.6, 6.2, '4.60 - 6.20'
FROM public.ref_lab WHERE kode = 'H016005';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 4.2, 5.4, '4.20 - 5.40'
FROM public.ref_lab WHERE kode = 'H016005';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 10.0, '0 - 10'
FROM public.ref_lab WHERE kode = 'H01600601';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 10.0, '0 - 10'
FROM public.ref_lab WHERE kode = 'H01600601';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 10.0, 20.0, 'Oct-20'
FROM public.ref_lab WHERE kode = 'H01600602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 10.0, 20.0, 'Oct-20'
FROM public.ref_lab WHERE kode = 'H01600602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'H0163';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 500.0, '< 500'
FROM public.ref_lab WHERE kode = 'H0165';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.83, 1.11, '0.83 - 1.11'
FROM public.ref_lab WHERE kode = 'H0171';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '1.00 - 1.99'
FROM public.ref_lab WHERE kode = 'H0172';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '01-Mar'
FROM public.ref_lab WHERE kode = 'H0174';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 14.0, 18.0, '14.0-18.0'
FROM public.ref_lab WHERE kode = 'H017501';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 12.0, 16.0, '12.0 - 16.0'
FROM public.ref_lab WHERE kode = 'H017501';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H017502';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'H017502';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H017503';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 150.0, 450.0, '150 - 450'
FROM public.ref_lab WHERE kode = 'H017503';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 40.0, 54.0, '40.0 - 54.0'
FROM public.ref_lab WHERE kode = 'H017504';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 37.0, 47.0, '37.0 - 47.0'
FROM public.ref_lab WHERE kode = 'H017504';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 4.6, 6.2, '4.60 - 6.20'
FROM public.ref_lab WHERE kode = 'H017505';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 4.2, 5.4, '4.20 - 5.40'
FROM public.ref_lab WHERE kode = 'H017505';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 3.0, 5.0, '03-May'
FROM public.ref_lab WHERE kode = 'H01750601';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 3.0, 5.0, '03-May'
FROM public.ref_lab WHERE kode = 'H01750601';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 35.0, 70.0, '35 - 70'
FROM public.ref_lab WHERE kode = 'H01750602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 35.0, 70.0, '35 - 70'
FROM public.ref_lab WHERE kode = 'H01750602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 20.0, 40.0, '20 - 40'
FROM public.ref_lab WHERE kode = 'H01750603';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 20.0, 40.0, '20 - 40'
FROM public.ref_lab WHERE kode = 'H01750603';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 2.0, 10.0, '02-Oct'
FROM public.ref_lab WHERE kode = 'H01750604';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 2.0, 10.0, '02-Oct'
FROM public.ref_lab WHERE kode = 'H01750604';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.0, 4.0, '01-Apr'
FROM public.ref_lab WHERE kode = 'H01750605';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.0, 4.0, '01-Apr'
FROM public.ref_lab WHERE kode = 'H01750605';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 1.0, '0 - 1'
FROM public.ref_lab WHERE kode = 'H01750606';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 1.0, '0 - 1'
FROM public.ref_lab WHERE kode = 'H01750606';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 11.5, 14.5, '11.5 - 14.5'
FROM public.ref_lab WHERE kode = 'H0177';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '31 - 44'
FROM public.ref_lab WHERE kode = 'H0178';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '30 - 38'
FROM public.ref_lab WHERE kode = 'H0179';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '0.8 - 1.2'
FROM public.ref_lab WHERE kode = 'H0180';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0202';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0203';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0204';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0205';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I020501';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I020502';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 1.23, 3.07, '1.23 - 3.07'
FROM public.ref_lab WHERE kode = 'I0206';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 66.0, 181.0, '66 - 181'
FROM public.ref_lab WHERE kode = 'I0207';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '< 7.02'
FROM public.ref_lab WHERE kode = 'I0208';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '< 4.7'
FROM public.ref_lab WHERE kode = 'I0209';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 10.6, 19.4, '10.6 - 19.4'
FROM public.ref_lab WHERE kode = 'I0213';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Eutiroid = 0.25 - 5.0<BR>Hypertyroid = < 0.15<BR>Hypotyroid = > 7.0'
FROM public.ref_lab WHERE kode = 'I0214';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I021601';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I021602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Non Reaktif'
FROM public.ref_lab WHERE kode = 'I0219';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Non Reaktif'
FROM public.ref_lab WHERE kode = 'I0221';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0223';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 200.0, '<= 200'
FROM public.ref_lab WHERE kode = 'I0224';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0225';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022501';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022502';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0227';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022801';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022802';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022803';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022804';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022805';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022806';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022807';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I022808';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Interpretasi hasil TUBEX TF:<BR>0 - 2 : Negatif, Tidak mengindikasikan terjadinya infeksi demam tifoid pada saat ini.<BR>4 - 10 : Postif, Semakin tinggi skornya, maka semakin kuat indikasi terjadinya infeksi demam tifoid pada saat ini'
FROM public.ref_lab WHERE kode = 'I0229';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 35.0, '<= 35'
FROM public.ref_lab WHERE kode = 'I0230';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '< 37.0'
FROM public.ref_lab WHERE kode = 'I0232';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '< 100'
FROM public.ref_lab WHERE kode = 'I0233';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0234';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif < 0.55<BR>Equivocal : 0.55 - < 0.65<BR>disarankan periksa kembali 2-3 minggu kemudian<BR>Positif : >= 0.65'
FROM public.ref_lab WHERE kode = 'I0235';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif < 4<BR>Equivocal : 4 - <8<BR>disarankan periksa kembali 2-3 minggu kemudian<BR>Positif : >= 8'
FROM public.ref_lab WHERE kode = 'I0236';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif < 0.80<BR>Equivocal : 0.80 - 1.20<BR>Positif : >= 1.20'
FROM public.ref_lab WHERE kode = 'I0237';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif < 10<BR>Equivocal : 10 - 15<BR>Positif : >= 15'
FROM public.ref_lab WHERE kode = 'I0238';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif < 0.70<BR>Equivocal : 0.70 - 0.90<BR>Positif : >= 0.90'
FROM public.ref_lab WHERE kode = 'I0239';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif < 4<BR>Equivocal : 4 - 6<BR>Positif : >= 6'
FROM public.ref_lab WHERE kode = 'I0240';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif < 0.90<BR>Equivocal : >0.90 - <1.0<BR>Positif : >= 1.0'
FROM public.ref_lab WHERE kode = 'I0241';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif < 0.90<BR>Equivocal : >0.90 - <1.0<BR>Positif : >= 1.0'
FROM public.ref_lab WHERE kode = 'I0242';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I024401';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I024402';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I024501';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I024502';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Non Reaktif'
FROM public.ref_lab WHERE kode = 'I0246';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0247';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 2.15, 5.83, '2.15 - 5.83'
FROM public.ref_lab WHERE kode = 'I0250';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif : < 20<BR>Equivocal : 20 - 60<BR>Positif : > 60'
FROM public.ref_lab WHERE kode = 'I0251';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif :<BR>Indurasi < 6 mm<BR>Positif :<BR>Indurasi >= 6 mm'
FROM public.ref_lab WHERE kode = 'I0252';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif < 10'
FROM public.ref_lab WHERE kode = 'I0253';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Low avidity IgG :<BR>< 0.20<BR>Borderline avidity IgG :<BR>0.20 - < 0.30<BR>High Avidity IgG :<BR>>= 0.30'
FROM public.ref_lab WHERE kode = 'I0255';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '< 0.8 Infeksi primer kurang dari 3 bulan<BR>>= 0.8 Infeksi primer lebih dari 3 bulan'
FROM public.ref_lab WHERE kode = 'I0256';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0259';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '0.77 - 1.59'
FROM public.ref_lab WHERE kode = 'I0261';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I026501';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I026502';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Eutiroid : 0.34 - 4.22<BR>Hipertiroid : < 0.34<BR>Hipotiroid : > 4.2'
FROM public.ref_lab WHERE kode = 'I0266';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Non Reaktif < 0.13<BR>Reaktif >= 0.13'
FROM public.ref_lab WHERE kode = 'I0267';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I026801';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I026802';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif : < 0.6Equivocal : >= 0.6 - < 1.0Positif : >= 1.0'
FROM public.ref_lab WHERE kode = 'I0270';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif : < 0.90<BR>Equivocal : 0.90 - 1.10<BR>Positif : > 1.10'
FROM public.ref_lab WHERE kode = 'I0271';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0272';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'NILAI NORMAL BETA HCG'
FROM public.ref_lab WHERE kode = 'I0273';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Non Reaktif'
FROM public.ref_lab WHERE kode = 'I027701';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Non Reaktif'
FROM public.ref_lab WHERE kode = 'I027702';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Catatan : <BR>Hasil Non Reaktif tidak menyingkirkan kemungkinan terinfeksi SARS-CoV-2 sehingga masih beresiko menularkan<BR>ke orang lain. Hasil Non Reaktif dapat terjadi pada kondisi :<BR>- Seseorang belum/tidak terinfeksi <BR>- Window period(terinfeksi namun antibodi belum terbentuk)<BR>- Immunocompromised<BR>- Kadar antibodi dibawah level deteksi alat <BR><BR>Saran :<BR>- Ulang pemeriksaan rapid tes antibodi 10 hari kemudian<BR>- Tetap menjaga social/physical distancing <BR>- Pertahankan perilaku hidup bersih dan sehat(Cuci tangan, terapkan etika batuk, gunakan masker saat sakit,<BR> jaga stamina).'
FROM public.ref_lab WHERE kode = 'I027707';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Saran :<BR>- Lanjutkan dengan pemeriksaan konfirmasi PCR <BR>- Tetap lakukan Social Distancing/isolasi diri.'
FROM public.ref_lab WHERE kode = 'I027708';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0279';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '<b>Saran</b>: <br><ul><li>Pemeriksaan konfirmasi dengan pemeriksaan RT-PCR</li><li>Lakukan karantina atau isolasi sesuai dengan kriteria</li><li>Menerapkan PHBS (perilaku hidup bersih dan sehat): mencuci tangan, menerapkan etika batuk, menggunakan masker saat sakit, menjaga stamina), dan <i>physical distancing</i>.</li></ul>'
FROM public.ref_lab WHERE kode = 'I027906';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '<b>Catatan :</b><br><ul><li>Hasil negatif tidak menyingkirkan kemungkinan terinfeksi SARS-CoV-2 sehingga masih berisiko menularkan ke orang lain, disarankan tes ulang atau tes konfirmasi dengan NAAT (nucleic acid amplification tests), bila probabilitas pretes relatif tinggi, terutama bila pasien bergejala atau diketahui memiliki kontak dengan orang yang terkonfirmasi COVID-19.</li><li>Hasil negatif dapat terjadi pada kondisi kuantitas antigen pada spesimen dibawah level deteksi alat.</li></ul>'
FROM public.ref_lab WHERE kode = 'I027907';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0280';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '0.00 - 10.0'
FROM public.ref_lab WHERE kode = 'I0282';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, NULL, NULL, 'Negatif : < 10.00 AU/mL<BR>Positif : >= 10.00 AU/mL'
FROM public.ref_lab WHERE kode = 'I0285';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, NULL, NULL, 'Negatif : < 10.00 AU/mL<BR>Positif : >= 10.00 AU/mL'
FROM public.ref_lab WHERE kode = 'I0285';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I028601';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I028602';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I028603';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '0.00 - 10.0'
FROM public.ref_lab WHERE kode = 'I0288';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'I0289';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Non Reaktif'
FROM public.ref_lab WHERE kode = 'I0290';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Non Reaktif'
FROM public.ref_lab WHERE kode = 'I0292';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 200.0, '< 200'
FROM public.ref_lab WHERE kode = 'K0301';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 100.0, '< 100'
FROM public.ref_lab WHERE kode = 'K0302';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 40.0, 60.0, '> 40'
FROM public.ref_lab WHERE kode = 'K0303';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 50.0, 60.0, '> 50'
FROM public.ref_lab WHERE kode = 'K0303';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 200.0, '< 200'
FROM public.ref_lab WHERE kode = 'K0304';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, NULL, NULL, '< 145'
FROM public.ref_lab WHERE kode = 'K0305';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, NULL, NULL, '< 145'
FROM public.ref_lab WHERE kode = 'K0305';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '< 145'
FROM public.ref_lab WHERE kode = 'K0305';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 25.0, 'sampai 25'
FROM public.ref_lab WHERE kode = 'K0306';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 25.0, 'sampai 25'
FROM public.ref_lab WHERE kode = 'K0306';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 35.0, 'Sampai 35'
FROM public.ref_lab WHERE kode = 'K0307';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 31.0, 'Sampai 31'
FROM public.ref_lab WHERE kode = 'K0307';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 45.0, 'Sampai 45'
FROM public.ref_lab WHERE kode = 'K0308';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 34.0, 'Sampai 34'
FROM public.ref_lab WHERE kode = 'K0308';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 5.0, 85.0, 'May-85'
FROM public.ref_lab WHERE kode = 'K0309';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 80.0, 306.0, '80 - 306'
FROM public.ref_lab WHERE kode = 'K0311';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 80.0, 306.0, '80 - 306'
FROM public.ref_lab WHERE kode = 'K0311';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 120.0, 240.0, '120- 240'
FROM public.ref_lab WHERE kode = 'K0312';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 120.0, 240.0, '120 - 240'
FROM public.ref_lab WHERE kode = 'K0312';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 3.5, 5.5, '3.5 - 5.5'
FROM public.ref_lab WHERE kode = 'K0314';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 3.5, 5.5, '3.5 - 5.5'
FROM public.ref_lab WHERE kode = 'K0314';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 135.0, 145.0, '135 - 145'
FROM public.ref_lab WHERE kode = 'K0315';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 135.0, 145.0, '135 - 145'
FROM public.ref_lab WHERE kode = 'K0315';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 96.0, 106.0, '96 - 106'
FROM public.ref_lab WHERE kode = 'K0316';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 98.0, 106.0, '96 - 106'
FROM public.ref_lab WHERE kode = 'K0316';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 1.0, 'Sampai 1.00'
FROM public.ref_lab WHERE kode = 'K0317';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 1.0, 'Sampai 1.00'
FROM public.ref_lab WHERE kode = 'K0317';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.1, 0.47, '0.4'
FROM public.ref_lab WHERE kode = 'K0318';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.1, 0.4, '0.1 - 0.4'
FROM public.ref_lab WHERE kode = 'K0318';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 6.6, 8.7, '6.6 - 8.7'
FROM public.ref_lab WHERE kode = 'K0319';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 3.4, 4.8, '3.4 - 4.8'
FROM public.ref_lab WHERE kode = 'K0321';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.5, 3.0, '1.5 - 3.0'
FROM public.ref_lab WHERE kode = 'K0322';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.5, 3.0, '1.5 - 3.0'
FROM public.ref_lab WHERE kode = 'K0322';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 3000.0, 9300.0, '3000 - 9300'
FROM public.ref_lab WHERE kode = 'K0325';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 3000.0, 9300.0, '3000 - 9300'
FROM public.ref_lab WHERE kode = 'K0325';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 70.0, 115.0, '70 - 115'
FROM public.ref_lab WHERE kode = 'K0326';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 70.0, 115.0, '70 - 115'
FROM public.ref_lab WHERE kode = 'K0326';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 140.0, '< 140'
FROM public.ref_lab WHERE kode = 'K0327';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 140.0, '< 140'
FROM public.ref_lab WHERE kode = 'K0327';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 140.0, '< 140'
FROM public.ref_lab WHERE kode = 'K0328';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 140.0, '< 140'
FROM public.ref_lab WHERE kode = 'K0328';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 10.0, 50.0, 'Oct-50'
FROM public.ref_lab WHERE kode = 'K0329';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.6, 1.3, '0.6 - 1.3'
FROM public.ref_lab WHERE kode = 'K0331';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 3.4, 7.0, '3.4 - 7.0'
FROM public.ref_lab WHERE kode = 'K0332';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 2.4, 5.7, '2.4 - 5.7'
FROM public.ref_lab WHERE kode = 'K0332';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 120.0, 'Sampai 120'
FROM public.ref_lab WHERE kode = 'K0333';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 120.0, 'Sampai 120'
FROM public.ref_lab WHERE kode = 'K0333';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 190.0, 'Sampai 190'
FROM public.ref_lab WHERE kode = 'K0334';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 190.0, 'Sampai 190'
FROM public.ref_lab WHERE kode = 'K0334';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '< 6.5 : Baik<BR>6.5 - 8.0 : Sedang<BR>> 8 : Buruk'
FROM public.ref_lab WHERE kode = 'K0335';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '0.00 - 0.02<BR>> 0.02 Abnormal'
FROM public.ref_lab WHERE kode = 'K0336';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 35.0, 'Sampai 35'
FROM public.ref_lab WHERE kode = 'K0338';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 31.0, 'Sampai 31'
FROM public.ref_lab WHERE kode = 'K0338';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 45.0, 'Sampai 45'
FROM public.ref_lab WHERE kode = 'K0339';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 34.0, 'Sampai 34'
FROM public.ref_lab WHERE kode = 'K0339';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '8.1 - 10.4'
FROM public.ref_lab WHERE kode = 'K0340';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, NULL, NULL, '3.5 - 5.5'
FROM public.ref_lab WHERE kode = 'K034101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, NULL, NULL, '3.5 - 5.5'
FROM public.ref_lab WHERE kode = 'K034101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 3.5, 5.5, '3.5 - 5.5'
FROM public.ref_lab WHERE kode = 'K034101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, NULL, NULL, '135 - 145'
FROM public.ref_lab WHERE kode = 'K034102';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 135.0, 145.0, '135 - 145'
FROM public.ref_lab WHERE kode = 'K034102';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '96 - 106'
FROM public.ref_lab WHERE kode = 'K034103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, NULL, NULL, '3.5 - 5.5'
FROM public.ref_lab WHERE kode = 'K034201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, NULL, NULL, '3.5 - 5.5'
FROM public.ref_lab WHERE kode = 'K034201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '3.5 - 5.5'
FROM public.ref_lab WHERE kode = 'K034201';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, NULL, 'sampai 0.75'
FROM public.ref_lab WHERE kode = 'K0343';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 80.0, 306.0, '80 - 306'
FROM public.ref_lab WHERE kode = 'K0344';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 80.0, 306.0, '80 - 306'
FROM public.ref_lab WHERE kode = 'K0344';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '< 20'
FROM public.ref_lab WHERE kode = 'K0346';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 40.0, 60.0, '> 40'
FROM public.ref_lab WHERE kode = 'K0347';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 50.0, 60.0, '> 50'
FROM public.ref_lab WHERE kode = 'K0347';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 1.6, 2.6, '1.6 - 2.6'
FROM public.ref_lab WHERE kode = 'K0348';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 40.0, 60.0, '> 40'
FROM public.ref_lab WHERE kode = 'K0350';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 50.0, 60.0, '> 50'
FROM public.ref_lab WHERE kode = 'K0350';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'TRANSUDAT : (Kekuningan)'
FROM public.ref_lab WHERE kode = 'K03510101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'TRANSUDAT : (Jernih)'
FROM public.ref_lab WHERE kode = 'K03510105';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'TRANSUDAT : (Negatif)'
FROM public.ref_lab WHERE kode = 'K03510107';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'TRANSUDAT : < 1.015'
FROM public.ref_lab WHERE kode = 'K03510109';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'TRANSUDAT : < 300 / uL'
FROM public.ref_lab WHERE kode = 'K03510111';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'TRANSUDAT = Kadar di serum'
FROM public.ref_lab WHERE kode = 'K035104';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'TRANSUDAT < 3gr / dL'
FROM public.ref_lab WHERE kode = 'K035106';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Defisiensi : < 20<BR>Insufisiensi : 20 - 29<BR>Sufficient : 30 - 100<BR>Potential Toxicity :<BR>> 100'
FROM public.ref_lab WHERE kode = 'K0352';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 60.0, NULL, '>= 60'
FROM public.ref_lab WHERE kode = 'K0356';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 1.1, 4.4, '1.1 - 4.4'
FROM public.ref_lab WHERE kode = 'K0358';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 2.7, 4.5, '2.7 - 4.5'
FROM public.ref_lab WHERE kode = 'K0359';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 140.0, '< 140'
FROM public.ref_lab WHERE kode = 'M011001';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'M011002';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 140.0, '< 140'
FROM public.ref_lab WHERE kode = 'M011003';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 140.0, '< 140'
FROM public.ref_lab WHERE kode = 'M012601';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 140.0, '< 140'
FROM public.ref_lab WHERE kode = 'M013301';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'M013302';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'P0101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'P0102';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'P0103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'P0104';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'P0105';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'P0106';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif >= 40.00'
FROM public.ref_lab WHERE kode = 'P010702';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif >= 40.00'
FROM public.ref_lab WHERE kode = 'P010703';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'P0108';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'P0109';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '<b>Catatan :</b> <br>Hasil <b>Negatif</b> menunjukkan bahwa tidak terdeteksi adanya RNA Virus SARS-CoV-2.<br>Mohon evaluasi klinis, Riwayat pasien dan informasi pemeriksaan penunjang medis lainnya untuk dapatmenginterpretasikan status pasien.<br><b>Saran</b>:<br>Lakukan Protokol Kesehatan dengan benar dan tepat.'
FROM public.ref_lab WHERE kode = 'P010906';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '<b>Catatan</b> : <br> Hasil <b>Positif</b> menunjukkan bahwa terdeteksi adanya RNA Virus SARS-CoV-2.<br>Mohon evaluasi klinis, Riwayat pasien dan informasi pemeriksaan penunjang medis lainnya untuk dapatmenginterpretasikan status pasien.<br><b>Saran:</b><br>Silahkan melakukan konsultasi lebih lanjut ke dokter.<br>Lakukan Protokol Kesehatan dengan benar dan tepat.'
FROM public.ref_lab WHERE kode = 'P010907';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif >=40.00'
FROM public.ref_lab WHERE kode = 'P011002';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif >=40.00'
FROM public.ref_lab WHERE kode = 'P011003';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '<BR><BR><BR><BR><BR><BR><BR><BR><BR>'
FROM public.ref_lab WHERE kode = 'P011004';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Kuning'
FROM public.ref_lab WHERE kode = 'U010101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Jernih'
FROM public.ref_lab WHERE kode = 'U010102';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 6.5, '5.0 - 6.5'
FROM public.ref_lab WHERE kode = 'U010103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 6.5, '5.0 - 6.5'
FROM public.ref_lab WHERE kode = 'U010103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.025, 1.035, '1.025 - 1.035'
FROM public.ref_lab WHERE kode = 'U010104';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.025, 1.035, '1.025 - 1.035'
FROM public.ref_lab WHERE kode = 'U010104';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U010105';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U010106';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U010107';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U010108';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Normal'
FROM public.ref_lab WHERE kode = 'U010109';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U010110';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U010111';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'U010112';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'U010112';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 1.0, NULL
FROM public.ref_lab WHERE kode = 'U01011301';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 1.0, NULL
FROM public.ref_lab WHERE kode = 'U01011301';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.0, 6.0, '1.0 - 6.0'
FROM public.ref_lab WHERE kode = 'U01011302';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.0, 6.0, '1.0 - 6.0'
FROM public.ref_lab WHERE kode = 'U01011302';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 0.0, 10.0, NULL
FROM public.ref_lab WHERE kode = 'U01011303';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 0.0, 10.0, NULL
FROM public.ref_lab WHERE kode = 'U01011303';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'U0101130401';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 5.0, 10.0, '5.0 - 10.0'
FROM public.ref_lab WHERE kode = 'U0101130401';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0101130402';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0101130403';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0101130404';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U01011305';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U01011306';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U01011307';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0102';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0104';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0105';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 0.0, 30.0, '0 - 30'
FROM public.ref_lab WHERE kode = 'U0106';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0107';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0108';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0110';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 4.8, 7.4, '4.8 - 7.4'
FROM public.ref_lab WHERE kode = 'U0111';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 4.8, 7.4, '4.8 - 7.4'
FROM public.ref_lab WHERE kode = 'U0111';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'L'::public.jenis_kelamin_t, 1.015, 1.025, '1.015 - 1.025'
FROM public.ref_lab WHERE kode = 'U0112';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, 'P'::public.jenis_kelamin_t, 1.015, 1.025, '1.015 - 1.025'
FROM public.ref_lab WHERE kode = 'U0112';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, 1.6, 2.6, '1.6 - 2.6'
FROM public.ref_lab WHERE kode = 'U0115';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0120';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0122';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0123';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0124';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0125';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0126';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0127';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negative'
FROM public.ref_lab WHERE kode = 'U0137';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0139';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'U0140';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, '0'
FROM public.ref_lab WHERE kode = 'W0101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'W010101';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'W010102';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'W010103';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'W010104';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'W010105';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'W010106';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'W010107';
INSERT INTO public.ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, teks)
SELECT id, NULL::public.jenis_kelamin_t, NULL, NULL, 'Negatif'
FROM public.ref_lab WHERE kode = 'W010108';