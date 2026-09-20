-- =====================================================================
--  MIGRASI: lab_selesaikan otomatis menset kunjungan SELESAI
-- =====================================================================

create or replace function public.lab_selesaikan(p_permintaan_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare 
  v_kosong integer;
  v_kunjungan_id uuid;
begin
  if not public.boleh_lab() then
    raise exception 'Anda tidak berhak menutup lembar hasil laboratorium.'
      using errcode = '42501';
  end if;

  select count(*) into v_kosong from lab_hasil
   where permintaan_id = p_permintaan_id
     and nilai_angka is null and nullif(nilai_teks,'') is null;
  if v_kosong > 0 then
    raise exception 'Masih ada % pemeriksaan yang belum diisi hasilnya.', v_kosong;
  end if;

  update lab_permintaan
     set status = 'SELESAI', selesai_oleh = auth.uid(), waktu_selesai = now()
   where id = p_permintaan_id and status <> 'BATAL'
   returning kunjungan_id into v_kunjungan_id;
   
  -- Otomatis tandai Kunjungan sebagai SELESAI DILAYANI
  if v_kunjungan_id is not null then
    update kunjungan
       set status = 'SELESAI', 
           waktu_selesai = coalesce(waktu_selesai, now())
     where id = v_kunjungan_id
       and status not in ('SELESAI', 'BATAL');
  end if;

  -- Panggil fungsi potong reagen otomatis (dari 33_inventori_umum.sql)
  begin
    perform inventori_auto_deduct_lab(p_permintaan_id);
  exception
    when undefined_function then null; -- Jika belum ada, abaikan
  end;
end $$;
