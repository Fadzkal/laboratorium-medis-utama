/* =====================================================================
   LIS & INTEGRASI ALAT — Modul Diagnostik, Troubleshooting, & Monitoring
   Alat Laboratorium Medis (Mindray BS-240 & Sysmex XP-100)
   Khusus Role Master
   ===================================================================== */
const LisDebug = (() => {
  'use strict';

  // Endpoint REST API LIS Bridge lokal di komputer laboratorium
  const BRIDGE_HOST = 'http://127.0.0.1:7119';

  // Kamus alias kode alat (sebagai fallback bila Lab.MAP_KODE_ALAT belum dimuat)
  const FALLBACK_MAP_KODE_ALAT = {
    'GLU-S': ['Glukosa Darah Sewaktu', 'Glukosa Darah Puasa', 'Glukosa Darah 2 Jam PP', 'Glukosa', 'GDS', 'GDP'],
    'GLU': ['Glukosa Darah Sewaktu', 'Glukosa Darah Puasa', 'Glukosa Darah 2 Jam PP', 'Glukosa'],
    'GLUCOSE': ['Glukosa Darah Sewaktu', 'Glukosa Darah Puasa', 'Glukosa Darah 2 Jam PP', 'Glukosa'],
    'TC': ['Cholesterol Total', 'Kolesterol Total'],
    'CHOL': ['Cholesterol Total', 'Kolesterol Total'],
    'TG': ['Trigliserida', 'Triglyceride'],
    'TRIG': ['Trigliserida', 'Triglyceride'],
    'HDL-C': ['Cholesterol HDL', 'HDL Kolesterol'],
    'HDL': ['Cholesterol HDL', 'HDL Kolesterol'],
    'LDL-C': ['Cholesterol LDL', 'LDL Kolesterol'],
    'LDL': ['Cholesterol LDL', 'LDL Kolesterol'],
    'UA': ['Asam Urat', 'Uric Acid'],
    'UREA': ['Ureum', 'Urea', 'BUN'],
    'UREUM': ['Ureum', 'Urea'],
    'CREA-S': ['Creatinin', 'Kreatinin', 'Creatinine'],
    'CREA': ['Creatinin', 'Kreatinin', 'Creatinine'],
    'AST': ['SGOT', 'SGOT (AST)'],
    'SGOT': ['SGOT', 'SGOT (AST)'],
    'ALT': ['SGPT', 'SGPT (ALT)'],
    'SGPT': ['SGPT', 'SGPT (ALT)'],
    'ALB': ['Albumin'],
    'ALBUMIN': ['Albumin'],
    'TP': ['Total Protein', 'Protein Total'],
    'TBIL': ['Bilirubin Total', 'Total Bilirubin'],
    'T-BIL': ['Bilirubin Total', 'Total Bilirubin'],
    'DBIL': ['Bilirubin Direk', 'Direct Bilirubin'],
    'D-BIL': ['Bilirubin Direk', 'Direct Bilirubin'],
    'ALP': ['Alkali Fosfatase', 'Alkaline Phosphatase'],
    'GGT': ['Gamma GT', 'GGT'],
    'CK': ['Creatine Kinase', 'CK'],
    'CK-MB': ['CK-MB', 'CKMB'],
    'AMY': ['Amilase', 'Amylase'],
    'LIP': ['Lipase'],
    'NA': ['Natrium', 'Sodium'],
    'K': ['Kalium', 'Potassium'],
    'CL': ['Klorida', 'Chloride'],
    'CA': ['Kalsium', 'Calcium'],
    'WBC': ['Leukosit', 'Jumlah Sel Leukosit', 'Jumlah Leukosit', 'WBC'],
    'RBC': ['Eritrosit', 'Jumlah Sel Eritrosit', 'Jumlah Eritrosit', 'RBC'],
    'HGB': ['Hemoglobin', 'HB', 'HGB'],
    'HB': ['Hemoglobin', 'HB', 'HGB'],
    'HCT': ['Hematokrit', 'HCT'],
    'PLT': ['Trombosit', 'Jumlah Trombosit', 'PLT'],
    'MCV': ['MCV'],
    'MCH': ['MCH'],
    'MCHC': ['MCHC'],
    'RDW-CV': ['RDW-CV', 'RDW_CV', 'RDW'],
    'RDW-SD': ['RDW-SD', 'RDW_SD'],
    'LYM%': ['Limfosit', 'Lymposit', 'LYM%', 'LYMPH%'],
    'LYMPH%': ['Limfosit', 'Lymposit', 'LYM%', 'LYMPH%'],
    'LYM#': ['Limfosit Absolut', 'LYM#', 'LYMPH#'],
    'LYMPH#': ['Limfosit Absolut', 'LYM#', 'LYMPH#'],
    'NEUT%': ['Neutrofil', 'Segmen', 'GRAN%', 'NEUT%'],
    'NEUT#': ['Neutrofil Absolut', 'NEUT#', 'GRAN#'],
    'GRAN%': ['Neutrofil', 'Segmen', 'GRAN%'],
    'GRAN#': ['Neutrofil Absolut', 'NEUT#', 'GRAN#'],
    'MXD%': ['Monosit', 'MXD%'],
    'MXD#': ['Monosit Absolut', 'MXD#'],
    'PDW': ['PDW'],
    'MPV': ['MPV'],
    'P-LCR': ['P-LCR'],
    'PCT': ['PCT'],
    'LED': ['LED', 'Laju Endap Darah', 'ESR'],
    'ESR': ['LED', 'Laju Endap Darah', 'ESR'],
    'HBA1C': ['HbA 1C', 'HbA1c', 'Hemoglobin A1c']
  };

  // State internal
  let statusBridge = null;
  let daftarLog = [];
  let bufferTerakhir = [];
  let refLabMaster = [];
  let hasilInspeksiAktif = null;
  let timerPolling = null;

  // Mendapatkan peta kamus kode alat
  function ambilMapKode() {
    return (typeof Lab !== 'undefined' && Lab.MAP_KODE_ALAT)
      ? Lab.MAP_KODE_ALAT
      : FALLBACK_MAP_KODE_ALAT;
  }

  // Menambahkan log ke buffer internal
  function tambahLog(tipe, pesan, payload = null) {
    const d = new Date();
    const waktu = d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
    daftarLog.unshift({ waktu, tipe, pesan, payload });
    if (daftarLog.length > 100) daftarLog.pop();

    const wadahConsole = document.getElementById('wadahLogConsole');
    if (wadahConsole) renderLogConsole(wadahConsole);
  }

  // Membersihkan log
  function bersihkanLog() {
    daftarLog = [];
    const wadahConsole = document.getElementById('wadahLogConsole');
    if (wadahConsole) renderLogConsole(wadahConsole);
    UI.toast('Riwayat log berhasil dibersihkan.', 'ok');
  }

  // Memeriksa status listener bridge lokal
  async function periksaStatusListener() {
    const btnCek = document.getElementById('btnCekListener');
    if (btnCek) {
      btnCek.disabled = true;
      btnCek.innerHTML = `${UI.ikon('ulang', 15)} Memeriksa...`;
    }

    tambahLog('INFO', 'Melakukan ping ke LIS Bridge Service (http://127.0.0.1:7119/api/status)...');

    try {
      const c = new AbortController();
      const tid = setTimeout(() => c.abort(), 2500);
      const res = await fetch(`${BRIDGE_HOST}/api/status`, {
        method: 'GET',
        signal: c.signal
      });
      clearTimeout(tid);

      if (res.ok) {
        const j = await res.json();
        statusBridge = j;
        tambahLog('SUCCESS', `LIS Bridge ONLINE. Mindray: Port 7118, Sysmex: Port 8000, Total Buffer: ${j.total_buffer || 0}`, j);
        UI.toast('LIS Bridge terhubung dan aktif.', 'ok');
      } else {
        statusBridge = { status: 'OFFLINE', error: `HTTP ${res.status}: ${res.statusText}` };
        tambahLog('WARN', `LIS Bridge merespons kode HTTP ${res.status}`);
        UI.toast(`LIS Bridge merespons error ${res.status}`, 'warn');
      }
    } catch (err) {
      statusBridge = { status: 'OFFLINE', error: err.message || 'Koneksi ditolak / Service belum aktif' };
      tambahLog('ERROR', `Gagal terhubung ke LIS Bridge pada 127.0.0.1:7119: ${err.message || 'Connection refused'}. Pastikan jalankan_bridge.bat aktif.`);
      UI.toast('LIS Bridge lokal offline / tidak terjangkau.', 'err');
    }

    // Ambil juga 20 buffer terakhir jika bridge online
    if (statusBridge && statusBridge.status === 'ONLINE') {
      try {
        const resBuf = await fetch(`${BRIDGE_HOST}/api/terakhir`);
        if (resBuf.ok) {
          const jBuf = await resBuf.json();
          bufferTerakhir = (jBuf && jBuf.data) ? jBuf.data : [];
          tambahLog('INFO', `Berhasil memuat ${bufferTerakhir.length} rekaman riwayat buffer sampel dari bridge.`);
        }
      } catch (_) {}
    }

    perbaruiUIStatus();

    if (btnCek) {
      btnCek.disabled = false;
      btnCek.innerHTML = `${UI.ikon('ulang', 15)} Cek Koneksi Listener`;
    }
  }

  // Memperbarui UI kartu status listener
  function perbaruiUIStatus() {
    const boxMindray = document.getElementById('statusMindrayCard');
    const boxSysmex = document.getElementById('statusSysmexCard');
    const boxBridge = document.getElementById('statusBridgeCard');
    const boxRiwayat = document.getElementById('wadahTabelBuffer');

    const isOnline = statusBridge && statusBridge.status === 'ONLINE';
    const listener = statusBridge?.listener || {};
    const mindrayInfo = listener.mindray || {};
    const sysmexInfo = listener.sysmex || {};

    if (boxMindray) {
      const isAktif = isOnline && mindrayInfo.status === 'AKTIF';
      const badgeWarna = isAktif ? '#ecfdf5' : '#fef2f2';
      const teksWarna = isAktif ? '#065f46' : '#991b1b';
      const borderWarna = isAktif ? '#a7f3d0' : '#fecaca';
      const statusTeks = isAktif ? 'ONLINE (Port 7118)' : (isOnline ? (mindrayInfo.status || 'OFFLINE') : 'OFFLINE');
      const pesan = mindrayInfo.pesan_terakhir || (isOnline ? 'Standby menunggu transmisi MLLP' : 'Service bridge belum aktif');

      boxMindray.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <div style="font-weight:700; font-size:14px; color:#0f172a;">Mindray BS-240</div>
            <div style="font-size:11px; color:#64748b;">Kimia Darah &amp; Serologi</div>
          </div>
          <span class="badge" style="background:${badgeWarna}; color:${teksWarna}; border:1px solid ${borderWarna}; font-weight:700; font-size:11px;">
            ${UI.esc(statusTeks)}
          </span>
        </div>
        <div style="font-size:11px; color:#334155; line-height:1.4;">
          <div><b>Protokol:</b> HL7 Standard v2.3.1 (MLLP)</div>
          <div><b>Port TCP:</b> 7118 (Socket Server)</div>
          <div style="margin-top:4px; font-size:10.5px; color:#64748b; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
            <b>Pesan:</b> ${UI.esc(pesan)}
          </div>
        </div>
      `;
    }

    if (boxSysmex) {
      const isAktif = isOnline && sysmexInfo.status === 'AKTIF';
      const badgeWarna = isAktif ? '#ecfdf5' : '#fef2f2';
      const teksWarna = isAktif ? '#065f46' : '#991b1b';
      const borderWarna = isAktif ? '#a7f3d0' : '#fecaca';
      const statusTeks = isAktif ? 'ONLINE (Port 8000)' : (isOnline ? (sysmexInfo.status || 'OFFLINE') : 'OFFLINE');
      const pesan = sysmexInfo.pesan_terakhir || (isOnline ? 'Standby menunggu frame ASTM' : 'Service bridge belum aktif');

      boxSysmex.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <div style="font-weight:700; font-size:14px; color:#0f172a;">Sysmex XP-100</div>
            <div style="font-size:11px; color:#64748b;">Hematologi Lengkap</div>
          </div>
          <span class="badge" style="background:${badgeWarna}; color:${teksWarna}; border:1px solid ${borderWarna}; font-weight:700; font-size:11px;">
            ${UI.esc(statusTeks)}
          </span>
        </div>
        <div style="font-size:11px; color:#334155; line-height:1.4;">
          <div><b>Protokol:</b> ASTM E1381 / E1394</div>
          <div><b>Port TCP:</b> 8000 (Serial / LAN Bridge)</div>
          <div style="margin-top:4px; font-size:10.5px; color:#64748b; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
            <b>Pesan:</b> ${UI.esc(pesan)}
          </div>
        </div>
      `;
    }

    if (boxBridge) {
      const badgeWarna = isOnline ? '#ecfdf5' : '#fef2f2';
      const teksWarna = isOnline ? '#065f46' : '#991b1b';
      const borderWarna = isOnline ? '#a7f3d0' : '#fecaca';
      const statusTeks = isOnline ? 'ONLINE (Port 7119)' : 'OFFLINE';
      const totalBuf = statusBridge?.total_buffer || 0;

      boxBridge.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <div style="font-weight:700; font-size:14px; color:#0f172a;">LIS Bridge Service</div>
            <div style="font-size:11px; color:#64748b;">Local REST API Server</div>
          </div>
          <span class="badge" style="background:${badgeWarna}; color:${teksWarna}; border:1px solid ${borderWarna}; font-weight:700; font-size:11px;">
            ${UI.esc(statusTeks)}
          </span>
        </div>
        <div style="font-size:11px; color:#334155; line-height:1.4;">
          <div><b>Host URL:</b> http://127.0.0.1:7119</div>
          <div><b>Buffer Memori:</b> ${totalBuf} sampel aktif</div>
          <div style="margin-top:4px; font-size:10.5px; color:${isOnline ? '#059669' : '#dc2626'}; font-weight:600;">
            ${isOnline ? 'Siaga menerima tarikan data browser' : 'Jalankan bridge/jalankan_bridge.bat'}
          </div>
        </div>
      `;
    }

    if (boxRiwayat) {
      renderTabelBuffer(boxRiwayat);
    }
  }

  // Melakukan penarikan data sampel dari bridge (manual test pull)
  async function tarikDataSampel(sidKetik, alatPilihan) {
    const sid = String(sidKetik || '').trim();
    if (!sid) {
      UI.toast('Masukkan Nomor Lab atau Barcode Sampel terlebih dahulu.', 'warn');
      return;
    }

    const btnTarik = document.getElementById('btnTarikManual');
    if (btnTarik) {
      btnTarik.disabled = true;
      btnTarik.innerHTML = `${UI.ikon('ulang', 15)} Menghubungi Alat...`;
    }

    tambahLog('INFO', `Memulai penarikan data sampel no_lab='${sid}' (Filter: ${alatPilihan || 'Semua'})...`);

    // Bentuk variasi kunci pencarian yang sama persis dengan yang ada di lab.js
    const daftarKunci = [sid];
    if (/^\d{8}$/.test(sid)) {
      daftarKunci.push(sid);
    } else {
      const m = sid.match(/LAB-(\d{2,4})-(\d+)/i);
      if (m) {
        const yy = m[1].slice(-2);
        const mm = String(new Date().getMonth() + 1).padStart(2, '0');
        const seq = m[2].padStart(4, '0');
        daftarKunci.push(`${yy}${mm}${seq}`);
        daftarKunci.push(seq);
      }
    }

    let payloadDitemukan = null;
    let kunciSukses = null;

    for (const k of daftarKunci) {
      try {
        const c = new AbortController();
        const tid = setTimeout(() => c.abort(), 2500);
        const urlReq = `${BRIDGE_HOST}/api/hasil?no_lab=${encodeURIComponent(k)}`;
        tambahLog('INFO', `Mencari endpoint: GET ${urlReq}`);

        const r = await fetch(urlReq, { signal: c.signal });
        clearTimeout(tid);

        if (r.ok) {
          const j = await r.json();
          if (j.sukses && j.data) {
            payloadDitemukan = j.data;
            kunciSukses = k;
            break;
          }
        }
      } catch (errReq) {
        tambahLog('WARN', `Lookup kunci '${k}' gagal: ${errReq.message || errReq}`);
      }
    }

    if (payloadDitemukan && Array.isArray(payloadDitemukan.hasil)) {
      const namaAlat = payloadDitemukan.alat || 'Alat Medis';
      tambahLog('SUCCESS', `Data sampel '${kunciSukses}' berhasil ditarik dari ${namaAlat}! Total parameter: ${payloadDitemukan.hasil.length}`, payloadDitemukan);

      hasilInspeksiAktif = payloadDitemukan;
      renderHasilInspeksi();
      UI.toast(`Berhasil menarik ${payloadDitemukan.hasil.length} parameter dari ${namaAlat}.`, 'ok');
    } else {
      tambahLog('WARN', `Data untuk barcode/nomor '${sid}' tidak ditemukan di buffer LIS Bridge.`);
      UI.toast(`Belum ada data masuk dari alat untuk sampel: ${sid}`, 'warn');
      hasilInspeksiAktif = null;
      renderHasilInspeksi();
    }

    if (btnTarik) {
      btnTarik.disabled = false;
      btnTarik.innerHTML = `${UI.ikon('unduh', 15)} Tarik Data Sampel`;
    }
  }

  // Mengambil sampel terbaru langsung dari bridge
  async function ambilSampelTerbaru() {
    try {
      tambahLog('INFO', 'Mengambil sampel terbaru dari buffer bridge (GET /api/terbaru)...');
      const r = await fetch(`${BRIDGE_HOST}/api/terbaru`);
      if (r.ok) {
        const j = await r.json();
        if (j.sukses && j.data && j.data.sample_id) {
          const inp = document.getElementById('inputNoLabDebug');
          if (inp) inp.value = j.data.sample_id;
          tambahLog('SUCCESS', `Sampel terbaru terdeteksi: ${j.data.sample_id} (${j.data.alat || 'Alat'})`);
          hasilInspeksiAktif = j.data;
          renderHasilInspeksi();
          UI.toast(`Sampel terbaru #${j.data.sample_id} dimuat.`, 'ok');
        } else {
          tambahLog('WARN', 'Buffer bridge kosong atau belum ada sampel masuk hari ini.');
          UI.toast('Buffer bridge masih kosong.', 'info');
        }
      }
    } catch (e) {
      tambahLog('ERROR', `Gagal mengambil sampel terbaru: ${e.message}`);
      UI.toast('Gagal terhubung ke LIS Bridge.', 'err');
    }
  }

  // Mengirim simulasi payload alat ke bridge (membantu pengujian tanpa alat fisik)
  async function kirimSimulasiPayload(alat) {
    const inp = document.getElementById('inputNoLabDebug');
    const sid = (inp && inp.value.trim()) || ('2609' + String(Math.floor(1000 + Math.random() * 9000)));
    if (inp) inp.value = sid;

    let payload = null;
    if (alat === 'Sysmex XP-100') {
      payload = {
        sample_id: sid,
        nama_pasien: 'Pasien Uji Sysmex',
        alat: 'Sysmex XP-100',
        hasil: [
          { test_name: 'WBC', value: '7.45', unit: '10^3/uL', flag: 'N' },
          { test_name: 'RBC', value: '4.82', unit: '10^6/uL', flag: 'N' },
          { test_name: 'HGB', value: '14.1', unit: 'g/dL', flag: 'N' },
          { test_name: 'HCT', value: '42.3', unit: '%', flag: 'N' },
          { test_name: 'PLT', value: '265', unit: '10^3/uL', flag: 'N' },
          { test_name: 'MCV', value: '87.8', unit: 'fL', flag: 'N' },
          { test_name: 'MCH', value: '29.3', unit: 'pg', flag: 'N' },
          { test_name: 'MCHC', value: '33.3', unit: 'g/dL', flag: 'N' },
          { test_name: 'LYM%', value: '32.1', unit: '%', flag: 'N' },
          { test_name: 'NEUT%', value: '58.4', unit: '%', flag: 'N' }
        ]
      };
    } else {
      payload = {
        sample_id: sid,
        nama_pasien: 'Pasien Uji Mindray',
        alat: 'Mindray BS-240',
        hasil: [
          { test_name: 'GLU-S', value: '112', unit: 'mg/dL', flag: 'N' },
          { test_name: 'CHOL', value: '215', unit: 'mg/dL', flag: 'H' },
          { test_name: 'TG', value: '160', unit: 'mg/dL', flag: 'H' },
          { test_name: 'UA', value: '6.2', unit: 'mg/dL', flag: 'N' },
          { test_name: 'CREA-S', value: '0.95', unit: 'mg/dL', flag: 'N' },
          { test_name: 'SGOT', value: '24', unit: 'U/L', flag: 'N' },
          { test_name: 'SGPT', value: '28', unit: 'U/L', flag: 'N' }
        ]
      };
    }

    tambahLog('INFO', `Mengirim simulasi paket data ${alat} untuk sample_id='${sid}' ke POST /api/simulasi...`, payload);

    try {
      const res = await fetch(`${BRIDGE_HOST}/api/simulasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const j = await res.json();
        tambahLog('SUCCESS', `Simulasi ${alat} sukses diproses oleh bridge. Data kini tersimpan di buffer!`, j);
        UI.toast(`Simulasi paket ${alat} berhasil dikirim!`, 'ok');
        // Langsung tampilkan inspeksi
        hasilInspeksiAktif = payload;
        renderHasilInspeksi();
        // Segarkan status bridge
        setTimeout(periksaStatusListener, 500);
      } else {
        tambahLog('WARN', `Simulasi ditolak oleh server bridge (HTTP ${res.status})`);
        UI.toast(`Simulasi gagal: HTTP ${res.status}`, 'warn');
      }
    } catch (e) {
      tambahLog('ERROR', `Gagal mengirim simulasi ke bridge: ${e.message}. Pastikan bridge berjalan.`);
      UI.toast('Gagal terhubung ke LIS Bridge.', 'err');
    }
  }

  // Merender tabel pemetaan parameter hasil ekstraksi
  function renderHasilInspeksi() {
    const wadah = document.getElementById('wadahHasilMapping');
    if (!wadah) return;

    if (!hasilInspeksiAktif || !Array.isArray(hasilInspeksiAktif.hasil) || !hasilInspeksiAktif.hasil.length) {
      wadah.innerHTML = `
        <div style="padding:28px 16px; text-align:center; color:#64748b; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:6px;">
          <div style="margin-bottom:6px; color:#94a3b8;">${UI.ikon('cari', 32)}</div>
          <div style="font-weight:600; font-size:13px; color:#475569;">Belum Ada Sampel yang Diinspeksi</div>
          <div style="font-size:11.5px; margin-top:2px;">Ketik Nomor Lab/Barcode lalu klik "Tarik Data Sampel" atau gunakan tombol "Uji Simulasi".</div>
        </div>
      `;
      return;
    }

    const d = hasilInspeksiAktif;
    const mapKode = ambilMapKode();
    const items = d.hasil;

    let barisHtml = items.map((item, idx) => {
      const rawCode = (item.test_name || '').toUpperCase().trim();
      const rawVal = item.value;
      const aliases = mapKode[rawCode] || [rawCode];

      // Cari kesesuaian di refLabMaster
      const matched = refLabMaster.find(r => {
        const rNama = (r.nama || '').trim().toLowerCase();
        const rKode = (r.kode || '').trim().toUpperCase();
        return aliases.some(a => a.toLowerCase() === rNama) ||
               rNama === rawCode.toLowerCase() ||
               rKode === rawCode;
      });

      const isMapped = !!matched;
      const badgeStatus = isMapped
        ? `<span class="badge" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-weight:700;">Terpetakan</span>`
        : `<span class="badge" style="background:#fffbeb;color:#92400e;border:1px solid #fde68a;font-weight:700;">Belum Terpetakan</span>`;

      const namaRef = isMapped ? matched.nama : '<span style="color:#94a3b8;font-style:italic;">Tidak Ditemukan</span>';
      const kelompokRef = isMapped ? (matched.kelompok || 'Umum') : '-';
      const rujukanTeks = isMapped && Array.isArray(matched.rujukan) && matched.rujukan.length
        ? matched.rujukan.map(x => `${x.jenis_kelamin || '*'}: ${x.nilai_min || '0'} - ${x.nilai_max || '0'} ${matched.satuan || ''}`).join('<br>')
        : '-';

      return `
        <tr>
          <td style="text-align:center; font-weight:600;">${idx + 1}</td>
          <td>
            <span class="mono" style="font-weight:700; color:#0f172a; font-size:12px;">${UI.esc(rawCode)}</span>
          </td>
          <td>
            <span class="mono" style="font-weight:800; font-size:12.5px; color:#0f766e;">${UI.esc(rawVal)}</span>
          </td>
          <td>${UI.esc(item.unit || '-')}</td>
          <td>
            <span class="badge" style="background:#f1f5f9; color:#334155; font-size:10px;">${UI.esc(item.flag || 'NORMAL')}</span>
          </td>
          <td>
            <div style="font-weight:600; color:#0f172a;">${namaRef}</div>
            <div style="font-size:10.5px; color:#64748b;">Kelompok: ${UI.esc(kelompokRef)}</div>
          </td>
          <td style="text-align:center;">${badgeStatus}</td>
          <td style="font-size:10px; color:#475569;">${rujukanTeks}</td>
        </tr>
      `;
    }).join('');

    wadah.innerHTML = `
      <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <span style="font-size:13px; font-weight:700; color:#0f172a;">Hasil Sampel:</span>
          <span class="mono" style="font-size:13px; font-weight:800; color:#0f766e; margin-left:4px;">${UI.esc(d.sample_id)}</span>
          <span class="badge" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; margin-left:8px; font-weight:700;">
            ${UI.esc(d.alat || 'Alat Medis')}
          </span>
          <span style="font-size:11px; color:#64748b; margin-left:8px;">Waktu: ${UI.esc(d.waktu || '-')}</span>
        </div>
        <div style="font-size:11.5px; color:#475569;">
          Total Parameter: <b>${items.length}</b>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table" style="font-size:11px;">
          <thead>
            <tr>
              <th style="width:40px; text-align:center;">No</th>
              <th style="width:110px;">Kode Alat</th>
              <th style="width:90px;">Nilai Hasil</th>
              <th style="width:75px;">Satuan</th>
              <th style="width:75px;">Flag</th>
              <th>Parameter Ref Lab Sistem</th>
              <th style="width:130px; text-align:center;">Status Mapping</th>
              <th style="width:180px;">Nilai Rujukan DB</th>
            </tr>
          </thead>
          <tbody>
            ${barisHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // Merender log terminal dark monospace console
  function renderLogConsole(el) {
    if (!el) return;
    if (!daftarLog.length) {
      el.innerHTML = '<div style="color:#64748b; font-style:italic;">Belum ada riwayat aktivitas log. Klik "Cek Koneksi Listener" untuk memulai diagnosa.</div>';
      return;
    }

    const html = daftarLog.map(item => {
      let warnaTipe = '#94a3b8';
      if (item.tipe === 'SUCCESS') warnaTipe = '#34d399';
      if (item.tipe === 'WARN') warnaTipe = '#fbbf24';
      if (item.tipe === 'ERROR') warnaTipe = '#f87171';
      if (item.tipe === 'INFO') warnaTipe = '#38bdf8';

      let payloadHtml = '';
      if (item.payload) {
        try {
          const jsonStr = JSON.stringify(item.payload, null, 2);
          payloadHtml = `<pre style="margin:4px 0 0 16px; color:#cbd5e1; font-size:10.5px; background:rgba(255,255,255,0.05); padding:6px 8px; border-radius:4px; overflow-x:auto;">${UI.esc(jsonStr)}</pre>`;
        } catch (_) {}
      }

      return `
        <div style="margin-bottom:6px; line-height:1.45; word-break:break-all;">
          <span style="color:#64748b;">[${item.waktu}]</span>
          <span style="color:${warnaTipe}; font-weight:700; margin:0 4px;">[${item.tipe}]</span>
          <span>${UI.esc(item.pesan)}</span>
          ${payloadHtml}
        </div>
      `;
    }).join('');

    el.innerHTML = html;
  }

  // Merender tabel 10 buffer riwayat terakhir dari bridge
  function renderTabelBuffer(el) {
    if (!el) return;
    if (!bufferTerakhir || !bufferTerakhir.length) {
      el.innerHTML = '<div style="padding:14px; text-align:center; color:#64748b; font-size:11.5px;">Buffer memori bridge kosong atau server belum aktif.</div>';
      return;
    }

    const baris = bufferTerakhir.map((b, i) => {
      const jmlHasil = Array.isArray(b.hasil) ? b.hasil.length : 0;
      return `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td><span class="mono" style="font-weight:700; color:#0f766e;">${UI.esc(b.sample_id)}</span></td>
          <td>${UI.esc(b.alat || '-')}</td>
          <td>${UI.esc(b.nama_pasien || '-')}</td>
          <td>${UI.esc(b.waktu || '-')}</td>
          <td style="text-align:center;">
            <span class="badge" style="background:#f1f5f9; color:#0f172a; font-weight:700;">${jmlHasil} item</span>
          </td>
          <td style="text-align:center;">
            <button class="btn btn-secondary btn-sm btn-inspeksi-buffer" data-sid="${UI.esc(b.sample_id)}" style="padding:2px 8px; font-size:11px;">
              ${UI.ikon('cari', 13)} Inspeksi
            </button>
          </td>
        </tr>
      `;
    }).join('');

    el.innerHTML = `
      <div class="table-wrap">
        <table class="table" style="font-size:11px;">
          <thead>
            <tr>
              <th style="width:35px; text-align:center;">No</th>
              <th style="width:110px;">Sample ID</th>
              <th>Alat Medis</th>
              <th>Nama Pasien</th>
              <th>Waktu Terima</th>
              <th style="width:90px; text-align:center;">Parameter</th>
              <th style="width:85px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${baris}
          </tbody>
        </table>
      </div>
    `;

    el.querySelectorAll('.btn-inspeksi-buffer').forEach(btn => {
      btn.onclick = () => {
        const sid = btn.dataset.sid;
        const target = bufferTerakhir.find(x => String(x.sample_id) === String(sid));
        if (target) {
          hasilInspeksiAktif = target;
          const inp = document.getElementById('inputNoLabDebug');
          if (inp) inp.value = target.sample_id;
          renderHasilInspeksi();
          tambahLog('INFO', `Menginspeksi buffer sampel '${sid}' (${target.alat}).`);
          UI.toast(`Sampel #${sid} dimuat ke tabel inspeksi.`, 'ok');
          const wadahInspeksi = document.getElementById('wadahHasilMapping');
          if (wadahInspeksi) wadahInspeksi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      };
    });
  }

  // Menyalin log ke clipboard
  function salinLog() {
    if (!daftarLog.length) {
      UI.toast('Tidak ada log untuk disalin.', 'info');
      return;
    }
    const teks = daftarLog.map(x => `[${x.waktu}] [${x.tipe}] ${x.pesan}${x.payload ? ' ' + JSON.stringify(x.payload) : ''}`).join('\n');
    navigator.clipboard.writeText(teks).then(() => {
      UI.toast('Log berhasil disalin ke clipboard.', 'ok');
    }).catch(() => {
      UI.toast('Gagal menyalin log.', 'err');
    });
  }

  // Fungsi utama Render halaman
  async function render(el, params) {
    // Muat master ref_lab untuk pemetaan parameter
    try {
      refLabMaster = await DB.refLab(true);
    } catch (e) {
      refLabMaster = [];
    }

    el.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <h1 style="margin:0; font-size:20px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:8px;">
            ${UI.ikon('pengaturan', 22)} LIS &amp; Integrasi Alat Medis
          </h1>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">
            Diagnostic, troubleshooting, dan monitoring komunikasi data alat laboratorium (Mindray BS-240 &amp; Sysmex XP-100).
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-sm" id="btnBukaBridgeBat" title="Panduan memulai server LIS bridge">
            ${UI.ikon('info', 15)} Panduan Listener
          </button>
          <button class="btn btn-primary btn-sm" id="btnCekListener">
            ${UI.ikon('ulang', 15)} Cek Koneksi Listener
          </button>
        </div>
      </div>

      <!-- KARTU INDIKATOR STATUS LISTENER (3 KOLOM) -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; margin-bottom:18px;">
        <div class="card" id="statusMindrayCard" style="margin:0; padding:16px;">
          <div style="color:#64748b; font-size:12px;">Memuat status Mindray BS-240...</div>
        </div>
        <div class="card" id="statusSysmexCard" style="margin:0; padding:16px;">
          <div style="color:#64748b; font-size:12px;">Memuat status Sysmex XP-100...</div>
        </div>
        <div class="card" id="statusBridgeCard" style="margin:0; padding:16px;">
          <div style="color:#64748b; font-size:12px;">Memuat status LIS Bridge API...</div>
        </div>
      </div>

      <!-- FORM PENGUJIAN PENARIKAN DATA -->
      <div class="card" style="margin-bottom:18px;">
        <div class="card-head">
          <h2>Uji Coba Penarikan Data (Manual Pull / Test Fetch)</h2>
          <div class="sub">Simulasi penarikan data hasil alat berdasarkan nomor barcode tabung sampel</div>
        </div>
        <div class="card-body">
          <div style="display:grid; grid-template-columns:1.5fr 1fr auto auto; gap:12px; align-items:flex-end;">
            <div class="field" style="margin:0;">
              <label for="inputNoLabDebug" style="font-weight:600; font-size:12px; margin-bottom:4px; display:block;">
                Nomor Lab / Barcode Sampel
              </label>
              <input type="text" id="inputNoLabDebug" class="input" placeholder="Contoh: 26090025 atau LAB-2609-0025" style="width:100%; font-family:'JetBrains Mono',monospace;">
            </div>
            <div class="field" style="margin:0;">
              <label for="selectAlatDebug" style="font-weight:600; font-size:12px; margin-bottom:4px; display:block;">
                Filter Alat Target
              </label>
              <select id="selectAlatDebug" class="input" style="width:100%;">
                <option value="">Semua Alat (Auto-Detect)</option>
                <option value="Mindray BS-240">Mindray BS-240 (Kimia Darah)</option>
                <option value="Sysmex XP-100">Sysmex XP-100 (Hematologi)</option>
              </select>
            </div>
            <div>
              <button class="btn btn-primary" id="btnTarikManual" style="height:38px; display:flex; align-items:center; gap:6px;">
                ${UI.ikon('unduh', 15)} Tarik Data Sampel
              </button>
            </div>
            <div>
              <button class="btn btn-secondary" id="btnAmbilTerbaru" style="height:38px; display:flex; align-items:center; gap:6px;" title="Ambil sampel paling terakhir masuk ke bridge">
                ${UI.ikon('ulang', 15)} Sampel Terbaru
              </button>
            </div>
          </div>

          <div style="margin-top:14px; padding-top:12px; border-top:1px dashed #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="font-size:11.5px; color:#64748b;">
              Uji Simulasi Payload (Tanpa Alat Fisik):
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-ghost btn-sm" id="btnSimulasiMindray" style="color:#0369a1; border:1px solid #bae6fd; background:#f0f9ff;">
                ${UI.ikon('plus', 13)} Simulasi Paket Mindray
              </button>
              <button class="btn btn-ghost btn-sm" id="btnSimulasiSysmex" style="color:#7e22ce; border:1px solid #e9d5ff; background:#faf5ff;">
                ${UI.ikon('plus', 13)} Simulasi Paket Sysmex
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- HASIL EKSTRAKSI & PEMETAAN PARAMETER REF_LAB -->
      <div class="card" style="margin-bottom:18px;">
        <div class="card-head">
          <h2>Hasil Ekstraksi &amp; Status Pemetaan Parameter Ref Lab</h2>
          <div class="sub">Memeriksa apakah kode pemeriksaan dari alat berhasil dipetakan ke master data laboratorium</div>
        </div>
        <div class="card-body" id="wadahHasilMapping">
          <!-- Diisi oleh renderHasilInspeksi() -->
        </div>
      </div>

      <!-- DUA KOLOM: BUFFER RIWAYAT & LOG CONSOLE -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        
        <!-- KOLOM KIRI: 10 SAMPEL TERAKHIR DI BUFFER BRIDGE -->
        <div class="card" style="margin:0;">
          <div class="card-head">
            <h2>Riwayat Buffer Sampel (LIS Bridge)</h2>
            <div class="sub">10 sampel terakhir yang diterima oleh listener lokal</div>
          </div>
          <div class="card-body tight" id="wadahTabelBuffer">
            <div style="padding:14px; color:#64748b; font-size:11.5px;">Memuat buffer...</div>
          </div>
        </div>

        <!-- KOLOM KANAN: TROUBLESHOOTING LOG CONSOLE -->
        <div class="card" style="margin:0;">
          <div class="card-head" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h2>Log &amp; Raw Data Console</h2>
              <div class="sub">Output pesan socket HL7/ASTM dan aktivitas API</div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-sm" id="btnSalinLog" style="padding:2px 8px; font-size:11px;">
                ${UI.ikon('dokumen', 13)} Salin Log
              </button>
              <button class="btn btn-secondary btn-sm" id="btnBersihkanLog" style="padding:2px 8px; font-size:11px;">
                ${UI.ikon('hapus', 13)} Bersihkan
              </button>
            </div>
          </div>
          <div class="card-body" style="padding:10px;">
            <div id="wadahLogConsole" style="background:#0f172a; color:#f8fafc; font-family:'JetBrains Mono',monospace; font-size:11px; padding:12px; border-radius:6px; height:320px; overflow-y:auto; box-sizing:border-box;">
              <!-- Diisi oleh renderLogConsole() -->
            </div>
          </div>
        </div>

      </div>
    `;

    pasangKejadian(el);
    renderHasilInspeksi();
    renderLogConsole(document.getElementById('wadahLogConsole'));

    // Cek status otomatis saat pertama dibuka
    periksaStatusListener();
  }

  // Pasang event listener interaktif
  function pasangKejadian(el) {
    const btnCek = el.querySelector('#btnCekListener');
    if (btnCek) btnCek.onclick = () => periksaStatusListener();

    const btnTarik = el.querySelector('#btnTarikManual');
    if (btnTarik) {
      btnTarik.onclick = () => {
        const inp = el.querySelector('#inputNoLabDebug');
        const sel = el.querySelector('#selectAlatDebug');
        tarikDataSampel(inp?.value, sel?.value);
      };
    }

    const inpNoLab = el.querySelector('#inputNoLabDebug');
    if (inpNoLab) {
      inpNoLab.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const sel = el.querySelector('#selectAlatDebug');
          tarikDataSampel(inpNoLab.value, sel?.value);
        }
      };
    }

    const btnTerbaru = el.querySelector('#btnAmbilTerbaru');
    if (btnTerbaru) btnTerbaru.onclick = () => ambilSampelTerbaru();

    const btnSimMindray = el.querySelector('#btnSimulasiMindray');
    if (btnSimMindray) btnSimMindray.onclick = () => kirimSimulasiPayload('Mindray BS-240');

    const btnSimSysmex = el.querySelector('#btnSimulasiSysmex');
    if (btnSimSysmex) btnSimSysmex.onclick = () => kirimSimulasiPayload('Sysmex XP-100');

    const btnBersih = el.querySelector('#btnBersihkanLog');
    if (btnBersih) btnBersih.onclick = () => bersihkanLog();

    const btnSalin = el.querySelector('#btnSalinLog');
    if (btnSalin) btnSalin.onclick = () => salinLog();

    const btnPanduan = el.querySelector('#btnBukaBridgeBat');
    if (btnPanduan) {
      btnPanduan.onclick = () => {
        UI.modal({
          judul: 'Panduan Menjalankan LIS Bridge',
          konten: `
            <div style="font-size:12.5px; line-height:1.5; color:#334155;">
              <p>LIS Bridge adalah daemon service Python di komputer laboratorium yang bertugas mendengarkan socket alat dan menyediakan REST API lokal untuk browser:</p>
              <ol style="padding-left:20px; margin-bottom:14px;">
                <li style="margin-bottom:6px;"><b>Mindray BS-240:</b> Menghubungkan kabel LAN ke PC dan mengirim data via HL7 MLLP ke <b>Port 7118</b>.</li>
                <li style="margin-bottom:6px;"><b>Sysmex XP-100:</b> Mengirim data serial/LAN format ASTM ke <b>Port 8000</b>.</li>
                <li style="margin-bottom:6px;"><b>Local REST API:</b> Browser klinik berkomunikasi ke <b>http://127.0.0.1:7119</b> untuk penarikan data instan.</li>
              </ol>
              <div class="banner info" style="margin-bottom:0;">
                <div>
                  <b>Cara Menjalankan:</b><br>
                  Buka folder <code>bridge</code> di komputer laboratorium, lalu klik dua kali berkas <code>jalankan_bridge.bat</code>.<br>
                  Untuk aktif otomatis saat Windows menyala, gunakan <code>pasang_otomatis_startup.bat</code>.
                </div>
              </div>
            </div>
          `,
          tombol: [{ teks: 'Tutup', nilai: true, kelas: 'btn-secondary' }]
        });
      };
    }
  }

  return {
    render,
    periksaStatusListener,
    tarikDataSampel,
    bersihkanLog
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LisDebug;
