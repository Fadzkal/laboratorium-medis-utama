-- =====================================================================
-- 90_lis_realtime_publication.sql
-- Mendaftarkan tabel riwayat sampel LIS ke publication supabase_realtime
-- agar event INSERT, UPDATE, DELETE tersinkronisasi realtime multi-device
-- =====================================================================

DO $$
BEGIN
  -- Pastikan publikasi supabase_realtime ada
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    
    -- 1. Daftarkan tabel lis_riwayat_sampel jika belum terdaftar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lis_riwayat_sampel') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'lis_riwayat_sampel'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lis_riwayat_sampel;
      END IF;
    END IF;

    -- 2. Daftarkan juga tabel lis_samples jika tabel tersebut dibuat/digunakan
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lis_samples') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'lis_samples'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lis_samples;
      END IF;
    END IF;

  END IF;
END $$;

-- Set REPLICA IDENTITY FULL agar payload event DELETE menyertakan seluruh kolom record lama
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lis_riwayat_sampel') THEN
    ALTER TABLE public.lis_riwayat_sampel REPLICA IDENTITY FULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lis_samples') THEN
    ALTER TABLE public.lis_samples REPLICA IDENTITY FULL;
  END IF;
END $$;
