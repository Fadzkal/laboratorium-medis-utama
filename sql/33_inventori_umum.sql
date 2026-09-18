-- =====================================================================
--  33_inventori_umum.sql
--  Modul Inventori Umum & Akuntansi Lab: Pencatatan Reagen, FEFO Batch,
--  BOM (Resep Lab), dan Auto-Deduct HPP.
-- =====================================================================

create table if not exists inventori_barang (
  id uuid primary key default uuid_generate_v4(),
  kode text unique,
  nama text not null,
  kategori text,
  satuan text,
  stok_sekarang numeric(12,2) not null default 0,
  stok_minimum numeric(12,2) default 0,
  aktif boolean not null default true,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade struktur inventori_barang lama ke baru (logistik lab)
alter table inventori_barang add column if not exists purchase_unit text not null default 'Box';
alter table inventori_barang add column if not exists usage_unit text not null default 'mL';
alter table inventori_barang add column if not exists conversion_factor numeric(10,2) not null default 1;
alter table inventori_barang add column if not exists stok_sekarang_usage numeric(12,2) not null default 0;
alter table inventori_barang add column if not exists stok_minimum_usage numeric(12,2) default 0;

drop trigger if exists trg_updated_inventori_barang on inventori_barang;
create trigger trg_updated_inventori_barang before update on inventori_barang
for each row execute function set_updated_at();

-- FEFO Batches
create table if not exists inventori_batch (
  id uuid primary key default uuid_generate_v4(),
  barang_id uuid not null references inventori_barang(id) on delete cascade,
  batch_number text not null,
  expired_date date not null,
  stok_sekarang_usage numeric(12,2) not null default 0 check (stok_sekarang_usage >= 0),
  cost_per_usage_unit numeric(14,4) not null default 0, -- HPP riil
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(barang_id, batch_number)
);

drop trigger if exists trg_updated_inventori_batch on inventori_batch;
create trigger trg_updated_inventori_batch before update on inventori_batch
for each row execute function set_updated_at();

-- Trigger untuk sync total stok di inventori_barang setiap ada perubahan batch
create or replace function sync_stok_inventori_barang() returns trigger
language plpgsql as $$
begin
  update inventori_barang 
  set stok_sekarang_usage = (
    select coalesce(sum(stok_sekarang_usage), 0) 
    from inventori_batch 
    where barang_id = coalesce(new.barang_id, old.barang_id)
  )
  where id = coalesce(new.barang_id, old.barang_id);
  return null;
end $$;

drop trigger if exists trg_sync_stok_inventori_barang on inventori_batch;
create trigger trg_sync_stok_inventori_barang after insert or update or delete on inventori_batch
for each row execute function sync_stok_inventori_barang();


-- BOM (Resep per Tes)
create table if not exists lab_resep (
  id uuid primary key default uuid_generate_v4(),
  lab_id uuid not null references ref_lab(id) on delete cascade,
  barang_id uuid not null references inventori_barang(id) on delete cascade,
  qty_usage numeric(10,4) not null check (qty_usage > 0),
  created_at timestamptz not null default now(),
  unique (lab_id, barang_id)
);


-- Mutasi (Logs)
create table if not exists inventori_mutasi (
  id uuid primary key default uuid_generate_v4(),
  barang_id uuid not null references inventori_barang(id) on delete cascade,
  batch_id uuid references inventori_batch(id) on delete cascade,
  tanggal timestamptz not null default now(),
  jenis text not null check (jenis in ('IN_PURCHASE', 'TEST_PATIENT', 'CALIBRATION', 'WASTE', 'OPNAME', 'IN', 'OUT')),
  jumlah_usage numeric(12,4) not null,
  stok_awal_usage numeric(12,4),
  stok_akhir_usage numeric(12,4),
  total_cost numeric(14,4) not null default 0, -- HPP total dari mutasi ini
  keterangan text,
  referensi text,             -- nomor nota / no lembar lab
  dicatat_oleh uuid references pegawai(id),
  created_at timestamptz not null default now()
);

-- Upgrade struktur inventori_mutasi lama ke baru
alter table inventori_mutasi add column if not exists batch_id uuid references inventori_batch(id) on delete cascade;
alter table inventori_mutasi add column if not exists jumlah_usage numeric(12,4) not null default 0;
alter table inventori_mutasi add column if not exists stok_awal_usage numeric(12,4);
alter table inventori_mutasi add column if not exists stok_akhir_usage numeric(12,4);
alter table inventori_mutasi add column if not exists total_cost numeric(14,4) not null default 0;
alter table inventori_mutasi drop constraint if exists inventori_mutasi_jenis_check;
alter table inventori_mutasi add constraint inventori_mutasi_jenis_check check (jenis in ('IN_PURCHASE', 'TEST_PATIENT', 'CALIBRATION', 'WASTE', 'OPNAME', 'IN', 'OUT'));


create index if not exists idx_inventori_mutasi_barang on inventori_mutasi (barang_id, tanggal desc);
create index if not exists idx_inventori_mutasi_batch on inventori_mutasi (batch_id);


-- Trigger potong/tambah batch berdasarkan mutasi
create or replace function update_stok_inventori_mutasi() returns trigger
language plpgsql as $$
declare
  stok_lama numeric;
  stok_baru numeric;
  harga_satuan numeric;
begin
  if new.batch_id is null then
    return new; -- Lewati jika mutasi lama tanpa batch
  end if;

  -- Kunci row batch agar aman dari concurrent updates
  select stok_sekarang_usage, cost_per_usage_unit into stok_lama, harga_satuan
  from inventori_batch 
  where id = new.batch_id for update;

  if not found then
    raise exception 'Batch tidak ditemukan';
  end if;

  new.stok_awal_usage = stok_lama;

  if new.jenis = 'IN_PURCHASE' then
    stok_baru = stok_lama + new.jumlah_usage;
  else
    stok_baru = stok_lama - new.jumlah_usage;
    if stok_baru < 0 then
      raise exception 'Stok tidak mencukupi untuk batch ini.';
    end if;
  end if;

  new.stok_akhir_usage = stok_baru;
  new.total_cost = new.jumlah_usage * harga_satuan;

  update inventori_batch set stok_sekarang_usage = stok_baru where id = new.batch_id;
  
  return new;
end $$;

drop trigger if exists trg_update_stok_inventori_mutasi on inventori_mutasi;
create trigger trg_update_stok_inventori_mutasi before insert on inventori_mutasi
for each row execute function update_stok_inventori_mutasi();


-- =====================================================================
-- FUNGSI: AUTO-DEDUCT REAGEN SAAT LAB SELESAI
-- Memotong FEFO batch reagen berdasarkan resep (BOM)
-- =====================================================================
create or replace function public.inventori_auto_deduct_lab(p_lembar_id uuid, p_pegawai_id uuid)
returns void language plpgsql security definer as $$
declare
  r record;       -- Baris item lab yang diperiksa
  bom record;     -- Baris resep
  v_batch record; -- Batch FEFO
  v_sisa_potong numeric;
  v_potong_batch numeric;
  v_referensi text;
begin
  v_referensi := 'LAB_LEMBAR_' || left(p_lembar_id::text, 8);

  -- 1. Looping semua jenis tes di lembar ini
  for r in (
    select i.lab_id, l.nama as nama_tes
    from lab_lembar_item i
    join ref_lab l on l.id = i.lab_id
    where i.lembar_id = p_lembar_id
  ) loop
    
    -- 2. Looping resep (BOM) untuk tes ini
    for bom in (
      select barang_id, qty_usage
      from lab_resep
      where lab_id = r.lab_id
    ) loop
      
      v_sisa_potong := bom.qty_usage;

      -- 3. Cari batch dengan FEFO (First Expired First Out) yang stoknya > 0
      while v_sisa_potong > 0 loop
        select * into v_batch 
        from inventori_batch
        where barang_id = bom.barang_id and stok_sekarang_usage > 0 and aktif = true
        order by expired_date asc, created_at asc
        limit 1 for update;

        if not found then
          -- Kalau reagen habis, buat log saja, tidak perlu block lab selesai
          insert into inventori_mutasi (barang_id, tanggal, jenis, jumlah_usage, keterangan, referensi, dicatat_oleh)
          values (bom.barang_id, now(), 'TEST_PATIENT', v_sisa_potong, 'GAGAL: Stok habis (Tes '|| r.nama_tes ||')', v_referensi, p_pegawai_id);
          exit; -- Lanjut ke reagen berikutnya
        end if;

        if v_batch.stok_sekarang_usage >= v_sisa_potong then
          v_potong_batch := v_sisa_potong;
        else
          v_potong_batch := v_batch.stok_sekarang_usage;
        end if;

        -- 4. Potong (Mutasi Insert akan memicu trigger yg memotong batch)
        insert into inventori_mutasi (barang_id, batch_id, tanggal, jenis, jumlah_usage, keterangan, referensi, dicatat_oleh)
        values (bom.barang_id, v_batch.id, now(), 'TEST_PATIENT', v_potong_batch, 'Auto-deduct: Tes ' || r.nama_tes, v_referensi, p_pegawai_id);

        v_sisa_potong := v_sisa_potong - v_potong_batch;
      end loop;
      
    end loop;
  end loop;
end;
$$;


-- =====================================================================
-- RLS POLICIES
-- =====================================================================
alter table inventori_barang enable row level security;
alter table inventori_batch enable row level security;
alter table lab_resep enable row level security;
alter table inventori_mutasi enable row level security;

-- Hapus policy yang mungkin sudah ada agar tidak duplikat
drop policy if exists "Master kelola inventori" on inventori_barang;
drop policy if exists "Semua bisa baca inventori" on inventori_barang;
drop policy if exists "Master kelola batch" on inventori_batch;
drop policy if exists "Master kelola resep" on lab_resep;
drop policy if exists "Master kelola mutasi" on inventori_mutasi;
drop policy if exists "Semua bisa insert mutasi" on inventori_mutasi;

create policy "Master kelola inventori" on inventori_barang for all using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin')));
create policy "Semua bisa baca inventori" on inventori_barang for select using (true);
create policy "Master kelola batch" on inventori_batch for all using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin')));
create policy "Semua bisa baca batch" on inventori_batch for select using (true);
create policy "Master kelola resep" on lab_resep for all using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin')));
create policy "Semua bisa baca resep" on lab_resep for select using (true);
create policy "Master kelola mutasi" on inventori_mutasi for all using (exists (select 1 from pegawai where id = auth.uid() and peran in ('master', 'admin')));
create policy "Semua bisa insert mutasi" on inventori_mutasi for insert with check (true);
create policy "Semua bisa baca mutasi" on inventori_mutasi for select using (true);
