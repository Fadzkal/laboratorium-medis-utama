/* =====================================================================
   LAB CORE — pemilihan nilai rujukan, penandaan hasil, dan penafsiran
   angka (fungsi murni)

   Modul ini SENGAJA tidak menyentuh DOM dan tidak memanggil Supabase,
   sehingga bisa diuji di luar peramban: `node test/uji_lab_core.js`.

   ---------------------------------------------------------------------
   KENAPA ATURANNYA DITULIS DUA KALI

   Penandaan Tinggi/Rendah yang BERLAKU adalah yang di database
   (lab_hitung_tanda() pada 11_penunjang.sql). Itu satu-satunya yang
   dipercaya, karena hasil bisa masuk lewat halaman lain atau lewat
   dasbor Supabase, dan semuanya harus ditandai dengan aturan yang sama.

   Yang di sini adalah kembarannya untuk PRATINJAU: petugas mengetik
   angka, dan tanda "Rendah" muncul sebelum ia menekan Simpan. Menunggu
   perjalanan bolak-balik ke server untuk itu terasa lambat pada koneksi
   klinik.

   Dua salinan aturan berarti keduanya bisa berselisih diam-diam, dan
   itulah yang paling berbahaya di sini — layar berkata Normal, database
   menyimpan Tinggi. Karena itu test/uji_lab_core.js memakai contoh yang
   PERSIS SAMA dengan test/uji_penunjang.sql, dan kalau salah satunya
   diubah tanpa yang lain, uji akan gagal.

   ---------------------------------------------------------------------
   SATU HAL YANG TIDAK DISALIN DARI apotek_excel.js

   bacaAngka() di sana membaca "1.005" sebagai 1005, karena di berkas
   Excel apotek titik memang pemisah ribuan. Di lab, 1.005 adalah berat
   jenis urine — angka yang sah dan sering muncul. Karena itu di sini
   penafsiran titik ditentukan oleh berapa desimal yang dipakai
   pemeriksaan tersebut (kolom ref_lab.desimal):

     desimal = 0 (leukosit, trombosit)  → "7.500" berarti 7500
     desimal > 0 (berat jenis urine)    → "1.005" berarti 1,005

   Tanpa aturan itu, satu dari dua pemeriksaan pasti salah baca.
   ===================================================================== */
