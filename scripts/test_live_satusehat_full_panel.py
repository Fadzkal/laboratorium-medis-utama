"""
=============================================================================
PENGUJIAN VALIDASI AKHIR INTEGRASI SATUSEHAT FHIR R4
=============================================================================
Menguji pengiriman panel pemeriksaan rutin lengkap:
1. Darah Lengkap (Hb, Leukosit, Trombosit, Hematokrit, Eritrosit, LED, Diff Count)
2. Kimia Darah (Cholesterol, Trigliserida, Asam Urat, Creatinin, Ureum, Glukosa Darah Puasa)
3. Urinalisis (Protein, Glukosa, pH, Sedimen)
ke SATUSEHAT Sandbox API melalui bridge lokal.
=============================================================================
"""

import sys
import os
import json
import time

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.join(parent_dir, "bridge"))

import satusehat_bridge

def main():
    print("=================================================================")
    print("PENGUJIAN LIVE FHIR R4 BUNDLE (HEMATOLOGI + KIMIA + URINALISIS)")
    print("=================================================================")
    
    # Uji Koneksi & Token
    conn = satusehat_bridge.uji_koneksi()
    print(f"Status Koneksi: {conn.get('pesan')}")
    if not conn.get("sukses"):
        print("Gagal koneksi ke SATUSEHAT Sandbox!")
        return

    # Pasien Uji Coba Terverifikasi
    test_nik = "3303045512940002"
    patient_res = satusehat_bridge.cari_pasien_nik(test_nik)
    if not patient_res.get("sukses"):
        print(f"Gagal cari pasien NIK {test_nik}: {patient_res}")
        return

    ihs_id = patient_res["ihs_id"]
    nama_pasien = patient_res.get("nama", "Ny. Pasien Uji")
    print(f"Pasien Terverifikasi: {nama_pasien} (IHS: {ihs_id})")

    no_lab_test = f"TEST-ROUTINE-{int(time.time())}"

    # Parameter Pemeriksaan Rutin yang 100% Terverifikasi
    items = [
        # Hematologi
        {"nama": "Hemoglobin", "kode_loinc": "718-7", "display_loinc": "Hemoglobin [Mass/volume] in Blood", "nilai": "14.2", "satuan": "g/dl", "rujukan": "13.0 - 17.0", "kode_specimen": "119297000", "nama_specimen": "Blood specimen"},
        {"nama": "Leukosit", "kode_loinc": "6690-2", "display_loinc": "Leukocytes [#/volume] in Blood", "nilai": "7800", "satuan": "/uL", "rujukan": "4000 - 10000", "kode_specimen": "119297000", "nama_specimen": "Blood specimen"},
        {"nama": "Trombosit", "kode_loinc": "777-3", "display_loinc": "Platelets [#/volume] in Blood", "nilai": "250000", "satuan": "/uL", "rujukan": "150000 - 450000", "kode_specimen": "119297000", "nama_specimen": "Blood specimen"},
        {"nama": "Hematokrit", "kode_loinc": "4544-3", "display_loinc": "Hematocrit [Volume Fraction] of Blood", "nilai": "42.5", "satuan": "%", "rujukan": "40.0 - 50.0", "kode_specimen": "119297000", "nama_specimen": "Blood specimen"},
        {"nama": "Eritrosit", "kode_loinc": "789-8", "display_loinc": "Erythrocytes [#/volume] in Blood", "nilai": "4.8", "satuan": "10^6/uL", "rujukan": "4.5 - 5.5", "kode_specimen": "119297000", "nama_specimen": "Blood specimen"},
        {"nama": "LED 1 Jam", "kode_loinc": "30341-2", "display_loinc": "Erythrocyte sedimentation rate by Westergren method", "nilai": "12", "satuan": "mm/jam", "rujukan": "< 15", "kode_specimen": "119297000", "nama_specimen": "Blood specimen"},
        {"nama": "Limfosit", "kode_loinc": "736-9", "display_loinc": "Lymphocytes/100 leukocytes in Blood", "nilai": "32", "satuan": "%", "rujukan": "20 - 40", "kode_specimen": "119297000", "nama_specimen": "Blood specimen"},
        
        # Kimia Klinik
        {"nama": "Cholesterol Total", "kode_loinc": "2093-3", "display_loinc": "Cholesterol [Mass/volume] in Serum or Plasma", "nilai": "175", "satuan": "mg/dL", "rujukan": "< 200", "kode_specimen": "119364003", "nama_specimen": "Serum specimen"},
        {"nama": "Trigliserida", "kode_loinc": "2571-8", "display_loinc": "Triglyceride [Mass/volume] in Serum or Plasma", "nilai": "110", "satuan": "mg/dL", "rujukan": "< 150", "kode_specimen": "119364003", "nama_specimen": "Serum specimen"},
        {"nama": "Asam Urat", "kode_loinc": "3084-1", "display_loinc": "Urate [Mass/volume] in Serum or Plasma", "nilai": "5.4", "satuan": "mg/dL", "rujukan": "3.5 - 7.0", "kode_specimen": "119364003", "nama_specimen": "Serum specimen"},
        {"nama": "Creatinin", "kode_loinc": "2160-0", "display_loinc": "Creatinine [Mass/volume] in Serum or Plasma", "nilai": "0.9", "satuan": "mg/dL", "rujukan": "0.6 - 1.2", "kode_specimen": "119364003", "nama_specimen": "Serum specimen"},
        {"nama": "Ureum", "kode_loinc": "3091-6", "display_loinc": "Blood urea nitrogen [Mass/volume] in Serum or Plasma", "nilai": "26", "satuan": "mg/dL", "rujukan": "10 - 50", "kode_specimen": "119364003", "nama_specimen": "Serum specimen"},
        {"nama": "Glukosa Darah Puasa", "kode_loinc": "1558-6", "display_loinc": "Fasting glucose [Mass/volume] in Serum or Plasma", "nilai": "94", "satuan": "mg/dL", "rujukan": "70 - 110", "kode_specimen": "119364003", "nama_specimen": "Serum specimen"},
        
        # Urinalisis
        {"nama": "Protein Urin", "kode_loinc": "20454-5", "display_loinc": "Protein [Presence] in Urine by Test strip", "nilai": "Negatif", "satuan": "", "rujukan": "Negatif", "kode_specimen": "122575003", "nama_specimen": "Urine specimen"},
        {"nama": "Glukosa Urin", "kode_loinc": "25428-4", "display_loinc": "Glucose [Presence] in Urine by Test strip", "nilai": "Negatif", "satuan": "", "rujukan": "Negatif", "kode_specimen": "122575003", "nama_specimen": "Urine specimen"},
        {"nama": "pH Urin", "kode_loinc": "5803-2", "display_loinc": "pH of Urine by Test strip", "nilai": "6.0", "satuan": "", "rujukan": "5.0 - 7.5", "kode_specimen": "122575003", "nama_specimen": "Urine specimen"}
    ]

    print(f"\nMengirim {len(items)} parameter pemeriksaan laboratorium rutin ke SATUSEHAT...")
    res = satusehat_bridge.kirim_hasil_lab_lengkap(
        no_lab=no_lab_test,
        patient_ihs=ihs_id,
        patient_name=nama_pasien,
        items=items,
        practitioner_name="dr. Minto Rahaju, Sp.PK"
    )

    print("\n--- HASIL RESPON SATUSEHAT KEMENKES ---")
    print(f"Sukses           : {res.get('sukses')}")
    print(f"Pesan            : {res.get('pesan')}")
    print(f"Encounter ID     : {res.get('encounter_id')}")
    print(f"ServiceRequest ID: {res.get('servicerequest_id')}")
    print(f"Specimen ID      : {res.get('specimen_id')}")
    print(f"DiagReport ID    : {res.get('diagnostic_report_id')}")
    print(f"Total Terkirim   : {res.get('total_loinc_terkirim')}/{len(items)}")

    if res.get("sukses") and res.get("total_loinc_terkirim") == len(items):
        print("\n[OK] 100% SEMPURNA! SELURUH 16 DARI 16 PARAMETER DITERIMA TANPA ADA KESALAHAN!")
        for obs in res.get("observations", []):
            print(f"  + Observation: {obs.get('observation_id')} -> {obs.get('nama')}: {obs.get('nilai')} (LOINC: {obs.get('kode_loinc')})")
    else:
        print("[X] Perhatian:", res)

if __name__ == "__main__":
    main()
