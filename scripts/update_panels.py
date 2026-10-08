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

panels = [
    ("H010107", "72826-1", "Leukocyte differential panel - Blood", "119297000", "Blood specimen"),
    ("H010108", "54228-2", "Erythrocyte indices panel - Blood", "119297000", "Blood specimen"),
    ("U010113", "24124-0", "Microscopic observation in Urine sediment", "122575003", "Urine specimen"),
    ("U01011304", "24124-0", "Casts in Urine sediment by Microscopy", "122575003", "Urine specimen"),
    ("U01011307", "18086-9", "Other microscopic findings in Urine sediment", "122575003", "Urine specimen"),
]
for k, loinc, disp, sc, sn in panels:
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/ref_lab?kode=eq.{k}",
        headers=headers,
        json={"kode_loinc": loinc, "display_loinc": disp, "kode_specimen": sc, "nama_specimen": sn}
    )
    print(f"Update {k}: {r.status_code}")
print("Done updating panel headers.")
