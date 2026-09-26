/* =====================================================================
   AUTH — Helper Otorisasi & Manajemen Peran (Superadmin & Staf)
   Laboratorium Medis Utama
   ===================================================================== */
const Auth = (() => {
  /**
   * Cek apakah pengguna saat ini berstatus Developer / Superadmin
   * @param {Object} profil
   * @returns {boolean}
   */
  const isDeveloper = (profil) => {
    return profil?.peran === 'developer';
  };

  /**
   * Cek apakah pengguna saat ini berstatus Master / Pimpinan Lab
   * @param {Object} profil
   * @returns {boolean}
   */
  const isMaster = (profil) => {
    return profil?.peran === 'master';
  };

  /**
   * Cek apakah pengguna memiliki hak akses penuh (Master atau Developer)
   * @param {Object} profil
   * @returns {boolean}
   */
  const isSuperadmin = (profil) => {
    return isMaster(profil) || isDeveloper(profil);
  };

  /**
   * Format label peran untuk antarmuka pengguna
   * @param {string} peran
   * @returns {string}
   */
  const formatLabelPeran = (peran) => {
    switch (peran) {
      case 'developer':
        return 'IT & Sistem Administrator';
      case 'master':
        return 'Master / Pimpinan';
      case 'karyawan':
        return 'Karyawan / Analis Lab';
      case 'dokter':
        return 'Dokter';
      case 'perawat':
        return 'Perawat';
      case 'apoteker':
        return 'Apoteker / Farmasi';
      case 'kasir':
        return 'Kasir';
      case 'admin':
        return 'Petugas Loket / Pendaftaran';
      default:
        return peran || 'Pengguna';
    }
  };

  return {
    isDeveloper,
    isMaster,
    isSuperadmin,
    formatLabelPeran
  };
})();

if (typeof window !== 'undefined') {
  window.Auth = Auth;
}
