@echo off
REM Suno Prompt Generator Launcher
REM Simple batch script to start the application

echo.
echo =====================================
echo   Suno Prompt Generator
echo =====================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the application
echo Starting application...
echo.
call npm start

REM Keep window open if error occurs
if errorlevel 1 (
    echo.
    echo Error occurred. Press any key to close...
    pause
)
