@echo off
setlocal enabledelayedexpansion
title AGOS Pict Studio — Creative Visual Playground
cd /d "%~dp0"

cls
echo ================================================================
echo   ✦ AGOS_PICT STUDIO — Creative Visual Playground ^& Style Engine
echo   Ecosistema AgTechDesigne · Versione 2.5.0 (MIT-Grade)
echo ================================================================
echo.

:: 1. Verifica ambiente Python
echo [1/4] Verifica interprete Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRORE CRITICO] Python non e' stato trovato nel PATH di sistema!
    echo Per avviare AGOS Pict Studio:
    echo 1. Scarica e installa Python 3.10+ da https://www.python.org/
    echo 2. Ricordati di selezionare la spunta "Add python.exe to PATH".
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
echo       - %PY_VER% rilevato: OK

:: 2. Verifica libreria Pillow per Aspect Ratio Engine MIT-Grade
echo [2/4] Verifica modulo Pillow (Center-Crop MIT-Grade)...
python -c "import PIL" >nul 2>&1
if errorlevel 1 (
    echo       - Modulo Pillow mancante. Installazione automatica in corso...
    python -m pip install pillow
    if errorlevel 1 (
        echo [ATTENZIONE] Installazione Pillow fallita. L'auto-crop MIT sara' disattivato.
    ) else (
        echo       - Modulo Pillow installato con successo: OK
    )
) else (
    echo       - Motore grafico Pillow: OK
)

:: 3. Verifica e liberazione porta 8300 (evita collisioni WinError 10048)
echo [3/4] Controllo porta 8300...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8300 ^| findstr LISTENING 2^>nul') do (
    if not "%%a"=="" (
        echo       - Chiusura processo precedente su porta 8300 (PID %%a)...
        taskkill /f /pid %%a >nul 2>&1
    )
)
echo       - Porta 8300 libera per l'ascolto: OK

:: 4. Apertura automatica del browser predefinito a server pronto
echo [4/4] Avvio server HTTP e monitoraggio in tempo reale...
start "" /b python scripts/open_browser.py http://127.0.0.1:8300

echo.
echo ================================================================
echo   Server attivo su: http://127.0.0.1:8300
echo   La pagina nel browser si aprira' automaticamente a secondi.
echo   Premi CTRL+C per arrestare il server in qualsiasi momento.
echo ================================================================
echo.

python -u server.py

if errorlevel 1 (
    echo.
    echo [AVVISO] Il server si e' interrotto (codice %errorlevel%).
    pause
)