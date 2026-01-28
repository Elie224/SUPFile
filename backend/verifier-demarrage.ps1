# Script pour verifier si l'application demarre correctement
# Executez ce script depuis le dossier backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION DEMARRAGE APPLICATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

$appName = "supfile"

Write-Host "`n[*] Attente de 10 secondes pour que l'application demarre..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n[*] Recuperation des logs recents..." -ForegroundColor Yellow
$logs = flyctl logs --app $appName 2>&1 | Select-Object -Last 50

# Chercher les messages de demarrage
$startup = $logs | Select-String -Pattern "listening|started|Server started|MongoDB ready"
if ($startup) {
    Write-Host "`n[OK] Messages de demarrage trouves:" -ForegroundColor Green
    $startup | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Green
    }
} else {
    Write-Host "`n[ATTENTION] Aucun message de demarrage trouve" -ForegroundColor Yellow
}

# Chercher les erreurs
$errors = $logs | Select-String -Pattern "error|Error|ERROR|failed|Failed|FAILED|exception|Exception"
if ($errors) {
    Write-Host "`n[ERREUR] Erreurs trouvees:" -ForegroundColor Red
    $errors | Select-Object -First 10 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Red
    }
}

# Tester l'endpoint health
Write-Host "`n[*] Test de l'endpoint /health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$appName.fly.dev/health" -UseBasicParsing -ErrorAction SilentlyContinue -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Application accessible et fonctionnelle" -ForegroundColor Green
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "[ATTENTION] Status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERREUR] Application non accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "[OK] Verification terminee" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray
