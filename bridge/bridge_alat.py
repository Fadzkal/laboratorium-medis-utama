"""
=============================================================================
LIS BRIDGE SERVER - LABORATORIUM MEDIS UTAMA
=============================================================================
Server penghubung otomatis alat laboratorium medis ke sistem web klinik:
1. Mindray BS-240 : Port 7118 (HL7 MLLP)
2. Sysmex XP-100  : Port 5100 (ASTM E1381/E1394)
3. Local HTTP API : Port 7119 (Untuk sinkronisasi instan ke browser web)

Dijalankan di PC laboratorium tempat alat terhubung melalui kabel LAN/Serial.
=============================================================================
"""

import sys
import os
import socket
import threading
import time
import csv
import json
import logging
from datetime import datetime
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Pastikan folder bridge ada di path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from config import (
    HOST_MINDRAY,
    PORT_MINDRAY,
    HOST_SYSMEX,
    PORT_SYSMEX,
    HOST_LOCAL_API,
    PORT_LOCAL_API,
    LOG_DIR,
    CSV_LOG_FILE,
    JSON_BUFFER_FILE,
)
from db_adapter import get_adapter

# Konfigurasi Wondfo III Plus (TCP Socket Port 8001)
HOST_WONDFO = "0.0.0.0"
PORT_WONDFO = 8001
try:
    import config
    if hasattr(config, "HOST_WONDFO"):
        HOST_WONDFO = config.HOST_WONDFO
    if hasattr(config, "PORT_WONDFO"):
        PORT_WONDFO = config.PORT_WONDFO
except Exception:
    pass

# Setup Logging
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(LOG_DIR, "bridge_system.log"), encoding="utf-8")
    ]
)
logger = logging.getLogger("LIS_BRIDGE")

# Buffer memori hasil terakhir untuk API browser
BUFFER_HASIL = {}  # { sample_id: { "timestamp": ..., "alat": ..., "hasil": [...] } }
BUFFER_RIWAYAT = []

# Status listener
STATUS_LISTENER = {
    "mindray": {"port": PORT_MINDRAY, "status": "BERHENTI", "pesan_terakhir": None},
    "sysmex": {"port": PORT_SYSMEX, "status": "BERHENTI", "pesan_terakhir": None},
    "wondfo": {"port": PORT_WONDFO, "status": "BERHENTI", "pesan_terakhir": None},
    "api": {"port": PORT_LOCAL_API, "status": "BERHENTI"}
}


