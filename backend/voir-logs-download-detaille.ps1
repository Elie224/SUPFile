# Script pour voir les logs détaillés de downloadFolder avec tous les détails
param(
    [string]$appName = "supfile"
)

$flyctlPath = "C:\Users\KOURO\.fly\bin\flyctl.exe"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "LOGS DETAILLES DOWNLOAD FOLDER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

Write-Host "`n[*] Recuperation des logs downloadFolder et validateObjectId..." -ForegroundColor Yellow

# Récupérer les logs récents avec tous les patterns pertinents
$logs = & $flyctlPath logs --app $appName 2>&1 | Select-String -Pattern "downloadFolder|validateObjectId|Folder not found|Invalid.*format|MongoDB" | Select-Object -Last 50

if ($logs) {
    Write-Host "`n[LOGS TROUVES]:" -ForegroundColor Green
    $logs | ForEach-Object {
        Write-Host $_ -ForegroundColor White
    }
} else {
    Write-Host "`n[ATTENTION] Aucun log downloadFolder trouve" -ForegroundColor Yellow
    Write-Host "Essayez de telecharger un dossier puis relancez ce script" -ForegroundColor Yellow
}

Write-Host "`n============================================================" -ForegroundColor Gray
Write-Host "[*] Pour voir TOUS les logs recents:" -ForegroundColor Cyan
Write-Host "    flyctl logs --app $appName" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Gray
