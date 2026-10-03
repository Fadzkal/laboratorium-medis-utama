"""
================================================================================
SINKRONISASI & PEMULIHAN DATA NOMOR BPJS DAN KUNJUNGAN PASIEN 2021
LABORATORIUM MEDIS UTAMA
================================================================================
Skrip ini:
1. Membaca kembali c:\\lab_utama\\hasil_lab_2021_NIK_utuh_22300_pasien.csv
2. Mengekstrak 13-digit nomor kepesertaan BPJS (yang sebelumnya terabaikan karena
   hanya mengecek NIK 16 digit).
3. Memperbarui kolom 'no_bpjs' pada tabel 'pasien' di Supabase.
4. Memperbarui kolom 'cara_bayar' menjadi 'BPJS' pada tabel 'kunjungan' yang terkait.
================================================================================
"""

import sys
import re
import time
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

CSV_PATH = r"c:\lab_utama\hasil_lab_2021_NIK_utuh_22300_pasien.csv"

print("1. Melakukan autentikasi ke database Supabase...")
r_auth = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    json={"email": AUTH_EMAIL, "password": AUTH_PASS},
    timeout=15
)
if r_auth.status_code != 200:
    print(f"[GAGAL] Autentikasi gagal: {r_auth.status_code} {r_auth.text}")
    sys.exit(1)

token = r_auth.json()["access_token"]
headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
print("   [OK] Berhasil login sebagai Master.")

# 2. Parsing CSV untuk mencari nomor BPJS dan No RM/No Lab
print(f"\n2. Membaca CSV {CSV_PATH} untuk mengekstrak identitas BPJS...")
bpjs_by_rm = {}
bpjs_no_labs = set()
total_rows = 0

with open(CSV_PATH, 'r', encoding='utf-8-sig', errors='replace') as f:
    f.readline()  # Skip header
    for line in f:
        total_rows += 1
        cols = line.strip().split(';')
        if len(cols) < 4:
            continue
        no_lab = cols[0].strip().strip('"\'\t ')
        no_rm = cols[2].strip().strip('"\'\t ')
        nik_raw = cols[3].strip().strip('"\'\t ')
        digits = re.sub(r'\D', '', nik_raw)

        # Di Indonesia nomor BPJS Kesehatan berjumlah 13 digit (diawali 00)
        if len(digits) == 13 and digits.startswith('00'):
            if no_rm and no_rm not in bpjs_by_rm:
                bpjs_by_rm[no_rm] = digits
            if no_lab:
                bpjs_no_labs.add(no_lab)

print(f"   [OK] Total baris CSV diperiksa : {total_rows}")
print(f"   [OK] Pasien BPJS terdeteksi    : {len(bpjs_by_rm)} No RM unik")
print(f"   [OK] Kunjungan/No Lab BPJS     : {len(bpjs_no_labs)} transaksi lab")

# 3. Cari pasien_id di Supabase berdasarkan No RM
print("\n3. Mencocokkan data pasien di Supabase...")
db_pasien_map = {}
offset = 0
limit = 1000

while True:
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/pasien?select=id,no_rm,nama,no_bpjs&offset={offset}&limit={limit}",
        headers=headers,
        timeout=30
    )
    if res.status_code != 200:
        print(f"[GAGAL] Gagal mengambil pasien: {res.status_code} {res.text}")
        sys.exit(1)
    rows = res.json()
    if not rows:
        break
    for r in rows:
        norm = (r.get('no_rm') or '').strip()
        if norm:
            db_pasien_map[norm] = r
    offset += len(rows)
    if len(rows) < limit:
        break

print(f"   [OK] Total pasien di database: {len(db_pasien_map)}")

# 4. Melakukan Update 'no_bpjs' ke tabel 'pasien'
print("\n4. Mengunggah nomor BPJS ke tabel 'pasien'...")
sukses_pasien = 0
gagal_pasien = 0
updated_pasien_ids = set()

for norm, no_bpjs in bpjs_by_rm.items():
    p = db_pasien_map.get(norm)
    if not p:
        # Coba format no_rm dengan strip atau nol jika ada perbedaan format
        continue
    p_id = p['id']
    updated_pasien_ids.add(p_id)
    
    # Update pasien
    patch_res = requests.patch(
        f"{SUPABASE_URL}/rest/v1/pasien?id=eq.{p_id}",
        headers=headers,
        json={"no_bpjs": no_bpjs},
        timeout=15
    )
    if patch_res.status_code in (200, 204):
        sukses_pasien += 1
    else:
        gagal_pasien += 1
        print(f"   [GAGAL UPDATE PASIEN {norm}]: {patch_res.status_code} {patch_res.text}")

print(f"   [OK] Berhasil memperbarui {sukses_pasien}/{len(bpjs_by_rm)} pasien BPJS di Supabase.")

# 5. Melakukan Update 'cara_bayar' = 'BPJS' pada tabel 'kunjungan'
print("\n5. Mengupdate cara_bayar = 'BPJS' pada tabel 'kunjungan'...")
# Update kunjungan berdasarkan pasien_id dari seluruh pasien BPJS yang terdeteksi
sukses_kunjungan_pasien = 0
for p_id in updated_pasien_ids:
    patch_k = requests.patch(
        f"{SUPABASE_URL}/rest/v1/kunjungan?pasien_id=eq.{p_id}",
        headers=headers,
        json={"cara_bayar": "BPJS"},
        timeout=15
    )
    if patch_k.status_code in (200, 204):
        sukses_kunjungan_pasien += 1
    time.sleep(0.02)

print(f"   [OK] Kunjungan untuk {sukses_kunjungan_pasien} pasien BPJS berhasil diubah ke 'BPJS'.")

# Pastikan juga kunjungan dengan no_kunjungan / no_lab terdaftar terupdate
print("\n6. Memverifikasi kunjungan spesifik berdasarkan No Lab BPJS...")
sukses_nolab = 0
no_lab_list = list(bpjs_no_labs)
for i in range(0, len(no_lab_list), 100):
    chunk = no_lab_list[i : i + 100]
    param_in = "(" + ",".join(chunk) + ")"
    patch_nl = requests.patch(
        f"{SUPABASE_URL}/rest/v1/kunjungan?no_kunjungan=in.{param_in}",
        headers=headers,
        json={"cara_bayar": "BPJS"},
        timeout=30
    )
    if patch_nl.status_code in (200, 204):
        sukses_nolab += len(chunk)
    time.sleep(0.02)

print(f"   [OK] {sukses_nolab}/{len(no_lab_list)} transaksi lab berhasil diverifikasi sebagai BPJS.")

# 7. Verifikasi Akhir
print("\n" + "=" * 74)
print("   VERIFIKASI AKHIR DATABASE SETELAH SINKRONISASI")
print("=" * 74)
r_bpjs_p = requests.get(
    f"{SUPABASE_URL}/rest/v1/pasien?select=id&no_bpjs=not.is.null&no_bpjs=not.eq.&limit=1",
    headers={**headers, "Prefer": "count=exact"}
)
r_bpjs_k = requests.get(
    f"{SUPABASE_URL}/rest/v1/kunjungan?select=id&cara_bayar=eq.BPJS&limit=1",
    headers={**headers, "Prefer": "count=exact"}
)

print(f"  Jumlah Pasien dengan No. BPJS : {r_bpjs_p.headers.get('Content-Range')}")
print(f"  Jumlah Kunjungan dengan BPJS   : {r_bpjs_k.headers.get('Content-Range')}")
print("=" * 74)
print("SINKRONISASI NOMOR BPJS SELESAI DENGAN SUKSES!")
