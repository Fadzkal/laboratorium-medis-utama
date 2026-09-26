/**
 * =========================================================================
 * barcode_printer.js - Helper & Modal Cetak Label Barcode Tabung Laboratorium
 * =========================================================================
 * Kompatibel 100% dengan alat medis:
 * 1. Sysmex XP-100 (Hematologi - Tabung EDTA Ungu)
 * 2. Mindray BS-240 (Kimia Darah - Tabung Serum Kuning/Merah/Abu)
 * 3. Arkray Adams A1c Lite HA-8380V (HbA1c HPLC - Tabung EDTA Ungu)
 * 4. Urinalisa (Wadah / Pot Urin)
 * 5. Imunoserologi (Tabung Serum)
 *
 * Mendukung mode:
 * - LABEL PAKET (Hanya sebut bahasa medis/mesin, misal KIMIA atau MINDRAY, bersih tanpa teks berjejal)
 * - LABEL PERSATUAN (Sebut bahasa medis/mesin + 1 nama tes spesifik, misal: KIMIA + Leukosit)
 * - Cetak langsung via Driver Windows (Blueprint ECO 80, 80Label, Xprinter, Zebra, dll.)
 * =========================================================================
 */

const BarcodePrinter = (() => {
  'use strict';

  // Pola biner Code 128 (107 simbol)
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

  // Definisi alat medis, departemen, dan tabung
  const ALAT_MEDIS = {
    MINDRAY: {
      kode: 'MINDRAY',
      namaAlat: 'Mindray BS-240',
      namaMesin: 'MINDRAY',
      bahasaMedis: 'KIMIA',
      tabung: 'Serum (Kuning/Merah/Abu)',
      warnaBadge: '#0284c7'
    },
    SYSMEX: {
      kode: 'SYSMEX',
      namaAlat: 'Sysmex XP-100',
      namaMesin: 'SYSMEX',
      bahasaMedis: 'HEMATOLOGI',
      tabung: 'EDTA (Ungu)',
      warnaBadge: '#7e22ce'
    },
    ARKRAY: {
      kode: 'ARKRAY',
      namaAlat: 'Arkray Adams HA-8380V',
      namaMesin: 'ARKRAY',
      bahasaMedis: 'HBA1C',
      tabung: 'EDTA (Ungu)',
      warnaBadge: '#b45309'
    },
    URIN: {
      kode: 'URIN',
      namaAlat: 'Urine Analyzer',
      namaMesin: 'URIN',
      bahasaMedis: 'URIN',
      tabung: 'Pot Urin',
      warnaBadge: '#059669'
    },
    SEROLOGI: {
      kode: 'SEROLOGI',
      namaAlat: 'Imunoserologi / Rapid',
      namaMesin: 'SEROLOGI',
      bahasaMedis: 'SEROLOGI',
      tabung: 'Serum (Merah)',
      warnaBadge: '#e11d48'
    }
  };

  /**
   * Generator Barcode 1D Code 128 Vektor SVG (100% Offline)
   */
  function buatBarcodeSVG(teks, tinggi = 36, modulWidth = 1.5) {
    if (!teks) teks = '00000000';
    const strTeks = String(teks).trim();
    const codes = [];
    const isNumeric = /^\d+$/.test(strTeks) && strTeks.length % 2 === 0;

    if (isNumeric) {
      codes.push(105); // Start C (numeric pairs - paling padat & optimal untuk tabung 13mm)
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
    let x = 10; // Quiet zone 10 modul agar laser scanner tidak terpotong
    for (const ch of patternStr) {
      const w = parseInt(ch, 10);
      if (isBar) {
        rects.push(`<rect x="${(x * modulWidth).toFixed(1)}" y="0" width="${(w * modulWidth).toFixed(1)}" height="${tinggi}" fill="#000"/>`);
      }
      x += w;
      isBar = !isBar;
    }
    x += 10; // Quiet zone kanan
    const totalW = (x * modulWidth).toFixed(1);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${tinggi}" width="100%" height="100%" preserveAspectRatio="none" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  }

  /**
   * Format nomor lab standar UTAMA: YYMM + 4 digit urut (contoh: 26090026 / 26090462)
   */
  function formatNoLabStandar(rawNoLab, tglStr) {
    if (rawNoLab) {
      const str = String(rawNoLab).trim();
      if (/^\d{8}$/.test(str)) return str;
      const m = str.match(/LAB-(\d{2,4})-(\d+)/i);
      if (m) {
        const yy = m[1].slice(-2);
        const d = tglStr ? new Date(tglStr) : new Date();
        const mm = String(isNaN(d) ? new Date().getMonth() + 1 : d.getMonth() + 1).padStart(2, '0');
        const seq = m[2].padStart(4, '0');
        return `${yy}${mm}${seq}`;
      }
      return str;
    }
    return '00000000';
  }

  /**
   * Hitung umur pasien dalam tahun
   */
  function hitungUmurTahun(pasien, tglReferensi = null) {
    if (pasien?.umur !== undefined && pasien?.umur !== null && pasien?.umur !== '') {
      const u = parseInt(pasien.umur, 10);
      if (!isNaN(u)) return u;
    }
    if (pasien?.tanggal_lahir) {
      const ref = tglReferensi ? new Date(tglReferensi) : new Date();
      const birth = new Date(pasien.tanggal_lahir);
      let age = ref.getFullYear() - birth.getFullYear();
      const m = ref.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? age : 0;
    }
    return null;
  }

  /**
   * Format identitas pasien untuk label tabung spesimen:
   * Baris 1: Sapaan & Nama Pasien (misal: "Ny. ENDANG SUPRIYATI" atau "Ny. LISTYOWATI")
   * Baris 2: Gender & Usia (misal: "(P) / 54 Th" atau "(L) / 42 Th")
   * Teks Lengkap: "Ny. ENDANG SUPRIYATI (P) / 54 Th"
   */
  function formatIdentitasPasien(pasien, tglReferensi = null) {
    let nama = (pasien?.nama || '').trim();
    const jk = (pasien?.jenis_kelamin || '').toUpperCase();
    const isL = jk.startsWith('L') || jk === 'PRIA' || jk === 'M';
    const isP = jk.startsWith('P') || jk === 'WANITA' || jk === 'F';
    const jkKode = isL ? 'L' : isP ? 'P' : '';

    const umurNum = hitungUmurTahun(pasien, tglReferensi);
    const umurStr = umurNum !== null ? `${umurNum} Th` : '';

    const hasTitle = /^(Tn\.|Ny\.|Nn\.|An\.|Sdr\.|Sdri\.|By\.|dr\.|drg\.)\s+/i.test(nama);
    if (!hasTitle) {
      const u = umurNum !== null ? umurNum : 30;
      let sapaan = 'Tn.';
      if (u < 12) sapaan = 'An.';
      else if (isP) sapaan = 'Ny.';
      else sapaan = 'Tn.';
      nama = `${sapaan} ${nama}`;
    }

    let infoBaris2 = '';
    if (jkKode && umurStr) {
      infoBaris2 = `(${jkKode}) / ${umurStr}`;
    } else if (jkKode) {
      infoBaris2 = `(${jkKode})`;
    } else if (umurStr) {
      infoBaris2 = `${umurStr}`;
    }

    const teksLengkap = infoBaris2 ? `${nama} ${infoBaris2}` : nama;

    return {
      namaHanya: nama,
      infoBaris2: infoBaris2,
      teksLengkap: teksLengkap
    };
  }

  function formatNamaLabel(pasien, tglReferensi = null) {
    return formatIdentitasPasien(pasien, tglReferensi).teksLengkap;
  }

  /**
   * Klasifikasikan item pemeriksaan pasien ke masing-masing alat medis
   */
  function kelompokkanItemPerAlat(hasilList) {
    const grup = {
      MINDRAY: [],
      SYSMEX: [],
      ARKRAY: [],
      URIN: [],
      SEROLOGI: []
    };

    (hasilList || []).forEach(h => {
      const ref = h.ref || {};
      const klp = (ref.kelompok || '').toUpperCase();
      const nm = (ref.nama || '').toUpperCase();
      const bc = (ref.barcode || '').toUpperCase();
      const itemData = { nama: ref.nama || 'Pemeriksaan', kode: ref.kode || '' };

      if (nm.includes('HBA1C') || klp.includes('HBA1C')) {
        grup.ARKRAY.push(itemData);
      } else if (klp.includes('HEMATOLOGI') || nm.includes('DARAH LENGKAP') || nm.includes('HEMOGLOBIN') || nm.includes('LEUKOSIT') || nm.includes('TROMBOSIT') || bc === 'H') {
        grup.SYSMEX.push(itemData);
      } else if (klp.includes('KIMIA') || nm.includes('GLUKOSA') || nm.includes('KOLESTEROL') || nm.includes('SGOT') || nm.includes('SGPT') || nm.includes('ASAM URAT') || nm.includes('UREUM') || nm.includes('KREATININ') || nm.includes('TRIGLISERIDA') || bc === 'K') {
        grup.MINDRAY.push(itemData);
      } else if (klp.includes('URIN') || nm.includes('URIN') || bc === 'UL') {
        grup.URIN.push(itemData);
      } else if (klp.includes('IMUNO') || klp.includes('SEROLOGI') || bc === 'I' || bc === 'W') {
        grup.SEROLOGI.push(itemData);
      } else {
        grup.MINDRAY.push(itemData);
      }
    });

    return grup;
  }

  /**
   * Cetak label langsung melalui driver Windows menggunakan iframe terisolasi
   * Dioptimalkan khusus printer thermal label Blueprint ECO 80 (40x30 mm)
   * Formula CSS Bebas Blank Page:
   * - @page { size: 40mm 30mm; margin: 0 !important; }
   * - html, body { width: 40mm; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: hidden; }
   * - .label-tube { height: 27.5mm; max-height: 27.5mm; box-sizing: border-box; overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
   * - page-break HANYA di antara label: :not(:last-child) { page-break-after: always; break-after: page; }
   */
  function cetakWindows(labels, opsi = {}) {
    let iframe = document.getElementById('print-iframe-tube-barcode');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe-tube-barcode';
      iframe.setAttribute('aria-hidden', 'true');
      Object.assign(iframe.style, {
        position: 'fixed', right: '0', bottom: '0',
        width: '0', height: '0', border: '0', opacity: '0', pointerEvents: 'none', zIndex: '-1'
      });
      document.body.appendChild(iframe);
    }

    const pagesHtml = labels.map(lbl => {
      let nama = (lbl.namaPasien || '').trim();
      let infoBaris2 = (lbl.infoBaris2 || lbl.infoPasien || '').trim();

      if (!infoBaris2) {
        // Coba pisahkan otomatis jika namaPasien mengandung format "Nama (P) / 54 Th"
        const m = nama.match(/^(.*?)\s*(\((?:L|P|M|F)[^)]*\)(?:\s*\/\s*\d+\s*Th)?|\((?:L|P|M|F)\/\d+\s*Th\))$/i);
        if (m) {
          nama = m[1].trim();
          infoBaris2 = m[2].trim();
        }
      }

      // Barcode SVG: viewBox 38 modul tinggi dengan preserveAspectRatio="none"
      const svg = buatBarcodeSVG(lbl.idBarcode, 38, 1.5);

      return `
        <div class="label-tube">
          <div class="col-id">${UI.esc(lbl.idBarcode)}</div>
          <div class="col-center">
            <div class="barcode-wrap">${svg}</div>
            <div class="patient-name">${UI.esc(nama)}</div>
            ${infoBaris2 ? `<div class="patient-sub">${UI.esc(infoBaris2)}</div>` : ''}
            ${lbl.subInfo ? `<div class="single-test-name">${UI.esc(lbl.subInfo)}</div>` : ''}
          </div>
          <div class="col-dept">${UI.esc(lbl.labelKanan || 'KIMIA')}</div>
        </div>
      `;
    }).join('');

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title></title>
        <style>
          @page {
            size: auto;
            margin: 0mm !important;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff;
            color: #000;
            font-family: 'JetBrains Mono', Consolas, Arial, sans-serif;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            @page {
              size: auto;
              margin: 0mm !important;
            }
            html, body {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          .label-tube {
            width: 100% !important;
            max-width: 72mm !important;
            height: 28mm !important;
            max-height: 28mm !important;
            margin: 0 auto !important;
            padding: 1mm 2mm !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .label-tube:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          .label-tube:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .col-id {
            width: 5mm;
            min-width: 5mm;
            height: 26mm;
            display: flex;
            align-items: center;
            justify-content: center;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-size: 7.5pt;
            font-weight: 700;
            line-height: 1;
            letter-spacing: 0.2px;
            white-space: nowrap;
            text-align: center;
            color: #000;
            flex-shrink: 0;
            margin-left: 1mm;
          }
          .col-center {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 0 1.5mm;
            overflow: hidden;
            width: 100%;
          }
          .barcode-wrap {
            width: 100%;
            max-width: 48mm;
            height: 13mm;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin: 0 auto;
          }
          .barcode-wrap svg {
            width: 100%;
            height: 100%;
            display: block;
            margin: 0 auto;
          }
          .patient-name {
            margin-top: 0.5mm;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.15;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            max-width: 100%;
            letter-spacing: -0.1px;
            color: #000;
          }
          .patient-sub {
            margin-top: 0.3mm;
            font-size: 9.5px;
            font-weight: 700;
            line-height: 1.1;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            max-width: 100%;
            letter-spacing: -0.1px;
            color: #000;
          }
          .single-test-name {
            font-size: 8.5px;
            font-weight: 700;
            color: #000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
            max-width: 100%;
            line-height: 1.0;
            margin-top: 0.2mm;
          }
          .col-dept {
            width: 5.5mm;
            min-width: 5.5mm;
            height: 26mm;
            display: flex;
            align-items: center;
            justify-content: center;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-size: 7.5pt;
            font-weight: 700;
            line-height: 1;
            letter-spacing: 0.2px;
            white-space: nowrap;
            text-align: center;
            color: #000;
            flex-shrink: 0;
            margin-right: 2.5mm;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Gagal mencetak label barcode via driver Windows:', e);
      }
    }, 200);
  }

  /**
   * Cetak otomatis langsung tanpa pop-up modal (Khusus Blueprint ECO 80 - 40x30 mm)
   * Otomatis membagi label sesuai jenis pemeriksaan yang ada:
   * Contoh: Darah Lengkap + Kimia + Urin -> langsung keluar 3 label (HEMATOLOGI, KIMIA, URIN)
   */
  async function cetakOtomatis(p, opsi = {}) {
    if (!p) {
      UI.toast('Data pemeriksaan laboratorium tidak ditemukan.', 'err');
      return;
    }

    let hasilList = p.hasil || [];
    if (!hasilList.length && p.id && typeof DB !== 'undefined' && DB.sb) {
      try {
        const { data: h } = await DB.sb.from('lab_hasil')
          .select('*, ref:lab_id(id,kode,nama,kelompok,barcode)')
          .eq('permintaan_id', p.id);
        if (h && h.length) hasilList = h;
      } catch (err) {
        console.warn('Gagal memuat rincian hasil untuk barcode:', err);
      }
    }

    const pasien = p.pasien || {};
    const tgl = p.diminta_pada || p.tanggal || null;
    const noLab = p.no_lab || '';
    const idStandar = formatNoLabStandar(noLab, tgl);
    const idt = formatIdentitasPasien(pasien, tgl);

    // Kelompokkan per alat medis / tabung
    const itemPerAlat = kelompokkanItemPerAlat(hasilList);
    const URUTAN_ALAT = ['SYSMEX', 'MINDRAY', 'ARKRAY', 'URIN', 'SEROLOGI'];
    const alatAktifList = URUTAN_ALAT.filter(k => (itemPerAlat[k] || []).length > 0);

    // Jika belum ada tes terdeteksi, cetak 1 label default
    const listTabung = alatAktifList.length ? alatAktifList : ['MINDRAY'];

    const labels = [];
    listTabung.forEach(k => {
      const info = ALAT_MEDIS[k] || ALAT_MEDIS.MINDRAY;
      labels.push({
        idBarcode: idStandar,
        namaPasien: idt.namaHanya,
        infoPasien: idt.infoBaris2,
        labelKanan: info.bahasaMedis,
        subInfo: ''
      });
    });

    // Preset cetak Blueprint ECO 80 (40x30 mm)
    cetakWindows(labels, { ukuran: '40x30', ...opsi });

    const namaTabung = listTabung.map(k => ALAT_MEDIS[k]?.bahasaMedis || k).join(', ');
    UI.toast(`Mencetak ${labels.length} label tabung (${namaTabung}) ke Blueprint ECO 80...`, 'ok');
  }

  /**
   * Buka Modal Interaktif Cetak Barcode Spesimen
   */
  async function bukaModal(p) {
    if (!p) {
      UI.toast('Data pemeriksaan laboratorium tidak ditemukan.', 'err');
      return;
    }

    const pasien = p.pasien || {};
    const tgl = p.diminta_pada || p.tanggal || null;
    const noLab = p.no_lab || '';
    const idStandar = formatNoLabStandar(noLab, tgl);
    const idt = formatIdentitasPasien(pasien, tgl);
    const namaDefault = idt.teksLengkap;
    const hasilList = p.hasil || [];

    // Kelompokkan per alat medis
    const itemPerAlat = kelompokkanItemPerAlat(hasilList);
    const alatAktifList = Object.keys(ALAT_MEDIS).filter(k => (itemPerAlat[k] || []).length > 0);
    const listPilihan = alatAktifList.length ? alatAktifList : ['MINDRAY', 'SYSMEX'];

    let alatTerpilih = listPilihan[0] || 'MINDRAY';
    let tipeCetak = 'paket'; // 'paket' (kolektif bersih) atau 'satuan' (1 tes spesifik)
    let formatTeksSamping = 'medis'; // 'medis' (KIMIA, HEMATOLOGI) atau 'mesin' (MINDRAY, SYSMEX)
    let tesSatuanTerpilih = (itemPerAlat[alatTerpilih] && itemPerAlat[alatTerpilih][0]) ? itemPerAlat[alatTerpilih][0].nama : '';
    let idBarcodeAktif = idStandar;
    let namaLabelAktif = namaDefault;
    let ukuranAktif = localStorage.getItem('lab_barcode_paper_size') || '40x30';
    let qtyAktif = 1;

    // Helper teks sisi kanan
    const dapatkanLabelKanan = (alatKey) => {
      const info = ALAT_MEDIS[alatKey] || ALAT_MEDIS.MINDRAY;
      return formatTeksSamping === 'mesin' ? info.namaMesin : info.bahasaMedis;
    };

    const modalHtml = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <!-- PRATINJAU REALISTIS TABUNG SPESIMEN -->
        <div style="background:#0f172a; padding:14px; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:inset 0 2px 4px rgba(0,0,0,0.4);">
          <div style="color:#94a3b8; font-size:11px; margin-bottom:8px; display:flex; justify-content:space-between; width:100%; max-width:260px;">
            <span>Pratinjau Label Tabung Fisik</span>
            <span id="prevUkuranInfo" style="color:#38bdf8;">${ukuranAktif} mm</span>
          </div>
          
          <div id="lblPrevBox" style="width:250px; height:100px; background:#fff; border-radius:4px; box-shadow:0 8px 16px rgba(0,0,0,0.3); display:flex; flex-direction:row; align-items:center; justify-content:space-between; padding:6px 8px; box-sizing:border-box; color:#000; font-family:'JetBrains Mono', Consolas, Arial, sans-serif; user-select:none;">
            <!-- Kiri Vertikal: ID Barcode -->
            <div id="lblPrevId" style="width:24px; height:88px; display:flex; align-items:center; justify-content:center; writing-mode:vertical-rl; transform:rotate(180deg); font-size:11px; font-weight:700; letter-spacing:0.5px; white-space:nowrap; text-align:center;">
              ${UI.esc(idStandar)}
            </div>

            <!-- Tengah: Barcode + Nama Pasien + Gender/Usia + (Opsional 1 Tes Satuan) -->
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 6px; overflow:hidden;">
              <div id="lblPrevSvg" style="width:100%; height:48px; display:flex; align-items:center; justify-content:center;">
                ${buatBarcodeSVG(idStandar, 48, 2.0)}
              </div>
              <div id="lblPrevName" style="margin-top:2px; font-size:10px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; max-width:180px;">
                ${UI.esc(idt.namaHanya)}
              </div>
              <div id="lblPrevSub" style="font-size:9.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; max-width:180px;">
                ${UI.esc(idt.infoBaris2)}
              </div>
              <div id="lblPrevSingleTest" style="font-size:9px; font-weight:700; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; max-width:180px; display:none;">
                <!-- Tes Satuan jika dipilih -->
              </div>
            </div>

            <!-- Kanan Vertikal: Bahasa Medis (KIMIA) atau Nama Mesin (MINDRAY) -->
            <div id="lblPrevDept" style="width:26px; height:88px; display:flex; align-items:center; justify-content:center; writing-mode:vertical-rl; transform:rotate(180deg); font-size:11px; font-weight:800; letter-spacing:0.5px; white-space:nowrap; text-align:center;">
              ${UI.esc(dapatkanLabelKanan(alatTerpilih))}
            </div>
          </div>
          
          <div style="color:#64748b; font-size:10.5px; margin-top:8px; text-align:center;">
            Driver Windows terhubung langsung via Driver Windows (Blueprint / Thermal USB)
          </div>
        </div>

        <!-- 1. PILIH ALAT MEDIS -->
        <div>
          <label style="font-weight:700; font-size:11.5px; display:block; margin-bottom:6px; color:#1e293b;">
            1. Pilih Target Alat Medis &amp; Tabung:
          </label>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:8px;">
            ${Object.keys(ALAT_MEDIS).map(k => {
              const info = ALAT_MEDIS[k];
              const adaItem = (itemPerAlat[k] || []).length;
              const aktif = k === alatTerpilih;
              return `
                <div class="card-alat" data-alat="${k}" style="border:1.5px solid ${aktif ? '#0f766e' : '#cbd5e1'}; background:${aktif ? '#f0fdfa' : '#fff'}; border-radius:6px; padding:8px 10px; cursor:pointer; transition:all .15s ease;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <b style="font-size:12px; color:${aktif ? '#0f766e' : '#1e293b'};">${UI.esc(info.namaAlat)}</b>
                    ${adaItem ? `<span style="background:${info.warnaBadge}; color:#fff; font-size:9.5px; padding:1px 6px; border-radius:10px; font-weight:700;">${adaItem} tes</span>` : ''}
                  </div>
                  <div style="font-size:11px; color:#475569; margin-top:3px;">
                    Bahasa: <b style="color:#0f766e;">${UI.esc(info.bahasaMedis)}</b> | Tabung: ${UI.esc(info.tabung)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 2. PILIH CAKUPAN CETAK: PAKET (BERSIH) VS 1 TES PERSATUAN -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 12px;">
          <label style="font-weight:700; font-size:11.5px; display:block; margin-bottom:8px; color:#1e293b;">
            2. Cakupan Label untuk Tabung Ini:
          </label>
          
          <div style="display:flex; gap:16px; margin-bottom:10px; font-size:12px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-weight:600;">
              <input type="radio" name="rbTipeCetak" value="paket" checked>
              <span>Label Paket / Kolektif Alat (Bersih, hanya sebut <b id="lblTxtContoh">${dapatkanLabelKanan(alatTerpilih)}</b>)</span>
            </label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-weight:600;">
              <input type="radio" name="rbTipeCetak" value="satuan">
              <span>Label 1 Tes Persatuan (Sebut mesin/medis + 1 nama tes spesifik)</span>
            </label>
          </div>

          <!-- OPSI PILIH 1 TES PERSATUAN -->
          <div id="boxPilihTesSatuan" style="display:none; border-top:1px solid #cbd5e1; padding-top:8px;">
            <div style="font-size:11px; color:#475569; margin-bottom:6px; font-weight:600;">
              Klik salah satu tes di bawah untuk dicetak pada label tabung ini:
            </div>
            <div id="listChipTes" style="display:flex; flex-wrap:wrap; gap:6px;">
              <!-- Chips tes yang termasuk dalam alat terpilih -->
            </div>
          </div>
        </div>

        <!-- 3. PILIHAN BAHASA KANAN & FORMAT DATA -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px;">
          <div>
            <label style="font-weight:600; display:block; margin-bottom:4px;">Teks Sisi Kanan Label</label>
            <div style="display:flex; gap:12px; margin-bottom:6px;">
              <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                <input type="radio" name="rbBahasa" value="medis" checked>
                <span>Bahasa Medis (<b id="lblRadioMedis">${ALAT_MEDIS[alatTerpilih].bahasaMedis}</b>)</span>
              </label>
              <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                <input type="radio" name="rbBahasa" value="mesin">
                <span>Nama Mesin (<b id="lblRadioMesin">${ALAT_MEDIS[alatTerpilih].namaMesin}</b>)</span>
              </label>
            </div>
            
            <label style="font-weight:600; display:block; margin-bottom:4px; margin-top:8px;">Format Nomor Barcode</label>
            <select id="selFormatId" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px; margin-bottom:4px;">
              <option value="standar" selected>Standar Alat Medis (${idStandar}) — Direkomendasikan</option>
              <option value="nolab">Nomor Lab Penuh (${UI.esc(noLab)})</option>
              <option value="custom">Input Manual ID Barcode...</option>
            </select>
            <input type="text" id="inpIdCustom" value="${UI.esc(idStandar)}" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px;">
          </div>

          <div>
            <label style="font-weight:600; display:block; margin-bottom:4px;">Nama Pasien pada Label</label>
            <input type="text" id="inpNamaLabel" value="${UI.esc(namaDefault)}" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px; margin-bottom:8px;">

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">Ukuran Kertas Thermal</label>
                <select id="selUkuran" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px;">
                  <option value="50x20" ${ukuranAktif === '50x20' ? 'selected' : ''}>50 × 20 mm (Tabung Standar)</option>
                  <option value="40x30" ${ukuranAktif === '40x30' ? 'selected' : ''}>40 × 30 mm (Blueprint ECO 80)</option>
                  <option value="50x25" ${ukuranAktif === '50x25' ? 'selected' : ''}>50 × 25 mm</option>
                  <option value="40x20" ${ukuranAktif === '40x20' ? 'selected' : ''}>40 × 20 mm</option>
                </select>
              </div>
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">Jumlah Salinan (Copy)</label>
                <input type="number" id="inpQty" value="1" min="1" max="10" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px;">
              </div>
            </div>
          </div>
        </div>

        ${alatAktifList.length > 1 ? `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px 14px; font-size:11.5px; color:#166534; display:flex; align-items:center; justify-content:space-between;">
            <div>
              <b>Cetak Cepat Semua Tabung Paket Pasien:</b>
              <div>${alatAktifList.map(k => ALAT_MEDIS[k]?.namaAlat).join(', ')}</div>
            </div>
            <button type="button" id="btnCetakSemuaPaket" class="btn btn-sm" style="background:#16a34a; color:#fff; font-weight:700; border:none; padding:6px 14px; border-radius:4px; cursor:pointer;">
              Cetak Semua Tabung Paket (${alatAktifList.length} Label)
            </button>
          </div>
        ` : ''}
      </div>
    `;

    await UI.modal({
      judul: 'Cetak Barcode Tabung Spesimen Alat Medis',
      lebar: true,
      isi: modalHtml,
      siap: (b, tutup) => {
        const lblId = b.querySelector('#lblPrevId');
        const lblSvg = b.querySelector('#lblPrevSvg');
        const lblName = b.querySelector('#lblPrevName');
        const lblSub = b.querySelector('#lblPrevSub');
        const lblSingleTest = b.querySelector('#lblPrevSingleTest');
        const lblDept = b.querySelector('#lblPrevDept');
        const prevUkuranInfo = b.querySelector('#prevUkuranInfo');
        const lblTxtContoh = b.querySelector('#lblTxtContoh');
        const lblRadioMedis = b.querySelector('#lblRadioMedis');
        const lblRadioMesin = b.querySelector('#lblRadioMesin');
        const boxPilihTesSatuan = b.querySelector('#boxPilihTesSatuan');
        const listChipTes = b.querySelector('#listChipTes');

        const renderChipTes = () => {
          const items = itemPerAlat[alatTerpilih] || [];
          if (!items.length) {
            listChipTes.innerHTML = '<span style="color:#64748b; font-style:italic; font-size:11px;">Tidak ada item tes khusus pada alat ini.</span>';
            tesSatuanTerpilih = '';
            return;
          }
          if (!tesSatuanTerpilih || !items.some(x => x.nama === tesSatuanTerpilih)) {
            tesSatuanTerpilih = items[0].nama;
          }
          listChipTes.innerHTML = items.map(it => {
            const aktif = it.nama === tesSatuanTerpilih;
            return `
              <button type="button" class="chip-item-tes" data-nama="${UI.esc(it.nama)}" style="font-size:11px; padding:3px 8px; border-radius:4px; border:1px solid ${aktif ? '#0f766e' : '#cbd5e1'}; background:${aktif ? '#0f766e' : '#fff'}; color:${aktif ? '#fff' : '#1e293b'}; font-weight:${aktif ? '700' : '500'}; cursor:pointer;">
                ${UI.esc(it.nama)}
              </button>
            `;
          }).join('');

          listChipTes.querySelectorAll('.chip-item-tes').forEach(btn => {
            btn.onclick = () => {
              tesSatuanTerpilih = btn.dataset.nama;
              renderChipTes();
              updatePreview();
            };
          });
        };

        const updatePreview = () => {
          lblId.textContent = idBarcodeAktif;
          lblSvg.innerHTML = buatBarcodeSVG(idBarcodeAktif, tipeCetak === 'satuan' ? 42 : 48, 2.0);

          let nHanya = namaLabelAktif;
          let iSub = idt.infoBaris2;
          const m = namaLabelAktif.match(/^(.*?)\s*(\((?:L|P|M|F)[^)]*\)(?:\s*\/\s*\d+\s*Th)?|\((?:L|P|M|F)\/\d+\s*Th\))$/i);
          if (m) {
            nHanya = m[1].trim();
            iSub = m[2].trim();
          }
          lblName.textContent = nHanya;
          if (lblSub) lblSub.textContent = iSub;

          const kanan = dapatkanLabelKanan(alatTerpilih);
          lblDept.textContent = kanan;
          lblTxtContoh.textContent = kanan;
          lblRadioMedis.textContent = ALAT_MEDIS[alatTerpilih].bahasaMedis;
          lblRadioMesin.textContent = ALAT_MEDIS[alatTerpilih].namaMesin;
          prevUkuranInfo.textContent = ukuranAktif + ' mm';

          if (tipeCetak === 'satuan' && tesSatuanTerpilih) {
            lblSingleTest.style.display = 'block';
            lblSingleTest.textContent = tesSatuanTerpilih;
          } else {
            lblSingleTest.style.display = 'none';
            lblSingleTest.textContent = '';
          }
        };

        // Pilihan Alat Card
        b.querySelectorAll('.card-alat').forEach(card => {
          card.onclick = () => {
            b.querySelectorAll('.card-alat').forEach(c => {
              c.style.border = '1.5px solid #cbd5e1';
              c.style.background = '#fff';
            });
            card.style.border = '1.5px solid #0f766e';
            card.style.background = '#f0fdfa';
            alatTerpilih = card.dataset.alat;
            renderChipTes();
            updatePreview();
          };
        });

        // Radio Tipe Cetak: Paket vs Satuan
        b.querySelectorAll('input[name="rbTipeCetak"]').forEach(rb => {
          rb.onchange = () => {
            tipeCetak = rb.value;
            if (tipeCetak === 'satuan') {
              boxPilihTesSatuan.style.display = 'block';
              renderChipTes();
            } else {
              boxPilihTesSatuan.style.display = 'none';
            }
            updatePreview();
          };
        });

        // Radio Bahasa Teks Samping: Medis vs Mesin
        b.querySelectorAll('input[name="rbBahasa"]').forEach(rb => {
          rb.onchange = () => {
            formatTeksSamping = rb.value;
            updatePreview();
          };
        });

        // Format ID Barcode
        b.querySelector('#selFormatId').onchange = (e) => {
          const val = e.target.value;
          if (val === 'standar') {
            idBarcodeAktif = idStandar;
            b.querySelector('#inpIdCustom').value = idStandar;
          } else if (val === 'nolab') {
            idBarcodeAktif = noLab;
            b.querySelector('#inpIdCustom').value = noLab;
          }
          updatePreview();
        };

        b.querySelector('#inpIdCustom').oninput = (e) => {
          idBarcodeAktif = e.target.value.trim() || idStandar;
          updatePreview();
        };

        b.querySelector('#inpNamaLabel').oninput = (e) => {
          namaLabelAktif = e.target.value.trim() || namaDefault;
          updatePreview();
        };

        b.querySelector('#selUkuran').onchange = (e) => {
          ukuranAktif = e.target.value;
          localStorage.setItem('lab_barcode_paper_size', ukuranAktif);
          updatePreview();
        };

        b.querySelector('#inpQty').oninput = (e) => {
          qtyAktif = Math.max(1, parseInt(e.target.value, 10) || 1);
        };

        // Tombol Cetak Semua Tabung Paket Sekaligus (Bersih)
        const btnSemua = b.querySelector('#btnCetakSemuaPaket');
        if (btnSemua) {
          btnSemua.onclick = () => {
            const allLabels = [];
            alatAktifList.forEach(k => {
              const kanan = formatTeksSamping === 'mesin' ? ALAT_MEDIS[k].namaMesin : ALAT_MEDIS[k].bahasaMedis;
              for (let q = 0; q < qtyAktif; q++) {
                allLabels.push({
                  idBarcode: idBarcodeAktif,
                  namaPasien: namaLabelAktif,
                  infoBaris2: (b.querySelector('#lblPrevSub')?.textContent || '').trim(),
                  labelKanan: kanan,
                  subInfo: '' // Paket bersih tanpa deretan teks
                });
              }
            });
            cetakWindows(allLabels, { ukuran: ukuranAktif });
            UI.toast(`Mencetak ${allLabels.length} label paket tabung...`, 'info');
            tutup(true);
          };
        }

        renderChipTes();
        updatePreview();
      },
      tombol: [
        { teks: 'Tutup', nilai: null },
        {
          teks: 'Cetak Label Ini',
          kelas: 'btn-primary',
          aksi: () => {
            const kanan = dapatkanLabelKanan(alatTerpilih);
            const sub = (tipeCetak === 'satuan' && tesSatuanTerpilih) ? tesSatuanTerpilih : '';
            const subText = (b.querySelector('#lblPrevSub')?.textContent || '').trim();
            const labels = [];
            for (let q = 0; q < qtyAktif; q++) {
              labels.push({
                idBarcode: idBarcodeAktif,
                namaPasien: namaLabelAktif,
                infoBaris2: subText,
                labelKanan: kanan,
                subInfo: sub
              });
            }
            cetakWindows(labels, { ukuran: ukuranAktif });
            const ket = sub ? `${kanan} (${sub})` : kanan;
            UI.toast(`Mencetak ${labels.length} label untuk ${ket}...`, 'info');
            return true;
          }
        }
      ]
    });
  }

  return {
    ALAT_MEDIS,
    buatBarcodeSVG,
    formatNoLabStandar,
    formatNamaLabel,
    formatIdentitasPasien,
    kelompokkanItemPerAlat,
    cetakWindows,
    cetakOtomatis,
    bukaModal
  };
})();

// Dukungan module & global browser window
if (typeof window !== 'undefined') {
  window.BarcodePrinter = BarcodePrinter;
}
