const fs = require('fs');

const dbJs = fs.readFileSync('c:/lab_utama/rme-lab-utama/js/config.js', 'utf8');
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
  if (method === 'POST' || method === 'PATCH') {
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

function parseNum(str) {
  if (!str) return null;
  const n = parseFloat(str.replace(',', '.'));
  return isNaN(n) ? null : n;
}

async function run() {
  console.log('1. Membaca CSV...');
  const csvPath = 'c:/lab_utama/data_nilai_normal_lab_771 rapi.csv';
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const lines = csvText.split('\n');

  const upsertData = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(';');
    if (cols.length < 20 || !cols[0]) continue;

    const kode = cols[0].trim();
    const urutan = parseInt(cols[1]) || 0;
    const nama = cols[2].trim() || 'Tanpa Nama';
    const kode_loinc = cols[3].trim() || null;
    const loinc_display = cols[4].trim() || null;
    const kode_specimen = cols[5].trim() || null;
    const nama_specimen = cols[6].trim() || null;
    const satuan = cols[7].trim() || null;
    const nilai_normal = cols[8].trim() || null;
    const min_normal = parseNum(cols[9]);
    const max_normal = parseNum(cols[10]);
    const min_l = parseNum(cols[11]);
    const max_l = parseNum(cols[12]);
    const min_p = parseNum(cols[13]);
    const max_p = parseNum(cols[14]);
    const normal_l = cols[15].trim() || null;
    const normal_p = cols[16].trim() || null;
    const barcode = cols[17].trim() || null;
    const janji_hasil = cols[18].trim() || null;
    const metode = cols[19].trim() || null;

    upsertData.push({
      kode,
      nama,
      urutan,
      kode_loinc,
      loinc_display,
      kode_specimen,
      nama_specimen,
      satuan,
      nilai_normal,
      min_normal,
      max_normal,
      min_l,
      max_l,
      min_p,
      max_p,
      normal_l,
      normal_p,
      barcode,
      janji_hasil,
      metode,
      kelompok: 'Lainnya',
      jenis_nilai: 'ANGKA' // default
    });
  }

  console.log('Siap insert/update ' + upsertData.length + ' baris ke ref_lab.');

  const chunkSize = 500;
  for (let i = 0; i < upsertData.length; i += chunkSize) {
    const chunk = upsertData.slice(i, i + chunkSize);
    try {
      await fetchSB('ref_lab', 'POST', chunk, '?on_conflict=kode');
      console.log('Berhasil memproses baris ' + (i + 1) + ' sampai ' + Math.min(i + chunkSize, upsertData.length));
    } catch (e) {
      console.error('Gagal pada batch ' + i + ':', e.message);
    }
  }

  console.log('Impor selesai!');
}

run().catch(console.error);
