/* =====================================================================
   LIS & INTEGRASI ALAT — Modul Diagnostik, Troubleshooting, & Live Monitoring
   Alat Laboratorium Medis (Mindray BS-240 & Sysmex XP-100)
   Khusus Role Master
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
        UI.toast('LIS Bridge lokal offline / tidak terjangkau.', 'err');
      }
    }

    const isBridgeConnected = !!(
      statusBridge && (
        statusBridge.sukses === true ||
        String(statusBridge.status).toLowerCase() === 'online' ||
        String(statusBridge.bridge).toLowerCase() === 'standby'
      )
    );

    // Ambil daftar sampel terakhir jika bridge online
    if (isBridgeConnected) {
      try {
        const resBuf = await fetch(`${BRIDGE_HOST}/api/terakhir`);
        if (resBuf.ok) {
          const jBuf = await resBuf.json();
          const daftarBaru = (jBuf && jBuf.data) ? jBuf.data : [];

          // Deteksi sampel baru untuk auto-notifikasi
          if (daftarSampel.length > 0 && daftarBaru.length > daftarSampel.length) {
            const sidBaru = daftarBaru[0]?.sample_id;
            tambahLog('SUCCESS', `Sampel baru diterima dari alat: #${sidBaru} (${daftarBaru[0]?.alat || 'Alat'})`);
            UI.toast(`Data baru masuk dari alat: Sampel #${sidBaru}`, 'ok');
          }

          daftarSampel = daftarBaru;

          // Jika belum ada sampel terpilih, pilih sampel pertama
          if (!sampelTerpilih && daftarSampel.length > 0) {
            sampelTerpilih = daftarSampel[0];
          } else if (sampelTerpilih) {
            // Update data sampel aktif jika ada data terbaru
            const cocokan = daftarSampel.find(s => String(s.sample_id) === String(sampelTerpilih.sample_id));
            if (cocokan) sampelTerpilih = cocokan;
          }
        }
      } catch (_) {}
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
      elAlatStatus.textContent = isBridgeConnected ? 'Siaga (Standby)' : 'Bridge Offline';
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
    if (filterKata) {
      const q = filterKata.toLowerCase();
      filtered = filtered.filter(s =>
        String(s.sample_id || '').toLowerCase().includes(q) ||
        String(s.nama_pasien || '').toLowerCase().includes(q) ||
        String(s.alat || '').toLowerCase().includes(q)
      );
    }
    if (filterAlat) {
      filtered = filtered.filter(s => String(s.alat || '').toLowerCase().includes(filterAlat.toLowerCase()));
    }

    if (badgeCount) badgeCount.textContent = filtered.length;

    if (!filtered.length) {
      wadah.innerHTML = `
        <div class="lis-empty-card">
          <div style="color:#94a3b8; margin-bottom:8px;">${UI.ikon('cari', 36)}</div>
          <div style="font-weight:700; color:#334155; font-size:13px;">Belum Ada Sampel Masuk</div>
          <div style="font-size:11px; color:#64748b; margin-top:4px; max-width:280px; text-align:center;">
            Pastikan kabel LAN terhubung ke BS-240 dan tekan "Connect" di layar alat, atau klik tombol simulasi di atas.
          </div>
          <div style="margin-top:12px; display:flex; gap:6px;">
            <button class="btn btn-primary btn-sm" id="btnEmptySimBS240">
              ${UI.ikon('plus', 13)} Simulasi BS-240
            </button>
          </div>
        </div>
      `;
      const btnE = wadah.querySelector('#btnEmptySimBS240');
      if (btnE) btnE.onclick = () => kirimSimulasiBS240();
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

      return `
        <div class="lis-sample-item ${isAktif ? 'aktif' : ''}" data-sid="${UI.esc(s.sample_id)}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="lis-sample-id">${UI.esc(s.sample_id)}</span>
            <span class="lis-sample-time">${UI.esc(s.waktu ? s.waktu.split(' ')[1] : '-')}</span>
          </div>
          <div style="font-weight:700; font-size:13px; color:#0f172a; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${UI.esc(s.nama_pasien || 'Pasien Tanpa Nama')}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
            <span class="lis-sample-tag ${alatClass}">${UI.esc(s.alat || 'Alat Medis')}</span>
            <span style="color:#64748b; font-weight:600;">${jmlParam} Parameter</span>
          </div>
        </div>
      `;
    }).join('');

    wadah.innerHTML = html;

    wadah.querySelectorAll('.lis-sample-item').forEach(elItem => {
      elItem.onclick = () => {
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
      const rawVal = item.value || '';
      const unit = item.unit || '-';
      const refRangeAlat = item.ref_range || '-';
      const flag = (item.flag || 'N').toUpperCase().trim();

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
      const namaRef = isMapped ? matched.nama : '<span style="color:#94a3b8; font-style:italic;">Belum Ada</span>';
      const kelompokRef = isMapped ? (matched.kelompok || 'Umum') : '-';
      const rujukanDb = isMapped && Array.isArray(matched.rujukan) && matched.rujukan.length
        ? matched.rujukan.map(x => `${x.jenis_kelamin || '*'}: ${x.nilai_min || '0'} - ${x.nilai_max || '0'} ${matched.satuan || ''}`).join('<br>')
        : (isMapped && matched.satuan ? matched.satuan : '-');

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
        navigator.clipboard.writeText(JSON.stringify(s, null, 2)).then(() => {
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
    const baris = [
      ['Sample_ID', 'Nama_Pasien', 'Alat', 'Waktu', 'Parameter', 'Kode', 'Nilai', 'Satuan', 'Flag', 'Ref_Range']
    ];

    sampel.hasil.forEach(h => {
      baris.push([
        sampel.sample_id,
        sampel.nama_pasien || '',
        sampel.alat || '',
        sampel.waktu || '',
        h.test_desc || h.test_name || '',
        h.test_name || '',
        h.value || '',
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
    if (!confirm('Bersihkan seluruh daftar riwayat sampel di memori bridge?')) return;

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
              <div style="display:flex; gap:4px;">
                <button class="btn btn-ghost btn-sm" id="btnRefreshSampel" title="Segarkan daftar">
                  ${UI.ikon('ulang', 13)}
                </button>
                <button class="btn btn-ghost btn-sm" id="btnResetBuffer" style="color:#ef4444;" title="Bersihkan riwayat memori">
                  ${UI.ikon('hapus', 13)}
                </button>
              </div>
            </div>

            <!-- Toolbar Pencarian & Filter Cepat -->
            <div class="lis-search-bar">
              <input type="text" id="inpCariSampel" class="input" placeholder="Cari Sample ID, Pasien..." style="flex:1; font-size:11.5px; height:32px;">
              <select id="selFilterAlat" class="input" style="width:125px; font-size:11px; height:32px;">
                <option value="">Semua Alat</option>
                <option value="Mindray">Mindray</option>
                <option value="Sysmex">Sysmex</option>
                <option value="Wondfo">Wondfo III Plus</option>
              </select>
            </div>

            <!-- Tombol Uji Simulasi Langsung -->
            <div style="padding:6px 12px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; gap:6px;">
              <button class="btn btn-ghost btn-sm" id="btnSimBS240" style="flex:1; font-size:10.5px; padding:4px 6px; border:1px solid #99f6e4; background:#f0fdfa; color:#0f766e; font-weight:700;">
                ${UI.ikon('plus', 12)} Simulasi BS-240
              </button>
              <button class="btn btn-ghost btn-sm" id="btnSimSysmex" style="flex:1; font-size:10.5px; padding:4px 6px; border:1px solid #ddd6fe; background:#faf5ff; color:#6d28d9; font-weight:700;">
                ${UI.ikon('plus', 12)} Simulasi Sysmex
              </button>
              <button class="btn btn-ghost btn-sm" id="btnSimWondfo" style="flex:1; font-size:10.5px; padding:4px 6px; border:1px solid #fed7aa; background:#fff7ed; color:#c2410c; font-weight:700;">
                ${UI.ikon('plus', 12)} Simulasi Wondfo
              </button>
            </div>

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

    const btnReset = el.querySelector('#btnResetBuffer');
    if (btnReset) btnReset.onclick = () => bersihkanBufferBridge();

    const btnSimBS = el.querySelector('#btnSimBS240');
    if (btnSimBS) btnSimBS.onclick = () => kirimSimulasiBS240();

    const btnSimSys = el.querySelector('#btnSimSysmex');
    if (btnSimSys) btnSimSys.onclick = () => kirimSimulasiSysmex();

    const btnSimWon = el.querySelector('#btnSimWondfo');
    if (btnSimWon) btnSimWon.onclick = () => kirimSimulasiWondfo();

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
    bersihkanLog
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LisDebug;
