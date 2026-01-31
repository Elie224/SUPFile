# Script pour voir tous les logs recents (sans stream, sort apres affichage)
# Executez depuis le dossier backend : .\voir-tous-logs.ps1
# Ou depuis la racine : .\backend\voir-tous-logs.ps1

$appName = "supfile"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "LOGS RECENTS - APP: $appName" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "`n[*] Recuperation des logs (--no-tail)..." -ForegroundColor Yellow

try {
    # --no-tail : affiche le buffer puis quitte (pas de stream infini)
    & fly logs --app $appName --no-tail
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERREUR] fly logs a echoue (code $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "Verifiez : fly auth whoami  et  fly apps list" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n[ERREUR] Impossible de recuperer les logs: $_" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "[OK] Termine" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray
