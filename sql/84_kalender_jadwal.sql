-- ==============================================================================
-- 84_kalender_jadwal.sql
-- Migrasi tabel public.kalender_jadwal untuk agenda laboratorium, shift, dan operasional
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.kalender_jadwal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  deskripsi TEXT,
  tanggal DATE NOT NULL,
  waktu_mulai TIME,
  waktu_selesai TIME,
  kategori TEXT DEFAULT 'Umum',
  warna TEXT DEFAULT '#0d9488',
  dibuat_oleh TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index performa pencarian berdasarkan tanggal
CREATE INDEX IF NOT EXISTS idx_kalender_jadwal_tanggal ON public.kalender_jadwal(tanggal);

-- Trigger untuk memperbarui updated_at secara otomatis
CREATE OR REPLACE FUNCTION public.set_kalender_jadwal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kalender_jadwal_updated_at ON public.kalender_jadwal;
CREATE TRIGGER trg_kalender_jadwal_updated_at
  BEFORE UPDATE ON public.kalender_jadwal
  FOR EACH ROW
  EXECUTE FUNCTION public.set_kalender_jadwal_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================
ALTER TABLE public.kalender_jadwal ENABLE ROW LEVEL SECURITY;

-- 1. Policy SELECT (Semua pengguna authenticated & anon dapat melihat jadwal)
DROP POLICY IF EXISTS "Semua role dapat melihat kalender_jadwal" ON public.kalender_jadwal;
CREATE POLICY "Semua role dapat melihat kalender_jadwal"
  ON public.kalender_jadwal
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 2. Policy INSERT (Authenticated & anon diizinkan menambah jadwal dari aplikasi)
DROP POLICY IF EXISTS "Semua role dapat menambah kalender_jadwal" ON public.kalender_jadwal;
CREATE POLICY "Semua role dapat menambah kalender_jadwal"
  ON public.kalender_jadwal
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 3. Policy UPDATE (Authenticated & anon diizinkan memperbarui jadwal)
DROP POLICY IF EXISTS "Semua role dapat mengubah kalender_jadwal" ON public.kalender_jadwal;
CREATE POLICY "Semua role dapat mengubah kalender_jadwal"
  ON public.kalender_jadwal
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 4. Policy DELETE (Authenticated & anon diizinkan menghapus jadwal)
DROP POLICY IF EXISTS "Semua role dapat menghapus kalender_jadwal" ON public.kalender_jadwal;
CREATE POLICY "Semua role dapat menghapus kalender_jadwal"
  ON public.kalender_jadwal
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- Berikan izin akses penuh ke tabel untuk authenticated, anon, dan service_role
GRANT ALL ON TABLE public.kalender_jadwal TO authenticated, anon, service_role;
