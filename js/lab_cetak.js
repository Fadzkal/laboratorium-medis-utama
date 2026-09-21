const LabCetak = (() => {
  'use strict';

  let pdfSiap = null;

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

  // Helper konversi gambar ke Base64
  async function ambilGambarBase64(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Gagal memuat gambar logo', e);
      return null;
    }
  }

  // Helper konversi tanggal Indo
  function tglIndo(tglStr) {
    if (!tglStr) return '-';
    const d = new Date(tglStr);
    if (isNaN(d)) return tglStr;
    const bln = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Data pasien yang seragam
  function formatData(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom = null) {
    return {
      no_lab: noLabKustom || pasien.no_lembar || ('LB' + Date.now().toString().slice(-6)),
      no_reg: pasien.no_rm || ('RG' + Date.now().toString().slice(-6)),
      nama: pasien.nama || '-',
      umur: UI.umurTeks(pasien.tanggal_lahir),
      jk: pasien.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan',
      alamat: pasien.alamat || '-',
      tanggal: new Date().toISOString().split('T')[0],
      waktu: new Date().toISOString().split('T')[1].slice(0, 8),
      dokter: document.getElementById('fDokterNama')?.value || '-',
      nik: pasien.nik || '-',
      pemeriksaan: labDipilih,
      bruto, netto, bayar, kurang, jenisBayar,
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
            { width: 'auto', text: ': ' + tglIndo(data.tanggal) }
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
                { text: px.harga.toLocaleString('id-ID'), alignment: 'right', border: [false, false, false, false] },
                { text: px.disc, alignment: 'right', border: [false, false, false, false] },
                { text: px.net.toLocaleString('id-ID'), alignment: 'right', border: [false, false, false, false] }
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
    pdfMake.createPdf(docDef).open();
  }

  async function cetakNoLab(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom = null) {
    await muatPdfMake();
    
    // Gunakan logo.png
    let kopImage = { text: '[LOGO]', fontSize: 16, bold: true };
    const logoUrl = window.location.origin + window.location.pathname.replace(/app\.html.*/, '') + 'logo.png';
    const logoB64 = await ambilGambarBase64(logoUrl);
    if (logoB64) {
      kopImage = { image: logoB64, width: 80 };
    } else if (typeof KopKlinik !== 'undefined') {
      kopImage = { image: KopKlinik.gambar(), width: 80 };
    }

    const data = formatData(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar, noLabKustom);

    const docDef = {
      pageSize: 'A5',
      pageOrientation: 'portrait',
      pageMargins: [30, 30, 30, 30],
      defaultStyle: { fontSize: 10 },
      content: [
        {
          columns: [
            { width: 80, ...kopImage },
            {
              width: '*',
              stack: [
                { text: 'Laboratorium Medis UTAMA', bold: true, fontSize: 11 },
                'Jl. DI Panjaitan No. 94 Purbalingga',
                'Telp. 0281-6580099 / 08121482308',
                'Email : laboratoriumutama@yahoo.com'
              ],
              margin: [0, 5, 0, 0],
              fontSize: 9
            },
            {
              width: 130,
              stack: [
                { text: 'No Lab : ' + data.no_lab, margin: [0, 0, 0, 4], bold: true },
                { text: 'Tanggal : ' + tglIndo(data.tanggal), margin: [0, 0, 0, 4] },
                { text: 'Sampel : ' + data.tanggal + ' ' + data.waktu }
              ],
              fontSize: 9
            }
          ],
          margin: [0, 0, 0, 20]
        },
        {
          columns: [
            { width: 80, text: 'NIK' },
            { width: 'auto', text: ': ' + data.nik }
          ], margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 80, text: 'Nama/Umur' },
            { width: 'auto', text: ': ' + data.nama + ' / ' + data.umur + ' (' + data.jk + ')' }
          ], margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 80, text: 'Alamat' },
            { width: 'auto', text: ': ' + data.alamat }
          ], margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 80, text: 'Pengirim' },
            { width: 'auto', text: ': ' + data.dokter }
          ], margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 80, text: 'Diagnosa' },
            { width: 'auto', text: ':' }
          ], margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { width: 80, text: 'Pemeriksaan' },
            { width: 'auto', text: ': ' + data.pemeriksaan.map(p => p.nama).join(', ') }
          ], margin: [0, 0, 0, 20]
        },
        { text: 'Catatan :', margin: [0, 0, 0, 10] },
        {
          table: {
            widths: ['60%'],
            body: [
              [
                { text: 'Rp. ' + data.netto.toLocaleString('id-ID'), fontSize: 13, margin: [10, 10, 10, 30] }
              ]
            ]
          }
        }
      ]
    };
    pdfMake.createPdf(docDef).open();
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
    const jk = pasien.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan';
    const umur = UI.umurTeks(pasien.tanggal_lahir) || '-';
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

    pdfMake.createPdf(docDef).open();
  }

  return { cetakNotaM1, cetakNoLab, cetakIC };
})();
