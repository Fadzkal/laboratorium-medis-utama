@echo off
chcp 65001 >nul
title Pasang Otomatis LIS Bridge - Laboratorium Medis Utama

echo ===============================================================================
echo   PEMASANG OTOMATIS LIS BRIDGE - LABORATORIUM MEDIS UTAMA
echo ===============================================================================
echo.
echo Sedang mendaftarkan LIS Bridge agar:
echo 1. Otomatis berjalan saat Windows dinyalakan (Startup Otomatis)
echo 2. Dapat diaktifkan langsung lewat tombol di Web RME (Protokol lmu-bridge://)
echo.

set CURRENT_DIR=%~dp0
set JALANKAN_BAT=%CURRENT_DIR%jalankan.bat
set BRIDGE_PY=%CURRENT_DIR%bridge_alat.py

if not exist "%JALANKAN_BAT%" (
    echo [ERROR] File jalankan.bat tidak ditemukan di direktori:
    echo %CURRENT_DIR%
    echo Pastikan seluruh file paket LIS Bridge disalin dalam satu folder yang sama.
    echo.
    pause
    exit /b 1
)

if not exist "%BRIDGE_PY%" (
    echo [ERROR] File bridge_alat.py tidak ditemukan di direktori:
    echo %CURRENT_DIR%
    echo Pastikan seluruh file paket LIS Bridge disalin dalam satu folder yang sama.
    echo.
    pause
    exit /b 1
)

:: 1. Buat Script Runner Latar Belakang (Silent Background / Tanpa Layar Hitam)
set RUNNER_VBS=%CURRENT_DIR%bridge_background.vbs
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%CURRENT_DIR%"
echo WshShell.Run chr^(34^) ^& "%JALANKAN_BAT%" ^& chr^(34^), 0, False
echo Set WshShell = Nothing
) > "%RUNNER_VBS%"

:: 2. Pasang ke Startup Windows agar otomatis aktif saat PC Lab dinyalakan
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set STARTUP_VBS=%STARTUP_FOLDER%\LMU_Bridge_Otomatis.vbs

copy /y "%RUNNER_VBS%" "%STARTUP_VBS%" >nul
if %errorlevel% equ 0 (
    echo [OK] Berhasil didaftarkan ke Startup Windows!
) else (
    echo [PERINGATAN] Gagal menyalin ke folder Startup Windows.
)

:: 3. Daftarkan Protokol lmu-bridge:// di Windows Registry (Bisa dipanggil dari Browser)
reg add "HKCU\Software\Classes\lmu-bridge" /ve /d "URL:LMU Bridge Protocol" /f >nul
reg add "HKCU\Software\Classes\lmu-bridge" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\lmu-bridge\shell\open\command" /ve /d "wscript.exe \"%RUNNER_VBS%\"" /f >nul

if %errorlevel% equ 0 (
    echo [OK] Berhasil mendaftarkan protokol web lmu-bridge://!
) else (
    echo [PERINGATAN] Gagal mendaftarkan registry protokol web.
)

echo.
echo ===============================================================================
echo   PEMASANGAN SELESAI
echo ===============================================================================
echo.
echo LIS Bridge sekarang:
echo - Akan otomatis aktif setiap kali komputer lab ini dinyalakan.
echo - Dapat dipanggil secara otomatis dari tombol Web RME.
echo - Lokasi instalasi: %CURRENT_DIR%
echo.
pause
