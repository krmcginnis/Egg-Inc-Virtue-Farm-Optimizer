@echo off
cd /d "%~dp0"
if /i "%~1"=="--console" goto console
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0Local-Helper.ps1" -Background %*
exit /b
:console
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Local-Helper.ps1" -Console
if errorlevel 1 pause
