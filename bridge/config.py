"""
=============================================================================
KONFIGURASI LIS BRIDGE ALAT MEDIS - LABORATORIUM MEDIS UTAMA
=============================================================================
File ini mengatur koneksi ke alat laboratorium medis dan database.
Mendukung mode database SUPABASE (aktif sekarang) dan MYSQL (Cloud VPS).
=============================================================================
"""

import os

# ---------------------------------------------------------------------------
# 1. MODE DATABASE ("SUPABASE" atau "MYSQL")
# ---------------------------------------------------------------------------
# Saat nanti memindahkan database ke Cloud VPS MySQL, cukup ubah DB_MODE ke "MYSQL"
DB_MODE = "SUPABASE"

# ---------------------------------------------------------------------------
# 2. KONFIGURASI SUPABASE (Aktif Sekarang)
# ---------------------------------------------------------------------------
SUPABASE_URL = "https://gicekgdzymdbtlxwqmvd.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpY2VrZ2R6eW1kYnRseHdxbXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NDc0NjIsImV4cCI6MjEwNTAyMzQ2Mn0."
    "3yKSwH5G-VTQCg36eujWaH2GV_aRwVjaM8JAt6ocGms"
)
# Kunci service_role (opsional, jika ingin bypass RLS langsung dari backend bridge)
SUPABASE_SERVICE_KEY = ""

# ---------------------------------------------------------------------------
# 3. KONFIGURASI MYSQL (Siap Dipakai Saat Migrasi ke Cloud VPS)
# ---------------------------------------------------------------------------
MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASSWORD = ""
MYSQL_DATABASE = "laboratorium"

# ---------------------------------------------------------------------------
# 4. PORT KONEKSI ALAT MEDIS (TCP SOCKET)
# ---------------------------------------------------------------------------
# Port untuk mendengarkan Mindray BS-240 (Protokol HL7 MLLP)
HOST_MINDRAY = "0.0.0.0"
PORT_MINDRAY = 7118

# Port untuk mendengarkan Sysmex XP-100 (Protokol ASTM E1381/E1394)
HOST_SYSMEX = "0.0.0.0"
PORT_SYSMEX = 8000

# ---------------------------------------------------------------------------
# 5. LOCAL REST API (Untuk Sinkronisasi Langsung ke Browser)
# ---------------------------------------------------------------------------
# Port server HTTP lokal bridge yang dipanggil tombol "Tarik Hasil Alat" di web
HOST_LOCAL_API = "127.0.0.1"
PORT_LOCAL_API = 7119

# ---------------------------------------------------------------------------
# 6. PENYIMPANAN LOG & CADANGAN LOKAL (OFFLINE RESILIENCE)
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")
CSV_LOG_FILE = os.path.join(LOG_DIR, "hasil_alat_log.csv")
JSON_BUFFER_FILE = os.path.join(LOG_DIR, "buffer_terakhir.json")
