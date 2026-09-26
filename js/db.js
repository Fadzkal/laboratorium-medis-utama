/* =====================================================================
   DB — satu-satunya tempat aplikasi berbicara dengan Supabase.
   Semua halaman memanggil fungsi di sini, bukan memanggil Supabase
   langsung, supaya mudah diubah saat digabung dengan portal klinik.
   ===================================================================== */
const DB = (() => {

  const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  /* Profil pengguna yang sedang login, di-cache selama sesi */
  let _saya = null;
  let _faskes = null;

  /* --------------------------- Autentikasi ---------------------------- */
  async function masuk(identifier, sandi) {
    let target = (identifier || '').trim();
    if (!target) throw new Error('Username atau email wajib diisi.');

    // Jika pengguna memasukkan username tanpa domain '@'
    if (!target.includes('@')) {
      try {
        const { data: emailDariDb, error: rpcErr } = await sb.rpc('ambil_email_login', {
          p_identifier: target
        });
        if (!rpcErr && emailDariDb && emailDariDb.includes('@')) {
          target = emailDariDb;
        } else {
          target = target.toLowerCase() + '@labutama.id';
        }
      } catch (e) {
        target = target.toLowerCase() + '@labutama.id';
      }
    }

    const { data, error } = await sb.auth.signInWithPassword({ email: target, password: sandi });
    if (error) throw error;
    return data;
  }
  async function keluar() { _saya = null; await sb.auth.signOut(); }
  async function sesi() { const { data } = await sb.auth.getSession(); return data.session; }

  async function saya(paksaMuat = false) {
    if (_saya && !paksaMuat) return _saya;
    const s = await sesi();
    if (!s) return null;
    const { data, error } = await sb.from('pegawai')
      .select('*, poli:poli_default(id,nama,kode)').eq('id', s.user.id).single();
    if (error) throw error;
    const usernameDefault = data?.username || s.user.user_metadata?.username || (s.user.email ? s.user.email.split('@')[0] : '');
    _saya = { ...data, username: usernameDefault, email: s.user.email };
    return _saya;
  }

  const bolehTulis = (peranDiizinkan) =>
    _saya && (peranDiizinkan.includes(_saya.peran) || _saya.peran === 'master');

  /* --------------------------- Profil klinik --------------------------- */
  async function faskes(paksaMuat = false) {
    if (_faskes && !paksaMuat) return _faskes;
    const { data, error } = await sb.from('faskes').select('*').eq('id', 1).single();
    if (error) throw error;
    _faskes = data; return data;
  }
  async function simpanFaskes(patch) {
    const { data, error } = await sb.from('faskes').update(patch).eq('id', 1).select().single();
    if (error) throw error;
    _faskes = data; return data;
  }

  /* --------------------------- Master ---------------------------------- */
  async function daftarPoli(hanyaAktif = true) {
    let q = sb.from('poli').select('*').order('urutan');
    if (hanyaAktif) q = q.eq('aktif', true);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function daftarDokter(jenis = null) {
    let q = sb.from('pegawai')
      .select('*')
      .eq('peran', 'dokter').eq('aktif', true).order('nama');
    const { data, error } = await q;
    if (error) throw error;
    if (!jenis) return data;
    // Dokter tanpa keterangan jenis tetap ditampilkan agar tidak ada yang hilang
    // hanya karena kolomnya belum diisi.
    return data.filter(d => !d.jenis_dokter || d.jenis_dokter === jenis);
  }
  async function simpanPegawaiDokter(rec, id = null) {
    const { data, error } = await sb.rpc('simpan_pegawai_dokter', {
      p_id: id || null,
      p_nama: rec.nama || '',
      p_alamat: rec.alamat || '',
      p_telepon: rec.telepon || '',
      p_hp: rec.no_hp || '',
      p_kode_detailer: rec.kode_detailer || '',
      p_spesialisasi: rec.spesialisasi || ''
    });
    if (error) throw error;
    return data;
  }
  async function hapusPegawaiDokter(id) {
    const { data, error } = await sb.from('pegawai').update({ aktif: false }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  async function daftarPegawai() {
    const { data, error } = await sb.from('pegawai').select('*').order('created_at', { ascending: false });
    if (error) throw error; return data;
  }
  async function tambahPengguna(payload) {
    const { data, error } = await sb.rpc('tambah_pengguna_langsung', {
      p_nama: payload.nama,
      p_email: payload.email,
      p_password: payload.password,
      p_peran: payload.peran || 'admin',
      p_jenis_dokter: payload.jenis_dokter || null,
      p_no_sip: payload.no_sip || null,
      p_username: payload.username || null
    });
    if (error) throw error;
    return data;
  }
  async function hapusPengguna(id) {
    const { data, error } = await sb.rpc('hapus_pengguna_langsung', { p_id: id });
    if (error) throw error;
    return data;
  }
  async function resetPasswordPengguna(id, passwordBaru) {
    const { data, error } = await sb.rpc('reset_password_pengguna', { p_id: id, p_password_baru: passwordBaru });
    if (error) throw error;
    return data;
  }
  async function ubahProfilSaya(payload) {
    const { data, error } = await sb.rpc('ubah_profil_saya', {
      p_nama: payload.nama,
      p_email: payload.email,
      p_password_baru: payload.password || null,
      p_username: payload.username || null
    });
    if (error) throw error;
    if (_saya) {
      _saya.nama = payload.nama;
      _saya.username = data?.username || payload.username || (payload.email?.includes('@') ? payload.email.split('@')[0] : payload.email);
      _saya.email = data?.email || payload.email;
    }
    return data;
  }
  async function adminUbahPengguna(payload) {
    const { data, error } = await sb.rpc('admin_ubah_pengguna', {
      p_id: payload.id,
      p_nama: payload.nama,
      p_email: payload.email,
      p_password_baru: payload.password || null,
      p_username: payload.username || null
    });
    if (error) throw error;
    return data;
  }

  /* ------------------------- Hak akses (9 Sep 2026) -------------------- */
  // Kode yang diizinkan untuk PERAN SENDIRI — dimuat sekali saat masuk
  // (lihat js/app.js -> mulai()), dipakai App.boleh(kode).
  async function hakAksesSaya() {
    const { data, error } = await sb.from('v_hak_akses_saya').select('kode');
    if (error) throw error;
    return data.map(r => r.kode);
  }
  // Matriks lengkap (semua peran x semua kode) — hanya master yang bisa
  // membacanya lewat RLS, dipakai halaman Pengaturan -> Hak Akses.
  async function daftarHakAkses() {
    const { data, error } = await sb.from('hak_akses').select('*');
    if (error) throw error; return data;
  }
  async function simpanHakAkses(kode, peran, diizinkan) {
    const { error } = await sb.from('hak_akses')
      .upsert({ kode, peran, diizinkan, diubah_oleh: _saya?.id, diubah_pada: new Date().toISOString() },
              { onConflict: 'kode,peran' });
    if (error) throw error;
  }
  /* Dicari lewat fungsi cari_icd10 (lihat sql/31) yang mengurutkan hasil
     berdasarkan similarity() ke kata yang diketik, BUKAN cuma status
     "sering dipakai" — supaya baris paling relevan naik ke atas duluan
     sebelum kena batas potong `batas`. Sebelum ini, kata pencarian umum
     yang cocok ke ratusan baris (wajar sekarang, tabel sudah 10 ribuan
     baris) bisa membuat baris yang sebenarnya dicari dokter "terpotong"
     begitu saja walau kodenya ada — persis keluhan Fadzkal 14 Sep 2026. */
  async function cariIcd(kata, batas = 25) {
    if (!kata || kata.length < 3) {
      const { data, error } = await sb.from('icd10').select('kode,nama_id,nama_en')
        .eq('sering_dipakai', true).eq('aktif', true).order('nama_id').limit(60);
      if (error) throw error; return data;
    }
    const { data, error } = await sb.rpc('cari_icd10', { p_kata: kata, p_batas: batas });
    if (error) throw error; return data;
  }
  /* `kode_pcare` dan `dpho` WAJIB ikut terpilih. Keduanya yang menentukan
     obat ini dikirim ke PCare sebagai kdObat (obat DPHO) atau sebagai
     nmObatNonDPHO. Kalau lupa diminta, setiap obat yang diresepkan
     tercatat sebagai non-DPHO tanpa satu pun galat, dan klaim obat
     program tidak pernah terbayar. */
  async function cariObat(kata, batas = 25) {
    let q = sb.from('obat')
      .select('id,nama,satuan,bentuk_sediaan,kekuatan,kode_kfa,kode_pcare,dpho,golongan')
      .eq('aktif', true).order('nama').limit(batas);
    if (kata && kata.length >= 2) q = q.or(`nama.ilike.%${kata}%,nama_generik.ilike.%${kata}%`);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  /* Untuk pencarian obat di Kasir (Tambah baris / Penjualan bebas) —
     beda dari cariObat() di atas karena kasir butuh HARGA JUAL dan STOK
     SAAT INI, bukan kode klaim BPJS. Dibaca dari v_apotek_stok, bukan
     tabel obat langsung, supaya kasir bisa melihat stok layaknya di
     Apotek tanpa pindah halaman — kolom yang sama, tempat yang sama
     dengan yang dipakai apotek.js. */
  async function cariObatJual(kata, batas = 25) {
    let q = sb.from('v_apotek_stok')
      .select('obat_id,nama_obat,satuan,bentuk_sediaan,kekuatan,golongan,harga_jual,stok_layak')
      .eq('aktif', true).order('nama_obat').limit(batas);
    if (kata && kata.trim().length >= 2) q = q.ilike('nama_obat', `%${kata.trim()}%`);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function daftarSigna() {
    const { data, error } = await sb.from('signa').select('*').order('urutan');
    if (error) throw error; return data;
  }

  /* --------------------------- Pasien ---------------------------------- */
  async function cariPasien(kata, batas = 30) {
    let q = sb.from('pasien')
      .select('id,no_rm,nik,no_bpjs,nama,title,nrp,bagian,plant,tanggal_lahir,jenis_kelamin,alamat,no_hp,catatan_penting')
      .eq('aktif', true).order('nama').limit(batas);
    if (kata && kata.trim().length >= 2) {
      const k = kata.trim();
      q = q.or(`nama.ilike.%${k}%,no_rm.ilike.%${k}%,nik.ilike.%${k}%,no_bpjs.ilike.%${k}%`);
    }
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  /* ------------------------------------------------------------------
   *  PEMANTAUAN KRONIS BPJS 6 BULAN & EVALUASI HBA1C PASIEN
   * ------------------------------------------------------------------ */
  let _cacheKronis = null;
  let _cacheKronisWaktu = 0;

  const DEFAULT_HASIL_KRONIS = {
    ringkasan: {
      totalKronis: 0,
      totalHT: 0,
      totalDM: 0,
      totalBpjsKronis: 0,
      bpjsSudahKlaim: 0,
      bpjsJatuhTempo: 0,
      persenBpjsSudahKlaim: 0,
      persenBpjsJatuhTempo: 0,
      totalDm: 0,
      totalDmTerperiksa: 0,
      dmHba1cTerkontrol: 0,
      dmHba1cTinggi: 0,
      dmHba1cBelum: 0,
      persenHba1cTerkontrol: 0,
      persenHba1cTinggi: 0,
      rataRataHba1c: null
    },
    mapPasien: new Map(),
    daftar: []
  };

  async function dataKronisBpjsPasien(paksaSegar = false) {
    if (!paksaSegar && _cacheKronis && (Date.now() - _cacheKronisWaktu < 120000)) {
      return _cacheKronis;
    }

    try {
      let dataList = [];
      let pakaiView = false;

      // 1. Coba ambil dari v_pasien_kronis_bpjs jika view SQL sudah ada di Supabase
      try {
        const res = await sb.from('v_pasien_kronis_bpjs').select('*');
        if (res && !res.error && Array.isArray(res.data) && res.data.length > 0) {
          dataList = res.data;
          pakaiView = true;
        } else if (res && res.error) {
          console.warn('v_pasien_kronis_bpjs tidak dapat diakses, beralih ke fallback:', res.error.message || res.error);
          pakaiView = false;
        }
      } catch (e) {
        console.warn('Gagal membaca v_pasien_kronis_bpjs, beralih ke fallback:', e.message || e);
        pakaiView = false;
      }

      // 2. Fallback: Hitung mandiri dari tabel pasien, kunjungan, kronis_terapi, diagnosa, lab_hasil
      if (!pakaiView) {
        async function jalankanAman(promiseBuilder) {
          try {
            const res = await promiseBuilder;
            return (res && !res.error && Array.isArray(res.data)) ? res.data : [];
          } catch (_) {
            return [];
          }
        }

        const now = new Date();
        const [semuaPasien, kunjBpjs, kronisTerapi, diagnosaList, labHasilList] = await Promise.all([
          jalankanAman(sb.from('pasien').select('id, no_rm, nama, no_bpjs, no_hp, tanggal_lahir, jenis_kelamin, catatan_penting').eq('aktif', true)),
          jalankanAman(sb.from('kunjungan').select('pasien_id, tanggal').eq('cara_bayar', 'BPJS').order('tanggal', { ascending: false })),
          jalankanAman(sb.from('kronis_terapi').select('pasien_id, aktif, kronis_terapi_diagnosa(kode)').eq('aktif', true)),
          jalankanAman(sb.from('diagnosa').select('kunjungan:kunjungan_id(pasien_id), kode_icd10')),
          jalankanAman(sb.from('lab_hasil').select('nilai_angka, nilai_teks, nama, permintaan:permintaan_id(pasien_id, tanggal, status)').order('created_at', { ascending: false }))
        ]);

        // Map kunjungan BPJS terakhir per pasien
      const mapKlaim = new Map();
      kunjBpjs.forEach(k => {
        if (k.pasien_id && !mapKlaim.has(k.pasien_id) && k.tanggal) {
          mapKlaim.set(k.pasien_id, k.tanggal);
        }
      });

      // Map diagnosa kronis per pasien
      const mapHT = new Set();
      const mapDM = new Set();

      kronisTerapi.forEach(kt => {
        if (!kt.pasien_id) return;
        const diagCodes = (kt.kronis_terapi_diagnosa || []).map(d => d.kode);
        if (diagCodes.includes('HPT')) mapHT.add(kt.pasien_id);
        if (diagCodes.includes('DM')) mapDM.add(kt.pasien_id);
      });

      diagnosaList.forEach(d => {
        const pId = d.kunjungan?.pasien_id;
        if (!pId) return;
        const icd = (d.kode_icd10 || '').toUpperCase();
        if (/^(I10|I11|I12|I13|I15)/.test(icd)) mapHT.add(pId);
        if (/^(E10|E11|E13|E14)/.test(icd)) mapDM.add(pId);
      });

      // Map HbA1c terbaru per pasien
      const mapHba1c = new Map();
      labHasilList.forEach(lh => {
        const nm = (lh.nama || '').toLowerCase();
        if (!nm.includes('hba1c') && !nm.includes('hemoglobin a1c')) return;
        const req = lh.permintaan;
        if (!req || !req.pasien_id || req.status !== 'SELESAI') return;
        const pId = req.pasien_id;
        if (!mapHba1c.has(pId)) {
          let val = lh.nilai_angka;
          if (val === null || val === undefined) {
            const parsed = parseFloat(String(lh.nilai_teks || '').replace(',', '.'));
            if (!isNaN(parsed) && isFinite(parsed)) val = parsed;
          }
          mapHba1c.set(pId, { nilai: val, tanggal: req.tanggal });
          mapDM.add(pId); // Tes HbA1c otomatis penanda pasien DM
        }
      });

      dataList = semuaPasien.map(p => {
        const cp = (p.catatan_penting || '').toLowerCase();
        const isHT = mapHT.has(p.id) || /(hipertensi|\bhpt\b|\bht\b|tensi tinggi)/.test(cp);
        const isDM = mapDM.has(p.id) || /(diabetes|\bdm\b|gula darah|kencing manis)/.test(cp);

        let jenis_kronis = 'Non-Kronis';
        if (isHT && isDM) jenis_kronis = 'HT & DM';
        else if (isHT) jenis_kronis = 'Hipertensi';
        else if (isDM) jenis_kronis = 'Diabetes Melitus';

        const tglKlaim = mapKlaim.get(p.id) || null;
        let hariSejakKlaim = null;
        let statusKlaim = 'NON_BPJS';
        const hasBpjs = p.no_bpjs && p.no_bpjs.trim() !== '' && p.no_bpjs !== '-';

        if (hasBpjs) {
          if (!tglKlaim) {
            statusKlaim = 'BELUM_KLAIM';
          } else {
            const dKlaim = new Date(tglKlaim);
            hariSejakKlaim = Math.max(0, Math.floor((now.getTime() - dKlaim.getTime()) / (1000 * 60 * 60 * 24)));
            statusKlaim = hariSejakKlaim <= 180 ? 'SUDAH_KLAIM_6BLN' : 'JATUH_TEMPO_6BLN';
          }
        }

        const hba1cData = mapHba1c.get(p.id) || null;
        const nilaiHba1c = hba1cData ? hba1cData.nilai : null;
        const tglHba1c = hba1cData ? hba1cData.tanggal : null;
        let statusHba1c = 'BELUM_PERIKSA';
        let siklusHba1c = 'Segera Periksa (3/6 Bln)';

        if (nilaiHba1c !== null && !isNaN(nilaiHba1c)) {
          if (nilaiHba1c < 7.0) {
            statusHba1c = 'TERKONTROL';
            siklusHba1c = '6 Bulan';
          } else {
            statusHba1c = 'BELUM_TERKONTROL';
            siklusHba1c = '3 Bulan';
          }
        }

        return {
          pasien_id: p.id,
          no_rm: p.no_rm,
          nama: p.nama,
          no_bpjs: p.no_bpjs,
          no_hp: p.no_hp,
          tanggal_lahir: p.tanggal_lahir,
          jenis_kelamin: p.jenis_kelamin,
          is_ht: isHT,
          is_dm: isDM,
          jenis_kronis,
          tgl_klaim_bpjs: tglKlaim,
          hari_sejak_klaim: hariSejakKlaim,
          status_klaim_bpjs: statusKlaim,
          tgl_hba1c: tglHba1c,
          nilai_hba1c: nilaiHba1c,
          status_hba1c: statusHba1c,
          siklus_rekomendasi_hba1c: siklusHba1c
        };
      });
    }

      return hitungRingkasanKronis(dataList);
    } catch (errGlobal) {
      console.warn('Gagal memproses data kronis BPJS & HbA1c, gunakan default:', errGlobal.message || errGlobal);
      return DEFAULT_HASIL_KRONIS;
    }
  }

  function hitungRingkasanKronis(dataList) {
    const mapPasien = new Map();
    dataList.forEach(r => mapPasien.set(r.pasien_id, r));

    // Pasien kronis (HT atau DM)
    const pasienKronis = dataList.filter(r => r.is_ht || r.is_dm);
    const totalHT = dataList.filter(r => r.is_ht).length;
    const totalDM = dataList.filter(r => r.is_dm).length;

    // Status BPJS Pasien Kronis
    const kronisBpjs = pasienKronis.filter(r => r.status_klaim_bpjs !== 'NON_BPJS');
    const bpjsSudahKlaim = kronisBpjs.filter(r => r.status_klaim_bpjs === 'SUDAH_KLAIM_6BLN').length;
    const bpjsJatuhTempo = kronisBpjs.filter(r => r.status_klaim_bpjs === 'JATUH_TEMPO_6BLN' || r.status_klaim_bpjs === 'BELUM_KLAIM').length;
    const totalBpjsKronis = kronisBpjs.length;

    const persenBpjsSudahKlaim = totalBpjsKronis ? Math.round((bpjsSudahKlaim / totalBpjsKronis) * 100) : 0;
    const persenBpjsJatuhTempo = totalBpjsKronis ? Math.round((bpjsJatuhTempo / totalBpjsKronis) * 100) : 0;

    // Status HbA1c Pasien Diabetes
    const pasienDM = dataList.filter(r => r.is_dm);
    const dmHba1cTerkontrol = pasienDM.filter(r => r.status_hba1c === 'TERKONTROL').length;
    const dmHba1cTinggi = pasienDM.filter(r => r.status_hba1c === 'BELUM_TERKONTROL').length;
    const dmHba1cBelum = pasienDM.filter(r => r.status_hba1c === 'BELUM_PERIKSA').length;
    const totalDmTerperiksa = dmHba1cTerkontrol + dmHba1cTinggi;

    const persenHba1cTerkontrol = totalDmTerperiksa ? Math.round((dmHba1cTerkontrol / totalDmTerperiksa) * 100) : 0;
    const persenHba1cTinggi = totalDmTerperiksa ? Math.round((dmHba1cTinggi / totalDmTerperiksa) * 100) : 0;

    const arrNilai = pasienDM.map(r => Number(r.nilai_hba1c)).filter(v => !isNaN(v) && v > 0);
    const rataRataHba1c = arrNilai.length ? (arrNilai.reduce((a, b) => a + b, 0) / arrNilai.length).toFixed(1) : null;

    const hasil = {
      ringkasan: {
        totalKronis: pasienKronis.length,
        totalHT,
        totalDM,
        totalBpjsKronis,
        bpjsSudahKlaim,
        bpjsJatuhTempo,
        persenBpjsSudahKlaim,
        persenBpjsJatuhTempo,
        totalDm: pasienDM.length,
        totalDmTerperiksa,
        dmHba1cTerkontrol,
        dmHba1cTinggi,
        dmHba1cBelum,
        persenHba1cTerkontrol,
        persenHba1cTinggi,
        rataRataHba1c
      },
      mapPasien,
      daftar: dataList
    };
    _cacheKronis = hasil;
    _cacheKronisWaktu = Date.now();
    return hasil;
  }

  /* Mengambil daftar pasien lengkap dengan statistik kunjungan & kelengkapan (Teroptimasi Cepat) */
  async function daftarPasienLengkap(filter = {}) {
    const {
      kata = '',
      tipe = 'semua',
      urut = 'kunjungan_terbanyak',
      jk = 'semua',
      umur = 'semua',
      kelengkapan = 'semua',
      kronis = 'semua',
      batas = 25,
      offset = 0,
      ambilKronis = false,
      infoKronis = null
    } = filter;

    let dataPasien = [];
    let pakaiView = false;
    let totalHitung = null;
    const batasNum = Number(batas) || 25;
    const offsetNum = Number(offset) || 0;

    // 1. Coba ambil dari v_pasien_lengkap jika view SQL sudah dieksekusi di Supabase
    try {
      let q = sb.from('v_pasien_lengkap').select('*', { count: 'exact' });

      if (kata && kata.trim().length >= 2) {
        const k = kata.trim();
        q = q.or(`nama.ilike.%${k}%,no_rm.ilike.%${k}%,nik.ilike.%${k}%,no_bpjs.ilike.%${k}%,no_hp.ilike.%${k}%`);
      }

      if (jk === 'L' || jk === 'P') {
        q = q.eq('jenis_kelamin', jk);
      }

      if (tipe === 'bpjs') {
        q = q.not('no_bpjs', 'is', null).neq('no_bpjs', '').neq('no_bpjs', '-');
      } else if (tipe === 'umum') {
        q = q.or('no_bpjs.is.null,no_bpjs.eq.,no_bpjs.eq.-');
      } else if (tipe === 'rekanan') {
        q = q.or('nrp.not.is.null,bagian.not.is.null,plant.not.is.null');
      }

      // Pengurutan DB
      if (urut === 'kunjungan_terbanyak') {
        q = q.order('jml_kunjungan', { ascending: false }).order('kunjungan_terakhir', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      } else if (urut === 'kunjungan_terakhir') {
        q = q.order('kunjungan_terakhir', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      } else if (urut === 'nama_asc') {
        q = q.order('nama', { ascending: true });
      } else if (urut === 'nama_desc') {
        q = q.order('nama', { ascending: false });
      } else if (urut === 'rm_desc') {
        q = q.order('no_rm', { ascending: false });
      } else if (urut === 'rm_asc') {
        q = q.order('no_rm', { ascending: true });
      } else {
        q = q.order('created_at', { ascending: false });
      }

      // Range paginasi
      q = q.range(offsetNum, offsetNum + batasNum - 1);

      const { data, count, error } = await q;
      if (!error && Array.isArray(data)) {
        dataPasien = data.map(r => ({ ...r, kekurangan: r.kekurangan || [] }));
        pakaiView = true;
        totalHitung = count;
      }
    } catch (e) {
      pakaiView = false;
    }

    // 2. Fallback jika view belum dibuat: ambil langsung dari pasien + relasi kunjungan
    if (!pakaiView) {
      let q = sb.from('pasien')
        .select('id,no_rm,nik,no_bpjs,nama,title,nrp,bagian,plant,tanggal_lahir,jenis_kelamin,alamat,no_hp,no_telp,catatan_penting,created_at,kunjungan(id,tanggal,cara_bayar)', { count: 'exact' })
        .eq('aktif', true);

      if (kata && kata.trim().length >= 2) {
        const k = kata.trim();
        q = q.or(`nama.ilike.%${k}%,no_rm.ilike.%${k}%,nik.ilike.%${k}%,no_bpjs.ilike.%${k}%,no_hp.ilike.%${k}%`);
      }
      if (jk === 'L' || jk === 'P') {
        q = q.eq('jenis_kelamin', jk);
      }
      if (tipe === 'bpjs') {
        q = q.not('no_bpjs', 'is', null).neq('no_bpjs', '').neq('no_bpjs', '-');
      } else if (tipe === 'umum') {
        q = q.or('no_bpjs.is.null,no_bpjs.eq.,no_bpjs.eq.-');
      }

      if (urut === 'nama_asc') q = q.order('nama', { ascending: true });
      else if (urut === 'nama_desc') q = q.order('nama', { ascending: false });
      else if (urut === 'rm_desc') q = q.order('no_rm', { ascending: false });
      else if (urut === 'rm_asc') q = q.order('no_rm', { ascending: true });
      else q = q.order('created_at', { ascending: false });

      q = q.range(offsetNum, offsetNum + batasNum - 1);

      const { data, count, error } = await q;
      if (error) throw error;
      totalHitung = count;

      dataPasien = (data || []).map(p => {
        const visits = p.kunjungan || [];
        const jml = visits.length;
        const lastVisit = jml > 0 ? visits.map(v => v.tanggal).filter(Boolean).sort().pop() : null;

        const kek = [];
        if (!p.nik || !/^\d{16}$/.test(p.nik)) kek.push('NIK belum diisi atau bukan 16 angka');
        const adaBpjs = visits.some(v => v.cara_bayar === 'BPJS');
        if (adaBpjs && (!p.no_bpjs || !/^\d{13}$/.test(p.no_bpjs))) kek.push('Nomor BPJS belum diisi atau bukan 13 angka');
        if (!p.tanggal_lahir) kek.push('Tanggal lahir belum diisi');
        if (!p.jenis_kelamin) kek.push('Jenis kelamin belum diisi');

        return {
          ...p,
          jml_kunjungan: jml,
          kunjungan_terakhir: lastVisit,
          kekurangan: kek
        };
      });
    }

    // 3. Resolusi info kronis (dari cache, argumen, atau default cepat non-blocking)
    let mapKronis = null;
    let ringkasanKronis = {};

    if (infoKronis && infoKronis.mapPasien) {
      mapKronis = infoKronis.mapPasien;
      ringkasanKronis = infoKronis.ringkasan || {};
    } else if (_cacheKronis && (Date.now() - _cacheKronisWaktu < 120000)) {
      mapKronis = _cacheKronis.mapPasien;
      ringkasanKronis = _cacheKronis.ringkasan || {};
    } else if (ambilKronis) {
      const info = await dataKronisBpjsPasien().catch(() => ({ mapPasien: new Map(), ringkasan: {} }));
      mapKronis = info.mapPasien;
      ringkasanKronis = info.ringkasan || {};
    }

    dataPasien.forEach(p => {
      if (mapKronis && mapKronis.has(p.id)) {
        p.kronis = mapKronis.get(p.id);
      } else {
        const cp = (p.catatan_penting || '').toLowerCase();
        const isHT = /(hipertensi|\bhpt\b|\bht\b|tensi tinggi)/.test(cp);
        const isDM = /(diabetes|\bdm\b|gula darah|kencing manis)/.test(cp);
        p.kronis = {
          is_ht: isHT,
          is_dm: isDM,
          jenis_kronis: (isHT && isDM) ? 'HT & DM' : (isHT ? 'Hipertensi' : (isDM ? 'Diabetes Melitus' : 'Non-Kronis')),
          status_klaim_bpjs: (p.no_bpjs && p.no_bpjs.trim() && p.no_bpjs !== '-') ? 'BELUM_KLAIM' : 'NON_BPJS',
          status_hba1c: 'BELUM_PERIKSA',
          nilai_hba1c: null,
          tgl_hba1c: null,
          siklus_rekomendasi_hba1c: 'Segera Periksa (3/6 Bln)'
        };
      }
    });

    // 4. Filter Khusus Kronis & Klaim BPJS 6 Bulan / HbA1c (jika dipilih)
    if (kronis && kronis !== 'semua') {
      if (kronis === 'bpjs_sudah_klaim') {
        dataPasien = dataPasien.filter(p => p.kronis?.status_klaim_bpjs === 'SUDAH_KLAIM_6BLN');
      } else if (kronis === 'bpjs_belum_klaim') {
        dataPasien = dataPasien.filter(p => (p.kronis?.status_klaim_bpjs === 'JATUH_TEMPO_6BLN' || p.kronis?.status_klaim_bpjs === 'BELUM_KLAIM') && (p.kronis?.is_ht || p.kronis?.is_dm));
      } else if (kronis === 'dm_hba1c_terkontrol') {
        dataPasien = dataPasien.filter(p => p.kronis?.status_hba1c === 'TERKONTROL');
      } else if (kronis === 'dm_hba1c_tinggi') {
        dataPasien = dataPasien.filter(p => p.kronis?.status_hba1c === 'BELUM_TERKONTROL');
      } else if (kronis === 'dm_hba1c_belum') {
        dataPasien = dataPasien.filter(p => p.kronis?.is_dm && p.kronis?.status_hba1c === 'BELUM_PERIKSA');
      } else if (kronis === 'semua_kronis') {
        dataPasien = dataPasien.filter(p => p.kronis?.is_ht || p.kronis?.is_dm);
      }
    }

    // 5. Filter Kelompok Umur
    if (umur && umur !== 'semua') {
      const now = new Date();
      dataPasien = dataPasien.filter(p => {
        if (!p.tanggal_lahir) return false;
        const lahir = new Date(p.tanggal_lahir);
        let th = now.getFullYear() - lahir.getFullYear();
        const m = now.getMonth() - lahir.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) th--;
        if (umur === 'anak') return th < 18;
        if (umur === 'dewasa') return th >= 18 && th < 60;
        if (umur === 'lansia') return th >= 60;
        return true;
      });
    }

    // 6. Filter Kelengkapan Data
    if (kelengkapan === 'lengkap') {
      dataPasien = dataPasien.filter(p => !p.kekurangan || p.kekurangan.length === 0);
    } else if (kelengkapan === 'kurang') {
      dataPasien = dataPasien.filter(p => p.kekurangan && p.kekurangan.length > 0);
    }

    // Lampirkan metadata pagination
    dataPasien.total = totalHitung;
    dataPasien.offset = offsetNum;
    dataPasien.batas = batasNum;
    dataPasien.adaLanjutan = (dataPasien.length >= batasNum);
    dataPasien.ringkasanKronis = ringkasanKronis;
    return dataPasien;
  }
  async function pasien(id) {
    const { data, error } = await sb.from('pasien').select('*').eq('id', id).single();
    if (error) throw error; return data;
  }
  async function simpanPasien(data, id = null) {
    _cacheKronis = null; _cacheKronisWaktu = 0;
    const q = id
      ? sb.from('pasien').update(data).eq('id', id).select().single()
      : sb.from('pasien').insert(data).select().single();
    const { data: hasil, error } = await q;
    if (error) throw error; return hasil;
  }
  async function hapusPasien(id) {
    _cacheKronis = null; _cacheKronisWaktu = 0;
    try {
      const { error: rpcErr } = await sb.rpc('hapus_pasien', { p_pasien_id: id });
      if (!rpcErr) return true;
    } catch (e) {
      // Fallback manual client-side jika RPC belum diterapkan
    }

    try {
      const { data: labs } = await sb.from('lab_permintaan').select('id').eq('pasien_id', id);
      if (labs && labs.length > 0) {
        const labIds = labs.map(l => l.id);
        await sb.from('lab_hasil').delete().in('permintaan_id', labIds);
        await sb.from('lab_permintaan').delete().eq('pasien_id', id);
      }
      await sb.from('surat').delete().eq('pasien_id', id);
      await sb.from('antrean').delete().eq('pasien_id', id);
      await sb.from('kunjungan').delete().eq('pasien_id', id);
    } catch (err) {
      console.warn('Pembersihan relasi pasien:', err);
    }

    const { error } = await sb.from('pasien').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  async function alergiPasien(pasienId) {
    const { data, error } = await sb.from('pasien_alergi').select('*')
      .eq('pasien_id', pasienId).order('dicatat_pada', { ascending: false });
    if (error) throw error; return data;
  }
  async function tambahAlergi(rec) {
    const { data, error } = await sb.from('pasien_alergi').insert(rec).select().single();
    if (error) throw error; return data;
  }
  async function hapusAlergi(id) {
    const { error } = await sb.from('pasien_alergi').delete().eq('id', id);
    if (error) throw error;
  }
  /* Catat siapa membuka rekam medis siapa — amanat audit trail */
  async function catatAkses(pasienId, keterangan) {
    try { await sb.rpc('catat_akses_rm', { p_pasien_id: pasienId, p_keterangan: keterangan || null }); }
    catch (e) { console.warn('Gagal mencatat akses:', e.message); }
  }

  /* --------------------------- Kunjungan -------------------------------- */
  async function antrianHariIni() {
    const { data, error } = await sb.from('v_antrian_hari_ini').select('*');
    if (error) throw error; 
    
    if (!data || data.length === 0) return [];
    
    // Hanya tampilkan kunjungan yang memiliki permintaan lab
    const { data: labs } = await sb.from('lab_permintaan')
      .select('kunjungan_id')
      .in('kunjungan_id', data.map(d => d.id));
      
    const adaLabIds = new Set(labs?.map(l => l.kunjungan_id) || []);
    return data.filter(d => adaLabIds.has(d.id));
  }
  async function daftarKunjungan(filter = {}) {
    let q = sb.from('v_riwayat_kunjungan').select('*').limit(filter.batas || 100);
    if (filter.pasien_id) q = q.eq('pasien_id', filter.pasien_id);
    if (filter.dari) q = q.gte('tanggal', filter.dari);
    if (filter.sampai) q = q.lte('tanggal', filter.sampai);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function buatKunjungan(rec) {
    const { data, error } = await sb.from('kunjungan').insert(rec).select().single();
    if (error) throw error; return data;
  }
  /* `poli.jenis` WAJIB ikut terpilih di sini. Seluruh modul poli gigi —
     odontogram, pemeriksaan gigi & mulut, dan kolom nomor gigi pada daftar
     tindakan — dinyalakan oleh `kunjungan.poli.jenis === 'GIGI'` di
     pages/periksa.js dan pages/rekam.js. Kalau kolomnya tidak diminta,
     nilainya undefined, perbandingannya bernilai false, dan ketiga bagian itu
     hilang dari layar tanpa satu pun galat — halaman tetap tampil rapi,
     hanya saja poli gigi berubah jadi poli umum. Dijaga oleh
     test/uji_kolom_db.js. */
  async function kunjungan(id) {
    const { data, error } = await sb.from('kunjungan')
      .select(`*, pasien:pasien_id(*), poli:poli_id(id,nama,kode,jenis), dokter:dokter_id(id,nama,no_sip)`)
      .eq('id', id).single();
    if (error) throw error; return data;
  }
  async function ubahKunjungan(id, patch) {
    const { data, error } = await sb.from('kunjungan').update(patch).eq('id', id).select().single();
    if (error) throw error; return data;
  }

  /* --------------------------- Kajian awal ------------------------------ */
  async function kajian(kunjunganId) {
    const { data, error } = await sb.from('kajian_awal').select('*')
      .eq('kunjungan_id', kunjunganId).maybeSingle();
    if (error) throw error; return data;
  }
  async function simpanKajian(kunjunganId, rec) {
    const { data, error } = await sb.from('kajian_awal')
      .upsert({ ...rec, kunjungan_id: kunjunganId, dibuat_oleh: _saya?.id },
              { onConflict: 'kunjungan_id' }).select().single();
    if (error) throw error; return data;
  }

  /* --------------------------- Pemeriksaan (SOAP) ----------------------- */
  async function pemeriksaan(kunjunganId) {
    const { data, error } = await sb.from('pemeriksaan').select('*')
      .eq('kunjungan_id', kunjunganId).maybeSingle();
    if (error) throw error; return data;
  }
  async function simpanPemeriksaan(kunjunganId, rec) {
    const { data, error } = await sb.from('pemeriksaan')
      .upsert({ ...rec, kunjungan_id: kunjunganId, dibuat_oleh: _saya?.id },
              { onConflict: 'kunjungan_id' }).select().single();
    if (error) throw error; return data;
  }
  async function finalisasi(kunjunganId) {
    const { data, error } = await sb.from('pemeriksaan')
      .update({ final: true, final_pada: new Date().toISOString() })
      .eq('kunjungan_id', kunjunganId).select().single();
    if (error) throw error; return data;
  }
  async function tambahAddendum(kunjunganId, isi, alasan) {
    const { data, error } = await sb.from('addendum')
      .insert({ kunjungan_id: kunjunganId, isi, alasan, dibuat_oleh: _saya?.id })
      .select().single();
    if (error) throw error; return data;
  }
  async function daftarAddendum(kunjunganId) {
    const { data, error } = await sb.from('addendum')
      .select('*, penulis:dibuat_oleh(nama)').eq('kunjungan_id', kunjunganId)
      .order('dibuat_pada');
    if (error) throw error; return data;
  }

  /* --------------------------- Diagnosa --------------------------------- */
  async function diagnosa(kunjunganId) {
    const { data, error } = await sb.from('diagnosa').select('*')
      .eq('kunjungan_id', kunjunganId).order('jenis').order('urutan');
    if (error) throw error; return data;
  }
  async function simpanDiagnosa(kunjunganId, daftar) {
    // Ganti seluruh daftar diagnosa kunjungan ini (hapus lalu tulis ulang)
    const { error: e1 } = await sb.from('diagnosa').delete().eq('kunjungan_id', kunjunganId);
    if (e1) throw e1;
    if (!daftar.length) return [];
    const rows = daftar.map((d, i) => ({
      kunjungan_id: kunjunganId, kode_icd10: d.kode, nama: d.nama,
      jenis: d.jenis || (i === 0 ? 'PRIMER' : 'SEKUNDER'),
      kasus: d.kasus || 'BARU', urutan: i
    }));
    const { data, error } = await sb.from('diagnosa').insert(rows).select();
    if (error) throw error; return data;
  }

  /* --------------------------- Resep ------------------------------------ */
  async function resep(kunjunganId) {
    const { data, error } = await sb.from('resep')
      .select('*, item:resep_item(*)').eq('kunjungan_id', kunjunganId).maybeSingle();
    if (error) throw error;
    if (data && data.item) data.item.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    return data;
  }
  async function simpanResep(kunjunganId, item, catatan = null, iterMaks = 0) {
    let r = await resep(kunjunganId);
    /* Resep yang SUDAH pernah diserahkan apoteker (iter_terpakai > 0) tidak
       boleh lagi diubah daftar/iter-nya dari layar dokter ini — lihat
       cabang di bawah. */
    if (!r) {
      const { data, error } = await sb.from('resep')
        .insert({ kunjungan_id: kunjunganId, catatan, dibuat_oleh: _saya?.id,
                  iter_maks: Math.max(0, Number(iterMaks) || 0) }).select().single();
      if (error) throw error; r = data;
    } else if (r.iter_terpakai) {
      /* Resep ini sudah pernah diserahkan apoteker (mungkin baru
         penyerahan pertama dari beberapa iter). Daftar butirnya sudah
         jadi dasar riwayat penyerahan (resep_penyerahan_item) — menghapus
         resep_item di sini akan ikut menghapus riwayat itu (referensinya
         ON DELETE CASCADE). Tolak mentah-mentah, jangan diam-diam
         mengabaikan sebagian perubahan dokter. */
      throw new Error('Resep ini sudah pernah diserahkan apoteker, daftar obatnya tidak '
        + 'bisa diubah lagi dari sini. Buat resep susulan untuk tambahan obat baru.');
    } else {
      const patch = { catatan, iter_maks: Math.max(0, Number(iterMaks) || 0) };
      await sb.from('resep').update(patch).eq('id', r.id);
      const { error } = await sb.from('resep_item').delete().eq('resep_id', r.id);
      if (error) throw error;
    }
    if (!item.length) return { ...r, item: [] };
    /* frekuensi & dosis = signa1 & signa2 milik PCare, kode_pcare &
       obat_dpho menentukan obat dikirim berkode atau bernama. Empat
       kolom ini disalin ke baris resep, bukan dibaca dari master saat
       pengiriman: master obat bisa berubah bertahun-tahun kemudian,
       sedangkan yang diklaim adalah obat yang diserahkan hari itu. */
    const rows = item.map((o, i) => ({
      resep_id: r.id, obat_id: o.obat_id || null, nama_obat: o.nama_obat,
      kode_kfa: o.kode_kfa || null, kode_pcare: o.kode_pcare || null,
      obat_dpho: !!o.obat_dpho,
      jumlah: o.jumlah, satuan: o.satuan,
      signa: o.signa, frekuensi: o.frekuensi || null, dosis: o.dosis || null,
      rute: o.rute || 'Oral', keterangan: o.keterangan || null, urutan: i
    }));
    const { data, error } = await sb.from('resep_item').insert(rows).select();
    if (error) throw error;
    return { ...r, item: data };
  }

  /* --------------------------- Rekam medis lengkap ---------------------- */
  async function rekamMedisLengkap(kunjunganId) {
    const [k, ka, pm, dg, rs, ad, pg, td] = await Promise.all([
      kunjungan(kunjunganId), kajian(kunjunganId), pemeriksaan(kunjunganId),
      diagnosa(kunjunganId), resep(kunjunganId), daftarAddendum(kunjunganId),
      pemeriksaanGigi(kunjunganId), tindakan(kunjunganId)
    ]);
    return { kunjungan: k, kajian: ka, pemeriksaan: pm, diagnosa: dg, resep: rs,
             addendum: ad, gigi: pg, tindakan: td };
  }

  /* --------------------------- Statistik -------------------------------- */
  async function statistikHariIni() {
    const hari = UI.hariIni();
    const [total, selesai, pasienTotal] = await Promise.all([
      sb.from('kunjungan').select('id', { count: 'exact', head: true }).eq('tanggal', hari),
      sb.from('kunjungan').select('id', { count: 'exact', head: true }).eq('tanggal', hari).eq('status', 'SELESAI'),
      sb.from('pasien').select('id', { count: 'exact', head: true }).eq('aktif', true)
    ]);
    return {
      kunjungan_hari_ini: total.count || 0,
      selesai_hari_ini: selesai.count || 0,
      dalam_antrian: (total.count || 0) - (selesai.count || 0),
      total_pasien: pasienTotal.count || 0
    };
  }
  async function diagnosaTeratas(dari, sampai, batas = 10) {
    const { data, error } = await sb.from('diagnosa')
      .select('kode_icd10, nama, kunjungan!inner(tanggal, status)')
      .gte('kunjungan.tanggal', dari).lte('kunjungan.tanggal', sampai)
      .eq('kunjungan.status', 'SELESAI');
    if (error) throw error;
    const hitung = {};
    (data || []).forEach(d => {
      const k = d.kode_icd10;
      if (!hitung[k]) hitung[k] = { kode: k, nama: d.nama, jml: 0 };
      hitung[k].jml++;
    });
    return Object.values(hitung).sort((a, b) => b.jml - a.jml).slice(0, batas);
  }


  /* ========================= POLI GIGI ============================== */

  let _refGigi = null, _refKondisi = null, _refBidang = null;

  async function refGigi() {
    if (_refGigi) return _refGigi;
    const { data, error } = await sb.from('ref_gigi').select('*').order('kuadran').order('posisi');
    if (error) throw error;
    _refGigi = data; return data;
  }
  async function refKondisiGigi() {
    if (_refKondisi) return _refKondisi;
    const { data, error } = await sb.from('ref_kondisi_gigi').select('*')
      .eq('aktif', true).order('urutan');
    if (error) throw error;
    _refKondisi = data; return data;
  }
  async function refBidangGigi() {
    if (_refBidang) return _refBidang;
    const { data, error } = await sb.from('ref_bidang_gigi').select('*').order('urutan');
    if (error) throw error;
    _refBidang = data; return data;
  }

  /* Keadaan gigi pasien saat ini, dalam bentuk { "36": {kondisi, bidang, catatan} } */
  async function odontogram(pasienId) {
    const { data, error } = await sb.from('odontogram')
      .select('fdi,kondisi,bidang,catatan').eq('pasien_id', pasienId);
    if (error) throw error;
    const hasil = {};
    (data || []).forEach(r => {
      hasil[r.fdi] = { kondisi: r.kondisi, bidang: r.bidang || {}, catatan: r.catatan };
    });
    return hasil;
  }

  /* Odontogram sebagaimana keadaannya pada satu kunjungan di masa lalu.
     Dihitung dengan membatalkan semua perubahan yang terjadi setelah kunjungan itu,
     sehingga rekam medis lama tetap menggambarkan apa yang dilihat dokter saat itu. */
  async function odontogramPadaKunjungan(pasienId, kunjunganId, batasWaktu) {
    const sekarang = await odontogram(pasienId);
    if (!batasWaktu) return sekarang;

    const { data, error } = await sb.from('odontogram_riwayat')
      .select('fdi,kondisi_lama,bidang_lama,kondisi_baru,bidang_baru,waktu')
      .eq('pasien_id', pasienId)
      .gt('waktu', batasWaktu)
      .order('waktu', { ascending: false });
    if (error) throw error;

    const hasil = JSON.parse(JSON.stringify(sekarang));
    (data || []).forEach(r => {
      const adaSebelumnya = r.kondisi_lama !== null || (r.bidang_lama && Object.keys(r.bidang_lama).length);
      if (adaSebelumnya) {
        hasil[r.fdi] = { kondisi: r.kondisi_lama, bidang: r.bidang_lama || {},
                         catatan: hasil[r.fdi] ? hasil[r.fdi].catatan : null };
      } else {
        delete hasil[r.fdi];
      }
    });
    return hasil;
  }

  /* Menyimpan odontogram: hanya gigi yang berubah yang disentuh, supaya
     riwayat perubahan tidak dipenuhi baris palsu. */
  async function simpanOdontogram(pasienId, kunjunganId, baru) {
    const lama = await odontogram(pasienId);
    const sama = (a, b) =>
      (a?.kondisi ?? null) === (b?.kondisi ?? null) &&
      JSON.stringify(a?.bidang ?? {}) === JSON.stringify(b?.bidang ?? {}) &&
      (a?.catatan ?? null) === (b?.catatan ?? null);

    const untukSimpan = [];
    Object.entries(baru).forEach(([fdi, d]) => {
      if (!sama(lama[fdi], d)) {
        untukSimpan.push({
          pasien_id: pasienId, fdi,
          kondisi: d.kondisi || null,
          bidang: d.bidang || {},
          catatan: d.catatan || null,
          kunjungan_id: kunjunganId,
          diperbarui_pada: new Date().toISOString(),
          diperbarui_oleh: _saya?.id
        });
      }
    });
    const untukHapus = Object.keys(lama).filter(fdi => !baru[fdi]);

    if (untukSimpan.length) {
      const { error } = await sb.from('odontogram')
        .upsert(untukSimpan, { onConflict: 'pasien_id,fdi' });
      if (error) throw error;
    }
    if (untukHapus.length) {
      const { error } = await sb.from('odontogram')
        .delete().eq('pasien_id', pasienId).in('fdi', untukHapus);
      if (error) throw error;
    }
    return { diperbarui: untukSimpan.length, dihapus: untukHapus.length };
  }

  async function riwayatOdontogram(pasienId, batas = 60) {
    const { data, error } = await sb.from('odontogram_riwayat')
      .select('*, kunjungan:kunjungan_id(no_kunjungan,tanggal)')
      .eq('pasien_id', pasienId).order('waktu', { ascending: false }).limit(batas);
    if (error) throw error; return data;
  }

  /* Pemeriksaan gigi (ekstra oral, intra oral, indeks) */
  async function pemeriksaanGigi(kunjunganId) {
    const { data, error } = await sb.from('pemeriksaan_gigi').select('*')
      .eq('kunjungan_id', kunjunganId).maybeSingle();
    if (error) throw error; return data;
  }
  async function simpanPemeriksaanGigi(kunjunganId, rec) {
    const { data, error } = await sb.from('pemeriksaan_gigi')
      .upsert({ ...rec, kunjungan_id: kunjunganId, dibuat_oleh: _saya?.id },
              { onConflict: 'kunjungan_id' }).select().single();
    if (error) throw error; return data;
  }

  /* Tindakan (ICD-9-CM) */
  async function cariIcd9(kata, kategori = null, batas = 25) {
    let q = sb.from('icd9cm').select('kode,nama_id,nama_en,kategori,per_gigi,kode_pcare')
      .eq('aktif', true).limit(batas);
    if (kata && kata.length >= 2) {
      const k = `%${kata}%`;
      q = q.or(`kode.ilike.${k},nama_id.ilike.${k},nama_en.ilike.${k}`);
    } else {
      q = q.eq('sering_dipakai', true);
    }
    if (kategori) q = q.in('kategori', Array.isArray(kategori) ? kategori : [kategori]);
    const { data, error } = await q.order('sering_dipakai', { ascending: false }).order('kode');
    if (error) throw error; return data;
  }
  async function tindakan(kunjunganId) {
    const { data, error } = await sb.from('tindakan')
      .select('*, ref:kode_icd9(per_gigi,kategori)')
      .eq('kunjungan_id', kunjunganId).order('urutan');
    if (error) throw error; return data;
  }
  async function simpanTindakan(kunjunganId, daftar) {
    const { error: e1 } = await sb.from('tindakan').delete().eq('kunjungan_id', kunjunganId);
    if (e1) throw e1;
    if (!daftar.length) return [];
    const rows = daftar.map((t, i) => ({
      kunjungan_id: kunjunganId, kode_icd9: t.kode, nama: t.nama,
      kode_pcare: t.kode_pcare || null,
      fdi: t.fdi || null, jumlah: t.jumlah || 1, catatan: t.catatan || null,
      dilakukan_oleh: _saya?.id, urutan: i
    }));
    const { data, error } = await sb.from('tindakan').insert(rows).select();
    if (error) throw error; return data;
  }

  async function tindakanTeratas(dari, sampai, batas = 12) {
    const { data, error } = await sb.from('tindakan')
      .select('kode_icd9, nama, kunjungan!inner(tanggal)')
      .gte('kunjungan.tanggal', dari).lte('kunjungan.tanggal', sampai);
    if (error) throw error;
    const hitung = {};
    (data || []).forEach(t => {
      if (!hitung[t.kode_icd9]) hitung[t.kode_icd9] = { kode: t.kode_icd9, nama: t.nama, jml: 0 };
      hitung[t.kode_icd9].jml++;
    });
    return Object.values(hitung).sort((a, b) => b.jml - a.jml).slice(0, batas);
  }

  /* Pemeriksaan laboratorium terbanyak — untuk Ringkasan Laporan.
     Mengelompokkan lab_hasil berdasarkan jenis pemeriksaan, dihitung
     jumlahnya, dan disortir descending. Filter opsional: status permintaan
     dan kelompok lab (Hematologi, Kimia Klinik, dll.). */
  async function pemeriksaanLabTeratas({ dari, sampai, status, kelompok, batas = 15 } = {}) {
    // 1. Coba fungsi agregasi database langsung (sangat cepat, mengembalikan data teragregasi < 50ms)
    try {
      const { data, error } = await sb.rpc('rpc_top_pemeriksaan_lab', {
        p_dari: dari || '1970-01-01',
        p_sampai: sampai || '2099-12-31',
        p_status: status || 'SELESAI',
        p_kelompok: kelompok || null,
        p_batas: batas || 15
      });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(d => ({
          lab_id: d.lab_id,
          nama: d.nama,
          kelompok: d.kelompok || 'Lainnya',
          jml: Number(d.jml) || 0
        }));
      }
    } catch (eRpc) {}

    // 2. Fallback agregasi client-side jika RPC belum diterapkan
    let q = sb.from('lab_permintaan')
      .select('id, status, tanggal, lab_hasil(lab_id, nama), lab_fisik(item_id, hasil)')
      .limit(5000);
    if (dari) q = q.gte('tanggal', dari);
    if (sampai) q = q.lte('tanggal', sampai);
    if (status && status !== 'SEMUA') {
      if (status === 'AKTIF') q = q.in('status', ['DIMINTA', 'DIKERJAKAN']);
      else q = q.eq('status', status);
    } else {
      q = q.neq('status', 'BATAL');
    }
    const { data, error } = await q;
    if (error) throw error;
    const hitung = {};
    (data || []).forEach(p => {
      (p.lab_hasil || []).forEach(h => {
        const k = h.lab_id;
        if (!hitung[k]) hitung[k] = { lab_id: k, nama: h.nama, jml: 0 };
        hitung[k].jml++;
      });
      // Deteksi pemeriksaan fisik per lembar/pasien
      const hasFisik = Array.isArray(p.lab_fisik) && p.lab_fisik.some(f => f.hasil && f.hasil !== '' && f.hasil !== '-');
      if (hasFisik) {
        const kFisik = 'fisik';
        if (!hitung[kFisik]) hitung[kFisik] = { lab_id: null, nama: 'Pemeriksaan Fisik', kelompok: 'Pemeriksaan Fisik', jml: 0 };
        hitung[kFisik].jml++;
      }
    });
    let hasil = Object.values(hitung).sort((a, b) => b.jml - a.jml);
    try {
      const ref = await refLab(true);
      const peta = {};
      ref.forEach(r => { peta[r.id] = r.kelompok; });
      hasil.forEach(h => {
        if (h.nama === 'Pemeriksaan Fisik') h.kelompok = 'Pemeriksaan Fisik';
        else h.kelompok = peta[h.lab_id] || 'Lainnya';
      });
      if (kelompok && kelompok !== 'SEMUA') hasil = hasil.filter(h => h.kelompok === kelompok);
    } catch (e) { /* abaikan jika refLab gagal */ }
    return (batas && batas > 0) ? hasil.slice(0, batas) : hasil;
  }

  /* Agregasi porsi kelompok / kategori pemeriksaan lab untuk Donut Chart */
  async function distribusiKategoriLab({ dari, sampai } = {}) {
    try {
      const { data, error } = await sb.rpc('rpc_distribusi_kategori_lab', {
        p_dari: dari || '1970-01-01',
        p_sampai: sampai || '2099-12-31'
      });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(d => ({ kelompok: d.kelompok, jml: Number(d.jml) || 0 }));
      }
    } catch (e) {}

    // Fallback: hitung dari pemeriksaanLabTeratas tanpa batas
    try {
      const periksa = await pemeriksaanLabTeratas({ dari, sampai, batas: 0 });
      const peta = {};
      periksa.forEach(p => {
        const k = p.kelompok || 'Lainnya';
        peta[k] = (peta[k] || 0) + (p.jml || 0);
      });
      return Object.entries(peta)
        .map(([kelompok, jml]) => ({ kelompok, jml }))
        .sort((a, b) => b.jml - a.jml);
    } catch (err) {
      return [];
    }
  }

  async function daftarKelompokLab() {
    try {
      const ref = await refLab(true);
      const set = new Set();
      ref.forEach(r => { if (r.kelompok) set.add(r.kelompok); });
      set.add('Pemeriksaan Fisik');
      return Array.from(set).sort();
    } catch (e) { return ['Pemeriksaan Fisik']; }
  }


  /* ===================== MASTER DATA (pengelolaan admin) ============== */

  let _refKesadaran = null, _refStatusPulang = null;

  async function refKesadaran() {
    if (_refKesadaran) return _refKesadaran;
    const { data, error } = await sb.from('ref_kesadaran').select('*')
      .eq('aktif', true).order('urutan');
    if (error) throw error;
    _refKesadaran = data; return data;
  }
  async function refStatusPulang() {
    if (_refStatusPulang) return _refStatusPulang;
    const { data, error } = await sb.from('ref_status_pulang').select('*')
      .eq('aktif', true).order('urutan');
    if (error) throw error;
    _refStatusPulang = data; return data;
  }

  /* --------------------- Rujukan pemeriksaan terstruktur ---------------
     Semua di-cache karena isinya puluhan baris yang tidak berubah selama
     sesi, sementara halaman pemeriksaan memuat tujuh tabel sekaligus.

     PERHATIKAN kolom yang diminta. `ref_sistem_fisik.normal_teks` dan
     `temuan_lazim` bukan hiasan: kalimat normal itulah yang masuk rekam
     medis dan yang dikirim ke SatuSehat. Kalau lupa diminta di sini,
     tombol "dalam batas normal" tetap bisa ditekan dan rekam medisnya
     keluar kosong tanpa satu pun galat — kelas kesalahan yang sama
     dengan hilangnya poli.jenis dulu. Dijaga test/uji_kolom_db.js. */
  const _ref = {};
  function refCache(nama, tabel, kolom, urut = 'urutan') {
    return async () => {
      if (_ref[nama]) return _ref[nama];
      const { data, error } = await sb.from(tabel).select(kolom)
        .eq('aktif', true).order(urut);
      if (error) throw error;
      _ref[nama] = data; return data;
    };
  }

  const refPrognosa     = refCache('prognosa', 'ref_prognosa',
                            'kode,nama,keterangan,kode_pcare,urutan');
  const refTacc         = refCache('tacc', 'ref_tacc',
                            'kode,nama,keterangan,kode_pcare,perlu_alasan,urutan');
  const refSubspesialis = refCache('subspesialis', 'ref_subspesialis',
                            'kode,nama,kode_pcare,urutan');
  const refSarana       = refCache('sarana', 'ref_sarana',
                            'kode,nama,kode_pcare,urutan');
  const refAlergi       = refCache('alergi', 'ref_alergi',
                            'id,jenis,kode,nama,kode_pcare,urutan');
  const refPpk          = refCache('ppk', 'ref_ppk',
                            'kode,nama,jenis,alamat,telepon,sumber,urutan', 'nama');

  async function refSistemFisik(poliJenis = null) {
    const kunci = 'sistem_' + (poliJenis || 'semua');
    if (_ref[kunci]) return _ref[kunci];
    const { data, error } = await sb.from('ref_sistem_fisik')
      .select('kode,nama,normal_teks,temuan_lazim,kode_loinc,kode_snomed,'
            + 'poli_jenis,bawaan_periksa,urutan')
      .eq('aktif', true).order('urutan');
    if (error) throw error;
    /* Sistem tanpa poli_jenis berlaku di semua poli; yang bertanda hanya
       muncul di poli itu. Disaring di sini, bukan di SQL, supaya satu
       permintaan cukup untuk poli mana pun. */
    const hasil = (data || []).filter(s => !s.poli_jenis || s.poli_jenis === poliJenis);
    _ref[kunci] = hasil; return hasil;
  }

  /* ref_vital tidak punya kolom `aktif`; refCache tidak bisa dipakai. */
  async function refVitalSemua() {
    if (_ref.vital_semua) return _ref.vital_semua;
    const { data, error } = await sb.from('ref_vital')
      .select('kode,nama,satuan,satuan_ucum,kode_loinc,urutan').order('urutan');
    if (error) throw error;
    _ref.vital_semua = data; return data;
  }

  /* Alergi berkode pasien: satu baris per jenis (MAKANAN, UDARA, OBAT),
     karena PCare hanya menerima satu kode per jenis. */
  async function alergiKode(pasienId) {
    const { data, error } = await sb.from('pasien_alergi')
      .select('id,jenis,nama,reaksi,tingkat,ref_alergi_id,dicatat_pada')
      .eq('pasien_id', pasienId).not('ref_alergi_id', 'is', null)
      .order('dicatat_pada', { ascending: false });
    if (error) throw error;
    const per = {};
    (data || []).forEach(a => { if (!per[a.jenis]) per[a.jenis] = a; });
    return per;
  }

  /* Mengganti alergi berkode satu jenis. Baris alergi lama yang diketik
     bebas TIDAK dihapus — itu catatan medis, bukan sampah. */
  async function setAlergiKode(pasienId, jenis, refAlergiId, nama, catatan) {
    const { error: e1 } = await sb.from('pasien_alergi').delete()
      .eq('pasien_id', pasienId).eq('jenis', jenis).not('ref_alergi_id', 'is', null);
    if (e1) throw e1;
    if (!refAlergiId) return null;
    const { data, error } = await sb.from('pasien_alergi').insert({
      pasien_id: pasienId, jenis, nama: nama || jenis,
      reaksi: catatan || null, ref_alergi_id: refAlergiId,
      dicatat_oleh: _saya?.id
    }).select().single();
    if (error) throw error; return data;
  }

  /* Pratinjau payload PCare langsung dari database — inilah yang benar-
     benar akan dikirim nanti, bukan susunan ulang di peramban. */
  async function pcarePratinjau(kunjunganId) {
    const [k, o, t] = await Promise.all([
      sb.from('v_pcare_kunjungan').select('*').eq('kunjungan_id', kunjunganId).maybeSingle(),
      sb.from('v_pcare_obat').select('*').eq('kunjungan_id', kunjunganId),
      sb.from('v_pcare_tindakan').select('*').eq('kunjungan_id', kunjunganId)
    ]);
    if (k.error) throw k.error;
    return { kunjungan: k.data, obat: o.data || [], tindakan: t.data || [] };
  }

  async function observasiSatuSehat(kunjunganId) {
    const { data, error } = await sb.from('v_satusehat_observasi').select('*')
      .eq('kunjungan_id', kunjunganId).order('kelompok').order('urutan');
    if (error) throw error; return data;
  }

  async function kesiapanKode() {
    const { data, error } = await sb.from('v_kesiapan_kode').select('*');
    if (error) throw error; return data;
  }

  async function simpanPpk(rec) {
    const { data, error } = await sb.from('ref_ppk')
      .upsert({ ...rec, updated_at: new Date().toISOString() }, { onConflict: 'kode' })
      .select().single();
    if (error) throw error;
    delete _ref.ppk;                      // daftar berubah, cache tidak boleh basi
    return data;
  }

  /* Mengisi kolom kode_pcare (atau kode_loinc untuk sistem pemeriksaan
     fisik) pada tabel rujukan. Nama tabel TIDAK diambil mentah dari
     pemanggil: daftar putih di bawah yang menentukan, supaya satu nilai
     yang salah dari layar tidak bisa menulis ke tabel mana pun. */
  const TABEL_KODE = {
    ref_kesadaran: 'kode_pcare', ref_status_pulang: 'kode_pcare',
    ref_prognosa: 'kode_pcare', ref_subspesialis: 'kode_pcare',
    ref_sarana: 'kode_pcare', ref_alergi: 'kode_pcare',
    ref_sistem_fisik: 'kode_loinc'
  };

  async function simpanPemetaanKode(daftar) {
    for (const it of daftar) {
      const kolom = TABEL_KODE[it.tabel];
      if (!kolom) throw new Error(`Tabel "${it.tabel}" tidak boleh diubah dari sini.`);
      const { error } = await sb.from(it.tabel)
        .update({ [kolom]: it.nilai }).eq('kode', it.kode);
      if (error) throw error;
    }
    /* Seluruh cache rujukan dibuang: yang dipakai halaman pemeriksaan
       adalah salinan lama yang kodenya masih kosong. */
    Object.keys(_ref).forEach(k => delete _ref[k]);
    _refKesadaran = null; _refStatusPulang = null;
    return daftar.length;
  }

  /* --- Obat --- */
  async function daftarObat(kata = '', ikutNonaktif = false, batas = 300) {
    let q = sb.from('obat').select('*').order('nama').limit(batas);
    if (!ikutNonaktif) q = q.eq('aktif', true);
    if (kata && kata.trim().length >= 2) {
      const k = kata.trim();
      q = q.or(`nama.ilike.%${k}%,nama_generik.ilike.%${k}%,kode_internal.ilike.%${k}%,kode_kfa.ilike.%${k}%`);
    }
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function simpanObat(rec, id = null) {
    const q = id ? sb.from('obat').update(rec).eq('id', id).select().single()
                 : sb.from('obat').insert(rec).select().single();
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  /* Impor massal. Baris dicocokkan dengan kode_internal supaya bisa dijalankan
     berulang tanpa menggandakan data. */
  async function imporObat(baris) {
    if (!baris.length) return { jumlah: 0 };
    const { data, error } = await sb.from('obat')
      .upsert(baris, { onConflict: 'kode_internal' }).select('id');
    if (error) throw error;
    return { jumlah: data.length };
  }
  /* Hapus permanen. Obat yang sudah pernah dipakai di resep atau punya
     riwayat stok apotek DITOLAK oleh constraint foreign key di database —
     bukan dihapus paksa. Untuk obat semacam itu, nonaktifkan saja. */
  async function hapusObat(id) {
    const { error } = await sb.from('obat').delete().eq('id', id);
    if (error) throw error;
  }

  /* --- ICD-10 --- */
  async function daftarIcd10(kata = '', hanyaFavorit = false, batas = 200) {
    let q = sb.from('icd10').select('*').order('kode').limit(batas);
    if (hanyaFavorit) q = q.eq('sering_dipakai', true);
    if (kata && kata.trim().length >= 2) {
      q = q.ilike('cari_teks', `%${kata.trim()}%`);
    }
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function simpanIcd10(rec, kode = null) {
    const q = kode ? sb.from('icd10').update(rec).eq('kode', kode).select().single()
                   : sb.from('icd10').insert(rec).select().single();
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }
  /* Hapus permanen. Ditolak database bila kode ini masih dipakai sebagai
     diagnosa pada suatu kunjungan. */
  async function hapusIcd10(kode) {
    const { error } = await sb.from('icd10').delete().eq('kode', kode);
    if (error) throw error;
  }
  /* Impor massal. Baris dicocokkan dengan `kode` — di tabel icd10, kode ITU
     SENDIRI adalah primary key (beda dari Obat yang punya kode_internal
     terpisah) — jadi impor yang sama bisa dijalankan berulang untuk
     memperbarui data atau menambah revisi baru tanpa menggandakannya.

     Dikirim per kelompok, bukan sekali kirim semuanya: berkas berisi
     ribuan baris (mis. impor awal ICD-10 lengkap) membuat satu perintah
     upsert tunggal kena "statement timeout" di Supabase. Kalau satu
     kelompok gagal, kelompok-kelompok sebelumnya SUDAH tersimpan —
     mengulang impor dari berkas yang sama aman, baris yang sudah masuk
     tidak akan dobel. onProgress, kalau diisi, dipanggil setelah tiap
     kelompok selesai supaya layar bisa menunjukkan kemajuannya. */
  async function imporIcd10(baris, onProgress = null) {
    if (!baris.length) return { jumlah: 0 };
    const UKURAN_KELOMPOK = 500;
    let jumlah = 0;
    for (let i = 0; i < baris.length; i += UKURAN_KELOMPOK) {
      const kelompok = baris.slice(i, i + UKURAN_KELOMPOK);
      const { data, error } = await sb.from('icd10')
        .upsert(kelompok, { onConflict: 'kode' }).select('kode');
      if (error) {
        error.message = `Berhenti setelah ${jumlah} dari ${baris.length} baris `
          + `(gagal pada kelompok baris ${i + 1}\u2013${Math.min(i + UKURAN_KELOMPOK, baris.length)}): `
          + error.message;
        throw error;
      }
      jumlah += data.length;
      if (onProgress) onProgress(jumlah, baris.length);
    }
    return { jumlah };
  }

  /* --- ICD-9-CM --- */
  async function daftarIcd9(kata = '', kategori = null, batas = 200) {
    let q = sb.from('icd9cm').select('*').order('kode').limit(batas);
    if (kategori) q = q.eq('kategori', kategori);
    if (kata && kata.trim().length >= 2) {
      const k = kata.trim();
      q = q.or(`kode.ilike.%${k}%,nama_id.ilike.%${k}%,nama_en.ilike.%${k}%`);
    }
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function simpanIcd9(rec, kode = null) {
    const q = kode ? sb.from('icd9cm').update(rec).eq('kode', kode).select().single()
                   : sb.from('icd9cm').insert(rec).select().single();
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  /* Hapus permanen. Ditolak database bila kode ini masih dipakai sebagai
     tindakan pada suatu kunjungan atau tarif kasir. */
  async function hapusIcd9(kode) {
    const { error } = await sb.from('icd9cm').delete().eq('kode', kode);
    if (error) throw error;
  }

  /* ===================== KESIAPAN DATA BRIDGING ====================== */

  /* Pasien yang datanya belum lengkap untuk bridging. Dipanggil juga oleh
     halaman pasien untuk menandai satu pasien saja. */
  async function kesiapanPasien({ hanyaKurang = true, pasienId = null, batas = 500 } = {}) {
    let q = sb.from('v_kesiapan_pasien').select('*').limit(batas);
    if (pasienId) q = q.eq('id', pasienId);
    const { data, error } = await q;
    if (error) throw error;
    const hasil = (data || []).map(r => ({ ...r, kekurangan: r.kekurangan || [] }));
    return hanyaKurang ? hasil.filter(r => r.kekurangan.length) : hasil;
  }

  async function kesiapanKunjungan({ hanyaKurang = true, batas = 500 } = {}) {
    const { data, error } = await sb.from('v_kesiapan_kunjungan').select('*')
      .order('tanggal', { ascending: false }).limit(batas);
    if (error) throw error;
    const hasil = (data || []).map(r => ({ ...r, kekurangan: r.kekurangan || [] }));
    return hanyaKurang ? hasil.filter(r => r.kekurangan.length) : hasil;
  }

  /* Ringkasan untuk halaman Pengaturan → Bridging */
  async function ringkasanKesiapan() {
    const [pasien, kunjungan] = await Promise.all([
      kesiapanPasien({ hanyaKurang: false, batas: 2000 }),
      kesiapanKunjungan({ hanyaKurang: false, batas: 2000 })
    ]);
    return {
      pasien_total: pasien.length,
      pasien_kurang: pasien.filter(p => p.kekurangan.length).length,
      kunjungan_total: kunjungan.length,
      kunjungan_kurang: kunjungan.filter(k => k.kekurangan.length).length
    };
  }

  /* ========================= APOTEK ================================== */

  /* PostgREST memulangkan paling banyak 1.000 baris per permintaan dan
     TIDAK memberi tanda apa pun kalau sisanya dipotong: yang kembali cuma
     array pendek yang kelihatan wajar. Selama riwayat apotek masih di
     bawah seribu baris tidak ada yang terasa, lalu suatu hari laporan
     bulan-bulan lama menyusut diam-diam.

     Urutan diberi pemutus seri (id) supaya batas antar-halaman tidak
     menggeser baris: satu penyerahan yang terpecah FEFO ke beberapa batch
     ditulis dalam satu perintah, jadi tanggal DAN created_at-nya kembar,
     dan untuk baris kembar Postgres tidak menjamin urutan yang sama antar
     permintaan. Tanpa pemutus seri, satu baris bisa terbawa dua kali atau
     terlewat sama sekali tepat di batas halaman. */
  const UKURAN_HALAMAN = 1000;

  async function ambilSemua(buatQuery) {
    let semua = [];
    for (let mulai = 0; ; mulai += UKURAN_HALAMAN) {
      const { data, error } = await buatQuery().range(mulai, mulai + UKURAN_HALAMAN - 1);
      if (error) throw error;
      semua = semua.concat(data || []);
      if (!data || data.length < UKURAN_HALAMAN) return semua;
    }
  }

  async function apotekBatch({ hanyaAda = false } = {}) {
    return await ambilSemua(() => {
      let q = sb.from('v_apotek_batch').select('*')
        .order('nama_obat').order('tgl_expired').order('id');
      if (hanyaAda) q = q.gt('stok_sisa', 0);
      return q;
    });
  }

  async function apotekStok({ hanyaAda = false } = {}) {
    let q = sb.from('v_apotek_stok').select('*').order('nama_obat');
    if (hanyaAda) q = q.gt('stok_total', 0);
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  /* Riwayat transaksi. `dari` membatasi seberapa jauh ke belakang; tanpa
     itu seluruh riwayat klinik ikut terunduh setiap kali halaman dibuka. */
  async function apotekTransaksi({ dari = null, sampai = null, obatId = null,
                                   kunjunganId = null } = {}) {
    return await ambilSemua(() => {
      let q = sb.from('apotek_transaksi').select('*')
        .order('tanggal', { ascending: false })
        .order('id', { ascending: false });
      if (dari)        q = q.gte('tanggal', dari);
      if (sampai)      q = q.lte('tanggal', sampai);
      if (obatId)      q = q.eq('obat_id', obatId);
      if (kunjunganId) q = q.eq('kunjungan_id', kunjunganId);
      return q;
    });
  }

  async function apotekMasuk(r) {
    const { data, error } = await sb.rpc('apotek_masuk', {
      p_obat_id: r.obat_id, p_jumlah: r.jumlah, p_harga_beli: r.harga_beli,
      p_tgl_expired: r.tgl_expired, p_pbf: r.pbf,
      p_no_faktur: r.no_faktur || null, p_tgl_masuk: r.tgl_masuk || null,
      p_no_batch: r.no_batch || null, p_keterangan: r.keterangan || null,
      p_kolam: r.kolam || 'reguler'
    });
    if (error) throw error; return data;
  }

  /* `kolam` di sini adalah PREFERENSI, bukan syarat — lihat catatan di
     17_apotek_kolam.sql. Kosongkan untuk FEFO polos seperti sebelum kolam
     ada; database tetap boleh menyeberang kolam kalau yang disukai habis. */
  async function apotekKeluar(r) {
    const { data, error } = await sb.rpc('apotek_keluar', {
      p_obat_id: r.obat_id, p_jumlah: r.jumlah,
      p_kategori: r.kategori || 'Penjualan Bebas',
      p_tanggal: r.tanggal || null,
      p_kunjungan_id: r.kunjungan_id || null,
      p_resep_item_id: r.resep_item_id || null,
      p_batch_id: r.batch_id || null,
      p_keterangan: r.keterangan || null,
      p_kolam_disukai: r.kolam || null
    });
    if (error) throw error; return data;
  }

  async function apotekBatalkanGrup(grupId, alasan = null) {
    const { data, error } = await sb.rpc('apotek_batalkan_grup',
      { p_grup_id: grupId, p_alasan: alasan });
    if (error) throw error; return data;
  }

  async function apotekSerahkanResep(resepId, item, tanggal = null, catatan = null) {
    const { data, error } = await sb.rpc('apotek_serahkan_resep', {
      p_resep_id: resepId, p_item: item,
      p_tanggal: tanggal || null, p_catatan: catatan || null
    });
    if (error) throw error; return data;
  }

  /* Batch diubah langsung, bukan lewat RPC: perubahan identitas batch
     (faktur salah ketik, PBF tertukar) tidak menyentuh stok sama sekali.
     Yang menyentuh stok hanya fungsi di 08_apotek.sql. */
  async function simpanBatch(id, patch) {
    const { data, error } = await sb.from('apotek_batch')
      .update(patch).eq('id', id).select().single();
    if (error) throw error; return data;
  }

  /* Seluruh master obat untuk mencocokkan berkas impor — termasuk yang
     nonaktif, supaya obat yang pernah dinonaktifkan tidak lahir kembali
     sebagai duplikat lewat impor. Diambil bertahap karena PostgREST
     memotong di 1.000 baris tanpa memberi tanda apa pun. */
  async function obatUntukPencocokan() {
    return await ambilSemua(() =>
      sb.from('v_obat_pencocokan').select('*').order('nama').order('id'));
  }

  /* Seluruh berkas diproses dalam satu transaksi di database. Impor 80
     baris yang gagal di baris ke-63 tidak menyisakan 62 batch — apoteker
     tidak punya cara tahu di mana ia berhenti, dan mengulang dari awal
     akan menggandakan stok. */
  async function apotekImpor(baris, jenis) {
    const { data, error } = await sb.rpc('apotek_impor',
      { p_baris: baris, p_jenis: jenis || 'Pembelian' });
    if (error) throw error;
    return data;
  }

  async function antreanFarmasi({ tanggal = null, semua = false } = {}) {
    let q = sb.from('v_antrean_farmasi').select('*')
      .order('tanggal', { ascending: false }).order('no_antrian');
    if (tanggal) q = q.eq('tanggal', tanggal);
    if (!semua)  q = q.neq('status', 'DISERAHKAN');
    const { data, error } = await q.limit(300);
    if (error) throw error; return data;
  }

  /* Resep lengkap untuk layar penyerahan: butir + stok tiap obatnya, agar
     apoteker melihat "resep 30, stok 12" sebelum menekan apa pun. */
  async function resepUntukFarmasi(resepId) {
    const { data, error } = await sb.from('resep')
      .select(`*, item:resep_item(*),
               kunjungan:kunjungan_id(id,no_kunjungan,tanggal,cara_bayar,no_antrian,
                                      pasien:pasien_id(id,no_rm,nama,alamat,tanggal_lahir,jenis_kelamin),
                                      poli:poli_id(nama),
                                      dokter:dokter_id(nama,no_sip)),
               penulis:dibuat_oleh(nama),
               penyerahan:resep_penyerahan(*, item:resep_penyerahan_item(*),
                                           apoteker:apoteker_id(nama,no_sip))`)
      .eq('id', resepId).single();
    if (error) throw error;
    if (data.item) data.item.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    if (data.penyerahan) data.penyerahan.sort((a, b) => (a.ke_berapa || 0) - (b.ke_berapa || 0));

    const ids = [...new Set((data.item || []).map(i => i.obat_id).filter(Boolean))];
    if (ids.length) {
      const { data: stok, error: e2 } = await sb.from('v_apotek_stok')
        .select('obat_id,stok_total,stok_layak,expired_terdekat,harga_jual')
        .in('obat_id', ids);
      if (e2) throw e2;
      const peta = Object.fromEntries((stok || []).map(s => [s.obat_id, s]));
      data.item.forEach(i => { i.stok = peta[i.obat_id] || null; });
    }
    return data;
  }

  /* Batch yang layak untuk satu obat, sudah urut FEFO. Dipakai layar
     "pilih batch tertentu" dan pratinjau pemotongan. */
  async function batchObat(obatId) {
    const { data, error } = await sb.from('v_apotek_batch').select('*')
      .eq('obat_id', obatId).gt('stok_sisa', 0)
      .order('tgl_expired').order('tgl_masuk').order('id');
    if (error) throw error; return data;
  }


  /* ========================= KASIR ================================== */

  async function kasirMenunggu({ tanggal = null } = {}) {
    let q = sb.from('v_kasir_menunggu').select('*')
      .order('tanggal', { ascending: false }).order('no_antrian');
    if (tanggal) q = q.eq('tanggal', tanggal);
    const { data, error } = await q.limit(300);
    if (error) throw error; return data;
  }

  async function kasirDaftarTagihan({ dari = null, sampai = null, status = null,
                                      pasienId = null, batas = 300 } = {}) {
    let q = sb.from('v_kasir_tagihan').select('*')
      .order('tanggal', { ascending: false }).order('created_at', { ascending: false })
      .limit(batas);
    if (dari)     q = q.gte('tanggal', dari);
    if (sampai)   q = q.lte('tanggal', sampai);
    if (status)   q = q.eq('status_bayar', status);
    if (pasienId) q = q.eq('pasien_id', pasienId);
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  async function kasirTagihan(id) {
    const { data, error } = await sb.from('v_kasir_tagihan').select('*').eq('id', id).single();
    if (error) throw error; return data;
  }

  async function kasirItem(tagihanId) {
    const { data, error } = await sb.from('kasir_tagihan_item').select('*')
      .eq('tagihan_id', tagihanId).order('urutan').order('created_at');
    if (error) throw error; return data;
  }

  async function kasirPembayaran(tagihanId) {
    const { data, error } = await sb.from('kasir_pembayaran')
      .select('*, petugas:dibuat_oleh(nama)')
      .eq('tagihan_id', tagihanId).order('created_at');
    if (error) throw error; return data;
  }

  /* Semua yang dibutuhkan satu layar tagihan, dalam satu putaran. */
  async function kasirLengkap(tagihanId) {
    const [tagihan, item, bayar] = await Promise.all([
      kasirTagihan(tagihanId), kasirItem(tagihanId), kasirPembayaran(tagihanId)
    ]);
    return { tagihan, item, bayar };
  }

  async function kasirSusunDariKunjungan(kunjunganId) {
    const { data, error } = await sb.rpc('kasir_susun_dari_kunjungan',
      { p_kunjungan_id: kunjunganId });
    if (error) throw error; return data;   // uuid tagihan
  }

  async function kasirTagihanKunjungan(kunjunganId) {
    const { data, error } = await sb.from('kasir_tagihan').select('*')
      .eq('kunjungan_id', kunjunganId).maybeSingle();
    if (error) throw error; return data;
  }

  async function kasirCatatPembayaran(r) {
    const { data, error } = await sb.rpc('kasir_catat_pembayaran', {
      p_tagihan_id: r.tagihan_id, p_jumlah: r.jumlah,
      p_tanggal: r.tanggal || null, p_metode: r.metode || 'tunai',
      p_catatan: r.catatan || null,
      p_uang_diterima: (r.uang_diterima || null)
    });
    if (error) throw error; return data;
  }

  async function kasirHapusPembayaran(id, alasan = null) {
    const { data, error } = await sb.rpc('kasir_hapus_pembayaran',
      { p_pembayaran_id: id, p_alasan: alasan });
    if (error) throw error; return data;
  }

  async function kasirHapusTagihan(id) {
    const { error } = await sb.rpc('kasir_hapus_tagihan', { p_tagihan_id: id });
    if (error) throw error;
  }

  async function kasirBuatTagihanBebas(rec) {
    const { data, error } = await sb.from('kasir_tagihan')
      .insert({ ...rec, dibuat_oleh: _saya?.id }).select().single();
    if (error) throw error; return data;
  }

  async function kasirTambahItem(rec) {
    const { data, error } = await sb.from('kasir_tagihan_item').insert(rec).select().single();
    if (error) throw error; return data;
  }
  /* Menjual obat langsung dari Kasir: satu panggilan memotong stok FEFO
     (kategori 'Penjualan Bebas') DAN menulis baris tagihan sekaligus,
     lewat RPC supaya keduanya satu transaksi — bukan dua panggilan
     terpisah yang bisa berselisih kalau salah satu gagal di tengah.
     Harga selalu dari obat.harga saat ini (lihat sql/21_...), jadi rec
     di sini TIDAK membawa harga_satuan sama sekali. */
  async function kasirJualObatBebas(rec) {
    const { data, error } = await sb.rpc('kasir_jual_obat_bebas', {
      p_tagihan_id: rec.tagihan_id,
      p_obat_id: rec.obat_id,
      p_qty: rec.qty,
      p_diskon_pct: rec.diskon_pct || 0,
      p_ditanggung_penjamin: !!rec.ditanggung_penjamin,
      p_urutan: rec.urutan ?? 99,
      p_keterangan: rec.keterangan || null
    });
    if (error) throw error; return data;
  }
  async function kasirUbahItem(id, patch) {
    const { data, error } = await sb.from('kasir_tagihan_item')
      .update(patch).eq('id', id).select().single();
    if (error) throw error; return data;
  }
  async function kasirHapusItem(id) {
    const { error } = await sb.from('kasir_tagihan_item').delete().eq('id', id);
    if (error) throw error;
  }

  async function daftarTarif({ jenis = null, kata = '', ikutNonaktif = false } = {}) {
    let q = sb.from('kasir_tarif').select('*')
      .order('jenis').order('nama').limit(500);
    if (jenis) q = q.eq('jenis', jenis);
    if (!ikutNonaktif) q = q.eq('aktif', true);
    if (kata && kata.trim().length >= 2) {
      const k = kata.trim();
      q = q.or(`nama.ilike.%${k}%,kode.ilike.%${k}%,kode_icd9.ilike.%${k}%`);
    }
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  async function updateHargaLab(kode, nama, harga) {
    const { data: tarif, error } = await sb.from('kasir_tarif')
      .select('id').eq('jenis', 'LAB').eq('kode', kode).limit(1);
    if (error) throw error;
    
    if (tarif && tarif.length > 0) {
      return await simpanTarif({ tarif: harga, nama: nama }, tarif[0].id);
    } else {
      return await simpanTarif({
        jenis: 'LAB',
        kode: kode,
        nama: nama,
        tarif: harga,
        aktif: true
      });
    }
  }

  async function updateLabExtras(kode, patch) {
    const { data, error } = await sb.from('ref_lab').update(patch).eq('kode', kode).select().single();
    if (error) throw error;
    return data;
  }

  async function simpanTarif(rec, id = null) {
    const q = id ? sb.from('kasir_tarif').update(rec).eq('id', id).select().single()
                 : sb.from('kasir_tarif').insert(rec).select().single();
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  /* Rekap uang masuk untuk tutup kas. Baris pembayaran, bukan tagihan:
     yang dihitung saat menutup laci adalah uang yang benar-benar
     diterima hari itu, bukan tagihan yang terbit hari itu. */
  async function kasirRekap({ dari, sampai }) {
    const { data, error } = await sb.from('kasir_pembayaran')
      .select('tanggal,metode,jumlah,uang_diterima,tagihan_id')
      .gte('tanggal', dari).lte('tanggal', sampai)
      .order('tanggal', { ascending: false });
    if (error) throw error; return data;
  }

  async function templateInvoice() {
    return await TemplateInvoice.muat(sb);
  }
  async function simpanTemplateInvoice(konfigurasi) {
    return await TemplateInvoice.simpan(sb, konfigurasi);
  }


  /* ------------------ Penunjang: lab, bacaan, arsip ---------------------- */
  /* Tidak ada satu pun fungsi unggah berkas di bagian ini, dan itu memang
     disengaja — lihat kepala sql/11_penunjang.sql. Yang disimpan adalah
     angka dan bacaannya; berkas fisiknya cukup dicatat nomor arsipnya. */

  /* Master pemeriksaan beserta nilai rujukannya, dimuat sekali per halaman. */
  async function refLab(hanyaAktif = true) {
    let q = sb.from('ref_lab').select('*, rujukan:ref_lab_rujukan(*)').order('kelompok').order('urutan');
    if (hanyaAktif) q = q.eq('aktif', true);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function refLabSemua(ikutNonaktif = true) {
    return await refLab(!ikutNonaktif);
  }
  async function refLabPaket() {
    const { data, error } = await sb.from('ref_lab_paket')
      .select('*, item:ref_lab_paket_item(lab_id, urutan)')
      .eq('aktif', true).order('urutan');
    if (error) throw error; return data;
  }
  /* CRUD penuh untuk Master Paket Pemeriksaan Lab */
  async function daftarPaket(semuaStatus = false) {
    let q = sb.from('ref_lab_paket')
      .select('*, item:ref_lab_paket_item(lab_id, urutan)')
      .order('urutan');
    if (!semuaStatus) q = q.eq('aktif', true);
    const { data, error } = await q;
    if (error) throw error; return data || [];
  }
  async function simpanPaket(payload, itemLabIds) {
    const isEdit = !!payload.id;
    let resHeader;
    try {
      resHeader = isEdit
        ? await sb.from('ref_lab_paket').update(payload).eq('id', payload.id).select().single()
        : await sb.from('ref_lab_paket').insert(payload).select().single();
      if (resHeader.error) throw resHeader.error;
    } catch (errHeader) {
      // Fallback jika kolom bruto/netto/keterangan belum ada di database lama
      const msg = String(errHeader.message || '').toLowerCase();
      if (msg.includes('bruto') || msg.includes('netto') || msg.includes('keterangan')) {
        const stripped = {
          kode: payload.kode,
          nama: payload.nama,
          urutan: payload.urutan,
          aktif: payload.aktif
        };
        resHeader = isEdit
          ? await sb.from('ref_lab_paket').update(stripped).eq('id', payload.id).select().single()
          : await sb.from('ref_lab_paket').insert(stripped).select().single();
        if (resHeader.error) throw resHeader.error;
      } else {
        throw errHeader;
      }
    }

    const paketId = resHeader.data.id;
    /* Sinkronisasi item: hapus lama lalu insert ulang */
    if (Array.isArray(itemLabIds)) {
      const { error: delErr } = await sb.from('ref_lab_paket_item').delete().eq('paket_id', paketId);
      if (delErr) console.warn('Hapus item paket lama:', delErr);
      if (itemLabIds.length > 0) {
        const rows = itemLabIds.map((lid, i) => ({ paket_id: paketId, lab_id: lid, urutan: i }));
        const { error: insErr } = await sb.from('ref_lab_paket_item').insert(rows);
        if (insErr) {
          console.error('Gagal simpan ref_lab_paket_item:', insErr);
          throw insErr;
        }
      }
    }
    return resHeader.data;
  }
  async function hapusPaket(id) {
    const { error } = await sb.from('ref_lab_paket').delete().eq('id', id);
    if (error) throw error;
  }
  async function simpanRefLab(patch) {
    const { data, error } = patch.id
      ? await sb.from('ref_lab').update(patch).eq('id', patch.id).select().single()
      : await sb.from('ref_lab').insert(patch).select().single();
    if (error) throw error; return data;
  }
  async function simpanRujukan(patch) {
    const { data, error } = patch.id
      ? await sb.from('ref_lab_rujukan').update(patch).eq('id', patch.id).select().single()
      : await sb.from('ref_lab_rujukan').insert(patch).select().single();
    if (error) throw error; return data;
  }
  async function hapusRujukan(id) {
    const { error } = await sb.from('ref_lab_rujukan').delete().eq('id', id);
    if (error) throw error;
  }
  /* Hapus permanen pemeriksaan lab. Baris nilai rujukan miliknya (dan
     keanggotaan paket) ikut terhapus otomatis; ditolak database bila
     pemeriksaan ini sudah pernah punya hasil pasien. */
  async function hapusLab(id) {
    const { error } = await sb.from('ref_lab').delete().eq('id', id);
    if (error) throw error;
  }

  /* Permintaan & hasil */
  async function labMinta(kunjunganId, labIds, catatan = null,
                          asal = 'INTERNAL', namaLabLuar = null) {
    
    // Ekspansi otomatis: jika yang diminta adalah grup/paket (misal H0101),
    // sertakan juga seluruh anak-anaknya (H0101xx)
    let finalIds = new Set(labIds);
    try {
      const allLab = await refLab(true);
      for (const id of labIds) {
        const parent = allLab.find(m => m.id === id);
        if (parent) {
          for (const m of allLab) {
            if (m.kode.startsWith(parent.kode) && m.kode !== parent.kode) {
              finalIds.add(m.id);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Gagal ekspansi lab paket', e);
    }

    const { data, error } = await sb.rpc('lab_minta', {
      p_kunjungan_id: kunjunganId, p_lab_ids: Array.from(finalIds),
      p_catatan: catatan || null, p_asal: asal,
      p_nama_lab_luar: namaLabLuar || null
    });
    if (error) throw error; return data;
  }
  /* Hasil dari lab luar: pasien wajib, kunjungan boleh kosong. Dipisah
     dari labMinta() karena isian layarnya memang berbeda — yang satu
     memilih pemeriksaan untuk dikerjakan, yang satu menyalin lembar
     yang sudah jadi. */
  async function labMintaLuar({ pasien_id, kunjungan_id, lab_ids, tanggal,
                                nama_lab, no_lembar, catatan }) {
    let finalIds = new Set(lab_ids);
    try {
      const allLab = await refLab(true);
      for (const id of lab_ids) {
        const parent = allLab.find(m => m.id === id);
        if (parent) {
          for (const m of allLab) {
            if (m.kode.startsWith(parent.kode) && m.kode !== parent.kode) {
              finalIds.add(m.id);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Gagal ekspansi lab paket', e);
    }

    const { data, error } = await sb.rpc('lab_minta', {
      p_kunjungan_id: kunjungan_id || null, p_lab_ids: Array.from(finalIds),
      p_catatan: catatan || null, p_asal: 'EKSTERNAL',
      p_nama_lab_luar: nama_lab || null, p_pasien_id: pasien_id,
      p_tanggal: tanggal || null, p_no_lembar_luar: no_lembar || null
    });
    if (error) throw error; return data;
  }
  async function labAntrean(dari, sampai, status = null) {
    let q = sb.from('v_lab_antrean').select('*');
    if (dari) q = q.gte('tanggal', dari);
    if (sampai) q = q.lte('tanggal', sampai);
    q = q.order('tanggal', { ascending: false }).order('diminta_pada', { ascending: false });
    if (status) q = Array.isArray(status) ? q.in('status', status) : q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function labPermintaan(id) {
    const { data, error } = await sb.from('lab_permintaan')
      .select(`*, pasien:pasien_id(id,no_rm,nama,tanggal_lahir,jenis_kelamin,no_bpjs,nik),
               kunjungan:kunjungan_id(id,no_kunjungan,tanggal,cara_bayar, dokter:dokter_id(nama)),
               peminta:diminta_oleh(nama), penutup:selesai_oleh(nama),
               hasil:lab_hasil(*, ref:lab_id(id,kode,nama,kelompok,satuan,jenis_nilai,pilihan,teks_normal,desimal,kode_loinc,display_loinc,kode_specimen,nama_specimen,barcode,janji_hasil,metode))`)
      .eq('id', id).single();
    if (error) throw error;
    if (data && data.hasil) data.hasil.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    return data;
  }
  async function labKunjungan(kunjunganId) {
    const { data, error } = await sb.from('lab_permintaan')
      .select(`*, hasil:lab_hasil(*, ref:lab_id(kode,nama,kelompok,satuan,jenis_nilai,desimal))`)
      .eq('kunjungan_id', kunjunganId).neq('status', 'BATAL')
      .order('diminta_pada');
    if (error) throw error; return data;
  }
  async function labPasien(pasienId, batas = 40) {
    const { data, error } = await sb.from('v_lab_antrean').select('*')
      .eq('pasien_id', pasienId).neq('status', 'BATAL')
      .order('tanggal', { ascending: false }).limit(batas);
    if (error) throw error; return data;
  }
  /* Satu nilai berubah = satu simpanan. Tidak dikirim borongan supaya
     kegagalan pada satu baris tidak menghapus ketikan baris lain. */
  async function simpanHasilLab(id, patch) {
    const { data, error } = await sb.from('lab_hasil')
      .update(patch).eq('id', id).select().single();
    if (error) throw error; return data;
  }
  async function labSelesaikan(id, verifikator = null) {
    const { error } = await sb.rpc('lab_selesaikan', { p_permintaan_id: id });
    if (error) throw error;

    if (verifikator) {
      let namaVerifikator = typeof verifikator === 'object' ? verifikator.nama : verifikator;
      let pegawaiId = typeof verifikator === 'object' ? verifikator.id : null;

      // Cari pegawaiId jika belum ada
      if (!pegawaiId && namaVerifikator) {
        try {
          const kataKunci = namaVerifikator.split(' ')[0];
          const { data: pData } = await sb.from('pegawai')
            .select('id, nama')
            .ilike('nama', `%${kataKunci}%`)
            .limit(1);
          if (pData && pData.length > 0) {
            pegawaiId = pData[0].id;
          }
        } catch (_) {}
      }

      const nowIso = new Date().toISOString();
      const patch = {};
      if (pegawaiId) patch.selesai_oleh = pegawaiId;
      if (namaVerifikator) {
        patch.verifikator = namaVerifikator;
        patch.tgl_verifikasi = nowIso;
      }

      try {
        const { error: errUpdate } = await sb.from('lab_permintaan').update(patch).eq('id', id);
        if (errUpdate && pegawaiId) {
          // Fallback bila kolom verifikator belum ada di PostgreSQL Supabase
          await sb.from('lab_permintaan').update({ selesai_oleh: pegawaiId }).eq('id', id);
        }
      } catch (_) {
        if (pegawaiId) {
          try {
            await sb.from('lab_permintaan').update({ selesai_oleh: pegawaiId }).eq('id', id);
          } catch (_) {}
        }
      }
    }
  }
  async function labBukaKunci(id, alasan) {
    const { error } = await sb.rpc('lab_buka_kunci', { p_permintaan_id: id, p_alasan: alasan });
    if (error) throw error;
  }
  async function labBatalkan(id, alasan) {
    const { error } = await sb.rpc('lab_batalkan', { p_permintaan_id: id, p_alasan: alasan });
    if (error) throw error;
  }
  async function labTambahItem(permintaanId, labId) {
    const { data: ref, error: errRef } = await sb.from('ref_lab').select('*').eq('id', labId).single();
    if (errRef) throw errRef;
    const { data: existing } = await sb.from('lab_hasil').select('urutan').eq('permintaan_id', permintaanId).order('urutan', { ascending: false }).limit(1);
    const nextUrut = (existing && existing.length > 0) ? (existing[0].urutan || 0) + 1 : 1;
    const { data, error } = await sb.from('lab_hasil').insert({
      permintaan_id: permintaanId,
      lab_id: labId,
      nama: ref.nama,
      satuan: ref.satuan,
      urutan: nextUrut
    }).select().single();
    if (error) throw error;
    return data;
  }
  async function labHapusItem(id) {
    const { error } = await sb.from('lab_hasil').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  async function labHapusPermintaan(id) {
    await sb.from('lab_hasil').delete().eq('permintaan_id', id);
    await sb.from('lab_fisik').delete().eq('permintaan_id', id);
    await sb.from('lab_anamnesa').delete().eq('permintaan_id', id);
    const { error } = await sb.from('lab_permintaan').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  async function labTren(pasienId, labId, batas = 12) {
    const { data, error } = await sb.from('v_lab_tren').select('*')
      .eq('pasien_id', pasienId).eq('lab_id', labId)
      .order('tanggal', { ascending: false }).limit(batas);
    if (error) throw error; return data;
  }
  async function riwayatLabPasien(pasienId, batas = 1000) {
    const { data, error } = await sb.from('v_lab_tren').select('*')
      .eq('pasien_id', pasienId)
      .order('tanggal', { ascending: false }).limit(batas);
    if (error) throw error; return data;
  }
  async function labBelumSelesai(kunjunganId) {
    const { data, error } = await sb.from('v_kasir_menunggu_lab')
      .select('lab_belum_selesai').eq('kunjungan_id', kunjunganId).maybeSingle();
    if (error) throw error;
    return data ? data.lab_belum_selesai : 0;
  }

  /* Pemeriksaan fisik (medical check-up) */
  async function labFisikAmbil(permintaanId) {
    const { data, error } = await sb.from('lab_fisik')
      .select('*').eq('permintaan_id', permintaanId)
      .order('item_id');
    if (error) throw error; return data || [];
  }
  async function labFisikSimpan(permintaanId, items) {
    const { error } = await sb.rpc('lab_fisik_simpan', {
      p_permintaan_id: permintaanId,
      p_items: items
    });
    if (error) throw error;
  }

  /* Anamnesa (medical check-up) */
  async function labAnamnesaAmbil(permintaanId) {
    const { data, error } = await sb.from('lab_anamnesa')
      .select('*').eq('permintaan_id', permintaanId)
      .order('urutan');
    if (error) throw error; return data || [];
  }
  async function labAnamnesaSimpan(permintaanId, items) {
    const { error } = await sb.rpc('lab_anamnesa_simpan', {
      p_permintaan_id: permintaanId,
      p_items: items
    });
    if (error) throw error;
  }

  /* Analisa Sperma */
  async function labSpermaAmbil(permintaanId) {
    try {
      const { data, error } = await sb.from('lab_sperma')
        .select('*').eq('permintaan_id', permintaanId)
        .order('urutan');
      if (!error && data && data.length > 0) return data;
    } catch(e) {
      console.warn('lab_sperma dari database:', e);
    }
    try {
      const lokal = localStorage.getItem('lab_sperma_' + permintaanId);
      if (lokal) return JSON.parse(lokal);
    } catch(e) {}
    return [];
  }

  async function labSpermaSimpan(permintaanId, items) {
    try {
      localStorage.setItem('lab_sperma_' + permintaanId, JSON.stringify(items));
    } catch(e) {}

    // Coba simpan via RPC
    try {
      const { error: rpcErr } = await sb.rpc('lab_sperma_simpan', {
        p_permintaan_id: permintaanId,
        p_items: items
      });
      if (!rpcErr) return;
    } catch(e) {}

    // Coba upsert langsung ke tabel lab_sperma
    try {
      const rows = items.map(it => ({
        permintaan_id: permintaanId,
        urutan: it.urutan,
        parameter: it.parameter || it.nama_item || '',
        hasil: it.hasil != null ? String(it.hasil) : '',
        satuan: it.satuan || '',
        bawah: it.bawah || '',
        tengah: it.tengah || '',
        atas: it.atas || '',
        flag: it.flag != null ? String(it.flag) : '1',
        keterangan: it.keterangan || ''
      }));
      const { error } = await sb.from('lab_sperma').upsert(rows, { onConflict: 'permintaan_id,urutan' });
      if (!error) return;
    } catch(e) {}
  }

  async function labSimpanCatatan(permintaanId, catatan) {
    const { error } = await sb.from('permintaan_lab').update({ catatan_klinis: catatan }).eq('id', permintaanId);
    if (error) throw error;
  }

  /* Bacaan penunjang */
  async function penunjangSimpan(p) {
    const { data, error } = await sb.rpc('penunjang_simpan', {
      p_id: p.id || null, p_pasien_id: p.pasien_id, p_kunjungan_id: p.kunjungan_id || null,
      p_tanggal: p.tanggal || null, p_jenis: p.jenis, p_judul: p.judul || null,
      p_asal: p.asal || 'INTERNAL', p_nama_tempat: p.nama_tempat || null,
      p_no_film: p.no_film || null, p_temuan: p.temuan || null,
      p_kesan: p.kesan, p_saran: p.saran || null, p_gigi: p.gigi || null
    });
    if (error) throw error; return data;
  }
  async function penunjangPasien(pasienId, batas = 40) {
    const { data, error } = await sb.from('v_penunjang_lengkap').select('*')
      .eq('pasien_id', pasienId).order('tanggal', { ascending: false }).limit(batas);
    if (error) throw error; return data;
  }
  async function penunjangKunjungan(kunjunganId) {
    const { data, error } = await sb.from('v_penunjang_lengkap').select('*')
      .eq('kunjungan_id', kunjunganId).order('dibaca_pada');
    if (error) throw error; return data;
  }
  /* Gigi mana saja yang pernah dirontgen — dipakai odontogram untuk
     memberi tanda kecil pada giginya. Satu permintaan untuk seluruh
     mulut, bukan 52 permintaan per gigi. */
  async function gigiBerbacaan(pasienId) {
    const { data, error } = await sb.from('penunjang_gigi')
      .select('fdi, penunjang!inner(id,tanggal,jenis,kesan,pasien_id)')
      .eq('penunjang.pasien_id', pasienId);
    if (error) throw error;
    const peta = {};
    (data || []).forEach(r => {
      if (!peta[r.fdi]) peta[r.fdi] = [];
      peta[r.fdi].push(r.penunjang);
    });
    Object.values(peta).forEach(a =>
      a.sort((x, y) => String(y.tanggal).localeCompare(String(x.tanggal))));
    return peta;
  }
  async function hapusPenunjang(id) {
    const { error } = await sb.from('penunjang').delete().eq('id', id);
    if (error) throw error;
  }

  /* Register arsip berkas fisik */
  async function lampiranPasien(pasienId, batas = 60) {
    const { data, error } = await sb.from('lampiran')
      .select('*, kunjungan:kunjungan_id(no_kunjungan,tanggal), pencatat:dibuat_oleh(nama)')
      .eq('pasien_id', pasienId)
      .order('tanggal_dokumen', { ascending: false, nullsFirst: false })
      .order('dibuat_pada', { ascending: false }).limit(batas);
    if (error) throw error; return data;
  }
  async function lampiranKunjungan(kunjunganId) {
    const { data, error } = await sb.from('lampiran').select('*')
      .eq('kunjungan_id', kunjunganId).order('dibuat_pada');
    if (error) throw error; return data;
  }
  async function simpanLampiran(patch) {
    const { data, error } = patch.id
      ? await sb.from('lampiran').update(patch).eq('id', patch.id).select().single()
      : await sb.from('lampiran').insert(patch).select().single();
    if (error) throw error; return data;
  }
  async function hapusLampiran(id) {
    const { error } = await sb.from('lampiran').delete().eq('id', id);
    if (error) throw error;
  }


  /* ======================================================================
     SURAT-SURAT KETERANGAN
     ====================================================================== */

  /* Nilai bawaan pengaturan surat. Pola yang sama dengan
     invoice_template.js: bawaan di JavaScript, isi database ditumpuk di
     atasnya. Menambah pengaturan baru nanti tidak butuh migrasi SQL —
     cukup satu kunci di sini, dan klinik yang belum menyimpannya tetap
     jalan. */
  const BAWAAN_SURAT = {
    /* Kota pada baris tanggal ("Manado, 3 September 2026"). Diambil dari
       kop klinik; boleh diganti lewat Pengaturan. */
    kota: 'Manado',
    catatan_kaki: 'Keaslian surat ini dapat diperiksa dengan menyebutkan nomor surat ' +
                  'kepada Laboratorium Medis Utama.',
    tampilkan_kop: true,
    /* Garis di bawah kop. Bawaannya MATI karena gambar kop Laboratorium Medis Utama
       sudah berakhir dengan garis hijau sendiri; garis hitam tepat di
       bawahnya terbaca seperti kesalahan cetak. Klinik yang mengunggah
       kop tanpa garis bisa menyalakannya. */
    garis_bawah_kop: false,
    /* Kop pengganti, bila klinik mengunggah yang baru. Kosong = memakai
       kop bawaan yang tertanam di js/kop_klinik.js. */
    kop_data_uri: null,
    kop_rasio: null
  };

  let _suratSetelan = null;

  async function suratPengaturan(paksaMuat = false) {
    if (_suratSetelan && !paksaMuat) return _suratSetelan;
    let simpanan = {};
    try {
      const { data, error } = await sb.from('sys_surat_pengaturan')
        .select('konfigurasi').eq('id', 1).maybeSingle();
      if (!error && data && data.konfigurasi) simpanan = data.konfigurasi;
    } catch (e) { /* pengaturan hilang bukan alasan surat gagal dicetak */ }
    _suratSetelan = Object.assign({}, BAWAAN_SURAT, simpanan);
    return _suratSetelan;
  }

  async function simpanSuratPengaturan(konfigurasi) {
    const { data, error } = await sb.from('sys_surat_pengaturan')
      .update({ konfigurasi, updated_by: _saya?.id }).eq('id', 1)
      .select('konfigurasi').single();
    if (error) throw error;
    _suratSetelan = Object.assign({}, BAWAAN_SURAT, data.konfigurasi || {});
    return _suratSetelan;
  }

  /* Pengaturan template cetak Resep (logo, ukuran kertas, tampil/sembunyi
     tiap bagian) — pola sama persis dengan pengaturan Surat di atas. */
  const BAWAAN_RESEP = {
    logo_data_uri: null,
    logo_rasio: null,
    ukuran_kertas: 'A5',
    tampil_bb: true,
    tampil_alergi: true,
    tampil_validasi_farmasi: true
  };

  let _resepSetelan = null;

  async function resepPengaturan(paksaMuat = false) {
    if (_resepSetelan && !paksaMuat) return _resepSetelan;
    let simpanan = {};
    try {
      const { data, error } = await sb.from('sys_resep_pengaturan')
        .select('konfigurasi').eq('id', 1).maybeSingle();
      if (!error && data && data.konfigurasi) simpanan = data.konfigurasi;
    } catch (e) { /* pengaturan hilang bukan alasan resep gagal dicetak */ }
    _resepSetelan = Object.assign({}, BAWAAN_RESEP, simpanan);
    return _resepSetelan;
  }

  async function simpanResepPengaturan(konfigurasi) {
    const { data, error } = await sb.from('sys_resep_pengaturan')
      .update({ konfigurasi, updated_by: _saya?.id }).eq('id', 1)
      .select('konfigurasi').single();
    if (error) throw error;
    _resepSetelan = Object.assign({}, BAWAAN_RESEP, data.konfigurasi || {});
    return _resepSetelan;
  }

  async function refJenisSurat(hanyaAktif = true) {
    let q = sb.from('ref_jenis_surat').select('*').order('urutan');
    if (hanyaAktif) q = q.eq('aktif', true);
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  async function suratNomorBerikutnya(jenis, tahun) {
    const { data, error } = await sb.rpc('surat_nomor_berikutnya',
      { p_jenis: jenis, p_tahun: tahun });
    if (error) throw error; return data;
  }

  async function suratNomorTerpakai(jenis, tahun, nomor) {
    const { data, error } = await sb.rpc('surat_nomor_terpakai',
      { p_jenis: jenis, p_tahun: tahun, p_nomor: nomor });
    if (error) throw error; return data || null;
  }

  async function buatSurat(rec) {
    const { data, error } = await sb.from('surat')
      .insert({ ...rec, dibuat_oleh: _saya?.id }).select().single();
    if (error) throw error; return data;
  }

  async function ubahSurat(id, patch) {
    const { data, error } = await sb.from('surat')
      .update(patch).eq('id', id).select().single();
    if (error) throw error; return data;
  }

  async function surat(id) {
    const { data, error } = await sb.from('v_surat').select('*').eq('id', id).maybeSingle();
    if (error) throw error; return data;
  }

  async function daftarSurat(filter = {}) {
    let q = sb.from('v_surat').select('*')
      .order('tanggal_surat', { ascending: false })
      .order('dibuat_pada', { ascending: false })
      .limit(filter.batas || 300);
    if (filter.dari)      q = q.gte('tanggal_surat', filter.dari);
    if (filter.sampai)    q = q.lte('tanggal_surat', filter.sampai);
    if (filter.jenis)     q = q.eq('jenis_kode', filter.jenis);
    if (filter.status)    q = q.eq('status', filter.status);
    if (filter.pasien_id) q = q.eq('pasien_id', filter.pasien_id);
    if (filter.kata) {
      /* Satu kotak cari untuk tiga kolom. Koma adalah pemisah pada sintaks
         or() PostgREST, jadi ia dibuang dari kata kunci — kalau tidak,
         mengetik "Sitorus, Maria" menghasilkan galat sintaks, bukan hasil
         kosong, dan pengguna tidak akan pernah menebak sebabnya. */
      const k = String(filter.kata).replace(/[,()]/g, ' ').trim();
      if (k) q = q.or(`nomor_surat.ilike.%${k}%,nama_pasien.ilike.%${k}%,` +
                      `perihal.ilike.%${k}%,no_rm.ilike.%${k}%`);
    }
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  async function suratKunjungan(kunjunganId) {
    const { data, error } = await sb.from('v_surat').select('*')
      .eq('kunjungan_id', kunjunganId).order('dibuat_pada');
    if (error) throw error; return data;
  }

  async function suratPasien(pasienId, batas = 40) {
    const { data, error } = await sb.from('v_surat').select('*')
      .eq('pasien_id', pasienId).order('tanggal_surat', { ascending: false }).limit(batas);
    if (error) throw error; return data;
  }

  async function suratBatalkan(id, alasan) {
    const { data, error } = await sb.rpc('surat_batalkan', { p_id: id, p_alasan: alasan });
    if (error) throw error; return data;
  }

  async function suratHapus(id) {
    const { error } = await sb.from('surat').delete().eq('id', id);
    if (error) throw error;
  }

  async function suratCatatCetak(id) {
    const { error } = await sb.rpc('surat_catat_cetak', { p_id: id });
    if (error) throw error;
  }

  /* --------------------------- Antrean ---------------------------------- */

  async function antreanHariIni() {
    const { data, error } = await sb.from('v_antrean_hari_ini').select('*');
    if (error) throw error; return data;
  }

  /* Kuota & jam buka hari ini per poli. Dipakai papan antrean dan
     halaman jadwal; poli yang tutup pun ikut terbawa (kolom `buka`)
     supaya petugas tahu bedanya "sepi" dan "libur". */
  async function antreanKuota() {
    const { data, error } = await sb.from('v_antrean_kuota').select('*');
    if (error) throw error; return data;
  }

  /* Nomor antrean baru dari loket, TANPA membuat kunjungan.
     Dipakai untuk pasien yang datang tetapi berkasnya belum lengkap —
     ia tetap mendapat nomor dan tidak perlu mengantre dua kali. */
  async function antreanAmbilLoket(rec) {
    const { data, error } = await sb.from('antrean')
      .insert({ ...rec, sumber: rec.sumber || 'LOKET', dibuat_oleh: _saya?.id })
      .select().single();
    if (error) throw error; return data;
  }

  async function antreanPanggil(id, tujuan = null) {
    const { data, error } = await sb.rpc('antrean_panggil',
      { p_antrean: id, p_tujuan: tujuan });
    if (error) throw error; return data;
  }
  async function antreanCheckin(id, { pasien_id, dokter_id = null,
                                      cara_bayar = 'BPJS', keluhan = null } = {}) {
    const { data, error } = await sb.rpc('antrean_checkin', {
      p_antrean: id, p_pasien: pasien_id, p_dokter: dokter_id,
      p_cara_bayar: cara_bayar, p_keluhan: keluhan
    });
    if (error) throw error; return data;
  }
  async function antreanMulaiLayan(id) {
    const { data, error } = await sb.rpc('antrean_mulai_layan', { p_antrean: id });
    if (error) throw error; return data;
  }
  async function antreanLewat(id, alasan = null) {
    const { data, error } = await sb.rpc('antrean_lewat', { p_antrean: id, p_alasan: alasan });
    if (error) throw error; return data;
  }
  async function antreanBatal(id, alasan = null) {
    const { data, error } = await sb.rpc('antrean_batal', { p_antrean: id, p_alasan: alasan });
    if (error) throw error; return data;
  }
  async function antreanUbah(id, patch) {
    const { data, error } = await sb.from('antrean').update(patch).eq('id', id).select().single();
    if (error) throw error; return data;
  }

  /* Riwayat panggilan hari ini — dipakai papan antrean untuk menampilkan
     "terakhir dipanggil" tanpa menunggu layar tunggu. */
  async function antreanPanggilanHariIni(batas = 20) {
    const { data, error } = await sb.from('antrean_panggilan')
      .select('id, waktu, tahap, tujuan, urutan, antrean:antrean_id(nomor, poli_id)')
      .order('id', { ascending: false }).limit(batas);
    if (error) throw error; return data;
  }

  /* Realtime: memberi tahu pemanggil setiap kali ada baris `antrean` yang
     berubah (nomor baru dari loket/Mobile JKN, dipanggil, check-in,
     selesai, dst). Sengaja HANYA memberi sinyal "ada perubahan" — bukan
     mengirim baris yang berubah — supaya pemanggil selalu memuat ulang
     lewat `v_antrean_hari_ini` (satu sumber kebenaran, sudah lengkap
     dengan join poli/dokter) alih-alih menyusun ulang baris dari payload
     realtime yang mentah. Tabel `antrean` harus didaftarkan ke publication
     `supabase_realtime` di Supabase dulu (lihat catatan migrasi) — kalau
     belum, fungsi ini tetap terpasang tanpa galat, hanya tidak pernah
     terpanggil, jadi pemanggil WAJIB tetap punya jalur penyegaran berkala
     sebagai jaring pengaman (baterai habis, wifi putus sebentar, dsb).
     Mengembalikan fungsi untuk berhenti berlangganan. */
  function langgananAntrean(callback) {
    const ch = sb.channel('antrean-perubahan')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'antrean' }, callback)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }

  /* ---- Jadwal & kuota ---- */
  async function poliJadwal() {
    const { data, error } = await sb.from('poli_jadwal')
      .select('*').order('hari').order('sesi');
    if (error) throw error; return data;
  }
  async function simpanJadwal(rec, id = null) {
    const q = id ? sb.from('poli_jadwal').update(rec).eq('id', id)
                 : sb.from('poli_jadwal').insert(rec);
    const { data, error } = await q.select().single();
    if (error) throw error; return data;
  }
  async function hapusJadwal(id) {
    const { error } = await sb.from('poli_jadwal').delete().eq('id', id);
    if (error) throw error;
  }
  async function poliLibur(dari = null) {
    let q = sb.from('poli_libur').select('*, poli:poli_id(nama)').order('tanggal');
    if (dari) q = q.gte('tanggal', dari);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function simpanLibur(rec) {
    const { data, error } = await sb.from('poli_libur')
      .insert({ ...rec, dibuat_oleh: _saya?.id }).select().single();
    if (error) throw error; return data;
  }
  async function hapusLibur(id) {
    const { error } = await sb.from('poli_libur').delete().eq('id', id);
    if (error) throw error;
  }

  /* ---- Pengaturan antrean & layar ---- */
  async function antreanPengaturan() {
    const { data, error } = await sb.from('sys_antrean_pengaturan')
      .select('konfigurasi, token_layar').eq('id', 1).maybeSingle();
    if (error) throw error;
    return data || { konfigurasi: {}, token_layar: null };
  }
  async function simpanAntreanPengaturan(konfigurasi) {
    const { data, error } = await sb.from('sys_antrean_pengaturan')
      .update({ konfigurasi, updated_at: new Date().toISOString(), updated_by: _saya?.id })
      .eq('id', 1).select().single();
    if (error) throw error; return data;
  }
  async function antreanTokenBaru(token) {
    const { data, error } = await sb.rpc('antrean_token_baru', { p_token: token });
    if (error) throw error; return data;
  }

  /* Layar tunggu memanggil ini TANPA login. Dipakai display.html.
     Fungsinya security definer dan hanya memulangkan nomor — tidak ada
     nama, nomor rekam medis, atau data medis apa pun di dalamnya. */
  async function antreanLayar(token) {
    const { data, error } = await sb.rpc('antrean_layar', { p_token: token });
    if (error) throw error; return data;
  }

  /* ---- Akun web service Antrol ---- */
  async function antrolAkun() {
    const { data, error } = await sb.from('v_antrol_akun').select('*').order('username');
    if (error) throw error; return data;
  }
  async function antrolAkunSimpan(username, sandi, keterangan = null) {
    const { data, error } = await sb.rpc('antrol_akun_simpan',
      { p_username: username, p_sandi: sandi, p_keterangan: keterangan });
    if (error) throw error; return data;
  }
  async function antrolAkunHapus(username) {
    const { data, error } = await sb.rpc('antrol_akun_hapus', { p_username: username });
    if (error) throw error; return data;
  }
  async function antrolLog(batas = 50) {
    const { data, error } = await sb.from('antrol_log').select('*')
      .order('waktu', { ascending: false }).limit(batas);
    if (error) throw error; return data;
  }

  /* --------------------------- Bridging --------------------------------- */
  /* Aplikasi TIDAK pernah memegang kredensial. Ia hanya memanggil Edge
     Function, dan Edge Function-lah yang menyimpan rahasia serta berbicara
     dengan PCare / SatuSehat. */
  async function panggilBridging(fungsi, muatan) {
    const { data, error } = await sb.functions.invoke(fungsi, { body: muatan });
    if (error) throw error;
    return data;
  }
  async function riwayatBridging(kunjunganId) {
    const { data, error } = await sb.from('bridging_log').select('*')
      .eq('kunjungan_id', kunjunganId).order('waktu', { ascending: false });
    if (error) throw error; return data;
  }

  /* --------------------- Kronis: referensi & migrasi -------------------- */
  async function refKronisDiagnosa() {
    const { data, error } = await sb.from('ref_kronis_diagnosa')
      .select('kode,nama,pantau_obat,bulan_lab,alias,icd10_awal,urutan,aktif')
      .eq('aktif', true).order('urutan');
    if (error) throw error; return data;
  }

  /* Obat berkuota BPJS (statin) — dipakai dropdown di modal pendaftaran
     buku kronis halaman Periksa. */
  async function refKronisKuotaObat() {
    const { data, error } = await sb.from('ref_kronis_kuota_obat')
      .select('kunci,nama,maks,aktif').eq('aktif', true).order('nama');
    if (error) throw error; return data;
  }

  async function kronisImporRingkas() {
    const { data, error } = await sb.from('v_kronis_impor_ringkas').select('*').single();
    if (error) throw error; return data;
  }

  /* Baris titipan. `pasien` ikut diambil supaya daftar "sudah cocok" bisa
     menyebut nama tujuannya — tanpa itu petugas tidak punya cara memeriksa
     apakah tempelannya benar selain membatalkannya satu per satu. */
  async function kronisImporDaftar(status = 'MENUNGGU', cari = '', batas = 200) {
    let q = sb.from('kronis_impor_pasien')
      .select('id,kunci,nama_pasien,no_bpjs,no_telp,jml_obat,jml_lab,jml_kontrol,' +
              'punya_terapi,diagnosis_teks,status,pasien_id,alasan,dicocokkan_pada,' +
              'pasien:pasien_id(id,no_rm,nama,tanggal_lahir,jenis_kelamin,no_bpjs)')
      .order('punya_terapi', { ascending: false })
      .order('nama_pasien')
      .limit(batas);
    if (status) q = q.eq('status', status);
    if (cari) q = q.ilike('nama_pasien', `%${cari}%`);
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  async function kronisImporBaris(imporId, batas = 60) {
    const { data, error } = await sb.from('kronis_impor_baris')
      .select('id,sumber,sumber_id,tanggal,isi,dituang')
      .eq('impor_id', imporId)
      .order('sumber').order('tanggal', { ascending: false, nullsFirst: false })
      .limit(batas);
    if (error) throw error; return data;
  }

  async function kronisImporUsulan(imporId, batas = 8) {
    const { data, error } = await sb.rpc('kronis_impor_usulan',
      { p_impor_id: imporId, p_batas: batas });
    if (error) throw error; return data || [];
  }

  async function kronisImporTampung(sumber, baris) {
    const { data, error } = await sb.rpc('kronis_impor_tampung',
      { p_sumber: sumber, p_baris: baris });
    if (error) throw error; return data;
  }

  async function kronisImporCocokkan(imporId, pasienId) {
    const { data, error } = await sb.rpc('kronis_impor_cocokkan',
      { p_impor_id: imporId, p_pasien_id: pasienId });
    if (error) throw error; return data;
  }

  async function kronisImporBatalCocok(imporId) {
    const { data, error } = await sb.rpc('kronis_impor_batal_cocok', { p_impor_id: imporId });
    if (error) throw error; return data;
  }

  async function kronisImporAbaikan(imporId, alasan = null) {
    const { data, error } = await sb.rpc('kronis_impor_abaikan',
      { p_impor_id: imporId, p_alasan: alasan });
    if (error) throw error; return data;
  }

  async function kronisImporOtomatis() {
    const { data, error } = await sb.rpc('kronis_impor_cocokkan_otomatis');
    if (error) throw error; return data;
  }

  async function kronisImporBersihkan(semua = false) {
    const { data, error } = await sb.rpc('kronis_impor_bersihkan', { p_semua: semua });
    if (error) throw error; return data;
  }

  /* Mengambil semua data pencocokan portal (status COCOK) beserta riwayat baris
     dan hasil lab RME untuk diekspor ke templat spreadsheet Prolanis / PCare. */
  async function kronisImporEksporKesesuaian(status = 'COCOK') {
    // 1. Coba panggil RPC jika sudah didefinisikan di database
    try {
      const { data: rpcData, error: rpcErr } = await sb.rpc('kronis_ekspor_kesesuaian', { p_status: status });
      if (!rpcErr && rpcData && Array.isArray(rpcData)) return rpcData;
    } catch (_) {}

    // 2. Fallback query client-side langsung dari tabel Supabase
    let q = sb.from('kronis_impor_pasien')
      .select('id,kunci,nama_pasien,no_bpjs,no_telp,diagnosis_teks,status,pasien_id,dicocokkan_pada,' +
              'pasien:pasien_id(id,no_rm,nama,nik,no_bpjs,alamat,tanggal_lahir,jenis_kelamin,no_telp,no_hp)')
      .order('id');
    if (status) q = q.eq('status', status);
    const { data: listPasien, error: errPasien } = await q;
    if (errPasien) throw errPasien;
    if (!listPasien || !listPasien.length) return [];

    const imporIds = listPasien.map(p => p.id);
    const pasienIds = listPasien.map(p => p.pasien_id).filter(Boolean);

    // Ambil baris titipan portal
    const barisMap = new Map();
    if (imporIds.length) {
      try {
        const { data: barisList } = await sb.from('kronis_impor_baris')
          .select('id,impor_id,sumber,tanggal,isi')
          .in('impor_id', imporIds)
          .order('tanggal', { ascending: true, nullsFirst: false });
        if (barisList) {
          for (const b of barisList) {
            if (!barisMap.has(b.impor_id)) barisMap.set(b.impor_id, []);
            barisMap.get(b.impor_id).push(b);
          }
        }
      } catch (_) {}
    }

    // Ambil hasil lab RME dan kajian awal jika pasien sudah tertempel
    const rmeLabMap = new Map();
    if (pasienIds.length) {
      try {
        const { data: labList } = await sb.from('lab_permintaan')
          .select('id,pasien_id,no_lab,tanggal,status,' +
                  'kunjungan:kunjungan_id(id,keluhan_singkat,dokter:dokter_id(nama),' +
                  'kajian_awal(sistolik,diastolik,nadi,nafas,suhu,berat_badan,tinggi_badan,lingkar_perut)),' +
                  'hasil:lab_hasil(id,lab_id,nama,satuan,nilai_angka,nilai_teks,ref_lab:lab_id(kode,nama))')
          .in('pasien_id', pasienIds)
          .eq('status', 'SELESAI')
          .order('tanggal', { ascending: true });
        if (labList) {
          for (const l of labList) {
            if (!rmeLabMap.has(l.pasien_id)) rmeLabMap.set(l.pasien_id, []);
            rmeLabMap.get(l.pasien_id).push(l);
          }
        }
      } catch (_) {}
    }

    return listPasien.map(p => ({
      ...p,
      baris: barisMap.get(p.id) || [],
      lab_rme: p.pasien_id ? (rmeLabMap.get(p.pasien_id) || []) : []
    }));
  }

  /* Mengambil data pelayanan pasien Prolanis, kunjungan dokter, tanda vital,
     dan hasil pemeriksaan lab berdasarkan rentang tanggal/bulan langsung dari database RME. */
  async function prolanisEksporPelayanan(tglMulai, tglSelesai, caraBayar = 'SEMUA', filterRekanan = '') {
    // 1. Coba RPC jika tersedia di database
    try {
      const { data: rpcData, error: rpcErr } = await sb.rpc('prolanis_ekspor_pelayanan', {
        p_tgl_mulai: tglMulai,
        p_tgl_selesai: tglSelesai,
        p_cara_bayar: (caraBayar === 'SEMUA' || !caraBayar) ? null : caraBayar,
        p_rekanan: (filterRekanan === 'SEMUA' || !filterRekanan) ? null : filterRekanan
      });
      if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData.length > 0) return rpcData;
    } catch (_) {}

    // 2. Query dari lab_permintaan (hub utama hasil lab & fisik)
    let qLab = sb.from('lab_permintaan')
      .select('id,no_lab,tanggal,status,catatan_klinis,created_at,' +
              'pasien:pasien_id(id,no_rm,nama,nik,no_bpjs,alamat,bpjs_faskes,plant,bagian,tanggal_lahir,jenis_kelamin),' +
              'dokter:diminta_oleh(nama),' +
              'lab_hasil(nama,satuan,nilai_angka,nilai_teks,ref_lab:lab_id(kode,nama)),' +
              'lab_fisik(item_id,nama_item,hasil,unit),' +
              'kunjungan:kunjungan_id(id,cara_bayar,keluhan_singkat,waktu_daftar,dokter:dokter_id(nama),kajian_awal(sistolik,diastolik,nadi,nafas,suhu,berat_badan,tinggi_badan,lingkar_perut))')
      .gte('tanggal', tglMulai)
      .lte('tanggal', tglSelesai)
      .order('tanggal', { ascending: true });

    const { data: lpList, error: errLp } = await qLab;
    if (errLp) throw errLp;

    const barisHasil = [];
    if (lpList && lpList.length) {
      for (const lp of lpList) {
        const p = lp.pasien || {};
        const k = lp.kunjungan || {};
        const cb = k.cara_bayar || 'BPJS';

        // Filter cara bayar
        if (caraBayar && caraBayar !== 'SEMUA') {
          if (caraBayar === 'BPJS' && cb !== 'BPJS' && !p.no_bpjs) continue;
          if (caraBayar === 'UMUM' && cb !== 'UMUM') continue;
        }

        // Tentukan Rekanan / FKTP
        let fktp = p.bpjs_faskes || p.plant || p.bagian || '';
        if (!fktp && k.keluhan_singkat && k.keluhan_singkat.startsWith('Dokter Pengirim: ')) {
          fktp = k.keluhan_singkat.replace('Dokter Pengirim: ', '').trim();
        }
        if (!fktp) {
          fktp = k.dokter?.nama || lp.dokter?.nama || 'Klinik Griya Medica';
        }

        // Filter rekanan bila ditentukan
        if (filterRekanan && filterRekanan !== 'SEMUA') {
          const frLower = filterRekanan.toLowerCase();
          const strCek = [fktp, p.bpjs_faskes, p.plant, p.bagian, k.keluhan_singkat, k.dokter?.nama, lp.dokter?.nama].filter(Boolean).join(' ').toLowerCase();
          if (!strCek.includes(frLower)) continue;
        }

        // Tanda vital / Fisik (prioritas lab_fisik, fallback kajian_awal)
        const lfList = lp.lab_fisik || [];
        const lfFind = (id) => (lfList.find(x => x.item_id === id)?.hasil || '').trim();
        const ka = (Array.isArray(k.kajian_awal) ? k.kajian_awal[0] : k.kajian_awal) || {};

        let tensi = lfFind(200);
        const tensiDia = lfFind(201);
        if (tensi && tensiDia && !tensi.includes('/')) {
          tensi = `${tensi}/${tensiDia}`;
        } else if (!tensi && ka.sistolik && ka.diastolik) {
          tensi = `${ka.sistolik}/${ka.diastolik}`;
        }
        if (!tensi) tensi = '120/80';

        const tb = lfFind(100) || ka.tinggi_badan || '';
        const bb = lfFind(101) || ka.berat_badan || '';
        const lpVal = lfFind(103) || ka.lingkar_perut || '';
        const rr = lfFind(203) || ka.nafas || '20';
        const hr = lfFind(202) || ka.nadi || '80';
        const suhu = ka.suhu ? String(ka.suhu).replace('.', ',') : '36,0';

        // Hasil Lab
        const listLabHasil = [];
        for (const lh of (lp.lab_hasil || [])) {
          listLabHasil.push({
            nama: lh.nama,
            satuan: lh.satuan,
            nilai_angka: lh.nilai_angka,
            nilai_teks: lh.nilai_teks,
            kode: lh.ref_lab ? lh.ref_lab.kode : ''
          });
        }

        barisHasil.push({
          permintaan_id: lp.id,
          kunjungan_id: k.id || null,
          no_kunjungan: lp.no_lab,
          no_lab: lp.no_lab,
          tgl_pelayanan: lp.tanggal,
          waktu_daftar: k.waktu_daftar || lp.created_at,
          cara_bayar: cb,
          pasien_id: p.id,
          no_rm: p.no_rm,
          nama_pasien: p.nama,
          nik: p.nik,
          no_bpjs: p.no_bpjs,
          alamat: p.alamat,
          fktp: fktp,
          plant: p.plant,
          bagian: p.bagian,
          tanggal_lahir: p.tanggal_lahir,
          jenis_kelamin: p.jenis_kelamin,
          dokter_nama: lp.dokter?.nama || k.dokter?.nama || 'dr. Minto Rahaju, Sp.PK',
          tensi: tensi,
          sistolik: ka.sistolik || null,
          diastolik: ka.diastolik || null,
          tinggi_badan: tb,
          berat_badan: bb,
          lingkar_perut: lpVal,
          rr: rr,
          hr: hr,
          suhu: suhu,
          keluhan: ka.keluhan_utama || k.keluhan_singkat || 'Pemeriksaan Rutin Prolanis',
          anamnesa: 'Pemeriksaan Rutin Prolanis',
          terapi_non_obat: '',
          status_pulang: 'BEROBAT JALAN',
          diagnosa_icd: 'E11.9',
          terapi_obat: '',
          lab_hasil: listLabHasil
        });
      }
    }

    return barisHasil;
  }

  /* --------------------- Pra-daftar pasien (migrasi dari nol) -----------
     Dipakai HANYA saat RME dipasang dari nol dan portal punya banyak orang
     yang perlu didaftarkan sekaligus sebelum Migrasi Portal (di atas) bisa
     menemukan pasangannya. Lihat sql/24_pasien_cari_mirip.sql dan
     js/pra_daftar_core.js untuk alasan lengkapnya. */
  async function pasienCariMirip(nama, nik = null, noBpjs = null, batas = 5) {
    const { data, error } = await sb.rpc('pasien_cari_mirip',
      { p_nama: nama, p_nik: nik, p_no_bpjs: noBpjs, p_batas: batas });
    if (error) throw error; return data || [];
  }

  /* Insert langsung ke tabel pasien — jalur PERSIS SAMA dengan pendaftaran
     satu-per-satu biasa (simpanPasien di atas), hanya saja sekaligus
     banyak baris. Trigger gen_no_rm() dan audit tetap berjalan per baris,
     jadi tiap pasien baru tetap dapat nomor RM berurutan dan tercatat di
     audit_log — TIDAK ada jalan pintas yang melewati keduanya. */
  async function pasienBuatMassal(baris) {
    const { data, error } = await sb.from('pasien').insert(baris)
      .select('id,no_rm,nama,tanggal_lahir,jenis_kelamin,nik,no_bpjs');
    if (error) throw error; return data || [];
  }

  /* --------------------- Kronis: pemantauan (Tahap 2) ------------------- */
  async function kronisPantauObat() {
    const { data, error } = await sb.from('v_kronis_obat_bulan_ini')
      .select('*').order('bulan_tertinggal', { ascending: false }).order('nama');
    if (error) throw error; return data;
  }

  async function kronisPantauLab() {
    const { data, error } = await sb.from('v_kronis_lab_jadwal')
      .select('*').order('hari_lewat_jadwal', { ascending: false }).order('nama');
    if (error) throw error; return data;
  }

  async function kronisPantauStatin() {
    const { data, error } = await sb.from('v_kronis_statin')
      .select('*').order('nama');
    if (error) throw error; return data;
  }

  async function kronisTelponH1() {
    const { data, error } = await sb.from('v_kronis_telpon_h1').select('*');
    if (error) throw error; return data;
  }

  /* Buku kronis pasien tertentu — dipakai halaman periksa & apotek.
     null (bukan galat) bila pasien tidak/belum terdaftar. */
  async function kronisPasien(pasienId) {
    const { data, error } = await sb.from('v_kronis_pasien')
      .select('*').eq('pasien_id', pasienId).maybeSingle();
    if (error) throw error; return data;
  }

  async function kronisStatinPasien(pasienId) {
    const { data, error } = await sb.from('v_kronis_statin')
      .select('*').eq('pasien_id', pasienId).maybeSingle();
    if (error) throw error; return data;
  }

  async function kronisUsulanDiagnosa(pasienId, kodeIcd10) {
    const { data, error } = await sb.rpc('kronis_usulan_diagnosa',
      { p_pasien_id: pasienId, p_kode_icd10: kodeIcd10 });
    if (error) throw error; return data || [];
  }

  async function kronisDaftarSimpan(p) {
    const { data, error } = await sb.rpc('kronis_daftar_simpan', {
      p_pasien_id: p.pasienId, p_diagnosa: p.diagnosa, p_obat: p.obat || [],
      p_statin_kunci: p.statinKunci || null, p_statin_obat_id: p.statinObatId || null,
      p_statin_nama: p.statinNama || null, p_statin_tgl_lab: p.statinTglLab || null,
      p_catatan: p.catatan || null
    });
    if (error) throw error; return data;
  }

  async function kronisTerapiSelesai(terapiId, alasan = null) {
    const { error } = await sb.rpc('kronis_terapi_selesai',
      { p_terapi_id: terapiId, p_alasan: alasan });
    if (error) throw error;
  }

  /* Peringatan H-3 (pengambilan obat kronis terlalu cepat). null = pasien
     ini tidak terdaftar di buku kronis — bukan galat, apotek/periksa cukup
     diam saja dalam keadaan itu. */
  async function kronisH3Cek(pasienId) {
    const { data, error } = await sb.rpc('kronis_h3_cek', { p_pasien_id: pasienId });
    if (error) throw error; return data;
  }

  /* ========================= LAPORAN — TAHAP 3 =========================
     Seluruhnya lewat ambilSemua(): rentang setahun bisa gampang menembus
     1000 baris bawaan PostgREST, dan laporan yang diam-diam terpotong
     tanpa galat apa pun adalah kelas kesalahan yang paling berbahaya —
     angkanya tetap tampil, hanya saja salah. */

  /* Baris mentah untuk Overview, tren, heatmap jam, dan rekap per dokter
     — seluruhnya dihitung di js/laporan_core.js dari kolom-kolom ini.
     Dioptimalkan: gunakan v_laporan_kunjungan_lean atau kueri langsung ke tabel kunjungan,
     bebas dari correlated subquery diagnosa v_riwayat_kunjungan agar tidak timeout. */
  async function laporanKunjunganRentang({ dari, sampai }) {
    // 1. Coba view ramping v_laporan_kunjungan_lean (bebas subquery diagnosa)
    try {
      const { data, error } = await sb.from('v_laporan_kunjungan_lean')
        .select('tanggal,jenis_poli,cara_bayar,jenis_kunjungan,jam_daftar,nama_dokter,dokter_id')
        .gte('tanggal', dari).lte('tanggal', sampai)
        .order('tanggal', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) return data;
    } catch (e) {}

    // 2. Fallback kueri langsung ke tabel kunjungan + relasi dokter & poli
    try {
      const { data, error } = await sb.from('kunjungan')
        .select('id, tanggal, cara_bayar, jenis_kunjungan, waktu_daftar, dokter_id, dokter:dokter_id(nama), poli:poli_id(jenis)')
        .gte('tanggal', dari).lte('tanggal', sampai)
        .order('tanggal', { ascending: false });
      if (!error && Array.isArray(data)) {
        return data.map(k => {
          let jam = 8;
          if (k.waktu_daftar) {
            try { jam = new Date(k.waktu_daftar).getHours(); } catch(err) {}
          }
          return {
            tanggal: k.tanggal,
            cara_bayar: k.cara_bayar,
            jenis_kunjungan: k.jenis_kunjungan,
            jenis_poli: k.poli?.jenis || 'LAB',
            dokter_id: k.dokter_id,
            nama_dokter: k.dokter?.nama || 'APS (Atas Permintaan Sendiri)',
            jam_daftar: jam
          };
        });
      }
    } catch (e2) {}

    // 3. Fallback akhir ke view lama jika diperlukan
    return await ambilSemua(() =>
      sb.from('v_riwayat_kunjungan')
        .select('tanggal,jenis_poli,cara_bayar,jenis_kunjungan,jam_daftar,nama_dokter,dokter_id')
        .gte('tanggal', dari).lte('tanggal', sampai));
  }

  /* Ringkasan kunjungan untuk Tab Ringkasan (hanya id, tanggal, cara_bayar).
     Mencegah pengambilan seluruh kolom dan subquery diagnosa yang menyebabkan timeout. */
  async function laporanKunjunganRingkas({ dari, sampai }) {
    const { data, error } = await sb.from('kunjungan')
      .select('id, tanggal, cara_bayar')
      .gte('tanggal', dari).lte('tanggal', sampai);
    if (error) throw error;
    return data || [];
  }

  /* Ringkasan permintaan lab untuk Tab Ringkasan (status, cara_bayar, jml_pemeriksaan).
     Mencegah perulangan 4 subquery lab_hasil per baris di v_lab_antrean. */
  async function laporanPermintaanLabRingkas({ dari, sampai }) {
    try {
      const { data, error } = await sb.from('v_lab_permintaan_lean')
        .select('id, tanggal, status, cara_bayar, nama_dokter, jml_pemeriksaan, ada_fisik, jml_fisik')
        .gte('tanggal', dari).lte('tanggal', sampai);
      if (!error && Array.isArray(data) && data.length > 0) return data;
    } catch (e) {}

    try {
      const { data, error } = await sb.from('lab_permintaan')
        .select('id, tanggal, status, kunjungan:kunjungan_id(cara_bayar, dokter:dokter_id(nama)), lab_fisik(item_id, hasil)')
        .gte('tanggal', dari).lte('tanggal', sampai);
      if (!error && Array.isArray(data)) {
        return data.map(lp => {
          const hasFisik = Array.isArray(lp.lab_fisik) && lp.lab_fisik.some(f => f.hasil && f.hasil !== '' && f.hasil !== '-');
          return {
            id: lp.id,
            tanggal: lp.tanggal,
            status: lp.status,
            cara_bayar: lp.kunjungan?.cara_bayar || 'UMUM',
            nama_dokter: lp.kunjungan?.dokter?.nama || 'APS (Atas Permintaan Sendiri)',
            jml_pemeriksaan: 1 + (hasFisik ? 1 : 0),
            ada_fisik: hasFisik,
            jml_fisik: hasFisik ? lp.lab_fisik.filter(f => f.hasil && f.hasil !== '' && f.hasil !== '-').length : 0
          };
        });
      }
    } catch (e2) {}

    return await labAntrean(dari, sampai);
  }

  async function laporanRujukan({ dari, sampai }) {
    return await ambilSemua(() =>
      sb.from('v_laporan_rujukan').select('*')
        .gte('tanggal', dari).lte('tanggal', sampai)
        .order('tanggal', { ascending: false }));
  }

  async function laporanKeuanganTagihan({ dari, sampai }) {
    return await ambilSemua(() =>
      sb.from('v_laporan_keuangan_tagihan').select('*')
        .gte('tanggal', dari).lte('tanggal', sampai));
  }

  async function laporanKeuanganPembayaran({ dari, sampai }) {
    return await ambilSemua(() =>
      sb.from('v_laporan_keuangan_pembayaran').select('*')
        .gte('tanggal', dari).lte('tanggal', sampai));
  }

  /* Aktivitas & produktivitas karyawan laboratorium secara lengkap:
     Pendaftaran, Verifikasi Lab, Pembuatan Surat, dan Kasir beserta timestamp jam lengkap. */
  async function laporanKaryawanAktivitas({ dari, sampai }) {
    const [pegawai, kunjungan, lab, surat, kasir] = await Promise.all([
      sb.from('pegawai').select('id, nama, peran, aktif').or('peran.eq.karyawan,nama.ilike.%DEDE%').order('nama').then(r => r.data || []),
      ambilSemua(() =>
        sb.from('kunjungan')
          .select('id, no_kunjungan, tanggal, waktu_daftar, created_at, created_by, status, cara_bayar, pasien:pasien_id(id, no_rm, nama)')
          .gte('tanggal', dari).lte('tanggal', sampai)),
      ambilSemua(() =>
        sb.from('lab_permintaan')
          .select('id, no_lab, tanggal, waktu_selesai, selesai_oleh, status, catatan_klinis, pasien:pasien_id(id, no_rm, nama)')
          .gte('tanggal', dari).lte('tanggal', sampai)
          .not('selesai_oleh', 'is', null)),
      ambilSemua(() =>
        sb.from('surat')
          .select('id, nomor_surat, tanggal_surat, dibuat_oleh, dibuat_pada, perihal, jenis_kode, status, pasien:pasien_id(id, no_rm, nama)')
          .gte('tanggal_surat', dari).lte('tanggal_surat', sampai)),
      ambilSemua(() =>
        sb.from('kasir_pembayaran')
          .select('id, jumlah, metode, tanggal, created_at, dibuat_oleh, tagihan:tagihan_id(nomor, pasien:pasien_id(id, no_rm, nama))')
          .gte('tanggal', dari).lte('tanggal', sampai))
    ]);

    return {
      pegawai: pegawai || [],
      kunjungan: kunjungan || [],
      lab: lab || [],
      surat: surat || [],
      kasir: kasir || []
    };
  }

  /* Register Poli Umum/Gigi berbagi sumber yang sama dengan Riwayat
     Kunjungan (v_riwayat_kunjungan) — bedanya cuma filter jenis_poli
     dan kolom identitas pasien yang ikut ditampilkan di sini. */
  async function laporanRegisterPoli({ dari, sampai, jenisPoli }) {
    const rows = await ambilSemua(() => {
      let q = sb.from('v_riwayat_kunjungan').select('*')
        .gte('tanggal', dari).lte('tanggal', sampai);
      if (jenisPoli) q = q.eq('jenis_poli', jenisPoli);
      return q;
    });

    // Deteksi ada_fisik jika kolom belum ada di view
    try {
      if (rows && rows.length && rows[0].ada_fisik === undefined) {
        const kunjunganIds = rows.map(r => r.id);
        const { data: fisikRows } = await sb.from('lab_permintaan')
          .select('kunjungan_id, lab_fisik!inner(id, hasil)')
          .in('kunjungan_id', kunjunganIds)
          .neq('status', 'BATAL');
        if (fisikRows && fisikRows.length) {
          const adaFisikSet = new Set();
          fisikRows.forEach(f => {
            if (Array.isArray(f.lab_fisik) && f.lab_fisik.some(x => x.hasil && x.hasil !== '' && x.hasil !== '-')) {
              adaFisikSet.add(f.kunjungan_id);
            }
          });
          rows.forEach(r => {
            r.ada_fisik = adaFisikSet.has(r.id);
          });
        }
      }
    } catch (eFisik) {}

    return rows;
  }

  /* Tindakan (ICD-9-CM) untuk sekumpulan kunjungan sekaligus — dipakai
     Register Poli Gigi menambahkan kolom "Tindakan" tanpa query per
     baris. `idKunjungan` boleh kosong (mengembalikan array kosong,
     bukan seluruh tabel — PostgREST membaca `.in('col', [])` sebagai
     "tidak ada satu pun yang cocok", tapi diperiksa di sini juga supaya
     jelas dan tidak bergantung ke perilaku itu). */
  async function laporanTindakanUntukKunjungan(idKunjungan) {
    if (!idKunjungan || !idKunjungan.length) return [];
    const { data, error } = await sb.from('v_tindakan_kunjungan')
      .select('kunjungan_id,kode_icd9,nama,fdi,jumlah')
      .in('kunjungan_id', idKunjungan);
    if (error) throw error; return data;
  }

  /* Baris mentah untuk rekap Puskesmas: satu baris per diagnosa, dengan
     tanggal kunjungan + usia & jenis kelamin pasien saat itu — bukan
     usia sekarang. Bentuk PostgREST bersarang (kunjungan.pasien) sengaja
     diratakan di sini, supaya laporan_core.js tidak perlu tahu bentuk
     query-nya (pola yang sama dengan diagnosaTeratas() di atas). */
  async function laporanDiagnosaPuskesmas({ dari, sampai }) {
    const rows = await ambilSemua(() =>
      sb.from('diagnosa')
        .select('kode_icd10,nama,kunjungan!inner(tanggal,pasien:pasien_id(tanggal_lahir,jenis_kelamin))')
        .gte('kunjungan.tanggal', dari).lte('kunjungan.tanggal', sampai));
    return rows.map(d => ({
      kode_icd10: d.kode_icd10,
      nama: d.nama,
      tanggal: d.kunjungan && d.kunjungan.tanggal,
      tanggal_lahir: d.kunjungan && d.kunjungan.pasien && d.kunjungan.pasien.tanggal_lahir,
      jenis_kelamin: d.kunjungan && d.kunjungan.pasien && d.kunjungan.pasien.jenis_kelamin
    }));
  }

  /* ========================= HRIS & INVENTORY ========================== */

  /* --- Absensi & Geofencing Multi-Lokasi --- */
  const FASKES_PURBALINGGA_DEFAULT = [
    { id: 'lab-pusat', nama: 'Laboratorium Medis Utama (Pusat)', alamat: 'Jl. D.I. Panjaitan No.94, Purbalingga Lor, Purbalingga', latitude: -7.3864160, longitude: 109.3659890, radius_meter: 150, tipe: 'LAB', aktif: true },
    { id: 'pusk-pbg', nama: 'Puskesmas Purbalingga', alamat: 'Jl. Jend. Soedirman No. 165, Purbalingga', latitude: -7.3895000, longitude: 109.3615000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-bojong', nama: 'Puskesmas Bojong', alamat: 'Jl. Letjen S. Parman No. 2, Bojong, Purbalingga', latitude: -7.4042000, longitude: 109.3668000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-kalimanah', nama: 'Puskesmas Kalimanah', alamat: 'Jl. Mayjen Sungkono, Selabaya, Kalimanah', latitude: -7.4025000, longitude: 109.3362000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-padamara', nama: 'Puskesmas Padamara', alamat: 'Jl. Raya Padamara, Padamara, Purbalingga', latitude: -7.3789000, longitude: 109.3245000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-kutasari', nama: 'Puskesmas Kutasari', alamat: 'Jl. Raya Kutasari No. 1, Kutasari, Purbalingga', latitude: -7.3621000, longitude: 109.3378000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-karangcegak', nama: 'Puskesmas Karangcegak', alamat: 'Desa Karangcegak, Kec. Kutasari, Purbalingga', latitude: -7.3480000, longitude: 109.3210000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-bojongsari', nama: 'Puskesmas Bojongsari', alamat: 'Jl. Raya Bojongsari, Bojongsari, Purbalingga', latitude: -7.3524000, longitude: 109.3652000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-mrebet', nama: 'Puskesmas Mrebet', alamat: 'Jl. Raya Mangunnegara, Mrebet, Purbalingga', latitude: -7.3315000, longitude: 109.3551000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-bobotsari', nama: 'Puskesmas Bobotsari', alamat: 'Jl. Kolonel Sugiri, Bobotsari, Purbalingga', latitude: -7.3056000, longitude: 109.3784000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-karangreja', nama: 'Puskesmas Karangreja', alamat: 'Jl. Raya Karangreja, Karangreja, Purbalingga', latitude: -7.2625000, longitude: 109.3289000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-serang', nama: 'Puskesmas Serang', alamat: 'Desa Serang, Kec. Karangreja, Purbalingga', latitude: -7.2415000, longitude: 109.2882000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-karanganyar', nama: 'Puskesmas Karanganyar', alamat: 'Jl. Raya Karanganyar, Karanganyar, Purbalingga', latitude: -7.3182000, longitude: 109.4312000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-kertanegara', nama: 'Puskesmas Kertanegara', alamat: 'Jl. Raya Kertanegara, Kertanegara, Purbalingga', latitude: -7.3087000, longitude: 109.4678000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-karangmoncol', nama: 'Puskesmas Karangmoncol', alamat: 'Jl. Raya Karangmoncol, Pekiringan, Karangmoncol', latitude: -7.2912000, longitude: 109.4895000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-rembang', nama: 'Puskesmas Rembang', alamat: 'Jl. Raya Bantarbarang, Rembang, Purbalingga', latitude: -7.2885000, longitude: 109.5281000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-kaligondang', nama: 'Puskesmas Kaligondang', alamat: 'Jl. Raya Kaligondang, Kaligondang, Purbalingga', latitude: -7.3882000, longitude: 109.4185000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-pengadegan', nama: 'Puskesmas Pengadegan', alamat: 'Jl. Raya Pengadegan, Pengadegan, Purbalingga', latitude: -7.3712000, longitude: 109.4821000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-kejobong', nama: 'Puskesmas Kejobong', alamat: 'Jl. Raya Kejobong, Kejobong, Purbalingga', latitude: -7.4125000, longitude: 109.4985000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-bukateja', nama: 'Puskesmas Bukateja', alamat: 'Jl. Raya Purwandaru, Bukateja, Purbalingga', latitude: -7.4412000, longitude: 109.4325000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-kutawis', nama: 'Puskesmas Kutawis', alamat: 'Desa Kutawis, Kec. Bukateja, Purbalingga', latitude: -7.4285000, longitude: 109.4562000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-kemangkon', nama: 'Puskesmas Kemangkon', alamat: 'Jl. Raya Panican, Kemangkon, Purbalingga', latitude: -7.4582000, longitude: 109.3782000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'pusk-karangjambe', nama: 'Puskesmas Karangjambe', alamat: 'Desa Karangjambe, Kec. Kemangkon, Purbalingga', latitude: -7.4395000, longitude: 109.3512000, radius_meter: 250, tipe: 'PUSKESMAS', aktif: true },
    { id: 'rs-goeteng', nama: 'RSUD dr. R. Goeteng Taroenadibrata', alamat: 'Jl. Tentara Pelajar No.22, Kembaran Kulon, Purbalingga', latitude: -7.3948000, longitude: 109.3565000, radius_meter: 300, tipe: 'RS', aktif: true },
    { id: 'rs-harapan-ibu', nama: 'RS Harapan Ibu Purbalingga', alamat: 'Jl. Mayjen Soengkono KM.1, Blater, Kalimanah', latitude: -7.4082000, longitude: 109.3495000, radius_meter: 300, tipe: 'RS', aktif: true },
    { id: 'rs-pku-bobotsari', nama: 'RS PKU Muhammadiyah Bobotsari', alamat: 'Jl. Raya Bobotsari, Bobotsari, Purbalingga', latitude: -7.3025000, longitude: 109.3812000, radius_meter: 300, tipe: 'RS', aktif: true },
    { id: 'rs-nirmala', nama: 'RSU Nirmala Purbalingga', alamat: 'Jl. Mayjen Sungkono, Kalimanah, Purbalingga', latitude: -7.4015000, longitude: 109.3452000, radius_meter: 300, tipe: 'RS', aktif: true }
  ];

  async function daftarMasterLokasi(hanyaAktif = false) {
    try {
      let q = sb.from('master_lokasi_absensi').select('*').order('nama');
      if (hanyaAktif) q = q.eq('aktif', true);
      const { data, error } = await q;
      if (!error && data && data.length >= 10) {
        data.forEach(l => {
          if (l.tipe === 'LAB' || (l.nama || '').toLowerCase().includes('laboratorium medis utama')) {
            l.latitude = -7.3864160;
            l.longitude = 109.3659890;
            l.alamat = 'Jl. D.I. Panjaitan No.94, Purbalingga Lor, Purbalingga';
          }
        });
        return data;
      }
      if (!error && data && data.length > 0) {
        // Gabungkan lokasi kustom dengan data puskesmas bawaan
        const namaAda = new Set(data.map(d => d.nama.toLowerCase()));
        const gabungan = [...data];
        FASKES_PURBALINGGA_DEFAULT.forEach(f => {
          if (!namaAda.has(f.nama.toLowerCase())) {
            gabungan.push(f);
          }
        });
        gabungan.forEach(l => {
          if (l.tipe === 'LAB' || (l.nama || '').toLowerCase().includes('laboratorium medis utama')) {
            l.latitude = -7.3864160;
            l.longitude = 109.3659890;
            l.alamat = 'Jl. D.I. Panjaitan No.94, Purbalingga Lor, Purbalingga';
          }
        });
        return gabungan;
      }
    } catch (e) {
      console.warn('daftarMasterLokasi query fallback:', e);
    }
    return FASKES_PURBALINGGA_DEFAULT;
  }

  async function simpanMasterLokasi(rec, id = null) {
    const q = id ? sb.from('master_lokasi_absensi').update(rec).eq('id', id).select().single()
                 : sb.from('master_lokasi_absensi').insert(rec).select().single();
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  async function hapusMasterLokasi(id) {
    const { error } = await sb.from('master_lokasi_absensi').delete().eq('id', id);
    if (error) throw error; return true;
  }

  /* --- Pengaturan Jam Kerja Kantor & 2 Shift Operasional --- */
  async function pengaturanJamKerja() {
    try {
      const { data, error } = await sb.from('pengaturan_absensi').select('*').eq('id', 1).maybeSingle();
      if (!error && data) {
        return {
          id: 1,
          jam_masuk: data.shift1_masuk || data.jam_masuk || '07:30',
          jam_pulang: data.shift1_pulang || data.jam_pulang || '14:30',
          toleransi_keterlambatan_menit: data.shift1_toleransi ?? data.toleransi_keterlambatan_menit ?? 15,
          shift1_masuk: data.shift1_masuk || data.jam_masuk || '07:30',
          shift1_pulang: data.shift1_pulang || data.jam_pulang || '14:30',
          shift1_toleransi: data.shift1_toleransi ?? data.toleransi_keterlambatan_menit ?? 15,
          shift2_masuk: data.shift2_masuk || '14:00',
          shift2_pulang: data.shift2_pulang || '21:00',
          shift2_toleransi: data.shift2_toleransi ?? 15,
          tarif_uang_makan: data.tarif_uang_makan ?? 20000
        };
      }
    } catch (e) {
      console.warn('pengaturan_absensi query fallback:', e);
    }

    try {
      const lokal = localStorage.getItem('lab_pengaturan_jam_kerja');
      if (lokal) {
        const p = JSON.parse(lokal);
        return {
          id: 1,
          jam_masuk: p.shift1_masuk || p.jam_masuk || '07:30',
          jam_pulang: p.shift1_pulang || p.jam_pulang || '14:30',
          toleransi_keterlambatan_menit: p.shift1_toleransi ?? p.toleransi_keterlambatan_menit ?? 15,
          shift1_masuk: p.shift1_masuk || p.jam_masuk || '07:30',
          shift1_pulang: p.shift1_pulang || p.jam_pulang || '14:30',
          shift1_toleransi: p.shift1_toleransi ?? p.toleransi_keterlambatan_menit ?? 15,
          shift2_masuk: p.shift2_masuk || '14:00',
          shift2_pulang: p.shift2_pulang || '21:00',
          shift2_toleransi: p.shift2_toleransi ?? 15,
          tarif_uang_makan: p.tarif_uang_makan ?? 20000
        };
      }
    } catch (e) {}

    return {
      id: 1,
      jam_masuk: '07:30',
      jam_pulang: '14:30',
      toleransi_keterlambatan_menit: 15,
      shift1_masuk: '07:30',
      shift1_pulang: '14:30',
      shift1_toleransi: 15,
      shift2_masuk: '14:00',
      shift2_pulang: '21:00',
      shift2_toleransi: 15,
      tarif_uang_makan: 20000
    };
  }

  async function simpanPengaturanJamKerja(rec) {
    const shift1_masuk = rec.shift1_masuk || rec.jam_masuk || '07:30';
    const shift1_pulang = rec.shift1_pulang || rec.jam_pulang || '14:30';
    const shift1_toleransi = parseInt(rec.shift1_toleransi ?? rec.toleransi_keterlambatan_menit, 10) || 0;
    const shift2_masuk = rec.shift2_masuk || '14:00';
    const shift2_pulang = rec.shift2_pulang || '21:00';
    const shift2_toleransi = parseInt(rec.shift2_toleransi, 10) || 0;
    const tarif_uang_makan = parseInt(rec.tarif_uang_makan, 10) || 20000;

    const payload = {
      id: 1,
      jam_masuk: shift1_masuk,
      jam_pulang: shift1_pulang,
      toleransi_keterlambatan_menit: shift1_toleransi,
      shift1_masuk,
      shift1_pulang,
      shift1_toleransi,
      shift2_masuk,
      shift2_pulang,
      shift2_toleransi,
      tarif_uang_makan,
      updated_at: new Date().toISOString()
    };

    try {
      localStorage.setItem('lab_pengaturan_jam_kerja', JSON.stringify(payload));
    } catch (e) {}

    // 1. Coba upsert dengan kolom 2 shift dan tarif uang makan lengkap
    try {
      const { data, error } = await sb.from('pengaturan_absensi').upsert(payload).select().single();
      if (!error && data) return Object.assign({}, payload, data);
    } catch (e) {
      console.warn('Upsert tarif_uang_makan pengaturan_absensi fallback:', e);
    }

    // 2. Fallback upsert kolom tanpa tarif_uang_makan jika migrasi 64 belum dijalankan
    try {
      const payloadTanpaMakan = { ...payload };
      delete payloadTanpaMakan.tarif_uang_makan;
      const { data, error } = await sb.from('pengaturan_absensi').upsert(payloadTanpaMakan).select().single();
      if (!error && data) return Object.assign({}, payload, data);
    } catch (e) {}

    // 3. Fallback upsert kolom standar jika migrasi DB 63 belum dijalankan
    try {
      const fallbackPayload = {
        id: 1,
        jam_masuk: shift1_masuk,
        jam_pulang: shift1_pulang,
        toleransi_keterlambatan_menit: shift1_toleransi,
        updated_at: new Date().toISOString()
      };
      await sb.from('pengaturan_absensi').upsert(fallbackPayload);
    } catch (e) {
      console.warn('Tabel pengaturan_absensi Supabase fallback:', e);
    }

    return payload;
  }

  /* --- Pengaturan Tarif Insentif Kontribusi Sistem (Aktivitas Karyawan) --- */
  async function pengaturanInsentifAktivitas() {
    const defaultTarif = {
      tarif_lab: 4000,          // Rp 4.000 / validasi hasil lab
      tarif_pendaftaran: 2000,  // Rp 2.000 / pendaftaran pasien
      tarif_surat: 2500,        // Rp 2.500 / pembuatan surat
      tarif_kasir: 1000         // Rp 1.000 / transaksi pembayaran kasir
    };

    try {
      const { data, error } = await sb.from('pengaturan_absensi').select('*').eq('id', 1).maybeSingle();
      if (!error && data && data.tarif_insentif_lab !== undefined) {
        return {
          tarif_lab: data.tarif_insentif_lab ?? defaultTarif.tarif_lab,
          tarif_pendaftaran: data.tarif_insentif_pendaftaran ?? defaultTarif.tarif_pendaftaran,
          tarif_surat: data.tarif_insentif_surat ?? defaultTarif.tarif_surat,
          tarif_kasir: data.tarif_insentif_kasir ?? defaultTarif.tarif_kasir
        };
      }
    } catch (e) {}

    try {
      const lokal = localStorage.getItem('lab_tarif_insentif_aktivitas');
      if (lokal) {
        const parsed = JSON.parse(lokal);
        return { ...defaultTarif, ...parsed };
      }
    } catch (e) {}

    return defaultTarif;
  }

  async function simpanPengaturanInsentifAktivitas(tarif) {
    const payload = {
      tarif_lab: Number(tarif.tarif_lab) || 0,
      tarif_pendaftaran: Number(tarif.tarif_pendaftaran) || 0,
      tarif_surat: Number(tarif.tarif_surat) || 0,
      tarif_kasir: Number(tarif.tarif_kasir) || 0,
      updated_at: new Date().toISOString()
    };

    try {
      localStorage.setItem('lab_tarif_insentif_aktivitas', JSON.stringify(payload));
    } catch (e) {}

    try {
      await sb.from('pengaturan_absensi').update({
        tarif_insentif_lab: payload.tarif_lab,
        tarif_insentif_pendaftaran: payload.tarif_pendaftaran,
        tarif_insentif_surat: payload.tarif_surat,
        tarif_insentif_kasir: payload.tarif_kasir
      }).eq('id', 1);
    } catch (e) {}

    return payload;
  }

  async function absensiPegawai(pegawaiId, dari, sampai) {
    const { data, error } = await sb.from('pegawai_absensi').select('*')
      .eq('pegawai_id', pegawaiId)
      .gte('tanggal', dari).lte('tanggal', sampai).order('tanggal', { ascending: false });
    if (error) throw error; return data;
  }

  async function absensiHariIni(shift = null) {
    const hari = UI.hariIni();
    let shiftCari = shift;
    if (!shiftCari && _saya?.id) {
      try {
        const stored = localStorage.getItem(`jadwal_shift_${hari}_${_saya.id}`);
        if (stored) shiftCari = parseInt(stored, 10);
      } catch (e) {}
    }

    if (shiftCari) {
      try {
        const { data, error } = await sb.from('pegawai_absensi').select('*')
          .eq('pegawai_id', _saya?.id).eq('tanggal', hari).eq('shift', parseInt(shiftCari, 10))
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!error && data) return data;
      } catch (e) {}
    }

    const { data, error } = await sb.from('pegawai_absensi').select('*')
      .eq('pegawai_id', _saya?.id).eq('tanggal', hari).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error; return data;
  }

  async function absensiMasuk(keterangan = null, lokasi = null, meta = {}) {
    const hari = UI.hariIni();
    const shiftNomor = meta.shift ? parseInt(meta.shift, 10) : 1;
    const payloadLengkap = {
      pegawai_id: _saya?.id,
      tanggal: hari,
      shift: shiftNomor,
      waktu_masuk: new Date().toISOString(),
      status: 'HADIR',
      keterangan,
      lokasi_masuk: lokasi,
      tipe_lokasi_masuk: meta.tipe || null,
      lat_masuk: meta.lat || null,
      lng_masuk: meta.lng || null
    };

    // 0. Cek apakah ada jadwal shift awal dari Master (belum ada waktu_masuk)
    try {
      const { data: recJadwal } = await sb.from('pegawai_absensi')
        .select('id, shift, waktu_masuk')
        .eq('pegawai_id', _saya?.id)
        .eq('tanggal', hari)
        .is('waktu_masuk', null)
        .maybeSingle();

      if (recJadwal) {
        const { data, error } = await sb.from('pegawai_absensi').update(payloadLengkap)
          .eq('id', recJadwal.id).select().single();
        if (!error && data) return data;
      }
    } catch (e) {}

    try {
      const { data, error } = await sb.from('pegawai_absensi').insert(payloadLengkap).select().single();
      if (!error && data) return data;
    } catch (e) {}

    // Fallback jika kolom shift belum dimigrasi di Supabase
    try {
      const { data, error } = await sb.from('pegawai_absensi').insert({
        pegawai_id: _saya?.id,
        tanggal: hari,
        waktu_masuk: new Date().toISOString(),
        status: 'HADIR',
        keterangan,
        lokasi_masuk: lokasi,
        tipe_lokasi_masuk: meta.tipe || null,
        lat_masuk: meta.lat || null,
        lng_masuk: meta.lng || null
      }).select().single();
      if (!error && data) return data;
    } catch (e) {}

    // Fallback minimal
    const { data, error } = await sb.from('pegawai_absensi').insert({
      pegawai_id: _saya?.id,
      tanggal: hari,
      waktu_masuk: new Date().toISOString(),
      status: 'HADIR',
      keterangan,
      lokasi_masuk: lokasi
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function absensiKeluar(id, keterangan = null, lokasi = null, meta = {}) {
    const payloadLengkap = {
      waktu_keluar: new Date().toISOString(),
      keterangan,
      lokasi_keluar: lokasi,
      tipe_lokasi_keluar: meta.tipe || null,
      lat_keluar: meta.lat || null,
      lng_keluar: meta.lng || null
    };

    try {
      const { data, error } = await sb.from('pegawai_absensi').update(payloadLengkap).eq('id', id).select().single();
      if (!error && data) return data;
    } catch (e) {}

    // Fallback jika kolom baru belum dimigrasi di Supabase
    const { data, error } = await sb.from('pegawai_absensi').update({
      waktu_keluar: new Date().toISOString(),
      keterangan,
      lokasi_keluar: lokasi
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function absensiLaporan(dari, sampai) {
    return await ambilSemua(() =>
      sb.from('pegawai_absensi').select('*, pegawai:pegawai_id(nama,peran)')
        .gte('tanggal', dari).lte('tanggal', sampai).order('tanggal', { ascending: false })
    );
  }

  async function absensiSemuaHariIni(tanggal = null) {
    const tgl = tanggal || UI.hariIni();
    const [semuaPegawai, semuaAbsensi] = await Promise.all([
      daftarPegawai(),
      sb.from('pegawai_absensi').select('*').eq('tanggal', tgl).order('shift', { ascending: true })
    ]);
    if (semuaAbsensi.error) throw semuaAbsensi.error;

    // Kelompokkan data absensi per pegawai_id
    const absensiPerPegawai = new Map();
    (semuaAbsensi.data || []).forEach(a => {
      const arr = absensiPerPegawai.get(a.pegawai_id) || [];
      arr.push(a);
      absensiPerPegawai.set(a.pegawai_id, arr);
    });

    // Master bebas absensi (pemilik lab/pimpinan faskes).
    // Sesuai SOP sistem: HANYA staf dengan peran 'karyawan' yang masuk dalam daftar & pemantauan absensi.
    // Peran lain (admin loket, kasir, apoteker, perawat, dokter rujukan) tidak dimasukkan dalam absensi harian.
    const hasil = [];
    (semuaPegawai || []).forEach(p => {
      if (!p.aktif) return;
      if (p.peran !== 'karyawan') return;

      const listAbsen = absensiPerPegawai.get(p.id);
      let shiftFallback = 1;
      try {
        const stored = localStorage.getItem(`jadwal_shift_${tgl}_${p.id}`);
        if (stored) shiftFallback = parseInt(stored, 10);
      } catch (e) {}

      if (listAbsen && listAbsen.length > 0) {
        listAbsen.forEach(a => {
          hasil.push({
            pegawai_id: p.id,
            nama: p.nama,
            peran: p.peran,
            tanggal: tgl,
            shift: a.shift || shiftFallback,
            absensi_id: a.id || null,
            waktu_masuk: a.waktu_masuk || null,
            waktu_keluar: a.waktu_keluar || null,
            status: a.status || 'HADIR',
            keterangan: a.keterangan || null,
            lokasi_masuk: a.lokasi_masuk || null,
            lokasi_keluar: a.lokasi_keluar || null,
            lat_masuk: a.lat_masuk || null,
            lng_masuk: a.lng_masuk || null,
            lat_keluar: a.lat_keluar || null,
            lng_keluar: a.lng_keluar || null
          });
        });
      } else {
        hasil.push({
          pegawai_id: p.id,
          nama: p.nama,
          peran: p.peran,
          tanggal: tgl,
          shift: shiftFallback,
          absensi_id: null,
          waktu_masuk: null,
          waktu_keluar: null,
          status: 'BELUM',
          keterangan: null,
          lokasi_masuk: null,
          lokasi_keluar: null,
          lat_masuk: null,
          lng_masuk: null,
          lat_keluar: null,
          lng_keluar: null
        });
      }
    });

    return hasil;
  }

  /* --- Penetapan Shift Karyawan oleh Master --- */
  async function tetapkanShiftKaryawan(pegawaiId, tanggal, shiftNomor) {
    const tgl = tanggal || UI.hariIni();
    const shiftVal = parseInt(shiftNomor, 10) || 1;

    // Simpan selalu ke localStorage sebagai cache sinkron instan
    try {
      localStorage.setItem(`jadwal_shift_${tgl}_${pegawaiId}`, String(shiftVal));
    } catch (e) {}

    // Coba simpan ke database via RPC tetapkan_shift_karyawan jika ada
    try {
      const { data, error } = await sb.rpc('tetapkan_shift_karyawan', {
        p_pegawai_id: pegawaiId,
        p_tanggal: tgl,
        p_shift: shiftVal
      });
      if (!error && data?.ok) return data;
    } catch (e) {}

    // Coba simpan langsung ke tabel pegawai_absensi jika RPC belum aktif
    try {
      const { data: recAda } = await sb.from('pegawai_absensi')
        .select('id, status, waktu_masuk')
        .eq('pegawai_id', pegawaiId)
        .eq('tanggal', tgl)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recAda) {
        const { data, error } = await sb.from('pegawai_absensi').update({
          shift: shiftVal,
          keterangan: 'Shift dijadwalkan oleh Pimpinan'
        }).eq('id', recAda.id).select().single();
        if (!error && data) return data;
      } else {
        const { data, error } = await sb.from('pegawai_absensi').insert({
          pegawai_id: pegawaiId,
          tanggal: tgl,
          shift: shiftVal,
          status: 'BELUM',
          keterangan: 'Shift dijadwalkan oleh Pimpinan'
        }).select().single();
        if (!error && data) return data;
      }
    } catch (e) {
      console.warn('tetapkanShiftKaryawan direct error:', e);
    }

    return { ok: true, shift: shiftVal };
  }

  /* --- Pengajuan Cuti / Izin / Sakit (Tanpa Foto) --- */
  async function daftarIzinSaya() {
    const { data, error } = await sb.from('pegawai_izin').select('*')
      .eq('pegawai_id', _saya?.id).order('created_at', { ascending: false });
    if (error) {
      console.warn('pegawai_izin:', error.message);
      return [];
    }
    return data || [];
  }

  async function ajukanIzin({ jenis, tanggal_mulai, tanggal_selesai, keterangan }) {
    const { data, error } = await sb.from('pegawai_izin').insert({
      pegawai_id: _saya?.id,
      jenis,
      tanggal_mulai,
      tanggal_selesai,
      keterangan,
      status: 'MENUNGGU'
    }).select().single();
    if (error) throw error; return data;
  }

  async function batalkanIzin(id) {
    const { error } = await sb.from('pegawai_izin').delete().eq('id', id).eq('pegawai_id', _saya?.id);
    if (error) throw error; return true;
  }

  async function daftarSemuaIzin(filterStatus = null) {
    let q = sb.from('pegawai_izin').select('*, pegawai:pegawai_id(nama,peran)').order('created_at', { ascending: false });
    if (filterStatus) q = q.eq('status', filterStatus);
    const { data, error } = await q;
    if (error) {
      console.warn('daftarSemuaIzin:', error.message);
      return [];
    }
    return data || [];
  }

  async function setujuiIzin(id, catatan = null) {
    const { data, error } = await sb.rpc('setujui_pegawai_izin', { p_izin_id: id, p_catatan: catatan });
    if (!error) return data;
    
    // Fallback jika stored procedure belum dijalankan
    const { data: izin, error: eIzin } = await sb.from('pegawai_izin')
      .update({ status: 'DISETUJUI', catatan_atasan: catatan, disetujui_oleh: _saya?.id, disetujui_pada: new Date().toISOString() })
      .eq('id', id).select().single();
    if (eIzin) throw eIzin;
    
    try {
      let cur = new Date(izin.tanggal_mulai);
      const end = new Date(izin.tanggal_selesai);
      const statusAbsen = izin.jenis === 'CUTI' ? 'CUTI' : (izin.jenis === 'SAKIT' ? 'SAKIT' : (izin.jenis === 'DINAS_LUAR' ? 'HADIR' : 'IZIN'));
      while (cur <= end) {
        const tglStr = cur.toISOString().split('T')[0];
        await sb.from('pegawai_absensi').upsert({
          pegawai_id: izin.pegawai_id,
          tanggal: tglStr,
          status: statusAbsen,
          keterangan: `${izin.jenis}: ${izin.keterangan}`
        }, { onConflict: 'pegawai_id,tanggal' });
        cur.setDate(cur.getDate() + 1);
      }
    } catch (errSync) {
      console.warn('Sinkronisasi absensi gagal:', errSync);
    }
    return izin;
  }

  async function tolakIzin(id, catatan = null) {
    const { data, error } = await sb.rpc('tolak_pegawai_izin', { p_izin_id: id, p_catatan: catatan });
    if (!error) return data;
    const { data: izin, error: eIzin } = await sb.from('pegawai_izin')
      .update({ status: 'DITOLAK', catatan_atasan: catatan, disetujui_oleh: _saya?.id, disetujui_pada: new Date().toISOString() })
      .eq('id', id).select().single();
    if (eIzin) throw eIzin;
    return izin;
  }

  /* --- KPI & Bonus Karyawan --- */
  async function daftarPegawaiStaff() {
    const list = await daftarPegawai();
    return (list || []).filter(p => p.aktif && (p.peran === 'karyawan' || (p.nama && p.nama.toUpperCase().includes('DEDE'))));
  }

  async function kpiDaftar(bulan, tahun) {
    const { data, error } = await sb.from('pegawai_kpi')
      .select('*, pegawai:pegawai_id(nama,peran)').eq('bulan', bulan).eq('tahun', tahun);
    if (error) throw error; return data;
  }
  async function kpiSimpan(rec, id = null) {
    const q = id ? sb.from('pegawai_kpi').update(rec).eq('id', id).select().single()
                 : sb.from('pegawai_kpi').insert(rec).select().single();
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function kpiHapus(id) {
    const { error } = await sb.from('pegawai_kpi').delete().eq('id', id);
    if (error) throw error; return true;
  }
  async function bonusDaftar(bulan, tahun) {
    try {
      const { data, error } = await sb.from('pegawai_bonus')
        .select('*, pegawai:pegawai_id(*)').eq('bulan', bulan).eq('tahun', tahun);
      if (!error && data) return data;
    } catch (e) {}

    const { data, error } = await sb.from('pegawai_bonus')
      .select('*, pegawai:pegawai_id(nama,peran)').eq('bulan', bulan).eq('tahun', tahun);
    if (error) throw error; return data;
  }
  async function bonusSimpan(rec, id = null) {
    if (!rec.disetujui_oleh && _saya?.id) rec.disetujui_oleh = _saya.id;
    const payload = { ...rec };
    let q = id ? sb.from('pegawai_bonus').update(payload).eq('id', id).select().single()
               : sb.from('pegawai_bonus').insert(payload).select().single();
    let { data, error } = await q;

    // Fallback jika kolom baru belum ada di Supabase
    if (error && error.message) {
      let retry = false;
      const newFields = ['total_gaji_transfer', 'uang_makan', 'hari_uang_makan', 'tarif_uang_makan', 'gaji_pokok'];
      for (const f of newFields) {
        if (error.message.includes(f) && payload[f] !== undefined) {
          delete payload[f];
          retry = true;
        }
      }
      if (retry) {
        q = id ? sb.from('pegawai_bonus').update(payload).eq('id', id).select().single()
               : sb.from('pegawai_bonus').insert(payload).select().single();
        const res = await q;
        data = res.data;
        error = res.error;
      }
    }
    if (error) throw error; return data;
  }
  async function bonusHapus(id) {
    const { error } = await sb.from('pegawai_bonus').delete().eq('id', id);
    if (error) throw error; return true;
  }

  /* --- Rekening Bank Karyawan (Transfer Manual Penggajian) --- */
  async function simpanRekeningPegawai(pegawaiId, bankData) {
    const payload = {
      nama_bank: (bankData.nama_bank || '').trim(),
      nomor_rekening: (bankData.nomor_rekening || '').trim(),
      atas_nama_rekening: (bankData.atas_nama_rekening || '').trim()
    };
    try {
      localStorage.setItem(`lab_rek_${pegawaiId}`, JSON.stringify(payload));
    } catch (e) {}

    try {
      const { data, error } = await sb.from('pegawai').update(payload).eq('id', pegawaiId).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Simpan rekening pegawai ke DB fallback:', e);
    }
    return payload;
  }

  function ambilRekeningPegawaiLokal(pegawaiId) {
    try {
      const val = localStorage.getItem(`lab_rek_${pegawaiId}`);
      if (val) return JSON.parse(val);
    } catch (e) {}
    return null;
  }

  /* --- Tanggal Mulai Bekerja Karyawan (Masa Kerja HRIS) --- */
  async function simpanMulaiKerjaPegawai(pegawaiId, tglMulaiKerja) {
    const payload = {
      tgl_mulai_kerja: tglMulaiKerja || null
    };
    try {
      localStorage.setItem(`lab_mulai_kerja_${pegawaiId}`, JSON.stringify(payload));
    } catch (e) {}

    try {
      const { data, error } = await sb.from('pegawai').update(payload).eq('id', pegawaiId).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Simpan tgl mulai kerja pegawai ke DB fallback:', e);
    }
    return payload;
  }

  function ambilMulaiKerjaPegawaiLokal(pegawaiId) {
    try {
      const val = localStorage.getItem(`lab_mulai_kerja_${pegawaiId}`);
      if (val) return JSON.parse(val);
    } catch (e) {}
    return null;
  }

  /* --- Inkaso (Inventori Umum) --- */
  async function inventoriDaftar(kata = '') {
    let q = sb.from('inventori_barang').select('*').order('nama');
    if (kata && kata.trim().length >= 2) q = q.ilike('nama', `%${kata.trim()}%`);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function inventoriSimpan(rec, id = null) {
    const q = id ? sb.from('inventori_barang').update(rec).eq('id', id).select().single()
                 : sb.from('inventori_barang').insert(rec).select().single();
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function inventoriHapus(id) {
    const { error } = await sb.from('inventori_barang').delete().eq('id', id);
    if (error) throw error;
  }
  
  async function inventoriBatchDaftar(barangId = null) {
    let q = sb.from('inventori_batch')
      .select('*, barang:barang_id(id, nama, kode, purchase_unit, usage_unit, conversion_factor, kategori, stok_sekarang_usage, stok_minimum_usage)')
      .order('expired_date', { ascending: true });
    if (barangId) q = q.eq('barang_id', barangId);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function inventoriBatchSimpan(rec, id = null) {
    const q = id ? sb.from('inventori_batch').update(rec).eq('id', id).select().single()
                 : sb.from('inventori_batch').insert(rec).select().single();
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function inventoriBatchHapus(id) {
    const { error } = await sb.from('inventori_batch').delete().eq('id', id);
    if (error) throw error; return true;
  }
  async function labResepDaftar(labId) {
    const { data, error } = await sb.from('lab_resep')
      .select('*, barang:barang_id(nama,usage_unit)').eq('lab_id', labId);
    if (error) throw error; return data;
  }
  async function labResepSimpan(rec, id = null) {
    const q = id ? sb.from('lab_resep').update(rec).eq('id', id).select().single()
                 : sb.from('lab_resep').insert(rec).select().single();
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function labResepHapus(id) {
    const { error } = await sb.from('lab_resep').delete().eq('id', id);
    if (error) throw error;
  }

  async function inventoriMutasi(rec) {
    // rec harus berisi: barang_id, batch_id (opt), jenis, jumlah_usage, keterangan, referensi (opt)
    rec.dicatat_oleh = _saya?.id;
    const { data, error } = await sb.from('inventori_mutasi').insert(rec).select().single();
    if (error) throw error; return data;
  }
  async function inventoriRiwayat(barangId = null, batas = 100) {
    let q = sb.from('inventori_mutasi')
      .select('*, barang:barang_id(nama,kode), batch:batch_id(batch_number), pegawai:dicatat_oleh(nama)')
      .order('tanggal', { ascending: false }).limit(batas);
    if (barangId) q = q.eq('barang_id', barangId);
    const { data, error } = await q;
    if (error) throw error; return data;
  }

  async function statistikEksekutif() {
    const { data, error } = await sb.rpc('statistik_eksekutif');
    if (error) throw error; return data;
  }

  /* ================= REKANAN LAB ================= */
  async function daftarRekanan() {
    const { data, error } = await sb.from('ref_rekanan').select('*').order('nama');
    if (error) throw error; return data;
  }
  async function simpanRekanan(rec) {
    const { error } = await sb.from('ref_rekanan').upsert(rec);
    if (error) throw error;
  }
  async function hapusRekanan(id) {
    const { error } = await sb.from('ref_rekanan').delete().eq('id', id);
    if (error) throw error;
  }

  /* ================= KALENDER JADWAL ================= */
  async function jadwalMuatBulan(tahun, bulan) {
    let thn, bln;
    if (typeof tahun === 'string' && tahun.includes('-')) {
      const sp = tahun.split('-');
      thn = Number(sp[0]);
      bln = Number(sp[1]);
    } else {
      thn = Number(tahun);
      bln = Number(bulan);
    }
    const blnStr = String(bln).padStart(2, '0');
    const jmlHari = new Date(thn, bln, 0).getDate();
    const tglAwal = `${thn}-${blnStr}-01`;
    const tglAkhir = `${thn}-${blnStr}-${String(jmlHari).padStart(2, '0')}`;

    try {
      const { data, error } = await sb.from('kalender_jadwal')
        .select('*')
        .gte('tanggal', tglAwal)
        .lte('tanggal', tglAkhir)
        .order('tanggal', { ascending: true })
        .order('waktu_mulai', { ascending: true });
      if (!error && Array.isArray(data)) {
        const dinormalisasi = data.map(item => ({
          ...item,
          jam_mulai: item.jam_mulai || item.waktu_mulai,
          jam_selesai: item.jam_selesai || item.waktu_selesai,
          waktu_mulai: item.waktu_mulai || item.jam_mulai,
          waktu_selesai: item.waktu_selesai || item.jam_selesai,
          warna_tag: item.warna_tag || item.warna || '#0d9488',
          warna: item.warna || item.warna_tag || '#0d9488',
          pelaksana: item.pelaksana || item.dibuat_oleh,
          dibuat_oleh: item.dibuat_oleh || item.pelaksana,
          keterangan: item.keterangan || item.deskripsi,
          deskripsi: item.deskripsi || item.keterangan
        }));
        try {
          const lokal = JSON.parse(localStorage.getItem('lmu_kalender_jadwal') || '[]');
          const lokalBulan = lokal.filter(j => j.tanggal >= tglAwal && j.tanggal <= tglAkhir);
          const map = new Map();
          dinormalisasi.forEach(item => map.set(String(item.id), item));
          lokalBulan.forEach(item => {
            if (!map.has(String(item.id))) {
              map.set(String(item.id), {
                ...item,
                jam_mulai: item.jam_mulai || item.waktu_mulai,
                jam_selesai: item.jam_selesai || item.waktu_selesai,
                waktu_mulai: item.waktu_mulai || item.jam_mulai,
                waktu_selesai: item.waktu_selesai || item.jam_selesai,
                warna_tag: item.warna_tag || item.warna || '#0d9488',
                warna: item.warna || item.warna_tag || '#0d9488',
                pelaksana: item.pelaksana || item.dibuat_oleh,
                dibuat_oleh: item.dibuat_oleh || item.pelaksana,
                keterangan: item.keterangan || item.deskripsi,
                deskripsi: item.deskripsi || item.keterangan
              });
            }
          });
          return Array.from(map.values()).sort((a, b) => (a.tanggal + (a.waktu_mulai || a.jam_mulai || '')).localeCompare(b.tanggal + (b.waktu_mulai || b.jam_mulai || '')));
        } catch (_) {
          return dinormalisasi;
        }
      }
      if (error) throw error;
    } catch (err) {
      console.warn('Fallback kalender_jadwal ke localStorage:', err);
      try {
        const lokal = JSON.parse(localStorage.getItem('lmu_kalender_jadwal') || '[]');
        return lokal.filter(j => j.tanggal >= tglAwal && j.tanggal <= tglAkhir)
          .map(item => ({
            ...item,
            jam_mulai: item.jam_mulai || item.waktu_mulai,
            jam_selesai: item.jam_selesai || item.waktu_selesai,
            waktu_mulai: item.waktu_mulai || item.jam_mulai,
            waktu_selesai: item.waktu_selesai || item.jam_selesai,
            warna_tag: item.warna_tag || item.warna || '#0d9488',
            warna: item.warna || item.warna_tag || '#0d9488',
            pelaksana: item.pelaksana || item.dibuat_oleh,
            dibuat_oleh: item.dibuat_oleh || item.pelaksana,
            keterangan: item.keterangan || item.deskripsi,
            deskripsi: item.deskripsi || item.keterangan
          }))
          .sort((a, b) => (a.tanggal + (a.waktu_mulai || a.jam_mulai || '')).localeCompare(b.tanggal + (b.waktu_mulai || b.jam_mulai || '')));
      } catch (_) {
        return [];
      }
    }
  }

  async function jadwalTambah(payload) {
    const rec = {
      judul: payload.judul,
      deskripsi: payload.deskripsi !== undefined ? payload.deskripsi : (payload.keterangan !== undefined ? payload.keterangan : null),
      tanggal: payload.tanggal,
      waktu_mulai: payload.waktu_mulai !== undefined ? payload.waktu_mulai : (payload.jam_mulai !== undefined ? payload.jam_mulai : null),
      waktu_selesai: payload.waktu_selesai !== undefined ? payload.waktu_selesai : (payload.jam_selesai !== undefined ? payload.jam_selesai : null),
      kategori: payload.kategori || 'Umum',
      warna: payload.warna !== undefined ? payload.warna : (payload.warna_tag !== undefined ? payload.warna_tag : '#0d9488'),
      dibuat_oleh: payload.dibuat_oleh !== undefined ? payload.dibuat_oleh : (payload.pelaksana !== undefined ? payload.pelaksana : null),
      created_at: payload.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      const { data, error } = await sb.from('kalender_jadwal').insert(rec).select().single();
      if (!error && data) {
        simpanCadanganLokalJadwal(data);
        return data;
      }
      if (error) throw error;
    } catch (err) {
      console.warn('Simpan kalender_jadwal fallback:', err);
      const dataBaru = {
        ...rec,
        id: payload.id || 'lokal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
      };
      simpanCadanganLokalJadwal(dataBaru);
      return dataBaru;
    }
  }

  async function jadwalUbah(id, payload) {
    const rec = {
      ...payload,
      deskripsi: payload.deskripsi !== undefined ? payload.deskripsi : (payload.keterangan !== undefined ? payload.keterangan : undefined),
      waktu_mulai: payload.waktu_mulai !== undefined ? payload.waktu_mulai : (payload.jam_mulai !== undefined ? payload.jam_mulai : undefined),
      waktu_selesai: payload.waktu_selesai !== undefined ? payload.waktu_selesai : (payload.jam_selesai !== undefined ? payload.jam_selesai : undefined),
      warna: payload.warna !== undefined ? payload.warna : (payload.warna_tag !== undefined ? payload.warna_tag : undefined),
      dibuat_oleh: payload.dibuat_oleh !== undefined ? payload.dibuat_oleh : (payload.pelaksana !== undefined ? payload.pelaksana : undefined),
      updated_at: new Date().toISOString()
    };
    // Bersihkan nilai undefined
    Object.keys(rec).forEach(key => rec[key] === undefined && delete rec[key]);

    try {
      const { data, error } = await sb.from('kalender_jadwal').update(rec).eq('id', id).select().single();
      if (!error && data) {
        updateCadanganLokalJadwal(id, data);
        return data;
      }
      if (error) throw error;
    } catch (err) {
      console.warn('Ubah kalender_jadwal fallback:', err);
      updateCadanganLokalJadwal(id, { ...rec, id });
      return { ...rec, id };
    }
  }

  async function jadwalHapus(id) {
    try {
      const { error } = await sb.from('kalender_jadwal').delete().eq('id', id);
      hapusCadanganLokalJadwal(id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Hapus kalender_jadwal fallback:', err);
      hapusCadanganLokalJadwal(id);
      return true;
    }
  }

  function simpanCadanganLokalJadwal(item) {
    try {
      const list = JSON.parse(localStorage.getItem('lmu_kalender_jadwal') || '[]');
      const idx = list.findIndex(x => String(x.id) === String(item.id));
      if (idx >= 0) list[idx] = item;
      else list.push(item);
      localStorage.setItem('lmu_kalender_jadwal', JSON.stringify(list));
    } catch (_) {}
  }

  function updateCadanganLokalJadwal(id, item) {
    try {
      const list = JSON.parse(localStorage.getItem('lmu_kalender_jadwal') || '[]');
      const idx = list.findIndex(x => String(x.id) === String(id));
      if (idx >= 0) list[idx] = { ...list[idx], ...item };
      else list.push({ ...item, id });
      localStorage.setItem('lmu_kalender_jadwal', JSON.stringify(list));
    } catch (_) {}
  }

  function hapusCadanganLokalJadwal(id) {
    try {
      const list = JSON.parse(localStorage.getItem('lmu_kalender_jadwal') || '[]');
      const baru = list.filter(x => String(x.id) !== String(id));
      localStorage.setItem('lmu_kalender_jadwal', JSON.stringify(baru));
    } catch (_) {}
  }

  return {
    sb, masuk, keluar, sesi, saya, bolehTulis,
    hakAksesSaya, daftarHakAkses, simpanHakAkses,
    faskes, simpanFaskes,
    daftarPoli, daftarDokter, simpanPegawaiDokter, hapusPegawaiDokter, daftarPegawai,
    tambahPengguna, hapusPengguna, resetPasswordPengguna, ubahProfilSaya, adminUbahPengguna,
    cariIcd, cariObat, cariObatJual, daftarSigna,
    cariPasien, daftarPasienLengkap, dataKronisBpjsPasien, pasien, simpanPasien, hapusPasien, alergiPasien, tambahAlergi, hapusAlergi, catatAkses,
    antrianHariIni, daftarKunjungan, buatKunjungan, kunjungan, ubahKunjungan,
    kajian, simpanKajian,
    pemeriksaan, simpanPemeriksaan, finalisasi, tambahAddendum, daftarAddendum,
    diagnosa, simpanDiagnosa, resep, simpanResep, rekamMedisLengkap,
    statistikHariIni, diagnosaTeratas,
    refGigi, refKondisiGigi, refBidangGigi,
    odontogram, odontogramPadaKunjungan, simpanOdontogram, riwayatOdontogram,
    pemeriksaanGigi, simpanPemeriksaanGigi,
    cariIcd9, tindakan, simpanTindakan, tindakanTeratas, pemeriksaanLabTeratas, daftarKelompokLab,
    refKesadaran, refStatusPulang,
    refPrognosa, refTacc, refSubspesialis, refSarana, refAlergi, refPpk,
    refSistemFisik, refVital: refVitalSemua,
    alergiKode, setAlergiKode,
    pcarePratinjau, observasiSatuSehat, kesiapanKode, simpanPpk, simpanPemetaanKode,
    daftarObat, simpanObat, imporObat, hapusObat,
    daftarIcd10, simpanIcd10, hapusIcd10, imporIcd10, daftarIcd9, simpanIcd9, hapusIcd9,
    kesiapanPasien, kesiapanKunjungan, ringkasanKesiapan,
    ambilSemua,
    apotekBatch, apotekStok, apotekTransaksi, apotekMasuk, apotekKeluar,
    apotekBatalkanGrup, apotekSerahkanResep, simpanBatch,
    apotekImpor, obatUntukPencocokan,
    antreanFarmasi, resepUntukFarmasi, batchObat,
    kasirMenunggu, kasirDaftarTagihan, kasirTagihan, kasirItem, kasirPembayaran,
    kasirLengkap, kasirSusunDariKunjungan, kasirCatatPembayaran,
    kasirHapusPembayaran, kasirHapusTagihan, kasirBuatTagihanBebas,
    kasirTambahItem, kasirUbahItem, kasirHapusItem, kasirJualObatBebas,
    daftarTarif, simpanTarif, updateHargaLab, updateLabExtras, kasirRekap,
    templateInvoice, simpanTemplateInvoice,
    refLab, refLabSemua, refLabPaket, daftarPaket, daftarPaketLab: daftarPaket, simpanPaket, simpanPaketLab: simpanPaket, hapusPaket, simpanRefLab, simpanRujukan, hapusRujukan, hapusLab,
    labMinta, labMintaLuar, labAntrean, labPermintaan, labKunjungan, labPasien,
    simpanHasilLab, labSelesaikan, labBukaKunci, labBatalkan,
    labTambahItem, labHapusItem, labHapusPermintaan,
    labTren, riwayatLabPasien, labBelumSelesai,
    labFisikAmbil, labFisikSimpan, labAnamnesaAmbil, labAnamnesaSimpan,
    labSpermaAmbil, labSpermaSimpan, labSimpanCatatan,
    penunjangSimpan, penunjangPasien, penunjangKunjungan, gigiBerbacaan, hapusPenunjang,
    lampiranPasien, lampiranKunjungan, simpanLampiran, hapusLampiran,
    suratPengaturan, simpanSuratPengaturan, refJenisSurat,
    resepPengaturan, simpanResepPengaturan,
    suratNomorBerikutnya, suratNomorTerpakai,
    buatSurat, ubahSurat, surat, daftarSurat, suratKunjungan, suratPasien,
    suratBatalkan, suratHapus, suratCatatCetak,
    antreanHariIni, antreanKuota, antreanAmbilLoket, antreanPanggil,
    antreanCheckin, antreanMulaiLayan, antreanLewat, antreanBatal, antreanUbah,
    antreanPanggilanHariIni, langgananAntrean,
    poliJadwal, simpanJadwal, hapusJadwal, poliLibur, simpanLibur, hapusLibur,
    antreanPengaturan, simpanAntreanPengaturan, antreanTokenBaru, antreanLayar,
    antrolAkun, antrolAkunSimpan, antrolAkunHapus, antrolLog,
    panggilBridging, riwayatBridging,
    refKronisDiagnosa, refKronisKuotaObat,
    kronisImporRingkas, kronisImporDaftar, kronisImporBaris, kronisImporUsulan,
    kronisImporTampung, kronisImporCocokkan, kronisImporBatalCocok,
    kronisImporAbaikan, kronisImporOtomatis, kronisImporBersihkan, kronisImporEksporKesesuaian,
    prolanisEksporPelayanan,
    pasienCariMirip, pasienBuatMassal,
    kronisPantauObat, kronisPantauLab, kronisPantauStatin, kronisTelponH1,
    kronisPasien, kronisStatinPasien, kronisUsulanDiagnosa,
    kronisDaftarSimpan, kronisTerapiSelesai, kronisH3Cek,
    laporanKunjunganRentang, laporanKunjunganRingkas, laporanPermintaanLabRingkas,
    laporanRujukan, distribusiKategoriLab,
    laporanKeuanganTagihan, laporanKeuanganPembayaran,
    laporanKaryawanAktivitas,
    laporanRegisterPoli, laporanTindakanUntukKunjungan, laporanDiagnosaPuskesmas,
    absensiPegawai, absensiHariIni, absensiMasuk, absensiKeluar, absensiLaporan,
    daftarMasterLokasi, simpanMasterLokasi, hapusMasterLokasi, absensiSemuaHariIni, tetapkanShiftKaryawan,
    pengaturanJamKerja, simpanPengaturanJamKerja,
    pengaturanInsentifAktivitas, simpanPengaturanInsentifAktivitas,
    daftarIzinSaya, ajukanIzin, batalkanIzin, daftarSemuaIzin, setujuiIzin, tolakIzin,
    daftarPegawaiStaff, kpiDaftar, kpiSimpan, kpiHapus, bonusDaftar, bonusSimpan, bonusHapus,
    simpanRekeningPegawai, ambilRekeningPegawaiLokal,
    simpanMulaiKerjaPegawai, ambilMulaiKerjaPegawaiLokal,
    inventoriDaftar, inventoriSimpan, inventoriMutasi, inventoriRiwayat, inventoriHapus,
    inventoriBatchDaftar, inventoriBatchSimpan, inventoriBatchHapus, labResepDaftar, labResepSimpan, labResepHapus,
    statistikEksekutif,
    daftarRekanan, simpanRekanan, hapusRekanan,
    jadwalMuatBulan, jadwalTambah, jadwalUbah, jadwalHapus,
    kasirTagihanKunjungan
  };
})();
