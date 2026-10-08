# DOKUMENTASI LENGKAP INTEGRASI SATUSEHAT & PANDUAN MIGRASI RME MANDIRI
**Laboratorium Medis Utama (Purbalingga)**  
*Terakhir Diperbarui: 7 Oktober 2026*

---

## 1. Status & Bukti Otentik Kelulusan Uji Coba Sandbox (FHIR R4)

Sistem LIS internal Laboratorium Medis Utama telah **berhasil 100%** terhubung dan mengirim data hasil pemeriksaan laboratorium lengkap ke server **Kementerian Kesehatan RI (SATUSEHAT Sandbox API)** dengan status **`201 Created` (Sukses Penuh Tanpa Pelanggaran Validasi)**.

### Ringkasan Transaksi yang Berhasil Terverifikasi di Server Kemenkes:
- **Organization ID Fasyankes:** `6a80f69d-2493-422a-b0ac-ca2b5bea38dd`
- **Kode Fasyankes:** `33030700001` (Laboratorium UTAMA)
- **Patient IHS Teruji:** `P20396305854`
- **Encounter ID Kunjungan Lab:** `e5fc3fc3-4379-420e-92b0-698bb90a475a`
- **ServiceRequest ID:** `1dfa307d-1c49-49b8-a5a9-92047ffc5c90`
- **Specimen ID:** `1f019c1f-71a1-497f-931e-a402ab70a73f`
- **DiagnosticReport ID (Laporan Akhir):** `3538732e-6838-4af1-bb18-df3ca8c47c11`

### 16 Parameter Pengujian Rutin Terverifikasi (HTTP 201 Created):
1. **Hemoglobin** (LOINC: `718-7`) $\rightarrow$ FHIR ID: `bac605ff-47e1-4c89-a605-64ee176a624b`
2. **Leukosit** (LOINC: `6690-2`) $\rightarrow$ FHIR ID: `e26f39e1-e7ed-425e-be51-f7d809708164`
3. **Trombosit** (LOINC: `777-3`) $\rightarrow$ FHIR ID: `69e02763-067b-4d29-bffd-dd277437f134`
4. **Hematokrit** (LOINC: `4544-3`) $\rightarrow$ FHIR ID: `8e09d7b9-df41-4efd-9f92-350a6cab6d73`
5. **Eritrosit** (LOINC: `789-8`) $\rightarrow$ FHIR ID: `479bee31-0b87-4c19-ae50-068ec942d49b`
6. **LED 1 Jam** (LOINC: `30341-2`) $\rightarrow$ FHIR ID: `968f8561-2632-4d20-95fd-e835ee0095c6`
7. **Limfosit** (LOINC: `736-9`) $\rightarrow$ FHIR ID: `d1150e18-0bd4-42ae-b45b-8b7b277e53d4`
8. **Cholesterol Total** (LOINC: `2093-3`) $\rightarrow$ FHIR ID: `ba5af011-493d-4494-8700-e0d4c4b98636`
9. **Trigliserida** (LOINC: `2571-8`) $\rightarrow$ FHIR ID: `963e9411-30e0-4220-a2fc-7d2f29d3a52c`
10. **Asam Urat** (LOINC: `3084-1`) $\rightarrow$ FHIR ID: `214db347-4c05-4647-8de2-415ca5629775`
11. **Creatinin** (LOINC: `2160-0`) $\rightarrow$ FHIR ID: `860adc15-ce50-4cb3-9ad2-aa9f669b8bd6`
12. **Ureum** (LOINC: `3091-6`) $\rightarrow$ FHIR ID: `954b0fa8-2ec5-4480-b7e6-4e68f6347985`
13. **Glukosa Darah Puasa** (LOINC: `1558-6`) $\rightarrow$ FHIR ID: `f3149b6a-da48-4f46-b422-bc9b564f884d`
14. **Protein Urin** (LOINC: `20454-5`) $\rightarrow$ FHIR ID: `5fd28650-59aa-47a2-8227-0aaf55fbf6ed`
15. **Glukosa Urin** (LOINC: `25428-4`) $\rightarrow$ FHIR ID: `678b1455-016c-4aa1-adee-bb2e7c8bb5e5`
16. **pH Urin** (LOINC: `5803-2`) $\rightarrow$ FHIR ID: `24557dd7-4aba-46fd-8032-6feda77a5a2b`

