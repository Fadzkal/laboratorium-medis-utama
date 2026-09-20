-- =====================================================================
-- DUMMY DATA - Laboratorium Medis Utama Purbalingga
-- Jalankan SETELAH 33_inventori_umum.sql berhasil
-- =====================================================================

-- 1. PROFIL FASKES
update faskes set
  nama = 'Laboratorium Medis Utama',
  jenis_faskes = 'Laboratorium Klinik',
  alamat = 'Jl. D.I. Panjaitan No.94',
  kelurahan = 'Purbalingga Lor',
  kecamatan = 'Purbalingga',
  kabupaten = 'Purbalingga',
  provinsi = 'Jawa Tengah',
  kode_pos = '53311',
  telepon = '(0281) 6580099',
  penanggung_jawab = 'dr. Ari Wibowo, Sp.PK'
where id = 1;

-- 2. MASTER LAB (ref_lab)
insert into ref_lab (kode, nama, kelompok, satuan, jenis_nilai, desimal, kode_loinc, urutan) values
  ('HB', 'Hemoglobin', 'Hematologi', 'g/dL', 'ANGKA', 1, '718-7', 10),
  ('HT', 'Hematokrit', 'Hematologi', '%', 'ANGKA', 1, '4544-3', 11),
  ('LEU', 'Leukosit', 'Hematologi', 'ribu/uL', 'ANGKA', 1, '6690-2', 12),
  ('TRO', 'Trombosit', 'Hematologi', 'ribu/uL', 'ANGKA', 0, '777-3', 13),
  ('ERI', 'Eritrosit', 'Hematologi', 'juta/uL', 'ANGKA', 2, '789-8', 14),
  ('MCV', 'MCV', 'Hematologi', 'fL', 'ANGKA', 1, '787-2', 15),
  ('MCH', 'MCH', 'Hematologi', 'pg', 'ANGKA', 1, '785-6', 16),
  ('MCHC', 'MCHC', 'Hematologi', 'g/dL', 'ANGKA', 1, '786-4', 17),
  ('LED', 'Laju Endap Darah', 'Hematologi', 'mm/jam', 'ANGKA', 0, '4537-7', 18),
  ('GDS', 'Gula Darah Sewaktu', 'Kimia Klinik', 'mg/dL', 'ANGKA', 0, '2345-7', 30),
  ('GDP', 'Gula Darah Puasa', 'Kimia Klinik', 'mg/dL', 'ANGKA', 0, '1558-6', 31),
  ('GD2PP', 'Gula Darah 2 Jam PP', 'Kimia Klinik', 'mg/dL', 'ANGKA', 0, '1521-4', 32),
  ('HBA1C', 'HbA1c', 'Kimia Klinik', '%', 'ANGKA', 1, '4548-4', 33),
  ('CHOL', 'Kolesterol Total', 'Kimia Klinik', 'mg/dL', 'ANGKA', 0, '2093-3', 34),
  ('TG', 'Trigliserida', 'Kimia Klinik', 'mg/dL', 'ANGKA', 0, '2571-8', 35),
  ('HDL', 'HDL Kolesterol', 'Kimia Klinik', 'mg/dL', 'ANGKA', 0, '2085-9', 36),
  ('LDL', 'LDL Kolesterol', 'Kimia Klinik', 'mg/dL', 'ANGKA', 0, '22748-8', 37),
  ('UREUM', 'Ureum', 'Kimia Klinik', 'mg/dL', 'ANGKA', 1, '3091-6', 38),
  ('KREAT', 'Kreatinin', 'Kimia Klinik', 'mg/dL', 'ANGKA', 2, '2160-0', 39),
  ('AST', 'SGOT (AST)', 'Kimia Klinik', 'U/L', 'ANGKA', 0, '1920-8', 40),
  ('ALT', 'SGPT (ALT)', 'Kimia Klinik', 'U/L', 'ANGKA', 0, '1742-5', 41),
  ('UA', 'Asam Urat', 'Kimia Klinik', 'mg/dL', 'ANGKA', 1, '3084-1', 42)
