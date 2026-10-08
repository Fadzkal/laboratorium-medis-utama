import requests
import json
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

# 1. Fetch ref_lab dict by id and by kode
r_ref = requests.get(f"{SUPABASE_URL}/rest/v1/ref_lab?select=id,kode,nama,kelompok,satuan,kode_loinc,display_loinc,kode_specimen,nama_specimen&limit=2000", headers=headers)
ref_list = r_ref.json()
ref_by_id = {x["id"]: x for x in ref_list}
ref_by_kode = {x["kode"]: x for x in ref_list}

print(f"Total ref_lab: {len(ref_list)}")

# 2. Fetch sample of lab_hasil
r_hasil = requests.get(f"{SUPABASE_URL}/rest/v1/lab_hasil?select=lab_id,nama&limit=2500", headers=headers)
hasil_list = r_hasil.json()
print(f"Fetched {len(hasil_list)} records from lab_hasil")

counter = Counter((h.get("lab_id"), h.get("nama")) for h in hasil_list)

print("\n--- TOP 35 HASIL LAB FREQUENCY ---")
unmapped = []
for (lid, name), count in counter.most_common(35):
    ref_obj = ref_by_id.get(lid)
    loinc = ref_obj.get("kode_loinc") if ref_obj else None
    disp = ref_obj.get("display_loinc") if ref_obj else None
    print(f"Count: {count:3d} | lab_id: {lid} | Name in hasil: {name:25s} | ref.kode: {ref_obj.get('kode') if ref_obj else 'N/A'} | LOINC: {loinc}")
    if not loinc:
        unmapped.append((lid, name, ref_obj.get('kode') if ref_obj else ''))

print(f"\nUnmapped among top 35: {len(unmapped)}")
