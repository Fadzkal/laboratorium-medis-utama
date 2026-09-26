/* =====================================================================
   HALAMAN: KINERJA & BONUS KARYAWAN
   ---------------------------------------------------------------------
   Panel kendali untuk dua mode:
   1. MODE MASTER (Ibu Dede Kurniasih - Pemilik / Kepala Laboratorium):
      - Tab 1: Rekapitulasi Kehadiran & Kedisiplinan Staf (otomatis GPS).
      - Tab 2: Evaluasi & Indikator Kinerja Utama (KPI) Karyawan.
      - Tab 3: Penetapan & Pencairan Bonus (gaji, insentif, kata motivasi).
      - Cetak Slip Bonus Resmi berkop Laboratorium Medis Utama.
   2. MODE KARYAWAN (Staf Laboratorium):
      - Rincian penerimaan bonus, insentif, dan gaji bulanan.
      - Pesan & Kata Motivasi langsung dari Pimpinan (Ibu Dede Kurniasih).
      - Rangkuman kehadiran & evaluasi KPI pribadi.
      - Cetak mandiri Slip Bonus Resmi.
   ===================================================================== */
const HrisLaporan = (() => {
  let w = null;
  let tabAktif = 'absensi'; // 'absensi', 'kpi', 'bonus'
  
  let dataAbsensi = [];
  let dataKpi = [];
  let dataBonus = [];
  let dataPegawai = [];
  let jamKerja = { jam_masuk: '08:00', jam_pulang: '16:00', toleransi_keterlambatan_menit: 15 };
  let dataAktivitas = { kunjungan: [], lab: [], surat: [], kasir: [] };
  let tarifInsentif = { tarif_lab: 4000, tarif_pendaftaran: 2000, tarif_surat: 2500, tarif_kasir: 1000 };

  const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const tanggalSekarang = new Date();
  let filterBulan = tanggalSekarang.getMonth() + 1;
  let filterTahun = tanggalSekarang.getFullYear();

  // Helper tampilan role asli pegawai
  function labelRole(peran) {
    return (peran || '').toUpperCase();
  }

  // Hitung lama bekerja berdasarkan tanggal/bulan/tahun awal bekerja
  function hitungLamaBekerja(tglMulaiKerja, refBulan = null, refTahun = null) {
    if (!tglMulaiKerja) return null;
    const awal = new Date(tglMulaiKerja);
    if (isNaN(awal.getTime())) return null;

    const thnAwal = awal.getFullYear();
    const blnAwal = awal.getMonth() + 1;

    const thnRef = refTahun || (filterTahun || new Date().getFullYear());
    const blnRef = refBulan || (filterBulan || (new Date().getMonth() + 1));

    let totalBulan = (thnRef - thnAwal) * 12 + (blnRef - blnAwal);
    if (totalBulan < 0) totalBulan = 0;

    const tahun = Math.floor(totalBulan / 12);
    const bulan = totalBulan % 12;

    let teks = '';
    if (tahun > 0 && bulan > 0) {
      teks = `${tahun} thn ${bulan} bln`;
    } else if (tahun > 0 && bulan === 0) {
      teks = `${tahun} thn`;
    } else if (tahun === 0 && bulan > 0) {
      teks = `${bulan} bln`;
    } else {
      teks = '< 1 bln';
    }

    return {
      tahunAwal: thnAwal,
      bulanAwal: blnAwal,
      totalBulan,
      tahun,
      bulan,
      teks,
      labelMulai: `${NAMA_BULAN[blnAwal - 1] || ''} ${thnAwal}`
    };
  }

  // Hitung kontribusi riil aktivitas karyawan di sistem (audit trail log)
  function hitungKontribusiPegawai(pegawaiId) {
    if (!pegawaiId) {
      return {
        jmlLab: 0, jmlDaftar: 0, jmlSurat: 0, jmlKasir: 0,
        nominalLab: 0, nominalDaftar: 0, nominalSurat: 0, nominalKasir: 0,
        totalNominal: 0, totalTindakan: 0,
        tarif: tarifInsentif || { tarif_lab: 4000, tarif_pendaftaran: 2000, tarif_surat: 2500, tarif_kasir: 1000 }
      };
    }

    const targetPeg = (dataPegawai || []).find(p => p.id === pegawaiId);
    const namaTarget = targetPeg ? (targetPeg.nama || '').trim().toLowerCase() : '';

    const kList = (dataAktivitas?.kunjungan || []).filter(k => k.created_by === pegawaiId);
    const lList = (dataAktivitas?.lab || []).filter(l => {
      if (l.selesai_oleh === pegawaiId) return true;
      if (namaTarget) {
        const vNama = (l.verifikator || '').trim().toLowerCase();
        if (vNama && (vNama.includes(namaTarget) || namaTarget.includes(vNama))) return true;
        if (namaTarget.includes('dede') && vNama.includes('dede')) return true;
        if (namaTarget.includes('nabila') && vNama.includes('nabila')) return true;
      }
      return false;
    });
    const sList = (dataAktivitas?.surat || []).filter(s => s.dibuat_oleh === pegawaiId);
    const bList = (dataAktivitas?.kasir || []).filter(b => b.dibuat_oleh === pegawaiId);

    const tarif = tarifInsentif || { tarif_lab: 4000, tarif_pendaftaran: 2000, tarif_surat: 2500, tarif_kasir: 1000 };

    const nominalLab = lList.length * (Number(tarif.tarif_lab) || 0);
    const nominalDaftar = kList.length * (Number(tarif.tarif_pendaftaran) || 0);
    const nominalSurat = sList.length * (Number(tarif.tarif_surat) || 0);
    const nominalKasir = bList.length * (Number(tarif.tarif_kasir) || 0);

    const totalNominal = nominalLab + nominalDaftar + nominalSurat + nominalKasir;

    return {
      jmlLab: lList.length,
      jmlDaftar: kList.length,
      jmlSurat: sList.length,
      jmlKasir: bList.length,
      nominalLab,
      nominalDaftar,
      nominalSurat,
      nominalKasir,
      totalNominal,
      totalTindakan: lList.length + kList.length + sList.length + bList.length,
      tarif
    };
  }

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

  // Hitung rekap bulanan kehadiran per pegawai
  function hitungRekapPerPegawai(pegawaiId) {
    const absensiPegawai = dataAbsensi.filter(a => a.pegawai_id === pegawaiId);
    let hadir = 0;
    let hadirLengkapMakan = 0; // Masuk DAN Pulang terisi lengkap
    let tepatWaktu = 0;
    let terlambat = 0;
    let totalMenitTelat = 0;
    let izinCuti = 0;
    let alfa = 0;

    absensiPegawai.forEach(a => {
      if (a.status === 'HADIR') {
        hadir++;
        // Hitung uang makan: HANYA jika karyawan absen hadir (masuk) DAN pulang (keluar) lengkap
        if (a.waktu_masuk && a.waktu_keluar) {
          hadirLengkapMakan++;
        }

        const chk = cekStatusKeterlambatan(a.waktu_masuk, jamKerja.jam_masuk, jamKerja.toleransi_keterlambatan_menit);
        if (chk?.terlambat) {
          terlambat++;
          totalMenitTelat += chk.menit;
        } else {
          tepatWaktu++;
        }
      } else if (['CUTI', 'IZIN', 'SAKIT', 'DINAS_LUAR'].includes(a.status)) {
        izinCuti++;
      } else if (a.status === 'ALFA') {
        alfa++;
      }
    });

    const totalHari = hadir + alfa;
    const disiplinPersen = totalHari > 0 ? Math.round((tepatWaktu / totalHari) * 100) : (hadir > 0 ? 100 : 0);
    const tarifUangMakan = Number(jamKerja.tarif_uang_makan || 20000);
    const totalUangMakan = hadirLengkapMakan * tarifUangMakan;

    return {
      totalAbsensiTercatat: absensiPegawai.length,
      hadir,
      hadirLengkapMakan,
      tarifUangMakan,
      totalUangMakan,
      tepatWaktu,
      terlambat,
      totalMenitTelat,
      izinCuti,
      alfa,
      disiplinPersen,
      daftarHadir: absensiPegawai
    };
  }

  /* =====================================================================
     ROUTER TAMPILAN SESUAI PERAN PENGGUNA
     ===================================================================== */
  async function render(el, param) {
    const saya = await DB.saya();
    if (!saya) {
      el.innerHTML = UI.kosong('Sesi Berakhir', 'Silakan masuk kembali ke akun Anda.');
      return;
    }

    w = el;

    if (saya.peran === 'master') {
      await renderMasterView(el, saya);
    } else {
      await renderKaryawanView(el, saya);
    }
  }

  /* =====================================================================
     1. MODE MASTER: PANEL KENDALI PIMPINAN (DEDE KURNIASIH)
     ===================================================================== */
  async function renderMasterView(el, saya) {
    const namaPimpinan = saya?.nama || 'PIMPINAN';
    const inisialPimpinan = UI.inisial(namaPimpinan) || 'P';

    w.innerHTML = `
      <div class="mb-20 flex items-center justify-between flex-wrap gap-16">
        <div style="max-width: 600px;">
          <h1 class="mb-4" style="font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
            Kinerja & Bonus Karyawan
          </h1>
          <p class="text-muted mb-0" style="font-size: 13.5px; line-height: 1.4;">
            Panel kendali pimpinan: rekapitulasi kehadiran staf, evaluasi kinerja, penetapan nominal bonus, dan cetak slip resmi.
          </p>
        </div>
        
        <!-- Filter Periode Rapi & Horizontal -->
        <div class="card p-8 flex items-center gap-8" style="background: #fff; border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); flex-shrink: 0; white-space: nowrap;">
          <span class="text-xs text-muted font-bold" style="padding-left: 4px;">Periode:</span>
          <select id="filterBulan" class="ctl-sm" style="font-weight: 600; min-width: 120px; height: 34px;">
            ${NAMA_BULAN.map((nama, idx) => `
              <option value="${idx + 1}" ${idx + 1 === filterBulan ? 'selected' : ''}>${nama}</option>
            `).join('')}
          </select>
          <select id="filterTahun" class="ctl-sm" style="font-weight: 600; width: 85px; height: 34px;">
            <option value="2025" ${filterTahun === 2025 ? 'selected' : ''}>2025</option>
            <option value="2026" ${filterTahun === 2026 ? 'selected' : ''}>2026</option>
            <option value="2027" ${filterTahun === 2027 ? 'selected' : ''}>2027</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="btnRefreshHris" style="height: 34px; font-weight: 600; padding: 0 12px; display: inline-flex; align-items: center; gap: 6px;">
            ${UI.ikon('ulang', 14)} Muat Ulang
          </button>
        </div>
      </div>

      <!-- Banner Profil Pimpinan / Pemilik Lab -->
      <div class="mb-24" style="background: linear-gradient(135deg, var(--brand-900) 0%, var(--brand-700) 100%); color: #fff; border-radius: 14px; padding: 20px 24px; box-shadow: 0 4px 14px rgba(15,139,126,0.18);">
        <div class="flex items-center justify-between flex-wrap gap-16">
          <div class="flex items-center gap-14">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.18); border: 2px solid rgba(255,255,255,0.4); display: grid; place-items: center; font-size: 18px; font-weight: 800; color: #fff; letter-spacing: 0.5px; flex-shrink: 0;">
              ${inisialPimpinan}
            </div>
            <div>
              <div style="font-size: 11.5px; color: #C6E6E1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px;">
                Kepala Laboratorium (Pemilik)
              </div>
              <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.2px; margin-top: 1px; color: #FFFFFF;">
                ${UI.esc(namaPimpinan)}
              </div>
              <div class="flex items-center gap-8 mt-4">
                <span class="badge" style="background: var(--warn-700); color: #fff; text-transform: uppercase; font-size: 10.5px; font-weight: 700; padding: 3px 8px;">
                  PIMPINAN • PEMILIK LAB
                </span>
                <span style="font-size: 12px; color: #A7F3D0; font-weight: 500;">
                  • Kebijakan Bonus Langsung dari Pimpinan
                </span>
              </div>
            </div>
          </div>

          <div class="text-right">
            <div style="font-size: 11px; color: #C6E6E1; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Periode Evaluasi Aktif</div>
            <div style="font-size: 22px; font-weight: 800; color: #fff; line-height: 1.2; margin: 3px 0;">
              <span id="labelPeriodeAktif">${NAMA_BULAN[filterBulan - 1]} ${filterTahun}</span>
            </div>
            <div style="font-size: 12px; color: #E2E8F0; opacity: 0.9;">
              Laboratorium Medis Utama
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Bar Utama (Modern, No Emotes) -->
      <div class="tab-bar mb-20" style="gap: 4px; border-bottom: 2px solid #E2E8F0; padding-bottom: 0;">
        <button class="tab ${tabAktif === 'absensi' ? 'on' : ''}" data-t="absensi" style="padding: 10px 18px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
          ${UI.ikon('jam', 15)} Rekap Kehadiran Staf
        </button>
        <button class="tab ${tabAktif === 'kpi' ? 'on' : ''}" data-t="kpi" style="padding: 10px 18px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
          ${UI.ikon('cek', 15)} Evaluasi & KPI Karyawan
        </button>
        <button class="tab ${tabAktif === 'bonus' ? 'on' : ''}" data-t="bonus" style="padding: 10px 18px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
          ${UI.ikon('laporan', 15)} Penggajian & Bonus
        </button>
      </div>
      
      <!-- Kontainer Konten Tab -->
      <div id="isiTabHris">
        ${UI.memuat(3)}
      </div>
    `;

    w.querySelector('#filterBulan').addEventListener('change', e => { 
      filterBulan = parseInt(e.target.value, 10); 
      updateLabelPeriode();
      muatUlangMaster(); 
    });
    w.querySelector('#filterTahun').addEventListener('change', e => { 
      filterTahun = parseInt(e.target.value, 10); 
      updateLabelPeriode();
      muatUlangMaster(); 
    });
    w.querySelector('#btnRefreshHris').addEventListener('click', muatUlangMaster);

    w.querySelectorAll('.tab[data-t]').forEach(b => {
      b.addEventListener('click', () => {
        tabAktif = b.dataset.t;
        w.querySelectorAll('.tab[data-t]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        gambarTabMaster();
      });
    });

    await muatUlangMaster();
  }

  function updateLabelPeriode() {
    const el = w.querySelector('#labelPeriodeAktif');
    if (el) el.textContent = `${NAMA_BULAN[filterBulan - 1]} ${filterTahun}`;
  }

  async function muatUlangMaster() {
    const isi = w.querySelector('#isiTabHris');
    if (isi) isi.innerHTML = UI.memuat(3);
    
    const awalBulan = new Date(filterTahun, filterBulan - 1, 1).toISOString().split('T')[0];
    const akhirBulan = new Date(filterTahun, filterBulan, 0).toISOString().split('T')[0];
    
    try {
      const [pegawaiList, absensiList, kpiList, bonusList, jamConfig, aktivitasData, insentifConfig] = await Promise.all([
        DB.daftarPegawaiStaff(),
        DB.absensiLaporan(awalBulan, akhirBulan),
        DB.kpiDaftar(filterBulan, filterTahun),
        DB.bonusDaftar(filterBulan, filterTahun),
        DB.pengaturanJamKerja(),
        DB.laporanKaryawanAktivitas ? DB.laporanKaryawanAktivitas({ dari: awalBulan, sampai: akhirBulan }) : Promise.resolve(null),
        DB.pengaturanInsentifAktivitas ? DB.pengaturanInsentifAktivitas() : Promise.resolve(null)
      ]);

      dataPegawai = (pegawaiList || []).map(p => {
        const rek = DB.ambilRekeningPegawaiLokal ? DB.ambilRekeningPegawaiLokal(p.id) : null;
        const mk = DB.ambilMulaiKerjaPegawaiLokal ? DB.ambilMulaiKerjaPegawaiLokal(p.id) : null;
        return {
          ...p,
          tgl_mulai_kerja: p.tgl_mulai_kerja || mk?.tgl_mulai_kerja || null,
          nama_bank: p.nama_bank || rek?.nama_bank || '',
          nomor_rekening: p.nomor_rekening || rek?.nomor_rekening || '',
          atas_nama_rekening: p.atas_nama_rekening || rek?.atas_nama_rekening || p.nama || ''
        };
      });
      dataAbsensi = absensiList || [];
      dataKpi = kpiList || [];
      dataBonus = bonusList || [];
      if (jamConfig) jamKerja = jamConfig;
      if (aktivitasData) dataAktivitas = aktivitasData;
      if (insentifConfig) tarifInsentif = insentifConfig;

      gambarTabMaster();
    } catch (e) {
      if (isi) {
        isi.innerHTML = `<div class="banner err"><div>Gagal memuat data: ${UI.esc(e.message)}</div></div>`;
      }
    }
  }

  function gambarTabMaster() {
    const isi = w.querySelector('#isiTabHris');
    if (!isi) return;

    if (tabAktif === 'absensi') tabRekapAbsensi(isi);
    else if (tabAktif === 'kpi') tabKpiEvaluasi(isi);
    else if (tabAktif === 'bonus') tabPenetapanBonus(isi);
  }

  /* =====================================================================
     MASTER - TAB 1: REKAPITULASI KEHADIRAN STAF
     ===================================================================== */
  function tabRekapAbsensi(isi) {
    let sumHadir = 0;
    let sumTepatWaktu = 0;
    let sumTerlambat = 0;
    let sumMenitTelat = 0;
    let sumIzin = 0;

    const barisRekap = dataPegawai.map(p => {
      const r = hitungRekapPerPegawai(p.id);
      sumHadir += r.hadir;
      sumTepatWaktu += r.tepatWaktu;
      sumTerlambat += r.terlambat;
      sumMenitTelat += r.totalMenitTelat;
      sumIzin += r.izinCuti;
      return { pegawai: p, ...r };
    });

    const rataDisiplin = barisRekap.length ? Math.round(barisRekap.reduce((acc, c) => acc + c.disiplinPersen, 0) / barisRekap.length) : 0;

    isi.innerHTML = `
      <div class="absensi-panel">
        <div class="absensi-panel-head">
          <div>
            <h2 class="flex items-center gap-10" style="margin: 0; font-size: 17px; font-weight: 700; color: #0F172A;">
              ${UI.ikon('jam', 19)} Rekapitulasi Kehadiran & Kedisiplinan Staf Laboratorium
            </h2>
            <div class="text-muted text-xs mt-4">
              Akumulasi data absensi otomatis berbasis geofencing GPS untuk periode <b>${NAMA_BULAN[filterBulan - 1]} ${filterTahun}</b>.
            </div>
          </div>
        </div>

        <!-- Kartu Statistik Presensi -->
        <div class="absensi-stat-grid">
          <div class="absensi-stat-card">
            <div class="text-xs text-muted">Total Karyawan Aktif</div>
            <div style="font-size:22px; font-weight:800; color:#0F172A;">${dataPegawai.length} Orang</div>
          </div>
          <div class="absensi-stat-card stat-ok">
            <div class="text-xs" style="color:var(--ok-700); font-weight:600;">Total Kehadiran</div>
            <div style="font-size:22px; font-weight:800; color:var(--ok-700);">${sumHadir} hari</div>
          </div>
          <div class="absensi-stat-card stat-ok">
            <div class="text-xs" style="color:var(--ok-700); font-weight:600;">Hadir Tepat Waktu</div>
            <div style="font-size:22px; font-weight:800; color:var(--ok-700);">${sumTepatWaktu} hari</div>
          </div>
          <div class="absensi-stat-card stat-danger">
            <div class="text-xs" style="color:var(--danger-700); font-weight:600;">Frekuensi Terlambat</div>
            <div style="font-size:22px; font-weight:800; color:var(--danger-700);">${sumTerlambat} kali</div>
          </div>
          <div class="absensi-stat-card stat-warn">
            <div class="text-xs" style="color:var(--warn-700); font-weight:600;">Akumulasi Menit Telat</div>
            <div style="font-size:22px; font-weight:800; color:var(--warn-700);">${sumMenitTelat} mnt</div>
          </div>
          <div class="absensi-stat-card stat-brand">
            <div class="text-xs" style="color:var(--brand-800); font-weight:600;">Rata-Rata Kedisiplinan</div>
            <div style="font-size:22px; font-weight:800; color:var(--brand-800);">${rataDisiplin}%</div>
          </div>
        </div>

        <!-- Tabel Rekap Presensi Karyawan -->
        <div style="padding: 20px 24px;">
          ${!barisRekap.length ? `
            <div class="empty text-center p-24 text-muted" style="border: 1px dashed #CBD5E1; border-radius: 12px; background: #F8FAFC;">
              Belum ada data akun karyawan staf yang terdaftar di sistem.
            </div>
          ` : `
            <div class="absensi-table-wrap"><table class="tbl w-full">
              <thead><tr>
                <th>NAMA PEGAWAI</th>
                <th>PERAN</th>
                <th>LAMA BEKERJA</th>
                <th>TOTAL HADIR</th>
                <th>TEPAT WAKTU</th>
                <th>TERLAMBAT</th>
                <th>TOTAL MENIT TELAT</th>
                <th>IZIN / CUTI</th>
                <th>DISIPLIN</th>
                <th style="text-align: center;">DETAIL PRESENSI</th>
              </tr></thead>
              <tbody>
                ${barisRekap.map(item => {
                  const masaKerja = hitungLamaBekerja(item.pegawai.tgl_mulai_kerja);
                  return `
                  <tr>
                    <td><b style="color: #0F172A;">${UI.esc(item.pegawai.nama)}</b></td>
                    <td><span class="badge" style="background:#F1F5F9; color:#475569; font-size:11px; font-weight:700;">${labelRole(item.pegawai.peran)}</span></td>
                    <td>
                      ${masaKerja ? `
                        <div class="flex items-center gap-6">
                          <span class="badge" style="background:#EFF6FF; color:#1D4ED8; font-weight:700; font-size:11px; padding:3px 8px;">
                            ${masaKerja.teks}
                          </span>
                          <button class="btn btn-sm btn-ghost" data-atur-mulai="${item.pegawai.id}" title="Ubah Awal Bekerja" style="padding: 2px 5px; height: 22px; color: #64748B;">
                            ${UI.ikon('pensil', 11)}
                          </button>
                        </div>
                        <div class="text-muted" style="font-size: 10px; margin-top: 2px;">
                          Mulai ${masaKerja.labelMulai}
                        </div>
                      ` : `
                        <button class="btn btn-sm btn-secondary" data-atur-mulai="${item.pegawai.id}" style="padding: 3px 8px; font-size: 10.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                          ${UI.ikon('plus', 11)} Atur
                        </button>
                      `}
                    </td>
                    <td><b style="font-size: 13.5px; color:#0F172A;">${item.hadir} hari</b></td>
                    <td><span class="badge b-selesai" style="font-size: 11px; padding: 3px 8px;">${item.tepatWaktu} hari</span></td>
                    <td>
                      ${item.terlambat > 0 
                        ? `<span class="badge b-danger" style="font-size: 11px; padding: 3px 8px;">${item.terlambat} kali</span>`
                        : `<span class="text-muted text-xs">—</span>`}
                    </td>
                    <td class="mono" style="font-size: 13px;">
                      ${item.totalMenitTelat > 0 ? `<span style="color:var(--danger-700); font-weight:700;">${item.totalMenitTelat} menit</span>` : '0'}
                    </td>
                    <td>${item.izinCuti > 0 ? `<span class="badge b-kajian">${item.izinCuti} hari</span>` : '<span class="text-muted text-xs">—</span>'}</td>
                    <td>
                      <span class="badge ${item.disiplinPersen >= 95 ? 'b-selesai' : (item.disiplinPersen >= 80 ? 'b-menunggu' : 'b-danger')}" style="font-weight:700;">
                        ${item.disiplinPersen}%
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <button class="btn btn-secondary btn-sm" data-lihat-presensi="${item.pegawai.id}" style="padding: 5px 12px; font-size: 11.5px; font-weight: 600;">
                        ${UI.ikon('jam', 13)} Log Presensi
                      </button>
                    </td>
                  </tr>
                `; }).join('')}
              </tbody>
            </table></div>
          `}
        </div>
      </div>
    `;

    isi.querySelectorAll('[data-atur-mulai]').forEach(btn => {
      btn.addEventListener('click', () => {
        const peg = dataPegawai.find(p => p.id === btn.dataset.aturMulai);
        if (peg) dialogAturMulaiKerja(peg);
      });
    });

    isi.querySelectorAll('[data-lihat-presensi]').forEach(btn => {
      btn.addEventListener('click', () => {
        const peg = dataPegawai.find(p => p.id === btn.dataset.lihatPresensi);
        if (peg) {
          const rekap = hitungRekapPerPegawai(peg.id);
          dialogDetailPresensi(peg, rekap);
        }
      });
    });
  }

  /* Modal Input / Sesuaikan Bulan & Tahun Awal Mulai Bekerja */
  function dialogAturMulaiKerja(peg) {
    const info = hitungLamaBekerja(peg.tgl_mulai_kerja);
    const bulanDefault = info ? info.bulanAwal : (filterBulan || (new Date().getMonth() + 1));
    const tahunDefault = info ? info.tahunAwal : (filterTahun || new Date().getFullYear());

    UI.modal({
      judul: `Atur Awal Bekerja: ${UI.esc(peg.nama)}`,
      isi: `
        <div style="font-size: 13px; color: #475569; margin-bottom: 16px;">
          Tentukan bulan dan tahun awal mulai bekerja untuk menghitung lama masa kerja staf secara otomatis.
        </div>

        <form id="formMulaiKerjaModal" style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="field">
              <label style="font-weight: 600; color: #0F172A;">Bulan Awal Bekerja <span class="req">*</span></label>
              <select name="bulan_mulai" id="inputBulanMulai" required class="w-full" style="height: 38px; font-weight: 600;">
                ${NAMA_BULAN.map((nama, idx) => `
                  <option value="${idx + 1}" ${idx + 1 === bulanDefault ? 'selected' : ''}>${nama}</option>
                `).join('')}
              </select>
            </div>
            <div class="field">
              <label style="font-weight: 600; color: #0F172A;">Tahun Awal Bekerja <span class="req">*</span></label>
              <input type="number" name="tahun_mulai" id="inputTahunMulai" min="1990" max="${new Date().getFullYear() + 1}" value="${tahunDefault}" required class="w-full mono" style="height: 38px; font-weight: 700;">
            </div>
          </div>

          <div id="previewMasaKerjaBox" style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 8px; padding: 12px 14px; margin-top: 4px;">
            <div style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Estimasi Lama Bekerja:</div>
            <div id="previewTeksMasaKerja" style="font-size: 16px; font-weight: 800; color: #15803D; margin-top: 3px;">
              Memuat...
            </div>
          </div>
        </form>
      `,
      siap: (badan) => {
        const bSel = badan.querySelector('#inputBulanMulai');
        const tInp = badan.querySelector('#inputTahunMulai');
        const box = badan.querySelector('#previewTeksMasaKerja');
        function updateLive() {
          if (!bSel || !tInp || !box) return;
          const b = Number(bSel.value);
          const t = Number(tInp.value);
          if (!b || !t) return;
          const bStr = String(b).padStart(2, '0');
          const calc = hitungLamaBekerja(`${t}-${bStr}-01`);
          if (calc) {
            box.textContent = `${calc.teks} (Mulai ${calc.labelMulai})`;
          } else {
            box.textContent = '—';
          }
        }
        bSel?.addEventListener('change', updateLive);
        tInp?.addEventListener('input', updateLive);
        updateLive();
      },
      tombol: [
        { teks: 'Batal', nilai: false },
        {
          teks: 'Simpan Masa Kerja',
          kelas: 'btn-primary',
          aksi: async (modalBody) => {
            const form = modalBody.querySelector('#formMulaiKerjaModal');
            if (!form.reportValidity()) return false;

            const b = Number(form.bulan_mulai.value);
            const t = Number(form.tahun_mulai.value);
            const bStr = String(b).padStart(2, '0');
            const isoDate = `${t}-${bStr}-01`;

            try {
              await DB.simpanMulaiKerjaPegawai(peg.id, isoDate);
              peg.tgl_mulai_kerja = isoDate;
              const pItem = dataPegawai.find(x => x.id === peg.id);
              if (pItem) pItem.tgl_mulai_kerja = isoDate;

              UI.toast(`Awal bekerja ${peg.nama} berhasil disimpan (${NAMA_BULAN[b - 1]} ${t})!`, 'ok');
              gambarTabMaster();
              return true;
            } catch (err) {
              UI.toast('Gagal menyimpan masa kerja: ' + err.message, 'err');
              return false;
            }
          }
        }
      ]
    });
  }

  function dialogDetailPresensi(peg, rekap) {
    const list = rekap.daftarHadir || [];
    UI.modal({
      judul: `Detail Presensi: ${UI.esc(peg.nama)} (${labelRole(peg.peran)})`,
      lebar: true,
      isi: `
        <div class="absensi-banner-box mb-16" style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px 18px; border-radius: 10px;">
          <div style="font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase;">
            Rekap Periode ${NAMA_BULAN[filterBulan - 1]} ${filterTahun}:
          </div>
          <div class="flex items-center gap-14 mt-6 text-xs flex-wrap" style="color: #0F172A;">
            <span>Total Hadir: <b>${rekap.hadir} hari</b></span>
            <span>Tepat Waktu: <b style="color:var(--ok-700);">${rekap.tepatWaktu} hari</b></span>
            <span>Terlambat: <b style="color:var(--danger-700);">${rekap.terlambat} kali (${rekap.totalMenitTelat} mnt)</b></span>
            <span>Izin / Cuti: <b>${rekap.izinCuti} hari</b></span>
            <span>Kedisiplinan: <b class="badge b-selesai" style="font-size:11px;">${rekap.disiplinPersen}%</b></span>
          </div>
        </div>

        ${!list.length ? `
          <div class="empty text-center p-20 text-muted" style="border: 1px dashed #CBD5E1; border-radius: 8px; background: #F8FAFC;">
            Belum ada catatan presensi masuk untuk pegawai ini pada periode terpilih.
          </div>
        ` : `
          <div class="absensi-table-wrap" style="max-height: 420px; overflow-y: auto;">
            <table class="tbl w-full">
              <thead><tr>
                <th>TANGGAL</th>
                <th>JAM MASUK</th>
                <th>JAM KELUAR</th>
                <th>STATUS</th>
                <th>LOKASI PRESENSI</th>
                <th>KETERANGAN</th>
              </tr></thead>
              <tbody>
                ${list.map(a => {
                  const chk = a.waktu_masuk ? cekStatusKeterlambatan(a.waktu_masuk, jamKerja.jam_masuk, jamKerja.toleransi_keterlambatan_menit) : null;
                  const badgeMasuk = chk ? (chk.terlambat
                    ? `<span class="badge b-danger" style="font-size:10px; margin-left:4px; padding:2px 5px;">+${chk.menit}m</span>`
                    : `<span class="badge b-selesai" style="font-size:10px; margin-left:4px; padding:2px 5px;">Tepat</span>`) : '';

                  const teksLok = a.lokasi_masuk || '—';
                  const lower = teksLok.toLowerCase();
                  let iconName = 'lokasi';
                  let badgeClass = 'b-menunggu';
                  if (lower.includes('laboratorium') || lower.includes('lab pusat')) {
                    iconName = 'faskes';
                    badgeClass = 'b-selesai';
                  } else if (lower.includes('puskesmas')) {
                    iconName = 'faskes';
                    badgeClass = 'b-kajian';
                  } else if (lower.includes('rs') || lower.includes('rumah sakit')) {
                    iconName = 'faskes';
                    badgeClass = 'b-dokter';
                  } else if (teksLok !== '—') {
                    iconName = 'lokasi';
                    badgeClass = 'b-warn';
                  }

                  return `
                    <tr>
                      <td><b>${UI.tglIndo(a.tanggal, true)}</b></td>
                      <td class="mono" style="font-size: 12.5px;">${a.waktu_masuk ? UI.jam(a.waktu_masuk) + ' WIB ' + badgeMasuk : '—'}</td>
                      <td class="mono" style="font-size: 12.5px;">${a.waktu_keluar ? UI.jam(a.waktu_keluar) + ' WIB' : '—'}</td>
                      <td>
                        <span class="badge ${a.status === 'HADIR' ? 'b-selesai' : (a.status === 'ALFA' ? 'b-danger' : 'b-kajian')}" style="font-size: 11px;">
                          ${UI.esc(a.status)}
                        </span>
                      </td>
                      <td>
                        ${teksLok === '—' ? '<span class="text-muted text-xs">—</span>' : `
                          <span class="badge ${badgeClass}" style="font-size: 11px; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;">
                            ${UI.ikon(iconName, 12)} <span>${UI.esc(teksLok)}</span>
                          </span>
                        `}
                      </td>
                      <td class="text-xs text-muted">${UI.esc(a.keterangan || '—')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      `,
      tombol: [{ teks: 'Tutup', nilai: true }]
    });
  }

  /* =====================================================================
     MASTER - TAB 2: EVALUASI KINERJA & KPI KARYAWAN
     ===================================================================== */
  function tabKpiEvaluasi(isi) {
    isi.innerHTML = `
      <div class="absensi-panel">
        <div class="absensi-panel-head">
          <div>
            <h2 class="flex items-center gap-10" style="margin: 0; font-size: 17px; font-weight: 700; color: #0F172A;">
              ${UI.ikon('cek', 19)} Evaluasi & Indikator Kinerja Utama (KPI)
            </h2>
            <div class="text-muted text-xs mt-4">
              Penilaian pencapaian target kerja dan mutu pelayanan staf laboratorium untuk periode <b>${NAMA_BULAN[filterBulan - 1]} ${filterTahun}</b>.
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="btnTambahKpi" style="height: 36px; padding: 0 14px; font-weight: 600;">
            ${UI.ikon('plus', 15)} Tambah Evaluasi KPI
          </button>
        </div>

        <div style="padding: 20px 24px;">
          ${!dataKpi.length ? `
            <div class="empty text-center p-24 text-muted" style="border: 1px dashed #CBD5E1; border-radius: 12px; background: #F8FAFC;">
              Belum ada data evaluasi KPI karyawan untuk bulan ini. Klik tombol "Tambah Evaluasi KPI" untuk menambahkan penilaian kerja staf.
            </div>
          ` : `
            <div class="absensi-table-wrap"><table class="tbl w-full">
              <thead><tr>
                <th>PEGAWAI</th>
                <th>INDIKATOR / METRIK KINERJA</th>
                <th>TARGET</th>
                <th>CAPAIAN</th>
                <th>NILAI (%)</th>
                <th>CATATAN PIMPINAN</th>
                <th style="text-align: center;">AKSI</th>
              </tr></thead>
              <tbody>
                ${dataKpi.map(k => `
                  <tr>
                    <td>
                      <b style="color: #0F172A;">${UI.esc(k.pegawai?.nama || 'Karyawan')}</b>
                      <div class="text-xs text-muted" style="margin-top:2px;">${labelRole(k.pegawai?.peran)}</div>
                    </td>
                    <td><b style="color: #0F172A;">${UI.esc(k.metrik)}</b></td>
                    <td class="mono font-bold" style="color: #334155;">${k.target}</td>
                    <td class="mono font-bold" style="color: #0F8B7E;">${k.capaian}</td>
                    <td>
                      <span class="badge ${k.nilai >= 100 ? 'b-selesai' : (k.nilai >= 80 ? 'b-kajian' : 'b-danger')}" style="font-weight:700;">
                        ${k.nilai}%
                      </span>
                    </td>
                    <td class="text-xs" style="color: #475569; max-width: 200px;">${UI.esc(k.keterangan || '—')}</td>
                    <td style="text-align: center;">
                      <div class="flex items-center gap-6" style="justify-content: center;">
                        <button class="btn btn-secondary btn-sm" data-edit-kpi="${k.id}" style="padding: 4px 8px; font-size: 11px;">
                          ${UI.ikon('pensil', 12)} Ubah
                        </button>
                        <button class="btn btn-secondary btn-sm" data-hapus-kpi="${k.id}" style="color:var(--danger-700); padding: 4px 8px; font-size: 11px;">
                          ${UI.ikon('hapus', 12)}
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table></div>
          `}
        </div>
      </div>
    `;

    isi.querySelector('#btnTambahKpi')?.addEventListener('click', () => dialogFormKpi());

    isi.querySelectorAll('[data-edit-kpi]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = dataKpi.find(k => k.id === btn.dataset.editKpi);
        if (item) dialogFormKpi(item);
      });
    });

    isi.querySelectorAll('[data-hapus-kpi]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!await UI.konfirmasi('Hapus Evaluasi KPI', 'Apakah Anda yakin ingin menghapus data KPI ini?', 'Ya, Hapus', true)) return;
        try {
          await DB.kpiHapus(btn.dataset.hapusKpi);
          UI.toast('Evaluasi KPI berhasil dihapus.', 'ok');
          await muatUlangMaster();
        } catch (e) {
          UI.toast('Gagal menghapus KPI: ' + e.message, 'err');
        }
      });
    });
  }

  function dialogFormKpi(item = null) {
    const isEdit = !!item;
    UI.modal({
      judul: isEdit ? 'Ubah Evaluasi KPI Karyawan' : 'Tambah Evaluasi KPI Karyawan',
      isi: `
        <form id="formKpiModal" style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
          <div class="field">
            <label>Pilih Pegawai <span class="req">*</span></label>
            <select name="pegawai_id" required class="w-full" ${isEdit ? 'disabled' : ''}>
              ${dataPegawai.map(p => `
                <option value="${p.id}" ${item?.pegawai_id === p.id ? 'selected' : ''}>
                  ${UI.esc(p.nama)} (${labelRole(p.peran)})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="field">
            <label>Indikator / Metrik Kinerja <span class="req">*</span></label>
            <input type="text" name="metrik" value="${UI.esc(item?.metrik || '')}" 
                   placeholder="Contoh: Kecepatan dan akurasi analisis sampel, Kebersihan ruang lab, Nihil komplain" required class="w-full">
          </div>

          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="field">
              <label>Target Kinerja <span class="req">*</span></label>
              <input type="number" name="target" min="1" value="${item?.target ?? 100}" required class="w-full mono">
            </div>
            <div class="field">
              <label>Realisasi / Capaian <span class="req">*</span></label>
              <input type="number" name="capaian" min="0" value="${item?.capaian ?? 0}" required class="w-full mono">
            </div>
          </div>

          <div class="field">
            <label>Catatan Evaluasi / Apresiasi Pimpinan</label>
            <textarea name="keterangan" rows="2" class="w-full" placeholder="Contoh: Sangat teliti dalam validasi hasil hematologi, disiplin kerja memuaskan...">${UI.esc(item?.keterangan || '')}</textarea>
          </div>
        </form>
      `,
      tombol: [
        { teks: 'Batal', nilai: false },
        {
          teks: isEdit ? 'Simpan Perubahan' : 'Simpan Evaluasi',
          kelas: 'btn-primary',
          aksi: async (modalBody) => {
            const form = modalBody.querySelector('#formKpiModal');
            if (!form.reportValidity()) return false;

            const payload = {
              pegawai_id: isEdit ? item.pegawai_id : form.pegawai_id.value,
              bulan: filterBulan,
              tahun: filterTahun,
              metrik: form.metrik.value.trim(),
              target: Number(form.target.value),
              capaian: Number(form.capaian.value),
              keterangan: form.keterangan.value.trim() || null
            };

            try {
              await DB.kpiSimpan(payload, item?.id || null);
              UI.toast('Evaluasi KPI berhasil disimpan.', 'ok');
              await muatUlangMaster();
              return true;
            } catch (e) {
              UI.toast('Gagal menyimpan KPI: ' + e.message, 'err');
              return false;
            }
          }
        }
      ]
    });
  }

  /* =====================================================================
     MASTER - TAB 3: PENETAPAN PENGGAJIAN & PENCAIRAN BONUS KARYAWAN
     Formula: Gaji Pokok + Uang Makan (Kehadiran Masuk & Pulang) + Bonus = Total Transfer
     ===================================================================== */
  function tabPenetapanBonus(isi) {
    let totalGajiPokok = 0;
    let totalUangMakan = 0;
    let totalBonus = 0;
    let totalTransferSemua = 0;
    let totalSudahDitransfer = 0;
    let totalMenungguTransfer = 0;
    let countSudahTransfer = 0;
    let sumHariMakan = 0;

    const dataBarisBonus = dataPegawai.map(p => {
      const bonus = dataBonus.find(b => b.pegawai_id === p.id) || null;
      const rekap = hitungRekapPerPegawai(p.id);

      const gajiPokok = Number(bonus?.gaji_pokok || 0);

      // Hari hadir lengkap (masuk DAN pulang) untuk uang makan
      const hariMakan = (bonus?.hari_uang_makan !== undefined && bonus?.hari_uang_makan !== null)
        ? Number(bonus.hari_uang_makan)
        : rekap.hadirLengkapMakan;
      const tarifMakan = bonus?.tarif_uang_makan ? Number(bonus.tarif_uang_makan) : rekap.tarifUangMakan;
      const uangMakan = (bonus?.uang_makan !== undefined && bonus?.uang_makan !== null && Number(bonus.uang_makan) > 0)
        ? Number(bonus.uang_makan)
        : (hariMakan * tarifMakan);

      const totBonus = bonus ? Number(bonus.total_bonus || 0) : 0;
      const totalTransfer = bonus?.total_gaji_transfer ? Number(bonus.total_gaji_transfer) : (gajiPokok + uangMakan + totBonus);

      totalGajiPokok += gajiPokok;
      totalUangMakan += uangMakan;
      totalBonus += totBonus;
      totalTransferSemua += totalTransfer;
      sumHariMakan += hariMakan;

      if (bonus?.status_bayar === 'DIBAYAR') {
        totalSudahDitransfer += totalTransfer;
        countSudahTransfer++;
      } else {
        totalMenungguTransfer += totalTransfer;
      }

      return {
        pegawai: p,
        bonus,
        rekap,
        gajiPokok,
        hariMakan,
        tarifMakan,
        uangMakan,
        totBonus,
        totalTransfer
      };
    });

    isi.innerHTML = `
      <div class="absensi-panel">
        <div class="absensi-panel-head">
          <div>
            <h2 class="flex items-center gap-10" style="margin: 0; font-size: 17px; font-weight: 700; color: #0F172A;">
              ${UI.ikon('laporan', 19)} Penetapan Penggajian & Pencairan Bonus Karyawan
            </h2>
            <div class="text-muted text-xs mt-4">
              Perhitungan hak keuangan staf: <b>Gaji Pokok + Uang Makan (Absen Masuk & Pulang) + Bonus Kinerja</b>. Transfer dilakukan manual oleh Ibu Dede Kurniasih untuk periode <b>${NAMA_BULAN[filterBulan - 1]} ${filterTahun}</b>.
            </div>
          </div>
          <div class="flex items-center gap-8 flex-wrap">
            <button class="btn btn-secondary" id="btnAturTarifInsentif" style="height: 38px; font-weight: 600; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px;">
              ${UI.ikon('gear', 14)} Tarif Insentif Tindakan
            </button>
            <button class="btn btn-secondary" id="btnAturTarifMakan" style="height: 38px; font-weight: 600; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px;">
              ${UI.ikon('gear', 14)} Tarif Uang Makan (${UI.rupiah(jamKerja.tarif_uang_makan || 20000)})
            </button>
            <button class="btn btn-primary" id="btnInputBonusHead" style="height: 38px; font-weight: 700; padding: 0 16px; display: inline-flex; align-items: center; gap: 8px;">
              ${UI.ikon('plus', 16)} Input / Tetapkan Penggajian
            </button>
          </div>
        </div>

        <!-- Banner Info Panduan Transfer Manual Pimpinan -->
        <div class="absensi-banner-box" style="margin: 20px 24px 0 24px; border-radius: 10px; background: #F0FDF4; border: 1.5px solid #BBF7D0;">
          <div class="flex items-center gap-12">
            <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(15, 139, 126, 0.14); display: grid; place-items: center; color: var(--brand-800); flex-shrink: 0;">
              ${UI.ikon('info', 22)}
            </div>
            <div>
              <div style="font-size: 13.5px; font-weight: 700; color: #166534;">
                Panduan Penggajian & Transfer Manual Pimpinan (Ibu Dede Kurniasih)
              </div>
              <div style="font-size: 12.5px; color: #334155; margin-top: 2px; line-height: 1.5;">
                • <b>Uang Makan</b>: Dihitung otomatis 1x per hari jika staf memiliki catatan absensi <b>datang (masuk) DAN pulang</b> lengkap.<br>
                • <b>Insentif Kinerja & Tindakan</b>: Sistem menghitung kontribusi riil staf (lab, pendaftaran, surat, kasir) sebagai rekomendasi bonus. Pimpinan tetap <b>100% bebas mengubah nominal</b> kapan saja.<br>
                • <b>Transfer Manual</b>: Nominal bersih yang harus ditransfer ke masing-masing rekening staf tertera jelas pada kolom <b>TOTAL TRANSFER</b>. Klik tombol <b>Tandai Ditransfer</b> setelah melakukan transfer via perbankan.
              </div>
            </div>
          </div>
        </div>

        <!-- Stat Grid Ringkasan Dana Penggajian -->
        <div class="absensi-stat-grid" style="margin-top: 20px;">
          <div class="absensi-stat-card">
            <div class="text-xs text-muted">Karyawan Terdaftar</div>
            <div style="font-size:22px; font-weight:800; color:#0F172A;">${dataPegawai.length} Orang</div>
          </div>
          <div class="absensi-stat-card stat-brand">
            <div class="text-xs" style="color:var(--brand-800); font-weight:600;">Total Gaji Pokok</div>
            <div style="font-size:18px; font-weight:800; color:var(--brand-800);">${UI.rupiah(totalGajiPokok)}</div>
          </div>
          <div class="absensi-stat-card stat-ok">
            <div class="text-xs" style="color:var(--ok-700); font-weight:600;">Total Uang Makan (${sumHariMakan} hari)</div>
            <div style="font-size:18px; font-weight:800; color:var(--ok-700);">${UI.rupiah(totalUangMakan)}</div>
          </div>
          <div class="absensi-stat-card stat-warn">
            <div class="text-xs" style="color:var(--warn-700); font-weight:600;">Total Bonus & Insentif</div>
            <div style="font-size:18px; font-weight:800; color:var(--warn-700);">${UI.rupiah(totalBonus)}</div>
          </div>
          <div class="absensi-stat-card" style="background: linear-gradient(135deg, #0F766E 0%, #115E59 100%); color: #fff; border: none; grid-column: span 2;">
            <div class="text-xs" style="color:#A7F3D0; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">TOTAL DANA PENGGAJIAN BULAN INI (DITRANSFER)</div>
            <div style="font-size:24px; font-weight:900; color:#FFFFFF; margin: 3px 0;">${UI.rupiah(totalTransferSemua)}</div>
            <div class="text-xs" style="color:#E2E8F0;">
              Sudah Ditransfer: <b>${countSudahTransfer}/${dataPegawai.length} Staf</b> (${UI.rupiah(totalSudahDitransfer)}) • Menunggu: <b>${UI.rupiah(totalMenungguTransfer)}</b>
            </div>
          </div>
        </div>

        <!-- Tabel Rekapitulasi Penggajian & Transfer -->
        <div style="padding: 20px 24px;">
          ${!dataBarisBonus.length ? `
            <div class="empty text-center p-24 text-muted" style="border: 1px dashed #CBD5E1; border-radius: 12px; background: #F8FAFC;">
              Belum ada data karyawan staf aktif yang terdaftar di sistem.
            </div>
          ` : `
            <div class="absensi-table-wrap" style="overflow-x: auto;"><table class="tbl w-full">
              <thead><tr>
                <th style="min-width: 170px;">NAMA KARYAWAN</th>
                <th style="min-width: 180px;">REKENING TUJUAN TRANSFER</th>
                <th class="text-right" style="min-width: 100px;">GAJI POKOK</th>
                <th class="text-right" style="min-width: 130px;">UANG MAKAN</th>
                <th class="text-right" style="min-width: 110px;">TOTAL BONUS</th>
                <th class="text-right" style="min-width: 140px; background: #F0FDF4; color: #166534;">TOTAL TRANSFER (RP)</th>
                <th style="min-width: 150px; text-align: center;">STATUS TRANSFER</th>
                <th style="min-width: 130px; text-align: center;">AKSI</th>
              </tr></thead>
              <tbody>
                ${dataBarisBonus.map(row => {
                  const b = row.bonus;
                  const sudahBayar = b?.status_bayar === 'DIBAYAR';
                  const rekBank = row.pegawai.nama_bank || '';
                  const noRek = row.pegawai.nomor_rekening || '';
                  const anRek = row.pegawai.atas_nama_rekening || row.pegawai.nama || '';
                  const masaKerja = hitungLamaBekerja(row.pegawai.tgl_mulai_kerja);
                  const kont = hitungKontribusiPegawai(row.pegawai.id);

                  return `
                    <tr>
                      <td>
                        <b style="color: #0F172A; font-size: 13.5px;">${UI.esc(row.pegawai.nama)}</b>
                        <div class="text-xs text-muted" style="margin-top:2px;">
                          ${labelRole(row.pegawai.peran)} • Masa Kerja: <b>${masaKerja ? masaKerja.teks : '—'}</b> • Hadir: <b>${row.rekap.hadir} hr</b> • Tindakan: <b>${kont.totalTindakan}x</b> (Insentif: <b>${UI.rupiah(kont.totalNominal)}</b>)
                        </div>
                        ${!masaKerja ? `
                          <div class="mt-2">
                            <span style="color:var(--brand-800); font-weight:600; font-size:10.5px; cursor:pointer;" data-atur-mulai="${row.pegawai.id}">+ Atur Masa Kerja</span>
                          </div>
                        ` : ''}
                        ${b?.catatan ? `<div class="text-xs mt-4" style="color: #047857; font-style: italic;">"${UI.esc(b.catatan)}"</div>` : ''}
                      </td>

                      <!-- Kolom Rekening Bank Tujuan Transfer Manual -->
                      <td>
                        ${noRek ? `
                          <div>
                            <span class="badge" style="background:#E0F2FE; color:#0369A1; font-weight:800; font-size:11px; text-transform:uppercase;">${UI.esc(rekBank || 'BANK')}</span>
                            <span class="mono font-bold" style="font-size:13px; color:#0F172A; margin-left:4px;">${UI.esc(noRek)}</span>
                          </div>
                          <div class="text-xs text-muted mt-2" style="font-size:11px;">a.n. <b>${UI.esc(anRek)}</b></div>
                          <button class="btn btn-sm btn-ghost mt-4" data-copy-rek="${UI.esc(noRek)}" style="padding: 2px 7px; font-size: 10.5px; height: 22px; display: inline-flex; align-items: center; gap: 4px; color: #475569; border: 1px solid #CBD5E1;">
                            ${UI.ikon('salin', 11)} Salin Rekening
                          </button>
                        ` : `
                          <div class="text-xs" style="color: #94A3B8; font-style: italic;">
                            Belum ada no rekening.<br>
                            <span style="color:var(--brand-800); font-weight:600; cursor:pointer;" data-edit-bonus="${row.pegawai.id}">+ Atur Rekening</span>
                          </div>
                        `}
                      </td>

                      <!-- Gaji Pokok -->
                      <td class="mono text-right" style="color: #334155; font-size: 13px;">
                        ${row.gajiPokok > 0 ? UI.rupiah(row.gajiPokok) : '<span class="text-muted text-xs">—</span>'}
                      </td>

                      <!-- Uang Makan: x hari hadir lengkap @ tarif -->
                      <td class="mono text-right" style="color: #334155;">
                        <div style="font-weight: 700; color: #0F172A; font-size: 13px;">${UI.rupiah(row.uangMakan)}</div>
                        <div class="text-xs text-muted" style="font-size: 10.5px;">${row.hariMakan} hr @ ${UI.formatRibuan(row.tarifMakan)}</div>
                      </td>

                      <!-- Total Bonus -->
                      <td class="mono text-right" style="color: #334155; font-size: 13px;">
                        ${row.totBonus > 0 ? UI.rupiah(row.totBonus) : '<span class="text-muted text-xs">Rp 0</span>'}
                      </td>

                      <!-- Total Transfer (Highlight Hijau Tebal) -->
                      <td class="mono text-right" style="background: #F0FDF4;">
                        <div style="font-size: 15px; font-weight: 900; color: #064E3B;">
                          ${UI.rupiah(row.totalTransfer)}
                        </div>
                        <div class="text-xs" style="color: #166534; font-size: 10px; font-family: sans-serif;">
                          Gaji + Uang Makan + Bonus
                        </div>
                      </td>

                      <!-- Status Transfer Manual -->
                      <td style="text-align: center;">
                        ${sudahBayar ? `
                          <span class="badge b-selesai" style="font-size: 11px; padding: 4px 8px;">
                            Sudah Ditransfer ${b.tanggal_bayar ? `<br><small class="mono">(${UI.tglIndo(b.tanggal_bayar)})</small>` : ''}
                          </span>
                          <div class="mt-4">
                            <button class="btn btn-sm btn-ghost" data-toggle-bayar="${row.pegawai.id}" data-target-status="BELUM" style="font-size: 10px; padding: 2px 6px; color: #94A3B8;">
                              Batal Status
                            </button>
                          </div>
                        ` : `
                          <span class="badge b-menunggu" style="font-size: 11px; padding: 4px 8px;">
                            Menunggu Transfer
                          </span>
                          <div class="mt-4">
                            <button class="btn btn-sm" data-toggle-bayar="${row.pegawai.id}" data-target-status="DIBAYAR" style="font-size: 10.5px; padding: 3px 8px; font-weight: 700; background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; display: inline-flex; align-items: center; gap: 4px;">
                              ${UI.ikon('cek', 11)} Tandai Ditransfer
                            </button>
                          </div>
                        `}
                      </td>

                      <!-- Aksi -->
                      <td style="text-align: center;">
                        <div class="flex items-center gap-6" style="justify-content: center; flex-wrap: nowrap;">
                          <button class="btn ${b ? 'btn-secondary' : 'btn-primary'} btn-sm" data-edit-bonus="${row.pegawai.id}" title="Sesuaikan Rincian Gaji & Rekening" style="font-weight: 600; padding: 6px 10px; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;">
                            ${UI.ikon('pensil', 13)} ${b ? 'Ubah Rincian' : 'Input Rincian'}
                          </button>
                          <button class="btn btn-primary btn-sm" data-cetak-slip="${row.pegawai.id}" title="Cetak Slip Resmi Gaji & Bonus" style="font-weight: 600; padding: 6px 10px; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;">
                            ${UI.ikon('cetak', 13)} Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table></div>
          `}
        </div>
      </div>
    `;

    isi.querySelector('#btnAturTarifInsentif')?.addEventListener('click', () => dialogAturTarifInsentif());
    isi.querySelector('#btnAturTarifMakan')?.addEventListener('click', () => dialogAturTarifUangMakan());
    isi.querySelector('#btnInputBonusHead')?.addEventListener('click', () => dialogInputBonus());

    isi.querySelectorAll('[data-edit-bonus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const peg = dataPegawai.find(p => p.id === btn.dataset.editBonus);
        if (peg) {
          const b = dataBonus.find(x => x.pegawai_id === peg.id) || null;
          dialogInputBonus(peg, b);
        }
      });
    });

    isi.querySelectorAll('[data-atur-mulai]').forEach(btn => {
      btn.addEventListener('click', () => {
        const peg = dataPegawai.find(p => p.id === btn.dataset.aturMulai);
        if (peg) dialogAturMulaiKerja(peg);
      });
    });

    isi.querySelectorAll('[data-cetak-slip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const peg = dataPegawai.find(p => p.id === btn.dataset.cetakSlip);
        if (peg) {
          const b = dataBonus.find(x => x.pegawai_id === peg.id) || null;
          const rekap = hitungRekapPerPegawai(peg.id);
          dialogCetakSlip(peg, b, rekap);
        }
      });
    });

    isi.querySelectorAll('[data-copy-rek]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const no = btn.dataset.copyRek;
        if (!no) return;
        try {
          await navigator.clipboard.writeText(no);
          UI.toast(`Nomor rekening ${no} berhasil disalin ke clipboard!`, 'ok');
        } catch (e) {
          UI.toast(`Nomor rekening: ${no}`, 'info');
        }
      });
    });

    isi.querySelectorAll('[data-toggle-bayar]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = btn.dataset.toggleBayar;
        const targetStatus = btn.dataset.targetStatus;
        const peg = dataPegawai.find(p => p.id === targetId);
        if (!peg) return;

        const existingBonus = dataBonus.find(x => x.pegawai_id === targetId) || null;
        const rekap = hitungRekapPerPegawai(targetId);

        const g = existingBonus ? Number(existingBonus.gaji_pokok || 0) : 0;
        const hariMakan = (existingBonus?.hari_uang_makan !== undefined && existingBonus?.hari_uang_makan !== null) 
          ? Number(existingBonus.hari_uang_makan) 
          : rekap.hadirLengkapMakan;
        const tarifMakan = existingBonus?.tarif_uang_makan ? Number(existingBonus.tarif_uang_makan) : rekap.tarifUangMakan;
        const u = (existingBonus?.uang_makan !== undefined && existingBonus?.uang_makan !== null && Number(existingBonus.uang_makan) > 0)
          ? Number(existingBonus.uang_makan)
          : (hariMakan * tarifMakan);
        const a = existingBonus ? Number(existingBonus.komponen_absensi || 0) : 0;
        const k = existingBonus ? Number(existingBonus.komponen_kpi || 0) : 0;
        const l = existingBonus ? Number(existingBonus.komponen_lainnya || 0) : 0;
        const totBonus = a + k + l;
        const totalTransfer = g + u + totBonus;

        const payload = {
          pegawai_id: targetId,
          bulan: filterBulan,
          tahun: filterTahun,
          gaji_pokok: g,
          uang_makan: u,
          hari_uang_makan: hariMakan,
          tarif_uang_makan: tarifMakan,
          komponen_absensi: a,
          komponen_kpi: k,
          komponen_lainnya: l,
          total_bonus: totBonus,
          total_gaji_transfer: totalTransfer,
          status_bayar: targetStatus,
          tanggal_bayar: targetStatus === 'DIBAYAR' ? UI.hariIni() : null,
          catatan: existingBonus?.catatan || null,
          nomor_slip: existingBonus?.nomor_slip || `SLP/LMU/${filterTahun}${String(filterBulan).padStart(2, '0')}/${targetId.slice(0, 6).toUpperCase()}`
        };

        try {
          await DB.bonusSimpan(payload, existingBonus?.id || null);
          UI.toast(targetStatus === 'DIBAYAR' ? `Status transfer gaji ${peg.nama} ditandai sudah ditransfer!` : `Status transfer ${peg.nama} dikembalikan ke draft.`, 'ok');
          await muatUlangMaster();
        } catch (err) {
          UI.toast('Gagal memperbarui status transfer: ' + err.message, 'err');
        }
      });
    });
  }

  /* Modal Atur Tarif Standar Insentif Aktivitas Tindakan Sistem */
  function dialogAturTarifInsentif() {
    const tarifSekarang = tarifInsentif || { tarif_lab: 4000, tarif_pendaftaran: 2000, tarif_surat: 2500, tarif_kasir: 1000 };
    UI.modal({
      judul: 'Pengaturan Tarif Insentif Tindakan & Kontribusi Sistem',
      lebar: true,
      isi: `
        <div class="absensi-banner-box mb-16" style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 12px 16px; border-radius: 8px;">
          <div style="font-size: 13px; color: #166534; font-weight: 700;">
            Dasar Perhitungan Insentif Tindakan Karyawan
          </div>
          <div style="font-size: 12px; color: #334155; margin-top: 4px; line-height: 1.5;">
            Sistem secara otomatis membaca log riil staf (audit trail) untuk 4 aktivitas operasional. Tarif per tindakan di bawah ini digunakan sebagai rekomendasi kalkulator insentif. Pimpinan tetap <b>100% bebas mengubah nominal</b> penggajian secara manual kapan saja.
          </div>
        </div>

        <form id="formTarifInsentifModal" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="field" style="margin: 0;">
              <label style="font-weight: 700; color: #0F172A;">1. Verifikasi Hasil Lab (per Pasien/Pemeriksaan) <span class="req">*</span></label>
              <div style="position: relative; display: flex; align-items: center;">
                <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none;">Rp</span>
                <input type="text" inputmode="numeric" name="tarif_lab"
                       value="${UI.formatRibuan(tarifSekarang.tarif_lab || 4000)}"
                       class="w-full mono input-rupiah" required
                       style="padding-left: 42px; height: 40px; font-weight: 700; font-size: 15px; color: #0F172A; border-radius: 8px;">
              </div>
              <div class="hint text-xs text-muted mt-2">Diberikan saat staf menyelesaikan & memverifikasi hasil lab.</div>
            </div>

            <div class="field" style="margin: 0;">
              <label style="font-weight: 700; color: #0F172A;">2. Pendaftaran Pasien Kunjungan <span class="req">*</span></label>
              <div style="position: relative; display: flex; align-items: center;">
                <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none;">Rp</span>
                <input type="text" inputmode="numeric" name="tarif_pendaftaran"
                       value="${UI.formatRibuan(tarifSekarang.tarif_pendaftaran || 2000)}"
                       class="w-full mono input-rupiah" required
                       style="padding-left: 42px; height: 40px; font-weight: 700; font-size: 15px; color: #0F172A; border-radius: 8px;">
              </div>
              <div class="hint text-xs text-muted mt-2">Diberikan saat staf mendaftarkan pasien ke antrean sistem.</div>
            </div>

            <div class="field" style="margin: 0;">
              <label style="font-weight: 700; color: #0F172A;">3. Pembuatan Surat Keterangan Lab <span class="req">*</span></label>
              <div style="position: relative; display: flex; align-items: center;">
                <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none;">Rp</span>
                <input type="text" inputmode="numeric" name="tarif_surat"
                       value="${UI.formatRibuan(tarifSekarang.tarif_surat || 2500)}"
                       class="w-full mono input-rupiah" required
                       style="padding-left: 42px; height: 40px; font-weight: 700; font-size: 15px; color: #0F172A; border-radius: 8px;">
              </div>
              <div class="hint text-xs text-muted mt-2">Diberikan saat staf menerbitkan surat keterangan resmi.</div>
            </div>

            <div class="field" style="margin: 0;">
              <label style="font-weight: 700; color: #0F172A;">4. Transaksi Pembayaran Kasir <span class="req">*</span></label>
              <div style="position: relative; display: flex; align-items: center;">
                <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none;">Rp</span>
                <input type="text" inputmode="numeric" name="tarif_kasir"
                       value="${UI.formatRibuan(tarifSekarang.tarif_kasir || 1000)}"
                       class="w-full mono input-rupiah" required
                       style="padding-left: 42px; height: 40px; font-weight: 700; font-size: 15px; color: #0F172A; border-radius: 8px;">
              </div>
              <div class="hint text-xs text-muted mt-2">Diberikan saat staf memproses pembayaran dan kuitansi pasien.</div>
            </div>
          </div>
        </form>
      `,
      siap: (badan) => {
        badan.querySelectorAll('.input-rupiah').forEach(inp => {
          inp.addEventListener('focus', () => inp.select());
          inp.addEventListener('input', () => {
            const raw = String(inp.value || '').replace(/\D/g, '');
            const num = Number(raw) || 0;
            inp.value = num === 0 ? '0' : num.toLocaleString('id-ID');
          });
        });
      },
      tombol: [
        { teks: 'Batal', nilai: false },
        {
          teks: 'Simpan Tarif Insentif',
          kelas: 'btn-primary',
          aksi: async (badan) => {
            const form = badan.querySelector('#formTarifInsentifModal');
            const lab = Number(String(form.tarif_lab.value).replace(/\D/g, '')) || 0;
            const pendaftaran = Number(String(form.tarif_pendaftaran.value).replace(/\D/g, '')) || 0;
            const surat = Number(String(form.tarif_surat.value).replace(/\D/g, '')) || 0;
            const kasir = Number(String(form.tarif_kasir.value).replace(/\D/g, '')) || 0;

            const payload = {
              tarif_lab: lab,
              tarif_pendaftaran: pendaftaran,
              tarif_surat: surat,
              tarif_kasir: kasir
            };

            try {
              tarifInsentif = payload;
              if (DB.simpanPengaturanInsentifAktivitas) {
                await DB.simpanPengaturanInsentifAktivitas(payload);
              }
              UI.toast('Tarif insentif tindakan berhasil disimpan!', 'ok');
              await muatUlangMaster();
              return true;
            } catch (e) {
              UI.toast('Gagal menyimpan tarif insentif: ' + e.message, 'err');
              return false;
            }
          }
        }
      ]
    });
  }

  /* Modal Atur Tarif Standar Uang Makan Harian */
  function dialogAturTarifUangMakan() {
    const tarifSekarang = Number(jamKerja.tarif_uang_makan || 20000);
    UI.modal({
      judul: 'Pengaturan Tarif Standar Uang Makan',
      isi: `
        <div class="absensi-banner-box mb-16" style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 12px 16px; border-radius: 8px;">
          <div style="font-size: 13px; color: #166534; font-weight: 700;">
            Kriteria Perhitungan Uang Makan Karyawan
          </div>
          <div style="font-size: 12px; color: #334155; margin-top: 4px; line-height: 1.5;">
            Uang makan dihitung otomatis <b>1 kali</b> per kehadiran apabila karyawan absen <b>datang (masuk) DAN pulang</b> secara lengkap.
          </div>
        </div>

        <form id="formTarifMakanModal">
          <div class="field">
            <label style="font-weight: 700; color: #0F172A;">Tarif Uang Makan per Kehadiran Lengkap <span class="req">*</span></label>
            <div style="position: relative; display: flex; align-items: center;">
              <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none;">Rp</span>
              <input type="text" inputmode="numeric" id="inputTarifMakan"
                     value="${UI.formatRibuan(tarifSekarang)}"
                     class="w-full mono input-rupiah"
                     required
                     style="padding-left: 42px; height: 42px; font-weight: 700; font-size: 16px; color: #0F172A; border-radius: 8px;">
            </div>
            <div class="hint text-xs text-muted mt-4">Standar operasional lab: Rp 20.000 atau Rp 25.000 per kehadiran lengkap.</div>
          </div>
        </form>
      `,
      siap: (badan) => {
        const inp = badan.querySelector('#inputTarifMakan');
        if (inp) {
          inp.addEventListener('focus', () => inp.select());
          inp.addEventListener('input', () => {
            const raw = String(inp.value || '').replace(/\D/g, '');
            const num = Number(raw) || 0;
            inp.value = num === 0 ? '0' : num.toLocaleString('id-ID');
          });
        }
      },
      tombol: [
        { teks: 'Batal', nilai: false },
        {
          teks: 'Simpan Tarif Uang Makan',
          kelas: 'btn-primary',
          aksi: async (badan) => {
            const inp = badan.querySelector('#inputTarifMakan');
            const tarifBaru = Number(String(inp.value).replace(/\D/g, '')) || 20000;
            try {
              jamKerja.tarif_uang_makan = tarifBaru;
              await DB.simpanPengaturanJamKerja({ ...jamKerja, tarif_uang_makan: tarifBaru });
              UI.toast(`Tarif uang makan berhasil disimpan (${UI.rupiah(tarifBaru)} / kehadiran)!`, 'ok');
              await muatUlangMaster();
              return true;
            } catch (e) {
              UI.toast('Gagal menyimpan tarif: ' + e.message, 'err');
              return false;
            }
          }
        }
      ]
    });
  }

  /* Modal Input / Sesuaikan Penggajian & Bonus oleh Pimpinan */
  function dialogInputBonus(pegawaiAwal = null, bonusAwal = null) {
    let peg = pegawaiAwal || dataPegawai[0] || null;
    if (!peg) {
      UI.toast('Belum ada data pegawai aktif yang terdaftar.', 'warn');
      return;
    }
    let b = bonusAwal || dataBonus.find(x => x.pegawai_id === peg.id) || null;
    let rekap = hitungRekapPerPegawai(peg.id);
    let kontribusi = hitungKontribusiPegawai(peg.id);

    const tarifDefault = Number(b?.tarif_uang_makan || jamKerja.tarif_uang_makan || 20000);
    const hariMakanAwal = (b?.hari_uang_makan !== undefined && b?.hari_uang_makan !== null) ? Number(b.hari_uang_makan) : rekap.hadirLengkapMakan;
    const nominalMakanAwal = (b?.uang_makan !== undefined && b?.uang_makan !== null && Number(b.uang_makan) > 0) ? Number(b.uang_makan) : (hariMakanAwal * tarifDefault);

    UI.modal({
      judul: `Penetapan Penggajian & Bonus: ${UI.esc(peg.nama)}`,
      lebar: true,
      isi: `
        <!-- Datalist Bank Umum Indonesia -->
        <datalist id="listBankUmum">
          <option value="BCA">
          <option value="BRI">
          <option value="Mandiri">
          <option value="BNI">
          <option value="BSI (Bank Syariah Indonesia)">
          <option value="Bank Jateng">
          <option value="CIMB Niaga">
          <option value="BTN">
          <option value="Permata">
          <option value="Danamon">
        </datalist>

        <!-- Pilih Karyawan Jika Lebih Dari 1 -->
        <div class="field mb-16">
          <label>Pilih Karyawan yang Diberikan Penggajian / Bonus <span class="req">*</span></label>
          <select id="modalSelectPegawaiBonus" class="w-full" style="height: 40px; font-weight: 700; font-size: 14px;">
            ${dataPegawai.map(p => `
              <option value="${p.id}" ${p.id === peg.id ? 'selected' : ''}>
                ${UI.esc(p.nama)} (${labelRole(p.peran)})
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Rekap Presensi & Masa Kerja Periode Ini -->
        <div id="modalBoxRekapPresensi" class="absensi-banner-box mb-16" style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px 18px; border-radius: 10px;">
          <div>
            <div style="font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase;">
              Rekapitulasi Kehadiran Bulan Ini (${NAMA_BULAN[filterBulan - 1]} ${filterTahun}):
            </div>
            <div class="flex items-center gap-14 mt-6 text-xs flex-wrap" style="color: #0F172A;">
              <span>Masa Kerja: <b id="mRekapMasaKerja" style="color: #1D4ED8;">${hitungLamaBekerja(peg.tgl_mulai_kerja)?.teks || 'Belum diatur'}</b></span>
              <span>Total Hadir: <b id="mRekapHadir">${rekap.hadir} hari</b></span>
              <span>Hadir Lengkap (Masuk & Pulang): <b id="mRekapLengkap" style="color: #0F8B7E;">${rekap.hadirLengkapMakan} hari</b></span>
              <span>Tepat Waktu: <b id="mRekapTepat" style="color:var(--ok-700);">${rekap.tepatWaktu} hari</b></span>
              <span>Terlambat: <b id="mRekapTelat" style="color:var(--danger-700);">${rekap.terlambat} kali (${rekap.totalMenitTelat} mnt)</b></span>
              <span>Izin / Cuti: <b id="mRekapIzin">${rekap.izinCuti} hari</b></span>
              <span>Disiplin: <b id="mRekapDisiplin" class="badge b-selesai" style="font-size:11px;">${rekap.disiplinPersen}%</b></span>
            </div>
          </div>
        </div>

        <form id="formBonusModal" style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
          
          <!-- BAGIAN 1: REKENING BANK KARYAWAN (TRANSFER MANUAL) -->
          <div style="background: #F0F9FF; border: 1.5px solid #BAE6FD; border-radius: 10px; padding: 14px 16px;">
            <div class="flex items-center justify-between mb-8">
              <div style="font-size: 12px; font-weight: 800; color: #0369A1; text-transform: uppercase; letter-spacing: 0.5px;">
                ${UI.ikon('faskes', 14)} Rekening Bank Karyawan (Tujuan Transfer Manual)
              </div>
              <span class="text-xs text-muted">Akan tersimpan ke profil staf</span>
            </div>
            <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
              <div class="field" style="margin: 0;">
                <label style="font-size: 11px; font-weight: 700; color: #0F172A;">Nama Bank</label>
                <input type="text" name="nama_bank" list="listBankUmum" value="${UI.esc(peg.nama_bank || '')}" 
                       placeholder="Contoh: BCA / BRI / Mandiri" class="w-full" style="height: 38px; font-weight: 600; font-size: 13px;">
              </div>
              <div class="field" style="margin: 0;">
                <label style="font-size: 11px; font-weight: 700; color: #0F172A;">Nomor Rekening</label>
                <input type="text" inputmode="numeric" name="nomor_rekening" value="${UI.esc(peg.nomor_rekening || '')}" 
                       placeholder="Contoh: 1234567890" class="w-full mono font-bold" style="height: 38px; font-size: 13.5px; color: #0F172A;">
              </div>
              <div class="field" style="margin: 0;">
                <label style="font-size: 11px; font-weight: 700; color: #0F172A;">Atas Nama Rekening</label>
                <input type="text" name="atas_nama_rekening" value="${UI.esc(peg.atas_nama_rekening || peg.nama || '')}" 
                       placeholder="Nama di buku rekening" class="w-full" style="height: 38px; font-size: 13px;">
              </div>
            </div>
          </div>

          <!-- BAGIAN 2: GAJI POKOK -->
          <div class="field">
            <label style="font-weight: 700; color: #0F172A;">Gaji Pokok / Tunjangan Tetap Bulanan <span class="text-muted text-xs font-normal">(Opsional)</span></label>
            <div style="position: relative; display: flex; align-items: center;">
              <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none; user-select: none;">Rp</span>
              <input type="text" inputmode="numeric" name="gaji_pokok" 
                     value="${UI.formatRibuan(b?.gaji_pokok ?? 0)}" 
                     class="w-full mono input-rupiah" 
                     placeholder="0"
                     style="padding-left: 42px; height: 42px; font-weight: 700; font-size: 15.5px; color: #0F172A; border-radius: 8px;">
            </div>
            <div class="live-terbilang text-xs mt-4" style="font-weight: 600;"></div>
            <div class="hint text-xs text-muted mt-2">Gaji pokok dasar staf untuk tugas operasional laboratorium.</div>
          </div>

          <!-- BAGIAN 3: UANG MAKAN OTOMATIS (HADIR LENGKAP MASUK & PULANG) -->
          <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 10px; padding: 14px 16px;">
            <div class="flex items-center justify-between mb-8">
              <div style="font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
                ${UI.ikon('jam', 14)} Uang Makan Kehadiran (Masuk & Pulang Lengkap)
              </div>
              <span class="badge b-selesai" style="font-size: 11px;">
                Tercatat Hadir Lengkap: <b id="badgeHariMakanModal">${hariMakanAwal} hari</b>
              </span>
            </div>
            <input type="hidden" name="hari_uang_makan" value="${hariMakanAwal}">

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="field" style="margin: 0;">
                <label style="font-size: 11.5px; font-weight: 700; color: #0F172A;">Tarif per Hari Kehadiran Lengkap</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <span style="position: absolute; left: 10px; font-weight: 700; color: #64748B; font-size: 13px; pointer-events: none;">Rp</span>
                  <input type="text" inputmode="numeric" name="tarif_uang_makan" 
                         value="${UI.formatRibuan(tarifDefault)}" 
                         class="w-full mono input-rupiah" 
                         style="padding-left: 36px; height: 38px; font-weight: 700; font-size: 14px;">
                </div>
                <div class="hint text-xs text-muted mt-2">Dapat disesuaikan khusus karyawan ini.</div>
              </div>

              <div class="field" style="margin: 0;">
                <label style="font-size: 11.5px; font-weight: 700; color: #166534;">Total Uang Makan Bulan Ini</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <span style="position: absolute; left: 10px; font-weight: 800; color: #166534; font-size: 13px; pointer-events: none;">Rp</span>
                  <input type="text" inputmode="numeric" name="uang_makan" 
                         value="${UI.formatRibuan(nominalMakanAwal)}" 
                         class="w-full mono input-rupiah" 
                         style="padding-left: 36px; height: 38px; font-weight: 800; font-size: 15px; color: #166534; background: #fff;">
                </div>
                <div class="hint text-xs text-muted mt-2">Dihitung otomatis: <span id="hintRumusMakan">${hariMakanAwal} hari x Rp ${UI.formatRibuan(tarifDefault)}</span></div>
              </div>
            </div>
          </div>

          <!-- BAGIAN REKOMENDASI INSENTIF BERBASIS KONTRIBUSI AKTIVITAS SISTEM -->
          <div id="modalBoxKontribusiAktivitas" style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 10px; padding: 14px 16px;">
            <div class="flex items-center justify-between mb-8 flex-wrap gap-8">
              <div style="font-size: 12px; font-weight: 800; color: #1E293B; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                ${UI.ikon('laporan', 15)} Rekomendasi Insentif Berbasis Kontribusi Aktivitas Sistem
              </div>
              <button type="button" id="btnTerapkanInsentif" class="btn btn-secondary" style="height: 32px; font-size: 12px; font-weight: 700; padding: 0 12px; border-color: #0F8B7E; color: #0F8B7E; background: #F0FDF4; display: inline-flex; align-items: center; gap: 6px;">
                ${UI.ikon('cek', 13)} Terapkan Insentif ke Form Bonus
              </button>
            </div>
            
            <div style="font-size: 12px; color: #475569; margin-bottom: 10px; line-height: 1.4;">
              Sistem merekam 4 aktivitas operasional riil staf periode ini. Klik <b>Terapkan Insentif</b> untuk memasukkan rekomendasi ke kolom bonus, atau pimpinan tetap <b>100% bebas mengetik angka manual</b> pada kolom di bawah.
            </div>

            <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">
              <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px;">
                <div style="font-size: 11px; color: #64748B; font-weight: 600;">Verifikasi Hasil Lab</div>
                <div id="mKontribusiLab" class="mono" style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 2px;">
                  ${kontribusi.jmlLab} tindakan
                </div>
                <div id="mSubtotalLab" class="text-xs text-muted" style="margin-top: 2px;">
                  @ ${UI.rupiah(kontribusi.tarif.tarif_lab)} = <b style="color: #0F766E;">${UI.rupiah(kontribusi.nominalLab)}</b>
                </div>
              </div>

              <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px;">
                <div style="font-size: 11px; color: #64748B; font-weight: 600;">Pendaftaran Pasien</div>
                <div id="mKontribusiDaftar" class="mono" style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 2px;">
                  ${kontribusi.jmlDaftar} pasien
                </div>
                <div id="mSubtotalDaftar" class="text-xs text-muted" style="margin-top: 2px;">
                  @ ${UI.rupiah(kontribusi.tarif.tarif_pendaftaran)} = <b style="color: #0F766E;">${UI.rupiah(kontribusi.nominalDaftar)}</b>
                </div>
              </div>

              <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px;">
                <div style="font-size: 11px; color: #64748B; font-weight: 600;">Pembuatan Surat</div>
                <div id="mKontribusiSurat" class="mono" style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 2px;">
                  ${kontribusi.jmlSurat} surat
                </div>
                <div id="mSubtotalSurat" class="text-xs text-muted" style="margin-top: 2px;">
                  @ ${UI.rupiah(kontribusi.tarif.tarif_surat)} = <b style="color: #0F766E;">${UI.rupiah(kontribusi.nominalSurat)}</b>
                </div>
              </div>

              <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px;">
                <div style="font-size: 11px; color: #64748B; font-weight: 600;">Transaksi Kasir</div>
                <div id="mKontribusiKasir" class="mono" style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 2px;">
                  ${kontribusi.jmlKasir} transaksi
                </div>
                <div id="mSubtotalKasir" class="text-xs text-muted" style="margin-top: 2px;">
                  @ ${UI.rupiah(kontribusi.tarif.tarif_kasir)} = <b style="color: #0F766E;">${UI.rupiah(kontribusi.nominalKasir)}</b>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between mt-10 pt-8 flex-wrap gap-8" style="border-top: 1px dashed #CBD5E1;">
              <div style="font-size: 12px; color: #334155;">
                Total Aktivitas Tercatat: <b id="mTotalTindakan">${kontribusi.totalTindakan} tindakan</b>
              </div>
              <div style="font-size: 13.5px; font-weight: 800; color: #0F766E;">
                Total Rekomendasi Insentif: <span id="mTotalInsentifRupiah" class="mono">${UI.rupiah(kontribusi.totalNominal)}</span>
              </div>
            </div>
          </div>

          <!-- BAGIAN 4: BONUS KARYAWAN -->
          <div class="field">
            <label style="font-weight: 700; color: #0F172A;">1. Bonus Kehadiran & Kedisiplinan Kerja <span class="req">*</span></label>
            <div style="position: relative; display: flex; align-items: center;">
              <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none; user-select: none;">Rp</span>
              <input type="text" inputmode="numeric" name="komponen_absensi" 
                     value="${UI.formatRibuan(b?.komponen_absensi ?? 0)}" 
                     required class="w-full mono input-rupiah" 
                     placeholder="0"
                     style="padding-left: 42px; height: 42px; font-weight: 700; font-size: 15.5px; color: #0F172A; border-radius: 8px;">
            </div>
            <div class="live-terbilang text-xs mt-4" style="font-weight: 600;"></div>
            <div class="hint text-xs text-muted mt-2">Apresiasi atas kehadiran tepat waktu dan kepatuhan jam kerja operasional lab.</div>
          </div>

          <div class="field">
            <label style="font-weight: 700; color: #0F172A;">2. Apresiasi Kinerja Pimpinan / Produktivitas Lab <span class="req">*</span></label>
            <div style="position: relative; display: flex; align-items: center;">
              <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none; user-select: none;">Rp</span>
              <input type="text" inputmode="numeric" name="komponen_kpi" 
                     value="${UI.formatRibuan(b?.komponen_kpi ?? 0)}" 
                     required class="w-full mono input-rupiah" 
                     placeholder="0"
                     style="padding-left: 42px; height: 42px; font-weight: 700; font-size: 15.5px; color: #0F172A; border-radius: 8px;">
            </div>
            <div class="live-terbilang text-xs mt-4" style="font-weight: 600;"></div>
            <div class="hint text-xs text-muted mt-2">Apresiasi mutu analisis laboratorium, ketelitian pengujian sampel, dan kepuasan pasien.</div>
          </div>

          <div class="field">
            <label style="font-weight: 700; color: #0F172A;">3. Insentif Tambahan / Tunjangan Khusus <span class="text-muted text-xs font-normal">(Opsional)</span></label>
            <div style="position: relative; display: flex; align-items: center;">
              <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none; user-select: none;">Rp</span>
              <input type="text" inputmode="numeric" name="komponen_lainnya" 
                     value="${UI.formatRibuan(b?.komponen_lainnya ?? 0)}" 
                     class="w-full mono input-rupiah" 
                     placeholder="0"
                     style="padding-left: 42px; height: 42px; font-weight: 700; font-size: 15.5px; color: #0F172A; border-radius: 8px;">
            </div>
            <div class="live-terbilang text-xs mt-4" style="font-weight: 600;"></div>
            <div class="hint text-xs text-muted mt-2">Insentif lembur atau tunjangan khusus tambahan langsung dari pimpinan.</div>
          </div>

          <!-- Live Kalkulator Ringkasan Real-Time: Gaji + Uang Makan + Bonus -->
          <div id="modalBoxKalkulasiBonus" style="background: #F0FDF4; border: 2px solid #86EFAC; border-radius: 12px; padding: 16px 18px; margin: 6px 0;">
            <div style="font-size: 12px; font-weight: 800; color: #166534; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${UI.ikon('cek', 14)} Ringkasan Rincian Penggajian Real-Time
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 12px;">
              <div style="background: #ffffff; padding: 10px 12px; border-radius: 8px; border: 1px solid #BBF7D0;">
                <div style="font-size: 11px; color: #64748B; font-weight: 600;">Total Uang Makan</div>
                <div id="liveTotalMakan" class="mono" style="font-size: 15px; font-weight: 800; color: #0F766E; margin-top: 2px;">Rp 0</div>
              </div>
              <div style="background: #ffffff; padding: 10px 12px; border-radius: 8px; border: 1px solid #BBF7D0;">
                <div style="font-size: 11px; color: #64748B; font-weight: 600;">Total Bonus (1+2+3)</div>
                <div id="liveTotalBonus" class="mono" style="font-size: 15px; font-weight: 800; color: #15803D; margin-top: 2px;">Rp 0</div>
              </div>
              <div style="background: #ECFDF5; padding: 10px 14px; border-radius: 8px; border: 1.5px solid #86EFAC;">
                <div style="font-size: 11px; color: #065F46; font-weight: 800; text-transform: uppercase;">Total Ditransfer (Gaji + Makan + Bonus)</div>
                <div id="liveTotalPenerimaan" class="mono" style="font-size: 18px; font-weight: 900; color: #064E3B; margin-top: 2px;">Rp 0</div>
              </div>
            </div>
            <div id="liveTerbilangTransfer" class="mt-8 text-xs font-semibold" style="color: #166534; font-style: italic;"></div>
          </div>

          <div class="field">
            <label style="font-weight: 700; color: #0F172A;">Status Pencairan / Transfer Manual <span class="req">*</span></label>
            <select name="status_bayar" required class="w-full" style="height: 40px; font-weight: 600;">
              <option value="BELUM" ${(!b || b.status_bayar === 'BELUM') ? 'selected' : ''}>Belum Ditransfer (Draft Evaluasi)</option>
              <option value="DIBAYAR" ${b?.status_bayar === 'DIBAYAR' ? 'selected' : ''}>Sudah Ditransfer ke Rekening Karyawan</option>
            </select>
          </div>

          <div class="field">
            <label style="font-weight: 700; color: #0F172A;">Pesan & Kata Motivasi Pimpinan (Ibu Dede Kurniasih)</label>
            <textarea name="catatan" rows="3" class="w-full" style="padding: 10px 12px; font-size: 13px;" placeholder="Tuliskan kata motivasi atau memo apresiasi untuk karyawan ini...">${UI.esc(b?.catatan || '')}</textarea>
            <div class="hint text-xs text-muted mt-2">Pesan ini akan tampil di dashboard karyawan dan tertera pada slip resmi.</div>
          </div>
        </form>
      `,
      siap: (badan) => {
        const form = badan.querySelector('#formBonusModal');

        function hitungLive() {
          if (!form) return;
          const g = Number(String(form.gaji_pokok.value).replace(/\D/g, '')) || 0;
          const u = Number(String(form.uang_makan.value).replace(/\D/g, '')) || 0;
          const a = Number(String(form.komponen_absensi.value).replace(/\D/g, '')) || 0;
          const k = Number(String(form.komponen_kpi.value).replace(/\D/g, '')) || 0;
          const l = Number(String(form.komponen_lainnya.value).replace(/\D/g, '')) || 0;
          const totBonus = a + k + l;
          const totTransfer = g + u + totBonus;

          const elMakan = badan.querySelector('#liveTotalMakan');
          const elBonus = badan.querySelector('#liveTotalBonus');
          const elTransfer = badan.querySelector('#liveTotalPenerimaan');
          const elTerbilang = badan.querySelector('#liveTerbilangTransfer');

          if (elMakan) elMakan.textContent = UI.rupiah(u);
          if (elBonus) elBonus.textContent = UI.rupiah(totBonus);
          if (elTransfer) elTransfer.textContent = UI.rupiah(totTransfer);
          if (elTerbilang) {
            elTerbilang.textContent = totTransfer > 0 ? `Terbilang: ${UI.terbilang(totTransfer)}` : '';
          }
        }

        function formatRupiahInput(input) {
          const raw = String(input.value || '').replace(/\D/g, '');
          const num = Number(raw) || 0;
          input.value = num === 0 ? '0' : num.toLocaleString('id-ID');

          const container = input.closest('.field');
          const terbilangEl = container ? container.querySelector('.live-terbilang') : null;
          if (terbilangEl) {
            if (num === 0) {
              terbilangEl.innerHTML = `<span style="color: #94A3B8;">Rp 0 (Nol Rupiah)</span>`;
            } else {
              terbilangEl.innerHTML = `<span style="color: #0F8B7E;">${UI.ikon('cek', 12)} <b>${UI.rupiah(num)}</b></span> <span style="color: #334155; font-weight: 500;">(${UI.terbilang(num)})</span>`;
            }
          }
          hitungLive();
        }

        // Listener perubahan tarif makan harian -> kalkulasi ulang uang makan otomatis
        form.tarif_uang_makan?.addEventListener('input', () => {
          const tarif = Number(String(form.tarif_uang_makan.value).replace(/\D/g, '')) || 0;
          const hari = Number(form.hari_uang_makan.value) || 0;
          const hasilMakan = hari * tarif;
          form.uang_makan.value = hasilMakan === 0 ? '0' : hasilMakan.toLocaleString('id-ID');
          const hint = badan.querySelector('#hintRumusMakan');
          if (hint) hint.textContent = `${hari} hari x Rp ${UI.formatRibuan(tarif)}`;
          hitungLive();
        });

        badan.querySelectorAll('.input-rupiah').forEach(inp => {
          inp.addEventListener('focus', () => {
            if (inp.value === '0' || inp.value === 'Rp 0') {
              inp.select();
            }
          });
          inp.addEventListener('input', () => {
            formatRupiahInput(inp);
          });
          formatRupiahInput(inp);
        });

        const btnTerapkan = badan.querySelector('#btnTerapkanInsentif');
        btnTerapkan?.addEventListener('click', () => {
          const targetPegId = badan.querySelector('#modalSelectPegawaiBonus')?.value || peg.id;
          const kont = hitungKontribusiPegawai(targetPegId);

          form.komponen_kpi.value = kont.totalNominal === 0 ? '0' : kont.totalNominal.toLocaleString('id-ID');
          formatRupiahInput(form.komponen_kpi);
          hitungLive();
          UI.toast(`Insentif kontribusi (${UI.rupiah(kont.totalNominal)}) diterapkan ke kolom Apresiasi Kinerja / Produktivitas! Pimpinan tetap dapat mengedit nominal secara bebas.`, 'ok');
        });

        const sel = badan.querySelector('#modalSelectPegawaiBonus');
        if (!sel) return;
        sel.addEventListener('change', (e) => {
          const idDipilih = e.target.value;
          const pBaru = dataPegawai.find(x => x.id === idDipilih);
          if (!pBaru) return;
          const bBaru = dataBonus.find(x => x.pegawai_id === idDipilih) || null;
          const rBaru = hitungRekapPerPegawai(idDipilih);
          const mkBaru = hitungLamaBekerja(pBaru.tgl_mulai_kerja);
          const kBaru = hitungKontribusiPegawai(idDipilih);

          const elMk = badan.querySelector('#mRekapMasaKerja');
          if (elMk) elMk.textContent = mkBaru ? mkBaru.teks : 'Belum diatur';

          badan.querySelector('#mRekapHadir').textContent = `${rBaru.hadir} hari`;
          badan.querySelector('#mRekapLengkap').textContent = `${rBaru.hadirLengkapMakan} hari`;
          badan.querySelector('#mRekapTepat').textContent = `${rBaru.tepatWaktu} hari`;
          badan.querySelector('#mRekapTelat').textContent = `${rBaru.terlambat} kali (${rBaru.totalMenitTelat} menit)`;
          badan.querySelector('#mRekapIzin').textContent = `${rBaru.izinCuti} hari`;
          badan.querySelector('#mRekapDisiplin').textContent = `${rBaru.disiplinPersen}%`;

          // Perbarui tampilan rincian kontribusi aktivitas sistem
          const elLab = badan.querySelector('#mKontribusiLab');
          if (elLab) elLab.textContent = `${kBaru.jmlLab} tindakan`;
          const elSubLab = badan.querySelector('#mSubtotalLab');
          if (elSubLab) elSubLab.innerHTML = `@ ${UI.rupiah(kBaru.tarif.tarif_lab)} = <b style="color: #0F766E;">${UI.rupiah(kBaru.nominalLab)}</b>`;

          const elDaftar = badan.querySelector('#mKontribusiDaftar');
          if (elDaftar) elDaftar.textContent = `${kBaru.jmlDaftar} pasien`;
          const elSubDaftar = badan.querySelector('#mSubtotalDaftar');
          if (elSubDaftar) elSubDaftar.innerHTML = `@ ${UI.rupiah(kBaru.tarif.tarif_pendaftaran)} = <b style="color: #0F766E;">${UI.rupiah(kBaru.nominalDaftar)}</b>`;

          const elSurat = badan.querySelector('#mKontribusiSurat');
          if (elSurat) elSurat.textContent = `${kBaru.jmlSurat} surat`;
          const elSubSurat = badan.querySelector('#mSubtotalSurat');
          if (elSubSurat) elSubSurat.innerHTML = `@ ${UI.rupiah(kBaru.tarif.tarif_surat)} = <b style="color: #0F766E;">${UI.rupiah(kBaru.nominalSurat)}</b>`;

          const elKasir = badan.querySelector('#mKontribusiKasir');
          if (elKasir) elKasir.textContent = `${kBaru.jmlKasir} transaksi`;
          const elSubKasir = badan.querySelector('#mSubtotalKasir');
          if (elSubKasir) elSubKasir.innerHTML = `@ ${UI.rupiah(kBaru.tarif.tarif_kasir)} = <b style="color: #0F766E;">${UI.rupiah(kBaru.nominalKasir)}</b>`;

          const elTotTindakan = badan.querySelector('#mTotalTindakan');
          if (elTotTindakan) elTotTindakan.textContent = `${kBaru.totalTindakan} tindakan`;
          const elTotInsentif = badan.querySelector('#mTotalInsentifRupiah');
          if (elTotInsentif) elTotInsentif.textContent = UI.rupiah(kBaru.totalNominal);

          const tBaru = Number(bBaru?.tarif_uang_makan || jamKerja.tarif_uang_makan || 20000);
          const hBaru = (bBaru?.hari_uang_makan !== undefined && bBaru?.hari_uang_makan !== null) ? Number(bBaru.hari_uang_makan) : rBaru.hadirLengkapMakan;
          const uBaru = (bBaru?.uang_makan !== undefined && bBaru?.uang_makan !== null && Number(bBaru.uang_makan) > 0) ? Number(bBaru.uang_makan) : (hBaru * tBaru);

          badan.querySelector('#badgeHariMakanModal').textContent = `${hBaru} hari`;
          badan.querySelector('#hintRumusMakan').textContent = `${hBaru} hari x Rp ${UI.formatRibuan(tBaru)}`;

          if (form) {
            form.nama_bank.value = pBaru.nama_bank || '';
            form.nomor_rekening.value = pBaru.nomor_rekening || '';
            form.atas_nama_rekening.value = pBaru.atas_nama_rekening || pBaru.nama || '';

            form.gaji_pokok.value = UI.formatRibuan(bBaru?.gaji_pokok ?? 0);
            form.hari_uang_makan.value = hBaru;
            form.tarif_uang_makan.value = UI.formatRibuan(tBaru);
            form.uang_makan.value = UI.formatRibuan(uBaru);
            form.komponen_absensi.value = UI.formatRibuan(bBaru?.komponen_absensi ?? 0);
            form.komponen_kpi.value = UI.formatRibuan(bBaru?.komponen_kpi ?? 0);
            form.komponen_lainnya.value = UI.formatRibuan(bBaru?.komponen_lainnya ?? 0);
            form.status_bayar.value = bBaru?.status_bayar || 'BELUM';
            form.catatan.value = bBaru?.catatan || '';
            badan.querySelectorAll('.input-rupiah').forEach(inp => formatRupiahInput(inp));
          }
        });
      },
      tombol: [
        { teks: 'Batal', nilai: false },
        {
          teks: 'Simpan Rincian Penggajian',
          kelas: 'btn-primary',
          aksi: async (modalBody) => {
            const form = modalBody.querySelector('#formBonusModal');
            const selPeg = modalBody.querySelector('#modalSelectPegawaiBonus');
            if (!form.reportValidity()) return false;

            const targetPegId = selPeg ? selPeg.value : peg.id;
            const targetPeg = dataPegawai.find(x => x.id === targetPegId);
            const existingBonus = dataBonus.find(x => x.pegawai_id === targetPegId) || null;
            const rPeg = hitungRekapPerPegawai(targetPegId);

            const g = Number(String(form.gaji_pokok.value).replace(/\D/g, '')) || 0;
            const u = Number(String(form.uang_makan.value).replace(/\D/g, '')) || 0;
            const tarifMakan = Number(String(form.tarif_uang_makan.value).replace(/\D/g, '')) || 20000;
            const hariMakan = Number(form.hari_uang_makan.value) || rPeg.hadirLengkapMakan;
            const a = Number(String(form.komponen_absensi.value).replace(/\D/g, '')) || 0;
            const k = Number(String(form.komponen_kpi.value).replace(/\D/g, '')) || 0;
            const l = Number(String(form.komponen_lainnya.value).replace(/\D/g, '')) || 0;
            const totBonus = a + k + l;
            const totalTransfer = g + u + totBonus;

            // 1. Simpan pembaruan rekening bank pegawai
            try {
              const bankData = {
                nama_bank: form.nama_bank.value.trim(),
                nomor_rekening: form.nomor_rekening.value.trim(),
                atas_nama_rekening: form.atas_nama_rekening.value.trim()
              };
              await DB.simpanRekeningPegawai(targetPegId, bankData);
              if (targetPeg) {
                targetPeg.nama_bank = bankData.nama_bank;
                targetPeg.nomor_rekening = bankData.nomor_rekening;
                targetPeg.atas_nama_rekening = bankData.atas_nama_rekening;
              }
            } catch (errRek) {
              console.warn('Simpan rekening pegawai warning:', errRek);
            }

            // 2. Simpan rincian penggajian & bonus
            const payload = {
              pegawai_id: targetPegId,
              bulan: filterBulan,
              tahun: filterTahun,
              gaji_pokok: g,
              uang_makan: u,
              hari_uang_makan: hariMakan,
              tarif_uang_makan: tarifMakan,
              komponen_absensi: a,
              komponen_kpi: k,
              komponen_lainnya: l,
              total_bonus: totBonus,
              total_gaji_transfer: totalTransfer,
              status_bayar: form.status_bayar.value,
              tanggal_bayar: form.status_bayar.value === 'DIBAYAR' ? (existingBonus?.tanggal_bayar || UI.hariIni()) : null,
              catatan: form.catatan.value.trim() || null,
              nomor_slip: existingBonus?.nomor_slip || `SLP/LMU/${filterTahun}${String(filterBulan).padStart(2, '0')}/${targetPegId.slice(0, 6).toUpperCase()}`
            };

            try {
              await DB.bonusSimpan(payload, existingBonus?.id || null);
              UI.toast(`Rincian penggajian ${targetPeg?.nama || 'karyawan'} berhasil disimpan!`, 'ok');
              await muatUlangMaster();
              return true;
            } catch (e) {
              UI.toast('Gagal menyimpan penggajian: ' + e.message, 'err');
              return false;
            }
          }
        }
      ]
    });
  }

  /* Modal Detail Log Presensi Karyawan */
  function dialogDetailPresensi(pegawai, rekap) {
    const daftar = rekap.daftarHadir || [];
    UI.modal({
      judul: `Riwayat Presensi: ${UI.esc(pegawai.nama)}`,
      lebar: true,
      isi: `
        <div class="mb-16 flex items-center justify-between flex-wrap gap-10" style="background:#F8FAFC; padding:12px 16px; border-radius:8px; border:1px solid #E2E8F0;">
          <div>
            <div style="font-size:12px; color:#64748B;">Karyawan: <b>${UI.esc(pegawai.nama)}</b> (${labelRole(pegawai.peran)})</div>
            <div style="font-size:13px; font-weight:700; color:#0F172A; margin-top:2px;">Periode: ${NAMA_BULAN[filterBulan - 1]} ${filterTahun}</div>
          </div>
          <div class="flex items-center gap-8 text-xs">
            <span class="badge b-selesai">Hadir: ${rekap.hadir} hari</span>
            <span class="badge b-menunggu">Tepat Waktu: ${rekap.tepatWaktu}</span>
            <span class="badge b-danger">Telat: ${rekap.terlambat} (${rekap.totalMenitTelat} mnt)</span>
            <span class="badge b-kajian">Disiplin: ${rekap.disiplinPersen}%</span>
          </div>
        </div>

        ${!daftar.length ? `
          <div class="empty text-center p-24 text-muted" style="border:1px dashed #CBD5E1; border-radius:8px;">
            Belum ada catatan presensi pada periode bulan ini.
          </div>
        ` : `
          <div style="max-height: 380px; overflow-y: auto;">
            <table class="tbl w-full" style="font-size:12px;">
              <thead><tr>
                <th>TANGGAL</th>
                <th>JAM MASUK</th>
                <th>JAM PULANG</th>
                <th>STATUS</th>
                <th>KETERANGAN / LOKASI</th>
              </tr></thead>
              <tbody>
                ${daftar.map(a => {
                  const chk = cekStatusKeterlambatan(a.waktu_masuk, jamKerja.jam_masuk, jamKerja.toleransi_keterlambatan_menit);
                  const jamIn = a.waktu_masuk ? new Date(a.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';
                  const jamOut = a.waktu_keluar ? new Date(a.waktu_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';

                  return `
                    <tr>
                      <td class="mono font-bold">${UI.tglIndo(a.tanggal)}</td>
                      <td class="mono">${jamIn} ${chk?.terlambat ? `<span class="badge b-danger" style="font-size:10px; margin-left:4px;">Telat ${chk.menit} mnt</span>` : ''}</td>
                      <td class="mono">${jamOut}</td>
                      <td>
                        <span class="badge ${a.status === 'HADIR' ? 'b-selesai' : (a.status === 'CUTI' ? 'b-kajian' : 'b-menunggu')}" style="font-size:10.5px;">
                          ${a.status}
                        </span>
                      </td>
                      <td style="color:#64748B;">${UI.esc(a.catatan || a.lokasi_nama || 'Presensi Mandiri')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      `,
      tombol: [{ teks: 'Tutup', nilai: false }]
    });
  }

  /* =====================================================================
     2. MODE KARYAWAN: PORTAL PRIBADI KINERJA & BONUS SAYA
     ===================================================================== */
  async function renderKaryawanView(el, saya) {
    w.innerHTML = `
      <div class="mb-20 flex items-center justify-between flex-wrap gap-16">
        <div style="max-width: 600px;">
          <h1 class="mb-4" style="font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
            Kinerja & Bonus Saya
          </h1>
          <p class="text-muted mb-0" style="font-size: 13.5px; line-height: 1.4;">
            Rekapitulasi kehadiran kerja, penerimaan gaji & bonus, serta memo apresiasi resmi dari Pimpinan Laboratorium.
          </p>
        </div>
        
        <!-- Filter Periode Rapi & Horizontal -->
        <div class="card p-8 flex items-center gap-8" style="background: #fff; border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); flex-shrink: 0; white-space: nowrap;">
          <span class="text-xs text-muted font-bold" style="padding-left: 4px;">Periode:</span>
          <select id="filterBulanKaryawan" class="ctl-sm" style="font-weight: 600; min-width: 120px; height: 34px;">
            ${NAMA_BULAN.map((nama, idx) => `
              <option value="${idx + 1}" ${idx + 1 === filterBulan ? 'selected' : ''}>${nama}</option>
            `).join('')}
          </select>
          <select id="filterTahunKaryawan" class="ctl-sm" style="font-weight: 600; width: 85px; height: 34px;">
            <option value="2025" ${filterTahun === 2025 ? 'selected' : ''}>2025</option>
            <option value="2026" ${filterTahun === 2026 ? 'selected' : ''}>2026</option>
            <option value="2027" ${filterTahun === 2027 ? 'selected' : ''}>2027</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="btnRefreshKaryawan" style="height: 34px; font-weight: 600; padding: 0 12px; display: inline-flex; align-items: center; gap: 6px;">
            ${UI.ikon('ulang', 14)} Muat Ulang
          </button>
        </div>
      </div>

      <!-- Kontainer Utama Dasbor Karyawan -->
      <div id="isiPortalKaryawan">
        ${UI.memuat(4)}
      </div>
    `;

    w.querySelector('#filterBulanKaryawan').addEventListener('change', e => {
      filterBulan = parseInt(e.target.value, 10);
      muatUlangKaryawan(saya);
    });
    w.querySelector('#filterTahunKaryawan').addEventListener('change', e => {
      filterTahun = parseInt(e.target.value, 10);
      muatUlangKaryawan(saya);
    });
    w.querySelector('#btnRefreshKaryawan').addEventListener('click', () => muatUlangKaryawan(saya));

    await muatUlangKaryawan(saya);
  }

  async function muatUlangKaryawan(saya) {
    const isi = w.querySelector('#isiPortalKaryawan');
    if (isi) isi.innerHTML = UI.memuat(4);

    const awalBulan = new Date(filterTahun, filterBulan - 1, 1).toISOString().split('T')[0];
    const akhirBulan = new Date(filterTahun, filterBulan, 0).toISOString().split('T')[0];

    try {
      const [absensiList, bonusList, kpiList, jamConfig, aktivitasData, insentifConfig] = await Promise.all([
        DB.absensiLaporan(awalBulan, akhirBulan),
        DB.bonusDaftar(filterBulan, filterTahun),
        DB.kpiDaftar(filterBulan, filterTahun),
        DB.pengaturanJamKerja(),
        DB.laporanKaryawanAktivitas ? DB.laporanKaryawanAktivitas({ dari: awalBulan, sampai: akhirBulan }) : Promise.resolve(null),
        DB.pengaturanInsentifAktivitas ? DB.pengaturanInsentifAktivitas() : Promise.resolve(null)
      ]);

      if (jamConfig) jamKerja = jamConfig;
      if (aktivitasData) dataAktivitas = aktivitasData;
      if (insentifConfig) tarifInsentif = insentifConfig;
      dataAbsensi = absensiList || [];
      const bonusSaya = (bonusList || []).find(b => b.pegawai_id === saya.id) || null;
      const kpiSaya = (kpiList || []).filter(k => k.pegawai_id === saya.id);
      const rekap = hitungRekapPerPegawai(saya.id);

      gambarPortalKaryawan(isi, saya, bonusSaya, kpiSaya, rekap);
    } catch (e) {
      if (isi) {
        isi.innerHTML = `<div class="banner err"><div>Gagal memuat data kinerja: ${UI.esc(e.message)}</div></div>`;
      }
    }
  }

  function gambarPortalKaryawan(isi, saya, bonus, kpiList, rekap) {
    const gajiPokok = Number(bonus?.gaji_pokok || 0);
    const tarifMakan = Number(bonus?.tarif_uang_makan || jamKerja.tarif_uang_makan || 20000);
    const hariMakan = (bonus?.hari_uang_makan !== undefined && bonus?.hari_uang_makan !== null) 
      ? Number(bonus.hari_uang_makan) 
      : rekap.hadirLengkapMakan;
    const uangMakan = (bonus?.uang_makan !== undefined && bonus?.uang_makan !== null && Number(bonus.uang_makan) > 0) 
      ? Number(bonus.uang_makan) 
      : (hariMakan * tarifMakan);
    const totBonus = Number(bonus?.total_bonus || 0);
    const totalPenerimaan = bonus?.total_gaji_transfer ? Number(bonus.total_gaji_transfer) : (gajiPokok + uangMakan + totBonus);
    const sudahCair = bonus?.status_bayar === 'DIBAYAR';
    const motivasiPimpinan = bonus?.catatan || 'Terima kasih atas dedikasi, kedisiplinan, dan ketelitian kerja Anda di Laboratorium Medis Utama. Pertahankan etos kerja prima dan utamakan ketepatan hasil pengujian laboratorium.';

    isi.innerHTML = `
      <!-- 1. KOTAK KATA MOTIVASI DARI PIMPINAN (Ibu Dede Kurniasih) -->
      <div class="mb-24" style="background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F0FDF9 100%); border: 1.5px solid #A7F3D0; border-radius: 14px; padding: 22px 26px; box-shadow: 0 4px 16px rgba(15,139,126,0.08);">
        <div class="flex items-center justify-between flex-wrap gap-12 mb-14 pb-12" style="border-bottom: 1px dashed #A7F3D0;">
          <div class="flex items-center gap-12">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #0F766E; color: #fff; font-size: 16px; font-weight: 800; display: grid; place-items: center; letter-spacing: 0.5px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(15,118,110,0.3);">
              DK
            </div>
            <div>
              <div style="font-size: 11px; text-transform: uppercase; color: #047857; font-weight: 700; letter-spacing: 0.6px;">
                Pesan & Kata Motivasi Pimpinan
              </div>
              <div style="font-size: 17px; font-weight: 800; color: #064E3B; margin-top: 1px;">
                DEDE KURNIASIH
              </div>
              <div style="font-size: 12px; color: #047857;">
                Kepala Laboratorium & Pemilik • Laboratorium Medis Utama
              </div>
            </div>
          </div>
          <span class="badge" style="background: #0F766E; color: #fff; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 20px;">
            APRESIASI RESMI PIMPINAN
          </span>
        </div>

        <div style="font-size: 14.5px; color: #065F46; line-height: 1.65; font-style: italic; background: rgba(255,255,255,0.7); padding: 14px 18px; border-radius: 10px; border-left: 4px solid #059669;">
          "${UI.esc(motivasiPimpinan)}"
        </div>
      </div>

      <!-- 2. KARTU STATISTIK KINERJA & PENERIMAAN PRIBADI -->
      <div class="absensi-stat-grid mb-24">
        <div class="absensi-stat-card stat-brand">
          <div class="text-xs" style="color:var(--brand-800); font-weight:600;">Total Gaji & Bonus (Ditransfer)</div>
          <div style="font-size:22px; font-weight:800; color:var(--brand-800); margin: 3px 0;">
            ${UI.rupiah(totalPenerimaan)}
          </div>
          <div class="text-xs">
            ${sudahCair 
              ? `<span class="badge b-selesai" style="font-size:10.5px;">Sudah Ditransfer</span>`
              : `<span class="badge b-menunggu" style="font-size:10.5px;">Menunggu Transfer</span>`}
          </div>
        </div>

        <div class="absensi-stat-card stat-ok">
          <div class="text-xs" style="color:var(--ok-700); font-weight:600;">Uang Makan Kehadiran</div>
          <div style="font-size:22px; font-weight:800; color:var(--ok-700); margin: 3px 0;">
            ${UI.rupiah(uangMakan)}
          </div>
          <div class="text-xs text-muted">${hariMakan} hari hadir lengkap (${rekap.hadir} total hadir)</div>
        </div>

        <div class="absensi-stat-card stat-ok">
          <div class="text-xs" style="color:var(--ok-700); font-weight:600;">Presensi Tepat Waktu</div>
          <div style="font-size:22px; font-weight:800; color:var(--ok-700); margin: 3px 0;">
            ${rekap.tepatWaktu} hari
          </div>
          <div class="text-xs" style="color:var(--danger-700);">
            ${rekap.terlambat > 0 ? `Terlambat ${rekap.terlambat}x (${rekap.totalMenitTelat} mnt)` : 'Nihil Keterlambatan'}
          </div>
        </div>

        <div class="absensi-stat-card">
          <div class="text-xs text-muted">Indeks Kedisiplinan Kerja</div>
          <div style="font-size:22px; font-weight:800; color:#0F172A; margin: 3px 0;">
            ${rekap.disiplinPersen}%
          </div>
          <div class="text-xs">
            <span class="badge ${rekap.disiplinPersen >= 90 ? 'b-selesai' : 'b-menunggu'}" style="font-size:10px;">
              ${rekap.disiplinPersen >= 90 ? 'Sangat Baik' : 'Cukup Baik'}
            </span>
          </div>
        </div>
      </div>

      <!-- 3. RINCIAN KOMPONEN PENERIMAAN (GAJI, UANG MAKAN & BONUS) -->
      <div class="card mb-24" style="border-radius: 12px; border: 1px solid var(--border); overflow: hidden; background: #fff;">
        <div class="card-head flex items-center justify-between" style="padding: 16px 20px; background: #F8FAFC; border-bottom: 1px solid var(--border);">
          <div>
            <h2 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 0;">
              ${UI.ikon('laporan', 18)} Rincian Gaji & Bonus Bulan Ini
            </h2>
            <div class="text-muted text-xs mt-2">
              Rincian penetapan hak keuangan yang disetujui langsung oleh Ibu Dede Kurniasih.
            </div>
          </div>
          ${bonus ? `
            <button class="btn btn-primary btn-sm" id="btnCetakSlipSaya" style="font-weight: 600; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
              ${UI.ikon('cetak', 14)} Cetak Slip Resmi
            </button>
          ` : ''}
        </div>

        <div style="padding: 20px;">
          ${!bonus ? `
            <div class="p-20 text-center text-muted" style="background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 10px;">
              Penetapan nominal penggajian & bonus untuk bulan <b>${NAMA_BULAN[filterBulan - 1]} ${filterTahun}</b> sedang dalam proses oleh Pimpinan (Ibu Dede Kurniasih).
            </div>
          ` : `
            <table class="tbl w-full" style="font-size: 13px;">
              <thead><tr>
                <th>KOMPONEN PENERIMAAN</th>
                <th>KETERANGAN / DASAR PENILAIAN</th>
                <th class="text-right">JUMLAH (RP)</th>
              </tr></thead>
              <tbody>
                ${gajiPokok > 0 ? `
                  <tr>
                    <td><b>Gaji Pokok / Tunjangan Tetap</b></td>
                    <td class="text-muted">Tunjangan tugas operasional bulanan</td>
                    <td class="mono text-right font-bold" style="color: #0F172A;">${UI.rupiah(gajiPokok)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td><b>Uang Makan Kehadiran</b></td>
                  <td class="text-muted">Dihitung dari kehadiran lengkap masuk & pulang (${hariMakan} hari @ ${UI.rupiah(tarifMakan)})</td>
                  <td class="mono text-right font-bold" style="color: #0F766E;">${UI.rupiah(uangMakan)}</td>
                </tr>
                <tr>
                  <td><b>Bonus Kehadiran & Kedisiplinan Kerja</b></td>
                  <td class="text-muted">Apresiasi presensi tepat waktu (${rekap.hadir} hari kerja, ${rekap.tepatWaktu} tepat waktu)</td>
                  <td class="mono text-right font-bold" style="color: #0F172A;">${UI.rupiah(bonus.komponen_absensi)}</td>
                </tr>
                <tr>
                  <td><b>Apresiasi Kinerja Pimpinan / Produktivitas Lab</b></td>
                  <td class="text-muted">Penghargaan atas mutu analisis dan pelayanan laboratorium</td>
                  <td class="mono text-right font-bold" style="color: #0F172A;">${UI.rupiah(bonus.komponen_kpi)}</td>
                </tr>
                <tr>
                  <td><b>Insentif Tambahan / Tunjangan Khusus</b></td>
                  <td class="text-muted">Insentif lembur atau apresiasi tambahan pimpinan</td>
                  <td class="mono text-right font-bold" style="color: #0F172A;">${UI.rupiah(bonus.komponen_lainnya)}</td>
                </tr>
                <tr style="background: #F0FDF4;">
                  <td colspan="2" style="font-weight: 800; color: #166534; font-size: 13.5px;">SUBTOTAL BONUS KINERJA</td>
                  <td class="mono text-right font-bold" style="font-size: 14.5px; color: #166534;">${UI.rupiah(totBonus)}</td>
                </tr>
                <tr style="background: #ECFDF5; border-top: 2px solid #86EFAC;">
                  <td colspan="2" style="font-weight: 800; color: #064E3B; font-size: 15px;">TOTAL PENERIMAAN BERSIH (GAJI + MAKAN + BONUS)</td>
                  <td class="mono text-right font-bold" style="font-size: 17px; color: #064E3B;">${UI.rupiah(totalPenerimaan)}</td>
                </tr>
              </tbody>
            </table>

            <div class="mt-16 flex items-center justify-between flex-wrap gap-10 text-xs" style="background:#F8FAFC; padding:10px 14px; border-radius:8px; border:1px solid #E2E8F0;">
              <div>
                <b>Status Transfer:</b> 
                ${sudahCair ? `<span class="badge b-selesai">Sudah Ditransfer (${UI.tglIndo(bonus.tanggal_bayar)})</span>` : `<span class="badge b-menunggu">Menunggu Transfer Manual</span>`}
                ${saya.nomor_rekening ? `<span class="text-muted ml-8">• Rekening: <b>${UI.esc(saya.nama_bank || 'Bank')} ${UI.esc(saya.nomor_rekening)}</b> (a.n. ${UI.esc(saya.atas_nama_rekening || saya.nama)})</span>` : ''}
              </div>
              <div class="text-muted">
                Nomor Dokumen Slip: <span class="mono font-bold" style="color:#0F172A;">${UI.esc(bonus.nomor_slip || '—')}</span>
              </div>
            </div>
          `}
        </div>
      </div>

      <!-- 4. EVALUASI KPI PRIBADI JIKA ADA -->
      ${kpiList && kpiList.length ? `
        <div class="card mb-24" style="border-radius: 12px; border: 1px solid var(--border); overflow: hidden; background: #fff;">
          <div class="card-head" style="padding: 16px 20px; background: #F8FAFC; border-bottom: 1px solid var(--border);">
            <h2 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 0;">
              ${UI.ikon('cek', 18)} Evaluasi Indikator Kerja Utama (KPI) Anda
            </h2>
            <div class="text-muted text-xs mt-2">
              Pencapaian metrik kerja operasional yang dinilai oleh Pimpinan.
            </div>
          </div>
          <div style="padding: 20px;">
            <table class="tbl w-full" style="font-size: 12.5px;">
              <thead><tr>
                <th>INDIKATOR KINERJA</th>
                <th>TARGET</th>
                <th>CAPAIAN</th>
                <th>NILAI (%)</th>
                <th>CATATAN PIMPINAN</th>
              </tr></thead>
              <tbody>
                ${kpiList.map(k => `
                  <tr>
                    <td><b>${UI.esc(k.metrik)}</b></td>
                    <td class="mono">${k.target}</td>
                    <td class="mono font-bold" style="color:#0F8B7E;">${k.capaian}</td>
                    <td>
                      <span class="badge ${k.nilai >= 100 ? 'b-selesai' : (k.nilai >= 80 ? 'b-kajian' : 'b-danger')}" style="font-weight:700;">
                        ${k.nilai}%
                      </span>
                    </td>
                    <td class="text-muted">${UI.esc(k.keterangan || '—')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    isi.querySelector('#btnCetakSlipSaya')?.addEventListener('click', () => {
      dialogCetakSlip(saya, bonus, rekap);
    });
  }

  /* =====================================================================
  /* =====================================================================
     CETAK SLIP RINCIAN GAJI, UANG MAKAN & BONUS RESMI (PAS 1 LEMBAR)
     ===================================================================== */
  function susunIsiSlip(pegawai, bonus, rekap) {
    const noSlip = bonus?.nomor_slip || `SLP/LMU/${filterTahun}${String(filterBulan).padStart(2, '0')}/${pegawai.id.slice(0, 6).toUpperCase()}`;
    const tglCetak = UI.tglIndo(new Date(), true);
    const namaPeriode = `${NAMA_BULAN[filterBulan - 1]} ${filterTahun}`;

    const gajiPokok = Number(bonus?.gaji_pokok || 0);
    const hariMakan = (bonus?.hari_uang_makan !== undefined && bonus?.hari_uang_makan !== null) 
      ? Number(bonus.hari_uang_makan) 
      : rekap.hadirLengkapMakan;
    const tarifMakan = Number(bonus?.tarif_uang_makan || jamKerja.tarif_uang_makan || 20000);
    const uangMakan = (bonus?.uang_makan !== undefined && bonus?.uang_makan !== null && Number(bonus.uang_makan) > 0) 
      ? Number(bonus.uang_makan) 
      : (hariMakan * tarifMakan);
    const totBonus = Number(bonus?.total_bonus || 0);
    const totalTransfer = bonus?.total_gaji_transfer ? Number(bonus.total_gaji_transfer) : (gajiPokok + uangMakan + totBonus);

    return `
      <div class="slip-doc-sheet">
        <!-- Kop Header Resmi -->
        <div class="slip-kop">
          <div>
            <div class="kop-brand">LABORATORIUM MEDIS UTAMA</div>
            <div class="kop-sub">Layanan Diagnostik &amp; Rekam Medis • Jl. D.I. Panjaitan No.94, Purbalingga • Telp: (0281) 891234</div>
          </div>
          <div class="slip-badge">
            ${bonus?.status_bayar === 'DIBAYAR' ? 'RESMI • SUDAH DITRANSFER' : 'RESMI • DRAFT PENETAPAN'}
          </div>
        </div>

        <div class="slip-title">SLIP RINCIAN GAJI, UANG MAKAN &amp; BONUS KARYAWAN</div>

        <!-- Identitas Karyawan & Rekening -->
        <div class="identitas-grid">
          <div><b>Nama Karyawan:</b> ${UI.esc(pegawai.nama)}</div>
          <div><b>Periode Gaji:</b> ${namaPeriode}</div>
          <div><b>Jabatan / Peran:</b> ${labelRole(pegawai.peran)}</div>
          <div><b>Nomor Dokumen:</b> ${UI.esc(noSlip)}</div>
          <div class="col-span-2">
            <b>Rekening Transfer:</b> ${pegawai.nama_bank ? `${UI.esc(pegawai.nama_bank)} — <b>${UI.esc(pegawai.nomor_rekening)}</b> (a.n. ${UI.esc(pegawai.atas_nama_rekening || pegawai.nama)})` : '<span style="color:#94A3B8;">Transfer Perbankan Manual (Belum disetel)</span>'}
          </div>
        </div>

        <!-- Rangkuman Kehadiran Lengkap -->
        <div class="rekap-info-box">
          <b>Verifikasi Presensi:</b> Total Hadir: <b>${rekap.hadir} hari</b> (Hadir Lengkap Datang &amp; Pulang: <b style="color:#0F766E;">${hariMakan} hari</b>) • Tepat Waktu: ${rekap.tepatWaktu} hari • Terlambat: ${rekap.terlambat} kali (${rekap.totalMenitTelat} mnt) • Izin: ${rekap.izinCuti} hari • Indeks Disiplin: <b>${rekap.disiplinPersen}%</b>
        </div>

        <!-- Tabel 5 Komponen Penggajian: Gaji Pokok + Uang Makan + Bonus = Total Transfer -->
        <table class="tbl-slip">
          <thead>
            <tr>
              <th style="width: 38px; text-align: center;">NO</th>
              <th>KOMPONEN PENERIMAAN</th>
              <th style="text-align: right; width: 150px;">JUMLAH (RP)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td>
                <div class="komp-judul">Gaji Pokok / Tunjangan Pokok</div>
                <div class="komp-sub">Tunjangan tugas operasional bulanan</div>
              </td>
              <td class="col-rp font-bold">${UI.rupiah(gajiPokok)}</td>
            </tr>
            <tr>
              <td style="text-align: center;">2</td>
              <td>
                <div class="komp-judul">Uang Makan Kehadiran</div>
                <div class="komp-sub">Dihitung dari ${hariMakan} hari hadir lengkap (masuk &amp; pulang) @ ${UI.rupiah(tarifMakan)}</div>
              </td>
              <td class="col-rp font-bold" style="color: #0F766E;">${UI.rupiah(uangMakan)}</td>
            </tr>
            <tr>
              <td style="text-align: center;">3</td>
              <td>
                <div class="komp-judul">Bonus Kehadiran &amp; Kedisiplinan Kerja</div>
                <div class="komp-sub">Apresiasi kehadiran tepat waktu dan jam kerja penuh</div>
              </td>
              <td class="col-rp">${UI.rupiah(bonus?.komponen_absensi || 0)}</td>
            </tr>
            <tr>
              <td style="text-align: center;">4</td>
              <td>
                <div class="komp-judul">Apresiasi Kinerja Pimpinan / Produktivitas Lab</div>
                <div class="komp-sub">Penghargaan mutu analisis dan dedikasi pelayanan laboratorium</div>
              </td>
              <td class="col-rp">${UI.rupiah(bonus?.komponen_kpi || 0)}</td>
            </tr>
            <tr>
              <td style="text-align: center;">5</td>
              <td>
                <div class="komp-judul">Insentif Tambahan / Tunjangan Khusus</div>
                <div class="komp-sub">Insentif lembur atau apresiasi tambahan pimpinan</div>
              </td>
              <td class="col-rp">${UI.rupiah(bonus?.komponen_lainnya || 0)}</td>
            </tr>
            <tr class="row-subtotal">
              <td colspan="2" style="text-align: right;">SUBTOTAL BONUS &amp; INSENTIF:</td>
              <td class="col-rp font-bold" style="color: #166534;">${UI.rupiah(totBonus)}</td>
            </tr>
            <tr class="row-total">
              <td colspan="2" style="text-align: right;">TOTAL DITERIMA (DITRANSFER):</td>
              <td class="col-rp font-bold total-val">${UI.rupiah(totalTransfer)}</td>
            </tr>
          </tbody>
        </table>

        <div class="terbilang-box">
          Terbilang: <b>${UI.terbilang(totalTransfer)}</b>
        </div>

        ${bonus?.catatan ? `
          <div class="catatan-box">
            <b>Pesan Motivasi Pimpinan (Ibu Dede Kurniasih):</b> "${UI.esc(bonus.catatan)}"
          </div>
        ` : ''}

        <!-- Tanda Tangan Formal -->
        <div class="ttd-box">
          <div class="ttd-col">
            <div>Penerima,</div>
            <div class="ttd-space"></div>
            <div class="ttd-nama">${UI.esc(pegawai.nama)}</div>
            <div class="ttd-role">${labelRole(pegawai.peran)}</div>
          </div>
          <div class="ttd-col">
            <div>Purbalingga, ${tglCetak}</div>
            <div>Mengetahui &amp; Menyetujui,</div>
            <div class="ttd-space"></div>
            <div class="ttd-nama">DEDE KURNIASIH</div>
            <div class="ttd-role">Kepala Laboratorium Medis Utama</div>
          </div>
        </div>
      </div>
    `;
  }

  function susunHtmlSlipCetak(pegawai, bonus, rekap) {
    const namaPeriode = `${NAMA_BULAN[filterBulan - 1]} ${filterTahun}`;
    const slipIsi = susunIsiSlip(pegawai, bonus, rekap);

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Slip Gaji &amp; Bonus — ${UI.esc(pegawai.nama)} — ${namaPeriode}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 14mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            background: #fff;
            color: #0F172A;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.35;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            body {
              padding: 0 !important;
              margin: 0 !important;
            }
            .slip-doc-sheet {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              border: 1.5px solid #0F8B7E !important;
              box-shadow: none !important;
              margin: 0 !important;
            }
            .tbl-slip, .tbl-slip tr, .ttd-box {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
          .slip-doc-sheet {
            max-width: 680px;
            margin: 0 auto;
            border: 1.5px solid #0F8B7E;
            border-radius: 8px;
            padding: 14px 18px;
            background: #fff;
          }
          .slip-kop {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0F8B7E;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .kop-brand {
            font-size: 16px;
            font-weight: 800;
            color: #0F8B7E;
            letter-spacing: 0.5px;
          }
          .kop-sub {
            font-size: 9.5px;
            color: #64748B;
            margin-top: 2px;
          }
          .slip-badge {
            background: #F0FDF4;
            border: 1px solid #86EFAC;
            color: #166534;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.3px;
          }
          .slip-title {
            text-align: center;
            font-size: 12.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #0F172A;
            margin: 6px 0 8px 0;
          }
          .identitas-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 12px;
            font-size: 10.5px;
            margin-bottom: 8px;
            background: #F8FAFC;
            padding: 7px 12px;
            border-radius: 6px;
            border: 1px solid #E2E8F0;
          }
          .identitas-grid .col-span-2 {
            grid-column: span 2;
            border-top: 1px dashed #CBD5E1;
            padding-top: 4px;
            margin-top: 2px;
          }
          .rekap-info-box {
            font-size: 9.5px;
            color: #475569;
            background: #FAF5FF;
            border: 1px solid #E9D5FF;
            padding: 5px 10px;
            border-radius: 5px;
            margin-bottom: 8px;
          }
          .tbl-slip {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 8px;
          }
          .tbl-slip th {
            background: #F1F5F9;
            padding: 5px 8px;
            text-align: left;
            border-bottom: 1.5px solid #CBD5E1;
            font-size: 9.5px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
          }
          .tbl-slip td {
            padding: 4.5px 8px;
            border-bottom: 1px solid #F1F5F9;
            vertical-align: middle;
          }
          .komp-judul {
            font-weight: 700;
            color: #0F172A;
          }
          .komp-sub {
            font-size: 9.5px;
            color: #64748B;
            margin-top: 1px;
          }
          .col-rp {
            text-align: right;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11px;
          }
          .font-bold {
            font-weight: 700;
          }
          .row-subtotal td {
            background: #F8FAFC;
            font-weight: 700;
            border-top: 1px solid #CBD5E1;
            color: #334155;
            padding: 5px 8px;
          }
          .row-total td {
            background: #ECFDF5;
            font-size: 12px;
            font-weight: 800;
            color: #064E3B;
            border-top: 1.5px solid #86EFAC;
            border-bottom: 1.5px solid #86EFAC;
            padding: 6px 8px;
          }
          .total-val {
            font-size: 13px !important;
            color: #064E3B !important;
          }
          .terbilang-box {
            font-size: 10px;
            color: #166534;
            font-style: italic;
            margin-bottom: 6px;
            padding: 4px 8px;
            background: #F0FDF4;
            border-radius: 4px;
            border: 1px dashed #BBF7D0;
          }
          .catatan-box {
            font-size: 9.5px;
            color: #475569;
            font-style: italic;
            margin-bottom: 6px;
            background: #F8FAFC;
            padding: 4px 8px;
            border-radius: 4px;
          }
          .ttd-box {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 12px;
            font-size: 10px;
          }
          .ttd-col {
            text-align: center;
            min-width: 150px;
          }
          .ttd-space {
            height: 32px;
          }
          .ttd-nama {
            font-weight: 800;
            text-decoration: underline;
          }
          .ttd-role {
            font-size: 9.5px;
            color: #64748B;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        ${slipIsi}
      </body>
      </html>
    `;
  }

  function cetakSlipIframe(htmlContent) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;background:#fff;';

    let done = false;
    let timeout = null;

    function cleanup() {
      if (done) return;
      done = true;
      if (timeout) clearTimeout(timeout);
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    }

    iframe.onload = () => {
      let win = null;
      try { win = iframe.contentWindow; } catch (e) { win = null; }
      if (!win) {
        cleanup();
        UI.toast('Gagal menyiapkan jendela cetak slip.', 'err');
        return;
      }

      try { win.addEventListener('afterprint', cleanup); } catch (e) {}

      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch (errPrint) {
          cleanup();
          UI.toast('Dialog cetak tidak dapat dibuka: ' + errPrint.message, 'err');
        }
      }, 150);
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = htmlContent;
  }

  function dialogCetakSlip(pegawai, bonus, rekap) {
    const slipHtml = susunHtmlSlipCetak(pegawai, bonus, rekap);
    const slipIsi = susunIsiSlip(pegawai, bonus, rekap);

    UI.modal({
      judul: `Slip Rincian Gaji & Bonus: ${UI.esc(pegawai.nama)}`,
      lebar: true,
      isi: `
        <style>
          .slip-preview-container {
            background: #F1F5F9;
            padding: 14px;
            border-radius: 8px;
            max-height: calc(100vh - 240px);
            overflow-y: auto;
          }
          .slip-preview-container .slip-doc-sheet {
            max-width: 680px;
            margin: 0 auto;
            border: 1.5px solid #0F8B7E;
            border-radius: 8px;
            padding: 16px 20px;
            background: #fff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.08);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.35;
            color: #0F172A;
          }
          .slip-preview-container .slip-kop {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0F8B7E;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .slip-preview-container .kop-brand {
            font-size: 16px;
            font-weight: 800;
            color: #0F8B7E;
            letter-spacing: 0.5px;
          }
          .slip-preview-container .kop-sub {
            font-size: 9.5px;
            color: #64748B;
            margin-top: 2px;
          }
          .slip-preview-container .slip-badge {
            background: #F0FDF4;
            border: 1px solid #86EFAC;
            color: #166534;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
          }
          .slip-preview-container .slip-title {
            text-align: center;
            font-size: 12.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #0F172A;
            margin: 6px 0 8px 0;
          }
          .slip-preview-container .identitas-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 12px;
            font-size: 10.5px;
            margin-bottom: 8px;
            background: #F8FAFC;
            padding: 7px 12px;
            border-radius: 6px;
            border: 1px solid #E2E8F0;
          }
          .slip-preview-container .identitas-grid .col-span-2 {
            grid-column: span 2;
            border-top: 1px dashed #CBD5E1;
            padding-top: 4px;
            margin-top: 2px;
          }
          .slip-preview-container .rekap-info-box {
            font-size: 9.5px;
            color: #475569;
            background: #FAF5FF;
            border: 1px solid #E9D5FF;
            padding: 5px 10px;
            border-radius: 5px;
            margin-bottom: 8px;
          }
          .slip-preview-container .tbl-slip {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 8px;
          }
          .slip-preview-container .tbl-slip th {
            background: #F1F5F9;
            padding: 5px 8px;
            text-align: left;
            border-bottom: 1.5px solid #CBD5E1;
            font-size: 9.5px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
          }
          .slip-preview-container .tbl-slip td {
            padding: 4.5px 8px;
            border-bottom: 1px solid #F1F5F9;
            vertical-align: middle;
          }
          .slip-preview-container .komp-judul {
            font-weight: 700;
            color: #0F172A;
          }
          .slip-preview-container .komp-sub {
            font-size: 9.5px;
            color: #64748B;
            margin-top: 1px;
          }
          .slip-preview-container .col-rp {
            text-align: right;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11px;
          }
          .slip-preview-container .font-bold {
            font-weight: 700;
          }
          .slip-preview-container .row-subtotal td {
            background: #F8FAFC;
            font-weight: 700;
            border-top: 1px solid #CBD5E1;
            color: #334155;
            padding: 5px 8px;
          }
          .slip-preview-container .row-total td {
            background: #ECFDF5;
            font-size: 12px;
            font-weight: 800;
            color: #064E3B;
            border-top: 1.5px solid #86EFAC;
            border-bottom: 1.5px solid #86EFAC;
            padding: 6px 8px;
          }
          .slip-preview-container .total-val {
            font-size: 13px !important;
            color: #064E3B !important;
          }
          .slip-preview-container .terbilang-box {
            font-size: 10px;
            color: #166534;
            font-style: italic;
            margin-bottom: 6px;
            padding: 4px 8px;
            background: #F0FDF4;
            border-radius: 4px;
            border: 1px dashed #BBF7D0;
          }
          .slip-preview-container .catatan-box {
            font-size: 9.5px;
            color: #475569;
            font-style: italic;
            margin-bottom: 6px;
            background: #F8FAFC;
            padding: 4px 8px;
            border-radius: 4px;
          }
          .slip-preview-container .ttd-box {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 12px;
            font-size: 10px;
          }
          .slip-preview-container .ttd-col {
            text-align: center;
            min-width: 150px;
          }
          .slip-preview-container .ttd-space {
            height: 32px;
          }
          .slip-preview-container .ttd-nama {
            font-weight: 800;
            text-decoration: underline;
          }
          .slip-preview-container .ttd-role {
            font-size: 9.5px;
            color: #64748B;
            margin-top: 2px;
          }
        </style>
        <div class="slip-preview-container">
          ${slipIsi}
        </div>
      `,
      tombol: [
        { teks: 'Tutup', nilai: false },
        {
          teks: 'Cetak / Print Dokumen',
          kelas: 'btn-primary',
          aksi: () => {
            cetakSlipIframe(slipHtml);
            return false;
          }
        }
      ]
    });
  }

  return { render };
})();
