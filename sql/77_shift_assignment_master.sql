-- =====================================================================
--  RME Laboratorium Medis Utama - PENETAPAN SHIFT OLEH MASTER
--  Berkas: sql/77_shift_assignment_master.sql
--
--  Tujuan:
--  1. Memberikan izin kepada role Master untuk memasukkan dan memperbarui
--     jadwal absensi / shift staf (Shift 1 & Shift 2)
--  2. Menyediakan fungsi aman (security definer) tetapkan_shift_karyawan
-- =====================================================================

-- 1. Perbarui policy insert pada pegawai_absensi agar Master bisa menjadwalkan shift
drop policy if exists "Master bisa insert absensi" on public.pegawai_absensi;
create policy "Master bisa insert absensi"
on public.pegawai_absensi for insert
with check (
  auth.uid() = pegawai_id 
  or exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master')
);

-- 2. Pastikan policy update mengizinkan Master
drop policy if exists "Master bisa update absensi" on public.pegawai_absensi;
create policy "Master bisa update absensi"
on public.pegawai_absensi for update
using (
  auth.uid() = pegawai_id 
  or exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master')
);

-- 3. Fungsi aman penetapan shift harian oleh Master
create or replace function public.tetapkan_shift_karyawan(
  p_pegawai_id uuid,
  p_tanggal date,
  p_shift int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_waktu_masuk timestamptz;
begin
  -- Keamanan: Hanya peran master yang dapat menetapkan shift
  if public.peran_saya() != 'master' then
    raise exception 'Akses ditolak: Hanya peran master yang dapat menetapkan shift kerja.';
  end if;

  -- Cek catatan absensi hari tersebut
  select id, waktu_masuk into v_id, v_waktu_masuk
  from public.pegawai_absensi
  where pegawai_id = p_pegawai_id and tanggal = p_tanggal
  order by created_at desc
  limit 1;

  if v_id is not null then
    -- Jika staf belum melakukan presensi masuk, perbarui nomor shift
    if v_waktu_masuk is null then
      update public.pegawai_absensi
      set shift = p_shift,
          keterangan = 'Shift dijadwalkan oleh Pimpinan',
          updated_at = now()
      where id = v_id;
    else
      -- Jika staf sudah masuk, tetap izinkan koreksi shift jika diperlukan
      update public.pegawai_absensi
      set shift = p_shift,
          updated_at = now()
      where id = v_id;
    end if;
  else
    -- Buat entri awal jadwal shift
    insert into public.pegawai_absensi (
      pegawai_id,
      tanggal,
      shift,
      status,
      keterangan
    ) values (
      p_pegawai_id,
      p_tanggal,
      p_shift,
      'BELUM',
      'Shift dijadwalkan oleh Pimpinan'
    );
  end if;

  return jsonb_build_object('ok', true, 'shift', p_shift, 'pesan', 'Shift berhasil ditetapkan.');
end;
$$;

grant execute on function public.tetapkan_shift_karyawan(uuid, date, int) to authenticated;
