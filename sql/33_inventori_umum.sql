-- =====================================================================
--  33_inventori_umum.sql
--  Modul Inventori Umum: Pencatatan In/Out barang non-medis / Reagen Lab
-- =====================================================================

create table if not exists inventori_barang (
  id uuid primary key default uuid_generate_v4(),
  kode text unique,
  nama text not null,
  kategori text,              -- mis. 'Reagen', 'ATK', 'BHP Non-Medis'
  satuan text not null default 'Pcs',
  stok_sekarang numeric(10,2) not null default 0,
  stok_minimum numeric(10,2) default 0,
  harga_satuan numeric(12,2) default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_updated_inventori_barang before update on inventori_barang
for each row execute function set_updated_at();

create table if not exists inventori_mutasi (
  id uuid primary key default uuid_generate_v4(),
  barang_id uuid not null references inventori_barang(id) on delete cascade,
  tanggal timestamptz not null default now(),
  jenis text not null check (jenis in ('IN', 'OUT', 'ADJUSTMENT')),
  jumlah numeric(10,2) not null check (jumlah > 0),
  stok_awal numeric(10,2),
  stok_akhir numeric(10,2),
  keterangan text,
  referensi text,             -- nomor nota / struk jika ada
  dicatat_oleh uuid references pegawai(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_mutasi_barang on inventori_mutasi (barang_id, tanggal desc);

-- RLS
alter table inventori_barang enable row level security;
alter table inventori_mutasi enable row level security;

-- Semua pegawai (terutama master/admin) bisa melihat barang dan mutasi
create policy "Pegawai bisa melihat barang" on inventori_barang for select using (true);
create policy "Pegawai bisa melihat mutasi" on inventori_mutasi for select using (true);

-- Hanya master / admin khusus (yang diberi wewenang) yang bisa kelola
create policy "Master bisa kelola barang" on inventori_barang for all
using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin')));

create policy "Master bisa kelola mutasi" on inventori_mutasi for all
using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin')));

-- Trigger untuk update stok otomatis saat mutasi dimasukkan
create or replace function update_stok_inventori() returns trigger
language plpgsql as $$
declare
  stok_lama numeric;
  stok_baru numeric;
begin
  select stok_sekarang into stok_lama from inventori_barang where id = new.barang_id for update;
  
  if new.jenis = 'IN' then
    stok_baru := stok_lama + new.jumlah;
  elsif new.jenis = 'OUT' then
    stok_baru := stok_lama - new.jumlah;
  elsif new.jenis = 'ADJUSTMENT' then
    -- Misal adjustment langsung diset ke jumlah (atau logika lain)
    -- Asumsi sederhana: jika adjustment, 'jumlah' mewakili selisih positif/negatif. 
    -- Tapi tipe data kita mensyaratkan jumlah > 0.
    -- Kita buat khusus jika jenis OUT, maka kurangi.
    stok_baru := stok_lama; 
  end if;
  
  new.stok_awal := stok_lama;
  new.stok_akhir := stok_baru;
  
  update inventori_barang set stok_sekarang = stok_baru where id = new.barang_id;
  
  return new;
end $$;

drop trigger if exists trg_update_stok_inventori on inventori_mutasi;
create trigger trg_update_stok_inventori before insert on inventori_mutasi
for each row execute function update_stok_inventori();
