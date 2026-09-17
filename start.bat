@echo off
title Expense Tracker - Starting...
echo ========================================================
echo   ApexPay Expense Tracker - Starting Up
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this computer!
    echo Please install Node.js from https://nodejs.org (LTS Version)
    echo Then run this file again.
    echo.
    pause
    exit /b
)

if not exist "node_modules" (
    echo [FIRST RUN DETECTED] Installing dependencies, please wait a moment...
    call npm run setup
    echo.
)

echo Starting Expense Tracker (Server + Client)...
echo Open your browser to: http://localhost:3000
echo.

start http://localhost:3000
npm run dev
pause