on conflict (kode) do nothing;

insert into ref_lab (kode, nama, kelompok, satuan, jenis_nilai, desimal, urutan) values
  ('UV_WRN', 'Warna Urine', 'Urinalisis', null, 'PILIHAN', 0, 50),
  ('UV_KJR', 'Kejernihan Urine', 'Urinalisis', null, 'PILIHAN', 0, 51),
  ('UV_pH', 'pH Urine', 'Urinalisis', null, 'ANGKA', 1, 52),
  ('UV_BJ', 'Berat Jenis Urine', 'Urinalisis', null, 'ANGKA', 3, 53),
  ('UV_PRO', 'Protein Urine', 'Urinalisis', null, 'PILIHAN', 0, 54),
  ('UV_GLS', 'Glukosa Urine', 'Urinalisis', null, 'PILIHAN', 0, 55),
  ('UV_BLD', 'Darah Urine', 'Urinalisis', null, 'PILIHAN', 0, 56),
  ('UV_NIT', 'Nitrit Urine', 'Urinalisis', null, 'PILIHAN', 0, 57),
  ('UV_LEU', 'Leukosit Esterase', 'Urinalisis', null, 'PILIHAN', 0, 58),
  ('UV_SED_LEU', 'Sedimen Leukosit', 'Urinalisis', '/LPB', 'ANGKA', 0, 59),
  ('UV_SED_ERI', 'Sedimen Eritrosit', 'Urinalisis', '/LPB', 'ANGKA', 0, 60),
  ('HbsAg', 'HBsAg (Hepatitis B)', 'Imunoserologi', null, 'PILIHAN', 0, 70),
  ('AntiHCV', 'Anti HCV (Hepatitis C)', 'Imunoserologi', null, 'PILIHAN', 0, 71),
  ('HIV_RDT', 'Anti HIV (RDT)', 'Imunoserologi', null, 'PILIHAN', 0, 72),
  ('TYPHOID', 'Tes Typhoid (RDT)', 'Imunoserologi', null, 'PILIHAN', 0, 73),
  ('DBD_NS1', 'NS1 Antigen Dengue', 'Imunoserologi', null, 'PILIHAN', 0, 74),
  ('WIDAL_O', 'Widal Typhi O', 'Imunoserologi', null, 'PILIHAN', 0, 75),
  ('WIDAL_H', 'Widal Typhi H', 'Imunoserologi', null, 'PILIHAN', 0, 76)
on conflict (kode) do nothing;

update ref_lab set pilihan = array['Kuning Muda','Kuning','Kuning Tua','Oranye','Merah','Coklat'] where kode = 'UV_WRN';
update ref_lab set pilihan = array['Jernih','Agak Keruh','Keruh'] where kode = 'UV_KJR';
update ref_lab set pilihan = array['Negatif','Trace','+1','+2','+3'] where kode in ('UV_PRO','UV_GLS','UV_BLD','UV_LEU');
update ref_lab set pilihan = array['Negatif','Positif'] where kode in ('UV_NIT','HbsAg','AntiHCV','HIV_RDT','TYPHOID','DBD_NS1');
update ref_lab set pilihan = array['Negatif','1/80','1/160','1/320','1/640'] where kode in ('WIDAL_O','WIDAL_H');
update ref_lab set teks_normal = 'Negatif' where kode in ('UV_PRO','UV_GLS','UV_BLD','UV_NIT','UV_LEU','HbsAg','AntiHCV','HIV_RDT','TYPHOID','DBD_NS1','WIDAL_O','WIDAL_H');

