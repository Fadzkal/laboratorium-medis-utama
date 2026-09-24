-- ============================================================================
-- Migrasi 79: Sinkronisasi Email & Fitur Ubah Profil Mandiri + Admin Edit Akun
-- Laboratorium Medis Utama
-- ============================================================================
-- 1. Menambahkan kolom email pada public.pegawai dan sinkronisasi data dari auth.users
-- 2. Fungsi 'ubah_profil_saya' (Bisa digunakan oleh Master dan Karyawan untuk ubah nama, email, sandi sendiri)
-- 3. Fungsi 'admin_ubah_pengguna' (Khusus Master untuk mengubah nama, email, dan sandi pengguna/karyawan)
-- ============================================================================

-- 1. Tambah kolom email pada public.pegawai jika belum ada
ALTER TABLE IF EXISTS public.pegawai 
  ADD COLUMN IF NOT EXISTS email text;

-- Sinkronkan email yang ada saat ini dari tabel auth.users
UPDATE public.pegawai p
   SET email = lower(trim(u.email))
  FROM auth.users u
 WHERE p.id = u.id
   AND (p.email IS NULL OR p.email != lower(trim(u.email)));

-- Buat trigger sinkronisasi otomatis email saat auth.users berubah
CREATE OR REPLACE FUNCTION public.sync_pegawai_email_trigger()
RETURNS trigger AS $$
BEGIN
  UPDATE public.pegawai
     SET email = lower(trim(NEW.email))
   WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_pegawai_email ON auth.users;
CREATE TRIGGER trg_sync_pegawai_email
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_pegawai_email_trigger();


-- ============================================================================
-- 2. FUNGSI: ubah_profil_saya
-- Dipanggil oleh pengguna yang sedang login (Master / Karyawan / Staf)
-- untuk mengubah Nama, Email Login, dan Kata Sandi akunnya sendiri.
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

  -- Pastikan email tidak digunakan oleh akun pengguna lain
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email AND id != v_uid) THEN
    RAISE EXCEPTION 'Email % sudah digunakan oleh akun lain.', v_email;
  END IF;

  -- Perbarui data di auth.users (dan password jika diisi)
  IF p_password_baru IS NOT NULL AND length(trim(p_password_baru)) > 0 THEN
    IF length(trim(p_password_baru)) < 6 THEN
      RAISE EXCEPTION 'Kata sandi baru minimal 6 karakter.';
    END IF;

    UPDATE auth.users
       SET email = v_email,
           encrypted_password = extensions.crypt(trim(p_password_baru), extensions.gen_salt('bf')),
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_uid;
  ELSE
    UPDATE auth.users
       SET email = v_email,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_uid;
  END IF;

  -- Perbarui identitas email di auth.identities
  UPDATE auth.identities
     SET identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
         updated_at = now()
   WHERE user_id = v_uid;

  -- Perbarui data profil di public.pegawai
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


-- ============================================================================
-- 3. FUNGSI: admin_ubah_pengguna
-- Khusus dipanggil oleh peran 'master' untuk mengubah Nama, Email Login,
-- atau Reset Password karyawan/staf dari tabel Pengguna Sistem.
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
  v_email text := lower(trim(p_email));
  v_nama text := trim(p_nama);
BEGIN
  -- Keamanan ketat: hanya peran master yang boleh mengubah akun pengguna lain
  IF public.peran_saya() != 'master' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya peran master yang dapat mengubah data kredensial pengguna.';
  END IF;

  IF length(v_nama) < 2 THEN
    RAISE EXCEPTION 'Nama lengkap minimal 2 karakter.';
  END IF;

  IF v_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Format email tidak valid.';
  END IF;

  -- Pastikan email tidak bentrok dengan akun lain
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
           updated_at = now()
     WHERE id = p_id;
  ELSE
    UPDATE auth.users
       SET email = v_email,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', v_nama),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = p_id;
  END IF;

  UPDATE auth.identities
     SET identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
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
