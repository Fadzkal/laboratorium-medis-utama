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

r = requests.get(f"{SUPABASE_URL}/rest/v1/ref_lab?select=id,kode,nama,kelompok,kode_loinc,display_loinc,satuan&limit=2000", headers=headers)
rows = r.json()

# Prefix distribution for "Lainnya"
lainnya = [x for x in rows if x.get("kelompok") == "Lainnya"]
prefix_counts = Counter(x["kode"][:1] for x in lainnya)
print("Prefixes in Lainnya:")
for p, c in prefix_counts.most_common():
    print(f"Prefix {p}: {c} items (example: {[x['nama'] for x in lainnya if x['kode'].startswith(p)][:3]})")
