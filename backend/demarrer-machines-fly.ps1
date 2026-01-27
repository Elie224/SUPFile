# Script pour demarrer les machines Fly.io
# Executez ce script depuis le dossier backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE MACHINES FLY.IO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

$appName = "supfile"

# Verifier que flyctl fonctionne
$flyctlPath = "flyctl"
try {
    $version = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] flyctl ne fonctionne pas." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERREUR] flyctl introuvable." -ForegroundColor Red
    exit 1
}

Write-Host "`n[*] Demarrage des machines pour '$appName'..." -ForegroundColor Yellow

# Verifier l'etat actuel
Write-Host "  - Verification de l'etat actuel..." -ForegroundColor Gray
$status = & $flyctlPath status --app $appName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERREUR] Impossible de verifier l'etat de l'application" -ForegroundColor Red
    exit 1
}

# Demarrer les machines (scale count 1)
Write-Host "  - Demarrage des machines (count=1)..." -ForegroundColor Gray
& $flyctlPath scale count 1 --app $appName 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Machines demarrees" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Echec du demarrage des machines" -ForegroundColor Red
    exit 1
}

# Attendre que les machines soient pretes
Write-Host "`n[*] Attente que les machines soient pretes..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verifier que l'application repond
Write-Host "  - Verification de l'endpoint /health..." -ForegroundColor Gray
$healthCheck = Invoke-WebRequest -Uri "https://$appName.fly.dev/health" -UseBasicParsing -ErrorAction SilentlyContinue

if ($healthCheck.StatusCode -eq 200) {
    Write-Host "[OK] Application accessible et fonctionnelle" -ForegroundColor Green
} else {
    Write-Host "[ATTENTION] L'application ne repond pas encore. Attendez quelques secondes de plus." -ForegroundColor Yellow
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "[OK] Machines demarrees !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "`nURL Backend: https://$appName.fly.dev" -ForegroundColor Cyan
Write-Host "Testez: curl https://$appName.fly.dev/health" -ForegroundColor Gray