-- 3. NILAI RUJUKAN
insert into ref_lab_rujukan (lab_id, jenis_kelamin, batas_bawah, batas_atas, kritis_bawah, kritis_atas) values
  ((select id from ref_lab where kode='HB'), 'L', 13.0, 18.0, 7.0, 20.0),
  ((select id from ref_lab where kode='HB'), 'P', 12.0, 16.0, 7.0, 20.0),
  ((select id from ref_lab where kode='HT'), 'L', 40, 54, 20, 65),
  ((select id from ref_lab where kode='HT'), 'P', 37, 47, 20, 65),
  ((select id from ref_lab where kode='LEU'), null, 4.5, 11.0, 2.0, 30.0),
  ((select id from ref_lab where kode='TRO'), null, 150, 400, 50, 1000),
  ((select id from ref_lab where kode='ERI'), 'L', 4.5, 6.5, null, null),
  ((select id from ref_lab where kode='ERI'), 'P', 3.8, 5.8, null, null),
  ((select id from ref_lab where kode='GDS'), null, null, 200, null, 500),
  ((select id from ref_lab where kode='GDP'), null, 70, 126, 50, 400),
  ((select id from ref_lab where kode='CHOL'), null, null, 200, null, null),
  ((select id from ref_lab where kode='TG'), null, null, 150, null, null),
  ((select id from ref_lab where kode='HDL'), 'L', 40, null, null, null),
  ((select id from ref_lab where kode='HDL'), 'P', 50, null, null, null),
  ((select id from ref_lab where kode='LDL'), null, null, 130, null, null),
  ((select id from ref_lab where kode='UREUM'), null, 10, 50, null, 200),
  ((select id from ref_lab where kode='KREAT'), 'L', 0.7, 1.2, null, 10.0),
  ((select id from ref_lab where kode='KREAT'), 'P', 0.5, 1.1, null, 10.0),
  ((select id from ref_lab where kode='AST'), 'L', null, 40, null, null),
  ((select id from ref_lab where kode='AST'), 'P', null, 35, null, null),
  ((select id from ref_lab where kode='ALT'), 'L', null, 41, null, null),
  ((select id from ref_lab where kode='ALT'), 'P', null, 31, null, null),
  ((select id from ref_lab where kode='UA'), 'L', 3.4, 7.0, null, null),
  ((select id from ref_lab where kode='UA'), 'P', 2.4, 6.0, null, null),
  ((select id from ref_lab where kode='UV_pH'), null, 4.5, 8.0, null, null),
  ((select id from ref_lab where kode='UV_BJ'), null, 1.003, 1.030, null, null);

-- 4. PAKET PEMERIKSAAN
insert into ref_lab_paket (kode, nama, bruto, netto, urutan, aktif) values
  ('TORCH1',       'TORCH 1',                        1400000, 1400000, 1, true),
  ('DIABETES',     'Diabetes',                       null,    null,    2, true),
  ('CUS',          'Check Up Sederhana',             null,    null,    3, true),
  ('PAKETGULA',    'Tes paket gula',                 30000,   0,       4, true),
  ('PROLANIS_HT',  'Prolanis Hipertensi',            535000,  0,       5, true),
  ('PROLANIS_DM',  'Prolanis Diabetes Non 2 Jam PP', 750000,  0,       6, true),
  ('PROLANIS_2JPP','Prolanis Diabetes Plus 2JPP',    780000,  0,       7, true),
  ('PROLANIS_GDS', 'Prolanis Diabetes GDS',          750000,  0,       8, true)
