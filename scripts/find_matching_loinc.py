"""
Cari dan Verifikasi Kode Alternatif LOINC yang Diterima Kemenkes SATUSEHAT
"""
import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.join(parent_dir, "bridge"))

import satusehat_bridge

CANDIDATES = {
    # 1. Ureum
    "Ureum": [
        ("3091-6", "Blood urea nitrogen [Mass/volume] in Serum or Plasma"),
        ("20977-5", "Urea nitrogen [Mass/volume] in Serum or Plasma"),
        ("3094-0", "Urea [Moles/volume] in Serum or Plasma"),
        ("14937-7", "Urea [Mass/volume] in Serum or Plasma"),
    ],
    # 2. Glukosa 2 Jam PP
    "Glukosa 2 Jam PP": [
        ("2345-7", "Glucose [Mass/volume] in Serum or Plasma"),
        ("1514-9", "Glucose 2 hours post 75 g glucose PO [Mass/volume] in Serum or Plasma"),
        ("14771-0", "Glucose 2 hours post meal [Mass/volume] in Serum or Plasma"),
    ],
    # 3. Fibrinogen
    "Fibrinogen": [
        ("3254-8", "Fibrinogen [Mass/volume] in Platelet poor plasma by Coagulation assay"),
        ("30180-4", "Fibrinogen [Mass/volume] in Platelet poor plasma"),
        ("48664-7", "Fibrinogen [Mass/volume] in Platelet poor plasma by Clauss method"),
    ],
    # 4. Bleeding Time
    "Bleeding Time": [
        ("3188-8", "Bleeding time by Ivy"),
        ("3189-6", "Bleeding time by Duke"),
        ("48664-7", "Bleeding time"),
    ],
    # 5. Clotting Time
    "Clotting Time": [
        ("3185-4", "Clotting time of Blood by Lee-White"),
        ("3184-7", "Clotting time of Blood"),
    ],
    # 6. TSH
    "TSH": [
        ("11580-8", "Thyrotropin [Units/volume] in Serum or Plasma"),
        ("11579-0", "Thyrotropin [Units/volume] in Serum or Plasma by Immunoassay"),
        ("3016-3", "Thyrotropin [Units/volume] in Serum or Plasma"),
    ],
    # 7. PSA Total
    "PSA Total": [
        ("10886-0", "Prostate specific Ag [Mass/volume] in Serum or Plasma"),
        ("19195-7", "Prostate specific Ag [Mass/volume] in Serum or Plasma by Immunoassay"),
    ],
    # 8. CEA
    "CEA": [
        ("1987-7", "Carcinoembryonic Ag [Mass/volume] in Serum or Plasma"),
        ("2039-6", "Carcinoembryonic Ag [Mass/volume] in Serum or Plasma"),
    ],
    # 9. Rheumatoid Factor (RF)
    "Rheumatoid Factor": [
        ("5308-2", "Rheumatoid factor [Units/volume] in Serum"),
        ("4481-9", "Rheumatoid factor [Units/volume] in Serum or Plasma by Latex agglutination"),
    ],
    # 10. ASTO
    "ASTO": [
        ("5041-9", "Streptolysin O Ab [Units/volume] in Serum"),
        ("7914-5", "Streptolysin O Ab [Units/volume] in Serum by Latex agglutination"),
    ],
    # 11. Rubella IgG
    "Rubella IgG": [
        ("5334-8", "Rubella virus IgG Ab [Units/volume] in Serum"),
        ("41763-4", "Rubella virus IgG Ab [Units/volume] in Serum by Immunoassay"),
    ],
    # 12. Rubella IgM
    "Rubella IgM": [
        ("5335-5", "Rubella virus IgM Ab [Units/volume] in Serum"),
        ("41764-2", "Rubella virus IgM Ab [Units/volume] in Serum by Immunoassay"),
    ],
    # 13. CMV IgM
    "CMV IgM": [
        ("5125-0", "Cytomegalovirus IgM Ab [Units/volume] in Serum"),
        ("13949-3", "Cytomegalovirus IgM Ab [Units/volume] in Serum by Immunoassay"),
    ],
    # 14. Toxoplasma IgM
    "Toxoplasma IgM": [
        ("8039-0", "Toxoplasma gondii IgM Ab [Units/volume] in Serum"),
        ("22580-5", "Toxoplasma gondii IgM Ab [Units/volume] in Serum"),
    ],
    # 15. HSV 1 IgM
    "HSV 1 IgM": [
        ("5194-6", "Herpes simplex virus 1 IgM Ab [Units/volume] in Serum"),
        ("6356-0", "Herpes simplex virus 1 IgM Ab [Units/volume] in Serum by Immunoassay"),
    ],
    # 16. Dengue IgM
    "Dengue IgM": [
        ("49755-2", "Dengue virus IgM Ab [Units/volume] in Serum"),
        ("51915-7", "Dengue virus IgM Ab [Presence] in Serum by Rapid immunoassay"),
    ],
    # 17. Widal S. Typhi H
    "Widal S. Typhi H": [
        ("7552-0", "Salmonella enterica serovar Typhi H Ab [Titer] in Serum"),
        ("23007-8", "Salmonella enterica serovar Typhi H Ab [Titer] in Serum"),
    ],
    # 18. Cocaine Urine
    "Cocaine": [
        ("14314-9", "Cocaine [Presence] in Urine by Screen test"),
        ("19360-7", "Cocaine metabolite [Presence] in Urine by Screen test"),
    ],
    # 19. BTA Sputum
    "BTA Sputum": [
        ("11475-1", "Mycobacterium sp identified in Sputum by Acid fast stain"),
        ("20508-8", "Mycobacterium sp identified in Sputum by Acid fast stain"),
    ],
    # 20. Casts / Silinder Sedimen Urin
    "Casts / Silinder": [
        ("24124-0", "Casts [#/area] in Urine sediment by Microscopy high power field"),
        ("5802-4", "Casts in Urine sediment"),
    ],
    # 21. Kultur Darah
    "Kultur Darah": [
        ("17928-3", "Bacteria identified in Blood by Culture"),
        ("43410-0", "Bacteria identified in Blood by Culture"),
    ]
}

patient_ref = "Patient/P20396305854"
encounter_ref = "Encounter/47da21f6-f368-4510-aa19-7fb780b1202b"

print("=================================================================")
print("PENGUJIAN KANDIDAT KODE LOINC TERHADAP KEMENKES SATUSEHAT")
print("=================================================================")

accepted_map = {}

for label, candidates in CANDIDATES.items():
    found = False
    for code, disp in candidates:
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
                    "display": disp
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
            print(f"[PASSED] {label:20s} -> LOINC {code:10s} ({disp})")
            accepted_map[label] = (code, disp)
            found = True
            break
        else:
            err = ""
            try:
                err = resp.get("data", {}).get("issue", [{}])[0].get("details", {}).get("text", "")
            except:
                err = str(resp.get("data"))
            # print(f"  [x] {code}: {err[:60]}")
    if not found:
        print(f"[RETRY NEEDED] {label:20s} -> Tidak ada yang tembus!")

print("\n--- HASIL PEMETAAN YANG BERHASIL LOLOS ---")
for k, v in accepted_map.items():
    print(f"  {k:20s}: LOINC '{v[0]}' ({v[1]})")
