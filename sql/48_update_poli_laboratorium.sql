-- =====================================================================
--  MIGRASI: Mengubah data poli dummy menjadi khusus Laboratorium
--  Tanggal : 2026-09-21
--  Tujuan  : Menghapus poli gigi & KIA, serta mengubah poli umum menjadi Lab
-- =====================================================================

-- 1. Hapus jadwal poli untuk poli yang akan dihapus
delete from poli_jadwal where poli_id in (
    select id from poli where kode in ('GIGI', 'KIA')
);

-- 2. Hapus poli Gigi dan KIA (dummy)
delete from poli where kode in ('GIGI', 'KIA');

-- 3. Ubah Poli Umum menjadi Laboratorium Utama
update poli 
set 
    kode = 'LAB', 
    nama = 'Laboratorium Utama', 
    kode_pcare = '001'
where kode = 'UMUM';

-- 4. Jika sebelumnya UMUM sudah terhapus tapi LAB belum ada, maka insert
insert into poli (kode, nama, kode_pcare, urutan)
select 'LAB', 'Laboratorium Utama', '001', 1
where not exists (
    select 1 from poli where kode = 'LAB'
);
