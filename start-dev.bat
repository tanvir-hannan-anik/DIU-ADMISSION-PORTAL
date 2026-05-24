@echo off
echo ============================================
echo  DIU Local Development Startup
echo ============================================

:: Kill any old Python/Flask process on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    echo Stopping existing process on port 5000 (PID %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

:: Start Python AI Backend (Flask on port 5000)
echo.
echo [1/2] Starting Python AI Backend on http://localhost:5000 ...
set FLASK_ENV=production
start "DIU AI Backend" /MIN cmd /c "cd /d d:\DIU\backend-python && venv\Scripts\python.exe main.py > d:\DIU\flask.log 2>&1"

:: Wait for Flask to be ready
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Check if Flask is up
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [OK] AI Backend is running on http://localhost:5000
) else (
    echo [WARN] Backend may still be starting. Check flask.log if issues persist.
)

:: Start React Frontend (port 3000)
echo.
echo [2/2] Starting React Frontend on http://localhost:3000 ...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [OK] React frontend already running on http://localhost:3000
) else (
    start "DIU React Frontend" cmd /c "cd /d d:\DIU\frontend-react && npm start"
    echo Waiting for React to start (this takes ~30 seconds)...
    timeout /t 10 /nobreak >nul
    echo [OK] React frontend starting at http://localhost:3000
)

echo.
echo ============================================
echo  App ready at: http://localhost:3000
echo  AI backend :  http://localhost:5000
echo  Logs       :  d:\DIU\flask.log
echo ============================================
echo.
pause