# ===========================================================================
# 1. PENCATATAN LOG KE CSV & FILE BUFFER
# ===========================================================================
def catat_ke_csv(sample_id: str, nama_pasien: str, alat: str, hasil_list: list):
    """Menyimpan setiap hasil yang diterima ke berkas CSV lokal untuk audit & cadangan"""
    file_ada = os.path.exists(CSV_LOG_FILE)
    waktu_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        with open(CSV_LOG_FILE, mode="a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if not file_ada:
                writer.writerow(["Waktu", "Alat", "Sample_ID", "Nama_Pasien", "Parameter", "Nilai", "Satuan", "Flag"])
            for h in hasil_list:
                writer.writerow([
                    waktu_str,
                    alat,
                    sample_id,
                    nama_pasien,
                    h.get("test_name", ""),
                    h.get("value", ""),
                    h.get("unit", ""),
                    h.get("flag", "")
                ])
    except Exception as e:
        logger.error(f"Gagal mencatat ke CSV log: {e}")


def perbarui_buffer(sample_id: str, nama_pasien: str, alat: str, hasil_list: list, raw_msg: str = "", metadata: dict = None):
    """Menyimpan ke buffer memori dan file JSON untuk respon instan browser"""
    waktu_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = {
        "sample_id": sample_id,
        "nama_pasien": nama_pasien,
        "alat": alat,
        "waktu": waktu_str,
        "hasil": hasil_list,
        "raw_hl7": raw_msg or "",
        "metadata": metadata or {}
    }
    # Simpan di memori
    BUFFER_HASIL[str(sample_id)] = entry
    # Simpan juga pada potongan 4 digit terakhir
    if len(str(sample_id)) >= 4:
        BUFFER_HASIL[str(sample_id)[-4:]] = entry

    BUFFER_RIWAYAT.insert(0, entry)
    if len(BUFFER_RIWAYAT) > 50:
        BUFFER_RIWAYAT.pop()

    try:
        with open(JSON_BUFFER_FILE, "w", encoding="utf-8") as f:
            json.dump(BUFFER_RIWAYAT[:30], f, indent=2)
    except Exception as e:
        logger.error(f"Gagal memperbarui file buffer JSON: {e}")


# ===========================================================================
# 2. LISTENER MINDRAY BS-240 (HL7 MLLP - PORT 7118)
# ===========================================================================
START_BLOCK = b"\x0b"
END_BLOCK   = b"\x1c\x0d"

def buat_hl7_ack(msh_segment: str) -> bytes:
    """Membuat respon HL7 ACK standar agar Mindray BS-240 mengetahui data sukses diterima"""
    try:
        fields = msh_segment.split("|")
        msh_control_id = fields[9] if len(fields) > 9 else "1"
        sending_app = fields[2] if len(fields) > 2 else "MINDRAY"
        now_str = datetime.now().strftime("%Y%m%d%H%M%S")
        ack_msg = (
            f"MSH|^~\\&|LMU_LIS|KLINIK|{sending_app}|BS240|{now_str}||ACK^R01|{msh_control_id}|P|2.3.1\r"
            f"MSA|AA|{msh_control_id}|Message accepted successfully\r"
        )
        return START_BLOCK + ack_msg.encode("latin-1") + END_BLOCK
    except Exception as e:
        logger.error(f"Gagal membuat HL7 ACK: {e}")
        return START_BLOCK + b"MSH|^~\\&|||||||ACK|1|P|2.3.1\rMSA|AA|1\r" + END_BLOCK


def parse_hl7_message(raw_text: str):
    """Mengekstrak Sample ID dan parameter pemeriksaan dari pesan HL7 Mindray"""
    results = []
    sample_id = ""
    patient_name = ""
    patient_id = ""
    gender = ""
    age = ""
    order_date = ""
    msh_raw = ""

    for segment in raw_text.strip().split("\r"):
        if not segment:
            continue
        fields = segment.split("|")
        seg_type = fields[0]

        if seg_type == "MSH":
            msh_raw = segment
            if len(fields) > 7 and fields[7]:
                order_date = fields[7]

        elif seg_type == "PID":
            # PID-2 atau PID-3: sample ID / patient ID (No RM)
            if len(fields) > 3 and fields[3]:
                patient_id = fields[3].strip()
            if len(fields) > 2 and fields[2] and not sample_id:
                sample_id = fields[2].strip()
            if len(fields) > 5 and fields[5]:
                patient_name = fields[5].replace("^", " ").strip()
            if len(fields) > 7 and fields[7]:
                age = fields[7].strip()
            if len(fields) > 8 and fields[8]:
                gender = fields[8].strip()

        elif seg_type == "OBR":
            # Jika PID tidak berisi sample ID, cek OBR-2 atau OBR-3 (Placer/Filler Order Number)
            obr_sid = fields[3] if len(fields) > 3 and fields[3] else (fields[2] if len(fields) > 2 else "")
            if obr_sid:
                sample_id = obr_sid.strip()
            if len(fields) > 7 and fields[7]:
                order_date = fields[7].strip()

        elif seg_type == "OBX" and len(fields) > 5:
            # Pada Mindray BS-240, nama tes bisa berada di fields[4] jika fields[3] kosong,
            # atau berbentuk kode^nama di fields[3]
            f3 = fields[3].strip() if len(fields) > 3 else ""
            f4 = fields[4].strip() if len(fields) > 4 else ""
            test_info = f3 if f3 else f4

            test_code = test_info.split("^")[0].strip() if "^" in test_info else test_info.strip()
            test_desc = test_info.split("^")[1].strip() if ("^" in test_info and len(test_info.split("^")) > 1) else test_info.strip()

            # Normalisasi nama tes panjang ke kode standar jika test_code adalah deskripsi
            test_code_upper = test_code.upper()
            if "GLUCOSE" in test_code_upper or "GLUKOSA" in test_code_upper:
                derived_code = "GLU"
            elif "TRIGLYCERIDE" in test_code_upper or "TRIGLISERIDA" in test_code_upper:
                derived_code = "TG"
            elif "HDL" in test_code_upper:
                derived_code = "HDL-C"
            elif "LDL" in test_code_upper:
                derived_code = "LDL-C"
            elif "TOTAL CHOLESTEROL" in test_code_upper or "CHOLESTEROL" in test_code_upper or "KOLESTEROL" in test_code_upper:
                derived_code = "TC"
            elif "CREATININE" in test_code_upper or "KREATININ" in test_code_upper:
                derived_code = "CREA-S"
            elif "UREA" in test_code_upper or "UREUM" in test_code_upper:
                derived_code = "UREA"
            elif "URIC ACID" in test_code_upper or "ASAM URAT" in test_code_upper:
                derived_code = "UA"
            elif "ALANINE" in test_code_upper or "SGPT" in test_code_upper or "ALT" in test_code_upper:
                derived_code = "ALT"
            elif "ASPARTATE" in test_code_upper or "SGOT" in test_code_upper or "AST" in test_code_upper:
                derived_code = "AST"
            elif "ALBUMIN" in test_code_upper:
                derived_code = "ALB"
            elif "TOTAL PROTEIN" in test_code_upper:
                derived_code = "TP"
            elif "BILIRUBIN" in test_code_upper:
                derived_code = "TBIL"
            elif "ALKALINE PHOSPHATASE" in test_code_upper or "ALP" in test_code_upper:
                derived_code = "ALP"
            elif "GAMMA" in test_code_upper or "GGT" in test_code_upper:
                derived_code = "GGT"
            else:
                derived_code = test_code

            value = fields[5] if len(fields) > 5 else ""
            unit = fields[6] if len(fields) > 6 else ""
            ref_range = fields[7] if len(fields) > 7 else ""
            flag = fields[8] if len(fields) > 8 else ""
            if not flag or flag in ("", "-"):
                flag = "N"

            if (derived_code or test_info) and value:
                results.append({
                    "test_name": derived_code or test_code,
                    "test_desc": test_desc or test_info,
                    "value": value.strip(),
                    "unit": unit.strip(),
                    "ref_range": ref_range.strip(),
                    "flag": flag.strip()
                })

    meta = {
        "patient_id": patient_id,
        "gender": gender,
        "age": age,
        "order_date": order_date
    }
    return sample_id, patient_name, results, msh_raw, meta


def mindray_worker():
    """Thread server socket untuk Mindray BS-240"""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        server.bind((HOST_MINDRAY, PORT_MINDRAY))
        server.listen(5)
        STATUS_LISTENER["mindray"]["status"] = "AKTIF"
        logger.info(f"Listener Mindray BS-240 AKTIF mendengarkan pada port {PORT_MINDRAY}")
    except Exception as e:
        STATUS_LISTENER["mindray"]["status"] = f"ERROR: {e}"
        logger.error(f"Gagal mengikat port Mindray {PORT_MINDRAY}: {e}")
        return

    while True:
        try:
            client, addr = server.accept()
            logger.info(f"Koneksi masuk Mindray dari {addr}")
            buffer = b""

            while True:
                data = client.recv(4096)
                if not data:
                    break
                buffer += data

                # Cek batas blok HL7 MLLP
                if START_BLOCK in buffer and END_BLOCK in buffer:
                    start_idx = buffer.index(START_BLOCK) + 1
                    end_idx = buffer.index(END_BLOCK)
                    raw_msg = buffer[start_idx:end_idx].decode("latin-1", errors="replace")
                    buffer = buffer[end_idx + len(END_BLOCK):]

                    logger.info("Menerima paket HL7 dari Mindray BS-240.")
                    sample_id, patient_name, results, msh_raw, meta = parse_hl7_message(raw_msg)
                    logger.info(f"Sample ID: {sample_id}, Pasien: {patient_name}, Parameter: {len(results)}")

                    # Kirim respon ACK ke Mindray
                    ack = buat_hl7_ack(msh_raw)
                    client.sendall(ack)
                    logger.info("Respon HL7 ACK terkirim ke Mindray.")

                    if sample_id and results:
                        # 1. Catat ke log lokal
                        catat_ke_csv(sample_id, patient_name, "Mindray BS-240", results)
                        perbarui_buffer(sample_id, patient_name, "Mindray BS-240", results, raw_msg=raw_msg, metadata=meta)
                        STATUS_LISTENER["mindray"]["pesan_terakhir"] = f"Sample {sample_id} ({len(results)} item) - {datetime.now().strftime('%H:%M:%S')}"

                        # 2. Kirim ke Database (Supabase / MySQL)
                        try:
                            adapter = get_adapter()
                            res = adapter.sync_hasil_alat(sample_id, results, "Mindray BS-240")
                            logger.info(f"Hasil sinkronisasi DB: {res.get('total_tersimpan', 0)} dari {len(results)} parameter tersimpan.")
                        except Exception as eSync:
                            logger.error(f"Gagal sync ke database: {eSync}")

            client.close()
        except Exception as e:
            logger.error(f"Error pada loop Mindray: {e}")
            time.sleep(1)


# ===========================================================================
# 3. LISTENER SYSMEX XP-100 (ASTM E1381/E1394 - PORT 5100 / 8000)
# ===========================================================================
ENQ = b"\x05"
ACK = b"\x06"
NAK = b"\x15"
EOT = b"\x04"
STX = b"\x02"
ETX = b"\x03"
ETB = b"\x17"

def parse_astm_records(raw_frames: list):
    """Mengekstrak hasil dari frame ASTM Sysmex XP-100"""
    results = []
    sample_id = ""
    patient_name = ""

    for line in raw_frames:
        if not line:
            continue
        line_clean = line.strip("\r\n\x02\x03\x17")
        parts = line_clean.split("|")
        rtype = parts[0].strip()
        # Jika rtype diawali digit frame (misal 1H, 2P, 3O, 4R)
        if len(rtype) > 1 and rtype[0].isdigit():
            rtype = rtype[1:]

        if rtype == "P" and len(parts) > 2:
            # Patient record: P|1||PatientID||LastName^FirstName
            pid = parts[3].strip() if len(parts) > 3 and parts[3].strip() else (parts[2].strip() if len(parts) > 2 else "")
            if not sample_id and pid:
                sample_id = pid
            if len(parts) > 5 and parts[5]:
                patient_name = parts[5].replace("^", " ").strip()

        elif rtype == "O" and len(parts) > 2:
            # Order record: O|1|SampleID||^^^TestList...
            sid = parts[2].strip() if parts[2].strip() else (parts[3].strip() if len(parts) > 3 else "")
            if sid:
                sample_id = sid

        elif rtype == "R" and len(parts) > 3:
            # Result record: R|1|^^^WBC|7.50|10*3/uL|...|N
            test_raw = parts[2].strip()
            raw_comps = [c.strip() for c in test_raw.split("^") if c.strip()]
            test_code = ""
            for comp in raw_comps:
                if any(c.isalpha() for c in comp):
                    test_code = comp
                    break
            if not test_code:
                test_code = test_raw.replace("^", "").strip()

            value = parts[3].strip() if len(parts) > 3 else ""
            unit = parts[4].strip() if len(parts) > 4 else ""
            ref_range = parts[5].strip() if len(parts) > 5 else ""
            flag = parts[6].strip() if len(parts) > 6 else ""
            if not flag or flag in ("", "-"):
                flag = "N"

            if test_code and value:
                results.append({
                    "test_name": test_code,
                    "value": value,
                    "unit": unit,
                    "ref_range": ref_range,
                    "flag": flag
                })

    return sample_id, patient_name, results


def sysmex_worker():
    """Thread server socket untuk Sysmex XP-100"""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        server.bind((HOST_SYSMEX, PORT_SYSMEX))
        server.listen(5)
        STATUS_LISTENER["sysmex"]["status"] = "AKTIF"
        logger.info(f"Listener Sysmex XP-100 AKTIF mendengarkan pada port {PORT_SYSMEX}")
    except Exception as e:
        STATUS_LISTENER["sysmex"]["status"] = f"ERROR: {e}"
        logger.error(f"Gagal mengikat port Sysmex {PORT_SYSMEX}: {e}")
        return

    while True:
        try:
            client, addr = server.accept()
            logger.info(f"Koneksi masuk Sysmex dari {addr}")
            frames = []

            while True:
                data = client.recv(2048)
                if not data:
                    break

                # Handshake ASTM ENQ
                if ENQ in data:
                    try:
                        client.sendall(ACK)
                    except Exception:
                        pass
                    frames = []
                    continue

                if EOT in data:
                    logger.info("Sesi ASTM Sysmex selesai (EOT). Mulai parsing data...")
                    try:
                        client.close()
                    except Exception:
                        pass
                    break

                # Data frame: STX ... ETX/ETB Checksum CR LF
                if STX in data:
                    try:
                        client.sendall(ACK)
                    except Exception:
                        pass

                    # Pecah jika ada beberapa frame STX dalam satu chunk TCP
                    raw_chunks = data.split(STX)
                    for chunk in raw_chunks:
                        if not chunk:
                            continue
                        content_bytes = chunk
                        for stop_byte in (ETX, ETB):
                            if stop_byte in content_bytes:
                                content_bytes = content_bytes.split(stop_byte)[0]
                        try:
                            line_str = content_bytes.decode("ascii", errors="replace").strip("\r\n")
                            if line_str and line_str[0].isdigit():
                                line_str = line_str[1:]
                            if line_str:
                                frames.append(line_str)
                                logger.info(f"Frame ASTM Sysmex: {line_str}")
                        except Exception as eFrame:
                            logger.error(f"Error parse frame ASTM Sysmex: {eFrame}")

            # Setelah EOT diterima atau socket selesai
            if frames:
                raw_astm = "\r\n".join(frames)
                sample_id, patient_name, results = parse_astm_records(frames)
                logger.info(f"Sysmex Sample ID: {sample_id}, Pasien: {patient_name}, Parameter: {len(results)}")

                if sample_id and results:
                    catat_ke_csv(sample_id, patient_name, "Sysmex XP-100", results)
                    perbarui_buffer(sample_id, patient_name, "Sysmex XP-100", results, raw_msg=raw_astm)
                    STATUS_LISTENER["sysmex"]["pesan_terakhir"] = f"Sample {sample_id} ({len(results)} item) - {datetime.now().strftime('%H:%M:%S')}"

                    try:
                        adapter = get_adapter()
                        res = adapter.sync_hasil_alat(sample_id, results, "Sysmex XP-100")
                        logger.info(f"Hasil sinkronisasi DB Sysmex: {res.get('total_tersimpan', 0)} dari {len(results)} parameter tersimpan.")
                    except Exception as eSync:
                        logger.error(f"Gagal sync ke database: {eSync}")

        except Exception as e:
            logger.error(f"Error pada loop Sysmex: {e}")
            time.sleep(1)


# ===========================================================================
# 4. LISTENER WONDFO III PLUS (HL7 MLLP - PORT 8001)
# ===========================================================================
def buat_wondfo_ack(msh_segment: str) -> bytes:
    """Membuat respon HL7 ACK standar untuk Wondfo III Plus"""
    try:
        fields = msh_segment.split("|")
        msh_control_id = fields[9] if len(fields) > 9 and fields[9] else "1"
        sending_app = fields[2] if len(fields) > 2 and fields[2] else "WONDFO"
        now_str = datetime.now().strftime("%Y%m%d%H%M%S")
        ack_msg = (
            f"MSH|^~\\&|LMU_LIS|KLINIK|{sending_app}|WONDFO|{now_str}||ACK^R01|{msh_control_id}|P|2.3.1\r"
            f"MSA|AA|{msh_control_id}|Message accepted successfully\r"
        )
        return START_BLOCK + ack_msg.encode("latin-1") + END_BLOCK
    except Exception as e:
        logger.error(f"Gagal membuat Wondfo HL7 ACK: {e}")
        return START_BLOCK + b"MSH|^~\\&|||||||ACK|1|P|2.3.1\rMSA|AA|1\r" + END_BLOCK


def parse_wondfo_hl7_message(raw_text: str):
    """
    Mengekstrak Sample ID dan parameter pemeriksaan dari paket HL7 Wondfo III Plus.
    OBR: fields[3] = sample_number / sample_id, fields[15] = sample_type
    OBX: fields[4] = test_name, fields[5] = result, fields[6] = unit, fields[7] = ref_range, fields[14] = test_time
    """
    results = []
    sample_id = ""
    patient_name = ""
    patient_id = ""
    gender = ""
    age = ""
    sample_type = ""
    test_time = ""
    msh_raw = ""

    segments = [s.strip() for s in raw_text.replace("\r\n", "\r").replace("\n", "\r").split("\r") if s.strip()]

    for segment in segments:
        fields = segment.split("|")
        seg_type = fields[0]

        if seg_type == "MSH":
            msh_raw = segment
            if len(fields) > 7 and fields[7]:
                test_time = fields[7].strip()

        elif seg_type == "PID":
            if len(fields) > 3 and fields[3]:
                patient_id = fields[3].strip()
            if len(fields) > 2 and fields[2] and not sample_id:
                sample_id = fields[2].strip()
            if len(fields) > 5 and fields[5]:
                patient_name = fields[5].replace("^", " ").strip()
            if len(fields) > 7 and fields[7]:
                age = fields[7].strip()
            if len(fields) > 8 and fields[8]:
                gender = fields[8].strip()

        elif seg_type == "OBR":
            # fields[3] = sample_number / sample_id
            if len(fields) > 3 and fields[3].strip():
                sample_id = fields[3].strip()
            elif len(fields) > 2 and fields[2].strip() and not sample_id:
                sample_id = fields[2].strip()

            # fields[15] = sample_type
            if len(fields) > 15 and fields[15].strip():
                sample_type = fields[15].strip()

            if len(fields) > 7 and fields[7].strip() and not test_time:
                test_time = fields[7].strip()

        elif seg_type == "OBX" and len(fields) > 5:
            # fields[4] = test_name (misal: 'MAU')
            raw_test_name = fields[4].strip() if len(fields) > 4 and fields[4].strip() else ""
            if not raw_test_name and len(fields) > 3:
                raw_test_name = fields[3].strip()

            test_code = raw_test_name.split("^")[0].strip() if "^" in raw_test_name else raw_test_name
            test_desc = raw_test_name.split("^")[1].strip() if ("^" in raw_test_name and len(raw_test_name.split("^")) > 1) else test_code

            # fields[5] = result (bersihkan tanda panah, catat flag H/L)
            raw_val = fields[5].strip() if len(fields) > 5 else ""
            flag = ""

            # Deteksi flag dari panah atau penanda H/L di raw_val
            if "↑" in raw_val or "▲" in raw_val or raw_val.endswith(" H") or raw_val.startswith("H "):
                flag = "H"
            elif "↓" in raw_val or "▼" in raw_val or raw_val.endswith(" L") or raw_val.startswith("L "):
                flag = "L"

            # Bersihkan nilai dari panah dan indikator
            clean_val = raw_val.replace("↑", "").replace("↓", "").replace("▲", "").replace("▼", "").strip()
            if clean_val.endswith(" H") or clean_val.endswith(" L"):
                clean_val = clean_val[:-2].strip()

            # fields[6] = unit
            unit = fields[6].strip() if len(fields) > 6 else ""

            # fields[7] = reference
            ref_range = fields[7].strip() if len(fields) > 7 else ""

            # fields[8] = abnormal flag jika belum terdeteksi dari raw_val
            if not flag and len(fields) > 8 and fields[8].strip():
                f8 = fields[8].strip()
                if f8 not in ("", "-"):
                    flag = f8

            # fields[14] = test_time
            if len(fields) > 14 and fields[14].strip():
                test_time = fields[14].strip()

            if not flag or flag in ("", "-"):
                flag = "N"

            # Normalisasi deskripsi untuk MAU
            if test_code.upper() in ("MAU", "MICROALBUMIN", "M-ALB"):
                test_desc = "Mikroalbumin Urin (MAU)"

            if (test_code or raw_test_name) and clean_val:
                results.append({
                    "test_name": test_code,
                    "test_desc": test_desc or test_code,
                    "value": clean_val,
                    "unit": unit,
                    "ref_range": ref_range,
                    "flag": flag
                })

    meta = {
        "patient_id": patient_id or sample_id,
        "gender": gender,
        "age": age,
        "sample_type": sample_type or "URINE",
        "test_time": test_time,
        "protokol": "HL7"
    }
    return sample_id, patient_name, results, msh_raw, meta


def wondfo_worker():
    """Thread server socket untuk Wondfo III Plus (Port 8001 - HL7 MLLP)"""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        server.bind((HOST_WONDFO, PORT_WONDFO))
        server.listen(5)
        STATUS_LISTENER["wondfo"]["status"] = "AKTIF"
        logger.info(f"Listener Wondfo III Plus AKTIF mendengarkan pada port {PORT_WONDFO}")
    except Exception as e:
        STATUS_LISTENER["wondfo"]["status"] = f"ERROR: {e}"
        logger.error(f"Gagal mengikat port Wondfo {PORT_WONDFO}: {e}")
        return

    while True:
        try:
            client, addr = server.accept()
            logger.info(f"Koneksi masuk Wondfo III Plus dari {addr}")
            buffer = b""

            while True:
                data = client.recv(4096)
                if not data:
                    break
                buffer += data

                # Cek batas blok HL7 MLLP (START = 0x0B, END = 0x1C + CR / LF / FS)
                while START_BLOCK in buffer:
                    start_idx = buffer.index(START_BLOCK) + 1
                    end_idx = -1
                    end_len = 0
                    if b"\x1c\r" in buffer:
                        end_idx = buffer.index(b"\x1c\r")
                        end_len = 2
                    elif b"\x1c\x0d" in buffer:
                        end_idx = buffer.index(b"\x1c\x0d")
                        end_len = 2
                    elif b"\x1c\n" in buffer:
                        end_idx = buffer.index(b"\x1c\n")
                        end_len = 2
                    elif b"\x1c" in buffer:
                        end_idx = buffer.index(b"\x1c")
                        end_len = 1

                    if end_idx == -1 or end_idx < start_idx:
                        break

                    raw_msg = buffer[start_idx:end_idx].decode("latin-1", errors="replace")
                    buffer = buffer[end_idx + end_len:]

                    logger.info("Menerima paket HL7 dari Wondfo III Plus.")
                    sample_id, patient_name, results, msh_raw, meta = parse_wondfo_hl7_message(raw_msg)
                    logger.info(f"Wondfo Sample ID: {sample_id}, Pasien: {patient_name}, Parameter: {len(results)}")

                    # Kirim respon ACK ke Wondfo jika ada MSH
                    if msh_raw:
                        ack = buat_wondfo_ack(msh_raw)
                        try:
                            client.sendall(ack)
                            logger.info("Respon HL7 ACK terkirim ke Wondfo.")
                        except Exception as eAck:
                            logger.error(f"Gagal kirim ACK ke Wondfo: {eAck}")

                    if sample_id and results:
                        catat_ke_csv(sample_id, patient_name, "Wondfo III Plus", results)
                        perbarui_buffer(sample_id, patient_name, "Wondfo III Plus", results, raw_msg=raw_msg, metadata=meta)
                        STATUS_LISTENER["wondfo"]["pesan_terakhir"] = f"Sample {sample_id} ({len(results)} item) - {datetime.now().strftime('%H:%M:%S')}"

                        try:
                            adapter = get_adapter()
                            res = adapter.sync_hasil_alat(sample_id, results, "Wondfo III Plus")
                            logger.info(f"Hasil sinkronisasi DB Wondfo: {res.get('total_tersimpan', 0)} dari {len(results)} parameter tersimpan.")
                        except Exception as eSync:
                            logger.error(f"Gagal sync ke database Wondfo: {eSync}")

            client.close()
        except Exception as e:
            logger.error(f"Error pada loop Wondfo: {e}")
            time.sleep(1)


# ===========================================================================
# 5. LOCAL REST API SERVER (PORT 7119)
# ===========================================================================
class LocalApiHandler(BaseHTTPRequestHandler):
    def _send_json(self, data: dict, status_code: int = 200):
        try:
            payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            # CORS penuh agar halaman web klinik bisa mengakses API lokal
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass
        except Exception as eSend:
            logger.error(f"Error kirim JSON response: {eSend}")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        # 1. Health check status
        if path == "/api/status" or path == "/":
            total_tests = sum(len(x.get("hasil", [])) for x in BUFFER_RIWAYAT)
            last_time = BUFFER_RIWAYAT[0].get("waktu", "-") if BUFFER_RIWAYAT else "-"
            wondfo_aktif = STATUS_LISTENER.get("wondfo", {}).get("status") == "AKTIF"
            self._send_json({
                "status": "ONLINE",
                "waktu": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "listener": STATUS_LISTENER,
                "port_8001": wondfo_aktif,
                "wondfo_siap": wondfo_aktif,
                "total_buffer": len(BUFFER_RIWAYAT),
                "total_samples": len(BUFFER_RIWAYAT),
                "total_tests": total_tests,
                "last_sample_time": last_time
            })
            return

        # 2. Ambil hasil berdasarkan nomor barcode / no_lab
        if path == "/api/hasil":
            no_lab = params.get("no_lab", [None])[0]
            if not no_lab:
                self._send_json({"sukses": False, "pesan": "Parameter 'no_lab' wajib diisi"}, 400)
                return

            sid = str(no_lab).strip()
            found = BUFFER_HASIL.get(sid)
            if not found:
                import re
                m = re.search(r"(\d{1,8})$", sid)
                if m:
                    digits = m.group(1)
                    stripped = digits.lstrip('0') or '0'
                    padded4 = digits[-4:].zfill(4)
                    found = (BUFFER_HASIL.get(digits) or 
                             BUFFER_HASIL.get(stripped) or 
                             BUFFER_HASIL.get(padded4))
            if not found:
                for k, v in BUFFER_HASIL.items():
                    k_str = str(k).strip()
                    if k_str and (k_str == sid or k_str.lstrip('0') == sid.lstrip('0')):
                        found = v
                        break
                    if k_str and (sid.endswith(k_str) or (len(k_str) >= 2 and k_str in sid)):
                        found = v
                        break

            if found:
                self._send_json({"sukses": True, "data": found})
            else:
                self._send_json({
                    "sukses": False,
                    "pesan": f"Belum ada data masuk dari alat untuk nomor {sid}"
                }, 404)
            return

        # 3. Ambil hasil sampel paling baru (untuk auto-refresh instan web)
        if path == "/api/terbaru":
            terbaru = BUFFER_RIWAYAT[0] if BUFFER_RIWAYAT else None
            self._send_json({
                "sukses": True,
                "data": terbaru
            })
            return

        # 4. Ambil daftar hasil terakhir
        if path == "/api/terakhir":
            self._send_json({
                "sukses": True,
                "data": BUFFER_RIWAYAT[:30]
            })
            return

        self._send_json({"sukses": False, "pesan": "Endpoint tidak ditemukan"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Endpoint bersihkan riwayat buffer
        if path == "/api/clear" or path == "/api/reset":
            BUFFER_HASIL.clear()
            BUFFER_RIWAYAT.clear()
            try:
                if os.path.exists(JSON_BUFFER_FILE):
                    with open(JSON_BUFFER_FILE, "w", encoding="utf-8") as f:
                        f.write("[]")
            except Exception:
                pass
            self._send_json({"sukses": True, "pesan": "Buffer riwayat berhasil dibersihkan"})
            return

        # Endpoint simulasi untuk pengujian tanpa mesin fisik
        if path == "/api/simulasi":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                payload = json.loads(body)

                sample_id = payload.get("sample_id") or payload.get("id_sampel") or "0028"
                nama_pasien = payload.get("nama_pasien", "Pasien Uji Coba")
                alat = payload.get("alat", "Mindray BS-240")
                hasil = payload.get("hasil", [])
                metadata = payload.get("metadata", {})
                raw_hl7 = payload.get("raw_hl7", "")

                # Dukung format payload fleksibel langsung per parameter (misal pengujian Wondfo)
                if not hasil and (payload.get("parameter") or payload.get("test_name")):
                    p_name = payload.get("parameter") or payload.get("test_name")
                    p_val = payload.get("nilai") if payload.get("nilai") is not None else (payload.get("hasil") or "25.3")
                    p_unit = payload.get("satuan") or payload.get("unit") or "mg/L"
                    p_ref = payload.get("rujukan") or payload.get("ref_range") or "0-20.0"
                    p_flag = payload.get("flag") or "H"
                    hasil = [{
                        "test_name": p_name,
                        "test_desc": "Mikroalbumin Urin (MAU)" if p_name == "MAU" else p_name,
                        "value": str(p_val),
                        "unit": p_unit,
                        "ref_range": p_ref,
                        "flag": p_flag
                    }]

                if not hasil:
                    self._send_json({"sukses": False, "pesan": "Daftar hasil tidak boleh kosong"}, 400)
                    return

                if not raw_hl7:
                    now_hl7 = datetime.now().strftime("%Y%m%d%H%M%S")
                    if alat == "Sysmex XP-100":
                        lines = [
                            f"H|\\^&|||Sysmex XP-100|||||||P|1394-97|{now_hl7}",
                            f"P|1||{sample_id}||{nama_pasien.replace(' ', '^')}|||U",
                            f"O|1|{sample_id}||^^^||||||||||||||||||||F"
                        ]
                        for idx_h, h in enumerate(hasil, start=1):
                            lines.append(f"R|{idx_h}|^^^{h.get('test_name','')}|{h.get('value','')}|{h.get('unit','')}|{h.get('ref_range','')}|{h.get('flag','')}")
                        lines.append("L|1|N")
                        raw_hl7 = "\r\n".join(lines)
                    elif "Wondfo" in alat:
                        sample_type = metadata.get("sample_type", "URINE")
                        lines = [
                            f"MSH|^~\\&|Wondfo III Plus|WONDFO|||{now_hl7}||ORU^R01|{int(time.time())}|P|2.3.1",
                            f"PID|1||{metadata.get('patient_id', sample_id)}||{nama_pasien.replace(' ', '^')}||{metadata.get('age', '19900101')}|{metadata.get('gender', 'M')}",
                            f"OBR|1||{sample_id}||||||||||||{sample_type}||{now_hl7}"
                        ]
                        for idx_h, h in enumerate(hasil, start=1):
                            t_name = h.get('test_name', 'MAU')
                            t_desc = h.get('test_desc', 'Mikroalbumin Urin (MAU)')
                            val_str = str(h.get('value', ''))
                            flag_str = str(h.get('flag', 'N'))
                            unit_str = str(h.get('unit', 'mg/L'))
                            ref_str = str(h.get('ref_range', '0-20.0'))
                            lines.append(f"OBX|{idx_h}|NM|{t_name}^{t_desc}||{val_str}|{unit_str}|{ref_str}|{flag_str}||||||{now_hl7}")
                        raw_hl7 = "\r\n".join(lines)
                    else:
                        lines = [
                            f"MSH|^~\\&|BS-240|MINDRAY|||{now_hl7}||ORU^R01|{int(time.time())}|P|2.3.1",
                            f"PID|1||{metadata.get('patient_id', sample_id)}||{nama_pasien.replace(' ', '^')}||{metadata.get('age', '19850101')}|{metadata.get('gender', 'M')}",
                            f"OBR|1||{sample_id}|CHEMISTRY||{now_hl7}"
                        ]
                        for idx_h, h in enumerate(hasil, start=1):
                            t_desc = h.get('test_desc', h.get('test_name', ''))
                            lines.append(f"OBX|{idx_h}|NM|{h.get('test_name','')}^{t_desc}^LN||{h.get('value','')}|{h.get('unit','')}|{h.get('ref_range','')}|{h.get('flag','N')}|||F")
                        raw_hl7 = "\r\n".join(lines)

                catat_ke_csv(sample_id, nama_pasien, alat, hasil)
                perbarui_buffer(sample_id, nama_pasien, alat, hasil, raw_msg=raw_hl7, metadata=metadata)

                # Sync ke database
                adapter = get_adapter()
                db_res = adapter.sync_hasil_alat(sample_id, hasil, alat)

                self._send_json({
                    "sukses": True,
                    "pesan": "Simulasi berhasil diproses",
                    "buffer": BUFFER_HASIL.get(sample_id),
                    "database": db_res
                })
            except Exception as e:
                self._send_json({"sukses": False, "pesan": str(e)}, 500)
            return

        self._send_json({"sukses": False, "pesan": "Endpoint tidak ditemukan"}, 404)

    def log_message(self, format, *args):
        # Hindari spamming stdout untuk setiap request polling
        return


def api_worker():
    """Thread server HTTP API lokal"""
    try:
        httpd = ThreadingHTTPServer((HOST_LOCAL_API, PORT_LOCAL_API), LocalApiHandler)
        STATUS_LISTENER["api"]["status"] = "AKTIF"
        logger.info(f"Local REST API AKTIF mendengarkan pada http://{HOST_LOCAL_API}:{PORT_LOCAL_API}")
        httpd.serve_forever()
    except Exception as e:
        STATUS_LISTENER["api"]["status"] = f"ERROR: {e}"
        logger.error(f"Gagal menjalankan Local API pada port {PORT_LOCAL_API}: {e}")


def start_bridge_threads():
    """Menjalankan seluruh listener alat dan local API dalam background thread"""
    t_mindray = threading.Thread(target=mindray_worker, daemon=True, name="MindrayListener")
    t_mindray.start()

    t_sysmex = threading.Thread(target=sysmex_worker, daemon=True, name="SysmexListener")
    t_sysmex.start()

    t_wondfo = threading.Thread(target=wondfo_worker, daemon=True, name="WondfoListener")
    t_wondfo.start()

    t_api = threading.Thread(target=api_worker, daemon=True, name="LocalApiServer")
    t_api.start()

    return {
        "mindray": t_mindray,
        "sysmex": t_sysmex,
        "wondfo": t_wondfo,
        "api": t_api
    }


# ===========================================================================
# 5. ENTRY POINT UTAMA
# ===========================================================================
def main():
    print("=" * 70)
    print("  LIS BRIDGE ALAT MEDIS - LABORATORIUM MEDIS UTAMA")
    print("=" * 70)
    print(f"  Mindray BS-240 (HL7 MLLP) : Port {PORT_MINDRAY}")
    print(f"  Sysmex XP-100  (ASTM)     : Port {PORT_SYSMEX}")
    print(f"  Wondfo III Plus (HL7 MLLP): Port {PORT_WONDFO}")
    print(f"  Local REST API (Browser)  : Port {PORT_LOCAL_API}")
    print("=" * 70)

    start_bridge_threads()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nMenutup LIS Bridge...")
        sys.exit(0)


if __name__ == "__main__":
    main()
