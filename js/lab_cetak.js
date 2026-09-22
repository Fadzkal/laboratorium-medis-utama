const LabCetak = (() => {
  'use strict';

  let pdfSiap = null;
  let cachedLogoB64 = null;

  function muatPdfMake() {
    if (typeof pdfMake !== 'undefined') return Promise.resolve();
    if (pdfSiap) return pdfSiap;
    const dasar = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/';
    pdfSiap = new Promise((resolve, reject) => {
      const s1 = document.createElement('script');
      s1.src = dasar + 'pdfmake.min.js';
      s1.onload = () => {
        const s2 = document.createElement('script');
        s2.src = dasar + 'vfs_fonts.min.js';
        s2.onload = resolve;
        s2.onerror = reject;
        document.head.appendChild(s2);
      };
      s1.onerror = reject;
      document.head.appendChild(s1);
    });
    return pdfSiap;
  }

  // Helper konversi gambar ke Base64 dengan validasi tipe konten yang aman
  async function ambilGambarBase64(url) {
    if (cachedLogoB64) return cachedLogoB64;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('Fetch logo tidak berhasil, status:', response.status);
        return null;
      }
      const blob = await response.blob();
      if (!blob.type || !blob.type.includes('image')) {
        console.warn('File yang di-fetch bukan gambar valid, tipe:', blob.type);
        return null;
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          cachedLogoB64 = reader.result;
          resolve(cachedLogoB64);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Gagal memuat gambar logo', e);
      return null;
    }
  }

  // Format No Lab standar UTAMA: YYMM + 4 digit nomor urut (contoh: 26090386)
  function formatNoLab(rawNoLab, tanggal) {
    if (rawNoLab) {
      const str = String(rawNoLab).trim();
      if (/^\d{8}$/.test(str)) return str;
      const m = str.match(/LAB-(\d{2,4})-(\d+)/i);
      if (m) {
        const yy = m[1].slice(-2);
        const d = tanggal ? new Date(tanggal) : new Date();
        const mm = String(isNaN(d) ? new Date().getMonth() + 1 : d.getMonth() + 1).padStart(2, '0');
        const seq = m[2].padStart(4, '0');
        return `${yy}${mm}${seq}`;
      }
      return str;
    }
    const d = tanggal ? new Date(tanggal) : new Date();
    const validD = isNaN(d) ? new Date() : d;
    const yy = String(validD.getFullYear()).slice(-2);
    const mm = String(validD.getMonth() + 1).padStart(2, '0');
    const seq = String(Math.floor(1000 + Math.random() * 9000));
    return `${yy}${mm}${seq}`;
  }

  // Helper format umur lengkap: "33 Thn 8 Bln 8 Hari"
  function formatUmurLengkap(tglLahir) {
    if (!tglLahir) return '-';
    if (typeof UI !== 'undefined' && typeof UI.umur === 'function') {
      const u = UI.umur(tglLahir);
      if (u) {
        const parts = [];
        if (u.tahun > 0) parts.push(`${u.tahun} Thn`);
        if (u.bulan > 0) parts.push(`${u.bulan} Bln`);
        if (u.hari >= 0) parts.push(`${u.hari} Hari`);
        return parts.join(' ') || '0 Hari';
      }
    }
    return (typeof UI !== 'undefined' && UI.umurTeks) ? UI.umurTeks(tglLahir) : '-';
  }

  // Helper konversi tanggal Indo: "19 September 2026"
  function tglIndo(tglStr) {
    if (!tglStr) return '-';
    const d = new Date(tglStr);
    if (isNaN(d)) return tglStr;
    const bln = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Buka jendela/tab PDF tanpa blank screen
  async function bukaPdf(docDef, judul = 'Dokumen') {
    // Segera buka jendela kosong agar tidak dicekal popup blocker browser
    let win = null;
    try {
      win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${judul}</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background: #f8fafc;
                  color: #334155;
                }
                .spinner {
                  width: 36px;
                  height: 36px;
                  border: 3px solid #e2e8f0;
                  border-top-color: #0284c7;
                  border-radius: 50%;
                  animation: spin 0.8s linear infinite;
                  margin-bottom: 16px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
              </style>
            </head>
            <body>
              <div class="spinner"></div>
              <div style="font-weight:600;font-size:15px">Menyiapkan ${judul}...</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px">Mohon tunggu sebentar</div>
            </body>
          </html>
        `);
      }
    } catch (_) {}

    try {
      const pdf = pdfMake.createPdf(docDef);
      pdf.getBlob((blob) => {
        const url = URL.createObjectURL(blob);
        if (win && !win.closed) {
          win.location.href = url;
        } else {
          const w = window.open(url, '_blank');
          if (!w) {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              if (a.parentNode) a.parentNode.removeChild(a);
            }, 1000);
          }
        }
      });
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
      if (win && !win.closed) {
        win.document.body.innerHTML = `
          <div style="color:#dc2626;padding:24px;text-align:center;font-family:sans-serif;">
            <h3>Gagal Membuat Dokumen</h3>
            <p>${err.message || err}</p>
          </div>
        `;
      }
      throw err;
    }
  }

  // Data pasien yang seragam
  function formatData(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom = null) {
    const noLab = formatNoLab(noLabKustom || pasien.no_lab || pasien.no_lembar, pasien.tanggal || new Date());
    const tglObj = pasien.tanggal ? new Date(pasien.tanggal) : new Date();
    const tglStr = isNaN(tglObj) ? new Date().toISOString().split('T')[0] : tglObj.toISOString().split('T')[0];

    // Format waktu sampel: YYYY-MM-DD HH:mm:ss
    const jamInput = document.getElementById('fJanjiJam')?.value;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const waktuSampel = `${tglStr} ${jamInput ? jamInput + ':00' : `${hh}:${mm}:${ss}`}`;

    const dokter = document.getElementById('fDokterNama')?.value || pasien.dokter_nama || '-';

    // Daftar pemeriksaan: nama dipisah koma
    let pxList = [];
    if (Array.isArray(labDipilih)) {
      pxList = labDipilih.map(p => p.nama || p.ref_nama || '').filter(Boolean);
    }
    const pemeriksaanTeks = pxList.length ? (pxList.join(', ') + ',') : '-';

    const title = pasien.title || document.getElementById('fTitle')?.value || '';
    const nama = pasien.nama || '-';
    const jk = (pasien.jenis_kelamin === 'L' || pasien.jenis_kelamin === 'Laki-laki') ? 'Laki-Laki' : 'Perempuan';
    const umurLengkap = formatUmurLengkap(pasien.tanggal_lahir);

    return {
      no_lab: noLab,
      no_reg: pasien.no_rm || ('RM-' + Date.now().toString().slice(-6)),
      nik: pasien.nik || document.getElementById('fNik')?.value || '-',
      title: title,
      nama: nama,
      umur: umurLengkap,
      jk: jk,
      alamat: pasien.alamat || document.getElementById('fAlamat')?.value || '-',
      tanggal: tglStr,
      tanggal_teks: tglIndo(tglStr),
      sampel_waktu: waktuSampel,
      dokter: dokter,
      diagnosa: pasien.diagnosa || '',
      pemeriksaan: labDipilih || [],
      pemeriksaan_teks: pemeriksaanTeks,
      bruto: Number(bruto) || 0,
      netto: Number(netto) || 0,
      bayar: Number(bayar) || 0,
      kurang: Number(kurang) || 0,
      jenisBayar: jenisBayar || 'UMUM',
      status: kurang > 0 ? 'BELUM LUNAS' : 'LUNAS'
    };
  }

  async function cetakNotaM1(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom = null) {
    await muatPdfMake();
    const data = formatData(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom);

    const docDef = {
      pageSize: 'A5',
      pageOrientation: 'landscape',
      pageMargins: [20, 20, 20, 20],
      defaultStyle: { fontSize: 9 },
      content: [
        { text: 'NOTA PEMBAYARAN', alignment: 'center', bold: true, fontSize: 11, margin: [0, 0, 0, 2] },
        { text: 'No : ' + data.no_lab, alignment: 'center', bold: true, fontSize: 10, margin: [0, 0, 0, 15] },
        {
          columns: [
            { width: 70, text: 'Nama Pelanggan' },
            { width: 'auto', text: ': ' + data.nama },
            { width: '*', text: '' },
            { width: 80, text: 'No Register' },
            { width: 'auto', text: ': ' + data.no_reg }
          ], margin: [0, 0, 0, 4]
        },
        {
          columns: [
            { width: 70, text: 'Umur/Jenis Kelamin' },
            { width: 'auto', text: ': ' + data.umur + ' / ' + data.jk },
            { width: '*', text: '' },
            { width: 80, text: 'No Lab' },
            { width: 'auto', text: ': ' + data.no_lab }
          ], margin: [0, 0, 0, 4]
        },
        {
          columns: [
            { width: 70, text: 'Alamat' },
            { width: 'auto', text: ': ' + data.alamat },
            { width: '*', text: '' },
            { width: 80, text: 'Tanggal' },
            { width: 'auto', text: ': ' + data.tanggal_teks }
          ], margin: [0, 0, 0, 4]
        },
        {
          columns: [
            { width: 70, text: 'Dokter' },
            { width: 'auto', text: ': ' + data.dokter }
          ], margin: [0, 0, 0, 10]
        },
        {
          table: {
            headerRows: 1,
            widths: [20, '*', 60, 40, 60],
            body: [
              [
                { text: 'No', bold: true, border: [false, true, false, true] },
                { text: 'Nama Pemeriksaan', bold: true, border: [false, true, false, true] },
                { text: 'Harga', bold: true, alignment: 'right', border: [false, true, false, true] },
                { text: 'Disc', bold: true, alignment: 'right', border: [false, true, false, true] },
                { text: 'Net', bold: true, alignment: 'right', border: [false, true, false, true] }
              ],
              ...data.pemeriksaan.map((px, i) => [
                { text: i + 1, border: [false, false, false, false] },
                { text: px.nama, border: [false, false, false, false] },
                { text: (px.harga || 0).toLocaleString('id-ID'), alignment: 'right', border: [false, false, false, false] },
                { text: (px.disc || 0), alignment: 'right', border: [false, false, false, false] },
                { text: (px.net || 0).toLocaleString('id-ID'), alignment: 'right', border: [false, false, false, false] }
              ]),
              [
                { text: 'TOTAL', colSpan: 2, bold: true, border: [false, true, false, true], margin: [0, 2, 0, 2] },
                {},
                { text: data.bruto.toLocaleString('id-ID'), alignment: 'right', bold: true, border: [false, true, false, true], margin: [0, 2, 0, 2] },
                { text: '', border: [false, true, false, true], margin: [0, 2, 0, 2] },
                { text: data.netto.toLocaleString('id-ID'), alignment: 'right', bold: true, border: [false, true, false, true], margin: [0, 2, 0, 2] }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            { width: 120, text: 'PEMBAYARAN' },
            { width: 'auto', text: ': ' + data.bayar.toLocaleString('id-ID') }
          ], margin: [0, 0, 0, 2]
        },
        {
          columns: [
            { width: 120, text: 'Kurang Bayar', bold: true },
            { width: 'auto', text: ': ' + data.kurang.toLocaleString('id-ID'), bold: true }
          ], margin: [0, 0, 0, 2]
        },
        {
          columns: [
            { width: 120, text: 'Status Pelunasan' },
            { width: 'auto', text: ': ' + data.status, bold: true }
          ], margin: [0, 0, 0, 2]
        },
        {
          columns: [
            { width: 120, text: 'PENGAMBILAN HASIL' },
            { width: 'auto', text: ': Di Ambil Sendiri', bold: true }
          ], margin: [0, 0, 0, 2]
        },
        {
          columns: [
            { width: 120, text: 'HASIL SELESAI' },
            { width: 'auto', text: ': ' + tglIndo(document.getElementById('fJanjiTgl')?.value) + ' Jam ' + (document.getElementById('fJanjiJam')?.value || ''), bold: true }
          ], margin: [0, 0, 0, 10]
        },
        { text: 'Terima Kasih Sudah melakukan Pemeriksaan di Lab. Klinik "UTAMA"', alignment: 'center', bold: true, fontSize: 10 }
      ]
    };
    await bukaPdf(docDef, 'Nota Pembayaran - ' + data.no_lab);
  }

  async function cetakNoLab(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom = null) {
    await muatPdfMake();

    // Dapatkan URL logo.png dengan aman dan absolut
    let kopImage = null;
    try {
      const logoUrl = new URL('logo.png', window.location.href.split('#')[0]).href;
      const logoB64 = await ambilGambarBase64(logoUrl);
      if (logoB64) {
        kopImage = { image: logoB64, width: 75 };
      }
    } catch (e) {
      console.warn('Gagal memuat logo untuk blanko No Lab', e);
    }

    if (!kopImage) {
      if (typeof KopKlinik !== 'undefined' && KopKlinik.gambar) {
        try {
          kopImage = { image: KopKlinik.gambar(), width: 75 };
        } catch (_) {}
      }
    }

    if (!kopImage) {
      kopImage = {
        text: 'UTAMA\nLAB',
        fontSize: 13,
        bold: true,
        color: '#2e7d32',
        alignment: 'center',
        margin: [0, 8, 0, 0]
      };
    }

    const data = formatData(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom);

    const docDef = {
      pageSize: 'A5',
      pageOrientation: 'portrait',
      pageMargins: [35, 30, 35, 30],
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.2
      },
      content: [
        // HEADER: LOGO, ALAMAT & NO LAB INFO
        {
          columns: [
            {
              width: 75,
              ...kopImage
            },
            {
              width: '*',
              margin: [12, 2, 0, 0],
              stack: [
                { text: 'Laboratorium Medis UTAMA', bold: true, fontSize: 11, margin: [0, 0, 0, 3] },
                { text: 'Jl. DI Panjaitan No. 94 Purbalingga', fontSize: 9, margin: [0, 0, 0, 2] },
                { text: 'Telp. 0281-6580099 / 08121482308', fontSize: 9, margin: [0, 0, 0, 2] },
                { text: 'Email : laboratoriumutama@yahoo.com', fontSize: 9 }
              ]
            },
            {
              width: 175,
              margin: [0, 2, 0, 0],
              stack: [
                {
                  columns: [
                    { width: 48, text: 'No Lab', fontSize: 9 },
                    { width: 8, text: ':', fontSize: 9 },
                    { width: '*', text: data.no_lab, bold: true, fontSize: 9 }
                  ],
                  margin: [0, 0, 0, 3]
                },
                {
                  columns: [
                    { width: 48, text: 'Tanggal', fontSize: 9 },
                    { width: 8, text: ':', fontSize: 9 },
                    { width: '*', text: data.tanggal_teks, fontSize: 9 }
                  ],
                  margin: [0, 0, 0, 3]
                },
                {
                  columns: [
                    { width: 48, text: 'Sampel', fontSize: 9 },
                    { width: 8, text: ':', fontSize: 9 },
                    { width: '*', text: data.sampel_waktu, fontSize: 9 }
                  ]
                }
              ]
            }
          ],
          margin: [0, 0, 0, 25]
        },

        // DATA IDENTITAS PASIEN
        {
          columns: [
            { width: 85, text: 'NIK', fontSize: 10 },
            { width: 12, text: ':', fontSize: 10 },
            { width: '*', text: data.nik, fontSize: 10 }
          ],
          margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 85, text: 'Nama/Umur', fontSize: 10 },
            { width: 12, text: ':', fontSize: 10 },
            { width: '*', text: `${data.title ? data.title + ' ' : ''}${data.nama} / ${data.umur} (${data.jk})`, fontSize: 10 }
          ],
          margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 85, text: 'Alamat', fontSize: 10 },
            { width: 12, text: ':', fontSize: 10 },
            { width: '*', text: data.alamat, fontSize: 10 }
          ],
          margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 85, text: 'Pengirim', fontSize: 10 },
            { width: 12, text: ':', fontSize: 10 },
            { width: '*', text: data.dokter, fontSize: 10 }
          ],
          margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 85, text: 'Diagnosa', fontSize: 10 },
            { width: 12, text: ':', fontSize: 10 },
            { width: '*', text: data.diagnosa || '', fontSize: 10 }
          ],
          margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 85, text: 'Pemeriksaan', fontSize: 10 },
            { width: 12, text: ':', fontSize: 10 },
            { width: '*', text: data.pemeriksaan_teks, fontSize: 10 }
          ],
          margin: [0, 0, 0, 6]
        },

        // BAGIAN BAWAH: CATATAN & TOTAL BIAYA BOX
        {
          margin: [0, 45, 0, 0],
          columns: [
            {
              width: '*',
              text: 'Catatan :',
              fontSize: 10
            },
            {
              width: 175,
              table: {
                widths: [175],
                body: [
                  [
                    {
                      text: 'Rp. ' + Number(data.netto).toLocaleString('id-ID'),
                      fontSize: 12,
                      margin: [10, 8, 10, 45]
                    }
                  ]
                ]
              },
              layout: {
                hLineWidth: function() { return 1; },
                vLineWidth: function() { return 1; },
                hLineColor: function() { return '#222'; },
                vLineColor: function() { return '#222'; }
              }
            }
          ]
        }
      ]
    };

    await bukaPdf(docDef, 'Blanko No Lab - ' + data.no_lab);
  }

  async function cetakIC(pasien, jenis = 'UMUM') {
    await muatPdfMake();

    let judul = 'SURAT PERSETUJUAN TINDAKAN MEDIS LABORATORIUM';
    let deskripsiTindakan = 'pengambilan sampel darah, urine, atau cairan tubuh lainnya untuk analisis klinis';
    if (jenis === 'ANTIGEN') {
      judul = 'SURAT PERSETUJUAN TINDAKAN (INFORMED CONSENT) RAPID TEST ANTIGEN';
      deskripsiTindakan = 'pengambilan swab nasofaring / orofaring untuk pemeriksaan Rapid Test Antigen SARS-CoV-2';
    } else if (jenis === 'PCR') {
      judul = 'SURAT PERSETUJUAN TINDAKAN (INFORMED CONSENT) SWAB RT-PCR';
      deskripsiTindakan = 'pengambilan swab nasofaring dan orofaring untuk pemeriksaan Nucleic Acid Amplification Test (RT-PCR)';
    }

    const tglSekarang = tglIndo(new Date().toISOString().split('T')[0]);
    const namaPasien = pasien.nama || '-';
    const noRm = pasien.no_rm || '-';
    const nik = pasien.nik || '-';
    const jk = (pasien.jenis_kelamin === 'L' || pasien.jenis_kelamin === 'Laki-laki') ? 'Laki-Laki' : 'Perempuan';
    const umur = formatUmurLengkap(pasien.tanggal_lahir);
    const alamat = pasien.alamat || '-';
    const telp = pasien.no_telp || pasien.no_hp || '-';

    const docDef = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 35, 40, 35],
      defaultStyle: { fontSize: 10, lineHeight: 1.3 },
      content: [
        {
          stack: [
            { text: 'LABORATORIUM MEDIS UTAMA', bold: true, fontSize: 14, alignment: 'center' },
            { text: 'Jl. DI Panjaitan No. 94, Purbalingga - Jawa Tengah | Telp. 0281-6580099 / 08121482308', fontSize: 9, alignment: 'center', color: '#555' },
            { text: '', margin: [0, 4, 0, 4], canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5 }] }
          ],
          margin: [0, 0, 0, 15]
        },
        { text: judul, bold: true, fontSize: 11, alignment: 'center', margin: [0, 0, 0, 15], decoration: 'underline' },
        { text: 'Saya yang bertanda tangan di bawah ini / bertindak atas nama pasien:', margin: [0, 0, 0, 8] },
        {
          columns: [
            { width: 130, text: 'Nama Pasien' },
            { width: 'auto', text: ': ' + namaPasien, bold: true }
          ], margin: [10, 0, 0, 4]
        },
        {
          columns: [
            { width: 130, text: 'No. Rekam Medis / NIK' },
            { width: 'auto', text: ': ' + noRm + ' / ' + nik }
          ], margin: [10, 0, 0, 4]
        },
        {
          columns: [
            { width: 130, text: 'Umur / Jenis Kelamin' },
            { width: 'auto', text: ': ' + umur + ' / ' + jk }
          ], margin: [10, 0, 0, 4]
        },
        {
          columns: [
            { width: 130, text: 'Alamat' },
            { width: 'auto', text: ': ' + alamat }
          ], margin: [10, 0, 0, 4]
        },
        {
          columns: [
            { width: 130, text: 'No. HP / Telepon' },
            { width: 'auto', text: ': ' + telp }
          ], margin: [10, 0, 0, 12]
        },
        {
          text: 'Menyatakan dengan sesungguhnya bahwa:', bold: true, margin: [0, 0, 0, 6]
        },
        {
          ol: [
            `Telah mendapatkan penjelasan secara rinci dan memadai mengenai maksud, tujuan, prosedur tindakan ${deskripsiTindakan}, serta kemungkinan rasa tidak nyaman yang timbul.`,
            'Telah diberikan kesempatan untuk mengajukan pertanyaan dan telah dijawab secara memuaskan oleh petugas laboratorium.',
            'Dengan penuh kesadaran dan tanpa paksaan dari pihak mana pun, memberikan PERSETUJUAN (INFORMED CONSENT) untuk dilakukannya tindakan pemeriksaan laboratorium tersebut.',
            'Menyetujui bahwa hasil pemeriksaan ini akan digunakan untuk kepentingan diagnosis medis dan tata laksana kesehatan yang sesuai.'
          ],
          margin: [10, 0, 0, 20]
        },
        { text: 'Demikian surat persetujuan tindakan ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.', margin: [0, 0, 0, 25] },
        {
          columns: [
            {
              width: '*',
              alignment: 'center',
              stack: [
                'Petugas Pelaksana Lab,',
                { text: '', margin: [0, 45, 0, 0] },
                { text: '( .................................................... )', bold: true }
              ]
            },
            {
              width: '*',
              alignment: 'center',
              stack: [
                `Purbalingga, ${tglSekarang}`,
                'Yang Menyatakan (Pasien / Wali),',
                { text: '', margin: [0, 45, 0, 0] },
                { text: `( ${namaPasien} )`, bold: true }
              ]
            }
          ]
        }
      ]
    };

    await bukaPdf(docDef, 'Informed Consent - ' + namaPasien);
  }

  return { cetakNotaM1, cetakNoLab, cetakIC, formatNoLab, formatUmurLengkap };
})();
