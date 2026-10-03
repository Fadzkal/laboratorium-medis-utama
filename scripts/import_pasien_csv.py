"""
================================================================================
IMPORT & DEDUPLIKASI LENGKAP DATA PASIEN DAN HASIL LAB (2021 - 2026)
LABORATORIUM MEDIS UTAMA
================================================================================
Penggunaan:
  python scripts/import_pasien_csv.py --file "c:/lab_utama/hasil_lab_2021_NIK_utuh_22300_pasien.csv"
  python scripts/import_pasien_csv.py --file "c:/path/ke/file_tahun_2022.csv"

Alur:
1. Deduplikasi Cerdas Pasien:
   - Menghubungkan kunjungan berulang ke pasien yang sama (berdasarkan NIK, Nama+DOB, No RM).
   - Memastikan tidak ada pasien duplikat/dobel di tabel master 'pasien'.
2. Memasukkan riwayat 'kunjungan' sehingga statistik jumlah kunjungan (1x, 2x, dst) tercatat.
3. Memasukkan lembar 'lab_permintaan'.
4. Memasukkan seluruh rincian nilai pemeriksaan ke 'lab_hasil' (parameter, hasil, satuan, rujukan, tanda).
================================================================================
"""

import os
import sys
import re
import time
import argparse
import hashlib
from collections import defaultdict, Counter
import requests

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "http://187.53.142.245:8001"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0."
    "dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
)

AUTH_EMAIL = "dedekurniasih@labutama.id"
AUTH_PASS = "lab123456"
POLI_LAB_ID = "613b9f46-3f48-490f-81a7-97061e623d21"

parser = argparse.ArgumentParser(description="Impor dan deduplikasi pasien beserta hasil lab dari CSV")
parser.add_argument("--file", "-f", default=r"c:\lab_utama\hasil_lab_2021_NIK_utuh_22300_pasien.csv", help="Path file CSV")
args = parser.parse_args()

csv_path = args.file
if not os.path.exists(csv_path):
    print(f"[GAGAL] File CSV tidak ditemukan: {csv_path}")
    sys.exit(1)

print(f"=== MEMULAI IMPOR LENGKAP DARI: {os.path.basename(csv_path)} ===")

# 1. Login
print("1. Melakukan autentikasi...")
r_auth = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    json={"email": AUTH_EMAIL, "password": AUTH_PASS},
    timeout=15
)
if r_auth.status_code != 200:
    print(f"[GAGAL] Login gagal: {r_auth.text}")
    sys.exit(1)

token = r_auth.json()["access_token"]
headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}
print("   [OK] Berhasil login sebagai Master.")

# 2. Ambil master ref_lab dan dokter
print("2. Memuat master pemeriksaan lab dan daftar dokter...")
r_ref = requests.get(f"{SUPABASE_URL}/rest/v1/ref_lab?select=id,kode,nama", headers=headers, timeout=30)
ref_map = {x['kode'].strip().lower(): x['id'] for x in r_ref.json()}

r_dok = requests.get(f"{SUPABASE_URL}/rest/v1/pegawai?peran=eq.dokter&select=id,nama", headers=headers, timeout=15)
dokter_map = {}
if r_dok.status_code == 200:
    for d in r_dok.json():
        clean_d = re.sub(r'[^a-zA-Z0-9]', '', d['nama'].lower())
        dokter_map[clean_d] = d['id']

# 3. Indeks pasien yang sudah ada
print("3. Memuat indeks pasien yang sudah ada di database...")
existing_patients_by_nik = {}
existing_patients_by_namedob = {}
existing_patients_by_rm = {}

offset = 0
limit = 5000
while True:
    r_ex = requests.get(
        f"{SUPABASE_URL}/rest/v1/pasien?select=id,no_rm,nama,nik,tanggal_lahir&offset={offset}&limit={limit}",
        headers=headers,
        timeout=30
    )
    if r_ex.status_code != 200 or not r_ex.json():
        break
    rows = r_ex.json()
    for row in rows:
        p_id = row['id']
        if row.get('nik'):
            existing_patients_by_nik[row['nik']] = p_id
        if row.get('nama') and row.get('tanggal_lahir'):
            clean_n = re.sub(r'\s+', ' ', row['nama'].strip().upper())
            existing_patients_by_namedob[(clean_n, row['tanggal_lahir'])] = p_id
        if row.get('no_rm'):
            existing_patients_by_rm[row['no_rm'].strip()] = p_id
    offset += len(rows)
    if len(rows) < limit:
        break

