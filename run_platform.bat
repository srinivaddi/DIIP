@echo off
title DIIP Platform Launcher
echo ===================================================
echo   DIIP (Digital Institutional Intelligence Platform)
echo   Starting Backend & Frontend Servers...
echo ===================================================

:: Start Backend and Frontend in the background of the SAME window
echo Launching Backend & Frontend servers in background...
powershell -Command "Start-Process cmd -ArgumentList '/c call .venv\Scripts\activate.bat && set PYTHONPATH=.;.agents && uvicorn backend.rest.main:app' -NoNewWindow; Start-Process cmd -ArgumentList '/c cd ui && npm install && npm run build && npm run start' -NoNewWindow"



echo ===================================================
echo   Both servers launched. Checking status...
echo   Waiting for http://localhost:5000/dashboard to compile...
echo ===================================================

powershell -Command "$url = 'http://localhost:5000/dashboard'; while ($true) { try { $resp = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop; if ($resp.StatusCode -eq 200) { Write-Host 'DIIP Frontend is ready! Launching web browser...'; Start-Process $url; break } } catch {} Start-Sleep -Seconds 2 }"


echo ===================================================
echo   Press ANY KEY in this window to SHUT DOWN both servers...
echo ===================================================
pause > nul

echo Shutting down DIIP servers...
:: Search netstat for processes holding port 8000 and 5000 and terminate them
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
echo Done.

