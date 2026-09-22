/* ===================== DATA PASIEN ===================== */
const Pasien = (() => {

  const AGAMA = ['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu','Lainnya'];
  const KAWIN = ['Belum Kawin','Kawin','Cerai Hidup','Cerai Mati'];
  const DIDIK = ['Tidak Sekolah','SD','SMP','SMA/SMK','D1-D3','S1','S2','S3'];
  const DARAH = ['A','B','AB','O','A+','A-','B+','B-','AB+','AB-','O+','O-'];

  /* ------------------------------------------------------------------ *
   *  Formulir identitas pasien — dipakai halaman ini dan Pendaftaran
   * ------------------------------------------------------------------ */
  function formIdentitas(p = {}) {
    const opsi = (arr, terpilih) => arr.map(o =>
      `<option value="${UI.esc(o)}" ${terpilih === o ? 'selected' : ''}>${UI.esc(o)}</option>`).join('');
    return `
    <fieldset class="fieldset">
      <legend>Identitas</legend>
      <div class="form-row c2">
        <div class="field field-compact">
          <label for="f-title">Title / Sapaan</label>
          <select id="f-title" name="title">
            <option value="">—</option>
            ${['Tn.','Ny.','Sdra.','Sdri.','An.','By.'].map(t =>
              `<option value="${t}" ${p.title === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="f-nrp">NRP <span class="opt">(Nomor Registrasi Pegawai)</span></label>
          <input type="text" id="f-nrp" name="nrp" value="${UI.esc(p.nrp)}" placeholder="Opsional, untuk pasien instansi">
        </div>
      </div>
      <div class="form-row c2">
        <div class="field">
          <label for="f-nama">Nama lengkap <span class="req">*</span></label>
          <input type="text" id="f-nama" name="nama" value="${UI.esc(p.nama)}" required
                 placeholder="Sesuai KTP / Kartu Keluarga">
        </div>
        <div class="field">
          <label for="f-nik">No. Legalitas / NIK <span class="opt">(16 digit, bila ada)</span></label>
          <input type="text" id="f-nik" name="nik" value="${UI.esc(p.nik)}" inputmode="numeric"
                 maxlength="16" placeholder="3374xxxxxxxxxxxx (opsional)">
          <div class="hint">Opsional untuk anak kecil atau lansia. Jika diisi, gunakan tepat 16 digit.</div>
        </div>
      </div>
      <div class="form-grid">
        <div class="field field-half">
          <label for="f-tempat">Tempat lahir</label>
          <input type="text" id="f-tempat" name="tempat_lahir" value="${UI.esc(p.tempat_lahir)}">
        </div>
        <div class="field field-compact">
          <label for="f-lahir">Tanggal lahir <span class="req">*</span></label>
          <input type="date" id="f-lahir" name="tanggal_lahir" value="${UI.esc(p.tanggal_lahir)}" required>
        </div>
        <div class="field field-compact">
          <label for="f-jk">Jenis kelamin <span class="req">*</span></label>
          <select id="f-jk" name="jenis_kelamin" required>
            <option value="">— pilih —</option>
            <option value="L" ${p.jenis_kelamin === 'L' ? 'selected' : ''}>Laki-laki</option>
            <option value="P" ${p.jenis_kelamin === 'P' ? 'selected' : ''}>Perempuan</option>
          </select>
        </div>
      </div>
      <div class="form-row c4">
        <div class="field">
          <label for="f-darah">Gol. darah</label>
          <select id="f-darah" name="gol_darah"><option value="">—</option>${opsi(DARAH, p.gol_darah)}</select>
        </div>
        <div class="field">
          <label for="f-agama">Agama</label>
          <select id="f-agama" name="agama"><option value="">—</option>${opsi(AGAMA, p.agama)}</select>
        </div>
        <div class="field">
          <label for="f-kawin">Status kawin</label>
          <select id="f-kawin" name="status_kawin"><option value="">—</option>${opsi(KAWIN, p.status_kawin)}</select>
        </div>
        <div class="field">
          <label for="f-didik">Pendidikan</label>
          <select id="f-didik" name="pendidikan"><option value="">—</option>${opsi(DIDIK, p.pendidikan)}</select>
        </div>
      </div>
      <div class="field">
        <label for="f-kerja">Pekerjaan</label>
        <input type="text" id="f-kerja" name="pekerjaan" value="${UI.esc(p.pekerjaan)}">
      </div>
      <div class="form-row c2">
        <div class="field">
          <label for="f-bagian">Bagian / Departemen</label>
          <input type="text" id="f-bagian" name="bagian" value="${UI.esc(p.bagian)}" placeholder="Misal: HRD, Produksi, dll">
        </div>
        <div class="field">
          <label for="f-plant">Plant / Lokasi</label>
          <input type="text" id="f-plant" name="plant" value="${UI.esc(p.plant)}" placeholder="Misal: Plant 1, Cibitung">
        </div>
      </div>
    </fieldset>

    <fieldset class="fieldset">
      <legend>Kepesertaan</legend>
      <div class="form-row c2">
        <div class="field">
          <label for="f-bpjs">No. Kartu BPJS <span class="opt">(13 digit)</span></label>
          <input type="text" id="f-bpjs" name="no_bpjs" value="${UI.esc(p.no_bpjs)}"
                 inputmode="numeric" maxlength="13" placeholder="000xxxxxxxxxx">
        </div>
        <div class="field">
          <label for="f-kk">No. Kartu Keluarga</label>
          <input type="text" id="f-kk" name="no_kk" value="${UI.esc(p.no_kk)}" inputmode="numeric" maxlength="16">
        </div>
      </div>
    </fieldset>

    <fieldset class="fieldset">
      <legend>Alamat &amp; kontak</legend>
      <div class="field">
        <label for="f-alamat">Alamat</label>
        <input type="text" id="f-alamat" name="alamat" value="${UI.esc(p.alamat)}"
               placeholder="Nama jalan, nomor rumah">
      </div>
      <div class="form-grid">
        <div class="field field-compact xs"><label for="f-rt">RT</label>
          <input type="text" id="f-rt" name="rt" value="${UI.esc(p.rt)}" maxlength="3"></div>
        <div class="field field-compact xs"><label for="f-rw">RW</label>
          <input type="text" id="f-rw" name="rw" value="${UI.esc(p.rw)}" maxlength="3"></div>
        <div class="field"><label for="f-kel">Kelurahan/Desa</label>
          <input type="text" id="f-kel" name="kelurahan" value="${UI.esc(p.kelurahan)}"></div>
        <div class="field"><label for="f-kec">Kecamatan</label>
          <input type="text" id="f-kec" name="kecamatan" value="${UI.esc(p.kecamatan)}"></div>
      </div>
      <div class="form-row c3">
        <div class="field"><label for="f-kab">Kabupaten/Kota</label>
          <input type="text" id="f-kab" name="kabupaten" value="${UI.esc(p.kabupaten)}"></div>
        <div class="field"><label for="f-prov">Provinsi</label>
          <input type="text" id="f-prov" name="provinsi" value="${UI.esc(p.provinsi)}"></div>
        <div class="field"><label for="f-telp">Telp (Rumah / Kantor)</label>
          <input type="tel" id="f-telp" name="no_telp" value="${UI.esc(p.no_telp)}" placeholder="02xxxxxxxx"></div>
        <div class="field"><label for="f-hp">No. HP / WhatsApp</label>
          <input type="tel" id="f-hp" name="no_hp" value="${UI.esc(p.no_hp)}" placeholder="08xxxxxxxxxx"></div>
      </div>
    </fieldset>

    <fieldset class="fieldset">
      <legend>Penanggung jawab <span class="opt-note">(opsional)</span></legend>
      <div class="form-row c3">
        <div class="field"><label for="f-pjn">Nama</label>
          <input type="text" id="f-pjn" name="pj_nama" value="${UI.esc(p.pj_nama)}"></div>
        <div class="field"><label for="f-pjh">Hubungan</label>
          <input type="text" id="f-pjh" name="pj_hubungan" value="${UI.esc(p.pj_hubungan)}"
                 placeholder="Suami / Istri / Anak"></div>
        <div class="field"><label for="f-pjp">No. HP</label>
          <input type="tel" id="f-pjp" name="pj_no_hp" value="${UI.esc(p.pj_no_hp)}"></div>
      </div>
      <div class="field mb-0">
        <label for="f-catatan">Catatan penting <span class="opt">(muncul menyolok di layar dokter)</span></label>
        <input type="text" id="f-catatan" name="catatan_penting" value="${UI.esc(p.catatan_penting)}"
               placeholder="Contoh: Alergi berat penisilin">
      </div>
    </fieldset>`;
  }

  function validasi(d) {
    const salah = [];
    if (!d.nama || d.nama.trim().length < 2) salah.push('Nama lengkap wajib diisi.');
    if (!d.tanggal_lahir) salah.push('Tanggal lahir wajib diisi.');
    else if (new Date(d.tanggal_lahir) > new Date()) salah.push('Tanggal lahir tidak boleh di masa depan.');
    if (!d.jenis_kelamin) salah.push('Jenis kelamin wajib dipilih.');
    if (d.nik && !/^\d{16}$/.test(d.nik)) salah.push('Jika diisi, NIK harus tepat 16 digit angka.');
    if (d.no_bpjs && !/^\d{13}$/.test(d.no_bpjs)) salah.push('No. BPJS harus tepat 13 angka.');
    if (d.no_hp && !/^[0-9+\-\s]{8,18}$/.test(d.no_hp)) salah.push('No. HP tidak valid.');
    return salah;
  }

  /* Modal tambah/ubah pasien. Mengembalikan objek pasien atau null. */
  async function modalPasien(pasienLama = null) {
    const baru = !pasienLama;
    return await UI.modal({
      judul: baru ? 'Daftarkan pasien baru' : 'Ubah data pasien',
      lebar: true,
      isi: `<div id="galat"></div>${formIdentitas(pasienLama || {})}`,
      tombol: [
        { teks: 'Batal', nilai: null },
        {
          teks: baru ? 'Simpan pasien' : 'Simpan perubahan', kelas: 'btn-primary',
          aksi: async (body) => {
            const d = UI.nilaiForm(body);
            const salah = validasi(d);
            const g = body.querySelector('#galat');
            if (salah.length) {
              g.innerHTML = `<div class="banner err"><div><b>Periksa kembali:</b><br>
                ${salah.map(s => UI.esc(s)).join('<br>')}</div></div>`;
              body.scrollTop = 0;
              return false;
            }
            try {
              const hasil = await DB.simpanPasien(d, pasienLama?.id || null);
              UI.toast(baru ? `Pasien tersimpan. No. RM ${hasil.no_rm}` : 'Data pasien diperbarui.', 'ok');
              return hasil;
            } catch (e) {
              const pesan = (e.message || '').includes('duplicate') && (e.message || '').includes('nik')
                ? 'NIK ini sudah terdaftar atas nama pasien lain.'
                : (e.message || 'Gagal menyimpan.');
              g.innerHTML = `<div class="banner err">${UI.esc(pesan)}</div>`;
              body.scrollTop = 0;
              return false;
            }
          }
        }
      ]
    });
  }

  /* ------------------------------------------------------------------ *
   *  Halaman: daftar pasien / detail pasien
   * ------------------------------------------------------------------ */
  async function render(el, param) {
    if (param && param[0]) return await detail(el, param[0]);
    return await daftar(el);
  }

  async function daftar(el) {
    el.innerHTML = `
      <div class="page-header">
        <div class="page-heading">
          <h1>Data Pasien</h1>
          <div class="page-sub">Cari dan kelola data rekam medis pasien, kepesertaan, serta riwayat kunjungan laboratorium.</div>
        </div>
        ${App.boleh('pasien_simpan')
          ? `<div class="page-actions"><button class="btn btn-primary btn-sm" id="btnBaru">
              ${UI.ikon('plus',16)} Pasien baru</button></div>` : ''}
      </div>

      <!-- Widget KPI Pemantauan BPJS 6 Bulan & Kontrol HbA1c -->
      <div id="wadahKpiKronis" class="mb-16"></div>

      <div class="filter-bar" style="display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end;">
        <div class="search-box filter-search" style="flex:1 1 240px; min-width:200px;">
          <span class="ico">${UI.ikon('cari',16)}</span>
          <input type="search" id="cari" placeholder="Cari nama, No. RM, NIK, BPJS, atau HP…" autofocus>
        </div>

        <div class="field" style="margin-bottom:0; min-width:180px;">
          <label for="fKronis" style="font-size:11px; font-weight:700; color:var(--ink-600); margin-bottom:4px; display:block;">Status BPJS 6 Bln &amp; HbA1c</label>
          <select id="fKronis" style="width:100%; padding:6px 8px; border:1px solid var(--ink-300); border-radius:var(--radius-sm); font-size:13px;">
            <option value="semua">Semua Pasien</option>
            <option value="bpjs_sudah_klaim">✅ BPJS: Sudah Klaim (&le; 6 Bln)</option>
            <option value="bpjs_belum_klaim">⚠️ BPJS: Belum Klaim / Jatuh Tempo</option>
            <option value="dm_hba1c_terkontrol">🟢 DM: HbA1c &lt; 7% (Terkontrol 6 Bln)</option>
            <option value="dm_hba1c_tinggi">🔴 DM: HbA1c &ge; 7% (Evaluasi Ulang 3 Bln)</option>
            <option value="dm_hba1c_belum">⚪ DM: Belum Periksa HbA1c</option>
            <option value="semua_kronis">🩺 Semua Pasien Kronis (HT/DM)</option>
          </select>
        </div>

        <div class="field" style="margin-bottom:0; min-width:130px;">
          <label for="fTipe" style="font-size:11px; font-weight:700; color:var(--ink-600); margin-bottom:4px; display:block;">Kepesertaan</label>
          <select id="fTipe" style="width:100%; padding:6px 8px; border:1px solid var(--ink-300); border-radius:var(--radius-sm); font-size:13px;">
            <option value="semua">Semua Tipe</option>
            <option value="bpjs">BPJS Kesehatan</option>
            <option value="umum">Umum / Mandiri</option>
            <option value="rekanan">Instansi / Pabrik</option>
          </select>
        </div>

        <div class="field" style="margin-bottom:0; min-width:150px;">
          <label for="fUrut" style="font-size:11px; font-weight:700; color:var(--ink-600); margin-bottom:4px; display:block;">Urutkan</label>
          <select id="fUrut" style="width:100%; padding:6px 8px; border:1px solid var(--ink-300); border-radius:var(--radius-sm); font-size:13px;">
            <option value="kunjungan_terbanyak" selected>Kunjungan Terbanyak</option>
            <option value="nama_asc">Nama Pasien (A - Z)</option>
            <option value="nama_desc">Nama Pasien (Z - A)</option>
            <option value="rm_desc">Pasien Baru (RM Baru)</option>
            <option value="rm_asc">Pasien Lama (RM Lama)</option>
            <option value="kunjungan_terakhir">Kunjungan Terakhir</option>
          </select>
        </div>

        <div class="field" style="margin-bottom:0; min-width:110px;">
          <label for="fJk" style="font-size:11px; font-weight:700; color:var(--ink-600); margin-bottom:4px; display:block;">Gender</label>
          <select id="fJk" style="width:100%; padding:6px 8px; border:1px solid var(--ink-300); border-radius:var(--radius-sm); font-size:13px;">
            <option value="semua">Semua (L/P)</option>
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>
        </div>

        <div class="field" style="margin-bottom:0; min-width:120px;">
          <label for="fUmur" style="font-size:11px; font-weight:700; color:var(--ink-600); margin-bottom:4px; display:block;">Umur</label>
          <select id="fUmur" style="width:100%; padding:6px 8px; border:1px solid var(--ink-300); border-radius:var(--radius-sm); font-size:13px;">
            <option value="semua">Semua Umur</option>
            <option value="anak">Anak (&lt; 18 th)</option>
            <option value="dewasa">Dewasa (18 - 59 th)</option>
            <option value="lansia">Lansia (&ge; 60 th)</option>
          </select>
        </div>

        <div class="field" style="margin-bottom:0; min-width:120px;">
          <label for="fKelengkapan" style="font-size:11px; font-weight:700; color:var(--ink-600); margin-bottom:4px; display:block;">Kelengkapan</label>
          <select id="fKelengkapan" style="width:100%; padding:6px 8px; border:1px solid var(--ink-300); border-radius:var(--radius-sm); font-size:13px;">
            <option value="semua">Semua Status</option>
            <option value="lengkap">Data Lengkap</option>
            <option value="kurang">Belum Lengkap</option>
          </select>
        </div>

        <div style="margin-bottom:1px;">
          <button type="button" id="btnResetFilter" class="btn btn-ghost btn-sm" title="Kembalikan semua filter ke pengaturan awal" style="border:1px solid var(--ink-200);">
            ${UI.ikon('batal',13)} Reset
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-toolbar" style="display:flex; align-items:center; gap:8px; padding:10px 16px; border-bottom:1px solid var(--ink-200); background:var(--ink-50);">
          <span class="tt-title" style="font-size:13px; font-weight:700; color:var(--ink-800);">Daftar Pasien</span>
          <span class="tt-count" id="statJumlah" style="font-size:12px; color:var(--ink-600);">Memuat…</span>
          <div style="flex:1;"></div>
          <span id="statUrut" style="font-size:11.5px; color:var(--brand-700); font-weight:600;"></span>
        </div>
        <div class="card-body tight" id="hasil">${UI.memuat(3)}</div>
      </div>`;

    const hasil = el.querySelector('#hasil');
    const statJumlah = el.querySelector('#statJumlah');
    const statUrut = el.querySelector('#statUrut');

    const labelUrutan = {
      'kunjungan_terbanyak': 'Kunjungan Terbanyak',
      'nama_asc': 'Nama A - Z',
      'nama_desc': 'Nama Z - A',
      'rm_desc': 'Pasien Baru (RM Baru)',
      'rm_asc': 'Pasien Lama (RM Lama)',
      'kunjungan_terakhir': 'Kunjungan Terakhir'
    };

    function renderKpiKronis(ringkasan = {}) {
      const wadah = el.querySelector('#wadahKpiKronis');
      if (!wadah) return;

      const totalBpjs = ringkasan.totalBpjsKronis || 0;
      const sudahKlaim = ringkasan.bpjsSudahKlaim || 0;
      const jatuhTempo = ringkasan.bpjsJatuhTempo || 0;
      const persenSudah = ringkasan.persenBpjsSudahKlaim || 0;
      const persenJatuh = ringkasan.persenBpjsJatuhTempo || 0;

      const totalDm = ringkasan.totalDm || 0;
      const terperiksaDm = ringkasan.totalDmTerperiksa || 0;
      const dmTerkontrol = ringkasan.dmHba1cTerkontrol || 0;
      const dmTinggi = ringkasan.dmHba1cTinggi || 0;
      const dmBelum = ringkasan.dmHba1cBelum || 0;
      const persenTerkontrol = ringkasan.persenHba1cTerkontrol || 0;
      const persenTinggi = ringkasan.persenHba1cTinggi || 0;
      const rataRata = ringkasan.rataRataHba1c ? `Rata-rata: ${ringkasan.rataRataHba1c}%` : 'Belum ada data nilai';

      wadah.innerHTML = `
        <div class="grid grid-2 gap-16">
          <!-- Card 1: Status Klaim BPJS 6 Bulan (HT & DM) -->
          <div class="card" style="border-left: 4px solid #16a34a; background:#f8fdf9;">
            <div class="card-head py-8 px-16 flex items-center justify-between flex-wrap gap-8" style="border-bottom:1px solid #dcfce7;">
              <div>
                <h3 style="margin:0; font-size:14px; font-weight:700; color:#166534;">
                  ${UI.ikon('cek', 14)} Pemantauan Siklus Klaim BPJS 6 Bulan (Prolanis)
                </h3>
                <div class="text-xs text-muted">Pasien Hipertensi &amp; Diabetes peserta BPJS</div>
              </div>
              <span class="badge b-ok font-bold" style="font-size:11px;">${totalBpjs} Pasien BPJS Kronis</span>
            </div>
            <div class="card-body p-12">
              <div class="grid grid-2 gap-10">
                <div style="background:#ffffff; border:1px solid #bbf7d0; border-radius:6px; padding:10px;">
                  <div class="text-xs text-muted font-bold">Sudah Klaim (&le; 6 Bulan)</div>
                  <div class="flex items-baseline gap-6 mt-4">
                    <span style="font-size:24px; font-weight:800; color:#15803d;">${persenSudah}%</span>
                    <span class="text-xs text-muted">(${sudahKlaim} pasien)</span>
                  </div>
                  <div class="text-xs mt-4" style="color:#16a34a; font-weight:600;">Status Aktif · Layak Pelayanan</div>
                </div>
                <div style="background:#ffffff; border:1px solid #fecaca; border-radius:6px; padding:10px;">
                  <div class="text-xs text-muted font-bold">Belum Klaim / Jatuh Tempo</div>
                  <div class="flex items-baseline gap-6 mt-4">
                    <span style="font-size:24px; font-weight:800; color:#dc2626;">${persenJatuh}%</span>
                    <span class="text-xs text-muted">(${jatuhTempo} pasien)</span>
                  </div>
                  <div class="text-xs mt-4" style="color:#dc2626; font-weight:600;">Terlewat &gt; 180 Hari · Perlu Jadwal</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2: Evaluasi Kontrol HbA1c (Diabetes) -->
          <div class="card" style="border-left: 4px solid #2563eb; background:#f6faff;">
            <div class="card-head py-8 px-16 flex items-center justify-between flex-wrap gap-8" style="border-bottom:1px solid #dbeafe;">
              <div>
                <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e40af;">
                  ${UI.ikon('stetoskop', 14)} Evaluasi Kontrol HbA1c Pasien Diabetes
                </h3>
                <div class="text-xs text-muted">Target Kontrol Glikemik: &lt; 7.0% · ${rataRata}</div>
              </div>
              <span class="badge b-info font-bold" style="font-size:11px;">${terperiksaDm} / ${totalDm} Terperiksa</span>
            </div>
            <div class="card-body p-12">
              <div class="grid grid-2 gap-10">
                <div style="background:#ffffff; border:1px solid #bfdbfe; border-radius:6px; padding:10px;">
                  <div class="text-xs text-muted font-bold">Terkontrol (&lt; 7.0%)</div>
                  <div class="flex items-baseline gap-6 mt-4">
                    <span style="font-size:24px; font-weight:800; color:#1d4ed8;">${persenTerkontrol}%</span>
                    <span class="text-xs text-muted">(${dmTerkontrol} pasien)</span>
                  </div>
                  <div class="text-xs mt-4" style="color:#2563eb; font-weight:600;">Jadwal Rutin Berikutnya: 6 Bulan</div>
                </div>
                <div style="background:#ffffff; border:1px solid #fed7aa; border-radius:6px; padding:10px;">
                  <div class="text-xs text-muted font-bold">Belum Terkontrol (&ge; 7.0%)</div>
                  <div class="flex items-baseline gap-6 mt-4">
                    <span style="font-size:24px; font-weight:800; color:#c2410c;">${persenTinggi}%</span>
                    <span class="text-xs text-muted">(${dmTinggi} pasien)</span>
                  </div>
                  <div class="text-xs mt-4" style="color:#ea580c; font-weight:600;">Perhatian: Evaluasi Ulang 3 Bulan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const muat = async () => {
      const kata = (el.querySelector('#cari')?.value || '').trim();
      const tipe = el.querySelector('#fTipe')?.value || 'semua';
      const kronis = el.querySelector('#fKronis')?.value || 'semua';
      const urut = el.querySelector('#fUrut')?.value || 'kunjungan_terbanyak';
      const jk = el.querySelector('#fJk')?.value || 'semua';
      const umur = el.querySelector('#fUmur')?.value || 'semua';
      const kelengkapan = el.querySelector('#fKelengkapan')?.value || 'semua';

      hasil.innerHTML = UI.memuat(3);
      if (statUrut) statUrut.textContent = `Urutan: ${labelUrutan[urut] || urut}`;

      try {
        const data = await DB.daftarPasienLengkap({
          kata, tipe, kronis, urut, jk, umur, kelengkapan, batas: 300
        });

        const bpjsCount = data.filter(p => p.no_bpjs && p.no_bpjs.trim() !== '' && p.no_bpjs !== '-').length;
        const umumCount = data.length - bpjsCount;

        if (statJumlah) {
          statJumlah.textContent = `Menampilkan ${data.length} pasien (${bpjsCount} BPJS, ${umumCount} Umum)`;
        }

        renderKpiKronis(data.ringkasanKronis || {});
        gambarDaftar(hasil, data, kata, muat);
      } catch (e) {
        hasil.innerHTML = `<div class="banner err">${UI.esc(e.message || e)}</div>`;
        if (statJumlah) statJumlah.textContent = 'Gagal memuat';
      }
    };

    el.querySelector('#cari')?.addEventListener('input', UI.tunda(muat, 280));
    el.querySelector('#fKronis')?.addEventListener('change', muat);
    el.querySelector('#fTipe')?.addEventListener('change', muat);
    el.querySelector('#fUrut')?.addEventListener('change', muat);
    el.querySelector('#fJk')?.addEventListener('change', muat);
    el.querySelector('#fUmur')?.addEventListener('change', muat);
    el.querySelector('#fKelengkapan')?.addEventListener('change', muat);

    el.querySelector('#btnResetFilter')?.addEventListener('click', () => {
      if (el.querySelector('#cari')) el.querySelector('#cari').value = '';
      if (el.querySelector('#fKronis')) el.querySelector('#fKronis').value = 'semua';
      if (el.querySelector('#fTipe')) el.querySelector('#fTipe').value = 'semua';
      if (el.querySelector('#fUrut')) el.querySelector('#fUrut').value = 'kunjungan_terbanyak';
      if (el.querySelector('#fJk')) el.querySelector('#fJk').value = 'semua';
      if (el.querySelector('#fUmur')) el.querySelector('#fUmur').value = 'semua';
      if (el.querySelector('#fKelengkapan')) el.querySelector('#fKelengkapan').value = 'semua';
      muat();
    });

    const btn = el.querySelector('#btnBaru');
    if (btn) btn.addEventListener('click', async () => {
      const p = await modalPasien();
      if (p) App.pergi('#/pasien/' + p.id);
    });

    await muat();
  }

  function gambarDaftar(wadah, data, kata, onMuat) {
    if (!data || !data.length) {
      wadah.innerHTML = UI.kosong(
        kata ? 'Pasien tidak ditemukan' : 'Belum ada data pasien',
        kata ? `Tidak ada pasien yang cocok dengan kriteria pencarian/filter.`
             : 'Data pasien akan muncul di sini setelah pendaftaran pertama.');
      return;
    }

    wadah.innerHTML = `<div class="table-wrap"><table class="tbl">
      <thead>
        <tr>
          <th>No. RM</th>
          <th>Nama Pasien &amp; Status Kronis</th>
          <th>L/P</th>
          <th>Umur &amp; Tgl Lahir</th>
          <th>Kunjungan</th>
          <th>Kepesertaan &amp; Siklus BPJS</th>
          <th>Kontak / NIK</th>
          <th style="width:1%"></th>
        </tr>
      </thead>
      <tbody>${data.map(p => {
        const jmlKunjungan = p.jml_kunjungan || 0;
        const isBpjs = Boolean(p.no_bpjs && p.no_bpjs.trim() !== '' && p.no_bpjs !== '-');
        const badgeKunjunganClass = jmlKunjungan >= 5 ? 'b-ok' : (jmlKunjungan > 0 ? 'b-bpjs' : 'b-umum');
        const adaKurang = p.kekurangan && p.kekurangan.length > 0;
        const kr = p.kronis || {};

        let kronisBadges = '';
        if (kr.is_ht || kr.is_dm) {
          const badgeJenis = `<span class="badge ${kr.is_ht && kr.is_dm ? 'b-dokter' : 'b-info'} text-xs" style="margin-right:4px;">${UI.esc(kr.jenis_kronis)}</span>`;
          let badgeKlaim = '';
          if (isBpjs) {
            if (kr.status_klaim_bpjs === 'SUDAH_KLAIM_6BLN') {
              badgeKlaim = `<span class="badge b-ok text-xs" title="Terakhir klaim BPJS: ${UI.tglPendek(kr.tgl_klaim_bpjs)} (${kr.hari_sejak_klaim} hari lalu)"><span class="dot"></span> Klaim 6 Bln OK</span> `;
            } else {
              badgeKlaim = `<span class="badge b-warn text-xs" title="${kr.tgl_klaim_bpjs ? 'Klaim terakhir ' + kr.hari_sejak_klaim + ' hari lalu (Jatuh tempo)' : 'Belum pernah klaim BPJS'}"><span class="dot"></span> Jatuh Tempo 6 Bln</span> `;
            }
          }
          let badgeHba1c = '';
          if (kr.is_dm) {
            if (kr.status_hba1c === 'TERKONTROL') {
              badgeHba1c = `<span class="badge b-ok text-xs" title="HbA1c: ${kr.nilai_hba1c}% (${UI.tglPendek(kr.tgl_hba1c)}) · Kontrol rutin: 6 Bulan"><span class="dot"></span> HbA1c: ${kr.nilai_hba1c}% (&lt; 7%)</span> `;
            } else if (kr.status_hba1c === 'BELUM_TERKONTROL') {
              badgeHba1c = `<span class="badge b-danger text-xs" title="HbA1c: ${kr.nilai_hba1c}% (${UI.tglPendek(kr.tgl_hba1c)}) · Perhatian: Evaluasi Ulang 3 Bulan"><span class="dot"></span> HbA1c: ${kr.nilai_hba1c}% (&ge; 7%)</span> `;
            } else {
              badgeHba1c = `<span class="badge b-batal text-xs" title="Belum pernah periksa HbA1c · Jadwal rutin: 3/6 Bulan">HbA1c: Belum Tes</span> `;
            }
          }
          kronisBadges = `<div class="flex items-center gap-4 flex-wrap mt-4">${badgeJenis}${badgeKlaim}${badgeHba1c}</div>`;
        }

        return `
        <tr class="clickable" data-id="${p.id}">
          <td class="mono" style="font-weight:700;">${UI.esc(p.no_rm)}</td>
          <td>
            <div><b>${UI.esc(p.nama)}</b> ${p.title ? `<span class="text-xs text-muted">(${UI.esc(p.title)})</span>` : ''}</div>
            ${p.catatan_penting ? `<div class="text-xs text-danger" style="margin-top:2px;">
              ${UI.ikon('peringatan',12)} ${UI.esc(p.catatan_penting)}</div>` : ''}
            ${adaKurang ? `<div class="text-xs text-warn" style="margin-top:2px;" title="${p.kekurangan.join(', ')}">
              ${UI.ikon('peringatan',11)} ${p.kekurangan.length} data belum lengkap</div>` : ''}
            ${kronisBadges}
          </td>
          <td>${p.jenis_kelamin || '—'}</td>
          <td class="nowrap">
            <div>${UI.umurTeks(p.tanggal_lahir)}</div>
            <div class="text-xs text-muted">${UI.tglPendek(p.tanggal_lahir)}</div>
          </td>
          <td class="nowrap">
            <span class="badge ${badgeKunjunganClass}" style="font-weight:700;">
              ${jmlKunjungan}x
            </span>
            ${p.kunjungan_terakhir ? `<div class="text-xs text-muted" style="margin-top:2px;">terakhir ${UI.tglPendek(p.kunjungan_terakhir)}</div>` : ''}
          </td>
          <td>
            ${isBpjs
              ? `<span class="badge b-bpjs" style="font-size:10.5px; padding:2px 6px; margin-right:4px;">BPJS</span><span class="mono text-xs">${UI.esc(p.no_bpjs)}</span>`
              : `<span class="badge b-umum" style="font-size:10.5px; padding:2px 6px;">Umum</span>`
            }
            ${(p.bagian || p.plant) ? `<div class="text-xs text-muted" style="margin-top:2px;">${UI.esc([p.bagian, p.plant].filter(Boolean).join(' - '))}</div>` : ''}
            ${isBpjs && kr.status_klaim_bpjs === 'SUDAH_KLAIM_6BLN' ? `<div class="text-xs text-ok font-bold" style="margin-top:2px;">Klaim Aktif (&le; 6 Bln)</div>` : ''}
            ${isBpjs && (kr.status_klaim_bpjs === 'JATUH_TEMPO_6BLN' || kr.status_klaim_bpjs === 'BELUM_KLAIM') ? `<div class="text-xs text-danger font-bold" style="margin-top:2px;">Jatuh Tempo 6 Bln</div>` : ''}
          </td>
          <td class="muted">
            <div>${UI.esc(p.no_hp || p.no_telp || '—')}</div>
            ${p.nik ? `<div class="mono text-xs text-muted">NIK: ${UI.esc(p.nik)}</div>` : ''}
          </td>
          <td class="text-right whitespace-nowrap">
            <button class="btn btn-ghost btn-sm text-danger btn-hapus-pasien" data-id="${p.id}" data-nama="${UI.esc(p.nama)}" data-rm="${UI.esc(p.no_rm)}" title="Hapus Pasien">
              ${UI.ikon('hapus',15)}
            </button>
          </td>
        </tr>`;
      }).join('')}</tbody></table></div>`;

    wadah.querySelectorAll('tbody tr').forEach(tr => {
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.btn-hapus-pasien')) return;
        const id = tr.dataset.id;
        if (id) location.hash = '#/pasien/' + id;
      });
    });

    wadah.querySelectorAll('.btn-hapus-pasien').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const nama = btn.dataset.nama || 'pasien ini';
        const noRm = btn.dataset.rm ? ` (No. RM: ${btn.dataset.rm})` : '';
        if (!await UI.konfirmasi('Hapus Pasien', `Yakin ingin menghapus data pasien "${nama}"${noRm}? Data yang dihapus tidak dapat dikembalikan.`, 'Hapus')) return;
        try {
          await DB.hapusPasien(id);
          UI.toast('Data pasien berhasil dihapus.', 'ok');
          if (typeof onMuat === 'function') onMuat();
        } catch (err) {
          UI.toast('Gagal menghapus pasien: ' + (err.message || err), 'err');
        }
      });
    });
  }

  function gambarDaftarKurang(wadah, data, onMuat) {
    if (!data.length) {
      wadah.innerHTML = `<div class="empty compact">
        ${UI.ikon('cek', 40)}
        <h3>Semua data pasien sudah lengkap</h3>
        <p>Tidak ada pasien yang kekurangan data untuk bridging nanti.</p></div>`;
      return;
    }
    wadah.innerHTML = `
      <div class="banner warn mt-14 mx-16 mb-0">
        <div>${data.length} pasien punya data yang nanti dibutuhkan bridging tapi belum terisi.
        Melengkapinya sekarang jauh lebih ringan daripada menumpuk sampai hari go-live.</div>
      </div>
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>No. RM</th><th>Nama</th><th>Kunjungan</th>
          <th>Yang belum lengkap</th><th style="width:1%"></th></tr></thead>
        <tbody>${data.map(p => `
          <tr class="clickable" data-id="${p.id}">
            <td class="mono">${UI.esc(p.no_rm)}</td>
            <td><b>${UI.esc(p.nama)}</b></td>
            <td class="muted nowrap">${p.jml_kunjungan}x
              ${p.kunjungan_terakhir ? `<div class="text-xs">terakhir ${UI.tglPendek(p.kunjungan_terakhir)}</div>` : ''}</td>
            <td>${p.kekurangan.map(k =>
              `<div class="text-sm text-warn">${UI.ikon('peringatan',12)} ${UI.esc(k)}</div>`).join('')}</td>
            <td class="text-right whitespace-nowrap">
              <button class="btn btn-ghost btn-sm text-danger btn-hapus-pasien" data-id="${p.id}" data-nama="${UI.esc(p.nama)}" data-rm="${UI.esc(p.no_rm)}" title="Hapus Pasien">
                ${UI.ikon('hapus',15)}
              </button>
            </td>
          </tr>`).join('')}</tbody></table></div>`;

    wadah.querySelectorAll('tbody tr').forEach(tr => {
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.btn-hapus-pasien')) return;
        const id = tr.dataset.id;
        if (id) location.hash = '#/pasien/' + id;
      });
    });

    wadah.querySelectorAll('.btn-hapus-pasien').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const nama = btn.dataset.nama || 'pasien ini';
        const noRm = btn.dataset.rm ? ` (No. RM: ${btn.dataset.rm})` : '';
        if (!await UI.konfirmasi('Hapus Pasien', `Yakin ingin menghapus data pasien "${nama}"${noRm}? Data yang dihapus tidak dapat dikembalikan.`, 'Hapus')) return;
        try {
          await DB.hapusPasien(id);
          UI.toast('Data pasien berhasil dihapus.', 'ok');
          if (typeof onMuat === 'function') onMuat();
        } catch (err) {
          UI.toast('Gagal menghapus pasien: ' + (err.message || err), 'err');
        }
      });
    });
  }

  async function detail(el, id) {
    const [p, alergi, riwayat, kesiapan, riwayatLab, infoKronisSemua] = await Promise.all([
      DB.pasien(id), DB.alergiPasien(id), DB.daftarKunjungan({ pasien_id: id, batas: 50 }),
      DB.kesiapanPasien({ hanyaKurang: false, pasienId: id }).catch(() => []),
      DB.riwayatLabPasien(id),
      DB.dataKronisBpjsPasien().catch(() => null)
    ]);
    const kurang = kesiapan[0]?.kekurangan || [];
    const kronisPasien = infoKronisSemua?.mapPasien?.get(id) || null;
    DB.catatAkses(id, 'Membuka halaman data pasien');

    // Transformasi data untuk tabel matriks: Baris = Nama Tes, Kolom = Tanggal
    const labTgl = [];
    const labParams = {};
    for (let h of riwayatLab) {
      if (!labTgl.find(t => t.id === h.permintaan_id)) {
        labTgl.push({ id: h.permintaan_id, tgl: h.tanggal });
      }
      if (!labParams[h.kode]) {
        let rujukan = h.rujukan_teks || '';
        if (!rujukan && (h.rujukan_bawah !== null || h.rujukan_atas !== null)) {
          if (h.rujukan_bawah !== null && h.rujukan_atas !== null) {
            rujukan = `${h.rujukan_bawah} - ${h.rujukan_atas}`;
          } else if (h.rujukan_bawah !== null) {
            rujukan = `> ${h.rujukan_bawah}`;
          } else if (h.rujukan_atas !== null) {
            rujukan = `< ${h.rujukan_atas}`;
          }
        }
        labParams[h.kode] = { kode: h.kode, nama: h.nama, satuan: h.satuan || '', rujukan: rujukan, hasil: {} };
      }
      labParams[h.kode].hasil[h.permintaan_id] = {
        angka: h.nilai_angka,
        teks: h.nilai_teks,
        tanda: h.tanda
      };
    }
    // Urutkan tanggal dari lama ke baru untuk tren
    labTgl.sort((a,b) => a.tgl.localeCompare(b.tgl));

    let tabelStatistik = '';
    let chartGridHtml = '';
    if (labTgl.length > 0) {
      tabelStatistik = `
        <div class="card mb-16">
          <div class="card-head"><h2>Perbandingan Riwayat Statistik Lab</h2></div>
          <div class="card-body tight" style="overflow-x: auto;">
            <table class="tbl">
              <thead>
                <tr>
                  <th>Pemeriksaan</th>
                  <th>Nilai Rujukan</th>
                  ${labTgl.map(t => `<th class="right nowrap"><b>${UI.tglPendek(t.tgl)}</b></th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${Object.values(labParams).map(p => `
                  <tr>
                    <td class="nowrap"><b>${UI.esc(p.nama)}</b> <span class="text-xs text-muted">${UI.esc(p.satuan)}</span></td>
                    <td class="nowrap text-muted">${UI.esc(p.rujukan)}</td>
                    ${labTgl.map(t => {
                      const h = p.hasil[t.id];
                      if (!h) return '<td class="right muted">—</td>';
                      const val = h.angka !== null ? h.angka : h.teks;
                      const isAbnormal = h.tanda === 'T' || h.tanda === 'R' || h.tanda === 'H' || h.tanda === 'L' || h.tanda === '*';
                      return `<td class="right ${isAbnormal ? 'text-danger fw-bold' : ''}">${UI.esc(val)}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      chartGridHtml = `
        <div class="card mb-16">
          <div class="card-head"><h2>Visualisasi Tren Lab</h2></div>
          <div class="card-body">
            <div id="chart-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
            </div>
          </div>
        </div>
      `;
    }

    // Kartu Pemantauan Kronis BPJS 6 Bulan & HbA1c
    let kartuKronisHtml = '';
    if (kronisPasien && (kronisPasien.is_ht || kronisPasien.is_dm || (p.no_bpjs && kronisPasien.status_klaim_bpjs !== 'NON_BPJS'))) {
      const isAktifKlaim = kronisPasien.status_klaim_bpjs === 'SUDAH_KLAIM_6BLN';
      const sisaHari = kronisPasien.hari_sejak_klaim !== null ? (180 - kronisPasien.hari_sejak_klaim) : null;

      kartuKronisHtml = `
        <div class="card mb-16" style="border-left: 4px solid var(--brand-700);">
          <div class="card-head" style="flex-wrap:wrap; gap:8px;">
            <div>
              <h2>Pemantauan Pasien Kronis &amp; Evaluasi BPJS 6 Bulan (Prolanis)</h2>
              <div class="sub">Pengecekan otomatis kelayakan klaim berkala (siklus 6 bulan) dan kontrol glikemik HbA1c (target &lt; 7.0%)</div>
            </div>
            <span class="badge ${kronisPasien.is_ht && kronisPasien.is_dm ? 'b-dokter' : 'b-info'} font-bold">
              ${UI.esc(kronisPasien.jenis_kronis)}
            </span>
          </div>
          <div class="card-body">
            <div class="grid grid-2 gap-16">
              <!-- Sisi Kiri: Siklus Klaim BPJS 6 Bulan -->
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
                <div class="flex items-center justify-between mb-8">
                  <span class="text-xs font-bold uppercase text-muted">Siklus Klaim BPJS 6 Bulan</span>
                  <span class="badge ${isAktifKlaim ? 'b-ok' : 'b-danger'} font-bold">
                    ${isAktifKlaim ? 'Klaim Aktif (Layak Layanan)' : 'Jatuh Tempo / Belum Klaim'}
                  </span>
                </div>
                <div class="text-sm">
                  <div class="flex justify-between py-4 border-b">
                    <span class="text-muted">No. Kartu BPJS:</span>
                    <b class="mono">${UI.esc(p.no_bpjs || '—')}</b>
                  </div>
                  <div class="flex justify-between py-4 border-b">
                    <span class="text-muted">Klaim Terakhir:</span>
                    <b>${kronisPasien.tgl_klaim_bpjs ? UI.tglIndo(kronisPasien.tgl_klaim_bpjs) : '<span class="text-muted">Belum pernah klaim</span>'}</b>
                  </div>
                  <div class="flex justify-between py-4 border-b">
                    <span class="text-muted">Masa Sejak Klaim:</span>
                    <b>${kronisPasien.hari_sejak_klaim !== null ? kronisPasien.hari_sejak_klaim + ' hari yang lalu' : '—'}</b>
                  </div>
                  <div class="flex justify-between py-4">
                    <span class="text-muted">Status Kelayakan:</span>
                    <span class="${isAktifKlaim ? 'text-ok font-bold' : 'text-danger font-bold'}">
                      ${isAktifKlaim 
                        ? `Masih dalam periode 6 bulan (${sisaHari} hari sisa masa berlaku)` 
                        : (kronisPasien.hari_sejak_klaim !== null 
                            ? `Jatuh tempo (terlewat ${kronisPasien.hari_sejak_klaim - 180} hari dari siklus 6 bulan)` 
                            : 'Belum ada catatan klaim BPJS')}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Sisi Kanan: Evaluasi HbA1c -->
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
                <div class="flex items-center justify-between mb-8">
                  <span class="text-xs font-bold uppercase text-muted">Evaluasi HbA1c Pasien Diabetes</span>
                  ${kronisPasien.status_hba1c === 'TERKONTROL' 
                    ? '<span class="badge b-ok font-bold"><span class="dot"></span> Terkontrol (&lt; 7.0%)</span>' 
                    : (kronisPasien.status_hba1c === 'BELUM_TERKONTROL' 
                        ? '<span class="badge b-danger font-bold"><span class="dot"></span> Perlu Evaluasi (&ge; 7.0%)</span>' 
                        : '<span class="badge b-batal">Belum Ada Hasil Tes</span>')}
                </div>
                <div class="text-sm">
                  <div class="flex justify-between py-4 border-b">
                    <span class="text-muted">Nilai HbA1c Terakhir:</span>
                    <b style="font-size:16px; color:${kronisPasien.status_hba1c === 'TERKONTROL' ? '#15803d' : (kronisPasien.status_hba1c === 'BELUM_TERKONTROL' ? '#b91c1c' : 'inherit')};">
                      ${kronisPasien.nilai_hba1c !== null ? kronisPasien.nilai_hba1c + ' %' : '—'}
                    </b>
                  </div>
                  <div class="flex justify-between py-4 border-b">
                    <span class="text-muted">Tanggal Tes Terakhir:</span>
                    <b>${kronisPasien.tgl_hba1c ? UI.tglIndo(kronisPasien.tgl_hba1c) : '—'}</b>
                  </div>
                  <div class="flex justify-between py-4 border-b">
                    <span class="text-muted">Target Kontrol Klinis:</span>
                    <b>&lt; 7.0 %</b>
                  </div>
                  <div class="flex justify-between py-4">
                    <span class="text-muted">Rekomendasi Kontrol:</span>
                    <b class="${kronisPasien.status_hba1c === 'BELUM_TERKONTROL' ? 'text-warn' : 'text-ok'}">
                      ${kronisPasien.siklus_rekomendasi_hba1c}
                    </b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    el.innerHTML = `
      <a href="#/pasien" class="btn btn-ghost btn-sm mb-12">${UI.ikon('kembali',15)} Semua pasien</a>

      <div class="patient-bar">
        <div class="pb-avatar">${UI.inisial(p.nama)}</div>
        <div class="pb-main">
          <b>${UI.esc(p.nama)}</b>
          <span>No. RM ${UI.esc(p.no_rm)} · ${p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} ·
                ${UI.umurTeks(p.tanggal_lahir)}</span>
        </div>
        <div class="pb-meta">
          <div><span class="k">Tanggal lahir</span><span class="v">${UI.tglPendek(p.tanggal_lahir)}</span></div>
          <div><span class="k">NIK</span><span class="v">${UI.esc(p.nik || '—')}</span></div>
          <div><span class="k">No. BPJS</span><span class="v">${UI.esc(p.no_bpjs || '—')}</span></div>
          <div><span class="k">Kunjungan</span><span class="v">${riwayat.length}x</span></div>
        </div>
        ${p.catatan_penting ? `<div class="alert-allergy">
          ${UI.ikon('peringatan',15)} ${UI.esc(p.catatan_penting)}</div>` : ''}
      </div>

      ${kurang.length ? `<div class="banner warn no-print">
        ${UI.ikon('peringatan',16)}
        <div><b>Data pasien belum lengkap untuk bridging nanti.</b>
        ${kurang.map(k => UI.esc(k)).join(' · ')}.
        Belum menghambat pelayanan hari ini, tapi sebaiknya dilengkapi saat pasien datang
        berikutnya.</div></div>` : ''}

      <div class="btn-group mb-16 no-print">
        ${App.boleh('pasien_simpan')
          ? `<button class="btn btn-primary btn-sm" id="btnDaftarkan">${UI.ikon('plus',15)} Daftarkan kunjungan</button>
             <button class="btn btn-secondary btn-sm" id="btnUbah">Ubah data</button>` : ''}
        ${App.boleh('pasien_alergi')
          ? `<button class="btn btn-secondary btn-sm" id="btnAlergi">Tambah alergi</button>` : ''}
      </div>

      ${kartuKronisHtml}
      ${tabelStatistik}
      ${chartGridHtml}

      <div class="split">
        <div class="card">
          <div class="card-head"><h2>Riwayat kunjungan</h2>
            <span class="text-sm text-muted">${riwayat.length} kunjungan</span></div>
          <div class="card-body tight">
            ${riwayat.length === 0
              ? UI.kosong('Belum ada kunjungan', 'Riwayat pemeriksaan akan tampil setelah kunjungan pertama.')
              : `<div class="table-wrap"><table class="tbl">
                  <thead><tr><th>Tanggal</th><th>Pengirim</th><th>Status</th><th></th></tr></thead>
                  <tbody>${riwayat.map(k => `
                    <tr class="clickable" onclick="location.hash='#/rekam/${k.id}'">
                      <td class="nowrap"><b>${UI.tglPendek(k.tanggal)}</b>
                        <div class="text-xs text-muted mono">${UI.esc(k.no_kunjungan)}</div></td>
                      <td class="muted">${UI.esc(k.nama_dokter || '—')}</td>
                      <td>${UI.badgeStatus(k.status)}</td>
                      <td>${UI.ikon('kembali',14)}</td>
                    </tr>`).join('')}</tbody></table></div>`}
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-head"><h2>Alergi</h2></div>
            <div class="card-body">
              ${alergi.length === 0
                ? '<p class="text-muted text-sm mb-0">Belum ada alergi tercatat.</p>'
                : alergi.map(a => `
                  <div class="list-row">
                    <div class="flex items-center gap-8">
                      <b class="flex-1">${UI.esc(a.nama)}</b>
                      <span class="badge ${a.tingkat === 'BERAT' ? 'b-danger' : 'b-warn'}">${UI.esc(a.tingkat || a.jenis)}</span>
                    </div>
                    ${a.reaksi ? `<div class="text-xs text-muted">Reaksi: ${UI.esc(a.reaksi)}</div>` : ''}
                  </div>`).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h2>Identitas lengkap</h2></div>
            <div class="card-body text-sm">
              ${[['Title / Sapaan', p.title],
                 ['NRP', p.nrp],
                 ['Bagian', p.bagian],
                 ['Plant', p.plant],
                 ['Tempat lahir', p.tempat_lahir], ['Agama', p.agama], ['Pekerjaan', p.pekerjaan],
                 ['Pendidikan', p.pendidikan], ['Status kawin', p.status_kawin],
                 ['Gol. darah', p.gol_darah],
                 ['Alamat', [p.alamat, p.rt && 'RT ' + p.rt, p.rw && 'RW ' + p.rw,
                             p.kelurahan, p.kecamatan, p.kabupaten].filter(Boolean).join(', ')],
                 ['Telp', p.no_telp],
                 ['No. HP', p.no_hp],
                 ['Penanggung jawab', p.pj_nama ? `${p.pj_nama}${p.pj_hubungan ? ' (' + p.pj_hubungan + ')' : ''}` : null]
                ].map(([k, v]) => `<div class="kv-row">
                    <span class="k text-muted">${UI.esc(k)}</span>
                    <span class="v">${UI.esc(v || '—')}</span></div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;

    const btnUbah = el.querySelector('#btnUbah');
    if (btnUbah) btnUbah.addEventListener('click', async () => {
      if (await modalPasien(p)) App.segarkan();
    });

    const btnDaftar = el.querySelector('#btnDaftarkan');
    if (btnDaftar) btnDaftar.addEventListener('click', () => App.pergi('#/pendaftaran/' + p.id));

    const btnAlergi = el.querySelector('#btnAlergi');
    if (btnAlergi) btnAlergi.addEventListener('click', async () => {
      const hasil = await UI.modal({
        judul: 'Tambah catatan alergi',
        isi: `<div class="field"><label>Jenis</label>
                <select name="jenis"><option value="OBAT">Obat</option>
                <option value="MAKANAN">Makanan</option><option value="LAINNYA">Lainnya</option></select></div>
              <div class="field"><label>Nama alergen <span class="req">*</span></label>
                <input type="text" name="nama" placeholder="Contoh: Amoxicillin"></div>
              <div class="field"><label>Reaksi yang timbul</label>
                <input type="text" name="reaksi" placeholder="Contoh: Gatal, bengkak, sesak"></div>
              <div class="field mb-0"><label>Tingkat</label>
                <select name="tingkat"><option value="RINGAN">Ringan</option>
                <option value="SEDANG">Sedang</option><option value="BERAT">Berat</option></select></div>`,
        tombol: [{ teks: 'Batal', nilai: null },
                 { teks: 'Simpan', kelas: 'btn-primary', aksi: (b) => {
                    const d = UI.nilaiForm(b);
                    if (!d.nama) { UI.toast('Nama alergen wajib diisi.', 'err'); return false; }
                    return d;
                 }}]
      });
      if (hasil) {
        await DB.tambahAlergi({ ...hasil, pasien_id: p.id, dicatat_oleh: App.siapa().id });
        UI.toast('Alergi tercatat.', 'ok'); App.segarkan();
      }
    });

    if (labTgl.length > 0) {
      const container = el.querySelector('#chart-container');
      const labels = labTgl.map(t => UI.tglPendek(t.tgl));
      
      let chartCount = 0;
      Object.values(labParams).forEach(paramData => {
        const dataPoints = labTgl.map(t => {
          const h = paramData.hasil[t.id];
          if (!h) return null;
          if (h.angka !== null) return h.angka;
          const n = parseFloat(h.teks);
          return !isNaN(n) && isFinite(n) ? n : null;
        });

        // Hanya buat grafik jika ada setidaknya satu titik data yang bisa digambar
        if (dataPoints.some(d => d !== null)) {
          chartCount++;
          const cid = 'c' + Math.random().toString(36).substr(2, 9);
          const div = document.createElement('div');
          div.style = 'border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: #fff;';
          div.innerHTML = `<h3 style="margin: 0 0 10px; font-size: 14px;">${UI.esc(paramData.nama)} ${paramData.satuan ? '<span class="text-muted text-xs">('+UI.esc(paramData.satuan)+')</span>' : ''}</h3>
                           <canvas id="${cid}" style="max-height: 150px;"></canvas>`;
          container.appendChild(div);

          setTimeout(() => {
            const ctx = document.getElementById(cid).getContext('2d');
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [{
                  data: dataPoints,
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  pointBackgroundColor: 'rgb(75, 192, 192)',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  tension: 0.2,
                  spanGaps: true
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } }
              }
            });
          }, 50);
        }
      });
      
      // Sembunyikan container jika tidak ada satupun tes yang berupa angka
      if (chartCount === 0) {
        container.parentElement.parentElement.style.display = 'none';
      }
    }
  }

  return { render, formIdentitas, modalPasien, validasi };
})();
