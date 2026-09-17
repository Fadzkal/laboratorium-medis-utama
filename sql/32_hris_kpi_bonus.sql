-- =====================================================================
--  32_hris_kpi_bonus.sql
--  Modul HRIS: Sistem KPI dan Perhitungan Bonus Pegawai
-- =====================================================================

create table if not exists pegawai_kpi (
  id uuid primary key default uuid_generate_v4(),
  pegawai_id uuid not null references pegawai(id) on delete cascade,
  bulan smallint not null check (bulan between 1 and 12),
  tahun integer not null,
  metrik text not null,        -- misalnya: 'Pasien Ditangani', 'Resep Selesai', 'Kehadiran Tepat Waktu'
  target numeric(12,2) default 0,
  capaian numeric(12,2) default 0,
  nilai numeric(5,2) generated always as (
    case when target > 0 then least(round((capaian / target) * 100, 2), 999.99)
         else 0 end
  ) stored,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_kpi_periode on pegawai_kpi (tahun, bulan);
create index if not exists idx_kpi_pegawai on pegawai_kpi (pegawai_id);

create trigger trg_updated_pegawai_kpi before update on pegawai_kpi
for each row execute function set_updated_at();

create table if not exists pegawai_bonus (
  id uuid primary key default uuid_generate_v4(),
  pegawai_id uuid not null references pegawai(id) on delete cascade,
  bulan smallint not null check (bulan between 1 and 12),
  tahun integer not null,
  komponen_absensi numeric(12,2) default 0,
  komponen_kpi numeric(12,2) default 0,
  komponen_lainnya numeric(12,2) default 0,
  total_bonus numeric(15,2) generated always as (
    komponen_absensi + komponen_kpi + komponen_lainnya
  ) stored,
  status_bayar text not null default 'BELUM', -- BELUM, DIBAYAR
  tanggal_bayar date,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Mencegah duplikasi pembayaran bonus bulanan
create unique index if not exists uq_bonus_bulanan on pegawai_bonus (pegawai_id, bulan, tahun);

create trigger trg_updated_pegawai_bonus before update on pegawai_bonus
for each row execute function set_updated_at();

-- RLS
alter table pegawai_kpi enable row level security;
alter table pegawai_bonus enable row level security;

-- Pegawai bisa melihat miliknya sendiri, Master bisa melihat dan edit semua
create policy "Pegawai lihat kpi sendiri" on pegawai_kpi for select
using (auth.uid() = pegawai_id or exists (select 1 from pegawai where id = auth.uid() and peran = 'master'));

create policy "Master bisa kelola kpi" on pegawai_kpi for all
using (exists (select 1 from pegawai where id = auth.uid() and peran = 'master'));

create policy "Pegawai lihat bonus sendiri" on pegawai_bonus for select
using (auth.uid() = pegawai_id or exists (select 1 from pegawai where id = auth.uid() and peran = 'master'));

create policy "Master bisa kelola bonus" on pegawai_bonus for all
using (exists (select 1 from pegawai where id = auth.uid() and peran = 'master'));
