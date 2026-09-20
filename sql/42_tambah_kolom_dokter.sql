-- 1. Tambah kolom baru di tabel pegawai
ALTER TABLE pegawai
  ADD COLUMN IF NOT EXISTS alamat text,
  ADD COLUMN IF NOT EXISTS telepon text,
  ADD COLUMN IF NOT EXISTS kode_detailer text,
  ADD COLUMN IF NOT EXISTS spesialisasi text;

-- 2. Fungsi RPC untuk insert/update dokter
-- Digunakan dari frontend (js/db.js) karena frontend dilarang insert ke auth.users langsung.
CREATE OR REPLACE FUNCTION public.simpan_pegawai_dokter(
  p_id uuid,
  p_nama text,
  p_alamat text,
  p_telepon text,
  p_hp text,
  p_kode_detailer text,
  p_spesialisasi text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid := coalesce(p_id, gen_random_uuid());
BEGIN
  IF p_id IS NULL THEN
    -- Tambah akun baru ke auth.users (trigger trg_auth_user_baru otomatis membuat baris pegawai)
    INSERT INTO auth.users (
      id, instance_id, role, aud, created_at, updated_at, encrypted_password, email, raw_user_meta_data
    ) VALUES (
      v_id, 
      '00000000-0000-0000-0000-000000000000', 
      'authenticated', 
      'authenticated', 
      now(), 
      now(), 
      '',
      regexp_replace(lower(p_nama), '[^a-z0-9]', '_', 'g') || '_' || floor(random()*10000)::text || '@dummy.local',
      jsonb_build_object('nama', p_nama, 'peran', 'dokter')
    );
  END IF;

  -- Update tabel pegawai (entah yang baru dibuat trigger, atau data lama)
  UPDATE public.pegawai SET
    nama = p_nama,
    alamat = p_alamat,
    telepon = p_telepon,
    no_hp = p_hp,
    kode_detailer = p_kode_detailer,
    spesialisasi = p_spesialisasi,
    peran = 'dokter'
  WHERE id = v_id;

  RETURN v_id;
END;
$$;
