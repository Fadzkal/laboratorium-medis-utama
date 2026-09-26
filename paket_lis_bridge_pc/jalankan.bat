@echo off
title LIS BRIDGE ALAT MEDIS - LABORATORIUM MEDIS UTAMA
color 0A
cd /d "%~dp0"

echo =====================================================================
echo  MENJALANKAN LIS BRIDGE ALAT MEDIS
echo  Laboratorium Medis Utama
echo =====================================================================
echo.
echo  Port Mindray BS-240 (HL7 MLLP) : 7118
echo  Port Sysmex XP-100  (ASTM)     : 8000
echo  Port Local REST API (Web Sync) : 7119
echo.
echo  Menghubungkan ke database dan mendengarkan alat medis...
echo  Tekan Ctrl+C untuk menghentikan.
echo =====================================================================
echo.

python bridge_alat.py

if errorlevel 1 (
    echo.
    echo =====================================================================
    echo [PERINGATAN] Terjadi kendala saat menjalankan LIS Bridge.
    echo Pastikan Python 3 sudah terpasang dan port tidak sedang dipakai.
    echo =====================================================================
    echo.
    pause
)
