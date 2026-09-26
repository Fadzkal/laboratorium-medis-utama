-- ============================================================================
-- Migrasi 87: Penambahan Role 'developer' & Akun IT MEDIS UTAMA
-- Laboratorium Medis Utama
-- ============================================================================
-- 1. Menambahkan nilai 'developer' ke enum peran_pegawai.
-- 2. Mendaftarkan akun khusus 'IT MEDIS UTAMA' dengan role developer.
-- 3. Memastikan akun Ibu Dede Kurniasih tetap berstatus role 'master' dengan nama resmi DEDE KURNIASIH.
-- 4. Memberikan hak akses penuh (Superadmin / Bypass) untuk role developer di RLS.
-- ============================================================================

-- 1. Tambahkan nilai enum 'developer' pada peran_pegawai jika belum ada
ALTER TYPE public.peran_pegawai ADD VALUE IF NOT EXISTS 'developer';

-- 2. Pastikan ekstensi pgcrypto aktif
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 3. Update / Pastikan Akun Pimpinan (Ibu Dede Kurniasih) tetap Master
UPDATE public.pegawai
   SET nama = 'DEDE KURNIASIH',
       peran = 'master'::public.peran_pegawai
 WHERE peran = 'master' OR lower(nama) LIKE '%dede%';

-- 4. Pendaftaran Akun Khusus Pengembang: IT MEDIS UTAMA
DO $$
DECLARE
  v_uid uuid := 'a0000000-0000-0000-0000-000000000087'::uuid;
  v_email text := 'itmedisutama@labutama.id';
  v_username text := 'itmedisutama';
  v_nama text := 'IT MEDIS UTAMA';
  v_pass text := 'itmedisutama123';
  v_existing_id uuid;
