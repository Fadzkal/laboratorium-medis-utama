/**
 * =========================================================================
 * kartu_pasien.js - Modul Cetak Kartu Rekam Medis Pasien (Standar ISO CR-80)
 * =========================================================================
 * Spesifikasi Fisik:
 * - Ukuran Standar Kartu ISO CR-80 (85.6mm x 54mm) Landscape
 * - Sisi Depan:
 *   * Background: 'cetak kartu medis/template_kartu_depan_kosong.png' (100% x 100%)
 *   * Nama Pasien: Huruf Kapital, Bold (~8.5pt / 11-12px), Warna #2D374B (Charcoal), Terpusat
 *   * Barcode Code 128: Dibuat dari No. RM (pasien.no_rm), Warna #2D374B, Terpusat (~37mm x 9mm)
 *   * Nomor ID: "Nomor ID:  " + (pasien.no_rm || "-"), Warna #2D374B, Terpusat (~6.8pt)
 * - Sisi Belakang:
 *   * Background: 'cetak kartu medis/template_kartu_belakang.png' (100% x 100%)
 * - Dukungan Mode Cetak:
 *   * Cetak Sisi Depan Saja
 *   * Cetak Sisi Belakang Saja
 *   * Cetak Bolak-Balik (2 Halaman berurutan)
 * =========================================================================
 */