---

## 2. Standardisasi Kode Medis Internasional (Database Supabase)

Tabel master `ref_lab` di database Supabase telah diperbarui dengan:
- **244 Parameter Terpetakan:** Mencakup seluruh parameter Hematologi Lengkap, Kimia Darah, Profil Lipid, Fungsi Ginjal, Fungsi Hati, Urinalisis Rutin & Sedimen, Widal, Hepatitis, HIV, Sifilis, Dengue, Narkoba, hingga Swab Antigen.
- **Standar Kode:** LOINC & SNOMED CT Spesimen (*Whole Blood*, *Serum*, *Urine*, *Swab*, dll).
- **File Migrasi Database:** `sql/91_standarisasi_loinc_snomed_satusehat.sql`.

---

## 3. Alur Sinkronisasi Aplikasi & Layar Harian

- **Tombol Verifikasi di SkyLab (`js/pages/lab.js`):** Saat analis/dokter mengeklik tombol Verifikasi atau Selesaikan Kunjungan, sistem secara otomatis mengeksekusi pengiriman SATUSEHAT di latar belakang melalui LIS Bridge (Port 7119).
- **Layar Display Harian (`js/pages/display_harian.js`):** Baris pasien yang terverifikasi seketika berubah warna menjadi **Biru Google (`#1a73e8`)** secara realtime tanpa perlu reload manual halaman.
- **Manajemen Pendaftaran Kunjungan:** Dilengkapi tombol **Hapus Pendaftaran Hari Ini** di halaman Laporan Registrasi Lab, SkyLab, dan Antrean. Fitur ini menghapus antrean & transaksi kunjungan hari bersangkutan tanpa menghapus master data pasien.

---

## 4. Panduan Regulasi Resmi Kemenkes: Pendaftaran Sistem RME Mandiri

