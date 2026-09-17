/* =====================================================================
   HALAMAN: ABSENSI KARYAWAN
   ---------------------------------------------------------------------
   Tempat karyawan mencatat jam kedatangan (Clock In) dan kepulangan
   (Clock Out) mereka setiap hari.
   ===================================================================== */
const Absensi = (() => {
  let w = null;
  let riwayat = [];
  let absenHariIni = null;

  async function render(el, param) {
    w = el;
    w.innerHTML = `
      <div class="mb-16">
        <h1>Absensi Karyawan</h1>
        <p class="text-muted mb-0">Catat jam kedatangan dan kepulangan Anda hari ini.</p>
      </div>

      <div class="grid" style="grid-template-columns: 1fr 2fr; gap: 24px;">
        <!-- Panel Clock In / Out -->
        <div class="card" style="align-self: start;">
          <div class="card-head"><h2>Status Hari Ini</h2></div>
          <div class="card-body text-center" id="panelAbsen">
            ${UI.memuat(2)}
          </div>
        </div>

        <!-- Riwayat Absensi -->
        <div class="card" style="align-self: start;">
          <div class="card-head"><h2>Riwayat Bulan Ini</h2></div>
          <div class="card-body tight">
            <div id="tabelRiwayat">${UI.memuat(3)}</div>
          </div>
        </div>
      </div>
    `;

    w.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-aksi]');
      if (!b) return;
      b.disabled = true;
      try {
        if (b.dataset.aksi === 'clock-in') await prosesClockIn();
        if (b.dataset.aksi === 'clock-out') await prosesClockOut();
      } catch (err) {
        UI.toast(err.message || 'Terjadi kesalahan.', 'err');
      } finally {
        b.disabled = false;
      }
    });

    await muatData();
  }

  async function muatData() {
    try {
      absenHariIni = await DB.absensiHariIni();
      
      const tanggal = new Date();
      const awalBulan = new Date(tanggal.getFullYear(), tanggal.getMonth(), 1).toISOString().split('T')[0];
      const akhirBulan = new Date(tanggal.getFullYear(), tanggal.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const saya = await DB.saya();
      riwayat = await DB.absensiPegawai(saya.id, awalBulan, akhirBulan);
      
      gambarPanelAbsen();
      gambarRiwayat();
    } catch (err) {
      UI.toast('Gagal memuat data absensi.', 'err');
    }
  }

  function gambarPanelAbsen() {
    const p = w.querySelector('#panelAbsen');
    
    if (!absenHariIni) {
      p.innerHTML = `
        <div style="font-size: 48px; font-weight: 800; color: var(--ink-900); margin: 20px 0;">
          ${UI.jam(new Date())}
        </div>
        <div class="banner warn mb-12 text-left">
          <div>Anda belum melakukan absen masuk hari ini.</div>
        </div>
        <button class="btn btn-primary w-full" data-aksi="clock-in" style="font-size: 18px; padding: 12px;">
          Absen Masuk (Clock In)
        </button>
      `;
    } else if (!absenHariIni.waktu_keluar) {
      p.innerHTML = `
        <div style="font-size: 48px; font-weight: 800; color: var(--ink-900); margin: 20px 0;">
          ${UI.jam(new Date())}
        </div>
        <div class="banner info mb-12 text-left">
          <div>Anda sudah absen masuk pada pukul <b>${UI.jam(absenHariIni.waktu_masuk)}</b>.</div>
        </div>
        <button class="btn btn-secondary w-full" data-aksi="clock-out" style="font-size: 18px; padding: 12px; color: var(--warn-700); border-color: var(--warn-300);">
          Absen Keluar (Clock Out)
        </button>
      `;
    } else {
      p.innerHTML = `
        <div style="font-size: 48px; font-weight: 800; color: var(--ok-600); margin: 20px 0;">
          ${UI.ikon('cek', 40)}
        </div>
        <div class="banner info mb-12 text-left">
          <div>Anda sudah menyelesaikan absensi hari ini. Terima kasih atas kerja kerasnya!</div>
        </div>
        <table class="w-full text-left mt-12 text-sm">
          <tr><td class="text-muted pb-4">Masuk</td><td class="pb-4"><b>${UI.jam(absenHariIni.waktu_masuk)}</b></td></tr>
          <tr><td class="text-muted pb-4">Keluar</td><td class="pb-4"><b>${UI.jam(absenHariIni.waktu_keluar)}</b></td></tr>
        </table>
      `;
    }
  }

  function gambarRiwayat() {
    const t = w.querySelector('#tabelRiwayat');
    if (!riwayat.length) {
      t.innerHTML = `<div class="empty text-center p-16">Belum ada riwayat absensi bulan ini.</div>`;
      return;
    }

    t.innerHTML = `
      <div class="table-wrap"><table class="tbl w-full">
        <thead><tr>
          <th>Tanggal</th>
          <th>Masuk</th>
          <th>Keluar</th>
          <th>Status</th>
        </tr></thead>
        <tbody>
          ${riwayat.map(r => `
            <tr>
              <td><b>${UI.tglIndo(r.tanggal)}</b></td>
              <td class="mono">${r.waktu_masuk ? UI.jam(r.waktu_masuk) : '—'}</td>
              <td class="mono">${r.waktu_keluar ? UI.jam(r.waktu_keluar) : '—'}</td>
              <td><span class="badge ${r.status === 'HADIR' ? 'b-selesai' : 'b-batal'}">${UI.esc(r.status)}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table></div>
    `;
  }

  async function prosesClockIn() {
    if (!await UI.konfirmasi('Absen Masuk', 'Apakah Anda yakin ingin absen masuk sekarang?', 'Clock In')) return;
    
    // Opsional: ambil lokasi jika perlu, di sini kita lewati demi kecepatan
    await DB.absensiMasuk();
    UI.toast('Berhasil absen masuk!', 'ok');
    await muatData();
  }

  async function prosesClockOut() {
    if (!await UI.konfirmasi('Absen Keluar', 'Apakah Anda yakin ingin absen keluar dan mengakhiri pekerjaan hari ini?', 'Clock Out')) return;
    
    await DB.absensiKeluar(absenHariIni.id);
    UI.toast('Berhasil absen keluar!', 'ok');
    await muatData();
  }

  return { render };
})();
