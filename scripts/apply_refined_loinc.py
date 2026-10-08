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

REFINED_UPDATES = {
    # LED
    "H010106": ("30341-2", "Erythrocyte sedimentation rate by Westergren method"),
    "H01010601": ("30341-2", "Erythrocyte sedimentation rate by Westergren method"),
    "LED": ("30341-2", "Erythrocyte sedimentation rate by Westergren method"),
    "H01010602": ("4537-7", "Erythrocyte sedimentation rate by Automated count"),
    
    # Ureum
    "K0329": ("3091-6", "Blood urea nitrogen [Mass/volume] in Serum or Plasma"),
    "UR": ("3091-6", "Blood urea nitrogen [Mass/volume] in Serum or Plasma"),
    "UREUM": ("3091-6", "Blood urea nitrogen [Mass/volume] in Serum or Plasma"),
    
    # Glukosa 2 Jam PP
    "K0327": ("2345-7", "Glucose [Mass/volume] in Serum or Plasma"),
    "GD2PP": ("2345-7", "Glucose [Mass/volume] in Serum or Plasma"),
    
    # Koagulasi & Hemostasis
    "H0113": ("30180-4", "Fibrinogen [Mass/volume] in Platelet poor plasma"),
    "H0109": ("48664-7", "Bleeding time"),
    "H0110": ("5964-2", "Clotting time of Blood"),
    
    # Tiroid & Tumor Marker
    "I0214": ("11580-8", "Thyrotropin [Units/volume] in Serum or Plasma"),
    "TSH": ("11580-8", "Thyrotropin [Units/volume] in Serum or Plasma"),
    "I0234": ("10886-0", "Prostate specific Ag [Mass/volume] in Serum or Plasma"),
    "I0229": ("1987-7", "Carcinoembryonic Ag [Mass/volume] in Serum or Plasma"),
    
    # Serologi & Reumatik
    "I0227": ("5308-2", "Rheumatoid factor [Units/volume] in Serum"),
    "RF": ("5308-2", "Rheumatoid factor [Units/volume] in Serum"),
    "I0224": ("5041-9", "Streptolysin O Ab [Units/volume] in Serum"),
    "ASTO": ("5041-9", "Streptolysin O Ab [Units/volume] in Serum"),
    
    # TORCH & Virus
    "I0238": ("5334-8", "Rubella virus IgG Ab [Units/volume] in Serum"),
    "I0237": ("5335-5", "Rubella virus IgM Ab [Units/volume] in Serum"),
    "I0239": ("5125-0", "Cytomegalovirus IgM Ab [Units/volume] in Serum"),
    "I0235": ("8039-0", "Toxoplasma gondii IgM Ab [Units/volume] in Serum"),
    "I0241": ("5194-6", "Herpes simplex virus 1 IgM Ab [Units/volume] in Serum"),
    "I028602": ("49755-2", "Dengue virus IgM Ab [Units/volume] in Serum"),
    "I022805": ("23007-8", "Salmonella enterica serovar Typhi H Ab [Titer] in Serum"),
    "W010102": ("23007-8", "Salmonella enterica serovar Typhi H Ab [Titer] in Serum"),
    
    # Urinalisis & Narkoba
    "U014404": ("14314-9", "Cocaine [Presence] in Urine by Screen test"),
    "COC": ("14314-9", "Cocaine [Presence] in Urine by Screen test"),
    "U0119": ("2106-3", "Choriogonadotropin (pregnancy test) [Presence] in Urine"),
    "U01011304": ("24124-0", "Casts [#/area] in Urine sediment by Microscopy high power field"),
    "U0101130401": ("24124-0", "Casts [#/area] in Urine sediment by Microscopy high power field"),
    "U0101130402": ("24124-0", "Casts [#/area] in Urine sediment by Microscopy high power field"),
    "U0101130403": ("24124-0", "Casts [#/area] in Urine sediment by Microscopy high power field"),
    "U0101130404": ("24124-0", "Casts [#/area] in Urine sediment by Microscopy high power field"),
    
    # Mikrobiologi
    "M0101": ("11475-1", "Mycobacterium sp identified in Sputum by Acid fast stain"),
    "M0119": ("17928-3", "Bacteria identified in Blood by Culture"),
}

berhasil = 0
for kode, (loinc, disp) in REFINED_UPDATES.items():
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/ref_lab?kode=eq.{kode}",
        headers=headers,
        json={"kode_loinc": loinc, "display_loinc": disp}
    )
    if r.status_code in [200, 204]:
        berhasil += 1
    else:
        print(f"Gagal update {kode}: {r.text}")

print(f"Berhasil memperbarui {berhasil} kode LOINC terverifikasi ke Supabase.")
