@echo off
set /p PORT=Enter the local port number: 
echo Starting ngrok on port %PORT% in folder %cd%
ngrok http %PORT%
pause
