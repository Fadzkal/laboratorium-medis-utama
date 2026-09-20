/* =====================================================================
   HALAMAN: INKASO & INVENTORI BARANG UMUM (LOGISTIK LAB)
   ---------------------------------------------------------------------
   Pencatatan inventori FEFO, penerimaan stok (batch), kalibrasi, 
   dan pembuangan/QC.
   ===================================================================== */
const InkasoBarang = (() => {
  let w = null;
  let tabAktif = 'stok';
  
  let dataBarang = [];
  let dataRiwayat = [];

  async function render(el, param) {
    if (!App.boleh('menu_inkaso') && !App.boleh('master') && !App.boleh('admin')) {
      el.innerHTML = UI.kosong('Akses ditolak', 'Anda tidak punya izin membuka Inventori Barang.');
      return;
    }
    
    w = el;
    w.innerHTML = `
      <div class="mb-16">
        <h1>Inkaso &amp; Logistik Lab</h1>
        <p class="text-muted mb-0">Manajemen stok reagen (FEFO), penerimaan barang, kalibrasi, dan riwayat mutasi.</p>
      </div>

      <div class="tabs" id="tabs">
        <button class="tab on" data-t="stok">Katalog Stok &amp; Reagen</button>
        <button class="tab" data-t="riwayat">Riwayat Mutasi Harian</button>
      </div>
      
      <div id="isiTab" class="mt-16">${UI.memuat(3)}</div>
    `;

    w.querySelector('#tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-t]');
      if (!b) return;
      tabAktif = b.dataset.t;
      w.querySelectorAll('#tabs .tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      gambarTab();
    });

    await muatUlang();
  }

  async function muatUlang() {
    w.querySelector('#isiTab').innerHTML = UI.memuat(3);
    try {
      [dataBarang, dataRiwayat] = await Promise.all([
        DB.inventoriDaftar(),
        DB.inventoriRiwayat(null, 200)
      ]);
      gambarTab();
    } catch (e) {
      w.querySelector('#isiTab').innerHTML = `<div class="banner err"><div>Gagal memuat data: ${UI.esc(e.message)}</div></div>`;
    }
  }

  function gambarTab() {
    const isi = w.querySelector('#isiTab');
    if (tabAktif === 'stok') tabStok(isi);
    if (tabAktif === 'riwayat') tabRiwayat(isi);
  }

  /* ------------------- TAB STOK ------------------- */
  function tabStok(isi) {
    isi.innerHTML = `
      <div class="flex items-center justify-between mb-12">
        <div class="field" style="max-width: 300px; margin-bottom: 0;">
          <input type="text" id="cariBarang" class="w-full" placeholder="Cari nama barang...">
        </div>
        <div class="flex gap-4">
          <button class="btn btn-primary" id="btnTambahBarang">${UI.ikon('plus',15)} Master Barang</button>
        </div>
      </div>
      
      <div class="card">
        <div class="table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>Nama Barang</th>
            <th>Kategori</th>
            <th class="text-right">Total Stok</th>
            <th>Satuan Pakai (Usage)</th>
            <th style="width:1%"></th>
          </tr></thead>
          <tbody id="tabelBarang">
            <!-- Isi dirender via JS -->
          </tbody>
        </table></div>
      </div>
    `;
    
    isi.querySelector('#btnTambahBarang').addEventListener('click', () => dialogBarang());
    
    const inpCari = isi.querySelector('#cariBarang');
    inpCari.addEventListener('input', () => renderTabelBarang(inpCari.value));
    
    renderTabelBarang('');
  }
  
  function renderTabelBarang(kata) {
    const tbody = w.querySelector('#tabelBarang');
    const k = kata.toLowerCase();
    const filter = dataBarang.filter(b => b.nama.toLowerCase().includes(k) || (b.kode && b.kode.toLowerCase().includes(k)));
    
    if (!filter.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center p-16 text-muted">Barang tidak ditemukan.</td></tr>`;
      return;
    }
    
    tbody.innerHTML = filter.map(b => `
      <tr ${b.aktif ? '' : 'style="opacity:0.6"'}>
        <td><b>${UI.esc(b.nama)}</b>${b.kode ? `<br><span class="text-xs text-muted mono">${UI.esc(b.kode)}</span>` : ''}
            ${!b.aktif ? '<span class="badge b-batal ml-4">Nonaktif</span>' : ''}
        </td>
        <td><span class="badge b-netral">${UI.esc(b.kategori || 'Umum')}</span></td>
        <td class="text-right mono text-lg ${(b.stok_sekarang_usage || 0) <= (b.stok_minimum_usage||0) ? 'font-bold text-red-600' : ''}">
          ${b.stok_sekarang_usage || 0}
        </td>
        <td class="text-muted">${UI.esc(b.usage_unit)}<br><span class="text-xs">Beli: ${UI.esc(b.purchase_unit)}</span></td>
        <td class="text-right whitespace-nowrap">
          <button class="btn btn-primary btn-sm" data-batch-barang="${b.id}">Kelola Batch</button>
          <button class="btn btn-secondary btn-sm" data-edit-barang="${b.id}">Edit</button>
        </td>
      </tr>
    `).join('');
    
    tbody.querySelectorAll('button[data-edit-barang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = dataBarang.find(x => x.id === btn.dataset.editBarang);
        if (b) dialogBarang(b);
      });
    });
    tbody.querySelectorAll('button[data-batch-barang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = dataBarang.find(x => x.id === btn.dataset.batchBarang);
        if (b) dialogBatch(b);
      });
    });
  }

  async function dialogBarang(b = null) {
    const hasil = await UI.modal({
      judul: b ? 'Edit Master Barang' : 'Tambah Master Barang Baru',
      lebar: true,
      isi: `
        <div class="form-row c2">
          <div class="field"><label>Kode (Opsional)</label>
            <input type="text" name="kode" class="w-full mono" value="${UI.esc(b?.kode||'')}"></div>
          <div class="field"><label>Nama Barang</label>
            <input type="text" name="nama" class="w-full" value="${UI.esc(b?.nama||'')}" required></div>
        </div>
        <div class="form-row c3">
          <div class="field"><label>Satuan Beli (Penerimaan)</label>
            <input type="text" name="purchase_unit" class="w-full" value="${UI.esc(b?.purchase_unit||'Box')}" placeholder="Box / Botol"></div>
          <div class="field"><label>Satuan Pakai (Lab)</label>
            <input type="text" name="usage_unit" class="w-full" value="${UI.esc(b?.usage_unit||'mL')}" placeholder="mL / Test / Pcs"></div>
          <div class="field"><label>Konversi</label>
            <input type="number" name="conversion_factor" step="0.01" class="w-full" value="${b?.conversion_factor||1}" placeholder="1 Box = ... mL">
            <div class="hint mt-4">Misal: 1 Box = 500 mL</div>
          </div>
        </div>
        <div class="form-row c3">
          <div class="field"><label>Kategori</label>
            <input type="text" name="kategori" class="w-full" value="${UI.esc(b?.kategori||'Reagen')}"></div>
          <div class="field"><label>Batas Stok Minimum (Usage)</label>
            <input type="number" name="stok_minimum_usage" class="w-full" value="${b?.stok_minimum_usage||0}"></div>
          <div class="field"><label>Status</label>
            <select name="aktif" class="w-full">
              <option value="true" ${b?.aktif !== false ? 'selected' : ''}>Aktif</option>
              <option value="false" ${b?.aktif === false ? 'selected' : ''}>Nonaktif</option>
            </select></div>
        </div>
        <div id="galatBarang"></div>
      `,
      tombol: [
        ...(b ? [{
          teks: 'Hapus',
          kelas: 'btn-secondary',
          aksi: async () => {
            if (!await UI.konfirmasi('Hapus Barang', 'Yakin ingin menghapus barang ini secara permanen?', 'Hapus')) return false;
            try {
              await DB.inventoriHapus(b.id);
              return true;
            } catch (e) {
              UI.toast('Gagal menghapus. Barang mungkin sudah memiliki riwayat mutasi/batch.', 'err');
              return false;
            }
          }
        }] : []),
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan', kelas: 'btn-primary', aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            if (!d.nama || !d.usage_unit) return false;
            try {
              await DB.inventoriSimpan({
                kode: d.kode || null, nama: d.nama,
                kategori: d.kategori || null, 
                purchase_unit: d.purchase_unit, usage_unit: d.usage_unit,
                conversion_factor: Number(d.conversion_factor) || 1,
                stok_minimum_usage: Number(d.stok_minimum_usage) || 0,
                aktif: d.aktif === 'true'
              }, b?.id || null);
              return true;
            } catch (e) {
              badan.querySelector('#galatBarang').innerHTML = `<div class="banner err"><div>${
                /unique/.test(e.message) ? 'Kode barang sudah dipakai.' : UI.esc(e.message)
              }</div></div>`;
              return false;
            }
          }
        }
      ]
    });
    
    if (hasil) { UI.toast('Barang disimpan.', 'ok'); await muatUlang(); }
  }

  /* ------------------- BATCH (FEFO) ------------------- */
  async function dialogBatch(barang) {
    let batches = await DB.inventoriBatchDaftar(barang.id);
    
    const gambarB = (badan) => {
      const tb = badan.querySelector('#daftarBatch');
      const hariIni = UI.hariIni();
      
      tb.innerHTML = !batches.length ? '<div class="text-center p-16 text-muted">Belum ada batch/stok. Silakan klik Penerimaan Stok (Beli).</div>'
        : `<div class="table-wrap"><table class="tbl w-full">
            <thead><tr><th>Batch</th><th>Expired</th><th class="text-right">Stok (${UI.esc(barang.usage_unit)})</th><th>HPP</th><th></th></tr></thead>
            <tbody>
              ${batches.map(bt => {
                const isExp = bt.expired_date < hariIni;
                const isNearExp = !isExp && (new Date(bt.expired_date) - new Date(hariIni)) < 30 * 24 * 3600 * 1000;
                return `
                <tr>
                  <td class="mono"><b>${UI.esc(bt.batch_number)}</b></td>
                  <td>
                    ${UI.esc(bt.expired_date)}
                    ${isExp ? '<span class="badge b-batal ml-4">Expired</span>' : isNearExp ? '<span class="badge b-warn ml-4">Near Exp</span>' : ''}
                  </td>
                  <td class="text-right mono ${bt.stok_sekarang_usage <= 0 ? 'text-muted' : 'font-bold'}">${bt.stok_sekarang_usage}</td>
                  <td class="text-muted">Rp ${Number(bt.cost_per_usage_unit).toLocaleString('id-ID')}</td>
                  <td class="text-right whitespace-nowrap">
                    ${bt.stok_sekarang_usage > 0 ? `<button class="btn btn-secondary btn-sm" data-mutasi-batch="${bt.id}">Kalibrasi / QC</button>` : ''}
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table></div>`;

      tb.querySelectorAll('button[data-mutasi-batch]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const bt = batches.find(x => x.id === btn.dataset.mutasiBatch);
          if (bt && await dialogMutasi(barang, bt)) {
            batches = await DB.inventoriBatchDaftar(barang.id);
            gambarB(badan);
          }
        });
      });
    };

    const closed = await UI.modal({
      judul: 'Kelola Batch — ' + barang.nama,
      lebar: true,
      isi: `
        <div class="banner info mb-12 flex justify-between items-center">
          <div>
            Total Stok Saat Ini: <b>${barang.stok_sekarang_usage} ${UI.esc(barang.usage_unit)}</b><br>
            <span class="text-xs">Sistem akan memotong otomatis batch yang tanggal kadaluwarsanya paling dekat (FEFO).</span>
          </div>
          <button class="btn btn-primary btn-sm" id="btnTerimaBarang">${UI.ikon('plus',15)} Terima Stok / Pembelian Baru</button>
        </div>
        <div id="daftarBatch"></div>
      `,
      siap: (badan) => {
        gambarB(badan);
        badan.querySelector('#btnTerimaBarang').addEventListener('click', async () => {
          if (await dialogPenerimaanStok(barang)) {
            batches = await DB.inventoriBatchDaftar(barang.id);
            gambarB(badan);
          }
        });
      },
      tombol: [{ teks: 'Tutup', nilai: true, kelas: 'btn-primary' }]
    });

    if (closed) {
      await muatUlang(); // Refresh underlying table when closed
    }
  }

  async function dialogPenerimaanStok(barang) {
    return await UI.modal({
      judul: 'Penerimaan Stok Baru (IN_PURCHASE) — ' + barang.nama,
      isi: `
        <div class="form-row c2">
          <div class="field"><label>Nomor Batch <span class="req">*</span></label>
            <input type="text" name="batch_number" class="mono w-full" placeholder="LOT/BATCH" required></div>
          <div class="field"><label>Tanggal Expired <span class="req">*</span></label>
            <input type="date" name="expired_date" class="w-full" required></div>
        </div>
        <div class="form-row c2">
          <div class="field"><label>Jumlah Diterima (dalam ${UI.esc(barang.purchase_unit)}) <span class="req">*</span></label>
            <input type="number" name="qty_beli" class="w-full" step="any" min="0" required></div>
          <div class="field"><label>Total Harga Faktur (Rp) <span class="req">*</span></label>
            <input type="number" name="total_harga" class="w-full" step="100" min="0" required></div>
        </div>
        <div class="field"><label>Keterangan (No Faktur / Supplier)</label>
          <input type="text" name="keterangan" class="w-full"></div>
        <div class="banner info">
          Konversi: 1 ${UI.esc(barang.purchase_unit)} = ${barang.conversion_factor} ${UI.esc(barang.usage_unit)}.<br>
          Stok akan dikonversi ke ${UI.esc(barang.usage_unit)} dan dihitung HPP-nya per ${UI.esc(barang.usage_unit)}.
        </div>
        <div id="galatBeli"></div>
      `,
      tombol: [
        { teks: 'Batal', nilai: false },
        { teks: 'Terima Stok', kelas: 'btn-primary', aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            if (!d.batch_number || !d.expired_date || !d.qty_beli || !d.total_harga) return false;
            
            const qty_usage = Number(d.qty_beli) * barang.conversion_factor;
            const hpp_usage = Number(d.total_harga) / qty_usage;
            
            try {
              // 1. Simpan Batch (Atau ambil kalau ada, update hpp/stok_usage)
              // Kalau unique conflict pada insert, kita asumsikan salah input atau harus update. 
              // Tapi di sini karena simpel, asumsikan insert.
              const batchBaru = await DB.inventoriBatchSimpan({
                barang_id: barang.id,
                batch_number: d.batch_number,
                expired_date: d.expired_date,
                stok_sekarang_usage: 0, // Akan diupdate oleh trigger mutasi
                cost_per_usage_unit: hpp_usage
              });

              // 2. Simpan Mutasi (Trigger akan nambah stok)
              await DB.inventoriMutasi({
                barang_id: barang.id,
                batch_id: batchBaru.id,
                jenis: 'IN_PURCHASE',
                jumlah_usage: qty_usage,
                keterangan: d.keterangan || 'Pembelian baru'
              });

              return true;
            } catch (e) {
              badan.querySelector('#galatBeli').innerHTML = `<div class="banner err"><div>${e.message.includes('unique') ? 'Nomor batch ini sudah pernah dimasukkan. Edit batch atau gunakan nomor batch lain.' : UI.esc(e.message)}</div></div>`;
              return false;
            }
        }}
      ]
    });
  }

  async function dialogMutasi(barang, batch) {
    return await UI.modal({
      judul: 'Catat Kalibrasi / Pembuangan / QC',
      isi: `
        <div class="banner warn mb-12">Mengurangi stok dari Batch <b>${UI.esc(batch.batch_number)}</b>. Sisa stok: <b>${batch.stok_sekarang_usage} ${UI.esc(barang.usage_unit)}</b>.</div>
        <div class="field"><label>Jenis Pengurangan</label>
          <select name="jenis" class="w-full">
            <option value="CALIBRATION">Kalibrasi / Alat QC</option>
            <option value="WASTE">Terbuang / Rusak / Tumpah (Waste)</option>
            <option value="OPNAME">Koreksi Opname Manual (Mengurangi)</option>
          </select>
        </div>
        <div class="field"><label>Jumlah Pengurangan (dalam ${UI.esc(barang.usage_unit)})</label>
          <input type="number" name="jumlah" min="0.01" step="any" max="${batch.stok_sekarang_usage}" class="w-full" required></div>
        <div class="field"><label>Keterangan / Alasan</label>
          <input type="text" name="keterangan" class="w-full" required placeholder="mis. QC harian pagi"></div>
        <div id="galatMutasi"></div>
      `,
      tombol: [
        { teks: 'Batal', nilai: false },
        { teks: 'Kurangi Stok', kelas: 'btn-danger', aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            if (!d.jumlah || Number(d.jumlah) <= 0) return false;
            if (!d.keterangan) {
               badan.querySelector('#galatMutasi').innerHTML = `<div class="banner err">Keterangan wajib diisi.</div>`;
               return false;
            }
            try {
              if (Number(d.jumlah) > batch.stok_sekarang_usage) {
                 throw new Error('Jumlah tidak boleh melebihi sisa stok batch ini.');
              }
              await DB.inventoriMutasi({
                barang_id: barang.id,
                batch_id: batch.id,
                jenis: d.jenis,
                jumlah_usage: Number(d.jumlah),
                keterangan: d.keterangan
              });
              UI.toast('Pengurangan stok dicatat sebagai ' + d.jenis, 'ok');
              return true;
            } catch (e) {
              badan.querySelector('#galatMutasi').innerHTML = `<div class="banner err">${UI.esc(e.message)}</div>`;
              return false;
            }
        }}
      ]
    });
  }

  /* ------------------- TAB RIWAYAT ------------------- */
  function tabRiwayat(isi) {
    if (!dataRiwayat.length) {
      isi.innerHTML = `<div class="card p-16 text-center text-muted">Belum ada riwayat In/Out barang.</div>`;
      return;
    }
    
    const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
    
    isi.innerHTML = `
      <div class="card">
        <div class="table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>Waktu</th>
            <th>Barang &amp; Batch</th>
            <th>Jenis Mutasi</th>
            <th class="text-right">Stok Awal</th>
            <th class="text-right">Mutasi</th>
            <th class="text-right">Stok Akhir</th>
            <th class="text-right">Total Nilai (HPP)</th>
            <th>Referensi / Keterangan</th>
          </tr></thead>
          <tbody>
            ${dataRiwayat.map(r => `
              <tr>
                <td class="text-muted text-xs whitespace-nowrap">
                  ${UI.tglPendek(r.tanggal)}<br>${UI.jam(r.tanggal)}
                </td>
                <td>
                  <b>${UI.esc(r.barang?.nama || '')}</b><br>
                  <span class="mono text-xs text-muted">${UI.esc(r.batch?.batch_number || '-')}</span>
                </td>
                <td>
                  <span class="badge ${r.jenis === 'IN_PURCHASE' ? 'b-selesai' : (r.jenis === 'TEST_PATIENT' ? 'b-ok' : 'b-warn')}">
                    ${r.jenis}
                  </span>
                </td>
                <td class="text-right mono text-muted">${r.stok_awal_usage ?? ''}</td>
                <td class="text-right mono font-bold text-lg">${r.jenis === 'IN_PURCHASE' || r.jumlah_usage < 0 ? '' : '-'}${r.jumlah_usage}</td>
                <td class="text-right mono">${r.stok_akhir_usage ?? ''}</td>
                <td class="text-right text-muted">${r.total_cost > 0 ? rp(r.total_cost) : '-'}</td>
                <td class="text-sm">
                  ${r.referensi ? `<span class="mono text-xs text-muted">${UI.esc(r.referensi)}</span><br>` : ''}
                  <span class="text-muted">${UI.esc(r.keterangan || '')}</span><br>
                  <span class="text-xs text-muted">${UI.esc(r.pegawai?.nama || '')}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>
      </div>
    `;
  }

  return { render };
})();
