import uuid
import requests

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
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 1. Nonaktifkan akun testing
r_test = requests.patch(f'{SUPABASE_URL}/rest/v1/pegawai?nama=eq.testing', headers=headers, json={'aktif': False, 'nama': 'Akun Cadangan'})
print('Deactivate testing status:', r_test.status_code)

# 2. Tambahkan analis riil laboratorium dengan UUID valid
new_analysts = [
    {'id': str(uuid.uuid4()), 'nama': 'Patriani Restu Putri', 'peran': 'karyawan', 'aktif': True, 'email': 'patriani@labutama.id'},
    {'id': str(uuid.uuid4()), 'nama': 'Erisa', 'peran': 'karyawan', 'aktif': True, 'email': 'erisa@labutama.id'},
    {'id': str(uuid.uuid4()), 'nama': 'Ita', 'peran': 'karyawan', 'aktif': True, 'email': 'ita@labutama.id'},
    {'id': str(uuid.uuid4()), 'nama': 'Uci', 'peran': 'karyawan', 'aktif': True, 'email': 'uci@labutama.id'}
]
for a in new_analysts:
    r_check = requests.get(f"{SUPABASE_URL}/rest/v1/pegawai?nama=eq.{a['nama']}", headers=headers).json()
    if not r_check:
        r_add = requests.post(f'{SUPABASE_URL}/rest/v1/pegawai', headers=headers, json=a)
        print(f"Add {a['nama']}:", r_add.status_code)
    else:
        print(f"Already exists: {a['nama']}", r_check[0]['id'])

# 3. Cek daftar pegawai karyawan
r_karyawan = requests.get(f'{SUPABASE_URL}/rest/v1/pegawai?peran=eq.karyawan&aktif=eq.true&order=nama', headers=headers).json()
print(f'\n=== TOTAL KARYAWAN AKTIF: {len(r_karyawan)} ===')
for p in r_karyawan:
    print(f"- {p['id']} : {p['nama']}")
