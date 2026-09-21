/* =====================================================================
   HALAMAN: INKASO & INVENTORI BARANG UMUM (LOGISTIK LAB)
   ---------------------------------------------------------------------
   Pusat kendali reagen & BHP laboratorium terpadu:
   1. 4 Kartu KPI Eksekutif (Total Reagen, Stok Kritis, Alert FEFO, Nilai Aset).
   2. Tab 1: Katalog Stok & Reagen (Pencarian, Filter Menipis/Exp, Kelola Batch).
   3. Tab 2: Pusat Peringatan FEFO (First Expired First Out Alert Center).
   4. Tab 3: Riwayat Mutasi Lengkap (Pembelian, Tes Lab, Kalibrasi/QC, Waste, Opname).
   5. Tab 4: Laporan Stok Opname & Ekspor Cetak / CSV Resmi.
   ===================================================================== */
const InkasoBarang = (() => {
  let w = null;
  let tabAktif = 'katalog'; // 'katalog' | 'fefo' | 'riwayat' | 'opname'

  let dataBarang = [];
  let dataBatch = [];
  let dataRiwayat = [];

  // Filter states
  let chipKatalog = 'semua'; // 'semua' | 'menipis' | 'exp'
  let katKatalog = '';
  let cariKatalog = '';

  let chipFefo = 'semua'; // 'semua' | 'expired' | 'kritis' | 'aman'
  let cariFefo = '';

  let jenisRiwayat = 'SEMUA';
  let cariRiwayat = '';

  let katOpname = '';
  let cariOpname = '';
  let hitungFisikMap = {}; // id_barang -> number

  async function render(el, param) {
    if (!App.boleh('menu_inkaso') && !App.boleh('master') && !App.boleh('admin') && !App.boleh('karyawan') && !App.boleh('inkaso')) {
      el.innerHTML = UI.kosong('Akses ditolak', 'Anda tidak memiliki izin untuk mengakses modul Inventori & Logistik Lab.');
      return;
    }

    w = el;
    w.innerHTML = `
      <div class="mb-16 flex items-center justify-between flex-wrap gap-8 no-print">
        <div>
          <h1 class="mb-2">Logistik &amp; Inventori Reagen Lab</h1>
          <p class="text-muted mb-0">Manajemen reagen, pemantauan masa kadaluwarsa (FEFO), pencatatan batch, mutasi, dan stok opname.</p>
        </div>
        <div class="flex gap-8 items-center">
          <button class="btn btn-secondary btn-sm" id="btnSegarkan">${UI.ikon('ulang', 15)} Segarkan Data</button>
          <button class="btn btn-primary btn-sm" id="btnTambahBarangUtama">${UI.ikon('plus', 15)} Tambah Master Reagen</button>
        </div>
      </div>

      <!-- KPI Executive Stat Cards -->
      <div class="stat-grid mb-16 no-print" id="kpiCards">
        ${renderKpiPlaceholder()}
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs no-print" id="tabsInventori">
        <button class="tab on" data-t="katalog">${UI.ikon('dokumen', 15)} Katalog Stok &amp; Reagen</button>
        <button class="tab" data-t="fefo">${UI.ikon('peringatan', 15)} Pusat Peringatan FEFO <span class="badge b-warn ml-4" id="badgeFefoCount" style="display:none">0</span></button>
        <button class="tab" data-t="riwayat">${UI.ikon('jam', 15)} Riwayat Mutasi</button>
        <button class="tab" data-t="opname">${UI.ikon('grafik', 15)} Laporan Stok Opname &amp; Cetak</button>
      </div>

      <!-- Main Content Area -->
      <div id="isiTab" class="mt-16">${UI.memuat(4)}</div>
    `;

    // Event listeners
    w.querySelector('#btnSegarkan').addEventListener('click', () => muatUlang(true));
    w.querySelector('#btnTambahBarangUtama').addEventListener('click', () => dialogBarang());

    w.querySelector('#tabsInventori').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-t]');
      if (!b) return;
      tabAktif = b.dataset.t;
      w.querySelectorAll('#tabsInventori .tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      gambarTab();
    });

    await muatUlang(false);
  }

  function renderKpiPlaceholder() {
    return `
      <div class="card p-12"><div class="skeleton sk-row"></div></div>
      <div class="card p-12"><div class="skeleton sk-row"></div></div>
      <div class="card p-12"><div class="skeleton sk-row"></div></div>
      <div class="card p-12"><div class="skeleton sk-row"></div></div>
    `;
  }

  async function muatUlang(notif = false) {
    const isi = w.querySelector('#isiTab');
    if (!isi) return;
    if (notif) isi.innerHTML = UI.memuat(3);

    try {
      const [resBarang, resBatch, resRiwayat] = await Promise.all([
        DB.inventoriDaftar(),
        DB.inventoriBatchDaftar(),
        DB.inventoriRiwayat(null, 250)
      ]);

      dataBarang = resBarang || [];
      dataBatch = resBatch || [];
      dataRiwayat = resRiwayat || [];

      updateKpiCards();
      gambarTab();

      if (notif) UI.toast('Data logistik & inventori telah dimutakhirkan.', 'ok');
    } catch (e) {
      isi.innerHTML = `<div class="banner err"><div>Gagal memuat data inventori: ${UI.esc(e.message)}</div></div>`;
    }
  }

  /* ------------------- KPI CARDS ------------------- */
  function updateKpiCards() {
    const elKpi = w.querySelector('#kpiCards');
    if (!elKpi) return;

    const hariIni = UI.hariIni();
    const tglHariIni = new Date(hariIni);

    // 1. Total Reagen Aktif
    const barangAktif = dataBarang.filter(b => b.aktif !== false);
    const totalItem = barangAktif.length;
    const kategoriSet = new Set(barangAktif.map(b => b.kategori || 'Umum'));

    // 2. Stok Menipis / Kritis
    const stokMenipisList = barangAktif.filter(b => (Number(b.stok_sekarang_usage) || 0) <= (Number(b.stok_minimum_usage) || 0));
    const totalMenipis = stokMenipisList.length;

    // 3. FEFO: Expired & Near Expired (< 30 hari)
    let totalExpired = 0;
    let totalNearExp = 0;

    dataBatch.forEach(bt => {
      if ((Number(bt.stok_sekarang_usage) || 0) <= 0) return;
      if (!bt.expired_date) return;
      const tglExp = new Date(bt.expired_date);
      const diffHari = Math.ceil((tglExp - tglHariIni) / (1000 * 60 * 60 * 24));
      if (diffHari <= 0) {
        totalExpired++;
      } else if (diffHari <= 30) {
        totalNearExp++;
      }
    });

    const totalAlertFefo = totalExpired + totalNearExp;

    // Update badge di header tab
    const badgeFefo = w.querySelector('#badgeFefoCount');
    if (badgeFefo) {
      if (totalAlertFefo > 0) {
        badgeFefo.textContent = totalAlertFefo;
        badgeFefo.style.display = 'inline-block';
        badgeFefo.className = `badge ml-4 ${totalExpired > 0 ? 'b-batal' : 'b-warn'}`;
      } else {
        badgeFefo.style.display = 'none';
      }
    }

    // 4. Estimasi Nilai Aset Stok (HPP)
    let totalNilaiAset = 0;
    dataBatch.forEach(bt => {
      const stok = Number(bt.stok_sekarang_usage) || 0;
      const hpp = Number(bt.cost_per_usage_unit) || 0;
      if (stok > 0 && hpp > 0) {
        totalNilaiAset += (stok * hpp);
      }
    });

    elKpi.innerHTML = `
      <div class="card stat" style="border-left: 4px solid var(--primary-500);">
        <div class="flex items-center justify-between">
          <div class="lbl">Total Reagen &amp; BHP Aktif</div>
          <span class="text-muted">${UI.ikon('dokumen', 16)}</span>
        </div>
        <div class="val">${totalItem}</div>
        <div class="sub text-muted">${kategoriSet.size} kategori spesialis lab</div>
      </div>

      <div class="card stat cursor-pointer" id="kpiMenipisCard" style="border-left: 4px solid ${totalMenipis > 0 ? 'var(--danger-500, #dc2626)' : 'var(--ok-500, #16a34a)'};">
        <div class="flex items-center justify-between">
          <div class="lbl">Stok Menipis / Kritis</div>
          <span class="${totalMenipis > 0 ? 'text-red-600' : 'text-muted'}">${UI.ikon('peringatan', 16)}</span>
        </div>
        <div class="val ${totalMenipis > 0 ? 'text-red-600 font-bold' : ''}">${totalMenipis}</div>
        <div class="sub ${totalMenipis > 0 ? 'text-red-600' : 'text-muted'}">${totalMenipis > 0 ? 'Perlu pengadaan segera' : 'Semua stok dalam batas aman'}</div>
      </div>

      <div class="card stat cursor-pointer" id="kpiFefoCard" style="border-left: 4px solid ${totalExpired > 0 ? 'var(--danger-500, #dc2626)' : (totalNearExp > 0 ? 'var(--warn-600, #d97706)' : 'var(--ok-500, #16a34a)')};">
        <div class="flex items-center justify-between">
          <div class="lbl">Peringatan Kadaluwarsa</div>
          <span class="${totalAlertFefo > 0 ? 'text-warn' : 'text-muted'}">${UI.ikon('jam', 16)}</span>
        </div>
        <div class="val ${totalExpired > 0 ? 'text-red-600 font-bold' : (totalNearExp > 0 ? 'text-warn font-bold' : '')}">${totalAlertFefo}</div>
        <div class="sub text-muted">
          ${totalExpired > 0 ? `<b class="text-red-600">${totalExpired} Expired</b>, ` : ''}${totalNearExp} Near-Exp (&le; 30 hr)
        </div>
      </div>

      <div class="card stat" style="border-left: 4px solid var(--primary-700, #0284c7);">
        <div class="flex items-center justify-between">
          <div class="lbl">Estimasi Nilai Aset Stok</div>
          <span class="text-muted">${UI.ikon('grafik', 16)}</span>
        </div>
        <div class="val sm">Rp ${Math.round(totalNilaiAset).toLocaleString('id-ID')}</div>
        <div class="sub text-muted">Akumulasi HPP dari batch aktif</div>
      </div>
    `;

    // Quick click handlers on KPI cards
    const cMenipis = elKpi.querySelector('#kpiMenipisCard');
    if (cMenipis) {
      cMenipis.addEventListener('click', () => {
        tabAktif = 'katalog';
        chipKatalog = 'menipis';
        sinkronTabTombol();
        gambarTab();
      });
    }

    const cFefo = elKpi.querySelector('#kpiFefoCard');
    if (cFefo) {
      cFefo.addEventListener('click', () => {
        tabAktif = 'fefo';
        chipFefo = totalExpired > 0 ? 'expired' : 'kritis';
        sinkronTabTombol();
        gambarTab();
      });
    }
  }

  function sinkronTabTombol() {
    w.querySelectorAll('#tabsInventori .tab').forEach(x => {
      x.classList.toggle('on', x.dataset.t === tabAktif);
    });
  }

  function gambarTab() {
    const isi = w.querySelector('#isiTab');
    if (!isi) return;
    if (tabAktif === 'katalog') tabKatalog(isi);
    else if (tabAktif === 'fefo') tabFefo(isi);
    else if (tabAktif === 'riwayat') tabRiwayat(isi);
    else if (tabAktif === 'opname') tabOpname(isi);
  }

  /* =====================================================================
     TAB 1: KATALOG STOK & REAGEN
     ===================================================================== */
  function tabKatalog(isi) {
    const kategoris = Array.from(new Set(dataBarang.map(b => b.kategori).filter(Boolean))).sort();

    isi.innerHTML = `
      <div class="card p-12 mb-16 no-print">
        <div class="flex items-center justify-between flex-wrap gap-8">
          <!-- Filter Chips -->
          <div class="flex gap-4 items-center flex-wrap">
            <span class="text-xs text-muted font-bold mr-4">Filter:</span>
            <button class="btn btn-sm ${chipKatalog === 'semua' ? 'btn-primary' : 'btn-ghost'}" id="chipSemua">Semua Item (${dataBarang.length})</button>
            <button class="btn btn-sm ${chipKatalog === 'menipis' ? 'btn-danger' : 'btn-ghost'}" id="chipMenipis">Stok Kritis / Menipis</button>
            <button class="btn btn-sm ${chipKatalog === 'exp' ? 'btn-secondary' : 'btn-ghost'}" id="chipExp">Mendekati Kadaluwarsa</button>
          </div>

          <!-- Search & Category Dropdown -->
          <div class="flex gap-8 items-center flex-wrap" style="flex: 1; justify-content: flex-end; min-width: 320px;">
            <select id="selKategoriKatalog" class="form-control" style="width: auto; max-width: 180px;">
              <option value="">Semua Kategori</option>
              ${kategoris.map(k => `<option value="${UI.esc(k)}" ${katKatalog === k ? 'selected' : ''}>${UI.esc(k)}</option>`).join('')}
            </select>
            <div class="field mb-0" style="width: 220px;">
              <input type="text" id="inpCariKatalog" class="w-full" placeholder="Cari kode / nama..." value="${UI.esc(cariKatalog)}">
            </div>
            <button class="btn btn-primary btn-sm" id="btnTambahBarang">${UI.ikon('plus', 14)} Tambah Barang</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="tbl w-full">
            <thead>
              <tr>
                <th style="width: 32%;">Nama Reagen &amp; Kategori</th>
                <th class="text-right" style="width: 16%;">Stok Pemakaian</th>
                <th class="text-right" style="width: 14%;">Batas Minimum</th>
                <th style="width: 18%;">Satuan &amp; Konversi</th>
                <th style="width: 20%;" class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="tbodyKatalog">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Filter Chip Events
    isi.querySelector('#chipSemua').addEventListener('click', () => { chipKatalog = 'semua'; renderTabelKatalog(); });
    isi.querySelector('#chipMenipis').addEventListener('click', () => { chipKatalog = 'menipis'; renderTabelKatalog(); });
    isi.querySelector('#chipExp').addEventListener('click', () => { chipKatalog = 'exp'; renderTabelKatalog(); });

    // Inputs
    const selKat = isi.querySelector('#selKategoriKatalog');
    selKat.addEventListener('change', () => { katKatalog = selKat.value; renderTabelKatalog(); });

    const inpCari = isi.querySelector('#inpCariKatalog');
    inpCari.addEventListener('input', UI.tunda(() => { cariKatalog = inpCari.value.trim(); renderTabelKatalog(); }, 250));

    isi.querySelector('#btnTambahBarang').addEventListener('click', () => dialogBarang());

    renderTabelKatalog();
  }

  function renderTabelKatalog() {
    const tbody = w.querySelector('#tbodyKatalog');
    if (!tbody) return;

    const hariIni = UI.hariIni();
    const tglHariIni = new Date(hariIni);

    // Kumpulkan batch aktif per barang_id untuk cek kadaluwarsa terdekat
    const batchMapByBarang = {};
    dataBatch.forEach(bt => {
      if ((Number(bt.stok_sekarang_usage) || 0) <= 0) return;
      if (!batchMapByBarang[bt.barang_id]) batchMapByBarang[bt.barang_id] = [];
      batchMapByBarang[bt.barang_id].push(bt);
    });

    const k = cariKatalog.toLowerCase();
    const filter = dataBarang.filter(b => {
      // 1. Text Search
      const nama = (b.nama || '').toLowerCase();
      const kode = (b.kode || '').toLowerCase();
      const kat = (b.kategori || '').toLowerCase();
      if (k && !nama.includes(k) && !kode.includes(k) && !kat.includes(k)) return false;

      // 2. Category Dropdown
      if (katKatalog && b.kategori !== katKatalog) return false;

      // 3. Filter Chips
      const stok = Number(b.stok_sekarang_usage) || 0;
      const min = Number(b.stok_minimum_usage) || 0;
      if (chipKatalog === 'menipis') {
        return stok <= min;
      }
      if (chipKatalog === 'exp') {
        const bts = batchMapByBarang[b.id] || [];
        return bts.some(bt => {
          if (!bt.expired_date) return false;
          const diff = Math.ceil((new Date(bt.expired_date) - tglHariIni) / (1000 * 60 * 60 * 24));
          return diff <= 30; // expired or near-exp
        });
      }
      return true;
    });

    // Update styling on chip buttons
    const cAll = w.querySelector('#chipSemua');
    const cMen = w.querySelector('#chipMenipis');
    const cExp = w.querySelector('#chipExp');
    if (cAll) cAll.className = `btn btn-sm ${chipKatalog === 'semua' ? 'btn-primary' : 'btn-ghost'}`;
    if (cMen) cMen.className = `btn btn-sm ${chipKatalog === 'menipis' ? 'btn-danger' : 'btn-ghost'}`;
    if (cExp) cExp.className = `btn btn-sm ${chipKatalog === 'exp' ? 'btn-secondary' : 'btn-ghost'}`;

    if (!filter.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center p-24 text-muted">Tidak ada reagen / barang logistik yang sesuai kriteria pencarian.</td></tr>`;
      return;
    }

    tbody.innerHTML = filter.map(b => {
      const stok = Number(b.stok_sekarang_usage) || 0;
      const min = Number(b.stok_minimum_usage) || 0;
      const isHabis = stok <= 0;
      const isMenipis = !isHabis && stok <= min;

      // Temukan batch FEFO terdekat
      const bts = (batchMapByBarang[b.id] || []).sort((x, y) => (x.expired_date > y.expired_date ? 1 : -1));
      const nextBatch = bts[0] || null;

      let expBadge = '';
      if (nextBatch && nextBatch.expired_date) {
        const diff = Math.ceil((new Date(nextBatch.expired_date) - tglHariIni) / (1000 * 60 * 60 * 24));
        if (diff <= 0) {
          expBadge = `<span class="badge b-batal ml-4" title="Batch ${UI.esc(nextBatch.batch_number)} telah expired">Expired (${UI.tglPendek(nextBatch.expired_date)})</span>`;
        } else if (diff <= 30) {
          expBadge = `<span class="badge b-warn ml-4" title="Batch ${UI.esc(nextBatch.batch_number)} mendekati expired">${diff} hari (${UI.tglPendek(nextBatch.expired_date)})</span>`;
        } else {
          expBadge = `<span class="text-xs text-muted block mt-2">Batch terdekat: <b>${UI.esc(nextBatch.batch_number)}</b> (Exp ${UI.tglPendek(nextBatch.expired_date)})</span>`;
        }
      }

      return `
        <tr ${b.aktif ? '' : 'style="opacity: 0.65; background: var(--surface-subtle);"'}>
          <td>
            <div class="flex items-center gap-6 flex-wrap">
              <b>${UI.esc(b.nama)}</b>
              ${b.kode ? `<span class="badge b-netral mono text-xs">${UI.esc(b.kode)}</span>` : ''}
              <span class="badge b-netral">${UI.esc(b.kategori || 'Umum')}</span>
              ${!b.aktif ? '<span class="badge b-batal">Nonaktif</span>' : ''}
            </div>
            ${expBadge}
          </td>
          <td class="text-right">
            <div class="mono text-lg font-bold ${isHabis ? 'text-red-600' : isMenipis ? 'text-warn' : 'text-ok'}">
              ${stok.toLocaleString('id-ID')} <span class="text-xs font-normal text-muted">${UI.esc(b.usage_unit)}</span>
            </div>
            ${isHabis ? '<span class="badge b-batal text-xs">Stok Habis</span>' : isMenipis ? '<span class="badge b-warn text-xs">Menipis</span>' : '<span class="badge b-ok text-xs">Aman</span>'}
          </td>
          <td class="text-right mono text-muted">
            ${min > 0 ? `${min.toLocaleString('id-ID')} ${UI.esc(b.usage_unit)}` : '<span class="text-xs">-</span>'}
          </td>
          <td>
            <span class="text-muted text-sm">Beli: <b>${UI.esc(b.purchase_unit || 'Box')}</b></span>
            <div class="text-xs text-muted mt-2">1 ${UI.esc(b.purchase_unit || 'Box')} = ${b.conversion_factor || 1} ${UI.esc(b.usage_unit)}</div>
          </td>
          <td class="text-right whitespace-nowrap">
            <button class="btn btn-primary btn-sm" data-batch-id="${b.id}" title="Kelola stok dan lot batch">${UI.ikon('pil', 13)} Kelola Batch</button>
            <button class="btn btn-secondary btn-sm" data-edit-id="${b.id}" title="Ubah parameter master barang">${UI.ikon('pensil', 13)} Edit</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('button[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = dataBarang.find(x => x.id === btn.dataset.editId);
        if (b) dialogBarang(b);
      });
    });

    tbody.querySelectorAll('button[data-batch-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = dataBarang.find(x => x.id === btn.dataset.batchId);
        if (b) dialogBatch(b);
      });
    });
  }

  /* ------------------- DIALOG MASTER BARANG ------------------- */
  async function dialogBarang(b = null) {
    const hasil = await UI.modal({
      judul: b ? 'Edit Master Reagen & Barang' : 'Tambah Master Reagen Baru',
      lebar: true,
      isi: `
        <div class="form-row c2">
          <div class="field">
            <label>Kode Barang / Reagen (Opsional)</label>
            <input type="text" name="kode" class="w-full mono" value="${UI.esc(b?.kode || '')}" placeholder="mis. REG-HEM-001">
          </div>
          <div class="field">
            <label>Nama Reagen / Item Logistik <span class="req">*</span></label>
            <input type="text" name="nama" class="w-full" value="${UI.esc(b?.nama || '')}" required placeholder="mis. Reagen Hematologi Diluent">
          </div>
        </div>

        <div class="form-row c3">
          <div class="field">
            <label>Satuan Pembelian (Penerimaan)</label>
            <input type="text" name="purchase_unit" class="w-full" value="${UI.esc(b?.purchase_unit || 'Box')}" placeholder="Box / Botol / Kit">
          </div>
          <div class="field">
            <label>Satuan Pemakaian (Lab/Uji) <span class="req">*</span></label>
            <input type="text" name="usage_unit" class="w-full" value="${UI.esc(b?.usage_unit || 'mL')}" placeholder="mL / Test / Pcs" required>
          </div>
          <div class="field">
            <label>Rasio Konversi</label>
            <input type="number" name="conversion_factor" step="0.01" min="0.01" class="w-full" value="${b?.conversion_factor || 1}" placeholder="1 Box = ... mL">
            <div class="hint mt-2">Contoh: 1 Box = 500 mL, isi 500.</div>
          </div>
        </div>

        <div class="form-row c3">
          <div class="field">
            <label>Kategori Logistik</label>
            <input type="text" name="kategori" class="w-full" value="${UI.esc(b?.kategori || 'Reagen')}" placeholder="Hematologi / Kimia Klinik / BHP">
          </div>
          <div class="field">
            <label>Ambang Batas Minimum (Usage)</label>
            <input type="number" name="stok_minimum_usage" class="w-full" min="0" value="${b?.stok_minimum_usage || 0}">
            <div class="hint mt-2">Peringatan aktif bila sisa stok &le; angka ini.</div>
          </div>
          <div class="field">
            <label>Status Operasional</label>
            <select name="aktif" class="w-full">
              <option value="true" ${b?.aktif !== false ? 'selected' : ''}>Aktif Digunakan</option>
              <option value="false" ${b?.aktif === false ? 'selected' : ''}>Nonaktif / Diarsipkan</option>
            </select>
          </div>
        </div>
        <div id="galatBarang"></div>
      `,
      tombol: [
        ...(b ? [{
          teks: 'Hapus Reagen',
          kelas: 'btn-secondary',
          aksi: async () => {
            if (!await UI.konfirmasi('Hapus Master Reagen', `Yakin ingin menghapus reagen "${b.nama}" secara permanen?`, 'Hapus')) return false;
            try {
              await DB.inventoriHapus(b.id);
              return true;
            } catch (e) {
              UI.toast('Gagal menghapus. Reagen telah memiliki riwayat mutasi atau batch.', 'err');
              return false;
            }
          }
        }] : []),
        { teks: 'Batal', nilai: null },
        {
          teks: 'Simpan Reagen',
          kelas: 'btn-primary',
          aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            if (!d.nama || !d.usage_unit) {
              badan.querySelector('#galatBarang').innerHTML = '<div class="banner err">Nama dan satuan pemakaian wajib diisi.</div>';
              return false;
            }
            try {
              await DB.inventoriSimpan({
                kode: d.kode ? d.kode.trim() : null,
                nama: d.nama.trim(),
                kategori: d.kategori ? d.kategori.trim() : 'Umum',
                purchase_unit: d.purchase_unit ? d.purchase_unit.trim() : 'Box',
                usage_unit: d.usage_unit.trim(),
                conversion_factor: Number(d.conversion_factor) || 1,
                stok_minimum_usage: Number(d.stok_minimum_usage) || 0,
                aktif: d.aktif === 'true'
              }, b?.id || null);
              return true;
            } catch (e) {
              badan.querySelector('#galatBarang').innerHTML = `<div class="banner err">${/unique/.test(e.message) ? 'Kode barang sudah terdaftar.' : UI.esc(e.message)}</div>`;
              return false;
            }
          }
        }
      ]
    });

    if (hasil) {
      UI.toast(b ? 'Master reagen berhasil diperbarui.' : 'Master reagen berhasil ditambahkan.', 'ok');
      await muatUlang(false);
    }
  }

  /* =====================================================================
     BATCH MODAL (FEFO PER ITEM)
     ===================================================================== */
  async function dialogBatch(barang) {
    let batches = await DB.inventoriBatchDaftar(barang.id);

    const gambarB = (badan) => {
      const tb = badan.querySelector('#daftarBatch');
      const hariIni = UI.hariIni();
      const tglHariIni = new Date(hariIni);

      const totalStokBatch = batches.reduce((acc, x) => acc + (Number(x.stok_sekarang_usage) || 0), 0);

      tb.innerHTML = !batches.length ? `
        <div class="empty p-24 text-center text-muted">
          ${UI.ikon('dokumen', 36)}
          <h4 class="mt-8 mb-4">Belum Ada Batch / Stok</h4>
          <p class="text-sm">Klik tombol "Penerimaan Stok / Pembelian Baru" di atas untuk mencatat faktur dan nomor lot batch pertama.</p>
        </div>
      ` : `
        <div class="table-wrap">
          <table class="tbl w-full">
            <thead>
              <tr>
                <th>No. Lot / Batch</th>
                <th>Tanggal Kadaluwarsa</th>
                <th class="text-right">Sisa Stok</th>
                <th class="text-right">HPP per ${UI.esc(barang.usage_unit)}</th>
                <th class="text-right">Total Nilai</th>
                <th class="text-right" style="width: 1%">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${batches.map(bt => {
                const stok = Number(bt.stok_sekarang_usage) || 0;
                const hpp = Number(bt.cost_per_usage_unit) || 0;
                const nilaiTotal = stok * hpp;

                let statusExp = '';
                if (bt.expired_date) {
                  const diff = Math.ceil((new Date(bt.expired_date) - tglHariIni) / (1000 * 60 * 60 * 24));
                  if (diff <= 0) {
                    statusExp = `<span class="badge b-batal ml-4 font-bold">Expired (${Math.abs(diff)} hr lalu)</span>`;
                  } else if (diff <= 30) {
                    statusExp = `<span class="badge b-warn ml-4 font-bold">${diff} hari lagi</span>`;
                  } else {
                    statusExp = `<span class="badge b-ok ml-4">${diff} hari</span>`;
                  }
                }

                return `
                  <tr ${stok <= 0 ? 'style="opacity: 0.6;"' : ''}>
                    <td>
                      <b class="mono">${UI.esc(bt.batch_number)}</b>
                      ${!bt.aktif ? '<span class="badge b-batal ml-4">Nonaktif</span>' : ''}
                    </td>
                    <td>
                      ${UI.tglPendek(bt.expired_date)}
                      ${statusExp}
                    </td>
                    <td class="text-right mono ${stok <= 0 ? 'text-muted' : 'font-bold text-lg'}">
                      ${stok.toLocaleString('id-ID')} <span class="text-xs font-normal text-muted">${UI.esc(barang.usage_unit)}</span>
                    </td>
                    <td class="text-right mono text-muted">
                      ${hpp > 0 ? `Rp ${Math.round(hpp).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td class="text-right mono text-muted">
                      ${nilaiTotal > 0 ? `Rp ${Math.round(nilaiTotal).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td class="text-right whitespace-nowrap">
                      ${stok > 0 ? `
                        <button class="btn btn-secondary btn-sm" data-mutasi-id="${bt.id}" title="Catat kalibrasi, QC, atau pembuangan limbah">${UI.ikon('pensil', 12)} Mutasi / QC</button>
                      ` : '<span class="text-xs text-muted italic">Habis</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Event listener tombol mutasi batch
      tb.querySelectorAll('button[data-mutasi-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const bt = batches.find(x => x.id === btn.dataset.mutasiId);
          if (bt && await dialogMutasi(barang, bt)) {
            batches = await DB.inventoriBatchDaftar(barang.id);
            gambarB(badan);
            await muatUlang(false);
          }
        });
      });
    };

    const closed = await UI.modal({
      judul: `Kelola Batch (FEFO) — ${barang.nama}`,
      lebar: true,
      isi: `
        <div class="card p-12 mb-16" style="background: var(--surface-subtle);">
          <div class="flex items-center justify-between flex-wrap gap-8">
            <div>
              <div class="text-xs text-muted uppercase font-bold">Total Stok Reagen Saat Ini</div>
              <div class="mono text-2xl font-bold text-primary">${(Number(barang.stok_sekarang_usage) || 0).toLocaleString('id-ID')} <span class="text-sm font-normal text-muted">${UI.esc(barang.usage_unit)}</span></div>
              <div class="text-xs text-muted mt-2">Konversi: 1 ${UI.esc(barang.purchase_unit)} = ${barang.conversion_factor || 1} ${UI.esc(barang.usage_unit)}. Urutan pemotongan lab otomatis memprioritaskan batch yang paling dekat kadaluwarsa (FEFO).</div>
            </div>
            <button class="btn btn-primary" id="btnTerimaBatchBaru">${UI.ikon('plus', 15)} Penerimaan Stok / Pembelian Baru</button>
          </div>
        </div>

        <div id="daftarBatch"></div>
      `,
      siap: (badan) => {
        gambarB(badan);
        badan.querySelector('#btnTerimaBatchBaru').addEventListener('click', async () => {
          if (await dialogPenerimaanStok(barang)) {
            batches = await DB.inventoriBatchDaftar(barang.id);
            gambarB(badan);
            await muatUlang(false);
          }
        });
      },
      tombol: [{ teks: 'Tutup', nilai: true, kelas: 'btn-primary' }]
    });

    if (closed) {
      await muatUlang(false);
    }
  }

  /* ------------------- DIALOG PENERIMAAN STOK (IN_PURCHASE) ------------------- */
  async function dialogPenerimaanStok(barang) {
    return await UI.modal({
      judul: `Penerimaan Stok / Pembelian Baru — ${barang.nama}`,
      isi: `
        <div class="banner info mb-12">
          Penerimaan akan membuat / menambah nomor lot batch dan mencatat mutasi <b>IN_PURCHASE</b> secara otomatis.
        </div>
        <div class="form-row c2">
          <div class="field">
            <label>Nomor Lot / Batch <span class="req">*</span></label>
            <input type="text" name="batch_number" class="mono w-full" placeholder="mis. LOT2026-09A" required>
          </div>
          <div class="field">
            <label>Tanggal Kadaluwarsa (Expired) <span class="req">*</span></label>
            <input type="date" name="expired_date" class="w-full" required>
          </div>
        </div>

        <div class="form-row c2">
          <div class="field">
            <label>Jumlah Diterima (Satuan Beli: ${UI.esc(barang.purchase_unit)}) <span class="req">*</span></label>
            <input type="number" name="qty_beli" class="w-full" step="any" min="0.01" required placeholder="mis. 5">
          </div>
          <div class="field">
            <label>Total Nilai Faktur Pembelian (Rp) <span class="req">*</span></label>
            <input type="number" name="total_harga" class="w-full" step="100" min="0" required placeholder="mis. 1500000">
          </div>
        </div>

        <div class="field">
          <label>Keterangan / Nomor Faktur / PBF Supplier</label>
          <input type="text" name="keterangan" class="w-full" placeholder="mis. Faktur No. INV-9812 / PT Kimia Medika">
        </div>

        <div class="card p-8 text-xs text-muted" style="background: var(--surface-subtle);">
          Rumus: Jumlah Pemakaian = <b>Qty Beli &times; ${barang.conversion_factor || 1}</b>.<br>
          HPP per ${UI.esc(barang.usage_unit)} dihitung otomatis: Total Faktur &divide; Jumlah Pemakaian.
        </div>
        <div id="galatBeli"></div>
      `,
      tombol: [
        { teks: 'Batal', nilai: false },
        {
          teks: 'Simpan Penerimaan',
          kelas: 'btn-primary',
          aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            if (!d.batch_number || !d.expired_date || !d.qty_beli || !d.total_harga) {
              badan.querySelector('#galatBeli').innerHTML = '<div class="banner err">Semua bidang bertanda bintang wajib diisi.</div>';
              return false;
            }

            const qty_usage = Number(d.qty_beli) * (barang.conversion_factor || 1);
            const hpp_usage = Number(d.total_harga) / qty_usage;

            try {
              // 1. Simpan Batch baru atau perbarui
              const batchBaru = await DB.inventoriBatchSimpan({
                barang_id: barang.id,
                batch_number: d.batch_number.trim(),
                expired_date: d.expired_date,
                stok_sekarang_usage: 0, // diisi trigger mutasi
                cost_per_usage_unit: hpp_usage,
                aktif: true
              });

              // 2. Simpan Mutasi IN_PURCHASE
              await DB.inventoriMutasi({
                barang_id: barang.id,
                batch_id: batchBaru.id,
                jenis: 'IN_PURCHASE',
                jumlah_usage: qty_usage,
                keterangan: d.keterangan ? d.keterangan.trim() : 'Pembelian baru'
              });

              UI.toast('Stok reagen berhasil diterima dan dicatat.', 'ok');
              return true;
            } catch (e) {
              badan.querySelector('#galatBeli').innerHTML = `<div class="banner err">${e.message.includes('unique') ? 'Nomor batch ini sudah pernah diinput. Silakan gunakan nomor batch lain atau ubah data batch terkait.' : UI.esc(e.message)}</div>`;
              return false;
            }
          }
        }
      ]
    });
  }

  /* ------------------- DIALOG MUTASI / KALIBRASI / QC / WASTE ------------------- */
  async function dialogMutasi(barang, batch) {
    return await UI.modal({
      judul: `Catat Mutasi / QC — Lot: ${batch.batch_number}`,
      isi: `
        <div class="banner warn mb-12">
          Mengurangi stok dari Batch <b>${UI.esc(batch.batch_number)}</b> (${barang.nama}).<br>
          Sisa stok saat ini: <b>${batch.stok_sekarang_usage} ${UI.esc(barang.usage_unit)}</b>.
        </div>

        <div class="field">
          <label>Jenis Pengurangan / Alasan Mutasi <span class="req">*</span></label>
          <select name="jenis" class="w-full">
            <option value="CALIBRATION">Kalibrasi / Pemeliharaan Alat QC Lab</option>
            <option value="WASTE">Limbah / Reagen Rusak / Expired / Tumpah (Waste)</option>
            <option value="OPNAME">Koreksi Stok Opname Fisik (Pengurangan)</option>
          </select>
        </div>

        <div class="field">
          <label>Jumlah Pengurangan (${UI.esc(barang.usage_unit)}) <span class="req">*</span></label>
          <input type="number" name="jumlah" min="0.01" step="any" max="${batch.stok_sekarang_usage}" class="w-full" required placeholder="mis. 10">
        </div>

        <div class="field">
          <label>Keterangan / Berita Acara <span class="req">*</span></label>
          <input type="text" name="keterangan" class="w-full" required placeholder="mis. QC harian pagi atau limbah kadaluwarsa">
        </div>
        <div id="galatMutasi"></div>
      `,
      tombol: [
        { teks: 'Batal', nilai: false },
        {
          teks: 'Kurangi Stok',
          kelas: 'btn-danger',
          aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            if (!d.jumlah || Number(d.jumlah) <= 0) {
              badan.querySelector('#galatMutasi').innerHTML = '<div class="banner err">Jumlah pengurangan harus lebih dari 0.</div>';
              return false;
            }
            if (!d.keterangan) {
              badan.querySelector('#galatMutasi').innerHTML = '<div class="banner err">Keterangan / Berita acara wajib dicantumkan.</div>';
              return false;
            }

            const j = Number(d.jumlah);
            if (j > batch.stok_sekarang_usage) {
              badan.querySelector('#galatMutasi').innerHTML = '<div class="banner err">Jumlah tidak boleh melebihi sisa stok batch ini.</div>';
              return false;
            }

            try {
              await DB.inventoriMutasi({
                barang_id: barang.id,
                batch_id: batch.id,
                jenis: d.jenis,
                jumlah_usage: j,
                keterangan: d.keterangan.trim()
              });
              UI.toast(`Pengurangan stok berhasil dicatat sebagai ${d.jenis}.`, 'ok');
              return true;
            } catch (e) {
              badan.querySelector('#galatMutasi').innerHTML = `<div class="banner err">${UI.esc(e.message)}</div>`;
              return false;
            }
          }
        }
      ]
    });
  }

  /* =====================================================================
     TAB 2: PUSAT PERINGATAN FEFO (FIRST EXPIRED FIRST OUT ALERT CENTER)
     ===================================================================== */
  function tabFefo(isi) {
    isi.innerHTML = `
      <div class="card p-12 mb-16 no-print">
        <div class="flex items-center justify-between flex-wrap gap-8">
          <!-- Filter Chips -->
          <div class="flex gap-4 items-center flex-wrap">
            <span class="text-xs text-muted font-bold mr-4">Status Masa Simpan:</span>
            <button class="btn btn-sm ${chipFefo === 'semua' ? 'btn-primary' : 'btn-ghost'}" id="chipFefoSemua">Semua Batch Berstok</button>
            <button class="btn btn-sm ${chipFefo === 'expired' ? 'btn-danger' : 'btn-ghost'}" id="chipFefoExpired">Sudah Kadaluwarsa</button>
            <button class="btn btn-sm ${chipFefo === 'kritis' ? 'btn-secondary' : 'btn-ghost'}" id="chipFefoKritis">Mendekati Expired (&le; 30 Hari)</button>
            <button class="btn btn-sm ${chipFefo === 'aman' ? 'btn-ghost' : 'btn-ghost'}" id="chipFefoAman">Masa Simpan Aman</button>
          </div>

          <!-- Search Input -->
          <div class="field mb-0" style="width: 240px;">
            <input type="text" id="inpCariFefo" class="w-full" placeholder="Cari reagen / lot..." value="${UI.esc(cariFefo)}">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="tbl w-full">
            <thead>
              <tr>
                <th style="width: 14%;">Status FEFO</th>
                <th style="width: 28%;">Nama Reagen &amp; Kategori</th>
                <th style="width: 14%;">No. Lot / Batch</th>
                <th style="width: 16%;">Tanggal Expired</th>
                <th class="text-right" style="width: 14%;">Sisa Stok</th>
                <th class="text-right" style="width: 14%;">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody id="tbodyFefo">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Chip Events
    isi.querySelector('#chipFefoSemua').addEventListener('click', () => { chipFefo = 'semua'; renderTabelFefo(); });
    isi.querySelector('#chipFefoExpired').addEventListener('click', () => { chipFefo = 'expired'; renderTabelFefo(); });
    isi.querySelector('#chipFefoKritis').addEventListener('click', () => { chipFefo = 'kritis'; renderTabelFefo(); });
    isi.querySelector('#chipFefoAman').addEventListener('click', () => { chipFefo = 'aman'; renderTabelFefo(); });

    const inp = isi.querySelector('#inpCariFefo');
    inp.addEventListener('input', UI.tunda(() => { cariFefo = inp.value.trim(); renderTabelFefo(); }, 250));

    renderTabelFefo();
  }

  function renderTabelFefo() {
    const tbody = w.querySelector('#tbodyFefo');
    if (!tbody) return;

    const hariIni = UI.hariIni();
    const tglHariIni = new Date(hariIni);

    // Filter data batch yang memiliki stok > 0
    const k = cariFefo.toLowerCase();
    const list = dataBatch.filter(bt => {
      if ((Number(bt.stok_sekarang_usage) || 0) <= 0) return false;
      const bNama = bt.barang?.nama ? bt.barang.nama.toLowerCase() : '';
      const bKode = bt.barang?.kode ? bt.barang.kode.toLowerCase() : '';
      const bLot = (bt.batch_number || '').toLowerCase();

      if (k && !bNama.includes(k) && !bKode.includes(k) && !bLot.includes(k)) return false;

      const tglExp = bt.expired_date ? new Date(bt.expired_date) : null;
      const diff = tglExp ? Math.ceil((tglExp - tglHariIni) / (1000 * 60 * 60 * 24)) : 999;

      if (chipFefo === 'expired') return diff <= 0;
      if (chipFefo === 'kritis') return diff > 0 && diff <= 30;
      if (chipFefo === 'aman') return diff > 30;
      return true;
    });

    // Update styling on chip buttons
    const cAll = w.querySelector('#chipFefoSemua');
    const cExp = w.querySelector('#chipFefoExpired');
    const cKri = w.querySelector('#chipFefoKritis');
    const cAma = w.querySelector('#chipFefoAman');
    if (cAll) cAll.className = `btn btn-sm ${chipFefo === 'semua' ? 'btn-primary' : 'btn-ghost'}`;
    if (cExp) cExp.className = `btn btn-sm ${chipFefo === 'expired' ? 'btn-danger' : 'btn-ghost'}`;
    if (cKri) cKri.className = `btn btn-sm ${chipFefo === 'kritis' ? 'btn-secondary' : 'btn-ghost'}`;
    if (cAma) cAma.className = `btn btn-sm ${chipFefo === 'aman' ? 'btn-primary' : 'btn-ghost'}`;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center p-24 text-muted">Tidak ada batch yang memenuhi kriteria peringatan FEFO.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(bt => {
      const stok = Number(bt.stok_sekarang_usage) || 0;
      const tglExp = bt.expired_date ? new Date(bt.expired_date) : null;
      const diff = tglExp ? Math.ceil((tglExp - tglHariIni) / (1000 * 60 * 60 * 24)) : 999;

      let statusBadge = '';
      if (diff <= 0) {
        statusBadge = `<span class="badge b-batal font-bold">EXPIRED (${Math.abs(diff)} hr lalu)</span>`;
      } else if (diff <= 14) {
        statusBadge = `<span class="badge b-batal font-bold">${diff} HARI LAGI</span>`;
      } else if (diff <= 30) {
        statusBadge = `<span class="badge b-warn font-bold">${diff} HARI LAGI</span>`;
      } else {
        statusBadge = `<span class="badge b-ok">AMAN (${diff} hari)</span>`;
      }

      const barang = bt.barang || { nama: 'Barang tidak dikenal', usage_unit: 'Unit' };

      return `
        <tr ${diff <= 0 ? 'style="background: rgba(239, 68, 68, 0.05);"' : (diff <= 30 ? 'style="background: rgba(245, 158, 11, 0.04);"' : '')}>
          <td>${statusBadge}</td>
          <td>
            <b>${UI.esc(barang.nama)}</b>
            ${barang.kategori ? `<br><span class="badge b-netral text-xs mt-2">${UI.esc(barang.kategori)}</span>` : ''}
          </td>
          <td><span class="mono font-bold">${UI.esc(bt.batch_number)}</span></td>
          <td class="whitespace-nowrap">
            ${UI.tglPendek(bt.expired_date)}
          </td>
          <td class="text-right mono font-bold">
            ${stok.toLocaleString('id-ID')} <span class="text-xs font-normal text-muted">${UI.esc(barang.usage_unit)}</span>
          </td>
          <td class="text-right whitespace-nowrap">
            ${diff <= 0 ? `
              <button class="btn btn-danger btn-sm" data-quick-waste="${bt.id}">${UI.ikon('hapus', 12)} Buang Limbah</button>
            ` : `
              <button class="btn btn-secondary btn-sm" data-quick-mutasi="${bt.id}">${UI.ikon('pensil', 12)} Mutasi / QC</button>
            `}
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('button[data-quick-waste]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bt = list.find(x => x.id === btn.dataset.quickWaste);
        if (!bt) return;
        const b = dataBarang.find(x => x.id === bt.barang_id) || bt.barang;
        if (await dialogMutasi(b, bt)) {
          await muatUlang(false);
          renderTabelFefo();
        }
      });
    });

    tbody.querySelectorAll('button[data-quick-mutasi]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bt = list.find(x => x.id === btn.dataset.quickMutasi);
        if (!bt) return;
        const b = dataBarang.find(x => x.id === bt.barang_id) || bt.barang;
        if (await dialogMutasi(b, bt)) {
          await muatUlang(false);
          renderTabelFefo();
        }
      });
    });
  }

  /* =====================================================================
     TAB 3: RIWAYAT MUTASI & PEMAKAIAN
     ===================================================================== */
  function tabRiwayat(isi) {
    isi.innerHTML = `
      <div class="card p-12 mb-16 no-print">
        <div class="flex items-center justify-between flex-wrap gap-8">
          <!-- Filter Jenis Mutasi -->
          <div class="flex gap-4 items-center flex-wrap">
            <span class="text-xs text-muted font-bold mr-4">Jenis Mutasi:</span>
            <select id="selJenisRiwayat" class="form-control" style="width: auto; max-width: 220px;">
              <option value="SEMUA" ${jenisRiwayat === 'SEMUA' ? 'selected' : ''}>Semua Mutasi</option>
              <option value="IN_PURCHASE" ${jenisRiwayat === 'IN_PURCHASE' ? 'selected' : ''}>IN_PURCHASE (Pembelian Baru)</option>
              <option value="TEST_PATIENT" ${jenisRiwayat === 'TEST_PATIENT' ? 'selected' : ''}>TEST_PATIENT (Pemakaian Lab)</option>
              <option value="CALIBRATION" ${jenisRiwayat === 'CALIBRATION' ? 'selected' : ''}>CALIBRATION (Kalibrasi / QC)</option>
              <option value="WASTE" ${jenisRiwayat === 'WASTE' ? 'selected' : ''}>WASTE (Limbah / Rusak / Expired)</option>
              <option value="OPNAME" ${jenisRiwayat === 'OPNAME' ? 'selected' : ''}>OPNAME (Koreksi Stok Opname)</option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="field mb-0" style="width: 260px;">
            <input type="text" id="inpCariRiwayat" class="w-full" placeholder="Cari reagen / lot / referensi..." value="${UI.esc(cariRiwayat)}">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="tbl w-full">
            <thead>
              <tr>
                <th style="width: 14%;">Waktu Mutasi</th>
                <th style="width: 22%;">Reagen &amp; Batch</th>
                <th style="width: 14%;">Jenis Mutasi</th>
                <th class="text-right" style="width: 10%;">Awal</th>
                <th class="text-right" style="width: 12%;">Jumlah</th>
                <th class="text-right" style="width: 10%;">Akhir</th>
                <th class="text-right" style="width: 14%;">Total Nilai</th>
                <th style="width: 18%;">Keterangan &amp; Petugas</th>
              </tr>
            </thead>
            <tbody id="tbodyRiwayat">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    const sel = isi.querySelector('#selJenisRiwayat');
    sel.addEventListener('change', () => { jenisRiwayat = sel.value; renderTabelRiwayat(); });

    const inp = isi.querySelector('#inpCariRiwayat');
    inp.addEventListener('input', UI.tunda(() => { cariRiwayat = inp.value.trim(); renderTabelRiwayat(); }, 250));

    renderTabelRiwayat();
  }

  function renderTabelRiwayat() {
    const tbody = w.querySelector('#tbodyRiwayat');
    if (!tbody) return;

    const k = cariRiwayat.toLowerCase();
    const filter = dataRiwayat.filter(r => {
      if (jenisRiwayat !== 'SEMUA' && r.jenis !== jenisRiwayat) return false;
      if (k) {
        const nama = (r.barang?.nama || '').toLowerCase();
        const batch = (r.batch?.batch_number || '').toLowerCase();
        const ref = (r.referensi || '').toLowerCase();
        const ket = (r.keterangan || '').toLowerCase();
        const peg = (r.pegawai?.nama || '').toLowerCase();
        if (!nama.includes(k) && !batch.includes(k) && !ref.includes(k) && !ket.includes(k) && !peg.includes(k)) {
          return false;
        }
      }
      return true;
    });

    if (!filter.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center p-24 text-muted">Belum ada riwayat mutasi yang sesuai.</td></tr>`;
      return;
    }

    const rp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

    tbody.innerHTML = filter.map(r => {
      let badgeClass = 'b-netral';
      let tanda = '-';
      if (r.jenis === 'IN_PURCHASE') {
        badgeClass = 'b-ok';
        tanda = '+';
      } else if (r.jenis === 'TEST_PATIENT') {
        badgeClass = 'b-selesai';
      } else if (r.jenis === 'CALIBRATION') {
        badgeClass = 'b-warn';
      } else if (r.jenis === 'WASTE') {
        badgeClass = 'b-batal';
      } else if (r.jenis === 'OPNAME') {
        badgeClass = 'b-netral';
      }

      return `
        <tr>
          <td class="whitespace-nowrap text-xs text-muted">
            ${UI.tglPendek(r.tanggal)}<br>
            <span class="mono">${UI.jam(r.tanggal)}</span>
          </td>
          <td>
            <b>${UI.esc(r.barang?.nama || 'Reagen')}</b>
            ${r.batch?.batch_number ? `<br><span class="mono text-xs text-muted">Lot: ${UI.esc(r.batch.batch_number)}</span>` : ''}
          </td>
          <td>
            <span class="badge ${badgeClass}">${r.jenis}</span>
          </td>
          <td class="text-right mono text-muted">${r.stok_awal_usage != null ? r.stok_awal_usage : '-'}</td>
          <td class="text-right mono font-bold text-lg ${r.jenis === 'IN_PURCHASE' ? 'text-ok' : 'text-red-600'}">
            ${tanda}${r.jumlah_usage}
          </td>
          <td class="text-right mono">${r.stok_akhir_usage != null ? r.stok_akhir_usage : '-'}</td>
          <td class="text-right mono text-muted">${r.total_cost > 0 ? rp(r.total_cost) : '-'}</td>
          <td class="text-sm">
            ${r.referensi ? `<span class="badge b-netral mono text-xs">${UI.esc(r.referensi)}</span><br>` : ''}
            <span>${UI.esc(r.keterangan || '-')}</span>
            ${r.pegawai?.nama ? `<div class="text-xs text-muted mt-2">${UI.esc(r.pegawai.nama)}</div>` : ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  /* =====================================================================
     TAB 4: LAPORAN STOK OPNAME & EKSPOR CETAK
     ===================================================================== */
  function tabOpname(isi) {
    const kategoris = Array.from(new Set(dataBarang.map(b => b.kategori).filter(Boolean))).sort();

    isi.innerHTML = `
      <!-- Print Header (Official Clinic Letterhead) -->
      <div class="print-only mb-16">
        <div class="text-center" style="border-bottom: 2px solid #000; padding-bottom: 8px;">
          <h2 style="margin: 0; font-size: 18pt; text-transform: uppercase;">LABORATORIUM MEDIS UTAMA</h2>
          <p style="margin: 4px 0 0; font-size: 10pt;">Jl. D.I. Panjaitan No. 22, Purbalingga &bull; Telp / WhatsApp Layanan Resmi</p>
          <h3 style="margin: 12px 0 0; font-size: 14pt; text-decoration: underline;">LEMBAR AUDIT STOK OPNAME REAGEN &amp; LOGISTIK LAB</h3>
          <p style="margin: 4px 0 0; font-size: 10pt;">Tanggal Cetak: <b>${UI.tglIndo(UI.hariIni())}</b> &bull; Dokumen Pemeriksaan Fisik Inventori</p>
        </div>
      </div>

      <div class="card p-12 mb-16 no-print">
        <div class="flex items-center justify-between flex-wrap gap-8">
          <div>
            <h3 class="mb-2">Audit Fisik &amp; Lembar Kerja Stok Opname</h3>
            <p class="text-muted text-sm mb-0">Cetak lembar audit untuk pengecekan fisik di lab, ekspor ke spreadsheet CSV, atau catat penyesuaian selisih.</p>
          </div>
          <div class="flex gap-8 items-center flex-wrap">
            <button class="btn btn-secondary btn-sm" id="btnCetakOpname">${UI.ikon('cetak', 15)} Cetak Lembar Audit</button>
            <button class="btn btn-secondary btn-sm" id="btnEksporCsv">${UI.ikon('unduh', 15)} Ekspor CSV (Excel)</button>
          </div>
        </div>

        <div class="flex items-center justify-between flex-wrap gap-8 mt-12 pt-12" style="border-top: 1px solid var(--border-subtle);">
          <div class="flex gap-8 items-center flex-wrap">
            <select id="selKatOpname" class="form-control" style="width: auto; max-width: 200px;">
              <option value="">Semua Kategori</option>
              ${kategoris.map(k => `<option value="${UI.esc(k)}" ${katOpname === k ? 'selected' : ''}>${UI.esc(k)}</option>`).join('')}
            </select>
            <div class="field mb-0" style="width: 240px;">
              <input type="text" id="inpCariOpname" class="w-full" placeholder="Cari kode / nama..." value="${UI.esc(cariOpname)}">
            </div>
          </div>
          <div class="text-xs text-muted">
            Ketik hitungan fisik di kolom "Hitung Fisik" untuk menghitung selisih secara instan.
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="tbl w-full" id="tabelStokOpname">
            <thead>
              <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 14%;">Kode</th>
                <th style="width: 30%;">Nama Reagen / Barang</th>
                <th style="width: 14%;">Kategori</th>
                <th class="text-right" style="width: 14%;">Stok Sistem</th>
                <th class="text-right" style="width: 15%;">Hitung Fisik</th>
                <th class="text-right" style="width: 12%;">Selisih</th>
              </tr>
            </thead>
            <tbody id="tbodyOpname">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Signature block on print -->
      <div class="print-only mt-24" style="page-break-inside: avoid;">
        <div class="flex justify-between" style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="width: 40%; text-align: center;">
            <p style="margin: 0 0 60px;">Petugas Pelaksana Opname,</p>
            <p style="margin: 0; font-weight: bold;">( .................................................... )</p>
          </div>
          <div style="width: 40%; text-align: center;">
            <p style="margin: 0 0 60px;">Penanggung Jawab Laboratorium,</p>
            <p style="margin: 0; font-weight: bold;">( .................................................... )</p>
          </div>
        </div>
      </div>
    `;

    // Filter events
    const sel = isi.querySelector('#selKatOpname');
    sel.addEventListener('change', () => { katOpname = sel.value; renderTabelOpname(); });

    const inp = isi.querySelector('#inpCariOpname');
    inp.addEventListener('input', UI.tunda(() => { cariOpname = inp.value.trim(); renderTabelOpname(); }, 250));

    // Print button
    isi.querySelector('#btnCetakOpname').addEventListener('click', () => {
      window.print();
    });

    // CSV Export button
    isi.querySelector('#btnEksporCsv').addEventListener('click', eksporCsvOpname);

    renderTabelOpname();
  }

  function renderTabelOpname() {
    const tbody = w.querySelector('#tbodyOpname');
    if (!tbody) return;

    const k = cariOpname.toLowerCase();
    const filter = dataBarang.filter(b => {
      if (b.aktif === false) return false;
      if (katOpname && b.kategori !== katOpname) return false;
      if (k) {
        const nama = (b.nama || '').toLowerCase();
        const kode = (b.kode || '').toLowerCase();
        if (!nama.includes(k) && !kode.includes(k)) return false;
      }
      return true;
    });

    if (!filter.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center p-24 text-muted">Tidak ada reagen yang cocok dengan filter opname.</td></tr>`;
      return;
    }

    tbody.innerHTML = filter.map((b, idx) => {
      const stokSistem = Number(b.stok_sekarang_usage) || 0;
      const fisik = hitungFisikMap[b.id] !== undefined ? hitungFisikMap[b.id] : null;
      const selisih = fisik !== null ? (fisik - stokSistem) : null;

      let selisihHtml = '<span class="text-muted text-xs">-</span>';
      if (selisih !== null) {
        if (selisih === 0) {
          selisihHtml = '<span class="badge b-ok mono font-bold">Pas (0)</span>';
        } else if (selisih < 0) {
          selisihHtml = `<span class="badge b-batal mono font-bold">${selisih}</span>`;
        } else {
          selisihHtml = `<span class="badge b-warn mono font-bold">+${selisih}</span>`;
        }
      }

      return `
        <tr>
          <td class="text-muted text-center text-xs">${idx + 1}</td>
          <td><span class="mono text-xs">${UI.esc(b.kode || '-')}</span></td>
          <td><b>${UI.esc(b.nama)}</b></td>
          <td><span class="badge b-netral text-xs">${UI.esc(b.kategori || 'Umum')}</span></td>
          <td class="text-right mono font-bold">
            ${stokSistem.toLocaleString('id-ID')} <span class="text-xs font-normal text-muted">${UI.esc(b.usage_unit)}</span>
          </td>
          <td class="text-right">
            <!-- Normal interactive screen -->
            <div class="no-print">
              <input type="number" step="any" min="0" class="form-control mono text-right" style="width: 110px; display: inline-block;"
                     placeholder="..." data-fisik-id="${b.id}" value="${fisik !== null ? fisik : ''}">
              <span class="text-xs text-muted ml-2">${UI.esc(b.usage_unit)}</span>
            </div>
            <!-- Blank line on print sheet -->
            <div class="print-only text-center" style="border-bottom: 1px dotted #888; width: 80px; margin-left: auto;">&nbsp;</div>
          </td>
          <td class="text-right" id="selisihCell_${b.id}">
            <div class="no-print">${selisihHtml}</div>
            <div class="print-only text-center" style="border-bottom: 1px dotted #888; width: 60px; margin-left: auto;">&nbsp;</div>
          </td>
        </tr>
      `;
    }).join('');

    // Pasang event listener input fisik
    tbody.querySelectorAll('input[data-fisik-id]').forEach(inp => {
      inp.addEventListener('input', () => {
        const id = inp.dataset.fisikId;
        const val = inp.value.trim();
        if (val === '') {
          delete hitungFisikMap[id];
        } else {
          hitungFisikMap[id] = Number(val);
        }

        // Update single cell selisih
        const b = dataBarang.find(x => x.id === id);
        if (b) {
          const c = tbody.querySelector(`#selisihCell_${id} .no-print`);
          if (c) {
            const stokSistem = Number(b.stok_sekarang_usage) || 0;
            const f = hitungFisikMap[id] !== undefined ? hitungFisikMap[id] : null;
            if (f === null) {
              c.innerHTML = '<span class="text-muted text-xs">-</span>';
            } else {
              const diff = f - stokSistem;
              if (diff === 0) c.innerHTML = '<span class="badge b-ok mono font-bold">Pas (0)</span>';
              else if (diff < 0) c.innerHTML = `<span class="badge b-batal mono font-bold">${diff}</span>`;
              else c.innerHTML = `<span class="badge b-warn mono font-bold">+${diff}</span>`;
            }
          }
        }
      });
    });
  }

  /* ------------------- EKSPOR CSV OPNAME ------------------- */
  function eksporCsvOpname() {
    const hariIni = UI.hariIni();
    const filter = dataBarang.filter(b => b.aktif !== false);

    const headers = [
      'No',
      'Kode Barang',
      'Nama Reagen / Item',
      'Kategori',
      'Satuan Beli',
      'Satuan Pakai (Usage)',
      'Faktor Konversi',
      'Stok Sistem (Usage)',
      'Hitung Fisik (Opname)',
      'Selisih Fisik vs Sistem',
      'Status Audit'
    ];

    const rows = filter.map((b, idx) => {
      const stokSistem = Number(b.stok_sekarang_usage) || 0;
      const fisik = hitungFisikMap[b.id] !== undefined ? hitungFisikMap[b.id] : '';
      const selisih = (fisik !== '' && fisik !== null) ? (Number(fisik) - stokSistem) : '';
      let status = 'Belum Dihitung';
      if (fisik !== '' && fisik !== null) {
        if (selisih === 0) status = 'Cocok (Match)';
        else if (selisih < 0) status = 'Selisih Kurang';
        else status = 'Selisih Lebih';
      }

      return [
        idx + 1,
        `"${(b.kode || '').replace(/"/g, '""')}"`,
        `"${(b.nama || '').replace(/"/g, '""')}"`,
        `"${(b.kategori || 'Umum').replace(/"/g, '""')}"`,
        `"${(b.purchase_unit || 'Box').replace(/"/g, '""')}"`,
        `"${(b.usage_unit || 'mL').replace(/"/g, '""')}"`,
        b.conversion_factor || 1,
        stokSistem,
        fisik !== '' ? fisik : '""',
        selisih !== '' ? selisih : '""',
        `"${status}"`
      ].join(',');
    });

    // UTF-8 BOM untuk kompatibilitas Microsoft Excel
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stok_opname_lab_medis_utama_${hariIni}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    UI.toast('Berkas CSV Stok Opname berhasil diunduh.', 'ok');
  }

  return { render };
})();
