@echo off
title Cascade Remote - Setup
color 0A
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║       CASCADE REMOTE - INSTALLATION          ║
echo  ║       AI Research Lab ^& Remote Control       ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [!] Node.js hittades inte!
    echo  [!] Ladda ner fran: https://nodejs.org/
    echo  [!] Installera Node.js och kör detta script igen.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo  [OK] Node.js %NODE_VERSION% hittad
echo.

:: Step 1: Install bridge dependencies
echo  [1/4] Installerar bridge-beroenden...
cd /d "%~dp0bridge"
call npm install
if %errorlevel% neq 0 (
    echo  [!] npm install misslyckades i bridge/
    pause
    exit /b 1
)
echo  [OK] Bridge-beroenden installerade
echo.

:: Step 2: Install web dependencies and build
echo  [2/4] Installerar web-beroenden...
cd /d "%~dp0web"
call npm install
if %errorlevel% neq 0 (
    echo  [!] npm install misslyckades i web/
    pause
    exit /b 1
)
echo  [OK] Web-beroenden installerade
echo.

echo  [3/4] Bygger webbgranssnittet...
call npm run build
if %errorlevel% neq 0 (
    echo  [!] Web build misslyckades
    pause
    exit /b 1
)
echo  [OK] Webbgranssnitt byggt
echo.

:: Step 3: Create .env if missing
cd /d "%~dp0bridge"
if not exist ".env" (
    echo  [4/4] Skapar konfigurationsfil...
    (
        echo # Cascade Remote - Konfiguration
        echo # Fyll i dina API-nycklar nedan
        echo.
        echo # Claude AI (Anthropic) - https://console.anthropic.com/
        echo ANTHROPIC_API_KEY=
        echo LLM_MODEL=claude-sonnet-4-20250514
        echo.
        echo # Gemini AI (Google) - https://aistudio.google.com/apikey
        echo GEMINI_API_KEY=
        echo GEMINI_MODEL=gemini-2.0-flash
        echo.
        echo # Server
        echo PORT=3031
        echo.
        echo # Sakerhet (valfritt)
        echo # SESSION_PASSWORD=
        echo # ALLOWED_ORIGINS=http://localhost:3031
        echo.
        echo # Cloudflare Tunnel (satt NO_TUNNEL=1 for att stanga av)
        echo # NO_TUNNEL=1
    ) > .env
    echo  [OK] .env skapad - du MASTE fylla i API-nycklar!
) else (
    echo  [4/4] .env finns redan - hoppar over
)
echo.

:: Done
echo  ╔══════════════════════════════════════════════╗
echo  ║          INSTALLATION KLAR!                  ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  Nasta steg:
echo.
echo  1. Redigera bridge\.env och lagg till dina API-nycklar:
echo     - ANTHROPIC_API_KEY (for Claude)
echo     - GEMINI_API_KEY (for Gemini)
echo.
echo  2. Starta servern:
echo     Dubbelklicka pa: start.bat
echo.
echo  3. Oppna i webblasaren:
echo     http://localhost:3031
echo.
echo  4. (Valfritt) Installera som Windows-tjanst:
echo     Kor som Admin: bridge\service-install.cjs
echo.
pause
