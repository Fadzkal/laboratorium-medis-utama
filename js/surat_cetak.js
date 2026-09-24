/* =====================================================================
   SURAT CETAK — menyajikan model dokumen dari js/surat_core.js.

   Satu model, tiga keluaran, dan ketiganya tersusun dari fungsi yang
   sama sehingga tidak bisa berselisih isi:

     pratinjau  — <iframe srcdoc> di halaman Surat. Bukan tiruan: yang
                  ditampilkan persis berkas HTML yang nanti dicetak,
                  jadi apa yang dilihat dokter di layar memang itu yang
                  keluar dari printer.
     cetak      — iframe tersembunyi + window.print()
     unduh PDF  — pdfmake

   KENAPA IFRAME, BUKAN window.open()

   Halaman lain di aplikasi ini memakai window.open untuk mencetak.
   Untuk surat itu tidak dipakai karena dua alasan:

     - Pop-up sering diblokir. Untuk lembar hasil lab, gagal cetak
       berarti coba lagi; untuk surat, pasien sudah berdiri di depan
       loket.
     - Kop surat adalah gambar. Di jendela baru yang ditulis dengan
       document.write, dialog cetak bisa terbuka sebelum gambarnya
       selesai dirender, dan suratnya tercetak tanpa kop. Di sini
       pencetakan sengaja MENUNGGU gambar kop selesai dimuat
       (img.decode(), dengan batas waktu) sebelum print() dipanggil.
   ===================================================================== */
