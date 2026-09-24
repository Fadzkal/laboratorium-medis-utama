#!/bin/bash
# ==============================================================================
# SKRIP OTOMATIS SETUP RME SERVER DI VPS LINUX (UBUNTU / DEBIAN)
# ==============================================================================
set -e

echo "=== Menyiapkan Lingkungan Server RME & LIS Laboratorium Medis Utama ==="

# 1. Update paket & pastikan Python & pip terpasang
apt-get update -y
apt-get install -y python3 python3-pip python3-venv git curl

# 2. Pasang dependensi python
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt
fi

# 3. Setup systemd service
SERVICE_PATH="/etc/systemd/system/rme-web.service"
CURRENT_DIR=$(pwd)

sed -i "s|/var/www/rme-lab-utama|$CURRENT_DIR|g" deploy/rme-web.service
cp deploy/rme-web.service $SERVICE_PATH
systemctl daemon-reload
systemctl enable rme-web
systemctl restart rme-web

echo "=== Status Layanan rme-web ==="
systemctl status rme-web --no-pager

echo ""
echo "=============================================================================="
echo " Setup selesai! RME Web berjalan otomatis di background."
echo " Port: 5100"
echo " Cek log layanan dengan: journalctl -u rme-web -f"
echo "=============================================================================="
