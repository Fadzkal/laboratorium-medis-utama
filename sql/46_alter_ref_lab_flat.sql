-- SQL Patch untuk menambahkan kolom-kolom flat dari CSV legacy ke tabel ref_lab
alter table public.ref_lab
  add column if not exists loinc_display text,
  add column if not exists kode_specimen text,
  add column if not exists nama_specimen text,
  add column if not exists metode text,
  add column if not exists barcode text,
  add column if not exists janji_hasil text,
  add column if not exists nilai_normal text,
  add column if not exists min_normal numeric,
  add column if not exists max_normal numeric,
  add column if not exists min_l numeric,
  add column if not exists max_l numeric,
  add column if not exists min_p numeric,
  add column if not exists max_p numeric,
  add column if not exists normal_l text,
  add column if not exists normal_p text;

-- Karena skema berubah, beri tahu PostgREST untuk memuat ulang cache skema:
notify pgrst, 'reload schema';
