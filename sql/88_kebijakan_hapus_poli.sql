-- ============================================================================
-- Migrasi 88: Kebijakan Hapus Data Poli untuk Master & Developer
-- Laboratorium Medis Utama
-- ============================================================================

-- Pastikan RLS aktif pada tabel poli
ALTER TABLE public.poli ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan hapus poli secara eksplisit untuk peran master & developer
DROP POLICY IF EXISTS poli_hapus ON public.poli;
CREATE POLICY poli_hapus ON public.poli
  FOR DELETE
  TO authenticated
  USING (
    public.peran_saya() IN ('master', 'developer')
  );

-- 2. Pastikan kebijakan kelola (all) juga mencakup master & developer
DROP POLICY IF EXISTS poli_kelola ON public.poli;
CREATE POLICY poli_kelola ON public.poli
  FOR ALL
  TO authenticated
  USING (
    public.peran_saya() IN ('master', 'developer')
  )
  WITH CHECK (
    public.peran_saya() IN ('master', 'developer')
  );
