import requests
from collections import Counter

SUPABASE_URL = "http://187.53.142.245:8001"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0."
    "dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
)

AUTH_EMAIL = "dedekurniasih@labutama.id"
AUTH_PASS = "lab123456"

r_auth = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    json={"email": AUTH_EMAIL, "password": AUTH_PASS},
    timeout=15
)
token = r_auth.json()["access_token"]
headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 1. Check all audit_log count & aksi & user_nama
r_audit_cnt = requests.get(f"{SUPABASE_URL}/rest/v1/audit_log?select=aksi,user_nama&limit=1000", headers=headers)
print("=== AUDIT LOG (first 1000) ===")
audit_aksi = Counter()
audit_user = Counter()
for x in r_audit_cnt.json():
    audit_aksi[x.get('aksi')] += 1
    audit_user[x.get('user_nama')] += 1
print("Aksi:", audit_aksi)
print("User:", audit_user)

# 2. Check dikerjakan_oleh / diminta_oleh / verifikator in lab_permintaan
r_lab_check = requests.get(f"{SUPABASE_URL}/rest/v1/lab_permintaan?select=diminta_oleh,dikerjakan_oleh,selesai_oleh,verifikator&limit=1000", headers=headers)
dikerjakan = Counter([x.get('dikerjakan_oleh') for x in r_lab_check.json()])
diminta = Counter([x.get('diminta_oleh') for x in r_lab_check.json()])
selesai = Counter([x.get('selesai_oleh') for x in r_lab_check.json()])
print("\n=== LAB PERMINTAAN COLUMNS COUNT ===")
print("dikerjakan_oleh:", dikerjakan)
print("diminta_oleh:", diminta)
print("selesai_oleh:", selesai)

# 3. Check CSV 2021, 2022, 2023, 2024, 2025: who are the verifikators / petugas?
# Let's inspect verifikator in 2024 and 2025 CSVs
verifs_2024 = Counter()
import csv
with open(r"c:\lab_utama\hasil_lab_2024_NIK_utuh_8991_pasien.csv", "r", encoding="utf-8-sig") as f:
    r = csv.DictReader(f, delimiter=';')
    for row in r:
        v = row.get('verifikator') or row.get('"verifikator"')
        if v: verifs_2024[v] += 1
print("\n=== VERIFIKATOR CSV 2024 ===")
print(verifs_2024.most_common(10))

verifs_2025 = Counter()
with open(r"c:\lab_utama\hasil_lab_2025_NIK_utuh_teks_8014.csv", "r", encoding="utf-8-sig") as f:
    r = csv.DictReader(f, delimiter=';')
    for row in r:
        v = row.get('verifikator')
        if v: verifs_2025[v] += 1
print("\n=== VERIFIKATOR CSV 2025 ===")
print(verifs_2025.most_common(10))
