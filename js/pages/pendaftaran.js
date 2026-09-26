/* ===================== PENDAFTARAN LAB MEDIS UTAMA ===================== */
const Pendaftaran = (() => {

  /* ---- Data Master (dimuat sekali) ---- */
  let masterLab   = [];   // daftar ref_lab
  let masterPaket = [];   // daftar ref_lab_paket
  let masterDokter= [];   // daftar dokter
  let masterPoli  = [];   // daftar poli
  let masterRekanan = []; // daftar ref_rekanan
  let tarifMap    = {};   // kode → harga dari kasir_tarif

  /* ---- State form kanan ---- */
  let pasienTerpilih = null;
  let rekananTerpilih = null;
  let terakhirTerdaftar = null;

  /* ---- Baris tabel pemeriksaan (50 baris) ---- */
  const JUMLAH_BARIS = 50;
  let barisPemeriksaan = []; // array of { labId, kode, nama, harga, disc, net, ket }

  /* ---- Scanner Barcode Global (Blueprint BP-LITE W2D) ---- */
  let handlerScanGlobal = null;

  /* ================================================================
     RENDER UTAMA
  ================================================================ */
  async function render(el, param) {
    // Bersihkan listener scanner lama saat render ulang
    if (handlerScanGlobal) {
      document.removeEventListener('keydown', handlerScanGlobal, true);
      handlerScanGlobal = null;
    }

    el.innerHTML = `<div class="p-16">${UI.memuat(3)}</div>`;

    try {
      [masterLab, masterPaket, masterDokter, masterPoli, masterRekanan] = await Promise.all([
        DB.refLab(true),
        DB.refLabPaket(),
        DB.daftarDokter(),
        DB.daftarPoli(),
        DB.daftarRekanan()
      ]);

      // Muat tarif
      try {
        const tarifList = await DB.daftarTarif({ jenis: 'LAB' });
        tarifMap = {};
        tarifList.forEach(t => { tarifMap[t.kode] = t.tarif || 0; });
      } catch(e) { tarifMap = {}; }

      // Inisialisasi baris kosong atau muat draft
      let draft;
      try { draft = JSON.parse(localStorage.getItem('draft_pendaftaran')); } catch(e) {}
      
      if (draft && draft.barisPemeriksaan && draft.barisPemeriksaan.length) {
         barisPemeriksaan = draft.barisPemeriksaan;
         pasienTerpilih = draft.pasienTerpilih;
         rekananTerpilih = draft.rekananTerpilih || masterRekanan.find(r => r.id === '151203133') || masterRekanan[0];
      } else {
         barisPemeriksaan = Array.from({ length: JUMLAH_BARIS }, () => ({
           labId: null, kode: '', nama: '', harga: 0, disc: 0, net: 0, ket: ''
         }));
         pasienTerpilih  = null;
         rekananTerpilih = masterRekanan.find(r => r.id === '151203133') || masterRekanan[0];
      }

      gambarHalaman(el);
      
      if (draft && draft.form) {
         const f = draft.form;
         el.querySelector('#fRm').value = f.rm || '(Otomatis)';
         if (el.querySelector('#fNik')) el.querySelector('#fNik').value = f.nik || '';
         el.querySelector('#fNrp').value = f.nrp || '';
         el.querySelector('#fNama').value = f.nama || '';
         el.querySelector('#fTitle').value = f.title || '';
         el.querySelector('#fBagian').value = f.bagian || '';
         el.querySelector('#fPlant').value = f.plant || '';
         el.querySelector('#fTglLahir').value = f.tglLahir || '';
         el.querySelector('#fJk').value = f.jk || 'L';
         el.querySelector('#fAlamat').value = f.alamat || '';
         el.querySelector('#fTelp').value = f.telp || '';
         if (f.dokter) el.querySelector('#fDokterNama').value = f.dokter;
         el.querySelector('#bJenisBayar').value = f.jenisBayar || 'UMUM';
         el.querySelector('#bUangPasien').value = f.uangPasien || '';
         el.querySelector('#bDiscPct').value = f.discPct || '';
         const cb = el.querySelector('#filterBpjs');
         if (cb) { cb.checked = !!f.filterBpjs; }
      }
      if (!el.querySelector('#fJanjiTgl').value) el.querySelector('#fJanjiTgl').value = UI.hariIni();
      if (!el.querySelector('#fJanjiJam').value) {
        const dj = new Date(Date.now() + 2 * 3600 * 1000);
        el.querySelector('#fJanjiJam').value = ('0' + dj.getHours()).slice(-2) + ':' + ('0' + dj.getMinutes()).slice(-2);
      }
      hitungUlang(el);
    } catch(e) {
      el.innerHTML = `<div class="banner err">${UI.esc(e.message)}</div>`;
    }
  }

  /* ================================================================
     LAYOUT HALAMAN
  ================================================================ */
  function gambarHalaman(el) {
    el.innerHTML = `
      <style>
        /* ---- Layout utama ---- */
        .pdft-wrap { display: grid; grid-template-columns: 1fr 380px; gap: 0; height: calc(100vh - 72px); overflow: hidden; }
        .pdft-left  { display: flex; flex-direction: column; border-right: 2px solid #ddd; overflow: hidden; }
        .pdft-right { display: flex; flex-direction: column; overflow-y: auto; background: #f5f7fa; }

        /* ---- Header kiri ---- */
        .pdft-lhead { background: #fff; border-bottom: 2px solid #ddd; padding: 8px 12px; display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
        .pdft-lhead h2 { font-size: 15px; font-weight: 700; margin: 0; flex: 1; color: #1a237e; }
        .pdft-lhead .btn-rekanan { background: #1976D2; color: #fff; border: none; padding: 5px 14px; border-radius: 4px; font-size: 13px; cursor: pointer; }
        .pdft-search { padding: 6px 12px; background: #f5f7fa; border-bottom: 1px solid #ddd; display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
        .pdft-search input { flex: 1; padding: 5px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }
        .pdft-search label { font-size: 12px; display: flex; gap: 4px; align-items: center; white-space: nowrap; cursor: pointer; }

        /* ---- Toolbar paket ---- */
        .pdft-paket { padding: 6px 12px; background: #fff; border-bottom: 1px solid #eee; display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
        .pdft-paket select { flex: 1; padding: 5px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }
        .pdft-paket .btn-tambah { background: #388E3C; color: #fff; border: none; padding: 5px 16px; border-radius: 4px; font-size: 13px; cursor: pointer; }

        /* ---- Tabel pemeriksaan ---- */
        .pdft-tbl-wrap { flex: 1; overflow-y: auto; }
        .pdft-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
        .pdft-tbl thead tr { background: #1565C0; color: #fff; position: sticky; top: 0; z-index: 5; }
        .pdft-tbl thead th { padding: 7px 6px; text-align: left; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2); white-space: nowrap; }
        .pdft-tbl tbody tr:nth-child(even) { background: #f0f4ff; }
        .pdft-tbl tbody tr:hover { background: #e3eafd; }
        .pdft-tbl td { border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; padding: 3px 4px; vertical-align: middle; }
        .pdft-tbl td:first-child { text-align: center; color: #999; width: 28px; font-size: 11px; }
        .pdft-tbl .td-px { width: 60px; }
        .pdft-tbl .td-nama input { width: 100%; min-width: 150px; }
        .pdft-tbl .td-harga { width: 80px; text-align: right; }
        .pdft-tbl .td-disc  { width: 55px; text-align: right; }
        .pdft-tbl .td-net   { width: 80px; text-align: right; color: #1a237e; font-weight: 600; }
        .pdft-tbl .td-ket input { width: 100%; min-width: 100px; }
        .pdft-inp { border: none; background: transparent; font-size: 13px; padding: 2px 4px; width: 100%; outline: none; font-family: inherit; }
        .pdft-inp:focus { background: #fff3e0; border-radius: 2px; }
        .pdft-inp.ang { text-align: right; }

        /* ---- Autocomplete dropdown ---- */
        .pdft-ac { position: relative; }
        .pdft-ac-list { position: absolute; top: 100%; left: 0; min-width: 300px; max-height: 200px; overflow-y: auto;
          background: #fff; border: 1px solid #1565C0; border-radius: 4px; z-index: 999; box-shadow: 0 4px 12px rgba(0,0,0,.15); }
        .pdft-ac-item { padding: 7px 12px; cursor: pointer; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
        .pdft-ac-item:hover { background: #e3f2fd; }
        .pdft-ac-item b { color: #1565C0; }
        .pdft-ac-item .harga-hint { color: #888; font-size: 11px; }

        /* ---- Header kanan ---- */
        .pdft-rhead { background: #c62828; color: #fff; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
        .pdft-rhead .bruto-netto { font-size: 14px; font-weight: 700; }

        /* ---- Form pasien (kanan) ---- */
        .pdft-form { padding: 10px 14px; }
        .pdft-search-pasien { background: #e8eaf6; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; }
        .pdft-search-pasien label { font-size: 11px; font-weight: 700; color: #3949ab; letter-spacing: .05em; display: block; margin-bottom: 4px; }
        .pdft-search-pasien input { width: 100%; padding: 5px 8px; border: 1px solid #9fa8da; border-radius: 4px; font-size: 13px; }

        .frow { display: grid; gap: 6px; margin-bottom: 6px; }
        .frow-2 { grid-template-columns: 1fr 1fr; }
        .frow-3 { grid-template-columns: 1fr 1fr 1fr; }
        .frow-13 { grid-template-columns: 1fr 3fr; }
        .frow-21 { grid-template-columns: 2fr 1fr; }
        .frow-31 { grid-template-columns: 3fr 1fr; }
        .pdft-field label { font-size: 11px; color: #555; font-weight: 600; display: block; margin-bottom: 2px; }
        .pdft-field input, .pdft-field select { width: 100%; padding: 5px 7px; border: 1px solid #bdbdbd; border-radius: 4px; font-size: 13px; font-family: inherit; box-sizing: border-box; }
        .pdft-field input:focus, .pdft-field select:focus { border-color: #1565C0; outline: none; }
        .pdft-field input[readonly] { background: #f5f5f5; color: #888; }

        /* ---- Bagian pembayaran ---- */
        .pdft-bayar { background: #fff; border-top: 2px solid #ddd; padding: 10px 14px; }
        .pdft-bayar-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 4px; }
        .pdft-bayar-field label { font-size: 11px; color: #555; font-weight: 600; display: block; margin-bottom: 2px; }
        .pdft-bayar-field input, .pdft-bayar-field select { width: 100%; padding: 5px 7px; border: 1px solid #bdbdbd; border-radius: 4px; font-size: 13px; font-family: inherit; box-sizing: border-box; }
        .pdft-bayar-field input.readonly-val { background: #e8f5e9; color: #2e7d32; font-weight: 700; }
        .pdft-bayar-field input.kembalian { background: #e3f2fd; color: #0d47a1; font-weight: 700; }
        .pdft-bayar-field input#bNetti { background: #ffffff; color: #0f172a; font-weight: 700; border: 1.5px solid #0f766e; }
        .pdft-bayar-field input#bNetti:focus { border-color: #0d9488; box-shadow: 0 0 0 2px rgba(15,118,110,0.18); outline: none; }

        /* ---- Tombol reset baris ---- */
        .btn-clr { background: none; border: none; color: #ccc; cursor: pointer; padding: 0 4px; font-size: 14px; }
        .btn-clr:hover { color: #f44336; }

        /* ---- Info rekanan aktif ---- */
        .rekanan-bar { background: #e8f5e9; border-bottom: 1px solid #c8e6c9; padding: 4px 12px; font-size: 12px; color: #2e7d32; font-weight: 600; flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
        /* ---- Tombol Aksi ---- */
        .pdft-tombol-aksi { padding: 10px 14px 14px; display: flex; flex-wrap: wrap; gap: 8px; border-top: 2px solid #ddd; background: #f9f9f9; }
        .btn-aksi { padding: 7px 14px; border: none; border-radius: 4px; font-size: 13px; font-weight: 700; cursor: pointer; color: #fff; transition: opacity .15s; }
        .btn-aksi:hover { opacity: .85; }
        .btn-save   { background: #388E3C; }
        .btn-nolab  { background: #E65100; }
        .btn-nota   { background: #E65100; }
        .btn-ic     { background: #E65100; }
        .btn-ic2    { background: #1565C0; }
        .btn-aksi:disabled { opacity: .5; cursor: not-allowed; }
      </style>

      <div class="pdft-wrap">

        <!-- ======================== PANEL KIRI ======================== -->
        <div class="pdft-left">
          <div class="pdft-lhead">
            <h2>Daftar Pemeriksaan</h2>
            <button class="btn-rekanan" id="btnRekanan">Rekanan</button>
          </div>
          <div class="rekanan-bar" id="rekananBar">
            ◆ Rekanan: <span id="namaRekanan">Umum / Pasien Mandiri</span>
          </div>
          <div class="pdft-search">
            <input type="search" id="cariLab" placeholder="Cari pemeriksaan (nama/kode)…">
            <label><input type="checkbox" id="filterBpjs"> Hanya BPJS</label>
          </div>
          <div class="pdft-paket">
            <select id="pilihPaket">
              <option value="">— Pilih Paket Pemeriksaan —</option>
              ${masterPaket.map(pk => `<option value="${pk.id}">${UI.esc(pk.nama)}</option>`).join('')}
            </select>
            <button class="btn-tambah" id="btnTambahPaket">Tambah</button>
          </div>
          <div class="pdft-tbl-wrap">
            <table class="pdft-tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th class="td-px">PX</th>
                  <th>NAMA PX</th>
                  <th class="td-harga">HARGA</th>
                  <th class="td-disc">DISC</th>
                  <th class="td-net">NET</th>
                  <th>KETERANGAN</th>
                  <th style="width:24px"></th>
                </tr>
              </thead>
              <tbody id="tbodyPemeriksaan"></tbody>
            </table>
          </div>
        </div>

        <!-- ======================== PANEL KANAN ======================== -->
        <div class="pdft-right">
          <div class="pdft-rhead">
            <div class="bruto-netto">Bruto : <span id="lblBruto">0</span> &nbsp;|&nbsp; Netto : <span id="lblNetto">0</span></div>
            <div style="font-size:12px;opacity:.95;font-weight:700;letter-spacing:.04em;display:flex;align-items:center">
              PEMERIKSAAN LAB
              <span id="lblNoLab" style="display:none;background:#2e7d32;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;margin-left:8px"></span>
            </div>
          </div>

          <div class="pdft-form">
            <!-- Pencarian pasien lama -->
            <div class="pdft-search-pasien">
              <label>PENCARIAN PASIEN LAMA</label>
              <div style="position:relative">
                <input type="search" id="cariPasien" placeholder="Ketik No RM, NIK, atau Nama untuk memuat pasien lama…">
                <div id="hasilCariPasien" style="position:absolute;top:100%;left:0;right:0;z-index:100"></div>
              </div>
            </div>

            <!-- No RM & NIK -->
            <div class="frow frow-13">
              <div class="pdft-field">
                <label>No. RM</label>
                <input type="text" id="fRm" value="(Otomatis)" readonly placeholder="(Otomatis)">
              </div>
              <div class="pdft-field" style="display:flex;gap:4px;align-items:flex-end">
                <div style="flex:1">
                  <label>NIK (16 Digit)</label>
                  <input type="text" id="fNik" maxlength="16" inputmode="numeric" placeholder="16 digit KTP/KK (bila ada)">
                </div>
                <button id="btnCekNrp" title="Cek Pasien Berdasarkan NIK" style="background:#388E3C;color:#fff;border:none;border-radius:4px;padding:5px 9px;cursor:pointer;height:32px;font-weight:700">Cek</button>
                <button id="btnReset" title="Reset / Pasien Baru" style="background:#1565C0;color:#fff;border:none;border-radius:4px;padding:5px 9px;cursor:pointer;height:32px;font-weight:700">Baru</button>
              </div>
            </div>

            <!-- Nama & Title -->
            <div class="frow frow-13">
              <div class="pdft-field">
                <label>Title</label>
                <select id="fTitle">
                  <option value="Tn.">Tn.</option>
                  <option value="Ny.">Ny.</option>
                  <option value="Sdra.">Sdra.</option>
                  <option value="Sdri.">Sdri.</option>
                  <option value="An.">An.</option>
                  <option value="By.">By.</option>
                  <option value="dr.">dr.</option>
                </select>
              </div>
              <div class="pdft-field">
                <label>Nama Px *</label>
                <input type="text" id="fNama" placeholder="Sesuai KTP / Identitas">
              </div>
            </div>

            <!-- NRP, Bagian & Plant -->
            <div class="frow frow-3">
              <div class="pdft-field">
                <label>NRP / No. BPJS</label>
                <input type="text" id="fNrp" placeholder="Scan kartu / 13 digit BPJS">
              </div>
              <div class="pdft-field">
                <label>Bagian</label>
                <input type="text" id="fBagian" placeholder="">
              </div>
              <div class="pdft-field">
                <label>Plant</label>
                <input type="text" id="fPlant" placeholder="">
              </div>
            </div>

            <!-- Tgl Lahir & JK -->
            <div class="frow frow-2">
              <div class="pdft-field">
                <label>Tgl Lahir *</label>
                <input type="date" id="fTglLahir">
              </div>
              <div class="pdft-field">
                <label>J/K *</label>
                <select id="fJk">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <!-- Alamat -->
            <div class="pdft-field" style="margin-bottom:6px">
              <label>Alamat</label>
              <input type="text" id="fAlamat" placeholder="">
            </div>

            <!-- Telp -->
            <div class="pdft-field" style="margin-bottom:6px">
              <label>Telp / HP</label>
              <input type="tel" id="fTelp" placeholder="">
            </div>

            <!-- Dokter -->
            <div class="pdft-field" style="margin-bottom:6px">
              <label>Dokter *</label>
              <input list="listDokter" id="fDokterNama" placeholder="— Pilih nama dokter —" autocomplete="off" required>
              <datalist id="listDokter">
                ${masterDokter.map(d => `<option value="${UI.esc(d.nama)}"></option>`).join('')}
              </datalist>
            </div>

            <!-- Janji Hsl -->
            <div class="frow frow-2" style="margin-bottom:6px">
              <div class="pdft-field">
                <label>Janji Hsl</label>
                <input type="date" id="fJanjiTgl">
              </div>
              <div class="pdft-field">
                <label>Jam</label>
                <input type="time" id="fJanjiJam">
              </div>
            </div>
          </div>

          <!-- ---- BAGIAN PEMBAYARAN ---- -->
          <div class="pdft-bayar">
            <div class="pdft-bayar-row">
              <div class="pdft-bayar-field">
                <label>Bruto</label>
                <input type="number" id="bBruto" class="readonly-val" readonly value="0">
              </div>
              <div class="pdft-bayar-field">
                <label>Jenis Bayar</label>
                <select id="bJenisBayar">
                  <option value="UMUM">Tunai</option>
                  <option value="BPJS">BPJS</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="ASURANSI_LAIN">Asuransi Lain</option>
                  <option value="GRATIS">Gratis</option>
                </select>
              </div>
            </div>
            <div class="pdft-bayar-row">
              <div class="pdft-bayar-field">
                <label>Disc All (%)</label>
                <input type="number" id="bDiscPct" value="0" min="0" max="100" step="any">
              </div>
              <div class="pdft-bayar-field">
                <label>Bayar Skrg</label>
                <input type="number" id="bBayarSkrg" class="readonly-val" readonly value="0">
              </div>
            </div>
            <div class="pdft-bayar-row">
              <div class="pdft-bayar-field">
                <label>Netti</label>
                <input type="number" id="bNetti" value="0" min="0" step="any" placeholder="0">
              </div>
              <div class="pdft-bayar-field">
                <label>Kurang Bayar</label>
                <input type="number" id="bKurang" class="readonly-val" readonly value="0">
              </div>
            </div>
            <div class="pdft-bayar-row">
              <div class="pdft-bayar-field">
                <label>Uang Pasien</label>
                <input type="number" id="bUangPasien" value="0" placeholder="0">
              </div>
              <div class="pdft-bayar-field"></div>
            </div>
            <div class="pdft-bayar-row">
              <div class="pdft-bayar-field">
                <label>Kembalian</label>
                <input type="number" id="bKembalian" class="kembalian" readonly value="0">
              </div>
              <div class="pdft-bayar-field"></div>
            </div>

            <!-- Tombol Aksi -->
            <div class="pdft-tombol-aksi">
              <button class="btn-aksi btn-save" id="btnSave">Save</button>
              <button class="btn-aksi btn-nolab" id="btnNoLab">No Lab</button>
              <button class="btn-aksi btn-nota" id="btnNotaM1">Nota M.1</button>
              <button class="btn-aksi btn-nota" id="btnNota2">Nota 2</button>
              <button class="btn-aksi btn-ic" id="btnIcAntigen">IC Antigen</button>
              <button class="btn-aksi btn-ic" id="btnIcPcr">IC PCR</button>
              <button class="btn-aksi btn-ic2" id="btnIc1">IC.1</button>
              <button class="btn-aksi btn-ic2" id="btnIc2">IC.2</button>
              <button class="btn-aksi" id="btnSelesaiBaru" style="background:#0284c7; margin-left:auto;" title="Selesai dan bersihkan form untuk pasien berikutnya">+ Pasien Baru</button>
            </div>
          </div>
        </div>

      </div>`;

    gambarBarisPemeriksaan(el);
    pasangEventListener(el);
  }

  /* ================================================================
     RENDER BARIS TABEL PEMERIKSAAN
  ================================================================ */
  function gambarBarisPemeriksaan(el) {
    const tbody = el.querySelector('#tbodyPemeriksaan');
    if (!tbody) return;

    tbody.innerHTML = barisPemeriksaan.map((b, i) => `
      <tr data-baris="${i}">
        <td>${i + 1}</td>
        <td class="td-px" style="position:relative">
          <input class="pdft-inp inp-px" type="text" data-idx="${i}"
            value="${UI.esc(b.kode || '')}" placeholder=""
            autocomplete="off" style="font-weight:600; font-size:12px;">
        </td>
        <td class="td-nama" style="position:relative">
          <div class="pdft-ac" style="position:relative">
            <input class="pdft-inp inp-nama" type="text" data-idx="${i}"
              value="${UI.esc(b.nama || '')}" placeholder="Ketik nama pemeriksaan…"
              autocomplete="off">
          </div>
        </td>
        <td class="td-harga">${b.harga ? b.harga.toLocaleString('id-ID') : ''}</td>
        <td class="td-disc">
          <input class="pdft-inp ang inp-disc" type="number" data-idx="${i}"
            value="${b.disc || ''}" placeholder="0" min="0" max="100">
        </td>
        <td class="td-net">${b.net ? b.net.toLocaleString('id-ID') : ''}</td>
        <td class="td-ket">
          <input class="pdft-inp inp-ket" type="text" data-idx="${i}"
            value="${UI.esc(b.ket || '')}" placeholder="">
        </td>
        <td style="text-align:center">
          <button class="btn-clr btn-hapus-baris" data-idx="${i}" title="Hapus baris">×</button>
        </td>
      </tr>
    `).join('');

    pasangEventBarisLab(el);
  }

  /* ================================================================
     EVENT LISTENER BARIS LAB (autocomplete PX & nama, disc, ket)
  ================================================================ */
  function pasangEventBarisLab(el) {
    const tbody = el.querySelector('#tbodyPemeriksaan');
    if (!tbody) return;

    let activeAcDropdown = null;
    let selectedAcIdx = -1;

    function tutupAcGlobal() {
      if (activeAcDropdown) {
        activeAcDropdown.remove();
        activeAcDropdown = null;
        selectedAcIdx = -1;
      }
    }

    function bukaAutocomplete(inp, idx, kata) {
      tutupAcGlobal();
      if (!kata) {
        barisPemeriksaan[idx] = { labId: null, kode: '', nama: '', harga: 0, disc: 0, net: 0, ket: '' };
        hitungUlang(el);
        gambarBarisPemeriksaan(el);
        return;
      }

      const cocok = masterLab.filter(m => {
        const k = (m.kode || '').toLowerCase();
        const n = (m.nama || '').toLowerCase();
        return k.includes(kata) || n.includes(kata);
      }).slice(0, 15);

      if (!cocok.length) return;

      const acWrap = document.createElement('div');
      acWrap.className = 'pdft-ac-list';
      acWrap.style.cssText = 'position:absolute; top:100%; left:0; min-width:520px; max-height:240px; overflow-y:auto; background:#fff; border:1px solid #1565c0; border-radius:4px; z-index:9999; box-shadow:0 6px 18px rgba(0,0,0,.2); font-family:Arial,sans-serif;';

      const discBaris = rekananTerpilih?.disc || 0;

      acWrap.innerHTML = `
        <table class="pdft-ac-table" style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#f1f5f9; color:#334155; position:sticky; top:0; z-index:2; border-bottom:1px solid #cbd5e1;">
              <th style="padding:6px 10px; text-align:left; width:90px;">Kode Px</th>
              <th style="padding:6px 10px; text-align:left;">Nama Px</th>
              <th style="padding:6px 10px; text-align:right; width:90px;">Harga</th>
              <th style="padding:6px 10px; text-align:center; width:50px;">Disc</th>
              <th style="padding:6px 10px; text-align:right; width:90px;">Nett</th>
              <th style="padding:6px 10px; text-align:left; width:80px;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${cocok.map((m, mIdx) => {
              const hrg = tarifMap[m.kode] || m.harga || 0;
              const nett = Math.round(hrg * (1 - discBaris / 100));
              return `
                <tr class="pdft-ac-item clickable-ac-row" data-id="${m.id}" data-kode="${UI.esc(m.kode)}"
                    data-nama="${UI.esc(m.nama)}" data-harga="${hrg}" data-midx="${mIdx}"
                    style="cursor:pointer; border-bottom:1px solid #f0f0f0;">
                  <td style="padding:6px 10px; font-weight:700; color:#1565C0;">${UI.esc(m.kode)}</td>
                  <td style="padding:6px 10px; color:#111;">${UI.esc(m.nama)}</td>
                  <td style="padding:6px 10px; text-align:right; color:#444;">${hrg ? hrg.toLocaleString('id-ID') : '0'}</td>
                  <td style="padding:6px 10px; text-align:center; color:#666;">${discBaris}</td>
                  <td style="padding:6px 10px; text-align:right; font-weight:600; color:#1b5e20;">${nett ? nett.toLocaleString('id-ID') : '0'}</td>
                  <td style="padding:6px 10px; color:#888; font-size:11px;">${m.kelompok || 'null'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      inp.parentElement.appendChild(acWrap);
      activeAcDropdown = acWrap;
      selectedAcIdx = -1;

      const items = acWrap.querySelectorAll('.clickable-ac-row');

      function pilihItem(item) {
        const hrg = +item.dataset.harga || 0;
        const nett = Math.round(hrg * (1 - discBaris / 100));
        barisPemeriksaan[idx] = {
          labId: item.dataset.id,
          kode:  item.dataset.kode,
          nama:  item.dataset.nama,
          harga: hrg,
          disc:  discBaris,
          net:   nett,
          ket:   ''
        };
        tutupAcGlobal();
        hitungUlang(el);
        gambarBarisPemeriksaan(el);

        // Pindah fokus ke input baris berikutnya
        setTimeout(() => {
          const barisLanjut = tbody.querySelectorAll('.inp-px');
          if (barisLanjut[idx + 1]) {
            barisLanjut[idx + 1].focus();
          } else {
            const namaLanjut = tbody.querySelectorAll('.inp-nama');
            if (namaLanjut[idx + 1]) namaLanjut[idx + 1].focus();
          }
        }, 50);
      }

      items.forEach(item => {
        item.addEventListener('mouseenter', () => {
          items.forEach(i => i.style.background = '');
          item.style.background = '#e3f2fd';
        });
        item.addEventListener('mouseleave', () => {
          item.style.background = '';
        });
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          pilihItem(item);
        });
      });

      inp.onkeydown = (e) => {
        if (!activeAcDropdown) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedAcIdx = Math.min(selectedAcIdx + 1, items.length - 1);
          items.forEach((it, i) => it.style.background = (i === selectedAcIdx ? '#e3f2fd' : ''));
          if (items[selectedAcIdx]) items[selectedAcIdx].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedAcIdx = Math.max(selectedAcIdx - 1, 0);
          items.forEach((it, i) => it.style.background = (i === selectedAcIdx ? '#e3f2fd' : ''));
          if (items[selectedAcIdx]) items[selectedAcIdx].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedAcIdx >= 0 && items[selectedAcIdx]) {
            pilihItem(items[selectedAcIdx]);
          } else if (items.length > 0) {
            pilihItem(items[0]);
          }
        } else if (e.key === 'Escape') {
          tutupAcGlobal();
        }
      };
    }

    /* ---- Event listener untuk input PX (Kode Px) ---- */
    tbody.querySelectorAll('.inp-px').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx  = +inp.dataset.idx;
        const kata = inp.value.trim().toLowerCase();
        bukaAutocomplete(inp, idx, kata);
      });
      inp.addEventListener('blur', () => setTimeout(tutupAcGlobal, 200));
    });

    /* ---- Event listener untuk input NAMA PX ---- */
    tbody.querySelectorAll('.inp-nama').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx  = +inp.dataset.idx;
        const kata = inp.value.trim().toLowerCase();
        bukaAutocomplete(inp, idx, kata);
      });
      inp.addEventListener('blur', () => setTimeout(tutupAcGlobal, 200));
    });

    /* ---- Disc per baris ---- */
    tbody.querySelectorAll('.inp-disc').forEach(inp => {
      inp.addEventListener('change', () => {
        const idx  = +inp.dataset.idx;
        const disc = Math.min(100, Math.max(0, +inp.value || 0));
        barisPemeriksaan[idx].disc = disc;
        barisPemeriksaan[idx].net  = Math.round(barisPemeriksaan[idx].harga * (1 - disc / 100));
        inp.value = disc;
        hitungUlang(el);
        gambarBarisPemeriksaan(el);
      });
    });

    /* ---- Keterangan ---- */
    tbody.querySelectorAll('.inp-ket').forEach(inp => {
      inp.addEventListener('change', () => {
        barisPemeriksaan[+inp.dataset.idx].ket = inp.value;
        simpanDraftPendaftaran(el);
      });
    });

    /* ---- Hapus baris ---- */
    tbody.querySelectorAll('.btn-hapus-baris').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.idx;
        barisPemeriksaan[idx] = { labId: null, kode: '', nama: '', harga: 0, disc: 0, net: 0, ket: '' };
        hitungUlang(el);
        gambarBarisPemeriksaan(el);
      });
    });
  }

  /* ================================================================
     HITUNG ULANG BRUTO / NETTO / BAYAR (REAKTIVITAS DUA ARAH)
  ================================================================ */
  let isUpdatingBayar = false;

  function ambilAngkaMurni(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let s = String(val).trim();
    if (!s) return 0;
    if (s.includes('.') && !s.includes(',')) {
      if ((s.match(/\./g) || []).length > 1) {
        s = s.replace(/\./g, '');
      } else {
        const parts = s.split('.');
        if (parts[1] && parts[1].length === 3) s = parts.join('');
      }
    } else if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function formatPersenDisc(pct) {
    if (pct <= 0 || isNaN(pct)) return 0;
    if (pct >= 100) return 100;
    const n = Math.round(pct * 100) / 100;
    return Number(n.toFixed(2));
  }

  // Dipanggil saat item pemeriksaan berubah, paket dipilih, rekanan dipilih, atau form direset
  function hitungUlang(el) {
    if (isUpdatingBayar) return;
    isUpdatingBayar = true;
    try {
      const bruto = barisPemeriksaan.reduce((s, b) => s + (b.harga || 0), 0);
      const netto = barisPemeriksaan.reduce((s, b) => s + (b.net  || 0), 0);

      const lblBruto = el.querySelector('#lblBruto');
      const lblNetto = el.querySelector('#lblNetto');
      if (lblBruto) lblBruto.textContent = bruto.toLocaleString('id-ID');
      if (lblNetto) lblNetto.textContent = netto.toLocaleString('id-ID');

      const inpBruto = el.querySelector('#bBruto');
      if (inpBruto) inpBruto.value = bruto;

      // Nilai dasar: gunakan netto jika ada potongan rekanan per baris (netto < bruto), atau bruto
      const dasar = (netto > 0 && netto < bruto) ? netto : bruto;
      const rawDisc = parseFloat(el.querySelector('#bDiscPct')?.value);
      const discPct = isNaN(rawDisc) ? 0 : Math.max(0, Math.min(100, rawDisc));
      const nettiAkhir = Math.max(0, Math.round(dasar * (1 - discPct / 100)));

      const inpNetti = el.querySelector('#bNetti');
      const inpBayarSkrg = el.querySelector('#bBayarSkrg');
      if (inpNetti) inpNetti.value = nettiAkhir;
      if (inpBayarSkrg) inpBayarSkrg.value = nettiAkhir;

      hitungKembalian(el, nettiAkhir);
    } finally {
      isUpdatingBayar = false;
    }
  }

  // Dipanggil saat input Disc All (%) diubah oleh pengguna
  function hitungDariDisc(el) {
    if (isUpdatingBayar) return;
    isUpdatingBayar = true;
    try {
      const bruto = barisPemeriksaan.reduce((s, b) => s + (b.harga || 0), 0);
      const netto = barisPemeriksaan.reduce((s, b) => s + (b.net  || 0), 0);
      const dasar = (netto > 0 && netto < bruto) ? netto : bruto;

      const rawDisc = parseFloat(el.querySelector('#bDiscPct')?.value);
      const discPct = isNaN(rawDisc) ? 0 : Math.max(0, Math.min(100, rawDisc));
      const nettiAkhir = Math.max(0, Math.round(dasar * (1 - discPct / 100)));

      const inpNetti = el.querySelector('#bNetti');
      const inpBayarSkrg = el.querySelector('#bBayarSkrg');
      if (inpNetti) inpNetti.value = nettiAkhir;
      if (inpBayarSkrg) inpBayarSkrg.value = nettiAkhir;

      hitungKembalian(el, nettiAkhir);
    } finally {
      isUpdatingBayar = false;
    }
  }

  // Dipanggil saat input Netti diketik manual oleh pengguna
  function hitungDariNetti(el) {
    if (isUpdatingBayar) return;
    isUpdatingBayar = true;
    try {
      const bruto = barisPemeriksaan.reduce((s, b) => s + (b.harga || 0), 0);
      const netto = barisPemeriksaan.reduce((s, b) => s + (b.net  || 0), 0);
      const dasar = (netto > 0 && netto < bruto) ? netto : bruto;

      const rawNetti = ambilAngkaMurni(el.querySelector('#bNetti')?.value);
      const nettiVal = Math.max(0, rawNetti);

      if (dasar > 0) {
        let persenDisc = ((dasar - nettiVal) / dasar) * 100;
        if (persenDisc < 0) persenDisc = 0;
        if (persenDisc > 100) persenDisc = 100;
        const inpDisc = el.querySelector('#bDiscPct');
        if (inpDisc) inpDisc.value = formatPersenDisc(persenDisc);
      } else {
        const inpDisc = el.querySelector('#bDiscPct');
        if (inpDisc) inpDisc.value = 0;
      }

      const inpBayarSkrg = el.querySelector('#bBayarSkrg');
      if (inpBayarSkrg) inpBayarSkrg.value = nettiVal;

      hitungKembalian(el, nettiVal);
    } finally {
      isUpdatingBayar = false;
    }
  }

  function hitungKembalian(el, netti) {
    const uang = ambilAngkaMurni(el.querySelector('#bUangPasien')?.value);
    const nettiVal = (netti !== undefined && netti !== null)
      ? +netti
      : ambilAngkaMurni(el.querySelector('#bNetti')?.value);

    const kembalian = Math.max(0, uang - nettiVal);
    const kurang    = Math.max(0, nettiVal - uang);

    const inpKembalian = el.querySelector('#bKembalian');
    const inpKurang = el.querySelector('#bKurang');
    if (inpKembalian) inpKembalian.value = kembalian;
    if (inpKurang) inpKurang.value = kurang;

    simpanDraftPendaftaran(el);
  }

  /* ================================================================
     EVENT LISTENER UTAMA
  ================================================================ */
  function pasangEventListener(el) {

    /* ---- Autosave Form Pasien ---- */
    el.querySelector('.pdft-form').addEventListener('input', () => simpanDraftPendaftaran(el));

    /* ---- Rekanan ---- */
    el.querySelector('#btnRekanan').addEventListener('click', async () => {
      const dipilih = await modalRekanan();
      if (dipilih) {
        rekananTerpilih = dipilih;
        el.querySelector('#namaRekanan').textContent = dipilih.nama;
        // Terapkan disc rekanan ke semua baris yang sudah diisi
        barisPemeriksaan.forEach(b => {
          if (b.labId) {
            b.disc = dipilih.disc || 0;
            b.net  = Math.round(b.harga * (1 - b.disc / 100));
          }
        });
        hitungUlang(el);
        gambarBarisPemeriksaan(el);
      }
    });

    /* ---- Cari Lab (Atas) ---- */
    const inpCariLab = el.querySelector('#cariLab');
    let acCariLabList = null;
    
    function tutupAcCariLab() {
      if (acCariLabList) { acCariLabList.remove(); acCariLabList = null; }
    }

    inpCariLab.addEventListener('input', () => {
      const kata = inpCariLab.value.trim().toLowerCase();
      tutupAcCariLab();
      if (!kata) return;

      const isBpjs = el.querySelector('#filterBpjs')?.checked;
      let cocok = masterLab
        .filter(m => m.nama.toLowerCase().includes(kata) || m.kode.toLowerCase().includes(kata));
      if (isBpjs) cocok = cocok.filter(m => m.kelompok && m.kelompok.toLowerCase().includes('bpjs'));
      cocok = cocok.slice(0, 12);

      if (!cocok.length) return;

      acCariLabList = document.createElement('div');
      acCariLabList.className = 'pdft-ac-list';
      acCariLabList.style.position = 'absolute';
      acCariLabList.style.zIndex = '1000';
      acCariLabList.style.width = '100%';
      acCariLabList.style.top = '100%';
      acCariLabList.style.left = '0';
      acCariLabList.style.background = '#fff';
      acCariLabList.style.border = '1px solid #ccc';
      acCariLabList.style.boxShadow = '0 4px 12px rgba(0,0,0,.15)';
      
      acCariLabList.innerHTML = cocok.map(m => {
        const hrg = tarifMap[m.kode] || m.harga || 0;
        return `<div class="pdft-ac-item" data-id="${m.id}" data-kode="${UI.esc(m.kode)}"
          data-nama="${UI.esc(m.nama)}" data-harga="${hrg}"
          style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #eee; font-size:12px;">
          <b>${UI.esc(m.kode)}</b> - ${UI.esc(m.nama)}
        </div>`;
      }).join('');

      inpCariLab.parentElement.style.position = 'relative';
      inpCariLab.parentElement.appendChild(acCariLabList);

      acCariLabList.querySelectorAll('.pdft-ac-item').forEach(item => {
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const discRek = rekananTerpilih?.disc || 0;
          const harga = +item.dataset.harga;
          const net = Math.round(harga * (1 - discRek / 100));
          
          let idxKosong = -1;
          for (let i = 0; i < barisPemeriksaan.length; i++) {
            if (!barisPemeriksaan[i].labId) { idxKosong = i; break; }
          }
          if (idxKosong === -1) {
            UI.toast('Baris pemeriksaan penuh.', 'err');
          } else {
            barisPemeriksaan[idxKosong] = {
              labId: item.dataset.id, kode: item.dataset.kode, nama: item.dataset.nama,
              harga, disc: discRek, net, ket: ''
            };
            hitungUlang(el);
            gambarBarisPemeriksaan(el);
          }
          tutupAcCariLab();
          inpCariLab.value = '';
        });
      });
    });
    inpCariLab.addEventListener('blur', () => setTimeout(tutupAcCariLab, 150));

    /* ---- Paket ---- */
    el.querySelector('#btnTambahPaket').addEventListener('click', () => {
      const selPaket = el.querySelector('#pilihPaket');
      const paketId  = selPaket.value;
      if (!paketId) { UI.toast('Pilih paket terlebih dahulu.', 'err'); return; }
      const paket = masterPaket.find(p => p.id === paketId);
      if (!paket || !paket.item?.length) { UI.toast('Paket kosong atau belum ada item.', 'err'); return; }

      const discRek = rekananTerpilih?.disc || 0;
      let barisKosong = 0;
      for (let i = 0; i < barisPemeriksaan.length; i++) {
        if (!barisPemeriksaan[i].labId) { barisKosong++; }
      }
      if (paket.item.length > barisKosong) {
        UI.toast(`Tidak cukup baris kosong (butuh ${paket.item.length}, tersisa ${barisKosong}).`, 'err');
        return;
      }

      let ki = 0;
      for (let i = 0; i < barisPemeriksaan.length && ki < paket.item.length; i++) {
        if (barisPemeriksaan[i].labId) continue;
        const labId = paket.item[ki].lab_id;
        const lab   = masterLab.find(m => m.id === labId);
        if (!lab) { ki++; continue; }
        const harga = tarifMap[lab.kode] || lab.harga || 0;
        barisPemeriksaan[i] = {
          labId: lab.id, kode: lab.kode, nama: lab.nama,
          harga, disc: discRek,
          net: Math.round(harga * (1 - discRek / 100)), ket: ''
        };
        ki++;
      }
      selPaket.value = '';
      hitungUlang(el);
      gambarBarisPemeriksaan(el);
    });

    /* ---- Disc all (%) ---- */
    el.querySelector('#bDiscPct').addEventListener('input', () => hitungDariDisc(el));

    /* ---- Netti (Edit Manual) ---- */
    el.querySelector('#bNetti').addEventListener('input', () => hitungDariNetti(el));

    /* ---- Uang pasien ---- */
    el.querySelector('#bUangPasien').addEventListener('input', () => hitungKembalian(el));

    /* ---- Cari pasien lama ---- */
    const inpCari  = el.querySelector('#cariPasien');
    const hasilDiv = el.querySelector('#hasilCariPasien');

    inpCari.addEventListener('input', UI.tunda(async () => {
      const kata = inpCari.value.trim();
      if (kata.length < 2) { hasilDiv.innerHTML = ''; return; }
      hasilDiv.innerHTML = '<div style="padding:6px 12px;font-size:12px;color:#888">Mencari…</div>';
      const d = await DB.cariPasien(kata, 10);
      if (!d.length) {
        hasilDiv.innerHTML = '<div style="padding:6px 12px;font-size:12px;color:#888">Tidak ditemukan.</div>';
        return;
      }
      hasilDiv.innerHTML = `<div style="background:#fff;border:1px solid #9fa8da;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.1)">
        ${d.map(p => `<div class="pdft-ac-item" data-pid="${p.id}"
          style="padding:7px 12px;cursor:pointer;border-bottom:1px solid #eee;font-size:13px">
          <b>${UI.esc(p.nama)}</b>
          <span style="color:#888;font-size:11px"> — No.RM ${UI.esc(p.no_rm)} · ${UI.umurTeks(p.tanggal_lahir)}</span>
        </div>`).join('')}
      </div>`;
      hasilDiv.querySelectorAll('[data-pid]').forEach(item => {
        item.addEventListener('click', async () => {
          hasilDiv.innerHTML = '';
          inpCari.value = '';
          const p = await DB.pasien(item.dataset.pid);
          isiFormPasien(el, p);
          pasienTerpilih = p;
        });
      });
    }, 300));

    /* ---- Reset / Pasien Baru ---- */
    el.querySelector('#btnReset').addEventListener('click', () => {
      pasienTerpilih = null;
      resetFormPasien(el);
      simpanDraftPendaftaran(el);
    });

    /* ---- Cek Pasien via NIK / NRP ---- */
    el.querySelector('#btnCekNrp').addEventListener('click', async () => {
      const nikVal = el.querySelector('#fNik')?.value.trim() || '';
      const nrpVal = el.querySelector('#fNrp')?.value.trim() || '';
      const kata = nikVal || nrpVal;
      if (!kata) return UI.toast('Isi NIK terlebih dahulu', 'err');
      
      const res = await DB.cariPasien(kata, 1);
      if (res && res.length > 0) {
         pasienTerpilih = res[0];
         isiFormPasien(el, pasienTerpilih);
         UI.toast(`Data pasien ditemukan: ${res[0].nama} (RM: ${res[0].no_rm})`, 'ok');
         
         const p = pasienTerpilih;
         const strPlant = (p.plant || '').toLowerCase();
         const strBagian = (p.bagian || '').toLowerCase();
         const isBpjs = !!p.no_bpjs 
           || strPlant.includes('bpjs') || strPlant.includes('bps')
           || strBagian.includes('bpjs') || strBagian.includes('bps');
           
         if (isBpjs) {
            const cb = el.querySelector('#filterBpjs');
            if (cb && !cb.checked) {
               cb.checked = true;
               cb.dispatchEvent(new Event('change'));
            }
            const jb = el.querySelector('#bJenisBayar');
            if (jb) jb.value = 'BPJS';
         }
      } else {
         UI.toast('Pasien tidak ditemukan.', 'err');
      }
    });

    /* ---- Input Manual No. BPJS (Tekan Enter pada kolom NRP / No. BPJS) ---- */
    const inpNrp = el.querySelector('#fNrp');
    if (inpNrp) {
      inpNrp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = inpNrp.value.trim();
          const bpjsVal = ekstrakNomorBpjs(val);
          if (bpjsVal) {
            e.preventDefault();
            e.stopPropagation();
            prosesScanBpjs(bpjsVal, el);
          }
        }
      });
    }

    /* ---- Global Barcode Scanner Listener (Blueprint BP-LITE W2D) ---- */
    if (handlerScanGlobal) {
      document.removeEventListener('keydown', handlerScanGlobal, true);
      handlerScanGlobal = null;
    }

    let scanBuffer = '';
    let scanTimestamps = [];
    let lastKeyTime = 0;
    const MAX_SCAN_INTERVAL = 65; // ms delay maksimal antar karakter scanner HID

    handlerScanGlobal = (e) => {
      // Abaikan jika halaman pendaftaran sudah tidak terhubung di DOM
      if (!el || !el.isConnected) {
        if (handlerScanGlobal) {
          document.removeEventListener('keydown', handlerScanGlobal, true);
          handlerScanGlobal = null;
        }
        return;
      }

      // Abaikan jika modal popup dialog sedang terbuka
      if (document.querySelector('.modal-wrap, .ui-modal, .modal-backdrop')) {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTime;

      // Saat tombol Enter ditekan
      if (e.key === 'Enter') {
        const bpjsCandidate = ekstrakNomorBpjs(scanBuffer);
        const totalChars = scanTimestamps.length;
        // Scanner mengirim sedikitnya 12-13 karakter secara beruntun sangat cepat (< 50ms)
        const isScanBurst = totalChars >= 12 && (now - scanTimestamps[0]) < 1000;

        if (bpjsCandidate && (isScanBurst || scanBuffer.trim().length === 13)) {
          e.preventDefault();
          e.stopPropagation();

          const finalBpjs = bpjsCandidate;
          const bufferToClean = scanBuffer;

          // Reset buffer
          scanBuffer = '';
          scanTimestamps = [];
          lastKeyTime = 0;

          // Bersihkan teks barcode yang sempat masuk ke input aktif selain fNrp
          const active = document.activeElement;
          if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
            if (active.id !== 'fNrp') {
              if (active.value.endsWith(bufferToClean)) {
                active.value = active.value.slice(0, -bufferToClean.length).trim();
              } else if (active.value === bufferToClean || active.value === finalBpjs) {
                active.value = '';
              }
            }
          }

          // Jalankan pencarian pasien BPJS
          prosesScanBpjs(finalBpjs, el);
          return;
        }

        // Reset buffer jika bukan scan kartu BPJS
        scanBuffer = '';
        scanTimestamps = [];
        lastKeyTime = 0;
        return;
      }

      // Rekam tombol jika karakter tunggal
      if (e.key && e.key.length === 1) {
        // Jika jeda dari ketukan sebelumnya melebihi threshold scanner, reset buffer (karena ketikan manusia)
        if (diff > MAX_SCAN_INTERVAL) {
          scanBuffer = '';
          scanTimestamps = [];
        }

        scanBuffer += e.key;
        scanTimestamps.push(now);
        lastKeyTime = now;

        // Batasi panjang buffer agar tetap ringan
        if (scanBuffer.length > 50) {
          scanBuffer = scanBuffer.slice(-25);
          scanTimestamps = scanTimestamps.slice(-25);
        }
      }
    };

    // Pasang listener di document pada fase capture (true) agar selalu tertangkap paling awal
    document.addEventListener('keydown', handlerScanGlobal, true);

    /* ---- Tombol SAVE ---- */
    el.querySelector('#btnSave').addEventListener('click', () => daftarkanPasien(el));

    /* ---- Tombol NO LAB ---- */
    el.querySelector('#btnNoLab').addEventListener('click', () => cetakNoLab(el));

    /* ---- Tombol NOTA M.1 ---- */
    el.querySelector('#btnNotaM1').addEventListener('click', () => cetakNota(el, 'M1'));

    /* ---- Tombol NOTA 2 ---- */
    el.querySelector('#btnNota2').addEventListener('click', () => cetakNota(el, 'N2'));

    /* ---- Tombol IC ANTIGEN ---- */
    el.querySelector('#btnIcAntigen').addEventListener('click', () => cetakIC(el, 'ANTIGEN'));

    /* ---- Tombol IC PCR ---- */
    el.querySelector('#btnIcPcr').addEventListener('click', () => cetakIC(el, 'PCR'));

    /* ---- Tombol IC.1 ---- */
    el.querySelector('#btnIc1').addEventListener('click', () => cetakIC(el, 'IC1'));

    /* ---- Tombol IC.2 ---- */
    el.querySelector('#btnIc2').addEventListener('click', () => cetakIC(el, 'IC2'));

    /* ---- Tombol PASIEN BARU ---- */
    el.querySelector('#btnSelesaiBaru')?.addEventListener('click', () => {
      pasienTerpilih = null;
      terakhirTerdaftar = null;
      resetFormPasien(el);
      barisPemeriksaan = Array.from({ length: JUMLAH_BARIS }, () => ({
        labId: null, kode: '', nama: '', harga: 0, disc: 0, net: 0, ket: ''
      }));
      localStorage.removeItem('draft_pendaftaran');
      hitungUlang(el);
      gambarBarisPemeriksaan(el);
      UI.toast('Form siap untuk pendaftaran pasien baru.', 'ok');
      const inp = el.querySelector('#cariPasien');
      if (inp) inp.focus();
    });
  }

  /* ================================================================
     EKSTRAK & PROSES AUTO-SCAN KARTU BPJS (BLUEPRINT BP-LITE W2D)
  ================================================================ */
  function ekstrakNomorBpjs(str) {
    if (!str || typeof str !== 'string') return null;
    const bersih = str.trim();
    // Bersihkan karakter simbolik non-digit dan periksa panjangnya
    const hanyaAngka = bersih.replace(/\D/g, '');
    if (hanyaAngka.length === 13) {
      return hanyaAngka;
    }
    return null;
  }

  async function prosesScanBpjs(nomorScan, el) {
    if (!nomorScan) return;
    const noBpjsClean = String(nomorScan).trim();

    UI.toast('Mencari data pasien BPJS: ' + noBpjsClean + '...', 'info');

    let dataPasien = null;

    // 1. Cari exact match di Supabase via DB.sb jika tersedia
    try {
      if (DB.sb) {
        const { data, error } = await DB.sb.from('pasien')
          .select('*')
          .eq('no_bpjs', noBpjsClean)
          .eq('aktif', true)
          .limit(1);
        if (!error && data && data.length > 0) {
          dataPasien = data[0];
        }

        // Coba juga jika nomor tersimpan di kolom nrp
        if (!dataPasien) {
          const { data: dNrp, error: eNrp } = await DB.sb.from('pasien')
            .select('*')
            .eq('nrp', noBpjsClean)
            .eq('aktif', true)
            .limit(1);
          if (!eNrp && dNrp && dNrp.length > 0) {
            dataPasien = dNrp[0];
          }
        }
      }
    } catch (errDb) {
      console.warn('Query DB.sb pasien no_bpjs error:', errDb);
    }

    // 2. Fallback via DB.cariPasien
    if (!dataPasien) {
      try {
        const list = await DB.cariPasien(noBpjsClean, 5);
        if (list && list.length > 0) {
          const exact = list.find(p => (p.no_bpjs || '').trim() === noBpjsClean || (p.nrp || '').trim() === noBpjsClean);
          dataPasien = exact || list[0];
          if (dataPasien && dataPasien.id && DB.pasien) {
            try {
              const detail = await DB.pasien(dataPasien.id);
              if (detail) dataPasien = detail;
            } catch (_) {}
          }
        }
      } catch (errCari) {
        console.error('Error saat cariPasien BPJS:', errCari);
      }
    }

    if (dataPasien) {
      // Kondisi 1 - Data Ditemukan (Pasien Lama)
      pasienTerpilih = dataPasien;
      isiFormPasien(el, dataPasien);

      // Pastikan field no BPJS terisi nomor scan / no_bpjs
      const fNrp = el.querySelector('#fNrp');
      if (fNrp) {
        fNrp.value = dataPasien.no_bpjs || dataPasien.nrp || noBpjsClean;
      }

      // Set jenis kunjungan / cara bayar otomatis ke "BPJS"
      const jb = el.querySelector('#bJenisBayar');
      if (jb) jb.value = 'BPJS';

      const cb = el.querySelector('#filterBpjs');
      if (cb && !cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event('change'));
      }

      UI.toast('Pasien Ditemukan: ' + (dataPasien.nama || '') + ' (No RM: ' + (dataPasien.no_rm || '-') + ')', 'ok');
      simpanDraftPendaftaran(el);

      // Arahkan fokus ke pilihan dokter / pendaftaran kunjungan
      setTimeout(() => {
        const fDokter = el.querySelector('#fDokterNama');
        if (fDokter) fDokter.focus();
      }, 80);

    } else {
      // Kondisi 2 - Data Belum Ada (Pasien Baru)
      pasienTerpilih = null;
      resetFormPasien(el);

      // Isi otomatis kolom input No. BPJS dengan nomor hasil scan tersebut
      const fNrp = el.querySelector('#fNrp');
      if (fNrp) {
        fNrp.value = noBpjsClean;
      }

      // Set pilihan cara bayar otomatis ke "BPJS"
      const jb = el.querySelector('#bJenisBayar');
      if (jb) jb.value = 'BPJS';

      const cb = el.querySelector('#filterBpjs');
      if (cb && !cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event('change'));
      }

      UI.toast('Pasien Baru / Belum Terdaftar', 'info');
      simpanDraftPendaftaran(el);

      // Arahkan fokus kursor langsung ke input field "Nama Pasien" agar resepsionis bisa langsung mengetik nama
      setTimeout(() => {
        const fNama = el.querySelector('#fNama');
        if (fNama) {
          fNama.focus();
          fNama.select?.();
        }
      }, 80);
    }
  }

  /* ================================================================
     ISI FORM DARI DATA PASIEN TERPILIH
  ================================================================ */
  function isiFormPasien(el, p) {
    el.querySelector('#fRm').value       = p.no_rm || '';
    if (el.querySelector('#fNik')) el.querySelector('#fNik').value = p.nik || '';
    el.querySelector('#fNrp').value      = p.nrp   || p.no_bpjs || '';
    el.querySelector('#fNama').value     = p.nama  || '';
    el.querySelector('#fTitle').value    = p.title || '';
    el.querySelector('#fBagian').value   = p.bagian || '';
    el.querySelector('#fPlant').value    = p.plant  || '';
    el.querySelector('#fTglLahir').value = p.tanggal_lahir || '';
    el.querySelector('#fJk').value       = p.jenis_kelamin || 'L';
    el.querySelector('#fAlamat').value   = p.alamat || '';
    el.querySelector('#fTelp').value     = p.no_hp || p.no_telp || '';
    el.querySelector('#bJenisBayar').value = p.no_bpjs ? 'BPJS' : 'UMUM';
  }

  function resetFormPasien(el) {
    el.querySelector('#fRm').value       = '(Otomatis)';
    if (el.querySelector('#fNik')) el.querySelector('#fNik').value = '';
    el.querySelector('#fNrp').value      = '';
    el.querySelector('#fNama').value     = '';
    el.querySelector('#fTitle').value    = 'Tn.';
    el.querySelector('#fBagian').value   = '';
    el.querySelector('#fPlant').value    = '';
    el.querySelector('#fTglLahir').value = '';
    el.querySelector('#fJk').value       = 'L';
    el.querySelector('#fAlamat').value   = '';
    el.querySelector('#fTelp').value     = '';
    el.querySelector('#fDokterNama').value = '';
    el.querySelector('#bJenisBayar').value = 'UMUM';
    el.querySelector('#bUangPasien').value = '0';
    el.querySelector('#bDiscPct').value   = '0';
    if (el.querySelector('#bNetti')) el.querySelector('#bNetti').value = '0';
    if (el.querySelector('#bBayarSkrg')) el.querySelector('#bBayarSkrg').value = '0';
    if (el.querySelector('#bKembalian')) el.querySelector('#bKembalian').value = '0';
    if (el.querySelector('#bKurang')) el.querySelector('#bKurang').value = '0';
    const cb = el.querySelector('#filterBpjs');
    if (cb) cb.checked = false;
    el.querySelector('#fJanjiTgl').value = UI.hariIni();
    const dj = new Date(Date.now() + 2 * 3600 * 1000);
    el.querySelector('#fJanjiJam').value = ('0' + dj.getHours()).slice(-2) + ':' + ('0' + dj.getMinutes()).slice(-2);
    const lblNoLab = el.querySelector('#lblNoLab');
    if (lblNoLab) {
      lblNoLab.textContent = '';
      lblNoLab.style.display = 'none';
    }
  }

  function simpanDraftPendaftaran(el) {
    if (!el.isConnected) return;
    const draft = {
      pasienTerpilih, rekananTerpilih, barisPemeriksaan,
      form: {
        rm: el.querySelector('#fRm')?.value,
        nik: el.querySelector('#fNik')?.value,
        nrp: el.querySelector('#fNrp')?.value,
        nama: el.querySelector('#fNama')?.value,
        title: el.querySelector('#fTitle')?.value,
        bagian: el.querySelector('#fBagian')?.value,
        plant: el.querySelector('#fPlant')?.value,
        tglLahir: el.querySelector('#fTglLahir')?.value,
        jk: el.querySelector('#fJk')?.value,
        alamat: el.querySelector('#fAlamat')?.value,
        telp: el.querySelector('#fTelp')?.value,
        dokter: el.querySelector('#fDokterNama')?.value,
        jenisBayar: el.querySelector('#bJenisBayar')?.value,
        uangPasien: el.querySelector('#bUangPasien')?.value,
        discPct: el.querySelector('#bDiscPct')?.value,
        netti: el.querySelector('#bNetti')?.value,
        filterBpjs: el.querySelector('#filterBpjs')?.checked
      }
    };
    localStorage.setItem('draft_pendaftaran', JSON.stringify(draft));
  }

  /* ================================================================
     MODAL PILIH REKANAN
  ================================================================ */
  async function modalRekanan() {
    return await UI.modal({
      judul: 'Pilih Rekanan / Instansi Pengirim',
      isi: `<div style="margin-bottom:10px">
              <input type="search" id="cariRknModal" class="input" placeholder="Cari nama rekanan..." style="width:100%">
            </div>
            <div class="table-wrap" style="max-height:400px;overflow-y:auto"><table class="tbl">
        <thead><tr><th>#</th><th>ID</th><th>Nama Rekanan</th><th>Disc %</th></tr></thead>
        <tbody>${masterRekanan.map((r, i) =>
          `<tr class="clickable rkn-row" data-rek="${i}" style="cursor:pointer">
            <td>${i+1}</td><td class="mono muted">${r.id}</td>
            <td class="rkn-nama"><b>${UI.esc(r.nama)}</b></td>
            <td>${r.disc}%</td>
          </tr>`
        ).join('')}</tbody>
      </table></div>`,
      tombol: [{ teks: 'Batal', nilai: null }],
      siap: (body, tutup) => {
        body.querySelectorAll('[data-rek]').forEach(row => {
          row.addEventListener('click', () => {
            tutup(masterRekanan[+row.dataset.rek]);
          });
        });
        const inpCari = body.querySelector('#cariRknModal');
        if (inpCari) {
          inpCari.addEventListener('input', () => {
            const kata = inpCari.value.toLowerCase();
            body.querySelectorAll('.rkn-row').forEach(row => {
              const nama = row.querySelector('.rkn-nama').textContent.toLowerCase();
              row.style.display = nama.includes(kata) ? '' : 'none';
            });
          });
          // Focus otomatis saat modal terbuka
          setTimeout(() => inpCari.focus(), 100);
        }
      }
    });
  }

  /* ================================================================
     DAFTARKAN PASIEN (simpan & buat kunjungan lab)
  ================================================================ */
  async function daftarkanPasien(el) {
    const nikInput = (el.querySelector('#fNik')?.value || '').trim();
    const nama     = el.querySelector('#fNama').value.trim();
    const tglLahir = el.querySelector('#fTglLahir').value;
    const jk       = el.querySelector('#fJk').value;

    // VALIDASI NIK (Opsional untuk anak kecil/lansia, namun jika diisi harus 16 digit)
    if (nikInput && !/^\d{16}$/.test(nikInput)) {
      UI.toast('Jika diisi, NIK harus terdiri dari tepat 16 digit angka.', 'err');
      el.querySelector('#fNik')?.focus();
      return;
    }

    if (!nama)     { UI.toast('Nama pasien wajib diisi.', 'err'); return; }
    if (!tglLahir) { UI.toast('Tanggal lahir wajib diisi.', 'err'); return; }

    const labDipilih = barisPemeriksaan.filter(b => b.labId);

    // Validasi Dokter: Wajib diisi jika ada pemeriksaan lab yang didaftarkan
    const dokterNama = (el.querySelector('#fDokterNama')?.value || '').trim();
    if (labDipilih.length > 0) {
      if (!dokterNama) {
        UI.toast('Dokter pemeriksa / pengirim wajib diisi.', 'err');
        el.querySelector('#fDokterNama')?.focus();
        return;
      }
      const dokterAda = masterDokter.find(d => (d.nama || '').trim().toLowerCase() === dokterNama.toLowerCase());
      if (!dokterAda) {
        UI.toast(`Dokter "${dokterNama}" tidak terdaftar dalam master data dokter. Silakan pilih dari pilihan yang tersedia.`, 'err');
        el.querySelector('#fDokterNama')?.focus();
        return;
      }
    }

    const btn = el.querySelector('#btnSave');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Menyimpan…';
    }

    try {
      let pasien = pasienTerpilih;

      const nrpInput = (el.querySelector('#fNrp')?.value || '').trim();
      let bpjsVal = null, nrpVal = nrpInput || null;
      if (nrpInput.length === 13) { bpjsVal = nrpInput; }

      const telpVal = (el.querySelector('#fTelp')?.value || '').trim() || null;

      const dataPasien = {
        title:         el.querySelector('#fTitle')?.value || 'Tn.',
        nama:          nama,
        nrp:           nrpVal,
        bagian:        el.querySelector('#fBagian')?.value.trim() || null,
        plant:         el.querySelector('#fPlant')?.value.trim() || null,
        nik:           nikInput || null,
        no_bpjs:       bpjsVal || (el.querySelector('#bJenisBayar')?.value === 'BPJS' ? nrpVal : null) || pasien?.no_bpjs || null,
        jenis_kelamin: jk,
        tanggal_lahir: tglLahir,
        alamat:        el.querySelector('#fAlamat')?.value.trim() || null,
        no_hp:         telpVal,
        no_telp:       telpVal
      };

      if (!pasien) {
        // Cegah pembuatan pasien ganda jika NIK diisi dan sudah ada
        if (nikInput) {
          const resCek = await DB.cariPasien(nikInput, 1);
          if (resCek && resCek.length > 0) {
            pasienTerpilih = resCek[0];
            isiFormPasien(el, pasienTerpilih);
            UI.toast(`NIK sudah terdaftar atas nama ${resCek[0].nama} (No. RM: ${resCek[0].no_rm}). Data pasien dimuat, silakan klik SAVE untuk konfirmasi pendaftaran.`, 'warn');
            if (btn) {
              btn.disabled = false;
              btn.textContent = 'Save';
            }
            return;
          }
        }
        // Buat pasien baru
        pasien = await DB.simpanPasien(dataPasien, null);
        UI.toast(`Pasien baru terdaftar. No. RM: ${pasien.no_rm}`, 'ok');
      } else {
        // Jika pasien lama, pastikan perubahan NIK tidak bentrok dengan pasien lain
        if (nikInput && nikInput !== pasien.nik) {
          const resCek = await DB.cariPasien(nikInput, 1);
          if (resCek && resCek.length > 0 && resCek[0].id !== pasien.id) {
            UI.toast(`Gagal: NIK ${nikInput} sudah digunakan oleh pasien ${resCek[0].nama} (RM: ${resCek[0].no_rm}).`, 'err');
            if (btn) {
              btn.disabled = false;
              btn.textContent = 'Save';
            }
            return;
          }
        }
        // Update data identitas pasien lama dengan isian form terbaru
        pasien = await DB.simpanPasien(dataPasien, pasien.id);
      }

      // JIKA HANYA MENDAFTARKAN PASIEN (TANPA PEMERIKSAAN LAB):
      if (!labDipilih || labDipilih.length === 0) {
        pasienTerpilih = pasien;
        el.querySelector('#fRm').value = pasien.no_rm || '';
        localStorage.removeItem('draft_pendaftaran');
        UI.toast(`Pasien berhasil didaftarkan (No. RM: ${pasien.no_rm}). Tanpa pemeriksaan lab, tagihan kasir tidak dibuat.`, 'ok');
        return;
      }

      // JIKA ADA PEMERIKSAAN LAB:
      // Cari lab poli
      const labPoli = masterPoli.find(p => p.nama.toLowerCase().includes('lab')) || masterPoli[0];

      // Ambil id dokter dari nama
      const dokterObj = masterDokter.find(d => (d.nama || '').trim().toLowerCase() === dokterNama.toLowerCase());

      // Buat kunjungan
      const kunjungan = await DB.buatKunjungan({
        pasien_id:       pasien.id,
        poli_id:         labPoli ? labPoli.id : null,
        dokter_id:       dokterObj ? dokterObj.id : null,
        cara_bayar:      el.querySelector('#bJenisBayar').value || 'UMUM',
        kunjungan_sakit: true,
        keluhan_singkat: `Pemeriksaan lab via Pendaftaran`,
        created_by:      App.siapa().id
      });

      // Buat permintaan lab
      let reqId = null;
      if (labDipilih.length > 0) {
        reqId = await DB.labMinta(kunjungan.id, labDipilih.map(b => b.labId));
      }

      let noLabResmi = null;
      if (reqId) {
        try {
          if (typeof DB.labPermintaan === 'function') {
            const lpData = await DB.labPermintaan(reqId);
            if (lpData && lpData.no_lab) {
              noLabResmi = lpData.no_lab;
            }
          }
          if (!noLabResmi && DB.sb) {
            const { data: lpData } = await DB.sb.from('lab_permintaan').select('no_lab').eq('id', reqId).single();
            if (lpData && lpData.no_lab) {
              noLabResmi = lpData.no_lab;
            }
          }
        } catch (errLp) {
          console.warn('Gagal mengambil no_lab resmi:', errLp);
        }
      }

      if (!noLabResmi) {
        noLabResmi = LabCetak.formatNoLab(null, kunjungan.tanggal);
      } else {
        noLabResmi = LabCetak.formatNoLab(noLabResmi, kunjungan.tanggal);
      }

      // --- TAMBAHAN KASIR ---
      // 1. Buat Kasir Tagihan
      const jb = el.querySelector('#bJenisBayar').value || 'UMUM';
      const penjamin = (jb === 'TRANSFER') ? 'UMUM' : jb;
      const isBPJS = (jb === 'BPJS' || jb === 'GRATIS');
      
      const tagihan = await DB.kasirBuatTagihanBebas({
        kunjungan_id: kunjungan.id,
        pasien_id: pasien.id,
        nama_pembayar: pasien.nama,
        tanggal: UI.hariIni(),
        penjamin: penjamin
      });

      // 2. Tambah item ke Tagihan
      let urutan = 1;
      const globalDisc = +(el.querySelector('#bDiscPct').value) || 0;
      
      for (const b of labDipilih) {
        // Hitung diskon gabungan: diskon per item dan diskon global
        // Rumus: 1 - ((1 - disc_item) * (1 - disc_global))
        const dItem = (+b.disc || 0) / 100;
        const dGlobal = globalDisc / 100;
        const effectiveDiscPct = 100 * (1 - ((1 - dItem) * (1 - dGlobal)));

        await DB.kasirTambahItem({
          tagihan_id: tagihan.id,
          sumber: 'MANUAL', // Menggunakan MANUAL agar tidak dihapus otomatis jika Kasir melakukan 'Susun Ulang'
          ref_id: b.labId,
          ref_kode: b.kode,
          nama: 'Lab: ' + b.nama,
          qty: 1,
          harga_satuan: b.harga || 0,
          diskon_pct: effectiveDiscPct,
          ditanggung_penjamin: isBPJS, // Jika BPJS, ditanggung penjamin sehingga pasien bayar Rp 0 dan tagihan langsung LUNAS
          urutan: urutan++
        });
      }

      // 3. Catat Pembayaran jika pasien langsung membayar (hanya untuk non-BPJS)
      const uangPasien = +(el.querySelector('#bUangPasien').value) || 0;
      const netto = +(el.querySelector('#bNetti').value) || 0;
      
      if (!isBPJS && uangPasien > 0) {
        const metode = (jb === 'TRANSFER') ? 'transfer' : 'tunai';
        const jumlahBayar = Math.min(uangPasien, netto); // Yang terhitung sbg pelunasan tagihan maksimal adalah netto
        await DB.kasirCatatPembayaran({
          tagihan_id: tagihan.id,
          jumlah: jumlahBayar,
          tanggal: UI.hariIni(),
          metode: metode,
          uang_diterima: uangPasien
        });
      }

      terakhirTerdaftar = {
        pasien,
        kunjungan,
        noLab: noLabResmi,
        labDipilih,
        bruto: +(el.querySelector('#bBruto').value) || 0,
        netto: +(el.querySelector('#bNetti').value) || 0,
        bayar: +(el.querySelector('#bUangPasien').value) || 0,
        kurang: +(el.querySelector('#bKurang').value) || 0,
        jenisBayar: el.querySelector('#bJenisBayar').value || 'UMUM'
      };
      pasienTerpilih = pasien;
      el.querySelector('#fRm').value = pasien.no_rm || '';

      const lblNoLab = el.querySelector('#lblNoLab');
      if (lblNoLab && noLabResmi) {
        lblNoLab.textContent = 'No. Lab: ' + noLabResmi;
        lblNoLab.style.display = 'inline-block';
      }

      const pesanLab = noLabResmi ? ` (No. Lab: ${noLabResmi})` : '';
      const pesanKasir = isBPJS ? ' Tagihan BPJS berstatus LUNAS.' : ' Tagihan Kasir berhasil disimpan.';
      UI.toast(`Pendaftaran lab${pesanLab}.${pesanKasir} Silakan cetak dokumen yang diperlukan.`, 'ok');
      localStorage.removeItem('draft_pendaftaran');

    } catch(e) {
      UI.toast('Gagal mendaftarkan: ' + (e.message || e), 'err');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Save';
      }
    }
  }

  /* ================================================================
     FUNGSI CETAK
  ================================================================ */
  function cetakNoLab(el) {
    let p = terakhirTerdaftar?.pasien || pasienTerpilih;
    const namaPx = (el.querySelector('#fNama')?.value || '').trim();

    if (!p) {
      if (namaPx) {
        p = {
          no_rm: el.querySelector('#fRm')?.value || '',
          nik: (el.querySelector('#fNik')?.value || '').trim(),
          nama: namaPx,
          title: el.querySelector('#fTitle')?.value || '',
          tanggal_lahir: el.querySelector('#fTglLahir')?.value || '',
          jenis_kelamin: el.querySelector('#fJk')?.value || 'L',
          alamat: (el.querySelector('#fAlamat')?.value || '').trim(),
          no_telp: (el.querySelector('#fTelp')?.value || '').trim()
        };
      } else {
        UI.toast('Isi nama pasien atau pilih pasien terlebih dahulu.', 'err');
        return;
      }
    }

    const pFinal = {
      ...p,
      nama: namaPx || p.nama,
      title: el.querySelector('#fTitle')?.value || p.title || '',
      nik: (el.querySelector('#fNik')?.value || '').trim() || p.nik,
      tanggal_lahir: el.querySelector('#fTglLahir')?.value || p.tanggal_lahir,
      jenis_kelamin: el.querySelector('#fJk')?.value || p.jenis_kelamin || 'L',
      alamat: (el.querySelector('#fAlamat')?.value || '').trim() || p.alamat || '-',
      no_rm: el.querySelector('#fRm')?.value || p.no_rm || '-'
    };

    const labDipilih = (terakhirTerdaftar?.labDipilih && terakhirTerdaftar.labDipilih.length)
      ? terakhirTerdaftar.labDipilih
      : barisPemeriksaan.filter(b => b.labId || (b.nama && b.nama.trim()));

    if (!labDipilih.length) {
      UI.toast('Pilih minimal satu pemeriksaan di tabel sebelah kiri.', 'err');
      return;
    }

    const bruto = +el.querySelector('#bBruto').value || terakhirTerdaftar?.bruto || 0;
    const netto = +el.querySelector('#bNetti').value || terakhirTerdaftar?.netto || 0;
    const bayar = +el.querySelector('#bUangPasien').value || terakhirTerdaftar?.bayar || 0;
    const kurang = +el.querySelector('#bKurang').value || terakhirTerdaftar?.kurang || 0;
    const jenisBayar = el.querySelector('#bJenisBayar').value || terakhirTerdaftar?.jenisBayar || 'UMUM';

    let noLabKustom = terakhirTerdaftar?.noLab || null;
    if (!noLabKustom) {
      noLabKustom = LabCetak.formatNoLab(null, new Date());
      if (terakhirTerdaftar) terakhirTerdaftar.noLab = noLabKustom;
    }

    const lblNoLab = el.querySelector('#lblNoLab');
    if (lblNoLab && noLabKustom) {
      lblNoLab.textContent = 'No. Lab: ' + noLabKustom;
      lblNoLab.style.display = 'inline-block';
    }

    LabCetak.cetakNoLab(pFinal, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom).catch(e => {
      console.error(e);
      UI.toast('Gagal mencetak No Lab: ' + (e.message || e), 'err');
    });
  }

  function cetakNota(el, jenis) {
    let p = terakhirTerdaftar?.pasien || pasienTerpilih;
    const namaPx = (el.querySelector('#fNama')?.value || '').trim();

    if (!p) {
      if (namaPx) {
        p = {
          no_rm: el.querySelector('#fRm')?.value || '',
          nik: (el.querySelector('#fNik')?.value || '').trim(),
          nama: namaPx,
          title: el.querySelector('#fTitle')?.value || '',
          tanggal_lahir: el.querySelector('#fTglLahir')?.value || '',
          jenis_kelamin: el.querySelector('#fJk')?.value || 'L',
          alamat: (el.querySelector('#fAlamat')?.value || '').trim(),
          no_telp: (el.querySelector('#fTelp')?.value || '').trim()
        };
      } else {
        UI.toast('Pilih atau daftarkan pasien terlebih dahulu.', 'err');
        return;
      }
    }

    const pFinal = {
      ...p,
      nama: namaPx || p.nama,
      title: el.querySelector('#fTitle')?.value || p.title || '',
      nik: (el.querySelector('#fNik')?.value || '').trim() || p.nik,
      tanggal_lahir: el.querySelector('#fTglLahir')?.value || p.tanggal_lahir,
      jenis_kelamin: el.querySelector('#fJk')?.value || p.jenis_kelamin || 'L',
      alamat: (el.querySelector('#fAlamat')?.value || '').trim() || p.alamat || '-',
      no_rm: el.querySelector('#fRm')?.value || p.no_rm || '-'
    };

    const labDipilih = (terakhirTerdaftar?.labDipilih && terakhirTerdaftar.labDipilih.length)
      ? terakhirTerdaftar.labDipilih
      : barisPemeriksaan.filter(b => b.labId || (b.nama && b.nama.trim()));

    if (!labDipilih.length) { UI.toast('Tidak ada pemeriksaan yang dipilih.', 'err'); return; }

    const bruto = +el.querySelector('#bBruto').value || terakhirTerdaftar?.bruto || 0;
    const netto = +el.querySelector('#bNetti').value || terakhirTerdaftar?.netto || 0;
    const bayar = +el.querySelector('#bUangPasien').value || terakhirTerdaftar?.bayar || 0;
    const kurang = +el.querySelector('#bKurang').value || terakhirTerdaftar?.kurang || 0;
    const jenisBayar = el.querySelector('#bJenisBayar').value || terakhirTerdaftar?.jenisBayar || 'UMUM';

    let noLabKustom = terakhirTerdaftar?.noLab || null;
    if (!noLabKustom) {
      noLabKustom = LabCetak.formatNoLab(null, new Date());
      if (terakhirTerdaftar) terakhirTerdaftar.noLab = noLabKustom;
    }

    if (jenis === 'M1' || jenis === 'N2') {
      LabCetak.cetakNotaM1(pFinal, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom).catch(e => {
        UI.toast(`Gagal mencetak Nota ${jenis}: ` + e.message, 'err');
      });
    } else {
      UI.toast(`Mencetak Nota ${jenis} untuk: ` + pFinal.nama, 'ok');
    }
  }

  function cetakIC(el, jenis) {
    const p = terakhirTerdaftar?.pasien || pasienTerpilih;
    if (!p) { UI.toast('Pilih atau daftarkan pasien terlebih dahulu.', 'err'); return; }
    LabCetak.cetakIC(p, jenis).catch(e => {
      UI.toast(`Gagal mencetak Informed Consent (${jenis}): ` + e.message, 'err');
    });
  }

  return { render };
})();
