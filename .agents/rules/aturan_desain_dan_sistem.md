# ATURAN BAKU PENGEMBANGAN SISTEM (MANDATORI)

Dokumen ini berisi prinsip dan aturan baku yang **WAJIB dipatuhi** oleh AI Agent dalam setiap percakapan dan modifikasi sistem di proyek RME Laboratorium Medis Utama:

---

## 1. DESAIN UI / UX: TANPA PENGGUNAAN EMOTE / EMOJI
- **Dilarang keras** menggunakan icon emoji/emote apapun (seperti 📊, 📥, 📄, 🖨️, 🩺, 🧪, 💉, dsb.) pada teks tombol, judul halaman, nama tab, badge, header tabel, maupun elemen antarmuka aplikasi lainnya.
- Gunakan teks bersih profesional (contoh: 'Unduh Excel', 'Cetak', 'Prolanis', 'Simpan', 'Verify').
- Jika membutuhkan visual penanda, **hanya gunakan icon SVG resmi bawaan sistem** melalui UI.ikon('nama_ikon', ukuran) (contoh: UI.ikon('unduh', 15)).

---

## 2. INTEGRITAS SISTEM: JANGAN MENGGANTI ATAU MENGHILANGKAN FITUR YANG ADA
- **Jangan pernah mengganti, menghapus, atau merombak fitur yang sudah ada** tanpa instruksi eksplisit dari pengguna.
- Setiap penambahan fitur baru harus bersifat aditif, rapi, dan terintegrasi tanpa merusak:
  - Alur registrasi pasien
  - Alur input & verifikasi laboratorium / fisik / anamnesa
  - Integrasi kasir dan tagihan
  - Format cetak dokumen resmi
  - Skema database dan fungsi yang sedang berjalan

---

## 3. PENGUJIAN BROWSER CUKUP UNTUK MELIHAT DESAIN UI/UX
- Pengecekan melalui subagent browser **cukup untuk melihat dan memverifikasi tampilan desain UI/UX** (inspeksi visual dan tangkapan layar/screenshot).
- Tidak perlu melakukan simulasi klik/input form yang panjang, berulang-ulang, atau kompleks yang rawan timeout/pembatalan jika tidak diminta secara spesifik oleh pengguna.

---

## 4. KONSISTENSI FORMAT DAN TAMPILAN
- Desain antarmuka modul laboratorium harus konsisten mengikuti layout Skylab (panel kiri filter oranye + daftar antrean hijau, panel kanan info pasien biru + tabel data).
- Format cetak dokumen harus seragam dan presisi mengikuti 9 format standar resmi laboratorium.
