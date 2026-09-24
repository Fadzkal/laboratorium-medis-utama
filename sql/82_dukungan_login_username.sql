-- ============================================================================
-- Migrasi 82: Dukungan Penuh Login Menggunakan Username atau Email
-- Laboratorium Medis Utama
-- ============================================================================
-- 1. Tambah kolom 'username' di public.pegawai (otomatis diisi dari awalan email)
-- 2. Fungsi 'ambil_email_login' untuk mencari email autentikasi dari inputan username
-- 3. Pembaruan fungsi 'ubah_profil_saya' (menerima username atau email)
-- 4. Pembaruan fungsi 'admin_ubah_pengguna' (menerima username atau email)
-- 5. Pembaruan fungsi 'tambah_pengguna_langsung' (menerima username atau email)
-- ============================================================================

-- 1. Tambah kolom username pada public.pegawai jika belum ada
ALTER TABLE IF EXISTS public.pegawai 
  ADD COLUMN IF NOT EXISTS username text;

-- Isi kolom username dari awalan email yang sudah ada
UPDATE public.pegawai
   SET username = lower(trim(split_part(email, '@', 1)))
 WHERE (username IS NULL OR username = '') 
   AND email IS NOT NULL;

-- Indeks pencarian cepat username & email
CREATE INDEX IF NOT EXISTS idx_pegawai_username_lower ON public.pegawai (lower(trim(username)));
CREATE INDEX IF NOT EXISTS idx_pegawai_email_lower ON public.pegawai (lower(trim(email)));


-- ============================================================================
-- 2. FUNGSI: ambil_email_login
-- Dipanggil saat login di frontend jika pengguna memasukkan username tanpa '@'
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

  -- 1. Jika sudah ada tanda @, kembalikan langsung
  IF v_id LIKE '%@%' THEN
    RETURN v_id;
  END IF;

  -- 2. Cari berdasarkan kolom username di tabel pegawai
  SELECT email INTO v_email
    FROM public.pegawai
   WHERE lower(trim(username)) = v_id
   ORDER BY aktif DESC, created_at DESC
   LIMIT 1;

  IF v_email IS NOT NULL AND v_email LIKE '%@%' THEN
    RETURN v_email;
  END IF;

  -- 3. Cari berdasarkan awalan email sebelum tanda @
  SELECT email INTO v_email
    FROM public.pegawai
   WHERE lower(trim(split_part(email, '@', 1))) = v_id
   ORDER BY aktif DESC, created_at DESC
   LIMIT 1;

  IF v_email IS NOT NULL AND v_email LIKE '%@%' THEN
    RETURN v_email;
  END IF;

  -- 4. Fallback default: domain resmi sistem @labutama.id
  RETURN v_id || '@labutama.id';
END;
$$;

GRANT EXECUTE ON FUNCTION public.ambil_email_login(text) TO anon, authenticated;


-- ============================================================================
-- 3. FUNGSI: ubah_profil_saya (Mendukung Username atau Email)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ubah_profil_saya(
  p_nama text,
  p_email text,
  p_password_baru text default null
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_input text := lower(trim(p_email));
  v_nama text := trim(p_nama);
  v_email text;
  v_username text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Anda harus login terlebih dahulu.';
  END IF;

  IF length(v_nama) < 2 THEN
    RAISE EXCEPTION 'Nama lengkap minimal 2 karakter.';
  END IF;

  IF length(v_input) < 3 THEN
    RAISE EXCEPTION 'Username atau email minimal 3 karakter.';
  END IF;

  -- Tentukan format email & username
  IF v_input LIKE '%@%.%' THEN
    v_email := v_input;
    v_username := split_part(v_input, '@', 1);
  ELSE
    -- Jika input berupa username tanpa domain, gunakan domain internal @labutama.id
    v_username := replace(v_input, ' ', '');
    v_email := v_username || '@labutama.id';
  END IF;

  -- Pastikan username/email tidak bentrok dengan akun lain
  IF EXISTS (
    SELECT 1 FROM auth.users 
     WHERE (email = v_email OR lower(trim(split_part(email, '@', 1))) = v_username)
       AND id != v_uid
  ) THEN
    RAISE EXCEPTION 'Username atau email "%" sudah digunakan oleh akun lain.', v_input;
  END IF;

  -- Perbarui data di auth.users (dan password jika diisi)
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

GRANT EXECUTE ON FUNCTION public.ubah_profil_saya(text, text, text) TO authenticated;


-- ============================================================================
-- 4. FUNGSI: admin_ubah_pengguna (Mendukung Username atau Email)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_ubah_pengguna(
  p_id uuid,
  p_nama text,
  p_email text,
  p_password_baru text default null
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_input text := lower(trim(p_email));
  v_nama text := trim(p_nama);
  v_email text;
  v_username text;
BEGIN
  IF public.peran_saya() != 'master' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya peran master yang dapat mengubah data kredensial pengguna.';
  END IF;

  IF length(v_nama) < 2 THEN
    RAISE EXCEPTION 'Nama lengkap minimal 2 karakter.';
  END IF;

  IF length(v_input) < 3 THEN
    RAISE EXCEPTION 'Username atau email minimal 3 karakter.';
  END IF;

  IF v_input LIKE '%@%.%' THEN
    v_email := v_input;
    v_username := split_part(v_input, '@', 1);
  ELSE
    v_username := replace(v_input, ' ', '');
    v_email := v_username || '@labutama.id';
  END IF;

  IF EXISTS (
    SELECT 1 FROM auth.users 
     WHERE (email = v_email OR lower(trim(split_part(email, '@', 1))) = v_username)
       AND id != p_id
  ) THEN
    RAISE EXCEPTION 'Username atau email "%" sudah digunakan oleh akun lain.', v_input;
  END IF;

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

  UPDATE auth.identities
     SET identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
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

GRANT EXECUTE ON FUNCTION public.admin_ubah_pengguna(uuid, text, text, text) TO authenticated;


-- ============================================================================
-- 5. FUNGSI: tambah_pengguna_langsung (Mendukung Username atau Email)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.tambah_pengguna_langsung(
  p_nama text,
  p_email text,
  p_password text,
  p_peran public.peran_pegawai default 'karyawan',
  p_jenis_dokter text default null,
  p_no_sip text default null
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_input text := lower(trim(p_email));
  v_email text;
  v_username text;
BEGIN
  IF public.peran_saya() != 'master' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya peran master yang dapat menambah pengguna.';
  END IF;

  IF length(p_password) < 6 THEN
    RAISE EXCEPTION 'Kata sandi minimal 6 karakter.';
  END IF;

  IF length(v_input) < 3 THEN
    RAISE EXCEPTION 'Username atau email minimal 3 karakter.';
  END IF;

  IF v_input LIKE '%@%.%' THEN
    v_email := v_input;
    v_username := split_part(v_input, '@', 1);
  ELSE
    v_username := replace(v_input, ' ', '');
    v_email := v_username || '@labutama.id';
  END IF;

  IF EXISTS (
    SELECT 1 FROM auth.users 
     WHERE email = v_email OR lower(trim(split_part(email, '@', 1))) = v_username
  ) THEN
    RAISE EXCEPTION 'Username atau email "%" sudah terdaftar di sistem.', v_input;
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

GRANT EXECUTE ON FUNCTION public.tambah_pengguna_langsung(text, text, text, public.peran_pegawai, text, text) TO authenticated;
