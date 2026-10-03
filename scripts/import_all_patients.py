"""
================================================================================
IMPORT & DEDUPLIKASI PASIEN MULTI-TAHUN (2019, 2020, 2021, 2022, 2023)
LABORATORIUM MEDIS UTAMA PURBALINGGA
================================================================================
"""

import os
import sys
import re
import time
import csv
import hashlib
import requests
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "http://187.53.142.245:8001"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0."
    "dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
)
AUTH_EMAIL = "dedekurniasih@labutama.id"
AUTH_PASS = "lab123456"

print("1. Melakukan autentikasi ke database Supabase...")
r_auth = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    json={"email": AUTH_EMAIL, "password": AUTH_PASS},
    timeout=15
)
if r_auth.status_code != 200:
    print(f"[GAGAL] Login gagal: {r_auth.status_code} {r_auth.text}")
    sys.exit(1)

token = r_auth.json()["access_token"]
headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
print("   [OK] Berhasil login sebagai Master.")

print("\n2. Memuat indeks seluruh pasien eksisting dari Supabase...")
existing_by_rm = {}
existing_by_nik = {}
existing_by_namedob = {}

offset = 0
limit = 1000
while True:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/pasien?select=id,no_rm,nama,nik,no_bpjs,tanggal_lahir,alamat&offset={offset}&limit={limit}",
        headers=headers,
        timeout=30
    )
    if r.status_code != 200:
        print(f"[GAGAL] Gagal mengambil pasien: {r.status_code} {r.text}")
        sys.exit(1)
    rows = r.json()
    if not rows:
        break
    for p in rows:
        pid = p['id']
        rm = (p.get('no_rm') or '').strip()
        nik = (p.get('nik') or '').strip()
        nama = (p.get('nama') or '').strip()
        dob = (p.get('tanggal_lahir') or '').strip()
        
        if rm: existing_by_rm[rm] = p
        if nik: existing_by_nik[nik] = p
        if nama and dob:
            clean_n = re.sub(r'\s+', ' ', nama.upper())
            existing_by_namedob[(clean_n, dob)] = p
            
    offset += len(rows)
    if len(rows) < limit:
        break

print(f"   [OK] Total pasien eksisting di Supabase: {len(existing_by_rm)}")

bulan_map = {
    'januari': '01', 'jan': '01', 'februari': '02', 'feb': '02', 'maret': '03', 'mar': '03',
    'april': '04', 'apr': '04', 'mei': '05', 'may': '05', 'juni': '06', 'jun': '06',
    'juli': '07', 'jul': '07', 'agustus': '08', 'agu': '08', 'september': '09',
    'sep': '09', 'oktober': '10', 'okt': '10', 'oct': '10', 'november': '11', 'nov': '11',
    'desember': '12', 'des': '12', 'dec': '12'
}

def clean_val(val):
    if not val: return ''
    return val.strip().strip('"\'\t \r\n').strip()

def parse_date(s):
    if not s: return None
    s_clean = clean_val(s).lower()
    parts = re.split(r'[-\s/]+', s_clean)
    if len(parts) >= 3:
        d = parts[0].zfill(2)
        m = bulan_map.get(parts[1], parts[1].zfill(2))
        y = parts[2]
        if len(y) == 2:
            y = ('19' if int(y) > 30 else '20') + y
        if len(y) == 4 and m.isdigit() and d.isdigit():
            if 1 <= int(d) <= 31 and 1 <= int(m) <= 12 and 1900 <= int(y) <= 2026:
                return f"{y}-{m}-{d}"
    return None

def extract_title_and_clean_name(raw_name):
    raw = clean_val(raw_name)
    titles = ['sdri.', 'sdra.', 'tn.', 'ny.', 'an.', 'by.', 'sdri', 'sdra', 'tn', 'ny', 'an', 'by']
    found_title = None
    clean_n = raw
    for t in titles:
        pattern = r'^' + re.escape(t) + r'\s+'
        if re.match(pattern, raw, re.IGNORECASE):
            found_title = t.capitalize().replace('.', '') + '.'
            clean_n = re.sub(pattern, '', raw, flags=re.IGNORECASE).strip()
            break
    clean_n = re.sub(r'\s+', ' ', clean_n).strip()
    return found_title, clean_n

def uuid_from_str(s):
    h = hashlib.md5(s.encode('utf-8')).hexdigest()
    return f"{h[:8]}-{h[8:12]}-4{h[13:16]}-a{h[17:20]}-{h[20:32]}"

csv_files = [
    ("2019", r"c:\lab_utama\hasil_lab_2019_NIK_utuh_9248_pasien.csv"),
    ("2020", r"c:\lab_utama\hasil_lab_2020_NIK_utuh_10614_pasien.csv"),
    ("2022", r"c:\lab_utama\hasil_lab_2022_NIK_utuh_13918_pasien.csv"),
    ("2023", r"c:\lab_utama\hasil_lab_2023_NIK_utuh_9175_pasien.csv"),
]

new_patients_to_insert = {}
existing_updates = {}
seen_rm_in_run = set(existing_by_rm.keys())

