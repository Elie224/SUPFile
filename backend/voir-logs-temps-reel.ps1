# Script pour voir les logs en temps réel
param(
    [string]$appName = "supfile"
)

$flyctlPath = "C:\Users\KOURO\.fly\bin\flyctl.exe"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "LOGS TEMPS REEL - APP: $appName" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "`n[*] Appuyez sur Ctrl+C pour arreter" -ForegroundColor Yellow
Write-Host "[*] Les logs vont s'afficher en temps reel..." -ForegroundColor Yellow
Write-Host "`n============================================================" -ForegroundColor Gray

# Lancer flyctl logs (stream par défaut, pas besoin de --follow)
& $flyctlPath logs --app $appName
