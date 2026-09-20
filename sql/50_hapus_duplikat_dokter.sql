
-- 1. Nonaktifkan (soft-delete) entri dokter yang sebenarnya adalah instansi/perusahaan/RS
UPDATE pegawai SET aktif = false
WHERE peran = 'dokter'
  AND (
    nama ILIKE 'PT %' OR
    nama ILIKE 'PT.%' OR
    nama ILIKE 'RS %' OR
    nama ILIKE 'RS.%' OR
    nama ILIKE 'RSIA %' OR
    nama ILIKE 'RSU %' OR
    nama ILIKE 'RSUD %' OR
    nama ILIKE 'RSUP %' OR
    nama ILIKE 'Klinik %' OR
    nama ILIKE 'Apotek %' OR
    nama ILIKE 'Puskesmas %' OR
    nama ILIKE 'Toko %' OR
    nama ILIKE 'SMA %' OR
    nama ILIKE 'UDD %' OR
    nama ILIKE 'UPTD %' OR
    nama ILIKE 'RB %' OR
    nama ILIKE 'SIKES %'
  );

-- 2. Nonaktifkan duplikat nama dokter (menyatukan yang beda spasi/titik) dan HANYA MENYISAKAN 1
-- Prioritas yang disisakan adalah data yang paling lengkap (punya alamat/telp/dll)
WITH RankedPegawai AS (
  SELECT 
    id, 
    ROW_NUMBER() OVER(
      -- Kelompokkan berdasarkan nama (mengabaikan spasi, titik, dan koma, serta case-insensitive)
      PARTITION BY REPLACE(REPLACE(REPLACE(LOWER(nama), ' ', ''), '.', ''), ',', '')
      ORDER BY 
        -- Beri nilai tinggi pada baris yang datanya lebih lengkap
        (CASE WHEN alamat IS NOT NULL AND alamat != '' THEN 1 ELSE 0 END +
         CASE WHEN telepon IS NOT NULL AND telepon != '' THEN 1 ELSE 0 END +
         CASE WHEN no_hp IS NOT NULL AND no_hp != '' THEN 1 ELSE 0 END +
         CASE WHEN spesialisasi IS NOT NULL AND spesialisasi != '' THEN 1 ELSE 0 END) DESC,
        -- Jika kelengkapannya sama, ambil yang paling baru diinput (terakhir dibuat)
        created_at DESC
    ) as rn
  FROM pegawai
  WHERE peran = 'dokter' AND aktif = true
)
UPDATE pegawai SET aktif = false
WHERE id IN (
  SELECT id FROM RankedPegawai WHERE rn > 1
);
