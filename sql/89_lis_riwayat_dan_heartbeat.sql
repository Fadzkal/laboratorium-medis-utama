-- ============================================================================
-- Migrasi 89: Tabel Riwayat Sampel LIS & Heartbeat Status Bridge
-- Laboratorium Medis Utama
-- ============================================================================
-- Tabel ini memungkinkan seluruh perangkat (Laptop, PC Dokter, PC Lab)
-- mengakses riwayat sampel alat medis dari database Supabase, serta
-- mendeteksi status koneksi bridge LIS dari perangkat manapun.
-- ============================================================================

-- 1. Tabel Riwayat Sampel LIS
CREATE TABLE IF NOT EXISTS public.lis_riwayat_sampel (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sample_id       text NOT NULL,
    alat            text NOT NULL DEFAULT 'MINDRAY_BS240',
    nama_pasien     text,
    no_rm           text,
    waktu_terima    timestamptz DEFAULT now(),
    status_mapping  text DEFAULT 'BELUM',
    raw_data        text,
    hasil_json      jsonb DEFAULT '[]'::jsonb,
    is_deleted      boolean DEFAULT false,
    created_at      timestamptz DEFAULT now()
);

-- Indeks untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_lis_riwayat_sample_id ON public.lis_riwayat_sampel (sample_id);
CREATE INDEX IF NOT EXISTS idx_lis_riwayat_waktu ON public.lis_riwayat_sampel (waktu_terima DESC);
CREATE INDEX IF NOT EXISTS idx_lis_riwayat_deleted ON public.lis_riwayat_sampel (is_deleted) WHERE is_deleted = false;

-- Komentar tabel
COMMENT ON TABLE public.lis_riwayat_sampel IS 'Riwayat sampel yang diterima LIS Bridge dari alat medis (Mindray, Sysmex, Wondfo)';

-- 2. Tabel Heartbeat Status Bridge
CREATE TABLE IF NOT EXISTS public.lis_status_bridge (
    id              text DEFAULT 'BRIDGE_PC_LAB' PRIMARY KEY,
    status          text DEFAULT 'ONLINE',
    ip_pc_lab       text DEFAULT '192.168.8.124',
    port_mindray    int DEFAULT 7118,
    port_sysmex     int DEFAULT 8005,
    port_wondfo     int DEFAULT 8001,
    port_api        int DEFAULT 7119,
    listener_json   jsonb DEFAULT '{}'::jsonb,
    total_buffer    int DEFAULT 0,
    last_heartbeat  timestamptz DEFAULT now(),
    created_at      timestamptz DEFAULT now()
);

COMMENT ON TABLE public.lis_status_bridge IS 'Heartbeat status LIS Bridge PC Lab, diperbarui setiap 15 detik oleh bridge_alat.py';

-- Seed baris awal heartbeat (upsert safe)
INSERT INTO public.lis_status_bridge (id, status, ip_pc_lab)
VALUES ('BRIDGE_PC_LAB', 'OFFLINE', '192.168.8.124')
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policy (opsional, bisa disesuaikan)
ALTER TABLE public.lis_riwayat_sampel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lis_status_bridge ENABLE ROW LEVEL SECURITY;

-- Izinkan akses penuh dari anon (bridge menggunakan anon key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lis_riwayat_sampel' AND policyname = 'lis_riwayat_anon_all'
  ) THEN
    CREATE POLICY lis_riwayat_anon_all ON public.lis_riwayat_sampel FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lis_status_bridge' AND policyname = 'lis_bridge_anon_all'
  ) THEN
    CREATE POLICY lis_bridge_anon_all ON public.lis_status_bridge FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
