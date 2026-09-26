import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Document;
import com.itextpdf.text.Image;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.Barcode128;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfContentByte;
import com.itextpdf.text.pdf.PdfWriter;

import java.io.FileOutputStream;

/**
 * Generator Otomatis Kartu Pasien / Rekam Medis
 * Menggunakan library iText 5
 */
public class CetakKartuMedis {

    public static void main(String[] args) {
        // CUKUP GANTI 2 DATA INI SAJA:
        String namaPasien = "FADZKAL LUTHFI MAYZANIO";
        String idPasien = "123-456-7890";

        String templateDepan = "template_kartu_depan_kosong.png";
        String templateBelakang = "template_kartu_belakang.png";
        String fileOutput = "Kartu_Rekam_Medis_Java.pdf";

        buatKartu(namaPasien, idPasien, templateDepan, templateBelakang, fileOutput);
    }

    public static void buatKartu(String nama, String id, String templateDepanPath, String templateBelakangPath, String outputPdf) {
        try {
            // 1. Ukuran Kartu Standar ID-1: 85.6 mm x 53.98 mm (242.88 x 153.0 points)
            float lebar = 242.88f;
            float tinggi = 153.0f;
            Document document = new Document(new Rectangle(lebar, tinggi), 0, 0, 0, 0);

            // 2. Siapkan Writer
            PdfWriter writer = PdfWriter.getInstance(document, new FileOutputStream(outputPdf));
            document.open();
            PdfContentByte cb = writer.getDirectContent();

            // 3. Masukkan Background Template Kosong (Halaman 1 - Depan)
            try {
                Image template = Image.getInstance(templateDepanPath);
                template.setAbsolutePosition(0, 0);
                template.scaleAbsolute(lebar, tinggi);
                document.add(template);
            } catch (Exception e) {
                System.out.println("Peringatan: File template tidak ditemukan. Melanjutkan dengan background putih.");
            }

            // 4. Pengaturan Font & Warna (#2D374B - Charcoal Slate sesuai desain asli)
            BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            BaseFont bfNormal = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            BaseColor warnaTeks = new BaseColor(45, 55, 75); // #2D374B

            float centerX = lebar / 2.0f;

            // 5. Tulis Teks NAMA PASIEN (Otomatis rata tengah / Center)
            cb.beginText();
            cb.setColorFill(warnaTeks);
            cb.setFontAndSize(bfBold, 8.5f);
            cb.showTextAligned(PdfContentByte.ALIGN_CENTER, nama.toUpperCase(), centerX, 95.0f, 0);
            cb.endText();

            // 6. Generate BARCODE (Code 128) Otomatis dari Nomor ID
            Barcode128 barcode = new Barcode128();
            barcode.setCode(id);
            barcode.setFont(null); // Menghilangkan teks angka bawaan iText agar murni garis barcode
            barcode.setBarHeight(25.4f);

            // Konversi Barcode menjadi Image iText
            Image barcodeImage = barcode.createImageWithBarcode(cb, warnaTeks, warnaTeks);

            // Atur Skala dan Posisi agar presisi di tengah
            float targetBarcodeWidth = 105.5f;
            float targetBarcodeHeight = 25.4f;
            barcodeImage.scaleAbsolute(targetBarcodeWidth, targetBarcodeHeight);

            float barcodeX = (lebar - targetBarcodeWidth) / 2.0f;
            float barcodeY = 60.5f;
            barcodeImage.setAbsolutePosition(barcodeX, barcodeY);
            document.add(barcodeImage);

            // 7. Tulis Teks NOMOR ID (Otomatis rata tengah di bawah barcode)
            cb.beginText();
            cb.setColorFill(warnaTeks);
            cb.setFontAndSize(bfNormal, 6.5f);
            cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "Nomor ID:  " + id, centerX, 47.0f, 0);
            cb.endText();

            // 8. Halaman 2: Sisi Belakang Kartu (Opsional)
            try {
                document.newPage();
                Image templateBelakang = Image.getInstance(templateBelakangPath);
                templateBelakang.setAbsolutePosition(0, 0);
                templateBelakang.scaleAbsolute(lebar, tinggi);
                document.add(templateBelakang);
            } catch (Exception e) {
                // Abaikan jika file belakang tidak disertakan
            }

            // Selesai
            document.close();
            System.out.println("Berhasil! File " + outputPdf + " telah dibuat.");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
