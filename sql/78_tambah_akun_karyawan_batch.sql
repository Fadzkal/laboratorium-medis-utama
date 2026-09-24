-- ============================================================================
-- Migrasi 78: Batch Pembuatan Akun Karyawan / Staf Laboratorium
-- Laboratorium Medis Utama
-- ============================================================================
-- Daftar Karyawan yang Dibuatkan Akun (Peran: karyawan, Sandi Default: lab123456):
-- 1.  Anisah Nur Adinah            (anisah@labmedis.id)
-- 2.  Awit Priyanti                (awit@labmedis.id)
-- 3.  Aziz Budi Laksono            (aziz@labmedis.id)
-- 4.  Lilis Apriyanti              (lilis@labmedis.id)
-- 5.  Minto Rahaju                 (minto@labmedis.id)
-- 6.  Nabila Nadhifatul Jannah     (nabila@labmedis.id)
-- 7.  Nafis Salma Afiyah           (nafis@labmedis.id)
-- 8.  Ratna Ruby Mutiarin          (ratna@labmedis.id)
-- 9.  Retno Dwijayanti             (retno@labmedis.id)
-- 10. Salsa Billa Luthfi Ramadhany (salsa@labmedis.id)
-- 11. Siti Aminatul Khasanah       (siti.aminatul@labmedis.id)
-- 12. Yana Jumhana                 (yana@labmedis.id)
-- 13. Ma'rifah Nurul Ilmiatun      (marifah@labmedis.id)
-- 14. Aisyah Nur Hidayah           (aisyah@labmedis.id)
--
-- Catatan: Ibu Dede Kurniasih dikecualikan karena sudah memiliki akun sebagai Master.
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_uid uuid;
BEGIN
  -- Pastikan ekstensi pgcrypto tersedia untuk hashing password
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

  -- Pastikan enum peran_pegawai memiliki nilai 'karyawan'
  ALTER TYPE public.peran_pegawai ADD VALUE IF NOT EXISTS 'karyawan';

  FOR r IN SELECT * FROM (VALUES
    ('Anisah Nur Adinah',            'anisah@labmedis.id',        'lab123456', 'karyawan'::public.peran_pegawai),
    ('Awit Priyanti',                'awit@labmedis.id',          'lab123456', 'karyawan'::public.peran_pegawai),
    ('Aziz Budi Laksono',            'aziz@labmedis.id',          'lab123456', 'karyawan'::public.peran_pegawai),
    ('Lilis Apriyanti',              'lilis@labmedis.id',         'lab123456', 'karyawan'::public.peran_pegawai),
    ('Minto Rahaju',                 'minto@labmedis.id',         'lab123456', 'karyawan'::public.peran_pegawai),
    ('Nabila Nadhifatul Jannah',     'nabila@labmedis.id',        'lab123456', 'karyawan'::public.peran_pegawai),
    ('Nafis Salma Afiyah',           'nafis@labmedis.id',         'lab123456', 'karyawan'::public.peran_pegawai),
    ('Ratna Ruby Mutiarin',          'ratna@labmedis.id',         'lab123456', 'karyawan'::public.peran_pegawai),
    ('Retno Dwijayanti',             'retno@labmedis.id',         'lab123456', 'karyawan'::public.peran_pegawai),
    ('Salsa Billa Luthfi Ramadhany', 'salsa@labmedis.id',         'lab123456', 'karyawan'::public.peran_pegawai),
    ('Siti Aminatul Khasanah',       'siti.aminatul@labmedis.id', 'lab123456', 'karyawan'::public.peran_pegawai),
    ('Yana Jumhana',                 'yana@labmedis.id',          'lab123456', 'karyawan'::public.peran_pegawai),
    ('Ma''rifah Nurul Ilmiatun',     'marifah@labmedis.id',       'lab123456', 'karyawan'::public.peran_pegawai),
    ('Aisyah Nur Hidayah',           'aisyah@labmedis.id',        'lab123456', 'karyawan'::public.peran_pegawai)
  ) AS t(nama, email, pass, peran)
  LOOP
    -- Cek apakah email sudah terdaftar di auth.users
    SELECT id INTO v_uid FROM auth.users WHERE email = lower(trim(r.email));

    IF v_uid IS NULL THEN
      -- Buat akun baru di auth.users
      v_uid := gen_random_uuid();
      
      INSERT INTO auth.users (
        id,
        instance_id,
        role,
        aud,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        raw_app_meta_data,
        created_at,
        updated_at
      ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        lower(trim(r.email)),
        extensions.crypt(r.pass, extensions.gen_salt('bf')),
        now(),
        jsonb_build_object('nama', trim(r.nama), 'peran', r.peran),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        now(),
        now()
      );

      -- Daftarkan identitas email di auth.identities
      BEGIN
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          v_uid::text,
          v_uid,
          jsonb_build_object('sub', v_uid::text, 'email', lower(trim(r.email))),
          'email',
          v_uid::text,
          now(),
          now(),
          now()
        );
      EXCEPTION WHEN OTHERS THEN
        BEGIN
          INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
          ) VALUES (
            v_uid,
            v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', lower(trim(r.email))),
            'email',
            now(),
            now(),
            now()
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END;

      -- Tambahkan ke tabel publik pegawai
      INSERT INTO public.pegawai (id, nama, peran, aktif)
      VALUES (v_uid, trim(r.nama), r.peran, true)
      ON CONFLICT (id) DO UPDATE SET
        nama = trim(r.nama),
        peran = r.peran,
        aktif = true;

    ELSE
      -- Jika akun sudah ada, perbarui nama, peran, aktifkan, dan reset password
      UPDATE auth.users
         SET encrypted_password = extensions.crypt(r.pass, extensions.gen_salt('bf')),
             raw_user_meta_data = jsonb_build_object('nama', trim(r.nama), 'peran', r.peran),
             updated_at = now()
       WHERE id = v_uid;

      INSERT INTO public.pegawai (id, nama, peran, aktif)
      VALUES (v_uid, trim(r.nama), r.peran, true)
      ON CONFLICT (id) DO UPDATE SET
        nama = trim(r.nama),
        peran = r.peran,
        aktif = true;
    END IF;

  END LOOP;
END $$;

-- Verifikasi hasil pembuatan akun karyawan
SELECT p.id, p.nama, u.email, p.peran, p.aktif, u.created_at
  FROM public.pegawai p
  JOIN auth.users u ON u.id = p.id
 WHERE u.email LIKE '%@labmedis.id'
 ORDER BY p.nama ASC;
