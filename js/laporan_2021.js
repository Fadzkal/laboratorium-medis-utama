/* =====================================================================
   LAPORAN 2021 — Modul Agregasi & Analitik Data Riwayat CSV 2021
   Laboratorium Medis Utama
   
   Menyediakan akses instan ke seluruh 167.538 baris CSV 2021:
   - 22.300 kunjungan pasien & 606 pasien BPJS
   - 97.826 pengujian parameter laboratorium terverifikasi
   - 414 dokter pengirim & peringkat rujukan tes lab
   - 70 instansi / perusahaan mitra (PT John Toys, PT Sung Chang, Bank BRI, dll.)
   - Tren bulanan 12 bulan (Jan-Des 2021) & kurva jam puncak antrean
   ===================================================================== */

const Laporan2021 = (() => {
  'use strict';

  let dataCache = null;
  let muatPromise = null;

  async function muatData() {
    if (dataCache) return dataCache;
    if (muatPromise) return muatPromise;

    muatPromise = (async () => {
      try {
        const resp = await fetch('./js/data_2021_agregat.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status} saat memuat data_2021_agregat.json`);
        dataCache = await resp.json();
        return dataCache;
      } catch (err) {
        console.error('Gagal memuat data analitik 2021:', err);
        return null;
      } finally {
        muatPromise = null;
      }
    })();

    return muatPromise;
  }

  function is2021(dari, sampai) {
    if (!dari && !sampai) return false;
    const d = dari || '1970-01-01';
    const s = sampai || '2099-12-31';
    return d <= '2021-12-31' && s >= '2021-01-01';
  }

  function isMurni2021(dari, sampai) {
    if (!dari || !sampai) return false;
    return dari.startsWith('2021') && sampai.startsWith('2021');
  }

  /* Ringkasan metrik utama untuk periode 2021 */
  async function ringkasan(dari, sampai) {
    const d = await muatData();
    if (!d) return null;

    // Jika mencakup seluruh tahun 2021
    if ((!dari || dari <= '2021-01-01') && (!sampai || sampai >= '2021-12-31')) {
      return {
        totalKunjungan: d.total_kunjungan,
        totalPermintaan: d.total_kunjungan,
        selesaiLab: d.total_kunjungan,
        prosesLab: 0,
        totalItemPeriksa: d.total_tes,
        totalFisik: 0,
        bpjs: 606,
        pctSelesai: 100,
        perCaraBayar: {
          'UMUM': 17308,
          'PERUSAHAAN': 4992,
          'BPJS': 606
        }
      };
    }

    // Jika rentang tanggal tertentu di 2021
    let totalKunjungan = 0;
    let totalItemPeriksa = 0;
    let bpjs = 0;
    const perHari = d.per_hari || {};

    const tglAwal = dari || '2021-01-01';
    const tglAkhir = sampai || '2021-12-31';

    Object.entries(perHari).forEach(([tgl, h]) => {
      if (tgl >= tglAwal && tgl <= tglAkhir) {
        totalKunjungan += h.kunjungan || 0;
        totalItemPeriksa += h.total_tes || 0;
        bpjs += h.bpjs || 0;
      }
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

  /* Daftar pemeriksaan lab teratas */
  async function pemeriksaanTeratas({ dari, sampai, kelompok, batas = 15 } = {}) {
    const d = await muatData();
    if (!d) return [];

    let list = [];
    const isFullYear = (!dari || dari <= '2021-01-01') && (!sampai || sampai >= '2021-12-31');

    if (isFullYear) {
      list = d.pemeriksaan_teratas || [];
    } else {
      // Hitung dari per_hari untuk rentang kustom
      const hitung = {};
      const tglAwal = dari || '2021-01-01';
      const tglAkhir = sampai || '2021-12-31';
      const perHari = d.per_hari || {};

      Object.entries(perHari).forEach(([tgl, h]) => {
        if (tgl >= tglAwal && tgl <= tglAkhir && Array.isArray(h.top_tes)) {
          h.top_tes.forEach(item => {
            hitung[item.nama] = (hitung[item.nama] || 0) + item.jml;
          });
        }
      });

      // Lengkapi dengan nama kelompok
      const klpMap = {};
      (d.pemeriksaan_teratas || []).forEach(p => { klpMap[p.nama] = p.kelompok; });

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

  /* Distribusi kelompok / kategori pemeriksaan */
  async function distribusiKelompok({ dari, sampai } = {}) {
    const d = await muatData();
    if (!d) return [];

    const isFullYear = (!dari || dari <= '2021-01-01') && (!sampai || sampai >= '2021-12-31');
    if (isFullYear && d.kelompok_distribusi) {
      return d.kelompok_distribusi;
    }

    // Jika custom rentang
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

  /* Daftar dokter pengirim beserta frekuensi tes yang dirujuk */
  async function dokterPengirim({ dari, sampai, query = '', batas = 20 } = {}) {
    const d = await muatData();
    if (!d) return [];

    let list = d.dokter_pengirim || [];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(dok => dok.nama.toLowerCase().includes(q));
    }

    return batas > 0 ? list.slice(0, batas) : list;
  }

  /* Daftar tes yang dirujuk oleh satu dokter tertentu */
  async function tesPerDokter(namaDokter) {
    const d = await muatData();
    if (!d || !namaDokter) return [];
    const dok = (d.dokter_pengirim || []).find(x => x.nama.toLowerCase() === namaDokter.toLowerCase());
    return dok ? dok.top_tes : [];
  }

  /* Daftar instansi / perusahaan mitra */
  async function instansiPengirim({ query = '', batas = 20 } = {}) {
    const d = await muatData();
    if (!d) return [];

    let list = d.instansi_pengirim || [];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(ins => ins.nama.toLowerCase().includes(q));
    }

    return batas > 0 ? list.slice(0, batas) : list;
  }

  /* Daftar tes untuk instansi tertentu */
  async function tesPerInstansi(namaInstansi) {
    const d = await muatData();
    if (!d || !namaInstansi) return [];
    const ins = (d.instansi_pengirim || []).find(x => x.nama.toLowerCase() === namaInstansi.toLowerCase());
    return ins ? ins.top_tes : [];
  }

  /* Data 12 bulan 2021 untuk Tab Overview & Tren */
  async function overviewBulanan() {
    const d = await muatData();
    if (!d || !d.per_bulan) return null;

    const monthKeys = Object.keys(d.per_bulan).sort();
    const bulanan = monthKeys.map(k => d.per_bulan[k]);

    return {
      monthKeys,
      bulanan,
      jamPeriksa: d.jam_periksa || []
    };
  }

  return {
    muatData,
    is2021,
    isMurni2021,
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
