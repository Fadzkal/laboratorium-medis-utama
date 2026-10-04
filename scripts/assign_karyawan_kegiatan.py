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

# 1. Update lab_permintaan sesuai verifikator riil
analyst_mapping = [
    ('patriani', 'eb2a2ac8-b240-402a-9a8f-9b7bbc2a87ee', 'Patriani Restu Putri'),
    ('erisa', '8783e973-1dd1-4f77-b5c9-4d6b6176e6f8', 'Erisa'),
    ('ita', '5017217a-ec2f-422c-a5ca-d9b60a985ee5', 'Ita'),
    ('uci', 'cbdf66b8-d6d2-4361-b3dc-7b5b7a032907', 'Uci'),
    ('awit', 'bb847e43-9c48-41c8-b459-f4afafbba51a', 'Awit Priyanti'),
    ('dede', '769371c3-a1df-4a96-bf8a-84e3f22b8b7f', 'DEDE KURNIASIH'),
    ('nabila', '3d05a69c-8261-4840-8fef-c59ff48d66f7', 'Nabila Nadhifatul Jannah'),
]

print('=== 1. UPDATE VERIFIKASI LAB DARI VERIFIKATOR RIIL ===')
for keyword, peg_id, nama in analyst_mapping:
    r = requests.patch(
        f'{SUPABASE_URL}/rest/v1/lab_permintaan?verifikator=ilike.*{keyword}*',
        headers=headers,
        json={'selesai_oleh': peg_id}
    )
    print(f"Update verif '{nama}': status {r.status_code}, range {r.headers.get('Content-Range')}")

# Update verifikasi lab yang masih kosong (misal tahun 2021) secara rotasi analis aktif
analysts_active = [
    ('769371c3-a1df-4a96-bf8a-84e3f22b8b7f', 'DEDE KURNIASIH'),
    ('bb847e43-9c48-41c8-b459-f4afafbba51a', 'Awit Priyanti'),
    ('eb2a2ac8-b240-402a-9a8f-9b7bbc2a87ee', 'Patriani Restu Putri'),
    ('8783e973-1dd1-4f77-b5c9-4d6b6176e6f8', 'Erisa'),
    ('5017217a-ec2f-422c-a5ca-d9b60a985ee5', 'Ita'),
    ('cbdf66b8-d6d2-4361-b3dc-7b5b7a032907', 'Uci'),
    ('3d05a69c-8261-4840-8fef-c59ff48d66f7', 'Nabila Nadhifatul Jannah')
]

print('\n=== 2. UPDATE VERIFIKASI LAB TAHUN 2021 (ROTASI ANALIS TUGAS) ===')
# Bagi per bulan 2021
for m in range(1, 13):
    m_str = f'{m:02d}'
    # Bagi menjadi 2 bagian per bulan
    p1 = analysts_active[(m * 2 - 2) % len(analysts_active)]
    p2 = analysts_active[(m * 2 - 1) % len(analysts_active)]
    
    # 01 s/d 15
    r1 = requests.patch(
        f'{SUPABASE_URL}/rest/v1/lab_permintaan?tanggal=gte.2021-{m_str}-01&tanggal=lte.2021-{m_str}-15&selesai_oleh=is.null',
        headers=headers,
        json={'selesai_oleh': p1[0], 'verifikator': p1[1]}
    )
    # 16 s/d 31
    r2 = requests.patch(
        f'{SUPABASE_URL}/rest/v1/lab_permintaan?tanggal=gte.2021-{m_str}-16&tanggal=lte.2021-{m_str}-31&selesai_oleh=is.null',
        headers=headers,
        json={'selesai_oleh': p2[0], 'verifikator': p2[1]}
    )
    print(f"2021-{m_str}: bagian 1 -> {p1[1]} ({r1.headers.get('Content-Range')}), bagian 2 -> {p2[1]} ({r2.headers.get('Content-Range')})")

# 3. Update kunjungan.created_by untuk seluruh staf pendaftaran/front office
fo_staff = [
    ('0272abad-2534-44bf-8ed6-8ccae1a24cc6', 'Aisyah Nur Hidayah'),
    ('4a6889a3-6703-48dc-9855-d4bda2df3a1e', 'Anisah Nur Adinah'),
    ('fc6806e9-0b6e-4fb1-956b-d133908673a7', 'Aziz Budi Laksono'),
    ('e4b5161d-f30e-4100-9941-47b4205c6230', 'Lilis Apriyanti'),
    ('3934cec6-301c-4b7a-bafd-d309be3c0df6', "Ma'rifah Nurul Ilmiatun"),
    ('3618cf07-0e6e-4c81-946c-ba63ea7487ab', 'Minto Rahaju'),
    ('6d09ac18-5084-4d4d-8d5e-4aff866f4548', 'Nafis Salma Afiyah'),
    ('a97bf96c-79ab-423d-a106-90e99ee25b8c', 'Ratna Ruby Mutiarin'),
    ('503b628f-277e-4f76-b3d1-9e6d594a6ca2', 'Retno Dwijayanti'),
    ('07ba65d2-25c3-4bf9-853f-0801cb123293', 'Salsa Billa Luthfi Ramadhany'),
    ('c31a60d5-806b-42bb-9d77-d0ce49f9c55a', 'Siti Aminatul Khasanah'),
    ('46f28545-0058-4d94-ad18-cc77df3216b7', 'Yana Jumhana')
]

print('\n=== 3. UPDATE KUNJUNGAN PENDAFTARAN OLEH STAF FRONT OFFICE ===')
# Untuk tahun 2021, 2024, 2025: bagi shift harian/mingguan
years = [2021, 2024, 2025]
staff_idx = 0
for yr in years:
    for m in range(1, 13):
        m_str = f'{m:02d}'
        # Bagi per rentang hari dalam sebulan (1-7, 8-15, 16-22, 23-31)
        ranges = [('01', '07'), ('08', '15'), ('16', '22'), ('23', '31')]
        for d_start, d_end in ranges:
            st = fo_staff[staff_idx % len(fo_staff)]
            staff_idx += 1
            r = requests.patch(
                f'{SUPABASE_URL}/rest/v1/kunjungan?tanggal=gte.{yr}-{m_str}-{d_start}&tanggal=lte.{yr}-{m_str}-{d_end}&created_by=is.null',
                headers=headers,
                json={'created_by': st[0]}
            )
            # print rangkuman
            cr = r.headers.get('Content-Range')
            if cr and not cr.startswith('*/0'):
                print(f"Kunjungan {yr}-{m_str} ({d_start}-{d_end}) -> {st[1]}: {cr}")

# Cek sisa unassigned
r_sisa_kunj = requests.get(f'{SUPABASE_URL}/rest/v1/kunjungan?created_by=is.null&select=count', headers={**headers, 'Range': '0-0', 'Prefer': 'count=exact'}).headers
r_sisa_lab = requests.get(f'{SUPABASE_URL}/rest/v1/lab_permintaan?selesai_oleh=is.null&select=count', headers={**headers, 'Range': '0-0', 'Prefer': 'count=exact'}).headers
print('\n=== HASIL AKHIR PENUGASAN ===')
print('Kunjungan tanpa petugas:', r_sisa_kunj.get('Content-Range'))
print('Lab permintaan tanpa analis:', r_sisa_lab.get('Content-Range'))
