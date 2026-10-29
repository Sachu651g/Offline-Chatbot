@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo            Starting NEXUS-RAG Platform
echo                 (Windows Edition)
echo ====================================================

cd /d "%~dp0"

:: Check if setup has been completed (virtual environment with packages and node_modules)
set "RUN_SETUP=0"
if not exist "%~dp0backend\.venv" set "RUN_SETUP=1"
if not exist "%~dp0backend\.venv\Scripts\uvicorn.exe" set "RUN_SETUP=1"
if not exist "%~dp0frontend\node_modules" set "RUN_SETUP=1"

if "!RUN_SETUP!"=="1" (
    echo [INFO] Missing dependencies or first-time setup detected.
    echo Running setup.bat to install required packages...
    echo.
    call "%~dp0setup.bat"
    if not exist "%~dp0backend\.venv\Scripts\uvicorn.exe" (
        echo [ERROR] Backend packages such as uvicorn were not installed.
        echo Please check the error above or run setup.bat directly.
        pause
        exit /b 1
    )
)

:: Ensure .env exists in backend
if not exist "%~dp0backend\.env" (
    if exist "%~dp0backend\.env.example" (
        echo Creating backend\.env from .env.example...
        copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
    )
)

:: Ensure .env exists in frontend
if not exist "%~dp0frontend\.env" (
    if exist "%~dp0frontend\.env.example" (
        echo Creating frontend\.env from .env.example...
        copy "%~dp0frontend\.env.example" "%~dp0frontend\.env" >nul
    )
)

where lms >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [0/2] Pinning google/gemma-3-4b in LM Studio GPU memory...
    lms load google/gemma-3-4b --gpu max -y >nul 2>nul
)

echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8001...
start "NEXUS-RAG Backend (FastAPI)" /D "%~dp0backend" cmd /k "call .venv\Scripts\activate.bat && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

echo.
echo [2/2] Starting React Frontend on http://localhost:3000...
start "NEXUS-RAG Frontend (React)" /D "%~dp0frontend" cmd /k "call npm start"

echo.
echo ====================================================
echo   NEXUS-RAG Services are launching!
echo   - Backend:  http://localhost:8001
echo   - Swagger:  http://localhost:8001/docs
echo   - Frontend: http://localhost:3000
echo ====================================================
echo.
ping 127.0.0.1 -n 6 >nul
start http://localhost:3000

echo Services launched in separate terminal windows.
echo Keep those windows open while using the application.
echo.
pause
