# Script pour voir les logs complets de downloadFolder
# Executez ce script depuis le dossier backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "LOGS COMPLETS DOWNLOAD FOLDER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

$appName = "supfile"

Write-Host "`n[*] Recuperation des logs downloadFolder..." -ForegroundColor Yellow
$logs = flyctl logs --app $appName 2>&1 | Select-String -Pattern "downloadFolder"

if ($logs) {
    Write-Host "`n[OK] Logs trouves:" -ForegroundColor Green
    $logs | Select-Object -Last 30 | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
} else {
    Write-Host "`n[ATTENTION] Aucun log downloadFolder trouve" -ForegroundColor Yellow
    Write-Host "Essayez de telecharger un dossier, puis relancez ce script." -ForegroundColor Gray
}

Write-Host "`n[*] Recuperation des logs d'erreur..." -ForegroundColor Yellow
$errors = flyctl logs --app $appName 2>&1 | Select-String -Pattern "404|not found|error|Error" | Select-Object -Last 10

if ($errors) {
    Write-Host "`n[ATTENTION] Erreurs trouvees:" -ForegroundColor Yellow
    $errors | ForEach-Object {
        Write-Host $_ -ForegroundColor Red
    }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "[OK] Verification terminee" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray

Write-Host "`nNote: Si vous voyez 'Folder found' mais toujours 404," -ForegroundColor Gray
Write-Host "cela peut signifier que l'ID dans l'URL est different de celui dans les logs." -ForegroundColor Gray
