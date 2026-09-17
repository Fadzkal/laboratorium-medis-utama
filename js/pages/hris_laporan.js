/* =====================================================================
   HALAMAN: LAPORAN HRIS (Admin/Manajer)
   ---------------------------------------------------------------------
   Melihat rekap absensi, mengisi KPI, dan menghitung bonus.
   ===================================================================== */
const HrisLaporan = (() => {
  let w = null;
  let tabAktif = 'absensi';
  
  let dataAbsensi = [];
  let dataKpi = [];
  let dataBonus = [];
  let dataPegawai = [];

  const tanggalBulanIni = new Date();
  let filterBulan = tanggalBulanIni.getMonth() + 1;
  let filterTahun = tanggalBulanIni.getFullYear();

  async function render(el, param) {
    if (!App.boleh('master')) {
      el.innerHTML = UI.kosong('Akses ditolak', 'Anda tidak punya izin membuka Laporan HRIS.');
      return;
    }
    
    w = el;
    w.innerHTML = `
      <div class="mb-16 flex items-center justify-between">
        <div>
          <h1>Manajemen HRIS</h1>
          <p class="text-muted mb-0">Laporan Absensi, KPI, dan Perhitungan Bonus Bulanan.</p>
        </div>
        <div class="flex gap-6">
          <select id="filterBulan" class="mono">
            ${[...Array(12).keys()].map(i => `<option value="${i+1}" ${i+1===filterBulan?'selected':''}>Bulan ${i+1}</option>`).join('')}
          </select>
          <select id="filterTahun" class="mono">
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      </div>

      <div class="tabs" id="tabs">
        <button class="tab on" data-t="absensi">Rekap Absensi</button>
        <button class="tab" data-t="kpi">KPI Pegawai</button>
        <button class="tab" data-t="bonus">Bonus Bulanan</button>
      </div>
      
      <div id="isiTab" class="mt-16">${UI.memuat(3)}</div>
    `;

    w.querySelector('#filterBulan').addEventListener('change', e => { filterBulan = parseInt(e.target.value); muatUlang(); });
    w.querySelector('#filterTahun').addEventListener('change', e => { filterTahun = parseInt(e.target.value); muatUlang(); });

    w.querySelector('#tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-t]');
      if (!b) return;
      tabAktif = b.dataset.t;
      w.querySelectorAll('#tabs .tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      gambarTab();
    });

    await muatDataDasar();
    await muatUlang();
  }
  
  async function muatDataDasar() {
    dataPegawai = await DB.daftarPegawai();
  }

  async function muatUlang() {
    w.querySelector('#isiTab').innerHTML = UI.memuat(3);
    
    const awalBulan = new Date(filterTahun, filterBulan - 1, 1).toISOString().split('T')[0];
    const akhirBulan = new Date(filterTahun, filterBulan, 0).toISOString().split('T')[0];
    
    try {
      [dataAbsensi, dataKpi, dataBonus] = await Promise.all([
        DB.absensiLaporan(awalBulan, akhirBulan),
        DB.kpiDaftar(filterBulan, filterTahun),
        DB.bonusDaftar(filterBulan, filterTahun)
      ]);
      gambarTab();
    } catch (e) {
      w.querySelector('#isiTab').innerHTML = `<div class="banner err"><div>Gagal memuat data: ${UI.esc(e.message)}</div></div>`;
    }
  }

  function gambarTab() {
    const isi = w.querySelector('#isiTab');
    if (tabAktif === 'absensi') tabAbsensi(isi);
    if (tabAktif === 'kpi') tabKpi(isi);
    if (tabAktif === 'bonus') tabBonus(isi);
  }

  /* ------------------- ABSENSI ------------------- */
  function tabAbsensi(isi) {
    if (!dataAbsensi.length) {
      isi.innerHTML = `<div class="card p-16 text-center text-muted">Belum ada data absensi di bulan ini.</div>`;
      return;
    }
    
    isi.innerHTML = `
      <div class="card">
        <div class="table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>Pegawai</th>
            <th>Tanggal</th>
            <th>Masuk</th>
            <th>Keluar</th>
            <th>Status</th>
          </tr></thead>
          <tbody>
            ${dataAbsensi.map(a => `
              <tr>
                <td><b>${UI.esc(a.pegawai?.nama || '')}</b><br><span class="text-xs text-muted">${UI.esc(a.pegawai?.peran || '')}</span></td>
                <td>${UI.tglIndo(a.tanggal)}</td>
                <td class="mono">${a.waktu_masuk ? UI.jam(a.waktu_masuk) : '—'}</td>
                <td class="mono">${a.waktu_keluar ? UI.jam(a.waktu_keluar) : '—'}</td>
                <td><span class="badge ${a.status === 'HADIR' ? 'b-selesai' : 'b-batal'}">${UI.esc(a.status)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  /* ------------------- KPI ------------------- */
  function tabKpi(isi) {
    isi.innerHTML = `
      <div class="flex items-center justify-between mb-12">
        <div class="banner info mb-0" style="flex:1; margin-right: 16px;">
          <div>Masukkan nilai Indikator Kinerja Utama (KPI) untuk pegawai bulan ini.</div>
        </div>
        <button class="btn btn-primary" id="btnTambahKpi">${UI.ikon('plus',15)} Tambah KPI</button>
      </div>
      
      ${dataKpi.length ? `
        <div class="card">
          <div class="table-wrap"><table class="tbl w-full">
            <thead><tr>
              <th>Pegawai</th>
              <th>Metrik KPI</th>
              <th>Target</th>
              <th>Capaian</th>
              <th>Nilai (%)</th>
            </tr></thead>
            <tbody>
              ${dataKpi.map(k => `
                <tr>
                  <td><b>${UI.esc(k.pegawai?.nama || '')}</b></td>
                  <td>${UI.esc(k.metrik)}</td>
                  <td class="mono">${k.target}</td>
                  <td class="mono">${k.capaian}</td>
                  <td><span class="badge ${k.nilai >= 100 ? 'b-selesai' : k.nilai >= 80 ? 'b-menunggu' : 'b-batal'}">${k.nilai}%</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table></div>
        </div>
      ` : `<div class="card p-16 text-center text-muted">Belum ada data KPI untuk bulan ini.</div>`}
    `;
    
    isi.querySelector('#btnTambahKpi').addEventListener('click', dialogKpi);
  }
  
  async function dialogKpi() {
    const hasil = await UI.modal({
      judul: 'Tambah Nilai KPI',
      isi: `
        <div class="field"><label>Pegawai</label>
          <select name="pegawai_id" class="w-full">
            ${dataPegawai.map(p => `<option value="${p.id}">${UI.esc(p.nama)} - ${UI.esc(p.peran)}</option>`).join('')}
          </select></div>
        <div class="field"><label>Metrik Indikator</label>
          <input type="text" name="metrik" class="w-full" placeholder="mis. Jumlah pasien dilayani, atau Ketepatan waktu" required></div>
        <div class="form-row">
          <div class="field"><label>Target (Angka)</label>
            <input type="number" name="target" class="w-full" value="100" required></div>
          <div class="field"><label>Capaian (Angka)</label>
            <input type="number" name="capaian" class="w-full" value="0" required></div>
        </div>
        <div id="galatKpi"></div>
      `,
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan', kelas: 'btn-primary', aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            if (!d.metrik || !d.target || !d.capaian) return false;
            try {
              await DB.kpiSimpan({
                pegawai_id: d.pegawai_id, bulan: filterBulan, tahun: filterTahun,
                metrik: d.metrik, target: Number(d.target), capaian: Number(d.capaian)
              });
              return true;
            } catch (e) {
              badan.querySelector('#galatKpi').innerHTML = `<div class="banner err"><div>${UI.esc(e.message)}</div></div>`;
              return false;
            }
          }
        }
      ]
    });
    
    if (hasil) {
      UI.toast('KPI berhasil disimpan.', 'ok');
      await muatUlang();
    }
  }

  /* ------------------- BONUS ------------------- */
  function tabBonus(isi) {
    isi.innerHTML = `
      <div class="flex items-center justify-between mb-12">
        <div class="banner info mb-0" style="flex:1; margin-right: 16px;">
          <div>Hitung dan cetak pembayaran bonus berdasarkan absensi dan KPI.</div>
        </div>
        <button class="btn btn-primary" id="btnHitungBonus">${UI.ikon('plus',15)} Kalkulasi Bonus</button>
      </div>
      
      ${dataBonus.length ? `
        <div class="card">
          <div class="table-wrap"><table class="tbl w-full">
            <thead><tr>
              <th>Pegawai</th>
              <th class="text-right">Bonus KPI</th>
              <th class="text-right">Insentif Lainnya</th>
              <th class="text-right">Total Bonus</th>
              <th>Status</th>
            </tr></thead>
            <tbody>
              ${dataBonus.map(b => `
                <tr>
                  <td><b>${UI.esc(b.pegawai?.nama || '')}</b></td>
                  <td class="mono text-right">${UI.uang(b.komponen_kpi)}</td>
                  <td class="mono text-right">${UI.uang(b.komponen_lainnya)}</td>
                  <td class="mono text-right font-bold text-lg">${UI.uang(b.total_bonus)}</td>
                  <td><span class="badge ${b.status_bayar === 'DIBAYAR' ? 'b-selesai' : 'b-menunggu'}">${UI.esc(b.status_bayar)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table></div>
        </div>
      ` : `<div class="card p-16 text-center text-muted">Belum ada perhitungan bonus untuk bulan ini.</div>`}
    `;
    
    isi.querySelector('#btnHitungBonus').addEventListener('click', dialogBonus);
  }
  
  async function dialogBonus() {
    const hasil = await UI.modal({
      judul: 'Input Pencairan Bonus',
      isi: `
        <div class="field"><label>Pegawai</label>
          <select name="pegawai_id" class="w-full">
            ${dataPegawai.map(p => `<option value="${p.id}">${UI.esc(p.nama)} - ${UI.esc(p.peran)}</option>`).join('')}
          </select></div>
        <div class="form-row">
          <div class="field"><label>Nilai Bonus KPI (Rp)</label>
            <input type="number" name="komponen_kpi" class="w-full" value="0"></div>
          <div class="field"><label>Insentif/Potongan Lain (Rp)</label>
            <input type="number" name="komponen_lainnya" class="w-full" value="0">
            <div class="hint">Gunakan angka minus untuk potongan.</div></div>
        </div>
        <div class="field"><label>Status Pembayaran</label>
          <select name="status_bayar" class="w-full">
            <option value="BELUM">Belum Dibayar</option>
            <option value="DIBAYAR">Sudah Dibayar</option>
          </select></div>
        <div id="galatBonus"></div>
      `,
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan', kelas: 'btn-primary', aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            try {
              await DB.bonusSimpan({
                pegawai_id: d.pegawai_id, bulan: filterBulan, tahun: filterTahun,
                komponen_absensi: 0, 
                komponen_kpi: Number(d.komponen_kpi), 
                komponen_lainnya: Number(d.komponen_lainnya),
                status_bayar: d.status_bayar,
                tanggal_bayar: d.status_bayar === 'DIBAYAR' ? UI.hariIni() : null
              });
              return true;
            } catch (e) {
              badan.querySelector('#galatBonus').innerHTML = `<div class="banner err"><div>${
                /unique|duplicate/i.test(e.message) ? 'Bonus untuk pegawai ini di bulan ini sudah ada.' : UI.esc(e.message)
              }</div></div>`;
              return false;
            }
          }
        }
      ]
    });
    
    if (hasil) {
      UI.toast('Perhitungan bonus disimpan.', 'ok');
      await muatUlang();
    }
  }

  return { render };
})();