for year, path in csv_files:
    if not os.path.exists(path):
        print(f"[SKIP] File {path} tidak ditemukan.")
        continue
    print(f"\n3. Memproses deduplikasi pasien dari {year}: {os.path.basename(path)}...")
    count_year_new = 0
    count_year_match = 0
    with open(path, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f, delimiter=';')
        header = next(reader)
        for row in reader:
            if len(row) < 12: continue
            raw_name = clean_val(row[1])
            no_rm = clean_val(row[2])
            nik_raw = clean_val(row[3])
            gender_raw = clean_val(row[4])
            dob_raw = clean_val(row[5])
            alamat = clean_val(row[7])
            instansi = clean_val(row[11])
            
            if not raw_name: continue
            
            title, c_name = extract_title_and_clean_name(raw_name)
            digits = re.sub(r'\D', '', nik_raw)
            valid_nik = digits if len(digits) == 16 else None
            valid_bpjs = digits if (len(digits) == 13 and digits.startswith('00')) else None
            dob = parse_date(dob_raw)
            gender = 'P' if 'perempuan' in gender_raw.lower() else 'L'
            
            # Cek kecocokan dengan eksisting di database
            match = None
            if no_rm and no_rm in existing_by_rm:
                match = existing_by_rm[no_rm]
            elif valid_nik and valid_nik in existing_by_nik:
                match = existing_by_nik[valid_nik]
            elif c_name and dob and (c_name.upper(), dob) in existing_by_namedob:
                match = existing_by_namedob[(c_name.upper(), dob)]
                
            if match:
                count_year_match += 1
                pid = match['id']
                patch_data = {}
                if valid_bpjs and not match.get('no_bpjs'):
                    patch_data['no_bpjs'] = valid_bpjs
                    match['no_bpjs'] = valid_bpjs
                if valid_nik and not match.get('nik'):
                    patch_data['nik'] = valid_nik
                    match['nik'] = valid_nik
                if alamat and not match.get('alamat'):
                    patch_data['alamat'] = alamat
                    match['alamat'] = alamat
                if patch_data:
                    existing_updates[pid] = patch_data
                continue
                
            # Pasien baru: cek apakah sudah dicatat dalam run ini
            if no_rm and no_rm in new_patients_to_insert:
                p_obj = new_patients_to_insert[no_rm]
                if valid_bpjs and not p_obj.get('no_bpjs'):
                    p_obj['no_bpjs'] = valid_bpjs
                if valid_nik and not p_obj.get('nik'):
                    p_obj['nik'] = valid_nik
                continue
                
            if valid_nik and valid_nik in existing_by_nik:
                continue
                
            # Tambahkan sebagai pasien baru
            count_year_new += 1
            assigned_rm = no_rm or f"RM-{len(seen_rm_in_run) + 1:06d}"
            seen_rm_in_run.add(assigned_rm)
            p_id = uuid_from_str(f"PASIEN_{assigned_rm}_{c_name.upper()}")
            
            p_new = {
                'id': p_id,
                'no_rm': assigned_rm,
                'title': title,
                'nama': c_name,
                'nik': valid_nik,
                'no_bpjs': valid_bpjs,
                'jenis_kelamin': gender,
                'tanggal_lahir': dob or '2000-01-01',
                'alamat': alamat or None,
                'bagian': instansi or None,
                'plant': instansi or None,
                'aktif': True
            }
            new_patients_to_insert[assigned_rm] = p_new
            existing_by_rm[assigned_rm] = p_new
            if valid_nik: existing_by_nik[valid_nik] = p_new
            if c_name and dob: existing_by_namedob[(c_name.upper(), dob)] = p_new
            
    print(f"   [OK] Tahun {year}: {count_year_match} pasien terduplikasi/terhubung, {count_year_new} pasien baru terdaftar.")

print(f"\n=======================================================")
print(f"TOTAL PASIEN BARU YANG AKAN DI-UPLOAD : {len(new_patients_to_insert)}")
print(f"TOTAL PASIEN EKSISTING DIPERBARUI    : {len(existing_updates)}")
print(f"=======================================================")

# 4. Upload Update Pasien Eksisting (jika ada NIK/BPJS baru)
if existing_updates:
    print(f"\n4. Memperbarui {len(existing_updates)} pasien eksisting dengan NIK/BPJS/Alamat lengkap...")
    sukses_up = 0
    for pid, patch_data in existing_updates.items():
        resp_p = requests.patch(
            f"{SUPABASE_URL}/rest/v1/pasien?id=eq.{pid}",
            headers=headers,
            json=patch_data,
            timeout=15
        )
        if resp_p.status_code in (200, 204):
            sukses_up += 1
        time.sleep(0.01)
    print(f"   [OK] Berhasil memperbarui {sukses_up}/{len(existing_updates)} data pasien eksisting.")

# 5. Batch Insert Pasien Baru ke Supabase
print(f"\n5. Mengunggah {len(new_patients_to_insert)} pasien baru ke database Supabase...")
patient_list = list(new_patients_to_insert.values())
total_p = len(patient_list)
chunk_size = 500
sukses_p = 0
gagal_p = 0

for i in range(0, total_p, chunk_size):
    chunk = patient_list[i : i + chunk_size]
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/pasien?on_conflict=id",
        headers={**headers, "Prefer": "resolution=merge-duplicates"},
        json=chunk,
        timeout=60
    )
    if resp.status_code in (200, 201, 204):
        sukses_p += len(chunk)
        print(f"   [OK] {sukses_p}/{total_p} pasien baru terunggah ({sukses_p*100//total_p}%)...", flush=True)
    else:
        gagal_p += len(chunk)
        print(f"   [ERR] Gagal batch {i}: {resp.status_code} {resp.text[:150]}", flush=True)
    time.sleep(0.05)

print(f"\n[HASIL AKHIR UPLOAD PASIEN]: {sukses_p} berhasil, {gagal_p} gagal.")

# 6. Verifikasi Total Pasien di Database
r_count = requests.get(
    f"{SUPABASE_URL}/rest/v1/pasien?select=id",
    headers={**headers, "Range-Unit": "items", "Prefer": "count=exact"},
    timeout=20
)
print(f"\n=== TOTAL PASIEN KESELURUHAN DI DATABASE SAAT INI ===")
print(f"Content-Range: {r_count.headers.get('content-range')}")
print("=====================================================")
