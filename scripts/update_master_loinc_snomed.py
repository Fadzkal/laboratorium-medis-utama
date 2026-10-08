"""
=============================================================================
STANDARDISASI LOINC & SNOMED CT MASTER LABORATORIUM MEDIS UTAMA
=============================================================================
Memetakan seluruh parameter laboratorium rutin, khusus, dan rujukan ke standar:
1. LOINC (Logical Observation Identifiers Names and Codes)
2. SNOMED CT (Systematized Nomenclature of Medicine - Clinical Terms)
sesuai Petunjuk Teknis Integrasi Laboratorium Kemenkes SATUSEHAT (FHIR R4).
=============================================================================
"""

import os
import sys
import re
import requests
import json

SUPABASE_URL = "http://187.53.142.245:8001"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0."
    "dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
)

# Standard Specimen SNOMED CT
SPEC_BLOOD = {"kode": "119297000", "nama": "Blood specimen"}
SPEC_SERUM = {"kode": "119364003", "nama": "Serum specimen"}
SPEC_PLASMA = {"kode": "119361006", "nama": "Plasma specimen"}
SPEC_URINE = {"kode": "122575003", "nama": "Urine specimen"}
SPEC_SWAB = {"kode": "258500001", "nama": "Nasopharyngeal swab"}
SPEC_STOOL = {"kode": "119339001", "nama": "Stool specimen"}
SPEC_SPUTUM = {"kode": "119334006", "nama": "Sputum specimen"}
SPEC_SEMEN = {"kode": "119347001", "nama": "Seminal fluid specimen"}

