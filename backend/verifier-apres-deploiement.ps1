# Script pour verifier que l'application demarre correctement apres deploiement
# Executez ce script depuis le dossier backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION APRES DEPLOIEMENT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

$appName = "supfile"

Write-Host "`n[*] Attente de 15 secondes pour que l'application demarre completement..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n[*] Recuperation des logs recents..." -ForegroundColor Yellow
$logs = flyctl logs --app $appName 2>&1 | Select-Object -Last 40

# Chercher les messages de demarrage
$startup = $logs | Select-String -Pattern "listening|started|Server started|MongoDB ready"
if ($startup) {
    Write-Host "`n[OK] Messages de demarrage trouves:" -ForegroundColor Green
    $startup | Select-Object -Last 5 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Green
    }
} else {
    Write-Host "`n[ATTENTION] Aucun message de demarrage trouve" -ForegroundColor Yellow
}

# Chercher les erreurs Mongoose
$mongooseErrors = $logs | Select-String -Pattern "Connection.prototype.close|mongoose.*close.*callback"
if ($mongooseErrors) {
    Write-Host "`n[ERREUR] Erreurs Mongoose trouvees:" -ForegroundColor Red
    $mongooseErrors | Select-Object -First 3 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Red
    }
} else {
    Write-Host "`n[OK] Aucune erreur Mongoose trouvee" -ForegroundColor Green
}

# Chercher les erreurs generales
$errors = $logs | Select-String -Pattern "error|Error|ERROR|failed|Failed|FAILED|exception|Exception" | Where-Object { $_ -notmatch "Health check" }
if ($errors) {
    Write-Host "`n[ATTENTION] Erreurs trouvees:" -ForegroundColor Yellow
    $errors | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[OK] Aucune erreur trouvee" -ForegroundColor Green
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
    Write-Host "  L'application est peut-etre encore en train de demarrer. Attendez 30 secondes et reessayez." -ForegroundColor Yellow
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "[OK] Verification terminee" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray

Write-Host "`nNote: L'avertissement 'The app is not listening' pendant le deploiement est normal." -ForegroundColor Gray
Write-Host "Il disparaitra une fois que l'application aura demarre (environ 5-10 secondes)." -ForegroundColor Gray
