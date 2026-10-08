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

k_id = "0d584c61-808a-4535-adab-b6f1be0c16f0" # Ach Miharjo test visit 20261006-0001

# 1. Check lab_permintaan
r_lp = requests.get(f"{SUPABASE_URL}/rest/v1/lab_permintaan?kunjungan_id=eq.{k_id}", headers=headers)
lp_list = r_lp.json()
print("Found lab_permintaan:", len(lp_list))
for lp in lp_list:
    pid = lp["id"]
    requests.delete(f"{SUPABASE_URL}/rest/v1/lab_hasil?permintaan_id=eq.{pid}", headers=headers)
    requests.delete(f"{SUPABASE_URL}/rest/v1/lab_fisik?permintaan_id=eq.{pid}", headers=headers)
    requests.delete(f"{SUPABASE_URL}/rest/v1/lab_anamnesa?permintaan_id=eq.{pid}", headers=headers)
    r_del_lp = requests.delete(f"{SUPABASE_URL}/rest/v1/lab_permintaan?id=eq.{pid}", headers=headers)
    print("Delete lab_permintaan:", r_del_lp.status_code)

# 2. Check antrean
r_ant = requests.delete(f"{SUPABASE_URL}/rest/v1/antrean?kunjungan_id=eq.{k_id}", headers=headers)
print("Delete antrean:", r_ant.status_code)

# 3. Check kasir (if any)
requests.delete(f"{SUPABASE_URL}/rest/v1/kasir_item?kunjungan_id=eq.{k_id}", headers=headers)
requests.delete(f"{SUPABASE_URL}/rest/v1/kasir_pembayaran?kunjungan_id=eq.{k_id}", headers=headers)
requests.delete(f"{SUPABASE_URL}/rest/v1/kasir_tagihan?kunjungan_id=eq.{k_id}", headers=headers)

# 4. Check resep & surat (if any)
requests.delete(f"{SUPABASE_URL}/rest/v1/resep?kunjungan_id=eq.{k_id}", headers=headers)
requests.delete(f"{SUPABASE_URL}/rest/v1/surat?kunjungan_id=eq.{k_id}", headers=headers)

# 5. Delete kunjungan
r_del_k = requests.delete(f"{SUPABASE_URL}/rest/v1/kunjungan?id=eq.{k_id}", headers=headers)
print("Delete kunjungan status:", r_del_k.status_code, r_del_k.text)

# Check if patient Ach Miharjo still exists!
r_pasien = requests.get(f"{SUPABASE_URL}/rest/v1/pasien?id=eq.bad1adb8-2aab-44cb-a19d-04ee687d2659", headers=headers)
print("Pasien Ach Miharjo still exists?:", len(r_pasien.json()) > 0, r_pasien.json()[0]["nama"] if r_pasien.json() else None)
