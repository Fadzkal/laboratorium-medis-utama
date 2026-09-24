-- ============================================================================
-- Migrasi 81: Ubah Seluruh Domain Email Menjadi @labutama.id
-- Laboratorium Medis Utama
-- ============================================================================

-- 1. Perbarui tabel auth.users
UPDATE auth.users
   SET email = replace(email, '@labmedis.id', '@labutama.id'),
       updated_at = now()
 WHERE email LIKE '%@labmedis.id';

-- 2. Perbarui tabel auth.identities
UPDATE auth.identities
   SET identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(replace(coalesce(identity_data->>'email', ''), '@labmedis.id', '@labutama.id'))),
       updated_at = now()
 WHERE coalesce(identity_data->>'email', '') LIKE '%@labmedis.id';

-- 3. Perbarui tabel public.pegawai
UPDATE public.pegawai
   SET email = replace(email, '@labmedis.id', '@labutama.id'),
       updated_at = now()
 WHERE email LIKE '%@labmedis.id';

-- Tampilkan hasil verifikasi daftar akun dan email barunya
SELECT p.id, p.nama, p.email AS email_pegawai, u.email AS email_auth, p.peran, p.aktif
  FROM public.pegawai p
  LEFT JOIN auth.users u ON u.id = p.id
 WHERE p.email LIKE '%@labutama.id'
 ORDER BY p.peran DESC, p.nama ASC;
