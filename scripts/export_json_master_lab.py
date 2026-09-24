import os
import json
import csv
import re

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
CSV_PATH = os.path.join(parent_dir, "data", "master_pemeriksaan_skylab.csv")
JSON_OUTPUT = os.path.join(parent_dir, "data", "master_pemeriksaan_skylab.json")

KELOMPOK_MAP = {
    "A": "Fisik & PA",
    "B": "Biomolekuler",
    "C": "Analisa Cairan",
    "E": "Elektromedik",
    "F": "Feses",
    "G": "Lainnya",
    "H": "Hematologi",
    "I": "Imunoserologi",
    "K": "Kimia Klinik",
    "M": "Mikrobiologi",
    "P": "PCR & Serologi",
    "R": "Radiologi",
    "S": "Sperma",
    "U": "Urinalisis",
    "W": "Widal Serologi",
}

NAMA_FIX = {
    "A01020301": "Protein Cairan Pleura",
    "A01020302": "Glukosa Cairan Pleura",
    "I022801": "S. Typhi O",
    "I022802": "S. Typhi H",
    "I022803": "S. Paratyphi A-O",
    "I022804": "S. Paratyphi A-H",
    "I022805": "S. Paratyphi B-O",
    "I022806": "S. Paratyphi B-H",
    "I022807": "S. Paratyphi C-O",
    "I022808": "S. Paratyphi C-H",
    "I024401": "S. Typhi O Set 2",
    "I024402": "S. Typhi H Set 2",
    "W010103": "S. Paratyphi A-O",
    "W010104": "S. Paratyphi A-H",
    "W010105": "S. Paratyphi B-O",
    "W010106": "S. Paratyphi B-H",
    "W010107": "S. Paratyphi C-O",
    "W010108": "S. Paratyphi C-H",
}

def to_float(val):
    if not val:
        return None
    val = str(val).strip().replace(",", ".")
    m = re.search(r"[-+]?\d*\.?\d+", val)
    if m:
        try:
            return float(m.group(0))
        except ValueError:
            return None
    return None

def bersihkan_teks(val):
    if not val:
        return ""
    val = str(val).strip()
    val = re.sub(r"[\r\n\t]+", " ", val)
    val = re.sub(r"\s+", " ", val)
    return val.strip()

