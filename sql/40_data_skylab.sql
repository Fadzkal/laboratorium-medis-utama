-- Bersihkan paket lama
delete from ref_lab_paket_item;
delete from ref_lab_paket;

-- Upsert ref_lab sesuai data Skylab yang terlihat
insert into ref_lab (kode, nama, kelompok, urutan) values
  ('H0102', 'Hematologi Rutin', 'Hematologi', 1),
  ('K0301', 'Cholesterol Total', 'Kimia Klinik', 2),
  ('K0304', 'Trigliserida', 'Kimia Klinik', 3),
  ('K0332', 'Asam Urat', 'Kimia Klinik', 4),
  ('K0328', 'Glukosa Darah Sewaktu', 'Kimia Klinik', 5),
  ('10238', 'IgG Anti Rubella', 'Imunoserologi', 6),
  ('10237', 'IgM Anti Rubella', 'Imunoserologi', 7),
  ('10235', 'IgM Anti Toxoplasma', 'Imunoserologi', 8),
  ('10236', 'IgG Anti Toxoplasma', 'Imunoserologi', 9),
  ('10239', 'IgM Anti CMV', 'Imunoserologi', 10),
  ('10240', 'IgG Anti CMV', 'Imunoserologi', 11),
  ('K0326', 'Glukosa Darah Puasa', 'Kimia Klinik', 12),
  ('K0327', 'Glukosa Darah 2 Jam PP', 'Kimia Klinik', 13),
  ('K0302', 'Cholesterol LDL', 'Kimia Klinik', 14),
  ('K0303', 'Cholesterol HDL', 'Kimia Klinik', 15),
  ('K0329', 'Ureum', 'Kimia Klinik', 16),
  ('K0331', 'Creatinin', 'Kimia Klinik', 17),
  ('U0106', 'Mikroalbumin Urine', 'Urinalisis', 18),
  ('K0335', 'HbA 1C', 'Kimia Klinik', 19)
on conflict (kode) do update set nama = EXCLUDED.nama;

-- Insert Paket Skylab
insert into ref_lab_paket (kode, nama, bruto, netto, urutan, aktif) values
  ('1908186', 'Check Up Sederhana', null, null, 1, true),
  ('1908184', 'Diabetes', null, null, 2, true),
  ('2603191', 'Prolanis Diabetes GDS', 750000, 0, 3, true),
  ('2603189', 'Prolanis Diabetes Non 2 Jam PP', 750000, 0, 4, true),
  ('2603190', 'Prolanis Diabetes Plus 2JPP', 780000, 0, 5, true),
  ('2603188', 'Prolanis Hipertensi', 535000, 0, 6, true),
  ('2603187', 'Tes paket gula', 30000, 0, 7, true),
  ('1802180', 'TORCH 1', 1400000, 1400000, 8, true);

-- Insert Item Paket
insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='1908186') p,
(values ('H0102',1),('K0301',2),('K0304',3),('K0332',4),('K0328',5)) k(kode,u)
left join ref_lab l on l.kode = k.kode;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='1802180') p,
(values ('10238',1),('10237',2),('10235',3),('10236',4),('10239',5),('10240',6)) k(kode,u)
left join ref_lab l on l.kode = k.kode;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='2603187') p,
(values ('K0326',1),('K0327',2)) k(kode,u)
left join ref_lab l on l.kode = k.kode;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='2603188') p,
(values ('K0301',1),('K0302',2),('K0303',3),('K0304',4),('K0329',5),('K0331',6),('U0106',7)) k(kode,u)
left join ref_lab l on l.kode = k.kode;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='2603190') p,
(values ('K0301',1),('K0303',2),('K0302',3),('K0304',4),('K0329',5),('K0331',6),('U0106',7),('K0326',8),('K0335',9),('K0327',10)) k(kode,u)
left join ref_lab l on l.kode = k.kode;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='2603189') p,
(values ('K0301',1),('K0303',2),('K0302',3),('K0304',4),('K0329',5),('K0331',6),('U0106',7),('K0326',8),('K0335',9)) k(kode,u)
left join ref_lab l on l.kode = k.kode;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='2603191') p,
(values ('K0301',1),('K0303',2),('K0302',3),('K0304',4),('K0329',5),('K0331',6),('U0106',7),('K0328',8),('K0335',9)) k(kode,u)
left join ref_lab l on l.kode = k.kode;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select p.id, l.id, k.u from (select id from ref_lab_paket where kode='1908184') p,
(values ('K0326',1),('K0327',2),('K0335',3)) k(kode,u)
left join ref_lab l on l.kode = k.kode;
