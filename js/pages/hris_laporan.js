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

  const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const tanggalSekarang = new Date();
  let filterBulan = tanggalSekarang.getMonth() + 1;
  let filterTahun = tanggalSekarang.getFullYear();

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
    let tepatWaktu = 0;
    let terlambat = 0;
    let totalMenitTelat = 0;
    let izinCuti = 0;
    let alfa = 0;

    absensiPegawai.forEach(a => {
      if (a.status === 'HADIR') {
        hadir++;
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

    return {
      totalAbsensiTercatat: absensiPegawai.length,
      hadir,
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
    w.innerHTML = `
      <div class="mb-20 flex items-center justify-between flex-wrap gap-16">
        <div style="max-width: 600px;">
          <h1 class="mb-4" style="font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
            Kinerja & Bonus Karyawan
          </h1>
          <p class="text-muted mb-0" style="font-size: 13.5px; line-height: 1.4;">
            Panel kendali pimpinan (Dede Kurniasih): rekapitulasi kehadiran staf, evaluasi kinerja, penetapan nominal bonus, dan cetak slip resmi.
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
              DK
            </div>
            <div>
              <div style="font-size: 11.5px; color: #C6E6E1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px;">
                Kepala Laboratorium (Pemilik)
              </div>
              <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.2px; margin-top: 1px; color: #FFFFFF;">
                DEDE KURNIASIH
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
          ${UI.ikon('laporan', 15)} Penetapan & Pencairan Bonus
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
      const [pegawaiList, absensiList, kpiList, bonusList, jamConfig] = await Promise.all([
        DB.daftarPegawaiStaff(),
        DB.absensiLaporan(awalBulan, akhirBulan),
        DB.kpiDaftar(filterBulan, filterTahun),
        DB.bonusDaftar(filterBulan, filterTahun),
        DB.pengaturanJamKerja()
      ]);

      dataPegawai = pegawaiList || [];
      dataAbsensi = absensiList || [];
      dataKpi = kpiList || [];
      dataBonus = bonusList || [];
      if (jamConfig) jamKerja = jamConfig;

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
                <th>TOTAL HADIR</th>
                <th>TEPAT WAKTU</th>
                <th>TERLAMBAT</th>
                <th>TOTAL MENIT TELAT</th>
                <th>IZIN / CUTI</th>
                <th>DISIPLIN</th>
                <th style="text-align: center;">DETAIL PRESENSI</th>
              </tr></thead>
              <tbody>
                ${barisRekap.map(item => `
                  <tr>
                    <td><b style="color: #0F172A;">${UI.esc(item.pegawai.nama)}</b></td>
                    <td><span class="badge" style="background:#F1F5F9; color:#475569; text-transform:uppercase; font-size:11px; font-weight:700;">${UI.esc(item.pegawai.peran)}</span></td>
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
                `).join('')}
              </tbody>
            </table></div>
          `}
        </div>
      </div>
    `;

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
                      <div class="text-xs text-muted" style="margin-top:2px;">${UI.esc(k.pegawai?.peran || '')}</div>
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
                  ${UI.esc(p.nama)} (${UI.esc(p.peran)})
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
     MASTER - TAB 3: PENETAPAN & PENCAIRAN BONUS (KEBIJAKAN LANGSUNG PIMPINAN)
     ===================================================================== */
  function tabPenetapanBonus(isi) {
    let totalAnggaran = 0;
    let totalDicairkan = 0;
    let totalMenunggu = 0;

    const dataBarisBonus = dataPegawai.map(p => {
      const bonus = dataBonus.find(b => b.pegawai_id === p.id) || null;
      const rekap = hitungRekapPerPegawai(p.id);
      const totalRupiah = bonus ? Number(bonus.total_bonus || 0) : 0;
      
      totalAnggaran += totalRupiah;
      if (bonus?.status_bayar === 'DIBAYAR') {
        totalDicairkan += totalRupiah;
      } else {
        totalMenunggu += totalRupiah;
      }

      return {
        pegawai: p,
        bonus,
        rekap,
        totalRupiah
      };
    });

    isi.innerHTML = `
      <div class="absensi-panel">
        <div class="absensi-panel-head">
          <div>
            <h2 class="flex items-center gap-10" style="margin: 0; font-size: 17px; font-weight: 700; color: #0F172A;">
              ${UI.ikon('laporan', 19)} Penetapan & Pencairan Bonus Karyawan
            </h2>
            <div class="text-muted text-xs mt-4">
              Kebijakan nominal bonus, gaji, dan pesan motivasi ditetapkan langsung oleh Pimpinan (Dede Kurniasih) untuk periode <b>${NAMA_BULAN[filterBulan - 1]} ${filterTahun}</b>.
            </div>
          </div>
          <button class="btn btn-primary" id="btnInputBonusHead" style="height: 38px; font-weight: 700; padding: 0 16px; display: inline-flex; align-items: center; gap: 8px;">
            ${UI.ikon('plus', 16)} Input / Tetapkan Bonus Karyawan
          </button>
        </div>

        <!-- Banner Info Kebijakan Langsung Pimpinan -->
        <div class="absensi-banner-box" style="margin: 20px 24px 0 24px; border-radius: 10px; background: #F0FDF4; border: 1px solid #BBF7D0;">
          <div class="flex items-center gap-12">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(15, 139, 126, 0.12); display: grid; place-items: center; color: var(--brand-800); flex-shrink: 0;">
              ${UI.ikon('info', 20)}
            </div>
            <div>
              <div style="font-size: 13.5px; font-weight: 700; color: #166534;">Kebijakan Bonus Langsung Pimpinan Laboratorium Medis Utama</div>
              <div style="font-size: 12.5px; color: #334155; margin-top: 2px;">
                Pimpinan menentukan nominal gaji pokok, bonus kehadiran, apresiasi kinerja kerja lab, tunjangan, serta kata motivasi yang langsung terhubung ke dashboard karyawan dan siap cetak slip resmi.
              </div>
            </div>
          </div>
        </div>

        <!-- Stat Grid Anggaran Bonus -->
        <div class="absensi-stat-grid" style="margin-top: 20px;">
          <div class="absensi-stat-card">
            <div class="text-xs text-muted">Karyawan Terdaftar</div>
            <div style="font-size:22px; font-weight:800; color:#0F172A;">${dataPegawai.length} Orang</div>
          </div>
          <div class="absensi-stat-card stat-ok">
            <div class="text-xs" style="color:var(--ok-700); font-weight:600;">Total Bonus Dicairkan</div>
            <div style="font-size:20px; font-weight:800; color:var(--ok-700);">${UI.rupiah(totalDicairkan)}</div>
          </div>
          <div class="absensi-stat-card stat-warn">
            <div class="text-xs" style="color:var(--warn-700); font-weight:600;">Menunggu Pencairan</div>
            <div style="font-size:20px; font-weight:800; color:var(--warn-700);">${UI.rupiah(totalMenunggu)}</div>
          </div>
          <div class="absensi-stat-card stat-brand">
            <div class="text-xs" style="color:var(--brand-800); font-weight:600;">Total Alokasi Bonus</div>
            <div style="font-size:20px; font-weight:800; color:var(--brand-800);">${UI.rupiah(totalAnggaran)}</div>
          </div>
        </div>

        <!-- Tabel Penetapan & Pencairan Bonus -->
        <div style="padding: 20px 24px;">
          ${!dataBarisBonus.length ? `
            <div class="empty text-center p-24 text-muted" style="border: 1px dashed #CBD5E1; border-radius: 12px; background: #F8FAFC;">
              Belum ada data karyawan aktif.
            </div>
          ` : `
            <div class="absensi-table-wrap" style="overflow-x: auto;"><table class="tbl w-full">
              <thead><tr>
                <th style="min-width: 180px;">NAMA KARYAWAN</th>
                <th class="text-right" style="min-width: 110px;">GAJI POKOK</th>
                <th class="text-right" style="min-width: 130px;">BONUS KEHADIRAN</th>
                <th class="text-right" style="min-width: 130px;">APRESIASI KINERJA</th>
                <th class="text-right" style="min-width: 110px;">INSENTIF LAIN</th>
                <th class="text-right" style="min-width: 120px;">TOTAL BONUS</th>
                <th style="min-width: 130px;">STATUS PENCAIRAN</th>
                <th style="min-width: 140px; text-align: center;">AKSI</th>
              </tr></thead>
              <tbody>
                ${dataBarisBonus.map(row => {
                  const b = row.bonus;
                  const sudahBayar = b?.status_bayar === 'DIBAYAR';

                  return `
                    <tr>
                      <td>
                        <b style="color: #0F172A; font-size: 13.5px;">${UI.esc(row.pegawai.nama)}</b>
                        <div class="text-xs text-muted" style="margin-top:2px;">
                          ${UI.esc(row.pegawai.peran)} • Hadir: <b>${row.rekap.hadir} hari</b> (${row.rekap.disiplinPersen}%)
                        </div>
                        ${b?.catatan ? `<div class="text-xs mt-4" style="color: #047857; font-style: italic;">"${UI.esc(b.catatan)}"</div>` : ''}
                      </td>
                      <td class="mono text-right" style="color: #334155;">
                        ${b?.gaji_pokok ? UI.rupiah(b.gaji_pokok) : '<span class="text-muted text-xs">—</span>'}
                      </td>
                      <td class="mono text-right" style="color: #334155;">
                        ${b ? UI.rupiah(b.komponen_absensi) : 'Rp 0'}
                      </td>
                      <td class="mono text-right" style="color: #334155;">
                        ${b ? UI.rupiah(b.komponen_kpi) : 'Rp 0'}
                      </td>
                      <td class="mono text-right" style="color: #334155;">
                        ${b ? UI.rupiah(b.komponen_lainnya) : 'Rp 0'}
                      </td>
                      <td class="mono text-right font-bold" style="color: #15803D; font-size: 14.5px;">
                        ${b ? UI.rupiah(b.total_bonus) : 'Rp 0'}
                      </td>
                      <td>
                        ${sudahBayar ? `
                          <span class="badge b-selesai" style="font-size: 11px; padding: 4px 8px;">
                            Sudah Dicairkan ${b.tanggal_bayar ? `(${UI.tglIndo(b.tanggal_bayar)})` : ''}
                          </span>
                        ` : `
                          <span class="badge b-menunggu" style="font-size: 11px; padding: 4px 8px;">
                            Belum Dicairkan
                          </span>
                        `}
                      </td>
                      <td style="text-align: center;">
                        <div class="flex items-center gap-6" style="justify-content: center; flex-wrap: nowrap;">
                          <button class="btn ${b ? 'btn-secondary' : 'btn-primary'} btn-sm" data-edit-bonus="${row.pegawai.id}" style="font-weight: 600; padding: 6px 12px; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;">
                            ${UI.ikon('pensil', 13)} ${b ? 'Ubah Nominal' : 'Input Nominal'}
                          </button>
                          ${b ? `
                            <button class="btn btn-primary btn-sm" data-cetak-slip="${row.pegawai.id}" style="font-weight: 600; padding: 6px 12px; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;">
                              ${UI.ikon('cetak', 13)} Cetak Slip
                            </button>
                          ` : ''}
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

    isi.querySelectorAll('[data-cetak-slip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const peg = dataPegawai.find(p => p.id === btn.dataset.cetakSlip);
        if (peg) {
          const b = dataBonus.find(x => x.pegawai_id === peg.id) || null;
          if (b) {
            const rekap = hitungRekapPerPegawai(peg.id);
            dialogCetakSlip(peg, b, rekap);
          }
        }
      });
    });
  }

  /* Modal Input / Sesuaikan Bonus oleh Pimpinan */
  function dialogInputBonus(pegawaiAwal = null, bonusAwal = null) {
    let peg = pegawaiAwal || dataPegawai[0] || null;
    if (!peg) {
      UI.toast('Belum ada data pegawai aktif yang terdaftar.', 'warn');
      return;
    }
    let b = bonusAwal || dataBonus.find(x => x.pegawai_id === peg.id) || null;
    let rekap = hitungRekapPerPegawai(peg.id);

    UI.modal({
      judul: `Penetapan & Pengisian Nominal Bonus Karyawan`,
      lebar: true,
      isi: `
        <!-- Pilih Karyawan Jika Lebih Dari 1 -->
        <div class="field mb-16">
          <label>Pilih Karyawan yang Diberikan Bonus <span class="req">*</span></label>
          <select id="modalSelectPegawaiBonus" class="w-full" style="height: 40px; font-weight: 700; font-size: 14px;">
            ${dataPegawai.map(p => `
              <option value="${p.id}" ${p.id === peg.id ? 'selected' : ''}>
                ${UI.esc(p.nama)} (${UI.esc(p.peran).toUpperCase()})
              </option>
            `).join('')}
          </select>
        </div>

        <div id="modalBoxRekapPresensi" class="absensi-banner-box mb-16" style="background: #F8FAFC; border-color: #E2E8F0; padding: 14px 18px;">
          <div>
            <div style="font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase;">
              Rekapitulasi Kehadiran Bulan Ini (${NAMA_BULAN[filterBulan - 1]} ${filterTahun}):
            </div>
            <div class="flex items-center gap-14 mt-6 text-xs flex-wrap" style="color: #0F172A;">
              <span>Total Hadir: <b id="mRekapHadir">${rekap.hadir} hari</b></span>
              <span>Tepat Waktu: <b id="mRekapTepat" style="color:var(--ok-700);">${rekap.tepatWaktu} hari</b></span>
              <span>Terlambat: <b id="mRekapTelat" style="color:var(--danger-700);">${rekap.terlambat} kali (${rekap.totalMenitTelat} menit)</b></span>
              <span>Izin / Cuti: <b id="mRekapIzin">${rekap.izinCuti} hari</b></span>
              <span>Disiplin: <b id="mRekapDisiplin" class="badge b-selesai" style="font-size:11px;">${rekap.disiplinPersen}%</b></span>
            </div>
          </div>
        </div>

        <form id="formBonusModal" style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
          <div class="field">
            <label style="font-weight: 700; color: #0F172A;">Gaji Pokok / Tunjangan Tetap <span class="text-muted text-xs font-normal">(Opsional)</span></label>
            <div style="position: relative; display: flex; align-items: center;">
              <span style="position: absolute; left: 12px; font-weight: 800; color: #475569; font-size: 14px; pointer-events: none; user-select: none;">Rp</span>
              <input type="text" inputmode="numeric" name="gaji_pokok" 
                     value="${UI.formatRibuan(b?.gaji_pokok ?? 0)}" 
                     class="w-full mono input-rupiah" 
                     placeholder="0"
                     style="padding-left: 42px; height: 42px; font-weight: 700; font-size: 15.5px; color: #0F172A; border-radius: 8px;">
            </div>
            <div class="live-terbilang text-xs mt-4" style="font-weight: 600;"></div>
            <div class="hint text-xs text-muted mt-2">Dapat dicantumkan sebagai rincian pada slip resmi karyawan.</div>
          </div>

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

          <!-- Live Kalkulator Ringkasan Real-Time -->
          <div id="modalBoxKalkulasiBonus" style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 12px; padding: 14px 18px; margin: 4px 0;">
            <div style="font-size: 12px; font-weight: 700; color: #166534; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
              Ringkasan Perhitungan Real-Time
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #BBF7D0;">
                <div style="font-size: 11.5px; color: #64748B; font-weight: 600;">Total Bonus (1 + 2 + 3)</div>
                <div id="liveTotalBonus" class="mono" style="font-size: 17px; font-weight: 800; color: #15803D; margin-top: 2px;">Rp 0</div>
              </div>
              <div style="background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #BBF7D0;">
                <div style="font-size: 11.5px; color: #64748B; font-weight: 600;">Total Penerimaan (Gaji + Bonus)</div>
                <div id="liveTotalPenerimaan" class="mono" style="font-size: 18px; font-weight: 800; color: #064E3B; margin-top: 2px;">Rp 0</div>
              </div>
            </div>
          </div>

          <div class="field">
            <label style="font-weight: 700; color: #0F172A;">Status Pencairan Bonus <span class="req">*</span></label>
            <select name="status_bayar" required class="w-full" style="height: 40px; font-weight: 600;">
              <option value="BELUM" ${(!b || b.status_bayar === 'BELUM') ? 'selected' : ''}>Belum Dicairkan (Draft Evaluasi)</option>
              <option value="DIBAYAR" ${b?.status_bayar === 'DIBAYAR' ? 'selected' : ''}>Sudah Dicairkan / Ditransfer</option>
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
          const a = Number(String(form.komponen_absensi.value).replace(/\D/g, '')) || 0;
          const k = Number(String(form.komponen_kpi.value).replace(/\D/g, '')) || 0;
          const l = Number(String(form.komponen_lainnya.value).replace(/\D/g, '')) || 0;
          const totBonus = a + k + l;
          const totSemua = g + totBonus;

          const elBonus = badan.querySelector('#liveTotalBonus');
          const elPenerimaan = badan.querySelector('#liveTotalPenerimaan');
          if (elBonus) elBonus.textContent = UI.rupiah(totBonus);
          if (elPenerimaan) elPenerimaan.textContent = UI.rupiah(totSemua);
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

        const sel = badan.querySelector('#modalSelectPegawaiBonus');
        if (!sel) return;
        sel.addEventListener('change', (e) => {
          const idDipilih = e.target.value;
          const pBaru = dataPegawai.find(x => x.id === idDipilih);
          if (!pBaru) return;
          const bBaru = dataBonus.find(x => x.pegawai_id === idDipilih) || null;
          const rBaru = hitungRekapPerPegawai(idDipilih);

          badan.querySelector('#mRekapHadir').textContent = `${rBaru.hadir} hari`;
          badan.querySelector('#mRekapTepat').textContent = `${rBaru.tepatWaktu} hari`;
          badan.querySelector('#mRekapTelat').textContent = `${rBaru.terlambat} kali (${rBaru.totalMenitTelat} menit)`;
          badan.querySelector('#mRekapIzin').textContent = `${rBaru.izinCuti} hari`;
          badan.querySelector('#mRekapDisiplin').textContent = `${rBaru.disiplinPersen}%`;

          if (form) {
            form.gaji_pokok.value = UI.formatRibuan(bBaru?.gaji_pokok ?? 0);
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
          teks: 'Simpan Nominal & Motivasi',
          kelas: 'btn-primary',
          aksi: async (modalBody) => {
            const form = modalBody.querySelector('#formBonusModal');
            const selPeg = modalBody.querySelector('#modalSelectPegawaiBonus');
            if (!form.reportValidity()) return false;

            const targetPegId = selPeg ? selPeg.value : peg.id;
            const existingBonus = dataBonus.find(x => x.pegawai_id === targetPegId) || null;

            const payload = {
              pegawai_id: targetPegId,
              bulan: filterBulan,
              tahun: filterTahun,
              gaji_pokok: Number(String(form.gaji_pokok.value).replace(/\D/g, '')) || 0,
              komponen_absensi: Number(String(form.komponen_absensi.value).replace(/\D/g, '')) || 0,
              komponen_kpi: Number(String(form.komponen_kpi.value).replace(/\D/g, '')) || 0,
              komponen_lainnya: Number(String(form.komponen_lainnya.value).replace(/\D/g, '')) || 0,
              status_bayar: form.status_bayar.value,
              tanggal_bayar: form.status_bayar.value === 'DIBAYAR' ? (existingBonus?.tanggal_bayar || UI.hariIni()) : null,
              catatan: form.catatan.value.trim() || null,
              nomor_slip: existingBonus?.nomor_slip || `SLP/LMU/${filterTahun}${String(filterBulan).padStart(2, '0')}/${targetPegId.slice(0, 6).toUpperCase()}`
            };

            try {
              await DB.bonusSimpan(payload, existingBonus?.id || null);
              UI.toast('Nominal bonus dan pesan motivasi berhasil disimpan!', 'ok');
              await muatUlangMaster();
              return true;
            } catch (e) {
              UI.toast('Gagal menyimpan bonus: ' + e.message, 'err');
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
            <div style="font-size:12px; color:#64748B;">Karyawan: <b>${UI.esc(pegawai.nama)}</b> (${UI.esc(pegawai.peran).toUpperCase()})</div>
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
      const [absensiList, bonusList, kpiList, jamConfig] = await Promise.all([
        DB.absensiLaporan(awalBulan, akhirBulan),
        DB.bonusDaftar(filterBulan, filterTahun),
        DB.kpiDaftar(filterBulan, filterTahun),
        DB.pengaturanJamKerja()
      ]);

      if (jamConfig) jamKerja = jamConfig;
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
    const totalPenerimaan = (Number(bonus?.gaji_pokok || 0) + Number(bonus?.total_bonus || 0));
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
          <div class="text-xs" style="color:var(--brand-800); font-weight:600;">Total Bonus & Insentif</div>
          <div style="font-size:22px; font-weight:800; color:var(--brand-800); margin: 3px 0;">
            ${UI.rupiah(bonus?.total_bonus || 0)}
          </div>
          <div class="text-xs">
            ${sudahCair 
              ? `<span class="badge b-selesai" style="font-size:10.5px;">Sudah Dicairkan</span>`
              : `<span class="badge b-menunggu" style="font-size:10.5px;">Menunggu Pencairan</span>`}
          </div>
        </div>

        <div class="absensi-stat-card stat-ok">
          <div class="text-xs" style="color:var(--ok-700); font-weight:600;">Kehadiran Kerja</div>
          <div style="font-size:22px; font-weight:800; color:var(--ok-700); margin: 3px 0;">
            ${rekap.hadir} hari
          </div>
          <div class="text-xs text-muted">Bulan ${NAMA_BULAN[filterBulan - 1]} ${filterTahun}</div>
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

      <!-- 3. RINCIAN KOMPONEN PENERIMAAN (GAJI & BONUS) -->
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
              Penetapan nominal bonus untuk bulan <b>${NAMA_BULAN[filterBulan - 1]} ${filterTahun}</b> sedang dalam proses oleh Pimpinan (Ibu Dede Kurniasih).
            </div>
          ` : `
            <table class="tbl w-full" style="font-size: 13px;">
              <thead><tr>
                <th>KOMPONEN PENERIMAAN</th>
                <th>KETERANGAN / DASAR PENILAIAN</th>
                <th class="text-right">JUMLAH (RP)</th>
              </tr></thead>
              <tbody>
                ${bonus.gaji_pokok > 0 ? `
                  <tr>
                    <td><b>Gaji Pokok / Tunjangan Tetap</b></td>
                    <td class="text-muted">Tunjangan tugas operasional bulanan</td>
                    <td class="mono text-right font-bold" style="color: #0F172A;">${UI.rupiah(bonus.gaji_pokok)}</td>
                  </tr>
                ` : ''}
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
                  <td class="text-muted">Insentif lembur atau apresiasi tambahan</td>
                  <td class="mono text-right font-bold" style="color: #0F172A;">${UI.rupiah(bonus.komponen_lainnya)}</td>
                </tr>
                <tr style="background: #F0FDF4;">
                  <td colspan="2" style="font-weight: 800; color: #166534; font-size: 14px;">TOTAL BONUS DITERIMA</td>
                  <td class="mono text-right font-bold" style="font-size: 15px; color: #166534;">${UI.rupiah(bonus.total_bonus)}</td>
                </tr>
                ${bonus.gaji_pokok > 0 ? `
                  <tr style="background: #ECFDF5; border-top: 2px solid #86EFAC;">
                    <td colspan="2" style="font-weight: 800; color: #064E3B; font-size: 15px;">TOTAL PENERIMAAN BERSIH (GAJI + BONUS)</td>
                    <td class="mono text-right font-bold" style="font-size: 17px; color: #064E3B;">${UI.rupiah(totalPenerimaan)}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>

            <div class="mt-16 flex items-center justify-between flex-wrap gap-10 text-xs" style="background:#F8FAFC; padding:10px 14px; border-radius:8px;">
              <div>
                <b>Status Pembayaran:</b> 
                ${sudahCair ? `<span class="badge b-selesai">Sudah Dicairkan (${UI.tglIndo(bonus.tanggal_bayar)})</span>` : `<span class="badge b-menunggu">Menunggu Proses Pencairan</span>`}
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
     CETAK SLIP RINCIAN BONUS RESMI
     ===================================================================== */
  function susunHtmlSlipCetak(pegawai, bonus, rekap) {
    const noSlip = bonus.nomor_slip || `SLP/LMU/${filterTahun}${String(filterBulan).padStart(2, '0')}/${pegawai.id.slice(0, 6).toUpperCase()}`;
    const tglCetak = UI.tglIndo(new Date(), true);
    const namaPeriode = `${NAMA_BULAN[filterBulan - 1]} ${filterTahun}`;

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Slip Bonus — ${UI.esc(pegawai.nama)} — ${namaPeriode}</title>
        <style>
          @page {
            size: A5 landscape;
            margin: 12mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 10px;
            color: #0F172A;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .slip-wrapper {
            border: 1.5px solid #0F8B7E;
            border-radius: 8px;
            padding: 16px 20px;
            background: #fff;
          }
          .kop-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0F8B7E;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .kop-brand {
            font-size: 18px;
            font-weight: 800;
            color: #0F8B7E;
            letter-spacing: 0.5px;
          }
          .kop-sub {
            font-size: 11px;
            color: #64748B;
            margin-top: 2px;
          }
          .slip-badge {
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            color: #166534;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
          }
          .slip-title {
            text-align: center;
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #0F172A;
            margin-bottom: 14px;
          }
          .identitas-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            font-size: 12px;
            margin-bottom: 12px;
            background: #F8FAFC;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #E2E8F0;
          }
          .tbl-rincian {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 14px;
          }
          .tbl-rincian th {
            background: #F1F5F9;
            padding: 7px 10px;
            text-align: left;
            border-bottom: 1.5px solid #CBD5E1;
            font-size: 11px;
            color: #475569;
          }
          .tbl-rincian td {
            padding: 8px 10px;
            border-bottom: 1px solid #F1F5F9;
          }
          .tbl-rincian .total-row td {
            background: #F0FDF4;
            font-size: 13.5px;
            font-weight: 800;
            color: #15803D;
            border-top: 1.5px solid #86EFAC;
            border-bottom: none;
          }
          .rekap-info-box {
            font-size: 11px;
            color: #475569;
            background: #FAF5FF;
            border: 1px solid #E9D5FF;
            padding: 6px 10px;
            border-radius: 6px;
            margin-bottom: 12px;
          }
          .ttd-box {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 16px;
            font-size: 11.5px;
          }
          .ttd-col {
            text-align: center;
            min-width: 170px;
          }
          .ttd-space {
            height: 44px;
          }
          .ttd-nama {
            font-weight: 800;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="slip-wrapper">
          <div class="kop-header">
            <div>
              <div class="kop-brand">LABORATORIUM MEDIS UTAMA</div>
              <div class="kop-sub">Jl. D.I. Panjaitan No.94, Purbalingga • Telp: (0281) 891234</div>
            </div>
            <div class="slip-badge">
              RESMI • DIBAYARKAN
            </div>
          </div>

          <div class="slip-title">SLIP RINCIAN BONUS & APRESIASI KARYAWAN</div>

          <div class="identitas-grid">
            <div><b>Nama Penerima:</b> ${UI.esc(pegawai.nama)}</div>
            <div><b>Periode Evaluasi:</b> ${namaPeriode}</div>
            <div><b>Jabatan:</b> ${UI.esc(pegawai.peran).toUpperCase()}</div>
            <div><b>Nomor Slip:</b> ${UI.esc(noSlip)}</div>
          </div>

          <div class="rekap-info-box">
            <b>Rangkuman Presensi:</b> Total Hadir: ${rekap.hadir} hari (Tepat Waktu: ${rekap.tepatWaktu} hari, Terlambat: ${rekap.terlambat} kali [${rekap.totalMenitTelat} menit]) • Izin: ${rekap.izinCuti} hari • Indeks Disiplin: <b>${rekap.disiplinPersen}%</b>
          </div>

          <table class="tbl-rincian">
            <thead>
              <tr>
                <th style="width: 40px;">NO</th>
                <th>KOMPONEN PENERIMAAN</th>
                <th style="text-align: right; width: 140px;">JUMLAH (RP)</th>
              </tr>
            </thead>
            <tbody>
              ${bonus.gaji_pokok > 0 ? `
                <tr>
                  <td>1</td>
                  <td><b>Gaji Pokok / Tunjangan Tetap</b><br><small style="color:#64748B;">Tunjangan tugas operasional bulanan</small></td>
                  <td style="text-align: right; font-family: monospace; font-size: 12.5px;">${UI.rupiah(bonus.gaji_pokok)}</td>
                </tr>
              ` : ''}
              <tr>
                <td>${bonus.gaji_pokok > 0 ? '2' : '1'}</td>
                <td><b>Bonus Kehadiran & Kedisiplinan Kerja</b><br><small style="color:#64748B;">Apresiasi kehadiran tepat waktu dan kepatuhan jam operasional</small></td>
                <td style="text-align: right; font-family: monospace; font-size: 12.5px;">${UI.rupiah(bonus.komponen_absensi)}</td>
              </tr>
              <tr>
                <td>${bonus.gaji_pokok > 0 ? '3' : '2'}</td>
                <td><b>Apresiasi Kinerja Pimpinan / Produktivitas Lab</b><br><small style="color:#64748B;">Penghargaan kualitas kerja dan dedikasi pelayanan laboratorium</small></td>
                <td style="text-align: right; font-family: monospace; font-size: 12.5px;">${UI.rupiah(bonus.komponen_kpi)}</td>
              </tr>
              <tr>
                <td>${bonus.gaji_pokok > 0 ? '4' : '3'}</td>
                <td><b>Insentif Tambahan / Tunjangan Khusus</b><br><small style="color:#64748B;">Insentif lembur atau apresiasi tambahan pimpinan</small></td>
                <td style="text-align: right; font-family: monospace; font-size: 12.5px;">${UI.rupiah(bonus.komponen_lainnya)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">TOTAL BONUS DITERIMA:</td>
                <td style="text-align: right; font-family: monospace;">${UI.rupiah(bonus.total_bonus)}</td>
              </tr>
            </tbody>
          </table>

          ${bonus.catatan ? `
            <div style="font-size: 11px; font-style: italic; color: #475569; margin-bottom: 8px;">
              <b>Pesan Motivasi Pimpinan:</b> "${UI.esc(bonus.catatan)}"
            </div>
          ` : ''}

          <div class="ttd-box">
            <div class="ttd-col">
              <div>Penerima,</div>
              <div class="ttd-space"></div>
              <div class="ttd-nama">${UI.esc(pegawai.nama)}</div>
              <div style="font-size: 10.5px; color: #64748B;">Karyawan</div>
            </div>
            <div class="ttd-col">
              <div>Purbalingga, ${tglCetak}</div>
              <div>Mengetahui & Menyetujui,</div>
              <div class="ttd-space"></div>
              <div class="ttd-nama">DEDE KURNIASIH</div>
              <div style="font-size: 10.5px; color: #64748B;">Kepala Laboratorium Medis Utama</div>
            </div>
          </div>
        </div>
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
    const namaPeriode = `${NAMA_BULAN[filterBulan - 1]} ${filterTahun}`;
    const noSlip = bonus.nomor_slip || `SLP/LMU/${filterTahun}${String(filterBulan).padStart(2, '0')}/${pegawai.id.slice(0, 6).toUpperCase()}`;

    UI.modal({
      judul: `Slip Rincian Bonus: ${UI.esc(pegawai.nama)}`,
      lebar: true,
      isi: `
        <div class="slip-bonus-card">
          <div class="slip-header">
            <div style="font-size: 18px; font-weight: 800; color: #0F8B7E; letter-spacing: 0.5px;">
              LABORATORIUM MEDIS UTAMA
            </div>
            <div style="font-size: 12px; color: #64748B; margin-top: 2px;">
              Layanan Diagnostik & Rekam Medis • Jl. D.I. Panjaitan No.94, Purbalingga
            </div>
            <div class="slip-title">SLIP RINCIAN BONUS & APRESIASI KARYAWAN</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12.5px; background: #F8FAFC; padding: 10px 14px; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 14px;">
            <div><b>Nama Karyawan:</b> ${UI.esc(pegawai.nama)}</div>
            <div><b>Periode:</b> ${namaPeriode}</div>
            <div><b>Jabatan / Peran:</b> ${UI.esc(pegawai.peran).toUpperCase()}</div>
            <div><b>Nomor Dokumen:</b> ${UI.esc(noSlip)}</div>
          </div>

          <div style="font-size: 12px; background: #FAF5FF; border: 1px solid #E9D5FF; color: #6B21A8; padding: 8px 12px; border-radius: 6px; margin-bottom: 14px;">
            <b>Rangkuman Kehadiran:</b> Hadir ${rekap.hadir} hari (Tepat Waktu: ${rekap.tepatWaktu} hari, Terlambat: ${rekap.terlambat} kali [${rekap.totalMenitTelat} mnt]) • Izin: ${rekap.izinCuti} hari • Indeks Disiplin: <b>${rekap.disiplinPersen}%</b>
          </div>

          <table class="slip-table">
            <thead>
              <tr>
                <th style="width: 40px;">NO</th>
                <th>KOMPONEN PENERIMAAN</th>
                <th style="text-align: right; width: 150px;">JUMLAH (RP)</th>
              </tr>
            </thead>
            <tbody>
              ${bonus.gaji_pokok > 0 ? `
                <tr>
                  <td>1</td>
                  <td>
                    <b>Gaji Pokok / Tunjangan Tetap</b>
                    <div class="text-xs text-muted">Tunjangan tugas operasional bulanan</div>
                  </td>
                  <td class="mono text-right font-bold" style="font-size: 13px;">${UI.rupiah(bonus.gaji_pokok)}</td>
                </tr>
              ` : ''}
              <tr>
                <td>${bonus.gaji_pokok > 0 ? '2' : '1'}</td>
                <td>
                  <b>Bonus Kehadiran & Kedisiplinan Kerja</b>
                  <div class="text-xs text-muted">Apresiasi atas kehadiran tepat waktu dan jam kerja penuh</div>
                </td>
                <td class="mono text-right font-bold" style="font-size: 13px;">${UI.rupiah(bonus.komponen_absensi)}</td>
              </tr>
              <tr>
                <td>${bonus.gaji_pokok > 0 ? '3' : '2'}</td>
                <td>
                  <b>Apresiasi Kinerja Pimpinan / Produktivitas Lab</b>
                  <div class="text-xs text-muted">Apresiasi mutu kerja dan dedikasi pelayanan laboratorium</div>
                </td>
                <td class="mono text-right font-bold" style="font-size: 13px;">${UI.rupiah(bonus.komponen_kpi)}</td>
              </tr>
              <tr>
                <td>${bonus.gaji_pokok > 0 ? '4' : '3'}</td>
                <td>
                  <b>Insentif Tambahan / Tunjangan Khusus</b>
                  <div class="text-xs text-muted">Insentif lembur atau apresiasi tambahan pimpinan</div>
                </td>
                <td class="mono text-right font-bold" style="font-size: 13px;">${UI.rupiah(bonus.komponen_lainnya)}</td>
              </tr>
              <tr class="slip-total-row">
                <td colspan="2" style="text-align: right; font-weight: 800;">TOTAL BONUS BERSIH:</td>
                <td class="mono text-right font-bold" style="font-size: 15px; color: #15803D;">${UI.rupiah(bonus.total_bonus)}</td>
              </tr>
            </tbody>
          </table>

          ${bonus.catatan ? `
            <div style="font-size: 12px; color: #475569; font-style: italic; margin-bottom: 16px; background: #F1F5F9; padding: 8px 12px; border-radius: 6px;">
              <b>Pesan Motivasi Pimpinan (Ibu Dede Kurniasih):</b> "${UI.esc(bonus.catatan)}"
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; font-size: 12px;">
            <div style="text-align: center; min-width: 160px;">
              <div>Penerima,</div>
              <div style="height: 48px;"></div>
              <div style="font-weight: 800; text-decoration: underline;">${UI.esc(pegawai.nama)}</div>
              <div class="text-muted text-xs">${UI.esc(pegawai.peran).toUpperCase()}</div>
            </div>
            <div style="text-align: center; min-width: 180px;">
              <div>Purbalingga, ${UI.tglIndo(new Date(), true)}</div>
              <div>Mengetahui & Menyetujui,</div>
              <div style="height: 48px;"></div>
              <div style="font-weight: 800; text-decoration: underline;">DEDE KURNIASIH</div>
              <div class="text-muted text-xs">Kepala Laboratorium Medis Utama</div>
            </div>
          </div>
        </div>
      `,
      tombol: [
        { teks: 'Tutup', nilai: false },
        {
          teks: `${UI.ikon('cetak', 14)} Cetak / Print Dokumen`,
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
