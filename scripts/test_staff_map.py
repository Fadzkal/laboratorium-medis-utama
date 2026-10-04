import requests
from collections import Counter

SUPABASE_URL = 'http://187.53.142.245:8001'
ANON_KEY = (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'
    'eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.'
    'dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'
)
AUTH_EMAIL = 'dedekurniasih@labutama.id'
AUTH_PASS = 'lab123456'

r_auth = requests.post(
    f'{SUPABASE_URL}/auth/v1/token?grant_type=password',
    headers={'apikey': ANON_KEY, 'Content-Type': 'application/json'},
    json={'email': AUTH_EMAIL, 'password': AUTH_PASS}
)
token = r_auth.json()['access_token']
headers = {
    'apikey': ANON_KEY,
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Ambil pegawai aktif
r_peg = requests.get(f'{SUPABASE_URL}/rest/v1/pegawai?select=id,nama,peran&aktif=eq.true', headers=headers).json()
print(f'Total Pegawai: {len(r_peg)}')
for p in r_peg:
    if p['peran'] != 'dokter':
        print(f"  {p['id']} - {p['nama']} ({p['peran']})")
