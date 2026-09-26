# SPESIFIKASI BAKU CETAK STIKER BARCODE SPESIMEN (GOLDEN CONFIGURATION)

Dokumen ini merupakan referensi resmi dan standar baku tata letak cetak stiker barcode tabung spesimen laboratorium pada sistem RME & LIS Laboratorium Medis Utama.

**STATUS: GOLDEN CONFIGURATION (PERMANENTLY LOCKED)**

---

## 1. TARGET PERANGKAT KERAS (HARDWARE TARGET)
- **Model Printer:** Blueprint ECO 80B / 80Label Printer (Thermal Transfer / Direct Thermal).
- **Jenis Kertas:** Continuous thermal label roll stiker tabung spesimen.
- **Ukuran Fisik Label:** 50 mm x 30 mm (gap 2 mm).
- **Resolusi Cetak:** 203 DPI (8 dots/mm).
- **Dimensi Kanvas Cetak:** 384 x 224 piksel.

---

## 2. PARAMETER CSS CETAK PERAMBAN (BROWSER PRINT)
Implementasi aktif terdapat pada:
- `js/barcode_printer.js` (Modal cetak barcode lab)
- `js/pages/display_harian.js` (Cetak batch spesimen display harian)

### A. Pengaturan Halaman (@page)
```css
@page {
  size: auto;
  margin: 0mm !important;
}
html, body {
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

### B. Kontainer Utama (.label-tube)
- **Dimensi Lebar:** `width: 48mm !important; max-width: 48mm !important;`
- **Dimensi Tinggi:** `height: 28mm !important; max-height: 28mm !important;`
- **Margin:** `margin: 0 !important; margin-left: 0 !important;`
- **Padding:** `padding: 1mm 1.5mm 1mm 2.5mm !important;`
- **Transform Offset:** `transform: translateX(-2mm) !important;`
- **Tata Letak:** `display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important;`
- **Box Sizing:** `box-sizing: border-box !important;`
- **Page Break:** `page-break-inside: avoid !important; break-inside: avoid !important;`

### C. Kolom Kiri (.col-id / Nomor Laboratorium Vertikal)
- **Lebar Kolom:** `width: 4.5mm; min-width: 4.5mm; flex-shrink: 0;`
- **Tinggi Kolom:** `height: 26mm;`
- **Orientasi Teks:** `writing-mode: vertical-rl; transform: rotate(180deg);`
- **Tipografi:** `font-size: 7pt; font-weight: 700; line-height: 1; letter-spacing: 0.2px;`
- **Perataan:** `text-align: center; white-space: nowrap; color: #000; margin: 0;`

### D. Kolom Tengah (.col-center / Barcode & Data Pasien)
- **Fleksibilitas Kolom:** `flex: 1; min-width: 0; max-width: 34mm; height: 100%;`
- **Padding:** `padding: 0 1mm; box-sizing: border-box; overflow: visible;`
- **Tata Letak:** `display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;`
- **Barcode SVG (Code 128):**
  * `modulWidth: 1.25`
  * `tinggi: 32px`
  * `max-width: 34mm`
- **Nama Pasien (.nama-px):**
  * `font-size: 8pt; font-weight: 700; max-width: 34mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
- **Informasi Sub (.info-sub: Gender / Umur):**
  * `font-size: 6.5pt; font-weight: 700; max-width: 34mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`

### E. Kolom Kanan (.col-dept / Departemen Spesimen Vertikal)
- **Lebar Kolom:** `width: 4.5mm; min-width: 4.5mm; flex-shrink: 0;`
- **Tinggi Kolom:** `height: 26mm;`
- **Orientasi Teks:** `writing-mode: vertical-rl; transform: rotate(180deg);`
- **Tipografi:** `font-size: 7pt; font-weight: 700; line-height: 1; letter-spacing: 0.2px;`
- **Perataan:** `text-align: center; white-space: nowrap; color: #000; margin: 0;`
- **Isi Teks:** Jenis spesimen medis (contoh: HEMATOLOGI, KIMIA, SEROLOGI, URIN).

---

## 3. PARAMETER ENJIN DIRECT PRINT PYTHON (LIS BRIDGE)
Implementasi aktif terdapat pada fungsi `buat_image_label_barcode()` di `bridge/bridge_alat.py`:
- **Dimensi Bitmap:** `w_canvas = 384`, `h_canvas = 224` (mode RGB rendered crisp monochrome).
- **Titik Koordinat Kolom ID Kiri (rot_id):** `x_id = 16`, `y_id = (h_canvas - rot_id.height) // 2`.
- **Titik Koordinat Kolom Kanan (rot_sp):** `x_sp = max(0, w_canvas - rot_sp.width - 4)`.
- **Batas Horizontal Area Tengah:** `cx_min = 48`, `cx_max = x_sp`.
- **Titik Awal Barcode 1D Code 128:**
  * `bc_x = 48 + max(0, (w_canvas - 48 - (w_canvas - x_sp) - bc_w) // 2)`
  * `bc_y = 8`
  * `bc_h = 88` (atau `75` jika terdapat baris sub_info spesifik).
  * `mod_w = 2` (atau `3` jika total modul pendek).
- **Ukuran Font Standard (PIL ImageFont):**
  * `font_id`: 18 pt bold.
  * `font_sp`: 18 pt bold.
  * `font_nama`: 20 pt bold (auto-truncate fallback ke 17 pt bold jika melebihi `avail_w`).
  * `font_sub`: 17 pt bold.
  * `font_test`: 15 pt bold.

---

## 4. LARANGAN MODIFIKASI
Dilarang keras mengubah nilai dimensi, margin, padding, offset transform, dan koordinat kanvas di atas karena telah melalui kalibrasi fisik pada stiker roll 50mm x 30mm di printer Blueprint ECO 80B laboratorium. Segala penyesuaian wajib merujuk pada klausul "IMMUTABLE RULE - BARCODE LAYOUT" di berkas `AGENTS.md`.
