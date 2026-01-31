@echo off
echo Killing process on port 5001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5001" ^| find "LISTENING"') do (
  echo Found PID %%a on port 5001
  taskkill /f /pid %%a
)

echo Killing process on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
  echo Found PID %%a on port 5000
  taskkill /f /pid %%a
)
echo Done.
