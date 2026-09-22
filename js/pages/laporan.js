/* =====================================================================
   LAPORAN — Tahap 3 menambah lima tab lanjutan di atas tab Ringkasan yang
   sudah ada sejak awal (Ringkasan tetap terbuka lewat kode `menu_laporan`,
   TIDAK diubah perilakunya): Overview & Tren, Rujukan, Register Poli,
   Keuangan, dan Puskesmas — kelimanya di balik kode `laporan_lanjutan`
   (9 Sep 2026, bisa diatur lewat Pengaturan -> Hak Akses; bawaannya hanya
   master, sama seperti admin lama).

   Kenapa dibatasi DI SINI, bukan di RLS: sama seperti kronis_telpon_h1 di
   Tahap 2 — RLS tabel aslinya sudah membuka baca untuk semua staf (kasir
   dan dokter memang perlu kasir_tagihan/pemeriksaan dari layar lain),
   jadi menutupnya di RLS akan mengunci layar yang sudah sah itu juga.
   `App.boleh('laporan_lanjutan')` itulah gerbangnya.

   Kenapa "Overview & Tren" jauh lebih kaya dari tab lain: diminta eksplisit
   ("Analitik penuh seperti portal lama", bukan versi ringkas) untuk menyamai
   dashboard.html portal sipantau — snapshot harian, tren 7 hari, kalender
   heatmap bulanan, pola jam kunjungan, kinerja dokter, enam grafik performa
   6 bulan, dan sepuluh besar penyakit. Tab Rujukan/Register/Keuangan/
   Puskesmas TIDAK butuh perlakuan sama: di portal sendiri, layar-layar itu
   adalah tabel cari+filter biasa tanpa grafik (dashboard.html bagian
   "Pencarian Data"/"Register Poli") — rujukan.html/laporan_keuangan.html/
   laporan_puskesmas.html yang terpisah cuma FORMULIR ENTRI manual, sudah
   digantikan otomatis oleh transaksi sungguhan RME (lihat catatan di
   sql/19_laporan.sql). Jadi kesetaraan sungguhan ada di sini: tabel
   cari+filter+ekspor CSV, bukan grafik yang tidak pernah ada di sana.

   Penyederhanaan yang SENGAJA diambil di Overview (dicatat di sini supaya
   terlihat sebagai keputusan, bukan kelupaan):
   - "Perbandingan Antar Bulan" selalu membandingkan bulan kalender penuh.
     Portal punya mode "periode sebanding" (memotong kedua bulan ke tanggal
     yang sama) untuk bulan berjalan yang belum lengkap — di sini cukup
     diberi keterangan "bulan berjalan, belum lengkap" di judul kartu.
   - Kalender heatmap memetakan jumlah kunjungan (Total/Umum/Gigi) saja,
     bukan pendapatan — grafik "Uang Masuk per Bulan" di bagian performa
     6 bulan sudah menutupi kebutuhan melihat tren pendapatan.
   - Tidak ada kartu/grafik obat kronis di sini — cakupan itu milik
     Pemantauan Kronis (Tahap 2, js/pages/pantau_kronis.js). Menduplikasinya
     di sini adalah kelas kesalahan yang sama dengan dua tempat untuk satu
     hal (lihat catatan poli.jenis).

   Chart.js dimuat lazy dari CDN persis seperti SheetJS/xlsx di apotek.js
   (lihat muatChartJS di bawah) — tidak dibebankan ke setiap orang yang
   membuka halaman lain. Untuk pengujian Chromium (test/uji_laporan_halaman.js),
   permintaan ke CDN dialihkan ke salinan npm `chart.js`, sama seperti xlsx
   di test/uji_impor_halaman.js — lihat test/README.md.
   ===================================================================== */
