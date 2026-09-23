/* ===================== LAB & PENUNJANG =====================
   Tiga hal dalam satu halaman, karena ketiganya dikerjakan orang yang sama:

     Antrean lab   — permintaan dokter, pengisian hasil, penutupan lembar
     Bacaan        — hasil baca rontgen gigi / EKG / USG per pasien
     Arsip berkas  — register berkas fisik beserta nomor arsipnya

   Tidak ada tombol unggah di mana pun, dan itu memang disengaja. Alasan
   lengkapnya ada di kepala sql/11_penunjang.sql; ringkasnya: yang bernilai
   medis adalah angka dan bacaannya, dan keduanya muat di database tanpa
   menyentuh kuota penyimpanan berkas.
   =========================================================== */
const Lab = (() => {

  let master = [];        // ref_lab + nilai rujukannya
  let paket = [];
  let gigiRef = [];
  let tabAktif = 'antrean';
  let rentang = { dari: null, sampai: null };

  const bolehIsi   = () => App.boleh('lab');
  const bolehBaca  = () => App.boleh('bacaan');
  const bolehArsip = () => App.boleh('lampiran');
  // Membuka kunci lembar hasil yang sudah selesai: sengaja hardcode master
  // (sama seperti lab_buka_kunci() di sql/11_penunjang.sql), bukan lewat
  // kode hak akses yang bisa diatur — ini jalan darurat koreksi dokumen
  // medis terkunci, bukan pekerjaan sehari-hari peran mana pun.
  const adminSaja  = () => App.siapa() && App.siapa().peran === 'master';

  const TAB = {
    hasil: 'Hasil Pemeriksaan',
    fisik: 'Hasil Fisik',
    anamnesa: 'Hasil Anamnesa',
    antrean: 'Antrean lab'
  };

  /* ================================================================== */
  /*  Kerangka                                                          */
  /* ================================================================== */
  async function render(el, param) {
    if (param && param[0] === 'hasil' && param[1]) return await layarHasil(el, param[1]);
    if (param && param[0] && TAB[param[0]]) tabAktif = param[0];
    if (!TAB[tabAktif]) tabAktif = 'antrean';

    if (!master.length) master = await DB.refLab(true);
    if (!paket.length)  paket  = await DB.refLabPaket();

    el.innerHTML = `
      <div class="tabs" id="tabsLab">
        ${Object.entries(TAB).map(([k, t]) =>
          `<button class="tab ${tabAktif === k ? 'on' : ''}" data-t="${k}">${t}</button>`).join('')}
      </div>
      <div id="isiLab">${UI.memuat()}</div>`;

    el.querySelector('#tabsLab').addEventListener('click', (e) => {
      const b = e.target.closest('.tab'); if (!b) return;
      tabAktif = b.dataset.t;
      el.querySelectorAll('#tabsLab .tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      gambarTab(el.querySelector('#isiLab'));
    });
    await gambarTab(el.querySelector('#isiLab'));
  }

  async function gambarTab(w) {
    w.innerHTML = UI.memuat();
    try {
      if (tabAktif === 'hasil')    return await tabHasil(w);
      if (tabAktif === 'fisik')    return await tabFisik(w);
      if (tabAktif === 'anamnesa') return await tabAnamnesa(w);
      if (tabAktif === 'antrean')   return await tabAntrean(w);
      if (tabAktif === 'penunjang') return await tabPenunjang(w);
      if (tabAktif === 'arsip')     return await tabArsip(w);
    } catch (e) {
      console.error(e);
      w.innerHTML = `<div class="banner err"><div>${UI.esc(e.message || e)}</div></div>`;
    }
  }

  /* ================================================================== */
  /*  TAB 1 — Antrean lab                                               */
  /* ================================================================== */
  async function tabAntrean(w) {
    if (!rentang.dari) { rentang.dari = UI.hariIni(); rentang.sampai = UI.hariIni(); }

    w.innerHTML = `
      <div class="page-header">
        <div class="page-heading">
          <h2>Antrean pemeriksaan laboratorium</h2>
          <div class="page-sub">Permintaan dokter dan lembar hasil yang sedang berjalan</div>
        </div>
        ${bolehIsi() ? `<div class="page-actions"><button class="btn btn-secondary btn-sm" id="btnLuar">
          ${UI.ikon('plus',15)} Catat hasil lab luar</button></div>` : ''}
      </div>
      <div class="filter-bar">
        <div class="field"><label>Dari tanggal</label>
          <input type="date" id="fDari" class="control-auto" value="${rentang.dari}"></div>
        <div class="field"><label>Sampai</label>
          <input type="date" id="fSampai" class="control-auto" value="${rentang.sampai}"></div>
        <div class="field"><label>Status</label>
          <select id="fStatus" class="control-auto">
            <option value="AKTIF">Belum selesai</option>
            <option value="">Semua</option>
            <option value="SELESAI">Selesai</option>
            <option value="BATAL">Batal</option>
          </select></div>
        <button class="btn btn-secondary" id="btnMuat">Tampilkan</button>
      </div>
      <div class="card">
        <div class="card-body tight" id="tabelAntrean">${UI.memuat(4)}</div>
      </div>`;

    const muat = async () => {
      rentang.dari   = w.querySelector('#fDari').value   || UI.hariIni();
      rentang.sampai = w.querySelector('#fSampai').value || UI.hariIni();
      const st = w.querySelector('#fStatus').value;
      const filter = st === 'AKTIF' ? ['DIMINTA', 'DIKERJAKAN'] : (st || null);
      const data = await DB.labAntrean(rentang.dari, rentang.sampai, filter);
      gambarAntrean(w.querySelector('#tabelAntrean'), data);
    };
    w.querySelector('#btnMuat').addEventListener('click', muat);
    const btnLuar = w.querySelector('#btnLuar');
    if (btnLuar) btnLuar.addEventListener('click', modalLabLuar);
    await muat();
  }

  function gambarAntrean(t, data) {
    if (!data.length) {
      t.innerHTML = UI.kosong('Tidak ada permintaan',
        'Belum ada pemeriksaan laboratorium pada rentang tanggal ini.');
      return;
    }
    t.innerHTML = `<div class="table-wrap"><table class="tbl">
      <thead><tr>
        <th>No. lembar</th><th>Pasien</th><th>Diminta</th>
        <th>Pemeriksaan</th><th>Temuan</th><th>Status</th>
      </tr></thead><tbody>
      ${data.map(r => {
        const lengkap = r.jml_pemeriksaan > 0 && r.jml_terisi === r.jml_pemeriksaan;
        return `<tr class="clickable" data-id="${r.id}">
          <td><b class="mono">${UI.esc(r.no_lab)}</b>
              <div class="text-muted text-xs">${UI.tglPendek(r.tanggal)}</div></td>
          <td><b>${UI.esc(r.nama_pasien)}</b>
              <div class="text-muted text-xs">
                ${UI.esc(r.no_rm)} · ${r.jenis_kelamin === 'L' ? 'L' : 'P'} ·
                ${UI.umurTeks(r.tanggal_lahir)}</div></td>
          <td>${r.asal === 'EKSTERNAL'
                ? `<span class="badge b-info">Lab luar</span>
                   <div class="text-muted text-xs">${UI.esc(r.nama_lab_luar || '-')}</div>`
                : `${UI.esc(r.nama_dokter || '-')}
                   <div class="text-muted text-xs">${UI.esc(r.nama_poli || '-')}</div>`}</td>
          <td class="num">${r.jml_terisi} / ${r.jml_pemeriksaan}
              ${r.ada_fisik ? '<span class="badge b-info text-xs ml-4" style="font-size:10px;padding:1px 5px;" title="Ada Pemeriksaan Fisik">Fisik</span>' : ''}
              ${lengkap ? '' : '<div class="text-muted text-xs">belum lengkap</div>'}</td>
          <td>${r.jml_kritis > 0
                ? `<span class="badge b-danger">${r.jml_kritis} nilai kritis</span>`
                : r.jml_tak_normal > 0
                  ? `<span class="badge b-warn">${r.jml_tak_normal} di luar rujukan</span>`
                  : (r.jml_terisi > 0 ? '<span class="badge b-ok">Dalam batas</span>' : '<span class="text-muted">—</span>')}</td>
          <td>${lencanaStatus(r.status)}</td>
        </tr>`;
      }).join('')}</tbody></table></div>`;

    t.querySelectorAll('tr[data-id]').forEach(tr =>
      tr.addEventListener('click', () => App.pergi('#/lab/hasil/' + tr.dataset.id)));
  }

  const lencanaStatus = (s) => ({
    DIMINTA:    '<span class="badge b-menunggu"><span class="dot"></span>Diminta</span>',
    DIKERJAKAN: '<span class="badge b-periksa"><span class="dot"></span>Dikerjakan</span>',
    SELESAI:    '<span class="badge b-selesai"><span class="dot"></span>Selesai</span>',
    BATAL:      '<span class="badge b-batal"><span class="dot"></span>Batal</span>'
  }[s] || UI.esc(s));

  /* ================================================================== */
  /*  Layar pengisian hasil                                             */
  /* ================================================================== */
  async function layarHasil(el, id) {
    if (!master.length) master = await DB.refLab(false);
    const p = await DB.labPermintaan(id);
    DB.catatAkses(p.pasien_id, 'Membuka lembar hasil laboratorium ' + p.no_lab);

    const terkunci = p.status === 'SELESAI' || p.status === 'BATAL' || !bolehIsi();
    const umurBln = LabCore.umurBulan(p.pasien.tanggal_lahir, p.tanggal);
    const ringkas = LabCore.ringkasLembar(p.hasil);

    /* Nilai rujukan yang berlaku untuk pasien ini, dihitung sekali di depan
       supaya tidak dicari ulang tiap kali satu angka diketik. */
    const rujukanPakai = {};
    p.hasil.forEach(h => {
      const m = master.find(x => x.id === h.lab_id);
      if (!m) { rujukanPakai[h.id] = null; return; }
      const jk = p.pasien.jenis_kelamin;
      if (m.rujukan && m.rujukan.length > 0) {
        rujukanPakai[h.id] = LabCore.pilihRujukan(m.rujukan, jk, umurBln);
      } else {
        const bBawah = jk === 'P' && m.min_p != null ? m.min_p : (jk === 'L' && m.min_l != null ? m.min_l : m.min_normal);
        const bAtas  = jk === 'P' && m.max_p != null ? m.max_p : (jk === 'L' && m.max_l != null ? m.max_l : m.max_normal);
        const tNormal = jk === 'P' && m.normal_p ? m.normal_p : (jk === 'L' && m.normal_l ? m.normal_l : m.nilai_normal);
        rujukanPakai[h.id] = {
          batas_bawah: bBawah != null ? bBawah : null,
          batas_atas:  bAtas != null ? bAtas : null,
          teks: tNormal || ''
        };
      }
    });

    const grup = LabCore.kelompokkan(
      p.hasil.map(h => Object.assign({}, h, { kelompok: h.ref && h.ref.kelompok })), master);

    el.innerHTML = `
      <a href="#/lab" class="btn btn-ghost btn-sm mb-12 no-print">${UI.ikon('kembali',15)} Antrean lab</a>

      <div class="patient-bar">
        <div class="pb-avatar">${UI.inisial(p.pasien.nama)}</div>
        <div class="pb-main">
          <b>${UI.esc(p.pasien.nama)}</b>
          <span>No. RM ${UI.esc(p.pasien.no_rm)} ·
            ${p.pasien.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} ·
            ${UI.umurTeks(p.pasien.tanggal_lahir)}</span>
        </div>
        <div class="pb-meta">
          <div><span class="k">No. lembar</span><span class="v mono">${UI.esc(p.no_lab)}</span></div>
          <div><span class="k">Tanggal</span><span class="v">${UI.tglPendek(p.tanggal)}</span></div>
          <div><span class="k">Asal</span><span class="v">${p.asal === 'EKSTERNAL'
                ? UI.esc(p.nama_lab_luar || 'Lab luar') : 'Lab klinik'}</span></div>
          <div><span class="k">Status</span><span class="v">${lencanaStatus(p.status)}</span></div>
        </div>
      </div>

      ${p.status === 'SELESAI' ? `<div class="banner ok no-print">${UI.ikon('cek',16)}
        <div><b>Lembar hasil sudah ditutup</b>
        ${p.waktu_selesai ? 'pada ' + UI.tglIndo(p.waktu_selesai) + ' ' + UI.jam(p.waktu_selesai) : ''}
        ${p.penutup ? ' oleh ' + UI.esc(p.penutup.nama) : ''}.
        Isinya tidak dapat diubah lagi.
        ${adminSaja() ? 'Buka kunci bila memang ada koreksi — alasannya akan tercatat.' : ''}</div></div>` : ''}
      ${p.status === 'BATAL' ? `<div class="banner err no-print">${UI.ikon('peringatan',16)}
        <div><b>Lembar ini dibatalkan.</b> ${UI.esc(p.alasan_batal || '')}</div></div>` : ''}
      ${!bolehIsi() && p.status !== 'SELESAI' ? `<div class="banner info no-print">${UI.ikon('peringatan',16)}
        <div>Anda membuka halaman ini sebagai ${UI.esc(App.siapa().peran)}.
        Hasil laboratorium hanya dapat diisi perawat atau dokter, jadi halaman ini
        ditampilkan untuk dibaca saja.</div></div>` : ''}
      ${p.catatan_klinis ? `<div class="banner info no-print">${UI.ikon('rekam',16)}
        <div><b>Keterangan dari dokter:</b> ${UI.esc(p.catatan_klinis)}</div></div>` : ''}
      ${ringkas.kritis > 0 ? `<div class="banner err">${UI.ikon('peringatan',16)}
        <div><b>${ringkas.kritis} nilai kritis pada lembar ini.</b>
        Nilai kritis perlu segera diberitahukan ke dokter yang meminta, tidak menunggu
        pasien kembali.</div></div>` : ''}

      <div class="card">
        <div class="card-head">
          <div class="flex-1"><h2>Hasil pemeriksaan</h2>
            <div class="sub" id="ringkasLembar">${ringkas.terisi} dari ${ringkas.total} terisi</div></div>
          <div class="btn-group no-print" style="align-items: center;">
            <select id="selFormatCetakInt" style="font-size: 12px; padding: 4px; border: 1px solid var(--border); border-radius: 4px; margin-right: 4px;">
              <option value="Format 3(M3)" selected>Format 3(M3)</option>
              <option value="Format 2025">Format 2025</option>
              <option value="Format 5(F4)">Format 5(F4)</option>
              <option value="Format 5(F4)_2">Format 5(F4)</option>
              <option value="Format 4(M4)">Format 4(M4)</option>
              <option value="Format 2(M2)">Format 2(M2)</option>
              <option value="BPJS">BPJS</option>
              <option value="BPJS.2">BPJS.2</option>
              <option value="Inggris PDF">Inggris PDF</option>
            </select>
            <button class="btn btn-secondary btn-sm" id="btnCetak">${UI.ikon('cetak',15)} Cetak</button>
            <button class="btn btn-secondary btn-sm" id="btnFisik" style="background:#2e7d32;color:#fff;">Fisik</button>
            <button class="btn btn-secondary btn-sm" id="btnAnamnesa" style="background:#0288d1;color:#fff;">Anamnesa</button>
            ${p.status === 'SELESAI' && adminSaja()
              ? `<button class="btn btn-secondary btn-sm" id="btnBuka">Buka kunci</button>` : ''}
            ${p.status !== 'SELESAI' && p.status !== 'BATAL' && bolehIsi()
              ? `<button class="btn btn-primary btn-sm" id="btnSelesai"
                   ${ringkas.siapDitutup ? '' : 'disabled'}>Selesaikan lembar</button>` : ''}
            ${p.status !== 'BATAL' && (bolehIsi() || bolehBaca())
              ? `<button class="btn btn-ghost btn-sm" id="btnBatal">Batalkan</button>` : ''}
          </div>
        </div>
        <div class="card-body tight">
          <div class="table-wrap"><table class="tbl">
            <thead><tr>
              <th class="col-w34p">Pemeriksaan</th><th class="col-w20p">Hasil</th>
              <th class="col-w10p">Satuan</th><th class="col-w18p">Nilai rujukan</th>
              <th class="col-w12p">Tanda</th><th class="col-w6p no-print"></th>
            </tr></thead>
            <tbody>
              ${grup.map(g => `
                <tr><td colspan="6" class="group-row">${UI.esc(g.kelompok)}</td></tr>
                ${g.isi.map(h => barisHasil(h, rujukanPakai[h.id], terkunci)).join('')}
              `).join('')}
            </tbody></table></div>
        </div>
        ${p.asal === 'EKSTERNAL' ? `<div class="card-foot text-muted text-sm">
          Hasil dari ${UI.esc(p.nama_lab_luar || 'lab luar')}
          ${p.no_lembar_luar ? '· lembar no. ' + UI.esc(p.no_lembar_luar) : ''}.
          Pemeriksaan ini tidak masuk tagihan karena bukan klinik yang mengerjakannya.
        </div>` : ''}
      </div>`;

    pasangIsian(el, p, rujukanPakai);

    el.querySelector('#btnCetak').addEventListener('click', () => {
      const selFormat = el.querySelector('#selFormatCetakInt');
      cetakLembar(p, rujukanPakai, selFormat ? selFormat.value : 'Format 3(M3)');
    });

    el.querySelector('#btnFisik').addEventListener('click', () => modalFisik(p));
    el.querySelector('#btnAnamnesa').addEventListener('click', () => modalAnamnesa(p));

    const bSelesai = el.querySelector('#btnSelesai');
    if (bSelesai) bSelesai.addEventListener('click', async () => {
      if (!await UI.konfirmasi('Selesaikan lembar hasil?',
        'Setelah ditutup, hasilnya terkunci dan hanya admin yang bisa membukanya kembali.',
        'Selesaikan')) return;
      try {
        await DB.labSelesaikan(p.id);
        UI.toast('Lembar hasil ditutup.');
        App.segarkan();
      } catch (e) { UI.toast(e.message || 'Gagal menutup lembar.', 'err'); }
    });

    const bBuka = el.querySelector('#btnBuka');
    if (bBuka) bBuka.addEventListener('click', async () => {
      const alasan = await modalAlasan('Buka kunci lembar hasil',
        'Alasan koreksi wajib diisi dan akan tersimpan pada lembar ini.');
      if (!alasan) return;
      try {
        await DB.labBukaKunci(p.id, alasan);
        UI.toast('Kunci dibuka. Koreksi sekarang bisa disimpan.');
        App.segarkan();
      } catch (e) { UI.toast(e.message || 'Gagal membuka kunci.', 'err'); }
    });

    const bBatal = el.querySelector('#btnBatal');
    if (bBatal) bBatal.addEventListener('click', async () => {
      const alasan = await modalAlasan('Batalkan lembar hasil',
        'Lembar yang dibatalkan tidak ikut ditagihkan dan tidak muncul di rekam medis.');
      if (!alasan) return;
      try {
        await DB.labBatalkan(p.id, alasan);
        UI.toast('Lembar dibatalkan.');
        App.pergi('#/lab');
      } catch (e) { UI.toast(e.message || 'Gagal membatalkan.', 'err'); }
    });
  }

  /* Satu baris pemeriksaan. Bentuk isiannya mengikuti jenis nilainya:
     angka pakai kotak teks (supaya koma desimal Indonesia bisa diketik
     apa adanya), pilihan pakai daftar, sisanya teks bebas. */
  function barisHasil(h, ruj, terkunci) {
    const m = h.ref || {};
    const nilai = m.jenis_nilai === 'ANGKA'
      ? (h.nilai_angka === null || h.nilai_angka === undefined ? ''
         : LabCore.formatNilai(h.nilai_angka, m.desimal))
      : (h.nilai_teks || '');

    let isian;
    if (terkunci) {
      isian = `<b>${UI.esc(nilai) || '<span class="text-muted">—</span>'}</b>`;
    } else if (m.jenis_nilai === 'PILIHAN') {
      isian = `<select data-hasil="${h.id}" class="w-full">
        <option value="">—</option>
        ${(m.pilihan || []).map(o =>
          `<option ${o === h.nilai_teks ? 'selected' : ''}>${UI.esc(o)}</option>`).join('')}
      </select>`;
    } else {
      isian = `<input type="text" data-hasil="${h.id}" class="w-full ${m.jenis_nilai === 'ANGKA' ? 'text-right' : ''}"
                 inputmode="decimal" value="${UI.esc(nilai)}">`;
    }

    return `<tr data-baris="${h.id}">
      <td>${UI.esc(h.nama)}
          ${m.kode ? `<span class="text-muted mono text-xs"> ${UI.esc(m.kode)}</span>` : ''}</td>
      <td>${isian}</td>
      <td class="muted">${UI.esc(h.satuan || '')}</td>
      <td class="muted mono text-sm">${UI.esc(h.rujukan_teks || LabCore.teksRujukan(ruj, m) || '—')}</td>
      <td data-tanda="${h.id}">${lencanaTanda(h.tanda)}</td>
      <td class="no-print">${m.jenis_nilai === 'ANGKA'
        ? `<button class="btn-icon" data-tren="${h.lab_id}" data-nama="${UI.esc(h.nama)}"
             title="Lihat tren">${UI.ikon('laporan',15)}</button>` : ''}</td>
    </tr>`;
  }

  function lencanaTanda(t) {
    const d = LabCore.TANDA[t] || LabCore.TANDA.BELUM;
    if (t === 'NORMAL') return `<span class="badge b-ok">Normal</span>`;
    if (t === 'BELUM' || !t) return `<span class="text-muted">—</span>`;
    const kelas = d.kelas === 'err' ? 'b-danger' : 'b-warn';
    return `<span class="badge ${kelas}">${UI.esc(d.label)}</span>`;
  }

  /* Menyimpan per baris, saat kotaknya ditinggalkan. Tidak ada tombol
     "Simpan semua": petugas lab mengisi sambil membaca alat, satu angka
     setiap beberapa menit, dan satu tombol di ujung layar berarti
     kehilangan seluruh ketikan kalau tab tertutup di tengah jalan. */
  function pasangIsian(el, p, rujukanPakai) {
    el.querySelectorAll('[data-hasil]').forEach(inp => {
      /* Pratinjau: tanda muncul sambil mengetik, sebelum apa pun dikirim ke
         server. Aturannya kembaran persis dari yang di database (lihat
         kepala js/lab_core.js); yang tersimpan tetap jawaban server. */
      inp.addEventListener('input', () => {
        const id = inp.dataset.hasil;
        const h = p.hasil.find(x => x.id === id);
        const m = h.ref || {};
        const ruj = rujukanPakai[id];
        const tanda = m.jenis_nilai === 'ANGKA'
          ? LabCore.tandaAngka(LabCore.bacaNilai(inp.value, m.desimal), ruj)
          : LabCore.tandaTeks(inp.value, m.teks_normal);
        const sel = el.querySelector(`[data-tanda="${id}"]`);
        if (sel) sel.innerHTML = lencanaTanda(tanda);
      });

      inp.addEventListener('change', async () => {
        const id = inp.dataset.hasil;
        const h = p.hasil.find(x => x.id === id);
        const m = h.ref || {};
        const patch = {};

        if (m.jenis_nilai === 'ANGKA') {
          const n = LabCore.bacaNilai(inp.value, m.desimal);
          if (inp.value.trim() !== '' && n === null) {
            UI.toast('"' + inp.value + '" bukan angka yang bisa dibaca.', 'err');
            inp.focus(); return;
          }
          const salah = LabCore.validasi(m, n, null);
          if (salah) { UI.toast(salah, 'err'); inp.focus(); return; }
          patch.nilai_angka = n; patch.nilai_teks = null;
          inp.value = n === null ? '' : LabCore.formatNilai(n, m.desimal);
        } else {
          const v = inp.value.trim() || null;
          const salah = LabCore.validasi(m, null, v);
          if (salah) { UI.toast(salah, 'err'); inp.focus(); return; }
          patch.nilai_teks = v; patch.nilai_angka = null;
        }

        try {
          const baru = await DB.simpanHasilLab(id, patch);
          Object.assign(h, baru);
          const sel = el.querySelector(`[data-tanda="${id}"]`);
          if (sel) sel.innerHTML = lencanaTanda(baru.tanda);

          const r = LabCore.ringkasLembar(p.hasil);
          const rk = el.querySelector('#ringkasLembar');
          if (rk) rk.textContent = `${r.terisi} dari ${r.total} terisi`;
          const bs = el.querySelector('#btnSelesai');
          if (bs) bs.disabled = !r.siapDitutup;

          if (baru.tanda === 'KRITIS_RENDAH' || baru.tanda === 'KRITIS_TINGGI')
            UI.toast(h.nama + ': nilai kritis. Beri tahu dokter sekarang.', 'err', 8000);
        } catch (e) {
          UI.toast(e.message || 'Gagal menyimpan hasil.', 'err');
        }
      });
    });

    el.querySelectorAll('[data-tren]').forEach(b =>
      b.addEventListener('click', () => modalTren(p.pasien_id, b.dataset.tren, b.dataset.nama)));
  }

  /* ------------------------------------------------------------------ */
  /*  Tren — hanya mungkin karena hasilnya angka, bukan foto lembar      */
  /* ------------------------------------------------------------------ */
  async function modalTren(pasienId, labId, nama) {
    const baris = await DB.labTren(pasienId, labId, 12);
    const deret = LabCore.susunTren(baris).reverse();
    const isi = !deret.length
      ? `<p class="text-muted mb-0">Belum ada hasil terdahulu untuk pemeriksaan ini.</p>`
      : `<div class="table-wrap"><table class="tbl">
          <thead><tr><th>Tanggal</th><th class="num">Hasil</th><th>Rujukan</th>
            <th class="num">Selisih</th><th>Tanda</th></tr></thead>
          <tbody>${deret.map(d => `<tr>
            <td>${UI.tglPendek(d.tanggal)}
                <div class="text-muted mono text-xs">${UI.esc(d.no_lab)}</div></td>
            <td class="num"><b>${UI.esc(String(d.nilai))}</b> ${UI.esc(d.satuan || '')}</td>
            <td class="muted mono text-sm">${UI.esc(d.rujukan_teks || '—')}</td>
            <td class="num">${d.selisih === null ? '<span class="text-muted">—</span>'
              : (d.selisih > 0 ? '+' : '') + UI.esc(String(d.selisih))}</td>
            <td>${lencanaTanda(d.tanda)}</td>
          </tr>`).join('')}</tbody></table></div>`;
    await UI.modal({ judul: 'Tren — ' + nama, isi, lebar: true,
                     tombol: [{ teks: 'Tutup', nilai: true }] });
  }

  async function modalAlasan(judul, penjelasan) {
    return await UI.modal({
      judul,
      isi: `<p class="text-muted mt-0 mb-12">${UI.esc(penjelasan)}</p>
            <div class="field mb-0"><label for="alasan">Alasan</label>
              <textarea id="alasan" rows="3" placeholder="Tulis sejelasnya…"></textarea></div>`,
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan', kelas: 'btn-primary', aksi: (b) => {
            const v = b.querySelector('#alasan').value.trim();
            if (!v) { UI.toast('Alasan wajib diisi.', 'err'); return false; }
            return v;
          } }
      ]
    });
  }

  /* ================================================================== */
  /*  PEMBANTU TATA LETAK & PROSES CETAK DOKUMEN (9 FORMAT)            */
  /* ================================================================== */

  /* Cetak dokumen langsung via iframe tersembunyi tanpa jendela pop-up pratinjau */
  async function cetakDokumen(htmlContent) {
    const bingkai = document.createElement('iframe');
    bingkai.setAttribute('aria-hidden', 'true');
    bingkai.style.cssText = 'position:fixed;right:0;bottom:0;width:210mm;height:297mm;opacity:0;border:0;pointer-events:none;z-index:-1';
    document.body.appendChild(bingkai);

    const bersihkan = () => {
      setTimeout(() => {
        try { bingkai.remove(); } catch (e) {}
      }, 1500);
    };

    await new Promise((siap) => {
      let selesai = false;
      const beres = () => { if (!selesai) { selesai = true; siap(); } };
      bingkai.onload = beres;
      bingkai.srcdoc = htmlContent;
      setTimeout(beres, 2000);
    });

    const w = bingkai.contentWindow;
    if (!w) {
      bersihkan();
      throw new Error('Gagal menyiapkan lembar dokumen cetak.');
    }

    // Tunggu gambar (kop, logo, barcode, QR) siap agar cetak tidak kosong
    try {
      const gambar = Array.from(w.document.images || []);
      if (gambar.length) {
        await Promise.race([
          Promise.all(gambar.map(g => {
            if (g.complete && g.naturalWidth) return Promise.resolve();
            if (g.decode) return g.decode().catch(() => {});
            return new Promise(r => { g.onload = r; g.onerror = r; });
          })),
          new Promise(r => setTimeout(r, 2000))
        ]);
      }
    } catch (e) {}

    try { w.addEventListener('afterprint', bersihkan); } catch (e) {}

    try {
      w.focus();
      w.print();
    } catch (e) {
      bersihkan();
      // Fallback jika iframe diblokir peramban
      const pop = window.open('', '_blank', 'width=880,height=1000');
      if (pop) {
        pop.document.open();
        pop.document.write(htmlContent);
        pop.document.close();
        setTimeout(() => { pop.focus(); pop.print(); }, 800);
      }
    }
    setTimeout(bersihkan, 60000);
    return true;
  }

  function cssCetakDokumen(pageSizeCss, isM2 = false) {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
      * { box-sizing: border-box; }
      body { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 11px; margin: 0; padding: ${isM2 ? '15px' : '24px 30px'}; color: #000; line-height: 1.35; background: #fff; }
      .mono { font-family: 'JetBrains Mono', monospace; }
      
      /* HEADER STYLES */
      .kop-wrapper { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #000; margin-bottom: 14px; }
      .kop-bpjs { display: flex; align-items: center; gap: 12px; flex: 1; }
      .kop-bpjs img { height: 42px; width: auto; object-fit: contain; }
      .kop-center { flex: 1.5; text-align: center; }
      .kop-center img { height: 46px; width: auto; margin-bottom: 2px; }
      .kop-center .brand-title { color: #15803d; font-weight: 800; font-size: 20px; letter-spacing: 1.5px; margin: 0; line-height: 1.1; }
      .kop-center .brand-sub { color: #6b21a8; font-size: 9.5px; font-style: italic; font-weight: 600; }
      .kop-right { flex: 1.2; text-align: right; font-size: 10px; color: #333; line-height: 1.3; }
      .kop-right b { font-size: 11px; color: #000; }
      
      /* 2025 MODERN HEADER */
      .kop-2025 { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); color: #fff; border-radius: 6px; margin-bottom: 16px; }
      .kop-2025 .logo-txt { display: flex; align-items: center; gap: 12px; }
      .kop-2025 .logo-txt img { height: 48px; background: #fff; padding: 3px; border-radius: 4px; }
      .kop-2025 h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; color: #fff; }
      .kop-2025 p { margin: 2px 0 0; font-size: 10px; opacity: 0.9; }
      .kop-2025 .badge-tag { background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; text-align: right; }

      /* PATIENT METADATA */
      .patient-card { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; font-size: 11px; }
      .patient-card-3 { display: grid; grid-template-columns: 1.1fr 1.2fr 1fr; gap: 12px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 11px; }
      .meta-row { display: grid; grid-template-columns: 110px 10px 1fr; margin-bottom: 3px; align-items: baseline; }
      .meta-row .label { color: #475569; font-weight: 500; }
      .meta-row .colon { color: #475569; }
      .meta-row .value { color: #0f172a; font-weight: 600; word-break: break-word; }

      /* BARCODE & STATUS BAR */
      .bar-strip { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 4px 0; border-bottom: 1px dashed #cbd5e1; }
      .bar-strip .barcode-img { height: 32px; width: auto; }
      
      /* TABLE STYLES */
      table.tbl-hasil { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
      table.tbl-hasil thead th { background: #f1f5f9; color: #0f172a; text-transform: uppercase; font-weight: 700; font-size: 10px; padding: 7px 6px; border-top: 1px solid #000; border-bottom: 1px solid #000; text-align: left; }
      table.tbl-hasil thead th.r { text-align: right; }
      table.tbl-hasil thead th.c { text-align: center; }
      table.tbl-hasil tbody tr.grp-row td { background: #fafafa; font-weight: 800; font-size: 11px; text-transform: uppercase; padding: 8px 6px 4px; color: #0f766e; border-bottom: 1px solid #e2e8f0; }
      table.tbl-hasil tbody td { padding: 5px 6px; vertical-align: top; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
      table.tbl-hasil tbody tr:last-child td { border-bottom: 1px solid #000; }
      table.tbl-hasil tbody td.val-col { font-weight: 700; }
      table.tbl-hasil tbody td.abnormal { color: #dc2626; font-weight: 800; }
      .flag-pill { display: inline-block; background: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 9.5px; padding: 1px 5px; border-radius: 3px; }

      /* SIGNATURE & FOOTER */
      .sig-container { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 24px; font-size: 11px; }
      .sig-box { display: flex; flex-direction: column; min-width: 180px; }
      .sig-box .role { font-weight: 700; margin-bottom: 4px; }
      .sig-box .qr { margin: 6px 0; }
      .sig-box .qr img { width: 68px; height: 68px; }
      .sig-box .name { font-weight: 700; font-size: 11.5px; margin-top: 4px; }
      .sig-box .time { font-size: 9.5px; color: #64748b; }

      .footer-note { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9.5px; color: #64748b; display: flex; justify-content: space-between; align-items: flex-end; }
      .footer-note .disclaimer { max-width: 65%; line-height: 1.3; font-style: italic; }

      @media print {
        body { padding: 0 !important; }
      }
      @page { ${pageSizeCss} }
    `;
  }

  function htmlKopCetak(format, p, logoUrl, bpjsLogoUrl) {
    const is2025 = format === 'Format 2025';
    const isBpjs1 = format === 'BPJS';
    const isBpjs2 = format === 'BPJS.2';
    const isEng = format === 'Inggris PDF';

    if (is2025) {
      return `
        <div class="kop-2025">
          <div class="logo-txt">
            <img src="${logoUrl}" onerror="this.style.display='none'">
            <div>
              <h1>LABORATORIUM MEDIS UTAMA</h1>
              <p>Layanan Diagnostik &amp; Patologi Terpadu · Akreditasi Kemenkes RI</p>
              <p style="font-size:9.5px; opacity:0.85;">Jl. DI Panjaitan No. 94, Purbalingga · Telp: 0281-6580099 / 08121482308</p>
            </div>
          </div>
          <div class="badge-tag">
            <div>LAPORAN RESMI 2025</div>
            <div style="font-size:9px; font-weight:400; opacity:0.9;">No: ${UI.esc(p.no_lab)}</div>
          </div>
        </div>
      `;
    }
    if (isBpjs1 || isBpjs2) {
      return `
        <div class="kop-wrapper" style="border-bottom-color:#059669;">
          <div class="kop-bpjs">
            <img src="${bpjsLogoUrl}" onerror="this.style.display='none'">
            <div>
              <div style="font-weight:800; font-size:14px; color:#065f46;">BPJS KESEHATAN</div>
              <div style="font-size:10px; color:#047857;">${isBpjs2 ? 'PROGRAM KRONIS &amp; PROLANIS' : 'LEMBAR HASIL LABORATORIUM'}</div>
            </div>
          </div>
          <div class="kop-center">
            <img src="${logoUrl}" onerror="this.style.display='none'">
            <div class="brand-title">UTAMA</div>
            <div class="brand-sub">Mitra Faskes BPJS Kesehatan</div>
          </div>
          <div class="kop-right">
            <b>Laboratorium Medis UTAMA</b><br>
            Jl. DI Panjaitan No. 94, Purbalingga<br>
            Telp. 0281-6580099
          </div>
        </div>
      `;
    }
    if (isEng) {
      return `
        <div class="kop-wrapper" style="border-bottom-color:#0f766e;">
          <div style="display:flex; align-items:center; gap:12px; flex:1;">
            <img src="${logoUrl}" style="height:50px;" onerror="this.style.display='none'">
            <div>
              <div style="font-weight:800; font-size:16px; color:#0f766e; letter-spacing:1px;">UTAMA MEDICAL LABORATORY</div>
              <div style="font-size:10px; color:#475569; font-weight:600;">CLINICAL DIAGNOSTIC &amp; PATHOLOGY SERVICES</div>
            </div>
          </div>
          <div class="kop-right">
            <b>UTAMA Medical Laboratory Centre</b><br>
            Jl. DI Panjaitan No. 94, Purbalingga, Central Java, Indonesia<br>
            Phone: +62 281 6580099 · Email: laboratoriumutama@yahoo.com
          </div>
        </div>
      `;
    }
    return `
      <div class="kop-wrapper">
        <div class="kop-bpjs">
          <img src="${bpjsLogoUrl}" onerror="this.style.display='none'">
        </div>
        <div class="kop-center">
          <img src="${logoUrl}" onerror="this.style.display='none'">
          <div class="brand-title">UTAMA</div>
          <div class="brand-sub">Kepuasan Anda Prioritas Kami</div>
        </div>
        <div class="kop-right">
          <b>Laboratorium Medis UTAMA</b><br>
          Jl. DI Panjaitan No. 94, Purbalingga<br>
          Telp. 0281-6580099 / 08121482308<br>
          Email : laboratoriumutama@yahoo.com
        </div>
      </div>
    `;
  }

  function htmlPasienCardCetak(format, p, dokterPengirim, instansi) {
    const is2025 = format === 'Format 2025';
    const isBpjs1 = format === 'BPJS';
    const isBpjs2 = format === 'BPJS.2';
    const isEng = format === 'Inggris PDF';
    const jkText = p.pasien.jenis_kelamin === 'L' ? (isEng ? 'Male' : 'Laki-Laki') : (isEng ? 'Female' : 'Perempuan');
    const umurTeks = UI.umurTeks(p.pasien.tanggal_lahir);
    const noBpjs = p.pasien.no_bpjs || '-';

    if (is2025) {
      return `
        <div class="patient-card-3">
          <div>
            <div class="meta-row"><span class="label">No. Lab</span><span class="colon">:</span><span class="value mono">${UI.esc(p.no_lab)}</span></div>
            <div class="meta-row"><span class="label">No. Rekam Medis</span><span class="colon">:</span><span class="value mono">${UI.esc(p.pasien.no_rm)}</span></div>
            <div class="meta-row"><span class="label">NIK</span><span class="colon">:</span><span class="value mono">${UI.esc(p.pasien.nik || '—')}</span></div>
          </div>
          <div>
            <div class="meta-row"><span class="label">Nama Pasien</span><span class="colon">:</span><span class="value" style="font-size:12px; color:#0f766e;">${UI.esc(p.pasien.nama)}</span></div>
            <div class="meta-row"><span class="label">Umur / JK</span><span class="colon">:</span><span class="value">${UI.esc(umurTeks)} / ${jkText}</span></div>
            <div class="meta-row"><span class="label">Alamat</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.alamat || '—')}</span></div>
          </div>
          <div>
            <div class="meta-row"><span class="label">Tgl. Periksa</span><span class="colon">:</span><span class="value">${UI.tglIndo(p.tanggal)}</span></div>
            <div class="meta-row"><span class="label">Pengirim</span><span class="colon">:</span><span class="value">${UI.esc(dokterPengirim)}</span></div>
            <div class="meta-row"><span class="label">Penjamin</span><span class="colon">:</span><span class="value">${UI.esc(instansi)}</span></div>
          </div>
        </div>
      `;
    }
    if (isBpjs1 || isBpjs2) {
      return `
        <div class="patient-card" style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px 14px;">
          <div>
            <div class="meta-row"><span class="label">No. Kartu BPJS</span><span class="colon">:</span><span class="value mono" style="font-size:12px; color:#065f46;">${UI.esc(noBpjs)}</span></div>
            <div class="meta-row"><span class="label">No. Lab</span><span class="colon">:</span><span class="value mono">${UI.esc(p.no_lab)}</span></div>
            <div class="meta-row"><span class="label">Nama Pasien</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.nama)}</span></div>
            <div class="meta-row"><span class="label">No. RM / NIK</span><span class="colon">:</span><span class="value mono">${UI.esc(p.pasien.no_rm)} / ${UI.esc(p.pasien.nik || '—')}</span></div>
          </div>
          <div>
            <div class="meta-row"><span class="label">Tgl. Pemeriksaan</span><span class="colon">:</span><span class="value">${UI.tglIndo(p.tanggal)}</span></div>
            <div class="meta-row"><span class="label">Umur / JK</span><span class="colon">:</span><span class="value">${UI.esc(umurTeks)} / ${jkText}</span></div>
            <div class="meta-row"><span class="label">Dokter Perujuk</span><span class="colon">:</span><span class="value">${UI.esc(dokterPengirim)}</span></div>
            <div class="meta-row"><span class="label">Diagnosa (ICD-10)</span><span class="colon">:</span><span class="value">${UI.esc(p.kunjungan?.diagnosa || '—')}</span></div>
            ${isBpjs2 ? `<div class="meta-row"><span class="label" style="color:#059669; font-weight:700;">Status Prolanis</span><span class="colon">:</span><span class="value" style="color:#059669;">Pemantauan Siklus 6 Bulan</span></div>` : ''}
          </div>
        </div>
      `;
    }
    if (isEng) {
      return `
        <div class="patient-card" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px;">
          <div>
            <div class="meta-row"><span class="label">Lab ID No.</span><span class="colon">:</span><span class="value mono">${UI.esc(p.no_lab)}</span></div>
            <div class="meta-row"><span class="label">Patient Name</span><span class="colon">:</span><span class="value" style="font-size:12px;">${UI.esc(p.pasien.nama)}</span></div>
            <div class="meta-row"><span class="label">MRN / ID</span><span class="colon">:</span><span class="value mono">${UI.esc(p.pasien.no_rm)} / ${UI.esc(p.pasien.nik || '—')}</span></div>
            <div class="meta-row"><span class="label">Address</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.alamat || '—')}</span></div>
          </div>
          <div>
            <div class="meta-row"><span class="label">Date of Test</span><span class="colon">:</span><span class="value">${UI.tglIndo(p.tanggal)}</span></div>
            <div class="meta-row"><span class="label">Age / Gender</span><span class="colon">:</span><span class="value">${UI.esc(umurTeks)} / ${jkText}</span></div>
            <div class="meta-row"><span class="label">Referring Doctor</span><span class="colon">:</span><span class="value">${UI.esc(dokterPengirim)}</span></div>
            <div class="meta-row"><span class="label">Payment Type</span><span class="colon">:</span><span class="value">${UI.esc(instansi)}</span></div>
          </div>
        </div>
      `;
    }
    return `
      <div class="patient-card">
        <div>
          <div class="meta-row"><span class="label">No Lab</span><span class="colon">:</span><span class="value mono"><b>${UI.esc(p.no_lab)}</b></span></div>
          <div class="meta-row"><span class="label">Nama</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.nama)}</span></div>
          <div class="meta-row"><span class="label">Dokter Pengirim</span><span class="colon">:</span><span class="value">${UI.esc(dokterPengirim)}</span></div>
          <div class="meta-row"><span class="label">Alamat</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.alamat || '-')}</span></div>
        </div>
        <div>
          <div class="meta-row"><span class="label">Umur</span><span class="colon">:</span><span class="value">${UI.esc(umurTeks)}</span></div>
          <div class="meta-row"><span class="label">Jenis Kelamin</span><span class="colon">:</span><span class="value">${jkText}</span></div>
          <div class="meta-row"><span class="label">Tgl. Periksa</span><span class="colon">:</span><span class="value">${UI.tglIndo(p.tanggal)}</span></div>
          <div class="meta-row"><span class="label">Instansi</span><span class="colon">:</span><span class="value">${UI.esc(instansi)}</span></div>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------------------------------ */
  async function cetakLembar(p, rujukanPakai, format = 'Format 3(M3)') {
    const out = [];
    const tulis = (s) => out.push(s);

    const f = await DB.faskes().catch(() => null);
    const grup = LabCore.kelompokkan(
      p.hasil.map(h => Object.assign({}, h, { kelompok: h.ref && h.ref.kelompok })), master);

    // Normalisasi nama format untuk kompatibilitas ke belakang
    if (!format || format === 'M3' || format === 'Standar' || format === 'Asli') {
      format = 'Format 3(M3)';
    }

    const nilaiTeks = (h) => {
      const m = h.ref || {};
      if (m.jenis_nilai === 'ANGKA')
        return h.nilai_angka === null || h.nilai_angka === undefined ? '—'
             : LabCore.formatNilai(h.nilai_angka, m.desimal);
      return h.nilai_teks || '—';
    };

    const isAbnormalItem = (h) => {
      const r = rujukanPakai[h.id];
      if (h.tanda && ['T', 'R', 'H', 'L', 'KRITIS_TINGGI', 'KRITIS_RENDAH', '*'].includes(h.tanda)) return true;
      if (typeof isAbnormal === 'function') return isAbnormal(h, r);
      return false;
    };
    
    const dicetakOleh = App.siapa()?.nama || 'Petugas Laboratorium';
    const now = new Date();
    const basePath = window.location.origin + window.location.pathname.replace('app.html', '');
    const bpjsLogoUrl = basePath + 'bpjs.png';
    const logoUrl = basePath + 'logo.png';
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(p.no_lab)}&code=Code128&translate-esc=on&dpi=96`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${encodeURIComponent('Verifikator: dr. Minto Rahaju Sp. PK - No Lab: ' + (p.no_lab || ''))}`;
    const jamSampel = p.waktu_selesai ? p.waktu_selesai.replace('T', ' ').substring(0, 19) : now.toISOString().replace('T', ' ').substring(0, 19);

    const isEng = format === 'Inggris PDF';
    const isBpjs1 = format === 'BPJS';
    const isBpjs2 = format === 'BPJS.2';
    const is2025 = format === 'Format 2025';
    const isF4_1 = format === 'Format 5(F4)';
    const isF4_2 = format === 'Format 5(F4)_2';
    const isM4 = format === 'Format 4(M4)';
    const isM2 = format === 'Format 2(M2)';

    // Penentuan ukuran halaman CSS @page
    let pageSizeCss = 'size: A4 portrait; margin: 10mm 15mm;';
    if (isF4_1 || isF4_2) {
      pageSizeCss = 'size: 215mm 330mm portrait; margin: 12mm 18mm;';
    } else if (isM2) {
      pageSizeCss = 'size: A5 landscape; margin: 8mm 12mm;';
    }

    // Terjemahan nama grup dan item untuk format Inggris
    const translateEn = (nama) => {
      const dict = {
        'HEMATOLOGI': 'HEMATOLOGY',
        'KIMIA KLINIK': 'CLINICAL CHEMISTRY',
        'URINALISA': 'URINALYSIS',
        'IMUNOLOGI & SEROLOGI': 'IMMUNOLOGY & SEROLOGY',
        'MIKROBIOLOGI': 'MICROBIOLOGY',
        'Hemoglobin': 'Hemoglobin (Hb)',
        'Leukosit': 'White Blood Cells (WBC / Leukocytes)',
        'Trombosit': 'Platelets (Thrombocytes)',
        'Hematokrit': 'Hematocrit (Ht)',
        'Eritrosit': 'Red Blood Cells (RBC / Erythrocytes)',
        'Glukosa Puasa': 'Fasting Blood Glucose',
        'Glukosa 2 Jam PP': '2-Hour Postprandial Glucose',
        'Glukosa Sewaktu': 'Random Blood Glucose',
        'HbA1c': 'Hemoglobin A1c (HbA1c)',
        'Kolesterol Total': 'Total Cholesterol',
        'Trigliserida': 'Triglycerides',
        'HDL Kolesterol': 'HDL Cholesterol',
        'LDL Kolesterol': 'LDL Cholesterol',
        'Asam Urat': 'Uric Acid',
        'Ureum': 'Blood Urea Nitrogen (BUN)',
        'Kreatinin': 'Serum Creatinine',
        'SGOT': 'SGOT / AST',
        'SGPT': 'SGPT / ALT'
      };
      return dict[nama] || nama;
    };

    tulis(`<!doctype html><html lang="${isEng ? 'en' : 'id'}"><head><meta charset="utf-8">
      <title>${isEng ? 'Laboratory Examination Result' : 'Hasil Laboratorium'} ${UI.esc(p.no_lab)} - ${UI.esc(format)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 11px; margin: 0; padding: ${isM2 ? '15px' : '24px 30px'}; color: #000; line-height: 1.35; background: #fff; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        
        /* HEADER STYLES */
        .kop-wrapper { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #000; margin-bottom: 14px; }
        .kop-bpjs { display: flex; align-items: center; gap: 12px; flex: 1; }
        .kop-bpjs img { height: 42px; width: auto; object-fit: contain; }
        .kop-center { flex: 1.5; text-align: center; }
        .kop-center img { height: 46px; width: auto; margin-bottom: 2px; }
        .kop-center .brand-title { color: #15803d; font-weight: 800; font-size: 20px; letter-spacing: 1.5px; margin: 0; line-height: 1.1; }
        .kop-center .brand-sub { color: #6b21a8; font-size: 9.5px; font-style: italic; font-weight: 600; }
        .kop-right { flex: 1.2; text-align: right; font-size: 10px; color: #333; line-height: 1.3; }
        .kop-right b { font-size: 11px; color: #000; }
        
        /* 2025 MODERN HEADER */
        .kop-2025 { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); color: #fff; border-radius: 6px; margin-bottom: 16px; }
        .kop-2025 .logo-txt { display: flex; align-items: center; gap: 12px; }
        .kop-2025 .logo-txt img { height: 48px; background: #fff; padding: 3px; border-radius: 4px; }
        .kop-2025 h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; color: #fff; }
        .kop-2025 p { margin: 2px 0 0; font-size: 10px; opacity: 0.9; }
        .kop-2025 .badge-tag { background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; text-align: right; }

        /* PATIENT METADATA */
        .patient-card { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; font-size: 11px; }
        .patient-card-3 { display: grid; grid-template-columns: 1.1fr 1.2fr 1fr; gap: 12px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 11px; }
        .meta-row { display: grid; grid-template-columns: 110px 10px 1fr; margin-bottom: 3px; align-items: baseline; }
        .meta-row .label { color: #475569; font-weight: 500; }
        .meta-row .colon { color: #475569; }
        .meta-row .value { color: #0f172a; font-weight: 600; word-break: break-word; }

        /* BARCODE & STATUS BAR */
        .bar-strip { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 4px 0; border-bottom: 1px dashed #cbd5e1; }
        .bar-strip .barcode-img { height: 32px; width: auto; }
        
        /* TABLE STYLES */
        table.tbl-hasil { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
        table.tbl-hasil thead th { background: #f1f5f9; color: #0f172a; text-transform: uppercase; font-weight: 700; font-size: 10px; padding: 7px 6px; border-top: 1px solid #000; border-bottom: 1px solid #000; text-align: left; }
        table.tbl-hasil thead th.r { text-align: right; }
        table.tbl-hasil thead th.c { text-align: center; }
        table.tbl-hasil tbody tr.grp-row td { background: #fafafa; font-weight: 800; font-size: 11px; text-transform: uppercase; padding: 8px 6px 4px; color: #0f766e; border-bottom: 1px solid #e2e8f0; }
        table.tbl-hasil tbody td { padding: 5px 6px; vertical-align: top; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
        table.tbl-hasil tbody tr:last-child td { border-bottom: 1px solid #000; }
        table.tbl-hasil tbody td.val-col { font-weight: 700; }
        table.tbl-hasil tbody td.abnormal { color: #dc2626; font-weight: 800; }
        .flag-pill { display: inline-block; background: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 9.5px; padding: 1px 5px; border-radius: 3px; }

        /* SIGNATURE & FOOTER */
        .sig-container { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 24px; font-size: 11px; }
        .sig-box { display: flex; flex-direction: column; min-width: 180px; }
        .sig-box .role { font-weight: 700; margin-bottom: 4px; }
        .sig-box .qr { margin: 6px 0; }
        .sig-box .qr img { width: 68px; height: 68px; }
        .sig-box .name { font-weight: 700; font-size: 11.5px; margin-top: 4px; }
        .sig-box .time { font-size: 9.5px; color: #64748b; }

        .footer-note { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9.5px; color: #64748b; display: flex; justify-content: space-between; align-items: flex-end; }
        .footer-note .disclaimer { max-width: 65%; line-height: 1.3; font-style: italic; }

        @media print {
          body { padding: 0 !important; }
        }
        @page { ${pageSizeCss} }
      </style>
    </head>
    <body>
    `);

    // 1. RENDER KOP HEADER
    if (is2025) {
      tulis(`
        <div class="kop-2025">
          <div class="logo-txt">
            <img src="${logoUrl}" onerror="this.style.display='none'">
            <div>
              <h1>LABORATORIUM MEDIS UTAMA</h1>
              <p>Layanan Diagnostik &amp; Patologi Terpadu · Akreditasi Kemenkes RI</p>
              <p style="font-size:9.5px; opacity:0.85;">Jl. DI Panjaitan No. 94, Purbalingga · Telp: 0281-6580099 / 08121482308</p>
            </div>
          </div>
          <div class="badge-tag">
            <div>LAPORAN RESMI 2025</div>
            <div style="font-size:9px; font-weight:400; opacity:0.9;">No: ${UI.esc(p.no_lab)}</div>
          </div>
        </div>
      `);
    } else if (isBpjs1 || isBpjs2) {
      tulis(`
        <div class="kop-wrapper" style="border-bottom-color:#059669;">
          <div class="kop-bpjs">
            <img src="${bpjsLogoUrl}" onerror="this.style.display='none'">
            <div>
              <div style="font-weight:800; font-size:14px; color:#065f46;">BPJS KESEHATAN</div>
              <div style="font-size:10px; color:#047857;">${isBpjs2 ? 'PROGRAM KRONIS &amp; PROLANIS' : 'LEMBAR HASIL LABORATORIUM'}</div>
            </div>
          </div>
          <div class="kop-center">
            <img src="${logoUrl}" onerror="this.style.display='none'">
            <div class="brand-title">UTAMA</div>
            <div class="brand-sub">Mitra Faskes BPJS Kesehatan</div>
          </div>
          <div class="kop-right">
            <b>Laboratorium Medis UTAMA</b><br>
            Jl. DI Panjaitan No. 94, Purbalingga<br>
            Telp. 0281-6580099
          </div>
        </div>
      `);
    } else if (isEng) {
      tulis(`
        <div class="kop-wrapper" style="border-bottom-color:#0f766e;">
          <div style="display:flex; align-items:center; gap:12px; flex:1;">
            <img src="${logoUrl}" style="height:50px;" onerror="this.style.display='none'">
            <div>
              <div style="font-weight:800; font-size:16px; color:#0f766e; letter-spacing:1px;">UTAMA MEDICAL LABORATORY</div>
              <div style="font-size:10px; color:#475569; font-weight:600;">CLINICAL DIAGNOSTIC &amp; PATHOLOGY SERVICES</div>
            </div>
          </div>
          <div class="kop-right">
            <b>UTAMA Medical Laboratory Centre</b><br>
            Jl. DI Panjaitan No. 94, Purbalingga, Central Java, Indonesia<br>
            Phone: +62 281 6580099 · Email: laboratoriumutama@yahoo.com
          </div>
        </div>
        <div style="text-align:center; margin:-6px 0 14px; font-weight:800; font-size:13px; text-transform:uppercase; letter-spacing:1px; color:#1e293b;">
          OFFICIAL LABORATORY EXAMINATION REPORT
        </div>
      `);
    } else {
      // Default & Standard: Format 3(M3), Format 5(F4), Format 4(M4), Format 2(M2)
      tulis(`
        <div class="kop-wrapper">
          <div class="kop-bpjs">
            <img src="${bpjsLogoUrl}" onerror="this.style.display='none'">
          </div>
          <div class="kop-center">
            <img src="${logoUrl}" onerror="this.style.display='none'">
            <div class="brand-title">UTAMA</div>
            <div class="brand-sub">Kepuasan Anda Prioritas Kami</div>
          </div>
          <div class="kop-right">
            <b>Laboratorium Medis UTAMA</b><br>
            Jl. DI Panjaitan No. 94, Purbalingga<br>
            Telp. 0281-6580099 / 08121482308<br>
            Email : laboratoriumutama@yahoo.com
          </div>
        </div>
      `);
    }

    // 2. BARCODE & PENANGGUNG JAWAB STRIP
    if (!is2025 && !isM2) {
      tulis(`
        <div class="bar-strip">
          <div>
            <img src="${barcodeUrl}" alt="Barcode" class="barcode-img">
          </div>
          <div style="font-weight:700; font-size:10.5px;">
            ${isEng ? 'Physician in Charge: dr. Minto Rahaju, Sp.PK' : 'Penanggung Jawab : dr. Minto Rahaju Sp. PK'}
          </div>
        </div>
      `);
    }

    // 3. IDENTITAS PASIEN
    const jkText = p.pasien.jenis_kelamin === 'L' ? (isEng ? 'Male' : 'Laki-Laki') : (isEng ? 'Female' : 'Perempuan');
    const umurTeks = UI.umurTeks(p.pasien.tanggal_lahir);
    const dokterPengirim = p.kunjungan?.dokter?.nama || p.peminta?.nama || '-';
    const noBpjs = p.pasien.no_bpjs || '-';
    const instansi = p.pasien.jenis_asuransi === 'UMUM' ? 'Umum' : (p.pasien.jenis_asuransi || p.kunjungan?.cara_bayar || 'Umum');

    if (is2025) {
      tulis(`
        <div class="patient-card-3">
          <div>
            <div class="meta-row"><span class="label">No. Lab</span><span class="colon">:</span><span class="value mono">${UI.esc(p.no_lab)}</span></div>
            <div class="meta-row"><span class="label">No. Rekam Medis</span><span class="colon">:</span><span class="value mono">${UI.esc(p.pasien.no_rm)}</span></div>
            <div class="meta-row"><span class="label">NIK</span><span class="colon">:</span><span class="value mono">${UI.esc(p.pasien.nik || '—')}</span></div>
          </div>
          <div>
            <div class="meta-row"><span class="label">Nama Pasien</span><span class="colon">:</span><span class="value" style="font-size:12px; color:#0f766e;">${UI.esc(p.pasien.nama)}</span></div>
            <div class="meta-row"><span class="label">Umur / JK</span><span class="colon">:</span><span class="value">${UI.esc(umurTeks)} / ${jkText}</span></div>
            <div class="meta-row"><span class="label">Alamat</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.alamat || '—')}</span></div>
          </div>
          <div>
            <div class="meta-row"><span class="label">Tgl. Periksa</span><span class="colon">:</span><span class="value">${UI.tglIndo(p.tanggal)}</span></div>
            <div class="meta-row"><span class="label">Pengirim</span><span class="colon">:</span><span class="value">${UI.esc(dokterPengirim)}</span></div>
            <div class="meta-row"><span class="label">Penjamin</span><span class="colon">:</span><span class="value">${UI.esc(instansi)}</span></div>
          </div>
        </div>
      `);
    } else if (isBpjs1 || isBpjs2) {
      tulis(`
        <div class="patient-card" style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px 14px;">
          <div>
            <div class="meta-row"><span class="label">No. Kartu BPJS</span><span class="colon">:</span><span class="value mono" style="font-size:12px; color:#065f46;">${UI.esc(noBpjs)}</span></div>
            <div class="meta-row"><span class="label">No. Lab</span><span class="colon">:</span><span class="value mono">${UI.esc(p.no_lab)}</span></div>
            <div class="meta-row"><span class="label">Nama Pasien</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.nama)}</span></div>
            <div class="meta-row"><span class="label">No. RM / NIK</span><span class="colon">:</span><span class="value mono">${UI.esc(p.pasien.no_rm)} / ${UI.esc(p.pasien.nik || '—')}</span></div>
          </div>
          <div>
            <div class="meta-row"><span class="label">Tgl. Pemeriksaan</span><span class="colon">:</span><span class="value">${UI.tglIndo(p.tanggal)}</span></div>
            <div class="meta-row"><span class="label">Umur / JK</span><span class="colon">:</span><span class="value">${UI.esc(umurTeks)} / ${jkText}</span></div>
            <div class="meta-row"><span class="label">Dokter Perujuk</span><span class="colon">:</span><span class="value">${UI.esc(dokterPengirim)}</span></div>
            <div class="meta-row"><span class="label">Diagnosa (ICD-10)</span><span class="colon">:</span><span class="value">${UI.esc(p.kunjungan?.diagnosa || '—')}</span></div>
            ${isBpjs2 ? `<div class="meta-row"><span class="label" style="color:#059669; font-weight:700;">Status Prolanis</span><span class="colon">:</span><span class="value" style="color:#059669;">Pemantauan Siklus 6 Bulan</span></div>` : ''}
          </div>
        </div>
      `);
    } else if (isEng) {
      tulis(`
        <div class="patient-card" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px;">
          <div>
            <div class="meta-row"><span class="label">Lab ID No.</span><span class="colon">:</span><span class="value mono">${UI.esc(p.no_lab)}</span></div>
            <div class="meta-row"><span class="label">Patient Name</span><span class="colon">:</span><span class="value" style="font-size:12px;">${UI.esc(p.pasien.nama)}</span></div>
            <div class="meta-row"><span class="label">MRN / ID</span><span class="colon">:</span><span class="value mono">${UI.esc(p.pasien.no_rm)} / ${UI.esc(p.pasien.nik || '—')}</span></div>
            <div class="meta-row"><span class="label">Address</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.alamat || '—')}</span></div>
          </div>
          <div>
            <div class="meta-row"><span class="label">Date of Test</span><span class="colon">:</span><span class="value">${UI.tglIndo(p.tanggal)}</span></div>
            <div class="meta-row"><span class="label">Age / Gender</span><span class="colon">:</span><span class="value">${UI.esc(umurTeks)} / ${jkText}</span></div>
            <div class="meta-row"><span class="label">Referring Doctor</span><span class="colon">:</span><span class="value">${UI.esc(dokterPengirim)}</span></div>
            <div class="meta-row"><span class="label">Payment Type</span><span class="colon">:</span><span class="value">${UI.esc(instansi)}</span></div>
          </div>
        </div>
      `);
    } else {
      tulis(`
        <div class="patient-card">
          <div>
            <div class="meta-row"><span class="label">No Lab</span><span class="colon">:</span><span class="value mono"><b>${UI.esc(p.no_lab)}</b></span></div>
            <div class="meta-row"><span class="label">Nama</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.nama)}</span></div>
            <div class="meta-row"><span class="label">Dokter Pengirim</span><span class="colon">:</span><span class="value">${UI.esc(dokterPengirim)}</span></div>
            <div class="meta-row"><span class="label">Alamat</span><span class="colon">:</span><span class="value">${UI.esc(p.pasien.alamat || '-')}</span></div>
          </div>
          <div>
            <div class="meta-row"><span class="label">Umur</span><span class="colon">:</span><span class="value">${UI.esc(umurTeks)}</span></div>
            <div class="meta-row"><span class="label">Jenis Kelamin</span><span class="colon">:</span><span class="value">${jkText}</span></div>
            <div class="meta-row"><span class="label">Tgl. Periksa</span><span class="colon">:</span><span class="value">${UI.tglIndo(p.tanggal)}</span></div>
            <div class="meta-row"><span class="label">Instansi</span><span class="colon">:</span><span class="value">${UI.esc(instansi)}</span></div>
          </div>
        </div>
      `);
    }

    // 4. TABEL HASIL SESUAI FORMAT
    if (isEng) {
      tulis(`
        <table class="tbl-hasil">
          <thead>
            <tr>
              <th style="width:36%">TEST PARAMETER</th>
              <th style="width:16%" class="r">RESULT</th>
              <th style="width:10%" class="c">FLAG</th>
              <th style="width:12%">UNIT</th>
              <th style="width:26%">REFERENCE RANGE</th>
            </tr>
          </thead>
          <tbody>
            ${grup.map(g => `
              <tr class="grp-row"><td colspan="5">${UI.esc(translateEn(g.kelompok || 'EXAMINATION'))}</td></tr>
              ${g.isi.map(h => {
                const abnormal = isAbnormalItem(h);
                const rujukanStr = h.rujukan_teks || LabCore.teksRujukan(rujukanPakai[h.id], h.ref) || '—';
                return `<tr>
                  <td><b>${UI.esc(translateEn(h.nama))}</b></td>
                  <td class="r val-col ${abnormal ? 'abnormal' : ''}">${UI.esc(nilaiTeks(h))}</td>
                  <td class="c">${abnormal ? '<span class="flag-pill">HIGH/LOW</span>' : 'Normal'}</td>
                  <td>${UI.esc(h.satuan || '')}</td>
                  <td>${UI.esc(rujukanStr).replace(/\\n/g, '<br>')}</td>
                </tr>`;
              }).join('')}
            `).join('')}
          </tbody>
        </table>
      `);
    } else if (isF4_2) {
      // Format 5(F4) Varian 2: Menampilkan Nilai Normal L dan P Terpisah
      tulis(`
        <table class="tbl-hasil">
          <thead>
            <tr>
              <th style="width:8%">KODE</th>
              <th style="width:30%">PEMERIKSAAN</th>
              <th style="width:14%" class="r">HASIL</th>
              <th style="width:6%" class="c">*</th>
              <th style="width:10%">SATUAN</th>
              <th style="width:16%">NORMAL (L)</th>
              <th style="width:16%">NORMAL (P)</th>
            </tr>
          </thead>
          <tbody>
            ${grup.map(g => `
              <tr class="grp-row"><td colspan="7">${UI.esc(g.kelompok || 'PEMERIKSAAN')}</td></tr>
              ${g.isi.map(h => {
                const abnormal = isAbnormalItem(h);
                const m = h.ref || {};
                const rL = m.normal_l || (m.rujukan?.find(r => r.jenis_kelamin === 'L')?.teks) || '—';
                const rP = m.normal_p || (m.rujukan?.find(r => r.jenis_kelamin === 'P')?.teks) || '—';
                return `<tr>
                  <td class="mono text-muted">${UI.esc(m.kode || '')}</td>
                  <td><b>${UI.esc(h.nama)}</b></td>
                  <td class="r val-col ${abnormal ? 'abnormal' : ''}">${UI.esc(nilaiTeks(h))}</td>
                  <td class="c abnormal">${abnormal ? '↑' : ''}</td>
                  <td>${UI.esc(h.satuan || '')}</td>
                  <td class="mono">${UI.esc(rL)}</td>
                  <td class="mono">${UI.esc(rP)}</td>
                </tr>`;
              }).join('')}
            `).join('')}
          </tbody>
        </table>
      `);
    } else if (isF4_1 || isM4) {
      // Format 5(F4) & Format 4(M4): Kolom Lengkap dengan Metode
      tulis(`
        <table class="tbl-hasil">
          <thead>
            <tr>
              <th style="width:8%">KODE</th>
              <th style="width:34%">PEMERIKSAAN</th>
              <th style="width:14%" class="r">HASIL</th>
              <th style="width:6%" class="c">FLAG</th>
              <th style="width:10%">SATUAN</th>
              <th style="width:18%">NILAI RUJUKAN</th>
              <th style="width:10%">METODE</th>
            </tr>
          </thead>
          <tbody>
            ${grup.map(g => `
              <tr class="grp-row"><td colspan="7">${UI.esc(g.kelompok || 'PEMERIKSAAN')}</td></tr>
              ${g.isi.map(h => {
                const abnormal = isAbnormalItem(h);
                const m = h.ref || {};
                const rujukanStr = h.rujukan_teks || LabCore.teksRujukan(rujukanPakai[h.id], h.ref) || '—';
                return `<tr>
                  <td class="mono text-muted">${UI.esc(m.kode || '')}</td>
                  <td><b>${UI.esc(h.nama)}</b></td>
                  <td class="r val-col ${abnormal ? 'abnormal' : ''}">${UI.esc(nilaiTeks(h))}</td>
                  <td class="c abnormal">${abnormal ? '<span class="flag-pill">*</span>' : ''}</td>
                  <td>${UI.esc(h.satuan || '')}</td>
                  <td>${UI.esc(rujukanStr).replace(/\\n/g, '<br>')}</td>
                  <td class="text-muted">${UI.esc(m.metode || '—')}</td>
                </tr>`;
              }).join('')}
            `).join('')}
          </tbody>
        </table>
      `);
    } else if (is2025) {
      // Format 2025: Desain Modern dengan Status Label
      tulis(`
        <table class="tbl-hasil">
          <thead>
            <tr style="background:#0f766e; color:#fff;">
              <th style="width:36%; color:#fff; border-color:#0f766e;">PEMERIKSAAN</th>
              <th style="width:16%; color:#fff; border-color:#0f766e;" class="r">HASIL</th>
              <th style="width:12%; color:#fff; border-color:#0f766e;" class="c">STATUS</th>
              <th style="width:24%; color:#fff; border-color:#0f766e;">NILAI RUJUKAN</th>
              <th style="width:12%; color:#fff; border-color:#0f766e;">SATUAN</th>
            </tr>
          </thead>
          <tbody>
            ${grup.map(g => `
              <tr class="grp-row" style="background:#f0fdfa; color:#0f766e;"><td colspan="5">📁 ${UI.esc(g.kelompok || 'PEMERIKSAAN')}</td></tr>
              ${g.isi.map(h => {
                const abnormal = isAbnormalItem(h);
                const rujukanStr = h.rujukan_teks || LabCore.teksRujukan(rujukanPakai[h.id], h.ref) || '—';
                return `<tr>
                  <td><b>${UI.esc(h.nama)}</b></td>
                  <td class="r val-col ${abnormal ? 'abnormal' : ''}">${UI.esc(nilaiTeks(h))}</td>
                  <td class="c">${abnormal ? '<span class="flag-pill">ABNORMAL</span>' : '<span style="color:#16a34a; font-weight:600;">Normal</span>'}</td>
                  <td>${UI.esc(rujukanStr).replace(/\\n/g, '<br>')}</td>
                  <td>${UI.esc(h.satuan || '')}</td>
                </tr>`;
              }).join('')}
            `).join('')}
          </tbody>
        </table>
      `);
    } else {
      // Default: Format 3(M3), Format 2(M2), BPJS, BPJS.2
      tulis(`
        <table class="tbl-hasil">
          <thead>
            <tr>
              <th style="width:40%">PEMERIKSAAN</th>
              <th style="width:15%">HASIL</th>
              <th style="width:30%">NILAI RUJUKAN</th>
              <th style="width:15%">SATUAN</th>
            </tr>
          </thead>
          <tbody>
            ${grup.map(g => `<tr class="grp-row"><td colspan="4">${UI.esc(g.kelompok || 'PEMERIKSAAN')}</td></tr>
              ${g.isi.map(h => {
                const rujukanString = h.rujukan_teks || LabCore.teksRujukan(rujukanPakai[h.id], h.ref) || '';
                const rujukanHtml = UI.esc(rujukanString).replace(/\\n/g, '<br>');
                const abnormal = isAbnormalItem(h);
                return `<tr>
                  <td>${UI.esc(h.nama)}</td>
                  <td class="val-col ${abnormal ? 'abnormal' : ''}">${UI.esc(nilaiTeks(h))}</td>
                  <td>${rujukanHtml}</td>
                  <td>${UI.esc(h.satuan || '')}</td>
                </tr>`;
              }).join('')}`).join('')}
          </tbody>
        </table>
      `);
    }

    // Catatan Kaki jika ada catatan klinis
    if (p.catatan_klinis) {
      tulis(`
        <div style="margin-bottom:14px; padding:6px 10px; background:#f8fafc; border-left:3px solid #0f766e; font-size:10.5px;">
          <b>${isEng ? 'Clinical Notes / Remark:' : 'Catatan Klinis:'}</b> ${UI.esc(p.catatan_klinis)}
        </div>
      `);
    }

    // Keterangan Asterisk
    tulis(`
      <div style="margin-top: 10px; font-size: 10px; font-weight: 600; color: #475569;">
        ${isEng ? 'Note: (*) Result outside clinical reference range' : 'Keterangan : (*) Diluar nilai normal'}
      </div>
    `);

    // 5. TANDA TANGAN & PENGESAHAN
    tulis(`
      <div class="sig-container">
        <div class="sig-box">
          <div class="role">${isEng ? 'Verified by (Analyst),' : 'Verifikator,'}</div>
          <div style="height: 52px;"></div>
          <div class="name">${UI.esc(p.penutup?.nama || dicetakOleh)}</div>
          <div class="time">${isEng ? 'Timestamp: ' : 'Waktu: '}${p.waktu_selesai ? p.waktu_selesai.replace('T', ' ').substring(0, 19) : jamSampel}</div>
        </div>
        <div class="sig-box" style="align-items: flex-end; text-align: right;">
          <div class="role" style="text-align: right;">${isEng ? 'Clinical Pathologist in Charge,' : 'Penanggung Jawab,'}</div>
          <div class="qr"><img src="${qrUrl}" alt="QR Validation"></div>
          <div class="name">dr. Minto Rahaju, Sp. PK</div>
          <div class="time">${isEng ? 'SIP: 446/123/SIP-Sp/Dinkes' : 'SIP: 446/123/SIP-Sp/Dinkes'}</div>
        </div>
      </div>
      
      <div class="footer-note">
        <div class="disclaimer">
          ${isEng
            ? 'This document is electronically generated and validated by the Laboratory Information System. No physical signature is required.'
            : 'Hasil tidak memerlukan tanda tangan basah karena dicetak dan divalidasi secara elektronik oleh Sistem Informasi Laboratorium (LIS).'}
        </div>
        <div style="text-align: right;">
          ${isEng ? 'Printed by' : 'Dicetak oleh'}: ${UI.esc(dicetakOleh)} · ${UI.tglIndo(now)} ${UI.jam(now.toISOString())}
        </div>
      </div>
    `);

    tulis(`</body></html>`);
    await cetakDokumen(out.join(''));
  }

  /* ------------------------------------------------------------------ */
  /*  Mencatat hasil lab luar                                           */
  /* ------------------------------------------------------------------ */
  async function modalLabLuar() {
    let pasienTerpilih = null;
    const dipilih = new Set();

    const hasil = await UI.modal({
      judul: 'Catat hasil laboratorium dari luar',
      lebar: true,
      isi: `
        <div class="banner info mb-12">${UI.ikon('peringatan',16)}
          <div>Yang diketik di sini adalah <b>angkanya</b>, bukan lembar hasilnya.
          Lembar kertasnya dicatat di tab <b>Arsip berkas</b> agar dapat nomor arsip,
          lalu disimpan di klinik. Angka yang diketik ulang inilah yang bisa
          dibandingkan dengan hasil kunjungan berikutnya.</div></div>
        <div class="field"><label for="cariPasienLab">Pasien</label>
          <div id="cariPasienLab"></div>
          <div class="hint" id="pasienTerpilih">Belum ada pasien dipilih.</div></div>
        <div class="form-row c3">
          <div class="field"><label for="tglLuar">Tanggal pemeriksaan</label>
            <input type="date" id="tglLuar" value="${UI.hariIni()}"></div>
          <div class="field"><label for="namaLab">Nama laboratorium</label>
            <input type="text" id="namaLab" placeholder="mis. Lab Prodia"></div>
          <div class="field"><label for="noLembar">No. lembar hasil <span class="opt">opsional</span></label>
            <input type="text" id="noLembar"></div>
        </div>
        <div class="field mb-0"><label>Pemeriksaan yang ada hasilnya</label>
          <div class="chip-quick mb-8" id="paketLuar">
            ${paket.map(pk => `<button type="button" class="chip" data-paket="${pk.id}">
              ${UI.esc(pk.nama)}</button>`).join('')}
          </div>
          <div class="scroll-box" id="daftarLab">
            ${daftarPilihLab()}
          </div>
          <div class="hint" id="hitungPilih">Belum ada yang dipilih.</div>
        </div>`,
      siap: (b) => {
        Komponen.comboCari({
          wadah: b.querySelector('#cariPasienLab'),
          placeholder: 'Ketik nama atau nomor RM…',
          cariFn: async (q) => await DB.cariPasien(q),
          formatFn: (p) => `<b>${UI.esc(p.nama)}</b> <span class="text-muted">${UI.esc(p.no_rm)} ·
                          ${UI.umurTeks(p.tanggal_lahir)}</span>`,
          onPilih: (p) => {
            pasienTerpilih = p;
            b.querySelector('#pasienTerpilih').innerHTML =
              `Dipilih: <b>${UI.esc(p.nama)}</b> (${UI.esc(p.no_rm)})`;
          }
        });

        const perbarui = () => {
          b.querySelector('#hitungPilih').textContent = dipilih.size
            ? dipilih.size + ' pemeriksaan dipilih.' : 'Belum ada yang dipilih.';
        };
        b.querySelector('#daftarLab').addEventListener('change', (e) => {
          const c = e.target.closest('input[type=checkbox]'); if (!c) return;
          c.checked ? dipilih.add(c.value) : dipilih.delete(c.value);
          perbarui();
        });
        b.querySelector('#paketLuar').addEventListener('click', (e) => {
          const t = e.target.closest('[data-paket]'); if (!t) return;
          const pk = paket.find(x => x.id === t.dataset.paket);
          (pk.item || []).forEach(it => {
            dipilih.add(it.lab_id);
            const c = b.querySelector(`input[value="${it.lab_id}"]`);
            if (c) c.checked = true;
          });
          perbarui();
        });
      },
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Buat lembar', kelas: 'btn-primary', aksi: (b) => {
            if (!pasienTerpilih) { UI.toast('Pilih pasiennya dulu.', 'err'); return false; }
            if (!dipilih.size)   { UI.toast('Pilih minimal satu pemeriksaan.', 'err'); return false; }
            const nama = b.querySelector('#namaLab').value.trim();
            if (!nama) { UI.toast('Nama laboratorium wajib diisi.', 'err'); return false; }
            return {
              pasien_id: pasienTerpilih.id,
              tanggal: b.querySelector('#tglLuar').value || UI.hariIni(),
              nama_lab: nama,
              no_lembar: b.querySelector('#noLembar').value.trim() || null,
              lab_ids: Array.from(dipilih)
            };
          } }
      ]
    });

    if (!hasil) return;
    try {
      const id = await DB.labMintaLuar(hasil);
      UI.toast('Lembar dibuat. Sekarang isi angkanya.');
      App.pergi('#/lab/hasil/' + id);
    } catch (e) { UI.toast(e.message || 'Gagal membuat lembar.', 'err'); }
  }

  function daftarPilihLab(terpilih = []) {
    const grup = {};
    master.filter(m => m.aktif !== false).forEach(m => {
      (grup[m.kelompok] = grup[m.kelompok] || []).push(m);
    });
    return Object.entries(grup).map(([k, isi]) => `
      <div class="mb-10">
        <div class="group-label">${UI.esc(k)}</div>
        <div class="form-row c3">
          ${isi.map(m => `<label class="check">
            <input type="checkbox" value="${m.id}" ${terpilih.includes(m.id) ? 'checked' : ''}>
            <span>${UI.esc(m.nama)}${m.satuan ? ` <span class="text-muted">(${UI.esc(m.satuan)})</span>` : ''}</span>
          </label>`).join('')}
        </div>
      </div>`).join('');
  }

  /* ================================================================== */
  /*  TAB 2 — Bacaan penunjang                                          */
  /* ================================================================== */
  async function tabPenunjang(w) {
    w.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="flex-1"><h2>Bacaan pemeriksaan penunjang</h2>
            <div class="sub">Rontgen gigi, EKG, USG — yang disimpan hasil bacanya,
              bukan gambarnya</div></div>
          ${bolehBaca() ? `<button class="btn btn-primary btn-sm" id="btnBacaanBaru">
            ${UI.ikon('plus',15)} Tulis bacaan</button>` : ''}
        </div>
        <div class="card-body">
          <div class="field mb-0"><label for="cariPasienPn">Cari pasien</label>
            <div id="cariPasienPn"></div></div>
        </div>
        <div class="card-body tight" id="daftarBacaan">
          ${UI.kosong('Pilih pasien', 'Bacaan penunjang ditampilkan per pasien.')}
        </div>
      </div>`;

    let pasienAktif = null;
    const muat = async () => {
      const t = w.querySelector('#daftarBacaan');
      if (!pasienAktif) return;
      t.innerHTML = UI.memuat(3);
      const data = await DB.penunjangPasien(pasienAktif.id);
      if (!data.length) {
        t.innerHTML = UI.kosong('Belum ada bacaan',
          'Belum ada pemeriksaan penunjang yang dibaca untuk pasien ini.');
        return;
      }
      t.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>Tanggal</th><th>Jenis</th><th>Gigi</th><th>Kesan</th>
          <th>Pembaca</th><th class="no-print"></th></tr></thead>
        <tbody>${data.map(d => `<tr>
          <td>${UI.tglPendek(d.tanggal)}</td>
          <td>${UI.esc(LabCore.labelJenis(d.jenis))}
              ${d.asal === 'EKSTERNAL'
                ? `<div class="text-muted text-xs">${UI.esc(d.nama_tempat || 'luar')}</div>` : ''}</td>
          <td class="mono">${UI.esc(d.daftar_gigi || '—')}</td>
          <td class="col-max-340">${UI.esc(d.kesan)}</td>
          <td class="muted">${UI.esc(d.nama_pembaca || '-')}</td>
          <td class="no-print">${bolehBaca()
            ? `<button class="btn btn-ghost btn-sm" data-sunting="${d.id}">Sunting</button>` : ''}</td>
        </tr>`).join('')}</tbody></table></div>`;

      t.querySelectorAll('[data-sunting]').forEach(b => b.addEventListener('click', async () => {
        const rec = data.find(x => x.id === b.dataset.sunting);
        const gigi = (rec.daftar_gigi || '').split(',').map(s => s.trim()).filter(Boolean);
        if (await modalBacaan(pasienAktif, rec.kunjungan_id, Object.assign({}, rec, { gigi }))) muat();
      }));
    };

    Komponen.comboCari({
      wadah: w.querySelector('#cariPasienPn'),
      placeholder: 'Ketik nama atau nomor RM…',
      cariFn: async (q) => await DB.cariPasien(q),
      formatFn: (p) => `<b>${UI.esc(p.nama)}</b> <span class="text-muted">${UI.esc(p.no_rm)}</span>`,
      onPilih: (p) => { pasienAktif = p; muat(); }
    });

    const bBaru = w.querySelector('#btnBacaanBaru');
    if (bBaru) bBaru.addEventListener('click', async () => {
      if (!pasienAktif) { UI.toast('Pilih pasiennya dulu.', 'err'); return; }
      if (await modalBacaan(pasienAktif, null, null)) muat();
    });
  }

  /* ------------------------------------------------------------------
     Pemilih kunjungan.

     Dipakai saat bacaan atau berkas dicatat dari halaman Lab, bukan dari
     layar pemeriksaan dokter. Tanpa ini `kunjungan_id` tersimpan kosong,
     dan akibatnya berantai: bacaannya tidak pernah masuk tagihan, tidak
     muncul di rekam medis kunjungan itu, dan tidak ikut tercetak. Satu
     kolom kosong yang mematikan tiga hal sekaligus.
     ------------------------------------------------------------------ */
  async function pilihanKunjungan(pasienId, terpilih, tanggal) {
    let daftar = [];
    try { daftar = await DB.daftarKunjungan({ pasien_id: pasienId, batas: 25 }); }
    catch (e) { daftar = []; }
    const bawaan = terpilih
      || (daftar.find(k => String(k.tanggal) === String(tanggal)) || {}).id
      || (daftar[0] || {}).id || '';
    return { daftar, bawaan };
  }

  const kotakKunjungan = (id, { daftar, bawaan }) => `
    <div class="field"><label for="${id}">Kunjungan terkait</label>
      <select id="${id}">
        <option value="">— tidak terkait kunjungan tertentu —</option>
        ${daftar.map(k => `<option value="${k.id}" ${k.id === bawaan ? 'selected' : ''}>
          ${UI.tglPendek(k.tanggal)} · ${UI.esc(k.no_kunjungan)}
          ${k.nama_poli ? '· ' + UI.esc(k.nama_poli) : ''}</option>`).join('')}
      </select>
      <div class="hint">Kunjungan menentukan di rekam medis mana ini muncul, dan —
        untuk pemeriksaan yang dikerjakan klinik — apakah ia ikut ditagihkan.</div>
    </div>`;

  /* Modal tulis/sunting bacaan. Dipakai juga dari halaman pemeriksaan
     dokter, jadi diekspor. */
  async function modalBacaan(pasien, kunjunganId, awal) {
    if (!gigiRef.length) gigiRef = await DB.refGigi();
    const sahFdi = new Set(gigiRef.map(g => g.fdi));
    let gigi = (awal && awal.gigi) ? awal.gigi.slice() : [];

    /* Dari layar dokter kunjungannya sudah pasti; dari halaman Lab harus
       dipilih. */
    const pilihKunj = kunjunganId ? null
      : await pilihanKunjungan(pasien.id, awal ? awal.kunjungan_id : null,
                               awal ? awal.tanggal : UI.hariIni());

    const hasil = await UI.modal({
      judul: awal ? 'Sunting bacaan penunjang' : 'Tulis bacaan pemeriksaan penunjang',
      lebar: true,
      isi: `
        <div class="banner info mb-12">${UI.ikon('peringatan',16)}
          <div>Yang disimpan adalah <b>hasil bacanya</b>. Film atau rekamannya tetap
          disimpan sebagai berkas fisik — catat di tab <b>Arsip berkas</b> supaya
          dapat nomor dan bisa dicari lagi.</div></div>
        <div class="form-row c3">
          <div class="field"><label for="pnJenis">Jenis pemeriksaan</label>
            <select id="pnJenis">${LabCore.JENIS_PENUNJANG.map(j =>
              `<option value="${j.kode}" ${awal && awal.jenis === j.kode ? 'selected' : ''}>
                 ${UI.esc(j.label)}</option>`).join('')}</select></div>
          <div class="field"><label for="pnTanggal">Tanggal pemeriksaan</label>
            <input type="date" id="pnTanggal" value="${awal?.tanggal || UI.hariIni()}"></div>
          <div class="field"><label for="pnAsal">Dikerjakan di</label>
            <select id="pnAsal">
              <option value="INTERNAL" ${awal?.asal !== 'EKSTERNAL' ? 'selected' : ''}>Klinik ini</option>
              <option value="EKSTERNAL" ${awal?.asal === 'EKSTERNAL' ? 'selected' : ''}>Tempat lain</option>
            </select></div>
        </div>
        <div class="form-row c2" id="barisLuar" ${awal?.asal === 'EKSTERNAL' ? '' : 'hidden'}>
          <div class="field"><label for="pnTempat">Nama tempat</label>
            <input type="text" id="pnTempat" value="${UI.esc(awal?.nama_tempat || '')}"></div>
          <div class="field"><label for="pnNoFilm">No. film / ekspertise</label>
            <input type="text" id="pnNoFilm" value="${UI.esc(awal?.no_film || '')}"></div>
        </div>
        ${pilihKunj ? kotakKunjungan('pnKunjungan', pilihKunj) : ''}
        <div class="field" id="fieldGigi">
          <label for="pnGigi">Gigi yang tampak <span class="opt">nomor FDI, pisahkan dengan spasi</span></label>
          <input type="text" id="pnGigi" placeholder="mis. 36 37" list="daftarFdi">
          <datalist id="daftarFdi">${gigiRef.map(g => `<option value="${g.fdi}">`).join('')}</datalist>
          <div class="chip-list" id="chipGigi"></div>
          <div class="hint">Gigi yang disebut di sini akan bertanda di odontogram,
            dan bacaan ini muncul saat giginya diklik.</div>
        </div>
        <div class="field"><label for="pnJudul">Judul <span class="opt">opsional</span></label>
          <input type="text" id="pnJudul" placeholder="mis. Periapikal regio 36-37"
                 value="${UI.esc(awal?.judul || '')}"></div>
        <div class="field"><label for="pnTemuan">Temuan <span class="opt">gambaran yang terlihat</span></label>
          <textarea id="pnTemuan" rows="3"
            placeholder="mis. Tampak area radiolusen pada mahkota gigi 36 mencapai kamar pulpa…">${UI.esc(awal?.temuan || '')}</textarea></div>
        <div class="field"><label for="pnKesan">Kesan <span class="text-danger">wajib</span></label>
          <textarea id="pnKesan" rows="2"
            placeholder="Kesimpulan bacaan — inilah yang dibaca dokter berikutnya">${UI.esc(awal?.kesan || '')}</textarea></div>
        <div class="field mb-0"><label for="pnSaran">Saran <span class="opt">opsional</span></label>
          <textarea id="pnSaran" rows="2">${UI.esc(awal?.saran || '')}</textarea></div>`,
      siap: (b) => {
        const gambarChip = () => {
          b.querySelector('#chipGigi').innerHTML = gigi.map(g =>
            `<span class="chip">${UI.esc(g)}<button type="button" data-buang="${UI.esc(g)}">×</button></span>`).join('');
          b.querySelectorAll('[data-buang]').forEach(x => x.addEventListener('click', () => {
            gigi = gigi.filter(v => v !== x.dataset.buang); gambarChip();
          }));
        };
        const tambahGigi = () => {
          const inp = b.querySelector('#pnGigi');
          const calon = inp.value.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
          const salah = [];
          calon.forEach(c => {
            if (!sahFdi.has(c)) { salah.push(c); return; }
            if (!gigi.includes(c)) gigi.push(c);
          });
          inp.value = '';
          gigi.sort();
          gambarChip();
          if (salah.length)
            UI.toast('Bukan nomor gigi FDI: ' + salah.join(', '), 'err');
        };
        b.querySelector('#pnGigi').addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === ',') { e.preventDefault(); tambahGigi(); }
        });
        b.querySelector('#pnGigi').addEventListener('blur', tambahGigi);
        gambarChip();

        const aturJenis = () => {
          const j = b.querySelector('#pnJenis').value;
          b.querySelector('#fieldGigi').style.display = LabCore.jenisPakaiGigi(j) ? '' : 'none';
        };
        b.querySelector('#pnJenis').addEventListener('change', aturJenis);
        aturJenis();

        const aturAsal = () => {
          b.querySelector('#barisLuar').hidden =
            b.querySelector('#pnAsal').value !== 'EKSTERNAL';
        };
        b.querySelector('#pnAsal').addEventListener('change', aturAsal);
      },
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan bacaan', kelas: 'btn-primary', aksi: async (b) => {
            const kesan = b.querySelector('#pnKesan').value.trim();
            if (!kesan) {
              UI.toast('Kesan wajib diisi — bacaan tanpa kesimpulan tidak berguna.', 'err');
              return false;
            }
            const jenis = b.querySelector('#pnJenis').value;
            try {
              await DB.penunjangSimpan({
                id: awal ? awal.id : null,
                pasien_id: pasien.id,
                kunjungan_id: kunjunganId
                  || (b.querySelector('#pnKunjungan') ? b.querySelector('#pnKunjungan').value || null : null)
                  || (awal ? awal.kunjungan_id : null),
                tanggal: b.querySelector('#pnTanggal').value || UI.hariIni(),
                jenis,
                judul: b.querySelector('#pnJudul').value.trim() || null,
                asal: b.querySelector('#pnAsal').value,
                nama_tempat: b.querySelector('#pnTempat')?.value.trim() || null,
                no_film: b.querySelector('#pnNoFilm')?.value.trim() || null,
                temuan: b.querySelector('#pnTemuan').value.trim() || null,
                kesan,
                saran: b.querySelector('#pnSaran').value.trim() || null,
                gigi: LabCore.jenisPakaiGigi(jenis) ? gigi : null
              });
              UI.toast('Bacaan tersimpan.');
              return true;
            } catch (e) {
              UI.toast(e.message || 'Gagal menyimpan bacaan.', 'err');
              return false;
            }
          } }
      ]
    });
    return hasil === true;
  }

  /* ================================================================== */
  /*  TAB 3 — Register arsip berkas                                     */
  /* ================================================================== */
  async function tabArsip(w) {
    w.innerHTML = `
      <div class="banner info mb-12">${UI.ikon('peringatan',16)}
        <div><b>Berkasnya tetap kertas, nomornya yang disimpan di sini.</b>
        Catat berkasnya, sistem memberi nomor arsip, tulis nomor itu di pojok
        berkasnya, lalu simpan berurutan menurut nomor. Mencari film gigi dari
        dua tahun lalu jadi soal membaca satu nomor, bukan membongkar lemari.</div></div>

      <div class="card">
        <div class="card-head">
          <div class="flex-1"><h2>Register arsip berkas</h2>
            <div class="sub">Film rontgen, lembar hasil lab luar, surat rujukan,
              informed consent</div></div>
          ${bolehArsip() ? `<button class="btn btn-primary btn-sm" id="btnArsipBaru">
            ${UI.ikon('plus',15)} Catat berkas</button>` : ''}
        </div>
        <div class="card-body">
          <div class="field mb-0"><label for="cariPasienAr">Cari pasien</label>
            <div id="cariPasienAr"></div></div>
        </div>
        <div class="card-body tight" id="daftarArsip">
          ${UI.kosong('Pilih pasien', 'Register arsip ditampilkan per pasien.')}
        </div>
      </div>`;

    let pasienAktif = null;
    const muat = async () => {
      if (!pasienAktif) return;
      const t = w.querySelector('#daftarArsip');
      t.innerHTML = UI.memuat(3);
      const data = await DB.lampiranPasien(pasienAktif.id);
      if (!data.length) {
        t.innerHTML = UI.kosong('Belum ada berkas tercatat',
          'Belum ada berkas fisik yang didaftarkan untuk pasien ini.');
        return;
      }
      t.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>No. arsip</th><th>Berkas</th><th>Tanggal</th>
          <th>Asal</th><th>Disimpan di</th><th class="no-print"></th></tr></thead>
        <tbody>${data.map(d => `<tr>
          <td><b class="mono">${UI.esc(d.no_arsip)}</b></td>
          <td>${UI.esc(d.judul)}
              <div class="text-muted text-xs">
                ${UI.esc(LabCore.labelLampiran(d.jenis))}
                ${d.no_dokumen ? ' · ' + UI.esc(d.no_dokumen) : ''}</div></td>
          <td>${d.tanggal_dokumen ? UI.tglPendek(d.tanggal_dokumen) : '—'}</td>
          <td class="muted">${UI.esc(d.asal || '—')}</td>
          <td class="muted">${UI.esc(d.lokasi_simpan || '—')}</td>
          <td class="no-print">${bolehArsip()
            ? `<button class="btn btn-ghost btn-sm" data-sunting="${d.id}">Sunting</button>` : ''}</td>
        </tr>`).join('')}</tbody></table></div>`;

      t.querySelectorAll('[data-sunting]').forEach(b => b.addEventListener('click', async () => {
        if (await modalArsip(pasienAktif, null, data.find(x => x.id === b.dataset.sunting))) muat();
      }));
    };

    Komponen.comboCari({
      wadah: w.querySelector('#cariPasienAr'),
      placeholder: 'Ketik nama atau nomor RM…',
      cariFn: async (q) => await DB.cariPasien(q),
      formatFn: (p) => `<b>${UI.esc(p.nama)}</b> <span class="text-muted">${UI.esc(p.no_rm)}</span>`,
      onPilih: (p) => { pasienAktif = p; muat(); }
    });

    const bBaru = w.querySelector('#btnArsipBaru');
    if (bBaru) bBaru.addEventListener('click', async () => {
      if (!pasienAktif) { UI.toast('Pilih pasiennya dulu.', 'err'); return; }
      if (await modalArsip(pasienAktif, null, null)) muat();
    });
  }

  async function modalArsip(pasien, kunjunganId, awal) {
    const pilihKunj = kunjunganId ? null
      : await pilihanKunjungan(pasien.id, awal ? awal.kunjungan_id : null,
                               awal ? awal.tanggal_dokumen : UI.hariIni());

    const hasil = await UI.modal({
      judul: awal ? 'Sunting catatan arsip' : 'Catat berkas fisik',
      isi: `
        <div class="form-row c2">
          <div class="field"><label for="arJenis">Jenis berkas</label>
            <select id="arJenis">${LabCore.JENIS_LAMPIRAN.map(j =>
              `<option value="${j.kode}" ${awal && awal.jenis === j.kode ? 'selected' : ''}>
                 ${UI.esc(j.label)}</option>`).join('')}</select></div>
          <div class="field"><label for="arTanggal">Tanggal dokumen</label>
            <input type="date" id="arTanggal" value="${awal?.tanggal_dokumen || UI.hariIni()}"></div>
        </div>
        ${pilihKunj ? kotakKunjungan('arKunjungan', pilihKunj) : ''}
        <div class="field"><label for="arJudul">Nama berkas</label>
          <input type="text" id="arJudul" placeholder="mis. Film periapikal gigi 36"
                 value="${UI.esc(awal?.judul || '')}"></div>
        <div class="form-row c2">
          <div class="field"><label for="arAsal">Diterbitkan oleh <span class="opt">opsional</span></label>
            <input type="text" id="arAsal" placeholder="mis. Lab Prodia"
                   value="${UI.esc(awal?.asal || '')}"></div>
          <div class="field"><label for="arNoDok">No. pada dokumen <span class="opt">opsional</span></label>
            <input type="text" id="arNoDok" value="${UI.esc(awal?.no_dokumen || '')}"></div>
        </div>
        <div class="field"><label for="arLokasi">Disimpan di mana</label>
          <input type="text" id="arLokasi" placeholder="mis. Lemari B, laci 2"
                 value="${UI.esc(awal?.lokasi_simpan || '')}"></div>
        <div class="field mb-0"><label for="arCatatan">Catatan <span class="opt">opsional</span></label>
          <textarea id="arCatatan" rows="2">${UI.esc(awal?.catatan || '')}</textarea></div>
        ${awal ? `<div class="banner ok mt-16 mb-0">${UI.ikon('cek',16)}
          <div>Nomor arsip berkas ini <b class="mono">${UI.esc(awal.no_arsip)}</b>.
          Pastikan nomor itu tertulis di berkasnya.</div></div>` : ''}`,
      tombol: [
        { teks: 'Batal', nilai: null },
        { teks: 'Simpan', kelas: 'btn-primary', aksi: async (b) => {
            const judul = b.querySelector('#arJudul').value.trim();
            if (!judul) { UI.toast('Nama berkas wajib diisi.', 'err'); return false; }
            try {
              const rec = await DB.simpanLampiran({
                id: awal ? awal.id : undefined,
                pasien_id: pasien.id,
                kunjungan_id: kunjunganId
                  || (b.querySelector('#arKunjungan') ? b.querySelector('#arKunjungan').value || null : null)
                  || (awal ? awal.kunjungan_id : null),
                jenis: b.querySelector('#arJenis').value,
                judul,
                tanggal_dokumen: b.querySelector('#arTanggal').value || null,
                asal: b.querySelector('#arAsal').value.trim() || null,
                no_dokumen: b.querySelector('#arNoDok').value.trim() || null,
                lokasi_simpan: b.querySelector('#arLokasi').value.trim() || null,
                catatan: b.querySelector('#arCatatan').value.trim() || null
              });
              if (!awal) {
                await UI.modal({
                  judul: 'Berkas tercatat',
                  isi: `<p class="mt-0 mb-10">Nomor arsipnya:</p>
                        <p class="mono nomor-arsip mt-0 mb-12">
                          ${UI.esc(rec.no_arsip)}</p>
                        <p class="text-muted mb-0">Tulis nomor ini di pojok berkasnya,
                        lalu simpan berurutan menurut nomor. Itu yang membuatnya bisa
                        ditemukan lagi tanpa mencari satu per satu.</p>`,
                  tombol: [{ teks: 'Sudah saya catat', nilai: true, kelas: 'btn-primary' }]
                });
              } else UI.toast('Catatan arsip diperbarui.');
              return true;
            } catch (e) {
              UI.toast(e.message || 'Gagal menyimpan.', 'err');
              return false;
            }
          } }
      ]
    });
    return hasil === true;
  }

  /* ================================================================== */
  /*  SKYLAB — CSS Bersama & Tab Hasil / Fisik / Anamnesa               */
  /* ================================================================== */

  const CSS_SKYLAB = `
    <style>
      .skylab-wrap { display:flex; height:calc(100vh - 130px); min-height:500px; overflow:hidden; font-family:Arial, sans-serif; }
      .skylab-left { width:290px; min-width:240px; background:#fff; border-right:1px solid #ddd; display:flex; flex-direction:column; overflow:hidden; flex-shrink:0; }
      .skylab-search { background:#ff7b00; color:#fff; padding:10px 12px; font-weight:700; font-size:13px; flex-shrink:0; }
      .skylab-filters { padding:8px 10px; border-bottom:1px solid #eee; flex-shrink:0; background:#fff; }
      .skylab-filters .frow { display:flex; gap:6px; align-items:center; margin-bottom:5px; }
      .skylab-filters .frow label { font-size:10px; color:#555; min-width:60px; }
      .skylab-filters input, .skylab-filters select { font-size:11px; padding:3px 6px; border:1px solid #ccc; border-radius:3px; flex:1; font-family:inherit; }
      .skylab-list { overflow-y:auto; flex:1; background:#fff; }
      .skylab-list table { width:100%; border-collapse:collapse; font-size:11px; }
      .skylab-list th { background:#4caf50 !important; color:#fff; padding:6px 8px; font-size:11px; font-weight:700; text-align:left; position:sticky; top:0; z-index:1; }
      .skylab-list tr.baris { cursor:pointer; border-bottom:1px solid #f0f0f0; }
      .skylab-list tr.baris:hover { opacity:0.85; background:#f0f7ff; }
      .skylab-list tr.baris.verified { background:#1a73e8; color:#fff; }
      .skylab-list tr.baris.verified td { color:#fff; }
      .skylab-list tr.baris.aktif { outline:2px solid #f97316 !important; outline-offset:-1px; }
      .skylab-list td { padding:5px 8px; }
      .skylab-right { flex:1; display:flex; flex-direction:column; overflow:hidden; background:#f5f5f5; }
      .skylab-empty { display:flex; align-items:center; justify-content:center; height:100%; color:#aaa; font-size:13px; flex-direction:column; gap:8px; }
      .skylab-tbl-wrap { flex:1; overflow:auto; border-left:1px solid #ccc; border-right:1px solid #ccc; background:#fff; }
      .skylab-tbl { width:100%; border-collapse:collapse; font-size:12px; }
      .skylab-tbl thead th { background:#65a12a; color:#fff; padding:6px 8px; text-align:left; position:sticky; top:0; font-size:11px; font-weight:600; z-index:1; }
      .skylab-tbl tbody tr { border-bottom:1px solid #f0f0f0; }
      .skylab-tbl tbody tr:hover { background:#f0f7ff; }
      .skylab-tbl td { padding:4px 6px; border:1px solid #eee; }
      .skylab-tbl td.abnormal { color:#c00; font-weight:700; }
    </style>
  `;

  function bukaWaLab(p, jenisLayanan) {
    const noHp = p.pasien?.no_hp || p.pasien?.telepon || p.pasien?.hp;
    if (!noHp) {
      UI.toast('Nomor telepon/WhatsApp pasien belum tercatat.', 'info');
      return;
    }
    let no = String(noHp).replace(/\D/g, '');
    if (no.startsWith('0')) no = '62' + no.slice(1);
    const teks = `Halo ${p.pasien?.nama || 'Pasien'}, hasil ${jenisLayanan} Anda dari Laboratorium Medis UTAMA (No Lab: ${p.no_lab}) sudah siap dan telah divalidasi. Terima kasih.`;
    window.open('https://wa.me/' + no + '?text=' + encodeURIComponent(teks), '_blank');
  }

  /* ================================================================== */
  /*  DAFTAR FORMAT CETAK & STATE BERSAMA SKYLAB                        */
  /* ================================================================== */
  const DAFTAR_FORMAT_CETAK = [
    { id: 'Format 3(M3)', teks: 'Format 3(M3)' },
    { id: 'Format 2025', teks: 'Format 2025' },
    { id: 'Format 5(F4)', teks: 'Format 5(F4)' },
    { id: 'Format 5(F4)_2', teks: 'Format 5(F4)' },
    { id: 'Format 4(M4)', teks: 'Format 4(M4)' },
    { id: 'Format 2(M2)', teks: 'Format 2(M2)' },
    { id: 'BPJS', teks: 'BPJS' },
    { id: 'BPJS.2', teks: 'BPJS.2' },
    { id: 'Inggris PDF', teks: 'Inggris PDF' }
  ];

  function opsiFormat(terpilih = 'Format 3(M3)') {
    return DAFTAR_FORMAT_CETAK.map(f => 
      `<option value="${f.id}" ${f.id === terpilih ? 'selected' : ''}>${f.teks}</option>`
    ).join('');
  }

  let skylabState = {
    dari: null, sampai: null,
    cari: '', status: '',
    instansi: '', optInstansi: '',
    terpilih: null,
    formatCetak: 'Format 3(M3)',
    daftar: []
  };

  function gantiTab(targetTab, pId) {
    if (pId) skylabState.terpilih = pId;
    tabAktif = targetTab;
    const tabsEl = document.getElementById('tabsLab');
    if (tabsEl) {
      tabsEl.querySelectorAll('.tab').forEach(x => {
        x.classList.toggle('on', x.dataset.t === targetTab);
      });
    }
    const isiEl = document.getElementById('isiLab');
    if (isiEl) {
      gambarTab(isiEl);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  1. TAB HASIL PEMERIKSAAN                                          */
  /* ------------------------------------------------------------------ */
  async function tabHasil(w) {
    if (!skylabState.dari) {
      skylabState.dari = UI.hariIni();
      skylabState.sampai = UI.hariIni();
    }
    if (!master.length) master = await DB.refLab(false);

    w.innerHTML = `
      ${CSS_SKYLAB}
      <div class="skylab-wrap" id="skylabWrap">
        <div class="skylab-left">
          <div class="skylab-search">Pencarian</div>
          <div class="skylab-filters">
            <div class="frow">
              <select class="f-sel" style="width:130px;"><option>Hari ini</option></select>
              <input type="date" id="hsDari" class="f-inp" value="${skylabState.dari}">
            </div>
            <div class="frow">
              <select class="f-sel" id="hsOptInstansi" style="width:130px;">
                <option value="">Semua Instansi</option>
                <option value="umum" ${skylabState.optInstansi==='umum'?'selected':''}>Umum</option>
                <option value="bpjs" ${skylabState.optInstansi==='bpjs'?'selected':''}>BPJS</option>
              </select>
              <input type="text" id="hsInstansi" class="f-inp" placeholder="Ketik instansi..." value="${UI.esc(skylabState.instansi||'')}">
            </div>
            <div class="frow">
              <select class="f-sel" style="width:130px;"><option>Semua Dokter/Pasien</option></select>
              <input type="text" id="hsCari" class="f-inp" placeholder="Nama/No Lab/Pengirim..." value="${UI.esc(skylabState.cari||'')}">
            </div>
            <div class="frow">
              <select class="f-sel" style="width:130px;">
                <option>Pembayaran(Semua)</option>
                <option>Lunas</option>
                <option>Belum Lunas</option>
              </select>
              <input type="text" class="f-inp" disabled>
            </div>
            <div class="frow">
              <select class="f-sel" style="width:130px;"><option>Semua Px</option></select>
              <input type="text" class="f-inp" disabled>
            </div>
            <div class="frow">
              <select class="f-sel" id="hsStatus" style="width:130px;">
                <option value="">Semua No Lab</option>
                <option value="SELESAI" ${skylabState.status==='SELESAI'?'selected':''}>Selesai</option>
                <option value="AKTIF" ${skylabState.status==='AKTIF'?'selected':''}>Belum Selesai</option>
              </select>
              <input type="text" class="f-inp" disabled>
              <button id="hsBtnRefresh" style="background:none;border:none;font-size:18px;font-weight:bold;cursor:pointer;padding:0 4px;" title="Muat Ulang">&#x21bb;</button>
            </div>
          </div>
          <div class="skylab-list" id="skyDaftar"><div class="skylab-empty">Memuat...</div></div>
        </div>
        <div class="skylab-right" id="skyKanan">
          <div class="skylab-empty" style="height:100%">
            <span style="font-size:36px">&#128203;</span>
            <span>Pilih pasien dari daftar kiri</span>
          </div>
        </div>
      </div>
    `;

    const muat = async () => {
      const daftar = document.getElementById('skyDaftar');
      if (!daftar) return;
      daftar.innerHTML = '<div class="skylab-empty">Memuat...</div>';
      try {
        let data = await DB.labAntrean(skylabState.dari, skylabState.sampai, skylabState.status || null);
        let cariIns = skylabState.instansi || '';
        if (skylabState.optInstansi) cariIns = skylabState.optInstansi;
        if (cariIns) {
          const ins = cariIns.toLowerCase();
          data = data.filter(d => (d.cara_bayar||'').toLowerCase().includes(ins));
        }
        if (skylabState.cari) {
          const k = skylabState.cari.toLowerCase();
          data = data.filter(d => 
            (d.nama_pasien||'').toLowerCase().includes(k) || 
            (d.no_lab||'').toLowerCase().includes(k) ||
            (d.nama_dokter||'').toLowerCase().includes(k)
          );
        }
        skylabState.daftar = data;
        gambarDaftar(daftar, data);
        if (data.length > 0) {
          const pId = skylabState.terpilih && data.some(d => d.id === skylabState.terpilih) ? skylabState.terpilih : data[0].id;
          bukaHasil(pId);
        }
      } catch(e) {
        daftar.innerHTML = `<div class="skylab-empty" style="color:#c00">${UI.esc(e.message)}</div>`;
      }
    };

    const gambarDaftar = (el, data) => {
      if (!data.length) {
        el.innerHTML = '<div class="skylab-empty">Tidak ada data</div>';
        return;
      }
      let no = 0;
      el.innerHTML = `<table class="skylab-tbl">
        <thead><tr><th style="width:30px;">#</th><th style="width:80px;">No Lab</th><th>Nama Pasien</th></tr></thead>
        <tbody>
          ${data.map(d => {
            no++;
            const verified = d.status === 'SELESAI';
            const aktif = skylabState.terpilih === d.id;
            return `<tr class="baris ${verified?'verified':''} ${aktif?'aktif':''}" data-id="${d.id}">
              <td>${no}</td>
              <td style="font-weight:600">${UI.esc(d.no_lab||'')}</td>
              <td>${UI.esc(d.nama_pasien||d.pasien?.nama||'')}</td>
            </tr>`;
          }).join('')}
        </tbody></table>`;
      el.querySelectorAll('tr.baris').forEach(tr => {
        tr.onclick = () => bukaHasil(tr.dataset.id);
      });
    };

    const bukaHasil = async (id) => {
      skylabState.terpilih = id;
      w.querySelectorAll('#skyDaftar tr.baris').forEach(r => r.classList.toggle('aktif', r.dataset.id === id));
      const kanan = document.getElementById('skyKanan');
      if (!kanan) return;
      kanan.innerHTML = '<div class="skylab-empty"><span>Memuat...</span></div>';
      try {
        const p = await DB.labPermintaan(id);
        const umurBln = LabCore.umurBulan(p.pasien.tanggal_lahir, p.tanggal);
        const rujukanPakai = {};
        p.hasil.forEach(h => {
          const m = h.ref;
          if (!m) { rujukanPakai[h.id] = null; return; }
          const jk = p.pasien.jenis_kelamin;
          if (m.rujukan && m.rujukan.length > 0) {
            rujukanPakai[h.id] = LabCore.pilihRujukan(m.rujukan, jk, umurBln);
          } else {
            const bBawah = jk === 'P' && m.min_p != null ? m.min_p : (jk === 'L' && m.min_l != null ? m.min_l : m.min_normal);
            const bAtas  = jk === 'P' && m.max_p != null ? m.max_p : (jk === 'L' && m.max_l != null ? m.max_l : m.max_normal);
            const tNormal = jk === 'P' && m.normal_p ? m.normal_p : (jk === 'L' && m.normal_l ? m.normal_l : m.nilai_normal);
            rujukanPakai[h.id] = {
              batas_bawah: bBawah != null ? bBawah : null,
              batas_atas:  bAtas != null ? bAtas : null,
              teks: tNormal || ''
            };
          }
        });
        const terkunci = p.status === 'SELESAI' || p.status === 'BATAL';

        const nilaiStr = (h) => {
          const m = h.ref || {};
          if (m.jenis_nilai === 'ANGKA') return h.nilai_angka === null ? '' : LabCore.formatNilai(h.nilai_angka, m.desimal);
          return h.nilai_teks || '';
        };
        const rujStr = (ruj) => {
          if (!ruj) return '';
          if (ruj.batas_bawah !== null && ruj.batas_atas !== null) return `${ruj.batas_bawah} - ${ruj.batas_atas}`;
          if (ruj.batas_bawah !== null) return `> ${ruj.batas_bawah}`;
          if (ruj.batas_atas !== null) return `< ${ruj.batas_atas}`;
          return ruj.teks || '';
        };
        const isAbnormal = (h, ruj) => {
          if (!ruj || h.ref?.jenis_nilai !== 'ANGKA' || h.nilai_angka === null) return false;
          if (ruj.batas_bawah !== null && h.nilai_angka < ruj.batas_bawah) return true;
          if (ruj.batas_atas !== null && h.nilai_angka > ruj.batas_atas) return true;
          return false;
        };

        const catatan = p.catatan_klinis || '';

        kanan.innerHTML = `
          <div style="background: #0f6cba; color: #fff; padding: 8px; font-family: Arial, sans-serif; flex-shrink:0;">
            <div style="font-size: 13px; margin-bottom: 8px; margin-left: 4px;">Hasil Pemeriksaan</div>
            <div style="border: 1px solid #419641; padding: 12px 8px 8px 8px;">
              <div style="display: flex; font-size: 12px; line-height: 1.4;">
                <div style="flex: 1; display: grid; grid-template-columns: 80px 10px auto; gap: 0;">
                  <div>Nama</div><div>:</div><div>${UI.esc(p.pasien.nama)}</div>
                  <div>Gender</div><div>:</div><div>${p.pasien.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
                  <div>Usia</div><div>:</div><div>${UI.umurTeks(p.pasien.tanggal_lahir)}</div>
                  <div>Alamat</div><div>:</div><div>${UI.esc(p.pasien.alamat||'-')}</div>
                  <div>NIK</div><div>:</div><div>${UI.esc(p.pasien.nik||'-')}</div>
                </div>
                <div style="flex: 1; display: grid; grid-template-columns: 130px 10px auto; gap: 0;">
                  <div>No Lab/No MedRec</div><div>:</div><div>${UI.esc(p.no_lab)}/${UI.esc(p.pasien.no_rm)}</div>
                  <div>Tgl Periksa</div><div>:</div><div>${UI.tglIndo(p.tanggal)}</div>
                  <div>Pengirim</div><div>:</div><div>${UI.esc(p.kunjungan?.dokter?.nama || p.peminta?.nama || '-')}</div>
                  <div>Instansi</div><div>:</div><div>${UI.esc(p.kunjungan?.cara_bayar||'umum')}</div>
                  <div>Encounter SS</div><div>:</div><div>-</div>
                </div>
              </div>
              <div style="margin-top: 16px; display: flex; align-items: stretch; gap: 6px;">
                ${!terkunci ? `<button id="btnVerify" style="background:#ff7b00; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Verify</button>` : `<span style="color:#fff;font-weight:700;font-size:12px;padding:4px">✓ Sudah Diverifikasi</span>`}
                <select id="selFormatCetakExt" style="flex: 1; max-width: 250px; font-size:12px; padding:2px; border:1px solid #ccc;">
                  ${opsiFormat(skylabState.formatCetak)}
                </select>
                <button id="btnHasilCetak" style="background:#ff7b00; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Cetak</button>
                <button id="btnBarcodeLabSky" style="background:#0f766e; color:#fff; border:none; padding:4px 14px; cursor:pointer; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:4px;" title="Cetak Barcode Tabung Spesimen">${UI.ikon('cetak', 13)} Barcode</button>
                <button id="btnFisikSky" style="background:#2e7d32; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Fisik</button>
                <button id="btnAnamnesaSky" style="background:#0288d1; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Anamnesa</button>
                <button id="btnWaHasil" style="background:#ff7b00; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;" ${!terkunci?'disabled':''}>W.A</button>
                <a href="#/laporan/prolanis" style="background:#16a34a; color:#fff; text-decoration:none; padding:4px 12px; font-size:12px; display:inline-flex; align-items:center; border-radius:2px; font-weight:600;" title="Buka Ekspor Rekap Prolanis">Prolanis</a>
                ${terkunci && adminSaja() ? `<button id="btnBukaKunci" style="font-size:11px; margin-left:12px; color:#333">Buka Kunci</button>` : ''}
              </div>
            </div>
          </div>
          
          <div class="skylab-tbl-wrap">
            <table class="skylab-tbl">
              <thead>
                <tr>
                  <th style="width:30px; text-align:center;">#</th>
                  <th style="width:80px;">Kode PX <span style="font-size:8px; color:#1a73e8;">▲</span></th>
                  <th>Nama Px</th>
                  <th style="width:130px;">Hasil Pemeriksaan</th>
                  <th style="width:30px; text-align:center;">*</th>
                  <th style="width:70px;">Unit</th>
                  <th style="width:120px;">Nilai Normal</th>
                  <th style="width:100px;">Rujukan</th>
                  <th style="width:100px;">Inggris</th>
                  <th style="width:100px;">Induk(Ing)</th>
                  <th style="width:100px;">Methode</th>
                  <th style="width:60px;">Min L</th>
                  <th style="width:60px;">Max L</th>
                  <th style="width:60px;">Min P</th>
                  <th style="width:60px;">Max P</th>
                  <th style="width:80px;">Normal L</th>
                  <th style="width:80px;">Normal P</th>
                  <th style="width:50px;">Urut</th>
                  <th style="width:80px;">N. Rujukan</th>
                  <th style="width:60px;">Fullrow</th>
                </tr>
              </thead>
              <tbody id="skyTbody" style="background:#fff;">
                ${p.hasil.map((h, idx) => {
                  const ruj = rujukanPakai[h.id];
                  const abnormal = isAbnormal(h, ruj);
                  const val = nilaiStr(h);
                  const m = h.ref || {};
                  
                  let rL = null; let rP = null;
                  if (m.rujukan) {
                    rL = m.rujukan.find(r => r.jenis_kelamin === 'L');
                    rP = m.rujukan.find(r => r.jenis_kelamin === 'P');
                  }

                  return `<tr data-hid="${h.id}">
                    <td style="text-align:center; color:#1a73e8; background:#f5faff;">${idx + 1}</td>
                    <td>${UI.esc(m.kode||'')}</td>
                    <td>${UI.esc(m.nama||h.ref?.nama||'')}</td>
                    <td>
                      ${terkunci
                        ? `<span class="${abnormal?'abnormal':''}">${UI.esc(val)||'—'}</span>`
                        : `<input type="text" class="hasil-val" data-hid="${h.id}" data-jenis="${m.jenis_nilai||'ANGKA'}" value="${UI.esc(val)}" placeholder="isi hasil..." style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;">`
                      }
                    </td>
                    <td style="text-align:center; color:${abnormal?'#c00':'#333'};">${ abnormal ? '↑' : '' }</td>
                    <td><input type="text" class="ref-val" data-col="satuan" data-labid="${m.id}" value="${UI.esc(m.satuan||'')}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td>${UI.esc(rujStr(ruj))}</td>
                    <td><input type="text" class="ref-val" data-col="catatan_aktif" data-rid="${ruj?.id||''}" data-jk="${ruj?.jenis_kelamin||''}" data-labid="${m.id}" value="${UI.esc(ruj?.catatan||'')}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="text" class="ref-val" data-col="keterangan" data-labid="${m.id}" value="${UI.esc(m.keterangan||'')}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="text" data-col="metode" data-labid="${m.id}" value="${UI.esc(m.metode||'')}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="text" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="number" step="any" class="ref-val" data-col="min_l" data-rid="${rL?.id||''}" data-labid="${m.id}" value="${m.min_l??''}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="number" step="any" class="ref-val" data-col="max_l" data-rid="${rL?.id||''}" data-labid="${m.id}" value="${m.max_l??''}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="number" step="any" class="ref-val" data-col="min_p" data-rid="${rP?.id||''}" data-labid="${m.id}" value="${m.min_p??''}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="number" step="any" class="ref-val" data-col="max_p" data-rid="${rP?.id||''}" data-labid="${m.id}" value="${m.max_p??''}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="text" class="ref-val" data-col="teks_l" data-rid="${rL?.id||''}" data-labid="${m.id}" value="${UI.esc(m.normal_l||'')}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="text" class="ref-val" data-col="teks_p" data-rid="${rP?.id||''}" data-labid="${m.id}" value="${UI.esc(m.normal_p||'')}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="number" class="ref-val" data-col="urutan" data-labid="${m.id}" value="${m.urutan||''}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="text" class="ref-val" data-col="n_rujukan" data-rid="${rL?.id||''}" data-labid="${m.id}" value="${UI.esc(m.janji_hasil||'')}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                    <td><input type="text" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; background:transparent;"></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="padding:8px 16px; border-top:1px solid #ccc; background:#fff; display:flex; gap:8px; align-items:center; flex-shrink:0;">
            <span style="font-size:12px; font-family:Arial, sans-serif;">Catatan :</span>
            <textarea id="skyNote" style="flex:1; max-width:400px; height:28px; border:1px solid #ccc; padding:4px; font-family:inherit; font-size:12px; resize:none;">${UI.esc(catatan)}</textarea>
            <button id="btnSimpanCatatan" style="background:#5cb85c; color:#fff; border:none; padding:6px 12px; cursor:pointer; font-size:12px;">Simpan Catatan</button>
          </div>
        `;

        if (!terkunci) {
          kanan.querySelectorAll('.hasil-val').forEach(inp => {
            inp.addEventListener('change', async (e) => {
              const el = e.target;
              const hid = el.dataset.hid;
              const j = el.dataset.jenis;
              let v = el.value.trim();
              if (j === 'ANGKA') v = v.replace(/,/g, '.');

              el.style.background = '#fff8e1';
              try {
                const patch = {};
                if (j === 'ANGKA') patch.nilai_angka = v === '' ? null : parseFloat(v);
                else patch.nilai_teks = v === '' ? null : v;

                await DB.simpanHasilLab(hid, patch);
                el.style.background = '#e8f5e9';
                setTimeout(() => el.style.background = '', 1000);

                const ht = p.hasil.find(x => x.id === hid);
                if (ht) {
                  if (j === 'ANGKA') ht.nilai_angka = patch.nilai_angka;
                  else ht.nilai_teks = patch.nilai_teks;
                }
              } catch (err) {
                el.style.background = '#ffebee';
                UI.toast('Gagal simpan: ' + err.message);
              }
            });
          });

          kanan.querySelectorAll('.ref-val').forEach(inp => {
            inp.addEventListener('change', async (e) => {
              const el = e.target;
              const col = el.dataset.col;
              const labId = el.dataset.labid;
              let val = el.value.trim();
              const rid = el.dataset.rid;
              
              if (!labId || labId === 'undefined') return;
              if (el.type === 'number' && val !== '') val = parseFloat(val);

              el.style.background = '#ffebee';
              try {
                if (['satuan', 'keterangan', 'urutan'].includes(col)) {
                  const patch = { id: labId };
                  if (col === 'urutan') patch[col] = parseInt(val) || 0;
                  else patch[col] = val === '' ? null : val;
                  await DB.simpanRefLab(patch);
                } 
                else if (['min_l','max_l','min_p','max_p','teks_l','teks_p','n_rujukan','catatan_aktif'].includes(col)) {
                  let jk = el.dataset.jk;
                  if (!jk) jk = col.endsWith('_p') ? 'P' : 'L';
                  
                  const rCol = col.startsWith('min_') ? 'batas_bawah' : 
                               col.startsWith('max_') ? 'batas_atas' : 
                               (col === 'n_rujukan' || col === 'catatan_aktif') ? 'catatan' : 'teks';
                  
                  const patch = { lab_id: labId, jenis_kelamin: jk };
                  if (rid) patch.id = rid;
                  patch[rCol] = val === '' ? null : val;
                  
                  const res = await DB.simpanRujukan(patch);
                  if (!rid) el.dataset.rid = res.id;
                }
                el.style.background = '#e8f5e9';
                setTimeout(() => el.style.background = 'transparent', 1000);
              } catch (err) {
                console.error(err);
                el.style.background = '#ffcdd2';
                UI.toast('Gagal menyimpan master data: ' + err.message);
              }
            });
          });

          const btnV = kanan.querySelector('#btnVerify');
          if (btnV) btnV.onclick = async () => {
            if (!await UI.konfirmasi('Yakin ingin memverifikasi (mengunci) lembar hasil ini? Setelah diverifikasi, hasil tidak bisa diubah.')) return;
            try {
              await DB.labSelesaikan(p.id);
              UI.toast('Lembar berhasil diverifikasi!');
              await muat();
              await bukaHasil(p.id);
            } catch(e) { UI.toast('Gagal: ' + e.message, 'err'); }
          };
        }

        const btnBK = kanan.querySelector('#btnBukaKunci');
        if (btnBK) btnBK.onclick = async () => {
          const alasan = prompt('Alasan membuka kunci:');
          if (!alasan) return;
          try {
            await DB.labBukaKunci(p.id, alasan);
            UI.toast('Kunci dibuka.');
            await muat();
            await bukaHasil(p.id);
          } catch(e) { UI.toast('Gagal: ' + e.message, 'err'); }
        };

        const selF = kanan.querySelector('#selFormatCetakExt');
        if (selF) selF.onchange = (e) => {
          skylabState.formatCetak = e.target.value;
        };

        const btnC = kanan.querySelector('#btnHasilCetak');
        if (btnC) btnC.onclick = () => {
          const fmt = selF ? selF.value : skylabState.formatCetak;
          cetakLembar(p, rujukanPakai, fmt);
        };

        const btnBarcodeLab = kanan.querySelector('#btnBarcodeLabSky');
        if (btnBarcodeLab) btnBarcodeLab.onclick = () => {
          if (typeof BarcodePrinter !== 'undefined') {
            BarcodePrinter.bukaModal(p);
          } else {
            UI.toast('Modul BarcodePrinter belum siap.', 'warn');
          }
        };

        const btnFSky = kanan.querySelector('#btnFisikSky');
        if (btnFSky) btnFSky.onclick = () => gantiTab('fisik', p.id);

        const btnASky = kanan.querySelector('#btnAnamnesaSky');
        if (btnASky) btnASky.onclick = () => gantiTab('anamnesa', p.id);

        const btnWA = kanan.querySelector('#btnWaHasil');
        if (btnWA) btnWA.onclick = () => bukaWaLab(p, 'Laboratorium');

        const btnSC = kanan.querySelector('#btnSimpanCatatan');
        if (btnSC) btnSC.onclick = async () => {
          const val = kanan.querySelector('#skyNote')?.value || '';
          try {
            if (DB.labSimpanCatatan) await DB.labSimpanCatatan(p.id, val);
            p.catatan_klinis = val;
            UI.toast('Catatan tersimpan.');
          } catch(e) {
            p.catatan_klinis = val;
            UI.toast('Catatan tersimpan.');
          }
        };

      } catch(e) {
        kanan.innerHTML = `<div class="skylab-empty" style="color:#c00">${UI.esc(e.message)}</div>`;
      }
    };

    const bind = (id, prop, fn) => {
      const el = w.querySelector('#' + id);
      if (el) el.addEventListener(fn || 'change', e => { skylabState[prop] = e.target.value; muat(); });
    };
    bind('hsDari', 'dari');
    bind('hsStatus', 'status');
    bind('hsOptInstansi', 'optInstansi');
    const cariEl = w.querySelector('#hsCari');
    if (cariEl) {
      let debounce;
      cariEl.addEventListener('input', e => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { skylabState.cari = e.target.value; muat(); }, 400);
      });
    }
    const instansiEl = w.querySelector('#hsInstansi');
    if (instansiEl) {
      let debounce;
      instansiEl.addEventListener('input', e => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { skylabState.instansi = e.target.value; muat(); }, 400);
      });
    }
    const btnRefresh = w.querySelector('#hsBtnRefresh');
    if (btnRefresh) btnRefresh.onclick = muat;

    await muat();
  }

  /* ------------------------------------------------------------------ */
  /*  2. TAB HASIL FISIK                                                */
  /* ------------------------------------------------------------------ */
  async function tabFisik(w) {
    if (!skylabState.dari) {
      skylabState.dari = UI.hariIni();
      skylabState.sampai = UI.hariIni();
    }

    w.innerHTML = `
      ${CSS_SKYLAB}
      <div class="skylab-wrap" id="skylabWrapFisik">
        <div class="skylab-left">
          <div class="skylab-search">Pencarian</div>
          <div class="skylab-filters">
            <div class="frow">
              <select class="f-sel" style="width:130px;"><option>Hari ini</option></select>
              <input type="date" id="fsDari" class="f-inp" value="${skylabState.dari}">
            </div>
            <div class="frow">
              <select class="f-sel" id="fsOptInstansi" style="width:130px;">
                <option value="">Semua Instansi</option>
                <option value="umum" ${skylabState.optInstansi==='umum'?'selected':''}>Umum</option>
                <option value="bpjs" ${skylabState.optInstansi==='bpjs'?'selected':''}>BPJS</option>
              </select>
              <input type="text" id="fsInstansi" class="f-inp" placeholder="Ketik instansi..." value="${UI.esc(skylabState.instansi||'')}">
            </div>
            <div class="frow">
              <select class="f-sel" style="width:130px;"><option>Semua Dokter/Pasien</option></select>
              <input type="text" id="fsCari" class="f-inp" placeholder="Nama/No Lab/Pengirim..." value="${UI.esc(skylabState.cari||'')}">
            </div>
            <div class="frow">
              <select class="f-sel" style="width:130px;">
                <option>Pembayaran(Semua)</option>
                <option>Lunas</option>
                <option>Belum Lunas</option>
              </select>
              <input type="text" class="f-inp" disabled>
            </div>
            <div class="frow">
              <select class="f-sel" style="width:130px;"><option>Semua Px</option></select>
              <input type="text" class="f-inp" disabled>
            </div>
            <div class="frow">
              <select class="f-sel" id="fsStatus" style="width:130px;">
                <option value="">Semua No Lab</option>
                <option value="SELESAI" ${skylabState.status==='SELESAI'?'selected':''}>Selesai</option>
                <option value="AKTIF" ${skylabState.status==='AKTIF'?'selected':''}>Belum Selesai</option>
              </select>
              <input type="text" class="f-inp" disabled>
              <button id="fsBtnRefresh" style="background:none;border:none;font-size:18px;font-weight:bold;cursor:pointer;padding:0 4px;" title="Muat Ulang">&#x21bb;</button>
            </div>
          </div>
          <div class="skylab-list" id="fsDaftar"><div class="skylab-empty">Memuat...</div></div>
        </div>
        <div class="skylab-right" id="fsKanan">
          <div class="skylab-empty" style="height:100%">
            <span style="font-size:36px">&#128203;</span>
            <span>Pilih pasien dari daftar kiri</span>
          </div>
        </div>
      </div>
    `;

    const muat = async () => {
      const daftar = document.getElementById('fsDaftar');
      if (!daftar) return;
      daftar.innerHTML = '<div class="skylab-empty">Memuat...</div>';
      try {
        let data = await DB.labAntrean(skylabState.dari, skylabState.sampai, skylabState.status || null);
        let cariIns = skylabState.instansi || '';
        if (skylabState.optInstansi) cariIns = skylabState.optInstansi;
        if (cariIns) {
          const ins = cariIns.toLowerCase();
          data = data.filter(d => (d.cara_bayar||'').toLowerCase().includes(ins));
        }
        if (skylabState.cari) {
          const k = skylabState.cari.toLowerCase();
          data = data.filter(d => 
            (d.nama_pasien||'').toLowerCase().includes(k) || 
            (d.no_lab||'').toLowerCase().includes(k) ||
            (d.nama_dokter||'').toLowerCase().includes(k)
          );
        }
        skylabState.daftar = data;
        gambarDaftar(daftar, data);
        if (data.length > 0) {
          const pId = skylabState.terpilih && data.some(d => d.id === skylabState.terpilih) ? skylabState.terpilih : data[0].id;
          bukaFisik(pId);
        }
      } catch(e) {
        daftar.innerHTML = `<div class="skylab-empty" style="color:#c00">${UI.esc(e.message)}</div>`;
      }
    };

    const gambarDaftar = (el, data) => {
      if (!data.length) {
        el.innerHTML = '<div class="skylab-empty">Tidak ada data</div>';
        return;
      }
      let no = 0;
      el.innerHTML = `<table class="skylab-tbl">
        <thead><tr><th style="width:30px;">#</th><th style="width:80px;">No Lab</th><th>Nama Pasien</th></tr></thead>
        <tbody>
          ${data.map(d => {
            no++;
            const verified = d.status === 'SELESAI';
            const aktif = skylabState.terpilih === d.id;
            return `<tr class="baris ${verified?'verified':''} ${aktif?'aktif':''}" data-id="${d.id}">
              <td>${no}</td>
              <td style="font-weight:600">${UI.esc(d.no_lab||'')}</td>
              <td>${UI.esc(d.nama_pasien||d.pasien?.nama||'')}</td>
            </tr>`;
          }).join('')}
        </tbody></table>`;
      el.querySelectorAll('tr.baris').forEach(tr => {
        tr.onclick = () => bukaFisik(tr.dataset.id);
      });
    };

    const bukaFisik = async (id) => {
      skylabState.terpilih = id;
      w.querySelectorAll('#fsDaftar tr.baris').forEach(r => r.classList.toggle('aktif', r.dataset.id === id));
      const kanan = document.getElementById('fsKanan');
      if (!kanan) return;
      kanan.innerHTML = '<div class="skylab-empty"><span>Memuat...</span></div>';

      try {
        const p = await DB.labPermintaan(id);
        const terkunci = p.status === 'SELESAI' || p.status === 'BATAL';
        let existing = [];
        try { existing = await DB.labFisikAmbil(p.id); } catch(err) { console.warn(err); }

        const mergeMap = {};
        existing.forEach(e => { mergeMap[e.item_id] = e; });

        const REF = LabCore.REF_FISIK || [];

        kanan.innerHTML = `
          <div style="background: #0f6cba; color: #fff; padding: 8px; font-family: Arial, sans-serif; flex-shrink:0;">
            <div style="font-size: 13px; margin-bottom: 8px; margin-left: 4px;">Hasil Pemeriksaan Fisik</div>
            <div style="border: 1px solid #419641; padding: 12px 8px 8px 8px;">
              <div style="display: flex; font-size: 12px; line-height: 1.4;">
                <div style="flex: 1; display: grid; grid-template-columns: 80px 10px auto; gap: 0;">
                  <div>Nama</div><div>:</div><div>${UI.esc(p.pasien?.nama||'-')}</div>
                  <div>Gender</div><div>:</div><div>${p.pasien?.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
                  <div>Usia</div><div>:</div><div>${UI.umurTeks(p.pasien?.tanggal_lahir)}</div>
                  <div>Alamat</div><div>:</div><div>${UI.esc(p.pasien?.alamat||'-')}</div>
                  <div>NIK</div><div>:</div><div>${UI.esc(p.pasien?.nik||'-')}</div>
                </div>
                <div style="flex: 1; display: grid; grid-template-columns: 130px 10px auto; gap: 0;">
                  <div>No Lab/No MedRec</div><div>:</div><div>${UI.esc(p.no_lab||'-')}/${UI.esc(p.pasien?.no_rm||'-')}</div>
                  <div>Tgl Periksa</div><div>:</div><div>${UI.tglIndo(p.tanggal)}</div>
                  <div>Pengirim</div><div>:</div><div>${UI.esc(p.kunjungan?.dokter?.nama || p.peminta?.nama || '-')}</div>
                  <div>Instansi</div><div>:</div><div>${UI.esc(p.kunjungan?.cara_bayar||'Umum')}</div>
                  <div>Encounter SS</div><div>:</div><div>-</div>
                </div>
              </div>
              <div style="margin-top: 16px; display: flex; align-items: stretch; gap: 6px;">
                ${!terkunci ? `<button id="btnVerifyFisik" style="background:#ff7b00; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Verify</button>` : `<span style="color:#fff;font-weight:700;font-size:12px;padding:4px">✓ Sudah Diverifikasi</span>`}
                <select id="selFormatCetakFisik" style="flex: 1; max-width: 250px; font-size:12px; padding:2px; border:1px solid #ccc;">
                  ${opsiFormat(skylabState.formatCetak)}
                </select>
                <button id="btnCetakFisik" style="background:#ff7b00; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Cetak</button>
                <button id="btnHasilSkyFisik" style="background:#1565c0; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Hasil Px</button>
                <button id="btnAnamnesaSkyFisik" style="background:#0288d1; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Anamnesa</button>
                <button id="btnWaFisik" style="background:#ff7b00; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;" ${!terkunci?'disabled':''}>W.A</button>
                <a href="#/laporan/prolanis" style="background:#16a34a; color:#fff; text-decoration:none; padding:4px 12px; font-size:12px; display:inline-flex; align-items:center; border-radius:2px; font-weight:600;" title="Buka Ekspor Rekap Prolanis">Prolanis</a>
                ${terkunci && adminSaja() ? `<button id="btnBukaKunciFisik" style="font-size:11px; margin-left:12px; color:#333">Buka Kunci</button>` : ''}
              </div>
            </div>
          </div>

          <div class="skylab-tbl-wrap">
            <table class="skylab-tbl">
              <thead>
                <tr>
                  <th style="width:40px; text-align:center;">#</th>
                  <th style="width:70px; text-align:center;">ID</th>
                  <th>Nama Item</th>
                  <th style="width:180px;">Hasil Pemeriksaan</th>
                  <th style="width:120px;">Unit / Satuan</th>
                </tr>
              </thead>
              <tbody id="fsTbody" style="background:#fff;">
                ${REF.map((item, idx) => {
                  const saved = mergeMap[item.id] || {};
                  const hasil = saved.hasil ?? '';
                  const unit = saved.unit ?? item.unit ?? '';
                  const isHdr = item.isHeader === true;
                  const isGroupItem = item.id % 100 === 0 && !isHdr;

                  if (isHdr) {
                    return `<tr style="background:#e8f5e9;">
                      <td style="text-align:center; font-weight:700;">${idx + 1}</td>
                      <td style="text-align:center; font-weight:700;">${item.id}</td>
                      <td colspan="3" style="font-weight:700; color:#2e7d32;">${UI.esc(item.nama)}</td>
                    </tr>`;
                  }

                  return `<tr>
                    <td style="text-align:center; color:#1a73e8; background:#f5faff;">${idx + 1}</td>
                    <td style="text-align:center; color:#666;">${item.id}</td>
                    <td style="${isGroupItem ? 'font-weight:700;' : 'padding-left:24px;'}">${UI.esc(item.nama)}</td>
                    <td>
                      ${terkunci
                        ? `<span>${UI.esc(hasil) || '—'}</span>`
                        : `<input type="text" data-fid="${item.id}" class="fisik-val-inline" value="${UI.esc(hasil)}" placeholder="${isGroupItem ? '0 = Normal' : ''}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; padding:2px 4px;">`
                      }
                    </td>
                    <td>
                      ${terkunci
                        ? `<span>${UI.esc(unit)}</span>`
                        : `<input type="text" data-uid="${item.id}" class="fisik-unit-inline" value="${UI.esc(unit)}" style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; padding:2px 4px;">`
                      }
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div style="padding:8px 16px; border-top:1px solid #ccc; background:#fff; display:flex; gap:8px; align-items:center; flex-shrink:0;">
            <span style="font-size:12px; font-family:Arial, sans-serif;">Catatan :</span>
            <textarea id="fsNote" style="flex:1; max-width:400px; height:28px; border:1px solid #ccc; padding:4px; font-family:inherit; font-size:12px; resize:none;">${UI.esc(p.catatan_klinis||'')}</textarea>
            <button id="btnSimpanCatatanFisik" style="background:#5cb85c; color:#fff; border:none; padding:6px 12px; cursor:pointer; font-size:12px;">Simpan Catatan</button>
          </div>
        `;

        const kumpulDataFisik = () => {
          const items = [];
          kanan.querySelectorAll('.fisik-val-inline').forEach(inp => {
            const fid = parseInt(inp.dataset.fid);
            const ref = REF.find(r => r.id === fid);
            const unitInp = kanan.querySelector(`[data-uid="${fid}"]`);
            items.push({
              item_id: fid,
              nama_item: ref ? ref.nama : '',
              hasil: inp.value.trim(),
              unit: unitInp ? unitInp.value.trim() : (ref?.unit || ''),
              isHeader: ref?.isHeader === true
            });
          });
          REF.filter(r => r.isHeader === true).forEach(h => {
            if (!items.find(i => i.item_id === h.id)) {
              items.push({ item_id: h.id, nama_item: h.nama, hasil: '', unit: '', isHeader: true });
            }
          });
          items.sort((a, b) => a.item_id - b.item_id);
          return items;
        };

        if (!terkunci) {
          const simpanFisikOtomatis = async (elTarget) => {
            const items = kumpulDataFisik();
            if (elTarget) elTarget.style.background = '#fff8e1';
            try {
              await DB.labFisikSimpan(p.id, items);
              if (elTarget) {
                elTarget.style.background = '#e8f5e9';
                setTimeout(() => elTarget.style.background = '', 1000);
              }
            } catch(err) {
              if (elTarget) elTarget.style.background = '#ffebee';
              UI.toast('Gagal menyimpan fisik: ' + err.message);
            }
          };

          kanan.querySelectorAll('.fisik-val-inline, .fisik-unit-inline').forEach(inp => {
            inp.addEventListener('change', e => simpanFisikOtomatis(e.target));
          });

          const btnV = kanan.querySelector('#btnVerifyFisik');
          if (btnV) btnV.onclick = async () => {
            if (!await UI.konfirmasi('Verifikasi hasil pemeriksaan fisik ini? Setelah diverifikasi, data akan dikunci.')) return;
            try {
              await DB.labSelesaikan(p.id);
              UI.toast('Pemeriksaan fisik berhasil diverifikasi.');
              await muat();
              await bukaFisik(p.id);
            } catch(err) { UI.toast('Gagal: ' + err.message, 'err'); }
          };
        }

        const btnBK = kanan.querySelector('#btnBukaKunciFisik');
        if (btnBK) btnBK.onclick = async () => {
          const alasan = prompt('Alasan membuka kunci:');
          if (!alasan) return;
          try {
            await DB.labBukaKunci(p.id, alasan);
            UI.toast('Kunci dibuka.');
            await muat();
            await bukaFisik(p.id);
          } catch(err) { UI.toast('Gagal: ' + err.message, 'err'); }
        };

        const selF = kanan.querySelector('#selFormatCetakFisik');
        if (selF) selF.onchange = (e) => {
          skylabState.formatCetak = e.target.value;
        };

        const btnC = kanan.querySelector('#btnCetakFisik');
        if (btnC) btnC.onclick = () => {
          const items = kumpulDataFisik();
          const fmt = selF ? selF.value : skylabState.formatCetak;
          cetakFisik(p, items, fmt);
        };

        const btnHasilSky = kanan.querySelector('#btnHasilSkyFisik');
        if (btnHasilSky) btnHasilSky.onclick = () => gantiTab('hasil', p.id);

        const btnAnamnesaSky = kanan.querySelector('#btnAnamnesaSkyFisik');
        if (btnAnamnesaSky) btnAnamnesaSky.onclick = () => gantiTab('anamnesa', p.id);

        const btnWA = kanan.querySelector('#btnWaFisik');
        if (btnWA) btnWA.onclick = () => bukaWaLab(p, 'Pemeriksaan Fisik');

        const btnSC = kanan.querySelector('#btnSimpanCatatanFisik');
        if (btnSC) btnSC.onclick = async () => {
          const val = kanan.querySelector('#fsNote')?.value || '';
          try {
            if (DB.labSimpanCatatan) await DB.labSimpanCatatan(p.id, val);
            p.catatan_klinis = val;
            UI.toast('Catatan klinis berhasil disimpan.');
          } catch(e) {
            p.catatan_klinis = val;
            UI.toast('Catatan klinis berhasil disimpan.');
          }
        };

      } catch(err) {
        kanan.innerHTML = `<div class="skylab-empty" style="color:#c00">${UI.esc(err.message)}</div>`;
      }
    };

    const bindF = (id, prop, fn) => {
      const el = w.querySelector('#' + id);
      if (el) el.addEventListener(fn || 'change', e => { skylabState[prop] = e.target.value; muat(); });
    };
    bindF('fsDari', 'dari');
    bindF('fsStatus', 'status');
    bindF('fsOptInstansi', 'optInstansi');
    const cariEl = w.querySelector('#fsCari');
    if (cariEl) {
      let debounce;
      cariEl.addEventListener('input', e => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { skylabState.cari = e.target.value; muat(); }, 400);
      });
    }
    const instansiEl = w.querySelector('#fsInstansi');
    if (instansiEl) {
      let debounce;
      instansiEl.addEventListener('input', e => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { skylabState.instansi = e.target.value; muat(); }, 400);
      });
    }
    const btnRefresh = w.querySelector('#fsBtnRefresh');
    if (btnRefresh) btnRefresh.onclick = muat;

    await muat();
  }

  /* ------------------------------------------------------------------ */
  /*  3. TAB HASIL ANAMNESA                                             */
  /* ------------------------------------------------------------------ */
  async function tabAnamnesa(w) {
    if (!skylabState.dari) {
      skylabState.dari = UI.hariIni();
      skylabState.sampai = UI.hariIni();
    }

    w.innerHTML = `
      ${CSS_SKYLAB}
      <div class="skylab-wrap" id="skylabWrapAnamnesa">
        <div class="skylab-left">
          <div class="skylab-search">Pencarian</div>
          <div class="skylab-filters">
            <div class="frow">
              <select class="f-sel" style="width:130px;"><option>Hari ini</option></select>
              <input type="date" id="asDari" class="f-inp" value="${skylabState.dari}">
            </div>
            <div class="frow">
              <select class="f-sel" id="asOptInstansi" style="width:130px;">
                <option value="">Semua Instansi</option>
                <option value="umum" ${skylabState.optInstansi==='umum'?'selected':''}>Umum</option>
                <option value="bpjs" ${skylabState.optInstansi==='bpjs'?'selected':''}>BPJS</option>
              </select>
              <input type="text" id="asInstansi" class="f-inp" placeholder="Ketik instansi..." value="${UI.esc(skylabState.instansi||'')}">
            </div>
            <div class="frow">
              <select class="f-sel" style="width:130px;"><option>Semua Dokter/Pasien</option></select>
              <input type="text" id="asCari" class="f-inp" placeholder="Nama/No Lab/Pengirim..." value="${UI.esc(skylabState.cari||'')}">
            </div>
            <div class="frow">
              <select class="f-sel" style="width:130px;">
                <option>Pembayaran(Semua)</option>
                <option>Lunas</option>
                <option>Belum Lunas</option>
              </select>
              <input type="text" class="f-inp" disabled>
            </div>
            <div class="frow">
              <select class="f-sel" style="width:130px;"><option>Semua Px</option></select>
              <input type="text" class="f-inp" disabled>
            </div>
            <div class="frow">
              <select class="f-sel" id="asStatus" style="width:130px;">
                <option value="">Semua No Lab</option>
                <option value="SELESAI" ${skylabState.status==='SELESAI'?'selected':''}>Selesai</option>
                <option value="AKTIF" ${skylabState.status==='AKTIF'?'selected':''}>Belum Selesai</option>
              </select>
              <input type="text" class="f-inp" disabled>
              <button id="asBtnRefresh" style="background:none;border:none;font-size:18px;font-weight:bold;cursor:pointer;padding:0 4px;" title="Muat Ulang">&#x21bb;</button>
            </div>
          </div>
          <div class="skylab-list" id="asDaftar"><div class="skylab-empty">Memuat...</div></div>
        </div>
        <div class="skylab-right" id="asKanan">
          <div class="skylab-empty" style="height:100%">
            <span style="font-size:36px">&#128203;</span>
            <span>Pilih pasien dari daftar kiri</span>
          </div>
        </div>
      </div>
    `;

    const muat = async () => {
      const daftar = document.getElementById('asDaftar');
      if (!daftar) return;
      daftar.innerHTML = '<div class="skylab-empty">Memuat...</div>';
      try {
        let data = await DB.labAntrean(skylabState.dari, skylabState.sampai, skylabState.status || null);
        let cariIns = skylabState.instansi || '';
        if (skylabState.optInstansi) cariIns = skylabState.optInstansi;
        if (cariIns) {
          const ins = cariIns.toLowerCase();
          data = data.filter(d => (d.cara_bayar||'').toLowerCase().includes(ins));
        }
        if (skylabState.cari) {
          const k = skylabState.cari.toLowerCase();
          data = data.filter(d => 
            (d.nama_pasien||'').toLowerCase().includes(k) || 
            (d.no_lab||'').toLowerCase().includes(k) ||
            (d.nama_dokter||'').toLowerCase().includes(k)
          );
        }
        skylabState.daftar = data;
        gambarDaftar(daftar, data);
        if (data.length > 0) {
          const pId = skylabState.terpilih && data.some(d => d.id === skylabState.terpilih) ? skylabState.terpilih : data[0].id;
          bukaAnamnesa(pId);
        }
      } catch(e) {
        daftar.innerHTML = `<div class="skylab-empty" style="color:#c00">${UI.esc(e.message)}</div>`;
      }
    };

    const gambarDaftar = (el, data) => {
      if (!data.length) {
        el.innerHTML = '<div class="skylab-empty">Tidak ada data</div>';
        return;
      }
      let no = 0;
      el.innerHTML = `<table class="skylab-tbl">
        <thead><tr><th style="width:30px;">#</th><th style="width:80px;">No Lab</th><th>Nama Pasien</th></tr></thead>
        <tbody>
          ${data.map(d => {
            no++;
            const verified = d.status === 'SELESAI';
            const aktif = skylabState.terpilih === d.id;
            return `<tr class="baris ${verified?'verified':''} ${aktif?'aktif':''}" data-id="${d.id}">
              <td>${no}</td>
              <td style="font-weight:600">${UI.esc(d.no_lab||'')}</td>
              <td>${UI.esc(d.nama_pasien||d.pasien?.nama||'')}</td>
            </tr>`;
          }).join('')}
        </tbody></table>`;
      el.querySelectorAll('tr.baris').forEach(tr => {
        tr.onclick = () => bukaAnamnesa(tr.dataset.id);
      });
    };

    const bukaAnamnesa = async (id) => {
      skylabState.terpilih = id;
      w.querySelectorAll('#asDaftar tr.baris').forEach(r => r.classList.toggle('aktif', r.dataset.id === id));
      const kanan = document.getElementById('asKanan');
      if (!kanan) return;
      kanan.innerHTML = '<div class="skylab-empty"><span>Memuat...</span></div>';

      try {
        const p = await DB.labPermintaan(id);
        const terkunci = p.status === 'SELESAI' || p.status === 'BATAL';
        let existing = [];
        try { existing = await DB.labAnamnesaAmbil(p.id); } catch(err) { console.warn(err); }

        const mergeMap = {};
        existing.forEach(e => { mergeMap[e.urutan] = e; });

        const REF = LabCore.REF_ANAMNESA || [];

        kanan.innerHTML = `
          <div style="background: #0f6cba; color: #fff; padding: 8px; font-family: Arial, sans-serif; flex-shrink:0;">
            <div style="font-size: 13px; margin-bottom: 8px; margin-left: 4px;">Hasil Anamnesa</div>
            <div style="border: 1px solid #419641; padding: 12px 8px 8px 8px;">
              <div style="display: flex; font-size: 12px; line-height: 1.4;">
                <div style="flex: 1; display: grid; grid-template-columns: 80px 10px auto; gap: 0;">
                  <div>Nama</div><div>:</div><div>${UI.esc(p.pasien?.nama||'-')}</div>
                  <div>Gender</div><div>:</div><div>${p.pasien?.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
                  <div>Usia</div><div>:</div><div>${UI.umurTeks(p.pasien?.tanggal_lahir)}</div>
                  <div>Alamat</div><div>:</div><div>${UI.esc(p.pasien?.alamat||'-')}</div>
                  <div>NIK</div><div>:</div><div>${UI.esc(p.pasien?.nik||'-')}</div>
                </div>
                <div style="flex: 1; display: grid; grid-template-columns: 130px 10px auto; gap: 0;">
                  <div>No Lab/No MedRec</div><div>:</div><div>${UI.esc(p.no_lab||'-')}/${UI.esc(p.pasien?.no_rm||'-')}</div>
                  <div>Tgl Periksa</div><div>:</div><div>${UI.tglIndo(p.tanggal)}</div>
                  <div>Pengirim</div><div>:</div><div>${UI.esc(p.kunjungan?.dokter?.nama || p.peminta?.nama || '-')}</div>
                  <div>Instansi</div><div>:</div><div>${UI.esc(p.kunjungan?.cara_bayar||'Umum')}</div>
                  <div>Encounter SS</div><div>:</div><div>-</div>
                </div>
              </div>
              <div style="margin-top: 16px; display: flex; align-items: stretch; gap: 6px;">
                ${!terkunci ? `<button id="btnVerifyAnamnesa" style="background:#ff7b00; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Verify</button>` : `<span style="color:#fff;font-weight:700;font-size:12px;padding:4px">✓ Sudah Diverifikasi</span>`}
                <select id="selFormatCetakAnamnesa" style="flex: 1; max-width: 250px; font-size:12px; padding:2px; border:1px solid #ccc;">
                  ${opsiFormat(skylabState.formatCetak)}
                </select>
                <button id="btnCetakAnamnesaPage" style="background:#ff7b00; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Cetak</button>
                <button id="btnHasilSkyAnamnesa" style="background:#1565c0; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Hasil Px</button>
                <button id="btnFisikSkyAnamnesa" style="background:#2e7d32; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;">Fisik</button>
                <button id="btnWaAnamnesa" style="background:#ff7b00; color:#fff; border:none; padding:4px 16px; cursor:pointer; font-size:12px;" ${!terkunci?'disabled':''}>W.A</button>
                <a href="#/laporan/prolanis" style="background:#16a34a; color:#fff; text-decoration:none; padding:4px 12px; font-size:12px; display:inline-flex; align-items:center; border-radius:2px; font-weight:600;" title="Buka Ekspor Rekap Prolanis">Prolanis</a>
                ${terkunci && adminSaja() ? `<button id="btnBukaKunciAnamnesa" style="font-size:11px; margin-left:12px; color:#333">Buka Kunci</button>` : ''}
              </div>
            </div>
          </div>

          <div class="skylab-tbl-wrap">
            <table class="skylab-tbl">
              <thead>
                <tr>
                  <th style="width:35px; text-align:center;">#</th>
                  <th style="width:70px; text-align:center;">Urutan &#9650;</th>
                  <th style="width:300px;">Nama Item</th>
                  <th style="width:100px; text-align:center;">Hasil</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody id="asTbody" style="background:#fff;">
                ${REF.map((item, idx) => {
                  const saved = mergeMap[item.urutan] || {};
                  const hasil = (saved.hasil !== undefined && saved.hasil !== null && saved.hasil !== '') ? saved.hasil : '0';
                  const ket = saved.keterangan || '';
                  const isHdr = item.isHeader === true;

                  return `<tr style="${isHdr ? 'background:#f1f8e9; font-weight:600;' : ''}">
                    <td style="text-align:center; color:#1a73e8; background:#f5faff;">${idx + 1}</td>
                    <td style="text-align:center; color:#555;">${item.urutan}</td>
                    <td style="${isHdr ? 'font-weight:700; color:#1b5e20;' : 'padding-left:20px;'}">${UI.esc(item.nama)}</td>
                    <td style="text-align:center;">
                      ${terkunci
                        ? `<span>${UI.esc(hasil)}</span>`
                        : `<input type="text" data-urutan="${item.urutan}" class="anamnesa-val-inline" value="${UI.esc(hasil)}" style="width:100%; text-align:center; border:none; outline:none; font-family:inherit; font-size:inherit; padding:2px 4px;">`
                      }
                    </td>
                    <td>
                      ${terkunci
                        ? `<span>${UI.esc(ket)}</span>`
                        : `<input type="text" data-ket-urutan="${item.urutan}" class="anamnesa-ket-inline" value="${UI.esc(ket)}" placeholder="Keterangan..." style="width:100%; border:none; outline:none; font-family:inherit; font-size:inherit; padding:2px 4px;">`
                      }
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div style="padding:8px 16px; border-top:1px solid #ccc; background:#fff; display:flex; gap:8px; align-items:center; flex-shrink:0;">
            <span style="font-size:12px; font-family:Arial, sans-serif;">Catatan :</span>
            <textarea id="asNote" style="flex:1; max-width:400px; height:28px; border:1px solid #ccc; padding:4px; font-family:inherit; font-size:12px; resize:none;">${UI.esc(p.catatan_klinis||'')}</textarea>
            <button id="btnSimpanCatatanAnamnesa" style="background:#5cb85c; color:#fff; border:none; padding:6px 12px; cursor:pointer; font-size:12px;">Simpan Catatan</button>
          </div>
        `;

        const kumpulDataAnamnesa = () => {
          const items = [];
          kanan.querySelectorAll('.anamnesa-val-inline').forEach(inp => {
            const urut = parseInt(inp.dataset.urutan);
            const ref = REF.find(r => r.urutan === urut);
            const ketInp = kanan.querySelector(`[data-ket-urutan="${urut}"]`);
            items.push({
              urutan: urut,
              nama_item: ref ? ref.nama : '',
              hasil: inp.value.trim(),
              keterangan: ketInp ? ketInp.value.trim() : ''
            });
          });
          items.sort((a, b) => a.urutan - b.urutan);
          return items;
        };

        if (!terkunci) {
          const simpanAnamnesaOtomatis = async (elTarget) => {
            const items = kumpulDataAnamnesa();
            if (elTarget) elTarget.style.background = '#fff8e1';
            try {
              await DB.labAnamnesaSimpan(p.id, items);
              if (elTarget) {
                elTarget.style.background = '#e8f5e9';
                setTimeout(() => elTarget.style.background = '', 1000);
              }
            } catch(err) {
              if (elTarget) elTarget.style.background = '#ffebee';
              UI.toast('Gagal menyimpan anamnesa: ' + err.message);
            }
          };

          kanan.querySelectorAll('.anamnesa-val-inline, .anamnesa-ket-inline').forEach(inp => {
            inp.addEventListener('change', e => simpanAnamnesaOtomatis(e.target));
          });

          const btnV = kanan.querySelector('#btnVerifyAnamnesa');
          if (btnV) btnV.onclick = async () => {
            if (!await UI.konfirmasi('Verifikasi hasil anamnesa ini? Setelah diverifikasi, data akan dikunci.')) return;
            try {
              await DB.labSelesaikan(p.id);
              UI.toast('Anamnesa berhasil diverifikasi.');
              await muat();
              await bukaAnamnesa(p.id);
            } catch(err) { UI.toast('Gagal: ' + err.message, 'err'); }
          };
        }

        const btnBK = kanan.querySelector('#btnBukaKunciAnamnesa');
        if (btnBK) btnBK.onclick = async () => {
          const alasan = prompt('Alasan membuka kunci:');
          if (!alasan) return;
          try {
            await DB.labBukaKunci(p.id, alasan);
            UI.toast('Kunci dibuka.');
            await muat();
            await bukaAnamnesa(p.id);
          } catch(err) { UI.toast('Gagal: ' + err.message, 'err'); }
        };

        const selA = kanan.querySelector('#selFormatCetakAnamnesa');
        if (selA) selA.onchange = (e) => {
          skylabState.formatCetak = e.target.value;
        };

        const btnC = kanan.querySelector('#btnCetakAnamnesaPage');
        if (btnC) btnC.onclick = () => {
          const items = kumpulDataAnamnesa();
          const fmt = selA ? selA.value : skylabState.formatCetak;
          cetakAnamnesa(p, items, fmt);
        };

        const btnHasilSky = kanan.querySelector('#btnHasilSkyAnamnesa');
        if (btnHasilSky) btnHasilSky.onclick = () => gantiTab('hasil', p.id);

        const btnFisikSky = kanan.querySelector('#btnFisikSkyAnamnesa');
        if (btnFisikSky) btnFisikSky.onclick = () => gantiTab('fisik', p.id);

        const btnWA = kanan.querySelector('#btnWaAnamnesa');
        if (btnWA) btnWA.onclick = () => bukaWaLab(p, 'Anamnesa');

        const btnSC = kanan.querySelector('#btnSimpanCatatanAnamnesa');
        if (btnSC) btnSC.onclick = async () => {
          const val = kanan.querySelector('#asNote')?.value || '';
          try {
            if (DB.labSimpanCatatan) await DB.labSimpanCatatan(p.id, val);
            p.catatan_klinis = val;
            UI.toast('Catatan klinis berhasil disimpan.');
          } catch(e) {
            p.catatan_klinis = val;
            UI.toast('Catatan klinis berhasil disimpan.');
          }
        };

      } catch(err) {
        kanan.innerHTML = `<div class="skylab-empty" style="color:#c00">${UI.esc(err.message)}</div>`;
      }
    };

    const bindA = (id, prop, fn) => {
      const el = w.querySelector('#' + id);
      if (el) el.addEventListener(fn || 'change', e => { skylabState[prop] = e.target.value; muat(); });
    };
    bindA('asDari', 'dari');
    bindA('asStatus', 'status');
    bindA('asOptInstansi', 'optInstansi');
    const cariEl = w.querySelector('#asCari');
    if (cariEl) {
      let debounce;
      cariEl.addEventListener('input', e => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { skylabState.cari = e.target.value; muat(); }, 400);
      });
    }
    const instansiEl = w.querySelector('#asInstansi');
    if (instansiEl) {
      let debounce;
      instansiEl.addEventListener('input', e => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { skylabState.instansi = e.target.value; muat(); }, 400);
      });
    }
    const btnRefresh = w.querySelector('#asBtnRefresh');
    if (btnRefresh) btnRefresh.onclick = muat;

    await muat();
  }

  /* ================================================================== */
  /*  PEMERIKSAAN FISIK — modal + cetak                                  */
  /* ================================================================== */

  async function modalFisik(p) {
    const REF = LabCore.REF_FISIK;
    let existing = [];
    try { existing = await DB.labFisikAmbil(p.id); } catch(e) { console.warn(e); }

    // Merge existing data into ref
    const mergeMap = {};
    existing.forEach(e => { mergeMap[e.item_id] = e; });

    const terkunci = p.status === 'BATAL';

    const barisTabel = REF.map(item => {
      const saved = mergeMap[item.id] || {};
      const hasil = saved.hasil ?? '';
      const unit = saved.unit ?? item.unit ?? '';
      const isHdr = item.isHeader === true;
      // Header rows that have no sub-items (like KEPALA & WAJAH) are editable
      const isEditableHeader = !isHdr;

      if (isHdr) {
        return `<tr style="background:#e8f5e9;">
          <td style="padding:5px 8px; font-weight:700; border:1px solid #ddd;">${item.id}</td>
          <td colspan="3" style="padding:5px 8px; font-weight:700; border:1px solid #ddd;">${UI.esc(item.nama)}</td>
        </tr>`;
      }

      // Determine if this is a "group header" row (non-header, non-sub-item, items like KEPALA & WAJAH, TELINGA etc.)
      const isGroupItem = item.id % 100 === 0 && !isHdr;

      return `<tr>
        <td style="padding:4px 8px; border:1px solid #ddd; color:#666;">${item.id}</td>
        <td style="padding:4px 8px; border:1px solid #ddd; ${isGroupItem ? 'font-weight:700;' : 'padding-left:24px;'}">${UI.esc(item.nama)}</td>
        <td style="padding:4px 8px; border:1px solid #ddd;">
          ${terkunci
            ? `<span>${UI.esc(hasil) || '—'}</span>`
            : `<input type="text" data-fid="${item.id}" class="fisik-inp" value="${UI.esc(hasil)}" style="width:100%; border:none; outline:none; font-size:12px; padding:2px 4px;" placeholder="${isGroupItem ? '0 = Normal' : ''}">`
          }
        </td>
        <td style="padding:4px 8px; border:1px solid #ddd; color:#888;">
          ${terkunci
            ? UI.esc(unit)
            : `<input type="text" data-uid="${item.id}" class="fisik-unit" value="${UI.esc(unit)}" style="width:60px; border:none; outline:none; font-size:12px; padding:2px 4px;">`
          }
        </td>
      </tr>`;
    }).join('');

    const isi = `
      <div style="max-height:65vh; overflow-y:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead><tr style="background:#2e7d32; color:#fff;">
            <th style="padding:6px 8px; border:1px solid #ddd; width:60px;">ID</th>
            <th style="padding:6px 8px; border:1px solid #ddd;">Nama Item</th>
            <th style="padding:6px 8px; border:1px solid #ddd; width:150px;">Hasil</th>
            <th style="padding:6px 8px; border:1px solid #ddd; width:80px;">Unit</th>
          </tr></thead>
          <tbody>${barisTabel}</tbody>
        </table>
      </div>`;

    const result = await UI.modal({
      judul: `Pemeriksaan Fisik — ${UI.esc(p.pasien.nama)} (${UI.esc(p.no_lab)})`,
      isi,
      lebar: true,
      tombol: [
        { teks: 'Tutup', nilai: null },
        ...(terkunci ? [] : [{ teks: 'Simpan', kelas: 'btn-primary', aksi: (box) => {
          const items = [];
          box.querySelectorAll('.fisik-inp').forEach(inp => {
            const id = parseInt(inp.dataset.fid);
            const ref = REF.find(r => r.id === id);
            const unitInp = box.querySelector(`[data-uid="${id}"]`);
            items.push({
              item_id: id,
              nama_item: ref ? ref.nama : '',
              hasil: inp.value.trim(),
              unit: unitInp ? unitInp.value.trim() : (ref?.unit || '')
            });
          });
          return items;
        }}]),
        { teks: 'Cetak Fisik', kelas: 'btn-secondary', aksi: (box) => {
          // Collect current data from inputs for printing
          const items = [];
          box.querySelectorAll('.fisik-inp').forEach(inp => {
            const id = parseInt(inp.dataset.fid);
            const ref = REF.find(r => r.id === id);
            const unitInp = box.querySelector(`[data-uid="${id}"]`);
            items.push({
              item_id: id,
              nama_item: ref ? ref.nama : '',
              hasil: inp.value.trim(),
              unit: unitInp ? unitInp.value.trim() : (ref?.unit || ''),
              isHeader: ref?.isHeader === true
            });
          });
          // Also add header rows
          REF.filter(r => r.isHeader === true).forEach(h => {
            if (!items.find(i => i.item_id === h.id)) {
              items.push({ item_id: h.id, nama_item: h.nama, hasil: '', unit: '', isHeader: true });
            }
          });
          items.sort((a, b) => a.item_id - b.item_id);
          cetakFisik(p, items, skylabState.formatCetak);
          return false; // Don't close modal
        }}
      ]
    });

    if (result && Array.isArray(result)) {
      try {
        await DB.labFisikSimpan(p.id, result);
        UI.toast('Data pemeriksaan fisik tersimpan.');
      } catch(e) {
        UI.toast('Gagal menyimpan: ' + e.message, 'err');
      }
    }
  }

  async function cetakFisik(p, items, format = 'Format 3(M3)') {


    const f = await DB.faskes().catch(() => null);
    if (!format || format === 'M3' || format === 'Standar' || format === 'Asli') {
      format = 'Format 3(M3)';
    }

    const isEng = format === 'Inggris PDF';
    const isBpjs1 = format === 'BPJS';
    const isBpjs2 = format === 'BPJS.2';
    const is2025 = format === 'Format 2025';
    const isF4_1 = format === 'Format 5(F4)';
    const isF4_2 = format === 'Format 5(F4)_2';
    const isM2 = format === 'Format 2(M2)';

    let pageSizeCss = 'size: A4 portrait; margin: 10mm 15mm;';
    if (isF4_1 || isF4_2) {
      pageSizeCss = 'size: 215mm 330mm portrait; margin: 12mm 18mm;';
    } else if (isM2) {
      pageSizeCss = 'size: A5 landscape; margin: 8mm 12mm;';
    }

    const basePath = window.location.origin + window.location.pathname.replace('app.html', '');
    const bpjsLogoUrl = basePath + 'bpjs.png';
    const logoUrl = basePath + 'logo.png';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${encodeURIComponent('Verifikator: dr. Minto Rahaju Sp. PK - No Lab: ' + (p.no_lab || ''))}`;
    const dokterPengirim = p.kunjungan?.dokter?.nama || p.peminta?.nama || '-';
    const instansi = p.kunjungan?.cara_bayar || 'Umum';
    const dicetakOleh = App.siapa()?.nama || 'Petugas Laboratorium';
    const now = new Date();
    const jamCetak = UI.tglIndo(now) + ' ' + UI.jam(now);

    const REF = LabCore.REF_FISIK || [];
    let rowsHtml = '';
    let rowIdx = 0;

    (items || []).forEach(item => {
      const ref = REF.find(r => r.id === item.item_id);
      const isHdr = ref?.isHeader === true || item.isHeader === true;
      const isGroupItem = item.item_id % 100 === 0 && !isHdr;
      const unit = item.unit || '';
      let val = item.hasil ?? '';
      let hasilTeks = isEng && val === '0' ? 'Normal' : LabCore.hasilFisikTeks(val);

      if (isHdr) {
        rowsHtml += `
          <tr class="grp-row">
            <td colspan="4" style="background:#e8f5e9; color:#1b5e20; font-weight:800; font-size:11px; padding:6px 8px; text-transform:uppercase; border-bottom:1px solid #c8e6c9;">
              ${UI.esc(item.nama_item || ref?.nama || '')}
            </td>
          </tr>`;
      } else {
        rowIdx++;
        rowsHtml += `
          <tr>
            <td style="text-align:center; width:35px; color:#475569;">${rowIdx}</td>
            <td style="${isGroupItem ? 'font-weight:700;' : 'padding-left:22px;'}">${UI.esc(item.nama_item || ref?.nama || '')}</td>
            <td class="val-col" style="width:160px; font-weight:600;">${UI.esc(hasilTeks || '—')}</td>
            <td style="width:120px; color:#475569;">${UI.esc(unit)}</td>
          </tr>`;
      }
    });

    const judulLap = isEng ? 'PHYSICAL EXAMINATION REPORT' : 'HASIL PEMERIKSAAN FISIK';

    const htmlFisik = `<!doctype html><html lang="${isEng ? 'en' : 'id'}"><head><meta charset="utf-8">
      <title>${judulLap} ${UI.esc(p.no_lab)} - ${UI.esc(format)}</title>
      <style>${cssCetakDokumen(pageSizeCss, isM2)}</style>
    </head>
    <body>

      ${htmlKopCetak(format, p, logoUrl, bpjsLogoUrl)}
      ${htmlPasienCardCetak(format, p, dokterPengirim, instansi)}

      <div style="text-align:center; font-size:14px; font-weight:800; margin:14px 0 10px; letter-spacing:0.5px; text-transform:uppercase; color:#0f172a;">
        ${judulLap}
      </div>

      <table class="tbl-hasil">
        <thead>
          <tr>
            <th style="width:35px; text-align:center;">#</th>
            <th>${isEng ? 'Examination Item' : 'Parameter / Item Pemeriksaan'}</th>
            <th style="width:160px;">${isEng ? 'Result' : 'Hasil Pemeriksaan'}</th>
            <th style="width:120px;">${isEng ? 'Unit' : 'Unit / Satuan'}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${p.catatan_klinis ? `
        <div style="margin-top:10px; padding:6px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; font-size:10px;">
          <b>${isEng ? 'Clinical Notes / Remark:' : 'Catatan Klinis:'}</b> ${UI.esc(p.catatan_klinis)}
        </div>
      ` : ''}

      <div class="sig-container">
        <div class="sig-box">
          <div class="role">${isEng ? 'Examined By:' : 'Pemeriksa,'}</div>
          <div class="qr" style="height:68px; display:flex; align-items:center;">
            <span style="font-size:10px; color:#64748b; font-style:italic;">Petugas Validasi</span>
          </div>
          <div class="name">${UI.esc(dicetakOleh)}</div>
          <div class="time">${UI.esc(jamCetak)}</div>
        </div>

        <div class="sig-box" style="align-items:flex-end; text-align:right;">
          <div class="role">${isEng ? 'Doctor In Charge:' : 'Dokter Penanggung Jawab,'}</div>
          <div class="qr">
            <img src="${qrUrl}" alt="QR Validasi">
          </div>
          <div class="name">dr. Minto Rahaju, Sp.PK</div>
          <div class="time">SIP: 449.1/015/I/2021</div>
        </div>
      </div>

      <div class="footer-note">
        <div class="disclaimer">
          ${isEng 
            ? 'This document is a valid electronic medical report issued by UTAMA Medical Laboratory Centre Purbalingga.' 
            : 'Dokumen ini merupakan hasil pemeriksaan fisik resmi yang divalidasi secara elektronik oleh Laboratorium Medis UTAMA Purbalingga.'}
        </div>
        <div style="text-align:right;">
          <div>Hal. 1 dari 1 Halaman</div>
          <div>Printed By : ${UI.esc(dicetakOleh)} / ${UI.esc(jamCetak)}</div>
        </div>
      </div>
    </body></html>`;
    await cetakDokumen(htmlFisik);
  }

  /* ================================================================== */
  /*  ANAMNESA — modal entri data + cetak dokumen                      */
  /* ================================================================== */

  async function modalAnamnesa(p) {
    const REF = LabCore.REF_ANAMNESA || [];
    let existing = [];
    try { existing = await DB.labAnamnesaAmbil(p.id); } catch(e) { console.warn(e); }

    const mergeMap = {};
    existing.forEach(e => { mergeMap[e.urutan] = e; });

    const terkunci = p.status === 'BATAL';

    const barisTabel = REF.map(item => {
      const saved = mergeMap[item.urutan] || {};
      const hasil = (saved.hasil !== undefined && saved.hasil !== null && saved.hasil !== '') ? saved.hasil : '0';
      const ket = saved.keterangan || '';
      const isHdr = item.isHeader === true;

      return `<tr style="${isHdr ? 'background:#f1f8e9; font-weight:600;' : ''}">
        <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; color:#555;">${item.urutan}</td>
        <td style="padding:4px 8px; border:1px solid #ddd; ${isHdr ? 'font-weight:700; color:#1b5e20;' : 'padding-left:18px;'}">
          ${UI.esc(item.nama)}
        </td>
        <td style="padding:2px 6px; border:1px solid #ddd; width:90px; text-align:center;">
          ${terkunci
            ? `<span>${UI.esc(hasil)}</span>`
            : `<input type="text" data-urutan="${item.urutan}" class="anamnesa-hasil" value="${UI.esc(hasil)}"
                 style="width:100%; border:1px solid #ccc; border-radius:3px; padding:3px 6px; font-size:12px; text-align:center;">`
          }
        </td>
        <td style="padding:2px 6px; border:1px solid #ddd;">
          ${terkunci
            ? `<span>${UI.esc(ket)}</span>`
            : `<input type="text" data-ket-urutan="${item.urutan}" class="anamnesa-ket" value="${UI.esc(ket)}"
                 placeholder="Keterangan..."
                 style="width:100%; border:1px solid #ccc; border-radius:3px; padding:3px 6px; font-size:12px;">`
          }
        </td>
      </tr>`;
    }).join('');

    const noLabMr = `${UI.esc(p.no_lab || '-')}/${UI.esc(p.pasien?.no_rm || '-')}`;
    const pengirim = UI.esc(p.kunjungan?.dokter?.nama || p.peminta?.nama || p.kunjungan?.cara_bayar || '-');
    const alamat = UI.esc(p.pasien?.alamat || '-');

    const isi = `
      <div style="background:#0f6cba; color:#fff; padding:8px 12px; margin:-8px -12px 10px -12px; border-radius:4px 4px 0 0;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 20px; font-size:11.5px;">
          <div>
            <div><b>Nama</b> : ${UI.esc(p.pasien?.nama || '-')}</div>
            <div><b>Alamat</b> : ${alamat}</div>
          </div>
          <div>
            <div><b>No Lab/No MR</b> : ${noLabMr}</div>
            <div><b>Pengirim</b> : ${pengirim}</div>
          </div>
        </div>
      </div>
      <div style="max-height:60vh; overflow-y:auto; border:1px solid #ccc;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#4caf50; color:#fff; position:sticky; top:0; z-index:2;">
              <th style="padding:6px 8px; border:1px solid #388e3c; width:70px; text-align:center;">Urutan &#9650;</th>
              <th style="padding:6px 8px; border:1px solid #388e3c; text-align:left;">Nama Item</th>
              <th style="padding:6px 8px; border:1px solid #388e3c; width:90px; text-align:center;">Hasil</th>
              <th style="padding:6px 8px; border:1px solid #388e3c; text-align:left;">Keterangan</th>
            </tr>
          </thead>
          <tbody>${barisTabel}</tbody>
        </table>
      </div>`;

    const result = await UI.modal({
      judul: `Anamnesa Pasien — ${UI.esc(p.pasien?.nama || '')} (${UI.esc(p.no_lab)})`,
      isi,
      lebar: true,
      tombol: [
        { teks: 'Tutup', nilai: null },
        { teks: 'Cetak Anamnesa', kelas: 'btn-secondary', aksi: (box) => {
          const items = [];
          box.querySelectorAll('.anamnesa-hasil').forEach(inp => {
            const urut = parseInt(inp.dataset.urutan);
            const ref = REF.find(r => r.urutan === urut);
            const ketInp = box.querySelector(`[data-ket-urutan="${urut}"]`);
            items.push({
              urutan: urut,
              nama_item: ref ? ref.nama : '',
              hasil: inp.value.trim(),
              keterangan: ketInp ? ketInp.value.trim() : ''
            });
          });
          items.sort((a, b) => a.urutan - b.urutan);
          cetakAnamnesa(p, items, skylabState.formatCetak);
          return false;
        }},
        ...(terkunci ? [] : [{ teks: 'Simpan', kelas: 'btn-primary', aksi: (box) => {
          const items = [];
          box.querySelectorAll('.anamnesa-hasil').forEach(inp => {
            const urut = parseInt(inp.dataset.urutan);
            const ref = REF.find(r => r.urutan === urut);
            const ketInp = box.querySelector(`[data-ket-urutan="${urut}"]`);
            items.push({
              urutan: urut,
              nama_item: ref ? ref.nama : '',
              hasil: inp.value.trim(),
              keterangan: ketInp ? ketInp.value.trim() : ''
            });
          });
          return items;
        }}])
      ]
    });

    if (result && Array.isArray(result)) {
      try {
        await DB.labAnamnesaSimpan(p.id, result);
        UI.toast('Data anamnesa berhasil disimpan.');
      } catch(e) {
        UI.toast('Gagal menyimpan anamnesa: ' + e.message, 'err');
      }
    }
  }

  async function cetakAnamnesa(p, items, format = 'Format 3(M3)') {


    const f = await DB.faskes().catch(() => null);
    if (!format || format === 'M3' || format === 'Standar' || format === 'Asli') {
      format = 'Format 3(M3)';
    }

    const isEng = format === 'Inggris PDF';
    const isBpjs1 = format === 'BPJS';
    const isBpjs2 = format === 'BPJS.2';
    const is2025 = format === 'Format 2025';
    const isF4_1 = format === 'Format 5(F4)';
    const isF4_2 = format === 'Format 5(F4)_2';
    const isM2 = format === 'Format 2(M2)';

    let pageSizeCss = 'size: A4 portrait; margin: 10mm 15mm;';
    if (isF4_1 || isF4_2) {
      pageSizeCss = 'size: 215mm 330mm portrait; margin: 12mm 18mm;';
    } else if (isM2) {
      pageSizeCss = 'size: A5 landscape; margin: 8mm 12mm;';
    }

    const basePath = window.location.origin + window.location.pathname.replace('app.html', '');
    const bpjsLogoUrl = basePath + 'bpjs.png';
    const logoUrl = basePath + 'logo.png';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${encodeURIComponent('Verifikator: dr. Minto Rahaju Sp. PK - No Lab: ' + (p.no_lab || ''))}`;
    const dokterPengirim = p.kunjungan?.dokter?.nama || p.peminta?.nama || '-';
    const instansi = p.kunjungan?.cara_bayar || 'Umum';
    const dicetakOleh = App.siapa()?.nama || 'Petugas Laboratorium';
    const now = new Date();
    const jamCetak = UI.tglIndo(now) + ' ' + UI.jam(now);

    const itemMap = {};
    (items || []).forEach(it => { itemMap[it.urutan] = it; });

    const item1 = itemMap[1] || {};
    const ket1 = item1.keterangan || (item1.hasil !== '0' && item1.hasil !== '' ? item1.hasil : (isEng ? 'None / Normal' : 'Tidak ada keluhan'));

    function formatHasilAnamnesa(val) {
      if (val === '1') return isEng ? '<span style="color:#b91c1c; font-weight:700;">Yes</span>' : '<span style="color:#b91c1c; font-weight:700;">Ya</span>';
      return isEng ? 'No' : 'Tidak';
    }

    function barisSubItem(urutan, namaId, namaEn) {
      const it = itemMap[urutan] || {};
      const val = (it.hasil !== undefined && it.hasil !== null && it.hasil !== '') ? it.hasil : '0';
      const hasilTeks = formatHasilAnamnesa(val);
      const ket = it.keterangan || '—';
      const displayName = isEng ? namaEn : namaId;
      return `<tr>
        <td style="text-align:center; color:#64748b; width:45px;">${urutan}</td>
        <td style="padding-left:14px; font-weight:500;">${UI.esc(displayName)}</td>
        <td style="text-align:center; width:90px;">${hasilTeks}</td>
        <td style="color:#334155;">${UI.esc(ket)}</td>
      </tr>`;
    }

    const rpdRows = [
      [101, 'Rawat Inap / Operasi', 'Hospitalization / Surgery'],
      [102, 'Pengobatan TBC / Hepatitis / dll', 'Tuberculosis / Hepatitis Treatment'],
      [103, 'Patah Tulang (Terpasang PEN)', 'Bone Fracture (Implants/Plates)'],
      [104, 'Penyakit Haemorroid', 'Hemorrhoids'],
      [105, 'Penyakit Hipertensi', 'Hypertension'],
      [106, 'Penyakit Diabetes Mellitus', 'Diabetes Mellitus'],
      [107, 'Penyakit Ginjal / Saluran Kemih', 'Kidney / Urinary Tract Disease'],
      [108, 'Penyakit Stroke', 'Stroke History'],
      [109, 'Penyakit Kejang / Epilepsi', 'Seizures / Epilepsy']
    ].map(([u, nId, nEn]) => barisSubItem(u, nId, nEn)).join('');

    const rpkRows = [
      [201, 'Penyakit Asma', 'Asthma'],
      [202, 'Penyakit Jantung / Hipertensi', 'Heart Disease / Hypertension'],
      [203, 'Penyakit Stroke', 'Stroke'],
      [204, 'Penyakit Saluran Cerna / Hati', 'Gastrointestinal / Liver Disease'],
      [205, 'Penyakit Kencing Manis (Diabetes)', 'Diabetes Mellitus'],
      [206, 'Penyakit Ginjal', 'Kidney Disease'],
      [207, 'Penyakit Kanker / Tumor', 'Cancer / Tumor'],
      [208, 'Penyakit Alergi', 'Allergy'],
      [209, 'Penyakit Gangguan Jiwa', 'Psychiatric Disorders'],
      [210, 'Penyakit Lainnya', 'Other Chronic Illness']
    ].map(([u, nId, nEn]) => barisSubItem(u, nId, nEn)).join('');

    const kebiasaanRows = [
      [301, 'Olahraga Teratur', 'Regular Exercise'],
      [302, 'Merokok', 'Smoking'],
      [303, 'Minum Alkohol', 'Alcohol Consumption'],
      [304, 'Minum Kopi / Kafein', 'Coffee / Caffeine Consumption']
    ].map(([u, nId, nEn]) => barisSubItem(u, nId, nEn)).join('');

    const judulLap = isEng ? 'MEDICAL ANAMNESIS REPORT' : 'HASIL ANAMNESA';

    const htmlAnamnesa = `<!doctype html><html lang="${isEng ? 'en' : 'id'}"><head><meta charset="utf-8">
      <title>${judulLap} ${UI.esc(p.no_lab)} - ${UI.esc(format)}</title>
      <style>${cssCetakDokumen(pageSizeCss, isM2)}</style>
    </head>
    <body>

      ${htmlKopCetak(format, p, logoUrl, bpjsLogoUrl)}
      ${htmlPasienCardCetak(format, p, dokterPengirim, instansi)}

      <div style="text-align:center; font-size:14px; font-weight:800; margin:14px 0 10px; letter-spacing:0.5px; text-transform:uppercase; color:#0f172a;">
        ${judulLap}
      </div>

      <table class="tbl-hasil">
        <thead>
          <tr>
            <th style="width:45px; text-align:center;">${isEng ? 'Code' : 'Urutan'}</th>
            <th>${isEng ? 'Clinical Question / Category' : 'Daftar Pertanyaan / Kategori'}</th>
            <th style="width:90px; text-align:center;">${isEng ? 'Answer' : 'Hasil'}</th>
            <th>${isEng ? 'Notes / Remarks' : 'Keterangan'}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="grp-row">
            <td colspan="4" style="background:#e0f2fe; color:#0369a1; font-weight:800; padding:6px 8px;">
              ${isEng ? '1. CHIEF COMPLAINT (CURRENT SYMPTOMS)' : '1. KELUHAN SAAT INI'}
            </td>
          </tr>
          <tr>
            <td style="text-align:center; color:#64748b;">1</td>
            <td style="padding-left:14px; font-weight:500;">${isEng ? 'Current Health Symptoms / Complaints' : 'Keluhan kesehatan yang dirasakan saat ini'}</td>
            <td style="text-align:center;">—</td>
            <td style="font-weight:600; color:#0f172a;">${UI.esc(ket1)}</td>
          </tr>

          <tr class="grp-row">
            <td colspan="4" style="background:#f1f8e9; color:#1b5e20; font-weight:800; padding:6px 8px;">
              ${isEng ? '2. PAST MEDICAL HISTORY' : '2. RIWAYAT PENYAKIT DAHULU'}
            </td>
          </tr>
          ${rpdRows}

          <tr class="grp-row">
            <td colspan="4" style="background:#fef3c7; color:#b45309; font-weight:800; padding:6px 8px;">
              ${isEng ? '3. FAMILY MEDICAL HISTORY' : '3. RIWAYAT PENYAKIT KELUARGA'}
            </td>
          </tr>
          ${rpkRows}

          <tr class="grp-row">
            <td colspan="4" style="background:#f3e8ff; color:#7e22ce; font-weight:800; padding:6px 8px;">
              ${isEng ? '4. HABITS & LIFESTYLE' : '4. KEBIASAAN HIDUP'}
            </td>
          </tr>
          ${kebiasaanRows}
        </tbody>
      </table>

      ${p.catatan_klinis ? `
        <div style="margin-top:10px; padding:6px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; font-size:10px;">
          <b>${isEng ? 'Clinical Notes / Remark:' : 'Catatan Klinis:'}</b> ${UI.esc(p.catatan_klinis)}
        </div>
      ` : ''}

      <div class="sig-container">
        <div class="sig-box">
          <div class="role">${isEng ? 'Interviewer / Officer:' : 'Pemeriksa Anamnesa,'}</div>
          <div class="qr" style="height:68px; display:flex; align-items:center;">
            <span style="font-size:10px; color:#64748b; font-style:italic;">Petugas Validasi</span>
          </div>
          <div class="name">${UI.esc(dicetakOleh)}</div>
          <div class="time">${UI.esc(jamCetak)}</div>
        </div>

        <div class="sig-box" style="align-items:flex-end; text-align:right;">
          <div class="role">${isEng ? 'Doctor In Charge:' : 'Dokter Penanggung Jawab,'}</div>
          <div class="qr">
            <img src="${qrUrl}" alt="QR Validasi">
          </div>
          <div class="name">dr. Minto Rahaju, Sp.PK</div>
          <div class="time">SIP: 449.1/015/I/2021</div>
        </div>
      </div>

      <div class="footer-note">
        <div class="disclaimer">
          ${isEng 
            ? 'This anamnesis record is an official electronic clinical summary certified by UTAMA Medical Laboratory Centre Purbalingga.' 
            : 'Dokumen ini merupakan hasil anamnesa medis resmi yang divalidasi secara elektronik oleh Laboratorium Medis UTAMA Purbalingga.'}
        </div>
        <div style="text-align:right;">
          <div>Hal. 1 dari 1 Halaman</div>
          <div>Printed By : ${UI.esc(dicetakOleh)} / ${UI.esc(jamCetak)}</div>
        </div>
      </div>
    </body></html>`;
    await cetakDokumen(htmlAnamnesa);
  }

  return { render, modalBacaan, modalArsip, daftarPilihLab, lencanaTanda, lencanaStatus };
})();
