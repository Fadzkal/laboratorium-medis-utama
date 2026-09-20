-- =====================================================================
--  54_pengaturan_jam_kerja.sql
--  Pengaturan Jam Masuk & Jam Pulang Kantor oleh Master
-- =====================================================================

create table if not exists public.pengaturan_absensi (
  id smallint primary key default 1 check (id = 1),
  jam_masuk text not null default '08:00',
  jam_pulang text not null default '16:00',
  toleransi_keterlambatan_menit integer not null default 15,
  updated_at timestamptz not null default now()
);

insert into public.pengaturan_absensi (id, jam_masuk, jam_pulang, toleransi_keterlambatan_menit)
values (1, '08:00', '16:00', 15)
on conflict (id) do nothing;

alter table public.pengaturan_absensi enable row level security;

-- Semua pegawai bisa membaca pengaturan jam kerja
drop policy if exists "Semua pegawai bisa membaca pengaturan jam kerja" on public.pengaturan_absensi;
create policy "Semua pegawai bisa membaca pengaturan jam kerja"
on public.pengaturan_absensi for select
using (true);

-- Hanya Master yang bisa mengubah/menyimpan pengaturan jam kerja
drop policy if exists "Master bisa mengubah pengaturan jam kerja" on public.pengaturan_absensi;
create policy "Master bisa mengubah pengaturan jam kerja"
on public.pengaturan_absensi for all
using (exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master'))
with check (exists (select 1 from public.pegawai where id = auth.uid() and peran = 'master'));