const SuratCetak = (() => {
  'use strict';

  const esc = (s) => (s === null || s === undefined) ? '' : String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ================================================================== */
  /*  A. HALAMAN CETAK (HTML)                                           */
  /* ================================================================== */

  /* Ukuran surat mengikuti kertas A4 dengan margin 2 cm kiri-kanan.
     Angka-angka di sini dipilih supaya satu surat keterangan sakit yang
     wajar selesai dalam satu halaman tanpa perlu mengecilkan huruf. */
  const GAYA = `
    @page { size: A4; margin: 1.4cm 2cm 1.6cm 2cm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font: 12pt/1.6 "Times New Roman", Times, serif;
      color: #000; background: #fff;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .lembar {
      width: 210mm; min-height: 297mm; box-sizing: border-box; background: #ffffff;
      padding: 1.4cm 2cm 1.6cm 2cm; position: relative; margin: 0 auto;
    }
    .kop { width: 100%; display: block; margin: 0 0 4px; }
    .kop-garis { border-top: 2.2px solid #111; margin: 0 0 16px; }
    .kop-jarak { height: 16px; }
    h1.judul {
      font-size: 14pt; font-weight: bold; text-align: center;
      text-transform: uppercase; letter-spacing: .04em;
      margin: 0; text-decoration: underline; text-underline-offset: 3px;
    }
    .judul-tambahan {
      text-align: center; font-size: 12pt; font-weight: bold; margin: 3px 0 0;
    }
    .nomor { text-align: center; font-size: 11.5pt; margin: 3px 0 18px; }
    p.par { margin: 0 0 10px; text-align: justify; }
    .seksi {
      font-weight: bold; font-size: 11.5pt; margin: 14px 0 4px;
      text-transform: uppercase; letter-spacing: .03em;
    }
    table.id { width: 100%; border-collapse: collapse; margin: 0 0 10px; }
    /* Satu baris identitas tidak boleh terbelah dua halaman: "Nama" di
       halaman satu dan nilainya di halaman dua adalah surat yang cacat. */
    table.id tr { break-inside: avoid; page-break-inside: avoid; }
    table.id td { vertical-align: top; padding: 1.5px 0; }
    table.id td.k { width: 34%; padding-left: 24px; }
    table.id td.s { width: 12px; }
    table.id td.v { width: 62%; }
    table.rinci { width: 100%; border-collapse: collapse; margin: 0 0 10px; font-size: 11pt; }
    table.rinci th, table.rinci td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
    table.rinci th { background: #eee; font-weight: bold; }
    .alamat { margin: 0 0 14px; }
    .alamat .b { font-weight: bold; }
    /* Blok tanda tangan wajib utuh dalam satu halaman. Surat rujukan yang
       panjang bisa meluber ke halaman dua, dan tanda tangan yang terbelah
       — nama di halaman berikutnya, ruang tanda tangannya di halaman
       sebelumnya — membuat lembarnya tidak bisa dipakai. */
    .ttd-bungkus { margin-top: 26px; display: flex; justify-content: flex-end;
                   break-inside: avoid; page-break-inside: avoid; }
    .ttd { min-width: 62mm; text-align: left; }
    .ttd .ruang { height: 24mm; }
    .ttd .nama { font-weight: bold; text-decoration: underline; text-underline-offset: 3px; }
    .ttd .sip { font-size: 11pt; }
    .kaki {
      margin-top: 20px; padding-top: 6px; border-top: .8px solid #999;
      font-size: 9pt; line-height: 1.4; color: #333; font-family: Arial, Helvetica, sans-serif;
    }
    .cap-batal {
      position: absolute; top: 38%; left: 0; right: 0; text-align: center;
      font-size: 64pt; font-weight: bold; color: rgba(200,30,15,.18);
      transform: rotate(-24deg); letter-spacing: .12em; pointer-events: none;
    }
    .pita-batal {
      border: 1.4px solid #c81e0f; color: #c81e0f; padding: 6px 10px;
      font-size: 10pt; font-family: Arial, Helvetica, sans-serif;
      margin: 0 0 14px; font-weight: bold;
    }
    @media screen {
      body { background: #eceff1; padding: 18px 0; }
      .lembar {
        width: 210mm; min-height: 297mm; box-sizing: border-box; margin: 0 auto; background: #ffffff;
        padding: 1.4cm 2cm 1.6cm 2cm; box-shadow: 0 2px 14px rgba(0,0,0,.16);
      }
    }

    /* Format Blanko Laboratorium Medis UTAMA */
    .lembar-lab {
      width: 210mm; min-height: 297mm; box-sizing: border-box; background: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px; color: #000; line-height: 1.4;
    }
    .lembar-lab .header-lab {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; width: 100%;
    }
    .lembar-lab .header-bpjs { flex: 1; text-align: left; }
    .lembar-lab .header-bpjs img { height: 42px; width: auto; }
    .lembar-lab .header-logo { flex: 1; text-align: center; }
    .lembar-lab .header-logo img { height: 50px; width: auto; object-fit: contain; }
    .lembar-lab .header-logo .brand { color: #16a34a; font-weight: 700; font-size: 18px; margin-top: -3px; letter-spacing: 1px; }
    .lembar-lab .header-logo .motto { color: #9333ea; font-size: 9px; font-style: italic; margin-top: -3px; }
    .lembar-lab .header-text { flex: 1.2; text-align: right; margin-left: auto; font-size: 10.5px; }
    .lembar-lab .header-text b { font-size: 11.5px; }

    .lembar-lab .barcode-lab { margin-bottom: 4px; }
    .lembar-lab .barcode-lab img { height: 32px; width: auto; display: block; }
    .lembar-lab .pj-lab { font-weight: 700; font-size: 11px; margin-bottom: 12px; }

    .lembar-lab .patient-info-lab {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; font-size: 10.5px;
    }
    .lembar-lab .info-grid-lab {
      display: grid; grid-template-columns: 105px 8px 1fr; gap: 2px 0;
    }

    .lembar-lab table.tbl-lab {
      width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 16px;
    }
    .lembar-lab table.tbl-lab th {
      text-align: left; padding: 6px 4px; text-transform: uppercase;
      border-bottom: 1.5px solid #000; font-weight: 700; font-size: 10.5px;
    }
    .lembar-lab table.tbl-lab td {
      padding: 3.5px 4px; vertical-align: top;
    }
    .lembar-lab table.tbl-lab tr.grp td {
      font-weight: 700; text-transform: uppercase; padding-top: 8px; padding-bottom: 2px;
    }

    .lembar-lab .catatan-lab { font-size: 10.5px; margin-bottom: 4px; }
    .lembar-lab .keterangan-lab { font-size: 10px; font-weight: bold; margin-bottom: 16px; }

    .lembar-lab .signatures-lab {
      display: flex; justify-content: space-between; margin-top: 24px; text-align: left; font-size: 10.5px;
      break-inside: avoid; page-break-inside: avoid;
    }
    .lembar-lab .sig-box { display: flex; flex-direction: column; align-items: flex-start; }
    .lembar-lab .qr-box { margin: 4px 0; }
    .lembar-lab .qr-box img { width: 55px; height: 55px; }

    .lembar-lab .footer-lab {
      margin-top: 24px; font-size: 9px; display: flex; justify-content: space-between;
      align-items: flex-end; border-top: 0.5px solid #ccc; padding-top: 6px;
      break-inside: avoid; page-break-inside: avoid;
    }
  `;

  function blokHtml(b) {
    switch (b.t) {
      case 'paragraf':
        return `<p class="par">${esc(b.teks)}</p>`;

      case 'seksi':
        return `<div class="seksi">${esc(b.teks)}</div>`;

      case 'identitas':
        return `<table class="id"><tbody>${b.baris.map(([k, v]) =>
          `<tr><td class="k">${esc(k)}</td><td class="s">:</td>
               <td class="v">${esc(v)}</td></tr>`).join('')}</tbody></table>`;

      case 'tabel':
        return `<table class="rinci">
          ${b.kepala ? `<thead><tr>${b.kepala.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>` : ''}
          <tbody>${b.baris.map(r =>
            `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

      case 'alamat':
        return `<div class="alamat">
          Kepada Yth.<br>
          <span class="b">${esc(b.poli ? 'TS Dokter Spesialis ' + b.poli : 'Sejawat Yth.')}</span><br>
          <span class="b">${esc(b.kepada)}</span><br>
          di ${esc(b.di || 'tempat')}</div>`;

      case 'kaki':
        return `<div class="kaki">${esc(b.teks)}</div>`;

      case 'spasi':
        return `<div style="height:${Number(b.tinggi) || 10}px"></div>`;

      default:
        return '';
    }
  }

  function urlAset(nama) {
    if (typeof window !== 'undefined' && window.location) {
      const loc = window.location;
      const path = loc.pathname.replace(/\/[^/]*$/, '/');
      return `${loc.origin}${path}${nama}`;
    }
    return nama;
  }

  function isiLabHtml(m, opsi = {}) {
    const d = m.data || {};
    const c = m.ctx || {};
    const p = c.pasien || {};
    const labBlock = (m.blok || []).find(b => b.t === 'lab_hasil') || {};
    const noLab = d.no_lab || labBlock.no_lab || m.nomor || '-';
    const tglPeriksa = d.tanggal_periksa || labBlock.tanggal_periksa || c.tanggalSurat || '-';
    const jamPeriksa = d.jam_periksa || labBlock.jam_periksa || '';
    const jamSampel = d.jam_sampel || labBlock.jam_sampel || '-';
    const dokterPengirim = d.dokter_pengirim || labBlock.dokter_pengirim || (c.dokter && c.dokter.nama) || 'dr. Makarti Rahayu';
    const instansi = d.instansi || labBlock.instansi || (m.kode === 'LAB_BPJS' ? 'BPJS' : 'umum');
    const penanggungJawab = d.penanggung_jawab || labBlock.penanggung_jawab || 'dr. Minto Rahaju, Sp.PK';
    const verifikator = d.verifikator || labBlock.verifikator || 'Dede K';
    const waktuVerifikasi = d.waktu_verifikasi || labBlock.waktu_verifikasi || (tglPeriksa + ' 10:21:15');
    const catatan = d.catatan || labBlock.catatan || '-';
    const grup = labBlock.grup || (typeof SuratCore !== 'undefined' && SuratCore.parseLabTeks
      ? SuratCore.parseLabTeks(d.pemeriksaan_teks, m.kode)
      : []);

    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(noLab)}&code=Code128&translate-esc=on&dpi=96`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('Verifikator: ' + penanggungJawab)}`;

    const urlBpjs = urlAset('bpjs.png');
    const urlLogo = urlAset('logo.png');

    let headerHtml = '';
    if (m.kode === 'LAB_BPJS') {
      headerHtml = `
        <div class="header-lab">
          <div class="header-bpjs">
            <img src="${urlBpjs}" alt="BPJS Kesehatan" onerror="this.src='bpjs.png'">
          </div>
          <div class="header-logo">
            <img src="${urlLogo}" alt="UTAMA" onerror="this.src='logo.png'">
          </div>
          <div class="header-text">
            <b>Laboratorium Medis UTAMA</b><br>
            Jl. DI Panjaitan No. 94, Purbalingga<br>
            Telp. 0281-6580099 / 08121482308<br>
            Email : laboratoriumutama@yahoo.com
          </div>
        </div>`;
    } else {
      headerHtml = `
        <div class="header-lab" style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; width: 100%; margin-bottom: 16px;">
          <!-- Kolom 1: Penyeimbang kiri kosong -->
          <div></div>

          <!-- Kolom 2: Logo Utama persis di tengah -->
          <div class="header-logo" style="display: flex; justify-content: center; align-items: center; padding: 0 10px;">
            <img src="${urlLogo}" style="height: 55px; width: auto; object-fit: contain;" alt="UTAMA" onerror="this.src='logo.png'">
          </div>

          <!-- Kolom 3: Alamat di pojok kanan -->
          <div class="header-text" style="text-align: right; margin-left: auto; line-height: 1.35; font-size: 8.5pt;">
            <div style="font-weight: 700; font-size: 9.5pt; color: #000;">Laboratorium Medis UTAMA</div>
            <div style="color: #333;">Jl. DI Panjaitan No. 94, Purbalingga</div>
            <div style="color: #333;">Telp. 0281-6580099 / 08121482308</div>
            <div style="color: #333;">Email : laboratoriumutama@yahoo.com</div>
          </div>
        </div>`;
    }

    const tglLahir = p.tanggal_lahir
      ? (typeof SuratCore !== 'undefined' ? SuratCore.tglIndo(p.tanggal_lahir) : p.tanggal_lahir)
      : '-';
    const umur = typeof SuratCore !== 'undefined' ? SuratCore.umurTahun(p.tanggal_lahir, tglPeriksa) : null;
    const umurTeks = umur !== null ? `${umur} Thn` : '-';
    const jk = p.jenis_kelamin === 'L' ? 'Laki-Laki' : p.jenis_kelamin === 'P' ? 'Perempuan' : '-';
    const alamat = (typeof SuratCore !== 'undefined' ? SuratCore.alamatPasien(p) : '') || p.alamat || '-';
    const tglPeriksaIndo = typeof SuratCore !== 'undefined' ? SuratCore.tglIndo(tglPeriksa) : tglPeriksa;

    let tableHtml = '';
    if (m.kode === 'LAB_UMUM') {
      tableHtml = `
        <table class="tbl-lab">
          <thead>
            <tr>
              <th style="width: 32%;">PEMERIKSAAN</th>
              <th style="width: 14%;">HASIL</th>
              <th style="width: 14%;">SATUAN</th>
              <th style="width: 22%;">NILAI RUJUKAN</th>
              <th style="width: 18%;">METODE</th>
            </tr>
          </thead>
          <tbody>
            ${grup.map(g => `
              ${g.grup ? `<tr class="grp"><td colspan="5">${esc(g.grup)}</td></tr>` : ''}
              ${(g.baris || []).map(r => `
                <tr>
                  <td>${esc(r.nama)}</td>
                  <td><b>${esc(r.hasil)}</b></td>
                  <td>${esc(r.satuan)}</td>
                  <td>${esc(r.rujukan)}</td>
                  <td>${esc(r.metode || '-')}</td>
                </tr>`).join('')}
            `).join('')}
          </tbody>
        </table>`;
    } else {
      tableHtml = `
        <table class="tbl-lab">
          <thead>
            <tr>
              <th style="width: 40%;">PEMERIKSAAN</th>
              <th style="width: 18%;">HASIL</th>
              <th style="width: 27%;">NILAI RUJUKAN</th>
              <th style="width: 15%;">SATUAN</th>
            </tr>
          </thead>
          <tbody>
            ${grup.map(g => `
              ${g.grup ? `<tr class="grp"><td colspan="4">${esc(g.grup)}</td></tr>` : ''}
              ${(g.baris || []).map(r => `
                <tr>
                  <td>${esc(r.nama)}</td>
                  <td><b>${esc(r.hasil)}</b></td>
                  <td>${esc(r.rujukan)}</td>
                  <td>${esc(r.satuan)}</td>
                </tr>`).join('')}
            `).join('')}
          </tbody>
        </table>`;
    }

    let signatureHtml = '';
    let footerHtml = '';

    if (m.kode === 'LAB_KIRIM') {
      signatureHtml = `
        <div style="display: flex; justify-content: space-between; margin-top: 36px; break-inside: avoid; font-size: 11px;">
          <div style="display: flex; flex-direction: column; justify-content: flex-end;">
            Jam Sampel : ${esc(jamSampel)}
          </div>
          <div style="text-align: center; margin-right: 40px;">
            Pemeriksa,
            <br><br><br><br>
            <b>${esc(penanggungJawab)}</b>
          </div>
        </div>`;
    } else {
      signatureHtml = `
        <div class="signatures-lab">
          <div class="sig-box">
            <div><b>Verifikator,</b></div>
            <div style="height: 48px;"></div>
            <div><b>${esc(verifikator)}</b></div>
            <div style="font-size: 9.5px; color: #444;">${esc(waktuVerifikasi)}</div>
          </div>
          <div class="sig-box" style="align-items: flex-start;">
            <div><b>Penanggung Jawab,</b></div>
            <div class="qr-box"><img src="${qrUrl}" alt="QR" onerror="this.style.display='none'"></div>
            <div><b>${esc(penanggungJawab)}</b></div>
          </div>
        </div>`;

      footerHtml = `
        <div class="footer-lab">
          <div>
            Jam Sampel : ${esc(jamSampel)}<br>
            Hal. 1 dari 1 Halaman
          </div>
          <div style="text-align: right;">
            Printed By : ${esc(verifikator)} / ${tglPeriksaIndo} ${esc(jamPeriksa)}<br>
            <b>Hasil dicetak secara elektronik dan telah divalidasi.</b>
          </div>
        </div>`;
    }

    return `<div class="lembar lembar-lab">
      ${m.batal ? `<div class="cap-batal">BATAL</div>
        <div class="pita-batal">SURAT INI DIBATALKAN${m.alasanBatal ? ' — ' + esc(m.alasanBatal) : ''}</div>` : ''}

      ${headerHtml}

      <div class="barcode-lab">
        <img src="${barcodeUrl}" alt="Barcode ${esc(noLab)}" onerror="this.style.display='none'">
      </div>

      <div class="pj-lab">Penanggung Jawab : ${esc(penanggungJawab)}</div>

      <div class="patient-info-lab">
        <div class="info-grid-lab">
          <div>No Lab</div><div>:</div><div><b>${esc(noLab)}</b></div>
          <div>Nama</div><div>:</div><div><b>${esc(p.nama || '-')}</b></div>
          <div>Dokter Pengirim</div><div>:</div><div>${esc(dokterPengirim)}</div>
          <div>Alamat</div><div>:</div><div>${esc(alamat)}</div>
        </div>
        <div class="info-grid-lab">
          <div>Tgl. Lahir / Usia</div><div>:</div><div>${esc(tglLahir)} / ${esc(umurTeks)}</div>
          <div>Jenis Kelamin</div><div>:</div><div>${esc(jk)}</div>
          <div>Tgl. Periksa</div><div>:</div><div>${esc(tglPeriksaIndo)} ${esc(jamPeriksa)}</div>
          <div>Instansi</div><div>:</div><div>${esc(instansi)}</div>
        </div>
      </div>

      ${tableHtml}

      <div class="catatan-lab"><b>Catatan :</b> ${esc(catatan)}</div>
      <div class="keterangan-lab">Keterangan : [*] Diluar nilai normal</div>

      ${signatureHtml}
      ${footerHtml}
    </div>`;
  }

  /* Isi lembar tanpa <html>/<head>. Dipakai halaman cetak maupun
     pratinjau, supaya keduanya tidak pernah berbeda. */
  function isiHtml(m, opsi = {}) {
    if (['LAB_UMUM', 'LAB_BPJS', 'LAB_KIRIM'].includes(m.kode)) {
      return isiLabHtml(m, opsi);
    }

    /* Garis di bawah kop bawaannya MATI: gambar kop Laboratorium Medis Utama sudah
       berakhir dengan garis hijau sendiri, dan menambah garis hitam tepat
       di bawahnya terbaca seperti kesalahan cetak. Klinik yang mengunggah
       kop tanpa garis bisa menyalakannya di Pengaturan → Kop & Surat. */
    const kop = opsi.tanpaKop ? '' :
      `<img class="kop" src="${opsi.kop || ''}" alt="Kop ${esc(opsi.namaKlinik || 'Klinik')}">
       ${opsi.garisKop ? '<div class="kop-garis"></div>' : '<div class="kop-jarak"></div>'}`;

    const kaki = m.kaki ? `<div class="kaki">${esc(m.kaki)}</div>` : '';

    return `<div class="lembar">
      ${m.batal ? `<div class="cap-batal">BATAL</div>
        <div class="pita-batal">SURAT INI DIBATALKAN${m.alasanBatal
          ? ' — ' + esc(m.alasanBatal) : ''}</div>` : ''}
      ${kop}
      <h1 class="judul">${esc(m.judul)}</h1>
      ${m.judulTambahan ? `<div class="judul-tambahan">${esc(m.judulTambahan)}</div>` : ''}
      ${m.nomor ? `<div class="nomor">Nomor: ${esc(m.nomor)}</div>` : '<div class="nomor">&nbsp;</div>'}
      ${m.blok.map(blokHtml).join('\n')}
      <div class="ttd-bungkus"><div class="ttd">
        ${esc(m.ttd.kotaTanggal)}<br>
        ${esc(m.ttd.jabatan)},
        <div class="ruang"></div>
        <div class="nama">${esc(m.ttd.nama)}</div>
        ${m.ttd.sip ? `<div class="sip">SIP: ${esc(m.ttd.sip)}</div>` : ''}
      </div></div>
      ${kaki}
    </div>`;
  }

  /* Berkas HTML utuh — inilah yang dicetak dan yang ditampilkan di
     pratinjau. */
  function halamanHtml(m, opsi = {}) {
    return `<!doctype html><html lang="id"><head><meta charset="utf-8">
      <title>${esc(m.judul)}${m.nomor ? ' ' + esc(m.nomor) : ''}</title>
      <style>${GAYA}</style></head>
      <body>${isiHtml(m, opsi)}</body></html>`;
  }

  /* ================================================================== */
  /*  B. MENCETAK                                                       */
  /* ================================================================== */
  /* Menunggu gambar kop benar-benar siap sebelum membuka dialog cetak.
     Tanpa ini, surat bisa keluar tanpa kop pada cetakan pertama —
     kegagalan yang hanya muncul sesekali dan mustahil ditiru saat
     diperbaiki. Batas waktunya 4 detik: lebih baik tercetak tanpa kop
     daripada tombol Cetak yang tidak pernah merespons. */
  function tungguGambar(jendela, batasMs = 4000) {
    return new Promise((selesai) => {
      let sudah = false;
      const habis = setTimeout(() => { if (!sudah) { sudah = true; selesai(); } }, batasMs);
      const beres = () => { if (sudah) return; sudah = true; clearTimeout(habis); selesai(); };
      try {
        const gambar = Array.from(jendela.document.images || []);
        if (!gambar.length) return beres();
        Promise.all(gambar.map(g => {
          if (g.complete && g.naturalWidth) return Promise.resolve();
          if (g.decode) return g.decode().catch(() => {});
          return new Promise(r => { g.onload = r; g.onerror = r; });
        })).then(beres, beres);
      } catch (e) { beres(); }
    });
  }

  async function cetak(m, opsi = {}) {
    const bingkai = document.createElement('iframe');
    bingkai.setAttribute('aria-hidden', 'true');
    /* Iframe tanpa kotak layout tidak dirender peramban, dan halaman yang
       tidak dirender tidak bisa dicetak. Karena itu ia diberi ukuran
       sungguhan lalu disembunyikan dengan posisi, bukan display:none. */
    bingkai.style.cssText = 'position:fixed;right:0;bottom:0;width:210mm;height:297mm;' +
                            'opacity:0;border:0;pointer-events:none;z-index:-1';
    document.body.appendChild(bingkai);

    const bersihkan = () => { setTimeout(() => bingkai.remove(), 800); };

    await new Promise((siap) => {
      bingkai.onload = siap;
      bingkai.srcdoc = halamanHtml(m, opsi);
      setTimeout(siap, 3000);          // pengaman kalau onload tidak terpanggil
    });

    const w = bingkai.contentWindow;
    if (!w) { bersihkan(); throw new Error('Gagal menyiapkan halaman cetak.'); }
    await tungguGambar(w);

    try { w.addEventListener('afterprint', bersihkan); } catch (e) { /* tidak semua peramban */ }
    try {
      w.focus();
      w.print();
    } catch (e) {
      bersihkan();
      throw new Error('Dialog cetak tidak bisa dibuka: ' + (e.message || e));
    }
    /* Di sebagian peramban print() tidak memblokir, jadi iframe tidak
       boleh dihapus langsung — dialognya akan ikut kosong. */
    setTimeout(bersihkan, 60000);
    return true;
  }

  /* ================================================================== */
  /*  C. PDF (pdfmake)                                                  */
  /* ================================================================== */
  /* pdfmake diambil saat dibutuhkan, sama seperti di halaman kasir:
     vfs_fonts.js sendirian hampir 1,5 MB dan tidak ada gunanya diunduh
     oleh orang yang cuma membuka Beranda. */
  let pdfSiap = null;
  function muatPdfMake() {
    if (typeof pdfMake !== 'undefined') return Promise.resolve();
    if (pdfSiap) return pdfSiap;
    const ambil = (src) => new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok;
      s.onerror = () => gagal(new Error('Gagal memuat ' + src));
      document.head.appendChild(s);
    });
    const dasar = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/';
    pdfSiap = ambil(dasar + 'pdfmake.min.js')
      .then(() => ambil(dasar + 'vfs_fonts.js'))
      .catch(e => { pdfSiap = null; throw e; });
    return pdfSiap;
  }

  const LEBAR_ISI = 515;   // A4 (595pt) dikurangi margin 40pt kiri-kanan

  function blokPdf(b) {
    switch (b.t) {
      case 'paragraf':
        return { text: b.teks, alignment: 'justify', margin: [0, 0, 0, 7] };

      case 'seksi':
        return { text: String(b.teks).toUpperCase(), bold: true, fontSize: 10.5,
                 characterSpacing: 0.4, margin: [0, 9, 0, 3] };

      case 'identitas':
        return {
          table: {
            widths: [150, 8, '*'],
            body: b.baris.map(([k, v]) => [
              { text: k, margin: [18, 1, 0, 1] },
              { text: ':', margin: [0, 1, 0, 1] },
              { text: v === null || v === undefined ? '' : String(v), margin: [0, 1, 0, 1] }
            ])
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 7]
        };

      case 'tabel':
        return {
          table: {
            headerRows: b.kepala ? 1 : 0,
            widths: b.kepala ? b.kepala.map(() => '*') : b.baris[0].map(() => '*'),
            body: (b.kepala ? [b.kepala.map(h => ({ text: h, bold: true, fillColor: '#eeeeee' }))] : [])
                  .concat(b.baris.map(r => r.map(c => ({ text: c === null ? '' : String(c) }))))
          },
          margin: [0, 0, 0, 8]
        };

      case 'alamat':
        return {
          margin: [0, 0, 0, 10],
          stack: [
            { text: 'Kepada Yth.' },
            { text: b.poli ? 'TS Dokter Spesialis ' + b.poli : 'Sejawat Yth.', bold: true },
            { text: b.kepada || '', bold: true },
            { text: 'di ' + (b.di || 'tempat') }
          ]
        };

      case 'lab_hasil': {
        const rows = [];
        const isUmum = b.kode === 'LAB_UMUM';
        const headers = isUmum
          ? ['PEMERIKSAAN', 'HASIL', 'SATUAN', 'NILAI RUJUKAN', 'METODE']
          : ['PEMERIKSAAN', 'HASIL', 'NILAI RUJUKAN', 'SATUAN'];
        rows.push(headers.map(h => ({ text: h, bold: true, fillColor: '#eeeeee', fontSize: 9 })));
        (b.grup || []).forEach(g => {
          if (g.grup) {
            rows.push([{ text: g.grup, bold: true, colSpan: isUmum ? 5 : 4, fillColor: '#fafafa', fontSize: 9.5 }]);
            if (isUmum) rows[rows.length - 1].push({}, {}, {}, {});
            else rows[rows.length - 1].push({}, {}, {});
          }
          (g.baris || []).forEach(r => {
            if (isUmum) {
              rows.push([
                { text: r.nama, fontSize: 8.5 },
                { text: r.hasil, bold: true, fontSize: 8.5 },
                { text: r.satuan, fontSize: 8.5 },
                { text: r.rujukan, fontSize: 8.5 },
                { text: r.metode || '-', fontSize: 8.5 }
              ]);
            } else {
              rows.push([
                { text: r.nama, fontSize: 8.5 },
                { text: r.hasil, bold: true, fontSize: 8.5 },
                { text: r.rujukan, fontSize: 8.5 },
                { text: r.satuan, fontSize: 8.5 }
              ]);
            }
          });
        });
        const widths = isUmum ? ['30%', '16%', '16%', '22%', '16%'] : ['38%', '18%', '28%', '16%'];
        return {
          table: { headerRows: 1, widths, body: rows },
          margin: [0, 8, 0, 8]
        };
      }

      case 'kaki':
        return { text: b.teks, fontSize: 8.5, color: '#333333', italics: true,
                 margin: [0, 8, 0, 0] };

      case 'spasi':
        return { text: ' ', margin: [0, 0, 0, Number(b.tinggi) || 8] };

      default:
        return { text: '' };
    }
  }

  function docPdf(m, opsi = {}) {
    const isi = [];

    if (!opsi.tanpaKop && opsi.kop) {
      const rasio = Number(opsi.rasioKop) || 6.7;
      isi.push({ image: opsi.kop, width: LEBAR_ISI, height: LEBAR_ISI / rasio,
                 margin: [0, 0, 0, 2] });
      if (opsi.garisKop) {
        isi.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: LEBAR_ISI, y2: 0,
                              lineWidth: 1.6, lineColor: '#111111' }],
                   margin: [0, 0, 0, 12] });
      } else {
        isi.push({ text: ' ', margin: [0, 0, 0, 6] });
      }
    }

    if (m.batal) {
      isi.push({
        table: { widths: ['*'], body: [[{
          text: 'SURAT INI DIBATALKAN' + (m.alasanBatal ? ' — ' + m.alasanBatal : ''),
          color: '#c81e0f', bold: true, fontSize: 9, margin: [4, 4, 4, 4]
        }]] },
        layout: {
          hLineWidth: () => 1, vLineWidth: () => 1,
          hLineColor: () => '#c81e0f', vLineColor: () => '#c81e0f'
        },
        margin: [0, 0, 0, 10]
      });
    }

    isi.push({ text: m.judul, style: 'judul', decoration: 'underline' });
    if (m.judulTambahan) isi.push({ text: m.judulTambahan, style: 'judul2' });
    isi.push({ text: m.nomor ? 'Nomor: ' + m.nomor : ' ', alignment: 'center',
               fontSize: 10.5, margin: [0, 2, 0, 14] });

    m.blok.forEach(b => isi.push(blokPdf(b)));

    isi.push({
      margin: [0, 18, 0, 0],
      columns: [
        { width: '*', text: '' },
        { width: 190, stack: [
          { text: m.ttd.kotaTanggal },
          { text: m.ttd.jabatan + ',' },
          { text: ' ', margin: [0, 0, 0, 52] },
          { text: m.ttd.nama, bold: true, decoration: 'underline' },
          m.ttd.sip ? { text: 'SIP: ' + m.ttd.sip, fontSize: 10 } : { text: '' }
        ] }
      ]
    });

    if (m.kaki) {
      isi.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: LEBAR_ISI, y2: 0,
                            lineWidth: 0.6, lineColor: '#999999' }], margin: [0, 16, 0, 4] });
      isi.push({ text: m.kaki, fontSize: 8, color: '#333333' });
    }

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 46],
      info: { title: m.judul + (m.nomor ? ' ' + m.nomor : '') },
      content: isi,
      styles: {
        judul:  { fontSize: 13, bold: true, alignment: 'center', characterSpacing: 0.6 },
        judul2: { fontSize: 11.5, bold: true, alignment: 'center', margin: [0, 3, 0, 0] }
      },
      defaultStyle: { fontSize: 11, lineHeight: 1.32, color: '#000000' }
    };
  }

  let html2pdfSiap = null;
  function muatHtml2Pdf() {
    if (typeof html2pdf !== 'undefined') return Promise.resolve();
    if (html2pdfSiap) return html2pdfSiap;
    const ambil = (src) => new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok;
      s.onerror = () => gagal(new Error('Gagal memuat ' + src));
      document.head.appendChild(s);
    });
    const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    html2pdfSiap = ambil(cdnUrl)
      .catch(e => { html2pdfSiap = null; throw e; });
    return html2pdfSiap;
  }

  function tungguGambarElemen(el, batasMs = 4000) {
    return new Promise((selesai) => {
      let sudah = false;
      const habis = setTimeout(() => { if (!sudah) { sudah = true; selesai(); } }, batasMs);
      const beres = () => { if (sudah) return; sudah = true; clearTimeout(habis); selesai(); };
      try {
        const gambar = Array.from((el && el.querySelectorAll) ? el.querySelectorAll('img') : []);
        if (!gambar.length) return beres();
        Promise.all(gambar.map(g => {
          if (g.complete && g.naturalWidth) return Promise.resolve();
          if (g.decode) return g.decode().catch(() => {});
          return new Promise(r => { g.onload = r; g.onerror = r; });
        })).then(beres, beres);
      } catch (e) { beres(); }
    });
  }

  /* Nama berkas dari nomor surat: garis miring tidak boleh ada di nama
     berkas mana pun, di Windows maupun di Linux. */
  const namaBerkas = (m) =>
    ((m.nomor || m.judul) + '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() + '.pdf';

  /* Ekspor PDF 100% WYSIWYG:
     Mengkloning langsung elemen DOM pratinjau yang sedang tampil di layar,
     dikunci dengan dimensi standar A4 murni (210mm x 297mm), styles lengkap,
     canvas scale 2, useCORS, scrollY 0, dan jsPDF format A4 portrait margin 0. */
  async function unduhPdf(m, opsi = {}) {
    const namaFile = opsi.namaBerkas || namaBerkas(m);
    try {
      await muatHtml2Pdf();

      // Cari elemen pratinjau yang sedang tampil di layar
      let targetLembar = null;
      const framePratinjau = document.getElementById('framePratinjau');
      const frameLihat = document.getElementById('frameLihat');

      if (framePratinjau && framePratinjau.contentDocument) {
        targetLembar = framePratinjau.contentDocument.querySelector('.lembar');
      } else if (frameLihat && frameLihat.contentDocument) {
        targetLembar = frameLihat.contentDocument.querySelector('.lembar');
      }

      // Kunci kontainer wadah dan elemen ekspor dengan dimensi standar A4 murni
      const wadahEkspor = document.createElement('div');
      wadahEkspor.style.cssText = 'position:fixed; left:-10000px; top:0; width:210mm; min-height:297mm; ' +
                                  'box-sizing:border-box; background:#ffffff; z-index:-9999; overflow:visible;';

      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box !important; }
        ${GAYA}
        .lembar {
          width: 210mm !important;
          min-height: 297mm !important;
          box-sizing: border-box !important;
          background: #ffffff !important;
          padding: 1.4cm 2cm 1.6cm 2cm !important;
          margin: 0 !important;
          box-shadow: none !important;
        }
      `;
      wadahEkspor.appendChild(styleEl);

      let klon = null;
      if (targetLembar) {
        klon = targetLembar.cloneNode(true);
      } else {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = isiHtml(m, opsi);
        klon = tempDiv.querySelector('.lembar') || tempDiv.firstElementChild;
      }

      if (klon) {
        klon.style.width = '210mm';
        klon.style.minHeight = '297mm';
        klon.style.boxSizing = 'border-box';
        klon.style.background = '#ffffff';
        klon.style.padding = '1.4cm 2cm 1.6cm 2cm';
        klon.style.margin = '0';
        klon.style.boxShadow = 'none';
        wadahEkspor.appendChild(klon);
      }

      document.body.appendChild(wadahEkspor);
      await tungguGambarElemen(wadahEkspor);

      const opt = {
        margin: 0,
        filename: namaFile,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      await html2pdf().set(opt).from(klon || wadahEkspor).save();
      setTimeout(() => { wadahEkspor.remove(); }, 1200);
      return true;
    } catch (errHtml2Pdf) {
      console.warn('html2pdf gagal atau terkendala koneksi, mencoba fallback pdfMake:', errHtml2Pdf);
      try {
        await muatPdfMake();
        pdfMake.createPdf(docPdf(m, opsi)).download(namaFile);
        return true;
      } catch (errPdfMake) {
        console.error('Semua mesin PDF gagal:', errPdfMake);
        throw errHtml2Pdf;
      }
    }
  }

  const API = {
    GAYA, esc, blokHtml, isiHtml, halamanHtml,
    cetak, muatPdfMake, muatHtml2Pdf, blokPdf, docPdf, unduhPdf, namaBerkas
  };

  return API;
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SuratCetak;
