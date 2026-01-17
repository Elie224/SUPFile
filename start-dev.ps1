# Script de démarrage en mode développement (sans Docker)
# Usage: .\start-dev.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUPFile - Mode développement" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Node.js est installé
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js n'est pas installé" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js version: $(node --version)" -ForegroundColor Green
Write-Host ""

# Vérifier MongoDB
Write-Host "Vérification de MongoDB..." -ForegroundColor Cyan
try {
    $mongoRunning = docker ps --filter "name=mongodb" --format "{{.Names}}" | Select-String "mongodb"
    if (-not $mongoRunning) {
        Write-Host "⚠️  MongoDB n'est pas démarré. Démarrage de MongoDB..." -ForegroundColor Yellow
        docker run -d -p 27017:27017 --name mongodb mongo:6.0
        Start-Sleep -Seconds 3
    }
    Write-Host "✅ MongoDB est prêt" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Impossible de vérifier MongoDB. Assurez-vous qu'il est démarré sur le port 27017" -ForegroundColor Yellow
}

Write-Host ""

# Backend
Write-Host "📦 Installation des dépendances backend..." -ForegroundColor Cyan
Set-Location backend
if (-not (Test-Path node_modules)) {
    npm install
}
Write-Host ""

# Vérifier le fichier .env du backend
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Création du fichier .env pour le backend..." -ForegroundColor Yellow
    @"
NODE_ENV=development
SERVER_PORT=5000
SERVER_HOST=0.0.0.0
MONGO_URI=mongodb://localhost:27017/supfile
JWT_SECRET=dev_jwt_secret_change_in_production_32_chars_min
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production_32_chars_min
MAX_FILE_SIZE=32212254720
UPLOAD_DIR=./uploads
CORS_ORIGIN=http://localhost:3000
"@ | Out-File -FilePath .env -Encoding utf8
}

Write-Host "🚀 Démarrage du backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Start-Sleep -Seconds 2

Set-Location ..

# Frontend
Write-Host "📦 Installation des dépendances frontend..." -ForegroundColor Cyan
Set-Location frontend-web
if (-not (Test-Path node_modules)) {
    npm install
}
Write-Host ""

# Vérifier le fichier .env.local du frontend
if (-not (Test-Path .env.local)) {
    Write-Host "⚠️  Création du fichier .env.local pour le frontend..." -ForegroundColor Yellow
    @"
VITE_API_URL=http://localhost:5000
"@ | Out-File -FilePath .env.local -Encoding utf8
}

Write-Host "🚀 Démarrage du frontend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backend: http://localhost:5000" -ForegroundColor Green
Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter le frontend" -ForegroundColor Yellow
Write-Host ""

npm run dev








