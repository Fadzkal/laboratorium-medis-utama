"""
=============================================================================
KAMUS PENERJEMAH PARAMETER ALAT MEDIS KE SISTEM LABORATORIUM
=============================================================================
Memetakan parameter dari:
1. Mindray BS-240 (Kimia Darah)
2. Sysmex XP-100 (Hematologi)
3. Arkray Adams HA-8380V (HbA1c HPLC)
ke nama dan kode pemeriksaan pada database (ref_lab / lab_hasil).
=============================================================================
"""

import re

# ---------------------------------------------------------------------------
# 1. PETA PARAMETER MINDRAY BS-240 (KIMIA KLINIK)
# ---------------------------------------------------------------------------
# Format: kode_alat / singkatan -> daftar alias nama di database klinik
MINDRAY_MAPPING = {
    # Glukosa
    "GLU-S": ["Glukosa Darah Sewaktu", "Glukosa Darah Puasa", "Glukosa Darah 2 Jam PP", "Glukosa", "GDS", "GDP", "GD2PP"],
    "GLU": ["Glukosa Darah Sewaktu", "Glukosa Darah Puasa", "Glukosa Darah 2 Jam PP", "Glukosa"],
    "GLUCOSE": ["Glukosa Darah Sewaktu", "Glukosa Darah Puasa", "Glukosa Darah 2 Jam PP", "Glukosa"],
    
    # Profil Lipid
    "TC": ["Cholesterol Total", "Kolesterol Total"],
    "CHOL": ["Cholesterol Total", "Kolesterol Total"],
    "CHOLESTEROL": ["Cholesterol Total", "Kolesterol Total"],
    
    "TG": ["Trigliserida", "Triglyceride"],
    "TRIG": ["Trigliserida", "Triglyceride"],
    "TRIGLYCERIDE": ["Trigliserida", "Triglyceride"],
    
    "HDL-C": ["Cholesterol HDL", "HDL Kolesterol", "HDL"],
    "HDL": ["Cholesterol HDL", "HDL Kolesterol"],
    
    "LDL-C": ["Cholesterol LDL", "LDL Kolesterol", "LDL"],
    "LDL": ["Cholesterol LDL", "LDL Kolesterol"],
    
    # Fungsi Ginjal
    "UA": ["Asam Urat", "Uric Acid"],
    "URIC ACID": ["Asam Urat", "Uric Acid"],
    
    "UREA": ["Ureum", "Urea", "BUN"],
    "UREUM": ["Ureum", "Urea"],
    "BUN": ["Ureum", "BUN"],
    
    "CREA-S": ["Creatinin", "Kreatinin", "Creatinine"],
    "CREA": ["Creatinin", "Kreatinin", "Creatinine"],
    "CREATININE": ["Creatinin", "Kreatinin", "Creatinine"],
    
    # Fungsi Hati
    "AST": ["SGOT", "SGOT (AST)", "AST"],
    "SGOT": ["SGOT", "SGOT (AST)"],
    
    "ALT": ["SGPT", "SGPT (ALT)", "ALT"],
    "SGPT": ["SGPT", "SGPT (ALT)"],
    
    # Protein & Bilirubin
    "TBIL": ["Bilirubin Total", "Total Bilirubin"],
    "DBIL": ["Bilirubin Direk", "Direct Bilirubin"],
    "TP": ["Protein Total", "Total Protein"],
    "ALB": ["Albumin"]
}

# ---------------------------------------------------------------------------
# 2. PETA PARAMETER SYSMEX XP-100 (HEMATOLOGI)
# ---------------------------------------------------------------------------
SYSMEX_MAPPING = {
    # Parameter Utama
    "WBC": ["Leukosit", "Jumlah Sel Leukosit", "Jumlah Leukosit", "WBC"],
    "RBC": ["Eritrosit", "Jumlah Sel Eritrosit", "Jumlah Eritrosit", "RBC"],
    "HGB": ["Hemoglobin", "HB", "HGB"],
    "HB":  ["Hemoglobin", "HB", "HGB"],
    "HCT": ["Hematokrit", "HCT", "PCV"],
    "PLT": ["Trombosit", "Jumlah Trombosit", "PLT"],
    
    # Indeks Eritrosit
    "MCV": ["MCV"],
    "MCH": ["MCH"],
    "MCHC": ["MCHC"],
    "RDW-CV": ["RDW-CV", "RDW_CV", "RDW"],
    "RDW-SD": ["RDW-SD", "RDW_SD"],
    
    # Hitung Jenis Leukosit (Diff Count 3-Part)
    "LYM%": ["Limfosit", "Lymposit", "LYM%", "LYM"],
    "LYMPH%": ["Limfosit", "Lymposit", "LYM%"],
    "NEUT%": ["Neutrofil", "Segmen", "GRAN%", "NEUT%"],
    "GRAN%": ["Neutrofil", "Segmen", "GRAN%"],
    "MXD%": ["Monosit", "MXD%", "MONO%"],
    
    # Nilai Absolut (Bila Ada)
    "LYM#": ["Limfosit Absolut", "LYM#"],
    "NEUT#": ["Neutrofil Absolut", "GRAN#", "NEUT#"],
    "GRAN#": ["Neutrofil Absolut", "GRAN#"],
    "MXD#": ["Monosit Absolut", "MXD#"]
}

