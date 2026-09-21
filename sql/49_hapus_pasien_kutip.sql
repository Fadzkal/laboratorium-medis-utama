-- Script untuk menghapus data duplikat hasil salah parsing CSV (ada tanda kutip/spasi di no_rm)

-- 1. Hapus hasil lab
DELETE FROM lab_hasil 
WHERE permintaan_id IN (
  SELECT p.id FROM lab_permintaan p
  JOIN pasien pa ON p.pasien_id = pa.id
  WHERE pa.no_rm LIKE '"%' OR pa.no_rm LIKE ' %'
);

-- 2. Hapus permintaan lab
DELETE FROM lab_permintaan 
WHERE pasien_id IN (
  SELECT id FROM pasien WHERE no_rm LIKE '"%' OR no_rm LIKE ' %'
);

-- 3. Hapus kunjungan
DELETE FROM kunjungan 
WHERE pasien_id IN (
  SELECT id FROM pasien WHERE no_rm LIKE '"%' OR no_rm LIKE ' %'
);

-- 4. Hapus pasien duplikat
DELETE FROM pasien 
WHERE no_rm LIKE '"%' OR no_rm LIKE ' %';
