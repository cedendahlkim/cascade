@echo off
title Cascade Remote Bridge
color 0B
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║       CASCADE REMOTE - STARTAR...            ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  Servern startar pa http://localhost:3031
echo  Tryck Ctrl+C for att stoppa.
echo.
cd /d "%~dp0bridge"
npx tsx --no-warnings src/index.ts
pause