# ---------------------------------------------------------------------------
# 3. PETA PARAMETER ARKRAY ADAMS HA-8380V (HBA1C HPLC)
# ---------------------------------------------------------------------------
ARKRAY_MAPPING = {
    "HBA1C": ["HbA 1C", "HbA1c", "Hemoglobin A1c", "HBA1C"],
    "A1C": ["HbA 1C", "HbA1c", "Hemoglobin A1c"]
}

# ---------------------------------------------------------------------------
# 4. PETA PARAMETER WONDFO III PLUS (POCT / FLUORESCENCE IMMUNOASSAY)
# ---------------------------------------------------------------------------
WONDFO_MAPPING = {
    "MAU": ["Mikroalbumin Urin (MAU)", "Mikroalbumin Urin", "Mikroalbumin", "Microalbumin", "MAU"],
    "MICROALBUMIN": ["Mikroalbumin Urin (MAU)", "Mikroalbumin Urin", "Mikroalbumin", "Microalbumin", "MAU"],
    "M-ALB": ["Mikroalbumin Urin (MAU)", "Mikroalbumin Urin", "Mikroalbumin", "Microalbumin", "MAU"]
}


def normalize_code(raw_code: str) -> str:
    """Membersihkan kode/nama tes dari simbol tak perlu"""
    if not raw_code:
        return ""
    # Hapus spasi berlebih, ubah ke uppercase
    s = str(raw_code).strip().upper()
    # Bersihkan nama panjang seperti 'GLUCOSE (GOD-POD METHOD)' -> 'GLUCOSE'
    m = re.match(r"^([A-Z0-9_\-\%]+)", s)
    if m:
        return m.group(1)
    return s


def find_matching_test(raw_code: str, instrument_type: str, candidate_names: list) -> str:
    """
    Mencari nama pemeriksaan di database yang cocok dengan kode dari alat.
    instrument_type: 'MINDRAY', 'SYSMEX', 'ARKRAY', atau 'WONDFO'
    candidate_names: daftar nama tes di lab_hasil pasien yang sedang diperiksa
    """
    clean_code = normalize_code(raw_code)
    
    # Pilih kamus sesuai alat
    if instrument_type.upper().startswith("MINDRAY"):
        mapping = MINDRAY_MAPPING
    elif instrument_type.upper().startswith("SYSMEX"):
        mapping = SYSMEX_MAPPING
    elif instrument_type.upper().startswith("ARKRAY"):
        mapping = ARKRAY_MAPPING
    elif instrument_type.upper().startswith("WONDFO"):
        mapping = WONDFO_MAPPING
    else:
        mapping = {**MINDRAY_MAPPING, **SYSMEX_MAPPING, **ARKRAY_MAPPING, **WONDFO_MAPPING}
        
    aliases = mapping.get(clean_code, [])
    
    # 1. Coba pencocokan presisi dengan alias yang didefinisikan
    for cand in candidate_names:
        cand_clean = cand.strip().lower()
        # Jika nama kandidat persis ada di daftar alias
        for alias in aliases:
            if alias.lower() == cand_clean:
                return cand
                
    # 2. Coba pencocokan parsial/substring
    for cand in candidate_names:
        cand_clean = cand.strip().lower()
        for alias in aliases:
            if alias.lower() in cand_clean or cand_clean in alias.lower():
                return cand
                
    # 3. Fallback: jika nama kandidat mengandung kode langsung
    for cand in candidate_names:
        if clean_code.lower() == cand.strip().lower():
            return cand

    return None
