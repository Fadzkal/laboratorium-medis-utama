/* ===================== MASTER DATA (ADMIN) =====================
   Pengelolaan daftar obat, diagnosa ICD-10, dan tindakan ICD-9-CM.
   Dipisahkan dari Pengaturan karena isinya daftar klinis yang berubah
   terus, bukan konfigurasi yang sekali diatur lalu ditinggal.
   ============================================================== */
const Master = (() => {

  let tabAktif = 'eksekutif';
  let cache = { obat: [], icd10: [], icd9: [], lab: [] };

  const GOLONGAN = ['Bebas', 'Bebas Terbatas', 'Keras', 'Narkotika', 'Psikotropika'];
  const BENTUK = ['Tablet', 'Kaplet', 'Kapsul', 'Sirup', 'Sirup kering', 'Suspensi',
                  'Serbuk', 'Krim', 'Salep', 'Gel', 'Tetes mata', 'Tetes telinga',
                  'Tetes hidung', 'Injeksi', 'Supositoria', 'Inhaler', 'Larutan'];
  const SATUAN = ['Tablet', 'Kapsul', 'Botol', 'Tube', 'Sachet', 'Ampul', 'Vial',
                  'Pot', 'Strip', 'Bungkus', 'mL'];

  /* ================================================================ *
   *  HAPUS DATA (dipakai oleh semua tab)
   *
   *  Baris master ditaut ke banyak tempat (resep, stok apotek, tindakan,
   *  hasil lab, dst). Bukan aplikasi ini yang memutuskan mana yang aman
   *  dihapus — constraint foreign key di database yang menolaknya kalau
   *  baris itu sudah pernah dipakai. Di sini kita cuma menerjemahkan
   *  penolakan itu jadi pesan yang dimengerti petugas, dan untuk "Hapus
   *  Semua" kita coba satu per satu supaya baris yang aman tetap
   *  terhapus walau ada baris lain yang ditolak.
   * ================================================================ */
  function pesanGagalHapus(e) {
    const p = ((e && e.message) || '').toLowerCase();
    if (p.includes('foreign key') || p.includes('violates'))
      return 'Sudah pernah dipakai di data lain (resep, tindakan, stok, atau hasil pasien), jadi tidak bisa dihapus. Nonaktifkan saja lewat kotak centang Aktif.';
    return (e && e.message) || 'Gagal menghapus.';
  }

  async function hapusMassal(daftar, ambilId, fnHapus) {
    let berhasil = 0; const gagal = [];
    for (const item of daftar) {
      try { await fnHapus(ambilId(item)); berhasil++; }
      catch (e) { gagal.push(item); }
    }
    return { berhasil, gagal };
  }

  function ringkasanHapus(berhasil, jmlGagal) {
    if (!jmlGagal) return `${berhasil} baris berhasil dihapus.`;
    if (!berhasil) return `Tidak ada yang terhapus — seluruh ${jmlGagal} baris masih dipakai di data lain.`;
    return `${berhasil} baris berhasil dihapus, ${jmlGagal} baris dilewati karena masih dipakai di data lain.`;
  }

  /* Konfirmasi "Hapus Semua" minta diketik ulang supaya tidak terpicu
     klik tidak sengaja — ini menghapus permanen, bukan menonaktifkan. */
  async function modalHapusSemua(label, jumlah) {
    return await UI.modal({
      judul: `Hapus semua ${label}?`,
      isi: `
        <div class="banner err mb-16">${UI.ikon('peringatan', 16)}
          <div><b>${jumlah} baris akan dicoba dihapus permanen.</b> Baris yang
          sudah pernah dipakai di data lain otomatis ditolak database dan
          tidak ikut terhapus — hanya yang belum pernah dipakai yang benar-benar
          hilang. Baris yang berhasil dihapus tidak bisa dikembalikan.</div></div>
        <div class="field mb-0"><label>Ketik <b>HAPUS</b> untuk melanjutkan</label>
          <input type="text" id="ketikHapusSemua" autocomplete="off"></div>`,
      tombol: [
        { teks: 'Batal', nilai: false },
        { teks: 'Hapus semua', kelas: 'btn-danger', aksi: (b) => {
            const v = b.querySelector('#ketikHapusSemua').value.trim().toUpperCase();
            if (v !== 'HAPUS') { UI.toast('Ketik HAPUS untuk mengonfirmasi.', 'err'); return false; }
            return true;
          } }
      ]
    }) === true;
  }

  async function render(el, param) {
    if (!App.boleh('master_data')) {
      el.innerHTML = UI.kosong('Akses ditolak', 'Anda tidak punya izin membuka Master Data.');
      return;
    }
    if (param && param[0]) tabAktif = param[0];

    el.innerHTML = `
      <div class="mb-16">
        <h1>Master Data</h1>
        <p class="text-muted mb-0">Daftar obat, diagnosa, dan tindakan yang muncul saat
          dokter memeriksa pasien.</p>
      </div>
      <div class="tabs" id="tabsMaster">
        ${[['eksekutif', 'Statistik Eksekutif'],['obat','Obat'],['icd10','Diagnosa (ICD-10)'],['icd9','Tindakan (ICD-9-CM)'],
           ['kodepx', 'Kode Pemeriksaan'],['hargapx', 'Harga Pemeriksaan'],['lab','Pemeriksaan Lab'],['dokter','Dokter'],['rekanan','Rekanan']]
          .map(([k,t]) => `<button class="tab ${tabAktif === k ? 'on' : ''}" data-t="${k}">${t}</button>`).join('')}
      </div>
      <div id="isiMaster">${UI.memuat(3)}</div>`;

    el.querySelector('#tabsMaster').addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      tabAktif = b.dataset.t;
      el.querySelectorAll('#tabsMaster .tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      gambarTab(el.querySelector('#isiMaster'));
    });

    await gambarTab(el.querySelector('#isiMaster'));
  }

  async function gambarTab(w) {
    w.innerHTML = UI.memuat(3);
    try {
      if (tabAktif === 'eksekutif') return await tabEksekutif(w);
      if (tabAktif === 'obat')  return await tabObat(w);
      if (tabAktif === 'icd10') return await tabIcd10(w);
      if (tabAktif === 'icd9')  return await tabIcd9(w);
      if (tabAktif === 'kodepx') return await tabKodePx(w);
      if (tabAktif === 'hargapx') return await tabHargaPx(w);
      if (tabAktif === 'lab')   return await tabLab(w);
      if (tabAktif === 'dokter') return await tabDokter(w);
      if (tabAktif === 'rekanan') return await tabRekanan(w);
    } catch (e) {
      w.innerHTML = `<div class="banner err">${UI.esc(e.message)}</div>`;
    }
  }

  /* ================================================================ *
   *  STATISTIK EKSEKUTIF
   * ================================================================ */
  async function tabEksekutif(w) {
    try {
      const stat = await DB.statistikEksekutif();
      
      const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
      const tren = (skrg, lalu) => {
        if (!lalu) return '<span class="text-muted text-sm">Tidak ada data bulan lalu</span>';
        const pr = ((skrg - lalu) / lalu) * 100;
        if (pr > 0) return `<span class="text-green-600 font-bold text-sm">▲ Naik ${pr.toFixed(1)}%</span> dari bulan lalu`;
        if (pr < 0) return `<span class="text-red-600 font-bold text-sm">▼ Turun ${Math.abs(pr).toFixed(1)}%</span> dari bulan lalu`;
        return '<span class="text-muted text-sm">Sama dengan bulan lalu</span>';
      };

      w.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          
          <!-- PELAYANAN -->
          <div class="card" style="padding: 18px; border-left: 4px solid var(--utama); background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <h3 class="text-muted flex items-center gap-8" style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
              ${UI.ikon('pasien', 18)} Pelayanan
            </h3>
            <div class="flex items-end justify-between" style="margin-top: 16px;">
              <div>
                <div class="text-xs text-muted" style="margin-bottom: 4px;">Total Pasien Terdaftar</div>
                <div style="font-size: 28px; font-weight: 700; color: var(--ink-900); line-height: 1;">
                  ${stat.total_pasien.toLocaleString('id-ID')}
                </div>
              </div>
              <div style="text-align: right;">
                <div class="text-xs text-muted" style="margin-bottom: 4px;">Kunjungan Hari Ini</div>
                <div style="font-size: 22px; font-weight: 700; color: var(--utama); line-height: 1;">
                  ${stat.kunjungan_hari_ini}
                </div>
              </div>
            </div>
          </div>

          <!-- KEUANGAN -->
          <div class="card" style="padding: 18px; border-left: 4px solid #10b981; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <h3 class="text-muted flex items-center gap-8" style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
              ${UI.ikon('laporan', 18)} Pendapatan Kotor
            </h3>
            <div class="text-xs text-muted" style="margin-top: 16px; margin-bottom: 4px;">Total Tagihan Kasir Bulan Ini</div>
            <div style="font-size: 24px; font-weight: 800; color: #047857;">
              ${rp(stat.pendapatan_bulan_ini)}
            </div>
            <div style="margin-top: 10px;">
              ${tren(stat.pendapatan_bulan_ini, stat.pendapatan_bulan_lalu)}
            </div>
          </div>

          <!-- INVENTORI -->
          <div class="card" style="padding: 18px; border-left: 4px solid #f59e0b; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <h3 class="text-muted flex items-center gap-8" style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
              ${UI.ikon('stetoskop', 18)} Stok &amp; Inventori
            </h3>
            <div class="flex items-center gap-12" style="margin-top: 16px;">
              <div style="font-size: 32px; font-weight: 800; color: ${stat.stok_kritis_inventori > 0 ? '#ea580c' : '#16a34a'}; line-height: 1;">
                ${stat.stok_kritis_inventori}
              </div>
              <div class="text-sm" style="line-height: 1.4;">
                Barang inventori / reagen <b>menipis</b> (di bawah stok minimum).<br>
                <a href="#/inkaso" style="color: var(--utama); font-weight: 600; font-size: 12px; display: inline-block; margin-top: 4px; text-decoration: none;">Cek Inventori &rarr;</a>
              </div>
            </div>
          </div>

          <!-- HRIS -->
          <div class="card" style="padding: 18px; border-left: 4px solid #6366f1; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <h3 class="text-muted flex items-center gap-8" style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
              ${UI.ikon('jam', 18)} HRIS &amp; Karyawan
            </h3>
            <div class="flex items-end justify-between" style="margin-top: 16px;">
              <div>
                <div class="text-xs text-muted" style="margin-bottom: 4px;">Hadir Hari Ini</div>
                <div style="font-size: 28px; font-weight: 700; color: var(--ink-900); line-height: 1;">
                  ${stat.pegawai_hadir_hari_ini} <span style="font-size: 14px; font-weight: 400; color: var(--ink-500);">staf</span>
                </div>
              </div>
              <div style="text-align: right;">
                <div class="text-xs text-muted" style="margin-bottom: 4px;">Proyeksi Bonus Bulan Ini</div>
                <div style="font-size: 20px; font-weight: 700; color: #4338ca; line-height: 1;">
                  ${rp(stat.total_bonus_bulan_ini)}
                </div>
              </div>
            </div>
          </div>

        </div>
      `;
    } catch (e) {
      w.innerHTML = `<div class="banner err">Gagal memuat statistik: ${UI.esc(e.message)}</div>`;
    }
  }

  /* ================================================================ *
   *  OBAT
   * ================================================================ */
  async function tabObat(w) {
    w.innerHTML = `
      <div class="card">
        <div class="card-head flex-wrap gap-8">
          <div class="search-box flex-1" style="min-width:220px">
            <span class="ico">${UI.ikon('cari',16)}</span>
            <input type="search" id="cariObat" placeholder="Cari nama obat, generik, atau kode…">
          </div>
          <label class="check"><input type="checkbox" id="ikutNonaktif">
            <span class="nowrap">Tampilkan yang nonaktif</span></label>
          <button class="btn btn-secondary btn-sm" id="btnImpor">${UI.ikon('unduh',15)} Impor CSV</button>
          <button class="btn btn-secondary btn-sm" id="btnEkspor">Ekspor CSV</button>
          <button class="btn btn-secondary btn-sm" id="btnHapusSemuaObat">${UI.ikon('hapus',15)} Hapus semua</button>
          <button class="btn btn-primary btn-sm" id="btnObatBaru">${UI.ikon('plus',15)} Tambah obat</button>
        </div>
        <div class="card-body tight" id="tabelObat">${UI.memuat(4)}</div>
      </div>`;

    const muat = async () => {
      const kata = w.querySelector('#cariObat').value;
      const ikut = w.querySelector('#ikutNonaktif').checked;
      const t = w.querySelector('#tabelObat');
      t.innerHTML = UI.memuat(3);
      cache.obat = await DB.daftarObat(kata, ikut);
      gambarTabelObat(t, cache.obat);
    };

    w.querySelector('#cariObat').addEventListener('input', UI.tunda(muat, 250));
    w.querySelector('#ikutNonaktif').addEventListener('change', muat);
    w.querySelector('#btnObatBaru').addEventListener('click', async () => {
      if (await modalObat()) muat();
    });
    w.querySelector('#btnEkspor').addEventListener('click', () => eksporObat(cache.obat));
    w.querySelector('#btnImpor').addEventListener('click', async () => {
      if (await modalImporObat()) muat();
    });
    w.querySelector('#btnHapusSemuaObat').addEventListener('click', async () => {
      if (!cache.obat.length) { UI.toast('Tidak ada obat untuk dihapus.', 'warn'); return; }
      if (!await modalHapusSemua('obat yang sedang tampil', cache.obat.length)) return;
      const { berhasil, gagal } = await hapusMassal(cache.obat, (o) => o.id, DB.hapusObat);
      UI.toast(ringkasanHapus(berhasil, gagal.length), gagal.length ? 'warn' : 'ok', 6000);
      muat();
    });

    await muat();
  }

  function gambarTabelObat(t, data) {
    if (!data.length) {
      t.innerHTML = UI.kosong('Tidak ada obat', 'Ubah kata pencarian, atau tambahkan obat baru.');
      return;
    }
    t.innerHTML = `<div class="table-wrap"><table class="tbl">
      <thead><tr><th style="width:90px">Kode</th><th>Nama</th><th>Bentuk</th>
        <th>Golongan</th><th style="width:110px">Kode KFA</th>
        <th style="width:100px">Formularium</th><th style="width:82px">Aktif</th>
        <th style="width:1%"></th></tr></thead>
      <tbody>${data.map((o, i) => `
        <tr>
          <td class="mono muted">${UI.esc(o.kode_internal || '—')}</td>
          <td><b>${UI.esc(o.nama)}</b>
            ${o.nama_generik && o.nama_generik !== o.nama
              ? `<div class="text-xs text-muted">${UI.esc(o.nama_generik)}</div>` : ''}</td>
          <td class="muted">${UI.esc([o.bentuk_sediaan, o.kekuatan].filter(Boolean).join(' · ') || '—')}</td>
          <td class="muted">${UI.esc(o.golongan || '—')}</td>
          <td class="mono ${o.kode_kfa ? '' : 'muted'}">${UI.esc(o.kode_kfa || '—')}</td>
          <td class="check-cell"><label class="check"><input type="checkbox" data-form="${i}"
            ${o.formularium ? 'checked' : ''}><span class="text-xs">Fornas</span></label></td>
          <td class="check-cell"><label class="check"><input type="checkbox" data-aktif-obat="${i}"
            ${o.aktif ? 'checked' : ''}><span class="text-xs">Aktif</span></label></td>
          <td class="text-right"><button class="btn btn-secondary btn-sm" data-ubah-obat="${i}">Ubah</button>
            <button class="btn btn-ghost btn-sm" data-hapus-obat="${i}">Hapus</button></td>
        </tr>`).join('')}</tbody></table></div>`;

    t.querySelectorAll('[data-ubah-obat]').forEach(b => b.addEventListener('click', async () => {
      if (await modalObat(data[+b.dataset.ubahObat])) gambarTab(document.getElementById('isiMaster'));
    }));
    t.querySelectorAll('[data-hapus-obat]').forEach(b => b.addEventListener('click', async () => {
      const o = data[+b.dataset.hapusObat];
      if (!await UI.konfirmasi(`Hapus obat "${o.nama}"?`,
          'Baris ini dihapus permanen. Kalau masih pernah dipakai di resep atau stok apotek, penghapusan akan ditolak — nonaktifkan saja lewat kotak centang Aktif.',
          'Hapus', true)) return;
      try {
        await DB.hapusObat(o.id);
        UI.toast('Obat dihapus.', 'ok');
        gambarTab(document.getElementById('isiMaster'));
      } catch (e) { UI.toast(pesanGagalHapus(e), 'err', 6000); }
    }));
    t.querySelectorAll('[data-aktif-obat]').forEach(c => c.addEventListener('change', async () => {
      const o = data[+c.dataset.aktifObat];
      try { await DB.simpanObat({ aktif: c.checked }, o.id); o.aktif = c.checked;
            UI.toast(c.checked ? 'Obat diaktifkan.' : 'Obat dinonaktifkan.', 'ok', 1600); }
      catch (e) { c.checked = !c.checked; UI.toast(e.message, 'err'); }
    }));
    t.querySelectorAll('[data-form]').forEach(c => c.addEventListener('change', async () => {
      const o = data[+c.dataset.form];
      try { await DB.simpanObat({ formularium: c.checked }, o.id); o.formularium = c.checked; }
      catch (e) { c.checked = !c.checked; UI.toast(e.message, 'err'); }
    }));
  }

  async function modalObat(obat = null) {
    const baru = !obat;
    const opsi = (arr, nilai) => arr.map(o =>
      `<option ${nilai === o ? 'selected' : ''}>${UI.esc(o)}</option>`).join('');

    return await UI.modal({
      judul: baru ? 'Tambah obat' : 'Ubah obat',
      lebar: true,
      isi: `<div id="galatObat"></div>
        <div class="form-row c2">
          <div class="field"><label>Nama obat <span class="req">*</span></label>
            <input type="text" name="nama" value="${UI.esc(obat?.nama)}"
              placeholder="Paracetamol 500 mg"></div>
          <div class="field"><label>Nama generik</label>
            <input type="text" name="nama_generik" value="${UI.esc(obat?.nama_generik)}"
              placeholder="Paracetamol"></div>
        </div>
        <div class="form-row c4">
          <div class="field"><label>Bentuk sediaan</label>
            <select name="bentuk_sediaan"><option value="">—</option>${opsi(BENTUK, obat?.bentuk_sediaan)}</select></div>
          <div class="field"><label>Kekuatan</label>
            <input type="text" name="kekuatan" value="${UI.esc(obat?.kekuatan)}" placeholder="500 mg"></div>
          <div class="field"><label>Satuan <span class="req">*</span></label>
            <select name="satuan">${opsi(SATUAN, obat?.satuan || 'Tablet')}</select></div>
          <div class="field"><label>Golongan</label>
            <select name="golongan"><option value="">—</option>${opsi(GOLONGAN, obat?.golongan)}</select></div>
        </div>
        <div class="form-row c3">
          <div class="field"><label>Kode internal</label>
            <input type="text" name="kode_internal" value="${UI.esc(obat?.kode_internal)}"
              placeholder="OB071">
            <div class="hint">Dipakai untuk mencocokkan baris saat impor CSV.</div></div>
          <div class="field"><label>Kode KFA</label>
            <input type="text" name="kode_kfa" value="${UI.esc(obat?.kode_kfa)}">
            <div class="hint">Kamus Farmasi &amp; Alkes — untuk SatuSehat.</div></div>
          <div class="field"><label>Kode obat PCare</label>
            <input type="text" name="kode_pcare" value="${UI.esc(obat?.kode_pcare)}">
            <div class="hint">Untuk obat program / DPHO.</div></div>
        </div>
        <div class="form-row c2 mb-0">
          <div class="field mb-0"><label>Harga <span class="opt">bila dipakai</span></label>
            <input type="number" name="harga" value="${obat?.harga ?? 0}" min="0" step="100"></div>
          <div class="field mb-0" style="align-self:end">
            <label class="check mb-8"><input type="checkbox" name="formularium"
              ${obat?.formularium ? 'checked' : ''}><span>Masuk formularium nasional</span></label>
            <label class="check mb-8"><input type="checkbox" name="dpho"
              ${obat?.dpho ? 'checked' : ''}><span>Ada di DPHO BPJS</span></label>
            <label class="check"><input type="checkbox" name="aktif"
              ${obat === null || obat.aktif ? 'checked' : ''}><span>Aktif — muncul saat dokter meresepkan</span></label>
          </div>
        </div>
        <p class="hint mt-8 mb-0">Obat bertanda DPHO dikirim ke PCare memakai
          <span class="mono">kdObat</span> di atas; yang tidak bertanda dikirim
          sebagai <span class="mono">nmObatNonDPHO</span> dengan namanya. Salah
          tanda tidak menimbulkan galat — klaim obat programnya saja yang tidak
          terbayar.</p>`,
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: baru ? 'Simpan obat' : 'Simpan perubahan', kelas: 'btn-primary', aksi: async (b) => {
            const d = UI.nilaiForm(b);
            const g = b.querySelector('#galatObat');
            if (!d.nama || d.nama.trim().length < 2) {
              g.innerHTML = '<div class="banner err">Nama obat wajib diisi.</div>'; return false;
            }
            if (!d.satuan) {
              g.innerHTML = '<div class="banner err">Satuan wajib dipilih.</div>'; return false;
            }
            d.harga = Number(d.harga) || 0;
            if (!d.kode_internal) delete d.kode_internal;   // biarkan kosong, bukan string kosong
            try {
              return await DB.simpanObat(d, obat?.id || null);
            } catch (e) {
              g.innerHTML = `<div class="banner err">${UI.esc(
                (e.message || '').includes('duplicate')
                  ? 'Kode internal itu sudah dipakai obat lain.' : e.message)}</div>`;
              return false;
            }
        }}
      ]
    });
  }

  /* --------------------------- CSV --------------------------- */
  const KOLOM_OBAT = ['kode_internal','nama','nama_generik','bentuk_sediaan','kekuatan',
                      'satuan','golongan','kode_kfa','kode_pcare','dpho','formularium','harga'];

  function eksporObat(data) {
    if (!data.length) { UI.toast('Tidak ada data untuk diekspor.', 'warn'); return; }
    const bersih = (v) => {
      const s = (v ?? '').toString().replace(/"/g, '""');
      return /[",n;]/.test(s) ? `"${s}"` : s;
    };
    const isi = [KOLOM_OBAT.join(';'),
      ...data.map(o => KOLOM_OBAT.map(k => bersih(o[k])).join(';'))].join('rn');
    const blob = new Blob(['﻿' + isi], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `master-obat-${UI.hariIni()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    UI.toast(`${data.length} obat diekspor.`, 'ok');
  }

  /* Pembaca CSV sederhana yang tetap benar bila ada tanda kutip dan
     pemisah di dalam isi sel. Menerima pemisah titik koma maupun koma. */
  function bacaCsv(teks) {
    teks = teks.replace(/^﻿/, '');
    const pemisah = (teks.split('n')[0].match(/;/g) || []).length >=
                    (teks.split('n')[0].match(/,/g) || []).length ? ';' : ',';
    const baris = []; let sel = ''; let barisIni = []; let dalamKutip = false;

    for (let i = 0; i < teks.length; i++) {
      const c = teks[i];
      if (dalamKutip) {
        if (c === '"' && teks[i + 1] === '"') { sel += '"'; i++; }
        else if (c === '"') dalamKutip = false;
        else sel += c;
      } else if (c === '"') dalamKutip = true;
      else if (c === pemisah) { barisIni.push(sel); sel = ''; }
      else if (c === 'n') { barisIni.push(sel); baris.push(barisIni); barisIni = []; sel = ''; }
      else if (c !== 'r') sel += c;
    }
    if (sel !== '' || barisIni.length) { barisIni.push(sel); baris.push(barisIni); }
    return baris.filter(b => b.some(x => x.trim() !== ''));
  }

  function petakanBarisObat(baris) {
    if (!baris.length) return { data: [], galat: ['Berkas kosong.'] };
    const judul = baris[0].map(h => h.trim().toLowerCase().replace(/s+/g, '_'));
    const iNama = judul.indexOf('nama');
    if (iNama === -1) return { data: [], galat: ['Kolom "nama" tidak ditemukan pada baris judul.'] };

    const data = []; const galat = [];
    baris.slice(1).forEach((b, n) => {
      const rec = {};
      judul.forEach((h, i) => {
        if (!KOLOM_OBAT.includes(h)) return;
        const v = (b[i] ?? '').trim();
        if (v === '') return;
        if (h === 'formularium') rec[h] = ['1','ya','true','y','v'].includes(v.toLowerCase());
        else if (h === 'harga') rec[h] = Number(v.replace(/[^d.]/g, '')) || 0;
        else rec[h] = v;
      });
      if (!rec.nama) { galat.push(`Baris ${n + 2}: nama obat kosong, dilewati.`); return; }
      if (!rec.satuan) rec.satuan = 'Tablet';
      if (!rec.kode_internal) {
        galat.push(`Baris ${n + 2}: kode internal kosong — baris ini akan ditambah sebagai obat baru.`);
      }
      rec.aktif = true;
      data.push(rec);
    });
    return { data, galat };
  }

  async function modalImporObat() {
    return await UI.modal({
      judul: 'Impor daftar obat dari CSV',
      lebar: true,
      isi: `
        <p class="text-sm text-muted">Berkas CSV dengan baris judul. Kolom yang dikenali:</p>
        <pre style="background:var(--ink-50);border:1px solid var(--ink-200);border-radius:6px;
                    padding:9px 12px;font-size:11.5px;overflow-x:auto;margin:0 0 14px"
        >${KOLOM_OBAT.join(';')}</pre>
        <p class="text-sm text-muted">Hanya kolom <b>nama</b> yang wajib. Baris dicocokkan
          dengan <b>kode_internal</b>, jadi impor bisa diulang untuk memperbarui data tanpa
          menggandakannya. Pemisah titik koma maupun koma sama-sama diterima.</p>
        <div class="field mt-12">
          <label>Pilih berkas CSV</label>
          <input type="file" id="berkasCsv" accept=".csv,text/csv">
        </div>
        <div id="pratinjauCsv"></div>`,
      siap: (badan) => {
        badan._dataSiap = null;
        const berkas = badan.querySelector('#berkasCsv');
        const pratinjau = badan.querySelector('#pratinjauCsv');
        berkas.addEventListener('change', () => {
          const f = berkas.files && berkas.files[0];
          if (!f) return;
          if (f.size > 3 * 1024 * 1024) {
            pratinjau.innerHTML = '<div class="banner err mt-12">Berkas terlalu besar. '
              + 'Batasnya 3 MB — pecah menjadi beberapa berkas.</div>';
            return;
          }
          const pembaca = new FileReader();
          pembaca.onload = () => {
            try {
              const { data, galat } = petakanBarisObat(bacaCsv(String(pembaca.result)));
              badan._dataSiap = data;
              pratinjau.innerHTML = `
                <div class="banner ${data.length ? 'ok' : 'err'} mt-12">
                  <div><b>${data.length} baris siap diimpor.</b>
                  ${galat.length ? `<br>${galat.length} catatan:<br>`
                    + galat.slice(0, 5).map(g => UI.esc(g)).join('<br>')
                    + (galat.length > 5 ? `<br>… dan ${galat.length - 5} lainnya` : '') : ''}</div>
                </div>
                ${data.length ? `<div class="table-wrap mt-12" style="max-height:230px;overflow-y:auto">
                  <table class="tbl"><thead><tr><th>Kode</th><th>Nama</th><th>Bentuk</th>
                    <th>Satuan</th><th>KFA</th></tr></thead>
                  <tbody>${data.slice(0, 10).map(o => `<tr>
                    <td class="mono muted">${UI.esc(o.kode_internal || '—')}</td>
                    <td>${UI.esc(o.nama)}</td>
                    <td class="muted">${UI.esc(o.bentuk_sediaan || '—')}</td>
                    <td class="muted">${UI.esc(o.satuan)}</td>
                    <td class="mono muted">${UI.esc(o.kode_kfa || '—')}</td></tr>`).join('')}
                  </tbody></table>
                  ${data.length > 10 ? `<div class="text-xs text-muted" style="padding:8px 14px">
                    Menampilkan 10 dari ${data.length} baris.</div>` : ''}
                </div>` : ''}`;
            } catch (e) {
              badan._dataSiap = null;
              pratinjau.innerHTML = `<div class="banner err mt-12">Berkas tidak bisa dibaca: ${UI.esc(e.message)}</div>`;
            }
          };
          pembaca.readAsText(f, 'utf-8');
        });
      },
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Impor', kelas: 'btn-primary', aksi: async (b) => {
            const simpan = b._dataSiap;
            if (!simpan || !simpan.length) {
              UI.toast('Pilih berkas CSV yang valid terlebih dahulu.', 'err'); return false;
            }
            try {
              const hasil = await DB.imporObat(simpan);
              UI.toast(`${hasil.jumlah} obat berhasil diimpor.`, 'ok', 4000);
              return hasil;
            } catch (e) {
              b.querySelector('#pratinjauCsv').innerHTML =
                `<div class="banner err mt-12">${UI.esc(e.message)}</div>`;
              return false;
            }
        }}
      ]
    });
  }

  /* ================================================================ *
   *  ICD-10
   * ================================================================ */
  async function tabIcd10(w) {
    w.innerHTML = `
      <div class="banner info">
        <div>Diagnosa yang ditandai <b>sering dipakai</b> muncul sebagai tombol cepat
          di layar dokter, jadi tidak perlu diketik berulang.</div>
      </div>
      <div class="card">
        <div class="card-head flex-wrap gap-8">
          <div class="search-box flex-1" style="min-width:220px">
            <span class="ico">${UI.ikon('cari',16)}</span>
            <input type="search" id="cariIcd" placeholder="Cari kode atau nama diagnosa…">
          </div>
          <label class="check"><input type="checkbox" id="hanyaFav">
            <span class="nowrap">Hanya yang sering dipakai</span></label>
          <button class="btn btn-secondary btn-sm" id="btnImporIcd">${UI.ikon('unduh',15)} Impor CSV</button>
          <button class="btn btn-secondary btn-sm" id="btnEksporIcd">Ekspor CSV</button>
          <button class="btn btn-secondary btn-sm" id="btnHapusSemuaIcd">${UI.ikon('hapus',15)} Hapus semua</button>
          <button class="btn btn-primary btn-sm" id="btnIcdBaru">${UI.ikon('plus',15)} Tambah diagnosa</button>
        </div>
        <div class="card-body tight" id="tabelIcd">${UI.memuat(4)}</div>
      </div>`;

    const muat = async () => {
      const t = w.querySelector('#tabelIcd');
      t.innerHTML = UI.memuat(3);
      cache.icd10 = await DB.daftarIcd10(w.querySelector('#cariIcd').value,
                                         w.querySelector('#hanyaFav').checked);
      gambarTabelIcd10(t, cache.icd10);
    };
    w.querySelector('#cariIcd').addEventListener('input', UI.tunda(muat, 250));
    w.querySelector('#hanyaFav').addEventListener('change', muat);
    w.querySelector('#btnEksporIcd').addEventListener('click', () => eksporIcd10(cache.icd10));
    w.querySelector('#btnImporIcd').addEventListener('click', async () => {
      if (await modalImporIcd10()) muat();
    });
    w.querySelector('#btnIcdBaru').addEventListener('click', async () => {
      if (await modalIcd10()) muat();
    });
    w.querySelector('#btnHapusSemuaIcd').addEventListener('click', async () => {
      if (!cache.icd10.length) { UI.toast('Tidak ada diagnosa untuk dihapus.', 'warn'); return; }
      if (!await modalHapusSemua('diagnosa ICD-10 yang sedang tampil', cache.icd10.length)) return;
      const { berhasil, gagal } = await hapusMassal(cache.icd10, (d) => d.kode, DB.hapusIcd10);
      UI.toast(ringkasanHapus(berhasil, gagal.length), gagal.length ? 'warn' : 'ok', 6000);
      muat();
    });
    await muat();
  }

  function gambarTabelIcd10(t, data) {
    if (!data.length) { t.innerHTML = UI.kosong('Tidak ada diagnosa', 'Ubah kata pencarian.'); return; }
    t.innerHTML = `<div class="table-wrap"><table class="tbl">
      <thead><tr><th style="width:86px">Kode</th><th>Nama Indonesia</th><th>Nama Inggris</th>
        <th style="width:140px">Kategori</th><th style="width:132px">Sering dipakai</th>
        <th style="width:76px">Aktif</th><th style="width:1%"></th></tr></thead>
      <tbody>${data.map((d, i) => `
        <tr>
          <td class="mono"><b>${UI.esc(d.kode)}</b></td>
          <td>${UI.esc(d.nama_id || '—')}</td>
          <td class="muted">${UI.esc(d.nama_en || '—')}</td>
          <td class="muted">${UI.esc(d.kategori || '—')}</td>
          <td class="check-cell"><label class="check"><input type="checkbox" data-fav="${i}"
            ${d.sering_dipakai ? 'checked' : ''}><span class="text-xs">Tombol cepat</span></label></td>
          <td class="check-cell"><label class="check"><input type="checkbox" data-aktif-icd="${i}"
            ${d.aktif ? 'checked' : ''}><span class="text-xs">Aktif</span></label></td>
          <td class="text-right"><button class="btn btn-secondary btn-sm" data-ubah-icd="${i}">Ubah</button>
            <button class="btn btn-ghost btn-sm" data-hapus-icd="${i}">Hapus</button></td>
        </tr>`).join('')}</tbody></table></div>`;

    t.querySelectorAll('[data-fav]').forEach(c => c.addEventListener('change', async () => {
      const d = data[+c.dataset.fav];
      try { await DB.simpanIcd10({ sering_dipakai: c.checked }, d.kode); d.sering_dipakai = c.checked; }
      catch (e) { c.checked = !c.checked; UI.toast(e.message, 'err'); }
    }));
    t.querySelectorAll('[data-aktif-icd]').forEach(c => c.addEventListener('change', async () => {
      const d = data[+c.dataset.aktifIcd];
      try { await DB.simpanIcd10({ aktif: c.checked }, d.kode); d.aktif = c.checked; }
      catch (e) { c.checked = !c.checked; UI.toast(e.message, 'err'); }
    }));
    t.querySelectorAll('[data-ubah-icd]').forEach(b => b.addEventListener('click', async () => {
      if (await modalIcd10(data[+b.dataset.ubahIcd])) gambarTab(document.getElementById('isiMaster'));
    }));
    t.querySelectorAll('[data-hapus-icd]').forEach(b => b.addEventListener('click', async () => {
      const d = data[+b.dataset.hapusIcd];
      if (!await UI.konfirmasi(`Hapus diagnosa ${d.kode}?`,
          'Baris ini dihapus permanen. Kalau masih dipakai sebagai diagnosa pada suatu kunjungan, penghapusan akan ditolak — nonaktifkan saja lewat kotak centang Aktif.',
          'Hapus', true)) return;
      try {
        await DB.hapusIcd10(d.kode);
        UI.toast('Diagnosa dihapus.', 'ok');
        gambarTab(document.getElementById('isiMaster'));
      } catch (e) { UI.toast(pesanGagalHapus(e), 'err', 6000); }
    }));
  }

  async function modalIcd10(d = null) {
    const baru = !d;
    return await UI.modal({
      judul: baru ? 'Tambah diagnosa ICD-10' : `Ubah diagnosa ${d.kode}`,
      isi: `<div id="galatIcd"></div>
        <div class="form-row c2">
          <div class="field"><label>Kode ICD-10 <span class="req">*</span></label>
            <input type="text" name="kode" value="${UI.esc(d?.kode)}" ${baru ? '' : 'disabled'}
              placeholder="J06.9" maxlength="10"></div>
          <div class="field"><label>Kategori</label>
            <input type="text" name="kategori" value="${UI.esc(d?.kategori)}"
              placeholder="Saluran Napas"></div>
        </div>
        <div class="field"><label>Nama Indonesia <span class="req">*</span></label>
          <input type="text" name="nama_id" value="${UI.esc(d?.nama_id)}"
            placeholder="ISPA (Infeksi Saluran Napas Atas)"></div>
        <div class="field"><label>Nama Inggris</label>
          <input type="text" name="nama_en" value="${UI.esc(d?.nama_en)}"></div>
        <div class="field mb-0">
          <label class="check mb-8"><input type="checkbox" name="sering_dipakai"
            ${d?.sering_dipakai ? 'checked' : ''}><span>Tampilkan sebagai tombol cepat di layar dokter</span></label>
          <label class="check"><input type="checkbox" name="aktif"
            ${d === null || d.aktif ? 'checked' : ''}><span>Aktif</span></label>
        </div>`,
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan', kelas: 'btn-primary', aksi: async (b) => {
            const v = UI.nilaiForm(b);
            const g = b.querySelector('#galatIcd');
            if (baru && !v.kode) { g.innerHTML = '<div class="banner err">Kode wajib diisi.</div>'; return false; }
            if (!v.nama_id) { g.innerHTML = '<div class="banner err">Nama Indonesia wajib diisi.</div>'; return false; }
            if (baru) v.kode = v.kode.toUpperCase().trim();
            try { return await DB.simpanIcd10(baru ? v : { ...v, kode: undefined }, baru ? null : d.kode); }
            catch (e) {
              g.innerHTML = `<div class="banner err">${UI.esc(
                (e.message || '').includes('duplicate') ? 'Kode itu sudah ada.' : e.message)}</div>`;
              return false;
            }
        }}
      ]
    });
  }

  /* --------------------------- CSV (ICD-10) ---------------------------
     Sama polanya dengan CSV Obat di atas. Bedanya: di tabel icd10, `kode`
     ITU SENDIRI adalah primary key (tidak ada kode_internal terpisah),
     jadi kolom pencocokan dan kolom wajibnya adalah `kode`, bukan `nama`. */
  const KOLOM_ICD10 = ['kode', 'nama_id', 'nama_en', 'kategori', 'sering_dipakai'];

  function eksporIcd10(data) {
    if (!data.length) { UI.toast('Tidak ada data untuk diekspor.', 'warn'); return; }
    const bersih = (v) => {
      const s = (v ?? '').toString().replace(/"/g, '""');
      return /[",n;]/.test(s) ? `"${s}"` : s;
    };
    const isi = [KOLOM_ICD10.join(';'),
      ...data.map(d => KOLOM_ICD10.map(k => bersih(d[k])).join(';'))].join('rn');
    const blob = new Blob(['﻿' + isi], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `master-icd10-${UI.hariIni()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    UI.toast(`${data.length} diagnosa diekspor.`, 'ok');
  }

  function petakanBarisIcd10(baris) {
    if (!baris.length) return { data: [], galat: ['Berkas kosong.'] };
    const judul = baris[0].map(h => h.trim().toLowerCase().replace(/s+/g, '_'));
    const iKode = judul.indexOf('kode');
    if (iKode === -1) return { data: [], galat: ['Kolom "kode" tidak ditemukan pada baris judul.'] };

    const data = []; const galat = []; const terlihat = new Set();
    baris.slice(1).forEach((b, n) => {
      const rec = {};
      judul.forEach((h, i) => {
        if (!KOLOM_ICD10.includes(h)) return;
        const v = (b[i] ?? '').trim();
        if (v === '') return;
        if (h === 'sering_dipakai') rec[h] = ['1', 'ya', 'true', 'y', 'v'].includes(v.toLowerCase());
        else if (h === 'kode') rec[h] = v.toUpperCase();
        else rec[h] = v;
      });
      if (!rec.kode) { galat.push(`Baris ${n + 2}: kode kosong, dilewati.`); return; }
      if (!rec.nama_id) { galat.push(`Baris ${n + 2} (${rec.kode}): nama Indonesia kosong, dilewati.`); return; }
      if (terlihat.has(rec.kode)) {
        galat.push(`Baris ${n + 2}: kode ${rec.kode} muncul dua kali di berkas ini, baris pertama dipakai.`);
        return;
      }
      terlihat.add(rec.kode);
      rec.aktif = true;
      data.push(rec);
    });
    return { data, galat };
  }

  async function modalImporIcd10() {
    return await UI.modal({
      judul: 'Impor daftar diagnosa ICD-10 dari CSV',
      lebar: true,
      isi: `
        <p class="text-sm text-muted">Berkas CSV dengan baris judul. Kolom yang dikenali:</p>
        <pre style="background:var(--ink-50);border:1px solid var(--ink-200);border-radius:6px;
                    padding:9px 12px;font-size:11.5px;overflow-x:auto;margin:0 0 14px"
        >${KOLOM_ICD10.join(';')}</pre>
        <p class="text-sm text-muted">Kolom <b>kode</b> dan <b>nama_id</b> wajib diisi. Baris
          dicocokkan dengan <b>kode</b> — kode ICD-10 itu sendiri — jadi impor bisa diulang
          untuk memperbarui data atau menambah revisi baru tanpa menggandakan baris yang
          sudah ada. Pemisah titik koma maupun koma sama-sama diterima.</p>
        <div class="field mt-12">
          <label>Pilih berkas CSV</label>
          <input type="file" id="berkasCsvIcd" accept=".csv,text/csv">
        </div>
        <div id="pratinjauCsvIcd"></div>`,
      siap: (badan) => {
        badan._dataSiap = null;
        const berkas = badan.querySelector('#berkasCsvIcd');
        const pratinjau = badan.querySelector('#pratinjauCsvIcd');
        berkas.addEventListener('change', () => {
          const f = berkas.files && berkas.files[0];
          if (!f) return;
          if (f.size > 3 * 1024 * 1024) {
            pratinjau.innerHTML = '<div class="banner err mt-12">Berkas terlalu besar. '
              + 'Batasnya 3 MB — pecah menjadi beberapa berkas.</div>';
            return;
          }
          const pembaca = new FileReader();
          pembaca.onload = () => {
            try {
              const { data, galat } = petakanBarisIcd10(bacaCsv(String(pembaca.result)));
              badan._dataSiap = data;
              pratinjau.innerHTML = `
                <div class="banner ${data.length ? 'ok' : 'err'} mt-12">
                  <div><b>${data.length} baris siap diimpor.</b>
                  ${galat.length ? `<br>${galat.length} catatan:<br>`
                    + galat.slice(0, 5).map(g => UI.esc(g)).join('<br>')
                    + (galat.length > 5 ? `<br>… dan ${galat.length - 5} lainnya` : '') : ''}</div>
                </div>
                ${data.length ? `<div class="table-wrap mt-12" style="max-height:230px;overflow-y:auto">
                  <table class="tbl"><thead><tr><th>Kode</th><th>Nama Indonesia</th>
                    <th>Kategori</th></tr></thead>
                  <tbody>${data.slice(0, 10).map(d => `<tr>
                    <td class="mono">${UI.esc(d.kode)}</td>
                    <td>${UI.esc(d.nama_id)}</td>
                    <td class="muted">${UI.esc(d.kategori || '—')}</td></tr>`).join('')}
                  </tbody></table>
                  ${data.length > 10 ? `<div class="text-xs text-muted" style="padding:8px 14px">
                    Menampilkan 10 dari ${data.length} baris.</div>` : ''}
                </div>` : ''}`;
            } catch (e) {
              badan._dataSiap = null;
              pratinjau.innerHTML = `<div class="banner err mt-12">Berkas tidak bisa dibaca: ${UI.esc(e.message)}</div>`;
            }
          };
          pembaca.readAsText(f, 'utf-8');
        });
      },
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Impor', kelas: 'btn-primary', aksi: async (b) => {
            const simpan = b._dataSiap;
            if (!simpan || !simpan.length) {
              UI.toast('Pilih berkas CSV yang valid terlebih dahulu.', 'err'); return false;
            }
            const pratinjau = b.querySelector('#pratinjauCsvIcd');
            try {
              const hasil = await DB.imporIcd10(simpan, (selesai, total) => {
                if (total > 500) {
                  pratinjau.innerHTML = `<div class="banner info mt-12">Mengimpor…
                    ${selesai} dari ${total} baris. Jangan tutup jendela ini.</div>`;
                }
              });
              UI.toast(`${hasil.jumlah} diagnosa berhasil diimpor.`, 'ok', 4000);
              return hasil;
            } catch (e) {
              pratinjau.innerHTML =
                `<div class="banner err mt-12">${UI.esc(e.message)}
                  Baris yang sempat masuk sebelum galat ini tidak hilang — pilih
                  berkas yang sama lagi dan impor ulang untuk melanjutkan.</div>`;
              return false;
            }
        }}
      ]
    });
  }

  /* ================================================================ *
   *  ICD-9-CM
   * ================================================================ */
  async function tabIcd9(w) {
    w.innerHTML = `
      <div class="card">
        <div class="card-head flex-wrap gap-8">
          <div class="search-box flex-1" style="min-width:200px">
            <span class="ico">${UI.ikon('cari',16)}</span>
            <input type="search" id="cariT" placeholder="Cari kode atau nama tindakan…">
          </div>
          <select id="filterKategori" style="width:auto">
            <option value="">Semua kategori</option>
            <option value="GIGI">Gigi</option>
            <option value="UMUM">Umum</option>
            <option value="PENUNJANG">Penunjang</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="btnHapusSemuaT">${UI.ikon('hapus',15)} Hapus semua</button>
          <button class="btn btn-primary btn-sm" id="btnTBaru">${UI.ikon('plus',15)} Tambah tindakan</button>
        </div>
        <div class="card-body tight" id="tabelT">${UI.memuat(4)}</div>
      </div>`;

    const muat = async () => {
      const t = w.querySelector('#tabelT');
      t.innerHTML = UI.memuat(3);
      cache.icd9 = await DB.daftarIcd9(w.querySelector('#cariT').value,
                                       w.querySelector('#filterKategori').value || null);
      gambarTabelIcd9(t, cache.icd9);
    };
    w.querySelector('#cariT').addEventListener('input', UI.tunda(muat, 250));
    w.querySelector('#filterKategori').addEventListener('change', muat);
    w.querySelector('#btnTBaru').addEventListener('click', async () => {
      if (await modalIcd9()) muat();
    });
    w.querySelector('#btnHapusSemuaT').addEventListener('click', async () => {
      if (!cache.icd9.length) { UI.toast('Tidak ada tindakan untuk dihapus.', 'warn'); return; }
      if (!await modalHapusSemua('tindakan ICD-9-CM yang sedang tampil', cache.icd9.length)) return;
      const { berhasil, gagal } = await hapusMassal(cache.icd9, (d) => d.kode, DB.hapusIcd9);
      UI.toast(ringkasanHapus(berhasil, gagal.length), gagal.length ? 'warn' : 'ok', 6000);
      muat();
    });
    await muat();
  }

  function gambarTabelIcd9(t, data) {
    if (!data.length) { t.innerHTML = UI.kosong('Tidak ada tindakan', 'Ubah kata pencarian.'); return; }
    t.innerHTML = `<div class="table-wrap"><table class="tbl">
      <thead><tr><th style="width:86px">Kode</th><th>Nama tindakan</th>
        <th style="width:110px">Kategori</th><th style="width:128px">Perlu nomor gigi</th>
        <th style="width:132px">Sering dipakai</th><th style="width:76px">Aktif</th>
        <th style="width:1%"></th></tr></thead>
      <tbody>${data.map((d, i) => `
        <tr>
          <td class="mono"><b>${UI.esc(d.kode)}</b></td>
          <td>${UI.esc(d.nama_id)}
            ${d.nama_en ? `<div class="text-xs text-muted">${UI.esc(d.nama_en)}</div>` : ''}</td>
          <td><span class="badge ${d.kategori === 'GIGI' ? 'b-bpjs' : 'b-umum'}">${UI.esc(d.kategori || '—')}</span></td>
          <td class="check-cell"><label class="check"><input type="checkbox" data-gigi="${i}"
            ${d.per_gigi ? 'checked' : ''}><span class="text-xs">Per gigi</span></label></td>
          <td class="check-cell"><label class="check"><input type="checkbox" data-favt="${i}"
            ${d.sering_dipakai ? 'checked' : ''}><span class="text-xs">Sering</span></label></td>
          <td class="check-cell"><label class="check"><input type="checkbox" data-aktift="${i}"
            ${d.aktif ? 'checked' : ''}><span class="text-xs">Aktif</span></label></td>
          <td class="text-right"><button class="btn btn-secondary btn-sm" data-ubah-t="${i}">Ubah</button>
            <button class="btn btn-ghost btn-sm" data-hapus-t="${i}">Hapus</button></td>
        </tr>`).join('')}</tbody></table></div>`;

    const ubah = async (d, patch, kotak) => {
      try { await DB.simpanIcd9(patch, d.kode); Object.assign(d, patch); }
      catch (e) { kotak.checked = !kotak.checked; UI.toast(e.message, 'err'); }
    };
    t.querySelectorAll('[data-gigi]').forEach(c => c.addEventListener('change', () =>
      ubah(data[+c.dataset.gigi], { per_gigi: c.checked }, c)));
    t.querySelectorAll('[data-favt]').forEach(c => c.addEventListener('change', () =>
      ubah(data[+c.dataset.favt], { sering_dipakai: c.checked }, c)));
    t.querySelectorAll('[data-aktift]').forEach(c => c.addEventListener('change', () =>
      ubah(data[+c.dataset.aktift], { aktif: c.checked }, c)));
    t.querySelectorAll('[data-ubah-t]').forEach(b => b.addEventListener('click', async () => {
      if (await modalIcd9(data[+b.dataset.ubahT])) gambarTab(document.getElementById('isiMaster'));
    }));
    t.querySelectorAll('[data-hapus-t]').forEach(b => b.addEventListener('click', async () => {
      const d = data[+b.dataset.hapusT];
      if (!await UI.konfirmasi(`Hapus tindakan ${d.kode}?`,
          'Baris ini dihapus permanen. Kalau masih dipakai sebagai tindakan pada suatu kunjungan atau tarif kasir, penghapusan akan ditolak — nonaktifkan saja lewat kotak centang Aktif.',
          'Hapus', true)) return;
      try {
        await DB.hapusIcd9(d.kode);
        UI.toast('Tindakan dihapus.', 'ok');
        gambarTab(document.getElementById('isiMaster'));
      } catch (e) { UI.toast(pesanGagalHapus(e), 'err', 6000); }
    }));
  }

  async function modalIcd9(d = null) {
    const baru = !d;
    return await UI.modal({
      judul: baru ? 'Tambah tindakan ICD-9-CM' : `Ubah tindakan ${d.kode}`,
      isi: `<div id="galatT"></div>
        <div class="form-row c2">
          <div class="field"><label>Kode ICD-9-CM <span class="req">*</span></label>
            <input type="text" name="kode" value="${UI.esc(d?.kode)}" ${baru ? '' : 'disabled'}
              placeholder="23.09" maxlength="10"></div>
          <div class="field"><label>Kategori</label>
            <select name="kategori">
              ${['GIGI','UMUM','PENUNJANG'].map(k =>
                `<option ${(d?.kategori || 'UMUM') === k ? 'selected' : ''}>${k}</option>`).join('')}
            </select></div>
        </div>
        <div class="field"><label>Nama tindakan <span class="req">*</span></label>
          <input type="text" name="nama_id" value="${UI.esc(d?.nama_id)}"
            placeholder="Pencabutan gigi tetap"></div>
        <div class="field"><label>Nama Inggris</label>
          <input type="text" name="nama_en" value="${UI.esc(d?.nama_en)}"></div>
        <div class="field"><label>Kode tindakan PCare</label>
          <input type="text" name="kode_pcare" value="${UI.esc(d?.kode_pcare)}" class="mono">
          <div class="hint">Diisi dari referensi tindakan BPJS. Tindakan tanpa kode ini
            tercatat di rekam medis tetapi tidak bisa dikirim sebagai tindakan PCare.</div></div>
        <div class="field mb-0">
          <label class="check mb-8"><input type="checkbox" name="per_gigi"
            ${d?.per_gigi ? 'checked' : ''}><span>Tindakan pada satu gigi tertentu — meminta nomor gigi</span></label>
          <label class="check mb-8"><input type="checkbox" name="sering_dipakai"
            ${d?.sering_dipakai ? 'checked' : ''}><span>Tampilkan lebih dulu saat dicari</span></label>
          <label class="check"><input type="checkbox" name="aktif"
            ${d === null || d.aktif ? 'checked' : ''}><span>Aktif</span></label>
        </div>`,
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan', kelas: 'btn-primary', aksi: async (b) => {
            const v = UI.nilaiForm(b);
            const g = b.querySelector('#galatT');
            if (baru && !v.kode) { g.innerHTML = '<div class="banner err">Kode wajib diisi.</div>'; return false; }
            if (!v.nama_id) { g.innerHTML = '<div class="banner err">Nama tindakan wajib diisi.</div>'; return false; }
            if (baru) v.kode = v.kode.trim();
            try { return await DB.simpanIcd9(baru ? v : { ...v, kode: undefined }, baru ? null : d.kode); }
            catch (e) {
              g.innerHTML = `<div class="banner err">${UI.esc(
                (e.message || '').includes('duplicate') ? 'Kode itu sudah ada.' : e.message)}</div>`;
              return false;
            }
        }}
      ]
    });
  }


  /* ================================================================ *
   *  PEMERIKSAAN LABORATORIUM
   *
   *  Yang paling penting di layar ini bukan daftar pemeriksaannya,
   *  melainkan NILAI RUJUKANNYA. Nilai bawaan yang ikut terpasang adalah
   *  nilai umum yang lazim dipakai di Indonesia, BUKAN nilai alat yang
   *  dipakai klinik ini — dan alat berbeda punya rentang berbeda. Karena
   *  itu peringatannya dipasang di atas layar, bukan di catatan kaki.
   * ================================================================ */
  const KELOMPOK_LAB = ['Hematologi', 'Kimia Klinik', 'Urinalisis', 'Imunoserologi',
                        'Mikrobiologi', 'Feses', 'Lainnya'];

  async function tabLab(w) {
    w.innerHTML = `
      <div class="banner warn mb-16">${UI.ikon('peringatan',16)}
        <div><b>Cocokkan nilai rujukan dengan alat klinik sebelum lab dipakai melayani pasien.</b>
        Nilai bawaan di bawah ini nilai umum, bukan nilai alat Anda; yang sah adalah yang
        tercetak pada sisipan reagen. Memperbaikinya sekarang tidak mengubah hasil yang
        sudah pernah keluar — tiap lembar hasil menyimpan salinan nilai rujukan yang
        berlaku saat itu.</div></div>

      <div class="card">
        <div class="card-head">
          <div class="flex-1"><h2>Pemeriksaan laboratorium</h2>
            <div class="sub">Daftar pemeriksaan, satuannya, dan nilai rujukannya</div></div>
          <button class="btn btn-secondary btn-sm" id="btnHapusSemuaLab">${UI.ikon('hapus',15)} Hapus semua</button>
          <button class="btn btn-primary btn-sm" id="btnLabBaru">${UI.ikon('plus',15)} Tambah</button>
        </div>
        <div class="card-body">
          <div class="search-box"><span class="ico">${UI.ikon('cari',16)}</span>
            <input type="text" id="cariLab" placeholder="Cari nama atau kode pemeriksaan…"></div>
        </div>
        <div class="card-body tight" id="tabelLab">${UI.memuat(4)}</div>
      </div>`;

    cache.lab = await DB.refLab(false);
    const labTerfilter = () => {
      const k = (w.querySelector('#cariLab').value || '').toLowerCase();
      return cache.lab.filter(m => !k || m.nama.toLowerCase().includes(k) || m.kode.toLowerCase().includes(k));
    };
    const gambar = () => gambarTabelLab(w.querySelector('#tabelLab'), labTerfilter());
    const cariLabInput = w.querySelector('#cariLab');
    if (!cariLabInput) return; // Tab sudah berganti
    cariLabInput.addEventListener('input', UI.tunda(gambar, 200));
    w.querySelector('#btnLabBaru').addEventListener('click', async () => {
      if (await modalLab(null)) {
        cache.lab = await DB.refLab(false);
        gambar();
      }
    });
    w.querySelector('#btnHapusSemuaLab').addEventListener('click', async () => {
      const daftar = labTerfilter();
      if (!daftar.length) { UI.toast('Tidak ada pemeriksaan untuk dihapus.', 'warn'); return; }
      if (!await modalHapusSemua('pemeriksaan lab yang sedang tampil', daftar.length)) return;
      const { berhasil, gagal } = await hapusMassal(daftar, (m) => m.id, DB.hapusLab);
      UI.toast(ringkasanHapus(berhasil, gagal.length), gagal.length ? 'warn' : 'ok', 6000);
      cache.lab = await DB.refLab(false);
      gambar();
    });
    w.querySelector('#tabelLab').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-lab]'); if (!b) return;
      const m = cache.lab.find(x => x.id === b.dataset.lab);
      if (b.dataset.aksi === 'rujukan') { await modalRujukan(m); }
      else if (b.dataset.aksi === 'resep') { await modalResepLab(m); }
      else if (b.dataset.aksi === 'hapus') {
        if (!await UI.konfirmasi(`Hapus pemeriksaan "${m.nama}"?`,
            'Baris ini beserta nilai rujukannya dihapus permanen. Kalau pemeriksaan ini sudah pernah punya hasil pasien, penghapusan akan ditolak — nonaktifkan saja lewat kotak centang Aktif.',
            'Hapus', true)) return;
        try { await DB.hapusLab(m.id); UI.toast('Pemeriksaan dihapus.', 'ok'); }
        catch (e2) { UI.toast(pesanGagalHapus(e2), 'err', 6000); return; }
      }
      else if (!await modalLab(m)) return;
      cache.lab = await DB.refLab(false);
      gambar();
    });
    gambar();
  }

  function gambarTabelLab(t, data) {
    if (!data.length) {
      t.innerHTML = UI.kosong('Tidak ada pemeriksaan', 'Coba kata kunci lain.');
      return;
    }
    t.innerHTML = `<div class="table-wrap"><table class="tbl">
      <thead><tr><th style="width:90px">Kode</th><th>Pemeriksaan</th>
        <th style="width:130px">Kelompok</th><th style="width:80px">Satuan</th>
        <th style="width:90px">Jenis</th><th style="width:120px">Nilai rujukan</th>
        <th style="width:170px"></th></tr></thead>
      <tbody>${data.map(m => `<tr ${m.aktif ? '' : 'style="opacity:.55"'}>
        <td class="mono"><b>${UI.esc(m.kode)}</b></td>
        <td>${UI.esc(m.nama)}${m.aktif ? '' : ' <span class="badge b-batal">nonaktif</span>'}</td>
        <td class="muted">${UI.esc(m.kelompok)}</td>
        <td class="muted">${UI.esc(m.satuan || '—')}</td>
        <td class="muted">${UI.esc(m.jenis_nilai)}</td>
        <td>${(m.rujukan || []).length
          ? `<span class="badge b-ok">${m.rujukan.length} baris</span>`
          : `<span class="badge b-warn">belum ada</span>`}</td>
        <td class="text-right">
          <button class="btn btn-ghost btn-sm" data-lab="${m.id}" data-aksi="resep">Resep Reagen</button>
          <button class="btn btn-ghost btn-sm" data-lab="${m.id}" data-aksi="rujukan">Nilai rujukan</button>
          <button class="btn btn-ghost btn-sm" data-lab="${m.id}" data-aksi="ubah">Ubah</button>
          <button class="btn btn-ghost btn-sm" data-lab="${m.id}" data-aksi="hapus">Hapus</button>
        </td></tr>`).join('')}</tbody></table></div>`;
  }

  async function modalLab(m) {
    const hasil = await UI.modal({
      judul: m ? 'Ubah pemeriksaan' : 'Tambah pemeriksaan laboratorium',
      isi: `
        <div class="form-row c2">
          <div class="field"><label for="lbKode">Kode internal</label>
            <div style="display:flex; gap:8px;">
              <input type="text" id="lbKode" value="${UI.esc(m?.kode || '')}"
                placeholder="mis. H0101" ${m ? 'readonly' : ''} style="flex:1;">
              ${m ? '' : `<button type="button" class="btn btn-secondary" id="btnAutoKode" title="Buat kode otomatis berdasarkan awalan" style="padding: 0 12px; font-weight: 500;">Auto</button>`}
            </div>
          </div>
          <div class="field"><label for="lbKelompok">Kelompok</label>
            <select id="lbKelompok">${KELOMPOK_LAB.map(k =>
              `<option ${m?.kelompok === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="lbNama">Nama pemeriksaan</label>
          <input type="text" id="lbNama" value="${UI.esc(m?.nama || '')}"></div>
        <div class="form-row c3">
          <div class="field"><label for="lbSatuan">Satuan <span class="opt">opsional</span></label>
            <input type="text" id="lbSatuan" value="${UI.esc(m?.satuan || '')}" placeholder="g/dL"></div>
          <div class="field"><label for="lbJenis">Jenis nilai</label>
            <select id="lbJenis">
              <option value="ANGKA"   ${m?.jenis_nilai === 'ANGKA'   ? 'selected' : ''}>Angka</option>
              <option value="PILIHAN" ${m?.jenis_nilai === 'PILIHAN' ? 'selected' : ''}>Pilihan</option>
              <option value="TEKS"    ${m?.jenis_nilai === 'TEKS'    ? 'selected' : ''}>Teks bebas</option>
            </select></div>
          <div class="field"><label for="lbDesimal">Angka di belakang koma</label>
            <input type="number" id="lbDesimal" min="0" max="4" value="${m?.desimal ?? 1}"></div>
        </div>
        <div class="hint mb-12">Angka di belakang koma juga menentukan cara aplikasi membaca
          ketikan petugas: pemeriksaan tanpa desimal membaca "7.500" sebagai 7500,
          yang berdesimal membaca "1.005" sebagai 1,005.</div>
        <div class="field"><label for="lbPilihan">Daftar pilihan
            <span class="opt">pisahkan dengan koma, hanya untuk jenis Pilihan</span></label>
          <input type="text" id="lbPilihan" value="${UI.esc((m?.pilihan || []).join(', '))}"
            placeholder="Negatif, Positif"></div>
        <div class="field"><label for="lbNormal">Jawaban yang dianggap normal
            <span class="opt">untuk jenis Pilihan / Teks</span></label>
          <input type="text" id="lbNormal" value="${UI.esc(m?.teks_normal || '')}" placeholder="Negatif"></div>
        <div class="form-row c2">
          <div class="field mb-0"><label for="lbLoinc">Kode LOINC
              <span class="opt">diisi setelah terdaftar SatuSehat</span></label>
            <input type="text" id="lbLoinc" value="${UI.esc(m?.kode_loinc || '')}"></div>
          <div class="field mb-0"><label for="lbDisplayLoinc">Display LOINC</label>
            <input type="text" id="lbDisplayLoinc" value="${UI.esc(m?.display_loinc || '')}"></div>
        </div>
        <div class="form-row c2 mt-12">
          <div class="field mb-0"><label for="lbKodeSpecimen">Kode Spesimen</label>
            <input type="text" id="lbKodeSpecimen" value="${UI.esc(m?.kode_specimen || '')}"></div>
          <div class="field mb-0"><label for="lbNamaSpecimen">Nama Spesimen</label>
            <input type="text" id="lbNamaSpecimen" value="${UI.esc(m?.nama_specimen || '')}"></div>
        </div>
        <div class="form-row c3 mt-12">
          <div class="field mb-0"><label for="lbBarcode">Barcode</label>
            <input type="text" id="lbBarcode" value="${UI.esc(m?.barcode || '')}"></div>
          <div class="field mb-0"><label for="lbMetode">Metode</label>
            <input type="text" id="lbMetode" value="${UI.esc(m?.metode || '')}"></div>
          <div class="field mb-0"><label for="lbJanjiHasil">Janji Hasil</label>
            <input type="text" id="lbJanjiHasil" value="${UI.esc(m?.janji_hasil || '')}"></div>
        </div>
        <div class="field mt-12"><label for="lbUrutan">Urutan tampil</label>
            <input type="number" id="lbUrutan" value="${m?.urutan ?? 0}"></div>
        ${m ? `<label class="check mt-16"><input type="checkbox" id="lbAktif"
          ${m.aktif ? 'checked' : ''}><span>Aktif — muncul saat dokter meminta pemeriksaan</span></label>` : ''}`,
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan', kelas: 'btn-primary', aksi: async (b) => {
            const kode = b.querySelector('#lbKode').value.trim().toUpperCase();
            const nama = b.querySelector('#lbNama').value.trim();
            if (!kode || !nama) { UI.toast('Kode dan nama wajib diisi.', 'err'); return false; }
            const pil = b.querySelector('#lbPilihan').value.split(',')
              .map(x => x.trim()).filter(Boolean);
            try {
              await DB.simpanRefLab({
                id: m ? m.id : undefined,
                kode, nama,
                kelompok: b.querySelector('#lbKelompok').value,
                satuan: b.querySelector('#lbSatuan').value.trim() || null,
                jenis_nilai: b.querySelector('#lbJenis').value,
                desimal: Math.max(0, Math.min(4, Number(b.querySelector('#lbDesimal').value) || 0)),
                pilihan: pil.length ? pil : null,
                teks_normal: b.querySelector('#lbNormal').value.trim() || null,
                kode_loinc: b.querySelector('#lbLoinc').value.trim() || null,
                display_loinc: b.querySelector('#lbDisplayLoinc').value.trim() || null,
                kode_specimen: b.querySelector('#lbKodeSpecimen').value.trim() || null,
                nama_specimen: b.querySelector('#lbNamaSpecimen').value.trim() || null,
                barcode: b.querySelector('#lbBarcode').value.trim() || null,
                janji_hasil: b.querySelector('#lbJanjiHasil').value.trim() || null,
                metode: b.querySelector('#lbMetode').value.trim() || null,
                urutan: Number(b.querySelector('#lbUrutan').value) || 0,
                aktif: m ? b.querySelector('#lbAktif').checked : true
              });
              UI.toast('Tersimpan.');
              return true;
            } catch (e) {
              UI.toast((e.message || '').includes('duplicate')
                ? 'Kode itu sudah dipakai pemeriksaan lain.'
                : (e.message || 'Gagal menyimpan.'), 'err');
              return false;
            }
          } }
      ]
    });
    return hasil === true;
  }

  /* Nilai rujukan per jenis kelamin dan rentang umur. Umur diisi dalam
     TAHUN di layar tetapi disimpan dalam BULAN: rentang bayi hanya masuk
     akal dalam bulan, sedangkan petugas berpikir dalam tahun. */
  async function modalRujukan(m) {
    const keTahun = (bulan) => bulan === null || bulan === undefined ? null : bulan / 12;

    const gambar = (b) => {
      const daftar = (m.rujukan || []).slice().sort((x, y) =>
        String(x.jenis_kelamin || '').localeCompare(String(y.jenis_kelamin || '')) ||
        (x.umur_min_bulan || 0) - (y.umur_min_bulan || 0));
      b.querySelector('#daftarRuj').innerHTML = !daftar.length
        ? `<div class="banner warn mb-0">${UI.ikon('peringatan',16)}<div>Belum ada nilai rujukan.
             Selama kosong, hasil pemeriksaan ini tidak akan ditandai Tinggi atau Rendah.</div></div>`
        : `<div class="table-wrap"><table class="tbl">
            <thead><tr><th>Berlaku untuk</th><th>Umur</th><th>Normal</th>
              <th>Kritis (bawah / atas)</th><th></th></tr></thead>
            <tbody>${daftar.map(r => `<tr>
              <td>${r.jenis_kelamin === 'L' ? 'Laki-laki'
                   : r.jenis_kelamin === 'P' ? 'Perempuan' : 'Semua'}</td>
              <td class="muted">${r.umur_min_bulan == null && r.umur_max_bulan == null
                ? 'semua umur'
                : `${keTahun(r.umur_min_bulan) ?? 0} – ${r.umur_max_bulan == null
                    ? '∞' : keTahun(r.umur_max_bulan)} th`}</td>
              <td class="mono">${UI.esc(LabCore.teksRujukan(r, m) || '—')}</td>
              <td class="mono muted">${r.kritis_bawah ?? '—'} / ${r.kritis_atas ?? '—'}</td>
              <td class="text-right"><button class="btn btn-ghost btn-sm"
                data-hapus-ruj="${r.id}">Hapus</button></td>
            </tr>`).join('')}</tbody></table></div>`;

      b.querySelectorAll('[data-hapus-ruj]').forEach(x => x.addEventListener('click', async () => {
        if (!await UI.konfirmasi('Hapus baris nilai rujukan?',
          'Hasil yang sudah pernah keluar tidak ikut berubah — masing-masing menyimpan salinannya sendiri.',
          'Hapus', true)) return;
        try {
          await DB.hapusRujukan(x.dataset.hapusRuj);
          m.rujukan = (m.rujukan || []).filter(r => r.id !== x.dataset.hapusRuj);
          gambar(b);
        } catch (e) { UI.toast(e.message || 'Gagal menghapus.', 'err'); }
      }));
    };

    await UI.modal({
      judul: 'Nilai rujukan — ' + m.nama,
      lebar: true,
      isi: `
        <div id="daftarRuj" class="mb-16"></div>
        <div class="fieldset"><legend>Tambah baris</legend>
          <div class="form-row c3">
            <div class="field"><label for="rjJk">Berlaku untuk</label>
              <select id="rjJk"><option value="">Semua</option>
                <option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
            <div class="field"><label for="rjUmin">Umur dari (tahun)</label>
              <input type="number" id="rjUmin" step="0.01" placeholder="0"></div>
            <div class="field"><label for="rjUmax">Sampai (tahun)</label>
              <input type="number" id="rjUmax" step="0.01" placeholder="kosong = tanpa batas"></div>
          </div>
          <div class="form-row c4">
            <div class="field"><label for="rjBawah">Batas bawah</label>
              <input type="number" id="rjBawah" step="any"></div>
            <div class="field"><label for="rjAtas">Batas atas</label>
              <input type="number" id="rjAtas" step="any"></div>
            <div class="field"><label for="rjKb">Kritis bawah</label>
              <input type="number" id="rjKb" step="any"></div>
            <div class="field"><label for="rjKa">Kritis atas</label>
              <input type="number" id="rjKa" step="any"></div>
          </div>
          <div class="field"><label for="rjTeks">Teks pada lembar hasil
              <span class="opt">kosongkan untuk dibentuk otomatis dari batasnya</span></label>
            <input type="text" id="rjTeks" placeholder="mis. &lt; 200"></div>
          <div class="hint mb-0">Nilai kritis adalah hasil yang harus segera diberitahukan ke
            dokter, bukan sekadar di luar rentang normal. Kosongkan bila tidak dipakai.</div>
          <button class="btn btn-secondary btn-sm mt-16" id="btnTambahRuj">Tambah baris</button>
        </div>`,
      siap: (b) => {
        gambar(b);
        b.querySelector('#btnTambahRuj').addEventListener('click', async () => {
          const ang = (id) => {
            const v = b.querySelector(id).value.trim();
            return v === '' ? null : Number(v);
          };
          const uminTh = ang('#rjUmin'), umaxTh = ang('#rjUmax');
          const patch = {
            lab_id: m.id,
            jenis_kelamin: b.querySelector('#rjJk').value || null,
            umur_min_bulan: uminTh === null ? null : Math.round(uminTh * 12),
            umur_max_bulan: umaxTh === null ? null : Math.round(umaxTh * 12),
            batas_bawah: ang('#rjBawah'), batas_atas: ang('#rjAtas'),
            kritis_bawah: ang('#rjKb'),   kritis_atas: ang('#rjKa'),
            teks: b.querySelector('#rjTeks').value.trim() || null
          };
          if (patch.batas_bawah === null && patch.batas_atas === null && !patch.teks) {
            UI.toast('Isi minimal batas bawah, batas atas, atau teks rujukan.', 'err');
            return;
          }
          try {
            const baru = await DB.simpanRujukan(patch);
            m.rujukan = (m.rujukan || []).concat(baru);
            b.querySelectorAll('.fieldset input').forEach(i => { i.value = ''; });
            gambar(b);
            UI.toast('Baris nilai rujukan ditambahkan.');
          } catch (e) { UI.toast(e.message || 'Gagal menambah.', 'err'); }
        });
      },
      tombol: [{ teks: 'Tutup', nilai: true, kelas: 'btn-primary' }]
    });
  }

  async function modalResepLab(m) {
    if (!cache.inventori_barang) cache.inventori_barang = await DB.inventoriDaftar();
    let resep = await DB.labResepDaftar(m.id);
    
    const gambar = (b) => {
      const tb = b.querySelector('#daftarBOM');
      tb.innerHTML = !resep.length ? '<div class="banner info">Belum ada reagen yang di-set untuk pemeriksaan ini.</div>' 
        : `<div class="table-wrap"><table class="tbl">
            <thead><tr><th>Reagen / Barang</th><th>Qty Pemakaian per Tes</th><th>Satuan</th><th></th></tr></thead>
            <tbody>${resep.map(r => `<tr>
              <td>${UI.esc(r.barang?.nama || 'Unknown')}</td>
              <td class="mono">${r.qty_usage}</td>
              <td class="muted">${UI.esc(r.barang?.usage_unit || '')}</td>
              <td class="text-right"><button class="btn btn-ghost btn-sm" data-hapus-bom="${r.id}">Hapus</button></td>
            </tr>`).join('')}</tbody></table></div>`;

      tb.querySelectorAll('[data-hapus-bom]').forEach(x => x.addEventListener('click', async () => {
        try {
          await DB.labResepHapus(x.dataset.hapusBom);
          resep = resep.filter(r => r.id !== x.dataset.hapusBom);
          gambar(b);
        } catch (e) { UI.toast(e.message || 'Gagal menghapus', 'err'); }
      }));
    };

    await UI.modal({
      judul: 'Resep Reagen (BOM) — ' + m.nama,
      isi: `
        <div class="banner info">Setup berapa reagen yang otomatis berkurang saat tes <b>${UI.esc(m.nama)}</b> ini diselesaikan.</div>
        <div id="daftarBOM" class="mb-16"></div>
        <div class="fieldset"><legend>Tambah Reagen Baru</legend>
          <div class="form-row c3" style="align-items:flex-end">
            <div class="field flex-2"><label>Pilih Barang Inventori</label>
              <select id="selBarang">
                <option value="">-- Pilih Barang --</option>
                ${cache.inventori_barang.filter(x => x.aktif).map(x => `<option value="${x.id}">${UI.esc(x.nama)} (${UI.esc(x.usage_unit)})</option>`).join('')}
              </select>
            </div>
            <div class="field flex-1"><label>Jumlah Pakai</label>
              <input type="number" id="numQty" step="0.0001" min="0" placeholder="0.5">
            </div>
            <div class="field mb-0">
              <button class="btn btn-secondary" id="btnTambahBOM" style="width:100%">Tambahkan</button>
            </div>
          </div>
        </div>
      `,
      siap: (b) => {
        gambar(b);
        b.querySelector('#btnTambahBOM').addEventListener('click', async () => {
          const barangId = b.querySelector('#selBarang').value;
          const qty = Number(b.querySelector('#numQty').value);
          if (!barangId || !qty || qty <= 0) { UI.toast('Pilih barang dan isi qty pemakaian yang benar.', 'warn'); return; }
          try {
            const baru = await DB.labResepSimpan({ lab_id: m.id, barang_id: barangId, qty_usage: qty });
            baru.barang = cache.inventori_barang.find(x => x.id === barangId);
            resep.push(baru);
            b.querySelector('#selBarang').value = '';
            b.querySelector('#numQty').value = '';
            gambar(b);
            UI.toast('Reagen ditambahkan ke resep.', 'ok');
          } catch(e) {
            UI.toast(e.message.includes('duplicate') ? 'Barang sudah ada di resep ini.' : e.message, 'err');
          }
        });
      },
      tombol: [{ teks: 'Tutup', nilai: true, kelas: 'btn-primary' }]
    });
  }

  
  /* ================================================================ *
   *  TAB REKANAN (CRUD)
   * ================================================================ */
  async function tabRekanan(w) {
    try {
      const dataRekanan = await DB.daftarRekanan();
      let trs = '';
      dataRekanan.forEach((d, i) => {
        trs += `
          <tr class="clickable row-rek" data-id="${UI.esc(d.id)}" style="cursor:pointer">
            <td class="text-center text-muted" style="border-right:1px solid #eee">${i+1}</td>
            <td class="text-center cb-sel" style="border-right:1px solid #eee"><input type="checkbox" data-id="${UI.esc(d.id)}"></td>
            <td style="color:#1565C0">${UI.esc(d.id)}</td>
            <td style="font-weight:600">${UI.esc(d.nama)}</td>
            <td>${UI.esc(d.alamat || '')}</td>
            <td>${UI.esc(d.telp || '')}</td>
            <td>${UI.esc(d.kontak || '')}</td>
            <td class="text-right">${d.disc || 0}%</td>
          </tr>
        `;
      });

      w.innerHTML = `
        <div class="card mb-16">
          <div class="card-head flex align-center" style="gap:12px; background:#1976D2; color:#fff; padding:12px 16px;">
            <span style="font-weight:600">Master Rekanan</span>
          </div>
          <div style="background:#f1f5f9; padding:8px 16px; display:flex; gap:8px; align-items:center; border-bottom:1px solid #ddd">
            <button class="btn btn-sm" id="btnRekTambah" style="background:#d32f2f;color:#fff;border:none">Tambah</button>
            <button class="btn btn-sm" id="btnRekHapus" style="background:#d32f2f;color:#fff;border:none">Hapus</button>
          </div>
          <div style="overflow-x:auto">
            <table class="tbl" style="width:100%; min-width:800px" id="tblRekanan">
              <thead style="background:#7CB342; color:#fff">
                <tr>
                  <th style="width:40px;color:#fff"></th>
                  <th style="width:30px;color:#fff"><input type="checkbox" id="cbRekAll"></th>
                  <th style="width:120px;color:#fff">ID Rekanan</th>
                  <th style="color:#fff">Nama Rekanan</th>
                  <th style="color:#fff">Alamat Rekanan</th>
                  <th style="width:120px;color:#fff">Telp</th>
                  <th style="width:120px;color:#fff">Nama Kontak</th>
                  <th style="width:80px;color:#fff" class="text-right">Disc</th>
                </tr>
              </thead>
              <tbody>${trs}</tbody>
            </table>
          </div>
        </div>
      `;

      // Checkbox all
      const cbAll = w.querySelector('#cbRekAll');
      const cbs = w.querySelectorAll('tbody input[type="checkbox"]');
      cbAll.addEventListener('change', () => cbs.forEach(cb => cb.checked = cbAll.checked));

      // Hapus
      w.querySelector('#btnRekHapus').addEventListener('click', async () => {
        const checked = Array.from(cbs).filter(cb => cb.checked).map(cb => cb.dataset.id);
        if (!checked.length) return UI.toast('Pilih rekanan yang akan dihapus', 'err');
        if (!confirm(`Hapus ${checked.length} rekanan?`)) return;
        try {
          for (let id of checked) await DB.hapusRekanan(id);
          UI.toast('Berhasil dihapus', 'ok');
          tabRekanan(w);
        } catch(e) { UI.toast('Gagal hapus: ' + e.message, 'err'); }
      });

      // Tambah
      w.querySelector('#btnRekTambah').addEventListener('click', () => {
        formRekanan(null, () => tabRekanan(w));
      });

      // Edit (klik baris, bukan checkbox)
      w.querySelectorAll('.row-rek').forEach(tr => {
        tr.addEventListener('click', (e) => {
          if (e.target.closest('.cb-sel')) return; // Abaikan klik di kolom checkbox
          const id = tr.dataset.id;
          const rek = dataRekanan.find(r => String(r.id) === String(id));
          if (rek) formRekanan(rek, () => tabRekanan(w));
        });
      });

    } catch(e) {
      w.innerHTML = `<div class="banner err">${UI.esc(e.message)}</div>`;
    }
  }

  function formRekanan(rek, cbSukses) {
    UI.modal({
      judul: rek ? 'Edit Rekanan' : 'Tambah Rekanan',
      isi: `
        <div class="pdft-field mb-12">
          <label>ID Rekanan</label>
          <input type="text" id="rId" value="${rek ? UI.esc(rek.id) : ('RK' + Date.now().toString().slice(-6))}" ${rek ? 'readonly style="background:#eee"' : ''}>
        </div>
        <div class="pdft-field mb-12">
          <label>Nama Rekanan</label>
          <input type="text" id="rNama" value="${rek ? UI.esc(rek.nama) : ''}">
        </div>
        <div class="pdft-field mb-12">
          <label>Alamat</label>
          <input type="text" id="rAlamat" value="${rek ? UI.esc(rek.alamat||'') : ''}">
        </div>
        <div class="pdft-field mb-12">
          <label>No. Telp</label>
          <input type="text" id="rTelp" value="${rek ? UI.esc(rek.telp||'') : ''}">
        </div>
        <div class="pdft-field mb-12">
          <label>Kontak Person</label>
          <input type="text" id="rKontak" value="${rek ? UI.esc(rek.kontak||'') : ''}">
        </div>
        <div class="pdft-field mb-12">
          <label>Discount (%)</label>
          <input type="number" id="rDisc" value="${rek ? (rek.disc||0) : 0}">
        </div>
      `,
      tombol: [{ teks: 'Batal', nilai: null }, { teks: 'Simpan', nilai: 'ok', utm: true }],
      siap: (b) => setTimeout(() => b.querySelector('#rNama').focus(), 100),
      kembali: async (val, body) => {
        if (!val) return;
        const dat = {
          id: body.querySelector('#rId').value.trim(),
          nama: body.querySelector('#rNama').value.trim(),
          alamat: body.querySelector('#rAlamat').value.trim(),
          telp: body.querySelector('#rTelp').value.trim(),
          kontak: body.querySelector('#rKontak').value.trim(),
          disc: parseFloat(body.querySelector('#rDisc').value) || 0
        };
        if (!dat.id || !dat.nama) { UI.toast('ID dan Nama harus diisi', 'err'); return false; }
        try {
          await DB.simpanRekanan(dat);
          UI.toast('Tersimpan', 'ok');
          cbSukses();
        } catch(e) {
          UI.toast('Gagal simpan: ' + e.message, 'err');
          return false;
        }
      }
    });
  }

  /* ================================================================ *
   *  TAB DOKTER (CRUD)
   * ================================================================ */
  async function tabDokter(w) {
    w.innerHTML = `<div class="p-16">${UI.memuat(4)}</div>`;
    
    let dataDokter = [];
    try {
      dataDokter = await DB.daftarDokter();
    } catch (e) {
      UI.toast('Gagal memuat daftar dokter: ' + e.message, 'err');
      return;
    }

    const renderTabel = () => {
      let trs = '';
      if (!dataDokter.length) {
        trs = `<tr><td colspan="9" class="text-center text-muted" style="padding: 24px">Tidak ada data.</td></tr>`;
      } else {
        dataDokter.forEach((d, i) => {
          trs += `
            <tr>
              <td class="text-center text-muted" style="border-right:1px solid #eee">${i+1}</td>
              <td class="text-center" style="border-right:1px solid #eee"><input type="checkbox" value="${d.id}"></td>
              <td style="color:#1565C0">${UI.esc(d.id)}</td>
              <td style="font-weight:600">${UI.esc(d.nama)}</td>
              <td>${UI.esc(d.alamat || '')}</td>
              <td>${UI.esc(d.telepon || '')}</td>
              <td>${UI.esc(d.no_hp || '')}</td>
              <td>${UI.esc(d.kode_detailer || '')}</td>
              <td>${UI.esc(d.spesialisasi || '')}</td>
            </tr>
          `;
        });
      }
      
      w.innerHTML = `
        <div class="card mb-16">
          <div class="card-head flex align-center" style="gap:12px; background:#1976D2; color:#fff; padding:12px 16px;">
            <span style="font-weight:600">Master Dokter</span>
          </div>
          <div style="background:#f1f5f9; padding:8px 16px; display:flex; gap:8px; align-items:center; border-bottom:1px solid #ddd">
            <button class="btn btn-sm btn-primary" onclick="window.tambahDokter()" style="background:#1976D2;color:#fff;border:none">Tambah</button>
            <button class="btn btn-sm btn-primary" onclick="window.editDokter()" style="background:#1976D2;color:#fff;border:none">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="window.hapusDokter()" style="background:#d32f2f;color:#fff;border:none">Hapus</button>
          </div>
          <div style="overflow-x:auto; height: 500px">
            <table class="tbl" style="width:100%; min-width:800px" id="tblDokter">
              <thead style="background:#7CB342; color:#fff; position: sticky; top: 0">
                <tr>
                  <th style="width:40px;color:#fff"></th>
                  <th style="width:30px;color:#fff"><input type="checkbox" onchange="document.querySelectorAll('#tblDokter tbody input[type=checkbox]').forEach(cb => cb.checked = this.checked)"></th>
                  <th style="width:250px;color:#fff">ID Dokter (UUID)</th>
                  <th style="color:#fff">Nama Dokter</th>
                  <th style="color:#fff">Alamat</th>
                  <th style="width:120px;color:#fff">Telp.</th>
                  <th style="width:120px;color:#fff">HP</th>
                  <th style="width:120px;color:#fff">Kode Detailer</th>
                  <th style="width:120px;color:#fff">Spesialisasi</th>
                </tr>
              </thead>
              <tbody>
                ${trs}
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    window.tambahDokter = () => {
      bukaFormDokter();
    };

    window.editDokter = () => {
      const checked = document.querySelectorAll('#tblDokter tbody input[type=checkbox]:checked');
      if (checked.length !== 1) return UI.toast('Pilih satu dokter untuk diedit', 'err');
      const id = checked[0].value;
      const d = dataDokter.find(x => x.id === id);
      if (d) bukaFormDokter(d);
    };

    window.hapusDokter = async () => {
      const checked = document.querySelectorAll('#tblDokter tbody input[type=checkbox]:checked');
      if (checked.length === 0) return UI.toast('Pilih dokter yang akan dihapus', 'err');
      if (!confirm(`Hapus ${checked.length} dokter terpilih?`)) return;
      
      let fail = 0;
      for (const cb of checked) {
        try {
          const { error } = await DB.sb.from('pegawai').delete().eq('id', cb.value);
          if (error) throw error;
        } catch(e) { fail++; console.error(e); }
      }
      
      if (fail > 0) UI.toast(`Gagal menghapus ${fail} dokter`, 'err');
      else UI.toast('Berhasil dihapus', 'ok');
      
      tabDokter(w); // reload
    };

    function bukaFormDokter(m = null) {
      const h = `
        <form id="modal-dokter-form" style="display:flex;flex-direction:column;gap:12px;">
          <div class="field"><label>Nama Dokter</label><input type="text" id="dfNama" required value="${UI.esc(m?.nama||'')}"></div>
          <div class="field"><label>Alamat</label><input type="text" id="dfAlamat" value="${UI.esc(m?.alamat||'')}"></div>
          <div class="field"><label>Telepon</label><input type="text" id="dfTelp" value="${UI.esc(m?.telepon||'')}"></div>
          <div class="field"><label>HP</label><input type="text" id="dfHp" value="${UI.esc(m?.no_hp||'')}"></div>
          <div class="field"><label>Kode Detailer</label><input type="text" id="dfKd" value="${UI.esc(m?.kode_detailer||'')}"></div>
          <div class="field"><label>Spesialisasi</label><input type="text" id="dfSp" value="${UI.esc(m?.spesialisasi||'')}"></div>
          <div class="flex gap-8" style="justify-content:flex-end;margin-top:12px">
            <button type="button" class="btn btn-secondary" onclick="UI.tutupModal()">Batal</button>
            <button type="submit" class="btn btn-primary">${m ? 'Simpan Perubahan' : 'Tambah'}</button>
          </div>
        </form>
      `;
      UI.modal(`${m ? 'Edit' : 'Tambah'} Dokter`, h, { width: 400 });
      
      document.getElementById('modal-dokter-form').onsubmit = async (e) => {
        e.preventDefault();
        const rec = {
          nama: document.getElementById('dfNama').value,
          alamat: document.getElementById('dfAlamat').value,
          telepon: document.getElementById('dfTelp').value,
          no_hp: document.getElementById('dfHp').value,
          kode_detailer: document.getElementById('dfKd').value,
          spesialisasi: document.getElementById('dfSp').value,
        };
        try {
          const btn = e.target.querySelector('button[type=submit]');
          btn.disabled = true; btn.textContent = 'Menyimpan...';
          await DB.simpanPegawaiDokter(rec, m?.id);
          UI.tutupModal();
          UI.toast('Data dokter berhasil disimpan', 'ok');
          tabDokter(w);
        } catch(err) {
          UI.toast('Gagal menyimpan: ' + err.message, 'err');
          btn.disabled = false; btn.textContent = m ? 'Simpan Perubahan' : 'Tambah';
        }
      };
    }

    renderTabel();
  }

  /* ================================================================ *
   *  KODE PEMERIKSAAN (Tree View Skylab)
   * ================================================================ */
  async function tabKodePx(w) {
    // Styling tambahan sementara untuk mempermudah layout tree view
    w.innerHTML = `
      <style>
        .split-layout { display: flex; height: 75vh; border: 1px solid #ddd; background: #fff; }
        .split-left { width: 300px; border-right: 1px solid #ddd; display: flex; flex-direction: column; }
        .split-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .tree-header { background: #A01B22; color: #fff; padding: 12px 16px; font-weight: bold; font-size: 1.1em; display:flex; justify-content: space-between; align-items:center; }
        .tree-content { flex: 1; overflow-y: auto; padding: 12px; }
        .tree-node { margin-bottom: 4px; }
        .tree-node summary { cursor: pointer; padding: 4px 8px; border-radius: 4px; display:flex; gap: 8px; align-items:center;}
        .tree-node summary:hover { background: #f5f5f5; }
        .tree-node.active > summary { background: #e3f2fd; color: #0d47a1; font-weight: 500; }
        .tree-node .node-icon { font-family: monospace; font-size: 1.2em; line-height:1; }
        
        .detail-header { display: flex; gap: 32px; padding: 16px; border-bottom: 1px solid #ddd; }
        .detail-header-item { display: flex; gap: 16px; }
        .detail-header-item .lbl { color: #666; width: 60px; }
        .detail-header-item .val { font-weight: bold; }
        
        .detail-actions { padding: 16px; display:flex; gap:12px; align-items: center; border-bottom: 1px solid #ddd;}
        .detail-table-wrap { flex: 1; overflow-y: auto; padding: 16px; background: #f9f9f9;}
        
        table.skylab-tbl { width: 100%; border-collapse: collapse; background: #fff; }
        table.skylab-tbl th { background: #f0f0f0; border: 1px solid #ddd; padding: 8px; text-align: left; font-weight:bold; }
        table.skylab-tbl td { border: 1px solid #ddd; padding: 8px; }
        table.skylab-tbl tbody tr:nth-child(even) { background: #fafafa; }
      </style>
      <div class="split-layout">
        <div class="split-left">
          <div class="tree-header">Daftar Parameter Pemeriksaan</div>
          <div class="tree-content" id="treePx">Memuat...</div>
        </div>
        <div class="split-right">
          <div class="detail-header" id="detailHeader">
             <!-- Diisi JS -->
          </div>
          <div class="detail-actions">
            <label style="margin-bottom:0">Nama Anak Baru :</label>
            <input type="text" id="inAnakBaru" placeholder="Ketik nama pemeriksaan..." style="width:250px" disabled>
            <button class="btn btn-secondary btn-sm" id="btnTambahAnak" disabled>Tambah</button>
          </div>
          <div class="detail-table-wrap">
            <table class="skylab-tbl">
              <thead>
                <tr>
                  <th style="width: 150px">Kode PX</th>
                  <th>Nama PX</th>
                  <th style="width: 80px" class="text-center">Opsi</th>
                </tr>
              </thead>
              <tbody id="tblAnak">
                 <!-- Diisi JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Pastikan cache lab terisi
    if (!cache.lab.length) cache.lab = await DB.refLab(false);

    let prefixAktif = null;

    function renderTree() {
      // Dapatkan semua prefix (huruf pertama) unik dari cache.lab
      const listPrefix = [...new Set(cache.lab.map(x => x.kode.charAt(0).toUpperCase()))].sort();
      
      const tc = w.querySelector('#treePx');
      if (listPrefix.length === 0) {
        tc.innerHTML = '<i>Belum ada parameter lab.</i>';
        return;
      }

      tc.innerHTML = listPrefix.map(p => `
        <details class="tree-node ${prefixAktif === p ? 'active' : ''}" data-prefix="${p}" ${prefixAktif === p ? 'open' : ''}>
          <summary>
            <span class="node-icon">⊞</span> ${p}
          </summary>
        </details>
      `).join('');

      // Event listener klik
      tc.querySelectorAll('summary').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault(); 
          const det = el.parentElement;
          const pref = det.getAttribute('data-prefix');
          prefixAktif = pref;
          renderTree(); 
          renderDetail();
        });
      });
    }

    function renderDetail() {
      const dh = w.querySelector('#detailHeader');
      const inA = w.querySelector('#inAnakBaru');
      const btnA = w.querySelector('#btnTambahAnak');
      const tb = w.querySelector('#tblAnak');

      if (!prefixAktif) {
        dh.innerHTML = `<div style="color:#999; font-style:italic">Pilih kode di kiri terlebih dahulu</div>`;
        inA.disabled = true;
        btnA.disabled = true;
        tb.innerHTML = '';
        return;
      }

      const kodeID = prefixAktif.charCodeAt(0) - 64; 
      dh.innerHTML = `
        <div>
          <div class="detail-header-item"><span class="lbl">Kode</span> <span class="val">${kodeID}</span></div>
          <div class="detail-header-item"><span class="lbl">Nama</span> <span class="val">${prefixAktif}</span></div>
        </div>
      `;

      inA.disabled = false;
      btnA.disabled = false;

      const anak = cache.lab.filter(x => x.kode.startsWith(prefixAktif)).sort((a, b) => a.kode.localeCompare(b.kode));
      
      if (anak.length === 0) {
         tb.innerHTML = `<tr><td colspan="3" class="text-center text-muted">Belum ada anak untuk prefix ini</td></tr>`;
      } else {
         tb.innerHTML = anak.map(a => `
            <tr>
              <td>${UI.esc(a.kode)}</td>
              <td>${UI.esc(a.nama)}</td>
              <td class="text-center">
                <button class="btn-icon text-danger btnHapusAnak" data-id="${a.id}" title="Hapus">${UI.ikon('hapus',14)}</button>
              </td>
            </tr>
         `).join('');
      }

      tb.querySelectorAll('.btnHapusAnak').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (!confirm('Hapus parameter ini?')) return;
          try {
            await DB.hapusLab(id);
            UI.toast('Parameter dihapus', 'ok');
            cache.lab = await DB.refLab(false);
            renderDetail();
          } catch(err) {
            UI.toast(jelaskanError(err), 'err');
          }
        });
      });
    }

    w.querySelector('#btnTambahAnak').addEventListener('click', async () => {
      const inA = w.querySelector('#inAnakBaru');
      const val = inA.value.trim();
      if (!val) return;
      if (!prefixAktif) return;

      const existing = cache.lab.filter(x => x.kode.startsWith(prefixAktif));
      let max = 0;
      existing.forEach(x => {
        const strNum = x.kode.substring(1);
        const num = parseInt(strNum, 10);
        if (!isNaN(num) && num > max && strNum === num.toString().padStart(strNum.length, '0')) {
          max = num;
        }
      });
      let nextKode = prefixAktif + "0101";
      if (max > 0) {
        nextKode = prefixAktif + (max + 1).toString().padStart(4, '0');
      }

      try {
        const row = {
          kode: nextKode,
          nama: nextKode + "-" + val,
          kelompok: 'Lainnya',
          aktif: true,
          urutan: max + 1
        };
        await DB.simpanRefLab(row);
        UI.toast('Anak baru ditambahkan', 'ok');
        inA.value = '';
        cache.lab = await DB.refLab(false);
        renderTree();
        renderDetail();
      } catch(e) {
        UI.toast(jelaskanError(e), 'err');
      }
    });

    w.querySelector('#inAnakBaru').addEventListener('keyup', (e) => {
       if (e.key === 'Enter') w.querySelector('#btnTambahAnak').click();
    });

    renderTree();
    renderDetail();
  }

  /* ================================================================ *
   *  HARGA PEMERIKSAAN
   * ================================================================ */
  async function tabHargaPx(w) {
    w.innerHTML = `
      <style>
        .skylab-table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; background: #fff; }
        .skylab-table th { background: #4a90e2; color: #fff; border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: normal; }
        .skylab-table td { border: 1px solid #ddd; padding: 8px; vertical-align: middle; }
        .skylab-table tr:nth-child(even) { background: #f9f9f9; }
        .skylab-table tr:hover { background: #e3f2fd; }
        
        .harga-input { 
           width: 150px; 
           padding: 4px 8px; 
           border: 1px solid transparent; 
           background: transparent; 
           font-family: inherit;
           font-size: 14px;
        }
        .harga-input:hover { border: 1px solid #ccc; background: #fff; }
        .harga-input:focus { border: 1px solid #4a90e2; background: #fff; outline: none; }
        
        .toolbar-harga { background: #0056b3; padding: 12px; display: flex; gap: 12px; align-items: center; color: #fff; }
        .toolbar-harga input { padding: 4px 8px; border: none; border-radius: 2px; }
        .toolbar-harga select { padding: 4px; border: none; border-radius: 2px; }
      </style>
      
      <div class="toolbar-harga mb-16">
        <label style="margin:0">Filter</label>
        <input type="text" id="cariHarga" placeholder="Search..">
        <select><option>Kode Px</option><option>Nama Px</option></select>
        <!-- Tombol Tambah/Hapus ditiadakan sesuai diskusi krn sudah ada di tab Kode Px -->
        <div style="flex:1"></div>
        <div style="font-size: 12px; color: #a1c9f4;">*Ketik di kolom Harga lalu Enter untuk menyimpan</div>
      </div>
      
      <div style="overflow-x: auto;">
        <table class="skylab-table">
          <thead>
            <tr>
              <th style="width:40px; text-align:center"><input type="checkbox" disabled></th>
              <th style="width:120px">Kode Px</th>
              <th>Nama Px</th>
              <th style="width:180px">Harga</th>
              <th>Barcode</th>
              <th>Grup CN</th>
              <th>Jasmed</th>
            </tr>
          </thead>
          <tbody id="tblHarga">
            <tr><td colspan="7" class="text-center">Memuat...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    // 1. Fetch Lab Master
    const labList = await DB.refLab(false);
    // 2. Fetch Kasir Tarif (jenis = LAB)
    const tarifList = await DB.daftarTarif({ jenis: 'LAB' });
         
    // Gabungkan
    const dictTarif = {};
    if (tarifList) tarifList.forEach(t => dictTarif[t.kode] = t.tarif);
    
    let combined = labList.map(l => ({
       kode: l.kode,
       nama: l.nama,
       kelompok: l.kelompok,
       harga: dictTarif[l.kode] || 0,
       barcode: l.barcode || '',
       grup_cn: l.grup_cn || '',
       jasmed: l.jasmed || 0
    }));

    const tbody = w.querySelector('#tblHarga');
    const cariInput = w.querySelector('#cariHarga');
    if (!tbody || !cariInput) return; // Tab sudah berganti saat fetch DB


    function renderTabel() {
      const kata = cariInput.value.toLowerCase().trim();
      let filtered = combined;
      if (kata) {
         filtered = combined.filter(x => x.kode.toLowerCase().includes(kata) || x.nama.toLowerCase().includes(kata));
      }
      
      if (filtered.length === 0) {
         tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Tidak ada data</td></tr>';
         return;
      }

      tbody.innerHTML = filtered.map((x, i) => `
        <tr>
          <td class="text-center"><input type="checkbox"></td>
          <td>${UI.esc(x.kode)}</td>
          <td>${UI.esc(x.nama)}</td>
          <td style="padding: 2px">
            <input type="number" class="harga-input input-harga" data-kode="${UI.esc(x.kode)}" data-nama="${UI.esc(x.nama)}" value="${x.harga}">
          </td>
          <td style="padding: 2px">
            <input type="text" class="harga-input input-barcode" data-kode="${UI.esc(x.kode)}" data-nama="${UI.esc(x.nama)}" value="${UI.esc(x.barcode)}" style="width: 100px;">
          </td>
          <td style="padding: 2px">
            <input type="text" class="harga-input input-grup" data-kode="${UI.esc(x.kode)}" data-nama="${UI.esc(x.nama)}" value="${UI.esc(x.grup_cn)}" style="width: 60px; text-align: center;">
          </td>
          <td style="padding: 2px">
            <input type="number" class="harga-input input-jasmed" data-kode="${UI.esc(x.kode)}" data-nama="${UI.esc(x.nama)}" value="${x.jasmed}">
          </td>
        </tr>
      `).join('');
      
      // Event Listener utk Input Harga dan Detail
      tbody.querySelectorAll('.harga-input').forEach(inp => {
        let isSaving = false;
        const saveHarga = async () => {
           if (isSaving) return;
           
           const isHarga = inp.classList.contains('input-harga');
           const isBarcode = inp.classList.contains('input-barcode');
           const isGrup = inp.classList.contains('input-grup');
           const isJasmed = inp.classList.contains('input-jasmed');
           
           let v = inp.value;
           if (isHarga || isJasmed) v = Number(v) || 0;
           else v = v.trim();
           
           const oldAttr = inp.getAttribute('value');
           let oldV = oldAttr;
           if (isHarga || isJasmed) oldV = Number(oldAttr) || 0;
           
           if (v === oldV) return; // tidak ada perubahan
           
           isSaving = true;
           inp.style.backgroundColor = '#ffffcc';
           const kd = inp.getAttribute('data-kode');
           const nm = inp.getAttribute('data-nama');
           
           try {
              if (isHarga) await DB.updateHargaLab(kd, nm, v);
              else if (isBarcode) await DB.updateLabExtras(kd, { barcode: v || null });
              else if (isGrup) await DB.updateLabExtras(kd, { grup_cn: v || null });
              else if (isJasmed) await DB.updateLabExtras(kd, { jasmed: v });
              
              inp.setAttribute('value', v);
              inp.style.backgroundColor = '#e8f5e9';
              // Update state lokal
              const found = combined.find(c => c.kode === kd);
              if (found) {
                 if (isHarga) found.harga = v;
                 else if (isBarcode) found.barcode = v;
                 else if (isGrup) found.grup_cn = v;
                 else if (isJasmed) found.jasmed = v;
              }
              UI.toast('Data ' + nm + ' tersimpan!', 'ok');
           } catch(e) {
              inp.value = oldV;
              inp.style.backgroundColor = '#ffebee';
              UI.toast('Gagal menyimpan: ' + e.message, 'err');
           }
           isSaving = false;
        };
        
        inp.addEventListener('blur', saveHarga);
        inp.addEventListener('keyup', (e) => {
           if (e.key === 'Enter') { inp.blur(); }
        });
      });
    }

    cariInput.addEventListener('input', UI.tunda(renderTabel, 200));
    renderTabel();
  }

  /* ================================================================ *
   *  KODE PEMERIKSAAN (Tree View Skylab)
   * ================================================================ */
  async function tabKodePx(w) {
    // Styling tambahan sementara untuk mempermudah layout tree view
    w.innerHTML = `
      <style>
        .split-layout { display: flex; height: 75vh; border: 1px solid #ddd; background: #fff; }
        .split-left { width: 300px; border-right: 1px solid #ddd; display: flex; flex-direction: column; }
        .split-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .tree-header { background: #A01B22; color: #fff; padding: 12px 16px; font-weight: bold; font-size: 1.1em; display:flex; justify-content: space-between; align-items:center; }
        .tree-content { flex: 1; overflow-y: auto; padding: 12px; }
        .tree-node { margin-bottom: 4px; }
        .tree-node summary { cursor: pointer; padding: 4px 8px; border-radius: 4px; display:flex; gap: 8px; align-items:center;}
        .tree-node summary:hover { background: #f5f5f5; }
        .tree-node.active > summary { background: #e3f2fd; color: #0d47a1; font-weight: 500; }
        .tree-node .node-icon { font-family: monospace; font-size: 1.2em; line-height:1; }
        
        .detail-header { display: flex; gap: 32px; padding: 16px; border-bottom: 1px solid #ddd; }
        .detail-header-item { display: flex; gap: 16px; }
        .detail-header-item .lbl { color: #666; width: 60px; }
        .detail-header-item .val { font-weight: bold; }
        
        .detail-actions { padding: 16px; display:flex; gap:12px; align-items: center; border-bottom: 1px solid #ddd;}
        .detail-table-wrap { flex: 1; overflow-y: auto; padding: 16px; background: #f9f9f9;}
        
        table.skylab-tbl { width: 100%; border-collapse: collapse; background: #fff; }
        table.skylab-tbl th { background: #f0f0f0; border: 1px solid #ddd; padding: 8px; text-align: left; font-weight:bold; }
        table.skylab-tbl td { border: 1px solid #ddd; padding: 8px; }
        table.skylab-tbl tbody tr:nth-child(even) { background: #fafafa; }
      </style>
      <div class="split-layout">
        <div class="split-left">
          <div class="tree-header">Daftar Parameter Pemeriksaan</div>
          <div class="tree-content" id="treePx">Memuat...</div>
        </div>
        <div class="split-right">
          <div class="detail-header" id="detailHeader">
             <!-- Diisi JS -->
          </div>
          <div class="detail-actions">
            <label style="margin-bottom:0">Nama Anak Baru :</label>
            <input type="text" id="inAnakBaru" placeholder="Ketik nama pemeriksaan..." style="width:250px" disabled>
            <button class="btn btn-secondary btn-sm" id="btnTambahAnak" disabled>Tambah</button>
          </div>
          <div class="detail-table-wrap">
            <table class="skylab-tbl">
              <thead>
                <tr>
                  <th style="width: 150px">Kode PX</th>
                  <th>Nama PX</th>
                  <th style="width: 80px" class="text-center">Opsi</th>
                </tr>
              </thead>
              <tbody id="tblAnak">
                 <!-- Diisi JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Pastikan cache lab terisi
    if (!cache.lab.length) cache.lab = await DB.refLab(false);

    let prefixAktif = null;

    function renderTree() {
      // Dapatkan semua prefix (huruf pertama) unik dari cache.lab
      const listPrefix = [...new Set(cache.lab.map(x => x.kode.charAt(0).toUpperCase()))].sort();
      
      const tc = w.querySelector('#treePx');
      if (listPrefix.length === 0) {
        tc.innerHTML = '<i>Belum ada parameter lab.</i>';
        return;
      }

      tc.innerHTML = listPrefix.map(p => `
        <details class="tree-node ${prefixAktif === p ? 'active' : ''}" data-prefix="${p}" ${prefixAktif === p ? 'open' : ''}>
          <summary>
            <span class="node-icon">⊞</span> ${p}
          </summary>
        </details>
      `).join('');

      // Event listener klik
      tc.querySelectorAll('summary').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault(); 
          const det = el.parentElement;
          const pref = det.getAttribute('data-prefix');
          prefixAktif = pref;
          renderTree(); 
          renderDetail();
        });
      });
    }

    function renderDetail() {
      const dh = w.querySelector('#detailHeader');
      const inA = w.querySelector('#inAnakBaru');
      const btnA = w.querySelector('#btnTambahAnak');
      const tb = w.querySelector('#tblAnak');

      if (!prefixAktif) {
        dh.innerHTML = `<div style="color:#999; font-style:italic">Pilih kode di kiri terlebih dahulu</div>`;
        inA.disabled = true;
        btnA.disabled = true;
        tb.innerHTML = '';
        return;
      }

      const kodeID = prefixAktif.charCodeAt(0) - 64; 
      dh.innerHTML = `
        <div>
          <div class="detail-header-item"><span class="lbl">Kode</span> <span class="val">${kodeID}</span></div>
          <div class="detail-header-item"><span class="lbl">Nama</span> <span class="val">${prefixAktif}</span></div>
        </div>
      `;

      inA.disabled = false;
      btnA.disabled = false;

      const anak = cache.lab.filter(x => x.kode.startsWith(prefixAktif)).sort((a, b) => a.kode.localeCompare(b.kode));
      
      if (anak.length === 0) {
         tb.innerHTML = `<tr><td colspan="3" class="text-center text-muted">Belum ada anak untuk prefix ini</td></tr>`;
      } else {
         tb.innerHTML = anak.map(a => `
            <tr>
              <td>${UI.esc(a.kode)}</td>
              <td>${UI.esc(a.nama)}</td>
              <td class="text-center">
                <button class="btn-icon text-danger btnHapusAnak" data-id="${a.id}" title="Hapus">${UI.ikon('hapus',14)}</button>
              </td>
            </tr>
         `).join('');
      }

      tb.querySelectorAll('.btnHapusAnak').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (!confirm('Hapus parameter ini?')) return;
          try {
            await DB.hapusLab(id);
            UI.toast('Parameter dihapus', 'ok');
            cache.lab = await DB.refLab(false);
            renderDetail();
          } catch(err) {
            UI.toast(jelaskanError(err), 'err');
          }
        });
      });
    }

    w.querySelector('#btnTambahAnak').addEventListener('click', async () => {
      const inA = w.querySelector('#inAnakBaru');
      const val = inA.value.trim();
      if (!val) return;
      if (!prefixAktif) return;

      const existing = cache.lab.filter(x => x.kode.startsWith(prefixAktif));
      let max = 0;
      existing.forEach(x => {
        const strNum = x.kode.substring(1);
        const num = parseInt(strNum, 10);
        if (!isNaN(num) && num > max && strNum === num.toString().padStart(strNum.length, '0')) {
          max = num;
        }
      });
      let nextKode = prefixAktif + "0101";
      if (max > 0) {
        nextKode = prefixAktif + (max + 1).toString().padStart(4, '0');
      }

      try {
        const row = {
          kode: nextKode,
          nama: nextKode + "-" + val,
          kelompok: 'Lainnya',
          aktif: true,
          urutan: max + 1
        };
        await DB.simpanRefLab(row);
        UI.toast('Anak baru ditambahkan', 'ok');
        inA.value = '';
        cache.lab = await DB.refLab(false);
        renderTree();
        renderDetail();
      } catch(e) {
        UI.toast(jelaskanError(e), 'err');
      }
    });

    w.querySelector('#inAnakBaru').addEventListener('keyup', (e) => {
       if (e.key === 'Enter') w.querySelector('#btnTambahAnak').click();
    });

    renderTree();
    renderDetail();
  }

  return { render, bacaCsv, petakanBarisObat, petakanBarisIcd10 };

})();
