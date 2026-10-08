"""
=============================================================================
MODUL BRIDGING SATUSEHAT SANDBOX / PRODUCTION
LABORATORIUM MEDIS UTAMA
=============================================================================
Menangani komunikasi langsung ke Platform SATUSEHAT Kemenkes (HL7 FHIR R4):
- Autentikasi OAuth2 (Token caching otomatis)
- Pencarian Pasien berdasarkan NIK (/Patient)
- Pencarian Nakes/Practitioner berdasarkan NIK (/Practitioner)
- Pembuatan & Pengelolaan Location (/Location)
- Pendaftaran Kunjungan Laboratorium (/Encounter)
- Pengiriman Hasil Uji Laboratorium (/Observation & /DiagnosticReport)
=============================================================================
"""

import os
import json
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger("SATUSEHAT_BRIDGE")

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "satusehat_config.json")

# Default template jika file belum ada
DEFAULT_CONFIG = {
    "environment": "SANDBOX",
    "auth_url": "https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1",
    "base_url": "https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1",
    "organization_id": "6a80f69d-2493-422a-b0ac-ca2b5bea38dd",
    "client_id": "",
    "client_secret": "",
    "default_location_id": ""
}

# Cache token di memori
_token_cache: Dict[str, Any] = {
    "access_token": None,
    "expires_at": 0
}


def muat_config() -> Dict[str, Any]:
    """Membaca konfigurasi SATUSEHAT dari file JSON lokal"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                cfg = dict(DEFAULT_CONFIG)
                cfg.update(data)
                return cfg
        except Exception as e:
            logger.error(f"Gagal membaca satusehat_config.json: {e}")
    return dict(DEFAULT_CONFIG)


def simpan_config(cfg: Dict[str, Any]) -> bool:
    """Menyimpan pembaruan konfigurasi SATUSEHAT ke file JSON lokal"""
    try:
        current = muat_config()
        current.update(cfg)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(current, f, indent=2, ensure_ascii=False)
        # Reset cache token jika kredensial berubah
        _token_cache["access_token"] = None
        _token_cache["expires_at"] = 0
        return True
    except Exception as e:
        logger.error(f"Gagal menyimpan satusehat_config.json: {e}")
        return False


def get_access_token(force_refresh: bool = False) -> str:
    """Mengambil atau memperbarui OAuth2 Bearer Access Token"""
    now = time.time()
    if not force_refresh and _token_cache["access_token"] and now < (_token_cache["expires_at"] - 60):
        return _token_cache["access_token"]

    cfg = muat_config()
    client_id = cfg.get("client_id", "").strip()
    client_secret = cfg.get("client_secret", "").strip()
    auth_url = cfg.get("auth_url", "").strip().rstrip("/")

    if not client_id or not client_secret:
        raise ValueError("Client ID atau Client Secret SATUSEHAT belum diisi. Lengkapi di konfigurasi.")

    url = f"{auth_url}/accesstoken?grant_type=client_credentials"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    resp = requests.post(url, data=payload, headers=headers, timeout=12)
    if resp.status_code != 200:
        err_msg = f"HTTP {resp.status_code}: {resp.text}"
        try:
            j = resp.json()
            if "message" in j:
                err_msg = j["message"]
            elif "error_description" in j:
                err_msg = j["error_description"]
        except Exception:
            pass
        raise RuntimeError(f"Gagal generate token SATUSEHAT: {err_msg}")

    res_json = resp.json()
    token = res_json.get("access_token")
    expires_in = int(res_json.get("expires_in", 3500))

    if not token:
        raise RuntimeError("Response OAuth2 tidak menyertakan access_token.")

    _token_cache["access_token"] = token
    _token_cache["expires_at"] = now + expires_in
    logger.info("SATUSEHAT OAuth2 token berhasil diperbarui.")
    return token


def fhir_request(method: str, path: str, data: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Helper untuk memanggil endpoint FHIR R4 dengan Bearer Token"""
    cfg = muat_config()
    base_url = cfg.get("base_url", "").strip().rstrip("/")
    if not base_url:
        raise ValueError("Base URL SATUSEHAT belum dikonfigurasi.")

    token = get_access_token()
    clean_path = path if path.startswith("/") else f"/{path}"
    full_url = f"{base_url}{clean_path}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json"
    }

    resp = requests.request(
        method=method.upper(),
        url=full_url,
        headers=headers,
        json=data if data is not None else None,
        params=params,
        timeout=15
    )

    try:
        res_json = resp.json()
    except Exception:
        res_json = {"raw": resp.text}

    return {
        "status_code": resp.status_code,
        "ok": resp.ok,
        "data": res_json
    }