Berdasarkan dokumentasi resmi Kementerian Kesehatan RI pada laman:  
👉 **[Sistem RME Mandiri | SATUSEHAT Platform](https://satusehat.kemkes.go.id/platform/docs/id/registration-guide/regis-institution/regis-system-rme-mandiri/)**

### Prinsip Pokok Regulasi:
1. Fasyankes dengan sistem RME mandiri buatan sendiri **WAJIB mendaftarkan sistem RME-nya** ke SATUSEHAT Platform (SSP) sebagai **"Penyedia Sistem RME (Mandiri)"**.
2. Hal ini bertujuan agar nama sistem mandiri tersebut terdaftar resmi di database Kemenkes dan dapat dipilih pada saat **Pemutakhiran Data Sistem RME di DFO (Data Fasilitas Pelayanan Kesehatan)**.
3. Setelah sistem mandiri terverifikasi di SSP (maksimal 3 hari kerja) dan dipilih di DFO, hubungan dengan vendor lama (Skylab) **resmi berakhir secara sah dan legal**.

---

### Aturan Akun Login (Wajib Diperhatikan):
- **JANGAN** menggunakan akun email fasyankes lama yang saat ini digunakan untuk login di SATUSEHAT Platform sebagai fasyankes.
- **WAJIB menggunakan EMAIL BARU** (khusus peran pengembang/IT penyedia sistem RME).
- **Contoh format email:**  
  * `it.labmedisutama@gmail.com` atau  
  * `sistem.rme.labutama@gmail.com`

---

### Berkas & Syarat Administrasi yang Diperlukan:

| No | Persyaratan Dokumen | Deskripsi & Tindakan |
|---|---|---|
| **1** | **Nomor PSE Kominfo** | Didaftarkan melalui portal **OSS** ([oss.go.id](https://oss.go.id)) menggunakan NIB Lab Utama yang sudah aktif: `2706220025565` (*LABORATORIUM UTAMA MANDIRI*). Format nomor PSE: `xxxxxx.xx/DJAI.PSE/MM/YYYY`. |
| **2** | **Nomor Afiliasi SNOMED CT** | Mendaftar di portal *SNOMED International MLDS*. Lisensi ini **gratis** bagi fasyankes/institusi di Indonesia karena telah dibiayai oleh Kementerian Kesehatan RI. |
| **3** | **Surat Kuasa / Surat Tugas IT** | Surat penunjukan dari pimpinan lab kepada pihak yang ditugaskan sebagai PIC pengembang/pengelola sistem IT (mencantumkan Nama, NIK, Jabatan, HP, Email). |
| **4** | **Surat Pernyataan Variabel & Meta Data** | Format surat resmi Kemenkes yang menyatakan sistem memuat variabel RME standar, ditandatangani oleh Pimpinan Fasyankes di atas **Meterai Rp10.000**. |
| **5** | **Dokumentasi Sistem RME (PDF max 10MB)** | Berisi tangkapan layar fitur sistem web (Pendaftaran, Lab, Kasir, Rekam Medis) + **Bukti uji coba Sandbox (Encounter & DiagnosticReport respon 201 Created)** + Bukti tangkapan layar monitoring pengiriman. |
| **6** | **Daftar Faskes Pengguna** | Template Excel resmi Kemenkes yang mencantumkan nama Laboratorium Medis Utama dan Kode Fasyankes (`33030700001`). |
| **7** | **Survei Keamanan Sistem** | Mengisi kuesioner checklist keamanan pada portal SATUSEHAT Platform (mencakup enkripsi SSL/HTTPS, backup data, dan manajemen hak akses pengguna). |

---

### Alur Langkah-Langkah Pendaftaran:

1. **Langkah 1 (Registrasi Akun Penyedia):**  
   Buka portal [https://satusehat.kemkes.go.id/platform](https://satusehat.kemkes.go.id/platform), klik *Daftar Sekarang* menggunakan email IT baru.
2. **Langkah 2 (Pilih Kategori Institusi):**  
   Pada menu *Registrasi Institusi*, pilih opsi **Penyedia sistem RME** → **Sistem RME Mandiri**.
3. **Langkah 3 (Pengisian Data & Unggah Berkas):**  
   Isi data profil sistem (misal: *RME Laboratorium Medis Utama*), masukkan nomor PSE, nomor afiliasi SNOMED CT, dan unggah dokumen PDF persyaratan di atas.
4. **Langkah 4 (Survei Keamanan):**  
   Lengkapi kuesioner survei keamanan sistem RME.
5. **Langkah 5 (Verifikasi Kemenkes):**  
   Kemenkes melakukan verifikasi data (estimasi 1–3 hari kerja). Jika perlu percepatan, dapat menghubungi `helpdesk@kemkes.go.id`.
6. **Langkah 6 (Pemutakhiran di DFO):**  
   Setelah sistem terverifikasi di SSP, login ke portal **DFO** ([dfo.kemkes.go.id](https://dfo.kemkes.go.id/login)) menggunakan akun fasyankes lama, lalu di menu **Pemutakhiran Data Sistem RME**, pilih nama sistem mandiri baru.
7. **Langkah 7 (Selesai):**  
   Sistem mandiri telah resmi terdata oleh Kemenkes RI, dan nama vendor Skylab otomatis tidak lagi terikat dengan fasyankes.

---

## 5. Ringkasan Legalitas & Data Institusi

- **Nama Fasyankes:** Laboratorium UTAMA (Laboratorium Medis Utama)
- **Kode Fasyankes Kemenkes:** `33030700001`
- **Organization ID Kemenkes:** `6a80f69d-2493-422a-b0ac-ca2b5bea38dd`
- **Nama Pelaku Usaha (NIB OSS):** LABORATORIUM UTAMA MANDIRI
- **Nomor Induk Berusaha (NIB):** `2706220025565`
- **Email Bantuan Kemenkes:** `helpdesk@kemkes.go.id`
- **Portal SATUSEHAT Platform:** [satusehat.kemkes.go.id/platform](https://satusehat.kemkes.go.id/platform)