# KAMUS MAPPING MASTER PEMERIKSAAN KE STANDAR LOINC & SNOMED CT
MASTER_STANDARDS = {
    # =========================================================================
    # 1. HEMATOLOGI LENGKAP & RUTIN (CBC)
    # =========================================================================
    "H0101": {
        "loinc": "58410-2",
        "display": "Complete blood count panel - Blood by Automated count",
        "spec": SPEC_BLOOD
    },
    "H0102": {
        "loinc": "58410-2",
        "display": "Complete blood count panel - Blood by Automated count",
        "spec": SPEC_BLOOD
    },
    "H010101": {
        "loinc": "718-7",
        "display": "Hemoglobin [Mass/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "H010201": {
        "loinc": "718-7",
        "display": "Hemoglobin [Mass/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "HB": {
        "loinc": "718-7",
        "display": "Hemoglobin [Mass/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "H010102": {
        "loinc": "6690-2",
        "display": "Leukocytes [#/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "H010202": {
        "loinc": "6690-2",
        "display": "Leukocytes [#/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "LEU": {
        "loinc": "6690-2",
        "display": "Leukocytes [#/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "H010103": {
        "loinc": "777-3",
        "display": "Platelets [#/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "H010203": {
        "loinc": "777-3",
        "display": "Platelets [#/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "TRO": {
        "loinc": "777-3",
        "display": "Platelets [#/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "H010104": {
        "loinc": "4544-3",
        "display": "Hematocrit [Volume Fraction] of Blood",
        "spec": SPEC_BLOOD
    },
    "H010204": {
        "loinc": "4544-3",
        "display": "Hematocrit [Volume Fraction] of Blood",
        "spec": SPEC_BLOOD
    },
    "HCT": {
        "loinc": "4544-3",
        "display": "Hematocrit [Volume Fraction] of Blood",
        "spec": SPEC_BLOOD
    },
    "HT": {
        "loinc": "4544-3",
        "display": "Hematocrit [Volume Fraction] of Blood",
        "spec": SPEC_BLOOD
    },
    "H010105": {
        "loinc": "789-8",
        "display": "Erythrocytes [#/volume] in Blood",
        "spec": SPEC_BLOOD
    },
    "ERI": {
        "loinc": "789-8",
        "display": "Erythrocytes [#/volume] in Blood",
        "spec": SPEC_BLOOD
    },

    # LED (ESR)
    "H010106": {
        "loinc": "4496-5",
        "display": "Erythrocyte sedimentation rate",
        "spec": SPEC_BLOOD
    },
    "H01010601": {
        "loinc": "4496-5",
        "display": "Erythrocyte sedimentation rate 1 hour",
        "spec": SPEC_BLOOD
    },
    "H01010602": {
        "loinc": "4497-3",
        "display": "Erythrocyte sedimentation rate 2 hour",
        "spec": SPEC_BLOOD
    },
    "LED": {
        "loinc": "4496-5",
        "display": "Erythrocyte sedimentation rate",
        "spec": SPEC_BLOOD
    },

    # HITUNG JENIS LEUKOSIT (DIFF COUNT)
    "H01010701": {
        "loinc": "770-8",
        "display": "Neutrophils.band/100 leukocytes in Blood",
        "spec": SPEC_BLOOD
    },
    "H01010702": {
        "loinc": "764-1",
        "display": "Neutrophils.segmented/100 leukocytes in Blood",
        "spec": SPEC_BLOOD
    },
    "H01010703": {
        "loinc": "736-9",
        "display": "Lymphocytes/100 leukocytes in Blood",
        "spec": SPEC_BLOOD
    },
    "H01010704": {
        "loinc": "742-7",
        "display": "Monocytes/100 leukocytes in Blood",
        "spec": SPEC_BLOOD
    },
    "H01010705": {
        "loinc": "711-2",
        "display": "Eosinophils/100 leukocytes in Blood",
        "spec": SPEC_BLOOD
    },
    "H01010706": {
        "loinc": "706-2",
        "display": "Basophils/100 leukocytes in Blood",
        "spec": SPEC_BLOOD
    },

    # INDEKS ERITROSIT
    "H01010801": {
        "loinc": "787-2",
        "display": "MCV [Entitic volume] by Automated count",
        "spec": SPEC_BLOOD
    },
    "MCV": {
        "loinc": "787-2",
        "display": "MCV [Entitic volume] by Automated count",
        "spec": SPEC_BLOOD
    },
    "H01010802": {
        "loinc": "785-6",
        "display": "MCH [Entitic mass] by Automated count",
        "spec": SPEC_BLOOD
    },
    "MCH": {
        "loinc": "785-6",
        "display": "MCH [Entitic mass] by Automated count",
        "spec": SPEC_BLOOD
    },
    "H01010803": {
        "loinc": "786-4",
        "display": "MCHC [Mass/volume] by Automated count",
        "spec": SPEC_BLOOD
    },
    "MCHC": {
        "loinc": "786-4",
        "display": "MCHC [Mass/volume] by Automated count",
        "spec": SPEC_BLOOD
    },
    "H010109": {
        "loinc": "21000-5",
        "display": "Erythrocyte distribution width [Entitic volume]",
        "spec": SPEC_BLOOD
    },

    # GOLONGAN DARAH & RHESUS
    "H0106": {
        "loinc": "883-9",
        "display": "ABO group [Type] in Blood",
        "spec": SPEC_BLOOD
    },
    "H0107": {
        "loinc": "882-1",
        "display": "ABO and Rh group [Type] in Blood",
        "spec": SPEC_BLOOD
    },
    "H010701": {
        "loinc": "883-9",
        "display": "ABO group [Type] in Blood",
        "spec": SPEC_BLOOD
    },
    "H010702": {
        "loinc": "10331-7",
        "display": "Rh [Type] in Blood",
        "spec": SPEC_BLOOD
    },
    "H0161": {
        "loinc": "882-1",
        "display": "ABO and Rh group [Type] in Blood",
        "spec": SPEC_BLOOD
    },
    "H016101": {
        "loinc": "883-9",
        "display": "ABO group [Type] in Blood",
        "spec": SPEC_BLOOD
    },
    "H016102": {
        "loinc": "10331-7",
        "display": "Rh [Type] in Blood",
        "spec": SPEC_BLOOD
    },
    "GOLDA": {
        "loinc": "883-9",
        "display": "ABO group [Type] in Blood",
        "spec": SPEC_BLOOD
    },

    # HEMOSTASIS & KOAGULASI
    "H0109": {
        "loinc": "3187-0",
        "display": "Bleeding time",
        "spec": SPEC_BLOOD
    },
    "H0110": {
        "loinc": "3186-2",
        "display": "Clotting time of Blood",
        "spec": SPEC_BLOOD
    },
    "H0111": {
        "loinc": "5964-2",
        "display": "Prothrombin time (PT)",
        "spec": SPEC_PLASMA
    },
    "H0112": {
        "loinc": "91119-8",
        "display": "Activated partial thromboplastin time (aPTT)",
        "spec": SPEC_PLASMA
    },
    "H0113": {
        "loinc": "3255-5",
        "display": "Fibrinogen [Mass/volume] in Platelet poor plasma",
        "spec": SPEC_PLASMA
    },
    "H0114": {
        "loinc": "48058-2",
        "display": "Fibrin D-dimer FEU [Mass/volume] in Platelet poor plasma",
        "spec": SPEC_PLASMA
    },
    "H0171": {
        "loinc": "6301-6",
        "display": "INR in Platelet poor plasma by Coagulation assay",
        "spec": SPEC_PLASMA
    },
    "H0120": {
        "loinc": "2498-4",
        "display": "Iron [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "H0147": {
        "loinc": "2500-7",
        "display": "Iron binding capacity [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "H0122": {
        "loinc": "2276-4",
        "display": "Ferritin [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },

    # =========================================================================
    # 2. URINALISIS (URINE)
    # =========================================================================
    "U0101": {
        "loinc": "24356-8",
        "display": "Urinalysis complete panel - Urine",
        "spec": SPEC_URINE
    },
    "U0135": {
        "loinc": "24356-8",
        "display": "Urinalysis routine panel - Urine",
        "spec": SPEC_URINE
    },
    "U010101": {
        "loinc": "5778-6",
        "display": "Color of Urine",
        "spec": SPEC_URINE
    },
    "U010102": {
        "loinc": "5767-9",
        "display": "Appearance of Urine",
        "spec": SPEC_URINE
    },
    "U010103": {
        "loinc": "5803-2",
        "display": "pH of Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U0111": {
        "loinc": "5803-2",
        "display": "pH of Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U010104": {
        "loinc": "5811-5",
        "display": "Specific gravity of Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U0112": {
        "loinc": "5811-5",
        "display": "Specific gravity of Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U010105": {
        "loinc": "5802-4",
        "display": "Nitrite [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U0110": {
        "loinc": "5802-4",
        "display": "Nitrite [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U010106": {
        "loinc": "20454-5",
        "display": "Protein [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U0103": {
        "loinc": "20454-5",
        "display": "Protein [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U0114": {
        "loinc": "2888-6",
        "display": "Protein [Mass/volume] in Urine",
        "spec": SPEC_URINE
    },
    "U010107": {
        "loinc": "25428-4",
        "display": "Glucose [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U0102": {
        "loinc": "25428-4",
        "display": "Glucose [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U0140": {
        "loinc": "25428-4",
        "display": "Glucose 2 hours post meal in Urine",
        "spec": SPEC_URINE
    },
    "U010108": {
        "loinc": "2514-8",
        "display": "Ketones [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U010109": {
        "loinc": "20405-7",
        "display": "Urobilinogen [Mass/volume] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U010110": {
        "loinc": "5770-3",
        "display": "Bilirubin.total [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U010111": {
        "loinc": "5794-3",
        "display": "Hemoglobin [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    "U010112": {
        "loinc": "60017-1",
        "display": "Leukocyte esterase [Presence] in Urine by Test strip",
        "spec": SPEC_URINE
    },
    # SEDIMEN URIN
    "U01011301": {
        "loinc": "5799-2",
        "display": "Erythrocytes [#/area] in Urine sediment by Microscopy high power field",
        "spec": SPEC_URINE
    },
    "U01011302": {
        "loinc": "5821-4",
        "display": "Leukocytes [#/area] in Urine sediment by Microscopy high power field",
        "spec": SPEC_URINE
    },
    "U01011303": {
        "loinc": "5788-5",
        "display": "Epithelial cells [#/area] in Urine sediment by Microscopy high power field",
        "spec": SPEC_URINE
    },
    "U0101130401": {
        "loinc": "5822-2",
        "display": "Leukocyte casts [#/area] in Urine sediment by Microscopy high power field",
        "spec": SPEC_URINE
    },
    "U0101130402": {
        "loinc": "5800-7",
        "display": "Erythrocyte casts [#/area] in Urine sediment by Microscopy high power field",
        "spec": SPEC_URINE
    },
    "U0101130403": {
        "loinc": "5809-9",
        "display": "Hyaline casts [#/area] in Urine sediment by Microscopy high power field",
        "spec": SPEC_URINE
    },
    "U0101130404": {
        "loinc": "5808-1",
        "display": "Granular casts [#/area] in Urine sediment by Microscopy high power field",
        "spec": SPEC_URINE
    },
    "U01011305": {
        "loinc": "5782-8",
        "display": "Crystals [Type] in Urine sediment by Microscopy",
        "spec": SPEC_URINE
    },
    "U01011306": {
        "loinc": "5769-5",
        "display": "Bacteria [#/area] in Urine sediment by Microscopy high power field",
        "spec": SPEC_URINE
    },
    # TEST KEHAMILAN (HCG)
    "U0117": {
        "loinc": "2106-3",
        "display": "Choriogonadotropin (pregnancy test) [Presence] in Urine",
        "spec": SPEC_URINE
    },
    "U0118": {
        "loinc": "2106-3",
        "display": "Choriogonadotropin (pregnancy test) [Presence] in Urine",
        "spec": SPEC_URINE
    },
    "U0119": {
        "loinc": "19080-1",
        "display": "Choriogonadotropin [Units/volume] in Urine",
        "spec": SPEC_URINE
    },
    "U0136": {
        "loinc": "2106-3",
        "display": "Choriogonadotropin (pregnancy test) [Presence] in Urine",
        "spec": SPEC_URINE
    },
    "U0106": {
        "loinc": "14957-5",
        "display": "Microalbumin [Mass/volume] in Urine",
        "spec": SPEC_URINE
    },
    # NARKOBA 6 PARAMETER
    "U0144": {
        "loinc": "65750-2",
        "display": "Drug screen panel - Urine",
        "spec": SPEC_URINE
    },
    "U014401": {
        "loinc": "19343-3",
        "display": "Amphetamine [Presence] in Urine by Screen test",
        "spec": SPEC_URINE
    },
    "U014402": {
        "loinc": "14316-4",
        "display": "Benzodiazepines [Presence] in Urine by Screen test",
        "spec": SPEC_URINE
    },
    "U014403": {
        "loinc": "19295-5",
        "display": "Morphine [Presence] in Urine by Screen test",
        "spec": SPEC_URINE
    },
    "U014404": {
        "loinc": "19359-9",
        "display": "Cocaine [Presence] in Urine by Screen test",
        "spec": SPEC_URINE
    },
    "U014405": {
        "loinc": "20521-1",
        "display": "Methamphetamine [Presence] in Urine by Screen test",
        "spec": SPEC_URINE
    },
    "U014406": {
        "loinc": "19261-7",
        "display": "Cannabinoids [Presence] in Urine by Screen test",
        "spec": SPEC_URINE
    },

    # =========================================================================
    # 3. KIMIA KLINIK (SERUM)
    # =========================================================================
    # KOLESTEROL & PROFIL LIPID
    "K0301": {
        "loinc": "2093-3",
        "display": "Cholesterol [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "CHOL": {
        "loinc": "2093-3",
        "display": "Cholesterol [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0302": {
        "loinc": "2089-1",
        "display": "Cholesterol in LDL [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "LDL": {
        "loinc": "2089-1",
        "display": "Cholesterol in LDL [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0303": {
        "loinc": "2085-9",
        "display": "Cholesterol in HDL [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "HDL": {
        "loinc": "2085-9",
        "display": "Cholesterol in HDL [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0304": {
        "loinc": "2571-8",
        "display": "Triglyceride [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "TG": {
        "loinc": "2571-8",
        "display": "Triglyceride [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },

    # GLUKOSA DARAH & HBA1C
    "K0326": {
        "loinc": "1558-6",
        "display": "Fasting glucose [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "GDP": {
        "loinc": "1558-6",
        "display": "Fasting glucose [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0327": {
        "loinc": "1518-0",
        "display": "Glucose 2 hours post meal [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "GD2PP": {
        "loinc": "1518-0",
        "display": "Glucose 2 hours post meal [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0328": {
        "loinc": "2345-7",
        "display": "Glucose [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "GDS": {
        "loinc": "2345-7",
        "display": "Glucose [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0335": {
        "loinc": "4548-4",
        "display": "Hemoglobin A1c/Hemoglobin.total in Blood",
        "spec": SPEC_BLOOD
    },
    "HBA1C": {
        "loinc": "4548-4",
        "display": "Hemoglobin A1c/Hemoglobin.total in Blood",
        "spec": SPEC_BLOOD
    },

    # GINJAL & ASAM URAT
    "K0329": {
        "loinc": "2270-3",
        "display": "Urea [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "UR": {
        "loinc": "2270-3",
        "display": "Urea [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "UREUM": {
        "loinc": "2270-3",
        "display": "Urea [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0331": {
        "loinc": "2160-0",
        "display": "Creatinine [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "CR": {
        "loinc": "2160-0",
        "display": "Creatinine [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "KREAT": {
        "loinc": "2160-0",
        "display": "Creatinine [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0332": {
        "loinc": "3084-1",
        "display": "Urate [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "UA": {
        "loinc": "3084-1",
        "display": "Urate [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0356": {
        "loinc": "33914-3",
        "display": "Glomerular filtration rate/1.73 sq M.predicted",
        "spec": SPEC_SERUM
    },

    # HATI & FAAL HATI
    "K0307": {
        "loinc": "1920-8",
        "display": "Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0338": {
        "loinc": "1920-8",
        "display": "Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "AST": {
        "loinc": "1920-8",
        "display": "Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0308": {
        "loinc": "1742-6",
        "display": "Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0339": {
        "loinc": "1742-6",
        "display": "Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "ALT": {
        "loinc": "1742-6",
        "display": "Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0309": {
        "loinc": "2324-2",
        "display": "Gamma glutamyl transferase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "GGT": {
        "loinc": "2324-2",
        "display": "Gamma glutamyl transferase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0317": {
        "loinc": "1975-2",
        "display": "Bilirubin.total [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0318": {
        "loinc": "1968-7",
        "display": "Bilirubin.direct [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0319": {
        "loinc": "2885-2",
        "display": "Protein [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0321": {
        "loinc": "1751-7",
        "display": "Albumin [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "ALB": {
        "loinc": "1751-7",
        "display": "Albumin [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0322": {
        "loinc": "2342-4",
        "display": "Globulin [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0344": {
        "loinc": "6768-6",
        "display": "Alkaline phosphatase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0325": {
        "loinc": "2083-4",
        "display": "Cholinesterase [Enzymatic activity/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },

    # ELEKTROLIT
    "K0314": {
        "loinc": "2823-3",
        "display": "Potassium [Moles/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "KALIUM": {
        "loinc": "2823-3",
        "display": "Potassium [Moles/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0315": {
        "loinc": "2951-2",
        "display": "Sodium [Moles/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "NATRIUM": {
        "loinc": "2951-2",
        "display": "Sodium [Moles/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "K0316": {
        "loinc": "2075-0",
        "display": "Chloride [Moles/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "KLORIDA": {
        "loinc": "2075-0",
        "display": "Chloride [Moles/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },

    # =========================================================================
    # 4. IMUNOSEROLOGI & PENYAKIT MENULAR
    # =========================================================================
    # WIDAL
    "I0228": {
        "loinc": "23007-8",
        "display": "Salmonella antibody panel - Serum",
        "spec": SPEC_SERUM
    },
    "I022801": {
        "loinc": "23007-8",
        "display": "Salmonella enterica serovar Typhi O Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "W010101": {
        "loinc": "23007-8",
        "display": "Salmonella enterica serovar Typhi O Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "I022802": {
        "loinc": "23009-4",
        "display": "Salmonella enterica serovar Paratyphi A O Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "W010103": {
        "loinc": "23009-4",
        "display": "Salmonella enterica serovar Paratyphi A O Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "I022803": {
        "loinc": "23011-0",
        "display": "Salmonella enterica serovar Paratyphi B O Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "W010105": {
        "loinc": "23011-0",
        "display": "Salmonella enterica serovar Paratyphi B O Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "I022804": {
        "loinc": "23013-6",
        "display": "Salmonella enterica serovar Paratyphi C O Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "W010107": {
        "loinc": "23013-6",
        "display": "Salmonella enterica serovar Paratyphi C O Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "I022805": {
        "loinc": "23008-6",
        "display": "Salmonella enterica serovar Typhi H Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "W010102": {
        "loinc": "23008-6",
        "display": "Salmonella enterica serovar Typhi H Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "I022806": {
        "loinc": "23010-2",
        "display": "Salmonella enterica serovar Paratyphi A H Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "W010104": {
        "loinc": "23010-2",
        "display": "Salmonella enterica serovar Paratyphi A H Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "I022807": {
        "loinc": "23012-8",
        "display": "Salmonella enterica serovar Paratyphi B H Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "W010106": {
        "loinc": "23012-8",
        "display": "Salmonella enterica serovar Paratyphi B H Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "I022808": {
        "loinc": "23014-4",
        "display": "Salmonella enterica serovar Paratyphi C H Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },
    "W010108": {
        "loinc": "23014-4",
        "display": "Salmonella enterica serovar Paratyphi C H Ab [Titer] in Serum",
        "spec": SPEC_SERUM
    },

    # HEPATITIS & VIRUS
    "I0201": {
        "loinc": "5196-1",
        "display": "Hepatitis B virus surface Ag [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "HBSAG": {
        "loinc": "5196-1",
        "display": "Hepatitis B virus surface Ag [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "I0202": {
        "loinc": "5193-8",
        "display": "Hepatitis B virus surface Ab [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "I0203": {
        "loinc": "13955-0",
        "display": "Hepatitis C virus Ab [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "I0246": {
        "loinc": "75622-1",
        "display": "HIV 1 and 2 Ab [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "HIV": {
        "loinc": "75622-1",
        "display": "HIV 1 and 2 Ab [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "I0221": {
        "loinc": "20507-0",
        "display": "Reagin Ab [Presence] in Serum by VDRL",
        "spec": SPEC_SERUM
    },
    "VDRL": {
        "loinc": "20507-0",
        "display": "Reagin Ab [Presence] in Serum by VDRL",
        "spec": SPEC_SERUM
    },
    "I0219": {
        "loinc": "22587-0",
        "display": "Treponema pallidum Ab [Presence] in Serum by Hemagglutination",
        "spec": SPEC_SERUM
    },
    "TPHA": {
        "loinc": "22587-0",
        "display": "Treponema pallidum Ab [Presence] in Serum by Hemagglutination",
        "spec": SPEC_SERUM
    },

    # DENGUE
    "I0286": {
        "loinc": "68936-4",
        "display": "Dengue virus NS1 Ag and Ab panel - Serum",
        "spec": SPEC_SERUM
    },
    "I028601": {
        "loinc": "23521-8",
        "display": "Dengue virus IgG Ab [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "I028602": {
        "loinc": "23522-6",
        "display": "Dengue virus IgM Ab [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "I028603": {
        "loinc": "68936-4",
        "display": "Dengue virus NS1 Ag [Presence] in Serum",
        "spec": SPEC_SERUM
    },

    # TIROID
    "I0214": {
        "loinc": "3016-3",
        "display": "Thyrotropin [Units/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "TSH": {
        "loinc": "3016-3",
        "display": "Thyrotropin [Units/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "I0213": {
        "loinc": "2284-8",
        "display": "Thyroxine.free [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "FT4": {
        "loinc": "2284-8",
        "display": "Thyroxine.free [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "I0206": {
        "loinc": "3049-4",
        "display": "Triiodothyronine (T3) [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "I0207": {
        "loinc": "3026-2",
        "display": "Thyroxine (T4) [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },

    # INFLAMASI & REUMATIK
    "I0223": {
        "loinc": "1988-5",
        "display": "C reactive protein [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "CRP": {
        "loinc": "1988-5",
        "display": "C reactive protein [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "I0224": {
        "loinc": "20504-7",
        "display": "Streptolysin O Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "ASTO": {
        "loinc": "20504-7",
        "display": "Streptolysin O Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0227": {
        "loinc": "11572-5",
        "display": "Rheumatoid factor [Units/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },

    # TUMOR MARKER
    "I0230": {
        "loinc": "10334-1",
        "display": "Cancer Ag 125 [Units/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "I0229": {
        "loinc": "2039-6",
        "display": "Carcinoembryonic Ag [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "I0231": {
        "loinc": "17842-6",
        "display": "Cancer Ag 15-3 [Units/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "I0232": {
        "loinc": "24108-3",
        "display": "Cancer Ag 19-9 [Units/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "I0233": {
        "loinc": "1834-1",
        "display": "Alpha-1-fetoprotein [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },
    "I0234": {
        "loinc": "2857-1",
        "display": "Prostate specific Ag [Mass/volume] in Serum or Plasma",
        "spec": SPEC_SERUM
    },

    # COVID-19 & PCR
    "I0279": {
        "loinc": "94558-4",
        "display": "SARS-CoV-2 (COVID-19) Ag [Presence] in Respiratory specimen by Rapid immunoassay",
        "spec": SPEC_SWAB
    },
    "I027701": {
        "loinc": "94563-4",
        "display": "SARS-CoV-2 (COVID-19) IgM [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "I027702": {
        "loinc": "94564-2",
        "display": "SARS-CoV-2 (COVID-19) IgG [Presence] in Serum",
        "spec": SPEC_SERUM
    },
    "P010702": {
        "loinc": "94306-8",
        "display": "SARS-CoV-2 (COVID-19) N gene [Cycle Threshold #] in Specimen by NAA with probe detection",
        "spec": SPEC_SWAB
    },
    "P010703": {
        "loinc": "94559-2",
        "display": "SARS-CoV-2 (COVID-19) ORF1ab region [Cycle Threshold #] in Specimen by NAA with probe detection",
        "spec": SPEC_SWAB
    },

    # TORCH PANEL (Membersihkan spasi dan menyamakan display)
    "I0235": {
        "loinc": "22580-5",
        "display": "Toxoplasma gondii IgM Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0236": {
        "loinc": "22579-7",
        "display": "Toxoplasma gondii IgG Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0237": {
        "loinc": "25514-1",
        "display": "Rubella virus IgM Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0238": {
        "loinc": "25515-8",
        "display": "Rubella virus IgG Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0239": {
        "loinc": "22247-1",
        "display": "Cytomegalovirus IgM Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0240": {
        "loinc": "22246-3",
        "display": "Cytomegalovirus IgG Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0241": {
        "loinc": "26927-4",
        "display": "Herpes simplex virus 1 IgM Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0242": {
        "loinc": "26926-6",
        "display": "Herpes simplex virus 1 IgG Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0243": {
        "loinc": "26929-0",
        "display": "Herpes simplex virus 2 IgM Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },
    "I0244": {
        "loinc": "26928-2",
        "display": "Herpes simplex virus 2 IgG Ab [Units/volume] in Serum",
        "spec": SPEC_SERUM
    },

    # =========================================================================
    # 5. FESES, MIKROBIOLOGI, SPERMA
    # =========================================================================
    "F0101": {
        "loinc": "57777-5",
        "display": "Stool examination panel",
        "spec": SPEC_STOOL
    },
    "F010101": {
        "loinc": "56846-9",
        "display": "Consistency of Stool",
        "spec": SPEC_STOOL
    },
    "F010102": {
        "loinc": "5777-8",
        "display": "Color of Stool",
        "spec": SPEC_STOOL
    },
    "F010103": {
        "loinc": "57905-2",
        "display": "Hemoglobin.gastrointestinal [Presence] in Stool",
        "spec": SPEC_STOOL
    },
    "F010104": {
        "loinc": "5779-4",
        "display": "Mucus [Presence] in Stool",
        "spec": SPEC_STOOL
    },
    "M0101": {
        "loinc": "20508-8",
        "display": "Mycobacterium sp identified in Sputum by Acid fast stain",
        "spec": SPEC_SPUTUM
    },
    "M0119": {
        "loinc": "600-7",
        "display": "Bacteria identified in Blood by Culture",
        "spec": SPEC_BLOOD
    },
    "S0102": {
        "loinc": "54231-6",
        "display": "Spermatozoa morphology and motility panel - Semen",
        "spec": SPEC_SEMEN
    }
}


def authenticate_supabase():
    r_auth = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json={"email": "dedekurniasih@labutama.id", "password": "lab123456"},
        timeout=15
    )
    if r_auth.status_code != 200:
        raise RuntimeError(f"Gagal otentikasi Supabase: {r_auth.text}")
    token = r_auth.json()["access_token"]
    return {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def main():
    print("=================================================================")
    print("MEMULAI STANDARISASI KODE LOINC & SNOMED CT REF_LAB")
    print("=================================================================")
    headers = authenticate_supabase()
    print("[OK] Otentikasi Supabase Berhasil!")

    # 1. Fetch seluruh data ref_lab
    all_refs = []
    offset = 0
    limit = 500
    while True:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/ref_lab?select=id,kode,nama,kelompok,satuan,kode_loinc,display_loinc,kode_specimen,nama_specimen&offset={offset}&limit={limit}&order=id.asc",
            headers=headers,
            timeout=20
        )
        chunk = r.json()
        if not chunk:
            break
        all_refs.extend(chunk)
        offset += limit

    print(f"Total entri ref_lab terbaca di database: {len(all_refs)}")

    # 2. Proses pemetaan & pembersihan
    updates = []
    sudah_bersih = 0
    dipetakan_baru = 0
    dibersihkan_whitespace = 0

    for item in all_refs:
        kode = item.get("kode")
        existing_loinc = item.get("kode_loinc")
        existing_disp = item.get("display_loinc")
        existing_spec_code = item.get("kode_specimen")
        existing_spec_name = item.get("nama_specimen")

        # Cek apakah kode ada di kamus standar kita
        std = MASTER_STANDARDS.get(kode)

        target_loinc = None
        target_display = None
        target_spec_code = None
        target_spec_name = None

        if std:
            target_loinc = std["loinc"].strip()
            target_display = std["display"].strip()
            target_spec_code = std["spec"]["kode"]
            target_spec_name = std["spec"]["nama"]
            if not existing_loinc:
                dipetakan_baru += 1
        elif existing_loinc:
            # Bersihkan whitespace/newline jika ada di LOINC yang sudah ada
            cleaned = str(existing_loinc).strip()
            # Ganti \n atau spasi ganda
            cleaned = re.sub(r"\s+", "", cleaned)
            target_loinc = cleaned
            target_display = re.sub(r"\s+", " ", str(existing_disp or "")).strip() if existing_disp else item.get("nama")
            target_spec_code = existing_spec_code or "119364003"
            target_spec_name = existing_spec_name or "Serum specimen"

        # Cek apakah perlu update
        if target_loinc:
            perlu_update = False
            if existing_loinc != target_loinc:
                perlu_update = True
                dibersihkan_whitespace += 1
            if existing_disp != target_display:
                perlu_update = True
            if existing_spec_code != target_spec_code or existing_spec_name != target_spec_name:
                perlu_update = True

            if perlu_update:
                updates.append({
                    "id": item["id"],
                    "kode": kode,
                    "nama": item.get("nama"),
                    "kode_loinc": target_loinc,
                    "display_loinc": target_display,
                    "kode_specimen": target_spec_code,
                    "nama_specimen": target_spec_name
                })
            else:
                sudah_bersih += 1

    print(f"\n--- HASIL ANALISIS MAPPING ---")
    print(f"Total parameter yang akan di-update ke database: {len(updates)}")
    print(f"  - Dipetakan baru dari kamus standar Kemenkes : {dipetakan_baru}")
    print(f"  - Dibersihkan dari whitespace/format rusak   : {dibersihkan_whitespace}")
    print(f"  - Parameter yang sudah sesuai sebelumnya     : {sudah_bersih}")

    # 3. Eksekusi pembaruan ke Supabase (per batch 50 baris menggunakan PATCH id)
    print("\nMelakukan update ke Supabase...")
    berhasil = 0
    gagal = 0
    for u in updates:
        payload = {
            "kode_loinc": u["kode_loinc"],
            "display_loinc": u["display_loinc"],
            "kode_specimen": u["kode_specimen"],
            "nama_specimen": u["nama_specimen"]
        }
        r_patch = requests.patch(
            f"{SUPABASE_URL}/rest/v1/ref_lab?id=eq.{u['id']}",
            headers=headers,
            json=payload,
            timeout=10
        )
        if r_patch.status_code in [200, 204]:
            berhasil += 1
        else:
            gagal += 1
            print(f"Gagal update {u['kode']} ({u['nama']}): {r_patch.text}")

    print(f"[OK] Selesai update ref_lab: {berhasil} berhasil, {gagal} gagal.")

    # 4. Validasi Ulang ref_lab
    r_val = requests.get(
        f"{SUPABASE_URL}/rest/v1/ref_lab?kode_loinc=not.is.null&select=kode,nama,kode_loinc,display_loinc,kode_specimen&limit=1000",
        headers=headers
    )
    val_data = r_val.json()
    print(f"\n[OK] TOTAL PARAMETER DENGAN LOINC SAAT INI DI DATABASE: {len(val_data)}")

    print("\n--- CONTOH PARAMETER LAB KRUSIAL YANG KINI 100% TERPETAKAN ---")
    krusial_kodes = [
        "H010101", "H010102", "H010103", "H010104", "H010105", "H01010601",
        "H01010701", "H01010702", "H01010703", "H01010801",
        "HB", "LEU", "TRO", "HCT", "ERI",
        "K0301", "K0304", "K0332", "K0331", "K0326", "K0328", "K0307", "K0308", "K0335",
        "CHOL", "TG", "UA", "CR", "GDS", "GDP", "AST", "ALT",
        "U010101", "U010103", "U010104", "U010106", "U010107", "U01011301", "U01011302", "U0118",
        "I022801", "I022805", "I0201", "I0246", "I0221", "I0279", "I028603"
    ]
    val_map = {x["kode"]: x for x in val_data}
    for kc in krusial_kodes:
        if kc in val_map:
            v = val_map[kc]
            print(f"  [OK] [{v['kode']:10s}] {v['nama']:28s} -> LOINC: {v['kode_loinc']:10s} | {v.get('display_loinc', '')[:35]} (Spec: {v.get('kode_specimen')})")
        else:
            print(f"  [X] [{kc}] BELUM TERPETAKAN!")


if __name__ == "__main__":
    main()