def uji_koneksi() -> Dict[str, Any]:
    """Menguji kredensial token dan memverifikasi Organization ID"""
    cfg = muat_config()
    token = get_access_token(force_refresh=True)
    org_id = cfg.get("organization_id", "").strip()

    info_org = None
    if org_id:
        try:
            r_org = fhir_request("GET", f"/Organization/{org_id}")
            if r_org["ok"]:
                info_org = r_org["data"]
        except Exception as e:
            logger.warning(f"Cek Organization ID gagal: {e}")

    return {
        "sukses": True,
        "pesan": "Koneksi ke SATUSEHAT Sandbox berhasil terverifikasi!",
        "environment": cfg.get("environment", "SANDBOX"),
        "organization_id": org_id,
        "org_detail": info_org,
        "token_snippet": token[:10] + "..." + token[-6:] if token else ""
    }


def cari_pasien_nik(nik: str) -> Dict[str, Any]:
    """Mencari Patient IHS ID berdasarkan 16 digit NIK"""
    nik_bersih = str(nik).strip()
    if not nik_bersih or len(nik_bersih) != 16:
        raise ValueError("NIK harus berupa 16 digit angka.")

    cfg = muat_config()
    sys_nik = "https://fhir.kemkes.go.id/id/nik"
    r = fhir_request("GET", "/Patient", params={"identifier": f"{sys_nik}|{nik_bersih}"})
    if not r["ok"]:
        return {
            "ditemukan": False,
            "pesan": f"Gagal mencari pasien (HTTP {r['status_code']}): {r.get('data')}",
            "raw": r
        }

    bundle = r.get("data", {})
    total = bundle.get("total", 0)
    entries = bundle.get("entry", [])

    if total == 0 or not entries:
        # Di lingkungan Sandbox, otomatis daftarkan Pasien jika belum tercatat di Staging Kemenkes
        if cfg.get("environment") == "SANDBOX":
            try:
                reg_payload = {
                    "resourceType": "Patient",
                    "meta": {
                        "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Patient"]
                    },
                    "identifier": [
                        {
                            "use": "official",
                            "system": "https://fhir.kemkes.go.id/id/nik",
                            "value": nik_bersih
                        }
                    ],
                    "active": True,
                    "name": [{"use": "official", "text": "Pasien Uji Coba Lab"}],
                    "telecom": [{"system": "phone", "value": "081234567890", "use": "mobile"}],
                    "gender": "female",
                    "birthDate": "1994-12-05",
                    "deceasedBoolean": False,
                    "address": [{
                        "use": "home",
                        "line": ["Jl. D.I. Panjaitan No. 94"],
                        "city": "Purbalingga",
                        "postalCode": "53311",
                        "country": "ID",
                        "extension": [{
                            "url": "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode",
                            "extension": [
                                {"url": "province", "valueCode": "33"},
                                {"url": "city", "valueCode": "3303"},
                                {"url": "district", "valueCode": "330301"},
                                {"url": "village", "valueCode": "3303012001"},
                                {"url": "rt", "valueCode": "001"},
                                {"url": "rw", "valueCode": "002"}
                            ]
                        }]
                    }],
                    "maritalStatus": {
                        "coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus", "code": "M", "display": "Married"}]
                    },
                    "multipleBirthBoolean": False
                }
                reg_r = fhir_request("POST", "/Patient", data=reg_payload)
                if reg_r["ok"]:
                    p_res = reg_r["data"]
                    ihs_res = p_res.get("id")
                    logger.info(f"Pasien NIK {nik_bersih} otomatis didaftarkan di Sandbox: {ihs_res}")
                    return {
                        "sukses": True,
                        "ditemukan": True,
                        "nik": nik_bersih,
                        "ihs_id": ihs_res,
                        "nama": "Pasien Uji Coba Lab",
                        "gender": "female",
                        "birthDate": "1994-12-05",
                        "resource": p_res,
                        "baru_didaftarkan": True
                    }
            except Exception as eReg:
                logger.warning(f"Otomasi registrasi pasien Sandbox gagal: {eReg}")

        return {
            "sukses": False,
            "ditemukan": False,
            "nik": nik_bersih,
            "pesan": "Pasien dengan NIK tersebut tidak ditemukan di SATUSEHAT Sandbox."
        }

    patient = entries[0].get("resource", {})
    ihs_id = patient.get("id")
    nama = "-"
    if patient.get("name") and len(patient["name"]) > 0:
        nama = patient["name"][0].get("text") or " ".join(patient["name"][0].get("given", []))

    return {
        "sukses": True,
        "ditemukan": True,
        "nik": nik_bersih,
        "ihs_id": ihs_id,
        "nama": nama,
        "gender": patient.get("gender"),
        "birthDate": patient.get("birthDate"),
        "resource": patient
    }


