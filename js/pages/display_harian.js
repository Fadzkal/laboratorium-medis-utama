/* ===================== DISPLAY HARIAN ============================
   Halaman pengelolaan data lab harian + integrasi SatuSehat (SS):
   - Pencarian pasien dengan berbagai filter (bulan, instansi, dll.)
   - Tampilan data per pasien: info pasien, rincian pemeriksaan & biaya
   - Tombol aksi SatuSehat: Print Barcode, Check NIK, Encounter SS,
     Service Req SS, Specimen SS
   =================================================================== */
const DisplayHarian = (() => {

  let state = {
    bulanTahun:  '',
    instansi:    '',
    optInstansi: '',
    cari:        '',
    optDokter:   '',
    optBayar:    '',
    bayar:       '',
    optPx:       '',
    px:          '',
    status:      '',
    noLab:       '',
    optPetugas:  '',
    petugas:     '',
    daftar:      [],
    aktifId:     null
  };

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function bulanIni() {
    const n = new Date();
    return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
  }

  function rentangBulan(bt) {
    if (!bt) bt = bulanIni();
    const [y, m] = bt.split('-');
    const dari   = `${y}-${m}-01`;
    const akhir  = new Date(parseInt(y), parseInt(m), 0);
    const sampai = `${y}-${m}-${String(akhir.getDate()).padStart(2, '0')}`;
    return { dari, sampai };
  }

  function fmt(n) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString('id-ID');
  }

  let cacheMasterTarifLab = null;
  async function ambilMasterTarifLab() {
    if (cacheMasterTarifLab) return cacheMasterTarifLab;
    try {
      if (typeof DB.daftarTarif === 'function') {
        const list = await DB.daftarTarif({ jenis: 'LAB' });
        cacheMasterTarifLab = list || [];
      }
    } catch(e) {
      console.warn('Gagal memuat master tarif lab:', e);
      cacheMasterTarifLab = [];
    }
    return cacheMasterTarifLab || [];
  }

  function fmtTgl(s) {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
           + '<br>' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  }

  /* ------------------------------------------------------------------ */
  /*  Render utama                                                        */
  /* ------------------------------------------------------------------ */
  async function render(el) {
    if (!state.bulanTahun) state.bulanTahun = bulanIni();

    el.innerHTML = `
      <style>
        .dh-wrap  { display:flex; height:calc(100vh - 56px); overflow:hidden; }
        .dh-left  { width:300px; min-width:240px; background:#fff; border-right:1px solid #ddd;
                    display:flex; flex-direction:column; overflow:hidden; }
        .dh-search-hdr { background:#e8740a; color:#fff; padding:8px 12px; font-weight:700;
                         font-size:12px; flex-shrink:0; }
        .dh-filters { padding:6px 8px; border-bottom:1px solid #eee; flex-shrink:0;
                      background:#fafafa; display:flex; flex-direction:column; gap:4px; }
        .dh-filters .fr { display:flex; gap:4px; align-items:center; }
        .dh-filters select, .dh-filters input { font-size:11px; padding:3px 5px;
          border:1px solid #bbb; border-radius:2px; flex:1; }
        .dh-filters select { max-width:130px; }
        .dh-list  { flex:1; overflow-y:auto; }
        .dh-list table { width:100%; border-collapse:collapse; font-size:11px; }
        .dh-list th { background:#3c5a9a; color:#fff; padding:4px 6px; font-size:10px;
                      position:sticky; top:0; }
        .dh-list tr.baris { cursor:pointer; border-bottom:1px solid #f0f0f0; }
        .dh-list tr.baris:hover { background:#e8f0fe; }
        .dh-list tr.baris.aktif { background:#1a73e8; color:#fff; }
        .dh-list tr.baris.aktif td { color:#fff; }
        .dh-list td { padding:4px 6px; }
        .dh-list .no-lab { color:#1a73e8; font-weight:600; }
        .dh-list tr.baris.aktif .no-lab { color:#fff; }

        .dh-right { flex:1; display:flex; flex-direction:column; overflow:hidden; background:#f5f5f5; }
        .dh-empty { display:flex; align-items:center; justify-content:center; height:100%;
                    color:#aaa; font-size:14px; flex-direction:column; gap:8px; }

        .dh-header { background:#1a73e8; color:#fff; padding:8px 14px; flex-shrink:0; font-size:11px; }
        .dh-header .hgrid { display:grid; grid-template-columns:1fr 1fr; gap:2px 30px; }
        .dh-header .hr { display:flex; gap:6px; }
        .dh-header .hl { min-width:90px; opacity:.8; }
        .dh-header .hv { font-weight:600; }

        .dh-actions { display:flex; gap:6px; padding:6px 12px; background:#fff;
                      border-bottom:1px solid #ddd; flex-shrink:0; flex-wrap:wrap; }
        .dh-actions button { font-size:11px; padding:4px 12px; border:none;
                             border-radius:3px; cursor:pointer; font-weight:600; color:#fff; }
        .btn-barcode   { background:#555; }
        .btn-checknik  { background:#e8740a; }
        .btn-enc       { background:#1a73e8; }
        .btn-srv       { background:#0097a7; }
        .btn-spec      { background:#5a8a3c; }
        .dh-actions button:hover { opacity:.85; }

        .dh-tbl-wrap { flex:1; overflow:auto; padding:8px; }
        .dh-tbl { width:100%; border-collapse:collapse; font-size:11px; background:#fff; }
        .dh-tbl thead th { background:#5a8a3c; color:#fff; padding:6px 8px; text-align:left;
                           position:sticky; top:0; font-size:10px; white-space:nowrap; }
        .dh-tbl tbody tr { border-bottom:1px solid #f0f0f0; }
        .dh-tbl tbody tr:hover { background:#f0f7ff; }
        .dh-tbl td { padding:5px 8px; vertical-align:top; }
        .dh-tbl td.kd { color:#1a73e8; font-weight:600; font-family:monospace; }
        .dh-tbl td.ang { text-align:right; font-family:monospace; }
        .dh-tbl tfoot td { background:#f0f0f0; font-weight:700; padding:6px 8px; }
        .dh-tbl tfoot td.ang { text-align:right; font-family:monospace; }
      </style>

      <div class="dh-wrap" id="dhWrap">
        <!-- KIRI -->
        <div class="dh-left">
          <div class="dh-search-hdr">Pencarian</div>
          <div class="dh-filters">
            <div class="fr">
              <select id="dhOptBulan" style="max-width:140px">
                <option value="">Bulan-Tahun</option>
              </select>
              <input type="month" id="dhBulan" value="${UI.esc(state.bulanTahun)}" style="max-width:130px">
            </div>
            <div class="fr">
              <select id="dhInstansiOpt" style="max-width:140px;">
                <option value="">Semua Instansi</option>
                <option value="umum" ${state.optInstansi==='umum'?'selected':''}>Umum</option>
                <option value="bpjs" ${state.optInstansi==='bpjs'?'selected':''}>BPJS</option>
              </select>
              <input type="text" id="dhInstansi" placeholder="Ketik instansi..." value="${UI.esc(state.instansi||'')}">
            </div>
            <div class="fr">
              <select id="dhOptDokter" style="max-width:140px;">
                <option value="">Semua Dokter/Pasien</option>
              </select>
              <input type="text" id="dhCari" placeholder="Nama / No Lab / Pengirim..." value="${UI.esc(state.cari||'')}">
            </div>
            <div class="fr">
              <select id="dhOptBayar" style="max-width:140px;">
                <option value="">Pembayaran(Semua)</option>
                <option value="Lunas" ${state.optBayar==='Lunas'?'selected':''}>Lunas</option>
                <option value="Belum Lunas" ${state.optBayar==='Belum Lunas'?'selected':''}>Belum Lunas</option>
                <option value="UMUM" ${state.optBayar==='UMUM'?'selected':''}>Umum</option>
                <option value="BPJS" ${state.optBayar==='BPJS'?'selected':''}>BPJS</option>
              </select>
              <input type="text" id="dhBayar" placeholder="Ketik status / bayar..." value="${UI.esc(state.bayar||'')}">
            </div>
            <div class="fr">
              <select id="dhOptPx" style="max-width:140px;">
                <option value="">Semua Px</option>
                <option value="Hematologi" ${state.optPx==='Hematologi'?'selected':''}>Hematologi</option>
                <option value="Kimia Klinik" ${state.optPx==='Kimia Klinik'?'selected':''}>Kimia Klinik</option>
                <option value="Urin" ${state.optPx==='Urin'?'selected':''}>Urin</option>
                <option value="Imunologi" ${state.optPx==='Imunologi'?'selected':''}>Imunologi</option>
              </select>
              <input type="text" id="dhPx" placeholder="Ketik nama Px..." value="${UI.esc(state.px||'')}">
            </div>
            <div class="fr">
              <select id="dhStatus" style="max-width:140px;">
                <option value="">Semua No Lab</option>
                <option value="SELESAI" ${state.status==='SELESAI'?'selected':''}>Selesai</option>
                <option value="AKTIF" ${state.status==='AKTIF'?'selected':''}>Belum Selesai</option>
              </select>
              <input type="text" id="dhNoLab" placeholder="Ketik No Lab..." value="${UI.esc(state.noLab||'')}">
              <button id="dhRefresh" class="btn btn-ghost btn-sm" style="padding:2px 6px;" title="Muat Ulang">${UI.ikon('ulang', 15)}</button>
            </div>
            <div class="fr">
              <select id="dhOptPetugas" style="max-width:140px;">
                <option value="">Semua Petugas</option>
              </select>
              <input type="text" id="dhPetugas" placeholder="Ketik petugas / dokter..." value="${UI.esc(state.petugas||'')}">
            </div>
          </div>
          <div class="dh-list" id="dhDaftar">
            <div class="dh-empty">Memuat...</div>
          </div>
        </div>

        <!-- KANAN -->
        <div class="dh-right" id="dhKanan">
          <div class="dh-empty">
            ${UI.ikon('rekam', 44)}
            <span>Pilih pasien dari daftar</span>
          </div>
        </div>
      </div>
    `;

    // Isi pilihan bulan (24 bulan ke belakang)
    const optBulan = el.querySelector('#dhOptBulan');
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const lbl = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = lbl;
      if (val === state.bulanTahun) opt.selected = true;
      optBulan.appendChild(opt);
    }
    optBulan.addEventListener('change', e => {
      state.bulanTahun = e.target.value || bulanIni();
      el.querySelector('#dhBulan').value = state.bulanTahun;
      muat();
    });

    // Muat daftar dokter & petugas untuk dropdown filter
    try {
      const dokList = await DB.daftarDokter();
      const selDok = el.querySelector('#dhOptDokter');
      const selPet = el.querySelector('#dhOptPetugas');
      if (dokList && dokList.length) {
        dokList.forEach(d => {
          if (selDok) {
            const o = document.createElement('option');
            o.value = d.nama;
            o.textContent = d.nama;
            if (state.optDokter === d.nama) o.selected = true;
            selDok.appendChild(o);
          }
          if (selPet) {
            const o = document.createElement('option');
            o.value = d.nama;
            o.textContent = d.nama;
            if (state.optPetugas === d.nama) o.selected = true;
            selPet.appendChild(o);
          }
        });
      }
      const pegList = await DB.daftarPegawai();
      if (pegList && pegList.length && selPet) {
        pegList.forEach(p => {
          if (!dokList || !dokList.some(d => d.nama === p.nama)) {
            const o = document.createElement('option');
            o.value = p.nama;
            o.textContent = p.nama;
            if (state.optPetugas === p.nama) o.selected = true;
            selPet.appendChild(o);
          }
        });
      }
    } catch(err) {
      console.warn('Gagal memuat dokter/petugas untuk filter:', err);
    }

    const bind = (id, prop) => {
      const el2 = el.querySelector('#' + id);
      if (el2) el2.addEventListener('change', e => { state[prop] = e.target.value; muat(); });
    };
    bind('dhBulan',        'bulanTahun');
    bind('dhStatus',       'status');
    bind('dhInstansiOpt',  'optInstansi');
    bind('dhOptDokter',    'optDokter');
    bind('dhOptBayar',     'optBayar');
    bind('dhOptPx',        'optPx');
    bind('dhOptPetugas',   'optPetugas');

    const dbounce = (id, prop, ms = 300) => {
      const inp = el.querySelector('#' + id);
      if (!inp) return;
      let t;
      inp.addEventListener('input', e => {
        clearTimeout(t);
        t = setTimeout(() => { state[prop] = e.target.value; muat(); }, ms);
      });
    };
    dbounce('dhCari',     'cari');
    dbounce('dhInstansi', 'instansi');
    dbounce('dhBayar',    'bayar');
    dbounce('dhPx',       'px');
    dbounce('dhNoLab',    'noLab');
    dbounce('dhPetugas',  'petugas');

    el.querySelector('#dhRefresh').onclick = () => muat();

    await muat();

    /* ---- Fungsi load daftar ---- */
    async function muat() {
      const daftar = el.querySelector('#dhDaftar');
      daftar.innerHTML = '<div class="dh-empty">Memuat...</div>';
      try {
        const { dari, sampai } = rentangBulan(state.bulanTahun);
        let data = await DB.labAntrean(dari, sampai, state.status || null);

        // Ambil daftar nama pemeriksaan (Px) jika ada filter Px aktif
        if (data.length > 0 && (state.px || state.optPx)) {
          const pIds = data.map(d => d.id);
          try {
            const { data: hList } = await DB.sb.from('lab_hasil')
              .select('permintaan_id, ref:lab_id(nama,kode,kelompok)')
              .in('permintaan_id', pIds);
            if (hList) {
              const mapPx = {};
              hList.forEach(h => {
                if (!mapPx[h.permintaan_id]) mapPx[h.permintaan_id] = [];
                if (h.ref?.nama) mapPx[h.permintaan_id].push(h.ref.nama.toLowerCase());
                if (h.ref?.kode) mapPx[h.permintaan_id].push(h.ref.kode.toLowerCase());
                if (h.ref?.kelompok) mapPx[h.permintaan_id].push(h.ref.kelompok.toLowerCase());
              });
              data.forEach(d => {
                d.daftar_px = mapPx[d.id] || [];
              });
            }
          } catch(e) {
            console.warn('Gagal memuat item px untuk filter:', e);
          }
        }

        // 1. Filter Instansi
        let cariIns = state.instansi || '';
        if (state.optInstansi) cariIns = state.optInstansi;
        if (cariIns) {
          const ins = cariIns.toLowerCase().trim();
          data = data.filter(d => (d.cara_bayar||'').toLowerCase().includes(ins) || (d.nama_poli||'').toLowerCase().includes(ins));
        }

        // 2. Filter Dokter/Pasien/Cari
        if (state.optDokter) {
          const od = state.optDokter.toLowerCase().trim();
          data = data.filter(d => (d.nama_dokter||'').toLowerCase().includes(od));
        }
        if (state.cari) {
          const k = state.cari.toLowerCase().trim();
          data = data.filter(d =>
            (d.nama_pasien||'').toLowerCase().includes(k) ||
            (d.no_lab||'').toLowerCase().includes(k) ||
            (d.no_rm||'').toLowerCase().includes(k) ||
            (d.nama_dokter||'').toLowerCase().includes(k)
          );
        }

        // 3. Filter Pembayaran
        if (state.optBayar) {
          const ob = state.optBayar.toLowerCase();
          if (ob === 'lunas') {
            data = data.filter(d => d.status_bayar === 'LUNAS' || d.lunas === true || d.status === 'SELESAI');
          } else if (ob === 'belum lunas') {
            data = data.filter(d => d.status_bayar !== 'LUNAS' && d.lunas !== true && d.status !== 'SELESAI');
          } else {
            data = data.filter(d => (d.cara_bayar||'').toLowerCase().includes(ob));
          }
        }
        if (state.bayar) {
          const kb = state.bayar.toLowerCase().trim();
          data = data.filter(d =>
            (d.cara_bayar||'').toLowerCase().includes(kb) ||
            (d.status_bayar||'').toLowerCase().includes(kb) ||
            (kb === 'lunas' && (d.status_bayar === 'LUNAS' || d.lunas === true || d.status === 'SELESAI')) ||
            (kb.includes('belum') && d.status_bayar !== 'LUNAS' && d.status !== 'SELESAI')
          );
        }

        // 4. Filter Px (Pemeriksaan)
        if (state.optPx) {
          const opx = state.optPx.toLowerCase();
          data = data.filter(d => (d.daftar_px || []).some(p => p.includes(opx)));
        }
        if (state.px) {
          const kpx = state.px.toLowerCase().trim();
          data = data.filter(d => (d.daftar_px || []).some(p => p.includes(kpx)));
        }

        // 5. Filter No Lab spesifik
        if (state.noLab) {
          const knl = state.noLab.toLowerCase().trim();
          data = data.filter(d => (d.no_lab||'').toLowerCase().includes(knl));
        }

        // 6. Filter Petugas
        if (state.optPetugas) {
          const op = state.optPetugas.toLowerCase().trim();
          data = data.filter(d => (d.nama_dokter||'').toLowerCase().includes(op) || (d.petugas_nama||'').toLowerCase().includes(op));
        }
        if (state.petugas) {
          const kp = state.petugas.toLowerCase().trim();
          data = data.filter(d => (d.nama_dokter||'').toLowerCase().includes(kp) || (d.petugas_nama||'').toLowerCase().includes(kp));
        }

        state.daftar = data;
        gambarDaftar(data);
        if (state.aktifId) {
          const masih = data.find(d => d.id === state.aktifId);
          if (masih) bukaDetail(masih.id);
          else if (data.length > 0) {
            state.aktifId = data[0].id;
            bukaDetail(data[0].id);
          } else {
            state.aktifId = null;
            el.querySelector('#dhKanan').innerHTML = `<div class="dh-empty">${UI.ikon('rekam', 44)}<span>Pilih pasien dari daftar</span></div>`;
          }
        } else if (data.length > 0) {
          state.aktifId = data[0].id;
          bukaDetail(data[0].id);
        } else {
          el.querySelector('#dhKanan').innerHTML = `<div class="dh-empty">${UI.ikon('rekam', 44)}<span>Pilih pasien dari daftar</span></div>`;
        }
      } catch (e) {
        daftar.innerHTML = `<div class="dh-empty" style="color:#c00">${UI.esc(e.message)}</div>`;
      }
    }

    function gambarDaftar(data) {
      const daftar = el.querySelector('#dhDaftar');
      if (!data.length) {
        daftar.innerHTML = '<div class="dh-empty">Tidak ada data</div>';
        return;
      }
      daftar.innerHTML = `
        <table>
          <thead><tr>
            <th style="width:30px">No</th>
            <th>No Lab</th>
            <th>Nama Pasien</th>
          </tr></thead>
          <tbody>
            ${data.map((d, i) => `
              <tr class="baris ${d.id === state.aktifId ? 'aktif' : ''}" data-id="${d.id}">
                <td style="text-align:center">${i + 1}</td>
                <td class="no-lab">${UI.esc(d.no_lab || '')}</td>
                <td>${UI.esc(d.nama_pasien || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      daftar.querySelectorAll('tr.baris').forEach(tr => {
        tr.onclick = () => {
          state.aktifId = tr.dataset.id;
          daftar.querySelectorAll('tr.baris').forEach(r => r.classList.toggle('aktif', r.dataset.id === state.aktifId));
          bukaDetail(state.aktifId);
        };
      });
    }

    /* ---- Detail kanan ---- */
    async function bukaDetail(id) {
      const kanan = el.querySelector('#dhKanan');
      kanan.innerHTML = '<div class="dh-empty">Memuat...</div>';
      try {
        const p = await DB.labPermintaan(id);
        if (!p) throw new Error('Data tidak ditemukan');

        const pasien   = p.pasien || {};
        const kunjungan = p.kunjungan || {};
        const umur     = pasien.tanggal_lahir
          ? Math.floor((Date.now() - new Date(pasien.tanggal_lahir)) / 3.15576e10) + ' th'
          : '-';
        const instansiVal = kunjungan.cara_bayar || 'Umum';
        const pengirim = p.peminta?.nama || '-';
        const noLab    = p.no_lab || '-';
        const noMR     = pasien.no_rm || '-';

        // Ambil tarif kasir & master tarif
        const kunjId = kunjungan.id || p.kunjungan_id;
        let kasirItems = [];
        let masterTarifLab = [];
        try {
          const promises = [ambilMasterTarifLab()];
          if (kunjId) {
            promises.push((async () => {
              let t = null;
              if (typeof DB.kasirTagihanKunjungan === 'function') {
                t = await DB.kasirTagihanKunjungan(kunjId);
              }
              if (!t && typeof DB.kasirSusunDariKunjungan === 'function') {
                try {
                  const tId = await DB.kasirSusunDariKunjungan(kunjId);
                  if (tId) t = { id: tId };
                } catch(errSusun) {}
              }
              if (t && t.id && typeof DB.kasirItem === 'function') {
                return await DB.kasirItem(t.id);
              }
              return [];
            })());
          }

          const [tarifList, items] = await Promise.all(promises);
          masterTarifLab = tarifList || [];
          kasirItems = items || [];

          // Fallback cari tagihan jika kasirItems belum terisi
          if (!kasirItems.length && pasien.id && typeof DB.kasirDaftarTagihan === 'function') {
            try {
              const listTagihan = await DB.kasirDaftarTagihan({ pasienId: pasien.id, batas: 10 });
              if (listTagihan && listTagihan.length) {
                const tCocok = listTagihan.find(t => (kunjId && t.kunjungan_id === kunjId)) || listTagihan[0];
                if (tCocok && typeof DB.kasirItem === 'function') {
                  kasirItems = (await DB.kasirItem(tCocok.id)) || [];
                }
              }
            } catch(eTagihan) {}
          }
        } catch(e) {
          console.warn('Gagal ambil data kasir / tarif:', e.message || e);
        }

        const hasil    = p.hasil || [];
        let totalBruto = 0, totalDisc = 0, totalNet = 0;

        kanan.innerHTML = `
          <!-- HEADER INFO PASIEN -->
          <div class="dh-header">
            <div class="hgrid">
              <div>
                <div class="hr"><span class="hl">Nama</span><span class="hv">${UI.esc(pasien.nama || '-')}</span></div>
                <div class="hr"><span class="hl">Alamat</span><span class="hv">${UI.esc(pasien.alamat || '-')}</span></div>
                <div class="hr"><span class="hl">NIK</span><span class="hv">${UI.esc(pasien.nik || '-')}</span></div>
                <div class="hr"><span class="hl">Offset</span><span><input type="number" id="dhOffset" value="0" style="width:60px;font-size:11px;padding:2px 4px;border:1px solid rgba(255,255,255,0.5);background:rgba(0,0,0,0.15);color:#fff;border-radius:2px;"></span></div>
              </div>
              <div>
                <div class="hr"><span class="hl">No Lab/No MR</span><span class="hv">${UI.esc(noLab)} / ${UI.esc(noMR)}</span></div>
                <div class="hr"><span class="hl">Pengirim</span><span class="hv">${UI.esc(pengirim)}</span></div>
                <div class="hr"><span class="hl">Instansi</span><span class="hv">${UI.esc(instansiVal)}</span></div>
                <div class="hr"><span class="hl">Encounter SS</span><span class="hv" id="dhEncId">-</span></div>
              </div>
            </div>
          </div>

          <!-- TOMBOL AKSI SS -->
          <div class="dh-actions">
            <button class="btn-barcode" id="btnBarcode">${UI.ikon('cetak', 13)} Print Barcode</button>
            <button class="btn-checknik" id="btnCheckNIK">CHECK NIK</button>
            <button class="btn-enc" id="btnEnc">1. Encounter SS</button>
            <button class="btn-srv" id="btnSrv">2. Service Req SS</button>
            <button class="btn-spec" id="btnSpec">3. Speciment SS</button>
          </div>

          <!-- TABEL RINCIAN PEMERIKSAAN -->
          <div class="dh-tbl-wrap">
            <table class="dh-tbl">
              <thead>
                <tr>
                  <th style="width:30px">#</th>
                  <th style="width:90px">Kode Px</th>
                  <th>Nama Px</th>
                  <th style="width:80px">Bruto</th>
                  <th style="width:60px">Disc</th>
                  <th style="width:80px">Net</th>
                  <th style="width:130px">Jam Sampel</th>
                  <th style="width:120px">ID SS Layanan</th>
                  <th style="width:120px">ID SS Spesimen</th>
                  <th style="width:90px">Kode LOINC</th>
                  <th style="width:120px">Kode SNOMED Spesimen</th>
                </tr>
              </thead>
              <tbody>
                ${hasil.length ? hasil.map((h, i) => {
                  const ref   = h.ref || {};
                  const kItem = kasirItems.find(x => {
                    if (ref.id && x.ref_id === ref.id) return true;
                    if (h.id && x.ref_id === h.id) return true;
                    if (h.lab_id && x.ref_id === h.lab_id) return true;
                    if (ref.kode && x.ref_kode && String(x.ref_kode).trim().toUpperCase() === String(ref.kode).trim().toUpperCase()) return true;
                    if (ref.nama && x.nama) {
                      const n1 = String(ref.nama).trim().toLowerCase();
                      const n2 = String(x.nama).replace(/^Lab:\s*/i, '').trim().toLowerCase();
                      if (n1 === n2 || n2.includes(n1) || n1.includes(n2)) return true;
                    }
                    return false;
                  });

                  // 1. Hitung Bruto
                  let bruto = 0;
                  if (kItem) {
                    const hargaSatuan = (kItem.harga_satuan != null && !isNaN(kItem.harga_satuan))
                      ? Number(kItem.harga_satuan)
                      : ((kItem.harga != null && !isNaN(kItem.harga)) ? Number(kItem.harga) : 0);
                    const qty = Number(kItem.qty) || 1;
                    bruto = hargaSatuan * qty;
                  }

                  // Fallback ke detail hasil lab atau lookup master tarif lab
                  if (!bruto) {
                    if (h.harga != null && !isNaN(h.harga) && Number(h.harga) > 0) {
                      bruto = Number(h.harga);
                    } else if (ref.harga != null && !isNaN(ref.harga) && Number(ref.harga) > 0) {
                      bruto = Number(ref.harga);
                    } else if (masterTarifLab.length) {
                      const t = masterTarifLab.find(m => {
                        if (ref.kode && m.kode && String(m.kode).trim().toUpperCase() === String(ref.kode).trim().toUpperCase()) return true;
                        if (ref.nama && m.nama && String(m.nama).trim().toLowerCase() === String(ref.nama).trim().toLowerCase()) return true;
                        if (ref.id && m.id === ref.id) return true;
                        return false;
                      });
                      if (t && t.tarif != null && !isNaN(t.tarif)) {
                        bruto = Number(t.tarif);
                      }
                    }
                  }

                  // 2. Hitung Disc
                  let disc = 0;
                  if (kItem) {
                    if (kItem.diskon_rp != null && !isNaN(kItem.diskon_rp) && Number(kItem.diskon_rp) > 0) {
                      disc = Number(kItem.diskon_rp);
                    } else if (kItem.diskon_pct != null && !isNaN(kItem.diskon_pct) && Number(kItem.diskon_pct) > 0) {
                      disc = Math.round((bruto * Number(kItem.diskon_pct)) / 100);
                    }
                  }
                  if (!disc) {
                    if (h.disc_rp != null && !isNaN(h.disc_rp) && Number(h.disc_rp) > 0) {
                      disc = Number(h.disc_rp);
                    } else if (h.disc_pct != null && !isNaN(h.disc_pct) && Number(h.disc_pct) > 0) {
                      disc = Math.round((bruto * Number(h.disc_pct)) / 100);
                    } else if (h.disc != null && !isNaN(h.disc) && Number(h.disc) > 0) {
                      disc = Math.round((bruto * Number(h.disc)) / 100);
                    } else if (ref.disc != null && !isNaN(ref.disc) && Number(ref.disc) > 0) {
                      disc = Math.round((bruto * Number(ref.disc)) / 100);
                    }
                  }

                  // 3. Hitung Net: Net = Bruto - Disc
                  const net = Math.max(0, bruto - disc);
                  
                  totalBruto += bruto;
                  totalDisc  += disc;
                  totalNet   += net;

                  const tgl    = h.dibuat_pada || p.diminta_pada || null;
                  return `<tr>
                    <td style="text-align:center">${i + 1}</td>
                    <td class="kd">${UI.esc(ref.kode || '')}</td>
                    <td>${UI.esc(ref.nama || '')}</td>
                    <td class="ang">${fmt(bruto)}</td>
                    <td class="ang">${fmt(disc)}</td>
                    <td class="ang">${fmt(net)}</td>
                    <td style="font-size:10px">${fmtTgl(tgl)}</td>
                    <td style="font-size:10px;color:#888">-</td>
                    <td style="font-size:10px;color:#888">-</td>
                    <td style="font-size:10px">${UI.esc(ref.kode_loinc || '')}</td>
                    <td style="font-size:10px">${UI.esc(ref.kode_specimen || '')}</td>
                  </tr>`;
                }).join('') : '<tr><td colspan="11" style="text-align:center;color:#aaa;padding:16px">Belum ada hasil pemeriksaan</td></tr>'}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align:right;font-weight:700">TOTAL</td>
                  <td class="ang">${fmt(totalBruto)}</td>
                  <td class="ang">${fmt(totalDisc)}</td>
                  <td class="ang">${fmt(totalNet)}</td>
                  <td colspan="5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;

        // Tombol Print Barcode — langsung cetak otomatis ke Blueprint ECO 80 tanpa pop-up dialog
        kanan.querySelector('#btnBarcode').onclick = (e) => {
          if (typeof BarcodePrinter !== 'undefined') {
            if (e && e.shiftKey) {
              BarcodePrinter.bukaModal(p);
            } else {
              BarcodePrinter.cetakOtomatis(p);
            }
          } else {
            modalCetakBarcodeTabung(p);
          }
        };

        // Tombol Check NIK — notifikasi (implementasi SatuSehat)
        kanan.querySelector('#btnCheckNIK').onclick = () => {
          if (!pasien.nik) { UI.toast('NIK pasien belum diisi', 'warn'); return; }
          UI.toast('Check NIK: ' + pasien.nik + ' (SatuSehat API belum dikonfigurasi)', 'info');
        };

        kanan.querySelector('#btnEnc').onclick = () => UI.toast('Encounter SS: belum terhubung ke SatuSehat', 'info');
        kanan.querySelector('#btnSrv').onclick = () => UI.toast('Service Req SS: belum terhubung ke SatuSehat', 'info');
        kanan.querySelector('#btnSpec').onclick = () => UI.toast('Speciment SS: belum terhubung ke SatuSehat', 'info');

      } catch (e) {
        kanan.innerHTML = `<div class="dh-empty" style="color:#c00">${UI.esc(e.message)}</div>`;
      }
    }
  }


  /* ================================================================== */
  /*  GENERATOR BARCODE CODE 128 & PENCETAKAN LABEL TABUNG SPESIMEN     */
  /*  Kompatibel 100% dengan Sysmex XP-100, Mindray BS-240, Arkray      */
  /* ================================================================== */

  const CODE128_PATTERNS = [
    '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
    '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
    '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
    '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
    '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
    '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
    '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
    '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
    '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
    '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
    '114131','311141','411131','211412','211214','211232','2331112'
  ];

  function buatBarcodeSVG(teks, tinggi = 36, modulWidth = 1.5) {
    if (!teks) teks = '00000000';
    let strTeks = String(teks).trim();
    let codes = [];
    const isNumeric = /^\d+$/.test(strTeks) && strTeks.length % 2 === 0;
    if (isNumeric) {
      codes.push(105); // Start C
      for (let i = 0; i < strTeks.length; i += 2) {
        codes.push(parseInt(strTeks.substr(i, 2), 10));
      }
    } else {
      codes.push(104); // Start B
      for (let i = 0; i < strTeks.length; i++) {
        codes.push(strTeks.charCodeAt(i) - 32);
      }
    }
    let check = codes[0];
    for (let i = 1; i < codes.length; i++) {
      check = (check + codes[i] * i) % 103;
    }
    codes.push(check);
    codes.push(106); // Stop

    let patternStr = '';
    for (const c of codes) {
      if (c >= 0 && c < CODE128_PATTERNS.length) {
        patternStr += CODE128_PATTERNS[c];
      }
    }

    let rects = [];
    let isBar = true;
    let x = 10; // Quiet zone 10 modul
    for (const ch of patternStr) {
      const w = parseInt(ch, 10);
      if (isBar) {
        rects.push(`<rect x="${(x * modulWidth).toFixed(1)}" y="0" width="${(w * modulWidth).toFixed(1)}" height="${tinggi}" fill="#000"/>`);
      }
      x += w;
      isBar = !isBar;
    }
    x += 10; // Quiet zone akhir
    const totalW = (x * modulWidth).toFixed(1);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${tinggi}" width="100%" height="100%" preserveAspectRatio="none" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  }

  function hitungUmurTahun(pasien, tglReferensi = null) {
    if (pasien?.umur !== undefined && pasien?.umur !== null && pasien?.umur !== '') {
      const u = parseInt(pasien.umur, 10);
      if (!isNaN(u)) return u;
    }
    if (pasien?.tanggal_lahir) {
      const ref = tglReferensi ? new Date(tglReferensi) : new Date();
      const birth = new Date(pasien.tanggal_lahir);
      let age = ref.getFullYear() - birth.getFullYear();
      const m = ref.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? age : 0;
    }
    return null;
  }

  function formatIdentitasPasien(pasien, tglReferensi = null) {
    let nama = (pasien?.nama || '').trim();
    const jk = (pasien?.jenis_kelamin || '').toUpperCase();
    const isL = jk.startsWith('L') || jk === 'PRIA' || jk === 'M';
    const isP = jk.startsWith('P') || jk === 'WANITA' || jk === 'F';
    const jkKode = isL ? 'L' : isP ? 'P' : '';

    const umurNum = hitungUmurTahun(pasien, tglReferensi);
    const umurStr = umurNum !== null ? `${umurNum} Th` : '';

    const hasTitle = /^(Tn\.|Ny\.|Nn\.|An\.|Sdr\.|Sdri\.|By\.|dr\.|drg\.)\s+/i.test(nama);
    if (!hasTitle) {
      const u = umurNum !== null ? umurNum : 30;
      let sapaan = 'Tn.';
      if (u < 12) sapaan = 'An.';
      else if (isP) sapaan = 'Ny.';
      else sapaan = 'Tn.';
      nama = `${sapaan} ${nama}`;
    }

    let infoBaris2 = '';
    if (jkKode && umurStr) {
      infoBaris2 = `(${jkKode}) / ${umurStr}`;
    } else if (jkKode) {
      infoBaris2 = `(${jkKode})`;
    } else if (umurStr) {
      infoBaris2 = `${umurStr}`;
    }

    const teksLengkap = infoBaris2 ? `${nama} ${infoBaris2}` : nama;

    return {
      namaHanya: nama,
      infoBaris2: infoBaris2,
      teksLengkap: teksLengkap
    };
  }

  function formatNamaLabel(pasien, tglReferensi = null) {
    return formatIdentitasPasien(pasien, tglReferensi).teksLengkap;
  }

  function formatNoLabStandar(rawNoLab, tglStr) {
    if (rawNoLab) {
      const str = String(rawNoLab).trim();
      if (/^\d{8}$/.test(str)) return str;
      const m = str.match(/LAB-(\d{2,4})-(\d+)/i);
      if (m) {
        const yy = m[1].slice(-2);
        const d = tglStr ? new Date(tglStr) : new Date();
        const mm = String(isNaN(d) ? new Date().getMonth() + 1 : d.getMonth() + 1).padStart(2, '0');
        const seq = m[2].padStart(4, '0');
        return `${yy}${mm}${seq}`;
      }
      return str;
    }
    return '00000000';
  }

  function deteksiTabungPasien(hasil) {
    const tabung = new Set();
    (hasil || []).forEach(h => {
      const ref = h.ref || {};
      const klp = (ref.kelompok || '').toUpperCase();
      const nm = (ref.nama || '').toUpperCase();
      const bc = (ref.barcode || '').toUpperCase();

      if (klp.includes('HEMATOLOGI') || nm.includes('DARAH LENGKAP') || nm.includes('HEMOGLOBIN') || nm.includes('LEUKOSIT') || nm.includes('TROMBOSIT') || bc === 'H') {
        tabung.add('HEMATOLOGI');
      }
      if (klp.includes('KIMIA') || nm.includes('GLUKOSA') || nm.includes('KOLESTEROL') || nm.includes('SGOT') || nm.includes('SGPT') || nm.includes('ASAM URAT') || nm.includes('UREUM') || nm.includes('KREATININ') || nm.includes('TRIGLISERIDA') || bc === 'K') {
        tabung.add('KIMIA');
      }
      if (nm.includes('HBA1C') || klp.includes('HBA1C')) {
        tabung.add('HBA1C');
      }
      if (klp.includes('URIN') || nm.includes('URIN') || bc === 'UL') {
        tabung.add('URIN');
      }
      if (klp.includes('IMUNO') || klp.includes('SEROLOGI') || bc === 'I' || bc === 'W') {
        tabung.add('SEROLOGI');
      }
    });
    if (tabung.size === 0) {
      tabung.add('KIMIA');
    }
    return Array.from(tabung);
  }

  function cetakLabelTabung(labels, ukuran = '80Label') {
    let iframe = document.getElementById('print-iframe-tube-barcode');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe-tube-barcode';
      iframe.setAttribute('aria-hidden', 'true');
      Object.assign(iframe.style, {
        position: 'fixed', right: '0', bottom: '0',
        width: '0', height: '0', border: '0', opacity: '0', pointerEvents: 'none', zIndex: '-1'
      });
      document.body.appendChild(iframe);
    }

    const pagesHtml = labels.map(lbl => {
      let nama = (lbl.namaPasien || '').trim();
      let infoBaris2 = (lbl.infoPasien || '').trim();

      if (!infoBaris2) {
        const m = nama.match(/^(.*?)\s*(\((?:L|P|M|F)[^)]*\)(?:\s*\/\s*\d+\s*Th)?|\((?:L|P|M|F)\/\d+\s*Th\))$/i);
        if (m) {
          nama = m[1].trim();
          infoBaris2 = m[2].trim();
        }
      }

      const svg = buatBarcodeSVG(lbl.idBarcode, 38, 1.5);

      return `
        <div class="label-tube">
          <div class="col-id">${UI.esc(lbl.idBarcode)}</div>
          <div class="col-center">
            <div class="barcode-wrap">${svg}</div>
            <div class="patient-name">${UI.esc(nama)}</div>
            ${infoBaris2 ? `<div class="patient-sub">${UI.esc(infoBaris2)}</div>` : ''}
          </div>
          <div class="col-dept">${UI.esc(lbl.dept || 'KIMIA')}</div>
        </div>
      `;
    }).join('');

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title></title>
        <style>
          @page {
            size: auto;
            margin: 0mm !important;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff;
            color: #000;
            font-family: 'JetBrains Mono', Consolas, Arial, sans-serif;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            @page {
              size: auto;
              margin: 0mm !important;
            }
            html, body {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          .label-tube {
            width: 100% !important;
            max-width: 72mm !important;
            height: 28mm !important;
            max-height: 28mm !important;
            margin: 0 auto !important;
            padding: 1mm 1.5mm !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .label-tube:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          .label-tube:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .col-id {
            width: 4.8mm;
            min-width: 4.8mm;
            height: 26mm;
            display: flex;
            align-items: center;
            justify-content: center;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-size: 7.5pt;
            font-weight: 700;
            line-height: 1;
            letter-spacing: 0.2px;
            white-space: nowrap;
            text-align: center;
            color: #000;
            flex-shrink: 0;
            margin: 0;
          }
          .col-center {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 0 1mm;
            overflow: hidden;
            width: 100%;
          }
          .barcode-wrap {
            width: 100%;
            max-width: 48mm;
            height: 13mm;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin: 0 auto;
          }
          .barcode-wrap svg {
            width: 100%;
            height: 100%;
            display: block;
            margin: 0 auto;
          }
          .patient-name {
            margin-top: 0.5mm;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.15;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            max-width: 100%;
            letter-spacing: -0.1px;
            color: #000;
          }
          .patient-sub {
            margin-top: 0.3mm;
            font-size: 9.5px;
            font-weight: 700;
            line-height: 1.1;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            max-width: 100%;
            letter-spacing: -0.1px;
            color: #000;
          }
          .col-dept {
            width: 5.5mm;
            min-width: 5.5mm;
            height: 26mm;
            display: flex;
            align-items: center;
            justify-content: center;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-size: 7.5pt;
            font-weight: 700;
            line-height: 1;
            letter-spacing: 0.2px;
            white-space: nowrap;
            text-align: center;
            color: #000;
            flex-shrink: 0;
            margin: 0;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Gagal mencetak label barcode:', e);
      }
    }, 250);
  }

  async function modalCetakBarcodeTabung(p) {
    if (typeof BarcodePrinter !== 'undefined' && BarcodePrinter.bukaModal) {
      return BarcodePrinter.bukaModal(p);
    }

    const pasien = p.pasien || {};
    const tgl = p.diminta_pada || null;
    const noLab = p.no_lab || '';
    const idStandar = formatNoLabStandar(noLab, tgl);
    const namaDefault = formatNamaLabel(pasien);
    const tabungList = deteksiTabungPasien(p.hasil);
    let deptTerpilih = tabungList[0] || 'KIMIA';
    let idBarcodeAktif = idStandar;
    let namaLabelAktif = namaDefault;
    let ukuranAktif = '50x20';
    let qtyAktif = 1;

    const modalHtml = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- PRATINJAU REALISTIS TABUNG SPESIMEN -->
        <div style="background:#0f172a; padding:16px; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:inset 0 2px 4px rgba(0,0,0,0.4);">
          <div style="color:#94a3b8; font-size:11px; margin-bottom:8px;">
            Pratinjau Label Tabung Spesimen (Skala Perbesar 2.5x)
          </div>
          
          <div id="lblPrevBox" style="width:250px; height:100px; background:#fff; border-radius:4px; box-shadow:0 8px 16px rgba(0,0,0,0.3); display:flex; flex-direction:row; align-items:center; justify-content:space-between; padding:6px 8px; box-sizing:border-box; color:#000; font-family:'JetBrains Mono', Consolas, Arial, sans-serif; user-select:none;">
            <div id="lblPrevId" style="width:24px; height:88px; display:flex; align-items:center; justify-content:center; writing-mode:vertical-rl; transform:rotate(180deg); font-size:11px; font-weight:700; letter-spacing:0.5px; white-space:nowrap; text-align:center;">
              ${UI.esc(idStandar)}
            </div>
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 6px; overflow:hidden;">
              <div id="lblPrevSvg" style="width:100%; height:55px; display:flex; align-items:center; justify-content:center;">
                ${buatBarcodeSVG(idStandar, 52, 2.0)}
              </div>
              <div id="lblPrevName" style="margin-top:4px; font-size:10.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; max-width:180px;">
                ${UI.esc(namaDefault)}
              </div>
            </div>
            <div id="lblPrevDept" style="width:24px; height:88px; display:flex; align-items:center; justify-content:center; writing-mode:vertical-rl; transform:rotate(180deg); font-size:11px; font-weight:800; letter-spacing:0.5px; white-space:nowrap; text-align:center;">
              ${UI.esc(deptTerpilih)}
            </div>
          </div>
          
          <div style="color:#64748b; font-size:10.5px; margin-top:8px; text-align:center;">
            Format 1D Code 128 terbaca otomatis oleh <b>Sysmex XP-100</b>, <b>Mindray BS-240</b>, &amp; <b>Arkray Adams HA-8380V</b>
          </div>
        </div>

        <!-- FORM PENGATURAN LABEL -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px;">
          <div>
            <label style="font-weight:600; display:block; margin-bottom:4px;">Jenis Tabung / Departemen</label>
            <div id="deptChips" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
              ${['KIMIA', 'HEMATOLOGI', 'HBA1C', 'URIN', 'SEROLOGI'].map(d => {
                const aktif = d === deptTerpilih;
                return `<button type="button" class="chip-dept" data-dept="${d}" style="font-size:11px; padding:3px 8px; border-radius:4px; border:1px solid ${aktif ? '#0f766e' : '#cbd5e1'}; background:${aktif ? '#0f766e' : '#f8fafc'}; color:${aktif ? '#fff' : '#334155'}; font-weight:600; cursor:pointer;">${d}</button>`;
              }).join('')}
            </div>
            <input type="text" id="inpDeptCustom" placeholder="Ketik jenis tabung lain..." value="${UI.esc(deptTerpilih)}" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px;">
          </div>

          <div>
            <label style="font-weight:600; display:block; margin-bottom:4px;">Format ID Barcode (Nomor Sampel)</label>
            <select id="selFormatId" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px; margin-bottom:6px;">
              <option value="standar" selected>Standar Alat Lab (${idStandar})</option>
              <option value="nolab">Nomor Lab Penuh (${UI.esc(noLab)})</option>
              <option value="custom">Ketik ID Manual...</option>
            </select>
            <input type="text" id="inpIdCustom" value="${UI.esc(idStandar)}" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px;">
          <div>
            <label style="font-weight:600; display:block; margin-bottom:4px;">Nama Pasien pada Label</label>
            <input type="text" id="inpNamaLabel" value="${UI.esc(namaDefault)}" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px;">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div>
              <label style="font-weight:600; display:block; margin-bottom:4px;">Ukuran Kertas Label</label>
              <select id="selUkuran" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px;">
                <option value="50x20" selected>50 x 20 mm (Tabung Standar)</option>
                <option value="50x25">50 x 25 mm</option>
                <option value="40x20">40 x 20 mm</option>
                <option value="40x30">40 x 30 mm</option>
              </select>
            </div>
            <div>
              <label style="font-weight:600; display:block; margin-bottom:4px;">Jumlah Salinan</label>
              <input type="number" id="inpQty" value="1" min="1" max="10" style="width:100%; padding:6px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px;">
            </div>
          </div>
        </div>

        ${tabungList.length > 1 ? `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px 12px; font-size:11.5px; color:#166534; display:flex; align-items:center; justify-content:space-between;">
            <div>
              <b>Pemeriksaan Pasien Mencakup:</b> ${tabungList.join(', ')}
            </div>
            <button type="button" id="btnCetakSemuaBatch" class="btn btn-sm" style="background:#16a34a; color:#fff; font-weight:700; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">
              Cetak Semua (${tabungList.length} Tabung Sekaligus)
            </button>
          </div>
        ` : ''}
      </div>
    `;

    await UI.modal({
      judul: 'Cetak Label Barcode Tabung Spesimen',
      lebar: false,
      isi: modalHtml,
      siap: (b, tutup) => {
        const lblId = b.querySelector('#lblPrevId');
        const lblSvg = b.querySelector('#lblPrevSvg');
        const lblName = b.querySelector('#lblPrevName');
        const lblDept = b.querySelector('#lblPrevDept');

        const updatePreview = () => {
          lblId.textContent = idBarcodeAktif;
          lblSvg.innerHTML = buatBarcodeSVG(idBarcodeAktif, 52, 2.0);
          lblName.textContent = namaLabelAktif;
          lblDept.textContent = deptTerpilih;
        };

        // Event listener Chips
        b.querySelectorAll('.chip-dept').forEach(btn => {
          btn.onclick = () => {
            b.querySelectorAll('.chip-dept').forEach(x => {
              x.style.border = '1px solid #cbd5e1';
              x.style.background = '#f8fafc';
              x.style.color = '#334155';
            });
            btn.style.border = '1px solid #0f766e';
            btn.style.background = '#0f766e';
            btn.style.color = '#fff';
            deptTerpilih = btn.dataset.dept;
            b.querySelector('#inpDeptCustom').value = deptTerpilih;
            updatePreview();
          };
        });

        b.querySelector('#inpDeptCustom').oninput = (e) => {
          deptTerpilih = e.target.value.trim().toUpperCase() || 'KIMIA';
          updatePreview();
        };

        b.querySelector('#selFormatId').onchange = (e) => {
          const val = e.target.value;
          if (val === 'standar') {
            idBarcodeAktif = idStandar;
            b.querySelector('#inpIdCustom').value = idStandar;
          } else if (val === 'nolab') {
            idBarcodeAktif = noLab;
            b.querySelector('#inpIdCustom').value = noLab;
          }
          updatePreview();
        };

        b.querySelector('#inpIdCustom').oninput = (e) => {
          idBarcodeAktif = e.target.value.trim() || idStandar;
          updatePreview();
        };

        b.querySelector('#inpNamaLabel').oninput = (e) => {
          namaLabelAktif = e.target.value.trim() || namaDefault;
          updatePreview();
        };

        b.querySelector('#selUkuran').onchange = (e) => {
          ukuranAktif = e.target.value;
        };

        b.querySelector('#inpQty').oninput = (e) => {
          qtyAktif = Math.max(1, parseInt(e.target.value, 10) || 1);
        };

        const btnBatch = b.querySelector('#btnCetakSemuaBatch');
        if (btnBatch) {
          btnBatch.onclick = () => {
            const allLabels = [];
            tabungList.forEach(tb => {
              for (let q = 0; q < qtyAktif; q++) {
                allLabels.push({
                  idBarcode: idBarcodeAktif,
                  namaPasien: namaLabelAktif,
                  dept: tb
                });
              }
            });
            cetakLabelTabung(allLabels, ukuranAktif);
            UI.toast(`Mencetak ${allLabels.length} label tabung...`, 'info');
            tutup(true);
          };
        }
      },
      tombol: [
        { teks: 'Batal', nilai: null },
        {
          teks: 'Cetak Label Ini',
          kelas: 'btn-primary',
          aksi: () => {
            const labels = [];
            for (let q = 0; q < qtyAktif; q++) {
              labels.push({
                idBarcode: idBarcodeAktif,
                namaPasien: namaLabelAktif,
                dept: deptTerpilih
              });
            }
            cetakLabelTabung(labels, ukuranAktif);
            UI.toast(`Mencetak ${labels.length} label tabung (${deptTerpilih})...`, 'info');
            return true;
          }
        }
      ]
    });
  }

  return { render };
})();