const Laporan = (() => {

  let tabAktif = 'ringkasan';

  /* ---- state tab Overview & Tren (bertahan selama sesi SPA ini) ------- */
  let ovData = null;                 // cache tarikan 6 bulan {kunjungan,rujukan,tagihan,pembayaran,monthKeys}
  let ovBulanA = null, ovBulanB = null;      // perbandingan antar bulan
  let ovBulanHeatmap = UI.bulanIni();
  let ovMetrikHeatmap = 'total';              // 'total' | 'umum' | 'gigi'
  let ovBulanJam = UI.bulanIni();
  let ovBulanDokter = UI.bulanIni();

  function bolehAdmin() { return App.boleh('laporan_lanjutan'); }

  /* ==================================================================== */
  /*  RENDER HALAMAN & TAB                                                */
  /* ==================================================================== */

  async function render(el, param) {
    if (param && param[0]) tabAktif = param[0];
    if (tabAktif === 'puskesmas') tabAktif = 'ringkasan';
    if (tabAktif !== 'ringkasan' && !bolehAdmin()) tabAktif = 'ringkasan';

    const TAB = [
      ['ringkasan', 'Ringkasan'],
      ...(bolehAdmin() ? [
        ['overview', 'Overview & Tren'],
        ['rujukan', 'Rujukan'],
        ['register', 'Registrasi Lab'],
        ['keuangan', 'Keuangan'],
      ] : [])
    ];

    el.innerHTML = `
      <div class="page-header mb-16">
        <div class="page-heading">
          <h1>Laporan</h1>
          <div class="page-sub">Rekap kunjungan, pemeriksaan laboratorium, rujukan, dan keuangan.</div>
        </div>
      </div>
      <div class="tabs" id="tabs">
        ${TAB.map(([k, t]) => `<button class="tab ${tabAktif === k ? 'on' : ''}" data-t="${k}">${UI.esc(t)}</button>`)
          .join('')}
      </div>
      <div id="isiTab">${UI.memuat(4)}</div>`;

    el.querySelector('#tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      tabAktif = b.dataset.t;
      history.replaceState(null, '', `#/laporan/${tabAktif}`);
      el.querySelectorAll('#tabs .tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      gambarTab(el.querySelector('#isiTab'));
    });

    await gambarTab(el.querySelector('#isiTab'));
  }

  async function gambarTab(w) {
    w.innerHTML = UI.memuat(4);
    try {
      if (tabAktif === 'ringkasan') return await tabRingkasan(w);
      if (tabAktif === 'overview')  return await tabOverview(w);
      if (tabAktif === 'rujukan')   return await tabRujukan(w);
      if (tabAktif === 'register')  return await tabRegister(w);
      if (tabAktif === 'keuangan')  return await tabKeuangan(w);
    } catch (e) {
      w.innerHTML = `<div class="banner err"><div>${UI.esc(e.message || e)}</div></div>`;
    }
  }

  /* ==================================================================== */
  /*  BANTU BERSAMA — CSV, peringkat penyakit, grafik Chart.js            */
  /* ==================================================================== */

  function unduhCsv(data, kolom, namaFile) {
    if (!data.length) { UI.toast('Tidak ada data untuk diunduh.', 'warn'); return; }
    const bersih = (v) => {
      const s = (v ?? '').toString().replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const nilai = (r, k) => (typeof k[2] === 'function' ? k[2](r) : r[k[0]]);
    const isi = [kolom.map(k => k[1]).join(';'),
                 ...data.map(r => kolom.map(k => bersih(nilai(r, k))).join(';'))].join('\r\n');
    const blob = new Blob(['﻿' + isi], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = namaFile;
    document.body.appendChild(a); a.click(); a.remove();
    UI.toast('Berkas CSV diunduh.', 'ok');
  }

  /* Daftar peringkat bergaya-batang, dipakai tab Ringkasan DAN Overview
     (sepuluh besar penyakit) — satu tampilan, tidak dua salinan markup. */
  function daftarPeringkat(top) {
    if (!top.length) return '<p class="text-muted mb-0">Belum ada diagnosa pada periode ini.</p>';
    const maks = Math.max(1, ...top.map(t => t.jml));
    return top.map((t, i) => `
      <div class="mb-12">
        <div class="flex justify-between items-center gap-8 mb-8">
          <div class="min-w-0"><b>${i + 1}. ${UI.esc(t.nama)}</b>
            <span class="text-xs text-muted mono">${UI.esc(t.kode)}</span></div>
          <b class="tabular">${t.jml}</b>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${t.jml / maks * 100}%"></div>
        </div>
      </div>`).join('');
  }

  /* Daftar peringkat pemeriksaan lab dengan persentase dan kelompok. */
  function daftarPeringkatLab(items) {
    if (!items || !items.length) {
      return '<div class="p-16 text-center text-muted">Belum ada pemeriksaan laboratorium pada kriteria ini.</div>';
    }
    const maks = Math.max(1, ...items.map(t => t.jml));
    const total = items.reduce((s, t) => s + t.jml, 0);
    return `
      <div class="mb-12 flex justify-between items-center text-xs text-muted pb-8 border-b">
        <span><b>Nama Pemeriksaan &amp; Kelompok</b></span>
        <span class="tabular"><b>Persentase · Jumlah</b></span>
      </div>` +
      items.map((t, i) => `
        <div class="mb-12">
          <div class="flex justify-between items-center gap-8 mb-4">
            <div class="min-w-0">
              <b>${i + 1}. ${UI.esc(t.nama)}</b>
              ${t.kelompok ? `<span class="badge b-info text-xs ml-4" style="font-size:11px;padding:2px 6px;">${UI.esc(t.kelompok)}</span>` : ''}
            </div>
            <div class="flex items-center gap-8 flex-shrink-0">
              <span class="text-xs text-muted tabular">${total ? Math.round(t.jml / total * 100) : 0}%</span>
              <b class="tabular text-primary" style="min-width:32px;text-align:right;">${t.jml}</b>
            </div>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(t.jml / maks * 100).toFixed(1)}%"></div>
          </div>
        </div>`).join('') +
      `<div class="pt-8 mt-12 border-t flex justify-between items-center text-xs text-muted">
        <span>Menampilkan ${items.length} jenis pemeriksaan</span>
        <span>Total frekuensi: <b class="tabular text-dark">${total}</b> kali</span>
      </div>`;
  }

  /* ---- Chart.js: dimuat sekali, tinggal di memori sampai halaman ditutup,
     persis pola muatSheetJS() di js/pages/apotek.js. ---- */
  let chartSiap = null;
  function muatChartJS() {
    if (typeof Chart !== 'undefined') return Promise.resolve();
    if (chartSiap) return chartSiap;
    chartSiap = new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js';
      s.onload = ok;
      s.onerror = () => gagal(new Error('gagal memuat'));
      document.head.appendChild(s);
    }).catch(e => { chartSiap = null; throw e; });
    return chartSiap;
  }
  async function siapkanChart() {
    try { await muatChartJS(); return true; }
    catch (e) {
      UI.toast('Pustaka grafik gagal dimuat. Periksa koneksi internet, lalu coba lagi.', 'err');
      return false;
    }
  }

  /* Satu instance Chart.js per kunci, dihancurkan sebelum dibuat ulang —
     canvas yang dipakai ulang tanpa destroy() adalah kebocoran memori dan,
     pada Chart.js, bisa gagal dengan "Canvas is already in use". */
  const grafikPeta = {};
  function buatGrafik(kunci, canvas, config) {
    if (grafikPeta[kunci]) { try { grafikPeta[kunci].destroy(); } catch (e) { /* abaikan */ } }
    const c = new Chart(canvas, config);
    grafikPeta[kunci] = c;
    return c;
  }
  function hancurkanSemuaGrafik() {
    Object.keys(grafikPeta).forEach(k => {
      try { grafikPeta[k].destroy(); } catch (e) { /* abaikan */ }
      delete grafikPeta[k];
    });
  }

  const OPSI_BAR = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
  };

  function ringkasRp(v) {
    const n = Number(v) || 0;
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' M';
    if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' jt';
    if (abs >= 1e3) return (n / 1e3).toFixed(0) + ' rb';
    return String(n);
  }

  /* Semua tanggal dalam satu bulan ('YYYY-MM' -> ['YYYY-MM-01', ...]),
     dibangun lewat konstruktor Date(tahun,bulan,hari) lokal — BUKAN lewat
     new Date(teksIso) atau toISOString(), yang keduanya diketahui
     bermasalah untuk WITA (lihat catatan UI.hariIni()). */
  function tanggalSebulan(kunciBulan) {
    const [y, m] = kunciBulan.split('-').map(Number);
    const jumlahHari = new Date(y, m, 0).getDate();
    const hasil = [];
    for (let h = 1; h <= jumlahHari; h++) {
      hasil.push(`${y}-${String(m).padStart(2, '0')}-${String(h).padStart(2, '0')}`);
    }
    return hasil;
  }

  function badgePoliKelas(jenisPoli) {
    if (jenisPoli === 'UMUM') return 'b-info';
    if (jenisPoli === 'GIGI') return 'b-dokter';   // ungu — dipinjam dari lencana peran dokter
    if (jenisPoli === 'KIA') return 'b-warn';
    return 'b-umum';
  }

  /* ==================================================================== */
  /*  TAB 1 — RINGKASAN (tidak berubah dari sebelum Tahap 3)              */
  /* ==================================================================== */

  const KOLOM_KUNJUNGAN = [
    ['tanggal', 'Tanggal'], ['no_kunjungan', 'No Kunjungan'], ['no_rm', 'No RM'],
    ['nama_pasien', 'Nama Pasien'], ['nama_poli', 'Poli'], ['nama_dokter', 'Dokter'],
    ['cara_bayar', 'Cara Bayar'], ['icd_primer', 'ICD Primer'], ['daftar_diagnosa', 'Diagnosa'],
    ['status', 'Status']
  ];

  async function tabRingkasan(w) {
    const akhir = UI.hariIni();
    const awal = akhir.slice(0, 8) + '01';

    w.innerHTML = `
      <div class="card mb-16">
        <div class="card-body">
          <div class="flex items-center gap-12 flex-wrap">
            <div class="flex items-center gap-8 periode-group">
              <label class="mb-0">Periode</label>
              <input type="date" id="dari" value="${awal}" class="control-auto">
              <span class="text-muted">s.d.</span>
              <input type="date" id="sampai" value="${akhir}" class="control-auto">
            </div>
            <button class="btn btn-primary btn-sm" id="btnTampil">Tampilkan</button>
            <div class="flex-1"></div>
            <button class="btn btn-secondary btn-sm" id="btnUnduhLab">${UI.ikon('unduh', 15)} Unduh CSV Pemeriksaan</button>
            <button class="btn btn-secondary btn-sm" id="btnUnduhKunjungan">${UI.ikon('unduh', 15)} Unduh CSV Kunjungan</button>
          </div>
        </div>
      </div>

      <div id="isiLaporan">${UI.memuat(4)}</div>`;

    const muat = async () => {
      const dari = w.querySelector('#dari').value;
      const sampai = w.querySelector('#sampai').value;
      const isi = w.querySelector('#isiLaporan');
      isi.innerHTML = UI.memuat(4);
      try {
        const [kunjungan, labAntrean, labTop, kelompokList] = await Promise.all([
          DB.laporanKunjunganRingkas({ dari, sampai }),
          DB.laporanPermintaanLabRingkas({ dari, sampai }),
          DB.pemeriksaanLabTeratas({ dari, sampai, status: 'SELESAI', batas: 15 }),
          DB.daftarKelompokLab()
        ]);
        gambarRingkasan(isi, kunjungan, labAntrean, labTop, kelompokList, dari, sampai);
      } catch (e) {
        isi.innerHTML = `<div class="banner err">${UI.esc(e.message)}</div>`;
      }
    };

    w.querySelector('#btnTampil').addEventListener('click', muat);

    w.querySelector('#btnUnduhLab').addEventListener('click', async () => {
      const dari = w.querySelector('#dari').value, sampai = w.querySelector('#sampai').value;
      const d = await DB.pemeriksaanLabTeratas({ dari, sampai, batas: 0 });
      if (!d.length) { UI.toast('Belum ada data pemeriksaan lab pada periode ini.', 'warn'); return; }
      const baris = d.map((x, i) => ({
        no: i + 1,
        nama: x.nama,
        kelompok: x.kelompok || 'Lainnya',
        jml: x.jml
      }));
      unduhCsv(baris, [
        ['no', 'No'],
        ['nama', 'Nama Pemeriksaan'],
        ['kelompok', 'Kelompok Lab'],
        ['jml', 'Jumlah Pemeriksaan']
      ], `pemeriksaan_lab_${dari}_sd_${sampai}.csv`);
    });

    w.querySelector('#btnUnduhKunjungan').addEventListener('click', async () => {
      const dari = w.querySelector('#dari').value, sampai = w.querySelector('#sampai').value;
      const d = await DB.daftarKunjungan({ dari, sampai, batas: 5000 });
      unduhCsv(d, KOLOM_KUNJUNGAN, `kunjungan_${dari}_sd_${sampai}.csv`);
    });

    await muat();
  }

  function gambarRingkasan(w, kunjungan, labAntrean, labTop, kelompokList, dari, sampai) {
    const totalKunjungan = kunjungan.length;
    const totalPermintaan = labAntrean.length;
    const selesaiLab = labAntrean.filter(l => l.status === 'SELESAI').length;
    const prosesLab = labAntrean.filter(l => l.status === 'DIMINTA' || l.status === 'DIKERJAKAN').length;
    const totalItemPeriksa = labAntrean.reduce((s, l) => s + (Number(l.jml_pemeriksaan) || 0), 0);
    const bpjs = kunjungan.filter(k => k.cara_bayar === 'BPJS').length || labAntrean.filter(l => l.cara_bayar === 'BPJS').length;
    const totalPasien = totalKunjungan || totalPermintaan;
    const pctSelesai = totalPermintaan ? Math.round(selesaiLab / totalPermintaan * 100) : 0;

    // Rekap cara bayar riil
    const perCaraBayar = {};
    (labAntrean.length ? labAntrean : kunjungan).forEach(item => {
      const cb = item.cara_bayar || 'UMUM';
      perCaraBayar[cb] = (perCaraBayar[cb] || 0) + 1;
    });

    // Rekap kelompok lab riil dari pemeriksaan
    const perKelompok = {};
    (labTop || []).forEach(t => {
      const k = t.kelompok || 'Lainnya';
      perKelompok[k] = (perKelompok[k] || 0) + t.jml;
    });

    w.innerHTML = `
      <div class="grid grid-4 mb-16">
        <div class="stat accent">
          <div class="lbl">Total kunjungan pasien</div>
          <div class="val tabular">${totalPasien}</div>
          <div class="hint">${UI.tglPendek(dari)} – ${UI.tglPendek(sampai)}</div>
        </div>
        <div class="stat">
          <div class="lbl">Permintaan laboratorium</div>
          <div class="val tabular">${totalPermintaan}</div>
          <div class="hint">${selesaiLab} selesai (${pctSelesai}%) · ${prosesLab} diproses</div>
        </div>
        <div class="stat">
          <div class="lbl">Total parameter/tes lab</div>
          <div class="val tabular">${totalItemPeriksa}</div>
          <div class="hint">${totalPermintaan ? (totalItemPeriksa / totalPermintaan).toFixed(1) : 0} tes / permintaan</div>
        </div>
        <div class="stat">
          <div class="lbl">Peserta BPJS</div>
          <div class="val tabular">${bpjs}</div>
          <div class="hint">${totalPasien ? Math.round(bpjs / totalPasien * 100) : 0}% dari total pasien</div>
        </div>
      </div>

      <div class="split">
        <div class="card">
          <div class="card-head flex justify-between items-center gap-12 flex-wrap">
            <div>
              <h2>Pemeriksaan Lab Terbanyak</h2>
              <div class="sub">Frekuensi pemeriksaan dari pendaftaran &amp; hasil laboratorium</div>
            </div>
            <div class="flex items-center gap-8 flex-wrap">
              <select id="fRingkasanStatus" class="control-auto text-xs py-4" title="Filter status permintaan">
                <option value="SELESAI" selected>Status: Selesai</option>
                <option value="SEMUA">Semua Status</option>
                <option value="AKTIF">Sedang Diproses / Antre</option>
              </select>
              <select id="fRingkasanKelompok" class="control-auto text-xs py-4" title="Filter kelompok laboratorium">
                <option value="SEMUA">Semua Kelompok</option>
                ${kelompokList.map(k => `<option value="${UI.esc(k)}">${UI.esc(k)}</option>`).join('')}
              </select>
              <select id="fRingkasanBatas" class="control-auto text-xs py-4" title="Jumlah data yang ditampilkan">
                <option value="10">Top 10</option>
                <option value="15" selected>Top 15</option>
                <option value="25">Top 25</option>
                <option value="50">Top 50</option>
              </select>
            </div>
          </div>
          <div class="card-body" id="wadahLabTeratas">
            ${daftarPeringkatLab(labTop)}
          </div>
        </div>

        <div>
          <div class="card mb-16">
            <div class="card-head">
              <h2>Pemeriksaan per Kelompok Lab</h2>
              <div class="sub">Distribusi pengujian berdasarkan kategori laboratorium</div>
            </div>
            <div class="card-body" id="wadahKelompokLab">
              ${!Object.keys(perKelompok).length
                ? '<p class="text-muted mb-0">Belum ada pemeriksaan pada periode ini.</p>'
                : Object.entries(perKelompok).sort((a, b) => b[1] - a[1]).map(([nama, jml]) => {
                    const totalKlp = Object.values(perKelompok).reduce((a, b) => a + b, 0);
                    const pct = totalKlp ? Math.round(jml / totalKlp * 100) : 0;
                    return `
                      <div class="flex justify-between items-center row-line clickable" data-kelompok="${UI.esc(nama)}" title="Klik untuk memfilter kelompok ini">
                        <div class="min-w-0">
                          <span>${UI.esc(nama)}</span>
                          <span class="text-xs text-muted ml-4 tabular">(${pct}%)</span>
                        </div>
                        <b class="tabular">${jml} tes</b>
                      </div>`;
                  }).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h2>Status &amp; Cara Bayar</h2>
              <div class="sub">Proses penyelesaian layanan dan metode bayar</div>
            </div>
            <div class="card-body">
              <div class="mb-12">
                <div class="text-xs text-muted font-bold mb-4 uppercase">Status Permintaan Laboratorium</div>
                <div class="flex justify-between items-center row-line">
                  <span>Selesai Diverifikasi</span>
                  <span class="badge b-ok tabular font-bold">${selesaiLab}</span>
                </div>
                <div class="flex justify-between items-center row-line">
                  <span>Sedang Diproses / Dikerjakan</span>
                  <span class="badge b-info tabular font-bold">${labAntrean.filter(l => l.status === 'DIKERJAKAN').length}</span>
                </div>
                <div class="flex justify-between items-center row-line">
                  <span>Menunggu Pemeriksaan (Antrean)</span>
                  <span class="badge b-warn tabular font-bold">${labAntrean.filter(l => l.status === 'DIMINTA').length}</span>
                </div>
                ${labAntrean.some(l => l.status === 'BATAL') ? `
                  <div class="flex justify-between items-center row-line">
                    <span>Dibatalkan</span>
                    <span class="badge b-err tabular font-bold">${labAntrean.filter(l => l.status === 'BATAL').length}</span>
                  </div>` : ''}
              </div>

              <div>
                <div class="text-xs text-muted font-bold mb-4 uppercase">Metode Pembayaran Pasien</div>
                ${Object.entries(perCaraBayar).map(([cb, jml]) => `
                  <div class="flex justify-between items-center row-line">
                    <span>${UI.esc(cb)}</span>
                    <b class="tabular">${jml} pasien</b>
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Interaktivitas filter di card Pemeriksaan Lab Terbanyak
    const muatLabTeratas = async () => {
      const wadah = w.querySelector('#wadahLabTeratas');
      wadah.innerHTML = UI.memuat(3);
      const st = w.querySelector('#fRingkasanStatus').value;
      const klp = w.querySelector('#fRingkasanKelompok').value;
      const bts = parseInt(w.querySelector('#fRingkasanBatas').value, 10) || 15;
      try {
        const data = await DB.pemeriksaanLabTeratas({
          dari,
          sampai,
          status: st === 'SEMUA' ? null : st,
          kelompok: klp === 'SEMUA' ? null : klp,
          batas: bts
        });
        wadah.innerHTML = daftarPeringkatLab(data);
      } catch (err) {
        wadah.innerHTML = `<div class="banner err p-8 mb-0">${UI.esc(err.message)}</div>`;
      }
    };

    w.querySelector('#fRingkasanStatus').addEventListener('change', muatLabTeratas);
    w.querySelector('#fRingkasanKelompok').addEventListener('change', muatLabTeratas);
    w.querySelector('#fRingkasanBatas').addEventListener('change', muatLabTeratas);

    // Klik kelompok di card samping untuk auto-filter
    w.querySelectorAll('[data-kelompok]').forEach(el => {
      el.addEventListener('click', () => {
        const klp = el.getAttribute('data-kelompok');
        const sel = w.querySelector('#fRingkasanKelompok');
        if (sel) {
          sel.value = klp;
          muatLabTeratas();
        }
      });
    });
  }

  /* ==================================================================== */
  /*  TAB 2 — OVERVIEW & TREN                                             */
  /* ==================================================================== */

  async function ambilDataOverview(paksaMuat) {
    if (ovData && !paksaMuat) return ovData;
    const monthKeys = LaporanCore.daftarBulanMundur(6, UI.bulanIni());
    const dari = monthKeys[0] + '-01';
    const sampai = UI.hariIni();
    const [kunjungan, rujukan, tagihan, pembayaran] = await Promise.all([
      DB.laporanKunjunganRentang({ dari, sampai }),
      DB.laporanRujukan({ dari, sampai }),
      DB.laporanKeuanganTagihan({ dari, sampai }),
      DB.laporanKeuanganPembayaran({ dari, sampai })
    ]);
    ovData = { kunjungan, rujukan, tagihan, pembayaran, monthKeys, dari, sampai };
    return ovData;
  }

  async function tabOverview(w) {
    hancurkanSemuaGrafik();
    w.innerHTML = UI.memuat(6);
    let data;
    try {
      data = await ambilDataOverview();
    } catch (e) {
      w.innerHTML = `<div class="banner err"><div>${UI.esc(e.message || e)}</div></div>`;
      return;
    }

    w.innerHTML = `
      <div class="flex justify-between items-center mb-16">
        <p class="text-muted mb-0">Data enam bulan terakhir (${LaporanCore.labelBulanPendek(data.monthKeys[0])}
          – ${UI.tglIndo(UI.hariIni())}).</p>
        <button class="btn btn-secondary btn-sm" id="ovSegarkan">Segarkan data</button>
      </div>
      <div id="ovSnapshot" class="mb-16"></div>
      <div class="card mb-16"><div class="card-head"><h2>Tren Kunjungan 7 Hari Terakhir</h2></div>
        <div class="card-body"><div id="ovTrenBox" class="chart-box">
          <canvas id="ovTren"></canvas></div></div></div>
      <div id="ovBanding" class="mb-16"></div>
      <div id="ovHeatmap" class="mb-16"></div>
      <div id="ovJam" class="mb-16"></div>
      <div id="ovDokter" class="mb-16"></div>
      <h2 class="mb-12">Performa 6 Bulan Terakhir</h2>
      <div id="ovGrafik" class="mb-16 grafik-grid"></div>
      <div id="ovDiagnosa"></div>`;

    gambarSnapshot(w.querySelector('#ovSnapshot'), data);
    gambarBanding(w.querySelector('#ovBanding'), data);
    gambarHeatmap(w.querySelector('#ovHeatmap'), data);
    await gambarJam(w.querySelector('#ovJam'), data);
    gambarDokter(w.querySelector('#ovDokter'), data);

    if (await siapkanChart()) {
      gambarTrenChart(w.querySelector('#ovTren'), data);
      await gambarGrafikBulanan(w.querySelector('#ovGrafik'), data);
    } else {
      w.querySelector('#ovTrenBox').innerHTML =
        '<div class="banner warn"><div>Grafik tidak dapat dimuat tanpa koneksi internet.</div></div>';
      w.querySelector('#ovGrafik').innerHTML =
        '<div class="banner warn"><div>Grafik performa bulanan tidak dapat dimuat tanpa koneksi internet.</div></div>';
    }

    try {
      const labTop10 = await DB.pemeriksaanLabTeratas({
        dari: data.monthKeys[0] + '-01',
        sampai: UI.hariIni(),
        status: 'SELESAI',
        batas: 10
      });
      w.querySelector('#ovDiagnosa').innerHTML = `<div class="card"><div class="card-head">
        <div class="flex-1"><h2>Top 10 Pemeriksaan Lab Terbanyak</h2><div class="sub">Enam bulan terakhir (${LaporanCore.labelBulanPendek(data.monthKeys[0])} – ${UI.tglIndo(UI.hariIni())}).</div></div></div>
        <div class="card-body">${daftarPeringkatLab(labTop10)}</div></div>`;
    } catch (e) { /* bagian lain tetap ditampilkan walau ini gagal */ }

    w.querySelector('#ovSegarkan').addEventListener('click', async () => {
      ovData = null;
      await tabOverview(w);
    });
  }

  /* ---- A. Snapshot hari ini ------------------------------------------ */
  function gambarSnapshot(w, data) {
    const hari = UI.hariIni();
    const r = LaporanCore.rekapPerHari(data.kunjungan).get(hari) || LaporanCore.kunjunganKosong();
    const rujukanHariIni = data.rujukan.filter(x => x.tanggal === hari).length;
    const uangMasukHariIni = data.pembayaran
      .filter(x => x.tanggal === hari)
      .reduce((a, x) => a + (Number(x.uang_masuk) || 0), 0);

    w.innerHTML = `
      <div class="grid grid-3">
        <div class="stat accent"><div class="lbl">Total Kunjungan Hari Ini</div>
          <div class="val tabular">${r.total}</div>
          <div class="hint">${UI.tglIndo(hari)}</div></div>
        <div class="stat"><div class="lbl">Pasien Baru</div><div class="val tabular">${r.baru}</div></div>
        <div class="stat"><div class="lbl">Pasien Lama</div><div class="val tabular">${r.lama}</div></div>
        <div class="stat"><div class="lbl">Peserta BPJS</div>
          <div class="val tabular">${r.bpjs}</div>
          <div class="hint">${r.total ? Math.round(r.bpjs / r.total * 100) : 0}% dari total</div></div>
        <div class="stat"><div class="lbl">Rujukan Hari Ini</div><div class="val tabular">${rujukanHariIni}</div></div>
        <div class="stat"><div class="lbl">Uang Masuk Hari Ini</div>
          <div class="val tabular">${UI.rupiah(uangMasukHariIni)}</div></div>
      </div>`;
  }

  /* ---- B. Tren 7 hari (Chart.js line) ---------------------------------- */
  function gambarTrenChart(canvas, data) {
    const hari = UI.hariIni();
    const tanggalList = [];
    for (let i = 6; i >= 0; i--) tanggalList.push(SuratCore.tambahHari(hari, -i));
    const deret = LaporanCore.rekapTrenHarian(data.kunjungan, tanggalList);
    buatGrafik('tren', canvas, {
      type: 'line',
      data: {
        labels: tanggalList.map(SuratCore.namaHari),
        datasets: [{
          label: 'Total Kunjungan', data: deret.map(d => d.total),
          borderColor: '#0F8B7E', backgroundColor: 'rgba(15,139,126,.14)',
          fill: true, tension: 0.3, pointRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  /* ---- C. Perbandingan antar bulan ------------------------------------ */
  function metrikBulan(bulan, data) {
    const kv = LaporanCore.rekapPerBulan(data.kunjungan, [bulan])[0];
    const rj = LaporanCore.rekapRujukanPerBulan(data.rujukan, [bulan])[0].jumlah;
    const um = LaporanCore.rekapUangMasukPerBulan(data.pembayaran, [bulan], false)[0].total;
    const hariAktif = new Set(data.kunjungan
      .filter(k => LaporanCore.kunciBulan(k.tanggal) === bulan)
      .map(k => k.tanggal)).size;
    return {
      total: kv.total, baru: kv.baru, lama: kv.lama,
      pctBpjs: kv.total ? kv.bpjs / kv.total * 100 : 0,
      pctBaru: kv.total ? kv.baru / kv.total * 100 : 0,
      rujukan: rj, uangMasuk: um, hariAktif,
      rataPerHariAktif: hariAktif ? kv.total / hariAktif : 0
    };
  }

  function badgeDelta(now, prev) {
    if (!prev) return now > 0 ? '<span class="badge b-ok">▲ baru</span>' : '';
    const pct = (now - prev) / prev * 100;
    const naik = pct >= 0;
    return `<span class="badge ${naik ? 'b-ok' : 'b-danger'}">${naik ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%</span>`;
  }
  function badgeDeltaPP(now, prev) {
    const beda = now - prev;
    if (Math.abs(beda) < 0.05) return '<span class="badge b-umum">≈ sama</span>';
    const naik = beda >= 0;
    return `<span class="badge ${naik ? 'b-ok' : 'b-danger'}">${naik ? '▲' : '▼'} ${Math.abs(beda).toFixed(1)} pp</span>`;
  }

  function gambarBanding(w, data) {
    if (!data.monthKeys.includes(ovBulanB)) ovBulanB = data.monthKeys[data.monthKeys.length - 1];
    if (!ovBulanA || !data.monthKeys.includes(ovBulanA)) ovBulanA = UI.geserBulan(ovBulanB, -1);

    const A = metrikBulan(ovBulanA, data), B = metrikBulan(ovBulanB, data);
    const kartu = (label, nowVal, prevVal, tampil, delta) => `
      <div class="stat"><div class="lbl">${UI.esc(label)}</div>
        <div class="val tabular">${tampil(nowVal)}</div>
        <div class="hint">${delta(nowVal, prevVal)} <span class="text-muted">vs ${UI.labelBulan(ovBulanA)}</span></div></div>`;

    w.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="flex-1"><h2>Perbandingan Antar Bulan</h2>
            <div class="sub">${UI.labelBulan(ovBulanB)} dibandingkan ${UI.labelBulan(ovBulanA)}${
              ovBulanB === UI.bulanIni() ? ' — bulan berjalan, belum lengkap' : ''}</div></div>
          <button class="btn btn-secondary btn-sm" id="ovSwap" title="Tukar bulan">⇄</button>
        </div>
        <div class="card-body">
          <div class="flex gap-16 flex-wrap mb-16">
            <div class="flex items-center gap-8">
              <label class="mb-0">Bulan pembanding</label>
              <button class="btn btn-secondary btn-sm" id="ovAPrev">‹</button>
              <input type="month" id="ovABulan" class="control-auto" value="${ovBulanA}">
              <button class="btn btn-secondary btn-sm" id="ovANext">›</button>
            </div>
            <div class="flex items-center gap-8">
              <label class="mb-0">Bulan ini</label>
              <button class="btn btn-secondary btn-sm" id="ovBPrev">‹</button>
              <input type="month" id="ovBBulan" class="control-auto" value="${ovBulanB}">
              <button class="btn btn-secondary btn-sm" id="ovBNext">›</button>
            </div>
          </div>
          <div class="grid grid-4">
            ${kartu('Total Kunjungan', B.total, A.total, v => v, badgeDelta)}
            ${kartu('Pasien Baru', B.baru, A.baru, v => v, badgeDelta)}
            ${kartu('Pasien Lama', B.lama, A.lama, v => v, badgeDelta)}
            ${kartu('Uang Masuk', B.uangMasuk, A.uangMasuk, UI.rupiah, badgeDelta)}
            ${kartu('Peserta BPJS', B.pctBpjs, A.pctBpjs, v => v.toFixed(1) + '%', badgeDeltaPP)}
            ${kartu('% Pasien Baru', B.pctBaru, A.pctBaru, v => v.toFixed(1) + '%', badgeDeltaPP)}
            ${kartu('Rujukan', B.rujukan, A.rujukan, v => v, badgeDelta)}
            ${kartu('Rata-rata/Hari Buka', B.rataPerHariAktif, A.rataPerHariAktif, v => v.toFixed(1), badgeDelta)}
          </div>
        </div>
      </div>`;

    const gantiA = (kunci) => { ovBulanA = kunci; gambarBanding(w, data); };
    const gantiB = (kunci) => { ovBulanB = kunci; gambarBanding(w, data); };
    w.querySelector('#ovAPrev').addEventListener('click', () => gantiA(UI.geserBulan(ovBulanA, -1)));
    w.querySelector('#ovANext').addEventListener('click', () => gantiA(UI.geserBulan(ovBulanA, 1)));
    w.querySelector('#ovABulan').addEventListener('change', (e) => gantiA(e.target.value));
    w.querySelector('#ovBPrev').addEventListener('click', () => gantiB(UI.geserBulan(ovBulanB, -1)));
    w.querySelector('#ovBNext').addEventListener('click', () => gantiB(UI.geserBulan(ovBulanB, 1)));
    w.querySelector('#ovBBulan').addEventListener('change', (e) => gantiB(e.target.value));
    w.querySelector('#ovSwap').addEventListener('click', () => {
      const t = ovBulanA; ovBulanA = ovBulanB; ovBulanB = t; gambarBanding(w, data);
    });
  }

  /* ---- D. Kalender heatmap bulanan ------------------------------------- */
  const OV_HEAT_WARNA = ['#F1F5F9', '#D6F2EE', '#8FDCD1', '#16A394', '#085048'];
  const OV_HEAT_TEKS  = ['#334155', '#334155', '#0F172A', '#FFFFFF', '#FFFFFF'];

  function gambarHeatmap(w, data) {
    if (!data.monthKeys.includes(ovBulanHeatmap)) ovBulanHeatmap = data.monthKeys[data.monthKeys.length - 1];
    const tanggalList = tanggalSebulan(ovBulanHeatmap);
    const peta = LaporanCore.rekapPerHari(data.kunjungan);
    const hari = UI.hariIni();
    const ambil = (r) => ovMetrikHeatmap === 'umum' ? r.umum : ovMetrikHeatmap === 'gigi' ? r.gigi : r.total;
    const nilai = tanggalList.map(t => ambil(peta.get(t) || LaporanCore.kunjunganKosong()));
    const maks = Math.max(1, ...nilai);
    const [y, m] = ovBulanHeatmap.split('-').map(Number);
    const offset = new Date(y, m - 1, 1).getDay();

    const kelasAktif = (m2) => m2 === ovMetrikHeatmap ? 'btn-primary' : 'btn-secondary';
    const hariBerjalan = tanggalList.filter(t => t <= hari).length;
    const hariAktif = tanggalList.filter((t, i) => t <= hari && nilai[i] > 0).length;
    const totalBulan = nilai.reduce((a, b) => a + b, 0);
    let idxMaks = -1;
    nilai.forEach((v, i) => { if (v > 0 && (idxMaks < 0 || v > nilai[idxMaks])) idxMaks = i; });

    w.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="flex-1"><h2>Kalender Kunjungan</h2><div class="sub">Intensitas kunjungan per hari.</div></div>
          <div class="btn-group mr-8">
            <button class="btn btn-sm ${kelasAktif('total')}" data-m="total">Total</button>
            <button class="btn btn-sm ${kelasAktif('umum')}" data-m="umum">Umum</button>
            <button class="btn btn-sm ${kelasAktif('gigi')}" data-m="gigi">Gigi</button>
          </div>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm" id="hmPrev">‹</button>
            <input type="month" id="hmBulan" class="control-auto" value="${ovBulanHeatmap}">
            <button class="btn btn-secondary btn-sm" id="hmNext">›</button>
          </div>
        </div>
        <div class="card-body">
          <div class="heatmap-grid mb-4">
            ${UI.HARI.map(h => `<div class="text-center text-muted text-xs">${h.slice(0, 3)}</div>`).join('')}
          </div>
          <div class="heatmap-grid">
            ${Array(offset).fill('<div></div>').join('')}
            ${tanggalList.map((t, i) => {
              if (t > hari) {
                return `<div class="heat-cell heat-future">${i + 1}</div>`;
              }
              const level = nilai[i] === 0 ? 0 : Math.min(4, Math.ceil(nilai[i] / maks * 4));
              return `<div title="${UI.tglIndo(t)}: ${nilai[i]}" class="heat-cell heat-${level}">${i + 1}</div>`;
            }).join('')}
          </div>
          <div class="grid grid-3 mt-16">
            <div class="stat"><div class="lbl">Total bulan ini</div><div class="val tabular">${totalBulan}</div></div>
            <div class="stat"><div class="lbl">Hari ada kunjungan</div>
              <div class="val tabular">${hariAktif}/${hariBerjalan}</div></div>
            <div class="stat"><div class="lbl">Tersibuk</div>
              <div class="val tabular">${idxMaks >= 0 ? nilai[idxMaks] : '—'}</div>
              <div class="hint">${idxMaks >= 0 ? UI.tglIndo(tanggalList[idxMaks]) : ''}</div></div>
          </div>
        </div>
      </div>`;

    w.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => {
      ovMetrikHeatmap = b.dataset.m; gambarHeatmap(w, data);
    }));
    w.querySelector('#hmPrev').addEventListener('click', () => { ovBulanHeatmap = UI.geserBulan(ovBulanHeatmap, -1); gambarHeatmap(w, data); });
    w.querySelector('#hmNext').addEventListener('click', () => { ovBulanHeatmap = UI.geserBulan(ovBulanHeatmap, 1); gambarHeatmap(w, data); });
    w.querySelector('#hmBulan').addEventListener('change', (e) => { ovBulanHeatmap = e.target.value; gambarHeatmap(w, data); });
  }

  /* ---- E. Pola jam kunjungan (Chart.js bar, per bulan) ----------------- */
  async function gambarJam(w, data) {
    if (!data.monthKeys.includes(ovBulanJam)) ovBulanJam = data.monthKeys[data.monthKeys.length - 1];
    const rows = data.kunjungan.filter(k => LaporanCore.kunciBulan(k.tanggal) === ovBulanJam);
    const rekap = LaporanCore.rekapJamKunjungan(rows);
    const labelJam = [];
    for (let j = rekap.jamAwal; j < rekap.jamAkhir; j++) {
      labelJam.push(`${String(j).padStart(2, '0')}–${String(j + 1).padStart(2, '0')}`);
    }
    let idxSibuk = -1;
    rekap.ember.forEach((v, i) => { if (idxSibuk < 0 || v > rekap.ember[idxSibuk]) idxSibuk = i; });

    w.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="flex-1"><h2>Pola Jam Kunjungan</h2>
            <div class="sub">Pukul ${rekap.jamAwal}.00–${rekap.jamAkhir}.00, seluruh poli.</div></div>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm" id="jamPrev">‹</button>
            <input type="month" id="jamBulan" class="control-auto" value="${ovBulanJam}">
            <button class="btn btn-secondary btn-sm" id="jamNext">›</button>
          </div>
        </div>
        <div class="card-body">
          <div id="jamGrafikBox" class="chart-box"><canvas id="jamCanvas"></canvas></div>
          <div class="grid grid-4 mt-16">
            <div class="stat"><div class="lbl">Terpetakan</div><div class="val tabular">${rekap.terhitung}/${rekap.total}</div></div>
            <div class="stat"><div class="lbl">Jam tersibuk</div>
              <div class="val tabular">${idxSibuk >= 0 ? labelJam[idxSibuk] : '—'}</div>
              <div class="hint">${idxSibuk >= 0 ? rekap.ember[idxSibuk] + ' kunjungan' : ''}</div></div>
            <div class="stat"><div class="lbl">Rata-rata/slot jam</div>
              <div class="val tabular">${rekap.ember.length ? (rekap.terhitung / rekap.ember.length).toFixed(1) : '0'}</div></div>
            <div class="stat"><div class="lbl">Tanpa jam tercatat</div><div class="val tabular">${rekap.tanpaJam}</div></div>
          </div>
        </div>
      </div>`;

    w.querySelector('#jamPrev').addEventListener('click', () => { ovBulanJam = UI.geserBulan(ovBulanJam, -1); gambarJam(w, data); });
    w.querySelector('#jamNext').addEventListener('click', () => { ovBulanJam = UI.geserBulan(ovBulanJam, 1); gambarJam(w, data); });
    w.querySelector('#jamBulan').addEventListener('change', (e) => { ovBulanJam = e.target.value; gambarJam(w, data); });

    if (await siapkanChart()) {
      const warnaBar = rekap.ember.map((v, i) => i === idxSibuk ? '#085048' : '#0F8B7E');
      buatGrafik('jam', w.querySelector('#jamCanvas'), {
        type: 'bar',
        data: { labels: labelJam, datasets: [{ label: 'Kunjungan', data: rekap.ember, backgroundColor: warnaBar }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false },
            tooltip: { callbacks: { title: (items) => 'Pukul ' + items[0].label } } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    } else {
      w.querySelector('#jamGrafikBox').innerHTML =
        '<div class="banner warn"><div>Grafik tidak dapat dimuat tanpa koneksi internet.</div></div>';
    }
  }

  /* ---- F. Kinerja dokter (daftar peringkat, per bulan) ------------------ */
  function gambarDokter(w, data) {
    if (!data.monthKeys.includes(ovBulanDokter)) ovBulanDokter = data.monthKeys[data.monthKeys.length - 1];
    const rows = data.kunjungan.filter(k => LaporanCore.kunciBulan(k.tanggal) === ovBulanDokter);
    const daftar = LaporanCore.rekapDokter(rows);
    const diisi = daftar.filter(d => !d.kosong);
    const totalPasien = daftar.reduce((a, d) => a + d.jml, 0);
    const totalDiisi = diisi.reduce((a, d) => a + d.jml, 0);
    const maks = Math.max(1, ...daftar.map(d => d.jml));

    w.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="flex-1"><h2>Kinerja Dokter</h2><div class="sub">${UI.labelBulan(ovBulanDokter)}</div></div>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm" id="dokPrev">‹</button>
            <input type="month" id="dokBulan" class="control-auto" value="${ovBulanDokter}">
            <button class="btn btn-secondary btn-sm" id="dokNext">›</button>
          </div>
        </div>
        <div class="card-body">
          ${!daftar.length ? '<p class="text-muted mb-0">Belum ada kunjungan bulan ini.</p>' : daftar.map((d, i) => `
            <div class="mb-12">
              <div class="flex justify-between items-center gap-8 mb-8">
                <div class="flex items-center gap-8 min-w-0">
                  <span class="badge badge-num ${i < 3 && !d.kosong ? 'b-ok' : 'b-umum'}">${i + 1}</span>
                  <b>${UI.esc(d.nama)}</b>
                  <span class="badge ${badgePoliKelas(d.jenisPoli)}">${UI.esc(d.jenisPoli)}</span>
                </div>
                <b class="tabular">${d.jml} <span class="text-muted text-xs">(${totalPasien ? Math.round(d.jml / totalPasien * 100) : 0}%)</span></b>
              </div>
              <div class="bar-track">
                <div class="bar-fill${d.kosong ? ' muted' : ''}" style="width:${d.jml / maks * 100}%"></div>
              </div>
            </div>`).join('')}
          ${daftar.length ? `<div class="grid grid-3 mt-16">
            <div class="stat"><div class="lbl">Total diperiksa</div><div class="val tabular">${totalPasien}</div></div>
            <div class="stat"><div class="lbl">Dokter bertugas</div><div class="val tabular">${diisi.length}</div></div>
            <div class="stat"><div class="lbl">Rata-rata/dokter</div>
              <div class="val tabular">${diisi.length ? (totalDiisi / diisi.length).toFixed(1) : '0'}</div></div>
          </div>` : ''}
        </div>
      </div>`;

    w.querySelector('#dokPrev').addEventListener('click', () => { ovBulanDokter = UI.geserBulan(ovBulanDokter, -1); gambarDokter(w, data); });
    w.querySelector('#dokNext').addEventListener('click', () => { ovBulanDokter = UI.geserBulan(ovBulanDokter, 1); gambarDokter(w, data); });
    w.querySelector('#dokBulan').addEventListener('change', (e) => { ovBulanDokter = e.target.value; gambarDokter(w, data); });
  }

  /* ---- G. Enam grafik performa 6 bulan (Chart.js) ---------------------- */
  function grafikBox(kunci, judul) {
    return `<div class="card"><div class="card-head"><h2>${UI.esc(judul)}</h2></div>
      <div class="card-body"><div id="grafik-box-${kunci}" class="chart-box tall">
        <canvas id="grafik-${kunci}"></canvas></div></div></div>`;
  }

  async function gambarGrafikBulanan(w, data) {
    const mk = data.monthKeys;
    const labels = mk.map(LaporanCore.labelBulanPendek);
    const kv = LaporanCore.rekapPerBulan(data.kunjungan, mk);
    const rjAsal = LaporanCore.rekapAsalRujukanPerBulan(data.kunjungan, mk);
    const um = LaporanCore.rekapUangMasukPerBulan(data.pembayaran, mk, true);

    w.innerHTML =
      grafikBox('kunjunganBulan', 'Kunjungan per Bulan (Total Pemeriksaan)') +
      grafikBox('pendapatanBulan', 'Uang Masuk per Bulan (Total)') +
      grafikBox('bpjsBulan', 'BPJS vs Non-BPJS per Bulan') +
      grafikBox('baruLamaBulan', 'Pasien Baru vs Lama per Bulan') +
      grafikBox('rujukanBulan', 'Tren Asal Rujukan per Bulan') +
      grafikBox('kategoriLabBulan', 'Distribusi Kategori Pemeriksaan (6 Bulan)');

    if (!(await siapkanChart())) {
      w.innerHTML = '<div class="banner warn"><div>Grafik tidak dapat dimuat tanpa koneksi internet.</div></div>';
      return;
    }

    buatGrafik('kunjunganBulan', w.querySelector('#grafik-kunjunganBulan'), {
      type: 'bar',
      data: {
        labels, datasets: [
          { label: 'Total Pemeriksaan', data: kv.map(x => x.total), backgroundColor: '#1D4ED8' }
        ]
      },
      options: OPSI_BAR
    });

    buatGrafik('pendapatanBulan', w.querySelector('#grafik-pendapatanBulan'), {
      type: 'bar',
      data: {
        labels, datasets: [
          { label: 'Total Pendapatan', data: um.map(x => x.total), backgroundColor: '#15803D' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (i) => `${i.dataset.label}: ${UI.rupiah(i.raw)}` } }
        },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => ringkasRp(v) } } }
      }
    });

    buatGrafik('bpjsBulan', w.querySelector('#grafik-bpjsBulan'), {
      type: 'bar',
      data: {
        labels, datasets: [
          { label: 'BPJS', data: kv.map(x => x.bpjs), backgroundColor: '#0F8B7E' },
          { label: 'Non-BPJS', data: kv.map(x => x.nonBpjs), backgroundColor: '#94A3B8' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } }
      }
    });

    buatGrafik('baruLamaBulan', w.querySelector('#grafik-baruLamaBulan'), {
      type: 'bar',
      data: {
        labels, datasets: [
          { label: 'Baru', data: kv.map(x => x.baru), backgroundColor: '#15803D' },
          { label: 'Lama', data: kv.map(x => x.lama), backgroundColor: '#CBD5E1' }
        ]
      },
      options: OPSI_BAR
    });

    buatGrafik('rujukanBulan', w.querySelector('#grafik-rujukanBulan'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Dokter Luar', data: rjAsal.map(x => x.dokterLuar), backgroundColor: '#1D4ED8' },
          { label: 'Faskes / RS Luar', data: rjAsal.map(x => x.faskes), backgroundColor: '#0F8B7E' },
          { label: 'Atas Permintaan Sendiri (APS)', data: rjAsal.map(x => x.aps), backgroundColor: '#F59E0B' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const total = items.reduce((s, it) => s + (Number(it.raw) || 0), 0);
                return `Total Kunjungan: ${total}`;
              }
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });

    // Donut Chart: Distribusi Kategori Pemeriksaan Lab (Hematologi, Kimia, dll.)
    try {
      const kategoriData = await DB.distribusiKategoriLab({ dari: mk[0] + '-01', sampai: UI.hariIni() });
      const katLabels = (kategoriData || []).map(k => k.kelompok);
      const katJml = (kategoriData || []).map(k => k.jml);
      const warnaKategori = [
        '#0F8B7E', '#1D4ED8', '#8B5CF6', '#F59E0B',
        '#EC4899', '#06B6D4', '#10B981', '#64748B', '#E11D48'
      ];

      buatGrafik('kategoriLabBulan', w.querySelector('#grafik-kategoriLabBulan'), {
        type: 'doughnut',
        data: {
          labels: katLabels.length ? katLabels : ['Belum ada pemeriksaan'],
          datasets: [{
            data: katJml.length ? katJml : [1],
            backgroundColor: katJml.length ? warnaKategori.slice(0, katLabels.length) : ['#E2E8F0'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (item) => {
                  if (!katJml.length) return ' Belum ada data pemeriksaan';
                  const total = katJml.reduce((a, b) => a + b, 0);
                  const val = item.raw || 0;
                  const pct = total ? Math.round(val / total * 100) : 0;
                  return ` ${item.label}: ${val} tes (${pct}%)`;
                }
              }
            }
          }
        }
      });
    } catch (errKat) {
      console.warn('Gagal memuat distribusi kategori lab:', errKat);
    }
  }

  /* ==================================================================== */
  /*  TAB 3 — RUJUKAN                                                     */
  /* ==================================================================== */

  const KOLOM_RUJUKAN = [
    ['tanggal', 'Tanggal'], ['no_rm', 'No RM'], ['nama_pasien', 'Nama Pasien'],
    ['no_bpjs', 'No BPJS'], ['no_hp', 'No HP'], ['nama_poli_asal', 'Poli Asal'], ['nama_dokter', 'Dokter'],
    ['jenis_rujukan', 'Jenis Rujukan', r => LaporanCore.labelJenisRujukan(r.jenis_rujukan)],
    ['tujuan', 'Tujuan', r => LaporanCore.tujuanRujukan(r).teks],
    ['rujuk_alasan', 'Alasan'], ['daftar_diagnosa', 'Diagnosa']
  ];

  function badgeRujukanKelas(kode) {
    if (kode === 'RUJUK_IGD') return 'b-danger';
    if (kode === 'RUJUK_LANJUT') return 'b-bpjs';
    return 'b-info';
  }

  async function tabRujukan(w) {
    const akhir = UI.hariIni();
    const awal = UI.bulanIni() + '-01';
    w.innerHTML = `
      <div class="card mb-16"><div class="card-body">
        <div class="flex items-center gap-12 flex-wrap">
          <div class="flex items-center gap-8 periode-group">
            <label class="mb-0">Periode</label>
            <input type="date" id="rjDari" value="${awal}" class="control-auto">
            <span class="text-muted">s.d.</span>
            <input type="date" id="rjSampai" value="${akhir}" class="control-auto">
          </div>
          <select id="rjJenis" class="control-auto">
            <option value="">Semua jenis rujukan</option>
            <option value="RUJUK_INTERNAL">Rujukan Internal</option>
            <option value="RUJUK_LANJUT">Rujukan Lanjut (BPJS)</option>
            <option value="RUJUK_IGD">Rujukan IGD</option>
          </select>
          <button class="btn btn-primary btn-sm" id="rjTampil">Tampilkan</button>
          <div class="search-box min-w-200">
            <span class="ico">${UI.ikon('cari', 16)}</span>
            <input type="search" id="rjCari" placeholder="Cari nama, no. RM, atau no. BPJS…">
          </div>
          <div class="flex-1"></div>
          <button class="btn btn-secondary btn-sm" id="rjUnduh">${UI.ikon('unduh', 15)} Unduh CSV</button>
        </div>
      </div></div>
      <div id="rjIsi">${UI.memuat(4)}</div>`;

    let rows = [];
    const muat = async () => {
      const dari = w.querySelector('#rjDari').value, sampai = w.querySelector('#rjSampai').value;
      const isi = w.querySelector('#rjIsi');
      isi.innerHTML = UI.memuat(4);
      try {
        rows = await DB.laporanRujukan({ dari, sampai });
        saring();
      } catch (e) { isi.innerHTML = `<div class="banner err"><div>${UI.esc(e.message)}</div></div>`; }
    };

    const saring = () => {
      const jenis = w.querySelector('#rjJenis').value;
      const q = w.querySelector('#rjCari').value.trim().toLowerCase();
      let tampil = rows;
      if (jenis) tampil = tampil.filter(r => r.jenis_rujukan === jenis);
      if (q) tampil = tampil.filter(r =>
        (r.nama_pasien || '').toLowerCase().includes(q) ||
        (r.no_rm || '').toLowerCase().includes(q) ||
        (r.no_bpjs || '').includes(q));
      gambarRujukan(w.querySelector('#rjIsi'), tampil);
    };

    w.querySelector('#rjTampil').addEventListener('click', muat);
    w.querySelector('#rjJenis').addEventListener('change', saring);
    w.querySelector('#rjCari').addEventListener('input', UI.tunda(saring, 250));
    w.querySelector('#rjUnduh').addEventListener('click', () => unduhCsv(rows, KOLOM_RUJUKAN,
      `rujukan_${w.querySelector('#rjDari').value}_sd_${w.querySelector('#rjSampai').value}.csv`));

    await muat();
  }

  function gambarRujukan(w, rows) {
    if (!rows.length) { w.innerHTML = UI.kosong('Tidak ada rujukan', 'Tidak ada rujukan pada periode dan filter ini.'); return; }
    w.innerHTML = `
      <div class="card"><div class="card-body tight"><div class="table-wrap"><table>
        <thead><tr><th>Tanggal</th><th>Pasien</th><th>Poli / Dokter</th><th>Jenis</th><th>Tujuan</th><th>Diagnosa</th></tr></thead>
        <tbody>${rows.map(r => {
          const t = LaporanCore.tujuanRujukan(r);
          return `<tr>
            <td>${UI.tglPendek(r.tanggal)}</td>
            <td><b>${UI.esc(r.nama_pasien)}</b><div class="text-muted mono text-xs">${UI.esc(r.no_rm)}</div></td>
            <td>${UI.esc(r.nama_poli_asal || '—')}${r.nama_dokter ? '<div class="text-muted text-xs">' + UI.esc(r.nama_dokter) + '</div>' : ''}</td>
            <td><span class="badge ${badgeRujukanKelas(r.jenis_rujukan)}">${UI.esc(LaporanCore.labelJenisRujukan(r.jenis_rujukan))}</span></td>
            <td>${UI.esc(t.teks)}${t.rinci.length ? '<div class="text-muted text-xs">' + t.rinci.map(x => UI.esc(x)).join(' · ') + '</div>' : ''}</td>
            <td>${UI.esc(r.daftar_diagnosa || '—')}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div></div></div>`;
  }

  /* ==================================================================== */
  /*  TAB 4 — REGISTRASI LAB (Murni pendaftaran pasien laboratorium)     */
  /* ==================================================================== */

  const KOLOM_REGISTRASI_LAB = [
    ['no', 'No', (r, i) => (i != null ? i + 1 : '')],
    ['tanggal', 'Tanggal'],
    ['jam', 'Jam', r => (r.jam_daftar != null ? String(r.jam_daftar).padStart(2, '0') + ':00' : (r.waktu_daftar ? r.waktu_daftar.slice(11, 16) : '—'))],
    ['no_kunjungan', 'No Registrasi'],
    ['no_rm', 'No RM'],
    ['nama_pasien', 'Nama Pasien'],
    ['jenis_kelamin', 'L/P'],
    ['tanggal_lahir', 'Tgl Lahir'],
    ['umur', 'Umur', r => (r.tanggal_lahir ? UI.umurTeks(r.tanggal_lahir) : '—')],
    ['no_hp', 'No HP / Kontak'],
    ['cara_bayar', 'Cara Bayar'],
    ['nama_dokter', 'Dokter / Pengirim', r => (r.nama_dokter || 'APS (Atas Permintaan Sendiri)')],
    ['status', 'Status']
  ];

  async function tabRegister(w) {
    const akhir = UI.hariIni();
    const awal = UI.bulanIni() + '-01';
    w.innerHTML = `
      <div class="card mb-16"><div class="card-body">
        <div class="flex items-center gap-12 flex-wrap">
          <div class="flex items-center gap-8 periode-group">
            <label class="mb-0">Periode</label>
            <input type="date" id="rgDari" value="${awal}" class="control-auto">
            <span class="text-muted">s.d.</span>
            <input type="date" id="rgSampai" value="${akhir}" class="control-auto">
          </div>
          <select id="rgCaraBayar" class="control-auto" title="Filter Cara Bayar / Penjamin">
            <option value="">Semua Cara Bayar</option>
            <option value="UMUM">Umum / Mandiri</option>
            <option value="BPJS">BPJS Kesehatan</option>
            <option value="TRANSFER">Transfer</option>
            <option value="PERUSAHAAN">Perusahaan / Rekanan</option>
          </select>
          <select id="rgStatus" class="control-auto" title="Filter Status Pelayanan">
            <option value="">Semua Status</option>
            <option value="SELESAI">Selesai</option>
            <option value="ANTRI">Antre / Dalam Proses</option>
          </select>
          <button class="btn btn-primary btn-sm" id="rgTampil">Tampilkan</button>
          <div class="search-box min-w-200">
            <span class="ico">${UI.ikon('cari', 16)}</span>
            <input type="search" id="rgCari" placeholder="Cari nama, no. RM, atau no. registrasi…">
          </div>
          <div class="flex-1"></div>
          <button class="btn btn-secondary btn-sm" id="rgUnduh">${UI.ikon('unduh', 15)} Unduh CSV Registrasi</button>
        </div>
      </div></div>
      <div id="rgIsi">${UI.memuat(4)}</div>`;

    let rows = [];
    const muat = async () => {
      const dari = w.querySelector('#rgDari').value, sampai = w.querySelector('#rgSampai').value;
      const isi = w.querySelector('#rgIsi');
      isi.innerHTML = UI.memuat(4);
      try {
        // Ambil data riil pendaftaran kunjungan laboratorium
        rows = await DB.laporanRegisterPoli({ dari, sampai });
        saring();
      } catch (e) { isi.innerHTML = `<div class="banner err"><div>${UI.esc(e.message)}</div></div>`; }
    };

    const saring = () => {
      const q = w.querySelector('#rgCari').value.trim().toLowerCase();
      const cb = w.querySelector('#rgCaraBayar').value;
      const st = w.querySelector('#rgStatus').value;

      let tampil = rows;
      if (cb) tampil = tampil.filter(r => (r.cara_bayar || '').toUpperCase() === cb.toUpperCase());
      if (st) tampil = tampil.filter(r => (r.status || '').toUpperCase() === st.toUpperCase());
      if (q) {
        tampil = tampil.filter(r =>
          (r.nama_pasien || '').toLowerCase().includes(q) ||
          (r.no_rm || '').toLowerCase().includes(q) ||
          (r.no_kunjungan || '').toLowerCase().includes(q) ||
          (r.no_hp || '').toLowerCase().includes(q)
        );
      }
      gambarRegister(w.querySelector('#rgIsi'), tampil);
    };

    w.querySelector('#rgTampil').addEventListener('click', muat);
    w.querySelector('#rgCaraBayar').addEventListener('change', saring);
    w.querySelector('#rgStatus').addEventListener('change', saring);
    w.querySelector('#rgCari').addEventListener('input', UI.tunda(saring, 250));
    w.querySelector('#rgUnduh').addEventListener('click', () => {
      const q = w.querySelector('#rgCari').value.trim().toLowerCase();
      const cb = w.querySelector('#rgCaraBayar').value;
      const st = w.querySelector('#rgStatus').value;
      let unduhRows = rows;
      if (cb) unduhRows = unduhRows.filter(r => (r.cara_bayar || '').toUpperCase() === cb.toUpperCase());
      if (st) unduhRows = unduhRows.filter(r => (r.status || '').toUpperCase() === st.toUpperCase());
      if (q) {
        unduhRows = unduhRows.filter(r =>
          (r.nama_pasien || '').toLowerCase().includes(q) ||
          (r.no_rm || '').toLowerCase().includes(q) ||
          (r.no_kunjungan || '').toLowerCase().includes(q)
        );
      }
      unduhCsv(unduhRows, KOLOM_REGISTRASI_LAB, `registrasi-lab_${w.querySelector('#rgDari').value}_sd_${w.querySelector('#rgSampai').value}.csv`);
    });

    await muat();
  }

  function gambarRegister(w, rows) {
    if (!rows.length) {
      w.innerHTML = UI.kosong('Tidak ada pendaftaran', 'Tidak ada data registrasi pasien pada periode dan filter ini.');
      return;
    }
    w.innerHTML = `
      <div class="card"><div class="card-body tight"><div class="table-wrap"><table>
        <thead><tr>
          <th style="width:40px;">No</th>
          <th>Waktu Pendaftaran</th>
          <th>No. Registrasi</th>
          <th>Data Pasien</th>
          <th>L/P</th>
          <th>Umur</th>
          <th>No. HP / Kontak</th>
          <th>Cara Bayar</th>
          <th>Dokter / Pengirim</th>
          <th>Status</th>
        </tr></thead>
        <tbody>${rows.map((r, i) => {
          const jamTeks = r.jam_daftar != null
            ? String(r.jam_daftar).padStart(2, '0') + ':00'
            : (r.waktu_daftar ? r.waktu_daftar.slice(11, 16) : '');
          const statusBadge = r.status === 'SELESAI'
            ? '<span class="badge b-ok">Selesai</span>'
            : (r.status === 'BATAL' ? '<span class="badge b-danger">Batal</span>' : '<span class="badge b-warn">Antre</span>');
          const dokterTeks = r.nama_dokter || '<span class="text-muted">APS (Atas Permintaan Sendiri)</span>';
          return `<tr>
            <td class="text-muted text-xs">${i + 1}</td>
            <td>
              <b>${UI.tglPendek(r.tanggal)}</b>
              ${jamTeks ? `<div class="text-xs text-muted tabular">${jamTeks}</div>` : ''}
            </td>
            <td><b class="mono text-xs">${UI.esc(r.no_kunjungan)}</b></td>
            <td>
              <b>${UI.esc(r.nama_pasien)}</b>
              <div class="text-muted mono text-xs">${UI.esc(r.no_rm)}</div>
            </td>
            <td>${UI.esc(r.jenis_kelamin || '—')}</td>
            <td>${r.tanggal_lahir ? UI.umurTeks(r.tanggal_lahir) : '—'}</td>
            <td><span class="text-xs">${UI.esc(r.no_hp || '—')}</span></td>
            <td>${UI.badgeBayar(r.cara_bayar)}</td>
            <td>${dokterTeks}</td>
            <td>${statusBadge}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div></div></div>`;
  }

  /* ==================================================================== */
  /*  TAB 5 — KEUANGAN                                                    */
  /* ==================================================================== */

  const KOLOM_KEUANGAN_HARIAN = [
    ['tanggal', 'Tanggal'], ['nilaiLayanan', 'Nilai Layanan'], ['ditagih', 'Ditagih'], ['uangMasuk', 'Uang Masuk']
  ];

  /* Gabungan per-hari nilai_layanan (tagihan) & uang_masuk (pembayaran) —
     murni penjumlahan per kunci tanggal, bukan aturan bisnis yang mudah
     salah (beda dengan kategoriUsia atau jam_daftar), jadi cukup di sini
     tanpa perlu diuji terpisah di laporan_core.js. */
  function gabungKeuanganHarian(tagihan, pembayaran) {
    const peta = new Map();
    const ambil = (t) => {
      if (!peta.has(t)) peta.set(t, { tanggal: t, nilaiLayanan: 0, ditagih: 0, uangMasuk: 0 });
      return peta.get(t);
    };
    (tagihan || []).forEach(r => {
      const a = ambil(r.tanggal);
      a.nilaiLayanan += Number(r.nilai_layanan) || 0;
      a.ditagih += Number(r.ditagih) || 0;
    });
    (pembayaran || []).forEach(r => { ambil(r.tanggal).uangMasuk += Number(r.uang_masuk) || 0; });
    return Array.from(peta.values()).sort((a, b) => a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : 0);
  }

  function rekapPerKunci(rows, kunci, medan) {
    const peta = new Map();
    (rows || []).forEach(r => {
      const k = r[kunci] || '—';
      if (!peta.has(k)) peta.set(k, Object.fromEntries(medan.map(m => [m, 0])));
      const acc = peta.get(k);
      medan.forEach(m => { acc[m] += Number(r[m]) || 0; });
    });
    return Array.from(peta.entries()).map(([k, v]) => ({ kunci: k, ...v }));
  }

  async function tabKeuangan(w) {
    const akhir = UI.hariIni();
    const awal = UI.bulanIni() + '-01';
    w.innerHTML = `
      <div class="card mb-16"><div class="card-body">
        <div class="flex items-center gap-12 flex-wrap">
          <div class="flex items-center gap-8 periode-group">
            <label class="mb-0">Periode</label>
            <input type="date" id="kuDari" value="${awal}" class="control-auto">
            <span class="text-muted">s.d.</span>
            <input type="date" id="kuSampai" value="${akhir}" class="control-auto">
          </div>
          <button class="btn btn-primary btn-sm" id="kuTampil">Tampilkan</button>
          <div class="flex-1"></div>
          <button class="btn btn-secondary btn-sm" id="kuUnduh">${UI.ikon('unduh', 15)} Unduh CSV</button>
        </div>
      </div></div>
      <div id="kuIsi">${UI.memuat(4)}</div>`;

    let harian = [];
    const muat = async () => {
      const dari = w.querySelector('#kuDari').value, sampai = w.querySelector('#kuSampai').value;
      const isi = w.querySelector('#kuIsi');
      isi.innerHTML = UI.memuat(4);
      try {
        const [tagihan, pembayaran] = await Promise.all([
          DB.laporanKeuanganTagihan({ dari, sampai }),
          DB.laporanKeuanganPembayaran({ dari, sampai })
        ]);
        harian = gabungKeuanganHarian(tagihan, pembayaran);
        gambarKeuangan(isi, tagihan, pembayaran, harian);
      } catch (e) { isi.innerHTML = `<div class="banner err"><div>${UI.esc(e.message)}</div></div>`; }
    };

    w.querySelector('#kuTampil').addEventListener('click', muat);
    w.querySelector('#kuUnduh').addEventListener('click', () => unduhCsv(harian, KOLOM_KEUANGAN_HARIAN,
      `keuangan_${w.querySelector('#kuDari').value}_sd_${w.querySelector('#kuSampai').value}.csv`));

    await muat();
  }

  function gambarKeuangan(w, tagihan, pembayaran, harian) {
    const totalNilai = tagihan.reduce((a, r) => a + (Number(r.nilai_layanan) || 0), 0);
    const totalDitagih = tagihan.reduce((a, r) => a + (Number(r.ditagih) || 0), 0);
    const totalDibayar = tagihan.reduce((a, r) => a + (Number(r.sudah_dibayar) || 0), 0);
    const totalMasuk = pembayaran.reduce((a, r) => a + (Number(r.uang_masuk) || 0), 0);
    const totalPiutang = Math.max(0, totalDitagih - totalDibayar);

    const LABEL_METODE = {
      tunai: 'Tunai', transfer: 'Transfer Bank', qris: 'QRIS',
      debit: 'Kartu Debit', kartu_kredit: 'Kartu Kredit', lainnya: 'Lainnya'
    };

    // Di laboratorium medis, pengelompokan penjamin/cara bayar jauh lebih relevan daripada poli
    const perPenjamin = rekapPerKunci(tagihan, 'penjamin', ['nilai_layanan', 'ditagih']);
    const perPenjaminMasuk = rekapPerKunci(pembayaran, 'penjamin', ['uang_masuk']);
    const perMetode = rekapPerKunci(pembayaran, 'metode', ['uang_masuk', 'jumlah_transaksi']);

    // Gabungkan penjamin dari tagihan & pembayaran jika ada yang hanya muncul di salah satunya
    const semuaKunciPenjamin = Array.from(new Set([
      ...perPenjamin.map(p => p.kunci),
      ...perPenjaminMasuk.map(p => p.kunci)
    ]));

    w.innerHTML = `
      <div class="banner info mb-16">
        <div>
          <b>Catatan Keuangan:</b> "Nilai layanan" adalah nilai seluruh pemeriksaan lab pada periode ini (termasuk penjamin BPJS/rekanan).
          "Uang masuk" adalah kas riil yang benar-benar diterima kasir. Keduanya konsep akuntansi yang berbeda (akrual vs kas).
        </div>
      </div>

      <div class="grid grid-4 mb-16">
        <div class="stat accent">
          <div class="lbl">Nilai Layanan (Akrual)</div>
          <div class="val tabular">${UI.rupiah(totalNilai)}</div>
          <div class="hint">Total nilai seluruh tagihan</div>
        </div>
        <div class="stat">
          <div class="lbl">Ditagih ke Pasien/Rekanan</div>
          <div class="val tabular">${UI.rupiah(totalDitagih)}</div>
          <div class="hint">Setelah potongan &amp; diskon</div>
        </div>
        <div class="stat">
          <div class="lbl">Sisa Piutang (Belum Lunas)</div>
          <div class="val tabular ${totalPiutang > 0 ? 'text-warn' : 'text-success'}">${UI.rupiah(totalPiutang)}</div>
          <div class="hint">${totalPiutang > 0 ? '<span class="badge b-warn text-xs">Perlu Penagihan</span>' : '<span class="badge b-ok text-xs">Semua Tagihan Lunas</span>'}</div>
        </div>
        <div class="stat">
          <div class="lbl">Uang Masuk (Kas Kasir)</div>
          <div class="val tabular text-primary">${UI.rupiah(totalMasuk)}</div>
          <div class="hint">Kas riil diterima di kasir</div>
        </div>
      </div>

      <div class="split">
        <div class="card">
          <div class="card-head">
            <h2>Rekap Transaksi Harian</h2>
            <div class="sub">Rincian nilai layanan, tagihan, dan uang kas per tanggal</div>
          </div>
          <div class="card-body tight">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th class="text-right">Nilai Layanan</th>
                    <th class="text-right">Ditagih</th>
                    <th class="text-right">Uang Masuk</th>
                  </tr>
                </thead>
                <tbody>
                  ${harian.length ? harian.map(h => `
                    <tr>
                      <td><b>${UI.tglPendek(h.tanggal)}</b></td>
                      <td class="text-right tabular">${UI.rupiah(h.nilaiLayanan)}</td>
                      <td class="text-right tabular">${UI.rupiah(h.ditagih)}</td>
                      <td class="text-right tabular font-bold text-primary">${UI.rupiah(h.uangMasuk)}</td>
                    </tr>`).join('')
                    : '<tr><td colspan="4" class="text-muted text-center p-16">Tidak ada transaksi pada periode ini.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div class="card mb-16">
            <div class="card-head">
              <h2>Per Penjamin / Cara Bayar</h2>
              <div class="sub">Distribusi tagihan berdasarkan penjamin pasien</div>
            </div>
            <div class="card-body tight">
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Penjamin</th>
                      <th class="text-right">Nilai Tagihan</th>
                      <th class="text-right">Uang Masuk</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${semuaKunciPenjamin.length ? semuaKunciPenjamin.map(kunci => {
                        const t = perPenjamin.find(p => p.kunci === kunci);
                        const m = perPenjaminMasuk.find(p => p.kunci === kunci);
                        const nilaiLayanan = t ? t.nilai_layanan : 0;
                        const uangMasuk = m ? m.uang_masuk : 0;
                        const labelPenjamin = kunci === 'UMUM' ? 'Umum / Mandiri' : (kunci === 'BPJS' ? 'BPJS Kesehatan' : kunci);
                        return `
                          <tr>
                            <td><b>${UI.esc(labelPenjamin)}</b></td>
                            <td class="text-right tabular">${UI.rupiah(nilaiLayanan)}</td>
                            <td class="text-right tabular font-bold">${UI.rupiah(uangMasuk)}</td>
                          </tr>`;
                      }).join('')
                      : '<tr><td colspan="3" class="text-muted text-center p-16">Tidak ada data penjamin.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h2>Per Metode Pembayaran Kasir</h2>
              <div class="sub">Rekap penerimaan kas berdasarkan kanal bayar</div>
            </div>
            <div class="card-body tight">
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Metode</th>
                      <th class="text-right">Uang Masuk</th>
                      <th class="text-right">Jumlah Trx</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${perMetode.length ? perMetode.map(m => {
                        const namaMetode = LABEL_METODE[String(m.kunci).toLowerCase()] || m.kunci;
                        return `
                          <tr>
                            <td><span class="badge b-info">${UI.esc(namaMetode)}</span></td>
                            <td class="text-right tabular font-bold text-primary">${UI.rupiah(m.uang_masuk)}</td>
                            <td class="text-right tabular">${m.jumlah_transaksi} trx</td>
                          </tr>`;
                      }).join('')
                      : '<tr><td colspan="3" class="text-muted text-center p-16">Belum ada pembayaran.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  return { render };
})();
