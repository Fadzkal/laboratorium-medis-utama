-- =====================================================================
--  RME Laboratorium Medis Utama - FUNGSI HAPUS PASIEN BERSIH
--  Berkas: sql/61_fungsi_hapus_pasien.sql
-- =====================================================================

create or replace function public.hapus_pasien(p_pasien_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_lab_ids uuid[];
begin
  -- 1. Hapus hasil lab & permintaan lab
  select array_agg(id) into v_lab_ids from lab_permintaan where pasien_id = p_pasien_id;
  if v_lab_ids is not null then
    delete from lab_hasil where permintaan_id = any(v_lab_ids);
    delete from lab_permintaan where pasien_id = p_pasien_id;
  end if;

  -- 2. Hapus surat jika ada
  delete from surat where pasien_id = p_pasien_id;

  -- 3. Hapus antrean jika ada
  delete from antrean where pasien_id = p_pasien_id;

  -- 4. Hapus kunjungan jika ada
  delete from kunjungan where pasien_id = p_pasien_id;

  -- 5. Hapus pasien
  delete from pasien where id = p_pasien_id;
end;
$$;

grant execute on function public.hapus_pasien(uuid) to authenticated;
