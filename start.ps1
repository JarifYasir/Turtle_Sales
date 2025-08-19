# Turtle Sales Startup Script
Write-Host "Starting Turtle Sales Application..." -ForegroundColor Green

# Kill any existing Node processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Start server
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd '$PSScriptRoot\server'; node server.js"

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Start client
Write-Host "Starting frontend client..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd '$PSScriptRoot\client'; npm run dev"

Write-Host "Application started!" -ForegroundColor Green
Write-Host "Backend: http://192.168.2.24:3000" -ForegroundColor White
Write-Host "Frontend: http://192.168.2.24:5173" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
