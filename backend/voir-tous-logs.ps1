# Script pour voir tous les logs recents
# Executez ce script depuis le dossier backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TOUS LES LOGS RECENTS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

$appName = "supfile"

Write-Host "`n[*] Recuperation des 50 dernieres lignes de logs..." -ForegroundColor Yellow

try {
    $allLogs = flyctl logs --app $appName 2>&1 | Select-Object -Last 50
    
    if ($allLogs) {
        Write-Host "`n[OK] Logs recuperes:" -ForegroundColor Green
        $allLogs | ForEach-Object {
            Write-Host $_ -ForegroundColor Gray
        }
    } else {
        Write-Host "`n[ATTENTION] Aucun log trouve" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n[ERREUR] Impossible de recuperer les logs: $_" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "[OK] Verification terminee" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray
