import requests

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

# 1. Pegawai where peran != dokter
r_non_doc = requests.get(f"{SUPABASE_URL}/rest/v1/pegawai?peran=neq.dokter", headers=headers)
print("=== NON-DOKTER PEGAWAI ===")
for p in r_non_doc.json():
    print(p['id'], p['nama'], p['peran'], p.get('jabatan'), p.get('email'))

# 2. Check verifikator in lab_permintaan
r_verif = requests.get(f"{SUPABASE_URL}/rest/v1/lab_permintaan?select=verifikator&verifikator=not.is.null&limit=20", headers=headers)
print("\n=== VERIFIKATOR SAMPLE IN LAB_PERMINTAAN ===")
print(set([x.get('verifikator') for x in r_verif.json()]))

# 3. Check audit_log
r_audit = requests.get(f"{SUPABASE_URL}/rest/v1/audit_log?limit=5", headers=headers)
print("\n=== AUDIT_LOG SAMPLE ===")
for x in r_audit.json():
    print(x)

# 4. Check Surat & Kasir
r_surat = requests.get(f"{SUPABASE_URL}/rest/v1/surat?limit=5", headers=headers)
print("\n=== SURAT SAMPLE ===")
print(r_surat.json())

r_kasir = requests.get(f"{SUPABASE_URL}/rest/v1/kasir_pembayaran?limit=5", headers=headers)
print("\n=== KASIR_PEMBAYARAN SAMPLE ===")
print(r_kasir.json())
