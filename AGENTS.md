# PANDUAN KERJA & ATURAN BAKU AI AGENT (MANDATORI)

Dokumen ini berisi prinsip arsitektur dan batasan operasional yang **WAJIB dipatuhi tanpa pengecualian** oleh AI Agent saat bekerja pada repositori RME & SIM Laboratorium Medis Utama:

---

## 1. EFISIENSI TOKEN & LARANGAN BROWSER OTOMATIS
- **Dilarang keras menggunakan browser subagent (Playwright/Puppeteer/Chrome DevTools)** untuk inspeksi UI, screenshot, maupun simulasi klik otomatis. Seluruh proses ini sangat boros token dan memicu timeout.
- Pengujian visual dan fungsionalitas UI dilakukan secara manual oleh pengguna langsung di browser.
- **Dilarang menjalankan loop testing/polling latar belakang** yang memanggil API atau database berulang kali tanpa instruksi eksplisit.

---

## 2. RUANG LINGKUP TUGAS: HANYA EDIT FILE LOKAL
- **Fokus pekerjaan AI Agent HANYA memodifikasi kode pada berkas lokal** yang relevan di workspace proyek.
- **Dilarang menjalankan perintah deployment otomatis**, seperti:
  - `git commit` / `git push`
  - Koneksi SSH / Plink ke server VPS produksi (`187.53.142.245`)
  - Eksekusi skrip Python / Bash runner deployment
- Semua urusan commit, push GitHub, dan deployment ke VPS menjadi wewenang pengguna secara manual. AI Agent cukup melaporkan berkas yang diubah beserta ringkasan kodenya.

---

## 3. INTEGRITAS SISTEM: ZERO BREAKING CHANGES & SIFAT ADITIF
- **Dilarang keras merombak, menghapus, atau me-refactor fungsi yang sudah berjalan** kecuali diminta secara tertulis dan spesifik oleh pengguna.
- **Jangan pernah menyentuh atau merusak integrasi alat medis analyzer fisik** (Mindray BS-240, Sysmex XP-100, Arkray Adams HA-8380V, dsb.) serta alur LIS yang sudah terhubung.
- Setiap perubahan atau penambahan fitur baru **wajib bersifat aditif (menambah tanpa merusak)**:
  - Alur registrasi pasien & nomor rekam medis
  - Alur input, validasi, dan verifikasi hasil lab
  - Alur kasir, billing, dan farmasi/apotek
  - Struktur tabel, fungsi RPC, dan trigger database Supabase yang sedang aktif

---

## 4. DESAIN UI / UX: BEBAS EMOJI & EMOTE (ZERO-EMOJI POLICY)
- **Dilarang keras menggunakan karakter emoji / emote apapun** (misal: 📊, 📥, 📄, 🖨️, 🩺, 🧪, 💉, 💡, dsb.) pada teks antarmuka: tombol, judul modul, nama tab, badge, header tabel, pesan toast/alert, maupun label dokumen.
- Gunakan teks profesional dan bersih (contoh: `'Print Barcode'`, `'Simpan Data'`, `'Verify'`, `'Unduh Excel'`).
- Jika memerlukan ikon visual penanda, **hanya gunakan sistem SVG bawaan sistem** melalui fungsi:
  ```javascript
  UI.ikon('nama_ikon', ukuran) // Contoh: UI.ikon('cetak', 16)