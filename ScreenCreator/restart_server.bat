@echo off
call kill_server.bat
timeout /t 2 /nobreak
echo Starting server...
start npm run dev
