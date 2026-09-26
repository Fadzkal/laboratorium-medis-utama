"""
Generator Kartu Rekam Medis / E-Card Laboratorium Medis
Menggunakan template gambar latar belakang dan menambahkan secara otomatis:
- Nama Pasien (Otomatis di tengah / Centered)
- Barcode Code 128 (Otomatis di-generate dari Nomor ID & di tengah)
- Nomor ID (Otomatis di tengah)
"""

import os
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode import createBarcodeDrawing
from reportlab.graphics import renderPDF

# Ukuran standar ID Card (85.6 mm x 53.98 mm dalam satuan points)
# 1 mm = 72 / 25.4 points ≈ 2.83465 points
WIDTH_PT = 242.88
HEIGHT_PT = 153.0

def buat_kartu(nama: str, nomor_id: str, output_pdf: str = None, 
               template_depan: str = "template_kartu_depan_kosong.png",
               template_belakang: str = "template_kartu_belakang.png",
               sertakan_belakang: bool = True):
    """
    Menghasilkan file PDF Kartu Pasien dengan nama, barcode, dan ID.
    
    :param nama: Nama lengkap pasien (contoh: "FADZKAL LUTHFI MAYZANIO")
    :param nomor_id: Nomor rekam medis / ID pasien (contoh: "123-456-7890")
    :param output_pdf: Nama file PDF hasil output (default: "Kartu_{nomor_id}.pdf")
    :param template_depan: Path file gambar template depan yang kosong
    :param template_belakang: Path file gambar template sisi belakang
    :param sertakan_belakang: True jika ingin membuat 2 halaman (depan + belakang)
    """
    if output_pdf is None:
        safe_id = nomor_id.replace("/", "_").replace("\\", "_")
        output_pdf = f"Kartu_{safe_id}.pdf"
    
    # 1. Inisialisasi Canvas PDF dengan ukuran ID Card
    c = canvas.Canvas(output_pdf, pagesize=(WIDTH_PT, HEIGHT_PT))
    
    # 2. Gambar Template Latar Belakang Depan
    if os.path.exists(template_depan):
        c.drawImage(template_depan, 0, 0, width=WIDTH_PT, height=HEIGHT_PT)
    else:
        print(f"Peringatan: File '{template_depan}' tidak ditemukan. Menggunakan background polos.")
    
    # Warna teks elegan sesuai kartu asli (Dark Slate / Charcoal: #2D374B)
    warna_teks = HexColor("#2D374B")
    c.setFillColor(warna_teks)
    
    # 3. Cetak Nama Pasien (Tepat di tengah horizontal)
    c.setFont("Helvetica-Bold", 8.5)
    center_x = WIDTH_PT / 2.0
    posisi_y_nama = 95.0
    c.drawCentredString(center_x, posisi_y_nama, nama.upper())
    
    # 4. Generate Barcode Otomatis (Code 128) dari Nomor ID
    target_lebar_barcode = 105.5  # Ukuran lebar barcode dalam points (~37 mm)
    tinggi_barcode = 25.4        # Tinggi barcode (~9 mm)
    
    barcode = createBarcodeDrawing('Code128', value=nomor_id, barHeight=tinggi_barcode, humanReadable=False)
    # Sesuaikan ketebalan garis (barWidth) agar total lebarnya pas dan presisi
    node = barcode.contents[0]
    if node.width > 0:
        node.barWidth *= (target_lebar_barcode / node.width)
        barcode.width = target_lebar_barcode
    
    posisi_x_barcode = (WIDTH_PT - barcode.width) / 2.0
    posisi_y_barcode = 60.5
    renderPDF.draw(barcode, c, posisi_x_barcode, posisi_y_barcode)
    
    # 5. Cetak Teks Nomor ID (Tepat di bawah Barcode, di tengah)
    c.setFont("Helvetica", 6.5)
    posisi_y_id = 47.0
    c.drawCentredString(center_x, posisi_y_id, f"Nomor ID:  {nomor_id}")
    
    # 6. Sisi Belakang Kartu (Opsional)
    if sertakan_belakang and os.path.exists(template_belakang):
        c.showPage()
        c.drawImage(template_belakang, 0, 0, width=WIDTH_PT, height=HEIGHT_PT)
    
    c.save()
    print(f"-> Berhasil membuat: {output_pdf}")
    return output_pdf


if __name__ == "__main__":
    # Contoh Penggunaan: Cukup ubah Nama dan Nomor ID saja!
    pasien_nama = "FADZKAL LUTHFI MAYZANIO"
    pasien_id = "123-456-7890"
    
    print("Sedang membuat kartu pasien...")
    buat_kartu(nama=pasien_nama, nomor_id=pasien_id, output_pdf="Kartu_Rekam_Medis.pdf")
