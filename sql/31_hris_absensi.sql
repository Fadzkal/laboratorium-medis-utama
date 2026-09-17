-- =====================================================================
--  31_hris_absensi.sql
--  Modul HRIS: Sistem Absensi Pegawai
-- =====================================================================

create table if not exists pegawai_absensi (
  id uuid primary key default uuid_generate_v4(),
  pegawai_id uuid not null references pegawai(id) on delete cascade,
  tanggal date not null default current_date,
  waktu_masuk timestamptz,
  waktu_keluar timestamptz,
  status text not null default 'HADIR', -- HADIR, IZIN, SAKIT, ALFA, CUTI
  keterangan text,
  -- Opsional: Koordinat atau nama jaringan (IP) untuk validasi lokasi
  lokasi_masuk text,
  lokasi_keluar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_absensi_tanggal on pegawai_absensi (tanggal desc);
create index if not exists idx_absensi_pegawai on pegawai_absensi (pegawai_id, tanggal desc);
-- Mencegah absen masuk berkali-kali di hari yang sama kecuali shift malam (disederhanakan 1 hari 1 absensi)
create unique index if not exists uq_absensi_harian on pegawai_absensi(pegawai_id, tanggal);

create trigger trg_updated_pegawai_absensi before update on pegawai_absensi
for each row execute function set_updated_at();

-- RLS
alter table pegawai_absensi enable row level security;

-- Pegawai bisa melihat absensinya sendiri, Master bisa melihat semua
create policy "Pegawai bisa melihat absensinya sendiri"
on pegawai_absensi for select
using (auth.uid() = pegawai_id or exists (select 1 from pegawai where id = auth.uid() and peran = 'master'));

-- Pegawai bisa menambah absensinya sendiri (Clock In)
create policy "Pegawai bisa absen masuk"
on pegawai_absensi for insert
with check (auth.uid() = pegawai_id);

-- Pegawai bisa mengupdate absensinya sendiri (Clock Out)
create policy "Pegawai bisa absen keluar"
on pegawai_absensi for update
using (auth.uid() = pegawai_id or exists (select 1 from pegawai where id = auth.uid() and peran = 'master'));

-- Master bisa menghapus jika perlu
create policy "Master bisa menghapus absensi"
on pegawai_absensi for delete
using (exists (select 1 from pegawai where id = auth.uid() and peran = 'master'));
