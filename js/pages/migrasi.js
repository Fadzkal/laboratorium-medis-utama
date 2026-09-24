/* =====================================================================
   MIGRASI PORTAL — memindahkan data pemantauan kronis dari sipantau
   ke rekam medis  (admin)
   ---------------------------------------------------------------------
   Halaman ini melakukan dua hal, dan urutannya wajib:

     Unggah   → berkas CSV ekspor portal masuk ke TABEL TITIPAN
     Cocokkan → tiap orang di titipan ditempelkan ke pasien RME

   Kenapa dipisah, dan kenapa tahap kedua tidak otomatis: tabel pasien
   RME mewajibkan tanggal lahir dan jenis kelamin, dua hal yang portal
   tidak pernah simpan. Membuatkan pasien sendiri berarti menerbitkan
   nomor rekam medis — identitas seumur hidup — dari data yang belum
   pernah dilihat petugas. Yang muncul kemudian bukan galat, melainkan
   pasien kembar: satu dari migrasi, satu lagi saat orangnya datang
   dengan ejaan nama yang sedikit berbeda.

   Karena itu di halaman ini tidak ada tombol "impor semua sekaligus".
   Yang ada tombol "tempel otomatis", dan ia hanya berani pada nomor
   BPJS yang cocok persis DAN hanya menunjuk satu pasien.
   ===================================================================== */
