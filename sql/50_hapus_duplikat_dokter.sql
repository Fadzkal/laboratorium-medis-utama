
-- 1. Hapus entri dokter yang sebenarnya adalah instansi/perusahaan/RS (salah masuk dari seed rekanan)
DELETE FROM pegawai
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

-- 2. Hapus duplikat nama dokter yang sama persis (hanya menyisakan satu)
DELETE FROM pegawai a
USING pegawai b
WHERE a.peran = 'dokter' 
  AND b.peran = 'dokter'
  AND a.nama = b.nama
  AND a.id > b.id;

-- 3. Hapus duplikat nama dokter yang beda spasi/tanda baca sedikit (misal: 'Adly Nanda Sp. OG' vs 'Adly Nanda Sp.OG')
DELETE FROM pegawai a
USING pegawai b
WHERE a.peran = 'dokter' 
  AND b.peran = 'dokter'
  AND REPLACE(REPLACE(a.nama, ' ', ''), '.', '') = REPLACE(REPLACE(b.nama, ' ', ''), '.', '')
  AND a.id > b.id;

