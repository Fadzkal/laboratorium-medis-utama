DO $$ 
DECLARE 
  uid uuid;
  d record;
BEGIN
  FOR d IN SELECT * FROM (VALUES 
    ('Abdul Rahman A.Md Ft,S.Kes (Ft)'),
    ('Adly Nanda Sp.OG'),
    ('Apotek Sehati'),
    ('APS (Atas Permintaan Sendiri)'),
    ('Asrofi Abdilah S.Kep.,Ners'),
    ('BAKEUDA (Badan Keuangan Daerah)'),
    ('Balai Kesehatan Paru Masyarakat Banyumas'),
    ('Bank BRI Cab. Purbalingga'),
    ('Bank CIMB Niaga Cab. Purbalingga'),
    ('Bank Jateng Cab. Purbalingga'),
    ('Bd. Ari Rizki Widyaning Tyas, Amd. Keb.')
  ) AS t(nama)
  LOOP
    uid := gen_random_uuid();
    
    -- Insert only into Supabase Auth. 
    -- The trigger `trg_auth_user_baru` will AUTOMATICALLY create the `pegawai` row
    -- reading the `nama` and `peran` from `raw_user_meta_data`!
    INSERT INTO auth.users (
      id, instance_id, role, aud, created_at, updated_at, encrypted_password, email, raw_user_meta_data
    ) VALUES (
      uid, 
      '00000000-0000-0000-0000-000000000000', 
      'authenticated', 
      'authenticated', 
      now(), 
      now(), 
      '',
      replace(lower(d.nama), ' ', '_') || '@dummy.local',
      jsonb_build_object('nama', d.nama, 'peran', 'dokter')
    );
    
  END LOOP;
END $$;
