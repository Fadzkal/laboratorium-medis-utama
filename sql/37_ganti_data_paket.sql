-- =====================================================================
--  MIGRASI: Ganti data paket pemeriksaan
--  Tanggal : 2026-09-19
--  Cara    : Jalankan di Supabase SQL Editor (satu kali saja)
-- =====================================================================

-- Hapus semua item paket lama terlebih dahulu (cascade otomatis)
delete from ref_lab_paket;

-- Insert paket baru sesuai data aktual
insert into ref_lab_paket (kode, nama, bruto, netto, urutan, aktif) values
  ('TORCH1',       'TORCH 1',                        1400000, 1400000, 1, true),
  ('DIABETES',     'Diabetes',                       null,    null,    2, true),
  ('CUS',          'Check Up Sederhana',             null,    null,    3, true),
  ('PAKETGULA',    'Tes paket gula',                 30000,   0,       4, true),
  ('PROLANIS_HT',  'Prolanis Hipertensi',            535000,  0,       5, true),
  ('PROLANIS_DM',  'Prolanis Diabetes Non 2 Jam PP', 750000,  0,       6, true),
  ('PROLANIS_2JPP','Prolanis Diabetes Plus 2JPP',    780000,  0,       7, true),
  ('PROLANIS_GDS', 'Prolanis Diabetes GDS',          750000,  0,       8, true)
on conflict (kode) do update set
  nama   = excluded.nama,
  bruto  = excluded.bruto,
  netto  = excluded.netto,
  urutan = excluded.urutan;

-- =====================================================================
-- Isi item paket (sesuaikan dengan kode pemeriksaan lab yang ada)
-- Jalankan HANYA setelah ref_lab sudah terisi
-- =====================================================================

-- TORCH 1: HBsAg, Anti HCV, HIV
insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u
from (select id from ref_lab_paket where kode='TORCH1') p,
(values ('HbsAg',0),('AntiHCV',1),('HIV_RDT',2)) k(kode,u)
join ref_lab l on l.kode=k.kode
on conflict do nothing;

-- Diabetes: GDP, GD2PP, HbA1c, GDS
insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u
from (select id from ref_lab_paket where kode='DIABETES') p,
(values ('GDP',0),('GD2PP',1),('HBA1C',2),('GDS',3)) k(kode,u)
join ref_lab l on l.kode=k.kode
on conflict do nothing;

-- Check Up Sederhana: Darah Rutin + Kolesterol + Gula
insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u
from (select id from ref_lab_paket where kode='CUS') p,
(values ('HB',0),('LEU',1),('TRO',2),('GDS',3),('CHOL',4)) k(kode,u)
join ref_lab l on l.kode=k.kode
on conflict do nothing;

-- Tes Paket Gula: GDP, GD2PP
insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u
from (select id from ref_lab_paket where kode='PAKETGULA') p,
(values ('GDP',0),('GD2PP',1)) k(kode,u)
join ref_lab l on l.kode=k.kode
on conflict do nothing;

-- Prolanis Hipertensi: Darah Rutin + Kolesterol + Kreatinin + Gula
insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u
from (select id from ref_lab_paket where kode='PROLANIS_HT') p,
(values ('HB',0),('LEU',1),('TRO',2),('GDS',3),('CHOL',4),('KREAT',5),('UA',6)) k(kode,u)
join ref_lab l on l.kode=k.kode
on conflict do nothing;

-- Prolanis Diabetes Non 2 Jam PP: GDP, HbA1c, Kolesterol, Kreatinin
insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u
from (select id from ref_lab_paket where kode='PROLANIS_DM') p,
(values ('GDP',0),('HBA1C',1),('CHOL',2),('KREAT',3)) k(kode,u)
join ref_lab l on l.kode=k.kode
on conflict do nothing;

-- Prolanis Diabetes Plus 2JPP: GDP, GD2PP, HbA1c, Kolesterol, Kreatinin
insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u
from (select id from ref_lab_paket where kode='PROLANIS_2JPP') p,
(values ('GDP',0),('GD2PP',1),('HBA1C',2),('CHOL',3),('KREAT',4)) k(kode,u)
join ref_lab l on l.kode=k.kode
on conflict do nothing;

-- Prolanis Diabetes GDS: GDS, HbA1c, Kolesterol
insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u
from (select id from ref_lab_paket where kode='PROLANIS_GDS') p,
(values ('GDS',0),('HBA1C',1),('CHOL',2)) k(kode,u)
join ref_lab l on l.kode=k.kode
on conflict do nothing;
