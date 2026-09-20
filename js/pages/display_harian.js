/* ===================== DISPLAY HARIAN ============================
   Halaman pengelolaan data lab harian + integrasi SatuSehat (SS):
   - Pencarian pasien dengan berbagai filter (bulan, instansi, dll.)
   - Tampilan data per pasien: info pasien, rincian pemeriksaan & biaya
   - Tombol aksi SatuSehat: Print Barcode, Check NIK, Encounter SS,
     Service Req SS, Specimen SS
   =================================================================== */
const DisplayHarian = (() => {

  let state = {
    bulanTahun: '',
    instansi:   '',
    status:     '',
    cari:       '',
    daftar:     [],
    aktifId:    null
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

  function fmt(n) { return n != null ? Number(n).toLocaleString('id-ID') : ''; }
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
              <select id="dhInstansiOpt">
                <option value="">Semua Instansi</option>
                <option value="umum">Umum</option>
                <option value="bpjs">BPJS</option>
              </select>
              <input type="text" id="dhInstansi" placeholder="Ketik instansi..." value="${UI.esc(state.instansi||'')}">
            </div>
            <div class="fr">
              <select style="max-width:140px"><option>Semua Dokter/Pasien</option></select>
              <input type="text" id="dhCari" placeholder="Nama / No Lab..." value="${UI.esc(state.cari||'')}">
            </div>
            <div class="fr">
              <select style="max-width:140px"><option>Pembayaran(Semua)</option><option>Lunas</option><option>Belum Lunas</option></select>
              <input type="text" disabled style="background:#f5f5f5">
            </div>
            <div class="fr">
              <select style="max-width:140px"><option>Semua Px</option></select>
              <input type="text" disabled style="background:#f5f5f5">
            </div>
            <div class="fr">
              <select id="dhStatus" style="max-width:140px">
                <option value="">Semua No Lab</option>
                <option value="SELESAI">Selesai</option>
                <option value="AKTIF">Belum Selesai</option>
              </select>
              <input type="text" disabled style="background:#f5f5f5">
              <button id="dhRefresh" style="background:none;border:none;font-size:18px;cursor:pointer;padding:0 4px" title="Refresh">&#x21bb;</button>
            </div>
            <div class="fr">
              <select style="max-width:140px"><option>Semua Petugas</option></select>
              <input type="text" disabled style="background:#f5f5f5">
            </div>
          </div>
          <div class="dh-list" id="dhDaftar">
            <div class="dh-empty">Memuat...</div>
          </div>
        </div>

        <!-- KANAN -->
        <div class="dh-right" id="dhKanan">
          <div class="dh-empty">
            <span style="font-size:48px">&#128202;</span>
            <span>Pilih pasien dari daftar</span>
          </div>
        </div>
      </div>
    `;

    // Isi pilihan bulan (12 bulan ke belakang)
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
    optBulan.addEventListener('change', e => { state.bulanTahun = e.target.value || bulanIni(); el.querySelector('#dhBulan').value = state.bulanTahun; muat(); });

    const bind = (id, prop) => {
      const el2 = el.querySelector('#' + id);
      if (el2) el2.addEventListener('change', e => { state[prop] = e.target.value; muat(); });
    };
    bind('dhBulan',   'bulanTahun');
    bind('dhStatus',  'status');
    bind('dhInstansiOpt', 'instansi');

    const dbounce = (id, prop, ms = 400) => {
      const inp = el.querySelector('#' + id);
      if (!inp) return;
      let t;
      inp.addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { state[prop] = e.target.value; muat(); }, ms); });
    };
    dbounce('dhCari',    'cari');
    dbounce('dhInstansi', 'instansi');

    el.querySelector('#dhRefresh').onclick = () => muat();

    await muat();

    /* ---- Fungsi load daftar ---- */
    async function muat() {
      const daftar = el.querySelector('#dhDaftar');
      daftar.innerHTML = '<div class="dh-empty">Memuat...</div>';
      try {
        const { dari, sampai } = rentangBulan(state.bulanTahun);
        let data = await DB.labAntrean(dari, sampai, state.status || null);

        // Filter instansi
        const ins = (state.instansi || '').toLowerCase().trim();
        if (ins) data = data.filter(d => (d.cara_bayar||'').toLowerCase().includes(ins));

        // Filter cari
        const k = (state.cari || '').toLowerCase().trim();
        if (k) data = data.filter(d =>
          (d.nama_pasien||'').toLowerCase().includes(k) ||
          (d.no_lab||'').toLowerCase().includes(k) ||
          (d.nama_dokter||'').toLowerCase().includes(k)
        );

        state.daftar = data;
        gambarDaftar(data);
        if (state.aktifId) {
          const masih = data.find(d => d.id === state.aktifId);
          if (masih) bukaDetail(masih.id);
          else {
            state.aktifId = null;
            el.querySelector('#dhKanan').innerHTML = '<div class="dh-empty"><span style="font-size:48px">📊</span><span>Pilih pasien dari daftar</span></div>';
          }
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

        // Ambil tarif kasir (dari tagihan)
        let kasirItems = [];
        try {
           const tagihanId = await DB.kasirSusunDariKunjungan(kunjungan.id);
           const { item } = await DB.kasirLengkap(tagihanId);
           kasirItems = item || [];
        } catch(e) { console.warn('Gagal ambil data kasir:', e.message); }

        const hasil    = p.hasil || [];
        let totalBruto = 0, totalDisc = 0;

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
            <button class="btn-barcode" id="btnBarcode">&#x1F4C4; Print Barcode</button>
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
                  const ref    = h.ref || {};
                  const kItem  = kasirItems.find(x => x.sumber === 'LAB' && x.ref_id === ref.id);
                  const bruto  = kItem ? (kItem.harga * kItem.qty) : 0;
                  const disc   = kItem ? (bruto * (kItem.diskon_pct||0) / 100) : 0;
                  const net    = bruto - disc;
                  
                  totalBruto += bruto;
                  totalDisc += disc;
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
                  <td class="ang">${fmt(totalBruto - totalDisc)}</td>
                  <td colspan="5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;

        // Tombol Print Barcode
        kanan.querySelector('#btnBarcode').onclick = () => {
          const w = window.open('', '_blank', 'width=400,height=200');
          w.document.write(`<html><body style="margin:0;padding:10px;font-family:monospace">
            <div style="font-size:14px;font-weight:bold">${noLab}</div>
            <div style="font-size:11px">${pasien.nama || ''} &mdash; ${umur}</div>
            <div style="font-size:10px">${instansiVal} | ${pengirim}</div>
            <script>window.print();window.close();<\/script>
          </body></html>`);
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

  return { render };
})();
