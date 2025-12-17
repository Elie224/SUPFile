# Script PowerShell pour demarrer le frontend SUPFile
Write-Host "`n=== DEMARRAGE DU FRONTEND SUPFILE ===" -ForegroundColor Cyan
Write-Host ""

# Verifier si on est dans le bon repertoire
if (-not (Test-Path "frontend-web")) {
    Write-Host "ERREUR: Le dossier 'frontend-web' n'existe pas." -ForegroundColor Red
    Write-Host "   Assurez-vous d'etre dans le repertoire racine du projet SUPFile." -ForegroundColor Yellow
    exit 1
}

# Verifier si le frontend Docker tourne
Write-Host "Verification du frontend Docker..." -ForegroundColor Cyan
$dockerFrontend = docker ps --filter "name=supfile-frontend" --format "{{.Names}}" 2>$null
if ($dockerFrontend) {
    Write-Host "ATTENTION: Le frontend Docker tourne deja!" -ForegroundColor Yellow
    Write-Host "   Nom du conteneur: $dockerFrontend" -ForegroundColor White
    Write-Host "   Pour l'utiliser, allez sur: http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "Voulez-vous quand meme demarrer le frontend local? (O/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "O" -and $response -ne "o") {
        Write-Host "Arret du script." -ForegroundColor Yellow
        exit 0
    }
    Write-Host "Arret du frontend Docker..." -ForegroundColor Yellow
    docker compose stop frontend
    Start-Sleep -Seconds 2
}

# Aller dans le dossier frontend-web
Set-Location frontend-web

# Verifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "ATTENTION: Installation des dependances..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Verifier que le backend est accessible
Write-Host "Verification du backend..." -ForegroundColor Cyan
try {
    $backendCheck = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "OK Backend est accessible sur http://localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "ATTENTION: Backend n'est pas accessible sur http://localhost:5000" -ForegroundColor Yellow
    Write-Host "   Assurez-vous que le backend tourne: cd backend && npm run dev" -ForegroundColor Yellow
    Write-Host "   Ou utilisez: .\start-backend.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== LANCEMENT DU FRONTEND ===" -ForegroundColor Cyan
Write-Host "Le frontend va demarrer sur http://localhost:3000" -ForegroundColor Yellow
Write-Host "Appuyez sur Ctrl+C pour arreter`n" -ForegroundColor Yellow

# Lancer le frontend
npm run dev