const KartuPasien = (() => {
  'use strict';

  // Pola biner Code 128 (107 simbol) untuk rendering SVG presisi
  const CODE128_PATTERNS = [
    '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
    '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
    '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
    '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
    '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
    '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
    '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
    '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
    '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
    '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
    '114131','311141','411131','211412','211214','211232','2331112'
  ];

  const PATH_TEMPLATE_DEPAN    = 'cetak kartu medis/template_kartu_depan_kosong.png';
  const PATH_TEMPLATE_BELAKANG = 'cetak kartu medis/template_kartu_belakang.png';
  const WARNA_CHARCOAL         = '#2D374B';

  /**
   * Generator Barcode Code 128 Mandiri format SVG Vektor
   * @param {string} teks Teks No. RM yang akan dienkode
   * @param {string} barColor Warna batang barcode (default #2D374B)
   * @param {number} tinggi Tinggi barcode dalam px
   * @param {number} modulWidth Ketebalan unit bar
   */
  function buatBarcodeCode128Svg(teks, barColor = WARNA_CHARCOAL, tinggi = 24, modulWidth = 1.05) {
    if (!teks) teks = '000000';
    const strTeks = String(teks).trim();
    const codes = [];
    const isNumeric = /^\d+$/.test(strTeks) && strTeks.length % 2 === 0;

    if (isNumeric) {
      codes.push(105); // Start C (numeric pairs)
      for (let i = 0; i < strTeks.length; i += 2) {
        codes.push(parseInt(strTeks.substr(i, 2), 10));
      }
    } else {
      codes.push(104); // Start B (alphanumeric)
      for (let i = 0; i < strTeks.length; i++) {
        codes.push(strTeks.charCodeAt(i) - 32);
      }
    }

    let check = codes[0];
    for (let i = 1; i < codes.length; i++) {
      check = (check + codes[i] * i) % 103;
    }
    codes.push(check);
    codes.push(106); // Stop

    let patternStr = '';
    for (const c of codes) {
      if (c >= 0 && c < CODE128_PATTERNS.length) {
        patternStr += CODE128_PATTERNS[c];
      }
    }

    const rects = [];
    let isBar = true;
    let x = 8; // Quiet zone 8 modul
    for (const ch of patternStr) {
      const w = parseInt(ch, 10);
      if (isBar) {
        rects.push(`<rect x="${(x * modulWidth).toFixed(1)}" y="0" width="${(w * modulWidth).toFixed(1)}" height="${tinggi}" fill="${barColor}"/>`);
      }
      x += w;
      isBar = !isBar;
    }
    x += 8; // Quiet zone kanan
    const totalW = (x * modulWidth).toFixed(1);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${tinggi}" width="100%" height="100%" preserveAspectRatio="none" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  }

  /**
   * Menghasilkan HTML Halaman Kartu untuk Cetak Browser
   * @param {Object} pasien Objek data pasien
   * @param {string} mode 'depan', 'belakang', atau 'semua'
   */
  function buatHtmlCetak(pasien, mode = 'semua') {
    const namaPasien = ((pasien?.nama || '')).toUpperCase();
    const noRm = (pasien?.no_rm || '-').trim();
    const barcodeSvg = buatBarcodeCode128Svg(noRm, WARNA_CHARCOAL, 24, 1.05);

    const halamanDepan = `
      <div class="kartu-halaman">
        <img class="kartu-bg" src="${PATH_TEMPLATE_DEPAN}" alt="Background Kartu Depan" />
        <div class="kartu-konten-depan">
          <div class="kartu-nama">${UI.esc(namaPasien)}</div>
          <div class="kartu-barcode-wrap">
            <div class="kartu-barcode">${barcodeSvg}</div>
          </div>
          <div class="kartu-id">Nomor ID:&nbsp;&nbsp;${UI.esc(noRm)}</div>
        </div>
      </div>
    `;

    const halamanBelakang = `
      <div class="kartu-halaman">
        <img class="kartu-bg" src="${PATH_TEMPLATE_BELAKANG}" alt="Background Kartu Belakang" />
      </div>
    `;

    let isiHalaman = '';
    if (mode === 'depan') {
      isiHalaman = halamanDepan;
    } else if (mode === 'belakang') {
      isiHalaman = halamanBelakang;
    } else {
      isiHalaman = halamanDepan + halamanBelakang;
    }

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Cetak Kartu Rekam Medis - ${UI.esc(namaPasien)}</title>
  <style>
    @page {
      size: 85.6mm 54mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 85.6mm;
      height: 54mm;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
    }
    .kartu-halaman {
      position: relative;
      width: 85.6mm;
      height: 54mm;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .kartu-halaman:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .kartu-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 85.6mm;
      height: 54mm;
      object-fit: fill;
      z-index: 1;
    }
    .kartu-konten-depan {
      position: absolute;
      top: 0;
      left: 0;
      width: 85.6mm;
      height: 54mm;
      z-index: 2;
    }
    .kartu-nama {
      position: absolute;
      top: 17.5mm;
      left: 0;
      width: 85.6mm;
      text-align: center;
      font-size: 8.5pt;
      font-weight: bold;
      color: ${WARNA_CHARCOAL};
      letter-spacing: 0.3px;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 4mm;
    }
    .kartu-barcode-wrap {
      position: absolute;
      top: 23.5mm;
      left: 0;
      width: 85.6mm;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .kartu-barcode {
      width: 36mm;
      height: 7.0mm;
      display: flex;
      justify-content: center;
    }
    .kartu-barcode svg {
      width: 100%;
      height: 100%;
    }
    .kartu-id {
      position: absolute;
      top: 32.2mm;
      left: 0;
      width: 85.6mm;
      text-align: center;
      font-size: 6.8pt;
      font-weight: normal;
      color: ${WARNA_CHARCOAL};
      letter-spacing: 0.4px;
    }
  </style>
</head>
<body>
  ${isiHalaman}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
        window.close();
      }, 350);
    });
  </script>
</body>
</html>`;
  }

  /**
   * Eksekusi Cetak Kartu via Tab/Jendela Baru
   * @param {Object} pasien Objek pasien
   * @param {string} mode 'depan', 'belakang', atau 'semua'
   */
  function cetak(pasien, mode = 'semua') {
    if (!pasien) {
      UI.toast('Data pasien tidak valid untuk dicetak.', 'err');
      return;
    }
    const html = buatHtmlCetak(pasien, mode);
    const win = window.open('', '_blank');
    if (!win) {
      UI.toast('Pop-up jendela cetak diblokir browser. Izinkan pop-up untuk mencetak kartu.', 'err');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  /**
   * Modal Pratinjau & Cetak Kartu Pasien ISO CR-80
   * @param {Object} pasien Objek pasien
   */
  async function bukaModal(pasien) {
    if (!pasien) {
      UI.toast('Data pasien belum dipilih.', 'err');
      return;
    }

    const namaPasien = (pasien.nama || '').toUpperCase();
    const noRm = (pasien.no_rm || '-').trim();
    const barcodeSvg = buatBarcodeCode128Svg(noRm, WARNA_CHARCOAL, 25, 1.05);

    const isiModal = `
      <style>
        .kartu-modal-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
          user-select: none;
        }
        .kartu-grid-preview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          justify-items: center;
          padding: 8px 4px;
        }
        .kartu-card-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 100%;
          max-width: 356px;
        }
        .kartu-card-col .label-col {
          font-size: 12px;
          font-weight: 700;
          color: var(--ink-700);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        /* Rasio Standar CR-80: 85.6 / 54 = 1.585 */
        .kartu-box-preview {
          width: 342px;
          height: 216px;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #d1d5db;
          background: #ffffff;
        }
        .kartu-box-preview img.bg-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: fill;
          z-index: 1;
        }
        .kartu-preview-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        }
        .kartu-p-nama {
          position: absolute;
          top: 70px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: ${WARNA_CHARCOAL};
          letter-spacing: 0.4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 16px;
          font-family: Arial, Helvetica, sans-serif;
        }
        .kartu-p-barcode-wrap {
          position: absolute;
          top: 94px;
          left: 0;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .kartu-p-barcode {
          width: 144px;
          height: 25px;
          display: flex;
          justify-content: center;
        }
        .kartu-p-barcode svg {
          width: 100%;
          height: 100%;
        }
        .kartu-p-id {
          position: absolute;
          top: 126px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 9px;
          font-weight: 600;
          color: ${WARNA_CHARCOAL};
          font-family: Arial, Helvetica, sans-serif;
          letter-spacing: 0.4px;
        }
        .kartu-info-bar {
          background: var(--ink-50);
          border: 1px solid var(--ink-200);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-size: 12px;
          color: var(--ink-700);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
      </style>

      <div class="kartu-modal-wrap">
        <div class="kartu-info-bar">
          <div>
            <b>Format Cetak:</b> Standar Kartu Berobat ISO CR-80 (85.6mm x 54mm)
          </div>
          <div>
            <b>Pasien:</b> ${UI.esc(namaPasien)} (${UI.esc(noRm)})
          </div>
        </div>

        <div class="kartu-grid-preview">
          <!-- Kolom Pratinjau Sisi Depan -->
          <div class="kartu-card-col">
            <div class="label-col">Sisi Depan</div>
            <div class="kartu-box-preview">
              <img class="bg-img" src="${PATH_TEMPLATE_DEPAN}" alt="Template Depan" />
              <div class="kartu-preview-overlay">
                <div class="kartu-p-nama">${UI.esc(namaPasien)}</div>
                <div class="kartu-p-barcode-wrap">
                  <div class="kartu-p-barcode">${barcodeSvg}</div>
                </div>
                <div class="kartu-p-id">Nomor ID:&nbsp;&nbsp;${UI.esc(noRm)}</div>
              </div>
            </div>
          </div>

          <!-- Kolom Pratinjau Sisi Belakang -->
          <div class="kartu-card-col">
            <div class="label-col">Sisi Belakang</div>
            <div class="kartu-box-preview">
              <img class="bg-img" src="${PATH_TEMPLATE_BELAKANG}" alt="Template Belakang" />
            </div>
          </div>
        </div>
      </div>
    `;

    await UI.modal({
      judul: 'Cetak Kartu Rekam Medis Pasien (CR-80)',
      isi: isiModal,
      lebar: true,
      tombol: [
        {
          teks: 'Tutup',
          nilai: null
        },
        {
          teks: 'Cetak Sisi Depan',
          kelas: 'btn-secondary',
          aksi: () => {
            cetak(pasien, 'depan');
            return false;
          }
        },
        {
          teks: 'Cetak Sisi Belakang',
          kelas: 'btn-secondary',
          aksi: () => {
            cetak(pasien, 'belakang');
            return false;
          }
        },
        {
          teks: 'Cetak Bolak-Balik (2 Halaman)',
          kelas: 'btn-primary',
          aksi: () => {
            cetak(pasien, 'semua');
            return false;
          }
        }
      ]
    });
  }

  /**
   * Helper Auto-Scan Barcode Kartu untuk Input Pasien
   * Mendeteksi input burst dari barcode scanner fisik (Blueprint BP-LITE dsb)
   * dan mencocokkan ke database pasien
   * 
   * @param {HTMLInputElement} inputEl Elemen input pencarian
   * @param {Function} onDitemukan Callback saat pasien berhasil ditemukan (pasien) => void
   */
  function pasangAutoScanRm(inputEl, onDitemukan) {
    if (!inputEl) return;

    let scanBuffer = '';
    let scanTimestamps = [];
    let lastKeyTime = 0;
    const MAX_SCAN_INTERVAL = 60; // ms threshold scanner HID

    inputEl.addEventListener('keydown', async (e) => {
      const now = Date.now();
      const diff = now - lastKeyTime;

      if (e.key === 'Enter') {
        const query = (scanBuffer || inputEl.value || '').trim();
        const totalChars = scanTimestamps.length;
        const isScanBurst = (totalChars >= 4 && (now - scanTimestamps[0]) < 600);

        // Reset buffer
        scanBuffer = '';
        scanTimestamps = [];
        lastKeyTime = 0;

        if (query.length >= 2) {
          // Cari langsung data pasien di DB berdasarkan No. RM atau kueri
          try {
            const hasil = await DB.cariPasien(query, 5);
            if (hasil && hasil.length > 0) {
              // Cari yang no_rm tepat sama atau ambil hasil teratas jika scan burst
              const target = hasil.find(p => (p.no_rm || '').toLowerCase() === query.toLowerCase()) || hasil[0];
              if (target && typeof onDitemukan === 'function') {
                e.preventDefault();
                e.stopPropagation();
                inputEl.value = '';
                onDitemukan(target);
              }
            }
          } catch (err) {
            console.warn('Gagal auto-scan pasien:', err);
          }
        }
        return;
      }

      if (e.key && e.key.length === 1) {
        if (diff > MAX_SCAN_INTERVAL) {
          scanBuffer = '';
          scanTimestamps = [];
        }
        scanBuffer += e.key;
        scanTimestamps.push(now);
        lastKeyTime = now;

        if (scanBuffer.length > 40) {
          scanBuffer = scanBuffer.slice(-20);
          scanTimestamps = scanTimestamps.slice(-20);
        }
      }
    });
  }

  return {
    buatBarcodeCode128Svg,
    buatHtmlCetak,
    cetak,
    bukaModal,
    pasangAutoScanRm
  };
})();
