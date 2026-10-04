import csv
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

# 1. Distinct verifikator in lab_permintaan
print("=== VERIFIKATOR DI LAB_PERMINTAAN ===")
offset = 0
verif_counter = Counter()
while True:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/lab_permintaan?select=verifikator&limit=1000&offset={offset}", headers=headers)
    rows = r.json()
    if not rows:
        break
    for row in rows:
        v = row.get('verifikator')
        if v:
            verif_counter[v] += 1
    offset += len(rows)
    if len(rows) < 1000:
        break
print(f"Total lab_permintaan checked: {offset}")
print("Verifikator counts:", verif_counter.most_common(20))

# 2. Check CSV headers for 2024 & 2025
print("\n=== HEADERS CSV 2024 ===")
with open(r"c:\lab_utama\hasil_lab_2024_NIK_utuh_8991_pasien.csv", "r", encoding="utf-8-sig") as f:
    r = csv.reader(f)
    headers_2024 = next(r)
    print(headers_2024[:20])

print("\n=== HEADERS CSV 2025 ===")
with open(r"c:\lab_utama\hasil_lab_2025_NIK_utuh_teks_8014.csv", "r", encoding="utf-8-sig") as f:
    r = csv.reader(f)
    headers_2025 = next(r)
    print(headers_2025[:20])
