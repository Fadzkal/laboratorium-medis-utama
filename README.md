# Sistem Informasi RME & LIS Terpadu — Laboratorium Medis Utama

Sistem Rekam Medis Elektronik (RME) dan Laboratory Information System (LIS) terpadu berbasis web modern, cepat, dan handal untuk operasional klinik dan laboratorium medis. Dilengkapi integrasi alat medis otomatis (*Sysmex XP-100* & *Mindray BS-240*), sistem antrean audio visual, serta manajemen rekam medis lengkap.

---

## Ringkasan Fitur Utama

- **Pemeriksaan Laboratorium (Skylab Interface)**:
  - Layout dua panel khas laboratorium (filter & antrean di sisi kiri, lembar kerja & verifikasi di sisi kanan).
  - Integrasi otomatis LIS Bridge untuk pembacaan hasil langsung dari mesin lab.
  - Verifikasi bertingkat (*Verify & Lock* dan *Buka Kunci dengan Audit Trail*).
  - Proteksi hapus 2 langkah (*Double-Confirmation Modal*) untuk mencegah kehilangan rekam medis legal.
  - 9 format cetak resmi standar laboratorium.
- **Pemeriksaan Fisik & Anamnesa**: Terstruktur sesuai standar klinis dan siap sinkronisasi PCare / SatuSehat.
- **Kasir & Billing**: Otomatisasi perhitungan tagihan dari tindakan, obat, dan laboratorium, serta cetak struk thermal/invoice.
- **Farmasi & Apotek**: Manajemen stok FEFO (*First Expired, First Out*), kartu stok, dan antrean resep dokter.
- **Display Antrean Layar TV (`display.html`)**: Layar panggilan mandiri dengan suara berbahasa Indonesia untuk loket dan poli.
- **LIS Bridge Server (`bridge/`)**:
  - *Sysmex XP-100*: Listener ASTM E1381/E1394 (Port 8000).
  - *Mindray BS-240*: Listener HL7 MLLP (Port 7118).
  - *Local Bridge API*: Sinkronisasi status realtime ke browser web (Port 7119).

---

## Arsitektur & Teknologi

| Lapisan | Teknologi | Deskripsi |
|---|---|---|
| **Antarmuka (Frontend)** | HTML5, Vanilla CSS3, Modern ES6 | Sangat ringan, cepat, tanpa overhead build-step npm |
| **Database & API** | PostgreSQL, PostgREST / Kong, Self-Hosted Supabase Docker | Skema terstandarisasi, RLS (Row Level Security), performa tinggi |
| **LIS Bridge Server** | Python 3 (Multi-threaded Sockets) | Koneksi TCP/IP & Serial ASTM / HL7 ke instrumen lab |
| **Web Server App** | Python Threading HTTPServer | Port 5100 dengan optimasi CORS & caching |

---

## Struktur Direktori Proyek

```text
├── bridge/                     # Modul LIS Bridge Alat Medis (Sysmex ASTM & Mindray HL7)
│   ├── bridge_alat.py          # Server multi-thread TCP socket listener
│   ├── config.py               # Konfigurasi port, host, dan koneksi database
│   ├── db_adapter.py           # Adaptor sinkronisasi data ke Supabase / PostgreSQL
│   ├── dictionary.py           # Kamus pemetaan parameter uji alat ke sistem RME
│   └── tes_simulasi.py         # Skrip uji kirim data alat virtual
├── css/                        # Berkas gaya CSS desain sistem
│   └── style.css               # Gaya antarmuka utama, tema warna, dan utilitas
├── data/                       # Berkas master data referensi (CSV & JSON)
├── deploy/                     # Skrip & konfigurasi deployment server Linux (VPS)
│   ├── rme-web.service         # Systemd service unit untuk Linux
│   ├── nginx.conf.example      # Contoh konfigurasi reverse proxy Nginx
│   └── setup_server.sh         # Skrip otomasi instalasi & aktivasi di server VPS
├── docs/                       # Dokumentasi tambahan dan aset mockup
├── js/                         # Modul logika JavaScript (ES6)
│   ├── app.js                  # Router navigasi, inisialisasi sesi, dan layout
│   ├── config.js               # Pengaturan endpoint API Supabase & identitas klinik
│   ├── db.js                   # Lapisan data interaksi database PostgreSQL/Supabase
│   ├── ui.js                   # Komponen modal, ikon SVG resmi, toast, dan dialog
│   └── pages/                  # Halaman aplikasi (lab, kasir, apotek, dokter, dll.)
├── migrasi/                    # Skrip SQL & berkas bantu migrasi data
├── scripts/                    # Skrip utilitas impor data, seeder, dan ekspor
├── sql/                        # Berkas skema tabel, fungsi RPC, dan migrasi SQL (01-81)
├── app.html                    # Halaman utama aplikasi RME (Portal Pengguna)
├── display.html                # Layar TV antrean publik mandiri
├── index.html                  # Halaman masuk (Login)
├── jalankan.bat                # Peluncur 1-klik untuk lingkungan Windows
├── pasang_otomatis_startup.bat # Registrasi auto-start Windows & protokol lmu-bridge://
├── requirements.txt            # Daftar pustaka dependensi Python
└── run.py                      # Peluncur terpadu Web Server RME & LIS Bridge
```

---

## Panduan Menjalankan

### 1. Di Komputer Laboratorium / Lokal (Windows)

1. Pastikan Python 3 sudah terpasang.
2. Pasang pustaka pendukung:
   ```cmd
   pip install -r requirements.txt
   ```
3. Cukup klik ganda **`jalankan.bat`** atau jalankan via terminal:
   ```cmd
   python run.py
   ```
4. Web otomatis terbuka di `http://localhost:5100/app.html`.
5. *(Opsional)* Untuk otomatisasi komputer lab, jalankan **`pasang_otomatis_startup.bat`** (otomatis jalan saat Windows menyala dan mendaftarkan protokol web `lmu-bridge://`).

---

### 2. Di Server VPS (Linux Ubuntu / Debian)

1. Masuk ke direktori proyek di server:
   ```bash
   cd /var/www/rme-lab-utama
   ```
2. Jalankan skrip setup otomatis:
   ```bash
   chmod +x deploy/setup_server.sh
   sudo bash deploy/setup_server.sh
   ```
3. Periksa status layanan:
   ```bash
   systemctl status rme-web
   ```
4. Pantau log secara realtime:
   ```bash
   journalctl -u rme-web -f
   ```

---

## Daftar Port Layanan

| Port | Layanan | Keterangan |
|---|---|---|
| **5100** | Web Server RME | Akses aplikasi web browser & display TV antrean |
| **8000** | Sysmex XP-100 Listener | Koneksi data hematologi ASTM E1381/E1394 |
| **7118** | Mindray BS-240 Listener | Koneksi data kimia darah HL7 MLLP |
| **7119** | LIS Bridge REST API | Status komunikasi alat lokal ke browser |
| **8001** | Supabase Kong API | Gerbang API REST / Realtime Database PostgreSQL |
| **8081** | Supabase Studio | Portal administrasi database (khusus tim IT) |
| **5432** | PostgreSQL Server | Database internal Supabase |

---

## Lisensi & Hak Cipta
Hak Cipta © 2026 Laboratorium Medis Utama. Seluruh hak dilindungi undang-undang.
