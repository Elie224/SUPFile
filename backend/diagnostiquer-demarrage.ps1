# Script pour diagnostiquer pourquoi l'application ne demarre pas
# Executez ce script depuis le dossier backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC DEMARRAGE APPLICATION FLY.IO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

$appName = "supfile"

# 1. Verifier les secrets
Write-Host "`n[1] Verification des secrets..." -ForegroundColor Yellow
Write-Host "  - Recuperation de la liste des secrets..." -ForegroundColor Gray

try {
    $secrets = flyctl secrets list --app $appName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Secrets recuperes" -ForegroundColor Green
        $secrets | ForEach-Object {
            if ($_ -match "^\s*([A-Z_]+)\s*=") {
                Write-Host "    - $($matches[1])" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  [ERREUR] Impossible de recuperer les secrets" -ForegroundColor Red
        Write-Host "  $secrets" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERREUR] Erreur lors de la recuperation des secrets: $_" -ForegroundColor Red
}

# 2. Verifier les logs recents
Write-Host "`n[2] Verification des logs recents..." -ForegroundColor Yellow
Write-Host "  - Recuperation des 50 dernieres lignes de logs..." -ForegroundColor Gray

try {
    $logs = flyctl logs --app $appName 2>&1 | Select-Object -Last 50
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Logs recuperes" -ForegroundColor Green
        
        # Chercher les erreurs
        $errors = $logs | Select-String -Pattern "error|Error|ERROR|failed|Failed|FAILED|exception|Exception"
        if ($errors) {
            Write-Host "  [ATTENTION] Erreurs trouvees dans les logs:" -ForegroundColor Yellow
            $errors | ForEach-Object {
                Write-Host "    $_" -ForegroundColor Red
            }
        } else {
            Write-Host "  [OK] Aucune erreur trouvee dans les logs recents" -ForegroundColor Green
        }
        
        # Chercher le message de demarrage
        $startup = $logs | Select-String -Pattern "listening|started|ready|MongoDB"
        if ($startup) {
            Write-Host "  [OK] Messages de demarrage trouves:" -ForegroundColor Green
            $startup | ForEach-Object {
                Write-Host "    $_" -ForegroundColor Green
            }
        } else {
            Write-Host "  [ATTENTION] Aucun message de demarrage trouve" -ForegroundColor Yellow
        }
        
        # Afficher les dernieres lignes
        Write-Host "`n  Dernieres lignes de logs:" -ForegroundColor Gray
        $logs | Select-Object -Last 10 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "  [ERREUR] Impossible de recuperer les logs" -ForegroundColor Red
        Write-Host "  $logs" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERREUR] Erreur lors de la recuperation des logs: $_" -ForegroundColor Red
}

# 3. Tester l'endpoint health
Write-Host "`n[3] Test de l'endpoint /health..." -ForegroundColor Yellow
Write-Host "  - Test de https://$appName.fly.dev/health..." -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "https://$appName.fly.dev/health" -UseBasicParsing -ErrorAction SilentlyContinue -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  [OK] Application accessible et fonctionnelle" -ForegroundColor Green
        Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "    Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "  [ATTENTION] Application accessible mais status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERREUR] Application non accessible" -ForegroundColor Red
    Write-Host "    Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Verifier l'etat des machines
Write-Host "`n[4] Verification de l'etat des machines..." -ForegroundColor Yellow
Write-Host "  - Recuperation du statut..." -ForegroundColor Gray

try {
    $status = flyctl status --app $appName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Statut recupere" -ForegroundColor Green
        $status | ForEach-Object {
            Write-Host "    $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "  [ERREUR] Impossible de recuperer le statut" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERREUR] Erreur lors de la recuperation du statut: $_" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "[OK] Diagnostic termine" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray

Write-Host "`nProchaines etapes:" -ForegroundColor Yellow
Write-Host "  1. Si l'application n'est pas accessible, verifiez les secrets (MONGO_URI, JWT_SECRET, etc.)" -ForegroundColor Gray
Write-Host "  2. Si MongoDB ne se connecte pas, verifiez MONGO_URI" -ForegroundColor Gray
Write-Host "  3. Si l'application crash, consultez les logs pour voir l'erreur exacte" -ForegroundColor Gray
Write-Host "  4. Redemarrez l'application: flyctl apps restart --app $appName" -ForegroundColor Gray
