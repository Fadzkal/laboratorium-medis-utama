/* =====================================================================
   PEMERIKSAAN LAB ROUTER (PERIKSA PASIEN)

   Menghubungkan aksi "Periksa" (dari Beranda, Antrean, dsb.) langsung
   ke modul Laboratorium sesuai jenis pemeriksaan pasien (Analisa Sperma,
   Pemeriksaan Fisik, Anamnesa, atau Hasil Lab Reguler).
   Semua form dummy rawat jalan / odontogram / klinik dokter telah dihapus.
   ===================================================================== */
const Periksa = (() => {

  async function deteksiTujuanLab(kunjunganId) {
    if (!kunjunganId) return '#/lab/hasil';

    try {
      // 1. Cari permintaan lab untuk kunjungan atau permintaan ini
      let lp = null;
      if (typeof DB !== 'undefined' && DB.sb) {
        const { data, error } = await DB.sb.from('lab_permintaan')
          .select('id, no_lab, status, tanggal, kunjungan_id, hasil:lab_hasil(ref:lab_id(kode,nama,kelompok))')
          .or(`id.eq.${kunjunganId},kunjungan_id.eq.${kunjunganId}`)
          .neq('status', 'BATAL')
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          lp = data[0];
        }
      }

      // 2. Fallback cek ke v_lab_antrean jika belum ditemukan
      if (!lp && typeof DB !== 'undefined' && DB.sb) {
        const { data: antrean } = await DB.sb.from('v_lab_antrean')
          .select('id, no_lab, tanggal, status, kunjungan_id, ada_fisik')
          .or(`id.eq.${kunjunganId},kunjungan_id.eq.${kunjunganId}`)
          .limit(1);
        if (antrean && antrean.length > 0) {
          lp = antrean[0];
        }
      }

      if (!lp) {
        return '#/lab/hasil';
      }

      const lpId = lp.id;
      const hasil = lp.hasil || [];

      // A. Cek Analisa Sperma (DB atau localStorage)
      if (localStorage.getItem('lab_sperma_' + lpId)) {
        return `#/lab/sperma/${lpId}`;
      }
      try {
        const { count: spCount } = await DB.sb.from('lab_sperma').select('id', { count: 'exact', head: true }).eq('permintaan_id', lpId);
        if (spCount > 0) return `#/lab/sperma/${lpId}`;
      } catch (_) {}

      // B. Analisa sperma dari kode / nama item
      const isSperma = hasil.some(h => {
        const k = (h.ref?.kode || '').toUpperCase();
        const n = (h.ref?.nama || '').toLowerCase();
        const g = (h.ref?.kelompok || '').toLowerCase();
        return k === 'S0102' || n.includes('sperma') || n.includes('semen') || g.includes('sperma');
      });
      if (isSperma) return `#/lab/sperma/${lpId}`;

      // C. Pemeriksaan fisik
      if (lp.ada_fisik) return `#/lab/fisik/${lpId}`;
      try {
        const { count: fsCount } = await DB.sb.from('lab_fisik').select('id', { count: 'exact', head: true }).eq('permintaan_id', lpId);
        if (fsCount > 0) return `#/lab/fisik/${lpId}`;
      } catch (_) {}
      const isFisik = hasil.some(h => {
        const k = (h.ref?.kode || '').toUpperCase();
        const n = (h.ref?.nama || '').toLowerCase();
        const g = (h.ref?.kelompok || '').toLowerCase();
        return ['A0101', 'A0119', 'A0126'].includes(k) || n.includes('fisik') || g.includes('fisik');
      });
      if (isFisik) return `#/lab/fisik/${lpId}`;

      // D. Anamnesa
      try {
        const { count: anCount } = await DB.sb.from('lab_anamnesa').select('id', { count: 'exact', head: true }).eq('permintaan_id', lpId);
        if (anCount > 0) return `#/lab/anamnesa/${lpId}`;
      } catch (_) {}
      const isAnamnesa = hasil.some(h => {
        const k = (h.ref?.kode || '').toUpperCase();
        const n = (h.ref?.nama || '').toLowerCase();
        const g = (h.ref?.kelompok || '').toLowerCase();
        return k === 'AN0101' || n.includes('anamnes') || n.includes('mcu') || g.includes('anamnes');
      });
      if (isAnamnesa) return `#/lab/anamnesa/${lpId}`;

      // E. Default ke Hasil Pemeriksaan reguler
      return `#/lab/hasil/${lpId}`;
    } catch (err) {
      console.error('Gagal deteksi tujuan lab:', err);
      return '#/lab/hasil';
    }
  }

  async function render(el, param) {
    const id = param && param[0];
    if (!id) {
      location.replace('#/lab/hasil');
      return;
    }

    el.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:420px; gap:16px; text-align:center; padding:40px 20px;">
        <div class="spinner" style="width:40px; height:40px; border-width:3px;"></div>
        <div>
          <div style="font-weight:700; font-size:16px; color:var(--ink-800, #1e293b); margin-bottom:6px;">
            Mengarahkan ke Modul Pemeriksaan Laboratorium...
          </div>
          <div style="font-size:13px; color:var(--ink-500, #64748b);">
            Menyesuaikan kategori pemeriksaan pasien ke tab laboratorium terkait
          </div>
        </div>
      </div>
    `;

    const tujuan = await deteksiTujuanLab(id);
    location.replace(tujuan);
  }

  return {
    render,
    deteksiTujuanLab
  };
})();
