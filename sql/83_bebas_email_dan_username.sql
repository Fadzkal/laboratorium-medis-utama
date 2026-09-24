-- ============================================================================
-- Migrasi 83: Pemisahan Jelas & Kebebasan Penggunaan Email & Username
-- Laboratorium Medis Utama
-- ============================================================================
-- 1. Pengguna BISA login pakai EMAIL asli (misal: dedekurniasih@labutama.id atau dokter@gmail.com)
-- 2. Pengguna BISA JUGA login pakai USERNAME (misal: dedekurniasih atau kasir1)
-- 3. Akun memiliki kolom 'username' dan 'email' tersendiri
-- 4. Pengguna dan Admin bebas mengatur email maupun username masing-masing
-- ============================================================================

-- Pastikan indeks unik untuk username (tidak boleh ada 2 pengguna dengan username yang sama)
DROP INDEX IF EXISTS idx_pegawai_username_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pegawai_username_unique 
  ON public.pegawai (lower(trim(username))) 
 WHERE username IS NOT NULL AND username != '';

-- ============================================================================
-- 1. FUNGSI: ambil_email_login
-- Menerjemahkan input saat login ke email autentikasi:
-- - Jika input berupa email (ada '@'): langsung gunakan email tersebut
-- - Jika input berupa username (tanpa '@'): cari email akun berdasarkan username
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ambil_email_login(p_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id text := lower(trim(p_identifier));
  v_email text;
BEGIN
  IF v_id IS NULL OR length(v_id) = 0 THEN
    RETURN NULL;
  END IF;

  -- 1. Jika pengguna mengetik email langsung (mengandung tanda @)
  IF v_id LIKE '%@%' THEN
    -- Cari apakah ada di pegawai.email
    SELECT email INTO v_email
      FROM public.pegawai
     WHERE lower(trim(email)) = v_id
     ORDER BY aktif DESC, created_at DESC
     LIMIT 1;

    IF v_email IS NOT NULL AND v_email LIKE '%@%' THEN
      RETURN v_email;
    END IF;

    -- Kembalikan email aslinya jika tidak ditemukan di pegawai (misal akun auth baru)
    RETURN v_id;
  END IF;

  -- 2. Jika pengguna mengetik username (tanpa tanda @):
  -- Prioritas A: Cari berdasarkan kolom username di tabel pegawai
  SELECT email INTO v_email
    FROM public.pegawai
   WHERE lower(trim(username)) = v_id
   ORDER BY aktif DESC, created_at DESC
   LIMIT 1;

  IF v_email IS NOT NULL AND v_email LIKE '%@%' THEN
    RETURN v_email;
  END IF;

  -- Prioritas B: Cari jika username sama dengan awalan email sebelum tanda @
  SELECT email INTO v_email
    FROM public.pegawai
   WHERE lower(trim(split_part(email, '@', 1))) = v_id
   ORDER BY aktif DESC, created_at DESC
   LIMIT 1;

  IF v_email IS NOT NULL AND v_email LIKE '%@%' THEN
    RETURN v_email;
  END IF;

  -- Fallback default domain internal
  RETURN v_id || '@labutama.id';
END;
$$;

GRANT EXECUTE ON FUNCTION public.ambil_email_login(text) TO anon, authenticated;


-- ============================================================================
-- 2. FUNGSI: ubah_profil_saya (Dukung Nama, Email, Password, dan Username)
-- ============================================================================
DROP FUNCTION IF EXISTS public.ubah_profil_saya(text, text, text);
DROP FUNCTION IF EXISTS public.ubah_profil_saya(text, text, text, text);

CREATE OR REPLACE FUNCTION public.ubah_profil_saya(
  p_nama text,
  p_email text,
  p_password_baru text default null,
  p_username text default null
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_nama text := trim(p_nama);
  v_email text := lower(trim(p_email));
  v_username text := lower(trim(coalesce(p_username, '')));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Anda harus login terlebih dahulu.';
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
     WHERE email = v_email AND id != v_uid
  ) THEN
    RAISE EXCEPTION 'Email "%" sudah digunakan oleh akun lain.', v_email;
  END IF;

  -- Validasi bentrok username di tabel pegawai
  IF EXISTS (
    SELECT 1 FROM public.pegawai
     WHERE lower(trim(username)) = v_username AND id != v_uid
  ) THEN
    RAISE EXCEPTION 'Username "%" sudah digunakan oleh staf lain.', v_username;
  END IF;

  -- Perbarui auth.users (dan password jika diisi)
  IF p_password_baru IS NOT NULL AND length(trim(p_password_baru)) > 0 THEN
    IF length(trim(p_password_baru)) < 6 THEN
      RAISE EXCEPTION 'Kata sandi baru minimal 6 karakter.';
    END IF;

    UPDATE auth.users
       SET email = v_email,
           encrypted_password = extensions.crypt(trim(p_password_baru), extensions.gen_salt('bf')),
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama, 'username', v_username),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           confirmation_token = coalesce(confirmation_token, ''),
           recovery_token = coalesce(recovery_token, ''),
           email_change_token_new = coalesce(email_change_token_new, ''),
           email_change_token_current = coalesce(email_change_token_current, ''),
           email_change = coalesce(email_change, ''),
           updated_at = now()
     WHERE id = v_uid;
  ELSE
    UPDATE auth.users
       SET email = v_email,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama, 'username', v_username),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           confirmation_token = coalesce(confirmation_token, ''),
           recovery_token = coalesce(recovery_token, ''),
           email_change_token_new = coalesce(email_change_token_new, ''),
           email_change_token_current = coalesce(email_change_token_current, ''),
           email_change = coalesce(email_change, ''),
           updated_at = now()
     WHERE id = v_uid;
  END IF;

  -- Perbarui identitas email di auth.identities
  UPDATE auth.identities
     SET identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
         provider_id = v_uid::text,
         updated_at = now()
   WHERE user_id = v_uid;

  -- Perbarui data profil di public.pegawai
  UPDATE public.pegawai
     SET nama = v_nama,
         email = v_email,
         username = v_username,
         updated_at = now()
   WHERE id = v_uid;

  RETURN jsonb_build_object(
    'sukses', true,
    'id', v_uid,
    'nama', v_nama,
    'username', v_username,
    'email', v_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ubah_profil_saya(text, text, text, text) TO authenticated;


-- ============================================================================
-- 3. FUNGSI: admin_ubah_pengguna (Dukung Nama, Email, Password, dan Username)
-- ============================================================================
DROP FUNCTION IF EXISTS public.admin_ubah_pengguna(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.admin_ubah_pengguna(uuid, text, text, text, text);

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
  IF public.peran_saya() != 'master' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya peran master yang dapat mengubah data kredensial pengguna.';
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
           confirmation_token = coalesce(confirmation_token, ''),
           recovery_token = coalesce(recovery_token, ''),
           email_change_token_new = coalesce(email_change_token_new, ''),
           email_change_token_current = coalesce(email_change_token_current, ''),
           email_change = coalesce(email_change, ''),
           updated_at = now()
     WHERE id = p_id;
  ELSE
    UPDATE auth.users
       SET email = v_email,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama, 'username', v_username),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           confirmation_token = coalesce(confirmation_token, ''),
           recovery_token = coalesce(recovery_token, ''),
           email_change_token_new = coalesce(email_change_token_new, ''),
           email_change_token_current = coalesce(email_change_token_current, ''),
           email_change = coalesce(email_change, ''),
           updated_at = now()
     WHERE id = p_id;
  END IF;

  -- Perbarui auth.identities
  UPDATE auth.identities
     SET identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
         provider_id = p_id::text,
         updated_at = now()
   WHERE user_id = p_id;

  -- Perbarui public.pegawai
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


-- ============================================================================
-- 4. FUNGSI: tambah_pengguna_langsung (Dukung Nama, Email, Password, Username)
-- ============================================================================
DROP FUNCTION IF EXISTS public.tambah_pengguna_langsung(text, text, text, public.peran_pegawai, text, text);
DROP FUNCTION IF EXISTS public.tambah_pengguna_langsung(text, text, text, public.peran_pegawai, text, text, text);

CREATE OR REPLACE FUNCTION public.tambah_pengguna_langsung(
  p_nama text,
  p_email text,
  p_password text,
  p_peran public.peran_pegawai default 'karyawan',
  p_jenis_dokter text default null,
  p_no_sip text default null,
  p_username text default null
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
  v_username text := lower(trim(coalesce(p_username, '')));
BEGIN
  IF public.peran_saya() != 'master' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya peran master yang dapat menambah pengguna.';
  END IF;

  IF length(p_password) < 6 THEN
    RAISE EXCEPTION 'Kata sandi minimal 6 karakter.';
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
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'Email "%" sudah terdaftar di sistem.', v_email;
  END IF;

  -- Validasi bentrok username di tabel pegawai
  IF EXISTS (SELECT 1 FROM public.pegawai WHERE lower(trim(username)) = v_username) THEN
    RAISE EXCEPTION 'Username "%" sudah digunakan oleh staf lain.', v_username;
  END IF;

  INSERT INTO auth.users (
    id,
    instance_id,
    role,
    aud,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change
  ) VALUES (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('nama', p_nama, 'peran', p_peran::text, 'username', v_username),
    now(),
    now(),
    '', '', '', '', ''
  );

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
    gen_random_uuid(),
    v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', v_email),
    'email',
    v_uid::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.pegawai (
    id,
    nama,
    peran,
    jenis_dokter,
    no_sip,
    aktif,
    email,
    username,
    created_at,
    updated_at
  ) VALUES (
    v_uid,
    p_nama,
    p_peran,
    p_jenis_dokter,
    p_no_sip,
    true,
    v_email,
    v_username,
    now(),
    now()
  );

  RETURN v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.tambah_pengguna_langsung(text, text, text, public.peran_pegawai, text, text, text) TO authenticated;
