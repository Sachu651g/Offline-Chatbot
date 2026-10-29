Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "           Starting NEXUS-RAG Platform             " -ForegroundColor Cyan
Write-Host "                (Windows Edition)                  " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 0. Ensure LM Studio model is pinned with GPU acceleration
if (Get-Command lms -ErrorAction SilentlyContinue) {
    Write-Host "`n[0/2] Pinning google/gemma-3-4b into GPU VRAM..." -ForegroundColor Cyan
    lms load google/gemma-3-4b --gpu max -y 2>$null
}

# 1. Start Backend in a new window
Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8001..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"cd /d `"$scriptPath\backend`" && call .venv\Scripts\activate.bat && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload`""

# 2. Start Frontend in a new window
Write-Host "`n[2/2] Starting React Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"cd /d `"$scriptPath\frontend`" && call npm start`""

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "  NEXUS-RAG Services are launching!                 " -ForegroundColor Green
Write-Host "  - Backend:  http://localhost:8001                 " -ForegroundColor Green
Write-Host "  - Swagger:  http://localhost:8001/docs            " -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:3000                 " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"

Write-Host "`nServices launched in separate terminal windows." -ForegroundColor Cyan
Write-Host "Keep those terminal windows open while using the application.`n" -ForegroundColor Cyan