on conflict (kode) do nothing;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='TORCH1') p,
(values ('HbsAg',0),('AntiHCV',1),('HIV_RDT',2)) k(kode,u)
join ref_lab l on l.kode=k.kode on conflict do nothing;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='DIABETES') p,
(values ('GDP',0),('GD2PP',1),('HBA1C',2),('GDS',3)) k(kode,u)
join ref_lab l on l.kode=k.kode on conflict do nothing;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='CUS') p,
(values ('HB',0),('LEU',1),('TRO',2),('GDS',3),('CHOL',4)) k(kode,u)
join ref_lab l on l.kode=k.kode on conflict do nothing;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='PAKETGULA') p,
(values ('GDP',0),('GD2PP',1)) k(kode,u)
join ref_lab l on l.kode=k.kode on conflict do nothing;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='PROLANIS_HT') p,
(values ('HB',0),('LEU',1),('TRO',2),('GDS',3),('CHOL',4),('KREAT',5),('UA',6)) k(kode,u)
join ref_lab l on l.kode=k.kode on conflict do nothing;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='PROLANIS_DM') p,
(values ('GDP',0),('HBA1C',1),('CHOL',2),('KREAT',3)) k(kode,u)
join ref_lab l on l.kode=k.kode on conflict do nothing;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='PROLANIS_2JPP') p,
(values ('GDP',0),('GD2PP',1),('HBA1C',2),('CHOL',3),('KREAT',4)) k(kode,u)
join ref_lab l on l.kode=k.kode on conflict do nothing;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='PROLANIS_GDS') p,
(values ('GDS',0),('HBA1C',1),('CHOL',2)) k(kode,u)
join ref_lab l on l.kode=k.kode on conflict do nothing;

-- 5. MASTER REAGEN INVENTORI
insert into inventori_barang (kode, nama, kategori, purchase_unit, usage_unit, conversion_factor, stok_minimum_usage, aktif) values
  ('REG-HEM-001', 'Reagen Hematology 3-Part Diff', 'Reagen', 'Kit', 'Test', 500, 50, true),
  ('REG-HEM-002', 'Diluent Hematology Analyzer', 'Reagen', 'Botol', 'mL', 500, 100, true),
  ('REG-KIM-001', 'Reagen Glukosa (Enzymatic)', 'Reagen', 'Kit', 'Test', 100, 20, true),
  ('REG-KIM-002', 'Reagen Kolesterol Total', 'Reagen', 'Kit', 'Test', 100, 20, true),
  ('REG-KIM-003', 'Reagen Trigliserida', 'Reagen', 'Kit', 'Test', 100, 20, true),
  ('REG-KIM-004', 'Reagen Kreatinin (Jaffe)', 'Reagen', 'Kit', 'Test', 100, 20, true),
  ('REG-KIM-005', 'Reagen Ureum (BUN)', 'Reagen', 'Kit', 'Test', 100, 20, true),
  ('REG-KIM-006', 'Reagen SGOT/SGPT', 'Reagen', 'Kit', 'Test', 100, 20, true),
  ('REG-KIM-007', 'Reagen Asam Urat (Enzymatic)', 'Reagen', 'Kit', 'Test', 100, 20, true),
  ('REG-IMU-001', 'Strip Dengue NS1+IgM+IgG Combo', 'Reagen', 'Box', 'Pcs', 25, 5, true),
  ('REG-IMU-002', 'Strip HBsAg Rapid Test', 'Reagen', 'Box', 'Pcs', 50, 10, true),
  ('REG-IMU-003', 'Strip HIV Rapid Test', 'Reagen', 'Box', 'Pcs', 50, 10, true),
  ('REG-IMU-004', 'Strip Typhoid (IgM/IgG) RDT', 'Reagen', 'Box', 'Pcs', 25, 5, true),
  ('REG-URI-001', 'Strip Urine 10 Parameter', 'Reagen', 'Botol', 'Pcs', 100, 20, true),
  ('BHP-001', 'Tabung EDTA 3 mL (Ungu)', 'BHP', 'Box', 'Pcs', 100, 20, true),
  ('BHP-002', 'Tabung Serum 5 mL (Kuning)', 'BHP', 'Box', 'Pcs', 100, 20, true),
  ('BHP-003', 'Jarum Vacutainer 21G', 'BHP', 'Box', 'Pcs', 100, 20, true),
  ('BHP-004', 'Gloves Lateks (M)', 'BHP', 'Box', 'Pcs', 100, 20, true),
  ('BHP-005', 'Pot Urine Steril', 'BHP', 'Pak', 'Pcs', 50, 10, true),
  ('ATK-001', 'Formulir Hasil Lab A4', 'ATK', 'Rim', 'Lembar', 500, 50, true)
