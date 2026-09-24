"""
=============================================================================
SKRIP PENGUJIAN / SIMULASI TRANSMISI ALAT MEDIS
=============================================================================
Mengirimkan data tiruan langsung ke:
1. Port 7118 (Mindray BS-240 HL7 MLLP)
2. Port 5100 (Sysmex XP-100 ASTM E1381/E1394)
3. Port 7119 (Local REST API POST /api/simulasi)
=============================================================================
"""

import socket
import time
import requests
import json

START_BLOCK = b"\x0b"
END_BLOCK   = b"\x1c\x0d"

def tes_mindray_hl7(sample_id="26090026", nama_pasien="Tn. Budi Santoso"):
    """Mengirim pesan HL7 MLLP ke port 7118 seperti yang dikirim Mindray BS-240"""
    print(f"\n[1] Mengirim simulasi HL7 Mindray BS-240 untuk Sample: {sample_id}...")
    
    # Pesan HL7 Mindray BS-240 standar
    hl7_msg = (
        f"MSH|^~\\&|BS-240|MINDRAY|||20260923220000||ORU^R01|1001|P|2.3.1\r"
        f"PID|1||{sample_id}||{nama_pasien.replace(' ', '^')}||19850615|M\r"
        f"OBR|1||{sample_id}|00001^KIMIA|||20260923214500\r"
        f"OBX|1|NM|GLU-S^Glucose||112.5|mg/dL||N|||F\r"
        f"OBX|2|NM|TC^Cholesterol Total||195.0|mg/dL||N|||F\r"
        f"OBX|3|NM|TG^Trigliserida||145.2|mg/dL||N|||F\r"
        f"OBX|4|NM|UA^Asam Urat||5.8|mg/dL||N|||F\r"
        f"OBX|5|NM|CREA-S^Creatinine||0.95|mg/dL||N|||F\r"
        f"OBX|6|NM|UREA^Ureum||24.6|mg/dL||N|||F\r"
    )

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 7118))
        payload = START_BLOCK + hl7_msg.encode("latin-1") + END_BLOCK
        s.sendall(payload)
        
        # Baca respon ACK
        s.settimeout(5.0)
        resp = s.recv(1024)
        print("  -> Respon diterima dari Bridge:")
        print("  ", resp.decode("latin-1", errors="replace").strip())
        s.close()
        print("  [OK] Simulasi Mindray HL7 berhasil dikirim.")
    except Exception as e:
        print(f"  [GAGAL] Error kirim Mindray: {e}")


def tes_sysmex_astm(sample_id="26090026", nama_pasien="Tn. Budi Santoso"):
    """Mengirim sesi ASTM E1381 ke port 5100 seperti yang dikirim Sysmex XP-100"""
    print(f"\n[2] Mengirim simulasi ASTM Sysmex XP-100 untuk Sample: {sample_id} (Port 8000)...")
    
    ENQ = b"\x05"
    ACK = b"\x06"
    EOT = b"\x04"
    STX = b"\x02"

    frames = [
        f"1H|\\^&|||Sysmex^XP-100||||||||E1394-97\r",
        f"2P|1||{sample_id}||{nama_pasien.replace(' ', '^')}||19850615|M\r",
        f"3O|1|{sample_id}||^^^HEMATOLOGI|R|20260923214500\r",
        f"4R|1|^^^WBC|7.45|10*3/uL||N||F\r",
        f"5R|2|^^^RBC|4.82|10*6/uL||N||F\r",
        f"6R|3|^^^HGB|14.2|g/dL||N||F\r",
        f"7R|4|^^^HCT|42.8|%||N||F\r",
        f"8R|5|^^^PLT|265|10*3/uL||N||F\r",
        f"9R|6|^^^MCV|88.8|fL||N||F\r",
        f"0R|7|^^^MCH|29.5|pg||N||F\r",
        f"1R|8|^^^MCHC|33.2|g/dL||N||F\r",
        f"2L|1|N\r"
    ]

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 8000))
        
        # 1. Kirim ENQ
        s.sendall(ENQ)
        resp = s.recv(10)
        if resp != ACK:
            print(f"  [PERINGATAN] Bridge tidak menjawab ACK pada ENQ: {resp}")

        # 2. Kirim frame data
        for f in frames:
            # Format ASTM frame sederhana
            pkt = STX + f.encode("ascii") + b"\x0300\r\n"
            s.sendall(pkt)
            ack_resp = s.recv(10)

        # 3. Kirim EOT
        s.sendall(EOT)
        s.close()
        print("  [OK] Simulasi Sysmex ASTM berhasil dikirim.")
    except Exception as e:
        print(f"  [GAGAL] Error kirim Sysmex: {e}")


def tes_api_status():
    """Cek status LIS Bridge via Local REST API"""
    print("\n[3] Memeriksa status LIS Bridge via Local REST API (Port 7119)...")
    try:
        r = requests.get("http://127.0.0.1:7119/api/status", timeout=3)
        print("  Status code:", r.status_code)
        print("  Respon:", json.dumps(r.json(), indent=2))
    except Exception as e:
        print(f"  [GAGAL] Gagal menghubungi API lokal: {e}")


if __name__ == "__main__":
    print("======================================================")
    print("PENGUJIAN TRANSMISI SIMULASI ALAT MEDIS")
    print("======================================================")
    tes_api_status()
    tes_mindray_hl7()
    time.sleep(1)
    tes_sysmex_astm()
    time.sleep(1)
    tes_api_status()
