"""
VALIDATOR SEMUA KODE LOINC TERHADAP KEMENKES SATUSEHAT SANDBOX
"""
import requests
import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.join(parent_dir, "bridge"))

import satusehat_bridge

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

# Fetch all distinct LOINC codes in ref_lab
r = requests.get(f"{SUPABASE_URL}/rest/v1/ref_lab?kode_loinc=not.is.null&select=kode,nama,kode_loinc,display_loinc&limit=1000", headers=headers)
rows = r.json()

unique_loincs = {}
for x in rows:
    code = x["kode_loinc"].strip()
    if code not in unique_loincs:
        unique_loincs[code] = {"display": x.get("display_loinc") or x["nama"], "example_kodes": [x["kode"]]}
    else:
        unique_loincs[code]["example_kodes"].append(x["kode"])

print(f"Total Unique LOINC codes in database: {len(unique_loincs)}")

# Test each LOINC code against SatuSehat Observation schema
patient_ref = "Patient/P20396305854"
encounter_ref = "Encounter/47da21f6-f368-4510-aa19-7fb780b1202b"

failed = []
passed = []

for code, info in unique_loincs.items():
    payload = {
        "resourceType": "Observation",
        "status": "final",
        "category": [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "laboratory",
                "display": "Laboratory"
            }]
        }],
        "code": {
            "coding": [{
                "system": "http://loinc.org",
                "code": code,
                "display": info["display"]
            }]
        },
        "subject": {"reference": patient_ref},
        "encounter": {"reference": encounter_ref},
        "effectiveDateTime": satusehat_bridge.format_utc(),
        "issued": satusehat_bridge.format_utc(),
        "performer": [{"reference": "Practitioner/N10000001"}],
        "valueString": "Normal"
    }
    resp = satusehat_bridge.fhir_request("POST", "/Observation", data=payload)
    if resp.get("ok"):
        passed.append(code)
    else:
        err_msg = ""
        try:
            err_msg = resp.get("data", {}).get("issue", [{}])[0].get("details", {}).get("text", "")
        except:
            err_msg = str(resp.get("data"))
        failed.append((code, info["display"], info["example_kodes"], err_msg))

print(f"\nVALIDATION SUMMARY:")
print(f"PASSED (HTTP 201): {len(passed)}")
print(f"FAILED          : {len(failed)}")

if failed:
    print("\nFAILED LOINC CODES:")
    for c, d, k, err in failed:
        print(f"  LOINC {c} ({d}) [Codes: {k}] -> {err}")
else:
    print("\nALL LOINC CODES ARE 100% VALID IN KEMENKES SATUSEHAT!")