on conflict (kode) do nothing;

-- 6. BATCH STOK AWAL
do $$ declare v uuid; begin
  select id into v from inventori_barang where kode='REG-HEM-001';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'SYS-BX2601','2026-12-31',350,1800) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-KIM-001';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'GLU-2601','2027-03-31',75,3200) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-KIM-002';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'CHOL-2601','2027-03-31',70,4500) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-KIM-003';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'TG-2601','2027-03-31',60,4800) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-KIM-004';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'KREAT-2601','2027-02-28',80,3500) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-KIM-005';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'UREUM-2601','2027-02-28',65,3200) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-KIM-006';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'SGOT-2601','2027-01-31',70,4200) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-KIM-007';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'UA-2601','2027-01-31',55,3800) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-IMU-001';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'DNG-2601A','2026-10-10',8,35000) on conflict do nothing;
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'DNG-2601B','2027-04-30',15,33000) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-IMU-002';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'HBS-2601','2027-06-30',38,8500) on conflict do nothing;
  select id into v from inventori_barang where kode='REG-IMU-003';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'HIV-2601','2027-06-30',32,12000) on conflict do nothing;
  select id into v from inventori_barang where kode='BHP-001';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'EDTA-2601','2028-12-31',75,650) on conflict do nothing;
  select id into v from inventori_barang where kode='BHP-002';
  insert into inventori_batch(barang_id,batch_number,expired_date,stok_sekarang_usage,cost_per_usage_unit) values(v,'SRM-2601','2028-12-31',68,850) on conflict do nothing;
  update inventori_barang b set stok_sekarang_usage=(select coalesce(sum(bt.stok_sekarang_usage),0) from inventori_batch bt where bt.barang_id=b.id);
end $$;

