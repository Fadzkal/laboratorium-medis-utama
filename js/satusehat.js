/**
 * =============================================================================
 * SATUSEHAT INTEGRATION ENGINE - LABORATORIUM MEDIS UTAMA
 * =============================================================================
 * Menghubungkan modul laboratorium web ke Kemenkes SATUSEHAT (FHIR R4)
 * melalui LIS Bridge lokal (Port 7119).
 *
 * Resource FHIR yang didukung:
 * 1. Patient        : Pencarian & Auto-Register by NIK
 * 2. Practitioner   : Pencarian Nakes by NIK
 * 3. Encounter      : Rawat Jalan / Kunjungan Lab
 * 4. ServiceRequest : Permintaan Layanan Pemeriksaan
 * 5. Specimen       : Sampel Darah / Serum / Urin (SNOMED-CT)
 * 6. Observation    : Parameter Hasil Tes Lab (LOINC)
 * 7. DiagnosticReport: Bundel Laporan Akhir Hasil Laboratorium (LOINC 11502-2)
 * =============================================================================
 */

const SatuSehat = (function() {
  const BRIDGE_URL = 'http://127.0.0.1:7119';

  async function cekKoneksi() {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/satusehat/tes-koneksi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(6000)
      });
      return await res.json();
    } catch(err) {
      return { sukses: false, pesan: 'LIS Bridge (Port 7119) offline: ' + err.message };
    }
  }

  async function cariPasien(nik) {
    if (!nik) return { sukses: false, pesan: 'NIK pasien wajib diisi' };
    try {
      const res = await fetch(`${BRIDGE_URL}/api/satusehat/pasien?nik=${encodeURIComponent(String(nik).trim())}`, {
        signal: AbortSignal.timeout(8000)
      });
      return await res.json();
    } catch(err) {
      return { sukses: false, pesan: 'LIS Bridge (Port 7119) offline: ' + err.message };
    }
  }

  async function buatEncounter(params) {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/satusehat/encounter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(10000)
      });
      return await res.json();
    } catch(err) {
      return { sukses: false, pesan: 'LIS Bridge (Port 7119) offline: ' + err.message };
    }
  }

  /**
   * Mengirim seluruh paket hasil lab ke SATUSEHAT (FHIR R4):
   * Menerima permintaanId (string) atau dataPermintaan (objek lengkap)
   */
  async function kirimHasilLab(permintaanIdOrData) {
    let p = permintaanIdOrData;
    if (typeof p === 'string') {
      if (typeof DB !== 'undefined' && DB.labPermintaan) {
        p = await DB.labPermintaan(p);
      }
    }
    if (!p) {
      return { sukses: false, pesan: 'Data pemeriksaan tidak valid' };
    }

    const pasien = p.pasien || {};
    const kunjungan = p.kunjungan || {};
    const noLab = p.no_lab || '';
    const nik = String(pasien.nik || '').trim();
    let patientIhs = pasien.satusehat_patient_id || '';

    if (!nik && !patientIhs) {
      return { sukses: false, pesan: 'Pasien belum memiliki NIK. Lengkapi NIK pasien terlebih dahulu.' };
    }

    // Ekstrak item hasil lab yang memiliki kode LOINC
    const items = (p.hasil || []).map(h => {
      const ref = h.ref || {};
      const val = (h.nilai_angka !== null && h.nilai_angka !== undefined)
        ? String(h.nilai_angka)
        : (h.nilai_teks || '');
      return {
        nama: ref.nama || h.nama || '',
        kode_loinc: String(ref.kode_loinc || '').trim(),
        display_loinc: ref.display_loinc || ref.nama || h.nama || '',
        nilai: val,
        satuan: ref.satuan || h.satuan || '',
        rujukan: h.rujukan_teks || ref.teks_normal || '',
        kode_specimen: ref.kode_specimen || '119364003',
        nama_specimen: ref.nama_specimen || 'Serum specimen'
      };
    }).filter(x => Boolean(x.kode_loinc));

    if (!items.length) {
      return {
        sukses: false,
        pesan: 'Belum ada parameter lab dengan kode LOINC pada pemeriksaan ini. Atur kode LOINC di Master Lab.'
      };
    }

    const payload = {
      no_lab: noLab,
      patient_ihs: patientIhs,
      patient_nik: nik,
      patient_name: pasien.nama || '-',
      encounter_id: kunjungan.satusehat_encounter_id || '',
      items: items,
      practitioner_name: p.verifikator || p.peminta?.nama || 'Dokter Penanggung Jawab'
    };

    try {
      const res = await fetch(`${BRIDGE_URL}/api/satusehat/kirim-lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000)
      });
      const json = await res.json();

      if (json.sukses) {
        // Simpan referensi ke Supabase bila DB tersedia
        if (typeof DB !== 'undefined' && DB.sb) {
          const nowIso = new Date().toISOString();
          // Update pasien IHS jika baru didapatkan
          if (json.patient_ihs && pasien.id && !pasien.satusehat_patient_id) {
            await DB.sb.from('pasien').update({
              satusehat_patient_id: json.patient_ihs,
              satusehat_sinkron_pada: nowIso
            }).eq('id', pasien.id).catch(() => {});
            pasien.satusehat_patient_id = json.patient_ihs;
          }
          // Update kunjungan
          const kunjId = kunjungan.id || p.kunjungan_id;
          if (kunjId && json.encounter_id) {
            await DB.sb.from('kunjungan').update({
              satusehat_encounter_id: json.encounter_id,
              satusehat_status: 'TERKIRIM',
              satusehat_sinkron_pada: nowIso,
              satusehat_pesan: `Terkirim: DiagReport ${json.diagnostic_report_id || '-'} (${json.total_loinc_terkirim || 0} obs)`
            }).eq('id', kunjId).catch(() => {});
            kunjungan.satusehat_encounter_id = json.encounter_id;
          }
        }
      }

      return json;
    } catch(err) {
      return { sukses: false, pesan: 'LIS Bridge (Port 7119) offline: ' + err.message };
    }
  }

  return {
    BRIDGE_URL,
    cekKoneksi,
    cariPasien,
    buatEncounter,
    kirimHasilLab
  };
})();
