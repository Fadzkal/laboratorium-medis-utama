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
    const bolehProlanis = bolehAdmin() || App.boleh('lab') || App.boleh('laporan');
    if (tabAktif !== 'ringkasan' && !bolehAdmin() && !(tabAktif === 'prolanis' && bolehProlanis)) tabAktif = 'ringkasan';

    const TAB = [
      ['ringkasan', 'Ringkasan'],
      ...(bolehAdmin() ? [
        ['overview', 'Overview & Tren'],
        ['rujukan', 'Rujukan'],
        ['register', 'Registrasi Lab'],
        ['prolanis', 'Ekspor Prolanis'],
        ['keuangan', 'Keuangan'],
        ['karyawan', 'Karyawan'],
      ] : (bolehProlanis ? [
        ['prolanis', 'Ekspor Prolanis']
      ] : []))
    ];

    el.innerHTML = `
      <div class="page-header mb-16">
        <div class="page-heading">
          <h1>Laporan</h1>
          <div class="page-sub">Rekap kunjungan, pemeriksaan laboratorium, rujukan, keuangan, dan kinerja staf.</div>
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
      if (tabAktif === 'prolanis')  return await tabProlanis(w);
      if (tabAktif === 'keuangan')  return await tabKeuangan(w);
      if (tabAktif === 'karyawan')  return await tabKaryawan(w);
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
              ${t.kelompok ? `<span class="badge ${t.kelompok === 'Pemeriksaan Fisik' ? 'b-ok' : 'b-info'} text-xs ml-4" style="font-size:11px;padding:2px 6px;">${UI.esc(t.kelompok)}</span>` : ''}
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
        const [kunjungan, labAntrean, labTop, kelompokList, kategoriData] = await Promise.all([
          DB.laporanKunjunganRingkas({ dari, sampai }),
          DB.laporanPermintaanLabRingkas({ dari, sampai }),
          DB.pemeriksaanLabTeratas({ dari, sampai, status: 'SELESAI', batas: 15 }),
          DB.daftarKelompokLab(),
          DB.distribusiKategoriLab({ dari, sampai })
        ]);
        gambarRingkasan(isi, kunjungan, labAntrean, labTop, kelompokList, dari, sampai, kategoriData);
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

  function gambarRingkasan(w, kunjungan, labAntrean, labTop, kelompokList, dari, sampai, kategoriData) {
    const totalKunjungan = kunjungan.length;
    const totalPermintaan = labAntrean.length;
    const selesaiLab = labAntrean.filter(l => l.status === 'SELESAI').length;
    const prosesLab = labAntrean.filter(l => l.status === 'DIMINTA' || l.status === 'DIKERJAKAN').length;
    const totalItemPeriksa = labAntrean.reduce((s, l) => s + (Number(l.jml_pemeriksaan) || 0), 0);
    const totalFisik = labAntrean.filter(l => l.ada_fisik).length || (labTop.find(t => t.nama === 'Pemeriksaan Fisik')?.jml || 0);
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
    if (kategoriData && kategoriData.length) {
      kategoriData.forEach(k => { perKelompok[k.kelompok] = k.jml; });
    } else {
      (labTop || []).forEach(t => {
        const k = t.kelompok || 'Lainnya';
        perKelompok[k] = (perKelompok[k] || 0) + t.jml;
      });
    }

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
          <div class="hint">${totalPermintaan ? (totalItemPeriksa / totalPermintaan).toFixed(1) : 0} tes / permintaan${totalFisik ? ` · ${totalFisik} fisik` : ''}</div>
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
                <div class="flex justify-between items-center row-line">
                  <span>Pemeriksaan Fisik (MCU)</span>
                  <span class="badge b-info tabular font-bold">${totalFisik} pasien</span>
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
    await gambarKalenderJadwal(w.querySelector('#ovHeatmap'), data);
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

  /* ---- D. Kalender Jadwal (Google Calendar Style) ----------------------- */
  let ovBulanJadwal = UI.bulanIni();

  async function gambarKalenderJadwal(w, data) {
    if (!w) return;
    if (data && data.monthKeys && !data.monthKeys.includes(ovBulanJadwal)) {
      ovBulanJadwal = data.monthKeys[data.monthKeys.length - 1];
    }
    const [y, m] = ovBulanJadwal.split('-').map(Number);
    const tanggalList = tanggalSebulan(ovBulanJadwal);
    const hari = UI.hariIni();
    const offset = new Date(y, m - 1, 1).getDay();

    const isMaster = (typeof App !== 'undefined' && App.siapa?.()?.peran === 'master') ||
                     (typeof Auth !== 'undefined' && Auth.pengguna?.peran === 'master');

    // Tampilkan kerangka awal dengan pemuat
    w.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="flex-1">
            <h2>Kalender Jadwal</h2>
            <div class="sub">Jadwal operasional, shift, dan agenda laboratorium.</div>
          </div>
          <div class="flex items-center gap-8">
            ${isMaster ? `<button class="btn btn-primary btn-sm" id="btnTambahJadwal">${UI.ikon('tambah', 14)} Tambah Jadwal</button>` : ''}
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm" id="jdPrev">‹</button>
              <input type="month" id="jdBulan" class="control-auto" value="${ovBulanJadwal}">
              <button class="btn btn-secondary btn-sm" id="jdNext">›</button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="p-16 text-center text-muted">${UI.memuat(2)}</div>
        </div>
      </div>
    `;

    // Ambil data jadwal dari DB
    let listJadwal = [];
    try {
      listJadwal = await DB.jadwalMuatBulan(y, m);
    } catch (err) {
      console.error('Gagal memuat kalender_jadwal:', err);
      listJadwal = [];
    }

    // Kelompokkan jadwal per tanggal
    const mapJadwal = new Map();
    listJadwal.forEach(j => {
      if (!j.tanggal) return;
      if (!mapJadwal.has(j.tanggal)) mapJadwal.set(j.tanggal, []);
      mapJadwal.get(j.tanggal).push(j);
    });

    // Urutkan jadwal per hari berdasarkan jam_mulai
    mapJadwal.forEach(arr => {
      arr.sort((a, b) => (a.jam_mulai || '00:00').localeCompare(b.jam_mulai || '00:00'));
    });

    const totalJadwal = listJadwal.length;
    const totalShift = listJadwal.filter(j => (j.kategori || '').toLowerCase().includes('shift')).length;
    const totalMendatang = listJadwal.filter(j => j.tanggal >= hari).length;

    w.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="flex-1">
            <h2>Kalender Jadwal</h2>
            <div class="sub">Jadwal operasional, shift, dan agenda laboratorium.</div>
          </div>
          <div class="flex items-center gap-8">
            ${isMaster ? `<button class="btn btn-primary btn-sm" id="btnTambahJadwal">${UI.ikon('tambah', 14)} Tambah Jadwal</button>` : ''}
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm" id="jdPrev">‹</button>
              <input type="month" id="jdBulan" class="control-auto" value="${ovBulanJadwal}">
              <button class="btn btn-secondary btn-sm" id="jdNext">›</button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <!-- Header 7 Kolom Hari -->
          <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; margin-bottom:6px;">
            ${['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((h, i) => `
              <div style="text-align:center; font-size:12px; font-weight:700; color:${i === 0 ? '#ef4444' : '#64748b'}; padding:4px 0;">${h}</div>
            `).join('')}
          </div>

          <!-- Grid Tanggal Google Calendar Style -->
          <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:6px;">
            ${Array(offset).fill('<div style="background:#f8fafc; border:1px dashed #e2e8f0; border-radius:6px; min-height:95px; opacity:0.6;"></div>').join('')}
            ${tanggalList.map((t, idx) => {
              const hariKe = idx + 1;
              const isHariIni = (t === hari);
              const jadwalHari = mapJadwal.get(t) || [];
              const dayOfWeek = (offset + idx) % 7;
              const isMinggu = (dayOfWeek === 0);

              return `
                <div class="jd-cell" data-tgl="${t}" style="
                  background: ${isHariIni ? '#eff6ff' : '#ffffff'};
                  border: ${isHariIni ? '2px solid #3b82f6' : '1px solid #e2e8f0'};
                  border-radius: 6px;
                  min-height: 95px;
                  padding: 5px;
                  display: flex;
                  flex-direction: column;
                  box-sizing: border-box;
                  transition: border-color 0.15s, box-shadow 0.15s;
                  cursor: pointer;
                ">
                  <!-- Header Tanggal -->
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="
                      font-size: 11px;
                      font-weight: 700;
                      ${isHariIni ? 'background:#2563eb; color:#ffffff; width:20px; height:20px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;' : isMinggu ? 'color:#ef4444;' : 'color:#475569;'}
                    ">${hariKe}</span>
                    ${jadwalHari.length > 0 ? `
                      <span style="font-size:10px; font-weight:700; color:#94a3b8;">${jadwalHari.length}</span>
                    ` : ''}
                  </div>

                  <!-- Daftar Pill Badge Jadwal -->
                  <div style="flex:1; display:flex; flex-direction:column; gap:2px; overflow:hidden;">
                    ${jadwalHari.slice(0, 3).map(j => `
                      <div class="jd-badge" data-jid="${j.id}" style="
                        background: ${j.warna_tag || '#2563eb'};
                        color: #ffffff;
                        font-size: 11px;
                        font-weight: 600;
                        padding: 2px 5px;
                        border-radius: 3px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        cursor: pointer;
                        line-height: 1.25;
                      " title="${UI.esc((j.jam_mulai ? j.jam_mulai + ' ' : '') + j.judul + (j.pelaksana ? ' (' + j.pelaksana + ')' : ''))}">
                        ${UI.esc(j.jam_mulai ? j.jam_mulai + ' ' : '')}${UI.esc(j.judul)}
                      </div>
                    `).join('')}
                    ${jadwalHari.length > 3 ? `
                      <div class="jd-more" data-tgl="${t}" style="
                        font-size: 10px;
                        font-weight: 700;
                        color: #2563eb;
                        cursor: pointer;
                        padding: 1px 2px;
                      ">+${jadwalHari.length - 3} lainnya</div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Statistik Ringkas Jadwal -->
          <div class="grid grid-3 mt-16">
            <div class="stat">
              <div class="lbl">Total Agenda Bulan Ini</div>
              <div class="val tabular">${totalJadwal}</div>
            </div>
            <div class="stat">
              <div class="lbl">Shift Terjadwal</div>
              <div class="val tabular">${totalShift}</div>
            </div>
            <div class="stat">
              <div class="lbl">Agenda Mendatang</div>
              <div class="val tabular">${totalMendatang}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Pasang Event Listener Navigasi & Aksi
    const segarkanJadwal = () => gambarKalenderJadwal(w, data);

    w.querySelector('#jdPrev')?.addEventListener('click', () => {
      ovBulanJadwal = UI.geserBulan(ovBulanJadwal, -1);
      segarkanJadwal();
    });
    w.querySelector('#jdNext')?.addEventListener('click', () => {
      ovBulanJadwal = UI.geserBulan(ovBulanJadwal, 1);
      segarkanJadwal();
    });
    w.querySelector('#jdBulan')?.addEventListener('change', (e) => {
      ovBulanJadwal = e.target.value;
      segarkanJadwal();
    });

    if (isMaster) {
      w.querySelector('#btnTambahJadwal')?.addEventListener('click', () => {
        modalFormJadwal(null, hari, segarkanJadwal);
      });
    }

    // Klik pada cell tanggal
    w.querySelectorAll('.jd-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        if (e.target.closest('.jd-badge') || e.target.closest('.jd-more')) return;
        const tgl = cell.dataset.tgl;
        const items = mapJadwal.get(tgl) || [];

        if (isMaster) {
          modalFormJadwal(null, tgl, segarkanJadwal);
        } else {
          if (items.length === 1) {
            modalDetailJadwal(items[0]);
          } else if (items.length > 1) {
            modalDaftarJadwalTanggal(tgl, items, false, segarkanJadwal);
          } else {
            UI.toast('Tidak ada agenda jadwal pada tanggal ' + UI.tglIndo(tgl) + '.', 'info');
          }
        }
      });
    });

    // Klik pada badge jadwal
    w.querySelectorAll('.jd-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const jid = badge.dataset.jid;
        const j = listJadwal.find(x => String(x.id) === String(jid));
        if (!j) return;
        if (isMaster) {
          modalFormJadwal(j, j.tanggal, segarkanJadwal);
        } else {
          modalDetailJadwal(j);
        }
      });
    });

    // Klik pada +X lainnya
    w.querySelectorAll('.jd-more').forEach(more => {
      more.addEventListener('click', (e) => {
        e.stopPropagation();
        const tgl = more.dataset.tgl;
        const items = mapJadwal.get(tgl) || [];
        modalDaftarJadwalTanggal(tgl, items, isMaster, segarkanJadwal);
      });
    });
  }

  // Alias agar tetap kompatibel jika ada pemanggilan gambarHeatmap
  const gambarHeatmap = gambarKalenderJadwal;

  /* ---- Modal Tambah / Edit Jadwal (Khusus Role Master) ----------------- */
  async function modalFormJadwal(j, tglDefault, selesaiCb) {
    const isEdit = !!(j && j.id);
    const presetsWarna = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0d9488', '#475569'];
    const warnaAwal = j?.warna_tag || '#2563eb';

    await UI.modal({
      judul: isEdit ? 'Edit Jadwal' : 'Tambah Jadwal Baru',
      isi: `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Judul Agenda / Jadwal *</label>
            <input type="text" id="mJdJudul" class="input" style="width:100%; box-sizing:border-box;" required placeholder="Contoh: Shift Pagi Lab / Maintenance BS-240" value="${UI.esc(j?.judul || '')}">
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Tanggal *</label>
              <input type="date" id="mJdTanggal" class="input" style="width:100%; box-sizing:border-box;" required value="${j?.tanggal || tglDefault || UI.hariIni()}">
            </div>
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Kategori</label>
              <select id="mJdKategori" class="input" style="width:100%; box-sizing:border-box;">
                <option value="Shift Pagi"${j?.kategori === 'Shift Pagi' ? ' selected' : ''}>Shift Pagi</option>
                <option value="Shift Siang"${j?.kategori === 'Shift Siang' ? ' selected' : ''}>Shift Siang</option>
                <option value="Shift Malam"${j?.kategori === 'Shift Malam' ? ' selected' : ''}>Shift Malam</option>
                <option value="Operasional Lab"${j?.kategori === 'Operasional Lab' ? ' selected' : ''}>Operasional Lab</option>
                <option value="Maintenance Alat"${j?.kategori === 'Maintenance Alat' ? ' selected' : ''}>Maintenance Alat</option>
                <option value="Kalibrasi & QC"${j?.kategori === 'Kalibrasi & QC' ? ' selected' : ''}>Kalibrasi & QC</option>
                <option value="Sampling Lapangan"${j?.kategori === 'Sampling Lapangan' ? ' selected' : ''}>Sampling Lapangan</option>
                <option value="Rapat & Briefing"${j?.kategori === 'Rapat & Briefing' ? ' selected' : ''}>Rapat & Briefing</option>
                <option value="Lainnya"${j?.kategori === 'Lainnya' ? ' selected' : ''}>Lainnya</option>
              </select>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Jam Mulai</label>
              <input type="time" id="mJdMulai" class="input" style="width:100%; box-sizing:border-box;" value="${j?.jam_mulai || ''}">
            </div>
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Jam Selesai</label>
              <input type="time" id="mJdSelesai" class="input" style="width:100%; box-sizing:border-box;" value="${j?.jam_selesai || ''}">
            </div>
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Warna Tag</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="color" id="mJdWarnaTag" value="${warnaAwal}" style="width:36px; height:32px; padding:0; border:1px solid #cbd5e1; border-radius:4px; cursor:pointer;">
              <div id="mJdPresets" style="display:flex; gap:6px;">
                ${presetsWarna.map(c => `
                  <span class="color-dot" data-col="${c}" style="width:24px; height:24px; border-radius:50%; background:${c}; cursor:pointer; display:inline-block; border:2px solid ${c === warnaAwal ? '#0f172a' : 'transparent'}; box-sizing:border-box;"></span>
                `).join('')}
              </div>
            </div>
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Pelaksana / Petugas</label>
            <input type="text" id="mJdPelaksana" class="input" style="width:100%; box-sizing:border-box;" placeholder="Nama petugas / analis yang bertugas..." value="${UI.esc(j?.pelaksana || '')}">
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Keterangan</label>
            <textarea id="mJdKeterangan" class="input" style="width:100%; box-sizing:border-box;" rows="2" placeholder="Catatan atau instruksi khusus...">${UI.esc(j?.keterangan || '')}</textarea>
          </div>
        </div>
      `,
      tombol: [
        ...(isEdit ? [{
          teks: 'Hapus Jadwal',
          kelas: 'btn-danger',
          aksi: async () => {
            const yakin = await UI.konfirmasiGanda({
              judul: 'Hapus Jadwal',
              pesan1: `Apakah Anda yakin ingin menghapus jadwal "${j.judul}"? Tindakan ini tidak dapat dibatalkan.`,
              pesan2: `PERINGATAN TERAKHIR: Jadwal "${j.judul}" pada tanggal ${UI.tglIndo(j.tanggal)} akan dihapus permanen dari sistem. Lanjutkan?`,
              tombolLanjut: 'Lanjutkan Hapus',
              tombolFinal: 'Ya, Hapus Sekarang'
            });
            if (!yakin) return false;
            try {
              await DB.jadwalHapus(j.id);
              UI.toast('Jadwal berhasil dihapus.', 'ok');
              if (selesaiCb) selesaiCb();
            } catch (err) {
              UI.toast('Gagal menghapus jadwal: ' + (err.message || err), 'err');
              return false;
            }
          }
        }] : []),
        { teks: 'Batal', nilai: null },
        {
          teks: isEdit ? 'Simpan Perubahan' : 'Simpan Jadwal',
          kelas: 'btn-primary',
          aksi: async (badan) => {
            const judul = badan.querySelector('#mJdJudul').value.trim();
            const tanggal = badan.querySelector('#mJdTanggal').value;
            const jam_mulai = badan.querySelector('#mJdMulai').value || null;
            const jam_selesai = badan.querySelector('#mJdSelesai').value || null;
            const kategori = badan.querySelector('#mJdKategori').value;
            const warna_tag = badan.querySelector('#mJdWarnaTag').value || '#2563eb';
            const pelaksana = badan.querySelector('#mJdPelaksana').value.trim() || null;
            const keterangan = badan.querySelector('#mJdKeterangan').value.trim() || null;

            if (!judul) {
              UI.toast('Judul agenda jadwal wajib diisi.', 'err');
              badan.querySelector('#mJdJudul')?.focus();
              return false;
            }
            if (!tanggal) {
              UI.toast('Tanggal wajib diisi.', 'err');
              badan.querySelector('#mJdTanggal')?.focus();
              return false;
            }

            const payload = {
              judul,
              tanggal,
              waktu_mulai: jam_mulai,
              waktu_selesai: jam_selesai,
              jam_mulai,
              jam_selesai,
              kategori,
              warna: warna_tag,
              warna_tag,
              dibuat_oleh: pelaksana,
              pelaksana,
              deskripsi: keterangan,
              keterangan
            };

            try {
              if (isEdit) {
                await DB.jadwalUbah(j.id, payload);
                UI.toast('Jadwal berhasil diperbarui.', 'ok');
              } else {
                await DB.jadwalTambah(payload);
                UI.toast('Jadwal baru berhasil ditambahkan.', 'ok');
              }
              if (selesaiCb) selesaiCb();
            } catch (err) {
              UI.toast('Gagal menyimpan jadwal: ' + (err.message || err), 'err');
              return false;
            }
          }
        }
      ],
      siap: (badan) => {
        badan.querySelectorAll('.color-dot').forEach(dot => {
          dot.addEventListener('click', () => {
            const col = dot.dataset.col;
            badan.querySelector('#mJdWarnaTag').value = col;
            badan.querySelectorAll('.color-dot').forEach(d => {
              d.style.borderColor = (d.dataset.col === col) ? '#0f172a' : 'transparent';
            });
          });
        });
      }
    });
  }

  /* ---- Modal Detail Jadwal (Read-Only untuk Non-Master) ----------------- */
  async function modalDetailJadwal(j) {
    await UI.modal({
      judul: 'Detail Jadwal',
      isi: `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <h3 style="margin:0 0 6px 0; font-size:16px; color:#1e293b;">${UI.esc(j.judul)}</h3>
            <span style="display:inline-block; background:${j.warna_tag || '#2563eb'}; color:#ffffff; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px;">
              ${UI.esc(j.kategori || 'Agenda')}
            </span>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div>
              <div style="font-size:11px; font-weight:600; color:#64748b;">Tanggal</div>
              <div style="font-size:13px; font-weight:700; color:#1e293b;">${UI.tglIndo(j.tanggal)}</div>
            </div>
            <div>
              <div style="font-size:11px; font-weight:600; color:#64748b;">Waktu / Jam</div>
              <div style="font-size:13px; font-weight:700; color:#1e293b;">
                ${j.jam_mulai ? j.jam_mulai + (j.jam_selesai ? ' – ' + j.jam_selesai : ' WIB') : 'Sepanjang Hari'}
              </div>
            </div>
            <div style="grid-column: span 2;">
              <div style="font-size:11px; font-weight:600; color:#64748b;">Pelaksana / Petugas</div>
              <div style="font-size:13px; color:#1e293b;">${UI.esc(j.pelaksana || 'Semua Petugas')}</div>
            </div>
          </div>

          ${j.keterangan ? `
            <div>
              <div style="font-size:11px; font-weight:600; color:#64748b; margin-bottom:4px;">Keterangan</div>
              <div style="font-size:13px; color:#334155; line-height:1.5; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px;">
                ${UI.esc(j.keterangan)}
              </div>
            </div>
          ` : ''}
        </div>
      `,
      tombol: [{ teks: 'Tutup', nilai: null }]
    });
  }

  /* ---- Modal Daftar Jadwal Tanggal (List Popup) ------------------------- */
  async function modalDaftarJadwalTanggal(t, list, isMaster, selesaiCb) {
    await UI.modal({
      judul: `Agenda Jadwal: ${UI.tglIndo(t)}`,
      isi: `
        <div style="display:flex; flex-direction:column; gap:8px; max-height:400px; overflow-y:auto;">
          ${list.map(j => `
            <div class="item-jadwal-popup" data-jid="${j.id}" style="
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-left: 4px solid ${j.warna_tag || '#2563eb'};
              border-radius: 4px;
              padding: 8px 12px;
              cursor: pointer;
              transition: background 0.15s;
            ">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <b style="font-size:13px; color:#1e293b;">${UI.esc(j.judul)}</b>
                <span style="font-size:11px; font-weight:600; color:#64748b;">
                  ${j.jam_mulai ? j.jam_mulai + (j.jam_selesai ? '–' + j.jam_selesai : '') : 'Sepanjang Hari'}
                </span>
              </div>
              <div style="display:flex; gap:8px; font-size:11px; color:#64748b; margin-top:4px;">
                <span>Kategori: <b>${UI.esc(j.kategori || 'Agenda')}</b></span>
                ${j.pelaksana ? `<span>• Pelaksana: <b>${UI.esc(j.pelaksana)}</b></span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `,
      tombol: [
        ...(isMaster ? [{
          teks: '+ Tambah Agenda Tanggal Ini',
          kelas: 'btn-secondary',
          aksi: async () => {
            setTimeout(() => modalFormJadwal(null, t, selesaiCb), 80);
          }
        }] : []),
        { teks: 'Tutup', nilai: null }
      ],
      siap: (badan, tutup) => {
        badan.querySelectorAll('.item-jadwal-popup').forEach(row => {
          row.addEventListener('click', () => {
            tutup();
            const jid = row.dataset.jid;
            const j = list.find(x => String(x.id) === String(jid));
            if (!j) return;
            setTimeout(() => {
              if (isMaster) {
                modalFormJadwal(j, t, selesaiCb);
              } else {
                modalDetailJadwal(j);
              }
            }, 80);
          });
        });
      }
    });
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
    ['ada_fisik', 'Pemeriksaan Fisik', r => (r.ada_fisik ? 'Ada' : '—')],
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
          <select id="rgFisik" class="control-auto" title="Filter Pemeriksaan Fisik">
            <option value="">Semua Pelayanan</option>
            <option value="FISIK">Ada Pemeriksaan Fisik</option>
            <option value="NON_FISIK">Tanpa Pemeriksaan Fisik</option>
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
      const fsk = w.querySelector('#rgFisik').value;

      let tampil = rows;
      if (cb) tampil = tampil.filter(r => (r.cara_bayar || '').toUpperCase() === cb.toUpperCase());
      if (st) tampil = tampil.filter(r => (r.status || '').toUpperCase() === st.toUpperCase());
      if (fsk === 'FISIK') tampil = tampil.filter(r => !!r.ada_fisik);
      if (fsk === 'NON_FISIK') tampil = tampil.filter(r => !r.ada_fisik);
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
    w.querySelector('#rgFisik').addEventListener('change', saring);
    w.querySelector('#rgCari').addEventListener('input', UI.tunda(saring, 250));
    w.querySelector('#rgUnduh').addEventListener('click', () => {
      const q = w.querySelector('#rgCari').value.trim().toLowerCase();
      const cb = w.querySelector('#rgCaraBayar').value;
      const st = w.querySelector('#rgStatus').value;
      const fsk = w.querySelector('#rgFisik').value;
      let unduhRows = rows;
      if (cb) unduhRows = unduhRows.filter(r => (r.cara_bayar || '').toUpperCase() === cb.toUpperCase());
      if (st) unduhRows = unduhRows.filter(r => (r.status || '').toUpperCase() === st.toUpperCase());
      if (fsk === 'FISIK') unduhRows = unduhRows.filter(r => !!r.ada_fisik);
      if (fsk === 'NON_FISIK') unduhRows = unduhRows.filter(r => !r.ada_fisik);
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
              <div class="flex items-center gap-4">
                <span class="text-muted mono text-xs">${UI.esc(r.no_rm)}</span>
                ${r.ada_fisik ? '<span class="badge b-ok text-xs" style="font-size:10px;padding:1px 5px;" title="Terdapat Pemeriksaan Fisik">Fisik</span>' : ''}
              </div>
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

  /* ==================================================================== */
  /*  TAB 6 — KARYAWAN (Statistik & Jejak Aktivitas Pegawai Lengkap)      */
  /* ==================================================================== */

  const KOLOM_KARYAWAN_REKAP = [
    { label: 'Nama Karyawan', nilai: r => r.nama },
    { label: 'Peran', nilai: r => r.peran },
    { label: 'Status Akun', nilai: r => r.aktif ? 'Aktif' : 'Nonaktif' },
    { label: 'Pendaftaran Pasien', nilai: r => r.daftar },
    { label: 'Verifikasi Lab', nilai: r => r.verif },
    { label: 'Pembuatan Surat', nilai: r => r.surat },
    { label: 'Transaksi Kasir', nilai: r => r.kasir },
    { label: 'Total Nominal Kasir', nilai: r => r.kasirNominal },
    { label: 'Total Aktivitas', nilai: r => r.total },
    { label: 'Kontribusi (%)', nilai: r => r.persen + '%' },
    { label: 'Aktivitas Terakhir', nilai: r => r.logTerakhir ? formatWaktuLengkap(r.logTerakhir) : '-' }
  ];

  const KOLOM_KARYAWAN_LOG = [
    { label: 'Waktu & Jam', nilai: r => formatWaktuLengkap(r.waktu) },
    { label: 'Tanggal', nilai: r => UI.tglPendek(r.waktu) },
    { label: 'Jam', nilai: r => UI.jam(r.waktu) },
    { label: 'Nama Petugas', nilai: r => r.pegawai_nama },
    { label: 'Peran', nilai: r => r.pegawai_peran },
    { label: 'Jenis Aktivitas', nilai: r => r.jenis_label },
    { label: 'No. Referensi', nilai: r => r.no_ref },
    { label: 'No. RM', nilai: r => r.pasien_rm },
    { label: 'Nama Pasien', nilai: r => r.pasien_nama },
    { label: 'Keterangan Rinci', nilai: r => r.detail }
  ];

  function formatWaktuLengkap(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '-';
    const tgl = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const jam = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    return `${tgl} ${jam}`;
  }

  async function tabKaryawan(w) {
    const akhir = UI.hariIni();
    const awal = UI.bulanIni() + '-01';

    w.innerHTML = `
      <div class="card mb-16">
        <div class="card-body">
          <div class="flex items-center gap-12 flex-wrap">
            <div class="flex items-center gap-8 periode-group">
              <label class="mb-0 font-bold text-xs">Periode:</label>
              <input type="date" id="karDari" value="${awal}" class="control-auto">
              <span class="text-muted">s.d.</span>
              <input type="date" id="karSampai" value="${akhir}" class="control-auto">
            </div>
            <div class="flex items-center gap-8">
              <label class="mb-0 font-bold text-xs" for="karFilterPegawai">Karyawan:</label>
              <select id="karFilterPegawai" class="control-auto" style="min-width:170px;">
                <option value="">Semua Karyawan</option>
              </select>
            </div>
            <div class="flex items-center gap-8">
              <label class="mb-0 font-bold text-xs" for="karFilterJenis">Aktivitas:</label>
              <select id="karFilterJenis" class="control-auto">
                <option value="">Semua Aktivitas</option>
                <option value="PENDAFTARAN">Pendaftaran Pasien</option>
                <option value="VERIFIKASI_LAB">Verifikasi Hasil Lab</option>
                <option value="BUAT_SURAT">Pembuatan Surat</option>
                <option value="KASIR_BAYAR">Penerimaan Kasir</option>
              </select>
            </div>
            <button class="btn btn-primary btn-sm" id="karTampil">
              ${UI.ikon('ulang', 14)} Tampilkan
            </button>
            <div class="flex-1"></div>
            <div class="flex items-center gap-8 flex-wrap">
              <button class="btn btn-secondary btn-sm" id="karUnduhRekap">
                ${UI.ikon('unduh', 14)} Unduh Rekap
              </button>
              <button class="btn btn-secondary btn-sm" id="karUnduhLog">
                ${UI.ikon('unduh', 14)} Unduh Log Rinci
              </button>
              <button class="btn btn-secondary btn-sm" id="karCetak">
                ${UI.ikon('cetak', 14)} Cetak
              </button>
            </div>
          </div>
        </div>
      </div>
      <div id="karIsi">${UI.memuat(4)}</div>
    `;

    let dataRaw = null;
    let listRekap = [];
    let listLog = [];
    let logHalaman = 1;
    const logPerHalaman = 40;

    const muat = async () => {
      const dari = w.querySelector('#karDari').value;
      const sampai = w.querySelector('#karSampai').value;
      const isi = w.querySelector('#karIsi');
      isi.innerHTML = UI.memuat(4);

      try {
        dataRaw = await DB.laporanKaryawanAktivitas({ dari, sampai });
        
        // Filter tegas hanya role karyawan (mengecualikan dokter, master, sistem)
        const stafKaryawan = (dataRaw.pegawai || []).filter(p => p.peran === 'karyawan');
        
        // Isi dropdown filter karyawan
        const selPegawai = w.querySelector('#karFilterPegawai');
        const valSebelumnya = selPegawai.value;
        selPegawai.innerHTML = `
          <option value="">Semua Karyawan (${stafKaryawan.length})</option>
          ${stafKaryawan.map(p => `<option value="${p.id}" ${p.id === valSebelumnya ? 'selected' : ''}>${UI.esc(p.nama)}</option>`).join('')}
        `;

        prosesDanGambar(isi);
      } catch (err) {
        console.error(err);
        isi.innerHTML = `<div class="banner err"><div>Gagal memuat statistik karyawan: ${UI.esc(err.message || err)}</div></div>`;
      }
    };

    function prosesDanGambar(container) {
      const { pegawai = [], kunjungan = [], lab = [], surat = [], kasir = [] } = dataRaw || {};

      // Hanya daftarkan karyawan dengan role 'karyawan'
      const stafKaryawan = pegawai.filter(p => p.peran === 'karyawan');
      const mapPeg = new Map();
      stafKaryawan.forEach(p => {
        mapPeg.set(p.id, {
          id: p.id,
          nama: p.nama,
          peran: p.peran,
          aktif: p.aktif,
          daftar: 0,
          verif: 0,
          surat: 0,
          kasir: 0,
          kasirNominal: 0,
          total: 0,
          logTerakhir: null
        });
      });

      const logSemua = [];

      // 1. Pendaftaran Pasien (hanya hitung jika dikerjakan oleh karyawan)
      kunjungan.forEach(k => {
        const pId = k.created_by;
        const p = mapPeg.get(pId);
        if (!p) return; // Lewati jika bukan role karyawan
        p.daftar++;
        p.total++;
        const ts = new Date(k.waktu_daftar || k.created_at || (k.tanggal + 'T08:00:00'));
        if (!p.logTerakhir || ts > p.logTerakhir) p.logTerakhir = ts;

        logSemua.push({
          id: 'kunj-' + k.id,
          waktu: ts,
          pegawai_id: pId,
          pegawai_nama: p.nama,
          pegawai_peran: p.peran,
          jenis: 'PENDAFTARAN',
          jenis_label: 'Pendaftaran Pasien',
          badge_kelas: 'b-info',
          no_ref: k.no_kunjungan || '-',
          pasien_nama: k.pasien?.nama || 'Pasien Umum',
          pasien_rm: k.pasien?.no_rm || '-',
          detail: `Pendaftaran kunjungan (${k.cara_bayar || 'UMUM'}) - Status: ${k.status || 'SELESAI'}`
        });
      });

      // 2. Verifikasi Lab (hanya hitung jika divalidasi oleh karyawan)
      lab.forEach(l => {
        const pId = l.selesai_oleh;
        const p = mapPeg.get(pId);
        if (!p) return; // Lewati jika bukan role karyawan
        p.verif++;
        p.total++;
        const ts = new Date(l.waktu_selesai || (l.tanggal + 'T09:00:00'));
        if (!p.logTerakhir || ts > p.logTerakhir) p.logTerakhir = ts;

        logSemua.push({
          id: 'lab-' + l.id,
          waktu: ts,
          pegawai_id: pId,
          pegawai_nama: p.nama,
          pegawai_peran: p.peran,
          jenis: 'VERIFIKASI_LAB',
          jenis_label: 'Verifikasi Hasil Lab',
          badge_kelas: 'b-ok',
          no_ref: l.no_lab || '-',
          pasien_nama: l.pasien?.nama || '-',
          pasien_rm: l.pasien?.no_rm || '-',
          detail: `Validasi & verifikasi akhir hasil laboratorium${l.catatan_klinis ? ' (' + l.catatan_klinis + ')' : ''}`
        });
      });

      // 3. Surat Keterangan (hanya hitung jika dibuat oleh karyawan)
      surat.forEach(s => {
        const pId = s.dibuat_oleh;
        const p = mapPeg.get(pId);
        if (!p) return; // Lewati jika bukan role karyawan
        p.surat++;
        p.total++;
        const ts = new Date(s.dibuat_pada || (s.tanggal_surat + 'T10:00:00'));
        if (!p.logTerakhir || ts > p.logTerakhir) p.logTerakhir = ts;

        logSemua.push({
          id: 'srt-' + s.id,
          waktu: ts,
          pegawai_id: pId,
          pegawai_nama: p.nama,
          pegawai_peran: p.peran,
          jenis: 'BUAT_SURAT',
          jenis_label: 'Pembuatan Surat',
          badge_kelas: 'b-warn',
          no_ref: s.nomor_surat || '-',
          pasien_nama: s.pasien?.nama || '-',
          pasien_rm: s.pasien?.no_rm || '-',
          detail: `${s.perihal || 'Surat Keterangan Laboratorium'} [${(s.jenis_kode || '').toUpperCase()}]`
        });
      });

      // 4. Kasir / Pembayaran (hanya hitung jika diproses oleh karyawan)
      kasir.forEach(b => {
        const pId = b.dibuat_oleh;
        const p = mapPeg.get(pId);
        if (!p) return; // Lewati jika bukan role karyawan
        p.kasir++;
        p.total++;
        p.kasirNominal += (Number(b.jumlah) || 0);
        const ts = new Date(b.created_at || (b.tanggal + 'T11:00:00'));
        if (!p.logTerakhir || ts > p.logTerakhir) p.logTerakhir = ts;

        logSemua.push({
          id: 'ksr-' + b.id,
          waktu: ts,
          pegawai_id: pId,
          pegawai_nama: p.nama,
          pegawai_peran: p.peran,
          jenis: 'KASIR_BAYAR',
          jenis_label: 'Penerimaan Kasir',
          badge_kelas: 'b-dokter',
          no_ref: b.tagihan?.nomor || 'TRX-KASIR',
          pasien_nama: b.tagihan?.pasien?.nama || '-',
          pasien_rm: b.tagihan?.pasien?.no_rm || '-',
          detail: `Penerimaan kas ${UI.rupiah(b.jumlah)} via ${(b.metode || 'tunai').toUpperCase()}`
        });
      });

      logSemua.sort((a, b) => b.waktu.getTime() - a.waktu.getTime());

      const totalSeluruh = logSemua.length;
      listRekap = Array.from(mapPeg.values())
        .map(p => ({
          ...p,
          persen: totalSeluruh > 0 ? ((p.total / totalSeluruh) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.total - a.total);

      listLog = logSemua;

      const totalDaftar = listRekap.reduce((a, b) => a + b.daftar, 0);
      const totalVerif = listRekap.reduce((a, b) => a + b.verif, 0);
      const totalSurat = listRekap.reduce((a, b) => a + b.surat, 0);
      const totalKasir = listRekap.reduce((a, b) => a + b.kasir, 0);
      const totalUangKasir = listRekap.reduce((a, b) => a + b.kasirNominal, 0);

      container.innerHTML = `
        <!-- KPI Cards -->
        <div class="grid grid-4 mb-16">
          <div class="stat accent">
            <div class="lbl">Total Aktivitas Karyawan</div>
            <div class="val tabular">${totalSeluruh}</div>
            <div class="hint">Total aksi staf operasional pada periode ini</div>
          </div>
          <div class="stat">
            <div class="lbl">Pendaftaran Pasien</div>
            <div class="val tabular">${totalDaftar}</div>
            <div class="hint">Kunjungan didaftarkan karyawan</div>
          </div>
          <div class="stat">
            <div class="lbl">Verifikasi Hasil Lab</div>
            <div class="val tabular">${totalVerif}</div>
            <div class="hint">Lembar lab divalidasi oleh karyawan</div>
          </div>
          <div class="stat">
            <div class="lbl">Surat &amp; Kasir</div>
            <div class="val tabular">${totalSurat} <span style="font-size:16px; font-weight:normal; color:var(--text-muted);">/ ${totalKasir} trx</span></div>
            <div class="hint">${totalSurat} surat · ${UI.rupiah(totalUangKasir)} kas</div>
          </div>
        </div>

        <!-- Section 1: Tabel Rekapitulasi Performa Per Karyawan -->
        <div class="card mb-16">
          <div class="card-head" style="flex-wrap:wrap; gap:8px;">
            <div>
              <h2>Statistik Produktivitas Karyawan</h2>
              <div class="sub">Total kontribusi pendaftaran, verifikasi hasil lab, pembuatan surat, dan kasir</div>
            </div>
            <span class="text-sm text-muted" style="align-self:center;">${listRekap.length} karyawan operasional tercatat</span>
          </div>
          <div class="card-body tight">
            <div class="table-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th style="width:40px; text-align:center;">#</th>
                    <th>Nama Karyawan</th>
                    <th>Peran</th>
                    <th style="text-align:right;">Pendaftaran</th>
                    <th style="text-align:right;">Verifikasi Lab</th>
                    <th style="text-align:right;">Buat Surat</th>
                    <th style="text-align:right;">Kasir</th>
                    <th style="text-align:right;">Total Aktivitas</th>
                    <th style="width:140px;">Kontribusi</th>
                    <th>Aktivitas Terakhir</th>
                    <th style="text-align:center;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${listRekap.length ? listRekap.map((r, idx) => `
                    <tr>
                      <td style="text-align:center; font-weight:700; color:var(--text-muted);">${idx + 1}</td>
                      <td>
                        <b>${UI.esc(r.nama)}</b>
                        ${!r.aktif && r.id !== UNKNOWN_ID ? '<span class="badge b-batal text-xs ml-4">Nonaktif</span>' : ''}
                      </td>
                      <td><span class="badge b-umum text-xs">${UI.esc(r.peran)}</span></td>
                      <td class="tabular" style="text-align:right; font-weight:${r.daftar ? '600' : 'normal'};">${r.daftar}</td>
                      <td class="tabular" style="text-align:right; font-weight:${r.verif ? '600' : 'normal'}; color:${r.verif ? 'var(--brand-700)' : 'inherit'};">${r.verif}</td>
                      <td class="tabular" style="text-align:right; font-weight:${r.surat ? '600' : 'normal'};">${r.surat}</td>
                      <td class="tabular" style="text-align:right;">
                        <div><b>${r.kasir}</b></div>
                        ${r.kasirNominal ? `<div class="text-xs text-muted mono">${UI.rupiah(r.kasirNominal)}</div>` : ''}
                      </td>
                      <td class="tabular" style="text-align:right; font-weight:700; font-size:14px; color:var(--brand-800);">
                        ${r.total}
                      </td>
                      <td>
                        <div class="flex items-center gap-6">
                          <div class="bar-track" style="flex:1; height:6px;">
                            <div class="bar-fill" style="width:${Math.min(100, Math.max(2, r.persen))}%;"></div>
                          </div>
                          <span class="mono text-xs tabular font-bold" style="min-width:38px; text-align:right;">${r.persen}%</span>
                        </div>
                      </td>
                      <td class="mono text-xs">
                        ${r.logTerakhir ? formatWaktuLengkap(r.logTerakhir) : '<span class="text-muted">—</span>'}
                      </td>
                      <td style="text-align:center;">
                        <button class="btn btn-secondary btn-sm" data-filter-staf="${r.id}" title="Filter dan lihat seluruh log rincian aktivitas staf ini">
                          Lihat Log
                        </button>
                      </td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="11" class="text-center text-muted p-16">Tidak ada catatan aktivitas staf pada periode ini.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Section 2: Log Rinci Jejak Aktivitas Karyawan (Audit Trail Lengkap dengan Jam & Detik) -->
        <div class="card mb-16" id="wrapTabelLog">
          <div class="card-head" style="flex-wrap:wrap; gap:10px;">
            <div>
              <h2>Jejak Aktivitas Karyawan (Audit Trail Real-Time)</h2>
              <div class="sub">Catatan log lengkap seluruh aksi karyawan beserta tanggal, jam (menit &amp; detik), nomor referensi, dan rincian transaksi</div>
            </div>
            <div class="flex items-center gap-8">
              <input type="search" id="karCariLog" placeholder="Cari nama pasien, no. RM, ref..." class="control-auto" style="width:230px;">
            </div>
          </div>
          <div class="card-body tight">
            <div id="wadahLogTabel"></div>
          </div>
        </div>
      `;

      // Event listener tombol [Lihat Log] di tabel rekap
      container.querySelectorAll('[data-filter-staf]').forEach(btn => {
        btn.addEventListener('click', () => {
          const stId = btn.dataset.filterStaf;
          w.querySelector('#karFilterPegawai').value = stId;
          logHalaman = 1;
          renderTabelLog();
          w.querySelector('#wrapTabelLog').scrollIntoView({ behavior: 'smooth' });
        });
      });

      // Filter input search
      const inpCari = container.querySelector('#karCariLog');
      if (inpCari) {
        inpCari.addEventListener('input', () => {
          logHalaman = 1;
          renderTabelLog();
        });
      }

      renderTabelLog();
    }

    function renderTabelLog() {
      const wadah = w.querySelector('#wadahLogTabel');
      if (!wadah) return;

      const fPegawai = w.querySelector('#karFilterPegawai')?.value || '';
      const fJenis = w.querySelector('#karFilterJenis')?.value || '';
      const fCari = (w.querySelector('#karCariLog')?.value || '').toLowerCase().trim();

      const terfilter = listLog.filter(item => {
        if (fPegawai && item.pegawai_id !== fPegawai) return false;
        if (fJenis && item.jenis !== fJenis) return false;
        if (fCari) {
          const cocokNama = item.pasien_nama && item.pasien_nama.toLowerCase().includes(fCari);
          const cocokRm = item.pasien_rm && item.pasien_rm.toLowerCase().includes(fCari);
          const cocokRef = item.no_ref && item.no_ref.toLowerCase().includes(fCari);
          const cocokPet = item.pegawai_nama && item.pegawai_nama.toLowerCase().includes(fCari);
          const cocokDet = item.detail && item.detail.toLowerCase().includes(fCari);
          if (!cocokNama && !cocokRm && !cocokRef && !cocokPet && !cocokDet) return false;
        }
        return true;
      });

      const totalBaris = terfilter.length;
      const totalHalaman = Math.max(1, Math.ceil(totalBaris / logPerHalaman));
      if (logHalaman > totalHalaman) logHalaman = totalHalaman;
      if (logHalaman < 1) logHalaman = 1;

      const awalIdx = (logHalaman - 1) * logPerHalaman;
      const halamanData = terfilter.slice(awalIdx, awalIdx + logPerHalaman);

      wadah.innerHTML = `
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th style="width:160px;">Waktu &amp; Jam</th>
                <th>Petugas / Karyawan</th>
                <th>Jenis Aktivitas</th>
                <th>No. Referensi</th>
                <th>Pasien</th>
                <th>Keterangan / Rincian Transaksi</th>
              </tr>
            </thead>
            <tbody>
              ${halamanData.length ? halamanData.map(r => {
                const d = r.waktu;
                const tgl = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                const jamDetik = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
                return `
                  <tr>
                    <td class="mono" style="white-space:nowrap;">
                      <div style="font-weight:700; color:var(--text);">${tgl}</div>
                      <div style="font-size:11.5px; color:var(--brand-700); font-weight:600;">${jamDetik} WIB</div>
                    </td>
                    <td>
                      <div><b>${UI.esc(r.pegawai_nama)}</b></div>
                      <span class="badge b-umum text-xs">${UI.esc(r.pegawai_peran)}</span>
                    </td>
                    <td>
                      <span class="badge ${r.badge_kelas}">
                        <span class="dot"></span> ${UI.esc(r.jenis_label)}
                      </span>
                    </td>
                    <td class="mono font-bold">${UI.esc(r.no_ref)}</td>
                    <td>
                      <div style="font-weight:600;">${UI.esc(r.pasien_nama)}</div>
                      <div class="mono text-xs text-muted">RM: ${UI.esc(r.pasien_rm)}</div>
                    </td>
                    <td style="font-size:13px; color:var(--text-muted);">${UI.esc(r.detail)}</td>
                  </tr>
                `;
              }).join('') : `
                <tr><td colspan="6" class="text-center text-muted p-16">Tidak ada aktivitas yang cocok dengan filter.</td></tr>
              `}
            </tbody>
          </table>
        </div>
        
        <!-- Paginasi & Keterangan Baris -->
        <div class="flex items-center justify-between p-12 border-t flex-wrap gap-8" style="background:#fafbfc;">
          <div class="text-xs text-muted">
            Menampilkan <b>${totalBaris ? awalIdx + 1 : 0}</b> - <b>${Math.min(totalBaris, awalIdx + logPerHalaman)}</b> dari <b>${totalBaris}</b> aktivitas
            ${fPegawai || fJenis || fCari ? '(terfilter)' : ''}
          </div>
          <div class="flex items-center gap-6">
            <button class="btn btn-secondary btn-sm" id="btnLogPrev" ${logHalaman <= 1 ? 'disabled' : ''}>
              &larr; Sebelumnya
            </button>
            <span class="text-xs text-muted" style="padding:0 4px;">
              Halaman <b>${logHalaman}</b> / ${totalHalaman}
            </span>
            <button class="btn btn-secondary btn-sm" id="btnLogNext" ${logHalaman >= totalHalaman ? 'disabled' : ''}>
              Selanjutnya &rarr;
            </button>
          </div>
        </div>
      `;

      wadah.querySelector('#btnLogPrev')?.addEventListener('click', () => {
        if (logHalaman > 1) {
          logHalaman--;
          renderTabelLog();
        }
      });

      wadah.querySelector('#btnLogNext')?.addEventListener('click', () => {
        if (logHalaman < totalHalaman) {
          logHalaman++;
          renderTabelLog();
        }
      });
    }

    // Event listeners header controls
    w.querySelector('#karTampil').addEventListener('click', muat);
    w.querySelector('#karFilterPegawai').addEventListener('change', () => {
      logHalaman = 1;
      renderTabelLog();
    });
    w.querySelector('#karFilterJenis').addEventListener('change', () => {
      logHalaman = 1;
      renderTabelLog();
    });

    // Unduh Rekap
    w.querySelector('#karUnduhRekap').addEventListener('click', () => {
      const dari = w.querySelector('#karDari').value, sampai = w.querySelector('#karSampai').value;
      unduhCsv(listRekap, KOLOM_KARYAWAN_REKAP, `rekap_kinerja_karyawan_${dari}_sd_${sampai}.csv`);
    });

    // Unduh Log Rinci
    w.querySelector('#karUnduhLog').addEventListener('click', () => {
      const dari = w.querySelector('#karDari').value, sampai = w.querySelector('#karSampai').value;
      const fPegawai = w.querySelector('#karFilterPegawai')?.value || '';
      const fJenis = w.querySelector('#karFilterJenis')?.value || '';
      const terfilter = listLog.filter(item => {
        if (fPegawai && item.pegawai_id !== fPegawai) return false;
        if (fJenis && item.jenis !== fJenis) return false;
        return true;
      });
      unduhCsv(terfilter, KOLOM_KARYAWAN_LOG, `log_aktivitas_karyawan_${dari}_sd_${sampai}.csv`);
    });

    // Cetak Rekap
    w.querySelector('#karCetak').addEventListener('click', () => {
      window.print();
    });

    await muat();
  }

  /* ==================================================================== */
  /*  TAB EKSPOR PROLANIS (Format Rekapitulasi Pelayanan Prolanis / BPJS) */
  /* ==================================================================== */

  let xlsxSiap = null;
  function muatSheetJS() {
    if (typeof XLSX !== 'undefined') return Promise.resolve();
    if (xlsxSiap) return xlsxSiap;
    xlsxSiap = new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = ok;
      s.onerror = () => gagal(new Error('Gagal memuat pustaka Excel (SheetJS).'));
      document.head.appendChild(s);
    }).catch(e => { xlsxSiap = null; throw e; });
    return xlsxSiap;
  }

  function formatDesimalPl(val) {
    if (val == null || val === '') return '';
    const s = String(val).trim();
    return s.replace('.', ',');
  }

  function ekstrakNilaiProlanis(item) {
    const res = {
      cho: '', tg: '', hdl: '', ldl: '', ur: '', cre: '', mau: '',
      hba1c: '', gdp: '', gdpp: '', gds: ''
    };
    const listHasil = item.lab_hasil || [];
    for (const h of listHasil) {
      const kode = ((h.ref_lab && h.ref_lab.kode) || h.kode || '').toUpperCase();
      const nm = (h.nama || '').toLowerCase();
      const val = h.nilai_angka != null ? formatDesimalPl(h.nilai_angka) : (h.nilai_teks || '').trim();
      if (!val) continue;

      if (kode === 'CHOL' || kode === 'CHO' || nm.includes('kolesterol total') || nm.includes('cholesterol')) res.cho = val;
      else if (kode === 'TG' || nm.includes('trigliserida') || nm.includes('triglycerid')) res.tg = val;
      else if (kode === 'HDL' || nm.includes('hdl')) res.hdl = val;
      else if (kode === 'LDL' || nm.includes('ldl')) res.ldl = val;
      else if (kode === 'UREUM' || kode === 'UR' || nm.includes('ureum') || nm.includes('urea')) res.ur = val;
      else if (kode === 'KREAT' || kode === 'CRE' || nm.includes('kreatinin') || nm.includes('creatinin')) res.cre = val;
      else if (kode === 'MAU' || nm.includes('mikroalbumin') || nm.includes('microalbumin')) res.mau = val;
      else if (kode === 'HBA1C' || nm.includes('hba1c')) res.hba1c = val;
      else if (kode === 'GDP' || (nm.includes('puasa') && !nm.includes('2 jam'))) res.gdp = val;
      else if (kode === 'GD2PP' || kode === 'GDPP' || nm.includes('2 jam') || nm.includes('gd2pp')) res.gdpp = val;
      else if (kode === 'GDS' || (nm.includes('sewaktu') || nm.includes('gds'))) res.gds = val;
    }
    return res;
  }

  async function tabProlanis(w) {
    const akhir = UI.hariIni();
    const awal = UI.bulanIni() + '-01';

    // Ambil master rekanan untuk dropdown
    let masterRekanan = [];
    try {
      masterRekanan = await DB.daftarRekanan() || [];
    } catch (_) {}

    w.innerHTML = `
      <style>
        .tbl-prolanis th { text-align: center; vertical-align: middle; padding: 6px 8px; border: 1px solid #c8e6c9; font-weight: 700; }
        .tbl-prolanis td { padding: 5px 8px; border: 1px solid #e0e0e0; vertical-align: middle; white-space: nowrap; }
        .th-pasien { background: #eef2f6; color: #1e293b; }
        .th-fisik { background: #e0f2fe; color: #0369a1; }
        .th-kimia { background: #fee2e2; color: #991b1b; }
        .th-hba1c { background: #fef3c7; color: #92400e; }
        .th-gula { background: #ffedd5; color: #9a3412; }
        .td-num { text-align: center; font-variant-numeric: tabular-nums; }
        .td-kimia { background: #fff5f5; text-align: center; }
        .td-gula { background: #fffaf0; text-align: center; }
        .td-fisik { background: #f8fafc; text-align: center; }
        .badge-kpi { font-size: 11px; padding: 2px 7px; border-radius: 99px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
      </style>

      <div class="card mb-16">
        <div class="card-body">
          <div class="flex items-center gap-12 flex-wrap mb-12">
            <!-- Filter Tanggal -->
            <div class="flex items-center gap-8 periode-group" style="flex-shrink:0;">
              <label class="mb-0 font-medium">Periode</label>
              <input type="date" id="plDari" value="${awal}" class="control-auto" style="width:130px;">
              <span class="text-muted">s.d.</span>
              <input type="date" id="plSampai" value="${akhir}" class="control-auto" style="width:130px;">
            </div>

            <!-- Tombol Cepat Periode -->
            <div class="flex gap-4">
              <button class="btn btn-secondary btn-sm" id="btnPlHariIni" type="button">Hari Ini</button>
              <button class="btn btn-secondary btn-sm" id="btnPlBulanIni" type="button">Bulan Ini</button>
              <button class="btn btn-secondary btn-sm" id="btnPlBulanLalu" type="button">Bulan Lalu</button>
            </div>

            <!-- Filter Rekanan -->
            <div class="flex items-center gap-8">
              <label class="mb-0 font-medium">Rekanan</label>
              <select id="plRekanan" class="control-auto" style="min-width: 220px; max-width: 320px;" title="Filter Rekanan / Faskes / Dokter Pengirim">
                <option value="">Semua Rekanan / FKTP</option>
                ${masterRekanan.map(r => `<option value="${UI.esc(r.nama)}">${UI.esc(r.nama)}</option>`).join('')}
              </select>
            </div>

            <!-- Filter Cara Bayar -->
            <div class="flex items-center gap-8">
              <label class="mb-0 font-medium">Penjamin</label>
              <select id="plCaraBayar" class="control-auto" title="Filter Cara Bayar">
                <option value="SEMUA">Semua Penjamin</option>
                <option value="BPJS" selected>BPJS</option>
                <option value="UMUM">Umum</option>
              </select>
            </div>

            <button class="btn btn-primary btn-sm" id="btnPlTampilkan">
              ${UI.ikon('cari', 14)} Tampilkan
            </button>
          </div>

          <div class="flex items-center justify-between gap-12 flex-wrap pt-8 border-t" style="border-color:#edf2f7;">
            <!-- Live Search -->
            <div class="search-box min-w-240">
              <span class="ico">${UI.ikon('cari', 16)}</span>
              <input type="search" id="plCari" placeholder="Cari nama pasien, no. BPJS, atau no. RM…">
            </div>

            <!-- Export Buttons -->
            <div class="flex items-center gap-8">
              <button class="btn btn-sm" id="btnPlUnduhXlsx" style="background:#16a34a; color:#fff; border:none; font-weight:600; padding:6px 14px; border-radius:4px; display:inline-flex; align-items:center; gap:6px;">
                ${UI.ikon('unduh', 15)} Unduh Excel (.xlsx)
              </button>
              <button class="btn btn-secondary btn-sm" id="btnPlUnduhCsv">
                ${UI.ikon('dokumen', 15)} Unduh CSV
              </button>
              <button class="btn btn-secondary btn-sm" id="btnPlCetak">
                ${UI.ikon('cetak', 15)} Cetak
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ringkasan KPI -->
      <div id="plKpi" class="mb-16"></div>

      <!-- Tabel Pratinjau -->
      <div id="plIsi">${UI.memuat(4)}</div>
    `;

    let rowsSemua = [];

    // Helper tombol cepat tanggal
    w.querySelector('#btnPlHariIni').addEventListener('click', () => {
      w.querySelector('#plDari').value = UI.hariIni();
      w.querySelector('#plSampai').value = UI.hariIni();
      muat();
    });
    w.querySelector('#btnPlBulanIni').addEventListener('click', () => {
      w.querySelector('#plDari').value = UI.bulanIni() + '-01';
      w.querySelector('#plSampai').value = UI.hariIni();
      muat();
    });
    w.querySelector('#btnPlBulanLalu').addEventListener('click', () => {
      const blnLalu = UI.geserBulan(UI.bulanIni(), -1);
      const [thn, bln] = blnLalu.split('-');
      const akhirBln = new Date(thn, bln, 0).getDate();
      w.querySelector('#plDari').value = `${blnLalu}-01`;
      w.querySelector('#plSampai').value = `${blnLalu}-${String(akhirBln).padStart(2, '0')}`;
      muat();
    });

    w.querySelector('#btnPlTampilkan').addEventListener('click', () => muat());
    w.querySelector('#plRekanan').addEventListener('change', () => muat());
    w.querySelector('#plCaraBayar').addEventListener('change', () => muat());
    w.querySelector('#plCari').addEventListener('input', UI.tunda(() => saring(), 250));

    // Tombol Unduh Excel
    w.querySelector('#btnPlUnduhXlsx').addEventListener('click', () => {
      const terfilter = dapatkanTerfilter();
      const dari = w.querySelector('#plDari').value;
      const sampai = w.querySelector('#plSampai').value;
      const rekanan = w.querySelector('#plRekanan').value;
      unduhExcelProlanis(terfilter, dari, sampai, rekanan);
    });

    // Tombol Unduh CSV
    w.querySelector('#btnPlUnduhCsv').addEventListener('click', () => {
      const terfilter = dapatkanTerfilter();
      const dari = w.querySelector('#plDari').value;
      const sampai = w.querySelector('#plSampai').value;
      const rekanan = w.querySelector('#plRekanan').value;
      unduhCsvProlanis(terfilter, dari, sampai, rekanan);
    });

    // Tombol Cetak
    w.querySelector('#btnPlCetak').addEventListener('click', () => {
      window.print();
    });

    const muat = async () => {
      const dari = w.querySelector('#plDari').value;
      const sampai = w.querySelector('#plSampai').value;
      const rekanan = w.querySelector('#plRekanan').value;
      const caraBayar = w.querySelector('#plCaraBayar').value;

      const isi = w.querySelector('#plIsi');
      isi.innerHTML = UI.memuat(4);

      try {
        rowsSemua = await DB.prolanisEksporPelayanan(dari, sampai, caraBayar, rekanan);
        saring();
      } catch (e) {
        isi.innerHTML = `<div class="banner err"><div><b>Gagal memuat data Prolanis:</b> ${UI.esc(e.message || e)}</div></div>`;
      }
    };

    const dapatkanTerfilter = () => {
      const q = (w.querySelector('#plCari')?.value || '').trim().toLowerCase();
      if (!q) return rowsSemua;
      return rowsSemua.filter(r => {
        const cariString = [r.nama_pasien, r.no_rm, r.no_bpjs, r.fktp, r.alamat, r.dokter_nama].filter(Boolean).join(' ').toLowerCase();
        return cariString.includes(q);
      });
    };

    const saring = () => {
      const data = dapatkanTerfilter();
      gambarKpi(data);
      gambarTabel(data);
    };

    const gambarKpi = (data) => {
      const kpiEl = w.querySelector('#plKpi');
      if (!kpiEl) return;

      let jmlFisik = 0, jmlKimia = 0, jmlHba1c = 0, jmlGula = 0;
      data.forEach(r => {
        if (r.tensi || r.tinggi_badan || r.berat_badan || r.lingkar_perut) jmlFisik++;
        const lab = ekstrakNilaiProlanis(r);
        if (lab.cho || lab.tg || lab.hdl || lab.ldl || lab.ur || lab.cre || lab.mau) jmlKimia++;
        if (lab.hba1c) jmlHba1c++;
        if (lab.gdp || lab.gdpp || lab.gds) jmlGula++;
      });

      kpiEl.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px;">
          <div class="stat p-12" style="background:#fff; border:1px solid #e2e8f0; border-radius:8px;">
            <div class="lbl text-muted" style="font-size:11px;">TOTAL PASIEN</div>
            <div class="val tabular font-bold" style="font-size:22px; color:#1e293b;">${data.length}</div>
            <div class="hint text-xs text-muted">Data pelayanan tercatat</div>
          </div>
          <div class="stat p-12" style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px;">
            <div class="lbl" style="font-size:11px; color:#0369a1;">PEMERIKSAAN FISIK</div>
            <div class="val tabular font-bold" style="font-size:22px; color:#0284c7;">${jmlFisik}</div>
            <div class="hint text-xs" style="color:#0369a1;">Tensi, TB, BB, LP terisi</div>
          </div>
          <div class="stat p-12" style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px;">
            <div class="lbl" style="font-size:11px; color:#991b1b;">KIMIA DARAH</div>
            <div class="val tabular font-bold" style="font-size:22px; color:#dc2626;">${jmlKimia}</div>
            <div class="hint text-xs" style="color:#991b1b;">CHO, TG, HDL, LDL, UR, CRE</div>
          </div>
          <div class="stat p-12" style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px;">
            <div class="lbl" style="font-size:11px; color:#92400e;">EVALUASI HBA1C</div>
            <div class="val tabular font-bold" style="font-size:22px; color:#d97706;">${jmlHba1c}</div>
            <div class="hint text-xs" style="color:#92400e;">Siklus evaluasi DM</div>
          </div>
          <div class="stat p-12" style="background:#fff7ed; border:1px solid #fed7aa; border-radius:8px;">
            <div class="lbl" style="font-size:11px; color:#9a3412;">GULA DARAH</div>
            <div class="val tabular font-bold" style="font-size:22px; color:#ea580c;">${jmlGula}</div>
            <div class="hint text-xs" style="color:#9a3412;">GDP, GDPP, GDS</div>
          </div>
        </div>
      `;
    };

    const gambarTabel = (data) => {
      const isi = w.querySelector('#plIsi');
      if (!data.length) {
        isi.innerHTML = `
          <div class="card p-24 text-center">
            <p class="text-muted" style="font-size:14px; margin:0 0 6px;">Tidak ada data pelayanan Prolanis yang ditemukan untuk filter ini.</p>
            <p class="text-xs text-muted" style="margin:0;">Silakan sesuaikan tanggal atau pilihan rekanan di atas.</p>
          </div>
        `;
        return;
      }

      isi.innerHTML = `
        <div class="card p-0" style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">
          <div style="overflow-x:auto; max-height:640px;">
            <table class="tbl tbl-prolanis" style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead style="position:sticky; top:0; z-index:3; box-shadow:0 2px 4px rgba(0,0,0,.06);">
                <!-- Baris Header 1 -->
                <tr>
                  <th rowspan="2" class="th-pasien" style="width:40px;">NO</th>
                  <th rowspan="2" class="th-pasien" style="width:90px;">TGL PLY</th>
                  <th rowspan="2" class="th-pasien" style="width:120px;">NO BPJS</th>
                  <th rowspan="2" class="th-pasien" style="width:160px;">NAMA PESERTA</th>
                  <th rowspan="2" class="th-pasien" style="width:140px;">REKANAN / FKTP</th>
                  <th rowspan="2" class="th-fisik" style="width:75px;">TENSI</th>
                  <th rowspan="2" class="th-fisik" style="width:50px;">TB</th>
                  <th rowspan="2" class="th-fisik" style="width:50px;">BB</th>
                  <th rowspan="2" class="th-fisik" style="width:50px;">LP</th>
                  <th rowspan="2" class="th-fisik" style="width:50px;">RR</th>
                  <th rowspan="2" class="th-fisik" style="width:50px;">HR</th>
                  <th colspan="7" class="th-kimia">PELAYANAN KIMIA DARAH</th>
                  <th rowspan="2" class="th-hba1c" style="width:70px;">HBA1C</th>
                  <th colspan="3" class="th-gula">PELAYANAN GULA DARAH</th>
                </tr>
                <!-- Baris Header 2 (Sub-kolom Kimia & Gula Darah) -->
                <tr>
                  <th class="th-kimia" style="width:55px;">CHO</th>
                  <th class="th-kimia" style="width:55px;">TG</th>
                  <th class="th-kimia" style="width:55px;">HDL</th>
                  <th class="th-kimia" style="width:55px;">LDL</th>
                  <th class="th-kimia" style="width:55px;">UR</th>
                  <th class="th-kimia" style="width:55px;">CRE</th>
                  <th class="th-kimia" style="width:55px;">MAU</th>
                  <th class="th-gula" style="width:55px;">GDP</th>
                  <th class="th-gula" style="width:55px;">GDPP</th>
                  <th class="th-gula" style="width:55px;">GDS</th>
                </tr>
              </thead>
              <tbody>
                ${data.map((r, i) => {
                  const lab = ekstrakNilaiProlanis(r);
                  const isGenap = i % 2 === 0;
                  const bgRow = isGenap ? '#ffffff' : '#fcfcfc';
                  return `
                    <tr style="background:${bgRow};">
                      <td class="td-num text-muted">${i + 1}</td>
                      <td class="td-num">${UI.esc(r.tgl_pelayanan || '')}</td>
                      <td class="td-num" style="font-family:monospace; font-size:11px;">${UI.esc(r.no_bpjs || '-')}</td>
                      <td><b>${UI.esc(r.nama_pasien || '')}</b></td>
                      <td><span style="color:#0f766e; font-weight:600;">${UI.esc(r.fktp || '-')}</span></td>
                      <td class="td-num td-fisik"><b>${UI.esc(r.tensi || '-')}</b></td>
                      <td class="td-num td-fisik">${UI.esc(r.tinggi_badan || '-')}</td>
                      <td class="td-num td-fisik">${UI.esc(r.berat_badan || '-')}</td>
                      <td class="td-num td-fisik">${UI.esc(r.lingkar_perut || '-')}</td>
                      <td class="td-num td-fisik">${UI.esc(r.rr || '-')}</td>
                      <td class="td-num td-fisik">${UI.esc(r.hr || '-')}</td>
                      <td class="td-kimia td-num font-medium">${UI.esc(lab.cho || '')}</td>
                      <td class="td-kimia td-num font-medium">${UI.esc(lab.tg || '')}</td>
                      <td class="td-kimia td-num font-medium">${UI.esc(lab.hdl || '')}</td>
                      <td class="td-kimia td-num font-medium">${UI.esc(lab.ldl || '')}</td>
                      <td class="td-kimia td-num font-medium">${UI.esc(lab.ur || '')}</td>
                      <td class="td-kimia td-num font-medium">${UI.esc(lab.cre || '')}</td>
                      <td class="td-kimia td-num font-medium">${UI.esc(lab.mau || '')}</td>
                      <td class="td-num" style="background:#fffef5; font-weight:700; color:#b45309;">${UI.esc(lab.hba1c || '')}</td>
                      <td class="td-gula td-num font-medium">${UI.esc(lab.gdp || '')}</td>
                      <td class="td-gula td-num font-medium">${UI.esc(lab.gdpp || '')}</td>
                      <td class="td-gula td-num font-medium">${UI.esc(lab.gds || '')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    // Ekspor Excel .xlsx dengan multi-level merged headers
    async function unduhExcelProlanis(dataTampil, tglMulai, tglSelesai, namaRekanan) {
      if (!dataTampil.length) {
        UI.toast('Tidak ada data untuk diunduh.', 'warn');
        return;
      }
      try {
        UI.toast('Menyiapkan berkas Excel Prolanis...', 'info', 1500);
        await muatSheetJS();
        const wb = XLSX.utils.book_new();

        const aoa = [
          ['DATA INPUTAN PELAYANAN PROLANIS'],
          [`PERIODE: ${tglMulai} s.d ${tglSelesai} | REKANAN: ${namaRekanan || 'SEMUA REKANAN'}`],
          [],
          [
            'NO', 'TGL PLY', 'NO BPJS', 'NAMA PESERTA', 'ALAMAT', 'FKTP / REKANAN', 'DOKTER PENGIRIM',
            'TENSI', 'TB', 'BB', 'LP', 'RR', 'HR',
            'PELAYANAN KIMIA DARAH', '', '', '', '', '', '',
            'HBA1C',
            'PELAYANAN GULA DARAH', '', ''
          ],
          [
            '', '', '', '', '', '', '',
            '', '', '', '', '', '',
            'CHO', 'TG', 'HDL', 'LDL', 'UR', 'CRE', 'MAU',
            '',
            'GDP', 'GDPP', 'GDS'
          ]
        ];

        dataTampil.forEach((row, idx) => {
          const lab = ekstrakNilaiProlanis(row);
          aoa.push([
            idx + 1,
            row.tgl_pelayanan || '',
            row.no_bpjs || '',
            row.nama_pasien || '',
            row.alamat || '',
            row.fktp || '',
            row.dokter_nama || '',
            row.tensi || '',
            row.tinggi_badan || '',
            row.berat_badan || '',
            row.lingkar_perut || '',
            row.rr || '',
            row.hr || '',
            lab.cho,
            lab.tg,
            lab.hdl,
            lab.ldl,
            lab.ur,
            lab.cre,
            lab.mau,
            lab.hba1c,
            lab.gdp,
            lab.gdpp,
            lab.gds
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Merge range
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 23 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 23 } },
          { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },  // NO
          { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },  // TGL PLY
          { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },  // NO BPJS
          { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },  // NAMA
          { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } },  // ALAMAT
          { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } },  // FKTP
          { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } },  // DOKTER
          { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } },  // TENSI
          { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },  // TB
          { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } },  // BB
          { s: { r: 3, c: 10 }, e: { r: 4, c: 10 } }, // LP
          { s: { r: 3, c: 11 }, e: { r: 4, c: 11 } }, // RR
          { s: { r: 3, c: 12 }, e: { r: 4, c: 12 } }, // HR
          { s: { r: 3, c: 13 }, e: { r: 3, c: 19 } }, // KIMIA DARAH (CHO-MAU)
          { s: { r: 3, c: 20 }, e: { r: 4, c: 20 } }, // HBA1C
          { s: { r: 3, c: 21 }, e: { r: 3, c: 23 } }, // GULA DARAH (GDP-GDS)
        ];

        // Lebar kolom
        ws['!cols'] = [
          { wch: 5 },  { wch: 12 }, { wch: 16 }, { wch: 25 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
          { wch: 10 }, { wch: 6 },  { wch: 6 },  { wch: 6 },  { wch: 6 },  { wch: 6 },
          { wch: 8 },  { wch: 8 },  { wch: 8 },  { wch: 8 },  { wch: 8 },  { wch: 8 },  { wch: 8 },
          { wch: 9 },  { wch: 8 },  { wch: 8 },  { wch: 8 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Pelayanan Prolanis');
        const tagRekanan = namaRekanan ? `_${namaRekanan.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
        const namaFile = `rekap_prolanis_${tglMulai}_sd_${tglSelesai}${tagRekanan}.xlsx`;
        XLSX.writeFile(wb, namaFile);
        UI.toast(`Berhasil mengunduh ${dataTampil.length} data ke Excel!`, 'ok');
      } catch (err) {
        console.error('Gagal unduh excel:', err);
        UI.toast('Gagal mengunduh Excel: ' + (err.message || err), 'err');
      }
    }

    // Ekspor CSV Prolanis
    function unduhCsvProlanis(dataTampil, tglMulai, tglSelesai, namaRekanan) {
      if (!dataTampil.length) {
        UI.toast('Tidak ada data untuk diunduh.', 'warn');
        return;
      }
      const bersih = (v) => {
        const s = (v ?? '').toString().replace(/"/g, '""');
        return /[",\n;]/.test(s) ? `"${s}"` : s;
      };

      const header = [
        'NO', 'TGL PLY', 'NO BPJS', 'NAMA PESERTA', 'ALAMAT', 'FKTP / REKANAN', 'DOKTER PENGIRIM',
        'TENSI', 'TB', 'BB', 'LP', 'RR', 'HR',
        'CHO', 'TG', 'HDL', 'LDL', 'UR', 'CRE', 'MAU', 'HBA1C', 'GDP', 'GDPP', 'GDS'
      ];

      const baris = dataTampil.map((row, idx) => {
        const lab = ekstrakNilaiProlanis(row);
        return [
          idx + 1,
          row.tgl_pelayanan || '',
          row.no_bpjs || '',
          row.nama_pasien || '',
          row.alamat || '',
          row.fktp || '',
          row.dokter_nama || '',
          row.tensi || '',
          row.tinggi_badan || '',
          row.berat_badan || '',
          row.lingkar_perut || '',
          row.rr || '',
          row.hr || '',
          lab.cho, lab.tg, lab.hdl, lab.ldl, lab.ur, lab.cre, lab.mau,
          lab.hba1c, lab.gdp, lab.gdpp, lab.gds
        ].map(bersih).join(';');
      });

      const isi = [header.join(';'), ...baris].join('\r\n');
      const blob = new Blob(['\ufeff' + isi], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const tagRekanan = namaRekanan ? `_${namaRekanan.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      a.download = `rekap_prolanis_${tglMulai}_sd_${tglSelesai}${tagRekanan}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      UI.toast(`Berhasil mengunduh CSV (${dataTampil.length} baris).`, 'ok');
    }

    await muat();
  }

  return { render };
})();