def main():
    with open(CSV_PATH, mode="r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f, delimiter=";")
        header = next(reader)
        rows = list(reader)

    result = []

    for r in rows:
        if not r or len(r) < 3:
            continue
        kode = bersihkan_teks(r[0])
        if not kode:
            continue

        urutan_str = bersihkan_teks(r[1])
        try:
            urutan = int(urutan_str) if urutan_str.isdigit() else 0
        except ValueError:
            urutan = 0

        nama = bersihkan_teks(r[2])
        if kode in NAMA_FIX:
            nama = NAMA_FIX[kode]
        if not nama or nama == "#NAME?":
            continue

        loinc = bersihkan_teks(r[3]) if len(r) > 3 else None
        loinc_display = bersihkan_teks(r[4]) if len(r) > 4 else None
        spec_code = bersihkan_teks(r[5]) if len(r) > 5 else None
        spec_name = bersihkan_teks(r[6]) if len(r) > 6 else None
        unit = bersihkan_teks(r[7]) if len(r) > 7 else None
        normal_teks = bersihkan_teks(r[8]) if len(r) > 8 else None
        min_norm = to_float(r[9]) if len(r) > 9 else None
        max_norm = to_float(r[10]) if len(r) > 10 else None
        min_l = to_float(r[11]) if len(r) > 11 else None
        max_l = to_float(r[12]) if len(r) > 12 else None
        min_p = to_float(r[13]) if len(r) > 13 else None
        max_p = to_float(r[14]) if len(r) > 14 else None
        norm_l = bersihkan_teks(r[15]) if len(r) > 15 else None
        norm_p = bersihkan_teks(r[16]) if len(r) > 16 else None
        barcode = bersihkan_teks(r[17]) if len(r) > 17 else None
        remarks = bersihkan_teks(r[18]) if len(r) > 18 else None
        method = bersihkan_teks(r[19]) if len(r) > 19 else None

        # Fallback standar medis
        nama_low = nama.lower()
        if "mcv" in nama_low and min_norm is None and min_l is None:
            min_norm, max_norm = 80.0, 96.0
            normal_teks = "80 - 96"
            unit = "fl"
        elif "mch" in nama_low and "mchc" not in nama_low and min_norm is None and min_l is None:
            min_norm, max_norm = 27.0, 31.0
            normal_teks = "27 - 31"
            unit = "pg"
        elif "mchc" in nama_low and min_norm is None and min_l is None:
            min_norm, max_norm = 32.0, 36.0
            normal_teks = "32 - 36"
            unit = "g/dl"
        elif "rdw" in nama_low and min_norm is None and min_l is None:
            min_norm, max_norm = 11.5, 14.5
            normal_teks = "11.5 - 14.5"
            unit = "%"
        elif "leukosit" in nama_low and min_norm is None and min_l is None:
            min_l, max_l, min_p, max_p = 5.0, 10.0, 5.0, 10.0
            norm_l, norm_p = "5.0 - 10.0", "5.0 - 10.0"
            unit = "10^3/pl"
        elif "trombosit" in nama_low and min_norm is None and min_l is None:
            min_l, max_l, min_p, max_p = 150.0, 450.0, 150.0, 450.0
            norm_l, norm_p = "150 - 450", "150 - 450"
            unit = "10^3/pl"
        elif "hemoglobin" in nama_low and min_l is None:
            min_l, max_l, min_p, max_p = 14.0, 18.0, 12.0, 16.0
            norm_l, norm_p = "14.0 - 18.0", "12.0 - 16.0"
            unit = "g/dl"
        elif "kolesterol total" in nama_low and max_norm is None:
            min_norm, max_norm = 0.0, 200.0
            normal_teks = "< 200"
            unit = "mg/dl"
        elif "trigliserida" in nama_low and max_norm is None:
            min_norm, max_norm = 0.0, 150.0
            normal_teks = "< 150"
            unit = "mg/dl"
        elif "hdl" in nama_low and min_l is None:
            min_l, max_l, min_p, max_p = 40.0, 60.0, 50.0, 60.0
            norm_l, norm_p = "> 40", "> 50"
            unit = "mg/dl"
        elif "ldl" in nama_low and max_norm is None:
            min_norm, max_norm = 0.0, 100.0
            normal_teks = "< 100"
            unit = "mg/dl"
        elif "asam urat" in nama_low and min_l is None:
            min_l, max_l, min_p, max_p = 3.4, 7.0, 2.4, 5.7
            norm_l, norm_p = "3.4 - 7.0", "2.4 - 5.7"
            unit = "mg/dl"
        elif "gds" in nama_low or "sewaktu" in nama_low:
            if max_norm is None:
                min_norm, max_norm = 0.0, 140.0
                normal_teks = "< 140"
                unit = "mg/dl"

        kelompok = KELOMPOK_MAP.get(kode[0].upper(), "Lainnya")

        punya_angka = any([
            min_norm is not None, max_norm is not None,
            min_l is not None, max_l is not None,
            min_p is not None, max_p is not None
        ])
        unit_angka = bool(unit and re.search(r"g/dl|mg/dl|10\^|%|fl|pg|u/l|mmol|detik|menit|mm|sel", unit, re.I))

        if punya_angka or unit_angka:
            jenis_nilai = "ANGKA"
        elif re.search(r"golongan darah|rhesus", nama_low):
            jenis_nilai = "PILIHAN"
        else:
            jenis_nilai = "TEKS"

        pilihan = None
        if "golongan darah" in nama_low:
            pilihan = ["A", "B", "AB", "O"]
        elif "rhesus" in nama_low:
            pilihan = ["Positif (+)", "Negatif (-)"]

        teks_normal_db = normal_teks
        if not teks_normal_db:
            if norm_l and norm_p:
                teks_normal_db = f"L: {norm_l} | P: {norm_p}"
            elif norm_l:
                teks_normal_db = norm_l

        desimal = 1 if jenis_nilai == "ANGKA" else 0

        rujukan_list = []
        if min_l is not None or max_l is not None or norm_l:
            teks_l = norm_l or (f"{min_l} - {max_l}" if min_l and max_l else None)
            rujukan_list.append({
                "jenis_kelamin": "L",
                "batas_bawah": min_l,
                "batas_atas": max_l,
                "teks": teks_l
            })

        if min_p is not None or max_p is not None or norm_p:
            teks_p = norm_p or (f"{min_p} - {max_p}" if min_p and max_p else None)
            rujukan_list.append({
                "jenis_kelamin": "P",
                "batas_bawah": min_p,
                "batas_atas": max_p,
                "teks": teks_p
            })

        if (min_norm is not None or max_norm is not None or normal_teks) and min_l is None and min_p is None:
            teks_gen = normal_teks or (f"{min_norm} - {max_norm}" if min_norm and max_norm else None)
            rujukan_list.append({
                "jenis_kelamin": None,
                "batas_bawah": min_norm,
                "batas_atas": max_norm,
                "teks": teks_gen
            })

        result.append({
            "kode": kode,
            "nama": nama,
            "kelompok": kelompok,
            "satuan": unit,
            "jenis_nilai": jenis_nilai,
            "pilihan": pilihan,
            "teks_normal": teks_normal_db,
            "desimal": desimal,
            "kode_loinc": loinc,
            "display_loinc": loinc_display,
            "kode_specimen": spec_code,
            "nama_specimen": spec_name,
            "urutan": urutan,
            "barcode": barcode,
            "janji_hasil": remarks,
            "metode": method,
            "rujukan": rujukan_list
        })

    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(f"File JSON berhasil dibuat: {JSON_OUTPUT} dengan {len(result)} item.")

if __name__ == "__main__":
    main()
