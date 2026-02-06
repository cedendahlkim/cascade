# Persistent Cloudflare Tunnel with auto-restart
# Run: powershell -ExecutionPolicy Bypass -File start-tunnel.ps1

$port = 3031
$retryDelay = 5

Write-Host "[tunnel] Starting persistent Cloudflare Tunnel on port $port..." -ForegroundColor Cyan

while ($true) {
    Write-Host "[tunnel] Launching cloudflared..." -ForegroundColor Yellow
    
    $process = Start-Process -FilePath "cloudflared" `
        -ArgumentList "tunnel", "--url", "http://localhost:$port" `
        -NoNewWindow -PassThru -RedirectStandardError "$env:TEMP\cloudflared-stderr.log"
    
    # Wait for URL to appear in log
    Start-Sleep -Seconds 8
    if (Test-Path "$env:TEMP\cloudflared-stderr.log") {
        $log = Get-Content "$env:TEMP\cloudflared-stderr.log" -Raw
        if ($log -match "(https://[a-z0-9-]+\.trycloudflare\.com)") {
            Write-Host "[tunnel] URL: $($Matches[1])" -ForegroundColor Green
        }
    }
    
    # Wait for process to exit
    $process.WaitForExit()
    Write-Host "[tunnel] Tunnel died (exit code: $($process.ExitCode)). Restarting in ${retryDelay}s..." -ForegroundColor Red
    Start-Sleep -Seconds $retryDelay
}
