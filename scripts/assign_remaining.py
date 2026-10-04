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
    'Prefer': 'count=exact'
}

# Pegawai front office
fo_ids = [
    '0272abad-2534-44bf-8ed6-8ccae1a24cc6', # Aisyah Nur Hidayah
    '4a6889a3-6703-48dc-9855-d4bda2df3a1e', # Anisah Nur Adinah
    'fc6806e9-0b6e-4fb1-956b-d133908673a7', # Aziz Budi Laksono
    'e4b5161d-f30e-4100-9941-47b4205c6230', # Lilis Apriyanti
    '3934cec6-301c-4b7a-bafd-d309be3c0df6', # Ma'rifah Nurul Ilmiatun
    '3618cf07-0e6e-4c81-946c-ba63ea7487ab', # Minto Rahaju
    '6d09ac18-5084-4d4d-8d5e-4aff866f4548', # Nafis Salma Afiyah
    'a97bf96c-79ab-423d-a106-90e99ee25b8c', # Ratna Ruby Mutiarin
    '503b628f-277e-4f76-b3d1-9e6d594a6ca2', # Retno Dwijayanti
    '07ba65d2-25c3-4bf9-853f-0801cb123293', # Salsa Billa Luthfi Ramadhany
    'c31a60d5-806b-42bb-9d77-d0ce49f9c55a', # Siti Aminatul Khasanah
    '46f28545-0058-4d94-ad18-cc77df3216b7', # Yana Jumhana
]

# Analis
analysts = [
    ('769371c3-a1df-4a96-bf8a-84e3f22b8b7f', 'DEDE KURNIASIH'),
    ('bb847e43-9c48-41c8-b459-f4afafbba51a', 'Awit Priyanti'),
    ('eb2a2ac8-b240-402a-9a8f-9b7bbc2a87ee', 'Patriani Restu Putri'),
    ('8783e973-1dd1-4f77-b5c9-4d6b6176e6f8', 'Erisa'),
    ('5017217a-ec2f-422c-a5ca-d9b60a985ee5', 'Ita'),
    ('cbdf66b8-d6d2-4361-b3dc-7b5b7a032907', 'Uci'),
    ('3d05a69c-8261-4840-8fef-c59ff48d66f7', 'Nabila Nadhifatul Jannah')
]

# Update sisa kunjungan tanpa petugas
for i, fo_id in enumerate(fo_ids):
    # Update chunk per fo
    r = requests.get(f'{SUPABASE_URL}/rest/v1/kunjungan?created_by=is.null&select=id&limit=400', headers=headers)
    ids = [x['id'] for x in r.json()]
    if not ids:
        break
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/kunjungan?id=in.({','.join(ids)})",
        headers=headers,
        json={'created_by': fo_id}
    )

# Ulangi sampai 0
while True:
    r = requests.get(f'{SUPABASE_URL}/rest/v1/kunjungan?created_by=is.null&select=id&limit=500', headers=headers)
    ids = [x['id'] for x in r.json()]
    if not ids:
        break
    for i, chunk_start in enumerate(range(0, len(ids), 100)):
        sub_ids = ids[chunk_start:chunk_start+100]
        fo_id = fo_ids[i % len(fo_ids)]
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/kunjungan?id=in.({','.join(sub_ids)})",
            headers=headers,
            json={'created_by': fo_id}
        )

# Update sisa lab_permintaan tanpa selesai_oleh
while True:
    r = requests.get(f'{SUPABASE_URL}/rest/v1/lab_permintaan?selesai_oleh=is.null&select=id&limit=500', headers=headers)
    ids = [x['id'] for x in r.json()]
    if not ids:
        break
    for i, chunk_start in enumerate(range(0, len(ids), 100)):
        sub_ids = ids[chunk_start:chunk_start+100]
        an = analysts[i % len(analysts)]
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/lab_permintaan?id=in.({','.join(sub_ids)})",
            headers=headers,
            json={'selesai_oleh': an[0], 'verifikator': an[1]}
        )

# Cek hasil akhir
r1 = requests.get(f'{SUPABASE_URL}/rest/v1/kunjungan?created_by=is.null&select=count', headers={**headers, 'Range': '0-0', 'Prefer': 'count=exact'}).headers
r2 = requests.get(f'{SUPABASE_URL}/rest/v1/lab_permintaan?selesai_oleh=is.null&select=count', headers={**headers, 'Range': '0-0', 'Prefer': 'count=exact'}).headers
print('Sisa kunjungan tanpa created_by:', r1.get('Content-Range'))
print('Sisa lab_permintaan tanpa selesai_oleh:', r2.get('Content-Range'))
