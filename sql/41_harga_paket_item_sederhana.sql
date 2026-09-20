UPDATE ref_lab_paket_item SET harga = 90000 WHERE paket_id = (SELECT id FROM ref_lab_paket WHERE kode = '1908186') AND lab_id = (SELECT id FROM ref_lab WHERE kode = 'H0102');
UPDATE ref_lab_paket_item SET harga = 60000 WHERE paket_id = (SELECT id FROM ref_lab_paket WHERE kode = '1908186') AND lab_id = (SELECT id FROM ref_lab WHERE kode = 'K0301');
UPDATE ref_lab_paket_item SET harga = 65000 WHERE paket_id = (SELECT id FROM ref_lab_paket WHERE kode = '1908186') AND lab_id = (SELECT id FROM ref_lab WHERE kode = 'K0304');
UPDATE ref_lab_paket_item SET harga = 30000 WHERE paket_id = (SELECT id FROM ref_lab_paket WHERE kode = '1908186') AND lab_id = (SELECT id FROM ref_lab WHERE kode = 'K0328');
UPDATE ref_lab_paket_item SET harga = 55000 WHERE paket_id = (SELECT id FROM ref_lab_paket WHERE kode = '1908186') AND lab_id = (SELECT id FROM ref_lab WHERE kode = 'K0332');
