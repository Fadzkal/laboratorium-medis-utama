const { createClient } = require('@supabase/supabase-js');

const c = createClient(
  'http://187.53.142.245:8001',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'
);

const SPERMA_MASTER_ITEMS = [
  { kode: 'SPM_ALL', nama: 'Analisa Sperma', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: 'Normal', urutan: 100, aktif: true },
  { kode: 'SPM_KLINIK', nama: 'Keterangan Klinik', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 110, aktif: true },
  { kode: 'SPM_SAMPEL', nama: 'KETERANGAN SAMPEL', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 120, aktif: true },
  { kode: 'SPM_KE', nama: 'Pemeriksaan Ke', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '1', urutan: 121, aktif: true },
  { kode: 'SPM_NIKAH', nama: 'Lama Menikah', kelompok: 'Analisa Sperma', satuan: 'tahun', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 122, aktif: true },
  { kode: 'SPM_PANTANG', nama: 'Lama Berpantang', kelompok: 'Analisa Sperma', satuan: 'hari', jenis_nilai: 'TEKS', nilai_normal: '2 - 7 Hari', urutan: 123, aktif: true },
  { kode: 'SPM_JAM_KELUAR', nama: 'Pengeluaran Jam', kelompok: 'Analisa Sperma', satuan: 'WIB', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 124, aktif: true },
  { kode: 'SPM_JAM_PERIKSA', nama: 'Pemeriksaan Jam', kelompok: 'Analisa Sperma', satuan: 'WIB', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 125, aktif: true },
  { kode: 'SPM_SEMEN', nama: 'SEMEN', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 200, aktif: true },
  { kode: 'SPM_LENGKAP', nama: '1. Kelengkapan Sampel', kelompok: 'Analisa Sperma', satuan: 'L/TL', jenis_nilai: 'TEKS', nilai_normal: 'Lengkap', urutan: 201, aktif: true },
  { kode: 'SPM_RUPA', nama: '2. Penampilan', kelompok: 'Analisa Sperma', satuan: 'N/Abn', jenis_nilai: 'TEKS', nilai_normal: 'Putih Mutiara / "Grey-Opalescent"', urutan: 202, aktif: true },
  { kode: 'SPM_KENTAL', nama: '3. Kekentalan', kelompok: 'Analisa Sperma', satuan: 'N/Abn', jenis_nilai: 'TEKS', nilai_normal: 'Tetesan Kecil (<2 cm)', urutan: 203, aktif: true },
  { kode: 'SPM_CAIR', nama: '4. Pencairan', kelompok: 'Analisa Sperma', satuan: 'N/Abn', jenis_nilai: 'TEKS', nilai_normal: '<60 Menit', urutan: 204, aktif: true },
  { kode: 'SPM_PH', nama: '5. pH', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'ANGKA', nilai_normal: '7,2 - 7,8', min_normal: 7.2, max_normal: 7.8, desimal: 1, urutan: 205, aktif: true },
  { kode: 'SPM_VOL', nama: '6. Volume', kelompok: 'Analisa Sperma', satuan: 'ml', jenis_nilai: 'ANGKA', nilai_normal: '1,5 - 6,8', min_normal: 1.5, max_normal: 6.8, desimal: 1, urutan: 206, aktif: true },
  { kode: 'SPM_SPERMA', nama: 'SPERMA', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 220, aktif: true },
  { kode: 'SPM_JML', nama: '1. Jumlah Sperma', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 221, aktif: true },
  { kode: 'SPM_KONS', nama: 'a. Konsentrasi', kelompok: 'Analisa Sperma', satuan: '10^6/ml', jenis_nilai: 'ANGKA', nilai_normal: '15,0 - 213,0', min_normal: 15.0, max_normal: 213.0, desimal: 1, urutan: 222, aktif: true },
  { kode: 'SPM_TOT', nama: 'b. Jumlah Total (Kons x Vol)', kelompok: 'Analisa Sperma', satuan: '10^6/ejk', jenis_nilai: 'ANGKA', nilai_normal: '39,0 - 802,0', min_normal: 39.0, max_normal: 802.0, desimal: 1, urutan: 223, aktif: true },
  { kode: 'SPM_GERAK', nama: '2. Gerakan Sperma', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 224, aktif: true },
  { kode: 'SPM_PR', nama: 'a. Bergerak Progresif (PR)', kelompok: 'Analisa Sperma', satuan: '%', jenis_nilai: 'ANGKA', nilai_normal: '32,0 - 72,0', min_normal: 32.0, max_normal: 72.0, desimal: 0, urutan: 225, aktif: true },
  { kode: 'SPM_TP', nama: 'b. Bergerak Tidak Progresif(TP)', kelompok: 'Analisa Sperma', satuan: '%', jenis_nilai: 'ANGKA', nilai_normal: '1,0 - 18,0', min_normal: 1.0, max_normal: 18.0, desimal: 0, urutan: 226, aktif: true },
  { kode: 'SPM_MOT', nama: 'c. Total Bergerak(PR+TP)', kelompok: 'Analisa Sperma', satuan: '%', jenis_nilai: 'ANGKA', nilai_normal: '40,0 - 78,0', min_normal: 40.0, max_normal: 78.0, desimal: 0, urutan: 227, aktif: true },
  { kode: 'SPM_TG', nama: 'd. Tidak Bergerak(TG)', kelompok: 'Analisa Sperma', satuan: '%', jenis_nilai: 'ANGKA', nilai_normal: '22,0 - 59,0', min_normal: 22.0, max_normal: 59.0, desimal: 0, urutan: 228, aktif: true },
  { kode: 'SPM_BENTUK', nama: '3. Bentuk Sperma', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 229, aktif: true },
  { kode: 'SPM_NORM', nama: 'a. Bentuk Normal', kelompok: 'Analisa Sperma', satuan: '%', jenis_nilai: 'ANGKA', nilai_normal: '4,0 - 44,0', min_normal: 4.0, max_normal: 44.0, desimal: 0, urutan: 230, aktif: true },
  { kode: 'SPM_VIT', nama: '4. Vitalitas Sperma', kelompok: 'Analisa Sperma', satuan: '%', jenis_nilai: 'ANGKA', nilai_normal: '58,0 - 91,0', min_normal: 58.0, max_normal: 91.0, desimal: 0, urutan: 231, aktif: true },
  { kode: 'SPM_AGL', nama: '5. Aglutinasi Sperma', kelompok: 'Analisa Sperma', satuan: 'Neg/1-4', jenis_nilai: 'TEKS', nilai_normal: 'Negatif', urutan: 232, aktif: true },
  { kode: 'SPM_SEL', nama: 'SEL-SEL LAIN', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 250, aktif: true },
  { kode: 'SPM_LEU', nama: '1. Leukosit', kelompok: 'Analisa Sperma', satuan: '10^6/ml', jenis_nilai: 'ANGKA', nilai_normal: '<1.0 (10^6/ml)', max_normal: 1.0, desimal: 2, urutan: 251, aktif: true },
  { kode: 'SPM_ERI', nama: '2. Eritrosit', kelompok: 'Analisa Sperma', satuan: 'Neg/Pos', jenis_nilai: 'TEKS', nilai_normal: 'Negatif', urutan: 252, aktif: true },
  { kode: 'SPM_BAK', nama: '3. Bakteri', kelompok: 'Analisa Sperma', satuan: 'Neg/Pos', jenis_nilai: 'TEKS', nilai_normal: 'Negatif', urutan: 253, aktif: true },
  { kode: 'SPM_DEBRIS', nama: '4. Lain-lain/Debris', kelompok: 'Analisa Sperma', satuan: 'Neg/Pos', jenis_nilai: 'TEKS', nilai_normal: 'Negatif', urutan: 254, aktif: true },
  { kode: 'SPM_KOMEN', nama: 'Komentar', kelompok: 'Analisa Sperma', satuan: '', jenis_nilai: 'TEKS', nilai_normal: '-', urutan: 270, aktif: true },
];

async function seed() {
  const { data: auth, error: aErr } = await c.auth.signInWithPassword({
    email: 'anisah@labutama.id',
    password: 'lab123456'
  });
  if (aErr) {
    console.error('Login gagal:', aErr);
    return;
  }
  console.log('Login berhasil sebagai:', auth.user.email);

  let successCount = 0;
  for (const item of SPERMA_MASTER_ITEMS) {
    const { error } = await c.from('ref_lab').upsert(item, { onConflict: 'kode' });
    if (error) {
      console.error(`Gagal upsert ${item.kode}:`, error.message);
    } else {
      successCount++;
    }
  }
  console.log(`Selesai seeding ref_lab: ${successCount}/${SPERMA_MASTER_ITEMS.length} berhasil.`);
}

seed();
