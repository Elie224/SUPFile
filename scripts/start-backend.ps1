# Script PowerShell pour demarrer le backend SUPFile

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

Write-Host "`n=== DEMARRAGE DU BACKEND SUPFILE ===" -ForegroundColor Cyan
Write-Host ""

# Verifier si on est dans le bon repertoire
if (-not (Test-Path "backend")) {
    Write-Host "ERREUR: Le dossier 'backend' n'existe pas." -ForegroundColor Red
    Write-Host "   Assurez-vous d'etre dans le repertoire racine du projet SUPFile." -ForegroundColor Yellow
    exit 1
}

# Aller dans le dossier backend
Set-Location backend

# Verifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "ATTENTION: Installation des dependances..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Verifier que MongoDB est accessible
Write-Host "Verification de MongoDB..." -ForegroundColor Cyan
try {
    $mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
    if ($mongoCheck.TcpTestSucceeded) {
        Write-Host "OK MongoDB est accessible sur localhost:27017" -ForegroundColor Green
        
        # Verifier et configurer le .env si necessaire
        if (Test-Path ".env") {
            $envContent = Get-Content .env -Raw
            if (-not ($envContent -match "MONGO_URI=[REDACTED]")) {
                Write-Host "Configuration MongoDB optimale..." -ForegroundColor Yellow
                # S'assurer que MONGO_URI est correct pour developpement local
                if ($envContent -match "MONGO_URI=[REDACTED]") {
                    $envContent = $envContent -replace "MONGO_URI=[REDACTED]", "MONGO_URI=[REDACTED]"
                } else {
                    $envContent += "`nMONGO_URI=mongodb://[REDACTED]"
                }
                Set-Content -Path .env -Value $envContent -NoNewline -Encoding UTF8
                Write-Host "OK Configuration MongoDB mise a jour pour developpement local" -ForegroundColor Green
            }
        } else {
            Write-Host "ATTENTION: Fichier .env non trouve. Creation avec configuration optimale..." -ForegroundColor Yellow
            $envLines = @(
                "# Configuration MongoDB - Developpement Local (Sans authentification)",
                "MONGO_URI=[REDACTED]",
                "",
                "# Configuration Serveur",
                "SERVER_PORT=5000",
                "SERVER_HOST=0.0.0.0",
                "NODE_ENV=development",
                "",
                "# JWT Secrets",
                "JWT_SECRET=[REDACTED]",
                "JWT_REFRESH_SECRET=[REDACTED]",
                "",
                "# Upload",
                "MAX_FILE_SIZE=32212254720",
                "UPLOAD_DIR=./uploads",
                "",
                "# CORS",
                "CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:19000,exp://localhost:19000",
                "",
                "# OAuth (Optionnel)",
                "GOOGLE_CLIENT_ID=",
                "GOOGLE_CLIENT_SECRET=",
                "GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback",
                "GITHUB_CLIENT_ID=",
                "GITHUB_CLIENT_SECRET=",
                "GITHUB_REDIRECT_URI=http://localhost:5000/api/auth/github/callback"
            )
            $envLines | Set-Content -Path .env -Encoding UTF8
            Write-Host "OK Fichier .env cree avec configuration optimale" -ForegroundColor Green
        }
    } else {
        Write-Host "ATTENTION: MongoDB n'est pas accessible sur localhost:27017" -ForegroundColor Yellow
        Write-Host "   Options pour demarrer MongoDB :" -ForegroundColor Cyan
        Write-Host "   1. Service Windows : net start MongoDB" -ForegroundColor White
        Write-Host "   2. Docker : docker compose up -d db" -ForegroundColor White
        Write-Host "   3. Installer MongoDB localement" -ForegroundColor White
        Write-Host ""
        Write-Host "   Le backend demarrera mais les operations de base de donnees echoueront." -ForegroundColor Yellow
    }
} catch {
    Write-Host "ATTENTION: Impossible de verifier MongoDB" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== LANCEMENT DU BACKEND ===" -ForegroundColor Cyan
Write-Host "Le backend va demarrer sur http://localhost:5000" -ForegroundColor Yellow
Write-Host "Appuyez sur Ctrl+C pour arreter`n" -ForegroundColor Yellow

# Lancer le backend
npm run dev