def cari_nakes_nik(nik: str) -> Dict[str, Any]:
    """Mencari Practitioner (Dokter/Analis) IHS ID berdasarkan NIK"""
    nik_bersih = str(nik).strip()
    sys_nik = "https://fhir.kemkes.go.id/id/nik"
    r = fhir_request("GET", "/Practitioner", params={"identifier": f"{sys_nik}|{nik_bersih}"})
    if not r["ok"]:
        return {"ditemukan": False, "pesan": f"Gagal mencari praktisi (HTTP {r['status_code']})"}

    entries = r.get("data", {}).get("entry", [])
    if not entries:
        return {"ditemukan": False, "nik": nik_bersih, "pesan": "Practitioner tidak ditemukan."}

    prac = entries[0].get("resource", {})
    ihs_id = prac.get("id")
    nama = "-"
    if prac.get("name") and len(prac["name"]) > 0:
        nama = prac["name"][0].get("text") or " ".join(prac["name"][0].get("given", []))

    return {
        "ditemukan": True,
        "nik": nik_bersih,
        "ihs_id": ihs_id,
        "nama": nama,
        "resource": prac
    }


def format_utc(dt_val: Optional[datetime] = None) -> str:
    """Format waktu ISO 8601 UTC (Wajib UTC untuk Kemenkes SATUSEHAT)"""
    if dt_val is None:
        dt_val = datetime.now(timezone.utc)
    elif dt_val.tzinfo is None:
        dt_val = dt_val.astimezone(timezone.utc)
    return dt_val.strftime("%Y-%m-%dT%H:%M:%S+00:00")


def kirim_encounter_lab(
    no_lab: str,
    patient_ihs: str,
    patient_name: str,
    practitioner_ihs: str = "",
    practitioner_name: str = "",
    location_ihs: str = "",
    status: str = "arrived"
) -> Dict[str, Any]:
    """
    Mencatat kunjungan pasien di laboratorium (Encounter Resource).
    Status alur SATUSEHAT: 'arrived' -> 'in-progress' -> 'finished'
    """
    cfg = muat_config()
    org_id = cfg.get("organization_id", "")
    loc_id = location_ihs or cfg.get("default_location_id") or "87c39701-3904-4198-9306-283cb408a4bb"
    now_utc = format_utc()
    prac_id = practitioner_ihs or "N10000001"

    encounter_payload: Dict[str, Any] = {
        "resourceType": "Encounter",
        "status": status,
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "AMB",
            "display": "ambulatory"
        },
        "subject": {
            "reference": f"Patient/{patient_ihs}",
            "display": patient_name
        },
        "identifier": [
            {
                "system": f"http://sys-ids.kemkes.go.id/encounter/{org_id}",
                "value": str(no_lab).strip()
            }
        ],
        "period": {
            "start": now_utc
        },
        "participant": [
            {
                "type": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                                "code": "ATND",
                                "display": "attender"
                            }
                        ]
                    }
                ],
                "individual": {
                    "reference": f"Practitioner/{prac_id}",
                    "display": practitioner_name or "Dokter Penanggung Jawab"
                }
            }
        ],
        "location": [
            {
                "location": {
                    "reference": f"Location/{loc_id}",
                    "display": "Laboratorium Medis Utama"
                }
            }
        ],
        "statusHistory": [
            {
                "status": status,
                "period": {
                    "start": now_utc
                }
            }
        ],
        "serviceProvider": {
            "reference": f"Organization/{org_id}"
        }
    }

    r = fhir_request("POST", "/Encounter", data=encounter_payload)
    if not r["ok"]:
        return {
            "sukses": False,
            "pesan": f"Gagal membuat Encounter (HTTP {r['status_code']}): {r.get('data')}",
            "payload": encounter_payload
        }

    encounter_id = r["data"].get("id")
    return {
        "sukses": True,
        "encounter_id": encounter_id,
        "no_lab": no_lab,
        "data": r["data"]
    }