BEGIN
  -- Cek apakah akun auth sudah ada berdasarkan email
  SELECT id INTO v_existing_id FROM auth.users WHERE lower(trim(email)) = v_email;

  IF v_existing_id IS NOT NULL THEN
    v_uid := v_existing_id;
    -- Perbarui sandi dan metadata akun yang sudah ada
    UPDATE auth.users
       SET encrypted_password = extensions.crypt(v_pass, extensions.gen_salt('bf')),
           raw_user_meta_data = jsonb_build_object('nama', v_nama, 'peran', 'developer', 'username', v_username),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           confirmation_token = '',
           recovery_token = '',
           email_change_token_new = '',
           email_change_token_current = '',
           email_change = '',
           updated_at = now()
     WHERE id = v_uid;
  ELSE
    -- Buat akun baru di auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change_token_current,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_uid,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_pass, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('nama', v_nama, 'peran', 'developer', 'username', v_username),
      now(),
      now(),
      '',
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Pastikan identitas di auth.identities
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_uid) THEN
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
      v_uid,
      v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email),
      'email',
      v_uid::text,
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.identities
       SET identity_data = jsonb_build_object('sub', v_uid::text, 'email', v_email),
           updated_at = now()
     WHERE user_id = v_uid;
  END IF;

  -- Sinkronkan ke tabel public.pegawai
  INSERT INTO public.pegawai (
    id,
    nama,
    email,
    username,
    peran,
    aktif,
    created_at,
    updated_at
  ) VALUES (
    v_uid,
    v_nama,
    v_email,
    v_username,
    'developer'::public.peran_pegawai,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET nama = EXCLUDED.nama,
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        peran = 'developer'::public.peran_pegawai,
        aktif = true,
        updated_at = now();

  -- Pastikan username tidak duplikat jika menggunakan baris lama
  UPDATE public.pegawai
     SET username = v_username,
         peran = 'developer'::public.peran_pegawai,
         aktif = true
   WHERE id = v_uid;
END $$;

-- 5. Perbarui fungsi pengecekan hak akses di database (Bypass untuk master dan developer)
CREATE OR REPLACE FUNCTION public.hak_akses_cek(p_kode text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT public.peran_saya() IN ('master', 'developer')
      OR (public.peran_saya() = 'karyawan' AND p_kode NOT IN ('menu_hris', 'hris_kelola', 'master', 'hak_akses'))
      OR EXISTS (
         SELECT 1 FROM public.hak_akses_peran
         WHERE kode = p_kode AND peran = public.peran_saya() AND diizinkan
      );
$$;

GRANT EXECUTE ON FUNCTION public.hak_akses_cek(text) TO authenticated;

-- 6. Dukung role 'developer' pada helper tambah dan ubah pengguna
CREATE OR REPLACE FUNCTION public.admin_ubah_pengguna(
  p_id uuid,
  p_nama text,
  p_email text,
  p_password_baru text default null,
  p_username text default null
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_nama text := trim(p_nama);
  v_email text := lower(trim(p_email));
  v_username text := lower(trim(coalesce(p_username, '')));
BEGIN
  IF public.peran_saya() NOT IN ('master', 'developer') THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya peran master atau developer yang dapat mengubah data kredensial pengguna.';
  END IF;

  IF length(v_nama) < 2 THEN
    RAISE EXCEPTION 'Nama lengkap minimal 2 karakter.';
  END IF;

  -- Tangani email
  IF v_email NOT LIKE '%@%.%' THEN
    IF length(v_email) > 0 THEN
      IF length(v_username) = 0 THEN
        v_username := v_email;
      END IF;
      v_email := v_email || '@labutama.id';
    ELSE
      IF length(v_username) > 0 THEN
        v_email := v_username || '@labutama.id';
      ELSE
        RAISE EXCEPTION 'Email atau username wajib diisi.';
      END IF;
    END IF;
  END IF;

  -- Tangani username
  IF length(v_username) = 0 THEN
    v_username := split_part(v_email, '@', 1);
  END IF;
  v_username := replace(v_username, ' ', '');

  -- Validasi bentrok email di auth.users
  IF EXISTS (
    SELECT 1 FROM auth.users 
     WHERE email = v_email AND id != p_id
  ) THEN
    RAISE EXCEPTION 'Email "%" sudah digunakan oleh akun lain.', v_email;
  END IF;

  -- Validasi bentrok username di tabel pegawai
  IF EXISTS (
    SELECT 1 FROM public.pegawai
     WHERE lower(trim(username)) = v_username AND id != p_id
  ) THEN
    RAISE EXCEPTION 'Username "%" sudah digunakan oleh staf lain.', v_username;
  END IF;

  -- Perbarui auth.users
  IF p_password_baru IS NOT NULL AND length(trim(p_password_baru)) > 0 THEN
    IF length(trim(p_password_baru)) < 6 THEN
      RAISE EXCEPTION 'Kata sandi minimal 6 karakter.';
    END IF;

    UPDATE auth.users
       SET email = v_email,
           encrypted_password = extensions.crypt(trim(p_password_baru), extensions.gen_salt('bf')),
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama, 'username', v_username),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           confirmation_token = '',
           recovery_token = '',
           email_change_token_new = '',
           email_change_token_current = '',
           email_change = '',
           updated_at = now()
     WHERE id = p_id;
  ELSE
    UPDATE auth.users
       SET email = v_email,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama, 'username', v_username),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           confirmation_token = '',
           recovery_token = '',
           email_change_token_new = '',
           email_change_token_current = '',
           email_change = '',
           updated_at = now()
     WHERE id = p_id;
  END IF;

  UPDATE auth.identities
     SET identity_data = jsonb_build_object('sub', p_id::text, 'email', v_email),
         provider_id = p_id::text,
         updated_at = now()
   WHERE user_id = p_id;

  UPDATE public.pegawai
     SET nama = v_nama,
         email = v_email,
         username = v_username,
         updated_at = now()
   WHERE id = p_id;

  RETURN jsonb_build_object(
    'sukses', true,
    'id', p_id,
    'nama', v_nama,
    'username', v_username,
    'email', v_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_ubah_pengguna(uuid, text, text, text, text) TO authenticated;