print(f"   [OK] Terindeks {len(existing_patients_by_rm)} pasien eksisting di database.")

# Helper
bulan_map = {
    'januari': '01', 'jan': '01', 'februari': '02', 'feb': '02', 'maret': '03', 'mar': '03',
    'april': '04', 'apr': '04', 'mei': '05', 'may': '05', 'juni': '06', 'jun': '06',
    'juli': '07', 'jul': '07', 'agustus': '08', 'agu': '08', 'september': '09',
    'sep': '09', 'oktober': '10', 'okt': '10', 'oct': '10', 'november': '11', 'nov': '11',
    'desember': '12', 'des': '12', 'dec': '12'
}

def clean_val(val):
    if not val:
        return ''
    return val.strip().strip('"\'\t \r\n').strip()

def parse_date(s):
    if not s:
        return None
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

# 4. Parsing CSV
print("4. Memproses CSV...")
seen_orders = set()
new_patients = {}
visits = []
permintaan = []
hasil_list = []
seen_per_order_hasil = set()
order_item_counter = Counter()
missing_masters = {}

with open(csv_path, 'r', encoding='utf-8-sig', errors='replace') as f:
    f.readline()
    for line in f:
        cols = line.strip().split(';')
        if len(cols) < 20:
            continue
        no_lab = clean_val(cols[0])
        no_rm = clean_val(cols[2])
        if not no_lab:
            continue

        raw_name = clean_val(cols[1])
        title, c_name = extract_title_and_clean_name(raw_name)
        nik_raw = clean_val(cols[3])
        digits = re.sub(r'\D', '', nik_raw)
        valid_nik = digits if len(digits) == 16 else None
        valid_bpjs = digits if (len(digits) == 13 and digits.startswith('00')) else None
        dob = parse_date(cols[5])
        gender_raw = clean_val(cols[4])
        gender = 'P' if 'perempuan' in gender_raw.lower() else 'L'
        alamat = clean_val(cols[7])
        tgl_periksa = parse_date(cols[8])
        dokter_nama = clean_val(cols[10])
        instansi = clean_val(cols[11])

        # Temukan atau tentukan pasien_id
        p_id = None
        if valid_nik and valid_nik in existing_patients_by_nik:
            p_id = existing_patients_by_nik[valid_nik]
        elif c_name and dob and (c_name.upper(), dob) in existing_patients_by_namedob:
            p_id = existing_patients_by_namedob[(c_name.upper(), dob)]
        elif no_rm and no_rm in existing_patients_by_rm:
            p_id = existing_patients_by_rm[no_rm]

        if not p_id:
            if valid_nik:
                can_key = f"NIK_{valid_nik}"
            elif valid_bpjs:
                can_key = f"BPJS_{valid_bpjs}"
            elif c_name and dob:
                can_key = f"ND_{c_name.upper()}_{dob}"
            elif no_rm:
                can_key = f"RM_{no_rm}"
            else:
                can_key = f"NA_{c_name.upper()}_{alamat.upper()}"

            if can_key not in new_patients:
                p_id = uuid_from_str(f"PASIEN_{can_key}")
                new_patients[can_key] = {
                    'id': p_id,
                    'no_rm': no_rm or f"RM-{len(existing_patients_by_rm) + len(new_patients) + 1:06d}",
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
                if valid_nik:
                    existing_patients_by_nik[valid_nik] = p_id
                if c_name and dob:
                    existing_patients_by_namedob[(c_name.upper(), dob)] = p_id
                if no_rm:
                    existing_patients_by_rm[no_rm] = p_id
            else:
                p_id = new_patients[can_key]['id']

        kunjungan_id = uuid_from_str(f"KUNJUNGAN_{no_lab}")
        permintaan_id = uuid_from_str(f"PERMINTAAN_{no_lab}")

        if (no_rm, no_lab) not in seen_orders:
            seen_orders.add((no_rm, no_lab))

            dok_clean = re.sub(r'[^a-zA-Z0-9]', '', dokter_nama.lower())
            dok_id = dokter_map.get(dok_clean, None)

            is_bpjs_visit = bool(valid_bpjs or instansi.upper() == 'BPJS')
            visits.append({
                'id': kunjungan_id,
                'no_kunjungan': no_lab,
                'pasien_id': p_id,
                'tanggal': tgl_periksa or '2021-01-01',
                'poli_id': POLI_LAB_ID,
                'dokter_id': dok_id,
                'cara_bayar': 'BPJS' if is_bpjs_visit else 'UMUM',
                'keluhan_singkat': f"Dokter Pengirim: {dokter_nama}" if dokter_nama else None,
                'status': 'SELESAI'
            })

            permintaan.append({
                'id': permintaan_id,
                'no_lab': no_lab,
                'pasien_id': p_id,
                'kunjungan_id': kunjungan_id,
                'tanggal': tgl_periksa or '2021-01-01',
                'asal': 'EKSTERNAL',
                'status': 'SELESAI',
                'catatan_klinis': instansi or None
            })

        # Proses rincian hasil lab
        code = clean_val(cols[14])
        name = clean_val(cols[15])
        val = clean_val(cols[16])
        flag = clean_val(cols[17])
        unit = clean_val(cols[18])
        normal = clean_val(cols[19])

        if code and val:
            if code.lower() not in ref_map and code.lower() not in missing_masters:
                missing_masters[code.lower()] = {
                    'id': uuid_from_str(f"REFLAB_{code.upper()}"),
                    'kode': code.upper(),
                    'nama': name or code.upper(),
                    'satuan': unit or None,
                    'kelompok': 'Lainnya',
                    'jenis_nilai': 'ANGKA' if val.replace(',', '.').replace('.', '', 1).isdigit() else 'TEKS',
                    'aktif': True
                }

            lab_id = ref_map.get(code.lower()) or (missing_masters[code.lower()]['id'] if code.lower() in missing_masters else None)
            if lab_id:
                hasil_key = (permintaan_id, lab_id)
                if hasil_key not in seen_per_order_hasil:
                    seen_per_order_hasil.add(hasil_key)
                    order_item_counter[permintaan_id] += 1
                    urutan = order_item_counter[permintaan_id]

                    nilai_angka = None
                    try:
                        nilai_angka = float(val.replace(',', '.'))
                    except (ValueError, TypeError):
                        pass

                    flag_u = flag.upper()
                    if flag_u in ('L', 'LOW', 'RENDAH'):
                        tanda = 'RENDAH'
                    elif flag_u in ('H', 'HIGH', 'TINGGI'):
                        tanda = 'TINGGI'
                    elif flag_u in ('*', 'A', 'ABNORMAL', 'POSITIF', 'REAKTIF'):
                        tanda = 'ABNORMAL'
                    elif flag_u in ('N', 'NORMAL', 'NEGATIF', 'NON REAKTIF'):
                        tanda = 'NORMAL'
                    else:
                        tanda = 'NORMAL'

                    hasil_list.append({
                        'id': uuid_from_str(f"HASIL_{permintaan_id}_{lab_id}"),
                        'permintaan_id': permintaan_id,
                        'lab_id': lab_id,
                        'nama': name or code,
                        'satuan': unit or None,
                        'nilai_angka': nilai_angka,
                        'nilai_teks': val,
                        'rujukan_teks': normal or None,
                        'tanda': tanda,
                        'urutan': urutan
                    })

print(f"   [OK] Ditemukan {len(new_patients)} pasien baru, {len(visits)} kunjungan, dan {len(hasil_list)} rincian hasil lab.")

# Tambah master lab jika ada
if missing_masters:
    print(f"   Menambahkan {len(missing_masters)} master lab baru...")
    requests.post(f"{SUPABASE_URL}/rest/v1/ref_lab?on_conflict=kode", headers=headers, json=list(missing_masters.values()), timeout=30)
    for k, v in missing_masters.items():
        ref_map[k] = v['id']

# 5. Batch Insert
def batch_insert(table_name, data_list, chunk_size=1000):
    total = len(data_list)
    if total == 0:
        return
    print(f"\nMengunggah {total} baris ke '{table_name}'...")
    sukses = 0
    for i in range(0, total, chunk_size):
        chunk = data_list[i : i + chunk_size]
        url = f"{SUPABASE_URL}/rest/v1/{table_name}?on_conflict=id"
        resp = requests.post(url, headers=headers, json=chunk, timeout=60)
        if resp.status_code in (200, 201, 204):
            sukses += len(chunk)
            print(f"  [OK] {sukses}/{total} baris terunggah ke '{table_name}'.", flush=True)
        else:
            print(f"  [ERR] {resp.status_code} {resp.text[:100]}", flush=True)
        time.sleep(0.05)

if new_patients:
    batch_insert('pasien', list(new_patients.values()))

batch_insert('kunjungan', visits)
batch_insert('lab_permintaan', permintaan)
batch_insert('lab_hasil', hasil_list)

print("\n=== SELURUH PROSES IMPOR SELESAI DENGAN SUKSES ===")
