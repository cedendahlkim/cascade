@echo off
title Cascade Remote - Computer Agent
color 0A
echo.
echo  ====================================
echo   Cascade Remote - Computer Agent
echo   One-Click Installer for Windows
echo  ====================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js not found. Installing...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    if %errorlevel% neq 0 (
        echo.
        echo [!] Could not auto-install Node.js.
        echo [!] Please download it from: https://nodejs.org
        echo [!] Then run this script again.
        pause
        exit /b 1
    )
    echo [OK] Node.js installed! Please close and re-open this script.
    pause
    exit /b 0
)

echo [OK] Node.js %node --version%

:: Setup directory
set AGENT_DIR=%USERPROFILE%\cascade-agent
if not exist "%AGENT_DIR%" mkdir "%AGENT_DIR%"

:: Copy agent.mjs next to this bat file
copy /Y "%~dp0agent.mjs" "%AGENT_DIR%\agent.mjs" >nul 2>nul

:: Create package.json
echo {"name":"cascade-agent","type":"module","dependencies":{"socket.io-client":"^4.7.0"}} > "%AGENT_DIR%\package.json"

:: Install
echo [*] Installing dependencies...
cd /d "%AGENT_DIR%"
call npm install --silent 2>nul
echo [OK] Ready!

:: Ask for URL
echo.
set /p BRIDGE="  Enter bridge URL (or press Enter for localhost): "
if "%BRIDGE%"=="" set BRIDGE=http://localhost:3031

echo.
node agent.mjs "%BRIDGE%"
pause
