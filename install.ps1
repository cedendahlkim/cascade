# ============================================================
#  Cascade Remote — Automatisk installation (Windows)
#  Kör med:  irm <SERVER_URL>/api/install-script | iex
# ============================================================

$ErrorActionPreference = "Stop"
$installDir = "$env:USERPROFILE\CascadeRemote"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     Cascade Remote — Installer       ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# --- 1. Kolla Node.js ---
Write-Host "[1/6] Kontrollerar Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version 2>$null
    if ($nodeVersion) {
        Write-Host "       Node.js $nodeVersion hittad" -ForegroundColor Green
    } else { throw "not found" }
} catch {
    Write-Host "       Node.js saknas! Installerar via winget..." -ForegroundColor Red
    try {
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Host "       Node.js installerad!" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "  Kunde inte installera Node.js automatiskt." -ForegroundColor Red
        Write-Host "  Ladda ner manuellt: https://nodejs.org" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
}

# --- 2. Ladda ner ---
Write-Host "[2/6] Laddar ner Cascade Remote..." -ForegroundColor Yellow
$zipPath = "$env:TEMP\cascade-remote.zip"
$downloadUrl = "$env:CASCADE_DOWNLOAD_URL"

if (-not $downloadUrl) {
    # Fallback: försök hitta URL från scriptet som kördes via pipe
    # Om scriptet kördes via irm <url>/api/install-script | iex
    # så sätter vi download-URL baserat på samma server
    Write-Host "       Ange server-URL (t.ex. https://din-tunnel.trycloudflare.com):" -ForegroundColor Cyan
    $serverUrl = Read-Host "       URL"
    if (-not $serverUrl) {
        Write-Host "  Ingen URL angiven. Avbryter." -ForegroundColor Red
        exit 1
    }
    $downloadUrl = "$serverUrl/api/download"
}

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    $sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
    Write-Host "       Nedladdat ($sizeMB MB)" -ForegroundColor Green
} catch {
    Write-Host "  Nedladdning misslyckades: $_" -ForegroundColor Red
    exit 1
}

# --- 3. Packa upp ---
Write-Host "[3/6] Packar upp till $installDir..." -ForegroundColor Yellow
if (Test-Path $installDir) {
    Write-Host "       Mappen finns redan — skapar backup..." -ForegroundColor Yellow
    $backup = "${installDir}_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Rename-Item $installDir $backup
    Write-Host "       Backup: $backup" -ForegroundColor DarkGray
}
Expand-Archive -Path $zipPath -DestinationPath $installDir -Force
Remove-Item $zipPath -Force
Write-Host "       Upppackat!" -ForegroundColor Green

# --- 4. Installera beroenden ---
Write-Host "[4/6] Installerar beroenden (bridge)..." -ForegroundColor Yellow
Push-Location "$installDir\bridge"
& npm install --loglevel=error 2>&1 | Out-Null
Pop-Location
Write-Host "       Bridge-beroenden klara" -ForegroundColor Green

Write-Host "       Installerar beroenden (web)..." -ForegroundColor Yellow
Push-Location "$installDir\web"
& npm install --loglevel=error 2>&1 | Out-Null
Write-Host "       Bygger webbklient..." -ForegroundColor Yellow
& npm run build 2>&1 | Out-Null
Pop-Location
Write-Host "       Webbklient klar" -ForegroundColor Green

# --- 5. Skapa .env ---
Write-Host "[5/6] Konfigurerar API-nycklar..." -ForegroundColor Yellow
$envFile = "$installDir\bridge\.env"
$envExample = "$installDir\bridge\.env.example"

if (Test-Path $envFile) {
    Write-Host "       .env finns redan — behåller befintlig" -ForegroundColor DarkGray
} else {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
    } else {
        @"
# Cascade Remote - Konfiguration
ANTHROPIC_API_KEY=
LLM_MODEL=claude-sonnet-4-20250514

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

PORT=3031
"@ | Set-Content $envFile
    }

    Write-Host ""
    Write-Host "  Vill du ange API-nycklar nu? (y/n)" -ForegroundColor Cyan
    $answer = Read-Host "  "
    if ($answer -eq "y" -or $answer -eq "Y") {
        Write-Host ""
        $anthropicKey = Read-Host "  Anthropic API-nyckel (Enter för att hoppa över)"
        $geminiKey = Read-Host "  Gemini API-nyckel (Enter för att hoppa över)"

        $envContent = Get-Content $envFile -Raw
        if ($anthropicKey) {
            $envContent = $envContent -replace "ANTHROPIC_API_KEY=", "ANTHROPIC_API_KEY=$anthropicKey"
        }
        if ($geminiKey) {
            $envContent = $envContent -replace "GEMINI_API_KEY=", "GEMINI_API_KEY=$geminiKey"
        }
        Set-Content $envFile $envContent
        Write-Host "       Nycklar sparade!" -ForegroundColor Green
    } else {
        Write-Host "       Redigera $envFile senare för att lägga till nycklar" -ForegroundColor DarkGray
    }
}

# --- 6. Skapa genväg + starta ---
Write-Host "[6/6] Skapar genväg och startar..." -ForegroundColor Yellow

# Skapa start-script
$startScript = "$installDir\start-cascade.bat"
@"
@echo off
title Cascade Remote
cd /d "$installDir\bridge"
echo Starting Cascade Remote...
echo.
echo   Oppna i webblasaren: http://localhost:3031
echo   Tryck Ctrl+C for att stoppa
echo.
npx tsx src/index.ts
pause
"@ | Set-Content $startScript

# Skapa skrivbordsgenväg
try {
    $desktop = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = "$desktop\Cascade Remote.lnk"
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $startScript
    $shortcut.WorkingDirectory = "$installDir\bridge"
    $shortcut.Description = "Starta Cascade Remote"
    $shortcut.Save()
    Write-Host "       Genvag skapad pa skrivbordet!" -ForegroundColor Green
} catch {
    Write-Host "       Kunde inte skapa genvag (inte kritiskt)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║   Installation klar!                 ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Installerad i: $installDir" -ForegroundColor White
Write-Host "  Starta med:    Dubbelklicka 'Cascade Remote' pa skrivbordet" -ForegroundColor White
Write-Host "  Eller kor:     $startScript" -ForegroundColor White
Write-Host ""

# Fråga om vi ska starta nu
Write-Host "  Starta Cascade Remote nu? (y/n)" -ForegroundColor Cyan
$startNow = Read-Host "  "
if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host ""
    Write-Host "  Startar... Oppna http://localhost:3031 i din webblasare" -ForegroundColor Green
    Write-Host ""
    Push-Location "$installDir\bridge"
    & npx tsx src/index.ts
    Pop-Location
}
