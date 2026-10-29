Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "           Starting NEXUS-RAG Platform             " -ForegroundColor Cyan
Write-Host "          100% Offline Multimodal System           " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 0. Check MongoDB
$mongoCheck = netstat -ano | findstr :27017
if (-not $mongoCheck) {
    Write-Host "`n[INFO] Starting local MongoDB service..." -ForegroundColor Yellow
    Start-Process -FilePath "net" -ArgumentList "start MongoDB" -WindowStyle Hidden -Wait -ErrorAction SilentlyContinue
}

# 1. Ensure LM Studio model is pinned with GPU acceleration
if (Get-Command lms -ErrorAction SilentlyContinue) {
    Write-Host "`n[0/2] Checking GPU-Accelerated Offline Model in LM Studio..." -ForegroundColor Cyan
    $loadedModels = lms ps 2>$null
    if ($loadedModels -match "gemma-3-4b") {
        Write-Host "[OK] google/gemma-3-4b is already hot in RTX 4050 GPU VRAM." -ForegroundColor Green
    } else {
        # Evict idling Ollama models to prevent VRAM memory contention
        if (Get-Command ollama -ErrorAction SilentlyContinue) {
            ollama stop gemma3:latest 2>$null
            ollama stop llama3:latest 2>$null
        }
        Write-Host "[INFO] Pinning google/gemma-3-4b into RTX 4050 GPU VRAM (100% GPU offload)..." -ForegroundColor Yellow
        lms load google/gemma-3-4b --gpu max -y
        Write-Host "[OK] Model successfully pinned into GPU VRAM!" -ForegroundColor Green
    }
}

# 2. Start Backend in a new window
Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8001..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"cd /d `"$scriptPath\backend`" && call .venv\Scripts\activate.bat && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload`""

# 3. Start Frontend in a new window
Write-Host "`n[2/2] Starting React Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"cd /d `"$scriptPath\frontend`" && call npm start`""

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "  NEXUS-RAG Services are launching!                 " -ForegroundColor Green
Write-Host "  - Backend API:  http://localhost:8001             " -ForegroundColor Green
Write-Host "  - Swagger Docs: http://localhost:8001/docs        " -ForegroundColor Green
Write-Host "  - Web Frontend: http://localhost:3000             " -ForegroundColor Green
Write-Host "  - Offline Mode: 100% Active (No Internet Needed)  " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"

Write-Host "`nServices launched in separate terminal windows." -ForegroundColor Cyan
Write-Host "Keep those terminal windows open while using the application.`n" -ForegroundColor Cyan
