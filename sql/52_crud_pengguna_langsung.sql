-- =====================================================================
--  RME Laboratorium Medis Utama - CRUD PENGGUNA LANGSUNG (DARI WEB)
--  Berkas: sql/52_crud_pengguna_langsung.sql
--
--  Memungkinkan master klinik menambah pengguna baru, me-reset kata sandi,
--  dan menghapus akun langsung dari antarmuka web tanpa membuka dasbor Supabase.
--  Seluruh fungsi dikunci ketat: hanya dapat dipanggil oleh peran 'master'.
-- =====================================================================

-- 1. Tambah Pengguna Baru Langsung dari Web
create or replace function public.tambah_pengguna_langsung(
  p_nama text,
  p_email text,
  p_password text,
  p_peran public.peran_pegawai default 'admin',
  p_jenis_dokter text default null,
  p_no_sip text default null
) returns uuid
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_uid uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
begin
  -- Keamanan: Hanya master yang diizinkan menambah pengguna
  if public.peran_saya() != 'master' then
    raise exception 'Akses ditolak: Hanya peran master yang dapat menambah pengguna.';
  end if;

  if length(p_password) < 6 then
    raise exception 'Kata sandi minimal 6 karakter.';
  end if;

  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'Email % sudah terdaftar di sistem.', v_email;
  end if;

  -- Tambahkan akun ke auth.users dengan kata sandi terenkripsi & email terkonfirmasi
  insert into auth.users (
    id,
    instance_id,
    role,
    aud,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('nama', trim(p_nama), 'peran', p_peran),
    now(),
    now()
  );

  -- Daftarkan juga identitas email di auth.identities agar login GoTrue berjalan mulus
  begin
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      v_uid::text,
      v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email),
      'email',
      v_uid::text,
      now(),
      now(),
      now()
    );
  exception when others then
    begin
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) values (
        v_uid,
        v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email),
        'email',
        now(),
        now(),
        now()
      );
    exception when others then
      null;
    end;
  end;

  -- Pastikan data di tabel pegawai terisi lengkap
  insert into public.pegawai (id, nama, peran, jenis_dokter, no_sip, aktif)
  values (v_uid, trim(p_nama), p_peran, p_jenis_dokter, trim(p_no_sip), true)
  on conflict (id) do update set
    nama = trim(p_nama),
    peran = p_peran,
    jenis_dokter = p_jenis_dokter,
    no_sip = trim(p_no_sip),
    aktif = true;

  return v_uid;
end;
$$;

grant execute on function public.tambah_pengguna_langsung(text, text, text, public.peran_pegawai, text, text) to authenticated;