def kirim_hasil_lab_lengkap(
    no_lab: str,
    patient_ihs: str = "",
    patient_nik: str = "",
    patient_name: str = "",
    encounter_id: str = "",
    items: Optional[list] = None,
    practitioner_ihs: str = "",
    practitioner_name: str = ""
) -> Dict[str, Any]:
    """
    Mengirimkan seluruh paket hasil laboratorium ke SATUSEHAT (FHIR R4):
    1. Pastikan Pasien IHS tersedia (auto-lookup NIK / auto-register Sandbox jika perlu)
    2. Pastikan Encounter ada (atau buat baru)
    3. ServiceRequest (Permintaan Layanan Lab)
    4. Specimen (Spesimen Darah / Urin / Serum)
    5. Observation (Per parameter uji lab dengan kode LOINC)
    6. DiagnosticReport (Laporan Hasil Diagnostik Laboratorium)
    """
    cfg = muat_config()
    org_id = cfg.get("organization_id", "")
    now_utc = format_utc()
    prac_id = practitioner_ihs or "N10000001"
    prac_name = practitioner_name or "Dokter Penanggung Jawab"

    # Resolusi Patient IHS
    if not patient_ihs and patient_nik:
        p_res = cari_pasien_nik(str(patient_nik).strip())
        if p_res.get("sukses") and p_res.get("ihs_id"):
            patient_ihs = p_res["ihs_id"]
            if not patient_name or patient_name == "-":
                patient_name = p_res.get("nama") or "Pasien"
        else:
            return {
                "sukses": False,
                "pesan": f"Gagal mendapatkan IHS Pasien untuk NIK {patient_nik}: {p_res.get('pesan', 'Tidak ditemukan di SatuSehat')}"
            }

    if not patient_ihs:
        return {
            "sukses": False,
            "pesan": "IHS Pasien atau NIK wajib disertakan untuk pengiriman ke SATUSEHAT."
        }

    # 1. Pastikan Encounter ID tersedia
    active_encounter = encounter_id
    if not active_encounter:
        res_enc = kirim_encounter_lab(
            no_lab=no_lab,
            patient_ihs=patient_ihs,
            patient_name=patient_name or "Pasien",
            practitioner_ihs=prac_id,
            practitioner_name=prac_name
        )
        if not res_enc.get("sukses"):
            return res_enc
        active_encounter = res_enc.get("encounter_id")

    # 2. Buat ServiceRequest
    srv_payload = {
        "resourceType": "ServiceRequest",
        "identifier": [
            {
                "system": f"http://sys-ids.kemkes.go.id/servicerequest/{org_id}",
                "value": f"SRV-{no_lab}"
            }
        ],
        "status": "active",
        "intent": "original-order",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "108252007",
                        "display": "Laboratory procedure"
                    }
                ]
            }
        ],
        "code": {
            "coding": [
                {
                    "system": "http://loinc.org",
                    "code": "11502-2",
                    "display": "Laboratory report"
                }
            ]
        },
        "subject": {
            "reference": f"Patient/{patient_ihs}",
            "display": patient_name
        },
        "encounter": {
            "reference": f"Encounter/{active_encounter}"
        },
        "occurrenceDateTime": now_utc,
        "requester": {
            "reference": f"Practitioner/{prac_id}",
            "display": prac_name
        },
        "performer": [
            {
                "reference": f"Practitioner/{prac_id}"
            }
        ]
    }
    r_srv = fhir_request("POST", "/ServiceRequest", data=srv_payload)
    srv_id = r_srv.get("data", {}).get("id") if r_srv["ok"] else None

    # 3. Buat Specimen
    spec_code = "119364003"
    spec_display = "Serum specimen"
    if items:
        for it in items:
            if it.get("kode_specimen"):
                spec_code = str(it.get("kode_specimen"))
                spec_display = it.get("nama_specimen") or "Serum specimen"
                break

    spec_payload = {
        "resourceType": "Specimen",
        "identifier": [
            {
                "system": f"http://sys-ids.kemkes.go.id/specimen/{org_id}",
                "value": f"SPEC-{no_lab}"
            }
        ],
        "status": "available",
        "type": {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": spec_code,
                    "display": spec_display
                }
            ]
        },
        "subject": {
            "reference": f"Patient/{patient_ihs}",
            "display": patient_name
        },
        "receivedTime": now_utc,
        "collection": {
            "collectedDateTime": now_utc
        }
    }
    if srv_id:
        spec_payload["request"] = [{"reference": f"ServiceRequest/{srv_id}"}]

    r_spec = fhir_request("POST", "/Specimen", data=spec_payload)
    spec_id = r_spec.get("data", {}).get("id") if r_spec["ok"] else None

    # 4. Buat Observation untuk setiap item lab yang memiliki kode LOINC
    observations_created = []
    obs_references = []

    for it in (items or []):
        loinc = str(it.get("kode_loinc") or "").strip()
        if not loinc:
            continue

        nama_tes = it.get("nama") or it.get("display_loinc") or "Pemeriksaan Lab"
        nilai_str = str(it.get("nilai") if it.get("nilai") is not None else (it.get("nilai_teks") or it.get("nilai_angka") or "-")).strip()
        satuan = it.get("satuan") or ""

        obs_payload = {
            "resourceType": "Observation",
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                            "code": "laboratory",
                            "display": "Laboratory"
                        }
                    ]
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": loinc,
                        "display": it.get("display_loinc") or nama_tes
                    }
                ]
            },
            "subject": {
                "reference": f"Patient/{patient_ihs}",
                "display": patient_name
            },
            "encounter": {
                "reference": f"Encounter/{active_encounter}"
            },
            "effectiveDateTime": now_utc,
            "issued": now_utc,
            "performer": [
                {
                    "reference": f"Practitioner/{prac_id}"
                }
            ],
            "valueString": f"{nilai_str} {satuan}".strip()
        }
        if srv_id:
            obs_payload["basedOn"] = [{"reference": f"ServiceRequest/{srv_id}"}]
        if spec_id:
            obs_payload["specimen"] = {"reference": f"Specimen/{spec_id}"}
        if it.get("rujukan") or it.get("rujukan_teks"):
            obs_payload["referenceRange"] = [{"text": str(it.get("rujukan") or it.get("rujukan_teks"))}]

        r_obs = fhir_request("POST", "/Observation", data=obs_payload)
        if r_obs["ok"]:
            obs_id = r_obs["data"].get("id")
            observations_created.append({
                "nama": nama_tes,
                "kode_loinc": loinc,
                "observation_id": obs_id,
                "nilai": nilai_str
            })
            obs_references.append({"reference": f"Observation/{obs_id}"})

    # 5. Buat DiagnosticReport
    diag_rep_id = None
    if obs_references:
        rep_payload = {
            "resourceType": "DiagnosticReport",
            "identifier": [
                {
                    "system": f"http://sys-ids.kemkes.go.id/diagnostic/{org_id}/lab",
                    "value": f"REP-{no_lab}"
                }
            ],
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                            "code": "LAB",
                            "display": "Laboratory"
                        }
                    ]
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "11502-2",
                        "display": "Laboratory report"
                    }
                ]
            },
            "subject": {
                "reference": f"Patient/{patient_ihs}",
                "display": patient_name
            },
            "encounter": {
                "reference": f"Encounter/{active_encounter}"
            },
            "effectiveDateTime": now_utc,
            "issued": now_utc,
            "performer": [
                {
                    "reference": f"Organization/{org_id}"
                }
            ],
            "result": obs_references
        }
        if srv_id:
            rep_payload["basedOn"] = [{"reference": f"ServiceRequest/{srv_id}"}]
        if spec_id:
            rep_payload["specimen"] = [{"reference": f"Specimen/{spec_id}"}]

        r_rep = fhir_request("POST", "/DiagnosticReport", data=rep_payload)
        if r_rep["ok"]:
            diag_rep_id = r_rep["data"].get("id")

    if not observations_created:
        return {
            "sukses": False,
            "pesan": "Tidak ada item lab dengan kode LOINC yang valid / berhasil dikirim ke SATUSEHAT.",
            "no_lab": no_lab,
            "encounter_id": active_encounter,
            "servicerequest_id": srv_id,
            "specimen_id": spec_id,
            "observations": []
        }

    return {
        "sukses": True,
        "pesan": f"Hasil lab ({len(observations_created)} parameter) berhasil dikirim ke SATUSEHAT!",
        "no_lab": no_lab,
        "encounter_id": active_encounter,
        "servicerequest_id": srv_id,
        "specimen_id": spec_id,
        "observations": observations_created,
        "diagnostic_report_id": diag_rep_id,
        "total_loinc_terkirim": len(observations_created)
    }
