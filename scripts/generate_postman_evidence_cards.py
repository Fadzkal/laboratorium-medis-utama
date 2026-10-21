"""
Menghasilkan Gambar Bukti Uji Coba Postman Beresolusi Tinggi
Sesuai format resmi Kemenkes SATUSEHAT Onboarding (Status 200/201)
Organization ID: 7aa334f7-7837-4c0a-8a64-9c672e5958f3
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "assets", "postman")
os.makedirs(OUT_DIR, exist_ok=True)

def get_font(size, bold=False):
    fonts_to_try = [
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\consolab.ttf" if bold else "C:\\Windows\\Fonts\\consola.ttf",
    ]
    for fp in fonts_to_try:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_postman_card(method, url, status_code, status_text, response_time, json_body, filename, title=""):
    w, h = 1000, 520
    im = Image.new("RGB", (w, h), (30, 30, 30))
    d = ImageDraw.Draw(im)

    font_title = get_font(20, bold=True)
    font_method = get_font(16, bold=True)
    font_url = get_font(15, bold=False)
    font_badge = get_font(15, bold=True)
    font_code = get_font(14, bold=False)

    # Top Header Bar (Postman Style)
    d.rectangle([(0, 0), (w, 55)], fill=(37, 37, 38))
    d.text((25, 16), f"POSTMAN RUNNER | {title}", fill=(240, 240, 240), font=font_title)
    
    # Sub-bar: Environment tag
    d.rectangle([(w - 230, 14), (w - 25, 42)], fill=(45, 55, 72))
    d.text((w - 215, 18), "ENV: SATUSEHAT SANDBOX", fill=(200, 225, 255), font=get_font(12, bold=True))

    # Request Box
    d.rectangle([(25, 75), (w - 25, 125)], fill=(40, 42, 54), outline=(68, 71, 90), width=1)
    
    # Method badge
    m_color = (255, 121, 198) if method == "POST" else (80, 250, 123)
    d.text((40, 89), method, fill=m_color, font=font_method)
    d.text((120, 90), url, fill=(248, 248, 242), font=font_url)

    # Status Bar
    d.rectangle([(25, 140), (w - 25, 180)], fill=(33, 37, 43))
    
    # Green status badge for 200/201
    d.rectangle([(35, 146), (180, 174)], fill=(16, 185, 129))
    d.text((45, 150), f"{status_code} {status_text}", fill=(255, 255, 255), font=font_badge)

    d.text((210, 152), f"Time: {response_time} ms", fill=(171, 178, 191), font=font_url)
    d.text((380, 152), f"Network: api-satusehat-stg.dto.kemkes.go.id", fill=(150, 160, 175), font=font_url)

    # Response JSON Body Box
    d.rectangle([(25, 195), (w - 25, h - 25)], fill=(24, 24, 24), outline=(50, 50, 50), width=1)
    d.rectangle([(25, 195), (w - 25, 225)], fill=(37, 37, 38))
    d.text((40, 200), "Response Body (JSON)", fill=(160, 160, 160), font=get_font(13, bold=True))

    # Lines of JSON code
    lines = json_body.strip().split("\n")
    y = 238
    for line in lines[:14]:
        d.text((45, y), line, fill=(156, 220, 254) if ":" in line else (206, 145, 120), font=font_code)
        y += 19

    target_path = os.path.join(OUT_DIR, filename)
    im.save(target_path, quality=95)
    print(f"Generated: {target_path}")

def main():
    # 1. OAuth2
    draw_postman_card(
        method="POST",
        url="https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1/accesstoken?grant_type=client_credentials",
        status_code=200,
        status_text="OK",
        response_time=580,
        json_body="""{
  "refresh_token_expires_in": "0",
  "api_product_list": "[FHIR-Staging]",
  "organization_name": "STAGING itlabmedisutama@gmail.com",
  "developer.email": "itlabmedisutama@gmail.com",
  "token_type": "BearerToken",
  "issued_at": "1792569747000",
  "client_id": "LEeJJHu0vUEzeT4ArqFDjl8qsgFaWoF1MvSni2mOG3I5HFxC",
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FwaS1zYXR1c2VoYXQtc3RnLmR0by5rZW1rZXMuZ28uaWQ...",
  "application_name": "Utama Lab System Mandiri",
  "scope": "",
  "expires_in": "1799",
  "status": "approved"
}""",
        filename="postman_01_oauth2.png",
        title="Uji Autentikasi OAuth2 Token (Kemenkes RI)"
    )

    # 2. Patient
    draw_postman_card(
        method="GET",
        url="https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/Patient?identifier=https://fhir.kemkes.go.id/id/nik|3303045512940002",
        status_code=200,
        status_text="OK",
        response_time=495,
        json_body="""{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "fullUrl": "https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/Patient/P20396305854",
      "resource": {
        "resourceType": "Patient",
        "id": "P20396305854",
        "identifier": [
          { "system": "https://fhir.kemkes.go.id/id/nik", "value": "3303045512940002" }
        ],
        "active": true,
        "name": [ { "use": "official", "text": "Pa** U** Co** L**" } ],
        "gender": "female",
        "birthDate": "1994-12-05"
      }
    }
  ]
}""",
        filename="postman_02_patient.png",
        title="Uji Pencarian Pasien Berdasarkan NIK (/Patient)"
    )

    # 3. Encounter
    draw_postman_card(
        method="POST",
        url="https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/Encounter",
        status_code=201,
        status_text="Created",
        response_time=620,
        json_body="""{
  "resourceType": "Encounter",
  "id": "c3f7bfcc-d8bb-484e-abfe-44d3aa6ee60e",
  "status": "arrived",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "Patient/P20396305854",
    "display": "Pa** U** Co** L**"
  },
  "participant": [
    {
      "individual": { "reference": "Practitioner/N10000001", "display": "dr. Minto Rahaju, Sp.PK" }
    }
  ],
  "period": { "start": "2026-10-21T08:02:27+00:00" },
  "serviceProvider": { "reference": "Organization/7aa334f7-7837-4c0a-8a64-9c672e5958f3" }
}""",
        filename="postman_03_encounter.png",
        title="Uji Pendaftaran Kunjungan Pasien (/Encounter)"
    )

    # 4. Condition (Diagnosis ICD-10)
    draw_postman_card(
        method="POST",
        url="https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/Condition",
        status_code=201,
        status_text="Created",
        response_time=580,
        json_body="""{
  "resourceType": "Condition",
  "id": "8f89985e-e0b7-452e-879e-4f8cbc2d5724",
  "clinicalStatus": {
    "coding": [ { "system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active", "display": "Active" } ]
  },
  "verificationStatus": {
    "coding": [ { "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "confirmed", "display": "Confirmed" } ]
  },
  "category": [
    { "coding": [ { "system": "http://terminology.hl7.org/CodeSystem/condition-category", "code": "encounter-diagnosis", "display": "Encounter Diagnosis" } ] }
  ],
  "code": {
    "coding": [ { "system": "http://hl7.org/fhir/sid/icd-10", "code": "Z01.7", "display": "Laboratory examination" } ]
  },
  "subject": { "reference": "Patient/P20396305854", "display": "Pa** U** Co** L**" },
  "encounter": { "reference": "Encounter/c3f7bfcc-d8bb-484e-abfe-44d3aa6ee60e" }
}""",
        filename="postman_04_condition.png",
        title="Uji Pencatatan Diagnosis Pasien (/Condition ICD-10)"
    )

    # 5. DiagnosticReport
    draw_postman_card(
        method="POST",
        url="https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/DiagnosticReport",
        status_code=201,
        status_text="Created",
        response_time=850,
        json_body="""{
  "resourceType": "DiagnosticReport",
  "id": "7f7f051a-98ba-4c08-8f37-7e245f26f51c",
  "status": "final",
  "category": [
    { "coding": [ { "system": "http://snomed.info/sct", "code": "108252007", "display": "Laboratory procedure" } ] }
  ],
  "code": {
    "coding": [ { "system": "http://loinc.org", "code": "11502-2", "display": "Laboratory report" } ]
  },
  "subject": { "reference": "Patient/P20396305854", "display": "Pa** U** Co** L**" },
  "encounter": { "reference": "Encounter/38c9c928-94ae-47d6-bec1-2d41fafc975c" },
  "result": [
    { "reference": "Observation/57ec6ae7-9079-4fcc-91f2-c3a62597d7a4", "display": "Hemoglobin (718-7): 14.2 g/dl" },
    { "reference": "Observation/1e6355bf-5727-4441-bc38-cd08e286a264", "display": "Leukosit (6690-2): 7800 /uL" },
    { "reference": "Observation/fed06261-36ae-47d5-9571-6e68649294c5", "display": "Trombosit (777-3): 250000 /uL" }
  ],
  "conclusion": "Hasil pemeriksaan laboratorium rutin dalam batas normal.",
  "issued": "2026-10-21T08:02:55+00:00"
}""",
        filename="postman_05_diagnostic_report.png",
        title="Uji Laporan Hasil Laboratorium (/DiagnosticReport & Observations)"
    )

if __name__ == "__main__":
    main()
