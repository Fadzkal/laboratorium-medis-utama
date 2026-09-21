const fs = require('fs');
const crypto = require('crypto');

// 1. Ekstrak kredensial dari js/config.js
const dbJs = fs.readFileSync('js/config.js', 'utf8');
const urlMatch = dbJs.match(/SUPABASE_URL:\s*'([^']+)'/);
const keyMatch = dbJs.match(/SUPABASE_ANON_KEY:\s*'([^']+)'/);

if (!urlMatch || !keyMatch) {
  console.error('Gagal mengekstrak SUPABASE_URL atau SUPABASE_ANON_KEY dari js/config.js');
  process.exit(1);
}

const SB_URL = urlMatch[1];
const SB_KEY = keyMatch[1];

async function fetchSB(table, method, body, params = '') {
  const url = SB_URL + '/rest/v1/' + table + params;
  const headers = {
    'apikey': SB_KEY,
    'Authorization': 'Bearer ' + SB_KEY,
    'Content-Type': 'application/json'
  };
  if (method === 'POST') {
    headers['Prefer'] = 'resolution=merge-duplicates';
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error('HTTP ' + res.status + ': ' + err);
  }
  return res.status !== 204 ? await res.json() : null;
}

// Helper parsing tanggal
const bulanMap = {
  'januari': '01', 'jan': '01',
  'februari': '02', 'feb': '02',
  'maret': '03', 'mar': '03',
  'april': '04', 'apr': '04',
  'mei': '05', 'may': '05',
  'juni': '06', 'jun': '06',
  'juli': '07', 'jul': '07',
  'agustus': '08', 'agu': '08', 'aug': '08',
  'september': '09', 'sep': '09',
  'oktober': '10', 'okt': '10', 'oct': '10',
  'november': '11', 'nov': '11',
  'desember': '12', 'des': '12', 'dec': '12'
};

function parseTanggal(str) {
  if (!str) return '2000-01-01';
  str = str.toLowerCase().trim();
  const parts = str.split(/[-\s]+/);
  if (parts.length >= 3) {
    let d = parts[0].padStart(2, '0');
    let m = bulanMap[parts[1]] || '01';
    let y = parts[2];
    if (y.length === 2) {
      y = parseInt(y) > 30 ? '19' + y : '20' + y;
    }
    return y + '-' + m + '-' + d;
  }
  return '2000-01-01';
}

function uuidFromString(str) {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    'a' + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join('-');
}

