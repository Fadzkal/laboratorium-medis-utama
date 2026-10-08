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

r = requests.get(f"{SUPABASE_URL}/rest/v1/pegawai?select=id,nama,nik,no_sip,peran,aktif,satusehat_practitioner_id&order=peran.asc,nama.asc", headers=headers)
for p in r.json():
    print(f"[{p.get('peran', ''):10s}] {p.get('nama', ''):35s} | NIK: {p.get('nik') or '-'} | Practitioner ID: {p.get('satusehat_practitioner_id') or '-'}")