const LabCore = (() => {
  'use strict';

  /* ------------------------------------------------------------------
     Label tanda. `berat` dipakai untuk mengurutkan: yang paling gawat
     naik ke atas pada ringkasan lembar hasil.
     ------------------------------------------------------------------ */
  const TANDA = {
    BELUM:         { label: '—',      pendek: '',  kelas: 'netral',  berat: 0 },
    NORMAL:        { label: 'Normal', pendek: '',  kelas: 'ok',      berat: 0 },
    RENDAH:        { label: 'Rendah', pendek: 'L', kelas: 'warn',    berat: 2 },
    TINGGI:        { label: 'Tinggi', pendek: 'H', kelas: 'warn',    berat: 2 },
    ABNORMAL:      { label: 'Abnormal', pendek: '!', kelas: 'warn',  berat: 2 },
    KRITIS_RENDAH: { label: 'Kritis rendah', pendek: 'LL', kelas: 'err', berat: 3 },
    KRITIS_TINGGI: { label: 'Kritis tinggi', pendek: 'HH', kelas: 'err', berat: 3 }
  };

  const JENIS_PENUNJANG = [
    { kode: 'RO_PERIAPIKAL',  label: 'Rontgen periapikal',   gigi: true  },
    { kode: 'RO_BITEWING',    label: 'Rontgen bitewing',     gigi: true  },
    { kode: 'RO_PANORAMIK',   label: 'Rontgen panoramik',    gigi: true  },
    { kode: 'RO_OKLUSAL',     label: 'Rontgen oklusal',      gigi: true  },
    { kode: 'RO_SEFALOMETRI', label: 'Rontgen sefalometri',  gigi: false },
    { kode: 'RO_THORAX',      label: 'Rontgen toraks',       gigi: false },
    { kode: 'RO_LAIN',        label: 'Rontgen lainnya',      gigi: false },
    { kode: 'EKG',            label: 'EKG',                  gigi: false },
    { kode: 'USG',            label: 'USG',                  gigi: false },
    { kode: 'LAINNYA',        label: 'Penunjang lainnya',    gigi: false }
  ];

  const JENIS_LAMPIRAN = [
    { kode: 'FILM_RONTGEN',    label: 'Film rontgen' },
    { kode: 'HASIL_LAB_LUAR',  label: 'Lembar hasil lab luar' },
    { kode: 'SURAT_RUJUKAN',   label: 'Surat rujukan' },
    { kode: 'HASIL_EKG',       label: 'Rekaman EKG' },
    { kode: 'HASIL_USG',       label: 'Hasil USG' },
    { kode: 'INFORMED_CONSENT',label: 'Informed consent' },
    { kode: 'RESUME_LUAR',     label: 'Resume medis dari luar' },
    { kode: 'IDENTITAS',       label: 'Salinan identitas / kartu' },
    { kode: 'LAINNYA',         label: 'Lainnya' }
  ];

  const labelJenis = (kode) =>
    (JENIS_PENUNJANG.find(j => j.kode === kode) || {}).label || kode || '-';
  const jenisPakaiGigi = (kode) =>
    !!(JENIS_PENUNJANG.find(j => j.kode === kode) || {}).gigi;
  const labelLampiran = (kode) =>
    (JENIS_LAMPIRAN.find(j => j.kode === kode) || {}).label || kode || '-';

  /* ------------------------------------------------------------------
     Umur dalam bulan. Dipakai untuk memilih baris nilai rujukan anak.
     ------------------------------------------------------------------ */
  function umurBulan(tglLahir, pada) {
    if (!tglLahir) return null;
    const l = new Date(tglLahir), n = pada ? new Date(pada) : new Date();
    if (isNaN(l) || isNaN(n)) return null;
    let bulan = (n.getFullYear() - l.getFullYear()) * 12 + (n.getMonth() - l.getMonth());
    if (n.getDate() < l.getDate()) bulan -= 1;
    return bulan < 0 ? 0 : bulan;
  }

  /* ------------------------------------------------------------------
     Memilih baris nilai rujukan yang paling khusus.

     Urutan kekhususan harus sama persis dengan lab_rujukan_untuk() di
     11_penunjang.sql: baris dengan jenis kelamin menang atas baris tanpa
     jenis kelamin; di antara yang setara, rentang umur tersempit menang.

     Tanpa aturan kedua, hemoglobin anak tiga tahun bisa dinilai dengan
     rentang dewasa hanya karena baris dewasa kebetulan ada lebih dulu di
     daftar — dan 12,0 g/dL akan terbaca "rendah" padahal normal.
     ------------------------------------------------------------------ */
  function pilihRujukan(daftar, jenisKelamin, umurBln) {
    const cocok = (daftar || []).filter(r =>
      (r.jenis_kelamin == null || r.jenis_kelamin === jenisKelamin) &&
      (r.umur_min_bulan == null || umurBln == null || umurBln >= r.umur_min_bulan) &&
      (r.umur_max_bulan == null || umurBln == null || umurBln <  r.umur_max_bulan));
    if (!cocok.length) return null;

    const lebar = (r) =>
      (r.umur_max_bulan == null ? 2147483647 : r.umur_max_bulan) -
      (r.umur_min_bulan == null ? 0 : r.umur_min_bulan);

    return cocok.slice().sort((a, b) => {
      const ja = a.jenis_kelamin != null ? 0 : 1;
      const jb = b.jenis_kelamin != null ? 0 : 1;
      if (ja !== jb) return ja - jb;
      return lebar(a) - lebar(b);
    })[0];
  }

  /* ------------------------------------------------------------------
     Menandai sebuah nilai. Kembaran lab_tanda() di 11_penunjang.sql.

     Nilai kritis diperiksa LEBIH DULU daripada batas biasa: hemoglobin
     6,2 bukan sekadar "rendah", ia harus segera diberitahukan ke dokter.
     Kalau urutannya dibalik, kasus paling gawat justru tampil paling
     tenang.
     ------------------------------------------------------------------ */
  function tandaAngka(nilai, ruj) {
    if (nilai === null || nilai === undefined || nilai === '' || isNaN(nilai)) return 'BELUM';
    const r = ruj || {};
    const n  = Number(nilai);
    let kb = r.kritis_bawah, ka = r.kritis_atas;
    let bb = r.batas_bawah,  ba = r.batas_atas;

    // Jika batas_bawah / batas_atas belum di-parse tapi ada r.teks (misal: "12 - 16" atau "8.1 - 10.4")
    if ((bb === null || bb === undefined) && (ba === null || ba === undefined) && r.teks) {
      const mTeks = String(r.teks).match(/([\d.,]+)\s*-\s*([\d.,]+)/);
      if (mTeks) {
        bb = parseFloat(mTeks[1].replace(',', '.'));
        ba = parseFloat(mTeks[2].replace(',', '.'));
      } else {
        const mKurang = String(r.teks).match(/<\s*([\d.,]+)/);
        if (mKurang) ba = parseFloat(mKurang[1].replace(',', '.'));
        const mLebih = String(r.teks).match(/>\s*([\d.,]+)/);
        if (mLebih) bb = parseFloat(mLebih[1].replace(',', '.'));
      }
    }

    if (kb !== null && kb !== undefined && !isNaN(kb) && n <= Number(kb)) return 'KRITIS_RENDAH';
    if (ka !== null && ka !== undefined && !isNaN(ka) && n >= Number(ka)) return 'KRITIS_TINGGI';
    if (bb !== null && bb !== undefined && !isNaN(bb) && n <  Number(bb)) return 'RENDAH';
    if (ba !== null && ba !== undefined && !isNaN(ba) && n >  Number(ba)) return 'TINGGI';
    if ((bb === null || bb === undefined || isNaN(bb)) && (ba === null || ba === undefined || isNaN(ba))) return 'BELUM';
    return 'NORMAL';
  }

  function tandaTeks(nilaiTeks, teksNormal) {
    const v = (nilaiTeks == null ? '' : String(nilaiTeks)).trim();
    if (!v) return 'BELUM';

    // 1. Jika teks yang diketik berupa angka dan teks normal berupa rentang (misal "8.1 - 10.4" atau "< 20")
    const n = parseFloat(v.replace(',', '.'));
    if (!isNaN(n) && teksNormal && /[\d]/.test(teksNormal)) {
      const resAngka = tandaAngka(n, { teks: teksNormal });
      if (resAngka !== 'BELUM') return resAngka;
    }

    // 2. Jika ada acuan teks normal dari master
    if (teksNormal != null && String(teksNormal).trim() !== '') {
      const tn = String(teksNormal).trim().toLowerCase();
      const vLow = v.toLowerCase();
      if (vLow === tn) return 'NORMAL';
      if (/negatif|non\s*reaktif|normal/i.test(tn)) {
        if (/positif|reaktif|abnormal/i.test(vLow)) return 'ABNORMAL';
        if (/negatif|non\s*reaktif|normal/i.test(vLow)) return 'NORMAL';
      }
      return 'ABNORMAL';
    }

    // 3. Deteksi kata abnormal umum
    const vLow = v.toLowerCase();
    if (/^(positif|reaktif|abnormal|ditemukan|keruh|merah|pos|\+)/i.test(vLow)) return 'ABNORMAL';
    if (/^(negatif|non\s*reaktif|normal|-)/i.test(vLow)) return 'NORMAL';

    // 4. Untuk teks deskriptif spesifik (misal: "Kuning jernih", "Jernih")
    if (teksNormal == null || teksNormal === '') {
      if (/kuning|jernih|coklat|putih|bening/i.test(vLow)) return 'NORMAL';
      return 'BELUM';
    }

    return 'NORMAL';
  }

  /* Satu pintu: pilih cara menandai berdasarkan jenis nilai pemeriksaan. */
  function tandai(lab, ruj, nilaiAngka, nilaiTeks) {
    if (!lab) return 'BELUM';
    if (lab.jenis_nilai === 'ANGKA' || (nilaiAngka !== null && nilaiAngka !== undefined)) {
      return tandaAngka(nilaiAngka, ruj);
    }
    if (nilaiTeks && !isNaN(parseFloat(String(nilaiTeks).replace(',', '.'))) && (ruj && (ruj.batas_bawah != null || ruj.batas_atas != null || ruj.teks))) {
      return tandaAngka(parseFloat(String(nilaiTeks).replace(',', '.')), ruj);
    }
    return tandaTeks(nilaiTeks, lab.teks_normal);
  }

  /* ------------------------------------------------------------------
     Format angka seperti to_char(n,'FM999999990.0999') di PostgreSQL:
     tanpa pemisah ribuan, sedikitnya satu angka di belakang koma, dan
     nol di belakang dibuang. Ditiru persis supaya teks rujukan yang
     dibuat di layar sama dengan yang disimpan database.
     ------------------------------------------------------------------ */
  function fmSql(n) {
    if (n === null || n === undefined || n === '') return '';
    let s = (Math.round(Number(n) * 10000) / 10000).toFixed(4);
    s = s.replace(/(\.\d)0+$/, '$1').replace(/(\.\d*[1-9])0+$/, '$1');
    return s;
  }

  function teksRujukan(ruj, lab) {
    if (ruj && ruj.teks) return ruj.teks;
    const bb = ruj && ruj.batas_bawah, ba = ruj && ruj.batas_atas;
    const ada = (v) => v !== null && v !== undefined && v !== '';
    if (ada(bb) && ada(ba)) return fmSql(bb) + ' - ' + fmSql(ba);
    if (ada(ba)) return '< ' + fmSql(ba);
    if (ada(bb)) return '> ' + fmSql(bb);
    return (lab && lab.teks_normal) || '';
  }

  /* ------------------------------------------------------------------
     Membaca angka yang diketik petugas. Lihat catatan di kepala berkas:
     titik ditafsirkan sebagai pemisah ribuan hanya bila pemeriksaannya
     memang tidak berdesimal DAN kelompoknya tepat tiga angka.
     ------------------------------------------------------------------ */
  function bacaNilai(v, desimal) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;

    let s = String(v).trim().replace(/\s/g, '');
    if (!s) return null;
    if (!/^-?[\d.,]+$/.test(s)) return null;

    const pemisah = s.match(/[.,]/g) || [];
    if (!pemisah.length) { const n = parseFloat(s); return isFinite(n) ? n : null; }

    const posTitik = s.lastIndexOf('.'), posKoma = s.lastIndexOf(',');
    const posAkhir = Math.max(posTitik, posKoma);
    const ekor = s.slice(posAkhir + 1);
    const duaMacam = posTitik >= 0 && posKoma >= 0;

    let ribuan;
    if (duaMacam)                 ribuan = false;     // yang terakhir pasti desimal
    else if (pemisah.length > 1)  ribuan = true;      // 1.234.567
    else ribuan = (ekor.length === 3 && Number(desimal || 0) === 0);

    if (ribuan) {
      s = s.replace(/[.,]/g, '');
    } else {
      const desimalChar = posTitik > posKoma ? '.' : ',';
      const ribuanChar  = desimalChar === '.' ? ',' : '.';
      s = s.split(ribuanChar).join('').replace(desimalChar, '.');
    }
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  /* Tampilan angka bergaya Indonesia: koma untuk desimal.

     `desimal` adalah jumlah angka MINIMAL di belakang koma, bukan maksimal.
     Kalau ia dijadikan batas atas, petugas yang mengetik 99,5 pada glukosa
     (desimal = 0) akan melihat 100 di layar dan di lembar cetak, sementara
     database menyimpan 99,5 dan menandainya dari 99,5. Layar dan berkas
     yang tidak sepakat soal angka adalah cacat yang mahal di rekam medis. */
  function formatNilai(n, desimal) {
    if (n === null || n === undefined || n === '' || isNaN(n)) return '';
    const d = Math.max(0, Math.min(4, Number(desimal) || 0));
    const pecahan = String(Math.round(Number(n) * 10000) / 10000).split('.')[1] || '';
    return Number(n).toLocaleString('id-ID', {
      minimumFractionDigits: d,
      maximumFractionDigits: Math.max(d, Math.min(4, pecahan.length))
    });
  }

  /* ------------------------------------------------------------------
     Ringkasan satu lembar hasil — dipakai untuk lencana di antrean lab
     dan untuk memutuskan apakah tombol "Selesaikan" boleh aktif.
     ------------------------------------------------------------------ */
  function ringkasLembar(hasil) {
    const h = hasil || [];
    const terisi = h.filter(x =>
      (x.nilai_angka !== null && x.nilai_angka !== undefined && x.nilai_angka !== '') ||
      (x.nilai_teks != null && String(x.nilai_teks).trim() !== ''));
    const takNormal = h.filter(x => (TANDA[x.tanda] || {}).berat >= 2);
    const kritis    = h.filter(x => (TANDA[x.tanda] || {}).berat >= 3);
    return {
      total: h.length,
      terisi: terisi.length,
      kosong: h.length - terisi.length,
      takNormal: takNormal.length,
      kritis: kritis.length,
      siapDitutup: h.length > 0 && terisi.length === h.length
    };
  }

  /* Urutan tampil: yang gawat di atas, sisanya menurut urutan lembar. */
  function urutMenonjol(hasil) {
    return (hasil || []).slice().sort((a, b) =>
      ((TANDA[b.tanda] || {}).berat || 0) - ((TANDA[a.tanda] || {}).berat || 0) ||
      (a.urutan || 0) - (b.urutan || 0));
  }

  /* Kelompokkan menurut kelompok pemeriksaan, untuk lembar hasil cetak. */
  function kelompokkan(hasil, master) {
    const peta = {};
    (master || []).forEach(m => { peta[m.id] = m.kelompok || 'Lainnya'; });
    const grup = new Map();
    (hasil || []).forEach(h => {
      const k = h.kelompok || peta[h.lab_id] || 'Lainnya';
      if (!grup.has(k)) grup.set(k, []);
      grup.get(k).push(h);
    });
    return Array.from(grup, ([kelompok, isi]) => ({
      kelompok, isi: isi.slice().sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
    }));
  }

  /* ------------------------------------------------------------------
     Tren satu pemeriksaan pada satu pasien: urut menurut tanggal, dengan
     selisih terhadap pemeriksaan sebelumnya. Inilah yang tidak mungkin
     didapat kalau hasil lab hanya disimpan sebagai foto lembar.
     ------------------------------------------------------------------ */
  function susunTren(baris) {
    const urut = (baris || [])
      .filter(b => b.nilai_angka !== null && b.nilai_angka !== undefined)
      .slice()
      .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
    return urut.map((b, i) => {
      const sebelum = i > 0 ? Number(urut[i - 1].nilai_angka) : null;
      const kini = Number(b.nilai_angka);
      return Object.assign({}, b, {
        nilai: kini,
        selisih: sebelum === null ? null : Number((kini - sebelum).toFixed(4)),
        arah: sebelum === null ? null : (kini > sebelum ? 'naik' : kini < sebelum ? 'turun' : 'tetap')
      });
    });
  }

  /* Nilai teks/pilihan yang tidak ada di daftar pilihan adalah salah
     ketik, bukan hasil. Ditahan di layar sebelum sampai ke database. */
  function validasi(lab, nilaiAngka, nilaiTeks) {
    if (!lab) return 'Pemeriksaan tidak dikenal.';
    if (lab.jenis_nilai === 'ANGKA') {
      if (nilaiAngka === null || nilaiAngka === undefined || nilaiAngka === '') return null;
      if (isNaN(Number(nilaiAngka))) return 'Nilai harus berupa angka.';
      if (Number(nilaiAngka) < 0) return 'Nilai tidak boleh negatif.';
      return null;
    }
    if (lab.jenis_nilai === 'PILIHAN') {
      const v = (nilaiTeks == null ? '' : String(nilaiTeks)).trim();
      if (!v) return null;
      const daftar = lab.pilihan || [];
      if (daftar.length && !daftar.some(p => p.toLowerCase() === v.toLowerCase()))
        return 'Pilih salah satu: ' + daftar.join(', ');
    }
    return null;
  }

  /* ------------------------------------------------------------------
     Pemeriksaan Fisik — daftar item tetap (medical check-up)
     isHeader  = baris judul grup, tidak ada input
     unit      = satuan (opsional)
     ------------------------------------------------------------------ */
  const REF_FISIK = [
    { id: 100, nama: 'BODY MASS INDEX',    isHeader: true },
    { id: 101, nama: 'Tinggi Badan',       unit: 'cm' },
    { id: 102, nama: 'Berat Badan',        unit: 'kg' },
    { id: 103, nama: 'Lingkar Perut',      unit: 'cm' },
    { id: 104, nama: 'BMI',                unit: '' },
    { id: 200, nama: 'TANDA VITAL',        isHeader: true },
    { id: 201, nama: 'Tensi',              unit: '/mmHg' },
    { id: 202, nama: 'Nadi',               unit: 'x/Menit' },
    { id: 203, nama: 'Nafas',              unit: 'x/Menit' },
    { id: 204, nama: 'Suhu',               unit: 'C' },
    { id: 300, nama: 'KEPALA & WAJAH',     isHeader: false, unit: '' },
    { id: 400, nama: 'MATA',               isHeader: true },
    { id: 403, nama: 'Buta Warna',         unit: '' },
    { id: 500, nama: 'TELINGA',            isHeader: false, unit: '' },
    { id: 600, nama: 'HIDUNG',             isHeader: false, unit: '' },
    { id: 700, nama: 'TENGGOROKAN',        isHeader: false, unit: '' },
    { id: 800, nama: 'GIGI DAN MULUT',     isHeader: false, unit: '' },
    { id: 900, nama: 'LEHER',              isHeader: false, unit: '' },
    { id: 1000, nama: 'THORAX/DADA',       isHeader: false, unit: '' },
    { id: 1100, nama: 'PARU',              isHeader: false, unit: '' },
    { id: 1200, nama: 'JANTUNG',           isHeader: false, unit: '' },
    { id: 1300, nama: 'ABDOMEN',           isHeader: false, unit: '' },
    { id: 1400, nama: 'KULIT DAN KUKU',    isHeader: false, unit: '' },
    { id: 1500, nama: 'GENITOURINARIA',    isHeader: false, unit: '' },
    { id: 1600, nama: 'EKSTRIMITAS ATAS',  isHeader: false, unit: '' },
    { id: 1700, nama: 'EKSTRIMITAS BAWAH', isHeader: false, unit: '' },
    { id: 1800, nama: 'LAIN-LAIN',         isHeader: false, unit: '' },
    { id: 1900, nama: 'KESIMPULAN',         isHeader: false, unit: '' },
    { id: 2000, nama: 'SARAN',              isHeader: false, unit: '' }
  ];

  /** Konversi nilai hasil fisik untuk tampilan cetak: '0' → 'Normal' */
  function hasilFisikTeks(val) {
    if (val === null || val === undefined || val === '') return '—';
    if (val === '0' || val === 0) return 'Normal';
    return String(val);
  }

  /* ------------------------------------------------------------------
     Anamnesa — daftar item riwayat dan kebiasaan pasien (medical check-up)
     Urutan:
       1       : Keluhan Saat ini
       100     : Riwayat Penyakit Dahulu (Header)
       101-109 : Sub-item RPD
       200     : Riwayat Penyakit Keluarga (Header)
       201-210 : Sub-item RPK
       300     : Kebiasaan (Header)
       301-304 : Sub-item Kebiasaan
     ------------------------------------------------------------------ */
  const REF_ANAMNESA = [
    { urutan: 1,   nama: 'Keluhan Saat ini',                         isHeader: false, isKeluhan: true },
    { urutan: 100, nama: 'Riwayat Penyakit Dahulu',                  isHeader: true },
    { urutan: 101, nama: 'Rawat Inap/Operasi',                       isHeader: false },
    { urutan: 102, nama: 'Pengobatan TBC/Hepatitis/dll',             isHeader: false },
    { urutan: 103, nama: 'Patah Tulang (Terpasang PEN)',             isHeader: false },
    { urutan: 104, nama: 'Penyakit Haemorroid',                      isHeader: false },
    { urutan: 105, nama: 'Penyakit Hipertensi',                      isHeader: false },
    { urutan: 106, nama: 'Penyakit Diabetes Mellitus',               isHeader: false },
    { urutan: 107, nama: 'Penyakit Ginjal/Saluran Kemih Lain',       isHeader: false },
    { urutan: 108, nama: 'Penyakit Stroke',                          isHeader: false },
    { urutan: 109, nama: 'Penyakit Kejang',                          isHeader: false },
    { urutan: 200, nama: 'Riwayat Penyakit Keluarga',                isHeader: true },
    { urutan: 201, nama: 'Penyakit Asma',                            isHeader: false },
    { urutan: 202, nama: 'Penyakit Jantung/Darah Tinggi/Rendah *',   isHeader: false },
    { urutan: 203, nama: 'Penyakit Stroke',                          isHeader: false },
    { urutan: 204, nama: 'Penyakit GIT/Hepatobilliary/Sal. Cerna *', isHeader: false },
    { urutan: 205, nama: 'Penyakit Kencing Manis',                   isHeader: false },
    { urutan: 206, nama: 'Penyakit Ginjal',                          isHeader: false },
    { urutan: 207, nama: 'Penyakit Kanker/Tumor',                    isHeader: false },
    { urutan: 208, nama: 'Penyakit Alergi',                          isHeader: false },
    { urutan: 209, nama: 'Penyakit Gangguan Jiwa',                   isHeader: false },
    { urutan: 210, nama: 'Penyakit Lainnya',                         isHeader: false },
    { urutan: 300, nama: 'Kebiasaan',                                isHeader: true },
    { urutan: 301, nama: 'Olahraga',                                 isHeader: false },
    { urutan: 302, nama: 'Merokok',                                  isHeader: false },
    { urutan: 303, nama: 'Minum Alkohol',                            isHeader: false },
    { urutan: 304, nama: 'Minum Kopi',                               isHeader: false }
  ];

  /** Konversi nilai hasil anamnesa untuk tampilan cetak: '0' | 0 → 'Tidak', '1' | 1 → 'Ya' */
  function hasilAnamnesaTeks(val) {
    if (val === null || val === undefined || String(val).trim() === '') return '';
    const s = String(val).trim();
    if (s === '0') return 'Tidak';
    if (s === '1') return 'Ya';
    return s;
  }

  /* ------------------------------------------------------------------
      Item Analisa Sperma & Evaluasi Semen
      Sesuai Standar Laboratorium Medis Utama:
        Urut 110     : Keterangan Klinik
        Urut 120     : KETERANGAN SAMPEL (Header)
        Urut 121-125 : Butir Sampel (Pemeriksaan Ke, Lama Menikah, dll)
        Urut 200     : SEMEN (Header Makroskopis)
        Urut 201-206 : Butir Makroskopis (Kelengkapan, Penampilan, Volume, dll)
        Urut 220     : SPERMA (Header Mikroskopis)
        Urut 221-232 : Butir Mikroskopis (Jumlah, Gerakan, Bentuk, Vitalitas, Aglutinasi)
        Urut 250     : SEL-SEL LAIN (Header)
        Urut 251-254 : Butir Sel Lain (Leukosit, Eritrosit, Bakteri, Debris)
        Urut 270     : Komentar
      ------------------------------------------------------------------ */
  const REF_SPERMA = [
    { baris: 1,  urutan: 110, parameter: 'Keterangan Klinik',           defaultHasil: '',                   satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: false },
    { baris: 2,  urutan: 120, parameter: 'KETERANGAN SAMPEL',          defaultHasil: '',                   satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: true },
    { baris: 3,  urutan: 121, parameter: 'Pemeriksaan Ke',             defaultHasil: '1',                  satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: false },
    { baris: 4,  urutan: 122, parameter: 'Lama Menikah',               defaultHasil: '10 tahun',           satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: false },
    { baris: 5,  urutan: 123, parameter: 'Lama Berpantang',            defaultHasil: '3 hari',             satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: false },
    { baris: 6,  urutan: 124, parameter: 'Pengeluaran Jam',            defaultHasil: '10.58 WIB',          satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: false },
    { baris: 7,  urutan: 125, parameter: 'Pemeriksaan Jam',            defaultHasil: '11.58 WIB',          satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: false },
    { baris: 8,  urutan: 200, parameter: 'SEMEN',                      defaultHasil: '',                   satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: true },
    { baris: 9,  urutan: 201, parameter: '1. Kelengkapan Sampel',      defaultHasil: 'Lengkap',            satuan: 'L/TL',    bawah: 'Lengkap',                           tengah: '',     atas: '',      flag: 2, isHeader: false },
    { baris: 10, urutan: 202, parameter: '2. Penampilan',              defaultHasil: 'Normal',             satuan: 'N/Abn',   bawah: 'Putih Mutiara / "Grey-Opalescent"', tengah: '',     atas: '',      flag: 2, isHeader: false },
    { baris: 11, urutan: 203, parameter: '3. Kekentalan',              defaultHasil: 'Normal',             satuan: 'N/Abn',   bawah: 'Tetesan Kecil (<2 cm)',             tengah: '',     atas: '',      flag: 2, isHeader: false },
    { baris: 12, urutan: 204, parameter: '4. Pencairan',               defaultHasil: 'Normal / 45 menit',  satuan: 'N/Abn',   bawah: '<60 Menit',                         tengah: '',     atas: '',      flag: 2, isHeader: false },
    { baris: 13, urutan: 205, parameter: '5. pH',                      defaultHasil: '8.5',                satuan: '',        bawah: '7,2 - 7,8',                         tengah: '',     atas: '',      flag: 2, isHeader: false, isNumber: true },
    { baris: 14, urutan: 206, parameter: '6. Volume',                  defaultHasil: '4.1',                satuan: 'ml',      bawah: '1,5',                               tengah: '3,7',  atas: '6,8',   flag: 2, isHeader: false, isNumber: true },
    { baris: 15, urutan: 220, parameter: 'SPERMA',                     defaultHasil: '',                   satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: true },
    { baris: 16, urutan: 221, parameter: '1. Jumlah Sperma',           defaultHasil: '',                   satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 2, isHeader: true },
    { baris: 17, urutan: 222, parameter: 'a. Konsentrasi',             defaultHasil: '134.0',              satuan: '10^6/ml',  bawah: '15,0',                              tengah: '73,0', atas: '213,0', flag: 3, isHeader: false, isIndent: true, isNumber: true },
    { baris: 18, urutan: 223, parameter: 'b. Jumlah Total (Kons x Vol)', defaultHasil: '549.4',          satuan: '10^6/ejk', bawah: '39,0',                              tengah: '255,0',atas: '802,0', flag: 3, isHeader: false, isIndent: true, isNumber: true },
    { baris: 19, urutan: 224, parameter: '2. Gerakan Sperma',          defaultHasil: '',                   satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 2, isHeader: true },
    { baris: 20, urutan: 225, parameter: 'a. Bergerak Progresif (PR)', defaultHasil: '35',                 satuan: '%',       bawah: '32,0',                              tengah: '55,0', atas: '72,0',  flag: 3, isHeader: false, isIndent: true, isNumber: true },
    { baris: 21, urutan: 226, parameter: 'b. Bergerak Tidak Progresif(TP)', defaultHasil: '35',            satuan: '%',       bawah: '1,0',                               tengah: '5,0',  atas: '18,0',  flag: 3, isHeader: false, isIndent: true, isNumber: true },
    { baris: 22, urutan: 227, parameter: 'c. Total Bergerak(PR+TP)',   defaultHasil: '70',                 satuan: '%',       bawah: '40,0',                              tengah: '61,0', atas: '78,0',  flag: 3, isHeader: false, isIndent: true, isNumber: true },
    { baris: 23, urutan: 228, parameter: 'd. Tidak Bergerak(TG)',      defaultHasil: '30',                 satuan: '%',       bawah: '22,0',                              tengah: '39,0', atas: '59,0',  flag: 3, isHeader: false, isIndent: true, isNumber: true },
    { baris: 24, urutan: 229, parameter: '3. Bentuk Sperma',           defaultHasil: '',                   satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 2, isHeader: true },
    { baris: 25, urutan: 230, parameter: 'a. Bentuk Normal',           defaultHasil: '10',                 satuan: '%',       bawah: '4,0',                               tengah: '15,0', atas: '44,0',  flag: 3, isHeader: false, isIndent: true, isNumber: true },
    { baris: 26, urutan: 231, parameter: '4. Vitalitas Sperma',        defaultHasil: '59',                 satuan: '%',       bawah: '58,0',                              tengah: '79,0', atas: '91,0',  flag: 2, isHeader: false, isNumber: true },
    { baris: 27, urutan: 232, parameter: '5. Aglutinasi Sperma',       defaultHasil: 'Negatif',            satuan: 'Neg/1-4', bawah: 'Negatif',                           tengah: '',     atas: '',      flag: 2, isHeader: false },
    { baris: 28, urutan: 250, parameter: 'SEL-SEL LAIN',               defaultHasil: '',                   satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 2, isHeader: true },
    { baris: 29, urutan: 251, parameter: '1. Leukosit',                defaultHasil: '1.75',               satuan: '10^6/ml', bawah: '10^6/ml',                           tengah: '',     atas: '',      flag: 1, isHeader: false, isNumber: true },
    { baris: 30, urutan: 252, parameter: '2. Eritrosit',               defaultHasil: 'Negatif',            satuan: 'Neg/Pos', bawah: 'Negatif',                           tengah: '',     atas: '',      flag: 2, isHeader: false },
    { baris: 31, urutan: 253, parameter: '3. Bakteri',                 defaultHasil: 'Negatif',            satuan: 'Neg/Pos', bawah: 'Negatif',                           tengah: '',     atas: '',      flag: 2, isHeader: false },
    { baris: 32, urutan: 254, parameter: '4. Lain-lain/Debris',        defaultHasil: 'Negatif',            satuan: 'Neg/Pos', bawah: 'Negatif',                           tengah: '',     atas: '',      flag: 2, isHeader: false },
    { baris: 33, urutan: 270, parameter: 'Komentar',                   defaultHasil: '',                   satuan: '',        bawah: '',                                  tengah: '',     atas: '',      flag: 1, isHeader: false }
  ];

  const API = {
    TANDA, JENIS_PENUNJANG, JENIS_LAMPIRAN, REF_FISIK, REF_ANAMNESA, REF_SPERMA,
    labelJenis, jenisPakaiGigi, labelLampiran,
    umurBulan, pilihRujukan, tandaAngka, tandaTeks, tandai,
    fmSql, teksRujukan, bacaNilai, formatNilai,
    ringkasLembar, urutMenonjol, kelompokkan, susunTren, validasi,
    hasilFisikTeks, hasilAnamnesaTeks
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  return API;
})();
