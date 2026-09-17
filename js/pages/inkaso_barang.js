/* =====================================================================
   HALAMAN: INKASO & INVENTORI BARANG UMUM
   ---------------------------------------------------------------------
   Pencatatan in/out barang reagen lab, BHP non-medis, dan ATK.
   ===================================================================== */
const InkasoBarang = (() => {
  let w = null;
  let tabAktif = 'stok';
  
  let dataBarang = [];
  let dataRiwayat = [];

  async function render(el, param) {
    if (!App.boleh('master') && !App.boleh('admin')) {
      el.innerHTML = UI.kosong('Akses ditolak', 'Anda tidak punya izin membuka Inventori Barang.');
      return;
    }
    
    w = el;
    w.innerHTML = `
      <div class="mb-16">
        <h1>Inkaso &amp; Inventori Umum</h1>
        <p class="text-muted mb-0">Manajemen stok barang, reagen laboratorium, dan ATK (In/Out).</p>
      </div>

      <div class="tabs" id="tabs">
        <button class="tab on" data-t="stok">Katalog Stok</button>
        <button class="tab" data-t="riwayat">Riwayat In/Out</button>
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
          <button class="btn btn-secondary" id="btnInOut">Catat In/Out</button>
          <button class="btn btn-primary" id="btnTambahBarang">${UI.ikon('plus',15)} Master Barang</button>
        </div>
      </div>
      
      <div class="card">
        <div class="table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>Nama Barang</th>
            <th>Kategori</th>
            <th class="text-right">Sisa Stok</th>
            <th>Satuan</th>
            <th style="width:1%"></th>
          </tr></thead>
          <tbody id="tabelBarang">
            <!-- Isi dirender via JS -->
          </tbody>
        </table></div>
      </div>
    `;
    
    isi.querySelector('#btnTambahBarang').addEventListener('click', () => dialogBarang());
    isi.querySelector('#btnInOut').addEventListener('click', () => dialogMutasi());
    
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
      <tr>
        <td><b>${UI.esc(b.nama)}</b>${b.kode ? `<br><span class="text-xs text-muted mono">${UI.esc(b.kode)}</span>` : ''}</td>
        <td><span class="badge b-netral">${UI.esc(b.kategori || 'Umum')}</span></td>
        <td class="text-right mono text-lg ${b.stok_sekarang <= (b.stok_minimum||0) ? 'font-bold text-red-600' : ''}">
          ${b.stok_sekarang}
        </td>
        <td class="text-muted">${UI.esc(b.satuan)}</td>
        <td><button class="btn btn-secondary btn-sm" data-edit-barang="${b.id}">Edit</button></td>
      </tr>
    `).join('');
    
    tbody.querySelectorAll('button[data-edit-barang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.editBarang;
        const b = dataBarang.find(x => x.id === id);
        if (b) dialogBarang(b);
      });
    });
  }

  async function dialogBarang(b = null) {
    const hasil = await UI.modal({
      judul: b ? 'Edit Barang' : 'Tambah Barang Baru',
      isi: `
        <div class="field"><label>Kode (Opsional)</label>
          <input type="text" name="kode" class="w-full mono" value="${UI.esc(b?.kode||'')}"></div>
        <div class="field"><label>Nama Barang</label>
          <input type="text" name="nama" class="w-full" value="${UI.esc(b?.nama||'')}" required></div>
        <div class="form-row">
          <div class="field"><label>Kategori</label>
            <input type="text" name="kategori" class="w-full" value="${UI.esc(b?.kategori||'ATK')}" placeholder="ATK / Reagen / dsb."></div>
          <div class="field"><label>Satuan</label>
            <input type="text" name="satuan" class="w-full" value="${UI.esc(b?.satuan||'Pcs')}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Batas Stok Minimum</label>
            <input type="number" name="stok_minimum" class="w-full" value="${b?.stok_minimum||0}"></div>
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
              UI.toast('Gagal menghapus. Barang mungkin sudah memiliki riwayat mutasi.', 'err');
              return false;
            }
          }
        }] : []),
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan', kelas: 'btn-primary', aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            if (!d.nama || !d.satuan) return false;
            try {
              await DB.inventoriSimpan({
                kode: d.kode || null, nama: d.nama,
                kategori: d.kategori || null, satuan: d.satuan,
                stok_minimum: Number(d.stok_minimum) || 0,
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

  async function dialogMutasi() {
    if (!dataBarang.filter(b => b.aktif).length) {
      UI.toast('Belum ada master barang.', 'warn'); return;
    }
    
    const hasil = await UI.modal({
      judul: 'Catat In / Out (Inkaso)',
      isi: `
        <div class="field"><label>Jenis Mutasi</label>
          <div class="flex gap-4">
            <label class="flex-1 p-8 border rounded" style="border-color:var(--garis);cursor:pointer">
              <input type="radio" name="jenis" value="IN" checked> <b>Barang Masuk (IN)</b>
            </label>
            <label class="flex-1 p-8 border rounded" style="border-color:var(--garis);cursor:pointer">
              <input type="radio" name="jenis" value="OUT"> <b>Barang Keluar (OUT)</b>
            </label>
          </div>
        </div>
        <div class="field"><label>Pilih Barang</label>
          <select name="barang_id" class="w-full">
            ${dataBarang.filter(b => b.aktif).map(b => `<option value="${b.id}">${UI.esc(b.nama)} (Sisa: ${b.stok_sekarang} ${UI.esc(b.satuan)})</option>`).join('')}
          </select></div>
        <div class="field"><label>Jumlah Mutasi</label>
          <input type="number" name="jumlah" min="0.01" step="0.01" class="w-full" placeholder="Contoh: 10" required></div>
        <div class="field"><label>Keterangan / Referensi</label>
          <input type="text" name="keterangan" class="w-full" placeholder="mis. Pembelian dari supplier A"></div>
        <div id="galatMutasi"></div>
      `,
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan Mutasi', kelas: 'btn-primary', aksi: async (badan) => {
            const d = UI.nilaiForm(badan);
            if (!d.barang_id || !d.jumlah || Number(d.jumlah) <= 0) {
              badan.querySelector('#galatMutasi').innerHTML = `<div class="banner err"><div>Jumlah harus lebih dari nol.</div></div>`;
              return false;
            }
            try {
              // Cek stok khusus untuk OUT
              if (d.jenis === 'OUT') {
                const b = dataBarang.find(x => x.id === d.barang_id);
                if (b && b.stok_sekarang < Number(d.jumlah)) {
                  throw new Error(`Stok tidak mencukupi. Sisa stok hanya ${b.stok_sekarang}.`);
                }
              }
              await DB.inventoriMutasi(d.barang_id, d.jenis, Number(d.jumlah), d.keterangan || null);
              return true;
            } catch (e) {
              badan.querySelector('#galatMutasi').innerHTML = `<div class="banner err"><div>${UI.esc(e.message)}</div></div>`;
              return false;
            }
          }
        }
      ]
    });
    
    if (hasil) { UI.toast('Mutasi stok berhasil dicatat.', 'ok'); await muatUlang(); }
  }

  /* ------------------- TAB RIWAYAT ------------------- */
  function tabRiwayat(isi) {
    if (!dataRiwayat.length) {
      isi.innerHTML = `<div class="card p-16 text-center text-muted">Belum ada riwayat In/Out barang.</div>`;
      return;
    }
    
    isi.innerHTML = `
      <div class="card">
        <div class="table-wrap"><table class="tbl w-full">
          <thead><tr>
            <th>Waktu</th>
            <th>Barang</th>
            <th>Jenis</th>
            <th class="text-right">Stok Awal</th>
            <th class="text-right">Jumlah</th>
            <th class="text-right">Stok Akhir</th>
            <th>Petugas / Keterangan</th>
          </tr></thead>
          <tbody>
            ${dataRiwayat.map(r => `
              <tr>
                <td class="text-muted text-xs whitespace-nowrap">
                  ${UI.tglPendek(r.tanggal)}<br>${UI.jam(r.tanggal)}
                </td>
                <td><b>${UI.esc(r.barang?.nama || '')}</b></td>
                <td>
                  <span class="badge ${r.jenis === 'IN' ? 'b-selesai' : r.jenis === 'OUT' ? 'b-batal' : 'b-menunggu'}">
                    ${r.jenis}
                  </span>
                </td>
                <td class="text-right mono text-muted">${r.stok_awal}</td>
                <td class="text-right mono font-bold text-lg">${r.jenis === 'OUT' ? '-' : '+'}${r.jumlah}</td>
                <td class="text-right mono">${r.stok_akhir}</td>
                <td class="text-sm">
                  ${UI.esc(r.pegawai?.nama || '')}<br>
                  <span class="text-muted">${UI.esc(r.keterangan || '')}</span>
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