-- 2. Hapus Pengguna Langsung dari Web
create or replace function public.hapus_pengguna_langsung(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public, extensions
as $$
begin
  -- Keamanan: Hanya master yang diizinkan menghapus pengguna
  if public.peran_saya() != 'master' then
    raise exception 'Akses ditolak: Hanya peran master yang dapat menghapus pengguna.';
  end if;

  -- Cegah master menghapus akunnya sendiri yang sedang aktif
  if p_id = auth.uid() then
    raise exception 'Tidak dapat menghapus akun Anda sendiri yang sedang digunakan.';
  end if;

  -- Coba hapus akun. Jika akun belum terikat transaksi/rekam medis, hapus permanen.
  -- Jika sudah ada riwayat transaksi/rekam medis, lindungi integritas data dengan
  -- menonaktifkan akun & mencabut akses login secara permanen.
  begin
    begin
      delete from auth.identities where user_id = p_id;
    exception when others then
      null;
    end;
    delete from auth.users where id = p_id;
    delete from public.pegawai where id = p_id;
  exception when foreign_key_violation then
    update public.pegawai set aktif = false where id = p_id;
    update auth.users set
      encrypted_password = extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
      updated_at = now()
    where id = p_id;
  end;

  return true;
end;
$$;

grant execute on function public.hapus_pengguna_langsung(uuid) to authenticated;

-- 3. Reset Kata Sandi Pengguna Langsung dari Web
create or replace function public.reset_password_pengguna(
  p_id uuid,
  p_password_baru text
) returns boolean
language plpgsql security definer set search_path = public, extensions
as $$
begin
  -- Keamanan: Hanya master yang diizinkan me-reset kata sandi
  if public.peran_saya() != 'master' then
    raise exception 'Akses ditolak: Hanya peran master yang dapat me-reset kata sandi.';
  end if;

  if length(p_password_baru) < 6 then
    raise exception 'Kata sandi baru minimal 6 karakter.';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_password_baru, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_id;

  return true;
end;
$$;

grant execute on function public.reset_password_pengguna(uuid, text) to authenticated;

-- =====================================================================
-- 4. Inisialisasi Akun Karyawan & Petugas Laboratorium Medis Utama
--
-- Jalankan bagian ini di Supabase SQL Editor untuk otomatis membuat akun
-- seluruh karyawan & staf laboratorium (analis, pendaftaran, kasir, surat, dll).
-- Kata sandi default diset: 'lab123456' (bisa diubah sewaktu-waktu di menu Pengaturan -> Pengguna).
-- Anda juga dapat mengubah nama & email di bawah sesuai nama asli karyawan klinik Anda.
-- =====================================================================
DO $$
DECLARE
  r RECORD;
  v_uid uuid;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('Siti Nurhaliza, A.Md.AK',  'analis1@labmedis.id',     'lab123456', 'karyawan'::public.peran_pegawai, null, '199501012020122001'),
    ('Budi Santoso, A.Md.AK',    'analis2@labmedis.id',     'lab123456', 'karyawan'::public.peran_pegawai, null, '199602022021011002'),
    ('Rina Agustina',            'pendaftaran@labmedis.id', 'lab123456', 'karyawan'::public.peran_pegawai, null, null),
    ('Dewi Sartika',             'kasir@labmedis.id',       'lab123456', 'karyawan'::public.peran_pegawai, null, null),
    ('Tri Wahyuni',              'surat@labmedis.id',       'lab123456', 'karyawan'::public.peran_pegawai, null, null),
    ('Ahmad Fauzi, A.Md.Kep',    'sampling@labmedis.id',    'lab123456', 'karyawan'::public.peran_pegawai, null, '446/012/SIP-P/2023'),
    ('Joko Prasetyo',            'staf.lab@labmedis.id',    'lab123456', 'karyawan'::public.peran_pegawai, null, null)
  ) AS t(nama, email, pass, peran, jenis_dokter, no_sip)
  LOOP
    -- Jika email belum ada di auth.users, buatkan akun baru
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(r.email))) THEN
      v_uid := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, role, aud, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        lower(trim(r.email)), extensions.crypt(r.pass, extensions.gen_salt('bf')), now(),
        jsonb_build_object('nama', trim(r.nama), 'peran', r.peran), now(), now()
      );

      BEGIN
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (v_uid::text, v_uid, jsonb_build_object('sub', v_uid::text, 'email', lower(trim(r.email))), 'email', v_uid::text, now(), now(), now());
      EXCEPTION WHEN OTHERS THEN NULL;
      END;

      INSERT INTO public.pegawai (id, nama, peran, jenis_dokter, no_sip, aktif)
      VALUES (v_uid, trim(r.nama), r.peran, r.jenis_dokter, trim(r.no_sip), true)
      ON CONFLICT (id) DO UPDATE SET
        nama = trim(r.nama),
        peran = r.peran,
        jenis_dokter = r.jenis_dokter,
        no_sip = trim(r.no_sip),
        aktif = true;
    ELSE
      -- Jika akun email sudah ada, sinkronkan nama, peran, dan aktifkan
      UPDATE public.pegawai
         SET nama = trim(r.nama),
             peran = r.peran,
             no_sip = coalesce(trim(r.no_sip), no_sip),
             aktif = true
       WHERE id = (SELECT id FROM auth.users WHERE email = lower(trim(r.email)));
    END IF;
  END LOOP;
END $$;