async function run() {
  console.log('1. Memuat referensi lab dari Supabase...');
  const refLab = await fetchSB('ref_lab', 'GET', null, '?select=id,kode');
  const refLabMap = new Map(refLab.map(r => [r.kode.toLowerCase(), r.id]));
  console.log('Berhasil memuat ' + refLabMap.size + ' master lab.');

  console.log('2. Membaca dan mem-parsing CSV...');
  const csvPath = 'c:/lab_utama/hasil_lab_2026_lengkap_full_identitas_4011_pasien.csv';
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const lines = csvText.split('\n');

  const pasienMap = new Map();
  const kunjunganMap = new Map();
  const permintaanMap = new Map();
  const hasilMap = new Map(); 

  const poli_id = '15d315ab-5e60-49ad-bc0b-6893815c3272';
  
  console.log('Memproses baris CSV...');
  let skip = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(';');
    if (cols.length < 20) continue;

    const no_lab = cols[0];
    const nama_pasien = cols[1];
    const no_rm = cols[2];
    const gender = cols[4] === 'Perempuan' ? 'P' : 'L';
    const tgl_lahir = parseTanggal(cols[5]);
    const alamat = cols[7];
    const tgl_periksa = parseTanggal(cols[8]);
    const keluhan_singkat = cols[10] ? 'Dokter Pengirim: ' + cols[10] : '';
    const cara_bayar = cols[11].toUpperCase() === 'BPJS' ? 'BPJS' : 'UMUM';
    const encounter_ss = cols[12];
    const rd_pxcode = cols[14];
    const nilai_teks = cols[16];
    let satuan = cols[18] ? cols[18].trim() : '';
    let rd_normal = cols[19] ? cols[19].trim() : '';
    
    // Konversi nilai_angka jika mungkin
    let nilai_angka = null;
    let n = parseFloat(nilai_teks);
    if (!isNaN(n) && isFinite(n)) {
      nilai_angka = n;
    }

    const pasien_id = uuidFromString('PASIEN_' + no_rm);
    if (!pasienMap.has(no_rm)) {
      pasienMap.set(no_rm, {
        id: pasien_id,
        no_rm,
        nama: nama_pasien,
        jenis_kelamin: gender,
        tanggal_lahir: tgl_lahir,
        alamat: alamat || null
      });
    }

    if (!kunjunganMap.has(encounter_ss)) {
      kunjunganMap.set(encounter_ss, {
        id: encounter_ss,
        no_kunjungan: no_lab,
        pasien_id,
        tanggal: tgl_periksa,
        poli_id,
        cara_bayar,
        keluhan_singkat,
        status: 'SELESAI'
      });
    }

    const permintaan_id = encounter_ss;
    if (!permintaanMap.has(permintaan_id)) {
      permintaanMap.set(permintaan_id, {
        id: permintaan_id,
        kunjungan_id: encounter_ss,
        no_order: no_lab,
        status: 'SELESAI'
      });
    }

    const lab_id = refLabMap.get(rd_pxcode.toLowerCase());
    if (lab_id) {
      const hasilKey = permintaan_id + '_' + lab_id;
      if (!hasilMap.has(hasilKey)) {
        hasilMap.set(hasilKey, {
          id: uuidFromString(hasilKey),
          permintaan_id,
          lab_id,
          nama: cols[15] || '-',
          satuan: satuan || null,
          nilai_teks: nilai_teks || null,
          nilai_angka: nilai_angka,
          rujukan_teks: rd_normal || null,
          tanda: 'BELUM',
          urutan: hasilMap.size
        });
      }
    } else {
      skip++;
    }
  }

  console.log('Selesai parsing. ' + skip + ' hasil lab di-skip karena kode master tidak ditemukan.');
  console.log('Total Pasien: ' + pasienMap.size);
  console.log('Total Kunjungan: ' + kunjunganMap.size);
  console.log('Total Permintaan: ' + permintaanMap.size);
  console.log('Total Hasil Lab: ' + hasilMap.size);

  async function batchInsert(table, dataMap, onConflict) {
    const dataArray = Array.from(dataMap.values());
    const chunkSize = 1000;
    console.log('Mulai insert ke tabel ' + table + ' (' + dataArray.length + ' baris)...');
    for (let i = 0; i < dataArray.length; i += chunkSize) {
      const chunk = dataArray.slice(i, i + chunkSize);
      try {
        await fetchSB(table, 'POST', chunk, '?on_conflict=' + onConflict);
        console.log('Inserted ' + Math.min(i + chunkSize, dataArray.length) + ' / ' + dataArray.length);
      } catch (err) {
        console.error('Error insert ke ' + table + ' pada index ' + i + ':', err.message);
      }
    }
    console.log('Selesai insert ' + table + '.');
  }

  try {
    await fetchSB('poli', 'POST', [{
      id: poli_id,
      kode: 'HISTORI',
      nama: 'Histori / Impor CSV'
    }], '?on_conflict=id');
  } catch(e) {}

  await batchInsert('pasien', pasienMap, 'id');
  await batchInsert('kunjungan', kunjunganMap, 'id');
  await batchInsert('lab_permintaan', permintaanMap, 'id');
  await batchInsert('lab_hasil', hasilMap, 'id');

  console.log('SELESAI! Data berhasil diimpor ke database.');
}

run().catch(console.error);
