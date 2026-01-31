@echo off
echo Starting client development server...
cd /d "%~dp0\.."
call npm run dev:client
