import csv
import requests
from collections import Counter

SUPABASE_URL = "http://187.53.142.245:8001"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0."
    "dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
)

r_auth = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    json={"email": "dedekurniasih@labutama.id", "password": "lab123456"},
    timeout=15
)
token = r_auth.json()["access_token"]
headers = {"apikey": ANON_KEY, "Authorization": f"Bearer {token}", "Content-Type": "application/json"}

all_refs = []
offset = 0
while True:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/ref_lab?select=kode,nama,kode_loinc,display_loinc&offset={offset}&limit=500", headers=headers)
    c = r.json()
    if not c:
        break
    all_refs.extend(c)
    offset += 500
ref_map = {x["kode"]: x for x in all_refs}

counter = Counter()
with open("c:/lab_utama/hasil_lab_2026_lengkap_NIK_utuh_4332_pasien.csv", "r", encoding="utf-8-sig", errors="replace") as f:
    for row in csv.DictReader(f, delimiter=";"):
        code = (row.get("rd_pxcode") or "").strip()
        name = (row.get("rd_pxname") or "").strip()
        if code:
            counter[(code, name)] += 1

unmapped = []
for (code, name), freq in counter.most_common(100):
    ref_obj = ref_map.get(code)
    loinc = ref_obj.get("kode_loinc") if ref_obj else None
    is_non_lab = code.startswith("R") or code.startswith("E") or any(w in name.lower() for w in ["gigi", "service", "usg", "vaksin", "fisik", "tindakan"])
    if not loinc and not is_non_lab:
        unmapped.append((freq, code, name))

print(f"Unmapped clinical tests in Top 100: {len(unmapped)}")
for f, c, n in unmapped:
    print(f"  {f:4d} | {c:10s} | {n}")
