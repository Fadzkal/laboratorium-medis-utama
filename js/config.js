/* =====================================================================
   KONFIGURASI — SATU-SATUNYA FILE YANG PERLU ANDA SUNTING
   ---------------------------------------------------------------------
   Ambil dua nilai di bawah dari dasbor Supabase Anda:
     Project Settings  →  Data API  →  Project URL
     Project Settings  →  API Keys  →  anon / public key
   Kunci `anon` memang aman ditaruh di sini: seluruh pembatasan akses
   dijalankan oleh Row Level Security di database, bukan oleh browser.
   ===================================================================== */

const CONFIG = {
  SUPABASE_URL: 'http://187.53.142.245:8001',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',

  // Identitas yang tampil di aplikasi (bisa juga diambil dari tabel `faskes`)
  NAMA_KLINIK: 'Laboratorium Medis Utama',
  SINGKATAN: 'LMU',

  // Nyalakan setelah kredensial bridging tersedia dan Edge Function terpasang
  BRIDGING: {
    PCARE_AKTIF: false,
    SATUSEHAT_AKTIF: false
  },

  // Ambang tanda vital untuk menandai nilai tidak normal (dewasa)
  AMBANG_VITAL: {
    sistolik: { min: 90, max: 139 },
    diastolik: { min: 60, max: 89 },
    nadi: { min: 60, max: 100 },
    nafas: { min: 12, max: 20 },
    suhu: { min: 36.0, max: 37.5 },
    spo2: { min: 95, max: 100 }
  }
};
