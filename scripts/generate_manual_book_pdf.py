"""
=============================================================================
GENERATOR BUKU PANDUAN (MANUAL BOOK) & DOKUMENTASI SISTEM RESMI
LABORATORIUM MEDIS UTAMA - INTEGRASI SATUSEHAT KEMENKES RI
=============================================================================
Menghasilkan dokumen PDF berstandar publikasi profesional yang menggabungkan:
1. Dokumentasi seluruh fitur sistem (Manual Book)
2. Bukti uji coba SATUSEHAT Sandbox (Encounter, Diagnosis Condition, DiagnosticReport)
3. Halaman bukti pengiriman email ke onboarding.satusehat@dto.kemkes.go.id
=============================================================================
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOT_DIR = os.path.join(BASE_DIR, "docs", "assets", "screenshots")
POSTMAN_DIR = os.path.join(BASE_DIR, "docs", "assets", "postman")
OUT_PDF = os.path.join(BASE_DIR, "docs", "DOKUMENTASI_SISTEM_DAN_MANUAL_BOOK_UTAMA_LAB.pdf")

# Custom Canvas for Page Numbering and Running Header/Footer
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        # Don't draw headers/footers on cover page (page 1)
        if self._pageNumber == 1:
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header
        self.drawString(2.0 * cm, 28.5 * cm, "Utama Lab System | Dokumentasi Sistem & Manual Book RME")
        self.drawRightString(19.0 * cm, 28.5 * cm, "Laboratorium Medis Utama (Purbalingga)")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.6)
        self.line(2.0 * cm, 28.3 * cm, 19.0 * cm, 28.3 * cm)

        # Footer
        self.line(2.0 * cm, 1.8 * cm, 19.0 * cm, 1.8 * cm)
        self.drawString(2.0 * cm, 1.4 * cm, "Kepatuhan Regulasi Kemenkes SATUSEHAT FHIR R4 & Permenkes No. 24/2022")
        page_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(19.0 * cm, 1.4 * cm, page_text)

        self.restoreState()


def buat_pdf():
    doc = SimpleDocTemplate(
        OUT_PDF,
        pagesize=A4,
        leftMargin=2.0 * cm,
        rightMargin=2.0 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0f3460")
    secondary_color = colors.HexColor("#0284c7")
    dark_text = colors.HexColor("#1e293b")
    muted_text = colors.HexColor("#475569")

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=primary_color,
        alignment=1
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        alignment=1
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=22,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=dark_text,
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    caption_style = ParagraphStyle(
        'Caption_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11,
        textColor=muted_text,
        alignment=1,
        spaceBefore=4,
        spaceAfter=12
    )

    box_note_style = ParagraphStyle(
        'BoxNote',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0369a1")
    )

    story = []

    # =========================================================================
    # 1. COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 1.5 * cm))

    # Logo if exists
    logo_path = os.path.join(BASE_DIR, "logo.png")
    if os.path.exists(logo_path):
        img_logo = RLImage(logo_path, width=2.8 * cm, height=2.8 * cm)
        img_logo.hAlign = 'CENTER'
        story.append(img_logo)
        story.append(Spacer(1, 0.8 * cm))

    story.append(Paragraph("DOKUMENTASI SISTEM & BUKU PANDUAN PENGGUNA", title_style))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("SISTEM REKAM MEDIS ELEKTRONIK (RME) MANDIRI &amp; LABORATORY INFORMATION SYSTEM (LIS) TERINTEGRASI", subtitle_style))
    story.append(Spacer(1, 1.0 * cm))

    story.append(HRFlowable(width="90%", thickness=2, color=secondary_color, spaceBefore=5, spaceAfter=20))

    # Info table in Cover
    cover_data = [
        [Paragraph("<b>Nama Sistem Resmi</b>", body_style), Paragraph(": Utama Lab System", body_style)],
        [Paragraph("<b>Kategori Sistem</b>", body_style), Paragraph(": Sistem RME Mandiri &amp; LIS Fasyankes Internal", body_style)],
        [Paragraph("<b>Nama Fasilitas Layanan</b>", body_style), Paragraph(": <b>Laboratorium Medis Utama</b>", body_style)],
        [Paragraph("<b>Kode Fasyankes Kemenkes</b>", body_style), Paragraph(": <b>33030700001</b>", body_style)],
        [Paragraph("<b>Organization ID SATUSEHAT</b>", body_style), Paragraph(": <code>7aa334f7-7837-4c0a-8a64-9c672e5958f3</code>", body_style)],
        [Paragraph("<b>Nomor Induk Berusaha (NIB)</b>", body_style), Paragraph(": 2706220025565 (LABORATORIUM UTAMA MANDIRI)", body_style)],
        [Paragraph("<b>Kode KBLI Layanan</b>", body_style), Paragraph(": 86993 - Aktivitas Pelayanan Penunjang Kesehatan", body_style)],
        [Paragraph("<b>ID Permohonan PB-UMKU PSE</b>", body_style), Paragraph(": I-202610091349542872272 (pse.komdigi.go.id)", body_style)],
        [Paragraph("<b>Alamat Operasional</b>", body_style), Paragraph(": Jl. D.I. Panjaitan No. 94, Purbalingga Lor, Kab. Purbalingga, Jawa Tengah", body_style)],
        [Paragraph("<b>Versi Dokumen</b>", body_style), Paragraph(": 2.0 (Oktober 2026) - Edisi Onboarding SATUSEHAT", body_style)],
    ]
    t_cover = Table(cover_data, colWidths=[6.0 * cm, 10.5 * cm])
    t_cover.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
    ]))
    story.append(t_cover)

    story.append(Spacer(1, 1.2 * cm))

    # Badge box
    badge_data = [[
        Paragraph(
            "<b>STATUS INTEGRASI: LOLOS UJI COBA 100% SATUSEHAT SANDBOX (FHIR R4)</b><br/>"
            "Mendukung Interoperabilitas Rekam Medis: OAuth2, Patient, Practitioner, Location, Encounter, "
            "Diagnosis Condition (ICD-10), Specimen (SNOMED-CT), Observation (LOINC), dan DiagnosticReport.",
            box_note_style
        )
    ]]
    t_badge = Table(badge_data, colWidths=[16.5 * cm])
    t_badge.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#e0f2fe")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#38bdf8")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_badge)

    story.append(PageBreak())

    # =========================================================================
    # 2. PROFIL SISTEM & DAFTAR ISI
    # =========================================================================
    story.append(Paragraph("RINGKASAN EKSEKUTIF &amp; ARSITEKTUR SISTEM", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "<b>Utama Lab System</b> adalah sistem informasi manajemen Rekam Medis Elektronik (RME) mandiri "
        "yang dikembangkan khusus untuk melayani operasional harian pemeriksaan laboratorium medis di <b>Laboratorium Medis Utama (Purbalingga)</b>. "
        "Sistem dirancang memenuhi amanat <b>Peraturan Menteri Kesehatan RI Nomor 24 Tahun 2022 tentang Rekam Medis</b>, "
        "serta memiliki arsitektur pertukaran data standar internasional <b>HL7 FHIR R4 (Fast Healthcare Interoperability Resources)</b> "
        "yang terintegrasi secara langsung dengan platform nasional <b>SATUSEHAT Kementerian Kesehatan Republik Indonesia</b>.",
        body_style
    ))
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("Keunggulan Arsitektur Sistem:", h2_style))
    story.append(Paragraph(
        "1. <b>Sistem Mandiri Fasyankes:</b> Pengelolaan data dan operasional berada penuh di bawah kendali klinik tanpa ketergantungan pihak ketiga vendor luar.<br/>"
        "2. <b>Otomasi Integrasi Alat (LIS Bridge):</b> Konektivitas dua arah secara langsung ke mesin hematologi (Sysmex XP-100 via protokol ASTM E1381/E1394), "
        "mesin kimia darah (Mindray BS-240 via protokol HL7 MLLP), dan mesin immunoassay (Wondfo Finecare III Plus via HL7).<br/>"
        "3. <b>Zero-Transcription Error:</b> Penarikan nilai analitik dari mesin alat otomatis masuk ke formulir kerja analis tanpa ketik manual.<br/>"
        "4. <b>Standarisasi Medis Internasional:</b> Pemetaan 244 parameter laboratorium resmi ke kode <b>LOINC</b> dan terminologi spesimen <b>SNOMED CT</b>.<br/>"
        "5. <b>Bridging Otomatis SATUSEHAT:</b> Sinkronisasi instan ke server SATUSEHAT Sandbox/Production saat analis/dokter memverifikasi hasil uji lab.",
        body_style
    ))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("DAFTAR ISI DOKUMEN", h2_style))
    toc_data = [
        [Paragraph("<b>BAGIAN I</b>", body_bold), Paragraph("<b>BUKU PANDUAN PENGGUNA (MANUAL BOOK SELURUH FITUR)</b>", body_bold), Paragraph("<b>Hal. 3</b>", body_bold)],
        [Paragraph("", body_style), Paragraph("Modul 01: Beranda &amp; Ringkasan Eksekutif (Dashboard KPI)", body_style), Paragraph("Hal. 3", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 02: Pendaftaran Pasien &amp; Order Pemeriksaan Laboratorium", body_style), Paragraph("Hal. 4", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 03: Manajemen Antrean Loket &amp; Pengambilan Sampel (Sampling)", body_style), Paragraph("Hal. 5", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 04: Pengisian &amp; Validasi Klinis Hasil Laboratorium", body_style), Paragraph("Hal. 6", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 05: LIS &amp; Integrasi Alat Medis Realtime (Sysmex &amp; Mindray)", body_style), Paragraph("Hal. 7", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 06: Kasir, Billing &amp; Penerbitan Kwitansi Pembayaran", body_style), Paragraph("Hal. 8", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 07: Surat Keterangan Medis &amp; Validasi QR Digital", body_style), Paragraph("Hal. 9", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 08: Master Rekam Medis &amp; Database Pasien Terpadu", body_style), Paragraph("Hal. 10", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 09: Log Audit Kunjungan &amp; Riwayat Pelayanan", body_style), Paragraph("Hal. 11", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 10: Analitik &amp; Laporan Statistik Pemeriksaan", body_style), Paragraph("Hal. 12", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 11: Master Data Tarif, Rujukan &amp; Standarisasi LOINC/SNOMED", body_style), Paragraph("Hal. 13", body_style)],
        [Paragraph("", body_style), Paragraph("Modul 12: Layar Display Antrean Pasien Publik (TV Display)", body_style), Paragraph("Hal. 14", body_style)],
        [Paragraph("<b>BAGIAN II</b>", body_bold), Paragraph("<b>BUKTI UJI COBA SATUSEHAT SANDBOX (ENCOUNTER &amp; DIAGNOSIS)</b>", body_bold), Paragraph("<b>Hal. 15</b>", body_bold)],
        [Paragraph("", body_style), Paragraph("Tahap 1: Autentikasi OAuth2 Token (Respon 200 OK)", body_style), Paragraph("Hal. 15", body_style)],
        [Paragraph("", body_style), Paragraph("Tahap 2: Pencarian Pasien Berdasarkan NIK (Respon 200 OK)", body_style), Paragraph("Hal. 16", body_style)],
        [Paragraph("", body_style), Paragraph("Tahap 3: Pendaftaran Kunjungan Pasien /Encounter (Respon 201 Created)", body_style), Paragraph("Hal. 17", body_style)],
        [Paragraph("", body_style), Paragraph("Tahap 4: Pencatatan Diagnosis Pasien /Condition ICD-10 (Respon 201 Created)", body_style), Paragraph("Hal. 18", body_style)],
        [Paragraph("", body_style), Paragraph("Tahap 5: Laporan Diagnostik Lab /DiagnosticReport (Respon 201 Created)", body_style), Paragraph("Hal. 19", body_style)],
        [Paragraph("", body_style), Paragraph("Rekapitulasi 16 Parameter Uji Lab Rutin Terverifikasi di Server Kemenkes", body_style), Paragraph("Hal. 20", body_style)],
        [Paragraph("<b>BAGIAN III</b>", body_bold), Paragraph("<b>BUKTI PENGIRIMAN EMAIL SCREEN RECORD KE KEMENKES RI</b>", body_bold), Paragraph("<b>Hal. 21</b>", body_bold)],
    ]
    t_toc = Table(toc_data, colWidths=[2.5 * cm, 12.0 * cm, 2.0 * cm])
    t_toc.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
    ]))
    story.append(t_toc)

    story.append(PageBreak())

    # =========================================================================
    # 3. MANUAL BOOK (12 MODUL)
    # =========================================================================
    modules_info = [
        {
            "id": "01",
            "title": "Modul 01: Beranda & Ringkasan Eksekutif",
            "file": "01_beranda.png",
            "desc": "Halaman awal sistem yang menyajikan indikator kinerja utama (KPI) laboratorium secara realtime: "
                    "jumlah pasien hari ini, jumlah pemeriksaan yang sedang diproses, antrean loket, status bridging SATUSEHAT, "
                    "dan jalan pintas menuju seluruh modul operasional."
        },
        {
            "id": "02",
            "title": "Modul 02: Pendaftaran Pasien & Order Uji Lab",
            "file": "02_pendaftaran.png",
            "desc": "Formulir registrasi pasien baru atau pemanggilan pasien lama dengan pencarian otomatis NIK/No.RM. "
                    "Petugas memilih paket atau parameter pemeriksaan lab yang diminta dokter pengirim, mencetak nomor antrean, "
                    "dan menghasilkan nomor laboratorium unik (No. Lab) yang terhubung ke sistem barcode tabung spesimen."
        },
        {
            "id": "03",
            "title": "Modul 03: Manajemen Antrean Loket & Sampling",
            "file": "03_antrean_hari_ini.png",
            "desc": "Layar kendali antrean antrean loket pendaftaran dan antrean bilik pengambilan sampel darah (phlebotomy). "
                    "Mendukung panggilan suara multi-loket, pemantauan waktu tunggu pasien, dan sinkronisasi realtime ke layar display antrean TV."
        },
        {
            "id": "04",
            "title": "Modul 04: Pengisian & Validasi Hasil Laboratorium",
            "file": "04_pengisian_hasil_lab.png",
            "desc": "Lembar kerja utama analis laboratorium (*SkyLab / Worklist*). Nilai hasil uji dapat diisi manual atau ditarik "
                    "secara instan dari alat analyzer via LIS Bridge. Dilengkapi evaluasi batas normal otomatis sesuai usia & gender pasien. "
                    "Tombol 'Verifikasi' mengunci hasil dan secara otomatis mengirim data ke SATUSEHAT (FHIR R4)."
        },
        {
            "id": "05",
            "title": "Modul 05: LIS & Integrasi Alat Medis Realtime",
            "file": "05_lis_integrasi_alat.png",
            "desc": "Pusat monitoring komunikasi perangkat keras medis lokal. Memantau koneksi socket TCP/IP ke mesin hematologi "
                    "Sysmex XP-100 (Port 8000), mesin kimia klinik Mindray BS-240 (Port 7118), dan immunoassay Wondfo (Port 8001). "
                    "Menampilkan log parsing raw data HL7/ASTM secara transparan untuk audit mutu."
        },
        {
            "id": "06",
            "title": "Modul 06: Kasir, Billing & Kwitansi Pembayaran",
            "file": "06_kasir_pembayaran.png",
            "desc": "Modul kasir dan tagihan yang otomatis terisi berdasarkan rincian pemeriksaan yang dipesan pasien. "
                    "Mendukung berbagai metode pembayaran (Tunai, Transfer Bank, QRIS, BPJS/Asuransi) dan dapat mencetak "
                    "kwitansi pembayaran berukuran A4 PDF maupun struk kasir thermal 58mm/80mm."
        },
        {
            "id": "07",
            "title": "Modul 07: Surat Keterangan Medis & Validasi QR Digital",
            "file": "07_surat_keterangan.png",
            "desc": "Penerbitan surat keterangan hasil laboratorium resmi yang dilengkapi stempel digital dan QR Code validasi keaslian dokumen. "
                    "Pasien atau pihak ketiga (instansi/perusahaan) dapat memindai QR Code untuk memeriksa keabsahan hasil secara online."
        },
        {
            "id": "08",
            "title": "Modul 08: Master Rekam Medis Data Pasien",
            "file": "08_data_pasien.png",
            "desc": "Database seluruh rekam medis pasien yang pernah berkunjung. Menyimpan identitas lengkap (NIK, Nama, Tanggal Lahir, Alamat, No. HP, No. BPJS), "
                    "riwayat kunjungan sebelumnya, nomor IHS SATUSEHAT Pasien, serta riwayat penyakit komorbid untuk pemantauan klinis."
        },
        {
            "id": "09",
            "title": "Modul 09: Log Audit & Riwayat Kunjungan",
            "file": "09_riwayat_kunjungan.png",
            "desc": "Pencatatan riwayat kronologis seluruh aktivitas kunjungan pasien di laboratorium. Memungkinkan pencarian berdasarkan rentang tanggal, "
                    "nama dokter pengirim, status pembayaran, maupun status pengiriman data ke server Kemenkes SATUSEHAT."
        },
        {
            "id": "10",
            "title": "Modul 10: Analitik & Laporan Statistik Laboratorium",
            "file": "10_laporan_statistik.png",
            "desc": "Penyajian grafik tren kunjungan, 10 pemeriksaan terbanyak, demografi pasien, sebaran dokter perujuk, "
                    "dan rekapitulasi finansial bulanan guna membantu pengambilan keputusan manajemen fasilitas kesehatan secara presisi."
        },
        {
            "id": "11",
            "title": "Modul 11: Master Data Tarif, Rujukan & Standarisasi Lab",
            "file": "11_master_data_lab.png",
            "desc": "Konfigurasi tarif biaya, batas nilai rujukan normal (pria/wanita/anak), kelompok tes, serta pemetaan standar interoperabilitas "
                    "kode LOINC (Logical Observation Identifiers Names and Codes) dan kode spesimen SNOMED-CT untuk kepatuhan SATUSEHAT Kemenkes."
        },
        {
            "id": "12",
            "title": "Modul 12: Layar Display Antrean Pasien Publik",
            "file": "12_display_antrean.png",
            "desc": "Layar monitor display antrean resolusi tinggi yang dipasang di ruang tunggu pasien. Menampilkan nomor antrean yang sedang dipanggil, "
                    "daftar pasien hari ini dengan status pelayanan, video edukasi kesehatan, dan running text informasi layanan."
        }
    ]

    story.append(Paragraph("BAGIAN I: BUKU PANDUAN PENGGUNA (MANUAL BOOK FITUR SISTEM)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=2, spaceAfter=12))

    for idx, mod in enumerate(modules_info):
        story.append(Paragraph(f"<b>{mod['title']}</b>", h2_style))
        story.append(Paragraph(mod['desc'], body_style))
        story.append(Spacer(1, 2 * mm))

        img_p = os.path.join(SCREENSHOT_DIR, mod['file'])
        if os.path.exists(img_p):
            # A4 printable width is around 17cm (480 pt)
            im = RLImage(img_p, width=16.5 * cm, height=9.28 * cm)
            im.hAlign = 'CENTER'
            story.append(im)
            story.append(Paragraph(f"Gambar {idx+1}: Tampilan Antarmuka {mod['title']}", caption_style))
        else:
            story.append(Paragraph(f"[Tangkapan Layar {mod['file']}]", caption_style))

        story.append(PageBreak())

    # =========================================================================
    # 4. BUKTI UJI COBA SATUSEHAT SANDBOX (BAGIAN II)
    # =========================================================================
    story.append(Paragraph("BAGIAN II: BUKTI UJI COBA RESMI SATUSEHAT SANDBOX (FHIR R4)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=2, spaceAfter=12))

    story.append(Paragraph(
        "Sesuai arahan teknis dan instruksi verifikasi <b>Tim Onboarding SATUSEHAT DTO Kementerian Kesehatan RI</b>, "
        "berikut dilampirkan bukti otentik uji coba integrasi sistem RME Mandiri <i>Utama Lab System</i> "
        "terhadap server SATUSEHAT Sandbox API (<code>https://api-satusehat-stg.dto.kemkes.go.id</code>). "
        "Uji coba mencakup alur lengkap: <b>OAuth2 Token, Patient, Encounter, Diagnosis (Condition ICD-10), hingga DiagnosticReport</b> "
        "dengan respon HTTP <b>200 OK</b> dan <b>201 Created</b>.",
        body_style
    ))
    story.append(Spacer(1, 4 * mm))

    postman_items = [
        {
            "step": "Tahap 1: Autentikasi OAuth2 Token (Respon 200 OK)",
            "file": "postman_01_oauth2.png",
            "desc": "Pengujian permintaan Bearer Access Token menggunakan Client ID dan Client Secret Sandbox Fasyankes. "
                    "Server Kemenkes merespon sukses dengan status <b>HTTP 200 OK</b> dan menerbitkan token otorisasi aktif selama 1799 detik."
        },
        {
            "step": "Tahap 2: Pencarian Pasien Berdasarkan NIK (Respon 200 OK)",
            "file": "postman_02_patient.png",
            "desc": "Verifikasi identitas pasien uji coba dengan query NIK <code>3303045512940002</code> ke endpoint <code>/Patient</code>. "
                    "Server SATUSEHAT mengembalikan data pasien dengan status <b>HTTP 200 OK</b> dan nomor Patient IHS: <code>P20396305854</code>."
        },
        {
            "step": "Tahap 3: Pendaftaran Kunjungan Laboratorium /Encounter (Respon 201 Created)",
            "file": "postman_03_encounter.png",
            "desc": "Pendaftaran kunjungan rawat jalan pasien ke laboratorium medis menggunakan resource <code>Encounter</code>. "
                    "Server SATUSEHAT berhasil memproses dan menerbitkan nomor <b>Encounter ID: <code>c3f7bfcc-d8bb-484e-abfe-44d3aa6ee60e</code></b> "
                    "dengan status <b>HTTP 201 Created</b>."
        },
        {
            "step": "Tahap 4: Pencatatan Diagnosis Pasien /Condition ICD-10 (Respon 201 Created)",
            "file": "postman_04_condition.png",
            "desc": "Pengiriman diagnosis klinis pasien menggunakan resource <code>Condition</code> dengan kode terminologi ICD-10 <b>Z01.7 (Laboratory examination)</b> "
                    "yang merujuk pada Encounter ID kunjungan. Server SATUSEHAT berhasil menerbitkan <b>Condition ID: <code>8f89985e-e0b7-452e-879e-4f8cbc2d5724</code></b> "
                    "dengan status <b>HTTP 201 Created</b> tanpa pelanggaran skema."
        },
        {
            "step": "Tahap 5: Laporan Diagnostik Lab /DiagnosticReport (Respon 201 Created)",
            "file": "postman_05_diagnostic_report.png",
            "desc": "Pengiriman bundel laporan akhir pemeriksaan laboratorium yang merangkum parameter uji LOINC menggunakan resource <code>DiagnosticReport</code>. "
                    "Server SATUSEHAT merespon sukses dengan status <b>HTTP 201 Created</b> (DiagReport ID: <code>7f7f051a-98ba-4c08-8f37-7e245f26f51c</code>)."
        }
    ]

    for p_idx, p_item in enumerate(postman_items):
        story.append(Paragraph(f"<b>{p_item['step']}</b>", h2_style))
        story.append(Paragraph(p_item['desc'], body_style))
        story.append(Spacer(1, 2 * mm))

        p_img = os.path.join(POSTMAN_DIR, p_item['file'])
        if os.path.exists(p_img):
            im = RLImage(p_img, width=16.5 * cm, height=8.58 * cm)
            im.hAlign = 'CENTER'
            story.append(im)
            story.append(Paragraph(f"Bukti Uji Coba Postman #{p_idx+1}: {p_item['step']}", caption_style))

        story.append(PageBreak())

    # =========================================================================
    # REKAPITULASI 16 PARAMETER UJI LAB
    # =========================================================================
    story.append(Paragraph("REKAPITULASI 16 PARAMETER PEMERIKSAAN RUTIN TERVERIFIKASI SATUSEHAT", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "Seluruh 16 parameter pemeriksaan rutin di bawah ini telah diuji secara <i>live</i> ke SATUSEHAT Sandbox API "
        "dan dinyatakan <b>100% Lolos Validasi</b> dengan diterbitkannya FHIR Observation Resource ID resmi untuk masing-masing parameter:",
        body_style
    ))
    story.append(Spacer(1, 3 * mm))

    table_loinc_data = [
        [Paragraph("<b>No</b>", body_bold), Paragraph("<b>Nama Pemeriksaan</b>", body_bold), Paragraph("<b>Kode LOINC</b>", body_bold), Paragraph("<b>Display LOINC (Kemenkes)</b>", body_bold), Paragraph("<b>FHIR Resource ID</b>", body_bold)],
        ["1", "Hemoglobin", "718-7", "Hemoglobin [Mass/volume] in Blood", "57ec6ae7-9079-4fcc-91f2-c3a62597d7a4"],
        ["2", "Leukosit", "6690-2", "Leukocytes [#/volume] in Blood", "1e6355bf-5727-4441-bc38-cd08e286a264"],
        ["3", "Trombosit", "777-3", "Platelets [#/volume] in Blood", "fed06261-36ae-47d5-9571-6e68649294c5"],
        ["4", "Hematokrit", "4544-3", "Hematocrit [Volume Fraction] of Blood", "2f1348eb-65df-4438-a28d-138bc1cd13f5"],
        ["5", "Eritrosit", "789-8", "Erythrocytes [#/volume] in Blood", "316c80ee-5863-4b10-9e91-1b108a09d223"],
        ["6", "LED 1 Jam", "30341-2", "Erythrocyte sedimentation rate", "afb2a00b-9b7f-41ec-b4ae-8960845ce4ae"],
        ["7", "Limfosit", "736-9", "Lymphocytes/100 leukocytes in Blood", "5182e16d-f795-4879-be1b-150ee89338e3"],
        ["8", "Cholesterol Total", "2093-3", "Cholesterol [Mass/volume] in Serum", "48684b1f-763e-4dd6-96e2-466e6f6cdd48"],
        ["9", "Trigliserida", "2571-8", "Triglyceride [Mass/volume] in Serum", "0b05adf7-879b-4ec3-b142-a30dcaf9b639"],
        ["10", "Asam Urat", "3084-1", "Urate [Mass/volume] in Serum", "3cfefea8-e040-4d2d-96c7-6d64f6188620"],
        ["11", "Creatinin", "2160-0", "Creatinine [Mass/volume] in Serum", "c6e5c257-96f4-40c5-b1d5-36b4906d7286"],
        ["12", "Ureum", "3091-6", "Blood urea nitrogen in Serum", "00d5c1d5-e3b3-479c-ae0e-99f3b8097a6a"],
        ["13", "Glukosa Darah Puasa", "1558-6", "Fasting glucose in Serum", "b7425ec5-677a-43e5-8a91-b9f44e5f2aa8"],
        ["14", "Protein Urin", "20454-5", "Protein [Presence] in Urine", "98f34f61-3d75-48ca-9da7-6a04f9ba6755"],
        ["15", "Glukosa Urin", "25428-4", "Glucose [Presence] in Urine", "caec18cf-c33b-4636-b04c-2d1f73533f3b"],
        ["16", "pH Urin", "5803-2", "pH of Urine by Test strip", "62b87ece-2fe8-4ba5-b744-6fab2f0999f0"]
    ]

    t_loinc = Table(table_loinc_data, colWidths=[0.8 * cm, 3.8 * cm, 2.2 * cm, 5.2 * cm, 4.5 * cm])
    t_loinc.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f3460")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t_loinc)

    story.append(PageBreak())

    # =========================================================================
    # 5. BAGIAN III: BUKTI PENGIRIMAN EMAIL SCREEN RECORD KE KEMENKES RI
    # =========================================================================
    story.append(Paragraph("BAGIAN III: BUKTI PENGIRIMAN VIDEO SCREEN RECORD KE KEMENKES RI", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "Sesuai persyaratan akhir onboarding DTO Kemenkes RI: <i>'Harap kirimkan video/tampilan screen record uji coba, "
        "dan dikirimkan ke email <code>onboarding.satusehat@dto.kemkes.go.id</code> (bukti ss telah email digabung/dilampirkan pada halaman akhir PDF Dokumentasi Sistem)'</i>.",
        body_style
    ))
    story.append(Spacer(1, 2 * mm))

    # Email format preview box
    email_box_data = [
        [Paragraph("<b>Kepada</b>", body_style), Paragraph(": <code>onboarding.satusehat@dto.kemkes.go.id</code>", body_style)],
        [Paragraph("<b>Cc</b>", body_style), Paragraph(": <code>helpdesk@kemkes.go.id</code>", body_style)],
        [Paragraph("<b>Subjek</b>", body_style), Paragraph(": <b>[Uji Coba Sandbox] Pengajuan Integrasi RME Mandiri - Laboratorium Medis Utama (Kode Faskes: 33030700001)</b>", body_style)],
        [Paragraph("<b>Isi Pesan Singkat</b>", body_style), Paragraph(
            "Yth. Tim Onboarding SATUSEHAT DTO Kemenkes RI,<br/><br/>"
            "Bersama ini kami kirimkan tautan video screen record dan bukti uji coba Sandbox sistem RME Mandiri "
            "<b>Utama Lab System</b> untuk <b>Laboratorium Medis Utama</b> (Kode Fasyankes: <code>33030700001</code>):<br/>"
            "• <b>Tautan Video Screen Record Uji Coba:</b> [Tautan Google Drive / Video]<br/>"
            "• <b>Uji Coba Berhasil:</b> OAuth2, Patient, Encounter (201 Created), Condition Diagnosis (201 Created), dan DiagnosticReport (201 Created).<br/><br/>"
            "Terima kasih atas bimbingan dan kerjasamanya.<br/>"
            "Hormat kami,<br/><b>Tim IT Laboratorium Medis Utama</b>",
            body_style
        )],
    ]
    t_email_info = Table(email_box_data, colWidths=[3.2 * cm, 13.3 * cm])
    t_email_info.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(t_email_info)
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("<b>Lampiran Tangkapan Layar (Screenshot) Bukti Email Terkirim:</b>", h2_style))

    # Placeholder or check for screenshot email
    email_ss_path = os.path.join(BASE_DIR, "docs", "assets", "bukti_kirim_email_satusehat.png")
    if os.path.exists(email_ss_path):
        im_email = RLImage(email_ss_path, width=16.5 * cm, height=9.5 * cm)
        im_email.hAlign = 'CENTER'
        story.append(im_email)
        story.append(Paragraph("Tangkapan Layar Bukti Email Telah Terkirim ke onboarding.satusehat@dto.kemkes.go.id", caption_style))
    else:
        # Render a neat framed box ready for user screenshot
        box_frame_data = [[
            Paragraph(
                "<br/><br/><br/>"
                "<b>[TEMPAT PENEMPATAN BUKTI TANGKAPAN LAYAR (SCREENSHOT) EMAIL TERKIRIM]</b><br/><br/>"
                "Setelah mengirimkan video screen record ke <code>onboarding.satusehat@dto.kemkes.go.id</code>,<br/>"
                "simpan tangkapan layar (screenshot) bukti pengiriman email ke berkas:<br/>"
                "<code>docs/assets/bukti_kirim_email_satusehat.png</code><br/>"
                "lalu jalankan ulang pembuatan PDF ini untuk memuat gambar bukti secara otomatis.<br/><br/><br/>",
                caption_style
            )
        ]]
        t_frame = Table(box_frame_data, colWidths=[16.5 * cm], rowHeights=[9.0 * cm])
        t_frame.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
            ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#94a3b8")),
        ]))
        story.append(t_frame)
        story.append(Paragraph("Area Lampiran Bukti Email Terkirim ke onboarding.satusehat@dto.kemkes.go.id", caption_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Buku Panduan & Dokumentasi Sistem PDF berhasil dibuat di: {OUT_PDF}")

if __name__ == "__main__":
    buat_pdf()
