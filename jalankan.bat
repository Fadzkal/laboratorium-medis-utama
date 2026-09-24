@echo off
title RME & LIS BRIDGE - LABORATORIUM MEDIS UTAMA
color 0A
cd /d "%~dp0"

echo ========================================================================
echo   MENYIAPKAN RME & LIS BRIDGE LABORATORIUM MEDIS UTAMA
echo ========================================================================
echo.

python run.py %*

if errorlevel 1 (
    echo.
    echo ========================================================================
    echo  [PERINGATAN] Terjadi kendala saat menjalankan program.
    echo  Pastikan Python sudah terpasang dan port tidak sedang dipakai.
    echo ========================================================================
    pause
)
