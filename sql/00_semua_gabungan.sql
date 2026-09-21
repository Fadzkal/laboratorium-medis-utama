-- =====================================================================
--  RME Laboratorium Medis Utama - SKEMA DATABASE
--  Rekam Medis Elektronik Klinik Pratama (Rawat Jalan)
--  Target: Supabase (PostgreSQL 15+)
--  Versi   : 1.0
--  Catatan : Jalankan file ini LEBIH DULU, lalu 02_rls.sql, 03_audit.sql,
--            terakhir 04_seed.sql
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";     -- untuk pencarian nama/ICD cepat

-- ---------------------------------------------------------------------
-- ENUM / TIPE DATA
-- ---------------------------------------------------------------------
-- Nama peran (9 Sep 2026): 'master' = pemilik/pengelola tertinggi sistem
-- (dulu bernama 'admin'); 'admin' sekarang = staf loket/pendaftaran (dulu
-- bernama 'pendaftaran' — ini istilah yang dipakai staf sehari-hari untuk
-- petugas administrasi loket). Peran 'kasir' ditambah belakangan lewat
-- sql/07_peran_kasir.sql (lihat catatan di berkas itu soal kenapa terpisah).
do $$ begin
  create type peran_pegawai as enum ('master','admin','perawat','dokter','apoteker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type jenis_kelamin_t as enum ('L','P');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cara_bayar_t as enum ('BPJS','UMUM','ASURANSI_LAIN','GRATIS');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_kunjungan_t as enum
    ('MENUNGGU','KAJIAN_AWAL','MENUNGGU_DOKTER','PEMERIKSAAN','SELESAI','BATAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type jenis_diagnosa_t as enum ('PRIMER','SEKUNDER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kasus_t as enum ('BARU','LAMA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tindak_lanjut_t as enum ('SELESAI','KONTROL','RUJUK_INTERNAL','RUJUK_LANJUT','RUJUK_IGD');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_bridging_t as enum ('BELUM','ANTRE','TERKIRIM','GAGAL','TIDAK_PERLU');
exception when duplicate_object then null; end $$;

-- =====================================================================
--  A. MASTER / REFERENSI
-- =====================================================================

-- A1. Profil fasilitas kesehatan (satu baris saja)
create table if not exists faskes (
  id                  smallint primary key default 1 check (id = 1),
  nama                text not null default 'Laboratorium Medis Utama',
  jenis_faskes        text not null default 'Klinik Pratama',
  alamat              text,
  kelurahan           text,
  kecamatan           text,
  kabupaten           text,
  provinsi            text,
  kode_pos            text,
  telepon             text,
  email               text,
  -- Identitas resmi
  kode_faskes_bpjs    text,          -- kode PPK / kode faskes dari BPJS
  kode_registrasi_kemenkes text,     -- kode registrasi faskes (RS Online / Sarana)
  npwp                text,
  -- Bridging SatuSehat
  satusehat_org_id    text,          -- Organization IHS ID
  satusehat_location_id text,        -- Location IHS ID default
  logo_url            text,
  penanggung_jawab    text,
  no_izin             text,
  updated_at          timestamptz not null default now()
);
comment on table faskes is 'Profil klinik. Dipakai untuk kop surat, laporan, dan identitas bridging.';

-- A2. Poli / unit layanan
create table if not exists poli (
  id            uuid primary key default uuid_generate_v4(),
  kode          text not null unique,          -- mis. 'UMUM','GIGI','KIA'
  nama          text not null,
  kode_pcare    text,                          -- kdPoli dari referensi PCare
  satusehat_location_id text,                  -- Location IHS ID per poli
  urutan        smallint default 0,
  aktif         boolean not null default true,
  created_at    timestamptz not null default now()
);

-- A3. Pegawai / pengguna sistem (profil dari auth.users)
create table if not exists pegawai (
  id                uuid primary key references auth.users(id) on delete cascade,
  nama              text not null,
  peran             peran_pegawai not null default 'admin',
  nik               text,
  jenis_kelamin     jenis_kelamin_t,
  no_hp             text,
  -- Kredensial profesi (untuk dokter/perawat/apoteker)
  no_str            text,
  no_sip            text,
  -- Bridging
  kode_dokter_pcare text,          -- kdDokter dari referensi PCare
  satusehat_practitioner_id text,  -- Practitioner IHS ID
  poli_default      uuid references poli(id),
  ttd_url           text,          -- tanda tangan digital (opsional)
  aktif             boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table pegawai is 'Profil pengguna. id = auth.users.id (Supabase Auth).';

-- A4. Master ICD-10
create table if not exists icd10 (
  kode        text primary key,               -- mis. 'J06.9'
  nama_en     text,
  nama_id     text,
  kategori    text,
  sering_dipakai boolean not null default false,
  aktif       boolean not null default true
);
create index if not exists idx_icd10_nama_id  on icd10 using gin (nama_id gin_trgm_ops);
create index if not exists idx_icd10_nama_en  on icd10 using gin (nama_en gin_trgm_ops);
create index if not exists idx_icd10_kode     on icd10 using gin (kode gin_trgm_ops);
create index if not exists idx_icd10_favorit  on icd10 (sering_dipakai) where sering_dipakai;

-- A5. Master obat (siap kode KFA untuk SatuSehat & kode PCare)
create table if not exists obat (
  id              uuid primary key default uuid_generate_v4(),
  kode_internal   text unique,
  nama            text not null,
  nama_generik    text,
  bentuk_sediaan  text,                 -- Tablet, Kapsul, Sirup, Salep, Injeksi
  kekuatan        text,                 -- mis. '500 mg'
  satuan          text not null default 'Tablet',
  golongan        text,                 -- Bebas, Bebas Terbatas, Keras, Narkotika, Psikotropika
  kode_kfa        text,                 -- Kamus Farmasi & Alkes (SatuSehat)
  kode_pcare      text,                 -- kdObat dari PCare (obat program/DPHO)
  formularium     boolean not null default false,
  harga           numeric(12,2) default 0,
  aktif           boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists idx_obat_nama on obat using gin (nama gin_trgm_ops);

-- A6. Master aturan pakai (signa) agar input resep cepat
create table if not exists signa (
  id        uuid primary key default uuid_generate_v4(),
  kode      text not null unique,      -- '3dd1'
  teks      text not null,             -- '3 x sehari 1 tablet'
  frekuensi smallint,                  -- 3
  dosis     numeric(6,2),              -- 1
  urutan    smallint default 0
);

-- =====================================================================
--  B. PASIEN
-- =====================================================================

create sequence if not exists seq_no_rm start 1;

create table if not exists pasien (
  id                uuid primary key default uuid_generate_v4(),
  no_rm             text not null unique,
  -- Identitas (PMK 24/2022 pasal identitas pasien)
  nik               text unique,
  no_bpjs           text,
  no_kk             text,
  nama              text not null,
  tempat_lahir      text,
  tanggal_lahir     date not null,
  jenis_kelamin     jenis_kelamin_t not null,
  gol_darah         text,
  agama             text,
  pendidikan        text,
  pekerjaan         text,
  status_kawin      text,
  suku              text,
  -- Alamat
  alamat            text,
  rt                text,
  rw                text,
  kelurahan         text,
  kecamatan         text,
  kabupaten         text,
  provinsi          text,
  kode_pos          text,
  -- Kontak
  no_hp             text,
  email             text,
  -- Penanggung jawab
  pj_nama           text,
  pj_hubungan       text,
  pj_no_hp          text,
  -- Data BPJS (hasil sinkron PCare)
  bpjs_jenis_peserta text,
  bpjs_kelas        text,
  bpjs_faskes       text,
  bpjs_status_aktif boolean,
  bpjs_sinkron_pada timestamptz,
  -- Bridging SatuSehat
  satusehat_patient_id text,           -- IHS number pasien
  satusehat_sinkron_pada timestamptz,
  -- Meta
  catatan_penting   text,              -- flag alergi berat, dsb
  aktif             boolean not null default true,
  created_at        timestamptz not null default now(),
  created_by        uuid references pegawai(id),
  updated_at        timestamptz not null default now(),
  updated_by        uuid references pegawai(id)
);
create index if not exists idx_pasien_nama  on pasien using gin (nama gin_trgm_ops);
create index if not exists idx_pasien_nik   on pasien (nik);
create index if not exists idx_pasien_bpjs  on pasien (no_bpjs);
create index if not exists idx_pasien_norm  on pasien (no_rm);

-- Riwayat alergi pasien (melekat ke pasien, bukan ke kunjungan)
create table if not exists pasien_alergi (
  id          uuid primary key default uuid_generate_v4(),
  pasien_id   uuid not null references pasien(id) on delete cascade,
  jenis       text not null default 'OBAT',   -- OBAT | MAKANAN | LAINNYA
  nama        text not null,
  reaksi      text,
  tingkat     text,                            -- RINGAN | SEDANG | BERAT
  dicatat_pada timestamptz not null default now(),
  dicatat_oleh uuid references pegawai(id)
);
create index if not exists idx_alergi_pasien on pasien_alergi (pasien_id);

-- =====================================================================
--  C. KUNJUNGAN (ENCOUNTER)
-- =====================================================================

create table if not exists kunjungan (
  id                uuid primary key default uuid_generate_v4(),
  no_kunjungan      text not null unique,        -- YYYYMMDD-0001
  pasien_id         uuid not null references pasien(id),
  tanggal           date not null default current_date,
  poli_id           uuid not null references poli(id),
  dokter_id         uuid references pegawai(id),
  cara_bayar        cara_bayar_t not null default 'BPJS',
  no_antrian        integer,
  jenis_kunjungan   kasus_t not null default 'BARU',   -- kunjungan baru / lama
  kunjungan_sakit   boolean not null default true,     -- sakit vs sehat (PCare)
  keluhan_singkat   text,
  status            status_kunjungan_t not null default 'MENUNGGU',
  -- Jejak waktu (untuk Encounter.statusHistory SatuSehat)
  waktu_daftar      timestamptz not null default now(),
  waktu_kajian      timestamptz,
  waktu_periksa     timestamptz,
  waktu_selesai     timestamptz,
  -- Bridging PCare
  pcare_no_kunjungan text,
  pcare_status      status_bridging_t not null default 'BELUM',
  pcare_pesan       text,
  pcare_sinkron_pada timestamptz,
  -- Bridging SatuSehat
  satusehat_encounter_id text,
  satusehat_status  status_bridging_t not null default 'BELUM',
  satusehat_pesan   text,
  satusehat_sinkron_pada timestamptz,
  -- Meta
  created_at        timestamptz not null default now(),
  created_by        uuid references pegawai(id),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_kunjungan_tanggal on kunjungan (tanggal desc);
create index if not exists idx_kunjungan_pasien  on kunjungan (pasien_id, tanggal desc);
create index if not exists idx_kunjungan_status  on kunjungan (status) where status <> 'SELESAI';

-- C1. Kajian awal perawat (TTV + skrining)
create table if not exists kajian_awal (
  kunjungan_id      uuid primary key references kunjungan(id) on delete cascade,
  keluhan_utama     text,
  riwayat_penyakit_sekarang text,
  riwayat_penyakit_dahulu   text,
  riwayat_alergi    text,
  riwayat_pengobatan text,
  -- Tanda vital
  sistolik          smallint,
  diastolik         smallint,
  nadi              smallint,
  nafas             smallint,
  suhu              numeric(4,1),
  spo2              smallint,
  berat_badan       numeric(5,2),
  tinggi_badan      numeric(5,1),
  lingkar_perut     numeric(5,1),
  imt               numeric(5,2) generated always as (
                      case when tinggi_badan is not null and tinggi_badan > 0 and berat_badan is not null
                      then round(berat_badan / ((tinggi_badan/100) * (tinggi_badan/100)), 2)
                      else null end) stored,
  -- Skrining wajib akreditasi
  kesadaran         text default 'Compos Mentis',
  skala_nyeri       smallint check (skala_nyeri between 0 and 10),
  lokasi_nyeri      text,
  risiko_jatuh      text,          -- RENDAH | SEDANG | TINGGI
  status_psikologis text,
  status_fungsional text,
  skrining_gizi     text,
  skrining_tb       boolean default false,
  catatan_perawat   text,
  dibuat_oleh       uuid references pegawai(id),
  dibuat_pada       timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- C2. Pemeriksaan dokter (SOAP)
create table if not exists pemeriksaan (
  kunjungan_id      uuid primary key references kunjungan(id) on delete cascade,
  subjective        text,
  objective         text,
  assessment        text,
  plan              text,
  -- Detail pemeriksaan fisik terstruktur (opsional, JSON fleksibel)
  pemeriksaan_fisik jsonb default '{}'::jsonb,
  prognosa          text,
  terapi_non_obat   text,
  edukasi           text,
  tindak_lanjut     tindak_lanjut_t not null default 'SELESAI',
  tanggal_kontrol   date,
  -- Rujukan (disiapkan untuk fase 2)
  rujuk_ke_faskes   text,
  rujuk_spesialis   text,
  rujuk_alasan      text,
  status_pulang     text default 'Sembuh',
  dibuat_oleh       uuid references pegawai(id),
  dibuat_pada       timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Kunci rekam medis: setelah difinalisasi tidak bisa diubah bebas (PMK 24/2022)
  final             boolean not null default false,
  final_pada        timestamptz
);

-- C3. Diagnosa (ICD-10)
create table if not exists diagnosa (
  id            uuid primary key default uuid_generate_v4(),
  kunjungan_id  uuid not null references kunjungan(id) on delete cascade,
  kode_icd10    text not null references icd10(kode),
  nama          text not null,
  jenis         jenis_diagnosa_t not null default 'PRIMER',
  kasus         kasus_t not null default 'BARU',
  catatan       text,
  urutan        smallint default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_diagnosa_kunjungan on diagnosa (kunjungan_id);
create index if not exists idx_diagnosa_kode on diagnosa (kode_icd10);
-- Hanya boleh ada satu diagnosa primer per kunjungan
create unique index if not exists uq_diagnosa_primer
  on diagnosa (kunjungan_id) where jenis = 'PRIMER';

-- C4. Resep
create table if not exists resep (
  id            uuid primary key default uuid_generate_v4(),
  kunjungan_id  uuid not null references kunjungan(id) on delete cascade,
  no_resep      text,
  catatan       text,
  status        text not null default 'DIBUAT',   -- DIBUAT | DISERAHKAN
  dibuat_oleh   uuid references pegawai(id),
  dibuat_pada   timestamptz not null default now(),
  diserahkan_oleh uuid references pegawai(id),
  diserahkan_pada timestamptz
);
create index if not exists idx_resep_kunjungan on resep (kunjungan_id);

create table if not exists resep_item (
  id            uuid primary key default uuid_generate_v4(),
  resep_id      uuid not null references resep(id) on delete cascade,
  obat_id       uuid references obat(id),
  nama_obat     text not null,          -- disalin agar riwayat tetap utuh
  kode_kfa      text,
  jumlah        numeric(8,2) not null default 1,
  satuan        text,
  signa         text,                   -- '3 x sehari 1 tablet'
  frekuensi     smallint,
  dosis         numeric(6,2),
  rute          text default 'Oral',
  keterangan    text,
  racikan_nama  text,                   -- jika bagian dari racikan
  urutan        smallint default 0
);
create index if not exists idx_resep_item_resep on resep_item (resep_id);

-- =====================================================================
--  D. AUDIT & BRIDGING LOG
-- =====================================================================

create table if not exists audit_log (
  id          bigserial primary key,
  waktu       timestamptz not null default now(),
  user_id     uuid,
  user_nama   text,
  aksi        text not null,            -- INSERT | UPDATE | DELETE | LOGIN | VIEW_RM
  tabel       text,
  record_id   text,
  data_lama   jsonb,
  data_baru   jsonb,
  keterangan  text
);
create index if not exists idx_audit_waktu on audit_log (waktu desc);
create index if not exists idx_audit_record on audit_log (tabel, record_id);

create table if not exists bridging_log (
  id            bigserial primary key,
  waktu         timestamptz not null default now(),
  sistem        text not null,           -- PCARE | SATUSEHAT
  operasi       text not null,           -- mis. 'POST /Encounter'
  kunjungan_id  uuid references kunjungan(id) on delete set null,
  pasien_id     uuid references pasien(id) on delete set null,
  request       jsonb,
  response      jsonb,
  http_status   integer,
  sukses        boolean not null default false,
  pesan_error   text,
  dijalankan_oleh uuid
);
create index if not exists idx_bridging_waktu on bridging_log (waktu desc);
create index if not exists idx_bridging_kunjungan on bridging_log (kunjungan_id);

-- Antrean kirim (agar bridging bisa dicoba ulang tanpa mengganggu pelayanan)
create table if not exists bridging_antrean (
  id            bigserial primary key,
  sistem        text not null,
  kunjungan_id  uuid not null references kunjungan(id) on delete cascade,
  payload       jsonb,
  percobaan     smallint not null default 0,
  status        status_bridging_t not null default 'ANTRE',
  pesan_error   text,
  dibuat_pada   timestamptz not null default now(),
  diproses_pada timestamptz
);
create index if not exists idx_antrean_status on bridging_antrean (status, sistem);

-- Penyimpanan kredensial bridging (hanya bisa dibaca service_role / Edge Function)
create table if not exists bridging_config (
  sistem        text primary key,        -- 'PCARE' | 'SATUSEHAT'
  aktif         boolean not null default false,
  mode          text not null default 'SANDBOX',  -- SANDBOX | PRODUKSI
  base_url      text,
  kredensial    jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

-- =====================================================================
--  E. FUNGSI PENOMORAN OTOMATIS
-- =====================================================================

-- E1. Nomor rekam medis: 6 digit berurutan
create or replace function gen_no_rm() returns trigger
language plpgsql as $$
begin
  if new.no_rm is null or new.no_rm = '' then
    new.no_rm := lpad(nextval('seq_no_rm')::text, 6, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_gen_no_rm on pasien;
create trigger trg_gen_no_rm before insert on pasien
for each row execute function gen_no_rm();

-- E2. Nomor kunjungan + nomor antrian per poli per hari
create or replace function gen_no_kunjungan() returns trigger
language plpgsql as $$
declare
  urut integer;
begin
  if new.no_kunjungan is null or new.no_kunjungan = '' then
    select coalesce(max(substring(no_kunjungan from 10)::int), 0) + 1
      into urut from kunjungan where tanggal = new.tanggal;
    new.no_kunjungan := to_char(new.tanggal,'YYYYMMDD') || '-' || lpad(urut::text, 4, '0');
  end if;

  if new.no_antrian is null then
    select coalesce(max(no_antrian), 0) + 1 into new.no_antrian
    from kunjungan where tanggal = new.tanggal and poli_id = new.poli_id;
  end if;

  -- Tandai kunjungan baru / lama otomatis
  if exists (select 1 from kunjungan k where k.pasien_id = new.pasien_id) then
    new.jenis_kunjungan := 'LAMA';
  else
    new.jenis_kunjungan := 'BARU';
  end if;

  return new;
end $$;

drop trigger if exists trg_gen_no_kunjungan on kunjungan;
create trigger trg_gen_no_kunjungan before insert on kunjungan
for each row execute function gen_no_kunjungan();

-- E3. Nomor resep
create or replace function gen_no_resep() returns trigger
language plpgsql as $$
declare urut integer;
begin
  if new.no_resep is null or new.no_resep = '' then
    select coalesce(count(*), 0) + 1 into urut
      from resep where dibuat_pada::date = current_date;
    new.no_resep := 'R' || to_char(current_date,'YYMMDD') || lpad(urut::text, 3, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_gen_no_resep on resep;
create trigger trg_gen_no_resep before insert on resep
for each row execute function gen_no_resep();

-- E4. updated_at otomatis
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['faskes','pegawai','pasien','kunjungan','kajian_awal','pemeriksaan']
  loop
    execute format('drop trigger if exists trg_updated_%1$s on %1$s', t);
    execute format('create trigger trg_updated_%1$s before update on %1$s
                    for each row execute function set_updated_at()', t);
  end loop;
end $$;

-- E5. Sinkronkan status kunjungan mengikuti progres pelayanan
create or replace function maju_status_kunjungan() returns trigger
language plpgsql as $$
begin
  if tg_table_name = 'kajian_awal' then
    update kunjungan
       set status = case when status in ('MENUNGGU','KAJIAN_AWAL') then 'MENUNGGU_DOKTER'::status_kunjungan_t else status end,
           waktu_kajian = coalesce(waktu_kajian, now())
     where id = new.kunjungan_id;
  elsif tg_table_name = 'pemeriksaan' then
    update kunjungan
       set status = case when new.final then 'SELESAI'::status_kunjungan_t else 'PEMERIKSAAN'::status_kunjungan_t end,
           waktu_periksa = coalesce(waktu_periksa, now()),
           waktu_selesai = case when new.final then coalesce(waktu_selesai, now()) else waktu_selesai end
     where id = new.kunjungan_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_status_kajian on kajian_awal;
create trigger trg_status_kajian after insert or update on kajian_awal
for each row execute function maju_status_kunjungan();

drop trigger if exists trg_status_periksa on pemeriksaan;
create trigger trg_status_periksa after insert or update on pemeriksaan
for each row execute function maju_status_kunjungan();

-- E6. Kunci rekam medis yang sudah final (amanat PMK 24/2022)
--     Perubahan setelah final hanya boleh lewat addendum, bukan menimpa data.
create table if not exists addendum (
  id            uuid primary key default uuid_generate_v4(),
  kunjungan_id  uuid not null references kunjungan(id) on delete cascade,
  isi           text not null,
  alasan        text,
  dibuat_oleh   uuid references pegawai(id),
  dibuat_pada   timestamptz not null default now()
);

create or replace function cegah_ubah_final() returns trigger
language plpgsql as $$
begin
  if old.final = true and new.final = true then
    raise exception 'Rekam medis kunjungan ini sudah difinalisasi. Gunakan Addendum untuk menambah catatan.';
  end if;
  return new;
end $$;

drop trigger if exists trg_cegah_ubah_final on pemeriksaan;
create trigger trg_cegah_ubah_final before update on pemeriksaan
for each row execute function cegah_ubah_final();

-- =====================================================================
--  F. VIEW BANTU
-- =====================================================================

create or replace view v_antrian_hari_ini with (security_invoker = true) as
select k.id, k.no_kunjungan, k.no_antrian, k.tanggal, k.status, k.cara_bayar,
       k.keluhan_singkat, k.waktu_daftar,
       p.id as pasien_id, p.no_rm, p.nama as nama_pasien, p.tanggal_lahir,
       p.jenis_kelamin, p.no_bpjs, p.no_hp,
       date_part('year', age(p.tanggal_lahir))::int as umur,
       po.nama as nama_poli, po.id as poli_id,
       d.nama as nama_dokter, k.dokter_id,
       (ka.kunjungan_id is not null) as sudah_kajian,
       (pm.kunjungan_id is not null) as sudah_periksa
from kunjungan k
join pasien p on p.id = k.pasien_id
join poli po on po.id = k.poli_id
left join pegawai d on d.id = k.dokter_id
left join kajian_awal ka on ka.kunjungan_id = k.id
left join pemeriksaan pm on pm.kunjungan_id = k.id
where k.tanggal = current_date
order by k.no_antrian;

create or replace view v_riwayat_kunjungan with (security_invoker = true) as
select k.id, k.no_kunjungan, k.tanggal, k.status, k.cara_bayar,
       p.id as pasien_id, p.no_rm, p.nama as nama_pasien,
       po.nama as nama_poli,
       d.nama as nama_dokter,
       (select string_agg(dg.kode_icd10 || ' - ' || dg.nama, '; ' order by dg.jenis)
          from diagnosa dg where dg.kunjungan_id = k.id) as daftar_diagnosa,
       (select dg.kode_icd10 from diagnosa dg
         where dg.kunjungan_id = k.id and dg.jenis = 'PRIMER' limit 1) as icd_primer,
       k.satusehat_status, k.pcare_status
from kunjungan k
join pasien p on p.id = k.pasien_id
join poli po on po.id = k.poli_id
left join pegawai d on d.id = k.dokter_id
order by k.tanggal desc, k.no_antrian desc;

-- =====================================================================
--  RME Laboratorium Medis Utama - ROW LEVEL SECURITY & HAK AKSES
--  Jalankan SETELAH 01_schema.sql
--
--  Prinsip:
--   - Tidak ada data medis yang bisa dibaca tanpa login.
--   - Hak tulis dibatasi sesuai peran (admin/perawat/dokter/apoteker/master).
--   - Kredensial bridging TIDAK disimpan di tabel yang bisa dibaca browser.
--
--  9 Sep 2026 — HAK AKSES JADI BISA DIATUR (bukan lagi tetap di kode):
--  peran diganti nama (dulu 'admin' -> 'master', dulu 'pendaftaran' ->
--  'admin' — lihat sql/20_ganti_nama_peran.sql untuk migrasi database yang
--  sudah berjalan), dan setiap pemeriksaan "peran X boleh Y" yang dulu
--  ditulis tetap di kebijakan (`peran_saya_salah_satu('admin','pendaftaran',...)`)
--  sekarang lewat satu fungsi generik `hak_akses_cek(kode)` yang membaca
--  tabel `hak_akses` — bisa diubah master lewat Pengaturan -> Hak Akses,
--  tanpa perlu SQL baru. `master` SELALU lolos apa pun isi tabelnya (jaring
--  pengaman: master tidak boleh bisa mengunci dirinya sendiri).
--
--  Pola penamaan fungsi `boleh_<kode>()` dipertahankan sama seperti yang
--  sudah ada di proyek ini (boleh_apotek, boleh_kasir, boleh_surat, dst di
--  berkas modul masing-masing) — hanya ISI fungsinya yang berubah dari
--  daftar peran tetap menjadi `hak_akses_cek('<kode>')`.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fungsi bantu: ambil peran pengguna yang sedang login.
-- SECURITY DEFINER agar tidak terjadi rekursi saat mengevaluasi policy.
-- ---------------------------------------------------------------------
create or replace function public.peran_saya()
returns peran_pegawai
language sql stable security definer set search_path = public
as $$ select peran from public.pegawai where id = auth.uid() and aktif $$;

create or replace function public.saya_staf()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.pegawai where id = auth.uid() and aktif) $$;

create or replace function public.peran_saya_salah_satu(variadic peran_pegawai[])
returns boolean
language sql stable security definer set search_path = public
as $$ select public.peran_saya() = any($1) $$;

grant execute on function public.peran_saya()   to authenticated;
grant execute on function public.saya_staf()    to authenticated;
grant execute on function public.peran_saya_salah_satu(variadic peran_pegawai[]) to authenticated;

-- ---------------------------------------------------------------------
-- HAK AKSES — tabel & fungsi generik.
--
-- Satu baris = satu peran boleh/tidak boleh melakukan satu kode aksi.
-- Tidak ada baris untuk `master` sama sekali — master selalu lolos lewat
-- jaring pengaman di hak_akses_cek(), supaya isi tabel ini tidak pernah
-- bisa mengunci satu-satunya akun yang bisa memperbaikinya.
-- ---------------------------------------------------------------------
create table if not exists public.hak_akses (
  kode        text not null,
  peran       peran_pegawai not null,
  diizinkan   boolean not null default false,
  diubah_oleh uuid references public.pegawai(id),
  diubah_pada timestamptz not null default now(),
  primary key (kode, peran)
);

comment on table public.hak_akses is
  'Matriks kode-aksi x peran, diatur master lewat Pengaturan -> Hak Akses. '
  'Diisi lewat hak_akses_cek(kode) di dalam fungsi boleh_<kode>() masing-masing '
  'modul. master tidak butuh baris di sini — selalu lolos.';

alter table public.hak_akses enable row level security;

-- Tabel baru tidak mewarisi GRANT dari sini kalau dibuat SETELAH baris
-- "grant ... on all tables" di bawah — pelajaran yang sudah berkali-kali
-- terjadi di proyek ini. Ditulis eksplisit supaya aman di urutan mana pun.
grant select, insert, update, delete on public.hak_akses to authenticated;

drop policy if exists hak_akses_baca on public.hak_akses;
create policy hak_akses_baca on public.hak_akses for select
  to authenticated using (public.saya_staf());

-- Mengubah matriks: SENGAJA hardcode master saja, TIDAK lewat hak_akses_cek.
-- Kalau ini sendiri bisa diatur lewat matriks yang diaturnya sendiri, master
-- bisa tidak sengaja mencabut akses dirinya ke satu-satunya tempat
-- memperbaikinya, dan jalan keluarnya hanya lewat SQL Editor Supabase.
drop policy if exists hak_akses_kelola on public.hak_akses;
create policy hak_akses_kelola on public.hak_akses for all
  to authenticated
  using (public.peran_saya() = 'master')
  with check (public.peran_saya() = 'master');

create or replace function public.hak_akses_cek(p_kode text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.peran_saya() = 'master'
      or exists (
        select 1 from public.hak_akses
         where kode = p_kode and peran = public.peran_saya() and diizinkan
      )
$$;

grant execute on function public.hak_akses_cek(text) to authenticated;

-- View tipis untuk klien: daftar kode yang diizinkan untuk peran SENDIRI
-- (dimuat sekali saat masuk, lihat js/db.js -> hakAksesSaya()). Untuk
-- master, isinya sengaja kosong — App.boleh() di klien juga punya jaring
-- pengaman "master selalu boleh", sama seperti di database.
create or replace view public.v_hak_akses_saya with (security_invoker = true) as
select kode from public.hak_akses
 where peran = public.peran_saya() and diizinkan;

grant select on public.v_hak_akses_saya to authenticated;

-- ---------------------------------------------------------------------
-- Pintasan hak akses per aksi/modul yang dipakai kebijakan di berkas ini.
-- Pola nama & bentuk SAMA seperti boleh_apotek()/boleh_kasir()/dkk di
-- berkas modul masing-masing (08,09,11,13,16) — supaya satu pola dipakai
-- di seluruh proyek, bukan dua cara berbeda.
-- ---------------------------------------------------------------------
create or replace function public.boleh_master_data() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('master_data') $$;

create or replace function public.boleh_pasien_simpan() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('pasien_simpan') $$;

create or replace function public.boleh_pasien_hapus() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('pasien_hapus') $$;

create or replace function public.boleh_pasien_alergi() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('pasien_alergi') $$;

create or replace function public.boleh_kunjungan_daftar() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('kunjungan_daftar') $$;

create or replace function public.boleh_kunjungan_ubah() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('kunjungan_ubah') $$;

create or replace function public.boleh_kunjungan_hapus() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('kunjungan_hapus') $$;

create or replace function public.boleh_kajian() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('kajian') $$;

create or replace function public.boleh_periksa() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('periksa') $$;

create or replace function public.boleh_audit_lihat() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('audit_lihat') $$;

create or replace function public.boleh_antrol_log() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('antrol_log') $$;

grant execute on function
  public.boleh_master_data(), public.boleh_pasien_simpan(), public.boleh_pasien_hapus(),
  public.boleh_pasien_alergi(), public.boleh_kunjungan_daftar(), public.boleh_kunjungan_ubah(),
  public.boleh_kunjungan_hapus(), public.boleh_kajian(), public.boleh_periksa(),
  public.boleh_audit_lihat(), public.boleh_antrol_log()
  to authenticated;

-- ---------------------------------------------------------------------
-- Hak akses tabel.
-- Supabase biasanya memberi GRANT ini otomatis, tetapi kita tulis eksplisit
-- agar skrip tetap benar bila dijalankan di PostgreSQL lain.
-- RLS di bawahlah yang benar-benar menyaring baris mana yang boleh dilihat.
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Kredensial bridging: browser tidak boleh menyentuhnya sama sekali.
revoke all on bridging_config from authenticated, anon;

-- Audit log hanya boleh dibaca (ditulis oleh trigger SECURITY DEFINER),
-- dan RLS membatasi pembacanya lewat kode `audit_lihat`.
revoke insert, update, delete on audit_log from authenticated;

-- Master ICD-10 & obat boleh dibaca semua staf; mengubah butuh kode `master_data`.

-- ---------------------------------------------------------------------
-- Aktifkan RLS di semua tabel
-- ---------------------------------------------------------------------
alter table faskes            enable row level security;
alter table poli              enable row level security;
alter table pegawai           enable row level security;
alter table icd10             enable row level security;
alter table obat              enable row level security;
alter table signa             enable row level security;
alter table pasien            enable row level security;
alter table pasien_alergi     enable row level security;
alter table kunjungan         enable row level security;
alter table kajian_awal       enable row level security;
alter table pemeriksaan       enable row level security;
alter table diagnosa          enable row level security;
alter table resep             enable row level security;
alter table resep_item        enable row level security;
alter table addendum          enable row level security;
alter table audit_log         enable row level security;
alter table bridging_log      enable row level security;
alter table bridging_antrean  enable row level security;
alter table bridging_config   enable row level security;

-- ---------------------------------------------------------------------
-- A. MASTER: semua staf boleh baca, kode `master_data` boleh ubah
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['faskes','poli','icd10','obat','signa']
  loop
    execute format('drop policy if exists %1$s_baca on %1$s', t);
    execute format($f$create policy %1$s_baca on %1$s for select
                     to authenticated using (public.saya_staf())$f$, t);

    execute format('drop policy if exists %1$s_kelola on %1$s', t);
    execute format($f$create policy %1$s_kelola on %1$s for all
                     to authenticated
                     using (public.boleh_master_data())
                     with check (public.boleh_master_data())$f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- B. PEGAWAI
--    Kelola akun & ubah peran SENGAJA hardcode master, TIDAK lewat kode
--    hak akses yang bisa diatur — sama alasannya dengan hak_akses_kelola
--    di atas: peran mana pun yang diberi izin ini bisa menaikkan dirinya
--    sendiri jadi master lewat halaman Pengguna.
-- ---------------------------------------------------------------------
drop policy if exists pegawai_baca on pegawai;
create policy pegawai_baca on pegawai for select
  to authenticated using (public.saya_staf() or id = auth.uid());

drop policy if exists pegawai_ubah_diri on pegawai;
create policy pegawai_ubah_diri on pegawai for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists pegawai_kelola on pegawai;
create policy pegawai_kelola on pegawai for all
  to authenticated
  using (public.peran_saya() = 'master')
  with check (public.peran_saya() = 'master');

-- ---------------------------------------------------------------------
-- C. PASIEN: semua staf klinis boleh baca; tulis diatur kode hak akses
-- ---------------------------------------------------------------------
drop policy if exists pasien_baca on pasien;
create policy pasien_baca on pasien for select
  to authenticated using (public.saya_staf());

drop policy if exists pasien_tulis on pasien;
create policy pasien_tulis on pasien for insert
  to authenticated
  with check (public.boleh_pasien_simpan());

drop policy if exists pasien_ubah on pasien;
create policy pasien_ubah on pasien for update
  to authenticated
  using (public.boleh_pasien_simpan())
  with check (public.boleh_pasien_simpan());

drop policy if exists pasien_hapus on pasien;
create policy pasien_hapus on pasien for delete
  to authenticated using (public.boleh_pasien_hapus());

drop policy if exists alergi_baca on pasien_alergi;
create policy alergi_baca on pasien_alergi for select
  to authenticated using (public.saya_staf());

drop policy if exists alergi_tulis on pasien_alergi;
create policy alergi_tulis on pasien_alergi for all
  to authenticated
  using (public.boleh_pasien_alergi())
  with check (public.boleh_pasien_alergi());

-- ---------------------------------------------------------------------
-- D. KUNJUNGAN
-- ---------------------------------------------------------------------
drop policy if exists kunjungan_baca on kunjungan;
create policy kunjungan_baca on kunjungan for select
  to authenticated using (public.saya_staf());

drop policy if exists kunjungan_daftar on kunjungan;
create policy kunjungan_daftar on kunjungan for insert
  to authenticated
  with check (public.boleh_kunjungan_daftar());

drop policy if exists kunjungan_ubah on kunjungan;
create policy kunjungan_ubah on kunjungan for update
  to authenticated
  using (public.boleh_kunjungan_ubah())
  with check (public.boleh_kunjungan_ubah());

drop policy if exists kunjungan_hapus on kunjungan;
create policy kunjungan_hapus on kunjungan for delete
  to authenticated using (public.boleh_kunjungan_hapus());

-- ---------------------------------------------------------------------
-- E. KAJIAN AWAL: kode `kajian` (perawat & dokter secara bawaan)
-- ---------------------------------------------------------------------
drop policy if exists kajian_baca on kajian_awal;
create policy kajian_baca on kajian_awal for select
  to authenticated using (public.saya_staf());

drop policy if exists kajian_tulis on kajian_awal;
create policy kajian_tulis on kajian_awal for all
  to authenticated
  using (public.boleh_kajian())
  with check (public.boleh_kajian());

-- ---------------------------------------------------------------------
-- F. PEMERIKSAAN, DIAGNOSA, RESEP: kode `periksa` (dokter secara bawaan)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['pemeriksaan','diagnosa','resep','resep_item','addendum']
  loop
    execute format('drop policy if exists %1$s_baca on %1$s', t);
    execute format($f$create policy %1$s_baca on %1$s for select
                     to authenticated using (public.saya_staf())$f$, t);

    execute format('drop policy if exists %1$s_tulis on %1$s', t);
    execute format($f$create policy %1$s_tulis on %1$s for all
                     to authenticated
                     using (public.boleh_periksa())
                     with check (public.boleh_periksa())$f$, t);
  end loop;
end $$;

-- Apoteker menandai resep sudah diserahkan: kebijakannya sendiri dipindah
-- ke sql/08_apotek.sql (bersebelahan dengan boleh_apotek(), yang baru ada
-- setelah berkas ini) supaya sekalian konsisten pakai kode `apotek` —
-- lihat catatan di sana soal kenapa ini dulu memakai 'apoteker' saja.

-- ---------------------------------------------------------------------
-- G. AUDIT & BRIDGING
-- ---------------------------------------------------------------------
drop policy if exists audit_baca on audit_log;
create policy audit_baca on audit_log for select
  to authenticated using (public.boleh_audit_lihat());
-- Penulisan audit_log dilakukan oleh trigger SECURITY DEFINER, bukan oleh klien.

drop policy if exists bridging_log_baca on bridging_log;
create policy bridging_log_baca on bridging_log for select
  to authenticated using (public.boleh_antrol_log());

drop policy if exists antrean_baca on bridging_antrean;
create policy antrean_baca on bridging_antrean for select
  to authenticated using (public.saya_staf());

drop policy if exists antrean_tulis on bridging_antrean;
create policy antrean_tulis on bridging_antrean for insert
  to authenticated with check (public.saya_staf());

-- PENTING: bridging_config sengaja TIDAK diberi policy untuk role `authenticated`.
-- Artinya browser tidak akan pernah bisa membacanya. Hanya Edge Function
-- (service_role) yang bisa. Kredensial PCare/SatuSehat disimpan sebagai
-- Secret di Edge Function, bukan di dalam tabel ini.

-- ---------------------------------------------------------------------
-- H. Otomatis buat baris `pegawai` saat user baru dibuat di Supabase Auth
--    Peran bawaan sekarang 'admin' (dulu 'pendaftaran') — staf loket,
--    peran paling umum untuk akun yang baru dibuat sebelum diatur manual.
-- ---------------------------------------------------------------------
create or replace function public.buat_profil_pegawai()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.pegawai (id, nama, peran)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'peran')::peran_pegawai, 'admin')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_auth_user_baru on auth.users;
create trigger trg_auth_user_baru after insert on auth.users
for each row execute function public.buat_profil_pegawai();

-- =====================================================================
--  I. ISIAN AWAL MATRIKS HAK AKSES
--
--  Mencerminkan PERSIS perilaku yang berlaku sebelum fitur ini ada, supaya
--  tidak ada perubahan perilaku di hari pertama migrasi. `on conflict do
--  nothing` supaya AMAN dijalankan ulang — tidak menimpa perubahan yang
--  sudah dibuat master lewat Pengaturan -> Hak Akses.
--
--  master TIDAK perlu baris di sini sama sekali (selalu lolos).
-- =====================================================================
insert into public.hak_akses (kode, peran, diizinkan) values
  ('pasien_simpan',     'admin',    true),
  ('pasien_simpan',     'perawat',  true),
  ('pasien_simpan',     'dokter',   true),
  ('pasien_alergi',     'perawat',  true),
  ('pasien_alergi',     'dokter',   true),
  ('pasien_alergi',     'apoteker', true),
  ('kunjungan_daftar',  'admin',    true),
  ('kunjungan_daftar',  'perawat',  true),
  ('kunjungan_daftar',  'dokter',   true),
  ('kunjungan_ubah',    'admin',    true),
  ('kunjungan_ubah',    'perawat',  true),
  ('kunjungan_ubah',    'dokter',   true),
  ('kunjungan_ubah',    'apoteker', true),
  ('kajian',            'perawat',  true),
  ('kajian',            'dokter',   true),
  ('periksa',           'dokter',   true),
  ('antrol_log',        'admin',    true),
  -- Menu (js/app.js) — sama seperti tabel di atas: hanya kode yang dulu
  -- terbuka untuk peran selain admin lama yang perlu baris di sini.
  ('menu_pendaftaran',  'admin',    true),
  ('menu_pendaftaran',  'perawat',  true),
  ('menu_pendaftaran',  'dokter',   true),
  ('menu_kasir',        'admin',    true),
  ('menu_laporan',      'dokter',   true),
  ('menu_laporan',      'admin',    true)
on conflict (kode, peran) do nothing;
-- Catatan: baris ('menu_kasir','kasir') SENGAJA tidak di sini — nilai enum
-- 'kasir' belum ada sampai sql/07_peran_kasir.sql dijalankan (nomor urut
-- SETELAH berkas ini). Baris itu ada di sql/09_kasir.sql, ditambahkan
-- setelah 07 dijalankan.
-- =====================================================================
--  RME Laboratorium Medis Utama - AUDIT TRAIL
--  Amanat PMK 24/2022: setiap akses & perubahan rekam medis harus terekam.
--  Jalankan SETELAH 02_rls.sql
-- =====================================================================

create or replace function public.catat_audit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_nama text;
  v_id   text;
begin
  select nama into v_nama from public.pegawai where id = auth.uid();

  if tg_op = 'DELETE' then
    v_id := coalesce(old.id::text, '-');
    insert into public.audit_log (user_id, user_nama, aksi, tabel, record_id, data_lama)
    values (auth.uid(), coalesce(v_nama,'sistem'), 'DELETE', tg_table_name, v_id, to_jsonb(old));
    return old;

  elsif tg_op = 'UPDATE' then
    v_id := coalesce(new.id::text, '-');
    -- hanya catat kalau memang ada yang berubah
    if to_jsonb(old) is distinct from to_jsonb(new) then
      insert into public.audit_log (user_id, user_nama, aksi, tabel, record_id, data_lama, data_baru)
      values (auth.uid(), coalesce(v_nama,'sistem'), 'UPDATE', tg_table_name, v_id,
              to_jsonb(old), to_jsonb(new));
    end if;
    return new;

  else
    v_id := coalesce(new.id::text, '-');
    insert into public.audit_log (user_id, user_nama, aksi, tabel, record_id, data_baru)
    values (auth.uid(), coalesce(v_nama,'sistem'), 'INSERT', tg_table_name, v_id, to_jsonb(new));
    return new;
  end if;
end $$;

-- Versi khusus untuk tabel yang primary key-nya kunjungan_id
create or replace function public.catat_audit_kunjungan()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_nama text;
begin
  select nama into v_nama from public.pegawai where id = auth.uid();
  if tg_op = 'DELETE' then
    insert into public.audit_log (user_id, user_nama, aksi, tabel, record_id, data_lama)
    values (auth.uid(), coalesce(v_nama,'sistem'), 'DELETE', tg_table_name, old.kunjungan_id::text, to_jsonb(old));
    return old;
  elsif tg_op = 'UPDATE' then
    if to_jsonb(old) is distinct from to_jsonb(new) then
      insert into public.audit_log (user_id, user_nama, aksi, tabel, record_id, data_lama, data_baru)
      values (auth.uid(), coalesce(v_nama,'sistem'), 'UPDATE', tg_table_name, new.kunjungan_id::text,
              to_jsonb(old), to_jsonb(new));
    end if;
    return new;
  else
    insert into public.audit_log (user_id, user_nama, aksi, tabel, record_id, data_baru)
    values (auth.uid(), coalesce(v_nama,'sistem'), 'INSERT', tg_table_name, new.kunjungan_id::text, to_jsonb(new));
    return new;
  end if;
end $$;

-- Pasang trigger pada tabel bertabel id
do $$
declare t text;
begin
  foreach t in array array['pasien','kunjungan','diagnosa','resep','resep_item','pasien_alergi','pegawai','addendum']
  loop
    execute format('drop trigger if exists trg_audit_%1$s on %1$s', t);
    execute format('create trigger trg_audit_%1$s after insert or update or delete on %1$s
                    for each row execute function public.catat_audit()', t);
  end loop;
end $$;

-- Pasang trigger pada tabel ber-PK kunjungan_id
do $$
declare t text;
begin
  foreach t in array array['kajian_awal','pemeriksaan']
  loop
    execute format('drop trigger if exists trg_audit_%1$s on %1$s', t);
    execute format('create trigger trg_audit_%1$s after insert or update or delete on %1$s
                    for each row execute function public.catat_audit_kunjungan()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Pencatatan AKSES (siapa membuka rekam medis siapa) — dipanggil dari aplikasi
-- ---------------------------------------------------------------------
create or replace function public.catat_akses_rm(p_pasien_id uuid, p_keterangan text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_nama text;
begin
  select nama into v_nama from public.pegawai where id = auth.uid();
  insert into public.audit_log (user_id, user_nama, aksi, tabel, record_id, keterangan)
  values (auth.uid(), coalesce(v_nama,'sistem'), 'VIEW_RM', 'pasien', p_pasien_id::text,
          coalesce(p_keterangan, 'Membuka rekam medis pasien'));
end $$;

grant execute on function public.catat_akses_rm(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- Retensi: rekam medis wajib disimpan minimal 25 tahun (PMK 24/2022 Pasal 39).
-- Karena itu TIDAK ada job penghapusan otomatis di sistem ini. Penghapusan
-- hanya bisa dilakukan manual oleh admin dan tetap terekam di audit_log.
-- ---------------------------------------------------------------------
-- =====================================================================
--  RME Laboratorium Medis Utama - DATA AWAL (SEED)
--  Jalankan SETELAH 03_audit.sql
--  Isi: profil klinik, poli, aturan pakai, ICD-10 tersering di FKTP,
--       dan daftar obat generik Fornas tingkat pertama.
--  Silakan sunting nama/alamat klinik sesuai data resmi Anda.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFIL KLINIK  (WAJIB DISUNTING)
-- ---------------------------------------------------------------------
insert into faskes (id, nama, jenis_faskes, alamat, kabupaten, provinsi, telepon)
values (1, 'Laboratorium Medis Utama', 'Klinik Pratama', 'Isi alamat klinik', '-', '-', '-')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. POLI
-- ---------------------------------------------------------------------
insert into poli (kode, nama, kode_pcare, urutan) values
  ('UMUM', 'Poli Umum',  '001', 1),
  ('GIGI', 'Poli Gigi',  '002', 2),
  ('KIA',  'Poli KIA / KB', '003', 3)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 3. ATURAN PAKAI (SIGNA)
-- ---------------------------------------------------------------------
insert into signa (kode, teks, frekuensi, dosis, urutan) values
  ('1dd1',   '1 x sehari 1 tablet',      1, 1,   1),
  ('2dd1',   '2 x sehari 1 tablet',      2, 1,   2),
  ('3dd1',   '3 x sehari 1 tablet',      3, 1,   3),
  ('3dd1/2', '3 x sehari 1/2 tablet',    3, 0.5, 4),
  ('4dd1',   '4 x sehari 1 tablet',      4, 1,   5),
  ('2dd1cth','2 x sehari 1 sendok teh',  2, 1,   6),
  ('3dd1cth','3 x sehari 1 sendok teh',  3, 1,   7),
  ('1dd1prn','1 x sehari bila perlu',    1, 1,   8),
  ('3dd1prn','3 x sehari bila perlu',    3, 1,   9),
  ('ue',     'Oleskan pada bagian yang sakit', null, null, 10)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 4. ICD-10 — diagnosis tersering di klinik pratama Indonesia
--    Kolom sering_dipakai = true akan muncul sebagai tombol cepat di form dokter.
-- ---------------------------------------------------------------------
insert into icd10 (kode, nama_en, nama_id, kategori, sering_dipakai) values
-- Saluran napas
('J00',   'Acute nasopharyngitis (common cold)', 'Selesma / Common cold', 'Saluran Napas', true),
('J01.9', 'Acute sinusitis, unspecified', 'Sinusitis akut', 'Saluran Napas', false),
('J02.9', 'Acute pharyngitis, unspecified', 'Faringitis akut', 'Saluran Napas', true),
('J03.9', 'Acute tonsillitis, unspecified', 'Tonsilitis akut', 'Saluran Napas', true),
('J04.0', 'Acute laryngitis', 'Laringitis akut', 'Saluran Napas', false),
('J06.9', 'Acute upper respiratory infection, unspecified', 'ISPA (Infeksi Saluran Napas Atas)', 'Saluran Napas', true),
('J11.1', 'Influenza with other respiratory manifestations', 'Influenza', 'Saluran Napas', true),
('J18.9', 'Pneumonia, unspecified', 'Pneumonia', 'Saluran Napas', false),
('J20.9', 'Acute bronchitis, unspecified', 'Bronkitis akut', 'Saluran Napas', true),
('J30.4', 'Allergic rhinitis, unspecified', 'Rinitis alergi', 'Saluran Napas', true),
('J31.0', 'Chronic rhinitis', 'Rinitis kronik', 'Saluran Napas', false),
('J35.0', 'Chronic tonsillitis', 'Tonsilitis kronik', 'Saluran Napas', false),
('J42',   'Unspecified chronic bronchitis', 'Bronkitis kronik', 'Saluran Napas', false),
('J44.9', 'COPD, unspecified', 'PPOK', 'Saluran Napas', false),
('J45.9', 'Asthma, unspecified', 'Asma bronkial', 'Saluran Napas', true),
('R05',   'Cough', 'Batuk', 'Saluran Napas', true),
-- Kardiovaskular
('I10',   'Essential (primary) hypertension', 'Hipertensi esensial (primer)', 'Kardiovaskular', true),
('I11.9', 'Hypertensive heart disease without heart failure', 'Penyakit jantung hipertensi', 'Kardiovaskular', false),
('I15.9', 'Secondary hypertension, unspecified', 'Hipertensi sekunder', 'Kardiovaskular', false),
('I20.9', 'Angina pectoris, unspecified', 'Angina pektoris', 'Kardiovaskular', false),
('I50.9', 'Heart failure, unspecified', 'Gagal jantung', 'Kardiovaskular', false),
('I83.9', 'Varicose veins of lower extremities', 'Varises tungkai', 'Kardiovaskular', false),
('I95.9', 'Hypotension, unspecified', 'Hipotensi', 'Kardiovaskular', false),
('R00.0', 'Tachycardia, unspecified', 'Takikardia', 'Kardiovaskular', false),
-- Endokrin & metabolik
('E11.9', 'Type 2 diabetes mellitus without complications', 'Diabetes Melitus Tipe 2', 'Endokrin & Metabolik', true),
('E11.6', 'Type 2 diabetes mellitus with other specified complications', 'DM Tipe 2 dengan komplikasi', 'Endokrin & Metabolik', false),
('E10.9', 'Type 1 diabetes mellitus without complications', 'Diabetes Melitus Tipe 1', 'Endokrin & Metabolik', false),
('E03.9', 'Hypothyroidism, unspecified', 'Hipotiroid', 'Endokrin & Metabolik', false),
('E05.9', 'Thyrotoxicosis, unspecified', 'Hipertiroid', 'Endokrin & Metabolik', false),
('E44.1', 'Mild protein-energy malnutrition', 'Gizi kurang', 'Endokrin & Metabolik', false),
('E66.9', 'Obesity, unspecified', 'Obesitas', 'Endokrin & Metabolik', true),
('E78.5', 'Hyperlipidaemia, unspecified', 'Dislipidemia / Hiperlipidemia', 'Endokrin & Metabolik', true),
('E86',   'Volume depletion', 'Dehidrasi', 'Endokrin & Metabolik', false),
('E87.6', 'Hypokalaemia', 'Hipokalemia', 'Endokrin & Metabolik', false),
('R73.9', 'Hyperglycaemia, unspecified', 'Hiperglikemia', 'Endokrin & Metabolik', false),
('E16.2', 'Hypoglycaemia, unspecified', 'Hipoglikemia', 'Endokrin & Metabolik', false),
-- Pencernaan
('A09',   'Diarrhoea and gastroenteritis of presumed infectious origin', 'Diare / Gastroenteritis akut', 'Pencernaan', true),
('K21.0', 'Gastro-oesophageal reflux disease with oesophagitis', 'GERD', 'Pencernaan', true),
('K29.7', 'Gastritis, unspecified', 'Gastritis', 'Pencernaan', true),
('K30',   'Functional dyspepsia', 'Dispepsia', 'Pencernaan', true),
('K59.0', 'Constipation', 'Konstipasi / Sembelit', 'Pencernaan', true),
('K52.9', 'Noninfective gastroenteritis and colitis, unspecified', 'Gastroenteritis non-infeksi', 'Pencernaan', false),
('K64.9', 'Haemorrhoids, unspecified', 'Hemoroid', 'Pencernaan', true),
('K11.5', 'Sialolithiasis', 'Batu kelenjar liur', 'Pencernaan', false),
('B82.9', 'Intestinal parasitism, unspecified', 'Kecacingan', 'Pencernaan', false),
('K02.9', 'Dental caries, unspecified', 'Karies gigi', 'Gigi & Mulut', true),
('K04.0', 'Pulpitis', 'Pulpitis', 'Gigi & Mulut', true),
('K04.7', 'Periapical abscess without sinus', 'Abses periapikal', 'Gigi & Mulut', false),
('K05.1', 'Chronic gingivitis', 'Gingivitis kronis', 'Gigi & Mulut', false),
('K08.1', 'Loss of teeth due to accident, extraction', 'Kehilangan gigi', 'Gigi & Mulut', false),
('K12.0', 'Recurrent oral aphthae', 'Stomatitis aftosa (sariawan)', 'Gigi & Mulut', true),
-- Infeksi & tropis
('A01.0', 'Typhoid fever', 'Demam tifoid', 'Infeksi', true),
('A15.0', 'Tuberculosis of lung, confirmed', 'TB Paru terkonfirmasi', 'Infeksi', false),
('A16.2', 'Tuberculosis of lung, without mention of confirmation', 'TB Paru klinis', 'Infeksi', false),
('A90',   'Dengue fever', 'Demam Dengue', 'Infeksi', true),
('A91',   'Dengue haemorrhagic fever', 'Demam Berdarah Dengue', 'Infeksi', true),
('B05.9', 'Measles without complication', 'Campak', 'Infeksi', false),
('B01.9', 'Varicella without complication', 'Cacar air (Varisela)', 'Infeksi', false),
('B02.9', 'Zoster without complication', 'Herpes zoster', 'Infeksi', false),
('B00.1', 'Herpesviral vesicular dermatitis', 'Herpes simpleks', 'Infeksi', false),
('B34.9', 'Viral infection, unspecified', 'Infeksi virus', 'Infeksi', true),
('B54',   'Unspecified malaria', 'Malaria', 'Infeksi', false),
('U07.1', 'COVID-19, virus identified', 'COVID-19', 'Infeksi', false),
('R50.9', 'Fever, unspecified', 'Demam', 'Infeksi', true),
-- Kulit
('L01.0', 'Impetigo', 'Impetigo', 'Kulit', false),
('L02.9', 'Cutaneous abscess, furuncle and carbuncle', 'Abses kulit / Bisul', 'Kulit', true),
('L03.9', 'Cellulitis, unspecified', 'Selulitis', 'Kulit', false),
('L20.9', 'Atopic dermatitis, unspecified', 'Dermatitis atopik', 'Kulit', true),
('L21.9', 'Seborrhoeic dermatitis, unspecified', 'Dermatitis seboroik', 'Kulit', false),
('L23.9', 'Allergic contact dermatitis, unspecified cause', 'Dermatitis kontak alergi', 'Kulit', true),
('L24.9', 'Irritant contact dermatitis, unspecified cause', 'Dermatitis kontak iritan', 'Kulit', false),
('L29.9', 'Pruritus, unspecified', 'Gatal / Pruritus', 'Kulit', true),
('L30.9', 'Dermatitis, unspecified', 'Dermatitis', 'Kulit', true),
('L50.9', 'Urticaria, unspecified', 'Urtikaria / Biduran', 'Kulit', true),
('L70.0', 'Acne vulgaris', 'Akne vulgaris (jerawat)', 'Kulit', false),
('L98.9', 'Disorder of skin, unspecified', 'Kelainan kulit lainnya', 'Kulit', false),
('B35.4', 'Tinea corporis', 'Tinea korporis (kurap badan)', 'Kulit', true),
('B35.6', 'Tinea cruris', 'Tinea kruris', 'Kulit', false),
('B35.3', 'Tinea pedis', 'Tinea pedis (kutu air)', 'Kulit', false),
('B36.0', 'Pityriasis versicolor', 'Panu (Pitiriasis versikolor)', 'Kulit', true),
('B37.2', 'Candidiasis of skin and nail', 'Kandidiasis kulit', 'Kulit', false),
('B86',   'Scabies', 'Skabies (kudis)', 'Kulit', true),
('T78.4', 'Allergy, unspecified', 'Reaksi alergi', 'Kulit', true),
-- Muskuloskeletal
('M06.9', 'Rheumatoid arthritis, unspecified', 'Artritis reumatoid', 'Muskuloskeletal', false),
('M10.9', 'Gout, unspecified', 'Gout / Asam urat', 'Muskuloskeletal', true),
('M13.9', 'Arthritis, unspecified', 'Artritis', 'Muskuloskeletal', false),
('M15.9', 'Polyosteoarthritis, unspecified', 'Osteoartritis multipel', 'Muskuloskeletal', false),
('M17.9', 'Gonarthrosis, unspecified', 'Osteoartritis lutut', 'Muskuloskeletal', true),
('M25.5', 'Pain in joint', 'Nyeri sendi', 'Muskuloskeletal', true),
('M54.2', 'Cervicalgia', 'Nyeri leher', 'Muskuloskeletal', true),
('M54.5', 'Low back pain', 'Nyeri punggung bawah (LBP)', 'Muskuloskeletal', true),
('M62.6', 'Muscle strain', 'Strain otot', 'Muskuloskeletal', false),
('M79.1', 'Myalgia', 'Mialgia (nyeri otot)', 'Muskuloskeletal', true),
('M77.9', 'Enthesopathy, unspecified', 'Entesopati', 'Muskuloskeletal', false),
('M81.9', 'Osteoporosis, unspecified', 'Osteoporosis', 'Muskuloskeletal', false),
-- Saraf & jiwa
('G43.9', 'Migraine, unspecified', 'Migren', 'Saraf', true),
('G44.2', 'Tension-type headache', 'Nyeri kepala tegang (TTH)', 'Saraf', true),
('G51.0', 'Bell palsy', 'Bell''s palsy', 'Saraf', false),
('G56.0', 'Carpal tunnel syndrome', 'Sindrom terowongan karpal', 'Saraf', false),
('G62.9', 'Polyneuropathy, unspecified', 'Polineuropati', 'Saraf', false),
('R42',   'Dizziness and giddiness', 'Pusing / Vertigo', 'Saraf', true),
('H81.1', 'Benign paroxysmal vertigo', 'Vertigo posisi paroksismal jinak', 'Saraf', true),
('R51',   'Headache', 'Nyeri kepala', 'Saraf', true),
('F41.9', 'Anxiety disorder, unspecified', 'Gangguan cemas', 'Jiwa', false),
('F32.9', 'Depressive episode, unspecified', 'Episode depresi', 'Jiwa', false),
('F51.0', 'Nonorganic insomnia', 'Insomnia non-organik', 'Jiwa', false),
('F45.9', 'Somatoform disorder, unspecified', 'Gangguan somatoform', 'Jiwa', false),
-- Mata & THT
('H10.9', 'Conjunctivitis, unspecified', 'Konjungtivitis', 'Mata', true),
('H00.0', 'Hordeolum', 'Hordeolum (bintitan)', 'Mata', false),
('H16.9', 'Keratitis, unspecified', 'Keratitis', 'Mata', false),
('H25.9', 'Senile cataract, unspecified', 'Katarak senilis', 'Mata', false),
('H52.4', 'Presbyopia', 'Presbiopia', 'Mata', false),
('H52.1', 'Myopia', 'Miopia', 'Mata', false),
('H57.1', 'Ocular pain', 'Nyeri mata', 'Mata', false),
('H60.9', 'Otitis externa, unspecified', 'Otitis eksterna', 'THT', true),
('H61.2', 'Impacted cerumen', 'Serumen prop', 'THT', true),
('H65.9', 'Nonsuppurative otitis media, unspecified', 'Otitis media non-supuratif', 'THT', false),
('H66.9', 'Otitis media, unspecified', 'Otitis media', 'THT', true),
('H92.0', 'Otalgia', 'Nyeri telinga', 'THT', false),
('R04.0', 'Epistaxis', 'Mimisan (epistaksis)', 'THT', false),
-- Ginjal & saluran kemih
('N39.0', 'Urinary tract infection, site not specified', 'Infeksi Saluran Kemih (ISK)', 'Urogenital', true),
('N30.9', 'Cystitis, unspecified', 'Sistitis', 'Urogenital', false),
('N20.0', 'Calculus of kidney', 'Batu ginjal', 'Urogenital', false),
('N18.9', 'Chronic kidney disease, unspecified', 'Penyakit Ginjal Kronik', 'Urogenital', false),
('N40',   'Benign prostatic hyperplasia', 'Pembesaran prostat jinak (BPH)', 'Urogenital', false),
('N76.0', 'Acute vaginitis', 'Vaginitis akut', 'Urogenital', false),
('N92.0', 'Excessive and frequent menstruation', 'Menoragia', 'Urogenital', false),
('N94.6', 'Dysmenorrhoea, unspecified', 'Dismenore', 'Urogenital', true),
('N91.2', 'Amenorrhoea, unspecified', 'Amenore', 'Urogenital', false),
-- Kehamilan & KIA
('Z34.9', 'Supervision of normal pregnancy, unspecified', 'Pemeriksaan kehamilan normal (ANC)', 'KIA', true),
('Z35.9', 'Supervision of high-risk pregnancy, unspecified', 'Kehamilan risiko tinggi', 'KIA', false),
('O21.0', 'Mild hyperemesis gravidarum', 'Hiperemesis gravidarum ringan', 'KIA', false),
('Z30.4', 'Surveillance of contraceptive drugs', 'Pelayanan KB - kontrasepsi hormonal', 'KIA', true),
('Z30.0', 'General counselling and advice on contraception', 'Konseling KB', 'KIA', false),
('Z39.2', 'Routine postpartum follow-up', 'Kontrol nifas', 'KIA', false),
('D50.9', 'Iron deficiency anaemia, unspecified', 'Anemia defisiensi besi', 'Darah', true),
('D64.9', 'Anaemia, unspecified', 'Anemia', 'Darah', false),
-- Pemeriksaan & lain-lain
('Z00.0', 'General medical examination', 'Pemeriksaan kesehatan umum', 'Pemeriksaan', true),
('Z00.1', 'Routine child health examination', 'Pemeriksaan kesehatan anak rutin', 'Pemeriksaan', false),
('Z01.7', 'Laboratory examination', 'Pemeriksaan laboratorium', 'Pemeriksaan', false),
('Z02.0', 'Examination for admission to educational institution', 'Surat keterangan sehat (sekolah)', 'Pemeriksaan', true),
('Z02.1', 'Pre-employment examination', 'Surat keterangan sehat (kerja)', 'Pemeriksaan', true),
('Z23',   'Encounter for immunization', 'Imunisasi', 'Pemeriksaan', true),
('Z71.3', 'Dietary counselling and surveillance', 'Konseling gizi', 'Pemeriksaan', false),
('Z76.0', 'Encounter for issue of repeat prescription', 'Kontrol / resep ulang obat rutin', 'Pemeriksaan', true),
('Z09.9', 'Follow-up examination after unspecified treatment', 'Kontrol pasca pengobatan', 'Pemeriksaan', true),
-- Cedera
('S00.9', 'Superficial injury of head, part unspecified', 'Luka lecet kepala', 'Cedera', false),
('S61.9', 'Open wound of wrist and hand, part unspecified', 'Luka terbuka tangan', 'Cedera', false),
('T14.0', 'Superficial injury of unspecified body region', 'Luka lecet / Vulnus excoriatum', 'Cedera', true),
('T14.1', 'Open wound of unspecified body region', 'Luka terbuka / Vulnus laceratum', 'Cedera', true),
('S93.4', 'Sprain and strain of ankle', 'Terkilir pergelangan kaki', 'Cedera', false),
('T30.0', 'Burn of unspecified body region, unspecified degree', 'Luka bakar', 'Cedera', false),
('W57',   'Bitten or stung by nonvenomous insect', 'Gigitan serangga', 'Cedera', false),
('T63.4', 'Venom of other arthropods', 'Sengatan/racun artropoda', 'Cedera', false),
-- Gejala umum
('R11',   'Nausea and vomiting', 'Mual dan muntah', 'Gejala Umum', true),
('R10.4', 'Other and unspecified abdominal pain', 'Nyeri perut', 'Gejala Umum', true),
('R53',   'Malaise and fatigue', 'Lemas / Kelelahan', 'Gejala Umum', true),
('R63.0', 'Anorexia', 'Nafsu makan menurun', 'Gejala Umum', false),
('R06.0', 'Dyspnoea', 'Sesak napas', 'Gejala Umum', false),
('R07.4', 'Chest pain, unspecified', 'Nyeri dada', 'Gejala Umum', false),
('R60.0', 'Localized oedema', 'Bengkak lokal', 'Gejala Umum', false),
('R21',   'Rash and other nonspecific skin eruption', 'Ruam kulit', 'Gejala Umum', false)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 5. OBAT — generik yang umum tersedia di klinik pratama (Fornas FKTP)
--    Kolom kode_kfa diisi belakangan dari Kamus Farmasi & Alkes SatuSehat.
-- ---------------------------------------------------------------------
insert into obat (kode_internal, nama, nama_generik, bentuk_sediaan, kekuatan, satuan, golongan, formularium) values
  ('OB001','Paracetamol 500 mg','Paracetamol','Tablet','500 mg','Tablet','Bebas', true),
  ('OB002','Paracetamol Sirup 120 mg/5 mL','Paracetamol','Sirup','120 mg/5 mL','Botol','Bebas', true),
  ('OB003','Amoxicillin 500 mg','Amoxicillin','Kaplet','500 mg','Tablet','Keras', true),
  ('OB004','Amoxicillin Sirup Kering 125 mg/5 mL','Amoxicillin','Sirup kering','125 mg/5 mL','Botol','Keras', true),
  ('OB005','Cefadroxil 500 mg','Cefadroxil','Kapsul','500 mg','Kapsul','Keras', true),
  ('OB006','Ciprofloxacin 500 mg','Ciprofloxacin','Tablet','500 mg','Tablet','Keras', true),
  ('OB007','Cotrimoxazole 480 mg','Sulfametoksazol-Trimetoprim','Tablet','480 mg','Tablet','Keras', true),
  ('OB008','Metronidazole 500 mg','Metronidazole','Tablet','500 mg','Tablet','Keras', true),
  ('OB009','Eritromisin 500 mg','Eritromisin','Tablet','500 mg','Tablet','Keras', true),
  ('OB010','Ibuprofen 400 mg','Ibuprofen','Tablet','400 mg','Tablet','Keras', true),
  ('OB011','Natrium Diklofenak 50 mg','Natrium Diklofenak','Tablet','50 mg','Tablet','Keras', true),
  ('OB012','Asam Mefenamat 500 mg','Asam Mefenamat','Kaplet','500 mg','Tablet','Keras', true),
  ('OB013','Meloxicam 7,5 mg','Meloxicam','Tablet','7,5 mg','Tablet','Keras', true),
  ('OB014','Dexamethasone 0,5 mg','Dexamethasone','Tablet','0,5 mg','Tablet','Keras', true),
  ('OB015','Methylprednisolone 4 mg','Methylprednisolone','Tablet','4 mg','Tablet','Keras', true),
  ('OB016','Chlorpheniramine Maleate 4 mg','CTM','Tablet','4 mg','Tablet','Bebas Terbatas', true),
  ('OB017','Cetirizine 10 mg','Cetirizine','Tablet','10 mg','Tablet','Bebas Terbatas', true),
  ('OB018','Loratadine 10 mg','Loratadine','Tablet','10 mg','Tablet','Bebas Terbatas', true),
  ('OB019','Ambroxol 30 mg','Ambroxol','Tablet','30 mg','Tablet','Bebas Terbatas', true),
  ('OB020','Gliseril Guaiakolat 100 mg','Guaifenesin','Tablet','100 mg','Tablet','Bebas', true),
  ('OB021','OBH Sirup','Obat Batuk Hitam','Sirup','-','Botol','Bebas', true),
  ('OB022','Salbutamol 2 mg','Salbutamol','Tablet','2 mg','Tablet','Keras', true),
  ('OB023','Antasida DOEN','Antasida','Tablet kunyah','-','Tablet','Bebas', true),
  ('OB024','Ranitidine 150 mg','Ranitidine','Tablet','150 mg','Tablet','Keras', false),
  ('OB025','Omeprazole 20 mg','Omeprazole','Kapsul','20 mg','Kapsul','Keras', true),
  ('OB026','Lansoprazole 30 mg','Lansoprazole','Kapsul','30 mg','Kapsul','Keras', true),
  ('OB027','Domperidone 10 mg','Domperidone','Tablet','10 mg','Tablet','Keras', true),
  ('OB028','Attapulgite 600 mg','Attapulgite','Tablet','600 mg','Tablet','Bebas', true),
  ('OB029','Oralit','Oralit','Serbuk','-','Sachet','Bebas', true),
  ('OB030','Zinc 20 mg','Zinc Sulfat','Tablet dispersibel','20 mg','Tablet','Bebas', true),
  ('OB031','Amlodipine 5 mg','Amlodipine','Tablet','5 mg','Tablet','Keras', true),
  ('OB032','Amlodipine 10 mg','Amlodipine','Tablet','10 mg','Tablet','Keras', true),
  ('OB033','Captopril 25 mg','Captopril','Tablet','25 mg','Tablet','Keras', true),
  ('OB034','Lisinopril 10 mg','Lisinopril','Tablet','10 mg','Tablet','Keras', true),
  ('OB035','Candesartan 8 mg','Candesartan','Tablet','8 mg','Tablet','Keras', true),
  ('OB036','Bisoprolol 5 mg','Bisoprolol','Tablet','5 mg','Tablet','Keras', true),
  ('OB037','Hydrochlorothiazide 25 mg','HCT','Tablet','25 mg','Tablet','Keras', true),
  ('OB038','Furosemide 40 mg','Furosemide','Tablet','40 mg','Tablet','Keras', true),
  ('OB039','Simvastatin 20 mg','Simvastatin','Tablet','20 mg','Tablet','Keras', true),
  ('OB040','Atorvastatin 20 mg','Atorvastatin','Tablet','20 mg','Tablet','Keras', true),
  ('OB041','Metformin 500 mg','Metformin','Tablet','500 mg','Tablet','Keras', true),
  ('OB042','Glimepiride 2 mg','Glimepiride','Tablet','2 mg','Tablet','Keras', true),
  ('OB043','Glibenclamide 5 mg','Glibenclamide','Tablet','5 mg','Tablet','Keras', true),
  ('OB044','Allopurinol 100 mg','Allopurinol','Tablet','100 mg','Tablet','Keras', true),
  ('OB045','Colchicine 0,5 mg','Colchicine','Tablet','0,5 mg','Tablet','Keras', true),
  ('OB046','Vitamin B Kompleks','Vitamin B Kompleks','Tablet','-','Tablet','Bebas', true),
  ('OB047','Vitamin B1 50 mg','Thiamine','Tablet','50 mg','Tablet','Bebas', true),
  ('OB048','Vitamin B6 10 mg','Pyridoxine','Tablet','10 mg','Tablet','Bebas', true),
  ('OB049','Vitamin B12 50 mcg','Cyanocobalamin','Tablet','50 mcg','Tablet','Bebas', true),
  ('OB050','Vitamin C 50 mg','Asam Askorbat','Tablet','50 mg','Tablet','Bebas', true),
  ('OB051','Tablet Tambah Darah (Fe + Asam Folat)','Ferrous Fumarate','Tablet','60 mg','Tablet','Bebas', true),
  ('OB052','Asam Folat 1 mg','Asam Folat','Tablet','1 mg','Tablet','Bebas', true),
  ('OB053','Kalsium Laktat 500 mg','Kalsium Laktat','Tablet','500 mg','Tablet','Bebas', true),
  ('OB054','Albendazole 400 mg','Albendazole','Tablet','400 mg','Tablet','Bebas Terbatas', true),
  ('OB055','Griseofulvin 125 mg','Griseofulvin','Tablet','125 mg','Tablet','Keras', true),
  ('OB056','Ketoconazole Krim 2%','Ketoconazole','Krim','2%','Tube','Keras', true),
  ('OB057','Miconazole Krim 2%','Miconazole','Krim','2%','Tube','Bebas Terbatas', true),
  ('OB058','Hidrokortison Krim 2,5%','Hidrokortison','Krim','2,5%','Tube','Keras', true),
  ('OB059','Betamethasone Krim 0,1%','Betamethasone','Krim','0,1%','Tube','Keras', true),
  ('OB060','Gentamicin Salep 0,1%','Gentamicin','Salep','0,1%','Tube','Keras', true),
  ('OB061','Salep 2-4 (Asam Salisilat-Sulfur)','Asam Salisilat-Sulfur','Salep','-','Pot','Bebas', true),
  ('OB062','Permethrin Krim 5%','Permethrin','Krim','5%','Tube','Keras', true),
  ('OB063','Kloramfenikol Tetes Mata 0,5%','Kloramfenikol','Tetes mata','0,5%','Botol','Keras', true),
  ('OB064','Kloramfenikol Tetes Telinga 3%','Kloramfenikol','Tetes telinga','3%','Botol','Keras', true),
  ('OB065','Povidone Iodine 10%','Povidone Iodine','Larutan','10%','Botol','Bebas', true),
  ('OB066','Betahistine Mesylate 6 mg','Betahistine','Tablet','6 mg','Tablet','Keras', true),
  ('OB067','Dimenhydrinate 50 mg','Dimenhydrinate','Tablet','50 mg','Tablet','Bebas Terbatas', true),
  ('OB068','Hyoscine-N-butylbromide 10 mg','Hyoscine','Tablet','10 mg','Tablet','Keras', true),
  ('OB069','Bisacodyl 5 mg','Bisacodyl','Tablet salut','5 mg','Tablet','Bebas Terbatas', true),
  ('OB070','Lactulose Sirup','Lactulose','Sirup','-','Botol','Keras', true)
on conflict (kode_internal) do nothing;

-- ---------------------------------------------------------------------
-- 6. Konfigurasi bridging (belum aktif — kredensial disimpan di Edge Function)
-- ---------------------------------------------------------------------
insert into bridging_config (sistem, aktif, mode, base_url) values
  ('PCARE',     false, 'SANDBOX', 'https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev'),
  ('SATUSEHAT', false, 'SANDBOX', 'https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1')
on conflict (sistem) do nothing;
-- =====================================================================
--  RME Laboratorium Medis Utama — MODUL POLI GIGI
--  Odontogram per bidang gigi, pemeriksaan gigi, dan tindakan ICD-9-CM.
--  Jalankan SETELAH 04_seed.sql
--
--  Yang ditambahkan:
--   - ref_gigi          : 52 gigi (32 tetap + 20 sulung) penomoran FDI
--   - ref_bidang_gigi   : 5 bidang gigi + kode SNOMED-nya
--   - ref_kondisi_gigi  : notasi odontogram standar Indonesia (sou, car, amf, …)
--   - odontogram        : keadaan gigi pasien saat ini
--   - odontogram_riwayat: perubahan tiap kunjungan, terekam otomatis
--   - pemeriksaan_gigi  : ekstra oral, intra oral, OHI, indeks DMF-T
--   - icd9cm            : master kode tindakan
--   - tindakan          : tindakan yang dilakukan pada satu kunjungan
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Penyesuaian tabel yang sudah ada
-- ---------------------------------------------------------------------
do $$ begin
  create type jenis_poli_t as enum ('UMUM','GIGI','KIA','LAINNYA');
exception when duplicate_object then null; end $$;

alter table poli    add column if not exists jenis jenis_poli_t not null default 'UMUM';
alter table pegawai add column if not exists jenis_dokter text;   -- 'UMUM' | 'GIGI'
comment on column pegawai.jenis_dokter is
  'Diisi untuk peran dokter: UMUM atau GIGI. Dipakai menyaring pilihan dokter sesuai poli.';

update poli set jenis = 'GIGI'  where kode = 'GIGI' and jenis = 'UMUM';
update poli set jenis = 'KIA'   where kode = 'KIA'  and jenis = 'UMUM';

-- =====================================================================
--  A. MASTER GIGI
-- =====================================================================

-- A1. 52 gigi, penomoran FDI dua digit
create table if not exists ref_gigi (
  fdi           text primary key,              -- '11' … '48', '51' … '85'
  nama          text not null,
  kuadran       smallint not null,             -- 1..8
  rahang        text not null,                 -- ATAS | BAWAH
  sisi          text not null,                 -- KANAN | KIRI
  jenis         text not null,                 -- TETAP | SULUNG
  posisi        smallint not null,             -- urutan dari garis tengah (1..8 / 1..5)
  -- Diisi belakangan dari Lampiran Terminologi Gigi SatuSehat (Tabel 1).
  -- Selama kosong, bodySite tidak dikirim dan sisa payload tetap valid.
  kode_snomed   text
);
comment on column ref_gigi.kode_snomed is
  'Kode SNOMED CT struktur gigi untuk Observation.bodySite SatuSehat. '
  'Isi dari Lampiran Terminologi Gigi (Tabel 1) setelah klinik terdaftar di SatuSehat.';

do $$
declare
  k smallint; p smallint; batas smallint;
  nm_tetap  text[] := array['Insisivus sentral','Insisivus lateral','Kaninus',
                            'Premolar pertama','Premolar kedua',
                            'Molar pertama','Molar kedua','Molar ketiga'];
  nm_sulung text[] := array['Insisivus sentral sulung','Insisivus lateral sulung',
                            'Kaninus sulung','Molar pertama sulung','Molar kedua sulung'];
  v_rahang text; v_sisi text; v_jenis text; v_nama text;
begin
  for k in 1..8 loop
    v_jenis  := case when k <= 4 then 'TETAP' else 'SULUNG' end;
    batas    := case when k <= 4 then 8 else 5 end;
    v_rahang := case when k in (1,2,5,6) then 'ATAS' else 'BAWAH' end;
    v_sisi   := case when k in (1,4,5,8) then 'KANAN' else 'KIRI' end;
    for p in 1..batas loop
      v_nama := case when v_jenis = 'TETAP' then nm_tetap[p] else nm_sulung[p] end
                || ' ' || lower(v_rahang) || ' ' || lower(v_sisi);
      insert into ref_gigi (fdi, nama, kuadran, rahang, sisi, jenis, posisi)
      values (k::text || p::text, v_nama, k, v_rahang, v_sisi, v_jenis, p)
      on conflict (fdi) do nothing;
    end loop;
  end loop;
end $$;

-- Dua kode SNOMED yang sudah terverifikasi dari dokumentasi SatuSehat,
-- sebagai contoh format pengisian sisanya.
update ref_gigi set kode_snomed = '422653006' where fdi = '11' and kode_snomed is null;
update ref_gigi set kode_snomed = '866005003' where fdi = '46' and kode_snomed is null;

-- A2. Bidang gigi
create table if not exists ref_bidang_gigi (
  kode        text primary key,      -- O, M, D, V, L
  nama        text not null,
  nama_lain   text,
  kode_snomed text,
  urutan      smallint
);
insert into ref_bidang_gigi (kode, nama, nama_lain, kode_snomed, urutan) values
  ('O', 'Oklusal',  'Insisal (gigi depan)',        '257885003', 1),
  ('M', 'Mesial',   'Sisi ke arah garis tengah',   '710099007', 2),
  ('D', 'Distal',   'Sisi menjauhi garis tengah',  '46053002',  3),
  ('V', 'Vestibular','Bukal / labial (sisi pipi)', '302990001', 4),
  ('L', 'Lingual',  'Palatal (sisi lidah/langit)', '255579002', 5)
on conflict (kode) do nothing;

-- A3. Kondisi gigi — notasi odontogram standar Indonesia
create table if not exists ref_kondisi_gigi (
  kode        text primary key,
  nama        text not null,
  kategori    text not null,           -- KONDISI | TAMBALAN | PERAWATAN | MAHKOTA | PROTESA
  per_bidang  boolean not null default false,  -- true = ditandai pada bidang tertentu
  -- eksklusif = menutup seluruh gigi, sehingga tanda per bidang tidak berlaku lagi
  -- (mis. gigi hilang). Kondisi non-eksklusif seperti perawatan saluran akar
  -- tetap membiarkan tambalan ditandai pada bidangnya.
  eksklusif   boolean not null default true,
  warna       text not null,           -- warna pada bagan
  perlu_rontgen boolean not null default false,
  kode_snomed text,
  komponen    text,                    -- kondisi | material | protesa (komponen Observation SatuSehat)
  urutan      smallint default 0,
  aktif       boolean not null default true
);

insert into ref_kondisi_gigi
  (kode, nama, kategori, per_bidang, eksklusif, warna, perlu_rontgen, kode_snomed, komponen, urutan) values
  -- Kondisi gigi
  ('sou','Sehat, tidak ada kelainan','KONDISI', true, true, '#FFFFFF', false,'162005007','kondisi', 1),
  ('car','Karies','KONDISI', true, true, '#DC2626', false,'80967001', 'kondisi', 2),
  ('cfr','Fraktur mahkota','KONDISI', false, false, '#EA580C', false, null,      'kondisi', 3),
  ('att','Atrisi / aus','KONDISI', false, false, '#D97706', false, null,      'kondisi', 4),
  ('ano','Anomali bentuk atau ukuran','KONDISI', false, false, '#DB2777', false,'OV000091', 'kondisi', 5),
  ('nvt','Gigi non-vital','KONDISI', false, false, '#7C3AED', true,  null,      'kondisi', 6),
  ('rrx','Sisa akar','KONDISI', false, true, '#991B1B', false, null,      'kondisi', 7),
  ('mis','Gigi hilang (dicabut)','KONDISI', false, true, '#94A3B8', false,'234948008','kondisi', 8),
  ('une','Belum erupsi','KONDISI', false, true, '#CBD5E1', true,  null,      'kondisi', 9),
  ('pre','Erupsi sebagian','KONDISI', false, false, '#A5B4FC', false, null,      'kondisi',10),
  ('non','Tidak ada keterangan','KONDISI', false, true, '#E2E8F0', false, null,      'kondisi',11),
  -- Tambalan
  ('amf','Tumpatan amalgam','TAMBALAN', true, true, '#1E293B', false,'256447001','material',20),
  ('cof','Tumpatan komposit','TAMBALAN', true, true, '#2563EB', false,'256452006','material',21),
  ('gif','Tumpatan glass ionomer','TAMBALAN', true, true, '#0EA5E9', false,'256454007','material',22),
  ('fis','Fissure sealant','TAMBALAN', true, true, '#16A34A', false, null,      'material',23),
  -- Perawatan
  ('rct','Perawatan saluran akar','PERAWATAN', false, false, '#7C3AED', true,  null,      'kondisi',30),
  -- Mahkota
  ('fmc','Mahkota logam penuh','MAHKOTA', false, true, '#64748B', false, null,      'protesa',40),
  ('poc','Mahkota porselen','MAHKOTA', false, true, '#A8A29E', false, null,      'protesa',41),
  ('mpc','Mahkota porselen-logam','MAHKOTA', false, true, '#78716C', false, null,      'protesa',42),
  ('gmc','Mahkota emas','MAHKOTA', false, true, '#CA8A04', false, null,      'protesa',43),
  -- Protesa & jembatan
  ('ipx','Implan','PROTESA', false, true, '#0F766E', false, null,      'protesa',50),
  ('abu','Abutment jembatan','PROTESA', false, true, '#475569', false, null,      'protesa',51),
  ('pon','Pontik jembatan','PROTESA', false, true, '#64748B', false, null,      'protesa',52),
  ('meb','Jembatan logam','PROTESA', false, true, '#475569', false, null,      'protesa',53),
  ('pob','Jembatan porselen','PROTESA', false, true, '#78716C', false, null,      'protesa',54),
  ('prd','Gigi tiruan sebagian lepasan','PROTESA', false, true, '#6366F1',false,'272256008','protesa',55),
  ('fld','Gigi tiruan penuh','PROTESA', false, true, '#4F46E5', false,'272253000','protesa',56)
on conflict (kode) do nothing;

-- =====================================================================
--  B. ODONTOGRAM
-- =====================================================================

-- B1. Keadaan gigi pasien saat ini — satu baris per gigi yang punya catatan.
--     Gigi tanpa baris dianggap sehat / belum diperiksa.
create table if not exists odontogram (
  pasien_id     uuid not null references pasien(id) on delete cascade,
  fdi           text not null references ref_gigi(fdi),
  kondisi       text references ref_kondisi_gigi(kode),   -- kondisi seluruh gigi
  bidang        jsonb not null default '{}'::jsonb,       -- {"O":"car","M":"amf"}
  catatan       text,
  kunjungan_id  uuid references kunjungan(id) on delete set null,
  diperbarui_pada timestamptz not null default now(),
  diperbarui_oleh uuid references pegawai(id),
  primary key (pasien_id, fdi)
);
create index if not exists idx_odontogram_pasien on odontogram (pasien_id);
comment on column odontogram.bidang is
  'Kondisi per bidang gigi. Kunci: O, M, D, V, L. Nilai: kode dari ref_kondisi_gigi.';

-- B2. Riwayat perubahan odontogram, diisi otomatis oleh trigger.
--     Ini yang membuat odontogram bisa dilihat "sebagaimana saat kunjungan itu".
create table if not exists odontogram_riwayat (
  id            bigserial primary key,
  pasien_id     uuid not null,
  fdi           text not null,
  kunjungan_id  uuid references kunjungan(id) on delete set null,
  kondisi_lama  text,  bidang_lama  jsonb,
  kondisi_baru  text,  bidang_baru  jsonb,
  waktu         timestamptz not null default now(),
  oleh          uuid
);
create index if not exists idx_odo_riwayat_pasien on odontogram_riwayat (pasien_id, waktu desc);
create index if not exists idx_odo_riwayat_kunjungan on odontogram_riwayat (kunjungan_id);

create or replace function catat_perubahan_odontogram()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into odontogram_riwayat (pasien_id, fdi, kunjungan_id,
                                    kondisi_lama, bidang_lama, kondisi_baru, bidang_baru, oleh)
    values (old.pasien_id, old.fdi, old.kunjungan_id,
            old.kondisi, old.bidang, null, null, auth.uid());
    return old;
  end if;

  if tg_op = 'UPDATE'
     and old.kondisi is not distinct from new.kondisi
     and old.bidang  is not distinct from new.bidang then
    return new;                                   -- tidak ada yang berubah
  end if;

  insert into odontogram_riwayat (pasien_id, fdi, kunjungan_id,
                                  kondisi_lama, bidang_lama, kondisi_baru, bidang_baru, oleh)
  values (new.pasien_id, new.fdi, new.kunjungan_id,
          case when tg_op = 'UPDATE' then old.kondisi end,
          case when tg_op = 'UPDATE' then old.bidang end,
          new.kondisi, new.bidang, auth.uid());
  return new;
end $$;

drop trigger if exists trg_riwayat_odontogram on odontogram;
create trigger trg_riwayat_odontogram
after insert or update or delete on odontogram
for each row execute function catat_perubahan_odontogram();

-- =====================================================================
--  C. PEMERIKSAAN GIGI
-- =====================================================================
create table if not exists pemeriksaan_gigi (
  kunjungan_id  uuid primary key references kunjungan(id) on delete cascade,
  -- Ekstra oral
  wajah             text,          -- Simetris | Asimetris
  kelenjar_limfe    text,          -- Tidak teraba | Teraba kiri | Teraba kanan | Teraba keduanya
  tmj               text,          -- Normal | Kliking | Nyeri
  bibir             text,
  ekstra_oral_lain  text,
  -- Intra oral
  mukosa_pipi   text,
  gusi          text,
  lidah         text,
  palatum       text,
  dasar_mulut   text,
  oklusi        text,              -- Normal bite | Cross bite | Deep bite | Open bite | Steep bite
  torus_palatinus    text,         -- Tidak ada | Kecil | Sedang | Besar | Multiple
  torus_mandibularis text,         -- Tidak ada | Sisi kiri | Sisi kanan | Kedua sisi
  supernumerary boolean default false,
  diastema      text,
  intra_oral_lain text,
  -- Kebersihan mulut & indeks
  kebersihan_mulut  text,          -- Baik | Sedang | Buruk
  ohis              numeric(4,2),
  -- Indeks DMF-T (gigi tetap) & def-t (gigi sulung) — dihitung dari odontogram
  d_decay       smallint,
  m_missing     smallint,
  f_filled      smallint,
  dmft          smallint generated always as
                  (coalesce(d_decay,0) + coalesce(m_missing,0) + coalesce(f_filled,0)) stored,
  d_sulung      smallint,
  e_sulung      smallint,
  f_sulung      smallint,
  deft          smallint generated always as
                  (coalesce(d_sulung,0) + coalesce(e_sulung,0) + coalesce(f_sulung,0)) stored,
  catatan       text,
  dibuat_oleh   uuid references pegawai(id),
  dibuat_pada   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_updated_pemeriksaan_gigi on pemeriksaan_gigi;
create trigger trg_updated_pemeriksaan_gigi before update on pemeriksaan_gigi
for each row execute function set_updated_at();

-- =====================================================================
--  D. TINDAKAN (ICD-9-CM)
-- =====================================================================
create table if not exists icd9cm (
  kode        text primary key,
  nama_id     text not null,
  nama_en     text,
  kategori    text,                          -- GIGI | UMUM | PENUNJANG
  sering_dipakai boolean not null default false,
  per_gigi    boolean not null default false, -- true = perlu menyebut nomor gigi
  aktif       boolean not null default true
);
create index if not exists idx_icd9_nama on icd9cm using gin (nama_id gin_trgm_ops);
create index if not exists idx_icd9_kode on icd9cm using gin (kode gin_trgm_ops);

create table if not exists tindakan (
  id            uuid primary key default uuid_generate_v4(),
  kunjungan_id  uuid not null references kunjungan(id) on delete cascade,
  kode_icd9     text not null references icd9cm(kode),
  nama          text not null,
  fdi           text references ref_gigi(fdi),   -- diisi untuk tindakan pada gigi tertentu
  jumlah        smallint not null default 1,
  catatan       text,
  dilakukan_oleh uuid references pegawai(id),
  dilakukan_pada timestamptz not null default now(),
  urutan        smallint default 0
);
create index if not exists idx_tindakan_kunjungan on tindakan (kunjungan_id);
create index if not exists idx_tindakan_kode on tindakan (kode_icd9);

-- ---------------------------------------------------------------------
-- Master tindakan — gigi dan tindakan umum yang lazim di klinik pratama
-- ---------------------------------------------------------------------
insert into icd9cm (kode, nama_id, nama_en, kategori, sering_dipakai, per_gigi) values
  -- Gigi: pencabutan
  ('23.01','Pencabutan gigi sulung','Extraction of deciduous tooth','GIGI', true, true),
  ('23.09','Pencabutan gigi tetap','Extraction of other tooth','GIGI', true, true),
  ('23.11','Pencabutan sisa akar','Removal of residual root','GIGI', true, true),
  ('23.19','Pencabutan gigi dengan penyulit (odontektomi)','Other surgical extraction of tooth','GIGI', false, true),
  -- Gigi: restorasi
  ('23.2', 'Penambalan gigi','Restoration of tooth by filling','GIGI', true, true),
  ('23.3', 'Restorasi gigi dengan inlay','Restoration of tooth by inlay','GIGI', false, true),
  ('23.41','Pemasangan mahkota gigi','Application of crown','GIGI', false, true),
  ('23.42','Pemasangan jembatan cekat','Insertion of fixed bridge','GIGI', false, true),
  ('23.43','Pemasangan jembatan lepasan','Insertion of removable bridge','GIGI', false, true),
  ('23.5', 'Implantasi gigi','Implantation of tooth','GIGI', false, true),
  ('23.6', 'Pemasangan implan gigi prostetik','Prosthetic dental implant','GIGI', false, true),
  -- Gigi: endodontik
  ('23.70','Perawatan saluran akar','Root canal, not otherwise specified','GIGI', true, true),
  ('23.71','Perawatan saluran akar dengan irigasi','Root canal therapy with irrigation','GIGI', false, true),
  ('23.72','Perawatan saluran akar dengan apikoektomi','Root canal therapy with apicoectomy','GIGI', false, true),
  ('23.73','Apikoektomi','Apicoectomy','GIGI', false, true),
  -- Gigi: gusi & jaringan lunak
  ('24.0', 'Insisi gusi atau tulang alveolar','Incision of gum or alveolar bone','GIGI', true, true),
  ('24.2', 'Gingivoplasti','Gingivoplasty','GIGI', false, true),
  ('24.31','Eksisi lesi atau jaringan gusi','Excision of lesion or tissue of gum','GIGI', false, true),
  ('24.32','Penjahitan luka gusi','Suture of laceration of gum','GIGI', false, true),
  ('24.39','Tindakan lain pada gusi','Other operations on gum','GIGI', false, true),
  ('24.5', 'Alveoloplasti','Alveoloplasty','GIGI', false, true),
  ('24.6', 'Membuka gigi terpendam','Exposure of tooth','GIGI', false, true),
  ('24.7', 'Pemasangan alat ortodonti','Application of orthodontic appliance','GIGI', false, false),
  ('24.99','Tindakan gigi lainnya','Other dental operations','GIGI', false, true),
  ('27.0', 'Drainase abses rongga mulut','Drainage of face and floor of mouth','GIGI', true, true),
  -- Gigi: pencegahan & pemeriksaan
  ('96.54','Skeling dan pembersihan karang gigi','Dental scaling, polishing and debridement','GIGI', true, false),
  ('89.31','Pemeriksaan gigi','Dental examination','GIGI', true, false),
  ('87.11','Rontgen gigi seluruh rahang','Full-mouth x-ray of teeth','PENUNJANG', false, false),
  ('87.12','Rontgen gigi (periapikal)','Other dental x-ray','PENUNJANG', false, true),
  -- Tindakan umum FKTP
  ('89.7', 'Pemeriksaan fisik umum','General physical examination','UMUM', true, false),
  ('86.59','Penjahitan luka (hecting)','Closure of skin and subcutaneous tissue','UMUM', true, false),
  ('86.28','Perawatan luka non-eksisi','Nonexcisional debridement of wound','UMUM', true, false),
  ('93.57','Penggantian balutan luka','Application of other wound dressing','UMUM', true, false),
  ('97.89','Pengangkatan jahitan','Removal of other therapeutic device','UMUM', true, false),
  ('86.04','Insisi dan drainase abses kulit','Incision with drainage of skin','UMUM', true, false),
  ('86.3', 'Eksisi lesi kulit','Local excision or destruction of lesion of skin','UMUM', false, false),
  ('96.52','Irigasi telinga (ekstraksi serumen)','Irrigation of ear','UMUM', true, false),
  ('93.94','Nebulisasi','Respiratory medication by nebulizer','UMUM', true, false),
  ('99.29','Injeksi obat lain','Injection of other therapeutic substance','UMUM', true, false),
  ('99.55','Imunisasi / vaksinasi','Prophylactic administration of vaccine','UMUM', true, false),
  ('89.52','Elektrokardiogram','Electrocardiogram','PENUNJANG', false, false),
  ('90.59','Pemeriksaan darah lainnya','Other microscopic examination of blood','PENUNJANG', true, false),
  ('91.89','Pemeriksaan urin lainnya','Other microscopic examination of urine','PENUNJANG', false, false)
on conflict (kode) do nothing;

-- Diagnosa gigi tambahan yang sering dipakai tapi belum ada di 04_seed.sql
insert into icd10 (kode, nama_en, nama_id, kategori, sering_dipakai) values
  ('K00.6','Disturbances in tooth eruption','Gangguan erupsi gigi','Gigi & Mulut', false),
  ('K01.1','Impacted teeth','Gigi impaksi','Gigi & Mulut', true),
  ('K03.6','Deposits on teeth','Karang gigi (kalkulus)','Gigi & Mulut', true),
  ('K04.1','Necrosis of pulp','Nekrosis pulpa','Gigi & Mulut', true),
  ('K04.4','Acute apical periodontitis of pulpal origin','Periodontitis apikalis akut','Gigi & Mulut', true),
  ('K04.5','Chronic apical periodontitis','Periodontitis apikalis kronis','Gigi & Mulut', false),
  ('K04.6','Periapical abscess with sinus','Abses periapikal dengan fistula','Gigi & Mulut', false),
  ('K05.0','Acute gingivitis','Gingivitis akut','Gigi & Mulut', true),
  ('K05.3','Chronic periodontitis','Periodontitis kronis','Gigi & Mulut', true),
  ('K06.8','Other specified disorders of gingiva','Kelainan gusi lainnya','Gigi & Mulut', false),
  ('K07.3','Anomalies of tooth position','Maloklusi / gigi berjejal','Gigi & Mulut', false),
  ('K08.3','Retained dental root','Sisa akar gigi','Gigi & Mulut', true),
  ('K08.8','Other specified disorders of teeth','Kelainan gigi lainnya','Gigi & Mulut', false),
  ('K12.1','Other forms of stomatitis','Stomatitis lainnya','Gigi & Mulut', false),
  ('K13.0','Diseases of lips','Kelainan bibir','Gigi & Mulut', false),
  ('S02.5','Fracture of tooth','Fraktur gigi','Gigi & Mulut', false)
on conflict (kode) do nothing;

-- =====================================================================
--  E. HAK AKSES (RLS) & AUDIT
-- =====================================================================
alter table ref_gigi           enable row level security;
alter table ref_bidang_gigi    enable row level security;
alter table ref_kondisi_gigi   enable row level security;
alter table icd9cm             enable row level security;
alter table odontogram         enable row level security;
alter table odontogram_riwayat enable row level security;
alter table pemeriksaan_gigi   enable row level security;
alter table tindakan           enable row level security;

grant select, insert, update, delete on ref_gigi, ref_bidang_gigi, ref_kondisi_gigi,
      icd9cm, odontogram, odontogram_riwayat, pemeriksaan_gigi, tindakan to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Master: semua staf boleh baca, kode `master_data` boleh ubah
do $$
declare t text;
begin
  foreach t in array array['ref_gigi','ref_bidang_gigi','ref_kondisi_gigi','icd9cm']
  loop
    execute format('drop policy if exists %1$s_baca on %1$s', t);
    execute format($f$create policy %1$s_baca on %1$s for select
                     to authenticated using (public.saya_staf())$f$, t);
    execute format('drop policy if exists %1$s_kelola on %1$s', t);
    execute format($f$create policy %1$s_kelola on %1$s for all to authenticated
                     using (public.boleh_master_data())
                     with check (public.boleh_master_data())$f$, t);
  end loop;
end $$;

-- Odontogram & pemeriksaan gigi: kode `periksa` (dokter, termasuk dokter gigi)
do $$
declare t text;
begin
  foreach t in array array['odontogram','pemeriksaan_gigi','tindakan']
  loop
    execute format('drop policy if exists %1$s_baca on %1$s', t);
    execute format($f$create policy %1$s_baca on %1$s for select
                     to authenticated using (public.saya_staf())$f$, t);
    execute format('drop policy if exists %1$s_tulis on %1$s', t);
    execute format($f$create policy %1$s_tulis on %1$s for all to authenticated
                     using (public.boleh_periksa())
                     with check (public.boleh_periksa())$f$, t);
  end loop;
end $$;

-- Riwayat odontogram hanya bisa dibaca; penulisannya lewat trigger SECURITY DEFINER
drop policy if exists odo_riwayat_baca on odontogram_riwayat;
create policy odo_riwayat_baca on odontogram_riwayat for select
  to authenticated using (public.saya_staf());
revoke insert, update, delete on odontogram_riwayat from authenticated;

-- Audit trail untuk tabel baru
drop trigger if exists trg_audit_tindakan on tindakan;
create trigger trg_audit_tindakan after insert or update or delete on tindakan
for each row execute function public.catat_audit();

drop trigger if exists trg_audit_pemeriksaan_gigi on pemeriksaan_gigi;
create trigger trg_audit_pemeriksaan_gigi after insert or update or delete on pemeriksaan_gigi
for each row execute function public.catat_audit_kunjungan();

-- =====================================================================
--  F. VIEW BANTU
-- =====================================================================

-- Odontogram lengkap: semua 52 gigi, digabung dengan kondisi yang tercatat
create or replace view v_odontogram with (security_invoker = true) as
select g.fdi, g.nama, g.kuadran, g.rahang, g.sisi, g.jenis, g.posisi, g.kode_snomed,
       o.pasien_id, o.kondisi, o.bidang, o.catatan, o.diperbarui_pada
from ref_gigi g
left join odontogram o on o.fdi = g.fdi;

-- Ringkasan tindakan per kunjungan
create or replace view v_tindakan_kunjungan with (security_invoker = true) as
select t.kunjungan_id, t.id, t.kode_icd9, t.nama, t.fdi, t.jumlah, t.catatan,
       t.dilakukan_pada, p.nama as nama_pelaksana, i.kategori
from tindakan t
join icd9cm i on i.kode = t.kode_icd9
left join pegawai p on p.id = t.dilakukan_oleh
order by t.urutan, t.dilakukan_pada;
-- =====================================================================
--  RME Laboratorium Medis Utama — NILAI BERKODE & KESIAPAN BRIDGING
--  Jalankan SETELAH 05_gigi.sql
--
--  Berkas ini tidak menambah fitur baru untuk pemakaian harian. Isinya
--  hal-hal yang murah dikerjakan sekarang tapi mahal kalau ditunda:
--
--   1. Kesadaran dan status pulang disimpan sebagai kode, bukan teks bebas.
--      Kalau nanti dipetakan ke kode PCare, yang perlu diisi hanya satu
--      tabel rujukan — bukan membersihkan ribuan catatan yang sudah ada.
--   2. Tanggal mulai bridging, supaya saat go-live sistem tahu data sejak
--      kapan yang perlu dikirim dan tidak membanjiri SatuSehat dengan
--      riwayat lama.
--   3. Dua view kesiapan data, supaya kekurangan data ketahuan sejak hari
--      pertama dan diperbaiki sambil jalan.
--
--  Semua perintah aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tanggal mulai bridging
-- ---------------------------------------------------------------------
alter table faskes add column if not exists bridging_mulai_tanggal date;
comment on column faskes.bridging_mulai_tanggal is
  'Kunjungan sejak tanggal ini yang akan dikirim ke SatuSehat/PCare. '
  'Dikosongkan selama bridging belum aktif. Diisi saat go-live agar riwayat '
  'sebelum tanggal itu tidak ikut terkirim.';

-- ---------------------------------------------------------------------
-- 2. Rujukan tingkat kesadaran
--    Kolom kode_pcare dan kode_snomed sengaja kosong: nilainya diambil dari
--    referensi resmi (PCare /kesadaran dan terminologi SatuSehat) yang baru
--    bisa diakses setelah klinik terdaftar. Kode internal di kolom `kode`
--    sudah stabil, jadi data yang terkumpul hari ini tidak perlu diubah.
-- ---------------------------------------------------------------------
create table if not exists ref_kesadaran (
  kode        text primary key,
  nama        text not null,
  keterangan  text,
  kode_pcare  text,
  kode_snomed text,
  urutan      smallint default 0,
  aktif       boolean not null default true
);

insert into ref_kesadaran (kode, nama, keterangan, urutan) values
  ('CM',          'Compos Mentis',  'Sadar penuh, orientasi baik', 1),
  ('APATIS',      'Apatis',         'Acuh tak acuh terhadap sekitar', 2),
  ('SOMNOLEN',    'Somnolen',       'Mengantuk, mudah dibangunkan', 3),
  ('DELIRIUM',    'Delirium',       'Gelisah, disorientasi, kadang halusinasi', 4),
  ('SOPOR',       'Sopor',          'Hanya bereaksi terhadap rangsang kuat', 5),
  ('SOPORO_KOMA', 'Soporo-koma',    'Reaksi sangat minimal', 6),
  ('KOMA',        'Koma',           'Tidak ada reaksi terhadap rangsang', 7)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 3. Rujukan status pulang
-- ---------------------------------------------------------------------
create table if not exists ref_status_pulang (
  kode        text primary key,
  nama        text not null,
  kode_pcare  text,
  urutan      smallint default 0,
  aktif       boolean not null default true
);

insert into ref_status_pulang (kode, nama, urutan) values
  ('SEMBUH',       'Sembuh',                  1),
  ('MEMBAIK',      'Membaik',                 2),
  ('BELUM_SEMBUH', 'Belum sembuh',            3),
  ('RUJUK',        'Dirujuk',                 4),
  ('APS',          'Atas permintaan sendiri', 5),
  ('MENINGGAL',    'Meninggal',               6)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 4. Kolom berkode pada tabel yang sudah ada
--    Kolom teks lama tetap disimpan agar catatan yang sudah terlanjur
--    dibuat tidak hilang; aplikasi mengisi keduanya sejak sekarang.
-- ---------------------------------------------------------------------
alter table kajian_awal add column if not exists kesadaran_kode text
  references ref_kesadaran(kode);
alter table pemeriksaan add column if not exists status_pulang_kode text
  references ref_status_pulang(kode);

-- Isi kode untuk catatan lama yang masih berupa teks
update kajian_awal ka set kesadaran_kode = r.kode
from ref_kesadaran r
where ka.kesadaran_kode is null and lower(trim(ka.kesadaran)) = lower(r.nama);

update pemeriksaan pm set status_pulang_kode = r.kode
from ref_status_pulang r
where pm.status_pulang_kode is null and lower(trim(pm.status_pulang)) = lower(r.nama);

-- ---------------------------------------------------------------------
-- 5. Kesiapan data pasien
--    SatuSehat mencari pasien berdasarkan NIK, jadi NIK yang benar adalah
--    syarat mutlak. Nomor BPJS hanya diperlukan bila pasien pernah berobat
--    dengan cara bayar BPJS.
-- ---------------------------------------------------------------------
create or replace view v_kesiapan_pasien with (security_invoker = true) as
select
  p.id, p.no_rm, p.nama, p.nik, p.no_bpjs, p.no_hp, p.tanggal_lahir,
  (select count(*) from kunjungan k where k.pasien_id = p.id) as jml_kunjungan,
  (select max(k.tanggal) from kunjungan k where k.pasien_id = p.id) as kunjungan_terakhir,
  array_remove(array[
    case when p.nik is null or p.nik !~ '^[0-9]{16}$'
         then 'NIK belum diisi atau bukan 16 angka' end,
    case when exists (select 1 from kunjungan k
                       where k.pasien_id = p.id and k.cara_bayar = 'BPJS')
              and (p.no_bpjs is null or p.no_bpjs !~ '^[0-9]{13}$')
         then 'Nomor BPJS belum diisi atau bukan 13 angka' end
  ], null) as kekurangan
from pasien p
where p.aktif;

comment on view v_kesiapan_pasien is
  'Pasien beserta data yang nanti dibutuhkan bridging tapi belum lengkap. '
  'Kolom kekurangan kosong berarti data pasien itu sudah siap.';

-- ---------------------------------------------------------------------
-- 6. Kesiapan data kunjungan
-- ---------------------------------------------------------------------
create or replace view v_kesiapan_kunjungan with (security_invoker = true) as
select
  k.id, k.no_kunjungan, k.tanggal, k.status, k.cara_bayar,
  k.satusehat_status, k.pcare_status,
  p.id as pasien_id, p.no_rm, p.nama as nama_pasien,
  po.nama as nama_poli, d.nama as nama_dokter,
  array_remove(array[
    case when p.nik is null or p.nik !~ '^[0-9]{16}$'
         then 'NIK pasien belum benar' end,
    case when k.dokter_id is null
         then 'Dokter pemeriksa belum ditentukan' end,
    case when k.dokter_id is not null and coalesce(d.satusehat_practitioner_id, '') = ''
         then 'Nomor IHS dokter belum diisi' end,
    case when coalesce(po.satusehat_location_id, '') = ''
         then 'Location ID poli belum diisi' end,
    case when not exists (select 1 from diagnosa dg where dg.kunjungan_id = k.id)
         then 'Belum ada diagnosa ICD-10' end,
    case when k.cara_bayar = 'BPJS' and coalesce(d.kode_dokter_pcare, '') = ''
         then 'Kode dokter PCare belum diisi' end,
    case when k.cara_bayar = 'BPJS' and coalesce(po.kode_pcare, '') = ''
         then 'Kode poli PCare belum diisi' end
  ], null) as kekurangan
from kunjungan k
join pasien p on p.id = k.pasien_id
join poli po on po.id = k.poli_id
left join pegawai d on d.id = k.dokter_id
where k.status = 'SELESAI';

comment on view v_kesiapan_kunjungan is
  'Kunjungan yang sudah selesai beserta data yang masih kurang untuk bridging. '
  'Dipakai halaman Pengaturan → Bridging untuk menunjukkan apa yang perlu dibereskan.';

-- ---------------------------------------------------------------------
-- 7. Hak akses
-- ---------------------------------------------------------------------
alter table ref_kesadaran     enable row level security;
alter table ref_status_pulang enable row level security;

grant select, insert, update, delete on ref_kesadaran, ref_status_pulang to authenticated;

do $$
declare t text;
begin
  foreach t in array array['ref_kesadaran','ref_status_pulang']
  loop
    execute format('drop policy if exists %1$s_baca on %1$s', t);
    execute format($f$create policy %1$s_baca on %1$s for select
                     to authenticated using (public.saya_staf())$f$, t);
    execute format('drop policy if exists %1$s_kelola on %1$s', t);
    execute format($f$create policy %1$s_kelola on %1$s for all to authenticated
                     using (public.boleh_master_data())
                     with check (public.boleh_master_data())$f$, t);
  end loop;
end $$;
-- =====================================================================
--  RME Laboratorium Medis Utama - PENAMBAHAN PERAN 'kasir'
--  Jalankan SETELAH 06_master.sql, SEBELUM 08_apotek.sql
--
--  BERKAS INI SENGAJA DIPISAH DAN HANYA BERISI SATU PERINTAH.
--  Alasannya teknis: PostgreSQL tidak mengizinkan nilai enum yang baru
--  ditambahkan dipakai di dalam transaksi yang sama. Kalau perintah ini
--  digabung ke berkas apotek/kasir, seluruh berkas akan gagal dengan
--  pesan "unsafe use of new value of enum type" — kegagalan yang
--  membingungkan karena penyebabnya jauh dari baris yang error.
--
--  Jalankan berkas ini sendirian, tunggu sampai selesai, baru lanjut.
-- =====================================================================

alter type peran_pegawai add value if not exists 'kasir';
-- =====================================================================
--  RME Laboratorium Medis Utama - MODUL APOTEK (STOK OBAT BATCH, FEFO)
--  Jalankan SETELAH 07_peran_kasir.sql
--
--  Diturunkan dari modul stok obat portal sipantau, dengan tiga
--  perbedaan yang disengaja:
--
--   1. Obat ditunjuk lewat obat_id ke master `obat`, bukan nama teks.
--      Di portal nama obat adalah teks bebas, sehingga "Amoxicillin 500mg"
--      dan "amoxicillin 500 mg" dari impor Excel menjadi dua obat berbeda
--      dan kartu stoknya pecah dua. RME sudah punya master obat; dipakai.
--
--   2. Alokasi FEFO dikerjakan di database, bukan di browser. Di portal
--      perhitungannya di JavaScript lalu mengirim UPDATE per batch — aman
--      untuk satu apoteker di satu komputer. Di sini apoteker dan kasir
--      bisa membuka halaman bersamaan; dua orang yang memotong batch yang
--      sama pada detik yang sama akan sama-sama membaca sisa 10 dan
--      sama-sama menguranginya. Penguncian di §D menutup celah itu.
--
--   3. Pengeluaran obat menyimpan kunjungan_id dan resep_item_id, jadi
--      setiap butir obat yang keluar bisa ditelusuri ke pasiennya.
--
--  Yang DISALIN apa adanya dari portal karena sudah terbukti:
--   - FEFO (bukan FIFO): yang paling dekat kadaluwarsa keluar duluan,
--     tanggal masuk hanya jadi pemutus seri.
--   - grup_id: satu penyerahan yang terpecah ke beberapa batch dibatalkan
--     serentak atau tidak sama sekali.
--   - Batch kadaluwarsa hanya boleh dikeluarkan lewat kategori pemusnahan.
-- =====================================================================


-- =====================================================================
--  A. FUNGSI BANTU
-- =====================================================================

-- A1. Tanggal menurut zona klinik, bukan zona server.
--
-- Supabase menjalankan Postgres pada UTC. Manado ada di WITA (UTC+8),
-- jadi current_date masih menunjukkan tanggal KEMARIN sampai pukul 08.00
-- pagi waktu setempat — persis jam klinik mulai menerima kiriman PBF dan
-- membuka layanan. Barang yang diterima pukul 07.30 akan tercatat masuk
-- di tanggal kemarin, dan rekap kas hari itu tidak akan pernah cocok.
--
-- Semua tanggal bawaan di modul apotek & kasir memakai fungsi ini.
create or replace function public.tgl_klinik() returns date
language sql stable as $$ select (now() at time zone 'Asia/Makassar')::date $$;

comment on function public.tgl_klinik() is
  'Tanggal hari ini menurut WITA (Asia/Makassar). Dipakai sebagai default
   tanggal transaksi apotek & kasir supaya tidak meleset satu hari pada
   jam pagi.';

grant execute on function public.tgl_klinik() to authenticated;


-- A2. Peran pengguna sebagai teks.
--
-- peran_saya() sudah ada di 02_rls.sql dan mengembalikan enum. Versi teks
-- ini dipakai oleh policy di modul apotek & kasir supaya tidak ada satu
-- pun literal enum baru ('kasir') yang muncul di berkas ini — lihat
-- catatan panjang di 07_peran_kasir.sql.
create or replace function public.peran_teks_saya() returns text
language sql stable security definer set search_path = public
as $$ select peran::text from public.pegawai where id = auth.uid() and aktif $$;

grant execute on function public.peran_teks_saya() to authenticated;

-- A3. Pintasan hak akses modul.
-- 9 Sep 2026: isinya sekarang lewat tabel hak_akses (bisa diatur master di
-- Pengaturan -> Hak Akses), bukan daftar peran tetap lagi — lihat
-- sql/02_rls.sql bagian HAK AKSES untuk fungsi generiknya.
create or replace function public.boleh_apotek() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('apotek') $$;

grant execute on function public.boleh_apotek() to authenticated;

-- Apoteker menandai resep sudah diserahkan langsung di tabel `resep`.
-- Dipindah ke sini (dari sql/02_rls.sql) supaya sekalian konsisten pakai
-- boleh_apotek() — sebelumnya hanya 'apoteker' literal, artinya admin/master
-- sebenarnya TIDAK bisa melakukan ini di database walau tombolnya di
-- apotek.js terlihat aktif untuk admin (klien mengizinkan, server menolak).
-- boleh_apotek() menyamakan keduanya: master selalu ikut lewat jaring
-- pengaman, dan kode `apotek` tetap default hanya untuk apoteker.
drop policy if exists resep_serah_apoteker on resep;
create policy resep_serah_apoteker on resep for update
  to authenticated
  using (public.boleh_apotek())
  with check (public.boleh_apotek());

-- Isian awal kode `apotek` — sama seperti sebelumnya (apoteker), plus
-- master lewat jaring pengaman di hak_akses_cek(). Aman dijalankan ulang.
insert into public.hak_akses (kode, peran, diizinkan) values
  ('apotek', 'apoteker', true)
on conflict (kode, peran) do nothing;


-- =====================================================================
--  B. TABEL
-- =====================================================================

-- B1. Satu baris = satu batch fisik di rak.
--
-- Batch dibedakan oleh gabungan (obat, tgl_expired, no_faktur, pbf,
-- harga_beli). Pemasukan dengan gabungan yang persis sama menambah stok
-- batch yang ada, bukan membuat baris baru — kalau tidak, satu obat yang
-- dibeli tiap minggu dari PBF yang sama akan menumpuk puluhan baris yang
-- sebenarnya satu tumpukan yang sama di rak.
create table if not exists apotek_batch (
  id            uuid primary key default uuid_generate_v4(),
  obat_id       uuid not null references obat(id),
  no_batch      text,
  tgl_expired   date not null,
  tgl_masuk     date not null default public.tgl_klinik(),
  no_faktur     text,
  pbf           text not null,
  harga_beli    numeric(14,2) not null default 0,   -- per satuan terkecil
  stok_awal     numeric(14,2) not null,
  stok_sisa     numeric(14,2) not null,
  keterangan    text,
  dibuat_oleh   uuid references pegawai(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint stok_awal_positif check (stok_awal > 0),
  constraint stok_sisa_wajar  check (stok_sisa >= 0 and stok_sisa <= stok_awal)
);

comment on table apotek_batch is
  'Persediaan obat per batch. Urutan keluar ditentukan FEFO: tgl_expired
   paling dekat lebih dulu, tgl_masuk jadi pemutus seri.';

-- Indeks urutan FEFO. Parsial supaya batch habis tidak ikut ditelusuri.
create index if not exists idx_batch_fefo
  on apotek_batch (obat_id, tgl_expired, tgl_masuk, created_at)
  where stok_sisa > 0;
create index if not exists idx_batch_obat    on apotek_batch (obat_id);
create index if not exists idx_batch_expired on apotek_batch (tgl_expired) where stok_sisa > 0;

-- Penggabungan batch identik bersandar pada indeks unik ini. no_faktur
-- boleh NULL, dan NULL tidak pernah sama dengan NULL di indeks unik biasa,
-- jadi dipakai coalesce ke string kosong.
create unique index if not exists uq_batch_identik on apotek_batch
  (obat_id, tgl_expired, coalesce(no_faktur,''), lower(pbf), harga_beli);


-- B2. Satu baris = satu pergerakan stok.
--
-- Tidak pernah di-UPDATE untuk mengoreksi. Koreksi dilakukan dengan
-- membatalkan grup (§D4), yang menulis pembatalannya sebagai peristiwa
-- tersendiri. Riwayat yang bisa ditimpa bukan riwayat.
create table if not exists apotek_transaksi (
  id             bigserial primary key,
  batch_id       uuid not null references apotek_batch(id) on delete cascade,
  obat_id        uuid not null references obat(id),
  nama_obat      text not null,          -- potret nama saat itu
  satuan         text not null,
  jenis          text not null check (jenis in ('MASUK','KELUAR')),
  kategori       text not null,
  jumlah         numeric(14,2) not null check (jumlah > 0),
  harga_satuan   numeric(14,2) not null default 0,
  total_nilai    numeric(14,2) not null default 0,
  tanggal        date not null default public.tgl_klinik(),
  no_faktur      text,
  pbf            text,
  -- Penghubung ke rekam medis. NULL untuk pembelian, pemusnahan, retur.
  kunjungan_id   uuid references kunjungan(id) on delete set null,
  pasien_id      uuid references pasien(id) on delete set null,
  resep_item_id  uuid references resep_item(id) on delete set null,
  -- Satu perintah pemakai; bisa terpecah ke beberapa batch.
  grup_id        uuid not null,
  -- Diisi saat baris ini adalah pembatalan baris lain.
  batal_dari     uuid,
  dibatalkan     boolean not null default false,
  keterangan     text,
  dibuat_oleh    uuid references pegawai(id),
  created_at     timestamptz not null default now()
);

create index if not exists idx_trx_tanggal   on apotek_transaksi (tanggal desc, id desc);
create index if not exists idx_trx_obat      on apotek_transaksi (obat_id, tanggal);
create index if not exists idx_trx_batch     on apotek_transaksi (batch_id);
create index if not exists idx_trx_grup      on apotek_transaksi (grup_id);
create index if not exists idx_trx_kunjungan on apotek_transaksi (kunjungan_id)
  where kunjungan_id is not null;


-- B3. Kolom tambahan pada resep yang sudah ada.
--
-- jumlah_diserahkan sengaja terpisah dari jumlah. Dokter menulis 30
-- tablet, apoteker menyerahkan 20 karena stok tipis — dua angka yang
-- berbeda dan sering. Kalau stok dipotong dari angka resep, kartu stok
-- akan melenceng dari rak dalam hitungan minggu, dan selisihnya tidak
-- akan pernah bisa ditelusuri.
alter table resep_item add column if not exists jumlah_diserahkan numeric(8,2);
alter table resep_item add column if not exists catatan_farmasi   text;

-- resep.status sudah ada dengan nilai 'DIBUAT' | 'DISERAHKAN'.
-- Ditambah dua nilai: 'DISIAPKAN' (sedang dikerjakan apoteker) dan
-- 'BATAL' (pasien tidak jadi menebus).
alter table resep add column if not exists diserahkan_sebagian boolean not null default false;


-- =====================================================================
--  C. KATEGORI PENGELUARAN
-- =====================================================================

-- Hanya kategori pemusnahan yang boleh mengambil dari batch kadaluwarsa —
-- itu justru gunanya. Untuk kategori lain, batch kadaluwarsa terkunci:
-- obat kadaluwarsa tidak boleh sampai ke tangan pasien hanya karena ia
-- kebetulan paling depan dalam antrean FEFO.
create or replace function public.apotek_kategori_pemusnahan() returns text[]
language sql immutable as $$ select array['Obat Expired','Obat Rusak','Retur ke PBF'] $$;

create or replace function public.apotek_kategori_keluar() returns text[]
language sql immutable as $$ select array[
  'Resep Pasien', 'Penjualan Bebas', 'Obat Expired', 'Obat Rusak',
  'Retur ke PBF', 'Penyesuaian Stok', 'Lainnya'
] $$;

grant execute on function public.apotek_kategori_pemusnahan() to authenticated;
grant execute on function public.apotek_kategori_keluar() to authenticated;


-- =====================================================================
--  D. FUNGSI TRANSAKSI
-- =====================================================================

-- D1. Kunci per obat.
--
-- pg_advisory_xact_lock menahan seluruh transaksi lain yang menyentuh
-- obat yang SAMA sampai transaksi ini selesai, lalu lepas sendiri saat
-- commit atau rollback. Dipakai alih-alih SELECT ... FOR UPDATE karena
-- FOR UPDATE yang dipadukan ORDER BY punya jebakan halus: pemanggil
-- kedua menunggu, tetapi setelah kuncinya lepas ia melanjutkan dengan
-- urutan baris hasil pembacaan LAMA — yaitu urutan FEFO sebelum batch
-- pertama terpotong. Dengan advisory lock, pembacaan baru terjadi
-- setelah kunci didapat, jadi urutannya selalu urutan mutakhir.
create or replace function public.apotek_kunci_obat(p_obat_id uuid) returns void
language sql as $$ select pg_advisory_xact_lock(hashtextextended(p_obat_id::text, 0)) $$;


-- D2. OBAT MASUK
--
-- Mengembalikan { batch_id, grup_id, digabung }. `digabung` true berarti
-- stok ditambahkan ke batch yang sudah ada, bukan membuat batch baru.
create or replace function public.apotek_masuk(
  p_obat_id     uuid,
  p_jumlah      numeric,
  p_harga_beli  numeric,
  p_tgl_expired date,
  p_pbf         text,
  p_no_faktur   text default null,
  p_tgl_masuk   date default null,
  p_no_batch    text default null,
  p_keterangan  text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_obat     obat%rowtype;
  v_batch    apotek_batch%rowtype;
  v_tgl      date := coalesce(p_tgl_masuk, public.tgl_klinik());
  v_grup     uuid := gen_random_uuid();
  v_digabung boolean := false;
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh mencatat obat masuk.'
      using errcode = '42501';
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah masuk harus lebih dari nol.';
  end if;
  if p_tgl_expired is null then
    raise exception 'Tanggal kadaluwarsa wajib diisi.';
  end if;
  if coalesce(btrim(p_pbf), '') = '' then
    raise exception 'Nama PBF / distributor wajib diisi.';
  end if;

  select * into v_obat from obat where id = p_obat_id;
  if not found then
    raise exception 'Obat tidak ditemukan di master obat.';
  end if;

  perform public.apotek_kunci_obat(p_obat_id);

  select * into v_batch from apotek_batch
   where obat_id = p_obat_id
     and tgl_expired = p_tgl_expired
     and coalesce(no_faktur,'') = coalesce(p_no_faktur,'')
     and lower(pbf) = lower(btrim(p_pbf))
     and harga_beli = p_harga_beli;

  if found then
    update apotek_batch
       set stok_awal  = stok_awal + p_jumlah,
           stok_sisa  = stok_sisa + p_jumlah,
           updated_at = now()
     where id = v_batch.id
     returning * into v_batch;
    v_digabung := true;
  else
    insert into apotek_batch (obat_id, no_batch, tgl_expired, tgl_masuk, no_faktur,
                              pbf, harga_beli, stok_awal, stok_sisa, keterangan, dibuat_oleh)
    values (p_obat_id, p_no_batch, p_tgl_expired, v_tgl, p_no_faktur,
            btrim(p_pbf), p_harga_beli, p_jumlah, p_jumlah, p_keterangan, auth.uid())
    returning * into v_batch;
  end if;

  insert into apotek_transaksi (batch_id, obat_id, nama_obat, satuan, jenis, kategori,
                                jumlah, harga_satuan, total_nilai, tanggal,
                                no_faktur, pbf, grup_id, keterangan, dibuat_oleh)
  values (v_batch.id, p_obat_id, v_obat.nama, v_obat.satuan, 'MASUK', 'Pembelian',
          p_jumlah, p_harga_beli, p_jumlah * p_harga_beli, v_tgl,
          p_no_faktur, btrim(p_pbf), v_grup, p_keterangan, auth.uid());

  return jsonb_build_object(
    'batch_id',  v_batch.id,
    'grup_id',   v_grup,
    'digabung',  v_digabung,
    'stok_sisa', v_batch.stok_sisa
  );
end $$;


-- D3. OBAT KELUAR (mesin FEFO)
--
-- Satu transaksi utuh: kunci → baca urutan FEFO → potong → tulis riwayat.
-- Gagal di tengah berarti tidak ada yang berubah sama sekali.
--
-- Mengembalikan { grup_id, total_nilai, potongan:[{batch_id, tgl_expired,
-- jumlah, harga_satuan, nilai}] }.
create or replace function public.apotek_keluar(
  p_obat_id       uuid,
  p_jumlah        numeric,
  p_kategori      text default 'Resep Pasien',
  p_tanggal       date default null,
  p_kunjungan_id  uuid default null,
  p_resep_item_id uuid default null,
  p_batch_id      uuid default null,
  p_keterangan    text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_obat       obat%rowtype;
  v_tgl        date := coalesce(p_tanggal, public.tgl_klinik());
  v_grup       uuid := gen_random_uuid();
  v_sisa       numeric := p_jumlah;
  v_ambil      numeric;
  v_total      numeric := 0;
  v_tersedia   numeric := 0;
  v_pemusnahan boolean;
  v_pasien     uuid;
  v_potongan   jsonb := '[]'::jsonb;
  r            record;
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh mengeluarkan obat.'
      using errcode = '42501';
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah keluar harus lebih dari nol.';
  end if;
  if not (p_kategori = any (public.apotek_kategori_keluar())) then
    raise exception 'Kategori pengeluaran "%" tidak dikenal.', p_kategori;
  end if;

  select * into v_obat from obat where id = p_obat_id;
  if not found then
    raise exception 'Obat tidak ditemukan di master obat.';
  end if;

  v_pemusnahan := p_kategori = any (public.apotek_kategori_pemusnahan());

  if p_kunjungan_id is not null then
    select pasien_id into v_pasien from kunjungan where id = p_kunjungan_id;
  end if;

  perform public.apotek_kunci_obat(p_obat_id);

  -- Cek ketersediaan LEBIH DULU, supaya pesannya menyebut angka yang
  -- berguna ("kurang 8") alih-alih gagal di tengah perulangan.
  select coalesce(sum(stok_sisa), 0) into v_tersedia
    from apotek_batch
   where obat_id = p_obat_id
     and stok_sisa > 0
     and (p_batch_id is null or id = p_batch_id)
     and (v_pemusnahan or tgl_expired > v_tgl);

  if v_tersedia < p_jumlah then
    raise exception 'Stok % tidak cukup. Tersedia % %, diminta %.',
      v_obat.nama, v_tersedia, v_obat.satuan, p_jumlah;
  end if;

  for r in
    select * from apotek_batch
     where obat_id = p_obat_id
       and stok_sisa > 0
       and (p_batch_id is null or id = p_batch_id)
       and (v_pemusnahan or tgl_expired > v_tgl)
     order by tgl_expired, tgl_masuk, created_at, id     -- FEFO
  loop
    exit when v_sisa <= 0;

    v_ambil := least(r.stok_sisa, v_sisa);

    update apotek_batch
       set stok_sisa = stok_sisa - v_ambil, updated_at = now()
     where id = r.id;

    insert into apotek_transaksi (batch_id, obat_id, nama_obat, satuan, jenis, kategori,
                                  jumlah, harga_satuan, total_nilai, tanggal,
                                  no_faktur, pbf, kunjungan_id, pasien_id, resep_item_id,
                                  grup_id, keterangan, dibuat_oleh)
    values (r.id, p_obat_id, v_obat.nama, v_obat.satuan, 'KELUAR', p_kategori,
            v_ambil, r.harga_beli, v_ambil * r.harga_beli, v_tgl,
            r.no_faktur, r.pbf, p_kunjungan_id, v_pasien, p_resep_item_id,
            v_grup, p_keterangan, auth.uid());

    v_total    := v_total + v_ambil * r.harga_beli;
    v_sisa     := v_sisa - v_ambil;
    v_potongan := v_potongan || jsonb_build_object(
      'batch_id',     r.id,
      'tgl_expired',  r.tgl_expired,
      'no_faktur',    r.no_faktur,
      'pbf',          r.pbf,
      'jumlah',       v_ambil,
      'harga_satuan', r.harga_beli,
      'nilai',        v_ambil * r.harga_beli
    );
  end loop;

  -- Penjaga terakhir. Kalau baris ini pernah tercapai, ada yang salah
  -- pada penguncian di atas — dan lebih baik seluruh penyerahan batal
  -- daripada stok tercatat keluar setengah.
  if v_sisa > 0 then
    raise exception 'Alokasi FEFO gagal: masih kurang % %. Tidak ada yang disimpan.',
      v_sisa, v_obat.satuan;
  end if;

  return jsonb_build_object(
    'grup_id',     v_grup,
    'total_nilai', v_total,
    'potongan',    v_potongan
  );
end $$;


-- D4. PEMBATALAN SATU GRUP
--
-- Batasnya 7 hari, ditegakkan DI SINI dan bukan hanya di tombol browser.
-- Tombol yang dinonaktifkan hanya menghemat satu klik sia-sia; yang
-- benar-benar menjaga adalah baris ini.
create or replace function public.apotek_batalkan_grup(
  p_grup_id   uuid,
  p_alasan    text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_baris   record;
  v_jumlah  int := 0;
  v_obat_id uuid;
  v_umur    int;
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh membatalkan transaksi.'
      using errcode = '42501';
  end if;

  select obat_id, (public.tgl_klinik() - min(tanggal))
    into v_obat_id, v_umur
    from apotek_transaksi
   where grup_id = p_grup_id and not dibatalkan
   group by obat_id;

  if v_obat_id is null then
    raise exception 'Transaksi tidak ditemukan atau sudah dibatalkan sebelumnya.';
  end if;
  if v_umur > 7 then
    raise exception 'Transaksi berumur % hari sudah tidak bisa dibatalkan (batas 7 hari). '
                    'Catat koreksinya sebagai Penyesuaian Stok.', v_umur;
  end if;

  perform public.apotek_kunci_obat(v_obat_id);

  for v_baris in
    select * from apotek_transaksi where grup_id = p_grup_id and not dibatalkan
  loop
    if v_baris.jenis = 'KELUAR' then
      update apotek_batch set stok_sisa = stok_sisa + v_baris.jumlah, updated_at = now()
       where id = v_baris.batch_id;
    else
      -- Membatalkan pemasukan hanya sah kalau barangnya masih utuh di rak.
      -- Kalau sebagian sudah diserahkan ke pasien, membatalkan pemasukan
      -- akan membuat stok minus dan riwayat berbohong.
      update apotek_batch
         set stok_awal = stok_awal - v_baris.jumlah,
             stok_sisa = stok_sisa - v_baris.jumlah,
             updated_at = now()
       where id = v_baris.batch_id and stok_sisa >= v_baris.jumlah;
      if not found then
        raise exception 'Batch ini sudah terpakai sebagian, jadi pemasukannya tidak bisa '
                        'dibatalkan. Keluarkan sisanya lewat Penyesuaian Stok.';
      end if;
    end if;

    update apotek_transaksi set dibatalkan = true where id = v_baris.id;
    v_jumlah := v_jumlah + 1;
  end loop;

  -- Kalau grup ini berasal dari penyerahan resep, kembalikan resepnya
  -- ke keadaan belum diserahkan supaya bisa dikerjakan ulang.
  update resep_item ri
     set jumlah_diserahkan = null
    from apotek_transaksi t
   where t.grup_id = p_grup_id and t.resep_item_id = ri.id;

  update resep r
     set status = 'DIBUAT', diserahkan_pada = null, diserahkan_oleh = null,
         diserahkan_sebagian = false
   where r.id in (
     select ri.resep_id from apotek_transaksi t
       join resep_item ri on ri.id = t.resep_item_id
      where t.grup_id = p_grup_id
   );

  return jsonb_build_object('dibatalkan', v_jumlah, 'alasan', p_alasan);
end $$;


-- D5. PENYERAHAN RESEP
--
-- p_item berbentuk [{ "resep_item_id": "...", "jumlah": 10 }, ...].
-- Butir dengan jumlah 0 atau tidak disebut = tidak diserahkan; resepnya
-- ditandai diserahkan sebagian, bukan diserahkan penuh.
--
-- Seluruh butir dikerjakan dalam SATU transaksi: kalau obat ketiga
-- ternyata kurang, dua yang pertama ikut batal. Alternatifnya adalah
-- pasien pulang membawa dua obat sementara sistem mencatat resep gagal —
-- selisih yang tidak akan ketahuan sampai stok opname.
create or replace function public.apotek_serahkan_resep(
  p_resep_id  uuid,
  p_item      jsonb,
  p_tanggal   date default null,
  p_catatan   text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_resep      resep%rowtype;
  v_kunjungan  uuid;
  v_it         jsonb;
  v_ri         resep_item%rowtype;
  v_jumlah     numeric;
  v_hasil      jsonb;
  v_grup       jsonb := '[]'::jsonb;
  v_diserahkan int := 0;
  v_total_item int := 0;
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh menyerahkan resep.'
      using errcode = '42501';
  end if;

  select * into v_resep from resep where id = p_resep_id;
  if not found then raise exception 'Resep tidak ditemukan.'; end if;
  if v_resep.status = 'DISERAHKAN' then
    raise exception 'Resep % sudah pernah diserahkan.', coalesce(v_resep.no_resep,'ini');
  end if;
  v_kunjungan := v_resep.kunjungan_id;

  select count(*) into v_total_item from resep_item where resep_id = p_resep_id;

  for v_it in select * from jsonb_array_elements(coalesce(p_item, '[]'::jsonb))
  loop
    v_jumlah := coalesce((v_it->>'jumlah')::numeric, 0);
    continue when v_jumlah <= 0;

    select * into v_ri from resep_item
     where id = (v_it->>'resep_item_id')::uuid and resep_id = p_resep_id;
    if not found then
      raise exception 'Butir resep tidak ditemukan pada resep ini.';
    end if;
    if v_ri.obat_id is null then
      raise exception 'Butir "%" belum tertaut ke master obat, jadi stoknya tidak bisa '
                      'dipotong. Perbaiki lewat Master Data lebih dulu.', v_ri.nama_obat;
    end if;

    v_hasil := public.apotek_keluar(
      p_obat_id       => v_ri.obat_id,
      p_jumlah        => v_jumlah,
      p_kategori      => 'Resep Pasien',
      p_tanggal       => coalesce(p_tanggal, public.tgl_klinik()),
      p_kunjungan_id  => v_kunjungan,
      p_resep_item_id => v_ri.id,
      p_batch_id      => null,
      p_keterangan    => coalesce(v_it->>'keterangan', v_resep.no_resep)
    );

    update resep_item
       set jumlah_diserahkan = v_jumlah,
           catatan_farmasi   = nullif(v_it->>'keterangan','')
     where id = v_ri.id;

    v_grup := v_grup || jsonb_build_object(
      'resep_item_id', v_ri.id, 'nama_obat', v_ri.nama_obat,
      'jumlah', v_jumlah, 'hasil', v_hasil);
    v_diserahkan := v_diserahkan + 1;
  end loop;

  if v_diserahkan = 0 then
    raise exception 'Tidak ada butir obat yang diserahkan.';
  end if;

  update resep
     set status              = 'DISERAHKAN',
         diserahkan_oleh     = auth.uid(),
         diserahkan_pada     = now(),
         diserahkan_sebagian = (v_diserahkan < v_total_item),
         catatan             = coalesce(p_catatan, catatan)
   where id = p_resep_id;

  return jsonb_build_object(
    'resep_id',   p_resep_id,
    'butir',      v_diserahkan,
    'dari',       v_total_item,
    'sebagian',   v_diserahkan < v_total_item,
    'rincian',    v_grup
  );
end $$;


-- =====================================================================
--  E. VIEW
-- =====================================================================

-- E1. Stok per batch, lengkap dengan identitas obat dan status kedaluwarsa.
create or replace view v_apotek_batch with (security_invoker = true) as
select b.id, b.obat_id, b.no_batch, b.tgl_expired, b.tgl_masuk, b.no_faktur, b.pbf,
       b.harga_beli, b.stok_awal, b.stok_sisa, b.keterangan, b.created_at,
       o.nama            as nama_obat,
       o.satuan,
       o.golongan,
       o.bentuk_sediaan,
       o.kekuatan,
       o.harga            as harga_jual,
       b.stok_sisa * b.harga_beli as nilai_beli,
       (b.tgl_expired <= public.tgl_klinik())                          as kadaluwarsa,
       (b.tgl_expired  > public.tgl_klinik()
        and b.tgl_expired <= public.tgl_klinik() + 30)                 as segera_kadaluwarsa,
       (b.tgl_expired - public.tgl_klinik())                           as hari_ke_expired
  from apotek_batch b
  join obat o on o.id = b.obat_id;

-- E2. Ringkasan per obat — dipakai kartu ringkasan dan pemilih obat keluar.
create or replace view v_apotek_stok with (security_invoker = true) as
select o.id                                as obat_id,
       o.nama                              as nama_obat,
       o.satuan,
       o.golongan,
       o.bentuk_sediaan,
       o.kekuatan,
       o.harga                             as harga_jual,
       o.aktif,
       coalesce(sum(b.stok_sisa), 0)                          as stok_total,
       coalesce(sum(b.stok_sisa * b.harga_beli), 0)           as nilai_total,
       count(b.id) filter (where b.stok_sisa > 0)             as jumlah_batch,
       count(b.id) filter (where b.stok_sisa > 0
                             and b.tgl_expired <= public.tgl_klinik())  as batch_kadaluwarsa,
       count(b.id) filter (where b.stok_sisa > 0
                             and b.tgl_expired  > public.tgl_klinik()
                             and b.tgl_expired <= public.tgl_klinik() + 30) as batch_segera,
       coalesce(sum(b.stok_sisa) filter (
         where b.tgl_expired > public.tgl_klinik()), 0)       as stok_layak,
       min(b.tgl_expired) filter (where b.stok_sisa > 0)      as expired_terdekat
  from obat o
  left join apotek_batch b on b.obat_id = o.id and b.stok_sisa > 0
 group by o.id, o.nama, o.satuan, o.golongan, o.bentuk_sediaan, o.kekuatan, o.harga, o.aktif;

-- E3. Antrean farmasi: resep yang sudah ditulis dokter dan belum diserahkan.
create or replace view v_antrean_farmasi with (security_invoker = true) as
select r.id                as resep_id,
       r.no_resep,
       r.status,
       r.catatan,
       r.dibuat_pada,
       r.diserahkan_pada,
       r.diserahkan_sebagian,
       k.id                as kunjungan_id,
       k.no_kunjungan,
       k.no_antrian,
       k.tanggal,
       k.cara_bayar,
       k.status            as status_kunjungan,
       p.id                as pasien_id,
       p.no_rm,
       p.nama              as nama_pasien,
       p.tanggal_lahir,
       p.jenis_kelamin,
       date_part('year', age(p.tanggal_lahir))::int as umur,
       po.nama             as nama_poli,
       d.nama              as nama_dokter,
       (select count(*) from resep_item ri where ri.resep_id = r.id)         as jumlah_item,
       (select count(*) from resep_item ri where ri.resep_id = r.id
          and ri.obat_id is null)                                            as item_tanpa_master,
       (select coalesce(string_agg(ri.nama_obat, ', ' order by ri.urutan), '')
          from resep_item ri where ri.resep_id = r.id)                       as daftar_obat
  from resep r
  join kunjungan k on k.id = r.kunjungan_id
  join pasien p    on p.id = k.pasien_id
  join poli po     on po.id = k.poli_id
  left join pegawai d on d.id = k.dokter_id;

-- E4. Kartu stok tidak dibuat sebagai view.
--     Saldo hariannya ditarik MUNDUR dari stok yang ada sekarang (lihat
--     apotek_core.js), bukan dijumlahkan maju dari nol. Alasannya: koreksi
--     batch lewat Edit Batch mengubah stok tanpa menulis baris transaksi,
--     sehingga penjumlahan maju akan berselisih diam-diam dengan tab Stok.
--     Perhitungan mundur itu butuh dua array penuh dan lebih jernih
--     dikerjakan di sisi aplikasi, di mana ia juga bisa diuji tanpa database.


-- =====================================================================
--  F. ROW LEVEL SECURITY
-- =====================================================================

-- GRANT tabel-level HARUS ditulis di sini, tidak cukup mengandalkan
-- 02_rls.sql. Perintah `grant ... on all tables in schema public` di berkas
-- itu hanya berlaku untuk tabel yang SUDAH ADA saat ia dijalankan; tabel
-- yang dibuat belakangan tidak ikut terkena. Supabase memang memasang
-- default privileges yang biasanya menutupi ini, tetapi kalau suatu saat
-- tidak, gejalanya adalah "permission denied for table apotek_batch" di
-- browser — pesan yang tidak menyebut-nyebut RLS sama sekali, sehingga
-- pencarian penyebabnya berjam-jam.
grant select, insert, update, delete on apotek_batch, apotek_transaksi to authenticated;
grant usage, select on sequence apotek_transaksi_id_seq to authenticated;

alter table apotek_batch     enable row level security;
alter table apotek_transaksi enable row level security;

-- Semua staf boleh MELIHAT stok. Dokter perlu tahu obat mana yang kosong
-- sebelum menuliskannya di resep; kasir perlu tahu harga; perawat perlu
-- tahu apa yang tersedia. Yang dibatasi adalah menulis.
drop policy if exists batch_baca on apotek_batch;
create policy batch_baca on apotek_batch for select
  to authenticated using (public.saya_staf());

drop policy if exists batch_tulis on apotek_batch;
create policy batch_tulis on apotek_batch for all
  to authenticated
  using (public.boleh_apotek())
  with check (public.boleh_apotek());

drop policy if exists trx_baca on apotek_transaksi;
create policy trx_baca on apotek_transaksi for select
  to authenticated using (public.saya_staf());

-- Menulis riwayat lewat tangan tidak diizinkan sama sekali, bahkan untuk
-- apoteker. Satu-satunya jalan masuk adalah fungsi di §D, yang menjaga
-- stok dan riwayat tetap sejalan. Baris riwayat yang bisa ditulis
-- langsung adalah baris yang bisa dikarang.
drop policy if exists trx_tulis on apotek_transaksi;
create policy trx_tulis on apotek_transaksi for all
  to authenticated
  using (public.peran_teks_saya() = 'master')
  with check (public.peran_teks_saya() = 'master');

grant execute on function public.apotek_masuk(uuid,numeric,numeric,date,text,text,date,text,text) to authenticated;
grant execute on function public.apotek_keluar(uuid,numeric,text,date,uuid,uuid,uuid,text)        to authenticated;
grant execute on function public.apotek_batalkan_grup(uuid,text)                                  to authenticated;
grant execute on function public.apotek_serahkan_resep(uuid,jsonb,date,text)                      to authenticated;


-- =====================================================================
--  G. AUDIT
-- =====================================================================

drop trigger if exists trg_audit_batch on apotek_batch;
create trigger trg_audit_batch after insert or update or delete on apotek_batch
for each row execute function public.catat_audit();


-- =====================================================================
--  H. PEMICU updated_at
-- =====================================================================

drop trigger if exists trg_updated_apotek_batch on apotek_batch;
create trigger trg_updated_apotek_batch before update on apotek_batch
for each row execute function set_updated_at();
-- =====================================================================
--  RME Laboratorium Medis Utama - MODUL KASIR
--  Jalankan SETELAH 08_apotek.sql
--
--  Diturunkan dari invoice generator portal sipantau. Yang disalin utuh
--  karena portal sudah membayarnya dengan bug nyata:
--
--   1. Frontend TIDAK PERNAH menulis status_bayar atau amount_paid.
--      Keduanya dijaga trigger. Di portal, invoice yang disimpan langsung
--      'lunas' tanpa baris pembayaran justru statusnya MUNDUR ke
--      'sebagian' begitu pembayaran pertama dicatat.
--
--   2. Satu sumber status. Judul dokumen, cap di kanan atas, dan baris
--      sisa tagihan semuanya membaca angka yang sama. Di portal pernah
--      terjadi satu lembar mencetak "KWITANSI" di kepala dan
--      "BELUM LUNAS" di kaki, karena judul membaca kolom status
--      sementara stempel menghitung sendiri dari nominal.
--
--   3. Kembalian tidak pernah disimpan. Yang disimpan adalah uang yang
--      diterima; kembalian selalu dihitung saat dicetak. Angka turunan
--      yang disimpan adalah angka yang suatu hari bertentangan dengan
--      sumbernya.
--
--  Yang BARU di RME dan tidak ada di portal:
--
--   4. Penjamin. Kunjungan BPJS di klinik pratama dibayar kapitasi, jadi
--      pasien tidak ditagih. Barisnya tetap dicatat lengkap dengan
--      nilainya lewat kolom ditanggung_penjamin — sehingga pertanyaan
--      "berapa nilai obat BPJS bulan ini" tetap bisa dijawab — tapi
--      tidak ikut hitungan yang harus dibayar di meja kasir.
--
--   5. Tagihan disusun dari kunjungan, bukan diketik. Tindakan ICD-9-CM
--      diambil dari catatan dokter, obat dari apa yang BENAR-BENAR
--      diserahkan apotek.
-- =====================================================================


-- =====================================================================
--  A. FUNGSI BANTU
-- =====================================================================

-- 9 Sep 2026: lewat tabel hak_akses (bisa diatur master), bukan daftar
-- peran tetap lagi — lihat sql/02_rls.sql bagian HAK AKSES.
create or replace function public.boleh_kasir() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('kasir') $$;

grant execute on function public.boleh_kasir() to authenticated;

-- 11 Sep 2026: kode `menu_tarif` sebelumnya hanya mengatur TERLIHAT/
-- tidaknya menu "Tarif & Invoice" (lihat js/app.js), sementara hak
-- MENULIS Master Tarif tetap lewat boleh_master_data() — kode yang jauh
-- lebih luas (obat, poli, ICD-10/9-CM, signa, dst). Akibatnya kasir yang
-- diberi menu_tarif tetap ditolak database saat menyimpan tarif baru.
-- boleh_tarif() memakai kode YANG SAMA (menu_tarif) supaya satu centang
-- di Pengaturan -> Hak Akses membuka halaman SEKALIGUS mengizinkan
-- menulis tarif, tanpa ikut membuka Master Data lain yang tidak diminta.
-- Tab "Tampilan invoice" di halaman yang sama SENGAJA TETAP memakai
-- boleh_master_data() (lihat bagian I di bawah + js/pages/tarif.js) —
-- perubahan tampilan cetak berlaku untuk SEMUA kasir sekaligus, jadi
-- tetap dikunci ke master/admin.
create or replace function public.boleh_tarif() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('menu_tarif') $$;

grant execute on function public.boleh_tarif() to authenticated;

insert into public.hak_akses (kode, peran, diizinkan) values
  ('kasir',       'kasir', true),
  -- Menu "Kasir" untuk peran kasir sendiri: baris ini ditaruh di sini
  -- (bukan di sql/02_rls.sql bersama menu_* lain) karena nilai enum
  -- 'kasir' baru ada setelah sql/07_peran_kasir.sql dijalankan.
  ('menu_kasir',  'kasir', true),
  -- 11 Sep 2026: kasir boleh membuka Tarif & Invoice DAN mengubah Master
  -- Tarif (lihat boleh_tarif() di atas). Master tetap bisa mencabutnya
  -- kembali lewat Pengaturan -> Hak Akses kapan saja.
  ('menu_tarif',  'kasir', true)
on conflict (kode, peran) do nothing;


-- =====================================================================
--  B. MASTER TARIF
-- =====================================================================

-- Tarif berversi. Tarif naik itu wajar; tagihan bulan lalu tidak boleh
-- ikut berubah karenanya. Karena itu tarif TIDAK PERNAH dibaca ulang saat
-- mencetak — nilainya disalin ke kasir_tagihan_item saat tagihan disusun,
-- dan salinan itulah yang berlaku selamanya untuk tagihan tersebut.
create table if not exists kasir_tarif (
  id             uuid primary key default uuid_generate_v4(),
  jenis          text not null default 'TINDAKAN'
                 check (jenis in ('TINDAKAN','LAYANAN','LAIN')),
  kode_icd9      text references icd9cm(kode),   -- diisi bila jenis = TINDAKAN
  kode           text,
  nama           text not null,
  tarif          numeric(14,2) not null default 0 check (tarif >= 0),
  -- Layanan dengan otomatis = true ditambahkan ke setiap tagihan pasien
  -- umum saat disusun dari kunjungan (mis. karcis / administrasi).
  otomatis       boolean not null default false,
  berlaku_mulai  date not null default public.tgl_klinik(),
  aktif          boolean not null default true,
  keterangan     text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_tarif_icd9 on kasir_tarif (kode_icd9, berlaku_mulai desc)
  where aktif;
create index if not exists idx_tarif_otomatis on kasir_tarif (otomatis) where otomatis and aktif;

-- Tarif yang berlaku untuk satu kode tindakan pada satu tanggal.
create or replace function public.kasir_tarif_berlaku(p_kode_icd9 text, p_tanggal date)
returns numeric
language sql stable security definer set search_path = public
as $$
  select tarif from kasir_tarif
   where kode_icd9 = p_kode_icd9 and aktif and berlaku_mulai <= p_tanggal
   order by berlaku_mulai desc, created_at desc
   limit 1
$$;

grant execute on function public.kasir_tarif_berlaku(text,date) to authenticated;


-- =====================================================================
--  C. TAGIHAN
-- =====================================================================

create sequence if not exists seq_no_tagihan start 1;

create table if not exists kasir_tagihan (
  id             uuid primary key default uuid_generate_v4(),
  nomor          text not null unique,
  -- Satu kunjungan hanya boleh punya satu tagihan. Kunjungan NULL =
  -- penjualan bebas / pasien luar yang tidak lewat pendaftaran.
  kunjungan_id   uuid unique references kunjungan(id) on delete set null,
  pasien_id      uuid references pasien(id) on delete set null,
  nama_pembayar  text not null,
  tanggal        date not null default public.tgl_klinik(),
  penjamin       cara_bayar_t not null default 'UMUM',
  -- subtotal = nilai ekonomi SELURUH baris, termasuk yang ditanggung
  --            penjamin. Inilah angka untuk laporan pemakaian BPJS.
  -- total     = yang harus dibayar di meja kasir.
  subtotal       numeric(14,2) not null default 0,
  total          numeric(14,2) not null default 0,
  amount_paid    numeric(14,2) not null default 0,   -- dijaga trigger
  status_bayar   text not null default 'belum_lunas' -- dijaga trigger
                 check (status_bayar in ('belum_lunas','sebagian','lunas')),
  catatan        text,
  pdf_path       text,
  dibuat_oleh    uuid references pegawai(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_tagihan_tanggal on kasir_tagihan (tanggal desc, created_at desc);
create index if not exists idx_tagihan_pasien  on kasir_tagihan (pasien_id);
create index if not exists idx_tagihan_status  on kasir_tagihan (status_bayar)
  where status_bayar <> 'lunas';

create or replace function public.gen_no_tagihan() returns trigger
language plpgsql as $$
begin
  if new.nomor is null or new.nomor = '' then
    new.nomor := 'INV-' || to_char(coalesce(new.tanggal, public.tgl_klinik()),'YYYY')
                 || '-' || lpad(nextval('seq_no_tagihan')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_gen_no_tagihan on kasir_tagihan;
create trigger trg_gen_no_tagihan before insert on kasir_tagihan
for each row execute function public.gen_no_tagihan();

drop trigger if exists trg_updated_tagihan on kasir_tagihan;
create trigger trg_updated_tagihan before update on kasir_tagihan
for each row execute function set_updated_at();


create table if not exists kasir_tagihan_item (
  id            uuid primary key default uuid_generate_v4(),
  tagihan_id    uuid not null references kasir_tagihan(id) on delete cascade,
  sumber        text not null default 'MANUAL'
                check (sumber in ('TINDAKAN','OBAT','LAYANAN','MANUAL')),
  -- Penunjuk balik ke asalnya: tindakan.id, obat.id, atau kasir_tarif.id.
  -- Sengaja tanpa foreign key: baris tagihan harus tetap utuh terbaca
  -- walaupun sumbernya kelak dihapus dari master.
  ref_id        uuid,
  ref_kode      text,
  nama          text not null,          -- potret nama saat itu
  qty           numeric(14,2) not null default 1 check (qty > 0),
  harga_satuan  numeric(14,2) not null default 0 check (harga_satuan >= 0),
  diskon_pct    numeric(5,2)  not null default 0 check (diskon_pct between 0 and 100),
  total_baris   numeric(14,2) not null default 0,
  -- Saklar penjamin. true = tercatat untuk laporan, tidak ditagihkan.
  ditanggung_penjamin boolean not null default false,
  urutan        smallint not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_titem_tagihan on kasir_tagihan_item (tagihan_id, urutan);


create table if not exists kasir_pembayaran (
  id             uuid primary key default uuid_generate_v4(),
  tagihan_id     uuid not null references kasir_tagihan(id) on delete cascade,
  jumlah         numeric(14,2) not null check (jumlah > 0),
  tanggal        date not null default public.tgl_klinik(),
  metode         text not null default 'tunai'
                 check (metode in ('tunai','transfer','qris','debit','kartu_kredit','lainnya')),
  -- Uang tunai yang diserahkan pasien. Boleh lebih besar dari `jumlah`;
  -- selisihnya adalah kembalian, dan kembalian tidak pernah disimpan.
  uang_diterima  numeric(14,2),
  catatan        text,
  dibuat_oleh    uuid references pegawai(id),
  created_at     timestamptz not null default now()
);

create index if not exists idx_bayar_tagihan on kasir_pembayaran (tagihan_id);
create index if not exists idx_bayar_tanggal on kasir_pembayaran (tanggal desc);


-- =====================================================================
--  D. TRIGGER PENJAGA ANGKA
-- =====================================================================

-- D1. total_baris dihitung, tidak pernah diterima dari pemanggil.
create or replace function public.kasir_hitung_baris() returns trigger
language plpgsql as $$
begin
  new.total_baris := round(new.qty * new.harga_satuan * (1 - new.diskon_pct / 100.0), 2);
  return new;
end $$;

drop trigger if exists trg_hitung_baris on kasir_tagihan_item;
create trigger trg_hitung_baris before insert or update on kasir_tagihan_item
for each row execute function public.kasir_hitung_baris();


-- D2. Ringkasan tagihan mengikuti barisnya.
--
--   subtotal = seluruh baris (nilai ekonomi)
--   total    = hanya baris yang ditagihkan ke pasien
--
-- Untuk kunjungan BPJS semua baris ditanggung penjamin, jadi total = 0
-- sementara subtotal tetap menyimpan nilainya untuk laporan.
create or replace function public.kasir_hitung_tagihan(p_tagihan_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare v_sub numeric; v_tot numeric;
begin
  select coalesce(sum(total_baris), 0),
         coalesce(sum(total_baris) filter (where not ditanggung_penjamin), 0)
    into v_sub, v_tot
    from kasir_tagihan_item where tagihan_id = p_tagihan_id;

  update kasir_tagihan set subtotal = v_sub, total = v_tot where id = p_tagihan_id;
  perform public.kasir_sync_bayar(p_tagihan_id);
end $$;

create or replace function public.kasir_trg_hitung_tagihan() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.kasir_hitung_tagihan(coalesce(new.tagihan_id, old.tagihan_id));
  return null;
end $$;

drop trigger if exists trg_total_tagihan on kasir_tagihan_item;
create trigger trg_total_tagihan after insert or update or delete on kasir_tagihan_item
for each row execute function public.kasir_trg_hitung_tagihan();


-- D3. Status pembayaran dihitung dari baris pembayaran, tidak pernah
--     ditulis tangan. Cerminan persis statusDari() di portal.
--
--     Toleransi 0,5 rupiah: diskon persen bisa menyisakan pecahan sen
--     yang mustahil dibayar tunai, dan tagihan yang tersisa Rp 0,003
--     akan tampak "belum lunas" selamanya.
create or replace function public.kasir_sync_bayar(p_tagihan_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare v_bayar numeric; v_total numeric; v_status text;
begin
  select coalesce(sum(jumlah), 0) into v_bayar
    from kasir_pembayaran where tagihan_id = p_tagihan_id;
  select total into v_total from kasir_tagihan where id = p_tagihan_id;
  if v_total is null then return; end if;

  if v_total <= 0.5 then
    -- Tagihan bernilai nol — pasien BPJS, atau seluruh barisnya ditanggung.
    -- Tidak ada yang perlu dibayar, jadi tidak masuk akal menahannya di
    -- daftar "belum lunas" sampai kasir menekan tombol bayar Rp 0.
    v_status := 'lunas';
  elsif v_bayar <= 0       then v_status := 'belum_lunas';
  elsif v_bayar >= v_total - 0.5 then v_status := 'lunas';
  else                          v_status := 'sebagian';
  end if;

  update kasir_tagihan
     set amount_paid = v_bayar, status_bayar = v_status
   where id = p_tagihan_id;
end $$;

create or replace function public.kasir_trg_sync_bayar() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.kasir_sync_bayar(coalesce(new.tagihan_id, old.tagihan_id));
  return null;
end $$;

drop trigger if exists trg_sync_bayar on kasir_pembayaran;
create trigger trg_sync_bayar after insert or update or delete on kasir_pembayaran
for each row execute function public.kasir_trg_sync_bayar();


-- D4. Tagihan yang sudah dibayar tidak boleh diubah isinya.
--
-- Bukan kerewelan: struk sudah dicetak dan diserahkan ke pasien.
-- Mengubah barisnya sesudah itu membuat kertas di tangan pasien dan
-- catatan di sistem menyebut dua hal yang berbeda, tanpa jejak mana yang
-- benar. Koreksi dilakukan dengan menghapus pembayarannya lebih dulu —
-- tindakan yang tercatat di audit log.
create or replace function public.kasir_cegah_ubah_terbayar() returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_bayar numeric;
begin
  v_id := coalesce(new.tagihan_id, old.tagihan_id);
  select coalesce(sum(jumlah),0) into v_bayar from kasir_pembayaran where tagihan_id = v_id;
  if v_bayar > 0 then
    raise exception 'Tagihan ini sudah menerima pembayaran, jadi rinciannya tidak bisa '
                    'diubah. Hapus dulu pembayarannya bila memang perlu dikoreksi.';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_cegah_ubah_terbayar on kasir_tagihan_item;
create trigger trg_cegah_ubah_terbayar before insert or update or delete on kasir_tagihan_item
for each row execute function public.kasir_cegah_ubah_terbayar();


-- =====================================================================
--  E. MENYUSUN TAGIHAN DARI KUNJUNGAN
-- =====================================================================

-- Menarik tindakan ICD-9-CM dari catatan dokter dan obat dari apa yang
-- BENAR-BENAR diserahkan apotek (apotek_transaksi, bukan resep_item).
--
-- Dua angka itu berbeda dan sering: dokter menulis 30 tablet, apoteker
-- menyerahkan 20 karena stok tipis. Menagih dari resep berarti menagih
-- obat yang tidak pernah pasien terima.
--
-- Aman dipanggil berulang: baris TINDAKAN/OBAT/LAYANAN ditulis ulang,
-- baris MANUAL yang ditambahkan kasir dipertahankan.
create or replace function public.kasir_susun_dari_kunjungan(
  p_kunjungan_id uuid
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_k         kunjungan%rowtype;
  v_p         pasien%rowtype;
  v_tagihan   kasir_tagihan%rowtype;
  v_ditanggung boolean;
  v_urut      smallint := 0;
  v_bayar     numeric;
  r           record;
begin
  if not public.boleh_kasir() then
    raise exception 'Hanya kasir dan admin yang boleh menyusun tagihan.' using errcode = '42501';
  end if;

  select * into v_k from kunjungan where id = p_kunjungan_id;
  if not found then raise exception 'Kunjungan tidak ditemukan.'; end if;
  select * into v_p from pasien where id = v_k.pasien_id;

  -- Penjamin menentukan segalanya. BPJS dan GRATIS tidak ditagihkan ke
  -- pasien; nilainya tetap dicatat untuk laporan.
  v_ditanggung := v_k.cara_bayar in ('BPJS','GRATIS');

  select * into v_tagihan from kasir_tagihan where kunjungan_id = p_kunjungan_id;
  if found then
    select coalesce(sum(jumlah),0) into v_bayar
      from kasir_pembayaran where tagihan_id = v_tagihan.id;
    if v_bayar > 0 then
      raise exception 'Tagihan % sudah dibayar, jadi tidak bisa disusun ulang.', v_tagihan.nomor;
    end if;
    delete from kasir_tagihan_item
     where tagihan_id = v_tagihan.id and sumber in ('TINDAKAN','OBAT','LAYANAN');
    update kasir_tagihan set penjamin = v_k.cara_bayar where id = v_tagihan.id;
    select coalesce(max(urutan), 0) into v_urut
      from kasir_tagihan_item where tagihan_id = v_tagihan.id;
  else
    insert into kasir_tagihan (kunjungan_id, pasien_id, nama_pembayar, tanggal,
                               penjamin, dibuat_oleh)
    values (p_kunjungan_id, v_k.pasien_id, v_p.nama, v_k.tanggal,
            v_k.cara_bayar, auth.uid())
    returning * into v_tagihan;
  end if;

  -- E1. Layanan otomatis (karcis / administrasi).
  for r in select * from kasir_tarif
            where jenis = 'LAYANAN' and otomatis and aktif
              and berlaku_mulai <= v_k.tanggal
            order by nama
  loop
    v_urut := v_urut + 1;
    insert into kasir_tagihan_item (tagihan_id, sumber, ref_id, ref_kode, nama, qty,
                                    harga_satuan, ditanggung_penjamin, urutan)
    values (v_tagihan.id, 'LAYANAN', r.id, r.kode, r.nama, 1,
            r.tarif, v_ditanggung, v_urut);
  end loop;

  -- E2. Tindakan ICD-9-CM dari catatan dokter.
  --     Tindakan tanpa tarif tetap dimasukkan dengan harga 0 supaya
  --     terlihat di struk dan ketahuan tarifnya belum diisi — jauh lebih
  --     baik daripada hilang diam-diam dari tagihan.
  for r in select t.id, t.kode_icd9, t.nama, t.jumlah, t.fdi
             from tindakan t where t.kunjungan_id = p_kunjungan_id
            order by t.urutan
  loop
    v_urut := v_urut + 1;
    insert into kasir_tagihan_item (tagihan_id, sumber, ref_id, ref_kode, nama, qty,
                                    harga_satuan, ditanggung_penjamin, urutan)
    values (v_tagihan.id, 'TINDAKAN', r.id, r.kode_icd9,
            r.nama || case when r.fdi is not null then ' (gigi ' || r.fdi || ')' else '' end,
            greatest(r.jumlah, 1),
            coalesce(public.kasir_tarif_berlaku(r.kode_icd9, v_k.tanggal), 0),
            v_ditanggung, v_urut);
  end loop;

  -- E3. Obat yang benar-benar diserahkan apotek.
  --     Dikelompokkan per obat: satu obat yang terpecah ke tiga batch
  --     adalah satu baris di mata pasien, bukan tiga.
  for r in select at.obat_id, max(at.nama_obat) as nama_obat, max(at.satuan) as satuan,
                  sum(at.jumlah) as jumlah, max(o.harga) as harga_jual
             from apotek_transaksi at
             join obat o on o.id = at.obat_id
            where at.kunjungan_id = p_kunjungan_id
              and at.jenis = 'KELUAR'
              and at.kategori = 'Resep Pasien'
              and not at.dibatalkan
            group by at.obat_id
            having sum(at.jumlah) > 0
            order by max(at.nama_obat)
  loop
    v_urut := v_urut + 1;
    insert into kasir_tagihan_item (tagihan_id, sumber, ref_id, ref_kode, nama, qty,
                                    harga_satuan, ditanggung_penjamin, urutan)
    values (v_tagihan.id, 'OBAT', r.obat_id, null,
            r.nama_obat || ' (' || r.jumlah || ' ' || coalesce(r.satuan,'') || ')',
            r.jumlah, coalesce(r.harga_jual, 0), v_ditanggung, v_urut);
  end loop;

  perform public.kasir_hitung_tagihan(v_tagihan.id);
  return v_tagihan.id;
end $$;


-- =====================================================================
--  F. PEMBAYARAN
-- =====================================================================

create or replace function public.kasir_catat_pembayaran(
  p_tagihan_id    uuid,
  p_jumlah        numeric,
  p_tanggal       date    default null,
  p_metode        text    default 'tunai',
  p_catatan       text    default null,
  p_uang_diterima numeric default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_t     kasir_tagihan%rowtype;
  v_bayar numeric;
  v_sisa  numeric;
  v_id    uuid;
begin
  if not public.boleh_kasir() then
    raise exception 'Hanya kasir dan admin yang boleh mencatat pembayaran.' using errcode = '42501';
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah pembayaran harus lebih dari nol.';
  end if;

  select * into v_t from kasir_tagihan where id = p_tagihan_id for update;
  if not found then raise exception 'Tagihan tidak ditemukan.'; end if;

  select coalesce(sum(jumlah),0) into v_bayar
    from kasir_pembayaran where tagihan_id = p_tagihan_id;
  v_sisa := v_t.total - v_bayar;

  if p_jumlah > v_sisa + 0.5 then
    raise exception 'Pembayaran % melebihi sisa tagihan %.',
      to_char(p_jumlah,'FM999G999G999'), to_char(greatest(v_sisa,0),'FM999G999G999');
  end if;
  if p_uang_diterima is not null and p_uang_diterima > 0
     and p_uang_diterima < p_jumlah - 0.5 then
    raise exception 'Uang yang diterima kurang % dari jumlah yang dibayarkan.',
      to_char(p_jumlah - p_uang_diterima,'FM999G999G999');
  end if;

  insert into kasir_pembayaran (tagihan_id, jumlah, tanggal, metode,
                                uang_diterima, catatan, dibuat_oleh)
  values (p_tagihan_id, p_jumlah, coalesce(p_tanggal, public.tgl_klinik()),
          p_metode, nullif(p_uang_diterima, 0), p_catatan, auth.uid())
  returning id into v_id;

  select * into v_t from kasir_tagihan where id = p_tagihan_id;

  return jsonb_build_object(
    'pembayaran_id', v_id,
    'status_bayar',  v_t.status_bayar,
    'dibayar',       v_t.amount_paid,
    'sisa',          greatest(v_t.total - v_t.amount_paid, 0),
    'kembalian',     case when p_uang_diterima is null then 0
                          else greatest(p_uang_diterima - p_jumlah, 0) end
  );
end $$;


-- Menghapus baris pembayaran sama berbahayanya dengan menghapus tagihan,
-- hanya arahnya terbalik: uangnya sudah diterima dan struknya sudah
-- dicetak, lalu barisnya hilang sehingga tagihan tampak belum lunas dan
-- uang di laci tidak pernah dicari. Karena itu dibatasi ke admin.
create or replace function public.kasir_hapus_pembayaran(
  p_pembayaran_id uuid,
  p_alasan        text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_p kasir_pembayaran%rowtype; v_t kasir_tagihan%rowtype;
begin
  if public.peran_teks_saya() <> 'master' then
    raise exception 'Hanya master yang boleh menghapus pembayaran yang sudah tercatat.'
      using errcode = '42501';
  end if;

  select * into v_p from kasir_pembayaran where id = p_pembayaran_id;
  if not found then raise exception 'Baris pembayaran tidak ditemukan.'; end if;

  insert into audit_log (user_id, user_nama, aksi, tabel, record_id, data_lama, keterangan)
  values (auth.uid(),
          (select nama from pegawai where id = auth.uid()),
          'DELETE', 'kasir_pembayaran', p_pembayaran_id::text,
          to_jsonb(v_p), coalesce(p_alasan, 'tanpa alasan'));

  delete from kasir_pembayaran where id = p_pembayaran_id;
  select * into v_t from kasir_tagihan where id = v_p.tagihan_id;

  return jsonb_build_object('tagihan_id', v_p.tagihan_id,
                            'status_bayar', v_t.status_bayar,
                            'dibayar', v_t.amount_paid);
end $$;


-- Membatalkan seluruh tagihan. Hanya boleh selama belum ada pembayaran.
create or replace function public.kasir_hapus_tagihan(p_tagihan_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare v_bayar numeric;
begin
  if not public.boleh_kasir() then
    raise exception 'Hanya kasir dan admin yang boleh menghapus tagihan.' using errcode = '42501';
  end if;
  select coalesce(sum(jumlah),0) into v_bayar
    from kasir_pembayaran where tagihan_id = p_tagihan_id;
  if v_bayar > 0 then
    raise exception 'Tagihan ini sudah menerima pembayaran dan tidak bisa dihapus.';
  end if;
  delete from kasir_tagihan where id = p_tagihan_id;
end $$;


-- =====================================================================
--  G. TEMPLATE INVOICE
-- =====================================================================

-- Satu baris berisi seluruh pengaturan tampilan invoice PDF dan struk
-- thermal. Bentuk isinya dijaga di sisi aplikasi oleh invoice_template.js
-- (BAWAAN + gabung + bersihkan), sehingga menambah pengaturan baru tidak
-- pernah butuh migrasi SQL: kunci yang belum ada di sini jatuh ke bawaan.
create table if not exists sys_template_invoice (
  id           smallint primary key default 1 check (id = 1),
  konfigurasi  jsonb not null default '{}'::jsonb,
  diubah_pada  timestamptz not null default now(),
  diubah_oleh  uuid references pegawai(id)
);

insert into sys_template_invoice (id, konfigurasi) values (1, '{}'::jsonb)
on conflict (id) do nothing;

create or replace function public.sentuh_template_invoice() returns trigger
language plpgsql as $$
begin
  new.diubah_pada := now();
  new.diubah_oleh := auth.uid();
  return new;
end $$;

drop trigger if exists trg_template_invoice on sys_template_invoice;
create trigger trg_template_invoice before update on sys_template_invoice
for each row execute function public.sentuh_template_invoice();


-- =====================================================================
--  H. VIEW
-- =====================================================================

-- H1. Kunjungan yang siap ditagih tapi belum punya tagihan.
create or replace view v_kasir_menunggu with (security_invoker = true) as
select k.id            as kunjungan_id,
       k.no_kunjungan,
       k.no_antrian,
       k.tanggal,
       k.cara_bayar,
       k.status        as status_kunjungan,
       p.id            as pasien_id,
       p.no_rm,
       p.nama          as nama_pasien,
       p.tanggal_lahir,
       p.jenis_kelamin,
       po.nama         as nama_poli,
       d.nama          as nama_dokter,
       (select count(*) from tindakan t where t.kunjungan_id = k.id)          as jumlah_tindakan,
       (select count(*) from apotek_transaksi at
         where at.kunjungan_id = k.id and at.jenis='KELUAR'
           and at.kategori='Resep Pasien' and not at.dibatalkan)              as jumlah_obat,
       exists (select 1 from resep r where r.kunjungan_id = k.id
                 and r.status <> 'DISERAHKAN')                                as resep_belum_diserahkan
  from kunjungan k
  join pasien p on p.id = k.pasien_id
  join poli po  on po.id = k.poli_id
  left join pegawai d on d.id = k.dokter_id
 where k.status not in ('BATAL')
   and not exists (select 1 from kasir_tagihan tg where tg.kunjungan_id = k.id);

-- H2. Tagihan lengkap dengan identitas pasien.
create or replace view v_kasir_tagihan with (security_invoker = true) as
select tg.*,
       greatest(tg.total - tg.amount_paid, 0)  as sisa,
       p.no_rm,
       p.nama            as nama_pasien,
       p.tanggal_lahir,
       p.no_hp,
       k.no_kunjungan,
       k.no_antrian,
       po.nama           as nama_poli,
       d.nama            as nama_dokter,
       pg.nama           as nama_kasir,
       (select count(*) from kasir_tagihan_item i where i.tagihan_id = tg.id) as jumlah_item
  from kasir_tagihan tg
  left join pasien p    on p.id  = tg.pasien_id
  left join kunjungan k on k.id  = tg.kunjungan_id
  left join poli po     on po.id = k.poli_id
  left join pegawai d   on d.id  = k.dokter_id
  left join pegawai pg  on pg.id = tg.dibuat_oleh;

-- H3. Rekap harian untuk tutup kas.
create or replace view v_kasir_rekap_harian with (security_invoker = true) as
select b.tanggal,
       b.metode,
       count(*)                as jumlah_transaksi,
       sum(b.jumlah)           as total
  from kasir_pembayaran b
 group by b.tanggal, b.metode;


-- =====================================================================
--  I. ROW LEVEL SECURITY
-- =====================================================================

-- Lihat catatan panjang soal GRANT di 08_apotek.sql §F.
grant select, insert, update, delete on
  kasir_tarif, kasir_tagihan, kasir_tagihan_item, kasir_pembayaran,
  sys_template_invoice to authenticated;
grant usage, select on sequence seq_no_tagihan to authenticated;

alter table kasir_tarif          enable row level security;
alter table kasir_tagihan        enable row level security;
alter table kasir_tagihan_item   enable row level security;
alter table kasir_pembayaran     enable row level security;
alter table sys_template_invoice enable row level security;

-- Tarif: semua staf boleh melihat (dokter perlu tahu biaya tindakan
-- sebelum menyarankannya). Mengubah/menambah lewat kode `menu_tarif`
-- (bukan lagi master_data) — 11 Sep 2026, lihat boleh_tarif() di atas.
drop policy if exists tarif_baca on kasir_tarif;
create policy tarif_baca on kasir_tarif for select
  to authenticated using (public.saya_staf());

drop policy if exists tarif_kelola on kasir_tarif;
create policy tarif_kelola on kasir_tarif for all
  to authenticated
  using (public.boleh_tarif())
  with check (public.boleh_tarif());

drop policy if exists tagihan_baca on kasir_tagihan;
create policy tagihan_baca on kasir_tagihan for select
  to authenticated using (public.saya_staf());

drop policy if exists tagihan_tulis on kasir_tagihan;
create policy tagihan_tulis on kasir_tagihan for all
  to authenticated
  using (public.boleh_kasir()) with check (public.boleh_kasir());

drop policy if exists titem_baca on kasir_tagihan_item;
create policy titem_baca on kasir_tagihan_item for select
  to authenticated using (public.saya_staf());

drop policy if exists titem_tulis on kasir_tagihan_item;
create policy titem_tulis on kasir_tagihan_item for all
  to authenticated
  using (public.boleh_kasir()) with check (public.boleh_kasir());

drop policy if exists bayar_baca on kasir_pembayaran;
create policy bayar_baca on kasir_pembayaran for select
  to authenticated using (public.saya_staf());

-- Menulis pembayaran lewat tangan tidak diizinkan, bahkan untuk kasir.
-- Satu-satunya jalan masuk adalah kasir_catat_pembayaran(), yang memeriksa
-- sisa tagihan dan uang yang diterima. Baris pembayaran yang bisa ditulis
-- langsung adalah baris yang bisa dikarang.
drop policy if exists bayar_tulis on kasir_pembayaran;
create policy bayar_tulis on kasir_pembayaran for all
  to authenticated
  using (public.peran_teks_saya() = 'master')
  with check (public.peran_teks_saya() = 'master');

-- Template: semua staf boleh membaca (halaman kasir memerlukannya untuk
-- mencetak), hanya admin yang mengubah.
drop policy if exists template_baca on sys_template_invoice;
create policy template_baca on sys_template_invoice for select
  to authenticated using (public.saya_staf());

drop policy if exists template_kelola on sys_template_invoice;
create policy template_kelola on sys_template_invoice for all
  to authenticated
  using (public.boleh_master_data())
  with check (public.boleh_master_data());

grant execute on function public.kasir_susun_dari_kunjungan(uuid)                            to authenticated;
grant execute on function public.kasir_catat_pembayaran(uuid,numeric,date,text,text,numeric) to authenticated;
grant execute on function public.kasir_hapus_pembayaran(uuid,text)                           to authenticated;
grant execute on function public.kasir_hapus_tagihan(uuid)                                   to authenticated;


-- =====================================================================
--  J. AUDIT
-- =====================================================================

drop trigger if exists trg_audit_tagihan on kasir_tagihan;
create trigger trg_audit_tagihan after insert or update or delete on kasir_tagihan
for each row execute function public.catat_audit();

drop trigger if exists trg_audit_bayar on kasir_pembayaran;
create trigger trg_audit_bayar after insert or update or delete on kasir_pembayaran
for each row execute function public.catat_audit();


-- =====================================================================
--  K. DATA AWAL
-- =====================================================================

-- Karcis dibuat NONAKTIF dan tidak otomatis. Menyalakannya adalah
-- keputusan klinik, bukan bawaan yang diam-diam menambah biaya ke setiap
-- tagihan begitu modul dipasang.
insert into kasir_tarif (jenis, kode, nama, tarif, otomatis, aktif, keterangan)
values ('LAYANAN', 'ADM', 'Karcis / Administrasi', 0, false, false,
        'Nyalakan lewat Master Tarif bila klinik menarik biaya administrasi. '
        'Saat otomatis dinyalakan, baris ini ikut di setiap tagihan baru.')
on conflict do nothing;
-- =====================================================================
--  RME Laboratorium Medis Utama - IMPOR STOK APOTEK DARI EXCEL
--  Jalankan SETELAH 09_kasir.sql
--
--  Berkas ini AMAN dijalankan pada database yang sudah berisi data.
--  Ia tidak membuat tabel baru dan tidak menyentuh satu baris pun yang
--  sudah ada; hanya mengganti satu fungsi dan menambah satu fungsi.
--
--  DUA HAL YANG DIKERJAKAN DI SINI
--
--  1. apotek_masuk() diberi parameter kategori.
--     Sebelumnya kategori dipatok 'Pembelian'. Untuk memuat stok yang
--     SUDAH ADA di rak saat sistem mulai dipakai, itu keliru: 300 juta
--     rupiah persediaan lama akan muncul sebagai pembelian bulan ini dan
--     laporan bulan pertama tidak bisa dipakai. Sekarang pemuatan awal
--     dicatat sebagai 'Saldo Awal' dan dipisahkan di laporan.
--
--  2. apotek_impor() memproses seluruh berkas dalam SATU transaksi.
--     Impor 80 baris yang gagal di baris ke-63 tidak boleh menyisakan 62
--     batch yang sudah masuk — apoteker tidak punya cara mengetahui di
--     mana ia berhenti, dan mengulang dari awal akan menggandakan stok.
--     Gagal di mana pun berarti tidak ada yang berubah sama sekali.
-- =====================================================================


-- =====================================================================
--  A. apotek_masuk() DENGAN KATEGORI
-- =====================================================================

-- Fungsi lama dibuang lebih dulu, bukan di-CREATE OR REPLACE.
-- Menambah parameter mengubah tanda tangan fungsi, dan PostgreSQL
-- memperlakukan itu sebagai fungsi BARU — hasilnya dua fungsi bernama
-- sama hidup berdampingan, satu di antaranya masih memaksa kategori
-- 'Pembelian'. Mana yang terpanggil bergantung pada bentuk pemanggilan,
-- dan itu jenis ketidakpastian yang tidak boleh ada di jalur stok.
drop function if exists public.apotek_masuk(uuid,numeric,numeric,date,text,text,date,text,text);

create or replace function public.apotek_masuk(
  p_obat_id     uuid,
  p_jumlah      numeric,
  p_harga_beli  numeric,
  p_tgl_expired date,
  p_pbf         text,
  p_no_faktur   text default null,
  p_tgl_masuk   date default null,
  p_no_batch    text default null,
  p_keterangan  text default null,
  p_kategori    text default 'Pembelian'
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_obat     obat%rowtype;
  v_batch    apotek_batch%rowtype;
  v_tgl      date := coalesce(p_tgl_masuk, public.tgl_klinik());
  v_grup     uuid := gen_random_uuid();
  v_digabung boolean := false;
  v_kat      text := coalesce(nullif(btrim(p_kategori), ''), 'Pembelian');
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh mencatat obat masuk.'
      using errcode = '42501';
  end if;
  if v_kat not in ('Pembelian', 'Saldo Awal') then
    raise exception 'Kategori pemasukan "%" tidak dikenal. Yang sah: Pembelian, Saldo Awal.', v_kat;
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah masuk harus lebih dari nol.';
  end if;
  if p_tgl_expired is null then
    raise exception 'Tanggal kadaluwarsa wajib diisi.';
  end if;
  if coalesce(btrim(p_pbf), '') = '' then
    raise exception 'Nama PBF / distributor wajib diisi.';
  end if;

  select * into v_obat from obat where id = p_obat_id;
  if not found then
    raise exception 'Obat tidak ditemukan di master obat.';
  end if;

  perform public.apotek_kunci_obat(p_obat_id);

  select * into v_batch from apotek_batch
   where obat_id = p_obat_id
     and tgl_expired = p_tgl_expired
     and coalesce(no_faktur,'') = coalesce(p_no_faktur,'')
     and lower(pbf) = lower(btrim(p_pbf))
     and harga_beli = p_harga_beli;

  if found then
    update apotek_batch
       set stok_awal  = stok_awal + p_jumlah,
           stok_sisa  = stok_sisa + p_jumlah,
           updated_at = now()
     where id = v_batch.id
     returning * into v_batch;
    v_digabung := true;
  else
    insert into apotek_batch (obat_id, no_batch, tgl_expired, tgl_masuk, no_faktur,
                              pbf, harga_beli, stok_awal, stok_sisa, keterangan, dibuat_oleh)
    values (p_obat_id, p_no_batch, p_tgl_expired, v_tgl, p_no_faktur,
            btrim(p_pbf), p_harga_beli, p_jumlah, p_jumlah, p_keterangan, auth.uid())
    returning * into v_batch;
  end if;

  insert into apotek_transaksi (batch_id, obat_id, nama_obat, satuan, jenis, kategori,
                                jumlah, harga_satuan, total_nilai, tanggal,
                                no_faktur, pbf, grup_id, keterangan, dibuat_oleh)
  values (v_batch.id, p_obat_id, v_obat.nama, v_obat.satuan, 'MASUK', v_kat,
          p_jumlah, p_harga_beli, p_jumlah * p_harga_beli, v_tgl,
          p_no_faktur, btrim(p_pbf), v_grup, p_keterangan, auth.uid());

  return jsonb_build_object(
    'batch_id',  v_batch.id,
    'grup_id',   v_grup,
    'digabung',  v_digabung,
    'kategori',  v_kat,
    'stok_sisa', v_batch.stok_sisa
  );
end $$;

grant execute on function
  public.apotek_masuk(uuid,numeric,numeric,date,text,text,date,text,text,text)
  to authenticated;


-- =====================================================================
--  B. IMPOR MASSAL
-- =====================================================================

-- p_baris berbentuk array objek:
--   [{ "obat_id": "uuid"                       -- bila sudah cocok master
--    , "obat_baru": {"nama","satuan","kode_internal","harga"}   -- bila dibuat baru
--    , "jumlah", "harga_beli", "tgl_expired"
--    , "tgl_masuk", "no_faktur", "pbf", "no_batch", "keterangan" }]
--
-- Pencocokan nama obat dikerjakan di sisi aplikasi (apotek_excel.js),
-- di mana apoteker bisa melihat dan membetulkannya baris per baris
-- sebelum apa pun ditulis. Fungsi ini hanya menerima keputusan yang
-- sudah bulat: obat mana, berapa, batch apa.
create or replace function public.apotek_impor(
  p_baris  jsonb,
  p_jenis  text default 'Pembelian'
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_b          jsonb;
  v_i          int := 0;
  v_obat_id    uuid;
  v_baru       jsonb;
  v_nama       text;
  v_kode       text;
  v_hasil      jsonb;
  v_dibuat     int := 0;
  v_batch_baru int := 0;
  v_gabung     int := 0;
  v_nilai      numeric := 0;
  v_nama_baru  text[] := '{}';
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh mengimpor stok.'
      using errcode = '42501';
  end if;
  if p_jenis not in ('Pembelian', 'Saldo Awal') then
    raise exception 'Jenis impor "%" tidak dikenal.', p_jenis;
  end if;
  if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
    raise exception 'Tidak ada baris untuk diimpor.';
  end if;
  if jsonb_array_length(p_baris) > 2000 then
    raise exception 'Sekali impor dibatasi 2.000 baris. Pecah berkasnya lebih dulu.';
  end if;

  for v_b in select * from jsonb_array_elements(p_baris)
  loop
    v_i := v_i + 1;

    -- ── Menentukan obatnya ────────────────────────────────────────────
    v_obat_id := nullif(v_b->>'obat_id','')::uuid;
    v_baru    := v_b->'obat_baru';

    if v_obat_id is null and (v_baru is null or jsonb_typeof(v_baru) <> 'object') then
      raise exception 'Baris %: obat belum ditentukan.', v_i;
    end if;

    if v_obat_id is null then
      v_nama := btrim(coalesce(v_baru->>'nama',''));
      v_kode := nullif(btrim(coalesce(v_baru->>'kode_internal','')), '');
      if v_nama = '' then
        raise exception 'Baris %: nama obat baru kosong.', v_i;
      end if;

      /* Cari dulu sebelum membuat. Satu berkas impor sering memuat
         beberapa batch dari obat yang sama — tanpa pencarian ini, baris
         kedua akan membuat obat kembar dengan nama yang persis sama, dan
         stoknya terpecah ke dua kartu yang tidak akan pernah dijumlahkan. */
      select id into v_obat_id from obat
       where (v_kode is not null and kode_internal = v_kode)
          or (v_kode is null and lower(btrim(nama)) = lower(v_nama))
       limit 1;

      if v_obat_id is null then
        insert into obat (kode_internal, nama, satuan, harga, aktif)
        values (v_kode, v_nama,
                coalesce(nullif(btrim(v_baru->>'satuan'),''), 'Tablet'),
                coalesce((v_baru->>'harga')::numeric, 0), true)
        returning id into v_obat_id;

        v_dibuat := v_dibuat + 1;
        v_nama_baru := v_nama_baru || v_nama;

        /* Tabel obat tidak punya pemicu audit, sedangkan menambah obat
           lewat impor adalah satu-satunya jalan bagi apoteker menyentuh
           master data. Jejaknya ditulis di sini supaya tetap bisa
           ditelusuri siapa menambahkan apa, dan kapan. */
        insert into audit_log (user_id, user_nama, aksi, tabel, record_id, data_baru, keterangan)
        values (auth.uid(), (select nama from pegawai where id = auth.uid()),
                'INSERT', 'obat', v_obat_id::text,
                jsonb_build_object('nama', v_nama, 'kode_internal', v_kode),
                'Dibuat otomatis lewat impor stok (' || p_jenis || ')');
      end if;
    end if;

    -- ── Memasukkan batch-nya ──────────────────────────────────────────
    begin
      v_hasil := public.apotek_masuk(
        p_obat_id     => v_obat_id,
        p_jumlah      => (v_b->>'jumlah')::numeric,
        p_harga_beli  => coalesce((v_b->>'harga_beli')::numeric, 0),
        p_tgl_expired => (v_b->>'tgl_expired')::date,
        p_pbf         => v_b->>'pbf',
        p_no_faktur   => nullif(v_b->>'no_faktur',''),
        p_tgl_masuk   => nullif(v_b->>'tgl_masuk','')::date,
        p_no_batch    => nullif(v_b->>'no_batch',''),
        p_keterangan  => nullif(v_b->>'keterangan',''),
        p_kategori    => p_jenis
      );
    exception when others then
      /* Nomor baris ditempelkan ke pesan aslinya. Tanpa itu apoteker
         hanya melihat "Tanggal kadaluwarsa wajib diisi" untuk berkas 80
         baris, dan harus menebak yang mana. */
      raise exception 'Baris %: %', v_i, sqlerrm;
    end;

    if (v_hasil->>'digabung')::boolean then v_gabung := v_gabung + 1;
    else v_batch_baru := v_batch_baru + 1; end if;
    v_nilai := v_nilai + (v_b->>'jumlah')::numeric
                       * coalesce((v_b->>'harga_beli')::numeric, 0);
  end loop;

  return jsonb_build_object(
    'jenis',            p_jenis,
    'baris',            v_i,
    'batch_baru',       v_batch_baru,
    'batch_digabung',   v_gabung,
    'obat_baru',        v_dibuat,
    'nama_obat_baru',   to_jsonb(v_nama_baru),
    'total_nilai',      v_nilai
  );
end $$;

grant execute on function public.apotek_impor(jsonb, text) to authenticated;


-- =====================================================================
--  C. DAFTAR OBAT UNTUK PENCOCOKAN
-- =====================================================================

-- Halaman impor membutuhkan SELURUH master obat sekaligus untuk
-- mencocokkan nama — termasuk yang nonaktif, supaya obat yang pernah
-- dinonaktifkan tidak lahir kembali sebagai duplikat. Kolomnya sengaja
-- dibatasi: yang dikirim ke browser hanya yang benar-benar dipakai
-- mencocokkan dan menampilkan.
create or replace view v_obat_pencocokan with (security_invoker = true) as
select id, kode_internal, nama, nama_generik, satuan, bentuk_sediaan,
       kekuatan, harga, aktif
  from obat;
-- =====================================================================
--  RME Laboratorium Medis Utama - PEMERIKSAAN PENUNJANG
--  Laboratorium, bacaan rontgen gigi, EKG/USG, dan register arsip berkas.
--  Jalankan SETELAH 10_apotek_impor.sql
--
--  ---------------------------------------------------------------------
--  KEPUTUSAN PENTING: MODUL INI TIDAK MENYIMPAN SATU BYTE GAMBAR PUN.
--  ---------------------------------------------------------------------
--  Supabase paket gratis memberi 1 GB penyimpanan berkas dan 5 GB unduhan
--  per bulan. Satu foto rontgen dari kamera HP berukuran 3-5 MB; seratus
--  foto sebulan menghabiskan kuota setahun dalam dua tahun, dan saat penuh
--  unggahan gagal di tengah jam praktek.
--
--  Karena itu yang disimpan di sini adalah ISI MEDISNYA, bukan gambarnya:
--    - Hasil lab disimpan sebagai ANGKA per pemeriksaan, bukan foto lembar
--      hasil. Angka bisa ditandai Tinggi/Rendah otomatis, bisa ditren antar
--      kunjungan, dan kelak bisa dikirim ke SatuSehat sebagai Observation.
--      Foto lembar hasil tidak bisa satu pun dari ketiganya.
--    - Rontgen gigi disimpan sebagai BACAAN: temuan, kesan, dan saran,
--      terkait ke nomor gigi. Inilah yang dibaca dokter berikutnya; film
--      aslinya jarang dibuka ulang.
--    - Berkas fisik (film, lembar hasil lab luar, surat) dicatat di tabel
--      `lampiran` beserta NOMOR ARSIP yang dibuat otomatis. Nomor itu
--      ditulis di berkasnya, berkasnya disimpan berurutan di klinik. Nol
--      byte, tetap ketemu saat dicari.
--
--  Ukuran satu hasil lab lengkap kira-kira 2 KB di database. Kuota database
--  500 MB baru habis setelah sekitar 250.000 pemeriksaan.
--
--  Kalau suatu hari klinik pindah ke paket berbayar dan ingin menyimpan
--  gambarnya juga: kolom `berkas_*` di tabel `lampiran` sudah disiapkan dan
--  dibiarkan kosong. Yang perlu ditambah hanya unggahan di sisi aplikasi —
--  skema, RLS, dan laporan tidak berubah. Lihat catatan di bagian E.
-- =====================================================================


-- =====================================================================
--  A. HAK AKSES
-- =====================================================================

-- Siapa yang boleh MENGISI hasil lab.
-- Sengaja tidak dibuat peran baru "analis": di klinik pratama laboratorium
-- umumnya dikerjakan perawat atau analis yang terdaftar sebagai perawat.
-- Menambah nilai enum peran berarti satu berkas migrasi yang harus
-- dijalankan sendirian (lihat 07_peran_kasir.sql) — risiko pasang yang
-- tidak sebanding dengan manfaatnya sekarang.
-- 9 Sep 2026: lewat tabel hak_akses (bisa diatur master), bukan daftar
-- peran tetap lagi — lihat sql/02_rls.sql bagian HAK AKSES.
create or replace function public.boleh_lab() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('lab') $$;

-- Siapa yang boleh MEMBACA/menafsirkan penunjang (rontgen, EKG, USG).
-- Menafsirkan gambaran radiologis adalah tindakan medis, bukan tugas
-- administratif. Karena itu bawaannya hanya dokter.
create or replace function public.boleh_bacaan() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('bacaan') $$;

-- Register arsip berkas fisik: pendaftaran (sekarang 'admin'), perawat, dokter.
create or replace function public.boleh_lampiran() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('lampiran') $$;

grant execute on function public.boleh_lab()      to authenticated;
grant execute on function public.boleh_bacaan()   to authenticated;
grant execute on function public.boleh_lampiran() to authenticated;

insert into public.hak_akses (kode, peran, diizinkan) values
  ('lab',      'perawat', true),
  ('lab',      'dokter',  true),
  ('bacaan',   'dokter',  true),
  ('lampiran', 'admin',   true),
  ('lampiran', 'perawat', true),
  ('lampiran', 'dokter',  true)
on conflict (kode, peran) do nothing;


-- =====================================================================
--  B. MASTER PEMERIKSAAN LABORATORIUM
-- =====================================================================

create table if not exists ref_lab (
  id            uuid primary key default uuid_generate_v4(),
  kode          text not null unique,          -- kode internal, mis. 'HB'
  nama          text not null,
  kelompok      text not null default 'Lainnya',
  -- HEMATOLOGI | KIMIA KLINIK | URINALISIS | IMUNOSEROLOGI | MIKROBIOLOGI |
  -- FESES | LAINNYA — bebas, dipakai untuk mengelompokkan di layar & cetakan
  satuan        text,
  jenis_nilai   text not null default 'ANGKA'
                check (jenis_nilai in ('ANGKA','TEKS','PILIHAN')),
  -- Untuk jenis_nilai = 'PILIHAN': daftar jawaban yang boleh dipilih.
  pilihan       text[],
  -- Jawaban yang dianggap normal untuk TEKS/PILIHAN, mis. 'Negatif'.
  teks_normal   text,
  desimal       smallint not null default 1 check (desimal between 0 and 4),
  -- Kode LOINC untuk SatuSehat. Dibiarkan kosong sampai klinik terdaftar;
  -- selama kosong, Observation.code tidak dikirim dan sisa payload tetap
  -- valid — pola yang sama dengan ref_gigi.kode_snomed.
  kode_loinc    text,
  urutan        smallint not null default 0,
  aktif         boolean not null default true,
  keterangan    text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_ref_lab_kelompok on ref_lab (kelompok, urutan)
  where aktif;

-- Nilai rujukan. Satu pemeriksaan boleh punya beberapa baris: laki-laki,
-- perempuan, dan beberapa rentang umur. Yang paling khusus yang dipakai.
create table if not exists ref_lab_rujukan (
  id             uuid primary key default uuid_generate_v4(),
  lab_id         uuid not null references ref_lab(id) on delete cascade,
  -- NULL = berlaku untuk kedua jenis kelamin
  jenis_kelamin  jenis_kelamin_t,
  -- Rentang umur dalam BULAN. NULL = tanpa batas di sisi itu.
  -- Batas bawah inklusif, batas atas eksklusif: [umur_min, umur_max)
  umur_min_bulan integer,
  umur_max_bulan integer,
  batas_bawah    numeric(14,4),
  batas_atas     numeric(14,4),
  -- Nilai kritis: hasil yang harus segera diberitahukan ke dokter,
  -- bukan sekadar "di luar normal". Kosongkan bila tidak dipakai.
  kritis_bawah   numeric(14,4),
  kritis_atas    numeric(14,4),
  -- Teks yang dicetak di kolom "Nilai rujukan" pada lembar hasil.
  -- Bila kosong, dibentuk otomatis dari batas_bawah/batas_atas.
  teks           text,
  catatan        text
);

create index if not exists idx_ref_lab_rujukan_lab on ref_lab_rujukan (lab_id);

-- Paket pemeriksaan. Dokter jarang meminta "Hemoglobin" sendirian; yang
-- diminta "Darah Rutin". Paket menghemat lima klik menjadi satu.
create table if not exists ref_lab_paket (
  id       uuid primary key default uuid_generate_v4(),
  kode     text not null unique,
  nama     text not null,
  urutan   smallint not null default 0,
  aktif    boolean not null default true
);

create table if not exists ref_lab_paket_item (
  paket_id uuid not null references ref_lab_paket(id) on delete cascade,
  lab_id   uuid not null references ref_lab(id) on delete cascade,
  urutan   smallint not null default 0,
  primary key (paket_id, lab_id)
);


-- =====================================================================
--  C. PERMINTAAN & HASIL LABORATORIUM
-- =====================================================================

-- Satu permintaan = satu lembar hasil. Boleh berisi banyak pemeriksaan.
create table if not exists lab_permintaan (
  id             uuid primary key default uuid_generate_v4(),
  no_lab         text not null unique,             -- LAB-YYYY-NNNN
  pasien_id      uuid not null references pasien(id),
  -- Boleh kosong: hasil lab luar yang dibawa pasien dari sebelum ia
  -- terdaftar di sini tetap perlu tempat, tanpa harus mengarang kunjungan.
  kunjungan_id   uuid references kunjungan(id) on delete set null,
  tanggal        date not null default public.tgl_klinik(),
  -- INTERNAL = dikerjakan di klinik; EKSTERNAL = hasil dari lab luar yang
  -- angkanya diketik ulang di sini agar ikut tertren.
  asal           text not null default 'INTERNAL'
                 check (asal in ('INTERNAL','EKSTERNAL')),
  nama_lab_luar  text,                             -- diisi bila asal = EKSTERNAL
  no_lembar_luar text,                             -- nomor pada lembar hasil lab luar
  catatan_klinis text,                             -- keterangan dari dokter peminta
  status         text not null default 'DIMINTA'
                 check (status in ('DIMINTA','DIKERJAKAN','SELESAI','BATAL')),
  alasan_batal   text,
  diminta_oleh   uuid references pegawai(id),
  diminta_pada   timestamptz not null default now(),
  dikerjakan_oleh uuid references pegawai(id),
  selesai_oleh   uuid references pegawai(id),
  waktu_selesai  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_lab_permintaan_pasien on lab_permintaan (pasien_id, tanggal desc);
create index if not exists idx_lab_permintaan_kunjungan on lab_permintaan (kunjungan_id);
create index if not exists idx_lab_permintaan_antrean on lab_permintaan (tanggal, status)
  where status in ('DIMINTA','DIKERJAKAN');

create sequence if not exists seq_no_lab;

create or replace function public.gen_no_lab() returns trigger
language plpgsql as $$
begin
  if new.no_lab is null or new.no_lab = '' then
    new.no_lab := 'LAB-' || to_char(coalesce(new.tanggal, public.tgl_klinik()),'YYYY')
                  || '-' || lpad(nextval('seq_no_lab')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_gen_no_lab on lab_permintaan;
create trigger trg_gen_no_lab before insert on lab_permintaan
for each row execute function public.gen_no_lab();

drop trigger if exists trg_updated_lab_permintaan on lab_permintaan;
create trigger trg_updated_lab_permintaan before update on lab_permintaan
for each row execute function set_updated_at();


-- Satu baris = satu pemeriksaan pada satu lembar.
create table if not exists lab_hasil (
  id             uuid primary key default uuid_generate_v4(),
  permintaan_id  uuid not null references lab_permintaan(id) on delete cascade,
  lab_id         uuid not null references ref_lab(id),
  -- Potret nama & satuan saat diperiksa. Master boleh berubah nanti;
  -- lembar hasil tahun lalu tidak boleh ikut berubah karenanya — prinsip
  -- yang sama dengan tarif di modul kasir.
  nama           text not null,
  satuan         text,
  nilai_angka    numeric(14,4),
  nilai_teks     text,
  -- Nilai rujukan yang BERLAKU SAAT ITU, disalin dari master oleh trigger.
  rujukan_bawah  numeric(14,4),
  rujukan_atas   numeric(14,4),
  rujukan_kritis_bawah numeric(14,4),
  rujukan_kritis_atas  numeric(14,4),
  rujukan_teks   text,
  tanda          text not null default 'BELUM'
                 check (tanda in ('BELUM','NORMAL','RENDAH','TINGGI',
                                  'KRITIS_RENDAH','KRITIS_TINGGI','ABNORMAL')),
  catatan        text,
  urutan         smallint not null default 0,
  diisi_oleh     uuid references pegawai(id),
  diisi_pada     timestamptz,
  unique (permintaan_id, lab_id)
);

create index if not exists idx_lab_hasil_permintaan on lab_hasil (permintaan_id, urutan);
create index if not exists idx_lab_hasil_tren on lab_hasil (lab_id);


-- =====================================================================
--  D. BACAAN PENUNJANG — RONTGEN GIGI, EKG, USG
-- =====================================================================

-- Yang disimpan adalah hasil bacanya, bukan gambarnya. Bentuk isiannya
-- mengikuti kebiasaan penulisan radiologi: temuan (apa yang terlihat),
-- kesan (kesimpulan), saran (tindak lanjut).
create table if not exists penunjang (
  id            uuid primary key default uuid_generate_v4(),
  pasien_id     uuid not null references pasien(id),
  kunjungan_id  uuid references kunjungan(id) on delete set null,
  tanggal       date not null default public.tgl_klinik(),
  jenis         text not null
                check (jenis in ('RO_PERIAPIKAL','RO_BITEWING','RO_PANORAMIK',
                                 'RO_OKLUSAL','RO_SEFALOMETRI','RO_THORAX',
                                 'RO_LAIN','EKG','USG','LAINNYA')),
  -- Nama pemeriksaan versi bebas, mis. "Rontgen periapikal regio 36-37"
  judul         text,
  asal          text not null default 'INTERNAL'
                check (asal in ('INTERNAL','EKSTERNAL')),
  nama_tempat   text,                     -- diisi bila asal = EKSTERNAL
  no_film       text,                     -- nomor film / nomor ekspertise dari luar
  temuan        text,                     -- deskripsi gambaran radiologis
  kesan         text not null,            -- kesimpulan — bagian yang wajib
  saran         text,
  dibaca_oleh   uuid references pegawai(id),
  dibaca_pada   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_penunjang_pasien on penunjang (pasien_id, tanggal desc);
create index if not exists idx_penunjang_kunjungan on penunjang (kunjungan_id);

-- Kaitan bacaan ke nomor gigi. Satu foto periapikal biasanya memuat dua
-- sampai tiga gigi, jadi hubungannya banyak-ke-banyak.
-- Inilah yang membuat odontogram bisa menandai gigi yang pernah dirontgen,
-- dan membuka riwayat bacaannya saat gigi itu diklik.
create table if not exists penunjang_gigi (
  penunjang_id uuid not null references penunjang(id) on delete cascade,
  fdi          text not null references ref_gigi(fdi),
  primary key (penunjang_id, fdi)
);

create index if not exists idx_penunjang_gigi_fdi on penunjang_gigi (fdi);


-- =====================================================================
--  E. REGISTER ARSIP BERKAS
-- =====================================================================
--  Film rontgen, lembar hasil lab luar, surat rujukan, dan informed consent
--  tetap ada wujud fisiknya. PMK 24/2022 mewajibkan rekam medis disimpan
--  25 tahun; yang tidak diwajibkan adalah menyimpannya dalam bentuk digital.
--
--  Tabel ini memberi setiap berkas satu NOMOR ARSIP. Alurnya:
--    1. Petugas mencatat berkasnya di sini → sistem memberi ARS-2026-0001
--    2. Nomor itu ditulis di pojok berkasnya dengan spidol
--    3. Berkasnya disimpan berurutan menurut nomor
--  Mencari film gigi 36 dari dua tahun lalu berubah dari membongkar lemari
--  menjadi membaca satu nomor di layar.
--
--  Kolom berkas_* dibiarkan kosong dan tanpa arti selama klinik memakai
--  paket gratis. Bila kelak berlangganan dan ingin mengunggah gambarnya:
--  isi berkas_path dengan lokasi di Supabase Storage, dan `bentuk` akan
--  ikut berubah menjadi DIGITAL dengan sendirinya. Tidak ada satu pun
--  tabel, kebijakan RLS, atau laporan yang perlu diubah.
create table if not exists lampiran (
  id             uuid primary key default uuid_generate_v4(),
  no_arsip       text not null unique,          -- ARS-YYYY-NNNN
  pasien_id      uuid not null references pasien(id),
  kunjungan_id   uuid references kunjungan(id) on delete set null,
  -- Penunjuk balik ke bacaan/lab yang berkasnya ini, bila ada.
  penunjang_id   uuid references penunjang(id) on delete set null,
  lab_permintaan_id uuid references lab_permintaan(id) on delete set null,
  jenis          text not null default 'LAINNYA'
                 check (jenis in ('FILM_RONTGEN','HASIL_LAB_LUAR','SURAT_RUJUKAN',
                                  'HASIL_EKG','HASIL_USG','INFORMED_CONSENT',
                                  'RESUME_LUAR','IDENTITAS','LAINNYA')),
  judul          text not null,
  tanggal_dokumen date,
  asal           text,                          -- nama lab / RS / klinik penerbit
  no_dokumen     text,                          -- nomor pada dokumen aslinya
  lokasi_simpan  text,                          -- mis. "Lemari B, laci 2"
  catatan        text,
  -- ---- Disiapkan untuk berkas digital, tidak dipakai pada paket gratis ----
  berkas_path    text,
  berkas_mime    text,
  berkas_ukuran  bigint,
  berkas_sha256  text,
  -- ------------------------------------------------------------------------
  bentuk         text generated always as
                   (case when berkas_path is null then 'FISIK' else 'DIGITAL' end) stored,
  dibuat_oleh    uuid references pegawai(id),
  dibuat_pada    timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_lampiran_pasien on lampiran (pasien_id, tanggal_dokumen desc);
create index if not exists idx_lampiran_kunjungan on lampiran (kunjungan_id);

create sequence if not exists seq_no_arsip;

create or replace function public.gen_no_arsip() returns trigger
language plpgsql as $$
begin
  if new.no_arsip is null or new.no_arsip = '' then
    new.no_arsip := 'ARS-' || to_char(coalesce(new.tanggal_dokumen, public.tgl_klinik()),'YYYY')
                    || '-' || lpad(nextval('seq_no_arsip')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_gen_no_arsip on lampiran;
create trigger trg_gen_no_arsip before insert on lampiran
for each row execute function public.gen_no_arsip();

drop trigger if exists trg_updated_lampiran on lampiran;
create trigger trg_updated_lampiran before update on lampiran
for each row execute function set_updated_at();

drop trigger if exists trg_updated_penunjang on penunjang;
create trigger trg_updated_penunjang before update on penunjang
for each row execute function set_updated_at();


-- =====================================================================
--  F. FUNGSI
-- =====================================================================

-- F1. Nilai rujukan yang paling cocok untuk seorang pasien.
--     Urutan kekhususan: baris berjenis kelamin tepat menang atas baris
--     tanpa jenis kelamin; di antara yang sama, rentang umur tersempit
--     yang menang. Tanpa aturan ini, "Hb 12,5 pada laki-laki dewasa" bisa
--     terbaca normal hanya karena baris umum kebetulan ditemukan lebih dulu.
create or replace function public.lab_rujukan_untuk(
  p_lab_id       uuid,
  p_jenis_kelamin jenis_kelamin_t,
  p_umur_bulan   integer
) returns ref_lab_rujukan
language sql stable security definer set search_path = public
as $$
  select r.* from ref_lab_rujukan r
   where r.lab_id = p_lab_id
     and (r.jenis_kelamin is null or r.jenis_kelamin = p_jenis_kelamin)
     and (r.umur_min_bulan is null or p_umur_bulan is null or p_umur_bulan >= r.umur_min_bulan)
     and (r.umur_max_bulan is null or p_umur_bulan is null or p_umur_bulan <  r.umur_max_bulan)
   order by (r.jenis_kelamin is not null) desc,
            coalesce(r.umur_max_bulan, 2147483647) - coalesce(r.umur_min_bulan, 0) asc
   limit 1
$$;

grant execute on function public.lab_rujukan_untuk(uuid, jenis_kelamin_t, integer) to authenticated;


-- F2. Menentukan tanda dari sebuah nilai.
create or replace function public.lab_tanda(
  p_nilai        numeric,
  p_bawah        numeric,
  p_atas         numeric,
  p_kritis_bawah numeric,
  p_kritis_atas  numeric
) returns text
language sql immutable
as $$
  select case
    when p_nilai is null then 'BELUM'
    when p_kritis_bawah is not null and p_nilai <= p_kritis_bawah then 'KRITIS_RENDAH'
    when p_kritis_atas  is not null and p_nilai >= p_kritis_atas  then 'KRITIS_TINGGI'
    when p_bawah is not null and p_nilai < p_bawah then 'RENDAH'
    when p_atas  is not null and p_nilai > p_atas  then 'TINGGI'
    when p_bawah is null and p_atas is null then 'BELUM'
    else 'NORMAL'
  end
$$;

grant execute on function public.lab_tanda(numeric, numeric, numeric, numeric, numeric) to authenticated;


-- F3. Menyalin nilai rujukan dan menghitung tanda, otomatis, di database.
--     Ditaruh di trigger dan bukan di JavaScript dengan sengaja: hasil lab
--     yang masuk lewat impor, lewat halaman lain, atau lewat dasbor Supabase
--     harus ditandai dengan aturan yang sama persis. Aturan yang hanya ada
--     di satu halaman akan berbeda begitu ada halaman kedua.
create or replace function public.lab_hitung_tanda() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_lab    ref_lab%rowtype;
  v_lp     lab_permintaan%rowtype;
  v_pasien pasien%rowtype;
  v_ruj    ref_lab_rujukan%rowtype;
  v_umur   integer;
begin
  select * into v_lab from ref_lab where id = new.lab_id;
  if not found then raise exception 'Pemeriksaan lab tidak dikenal.'; end if;

  select * into v_lp from lab_permintaan where id = new.permintaan_id;
  select * into v_pasien from pasien where id = v_lp.pasien_id;

  -- Nilai rujukan disalin SEKALI saja, saat barisnya dibuat. Setelah itu
  -- ia milik lembar ini selamanya.
  --
  -- Kalau salinan ini diperbarui juga pada UPDATE, koreksi satu angka
  -- pada lembar bulan lalu akan diam-diam menarik rentang alat yang
  -- BARU ke lembar lama — dan janji "memperbaiki master tidak mengubah
  -- hasil yang sudah keluar" jadi bohong tanpa ada yang menyadarinya.
  if tg_op = 'INSERT' then
    new.nama   := coalesce(nullif(new.nama, ''), v_lab.nama);
    new.satuan := coalesce(new.satuan, v_lab.satuan);

    -- Umur dihitung pada TANGGAL PEMERIKSAAN, bukan hari ini. Bedanya
    -- menentukan: hasil lab luar bertanggal saat pasien masih bayi harus
    -- dinilai dengan rujukan bayi, bukan rujukan umurnya sekarang.
    v_umur := case when v_pasien.tanggal_lahir is null then null
                   else (extract(year  from age(v_lp.tanggal, v_pasien.tanggal_lahir)) * 12
                       + extract(month from age(v_lp.tanggal, v_pasien.tanggal_lahir)))::int end;

    v_ruj := public.lab_rujukan_untuk(new.lab_id, v_pasien.jenis_kelamin, v_umur);

    new.rujukan_bawah        := v_ruj.batas_bawah;
    new.rujukan_atas         := v_ruj.batas_atas;
    new.rujukan_kritis_bawah := v_ruj.kritis_bawah;
    new.rujukan_kritis_atas  := v_ruj.kritis_atas;
    new.rujukan_teks := coalesce(
        v_ruj.teks,
        case
          when v_ruj.batas_bawah is not null and v_ruj.batas_atas is not null
            then trim(to_char(v_ruj.batas_bawah,'FM999999990.0999')) || ' - ' ||
                 trim(to_char(v_ruj.batas_atas ,'FM999999990.0999'))
          when v_ruj.batas_atas  is not null
            then '< ' || trim(to_char(v_ruj.batas_atas ,'FM999999990.0999'))
          when v_ruj.batas_bawah is not null
            then '> ' || trim(to_char(v_ruj.batas_bawah,'FM999999990.0999'))
          else v_lab.teks_normal
        end);
  else
    -- Salinan tidak boleh diganti lewat UPDATE biasa.
    new.rujukan_bawah        := old.rujukan_bawah;
    new.rujukan_atas         := old.rujukan_atas;
    new.rujukan_kritis_bawah := old.rujukan_kritis_bawah;
    new.rujukan_kritis_atas  := old.rujukan_kritis_atas;
    new.rujukan_teks         := old.rujukan_teks;
    new.nama                 := old.nama;
  end if;

  -- Tanda selalu dihitung dari SALINAN di baris ini, bukan dari master.
  if v_lab.jenis_nilai = 'ANGKA' then
    new.tanda := public.lab_tanda(new.nilai_angka, new.rujukan_bawah, new.rujukan_atas,
                                  new.rujukan_kritis_bawah, new.rujukan_kritis_atas);
  else
    new.tanda := case
      when new.nilai_teks is null or new.nilai_teks = '' then 'BELUM'
      when v_lab.teks_normal is null then 'NORMAL'
      when lower(trim(new.nilai_teks)) = lower(trim(v_lab.teks_normal)) then 'NORMAL'
      else 'ABNORMAL' end;
  end if;

  if (new.nilai_angka is not null or nullif(new.nilai_teks,'') is not null) then
    if new.diisi_pada is null then
      new.diisi_pada := now();
      new.diisi_oleh := coalesce(new.diisi_oleh, auth.uid());
    end if;
    -- Lembar yang mulai diisi otomatis naik dari Diminta ke Dikerjakan.
    -- Ditaruh di sini, bukan di JavaScript: statusnya harus benar walau
    -- hasilnya masuk lewat jalan lain.
    update lab_permintaan
       set status = 'DIKERJAKAN',
           dikerjakan_oleh = coalesce(dikerjakan_oleh, auth.uid())
     where id = new.permintaan_id and status = 'DIMINTA';
  end if;

  return new;
end $$;

drop trigger if exists trg_lab_hitung_tanda on lab_hasil;
create trigger trg_lab_hitung_tanda before insert or update on lab_hasil
for each row execute function public.lab_hitung_tanda();


-- F4. Mengunci lembar hasil yang sudah selesai.
--     Hasil lab yang sudah keluar dan dibaca dokter adalah dokumen medis.
--     Mengoreksinya diam-diam sama saja menghapus jejak; yang benar adalah
--     admin membuka kuncinya, dan perubahannya tercatat di audit_log.
create or replace function public.lab_cegah_ubah_selesai() returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_status text;
begin
  select status into v_status from lab_permintaan
   where id = coalesce(new.permintaan_id, old.permintaan_id);
  if v_status = 'SELESAI' and public.peran_teks_saya() <> 'master' then
    raise exception 'Lembar hasil ini sudah selesai dan terkunci. Minta master membuka kuncinya bila ada koreksi.'
      using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_lab_cegah_ubah_selesai on lab_hasil;
create trigger trg_lab_cegah_ubah_selesai before update or delete on lab_hasil
for each row execute function public.lab_cegah_ubah_selesai();


-- F5. Membuat lembar pemeriksaan. Satu panggilan, satu transaksi.
--
--     Dua hal berbeda yang kebetulan berbagi satu tabel:
--       INTERNAL  = dokter MEMINTA pemeriksaan dikerjakan. Itu keputusan
--                   klinis, jadi hanya dokter.
--       EKSTERNAL = petugas MENCATAT hasil jadi dari lab luar. Itu entri
--                   data, jadi petugas lab pun boleh.
--     Kalau keduanya disamakan sebagai kewenangan dokter, perawat tidak
--     bisa memasukkan lembar hasil yang dibawa pasien dari lab luar — dan
--     angkanya akan berakhir sebagai selembar kertas yang tidak tertren.
--
--     Kunjungan boleh kosong: hasil lab luar bertanggal sebelum pasien
--     terdaftar di sini tetap perlu tempat. Bila kunjungan kosong, pasien
--     wajib disebut.
drop function if exists public.lab_minta(uuid, uuid[], text, text, text);

create or replace function public.lab_minta(
  p_kunjungan_id   uuid,
  p_lab_ids        uuid[],
  p_catatan        text default null,
  p_asal           text default 'INTERNAL',
  p_nama_lab_luar  text default null,
  p_pasien_id      uuid default null,
  p_tanggal        date default null,
  p_no_lembar_luar text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_k       kunjungan%rowtype;
  v_pasien  uuid;
  v_tanggal date;
  v_id      uuid;
  v_urut    smallint := 0;
  r         record;
begin
  if coalesce(p_asal,'INTERNAL') = 'EKSTERNAL' then
    if not (public.boleh_lab() or public.boleh_bacaan()) then
      raise exception 'Anda tidak berhak mencatat hasil laboratorium.' using errcode = '42501';
    end if;
  elsif not public.boleh_bacaan() then
    raise exception 'Hanya dokter dan admin yang boleh meminta pemeriksaan penunjang.'
      using errcode = '42501';
  end if;

  if p_lab_ids is null or array_length(p_lab_ids, 1) is null then
    raise exception 'Tidak ada pemeriksaan yang dipilih.';
  end if;

  if p_kunjungan_id is not null then
    select * into v_k from kunjungan where id = p_kunjungan_id;
    if not found then raise exception 'Kunjungan tidak ditemukan.'; end if;
    v_pasien  := v_k.pasien_id;
    v_tanggal := coalesce(p_tanggal, v_k.tanggal);
  else
    if p_pasien_id is null then
      raise exception 'Hasil lab tanpa kunjungan tetap harus menyebut pasiennya.';
    end if;
    if not exists (select 1 from pasien where id = p_pasien_id) then
      raise exception 'Pasien tidak ditemukan.';
    end if;
    v_pasien  := p_pasien_id;
    v_tanggal := coalesce(p_tanggal, public.tgl_klinik());
  end if;

  insert into lab_permintaan (pasien_id, kunjungan_id, tanggal, asal, nama_lab_luar,
                              no_lembar_luar, catatan_klinis, diminta_oleh)
  values (v_pasien, p_kunjungan_id, v_tanggal, coalesce(p_asal,'INTERNAL'), p_nama_lab_luar,
          p_no_lembar_luar, p_catatan, auth.uid())
  returning id into v_id;

  -- Urutan mengikuti master supaya lembar hasil selalu tersusun sama:
  -- hematologi dulu, kimia klinik, lalu urinalisis. Petugas membaca lembar
  -- yang bentuknya tetap jauh lebih cepat daripada yang urutannya berubah.
  for r in select l.id, l.nama, l.satuan from ref_lab l
            where l.aktif
              and (l.id = any(p_lab_ids) 
                   or exists (
                     select 1 from ref_lab p 
                     where p.id = any(p_lab_ids) 
                       and l.kode like (p.kode || '%') 
                   ))
            order by l.kelompok, l.urutan, l.kode
  loop
    v_urut := v_urut + 1;
    insert into lab_hasil (permintaan_id, lab_id, nama, satuan, urutan)
    values (v_id, r.id, r.nama, r.satuan, v_urut);
  end loop;

  return v_id;
end $$;


-- F6. Menutup lembar hasil.
create or replace function public.lab_selesaikan(p_permintaan_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_kosong integer;
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
   where id = p_permintaan_id and status <> 'BATAL';
end $$;


-- F7. Membuka kunci untuk koreksi. Admin saja, dan alasannya wajib —
--     itulah yang membedakan koreksi dari penghapusan jejak.
create or replace function public.lab_buka_kunci(p_permintaan_id uuid, p_alasan text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.peran_teks_saya() <> 'master' then
    raise exception 'Hanya master yang boleh membuka kunci lembar hasil.'
      using errcode = '42501';
  end if;
  if coalesce(trim(p_alasan), '') = '' then
    raise exception 'Alasan membuka kunci wajib diisi.';
  end if;
  update lab_permintaan
     set status = 'DIKERJAKAN',
         catatan_klinis = coalesce(catatan_klinis || E'\n', '')
                          || '[Dibuka kembali ' || to_char(now(),'DD-MM-YYYY HH24:MI')
                          || '] ' || p_alasan
   where id = p_permintaan_id;
end $$;


-- F8. Membatalkan permintaan yang salah.
create or replace function public.lab_batalkan(p_permintaan_id uuid, p_alasan text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_status text;
begin
  if not (public.boleh_lab() or public.boleh_bacaan()) then
    raise exception 'Anda tidak berhak membatalkan permintaan laboratorium.'
      using errcode = '42501';
  end if;
  if coalesce(trim(p_alasan), '') = '' then
    raise exception 'Alasan pembatalan wajib diisi.';
  end if;

  select status into v_status from lab_permintaan where id = p_permintaan_id;
  if v_status = 'SELESAI' and public.peran_teks_saya() <> 'master' then
    raise exception 'Lembar hasil yang sudah selesai hanya bisa dibatalkan master.'
      using errcode = '42501';
  end if;

  update lab_permintaan set status = 'BATAL', alasan_batal = p_alasan
   where id = p_permintaan_id;
end $$;


-- F9. Menyimpan bacaan penunjang beserta gigi yang terkait, satu transaksi.
create or replace function public.penunjang_simpan(
  p_id           uuid,
  p_pasien_id    uuid,
  p_kunjungan_id uuid,
  p_tanggal      date,
  p_jenis        text,
  p_judul        text,
  p_asal         text,
  p_nama_tempat  text,
  p_no_film      text,
  p_temuan       text,
  p_kesan        text,
  p_saran        text,
  p_gigi         text[]
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not public.boleh_bacaan() then
    raise exception 'Hanya dokter dan admin yang boleh menulis bacaan pemeriksaan penunjang.'
      using errcode = '42501';
  end if;
  if coalesce(trim(p_kesan), '') = '' then
    raise exception 'Kesan wajib diisi. Bacaan tanpa kesimpulan tidak berguna bagi dokter berikutnya.';
  end if;

  if p_id is null then
    insert into penunjang (pasien_id, kunjungan_id, tanggal, jenis, judul, asal,
                           nama_tempat, no_film, temuan, kesan, saran, dibaca_oleh)
    values (p_pasien_id, p_kunjungan_id, coalesce(p_tanggal, public.tgl_klinik()),
            p_jenis, p_judul, coalesce(p_asal,'INTERNAL'), p_nama_tempat, p_no_film,
            p_temuan, p_kesan, p_saran, auth.uid())
    returning id into v_id;
  else
    update penunjang
       set tanggal = coalesce(p_tanggal, tanggal), jenis = p_jenis, judul = p_judul,
           asal = coalesce(p_asal,'INTERNAL'), nama_tempat = p_nama_tempat,
           no_film = p_no_film, temuan = p_temuan, kesan = p_kesan, saran = p_saran
     where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Bacaan tidak ditemukan.'; end if;
    delete from penunjang_gigi where penunjang_id = v_id;
  end if;

  if p_gigi is not null then
    insert into penunjang_gigi (penunjang_id, fdi)
    select v_id, g from unnest(p_gigi) g
     where exists (select 1 from ref_gigi where fdi = g)
    on conflict do nothing;
  end if;

  return v_id;
end $$;


grant execute on function public.lab_minta(uuid, uuid[], text, text, text,
                                           uuid, date, text)              to authenticated;
grant execute on function public.lab_selesaikan(uuid)                      to authenticated;
grant execute on function public.lab_buka_kunci(uuid, text)                to authenticated;
grant execute on function public.lab_batalkan(uuid, text)                  to authenticated;
grant execute on function public.penunjang_simpan(uuid, uuid, uuid, date, text, text,
                                                  text, text, text, text, text, text, text[])
                                                                           to authenticated;


-- =====================================================================
--  G. VIEW
-- =====================================================================

create or replace view v_lab_antrean with (security_invoker = true) as
select lp.id, lp.no_lab, lp.tanggal, lp.status, lp.asal, lp.nama_lab_luar,
       lp.catatan_klinis, lp.diminta_pada, lp.kunjungan_id,
       p.id as pasien_id, p.no_rm, p.nama as nama_pasien, p.jenis_kelamin,
       p.tanggal_lahir,
       date_part('year', age(p.tanggal_lahir))::int as umur,
       k.no_kunjungan, k.cara_bayar,
       po.nama as nama_poli,
       d.nama as nama_dokter,
       (select count(*) from lab_hasil h where h.permintaan_id = lp.id) as jml_pemeriksaan,
       (select count(*) from lab_hasil h where h.permintaan_id = lp.id
         and (h.nilai_angka is not null or nullif(h.nilai_teks,'') is not null)) as jml_terisi,
       (select count(*) from lab_hasil h where h.permintaan_id = lp.id
         and h.tanda in ('KRITIS_RENDAH','KRITIS_TINGGI')) as jml_kritis,
       (select count(*) from lab_hasil h where h.permintaan_id = lp.id
         and h.tanda in ('RENDAH','TINGGI','ABNORMAL','KRITIS_RENDAH','KRITIS_TINGGI')) as jml_tak_normal
  from lab_permintaan lp
  join pasien p on p.id = lp.pasien_id
  left join kunjungan k on k.id = lp.kunjungan_id
  left join poli po on po.id = k.poli_id
  left join pegawai d on d.id = lp.diminta_oleh;

create or replace view v_penunjang_lengkap with (security_invoker = true) as
select pn.*, p.no_rm, p.nama as nama_pasien, k.no_kunjungan,
       dk.nama as nama_pembaca,
       (select string_agg(pg.fdi, ', ' order by pg.fdi)
          from penunjang_gigi pg where pg.penunjang_id = pn.id) as daftar_gigi
  from penunjang pn
  join pasien p on p.id = pn.pasien_id
  left join kunjungan k on k.id = pn.kunjungan_id
  left join pegawai dk on dk.id = pn.dibaca_oleh;

-- Riwayat satu jenis pemeriksaan pada satu pasien, untuk melihat tren.
create or replace view v_lab_tren with (security_invoker = true) as
select lp.pasien_id, h.lab_id, rl.kode, h.nama, h.satuan,
       lp.tanggal, lp.id as permintaan_id, lp.no_lab,
       h.nilai_angka, h.nilai_teks, h.tanda,
       h.rujukan_bawah, h.rujukan_atas, h.rujukan_teks
  from lab_hasil h
  join lab_permintaan lp on lp.id = h.permintaan_id
  join ref_lab rl on rl.id = h.lab_id
 where lp.status = 'SELESAI'
   and (h.nilai_angka is not null or nullif(h.nilai_teks,'') is not null);

-- View pun tidak mewarisi GRANT dari 02_rls.sql, sama seperti tabel baru —
-- dan gejalanya lebih membingungkan lagi: "permission denied for view
-- v_lab_antrean" muncul di halaman yang tabel-tabelnya jelas boleh dibaca.
-- Karena view ini security_invoker, RLS tabel di baliknya tetap berlaku;
-- GRANT di sini hanya membuka pintunya, bukan membuka datanya.
grant select on v_lab_antrean, v_penunjang_lengkap, v_lab_tren to authenticated;


-- =====================================================================
--  H. HAK AKSES TABEL & ROW LEVEL SECURITY
-- =====================================================================
--  GRANT ditulis untuk tiap tabel baru dan tidak diwariskan dari 02_rls.sql:
--  `grant ... on all tables` di sana hanya mengenai tabel yang sudah ada
--  saat berkas itu dijalankan. Gejala bila ini terlewat adalah
--  "permission denied for table lab_hasil" yang tidak menyebut RLS sama
--  sekali — bikin salah cari selama setengah jam.
grant select, insert, update, delete on
  ref_lab, ref_lab_rujukan, ref_lab_paket, ref_lab_paket_item,
  lab_permintaan, lab_hasil, penunjang, penunjang_gigi, lampiran
  to authenticated;
grant usage, select on seq_no_lab, seq_no_arsip to authenticated;

alter table ref_lab            enable row level security;
alter table ref_lab_rujukan    enable row level security;
alter table ref_lab_paket      enable row level security;
alter table ref_lab_paket_item enable row level security;
alter table lab_permintaan     enable row level security;
alter table lab_hasil          enable row level security;
alter table penunjang          enable row level security;
alter table penunjang_gigi     enable row level security;
alter table lampiran           enable row level security;

do $$
declare t text;
begin
  -- Master data: semua staf boleh baca, kode `master_data` boleh ubah.
  foreach t in array array['ref_lab','ref_lab_rujukan','ref_lab_paket','ref_lab_paket_item']
  loop
    execute format('drop policy if exists %1$s_baca on %1$s', t);
    execute format($f$create policy %1$s_baca on %1$s for select
                     to authenticated using (public.saya_staf())$f$, t);
    execute format('drop policy if exists %1$s_tulis on %1$s', t);
    execute format($f$create policy %1$s_tulis on %1$s for all to authenticated
                     using (public.boleh_master_data())
                     with check (public.boleh_master_data())$f$, t);
  end loop;
end $$;

-- Permintaan lab: dibaca semua staf.
drop policy if exists lab_permintaan_baca on lab_permintaan;
create policy lab_permintaan_baca on lab_permintaan for select
  to authenticated using (public.saya_staf());

-- Menulis lembar lewat tangan tidak diizinkan sama sekali, bahkan untuk
-- dokter. Satu-satunya jalan masuk adalah fungsi di §F, yang menjaga
-- aturannya — pola yang sama dengan apotek_transaksi di 08_apotek.sql.
--
-- Kalau kolom `status` boleh ditulis langsung, seluruh penguncian lembar
-- bisa dilewati dengan tiga permintaan biasa: putar SELESAI menjadi
-- DIKERJAKAN, betulkan angkanya, putar kembali ke SELESAI. Aturan "hanya
-- master, dan alasannya wajib" jadi hiasan, dan koreksinya tidak
-- meninggalkan jejak alasan sama sekali.
drop policy if exists lab_permintaan_tulis on lab_permintaan;
create policy lab_permintaan_tulis on lab_permintaan for all
  to authenticated
  using (public.peran_teks_saya() = 'master')
  with check (public.peran_teks_saya() = 'master');

-- Hasil lab: dibaca semua staf; ditulis hanya oleh yang berhak mengisi lab.
-- Kasir dan pendaftaran ditolak menulis di sini — mereka hanya perlu
-- melihat bahwa pemeriksaannya dikerjakan, untuk menagihkannya.
drop policy if exists lab_hasil_baca on lab_hasil;
create policy lab_hasil_baca on lab_hasil for select
  to authenticated using (public.saya_staf());

drop policy if exists lab_hasil_tulis on lab_hasil;
create policy lab_hasil_tulis on lab_hasil for all
  to authenticated
  using (public.boleh_lab())
  with check (public.boleh_lab());

-- Bacaan penunjang: dibaca semua staf, ditulis hanya dokter.
drop policy if exists penunjang_baca on penunjang;
create policy penunjang_baca on penunjang for select
  to authenticated using (public.saya_staf());

drop policy if exists penunjang_tulis on penunjang;
create policy penunjang_tulis on penunjang for all
  to authenticated
  using (public.boleh_bacaan())
  with check (public.boleh_bacaan());

drop policy if exists penunjang_gigi_baca on penunjang_gigi;
create policy penunjang_gigi_baca on penunjang_gigi for select
  to authenticated using (public.saya_staf());

drop policy if exists penunjang_gigi_tulis on penunjang_gigi;
create policy penunjang_gigi_tulis on penunjang_gigi for all
  to authenticated
  using (public.boleh_bacaan())
  with check (public.boleh_bacaan());

-- Register arsip: dibaca semua staf. Ditulis oleh admin (loket), perawat,
-- dokter — merekalah yang memegang berkas fisiknya saat masuk. Kode
-- `lampiran`, lihat isian awal di atas.
drop policy if exists lampiran_baca on lampiran;
create policy lampiran_baca on lampiran for select
  to authenticated using (public.saya_staf());

drop policy if exists lampiran_tulis on lampiran;
create policy lampiran_tulis on lampiran for all
  to authenticated
  using (public.boleh_lampiran())
  with check (public.boleh_lampiran());


-- =====================================================================
--  I. AUDIT
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['lab_permintaan','lab_hasil','penunjang','lampiran']
  loop
    execute format('drop trigger if exists trg_audit_%1$s on %1$s', t);
    execute format($f$create trigger trg_audit_%1$s
                       after insert or update or delete on %1$s
                       for each row execute function public.catat_audit()$f$, t);
  end loop;
end $$;


-- =====================================================================
--  J. ISIAN AWAL MASTER PEMERIKSAAN
-- =====================================================================
--  PERINGATAN YANG PERLU DIBACA SEBELUM DIPAKAI:
--  Nilai rujukan di bawah ini adalah nilai umum yang lazim dipakai di
--  Indonesia, BUKAN nilai rujukan alat yang dipakai klinik ini. Setiap alat
--  dan setiap reagen punya rentangnya sendiri, dan yang sah adalah yang
--  tercetak pada sisipan reagen alat Anda.
--
--  Buka Master Data → Lab, cocokkan dengan buku alat, lalu perbaiki yang
--  berbeda SEBELUM lab dipakai melayani pasien. Nilai yang dipakai untuk
--  menandai sebuah hasil disalin ke barisnya saat hasil diisi, jadi
--  memperbaiki master hari ini tidak akan mengubah hasil kemarin.

insert into ref_lab (kode, nama, kelompok, satuan, jenis_nilai, teks_normal, desimal, urutan)
values
  -- Hematologi
  ('HB',    'Hemoglobin',            'Hematologi', 'g/dL',    'ANGKA', null, 1, 10),
  ('LEU',   'Leukosit',              'Hematologi', '/µL',     'ANGKA', null, 0, 20),
  ('ERI',   'Eritrosit',             'Hematologi', 'juta/µL', 'ANGKA', null, 2, 30),
  ('HCT',   'Hematokrit',            'Hematologi', '%',       'ANGKA', null, 1, 40),
  ('TRO',   'Trombosit',             'Hematologi', '/µL',     'ANGKA', null, 0, 50),
  ('LED',   'Laju Endap Darah',      'Hematologi', 'mm/jam',  'ANGKA', null, 0, 60),
  ('GOLDA', 'Golongan Darah',        'Hematologi', null,      'PILIHAN', null, 0, 70),
  ('RH',    'Rhesus',                'Hematologi', null,      'PILIHAN', 'Positif', 0, 80),
  -- Kimia klinik
  ('GDS',   'Glukosa Darah Sewaktu', 'Kimia Klinik', 'mg/dL', 'ANGKA', null, 0, 110),
  ('GDP',   'Glukosa Darah Puasa',   'Kimia Klinik', 'mg/dL', 'ANGKA', null, 0, 120),
  ('GD2PP', 'Glukosa 2 Jam PP',      'Kimia Klinik', 'mg/dL', 'ANGKA', null, 0, 130),
  ('CHOL',  'Kolesterol Total',      'Kimia Klinik', 'mg/dL', 'ANGKA', null, 0, 140),
  ('HDL',   'Kolesterol HDL',        'Kimia Klinik', 'mg/dL', 'ANGKA', null, 0, 150),
  ('LDL',   'Kolesterol LDL',        'Kimia Klinik', 'mg/dL', 'ANGKA', null, 0, 160),
  ('TG',    'Trigliserida',          'Kimia Klinik', 'mg/dL', 'ANGKA', null, 0, 170),
  ('UA',    'Asam Urat',             'Kimia Klinik', 'mg/dL', 'ANGKA', null, 1, 180),
  ('UR',    'Ureum',                 'Kimia Klinik', 'mg/dL', 'ANGKA', null, 0, 190),
  ('CR',    'Kreatinin',             'Kimia Klinik', 'mg/dL', 'ANGKA', null, 2, 200),
  ('SGOT',  'SGOT (AST)',            'Kimia Klinik', 'U/L',   'ANGKA', null, 0, 210),
  ('SGPT',  'SGPT (ALT)',            'Kimia Klinik', 'U/L',   'ANGKA', null, 0, 220),
  -- Urinalisis
  ('UWAR',  'Urine - Warna',         'Urinalisis', null, 'TEKS',    null,      0, 310),
  ('UPH',   'Urine - pH',            'Urinalisis', null, 'ANGKA',   null,      1, 320),
  ('UBJ',   'Urine - Berat Jenis',   'Urinalisis', null, 'ANGKA',   null,      3, 330),
  ('UPRO',  'Urine - Protein',       'Urinalisis', null, 'PILIHAN', 'Negatif', 0, 340),
  ('UGLU',  'Urine - Reduksi',       'Urinalisis', null, 'PILIHAN', 'Negatif', 0, 350),
  ('UKET',  'Urine - Keton',         'Urinalisis', null, 'PILIHAN', 'Negatif', 0, 360),
  ('UBLD',  'Urine - Darah Samar',   'Urinalisis', null, 'PILIHAN', 'Negatif', 0, 370),
  ('USEL',  'Urine - Sedimen Leukosit','Urinalisis','/LPB','ANGKA',  null,      0, 380),
  ('USER',  'Urine - Sedimen Eritrosit','Urinalisis','/LPB','ANGKA', null,      0, 390),
  -- Imunoserologi
  ('HCG',   'Tes Kehamilan (HCG)',   'Imunoserologi', null, 'PILIHAN', 'Negatif', 0, 410),
  ('HBSAG', 'HBsAg',                 'Imunoserologi', null, 'PILIHAN', 'Non Reaktif', 0, 420),
  ('HIV',   'Anti-HIV',              'Imunoserologi', null, 'PILIHAN', 'Non Reaktif', 0, 430),
  ('SIF',   'Sifilis (TPHA/VDRL)',   'Imunoserologi', null, 'PILIHAN', 'Non Reaktif', 0, 440),
  ('WIDAL', 'Widal',                 'Imunoserologi', null, 'TEKS',    null,      0, 450),
  ('NS1',   'Dengue NS1',            'Imunoserologi', null, 'PILIHAN', 'Negatif', 0, 460),
  ('DENGI', 'Dengue IgG/IgM',        'Imunoserologi', null, 'TEKS',    null,      0, 470),
  ('MAL',   'Malaria (RDT)',         'Imunoserologi', null, 'PILIHAN', 'Negatif', 0, 480),
  -- Mikrobiologi & feses
  ('BTA',   'BTA Sputum',            'Mikrobiologi', null, 'TEKS',    null,      0, 510),
  ('FDS',   'Feses - Darah Samar',   'Feses',        null, 'PILIHAN', 'Negatif', 0, 610),
  ('FTC',   'Feses - Telur Cacing',  'Feses',        null, 'PILIHAN', 'Negatif', 0, 620)
on conflict (kode) do nothing;

update ref_lab set pilihan = array['A','B','AB','O']                where kode = 'GOLDA';
update ref_lab set pilihan = array['Positif','Negatif']             where kode = 'RH';
update ref_lab set pilihan = array['Negatif','+1','+2','+3','+4']   where kode in
  ('UPRO','UGLU','UKET','UBLD');
update ref_lab set pilihan = array['Negatif','Positif']             where kode in
  ('HCG','NS1','MAL','FDS','FTC');
update ref_lab set pilihan = array['Non Reaktif','Reaktif']         where kode in
  ('HBSAG','HIV','SIF');

-- Nilai rujukan dewasa (umur >= 15 tahun = 180 bulan) dan anak seperlunya.
insert into ref_lab_rujukan (lab_id, jenis_kelamin, umur_min_bulan, umur_max_bulan,
                             batas_bawah, batas_atas, kritis_bawah, kritis_atas, teks)
select l.id, v.jk, v.umin, v.umax, v.bb, v.ba, v.kb, v.ka, v.teks
  from (values
    -- kode,   jenis kelamin,        umur min, umur max, bawah, atas,  kritis bawah, kritis atas, teks
    ('HB',   'L'::jenis_kelamin_t,  180, null,   13.0,  17.0,   7.0,   20.0, null),
    ('HB',   'P'::jenis_kelamin_t,  180, null,   12.0,  15.0,   7.0,   20.0, null),
    ('HB',   null,                    0,   1,    14.0,  22.0,   9.0,   24.0, null),
    ('HB',   null,                    1,  12,    10.5,  13.5,   7.0,   20.0, null),
    ('HB',   null,                   12,  72,    11.5,  13.5,   7.0,   20.0, null),
    ('HB',   null,                   72, 180,    11.5,  15.5,   7.0,   20.0, null),
    ('LEU',  null,                  180, null, 4000.0,10000.0,2000.0,30000.0, null),
    ('LEU',  null,                    0, 180,  5000.0,15000.0,2000.0,30000.0, null),
    ('ERI',  'L'::jenis_kelamin_t,  180, null,    4.5,   5.5,  null,   null, null),
    ('ERI',  'P'::jenis_kelamin_t,  180, null,    4.0,   5.0,  null,   null, null),
    ('HCT',  'L'::jenis_kelamin_t,  180, null,   40.0,  50.0,  null,   null, null),
    ('HCT',  'P'::jenis_kelamin_t,  180, null,   37.0,  43.0,  null,   null, null),
    ('TRO',  null,                    0, null,150000.0,400000.0,50000.0,1000000.0, null),
    ('LED',  'L'::jenis_kelamin_t,    0, null,   null,  15.0,  null,   null, '< 15'),
    ('LED',  'P'::jenis_kelamin_t,    0, null,   null,  20.0,  null,   null, '< 20'),
    ('GDS',  null,                    0, null,   70.0, 140.0,  45.0,  450.0, null),
    ('GDP',  null,                    0, null,   70.0, 100.0,  45.0,  450.0, null),
    ('GD2PP',null,                    0, null,   null, 140.0,  null,  450.0, '< 140'),
    ('CHOL', null,                    0, null,   null, 200.0,  null,   null, '< 200'),
    ('HDL',  'L'::jenis_kelamin_t,    0, null,   40.0,  null,  null,   null, '> 40'),
    ('HDL',  'P'::jenis_kelamin_t,    0, null,   50.0,  null,  null,   null, '> 50'),
    ('LDL',  null,                    0, null,   null, 130.0,  null,   null, '< 130'),
    ('TG',   null,                    0, null,   null, 150.0,  null,   null, '< 150'),
    ('UA',   'L'::jenis_kelamin_t,    0, null,    3.4,   7.0,  null,   null, null),
    ('UA',   'P'::jenis_kelamin_t,    0, null,    2.4,   6.0,  null,   null, null),
    ('UR',   null,                    0, null,   10.0,  50.0,  null,   null, null),
    ('CR',   'L'::jenis_kelamin_t,    0, null,    0.7,   1.3,  null,   null, null),
    ('CR',   'P'::jenis_kelamin_t,    0, null,    0.6,   1.1,  null,   null, null),
    ('SGOT', 'L'::jenis_kelamin_t,    0, null,   null,  37.0,  null,   null, '< 37'),
    ('SGOT', 'P'::jenis_kelamin_t,    0, null,   null,  31.0,  null,   null, '< 31'),
    ('SGPT', 'L'::jenis_kelamin_t,    0, null,   null,  42.0,  null,   null, '< 42'),
    ('SGPT', 'P'::jenis_kelamin_t,    0, null,   null,  32.0,  null,   null, '< 32'),
    ('UPH',  null,                    0, null,    4.5,   8.0,  null,   null, null),
    ('UBJ',  null,                    0, null,  1.005, 1.030,  null,   null, null),
    ('USEL', null,                    0, null,   null,   5.0,  null,   null, '0 - 5'),
    ('USER', null,                    0, null,   null,   2.0,  null,   null, '0 - 2')
  ) as v(kode, jk, umin, umax, bb, ba, kb, ka, teks)
  join ref_lab l on l.kode = v.kode
 where not exists (
   select 1 from ref_lab_rujukan x
    where x.lab_id = l.id
      and x.jenis_kelamin is not distinct from v.jk
      and x.umur_min_bulan is not distinct from v.umin
      and x.umur_max_bulan is not distinct from v.umax);

-- Paket yang paling sering diminta.
insert into ref_lab_paket (kode, nama, urutan) values
  ('DR',   'Darah Rutin',            10),
  ('GD',   'Gula Darah',             20),
  ('LIPID','Profil Lipid',           30),
  ('FUNGI','Fungsi Ginjal',          40),
  ('FUHAT','Fungsi Hati',            50),
  ('UL',   'Urine Lengkap',          60),
  ('ANC',  'Skrining Ibu Hamil',     70)
on conflict (kode) do nothing;

insert into ref_lab_paket_item (paket_id, lab_id, urutan)
select pk.id, l.id, v.urut
  from (values
    ('DR','HB',1),('DR','LEU',2),('DR','ERI',3),('DR','HCT',4),('DR','TRO',5),('DR','LED',6),
    ('GD','GDS',1),('GD','GDP',2),('GD','GD2PP',3),
    ('LIPID','CHOL',1),('LIPID','HDL',2),('LIPID','LDL',3),('LIPID','TG',4),
    ('FUNGI','UR',1),('FUNGI','CR',2),('FUNGI','UA',3),
    ('FUHAT','SGOT',1),('FUHAT','SGPT',2),
    ('UL','UWAR',1),('UL','UPH',2),('UL','UBJ',3),('UL','UPRO',4),('UL','UGLU',5),
    ('UL','UKET',6),('UL','UBLD',7),('UL','USEL',8),('UL','USER',9),
    ('ANC','HB',1),('ANC','GOLDA',2),('ANC','RH',3),('ANC','HBSAG',4),('ANC','HIV',5),
    ('ANC','SIF',6),('ANC','UPRO',7)
  ) as v(paket, kode, urut)
  join ref_lab_paket pk on pk.kode = v.paket
  join ref_lab l        on l.kode  = v.kode
on conflict do nothing;


-- Kode ICD-9-CM untuk pemeriksaan penunjang. Gunanya PELAPORAN — PCare dan
-- SatuSehat memintanya — bukan penarifan: yang menagihkan rontgen adalah
-- bacaannya (lihat E5 di 12_kasir_penunjang.sql).
--
-- Karena itu semuanya sengaja `sering_dipakai = false`, supaya tidak naik ke
-- baris teratas saat dokter mencari tindakan. Dokter yang mencatat "87.12
-- Rontgen gigi lainnya" DAN menulis bacaannya akan membuat dua baris untuk
-- satu film; §E5 di berkas 12 sudah menolak baris keduanya, tetapi tidak
-- menyodorkannya sejak awal jauh lebih baik daripada menyaringnya di ujung.
insert into icd9cm (kode, nama_id, nama_en, kategori, sering_dipakai, per_gigi, aktif) values
  ('90.59', 'Pemeriksaan darah lainnya',        'Other microscopic examination of blood', 'PENUNJANG', true,  false, true),
  ('90.59-1','Pemeriksaan kimia darah',         'Blood chemistry',                        'PENUNJANG', true,  false, true),
  ('91.39', 'Pemeriksaan urine lainnya',        'Other microscopic examination of urine', 'PENUNJANG', true,  false, true),
  ('87.11', 'Rontgen gigi menyeluruh',          'Full-mouth X-ray of teeth',              'PENUNJANG', false, true,  true),
  ('87.12', 'Rontgen gigi lainnya',             'Other dental X-ray',                     'PENUNJANG', false, true,  true),
  ('87.44', 'Rontgen toraks rutin',             'Routine chest X-ray',                    'PENUNJANG', false, false, true),
  ('89.52', 'Elektrokardiogram',                'Electrocardiogram',                      'PENUNJANG', false, false, true),
  ('88.79', 'Ultrasonografi lainnya',           'Other diagnostic ultrasound',            'PENUNJANG', false, false, true)
on conflict (kode) do nothing;


comment on table  lampiran is
  'Register berkas fisik rekam medis. Kolom berkas_* disiapkan untuk berkas digital dan sengaja dibiarkan kosong selama klinik memakai Supabase paket gratis.';
comment on table  penunjang is
  'Bacaan pemeriksaan penunjang (rontgen gigi, EKG, USG). Menyimpan hasil bacanya, bukan gambarnya.';
comment on column lab_hasil.rujukan_teks is
  'Salinan nilai rujukan saat hasil diisi. Master boleh berubah kemudian; lembar hasil lama tidak ikut berubah.';
-- =====================================================================
--  RME Laboratorium Medis Utama - PENUNJANG MASUK KE TAGIHAN
--  Jalankan SETELAH 11_penunjang.sql
--
--  Aman dijalankan di database yang sudah berisi data. Berkas ini hanya
--  melonggarkan dua check constraint dan mengganti isi satu fungsi;
--  tidak ada tabel yang dibuat ulang dan tidak ada baris yang disentuh.
--
--  Yang ditambahkan: pemeriksaan laboratorium dan pemeriksaan penunjang
--  yang DIKERJAKAN DI KLINIK ikut masuk tagihan, dengan aturan yang sama
--  seperti obat — yang ditagihkan adalah yang benar-benar dikerjakan,
--  bukan yang diminta dokter. Permintaan yang dibatalkan tidak ditagih,
--  dan hasil dari lab luar tidak ditagih sama sekali karena bukan klinik
--  yang mengerjakannya.
-- =====================================================================


-- =====================================================================
--  A. MELONGGARKAN CHECK CONSTRAINT
-- =====================================================================

-- Tarif kini mengenal dua jenis baru.
alter table kasir_tarif drop constraint if exists kasir_tarif_jenis_check;
alter table kasir_tarif add  constraint kasir_tarif_jenis_check
  check (jenis in ('TINDAKAN','LAYANAN','LAB','PENUNJANG','LAIN'));

-- Baris tagihan kini mengenal dua asal baru.
alter table kasir_tagihan_item drop constraint if exists kasir_tagihan_item_sumber_check;
alter table kasir_tagihan_item add  constraint kasir_tagihan_item_sumber_check
  check (sumber in ('TINDAKAN','OBAT','LAYANAN','LAB','PENUNJANG','MANUAL'));


-- =====================================================================
--  B. PENCARIAN TARIF
-- =====================================================================

-- Kembarannya kasir_tarif_berlaku(), tapi mencari lewat kolom `kode`
-- bebas, bukan kode ICD-9-CM. Untuk lab, `kode` diisi kode pemeriksaan
-- (mis. 'HB'); untuk penunjang, diisi jenisnya (mis. 'RO_PERIAPIKAL').
--
-- Sama seperti tarif tindakan: yang dipakai adalah tarif yang berlaku
-- pada TANGGAL KUNJUNGAN, bukan tarif hari ini. Tarif naik bulan depan
-- tidak boleh mengubah tagihan bulan ini.
create or replace function public.kasir_tarif_kode(
  p_jenis   text,
  p_kode    text,
  p_tanggal date
) returns numeric
language sql stable security definer set search_path = public
as $$
  select t.tarif from kasir_tarif t
   where t.jenis = p_jenis
     and t.kode  = p_kode
     and t.aktif
     and t.berlaku_mulai <= p_tanggal
   order by t.berlaku_mulai desc
   limit 1
$$;

grant execute on function public.kasir_tarif_kode(text, text, date) to authenticated;


-- =====================================================================
--  C. PENYUSUNAN TAGIHAN
-- =====================================================================
--  Mengganti isi kasir_susun_dari_kunjungan() dari 09_kasir.sql.
--  Tanda tangannya persis sama (satu uuid), jadi `create or replace`
--  benar-benar mengganti dan tidak melahirkan fungsi kembar — beda dengan
--  kasus apotek_masuk() di 10_apotek_impor.sql yang parameternya bertambah
--  sehingga versi lamanya harus dibuang lebih dulu.
--
--  Bagian E1-E3 tidak diubah sedikit pun dari versi 09_kasir.sql.
--  Yang baru hanya E4 dan E5, serta dua nilai tambahan pada daftar hapus
--  di awal — tanpa itu, menyusun ulang tagihan akan menggandakan baris lab.
create or replace function public.kasir_susun_dari_kunjungan(
  p_kunjungan_id uuid
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_k         kunjungan%rowtype;
  v_p         pasien%rowtype;
  v_tagihan   kasir_tagihan%rowtype;
  v_ditanggung boolean;
  v_urut      smallint := 0;
  v_bayar     numeric;
  r           record;
begin
  if not public.boleh_kasir() then
    raise exception 'Hanya kasir dan admin yang boleh menyusun tagihan.' using errcode = '42501';
  end if;

  select * into v_k from kunjungan where id = p_kunjungan_id;
  if not found then raise exception 'Kunjungan tidak ditemukan.'; end if;
  select * into v_p from pasien where id = v_k.pasien_id;

  -- Penjamin menentukan segalanya. BPJS dan GRATIS tidak ditagihkan ke
  -- pasien; nilainya tetap dicatat untuk laporan.
  v_ditanggung := v_k.cara_bayar in ('BPJS','GRATIS');

  select * into v_tagihan from kasir_tagihan where kunjungan_id = p_kunjungan_id;
  if found then
    select coalesce(sum(jumlah),0) into v_bayar
      from kasir_pembayaran where tagihan_id = v_tagihan.id;
    if v_bayar > 0 then
      raise exception 'Tagihan % sudah dibayar, jadi tidak bisa disusun ulang.', v_tagihan.nomor;
    end if;
    delete from kasir_tagihan_item
     where tagihan_id = v_tagihan.id
       and sumber in ('TINDAKAN','OBAT','LAYANAN','LAB','PENUNJANG');
    update kasir_tagihan set penjamin = v_k.cara_bayar where id = v_tagihan.id;
    select coalesce(max(urutan), 0) into v_urut
      from kasir_tagihan_item where tagihan_id = v_tagihan.id;
  else
    insert into kasir_tagihan (kunjungan_id, pasien_id, nama_pembayar, tanggal,
                               penjamin, dibuat_oleh)
    values (p_kunjungan_id, v_k.pasien_id, v_p.nama, v_k.tanggal,
            v_k.cara_bayar, auth.uid())
    returning * into v_tagihan;
  end if;

  -- E1. Layanan otomatis (karcis / administrasi).
  for r in select * from kasir_tarif
            where jenis = 'LAYANAN' and otomatis and aktif
              and berlaku_mulai <= v_k.tanggal
            order by nama
  loop
    v_urut := v_urut + 1;
    insert into kasir_tagihan_item (tagihan_id, sumber, ref_id, ref_kode, nama, qty,
                                    harga_satuan, ditanggung_penjamin, urutan)
    values (v_tagihan.id, 'LAYANAN', r.id, r.kode, r.nama, 1,
            r.tarif, v_ditanggung, v_urut);
  end loop;

  -- E2. Tindakan ICD-9-CM dari catatan dokter.
  --     Tindakan tanpa tarif tetap dimasukkan dengan harga 0 supaya
  --     terlihat di struk dan ketahuan tarifnya belum diisi — jauh lebih
  --     baik daripada hilang diam-diam dari tagihan.
  for r in select t.id, t.kode_icd9, t.nama, t.jumlah, t.fdi
             from tindakan t where t.kunjungan_id = p_kunjungan_id
            order by t.urutan
  loop
    v_urut := v_urut + 1;
    insert into kasir_tagihan_item (tagihan_id, sumber, ref_id, ref_kode, nama, qty,
                                    harga_satuan, ditanggung_penjamin, urutan)
    values (v_tagihan.id, 'TINDAKAN', r.id, r.kode_icd9,
            r.nama || case when r.fdi is not null then ' (gigi ' || r.fdi || ')' else '' end,
            greatest(r.jumlah, 1),
            coalesce(public.kasir_tarif_berlaku(r.kode_icd9, v_k.tanggal), 0),
            v_ditanggung, v_urut);
  end loop;

  -- E3. Obat yang benar-benar diserahkan apotek.
  --     Dikelompokkan per obat: satu obat yang terpecah ke tiga batch
  --     adalah satu baris di mata pasien, bukan tiga.
  for r in select at.obat_id, max(at.nama_obat) as nama_obat, max(at.satuan) as satuan,
                  sum(at.jumlah) as jumlah, max(o.harga) as harga_jual
             from apotek_transaksi at
             join obat o on o.id = at.obat_id
            where at.kunjungan_id = p_kunjungan_id
              and at.jenis = 'KELUAR'
              and at.kategori = 'Resep Pasien'
              and not at.dibatalkan
            group by at.obat_id
            having sum(at.jumlah) > 0
            order by max(at.nama_obat)
  loop
    v_urut := v_urut + 1;
    insert into kasir_tagihan_item (tagihan_id, sumber, ref_id, ref_kode, nama, qty,
                                    harga_satuan, ditanggung_penjamin, urutan)
    values (v_tagihan.id, 'OBAT', r.obat_id, null,
            r.nama_obat || ' (' || r.jumlah || ' ' || coalesce(r.satuan,'') || ')',
            r.jumlah, coalesce(r.harga_jual, 0), v_ditanggung, v_urut);
  end loop;

  -- E4. Pemeriksaan laboratorium yang dikerjakan klinik.
  --     Tiga penyaring, masing-masing menutup satu cara salah tagih:
  --       asal = INTERNAL  → hasil dari lab luar bukan pekerjaan klinik
  --       status <> BATAL  → permintaan yang dibatalkan tidak pernah dikerjakan
  --       nilai terisi     → pemeriksaan yang tidak jadi dikerjakan (sampel
  --                          kurang, reagen habis) ikut tidak ditagihkan
  --     Yang ketiga itu sengaja: dokter bisa saja meminta sepuluh
  --     pemeriksaan dan hanya delapan yang bisa dikerjakan hari itu.
  for r in select h.id, rl.kode, h.nama
             from lab_hasil h
             join lab_permintaan lp on lp.id = h.permintaan_id
             join ref_lab rl on rl.id = h.lab_id
            where lp.kunjungan_id = p_kunjungan_id
              and lp.asal = 'INTERNAL'
              and lp.status <> 'BATAL'
              and (h.nilai_angka is not null or nullif(h.nilai_teks,'') is not null)
            order by h.urutan
  loop
    v_urut := v_urut + 1;
    insert into kasir_tagihan_item (tagihan_id, sumber, ref_id, ref_kode, nama, qty,
                                    harga_satuan, ditanggung_penjamin, urutan)
    values (v_tagihan.id, 'LAB', r.id, r.kode, 'Lab: ' || r.nama, 1,
            coalesce(public.kasir_tarif_kode('LAB', r.kode, v_k.tanggal), 0),
            v_ditanggung, v_urut);
  end loop;

  -- E5. Pemeriksaan penunjang yang dikerjakan klinik (rontgen, EKG, USG).
  --     Bacaan atas foto yang dibuat DI TEMPAT LAIN tidak ditagihkan
  --     sebagai pemeriksaan. Kalau klinik ingin menagih jasa membacanya,
  --     itu tindakan tersendiri dan dicatat sebagai tindakan ICD-9-CM.
  --
  --     Penyaring terakhir menutup tagihan ganda. Satu foto periapikal bisa
  --     tercatat dua kali dengan cara yang sama-sama benar: dokter mencatat
  --     tindakan "87.12 Rontgen gigi lainnya" di §E2, DAN menulis bacaannya
  --     di sini. Tanpa penyaring ini pasien membayar dua kali untuk satu
  --     film, dengan dua baris struk yang sama-sama berakhir "(gigi 36)".
  --     Yang dipertahankan adalah baris tindakan, karena ia membawa kode
  --     ICD-9-CM yang dibutuhkan laporan dan bridging.
  for r in select pn.id, pn.jenis, coalesce(pn.judul, pn.jenis) as nama,
                  (select string_agg(pg.fdi, ', ' order by pg.fdi)
                     from penunjang_gigi pg where pg.penunjang_id = pn.id) as gigi
             from penunjang pn
            where pn.kunjungan_id = p_kunjungan_id
              and pn.asal = 'INTERNAL'
              and not exists (
                    select 1 from tindakan t
                     where t.kunjungan_id = p_kunjungan_id
                       and t.kode_icd9 = any (
                             case
                               when left(pn.jenis, 3) = 'RO_' and pn.jenis <> 'RO_THORAX'
                                 then array['87.11','87.12']
                               when pn.jenis = 'RO_THORAX' then array['87.44']
                               when pn.jenis = 'EKG'       then array['89.52']
                               when pn.jenis = 'USG'       then array['88.79']
                               else array[]::text[]
                             end))
            order by pn.dibaca_pada
  loop
    v_urut := v_urut + 1;
    insert into kasir_tagihan_item (tagihan_id, sumber, ref_id, ref_kode, nama, qty,
                                    harga_satuan, ditanggung_penjamin, urutan)
    values (v_tagihan.id, 'PENUNJANG', r.id, r.jenis,
            r.nama || case when r.gigi is not null then ' (gigi ' || r.gigi || ')' else '' end,
            1,
            coalesce(public.kasir_tarif_kode('PENUNJANG', r.jenis, v_k.tanggal), 0),
            v_ditanggung, v_urut);
  end loop;

  perform public.kasir_hitung_tagihan(v_tagihan.id);
  return v_tagihan.id;
end $$;

grant execute on function public.kasir_susun_dari_kunjungan(uuid) to authenticated;


-- =====================================================================
--  D. DAFTAR KUNJUNGAN YANG MENUNGGU KASIR
-- =====================================================================
--  Kunjungan yang pemeriksaan labnya belum selesai belum boleh dianggap
--  siap ditagih — kalau kasir menyusun tagihan lebih dulu, hasil lab yang
--  keluar sepuluh menit kemudian tidak akan pernah masuk ke tagihan itu,
--  dan pasien pulang tanpa membayarnya.
create or replace view v_kasir_menunggu_lab with (security_invoker = true) as
select k.id as kunjungan_id,
       count(*) filter (where lp.status in ('DIMINTA','DIKERJAKAN')) as lab_belum_selesai
  from kunjungan k
  join lab_permintaan lp on lp.kunjungan_id = k.id and lp.asal = 'INTERNAL'
 group by k.id;

grant select on v_kasir_menunggu_lab to authenticated;

comment on view v_kasir_menunggu_lab is
  'Dipakai halaman kasir untuk memberi peringatan sebelum tagihan disusun: masih ada pemeriksaan lab yang belum selesai pada kunjungan ini.';
-- =====================================================================
--  RME Laboratorium Medis Utama - SURAT-SURAT KETERANGAN
--  Surat sakit, rujukan BPJS, surat kontrol, keterangan berbadan sehat,
--  resume medis, dan surat keterangan bebas isi.
--  Jalankan SETELAH 12_kasir_penunjang.sql
--
--  ---------------------------------------------------------------------
--  PENOMORAN
--  ---------------------------------------------------------------------
--  Bentuk nomor yang dipakai Yayasan Kesehatan Utama:
--
--        07/SKS/YAKIM/IX/2026
--        ^^ ^^^ ^^^^^ ^^ ^^^^
--        |  |   |     |  +-- tahun
--        |  |   |     +----- bulan dalam angka Romawi
--        |  |   +----------- singkatan yayasan, tetap
--        |  +--------------- kode jenis surat
--        +------------------ nomor urut, minimal dua digit
--
--  Yang diketik pengguna HANYA angka nomor urutnya. Sisanya disusun
--  sendiri oleh database lewat kolom terhitung `nomor_surat`, sehingga
--  tidak ada satu pun surat yang bisa keluar dengan bentuk nomor berbeda
--  hanya karena seseorang salah ketik garis miring.
--
--  Deretnya TERPISAH PER JENIS SURAT dan diulang tiap tahun: surat sakit
--  punya deret sendiri, surat rujukan punya deret sendiri. Itu bentuk
--  yang lazim dipakai klinik dan paling mudah dicocokkan dengan buku
--  agenda surat keluar.
--
--  `surat_nomor_berikutnya()` hanya MENYARANKAN nomor terbesar + 1.
--  Sarannya boleh diganti — klinik yang sudah punya buku agenda berjalan
--  perlu bisa memasukkan nomor yang mendahului. Yang dijaga keras adalah
--  keunikannya, lewat indeks unik.
--
--  NOMOR YANG SUDAH DIPAKAI TIDAK PERNAH DIPAKAI ULANG, termasuk milik
--  surat yang dibatalkan. Surat yang batal hampir selalu sudah tercetak
--  dan mungkin sudah dipegang pasien; kalau nomornya dilepas kembali,
--  satu nomor pada buku agenda menunjuk dua lembar berbeda dan tidak ada
--  cara memisahkan keduanya lagi. Karena itu indeks uniknya sengaja
--  TIDAK memakai `where status = 'AKTIF'`.
--
--  ---------------------------------------------------------------------
--  TANDA TANGAN
--  ---------------------------------------------------------------------
--  Surat dicetak dengan RUANG TANDA TANGAN KOSONG, di bawahnya nama
--  dokter dan nomor SIP. Dokter menandatangani dengan pulpen, klinik
--  membubuhkan stempel. Keputusan Laboratorium Medis Utama, 3 September 2026.
--
--  Spesimen tanda tangan digital sengaja tidak disimpan. Alasannya bukan
--  soal ukuran berkas (satu spesimen PNG cuma puluhan kilobyte),
--  melainkan soal siapa yang bisa membubuhkannya: begitu gambar tanda
--  tangan dokter ada di dalam sistem, surat keterangan sakit bertanda
--  tangan dokter bisa terbit tanpa dokter itu pernah melihat pasiennya.
--
--  Nama dan SIP penanda tangan DISALIN ke dalam baris suratnya
--  (`ttd_nama`, `ttd_sip`), bukan dibaca ulang dari tabel `pegawai` saat
--  dicetak. Kalau nomor SIP dokter diperbarui tahun depan, cetak ulang
--  surat tahun ini harus tetap memulangkan lembar yang sama persis
--  dengan yang dulu ditandatangani — itu inti dari arsip.
-- =====================================================================


-- =====================================================================
--  A. HAK AKSES
-- =====================================================================

-- Siapa yang boleh MENERBITKAN surat.
-- Hanya dokter dan admin. Surat keterangan sakit, rujukan, dan keterangan
-- sehat semuanya adalah pernyataan medis atas nama dokter; yang boleh
-- menyusunnya adalah orang yang boleh bertanggung jawab atasnya.
-- Perawat, pendaftaran, apoteker, dan kasir tetap bisa MEMBACA dan
-- MENCETAK ULANG surat yang sudah terbit — itu pekerjaan loket.
-- 9 Sep 2026: lewat tabel hak_akses (bisa diatur master), bukan daftar
-- peran tetap lagi — lihat sql/02_rls.sql bagian HAK AKSES.
create or replace function public.boleh_surat() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('surat') $$;

-- Siapa boleh membatalkan/menghapus surat MILIK ORANG LAIN (di luar surat
-- sendiri, yang selalu boleh oleh dokter penerbitnya — itu tetap dijaga di
-- kode, bukan lewat kode hak akses ini, supaya master tidak bisa mencabut
-- hak dokter membatalkan suratnya sendiri).
create or replace function public.boleh_surat_batal() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('surat_batal') $$;

grant execute on function public.boleh_surat()       to authenticated;
grant execute on function public.boleh_surat_batal() to authenticated;

insert into public.hak_akses (kode, peran, diizinkan) values
  ('surat', 'dokter', true)
on conflict (kode, peran) do nothing;


-- =====================================================================
--  B. FUNGSI PENOMORAN
-- =====================================================================

-- Angka Romawi 1..12. IMMUTABLE karena dipakai di kolom terhitung.
create or replace function public.bulan_romawi(b integer) returns text
language sql immutable strict
as $$ select (array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'])[b] $$;

-- Satu-satunya tempat bentuk nomor surat ditulis. Dipakai kolom
-- terhitung di tabel `surat`, dan dicerminkan di js/surat_core.js untuk
-- pratinjau sambil mengetik. Uji test/uji_surat.sql dan
-- test/uji_surat_core.js sengaja memakai contoh yang sama persis supaya
-- keduanya tidak bisa berselisih diam-diam.
--
-- Catatan tentang lpad: `lpad('115', 2, '0')` memulangkan '11', bukan
-- '115' — lpad memotong bila teksnya sudah lebih panjang dari panjang
-- yang diminta. Karena itu panjangnya dihitung dulu dengan greatest().
-- Tanpa itu, surat ke-100 dan seterusnya keluar dengan nomor terpotong,
-- dan bentroknya baru ketahuan pada surat ke-100 di bulan kesekian —
-- jauh setelah semua orang percaya penomorannya benar.
create or replace function public.format_no_surat(
  p_nomor integer, p_jenis text, p_bulan integer, p_tahun integer)
returns text
language sql immutable
as $$
  select lpad(p_nomor::text, greatest(2, length(p_nomor::text)), '0')
         || '/' || p_jenis || '/YAKIM/'
         || public.bulan_romawi(p_bulan) || '/' || p_tahun::text
$$;

grant execute on function public.bulan_romawi(integer) to authenticated;
grant execute on function public.format_no_surat(integer, text, integer, integer) to authenticated;


-- =====================================================================
--  C. MASTER JENIS SURAT
-- =====================================================================
--  Kodenya ikut tercetak di nomor surat, jadi mengubah kode setelah surat
--  terbit akan mengubah nomor surat lama (kolom `nomor_surat` terhitung
--  dari kode yang tersimpan di baris surat, bukan dari master — lihat
--  catatan di tabel `surat`). Karena itu kode disimpan sebagai teks di
--  baris suratnya sendiri, bukan sebagai kunci asing yang ikut berubah.
create table if not exists ref_jenis_surat (
  kode            text primary key,
  nama            text not null,
  judul_cetak     text not null,             -- judul besar di tengah lembar
  keterangan      text,
  perlu_kunjungan boolean not null default true,
  urutan          smallint not null default 0,
  aktif           boolean not null default true,
  created_at      timestamptz not null default now()
);
comment on table ref_jenis_surat is
  'Jenis surat yang bisa diterbitkan. Kode ikut tercetak di nomor surat.';

insert into ref_jenis_surat (kode, nama, judul_cetak, keterangan, perlu_kunjungan, urutan) values
  ('SKS',  'Surat Keterangan Sakit',        'SURAT KETERANGAN SAKIT',
   'Keterangan istirahat karena sakit, untuk tempat kerja atau sekolah.', true, 1),
  ('SR',   'Surat Rujukan',                 'SURAT RUJUKAN',
   'Rujukan ke fasilitas kesehatan tingkat lanjut, bentuk mengikuti rujukan BPJS.', true, 2),
  ('SK',   'Surat Kontrol',                 'SURAT KONTROL',
   'Anjuran kontrol ulang pada tanggal tertentu.', true, 3),
  ('SKBS', 'Surat Keterangan Berbadan Sehat','SURAT KETERANGAN BERBADAN SEHAT',
   'Hasil pemeriksaan kesehatan untuk melamar kerja, sekolah, atau keperluan lain.', true, 4),
  ('RM',   'Resume Medis',                  'RESUME MEDIS',
   'Ringkasan pelayanan satu kunjungan untuk asuransi atau rujukan lanjutan.', true, 5),
  ('SKL',  'Surat Keterangan',              'SURAT KETERANGAN',
   'Surat keterangan dengan isi bebas, untuk keperluan yang belum ada bentuk bakunya.', false, 9)
on conflict (kode) do update set
  nama = excluded.nama, judul_cetak = excluded.judul_cetak,
  keterangan = excluded.keterangan, perlu_kunjungan = excluded.perlu_kunjungan,
  urutan = excluded.urutan;


-- =====================================================================
--  D. SURAT
-- =====================================================================
create table if not exists surat (
  id            uuid primary key default uuid_generate_v4(),

  -- ---- Penomoran -----------------------------------------------------
  -- jenis_kode, bulan, dan tahun disimpan sebagai NILAI, bukan diturunkan
  -- dari tanggal saat dibaca. Surat yang dibuat 2 Oktober untuk agenda
  -- bulan September harus tetap bernomor .../IX/2026 selamanya, dan surat
  -- lama tidak boleh berubah nomor kalau master jenis surat disunting.
  jenis_kode    text not null references ref_jenis_surat(kode),
  nomor_urut    integer not null check (nomor_urut between 1 and 9999),
  bulan         smallint not null check (bulan between 1 and 12),
  tahun         smallint not null check (tahun between 2000 and 2199),
  nomor_surat   text generated always as
                  (public.format_no_surat(nomor_urut, jenis_kode, bulan, tahun)) stored,

  tanggal_surat date not null default public.tgl_klinik(),

  -- ---- Kepada siapa --------------------------------------------------
  pasien_id     uuid not null references pasien(id),
  -- Boleh kosong: surat keterangan bebas isi kadang tidak melekat pada
  -- satu kunjungan tertentu.
  kunjungan_id  uuid references kunjungan(id) on delete set null,

  -- ---- Isi -----------------------------------------------------------
  -- Bentuk isinya berbeda-beda per jenis surat dan akan bertambah seiring
  -- waktu. Menyimpannya sebagai jsonb berarti menambah jenis surat baru
  -- tidak butuh migrasi kolom; bentuk tiap jenis dijaga di
  -- js/surat_core.js, yang juga yang menyusun formulir dan lembar cetaknya.
  perihal       text,
  data          jsonb not null default '{}'::jsonb,

  -- ---- Penanda tangan (disalin, bukan dibaca ulang) -------------------
  dokter_id     uuid references pegawai(id),
  ttd_nama      text not null,
  ttd_jabatan   text not null default 'Dokter Pemeriksa',
  ttd_sip       text,

  -- ---- Keadaan -------------------------------------------------------
  status        text not null default 'AKTIF' check (status in ('AKTIF','BATAL')),
  alasan_batal  text,
  dibatalkan_oleh uuid references pegawai(id),
  dibatalkan_pada timestamptz,

  jml_cetak     integer not null default 0,
  cetak_terakhir timestamptz,

  dibuat_oleh   uuid references pegawai(id),
  dibuat_pada   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Satu nomor hanya boleh menunjuk satu lembar, selamanya. Termasuk surat
-- yang sudah dibatalkan — lihat penjelasan di kepala berkas ini.
create unique index if not exists uq_surat_nomor
  on surat (jenis_kode, tahun, nomor_urut);

create index if not exists idx_surat_pasien on surat (pasien_id, tanggal_surat desc);
create index if not exists idx_surat_kunjungan on surat (kunjungan_id);
create index if not exists idx_surat_tanggal on surat (tanggal_surat desc);

-- Pencarian bebas di halaman Riwayat Surat: nomor, nama pasien, dan
-- perihal dicari dengan satu kotak, tanpa pengguna perlu tahu ia sedang
-- mencari di kolom yang mana.
create index if not exists idx_surat_nomor_cari on surat (nomor_surat text_pattern_ops);

drop trigger if exists trg_updated_surat on surat;
create trigger trg_updated_surat before update on surat
for each row execute function set_updated_at();

-- Bulan dan tahun tidak boleh ditinggal kosong saat aplikasi lupa
-- mengirimnya; kalau tidak diisi, ikuti tanggal suratnya.
create or replace function public.surat_lengkapi() returns trigger
language plpgsql as $$
begin
  if new.bulan is null then new.bulan := extract(month from new.tanggal_surat)::smallint; end if;
  if new.tahun is null then new.tahun := extract(year  from new.tanggal_surat)::smallint; end if;

  -- Penerbit surat ditentukan oleh sesi, bukan oleh yang dikirim peramban.
  -- Kolom ini yang dipakai kebijakan RLS untuk memutuskan siapa yang boleh
  -- menyunting dan membatalkan surat; kalau nilainya boleh diketik klien,
  -- satu permintaan yang disusun tangan bisa menerbitkan surat atas nama
  -- dokter lain, lengkap dengan izin menyuntingnya.
  -- coalesce dipakai supaya berkas uji yang berjalan tanpa sesi (sebagai
  -- superuser) tetap bisa menyiapkan data.
  new.dibuat_oleh := coalesce(auth.uid(), new.dibuat_oleh);
  return new;
end $$;

drop trigger if exists trg_surat_lengkapi on surat;
create trigger trg_surat_lengkapi before insert on surat
for each row execute function public.surat_lengkapi();

-- Surat yang sudah dibatalkan tidak boleh disunting lagi. Tanpa
-- penjagaan ini, "batalkan lalu perbaiki isinya" menjadi cara mengubah
-- surat yang sudah dipegang pasien tanpa meninggalkan jejak: nomornya
-- sama, isinya lain, dan tidak ada satu pun kolom yang berubah untuk
-- menandainya. Membatalkan dan mencatat cetak tetap boleh.
create or replace function public.surat_jaga_batal() returns trigger
language plpgsql as $$
begin
  if old.status = 'BATAL' and new.status = 'BATAL' then
    if new.jenis_kode is distinct from old.jenis_kode
       or new.nomor_urut is distinct from old.nomor_urut
       or new.bulan is distinct from old.bulan
       or new.tahun is distinct from old.tahun
       or new.tanggal_surat is distinct from old.tanggal_surat
       or new.pasien_id is distinct from old.pasien_id
       or new.perihal is distinct from old.perihal
       or new.data is distinct from old.data
       or new.ttd_nama is distinct from old.ttd_nama then
      raise exception 'Surat yang sudah dibatalkan tidak dapat diubah. Terbitkan surat baru dengan nomor baru.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_surat_jaga_batal on surat;
create trigger trg_surat_jaga_batal before update on surat
for each row execute function public.surat_jaga_batal();


-- =====================================================================
--  E. FUNGSI
-- =====================================================================

-- Saran nomor berikutnya untuk satu jenis surat pada satu tahun.
-- Sekadar saran: pengguna boleh menggantinya. Yang menjaga keunikannya
-- adalah indeks uq_surat_nomor, bukan fungsi ini.
create or replace function public.surat_nomor_berikutnya(p_jenis text, p_tahun integer)
returns integer
language sql stable security definer set search_path = public
as $$
  select coalesce(max(nomor_urut), 0) + 1
    from public.surat
   where jenis_kode = p_jenis and tahun = p_tahun::smallint
$$;

-- Apakah satu nomor sudah terpakai? Dipakai formulir untuk memberi
-- peringatan SEBELUM tombol simpan ditekan, supaya pengguna tidak
-- kehilangan isian yang sudah diketik hanya untuk mengetahui nomornya
-- bentrok.
create or replace function public.surat_nomor_terpakai(
  p_jenis text, p_tahun integer, p_nomor integer)
returns text
language sql stable security definer set search_path = public
as $$
  select nomor_surat || case when status = 'BATAL' then ' (dibatalkan)' else '' end
    from public.surat
   where jenis_kode = p_jenis and tahun = p_tahun::smallint and nomor_urut = p_nomor
   limit 1
$$;

-- Membatalkan surat. Alasannya wajib dan tercatat.
-- Yang boleh: admin, atau dokter yang menerbitkannya sendiri.
create or replace function public.surat_batalkan(p_id uuid, p_alasan text)
returns surat
language plpgsql security definer set search_path = public
as $$
declare s surat;
begin
  if coalesce(btrim(p_alasan), '') = '' then
    raise exception 'Alasan pembatalan wajib diisi.';
  end if;

  select * into s from surat where id = p_id for update;
  if not found then raise exception 'Surat tidak ditemukan.'; end if;
  if s.status = 'BATAL' then raise exception 'Surat ini sudah dibatalkan.'; end if;

  if not (public.boleh_surat_batal() or s.dibuat_oleh = auth.uid()) then
    raise exception 'Hanya master atau dokter yang menerbitkan surat ini yang boleh membatalkannya.';
  end if;

  update surat set status = 'BATAL', alasan_batal = btrim(p_alasan),
         dibatalkan_oleh = auth.uid(), dibatalkan_pada = now()
   where id = p_id returning * into s;
  return s;
end $$;

-- Mencatat bahwa surat dicetak / diunduh. Boleh dipanggil semua staf —
-- loket memang yang mencetak ulang. Sengaja lewat fungsi, bukan UPDATE
-- biasa: kalau seluruh baris `surat` boleh di-UPDATE staf loket, mencatat
-- cetakan berarti membuka pintu untuk mengubah isi suratnya juga.
create or replace function public.surat_catat_cetak(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.saya_staf() then
    raise exception 'Tidak berwenang.';
  end if;
  update surat set jml_cetak = jml_cetak + 1, cetak_terakhir = now()
   where id = p_id;
end $$;

grant execute on function public.surat_nomor_berikutnya(text, integer)      to authenticated;
grant execute on function public.surat_nomor_terpakai(text, integer, integer) to authenticated;
grant execute on function public.surat_batalkan(uuid, text)                  to authenticated;
grant execute on function public.surat_catat_cetak(uuid)                     to authenticated;


-- =====================================================================
--  F. PENGATURAN SURAT
-- =====================================================================
--  Satu baris berisi seluruh pengaturan cetak surat: kop, kota pada
--  baris tanggal, dan catatan kaki. Bentuknya jsonb dengan pola yang sama
--  seperti sys_template_invoice (BAWAAN di JavaScript + gabung), sehingga
--  menambah pengaturan baru nanti tidak butuh migrasi SQL.
--
--  KOP DISIMPAN SEBAGAI DATA URI DI DALAM BARIS INI, BUKAN DI STORAGE.
--  Alasannya sama dengan keputusan 2 September untuk gambar rontgen:
--  Supabase paket gratis memberi 1 GB Storage, dan kuota yang habis
--  menggagalkan unggahan di tengah jam praktek. Kop surat cuma satu
--  gambar untuk seluruh klinik, ukurannya ratusan kilobyte setelah
--  dikecilkan di peramban, dan ia dibutuhkan SEKALIGUS dengan halaman
--  cetaknya — pdfmake bahkan tidak bisa mengambil gambar dari URL sama
--  sekali. Satu baris jsonb menyelesaikan ketiganya.
create table if not exists sys_surat_pengaturan (
  id           smallint primary key default 1 check (id = 1),
  konfigurasi  jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references pegawai(id)
);

insert into sys_surat_pengaturan (id, konfigurasi) values (1, '{}'::jsonb)
on conflict (id) do nothing;

drop trigger if exists trg_updated_sys_surat on sys_surat_pengaturan;
create trigger trg_updated_sys_surat before update on sys_surat_pengaturan
for each row execute function set_updated_at();


-- =====================================================================
--  G. VIEW
-- =====================================================================
create or replace view v_surat with (security_invoker = true) as
select s.id, s.nomor_surat, s.jenis_kode, s.nomor_urut, s.bulan, s.tahun,
       s.tanggal_surat, s.perihal, s.data, s.status, s.alasan_batal,
       s.jml_cetak, s.cetak_terakhir, s.dibuat_pada, s.dibuat_oleh,
       s.ttd_nama, s.ttd_jabatan, s.ttd_sip,
       j.nama as jenis_nama, j.judul_cetak,
       p.id as pasien_id, p.no_rm, p.nama as nama_pasien,
       p.jenis_kelamin, p.tanggal_lahir,
       s.kunjungan_id, k.no_kunjungan, k.tanggal as tanggal_kunjungan,
       k.cara_bayar,
       po.nama as nama_poli,
       pb.nama as nama_pembuat
  from surat s
  join ref_jenis_surat j on j.kode = s.jenis_kode
  join pasien p on p.id = s.pasien_id
  left join kunjungan k on k.id = s.kunjungan_id
  left join poli po on po.id = k.poli_id
  left join pegawai pb on pb.id = s.dibuat_oleh;

-- View tidak mewarisi GRANT dari 02_rls.sql. Gejalanya kalau ini
-- terlewat: "permission denied for view v_surat" di halaman yang
-- tabel-tabelnya jelas boleh dibaca. Karena view ini security_invoker,
-- RLS tabel di baliknya tetap berlaku; GRANT hanya membuka pintunya.
grant select on v_surat to authenticated;


-- =====================================================================
--  H. HAK AKSES TABEL & ROW LEVEL SECURITY
-- =====================================================================
--  GRANT ditulis untuk tiap tabel baru dan tidak diwariskan dari
--  02_rls.sql: `grant ... on all tables` di sana hanya mengenai tabel
--  yang sudah ada saat berkas itu dijalankan.
grant select, insert, update, delete on
  ref_jenis_surat, surat, sys_surat_pengaturan
  to authenticated;

alter table ref_jenis_surat     enable row level security;
alter table surat               enable row level security;
alter table sys_surat_pengaturan enable row level security;

-- Master jenis surat: dibaca semua staf, diubah kode `master_data`.
drop policy if exists ref_jenis_surat_baca on ref_jenis_surat;
create policy ref_jenis_surat_baca on ref_jenis_surat for select
  to authenticated using (public.saya_staf());

drop policy if exists ref_jenis_surat_tulis on ref_jenis_surat;
create policy ref_jenis_surat_tulis on ref_jenis_surat for all
  to authenticated
  using (public.boleh_master_data())
  with check (public.boleh_master_data());

-- Surat: dibaca semua staf (loket mencetak ulang, kasir memeriksa
-- kelengkapan berkas rujukan).
drop policy if exists surat_baca on surat;
create policy surat_baca on surat for select
  to authenticated using (public.saya_staf());

-- Diterbitkan hanya oleh dokter (kode `surat`).
drop policy if exists surat_terbit on surat;
create policy surat_terbit on surat for insert
  to authenticated with check (public.boleh_surat());

-- Disunting oleh yang berhak membatalkan surat orang lain (kode
-- `surat_batal`), atau dokter yang menerbitkannya sendiri, dan hanya
-- selama masih berstatus AKTIF. Perubahan status menjadi BATAL berjalan
-- lewat surat_batalkan() yang SECURITY DEFINER, jadi tidak terhalang
-- kebijakan ini.
drop policy if exists surat_sunting on surat;
create policy surat_sunting on surat for update
  to authenticated
  using (public.boleh_surat_batal()
         or (public.boleh_surat() and dibuat_oleh = auth.uid() and status = 'AKTIF'))
  with check (public.boleh_surat_batal()
              or (public.boleh_surat() and dibuat_oleh = auth.uid()));

-- Menghapus surat: kode `surat_batal` juga, dan sebaiknya tidak pernah.
-- Surat yang salah dibatalkan, bukan dihapus — nomornya tetap terpakai
-- supaya lembar yang terlanjur tercetak tidak berubah arti.
drop policy if exists surat_hapus on surat;
create policy surat_hapus on surat for delete
  to authenticated using (public.boleh_surat_batal());

-- Pengaturan surat: dibaca semua staf (kopnya dibutuhkan siapa pun yang
-- mencetak), diubah kode `master_data`.
drop policy if exists sys_surat_baca on sys_surat_pengaturan;
create policy sys_surat_baca on sys_surat_pengaturan for select
  to authenticated using (public.saya_staf());

drop policy if exists sys_surat_tulis on sys_surat_pengaturan;
create policy sys_surat_tulis on sys_surat_pengaturan for all
  to authenticated
  using (public.boleh_master_data())
  with check (public.boleh_master_data());


-- =====================================================================
--  I. AUDIT
-- =====================================================================
drop trigger if exists trg_audit_surat on surat;
create trigger trg_audit_surat
  after insert or update or delete on surat
  for each row execute function public.catat_audit();
-- =====================================================================
--  RME Laboratorium Medis Utama — PEMERIKSAAN TERSTRUKTUR (siap PCare & SatuSehat)
--  Jalankan SETELAH 13_surat.sql. Aman dijalankan di database berisi data,
--  dan aman dijalankan ulang.
--
--  MENGAPA BERKAS INI ADA
--  ----------------------
--  Sampai sekarang pemeriksaan dokter disimpan sebagai empat kotak teks
--  bebas (S, O, A, P). Itu enak diketik, tetapi tidak ada satu pun field
--  yang bisa dikirim apa adanya ke PCare maupun SatuSehat:
--
--    * PCare  /kunjungan  meminta 30 field terpisah — keluhan, kdSadar,
--      sistole, diastole, suhu, kdStatusPulang, kdDiag1..3, kdPrognosa,
--      terapiObat, terapiNonObat, bmhp, kdTacc, alasanTacc, rujukLanjut,
--      alergiMakan/Udara/Obat. Tak satu pun berupa paragraf.
--    * SatuSehat meminta tiap tanda vital dan tiap temuan pemeriksaan
--      fisik sebagai Observation terpisah dengan kode LOINC.
--
--  Kalau perubahan ini ditunda sampai kredensial datang, yang harus
--  dikerjakan bukan "menyambungkan" melainkan MEMBACA ULANG ribuan
--  paragraf dan memecahnya jadi field — pekerjaan yang tidak bisa
--  dilakukan mesin dan tidak akan pernah selesai. Karena itu strukturnya
--  dibuat sekarang, selagi catatan yang ada masih sedikit.
--
--  YANG SENGAJA DIBIARKAN KOSONG
--  -----------------------------
--  Kolom `kode_pcare` pada tabel-tabel rujukan di bawah TIDAK diisi tebakan.
--  Nilainya milik BPJS dan hanya sah kalau diambil dari endpoint referensi
--  PCare sesudah klinik punya kredensial. Kode salah pada kdStatusPulang
--  atau kdPrognosa tidak menimbulkan galat apa pun — klaimnya terkirim,
--  diterima, dan isinya keliru. Yang dibangun sekarang justru satu-satunya
--  hal yang mahal kalau ditunda: TEMPAT kodenya, plus halaman pemetaan dan
--  view kesiapan supaya yang belum terisi kelihatan sejak hari pertama.
--
--  Yang DIISI sekarang hanya nilai yang memang baku dan tidak berubah:
--  kode LOINC tanda vital (dari profil FHIR vitalsigns) dan kdTkp/kdTacc
--  yang nilainya sudah tetap sejak PCare v1.
-- =====================================================================


-- =====================================================================
--  1. TABEL RUJUKAN BARU
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1a. Prognosa  →  PCare kdPrognosa
--     Nama Latin dipakai apa adanya karena itu yang ditulis dokter di
--     rekam medis; kolom kode yang menjembatani ke PCare.
-- ---------------------------------------------------------------------
create table if not exists ref_prognosa (
  kode        text primary key,
  nama        text not null,
  keterangan  text,
  kode_pcare  text,
  urutan      smallint default 0,
  aktif       boolean not null default true
);

insert into ref_prognosa (kode, nama, keterangan, urutan) values
  ('BONAM',        'Bonam',          'Baik — diperkirakan sembuh sempurna',      1),
  ('DUBIA_BONAM',  'Dubia ad bonam', 'Ragu, cenderung membaik',                  2),
  ('DUBIA',        'Dubia',          'Ragu — belum dapat ditentukan',             3),
  ('DUBIA_MALAM',  'Dubia ad malam', 'Ragu, cenderung memburuk',                 4),
  ('MALAM',        'Malam',          'Buruk',                                     5),
  ('AD_VITAM',     'Ad vitam',       'Menyangkut nyawa',                          6),
  ('AD_FUNCTIONAM','Ad functionam',  'Menyangkut fungsi organ',                   7),
  ('AD_SANATIONAM','Ad sanationam',  'Menyangkut kemungkinan kambuh',             8)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 1b. TACC  →  PCare kdTacc / alasanTacc
--     TACC = Time, Age, Complication, Comorbidity. Dipakai BPJS untuk
--     membenarkan rujukan atas diagnosa yang seharusnya tuntas di FKTP.
--     Nilai −1..3 sudah tetap sejak PCare v1, jadi kode_pcare-nya diisi.
-- ---------------------------------------------------------------------
create table if not exists ref_tacc (
  kode        text primary key,
  nama        text not null,
  keterangan  text,
  kode_pcare  text,
  perlu_alasan boolean not null default true,
  urutan      smallint default 0,
  aktif       boolean not null default true
);

insert into ref_tacc (kode, nama, keterangan, kode_pcare, perlu_alasan, urutan) values
  ('TIDAK', 'Tanpa TACC',   'Rujukan biasa, atau pasien tidak dirujuk',       '-1', false, 0),
  ('T',     'Time',         'Perjalanan penyakit sudah melewati waktu yang wajar ditangani FKTP', '0', true, 1),
  ('A',     'Age',          'Umur pasien menjadi pertimbangan rujukan',       '1',  true,  2),
  ('C1',    'Complication', 'Ada komplikasi yang tidak dapat ditangani FKTP', '2',  true,  3),
  ('C2',    'Comorbidity',  'Ada penyakit penyerta yang memerlukan rujukan',  '3',  true,  4)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 1c. Tingkat pelayanan (kdTkp). Klinik pratama rawat jalan selalu '10';
--     tabelnya tetap dibuat supaya nilainya tidak ditanam di dalam kode.
-- ---------------------------------------------------------------------
create table if not exists ref_tkp (
  kode        text primary key,
  nama        text not null,
  kode_pcare  text,
  urutan      smallint default 0,
  aktif       boolean not null default true
);

insert into ref_tkp (kode, nama, kode_pcare, urutan, aktif) values
  ('10', 'Rawat Jalan',          '10', 1, true),
  ('20', 'Rawat Inap',           '20', 2, false),
  ('50', 'Promotif Preventif',   '50', 3, true)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 1d. Alergi  →  PCare alergiMakan / alergiUdara / alergiObat
--     PCare meminta SATU kode per jenis, bukan daftar. Karena itu kolom
--     `kode` di sini adalah kode ringkas per jenis, sedangkan daftar
--     alergi pasien yang sebenarnya tetap di tabel pasien_alergi.
-- ---------------------------------------------------------------------
create table if not exists ref_alergi (
  id          uuid primary key default uuid_generate_v4(),
  jenis       text not null check (jenis in ('MAKANAN','UDARA','OBAT')),
  kode        text not null,
  nama        text not null,
  kode_pcare  text,
  urutan      smallint default 0,
  aktif       boolean not null default true,
  unique (jenis, kode)
);

insert into ref_alergi (jenis, kode, nama, urutan) values
  ('MAKANAN','00','Tidak ada alergi makanan',        0),
  ('MAKANAN','LT','Makanan laut / seafood',          1),
  ('MAKANAN','TL','Telur',                           2),
  ('MAKANAN','SS','Susu sapi',                       3),
  ('MAKANAN','KC','Kacang-kacangan',                 4),
  ('MAKANAN','LN','Makanan lain',                    9),
  ('UDARA',  '00','Tidak ada alergi udara',          0),
  ('UDARA',  'DB','Debu',                            1),
  ('UDARA',  'DG','Udara dingin',                    2),
  ('UDARA',  'SP','Serbuk sari / tepung sari',       3),
  ('UDARA',  'AS','Asap',                            4),
  ('UDARA',  'BH','Bulu hewan',                      5),
  ('UDARA',  'LN','Penyebab lain di udara',          9),
  ('OBAT',   '00','Tidak ada alergi obat',           0),
  ('OBAT',   'PN','Penisilin dan turunannya',        1),
  ('OBAT',   'SF','Sulfa',                           2),
  ('OBAT',   'AS','Asam salisilat / aspirin',        3),
  ('OBAT',   'NS','Antinyeri golongan NSAID',        4),
  ('OBAT',   'LN','Obat lain',                       9)
on conflict (jenis, kode) do nothing;

-- ---------------------------------------------------------------------
-- 1e. Faskes rujukan (kdppk), sub spesialis, dan sarana penunjang
--     → PCare rujukLanjut { kdppk, subSpesialis{ kdSubSpesialis1,
--       kdSarana }, tglEstRujuk, khusus }
--
--     Isi tabel ini datang dari BPJS (endpoint referensi faskes rujukan
--     dan spesialis). Sampai kredensial ada, klinik boleh mengisi sendiri
--     rumah sakit langganan lewat Pengaturan → Rujukan supaya dokter
--     tetap memilih dari daftar, bukan mengetik nama bebas.
-- ---------------------------------------------------------------------
create table if not exists ref_ppk (
  kode        text primary key,          -- kdppk dari BPJS
  nama        text not null,
  jenis       text default 'RS',         -- RS | KLINIK | LABORATORIUM | APOTEK
  alamat      text,
  telepon     text,
  sumber      text not null default 'MANUAL',   -- MANUAL | PCARE
  urutan      smallint default 0,
  aktif       boolean not null default true,
  updated_at  timestamptz not null default now()
);
comment on table ref_ppk is
  'Faskes tujuan rujukan. Kolom kode = kdppk BPJS. Baris bersumber MANUAL '
  'diketik klinik sendiri dan kodenya harus dicocokkan sebelum bridging aktif.';

create table if not exists ref_subspesialis (
  kode        text primary key,
  nama        text not null,
  kode_pcare  text,
  urutan      smallint default 0,
  aktif       boolean not null default true
);

-- Sub spesialis yang paling sering jadi tujuan rujukan klinik pratama.
-- Kode di bawah kode INTERNAL; kode_pcare menyusul dari referensi BPJS.
insert into ref_subspesialis (kode, nama, urutan) values
  ('PD',   'Penyakit Dalam',            1),
  ('ANAK', 'Anak',                      2),
  ('BEDAH','Bedah Umum',                3),
  ('OBGYN','Kebidanan & Kandungan',     4),
  ('MATA', 'Mata',                      5),
  ('THT',  'THT-KL',                    6),
  ('SARAF','Saraf',                     7),
  ('KULIT','Kulit & Kelamin',           8),
  ('JIWA', 'Kesehatan Jiwa',            9),
  ('JANTUNG','Jantung & Pembuluh Darah',10),
  ('PARU', 'Paru',                      11),
  ('ORTHO','Orthopedi',                 12),
  ('URO',  'Urologi',                   13),
  ('GIGI', 'Gigi & Mulut',              14),
  ('REHAB','Rehabilitasi Medik',        15)
on conflict (kode) do nothing;

create table if not exists ref_sarana (
  kode        text primary key,
  nama        text not null,
  kode_pcare  text,
  urutan      smallint default 0,
  aktif       boolean not null default true
);

insert into ref_sarana (kode, nama, urutan) values
  ('TANPA', 'Tanpa sarana khusus', 0),
  ('LAB',   'Laboratorium',        1),
  ('RAD',   'Radiologi',           2),
  ('USG',   'USG',                 3),
  ('CT',    'CT Scan',             4),
  ('MRI',   'MRI',                 5),
  ('EKG',   'EKG / Elektromedik',  6),
  ('HEMO',  'Hemodialisa',         7)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 1f. Sistem pemeriksaan fisik  →  SatuSehat Observation
--
--     Satu baris = satu sistem tubuh = satu Observation nanti. `normal_teks`
--     adalah kalimat yang dipakai saat dokter menekan "dalam batas normal",
--     supaya narasi O pada rekam medis tetap berbunyi seperti tulisan
--     dokter, bukan daftar centang.
--
--     kode_loinc dan kode_snomed sengaja kosong: kode pemeriksaan fisik
--     per sistem bukan bagian dari profil FHIR baku dan harus mengikuti
--     terminologi yang dipakai SatuSehat. Kode internal di kolom `kode`
--     sudah stabil, jadi catatan yang terkumpul hari ini tidak perlu diubah.
-- ---------------------------------------------------------------------
create table if not exists ref_sistem_fisik (
  kode          text primary key,
  nama          text not null,
  normal_teks   text not null,
  temuan_lazim  jsonb not null default '[]'::jsonb,
  kode_loinc    text,
  kode_snomed   text,
  poli_jenis    text,        -- null = semua poli, 'GIGI' = hanya poli gigi
  bawaan_periksa boolean not null default true,  -- ikut tombol "semua normal"
  urutan        smallint default 0,
  aktif         boolean not null default true
);

insert into ref_sistem_fisik (kode, nama, normal_teks, temuan_lazim, bawaan_periksa, urutan) values
  ('UMUM',    'Keadaan umum',
   'Tampak sakit ringan, kesadaran compos mentis, gizi cukup',
   '["Tampak sakit sedang","Tampak sakit berat","Tampak pucat","Tampak sesak","Tampak lemas","Gizi kurang"]', true, 1),
  ('KEPALA',  'Kepala & wajah',
   'Normosefali, wajah simetris, tidak ada deformitas',
   '["Nyeri tekan sinus","Wajah asimetris","Edema palpebra","Jejas / luka"]', true, 2),
  ('MATA',    'Mata',
   'Konjungtiva tidak anemis, sklera tidak ikterik, pupil isokor, refleks cahaya positif',
   '["Konjungtiva anemis","Sklera ikterik","Pupil anisokor","Mata cekung","Injeksi konjungtiva","Sekret mata"]', true, 3),
  ('THT',     'Telinga, hidung, tenggorokan',
   'Liang telinga lapang, tidak ada sekret; hidung tidak ada sekret maupun deviasi septum; faring tidak hiperemis, tonsil T1-T1 tenang',
   '["Faring hiperemis","Tonsil T2-T2","Tonsil T3-T3 dengan detritus","Sekret hidung serosa","Konka edema","Serumen obturans","Membran timpani suram","Nyeri tekan tragus"]', true, 4),
  ('MULUT',   'Mulut & gigi',
   'Mukosa mulut lembap, lidah tidak kotor, gigi geligi baik',
   '["Mukosa kering","Lidah kotor","Stomatitis","Karies gigi","Gusi berdarah"]', true, 5),
  ('LEHER',   'Leher',
   'Tidak ada pembesaran kelenjar getah bening maupun tiroid, JVP tidak meningkat',
   '["Pembesaran KGB leher","Pembesaran tiroid","JVP meningkat","Kaku kuduk"]', true, 6),
  ('PARU',    'Toraks — paru',
   'Gerak napas simetris, retraksi tidak ada, suara napas vesikuler, ronki tidak ada, wheezing tidak ada',
   '["Ronki basah halus","Ronki basah kasar","Wheezing ekspirasi","Suara napas melemah","Retraksi interkostal","Gerak napas asimetris","Hipersonor","Redup basal"]', true, 7),
  ('JANTUNG', 'Toraks — jantung',
   'Bunyi jantung I dan II reguler, murmur tidak ada, gallop tidak ada',
   '["Murmur sistolik","Gallop","Irama tidak teratur","Takikardia","Bradikardia","Batas jantung melebar"]', true, 8),
  ('ABDOMEN', 'Abdomen',
   'Datar, supel, bising usus normal, nyeri tekan tidak ada, hepar dan lien tidak teraba',
   '["Nyeri tekan epigastrium","Nyeri tekan McBurney","Nyeri ketok CVA","Distensi","Bising usus meningkat","Bising usus menurun","Hepatomegali","Splenomegali","Defans muskuler","Asites"]', true, 9),
  ('EKSTREMITAS','Ekstremitas',
   'Akral hangat, capillary refill kurang dari 2 detik, edema tidak ada, gerak bebas',
   '["Akral dingin","Edema tungkai","CRT lebih dari 2 detik","Nyeri sendi","Keterbatasan gerak","Deformitas","Krepitasi","Luka terbuka"]', true, 10),
  ('KULIT',   'Kulit',
   'Turgor baik, tidak ada ruam maupun lesi',
   '["Turgor menurun","Ruam makulopapular","Vesikel","Ikterik","Pucat","Sianosis","Ptekie","Ulkus","Gatal / ekskoriasi"]', true, 11),
  ('NEURO',   'Neurologis',
   'Kesadaran compos mentis, tidak ada defisit motorik maupun sensorik, refleks fisiologis normal, refleks patologis negatif',
   '["Hemiparesis","Parese nervus kranialis","Refleks patologis positif","Rangsang meningeal positif","Tremor","Penurunan sensorik"]', true, 12),
  ('GENITAL', 'Genitourinaria',
   'Tidak ada kelainan pada pemeriksaan luar',
   '["Nyeri tekan suprapubik","Sekret uretra","Pembesaran skrotum","Fluor albus"]', false, 13)
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------
-- 1g. Kode LOINC tanda vital  →  SatuSehat Observation
--     Nilai di sini DIISI karena berasal dari profil FHIR vitalsigns
--     (hl7.org/fhir/R4/observation-vitalsigns.html) — baku lintas negara
--     dan tidak akan berubah oleh keputusan lokal mana pun.
-- ---------------------------------------------------------------------
create table if not exists ref_vital (
  kode        text primary key,    -- sama dengan nama kolom di kajian_awal
  nama        text not null,
  satuan      text,
  satuan_ucum text,                -- satuan versi UCUM untuk FHIR
  kode_loinc  text,
  urutan      smallint default 0
);

insert into ref_vital (kode, nama, satuan, satuan_ucum, kode_loinc, urutan) values
  ('sistolik',      'Tekanan darah sistolik',  'mmHg',  'mm[Hg]', '8480-6',  1),
  ('diastolik',     'Tekanan darah diastolik', 'mmHg',  'mm[Hg]', '8462-4',  2),
  ('tekanan_darah', 'Tekanan darah',           'mmHg',  'mm[Hg]', '85354-9', 3),
  ('nadi',          'Frekuensi nadi',          'x/menit','/min',  '8867-4',  4),
  ('nafas',         'Frekuensi napas',         'x/menit','/min',  '9279-1',  5),
  ('suhu',          'Suhu tubuh',              '°C',    'Cel',    '8310-5',  6),
  ('spo2',          'Saturasi oksigen',        '%',     '%',      '2708-6',  7),
  ('berat_badan',   'Berat badan',             'kg',    'kg',     '29463-7', 8),
  ('tinggi_badan',  'Tinggi badan',            'cm',    'cm',     '8302-2',  9),
  ('imt',           'Indeks massa tubuh',      'kg/m²', 'kg/m2',  '39156-5', 10),
  ('lingkar_perut', 'Lingkar perut',           'cm',    'cm',     '8280-0',  11),
  ('skala_nyeri',   'Skala nyeri',             '0-10',  '{score}','72514-3', 12)
on conflict (kode) do nothing;


-- =====================================================================
--  2. KOLOM BARU PADA TABEL YANG SUDAH ADA
--     Semua ditambah, tidak ada yang dibuang. Kolom teks lama (subjective,
--     objective, assessment, plan) tetap tinggal dan tetap terisi — kini
--     disusun otomatis dari isian terstruktur oleh aplikasi. Rekam medis
--     yang sudah terlanjur dibuat tetap terbaca persis seperti semula.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2a. pemeriksaan — anamnesis
-- ---------------------------------------------------------------------
alter table pemeriksaan add column if not exists keluhan_utama text;
comment on column pemeriksaan.keluhan_utama is 'PCare /kunjungan → keluhan';

alter table pemeriksaan add column if not exists anamnesis text;
comment on column pemeriksaan.anamnesis is
  'PCare /kunjungan → anamnesa. Disusun aplikasi dari riwayat_penyakit_sekarang '
  'dan riwayat lain; boleh disunting dokter.';

alter table pemeriksaan add column if not exists riwayat_penyakit_sekarang jsonb
  not null default '{}'::jsonb;
comment on column pemeriksaan.riwayat_penyakit_sekarang is
  'Tujuh butir anamnesis: onset, lokasi, kualitas, kuantitas, kronologi, '
  'memperberat, memperingan, penyerta.';

alter table pemeriksaan add column if not exists riwayat_penyakit_dahulu text;
alter table pemeriksaan add column if not exists riwayat_keluarga text;
alter table pemeriksaan add column if not exists riwayat_pengobatan text;
alter table pemeriksaan add column if not exists riwayat_sosial text;

-- ---------------------------------------------------------------------
-- 2b. pemeriksaan — objektif
-- ---------------------------------------------------------------------
alter table pemeriksaan add column if not exists keadaan_umum text;
alter table pemeriksaan add column if not exists kesadaran_kode text
  references ref_kesadaran(kode);
comment on column pemeriksaan.kesadaran_kode is
  'Penilaian dokter. Boleh berbeda dari kajian awal perawat — yang dikirim '
  'ke PCare sebagai kdSadar adalah nilai ini bila ada.';

-- pemeriksaan_fisik sudah ada sejak 01_schema.sql; isinya yang kini diatur:
--   { "PARU": { "status": "ABNORMAL", "temuan": "Ronki basah halus basal kanan" }, ... }
--   status ∈ NORMAL | ABNORMAL | TIDAK_DIPERIKSA
comment on column pemeriksaan.pemeriksaan_fisik is
  'Temuan per sistem tubuh, kunci = ref_sistem_fisik.kode, nilai = '
  '{status, temuan}. Satu sistem menjadi satu Observation SatuSehat.';

-- ---------------------------------------------------------------------
-- 2c. pemeriksaan — penilaian
-- ---------------------------------------------------------------------
alter table pemeriksaan add column if not exists diagnosis_banding jsonb
  not null default '[]'::jsonb;
comment on column pemeriksaan.diagnosis_banding is
  'Daftar [{kode, nama}] ICD-10 yang dipertimbangkan tapi belum ditegakkan. '
  'Tidak ikut dikirim sebagai diagnosa; hanya untuk rekam medis.';

-- ---------------------------------------------------------------------
-- 2d. pemeriksaan — rencana / tata laksana
-- ---------------------------------------------------------------------
alter table pemeriksaan add column if not exists terapi_obat text;
comment on column pemeriksaan.terapi_obat is
  'PCare /kunjungan → terapiObat. Disusun aplikasi dari daftar resep.';
-- terapi_non_obat sudah ada sejak 01_schema.sql  → PCare terapiNonObat
alter table pemeriksaan add column if not exists bmhp text;
comment on column pemeriksaan.bmhp is
  'PCare /kunjungan → bmhp. Bahan medis habis pakai: kasa, spuit, plester, dsb.';

alter table pemeriksaan add column if not exists prognosa_kode text
  references ref_prognosa(kode);

-- ---------------------------------------------------------------------
-- 2e. pemeriksaan — rujukan terstruktur
--     Kolom teks lama (rujuk_ke_faskes, rujuk_spesialis, rujuk_alasan)
--     tetap ada: surat rujukan mencetak nama, bukan kode.
-- ---------------------------------------------------------------------
alter table pemeriksaan add column if not exists rujuk_poli_internal_id uuid
  references poli(id);
alter table pemeriksaan add column if not exists rujuk_ppk_kode text
  references ref_ppk(kode);
alter table pemeriksaan add column if not exists rujuk_subspesialis_kode text
  references ref_subspesialis(kode);
alter table pemeriksaan add column if not exists rujuk_sarana_kode text
  references ref_sarana(kode);
alter table pemeriksaan add column if not exists rujuk_tgl_estimasi date;
alter table pemeriksaan add column if not exists rujuk_khusus_kode text;

alter table pemeriksaan add column if not exists tacc_kode text
  references ref_tacc(kode);
alter table pemeriksaan add column if not exists tacc_alasan text;

-- ---------------------------------------------------------------------
-- 2f. pasien_alergi — dikaitkan ke kode
--     PCare hanya menerima satu kode per jenis. Kolom ref_alergi_id
--     itulah yang menentukan kode mana yang dikirim.
-- ---------------------------------------------------------------------
alter table pasien_alergi add column if not exists ref_alergi_id uuid
  references ref_alergi(id);

-- Jenis 'UDARA' belum ada sebelumnya padahal PCare memintanya terpisah.
-- Kolomnya text tanpa check constraint, jadi cukup dicatat di komentar.
comment on column pasien_alergi.jenis is
  'OBAT | MAKANAN | UDARA | LAINNYA. Tiga yang pertama dikirim ke PCare '
  'sebagai alergiObat, alergiMakan, dan alergiUdara.';

-- ---------------------------------------------------------------------
-- 2g. resep_item — signa terpisah untuk PCare /obat/kunjungan
--     PCare tidak menerima kalimat "3 x sehari 1 tablet". Yang diminta
--     dua angka: signa1 (berapa kali sehari) dan signa2 (berapa tiap kali).
--     Kolom frekuensi dan dosis sudah ada sejak 01_schema.sql tetapi belum
--     pernah diisi aplikasi — mulai sekarang diisi, dan itulah signa1/signa2.
-- ---------------------------------------------------------------------
comment on column resep_item.frekuensi is 'PCare /obat/kunjungan → signa1 (berapa kali sehari)';
comment on column resep_item.dosis     is 'PCare /obat/kunjungan → signa2 (berapa satuan tiap kali minum)';

alter table resep_item add column if not exists kode_pcare text;
alter table resep_item add column if not exists obat_dpho boolean not null default false;
comment on column resep_item.obat_dpho is
  'true bila obat ada di DPHO BPJS dan dikirim dengan kdObat; false berarti '
  'dikirim sebagai nmObatNonDPHO.';

alter table obat add column if not exists dpho boolean not null default false;

-- ---------------------------------------------------------------------
-- 2h. Tindakan — kode PCare
-- ---------------------------------------------------------------------
alter table icd9cm  add column if not exists kode_pcare text;
alter table icd9cm  add column if not exists kode_snomed text;
alter table tindakan add column if not exists kode_pcare text;
alter table tindakan add column if not exists hasil text;
comment on column tindakan.hasil is 'PCare /tindakan → hasil. Kosong = 0 (tanpa hasil khusus).';

-- ---------------------------------------------------------------------
-- 2i. Signa master — supaya pilihan cepat ikut mengisi frekuensi & dosis
--     Kolom frekuensi dan dosis sudah ada di tabel signa sejak awal;
--     nilainya yang belum terisi.
-- ---------------------------------------------------------------------
update signa set frekuensi = 3, dosis = 1 where kode = '3dd1' and frekuensi is null;
update signa set frekuensi = 2, dosis = 1 where kode = '2dd1' and frekuensi is null;
update signa set frekuensi = 1, dosis = 1 where kode = '1dd1' and frekuensi is null;


-- =====================================================================
--  3. PENJAGA ISI
-- =====================================================================

-- ---------------------------------------------------------------------
-- 3a. Nama menyusul kode, bukan sebaliknya.
--     Kolom teks `prognosa` dan `status_pulang` dipakai surat, resume, dan
--     cetakan rekam medis. Kalau aplikasi lupa mengisinya sementara kodenya
--     terisi, surat keluar tanpa prognosa dan tidak ada yang tahu sampai
--     ada yang membacanya. Diisi database supaya tidak bisa lupa.
-- ---------------------------------------------------------------------
create or replace function samakan_nama_kode_pemeriksaan() returns trigger
language plpgsql as $$
begin
  if new.prognosa_kode is not null then
    select nama into new.prognosa from ref_prognosa where kode = new.prognosa_kode;
  end if;
  if new.status_pulang_kode is not null then
    select nama into new.status_pulang from ref_status_pulang where kode = new.status_pulang_kode;
  end if;
  return new;
end $$;

drop trigger if exists trg_samakan_nama_kode on pemeriksaan;
create trigger trg_samakan_nama_kode before insert or update on pemeriksaan
for each row execute function samakan_nama_kode_pemeriksaan();

-- ---------------------------------------------------------------------
-- 3b. Alasan TACC wajib bila TACC dipilih.
--     BPJS menolak rujukan ber-TACC tanpa alasan. Ditolak di sini supaya
--     ketahuan saat dokter menyimpan, bukan berminggu-minggu kemudian
--     saat klaimnya dikembalikan.
-- ---------------------------------------------------------------------
create or replace function cek_tacc() returns trigger
language plpgsql as $$
declare perlu boolean;
begin
  if new.tacc_kode is null then return new; end if;
  select perlu_alasan into perlu from ref_tacc where kode = new.tacc_kode;
  if perlu and coalesce(btrim(new.tacc_alasan), '') = '' then
    raise exception 'Alasan TACC wajib diisi bila TACC dipilih (kode %).', new.tacc_kode;
  end if;
  if not perlu then new.tacc_alasan := null; end if;
  return new;
end $$;

drop trigger if exists trg_cek_tacc on pemeriksaan;
create trigger trg_cek_tacc before insert or update on pemeriksaan
for each row execute function cek_tacc();


-- =====================================================================
--  4. VIEW PAYLOAD — bentuk data persis seperti yang diminta PCare
--
--     View ini BUKAN sekadar kenyamanan. Ia adalah bukti bahwa perubahan
--     hari ini benar-benar cukup: kalau ada field PCare yang tidak bisa
--     disusun di sini, berarti masih ada kolom yang kurang, dan itu
--     ketahuan sekarang — bukan pada hari kredensial datang.
--
--     Kolom kode PCare yang belum dipetakan akan muncul sebagai NULL.
--     Itu memang keadaannya, dan v_kesiapan_kode di bawah menghitungnya.
-- =====================================================================

create or replace view v_pcare_kunjungan with (security_invoker = true) as
select
  k.id                                              as kunjungan_id,
  k.no_kunjungan,
  k.tanggal,
  k.pcare_no_kunjungan                              as "noKunjungan",
  p.no_bpjs                                         as "noKartu",
  to_char(k.tanggal, 'DD-MM-YYYY')                  as "tglDaftar",
  po.kode_pcare                                     as "kdPoli",
  coalesce(nullif(btrim(pm.keluhan_utama), ''),
           nullif(btrim(ka.keluhan_utama), ''),
           nullif(btrim(k.keluhan_singkat), ''),
           'Tidak Ada')                             as "keluhan",
  rk.kode_pcare                                     as "kdSadar",
  ka.sistolik                                       as "sistole",
  ka.diastolik                                      as "diastole",
  ka.berat_badan                                    as "beratBadan",
  ka.tinggi_badan                                   as "tinggiBadan",
  ka.nafas                                          as "respRate",
  ka.nadi                                           as "heartRate",
  ka.lingkar_perut                                  as "lingkarPerut",
  replace(ka.suhu::text, '.', ',')                  as "suhu",
  rsp.kode_pcare                                    as "kdStatusPulang",
  to_char(coalesce(k.waktu_selesai::date, k.tanggal), 'DD-MM-YYYY') as "tglPulang",
  dr.kode_dokter_pcare                              as "kdDokter",
  (select d.kode_icd10 from diagnosa d
    where d.kunjungan_id = k.id order by d.jenis, d.urutan offset 0 limit 1) as "kdDiag1",
  (select d.kode_icd10 from diagnosa d
    where d.kunjungan_id = k.id order by d.jenis, d.urutan offset 1 limit 1) as "kdDiag2",
  (select d.kode_icd10 from diagnosa d
    where d.kunjungan_id = k.id order by d.jenis, d.urutan offset 2 limit 1) as "kdDiag3",
  pin.kode_pcare                                    as "kdPoliRujukInternal",
  case when pm.rujuk_ppk_kode is null then null else
    jsonb_build_object(
      'tglEstRujuk', to_char(coalesce(pm.rujuk_tgl_estimasi, k.tanggal), 'DD-MM-YYYY'),
      'kdppk',       pm.rujuk_ppk_kode,
      'subSpesialis', jsonb_build_object(
        'kdSubSpesialis1', rsub.kode_pcare,
        'kdSarana',        rsar.kode_pcare),
      'khusus', pm.rujuk_khusus_kode)
  end                                               as "rujukLanjut",
  coalesce(rt.kode_pcare, '-1')                     as "kdTacc",
  pm.tacc_alasan                                    as "alasanTacc",
  coalesce(nullif(btrim(pm.anamnesis), ''),
           nullif(btrim(pm.subjective), ''), 'Tidak Ada')            as "anamnesa",
  coalesce(am.kode_pcare, '00')                     as "alergiMakan",
  coalesce(au.kode_pcare, '00')                     as "alergiUdara",
  coalesce(ao.kode_pcare, '00')                     as "alergiObat",
  rpg.kode_pcare                                    as "kdPrognosa",
  coalesce(nullif(btrim(pm.terapi_obat), ''), 'Tidak Ada')     as "terapiObat",
  coalesce(nullif(btrim(pm.terapi_non_obat), ''), 'Tidak Ada') as "terapiNonObat",
  coalesce(nullif(btrim(pm.bmhp), ''), 'Tidak Ada')            as "bmhp",
  -- untuk /pendaftaran
  k.kunjungan_sakit                                 as "kunjSakit",
  '10'::text                                        as "kdTkp",
  0                                                 as "rujukBalik"
from kunjungan k
join pasien p                on p.id  = k.pasien_id
join poli po                 on po.id = k.poli_id
left join kajian_awal ka     on ka.kunjungan_id = k.id
left join pemeriksaan pm     on pm.kunjungan_id = k.id
left join pegawai dr         on dr.id = k.dokter_id
left join poli pin           on pin.id = pm.rujuk_poli_internal_id
left join ref_kesadaran rk   on rk.kode  = coalesce(pm.kesadaran_kode, ka.kesadaran_kode)
left join ref_status_pulang rsp on rsp.kode = pm.status_pulang_kode
left join ref_prognosa rpg   on rpg.kode = pm.prognosa_kode
left join ref_tacc rt        on rt.kode  = pm.tacc_kode
left join ref_subspesialis rsub on rsub.kode = pm.rujuk_subspesialis_kode
left join ref_sarana rsar    on rsar.kode = pm.rujuk_sarana_kode
left join lateral (
  select ra.kode_pcare from pasien_alergi pa
    join ref_alergi ra on ra.id = pa.ref_alergi_id
   where pa.pasien_id = p.id and ra.jenis = 'MAKANAN' and ra.kode <> '00'
   order by pa.dicatat_pada desc limit 1) am on true
left join lateral (
  select ra.kode_pcare from pasien_alergi pa
    join ref_alergi ra on ra.id = pa.ref_alergi_id
   where pa.pasien_id = p.id and ra.jenis = 'UDARA' and ra.kode <> '00'
   order by pa.dicatat_pada desc limit 1) au on true
left join lateral (
  select ra.kode_pcare from pasien_alergi pa
    join ref_alergi ra on ra.id = pa.ref_alergi_id
   where pa.pasien_id = p.id and ra.jenis = 'OBAT' and ra.kode <> '00'
   order by pa.dicatat_pada desc limit 1) ao on true
where k.cara_bayar = 'BPJS';

comment on view v_pcare_kunjungan is
  'Satu baris per kunjungan BPJS, kolomnya bernama persis seperti field '
  'payload PCare /kunjungan. Kolom yang NULL berarti datanya atau pemetaan '
  'kodenya belum ada — bukan berarti field-nya tidak dibutuhkan.';

-- Obat  →  PCare POST /obat/kunjungan
create or replace view v_pcare_obat with (security_invoker = true) as
select
  r.kunjungan_id,
  k.pcare_no_kunjungan                    as "noKunjungan",
  0                                       as "kdObatSK",
  coalesce(ri.racikan_nama is not null, false) as "racikan",
  null::text                              as "kdRacikan",
  ri.obat_dpho                            as "obatDPHO",
  ri.kode_pcare                           as "kdObat",
  coalesce(ri.frekuensi, 1)               as "signa1",
  coalesce(ri.dosis, 1)                   as "signa2",
  ri.jumlah                               as "jmlObat",
  ri.jumlah                               as "jmlPermintaan",
  case when ri.obat_dpho then '-' else ri.nama_obat end as "nmObatNonDPHO"
from resep_item ri
join resep r    on r.id = ri.resep_id
join kunjungan k on k.id = r.kunjungan_id
where k.cara_bayar = 'BPJS';

-- Tindakan  →  PCare POST /tindakan
create or replace view v_pcare_tindakan with (security_invoker = true) as
select
  t.kunjungan_id,
  k.pcare_no_kunjungan       as "noKunjungan",
  0                          as "kdTindakanSK",
  coalesce(t.kode_pcare, i.kode_pcare) as "kdTindakan",
  0                          as "biaya",
  t.catatan                  as "keterangan",
  coalesce(t.hasil, '0')     as "hasil"
from tindakan t
join kunjungan k on k.id = t.kunjungan_id
left join icd9cm i on i.kode = t.kode_icd9
where k.cara_bayar = 'BPJS';


-- =====================================================================
--  5. VIEW OBSERVASI  →  SatuSehat
--     Setiap tanda vital dan setiap sistem pemeriksaan fisik menjadi satu
--     baris, siap dibungkus jadi resource Observation. Nilai numerik dan
--     teks dipisah karena FHIR memisahkannya (valueQuantity vs valueString).
-- =====================================================================

create or replace view v_satusehat_observasi with (security_invoker = true) as
-- Tanda vital: nilai angka, kode LOINC baku
select
  ka.kunjungan_id,
  'VITAL'::text        as kelompok,
  v.kode               as kode_internal,
  v.nama,
  v.kode_loinc,
  x.nilai              as nilai_angka,
  null::text           as nilai_teks,
  v.satuan,
  v.satuan_ucum,
  v.urutan
from kajian_awal ka
cross join lateral (values
  ('sistolik',      ka.sistolik::numeric),
  ('diastolik',     ka.diastolik::numeric),
  ('nadi',          ka.nadi::numeric),
  ('nafas',         ka.nafas::numeric),
  ('suhu',          ka.suhu),
  ('spo2',          ka.spo2::numeric),
  ('berat_badan',   ka.berat_badan),
  ('tinggi_badan',  ka.tinggi_badan),
  ('imt',           ka.imt),
  ('lingkar_perut', ka.lingkar_perut),
  ('skala_nyeri',   ka.skala_nyeri::numeric)
) as x(kode, nilai)
join ref_vital v on v.kode = x.kode
where x.nilai is not null

union all

-- Pemeriksaan fisik: nilai teks per sistem tubuh
select
  pm.kunjungan_id,
  'FISIK'::text,
  s.kode,
  s.nama,
  s.kode_loinc,
  null::numeric,
  case when f.value->>'status' = 'NORMAL' then s.normal_teks
       else nullif(btrim(coalesce(f.value->>'temuan', '')), '') end,
  null, null,
  s.urutan
from pemeriksaan pm
cross join lateral jsonb_each(coalesce(pm.pemeriksaan_fisik, '{}'::jsonb)) as f(key, value)
join ref_sistem_fisik s on s.kode = f.key
where f.value->>'status' in ('NORMAL','ABNORMAL');

comment on view v_satusehat_observasi is
  'Tanda vital dan temuan pemeriksaan fisik dalam bentuk satu baris per '
  'Observation SatuSehat. Baris FISIK dengan kode_loinc NULL belum bisa '
  'dikirim — kodenya menyusul dari terminologi SatuSehat.';


-- =====================================================================
--  6. VIEW KESIAPAN — apa yang masih harus diisi manusia
-- =====================================================================

-- 6a. Pemetaan kode yang belum terisi
create or replace view v_kesiapan_kode with (security_invoker = true) as
select 'ref_kesadaran'    as tabel, 'kdSadar'      as field_pcare, kode, nama from ref_kesadaran     where aktif and coalesce(kode_pcare,'') = ''
union all
select 'ref_status_pulang','kdStatusPulang', kode, nama from ref_status_pulang where aktif and coalesce(kode_pcare,'') = ''
union all
select 'ref_prognosa',     'kdPrognosa',     kode, nama from ref_prognosa      where aktif and coalesce(kode_pcare,'') = ''
union all
select 'ref_subspesialis', 'kdSubSpesialis1',kode, nama from ref_subspesialis  where aktif and coalesce(kode_pcare,'') = ''
union all
select 'ref_sarana',       'kdSarana',       kode, nama from ref_sarana        where aktif and coalesce(kode_pcare,'') = ''
union all
select 'ref_alergi',       'alergi',         kode, nama from ref_alergi        where aktif and coalesce(kode_pcare,'') = ''
union all
select 'ref_sistem_fisik', 'LOINC Observation', kode, nama from ref_sistem_fisik where aktif and coalesce(kode_loinc,'') = '';

comment on view v_kesiapan_kode is
  'Baris di sini = satu pemetaan kode yang belum diisi. Kosong berarti '
  'seluruh nilai berkode sudah siap dikirim.';

-- 6b. Kesiapan kunjungan — versi yang tahu field terstruktur baru
create or replace view v_kesiapan_kunjungan with (security_invoker = true) as
select
  k.id, k.no_kunjungan, k.tanggal, k.status, k.cara_bayar,
  k.satusehat_status, k.pcare_status,
  p.id as pasien_id, p.no_rm, p.nama as nama_pasien,
  po.nama as nama_poli, d.nama as nama_dokter,
  array_remove(array[
    case when p.nik is null or p.nik !~ '^[0-9]{16}$'
         then 'NIK pasien belum benar' end,
    case when k.dokter_id is null
         then 'Dokter pemeriksa belum ditentukan' end,
    case when k.dokter_id is not null and coalesce(d.satusehat_practitioner_id, '') = ''
         then 'Nomor IHS dokter belum diisi' end,
    case when coalesce(po.satusehat_location_id, '') = ''
         then 'Location ID poli belum diisi' end,
    case when not exists (select 1 from diagnosa dg where dg.kunjungan_id = k.id)
         then 'Belum ada diagnosa ICD-10' end,
    case when (select count(*) from diagnosa dg where dg.kunjungan_id = k.id) > 3
         then 'Lebih dari 3 diagnosa — PCare hanya menerima kdDiag1..3' end,
    case when k.cara_bayar = 'BPJS' and coalesce(d.kode_dokter_pcare, '') = ''
         then 'Kode dokter PCare belum diisi' end,
    case when k.cara_bayar = 'BPJS' and coalesce(po.kode_pcare, '') = ''
         then 'Kode poli PCare belum diisi' end,
    case when k.cara_bayar = 'BPJS' and (p.no_bpjs is null or p.no_bpjs !~ '^[0-9]{13}$')
         then 'Nomor kartu BPJS belum benar' end,
    -- Field terstruktur yang PCare minta dan tidak punya pengganti
    case when coalesce(btrim(pm.keluhan_utama), coalesce(btrim(ka.keluhan_utama), '')) = ''
         then 'Keluhan utama belum diisi' end,
    case when coalesce(pm.kesadaran_kode, ka.kesadaran_kode) is null
         then 'Tingkat kesadaran belum dicatat' end,
    case when pm.status_pulang_kode is null
         then 'Keadaan pasien saat pulang belum dipilih' end,
    case when pm.prognosa_kode is null
         then 'Prognosa belum dipilih' end,
    case when ka.sistolik is null or ka.diastolik is null
         then 'Tekanan darah belum diukur' end,
    case when ka.nadi is null or ka.nafas is null
         then 'Nadi atau frekuensi napas belum diukur' end,
    case when ka.suhu is null
         then 'Suhu belum diukur' end,
    case when ka.berat_badan is null or ka.tinggi_badan is null
         then 'Berat atau tinggi badan belum diukur' end,
    case when pm.tindak_lanjut = 'RUJUK_LANJUT' and pm.rujuk_ppk_kode is null
         then 'Faskes tujuan rujukan belum dipilih dari daftar' end,
    case when pm.tindak_lanjut = 'RUJUK_INTERNAL' and pm.rujuk_poli_internal_id is null
         then 'Poli tujuan rujukan internal belum dipilih' end
  ], null) as kekurangan
from kunjungan k
join pasien p on p.id = k.pasien_id
join poli po on po.id = k.poli_id
left join pegawai d on d.id = k.dokter_id
left join kajian_awal ka on ka.kunjungan_id = k.id
left join pemeriksaan pm on pm.kunjungan_id = k.id
where k.status = 'SELESAI';

comment on view v_kesiapan_kunjungan is
  'Kunjungan selesai beserta data yang masih kurang untuk bridging. '
  'Dipakai halaman Pengaturan → Bridging.';


-- =====================================================================
--  7. HAK AKSES
--     Tabel dan view baru TIDAK mewarisi GRANT dari yang lama. Dua kali
--     sebelumnya modul baru mati dengan "permission denied for table ..."
--     karena bagian ini terlewat — sekali untuk tabel (apotek_batch),
--     sekali untuk view. Karena itu keduanya ditulis lengkap di sini.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array['ref_prognosa','ref_tacc','ref_tkp','ref_alergi',
                           'ref_ppk','ref_subspesialis','ref_sarana',
                           'ref_sistem_fisik','ref_vital']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);

    execute format('drop policy if exists %1$s_baca on %1$s', t);
    execute format($f$create policy %1$s_baca on %1$s for select
                     to authenticated using (public.saya_staf())$f$, t);

    execute format('drop policy if exists %1$s_kelola on %1$s', t);
    execute format($f$create policy %1$s_kelola on %1$s for all to authenticated
                     using (public.boleh_master_data())
                     with check (public.boleh_master_data())$f$, t);
  end loop;
end $$;

grant select on v_pcare_kunjungan, v_pcare_obat, v_pcare_tindakan,
                v_satusehat_observasi, v_kesiapan_kode, v_kesiapan_kunjungan
  to authenticated;
-- =====================================================================
--  RME Laboratorium Medis Utama — ANTREAN ONLINE (Mobile JKN / Antrol) + LAYAR TUNGGU
--  Jalankan SETELAH 14_periksa_terstruktur.sql. Aman dijalankan di
--  database berisi data, dan aman dijalankan ulang.
--
--  ARAH PANGGILANNYA TERBALIK — INI YANG PALING PENTING DIPAHAMI
--  -------------------------------------------------------------
--  Pada PCare, klinik adalah KLIEN: kita yang memanggil server BPJS.
--  Pada Antrean FKTP, klinik adalah SERVER: aplikasi Mobile JKN milik
--  BPJS yang memanggil web service KITA, memakai username dan password
--  yang klinik serahkan ke BPJS saat UAT.
--
--  Konsekuensinya besar dan menentukan seluruh bentuk berkas ini:
--    * Harus ada alamat publik yang bisa diakses BPJS tanpa login
--      Supabase (Edge Function `antrol`, tanpa verifikasi JWT).
--    * Yang menjaga pintu itu bukan RLS, melainkan username/password
--      di tabel antrol_akun — karena BPJS tidak punya akun Supabase.
--    * Seluruh aturan (kuota, jadwal, duplikat, format nomor kartu)
--      harus hidup DI DATABASE, bukan di Deno. Alasannya bukan
--      keindahan: aturan yang ditulis di Edge Function tidak bisa diuji
--      tanpa menjalankan server, sehingga tidak akan pernah diuji.
--      Semua fungsi antrol_* di bawah diuji langsung oleh
--      test/uji_antrean.sql, persis dengan kode metadata yang akan
--      dilihat BPJS saat UAT.
--
--  BELUM BRIDGING — LALU KENAPA DIBANGUN SEKARANG?
--  ------------------------------------------------
--  Karena yang mahal bukan menyambungkannya. Yang mahal adalah nomor
--  antrean. Hari ini nomor antrean lahir dari trigger kunjungan: ia baru
--  ada ketika pasien SUDAH berdiri di loket. Antrean online lahir sehari
--  sebelumnya, dari pasien yang belum tentu datang, yang mungkin bukan
--  pasien klinik ini, dan yang boleh membatalkan. Dua hal itu tidak bisa
--  ditampung satu tabel yang sama tanpa merusak rekam medis.
--
--  Karena itu antrean dipisah dari kunjungan sekarang, selagi datanya
--  masih sedikit. Kunjungan tetap lahir saat pasien hadir — hanya saja
--  nomornya kini diwarisi dari antrean, bukan dihitung ulang.
--
--  YANG SENGAJA TIDAK DIBUAT
--  --------------------------
--  Tidak ada satu pun kredensial BPJS di berkas ini. Username dan
--  password yang dipakai BPJS memanggil kita dibuat oleh admin lewat
--  halaman Pengaturan dan disimpan sebagai hash — tidak pernah bisa
--  dibaca kembali oleh peramban, bahkan oleh admin.
-- =====================================================================


-- =====================================================================
--  1. TIPE DATA
-- =====================================================================

-- Dari mana nomor antrean itu lahir.
--
-- 'ANJUNGAN' sengaja dimasukkan sekarang meskipun mesin anjungan mandiri
-- belum dibuat. Menambah nilai enum di kemudian hari memaksa satu migrasi
-- yang harus dijalankan sendirian di luar transaksi — pelajaran dari
-- sql/07_peran_kasir.sql. Nilai yang belum terpakai tidak memakan apa pun.
do $$ begin
  create type antrean_sumber_t as enum ('LOKET','ONLINE','ANJUNGAN');
exception when duplicate_object then null; end $$;

-- Pasien sedang menunggu dipanggil ke mana.
do $$ begin
  create type antrean_tahap_t as enum ('LOKET','POLI','SELESAI');
exception when duplicate_object then null; end $$;

-- Keadaan satu nomor antrean.
--   BELUM_HADIR  dipesan lewat Mobile JKN, pasiennya belum datang
--   MENUNGGU     sudah hadir (atau daftar di loket), menunggu dipanggil
--   DIPANGGIL    namanya sedang disebut layar
--   DILAYANI     sedang di loket / di ruang periksa
--   SELESAI      pelayanan tuntas
--   TIDAK_HADIR  dipanggil berkali-kali tetapi tidak muncul
--   BATAL        dibatalkan pasien lewat Mobile JKN, atau oleh petugas
do $$ begin
  create type antrean_status_t as enum
    ('BELUM_HADIR','MENUNGGU','DIPANGGIL','DILAYANI','SELESAI','TIDAK_HADIR','BATAL');
exception when duplicate_object then null; end $$;


-- =====================================================================
--  2. JAM KLINIK
--  tgl_klinik() sudah ada sejak modul apotek. Jadwal buka-tutup poli
--  butuh pasangannya: jam menurut WITA, bukan jam UTC milik server.
--  Tanpa ini, "poli tutup pukul 12.00" akan dievaluasi pukul 04.00 WITA
--  dan Mobile JKN menolak pendaftaran sepanjang pagi.
-- =====================================================================

create or replace function public.jam_klinik() returns time
language sql stable as $$ select (now() at time zone 'Asia/Makassar')::time $$;

comment on function public.jam_klinik() is
  'Jam sekarang menurut WITA (Asia/Makassar). Pasangan tgl_klinik().';

grant execute on function public.jam_klinik() to authenticated, anon, service_role;


-- =====================================================================
--  3. TAMBAHAN PADA TABEL YANG SUDAH ADA
-- =====================================================================

-- Awalan huruf nomor antrean per poli: A-012, B-004, ...
-- Huruf inilah yang membedakan antrean umum dan gigi di layar tunggu.
alter table poli add column if not exists prefix_antrean text;

update poli set prefix_antrean = upper(left(kode, 1))
 where prefix_antrean is null;

alter table poli alter column prefix_antrean set default 'A';
alter table poli alter column prefix_antrean set not null;

-- Kunjungan mewarisi nomornya dari antrean, bukan menghitung sendiri.
-- Kunci asingnya dipasang setelah tabel antrean dibuat (bagian 5).
alter table kunjungan add column if not exists antrean_id uuid;


-- =====================================================================
--  4. JADWAL & KUOTA
--  Spesifikasi BPJS: "Pengambilan antrean hanya bisa dilakukan
--  berdasarkan jadwal operasional FKTP." Tanpa tabel ini, Mobile JKN
--  akan menerima pendaftaran untuk hari Minggu.
-- =====================================================================

create table if not exists poli_jadwal (
  id            uuid primary key default uuid_generate_v4(),
  poli_id       uuid not null references poli(id) on delete cascade,
  hari          smallint not null check (hari between 0 and 6),  -- 0 = Minggu
  sesi          smallint not null default 1 check (sesi between 1 and 3),
  jam_buka      time not null default '08:00',
  jam_tutup     time not null default '12:00',
  -- Batas jam terakhir Mobile JKN boleh menerbitkan nomor untuk HARI INI.
  -- Dibuat terpisah supaya klinik bisa menutup pendaftaran online lebih
  -- awal daripada pintunya sendiri — pasien yang baru memesan pukul 11.55
  -- untuk poli yang tutup 12.00 hampir pasti tidak terlayani, dan nomor
  -- yang terbit lalu hangus lebih merepotkan daripada nomor yang ditolak.
  jam_tutup_online time,
  kuota         integer not null default 40 check (kuota >= 0),
  kuota_online  integer not null default 20 check (kuota_online >= 0),
  aktif         boolean not null default true,
  updated_at    timestamptz not null default now(),
  unique (poli_id, hari, sesi)
);
comment on table poli_jadwal is
  'Jam buka dan kuota per poli per hari dalam seminggu. Dipakai Antrol
   untuk menolak pemesanan di hari/jam poli tutup.';

create table if not exists poli_libur (
  id          uuid primary key default uuid_generate_v4(),
  tanggal     date not null,
  poli_id     uuid references poli(id) on delete cascade,  -- null = semua poli
  keterangan  text,
  dibuat_pada timestamptz not null default now(),
  dibuat_oleh uuid references pegawai(id)
);

-- unique nulls not distinct baru ada di PG15. Indeks berikut memberi
-- hasil sama dan tetap sah di PostgreSQL mana pun.
create unique index if not exists uq_poli_libur
  on poli_libur (tanggal, coalesce(poli_id, '00000000-0000-0000-0000-000000000000'::uuid));


-- =====================================================================
--  5. ANTREAN
-- =====================================================================

create table if not exists antrean (
  id            uuid primary key default uuid_generate_v4(),
  tanggal       date not null default public.tgl_klinik(),
  poli_id       uuid not null references poli(id),
  no_urut       integer not null,
  -- Tanpa DEFAULT dengan sengaja. Kalau kolom ini punya nilai bawaan,
  -- trigger tidak bisa lagi membedakan "pemanggil memang mau huruf A"
  -- dari "pemanggil tidak menyebut apa-apa" — dan seluruh antrean poli
  -- gigi akan terbit berhuruf A. Trigger BEFORE INSERT berjalan sebelum
  -- pemeriksaan NOT NULL, jadi kolom ini tetap boleh wajib isi.
  prefix        text not null,

  -- Nomor yang dilihat manusia. Dihitung database supaya nomor di layar
  -- tunggu, di struk antrean, dan di Mobile JKN tidak mungkin berbeda.
  --
  -- greatest(3, length(...)) bukan hiasan: lpad('1234', 3, '0') di
  -- PostgreSQL memulangkan '123' — MEMOTONG, tidak seperti padStart di
  -- JavaScript. Bug persis ini pernah lolos di penomoran surat dan baru
  -- ketahuan pada surat ke-100.
  nomor         text generated always as
                (prefix || '-' || lpad(no_urut::text, greatest(3, length(no_urut::text)), '0')) stored,

  kode_booking  text not null,
  sumber        antrean_sumber_t not null default 'LOKET',

  -- Identitas. pasien_id kosong untuk pemesanan online dari orang yang
  -- belum pernah berobat di sini; nomor kartu dan NIK-nya tetap disimpan
  -- supaya petugas bisa mencocokkannya saat pasien datang.
  pasien_id     uuid references pasien(id),
  no_kartu      text,
  nik           text,
  nama_snapshot text,

  tahap         antrean_tahap_t   not null default 'LOKET',
  status        antrean_status_t  not null default 'MENUNGGU',
  kunjungan_id  uuid references kunjungan(id) on delete set null,

  -- Jejak waktu: dipakai laporan waktu tunggu dan estimasi di layar
  waktu_ambil        timestamptz not null default now(),
  waktu_hadir        timestamptz,
  waktu_panggil      timestamptz,      -- panggilan terakhir, tahap mana pun
  waktu_mulai_layan  timestamptz,
  waktu_selesai      timestamptz,

  jumlah_panggil smallint not null default 0,
  tujuan_terakhir text,                -- 'Loket 1' / 'Poli Umum'
  alasan_batal   text,
  catatan        text,

  dibuat_oleh   uuid references pegawai(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint antrean_urut_positif check (no_urut > 0)
);

-- Bila berkas ini pernah dijalankan versi sebelumnya yang masih memasang
-- nilai bawaan, lepaskan sekarang.
alter table antrean alter column prefix drop default;

create unique index if not exists uq_antrean_nomor
  on antrean (tanggal, poli_id, no_urut);
create unique index if not exists uq_antrean_booking
  on antrean (kode_booking);
create index if not exists idx_antrean_tanggal on antrean (tanggal, poli_id, no_urut);
create index if not exists idx_antrean_status  on antrean (tanggal, status)
  where status in ('BELUM_HADIR','MENUNGGU','DIPANGGIL','DILAYANI');
create index if not exists idx_antrean_kartu   on antrean (no_kartu, tanggal);
create index if not exists idx_antrean_pasien  on antrean (pasien_id, tanggal desc);

-- Satu peserta, satu nomor online, per poli, per hari.
--
-- Perhatikan `sumber = 'ONLINE'`. Aturan BPJS berlaku untuk pemesanan
-- lewat Mobile JKN; ia TIDAK boleh menghalangi loket. Petugas yang
-- sedang berhadapan dengan pasien harus selalu bisa mendaftarkannya —
-- sistem yang menolak akan disiasati dengan mengosongkan nomor BPJS,
-- dan yang rusak kemudian adalah data klaim, bukan antreannya.
--
-- Pemeriksaan "sudah punya nomor dari mana pun" tetap dilakukan, tetapi
-- di dalam fungsi antrol_ambil() yang hanya dipakai jalur online.
create unique index if not exists uq_antrean_online_peserta
  on antrean (tanggal, poli_id, no_kartu)
  where sumber = 'ONLINE' and no_kartu is not null
        and status not in ('BATAL','TIDAK_HADIR');

comment on table antrean is
  'Satu baris = satu nomor antrean. Lahir di loket atau dari Mobile JKN.
   Kunjungan (encounter) baru dibuat saat pasien benar-benar hadir.';

-- Tautan balik dari kunjungan. Dipasang di sini karena kedua tabel saling
-- menunjuk: antrean.kunjungan_id sudah bisa dibuat bersama tabelnya
-- (kunjungan sudah ada sejak 01_schema.sql), tetapi arah sebaliknya
-- harus menunggu antrean lahir.
do $$ begin
  alter table kunjungan add constraint kunjungan_antrean_fk
    foreign key (antrean_id) references antrean(id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists idx_kunjungan_antrean on kunjungan (antrean_id);


-- Riwayat panggilan. Bukan sekadar catatan: inilah yang dibaca layar
-- tunggu untuk tahu nomor mana yang sedang disebut, dan id-nya yang
-- dipakai layar membedakan panggilan baru dari panggilan yang sudah
-- terlanjur dibunyikan. Tanpa tabel ini, layar akan mengulang bunyi
-- setiap kali menyegarkan data.
create table if not exists antrean_panggilan (
  id          bigserial primary key,
  antrean_id  uuid not null references antrean(id) on delete cascade,
  tanggal     date not null default public.tgl_klinik(),
  tahap       antrean_tahap_t not null,
  tujuan      text,
  urutan      smallint not null default 1,     -- panggilan ke berapa
  waktu       timestamptz not null default now(),
  oleh        uuid references pegawai(id)
);
create index if not exists idx_panggilan_tanggal on antrean_panggilan (tanggal, id desc);
create index if not exists idx_panggilan_antrean on antrean_panggilan (antrean_id, id desc);


-- =====================================================================
--  6. PENGATURAN ANTREAN & LAYAR
--  Satu baris jsonb, pola yang sama dengan sys_surat_pengaturan.
-- =====================================================================

create table if not exists sys_antrean_pengaturan (
  id           smallint primary key default 1 check (id = 1),
  konfigurasi  jsonb not null default '{}'::jsonb,
  -- Token layar disimpan di kolom sendiri, bukan di dalam jsonb, supaya
  -- bisa dicabut hak bacanya secara terpisah. Peramban staf tidak perlu
  -- membacanya untuk apa pun kecuali menyalin tautannya sekali.
  token_layar  text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references pegawai(id)
);

insert into sys_antrean_pengaturan (id, konfigurasi) values (1, '{}'::jsonb)
on conflict (id) do nothing;

comment on column sys_antrean_pengaturan.konfigurasi is
  'judul_layar, teks_berjalan, keterangan_antrol (kalimat yang dikirim ke
   Mobile JKN), suara_aktif, ulang_panggil_detik, tampilkan_estimasi,
   menit_per_pasien.';


-- =====================================================================
--  7. AKUN WEB SERVICE ANTROL
--  Kredensial yang dipakai BPJS untuk memanggil KITA. Password tidak
--  pernah disimpan apa adanya dan tidak pernah bisa dibaca kembali —
--  admin hanya bisa membuat yang baru.
-- =====================================================================

create table if not exists antrol_akun (
  username         text primary key,
  sandi_hash       text not null,
  salt             text not null,
  keterangan       text,
  aktif            boolean not null default true,
  dibuat_pada      timestamptz not null default now(),
  dibuat_oleh      uuid references pegawai(id),
  terakhir_dipakai timestamptz,
  jumlah_dipakai   bigint not null default 0
);

-- Peramban tidak boleh menyentuh tabel ini sama sekali. Admin mengelola
-- akun lewat fungsi antrol_akun_simpan() / antrol_akun_hapus() dan
-- melihat daftarnya lewat view v_antrol_akun yang tidak memuat hash.
revoke all on antrol_akun from authenticated, anon;

create table if not exists antrol_log (
  id           bigserial primary key,
  waktu        timestamptz not null default now(),
  jalur        text not null,          -- 'antrean/status/001/2026-09-05'
  metode       text not null,
  username     text,
  request      jsonb,
  response     jsonb,
  http_status  integer,
  sukses       boolean not null default false,
  ip           text
);
create index if not exists idx_antrol_log_waktu on antrol_log (waktu desc);

comment on table antrol_log is
  'Setiap permintaan masuk dari Mobile JKN. Dipakai saat UAT bersama BPJS
   untuk membuktikan apa yang kita jawab, dan mencari sebab bila ditolak.';


-- =====================================================================
--  8. PENOMORAN ANTREAN
-- =====================================================================

-- Nomor urut berikutnya untuk satu poli pada satu tanggal.
--
-- pg_advisory_xact_lock membuat dua permintaan Mobile JKN yang datang
-- pada detik yang sama mengantre, bukan sama-sama membaca max()+1 lalu
-- menghasilkan nomor kembar. Indeks unik di atas adalah jaring terakhir;
-- kunci ini yang membuat jaring itu hampir tidak pernah terpakai.
create or replace function public.antrean_urut_berikut(p_poli uuid, p_tanggal date)
returns integer
language plpgsql as $$
declare v_urut integer;
begin
  perform pg_advisory_xact_lock(hashtext('antrean:' || p_tanggal::text || ':' || p_poli::text));
  select coalesce(max(no_urut), 0) + 1 into v_urut
    from antrean where tanggal = p_tanggal and poli_id = p_poli;
  return v_urut;
end $$;

-- Kode booking: ANT-YYYYMMDD-XXXXXX. Tidak dipakai BPJS pada spesifikasi
-- FKTP (itu milik FKRTL), tapi dibuat tetap karena gratis dan menjadi
-- satu-satunya cara mencari kembali satu nomor antrean tanpa menyebut
-- nama pasien — misalnya dari struk yang dibawa pasien.
create or replace function public.antrean_kode_booking(p_tanggal date)
returns text
language plpgsql as $$
declare v_kode text; v_coba int := 0;
begin
  loop
    v_kode := 'ANT-' || to_char(p_tanggal, 'YYYYMMDD') || '-' ||
              upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from antrean where kode_booking = v_kode);
    v_coba := v_coba + 1;
    if v_coba > 20 then
      raise exception 'Gagal membuat kode booking yang unik.';
    end if;
  end loop;
  return v_kode;
end $$;

create or replace function public.antrean_sebelum_simpan() returns trigger
language plpgsql as $$
begin
  if new.tanggal is null then new.tanggal := public.tgl_klinik(); end if;

  if new.prefix is null or new.prefix = '' then
    select coalesce(prefix_antrean, 'A') into new.prefix from poli where id = new.poli_id;
    new.prefix := coalesce(new.prefix, 'A');
  end if;

  if new.no_urut is null then
    new.no_urut := public.antrean_urut_berikut(new.poli_id, new.tanggal);
  end if;

  if new.kode_booking is null or new.kode_booking = '' then
    new.kode_booking := public.antrean_kode_booking(new.tanggal);
  end if;

  return new;
end $$;

drop trigger if exists trg_antrean_sebelum on antrean;
create trigger trg_antrean_sebelum before insert on antrean
for each row execute function public.antrean_sebelum_simpan();

drop trigger if exists trg_updated_antrean on antrean;
create trigger trg_updated_antrean before update on antrean
for each row execute function public.set_updated_at();

drop trigger if exists trg_updated_poli_jadwal on poli_jadwal;
create trigger trg_updated_poli_jadwal before update on poli_jadwal
for each row execute function public.set_updated_at();


-- =====================================================================
--  9. JADWAL: apakah poli buka?
-- =====================================================================

-- Memulangkan satu baris jadwal yang berlaku, atau tidak sama sekali.
-- Dipakai jalur online (menolak) dan halaman antrean (memberi tahu).
create or replace function public.poli_jadwal_berlaku(p_poli uuid, p_tanggal date)
returns table (
  jam_buka time, jam_tutup time, jam_tutup_online time,
  kuota integer, kuota_online integer
)
language sql stable as $$
  select min(j.jam_buka),
         max(j.jam_tutup),
         max(coalesce(j.jam_tutup_online, j.jam_tutup)),
         sum(j.kuota)::integer,
         sum(j.kuota_online)::integer
    from poli_jadwal j
   where j.poli_id = p_poli
     and j.aktif
     and j.hari = extract(dow from p_tanggal)::smallint
     and not exists (
       select 1 from poli_libur l
        where l.tanggal = p_tanggal
          and (l.poli_id is null or l.poli_id = p_poli))
  having count(*) > 0
$$;

comment on function public.poli_jadwal_berlaku(uuid, date) is
  'Gabungan seluruh sesi poli pada hari itu: jam buka paling awal, jam
   tutup paling akhir, dan jumlah kuota. Kosong bila poli libur atau
   tidak punya jadwal hari itu.';

-- Berapa nomor yang sudah terpakai. Nomor yang dibatalkan dan yang tidak
-- hadir dikembalikan ke kuota — kursinya memang kosong.
create or replace function public.antrean_terpakai(p_poli uuid, p_tanggal date, p_online boolean default false)
returns integer
language sql stable as $$
  select count(*)::integer from antrean a
   where a.tanggal = p_tanggal and a.poli_id = p_poli
     and a.status not in ('BATAL','TIDAK_HADIR')
     and (not p_online or a.sumber = 'ONLINE')
$$;


-- =====================================================================
--  10. TINDAKAN PETUGAS
--  Semua SECURITY INVOKER: RLS di bawah yang memutuskan siapa boleh apa.
-- =====================================================================

-- Panggil satu nomor. Menaikkan hitungan panggilan dan mencatat riwayat.
create or replace function public.antrean_panggil(
  p_antrean uuid,
  p_tujuan  text default null
) returns antrean
language plpgsql as $$
declare a antrean; v_tujuan text; v_urut smallint;
begin
  select * into a from antrean where id = p_antrean for update;
  if not found then raise exception 'Nomor antrean tidak ditemukan.'; end if;

  if a.status in ('SELESAI','BATAL') then
    raise exception 'Nomor % sudah % dan tidak bisa dipanggil lagi.',
      a.nomor, lower(a.status::text);
  end if;

  -- Tujuan bawaan mengikuti tahap: loket untuk verifikasi berkas,
  -- nama poli untuk pemeriksaan.
  v_tujuan := coalesce(
    nullif(trim(coalesce(p_tujuan, '')), ''),
    case when a.tahap = 'LOKET' then 'Loket Pendaftaran'
         else (select nama from poli where id = a.poli_id) end);

  v_urut := a.jumlah_panggil + 1;

  update antrean set
      status          = 'DIPANGGIL',
      jumlah_panggil  = v_urut,
      waktu_panggil   = now(),
      tujuan_terakhir = v_tujuan,
      -- Pasien yang dipanggil jelas sudah hadir. Menandainya di sini
      -- menyelamatkan pemesanan online yang petugasnya lupa check-in.
      waktu_hadir     = coalesce(a.waktu_hadir, now())
    where id = p_antrean
    returning * into a;

  insert into antrean_panggilan (antrean_id, tanggal, tahap, tujuan, urutan, oleh)
  values (p_antrean, a.tanggal, a.tahap, v_tujuan, v_urut, auth.uid());

  return a;
end $$;

-- Pasien datang ke loket. Membuat kunjungan dan menautkannya.
--
-- Digabung dalam satu fungsi supaya tidak mungkin ada antrean yang
-- berstatus "sudah dilayani" tanpa kunjungan, atau kunjungan tanpa nomor
-- antrean — dua keadaan yang sama-sama membuat rekap harian tidak cocok.
create or replace function public.antrean_checkin(
  p_antrean    uuid,
  p_pasien     uuid,
  p_dokter     uuid default null,
  p_cara_bayar cara_bayar_t default 'BPJS',
  p_keluhan    text default null
) returns kunjungan
language plpgsql as $$
declare a antrean; k kunjungan;
begin
  select * into a from antrean where id = p_antrean for update;
  if not found then raise exception 'Nomor antrean tidak ditemukan.'; end if;
  if a.status = 'BATAL' then
    raise exception 'Nomor % sudah dibatalkan.', a.nomor;
  end if;
  if a.kunjungan_id is not null then
    select * into k from kunjungan where id = a.kunjungan_id;
    return k;                              -- sudah pernah check-in
  end if;
  if p_pasien is null then
    raise exception 'Pilih dulu data pasiennya sebelum check-in.';
  end if;

  insert into kunjungan (pasien_id, tanggal, poli_id, dokter_id, cara_bayar,
                         no_antrian, keluhan_singkat, antrean_id, created_by)
  values (p_pasien, a.tanggal, a.poli_id, p_dokter, p_cara_bayar,
          a.no_urut, p_keluhan, a.id, auth.uid())
  returning * into k;

  update antrean set
      pasien_id    = p_pasien,
      kunjungan_id = k.id,
      tahap        = 'POLI',
      status       = 'MENUNGGU',
      waktu_hadir  = coalesce(a.waktu_hadir, now())
    where id = p_antrean;

  return k;
end $$;

-- Pasien masuk ruang periksa / mulai dilayani di loket.
create or replace function public.antrean_mulai_layan(p_antrean uuid)
returns antrean
language plpgsql as $$
declare a antrean;
begin
  update antrean set
      status            = 'DILAYANI',
      waktu_mulai_layan = coalesce(waktu_mulai_layan, now()),
      waktu_hadir       = coalesce(waktu_hadir, now())
    where id = p_antrean and status not in ('SELESAI','BATAL')
    returning * into a;
  if not found then raise exception 'Nomor antrean tidak bisa dilayani.'; end if;
  return a;
end $$;

-- Dipanggil berkali-kali, tidak muncul. Nomornya dilewati, kuotanya
-- kembali, dan pasien masih boleh mengambil nomor baru — persis kalimat
-- yang dikirim ke Mobile JKN.
create or replace function public.antrean_lewat(p_antrean uuid, p_alasan text default null)
returns antrean
language plpgsql as $$
declare a antrean;
begin
  update antrean set
      status       = 'TIDAK_HADIR',
      alasan_batal = coalesce(nullif(trim(coalesce(p_alasan,'')),''), 'Tidak hadir saat dipanggil'),
      waktu_selesai= now()
    where id = p_antrean and status not in ('SELESAI','BATAL')
    returning * into a;
  if not found then raise exception 'Nomor antrean tidak bisa dilewati.'; end if;
  return a;
end $$;

create or replace function public.antrean_batal(p_antrean uuid, p_alasan text default null)
returns antrean
language plpgsql as $$
declare a antrean;
begin
  select * into a from antrean where id = p_antrean for update;
  if not found then raise exception 'Nomor antrean tidak ditemukan.'; end if;
  if a.kunjungan_id is not null then
    raise exception 'Nomor % sudah menjadi kunjungan. Batalkan kunjungannya lebih dulu.', a.nomor;
  end if;

  update antrean set
      status       = 'BATAL',
      alasan_batal = nullif(trim(coalesce(p_alasan,'')),''),
      waktu_selesai= now()
    where id = p_antrean
    returning * into a;
  return a;
end $$;

-- Kunjungan selesai → antreannya ikut selesai.
-- Tanpa ini, layar tunggu akan terus menghitung pasien yang sudah pulang
-- sebagai "sisa antrean", dan angka yang dilihat pasien tidak pernah turun.
create or replace function public.antrean_ikut_kunjungan() returns trigger
language plpgsql as $$
begin
  if new.antrean_id is null then return new; end if;

  if new.status = 'SELESAI' then
    update antrean set status = 'SELESAI', tahap = 'SELESAI',
           waktu_selesai = coalesce(waktu_selesai, now())
     where id = new.antrean_id and status <> 'BATAL';
  elsif new.status = 'BATAL' then
    update antrean set status = 'BATAL', waktu_selesai = coalesce(waktu_selesai, now())
     where id = new.antrean_id;
  elsif new.status = 'PEMERIKSAAN' then
    update antrean set status = 'DILAYANI',
           waktu_mulai_layan = coalesce(waktu_mulai_layan, now())
     where id = new.antrean_id and status not in ('SELESAI','BATAL');
  end if;
  return new;
end $$;

drop trigger if exists trg_antrean_ikut_kunjungan on kunjungan;
create trigger trg_antrean_ikut_kunjungan after update of status on kunjungan
for each row execute function public.antrean_ikut_kunjungan();

-- Kunjungan yang dibuat langsung dari halaman Pendaftaran (tanpa lewat
-- antrean online) tetap harus punya nomor antrean, kalau tidak ia tidak
-- akan pernah muncul di layar tunggu.
--
-- Ditulis BEFORE INSERT, bukan AFTER. Perbedaannya bukan gaya:
-- trigger AFTER ROW di PostgreSQL DIANTRIKAN sampai seluruh statement
-- selesai. Pada `insert into kunjungan values (...), (...)` — dua baris
-- satu perintah, persis yang dilakukan berkas uji dan impor — kedua
-- baris menghitung nomor antrean SEBELUM satu pun antrean tertulis,
-- lalu sama-sama meminta nomor yang sama dan pendaftaran gagal dengan
-- unique_violation mentah.
--
-- BEFORE INSERT menulis antreannya saat itu juga, jadi baris kedua
-- sudah melihat nomor baris pertama. Tautan baliknya (antrean →
-- kunjungan) menyusul di trigger AFTER, karena kunjungannya memang
-- belum punya id yang sah untuk ditunjuk kunci asing.
create or replace function public.kunjungan_siapkan_antrean() returns trigger
language plpgsql as $$
declare a antrean;
begin
  if new.antrean_id is not null then
    if new.no_antrian is null then
      select no_urut into new.no_antrian from antrean where id = new.antrean_id;
    end if;
    return new;
  end if;

  insert into antrean (tanggal, poli_id, pasien_id, sumber, tahap, status,
                       waktu_hadir, no_kartu, nik, nama_snapshot, dibuat_oleh)
  select coalesce(new.tanggal, public.tgl_klinik()), new.poli_id, new.pasien_id,
         'LOKET', 'POLI', 'MENUNGGU', now(), p.no_bpjs, p.nik, p.nama, new.created_by
    from pasien p where p.id = new.pasien_id
  returning * into a;

  if a.id is null then
    raise exception 'Pasien kunjungan tidak ditemukan; nomor antrean tidak bisa diterbitkan.';
  end if;

  new.antrean_id := a.id;
  new.no_antrian := a.no_urut;
  return new;
end $$;

drop trigger if exists trg_kunjungan_buat_antrean on kunjungan;
drop trigger if exists trg_kunjungan_antrean on kunjungan;
create trigger trg_kunjungan_antrean before insert on kunjungan
for each row execute function public.kunjungan_siapkan_antrean();

create or replace function public.kunjungan_tautkan_antrean() returns trigger
language plpgsql as $$
begin
  update antrean set kunjungan_id = new.id
   where id = new.antrean_id and kunjungan_id is distinct from new.id;
  return new;
end $$;

drop trigger if exists trg_kunjungan_taut_antrean on kunjungan;
create trigger trg_kunjungan_taut_antrean after insert on kunjungan
for each row when (new.antrean_id is not null)
execute function public.kunjungan_tautkan_antrean();


-- ---------------------------------------------------------------------
-- PERBAIKAN gen_no_kunjungan() — dua bug, keduanya baru bisa terjadi
-- setelah antrean online ada.
--
-- (1) NOMOR ANTRIAN BERTABRAKAN.
--     Versi lama menghitung no_antrian dari tabel KUNJUNGAN:
--       max(no_antrian) + 1 where tanggal = ... and poli_id = ...
--     Selama semua pasien mendaftar di loket, itu benar. Begitu ada
--     pemesanan online, tidak lagi: lima pesanan Mobile JKN untuk hari
--     ini sudah memegang nomor 1–5, tetapi belum satu pun punya
--     kunjungan. Pasien pertama yang datang langsung ke loket akan
--     diberi nomor 1 — nomor yang sudah dipegang orang lain — dan
--     pendaftarannya gagal dengan galat unique_violation mentah di
--     tengah jam sibuk.
--
--     Sekarang no_antrian tidak lagi dihitung di sini sama sekali:
--     pemiliknya tabel antrean, yang memegang kunci serialisasinya.
--
-- (2) SATU NOMOR CACAT MEMATIKAN SELURUH PENDAFTARAN HARI ITU.
--     substring(no_kunjungan from 10)::int mengandaikan SETIAP baris
--     hari itu bernomor YYYYMMDD-NNNN. Satu baris bernomor lain — hasil
--     impor, perbaikan manual lewat dasbor, atau penggabungan dengan
--     portal sipantau nanti — membuat seluruh pendaftaran hari itu
--     gagal dengan "invalid input syntax for type integer". Baris yang
--     tidak berbentuk sekarang dilewati, bukan meruntuhkan loket.
-- ---------------------------------------------------------------------
create or replace function public.gen_no_kunjungan() returns trigger
language plpgsql as $$
declare urut integer;
begin
  if new.tanggal is null then new.tanggal := current_date; end if;

  if new.no_kunjungan is null or new.no_kunjungan = '' then
    select coalesce(max(substring(no_kunjungan from 10)::int), 0) + 1
      into urut from kunjungan
     where tanggal = new.tanggal
       and no_kunjungan ~ '^[0-9]{8}-[0-9]+$';
    new.no_kunjungan := to_char(new.tanggal,'YYYYMMDD') || '-' || lpad(urut::text, 4, '0');
  end if;

  -- no_antrian SENGAJA tidak dihitung di sini lagi. Pemiliknya sekarang
  -- tabel antrean, lewat trg_kunjungan_antrean di atas — supaya nomor
  -- loket dan nomor Mobile JKN lahir dari satu deret yang sama.

  if exists (select 1 from kunjungan k where k.pasien_id = new.pasien_id) then
    new.jenis_kunjungan := 'LAMA';
  else
    new.jenis_kunjungan := 'BARU';
  end if;

  return new;
end $$;


-- =====================================================================
--  11. VIEW UNTUK PETUGAS
-- =====================================================================

create or replace view v_antrean_hari_ini with (security_invoker = true) as
select a.id, a.tanggal, a.nomor, a.no_urut, a.prefix, a.kode_booking,
       a.sumber, a.tahap, a.status, a.jumlah_panggil, a.tujuan_terakhir,
       a.waktu_ambil, a.waktu_hadir, a.waktu_panggil, a.waktu_mulai_layan,
       a.waktu_selesai, a.alasan_batal, a.catatan,
       a.poli_id, po.nama as nama_poli, po.kode as kode_poli, po.jenis as jenis_poli,
       a.pasien_id, a.kunjungan_id,
       coalesce(p.nama, a.nama_snapshot)            as nama_pasien,
       p.no_rm, p.tanggal_lahir, p.jenis_kelamin,
       coalesce(p.no_bpjs, a.no_kartu)              as no_kartu,
       coalesce(p.nik, a.nik)                       as nik,
       k.cara_bayar, k.status as status_kunjungan, k.dokter_id,
       d.nama as nama_dokter,
       (k.id is not null)                           as sudah_checkin,
       -- Berapa lama sudah menunggu, dalam menit. Dipakai halaman antrean
       -- untuk menyorot pasien yang tertinggal.
       (extract(epoch from (now() - coalesce(a.waktu_hadir, a.waktu_ambil))) / 60)::integer
                                                    as menit_menunggu
  from antrean a
  join poli po on po.id = a.poli_id
  left join pasien p    on p.id = a.pasien_id
  left join kunjungan k on k.id = a.kunjungan_id
  left join pegawai d   on d.id = k.dokter_id
 where a.tanggal = public.tgl_klinik()
 order by po.urutan, a.no_urut;

-- Kuota hari ini per poli. Satu baris per poli aktif, juga untuk poli
-- yang belum punya satu pun antrean — kalau tidak, poli yang sepi hilang
-- dari layar dan petugas mengira sistemnya rusak.
create or replace view v_antrean_kuota with (security_invoker = true) as
select po.id                                  as poli_id,
       po.nama                                as nama_poli,
       po.kode                                as kode_poli,
       po.kode_pcare,
       po.prefix_antrean,
       po.urutan,
       t.tanggal,
       (j.jam_buka is not null)               as buka,
       j.jam_buka, j.jam_tutup, j.jam_tutup_online,
       coalesce(j.kuota, 0)                   as kuota,
       coalesce(j.kuota_online, 0)            as kuota_online,
       public.antrean_terpakai(po.id, t.tanggal, false) as terpakai,
       public.antrean_terpakai(po.id, t.tanggal, true)  as terpakai_online,
       greatest(coalesce(j.kuota, 0) - public.antrean_terpakai(po.id, t.tanggal, false), 0)
                                              as sisa_kuota,
       greatest(coalesce(j.kuota_online, 0) - public.antrean_terpakai(po.id, t.tanggal, true), 0)
                                              as sisa_kuota_online
  from poli po
 cross join lateral (select public.tgl_klinik() as tanggal) t
  left join lateral public.poli_jadwal_berlaku(po.id, t.tanggal) j on true
 where po.aktif
 order by po.urutan;

create or replace view v_antrol_akun with (security_invoker = true) as
select username, keterangan, aktif, dibuat_pada, terakhir_dipakai, jumlah_dipakai
  from antrol_akun;

comment on view v_antrol_akun is
  'Daftar akun web service Antrol TANPA hash sandinya. Sandi tidak pernah
   bisa dibaca kembali — kalau lupa, buat yang baru.';


-- =====================================================================
--  12. AKUN ANTROL — dikelola lewat fungsi, bukan tabel
-- =====================================================================

-- 9 Sep 2026: pintasan hak akses modul antrean, lewat tabel hak_akses
-- (bisa diatur master) — lihat sql/02_rls.sql bagian HAK AKSES. Tidak ada
-- isian awal untuk kode ini: perilakunya sama seperti sebelumnya (hanya
-- admin lama / master sekarang), sampai master membukanya untuk peran lain.
create or replace function public.boleh_antrean_pengaturan() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('antrean_pengaturan') $$;

create or replace function public.boleh_antrean_buat() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('antrean_buat') $$;

create or replace function public.boleh_antrean_hapus() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('antrean_hapus') $$;

grant execute on function
  public.boleh_antrean_pengaturan(), public.boleh_antrean_buat(), public.boleh_antrean_hapus()
  to authenticated;

insert into public.hak_akses (kode, peran, diizinkan) values
  ('antrean_buat', 'admin',   true),
  ('antrean_buat', 'perawat', true),
  ('antrean_buat', 'dokter',  true)
on conflict (kode, peran) do nothing;

create or replace function public.antrol_akun_simpan(
  p_username text, p_sandi text, p_keterangan text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare v_salt text; v_user text;
begin
  if not public.boleh_antrean_pengaturan() then
    raise exception 'Anda tidak punya izin mengatur akun Antrol.';
  end if;

  v_user := lower(trim(coalesce(p_username, '')));
  if v_user = '' then raise exception 'Username tidak boleh kosong.'; end if;
  if length(coalesce(p_sandi, '')) < 12 then
    -- Ini bukan sandi yang diketik manusia. Ia disalin sekali ke formulir
    -- BPJS dan tidak pernah diketik ulang, jadi tidak ada alasan untuk
    -- membuatnya pendek — dan pintunya menghadap internet terbuka.
    raise exception 'Sandi web service minimal 12 karakter.';
  end if;

  v_salt := md5(random()::text || clock_timestamp()::text);

  insert into antrol_akun (username, sandi_hash, salt, keterangan, dibuat_oleh)
  values (v_user, encode(sha256(convert_to(v_salt || p_sandi, 'utf8')), 'hex'),
          v_salt, p_keterangan, auth.uid())
  on conflict (username) do update set
    sandi_hash = excluded.sandi_hash,
    salt       = excluded.salt,
    keterangan = coalesce(excluded.keterangan, antrol_akun.keterangan),
    aktif      = true;

  return v_user;
end $$;

create or replace function public.antrol_akun_hapus(p_username text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.boleh_antrean_pengaturan() then
    raise exception 'Anda tidak punya izin mengatur akun Antrol.';
  end if;
  delete from antrol_akun where username = lower(trim(p_username));
  return found;
end $$;

-- Dipakai Edge Function (service_role) untuk memeriksa header
-- x-username / x-password yang dikirim BPJS.
create or replace function public.antrol_auth(p_username text, p_sandi text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r antrol_akun;
begin
  select * into r from antrol_akun
   where username = lower(trim(coalesce(p_username,''))) and aktif;

  if not found
     or r.sandi_hash <> encode(sha256(convert_to(r.salt || coalesce(p_sandi,''), 'utf8')), 'hex')
  then
    return jsonb_build_object('metadata',
      jsonb_build_object('message', 'Username atau password tidak sesuai', 'code', 201));
  end if;

  update antrol_akun set terakhir_dipakai = now(), jumlah_dipakai = jumlah_dipakai + 1
   where username = r.username;

  return jsonb_build_object('metadata',
    jsonb_build_object('message', 'Ok', 'code', 200));
end $$;


-- =====================================================================
--  13. WEB SERVICE ANTROL — logika lengkap, di database
--
--  Bentuk jawaban mengikuti spesifikasi "Integrasi Sistem Antrean" FKTP:
--    sukses  { "response": {...}, "metadata": { "message":"Ok", "code":200 } }
--    gagal   {                    "metadata": { "message":"...",  "code":201 } }
--    pasien baru                                                     code 202
--
--  Perhatikan huruf kecil semua pada "metadata" — berbeda dari PCare
--  yang memakai "metaData". Salah satu huruf itu membuat BPJS membaca
--  jawaban kita sebagai gagal.
-- =====================================================================

create or replace function public.antrol_gagal(p_pesan text, p_kode int default 201)
returns jsonb
language sql immutable as $$
  select jsonb_build_object('metadata',
    jsonb_build_object('message', p_pesan, 'code', p_kode))
$$;

-- Kalimat yang dibaca pasien di Mobile JKN. Bisa diubah lewat Pengaturan.
create or replace function public.antrol_keterangan()
returns text
language sql stable as $$
  select coalesce(
    nullif(trim(konfigurasi->>'keterangan_antrol'), ''),
    'Harap datang 30 menit sebelum jam praktek. Bila nomor antrean Anda '
    'terlewat, silakan lapor ke loket pendaftaran.')
  from sys_antrean_pengaturan where id = 1
$$;

-- Pemeriksaan yang dipakai berulang oleh hampir semua endpoint.
-- Memulangkan poli_id, atau melempar pesan yang sudah berbentuk jawaban.
create or replace function public.antrol_periksa_poli_tanggal(
  p_kode_poli text, p_tanggal text, out v_poli uuid, out v_tgl date, out v_galat jsonb)
language plpgsql stable as $$
begin
  v_galat := null;

  select id into v_poli from poli
   where kode_pcare = trim(coalesce(p_kode_poli,'')) and aktif;
  if v_poli is null then
    -- Kode poli yang dikirim BPJS adalah kdPoli PCare, bukan kode kita.
    -- Selama Pengaturan → Master Poli belum diisi kode PCare-nya, jalur
    -- ini akan selalu berakhir di sini — dan pesannya harus mengatakan
    -- itu, bukan "poli tidak ditemukan" yang membuat orang mencari di
    -- daftar poli klinik.
    v_galat := public.antrol_gagal('Poli tidak ditemukan');
    return;
  end if;

  if coalesce(p_tanggal,'') !~ '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$' then
    v_galat := public.antrol_gagal(
      'Format tanggal tidak sesuai, format yang benar adalah yyyy-mm-dd');
    return;
  end if;

  begin
    v_tgl := p_tanggal::date;
  exception when others then
    v_galat := public.antrol_gagal('Tanggal periksa tidak valid');
    return;
  end;

  if v_tgl < public.tgl_klinik() then
    v_galat := public.antrol_gagal('Tanggal periksa tidak berlaku mundur');
    return;
  end if;
end $$;

create or replace function public.antrol_periksa_kartu(p_no_kartu text)
returns jsonb
language sql immutable as $$
  select case
    when coalesce(trim(p_no_kartu), '') = ''      then public.antrol_gagal('Nomor kartu tidak boleh kosong')
    when trim(p_no_kartu) !~ '^[0-9]+$'           then public.antrol_gagal('Format nomor kartu tidak sesuai')
    when length(trim(p_no_kartu)) <> 13           then public.antrol_gagal('Nomor kartu harus 13 digit')
    else null end
$$;

create or replace function public.antrol_periksa_nik(p_nik text)
returns jsonb
language sql immutable as $$
  select case
    when coalesce(trim(p_nik), '') = ''  then public.antrol_gagal('NIK tidak boleh kosong')
    when trim(p_nik) !~ '^[0-9]+$'       then public.antrol_gagal('Format NIK tidak sesuai')
    when length(trim(p_nik)) <> 16       then public.antrol_gagal('NIK harus 16 digit')
    else null end
$$;

-- Nomor yang sedang dipanggil di satu poli, dalam bentuk teks untuk
-- Mobile JKN. Kosong (bukan null) bila belum ada panggilan — BPJS
-- membaca field ini apa adanya dan null membuatnya menampilkan "null".
create or replace function public.antrol_antrean_panggil(p_poli uuid, p_tanggal date)
returns text
language sql stable as $$
  select coalesce(
    (select a.nomor from antrean_panggilan pg
       join antrean a on a.id = pg.antrean_id
      where pg.tanggal = p_tanggal and a.poli_id = p_poli
      order by pg.id desc limit 1),
    '')
$$;


-- ---------------------------------------------------------------------
-- 13a. GET /antrean/status/{kodepoli}/{tanggal}
-- ---------------------------------------------------------------------
create or replace function public.antrol_status(p_kode_poli text, p_tanggal text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c record; j record; v_total int; v_sisa int; v_nama text;
begin
  select * into c from public.antrol_periksa_poli_tanggal(p_kode_poli, p_tanggal);
  if c.v_galat is not null then return c.v_galat; end if;

  select nama into v_nama from poli where id = c.v_poli;
  select * into j from public.poli_jadwal_berlaku(c.v_poli, c.v_tgl);
  if not found then
    return public.antrol_gagal('Poli ' || v_nama || ' tidak melayani pada tanggal tersebut');
  end if;

  select count(*) filter (where status not in ('BATAL','TIDAK_HADIR')),
         count(*) filter (where status in ('BELUM_HADIR','MENUNGGU','DIPANGGIL'))
    into v_total, v_sisa
    from antrean where tanggal = c.v_tgl and poli_id = c.v_poli;

  return jsonb_build_object(
    'response', jsonb_build_object(
      'namapoli',      v_nama,
      'totalantrean',  v_total::text,
      'sisaantrean',   v_sisa::text,
      'antreanpanggil', public.antrol_antrean_panggil(c.v_poli, c.v_tgl),
      'keterangan',    public.antrol_keterangan()),
    'metadata', jsonb_build_object('message', 'Ok', 'code', 200));
end $$;


-- ---------------------------------------------------------------------
-- 13b. POST /antrean  — pengambilan nomor dari Mobile JKN
--
-- Ini satu-satunya fungsi di seluruh RME yang menulis data atas perintah
-- pihak luar tanpa ada petugas klinik yang menekan tombol. Karena itu
-- setiap penolakan di bawah ditulis lengkap dengan alasannya.
-- ---------------------------------------------------------------------
create or replace function public.antrol_ambil(
  p_no_kartu text, p_nik text, p_kode_poli text, p_tanggal text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c record; j record; g jsonb; a antrean;
  v_pasien uuid; v_nama_poli text; v_nama_pasien text;
  v_sisa int; v_terpakai_online int; v_jam time;
begin
  g := public.antrol_periksa_kartu(p_no_kartu); if g is not null then return g; end if;
  g := public.antrol_periksa_nik(p_nik);        if g is not null then return g; end if;

  select * into c from public.antrol_periksa_poli_tanggal(p_kode_poli, p_tanggal);
  if c.v_galat is not null then return c.v_galat; end if;

  select nama into v_nama_poli from poli where id = c.v_poli;

  -- Jadwal
  select * into j from public.poli_jadwal_berlaku(c.v_poli, c.v_tgl);
  if not found then
    return public.antrol_gagal('Pendaftaran ke ' || v_nama_poli || ' sedang tutup pada tanggal tersebut');
  end if;

  -- Jam tutup hanya berlaku untuk pemesanan HARI INI. Pemesanan untuk
  -- besok tidak boleh ditolak karena poli sudah tutup sore ini.
  if c.v_tgl = public.tgl_klinik() then
    v_jam := public.jam_klinik();
    if v_jam > j.jam_tutup_online then
      return public.antrol_gagal(
        'Pendaftaran online ke ' || v_nama_poli || ' hari ini sudah ditutup pukul ' ||
        to_char(j.jam_tutup_online, 'HH24:MI'));
    end if;
  end if;

  -- Sudah punya nomor?
  --
  -- Sengaja memeriksa SEMUA sumber, bukan hanya ONLINE. Kalau pasien
  -- sudah mengambil nomor di loket pagi ini, nomor kedua dari Mobile JKN
  -- akan membuatnya dipanggil dua kali dan menghabiskan dua kuota.
  -- Indeks unik di tabel hanya menjaga jalur online; pemeriksaan inilah
  -- yang menutup celah antar-jalur.
  if exists (
    select 1 from antrean
     where tanggal = c.v_tgl and poli_id = c.v_poli
       and no_kartu = trim(p_no_kartu)
       and status not in ('BATAL','TIDAK_HADIR'))
  then
    return public.antrol_gagal(
      'Nomor antrean hanya dapat diambil satu kali pada tanggal dan poli yang sama');
  end if;

  -- Kuota online
  v_terpakai_online := public.antrean_terpakai(c.v_poli, c.v_tgl, true);
  if v_terpakai_online >= j.kuota_online then
    return public.antrol_gagal('Kuota antrean online ke ' || v_nama_poli || ' sudah penuh');
  end if;

  -- Pasien dikenal? Dicari lewat nomor BPJS dulu, lalu NIK.
  select id, nama into v_pasien, v_nama_pasien
    from pasien
   where aktif and (no_bpjs = trim(p_no_kartu) or nik = trim(p_nik))
   order by (no_bpjs = trim(p_no_kartu)) desc
   limit 1;

  insert into antrean (tanggal, poli_id, sumber, status, tahap,
                       pasien_id, no_kartu, nik, nama_snapshot)
  values (c.v_tgl, c.v_poli, 'ONLINE', 'BELUM_HADIR', 'LOKET',
          v_pasien, trim(p_no_kartu), trim(p_nik), v_nama_pasien)
  returning * into a;

  select count(*) into v_sisa from antrean
   where tanggal = c.v_tgl and poli_id = c.v_poli
     and status in ('BELUM_HADIR','MENUNGGU','DIPANGGIL')
     and no_urut < a.no_urut;

  return jsonb_build_object(
    'response', jsonb_build_object(
      'nomorantrean',  a.nomor,
      'angkaantrean',  a.no_urut::text,
      'namapoli',      v_nama_poli,
      'sisaantrean',   v_sisa::text,
      'antreanpanggil', public.antrol_antrean_panggil(c.v_poli, c.v_tgl),
      'keterangan',    public.antrol_keterangan(),
      'kodebooking',   a.kode_booking),
    'metadata', jsonb_build_object(
      'message', 'Ok',
      -- 202 = peserta belum terdaftar sebagai pasien di sini. Nomornya
      -- TETAP terbit — pasien yang sudah berangkat tidak boleh disuruh
      -- pulang. Kode 202-lah yang memberi tahu Mobile JKN agar mengirim
      -- data dirinya lewat POST /peserta, dan petugas loket melihat
      -- nomor ini bertanda "pasien baru" di papan antrean.
      'code', case when v_pasien is null then 202 else 200 end));
end $$;


-- ---------------------------------------------------------------------
-- 13c. GET /antrean/sisapeserta/{nokartu}/{kodepoli}/{tanggal}
-- ---------------------------------------------------------------------
create or replace function public.antrol_sisa_peserta(
  p_no_kartu text, p_kode_poli text, p_tanggal text
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c record; g jsonb; a antrean; v_sisa int;
begin
  g := public.antrol_periksa_kartu(p_no_kartu); if g is not null then return g; end if;

  select * into c from public.antrol_periksa_poli_tanggal(p_kode_poli, p_tanggal);
  if c.v_galat is not null then return c.v_galat; end if;

  select * into a from antrean
   where tanggal = c.v_tgl and poli_id = c.v_poli
     and no_kartu = trim(p_no_kartu)
     and status not in ('BATAL','TIDAK_HADIR')
   order by no_urut limit 1;

  if not found then return public.antrol_gagal('Antrean tidak ditemukan'); end if;

  select count(*) into v_sisa from antrean
   where tanggal = c.v_tgl and poli_id = c.v_poli
     and status in ('BELUM_HADIR','MENUNGGU','DIPANGGIL')
     and no_urut < a.no_urut;

  return jsonb_build_object(
    'response', jsonb_build_object(
      'nomorantrean',  a.nomor,
      'namapoli',      (select nama from poli where id = c.v_poli),
      'sisaantrean',   v_sisa::text,
      'antreanpanggil', public.antrol_antrean_panggil(c.v_poli, c.v_tgl),
      'keterangan',    public.antrol_keterangan()),
    'metadata', jsonb_build_object('message', 'Ok', 'code', 200));
end $$;


-- ---------------------------------------------------------------------
-- 13d. PUT /antrean/batal
-- ---------------------------------------------------------------------
create or replace function public.antrol_batal(
  p_no_kartu text, p_kode_poli text, p_tanggal text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c record; g jsonb; a antrean;
begin
  g := public.antrol_periksa_kartu(p_no_kartu); if g is not null then return g; end if;

  select * into c from public.antrol_periksa_poli_tanggal(p_kode_poli, p_tanggal);
  if c.v_galat is not null then return c.v_galat; end if;

  select * into a from antrean
   where tanggal = c.v_tgl and poli_id = c.v_poli
     and no_kartu = trim(p_no_kartu)
     and status not in ('BATAL','TIDAK_HADIR')
   order by no_urut limit 1;

  if not found then return public.antrol_gagal('Antrean tidak ditemukan'); end if;

  -- Pasien yang sudah berdiri di loket tidak boleh dihapus dari sistem
  -- oleh ponselnya sendiri. Kalau ia benar-benar ingin batal, petugaslah
  -- yang membatalkan — dan kunjungannya juga harus dibereskan.
  if a.kunjungan_id is not null or a.status in ('DILAYANI','SELESAI') then
    return public.antrol_gagal(
      'Antrean sudah dilayani di faskes dan tidak dapat dibatalkan dari aplikasi');
  end if;

  update antrean set status = 'BATAL',
         alasan_batal = 'Dibatalkan peserta lewat Mobile JKN',
         waktu_selesai = now()
   where id = a.id;

  return jsonb_build_object('metadata',
    jsonb_build_object('message', 'Ok', 'code', 200));
end $$;


-- ---------------------------------------------------------------------
-- 13e. POST /peserta  — data pasien baru dari Mobile JKN
--
-- Sengaja TIDAK membuat baris pasien secara otomatis. Nomor rekam medis
-- adalah identitas seumur hidup di klinik ini; menerbitkannya dari data
-- yang belum pernah dilihat petugas adalah cara tercepat melahirkan
-- pasien kembar — satu dari Mobile JKN, satu lagi saat orangnya datang
-- dan petugas tidak menemukan namanya karena ejaannya beda.
--
-- Yang dilakukan: menyimpan datanya di antrean sebagai calon, supaya
-- petugas loket melihatnya lengkap dan tinggal menekan "Daftarkan
-- sebagai pasien baru" — satu klik, dengan mata manusia di atasnya.
-- ---------------------------------------------------------------------
create or replace function public.antrol_peserta_baru(p_data jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare g jsonb; v_kartu text; v_nik text; v_nama text; v_ada int;
begin
  v_kartu := trim(coalesce(p_data->>'nomorkartu',''));
  v_nik   := trim(coalesce(p_data->>'nik',''));
  v_nama  := nullif(trim(coalesce(p_data->>'nama','')), '');

  g := public.antrol_periksa_kartu(v_kartu); if g is not null then return g; end if;
  g := public.antrol_periksa_nik(v_nik);     if g is not null then return g; end if;
  if v_nama is null then return public.antrol_gagal('Nama tidak boleh kosong'); end if;

  update antrean set
      nama_snapshot = coalesce(nama_snapshot, v_nama),
      nik           = coalesce(nullif(nik,''), v_nik),
      catatan       = coalesce(catatan, 'Data peserta dari Mobile JKN: ' ||
                        v_nama || ', ' || coalesce(p_data->>'jeniskelamin','-') || ', ' ||
                        coalesce(p_data->>'tanggallahir','-') || '. ' ||
                        coalesce(p_data->>'alamat',''))
    where no_kartu = v_kartu
      and tanggal >= public.tgl_klinik()
      and status not in ('BATAL','TIDAK_HADIR')
      and pasien_id is null;
  get diagnostics v_ada = row_count;

  if v_ada = 0 then
    return public.antrol_gagal('Antrean untuk peserta ini tidak ditemukan');
  end if;

  return jsonb_build_object('metadata',
    jsonb_build_object('message', 'Ok', 'code', 200));
end $$;


-- =====================================================================
--  14. LAYAR TUNGGU
--
--  Layar dipasang di ruang tunggu dan menyala seharian. Ia TIDAK login.
--  Yang dibawanya hanya token panjang di URL, dan fungsi di bawah adalah
--  satu-satunya hal yang bisa dilakukannya.
--
--  Keputusan Laboratorium Medis Utama: layar hanya menampilkan NOMOR — tidak ada nama,
--  tidak ada nomor rekam medis, tidak ada diagnosa. Itu bukan sekadar
--  sopan santun, itu yang membuat token ini nyaris tidak berisiko:
--  seandainya tautannya tersebar pun, yang bocor adalah "A-014 sedang
--  dipanggil ke Poli Umum" — kalimat yang memang diteriakkan di ruang
--  tunggu. Karena itu fungsi ini secara struktural tidak menyentuh
--  tabel pasien sama sekali.
-- =====================================================================

create or replace function public.antrean_layar(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_token text; v_tgl date; v_konf jsonb; v_hasil jsonb;
begin
  select token_layar, konfigurasi into v_token, v_konf
    from sys_antrean_pengaturan where id = 1;

  -- Token kosong berarti fitur layar belum dinyalakan. Tanpa penjagaan
  -- ini, memanggil fungsi dengan token '' akan cocok dengan token yang
  -- belum diisi — dan layar terbuka untuk siapa saja.
  if coalesce(v_token, '') = '' or length(coalesce(p_token,'')) < 16
     or p_token is distinct from v_token then
    return jsonb_build_object('galat', 'Token layar tidak dikenal.');
  end if;

  v_tgl := public.tgl_klinik();

  select jsonb_build_object(
    'tanggal',   v_tgl,
    'waktu',     to_char(now() at time zone 'Asia/Makassar', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'klinik',    (select nama from faskes where id = 1),
    'judul',     coalesce(nullif(v_konf->>'judul_layar',''), 'Antrean Pasien'),
    'teks_berjalan', coalesce(v_konf->>'teks_berjalan', ''),

    -- Panggilan terbaru, urut dari yang paling akhir. Layar membunyikan
    -- yang id-nya lebih besar daripada yang sudah pernah dibunyikan.
    'panggilan', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', x.id, 'nomor', x.nomor, 'tujuan', x.tujuan,
               'poli', x.nama_poli, 'waktu', x.waktu, 'ulang', x.urutan))
        from (select pg.id, a.nomor, pg.tujuan, po.nama as nama_poli,
                     to_char(pg.waktu at time zone 'Asia/Makassar', 'HH24:MI') as waktu,
                     pg.urutan
                from antrean_panggilan pg
                join antrean a on a.id = pg.antrean_id
                join poli po   on po.id = a.poli_id
               where pg.tanggal = v_tgl
               order by pg.id desc limit 8) x), '[]'::jsonb),

    'poli', coalesce((
      select jsonb_agg(jsonb_build_object(
               'nama',      po.nama,
               'prefix',    po.prefix_antrean,
               'dipanggil', public.antrol_antrean_panggil(po.id, v_tgl),
               'berikut',   coalesce((
                 select jsonb_agg(n.nomor order by n.no_urut)
                   from (select nomor, no_urut from antrean
                          where tanggal = v_tgl and poli_id = po.id
                            and status in ('MENUNGGU','BELUM_HADIR')
                          order by no_urut limit 4) n), '[]'::jsonb),
               'sisa',      (select count(*) from antrean
                              where tanggal = v_tgl and poli_id = po.id
                                and status in ('MENUNGGU','BELUM_HADIR','DIPANGGIL')),
               'selesai',   (select count(*) from antrean
                              where tanggal = v_tgl and poli_id = po.id
                                and status = 'SELESAI'))
             order by po.urutan)
        from poli po where po.aktif), '[]'::jsonb)
  ) into v_hasil;

  return v_hasil;
end $$;

comment on function public.antrean_layar(text) is
  'Data layar tunggu. Hanya nomor antrean — tidak pernah memulangkan nama,
   nomor rekam medis, atau data medis apa pun. Boleh dipanggil tanpa login.';

-- Inilah satu-satunya hak yang diberikan kepada pengunjung tanpa login.
--
-- `usage on schema public` untuk anon ditulis ulang di sini dengan sengaja.
-- Supabase memberikannya secara bawaan, tetapi 02_rls.sql hanya menyebut
-- `authenticated` — dan berkas SQL ini harus tetap benar bila dijalankan di
-- PostgreSQL lain, atau di project yang haknya pernah dirapikan. Tanpa baris
-- ini layar tunggu gagal dengan "permission denied for schema public": kelas
-- galat yang sama dengan "permission denied for table apotek_batch" dulu,
-- dan yang muncul di TV ruang tunggu, bukan di layar siapa pun yang menguji.
grant usage on schema public to anon;
grant execute on function public.antrean_layar(text) to anon, authenticated;
grant execute on function public.tgl_klinik() to anon;
grant execute on function public.antrol_antrean_panggil(uuid, date) to anon;

-- Membuat / mengganti token layar. Tautan lama langsung mati.
create or replace function public.antrean_token_baru(p_token text)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.boleh_antrean_pengaturan() then
    raise exception 'Anda tidak punya izin mengganti token layar.';
  end if;
  if length(coalesce(p_token,'')) < 24 then
    raise exception 'Token layar minimal 24 karakter.';
  end if;
  update sys_antrean_pengaturan
     set token_layar = p_token, updated_at = now(), updated_by = auth.uid()
   where id = 1;
  return p_token;
end $$;


-- =====================================================================
--  15. HAK AKSES
--
--  Tabel dan view BARU tidak mewarisi GRANT dari 02_rls.sql — pelajaran
--  dari "permission denied for table apotek_batch" dan uji 20b pada
--  modul pemeriksaan. Ditulis eksplisit di sini.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array['poli_jadwal','poli_libur','antrean','antrean_panggilan']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);

    execute format('drop policy if exists %1$s_baca on %1$s', t);
    execute format($f$create policy %1$s_baca on %1$s for select
                     to authenticated using (public.saya_staf())$f$, t);
  end loop;
end $$;

grant usage, select on sequence antrean_panggilan_id_seq to authenticated;

-- Jadwal & kuota: kode `antrean_pengaturan`.
do $$
declare t text;
begin
  foreach t in array array['poli_jadwal','poli_libur']
  loop
    execute format('drop policy if exists %1$s_kelola on %1$s', t);
    execute format($f$create policy %1$s_kelola on %1$s for all to authenticated
                     using (public.boleh_antrean_pengaturan())
                     with check (public.boleh_antrean_pengaturan())$f$, t);
  end loop;
end $$;

-- Antrean: siapa pun yang melayani pasien boleh menggerakkannya.
-- Apoteker dan kasir sengaja ikut — merekalah yang paling sering melihat
-- pasien menunggu tanpa ada yang memanggil.
drop policy if exists antrean_tulis on antrean;
create policy antrean_tulis on antrean for insert
  to authenticated
  with check (public.boleh_antrean_buat());

drop policy if exists antrean_ubah on antrean;
create policy antrean_ubah on antrean for update
  to authenticated
  using (public.saya_staf()) with check (public.saya_staf());

drop policy if exists antrean_hapus on antrean;
create policy antrean_hapus on antrean for delete
  to authenticated using (public.boleh_antrean_hapus());

drop policy if exists panggilan_tulis on antrean_panggilan;
create policy panggilan_tulis on antrean_panggilan for insert
  to authenticated with check (public.saya_staf());

-- Riwayat panggilan tidak boleh disunting: ia bukti bahwa pasien memang
-- pernah dipanggil sebelum dinyatakan tidak hadir.
drop policy if exists panggilan_kunci on antrean_panggilan;
create policy panggilan_kunci on antrean_panggilan for update
  to authenticated using (false) with check (false);

-- Pengaturan antrean: dibaca semua staf (halaman antrean butuh
-- keterangan & estimasi), diubah kode `antrean_pengaturan`.
alter table sys_antrean_pengaturan enable row level security;
grant select, insert, update on sys_antrean_pengaturan to authenticated;

drop policy if exists antrean_atur_baca on sys_antrean_pengaturan;
create policy antrean_atur_baca on sys_antrean_pengaturan for select
  to authenticated using (public.saya_staf());

drop policy if exists antrean_atur_kelola on sys_antrean_pengaturan;
create policy antrean_atur_kelola on sys_antrean_pengaturan for all
  to authenticated
  using (public.boleh_antrean_pengaturan())
  with check (public.boleh_antrean_pengaturan());

-- Log Antrol: kode `antrol_log`, ditulis hanya Edge Function.
alter table antrol_log enable row level security;
grant select on antrol_log to authenticated;
revoke insert, update, delete on antrol_log from authenticated, anon;

drop policy if exists antrol_log_baca on antrol_log;
create policy antrol_log_baca on antrol_log for select
  to authenticated using (public.boleh_antrol_log());

-- Akun Antrol: hanya lewat fungsi. Tabelnya sudah di-revoke di atas;
-- view-nya perlu RLS sendiri karena security_invoker meneruskan hak
-- pemanggil ke tabel yang tidak boleh dibacanya. Karena itu view ini
-- dibuat security definer — satu-satunya di modul ini — dan isinya
-- memang tidak memuat rahasia apa pun.
drop view if exists v_antrol_akun;
create view v_antrol_akun with (security_invoker = false) as
select username, keterangan, aktif, dibuat_pada, terakhir_dipakai, jumlah_dipakai
  from antrol_akun
 where public.boleh_antrean_pengaturan();

grant select on v_antrol_akun to authenticated;
grant select on v_antrean_hari_ini, v_antrean_kuota to authenticated;

grant execute on function public.antrean_panggil(uuid, text)          to authenticated;
grant execute on function public.antrean_checkin(uuid, uuid, uuid, cara_bayar_t, text) to authenticated;
grant execute on function public.antrean_mulai_layan(uuid)            to authenticated;
grant execute on function public.antrean_lewat(uuid, text)            to authenticated;
grant execute on function public.antrean_batal(uuid, text)            to authenticated;
grant execute on function public.antrean_urut_berikut(uuid, date)     to authenticated;
grant execute on function public.antrean_terpakai(uuid, date, boolean) to authenticated;
grant execute on function public.poli_jadwal_berlaku(uuid, date)      to authenticated;
grant execute on function public.antrol_akun_simpan(text, text, text) to authenticated;
grant execute on function public.antrol_akun_hapus(text)              to authenticated;
grant execute on function public.antrean_token_baru(text)             to authenticated;
grant execute on function public.antrol_keterangan()                  to authenticated;

-- Fungsi antrol_* lainnya SENGAJA tidak diberikan ke authenticated:
-- yang memakainya hanya Edge Function dengan service_role. Peramban staf
-- tidak punya alasan menerbitkan nomor antrean "atas nama Mobile JKN".


-- =====================================================================
--  16. ISIAN AWAL
--  Jadwal bawaan: Senin–Sabtu pagi, Senin–Jumat sore, Minggu tutup.
--  Angka kuota sengaja dibuat longgar — kuota yang terlalu ketat pada
--  hari pertama membuat pasien ditolak Mobile JKN sebelum ada seorang
--  pun di klinik yang tahu halaman pengaturannya di mana.
-- =====================================================================

insert into poli_jadwal (poli_id, hari, sesi, jam_buka, jam_tutup, jam_tutup_online, kuota, kuota_online)
select po.id, h.hari, 1, '08:00'::time, '12:00'::time, '11:00'::time, 40, 20
  from poli po cross join (select generate_series(1, 6) as hari) h
 where po.aktif
on conflict (poli_id, hari, sesi) do nothing;

insert into poli_jadwal (poli_id, hari, sesi, jam_buka, jam_tutup, jam_tutup_online, kuota, kuota_online)
select po.id, h.hari, 2, '16:00'::time, '20:00'::time, '19:00'::time, 30, 15
  from poli po cross join (select generate_series(1, 5) as hari) h
 where po.aktif
on conflict (poli_id, hari, sesi) do nothing;

update sys_antrean_pengaturan
   set konfigurasi = konfigurasi || jsonb_build_object(
     'judul_layar',         'Antrean Pasien',
     'teks_berjalan',       'Selamat datang di Laboratorium Medis Utama. '
                            'Mohon menunggu nomor antrean Anda dipanggil.',
     'suara_aktif',         true,
     'menit_per_pasien',    10,
     'tampilkan_estimasi',  true)
 where id = 1 and not (konfigurasi ? 'judul_layar');
-- =====================================================================
--  RME Laboratorium Medis Utama — PEMANTAUAN PASIEN KRONIS (Tahap 1: dasar & migrasi)
--  Jalankan SETELAH 15_antrean.sql. Aman dijalankan di database berisi
--  data, dan aman dijalankan ulang.
--
--  APA YANG DIPINDAH DARI PORTAL, DAN APA YANG TIDAK
--  --------------------------------------------------
--  Portal sipantau menyimpan tiga hal yang diketik manusia:
--    kronis_terapi  — pendaftaran pemegang buku kronis
--    obat_kronis    — satu baris tiap kali pasien mengambil obat
--    lab_rutin      — satu baris tiap kali pasien periksa lab
--
--  Hanya YANG PERTAMA yang jadi tabel di sini. Dua sisanya TIDAK
--  disalin, karena di RME kejadiannya sudah tercatat sendiri:
--
--    ambil obat  = resep berstatus DISERAHKAN -> apotek_transaksi
--                  ('Resep Pasien', membawa pasien_id, kunjungan_id,
--                   resep_item_id, dan tanggal)
--    periksa lab = lab_permintaan status 'SELESAI' + lab_hasil
--
--  Log yang disalin jadi tabel kedua akan berselisih dengan apotek dalam
--  hitungan minggu — alasan yang sama persis dengan keputusan 1 Sep 2026
--  bahwa stok apotek tidak menumpang database portal. Pemantauannya dibuat
--  sebagai view di 17_kronis_pantau.sql, bukan sebagai tabel.
--
--  LALU RIWAYAT LAMA DISIMPAN DI MANA?
--  ------------------------------------
--  Di kronis_riwayat_luar. Pengambilan obat tahun lalu TIDAK BOLEH
--  dijadikan kunjungan + resep + apotek_transaksi palsu: kunjungan yang
--  tidak pernah terjadi akan ikut terhitung di laporan Dinkes, di rekap
--  kasir, dan (kelak) di klaim PCare. Riwayat lama disimpan sebagai
--  riwayat lama, ditandai sumbernya, lalu digabung dengan data RME hanya
--  pada saat ditampilkan.
--
--  KENAPA ADA TABEL TITIPAN (kronis_impor_*)
--  ------------------------------------------
--  Portal mengunci pasien dengan teks: nama + no BPJS. RME mengunci
--  dengan pasien.id, dan tabel pasien MEWAJIBKAN tanggal_lahir dan
--  jenis_kelamin — dua hal yang portal tidak pernah simpan.
--
--  Artinya pasien lama tidak bisa dibuatkan otomatis. Mengarangnya berarti
--  menerbitkan nomor rekam medis — identitas seumur hidup — dari data yang
--  belum pernah dilihat petugas, lalu mendapati pasien kembar saat orangnya
--  benar-benar datang dengan ejaan nama yang sedikit berbeda. Kesalahan itu
--  sudah dihindari sekali waktu memutuskan POST /peserta Antrol tidak
--  menerbitkan rekam medis; tidak ada alasan mengulanginya di sini.
--
--  Jadi seluruh baris portal mendarat lebih dulu di tabel titipan, dan
--  baru menempel ke rekam medis setelah seorang manusia menyetujui
--  pasangannya. Baris yang belum ada pasiennya tetap menunggu di situ —
--  dan menempel sendiri begitu pasiennya didaftarkan.
--
--  YANG SENGAJA TIDAK DIBUAT DI BERKAS INI
--  ----------------------------------------
--    * View pemantauan, jadwal, dan kepatuhan  -> 17_kronis_pantau.sql
--    * Panel laporan                            -> 18_laporan.sql
--    * Pengiriman WhatsApp otomatis — keputusan Laboratorium Medis Utama 4 Sep 2026:
--      cukup tautan wa.me, tidak ada Fonnte dan tidak ada Edge Function.
-- =====================================================================


-- =====================================================================
--  A. PINTASAN HAK AKSES
-- =====================================================================

-- Dua peran, dua kepentingan berbeda:
--
--   boleh_kronis_kelola() — mengubah pendaftaran buku kronis. Dokter dan
--     perawat ikut, karena penandaannya terjadi di ruang periksa, bukan
--     di meja admin. Kalau hanya admin yang boleh, dokter akan menyerah
--     dan penandaannya tidak pernah dilakukan.
--
--   boleh_kronis_migrasi() — menempelkan riwayat portal ke seorang
--     pasien. Admin saja. Salah tempel berarti riwayat penyakit orang
--     lain masuk ke rekam medis seseorang, dan itu tidak bisa dibereskan
--     dengan meminta maaf.
-- 9 Sep 2026: lewat tabel hak_akses (bisa diatur master), bukan daftar
-- peran tetap lagi — lihat sql/02_rls.sql bagian HAK AKSES. Isian awal
-- (kode `kronis_kelola`: dokter+perawat) menjaga perilaku persis sama
-- seperti sebelumnya; `kronis_migrasi` sengaja tidak diberi isian awal —
-- tetap seperti dulu (hanya admin lama / master sekarang).
create or replace function public.boleh_kronis_kelola() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('kronis_kelola') $$;

create or replace function public.boleh_kronis_migrasi() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('kronis_migrasi') $$;

grant execute on function public.boleh_kronis_kelola()  to authenticated;
grant execute on function public.boleh_kronis_migrasi() to authenticated;

insert into public.hak_akses (kode, peran, diizinkan) values
  ('kronis_kelola',     'dokter',  true),
  ('kronis_kelola',     'perawat', true),
  -- Dipakai js/pages/pantau_kronis.js (tab "Telepon H-1"), bukan RLS —
  -- lihat catatan di berkas itu.
  ('kronis_telpon_h1',  'admin',   true)
on conflict (kode, peran) do nothing;


-- =====================================================================
--  B. REFERENSI
-- =====================================================================

-- B1. Diagnosis kronis yang dipantau.
--
-- Dua kolom yang menentukan bentuk seluruh modul:
--
--   pantau_obat — pasien dengan diagnosis ini dipantau pengambilan
--                 obat bulanannya. Berlaku untuk kesepuluh diagnosis.
--
--   bulan_lab   — jarak kontrol lab dalam bulan. HANYA diisi untuk
--                 diagnosis yang punya jatah pemeriksaan lab. Per
--                 keputusan Laboratorium Medis Utama 4 Sep 2026 itu cuma HPT dan DM;
--                 delapan sisanya NULL, dan pasiennya tidak akan pernah
--                 muncul di daftar "terlambat lab" untuk pemeriksaan
--                 yang memang tidak dijatahkan padanya.
--
-- alias menyimpan tulisan yang dipakai portal ('Hipertensi', 'HPT',
-- 'Diabetes Melitus', 'DM'), supaya impor bisa memetakan sendiri tanpa
-- ada yang perlu mencocokkan sepuluh kata satu per satu.
create table if not exists ref_kronis_diagnosa (
  kode        text primary key,
  nama        text not null,
  pantau_obat boolean not null default true,
  bulan_lab   smallint check (bulan_lab is null or bulan_lab between 1 and 24),
  alias       text[] not null default '{}',
  -- Awalan kode ICD-10 yang menandakan diagnosis ini. Dipakai untuk
  -- MENGUSULKAN penandaan saat dokter memilih diagnosa — bukan untuk
  -- menandai sendiri. Awalan, bukan kode penuh: E11 harus mengenali
  -- E11.0 sampai E11.9 tanpa sepuluh baris.
  icd10_awal  text[] not null default '{}',
  urutan      smallint not null default 0,
  aktif       boolean not null default true
);

insert into ref_kronis_diagnosa (kode, nama, bulan_lab, alias, icd10_awal, urutan) values
  ('HPT',      'Hipertensi',        6, array['Hipertensi','HPT','HT'],        array['I10','I11','I12','I13','I15'], 1),
  ('DM',       'Diabetes Melitus',  3, array['Diabetes Melitus','DM','DMT2'], array['E10','E11','E13','E14'],       2),
  ('ASMA',     'Asma',           null, array['Asma'],                          array['J45','J46'],                   3),
  ('PPOK',     'PPOK',           null, array['PPOK'],                          array['J44'],                         4),
  ('JANTUNG',  'Jantung',        null, array['Jantung','PJK'],                 array['I20','I21','I25','I50'],       5),
  ('SKIZO',    'Skizofrenia',    null, array['Skizofrenia'],                   array['F20','F25'],                   6),
  ('EPILEPSI', 'Epilepsi',       null, array['Epilepsi'],                      array['G40'],                         7),
  ('STROKE',   'Stroke',         null, array['Stroke'],                        array['I63','I64','I69'],             8),
  ('CKD',      'CKD',            null, array['CKD','Gagal Ginjal Kronik'],     array['N18'],                         9),
  ('SLE',      'SLE',            null, array['SLE','Lupus'],                   array['M32'],                        10)
on conflict (kode) do update
   set nama = excluded.nama, bulan_lab = excluded.bulan_lab,
       alias = excluded.alias, icd10_awal = excluded.icd10_awal,
       urutan = excluded.urutan;


-- B2. Pemeriksaan lab yang MERESET jadwal kontrol.
--
-- Keputusan Laboratorium Medis Utama 4 Sep 2026: bukan sembarang lembar lab. Pasien DM yang
-- datang periksa Hb karena lemas tidak boleh terhitung sudah kontrol gula
-- — jadwalnya harus tetap jalan, dan dia harus tetap dihubungi.
create table if not exists ref_kronis_lab (
  kode_kronis text not null references ref_kronis_diagnosa(kode) on delete cascade,
  lab_id      uuid not null references ref_lab(id) on delete cascade,
  primary key (kode_kronis, lab_id)
);

-- HbA1c belum ada di master lab (11_penunjang.sql). Ditambahkan di sini
-- karena inilah pemeriksaan baku pemantauan DM; tanpa ini daftar reset
-- jadwal DM tinggal gula sesaat dan gula puasa saja.
insert into ref_lab (kode, nama, kelompok, satuan, jenis_nilai, desimal, urutan)
values ('HBA1C', 'HbA1c', 'KIMIA KLINIK', '%', 'ANGKA', 1, 46)
on conflict (kode) do nothing;

insert into ref_lab_rujukan (lab_id, batas_atas, teks)
select id, 5.7, '< 5,7' from ref_lab where kode = 'HBA1C'
  and not exists (select 1 from ref_lab_rujukan r where r.lab_id = ref_lab.id);

-- DM  : gula puasa, gula 2 jam PP, HbA1c
-- HPT : profil lipid + kreatinin + asam urat
--
-- Gula darah SEWAKTU (GDS) sengaja TIDAK dimasukkan. Nilainya tidak bisa
-- ditafsirkan tanpa tahu kapan pasien terakhir makan, sehingga lembar GDS
-- tidak layak dipakai menyatakan "pemantauan DM sudah dilakukan". Kalau
-- klinik memutuskan lain, tinggal dicentang di Master Data — daftar ini
-- memang dibuat sebagai tabel supaya bisa diubah tanpa mengubah kode.
insert into ref_kronis_lab (kode_kronis, lab_id)
select d.kode, l.id
  from (values
    ('DM',  array['GDP','GD2PP','HBA1C']),
    ('HPT', array['CHOL','HDL','LDL','TG','CR','UA'])
  ) as d(kode, kode_lab)
  join ref_lab l on l.kode = any (d.kode_lab)
on conflict do nothing;


-- B3. Obat berkuota — aturan statin BPJS.
--
-- Di portal aturan ini hidup sebagai dua baris tetap di dalam kode
-- halaman konfirmasi (STATIN_ATURAN), dan tanggal hasil lab LDL-nya
-- diketik tangan ke kolom statin_tanggal_lab.
--
-- Dua-duanya diperbaiki di sini. Aturannya jadi tabel supaya bisa diubah
-- ketika BPJS mengubah kuotanya, dan tanggal labnya diambil dari lab_hasil
-- — angka LDL-nya memang sudah ada di RME, tidak ada gunanya mengetik
-- ulang tanggal yang bisa salah ketik.
create table if not exists ref_kronis_kuota_obat (
  kunci   text primary key,          -- dicocokkan ke obat.nama, huruf kecil
  nama    text not null,
  maks    smallint not null check (maks > 0),
  -- Kuota dihitung sejak tanggal hasil pemeriksaan ini. NULL = dihitung
  -- sejak tanggal_mulai terapi.
  lab_id  uuid references ref_lab(id) on delete set null,
  aktif   boolean not null default true,
  catatan text
);

insert into ref_kronis_kuota_obat (kunci, nama, maks, lab_id, catatan)
select v.kunci, v.nama, v.maks, (select id from ref_lab where kode = 'LDL'), v.catatan
  from (values
    ('atorvastatin', 'Atorvastatin', 3::smallint, 'Maksimal 3 kali penebusan sejak hasil LDL terakhir.'),
    ('simvastatin',  'Simvastatin',  6::smallint, 'Maksimal 6 kali penebusan sejak hasil LDL terakhir.')
  ) as v(kunci, nama, maks, catatan)
on conflict (kunci) do update
   set nama = excluded.nama, maks = excluded.maks, catatan = excluded.catatan;


-- =====================================================================
--  C. PENDAFTARAN PEMEGANG BUKU KRONIS
-- =====================================================================

-- C1. Satu baris = satu pasien pemegang buku kronis.
create table if not exists kronis_terapi (
  id             uuid primary key default uuid_generate_v4(),
  pasien_id      uuid not null references pasien(id) on delete cascade,
  aktif          boolean not null default true,
  tanggal_mulai  date not null default public.tgl_klinik(),
  -- Diisi saat aktif dimatikan; muncul di riwayat supaya alasan berhenti
  -- tidak hilang bersama centangnya.
  tanggal_selesai date,
  alasan_selesai  text,
  catatan        text,
  -- Statin berkuota. statin_obat_id boleh kosong: portal menyimpan
  -- namanya sebagai teks, dan tidak semua teks itu akan ketemu padanannya
  -- di master obat saat migrasi.
  statin_kunci   text references ref_kronis_kuota_obat(kunci) on delete set null,
  statin_obat_id uuid references obat(id) on delete set null,
  statin_nama    text,
  -- Tanggal hasil LDL yang jadi titik nol kuota. Untuk pasien hasil
  -- migrasi ini disalin dari portal; untuk pasien baru dibiarkan kosong
  -- dan diambil dari lab_hasil.
  statin_tgl_lab date,
  created_at     timestamptz not null default now(),
  created_by     uuid references pegawai(id),
  updated_at     timestamptz not null default now(),
  updated_by     uuid references pegawai(id)
);

-- Satu pasien hanya boleh punya SATU pendaftaran aktif. Yang lama
-- dinonaktifkan, tidak dihapus — riwayat berhenti dan mulai lagi itu
-- informasi klinis, bukan sampah.
create unique index if not exists uq_kronis_terapi_aktif
  on kronis_terapi (pasien_id) where aktif;
create index if not exists idx_kronis_terapi_pasien on kronis_terapi (pasien_id);

drop trigger if exists trg_updated_kronis_terapi on kronis_terapi;
create trigger trg_updated_kronis_terapi before update on kronis_terapi
for each row execute function set_updated_at();


-- C2. Diagnosis kronis pasien (boleh lebih dari satu).
create table if not exists kronis_terapi_diagnosa (
  terapi_id uuid not null references kronis_terapi(id) on delete cascade,
  kode      text not null references ref_kronis_diagnosa(kode),
  primary key (terapi_id, kode)
);


-- C3. Obat rutin bulanan pasien.
--
-- Di portal ini satu kotak teks bebas (resep_tetap). Di sini ia jadi
-- daftar baris bertaut ke master obat, dan itu bukan kerapian belaka:
-- inilah yang membuat "hanya resep berisi obat kronisnya" bisa dihitung.
-- Pasien hipertensi yang datang karena flu dan pulang membawa
-- parasetamol tidak boleh terhitung sudah menebus amlodipinnya.
--
-- obat_id boleh kosong (obat portal yang belum ketemu padanannya di
-- master). Baris tanpa obat_id TIDAK IKUT menghitung — dan justru karena
-- itu ia harus tetap disimpan dan ditampilkan sebagai peringatan, bukan
-- dibuang diam-diam.
create table if not exists kronis_obat (
  id         uuid primary key default uuid_generate_v4(),
  terapi_id  uuid not null references kronis_terapi(id) on delete cascade,
  obat_id    uuid references obat(id) on delete set null,
  nama_obat  text not null,
  signa      text,
  jumlah     numeric(8,2),
  satuan     text,
  urutan     smallint not null default 0
);
create index if not exists idx_kronis_obat_terapi on kronis_obat (terapi_id, urutan);
create index if not exists idx_kronis_obat_obat on kronis_obat (obat_id)
  where obat_id is not null;


-- =====================================================================
--  D. RIWAYAT DARI LUAR RME
-- =====================================================================

-- Pengambilan obat dan pemeriksaan lab yang terjadi SEBELUM RME dipakai.
-- Dibaca oleh view pemantauan bersama data RME, tetapi tidak pernah
-- bercampur dengannya: kolom `sumber` selalu ikut terbawa ke layar,
-- supaya siapa pun yang melihat angka kepatuhan tahu bagian mana yang
-- berasal dari catatan portal dan bagian mana yang dari rekam medis.
create table if not exists kronis_riwayat_luar (
  id            uuid primary key default uuid_generate_v4(),
  pasien_id     uuid not null references pasien(id) on delete cascade,
  jenis         text not null check (jenis in ('AMBIL_OBAT','LAB','KONTROL')),
  tanggal       date not null,
  -- AMBIL_OBAT
  resep_teks    text,
  -- LAB
  lab_diagnosa  text,          -- 'DM' | 'HPT' | 'HPT+DM' apa adanya dari portal
  lab_pemeriksa text,          -- nama lab luar
  -- KONTROL (jadwal kontrol portal yang tanggalnya masih di depan)
  kontrol_poli     text,
  kontrol_dokter   text,
  kontrol_instruksi text,
  catatan       text,
  sumber        text not null default 'PORTAL',
  sumber_id     text,          -- id baris asli di portal
  created_at    timestamptz not null default now(),
  created_by    uuid references pegawai(id)
);

-- Impor yang diulang tidak boleh menggandakan riwayat. Kuncinya id asli
-- di portal, bukan tanggal: pasien yang benar-benar mengambil obat dua
-- kali di bulan yang sama (obat hilang, dosis diubah) punya dua baris di
-- portal dengan dua id berbeda, dan keduanya memang harus masuk.
create unique index if not exists uq_kronis_riwayat_sumber
  on kronis_riwayat_luar (sumber, jenis, sumber_id)
  where sumber_id is not null;
create index if not exists idx_kronis_riwayat_pasien
  on kronis_riwayat_luar (pasien_id, jenis, tanggal desc);


-- =====================================================================
--  E. TABEL TITIPAN MIGRASI
-- =====================================================================

-- E1. Satu baris = satu ORANG menurut catatan portal.
--
-- Kuncinya persis mengikuti labKunciPasien() di portal:
--   'b:' + angka nomor BPJS bila ada, kalau tidak 'n:' + nama huruf kecil.
-- Dipakai sama supaya pasien yang di portal terhitung satu orang tidak
-- pecah jadi dua di sini — dan sebaliknya.
create table if not exists kronis_impor_pasien (
  id            bigserial primary key,
  kunci         text not null unique,
  nama_pasien   text not null,
  no_bpjs       text,
  no_telp       text,
  -- Ringkasan isi, supaya halaman pencocokan bisa mengurutkan yang
  -- paling banyak riwayatnya lebih dulu tanpa menghitung ulang.
  jml_obat      integer not null default 0,
  jml_lab       integer not null default 0,
  jml_kontrol   integer not null default 0,
  punya_terapi  boolean not null default false,
  diagnosis_teks text,
  status        text not null default 'MENUNGGU'
                check (status in ('MENUNGGU','COCOK','ABAIKAN')),
  pasien_id     uuid references pasien(id) on delete set null,
  alasan        text,
  dicocokkan_oleh uuid references pegawai(id),
  dicocokkan_pada timestamptz,
  created_at    timestamptz not null default now()
);

-- Satu pasien RME hanya boleh jadi tujuan satu baris titipan. Tanpa ini,
-- dua ejaan nama yang sama-sama ditempel ke orang yang sama akan
-- menggandakan seluruh riwayatnya, dan grafik kepatuhannya jadi mustahil
-- dibaca. Kalau memang dua baris portal adalah orang yang sama, yang
-- benar adalah menggabungnya di halaman pencocokan, bukan menempel dua kali.
create unique index if not exists uq_kronis_impor_pasien
  on kronis_impor_pasien (pasien_id) where pasien_id is not null;
create index if not exists idx_kronis_impor_status
  on kronis_impor_pasien (status, nama_pasien);


-- E2. Baris mentah dari portal, apa adanya.
--
-- isi disimpan sebagai jsonb utuh — bukan dipecah ke kolom — karena
-- tujuannya bertahan terhadap kolom portal yang tidak saya ketahui.
-- Sekali baris ini dituangkan, `dituang` menjadi true dan tidak pernah
-- dituangkan lagi, sehingga impor ulang aman.
create table if not exists kronis_impor_baris (
  id        bigserial primary key,
  impor_id  bigint not null references kronis_impor_pasien(id) on delete cascade,
  sumber    text not null check (sumber in
              ('KRONIS_TERAPI','OBAT_KRONIS','LAB_RUTIN','PASIEN_KONTROL')),
  sumber_id text,
  tanggal   date,
  isi       jsonb not null,
  dituang   boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_kronis_impor_baris
  on kronis_impor_baris (sumber, sumber_id) where sumber_id is not null;
create index if not exists idx_kronis_impor_baris_impor
  on kronis_impor_baris (impor_id, sumber, tanggal);


-- =====================================================================
--  F. FUNGSI BANTU
-- =====================================================================

-- F1. Kunci pasien versi portal. Ditulis sekali di sini dan dipakai
--     oleh impor maupun uji, supaya tidak ada dua definisi yang
--     perlahan menyimpang.
create or replace function public.kronis_kunci(p_nama text, p_bpjs text)
returns text language sql immutable as $$
  select case
    when coalesce(regexp_replace(coalesce(p_bpjs,''), '\D', '', 'g'), '') <> ''
      then 'b:' || regexp_replace(p_bpjs, '\D', '', 'g')
    else 'n:' || lower(btrim(coalesce(p_nama,'')))
  end
$$;

-- F2. Memetakan tulisan diagnosis portal ke kode ref_kronis_diagnosa.
--     Portal menulis 'Hipertensi, Diabetes Melitus' pada obat kronis dan
--     'HPT+DM' pada lab rutin. Keduanya dipecah di sini: koma, tanda
--     tambah, dan garis miring sama-sama dianggap pemisah.
create or replace function public.kronis_kode_diagnosa(p_teks text)
returns text[] language sql stable as $$
  select coalesce(array_agg(distinct d.kode order by d.kode), '{}')
    from unnest(string_to_array(
           regexp_replace(coalesce(p_teks,''), '[+/;]', ',', 'g'), ',')) as potong(kata)
    join ref_kronis_diagnosa d
      on exists (
        select 1 from unnest(d.alias) a
         where lower(btrim(a)) = lower(btrim(potong.kata))
      )
$$;

grant execute on function public.kronis_kunci(text, text)   to authenticated;
grant execute on function public.kronis_kode_diagnosa(text) to authenticated;


-- =====================================================================
--  G. MENAMPUNG DATA PORTAL
-- =====================================================================

-- Menerima satu larik jsonb berisi baris apa adanya dari portal.
-- Mengelompokkannya per orang, dan memulangkan berapa yang masuk.
--
-- Dipanggil berulang tidak menggandakan apa pun: baris dikenali dari
-- (sumber, sumber_id), dan id portal tidak pernah berubah.
create or replace function public.kronis_impor_tampung(
  p_sumber text,
  p_baris  jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_row     jsonb;
  v_nama    text;
  v_bpjs    text;
  v_telp    text;
  v_kunci   text;
  v_impor   bigint;
  v_sid     text;
  v_tgl     date;
  v_masuk   int := 0;
  v_lewat   int := 0;
  v_orang   int := 0;
begin
  if not public.boleh_kronis_migrasi() then
    raise exception 'Hanya admin yang boleh memasukkan data migrasi.'
      using errcode = '42501';
  end if;
  if p_sumber not in ('KRONIS_TERAPI','OBAT_KRONIS','LAB_RUTIN','PASIEN_KONTROL') then
    raise exception 'Sumber "%" tidak dikenal.', p_sumber;
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_baris, '[]'::jsonb))
  loop
    v_nama := btrim(coalesce(v_row->>'nama_pasien', ''));
    if v_nama = '' then v_lewat := v_lewat + 1; continue; end if;

    v_bpjs := nullif(btrim(coalesce(v_row->>'no_bpjs','')), '');
    -- pasien_kontrol memakai no_wa, tiga tabel lain memakai no_telp.
    v_telp := nullif(btrim(coalesce(v_row->>'no_telp', v_row->>'no_wa', '')), '');
    v_kunci := public.kronis_kunci(v_nama, v_bpjs);
    v_sid  := nullif(btrim(coalesce(v_row->>'id','')), '');

    v_tgl := nullif(coalesce(
               v_row->>'tanggal_ambil', v_row->>'tanggal_lab',
               v_row->>'tanggal_kontrol', v_row->>'tanggal_ambil_terakhir'), '')::date;

    insert into kronis_impor_pasien (kunci, nama_pasien, no_bpjs, no_telp)
    values (v_kunci, v_nama, v_bpjs, v_telp)
    on conflict (kunci) do update
       set nama_pasien = case when kronis_impor_pasien.no_bpjs is null
                              then excluded.nama_pasien
                              else kronis_impor_pasien.nama_pasien end,
           no_telp = coalesce(kronis_impor_pasien.no_telp, excluded.no_telp)
    returning id into v_impor;

    if v_impor is null then
      select id into v_impor from kronis_impor_pasien where kunci = v_kunci;
    else
      v_orang := v_orang + 1;
    end if;

    begin
      insert into kronis_impor_baris (impor_id, sumber, sumber_id, tanggal, isi)
      values (v_impor, p_sumber, v_sid, v_tgl, v_row);
      v_masuk := v_masuk + 1;
    exception when unique_violation then
      v_lewat := v_lewat + 1;   -- baris ini sudah pernah masuk
    end;
  end loop;

  -- Ringkasan per orang dihitung ulang, bukan dinaikkan satu-satu: impor
  -- yang diulang sebagian tidak boleh membuat angkanya menggelembung.
  update kronis_impor_pasien p set
    jml_obat    = (select count(*) from kronis_impor_baris b
                    where b.impor_id = p.id and b.sumber = 'OBAT_KRONIS'),
    jml_lab     = (select count(*) from kronis_impor_baris b
                    where b.impor_id = p.id and b.sumber = 'LAB_RUTIN'),
    jml_kontrol = (select count(*) from kronis_impor_baris b
                    where b.impor_id = p.id and b.sumber = 'PASIEN_KONTROL'),
    punya_terapi = exists (select 1 from kronis_impor_baris b
                    where b.impor_id = p.id and b.sumber = 'KRONIS_TERAPI'),
    diagnosis_teks = coalesce(
      (select b.isi->>'diagnosis' from kronis_impor_baris b
        where b.impor_id = p.id and b.sumber = 'KRONIS_TERAPI' limit 1),
      (select b.isi->>'diagnosa' from kronis_impor_baris b
        where b.impor_id = p.id and b.sumber = 'LAB_RUTIN'
        order by b.tanggal desc nulls last limit 1),
      p.diagnosis_teks)
  where exists (select 1 from kronis_impor_baris b where b.impor_id = p.id);

  return jsonb_build_object(
    'sumber', p_sumber, 'masuk', v_masuk, 'dilewati', v_lewat, 'orang_baru', v_orang);
end $$;

grant execute on function public.kronis_impor_tampung(text, jsonb) to authenticated;


-- =====================================================================
--  H. MENCOCOKKAN & MENUANGKAN
-- =====================================================================

-- H1. Usulan pasangan untuk satu baris titipan.
--
-- Tiga tingkat, dan urutannya penting:
--   1. Nomor BPJS sama persis  -> skor 100
--   2. Nama sama persis        -> skor  90
--   3. Nama mirip (trigram)    -> skor  di bawah itu
--
-- Perhatikan yang TIDAK dilakukan: nomor BPJS yang cocok pun tetap hanya
-- jadi USULAN. pasien.no_bpjs tidak unik di RME, dan satu digit salah
-- ketik saat pendaftaran sudah cukup untuk menempelkan riwayat penyakit
-- seseorang ke orang lain.
create or replace function public.kronis_impor_usulan(p_impor_id bigint, p_batas int default 8)
returns table (
  pasien_id uuid, no_rm text, nama text, tanggal_lahir date,
  jenis_kelamin jenis_kelamin_t, no_bpjs text, nik text, alamat text,
  skor numeric, alasan text
)
language sql stable security definer set search_path = public as $$
  with t as (select * from kronis_impor_pasien where id = p_impor_id),
  bpjs as (select regexp_replace(coalesce((select no_bpjs from t),''), '\D', '', 'g') as n)
  select p.id, p.no_rm, p.nama, p.tanggal_lahir, p.jenis_kelamin,
         p.no_bpjs, p.nik, p.alamat,
         greatest(
           case when (select n from bpjs) <> ''
                 and regexp_replace(coalesce(p.no_bpjs,''), '\D', '', 'g') = (select n from bpjs)
                then 100 else 0 end,
           case when lower(btrim(p.nama)) = lower(btrim((select nama_pasien from t)))
                then 90 else 0 end,
           round(similarity(p.nama, (select nama_pasien from t))::numeric * 80, 1)
         ) as skor,
         case
           when (select n from bpjs) <> ''
            and regexp_replace(coalesce(p.no_bpjs,''), '\D', '', 'g') = (select n from bpjs)
             then 'Nomor BPJS sama'
           when lower(btrim(p.nama)) = lower(btrim((select nama_pasien from t)))
             then 'Nama sama persis'
           else 'Nama mirip'
         end as alasan
    from pasien p
   where p.aktif
     and (
       ((select n from bpjs) <> ''
         and regexp_replace(coalesce(p.no_bpjs,''), '\D', '', 'g') = (select n from bpjs))
       or similarity(p.nama, (select nama_pasien from t)) > 0.25
     )
     -- Pasien yang sudah jadi tujuan baris titipan lain tidak diusulkan lagi.
     and not exists (select 1 from kronis_impor_pasien k
                      where k.pasien_id = p.id and k.id <> p_impor_id)
   order by skor desc, p.nama
   limit greatest(1, coalesce(p_batas, 8));
$$;

grant execute on function public.kronis_impor_usulan(bigint, int) to authenticated;


-- H2. Menempelkan satu baris titipan ke seorang pasien, lalu menuangkan
--     isinya. Seluruhnya satu transaksi: kalau ada yang gagal di tengah,
--     tidak ada separuh riwayat yang tertinggal.
create or replace function public.kronis_impor_cocokkan(
  p_impor_id bigint,
  p_pasien_id uuid
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_t        kronis_impor_pasien%rowtype;
  v_b        kronis_impor_baris%rowtype;
  v_terapi   uuid;
  v_kode     text[];
  v_k        text;
  v_obat     int := 0;
  v_lab      int := 0;
  v_kontrol  int := 0;
  v_kuota    ref_kronis_kuota_obat%rowtype;
  v_nama_st  text;
  v_hari_ini date := public.tgl_klinik();
begin
  if not public.boleh_kronis_migrasi() then
    raise exception 'Hanya admin yang boleh mencocokkan data migrasi.'
      using errcode = '42501';
  end if;

  select * into v_t from kronis_impor_pasien where id = p_impor_id for update;
  if not found then raise exception 'Baris titipan tidak ditemukan.'; end if;
  if v_t.status = 'COCOK' then
    raise exception 'Baris ini sudah dicocokkan ke pasien lain. Batalkan dulu bila keliru.';
  end if;
  if not exists (select 1 from pasien where id = p_pasien_id) then
    raise exception 'Pasien tidak ditemukan.';
  end if;
  if exists (select 1 from kronis_impor_pasien
              where pasien_id = p_pasien_id and id <> p_impor_id) then
    raise exception 'Pasien ini sudah jadi tujuan baris titipan lain. '
                    'Gabungkan dua barisnya dulu, jangan ditempel dua kali.';
  end if;

  update kronis_impor_pasien
     set status = 'COCOK', pasien_id = p_pasien_id,
         dicocokkan_oleh = auth.uid(), dicocokkan_pada = now(), alasan = null
   where id = p_impor_id;

  -- --- Pendaftaran buku kronis --------------------------------------
  select * into v_b from kronis_impor_baris
   where impor_id = p_impor_id and sumber = 'KRONIS_TERAPI' and not dituang
   order by id limit 1;

  if found then
    select id into v_terapi from kronis_terapi
     where pasien_id = p_pasien_id and aktif;

    if v_terapi is null then
      v_nama_st := nullif(btrim(coalesce(v_b.isi->>'statin_obat','')), '');
      if v_nama_st is not null then
        select * into v_kuota from ref_kronis_kuota_obat
         where aktif and position(kunci in lower(v_nama_st)) > 0 limit 1;
      end if;

      insert into kronis_terapi (
        pasien_id, aktif, tanggal_mulai, catatan,
        statin_kunci, statin_nama, statin_tgl_lab, created_by)
      values (
        p_pasien_id,
        coalesce((v_b.isi->>'aktif')::boolean, true),
        least(coalesce(nullif(v_b.isi->>'tanggal_ambil_terakhir','')::date, v_hari_ini), v_hari_ini),
        'Dipindahkan dari portal sipantau.',
        v_kuota.kunci, v_nama_st,
        nullif(v_b.isi->>'statin_tanggal_lab','')::date,
        auth.uid())
      returning id into v_terapi;

      -- Diagnosis
      v_kode := public.kronis_kode_diagnosa(v_b.isi->>'diagnosis');
      foreach v_k in array v_kode loop
        insert into kronis_terapi_diagnosa (terapi_id, kode) values (v_terapi, v_k)
        on conflict do nothing;
      end loop;

      -- Obat rutin: teks bebas portal dipecah per baris. Yang cocok
      -- namanya dengan master obat langsung bertaut; yang tidak, tetap
      -- disimpan tanpa taut dan akan muncul sebagai peringatan di layar.
      insert into kronis_obat (terapi_id, obat_id, nama_obat, urutan)
      select v_terapi,
             (select o.id from obat o
               where o.aktif and lower(o.nama) = lower(btrim(baris.teks)) limit 1),
             btrim(baris.teks), baris.urut
        from unnest(string_to_array(coalesce(v_b.isi->>'resep_tetap',''), E'\n'))
             with ordinality as baris(teks, urut)
       where btrim(coalesce(baris.teks,'')) <> '';
    end if;

    update kronis_impor_baris set dituang = true where id = v_b.id;
  end if;

  -- --- Riwayat pengambilan obat --------------------------------------
  insert into kronis_riwayat_luar (
    pasien_id, jenis, tanggal, resep_teks, catatan, sumber_id, created_by)
  select p_pasien_id, 'AMBIL_OBAT',
         (b.isi->>'tanggal_ambil')::date,
         nullif(btrim(coalesce(b.isi->>'resep_obat','')), ''),
         nullif(btrim(coalesce(b.isi->>'diagnosis','')), ''),
         b.sumber_id, auth.uid()
    from kronis_impor_baris b
   where b.impor_id = p_impor_id and b.sumber = 'OBAT_KRONIS'
     and not b.dituang and nullif(b.isi->>'tanggal_ambil','') is not null
  on conflict do nothing;
  get diagnostics v_obat = row_count;

  -- --- Riwayat pemeriksaan lab ---------------------------------------
  insert into kronis_riwayat_luar (
    pasien_id, jenis, tanggal, lab_diagnosa, lab_pemeriksa, catatan, sumber_id, created_by)
  select p_pasien_id, 'LAB',
         (b.isi->>'tanggal_lab')::date,
         nullif(btrim(coalesce(b.isi->>'diagnosa','')), ''),
         nullif(btrim(coalesce(b.isi->>'lab_pemeriksa','')), ''),
         nullif(btrim(coalesce(b.isi->>'catatan','')), ''),
         b.sumber_id, auth.uid()
    from kronis_impor_baris b
   where b.impor_id = p_impor_id and b.sumber = 'LAB_RUTIN'
     and not b.dituang and nullif(b.isi->>'tanggal_lab','') is not null
  on conflict do nothing;
  get diagnostics v_lab = row_count;

  -- --- Jadwal kontrol yang masih di depan -----------------------------
  --
  -- Hanya yang tanggalnya belum lewat. Jadwal kontrol yang sudah berlalu
  -- tidak ada gunanya dibawa: ia bukan riwayat penyakit, hanya pengingat
  -- yang sudah kedaluwarsa. Yang masih di depan justru wajib dibawa —
  -- kalau tidak, pasien yang seharusnya ditelepon minggu depan hilang
  -- begitu saja saat portal dipensiunkan.
  insert into kronis_riwayat_luar (
    pasien_id, jenis, tanggal, kontrol_poli, kontrol_dokter, kontrol_instruksi,
    catatan, sumber_id, created_by)
  select p_pasien_id, 'KONTROL',
         (b.isi->>'tanggal_kontrol')::date,
         nullif(btrim(coalesce(b.isi->>'poli_asal','')), ''),
         nullif(btrim(coalesce(b.isi->>'nama_dokter','')), ''),
         nullif(btrim(coalesce(b.isi->>'instruksi_petugas','')), ''),
         nullif(btrim(coalesce(b.isi->>'diagnosa','')), ''),
         b.sumber_id, auth.uid()
    from kronis_impor_baris b
   where b.impor_id = p_impor_id and b.sumber = 'PASIEN_KONTROL'
     and not b.dituang
     and nullif(b.isi->>'tanggal_kontrol','') is not null
     and (b.isi->>'tanggal_kontrol')::date >= v_hari_ini
  on conflict do nothing;
  get diagnostics v_kontrol = row_count;

  update kronis_impor_baris set dituang = true
   where impor_id = p_impor_id and not dituang;

  return jsonb_build_object(
    'impor_id', p_impor_id, 'pasien_id', p_pasien_id,
    'terapi', v_terapi is not null,
    'ambil_obat', v_obat, 'lab', v_lab, 'kontrol', v_kontrol);
end $$;

grant execute on function public.kronis_impor_cocokkan(bigint, uuid) to authenticated;


-- H3. Membatalkan pencocokan yang keliru.
--
-- Wajib ada. Halaman yang bisa menempel tapi tidak bisa melepas akan
-- membuat petugas ragu menekan tombolnya, lalu seluruh pencocokan
-- berhenti di baris pertama yang meragukan.
create or replace function public.kronis_impor_batal_cocok(p_impor_id bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_t       kronis_impor_pasien%rowtype;
  v_hapus   int := 0;
  v_terapi  uuid;
begin
  if not public.boleh_kronis_migrasi() then
    raise exception 'Hanya admin yang boleh membatalkan pencocokan.'
      using errcode = '42501';
  end if;

  select * into v_t from kronis_impor_pasien where id = p_impor_id for update;
  if not found then raise exception 'Baris titipan tidak ditemukan.'; end if;
  if v_t.status <> 'COCOK' or v_t.pasien_id is null then
    raise exception 'Baris ini belum dicocokkan.';
  end if;

  -- Hanya riwayat yang berasal dari baris titipan INI yang dicabut.
  delete from kronis_riwayat_luar r
   where r.pasien_id = v_t.pasien_id
     and r.sumber = 'PORTAL'
     and r.sumber_id in (select b.sumber_id from kronis_impor_baris b
                          where b.impor_id = p_impor_id and b.sumber_id is not null);
  get diagnostics v_hapus = row_count;

  -- Pendaftaran buku kronis ikut dicabut HANYA bila ia memang lahir dari
  -- migrasi ini dan belum dipakai sesudahnya.
  select id into v_terapi from kronis_terapi
   where pasien_id = v_t.pasien_id and aktif
     and catatan = 'Dipindahkan dari portal sipantau.';
  if v_terapi is not null then
    delete from kronis_terapi where id = v_terapi;
  end if;

  update kronis_impor_baris set dituang = false where impor_id = p_impor_id;
  update kronis_impor_pasien
     set status = 'MENUNGGU', pasien_id = null,
         dicocokkan_oleh = null, dicocokkan_pada = null
   where id = p_impor_id;

  return jsonb_build_object('impor_id', p_impor_id,
    'riwayat_dicabut', v_hapus, 'terapi_dicabut', v_terapi is not null);
end $$;

grant execute on function public.kronis_impor_batal_cocok(bigint) to authenticated;


-- H4. Menandai baris titipan sebagai tidak perlu dipindah.
create or replace function public.kronis_impor_abaikan(p_impor_id bigint, p_alasan text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.boleh_kronis_migrasi() then
    raise exception 'Hanya admin yang boleh mengubah data migrasi.'
      using errcode = '42501';
  end if;
  if exists (select 1 from kronis_impor_pasien where id = p_impor_id and status = 'COCOK') then
    raise exception 'Baris ini sudah dicocokkan. Batalkan pencocokannya lebih dulu.';
  end if;
  update kronis_impor_pasien
     set status = 'ABAIKAN', alasan = nullif(btrim(coalesce(p_alasan,'')), ''),
         dicocokkan_oleh = auth.uid(), dicocokkan_pada = now()
   where id = p_impor_id;
  if not found then raise exception 'Baris titipan tidak ditemukan.'; end if;
  return jsonb_build_object('impor_id', p_impor_id, 'status', 'ABAIKAN');
end $$;

grant execute on function public.kronis_impor_abaikan(bigint, text) to authenticated;


-- H5. Menempelkan ulang seluruh baris MENUNGGU yang nomor BPJS-nya kini
--     cocok persis dengan seorang pasien.
--
-- Inilah yang membuat "riwayat menempel sendiri begitu pasiennya
-- didaftarkan" benar-benar terjadi: dijalankan dari tombol di halaman
-- pencocokan setelah sekelompok pasien baru didaftarkan.
--
-- Hanya kecocokan BPJS PERSIS, dan hanya bila nomor itu menunjuk ke
-- SATU pasien. Nama mirip tidak pernah ditempel sendiri.
create or replace function public.kronis_impor_cocokkan_otomatis()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r        record;
  v_ok     int := 0;
  v_gagal  int := 0;
  v_pesan  text[] := '{}';
begin
  if not public.boleh_kronis_migrasi() then
    raise exception 'Hanya admin yang boleh mencocokkan data migrasi.'
      using errcode = '42501';
  end if;

  for r in
    select k.id as impor_id,
           -- limit 1 bukan kelalaian: berapa banyak yang cocok dijawab oleh
           -- kolom jml di bawah. Subquery skalar yang memulangkan dua baris
           -- meledak dengan "more than one row returned" — persis pada
           -- nomor BPJS ganda, yaitu keadaan yang justru harus ditangani
           -- dengan tenang, bukan dengan galat di tengah impor.
           (select p.id from pasien p
             where p.aktif
               and regexp_replace(coalesce(p.no_bpjs,''), '\D', '', 'g')
                 = regexp_replace(k.no_bpjs, '\D', '', 'g')
             limit 1) as pasien_id,
           (select count(*) from pasien p
             where p.aktif
               and regexp_replace(coalesce(p.no_bpjs,''), '\D', '', 'g')
                 = regexp_replace(k.no_bpjs, '\D', '', 'g')) as jml
      from kronis_impor_pasien k
     where k.status = 'MENUNGGU'
       and nullif(regexp_replace(coalesce(k.no_bpjs,''), '\D', '', 'g'), '') is not null
     order by k.id
  loop
    -- Nomor BPJS yang menunjuk ke dua pasien adalah tanda salah ketik di
    -- salah satunya. Ditinggalkan untuk dilihat manusia, bukan ditebak.
    if r.jml <> 1 or r.pasien_id is null then
      v_gagal := v_gagal + 1; continue;
    end if;
    begin
      perform public.kronis_impor_cocokkan(r.impor_id, r.pasien_id);
      v_ok := v_ok + 1;
    exception when others then
      v_gagal := v_gagal + 1;
      v_pesan := v_pesan || (r.impor_id::text || ': ' || sqlerrm);
    end;
  end loop;

  return jsonb_build_object('tertempel', v_ok, 'tersisa', v_gagal, 'pesan', to_jsonb(v_pesan));
end $$;

grant execute on function public.kronis_impor_cocokkan_otomatis() to authenticated;


-- H6. Membuang seluruh data titipan yang sudah selesai dikerjakan.
create or replace function public.kronis_impor_bersihkan(p_semua boolean default false)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_n int;
begin
  if not public.boleh_kronis_migrasi() then
    raise exception 'Hanya admin yang boleh membersihkan data migrasi.'
      using errcode = '42501';
  end if;
  if p_semua then
    delete from kronis_impor_pasien;
  else
    delete from kronis_impor_pasien where status in ('COCOK','ABAIKAN');
  end if;
  get diagnostics v_n = row_count;
  return jsonb_build_object('dihapus', v_n);
end $$;

grant execute on function public.kronis_impor_bersihkan(boolean) to authenticated;


-- =====================================================================
--  I. KOLOM TAMBAHAN PADA TABEL YANG SUDAH ADA
-- =====================================================================

-- Instruksi untuk petugas yang menelepon pasien H-1 sebelum kontrol.
-- Padanan instruksi_petugas di portal.
--
-- Ditulis DOKTER saat memeriksa, dibaca PETUGAS saat menelepon. Tanpa
-- kolom ini petugas harus menebak sendiri apakah pasien perlu puasa —
-- dan tebakan yang salah membuat pasien datang, gagal diperiksa, dan
-- pulang lagi.
alter table pemeriksaan add column if not exists kontrol_instruksi text;

comment on column pemeriksaan.kontrol_instruksi is
  'Pesan untuk petugas yang menghubungi pasien H-1 sebelum tanggal_kontrol,
   mis. "ingatkan puasa 10 jam sebelum datang".';


-- =====================================================================
--  J. HAK AKSES TABEL
--
--  Tabel baru TIDAK mewarisi GRANT dari 02_rls.sql — dua kali tertimpa
--  pelajaran ini (apotek_batch, lalu view modul penunjang). Ditulis
--  eksplisit di sini untuk setiap tabel.
-- =====================================================================

grant select on ref_kronis_diagnosa, ref_kronis_lab, ref_kronis_kuota_obat to authenticated;
grant select, insert, update, delete on
  kronis_terapi, kronis_terapi_diagnosa, kronis_obat to authenticated;
grant select on kronis_riwayat_luar to authenticated;
grant select on kronis_impor_pasien, kronis_impor_baris to authenticated;
grant usage, select on sequence kronis_impor_pasien_id_seq to authenticated;
grant usage, select on sequence kronis_impor_baris_id_seq  to authenticated;

alter table ref_kronis_diagnosa    enable row level security;
alter table ref_kronis_lab         enable row level security;
alter table ref_kronis_kuota_obat  enable row level security;
alter table kronis_terapi          enable row level security;
alter table kronis_terapi_diagnosa enable row level security;
alter table kronis_obat            enable row level security;
alter table kronis_riwayat_luar    enable row level security;
alter table kronis_impor_pasien    enable row level security;
alter table kronis_impor_baris     enable row level security;

-- Referensi: dibaca semua staf, diubah kode `master_data`.
do $$
declare t text;
begin
  foreach t in array array['ref_kronis_diagnosa','ref_kronis_lab','ref_kronis_kuota_obat']
  loop
    execute format($f$drop policy if exists %I on %I$f$, t || '_baca', t);
    execute format($f$create policy %I on %I for select
                     to authenticated using (public.saya_staf())$f$, t || '_baca', t);
    execute format($f$drop policy if exists %I on %I$f$, t || '_kelola', t);
    execute format($f$create policy %I on %I for all to authenticated
                     using (public.boleh_master_data())
                     with check (public.boleh_master_data())$f$, t || '_kelola', t);
  end loop;
end $$;

-- Pendaftaran buku kronis: dibaca semua staf, ditulis admin/dokter/perawat.
drop policy if exists kronis_terapi_baca on kronis_terapi;
create policy kronis_terapi_baca on kronis_terapi for select
  to authenticated using (public.saya_staf());

drop policy if exists kronis_terapi_tulis on kronis_terapi;
create policy kronis_terapi_tulis on kronis_terapi for all
  to authenticated
  using (public.boleh_kronis_kelola())
  with check (public.boleh_kronis_kelola());

do $$
declare t text;
begin
  foreach t in array array['kronis_terapi_diagnosa','kronis_obat']
  loop
    execute format($f$drop policy if exists %I on %I$f$, t || '_baca', t);
    execute format($f$create policy %I on %I for select
                     to authenticated using (public.saya_staf())$f$, t || '_baca', t);
    execute format($f$drop policy if exists %I on %I$f$, t || '_tulis', t);
    execute format($f$create policy %I on %I for all to authenticated
                     using (public.boleh_kronis_kelola())
                     with check (public.boleh_kronis_kelola())$f$, t || '_tulis', t);
  end loop;
end $$;

-- Riwayat luar & tabel titipan: dibaca staf, ditulis HANYA lewat fungsi
-- security definer di atas. Tidak ada policy tulis sama sekali — bukan
-- kelalaian: menempelkan riwayat orang lain ke rekam medis seseorang
-- tidak boleh bisa dilakukan dengan satu permintaan PostgREST.
drop policy if exists kronis_riwayat_baca on kronis_riwayat_luar;
create policy kronis_riwayat_baca on kronis_riwayat_luar for select
  to authenticated using (public.saya_staf());

drop policy if exists kronis_impor_pasien_baca on kronis_impor_pasien;
create policy kronis_impor_pasien_baca on kronis_impor_pasien for select
  to authenticated using (public.boleh_kronis_migrasi());

drop policy if exists kronis_impor_baris_baca on kronis_impor_baris;
create policy kronis_impor_baris_baca on kronis_impor_baris for select
  to authenticated using (public.boleh_kronis_migrasi());


-- =====================================================================
--  K. RINGKASAN MIGRASI (untuk kepala halaman pencocokan)
-- =====================================================================

create or replace view v_kronis_impor_ringkas with (security_invoker = true) as
select
  count(*)                                              as total,
  count(*) filter (where status = 'MENUNGGU')           as menunggu,
  count(*) filter (where status = 'COCOK')              as cocok,
  count(*) filter (where status = 'ABAIKAN')            as abaikan,
  coalesce(sum(jml_obat), 0)                            as baris_obat,
  coalesce(sum(jml_lab), 0)                             as baris_lab,
  coalesce(sum(jml_kontrol), 0)                         as baris_kontrol,
  count(*) filter (where status = 'MENUNGGU'
                     and nullif(regexp_replace(coalesce(no_bpjs,''), '\D', '', 'g'),'') is null)
                                                        as menunggu_tanpa_bpjs
  from kronis_impor_pasien;

grant select on v_kronis_impor_ringkas to authenticated;

comment on view v_kronis_impor_ringkas is
  'Ringkasan pekerjaan pencocokan data portal. security_invoker: yang tidak
   boleh membaca kronis_impor_pasien tidak akan melihat angkanya juga.';
-- =====================================================================
--  RME Laboratorium Medis Utama - PEMISAHAN KOLAM STOK (KRONIS vs REGULER)
--  Jalankan SETELAH 16_kronis.sql
--
--  Tahap 1b dari modul pemantauan kronis. Sebelum tahap ini, seluruh stok
--  apotek adalah satu kolam. Klinik membeli obat kronis dengan dana
--  sendiri (bukan titipan BPJS), tetapi tetap ingin mencatatnya terpisah
--  dari stok obat resep biasa — dan menurut klinik sendiri, pemisahan ini
--  TIDAK mutlak: kalau satu kolam habis, boleh sementara memakai kolam
--  lain. Karena itu tahap ini TIDAK memasang sekat keras. Yang dipasang:
--
--   1. Setiap batch dan setiap baris transaksi mencatat `kolam`nya
--      ('reguler' atau 'kronis'), sehingga nilai aset dan pemakaian bisa
--      dilaporkan terpisah.
--   2. FEFO tetap jalan seperti biasa, hanya diberi PRIORITAS: resep obat
--      kronis pasien buku kronis mengutamakan batch kolam kronis lebih
--      dulu, baru pindah ke kolam reguler kalau kolam kronis kosong —
--      dan sebaliknya untuk resep biasa. Stok TIDAK PERNAH ditolak hanya
--      karena kolamnya kosong.
--
--  KENAPA BUKAN TABEL OBAT KEDUA
--
--  Alternatif yang lebih sederhana kelihatannya adalah membuat baris obat
--  kedua, misalnya "Amlodipine 5mg (Kronis)". Itu akan diam-diam merusak
--  seluruh tautan `kronis_obat.obat_id` yang baru saja dibuat migrasi
--  Tahap 1 — persis kelas kesalahan yang sama dengan `poli.jenis` dan
--  `obat.dpho` dulu: fitur berhenti bekerja tanpa satu pun galat.
--  Pemisahannya karena itu dipasang di tingkat BATCH, bukan di tingkat
--  obat: satu obat, banyak batch, tiap batch tahu kolamnya sendiri.
--
--  KENAPA BUKAN TIPE ENUM
--
--  Menambah nilai enum di tengah jalan butuh transaksi terisolasi
--  (pelajaran panjang di 07_peran_kasir.sql). `kolam` karena itu memakai
--  `text` dengan CHECK, seperti `jenis` di apotek_transaksi.
--
--  AMAN dijalankan berulang pada database berisi data.
-- =====================================================================


-- =====================================================================
--  A. KOLOM KOLAM PADA BATCH & TRANSAKSI
-- =====================================================================

alter table apotek_batch     add column if not exists kolam text not null default 'reguler';
alter table apotek_transaksi add column if not exists kolam text not null default 'reguler';

alter table apotek_batch     drop constraint if exists ck_batch_kolam;
alter table apotek_batch     add  constraint ck_batch_kolam check (kolam in ('reguler','kronis'));
alter table apotek_transaksi drop constraint if exists ck_trx_kolam;
alter table apotek_transaksi add  constraint ck_trx_kolam check (kolam in ('reguler','kronis'));

comment on column apotek_batch.kolam is
  'Kolam pencatatan: ''reguler'' atau ''kronis''. Bukan sekat keras — lihat
   catatan FEFO di apotek_keluar(). Klinik membeli sendiri obat kronisnya,
   jadi ini murni pemisahan pencatatan/pelaporan, bukan soal kepemilikan.';
comment on column apotek_transaksi.kolam is
  'Kolam BATCH yang benar-benar terpotong/terisi baris ini — bukan kolam
   yang "diinginkan". Dipakai untuk laporan pemakaian per kolam yang jujur,
   termasuk saat FEFO terpaksa menyeberang kolam.';

-- Batch identik digabung berdasarkan gabungan (obat, expired, faktur, pbf,
-- harga) — lihat 08_apotek.sql §B1. Kolam ditambahkan ke gabungan itu:
-- tanpa ini, batch kronis dan batch reguler dengan faktur/harga yang
-- kebetulan sama akan MENYATU jadi satu baris dan kolamnya hilang.
drop index if exists uq_batch_identik;
create unique index uq_batch_identik on apotek_batch
  (obat_id, tgl_expired, coalesce(no_faktur,''), lower(pbf), harga_beli, kolam);


-- =====================================================================
--  B. KOLAM YANG DISUKAI SEBUAH RESEP
-- =====================================================================

-- Menjawab: "obat ini, untuk pasien ini, bagian dari terapi kronisnya?"
-- `language sql` sengaja dipilih (bukan plpgsql): fungsi bahasa SQL
-- diperiksa terhadap katalog SAAT DIBUAT, sehingga kalau berkas ini
-- ternyata dijalankan sebelum 16_kronis.sql, kesalahannya langsung
-- muncul di sini — bukan diam-diam lolos dan baru meledak saat resep
-- pertama diserahkan.
--
-- security definer: apoteker tidak (dan tidak perlu) diberi hak SELECT
-- langsung ke kronis_terapi/kronis_obat (lihat boleh_kronis_kelola() di
-- 16_kronis.sql, yang membatasi ke admin/dokter/perawat). Fungsi ini
-- membuka celah SEMPIT: hanya menjawab ya/tidak, tidak membocorkan
-- baris kronis apa pun ke luar.
create or replace function public.kronis_kolam_resep_item(p_pasien_id uuid, p_obat_id uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select case when exists (
           select 1 from kronis_terapi t
           join kronis_obat ko on ko.terapi_id = t.id
          where t.pasien_id = p_pasien_id
            and t.aktif
            and ko.obat_id = p_obat_id
         ) then 'kronis' else 'reguler' end
$$;

grant execute on function public.kronis_kolam_resep_item(uuid,uuid) to authenticated;


-- =====================================================================
--  C. apotek_masuk() DENGAN KOLAM
-- =====================================================================

-- Menambah parameter = fungsi baru bagi PostgreSQL (lihat catatan di
-- 10_apotek_impor.sql). Signature lama dibuang dulu.
drop function if exists public.apotek_masuk(uuid,numeric,numeric,date,text,text,date,text,text,text);

create or replace function public.apotek_masuk(
  p_obat_id     uuid,
  p_jumlah      numeric,
  p_harga_beli  numeric,
  p_tgl_expired date,
  p_pbf         text,
  p_no_faktur   text default null,
  p_tgl_masuk   date default null,
  p_no_batch    text default null,
  p_keterangan  text default null,
  p_kategori    text default 'Pembelian',
  p_kolam       text default 'reguler'
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_obat     obat%rowtype;
  v_batch    apotek_batch%rowtype;
  v_tgl      date := coalesce(p_tgl_masuk, public.tgl_klinik());
  v_grup     uuid := gen_random_uuid();
  v_digabung boolean := false;
  v_kat      text := coalesce(nullif(btrim(p_kategori), ''), 'Pembelian');
  v_kolam    text := lower(coalesce(nullif(btrim(p_kolam), ''), 'reguler'));
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh mencatat obat masuk.'
      using errcode = '42501';
  end if;
  if v_kat not in ('Pembelian', 'Saldo Awal') then
    raise exception 'Kategori pemasukan "%" tidak dikenal. Yang sah: Pembelian, Saldo Awal.', v_kat;
  end if;
  if v_kolam not in ('reguler', 'kronis') then
    raise exception 'Kolam "%" tidak dikenal. Yang sah: reguler, kronis.', v_kolam;
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah masuk harus lebih dari nol.';
  end if;
  if p_tgl_expired is null then
    raise exception 'Tanggal kadaluwarsa wajib diisi.';
  end if;
  if coalesce(btrim(p_pbf), '') = '' then
    raise exception 'Nama PBF / distributor wajib diisi.';
  end if;

  select * into v_obat from obat where id = p_obat_id;
  if not found then
    raise exception 'Obat tidak ditemukan di master obat.';
  end if;

  perform public.apotek_kunci_obat(p_obat_id);

  select * into v_batch from apotek_batch
   where obat_id = p_obat_id
     and tgl_expired = p_tgl_expired
     and coalesce(no_faktur,'') = coalesce(p_no_faktur,'')
     and lower(pbf) = lower(btrim(p_pbf))
     and harga_beli = p_harga_beli
     and kolam = v_kolam;

  if found then
    update apotek_batch
       set stok_awal  = stok_awal + p_jumlah,
           stok_sisa  = stok_sisa + p_jumlah,
           updated_at = now()
     where id = v_batch.id
     returning * into v_batch;
    v_digabung := true;
  else
    insert into apotek_batch (obat_id, no_batch, tgl_expired, tgl_masuk, no_faktur,
                              pbf, harga_beli, stok_awal, stok_sisa, keterangan, kolam, dibuat_oleh)
    values (p_obat_id, p_no_batch, p_tgl_expired, v_tgl, p_no_faktur,
            btrim(p_pbf), p_harga_beli, p_jumlah, p_jumlah, p_keterangan, v_kolam, auth.uid())
    returning * into v_batch;
  end if;

  insert into apotek_transaksi (batch_id, obat_id, nama_obat, satuan, jenis, kategori,
                                jumlah, harga_satuan, total_nilai, tanggal,
                                no_faktur, pbf, kolam, grup_id, keterangan, dibuat_oleh)
  values (v_batch.id, p_obat_id, v_obat.nama, v_obat.satuan, 'MASUK', v_kat,
          p_jumlah, p_harga_beli, p_jumlah * p_harga_beli, v_tgl,
          p_no_faktur, btrim(p_pbf), v_kolam, v_grup, p_keterangan, auth.uid());

  return jsonb_build_object(
    'batch_id',  v_batch.id,
    'grup_id',   v_grup,
    'digabung',  v_digabung,
    'kategori',  v_kat,
    'kolam',     v_kolam,
    'stok_sisa', v_batch.stok_sisa
  );
end $$;

grant execute on function
  public.apotek_masuk(uuid,numeric,numeric,date,text,text,date,text,text,text,text)
  to authenticated;


-- =====================================================================
--  D. apotek_keluar() DENGAN PRIORITAS KOLAM (BUKAN SEKAT)
-- =====================================================================

drop function if exists public.apotek_keluar(uuid,numeric,text,date,uuid,uuid,uuid,text);

create or replace function public.apotek_keluar(
  p_obat_id        uuid,
  p_jumlah         numeric,
  p_kategori       text default 'Resep Pasien',
  p_tanggal        date default null,
  p_kunjungan_id   uuid default null,
  p_resep_item_id  uuid default null,
  p_batch_id       uuid default null,
  p_keterangan     text default null,
  p_kolam_disukai  text default null   -- null = tidak ada preferensi, FEFO polos seperti sebelum tahap ini
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_obat       obat%rowtype;
  v_tgl        date := coalesce(p_tanggal, public.tgl_klinik());
  v_grup       uuid := gen_random_uuid();
  v_sisa       numeric := p_jumlah;
  v_ambil      numeric;
  v_total      numeric := 0;
  v_tersedia   numeric := 0;
  v_pemusnahan boolean;
  v_pasien     uuid;
  v_kolam_pref text := nullif(lower(btrim(coalesce(p_kolam_disukai, ''))), '');
  v_potongan   jsonb := '[]'::jsonb;
  r            record;
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh mengeluarkan obat.'
      using errcode = '42501';
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah keluar harus lebih dari nol.';
  end if;
  if not (p_kategori = any (public.apotek_kategori_keluar())) then
    raise exception 'Kategori pengeluaran "%" tidak dikenal.', p_kategori;
  end if;
  if v_kolam_pref is not null and v_kolam_pref not in ('reguler','kronis') then
    raise exception 'Kolam "%" tidak dikenal. Yang sah: reguler, kronis.', v_kolam_pref;
  end if;

  select * into v_obat from obat where id = p_obat_id;
  if not found then
    raise exception 'Obat tidak ditemukan di master obat.';
  end if;

  v_pemusnahan := p_kategori = any (public.apotek_kategori_pemusnahan());

  if p_kunjungan_id is not null then
    select pasien_id into v_pasien from kunjungan where id = p_kunjungan_id;
  end if;

  perform public.apotek_kunci_obat(p_obat_id);

  -- Cek ketersediaan LEBIH DULU, TOTAL LINTAS KOLAM. Pemisahan kolam
  -- adalah pencatatan, bukan sekat: resep tidak boleh ditolak hanya
  -- karena kolam yang disukai kebetulan kosong selama kolam lain cukup.
  select coalesce(sum(stok_sisa), 0) into v_tersedia
    from apotek_batch
   where obat_id = p_obat_id
     and stok_sisa > 0
     and (p_batch_id is null or id = p_batch_id)
     and (v_pemusnahan or tgl_expired > v_tgl);

  if v_tersedia < p_jumlah then
    raise exception 'Stok % tidak cukup. Tersedia % %, diminta %.',
      v_obat.nama, v_tersedia, v_obat.satuan, p_jumlah;
  end if;

  -- Urutan FEFO tidak berubah. Yang ditambahkan hanya pemutus seri PALING
  -- AWAL: batch di kolam yang disukai didahulukan. Kalau kolam itu habis,
  -- perulangan berlanjut ke batch kolam lain tanpa berhenti sama sekali —
  -- persis "boleh menyeberang saat darurat" yang diminta klinik.
  for r in
    select * from apotek_batch
     where obat_id = p_obat_id
       and stok_sisa > 0
       and (p_batch_id is null or id = p_batch_id)
       and (v_pemusnahan or tgl_expired > v_tgl)
     order by (case when v_kolam_pref is not null and kolam = v_kolam_pref then 0 else 1 end),
              tgl_expired, tgl_masuk, created_at, id     -- FEFO
  loop
    exit when v_sisa <= 0;

    v_ambil := least(r.stok_sisa, v_sisa);

    update apotek_batch
       set stok_sisa = stok_sisa - v_ambil, updated_at = now()
     where id = r.id;

    insert into apotek_transaksi (batch_id, obat_id, nama_obat, satuan, jenis, kategori,
                                  jumlah, harga_satuan, total_nilai, tanggal,
                                  no_faktur, pbf, kolam, kunjungan_id, pasien_id, resep_item_id,
                                  grup_id, keterangan, dibuat_oleh)
    values (r.id, p_obat_id, v_obat.nama, v_obat.satuan, 'KELUAR', p_kategori,
            v_ambil, r.harga_beli, v_ambil * r.harga_beli, v_tgl,
            r.no_faktur, r.pbf, r.kolam, p_kunjungan_id, v_pasien, p_resep_item_id,
            v_grup, p_keterangan, auth.uid());

    v_total    := v_total + v_ambil * r.harga_beli;
    v_sisa     := v_sisa - v_ambil;
    v_potongan := v_potongan || jsonb_build_object(
      'batch_id',     r.id,
      'tgl_expired',  r.tgl_expired,
      'no_faktur',    r.no_faktur,
      'pbf',          r.pbf,
      'kolam',        r.kolam,
      'jumlah',       v_ambil,
      'harga_satuan', r.harga_beli,
      'nilai',        v_ambil * r.harga_beli
    );
  end loop;

  -- Penjaga terakhir. Kalau baris ini pernah tercapai, ada yang salah
  -- pada penguncian di atas — dan lebih baik seluruh penyerahan batal
  -- daripada stok tercatat keluar setengah.
  if v_sisa > 0 then
    raise exception 'Alokasi FEFO gagal: masih kurang % %. Tidak ada yang disimpan.',
      v_sisa, v_obat.satuan;
  end if;

  return jsonb_build_object(
    'grup_id',     v_grup,
    'total_nilai', v_total,
    'potongan',    v_potongan
  );
end $$;

grant execute on function
  public.apotek_keluar(uuid,numeric,text,date,uuid,uuid,uuid,text,text)
  to authenticated;


-- =====================================================================
--  E. apotek_serahkan_resep() MEMILIH KOLAM OTOMATIS
-- =====================================================================

-- Signature TIDAK berubah — hanya isinya. Satu baris ditambahkan sebelum
-- memanggil apotek_keluar(): tanya dulu apakah obat ini bagian dari
-- terapi kronis aktif pasien ini. Apoteker tidak perlu memilih apa pun;
-- kalau salah, cukup dikoreksi lewat Edit Batch tanpa membongkar resep.
create or replace function public.apotek_serahkan_resep(
  p_resep_id  uuid,
  p_item      jsonb,
  p_tanggal   date default null,
  p_catatan   text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_resep      resep%rowtype;
  v_kunjungan  uuid;
  v_it         jsonb;
  v_ri         resep_item%rowtype;
  v_jumlah     numeric;
  v_kolam      text;
  v_hasil      jsonb;
  v_grup       jsonb := '[]'::jsonb;
  v_diserahkan int := 0;
  v_total_item int := 0;
  v_pasien     uuid;
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh menyerahkan resep.'
      using errcode = '42501';
  end if;

  select * into v_resep from resep where id = p_resep_id;
  if not found then raise exception 'Resep tidak ditemukan.'; end if;
  if v_resep.status = 'DISERAHKAN' then
    raise exception 'Resep % sudah pernah diserahkan.', coalesce(v_resep.no_resep,'ini');
  end if;
  v_kunjungan := v_resep.kunjungan_id;
  select pasien_id into v_pasien from kunjungan where id = v_kunjungan;

  select count(*) into v_total_item from resep_item where resep_id = p_resep_id;

  for v_it in select * from jsonb_array_elements(coalesce(p_item, '[]'::jsonb))
  loop
    v_jumlah := coalesce((v_it->>'jumlah')::numeric, 0);
    continue when v_jumlah <= 0;

    select * into v_ri from resep_item
     where id = (v_it->>'resep_item_id')::uuid and resep_id = p_resep_id;
    if not found then
      raise exception 'Butir resep tidak ditemukan pada resep ini.';
    end if;
    if v_ri.obat_id is null then
      raise exception 'Butir "%" belum tertaut ke master obat, jadi stoknya tidak bisa '
                      'dipotong. Perbaiki lewat Master Data lebih dulu.', v_ri.nama_obat;
    end if;

    v_kolam := public.kronis_kolam_resep_item(v_pasien, v_ri.obat_id);

    v_hasil := public.apotek_keluar(
      p_obat_id       => v_ri.obat_id,
      p_jumlah        => v_jumlah,
      p_kategori      => 'Resep Pasien',
      p_tanggal       => coalesce(p_tanggal, public.tgl_klinik()),
      p_kunjungan_id  => v_kunjungan,
      p_resep_item_id => v_ri.id,
      p_batch_id      => null,
      p_keterangan    => coalesce(v_it->>'keterangan', v_resep.no_resep),
      p_kolam_disukai => v_kolam
    );

    update resep_item
       set jumlah_diserahkan = v_jumlah,
           catatan_farmasi   = nullif(v_it->>'keterangan','')
     where id = v_ri.id;

    v_grup := v_grup || jsonb_build_object(
      'resep_item_id', v_ri.id, 'nama_obat', v_ri.nama_obat,
      'jumlah', v_jumlah, 'kolam', v_kolam, 'hasil', v_hasil);
    v_diserahkan := v_diserahkan + 1;
  end loop;

  if v_diserahkan = 0 then
    raise exception 'Tidak ada butir obat yang diserahkan.';
  end if;

  update resep
     set status              = 'DISERAHKAN',
         diserahkan_oleh     = auth.uid(),
         diserahkan_pada     = now(),
         diserahkan_sebagian = (v_diserahkan < v_total_item),
         catatan             = coalesce(p_catatan, catatan)
   where id = p_resep_id;

  return jsonb_build_object(
    'resep_id',   p_resep_id,
    'butir',      v_diserahkan,
    'dari',       v_total_item,
    'sebagian',   v_diserahkan < v_total_item,
    'rincian',    v_grup
  );
end $$;


-- =====================================================================
--  F. apotek_impor() MENERIMA KOLAM PER BARIS
-- =====================================================================

-- Signature TIDAK berubah — p_jenis tetap satu nilai untuk seluruh
-- berkas ('Pembelian'/'Saldo Awal'), sedangkan kolam ada PER BARIS di
-- dalam p_baris, karena satu berkas saldo awal wajar berisi campuran
-- obat kronis dan obat biasa sekaligus.
create or replace function public.apotek_impor(
  p_baris  jsonb,
  p_jenis  text default 'Pembelian'
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_b          jsonb;
  v_i          int := 0;
  v_obat_id    uuid;
  v_baru       jsonb;
  v_nama       text;
  v_kode       text;
  v_kolam      text;
  v_hasil      jsonb;
  v_dibuat     int := 0;
  v_batch_baru int := 0;
  v_gabung     int := 0;
  v_nilai      numeric := 0;
  v_nama_baru  text[] := '{}';
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh mengimpor stok.'
      using errcode = '42501';
  end if;
  if p_jenis not in ('Pembelian', 'Saldo Awal') then
    raise exception 'Jenis impor "%" tidak dikenal.', p_jenis;
  end if;
  if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
    raise exception 'Tidak ada baris untuk diimpor.';
  end if;
  if jsonb_array_length(p_baris) > 2000 then
    raise exception 'Sekali impor dibatasi 2.000 baris. Pecah berkasnya lebih dulu.';
  end if;

  for v_b in select * from jsonb_array_elements(p_baris)
  loop
    v_i := v_i + 1;

    -- ── Menentukan obatnya ────────────────────────────────────────────
    v_obat_id := nullif(v_b->>'obat_id','')::uuid;
    v_baru    := v_b->'obat_baru';

    if v_obat_id is null and (v_baru is null or jsonb_typeof(v_baru) <> 'object') then
      raise exception 'Baris %: obat belum ditentukan.', v_i;
    end if;

    if v_obat_id is null then
      v_nama := btrim(coalesce(v_baru->>'nama',''));
      v_kode := nullif(btrim(coalesce(v_baru->>'kode_internal','')), '');
      if v_nama = '' then
        raise exception 'Baris %: nama obat baru kosong.', v_i;
      end if;

      /* Cari dulu sebelum membuat. Satu berkas impor sering memuat
         beberapa batch dari obat yang sama — tanpa pencarian ini, baris
         kedua akan membuat obat kembar dengan nama yang persis sama, dan
         stoknya terpecah ke dua kartu yang tidak akan pernah dijumlahkan. */
      select id into v_obat_id from obat
       where (v_kode is not null and kode_internal = v_kode)
          or (v_kode is null and lower(btrim(nama)) = lower(v_nama))
       limit 1;

      if v_obat_id is null then
        insert into obat (kode_internal, nama, satuan, harga, aktif)
        values (v_kode, v_nama,
                coalesce(nullif(btrim(v_baru->>'satuan'),''), 'Tablet'),
                coalesce((v_baru->>'harga')::numeric, 0), true)
        returning id into v_obat_id;

        v_dibuat := v_dibuat + 1;
        v_nama_baru := v_nama_baru || v_nama;

        /* Tabel obat tidak punya pemicu audit, sedangkan menambah obat
           lewat impor adalah satu-satunya jalan bagi apoteker menyentuh
           master data. Jejaknya ditulis di sini supaya tetap bisa
           ditelusuri siapa menambahkan apa, dan kapan. */
        insert into audit_log (user_id, user_nama, aksi, tabel, record_id, data_baru, keterangan)
        values (auth.uid(), (select nama from pegawai where id = auth.uid()),
                'INSERT', 'obat', v_obat_id::text,
                jsonb_build_object('nama', v_nama, 'kode_internal', v_kode),
                'Dibuat otomatis lewat impor stok (' || p_jenis || ')');
      end if;
    end if;

    -- ── Memasukkan batch-nya ──────────────────────────────────────────
    v_kolam := coalesce(nullif(btrim(v_b->>'kolam'), ''), 'reguler');
    begin
      v_hasil := public.apotek_masuk(
        p_obat_id     => v_obat_id,
        p_jumlah      => (v_b->>'jumlah')::numeric,
        p_harga_beli  => coalesce((v_b->>'harga_beli')::numeric, 0),
        p_tgl_expired => (v_b->>'tgl_expired')::date,
        p_pbf         => v_b->>'pbf',
        p_no_faktur   => nullif(v_b->>'no_faktur',''),
        p_tgl_masuk   => nullif(v_b->>'tgl_masuk','')::date,
        p_no_batch    => nullif(v_b->>'no_batch',''),
        p_keterangan  => nullif(v_b->>'keterangan',''),
        p_kategori    => p_jenis,
        p_kolam       => v_kolam
      );
    exception when others then
      /* Nomor baris ditempelkan ke pesan aslinya. Tanpa itu apoteker
         hanya melihat "Tanggal kadaluwarsa wajib diisi" untuk berkas 80
         baris, dan harus menebak yang mana. */
      raise exception 'Baris %: %', v_i, sqlerrm;
    end;

    if (v_hasil->>'digabung')::boolean then v_gabung := v_gabung + 1;
    else v_batch_baru := v_batch_baru + 1; end if;
    v_nilai := v_nilai + (v_b->>'jumlah')::numeric
                       * coalesce((v_b->>'harga_beli')::numeric, 0);
  end loop;

  return jsonb_build_object(
    'jenis',            p_jenis,
    'baris',            v_i,
    'batch_baru',       v_batch_baru,
    'batch_digabung',   v_gabung,
    'obat_baru',        v_dibuat,
    'nama_obat_baru',   to_jsonb(v_nama_baru),
    'total_nilai',      v_nilai
  );
end $$;


-- =====================================================================
--  G. VIEW — kolam ikut tampil
-- =====================================================================

-- CREATE OR REPLACE VIEW tidak boleh mengubah urutan atau nama kolom yang
-- sudah ada — hanya boleh MENAMBAH di akhir. `kolam` karena itu ditaruh
-- paling belakang, bukan di dekat kolom identitas batch lain yang mungkin
-- terasa lebih wajar; menaruhnya di tengah akan membuat `create or replace`
-- ini gagal dengan "cannot change name of view column ... to ...".
create or replace view v_apotek_batch with (security_invoker = true) as
select b.id, b.obat_id, b.no_batch, b.tgl_expired, b.tgl_masuk, b.no_faktur, b.pbf,
       b.harga_beli, b.stok_awal, b.stok_sisa, b.keterangan, b.created_at,
       o.nama            as nama_obat,
       o.satuan,
       o.golongan,
       o.bentuk_sediaan,
       o.kekuatan,
       o.harga            as harga_jual,
       b.stok_sisa * b.harga_beli as nilai_beli,
       (b.tgl_expired <= public.tgl_klinik())                          as kadaluwarsa,
       (b.tgl_expired  > public.tgl_klinik()
        and b.tgl_expired <= public.tgl_klinik() + 30)                 as segera_kadaluwarsa,
       (b.tgl_expired - public.tgl_klinik())                           as hari_ke_expired,
       b.kolam
  from apotek_batch b
  join obat o on o.id = b.obat_id;

-- v_apotek_stok TIDAK diubah: tetap total lintas kolam per obat, seperti
-- sebelum tahap ini. Menjumlahkan kedua kolam menghasilkan angka yang
-- sama seperti dulu, sehingga tidak ada layar yang diam-diam berubah
-- angkanya hanya karena berkas ini dijalankan.
-- =====================================================================
--  RME Laboratorium Medis Utama — PEMANTAUAN PASIEN KRONIS (Tahap 2: pemantauan)
--  Jalankan SETELAH 17_apotek_kolam.sql. Aman dijalankan di database
--  berisi data, dan aman dijalankan ulang.
--
--  SYARAT MATI SEBELUM BERKAS INI BERGUNA (bukan sebelum bisa DIPASANG)
--  ----------------------------------------------------------------------
--  apotek_serahkan_resep() menolak bila stok batch kurang. Selama saldo
--  awal stok apotek belum diisi, resep tidak pernah berstatus DISERAHKAN,
--  tidak ada baris apotek_transaksi, dan seluruh view di berkas ini akan
--  melapor "belum ambil obat" untuk SEMUA pasien — itu bukan bug pada
--  berkas ini, melainkan akibat langsung dari prasyarat yang belum
--  terpenuhi. Lihat claude/rancangan-kronis.md di project Claude.
--
--  TIDAK ADA TABEL BARU DI BERKAS INI
--  ----------------------------------------------------------------------
--  Seluruhnya fungsi dan view di atas tabel yang sudah ada sejak Tahap 1
--  (16_kronis.sql) dan tabel rekam medis inti. Alasannya sama persis
--  dengan alasan riwayat obat/lab tidak disalin jadi tabel di Tahap 1:
--  catatan yang sama disimpan dua tempat pasti berselisih.
--
--  KEPUTUSAN TAMPILAN vs FAKTA
--  ----------------------------------------------------------------------
--  View di sini sengaja HANYA memulangkan fakta mentah (tanggal, jumlah,
--  boolean terdaftar/tidak) — bukan label "Aman/Terlambat" yang sudah
--  diwarnai. Label dan warna dihitung di js/kronis_pantau_core.js.
--  Kelasnya beda dengan penandaan Tinggi/Rendah/Kritis di modul lab: di
--  situ SQL benar-benar MENYIMPAN tandanya (lab_hitung_tanda menulis ke
--  kolom `tanda`), sehingga ada dua sumber yang wajib disamakan dan diuji
--  berpasangan. Di sini SQL tidak pernah menyimpan status pemantauan —
--  hanya satu sumber fakta, satu sumber label. Tidak ada yang bisa
--  berselisih diam-diam karena tidak ada salinan kedua.
--
--  DUA PERINGATAN YANG BERBEDA DI APOTEK — JANGAN TERTUKAR
--  ----------------------------------------------------------------------
--  "H-3"   = pasien mengambil obat kronisnya TERLALU CEPAT (mencegah
--            obat menumpuk di rumah pasien / dijual kembali). Berlaku
--            untuk SEMUA obat rutin pasien kronis, jadwalnya 1 bulan.
--  "Kuota" = obat TERTENTU (statin) yang jatahnya dibatasi BPJS per
--            hasil lab LDL, terlepas dari jadwal bulanan di atas.
--  Keduanya peringatan, bukan penolakan (keputusan Laboratorium Medis Utama 4 Sep 2026):
--  titik itu adalah apoteker/dokter berhadapan dengan pasien yang sudah
--  di depannya. Menolak di situ akan disiasati dengan cara yang merusak
--  data, bukan mendidik siapa pun.
-- =====================================================================


-- =====================================================================
--  A. FUNGSI BANTU TANGGAL
-- =====================================================================

-- Menambah N bulan ke sebuah tanggal. Ditulis sebagai fungsi (bukan
-- ditulis ulang di tiap view) supaya definisi "satu bulan" hanya ada di
-- satu tempat — Postgres sendiri yang menangani ujung bulan (31 Jan + 1
-- bulan = 28/29 Feb, bukan 3 Maret).
create or replace function public.kronis_tambah_bulan(p_dasar date, p_bulan int)
returns date language sql immutable as $$
  select (p_dasar + (coalesce(p_bulan, 0) || ' months')::interval)::date
$$;

grant execute on function public.kronis_tambah_bulan(date, int) to authenticated;


-- =====================================================================
--  B. DIAGNOSA & OBAT AKTIF PASIEN — dipakai berulang di bawah
-- =====================================================================

-- B1. Kode diagnosa kronis aktif seorang pasien (bisa lebih dari satu).
create or replace function public.kronis_diagnosa_pasien(p_pasien_id uuid)
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(td.kode order by td.kode), '{}')
    from kronis_terapi t
    join kronis_terapi_diagnosa td on td.terapi_id = t.id
   where t.pasien_id = p_pasien_id and t.aktif
$$;

grant execute on function public.kronis_diagnosa_pasien(uuid) to authenticated;


-- B2. Tanggal pengambilan obat kronis TERAKHIR seorang pasien —
--     dipakai baik oleh view "belum ambil obat" maupun oleh peringatan
--     H-3 di apotek, supaya keduanya tidak bisa berselisih.
--
--     Definisi "ambil" (keputusan 4 Sep 2026): resep yang berisi
--     SALAH SATU obat rutin buku kronisnya — bukan berarti kunjungan
--     itu harus berisi SEMUA obatnya, dan bukan berarti resep dengan
--     obat lain (mis. parasetamol untuk flu) ikut terhitung.
create or replace function public.kronis_terakhir_ambil(p_pasien_id uuid)
returns date language sql stable security definer set search_path = public as $$
  select greatest(
    (select max(x.tanggal) from apotek_transaksi x
      join kronis_terapi t on t.pasien_id = x.pasien_id and t.aktif
      join kronis_obat ko on ko.terapi_id = t.id and ko.obat_id = x.obat_id
     where x.pasien_id = p_pasien_id
       and x.kategori = 'Resep Pasien'
       and not x.dibatalkan),
    (select max(r.tanggal) from kronis_riwayat_luar r
     where r.pasien_id = p_pasien_id and r.jenis = 'AMBIL_OBAT')
  )
$$;

grant execute on function public.kronis_terakhir_ambil(uuid) to authenticated;


-- B3. Tanggal pemeriksaan lab TERAKHIR yang boleh mereset jadwal kontrol
--     lab pasien ini — hanya lembar dari daftar ref_kronis_lab yang
--     ditautkan ke diagnosanya (lihat 16_kronis.sql bagian B2: GDS
--     sengaja tidak dihitung, HbA1c dihitung).
create or replace function public.kronis_terakhir_lab(p_pasien_id uuid)
returns date language sql stable security definer set search_path = public as $$
  select greatest(
    (select max(lp.tanggal) from lab_permintaan lp
      join lab_hasil lh on lh.permintaan_id = lp.id
      join ref_kronis_lab rkl on rkl.lab_id = lh.lab_id
     where lp.pasien_id = p_pasien_id
       and lp.status = 'SELESAI'
       and rkl.kode_kronis = any (public.kronis_diagnosa_pasien(p_pasien_id))),
    (select max(r.tanggal) from kronis_riwayat_luar r
     where r.pasien_id = p_pasien_id and r.jenis = 'LAB')
  )
$$;

grant execute on function public.kronis_terakhir_lab(uuid) to authenticated;


-- =====================================================================
--  C. "BELUM AMBIL OBAT BULAN INI"
-- =====================================================================

-- Satu baris per pasien pemegang buku kronis aktif. `bulan_ini_ambil`
-- dihitung dari BULAN KALENDER berjalan (persis definisi portal), bukan
-- dari jarak 30 hari — supaya sejalan dengan cara klinik sudah terbiasa
-- membaca laporan ini bertahun-tahun.
--
-- security_invoker: yang tidak boleh membaca kronis_terapi (staf) tidak
-- akan melihat baris apa pun di sini juga — mengikuti pola
-- v_kronis_impor_ringkas di 16_kronis.sql.
create or replace view v_kronis_obat_bulan_ini with (security_invoker = true) as
select
  t.id as terapi_id,
  p.id as pasien_id,
  p.no_rm, p.nama, p.no_hp, p.tanggal_lahir, p.jenis_kelamin,
  public.kronis_diagnosa_pasien(p.id) as diagnosa,
  t.tanggal_mulai,
  public.kronis_terakhir_ambil(p.id) as terakhir_ambil,
  -- coalesce ke false: tanpa ini, pasien yang BELUM PERNAH ambil sama
  -- sekali memulangkan NULL (date_trunc atas NULL = NULL), bukan false.
  -- Kolom boolean yang diam-diam bisa NULL adalah jebakan — `where not
  -- bulan_ini_ambil` akan diam-diam MELEWATKAN pasien yang justru paling
  -- perlu dihubungi.
  coalesce(date_trunc('month', public.kronis_terakhir_ambil(p.id))
     = date_trunc('month', public.tgl_klinik()), false) as bulan_ini_ambil,
  -- Selisih bulan kalender sejak terakhir ambil (atau sejak terdaftar,
  -- bila belum pernah sama sekali). Dipakai layar mengurutkan yang
  -- paling lama tertinggal lebih dulu.
  (extract(year from age(public.tgl_klinik(),
     coalesce(public.kronis_terakhir_ambil(p.id), t.tanggal_mulai))) * 12
   + extract(month from age(public.tgl_klinik(),
     coalesce(public.kronis_terakhir_ambil(p.id), t.tanggal_mulai))))::int
     as bulan_tertinggal
  from kronis_terapi t
  join pasien p on p.id = t.pasien_id
 where t.aktif
   -- pantau_obat: kalau SEMUA diagnosa pasien ini punya pantau_obat =
   -- false, ia tidak ikut dipantau. Per 16_kronis.sql kesepuluh
   -- diagnosa dasar semuanya pantau_obat = true, tapi kolomnya memang
   -- dibuat supaya klinik bisa mematikan satu diagnosis tanpa mengubah
   -- kode — lihat catatan yang sama pada ref_kronis_lab.
   and exists (
     select 1 from kronis_terapi_diagnosa td
     join ref_kronis_diagnosa d on d.kode = td.kode
    where td.terapi_id = t.id and d.pantau_obat and d.aktif);

grant select on v_kronis_obat_bulan_ini to authenticated;

comment on view v_kronis_obat_bulan_ini is
  'Fakta mentah pemantauan obat kronis per pasien. Label "Sudah/Belum/Terlambat"
   dihitung di js/kronis_pantau_core.js, bukan di sini — lihat catatan di kepala berkas.';


-- =====================================================================
--  D. JADWAL & KEPATUHAN LAB
-- =====================================================================

-- Hanya pasien dengan MINIMAL satu diagnosa yang punya jatah lab
-- (bulan_lab tidak null — per keputusan 4 Sep 2026 itu cuma HPT dan DM).
-- Kalau pasien punya keduanya, jadwalnya ikut yang PALING KETAT
-- (bulan_lab terkecil = 3, milik DM) — pasien DM+HPT tidak boleh
-- terhitung "sudah kontrol" memakai jadwal 6 bulan milik HPT saja.
create or replace view v_kronis_lab_jadwal with (security_invoker = true) as
select
  t.id as terapi_id,
  p.id as pasien_id,
  p.no_rm, p.nama, p.no_hp, p.tanggal_lahir, p.jenis_kelamin,
  public.kronis_diagnosa_pasien(p.id) as diagnosa,
  t.tanggal_mulai,
  interval_bulan.n as interval_bulan,
  public.kronis_terakhir_lab(p.id) as terakhir_lab,
  public.kronis_tambah_bulan(
    coalesce(public.kronis_terakhir_lab(p.id), t.tanggal_mulai),
    interval_bulan.n) as jadwal_berikutnya,
  -- Positif = sudah lewat jadwal sekian hari; negatif/nol = belum jatuh
  -- tempo. Toleransi 14 hari DITERAPKAN DI JS, bukan di sini — angka di
  -- sini murni "jadwal dikurangi hari ini", supaya toleransinya bisa
  -- diubah tanpa memasang ulang SQL.
  (public.tgl_klinik() - public.kronis_tambah_bulan(
     coalesce(public.kronis_terakhir_lab(p.id), t.tanggal_mulai),
     interval_bulan.n))::int as hari_lewat_jadwal
  from kronis_terapi t
  join pasien p on p.id = t.pasien_id
  cross join lateral (
    select min(d.bulan_lab) as n
      from kronis_terapi_diagnosa td
      join ref_kronis_diagnosa d on d.kode = td.kode
     where td.terapi_id = t.id and d.bulan_lab is not null and d.aktif
  ) as interval_bulan
 where t.aktif and interval_bulan.n is not null;

grant select on v_kronis_lab_jadwal to authenticated;

comment on view v_kronis_lab_jadwal is
  'Fakta mentah jadwal kontrol lab kronis. Toleransi 14 hari dan label
   Aman/Mendekati/Terlambat ada di js/kronis_pantau_core.js.';


-- =====================================================================
--  E. KUOTA OBAT BERKUOTA (STATIN)
-- =====================================================================

-- Satu baris per pasien yang punya statin terdaftar di buku kronisnya.
-- Titik nol kuota diambil dari hasil LDL TERBARU di lab_hasil bila ada
-- (keputusan 4 Sep: "tanggal lab diambil dari lab_hasil, tidak diketik
-- ulang") — kalau belum pernah periksa LDL di RME sama sekali, jatuh
-- kembali ke statin_tgl_lab yang dibawa dari migrasi portal.
create or replace view v_kronis_statin with (security_invoker = true) as
select
  t.id as terapi_id,
  p.id as pasien_id,
  p.no_rm, p.nama, p.no_hp,
  t.statin_kunci, t.statin_nama, t.statin_obat_id,
  k.maks,
  greatest(t.statin_tgl_lab, ldl.tgl) as tgl_dasar,
  ldl.tgl as tgl_ldl_terbaru,
  coalesce((
    select count(*) from apotek_transaksi x
     where x.pasien_id = p.id
       and x.kategori = 'Resep Pasien'
       and not x.dibatalkan
       and (
         (t.statin_obat_id is not null and x.obat_id = t.statin_obat_id)
         or (t.statin_obat_id is null
             and position(t.statin_kunci in lower(x.nama_obat)) > 0)
       )
       and x.tanggal > coalesce(greatest(t.statin_tgl_lab, ldl.tgl), t.tanggal_mulai)
  ), 0) as terpakai
  from kronis_terapi t
  join pasien p on p.id = t.pasien_id
  join ref_kronis_kuota_obat k on k.kunci = t.statin_kunci and k.aktif
  left join lateral (
    select max(lp.tanggal) as tgl
      from lab_permintaan lp
      join lab_hasil lh on lh.permintaan_id = lp.id
     where lp.pasien_id = p.id and lp.status = 'SELESAI' and lh.lab_id = k.lab_id
  ) as ldl on true
 where t.aktif and t.statin_kunci is not null;

grant select on v_kronis_statin to authenticated;

comment on view v_kronis_statin is
  'terpakai dihitung SEJAK tgl_dasar (LDL terbaru bila ada, kalau tidak
   tanggal migrasi). sisa/peringatan dihitung di JS: sisa = maks - terpakai.';


-- =====================================================================
--  F. PERINGATAN H-3 (pengambilan obat kronis terlalu cepat)
-- =====================================================================

-- Dipanggil apotek SEBELUM menyerahkan resep pasien yang terdaftar di
-- buku kronis. Bukan pengganti apotek_serahkan_resep() — resep TETAP
-- diserahkan meski hasilnya "terlalu cepat"; ini murni bahan tampilan
-- peringatan (keputusan 4 Sep: peringatan, bukan penolakan).
create or replace function public.kronis_h3_cek(p_pasien_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select case when not exists (
           select 1 from kronis_terapi where pasien_id = p_pasien_id and aktif)
         then null
         else jsonb_build_object(
           'terakhir_ambil', public.kronis_terakhir_ambil(p_pasien_id),
           'jadwal_berikutnya', public.kronis_tambah_bulan(
             coalesce(public.kronis_terakhir_ambil(p_pasien_id),
               (select tanggal_mulai from kronis_terapi
                 where pasien_id = p_pasien_id and aktif limit 1)), 1),
           'hari_menuju_jadwal', (public.kronis_tambah_bulan(
             coalesce(public.kronis_terakhir_ambil(p_pasien_id),
               (select tanggal_mulai from kronis_terapi
                 where pasien_id = p_pasien_id and aktif limit 1)), 1)
             - public.tgl_klinik())::int
         )
         end
$$;

grant execute on function public.kronis_h3_cek(uuid) to authenticated;


-- =====================================================================
--  G. PENANDAAN KRONIS DI HALAMAN PERIKSA
-- =====================================================================

-- G1. Usulan diagnosis mana yang layak ditawarkan masuk buku kronis,
--     dari kode ICD-10 yang BARU SAJA ditulis dokter di kunjungan ini.
--     Hanya MENGUSULKAN — dokter tetap yang memutuskan lewat
--     kronis_daftar_simpan(). Yang sudah aktif terdaftar tidak diusulkan
--     ulang.
create or replace function public.kronis_usulan_diagnosa(
  p_pasien_id uuid, p_kode_icd10 text[]
) returns table (kode text, nama text)
language sql stable security definer set search_path = public as $$
  select d.kode, d.nama
    from ref_kronis_diagnosa d
   where d.aktif
     and exists (
       select 1 from unnest(coalesce(p_kode_icd10, '{}')) as icd(kode)
       where icd.kode like any (
         array(select awal || '%' from unnest(d.icd10_awal) as awal)))
     and not (d.kode = any (public.kronis_diagnosa_pasien(p_pasien_id)))
   order by d.urutan
$$;

grant execute on function public.kronis_usulan_diagnosa(uuid, text[]) to authenticated;


-- G2. Menyimpan / memperbarui buku kronis pasien dari halaman periksa.
--     Menempel-atau-membuat: kalau pasien sudah punya pendaftaran aktif,
--     diagnosa dan obatnya DIGANTI SET (bukan ditambah) — inilah cara
--     dokter menghapus diagnosa/obat yang sudah tidak relevan tanpa
--     menghapus seluruh pendaftaran dan kehilangan riwayatnya.
create or replace function public.kronis_daftar_simpan(
  p_pasien_id     uuid,
  p_diagnosa      text[],
  p_obat          jsonb default '[]'::jsonb,
  p_statin_kunci  text default null,
  p_statin_obat_id uuid default null,
  p_statin_nama   text default null,
  p_statin_tgl_lab date default null,
  p_catatan       text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_terapi  uuid;
  v_kode    text;
  r         record;
begin
  if not public.boleh_kronis_kelola() then
    raise exception 'Hanya admin, dokter, dan perawat yang boleh mengubah buku kronis.'
      using errcode = '42501';
  end if;
  if coalesce(array_length(p_diagnosa, 1), 0) = 0 then
    raise exception 'Pilih minimal satu diagnosis kronis.';
  end if;
  if not exists (select 1 from pasien where id = p_pasien_id) then
    raise exception 'Pasien tidak ditemukan.';
  end if;
  if p_statin_kunci is not null
     and not exists (select 1 from ref_kronis_kuota_obat where kunci = p_statin_kunci and aktif) then
    raise exception 'Obat berkuota "%" tidak dikenal.', p_statin_kunci;
  end if;

  select id into v_terapi from kronis_terapi where pasien_id = p_pasien_id and aktif;

  if v_terapi is null then
    insert into kronis_terapi (
      pasien_id, aktif, tanggal_mulai, catatan,
      statin_kunci, statin_obat_id, statin_nama, statin_tgl_lab, created_by)
    values (
      p_pasien_id, true, public.tgl_klinik(), p_catatan,
      p_statin_kunci, p_statin_obat_id, p_statin_nama, p_statin_tgl_lab, auth.uid())
    returning id into v_terapi;
  else
    update kronis_terapi set
      catatan = p_catatan,
      statin_kunci = p_statin_kunci, statin_obat_id = p_statin_obat_id,
      statin_nama = p_statin_nama, statin_tgl_lab = p_statin_tgl_lab,
      updated_by = auth.uid()
     where id = v_terapi;
  end if;

  delete from kronis_terapi_diagnosa where terapi_id = v_terapi;
  foreach v_kode in array p_diagnosa loop
    if not exists (select 1 from ref_kronis_diagnosa where kode = v_kode) then
      raise exception 'Kode diagnosis kronis "%" tidak dikenal.', v_kode;
    end if;
    insert into kronis_terapi_diagnosa (terapi_id, kode) values (v_terapi, v_kode)
    on conflict do nothing;
  end loop;

  delete from kronis_obat where terapi_id = v_terapi;
  for r in
    select elem, ord from jsonb_array_elements(coalesce(p_obat, '[]'::jsonb))
      with ordinality as x(elem, ord)
  loop
    continue when nullif(btrim(coalesce(r.elem->>'nama_obat', '')), '') is null;
    insert into kronis_obat (terapi_id, obat_id, nama_obat, signa, jumlah, satuan, urutan)
    values (
      v_terapi,
      nullif(r.elem->>'obat_id', '')::uuid,
      btrim(r.elem->>'nama_obat'),
      nullif(r.elem->>'signa', ''),
      nullif(r.elem->>'jumlah', '')::numeric,
      nullif(r.elem->>'satuan', ''),
      coalesce((r.elem->>'urutan')::int, r.ord::int - 1));
  end loop;

  return v_terapi;
end $$;

grant execute on function
  public.kronis_daftar_simpan(uuid, text[], jsonb, text, uuid, text, date, text)
  to authenticated;


-- G3. Menghentikan pendaftaran buku kronis (pasien sembuh, pindah
--     klinik, salah tandai, dsb). Riwayatnya TETAP ada — hanya
--     `aktif` yang berubah, persis pola kronis_terapi lainnya.
create or replace function public.kronis_terapi_selesai(p_terapi_id uuid, p_alasan text default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.boleh_kronis_kelola() then
    raise exception 'Hanya admin, dokter, dan perawat yang boleh mengubah buku kronis.'
      using errcode = '42501';
  end if;
  update kronis_terapi
     set aktif = false, tanggal_selesai = public.tgl_klinik(),
         alasan_selesai = p_alasan, updated_by = auth.uid()
   where id = p_terapi_id and aktif;
  if not found then raise exception 'Pendaftaran kronis tidak ditemukan atau sudah tidak aktif.'; end if;
end $$;

grant execute on function public.kronis_terapi_selesai(uuid, text) to authenticated;


-- G4. Bacaan lengkap buku kronis SATU pasien untuk halaman periksa —
--     terapi, diagnosa, dan daftar obat dalam satu panggilan, supaya
--     halaman periksa tidak perlu tiga round-trip tiap kali dibuka.
create or replace view v_kronis_pasien with (security_invoker = true) as
select
  t.id as terapi_id, t.pasien_id, t.aktif, t.tanggal_mulai, t.catatan,
  t.statin_kunci, t.statin_obat_id, t.statin_nama, t.statin_tgl_lab,
  public.kronis_diagnosa_pasien(t.pasien_id) as diagnosa,
  coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', ko.id, 'obat_id', ko.obat_id, 'nama_obat', ko.nama_obat,
             'signa', ko.signa, 'jumlah', ko.jumlah, 'satuan', ko.satuan)
           order by ko.urutan)
      from kronis_obat ko where ko.terapi_id = t.id
  ), '[]'::jsonb) as obat
  from kronis_terapi t
 where t.aktif;

grant select on v_kronis_pasien to authenticated;


-- =====================================================================
--  H. DAFTAR TELEPON H-1
-- =====================================================================

-- Pasien dengan jadwal kontrol BESOK (tgl_klinik() + 1). Terbuka untuk
-- SEMUA staf lewat RLS (sama seperti riwayat kunjungan biasa) — yang
-- membatasinya ke admin + pendaftaran adalah menu di js/app.js, bukan
-- baris ini. Kalau dibatasi di sini juga, dokter yang ingin tahu daftar
-- pasien kontrol besok dari halaman lain akan ikut tertutup tanpa perlu.
create or replace view v_kronis_telpon_h1 with (security_invoker = true) as
select
  k.id as kunjungan_id, p.id as pasien_id,
  p.no_rm, p.nama, p.no_hp,
  pm.tanggal_kontrol, pm.kontrol_instruksi,
  dok.nama as nama_dokter, pl.nama as nama_poli
  from pemeriksaan pm
  join kunjungan k on k.id = pm.kunjungan_id
  join pasien p on p.id = k.pasien_id
  join poli pl on pl.id = k.poli_id
  left join pegawai dok on dok.id = k.dokter_id
 where pm.tindak_lanjut = 'KONTROL'
   and pm.tanggal_kontrol = public.tgl_klinik() + 1
 order by p.nama;

grant select on v_kronis_telpon_h1 to authenticated;

comment on view v_kronis_telpon_h1 is
  'Dibatasi ke admin+pendaftaran di menu (js/app.js), bukan di RLS —
   lihat komentar di atas view ini.';
-- =====================================================================
--  TAHAP 3 — LAPORAN: rekap kunjungan, rujukan, keuangan, dan Puskesmas,
--  pindahan dari dashboard.html portal sipantau (lihat claude/rancangan-
--  kronis.md dan claude/daftar-berkas-tahap3.md untuk latar lengkap).
--
--  Pola yang dipegang di seluruh berkas ini, sama seperti Tahap 2:
--  SQL HANYA memulangkan fakta mentah (baris per kunjungan/tagihan/
--  pembayaran/diagnosa), seluruh klasifikasi dan agregasi (tren 7 hari,
--  perbandingan bulanan, heatmap jam, kategori usia Puskesmas, rekap per
--  dokter) dihitung SATU-SATUNYA di js/laporan_core.js. Nol tabel baru —
--  seluruhnya view di atas tabel yang sudah ada, dan sebagian besar
--  malah tidak butuh view baru sama sekali karena halaman membaca
--  langsung dari tabel lewat select PostgREST (pola yang sama dipakai
--  DB.diagnosaTeratas() yang sudah ada).
--
--  Tiga hal baru yang BENAR-BENAR butuh SQL:
--    A. `v_riwayat_kunjungan` — 10 kolom ditambahkan di AKHIR daftar SELECT
--       (jenis_poli, jenis_kunjungan, dokter_id, poli_id, waktu_daftar,
--       jam_daftar, tanggal_lahir, jenis_kelamin, no_bpjs, no_hp). Menambah kolom di
--       tengah gagal dengan "cannot change name of view column" — pelajaran
--       yang sama dengan `v_apotek_batch` di Tahap 1b.
--    B. `v_laporan_rujukan` — rujukan internal/lanjut/IGD belum pernah
--       punya satu tempat baca sendiri; sebelumnya cuma kolom di pemeriksaan.
--    C. Dua view keuangan — `laporan_keuangan` di portal itu tabel yang
--       DIKETIK manual tiap hari. RME sudah punya transaksi sungguhan
--       (kasir_tagihan/kasir_pembayaran), jadi baris ini dihitung, bukan
--       diketik. Dipisah nilai-layanan (termasuk yang ditanggung BPJS,
--       dari kasir_tagihan) vs uang-masuk (kas sungguhan, dari
--       kasir_pembayaran) — dua definisi "pendapatan" yang berbeda dan
--       tidak boleh dijumlahkan begitu saja.
--
--  Akses: seluruh view di bawah TERBUKA untuk semua staf lewat RLS tabel
--  aslinya (sama seperti kasir_tagihan dan v_kronis_telpon_h1 di Tahap 2)
--  — yang membatasi tab Laporan Lanjutan ke akun admin adalah menu di
--  js/pages/laporan.js, bukan baris di sini. Alasannya sama seperti
--  v_kronis_telpon_h1: dokter atau kasir yang perlu data ini dari layar
--  lain (mis. cetak ulang rujukan dari rekam medis) tidak boleh ikut
--  terkunci oleh pembatasan yang sebetulnya cuma soal tata letak menu.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A. Perluasan v_riwayat_kunjungan
-- ---------------------------------------------------------------------
create or replace view v_riwayat_kunjungan with (security_invoker = true) as
select k.id, k.no_kunjungan, k.tanggal, k.status, k.cara_bayar,
       p.id as pasien_id, p.no_rm, p.nama as nama_pasien,
       po.nama as nama_poli,
       d.nama as nama_dokter,
       (select string_agg(dg.kode_icd10 || ' - ' || dg.nama, '; ' order by dg.jenis)
          from diagnosa dg where dg.kunjungan_id = k.id) as daftar_diagnosa,
       (select dg.kode_icd10 from diagnosa dg
         where dg.kunjungan_id = k.id and dg.jenis = 'PRIMER' limit 1) as icd_primer,
       k.satusehat_status, k.pcare_status,
       -- Tahap 3 — ditambahkan di AKHIR, lihat catatan kepala berkas.
       po.jenis as jenis_poli,
       k.jenis_kunjungan,
       k.dokter_id,
       k.poli_id,
       k.waktu_daftar,
       -- Jam WITA siap pakai, BUKAN diturunkan dari waktu_daftar di JS.
       -- `timestamptz` dikirim PostgREST dalam timezone sesi Supabase
       -- (lazimnya UTC), jadi `new Date(waktu_daftar).getHours()` di
       -- peramban bisa membaca zona yang salah tanpa galat apa pun —
       -- kelas kesalahan yang sama dengan UI.hariIni() dulu (lihat
       -- claude/status-rme.md). Dihitung sekali di sini, dengan aturan
       -- WITA yang sama seperti tgl_klinik().
       extract(hour from k.waktu_daftar at time zone 'Asia/Makassar')::smallint as jam_daftar,
       p.tanggal_lahir,
       p.jenis_kelamin,
       p.no_bpjs,
       p.no_hp
from kunjungan k
join pasien p on p.id = k.pasien_id
join poli po on po.id = k.poli_id
left join pegawai d on d.id = k.dokter_id
order by k.tanggal desc, k.no_antrian desc;

grant select on v_riwayat_kunjungan to authenticated;

-- ---------------------------------------------------------------------
-- B. Data rujukan — internal, lanjut (eksternal), dan IGD
-- ---------------------------------------------------------------------
-- Ketiganya sama-sama "rujukan" dari sudut pandang laporan, tapi tujuannya
-- disimpan di kolom berbeda tergantung jenisnya (poli internal vs faskes
-- luar vs teks bebas IGD). SQL memulangkan ketiga kemungkinan itu apa
-- adanya sebagai kolom terpisah; js/laporan_core.js yang memilih mana
-- yang dipakai untuk kolom "Tujuan" di tabel, supaya aturan pemilihan itu
-- bisa diuji di Node tanpa database.
create or replace view v_laporan_rujukan with (security_invoker = true) as
select
  pm.kunjungan_id,
  k.no_kunjungan,
  k.tanggal,
  pm.tindak_lanjut as jenis_rujukan,
  p.id as pasien_id, p.no_rm, p.nama as nama_pasien,
  p.no_bpjs, p.no_hp, p.tanggal_lahir, p.jenis_kelamin,
  po.nama as nama_poli_asal,
  dok.nama as nama_dokter,
  -- Rujukan internal: poli tujuan di klinik sendiri.
  poin.nama as tujuan_poli_internal,
  -- Rujukan lanjut: faskes BPJS terstruktur (kode + nama), kalau sudah dipetakan.
  pm.rujuk_ppk_kode,
  rppk.nama as tujuan_faskes_kode,
  rsub.nama as tujuan_subspesialis,
  rsar.nama as tujuan_sarana,
  pm.rujuk_tgl_estimasi,
  -- Kolom teks lama — dulu satu-satunya cara mengisi tujuan, sebelum
  -- rujukan terstruktur ada (3 Sep 2026). Rujukan IGD masih memakainya
  -- apa adanya karena belum ada daftar rumah sakit rujukan IGD terstruktur.
  pm.rujuk_ke_faskes as tujuan_teks,
  pm.rujuk_spesialis as spesialis_teks,
  pm.rujuk_alasan,
  (select string_agg(dg.kode_icd10 || ' - ' || dg.nama, '; ' order by dg.jenis)
     from diagnosa dg where dg.kunjungan_id = pm.kunjungan_id) as daftar_diagnosa
from pemeriksaan pm
join kunjungan k on k.id = pm.kunjungan_id
join pasien p on p.id = k.pasien_id
join poli po on po.id = k.poli_id
left join pegawai dok on dok.id = k.dokter_id
left join poli poin on poin.id = pm.rujuk_poli_internal_id
left join ref_ppk rppk on rppk.kode = pm.rujuk_ppk_kode
left join ref_subspesialis rsub on rsub.kode = pm.rujuk_subspesialis_kode
left join ref_sarana rsar on rsar.kode = pm.rujuk_sarana_kode
where pm.tindak_lanjut in ('RUJUK_INTERNAL', 'RUJUK_LANJUT', 'RUJUK_IGD')
order by k.tanggal desc;

grant select on v_laporan_rujukan to authenticated;

-- ---------------------------------------------------------------------
-- C. Keuangan — nilai layanan vs uang masuk (lihat catatan kepala berkas)
-- ---------------------------------------------------------------------

-- C1. Nilai layanan: dari kasir_tagihan, per hari + jenis poli + penjamin.
--     `nilai_layanan` (subtotal) mencakup yang ditanggung BPJS dan TIDAK
--     pernah masuk kas — jangan disandingkan dengan uang_masuk di C2 pada
--     baris yang sama seolah keduanya sama-sama "pendapatan".
create or replace view v_laporan_keuangan_tagihan with (security_invoker = true) as
select
  tg.tanggal,
  coalesce(po.jenis::text, 'LAINNYA') as jenis_poli,
  tg.penjamin,
  count(*)                 as jumlah_tagihan,
  sum(tg.subtotal)         as nilai_layanan,
  sum(tg.total)            as ditagih,
  sum(tg.amount_paid)      as sudah_dibayar
from kasir_tagihan tg
left join kunjungan k on k.id = tg.kunjungan_id
left join poli po     on po.id = k.poli_id
group by tg.tanggal, coalesce(po.jenis::text, 'LAINNYA'), tg.penjamin;

grant select on v_laporan_keuangan_tagihan to authenticated;

-- C2. Uang masuk sungguhan: dari kasir_pembayaran, per hari + jenis poli
--     + penjamin + metode. Ini kas beneran — dasar rekonsiliasi tutup kas,
--     bukan v_kasir_rekap_harian (yang tidak dipisah per poli/penjamin;
--     dipakai halaman Kasir untuk tutup kas harian dan sengaja tidak diubah).
create or replace view v_laporan_keuangan_pembayaran with (security_invoker = true) as
select
  bp.tanggal,
  coalesce(po.jenis::text, 'LAINNYA') as jenis_poli,
  tg.penjamin,
  bp.metode,
  count(*)          as jumlah_transaksi,
  sum(bp.jumlah)    as uang_masuk
from kasir_pembayaran bp
join kasir_tagihan tg  on tg.id = bp.tagihan_id
left join kunjungan k  on k.id = tg.kunjungan_id
left join poli po      on po.id = k.poli_id
group by bp.tanggal, coalesce(po.jenis::text, 'LAINNYA'), tg.penjamin, bp.metode;

grant select on v_laporan_keuangan_pembayaran to authenticated;

comment on view v_laporan_rujukan is
  'Dibatasi ke akun admin di menu (js/pages/laporan.js), bukan di RLS — RLS
   tabel pemeriksaan sudah membuka baca untuk semua staf, sama seperti
   v_kronis_telpon_h1 di Tahap 2.';
comment on view v_laporan_keuangan_tagihan is
  'Dibatasi ke akun admin di menu (js/pages/laporan.js), bukan di RLS — RLS
   kasir_tagihan sudah membuka baca untuk semua staf (halaman Kasir
   memerlukannya). nilai_layanan (subtotal) TERMASUK yang ditanggung BPJS
   dan tidak sama dengan uang yang benar-benar masuk — lihat
   v_laporan_keuangan_pembayaran untuk itu.';
comment on view v_laporan_keuangan_pembayaran is
  'Dibatasi ke akun admin di menu (js/pages/laporan.js), bukan di RLS.
   Inilah kas sungguhan — dasar rekonsiliasi, bukan v_kasir_rekap_harian
   (dipakai halaman Kasir untuk tutup kas harian, tidak dipisah per poli).';
-- =====================================================================
--  RME Laboratorium Medis Utama - GANTI NAMA PERAN (9 Sep 2026)
--
--  HANYA untuk database Supabase yang SUDAH berjalan (sudah punya akun
--  dengan peran 'admin'/'pendaftaran'). Instalasi BARU dari nol tidak
--  perlu berkas ini sama sekali — sql/01_schema.sql sudah langsung
--  membuat peran dengan nama final ('master','admin',...).
--
--  Yang berubah:
--    'admin'       (peran tertinggi/pemilik sistem)  ->  'master'
--    'pendaftaran' (staf loket)                       ->  'admin'
--
--  Akun yang ada TIDAK PERLU di-UPDATE satu per satu. `RENAME VALUE`
--  hanya mengganti LABEL nilai enum yang sudah ada — baris `pegawai` yang
--  sekarang `peran = 'admin'` otomatis terbaca `'master'` sesudah ini,
--  begitu juga 'pendaftaran' -> 'admin'. Tidak ada data yang berubah.
--
--  URUTAN WAJIB: 'admin' harus lebih dulu dipindah ke 'master' supaya
--  label 'admin' kosong sebelum dipakai ulang untuk arti baru. Membalik
--  urutan akan gagal.
--
--  SETELAH menjalankan berkas ini, WAJIB langsung jalankan ulang (dalam
--  sesi kerja yang sama, jangan ditunda) berkas-berkas berikut — semuanya
--  sudah ditulis idempoten (aman dijalankan ulang di database berisi
--  data), dan sekarang memakai nama peran baru + kode hak akses yang
--  bisa diatur lewat Pengaturan -> Hak Akses:
--
--    02_rls.sql, 05_gigi.sql, 06_master.sql, 08_apotek.sql, 09_kasir.sql,
--    11_penunjang.sql, 13_surat.sql, 14_periksa_terstruktur.sql,
--    15_antrean.sql, 16_kronis.sql
--
--  Kalau langkah re-run itu terlewat, kebijakan RLS lama (yang masih
--  menyebut literal 'admin'/'pendaftaran' versi lama) akan mulai gagal
--  dengan "invalid input value for enum peran_pegawai" begitu label lama
--  itu sudah tidak ada — karena itu jangan jalankan berkas ini sendirian
--  lalu berhenti di tengah jalan.
--
--  Dibungkus supaya IDEMPOTEN (aman dijalankan ulang, dan aman ikut
--  terjalankan otomatis oleh test/jalankan.sh pada instalasi baru yang
--  labelnya sudah 'master' sejak awal): kalau label 'master' sudah ada
--  di enum, berkas ini tidak melakukan apa-apa.
-- =====================================================================

do $$
begin
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'peran_pegawai' and e.enumlabel = 'master'
  ) then
    alter type peran_pegawai rename value 'admin' to 'master';
    alter type peran_pegawai rename value 'pendaftaran' to 'admin';
  end if;
end $$;
-- =====================================================================
--  RME Laboratorium Medis Utama - OBAT DI PENJUALAN BEBAS KASIR + KODE TARIF OTOMATIS
--  Jalankan SETELAH 20_ganti_nama_peran.sql
--
--  Dua permintaan Laboratorium Medis Utama (10 Sep 2026):
--
--   1. "Tambah baris" / "Penjualan bebas" di Kasir harus bisa menjual obat
--      langsung dari master Obat (harga & kode sudah ada di sana), TANPA
--      mendaftarkan ulang tiap obat ke Master Tarif satu per satu — obat
--      di klinik ini jumlahnya ratusan dan datanya sudah dikelola penuh
--      di Apotek, jadi menduplikasinya ke Tarif berarti dua tempat kelola
--      untuk satu hal yang sama, kelas kesalahan yang sama dengan
--      `poli.jenis`/`obat.dpho` dulu.
--
--   2. Memilih obat + jumlah di Kasir harus SEKALIGUS memotong stok
--      (FEFO, kategori 'Penjualan Bebas') dalam satu aksi — tidak perlu
--      lagi bolak-balik ke Apotek -> Obat keluar untuk transaksi yang
--      sama, yang sebelumnya membuat kasir mengetik obat & jumlah yang
--      SAMA dua kali di dua halaman berbeda.
--
--   3. Kode internal di Master Tarif (tindakan/layanan/lain-lain — kode
--      LAB & Penunjang TIDAK disentuh, sudah otomatis dari referensinya
--      sendiri) digenerate otomatis kalau dikosongkan, supaya Laboratorium Medis Utama
--      tidak perlu memikirkan penomoran sendiri untuk tiap tarif baru.
--      Tetap bisa diketik manual kalau memang ingin kode tertentu.
--
--  Prinsip yang dijaga di berkas ini: TIDAK menulis ulang mesin FEFO
--  (`apotek_keluar`) maupun pembatalannya (`apotek_batalkan_grup`) di
--  tempat kedua. Keduanya dipecah jadi inti tanpa pemeriksaan hak akses
--  (`_apotek_potong_fefo_inti`, `_apotek_batalkan_grup_inti`) yang
--  dipanggil BERSAMA oleh jalur lama (apoteker, lewat apotek_keluar /
--  apotek_batalkan_grup) dan jalur baru (kasir, lewat
--  kasir_jual_obat_bebas / trigger penghapusan baris). Kalau logika FEFO
--  berubah kelak, cukup diubah di satu tempat.
-- =====================================================================


-- =====================================================================
--  A. BARIS TAGIHAN TAHU DARI GRUP STOK MANA IA BERASAL
-- =====================================================================

-- NULL untuk seluruh baris lama (TINDAKAN, LAYANAN, MANUAL, dan OBAT yang
-- ditarik dari kunjungan/resep — stoknya sudah dipotong terpisah saat
-- resep diserahkan di Apotek, bukan oleh baris tagihan ini). Hanya terisi
-- untuk baris OBAT yang dibuat lewat kasir_jual_obat_bebas() di bawah,
-- supaya baris ITU sendiri yang memotong stoknya sendiri, dan baris ITU
-- sendiri pula yang tahu grup mana yang harus dibatalkan kalau dihapus.
alter table kasir_tagihan_item add column if not exists apotek_grup_id uuid;

comment on column kasir_tagihan_item.apotek_grup_id is
  'Diisi hanya untuk baris OBAT yang dijual langsung dari Kasir (penjualan '
  'bebas / tambah baris), menunjuk ke apotek_transaksi.grup_id yang dibuat '
  'bersamaan. NULL untuk baris lain, termasuk obat yang ditarik dari resep '
  'kunjungan (stoknya sudah dipotong terpisah saat diserahkan di Apotek). '
  'Dipakai trigger kasir_trg_batal_obat_bebas untuk membatalkan stoknya '
  'otomatis kalau baris ini dihapus.';


-- =====================================================================
--  B. KODE INTERNAL TARIF — OTOMATIS KALAU DIKOSONGKAN
-- =====================================================================

create sequence if not exists seq_kode_tarif start 1;

-- Satu sequence dipakai bersama lintas jenis (bukan satu sequence per
-- jenis) supaya tidak ada kemungkinan dua transaksi bersamaan mendapat
-- nomor yang sama — nextval() atomik, sedangkan "hitung baris yang sudah
-- ada lalu +1" tidak. Konsekuensinya nomor urut LAY-/TND-/LAIN- boleh
-- meloncat kalau jenisnya berselang-seling; itu kosmetik, bukan cacat.
create or replace function public.gen_kode_tarif() returns trigger
language plpgsql as $$
declare v_prefix text;
begin
  if new.kode is null or btrim(new.kode) = '' then
    v_prefix := case new.jenis
                  when 'TINDAKAN' then 'TND'
                  when 'LAYANAN'  then 'LAY'
                  when 'LAIN'     then 'LAIN'
                  -- LAB dan PENUNJANG semestinya sudah dikirim dengan kode
                  -- terisi (dari js/pages/tarif.js, diambil dari referensi
                  -- lab/penunjang yang dipilih) sebelum sampai ke sini.
                  -- Cabang ini murni jaring pengaman, bukan jalur normal.
                  else 'TRF'
                end;
    new.kode := v_prefix || '-' || lpad(nextval('seq_kode_tarif')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_gen_kode_tarif on kasir_tarif;
create trigger trg_gen_kode_tarif before insert on kasir_tarif
for each row execute function public.gen_kode_tarif();

grant usage, select on sequence seq_kode_tarif to authenticated;


-- =====================================================================
--  C. APOTEK_KELUAR() DIPECAH: INTI TANPA HAK AKSES + PEMBUNGKUS LAMA
-- =====================================================================

-- Isinya SAMA PERSIS dengan apotek_keluar() di sql/17_apotek_kolam.sql
-- (bagian D), hanya pemeriksaan public.boleh_apotek() di awalnya
-- dipindah keluar. Pemanggilnya (apotek_keluar di bawah, dan
-- kasir_jual_obat_bebas di bagian E) masing-masing memeriksa hak
-- aksesnya SENDIRI sebelum memanggil ini.
create or replace function public._apotek_potong_fefo_inti(
  p_obat_id        uuid,
  p_jumlah         numeric,
  p_kategori       text,
  p_tanggal        date,
  p_kunjungan_id   uuid,
  p_resep_item_id  uuid,
  p_batch_id       uuid,
  p_keterangan     text,
  p_kolam_disukai  text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_obat       obat%rowtype;
  v_tgl        date := coalesce(p_tanggal, public.tgl_klinik());
  v_grup       uuid := gen_random_uuid();
  v_sisa       numeric := p_jumlah;
  v_ambil      numeric;
  v_total      numeric := 0;
  v_tersedia   numeric := 0;
  v_pemusnahan boolean;
  v_pasien     uuid;
  v_kolam_pref text := nullif(lower(btrim(coalesce(p_kolam_disukai, ''))), '');
  v_potongan   jsonb := '[]'::jsonb;
  r            record;
begin
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah keluar harus lebih dari nol.';
  end if;
  if not (p_kategori = any (public.apotek_kategori_keluar())) then
    raise exception 'Kategori pengeluaran "%" tidak dikenal.', p_kategori;
  end if;
  if v_kolam_pref is not null and v_kolam_pref not in ('reguler','kronis') then
    raise exception 'Kolam "%" tidak dikenal. Yang sah: reguler, kronis.', v_kolam_pref;
  end if;

  select * into v_obat from obat where id = p_obat_id;
  if not found then
    raise exception 'Obat tidak ditemukan di master obat.';
  end if;

  v_pemusnahan := p_kategori = any (public.apotek_kategori_pemusnahan());

  if p_kunjungan_id is not null then
    select pasien_id into v_pasien from kunjungan where id = p_kunjungan_id;
  end if;

  perform public.apotek_kunci_obat(p_obat_id);

  select coalesce(sum(stok_sisa), 0) into v_tersedia
    from apotek_batch
   where obat_id = p_obat_id
     and stok_sisa > 0
     and (p_batch_id is null or id = p_batch_id)
     and (v_pemusnahan or tgl_expired > v_tgl);

  if v_tersedia < p_jumlah then
    raise exception 'Stok % tidak cukup. Tersedia % %, diminta %.',
      v_obat.nama, v_tersedia, v_obat.satuan, p_jumlah;
  end if;

  for r in
    select * from apotek_batch
     where obat_id = p_obat_id
       and stok_sisa > 0
       and (p_batch_id is null or id = p_batch_id)
       and (v_pemusnahan or tgl_expired > v_tgl)
     order by (case when v_kolam_pref is not null and kolam = v_kolam_pref then 0 else 1 end),
              tgl_expired, tgl_masuk, created_at, id     -- FEFO
  loop
    exit when v_sisa <= 0;

    v_ambil := least(r.stok_sisa, v_sisa);

    update apotek_batch
       set stok_sisa = stok_sisa - v_ambil, updated_at = now()
     where id = r.id;

    insert into apotek_transaksi (batch_id, obat_id, nama_obat, satuan, jenis, kategori,
                                  jumlah, harga_satuan, total_nilai, tanggal,
                                  no_faktur, pbf, kolam, kunjungan_id, pasien_id, resep_item_id,
                                  grup_id, keterangan, dibuat_oleh)
    values (r.id, p_obat_id, v_obat.nama, v_obat.satuan, 'KELUAR', p_kategori,
            v_ambil, r.harga_beli, v_ambil * r.harga_beli, v_tgl,
            r.no_faktur, r.pbf, r.kolam, p_kunjungan_id, v_pasien, p_resep_item_id,
            v_grup, p_keterangan, auth.uid());

    v_total    := v_total + v_ambil * r.harga_beli;
    v_sisa     := v_sisa - v_ambil;
    v_potongan := v_potongan || jsonb_build_object(
      'batch_id',     r.id,
      'tgl_expired',  r.tgl_expired,
      'no_faktur',    r.no_faktur,
      'pbf',          r.pbf,
      'kolam',        r.kolam,
      'jumlah',       v_ambil,
      'harga_satuan', r.harga_beli,
      'nilai',        v_ambil * r.harga_beli
    );
  end loop;

  if v_sisa > 0 then
    raise exception 'Alokasi FEFO gagal: masih kurang % %. Tidak ada yang disimpan.',
      v_sisa, v_obat.satuan;
  end if;

  return jsonb_build_object(
    'grup_id',     v_grup,
    'total_nilai', v_total,
    'potongan',    v_potongan
  );
end $$;

-- Pembungkus: satu-satunya perbedaan dari sebelumnya adalah badan fungsi
-- sekarang cuma memeriksa hak akses lalu meneruskan ke inti di atas.
-- Nama, parameter, dan perilaku dari luar SAMA PERSIS seperti sebelum
-- berkas ini — kode yang sudah memanggil apotek_keluar() (apotek.js,
-- apotek_serahkan_resep, apotek_impor) tidak perlu berubah sama sekali.
create or replace function public.apotek_keluar(
  p_obat_id        uuid,
  p_jumlah         numeric,
  p_kategori       text default 'Resep Pasien',
  p_tanggal        date default null,
  p_kunjungan_id   uuid default null,
  p_resep_item_id  uuid default null,
  p_batch_id       uuid default null,
  p_keterangan     text default null,
  p_kolam_disukai  text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh mengeluarkan obat.'
      using errcode = '42501';
  end if;
  return public._apotek_potong_fefo_inti(
    p_obat_id, p_jumlah, p_kategori, p_tanggal, p_kunjungan_id,
    p_resep_item_id, p_batch_id, p_keterangan, p_kolam_disukai);
end $$;

grant execute on function
  public.apotek_keluar(uuid,numeric,text,date,uuid,uuid,uuid,text,text)
  to authenticated;


-- =====================================================================
--  D. APOTEK_BATALKAN_GRUP() DIPECAH DENGAN CARA YANG SAMA
-- =====================================================================

create or replace function public._apotek_batalkan_grup_inti(
  p_grup_id   uuid,
  p_alasan    text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_baris   record;
  v_jumlah  int := 0;
  v_obat_id uuid;
  v_umur    int;
begin
  select obat_id, (public.tgl_klinik() - min(tanggal))
    into v_obat_id, v_umur
    from apotek_transaksi
   where grup_id = p_grup_id and not dibatalkan
   group by obat_id;

  if v_obat_id is null then
    raise exception 'Transaksi tidak ditemukan atau sudah dibatalkan sebelumnya.';
  end if;
  if v_umur > 7 then
    raise exception 'Transaksi berumur % hari sudah tidak bisa dibatalkan (batas 7 hari). '
                    'Catat koreksinya sebagai Penyesuaian Stok.', v_umur;
  end if;

  perform public.apotek_kunci_obat(v_obat_id);

  for v_baris in
    select * from apotek_transaksi where grup_id = p_grup_id and not dibatalkan
  loop
    if v_baris.jenis = 'KELUAR' then
      update apotek_batch set stok_sisa = stok_sisa + v_baris.jumlah, updated_at = now()
       where id = v_baris.batch_id;
    else
      update apotek_batch
         set stok_awal = stok_awal - v_baris.jumlah,
             stok_sisa = stok_sisa - v_baris.jumlah,
             updated_at = now()
       where id = v_baris.batch_id and stok_sisa >= v_baris.jumlah;
      if not found then
        raise exception 'Batch ini sudah terpakai sebagian, jadi pemasukannya tidak bisa '
                        'dibatalkan. Keluarkan sisanya lewat Penyesuaian Stok.';
      end if;
    end if;

    update apotek_transaksi set dibatalkan = true where id = v_baris.id;
    v_jumlah := v_jumlah + 1;
  end loop;

  update resep_item ri
     set jumlah_diserahkan = null
    from apotek_transaksi t
   where t.grup_id = p_grup_id and t.resep_item_id = ri.id;

  update resep r
     set status = 'DIBUAT', diserahkan_pada = null, diserahkan_oleh = null,
         diserahkan_sebagian = false
   where r.id in (
     select ri.resep_id from apotek_transaksi t
       join resep_item ri on ri.id = t.resep_item_id
      where t.grup_id = p_grup_id
   );

  return jsonb_build_object('dibatalkan', v_jumlah, 'alasan', p_alasan);
end $$;

create or replace function public.apotek_batalkan_grup(
  p_grup_id   uuid,
  p_alasan    text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh membatalkan transaksi.'
      using errcode = '42501';
  end if;
  return public._apotek_batalkan_grup_inti(p_grup_id, p_alasan);
end $$;

grant execute on function public.apotek_batalkan_grup(uuid,text) to authenticated;


-- =====================================================================
--  E. KASIR MENJUAL OBAT LANGSUNG — SATU AKSI, SATU SUMBER HARGA
-- =====================================================================

-- Dipanggil dari dialog "Tambah baris" / "Penjualan bebas" di Kasir saat
-- kasir memilih obat lewat pencarian (bukan lewat Master Tarif). Harga
-- SELALU diambil dari obat.harga saat ini — tidak ada tempat untuk
-- mengetik harga sendiri di sini, supaya tidak ada dua sumber harga yang
-- bisa berselisih untuk obat yang sama. Diskon per baris tetap boleh
-- (dialog "Tambah baris" sudah punya kolomnya, dipakai apa adanya).
--
-- Stok dipotong FEFO dalam transaksi yang SAMA dengan penulisan baris
-- tagihan: kalau salah satu gagal, keduanya batal — tidak pernah ada
-- baris tagihan tanpa stok yang benar-benar terpotong, atau sebaliknya.
create or replace function public.kasir_jual_obat_bebas(
  p_tagihan_id          uuid,
  p_obat_id             uuid,
  p_qty                 numeric,
  p_diskon_pct          numeric  default 0,
  p_ditanggung_penjamin boolean  default false,
  p_urutan              smallint default 99,
  p_keterangan          text     default null
) returns kasir_tagihan_item
language plpgsql security definer set search_path = public
as $$
declare
  v_obat  obat%rowtype;
  v_t     kasir_tagihan%rowtype;
  v_hasil jsonb;
  v_item  kasir_tagihan_item%rowtype;
begin
  if not public.boleh_kasir() then
    raise exception 'Hanya kasir dan admin yang boleh menambah baris penjualan.'
      using errcode = '42501';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'Jumlah harus lebih dari nol.';
  end if;

  select * into v_t from kasir_tagihan where id = p_tagihan_id;
  if not found then raise exception 'Tagihan tidak ditemukan.'; end if;

  select * into v_obat from obat where id = p_obat_id and aktif;
  if not found then raise exception 'Obat tidak ditemukan atau sudah nonaktif.'; end if;

  -- Kategori 'Penjualan Bebas' sudah ada sejak modul apotek dibangun
  -- (lihat apotek_kategori_keluar() di sql/08_apotek.sql §C) — dipakai
  -- di sini apa adanya, bukan kategori baru. Tanpa preferensi kolam:
  -- penjualan bebas bukan bagian program kronis, jadi FEFO polos lintas
  -- kolam reguler & kronis (boleh menyeberang, sama seperti resep biasa
  -- untuk pasien yang bukan pemegang buku kronis).
  v_hasil := public._apotek_potong_fefo_inti(
    p_obat_id, p_qty, 'Penjualan Bebas', v_t.tanggal,
    v_t.kunjungan_id, null, null,
    coalesce(p_keterangan, 'Penjualan bebas — kasir ' || v_t.nomor),
    null);

  insert into kasir_tagihan_item (tagihan_id, sumber, ref_id, ref_kode, nama, qty,
                                  harga_satuan, diskon_pct, ditanggung_penjamin, urutan,
                                  apotek_grup_id)
  values (p_tagihan_id, 'OBAT', p_obat_id, v_obat.kode_internal,
          v_obat.nama || ' (' || p_qty || ' ' || v_obat.satuan || ')',
          p_qty, coalesce(v_obat.harga, 0), coalesce(p_diskon_pct, 0),
          p_ditanggung_penjamin, p_urutan, (v_hasil->>'grup_id')::uuid)
  returning * into v_item;

  return v_item;
end $$;

grant execute on function
  public.kasir_jual_obat_bebas(uuid,uuid,numeric,numeric,boolean,smallint,text)
  to authenticated;


-- =====================================================================
--  F. MENGHAPUS BARIS OBAT-BEBAS MENGEMBALIKAN STOKNYA — DI DATABASE,
--     BUKAN DIGANTUNGKAN KE JALUR KLIEN
-- =====================================================================

-- Dipasang sebagai trigger (bukan disisipkan ke fungsi penghapusan baris
-- tertentu) supaya invariannya berlaku di MANA PUN baris ini terhapus:
-- lewat tombol "×" di Kasir (kasirHapusItem, hapus langsung tabelnya),
-- lewat "Susun ulang dari kunjungan" (yang menghapus seluruh baris
-- TINDAKAN/OBAT/LAYANAN lama sebelum menulis ulang — lihat §E1-E3 di
-- sql/09_kasir.sql), maupun lewat penghapusan seluruh tagihan
-- (kasir_hapus_tagihan, cascade). Baris yang bukan hasil
-- kasir_jual_obat_bebas() (apotek_grup_id null) tidak tersentuh sama
-- sekali — WHEN di trigger memastikan itu.
--
-- Batas 7 hari dan penjagaan lain sudah ada di _apotek_batalkan_grup_inti;
-- trigger ini tidak menduplikasinya.
create or replace function public.kasir_trg_batal_obat_bebas() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public._apotek_batalkan_grup_inti(old.apotek_grup_id,
    'Baris penjualan bebas dihapus dari Kasir (tagihan ' ||
    coalesce((select nomor from kasir_tagihan where id = old.tagihan_id), '?') || ')');
  return old;
end $$;

drop trigger if exists trg_batal_obat_bebas on kasir_tagihan_item;
create trigger trg_batal_obat_bebas before delete on kasir_tagihan_item
for each row when (old.apotek_grup_id is not null)
execute function public.kasir_trg_batal_obat_bebas();
/* =====================================================================
   PENGATURAN TEMPLATE CETAK RESEP (10 Sep 2026)

   Laboratorium Medis Utama minta bisa mengatur template cetak Resep dari Pengaturan: unggah
   logo sendiri, pilih ukuran kertas, dan menyalakan/mematikan beberapa
   bagian (BB, Riwayat Alergi Obat, kotak Validasi Farmasi).

   Pola SENGAJA disalin persis dari `sys_surat_pengaturan` (13_surat.sql):
   satu baris jsonb, bawaan lengkap ditulis di JavaScript
   (js/db.js -> BAWAAN_RESEP), isi database ditumpuk di atasnya. Menambah
   pengaturan baru nanti (mis. sakelar tambahan) tidak butuh migrasi SQL
   lagi -- cukup satu kunci baru di BAWAAN_RESEP, dan klinik yang belum
   menyimpannya tetap jalan dengan nilai bawaan itu.

   Logo disimpan sebagai data URI di kolom jsonb ini juga (BUKAN Supabase
   Storage) -- alasan yang sama seperti kop surat: kuota Storage paket
   gratis habis diam-diam, dan window cetak (document.write) butuh
   gambarnya ADA saat itu juga, tidak bisa menunggu unduhan dari URL.
   ===================================================================== */

create table if not exists sys_resep_pengaturan (
  id           smallint primary key default 1 check (id = 1),
  konfigurasi  jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references pegawai(id)
);

insert into sys_resep_pengaturan (id, konfigurasi) values (1, '{}'::jsonb)
on conflict (id) do nothing;

drop trigger if exists trg_updated_sys_resep on sys_resep_pengaturan;
create trigger trg_updated_sys_resep before update on sys_resep_pengaturan
for each row execute function set_updated_at();

comment on table sys_resep_pengaturan is
  'Pengaturan template cetak Resep: logo, ukuran kertas, dan bagian yang ditampilkan. Satu baris (id=1), sama seperti sys_surat_pengaturan.';

-- Grant blanket seperti tabel sys_*_pengaturan lain -- lihat catatan RLS
-- di 02_rls.sql soal grant hanya berlaku untuk objek yang ADA saat
-- grant itu berjalan; tabel baru selalu butuh grant sendiri di sini.
grant select, insert, update, delete on sys_resep_pengaturan to authenticated;

alter table sys_resep_pengaturan enable row level security;

-- Dibaca semua staf (dibutuhkan siapa pun yang mencetak resep -- dokter),
-- diubah kode `master_data` -- persis sama seperti sys_surat_pengaturan.
drop policy if exists sys_resep_baca on sys_resep_pengaturan;
create policy sys_resep_baca on sys_resep_pengaturan for select
  to authenticated using (public.saya_staf());

drop policy if exists sys_resep_tulis on sys_resep_pengaturan;
create policy sys_resep_tulis on sys_resep_pengaturan for all
  to authenticated
  using (public.boleh_master_data())
  with check (public.boleh_master_data());
/* =====================================================================
   SALINAN RESEP + RESEP ITER (10 Sep 2026)

   Laboratorium Medis Utama melaporkan: kalau obat yang diresepkan dokter ternyata habis atau
   sudah kadaluarsa saat resep diserahkan, sistem sekarang cuma memberi
   peringatan "stok tidak cukup" lalu apoteker mengisi jumlah seadanya
   (fitur "diserahkan sebagian" yang sudah ada sejak 08_apotek.sql). Yang
   BELUM ada: dokumen "Salinan Resep" resmi (per Permenkes 73/2016 tentang
   Standar Pelayanan Kefarmasian di Apotek) yang HARUS diberikan ke pasien
   dalam situasi itu, supaya sisa obatnya bisa ditebus di apotek lain —
   berisi tanda det/nedet per obat, identitas apoteker penyerah (nama +
   No. SIPA), No. SIA apotek, dan cap "p.c.c" (pro copy conform).

   Laboratorium Medis Utama juga eksplisit minta dukungan "iter resep": dokter menuliskan
   resep boleh diulang N kali (mis. obat kronis bulanan) tanpa periksa
   ulang; tiap pengambilan dicetak Salinan Resep baru sampai iterasinya
   habis.

   MASALAH STRUKTUR YANG HARUS DIPECAHKAN LEBIH DULU: sebelum berkas ini,
   `apotek_serahkan_resep()` (08_apotek.sql, dibungkus ulang di
   17_apotek_kolam.sql) mengunci resep SELAMANYA begitu status jadi
   'DISERAHKAN' — sekalipun baru diserahkan SEBAGIAN. Tidak ada tempat
   menyimpan riwayat "penyerahan keberapa" karena `resep_item.jumlah_diserahkan`
   cuma satu kolom (ditimpa tiap kali). Iter butuh resep bisa dibuka lagi
   berkali-kali, dan tiap kali butuh jejak sendiri (untuk mencetak ulang
   Salinan Resep penyerahan yang mana pun) — karenanya dua tabel baru di
   bawah, TERPISAH dari apotek_transaksi (yang tetap satu-satunya sumber
   kebenaran KARTU STOK & TAGIHAN KASIR, tidak disentuh sama sekali di sini).

   =====================================================================
   A. KOLOM BARU
   ===================================================================== */

-- No. Surat Izin Apotek — wajib tercantum di Salinan Resep bersama identitas
-- klinik yang sudah ada (nama, alamat, kode_registrasi_kemenkes).
alter table faskes add column if not exists no_sia text;
comment on column faskes.no_sia is
  'Nomor Surat Izin Apotek (SIA) — dicetak di kop Salinan Resep.';

-- iter_maks: berapa kali resep ini BOLEH diulang di LUAR penyerahan
-- pertama (tulisan dokter "iter 2x" di kertas resep = iter_maks 2, jadi
-- total 3 kali boleh diserahkan). 0 = tidak iter, perilaku sama seperti
-- sebelum fitur ini ada (sekali serah, langsung terkunci).
alter table resep add column if not exists iter_maks smallint not null default 0
  check (iter_maks >= 0 and iter_maks <= 12);
comment on column resep.iter_maks is
  'Jumlah pengulangan yang diizinkan DOKTER di luar penyerahan pertama ("iter Nx"). Diisi saat menulis resep, bukan oleh apoteker.';

alter table resep add column if not exists iter_terpakai smallint not null default 0;
comment on column resep.iter_terpakai is
  'Berapa kali resep ini sudah diserahkan (termasuk penyerahan pertama). Resep masih bisa diserahkan lagi selama iter_terpakai <= iter_maks.';

/* =====================================================================
   B. RIWAYAT PENYERAHAN (per kejadian, bukan per resep)

   Satu baris resep_penyerahan = satu kali apoteker menekan "Serahkan &
   potong stok" (penyerahan pertama ATAU salah satu iter). resep_item TETAP
   menyimpan snapshot penyerahan TERAKHIR (kolom jumlah_diserahkan/
   catatan_farmasi lama, dipakai layar "Serahkan resep" untuk menampilkan
   angka default) — tabel ini yang menjadi sumber kebenaran untuk mencetak
   ulang Salinan Resep penyerahan mana pun, kapan pun, termasuk yang lampau.
   ===================================================================== */
create table if not exists resep_penyerahan (
  id           uuid primary key default uuid_generate_v4(),
  resep_id     uuid not null references resep(id) on delete cascade,
  ke_berapa    smallint not null,              -- 1 = penyerahan pertama, 2 = iter ke-1, dst
  lengkap      boolean not null default true,  -- semua butir resep terpenuhi PENUH di kejadian ini?
  catatan      text,
  apoteker_id  uuid references pegawai(id),
  tanggal      date not null,
  dibuat_pada  timestamptz not null default now()
);
create index if not exists idx_resep_penyerahan_resep on resep_penyerahan (resep_id);
comment on table resep_penyerahan is
  'Satu baris per kejadian penyerahan resep (penyerahan pertama atau salah satu iter) — dasar cetak Salinan Resep.';

create table if not exists resep_penyerahan_item (
  id                uuid primary key default uuid_generate_v4(),
  penyerahan_id     uuid not null references resep_penyerahan(id) on delete cascade,
  resep_item_id     uuid not null references resep_item(id) on delete cascade,
  jumlah_diminta    numeric(8,2) not null,            -- = resep_item.jumlah saat kejadian ini
  jumlah_diserahkan numeric(8,2) not null default 0,  -- < diminta -> "nedet" sebagian di Salinan Resep
  keterangan        text
);
create index if not exists idx_resep_penyerahan_item_penyerahan on resep_penyerahan_item (penyerahan_id);
comment on table resep_penyerahan_item is
  'Jumlah diminta vs benar-benar diserahkan PER BUTIR pada satu kejadian penyerahan — sumber tanda det/nedet di Salinan Resep.';

/* =====================================================================
   C. apotek_serahkan_resep() — DITULIS ULANG TOTAL

   Perbedaan dari versi 08_apotek.sql/17_apotek_kolam.sql:
   - TIDAK menolak lagi begitu status = 'DISERAHKAN' — yang ditolak adalah
     ketika iter_terpakai sudah mencapai iter_maks+1 (iterasi benar-benar
     habis). Resep tanpa iter (iter_maks=0) berperilaku PERSIS seperti
     sebelumnya: sekali serah (penuh atau sebagian), langsung terkunci.
   - Setiap pemanggilan membuat SATU baris resep_penyerahan + baris
     resep_penyerahan_item per butir yang disebut di p_item, supaya bisa
     dicetak sebagai Salinan Resep kapan pun setelahnya.
   - status resep: 'DISERAHKAN' hanya saat iterasi benar-benar habis;
     selama masih ada iterasi tersisa, statusnya 'ITER_BERJALAN' (tetap
     muncul di antrean "belum diserahkan" milik apoteker, supaya kelihatan
     saat pasiennya balik lagi).
   - Pemotongan stok (apotek_keluar, FEFO) TIDAK berubah sama sekali.
   ===================================================================== */
create or replace function public.apotek_serahkan_resep(
  p_resep_id  uuid,
  p_item      jsonb,
  p_tanggal   date default null,
  p_catatan   text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_resep       resep%rowtype;
  v_kunjungan   uuid;
  v_it          jsonb;
  v_ri          resep_item%rowtype;
  v_jumlah      numeric;
  v_kolam       text;
  v_hasil       jsonb;
  v_grup        jsonb := '[]'::jsonb;
  v_diserahkan  int := 0;
  v_total_item  int := 0;
  v_ke_berapa   smallint;
  v_penyerahan  uuid;
  v_lengkap     boolean;
  v_pasien      uuid;
  v_tgl         date := coalesce(p_tanggal, public.tgl_klinik());
begin
  if not public.boleh_apotek() then
    raise exception 'Hanya apoteker dan admin yang boleh menyerahkan resep.'
      using errcode = '42501';
  end if;

  select * into v_resep from resep where id = p_resep_id;
  if not found then raise exception 'Resep tidak ditemukan.'; end if;

  if v_resep.iter_terpakai >= v_resep.iter_maks + 1 then
    raise exception 'Resep % sudah habis diserahkan (termasuk iter), tidak bisa diserahkan lagi.',
      coalesce(v_resep.no_resep,'ini');
  end if;

  v_kunjungan := v_resep.kunjungan_id;
  v_ke_berapa := v_resep.iter_terpakai + 1;
  select pasien_id into v_pasien from kunjungan where id = v_kunjungan;

  select count(*) into v_total_item from resep_item where resep_id = p_resep_id;

  insert into resep_penyerahan (resep_id, ke_berapa, apoteker_id, tanggal, catatan)
  values (p_resep_id, v_ke_berapa, auth.uid(), v_tgl, p_catatan)
  returning id into v_penyerahan;

  for v_it in select * from jsonb_array_elements(coalesce(p_item, '[]'::jsonb))
  loop
    v_jumlah := coalesce((v_it->>'jumlah')::numeric, 0);
    continue when v_jumlah <= 0;

    select * into v_ri from resep_item
     where id = (v_it->>'resep_item_id')::uuid and resep_id = p_resep_id;
    if not found then
      raise exception 'Butir resep tidak ditemukan pada resep ini.';
    end if;
    if v_ri.obat_id is null then
      raise exception 'Butir "%" belum tertaut ke master obat, jadi stoknya tidak bisa '
                      'dipotong. Perbaiki lewat Master Data lebih dulu.', v_ri.nama_obat;
    end if;

    v_kolam := public.kronis_kolam_resep_item(v_pasien, v_ri.obat_id);

    v_hasil := public.apotek_keluar(
      p_obat_id       => v_ri.obat_id,
      p_jumlah        => v_jumlah,
      p_kategori      => 'Resep Pasien',
      p_tanggal       => v_tgl,
      p_kunjungan_id  => v_kunjungan,
      p_resep_item_id => v_ri.id,
      p_batch_id      => null,
      p_keterangan    => coalesce(v_it->>'keterangan', v_resep.no_resep),
      p_kolam_disukai => v_kolam
    );

    insert into resep_penyerahan_item
      (penyerahan_id, resep_item_id, jumlah_diminta, jumlah_diserahkan, keterangan)
    values
      (v_penyerahan, v_ri.id, v_ri.jumlah, v_jumlah, nullif(v_it->>'keterangan',''));

    update resep_item
       set jumlah_diserahkan = v_jumlah,
           catatan_farmasi   = nullif(v_it->>'keterangan','')
     where id = v_ri.id;

    v_grup := v_grup || jsonb_build_object(
      'resep_item_id', v_ri.id, 'nama_obat', v_ri.nama_obat,
      'jumlah', v_jumlah, 'kolam', v_kolam, 'hasil', v_hasil);
    v_diserahkan := v_diserahkan + 1;
  end loop;

  if v_diserahkan = 0 then
    -- Batalkan baris penyerahan kosong: jangan sampai ada "penyerahan
    -- ke-N" tercatat tapi tidak ada satu pun butir yang benar-benar keluar.
    delete from resep_penyerahan where id = v_penyerahan;
    raise exception 'Tidak ada butir obat yang diserahkan.';
  end if;

  v_lengkap := v_diserahkan >= v_total_item
           and not exists (
             select 1 from resep_penyerahan_item
              where penyerahan_id = v_penyerahan
                and jumlah_diserahkan < jumlah_diminta);

  update resep_penyerahan set lengkap = v_lengkap where id = v_penyerahan;

  update resep
     set status              = case when v_ke_berapa >= v_resep.iter_maks + 1
                                     then 'DISERAHKAN' else 'ITER_BERJALAN' end,
         iter_terpakai       = v_ke_berapa,
         diserahkan_oleh     = auth.uid(),
         diserahkan_pada     = now(),
         diserahkan_sebagian = (not v_lengkap) or coalesce(diserahkan_sebagian, false),
         catatan             = coalesce(p_catatan, catatan)
   where id = p_resep_id;

  return jsonb_build_object(
    'resep_id',      p_resep_id,
    'penyerahan_id', v_penyerahan,
    'ke_berapa',     v_ke_berapa,
    'butir',         v_diserahkan,
    'dari',          v_total_item,
    'lengkap',       v_lengkap,
    'iter_sisa',     greatest(0, v_resep.iter_maks + 1 - v_ke_berapa),
    'rincian',       v_grup
  );
end $$;

grant execute on function public.apotek_serahkan_resep(uuid,jsonb,date,text) to authenticated;

/* =====================================================================
   D. VIEW — v_antrean_farmasi ikut membawa info iter, supaya daftar
   antrean bisa menunjukkan "iter 1/3" dan resep ITER_BERJALAN tetap
   tampil di tab "Menunggu diserahkan" (statusnya bukan 'DISERAHKAN').
   ===================================================================== */
create or replace view v_antrean_farmasi with (security_invoker = true) as
select r.id                as resep_id,
       r.no_resep,
       r.status,
       r.catatan,
       r.dibuat_pada,
       r.diserahkan_pada,
       r.diserahkan_sebagian,
       k.id                as kunjungan_id,
       k.no_kunjungan,
       k.no_antrian,
       k.tanggal,
       k.cara_bayar,
       k.status            as status_kunjungan,
       p.id                as pasien_id,
       p.no_rm,
       p.nama              as nama_pasien,
       p.tanggal_lahir,
       p.jenis_kelamin,
       date_part('year', age(p.tanggal_lahir))::int as umur,
       po.nama             as nama_poli,
       d.nama              as nama_dokter,
       (select count(*) from resep_item ri where ri.resep_id = r.id)         as jumlah_item,
       (select count(*) from resep_item ri where ri.resep_id = r.id
          and ri.obat_id is null)                                            as item_tanpa_master,
       (select coalesce(string_agg(ri.nama_obat, ', ' order by ri.urutan), '')
          from resep_item ri where ri.resep_id = r.id)                       as daftar_obat,
       r.iter_maks,
       r.iter_terpakai
  from resep r
  join kunjungan k on k.id = r.kunjungan_id
  join pasien p    on p.id = k.pasien_id
  join poli po     on po.id = k.poli_id
  left join pegawai d on d.id = k.dokter_id;

/* =====================================================================
   E. RIWAYAT PENYERAHAN UNTUK LAYAR FARMASI — ditarik lewat select
   bersarang di js/db.js (resepUntukFarmasi), bukan view terpisah, supaya
   satu roundtrip mengembalikan resep + item + riwayat penyerahan sekaligus.

   F. ROW LEVEL SECURITY
   ===================================================================== */
grant select, insert, update, delete on resep_penyerahan, resep_penyerahan_item to authenticated;

alter table resep_penyerahan      enable row level security;
alter table resep_penyerahan_item enable row level security;

-- Baca: semua staf (dipakai layar riwayat penyerahan & cetak Salinan Resep).
drop policy if exists resep_penyerahan_baca on resep_penyerahan;
create policy resep_penyerahan_baca on resep_penyerahan for select
  to authenticated using (public.saya_staf());

drop policy if exists resep_penyerahan_item_baca on resep_penyerahan_item;
create policy resep_penyerahan_item_baca on resep_penyerahan_item for select
  to authenticated using (public.saya_staf());

-- Menulis langsung lewat tangan TIDAK diizinkan, bahkan untuk apoteker —
-- satu-satunya jalan masuk normal adalah apotek_serahkan_resep() di atas
-- (SECURITY DEFINER, jadi tidak terkena RLS karena berjalan sebagai
-- pemilik tabel). Sama persis pola trx_tulis pada apotek_transaksi di
-- 08_apotek.sql: master tetap bisa menulis langsung untuk koreksi darurat.
drop policy if exists resep_penyerahan_tulis on resep_penyerahan;
create policy resep_penyerahan_tulis on resep_penyerahan for all
  to authenticated
  using (public.peran_teks_saya() = 'master')
  with check (public.peran_teks_saya() = 'master');

drop policy if exists resep_penyerahan_item_tulis on resep_penyerahan_item;
create policy resep_penyerahan_item_tulis on resep_penyerahan_item for all
  to authenticated
  using (public.peran_teks_saya() = 'master')
  with check (public.peran_teks_saya() = 'master');

/* =====================================================================
   G. _apotek_batalkan_grup_inti() — SATU baris disesuaikan untuk iter

   Sebelum berkas ini, membatalkan transaksi penyerahan SELALU mereset
   resep.status ke 'DIBUAT' tanpa syarat. Untuk resep iter itu salah:
   membatalkan penyerahan ke-2 dari resep iter 2x semestinya membuka lagi
   iterasi ke-2 (status ITER_BERJALAN, iter_terpakai turun jadi 1), bukan
   pura-pura resepnya belum pernah disentuh sama sekali (iter_terpakai
   balik ke 0 akan membuat pasien "berhak" atas satu putaran ekstra yang
   tidak pernah ditulis dokter).

   CATATAN KETERBATASAN yang SENGAJA dibiarkan (di luar cakupan permintaan
   Laboratorium Medis Utama, dan sudah begini sejak sebelum fitur ini): pembatalan bekerja
   per grup_id (satu obat), tapi resep_item.jumlah_diserahkan & resep.status
   di-reset untuk SELURUH resep, bukan cuma obat yang grup-nya dibatalkan —
   perilaku ini disalin apa adanya dari versi sebelum 10 Sep 2026. Baris
   riwayat resep_penyerahan/resep_penyerahan_item TIDAK ikut disunting di
   sini (tetap sebagai catatan bahwa penyerahan itu SEMPAT terjadi) — kalau
   suatu saat perlu presisi penuh (mis. Salinan Resep tidak boleh lagi
   dicetak untuk penyerahan yang dibatalkan), itu pekerjaan terpisah.
   ===================================================================== */
create or replace function public._apotek_batalkan_grup_inti(
  p_grup_id   uuid,
  p_alasan    text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_baris   record;
  v_jumlah  int := 0;
  v_obat_id uuid;
  v_umur    int;
begin
  select obat_id, (public.tgl_klinik() - min(tanggal))
    into v_obat_id, v_umur
    from apotek_transaksi
   where grup_id = p_grup_id and not dibatalkan
   group by obat_id;

  if v_obat_id is null then
    raise exception 'Transaksi tidak ditemukan atau sudah dibatalkan sebelumnya.';
  end if;
  if v_umur > 7 then
    raise exception 'Transaksi berumur % hari sudah tidak bisa dibatalkan (batas 7 hari). '
                    'Catat koreksinya sebagai Penyesuaian Stok.', v_umur;
  end if;

  perform public.apotek_kunci_obat(v_obat_id);

  for v_baris in
    select * from apotek_transaksi where grup_id = p_grup_id and not dibatalkan
  loop
    if v_baris.jenis = 'KELUAR' then
      update apotek_batch set stok_sisa = stok_sisa + v_baris.jumlah, updated_at = now()
       where id = v_baris.batch_id;
    else
      update apotek_batch
         set stok_awal = stok_awal - v_baris.jumlah,
             stok_sisa = stok_sisa - v_baris.jumlah,
             updated_at = now()
       where id = v_baris.batch_id and stok_sisa >= v_baris.jumlah;
      if not found then
        raise exception 'Batch ini sudah terpakai sebagian, jadi pemasukannya tidak bisa '
                        'dibatalkan. Keluarkan sisanya lewat Penyesuaian Stok.';
      end if;
    end if;

    update apotek_transaksi set dibatalkan = true where id = v_baris.id;
    v_jumlah := v_jumlah + 1;
  end loop;

  update resep_item ri
     set jumlah_diserahkan = null
    from apotek_transaksi t
   where t.grup_id = p_grup_id and t.resep_item_id = ri.id;

  update resep r
     set status        = case when r.iter_terpakai > 1 then 'ITER_BERJALAN' else 'DIBUAT' end,
         iter_terpakai  = greatest(0, r.iter_terpakai - 1),
         diserahkan_pada = null, diserahkan_oleh = null,
         diserahkan_sebagian = false
   where r.id in (
     select ri.resep_id from apotek_transaksi t
       join resep_item ri on ri.id = t.resep_item_id
      where t.grup_id = p_grup_id
   );

  return jsonb_build_object('dibatalkan', v_jumlah, 'alasan', p_alasan);
end $$;
-- =====================================================================
--  RME Laboratorium Medis Utama — CARI PASIEN MIRIP (dipakai Pra-daftar Pasien)
--  Jalankan SETELAH 23_salinan_resep.sql. Aman dijalankan di database
--  berisi data, dan aman dijalankan ulang.
--
--  KENAPA FUNGSI INI ADA
--  ----------------------
--  Halaman Migrasi Portal (16_kronis.sql) sengaja TIDAK membuatkan
--  pasien baru otomatis: tabel pasien mewajibkan tanggal_lahir dan
--  jenis_kelamin, dua hal yang portal sipantau tidak pernah simpan.
--
--  Itu benar untuk klinik yang sudah punya pasien berjalan. Tapi kalau
--  RME dipasang dari nol (belum ada satu pun pasien terdaftar) dan
--  portal punya ratusan orang, mendaftarkan satu per satu lewat formulir
--  Pendaftaran tidak realistis. Halaman Pra-daftar Pasien (js/pages/
--  pra_daftar.js, ditempel sebagai tab tambahan di Migrasi Portal)
--  memberi jalan lain: staf mengisi tanggal lahir & jenis kelamin di
--  berkas CSV (dari kartu BPJS/KTP/catatan kertas), lalu berkasnya
--  didaftarkan sekaligus.
--
--  Fungsi di bawah ini yang menjaga jalan pintas itu tidak menerbitkan
--  pasien kembar: sebelum satu baris CSV benar-benar di-insert ke
--  `pasien`, halamannya memanggil fungsi ini untuk bertanya "apakah
--  sudah ada orang seperti ini?" — persis pertanyaan yang sama seperti
--  kronis_impor_usulan(), hanya saja sumbernya CSV pra-daftar, bukan
--  baris titipan migrasi kronis.
--
--  Skor mengikuti tingkatan yang sama dengan kronis_impor_usulan():
--    1. NIK sama persis         -> 100  (nik UNIQUE di tabel pasien)
--    2. Nomor BPJS sama persis  -> 95   (no_bpjs TIDAK unik di RME)
--    3. Nama sama persis        -> 90
--    4. Nama mirip (trigram)    -> di bawah itu
--  Sama seperti kronis_impor_usulan: kecocokan tetap hanya USULAN.
--  Keputusan "ini orang yang sama atau bukan" tidak pernah diambil di
--  sini — itu tetap tugas manusia yang melihat kartu pasiennya.
-- =====================================================================

create or replace function public.pasien_cari_mirip(
  p_nama     text,
  p_nik      text default null,
  p_no_bpjs  text default null,
  p_batas    int  default 5
) returns table (
  id uuid, no_rm text, nama text, tanggal_lahir date, jenis_kelamin jenis_kelamin_t,
  nik text, no_bpjs text, alamat text, skor numeric, alasan text
)
language sql stable security definer set search_path = public as $$
  with nik_bersih  as (select nullif(regexp_replace(coalesce(p_nik,''),     '\D', '', 'g'), '') as n),
       bpjs_bersih as (select nullif(regexp_replace(coalesce(p_no_bpjs,''), '\D', '', 'g'), '') as n)
  select p.id, p.no_rm, p.nama, p.tanggal_lahir, p.jenis_kelamin,
         p.nik, p.no_bpjs, p.alamat,
         greatest(
           case when (select n from nik_bersih) is not null
                 and p.nik = (select n from nik_bersih)
                then 100 else 0 end,
           case when (select n from bpjs_bersih) is not null
                 and regexp_replace(coalesce(p.no_bpjs,''), '\D', '', 'g') = (select n from bpjs_bersih)
                then 95 else 0 end,
           case when lower(btrim(p.nama)) = lower(btrim(p_nama))
                then 90 else 0 end,
           round(similarity(p.nama, p_nama)::numeric * 80, 1)
         ) as skor,
         case
           when (select n from nik_bersih) is not null
            and p.nik = (select n from nik_bersih)
             then 'NIK sama'
           when (select n from bpjs_bersih) is not null
            and regexp_replace(coalesce(p.no_bpjs,''), '\D', '', 'g') = (select n from bpjs_bersih)
             then 'Nomor BPJS sama'
           when lower(btrim(p.nama)) = lower(btrim(p_nama))
             then 'Nama sama persis'
           else 'Nama mirip'
         end as alasan
    from pasien p
   where p.aktif
     and (
       ((select n from nik_bersih) is not null and p.nik = (select n from nik_bersih))
       or ((select n from bpjs_bersih) is not null
            and regexp_replace(coalesce(p.no_bpjs,''), '\D', '', 'g') = (select n from bpjs_bersih))
       or similarity(p.nama, p_nama) > 0.3
     )
   order by skor desc, p.nama
   limit greatest(1, coalesce(p_batas, 5));
$$;

grant execute on function public.pasien_cari_mirip(text, text, text, int) to authenticated;
-- =====================================================================
--  RME Laboratorium Medis Utama - KASIR BOLEH MENGELOLA TARIF (11 Sep 2026)
--
--  Laporan Laboratorium Medis Utama: kasir tidak bisa menambah tarif baru, tombolnya
--  "Tarif baru" di halaman Tarif & Invoice hanya berfungsi untuk master.
--
--  Akar masalahnya DUA LAPIS, bukan satu:
--
--   1. Kode `menu_tarif` (mengatur menu "Tarif & Invoice" terlihat/tidak)
--      belum pernah di-seed untuk peran mana pun selain master — jadi
--      SEBELUM migrasi ini, halamannya sendiri memang tertutup untuk
--      semua peran selain master, persis seperti yang dilaporkan Laboratorium Medis Utama.
--   2. Sekalipun langkah 1 diperbaiki (kasir dicentang `menu_tarif` lewat
--      Pengaturan -> Hak Akses), tombol "Tarif baru" TETAP akan gagal
--      disimpan — kebijakan RLS tabel `kasir_tarif` (tarif_kelola)
--      memeriksa `boleh_master_data()`, kode yang jauh lebih luas
--      (Master Data: obat, poli, ICD-10/9-CM, signa, dst), yang memang
--      sengaja hanya untuk master/admin. Memberi kasir akses master_data
--      hanya supaya bisa mengubah tarif berarti kasir ikut bisa mengubah
--      seluruh Master Data itu juga — bukan itu yang diminta.
--
--  Perbaikan: `menu_tarif` diberi fungsi `boleh_<kode>()` sendiri
--  (boleh_tarif()) dan dipakai LANGSUNG untuk kebijakan tulis
--  `kasir_tarif`, terpisah dari `master_data`. Satu kode, satu centang di
--  Pengaturan -> Hak Akses, cakupannya persis "Tarif & Invoice" saja.
--
--  Tab "Tampilan invoice" (logo/warna/struk) di halaman yang SAMA
--  SENGAJA TETAP dikunci ke boleh_master_data() — perubahan di sana
--  berlaku untuk SEMUA transaksi kasir sekaligus, beda kelas risiko
--  dibanding menambah satu baris tarif. js/pages/tarif.js disesuaikan
--  supaya kasir yang tidak punya master_data melihat tab itu sebagai
--  baca-saja (tombol Simpan disembunyikan), bukan gagal diam-diam saat
--  ditekan.
--
--  Idempoten — aman dijalankan ulang kapan saja.
-- =====================================================================

-- A. Fungsi boleh_tarif() — pembungkus tipis hak_akses_cek('menu_tarif'),
--    mengikuti pola boleh_kasir()/boleh_apotek() yang sudah ada.
create or replace function public.boleh_tarif() returns boolean
language sql stable security definer set search_path = public
as $$ select public.hak_akses_cek('menu_tarif') $$;

grant execute on function public.boleh_tarif() to authenticated;

-- B. Kebijakan tulis Master Tarif: dari boleh_master_data() -> boleh_tarif().
--    Kebijakan baca (tarif_baca) tidak disentuh — semua staf tetap bisa
--    membaca tarif seperti sebelumnya.
drop policy if exists tarif_kelola on kasir_tarif;
create policy tarif_kelola on kasir_tarif for all
  to authenticated
  using (public.boleh_tarif())
  with check (public.boleh_tarif());

-- C. Beri kasir kode `menu_tarif` — ini yang membuat perubahan di atas
--    langsung terasa hari ini, tanpa Laboratorium Medis Utama perlu membuka Pengaturan ->
--    Hak Akses secara manual. Master tetap bisa mencabutnya kembali
--    kapan saja lewat halaman itu kalau berubah pikiran.
insert into public.hak_akses (kode, peran, diizinkan) values
  ('menu_tarif', 'kasir', true)
on conflict (kode, peran) do nothing;
-- =====================================================================
--  RME Laboratorium Medis Utama — HAK AKSES: MASTER DATA KHUSUS OBAT
--  Jalankan SETELAH 25_tarif_kasir.sql
--
--  Permintaan Laboratorium Medis Utama (11 Sep 2026): apoteker perlu bisa membuka & mengelola
--  Master Data untuk OBAT saja (menambah, mengubah, menonaktifkan) — tanpa
--  ikut diberi akses ke Diagnosa (ICD-10), Tindakan (ICD-9-CM), atau
--  Pemeriksaan Lab, yang semuanya sampai sekarang duduk di belakang kode
--  `master_data` yang SAMA (lihat sql/02_rls.sql bagian A, sql/05_gigi.sql,
--  sql/11_penunjang.sql).
--
--  Pola yang dipakai: bukan mengganti `master_data` jadi lebih sempit
--  (itu akan mencabut akses admin/master ke tabel lain), melainkan kode
--  BARU `master_data_obat` yang HANYA menambah izin — dicek lewat fungsi
--  `boleh_master_data_obat()` yang meloloskan siapa pun yang punya kode
--  `master_data` (penuh) ATAU `master_data_obat` (sempit, khusus tabel
--  `obat`). Kebijakan RLS tabel `obat` diarahkan ke fungsi baru ini;
--  `faskes`, `poli`, `icd10`, `signa` (sql/02_rls.sql), `icd9cm` dkk
--  (sql/05_gigi.sql), dan referensi lab (sql/11_penunjang.sql) TIDAK
--  disentuh — tetap murni `boleh_master_data()`.
--
--  Sisi tampilan (js/pages/master.js, js/app.js) mengikuti pola yang sama:
--  peran dengan `master_data_obat` saja melihat menu "Master Data" dan
--  tab "Obat", tapi tidak tab ICD-10/ICD-9/Lab.
--
--  Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A. Fungsi hak akses
-- ---------------------------------------------------------------------
create or replace function public.boleh_master_data_obat() returns boolean
language sql stable security definer set search_path = public
as $$ select public.boleh_master_data() or public.hak_akses_cek('master_data_obat') $$;

grant execute on function public.boleh_master_data_obat() to authenticated;

-- ---------------------------------------------------------------------
-- B. Kebijakan tulis tabel `obat`: dari boleh_master_data() -> fungsi baru.
--    Kebijakan baca (`obat_baca`, dibuat di sql/02_rls.sql) TIDAK diubah —
--    seluruh staf sudah boleh membaca, sama seperti sebelumnya.
-- ---------------------------------------------------------------------
drop policy if exists obat_kelola on obat;
create policy obat_kelola on obat for all
  to authenticated
  using (public.boleh_master_data_obat())
  with check (public.boleh_master_data_obat());

-- ---------------------------------------------------------------------
-- C. Isian awal: apoteker dapat kode ini secara bawaan. Bisa dicabut atau
--    diberikan ke peran lain kapan saja lewat Pengaturan -> Hak Akses.
-- ---------------------------------------------------------------------
insert into public.hak_akses (kode, peran, diizinkan) values
  ('master_data_obat', 'apoteker', true)
on conflict (kode, peran) do nothing;
/* =========================================================================
   27_antrean_realtime.sql
   -------------------------------------------------------------------------
   Mendaftarkan tabel `antrean` ke publication `supabase_realtime` supaya
   papan Antrean (js/pages/antrian.js, lewat DB.langgananAntrean di
   js/db.js) bisa berlangganan perubahan secara realtime — nomor baru dari
   loket/Mobile JKN, dipanggil, check-in, selesai, dst — alih-alih hanya
   mengandalkan penyegaran berkala 12 detik.

   Aman dijalankan berulang (idempotent) — tidak menyentuh tabel lain,
   tidak mengubah RLS. Realtime tetap tunduk pada kebijakan RLS yang
   sudah ada di sql/15_antrean.sql (kebijakan `antrean_baca`, hanya staf
   yang login yang bisa melihat perubahannya).
   ========================================================================= */

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'antrean'
  ) then
    alter publication supabase_realtime add table public.antrean;
  end if;
end $$;
/* =========================================================================
   28_antrol_tanpa_kuota.sql
   -------------------------------------------------------------------------
   Menghapus penegakan kuota pada pendaftaran online Mobile JKN (Antrol).
   Klinik ini tidak pernah membatasi jumlah pasien yang datang berobat —
   baik lewat loket maupun online — jadi blok "Kuota online" yang dulu
   menolak pemesanan begitu `kuota_online` per sesi tercapai dihapus.
   Permintaan eksplisit Laboratorium Medis Utama, 12 Sep 2026.

   `create or replace function` — aman dijalankan berulang, dan berlaku
   langsung untuk pemesanan berikutnya tanpa migrasi data (tidak ada baris
   `antrean` yang perlu diubah).

   Kolom `poli_jadwal.kuota_online` SENGAJA TIDAK dihapus dari skema —
   hanya dibuat tidak berpengaruh lagi. Menghapus kolom NOT NULL berarti
   migrasi skema + kemungkinan menyunting baris yang sudah ada, risiko
   yang tidak sepadan untuk kolom yang sekarang murni tidak dipakai.
   Halaman Jadwal & Kuota (js/pages/jadwal.js) sudah tidak lagi meminta
   ATAU menampilkan angka ini ke petugas — nilainya diisi otomatis dengan
   angka besar (lihat js/pages/jadwal.js) supaya batasan NOT NULL/CHECK
   tetap terpenuhi tanpa staf perlu memikirkannya.

   Fungsi lain yang dulu MENCERMINKAN aturan ini untuk pengujian —
   AntreanCore.bolehDaftarOnline() di js/antrean_core.js — juga diperbarui
   terpisah (lihat commit yang sama) supaya perilakunya tetap sama dengan
   fungsi database ini.
   ========================================================================= */

create or replace function public.antrol_ambil(
  p_no_kartu text, p_nik text, p_kode_poli text, p_tanggal text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c record; j record; g jsonb; a antrean;
  v_pasien uuid; v_nama_poli text; v_nama_pasien text;
  v_sisa int; v_jam time;
begin
  g := public.antrol_periksa_kartu(p_no_kartu); if g is not null then return g; end if;
  g := public.antrol_periksa_nik(p_nik);        if g is not null then return g; end if;

  select * into c from public.antrol_periksa_poli_tanggal(p_kode_poli, p_tanggal);
  if c.v_galat is not null then return c.v_galat; end if;

  select nama into v_nama_poli from poli where id = c.v_poli;

  -- Jadwal
  select * into j from public.poli_jadwal_berlaku(c.v_poli, c.v_tgl);
  if not found then
    return public.antrol_gagal('Pendaftaran ke ' || v_nama_poli || ' sedang tutup pada tanggal tersebut');
  end if;

  -- Jam tutup hanya berlaku untuk pemesanan HARI INI. Pemesanan untuk
  -- besok tidak boleh ditolak karena poli sudah tutup sore ini.
  if c.v_tgl = public.tgl_klinik() then
    v_jam := public.jam_klinik();
    if v_jam > j.jam_tutup_online then
      return public.antrol_gagal(
        'Pendaftaran online ke ' || v_nama_poli || ' hari ini sudah ditutup pukul ' ||
        to_char(j.jam_tutup_online, 'HH24:MI'));
    end if;
  end if;

  -- Sudah punya nomor?
  --
  -- Sengaja memeriksa SEMUA sumber, bukan hanya ONLINE. Kalau pasien
  -- sudah mengambil nomor di loket pagi ini, nomor kedua dari Mobile JKN
  -- akan membuatnya dipanggil dua kali. Indeks unik di tabel hanya
  -- menjaga jalur online; pemeriksaan inilah yang menutup celah
  -- antar-jalur. (Ini BUKAN pemeriksaan kuota — tetap dipertahankan.)
  if exists (
    select 1 from antrean
     where tanggal = c.v_tgl and poli_id = c.v_poli
       and no_kartu = trim(p_no_kartu)
       and status not in ('BATAL','TIDAK_HADIR'))
  then
    return public.antrol_gagal(
      'Nomor antrean hanya dapat diambil satu kali pada tanggal dan poli yang sama');
  end if;

  -- (12 Sep 2026: blok "Kuota online" yang dulu ada di sini — menolak
  -- pemesanan begitu jumlah terpakai mencapai j.kuota_online — DIHAPUS.
  -- Klinik tidak membatasi jumlah pasien; pemesanan Mobile JKN sekarang
  -- selalu diterima selama poli buka dan belum lewat jam tutup online.)

  -- Pasien dikenal? Dicari lewat nomor BPJS dulu, lalu NIK.
  select id, nama into v_pasien, v_nama_pasien
    from pasien
   where aktif and (no_bpjs = trim(p_no_kartu) or nik = trim(p_nik))
   order by (no_bpjs = trim(p_no_kartu)) desc
   limit 1;

  insert into antrean (tanggal, poli_id, sumber, status, tahap,
                       pasien_id, no_kartu, nik, nama_snapshot)
  values (c.v_tgl, c.v_poli, 'ONLINE', 'BELUM_HADIR', 'LOKET',
          v_pasien, trim(p_no_kartu), trim(p_nik), v_nama_pasien)
  returning * into a;

  select count(*) into v_sisa from antrean
   where tanggal = c.v_tgl and poli_id = c.v_poli
     and status in ('BELUM_HADIR','MENUNGGU','DIPANGGIL')
     and no_urut < a.no_urut;

  return jsonb_build_object(
    'response', jsonb_build_object(
      'nomorantrean',  a.nomor,
      'angkaantrean',  a.no_urut::text,
      'namapoli',      v_nama_poli,
      'sisaantrean',   v_sisa::text,
      'antreanpanggil', public.antrol_antrean_panggil(c.v_poli, c.v_tgl),
      'keterangan',    public.antrol_keterangan(),
      'kodebooking',   a.kode_booking),
    'metadata', jsonb_build_object(
      'message', 'Ok',
      -- 202 = peserta belum terdaftar sebagai pasien di sini. Nomornya
      -- TETAP terbit — pasien yang sudah berangkat tidak boleh disuruh
      -- pulang. Kode 202-lah yang memberi tahu Mobile JKN agar mengirim
      -- data dirinya lewat POST /peserta, dan petugas loket melihat
      -- nomor ini bertanda "pasien baru" di papan antrean.
      'code', case when v_pasien is null then 202 else 200 end));
end $$;
-- =====================================================================
--  RME Laboratorium Medis Utama — PERBAIKAN: PENCARIAN DIAGNOSA ICD-10 LAMBAT
--  Jalankan SETELAH 28_antrol_tanpa_kuota.sql
--
--  Keluhan Laboratorium Medis Utama (14 Sep 2026): setelah impor CSV ~10.300 kode ICD-10
--  tambahan (WHO, via fitur Impor CSV yang baru), kotak pencarian
--  diagnosa di layar dokter (DB.cariIcd -> js/db.js) jadi terasa lambat
--  tiap kali mengetik.
--
--  BUKAN karena indeksnya belum ada — idx_icd10_nama_id, idx_icd10_nama_en,
--  dan idx_icd10_kode (GIN + pg_trgm) sudah dibuat sejak sql/01_schema.sql,
--  dan sudah persis menutupi tiga kolom yang dicari cariIcd(). Penyebabnya
--  lebih halus: indeks GIN, secara bawaan, punya `fastupdate = on` —
--  artinya baris yang baru di-INSERT/UPSERT tidak langsung masuk ke
--  struktur indeks utama, melainkan ditampung dulu di "pending list", dan
--  baru digabungkan belakangan (oleh VACUUM, atau otomatis kalau pending
--  list-nya sudah kepenuhan). Selama pending list itu belum digabungkan,
--  SETIAP pencarian ikut memindai pending list itu secara linier di atas
--  indeks utamanya — dan itu yang terasa sebagai "lambat" persis setelah
--  impor besar seperti kemarin, sebelum autovacuum sempat membereskannya
--  sendiri.
--
--  Perbaikan di sini dua lapis:
--   1. VACUUM ANALYZE sekali di bawah — membereskan pending list yang
--      SUDAH menumpuk dari impor kemarin, dan menyegarkan statistik tabel
--      untuk perencana query. Efeknya langsung terasa begitu skrip ini
--      selesai.
--   2. Matikan fastupdate pada tiga indeks itu — supaya baris baru
--      (termasuk impor besar berikutnya, kalau WHO merilis revisi ICD-10)
--      langsung masuk ke struktur indeks utama tanpa lewat pending list
--      sama sekali. Tabel ini jarang ditulis (data acuan, bukan transaksi
--      pasien) tapi SANGAT sering dibaca (tiap dokter mengetik), jadi
--      trade-off yang benar adalah: penulisan sedikit lebih lambat,
--      pembacaan selalu konsisten cepat — persis kebalikan dari asumsi
--      bawaan `fastupdate = on` yang mengoptimalkan untuk penulisan.
--
--  Aman dijalankan ulang. Tidak mengunci tabel lama (ALTER INDEX ... SET
--  hanya mengubah parameter penyimpanan, bukan menulis ulang indeksnya;
--  VACUUM ANALYZE tanpa FULL tidak mengunci pembacaan/penulisan tabel).
-- =====================================================================

alter index if exists idx_icd10_nama_id set (fastupdate = off);
alter index if exists idx_icd10_nama_en set (fastupdate = off);
alter index if exists idx_icd10_kode    set (fastupdate = off);

vacuum analyze icd10;
-- =====================================================================
--  RME Laboratorium Medis Utama — PERCEPAT LAGI: SATU INDEKS GABUNGAN ICD-10
--  Jalankan SETELAH 29_icd10_pencarian_cepat.sql
--
--  Laboratorium Medis Utama melaporkan pencarian ICD-10 sudah lebih cepat setelah 29_...,
--  tapi masih agak lama. Penyebab sisa: cariIcd() dan daftarIcd10()
--  (js/db.js) mencari lewat TIGA indeks GIN terpisah sekaligus (kode,
--  nama_id, nama_en) yang digabung dengan OR — untuk setiap ketikan,
--  Postgres memindai ketiga indeks itu lalu MENGGABUNGKAN hasilnya
--  (bitmap OR) sebelum menyaring baris yang cocok. Tiga kali pindai +
--  satu kali gabung, padahal cukup satu.
--
--  Perbaikan: satu kolom gabungan `cari_teks` (kode + nama_id + nama_en
--  digabung jadi satu teks) dengan SATU indeks GIN. Pencarian jadi satu
--  kali pindai indeks, bukan tiga digabung. `cari_teks` adalah GENERATED
--  COLUMN (STORED) — terisi dan diperbarui SENDIRI oleh PostgreSQL setiap
--  baris ditambah/diubah (termasuk lewat impor CSV), Anda tidak perlu
--  mengisi atau memeliharanya secara manual sama sekali.
--
--  js/db.js yang menyertai berkas ini sudah diarahkan memakai `cari_teks`
--  (cariIcd untuk kotak pencarian dokter, daftarIcd10 untuk tab Master
--  Data), jadi begitu migrasi ini selesai, TIGA indeks lama di bawah
--  sudah tidak dipakai query mana pun lagi — dihapus di sini supaya
--  PostgreSQL tidak perlu memelihara empat indeks tiap kali ada impor
--  CSV besar berikutnya, cukup satu.
--
--  CARA MENJALANKAN — TETAP DUA LANGKAH TERPISAH (pelajaran dari 29_):
--  VACUUM tidak boleh berjalan di dalam blok transaksi, dan Supabase SQL
--  Editor membungkus SELURUH isi yang ditempel jadi satu blok transaksi.
--  Jadi BAGIAN A dan BAGIAN B di bawah WAJIB dua query terpisah:
--    1. Blok baru di SQL Editor -> tempel BAGIAN A saja -> Run.
--    2. Bersihkan isinya -> tempel BAGIAN B saja -> Run.
--
--  Aman dijalankan ulang. Menambah kolom generated pada tabel berisi
--  belasan ribu baris makan waktu beberapa detik (Postgres menulis
--  ulang tabelnya sekali) — itu normal, bukan macet, jangan ditutup
--  di tengah jalan.
-- =====================================================================

-- ---------------------------------------------------------------------
-- BAGIAN A — jalankan sebagai query pertama
-- ---------------------------------------------------------------------
alter table icd10
  add column if not exists cari_teks text
  generated always as (
    kode || ' ' || coalesce(nama_id, '') || ' ' || coalesce(nama_en, '')
  ) stored;

create index if not exists idx_icd10_cari_teks
  on icd10 using gin (cari_teks gin_trgm_ops);

-- Sama seperti 29_: matikan fastupdate dari awal, supaya impor besar
-- berikutnya tidak menumpuk pending list lagi di indeks yang baru ini.
alter index idx_icd10_cari_teks set (fastupdate = off);

drop index if exists idx_icd10_nama_id;
drop index if exists idx_icd10_nama_en;
drop index if exists idx_icd10_kode;

-- ---------------------------------------------------------------------
-- BAGIAN B — bersihkan editor, lalu jalankan INI SENDIRIAN sebagai
-- query kedua (terpisah dari Bagian A di atas).
-- ---------------------------------------------------------------------
vacuum analyze icd10;


- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -     3 1 _ h r i s _ a b s e n s i . s q l  
 - -     M o d u l   H R I S :   S i s t e m   A b s e n s i   P e g a w a i  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p e g a w a i _ a b s e n s i   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
     p e g a w a i _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p e g a w a i ( i d )   o n   d e l e t e   c a s c a d e ,  
     t a n g g a l   d a t e   n o t   n u l l   d e f a u l t   c u r r e n t _ d a t e ,  
     w a k t u _ m a s u k   t i m e s t a m p t z ,  
     w a k t u _ k e l u a r   t i m e s t a m p t z ,  
     s t a t u s   t e x t   n o t   n u l l   d e f a u l t   ' H A D I R ' ,   - -   H A D I R ,   I Z I N ,   S A K I T ,   A L F A ,   C U T I  
     k e t e r a n g a n   t e x t ,  
     - -   O p s i o n a l :   K o o r d i n a t   a t a u   n a m a   j a r i n g a n   ( I P )   u n t u k   v a l i d a s i   l o k a s i  
     l o k a s i _ m a s u k   t e x t ,  
     l o k a s i _ k e l u a r   t e x t ,  
     c r e a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( ) ,  
     u p d a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( )  
 ) ;  
 c r e a t e   i n d e x   i f   n o t   e x i s t s   i d x _ a b s e n s i _ t a n g g a l   o n   p e g a w a i _ a b s e n s i   ( t a n g g a l   d e s c ) ;  
 c r e a t e   i n d e x   i f   n o t   e x i s t s   i d x _ a b s e n s i _ p e g a w a i   o n   p e g a w a i _ a b s e n s i   ( p e g a w a i _ i d ,   t a n g g a l   d e s c ) ;  
 - -   M e n c e g a h   a b s e n   m a s u k   b e r k a l i - k a l i   d i   h a r i   y a n g   s a m a   k e c u a l i   s h i f t   m a l a m   ( d i s e d e r h a n a k a n   1   h a r i   1   a b s e n s i )  
 c r e a t e   u n i q u e   i n d e x   i f   n o t   e x i s t s   u q _ a b s e n s i _ h a r i a n   o n   p e g a w a i _ a b s e n s i ( p e g a w a i _ i d ,   t a n g g a l ) ;  
  
 c r e a t e   t r i g g e r   t r g _ u p d a t e d _ p e g a w a i _ a b s e n s i   b e f o r e   u p d a t e   o n   p e g a w a i _ a b s e n s i  
 f o r   e a c h   r o w   e x e c u t e   f u n c t i o n   s e t _ u p d a t e d _ a t ( ) ;  
  
 - -   R L S  
 a l t e r   t a b l e   p e g a w a i _ a b s e n s i   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
  
 - -   P e g a w a i   b i s a   m e l i h a t   a b s e n s i n y a   s e n d i r i ,   M a s t e r   b i s a   m e l i h a t   s e m u a  
 c r e a t e   p o l i c y   " P e g a w a i   b i s a   m e l i h a t   a b s e n s i n y a   s e n d i r i "  
 o n   p e g a w a i _ a b s e n s i   f o r   s e l e c t  
 u s i n g   ( a u t h . u i d ( )   =   p e g a w a i _ i d   o r   e x i s t s   ( s e l e c t   1   f r o m   p e g a w a i   w h e r e   i d   =   a u t h . u i d ( )   a n d   p e r a n   =   ' m a s t e r ' ) ) ;  
  
 - -   P e g a w a i   b i s a   m e n a m b a h   a b s e n s i n y a   s e n d i r i   ( C l o c k   I n )  
 c r e a t e   p o l i c y   " P e g a w a i   b i s a   a b s e n   m a s u k "  
 o n   p e g a w a i _ a b s e n s i   f o r   i n s e r t  
 w i t h   c h e c k   ( a u t h . u i d ( )   =   p e g a w a i _ i d ) ;  
  
 - -   P e g a w a i   b i s a   m e n g u p d a t e   a b s e n s i n y a   s e n d i r i   ( C l o c k   O u t )  
 c r e a t e   p o l i c y   " P e g a w a i   b i s a   a b s e n   k e l u a r "  
 o n   p e g a w a i _ a b s e n s i   f o r   u p d a t e  
 u s i n g   ( a u t h . u i d ( )   =   p e g a w a i _ i d   o r   e x i s t s   ( s e l e c t   1   f r o m   p e g a w a i   w h e r e   i d   =   a u t h . u i d ( )   a n d   p e r a n   =   ' m a s t e r ' ) ) ;  
  
 - -   M a s t e r   b i s a   m e n g h a p u s   j i k a   p e r l u  
 c r e a t e   p o l i c y   " M a s t e r   b i s a   m e n g h a p u s   a b s e n s i "  
 o n   p e g a w a i _ a b s e n s i   f o r   d e l e t e  
 u s i n g   ( e x i s t s   ( s e l e c t   1   f r o m   p e g a w a i   w h e r e   i d   =   a u t h . u i d ( )   a n d   p e r a n   =   ' m a s t e r ' ) ) ;  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -     3 2 _ h r i s _ k p i _ b o n u s . s q l  
 - -     M o d u l   H R I S :   S i s t e m   K P I   d a n   P e r h i t u n g a n   B o n u s   P e g a w a i  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p e g a w a i _ k p i   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
     p e g a w a i _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p e g a w a i ( i d )   o n   d e l e t e   c a s c a d e ,  
     b u l a n   s m a l l i n t   n o t   n u l l   c h e c k   ( b u l a n   b e t w e e n   1   a n d   1 2 ) ,  
     t a h u n   i n t e g e r   n o t   n u l l ,  
     m e t r i k   t e x t   n o t   n u l l ,                 - -   m i s a l n y a :   ' P a s i e n   D i t a n g a n i ' ,   ' R e s e p   S e l e s a i ' ,   ' K e h a d i r a n   T e p a t   W a k t u '  
     t a r g e t   n u m e r i c ( 1 2 , 2 )   d e f a u l t   0 ,  
     c a p a i a n   n u m e r i c ( 1 2 , 2 )   d e f a u l t   0 ,  
     n i l a i   n u m e r i c ( 5 , 2 )   g e n e r a t e d   a l w a y s   a s   (  
         c a s e   w h e n   t a r g e t   >   0   t h e n   l e a s t ( r o u n d ( ( c a p a i a n   /   t a r g e t )   *   1 0 0 ,   2 ) ,   9 9 9 . 9 9 )  
                   e l s e   0   e n d  
     )   s t o r e d ,  
     k e t e r a n g a n   t e x t ,  
     c r e a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( ) ,  
     u p d a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( )  
 ) ;  
 c r e a t e   i n d e x   i f   n o t   e x i s t s   i d x _ k p i _ p e r i o d e   o n   p e g a w a i _ k p i   ( t a h u n ,   b u l a n ) ;  
 c r e a t e   i n d e x   i f   n o t   e x i s t s   i d x _ k p i _ p e g a w a i   o n   p e g a w a i _ k p i   ( p e g a w a i _ i d ) ;  
  
 c r e a t e   t r i g g e r   t r g _ u p d a t e d _ p e g a w a i _ k p i   b e f o r e   u p d a t e   o n   p e g a w a i _ k p i  
 f o r   e a c h   r o w   e x e c u t e   f u n c t i o n   s e t _ u p d a t e d _ a t ( ) ;  
  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p e g a w a i _ b o n u s   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
     p e g a w a i _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p e g a w a i ( i d )   o n   d e l e t e   c a s c a d e ,  
     b u l a n   s m a l l i n t   n o t   n u l l   c h e c k   ( b u l a n   b e t w e e n   1   a n d   1 2 ) ,  
     t a h u n   i n t e g e r   n o t   n u l l ,  
     k o m p o n e n _ a b s e n s i   n u m e r i c ( 1 2 , 2 )   d e f a u l t   0 ,  
     k o m p o n e n _ k p i   n u m e r i c ( 1 2 , 2 )   d e f a u l t   0 ,  
     k o m p o n e n _ l a i n n y a   n u m e r i c ( 1 2 , 2 )   d e f a u l t   0 ,  
     t o t a l _ b o n u s   n u m e r i c ( 1 5 , 2 )   g e n e r a t e d   a l w a y s   a s   (  
         k o m p o n e n _ a b s e n s i   +   k o m p o n e n _ k p i   +   k o m p o n e n _ l a i n n y a  
     )   s t o r e d ,  
     s t a t u s _ b a y a r   t e x t   n o t   n u l l   d e f a u l t   ' B E L U M ' ,   - -   B E L U M ,   D I B A Y A R  
     t a n g g a l _ b a y a r   d a t e ,  
     c a t a t a n   t e x t ,  
     c r e a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( ) ,  
     u p d a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( )  
 ) ;  
 - -   M e n c e g a h   d u p l i k a s i   p e m b a y a r a n   b o n u s   b u l a n a n  
 c r e a t e   u n i q u e   i n d e x   i f   n o t   e x i s t s   u q _ b o n u s _ b u l a n a n   o n   p e g a w a i _ b o n u s   ( p e g a w a i _ i d ,   b u l a n ,   t a h u n ) ;  
  
 c r e a t e   t r i g g e r   t r g _ u p d a t e d _ p e g a w a i _ b o n u s   b e f o r e   u p d a t e   o n   p e g a w a i _ b o n u s  
 f o r   e a c h   r o w   e x e c u t e   f u n c t i o n   s e t _ u p d a t e d _ a t ( ) ;  
  
 - -   R L S  
 a l t e r   t a b l e   p e g a w a i _ k p i   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 a l t e r   t a b l e   p e g a w a i _ b o n u s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
  
 - -   P e g a w a i   b i s a   m e l i h a t   m i l i k n y a   s e n d i r i ,   M a s t e r   b i s a   m e l i h a t   d a n   e d i t   s e m u a  
 c r e a t e   p o l i c y   " P e g a w a i   l i h a t   k p i   s e n d i r i "   o n   p e g a w a i _ k p i   f o r   s e l e c t  
 u s i n g   ( a u t h . u i d ( )   =   p e g a w a i _ i d   o r   e x i s t s   ( s e l e c t   1   f r o m   p e g a w a i   w h e r e   i d   =   a u t h . u i d ( )   a n d   p e r a n   =   ' m a s t e r ' ) ) ;  
  
 c r e a t e   p o l i c y   " M a s t e r   b i s a   k e l o l a   k p i "   o n   p e g a w a i _ k p i   f o r   a l l  
 u s i n g   ( e x i s t s   ( s e l e c t   1   f r o m   p e g a w a i   w h e r e   i d   =   a u t h . u i d ( )   a n d   p e r a n   =   ' m a s t e r ' ) ) ;  
  
 c r e a t e   p o l i c y   " P e g a w a i   l i h a t   b o n u s   s e n d i r i "   o n   p e g a w a i _ b o n u s   f o r   s e l e c t  
 u s i n g   ( a u t h . u i d ( )   =   p e g a w a i _ i d   o r   e x i s t s   ( s e l e c t   1   f r o m   p e g a w a i   w h e r e   i d   =   a u t h . u i d ( )   a n d   p e r a n   =   ' m a s t e r ' ) ) ;  
  
 c r e a t e   p o l i c y   " M a s t e r   b i s a   k e l o l a   b o n u s "   o n   p e g a w a i _ b o n u s   f o r   a l l  
 u s i n g   ( e x i s t s   ( s e l e c t   1   f r o m   p e g a w a i   w h e r e   i d   =   a u t h . u i d ( )   a n d   p e r a n   =   ' m a s t e r ' ) ) ;  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -     3 3 _ i n v e n t o r i _ u m u m . s q l  
 - -     M o d u l   I n v e n t o r i   U m u m :   P e n c a t a t a n   I n / O u t   b a r a n g   n o n - m e d i s   /   R e a g e n   L a b  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   i n v e n t o r i _ b a r a n g   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
     k o d e   t e x t   u n i q u e ,  
     n a m a   t e x t   n o t   n u l l ,  
     k a t e g o r i   t e x t ,                             - -   m i s .   ' R e a g e n ' ,   ' A T K ' ,   ' B H P   N o n - M e d i s '  
     s a t u a n   t e x t   n o t   n u l l   d e f a u l t   ' P c s ' ,  
     s t o k _ s e k a r a n g   n u m e r i c ( 1 0 , 2 )   n o t   n u l l   d e f a u l t   0 ,  
     s t o k _ m i n i m u m   n u m e r i c ( 1 0 , 2 )   d e f a u l t   0 ,  
     h a r g a _ s a t u a n   n u m e r i c ( 1 2 , 2 )   d e f a u l t   0 ,  
     a k t i f   b o o l e a n   n o t   n u l l   d e f a u l t   t r u e ,  
     c r e a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( ) ,  
     u p d a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( )  
 ) ;  
  
 c r e a t e   t r i g g e r   t r g _ u p d a t e d _ i n v e n t o r i _ b a r a n g   b e f o r e   u p d a t e   o n   i n v e n t o r i _ b a r a n g  
 f o r   e a c h   r o w   e x e c u t e   f u n c t i o n   s e t _ u p d a t e d _ a t ( ) ;  
  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   i n v e n t o r i _ m u t a s i   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
     b a r a n g _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   i n v e n t o r i _ b a r a n g ( i d )   o n   d e l e t e   c a s c a d e ,  
     t a n g g a l   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( ) ,  
     j e n i s   t e x t   n o t   n u l l   c h e c k   ( j e n i s   i n   ( ' I N ' ,   ' O U T ' ,   ' A D J U S T M E N T ' ) ) ,  
     j u m l a h   n u m e r i c ( 1 0 , 2 )   n o t   n u l l   c h e c k   ( j u m l a h   >   0 ) ,  
     s t o k _ a w a l   n u m e r i c ( 1 0 , 2 ) ,  
     s t o k _ a k h i r   n u m e r i c ( 1 0 , 2 ) ,  
     k e t e r a n g a n   t e x t ,  
     r e f e r e n s i   t e x t ,                           - -   n o m o r   n o t a   /   s t r u k   j i k a   a d a  
     d i c a t a t _ o l e h   u u i d   r e f e r e n c e s   p e g a w a i ( i d ) ,  
     c r e a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( )  
 ) ;  
 c r e a t e   i n d e x   i f   n o t   e x i s t s   i d x _ m u t a s i _ b a r a n g   o n   i n v e n t o r i _ m u t a s i   ( b a r a n g _ i d ,   t a n g g a l   d e s c ) ;  
  
 - -   R L S  
 a l t e r   t a b l e   i n v e n t o r i _ b a r a n g   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 a l t e r   t a b l e   i n v e n t o r i _ m u t a s i   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
  
 - -   S e m u a   p e g a w a i   ( t e r u t a m a   m a s t e r / a d m i n )   b i s a   m e l i h a t   b a r a n g   d a n   m u t a s i  
 c r e a t e   p o l i c y   " P e g a w a i   b i s a   m e l i h a t   b a r a n g "   o n   i n v e n t o r i _ b a r a n g   f o r   s e l e c t   u s i n g   ( t r u e ) ;  
 c r e a t e   p o l i c y   " P e g a w a i   b i s a   m e l i h a t   m u t a s i "   o n   i n v e n t o r i _ m u t a s i   f o r   s e l e c t   u s i n g   ( t r u e ) ;  
  
 - -   H a n y a   m a s t e r   /   a d m i n   k h u s u s   ( y a n g   d i b e r i   w e w e n a n g )   y a n g   b i s a   k e l o l a  
 c r e a t e   p o l i c y   " M a s t e r   b i s a   k e l o l a   b a r a n g "   o n   i n v e n t o r i _ b a r a n g   f o r   a l l  
 u s i n g   ( e x i s t s   ( s e l e c t   1   f r o m   p e g a w a i   w h e r e   i d   =   a u t h . u i d ( )   a n d   p e r a n   i n   ( ' m a s t e r ' ,   ' a d m i n ' ) ) ) ;  
  
 c r e a t e   p o l i c y   " M a s t e r   b i s a   k e l o l a   m u t a s i "   o n   i n v e n t o r i _ m u t a s i   f o r   a l l  
 u s i n g   ( e x i s t s   ( s e l e c t   1   f r o m   p e g a w a i   w h e r e   i d   =   a u t h . u i d ( )   a n d   p e r a n   i n   ( ' m a s t e r ' ,   ' a d m i n ' ) ) ) ;  
  
 - -   T r i g g e r   u n t u k   u p d a t e   s t o k   o t o m a t i s   s a a t   m u t a s i   d i m a s u k k a n  
 c r e a t e   o r   r e p l a c e   f u n c t i o n   u p d a t e _ s t o k _ i n v e n t o r i ( )   r e t u r n s   t r i g g e r  
 l a n g u a g e   p l p g s q l   a s   $ $  
 d e c l a r e  
     s t o k _ l a m a   n u m e r i c ;  
     s t o k _ b a r u   n u m e r i c ;  
 b e g i n  
     s e l e c t   s t o k _ s e k a r a n g   i n t o   s t o k _ l a m a   f r o m   i n v e n t o r i _ b a r a n g   w h e r e   i d   =   n e w . b a r a n g _ i d   f o r   u p d a t e ;  
      
     i f   n e w . j e n i s   =   ' I N '   t h e n  
         s t o k _ b a r u   : =   s t o k _ l a m a   +   n e w . j u m l a h ;  
     e l s i f   n e w . j e n i s   =   ' O U T '   t h e n  
         s t o k _ b a r u   : =   s t o k _ l a m a   -   n e w . j u m l a h ;  
     e l s i f   n e w . j e n i s   =   ' A D J U S T M E N T '   t h e n  
         - -   M i s a l   a d j u s t m e n t   l a n g s u n g   d i s e t   k e   j u m l a h   ( a t a u   l o g i k a   l a i n )  
         - -   A s u m s i   s e d e r h a n a :   j i k a   a d j u s t m e n t ,   ' j u m l a h '   m e w a k i l i   s e l i s i h   p o s i t i f / n e g a t i f .    
         - -   T a p i   t i p e   d a t a   k i t a   m e n s y a r a t k a n   j u m l a h   >   0 .  
         - -   K i t a   b u a t   k h u s u s   j i k a   j e n i s   O U T ,   m a k a   k u r a n g i .  
         s t o k _ b a r u   : =   s t o k _ l a m a ;    
     e n d   i f ;  
      
     n e w . s t o k _ a w a l   : =   s t o k _ l a m a ;  
     n e w . s t o k _ a k h i r   : =   s t o k _ b a r u ;  
      
     u p d a t e   i n v e n t o r i _ b a r a n g   s e t   s t o k _ s e k a r a n g   =   s t o k _ b a r u   w h e r e   i d   =   n e w . b a r a n g _ i d ;  
      
     r e t u r n   n e w ;  
 e n d   $ $ ;  
  
 d r o p   t r i g g e r   i f   e x i s t s   t r g _ u p d a t e _ s t o k _ i n v e n t o r i   o n   i n v e n t o r i _ m u t a s i ;  
 c r e a t e   t r i g g e r   t r g _ u p d a t e _ s t o k _ i n v e n t o r i   b e f o r e   i n s e r t   o n   i n v e n t o r i _ m u t a s i  
 f o r   e a c h   r o w   e x e c u t e   f u n c t i o n   u p d a t e _ s t o k _ i n v e n t o r i ( ) ;  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -     4 0 _ s t a t i s t i k _ e k s e k u t i f . s q l  
 - -     M o d u l   D a s h b o a r d :   R i n g k a s a n   E k s e k u t i f   u n t u k   M a n a j e m e n  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 c r e a t e   o r   r e p l a c e   f u n c t i o n   p u b l i c . s t a t i s t i k _ e k s e k u t i f ( )  
 r e t u r n s   j s o n  
 l a n g u a g e   p l p g s q l  
 s e c u r i t y   d e f i n e r  
 a s   $ $  
 d e c l a r e  
     v _ t g l   d a t e   : =   p u b l i c . t g l _ k l i n i k ( ) ;  
     v _ b l n   i n t e g e r   : =   e x t r a c t ( m o n t h   f r o m   v _ t g l ) ;  
     v _ t h n   i n t e g e r   : =   e x t r a c t ( y e a r   f r o m   v _ t g l ) ;  
     v _ b l n _ l a l u   i n t e g e r   : =   e x t r a c t ( m o n t h   f r o m   ( v _ t g l   -   i n t e r v a l   ' 1   m o n t h ' ) ) ;  
     v _ t h n _ l a l u   i n t e g e r   : =   e x t r a c t ( y e a r   f r o m   ( v _ t g l   -   i n t e r v a l   ' 1   m o n t h ' ) ) ;  
      
     v _ t o t a l _ p a s i e n   i n t   : =   0 ;  
     v _ k u n j u n g a n _ h a r i _ i n i   i n t   : =   0 ;  
     v _ k u n j u n g a n _ b u l a n _ i n i   i n t   : =   0 ;  
     v _ p e n d a p a t a n _ b u l a n _ i n i   n u m e r i c   : =   0 ;  
     v _ p e n d a p a t a n _ b u l a n _ l a l u   n u m e r i c   : =   0 ;  
     v _ s t o k _ k r i t i s _ i n v e n t o r i   i n t   : =   0 ;  
     v _ p e g a w a i _ h a d i r _ h a r i _ i n i   i n t   : =   0 ;  
     v _ t o t a l _ b o n u s _ b u l a n _ i n i   n u m e r i c   : =   0 ;  
 b e g i n  
     - -   1 .   P e l a y a n a n   ( P a s i e n   &   K u n j u n g a n )  
     s e l e c t   c o u n t ( * )   i n t o   v _ t o t a l _ p a s i e n   f r o m   p a s i e n ;  
     s e l e c t   c o u n t ( * )   i n t o   v _ k u n j u n g a n _ h a r i _ i n i   f r o m   k u n j u n g a n   w h e r e   t a n g g a l   =   v _ t g l ;  
     s e l e c t   c o u n t ( * )   i n t o   v _ k u n j u n g a n _ b u l a n _ i n i   f r o m   k u n j u n g a n    
         w h e r e   e x t r a c t ( m o n t h   f r o m   t a n g g a l )   =   v _ b l n   a n d   e x t r a c t ( y e a r   f r o m   t a n g g a l )   =   v _ t h n ;  
  
     - -   2 .   K e u a n g a n   ( K a s i r   T a g i h a n   -   A s u m s i   a m o u n t _ p a i d   a d a l a h   p e n d a p a t a n   k a s )  
     s e l e c t   c o a l e s c e ( s u m ( a m o u n t _ p a i d ) ,   0 )   i n t o   v _ p e n d a p a t a n _ b u l a n _ i n i    
         f r o m   k a s i r _ t a g i h a n    
         w h e r e   e x t r a c t ( m o n t h   f r o m   t a n g g a l )   =   v _ b l n   a n d   e x t r a c t ( y e a r   f r o m   t a n g g a l )   =   v _ t h n ;  
          
     s e l e c t   c o a l e s c e ( s u m ( a m o u n t _ p a i d ) ,   0 )   i n t o   v _ p e n d a p a t a n _ b u l a n _ l a l u    
         f r o m   k a s i r _ t a g i h a n    
         w h e r e   e x t r a c t ( m o n t h   f r o m   t a n g g a l )   =   v _ b l n _ l a l u   a n d   e x t r a c t ( y e a r   f r o m   t a n g g a l )   =   v _ t h n _ l a l u ;  
  
     - -   3 .   O p e r a s i o n a l   &   I n v e n t o r i   ( S t o k   M e n i p i s )  
     s e l e c t   c o u n t ( * )   i n t o   v _ s t o k _ k r i t i s _ i n v e n t o r i    
         f r o m   i n v e n t o r i _ b a r a n g    
         w h e r e   a k t i f   =   t r u e   a n d   s t o k _ s e k a r a n g   < =   s t o k _ m i n i m u m ;  
  
     - -   4 .   H R I S   ( K e h a d i r a n   &   B o n u s )  
     s e l e c t   c o u n t ( d i s t i n c t   p e g a w a i _ i d )   i n t o   v _ p e g a w a i _ h a d i r _ h a r i _ i n i    
         f r o m   p e g a w a i _ a b s e n s i    
         w h e r e   t a n g g a l   =   v _ t g l ;  
          
     s e l e c t   c o a l e s c e ( s u m ( t o t a l _ b o n u s ) ,   0 )   i n t o   v _ t o t a l _ b o n u s _ b u l a n _ i n i    
         f r o m   p e g a w a i _ b o n u s    
         w h e r e   b u l a n   =   v _ b l n   a n d   t a h u n   =   v _ t h n ;  
  
     r e t u r n   j s o n _ b u i l d _ o b j e c t (  
         ' t o t a l _ p a s i e n ' ,   v _ t o t a l _ p a s i e n ,  
         ' k u n j u n g a n _ h a r i _ i n i ' ,   v _ k u n j u n g a n _ h a r i _ i n i ,  
         ' k u n j u n g a n _ b u l a n _ i n i ' ,   v _ k u n j u n g a n _ b u l a n _ i n i ,  
         ' p e n d a p a t a n _ b u l a n _ i n i ' ,   v _ p e n d a p a t a n _ b u l a n _ i n i ,  
         ' p e n d a p a t a n _ b u l a n _ l a l u ' ,   v _ p e n d a p a t a n _ b u l a n _ l a l u ,  
         ' s t o k _ k r i t i s _ i n v e n t o r i ' ,   v _ s t o k _ k r i t i s _ i n v e n t o r i ,  
         ' p e g a w a i _ h a d i r _ h a r i _ i n i ' ,   v _ p e g a w a i _ h a d i r _ h a r i _ i n i ,  
         ' t o t a l _ b o n u s _ b u l a n _ i n i ' ,   v _ t o t a l _ b o n u s _ b u l a n _ i n i  
     ) ;  
 e n d ;  
 $ $ ;  
  
 - -   I z i n k a n   p e g a w a i   ( t e r u t a m a   m a s t e r )   m e n g e k s e k u s i   f u n g s i   i n i  
 g r a n t   e x e c u t e   o n   f u n c t i o n   p u b l i c . s t a t i s t i k _ e k s e k u t i f ( )   t o   a u t h e n t i c a t e d ;  
 