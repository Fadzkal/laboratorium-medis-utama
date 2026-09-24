"""
Skrip Impor dan Standardisasi Master Data Pemeriksaan Laboratorium
Membaca data/master_pemeriksaan_skylab.csv, menyempurnakan dengan standar medis,
dan menyimpannya ke tabel ref_lab dan ref_lab_rujukan di Supabase.
"""

import os
import sys
import csv
import re
import requests

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.join(parent_dir, "bridge"))

from config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

KEY = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_ANON_KEY
HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

CSV_PATH = os.path.join(parent_dir, "data", "master_pemeriksaan_skylab.csv")

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

# Perbaikan nama pemeriksaan yang sebelumnya #NAME? di file Excel asal
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
    # Ambil angka pertama
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
    if not os.path.exists(CSV_PATH):
        print(f"Error: File CSV {CSV_PATH} tidak ditemukan.")
        return

    print("=== MEMBACA CSV DAN MENYIAPKAN DATA MASTER LAB ===")
    with open(CSV_PATH, mode="r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f, delimiter=";")
        header = next(reader)
        rows = list(reader)

    print(f"Total baris di CSV: {len(rows)}")

    daftar_lab = []
    daftar_rujukan = []

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

        # Perbaikan standar medis bila ada data kosong di tes kuantitatif penting
        nama_low = nama.lower()
        if "mcv" in nama_low and (min_norm is None and min_l is None):
            min_norm, max_norm = 80.0, 96.0
            normal_teks = "80 - 96"
            unit = "fl"
        elif "mch" in nama_low and "mchc" not in nama_low and (min_norm is None and min_l is None):
            min_norm, max_norm = 27.0, 31.0
            normal_teks = "27 - 31"
            unit = "pg"
        elif "mchc" in nama_low and (min_norm is None and min_l is None):
            min_norm, max_norm = 32.0, 36.0
            normal_teks = "32 - 36"
            unit = "g/dl"
        elif "rdw" in nama_low and (min_norm is None and min_l is None):
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

        # Tentukan kelompok
        kelompok = KELOMPOK_MAP.get(kode[0].upper(), "Lainnya")

        # Tentukan jenis_nilai
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

        # Pilihan jika jenis_nilai = PILIHAN
        pilihan = None
        if "golongan darah" in nama_low:
            pilihan = ["A", "B", "AB", "O"]
        elif "rhesus" in nama_low:
            pilihan = ["Positif (+)", "Negatif (-)"]

        # Teks normal
        teks_normal_db = None
        if normal_teks:
            teks_normal_db = normal_teks
        elif norm_l and norm_p:
            teks_normal_db = f"L: {norm_l} | P: {norm_p}"
        elif norm_l:
            teks_normal_db = norm_l

        item_lab = {
            "kode": kode,
            "nama": nama,
            "kelompok": kelompok,
            "satuan": unit if unit else None,
            "jenis_nilai": jenis_nilai,
            "pilihan": pilihan,
            "teks_normal": teks_normal_db,
            "desimal": 1 if jenis_nilai == "ANGKA" else 0,
            "kode_loinc": loinc if loinc else None,
            "urutan": urutan,
            "barcode": barcode if barcode else None,
            "janji_hasil": remarks if remarks else None,
            "metode": method if method else None,
            "aktif": True,
            # Data temporary untuk rujukan
            "_min_norm": min_norm,
            "_max_norm": max_norm,
            "_min_l": min_l,
            "_max_l": max_l,
            "_min_p": min_p,
            "_max_p": max_p,
            "_norm_l": norm_l,
            "_norm_p": norm_p,
            "_normal_teks": normal_teks
        }
        daftar_lab.append(item_lab)

    print(f"Total parameter lab yang siap diimpor: {len(daftar_lab)}")

    # Update ref_lab ke Supabase dengan bulk upsert on_conflict=kode
    url_ref_lab = f"{SUPABASE_URL.rstrip('/')}/rest/v1/ref_lab?on_conflict=kode"
    
    print(f"Menyimpan {len(daftar_lab)} entri ke ref_lab...", flush=True)
    payload_list = []
    for it in daftar_lab:
        payload_list.append({
            "kode": it["kode"],
            "nama": it["nama"],
            "kelompok": it["kelompok"],
            "satuan": it["satuan"],
            "jenis_nilai": it["jenis_nilai"],
            "pilihan": it["pilihan"],
            "teks_normal": it["teks_normal"],
            "desimal": it["desimal"],
            "kode_loinc": it["kode_loinc"],
            "urutan": it["urutan"],
            "aktif": it["aktif"]
        })

    # Chunk per 50 entri
    chunk_size = 50
    for i in range(0, len(payload_list), chunk_size):
        chunk = payload_list[i:i + chunk_size]
        r = requests.post(url_ref_lab, headers=HEADERS, json=chunk)
        if r.status_code not in (200, 201):
            print(f"Peringatan chunk {i}: {r.status_code} - {r.text}", flush=True)

    print("Ref_lab selesai di-upsert. Mengambil ID terbaru...", flush=True)
    r_exist = requests.get(f"{SUPABASE_URL.rstrip('/')}/rest/v1/ref_lab?select=id,kode", headers=HEADERS)
    existing_map = {}
    if r_exist.status_code == 200:
        for it in r_exist.json():
            existing_map[it["kode"]] = it["id"]
    print(f"Total ref_lab tersinkronisasi: {len(existing_map)} entri.", flush=True)

    # Simpan Nilai Rujukan ke ref_lab_rujukan
    print("\n=== MEMPERBARUI NILAI RUJUKAN (ref_lab_rujukan) ===")
    url_rujukan = f"{SUPABASE_URL.rstrip('/')}/rest/v1/ref_lab_rujukan"

    # Bersihkan rujukan lama untuk kode yang ada di CSV agar tidak duplikat
    valid_ids = [existing_map[k] for k in existing_map if k in [it["kode"] for it in daftar_lab]]
    print(f"Menyiapkan rujukan untuk {len(valid_ids)} pemeriksaan...")

    batch_rujukan = []
    for it in daftar_lab:
        lid = existing_map.get(it["kode"])
        if not lid:
            continue

        # Kasus 1: Punya rujukan gender spesifik L & P
        if it["_min_l"] is not None or it["_max_l"] is not None or it["_norm_l"]:
            teks_l = it["_norm_l"] or (f"{it['_min_l']} - {it['_max_l']}" if it["_min_l"] and it["_max_l"] else None)
            batch_rujukan.append({
                "lab_id": lid,
                "jenis_kelamin": "L",
                "batas_bawah": it["_min_l"],
                "batas_atas": it["_max_l"],
                "teks": teks_l
            })

        if it["_min_p"] is not None or it["_max_p"] is not None or it["_norm_p"]:
            teks_p = it["_norm_p"] or (f"{it['_min_p']} - {it['_max_p']}" if it["_min_p"] and it["_max_p"] else None)
            batch_rujukan.append({
                "lab_id": lid,
                "jenis_kelamin": "P",
                "batas_bawah": it["_min_p"],
                "batas_atas": it["_max_p"],
                "teks": teks_p
            })

        # Kasus 2: Punya rujukan umum (tanpa gender)
        if it["_min_norm"] is not None or it["_max_norm"] is not None or it["_normal_teks"]:
            # Jika sudah diisi di L & P, tidak perlu isi umum kecuali berbeda
            if it["_min_l"] is None and it["_min_p"] is None:
                teks_gen = it["_normal_teks"] or (f"{it['_min_norm']} - {it['_max_norm']}" if it["_min_norm"] and it["_max_norm"] else None)
                batch_rujukan.append({
                    "lab_id": lid,
                    "jenis_kelamin": None,
                    "batas_bawah": it["_min_norm"],
                    "batas_atas": it["_max_norm"],
                    "teks": teks_gen
                })

    print(f"Total baris rujukan yang akan disimpan: {len(batch_rujukan)}")

    # Simpan dalam batch 50 baris
    chunk_size = 50
    total_ruj_tersimpan = 0
    for i in range(0, len(batch_rujukan), chunk_size):
        chunk = batch_rujukan[i:i + chunk_size]
        r_ruj = requests.post(url_rujukan, headers=HEADERS, json=chunk)
        if r_ruj.status_code in (200, 201):
            total_ruj_tersimpan += len(chunk)
        else:
            print(f"Gagal simpan batch rujukan {i}: {r_ruj.status_code} - {r_ruj.text}")

    print(f"SELESAI: {total_ruj_tersimpan} baris nilai rujukan berhasil disimpan ke database.")

if __name__ == "__main__":
    main()
