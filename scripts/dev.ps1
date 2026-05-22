# VetCare — levanta TODOS los microservicios + frontend
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "VetCare: instalando dependencias..." -ForegroundColor Cyan
Set-Location $root
npm run install:auth

Write-Host ""
Write-Host "VetCare: iniciando 6 microservicios + frontend (7 procesos)..." -ForegroundColor Green
Write-Host "  api     -> http://localhost:3001  (user-management)"
Write-Host "  pets    -> http://localhost:3002  (clinical-history)"
Write-Host "  rem     -> http://localhost:3003  (tracking-reminders)"
Write-Host "  storage -> http://localhost:3004  (storage-service)"
Write-Host "  query   -> http://localhost:3005  (query-visualization)"
Write-Host "  notif   -> http://localhost:3006  (notification-service)"
Write-Host "  web     -> http://localhost:3000  (frontend Vite)"
Write-Host ""
Write-Host "Ctrl+C para detener todo." -ForegroundColor Yellow
Write-Host ""

npm run dev
