/* =====================================================================
   LAPORAN HISTORIS & 2021 — Modul Agregasi & Analitik Riwayat CSV Multi-Tahun
   Laboratorium Medis Utama Purbalingga
   
   Mendukung akses analitik instan 468.173 baris pengujian dari 5 tahun CSV:
   - 2019:  9.248 registrasi, 79.545 tes, 296 dokter, 22 instansi
   - 2020: 10.614 registrasi, 76.964 tes, 334 dokter, 30 instansi
   - 2021: 22.300 registrasi, 86.183 tes, 414 dokter, 70 instansi
   - 2022: 13.918 registrasi, 60.240 tes, 425 dokter, 59 instansi
   - 2023:  9.175 registrasi, 45.215 tes, 386 dokter, 53 instansi
   Total 65.255 kunjungan & 348.147 pemeriksaan laboratorium medis
   ===================================================================== */

const Laporan2021 = (() => {
  'use strict';

  let dataCache = null;
  let muatPromise = null;
  const ALL_YEARS = ['2019', '2020', '2021', '2022', '2023'];

  async function muatData() {
    if (dataCache) return dataCache;
    if (muatPromise) return muatPromise;

    muatPromise = (async () => {
      try {
        const resp = await fetch('./js/data_historis_agregat.json');
        if (!resp.ok) {
          // Fallback ke 2021 jika data_historis belum ada
          const r21 = await fetch('./js/data_2021_agregat.json');
          if (!r21.ok) throw new Error(`HTTP ${resp.status}`);
          const d21 = await r21.json();
          dataCache = {
            available_years: ['2021'],
            by_year: { '2021': d21 },
            all_time: d21,
            summary: { total_kunjungan_all: d21.total_kunjungan, total_tes_all: d21.total_tes }
          };
          return dataCache;
        }
        dataCache = await resp.json();
        return dataCache;
      } catch (err) {
        console.error('Gagal memuat data analitik historis:', err);
        return null;
      } finally {
        muatPromise = null;
      }
    })();

    return muatPromise;
  }

  function getYearsInRange(dari, sampai) {
    const d = (dari || '1970-01-01').substring(0, 4);
    const s = (sampai || '2099-12-31').substring(0, 4);
    return ALL_YEARS.filter(yr => yr >= d && yr <= s);
  }

  function isHistoris(dari, sampai) {
    if (!dari && !sampai) return true;
    return getYearsInRange(dari, sampai).length > 0;
  }

  function isMurniHistoris(dari, sampai) {
    if (!dari || !sampai) return false;
    const s = sampai.substring(0, 4);
    return isHistoris(dari, sampai) && s <= '2023';
  }

  // Aliases for 2021 backwards compatibility
  function is2021(dari, sampai) {
    return isHistoris(dari, sampai);
  }

  function isMurni2021(dari, sampai) {
    return isMurniHistoris(dari, sampai);
  }

  /* Ringkasan metrik utama */
  async function ringkasan(dari, sampai) {
    const d = await muatData();
    if (!d) return null;

    const years = getYearsInRange(dari, sampai);
    if (!years.length) return null;

    // Cek jika mencakup 1 tahun penuh spesifik (misal 2019-01-01 s/d 2019-12-31)
    if (years.length === 1) {
      const yr = years[0];
      const yData = d.by_year ? d.by_year[yr] : null;
      if (yData && (!dari || dari <= `${yr}-01-01`) && (!sampai || sampai >= `${yr}-12-31`)) {
        return {
          totalKunjungan: yData.total_kunjungan,
          totalPermintaan: yData.total_kunjungan,
          selesaiLab: yData.total_kunjungan,
          prosesLab: 0,
          totalItemPeriksa: yData.total_tes,
          totalFisik: 0,
          bpjs: yData.total_bpjs,
          pctSelesai: 100,
          perCaraBayar: {
            'UMUM': yData.total_umum,
            'BPJS': yData.total_bpjs
          }
        };
      }
    }

    // Cek jika mencakup seluruh tahun historis sekaligus (2019 - 2023)
    if (years.length === ALL_YEARS.length && (!dari || dari <= '2019-01-01') && (!sampai || sampai >= '2023-12-31')) {
      const totalK = d.summary ? d.summary.total_kunjungan_all : 65255;
      const totalT = d.summary ? d.summary.total_tes_all : 348147;
      let totalB = 0;
      if (d.summary && d.summary.per_tahun) {
        Object.values(d.summary.per_tahun).forEach(pt => { totalB += (pt.bpjs || 0); });
      }
      return {
        totalKunjungan: totalK,
        totalPermintaan: totalK,
        selesaiLab: totalK,
        prosesLab: 0,
        totalItemPeriksa: totalT,
        totalFisik: 0,
        bpjs: totalB,
        pctSelesai: 100,
        perCaraBayar: {
          'UMUM': totalK - totalB,
          'BPJS': totalB
        }
      };
    }

    // Rentang kustom: hitung dari per_hari masing-masing tahun
    let totalKunjungan = 0;
    let totalItemPeriksa = 0;
    let bpjs = 0;
    const tglAwal = dari || '1970-01-01';
    const tglAkhir = sampai || '2099-12-31';

    years.forEach(yr => {
      const yData = d.by_year ? d.by_year[yr] : null;
      if (!yData) return;
      const perHari = yData.per_hari || {};
      Object.entries(perHari).forEach(([tgl, h]) => {
        if (tgl >= tglAwal && tgl <= tglAkhir) {
          totalKunjungan += h.kunjungan || 0;
          totalItemPeriksa += h.total_tes || 0;
          bpjs += h.bpjs || 0;
        }
      });
    });

    return {
      totalKunjungan,
      totalPermintaan: totalKunjungan,
      selesaiLab: totalKunjungan,
      prosesLab: 0,
      totalItemPeriksa,
      totalFisik: 0,
      bpjs,
      pctSelesai: 100,
      perCaraBayar: {
        'UMUM': Math.max(0, totalKunjungan - bpjs),
        'BPJS': bpjs
      }
    };
  }

  /* Pemeriksaan lab teratas */
  async function pemeriksaanTeratas({ dari, sampai, kelompok, batas = 15 } = {}) {
    const d = await muatData();
    if (!d) return [];

    const years = getYearsInRange(dari, sampai);
    let list = [];

    if (years.length === 1) {
      const yr = years[0];
      const yData = d.by_year ? d.by_year[yr] : null;
      if (yData && (!dari || dari <= `${yr}-01-01`) && (!sampai || sampai >= `${yr}-12-31`)) {
        list = yData.pemeriksaan_teratas || [];
      }
    } else if (years.length === ALL_YEARS.length && (!dari || dari <= '2019-01-01') && (!sampai || sampai >= '2023-12-31')) {
      list = d.all_time?.pemeriksaan_teratas || [];
    }

    if (!list.length) {
      // Agregasikan dari tahun-tahun yang relevan
      const hitung = {};
      const klpMap = {};
      years.forEach(yr => {
        const yData = d.by_year ? d.by_year[yr] : null;
        if (!yData) return;
        (yData.pemeriksaan_teratas || []).forEach(p => {
          klpMap[p.nama] = p.kelompok;
          hitung[p.nama] = (hitung[p.nama] || 0) + p.jml;
        });
      });
      list = Object.entries(hitung).map(([nama, jml]) => ({
        nama,
        kelompok: klpMap[nama] || 'Lainnya',
        jml
      })).sort((a, b) => b.jml - a.jml);
    }

    if (kelompok && kelompok !== 'SEMUA') {
      list = list.filter(x => x.kelompok === kelompok);
    }

    return batas > 0 ? list.slice(0, batas) : list;
  }

  /* Distribusi kelompok pemeriksaan */
  async function distribusiKelompok({ dari, sampai } = {}) {
    const d = await muatData();
    if (!d) return [];

    const years = getYearsInRange(dari, sampai);
    if (years.length === 1) {
      const yr = years[0];
      const yData = d.by_year ? d.by_year[yr] : null;
      if (yData && (!dari || dari <= `${yr}-01-01`) && (!sampai || sampai >= `${yr}-12-31`)) {
        return yData.kelompok_distribusi || [];
      }
    } else if (years.length === ALL_YEARS.length && (!dari || dari <= '2019-01-01') && (!sampai || sampai >= '2023-12-31')) {
      return d.all_time?.kelompok_distribusi || [];
    }

    const periksa = await pemeriksaanTeratas({ dari, sampai, batas: 0 });
    const peta = {};
    periksa.forEach(p => {
      const k = p.kelompok || 'Lainnya';
      peta[k] = (peta[k] || 0) + p.jml;
    });

    return Object.entries(peta)
      .map(([kelompok, jml]) => ({ kelompok, jml }))
      .sort((a, b) => b.jml - a.jml);
  }

  /* Dokter pengirim */
  async function dokterPengirim({ dari, sampai, query = '', batas = 20 } = {}) {
    const d = await muatData();
    if (!d) return [];

    const years = getYearsInRange(dari, sampai);
    let list = [];

    if (years.length === 1) {
      const yr = years[0];
      const yData = d.by_year ? d.by_year[yr] : null;
      if (yData && (!dari || dari <= `${yr}-01-01`) && (!sampai || sampai >= `${yr}-12-31`)) {
        list = yData.dokter_pengirim || [];
      }
    } else if (years.length === ALL_YEARS.length && (!dari || dari <= '2019-01-01') && (!sampai || sampai >= '2023-12-31')) {
      list = d.all_time?.dokter_pengirim || [];
    }

    if (!list.length) {
      // Gabungkan dokter dari tahun-tahun yang terpilih
      const mapDokter = {};
      years.forEach(yr => {
        const yData = d.by_year ? d.by_year[yr] : null;
        if (!yData) return;
        (yData.dokter_pengirim || []).forEach(dok => {
          const nm = dok.nama || dok.dokter;
          if (!mapDokter[nm]) {
            mapDokter[nm] = { nama: nm, dokter: nm, total_kunjungan: 0, total_tes: 0, tesMap: {} };
          }
          mapDokter[nm].total_kunjungan += dok.total_kunjungan;
          mapDokter[nm].total_tes += dok.total_tes;
          (dok.top_tes || []).forEach(t => {
            mapDokter[nm].tesMap[t.nama] = (mapDokter[nm].tesMap[t.nama] || 0) + t.jml;
          });
        });
      });

      list = Object.values(mapDokter).map(dok => ({
        nama: dok.nama,
        dokter: dok.nama,
        total_kunjungan: dok.total_kunjungan,
        total_tes: dok.total_tes,
        top_tes: Object.entries(dok.tesMap)
          .map(([nama, jml]) => ({ nama, jml }))
          .sort((a, b) => b.jml - a.jml)
          .slice(0, 15)
      })).sort((a, b) => b.total_kunjungan - a.total_kunjungan);
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(dok => (dok.nama || dok.dokter).toLowerCase().includes(q));
    }

    return batas > 0 ? list.slice(0, batas) : list;
  }

  /* Tes yang dirujuk oleh satu dokter tertentu */
  async function tesPerDokter(namaDokter, { dari, sampai } = {}) {
    const list = await dokterPengirim({ dari, sampai, query: namaDokter, batas: 0 });
    const dok = list.find(x => (x.nama || x.dokter).toLowerCase() === (namaDokter || '').toLowerCase());
    return dok ? dok.top_tes : [];
  }

  /* Instansi / rekanan pengirim */
  async function instansiPengirim({ dari, sampai, query = '', batas = 20 } = {}) {
    const d = await muatData();
    if (!d) return [];

    const years = getYearsInRange(dari, sampai);
    let list = [];

    if (years.length === 1) {
      const yr = years[0];
      const yData = d.by_year ? d.by_year[yr] : null;
      if (yData && (!dari || dari <= `${yr}-01-01`) && (!sampai || sampai >= `${yr}-12-31`)) {
        list = yData.instansi_pengirim || [];
      }
    } else if (years.length === ALL_YEARS.length && (!dari || dari <= '2019-01-01') && (!sampai || sampai >= '2023-12-31')) {
      list = d.all_time?.instansi_pengirim || [];
    }

    if (!list.length) {
      const mapInst = {};
      years.forEach(yr => {
        const yData = d.by_year ? d.by_year[yr] : null;
        if (!yData) return;
        (yData.instansi_pengirim || []).forEach(ins => {
          const nm = ins.nama || ins.instansi;
          if (!mapInst[nm]) {
            mapInst[nm] = { nama: nm, instansi: nm, total_kunjungan: 0, total_tes: 0, tesMap: {} };
          }
          mapInst[nm].total_kunjungan += ins.total_kunjungan;
          mapInst[nm].total_tes += ins.total_tes;
          (ins.top_tes || []).forEach(t => {
            mapInst[nm].tesMap[t.nama] = (mapInst[nm].tesMap[t.nama] || 0) + t.jml;
          });
        });
      });

      list = Object.values(mapInst).map(ins => ({
        nama: ins.nama,
        instansi: ins.nama,
        total_kunjungan: ins.total_kunjungan,
        total_tes: ins.total_tes,
        top_tes: Object.entries(ins.tesMap)
          .map(([nama, jml]) => ({ nama, jml }))
          .sort((a, b) => b.jml - a.jml)
          .slice(0, 15)
      })).sort((a, b) => b.total_kunjungan - a.total_kunjungan);
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(ins => (ins.nama || ins.instansi).toLowerCase().includes(q));
    }

    return batas > 0 ? list.slice(0, batas) : list;
  }

  /* Tes untuk instansi tertentu */
  async function tesPerInstansi(namaInstansi, { dari, sampai } = {}) {
    const list = await instansiPengirim({ dari, sampai, query: namaInstansi, batas: 0 });
    const ins = list.find(x => (x.nama || x.instansi).toLowerCase() === (namaInstansi || '').toLowerCase());
    return ins ? ins.top_tes : [];
  }

  /* Overview bulanan untuk Tab Overview & Tren */
  async function overviewBulanan(tahun = '2021') {
    const d = await muatData();
    if (!d || !d.by_year) return null;

    const yData = d.by_year[tahun] || d.by_year['2021'];
    if (!yData || !yData.per_bulan) return null;

    const monthKeys = Object.keys(yData.per_bulan).sort();
    const bulanan = monthKeys.map(k => ({ bulan: k, ...yData.per_bulan[k] }));

    return {
      tahun,
      totalKunjungan: yData.total_kunjungan,
      totalTes: yData.total_tes,
      totalBpjs: yData.total_bpjs,
      monthKeys,
      bulanan,
      jamPeriksa: yData.jam_periksa || []
    };
  }

  return {
    muatData,
    ALL_YEARS,
    isHistoris,
    isMurniHistoris,
    is2021,
    isMurni2021,
    getYearsInRange,
    ringkasan,
    pemeriksaanTeratas,
    distribusiKelompok,
    dokterPengirim,
    tesPerDokter,
    instansiPengirim,
    tesPerInstansi,
    overviewBulanan
  };
})();

// Alias global untuk fleksibilitas kode
window.LaporanHistoris = Laporan2021;
window.Laporan2021 = Laporan2021;
