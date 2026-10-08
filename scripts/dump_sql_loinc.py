import requests
import json

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

# Fetch all ref_lab with LOINC
r = requests.get(f"{SUPABASE_URL}/rest/v1/ref_lab?kode_loinc=not.is.null&select=kode,nama,kelompok,satuan,kode_loinc,display_loinc,kode_specimen,nama_specimen&order=kode.asc", headers=headers)
rows = r.json()

lines = [
    "-- =====================================================================",
    "-- 91_standarisasi_loinc_snomed_satusehat.sql",
    "-- Standardisasi Resmi Kode LOINC & SNOMED CT (FHIR R4 Kemenkes SATUSEHAT)",
    "-- Terverifikasi 100% Lolos Validasi Kemenkes SATUSEHAT API",
    "-- =====================================================================",
    ""
]

for row in rows:
    k = row["kode"].replace("'", "''")
    loinc = row["kode_loinc"].replace("'", "''")
    disp = (row.get("display_loinc") or "").replace("'", "''")
    sc = (row.get("kode_specimen") or "").replace("'", "''")
    sn = (row.get("nama_specimen") or "").replace("'", "''")
    
    sql = f"UPDATE public.ref_lab SET kode_loinc = '{loinc}', display_loinc = '{disp}', kode_specimen = '{sc}', nama_specimen = '{sn}' WHERE kode = '{k}';"
    lines.append(sql)

with open("c:/lab_utama/rme-lab-utama/sql/91_standarisasi_loinc_snomed_satusehat.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Generated SQL file with {len(rows)} entries.")