-- 7. DATA PASIEN (20 Warga Purbalingga, NIK DUMMY)
insert into pasien (no_rm, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, gol_darah, pekerjaan, status_kawin, alamat, kelurahan, kecamatan, kabupaten, provinsi, no_hp) values
  ('RM-2601001','3303010101900001','SITI RAHAYU','Purbalingga','1990-01-01','P','O','Petani','KAWIN','Jl. Mawar No.12','Purbalingga Lor','Purbalingga','Purbalingga','Jawa Tengah','081234500001'),
  ('RM-2601002','3303011505870002','AHMAD FAUZI','Purbalingga','1987-05-15','L','A','Wiraswasta','KAWIN','Jl. Melati No.7','Selabaya','Kalimanah','Purbalingga','Jawa Tengah','081234500002'),
  ('RM-2601003','3303012009780003','DEWI HARTINI','Banyumas','1978-09-20','P','B','IRT','KAWIN','Jl. Kenanga No.3','Purbalingga Wetan','Purbalingga','Purbalingga','Jawa Tengah','081234500003'),
  ('RM-2601004','3303011203950004','BUDI SANTOSO','Purbalingga','1995-03-12','L','O','Karyawan','BELUM KAWIN','Jl. Seruni No.22','Kembaran Kulon','Purbalingga','Purbalingga','Jawa Tengah','081234500004'),
  ('RM-2601005','3303014506650005','SUMIATI','Purbalingga','1965-06-05','P','AB','Petani','KAWIN','Gg. Anggrek No.4','Bojongsari','Bojongsari','Purbalingga','Jawa Tengah','081234500005'),
  ('RM-2601006','3303010207720006','HENDRA KUSUMA','Cilacap','1972-07-02','L','A','PNS','KAWIN','Jl. Diponegoro No.55','Karangsentul','Padamara','Purbalingga','Jawa Tengah','081234500006'),
  ('RM-2601007','3303013108830007','YUNI ASTUTI','Purbalingga','1983-08-31','P','O','Guru','KAWIN','Jl. Raya Bobotsari No.11','Bobotsari','Bobotsari','Purbalingga','Jawa Tengah','081234500007'),
  ('RM-2601008','3303011410910008','RUDI HERMAWAN','Purbalingga','1991-10-14','L','B','Buruh','KAWIN','Jl. Sudirman No.88','Penican','Purbalingga','Purbalingga','Jawa Tengah','081234500008'),
  ('RM-2601009','3303012811600009','SARIYEM','Banjarnegara','1960-11-28','P','A','Petani','JANDA','Jl. Prabumulih No.2','Cipaku','Mrebet','Purbalingga','Jawa Tengah','081234500009'),
  ('RM-2601010','3303010502000010','DANU PRASETYO','Purbalingga','2000-02-05','L','O','Pelajar','BELUM KAWIN','Perum Griya Utama B3','Prigi','Padamara','Purbalingga','Jawa Tengah','081234500010'),
  ('RM-2601011','3303013009750011','ENDANG SUPRIYATI','Purbalingga','1975-09-30','P','B','Pedagang','KAWIN','Pasar Wage Blok B12','Purbalingga Lor','Purbalingga','Purbalingga','Jawa Tengah','081234500011'),
  ('RM-2601012','3303011802550012','KARMAN','Banjarnegara','1955-02-18','L','AB','Pensiunan','KAWIN','Jl. HOS Cokroaminoto No.6','Sidakangen','Kalimanah','Purbalingga','Jawa Tengah','081234500012'),
  ('RM-2601013','3303012204680013','WAHYU NINGSIH','Purbalingga','1968-04-22','P','O','Wirausaha','KAWIN','Jl. Sultan Agung No.14','Mewek','Kalimanah','Purbalingga','Jawa Tengah','081234500013'),
  ('RM-2601014','3303010908930014','ARIF BUDI LAKSONO','Purbalingga','1993-08-09','L','A','Teknisi','KAWIN','Jl. Sawunggaling No.19','Karangtalun Lor','Purbalingga','Purbalingga','Jawa Tengah','081234500014'),
  ('RM-2601015','3303012606820015','RATNA WATI','Wonosobo','1982-06-26','P','B','Karyawan','KAWIN','Jl. Pahlawan No.31','Karangsentul','Padamara','Purbalingga','Jawa Tengah','081234500015'),
  ('RM-2601016','3303011504570016','SUTRISNO','Purbalingga','1957-04-15','L','O','Petani','KAWIN','Desa Limbasari RT 02/03','Limbasari','Bobotsari','Purbalingga','Jawa Tengah','081234500016'),
  ('RM-2601017','3303010303860017','LESTARI HANDAYANI','Purbalingga','1986-03-03','P','A','Bidan','KAWIN','Perum Tiara Regency No.7','Purbalingga Wetan','Purbalingga','Purbalingga','Jawa Tengah','081234500017'),
  ('RM-2601018','3303011712990018','RIZKY MAULANA','Purbalingga','1999-12-17','L','O','Mahasiswa','BELUM KAWIN','Jl. Veteran No.9','Selabaya','Kalimanah','Purbalingga','Jawa Tengah','081234500018'),
  ('RM-2601019','3303010201700019','YAYAH SURYANI','Purbalingga','1970-01-02','P','B','IRT','KAWIN','Jl. Pramuka No.22','Pengalusan','Mrebet','Purbalingga','Jawa Tengah','081234500019'),
  ('RM-2601020','3303011007640020','AGUS TRIYONO','Purbalingga','1964-07-10','L','AB','Petani','KAWIN','Jl. Raya Kaligondang No.5','Sidakangen','Kalimanah','Purbalingga','Jawa Tengah','081234500020')
on conflict (no_rm) do nothing;