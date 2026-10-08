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

k_id = "0d584c61-808a-4535-adab-b6f1be0c16f0"
r = requests.get(f"{SUPABASE_URL}/rest/v1/lab_permintaan?kunjungan_id=eq.{k_id}", headers=headers)
print("lab_permintaan:", r.json())
lp = r.json()
if lp:
    lp_id = lp[0]["id"]
    r_hasil = requests.get(f"{SUPABASE_URL}/rest/v1/lab_hasil?permintaan_id=eq.{lp_id}", headers=headers)
    print("lab_hasil count:", len(r_hasil.json()))
