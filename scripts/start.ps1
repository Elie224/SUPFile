# Script de démarrage pour SUPFile
# Usage: .\scripts\start.ps1

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUPFile - Démarrage de l'application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Docker est installé
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Docker Desktop depuis https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Vérifier si le fichier .env existe
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Le fichier .env n'existe pas" -ForegroundColor Yellow
    Write-Host "Création d'un fichier .env à partir du template..." -ForegroundColor Yellow
    
    # Créer le fichier .env avec des valeurs par défaut
    @"
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=supfile123
MONGO_INITDB_DATABASE=supfile

# JWT Secrets (CHANGEZ CES VALEURS EN PRODUCTION!)
JWT_SECRET=[REDACTED]
JWT_REFRESH_SECRET=[REDACTED]

# Upload
MAX_FILE_SIZE=32212254720

# CORS
CORS_ORIGIN=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:5000
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host "✅ Fichier .env créé avec des valeurs par défaut" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Modifiez les secrets JWT dans .env avant de déployer en production!" -ForegroundColor Yellow
    Write-Host ""
}

# Vérifier si Docker est en cours d'exécution
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "Veuillez démarrer Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker est prêt" -ForegroundColor Green
Write-Host ""

# Lancer docker compose
Write-Host "🚀 Démarrage des services avec Docker Compose..." -ForegroundColor Cyan
Write-Host ""

docker compose up








