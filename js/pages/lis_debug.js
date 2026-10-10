/* =====================================================================
   LIS & INTEGRASI ALAT — Modul Diagnostik, Troubleshooting, & Live Monitoring
   Alat Laboratorium Medis (Mindray BS-240 & Sysmex XP-100)
   Khusus Role Master, Developer & Karyawan
   ===================================================================== */
const LisDebug = (() => {
  'use strict';

  // Endpoint REST API LIS Bridge lokal di komputer laboratorium
  const BRIDGE_HOST = 'http://127.0.0.1:7119';

  // Kamus alias kode alat untuk pemetaan otomatis ke master data klinik (ref_lab)
  const FALLBACK_MAP_KODE_ALAT = {
    'GLU-S': ['Glukosa Darah Sewaktu', 'Glukosa Darah Puasa', 'Glukosa Darah 2 Jam PP', 'Glukosa', 'GDS', 'GDP'],
    'GLU': ['Glukosa Darah Sewaktu', 'Glukosa Darah Puasa', 'Glukosa Darah 2 Jam PP', 'Glukosa'],
    'GLU-G': ['Glukosa Darah Sewaktu', 'Glukosa Darah Puasa', 'Glukosa Darah 2 Jam PP', 'Glukosa'],
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
    'ALB II': ['Albumin'],
    'ALBUMIN': ['Albumin'],
    'TP': ['Total Protein', 'Protein Total'],
    'TBIL': ['Bilirubin Total', 'Total Bilirubin'],
    'T-BIL': ['Bilirubin Total', 'Total Bilirubin'],
    'DBIL': ['Bilirubin Direk', 'Direct Bilirubin'],
    'D-BIL': ['Bilirubin Direk', 'Direct Bilirubin'],
    'ALP': ['Alkali Fosfatase', 'Alkaline Phosphatase'],
    'GGT': ['Gamma GT', 'GGT'],
    'I3-GT': ['Gamma GT', 'GGT'],
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
    'HBA1C': ['HbA 1C', 'HbA1c', 'Hemoglobin A1c'],
    'MAU': ['Mikroalbumin Urin (MAU)', 'Mikroalbumin Urin', 'Mikroalbumin', 'Microalbumin', 'MAU'],
    'MICROALBUMIN': ['Mikroalbumin Urin (MAU)', 'Mikroalbumin Urin', 'Mikroalbumin', 'Microalbumin', 'MAU'],
    'M-ALB': ['Mikroalbumin Urin (MAU)', 'Mikroalbumin Urin', 'Mikroalbumin', 'Microalbumin', 'MAU']
  };

  // State internal
  let statusBridge = null;
  let daftarSampel = [];
  let sampelTerpilih = null;
  let filterKata = '';
  let filterAlat = '';
  let rawBuka = false;
  let daftarLog = [];
  let refLabMaster = [];
  let timerPolling = null;
  let autoRefreshAktif = true;
  let sumberData = 'lokal';  // 'lokal' jika terhubung langsung, 'supabase' jika fallback
  let statusDariDB = null;   // Heartbeat terakhir dari lis_status_bridge
  let langgananRealtime = null;
  let listenerNavigasi = null;

  // Format tanggal lokal YYYY-MM-DD untuk filter presisi
  function tglHariIniLokal() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  let filterTanggal = tglHariIniLokal();
  let alertBannerDitutup = false;

  // Mendapatkan peta kamus kode alat
  function ambilMapKode() {
    return (typeof Lab !== 'undefined' && Lab.MAP_KODE_ALAT)
      ? Lab.MAP_KODE_ALAT
      : FALLBACK_MAP_KODE_ALAT;
  }

  // Pemformatan dan pembulatan khusus hasil alat Mindray BS-240
  function formatNilaiMindray(kodeAtauNama, rawVal) {
    if (typeof LabCore !== 'undefined' && LabCore.formatNilaiMindray) {
      return LabCore.formatNilaiMindray(kodeAtauNama, rawVal);
    }
    if (rawVal === null || rawVal === undefined || rawVal === '') return '';
    const valStr = String(rawVal).trim();
    if (!valStr) return '';
    const valFloat = parseFloat(valStr.replace(',', '.'));
    if (isNaN(valFloat)) return valStr;

    const nameUpper = String(kodeAtauNama || '').toUpperCase().trim();

    // 1. Parameter HDL: Wajib diproses terlebih dahulu agar TIDAK terpengaruh kata kunci 'CHOL'/'KOLESTEROL'
    if (nameUpper.includes('HDL')) {
      const parts = valStr.replace(',', '.').split('.');
      return parts.length === 2 && parts[1].length > 2 ? valFloat.toFixed(2) : valStr;
    }

    // 2. Parameter CREA / Kreatinin (Kategori C)
    if (nameUpper.includes('CREA') || nameUpper.includes('KREATININ')) {
      const parts = valStr.replace(',', '.').split('.');
      return parts.length === 2 && parts[1].length > 2 ? valFloat.toFixed(2) : valStr;
    }

    // 3. Parameter Urea / BUN (Kategori B: tepat 1 angka desimal)
    if (nameUpper.includes('UREA') || nameUpper.includes('UREUM') || nameUpper.includes('BUN')) {
      return valFloat.toFixed(1);
    }

    // 4. Parameter Bilangan Bulat dengan Pembulatan Khusus (Kategori A)
    const isGlu = ['GLU', 'GULA', 'GDS', 'GDP', 'GD2PP'].some(k => nameUpper.includes(k));
    const isTg = ['TG', 'TRIG'].some(k => nameUpper.includes(k));
    const isTc = nameUpper.includes('TC') || (
      (nameUpper.includes('CHOL') || nameUpper.includes('KOLESTEROL')) &&
      !nameUpper.includes('HDL') && !nameUpper.includes('LDL')
    );

    if (isGlu || isTg || isTc) {
      const desimal = valFloat - Math.floor(valFloat);
      return desimal > 0.500001 ? String(Math.ceil(valFloat)) : String(Math.floor(valFloat));
    }

    const parts = valStr.replace(',', '.').split('.');
    return parts.length === 2 && parts[1].length > 2 ? valFloat.toFixed(2) : valStr;
  }

  // Menambahkan log ke buffer internal
  function tambahLog(tipe, pesan, payload = null) {
    const d = new Date();
    const waktu = d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
    daftarLog.unshift({ waktu, tipe, pesan, payload });
    if (daftarLog.length > 120) daftarLog.pop();

    const wadahConsole = document.getElementById('wadahLogConsole');
    if (wadahConsole) renderLogConsole(wadahConsole);
  }

  // Membersihkan log aktivitas
  function bersihkanLog() {
    daftarLog = [];
    const wadahConsole = document.getElementById('wadahLogConsole');
    if (wadahConsole) renderLogConsole(wadahConsole);
    UI.toast('Riwayat log berhasil dibersihkan.', 'ok');
  }

  // Salin log ke clipboard
  function salinLog() {
    if (!daftarLog.length) {
      UI.toast('Tidak ada log untuk disalin.', 'info');
      return;
    }
    const teks = daftarLog.map(x => `[${x.waktu}] [${x.tipe}] ${x.pesan}${x.payload ? ' ' + JSON.stringify(x.payload) : ''}`).join('\n');
    navigator.clipboard.writeText(teks).then(() => {
      UI.toast('Log berhasil disalin ke clipboard.', 'ok');
    }).catch(() => {
      UI.toast('Gagal menyalin log ke clipboard.', 'err');
    });
  }

  // Memeriksa status listener bridge lokal dan mengambil sampel buffer
  async function periksaStatusListener(senyap = false) {
    const btnCek = document.getElementById('btnCekListener');
    if (btnCek && !senyap) {
      btnCek.disabled = true;
      btnCek.innerHTML = `${UI.ikon('ulang', 14)} Memeriksa...`;
    }

    if (!senyap) {
      tambahLog('INFO', `Melakukan ping ke LIS Bridge (${BRIDGE_HOST}/status)...`);
    }

    let langsung = false;
    try {
      const c = new AbortController();
      const tid = setTimeout(() => c.abort(), 6000);
      let res;
      try {
        res = await fetch(`${BRIDGE_HOST}/status`, {
          method: 'GET',
          signal: c.signal
        });
      } catch (eStatus) {
        // Fallback coba ke /api/status jika /status gagal
        res = await fetch(`${BRIDGE_HOST}/api/status`, {
          method: 'GET',
          signal: c.signal
        });
      }
      clearTimeout(tid);

      if (res && res.ok) {
        const j = await res.json();
        statusBridge = j;
        langsung = true;
        const isOnline = !!(
          j.sukses === true ||
          String(j.status).toLowerCase() === 'online' ||
          String(j.bridge).toLowerCase() === 'standby'
        );
        if (isOnline) {
          statusBridge.status = 'ONLINE';
        }
        if (!senyap) {
          const mindrayPort = j.listener?.mindray?.port || 7118;
          const sysmexPort = j.listener?.sysmex?.port || 8005;
          const wondfoPort = j.listener?.wondfo?.port || 8001;
          tambahLog('SUCCESS', `LIS Bridge ONLINE. Mindray: Port ${mindrayPort}, Sysmex: Port ${sysmexPort}, Wondfo: Port ${wondfoPort}, Total Buffer: ${j.total_buffer || 0}`, j);
          UI.toast('LIS Bridge terhubung dan aktif.', 'ok');
        }
      } else {
        statusBridge = { status: 'OFFLINE', error: `HTTP ${res?.status || 'ERR'}: ${res?.statusText || 'Error'}` };
        if (!senyap) {
          tambahLog('WARN', `LIS Bridge merespons kode HTTP ${res?.status || 'ERR'}`);
          UI.toast(`LIS Bridge merespons error ${res?.status || ''}`, 'warn');
        }
      }
    } catch (err) {
      statusBridge = { status: 'OFFLINE', error: err.message || 'Koneksi ditolak / Service belum aktif' };
      if (!senyap) {
        tambahLog('ERROR', `Gagal terhubung ke LIS Bridge pada 127.0.0.1:7119: ${err.message || 'Connection refused'}. Pastikan LIS Bridge aktif.`);
      }
    }

    // ---- MULTI-DEVICE FALLBACK: Cek heartbeat dari Supabase ----
    if (!langsung) {
      try {
        statusDariDB = await DB.ambilStatusBridge();
        if (statusDariDB) {
          const lastHb = statusDariDB.last_heartbeat;
          const terkini = lastHb ? new Date(lastHb) : null;
          const sekarang = new Date();
          // Jika heartbeat kurang dari 60 detik lalu, anggap bridge ONLINE di jaringan
          const selisihDetik = terkini ? Math.abs((sekarang - terkini) / 1000) : 99999;
          if (selisihDetik < 60) {
            let lj = statusDariDB.listener_json || {};
            if (typeof lj === 'string') {
              try { lj = JSON.parse(lj); } catch (_) { lj = {}; }
            }
            statusBridge = {
              sukses: true,
              status: 'ONLINE',
              bridge: 'standby',
              listener: lj,
              total_buffer: statusDariDB.total_buffer || 0,
              total_samples: statusDariDB.total_buffer || 0,
              _sumber: 'database'
            };
            sumberData = 'supabase';
            if (!senyap) {
              tambahLog('INFO', `Bridge terdeteksi ONLINE via heartbeat DB (${Math.round(selisihDetik)}s lalu). Perangkat ini bukan PC Lab, membaca riwayat dari database.`);
              UI.toast('Bridge terdeteksi ONLINE via jaringan (heartbeat DB).', 'ok');
            }
          } else {
            sumberData = 'supabase';
            if (!senyap) {
              tambahLog('WARN', `Heartbeat bridge terakhir ${Math.round(selisihDetik)}s lalu. Bridge kemungkinan OFFLINE.`);
              UI.toast('LIS Bridge lokal offline. Menampilkan data dari database.', 'warn');
            }
          }
        }
      } catch (eDb) {
        if (!senyap) {
          tambahLog('WARN', `Gagal cek heartbeat dari database: ${eDb.message}`);
        }
      }
    } else {
      sumberData = 'lokal';
    }

    const isBridgeConnected = !!(
      statusBridge && (
        statusBridge.sukses === true ||
        String(statusBridge.status).toLowerCase() === 'online' ||
        String(statusBridge.bridge).toLowerCase() === 'standby'
      )
    );

    // Ambil daftar sampel: prioritas lokal, fallback Supabase
    if (langsung && isBridgeConnected) {
      try {
        const resBuf = await fetch(`${BRIDGE_HOST}/api/terakhir`);
        if (resBuf.ok) {
          const jBuf = await resBuf.json();
          const daftarBaru = (jBuf && jBuf.data) ? jBuf.data : [];

          if (daftarSampel.length > 0 && daftarBaru.length > daftarSampel.length) {
            const sidBaru = daftarBaru[0]?.sample_id;
            tambahLog('SUCCESS', `Sampel baru diterima dari alat: #${sidBaru} (${daftarBaru[0]?.alat || 'Alat'})`);
            UI.toast(`Data baru masuk dari alat: Sampel #${sidBaru}`, 'ok');
          }

          daftarSampel = daftarBaru;
          sumberData = 'lokal';
        }
      } catch (_) {}
    } else {
      // Fallback: ambil dari Supabase lis_riwayat_sampel (dengan filter tanggal presisi)
      // Jika realtime aktif dan ini polling senyap berkala, jangan query ulang DB untuk mencegah connection exhaustion
      const perluMuatDb = !senyap || daftarSampel.length === 0 || !langgananRealtime;
      if (perluMuatDb) {
        try {
          const dataSb = await DB.ambilRiwayatSampelLIS(100, filterTanggal);
          daftarSampel = (dataSb || []).map(r => ({
            id: r.id,
            sample_id: r.sample_id,
            nama_pasien: r.nama_pasien || 'Pasien',
            alat: r.alat || '',
            waktu: r.waktu_terima ? new Date(r.waktu_terima).toLocaleString('id-ID') : (r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : '-'),
            waktu_terima: r.waktu_terima,
            created_at: r.created_at,
            hasil: Array.isArray(r.hasil_json) ? r.hasil_json : (typeof r.hasil_json === 'string' ? JSON.parse(r.hasil_json || '[]') : []),
            raw_hl7: r.raw_data || '',
            status_mapping: r.status_mapping || 'BELUM',
            metadata: {}
          }));
          sumberData = 'supabase';
        } catch (eSb) {
          tambahLog('WARN', `Gagal memuat riwayat dari database: ${eSb.message}`);
        }
      } else {
        sumberData = 'supabase';
      }
    }

    // Pilih sampel pertama jika belum ada
    if (!sampelTerpilih && daftarSampel.length > 0) {
      sampelTerpilih = daftarSampel[0];
    } else if (sampelTerpilih) {
      const cocokan = daftarSampel.find(s => String(s.sample_id) === String(sampelTerpilih.sample_id));
      if (cocokan) sampelTerpilih = cocokan;
    }

    perbaruiUIStatus();
    renderDaftarSampel();
    renderDetailSampel();

    if (btnCek) {
      btnCek.disabled = false;
      btnCek.innerHTML = `${UI.ikon('ulang', 14)} Cek Koneksi`;
    }
  }

  // Memperbarui UI metrik & status kartu listener
  function perbaruiUIStatus() {
    const isBridgeConnected = !!(
      statusBridge && (
        statusBridge.sukses === true ||
        String(statusBridge.status).toLowerCase() === 'online' ||
        String(statusBridge.bridge).toLowerCase() === 'standby'
      )
    );

    const listener = (statusBridge && typeof statusBridge.listener === 'object' && statusBridge.listener !== null)
      ? statusBridge.listener
      : {};

    const mindrayInfo = listener.mindray || {};
    const sysmexInfo = listener.sysmex || {};
    const wondfoInfo = listener.wondfo || {};
    const apiInfo = listener.api || {};

    const totalSampel = statusBridge?.total_samples ?? (daftarSampel.length || 0);
    const totalParameter = statusBridge?.total_tests ?? daftarSampel.reduce((acc, s) => acc + (Array.isArray(s.hasil) ? s.hasil.length : 0), 0);
    const terakhirWaktu = statusBridge?.last_sample_time || (daftarSampel[0]?.waktu) || '-';

    // Elemen Metrik
    const elTotSampel = document.getElementById('statTotalSampel');
    const elTotParam = document.getElementById('statTotalParameter');
    const elTerakhir = document.getElementById('statTerakhirTerima');
    const elAlatStatus = document.getElementById('statAlatTerkoneksi');

    if (elTotSampel) elTotSampel.textContent = totalSampel;
    if (elTotParam) elTotParam.textContent = totalParameter;
    if (elTerakhir) elTerakhir.textContent = terakhirWaktu;
    if (elAlatStatus) {
      if (isBridgeConnected) {
        elAlatStatus.textContent = sumberData === 'supabase' ? 'Online (via DB)' : 'Siaga (Standby)';
      } else {
        elAlatStatus.textContent = 'Bridge Offline';
      }
    }

    // Badge status di Header
    const badgeMindray = document.getElementById('badgePortMindray');
    const badgeSysmex = document.getElementById('badgePortSysmex');
    const badgeWondfo = document.getElementById('badgePortWondfo');
    const badgeBridge = document.getElementById('badgePortBridge');

    // 1. Mindray BS-240 (Port 7118)
    if (badgeMindray) {
      const port = mindrayInfo.port || 7118;
      const aktif = isBridgeConnected && (
        String(mindrayInfo.status).toUpperCase() === 'AKTIF' ||
        port === 7118
      );
      badgeMindray.className = `lis-badge-pill ${aktif ? 'online' : 'offline'}`;
      badgeMindray.textContent = aktif ? `Port ${port} Online` : `Port ${port} Offline`;
    }

    // 2. Sysmex XP-100 (Port 8005)
    if (badgeSysmex) {
      const port = sysmexInfo.port || 8005;
      const aktif = isBridgeConnected && (
        String(sysmexInfo.status).toUpperCase() === 'AKTIF' ||
        port === 8005 ||
        port === 8000
      );
      badgeSysmex.className = `lis-badge-pill ${aktif ? 'online' : 'offline'}`;
      badgeSysmex.textContent = aktif ? `Port ${port} Online` : `Port ${port} Offline`;
    }

    // 3. Wondfo III Plus (Port 8001)
    if (badgeWondfo) {
      const port = wondfoInfo.port || 8001;
      const aktif = isBridgeConnected && (
        String(wondfoInfo.status).toUpperCase() === 'AKTIF' ||
        port === 8001 ||
        statusBridge?.port_8001 === true ||
        statusBridge?.wondfo_siap === true
      );
      badgeWondfo.className = `lis-badge-pill ${aktif ? 'online' : 'offline'}`;
      badgeWondfo.textContent = aktif ? `Port ${port} Online` : `Port ${port} Offline`;
    }

    // 4. REST API Bridge (Port 7119)
    if (badgeBridge) {
      const port = apiInfo.port || 7119;
      badgeBridge.className = `lis-badge-pill ${isBridgeConnected ? 'online' : 'offline'}`;
      badgeBridge.textContent = isBridgeConnected ? `Bridge ${port} Online` : `Bridge ${port} Offline`;
    }
  }

  // Merender daftar sampel di panel kiri
  function renderDaftarSampel() {
    const wadah = document.getElementById('wadahDaftarSampel');
    const badgeCount = document.getElementById('badgeJumlahSampel');
    if (!wadah) return;

    let filtered = daftarSampel;

    // 1. Filter Tanggal Presisi
    if (filterTanggal) {
      filtered = filtered.filter(s => {
        let tglStr = '';
        if (s.waktu_terima) {
          const d = new Date(s.waktu_terima);
          if (!isNaN(d.getTime())) {
            tglStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        }
        if (!tglStr && s.created_at) {
          const d = new Date(s.created_at);
          if (!isNaN(d.getTime())) {
            tglStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        }
        if (!tglStr && s.waktu) {
          const m = s.waktu.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (m) {
            tglStr = `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
          } else {
            const m2 = s.waktu.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
            if (m2) {
              tglStr = `${m2[1]}-${String(m2[2]).padStart(2, '0')}-${String(m2[3]).padStart(2, '0')}`;
            }
          }
        }
        return tglStr === filterTanggal;
      });
    }

    // 2. Filter Kata Kunci
    if (filterKata) {
      const q = filterKata.toLowerCase();
      filtered = filtered.filter(s =>
        String(s.sample_id || '').toLowerCase().includes(q) ||
        String(s.nama_pasien || '').toLowerCase().includes(q) ||
        String(s.alat || '').toLowerCase().includes(q) ||
        String(s.metadata?.patient_id || '').toLowerCase().includes(q) ||
        String(s.waktu || '').toLowerCase().includes(q) ||
        String(s.waktu_terima || '').toLowerCase().includes(q)
      );
    }

    // 3. Filter Alat
    if (filterAlat) {
      filtered = filtered.filter(s => String(s.alat || '').toLowerCase().includes(filterAlat.toLowerCase()));
    }

    if (badgeCount) badgeCount.textContent = filtered.length;

    // Render Banner Peringatan Penumpukan Data (> 50 sampel)
    const wadahWarning = document.getElementById('wadahWarningOverflow');
    if (wadahWarning) {
      if (filtered.length > 50 && !alertBannerDitutup) {
        wadahWarning.innerHTML = `
          <div class="lis-overflow-warning" id="bannerOverflowSampel" style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:10px 12px; margin-bottom:8px; font-size:11.5px; color:#92400e; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; align-items:flex-start; gap:8px;">
              <span style="color:#d97706; flex-shrink:0; margin-top:2px;">${UI.ikon('peringatan', 16)}</span>
              <div style="flex:1; line-height:1.45;">
                <b>Perhatian:</b> Terdapat <b>${filtered.length}</b> sampel pada daftar ini. Bersihkan sampel yang sudah ditarik ke form lab agar daftar tetap rapi dan performa tetap ringan.
              </div>
            </div>
            <div style="display:flex; gap:6px; justify-content:flex-end; align-items:center; margin-top:2px;">
              <button class="btn btn-sm" id="btnBersihkanSelesai" style="font-size:10.5px; padding:3px 8px; background:#d97706; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;">
                ${UI.ikon('hapus', 11)} Bersihkan Sampel Selesai
              </button>
              <button class="btn btn-ghost btn-sm" id="btnTutupBannerOverflow" style="font-size:10.5px; padding:3px 6px; color:#78350f; cursor:pointer;">
                Tutup
              </button>
            </div>
          </div>
        `;
        const btnSelesai = wadahWarning.querySelector('#btnBersihkanSelesai');
        if (btnSelesai) btnSelesai.onclick = () => bersihkanSampelSelesai();
        const btnTutup = wadahWarning.querySelector('#btnTutupBannerOverflow');
        if (btnTutup) btnTutup.onclick = () => {
          alertBannerDitutup = true;
          wadahWarning.innerHTML = '';
        };
      } else {
        wadahWarning.innerHTML = '';
      }
    }

    if (!filtered.length) {
      const infoTgl = filterTanggal ? ` pada Tanggal ${UI.esc(filterTanggal)}` : '';
      wadah.innerHTML = `
        <div class="lis-empty-card">
          <div style="color:#94a3b8; margin-bottom:8px;">${UI.ikon('lab', 36)}</div>
          <div style="font-weight:700; color:#334155; font-size:13px;">Belum Ada Sampel Masuk${infoTgl}</div>
          <div style="font-size:11.5px; color:#64748b; margin-top:6px; max-width:290px; text-align:center; line-height:1.45;">
            Menunggu transmisi data dari alat medis. Pastikan kabel LAN terhubung dan lakukan pengiriman via menu Export / LIS di alat (Mindray BS-240, Sysmex XP-100, Wondfo III Plus).
          </div>
        </div>
      `;
      return;
    }

    const html = filtered.map(s => {
      const isAktif = sampelTerpilih && String(sampelTerpilih.sample_id) === String(s.sample_id);
      const isMindray = (s.alat || '').toLowerCase().includes('mindray');
      const isSysmex = (s.alat || '').toLowerCase().includes('sysmex');
      const isWondfo = (s.alat || '').toLowerCase().includes('wondfo');
      const jmlParam = Array.isArray(s.hasil) ? s.hasil.length : 0;
      let alatClass = 'tag-mindray';
      if (isWondfo) alatClass = 'tag-wondfo';
      else if (isSysmex) alatClass = 'tag-sysmex';

      const isTerhubung = String(s.status_mapping || '').toUpperCase() === 'TERPETAKAN' ||
                          String(s.status_mapping || '').toUpperCase() === 'SELESAI' ||
                          String(s.status_mapping || '').toUpperCase() === 'TERHUBUNG' ||
                          s.terhubung === true;
      const badgeStatusHtml = isTerhubung
        ? `<span class="lis-badge-status status-terhubung" title="Hasil sampel sudah terhubung/diproses ke form lab">${UI.ikon('centang', 10)} Terhubung Form</span>`
        : `<span class="lis-badge-status status-baru" title="Sampel baru masuk dari alat dan belum diproses">${UI.ikon('jam', 10)} Belum Diproses</span>`;

      return `
        <div class="lis-sample-item ${isAktif ? 'aktif' : ''}" data-sid="${UI.esc(s.sample_id)}" data-rid="${UI.esc(s.id || '')}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="lis-sample-id">${UI.esc(s.sample_id)}</span>
            <div style="display:flex; align-items:center; gap:4px;">
              <span class="lis-sample-time">${UI.esc(s.waktu ? (s.waktu.split(' ')[1] || s.waktu) : '-')}</span>
              <button class="btn-hapus-sampel" data-sid="${UI.esc(s.sample_id)}" data-rid="${UI.esc(s.id || '')}" title="Hapus sampel ini" style="background:none; border:none; cursor:pointer; color:#ef4444; padding:2px 4px; font-size:12px; line-height:1; border-radius:4px; display:inline-flex; align-items:center;">
                ${UI.ikon('x', 11)}
              </button>
            </div>
          </div>
          <div style="font-weight:700; font-size:13px; color:#0f172a; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${UI.esc(s.nama_pasien || 'Pasien Tanpa Nama')}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-top:2px;">
            <div style="display:flex; align-items:center; gap:4px;">
              <span class="lis-sample-tag ${alatClass}">${UI.esc(s.alat || 'Alat Medis')}</span>
              ${badgeStatusHtml}
            </div>
            <span style="color:#64748b; font-weight:600;">${jmlParam} Param</span>
          </div>
        </div>
      `;
    }).join('');

    wadah.innerHTML = html;

    wadah.querySelectorAll('.lis-sample-item').forEach(elItem => {
      elItem.onclick = (e) => {
        // Jangan pilih kalau klik tombol hapus
        if (e.target.closest('.btn-hapus-sampel')) return;
        const sid = elItem.dataset.sid;
        const target = daftarSampel.find(s => String(s.sample_id) === String(sid));
        if (target) {
          sampelTerpilih = target;
          renderDaftarSampel();
          renderDetailSampel();
          tambahLog('INFO', `Inspeksi sampel #${target.sample_id} (${target.alat || 'Alat'}).`);
        }
      };
    });

    // Pasang handler hapus dengan dialog konfirmasi aman
    wadah.querySelectorAll('.btn-hapus-sampel').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const sid = btn.dataset.sid;
        const target = daftarSampel.find(s => String(s.sample_id) === String(sid));
        if (target) {
          await konfirmasiHapusSampel(target);
        }
      };
    });
  }

  // Merender detail sampel terpilih di panel kanan
  function renderDetailSampel() {
    const wadah = document.getElementById('wadahDetailSampel');
    if (!wadah) return;

    if (!sampelTerpilih) {
      wadah.innerHTML = `
        <div class="lis-empty-card" style="height:100%;">
          <div style="color:#94a3b8; margin-bottom:8px;">${UI.ikon('lab', 40)}</div>
          <div style="font-weight:700; color:#334155; font-size:14px;">Pilih Sampel dari Panel Kiri</div>
          <div style="font-size:11.5px; color:#64748b; margin-top:4px;">
            Klik salah satu kartu sampel di sebelah kiri untuk melihat rincian pengujian dan status pemetaan master ref lab.
          </div>
        </div>
      `;
      return;
    }

    const s = sampelTerpilih;
    const items = Array.isArray(s.hasil) ? s.hasil : [];
    const meta = s.metadata || {};
    const mapKode = ambilMapKode();

    const noRm = meta.patient_id || s.sample_id || '-';
    const gender = meta.gender === 'M' ? 'Laki-laki' : (meta.gender === 'F' ? 'Perempuan' : (meta.gender || '-'));
    const age = meta.age ? (meta.age.length === 8 ? `${meta.age.slice(0, 4)}-${meta.age.slice(4, 6)}-${meta.age.slice(6, 8)}` : meta.age) : '-';

    const barisTabel = items.map((item, idx) => {
      const rawCode = (item.test_name || '').toUpperCase().trim();
      const rawDesc = item.test_desc || rawCode;
      let rawVal = item.value || '';
      const unit = item.unit || '-';
      const refRangeAlat = item.ref_range || '-';
      const flag = (item.flag || 'N').toUpperCase().trim();

      // Format dan bulatkan nilai jika alat adalah Mindray BS-240
      const isMindray = !s.alat || s.alat.toLowerCase().includes('mindray');
      if (isMindray) {
        rawVal = formatNilaiMindray(`${rawCode} ${rawDesc}`, rawVal);
      }

      // Cari kesesuaian di refLabMaster
      const aliases = mapKode[rawCode] || [rawCode];
      const matched = refLabMaster.find(r => {
        const rNama = (r.nama || '').trim().toLowerCase();
        const rKode = (r.kode || '').trim().toUpperCase();
        return aliases.some(a => a.toLowerCase() === rNama) ||
               rNama === rawCode.toLowerCase() ||
               rKode === rawCode;
      });

      const isMapped = !!matched;
      const namaRef = isMapped ? UI.esc(matched.nama) : '<span style="color:#94a3b8; font-style:italic;">Belum Ada</span>';
      const kelompokRef = isMapped ? (matched.kelompok || 'Umum') : '-';
      const rujukanDb = isMapped && Array.isArray(matched.rujukan) && matched.rujukan.length
        ? matched.rujukan.map(x => `${UI.esc(x.jenis_kelamin || '*')}: ${UI.esc(x.nilai_min || '0')} - ${UI.esc(x.nilai_max || '0')} ${UI.esc(matched.satuan || '')}`).join('<br>')
        : (isMapped && matched.satuan ? UI.esc(matched.satuan) : '-');

      // Tentukan badge flag
      let badgeFlag = `<span class="flag-badge flag-n">NORMAL</span>`;
      if (flag === 'H' || flag === 'HIGH') badgeFlag = `<span class="flag-badge flag-h">HIGH</span>`;
      else if (flag === 'L' || flag === 'LOW') badgeFlag = `<span class="flag-badge flag-l">LOW</span>`;
      else if (flag === 'A' || flag === 'CRITICAL') badgeFlag = `<span class="flag-badge flag-c">CRITICAL</span>`;

      return `
        <tr>
          <td style="text-align:center; color:#64748b; font-weight:600;">${idx + 1}</td>
          <td>
            <div style="font-weight:700; color:#0f172a; font-size:12px;">${UI.esc(rawDesc)}</div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:10.5px; color:#0284c7; font-weight:600;">${UI.esc(rawCode)}</div>
          </td>
          <td style="text-align:right;">
            <span style="font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:800; color:#0d9488;">${UI.esc(rawVal)}</span>
          </td>
          <td><span style="color:#475569; font-size:11px;">${UI.esc(unit)}</span></td>
          <td style="font-size:11px; color:#475569;">${UI.esc(refRangeAlat)}</td>
          <td style="text-align:center;">${badgeFlag}</td>
          <td>
            <div style="font-weight:600; color:#0f172a; font-size:11.5px;">${namaRef}</div>
            <div style="font-size:10.5px; color:#64748b;">${UI.esc(kelompokRef)}</div>
          </td>
          <td style="text-align:center;">
            <span class="lis-map-badge ${isMapped ? 'mapped' : 'unmapped'}">
              ${isMapped ? 'Terpetakan' : 'Belum'}
            </span>
          </td>
          <td style="font-size:10.5px; color:#475569;">${rujukanDb}</td>
        </tr>
      `;
    }).join('');

    const rawMsg = s.raw_hl7 || '';
    let tagAlatClass = 'tag-mindray';
    if ((s.alat || '').toLowerCase().includes('wondfo')) tagAlatClass = 'tag-wondfo';
    else if ((s.alat || '').toLowerCase().includes('sysmex')) tagAlatClass = 'tag-sysmex';

    wadah.innerHTML = `
      <!-- HEADER DETAIL -->
      <div class="lis-detail-header">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="lis-badge-sample-lg">${UI.esc(s.sample_id)}</span>
              <span class="lis-sample-tag ${tagAlatClass}" style="font-size:11px;">
                ${UI.esc(s.alat || 'Mindray BS-240')}
              </span>
              <span style="font-size:11.5px; color:#64748b;">Diterima: ${UI.esc(s.waktu || '-')}</span>
            </div>
            <h2 style="margin:6px 0 0 0; font-size:18px; font-weight:800; color:#0f172a;">
              ${UI.esc(s.nama_pasien || 'Pasien Uji')}
            </h2>
          </div>

          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" id="btnSalinJSON" title="Salin payload JSON ke clipboard">
              ${UI.ikon('dokumen', 13)} JSON
            </button>
            <button class="btn btn-secondary btn-sm" id="btnEksporCSV" title="Unduh hasil tes dalam format CSV">
              ${UI.ikon('unduh', 13)} CSV
            </button>
            <button class="btn btn-primary btn-sm" id="btnBukaModulLab" title="Buka dan isi data ini di form pemeriksaan lab">
              ${UI.ikon('periksa', 13)} Form Lab
            </button>
          </div>
        </div>

        <!-- METADATA GRID -->
        <div class="lis-meta-grid">
          <div>
            <span class="lbl">No. Rekam Medis / Ref:</span>
            <span class="val font-mono">${UI.esc(noRm)}</span>
          </div>
          <div>
            <span class="lbl">Jenis Kelamin:</span>
            <span class="val">${UI.esc(gender)}</span>
          </div>
          <div>
            <span class="lbl">Usia / Tgl Lahir:</span>
            <span class="val">${UI.esc(age)}</span>
          </div>
          <div>
            <span class="lbl">Total Parameter:</span>
            <span class="val font-bold text-teal">${items.length} Parameter</span>
          </div>
        </div>
      </div>

      <!-- TABEL PARAMETER HASIL -->
      <div style="flex:1; overflow-y:auto; padding:10px 14px; background:#fff;">
        <table class="table lis-table" style="font-size:11px; width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="width:35px; text-align:center;">#</th>
              <th>Parameter / Kode Alat</th>
              <th style="width:90px; text-align:right;">Nilai Hasil</th>
              <th style="width:75px;">Satuan</th>
              <th style="width:90px;">Rujukan Alat</th>
              <th style="width:80px; text-align:center;">Flag</th>
              <th>Mapping Ref Lab</th>
              <th style="width:95px; text-align:center;">Status</th>
              <th style="width:140px;">Rujukan DB</th>
            </tr>
          </thead>
          <tbody>
            ${barisTabel || '<tr><td colspan="9" style="text-align:center; color:#94a3b8; padding:20px;">Tidak ada parameter hasil dalam rekaman ini.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- RAW HL7 / ASTM VIEWER ACCORDION -->
      <div class="lis-raw-section">
        <button class="lis-raw-toggle" id="btnToggleRaw">
          <span>${rawBuka ? 'Sembunyikan' : 'Lihat'} Data Mentah Transmisi Alat (Raw HL7 / ASTM)</span>
          <span style="font-size:10px; color:#64748b;">${rawMsg ? `${rawMsg.length} bytes` : 'kosong'}</span>
        </button>
        <div class="lis-raw-content ${rawBuka ? 'buka' : ''}" id="boxRawContent">
          <pre>${UI.esc(rawMsg || 'Tidak ada payload raw message tersimpan untuk sampel ini.')}</pre>
        </div>
      </div>
    `;

    // Pasang tombol aksi detail
    const btnRaw = wadah.querySelector('#btnToggleRaw');
    if (btnRaw) {
      btnRaw.onclick = () => {
        rawBuka = !rawBuka;
        const box = wadah.querySelector('#boxRawContent');
        if (box) box.classList.toggle('buka', rawBuka);
        btnRaw.querySelector('span').textContent = `${rawBuka ? 'Sembunyikan' : 'Lihat'} Data Mentah Transmisi Alat (Raw HL7 / ASTM)`;
      };
    }

    const btnJson = wadah.querySelector('#btnSalinJSON');
    if (btnJson) {
      btnJson.onclick = () => {
        const isMindray = !s.alat || s.alat.toLowerCase().includes('mindray');
        const salinanS = JSON.parse(JSON.stringify(s));
        if (isMindray && Array.isArray(salinanS.hasil)) {
          salinanS.hasil = salinanS.hasil.map(h => ({
            ...h,
            value: formatNilaiMindray(`${h.test_name || ''} ${h.test_desc || ''}`, h.value)
          }));
        }
        navigator.clipboard.writeText(JSON.stringify(salinanS, null, 2)).then(() => {
          UI.toast('Payload JSON berhasil disalin ke clipboard.', 'ok');
        });
      };
    }

    const btnCsv = wadah.querySelector('#btnEksporCSV');
    if (btnCsv) {
      btnCsv.onclick = () => eksporCSVSampel(s);
    }

    const btnLab = wadah.querySelector('#btnBukaModulLab');
    if (btnLab) {
      btnLab.onclick = () => {
        window.location.hash = `#lab?cari=${encodeURIComponent(s.sample_id)}`;
        UI.toast(`Membuka modul lab untuk sampel #${s.sample_id}...`, 'info');
      };
    }
  }

  // Ekspor hasil sampel terpilih ke file CSV lokal
  function eksporCSVSampel(sampel) {
    if (!sampel || !Array.isArray(sampel.hasil)) return;
    const isMindray = !sampel.alat || sampel.alat.toLowerCase().includes('mindray');
    const baris = [
      ['Sample_ID', 'Nama_Pasien', 'Alat', 'Waktu', 'Parameter', 'Kode', 'Nilai', 'Satuan', 'Flag', 'Ref_Range']
    ];

    sampel.hasil.forEach(h => {
      const rawCode = (h.test_name || '').toUpperCase().trim();
      const rawDesc = h.test_desc || rawCode;
      let val = h.value || '';
      if (isMindray) {
        val = formatNilaiMindray(`${rawCode} ${rawDesc}`, val);
      }
      baris.push([
        sampel.sample_id,
        sampel.nama_pasien || '',
        sampel.alat || '',
        sampel.waktu || '',
        rawDesc,
        rawCode,
        val,
        h.unit || '',
        h.flag || '',
        h.ref_range || ''
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + baris.map(e => e.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `hasil_alat_${sampel.sample_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    UI.toast('Berkas CSV berhasil diunduh.', 'ok');
  }

  // Merender log terminal dark monospace console
  function renderLogConsole(el) {
    if (!el) return;
    if (!daftarLog.length) {
      el.innerHTML = '<div style="color:#64748b; font-style:italic;">Belum ada riwayat aktivitas log. Klik "Cek Koneksi" untuk memulai diagnosa.</div>';
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
        <div style="margin-bottom:4px; line-height:1.45; word-break:break-all;">
          <span style="color:#64748b;">[${item.waktu}]</span>
          <span style="color:${warnaTipe}; font-weight:700; margin:0 4px;">[${item.tipe}]</span>
          <span>${UI.esc(item.pesan)}</span>
          ${payloadHtml}
        </div>
      `;
    }).join('');

    el.innerHTML = html;
  }

  // Mengirim simulasi Mindray BS-240 lengkap ke bridge
  async function kirimSimulasiBS240(customSid = '') {
    const sid = customSid.trim() || ('2609' + String(Math.floor(1000 + Math.random() * 9000)));
    const pasienNama = 'Tn. Budi Santoso (Uji BS-240)';

    // Dataset realistis kimia darah Mindray BS-240
    const payload = {
      sample_id: sid,
      nama_pasien: pasienNama,
      alat: 'Mindray BS-240',
      metadata: {
        patient_id: 'RM-' + sid.slice(-4),
        gender: 'M',
        age: '19850714'
      },
      hasil: [
        { test_name: 'GLU-S', test_desc: 'Glucose', value: (100 + Math.floor(Math.random() * 50)).toString(), unit: 'mg/dL', ref_range: '70-110', flag: 'N' },
        { test_name: 'TC', test_desc: 'Cholesterol Total', value: (170 + Math.floor(Math.random() * 60)).toString(), unit: 'mg/dL', ref_range: '130-200', flag: 'H' },
        { test_name: 'TG', test_desc: 'Triglycerides', value: (130 + Math.floor(Math.random() * 70)).toString(), unit: 'mg/dL', ref_range: '50-150', flag: 'N' },
        { test_name: 'HDL-C', test_desc: 'HDL Cholesterol', value: '45.2', unit: 'mg/dL', ref_range: '>40', flag: 'N' },
        { test_name: 'UA', test_desc: 'Uric Acid', value: '6.4', unit: 'mg/dL', ref_range: '3.4-7.0', flag: 'N' },
        { test_name: 'UREA', test_desc: 'Urea', value: '26.8', unit: 'mg/dL', ref_range: '15-45', flag: 'N' },
        { test_name: 'CREA-S', test_desc: 'Creatinine', value: '0.92', unit: 'mg/dL', ref_range: '0.6-1.2', flag: 'N' },
        { test_name: 'ALT', test_desc: 'Alanine Aminotransferase (SGPT)', value: '32.0', unit: 'U/L', ref_range: '0-41', flag: 'N' },
        { test_name: 'AST', test_desc: 'Aspartate Aminotransferase (SGOT)', value: '28.5', unit: 'U/L', ref_range: '0-38', flag: 'N' },
        { test_name: 'ALP', test_desc: 'Alkaline Phosphatase', value: '92.4', unit: 'U/L', ref_range: '40-130', flag: 'N' },
        { test_name: 'TP', test_desc: 'Total Protein', value: '7.4', unit: 'g/dL', ref_range: '6.4-8.3', flag: 'N' },
        { test_name: 'ALB II', test_desc: 'Albumin', value: '4.5', unit: 'g/dL', ref_range: '3.5-5.2', flag: 'N' }
      ]
    };

    tambahLog('INFO', `Mengirim paket simulasi Mindray BS-240 untuk Sample #${sid}...`, payload);

    try {
      const res = await fetch(`${BRIDGE_HOST}/api/simulasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const j = await res.json();
        tambahLog('SUCCESS', `Simulasi Mindray BS-240 sukses diterima oleh bridge! Total ${payload.hasil.length} parameter.`, j);
        UI.toast(`Simulasi paket Mindray BS-240 #${sid} berhasil dikirim!`, 'ok');
        await periksaStatusListener(true);
      } else {
        tambahLog('WARN', `Simulasi Mindray ditolak oleh bridge (HTTP ${res.status})`);
        UI.toast(`Simulasi gagal: HTTP ${res.status}`, 'warn');
      }
    } catch (e) {
      tambahLog('ERROR', `Gagal mengirim simulasi ke bridge: ${e.message}. Pastikan bridge aktif.`);
      UI.toast('Gagal terhubung ke LIS Bridge.', 'err');
    }
  }

  // Mengirim simulasi Sysmex XP-100 ke bridge
  async function kirimSimulasiSysmex(customSid = '') {
    const sid = customSid.trim() || ('2609' + String(Math.floor(1000 + Math.random() * 9000)));
    const pasienNama = 'Ny. Siti Rahayu (Uji Sysmex)';

    const payload = {
      sample_id: sid,
      nama_pasien: pasienNama,
      alat: 'Sysmex XP-100',
      metadata: {
        patient_id: 'RM-' + sid.slice(-4),
        gender: 'F',
        age: '19900820'
      },
      hasil: [
        { test_name: 'WBC', test_desc: 'Leukosit', value: '7.85', unit: '10^3/uL', ref_range: '4.0-10.0', flag: 'N' },
        { test_name: 'RBC', test_desc: 'Eritrosit', value: '4.65', unit: '10^6/uL', ref_range: '3.8-5.8', flag: 'N' },
        { test_name: 'HGB', test_desc: 'Hemoglobin', value: '13.8', unit: 'g/dL', ref_range: '12.0-16.0', flag: 'N' },
        { test_name: 'HCT', test_desc: 'Hematokrit', value: '41.2', unit: '%', ref_range: '37.0-48.0', flag: 'N' },
        { test_name: 'PLT', test_desc: 'Trombosit', value: '275', unit: '10^3/uL', ref_range: '150-450', flag: 'N' },
        { test_name: 'MCV', test_desc: 'MCV', value: '88.6', unit: 'fL', ref_range: '80.0-97.0', flag: 'N' },
        { test_name: 'MCH', test_desc: 'MCH', value: '29.7', unit: 'pg', ref_range: '27.0-32.0', flag: 'N' },
        { test_name: 'MCHC', test_desc: 'MCHC', value: '33.5', unit: 'g/dL', ref_range: '32.0-36.0', flag: 'N' },
        { test_name: 'LYM%', test_desc: 'Limfosit', value: '31.5', unit: '%', ref_range: '20.0-40.0', flag: 'N' },
        { test_name: 'NEUT%', test_desc: 'Neutrofil', value: '59.2', unit: '%', ref_range: '50.0-70.0', flag: 'N' },
        { test_name: 'MXD%', test_desc: 'Monosit/Lainnya', value: '9.3', unit: '%', ref_range: '3.0-14.0', flag: 'N' }
      ]
    };

    tambahLog('INFO', `Mengirim paket simulasi Sysmex XP-100 untuk Sample #${sid}...`, payload);

    try {
      const res = await fetch(`${BRIDGE_HOST}/api/simulasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const j = await res.json();
        tambahLog('SUCCESS', `Simulasi Sysmex XP-100 sukses diproses bridge. Total ${payload.hasil.length} parameter.`, j);
        UI.toast(`Simulasi paket Sysmex XP-100 #${sid} berhasil dikirim!`, 'ok');
        await periksaStatusListener(true);
      } else {
        tambahLog('WARN', `Simulasi Sysmex ditolak (HTTP ${res.status})`);
        UI.toast(`Simulasi gagal: HTTP ${res.status}`, 'warn');
      }
    } catch (e) {
      tambahLog('ERROR', `Gagal mengirim simulasi ke bridge: ${e.message}`);
      UI.toast('Gagal terhubung ke LIS Bridge.', 'err');
    }
  }

  // Mengirim simulasi Wondfo III Plus ke bridge
  async function kirimSimulasiWondfo(customSid = '') {
    const sid = customSid.trim() || ('00' + String(Math.floor(10 + Math.random() * 90)));
    const pasienNama = 'Tn. Hendra Wijaya (Uji Wondfo)';

    const payload = {
      sample_id: sid,
      nama_pasien: pasienNama,
      alat: 'Wondfo III Plus',
      metadata: {
        patient_id: 'RM-' + sid,
        gender: 'M',
        age: '19780512',
        sample_type: 'URINE'
      },
      hasil: [
        {
          test_name: 'MAU',
          test_desc: 'Mikroalbumin Urin (MAU)',
          value: '25.3',
          unit: 'mg/L',
          ref_range: '0-20.0',
          flag: 'H'
        }
      ]
    };

    tambahLog('INFO', `Mengirim paket simulasi Wondfo III Plus untuk Sample #${sid}...`, payload);

    try {
      const res = await fetch(`${BRIDGE_HOST}/api/simulasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const j = await res.json();
        tambahLog('SUCCESS', `Simulasi Wondfo III Plus sukses diproses bridge. Parameter: MAU = 25.3 mg/L (H).`, j);
        UI.toast(`Simulasi paket Wondfo III Plus #${sid} berhasil dikirim!`, 'ok');
        await periksaStatusListener(true);
      } else {
        tambahLog('WARN', `Simulasi Wondfo ditolak (HTTP ${res.status})`);
        UI.toast(`Simulasi gagal: HTTP ${res.status}`, 'warn');
      }
    } catch (e) {
      tambahLog('ERROR', `Gagal mengirim simulasi Wondfo ke bridge: ${e.message}`);
      UI.toast('Gagal terhubung ke LIS Bridge.', 'err');
    }
  }

  // Membersihkan buffer riwayat di bridge
  async function bersihkanBufferBridge() {
    const yakin = await UI.modal({
      judul: 'Konfirmasi Reset Buffer',
      isi: `
        <div style="font-size:12.5px; color:#334155; line-height:1.5;">
          <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:12px; margin-bottom:12px;">
            <div style="font-weight:700; color:#92400e; margin-bottom:3px; font-size:13px;">
              Reset Buffer LIS Bridge
            </div>
            <div style="font-size:11.5px; color:#78350f;">
              Apakah Anda yakin ingin mengosongkan antrean buffer sampel aktif pada LIS Bridge? Tindakan ini hanya mengosongkan memori sementara dan tidak menghapus database permanen.
            </div>
          </div>
        </div>
      `,
      tombol: [
        { teks: 'Batal', nilai: false, kelas: 'btn-secondary' },
        { teks: 'Ya, Reset Buffer', nilai: true, kelas: 'btn-danger' }
      ]
    });

    if (yakin !== true) return;

    try {
      const res = await fetch(`${BRIDGE_HOST}/api/clear`, { method: 'POST' });
      if (res.ok) {
        daftarSampel = [];
        sampelTerpilih = null;
        renderDaftarSampel();
        renderDetailSampel();
        perbaruiUIStatus();
        tambahLog('INFO', 'Buffer riwayat sampel pada LIS Bridge berhasil di-reset.');
        UI.toast('Riwayat sampel berhasil dibersihkan.', 'ok');
      }
    } catch (e) {
      // Fallback lokal
      daftarSampel = [];
      sampelTerpilih = null;
      renderDaftarSampel();
      renderDetailSampel();
      UI.toast('Buffer lokal dibersihkan.', 'info');
    }
  }

  // Menghapus satu riwayat sampel dari Supabase dan bridge
  async function hapusSampelRiwayat(recordId, sampleId = '') {
    try {
      // 1. Sinkronisasi hapus ke bridge lokal jika terhubung ke PC Lab
      if (sumberData === 'lokal') {
        try {
          await fetch(`${BRIDGE_HOST}/api/hapus-riwayat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: recordId, sample_id: sampleId })
          });
        } catch (_) {}
      }

      // 2. Hapus dari database Supabase (tabel lis_riwayat_sampel & lis_samples)
      const targetKunci = recordId || sampleId;
      await DB.hapusRiwayatSampelLIS(targetKunci);

      // 3. Hapus secara instan dari state lokal
      daftarSampel = daftarSampel.filter(s => {
        if (recordId && s.id === recordId) return false;
        if (sampleId && String(s.sample_id) === String(sampleId)) return false;
        if (String(s.sample_id) === String(targetKunci)) return false;
        return true;
      });

      if (sampelTerpilih && (
        (recordId && sampelTerpilih.id === recordId) ||
        (sampleId && String(sampelTerpilih.sample_id) === String(sampleId)) ||
        (String(sampelTerpilih.sample_id) === String(targetKunci))
      )) {
        sampelTerpilih = daftarSampel[0] || null;
      }

      renderDaftarSampel();
      renderDetailSampel();
      perbaruiUIStatus();

      const labelId = sampleId || recordId || '';
      tambahLog('SUCCESS', `Sampel #${labelId} berhasil dihapus dari database.`);
      UI.toast(`Sampel #${labelId} berhasil dihapus.`, 'ok');
    } catch (e) {
      tambahLog('ERROR', `Gagal menghapus riwayat: ${e.message}`);
      UI.toast('Gagal menghapus riwayat sampel.', 'err');
    }
  }

  // Modal dialog konfirmasi hapus sampel yang aman
  async function konfirmasiHapusSampel(sampel) {
    if (!sampel) return;
    const sid = sampel.sample_id || '-';
    const nama = sampel.nama_pasien || 'Pasien Tanpa Nama';
    const alat = sampel.alat || 'Alat Medis';
    const waktu = sampel.waktu || '-';

    const yakin = await UI.modal({
      judul: 'Konfirmasi Hapus Sampel',
      isi: `
        <div style="font-size:12.5px; color:#334155; line-height:1.5;">
          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:12px; margin-bottom:12px;">
            <div style="font-weight:700; color:#991b1b; margin-bottom:3px; font-size:13px;">
              Apakah Anda yakin ingin menghapus sampel ini?
            </div>
            <div style="font-size:11.5px; color:#7f1d1d;">
              Data yang dihapus akan disinkronkan ke seluruh komputer dan hilang dari antrean LIS.
            </div>
          </div>
          <table style="width:100%; font-size:12px; border-collapse:collapse; margin-bottom:6px;">
            <tr>
              <td style="padding:4px 0; width:100px; color:#64748b; font-weight:600;">Sample ID:</td>
              <td style="padding:4px 0; font-family:'JetBrains Mono',monospace; font-weight:800; color:#0f766e;">${UI.esc(sid)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#64748b; font-weight:600;">Nama Pasien:</td>
              <td style="padding:4px 0; font-weight:700; color:#0f172a;">${UI.esc(nama)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#64748b; font-weight:600;">Asal Alat:</td>
              <td style="padding:4px 0; color:#334155;">${UI.esc(alat)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#64748b; font-weight:600;">Waktu Terima:</td>
              <td style="padding:4px 0; color:#334155;">${UI.esc(waktu)}</td>
            </tr>
          </table>
        </div>
      `,
      tombol: [
        { teks: 'Batal', nilai: false, kelas: 'btn-secondary' },
        { teks: 'Ya, Hapus Sampel', nilai: true, kelas: 'btn-danger' }
      ]
    });

    if (yakin === true) {
      await hapusSampelRiwayat(sampel.id || '', sampel.sample_id);
    }
  }

  // Membersihkan sampel hari-hari lalu (sebelum hari ini pukul 00:00)
  async function bersihkanSampelKemarin() {
    const yakin = await UI.modal({
      judul: 'Bersihkan Sampel Kemarin',
      isi: `
        <div style="font-size:12.5px; color:#334155; line-height:1.5;">
          <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:12px; margin-bottom:12px;">
            <div style="font-weight:700; color:#92400e; margin-bottom:4px; font-size:13px;">
              Pembersihan Riwayat Hari Lalu
            </div>
            <div style="font-size:11.5px; color:#78350f;">
              Tindakan ini akan mengosongkan seluruh sampel yang diterima <b>sebelum hari ini (pukul 00:00)</b> baik di database Supabase maupun di memori LIS. Sampel hari ini tetap dipertahankan.
            </div>
          </div>
          <div style="font-size:11.5px; color:#64748b;">
            Operasi ini akan disinkronkan ke seluruh layar komputer secara otomatis.
          </div>
        </div>
      `,
      tombol: [
        { teks: 'Batal', nilai: false, kelas: 'btn-secondary' },
        { teks: 'Bersihkan Sampel Lalu', nilai: true, kelas: 'btn-danger' }
      ]
    });

    if (yakin !== true) return;

    try {
      UI.toast('Membersihkan sampel hari lalu...', 'info');

      // 1. Hapus di database Supabase
      const resDb = await DB.hapusRiwayatSampelKemarinLIS();

      // 2. Beritahu juga Bridge jika lokal
      if (sumberData === 'lokal') {
        try {
          await fetch(`${BRIDGE_HOST}/api/hapus-kemarin`, { method: 'POST' });
        } catch (_) {}
      }

      // 3. Filter di memori frontend
      const now = new Date();
      const awalHariIni = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      daftarSampel = daftarSampel.filter(s => {
        if (!s.waktu || s.waktu === '-') return true;
        let tSampel = null;
        if (s.waktu_terima) {
          tSampel = new Date(s.waktu_terima);
        } else {
          const m = s.waktu.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (m) {
            tSampel = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
          } else {
            tSampel = new Date(s.waktu);
          }
        }
        if (isNaN(tSampel.getTime())) return true;
        return tSampel >= awalHariIni;
      });

      if (sampelTerpilih && !daftarSampel.some(s => String(s.sample_id) === String(sampelTerpilih.sample_id))) {
        sampelTerpilih = daftarSampel[0] || null;
      }

      renderDaftarSampel();
      renderDetailSampel();
      perbaruiUIStatus();

      const totalHapus = resDb?.total ?? 'beberapa';
      tambahLog('SUCCESS', `Pembersihan sampel kemarin berhasil (${totalHapus} data dihapus).`);
      UI.toast(`Sampel hari lalu berhasil dibersihkan (${totalHapus} data).`, 'ok');
    } catch (e) {
      tambahLog('ERROR', `Gagal membersihkan sampel kemarin: ${e.message}`);
      UI.toast(`Gagal membersihkan sampel: ${e.message}`, 'err');
    }
  }

  // Membersihkan hanya sampel yang statusnya sudah 'Terhubung Form' (selesai ditarik)
  async function bersihkanSampelSelesai() {
    const sampelSelesai = daftarSampel.filter(s =>
      String(s.status_mapping || '').toUpperCase() === 'TERPETAKAN' ||
      String(s.status_mapping || '').toUpperCase() === 'SELESAI' ||
      String(s.status_mapping || '').toUpperCase() === 'TERHUBUNG' ||
      s.terhubung === true
    );

    if (!sampelSelesai.length) {
      UI.toast('Tidak ada sampel berstatus "Terhubung Form" pada daftar.', 'info');
      return;
    }

    const yakin = await UI.modal({
      judul: 'Bersihkan Sampel Selesai',
      isi: `
        <div style="font-size:12.5px; color:#334155; line-height:1.5;">
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:12px; margin-bottom:12px;">
            <div style="font-weight:700; color:#065f46; margin-bottom:4px; font-size:13px;">
              Pembersihan Sampel Terhubung Form
            </div>
            <div style="font-size:11.5px; color:#047857;">
              Ditemukan <b>${sampelSelesai.length}</b> sampel yang sudah dipetakan/ditarik ke form lab pasien. Apakah Anda ingin menghapus sampel-sampel ini dari riwayat LIS agar daftar tetap ringan?
            </div>
          </div>
          <div style="font-size:11.5px; color:#64748b;">
            Sampel baru yang belum diproses tetap aman dan tidak akan terhapus.
          </div>
        </div>
      `,
      tombol: [
        { teks: 'Batal', nilai: false, kelas: 'btn-secondary' },
        { teks: `Ya, Hapus ${sampelSelesai.length} Sampel`, nilai: true, kelas: 'btn-danger' }
      ]
    });

    if (yakin !== true) return;

    try {
      UI.toast(`Membersihkan ${sampelSelesai.length} sampel selesai...`, 'info');

      // 1. Hapus di database Supabase
      const resDb = await DB.hapusRiwayatSampelSelesaiLIS();

      // 2. Beritahu Bridge jika lokal
      if (sumberData === 'lokal') {
        try {
          for (const s of sampelSelesai) {
            await fetch(`${BRIDGE_HOST}/api/hapus-riwayat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: s.id, sample_id: s.sample_id })
            });
          }
        } catch (_) {}
      }

      // 3. Hapus dari memori lokal
      const idSelesai = new Set(sampelSelesai.map(s => String(s.sample_id)));
      daftarSampel = daftarSampel.filter(s => !idSelesai.has(String(s.sample_id)));

      if (sampelTerpilih && idSelesai.has(String(sampelTerpilih.sample_id))) {
        sampelTerpilih = daftarSampel[0] || null;
      }

      renderDaftarSampel();
      renderDetailSampel();
      perbaruiUIStatus();

      const totalHapus = resDb?.total ?? sampelSelesai.length;
      tambahLog('SUCCESS', `Pembersihan sampel selesai sukses (${totalHapus} data dihapus).`);
      UI.toast(`${totalHapus} sampel selesai berhasil dibersihkan.`, 'ok');
    } catch (e) {
      tambahLog('ERROR', `Gagal membersihkan sampel selesai: ${e.message}`);
      UI.toast(`Gagal: ${e.message}`, 'err');
    }
  }

  // Tangani event DELETE dari Supabase Realtime secara instan multi-device
  function tanganiHapusRealtime(payload) {
    const oldRec = payload?.old || {};
    const targetId = oldRec.id;
    const targetSid = oldRec.sample_id;

    if (!targetId && !targetSid) {
      periksaStatusListener(true);
      return;
    }

    const idx = daftarSampel.findIndex(s =>
      (targetId && s.id === targetId) ||
      (targetSid && String(s.sample_id) === String(targetSid))
    );

    let sidDihapus = targetSid;
    if (idx !== -1) {
      const terhapus = daftarSampel.splice(idx, 1)[0];
      sidDihapus = terhapus.sample_id || sidDihapus;
      tambahLog('INFO', `Sampel #${sidDihapus} dihapus dari perangkat lain (Realtime Deletion Sync).`);
    }

    // Hapus elemen kartu sampel dari DOM secara instan
    const wadah = document.getElementById('wadahDaftarSampel');
    if (wadah) {
      let elCard = null;
      if (targetId) elCard = wadah.querySelector(`.lis-sample-item[data-rid="${targetId}"]`);
      if (!elCard && targetSid) elCard = wadah.querySelector(`.lis-sample-item[data-sid="${targetSid}"]`);
      if (!elCard && sidDihapus) elCard = wadah.querySelector(`.lis-sample-item[data-sid="${sidDihapus}"]`);

      if (elCard) {
        elCard.style.transition = 'all 0.22s ease';
        elCard.style.opacity = '0';
        elCard.style.transform = 'translateX(-16px)';
        setTimeout(() => {
          if (elCard && elCard.parentNode) elCard.remove();
          const badgeCount = document.getElementById('badgeJumlahSampel');
          if (badgeCount) badgeCount.textContent = daftarSampel.length;
          const elTot = document.getElementById('statTotalSampel');
          if (elTot) elTot.textContent = daftarSampel.length;
        }, 220);
      } else {
        renderDaftarSampel();
      }
    } else {
      renderDaftarSampel();
    }

    if (sampelTerpilih && (
      (targetId && sampelTerpilih.id === targetId) ||
      (targetSid && String(sampelTerpilih.sample_id) === String(targetSid)) ||
      (sidDihapus && String(sampelTerpilih.sample_id) === String(sidDihapus))
    )) {
      sampelTerpilih = daftarSampel[0] || null;
      renderDetailSampel();
    }

    perbaruiUIStatus();
  }

  // Tangani event INSERT dari Supabase Realtime secara instan
  function tanganiTambahRealtime(payload) {
    const newRec = payload?.new;
    if (!newRec) return;

    // Periksa apakah ada filter tanggal aktif dan apakah tanggal record cocok
    if (filterTanggal && (newRec.waktu_terima || newRec.created_at)) {
      const dt = new Date(newRec.waktu_terima || newRec.created_at);
      const tglRec = !isNaN(dt) ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}` : '';
      if (tglRec && tglRec !== filterTanggal) {
        // Record bukan untuk tanggal yang sedang difilter pengguna
        return;
      }
    }

    const ada = daftarSampel.some(s =>
      (newRec.id && s.id === newRec.id) ||
      (newRec.sample_id && String(s.sample_id) === String(newRec.sample_id))
    );

    if (!ada) {
      const normalRec = {
        id: newRec.id,
        sample_id: newRec.sample_id,
        nama_pasien: newRec.nama_pasien || 'Pasien',
        alat: newRec.alat || '',
        waktu: newRec.waktu_terima ? new Date(newRec.waktu_terima).toLocaleString('id-ID') : '-',
        waktu_terima: newRec.waktu_terima,
        hasil: Array.isArray(newRec.hasil_json) ? newRec.hasil_json : (typeof newRec.hasil_json === 'string' ? JSON.parse(newRec.hasil_json || '[]') : []),
        raw_hl7: newRec.raw_data || '',
        status_mapping: newRec.status_mapping || 'BELUM',
        metadata: {}
      };
      daftarSampel.unshift(normalRec);
      if (!sampelTerpilih) sampelTerpilih = normalRec;
      renderDaftarSampel();
      renderDetailSampel();
      perbaruiUIStatus();
      tambahLog('SUCCESS', `Sampel baru #${newRec.sample_id} diterima secara realtime dari alat.`);
      UI.toast(`Sampel baru #${newRec.sample_id} masuk secara realtime.`, 'ok');
    }
  }

  // Tangani event UPDATE dari Supabase Realtime
  function tanganiUbahRealtime(payload) {
    const updated = payload?.new;
    if (!updated) return;
    const target = daftarSampel.find(s =>
      (updated.id && s.id === updated.id) ||
      (updated.sample_id && String(s.sample_id) === String(updated.sample_id))
    );
    if (target) {
      if (updated.status_mapping) target.status_mapping = updated.status_mapping;
      if (updated.nama_pasien) target.nama_pasien = updated.nama_pasien;
      renderDaftarSampel();
      if (sampelTerpilih && (sampelTerpilih.id === target.id || sampelTerpilih.sample_id === target.sample_id)) {
        renderDetailSampel();
      }
    }
  }

  // Berlangganan Supabase Realtime channel
  function pasangRealtimeSync() {
    if (langgananRealtime) return;

    try {
      const sb = DB.sb;
      if (!sb || typeof sb.channel !== 'function') return;

      // Bersihkan channel yang mungkin tertinggal dari sesi sebelumnya untuk mencegah duplikasi
      if (typeof sb.getChannels === 'function') {
        const exist = sb.getChannels().find(c => c.topic === 'realtime:lis_samples_changes' || c.topic === 'lis_samples_changes');
        if (exist) {
          try { sb.removeChannel(exist); } catch (_) {}
        }
      }

      const ch = sb.channel('lis_samples_changes')
        // Event DELETE tabel lis_samples & lis_riwayat_sampel
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'lis_samples' }, payload => {
          tanganiHapusRealtime(payload);
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'lis_riwayat_sampel' }, payload => {
          tanganiHapusRealtime(payload);
        })
        // Event INSERT tabel lis_riwayat_sampel & lis_samples
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lis_riwayat_sampel' }, payload => {
          tanganiTambahRealtime(payload);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lis_samples' }, payload => {
          tanganiTambahRealtime(payload);
        })
        // Event UPDATE tabel lis_riwayat_sampel & lis_samples
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lis_riwayat_sampel' }, payload => {
          tanganiUbahRealtime(payload);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lis_samples' }, payload => {
          tanganiUbahRealtime(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            tambahLog('INFO', 'Realtime sync LIS aktif (channel: lis_samples_changes).');
          }
        });

      langgananRealtime = () => {
        try { sb.removeChannel(ch); } catch (_) {}
        langgananRealtime = null;
      };
    } catch (e) {
      console.warn('Gagal pasang Realtime sync LIS:', e);
    }
  }

  function lepasRealtimeSync() {
    if (typeof langgananRealtime === 'function') {
      langgananRealtime();
    }
    langgananRealtime = null;
    try {
      const sb = DB.sb;
      if (sb && typeof sb.getChannels === 'function') {
        const exist = sb.getChannels().find(c => c.topic === 'realtime:lis_samples_changes' || c.topic === 'lis_samples_changes');
        if (exist) sb.removeChannel(exist);
      }
    } catch (_) {}
  }

  // Buka modal petunjuk konfigurasi Mindray BS-240
  function bukaModalPanduanMindray() {
    UI.modal({
      judul: 'Panduan Setting Alat Mindray BS-240',
      konten: `
        <div style="font-size:12.5px; line-height:1.5; color:#334155;">
          <p>Konfigurasi koneksi langsung dari komputer ke analyzer <b>Mindray BS-240</b> via kabel LAN Ethernet:</p>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:12px; margin-bottom:12px; font-family:'JetBrains Mono',monospace; font-size:11.5px;">
            <div><b>IP Host PC (Laboratorium):</b> 198.100.100.82 (atau IP LAN PC)</div>
            <div><b>Port Socket HL7:</b> 7118</div>
            <div><b>Protokol Komunikasi:</b> HL7 Standard v2.3.1 (MLLP)</div>
            <div><b>Mode Transmisi:</b> Real-time (Auto Send after analysis)</div>
          </div>
          <h4 style="margin:10px 0 4px 0; color:#0f172a; font-size:13px; font-weight:700;">Langkah Setting di Layar Sentuh BS-240:</h4>
          <ol style="padding-left:20px; margin:0 0 14px 0;">
            <li style="margin-bottom:4px;">Klik menu <b>Setup</b> &rarr; <b>System Setup</b> &rarr; <b>LIS</b>.</li>
            <li style="margin-bottom:4px;">Pilih tab <b>Network Communication</b>.</li>
            <li style="margin-bottom:4px;">Isi <b>Server IP</b> dengan alamat IP PC di atas, dan <b>Port</b> dengan <code>7118</code>.</li>
            <li style="margin-bottom:4px;">Centang opsi <b>Real-time transmission</b> dan <b>Send sample result automatically</b>.</li>
            <li style="margin-bottom:4px;">Klik tombol <b>Connect</b> / <b>Test Connection</b> hingga indikator LIS di sudut layar BS-240 berubah hijau.</li>
          </ol>
          <div class="banner info" style="margin:0;">
            <b>Catatan Bridge:</b> Pastikan file <code>bridge/jalankan_bridge.bat</code> sudah aktif berjalan di komputer ini agar Port 7118 siap menerima transmisi data dari BS-240.
          </div>
        </div>
      `,
      tombol: [{ teks: 'Tutup', nilai: true, kelas: 'btn-secondary' }]
    });
  }

  // Render halaman utama
  async function render(el) {
    // Ambil master ref_lab untuk pemetaan kode
    try {
      refLabMaster = await DB.refLab(true);
    } catch (_) {
      refLabMaster = [];
    }

    el.innerHTML = `
      <style>
        .lis-page-wrap { display: flex; flex-direction: column; gap: 14px; font-family: inherit; }
        .lis-header-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .lis-title { font-size: 19px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; }
        .lis-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
        
        .lis-badge-pill { padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 9999px; display: inline-flex; align-items: center; gap: 6px; }
        .lis-badge-pill.online { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .lis-badge-pill.offline { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

        /* Stats Grid */
        .lis-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
        .lis-stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .lis-stat-num { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.1; margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
        .lis-stat-lbl { font-size: 11.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }
        .lis-stat-icon { width: 38px; height: 38px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }

        /* Dual Pane Workspace */
        .lis-workspace { display: grid; grid-template-columns: 360px 1fr; gap: 14px; min-height: 600px; }
        @media (max-width: 960px) { .lis-workspace { grid-template-columns: 1fr; } }

        /* Pane Kiri */
        .lis-left-pane { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .lis-pane-head { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; background: #fafafa; display: flex; justify-content: space-between; align-items: center; }
        .lis-pane-title { font-weight: 700; font-size: 13.5px; color: #0f172a; display: flex; align-items: center; gap: 6px; }
        .lis-search-bar { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; background: #fff; display: flex; gap: 6px; }
        .lis-sample-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; max-height: 520px; }

        .lis-sample-item { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; cursor: pointer; transition: all 0.15s ease; }
        .lis-sample-item:hover { border-color: #0d9488; background: #f0fdfa; transform: translateY(-1px); }
        .lis-sample-item.aktif { border-color: #0d9488; background: #f0fdfa; box-shadow: 0 0 0 1.5px #0d9488; }
        .lis-sample-id { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 12.5px; color: #0f766e; }
        .lis-sample-time { font-size: 10.5px; color: #94a3b8; font-family: monospace; }
        .lis-sample-tag { padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; text-transform: uppercase; }
        .tag-mindray { background: #ccfbf1; color: #0f766e; }
        .tag-sysmex { background: #ede9fe; color: #6d28d9; }
        .tag-wondfo { background: #ffedd5; color: #c2410c; }
        .lis-badge-status { padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; }
        .lis-badge-status.status-terhubung { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .lis-badge-status.status-baru { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .btn-hapus-sampel:hover { background: #fee2e2 !important; color: #dc2626 !important; }

        /* Pane Kanan */
        .lis-right-pane { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .lis-detail-header { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; background: #fafafa; }
        .lis-badge-sample-lg { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 15px; color: #0f766e; background: #ccfbf1; padding: 3px 8px; border-radius: 6px; }
        .lis-meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 11.5px; }
        @media (max-width: 640px) { .lis-meta-grid { grid-template-columns: 1fr 1fr; } }
        .lis-meta-grid .lbl { color: #64748b; font-size: 11px; display: block; margin-bottom: 2px; }
        .lis-meta-grid .val { font-weight: 600; color: #0f172a; }

        /* Tabel Rincian */
        .lis-table thead th { background: #f8fafc; color: #475569; font-weight: 700; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 2; font-size: 10.5px; text-transform: uppercase; }
        .lis-table tbody td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .lis-table tbody tr:hover { background: #f8fafc; }

        .flag-badge { padding: 2px 6px; font-size: 10px; font-weight: 800; border-radius: 4px; display: inline-block; font-family: 'JetBrains Mono', monospace; }
        .flag-n { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .flag-h { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .flag-l { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .flag-c { background: #dc2626; color: #fff; }

        .lis-map-badge { padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; }
        .lis-map-badge.mapped { background: #ecfdf5; color: #065f46; }
        .lis-map-badge.unmapped { background: #fffbeb; color: #92400e; }

        /* Raw Accordion */
        .lis-raw-section { border-top: 1px solid #e2e8f0; background: #f8fafc; }
        .lis-raw-toggle { width: 100%; padding: 8px 14px; background: transparent; border: none; font-size: 11.5px; font-weight: 600; color: #0f766e; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .lis-raw-content { display: none; padding: 10px 14px; background: #0b1120; color: #f8fafc; font-family: 'JetBrains Mono', monospace; font-size: 11px; max-height: 180px; overflow-y: auto; }
        .lis-raw-content.buka { display: block; }
        .lis-raw-content pre { margin: 0; white-space: pre-wrap; word-break: break-all; color: #a5f3fc; }

        /* Empty Card */
        .lis-empty-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 36px 20px; color: #94a3b8; height: 100%; box-sizing: border-box; }

        /* Terminal Console Footer */
        .lis-terminal-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .lis-terminal-head { background: #0f172a; color: #f8fafc; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; }
        .lis-terminal-body { background: #0b1120; color: #f8fafc; font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 12px; height: 180px; overflow-y: auto; }
      </style>

      <div class="lis-page-wrap">
        <!-- HEADER TOP -->
        <div class="lis-header-bar">
          <div>
            <h1 class="lis-title">
              ${UI.ikon('pengaturan', 22)} LIS &amp; Integrasi Alat Medis
            </h1>
            <div class="lis-subtitle">
              Diagnostic, troubleshooting, dan monitoring komunikasi data alat laboratorium (Mindray BS-240, Sysmex XP-100, &amp; Wondfo III Plus).
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="lis-badge-pill offline" id="badgePortMindray">Port 7118 Offline</span>
            <span class="lis-badge-pill offline" id="badgePortSysmex">Port 8005 Offline</span>
            <span class="lis-badge-pill offline" id="badgePortWondfo">Port 8001 Offline</span>
            <span class="lis-badge-pill offline" id="badgePortBridge">Bridge 7119 Offline</span>
            
            <button class="btn btn-secondary btn-sm" id="btnSettingAlat" title="Petunjuk konfigurasi alat Mindray BS-240">
              ${UI.ikon('pengaturan', 14)} Setting Alat
            </button>
            <button class="btn btn-primary btn-sm" id="btnCekListener">
              ${UI.ikon('ulang', 14)} Cek Koneksi
            </button>
          </div>
        </div>

        <!-- STATS BAR METRIK -->
        <div class="lis-stats-grid">
          <div class="lis-stat-card">
            <div>
              <div class="lis-stat-lbl">Total Sampel Masuk</div>
              <div class="lis-stat-num" id="statTotalSampel">0</div>
            </div>
            <div class="lis-stat-icon" style="background:#f0fdfa; color:#0d9488;">
              ${UI.ikon('lab', 22)}
            </div>
          </div>

          <div class="lis-stat-card">
            <div>
              <div class="lis-stat-lbl">Parameter Terdeteksi</div>
              <div class="lis-stat-num" id="statTotalParameter">0</div>
            </div>
            <div class="lis-stat-icon" style="background:#eff6ff; color:#2563eb;">
              ${UI.ikon('dokumen', 22)}
            </div>
          </div>

          <div class="lis-stat-card">
            <div>
              <div class="lis-stat-lbl">Sampel Terakhir</div>
              <div class="lis-stat-num" style="font-size:16px;" id="statTerakhirTerima">-</div>
            </div>
            <div class="lis-stat-icon" style="background:#ecfdf5; color:#059669;">
              ${UI.ikon('ulang', 22)}
            </div>
          </div>

          <div class="lis-stat-card">
            <div>
              <div class="lis-stat-lbl">Status Alat Terhubung</div>
              <div class="lis-stat-num" style="font-size:14px; font-weight:700;" id="statAlatTerkoneksi">Bridge Offline</div>
            </div>
            <div class="lis-stat-icon" style="background:#fef3c7; color:#d97706;">
              ${UI.ikon('info', 22)}
            </div>
          </div>
        </div>

        <!-- DUAL PANE WORKSPACE -->
        <div class="lis-workspace">
          <!-- PANEL KIRI: DAFTAR SAMPEL -->
          <div class="lis-left-pane">
            <div class="lis-pane-head">
              <div class="lis-pane-title">
                <span>Riwayat Sampel</span>
                <span class="badge" id="badgeJumlahSampel" style="background:#e0f2fe; color:#0369a1; font-weight:800;">0</span>
              </div>
              <div style="display:flex; gap:4px; align-items:center;">
                <button class="btn btn-ghost btn-sm" id="btnRefreshSampel" title="Segarkan daftar">
                  ${UI.ikon('ulang', 13)}
                </button>
                <button class="btn btn-ghost btn-sm" id="btnBersihkanKemarin" style="color:#b45309; font-size:11px; padding:3px 6px; font-weight:600;" title="Bersihkan sampel kemarin / hari lalu">
                  ${UI.ikon('hapus', 12)} Hapus Kemarin
                </button>
                <button class="btn btn-ghost btn-sm" id="btnResetBuffer" style="color:#ef4444;" title="Bersihkan seluruh riwayat memori">
                  ${UI.ikon('hapus', 13)}
                </button>
              </div>
            </div>

            <!-- Toolbar Pencarian & Filter Cepat Presisi -->
            <div class="lis-search-bar" style="flex-direction:column; gap:6px;">
              <div style="display:flex; gap:6px;">
                <input type="text" id="inpCariSampel" class="input" placeholder="Cari Sample ID, Pasien..." style="flex:1; font-size:11.5px; height:32px;">
                <select id="selFilterAlat" class="input" style="width:125px; font-size:11px; height:32px;">
                  <option value="">Semua Alat</option>
                  <option value="Mindray">Mindray</option>
                  <option value="Sysmex">Sysmex</option>
                  <option value="Wondfo">Wondfo III Plus</option>
                </select>
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                <div style="display:flex; align-items:center; gap:4px; flex:1;">
                  <span style="font-size:11px; color:#64748b; font-weight:600; white-space:nowrap;">Tgl:</span>
                  <input type="date" id="filterTanggalSampel" class="input" style="flex:1; font-size:11px; height:28px; padding:2px 6px;">
                </div>
                <button class="btn btn-secondary btn-sm" id="btnTglHariIni" style="font-size:10.5px; height:28px; padding:2px 8px; font-weight:700; white-space:nowrap;" title="Tampilkan riwayat hari ini">
                  Hari Ini
                </button>
                <button class="btn btn-ghost btn-sm" id="btnTglSemua" style="font-size:10.5px; height:28px; padding:2px 6px; color:#64748b; white-space:nowrap;" title="Tampilkan semua tanggal">
                  Semua
                </button>
              </div>
            </div>

            <!-- Wadah Peringatan Penumpukan Data (> 50 sampel) -->
            <div id="wadahWarningOverflow"></div>

            <!-- Kontainer Daftar Sampel -->
            <div class="lis-sample-list" id="wadahDaftarSampel">
              <div style="padding:20px; text-align:center; color:#94a3b8; font-size:12px;">Memuat sampel...</div>
            </div>
          </div>

          <!-- PANEL KANAN: DETAIL PEMERIKSAAN & PEMETAAN -->
          <div class="lis-right-pane" id="wadahDetailSampel">
            <!-- Diisi oleh renderDetailSampel() -->
          </div>
        </div>

        <!-- FOOTER: LOG & RAW DATA CONSOLE -->
        <div class="lis-terminal-wrap">
          <div class="lis-terminal-head">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-family:'JetBrains Mono',monospace; font-weight:700; font-size:12px; color:#38bdf8;">
                Terminal Socket &amp; System Log
              </span>
              <span style="font-size:10.5px; color:#94a3b8;">(Live monitoring komunikasi alat &amp; API)</span>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-ghost btn-sm" id="btnSalinLogTerminal" style="color:#e2e8f0; font-size:11px; padding:2px 8px;">
                ${UI.ikon('dokumen', 13)} Salin Log
              </button>
              <button class="btn btn-ghost btn-sm" id="btnBersihLogTerminal" style="color:#f87171; font-size:11px; padding:2px 8px;">
                ${UI.ikon('hapus', 13)} Bersihkan
              </button>
            </div>
          </div>
          <div class="lis-terminal-body" id="wadahLogConsole">
            <!-- Diisi oleh renderLogConsole() -->
          </div>
        </div>
      </div>
    `;

    pasangKejadian(el);
    renderLogConsole(el.querySelector('#wadahLogConsole'));

    // Aktifkan Realtime sync Supabase multi-device
    pasangRealtimeSync();

    // Hentikan channel dan timer jika pengguna navigasi ke rute lain
    if (listenerNavigasi) {
      window.removeEventListener('hashchange', listenerNavigasi);
    }
    listenerNavigasi = () => {
      const h = location.hash || '';
      if (!h.includes('lis-debug') && !h.includes('lis_debug') && !h.includes('integrasi-alat') && !h.includes('integrasi_alat')) {
        if (timerPolling) { clearInterval(timerPolling); timerPolling = null; }
        lepasRealtimeSync();
        window.removeEventListener('hashchange', listenerNavigasi);
        listenerNavigasi = null;
      }
    };
    window.addEventListener('hashchange', listenerNavigasi);

    // Cek koneksi & muat riwayat
    await periksaStatusListener(false);

    // Mulai polling otomatis tiap 2.8 detik untuk live listening
    if (timerPolling) clearInterval(timerPolling);
    timerPolling = setInterval(() => {
      if (autoRefreshAktif) {
        periksaStatusListener(true);
      }
    }, 2800);
  }

  // Pasang event handler
  function pasangKejadian(el) {
    const btnCek = el.querySelector('#btnCekListener');
    if (btnCek) btnCek.onclick = () => periksaStatusListener(false);

    const btnSetting = el.querySelector('#btnSettingAlat');
    if (btnSetting) btnSetting.onclick = () => bukaModalPanduanMindray();

    const btnRefresh = el.querySelector('#btnRefreshSampel');
    if (btnRefresh) btnRefresh.onclick = () => periksaStatusListener(false);

    const btnBersihKemarin = el.querySelector('#btnBersihkanKemarin');
    if (btnBersihKemarin) btnBersihKemarin.onclick = () => bersihkanSampelKemarin();

    const btnReset = el.querySelector('#btnResetBuffer');
    if (btnReset) btnReset.onclick = () => bersihkanBufferBridge();

    const inpCari = el.querySelector('#inpCariSampel');
    if (inpCari) {
      inpCari.oninput = () => {
        filterKata = inpCari.value.trim();
        renderDaftarSampel();
      };
    }

    const selAlat = el.querySelector('#selFilterAlat');
    if (selAlat) {
      selAlat.onchange = () => {
        filterAlat = selAlat.value;
        renderDaftarSampel();
      };
    }

    const inpTgl = el.querySelector('#filterTanggalSampel');
    if (inpTgl) {
      inpTgl.value = filterTanggal;
      inpTgl.onchange = async () => {
        filterTanggal = inpTgl.value.trim();
        await periksaStatusListener(false);
      };
    }

    const btnTglHariIni = el.querySelector('#btnTglHariIni');
    if (btnTglHariIni) {
      btnTglHariIni.onclick = async () => {
        filterTanggal = tglHariIniLokal();
        if (inpTgl) inpTgl.value = filterTanggal;
        await periksaStatusListener(false);
      };
    }

    const btnTglSemua = el.querySelector('#btnTglSemua');
    if (btnTglSemua) {
      btnTglSemua.onclick = async () => {
        filterTanggal = '';
        if (inpTgl) inpTgl.value = '';
        await periksaStatusListener(false);
      };
    }

    const btnSalin = el.querySelector('#btnSalinLogTerminal');
    if (btnSalin) btnSalin.onclick = () => salinLog();

    const btnBersih = el.querySelector('#btnBersihLogTerminal');
    if (btnBersih) btnBersih.onclick = () => bersihkanLog();
  }

  return {
    render,
    periksaStatusListener,
    kirimSimulasiBS240,
    kirimSimulasiSysmex,
    kirimSimulasiWondfo,
    bersihkanLog,
    bersihkanSampelKemarin,
    bersihkanSampelSelesai,
    konfirmasiHapusSampel,
    pasangRealtimeSync,
    lepasRealtimeSync
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LisDebug;
