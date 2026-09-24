-- ============================================================================
-- Migrasi 80: Perbaikan Skema & Identitas Auth GoTrue Supabase (Revisi)
-- Laboratorium Medis Utama
-- ============================================================================

-- 1. Hapus trigger pada tabel auth.users
DROP TRIGGER IF EXISTS trg_sync_pegawai_email ON auth.users;
DROP FUNCTION IF EXISTS public.sync_pegawai_email_trigger();

-- 2. Pastikan kolom string token di auth.users bernilai '' (string kosong)
-- Catatan: phone tidak boleh diubah jadi '' karena ada UNIQUE constraint
UPDATE auth.users
   SET confirmation_token = COALESCE(confirmation_token, ''),
       recovery_token = COALESCE(recovery_token, ''),
       email_change_token_new = COALESCE(email_change_token_new, ''),
       email_change_token_current = COALESCE(email_change_token_current, ''),
       email_change = COALESCE(email_change, ''),
       phone_change = COALESCE(phone_change, ''),
       phone_change_token = COALESCE(phone_change_token, ''),
       reauthentication_token = COALESCE(reauthentication_token, '')
 WHERE confirmation_token IS NULL
    OR recovery_token IS NULL
    OR email_change_token_new IS NULL
    OR email_change_token_current IS NULL
    OR email_change IS NULL;

-- 3. Kembalikan phone yang kosong menjadi NULL agar tidak melanggar unique constraint
UPDATE auth.users
   SET phone = NULL
 WHERE phone = '';

-- 4. Perbaiki auth.identities: pastikan provider_id terisi
UPDATE auth.identities
   SET provider_id = COALESCE(NULLIF(provider_id, ''), user_id::text),
       identity_data = jsonb_build_object('sub', user_id::text, 'email', lower(trim(u.email)))
  FROM auth.users u
 WHERE auth.identities.user_id = u.id
   AND (auth.identities.provider_id IS NULL OR auth.identities.provider_id = '');

-- 5. Masukkan ke auth.identities untuk user yang belum memiliki identitas (id bertipe uuid)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', lower(trim(u.email))),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);

-- 6. Ubah semua domain email dari @labmedis.id menjadi @labutama.id
UPDATE auth.users
   SET email = replace(email, '@labmedis.id', '@labutama.id'),
       updated_at = now()
 WHERE email LIKE '%@labmedis.id';

UPDATE auth.identities
   SET identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(replace(coalesce(identity_data->>'email', ''), '@labmedis.id', '@labutama.id'))),
       updated_at = now()
 WHERE coalesce(identity_data->>'email', '') LIKE '%@labmedis.id';

UPDATE public.pegawai
   SET email = replace(email, '@labmedis.id', '@labutama.id'),
       updated_at = now()
 WHERE email LIKE '%@labmedis.id';

-- 6. Fungsi ubah_profil_saya (Versi aman untuk GoTrue)
CREATE OR REPLACE FUNCTION public.ubah_profil_saya(
  p_nama text,
  p_email text,
  p_password_baru text default null
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(trim(p_email));
  v_nama text := trim(p_nama);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Anda harus login terlebih dahulu.';
  END IF;

  IF length(v_nama) < 2 THEN
    RAISE EXCEPTION 'Nama lengkap minimal 2 karakter.';
  END IF;

  IF v_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Format email tidak valid.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email AND id != v_uid) THEN
    RAISE EXCEPTION 'Email % sudah digunakan oleh akun lain.', v_email;
  END IF;

  IF p_password_baru IS NOT NULL AND length(trim(p_password_baru)) > 0 THEN
    IF length(trim(p_password_baru)) < 6 THEN
      RAISE EXCEPTION 'Kata sandi baru minimal 6 karakter.';
    END IF;

    UPDATE auth.users
       SET email = v_email,
           encrypted_password = extensions.crypt(trim(p_password_baru), extensions.gen_salt('bf')),
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama),
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
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           confirmation_token = coalesce(confirmation_token, ''),
           recovery_token = coalesce(recovery_token, ''),
           email_change_token_new = coalesce(email_change_token_new, ''),
           email_change_token_current = coalesce(email_change_token_current, ''),
           email_change = coalesce(email_change, ''),
           updated_at = now()
     WHERE id = v_uid;
  END IF;

  UPDATE auth.identities
     SET identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
         provider_id = v_uid::text,
         updated_at = now()
   WHERE user_id = v_uid;

  UPDATE public.pegawai
     SET nama = v_nama,
         email = v_email,
         updated_at = now()
   WHERE id = v_uid;

  RETURN jsonb_build_object(
    'sukses', true,
    'id', v_uid,
    'nama', v_nama,
    'email', v_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ubah_profil_saya(text, text, text) TO authenticated;

-- 7. Fungsi admin_ubah_pengguna (Versi aman untuk GoTrue)
CREATE OR REPLACE FUNCTION public.admin_ubah_pengguna(
  p_id uuid,
  p_nama text,
  p_email text,
  p_password_baru text default null
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_nama text := trim(p_nama);
BEGIN
  IF public.peran_saya() != 'master' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya peran master yang dapat mengubah data kredensial pengguna.';
  END IF;

  IF length(v_nama) < 2 THEN
    RAISE EXCEPTION 'Nama lengkap minimal 2 karakter.';
  END IF;

  IF v_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Format email tidak valid.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email AND id != p_id) THEN
    RAISE EXCEPTION 'Email % sudah digunakan oleh akun lain.', v_email;
  END IF;

  IF p_password_baru IS NOT NULL AND length(trim(p_password_baru)) > 0 THEN
    IF length(trim(p_password_baru)) < 6 THEN
      RAISE EXCEPTION 'Kata sandi minimal 6 karakter.';
    END IF;

    UPDATE auth.users
       SET email = v_email,
           encrypted_password = extensions.crypt(trim(p_password_baru), extensions.gen_salt('bf')),
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama),
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
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama),
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
         updated_at = now()
   WHERE id = p_id;

  RETURN jsonb_build_object(
    'sukses', true,
    'id', p_id,
    'nama', v_nama,
    'email', v_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_ubah_pengguna(uuid, text, text, text) TO authenticated;
