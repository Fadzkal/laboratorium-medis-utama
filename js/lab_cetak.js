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

  // Helper konversi tanggal Indo
  function tglIndo(tglStr) {
    if (!tglStr) return '-';
    const d = new Date(tglStr);
    if (isNaN(d)) return tglStr;
    const bln = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Data pasien yang seragam
  function formatData(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar) {
    return {
      no_lab: 'LB' + Date.now().toString().slice(-6), // Dummy No Lab
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

  async function cetakNotaM1(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar) {
    await muatPdfMake();
    const data = formatData(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar);

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

  async function cetakNoLab(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar) {
    await muatPdfMake();
    
    // Gunakan KopKlinik
    let kopImage = { text: '[LOGO]', fontSize: 16, bold: true };
    if (typeof KopKlinik !== 'undefined') {
      kopImage = { image: KopKlinik.gambar(), width: 80 };
    }

    const data = formatData(pasien, labDipilih, bruto, netto, bayar, kurang, jenisBayar);

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
                { text: 'No Lab : ' + data.no_lab, margin: [0, 0, 0, 4] },
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

  return { cetakNotaM1, cetakNoLab };
})();
