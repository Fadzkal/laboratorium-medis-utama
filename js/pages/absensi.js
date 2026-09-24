/* =====================================================================
   HALAMAN: ABSENSI KARYAWAN & GEOFENCING MULTI-LOKASI
   ---------------------------------------------------------------------
   Fitur lengkap:
   1. Multi-lokasi Geofencing menggunakan Leaflet.js + OpenStreetMap (Gratis).
   2. Master dapat menentukan koordinat dan radius untuk banyak cabang/lokasi.
   3. Karyawan melakukan Clock In / Clock Out dengan deteksi GPS dan validasi radius.
   4. Pengajuan Cuti / Izin Sakit / Dinas Luar (Tanpa Foto / Gambar).
   5. Dasbor Master: Monitoring kehadiran staf dan approval permohonan cuti/izin.
   ===================================================================== */
const Absensi = (() => {
  let w = null;
  let saya = null;
  let tabUtama = 'absen'; // 'absen', 'monitoring', 'izin_approval', 'master_lokasi'
  let subTabKaryawan = 'riwayat'; // 'riwayat', 'izin_saya'
  
  let timerJam = null;
  let peta = null;
  let petaMonitoring = null;
  let markerUser = null;
  let userCoords = null; // { lat, lng, akurasi }
  let statusGps = 'memuat'; // 'memuat', 'ok', 'ditolak', 'galat'
  let pesanGps = 'Mendeteksi lokasi GPS...';

  let masterLokasi = [];
  let jamKerja = {
    jam_masuk: '07:30',
    jam_pulang: '14:30',
    toleransi_keterlambatan_menit: 15,
    shift1_masuk: '07:30',
    shift1_pulang: '14:30',
    shift1_toleransi: 15,
    shift2_masuk: '14:00',
    shift2_pulang: '21:00',
    shift2_toleransi: 15
  };
  let shiftDipilih = 1;
  let dataAbsenShift1 = null;
  let dataAbsenShift2 = null;
  let absenHariIni = null;
  let riwayatAbsen = [];
  let daftarIzinSayaList = [];
  
  // Data untuk Master
  let tanggalMonitoring = UI.hariIni();
  let monitoringList = [];
  let izinStafList = [];
  let filterIzinStaf = 'MENUNGGU';

  // Deteksi nomor shift kerja otomatis berbasis waktu saat ini
  function deteksiShiftOtomatis() {
    const now = new Date();
    const jamDesimal = now.getHours() + (now.getMinutes() / 60);
    // Batas peralihan ke shift siang adalah pukul 13:30 (13.5)
    return jamDesimal < 13.5 ? 1 : 2;
  }

  // Dapatkan konfigurasi jam target untuk shift tertentu
  function getTargetShift(shiftNo = shiftDipilih) {
    if (Number(shiftNo) === 2) {
      return {
        nomor: 2,
        nama: 'Shift 2 (Siang/Sore)',
        labelSingkat: 'Shift 2 (Siang)',
        masuk: jamKerja.shift2_masuk || '14:00',
        pulang: jamKerja.shift2_pulang || '21:00',
        toleransi: jamKerja.shift2_toleransi ?? 15,
        badgeClass: 'b-dokter'
      };
    }
    return {
      nomor: 1,
      nama: 'Shift 1 (Pagi)',
      labelSingkat: 'Shift 1 (Pagi)',
      masuk: jamKerja.shift1_masuk || jamKerja.jam_masuk || '07:30',
      pulang: jamKerja.shift1_pulang || jamKerja.jam_pulang || '14:30',
      toleransi: jamKerja.shift1_toleransi ?? jamKerja.toleransi_keterlambatan_menit ?? 15,
      badgeClass: 'b-selesai'
    };
  }

  // Haversine Formula untuk menghitung jarak meter antar koordinat
  function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371000; // meter
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // Cache untuk reverse geocoding agar tidak panggil API berulang-ulang
  const cacheAlamatGps = new Map();

  async function dapatkanAlamatNominatim(lat, lng) {
    const key = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
    if (cacheAlamatGps.has(key)) return cacheAlamatGps.get(key);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const d = await res.json();
        const a = d.address || {};
        const jalan = a.road || a.pedestrian || a.suburb || a.village || '';
        const desa = a.village || a.neighbourhood || a.suburb || '';
        const kec = a.city_district || a.town || a.municipality || 'Purbalingga';
        const parts = [jalan, desa, kec].filter((v, i, arr) => v && arr.indexOf(v) === i);
        const teks = parts.length ? parts.join(', ') : (d.display_name ? d.display_name.split(',').slice(0, 3).join(',') : 'Area Purbalingga');
        cacheAlamatGps.set(key, teks);
        return teks;
      }
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
    }
    return `Koordinat (${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)})`;
  }

  // Evaluasi lokasi cerdas: Lab Pusat, 22 Puskesmas se-Purbalingga, atau Dinas Luar
  function evaluasiLokasiCerdas(lat, lng) {
    if (!lat || !lng || !masterLokasi.length) return null;
    let terdekat = null;
    let jarakTerkecil = Infinity;

    for (const lok of masterLokasi) {
      if (!lok.aktif) continue;
      const jarak = hitungJarak(lat, lng, Number(lok.latitude), Number(lok.longitude));
      if (jarak < jarakTerkecil) {
        jarakTerkecil = jarak;
        terdekat = lok;
      }
    }

    if (!terdekat) return null;

    const namaLower = terdekat.nama.toLowerCase();
    const isLab = terdekat.tipe === 'LAB' || namaLower.includes('laboratorium') || namaLower.includes('medis utama');
    const isPuskesmas = terdekat.tipe === 'PUSKESMAS' || namaLower.includes('puskesmas');
    const isRS = terdekat.tipe === 'RS' || namaLower.includes('rs');

    // 1. Jika dekat Lab Pusat (radius wajar ~300m atau disesuaikan akurasi GPS)
    const batasToleransiLab = Math.max(300, (userCoords?.akurasi || 50) + 120);
    if (isLab && jarakTerkecil <= batasToleransiLab) {
      return {
        tipe: 'LAB',
        nama: 'Laboratorium Medis Utama (Pusat)',
        labelSingkat: 'Lab Pusat',
        keterangan: 'Anda terdeteksi di area Laboratorium Medis Utama (Pusat)',
        alamat: terdekat.alamat || 'Jl. D.I. Panjaitan No. 94, Purbalingga Lor',
        jarak: jarakTerkecil,
        diLokasiResmi: true,
        faskesTerdekat: terdekat,
        badgeKelas: 'b-selesai',
        iconName: 'faskes'
      };
    }

    // 2. Jika dekat Puskesmas atau RS (radius wajar ~350m atau disesuaikan akurasi GPS)
    const batasToleransiFaskes = Math.max(350, (userCoords?.akurasi || 50) + 150);
    if ((isPuskesmas || isRS) && jarakTerkecil <= batasToleransiFaskes) {
      return {
        tipe: terdekat.tipe || (isPuskesmas ? 'PUSKESMAS' : 'RS'),
        nama: terdekat.nama,
        labelSingkat: terdekat.nama,
        keterangan: `Anda terdeteksi di area ${terdekat.nama} (Jarak: ${jarakTerkecil}m)`,
        alamat: terdekat.alamat || '',
        jarak: jarakTerkecil,
        diLokasiResmi: true,
        faskesTerdekat: terdekat,
        badgeKelas: isPuskesmas ? 'b-kajian' : 'b-dokter',
        iconName: 'faskes'
      };
    }

    // 3. Di luar Lab & Puskesmas (Dinas Luar / Mobile Sampling / Lapangan)
    return {
      tipe: 'DINAS_LUAR',
      nama: 'Dinas Luar / Lapangan',
      labelSingkat: 'Dinas Luar',
      keterangan: `Dinas Luar (Dekat ${terdekat.nama} ±${jarakTerkecil >= 1000 ? (jarakTerkecil/1000).toFixed(1) + ' km' : jarakTerkecil + 'm'})`,
      alamat: null,
      jarak: jarakTerkecil,
      diLokasiResmi: false,
      faskesTerdekat: terdekat,
      badgeKelas: 'b-menunggu',
      iconName: 'lokasi'
    };
  }

  // Alias kompatibilitas
  function evaluasiGeofence(lat, lng) {
    const res = evaluasiLokasiCerdas(lat, lng);
    return {
      dalamRadius: true,
      lokasi: res?.faskesTerdekat || masterLokasi[0] || null,
      jarak: res?.jarak || 0,
      deteksi: res
    };
  }

  function badgeLokasiHtml(teksLokasi, idRecord = null) {
    if (!teksLokasi || teksLokasi === '—') return '<span class="text-muted text-xs">—</span>';

    let iconName = 'lokasi';
    let badgeClass = 'b-menunggu';
    let label = teksLokasi;

    const lower = teksLokasi.toLowerCase();
    if (lower.includes('laboratorium') || lower.includes('lab pusat')) {
      iconName = 'faskes';
      badgeClass = 'b-selesai';
    } else if (lower.includes('puskesmas')) {
      iconName = 'faskes';
      badgeClass = 'b-kajian';
    } else if (lower.includes('rsud') || lower.includes('rumah sakit') || lower.includes(' rs ')) {
      iconName = 'faskes';
      badgeClass = 'b-dokter';
    } else {
      iconName = 'lokasi';
      badgeClass = 'b-warn';
    }

    return `
      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <span class="badge ${badgeClass}" style="font-size: 11px; padding: 3px 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
          ${UI.ikon(iconName, 12)} <span>${UI.esc(label)}</span>
        </span>
        ${idRecord ? `
          <button class="btn btn-secondary btn-sm" data-buka-peta="${UI.esc(idRecord)}" style="padding: 2px 7px; font-size: 10px; height: 22px; line-height: 1;">
            ${UI.ikon('peta', 11)} Peta
          </button>
        ` : ''}
      </div>
    `;
  }

  // Evaluasi keterlambatan waktu masuk terhadap jam kantor + batas toleransi
  function cekStatusKeterlambatan(waktuMasukIso, jamMasukStr, toleransiMenit = 0) {
    if (!waktuMasukIso || !jamMasukStr) return null;
    const d = new Date(waktuMasukIso);
    const [targetJam, targetMnt] = jamMasukStr.split(':').map(Number);
    const targetWaktu = new Date(d);
    targetWaktu.setHours(targetJam, targetMnt, 0, 0);

    const batasToleransi = new Date(targetWaktu.getTime() + (Number(toleransiMenit || 0) * 60 * 1000));
    const selisihMnt = Math.round((d.getTime() - targetWaktu.getTime()) / (60 * 1000));

    if (d > batasToleransi) {
      return { terlambat: true, menit: Math.max(1, selisihMnt) };
    }
    return { terlambat: false, menit: selisihMnt };
  }

  // Evaluasi kepulangan lebih awal terhadap jam pulang kantor
  function cekPulangCepat(waktuKeluarIso, jamPulangStr) {
    if (!waktuKeluarIso || !jamPulangStr) return null;
    const d = new Date(waktuKeluarIso);
    const [targetJam, targetMnt] = jamPulangStr.split(':').map(Number);
    const targetWaktu = new Date(d);
    targetWaktu.setHours(targetJam, targetMnt, 0, 0);

    const selisihMnt = Math.round((targetWaktu.getTime() - d.getTime()) / (60 * 1000));
    if (selisihMnt > 0) {
      return { cepat: true, menit: selisihMnt };
    }
    return { cepat: false, menit: 0 };
  }

  async function render(el, param) {
    w = el;
    saya = await DB.saya();
    const isMaster = saya?.peran === 'master';

    // Master bebas dari absensi mandiri dan permohonan cuti (fokus monitoring & kelola)
    tabUtama = isMaster ? 'monitoring' : 'absen';
    shiftDipilih = deteksiShiftOtomatis();

    // Hentikan timer sebelumnya jika ada
    if (timerJam) clearInterval(timerJam);
    if (peta) {
      try { peta.remove(); } catch (e) {}
      peta = null;
    }

    renderKerangka();
    mulaiTimerJam();
    if (!isMaster) {
      mintaLokasiGps();
    }
    await muatData();
  }

  function renderKerangka() {
    const isMaster = saya?.peran === 'master';
    const namaTampil = saya?.nama || (isMaster ? 'Master' : 'Karyawan');
    const inisialTampil = UI.inisial(namaTampil) || (isMaster ? 'M' : 'K');

    w.innerHTML = `
      <div class="mb-20 flex items-center justify-between flex-wrap gap-14">
        <div>
          <h1 class="mb-4" style="font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
            ${isMaster ? 'Manajemen Absensi & Kehadiran Staf' : 'Absensi & Presensi Karyawan'}
          </h1>
          <p class="text-muted mb-0" style="font-size: 13.5px;">
            ${isMaster 
              ? 'Panel kendali kepala laboratorium: monitoring kehadiran staf, persetujuan cuti/izin, serta pengaturan lokasi dan jam kerja.' 
              : 'Pencatatan kehadiran presisi berbasis geofencing lokasi kantor dan pengajuan izin/cuti.'}
          </p>
        </div>
        ${!isMaster ? `
          <div class="flex items-center gap-8 flex-wrap">
            <button class="btn btn-secondary" id="btnAjukanIzinCuti" style="padding: 9px 16px; font-weight: 600;">
              ${UI.ikon('dokumen', 15)} Ajukan Cuti / Izin
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Kartu Profil Karyawan / Pimpinan & Jam Digital -->
      <div class="mb-24" style="background: linear-gradient(135deg, var(--brand-900) 0%, var(--brand-700) 100%); color: #fff; border-radius: 14px; padding: 22px 26px; box-shadow: 0 4px 14px rgba(15,139,126,0.2);">
        <div class="flex items-center justify-between flex-wrap gap-20">
          <div class="flex items-center gap-16">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.18); border: 2px solid rgba(255,255,255,0.4); display: grid; place-items: center; font-size: 19px; font-weight: 800; color: #fff; letter-spacing: 0.5px; flex-shrink: 0;">
              ${inisialTampil}
            </div>
            <div>
              <div style="font-size: 12px; color: #C6E6E1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px;">
                ${isMaster ? 'Kepala Laboratorium (Pemilik)' : 'Selamat Bekerja,'}
              </div>
              <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.2px; margin-top: 2px; color: #FFFFFF;">
                ${UI.esc(namaTampil)}
              </div>
              <div class="flex items-center gap-8 mt-6">
                <span class="badge" style="background: ${isMaster ? 'var(--warn-700)' : 'rgba(255,255,255,0.22)'}; color: #fff; text-transform: uppercase; font-size: 11px; font-weight: 700; padding: 4px 10px;">
                  ${isMaster ? 'PIMPINAN • PEMILIK LAB' : UI.esc(saya?.peran || '-')}
                </span>
                <span style="font-size: 12.5px; color: #A7F3D0; font-weight: 500;">• ${UI.tglIndo(new Date(), true)}</span>
              </div>
            </div>
          </div>

          <!-- Jam Digital Live -->
          <div class="text-right" style="min-width: 190px;">
            <div style="font-size: 11px; color: #C6E6E1; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Waktu Sekarang (WIB)</div>
            <div id="liveClock" class="mono" style="font-size: 34px; font-weight: 800; color: #fff; line-height: 1.15; margin: 3px 0;">
              --:--:--
            </div>
            <div style="font-size: 12px; color: #E2E8F0; opacity: 0.9;">
              ${isMaster ? 'Bebas Presensi (Pimpinan Faskes)' : 'Presensi Tepat Waktu'}
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Bar Utama (Khusus Master) -->
      ${isMaster ? `
        <div class="tab-bar mb-20" style="gap: 4px; border-bottom: 2px solid #E2E8F0; padding-bottom: 0;">
          <button class="tab ${tabUtama === 'monitoring' ? 'on' : ''}" data-tab="monitoring" style="padding: 10px 18px; font-weight: 600;">
            ${UI.ikon('pengguna', 15)} Monitoring Kehadiran & Sebaran Staf
          </button>
          <button class="tab ${tabUtama === 'izin_approval' ? 'on' : ''}" data-tab="izin_approval" id="tabBtnApproval" style="padding: 10px 18px; font-weight: 600;">
            ${UI.ikon('centang', 15)} Persetujuan Cuti & Izin <span id="badgePendingIzin" class="badge-num" style="display:none; margin-left:6px; background:var(--warn-700); color:#fff; border-radius:999px; padding:1px 7px; font-size:11px;">0</span>
          </button>
          <button class="tab ${tabUtama === 'master_lokasi' ? 'on' : ''}" data-tab="master_lokasi" style="padding: 10px 18px; font-weight: 600;">
            ${UI.ikon('setelan', 15)} Pengaturan Jam Kerja & Lokasi Faskes
          </button>
        </div>
      ` : ''}

      <!-- Kontainer Tampilan Berdasarkan Tab -->
      <div id="kontenAbsensi">
        ${UI.memuat(3)}
      </div>
    `;

    // Event Listener Navigasi Tab
    w.querySelectorAll('.tab[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        w.querySelectorAll('.tab[data-tab]').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        tabUtama = btn.dataset.tab;
        renderIsiTab();
      });
    });

    // Event Listener Tombol Ajukan Cuti/Izin (hanya untuk staf)
    w.querySelector('#btnAjukanIzinCuti')?.addEventListener('click', () => {
      dialogAjukanIzin();
    });
  }

  function mulaiTimerJam() {
    const elClock = w.querySelector('#liveClock');
    const update = () => {
      if (!elClock) return;
      const now = new Date();
      const jam = String(now.getHours()).padStart(2, '0');
      const mnt = String(now.getMinutes()).padStart(2, '0');
      const dtk = String(now.getSeconds()).padStart(2, '0');
      elClock.textContent = `${jam}:${mnt}:${dtk}`;
    };
    update();
    timerJam = setInterval(update, 1000);
  }

  function mintaLokasiGps() {
    statusGps = 'memuat';
    pesanGps = 'Mendeteksi lokasi GPS perangkat Anda...';
    renderStatusGps();

    if (!navigator.geolocation) {
      statusGps = 'galat';
      pesanGps = 'Perangkat Anda tidak mendukung fitur Geolocation GPS.';
      renderStatusGps();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          akurasi: Math.round(pos.coords.accuracy)
        };
        statusGps = 'ok';
        pesanGps = `Lokasi GPS terdeteksi (Akurasi: ±${userCoords.akurasi} meter).`;
        renderStatusGps();
        updatePetaDanMarker();
        updateTombolPresensi();
      },
      (err) => {
        statusGps = 'ditolak';
        if (err.code === 1) {
          pesanGps = 'Izin akses lokasi ditolak oleh browser. Mohon izinkan akses GPS di pengaturan browser Anda.';
        } else if (err.code === 2) {
          pesanGps = 'Posisi lokasi GPS tidak dapat ditemukan. Pastikan GPS aktif.';
        } else {
          pesanGps = 'Waktu permintaan lokasi GPS habis (timeout). Silakan coba lagi.';
        }
        renderStatusGps();
        updateTombolPresensi();
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  }

  async function muatData() {
    try {
      const isMaster = saya?.peran === 'master';
      const tanggal = new Date();
      const awalBulan = new Date(tanggal.getFullYear(), tanggal.getMonth(), 1).toISOString().split('T')[0];
      const akhirBulan = new Date(tanggal.getFullYear(), tanggal.getMonth() + 1, 0).toISOString().split('T')[0];

      const [lokasi, jamK, absen1, absen2, riwayat, izinSaya] = await Promise.all([
        DB.daftarMasterLokasi(true),
        DB.pengaturanJamKerja(),
        !isMaster ? DB.absensiHariIni(1) : Promise.resolve(null),
        !isMaster ? DB.absensiHariIni(2) : Promise.resolve(null),
        !isMaster ? DB.absensiPegawai(saya.id, awalBulan, akhirBulan) : Promise.resolve([]),
        !isMaster ? DB.daftarIzinSaya() : Promise.resolve([])
      ]);

      masterLokasi = lokasi || [];
      jamKerja = jamK || {
        jam_masuk: '07:30',
        jam_pulang: '14:30',
        toleransi_keterlambatan_menit: 15,
        shift1_masuk: '07:30',
        shift1_pulang: '14:30',
        shift1_toleransi: 15,
        shift2_masuk: '14:00',
        shift2_pulang: '21:00',
        shift2_toleransi: 15
      };
      dataAbsenShift1 = absen1;
      dataAbsenShift2 = absen2;

      // Cek apakah ada jadwal shift khusus yang ditentukan Pimpinan atau sudah check-in
      if (!isMaster) {
        if (absen2 && (absen2.waktu_masuk || absen2.status === 'BELUM' || absen2.keterangan?.includes('Pimpinan'))) {
          if (!absen1?.waktu_masuk) {
            shiftDipilih = 2;
          }
        } else if (absen1 && (absen1.waktu_masuk || absen1.status === 'BELUM' || absen1.keterangan?.includes('Pimpinan'))) {
          if (!absen2?.waktu_masuk) {
            shiftDipilih = 1;
          }
        }
      }
      absenHariIni = shiftDipilih === 2 ? absen2 : absen1;
      riwayatAbsen = riwayat || [];
      daftarIzinSayaList = izinSaya || [];

      // Jika Master, muat data izin pending untuk counter badge
      if (isMaster) {
        const semuaIzin = await DB.daftarSemuaIzin();
        izinStafList = semuaIzin || [];
        const pendingCount = izinStafList.filter(i => i.status === 'MENUNGGU').length;
        const b = w.querySelector('#badgePendingIzin');
        if (b) {
          b.textContent = pendingCount;
          b.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
      }

      renderIsiTab();
    } catch (err) {
      console.error(err);
      UI.toast('Gagal memuat data absensi: ' + err.message, 'err');
    }
  }

  function renderIsiTab() {
    const el = w.querySelector('#kontenAbsensi');
    if (!el) return;

    if (peta) {
      try { peta.remove(); } catch (e) {}
      peta = null;
      markerUser = null;
    }
    if (petaMonitoring) {
      try { petaMonitoring.remove(); } catch (e) {}
      petaMonitoring = null;
    }

    if (tabUtama === 'absen') {
      renderTabAbsen(el);
    } else if (tabUtama === 'monitoring') {
      renderTabMonitoring(el);
    } else if (tabUtama === 'izin_approval') {
      renderTabApprovalIzin(el);
    } else if (tabUtama === 'master_lokasi') {
      renderTabMasterLokasi(el);
    }
  }

  /* =====================================================================
     TAB 1: ABSENSI MANDIRI & PETA GEOFENCING
     ===================================================================== */
  function renderTabAbsen(container) {
    container.innerHTML = `
      <!-- Banner Jadwal Operasional & Jam Kerja Kantor 2 Shift -->
      <div class="absensi-banner-box mb-20" style="background: #ffffff; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px 20px;">
        <div class="flex items-center justify-between flex-wrap gap-12">
          <div class="flex items-center gap-12">
            <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(15, 139, 126, 0.12); display: grid; place-items: center; color: var(--brand-800); flex-shrink: 0;">
              ${UI.ikon('jam', 22)}
            </div>
            <div>
              <div style="font-size: 13.5px; font-weight: 700; color: #0F172A;">Jadwal Operasional 2 Shift Presensi</div>
              <div class="flex items-center gap-10 mt-3 flex-wrap" style="font-size: 12px;">
                <span class="badge b-selesai" style="font-size: 11px; padding: 2px 8px; font-weight: 700;">Shift 1 (Pagi)</span>
                <span style="color: #0F172A; font-weight: 600;">${jamKerja.shift1_masuk || '07:30'} - ${jamKerja.shift1_pulang || '14:30'} WIB</span>
                <span class="text-muted">(Toleransi ${jamKerja.shift1_toleransi ?? 15}m)</span>
                <span class="text-muted">•</span>
                <span class="badge b-dokter" style="font-size: 11px; padding: 2px 8px; font-weight: 700;">Shift 2 (Siang)</span>
                <span style="color: #0F172A; font-weight: 600;">${jamKerja.shift2_masuk || '14:00'} - ${jamKerja.shift2_pulang || '21:00'} WIB</span>
                <span class="text-muted">(Toleransi ${jamKerja.shift2_toleransi ?? 15}m)</span>
              </div>
            </div>
          </div>
          <span class="badge b-selesai" style="font-size: 11.5px; padding: 6px 12px; font-weight: 600;">Presensi GPS Terkoneksi</span>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 1.15fr 0.85fr; gap: 24px; align-items: start;">
        
        <!-- Kolom Kiri: Peta Geofencing & Status Lokasi -->
        <div class="absensi-panel" style="margin-bottom: 0;">
          <div class="absensi-panel-head">
            <h2 class="flex items-center gap-10" style="margin: 0; font-size: 16px; font-weight: 700; color: #0F172A;">
              ${UI.ikon('peta', 18)} Peta Area Absensi Faskes
            </h2>
            <button class="btn btn-secondary btn-sm" id="btnRefreshGps" style="font-size: 12px; padding: 6px 12px;">
              ${UI.ikon('ulang', 13)} Perbarui GPS
            </button>
          </div>
          
          <!-- Banner Status GPS & Geofence -->
          <div id="boxStatusGps" class="p-16 border-bottom" style="background: #FAFAFA;">
            ${UI.memuat(1)}
          </div>

          <!-- Wadah Peta Leaflet -->
          <div id="mapAbsensi" style="height: 380px; width: 100%; background: #E2E8F0; position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--ink-500); font-weight: 500;">
              Memuat Peta...
            </div>
          </div>

          <div class="p-16 bg-subtle text-xs text-muted flex items-center justify-between flex-wrap gap-8" style="background: #F8FAFC; border-top: 1px solid #E2E8F0;">
            <span class="flex items-center gap-6" style="color: #475569;">${UI.ikon('lokasi', 13)} Presensi Fleksibel &bull; Otomatis Mendeteksi Faskes Terdekat</span>
            <span>Peta: <b>OpenStreetMap & Leaflet</b></span>
          </div>
        </div>

        <!-- Kolom Kanan: Panel Clock In / Out & Status Hari Ini -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div class="absensi-panel" style="margin-bottom: 0;">
            <div class="absensi-panel-head">
              <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #0F172A;">Status Kehadiran Hari Ini</h2>
            </div>
            <div class="absensi-panel-body text-center" id="panelAksiAbsen">
              ${UI.memuat(2)}
            </div>
          </div>

          <!-- Informasi Lokasi Faskes & Puskesmas Purbalingga -->
          <div class="absensi-panel" style="margin-bottom: 0;">
            <div class="absensi-panel-head">
              <h3 class="text-sm font-semibold flex items-center gap-8" style="margin: 0; color: #0F172A;">
                ${UI.ikon('info', 16)} Jaringan Faskes & Puskesmas Purbalingga (${masterLokasi.length})
              </h3>
            </div>
            <div class="absensi-panel-body" style="padding: 14px 18px;">
              <input type="search" id="cariFaskesAbsen" placeholder="Cari nama Puskesmas / RS / Lab..." class="ctl-sm w-full mb-10" style="height: 32px; font-size: 12px; padding: 0 10px; border-radius: 6px;">
              <div id="listFaskesAbsen" style="display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; padding-right: 4px;" class="text-xs">
                <!-- Diisi otomatis oleh renderDaftarFaskesCepat -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bagian Bawah: Riwayat Absensi & Izin Saya -->
      <div class="absensi-panel mt-24">
        <div class="absensi-panel-head">
          <div class="flex items-center gap-10">
            <button class="btn btn-sm ${subTabKaryawan === 'riwayat' ? 'btn-primary' : 'btn-secondary'}" id="subTabRiwayat" style="padding: 7px 14px; font-weight: 600;">
              ${UI.ikon('riwayat', 14)} Riwayat Absensi Bulan Ini
            </button>
            <button class="btn btn-sm ${subTabKaryawan === 'izin_saya' ? 'btn-primary' : 'btn-secondary'}" id="subTabIzin" style="padding: 7px 14px; font-weight: 600;">
              ${UI.ikon('dokumen', 14)} Riwayat Pengajuan Izin / Cuti
            </button>
          </div>
        </div>
        <div class="absensi-panel-body" id="kontenSubTabKaryawan" style="padding: 20px 24px;">
          ${UI.memuat(2)}
        </div>
      </div>
    `;

    // Render daftar faskes cepat di panel kanan
    const renderDaftarFaskesCepat = (filterTeks = '') => {
      const listEl = container.querySelector('#listFaskesAbsen');
      if (!listEl) return;
      const q = filterTeks.trim().toLowerCase();

      let urut = [...masterLokasi];
      if (userCoords) {
        urut.forEach(l => {
          l._jarak = hitungJarak(userCoords.lat, userCoords.lng, Number(l.latitude), Number(l.longitude));
        });
        urut.sort((a, b) => (a._jarak || 0) - (b._jarak || 0));
      }

      const hasil = urut.filter(l => !q || l.nama.toLowerCase().includes(q) || (l.alamat && l.alamat.toLowerCase().includes(q)));
      if (!hasil.length) {
        listEl.innerHTML = `<div class="text-muted text-center p-12">Tidak ada faskes yang cocok.</div>`;
        return;
      }

      listEl.innerHTML = hasil.map(l => {
        const isLab = l.tipe === 'LAB' || l.nama.toLowerCase().includes('laboratorium');
        const isPuskesmas = l.tipe === 'PUSKESMAS' || l.nama.toLowerCase().includes('puskesmas');
        const badgeTipe = isLab ? 'Lab Pusat' : (isPuskesmas ? 'Puskesmas' : 'RS');
        const badgeClass = isLab ? 'b-selesai' : (isPuskesmas ? 'b-kajian' : 'b-dokter');
        const jarakTeks = l._jarak !== undefined ? (l._jarak >= 1000 ? `${(l._jarak / 1000).toFixed(1)} km` : `${l._jarak}m`) : '';

        return `
          <div class="p-10 border rounded flex items-center justify-between" style="background: #F8FAFC; border-color: #E2E8F0; border-radius: 8px;">
            <div>
              <div style="font-weight: 700; color: #0F172A; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                ${UI.ikon('faskes', 13)} <span>${UI.esc(l.nama)}</span>
              </div>
              <div class="text-muted text-xs mt-2" style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${UI.esc(l.alamat || '-')}</div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <span class="badge ${badgeClass}" style="font-weight: 600; padding: 2px 6px; font-size: 10px;">${badgeTipe}</span>
              ${jarakTeks ? `<div class="font-mono text-muted mt-2" style="font-size: 10px; font-weight: 700;">${jarakTeks}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    };

    container.querySelector('#cariFaskesAbsen')?.addEventListener('input', (e) => {
      renderDaftarFaskesCepat(e.target.value);
    });

    // Event listener refresh GPS
    container.querySelector('#btnRefreshGps')?.addEventListener('click', () => {
      mintaLokasiGps();
    });

    // Event listener sub-tab karyawan
    container.querySelector('#subTabRiwayat')?.addEventListener('click', () => {
      subTabKaryawan = 'riwayat';
      renderIsiTab();
    });
    container.querySelector('#subTabIzin')?.addEventListener('click', () => {
      subTabKaryawan = 'izin_saya';
      renderIsiTab();
    });

    renderStatusGps();
    updateTombolPresensi();
    renderDaftarFaskesCepat();
    renderSubTabKaryawan();
    inisialisasiPetaLeaflet();
  }

  let polylineJarak = null;

  function inisialisasiPetaLeaflet() {
    const elMap = w.querySelector('#mapAbsensi');
    if (!elMap || typeof L === 'undefined') return;

    try {
      const defLat = -7.386416;
      const defLng = 109.365989;

      elMap.innerHTML = '';
      peta = L.map(elMap, {
        center: [defLat, defLng],
        zoom: 14,
        zoomControl: true
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(peta);

      const bounds = [];

      // Gambar setiap lokasi faskes (Lab Pusat, 22 Puskesmas, dan RS se-Purbalingga)
      masterLokasi.forEach(lok => {
        if (!lok.aktif) return;
        const lat = Number(lok.latitude);
        const lng = Number(lok.longitude);
        bounds.push([lat, lng]);

        const isLab = lok.tipe === 'LAB' || lok.nama.toLowerCase().includes('laboratorium');
        const isRS = lok.tipe === 'RS';

        let markerBg = '#2563EB'; // default puskesmas
        let tipeLabel = 'Puskesmas';

        if (isLab) {
          markerBg = '#0F8B7E';
          tipeLabel = 'Lab Pusat';
        } else if (isRS) {
          markerBg = '#7C3AED';
          tipeLabel = 'Rumah Sakit';
        }

        const iconHtml = `
          <div style="background: ${markerBg}; color: white; border: 2px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.35); border-radius: 16px; padding: 2px 8px; font-weight: 700; font-size: 11px; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-flex; align-items: center;">${UI.ikon('faskes', 12)}</span> <span>${UI.esc(lok.nama)}</span>
          </div>
        `;

        const faskesIcon = L.divIcon({
          className: 'faskes-marker-div',
          html: iconHtml,
          iconAnchor: [30, 12]
        });

        const marker = L.marker([lat, lng], { icon: faskesIcon }).addTo(peta);

        let jarakText = '';
        if (userCoords) {
          const j = hitungJarak(userCoords.lat, userCoords.lng, lat, lng);
          jarakText = `<div style="margin-top: 4px; font-size: 11px; color: #047857; font-weight: 700;">Jarak dari Anda: ${j >= 1000 ? (j/1000).toFixed(1) + ' km' : j + ' meter'}</div>`;
        }

        marker.bindPopup(`
          <div style="font-size:13.5px; font-weight:700; color:#0F172A;">${UI.esc(lok.nama)}</div>
          <div style="font-size:11px; color:#475569; margin-top:2px;">${UI.esc(lok.alamat || '')}</div>
          ${jarakText}
          <div style="margin-top:6px;"><span class="badge" style="background:#F1F5F9; color:#334155; font-size:10px; font-weight:700;">${tipeLabel} Purbalingga</span></div>
        `);
      });

      // Jika userCoords sudah ada, tambahkan marker user
      if (userCoords) {
        tambahMarkerUser(userCoords.lat, userCoords.lng, userCoords.akurasi);
        bounds.push([userCoords.lat, userCoords.lng]);
        peta.setView([userCoords.lat, userCoords.lng], 16);
      } else if (bounds.length > 0) {
        peta.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      }

      setTimeout(() => {
        peta?.invalidateSize();
      }, 250);
    } catch (e) {
      console.error('Inisialisasi Leaflet error:', e);
    }
  }

  function tambahMarkerUser(lat, lng, akurasi) {
    if (!peta) return;
    if (markerUser) {
      peta.removeLayer(markerUser);
      markerUser = null;
    }
    if (polylineJarak) {
      peta.removeLayer(polylineJarak);
      polylineJarak = null;
    }

    const deteksi = evaluasiLokasiCerdas(lat, lng);
    const warnaMarker = deteksi?.tipe === 'LAB' ? '#0F8B7E' : (deteksi?.tipe === 'PUSKESMAS' ? '#2563EB' : '#F59E0B');

    const iconHtml = `
      <div style="position: relative; width: 22px; height: 22px;">
        <div style="position: absolute; top: 0; left: 0; width: 22px; height: 22px; border-radius: 50%; background: ${warnaMarker}; border: 3px solid #ffffff; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'user-pin-div',
      html: iconHtml,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    markerUser = L.marker([lat, lng], { icon: userIcon }).addTo(peta);
    markerUser.bindPopup(`
      <div style="font-size:12.5px; font-weight:700; color:#0F172A;">Posisi Anda Saat Ini</div>
      <div style="font-size:11.5px; margin-top:3px; color: ${warnaMarker}; font-weight:600;">${UI.esc(deteksi?.nama || 'Lokasi Terdeteksi')}</div>
      <div style="font-size:10px; color:#64748B; margin-top:2px;">Akurasi GPS: ±${akurasi} meter</div>
    `).openPopup();

    // Gambar garis penghubung ke faskes terdekat
    if (deteksi?.faskesTerdekat) {
      const fLat = Number(deteksi.faskesTerdekat.latitude);
      const fLng = Number(deteksi.faskesTerdekat.longitude);
      polylineJarak = L.polyline([[lat, lng], [fLat, fLng]], {
        color: warnaMarker,
        weight: 2,
        dashArray: '5, 6',
        opacity: 0.85
      }).addTo(peta);
    }
  }

  function updatePetaDanMarker() {
    if (!peta || !userCoords) return;
    tambahMarkerUser(userCoords.lat, userCoords.lng, userCoords.akurasi);
    peta.panTo([userCoords.lat, userCoords.lng]);
  }

  async function renderStatusGps() {
    const box = w.querySelector('#boxStatusGps');
    if (!box) return;

    if (statusGps === 'memuat') {
      box.innerHTML = `
        <div class="flex items-center gap-8 text-muted">
          <div class="spinner" style="width:14px; height:14px; border-width:2px;"></div>
          <span>${pesanGps}</span>
        </div>
      `;
      return;
    }

    if (statusGps === 'ditolak' || statusGps === 'galat') {
      box.innerHTML = `
        <div class="banner danger p-10 flex items-center justify-between" style="border-radius: var(--radius-sm); margin:0;">
          <div class="flex items-center gap-8">
            ${UI.ikon('peringatan', 18)}
            <div><b>GPS Belum Terdeteksi:</b> ${pesanGps}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Absensi.refreshGps()">Coba Lagi</button>
        </div>
      `;
      return;
    }

    // Status OK: Evaluasi lokasi cerdas
    const deteksi = evaluasiLokasiCerdas(userCoords.lat, userCoords.lng);
    let teksAlamat = deteksi?.alamat;
    if (!teksAlamat) {
      teksAlamat = await dapatkanAlamatNominatim(userCoords.lat, userCoords.lng);
    }

    let iconName = 'faskes';
    let badgeText = 'Laboratorium Medis Utama (Pusat)';
    let bannerBg = '#F0FDF4';
    let bannerBorder = '#86EFAC';
    let bannerColor = '#166534';

    if (deteksi?.tipe === 'PUSKESMAS') {
      iconName = 'faskes';
      badgeText = `${deteksi.nama}`;
      bannerBg = '#EFF6FF';
      bannerBorder = '#93C5FD';
      bannerColor = '#1E40AF';
    } else if (deteksi?.tipe === 'RS') {
      iconName = 'faskes';
      badgeText = `${deteksi.nama}`;
      bannerBg = '#FAF5FF';
      bannerBorder = '#D8B4FE';
      bannerColor = '#6B21A8';
    } else if (deteksi?.tipe === 'DINAS_LUAR') {
      iconName = 'lokasi';
      badgeText = `Dinas Luar / Lapangan`;
      bannerBg = '#FFFBEB';
      bannerBorder = '#FDE68A';
      bannerColor = '#92400E';
    }

    box.innerHTML = `
      <div style="background: ${bannerBg}; border: 1.5px solid ${bannerBorder}; color: ${bannerColor}; border-radius: 10px; padding: 12px 16px;">
        <div class="flex items-center justify-between flex-wrap gap-10">
          <div class="flex items-center gap-12">
            <span style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: rgba(0,0,0,0.05);">
              ${UI.ikon(iconName, 22)}
            </span>
            <div>
              <div style="font-size: 13.5px; font-weight: 700;">${UI.esc(badgeText)}</div>
              <div class="text-xs" style="margin-top: 2px; opacity: 0.95;">
                ${deteksi?.tipe === 'DINAS_LUAR' ? `${UI.esc(teksAlamat)} (Dekat ${deteksi.faskesTerdekat?.nama || 'Puskesmas'} ±${deteksi.jarak >= 1000 ? (deteksi.jarak/1000).toFixed(1) + ' km' : deteksi.jarak + 'm'})` : UI.esc(teksAlamat || '')}
                • Akurasi GPS: ±${userCoords.akurasi}m
              </div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Absensi.refreshGps()" style="height: 32px; font-size: 11.5px; font-weight: 600;">
            ${UI.ikon('ulang', 12)} Perbarui Lokasi
          </button>
        </div>
      </div>
    `;
  }

  async function updateTombolPresensi() {
    const p = w.querySelector('#panelAksiAbsen');
    if (!p) return;

    // Sinkronkan absenHariIni dengan shift yang sedang aktif dipilih
    absenHariIni = shiftDipilih === 2 ? dataAbsenShift2 : dataAbsenShift1;
    const targetShift = getTargetShift(shiftDipilih);

    const deteksi = userCoords ? evaluasiLokasiCerdas(userCoords.lat, userCoords.lng) : null;
    let namaLokasiTampil = deteksi ? deteksi.nama : 'Mendeteksi lokasi...';
    if (deteksi?.tipe === 'DINAS_LUAR' && userCoords) {
      const alamat = await dapatkanAlamatNominatim(userCoords.lat, userCoords.lng);
      namaLokasiTampil = `Dinas Luar (${alamat})`;
    } else if (deteksi?.jarak > 0) {
      namaLokasiTampil = `${deteksi.nama} (Jarak: ${deteksi.jarak}m)`;
    }

    // Toggle tombol Shift 1 vs Shift 2
    const htmlToggleShift = `
      <div class="mb-14" style="background: #F1F5F9; padding: 4px; border-radius: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <button type="button" class="btn btn-sm ${shiftDipilih === 1 ? 'btn-primary' : 'btn-ghost'}" id="btnPilihShift1" 
                style="font-weight: 700; border-radius: 8px; padding: 7px 4px; font-size: 11.5px; height: auto; line-height: 1.35; ${shiftDipilih === 1 ? 'box-shadow: 0 2px 6px rgba(15,139,126,0.3);' : 'color: #475569;'}">
          Shift 1 (Pagi)<br>
          <span class="mono" style="font-size: 10px; font-weight: normal; opacity: 0.9;">${jamKerja.shift1_masuk || '07:30'} - ${jamKerja.shift1_pulang || '14:30'}</span>
          ${dataAbsenShift1 ? `<div style="font-size: 9.5px; margin-top: 2px; font-weight: 700;">${dataAbsenShift1.waktu_keluar ? '• Selesai Pulang' : '• Sedang Bertugas'}</div>` : ''}
        </button>
        <button type="button" class="btn btn-sm ${shiftDipilih === 2 ? 'btn-primary' : 'btn-ghost'}" id="btnPilihShift2" 
                style="font-weight: 700; border-radius: 8px; padding: 7px 4px; font-size: 11.5px; height: auto; line-height: 1.35; ${shiftDipilih === 2 ? 'background: #7C3AED; color: white; border-color: #7C3AED; box-shadow: 0 2px 6px rgba(124,58,237,0.3);' : 'color: #475569;'}">
          Shift 2 (Siang)<br>
          <span class="mono" style="font-size: 10px; font-weight: normal; opacity: 0.9;">${jamKerja.shift2_masuk || '14:00'} - ${jamKerja.shift2_pulang || '21:00'}</span>
          ${dataAbsenShift2 ? `<div style="font-size: 9.5px; margin-top: 2px; font-weight: 700;">${dataAbsenShift2.waktu_keluar ? '• Selesai Pulang' : '• Sedang Bertugas'}</div>` : ''}
        </button>
      </div>
    `;

    if (!absenHariIni || !absenHariIni.waktu_masuk || absenHariIni.status === 'BELUM') {
      // Belum absen masuk pada shift yang dipilih
      p.innerHTML = `
        ${htmlToggleShift}
        ${absenHariIni?.keterangan?.includes('Pimpinan') ? `
          <div style="font-size: 11.5px; color: #0F8B7E; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 4px 8px; margin-bottom: 10px; font-weight: 600;">
            Jadwal Shift Hari Ini Ditentukan oleh Pimpinan
          </div>
        ` : ''}
        <div style="font-size: 13px; color: var(--ink-600); margin-bottom: 2px;">Status Presensi:</div>
        <div style="margin-bottom: 8px;">
          <span class="badge ${targetShift.badgeClass}" style="font-size: 11.5px; padding: 4px 10px; font-weight: 700;">
            ${targetShift.nama}
          </span>
        </div>
        <div style="font-size: 18px; font-weight: 800; color: var(--warn-700); margin-bottom: 12px;">
          BELUM ABSEN MASUK
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; text-align: left;">
          <div class="flex justify-between text-xs mb-4">
            <span class="text-muted">Jadwal Masuk:</span>
            <b style="color: #0F172A;">${targetShift.masuk} WIB</b>
          </div>
          <div class="flex justify-between text-xs mb-8">
            <span class="text-muted">Batas Toleransi:</span>
            <b style="color: #0F172A;">${targetShift.toleransi} Menit</b>
          </div>
          <div style="border-top: 1px dashed #E2E8F0; padding-top: 8px;">
            <div style="font-size: 11px; color: #64748B; font-weight: 700; text-transform: uppercase;">Lokasi Terdeteksi:</div>
            <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-top: 3px; display: flex; align-items: center; gap: 5px;">
              ${userCoords ? `${UI.ikon('lokasi', 14)} <span>${UI.esc(namaLokasiTampil)}</span>` : '<span class="text-muted">Mencari koordinat GPS...</span>'}
            </div>
            ${userCoords ? `<div class="text-xs text-muted mt-2 font-mono">${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)} (±${userCoords.akurasi}m)</div>` : ''}
          </div>
        </div>

        <button class="btn btn-primary w-full" id="btnClockIn" 
          style="font-size: 15px; padding: 13px; font-weight: 700; ${shiftDipilih === 2 ? 'background: #7C3AED; border-color: #7C3AED;' : 'background: #0F8B7E;'} color: white;">
          ${UI.ikon('centang', 18)} Absen Masuk (${targetShift.labelSingkat})
        </button>
      `;

      p.querySelector('#btnClockIn')?.addEventListener('click', prosesClockIn);

    } else if (!absenHariIni.waktu_keluar && absenHariIni.status === 'HADIR') {
      // Sudah absen masuk pada shift ini, belum absen keluar
      p.innerHTML = `
        ${htmlToggleShift}
        <div style="font-size: 13px; color: var(--ink-600); margin-bottom: 2px;">Status Presensi:</div>
        <div style="margin-bottom: 8px;">
          <span class="badge ${targetShift.badgeClass}" style="font-size: 11.5px; padding: 4px 10px; font-weight: 700;">
            ${targetShift.nama}
          </span>
        </div>
        <div style="font-size: 18px; font-weight: 800; color: var(--ok-700); margin-bottom: 12px;">
          SEDANG BEKERJA
        </div>

        <div class="p-12 border rounded mb-14 text-left text-xs" style="background: var(--ink-50); border-radius: 8px;">
          <div class="flex justify-between mb-4">
            <span class="text-muted">Jam Masuk:</span>
            <b style="color: #0F172A;">${UI.jam(absenHariIni.waktu_masuk)} WIB</b>
          </div>
          <div class="flex justify-between mb-4">
            <span class="text-muted">Target Jam Pulang:</span>
            <b style="color: #0F172A;">${targetShift.pulang} WIB</b>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Lokasi Masuk:</span>
            <b style="color: #0F8B7E; text-align: right; max-width: 60%;">${UI.esc(absenHariIni.lokasi_masuk || '-')}</b>
          </div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; text-align: left;">
          <div style="font-size: 11px; color: #64748B; font-weight: 700; text-transform: uppercase;">Lokasi Pulang Saat Ini:</div>
          <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-top: 3px; display: flex; align-items: center; gap: 5px;">
            ${userCoords ? `${UI.ikon('lokasi', 14)} <span>${UI.esc(namaLokasiTampil)}</span>` : '<span class="text-muted">Mencari koordinat GPS...</span>'}
          </div>
        </div>

        <button class="btn btn-secondary w-full" id="btnClockOut" 
          style="font-size: 15px; padding: 13px; font-weight: 700; color: var(--danger-700); border-color: var(--danger-700);">
          ${UI.ikon('jam', 18)} Absen Keluar (${targetShift.labelSingkat})
        </button>
      `;

      p.querySelector('#btnClockOut')?.addEventListener('click', prosesClockOut);

    } else if (absenHariIni.status !== 'HADIR') {
      // Sedang cuti / izin / sakit
      p.innerHTML = `
        ${htmlToggleShift}
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #EFF6FF; color: #2563EB; display: grid; place-items: center; margin: 0 auto 10px auto;">
          ${UI.ikon('dokumen', 24)}
        </div>
        <div style="font-size: 17px; font-weight: 800; color: var(--brand-800); margin-bottom: 6px;">
          STATUS: ${UI.esc(absenHariIni.status)}
        </div>
        <div class="text-muted text-xs mb-14" style="line-height: 1.5;">
          ${UI.esc(absenHariIni.keterangan || 'Anda terdaftar izin/cuti resmi hari ini.')}
        </div>
        <span class="badge b-kajian" style="font-size: 11px; padding: 4px 10px;">Permohonan Disetujui</span>
      `;

    } else {
      // Sudah selesai absen masuk dan keluar pada shift ini
      p.innerHTML = `
        ${htmlToggleShift}
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #F0FDF4; color: #16A34A; display: grid; place-items: center; margin: 0 auto 10px auto;">
          ${UI.ikon('centang', 26)}
        </div>
        <div style="font-size: 18px; font-weight: 800; color: #16A34A; margin-bottom: 4px;">
          PRESENSI SELESAI
        </div>
        <div style="margin-bottom: 8px;">
          <span class="badge ${targetShift.badgeClass}" style="font-size: 11px; padding: 3px 8px; font-weight: 700;">
            ${targetShift.nama}
          </span>
        </div>
        <div class="text-muted text-xs mb-14">
          Terima kasih atas dedikasi tugas Anda pada ${targetShift.nama} hari ini!
        </div>

        <div class="p-14 border rounded text-left text-xs" style="background: #F8FAFC; border-color: #E2E8F0; border-radius: 8px;">
          <div class="flex justify-between mb-6">
            <span class="text-muted">Waktu Masuk:</span>
            <b style="color: #0F172A;">${UI.jam(absenHariIni.waktu_masuk)} WIB</b>
          </div>
          <div class="flex justify-between mb-6">
            <span class="text-muted">Lokasi Masuk:</span>
            <b style="color: #0F8B7E; text-align: right; max-width: 60%;">${UI.esc(absenHariIni.lokasi_masuk || '-')}</b>
          </div>
          <div class="flex justify-between mb-6">
            <span class="text-muted">Waktu Keluar:</span>
            <b style="color: #0F172A;">${UI.jam(absenHariIni.waktu_keluar)} WIB</b>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Lokasi Keluar:</span>
            <b style="color: #0F8B7E; text-align: right; max-width: 60%;">${UI.esc(absenHariIni.lokasi_keluar || '-')}</b>
          </div>
        </div>
      `;
    }

    // Listener switch tombol shift
    p.querySelector('#btnPilihShift1')?.addEventListener('click', () => {
      if (shiftDipilih === 1) return;
      shiftDipilih = 1;
      updateTombolPresensi();
    });
    p.querySelector('#btnPilihShift2')?.addEventListener('click', () => {
      if (shiftDipilih === 2) return;
      shiftDipilih = 2;
      updateTombolPresensi();
    });
  }

  async function prosesClockIn() {
    if (!userCoords) {
      UI.toast('Sedang mengambil koordinat GPS. Mohon tunggu sejenak atau perbarui GPS.', 'err');
      mintaLokasiGps();
      return;
    }

    const deteksi = evaluasiLokasiCerdas(userCoords.lat, userCoords.lng);
    let namaLokasiFormat = deteksi?.nama || 'Lokasi Terdeteksi';
    let tipeLokasi = deteksi?.tipe || 'DINAS_LUAR';

    if (tipeLokasi === 'DINAS_LUAR') {
      const alamat = await dapatkanAlamatNominatim(userCoords.lat, userCoords.lng);
      namaLokasiFormat = `Dinas Luar: ${alamat}`;
    } else if (deteksi?.jarak > 0) {
      namaLokasiFormat = `${deteksi.nama} (±${deteksi.jarak}m)`;
    }

    const targetShift = getTargetShift(shiftDipilih);
    const nowIso = new Date().toISOString();
    const late = cekStatusKeterlambatan(nowIso, targetShift.masuk, targetShift.toleransi);

    let pesanKonf = `Konfirmasi presensi masuk ${targetShift.nama} di:\n• Lokasi: ${namaLokasiFormat}\n• Jam Masuk Shift: ${targetShift.masuk} WIB\n\nCatat kehadiran masuk sekarang?`;
    if (late?.terlambat) {
      pesanKonf = `Perhatian: Jam masuk ${targetShift.nama} adalah ${targetShift.masuk} WIB.\nAnda tercatat terlambat ${late.menit} menit (melewati batas toleransi ${targetShift.toleransi} menit).\n\nLokasi terdeteksi:\n• Lokasi: ${namaLokasiFormat}\n\nTetap lanjutkan absen masuk?`;
    }

    const konf = await UI.konfirmasi(`Konfirmasi Absen Masuk ${targetShift.labelSingkat}`, pesanKonf, 'Absen Masuk', late?.terlambat);
    if (!konf) return;

    try {
      const ket = late?.terlambat ? `Terlambat ${late.menit} menit (${targetShift.labelSingkat})` : `Tepat Waktu (${targetShift.labelSingkat})`;
      await DB.absensiMasuk(ket, namaLokasiFormat, {
        tipe: tipeLokasi,
        lat: userCoords.lat,
        lng: userCoords.lng,
        shift: shiftDipilih
      });

      if (late?.terlambat) {
        UI.toast(`Absen masuk ${targetShift.labelSingkat} tercatat di ${namaLokasiFormat} (Terlambat ${late.menit} menit). Selamat bertugas!`, 'warn');
      } else {
        UI.toast(`Absen masuk ${targetShift.labelSingkat} berhasil tercatat di ${namaLokasiFormat}! Selamat bertugas.`, 'ok');
      }
      await muatData();
    } catch (err) {
      UI.toast('Gagal absen masuk: ' + err.message, 'err');
    }
  }

  async function prosesClockOut() {
    if (!userCoords) {
      UI.toast('Sedang mengambil koordinat GPS. Mohon tunggu sejenak atau perbarui GPS.', 'err');
      mintaLokasiGps();
      return;
    }

    if (!absenHariIni || !absenHariIni.id) {
      UI.toast('Data absensi masuk hari ini tidak ditemukan.', 'err');
      return;
    }

    const deteksi = evaluasiLokasiCerdas(userCoords.lat, userCoords.lng);
    let namaLokasiFormat = deteksi?.nama || 'Lokasi Terdeteksi';
    let tipeLokasi = deteksi?.tipe || 'DINAS_LUAR';

    if (tipeLokasi === 'DINAS_LUAR') {
      const alamat = await dapatkanAlamatNominatim(userCoords.lat, userCoords.lng);
      namaLokasiFormat = `Dinas Luar: ${alamat}`;
    } else if (deteksi?.jarak > 0) {
      namaLokasiFormat = `${deteksi.nama} (±${deteksi.jarak}m)`;
    }

    const targetShift = getTargetShift(shiftDipilih);
    const nowIso = new Date().toISOString();
    const early = cekPulangCepat(nowIso, targetShift.pulang);

    let pesanKonf = `Konfirmasi presensi pulang ${targetShift.nama} di:\n• Lokasi: ${namaLokasiFormat}\n• Jam Pulang Shift: ${targetShift.pulang} WIB\n\nCatat kepulangan sekarang?`;
    if (early?.cepat) {
      pesanKonf = `Perhatian: Jam pulang resmi ${targetShift.nama} adalah ${targetShift.pulang} WIB.\nSaat ini masih kurang ${early.menit} menit sebelum jam pulang.\n\nLokasi terdeteksi:\n• Lokasi: ${namaLokasiFormat}\n\nTetap lanjutkan absen keluar?`;
    }

    const konf = await UI.konfirmasi(`Konfirmasi Absen Keluar ${targetShift.labelSingkat}`, pesanKonf, 'Absen Keluar', early?.cepat);
    if (!konf) return;

    try {
      const ketPulang = early?.cepat ? `Pulang lebih awal (-${early.menit} mnt)` : 'Pulang Tepat Waktu';
      const ketGabung = [absenHariIni.keterangan, ketPulang].filter(Boolean).join(' • ');

      await DB.absensiKeluar(absenHariIni.id, ketGabung, namaLokasiFormat, {
        tipe: tipeLokasi,
        lat: userCoords.lat,
        lng: userCoords.lng
      });

      UI.toast(`Absen pulang ${targetShift.labelSingkat} tercatat di ${namaLokasiFormat}. Selamat beristirahat!`, 'ok');
      await muatData();
    } catch (err) {
      UI.toast('Gagal absen keluar: ' + err.message, 'err');
    }
  }

  function dialogDetailPetaAbsensi(rec) {
    let lat = Number(rec.lat_masuk || rec.lat_keluar);
    let lng = Number(rec.lng_masuk || rec.lng_keluar);
    const teksLokasi = rec.lokasi_masuk || rec.lokasi_keluar || 'Lokasi Absensi';

    // Ekstrak dari string jika ada koordinat
    if (isNaN(lat) || isNaN(lng) || !lat) {
      const match = teksLokasi.match(/\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }
    // Cek kecocokan faskes terdaftar jika koordinat kosong
    if ((isNaN(lat) || isNaN(lng) || !lat) && teksLokasi) {
      const matchFaskes = masterLokasi.find(l => teksLokasi.toLowerCase().includes(l.nama.toLowerCase()));
      if (matchFaskes) {
        lat = Number(matchFaskes.latitude);
        lng = Number(matchFaskes.longitude);
      }
    }
    if (isNaN(lat) || isNaN(lng) || !lat) {
      lat = -7.386416;
      lng = 109.365989;
    }

    UI.modal({
      judul: `Titik Lokasi Presensi: ${UI.esc(rec.nama || rec.pegawai?.nama || 'Pegawai')}`,
      lebar: true,
      isi: `
        <div style="margin-bottom: 12px; background: #F8FAFC; padding: 12px 16px; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${UI.esc(teksLokasi)}</div>
          <div class="text-xs text-muted mt-4">
            Tanggal: <b>${UI.tglIndo(rec.tanggal)}</b> &nbsp;•&nbsp; 
            Jam Masuk: <b>${rec.waktu_masuk ? UI.jam(rec.waktu_masuk) + ' WIB' : '—'}</b> &nbsp;•&nbsp; 
            Jam Keluar: <b>${rec.waktu_keluar ? UI.jam(rec.waktu_keluar) + ' WIB' : '—'}</b> &nbsp;•&nbsp; 
            Koordinat GPS: <b class="mono" style="color: #0F8B7E;">${lat.toFixed(6)}, ${lng.toFixed(6)}</b>
          </div>
        </div>
        <div id="mapDetailLog" style="height: 380px; width: 100%; border-radius: 10px; border: 1.5px solid #CBD5E1; overflow: hidden; background: #E2E8F0;">
          <div style="display: grid; place-items: center; height: 100%; color: #64748B;">Memuat Peta...</div>
        </div>
      `,
      siap: (modalBody) => {
        setTimeout(() => {
          const el = modalBody.querySelector('#mapDetailLog');
          if (!el || typeof L === 'undefined') return;
          el.innerHTML = '';
          const m = L.map(el, { center: [lat, lng], zoom: 16 });
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(m);

          L.marker([lat, lng]).addTo(m)
            .bindPopup(`
              <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${UI.esc(rec.nama || rec.pegawai?.nama || 'Staf')}</div>
              <div style="font-size: 11.5px; color: #334155; margin-top: 2px;">${UI.esc(teksLokasi)}</div>
              <div style="font-size: 10.5px; color: #64748B; margin-top: 4px;" class="mono">GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
            `)
            .openPopup();
        }, 200);
      },
      tombol: [{ teks: 'Tutup', nilai: true }]
    });
  }

  function renderSubTabKaryawan() {
    const el = w.querySelector('#kontenSubTabKaryawan');
    if (!el) return;

    if (subTabKaryawan === 'riwayat') {
      if (!riwayatAbsen.length) {
        el.innerHTML = `<div class="empty text-center p-20 text-muted">Belum ada riwayat absensi pada bulan ini.</div>`;
        return;
      }
      el.innerHTML = `
        <div class="absensi-table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>Tanggal</th>
            <th>Shift</th>
            <th>Waktu Masuk</th>
            <th>Waktu Keluar</th>
            <th>Lokasi Masuk</th>
            <th>Status</th>
          </tr></thead>
          <tbody>
            ${riwayatAbsen.map(r => `
              <tr>
                <td><b>${UI.tglIndo(r.tanggal, true)}</b></td>
                <td>
                  <span class="badge ${r.shift === 2 ? 'b-dokter' : 'b-selesai'}" style="font-size: 11px; padding: 2px 7px; font-weight: 700;">
                    Shift ${r.shift || 1}
                  </span>
                </td>
                <td class="mono">${r.waktu_masuk ? UI.jam(r.waktu_masuk) + ' WIB' : '—'}</td>
                <td class="mono">${r.waktu_keluar ? UI.jam(r.waktu_keluar) + ' WIB' : '—'}</td>
                <td>${badgeLokasiHtml(r.lokasi_masuk, r.id)}</td>
                <td>
                  <span class="badge ${r.status === 'HADIR' ? 'b-selesai' : (r.status === 'ALFA' ? 'b-danger' : 'b-kajian')}">
                    ${UI.esc(r.status)}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>
      `;

      el.querySelectorAll('[data-buka-peta]').forEach(b => {
        b.addEventListener('click', () => {
          const recId = b.dataset.bukaPeta;
          const rec = riwayatAbsen.find(x => String(x.id) === String(recId));
          if (rec) dialogDetailPetaAbsensi(rec);
        });
      });
    } else {
      // Sub tab Izin / Cuti Saya
      if (!daftarIzinSayaList.length) {
        el.innerHTML = `
          <div class="empty text-center p-20 text-muted">
            <div>Belum ada permohonan izin atau cuti yang diajukan.</div>
            <button class="btn btn-primary btn-sm mt-12" id="btnAjukanIzinCutiDlm">Ajukan Sekarang</button>
          </div>
        `;
        el.querySelector('#btnAjukanIzinCutiDlm')?.addEventListener('click', dialogAjukanIzin);
        return;
      }

      el.innerHTML = `
        <div class="absensi-table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>Jenis</th>
            <th>Rentang Tanggal</th>
            <th>Alasan / Keterangan</th>
            <th>Status Permohonan</th>
            <th>Catatan Pimpinan</th>
            <th>Aksi</th>
          </tr></thead>
          <tbody>
            ${daftarIzinSayaList.map(iz => `
              <tr>
                <td><b>${UI.esc(iz.jenis)}</b></td>
                <td>${UI.tglIndo(iz.tanggal_mulai)} s/d ${UI.tglIndo(iz.tanggal_selesai)}</td>
                <td class="text-sm">${UI.esc(iz.keterangan)}</td>
                <td>
                  <span class="badge ${iz.status === 'DISETUJUI' ? 'b-selesai' : (iz.status === 'DITOLAK' ? 'b-danger' : 'b-menunggu')}">
                    ${UI.esc(iz.status)}
                  </span>
                </td>
                <td class="text-xs text-muted">${UI.esc(iz.catatan_atasan || '—')}</td>
                <td>
                  ${iz.status === 'MENUNGGU' ? `
                    <button class="btn btn-secondary btn-sm" data-batal-izin="${iz.id}" style="color:var(--danger-700);">
                      Batalkan
                    </button>
                  ` : '—'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>
      `;

      el.querySelectorAll('[data-batal-izin]').forEach(b => {
        b.addEventListener('click', async () => {
          if (!await UI.konfirmasi('Batalkan Pengajuan', 'Apakah Anda yakin ingin membatalkan permohonan ini?', 'Ya, Batalkan', true)) return;
          try {
            await DB.batalkanIzin(b.dataset.batalIzin);
            UI.toast('Pengajuan berhasil dibatalkan.', 'ok');
            await muatData();
          } catch (e) {
            UI.toast('Gagal membatalkan: ' + e.message, 'err');
          }
        });
      });
    }
  }

  /* =====================================================================
     DIALOG PENGAJUAN CUTI / IZIN / SAKIT (TANPA FOTO/GAMBAR)
     ===================================================================== */
  function dialogAjukanIzin() {
    UI.modal({
      judul: 'Formulir Pengajuan Cuti / Izin / Sakit',
      lebar: false,
      isi: `
        <div class="banner info mb-16 text-xs">
          <div>Silakan pilih jenis permohonan, rentang tanggal, dan berikan keterangan alasan keperluan. Tidak memerlukan upload foto/lampiran berkas.</div>
        </div>

        <form id="formIzin" style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
          <div class="field">
            <label>Jenis Permohonan <span class="req">*</span></label>
            <select name="jenis" class="w-full" required>
              <option value="CUTI">Cuti Tahunan</option>
              <option value="IZIN">Izin Urusan Pribadi / Keluarga</option>
              <option value="SAKIT">Sakit</option>
              <option value="DINAS_LUAR">Tugas / Dinas Luar Kota</option>
            </select>
          </div>

          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="field">
              <label>Tanggal Mulai <span class="req">*</span></label>
              <input type="date" name="tanggal_mulai" value="${UI.hariIni()}" required class="w-full">
            </div>
            <div class="field">
              <label>Tanggal Selesai <span class="req">*</span></label>
              <input type="date" name="tanggal_selesai" value="${UI.hariIni()}" required class="w-full">
            </div>
          </div>

          <div class="field">
            <label>Alasan / Keterangan Keperluan <span class="req">*</span></label>
            <textarea name="keterangan" rows="3" class="w-full" placeholder="Tuliskan keterangan lengkap (misal: keperluan keluarga di luar kota, kontrol kesehatan, dsb)..." required></textarea>
          </div>
        </form>
      `,
      tombol: [
        { teks: 'Batal', nilai: false },
        { 
          teks: 'Kirim Pengajuan', 
          kelas: 'btn-primary', 
          aksi: async (modalBody) => {
            const form = modalBody.querySelector('#formIzin');
            if (!form.reportValidity()) return false;
            
            const data = {
              jenis: form.jenis.value,
              tanggal_mulai: form.tanggal_mulai.value,
              tanggal_selesai: form.tanggal_selesai.value,
              keterangan: form.keterangan.value.trim()
            };

            if (data.tanggal_selesai < data.tanggal_mulai) {
              UI.toast('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.', 'err');
              return false;
            }

            try {
              await DB.ajukanIzin(data);
              UI.toast('Permohonan berhasil dikirim ke Master.', 'ok');
              await muatData();
              return true;
            } catch (err) {
              UI.toast('Gagal mengajukan izin: ' + err.message, 'err');
              return false;
            }
          }
        }
      ]
    });
  }

  /* =====================================================================
     TAB 2: MONITORING KEHADIRAN STAF (MASTER ONLY)
     ===================================================================== */
  async function renderTabMonitoring(container) {
    let teksCari = '';
    let filterStatus = '';
    let filterShift = '';
    let markerStafMap = {};

    container.innerHTML = `
      <div class="absensi-panel">
        <div class="absensi-panel-head">
          <div>
            <h2 class="flex items-center gap-10" style="margin: 0; font-size: 17px; font-weight: 700; color: #0F172A;">
              ${UI.ikon('pengguna', 19)} Monitoring Kehadiran & Sebaran Staf
            </h2>
            <div class="text-muted text-xs mt-4">Pantau kehadiran real-time dan sebaran lokasi presensi seluruh staf aktif faskes.</div>
          </div>
          <div class="flex items-center gap-10 flex-wrap">
            <div class="flex items-center gap-6">
              <label class="text-xs text-muted" style="font-weight: 600;">Tanggal:</label>
              <input type="date" id="tglMonitoring" value="${tanggalMonitoring}" class="input-sm" style="height: 36px; padding: 0 10px; border-radius: 8px; border: 1px solid #CBD5E1;">
            </div>
            <button class="btn btn-secondary btn-sm" id="btnRefreshMonitoring" style="height: 36px; padding: 0 14px; font-weight: 600;">
              ${UI.ikon('ulang', 13)} Muat Ulang
            </button>
          </div>
        </div>

        <!-- Banner Jadwal Operasional & Jam Kerja Aktif 2 Shift -->
        <div class="absensi-banner-box" style="margin: 20px 24px 0 24px; border-radius: 10px; background: #ffffff; border: 1.5px solid #E2E8F0; padding: 14px 20px;">
          <div class="flex items-center justify-between flex-wrap gap-12">
            <div class="flex items-center gap-12">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(15, 139, 126, 0.12); display: grid; place-items: center; color: var(--brand-800); flex-shrink: 0;">
                ${UI.ikon('jam', 20)}
              </div>
              <div>
                <span class="text-xs text-muted" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ketentuan Jam Operasional 2 Shift:</span>
                <div class="flex items-center gap-10 mt-2 flex-wrap" style="font-size: 12.5px;">
                  <span class="badge b-selesai" style="font-size: 11px; padding: 2px 8px; font-weight: 700;">Shift 1 (Pagi)</span>
                  <span style="color: #0F172A; font-weight: 600;">${jamKerja.shift1_masuk || '07:30'} - ${jamKerja.shift1_pulang || '14:30'} WIB</span>
                  <span class="text-muted">(Toleransi ${jamKerja.shift1_toleransi ?? 15}m)</span>
                  <span class="text-muted">•</span>
                  <span class="badge b-dokter" style="font-size: 11px; padding: 2px 8px; font-weight: 700;">Shift 2 (Siang)</span>
                  <span style="color: #0F172A; font-weight: 600;">${jamKerja.shift2_masuk || '14:00'} - ${jamKerja.shift2_pulang || '21:00'} WIB</span>
                  <span class="text-muted">(Toleransi ${jamKerja.shift2_toleransi ?? 15}m)</span>
                </div>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btnUbahJamDariMonitoring" style="font-size: 12px; padding: 6px 14px; font-weight: 600;">
              ${UI.ikon('setelan', 13)} Atur Jam Kerja
            </button>
          </div>
        </div>

        <!-- Rekap Angka Statistik Real-Time -->
        <div id="rekapStatMonitoring" class="absensi-stat-grid" style="margin-top: 20px;">
          ${UI.memuat(1)}
        </div>

        <!-- Peta Visual Sebaran Presensi Staf Hari Ini -->
        <div style="margin: 20px 24px 0 24px;">
          <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <div style="padding: 14px 18px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div class="flex items-center gap-10">
                <span style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: #E6F4F1; color: #0F8B7E;">
                  ${UI.ikon('peta', 17)}
                </span>
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: #0F172A;">Peta Sebaran Lokasi Presensi Staf</div>
                  <div class="text-xs text-muted">Pemantauan visual posisi absensi staf & faskes di wilayah Purbalingga</div>
                </div>
              </div>
              <div class="flex items-center gap-12 text-xs" style="font-weight: 500;">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: #0F8B7E; display: inline-block;"></span> Lab Pusat
                </span>
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: #2563EB; display: inline-block;"></span> Sedang Bekerja
                </span>
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: #16A34A; display: inline-block;"></span> Presensi Selesai
                </span>
              </div>
            </div>
            <div id="mapMonitoringLive" style="height: 380px; width: 100%; position: relative; background: #E2E8F0;">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #64748B; font-size: 13px;">
                Memuat Peta Sebaran Staf...
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Pencarian, Shift & Status Kehadiran Karyawan -->
        <div class="p-16 border-bottom flex items-center justify-between flex-wrap gap-12" style="background: #ffffff; padding: 16px 24px; margin-top: 20px;">
          <div class="flex items-center gap-10 flex-wrap" style="flex: 1;">
            <input type="search" id="cariStafMonitoring" placeholder="Cari nama karyawan..." 
                   class="ctl-sm" style="max-width: 240px; height: 36px; border-radius: 8px; padding: 0 12px;">
            <select id="filterShiftMonitoring" class="ctl-sm" style="height: 36px; border-radius: 8px; padding: 0 12px;">
              <option value="">Semua Shift (1 & 2)</option>
              <option value="1">Shift 1 (Pagi)</option>
              <option value="2">Shift 2 (Siang)</option>
            </select>
            <select id="filterStatusMonitoring" class="ctl-sm" style="height: 36px; border-radius: 8px; padding: 0 12px;">
              <option value="">Semua Status Kehadiran</option>
              <option value="BEKERJA">Sedang Bekerja</option>
              <option value="SELESAI">Selesai Pulang</option>
              <option value="BELUM">Belum Hadir</option>
              <option value="IZIN">Izin / Cuti</option>
            </select>
          </div>
          <div class="text-xs text-muted" id="labelHitungStaf" style="font-weight: 600;">
            Memuat daftar karyawan...
          </div>
        </div>

        <!-- Tabel Monitoring Kehadiran Staf -->
        <div style="padding: 20px 24px;">
          <div id="tabelMonitoringWrap">${UI.memuat(3)}</div>
        </div>
      </div>
    `;

    const muatMonitoring = async () => {
      try {
        const tgl = container.querySelector('#tglMonitoring').value;
        tanggalMonitoring = tgl;
        const data = await DB.absensiSemuaHariIni(tgl);
        monitoringList = data || [];

        // Hitung statistik
        const total = monitoringList.length;
        const sedangBekerja = monitoringList.filter(m => m.status === 'HADIR' && m.waktu_masuk && !m.waktu_keluar).length;
        const tepatWaktuCount = monitoringList.filter(m => {
          if (m.status !== 'HADIR' || !m.waktu_masuk) return false;
          const targetMasuk = m.shift === 2 ? (jamKerja.shift2_masuk || '14:00') : (jamKerja.shift1_masuk || '07:30');
          const targetToleransi = m.shift === 2 ? (jamKerja.shift2_toleransi ?? 15) : (jamKerja.shift1_toleransi ?? 15);
          const chk = cekStatusKeterlambatan(m.waktu_masuk, targetMasuk, targetToleransi);
          return chk && !chk.terlambat;
        }).length;
        const terlambatCount = monitoringList.filter(m => {
          if (m.status !== 'HADIR' || !m.waktu_masuk) return false;
          const targetMasuk = m.shift === 2 ? (jamKerja.shift2_masuk || '14:00') : (jamKerja.shift1_masuk || '07:30');
          const targetToleransi = m.shift === 2 ? (jamKerja.shift2_toleransi ?? 15) : (jamKerja.shift1_toleransi ?? 15);
          const chk = cekStatusKeterlambatan(m.waktu_masuk, targetMasuk, targetToleransi);
          return chk && chk.terlambat;
        }).length;
        const selesai = monitoringList.filter(m => m.status === 'HADIR' && m.waktu_keluar).length;
        const izinCuti = monitoringList.filter(m => ['CUTI', 'IZIN', 'SAKIT', 'DINAS_LUAR'].includes(m.status)).length;
        const belum = monitoringList.filter(m => m.status === 'BELUM').length;

        container.querySelector('#rekapStatMonitoring').innerHTML = `
          <div class="absensi-stat-card">
            <div class="text-xs text-muted">Total Karyawan</div>
            <div style="font-size:22px; font-weight:800; color:#0F172A;">${total}</div>
          </div>
          <div class="absensi-stat-card stat-ok">
            <div class="text-xs" style="color:var(--ok-700); font-weight:600;">Sedang Bekerja</div>
            <div style="font-size:22px; font-weight:800; color:var(--ok-700);">${sedangBekerja}</div>
          </div>
          <div class="absensi-stat-card stat-ok">
            <div class="text-xs" style="color:var(--ok-700); font-weight:600;">Tepat Waktu</div>
            <div style="font-size:22px; font-weight:800; color:var(--ok-700);">${tepatWaktuCount}</div>
          </div>
          <div class="absensi-stat-card stat-danger">
            <div class="text-xs" style="color:var(--danger-700); font-weight:600;">Terlambat</div>
            <div style="font-size:22px; font-weight:800; color:var(--danger-700);">${terlambatCount}</div>
          </div>
          <div class="absensi-stat-card stat-brand">
            <div class="text-xs" style="color:var(--brand-800); font-weight:600;">Selesai Pulang</div>
            <div style="font-size:22px; font-weight:800; color:var(--brand-800);">${selesai}</div>
          </div>
          <div class="absensi-stat-card stat-warn">
            <div class="text-xs" style="color:var(--warn-700); font-weight:600;">Izin / Cuti</div>
            <div style="font-size:22px; font-weight:800; color:var(--warn-700);">${izinCuti}</div>
          </div>
          <div class="absensi-stat-card">
            <div class="text-xs text-muted" style="font-weight:600;">Belum Hadir</div>
            <div style="font-size:22px; font-weight:800; color:var(--ink-600);">${belum}</div>
          </div>
        `;

        renderTabelMonitoring();

        // Inisialisasi peta live monitoring staf
        const elMapMon = container.querySelector('#mapMonitoringLive');
        if (elMapMon && typeof L !== 'undefined') {
          setTimeout(() => {
            try {
              if (petaMonitoring) {
                petaMonitoring.remove();
                petaMonitoring = null;
              }
              elMapMon.innerHTML = '';
              petaMonitoring = L.map(elMapMon, {
                center: [-7.386416, 109.365989],
                zoom: 12
              });

              L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
              }).addTo(petaMonitoring);

              // Home base: Lab Pusat
              const iconLab = L.divIcon({
                className: 'leaflet-marker-lab',
                html: `
                  <div style="background: #0F8B7E; color: white; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35);">
                    ${UI.ikon('faskes', 18)}
                  </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
                popupAnchor: [0, -17]
              });

              L.marker([-7.386416, 109.365989], { icon: iconLab })
                .addTo(petaMonitoring)
                .bindPopup(`
                  <div style="font-size: 13px; font-weight: 800; color: #0F8B7E;">Laboratorium Medis Utama (Pusat)</div>
                  <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Jl. D.I. Panjaitan No. 94, Purbalingga Lor, Purbalingga</div>
                  <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;" class="mono">GPS: -7.386416, 109.365989</div>
                `);

              const bounds = [[-7.386416, 109.365989]];
              markerStafMap = {};

              monitoringList.forEach(m => {
                if (m.status !== 'HADIR' && !m.lat_masuk) return;

                let lat = Number(m.lat_masuk || m.lat_keluar);
                let lng = Number(m.lng_masuk || m.lng_keluar);
                const teksLokasi = m.lokasi_masuk || m.lokasi_keluar || '';

                if (isNaN(lat) || isNaN(lng) || !lat) {
                  const match = teksLokasi.match(/\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
                  if (match) {
                    lat = parseFloat(match[1]);
                    lng = parseFloat(match[2]);
                  }
                }
                if ((isNaN(lat) || isNaN(lng) || !lat) && teksLokasi) {
                  const matchFaskes = masterLokasi.find(l => teksLokasi.toLowerCase().includes(l.nama.toLowerCase()));
                  if (matchFaskes) {
                    lat = Number(matchFaskes.latitude);
                    lng = Number(matchFaskes.longitude);
                  }
                }

                if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
                  bounds.push([lat, lng]);
                  const isSelesai = !!m.waktu_keluar;
                  const warnaMarker = isSelesai ? '#16A34A' : '#2563EB';

                  const iconStaf = L.divIcon({
                    className: 'leaflet-marker-staf',
                    html: `
                      <div style="background: ${warnaMarker}; color: white; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                        ${UI.ikon(isSelesai ? 'centang' : 'pengguna', 15)}
                      </div>
                    `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                    popupAnchor: [0, -15]
                  });

                  const popupHtml = `
                    <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${UI.esc(m.nama)}</div>
                    <div style="display: flex; gap: 4px; margin-top: 3px; align-items: center;">
                      <span class="badge" style="font-size: 10px; background: #F1F5F9; color: #475569; text-transform: uppercase;">${UI.esc(m.peran)}</span>
                      <span class="badge ${isSelesai ? 'b-selesai' : 'b-kajian'}" style="font-size: 10px;">${isSelesai ? 'SELESAI' : 'BEKERJA'}</span>
                    </div>
                    <div style="font-size: 11.5px; color: #334155; margin-top: 6px; font-weight: 600;">
                      ${UI.esc(teksLokasi || 'Lokasi Tercatat')}
                    </div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 3px;">
                      Masuk: <b>${m.waktu_masuk ? UI.jam(m.waktu_masuk) + ' WIB' : '—'}</b> &nbsp;•&nbsp; 
                      Pulang: <b>${m.waktu_keluar ? UI.jam(m.waktu_keluar) + ' WIB' : '—'}</b>
                    </div>
                    <div style="font-size: 10px; color: #0F8B7E; margin-top: 5px; font-weight: 600;" class="mono">
                      GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}
                    </div>
                  `;

                  const marker = L.marker([lat, lng], { icon: iconStaf }).addTo(petaMonitoring);
                  marker.bindPopup(popupHtml);
                  const key = String(m.id || m.pegawai_id);
                  markerStafMap[key] = { marker, lat, lng };
                }
              });

              if (bounds.length > 1) {
                petaMonitoring.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
              }
              setTimeout(() => petaMonitoring && petaMonitoring.invalidateSize(), 200);
            } catch (errPeta) {
              console.error('Peta monitoring error:', errPeta);
            }
          }, 150);
        }

      } catch (err) {
        UI.toast('Gagal memuat monitoring: ' + err.message, 'err');
      }
    };

    const renderTabelMonitoring = () => {
      const wrap = container.querySelector('#tabelMonitoringWrap');
      const labelHitung = container.querySelector('#labelHitungStaf');
      if (!wrap) return;

      const q = (teksCari || '').trim().toLowerCase();
      const st = (filterStatus || '').trim().toUpperCase();

      const filtered = monitoringList.filter(m => {
        if (filterShift && String(m.shift || 1) !== filterShift) return false;
        if (st) {
          if (st === 'BEKERJA' && (m.status !== 'HADIR' || !m.waktu_masuk || m.waktu_keluar)) return false;
          if (st === 'SELESAI' && (m.status !== 'HADIR' || !m.waktu_keluar)) return false;
          if (st === 'BELUM' && m.status !== 'BELUM') return false;
          if (st === 'IZIN' && !['CUTI', 'IZIN', 'SAKIT', 'DINAS_LUAR'].includes(m.status)) return false;
        }
        if (q) {
          const matchNama = (m.nama || '').toLowerCase().includes(q);
          const matchPeran = (m.peran || '').toLowerCase().includes(q);
          const matchKet = (m.keterangan || '').toLowerCase().includes(q);
          if (!matchNama && !matchPeran && !matchKet) return false;
        }
        return true;
      });

      if (labelHitung) {
        labelHitung.textContent = `Menampilkan ${filtered.length} dari ${monitoringList.length} catatan karyawan aktif`;
      }

      if (!filtered.length) {
        wrap.innerHTML = `<div class="empty text-center p-24 text-muted" style="border: 1px dashed #CBD5E1; border-radius: 12px; background: #F8FAFC;">Tidak ada karyawan yang cocok dengan kriteria pencarian.</div>`;
        return;
      }

      wrap.innerHTML = `
        <div class="absensi-table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>NAMA KARYAWAN</th>
            <th>PERAN</th>
            <th>SHIFT</th>
            <th>STATUS</th>
            <th>JAM MASUK</th>
            <th>JAM KELUAR</th>
            <th>LOKASI PRESENSI</th>
            <th>KOORDINAT GPS</th>
            <th>CATATAN</th>
            <th>AKSI</th>
          </tr></thead>
          <tbody>
            ${filtered.map(m => {
              const targetMasuk = m.shift === 2 ? (jamKerja.shift2_masuk || '14:00') : (jamKerja.shift1_masuk || '07:30');
              const targetToleransi = m.shift === 2 ? (jamKerja.shift2_toleransi ?? 15) : (jamKerja.shift1_toleransi ?? 15);
              const lateInfo = m.waktu_masuk ? cekStatusKeterlambatan(m.waktu_masuk, targetMasuk, targetToleransi) : null;
              const badgeMasuk = lateInfo ? (lateInfo.terlambat
                ? `<span class="badge b-danger" style="font-size:10px; margin-left:6px; padding: 2px 6px;" title="Terlambat melewati toleransi">+${lateInfo.menit}m</span>`
                : `<span class="badge b-selesai" style="font-size:10px; margin-left:6px; padding: 2px 6px;" title="Tepat Waktu">Tepat</span>`) : '';

              const targetPulang = m.shift === 2 ? (jamKerja.shift2_pulang || '21:00') : (jamKerja.shift1_pulang || '14:30');
              const earlyInfo = m.waktu_keluar ? cekPulangCepat(m.waktu_keluar, targetPulang) : null;
              const badgeKeluar = earlyInfo ? (earlyInfo.cepat
                ? `<span class="badge b-warn" style="font-size:10px; margin-left:6px; padding: 2px 6px;" title="Pulang lebih awal">-${earlyInfo.menit}m</span>`
                : `<span class="badge b-selesai" style="font-size:10px; margin-left:6px; padding: 2px 6px;" title="Tepat Waktu">Tepat</span>`) : '';

              let latVal = Number(m.lat_masuk || m.lat_keluar);
              let lngVal = Number(m.lng_masuk || m.lng_keluar);
              if (isNaN(latVal) || isNaN(lngVal) || !latVal) {
                const match = (m.lokasi_masuk || '').match(/\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
                if (match) {
                  latVal = parseFloat(match[1]);
                  lngVal = parseFloat(match[2]);
                }
              }
              if ((isNaN(latVal) || isNaN(lngVal) || !latVal) && m.lokasi_masuk) {
                const matchFaskes = masterLokasi.find(l => m.lokasi_masuk.toLowerCase().includes(l.nama.toLowerCase()));
                if (matchFaskes) {
                  latVal = Number(matchFaskes.latitude);
                  lngVal = Number(matchFaskes.longitude);
                }
              }

              const adaKoord = !isNaN(latVal) && !isNaN(lngVal) && latVal !== 0;
              const koordHtml = adaKoord 
                ? `<span class="mono" style="font-size:11px; color:#0F8B7E; background:#F0FDF4; border:1px solid #BBF7D0; padding:3px 7px; border-radius:6px; white-space:nowrap;">${latVal.toFixed(6)}, ${lngVal.toFixed(6)}</span>`
                : `<span class="text-muted text-xs">—</span>`;

              const btnAksi = (m.status === 'HADIR' || adaKoord) 
                ? `<button class="btn btn-secondary btn-sm" data-buka-peta="${m.id || m.pegawai_id}" style="height:28px; padding:0 10px; font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:5px; white-space:nowrap;">
                     ${UI.ikon('peta', 12)} Lihat Peta
                   </button>`
                : `<span class="text-muted text-xs">—</span>`;

              return `
                <tr>
                  <td><b style="color: #0F172A;">${UI.esc(m.nama)}</b></td>
                  <td><span class="badge" style="background:#F1F5F9; color:#475569; text-transform:uppercase; font-size:11px; font-weight:700;">${UI.esc(m.peran)}</span></td>
                  <td>
                    ${(!m.waktu_masuk || m.status === 'BELUM') ? `
                      <select class="ctl-sm select-shift-karyawan" data-pegawai-id="${m.pegawai_id}" data-nama="${UI.esc(m.nama)}"
                              title="Pimpinan dapat menentukan Shift 1 atau Shift 2"
                              style="height: 28px; font-size: 11px; font-weight: 700; border-radius: 6px; padding: 0 6px; cursor: pointer; background: ${m.shift === 2 ? '#FAF5FF' : '#F0FDF4'}; color: ${m.shift === 2 ? '#6B21A8' : '#0F8B7E'}; border: 1.5px solid ${m.shift === 2 ? '#D8B4FE' : '#BBF7D0'};">
                        <option value="1" ${m.shift !== 2 ? 'selected' : ''}>Shift 1 (Pagi)</option>
                        <option value="2" ${m.shift === 2 ? 'selected' : ''}>Shift 2 (Siang)</option>
                      </select>
                    ` : `
                      <span class="badge ${m.shift === 2 ? 'b-dokter' : 'b-selesai'}" style="font-size:11px; padding:3px 8px; font-weight:700;">
                        Shift ${m.shift || 1}
                      </span>
                    `}
                  </td>
                  <td>
                    <span class="badge ${m.status === 'HADIR' ? (m.waktu_keluar ? 'b-selesai' : 'b-kajian') : (m.status === 'BELUM' ? 'b-danger' : 'b-menunggu')}" style="font-size:11px; padding: 4px 8px;">
                      ${m.status === 'HADIR' ? (m.waktu_keluar ? 'SELESAI' : 'BEKERJA') : UI.esc(m.status)}
                    </span>
                  </td>
                  <td class="mono" style="font-size: 13px;">
                    ${m.waktu_masuk ? UI.jam(m.waktu_masuk) + ' WIB ' + badgeMasuk : '—'}
                  </td>
                  <td class="mono" style="font-size: 13px;">
                    ${m.waktu_keluar ? UI.jam(m.waktu_keluar) + ' WIB ' + badgeKeluar : '—'}
                  </td>
                  <td>${badgeLokasiHtml(m.lokasi_masuk, null)}</td>
                  <td>${koordHtml}</td>
                  <td class="text-xs" style="color: #475569;">
                    ${UI.esc(m.keterangan || (m.status === 'HADIR' ? (m.waktu_keluar ? 'Tugas Selesai' : 'Sedang Bertugas') : '—'))}
                  </td>
                  <td>${btnAksi}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table></div>
      `;

      wrap.querySelectorAll('[data-buka-peta]').forEach(b => {
        b.addEventListener('click', () => {
          const recId = b.dataset.bukaPeta;
          const m = monitoringList.find(x => String(x.id) === String(recId) || String(x.pegawai_id) === String(recId));
          if (!m) return;

          const itemMap = markerStafMap[String(recId)];
          if (petaMonitoring && itemMap && itemMap.marker) {
            const elMap = container.querySelector('#mapMonitoringLive');
            if (elMap) {
              elMap.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            petaMonitoring.setView([itemMap.lat, itemMap.lng], 16, { animate: true });
            setTimeout(() => {
              itemMap.marker.openPopup();
            }, 300);
          } else {
            dialogDetailPetaAbsensi(m);
          }
        });
      });

      // Event listener Master ubah shift karyawan langsung
      wrap.querySelectorAll('.select-shift-karyawan').forEach(sel => {
        sel.addEventListener('change', async (e) => {
          const pegawaiId = sel.dataset.pegawaiId;
          const nama = sel.dataset.nama || 'Karyawan';
          const shiftBaru = parseInt(e.target.value, 10);
          sel.disabled = true;
          try {
            await DB.tetapkanShiftKaryawan(pegawaiId, tanggalMonitoring, shiftBaru);
            UI.toast(`Jadwal ${nama} berhasil diatur ke Shift ${shiftBaru}.`, 'ok');
            await muatMonitoring();
          } catch (err) {
            UI.toast('Gagal menetapkan shift: ' + err.message, 'err');
            sel.disabled = false;
          }
        });
      });
    };

    container.querySelector('#cariStafMonitoring')?.addEventListener('input', (e) => {
      teksCari = e.target.value;
      renderTabelMonitoring();
    });

    container.querySelector('#filterShiftMonitoring')?.addEventListener('change', (e) => {
      filterShift = e.target.value;
      renderTabelMonitoring();
    });

    container.querySelector('#filterStatusMonitoring')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      renderTabelMonitoring();
    });

    container.querySelector('#btnUbahJamDariMonitoring')?.addEventListener('click', () => {
      const tabBtn = w.querySelector('.tab[data-tab="master_lokasi"]');
      if (tabBtn) tabBtn.click();
    });

    container.querySelector('#btnRefreshMonitoring')?.addEventListener('click', muatMonitoring);
    container.querySelector('#tglMonitoring')?.addEventListener('change', muatMonitoring);
    await muatMonitoring();
  }

  /* =====================================================================
     TAB 3: PERSETUJUAN CUTI & IZIN STAF (MASTER ONLY)
     ===================================================================== */
  async function renderTabApprovalIzin(container) {
    container.innerHTML = `
      <div class="absensi-panel">
        <div class="absensi-panel-head">
          <div>
            <h2 class="flex items-center gap-10" style="margin: 0; font-size: 17px; font-weight: 700; color: #0F172A;">
              ${UI.ikon('centang', 19)} Persetujuan Permohonan Cuti & Izin Staf
            </h2>
            <div class="text-muted text-xs mt-4">Tinjau, setujui, atau tolak permohonan izin staf klinik. Permohonan disetujui otomatis mengisi status kehadiran.</div>
          </div>
          <div class="flex items-center gap-10">
            <select id="filterStatusIzin" class="ctl-sm" style="height: 36px; border-radius: 8px; padding: 0 12px;">
              <option value="MENUNGGU" ${filterIzinStaf === 'MENUNGGU' ? 'selected' : ''}>Menunggu Persetujuan</option>
              <option value="DISETUJUI" ${filterIzinStaf === 'DISETUJUI' ? 'selected' : ''}>Sudah Disetujui</option>
              <option value="DITOLAK" ${filterIzinStaf === 'DITOLAK' ? 'selected' : ''}>Ditolak</option>
              <option value="SEMUA" ${filterIzinStaf === 'SEMUA' ? 'selected' : ''}>Semua Status</option>
            </select>
            <button class="btn btn-secondary btn-sm" id="btnRefreshIzin" style="height: 36px; padding: 0 14px; font-weight: 600;">
              ${UI.ikon('ulang', 13)} Muat Ulang
            </button>
          </div>
        </div>

        <div style="padding: 20px 24px;">
          <div id="tabelApprovalWrap">${UI.memuat(3)}</div>
        </div>
      </div>
    `;

    const muatList = async () => {
      const sel = container.querySelector('#filterStatusIzin').value;
      filterIzinStaf = sel;
      const statusParam = sel === 'SEMUA' ? null : sel;
      const list = await DB.daftarSemuaIzin(statusParam);

      const wrap = container.querySelector('#tabelApprovalWrap');
      if (!list.length) {
        wrap.innerHTML = `<div class="empty text-center p-24 text-muted" style="border: 1px dashed #CBD5E1; border-radius: 12px; background: #F8FAFC;">Tidak ada data permohonan izin dengan filter ini.</div>`;
        return;
      }

      wrap.innerHTML = `
        <div class="absensi-table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>PEGAWAI</th>
            <th>JENIS PERMOHONAN</th>
            <th>RENTANG TANGGAL</th>
            <th>ALASAN / KETERANGAN</th>
            <th>STATUS</th>
            <th>CATATAN PIMPINAN</th>
            <th>AKSI</th>
          </tr></thead>
          <tbody>
            ${list.map(iz => `
              <tr>
                <td>
                  <b style="color: #0F172A;">${UI.esc(iz.pegawai?.nama || 'Pegawai')}</b>
                  <div class="text-xs text-muted" style="margin-top: 2px;">${UI.esc(iz.pegawai?.peran || '')}</div>
                </td>
                <td><b style="color: #0F172A;">${UI.esc(iz.jenis)}</b></td>
                <td style="color: #334155;">${UI.tglIndo(iz.tanggal_mulai)} s/d ${UI.tglIndo(iz.tanggal_selesai)}</td>
                <td class="text-sm" style="color: #475569;">${UI.esc(iz.keterangan)}</td>
                <td>
                  <span class="badge ${iz.status === 'DISETUJUI' ? 'b-selesai' : (iz.status === 'DITOLAK' ? 'b-danger' : 'b-menunggu')}" style="font-size: 11px; padding: 4px 8px;">
                    ${UI.esc(iz.status)}
                  </span>
                </td>
                <td class="text-xs text-muted">${UI.esc(iz.catatan_atasan || '—')}</td>
                <td>
                  ${iz.status === 'MENUNGGU' ? `
                    <div class="flex items-center gap-6">
                      <button class="btn btn-primary btn-sm" data-setujui="${iz.id}" style="padding: 5px 10px; font-size: 11.5px;">
                        ${UI.ikon('centang', 13)} Setujui
                      </button>
                      <button class="btn btn-secondary btn-sm" data-tolak="${iz.id}" style="color:var(--danger-700); padding: 5px 10px; font-size: 11.5px;">
                        ${UI.ikon('x', 13)} Tolak
                      </button>
                    </div>
                  ` : `
                    <span class="text-xs text-muted" style="font-weight: 500;">Selesai</span>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>
      `;

      wrap.querySelectorAll('[data-setujui]').forEach(b => {
        b.addEventListener('click', () => dialogKonfirmasiApproval(b.dataset.setujui, 'setujui'));
      });
      wrap.querySelectorAll('[data-tolak]').forEach(b => {
        b.addEventListener('click', () => dialogKonfirmasiApproval(b.dataset.tolak, 'tolak'));
      });
    };

    container.querySelector('#filterStatusIzin')?.addEventListener('change', muatList);
    container.querySelector('#btnRefreshIzin')?.addEventListener('click', muatList);
    await muatList();
  }

  function dialogKonfirmasiApproval(izinId, tindakan) {
    const isSetuju = tindakan === 'setujui';
    UI.modal({
      judul: isSetuju ? 'Setujui Permohonan Izin / Cuti' : 'Tolak Permohonan Izin / Cuti',
      isi: `
        <p class="mb-12">
          ${isSetuju 
            ? 'Apakah Anda yakin ingin <b>menyetujui</b> permohonan ini? Rekap absensi pegawai terkait akan otomatis terisi status ini.' 
            : 'Apakah Anda yakin ingin <b>menolak</b> permohonan ini?'}
        </p>
        <div class="field">
          <label>Catatan Pimpinan (Opsional)</label>
          <textarea id="catatanPimpinan" rows="2" class="w-full" placeholder="${isSetuju ? 'Contoh: Disetujui, harap selesaikan serah terima tugas.' : 'Contoh: Kuota cuti bulan ini sudah penuh / tenaga kurang.'}"></textarea>
        </div>
      `,
      tombol: [
        { teks: 'Batal', nilai: false },
        {
          teks: isSetuju ? 'Ya, Setujui' : 'Tolak Permohonan',
          kelas: isSetuju ? 'btn-primary' : 'btn-danger',
          aksi: async (modalBody) => {
            const catatan = modalBody.querySelector('#catatanPimpinan').value.trim() || null;
            try {
              if (isSetuju) {
                await DB.setujuiIzin(izinId, catatan);
                UI.toast('Permohonan berhasil disetujui.', 'ok');
              } else {
                await DB.tolakIzin(izinId, catatan);
                UI.toast('Permohonan telah ditolak.', 'ok');
              }
              await muatData();
              return true;
            } catch (err) {
              UI.toast('Gagal memproses permohonan: ' + err.message, 'err');
              return false;
            }
          }
        }
      ]
    });
  }

  /* =====================================================================
     TAB 3: KELOLA LOKASI & JAM KERJA (MASTER ONLY)
     ===================================================================== */
  async function renderTabMasterLokasi(container) {
    container.innerHTML = `
      <!-- Card 1: Pengaturan Jam Kerja Kantor & 2 Shift Operasional -->
      <div class="absensi-panel mb-24">
        <div class="absensi-panel-head">
          <div>
            <h2 class="flex items-center gap-10" style="margin: 0; font-size: 17px; font-weight: 700; color: #0F172A;">
              ${UI.ikon('jam', 19)} Pengaturan Jam Kerja Kantor & 2 Shift Operasional
            </h2>
            <div class="text-muted text-xs mt-4">Atur jam datang, jam pulang, dan batas toleransi keterlambatan untuk Shift 1 (Pagi) dan Shift 2 (Siang/Sore).</div>
          </div>
        </div>
        <div style="padding: 22px 24px;">
          <form id="formJamKerja" class="absensi-form-box" style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Shift 1 (Pagi) -->
            <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 18px 20px;">
              <div class="flex items-center gap-8 mb-14">
                <span class="badge b-selesai" style="font-size: 11.5px; padding: 3px 10px; font-weight: 700;">Shift 1 (Pagi)</span>
                <span style="font-size: 13px; font-weight: 700; color: #0F172A;">Jadwal Pelayanan Pagi Hari</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                <div class="field" style="margin: 0;">
                  <label style="font-size: 12.5px; font-weight: 600; color: #334155; margin-bottom: 5px;">Jam Datang / Masuk <span class="req">*</span></label>
                  <input type="time" name="shift1_masuk" value="${jamKerja.shift1_masuk || jamKerja.jam_masuk || '07:30'}" required class="w-full" style="height: 40px; border-radius: 8px; border: 1px solid #CBD5E1; padding: 0 12px; font-size: 14px;">
                </div>
                <div class="field" style="margin: 0;">
                  <label style="font-size: 12.5px; font-weight: 600; color: #334155; margin-bottom: 5px;">Jam Pulang <span class="req">*</span></label>
                  <input type="time" name="shift1_pulang" value="${jamKerja.shift1_pulang || jamKerja.jam_pulang || '14:30'}" required class="w-full" style="height: 40px; border-radius: 8px; border: 1px solid #CBD5E1; padding: 0 12px; font-size: 14px;">
                </div>
                <div class="field" style="margin: 0;">
                  <label style="font-size: 12.5px; font-weight: 600; color: #334155; margin-bottom: 5px;">Toleransi Keterlambatan <span class="req">*</span></label>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="number" name="shift1_toleransi" min="0" max="120" value="${jamKerja.shift1_toleransi ?? jamKerja.toleransi_keterlambatan_menit ?? 15}" required class="w-full" style="height: 40px; border-radius: 8px; border: 1px solid #CBD5E1; padding: 0 12px; font-size: 14px;">
                    <span class="text-xs text-muted" style="white-space: nowrap; font-weight: 600;">Menit</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shift 2 (Siang/Sore) -->
            <div style="background: #FAF5FF; border: 1.5px solid #E9D5FF; border-radius: 10px; padding: 18px 20px;">
              <div class="flex items-center gap-8 mb-14">
                <span class="badge b-dokter" style="font-size: 11.5px; padding: 3px 10px; font-weight: 700;">Shift 2 (Siang/Sore)</span>
                <span style="font-size: 13px; font-weight: 700; color: #581C87;">Jadwal Pelayanan Siang & Malam Hari</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                <div class="field" style="margin: 0;">
                  <label style="font-size: 12.5px; font-weight: 600; color: #334155; margin-bottom: 5px;">Jam Datang / Masuk <span class="req">*</span></label>
                  <input type="time" name="shift2_masuk" value="${jamKerja.shift2_masuk || '14:00'}" required class="w-full" style="height: 40px; border-radius: 8px; border: 1px solid #CBD5E1; padding: 0 12px; font-size: 14px;">
                </div>
                <div class="field" style="margin: 0;">
                  <label style="font-size: 12.5px; font-weight: 600; color: #334155; margin-bottom: 5px;">Jam Pulang <span class="req">*</span></label>
                  <input type="time" name="shift2_pulang" value="${jamKerja.shift2_pulang || '21:00'}" required class="w-full" style="height: 40px; border-radius: 8px; border: 1px solid #CBD5E1; padding: 0 12px; font-size: 14px;">
                </div>
                <div class="field" style="margin: 0;">
                  <label style="font-size: 12.5px; font-weight: 600; color: #334155; margin-bottom: 5px;">Toleransi Keterlambatan <span class="req">*</span></label>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="number" name="shift2_toleransi" min="0" max="120" value="${jamKerja.shift2_toleransi ?? 15}" required class="w-full" style="height: 40px; border-radius: 8px; border: 1px solid #CBD5E1; padding: 0 12px; font-size: 14px;">
                    <span class="text-xs text-muted" style="white-space: nowrap; font-weight: 600;">Menit</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button type="submit" class="btn btn-primary" id="btnSimpanJam" style="height: 42px; padding: 0 24px; font-weight: 700; border-radius: 8px; font-size: 13.5px;">
                ${UI.ikon('simpan', 15)} Simpan Pengaturan 2 Shift
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Card 2: Informasi Sistem Presensi Cerdas (Bebas Radius) -->
      <div class="absensi-panel mb-24">
        <div class="absensi-panel-head">
          <div class="flex items-center gap-10">
            ${UI.ikon('peta', 19)}
            <div>
              <h2 style="margin: 0; font-size: 17px; font-weight: 700; color: #0F172A;">
                Sistem Presensi Fleksibel & Lokasi Cerdas (Smart Location Presence)
              </h2>
              <div class="text-muted text-xs mt-4">Karyawan bebas melakukan absensi di mana pun tanpa batasan radius; sistem otomatis mendeteksi faskes terdekat.</div>
            </div>
          </div>
        </div>
        <div style="padding: 22px 24px;">
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
            <div class="p-16 border rounded" style="background: #F8FAFC; border-color: #E2E8F0; border-radius: 10px;">
              <div class="flex items-center gap-8 mb-6 font-bold" style="color: #0F172A; font-size: 13.5px;">
                ${UI.ikon('centang', 16)} Bebas Absen Di Mana Saja
              </div>
              <p class="text-xs text-muted mb-0" style="line-height: 1.5;">
                Karyawan dapat melakukan absensi masuk dan pulang di lokasi penugasan mana pun (di Lab Pusat, Puskesmas jejaring, Rumah Sakit, maupun saat sampling lapangan) tanpa terhalang batasan radius.
              </p>
            </div>

            <div class="p-16 border rounded" style="background: #F8FAFC; border-color: #E2E8F0; border-radius: 10px;">
              <div class="flex items-center gap-8 mb-6 font-bold" style="color: #0F172A; font-size: 13.5px;">
                ${UI.ikon('lokasi', 16)} Pencatatan Otomatis Nama & Koordinat
              </div>
              <p class="text-xs text-muted mb-0" style="line-height: 1.5;">
                Sistem otomatis mendeteksi nama fasilitas kesehatan (22 Puskesmas se-Purbalingga, Lab Pusat, RSUD) atau nama jalan/desa setempat beserta koordinat GPS akurat (Latitude & Longitude).
              </p>
            </div>

            <div class="p-16 border rounded" style="background: #F8FAFC; border-color: #E2E8F0; border-radius: 10px;">
              <div class="flex items-center gap-8 mb-6 font-bold" style="color: #0F172A; font-size: 13.5px;">
                ${UI.ikon('peta', 16)} Pemantauan Peta Interaktif Real-Time
              </div>
              <p class="text-xs text-muted mb-0" style="line-height: 1.5;">
                Pimpinan dapat melihat langsung sebaran posisi seluruh staf yang bertugas hari ini pada peta visual di tab <b>Monitoring Kehadiran & Sebaran Staf</b>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Kelola Database Titik Lokasi Faskes (Hak Akses Penuh Master) -->
      <div class="absensi-panel mb-24">
        <div class="absensi-panel-head">
          <div>
            <h2 class="flex items-center gap-10" style="margin: 0; font-size: 17px; font-weight: 700; color: #0F172A;">
              ${UI.ikon('faskes', 19)} Database Titik Lokasi Faskes (Puskesmas, RS, & Lab)
            </h2>
            <div class="text-muted text-xs mt-4">Pimpinan dapat menambah, mengedit koordinat, atau menyesuaikan nama faskes agar akurasi pembacaan lokasi presensi staf selalu tepat.</div>
          </div>
          <button class="btn btn-primary btn-sm" id="btnTambahFaskesMaster" style="font-size: 12.5px; padding: 8px 16px; font-weight: 600;">
            ${UI.ikon('plus', 14)} Tambah Titik Faskes
          </button>
        </div>

        <!-- Filter & Pencarian Lokasi Faskes -->
        <div class="p-16 border-bottom flex items-center justify-between flex-wrap gap-12" style="background: #ffffff; padding: 14px 24px;">
          <div class="flex items-center gap-10 flex-wrap" style="flex: 1;">
            <input type="search" id="cariFaskesMaster" placeholder="Cari nama faskes / alamat..." 
                   class="ctl-sm" style="max-width: 280px; height: 36px; border-radius: 8px; padding: 0 12px;">
            <select id="filterTipeFaskesMaster" class="ctl-sm" style="height: 36px; border-radius: 8px; padding: 0 12px;">
              <option value="">Semua Tipe Faskes</option>
              <option value="LAB">Laboratorium / Klinik Pusat</option>
              <option value="PUSKESMAS">Puskesmas</option>
              <option value="RS">Rumah Sakit (RS)</option>
              <option value="KLINIK">Klinik / Faskes Mitra</option>
            </select>
          </div>
          <div class="text-xs text-muted" id="labelHitungFaskesMaster" style="font-weight: 600;">
            Memuat daftar faskes...
          </div>
        </div>

        <div style="padding: 20px 24px;">
          <div id="tabelFaskesMasterWrap">${UI.memuat(3)}</div>
        </div>
      </div>
    `;

    // Event listener simpan jam kerja 2 shift
    container.querySelector('#formJamKerja')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const b = form.querySelector('#btnSimpanJam');
      b.disabled = true;
      try {
        const payload = {
          shift1_masuk: form.shift1_masuk.value,
          shift1_pulang: form.shift1_pulang.value,
          shift1_toleransi: parseInt(form.shift1_toleransi.value, 10) || 0,
          shift2_masuk: form.shift2_masuk.value,
          shift2_pulang: form.shift2_pulang.value,
          shift2_toleransi: parseInt(form.shift2_toleransi.value, 10) || 0,
          jam_masuk: form.shift1_masuk.value,
          jam_pulang: form.shift1_pulang.value,
          toleransi_keterlambatan_menit: parseInt(form.shift1_toleransi.value, 10) || 0
        };
        const saved = await DB.simpanPengaturanJamKerja(payload);
        jamKerja = saved;
        UI.toast('Pengaturan jam kerja 2 shift berhasil disimpan!', 'ok');
      } catch (err) {
        UI.toast('Gagal menyimpan jam kerja: ' + err.message, 'err');
      } finally {
        b.disabled = false;
      }
    });

    // Manajemen Database Faskes oleh Master
    let teksCariFaskes = '';
    let filterTipeFaskes = '';

    const renderTabelFaskesMaster = () => {
      const wrap = container.querySelector('#tabelFaskesMasterWrap');
      const labelHitung = container.querySelector('#labelHitungFaskesMaster');
      if (!wrap) return;

      const q = (teksCariFaskes || '').trim().toLowerCase();
      const t = (filterTipeFaskes || '').trim().toUpperCase();

      const filtered = masterLokasi.filter(l => {
        if (t && (l.tipe || 'PUSKESMAS').toUpperCase() !== t) return false;
        if (q) {
          const matchNama = (l.nama || '').toLowerCase().includes(q);
          const matchAlamat = (l.alamat || '').toLowerCase().includes(q);
          if (!matchNama && !matchAlamat) return false;
        }
        return true;
      });

      if (labelHitung) {
        labelHitung.textContent = `Menampilkan ${filtered.length} dari ${masterLokasi.length} faskes terdaftar`;
      }

      if (!filtered.length) {
        wrap.innerHTML = `<div class="empty text-center p-24 text-muted" style="border: 1px dashed #CBD5E1; border-radius: 12px; background: #F8FAFC;">Tidak ada lokasi faskes yang cocok dengan pencarian.</div>`;
        return;
      }

      wrap.innerHTML = `
        <div class="absensi-table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>NAMA FASILITAS KESEHATAN</th>
            <th>TIPE</th>
            <th>ALAMAT LENGKAP</th>
            <th>KOORDINAT GPS</th>
            <th>STATUS</th>
            <th style="text-align: right;">AKSI</th>
          </tr></thead>
          <tbody>
            ${filtered.map(l => {
              const latNum = Number(l.latitude);
              const lngNum = Number(l.longitude);
              let tipeClass = 'b-kajian';
              if (l.tipe === 'LAB') tipeClass = 'b-selesai';
              else if (l.tipe === 'RS') tipeClass = 'b-dokter';
              else if (l.tipe === 'KLINIK') tipeClass = 'b-umum';

              return `
                <tr>
                  <td>
                    <b style="color: #0F172A; font-size: 13.5px;">${UI.esc(l.nama)}</b>
                  </td>
                  <td>
                    <span class="badge ${tipeClass}" style="font-size: 10.5px; text-transform: uppercase; font-weight: 700;">
                      ${UI.esc(l.tipe || 'PUSKESMAS')}
                    </span>
                  </td>
                  <td class="text-xs text-muted" style="max-width: 260px;">
                    ${UI.esc(l.alamat || '—')}
                  </td>
                  <td class="mono" style="font-size: 12px;">
                    <span style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 2px 8px; border-radius: 6px; color: #0F8B7E; font-weight: 600;">
                      ${latNum ? latNum.toFixed(6) : '0.000000'}, ${lngNum ? lngNum.toFixed(6) : '0.000000'}
                    </span>
                  </td>
                  <td>
                    <span class="badge ${l.aktif !== false ? 'b-selesai' : 'b-batal'}" style="font-size: 10.5px;">
                      ${l.aktif !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" data-edit-faskes="${UI.esc(l.id || l.nama)}" style="height: 28px; padding: 0 10px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                        ${UI.ikon('pensil', 12)} Edit
                      </button>
                      <button class="btn btn-secondary btn-sm" data-hapus-faskes="${UI.esc(l.id || l.nama)}" style="height: 28px; padding: 0 8px; font-size: 11px; color: var(--danger-700);">
                        ${UI.ikon('hapus', 12)}
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table></div>
      `;

      wrap.querySelectorAll('[data-edit-faskes]').forEach(b => {
        b.addEventListener('click', () => {
          const fid = b.dataset.editFaskes;
          const item = masterLokasi.find(x => String(x.id || x.nama) === String(fid));
          if (item) dialogEditLokasiFaskes(item);
        });
      });

      wrap.querySelectorAll('[data-hapus-faskes]').forEach(b => {
        b.addEventListener('click', () => {
          const fid = b.dataset.hapusFaskes;
          const item = masterLokasi.find(x => String(x.id || x.nama) === String(fid));
          if (item) dialogHapusFaskes(item);
        });
      });
    };

    function dialogEditLokasiFaskes(item = null) {
      const isEdit = !!item;
      const latAwal = item ? Number(item.latitude) : (userCoords ? userCoords.lat : -7.386416);
      const lngAwal = item ? Number(item.longitude) : (userCoords ? userCoords.lng : 109.365989);
      let pickerMap = null;
      let pickerMarker = null;

      UI.modal({
        judul: isEdit ? `Ubah Data Lokasi: ${item.nama}` : 'Tambah Lokasi Faskes / Puskesmas Baru',
        lebar: true,
        isi: `
          <form id="formFaskesMaster" style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
            <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 14px;">
              <div class="field">
                <label>Nama Fasilitas Kesehatan <span class="req">*</span></label>
                <input type="text" name="nama" value="${UI.esc(item?.nama || '')}" placeholder="Contoh: Puskesmas Bobotsari, Lab Pusat, RSUD..." required class="w-full">
              </div>
              <div class="field">
                <label>Tipe Faskes <span class="req">*</span></label>
                <select name="tipe" class="w-full" required>
                  <option value="PUSKESMAS" ${item?.tipe === 'PUSKESMAS' ? 'selected' : ''}>Puskesmas</option>
                  <option value="LAB" ${item?.tipe === 'LAB' ? 'selected' : ''}>Laboratorium / Klinik Pusat</option>
                  <option value="RS" ${item?.tipe === 'RS' ? 'selected' : ''}>Rumah Sakit (RS)</option>
                  <option value="KLINIK" ${item?.tipe === 'KLINIK' ? 'selected' : ''}>Klinik / Faskes Mitra</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label>Alamat Lengkap Faskes</label>
              <input type="text" name="alamat" value="${UI.esc(item?.alamat || '')}" placeholder="Jl. ... No. ..., Desa/Kelurahan, Kecamatan" class="w-full">
            </div>

            <div class="field" style="margin-bottom: 0;">
              <div class="flex items-center justify-between flex-wrap gap-8 mb-6">
                <label class="font-semibold text-xs flex items-center gap-6" style="color: #334155;">
                  ${UI.ikon('peta', 14)} Titik Koordinat di Peta (Klik atau geser pin marker):
                </label>
                <button type="button" class="btn btn-secondary btn-sm" id="btnGunakanGpsSaya" style="font-size: 11.5px; padding: 4px 10px;">
                  ${UI.ikon('peta', 13)} Gunakan Lokasi GPS Saya Saat Ini
                </button>
              </div>

              <!-- Wadah Peta Leaflet Picker -->
              <div id="mapPickerFaskes" style="height: 280px; width: 100%; border-radius: 10px; border: 1.5px solid #CBD5E1; position: relative; background: #E2E8F0; overflow: hidden;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #64748B;">
                  Memuat Peta Pemilih Lokasi...
                </div>
              </div>
              <div class="text-xs text-muted mt-4">
                * Bebas radius: sistem secara otomatis mengenali nama faskes ini saat staf presensi di sekitar lokasi ini.
              </div>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="field">
                <label>Latitude <span class="req">*</span></label>
                <input type="number" step="any" name="latitude" id="inpLatFaskes" value="${latAwal}" required class="w-full mono">
              </div>
              <div class="field">
                <label>Longitude <span class="req">*</span></label>
                <input type="number" step="any" name="longitude" id="inpLngFaskes" value="${lngAwal}" required class="w-full mono">
              </div>
            </div>

            <div class="field p-12 border rounded" style="background: #F8FAFC; border-color: #E2E8F0; border-radius: 8px; margin: 0;">
              <label class="flex items-center gap-8" style="cursor: pointer; margin: 0;">
                <input type="checkbox" name="aktif" ${(!item || item.aktif !== false) ? 'checked' : ''} style="width: 18px; height: 18px;">
                <div>
                  <b style="font-size: 13px;">Aktifkan Lokasi Faskes Ini</b>
                  <div class="text-xs text-muted">Sistem akan otomatis mencocokkan kehadiran staf jika berada di sekitar faskes ini.</div>
                </div>
              </label>
            </div>
          </form>
        `,
        siap: (modalBody) => {
          const elMap = modalBody.querySelector('#mapPickerFaskes');
          const inpLat = modalBody.querySelector('#inpLatFaskes');
          const inpLng = modalBody.querySelector('#inpLngFaskes');

          setTimeout(() => {
            if (typeof L === 'undefined' || !elMap) return;
            try {
              elMap.innerHTML = '';
              pickerMap = L.map(elMap, {
                center: [latAwal, lngAwal],
                zoom: 15
              });

              L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
              }).addTo(pickerMap);

              pickerMarker = L.marker([latAwal, lngAwal], { draggable: true }).addTo(pickerMap);

              const setPosisi = (lat, lng) => {
                inpLat.value = Number(lat).toFixed(7);
                inpLng.value = Number(lng).toFixed(7);
                pickerMarker.setLatLng([lat, lng]);
              };

              pickerMarker.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                setPosisi(pos.lat, pos.lng);
              });

              pickerMap.on('click', (e) => {
                setPosisi(e.latlng.lat, e.latlng.lng);
              });

              inpLat.addEventListener('change', () => {
                const lat = Number(inpLat.value);
                const lng = Number(inpLng.value);
                if (!isNaN(lat) && !isNaN(lng)) {
                  setPosisi(lat, lng);
                  pickerMap.panTo([lat, lng]);
                }
              });
              inpLng.addEventListener('change', () => {
                const lat = Number(inpLat.value);
                const lng = Number(inpLng.value);
                if (!isNaN(lat) && !isNaN(lng)) {
                  setPosisi(lat, lng);
                  pickerMap.panTo([lat, lng]);
                }
              });

              modalBody.querySelector('#btnGunakanGpsSaya')?.addEventListener('click', () => {
                if (userCoords) {
                  setPosisi(userCoords.lat, userCoords.lng);
                  pickerMap.setView([userCoords.lat, userCoords.lng], 16);
                  UI.toast('Koordinat disetel ke lokasi GPS Anda saat ini.', 'ok');
                } else {
                  UI.toast('GPS belum terdeteksi. Silakan tunggu atau perbarui GPS.', 'err');
                }
              });

              pickerMap.invalidateSize();
              setTimeout(() => pickerMap && pickerMap.invalidateSize(), 200);
            } catch (errPeta) {
              console.error('Picker map error:', errPeta);
            }
          }, 120);
        },
        tombol: [
          { teks: 'Batal', nilai: false },
          {
            teks: isEdit ? 'Simpan Perubahan' : 'Tambah Faskes',
            kelas: 'btn-primary',
            aksi: async (modalBody) => {
              const form = modalBody.querySelector('#formFaskesMaster');
              if (!form.reportValidity()) return false;

              const payload = {
                nama: form.nama.value.trim(),
                tipe: form.tipe.value,
                alamat: form.alamat.value.trim() || null,
                latitude: parseFloat(form.latitude.value),
                longitude: parseFloat(form.longitude.value),
                radius_meter: 250,
                aktif: form.aktif.checked
              };

              try {
                await DB.simpanMasterLokasi(payload, item?.id || null);
                UI.toast('Data faskes berhasil disimpan!', 'ok');
                masterLokasi = await DB.daftarMasterLokasi(false);
                renderTabelFaskesMaster();
                return true;
              } catch (err) {
                UI.toast('Gagal menyimpan faskes: ' + err.message, 'err');
                return false;
              }
            }
          }
        ]
      });
    }

    function dialogHapusFaskes(item) {
      UI.modal({
        judul: 'Hapus Lokasi Faskes',
        isi: `Apakah Anda yakin ingin menghapus <b>${UI.esc(item.nama)}</b> dari database referensi faskes?`,
        tombol: [
          { teks: 'Batal', nilai: false },
          {
            teks: 'Ya, Hapus',
            kelas: 'btn-danger',
            aksi: async () => {
              try {
                if (item.id && typeof item.id === 'string' && item.id.length > 10) {
                  await DB.hapusMasterLokasi(item.id);
                } else {
                  masterLokasi = masterLokasi.filter(l => l.nama !== item.nama);
                }
                UI.toast('Lokasi faskes telah dihapus.', 'ok');
                masterLokasi = await DB.daftarMasterLokasi(false);
                renderTabelFaskesMaster();
                return true;
              } catch (err) {
                UI.toast('Gagal menghapus faskes: ' + err.message, 'err');
                return false;
              }
            }
          }
        ]
      });
    }

    container.querySelector('#cariFaskesMaster')?.addEventListener('input', (e) => {
      teksCariFaskes = e.target.value;
      renderTabelFaskesMaster();
    });

    container.querySelector('#filterTipeFaskesMaster')?.addEventListener('change', (e) => {
      filterTipeFaskes = e.target.value;
      renderTabelFaskesMaster();
    });

    container.querySelector('#btnTambahFaskesMaster')?.addEventListener('click', () => {
      dialogEditLokasiFaskes(null);
    });

    renderTabelFaskesMaster();
  }

  // Public methods
  function refreshGps() {
    mintaLokasiGps();
  }

  return { 
    render,
    refreshGps
  };
})();