const Migrasi = (() => {

  let tabAktif = 'unggah';
  let ringkas = null;
  let daftar = [];
  let statusFilter = 'MENUNGGU';
  let cari = '';
  let terpilih = null;          // baris titipan yang sedang dikerjakan
  let usulan = [];
  let berkas = [];              // hasil baca berkas yang belum dikirim

  // Tab 0 — Pra-daftar Pasien (hanya dipakai saat RME dipasang dari nol)
  let praBerkas = null;         // { baris, dikenal, kolomAsing } dari PraDaftarCore.bacaBerkas
  let praMemeriksa = false;     // sedang memanggil pasien_cari_mirip satu per satu?
  let praSudahDiperiksa = false;

  const UKURAN_KIRIM = 500;     // baris per panggilan kronis_impor_tampung
  const UKURAN_KIRIM_PASIEN = 200; // baris per panggilan pasienBuatMassal

  async function render(el, param) {
    if (!App.boleh('menu_migrasi')) {
      el.innerHTML = UI.kosong('Akses ditolak',
        'Anda tidak punya izin membuka Migrasi Portal.');
      return;
    }
    if (param && param[0]) tabAktif = param[0];

    el.innerHTML = `
      <div class="page-header mb-16">
        <div class="page-heading">
          <h1>Migrasi Portal</h1>
          <div class="page-sub">Memindahkan pemantauan obat kronis, lab rutin,
            dan jadwal kontrol dari portal sipantau ke rekam medis.</div>
        </div>
        <div class="page-actions flex gap-8">
          <button class="btn btn-outline" id="btnEksporKesesuaianHeader">
            ${UI.ikon('unduh', 14)} Ekspor Spreadsheet (Excel)
          </button>
          <button class="btn btn-primary" id="btnCetakPdfHeader">
            ${UI.ikon('cetak', 14)} Cetak / Simpan PDF
          </button>
        </div>
      </div>

      <div id="ringkasMigrasi" class="mb-16"></div>

      <div class="tabs" id="tabs">
        ${[['pradaftar', 'Pra-daftar Pasien'], ['unggah', '1. Unggah Berkas'], ['cocok', '2. Cocokkan Pasien']]
          .map(([k, t]) => `<button class="tab ${tabAktif === k ? 'on' : ''}" data-t="${k}">${t}</button>`)
          .join('')}
      </div>
      <div id="isiTab">${UI.memuat(3)}</div>`;

    el.querySelector('#btnEksporKesesuaianHeader').addEventListener('click', () => bukaModalEkspor(el, 'spreadsheet'));
    el.querySelector('#btnCetakPdfHeader').addEventListener('click', () => bukaModalEkspor(el, 'pdf'));

    el.querySelector('#tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      tabAktif = b.dataset.t;
      el.querySelectorAll('#tabs .tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      gambarTab(el.querySelector('#isiTab'));
    });

    await muatRingkas(el);
    await gambarTab(el.querySelector('#isiTab'));
  }

  async function muatRingkas(root) {
    const w = (root || document).querySelector('#ringkasMigrasi');
    if (!w) return;
    try {
      ringkas = await DB.kronisImporRingkas();
    } catch (e) {
      w.innerHTML = `<div class="banner err"><div>${UI.esc(e.message || e)}</div></div>`;
      return;
    }
    const r = ringkas || {};
    const total = Number(r.total || 0);
    const selesai = Number(r.cocok || 0) + Number(r.abaikan || 0);
    const persen = total ? Math.round(selesai / total * 100) : 0;

    w.innerHTML = `
      <div class="grid grid-4">
        <div class="card stat"><div class="lbl">Orang di titipan</div>
          <div class="val tabular">${total}</div></div>
        <div class="card stat"><div class="lbl">Menunggu dicocokkan</div>
          <div class="val tabular">${Number(r.menunggu || 0)}</div></div>
        <div class="card stat"><div class="lbl">Sudah tertempel</div>
          <div class="val tabular">${Number(r.cocok || 0)}</div></div>
        <div class="card stat"><div class="lbl">Selesai</div>
          <div class="val tabular">${persen}%</div></div>
      </div>
      ${Number(r.menunggu_tanpa_bpjs || 0) > 0 ? `
      <div class="banner warn mt-12">
        ${UI.ikon('peringatan')}
        <div><b>${Number(r.menunggu_tanpa_bpjs)} orang tidak punya nomor BPJS di portal.</b>
          Mereka tidak akan pernah bisa ditempel otomatis — satu-satunya penolongnya
          kemiripan nama, dan kemiripan nama bukan bukti. Kerjakan yang ini pelan-pelan.</div>
      </div>` : ''}
      <div class="text-muted mt-8 text-sm">
        Baris riwayat tertampung: ${Number(r.baris_obat || 0)} pengambilan obat,
        ${Number(r.baris_lab || 0)} pemeriksaan lab,
        ${Number(r.baris_kontrol || 0)} jadwal kontrol.</div>`;
  }

  async function gambarTab(w) {
    w.innerHTML = UI.memuat(3);
    try {
      if (tabAktif === 'pradaftar') return tabPraDaftar(w);
      if (tabAktif === 'unggah') return tabUnggah(w);
      return await tabCocok(w);
    } catch (e) {
      w.innerHTML = `<div class="banner err"><div>${UI.esc(e.message || e)}</div></div>`;
    }
  }

  /* ==================================================================== */
  /*  TAB 0 — PRA-DAFTAR PASIEN (opsional — hanya untuk pemasangan dari    */
  /*  nol, ketika RME belum punya satu pun pasien terdaftar dan portal     */
  /*  punya banyak orang yang perlu dicocokkan)                            */
  /* ==================================================================== */

  function csvSel(v) {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function unduhTeks(namaBerkas, teks) {
    // BOM di depan: tanpa itu Excel Indonesia sering membaca UTF-8
    // sebagai encoding lain dan nama berhuruf non-ASCII jadi kacau.
    const blob = new Blob(['\uFEFF' + teks], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = namaBerkas;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ==================================================================== */
  /*  EKSPOR KESESUAIAN PROLANIS / PCARE (Sesuai Templat Google Sheets)  */
  /* ==================================================================== */

  const BULAN_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  function formatTglSpreadsheet(tgl) {
    if (!tgl) return '';
    const s = String(tgl).trim();
    if (!s) return '';
    const d = new Date(s.includes('T') ? s : s + 'T00:00:00');
    if (isNaN(d.getTime())) return s;
    return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatNoBpjs(bpjs) {
    if (!bpjs) return '';
    const s = String(bpjs).replace(/\D/g, '');
    if (!s) return '';
    return s.padStart(13, '0');
  }

  function formatDesimal(val) {
    if (val == null || val === '') return '';
    const s = String(val).trim();
    return s.replace('.', ',');
  }

  function ekstrakLab(barisLab, rmeLab) {
    const res = {
      tgl: '',
      fktp: '',
      tensi: '',
      tb: '', bb: '', lp: '', rr: '', hr: '', suhu: '',
      cho: '', tg: '', hdl: '', ldl: '', ur: '', cre: '', mau: '',
      hba1c: '', gdp: '', gdpp: '', gds: '',
      diagnosa: ''
    };

    if (barisLab && barisLab.length) {
      for (const b of barisLab) {
        const isi = b.isi || {};
        if (b.tanggal || isi.tanggal_lab) res.tgl = b.tanggal || isi.tanggal_lab;
        if (isi.fktp || isi.lab_pemeriksa) res.fktp = isi.fktp || isi.lab_pemeriksa;
        if (isi.tensi) res.tensi = isi.tensi;
        if (isi.tb) res.tb = isi.tb;
        if (isi.bb) res.bb = isi.bb;
        if (isi.lp) res.lp = isi.lp;
        if (isi.rr) res.rr = isi.rr;
        if (isi.hr) res.hr = isi.hr;
        if (isi.suhu) res.suhu = formatDesimal(isi.suhu);
        if (isi.cho) res.cho = formatDesimal(isi.cho);
        if (isi.tg) res.tg = formatDesimal(isi.tg);
        if (isi.hdl) res.hdl = formatDesimal(isi.hdl);
        if (isi.ldl) res.ldl = formatDesimal(isi.ldl);
        if (isi.ur || isi.ureum) res.ur = formatDesimal(isi.ur || isi.ureum);
        if (isi.cre || isi.kreatinin) res.cre = formatDesimal(isi.cre || isi.kreatinin);
        if (isi.mau) res.mau = formatDesimal(isi.mau);
        if (isi.hba1c) res.hba1c = formatDesimal(isi.hba1c);
        if (isi.gdp) res.gdp = formatDesimal(isi.gdp);
        if (isi.gdpp || isi.gd2pp) res.gdpp = formatDesimal(isi.gdpp || isi.gd2pp);
        if (isi.gds) res.gds = formatDesimal(isi.gds);
        if (isi.diagnosa || isi.diagnosis) res.diagnosa = isi.diagnosa || isi.diagnosis;
      }
    }

    if (rmeLab && rmeLab.length) {
      for (const l of rmeLab) {
        if (l.tanggal) res.tgl = l.tanggal;
        const kj = l.kunjungan || {};
        if (kj.keluhan_singkat && kj.keluhan_singkat.startsWith('Dokter Pengirim: ')) {
          res.fktp = kj.keluhan_singkat.replace('Dokter Pengirim: ', '').trim();
        } else if (kj.dokter_nama) {
          res.fktp = kj.dokter_nama;
        }
        const ka = kj.kajian_awal || {};
        if (ka.sistolik && ka.diastolik) res.tensi = `${ka.sistolik}/${ka.diastolik}`;
        if (ka.tinggi_badan) res.tb = ka.tinggi_badan;
        if (ka.berat_badan) res.bb = ka.berat_badan;
        if (ka.lingkar_perut) res.lp = ka.lingkar_perut;
        if (ka.nafas) res.rr = ka.nafas;
        if (ka.nadi) res.hr = ka.nadi;
        if (ka.suhu) res.suhu = formatDesimal(ka.suhu);

        if (l.hasil && l.hasil.length) {
          for (const h of l.hasil) {
            const kode = ((h.ref_lab && h.ref_lab.kode) || h.kode || '').toUpperCase();
            const nm = (h.nama || '').toLowerCase();
            const val = h.nilai_angka != null ? formatDesimal(h.nilai_angka) : (h.nilai_teks || '').trim();
            if (!val) continue;

            if (kode === 'CHOL' || kode === 'CHO' || nm.includes('kolesterol') || nm.includes('cholesterol')) res.cho = val;
            else if (kode === 'TG' || nm.includes('trigliserida') || nm.includes('triglycerid')) res.tg = val;
            else if (kode === 'HDL' || nm.includes('hdl')) res.hdl = val;
            else if (kode === 'LDL' || nm.includes('ldl')) res.ldl = val;
            else if (kode === 'UREUM' || kode === 'UR' || nm.includes('ureum') || nm.includes('urea')) res.ur = val;
            else if (kode === 'KREAT' || kode === 'CRE' || nm.includes('kreatinin') || nm.includes('creatinin')) res.cre = val;
            else if (kode === 'MAU' || nm.includes('mikroalbumin') || nm.includes('microalbumin')) res.mau = val;
            else if (kode === 'HBA1C' || nm.includes('hba1c')) res.hba1c = val;
            else if (kode === 'GDP' || nm.includes('gula darah puasa') || nm.includes('glukosa puasa')) res.gdp = val;
            else if (kode === 'GD2PP' || kode === 'GDPP' || nm.includes('2 jam pp') || nm.includes('gd2pp')) res.gdpp = val;
            else if (kode === 'GDS' || nm.includes('sewaktu') || nm.includes('gds')) res.gds = val;
          }
        }
      }
    }

    return res;
  }

  function tentukanKeluhanDiagnosa(diagnosaTeks, lab) {
    const t = (diagnosaTeks || lab.diagnosa || '').toLowerCase();
    const hasHba1c = !!lab.hba1c;
    const hasGula = !!(lab.gdp || lab.gdpp || lab.gds);
    const hasKimiaOnly = !!(lab.cho || lab.tg || lab.hdl || lab.ldl || lab.ur || lab.cre || lab.mau) && !hasHba1c && !hasGula;

    if ((t.includes('hipertensi') || t.includes('hpt') || hasKimiaOnly) && !t.includes('dm') && !t.includes('diabetes') && !hasHba1c && !hasGula) {
      return {
        keluhan: 'HIPERTENSI',
        anamnesa: 'HIPERTENSI',
        diagnosa: 'i10'
      };
    }
    return {
      keluhan: 'DIABETES MELITUS',
      anamnesa: 'DIABETES MELITUS',
      diagnosa: 'e11.9'
    };
  }

  function hitungPelayananNonKapitasi(lab) {
    const hasKimia = !!(lab.cho || lab.tg || lab.hdl || lab.ldl || lab.ur || lab.cre || lab.mau);
    const hasHba1c = !!lab.hba1c;
    const hasGula = !!(lab.gdp || lab.gdpp || lab.gds);

    const list = [];
    if (hasKimia) list.push('Pelayanan Kimia Darah');
    if (hasHba1c) list.push('Pelayanan HbA1c');
    if (hasGula) list.push('Pelayanan Gula Darah');

    if (!list.length) list.push('Pelayanan Gula Darah');
    return list.join(',');
  }

  let xlsxSiap = null;
  function muatSheetJS() {
    if (typeof XLSX !== 'undefined' && XLSX.utils && XLSX.write) return Promise.resolve();
    if (xlsxSiap) return xlsxSiap;
    xlsxSiap = new Promise((ok, gagal) => {
      // 1. Prioritas pustaka lokal pendukung style dan kotak-kotak tabel (xlsx-js-style)
      const s = document.createElement('script');
      s.src = 'js/xlsx-js-style.bundle.js';
      s.onload = ok;
      s.onerror = () => {
        // 2. Fallback CDN jsdelivr
        const s2 = document.createElement('script');
        s2.src = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
        s2.onload = ok;
        s2.onerror = () => {
          // 3. Fallback CDN cdnjs
          const s3 = document.createElement('script');
          s3.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          s3.onload = ok;
          s3.onerror = () => gagal(new Error('Gagal memuat pustaka Excel (SheetJS).'));
          document.head.appendChild(s3);
        };
        document.head.appendChild(s2);
      };
      document.head.appendChild(s);
    }).catch(e => { xlsxSiap = null; throw e; });
    return xlsxSiap;
  }

  function csvPecahBaris(line) {
    const res = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        res.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    res.push(cur);
    while (res.length < 42) res.push('');
    return res;
  }

  const TEMPLAT_HEADER_1 = 'DATA INPUTAN PELAYANAN PROLANIS,,,,,,,,,,,,,,,,,,,Pasien hadir ke Faskes dalam kondisi tidak puasa dengan indikasi Hiperglikemi/Hipoglikemi,,,,,,,,,,,,,,,,,,,,,,';
  const TEMPLAT_HEADER_2 = '(TGL 1 SEPTEMBER 2026 - 30 SEPTEMBER 2026),,,,,,skrining dm,,,,,,,,GLUKOSA BELUM FIX,,,,,,,,,,,,,,,,,,,,,,,,,,,';
  const TEMPLAT_HEADER_3 = ',,,,,,DIABETES MELITUS,,,,,,,"( KUTAWIS, KEJOBONG, PMI, BUKATEJA PENYESUAIAN )",,,,,,,,,,,,,,,,,,,,,,,,,,,,';
  const TEMPLAT_HEADER_4 = 'KET :,,,,,,HIPERTENSI,,,( TANDA UNTUK YANG KLAIM GDS),,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,';
  const TEMPLAT_HEADER_5 = 'TGL ENTRI : TANGGAL INPUT DI PCARE,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,';
  const TEMPLAT_HEADER_6 = ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,';
  const TEMPLAT_KOLOM_1 = 'NO,TGL PLY,TGL ENTRI,NO BPJS,NAMA PESERTA,ALAMAT,FKTP,TENSI,TB,BB,LP,RR,HR,PELAYANAN KIMIA DARAH,,,,,,,HBA1C,PELAYANAN GULA DARAH,,,Harga Pemeriksaan,,PENDAFTARAN,PERAWATAN,KELUHAN,JAM KUNJUNGAN ,ANAMNESA,RIWAYAT ALERGI,,,TERAPI OBAT,TERAPI NON OBAT,BMHP,DIAGNOSA,SUHU,TENAGA MEDIS,PELAYANAN NON KAPITASI,STATUS PULANG';
  const TEMPLAT_KOLOM_2 = ',,,,,,,,,,,,,CHO,TG,HDL,LDL,UR,CRE,MAU,,GDP,GDPP,GDS,,,,,,,,MAKANAN,UDARA,OBAT,,,,,,,,';

  async function kumpulkanDataKesesuaian(opsi) {
    const tglMulai = opsi?.tglMulai || UI.hariIni().slice(0, 7) + '-01';
    const tglSelesai = opsi?.tglSelesai || UI.hariIni();
    const caraBayar = opsi?.caraBayar || 'SEMUA';

    UI.toast('Menyiapkan data pelayanan database...', 'info', 2000);
    
    // 1. Tarik data langsung dari database RME aktif berdasarkan rentang tanggal
    let data = [];
    try {
      data = await DB.prolanisEksporPelayanan(tglMulai, tglSelesai, caraBayar);
    } catch (e) {
      console.warn('prolanisEksporPelayanan error, mencoba titipan...', e);
    }

    // 2. Jika database RME kosong pada periode tersebut, coba cek apakah ada data migrasi titipan
    if (!data || !data.length) {
      const dataTitipan = await DB.kronisImporEksporKesesuaian('COCOK');
      if (dataTitipan && dataTitipan.length) {
        data = dataTitipan;
      }
    }

    if (!data || !data.length) {
      UI.modal({
        judul: 'Data Tidak Ditemukan',
        isi: `<p class="text-muted">Tidak ada data pelayanan atau pemeriksaan laboratorium yang ditemukan pada rentang tanggal <b>${UI.esc(tglMulai)} s/d ${UI.esc(tglSelesai)}</b>.</p>
              <p class="text-muted text-sm mt-8">Pastikan sudah ada pendaftaran pasien / pemeriksaan lab yang selesai pada periode tersebut.</p>`,
        tombol: [{ teks: 'Tutup', kelas: 'btn-primary' }]
      });
      return null;
    }

    const barisColList = [];
    let noUrut = 1;

    for (const item of data) {
      const pas = item.pasien || item;
      const namaPeserta = pas.nama_pasien || pas.nama || item.nama_pasien || '';
      const noBpjs = formatNoBpjs(pas.no_bpjs || item.no_bpjs || '');
      const alamat = pas.alamat || '-';
      let fktp = pas.fktp || item.fktp || 'Klinik Griya Medica';

      const tglRaw = item.tgl_pelayanan || item.tanggal || new Date().toISOString().slice(0, 10);
      const tglFormatted = formatTglSpreadsheet(tglRaw);

      // Lab values
      const lab = {
        cho: '', tg: '', hdl: '', ldl: '', ur: '', cre: '', mau: '',
        hba1c: '', gdp: '', gdpp: '', gds: ''
      };

      const listHasil = item.lab_hasil || [];
      for (const h of listHasil) {
        const kode = ((h.ref_lab && h.ref_lab.kode) || h.kode || '').toUpperCase();
        const nm = (h.nama || '').toLowerCase();
        const val = h.nilai_angka != null ? formatDesimal(h.nilai_angka) : (h.nilai_teks || '').trim();
        if (!val) continue;

        if (kode === 'CHOL' || kode === 'CHO' || nm.includes('kolesterol') || nm.includes('cholesterol')) lab.cho = val;
        else if (kode === 'TG' || nm.includes('trigliserida') || nm.includes('triglycerid')) lab.tg = val;
        else if (kode === 'HDL' || nm.includes('hdl')) lab.hdl = val;
        else if (kode === 'LDL' || nm.includes('ldl')) lab.ldl = val;
        else if (kode === 'UREUM' || kode === 'UR' || nm.includes('ureum') || nm.includes('urea')) lab.ur = val;
        else if (kode === 'KREAT' || kode === 'CRE' || nm.includes('kreatinin') || nm.includes('creatinin')) lab.cre = val;
        else if (kode === 'MAU' || nm.includes('mikroalbumin') || nm.includes('microalbumin')) lab.mau = val;
        else if (kode === 'HBA1C' || nm.includes('hba1c')) lab.hba1c = val;
        else if (kode === 'GDP' || (nm.includes('puasa') && !nm.includes('2 jam'))) lab.gdp = val;
        else if (kode === 'GD2PP' || kode === 'GDPP' || nm.includes('2 jam') || nm.includes('gd2pp')) lab.gdpp = val;
        else if (kode === 'GDS' || (nm.includes('sewaktu') || nm.includes('gds'))) lab.gds = val;
      }

      // Tanda vital
      let tensi = item.tensi || (item.sistolik && item.diastolik ? `${item.sistolik}/${item.diastolik}` : '120/80');
      let tb = item.tinggi_badan || '';
      let bb = item.berat_badan || '';
      let lp = item.lingkar_perut || '';
      let rr = item.rr || '20';
      let hr = item.hr || '80';
      const suhu = item.suhu ? formatDesimal(item.suhu) : '36,0';

      // Jika data dari kronisImporEksporKesesuaian (titipan portal), lengkapi dengan ekstrakLab
      const ekstrak = (item.baris || item.lab_rme) ? ekstrakLab(item.baris, item.lab_rme) : null;
      if (ekstrak) {
        if ((!fktp || fktp === 'Klinik Griya Medica') && ekstrak.fktp) fktp = ekstrak.fktp;
        if (!item.tensi && ekstrak.tensi) tensi = ekstrak.tensi;
        if (!tb && ekstrak.tb) tb = ekstrak.tb;
        if (!bb && ekstrak.bb) bb = ekstrak.bb;
        if (!lp && ekstrak.lp) lp = ekstrak.lp;
        if ((!rr || rr === '20') && ekstrak.rr) rr = ekstrak.rr;
        if ((!hr || hr === '80') && ekstrak.hr) hr = ekstrak.hr;
        for (const k of ['cho', 'tg', 'hdl', 'ldl', 'ur', 'cre', 'mau', 'hba1c', 'gdp', 'gdpp', 'gds']) {
          if (!lab[k] && ekstrak[k]) lab[k] = ekstrak[k];
        }
      }

      const diagInfo = tentukanKeluhanDiagnosa(item.diagnosa_icd || item.diagnosis_teks, lab);
      const nonKapitasi = hitungPelayananNonKapitasi(lab);

      let jamKunj = '08:00';
      if (item.waktu_daftar) {
        try {
          const jd = new Date(item.waktu_daftar);
          if (!isNaN(jd.getTime())) {
            jamKunj = String(jd.getHours()).padStart(2, '0') + ':' + String(jd.getMinutes()).padStart(2, '0');
          }
        } catch (_) {}
      }

      // Hitung harga pemeriksaan sesuai tarif paket atau per tes:
      // Kimia Darah paket (CHO, TG, HDL, LDL, UR, CRE, MAU) = Rp380.000
      // HbA1c = Rp160.000
      // Gula Darah (GDP / GDPP / GDS) = Rp20.000 per tes
      let hargaPemeriksaan = '';
      if (item.total_biaya) {
        hargaPemeriksaan = `Rp${Number(item.total_biaya).toLocaleString('id-ID')}`;
      } else {
        let totalTarif = 0;
        const hasKimia = !!(lab.cho || lab.tg || lab.hdl || lab.ldl || lab.ur || lab.cre || lab.mau);
        const hasHba1c = !!lab.hba1c;
        const countGula = (lab.gdp ? 1 : 0) + (lab.gdpp ? 1 : 0) + (lab.gds ? 1 : 0);
        if (hasKimia) totalTarif += 380000;
        if (hasHba1c) totalTarif += 160000;
        if (countGula > 0) totalTarif += (countGula * 20000);
        if (totalTarif > 0) hargaPemeriksaan = `Rp${totalTarif.toLocaleString('id-ID')}`;
      }

      const barisCol = [
        String(noUrut++),                             // 0: NO
        tglFormatted,                                 // 1: TGL PLY
        '',                                           // 2: TGL ENTRI (selalu dikosongkan untuk diisi manual)
        noBpjs,                                       // 3: NO BPJS
        namaPeserta,                                  // 4: NAMA PESERTA
        alamat,                                       // 5: ALAMAT
        fktp,                                         // 6: FKTP
        tensi,                                        // 7: TENSI
        tb,                                           // 8: TB
        bb,                                           // 9: BB
        lp,                                           // 10: LP
        rr,                                           // 11: RR
        hr,                                           // 12: HR
        lab.cho,                                      // 13: CHO
        lab.tg,                                       // 14: TG
        lab.hdl,                                      // 15: HDL
        lab.ldl,                                      // 16: LDL
        lab.ur,                                       // 17: UR
        lab.cre,                                      // 18: CRE
        lab.mau,                                      // 19: MAU
        lab.hba1c,                                    // 20: HBA1C
        lab.gdp,                                      // 21: GDP
        lab.gdpp,                                     // 22: GDPP
        lab.gds,                                      // 23: GDS
        hargaPemeriksaan,                             // 24: Harga Pemeriksaan
        'TRUE',                                       // 25: Kolom Z (selalu TRUE)
        'Baru',                                       // 26: PENDAFTARAN (selalu Baru)
        'Promotif Preventif',                         // 27: PERAWATAN (selalu Promotif Preventif)
        item.keluhan || diagInfo.keluhan,             // 28: KELUHAN
        '07:00',                                      // 29: JAM KUNJUNGAN (selalu 07:00)
        item.anamnesa || diagInfo.anamnesa,           // 30: ANAMNESA
        'TIDAK',                                      // 31: MAKANAN (selalu TIDAK)
        'TIDAK',                                      // 32: UDARA (selalu TIDAK)
        'TIDAK',                                      // 33: OBAT (selalu TIDAK)
        'TIDAK',                                      // 34: TERAPI OBAT (selalu TIDAK)
        'TIDAK',                                      // 35: TERAPI NON OBAT (selalu TIDAK)
        'TIDAK',                                      // 36: BMHP (selalu TIDAK)
        diagInfo.diagnosa,                            // 37: DIAGNOSA
        '36,0',                                       // 38: SUHU (selalu 36,0)
        'DEDE KURNIASIH',                             // 39: TENAGA MEDIS (selalu DEDE KURNIASIH)
        nonKapitasi,                                  // 40: PELAYANAN NON KAPITASI
        'BEROBAT JALAN'                               // 41: STATUS PULANG (selalu BEROBAT JALAN)
      ];

      barisColList.push(barisCol);
    }

    return { barisColList, opsi: { tglMulai, tglSelesai, labelPeriode: opsi?.labelPeriode } };
  }

  function bukaModalEkspor(w, aksiAwal = 'spreadsheet') {
    const hariIni = UI.hariIni ? UI.hariIni() : new Date().toISOString().slice(0, 10);
    const bulanIni = hariIni.slice(0, 7);

    const isiHtml = `
      <div class="field mb-16">
        <label class="font-bold mb-8 block">Pilih Penyaringan Periode Pelayanan:</label>
        <div class="flex gap-16 items-center mb-12">
          <label class="flex items-center gap-6 cursor-pointer">
            <input type="radio" name="optPeriode" value="bulan" checked>
            <span><b>Berdasarkan Bulan</b></span>
          </label>
          <label class="flex items-center gap-6 cursor-pointer">
            <input type="radio" name="optPeriode" value="hari">
            <span><b>Pilih Hari / Rentang Tanggal</b></span>
          </label>
        </div>

        <div id="kotakBulan" class="mt-8 p-12 bg-subtle rounded">
          <label class="text-sm font-semibold mb-4 block">Pilih Bulan & Tahun:</label>
          <input type="month" id="inBulan" class="input" value="${bulanIni}">
        </div>

        <div id="kotakHari" class="mt-8 p-12 bg-subtle rounded" style="display:none;">
          <div class="form-row">
            <div class="field">
              <label class="text-sm font-semibold mb-4 block">Dari Tanggal:</label>
              <input type="date" id="inTglMulai" class="input" value="${hariIni}">
            </div>
            <div class="field">
              <label class="text-sm font-semibold mb-4 block">Sampai Tanggal:</label>
              <input type="date" id="inTglSelesai" class="input" value="${hariIni}">
            </div>
          </div>
          <p class="text-muted text-xs mt-4">Pilih tanggal yang sama jika hanya ingin mengekspor data 1 hari.</p>
        </div>
      </div>

      <div class="field mb-16">
        <label class="font-bold mb-4 block">Saring Peserta / Cara Bayar:</label>
        <select id="inCaraBayar" class="input">
          <option value="SEMUA">Semua Pasien (BPJS & Umum)</option>
          <option value="BPJS" selected>Hanya Pasien BPJS</option>
        </select>
      </div>

      <div class="banner info mt-12 mb-8">
        ${UI.ikon('info')}
        <div class="text-xs">Data ditarik langsung dari kunjungan dokter, tanda vital, dan hasil pemeriksaan laboratorium yang sudah selesai di database RME.</div>
      </div>
    `;

    UI.modal({
      judul: 'Ekspor Data Pelayanan Prolanis',
      isi: isiHtml,
      tombol: [
        { teks: 'Batal', nilai: null },
        {
          html: `${UI.ikon('unduh', 14)} Ekspor Spreadsheet (Excel)`,
          kelas: 'btn-secondary',
          aksi: async (modalEl) => {
            const param = ambilParamPeriode(modalEl);
            if (!param) return false;
            await eksporKesesuaian(w, param);
            return true;
          }
        },
        {
          html: `${UI.ikon('cetak', 14)} Cetak / Simpan PDF`,
          kelas: 'btn-primary',
          aksi: async (modalEl) => {
            const param = ambilParamPeriode(modalEl);
            if (!param) return false;
            await cetakPdfKesesuaian(w, param);
            return true;
          }
        }
      ]
    });

    setTimeout(() => {
      const radios = document.querySelectorAll('input[name="optPeriode"]');
      const kkBulan = document.getElementById('kotakBulan');
      const kkHari = document.getElementById('kotakHari');
      radios.forEach(r => {
        r.addEventListener('change', (e) => {
          if (e.target.value === 'bulan') {
            if (kkBulan) kkBulan.style.display = 'block';
            if (kkHari) kkHari.style.display = 'none';
          } else {
            if (kkBulan) kkBulan.style.display = 'none';
            if (kkHari) kkHari.style.display = 'block';
          }
        });
      });
    }, 50);
  }

  function ambilParamPeriode(modalEl) {
    const isBulan = modalEl.querySelector('input[name="optPeriode"]:checked')?.value === 'bulan';
    const caraBayar = modalEl.querySelector('#inCaraBayar')?.value || 'SEMUA';
    let tglMulai = '', tglSelesai = '', labelPeriode = '';

    if (isBulan) {
      const blnVal = modalEl.querySelector('#inBulan')?.value;
      if (!blnVal) {
        UI.toast('Silakan pilih bulan.', 'warn');
        return null;
      }
      const [thnStr, blnStr] = blnVal.split('-');
      const y = parseInt(thnStr, 10);
      const m = parseInt(blnStr, 10);
      const akhir = new Date(y, m, 0).getDate();
      tglMulai = `${y}-${String(m).padStart(2, '0')}-01`;
      tglSelesai = `${y}-${String(m).padStart(2, '0')}-${String(akhir).padStart(2, '0')}`;
      labelPeriode = `Bulan ${BULAN_ID[m - 1]} ${y}`;
    } else {
      tglMulai = modalEl.querySelector('#inTglMulai')?.value;
      tglSelesai = modalEl.querySelector('#inTglSelesai')?.value;
      if (!tglMulai || !tglSelesai) {
        UI.toast('Silakan tentukan tanggal mulai dan selesai.', 'warn');
        return null;
      }
      if (tglMulai > tglSelesai) {
        UI.toast('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.', 'warn');
        return null;
      }
      labelPeriode = tglMulai === tglSelesai 
        ? formatTglSpreadsheet(tglMulai)
        : `${formatTglSpreadsheet(tglMulai)} s/d ${formatTglSpreadsheet(tglSelesai)}`;
    }

    return { tglMulai, tglSelesai, caraBayar, labelPeriode };
  }

  async function eksporKesesuaian(w, opsiPeriode) {
    try {
      const hasil = await kumpulkanDataKesesuaian(opsiPeriode);
      if (!hasil || !hasil.barisColList.length) return;

      const { barisColList, opsi } = hasil;
      const labelRentang = opsi.labelPeriode || `${opsi.tglMulai} s/d ${opsi.tglSelesai}`;

      const headerBaris2 = `(TGL ${labelRentang.toUpperCase()}),,,,,,skrining dm,,,,,,,,GLUKOSA BELUM FIX,,,,,,,,,,,,,,,,,,,,,,,,,,,`;

      const barisTeks = [
        TEMPLAT_HEADER_1,
        headerBaris2,
        TEMPLAT_HEADER_3,
        TEMPLAT_HEADER_4,
        TEMPLAT_HEADER_5,
        TEMPLAT_HEADER_6,
        TEMPLAT_KOLOM_1,
        TEMPLAT_KOLOM_2
      ];

      for (const row of barisColList) {
        barisTeks.push(row.map(csvSel).join(','));
      }

      const hasilCsv = barisTeks.join('\r\n');
      const namaBasis = `pelayanan_prolanis_${opsi.tglMulai}_sd_${opsi.tglSelesai}`;

      // Coba ekspor berkas asli .xlsx jika SheetJS / xlsx-js-style tersedia
      let berhasilXlsx = false;
      try {
        await muatSheetJS();
        if (typeof XLSX !== 'undefined') {
          const aoa = [
            csvPecahBaris(TEMPLAT_HEADER_1),
            csvPecahBaris(headerBaris2),
            csvPecahBaris(TEMPLAT_HEADER_3),
            csvPecahBaris(TEMPLAT_HEADER_4),
            csvPecahBaris(TEMPLAT_HEADER_5),
            csvPecahBaris(TEMPLAT_HEADER_6),
            csvPecahBaris(TEMPLAT_KOLOM_1),
            csvPecahBaris(TEMPLAT_KOLOM_2),
            ...barisColList
          ];

          const ws = XLSX.utils.aoa_to_sheet(aoa);

          // 1. PENGGABUNGAN SEL (MERGES) PERSIS GOOGLE SPREADSHEET
          const merges = [
            // Header Informasi Atas
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },   // A1:E1 "DATA INPUTAN PELAYANAN PROLANIS"
            { s: { r: 0, c: 19 }, e: { r: 0, c: 28 } }, // T1:AC1 "Pasien hadir ke Faskes..."
            { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },   // A2:E2 "(TGL ...)"
            { s: { r: 1, c: 8 }, e: { r: 1, c: 17 } },  // I2:R2 "GLUKOSA BELUM FIX"
            { s: { r: 2, c: 8 }, e: { r: 2, c: 17 } },  // I3:R3 "( KUTAWIS, KEJOBONG, PMI, BUKATEJA PENYESUAIAN )"
            { s: { r: 3, c: 8 }, e: { r: 3, c: 17 } },  // I4:R4 "( TANDA UNTUK YANG KLAIM GDS)"
            
            // Penggabungan Horizontal Header Kolom (Baris ke-7 / index r: 6)
            { s: { r: 6, c: 13 }, e: { r: 6, c: 19 } }, // N7:T7 "PELAYANAN KIMIA DARAH" (7 kolom: CHO..MAU)
            { s: { r: 6, c: 21 }, e: { r: 6, c: 23 } }, // V7:X7 "PELAYANAN GULA DARAH" (3 kolom: GDP..GDS)
            { s: { r: 6, c: 31 }, e: { r: 6, c: 33 } }  // AF7:AH7 "RIWAYAT ALERGI" (3 kolom: MAKANAN..OBAT)
          ];

          // Penggabungan Vertikal (Baris 7 ke 8 / index r: 6 ke r: 7) untuk kolom-kolom tunggal
          const singleCols = [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, // NO s/d HR
            20,                                        // HBA1C
            24, 25, 26, 27, 28, 29, 30,                // Harga Pemeriksaan s/d ANAMNESA
            34, 35, 36, 37, 38, 39, 40, 41             // TERAPI OBAT s/d STATUS PULANG
          ];
          for (const cIdx of singleCols) {
            merges.push({ s: { r: 6, c: cIdx }, e: { r: 7, c: cIdx } });
          }
          ws['!merges'] = merges;

          // 2. PENGATURAN LEBAR KOLOM (COLS)
          ws['!cols'] = [
            { wch: 5 },   // 0: NO
            { wch: 16 },  // 1: TGL PLY
            { wch: 14 },  // 2: TGL ENTRI
            { wch: 16 },  // 3: NO BPJS
            { wch: 22 },  // 4: NAMA PESERTA
            { wch: 26 },  // 5: ALAMAT
            { wch: 22 },  // 6: FKTP
            { wch: 10 },  // 7: TENSI
            { wch: 6 },   // 8: TB
            { wch: 6 },   // 9: BB
            { wch: 6 },   // 10: LP
            { wch: 6 },   // 11: RR
            { wch: 6 },   // 12: HR
            { wch: 8 },   // 13: CHO
            { wch: 8 },   // 14: TG
            { wch: 8 },   // 15: HDL
            { wch: 8 },   // 16: LDL
            { wch: 8 },   // 17: UR
            { wch: 8 },   // 18: CRE
            { wch: 8 },   // 19: MAU
            { wch: 9 },   // 20: HBA1C
            { wch: 8 },   // 21: GDP
            { wch: 8 },   // 22: GDPP
            { wch: 8 },   // 23: GDS
            { wch: 15 },  // 24: Harga Pemeriksaan
            { wch: 8 },   // 25: Kolom Z
            { wch: 12 },  // 26: PENDAFTARAN
            { wch: 18 },  // 27: PERAWATAN
            { wch: 18 },  // 28: KELUHAN
            { wch: 14 },  // 29: JAM KUNJUNGAN
            { wch: 18 },  // 30: ANAMNESA
            { wch: 10 },  // 31: MAKANAN
            { wch: 10 },  // 32: UDARA
            { wch: 10 },  // 33: OBAT
            { wch: 12 },  // 34: TERAPI OBAT
            { wch: 14 },  // 35: TERAPI NON OBAT
            { wch: 10 },  // 36: BMHP
            { wch: 10 },  // 37: DIAGNOSA
            { wch: 8 },   // 38: SUHU
            { wch: 18 },  // 39: TENAGA MEDIS
            { wch: 25 },  // 40: PELAYANAN NON KAPITASI
            { wch: 16 }   // 41: STATUS PULANG
          ];

          // 3. GARIS BATAS KOTAK SOLID (THIN BORDER) DI SEMUA SEL
          const borderKotak = {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          };

          // Format Header Kolom Baris 7 & 8 (Warna Putih Bersih dengan Garis Kotak Solid)
          const styleHeaderKolom = {
            fill: { fgColor: { rgb: 'FFFFFF' } },
            font: { bold: true, sz: 9, name: 'Calibri', color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: borderKotak
          };

          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AP8');

          for (let R = 6; R <= 7; ++R) {
            for (let C = 0; C <= 41; ++C) {
              const addr = XLSX.utils.encode_cell({ r: R, c: C });
              if (!ws[addr]) ws[addr] = { t: 's', v: '' };
              ws[addr].s = styleHeaderKolom;
            }
          }

          // Format Kotak Informasi Legend (Baris 1 s/d 5)
          // H2 (HIPERTENSI) -> Salmon #F4CCCC
          const h2Addr = XLSX.utils.encode_cell({ r: 1, c: 7 });
          if (ws[h2Addr]) {
            ws[h2Addr].s = {
              fill: { fgColor: { rgb: 'F4CCCC' } },
              font: { bold: true, sz: 9, name: 'Calibri' },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderKotak
            };
          }
          // I2..R2 (GLUKOSA BELUM FIX) -> Cyan #00FFFF
          for (let c = 8; c <= 17; c++) {
            const addr = XLSX.utils.encode_cell({ r: 1, c });
            if (!ws[addr]) ws[addr] = { t: 's', v: '' };
            ws[addr].s = {
              fill: { fgColor: { rgb: '00FFFF' } },
              font: { bold: true, sz: 9, name: 'Calibri' },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderKotak
            };
          }
          // H3 (skrining dm)
          const h3Addr = XLSX.utils.encode_cell({ r: 2, c: 7 });
          if (ws[h3Addr]) {
            ws[h3Addr].s = {
              font: { sz: 9, name: 'Calibri' },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderKotak
            };
          }
          // I3..R3 (KUTAWIS, KEJOBONG...) -> Cyan #00FFFF
          for (let c = 8; c <= 17; c++) {
            const addr = XLSX.utils.encode_cell({ r: 2, c });
            if (!ws[addr]) ws[addr] = { t: 's', v: '' };
            ws[addr].s = {
              fill: { fgColor: { rgb: '00FFFF' } },
              font: { sz: 8, name: 'Calibri' },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderKotak
            };
          }
          // H4 (DIABETES MELITUS)
          const h4Addr = XLSX.utils.encode_cell({ r: 3, c: 7 });
          if (ws[h4Addr]) {
            ws[h4Addr].s = {
              font: { sz: 9, name: 'Calibri' },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderKotak
            };
          }
          // I4..R4 (TANDA UNTUK YANG KLAIM GDS) -> Salmon #F4CCCC
          for (let c = 8; c <= 17; c++) {
            const addr = XLSX.utils.encode_cell({ r: 3, c });
            if (!ws[addr]) ws[addr] = { t: 's', v: '' };
            ws[addr].s = {
              fill: { fgColor: { rgb: 'F4CCCC' } },
              font: { bold: true, sz: 8, name: 'Calibri' },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderKotak
            };
          }

          // Judul Utama A1 & Subjudul A2
          if (ws['A1']) {
            ws['A1'].s = {
              font: { bold: true, sz: 11, name: 'Calibri' },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
          if (ws['A2']) {
            ws['A2'].s = {
              font: { bold: true, sz: 10, name: 'Calibri' },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
          if (ws['T1']) {
            ws['T1'].s = {
              font: { bold: true, sz: 8.5, name: 'Calibri', color: { rgb: '333333' } },
              alignment: { vertical: 'center' }
            };
          }

          // 4. BERI BORDER KOTAK SOLID PADA SEMUA BARIS DATA (Warna Putih Bersih / Polos)
          for (let R = 8; R <= range.e.r; ++R) {
            for (let C = 0; C <= 41; ++C) {
              const addr = XLSX.utils.encode_cell({ r: R, c: C });
              if (!ws[addr]) ws[addr] = { t: 's', v: '' };

              // Kolom NO BPJS (C === 3) wajib string teks agar 0 di depan tidak hilang
              if (C === 3) {
                ws[addr].t = 's';
              }

              const isLeft = (C === 4 || C === 5 || C === 6 || C === 28 || C === 30 || C === 39 || C === 40);
              const isRight = (C === 24);

              ws[addr].s = {
                fill: { fgColor: { rgb: 'FFFFFF' } }, // Putih bersih polos
                font: { sz: 9, name: 'Calibri', color: { rgb: '000000' } },
                alignment: {
                  horizontal: isRight ? 'right' : (isLeft ? 'left' : 'center'),
                  vertical: 'center'
                },
                border: borderKotak
              };
            }
          }

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Pelayanan Prolanis');
          XLSX.writeFile(wb, `${namaBasis}.xlsx`);
          berhasilXlsx = true;
        }
      } catch (errXlsx) {
        console.warn('SheetJS error, menggunakan unduhan CSV:', errXlsx);
      }

      if (!berhasilXlsx) {
        unduhTeks(`${namaBasis}.csv`, hasilCsv);
      }

      UI.toast(`Berhasil mengekspor ${barisColList.length} baris data pelayanan Prolanis (${labelRentang}).`, 'ok', 5000);
    } catch (e) {
      UI.toast('Gagal mengekspor data: ' + (e.message || e), 'err', 6000);
    }
  }

  async function cetakPdfKesesuaian(w, opsiPeriode) {
    try {
      const hasil = await kumpulkanDataKesesuaian(opsiPeriode);
      if (!hasil || !hasil.barisColList.length) return;

      const { barisColList: dataRows, opsi } = hasil;
      const labelRentang = opsi.labelPeriode || `${opsi.tglMulai} s/d ${opsi.tglSelesai}`;

      const wnd = window.open('', '_blank');
      if (!wnd) {
        UI.toast('Pop-up terblokir oleh browser. Izinkan pop-up untuk mencetak PDF.', 'warn', 5000);
        return;
      }

      const tglSekarang = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Data Inputan Pelayanan Prolanis</title>
  <style>
    @page { size: A4 landscape; margin: 4mm 3mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 6.5px;
      color: #000;
      margin: 0;
      padding: 6px;
    }
    .toolbar {
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #cbd5e1;
    }
    .toolbar button {
      background: #0f766e;
      color: #fff;
      border: none;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
    }
    .toolbar button:hover { background: #115e59; }
    .legend-grid {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
    }
    .title-col { text-align: left; }
    .main-title { font-size: 13px; font-weight: bold; letter-spacing: 0.5px; }
    .sub-title { font-size: 9px; font-weight: bold; color: #222; margin-top: 2px; }
    .box-col { display: flex; flex-direction: column; gap: 2px; }
    .box-row { display: flex; gap: 4px; align-items: stretch; }
    .cell-box {
      border: 1px solid #000;
      padding: 1.5px 6px;
      font-size: 7px;
      text-align: center;
      background: #fff;
      white-space: nowrap;
    }
    .bg-salmon { background: #f4cccc !important; font-weight: bold; }
    .bg-cyan { background: #00ffff !important; font-weight: bold; }
    .note-col { text-align: right; font-size: 7.5px; color: #222; max-width: 320px; }
    .table-container {
      width: 100%;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
      font-size: 6px;
    }
    th, td {
      border: 1px solid #000000;
      padding: 2px 2px;
      line-height: 1.15;
    }
    th {
      background: #ffffff;
      color: #000000;
      font-weight: bold;
      text-align: center;
      vertical-align: middle;
      font-size: 6.5px;
    }
    th.group-header {
      background: #ffffff;
      font-size: 6.5px;
    }
    tbody tr td {
      background: #ffffff;
      color: #000000;
      vertical-align: middle;
    }
    tbody tr:nth-child(even) td {
      background: #ffffff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .mono { font-family: monospace; }
    .nowrap { white-space: nowrap; }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <span><b>Pratinjau Cetak / PDF</b> (${dataRows.length} baris data · ${labelRentang})</span>
    <div>
      <button onclick="window.print()">Simpan sebagai PDF / Cetak</button>
      <button onclick="window.close()" style="background:#64748b; margin-left:6px;">Tutup</button>
    </div>
  </div>

  <div class="legend-grid">
    <div class="title-col">
      <div class="main-title">DATA INPUTAN PELAYANAN PROLANIS</div>
      <div class="sub-title">(TGL ${labelRentang.toUpperCase()})</div>
    </div>
    <div class="box-col">
      <div class="box-row">
        <span class="cell-box bg-salmon">HIPERTENSI</span>
        <span class="cell-box bg-cyan" style="flex:1;">GLUKOSA BELUM FIX</span>
      </div>
      <div class="box-row">
        <span class="cell-box">skrining dm</span>
        <span class="cell-box bg-cyan" style="flex:1;">( KUTAWIS, KEJOBONG, PMI, BUKATEJA PENYESUAIAN )</span>
      </div>
      <div class="box-row">
        <span class="cell-box">DIABETES MELITUS</span>
        <span class="cell-box bg-salmon" style="flex:1;">( TANDA UNTUK YANG KLAIM GDS)</span>
      </div>
    </div>
    <div class="note-col">
      <b>Pasien hadir ke Faskes dalam kondisi tidak puasa dengan indikasi Hiperglikemi/Hipoglikemi</b>
      <div style="margin-top: 3px; font-size: 7px; color: #444;">
        <b>KET :</b> TGL ENTRI : TANGGAL INPUT DI PCARE
      </div>
      <div style="margin-top: 2px; font-size: 7px; color: #666;">
        Laboratorium Medis Utama &bull; Dicetak: ${tglSekarang}
      </div>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th rowspan="2">NO</th>
          <th rowspan="2">TGL PLY</th>
          <th rowspan="2">TGL ENTRI</th>
          <th rowspan="2">NO BPJS</th>
          <th rowspan="2">NAMA PESERTA</th>
          <th rowspan="2">ALAMAT</th>
          <th rowspan="2">FKTP</th>
          <th rowspan="2">TENSI</th>
          <th rowspan="2">TB</th>
          <th rowspan="2">BB</th>
          <th rowspan="2">LP</th>
          <th rowspan="2">RR</th>
          <th rowspan="2">HR</th>
          <th colspan="7" class="group-header">PELAYANAN KIMIA DARAH</th>
          <th rowspan="2">HBA1C</th>
          <th colspan="3" class="group-header">PELAYANAN GULA DARAH</th>
          <th rowspan="2">Harga Pemeriksaan</th>
          <th rowspan="2">Z</th>
          <th rowspan="2">PENDAFTARAN</th>
          <th rowspan="2">PERAWATAN</th>
          <th rowspan="2">KELUHAN</th>
          <th rowspan="2">JAM KUNJUNGAN</th>
          <th rowspan="2">ANAMNESA</th>
          <th colspan="3" class="group-header">RIWAYAT ALERGI</th>
          <th rowspan="2">TERAPI OBAT</th>
          <th rowspan="2">TERAPI NON OBAT</th>
          <th rowspan="2">BMHP</th>
          <th rowspan="2">DIAGNOSA</th>
          <th rowspan="2">SUHU</th>
          <th rowspan="2">TENAGA MEDIS</th>
          <th rowspan="2">PELAYANAN NON KAPITASI</th>
          <th rowspan="2">STATUS PULANG</th>
        </tr>
        <tr>
          <th>CHO</th>
          <th>TG</th>
          <th>HDL</th>
          <th>LDL</th>
          <th>UR</th>
          <th>CRE</th>
          <th>MAU</th>
          <th>GDP</th>
          <th>GDPP</th>
          <th>GDS</th>
          <th>MAKANAN</th>
          <th>UDARA</th>
          <th>OBAT</th>
        </tr>
      </thead>
      <tbody>
        ${dataRows.map(b => `
          <tr>
            <td class="text-center">${b[0]}</td>
            <td class="nowrap">${b[1]}</td>
            <td class="text-center">${b[2]}</td>
            <td class="mono nowrap">${b[3]}</td>
            <td><b>${b[4]}</b></td>
            <td>${b[5]}</td>
            <td>${b[6]}</td>
            <td class="text-center nowrap">${b[7]}</td>
            <td class="text-center">${b[8]}</td>
            <td class="text-center">${b[9]}</td>
            <td class="text-center">${b[10]}</td>
            <td class="text-center">${b[11]}</td>
            <td class="text-center">${b[12]}</td>
            <td class="text-center">${b[13]}</td>
            <td class="text-center">${b[14]}</td>
            <td class="text-center">${b[15]}</td>
            <td class="text-center">${b[16]}</td>
            <td class="text-center">${b[17]}</td>
            <td class="text-center">${b[18]}</td>
            <td class="text-center">${b[19]}</td>
            <td class="text-center"><b>${b[20]}</b></td>
            <td class="text-center">${b[21]}</td>
            <td class="text-center">${b[22]}</td>
            <td class="text-center">${b[23]}</td>
            <td class="text-right nowrap">${b[24] || '—'}</td>
            <td class="text-center">${b[25]}</td>
            <td class="text-center">${b[26]}</td>
            <td class="text-center">${b[27]}</td>
            <td>${b[28]}</td>
            <td class="text-center">${b[29]}</td>
            <td>${b[30]}</td>
            <td class="text-center">${b[31]}</td>
            <td class="text-center">${b[32]}</td>
            <td class="text-center">${b[33]}</td>
            <td class="text-center">${b[34]}</td>
            <td class="text-center">${b[35]}</td>
            <td class="text-center">${b[36]}</td>
            <td class="text-center mono">${b[37]}</td>
            <td class="text-center">${b[38]}</td>
            <td class="nowrap">${b[39]}</td>
            <td class="nowrap">${b[40]}</td>
            <td class="text-center nowrap">${b[41]}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

      wnd.document.open();
      wnd.document.write(html);
      wnd.document.close();
    } catch (e) {
      UI.toast('Gagal mencetak PDF: ' + (e.message || e), 'err', 6000);
    }
  }

  const KEPALA_TEMPLAT = ['nama', 'nik', 'no_bpjs', 'tanggal_lahir', 'jenis_kelamin', 'alamat'];

  async function unduhTemplat(w, dariTitipan) {
    let baris = [];
    if (dariTitipan) {
      const daftarTitipan = await DB.kronisImporDaftar('MENUNGGU', '', 9999);
      baris = daftarTitipan.map(d => [d.nama_pasien || '', '', d.no_bpjs || '', '', '', '']);
      if (!baris.length) {
        UI.toast('Tabel titipan masih kosong — templat diunduh tanpa baris.', 'warn', 5000);
      }
    }
    const teks = [KEPALA_TEMPLAT.join(',')]
      .concat(baris.map(r => r.map(csvSel).join(','))).join('\r\n');
    unduhTeks(dariTitipan ? 'templat-pra-daftar-dari-titipan.csv' : 'templat-pra-daftar-kosong.csv', teks);
  }

  function tabPraDaftar(w) {
    w.innerHTML = `
      <div class="banner info mb-16">
        <div>Dipakai HANYA kalau RME belum punya satu pun pasien terdaftar dan
          portal punya banyak orang sekaligus. Kalau pasiennya sedikit, daftarkan
          satu per satu lewat <b>Pendaftaran</b> seperti biasa — di situ Anda bisa
          langsung menanyakan data yang meragukan ke pasiennya.</div>
      </div>

      <div class="card">
        <div class="card-head"><h3>1. Unduh templat</h3></div>
        <div class="card-body text-muted">
          <p class="mt-0">Kolom <b>nama</b> dan <b>no_bpjs</b> diisi otomatis dari orang
            yang masih menunggu di tab <b>1. Unggah Berkas</b> / <b>2. Cocokkan Pasien</b>
            (kalau sudah pernah diunggah). Kolom <b>tanggal_lahir</b> dan
            <b>jenis_kelamin</b> WAJIB diisi manual dari kartu BPJS/KTP/catatan kertas —
            RME tidak bisa menerbitkan nomor rekam medis tanpa keduanya.</p>
        </div>
        <div class="card-foot">
          <button class="btn btn-primary" id="btnTemplatTitipan">
            ${UI.ikon('unduh')} Unduh templat dari titipan</button>
          <button class="btn btn-ghost" id="btnTemplatKosong">Unduh templat kosong</button>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-head"><h3>2. Isi tanggal lahir &amp; jenis kelamin, lalu unggah lagi</h3></div>
        <div class="card-body">
          <p class="text-muted mt-0">Jenis kelamin: <code>L</code> atau <code>P</code>.
            Tanggal lahir: <code>YYYY-MM-DD</code> atau <code>DD/MM/YYYY</code>. Kolom NIK
            boleh dikosongkan.</p>
          <input type="file" id="berkasPra" class="w-full" accept=".csv,text/csv">
          <div id="pratinjauPra" class="mt-14"></div>
        </div>
        <div class="card-foot" id="kakiPra"></div>
      </div>`;

    w.querySelector('#btnTemplatTitipan').addEventListener('click', () => unduhTemplat(w, true));
    w.querySelector('#btnTemplatKosong').addEventListener('click', () => unduhTemplat(w, false));
    w.querySelector('#berkasPra').addEventListener('change', (e) => bacaBerkasPra(w, e.target.files));

    praBerkas = null; praSudahDiperiksa = false;
    gambarPratinjauPra(w);
  }

  function bacaBerkasPra(w, files) {
    const f = (files || [])[0];
    praBerkas = null; praSudahDiperiksa = false;
    if (!f) { gambarPratinjauPra(w); return; }
    const fr = new FileReader();
    fr.onload = () => {
      try {
        praBerkas = PraDaftarCore.bacaBerkas(String(fr.result || ''));
      } catch (e) {
        UI.toast(e.message || e, 'err', 6000);
        praBerkas = { baris: [], dikenal: new Set(), kolomAsing: [] };
      }
      gambarPratinjauPra(w);
    };
    fr.onerror = () => {
      UI.toast('Berkas tidak terbaca.', 'err');
      praBerkas = { baris: [], dikenal: new Set(), kolomAsing: [] };
      gambarPratinjauPra(w);
    };
    fr.readAsText(f);
  }

  function gambarPratinjauPra(w) {
    const wadah = w.querySelector('#pratinjauPra');
    const kaki = w.querySelector('#kakiPra');
    if (!praBerkas || !praBerkas.baris.length) {
      wadah.innerHTML = `<div class="text-muted">Belum ada berkas dipilih.</div>`;
      kaki.innerHTML = '';
      return;
    }

    const r = PraDaftarCore.ringkas(praBerkas.baris);
    const siapDikirim = praBerkas.baris.filter(b =>
      b.siap && !(b.mirip && b.mirip.length && !b.paksa));
    const perluTinjau = praBerkas.baris.filter(b => b.siap && b.mirip && b.mirip.length && !b.paksa);

    wadah.innerHTML = `
      ${praBerkas.kolomAsing.length ? `<div class="banner warn mb-12">${UI.ikon('peringatan')}
        <div>Kolom tidak dikenal, dilewati: ${praBerkas.kolomAsing.map(UI.esc).join(', ')}</div></div>` : ''}
      <div class="grid grid-4 mb-12">
        <div class="card stat"><div class="lbl">Baris terbaca</div><div class="val tabular">${r.total}</div></div>
        <div class="card stat"><div class="lbl">Siap didaftarkan</div><div class="val tabular">${r.siap}</div></div>
        <div class="card stat"><div class="lbl">Tidak lengkap</div><div class="val tabular">${r.tidakLengkap}</div></div>
        <div class="card stat"><div class="lbl">Perlu ditinjau</div>
          <div class="val tabular">${perluTinjau.length}</div></div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Baris</th><th>Nama</th><th>Lahir</th><th>JK</th><th>NIK</th>
          <th>No. BPJS</th><th>Status</th></tr></thead>
        <tbody>${praBerkas.baris.map((b, i) => `
          <tr>
            <td class="mono text-muted">${b.baris}</td>
            <td>${UI.esc(b.nama || '—')}</td>
            <td class="mono">${b.tanggal_lahir ? UI.esc(b.tanggal_lahir) : '—'}</td>
            <td>${b.jenis_kelamin ? UI.esc(b.jenis_kelamin) : '—'}</td>
            <td class="mono">${b.nik ? UI.esc(b.nik) : '—'}</td>
            <td class="mono">${b.no_bpjs ? UI.esc(b.no_bpjs) : '—'}</td>
            <td>${statusBarisPra(b, i)}</td>
          </tr>`).join('')}
        </tbody></table></div>`;

    wadah.querySelectorAll('[data-paksa]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        praBerkas.baris[Number(e.target.dataset.paksa)].paksa = e.target.checked;
        gambarPratinjauPra(w);
      });
    });

    kaki.innerHTML = `
      ${!praSudahDiperiksa ? `<button class="btn btn-secondary" id="btnCekMirip">
          Periksa kemiripan dengan pasien yang sudah ada</button>` : ''}
      <button class="btn btn-primary" id="btnDaftarkanMassal" ${siapDikirim.length ? '' : 'disabled'}>
        ${UI.ikon('unduh')} Daftarkan ${siapDikirim.length} pasien</button>`;
    if (!praSudahDiperiksa) {
      kaki.querySelector('#btnCekMirip').addEventListener('click', () => cekKemiripanPra(w));
    }
    kaki.querySelector('#btnDaftarkanMassal').addEventListener('click', () => kirimPraDaftar(w));
  }

  function statusBarisPra(b, i) {
    if (!b.siap) return `<span class="badge b-danger" title="${UI.esc(b.wajib.join(' '))}">Tidak lengkap</span>`;
    if (b.mirip && b.mirip.length) {
      const top = b.mirip[0];
      const lencana = `<span class="badge b-warn">Mirip: ${UI.esc(top.nama)} (${UI.esc(top.no_rm)})</span>`;
      if (b.paksa) return lencana + ` <span class="badge b-ok ml-4">Tetap didaftarkan</span>`;
      return lencana + `<label class="ml-6 text-sm"><input type="checkbox" data-paksa="${i}">
        Tetap daftarkan, ini orang berbeda</label>`;
    }
    if (b.peringatan && b.peringatan.length) {
      return `<span class="badge b-info" title="${UI.esc(b.peringatan.join(' '))}">Siap (ada catatan)</span>`;
    }
    return `<span class="badge b-ok">Siap</span>`;
  }

  async function cekKemiripanPra(w) {
    if (praMemeriksa) return;
    if (typeof DB.pasienCariMirip !== 'function') {
      UI.toast('Pra-daftar Pasien belum didukung di mode demo — coba di aplikasi sungguhan.', 'warn', 6000);
      return;
    }
    praMemeriksa = true;
    const btn = w.querySelector('#btnCekMirip');
    const target = praBerkas.baris.filter(b => b.siap);
    try {
      for (let i = 0; i < target.length; i++) {
        const b = target[i];
        if (btn) btn.textContent = `Memeriksa ${i + 1}/${target.length}…`;
        try {
          b.mirip = await DB.pasienCariMirip(b.nama, b.nik, b.no_bpjs, 3);
        } catch (e) {
          // Satu baris gagal diperiksa tidak boleh menghentikan sisanya —
          // baris itu tetap tampil, hanya saja tanpa usulan kemiripan.
          b.mirip = [];
        }
      }
      praSudahDiperiksa = true;
    } finally {
      praMemeriksa = false;
      gambarPratinjauPra(w);
    }
  }

  async function kirimPraDaftar(w) {
    const btn = w.querySelector('#btnDaftarkanMassal');
    const siapDikirim = praBerkas.baris.filter(b =>
      b.siap && !(b.mirip && b.mirip.length && !b.paksa));
    if (!siapDikirim.length) return;
    if (typeof DB.pasienBuatMassal !== 'function') {
      UI.toast('Pra-daftar Pasien belum didukung di mode demo — coba di aplikasi sungguhan.', 'warn', 6000);
      return;
    }

    if (!await UI.konfirmasi(`Daftarkan ${siapDikirim.length} pasien baru?`,
      'Setiap baris akan mendapat nomor rekam medis baru — identitas seumur hidup. ' +
      'Baris yang ditandai "Tidak lengkap" atau belum ditinjau kemiripannya tidak ikut ' +
      'dikirim.')) return;

    btn.disabled = true;
    const asli = btn.innerHTML;
    let masuk = 0;
    const gagal = [];
    try {
      for (let i = 0; i < siapDikirim.length; i += UKURAN_KIRIM_PASIEN) {
        const potong = siapDikirim.slice(i, i + UKURAN_KIRIM_PASIEN);
        btn.innerHTML = `Mendaftarkan ${i + potong.length}/${siapDikirim.length}…`;
        const rows = potong.map(b => ({
          nama: b.nama, nik: b.nik, no_bpjs: b.no_bpjs,
          tanggal_lahir: b.tanggal_lahir, jenis_kelamin: b.jenis_kelamin,
          alamat: b.alamat,
          title: b.title, nrp: b.nrp, bagian: b.bagian, plant: b.plant, no_telp: b.no_telp
        }));
        try {
          const hasil = await DB.pasienBuatMassal(rows);
          masuk += hasil.length;
        } catch (e) {
          // NIK unik bisa membentur pasien yang sudah ada di antara waktu
          // pratinjau dan pengiriman (mis. dua staf bekerja bersamaan).
          // Potongan ini dilewati dan dilaporkan, potongan lain tetap jalan.
          gagal.push(`Baris Excel ${potong[0].baris}–${potong[potong.length - 1].baris}: ${e.message || e}`);
        }
      }
      UI.modal({
        judul: 'Pra-daftar selesai',
        isi: `<p><b>${masuk}</b> pasien baru terdaftar dengan nomor rekam medis baru.</p>
              ${gagal.length ? `<p class="text-muted">Gagal: ${gagal.map(UI.esc).join('; ')}</p>` : ''}
              <p class="text-muted mt-12">Lanjutkan ke tab <b>2. Cocokkan Pasien</b> dan
                tekan <b>Tempel otomatis</b> — nomor BPJS yang tadi kosong sekarang sudah
                ada pasangannya.</p>`,
        tombol: [{ teks: 'Tutup', kelas: 'btn-primary' }]
      });
      praBerkas = null; praSudahDiperiksa = false;
      w.querySelector('#berkasPra').value = '';
      gambarPratinjauPra(w);
      await muatRingkas();
    } finally {
      btn.innerHTML = asli;
      btn.disabled = false;
    }
  }

  /* ==================================================================== */
  /*  TAB 1 — UNGGAH                                                      */
  /* ==================================================================== */

  function tabUnggah(w) {
    w.innerHTML = `
      <div class="card">
        <div class="card-head"><h3>Unggah berkas ekspor portal</h3></div>
        <div class="card-body">
          <ol class="text-muted mt-0 mb-14 ml-18 lh-17">
            <li>Buka Supabase project <b>portal sipantau</b> &rarr; SQL Editor.</li>
            <li>Jalankan <code>migrasi/ekspor-portal.sql</code> bagian per bagian,
                dan tekan <b>Download CSV</b> tiap kali selesai.</li>
            <li>Pilih keempat berkas CSV itu di bawah. Urutan tidak penting —
                jenisnya dikenali dari isinya, bukan dari nama berkasnya.</li>
          </ol>
          <input type="file" id="berkasCsv" class="w-full" multiple accept=".csv,text/csv">
          <div id="pratinjauBerkas" class="mt-14"></div>
        </div>
        <div class="card-foot">
          <button class="btn btn-primary" id="btnKirim" disabled>
            ${UI.ikon('unduh')} Masukkan ke tabel titipan</button>
          <button class="btn btn-ghost" id="btnBersih">Kosongkan pilihan</button>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-head"><h3>Membersihkan titipan</h3></div>
        <div class="card-body text-muted">
          Baris yang sudah tertempel maupun diabaikan boleh dibuang dari titipan.
          Riwayat yang sudah masuk ke rekam medis <b>tidak</b> ikut terhapus —
          ia sudah jadi milik pasiennya, bukan milik tabel titipan.
        </div>
        <div class="card-foot">
          <button class="btn btn-secondary" id="btnBersihkanSelesai">
            Buang yang sudah selesai</button>
        </div>
      </div>`;

    w.querySelector('#berkasCsv').addEventListener('change', (e) => bacaBerkas(w, e.target.files));
    w.querySelector('#btnBersih').addEventListener('click', () => {
      berkas = [];
      w.querySelector('#berkasCsv').value = '';
      gambarPratinjau(w);
    });
    w.querySelector('#btnKirim').addEventListener('click', () => kirimBerkas(w));
    w.querySelector('#btnBersihkanSelesai').addEventListener('click', async () => {
      if (!await UI.konfirmasi('Buang titipan yang sudah selesai?',
        'Baris berstatus sudah cocok dan diabaikan akan dihapus dari tabel titipan. ' +
        'Riwayat yang sudah masuk rekam medis tidak terpengaruh.')) return;
      try {
        const h = await DB.kronisImporBersihkan(false);
        UI.toast(`${h.dihapus} baris titipan dibuang.`);
        await muatRingkas();
      } catch (e) { UI.toast(e.message || e, 'err'); }
    });

    gambarPratinjau(w);
  }

  function bacaBerkas(w, files) {
    berkas = [];
    const daftarBerkas = [...(files || [])];
    if (!daftarBerkas.length) { gambarPratinjau(w); return; }

    let sisa = daftarBerkas.length;
    daftarBerkas.forEach(f => {
      const fr = new FileReader();
      fr.onload = () => {
        let hasil;
        try { hasil = KronisCore.bacaEkspor(String(fr.result || '')); }
        catch (e) { hasil = { baris: [], gagal: [{ baris: 0, sebab: e.message }], bentuk: 'kosong' }; }
        const sumber = KronisCore.tebakSumber(hasil.baris[0]);
        berkas.push({
          nama: f.name, sumber, bentuk: hasil.bentuk,
          baris: hasil.baris, gagal: hasil.gagal,
          ringkas: KronisCore.ringkasBerkas(hasil.baris)
        });
        if (--sisa === 0) gambarPratinjau(w);
      };
      fr.onerror = () => {
        berkas.push({ nama: f.name, sumber: null, bentuk: 'kosong',
          baris: [], gagal: [{ baris: 0, sebab: 'Berkas tidak terbaca.' }],
          ringkas: KronisCore.ringkasBerkas([]) });
        if (--sisa === 0) gambarPratinjau(w);
      };
      fr.readAsText(f);
    });
  }

  function gambarPratinjau(w) {
    const wadah = w.querySelector('#pratinjauBerkas');
    const btn = w.querySelector('#btnKirim');
    if (!berkas.length) {
      wadah.innerHTML = `<div class="text-muted">Belum ada berkas dipilih.</div>`;
      btn.disabled = true;
      return;
    }
    const bisa = berkas.filter(b => b.sumber && b.baris.length);
    btn.disabled = bisa.length === 0;

    wadah.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr>
          <th>Berkas</th><th>Jenis</th><th class="text-right">Baris</th>
          <th class="text-right">Orang</th><th class="text-right">Tanpa BPJS</th><th>Catatan</th>
        </tr></thead>
        <tbody>${berkas.map(b => `
          <tr>
            <td class="mono">${UI.esc(b.nama)}</td>
            <td>${b.sumber
                  ? UI.esc(KronisCore.LABEL_SUMBER[b.sumber])
                  : '<span class="badge b-danger">Tidak dikenali</span>'}</td>
            <td class="text-right tabular">${b.baris.length}</td>
            <td class="text-right tabular">${b.ringkas.orang}</td>
            <td class="text-right tabular">${b.ringkas.tanpaBpjs}</td>
            <td>${catatanBerkas(b)}</td>
          </tr>`).join('')}
        </tbody></table></div>`;
  }

  function catatanBerkas(b) {
    const c = [];
    if (!b.sumber) c.push('Kolom tanggal_ambil / tanggal_lab / tanggal_kontrol / resep_tetap tidak ada.');
    if (b.gagal.length) c.push(`${b.gagal.length} baris tidak terbaca (dilewati).`);
    if (b.ringkas.tanpaNama) c.push(`${b.ringkas.tanpaNama} baris tanpa nama (dilewati).`);
    if (!c.length) c.push('Siap dimasukkan.');
    return UI.esc(c.join(' '));
  }

  async function kirimBerkas(w) {
    const btn = w.querySelector('#btnKirim');
    const bisa = berkas.filter(b => b.sumber && b.baris.length);
    if (!bisa.length) return;

    btn.disabled = true;
    const asli = btn.innerHTML;
    const hasil = [];
    try {
      for (const b of bisa) {
        let masuk = 0, lewat = 0;
        // Dikirim per 500 baris. Satu permintaan berisi 5.000 baris bukan
        // hanya lambat — ia gagal di tengah tanpa memberi tahu bagian mana
        // yang sudah masuk, dan mengulanginya jadi menakutkan.
        for (let i = 0; i < b.baris.length; i += UKURAN_KIRIM) {
          const potong = b.baris.slice(i, i + UKURAN_KIRIM);
          btn.innerHTML = `Mengirim ${UI.esc(b.nama)} — ${i + potong.length}/${b.baris.length}…`;
          const h = await DB.kronisImporTampung(b.sumber, potong);
          masuk += Number(h.masuk || 0);
          lewat += Number(h.dilewati || 0);
        }
        hasil.push(`${KronisCore.LABEL_SUMBER[b.sumber]}: ${masuk} masuk` +
                   (lewat ? `, ${lewat} sudah ada sebelumnya` : ''));
      }
      UI.modal({
        judul: 'Data portal masuk ke titipan',
        isi: `<ul class="mt-0 mb-0 ml-18 lh-18">
                ${hasil.map(h => `<li>${UI.esc(h)}</li>`).join('')}
              </ul>
              <p class="text-muted mt-12">Lanjutkan ke tab
                <b>2. Cocokkan Pasien</b>.</p>`,
        tombol: [{ teks: 'Tutup', kelas: 'btn-primary' }]
      });
      berkas = [];
      w.querySelector('#berkasCsv').value = '';
      gambarPratinjau(w);
      await muatRingkas();
    } catch (e) {
      UI.toast(e.message || e, 'err', 6000);
    } finally {
      btn.innerHTML = asli;
      btn.disabled = false;
    }
  }

  /* ==================================================================== */
  /*  TAB 2 — COCOKKAN                                                    */
  /* ==================================================================== */

  async function tabCocok(w) {
    w.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="form-row">
            <div class="field">
              <label>Status</label>
              <select id="fStatus">
                <option value="MENUNGGU">Menunggu dicocokkan</option>
                <option value="COCOK">Sudah tertempel</option>
                <option value="ABAIKAN">Diabaikan</option>
              </select>
            </div>
            <div class="field field-flex-2">
              <label>Cari nama</label>
              <input type="search" id="fCari" placeholder="Nama pasien di portal…">
            </div>
            <div class="field field-align-end flex gap-8 flex-wrap">
              <button class="btn btn-secondary" id="btnOtomatis">
                Tempel otomatis yang BPJS-nya cocok</button>
              <button class="btn btn-outline" id="btnEksporKesesuaian">
                ${UI.ikon('unduh', 14)} Ekspor Excel (CSV)</button>
              <button class="btn btn-primary" id="btnCetakPdf">
                ${UI.ikon('cetak', 14)} Cetak / Simpan PDF</button>
            </div>
          </div>
        </div>
      </div>
      <div class="split mt-16">
        <div id="daftarTitipan" class="split-primary">${UI.memuat(4)}</div>
        <div id="kartuCocok" class="split-secondary"></div>
      </div>`;

    const sel = w.querySelector('#fStatus');
    sel.value = statusFilter;
    sel.addEventListener('change', async () => {
      statusFilter = sel.value; terpilih = null;
      await muatDaftar(w);
    });
    w.querySelector('#fCari').value = cari;
    w.querySelector('#fCari').addEventListener('input', UI.tunda(async (e) => {
      cari = e.target.value.trim(); await muatDaftar(w);
    }, 320));
    w.querySelector('#btnOtomatis').addEventListener('click', () => jalankanOtomatis(w));
    w.querySelector('#btnEksporKesesuaian').addEventListener('click', () => bukaModalEkspor(w, 'spreadsheet'));
    w.querySelector('#btnCetakPdf').addEventListener('click', () => bukaModalEkspor(w, 'pdf'));

    await muatDaftar(w);
  }

  async function muatDaftar(w) {
    const wd = w.querySelector('#daftarTitipan');
    wd.innerHTML = UI.memuat(4);
    daftar = await DB.kronisImporDaftar(statusFilter, cari);

    if (!daftar.length) {
      wd.innerHTML = UI.kosong('Tidak ada',
        statusFilter === 'MENUNGGU'
          ? 'Semua baris titipan sudah dikerjakan.'
          : 'Belum ada baris pada status ini.');
      w.querySelector('#kartuCocok').innerHTML = '';
      return;
    }

    wd.innerHTML = `
      <div class="card"><div class="card-body tight">
        <div class="table-wrap"><table>
          <thead><tr><th>Nama di portal</th><th>Riwayat</th><th></th></tr></thead>
          <tbody>${daftar.map(d => `
            <tr data-id="${d.id}" class="row-clickable${terpilih && terpilih.id === d.id
                  ? ' row-selected' : ''}">
              <td>
                <b>${UI.esc(d.nama_pasien)}</b>
                <div class="text-muted mono text-sm">
                  ${d.no_bpjs ? UI.esc(d.no_bpjs) : 'tanpa BPJS'}</div>
                ${d.pasien ? `<div class="badge b-ok mt-4">&rarr;
                   ${UI.esc(d.pasien.nama)} (${UI.esc(d.pasien.no_rm)})</div>` : ''}
              </td>
              <td class="text-muted text-sm">
                ${d.punya_terapi ? 'terapi · ' : ''}${d.jml_obat} obat ·
                ${d.jml_lab} lab · ${d.jml_kontrol} kontrol</td>
              <td>${UI.ikon('kembali', 14)}</td>
            </tr>`).join('')}
          </tbody></table></div>
      </div></div>`;

    wd.querySelectorAll('tr[data-id]').forEach(tr => {
      tr.addEventListener('click', () => pilih(w, Number(tr.dataset.id)));
    });

    // Langsung buka yang pertama: tujuan halaman ini adalah menyelesaikan
    // antrean, bukan menatap daftar.
    await pilih(w, terpilih && daftar.some(d => d.id === terpilih.id)
      ? terpilih.id : daftar[0].id);
  }

  async function pilih(w, id) {
    terpilih = daftar.find(d => d.id === id) || null;
    const wk = w.querySelector('#kartuCocok');
    if (!terpilih) { wk.innerHTML = ''; return; }
    wk.innerHTML = UI.memuat(3);

    let baris = [];
    usulan = [];
    try {
      baris = await DB.kronisImporBaris(terpilih.id, 40);
      if (terpilih.status === 'MENUNGGU') usulan = await DB.kronisImporUsulan(terpilih.id);
    } catch (e) {
      wk.innerHTML = `<div class="banner err"><div>${UI.esc(e.message || e)}</div></div>`;
      return;
    }
    gambarKartu(w, wk, baris);
  }

  function gambarKartu(w, wk, baris) {
    const d = terpilih;
    const terapi = baris.find(b => b.sumber === 'KRONIS_TERAPI');
    const resep = terapi ? KronisCore.pecahResep(terapi.isi.resep_tetap) : [];
    const kode = KronisCore.kodeDiagnosa(d.diagnosis_teks);

    wk.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h3>${UI.esc(d.nama_pasien)}</h3>
          <span class="badge ${d.status === 'COCOK' ? 'b-ok'
              : d.status === 'ABAIKAN' ? 'b-batal' : 'b-menunggu'}">${UI.esc(d.status)}</span>
        </div>
        <div class="card-body">
          <div class="grid grid-3 mb-12">
            <div><div class="lbl text-muted">No. BPJS</div>
              <div class="mono">${d.no_bpjs ? UI.esc(d.no_bpjs) : '—'}</div></div>
            <div><div class="lbl text-muted">Telepon</div>
              <div class="mono">${d.no_telp ? UI.esc(d.no_telp) : '—'}</div></div>
            <div><div class="lbl text-muted">Diagnosis portal</div>
              <div>${d.diagnosis_teks ? UI.esc(d.diagnosis_teks) : '—'}</div></div>
          </div>
          ${kode.length ? `<div class="chip-list mb-12">
              ${kode.map(k => `<span class="chip">${UI.esc(k)}</span>`).join('')}</div>` : ''}
          ${resep.length ? `<div class="lbl text-muted">Resep rutin di portal</div>
            <ul class="mono mt-4 mb-12 ml-18 text-sm">
              ${resep.map(x => `<li>${UI.esc(x)}</li>`).join('')}</ul>` : ''}
          <div class="text-muted text-sm">
            ${d.jml_obat} pengambilan obat · ${d.jml_lab} pemeriksaan lab ·
            ${d.jml_kontrol} jadwal kontrol${riwayatTerbaru(baris)}</div>
        </div>
      </div>

      <div class="card mt-14">
        <div class="card-head"><h3>${d.status === 'COCOK'
            ? 'Tertempel ke pasien' : 'Pasien mana orang ini?'}</h3></div>
        <div class="card-body" id="isiCocok"></div>
      </div>`;

    const isi = wk.querySelector('#isiCocok');
    if (d.status === 'COCOK') return gambarSudahCocok(w, isi);
    if (d.status === 'ABAIKAN') {
      isi.innerHTML = `<div class="text-muted">Diabaikan${d.alasan
        ? ` — ${UI.esc(d.alasan)}` : ''}.</div>`;
      return;
    }
    gambarUsulan(w, isi);
  }

  function riwayatTerbaru(baris) {
    const tgl = baris.map(b => b.tanggal).filter(Boolean).sort();
    if (!tgl.length) return '';
    return ` · ${UI.tglPendek(tgl[0])} s/d ${UI.tglPendek(tgl[tgl.length - 1])}`;
  }

  function gambarSudahCocok(w, isi) {
    const p = terpilih.pasien;
    isi.innerHTML = `
      ${p ? `<div class="banner ok"><div>
          Riwayat portal sudah menempel ke <b>${UI.esc(p.nama)}</b>
          (${UI.esc(p.no_rm)}${p.tanggal_lahir ? ', ' + UI.umurTeks(p.tanggal_lahir) : ''}).
        </div></div>` : ''}
      <p class="text-muted mt-12 mb-12">
        Kalau tempelannya keliru, batalkan di sini. Riwayat yang berasal dari
        baris titipan ini akan dicabut kembali, dan barisnya kembali menunggu.</p>
      <button class="btn btn-danger" id="btnBatalCocok">Batalkan pencocokan</button>`;
    isi.querySelector('#btnBatalCocok').addEventListener('click', async () => {
      if (!await UI.konfirmasi('Batalkan pencocokan?',
        `Riwayat portal ${terpilih.nama_pasien} akan dicabut dari rekam medis ` +
        (p ? p.nama : 'pasien tujuannya') + '.', 'Ya, batalkan', true)) return;
      try {
        const h = await DB.kronisImporBatalCocok(terpilih.id);
        UI.toast(`${h.riwayat_dicabut} baris riwayat dicabut.`);
        terpilih = null;
        await muatRingkas();
        await muatDaftar(w);
      } catch (e) { UI.toast(e.message || e, 'err', 6000); }
    });
  }

  function gambarUsulan(w, isi) {
    const otomatis = KronisCore.bolehOtomatis(terpilih.kunci, usulan);
    isi.innerHTML = `
      ${usulan.length ? '' : `<div class="banner warn">${UI.ikon('peringatan')}
        <div>Tidak ada pasien RME yang mirip. Daftarkan orang ini lebih dulu di
          <b>Pendaftaran</b>, lalu kembali ke sini — riwayatnya akan menempel
          setelah itu.</div></div>`}
      ${otomatis ? `<div class="banner ok"><div>Nomor BPJS cocok persis dan hanya
        menunjuk satu pasien. Baris ini bisa ditempel lewat tombol
        <b>Tempel otomatis</b> di atas.</div></div>` : ''}
      <div id="daftarUsulan">${usulan.map((u, i) => `
        <div class="card mb-8">
          <div class="card-body flex items-center gap-12">
            <div class="flex-1">
              <b>${UI.esc(u.nama)}</b>
              <span class="badge b-${KronisCore.warnaSkor(u.skor)} ml-6">${UI.esc(KronisCore.labelSkor(u.skor))}</span>
              <div class="text-muted text-sm">
                ${UI.esc(u.no_rm)} · ${UI.esc(u.jenis_kelamin)} ·
                ${u.tanggal_lahir ? UI.esc(UI.umurTeks(u.tanggal_lahir)) : '—'}
                ${u.no_bpjs ? ' · BPJS ' + UI.esc(u.no_bpjs) : ''}
                ${u.alamat ? ' · ' + UI.esc(u.alamat) : ''}</div>
            </div>
            <button class="btn btn-primary btn-sm" data-pilih="${UI.esc(u.pasien_id)}"
              data-nama="${UI.esc(u.nama)}">Ini orangnya</button>
          </div>
        </div>`).join('')}
      </div>

      <div class="divider"></div>
      <div class="field">
        <label>Cari pasien lain</label>
        <div id="cariPasienLain"></div>
      </div>
      <div class="btn-group mt-12">
        <button class="btn btn-ghost" id="btnAbaikan">Bukan pasien klinik ini</button>
      </div>`;

    isi.querySelectorAll('[data-pilih]').forEach(b => {
      b.addEventListener('click', () => tempel(w, b.dataset.pilih, b.dataset.nama));
    });

    Komponen.comboCari({
      wadah: isi.querySelector('#cariPasienLain'),
      placeholder: 'Ketik nama atau nomor rekam medis…',
      cariFn: (kata) => DB.cariPasien(kata),
      formatFn: (p) => `${p.nama} — ${p.no_rm}` +
        (p.tanggal_lahir ? ` · ${UI.umurTeks(p.tanggal_lahir)}` : ''),
      onPilih: (p) => tempel(w, p.id, p.nama)
    });

    isi.querySelector('#btnAbaikan').addEventListener('click', async () => {
      const d = terpilih;
      const jadi = await UI.modal({
        judul: 'Abaikan baris ini',
        isi: `<p class="text-muted">Riwayat <b>${UI.esc(d.nama_pasien)}</b> tidak akan
                dipindahkan ke rekam medis mana pun. Bisa diubah lagi nanti.</p>
              <div class="field"><label for="abAlasan">Alasan</label>
                <input id="abAlasan" value="Bukan pasien klinik ini." maxlength="200"></div>`,
        tombol: [
          { teks: 'Batal', nilai: null },
          { teks: 'Abaikan', kelas: 'btn-danger', aksi: async (b) => {
              try {
                await DB.kronisImporAbaikan(d.id, b.querySelector('#abAlasan').value.trim() || null);
              } catch (e) { UI.toast(e.message || e, 'err', 6000); return false; }
              return true;
            } }
        ]
      });
      if (jadi !== true) return;
      UI.toast('Baris ditandai diabaikan.');
      if (terpilih && terpilih.id === d.id) terpilih = null;
      await muatRingkas();
      await muatDaftar(w);
    });
  }

  async function tempel(w, pasienId, namaPasien) {
    if (!await UI.konfirmasi('Tempelkan riwayat portal?',
      `Seluruh riwayat "${terpilih.nama_pasien}" dari portal akan masuk ke rekam medis ` +
      `${namaPasien}. Bisa dibatalkan lagi kalau keliru.`, 'Ya, ini orangnya')) return;
    try {
      const h = await DB.kronisImporCocokkan(terpilih.id, pasienId);
      UI.toast(`Masuk: ${h.ambil_obat} pengambilan obat, ${h.lab} lab, ` +
               `${h.kontrol} jadwal kontrol.`);
      terpilih = null;
      await muatRingkas();
      await muatDaftar(w);
    } catch (e) { UI.toast(e.message || e, 'err', 6000); }
  }

  async function jalankanOtomatis(w) {
    if (!await UI.konfirmasi('Tempel otomatis?',
      'Hanya baris yang nomor BPJS-nya cocok PERSIS dengan satu pasien yang akan ' +
      'ditempel. Nama yang mirip tidak pernah ditempel sendiri, dan nomor BPJS yang ' +
      'menunjuk dua pasien ditinggalkan untuk Anda periksa.')) return;
    try {
      const h = await DB.kronisImporOtomatis();
      UI.modal({
        judul: 'Selesai',
        isi: `<p><b>${h.tertempel}</b> baris tertempel otomatis.</p>
              <p class="text-muted">${h.tersisa} baris tetap menunggu — nomor BPJS-nya
                kosong, tidak ketemu pasiennya, atau menunjuk lebih dari satu pasien.</p>`,
        tombol: [{ teks: 'Tutup', kelas: 'btn-primary' }]
      });
      terpilih = null;
      await muatRingkas();
      await muatDaftar(w);
    } catch (e) { UI.toast(e.message || e, 'err', 6000); }
  }

  return { render };
})();
