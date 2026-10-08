import requests

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

# Fetch all ref_lab
all_refs = []
offset = 0
limit = 500
while True:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/ref_lab?select=id,kode,nama,kelompok,satuan,kode_loinc,display_loinc,kode_specimen,nama_specimen&offset={offset}&limit={limit}&order=kode.asc", headers=headers)
    chunk = r.json()
    if not chunk:
        break
    all_refs.extend(chunk)
    offset += limit

print(f"Total rows in ref_lab: {len(all_refs)}")

# Group by kelompok
from collections import defaultdict
by_kel = defaultdict(list)
for r in all_refs:
    by_kel[r.get("kelompok") or "Lainnya"].append(r)

for kel, items in sorted(by_kel.items()):
    with_l = sum(1 for x in items if x.get("kode_loinc"))
    print(f"Kelompok: {kel:20s} | Total: {len(items):3d} | With LOINC: {with_l:3d}")

print("\n--- SAMPLE HEMATOLOGI (H) ---")
for x in by_kel.get("Hematologi", [])[:20]:
    print(f"{x['kode']:10s} | {x['nama']:25s} | LOINC: {repr(x.get('kode_loinc'))}")

print("\n--- SAMPLE URINALISIS (U) ---")
for x in by_kel.get("Urinalisis", [])[:20]:
    print(f"{x['kode']:10s} | {x['nama']:25s} | LOINC: {repr(x.get('kode_loinc'))}")

print("\n--- SAMPLE KIMIA KLINIK (K) ---")
for x in by_kel.get("Kimia Klinik", [])[:20]:
    print(f"{x['kode']:10s} | {x['nama']:25s} | LOINC: {repr(x.get('kode_loinc'))}")
