"""
================================================================================
PELUNCUR TERPADU (UNIFIED RUNNER) - LABORATORIUM MEDIS UTAMA
================================================================================
Menjalankan Web Server RME dan LIS Bridge Alat Medis sekaligus dalam 1 terminal:
- Web Aplikasi RME          : http://localhost:5100/app.html
- Display Antrean Harian    : http://localhost:5100/display.html
- Listener Sysmex XP-100    : Port 8000 (ASTM E1381/E1394)
- Listener Mindray BS-240   : Port 7118 (HL7 MLLP)
- Local REST API Bridge     : Port 7119 (Web sync)

Penggunaan:
  python run.py
  (atau cukup double-click jalankan.bat)
================================================================================
"""

import os
import sys
import time
import socket
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Pastikan path modul bridge dapat diakses
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

PORT_WEB = 5100
HOST_WEB = "0.0.0.0"


def cek_port_terpakai(port: int, host: str = "127.0.0.1") -> bool:
    """Memeriksa apakah port sudah dipakai proses lain"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


class RMEHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Handler HTTP statis dengan optimasi header dan peredam spam log"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Header CORS untuk integrasi LIS lokal
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        # Hindari cache agresif pada pengembangan lokal
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        # Redirect otomatis root / ke /app.html
        if self.path in ("/", ""):
            self.send_response(302)
            self.send_header("Location", "/app.html")
            self.end_headers()
            return
        super().do_GET()

    def log_message(self, format, *args):
        # Redam log normal 200/304 agar terminal tetap bersih dan rapi
        if len(args) >= 2:
            try:
                code = int(args[1])
                if code >= 400:
                    super().log_message(format, *args)
            except ValueError:
                pass


def start_web_server(port: int = PORT_WEB):
    """Menjalankan server web RME"""
    httpd = ThreadingHTTPServer((HOST_WEB, port), RMEHTTPRequestHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True, name="WebServer")
    t.start()
    return httpd


def main():
    buka_browser = "--no-browser" not in sys.argv

    # Periksa port sebelum mulai
    if cek_port_terpakai(PORT_WEB):
        print(f"[PERINGATAN] Port {PORT_WEB} sedang aktif/dipakai. Pastikan proses lama sudah ditutup.")

    # 1. Jalankan LIS Bridge Alat Medis (Port 8000, 7118, 7119)
    try:
        from bridge import bridge_alat
        bridge_threads = bridge_alat.start_bridge_threads()
    except Exception as e:
        print(f"[GAGAL] Error saat menginisialisasi LIS Bridge: {e}")
        bridge_threads = {}

    # 2. Jalankan Web Server RME (Port 5100)
    try:
        httpd = start_web_server(PORT_WEB)
    except Exception as e:
        print(f"[GAGAL] Gagal menyalakan Web Server di port {PORT_WEB}: {e}")
        sys.exit(1)

    time.sleep(0.5)

    # 3. Tampilkan Banner Dashboard di Terminal
    print("\n" + "=" * 74)
    print("   SISTEM RME & LIS BRIDGE TERPADU - LABORATORIUM MEDIS UTAMA")
    print("=" * 74)
    print(f"  [OK] Web Aplikasi RME         : http://localhost:{PORT_WEB}/app.html")
    print(f"  [OK] Display Antrean Harian   : http://localhost:{PORT_WEB}/display.html")
    print(f"  [OK] Alat Sysmex XP-100 (ASTM): Port 8000 (ASTM E1381/E1394)")
    print(f"  [OK] Alat Mindray BS-240(HL7) : Port 7118 (HL7 MLLP)")
    print(f"  [OK] LIS Local REST API       : http://127.0.0.1:7119")
    print("=" * 74)
    print("  Status: SEMUA LAYANAN AKTIF DALAM 1 TERMINAL")
    print("  Tekan Ctrl+C untuk mematikan seluruh layanan sekaligus.")
    print("=" * 74 + "\n")

    # Buka browser otomatis
    if buka_browser:
        def _buka():
            time.sleep(1.0)
            webbrowser.open(f"http://localhost:{PORT_WEB}/app.html")
        threading.Thread(target=_buka, daemon=True).start()

    # Loop utama untuk menangani Ctrl+C
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n" + "-" * 74)
        print("  Menghentikan semua layanan...")
        try:
            httpd.shutdown()
            httpd.server_close()
        except Exception:
            pass
        print("  [OK] Web server port 5100 dimatikan.")
        print("  [OK] LIS bridge port 8000, 7118, 7119 dimatikan.")
        print("  Semua layanan berhasil ditutup dengan bersih. Sampai jumpa!")
        print("-" * 74)
        sys.exit(0)


if __name__ == "__main__":
    main()
