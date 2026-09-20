-- =====================================================================
--  53_absensi_geofence_izin.sql
--  Modul Absensi Karyawan:
--  1. Tabel master_lokasi_absensi (Multi-lokasi geofencing kantor/cabang)
--  2. Tabel pegawai_izin (Pengajuan cuti/izin/sakit tanpa foto)
--  3. Fungsi persetujuan izin otomatis mengisi rekap absensi harian
-- =====================================================================

-- 1. TABEL MASTER LOKASI ABSENSI (MULTI-LOKASI)
create table if not exists public.master_lokasi_absensi (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,                     -- misal: "Laboratorium Medis Utama (Pusat)", "Cabang Purbalingga Lor"
  alamat text,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  radius_meter integer not null default 100, -- radius batas absensi dalam meter
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_master_lokasi_aktif on public.master_lokasi_absensi (aktif);

create trigger trg_updated_master_lokasi before update on public.master_lokasi_absensi
for each row execute function set_updated_at();

-- Seed lokasi awal dari profil faskes jika tabel masih kosong
insert into public.master_lokasi_absensi (nama, alamat, latitude, longitude, radius_meter, aktif)
select 
  'Laboratorium Medis Utama (Pusat)',
  'Jl. D.I. Panjaitan No.94, Purbalingga Lor, Purbalingga',
  -7.3872280,
  109.3637170,
  100,
  true
where not exists (select 1 from public.master_lokasi_absensi);

-- RLS untuk master_lokasi_absensi
alter table public.master_lokasi_absensi enable row level security;

-- Semua karyawan terautentikasi bisa membaca lokasi aktif
create policy "Pegawai bisa melihat master lokasi aktif"
on public.master_lokasi_absensi for select
using (auth.uid() is not null);

-- Hanya master yang bisa menambah lokasi baru
create policy "Master bisa tambah lokasi absensi"
on public.master_lokasi_absensi for insert
with check (exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master'));

-- Hanya master yang bisa mengupdate lokasi
create policy "Master bisa ubah lokasi absensi"
on public.master_lokasi_absensi for update
using (exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master'));

-- Hanya master yang bisa menghapus lokasi
create policy "Master bisa hapus lokasi absensi"
on public.master_lokasi_absensi for delete
using (exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master'));


-- 2. TABEL PENGAJUAN IZIN / CUTI / SAKIT (TANPA FOTO/GAMBAR)
create table if not exists public.pegawai_izin (
  id uuid primary key default uuid_generate_v4(),
  pegawai_id uuid not null references public.pegawai(id) on delete cascade,
  jenis text not null check (jenis in ('CUTI', 'IZIN', 'SAKIT', 'DINAS_LUAR')),
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  keterangan text not null,
  status text not null default 'MENUNGGU' check (status in ('MENUNGGU', 'DISETUJUI', 'DITOLAK')),
  catatan_atasan text,
  disetujui_oleh uuid references public.pegawai(id) on delete set null,
  disetujui_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_rentang_tanggal check (tanggal_selesai >= tanggal_mulai)
);

create index if not exists idx_pegawai_izin_pegawai on public.pegawai_izin (pegawai_id, tanggal_mulai desc);
create index if not exists idx_pegawai_izin_status on public.pegawai_izin (status, tanggal_mulai desc);

create trigger trg_updated_pegawai_izin before update on public.pegawai_izin
for each row execute function set_updated_at();

-- RLS untuk pegawai_izin
alter table public.pegawai_izin enable row level security;

-- Pegawai bisa melihat pengajuan miliknya, Master bisa melihat semua
create policy "Pegawai dan master bisa baca izin"
on public.pegawai_izin for select
using (auth.uid() = pegawai_id or exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master'));

-- Pegawai bisa mengajukan izin untuk dirinya sendiri
create policy "Pegawai bisa mengajukan izin"
on public.pegawai_izin for insert
with check (auth.uid() = pegawai_id and status = 'MENUNGGU');

-- Pegawai bisa mengupdate pengajuan miliknya selama masih MENUNGGU, Master bisa update apapun (misal ubah status)
create policy "Update pengajuan izin"
on public.pegawai_izin for update
using (
  (auth.uid() = pegawai_id and status = 'MENUNGGU') or
  exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master')
);

-- Pegawai bisa membatalkan pengajuan yang masih MENUNGGU, Master bisa hapus jika perlu
create policy "Hapus pengajuan izin"
on public.pegawai_izin for delete
using (
  (auth.uid() = pegawai_id and status = 'MENUNGGU') or
  exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master')
);


-- 3. FUNGSI PERSETUJUAN IZIN OLEH MASTER (DENGAN AUTO-SYNC ABSENSI HARIAN)
create or replace function public.setujui_pegawai_izin(
  p_izin_id uuid,
  p_catatan text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_izin public.pegawai_izin%rowtype;
  v_cur_date date;
  v_status_absen text;
begin
  -- Verifikasi pemanggil adalah master
  if not exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master') then
    raise exception 'Hanya Master yang diizinkan menyetujui permohonan izin/cuti.';
  end if;

  select * into v_izin from public.pegawai_izin where id = p_izin_id for update;
  if not found then
    raise exception 'Data permohonan izin tidak ditemukan.';
  end if;

  -- Update status izin
  update public.pegawai_izin
  set status = 'DISETUJUI',
      catatan_atasan = coalesce(p_catatan, catatan_atasan),
      disetujui_oleh = auth.uid(),
      disetujui_pada = now()
  where id = p_izin_id;

  -- Petakan jenis izin ke status absensi
  v_status_absen := case 
    when v_izin.jenis = 'CUTI' then 'CUTI'
    when v_izin.jenis = 'SAKIT' then 'SAKIT'
    when v_izin.jenis = 'DINAS_LUAR' then 'HADIR'
    else 'IZIN'
  end;

  -- Sinkronisasikan ke tabel pegawai_absensi untuk setiap hari dalam rentang izin
  v_cur_date := v_izin.tanggal_mulai;
  while v_cur_date <= v_izin.tanggal_selesai loop
    insert into public.pegawai_absensi (
      pegawai_id,
      tanggal,
      status,
      keterangan
    )
    values (
      v_izin.pegawai_id,
      v_cur_date,
      v_status_absen,
      v_izin.jenis || ': ' || v_izin.keterangan
    )
    on conflict (pegawai_id, tanggal) do update
    set status = excluded.status,
        keterangan = excluded.keterangan,
        updated_at = now();

    v_cur_date := v_cur_date + 1;
  end loop;

  return jsonb_build_object('ok', true, 'pesan', 'Permohonan izin berhasil disetujui.');
end;
$$;

create or replace function public.tolak_pegawai_izin(
  p_izin_id uuid,
  p_catatan text default null
)
returns jsonb
language plpgsql
security definer
as $$
begin
  -- Verifikasi pemanggil adalah master
  if not exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master') then
    raise exception 'Hanya Master yang diizinkan menolak permohonan izin/cuti.';
  end if;

  update public.pegawai_izin
  set status = 'DITOLAK',
      catatan_atasan = coalesce(p_catatan, catatan_atasan),
      disetujui_oleh = auth.uid(),
      disetujui_pada = now()
  where id = p_izin_id;

  if not found then
    raise exception 'Data permohonan izin tidak ditemukan.';
  end if;

  return jsonb_build_object('ok', true, 'pesan', 'Permohonan izin telah ditolak.');
end;
$$;

grant execute on function public.setujui_pegawai_izin(uuid, text) to authenticated;
grant execute on function public.tolak_pegawai_izin(uuid, text) to authenticated;
