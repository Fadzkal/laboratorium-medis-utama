const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '..', 'docs', 'assets', 'screenshots');
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_HOST = 'http://187.53.142.245:5100';

const DAFTAR_MODUL = [
  { namaFile: '01_beranda.png', url: `${BASE_HOST}/app.html#/beranda`, delay: 2500 },
  { namaFile: '02_pendaftaran.png', url: `${BASE_HOST}/app.html#/pendaftaran`, delay: 2500 },
  { namaFile: '03_antrean_hari_ini.png', url: `${BASE_HOST}/app.html#/antrian`, delay: 2500 },
  { namaFile: '04_pengisian_hasil_lab.png', url: `${BASE_HOST}/app.html#/lab`, delay: 3000 },
  { namaFile: '05_lis_integrasi_alat.png', url: `${BASE_HOST}/app.html#/lis-debug`, delay: 3000 },
  { namaFile: '06_kasir_pembayaran.png', url: `${BASE_HOST}/app.html#/kasir`, delay: 2500 },
  { namaFile: '07_surat_keterangan.png', url: `${BASE_HOST}/app.html#/surat`, delay: 2500 },
  { namaFile: '08_data_pasien.png', url: `${BASE_HOST}/app.html#/pasien`, delay: 2500 },
  { namaFile: '09_riwayat_kunjungan.png', url: `${BASE_HOST}/app.html#/riwayat`, delay: 2500 },
  { namaFile: '10_laporan_statistik.png', url: `${BASE_HOST}/app.html#/laporan`, delay: 2500 },
  { namaFile: '11_master_data_lab.png', url: `${BASE_HOST}/app.html#/master`, delay: 2500 },
  { namaFile: '12_display_antrean.png', url: `${BASE_HOST}/display.html`, delay: 2000 }
];

async function jalankan() {
  console.log('[1/4] Memulai Chrome Headless Desktop (1920x1080)...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1920,1080',
    '--force-device-scale-factor=1',
    '--hide-scrollbars'
  ]);

  let targetWsUrl = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      // Dapatkan daftar target / tab yang terbuka
      const res = await fetch('http://127.0.0.1:9222/json');
      if (res.ok) {
        const tabs = await res.json();
        const pageTab = tabs.find(t => t.type === 'page');
        if (pageTab && pageTab.webSocketDebuggerUrl) {
          targetWsUrl = pageTab.webSocketDebuggerUrl;
          break;
        }
      }
    } catch (_) {}
  }

  if (!targetWsUrl) {
    console.error('Gagal mendapatkan WebSocket URL dari Chrome CDP.');
    chromeProc.kill();
    process.exit(1);
  }

  console.log('[2/4] Terhubung ke Chrome CDP Protocol:', targetWsUrl);
  const ws = new WebSocket(targetWsUrl);

  let messageId = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.id && pendingRequests.has(data.id)) {
        const { resolve, reject } = pendingRequests.get(data.id);
        pendingRequests.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    } catch (err) {
      console.error('Galat parsing pesan CDP:', err);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function kirimCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Aktifkan domain CDP yang dibutuhkan
  await kirimCDP('Page.enable');
  await kirimCDP('Runtime.enable');
  await kirimCDP('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('[3/4] Melakukan autentikasi akun IT MEDIS UTAMA di', BASE_HOST);
  await kirimCDP('Page.navigate', { url: `${BASE_HOST}/index.html` });
  await new Promise(r => setTimeout(r, 2000));

  // Jalankan login di konteks halaman
  const loginRes = await kirimCDP('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          await DB.masuk('itmedisutama@labutama.id', 'itmedisutama123');
          const p = await DB.saya(true);
          return { sukses: true, nama: p ? p.nama : 'Unknown', peran: p ? p.peran : 'Unknown' };
        } catch(e) {
          return { sukses: false, error: e.message };
        }
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Hasil autentikasi:', loginRes.result?.value);
  await new Promise(r => setTimeout(r, 1000));

  console.log('[4/4] Memulai pengambilan 12 tangkapan layar modul...');

  for (let idx = 0; idx < DAFTAR_MODUL.length; idx++) {
    const modul = DAFTAR_MODUL[idx];
    const urutan = `[${idx + 1}/12]`;
    console.log(`${urutan} Navigasi ke ${modul.namaFile}: ${modul.url}`);
    
    await kirimCDP('Page.navigate', { url: modul.url });
    await new Promise(r => setTimeout(r, modul.delay));

    // Ambil tangkapan layar
    const shotResult = await kirimCDP('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false
    });

    if (shotResult && shotResult.data) {
      const buffer = Buffer.from(shotResult.data, 'base64');
      const targetPath = path.join(TARGET_DIR, modul.namaFile);
      fs.writeFileSync(targetPath, buffer);
      console.log(`      Tersimpan: ${targetPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`      Gagal mengambil screenshot: ${modul.namaFile}`);
    }
  }

  // Tutup koneksi dan browser
  ws.close();
  chromeProc.kill();
  console.log('Semua 12 tangkapan layar selesai diambil dan tersimpan dengan sukses.');
}

jalankan().catch(err => {
  console.error('Galat eksekusi tangkapan layar:', err);
  process.exit(1);
});
