# Script PowerShell pour redémarrer le backend et forcer le rechargement des secrets

Write-Host "`n=== REDEMARRAGE BACKEND - FLY.IO ===" -ForegroundColor Cyan
Write-Host ""

$appName = "supfile"

# Vérifier que flyctl est disponible
try {
    $null = Get-Command flyctl -ErrorAction Stop
} catch {
    Write-Host "[ERREUR] flyctl n'est pas trouve dans le PATH" -ForegroundColor Red
    exit 1
}

Write-Host "[*] Redemarrage du backend pour recharger les secrets OAuth..." -ForegroundColor Cyan
Write-Host ""

# Option 1 : Redémarrer l'application
Write-Host "[*] Methode 1: Redemarrage de l'application..." -ForegroundColor Yellow
$restartResult = flyctl apps restart $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Application redemarree" -ForegroundColor Green
} else {
    Write-Host "[ATTENTION] Redemarrage echoue, tentative de redeploiement..." -ForegroundColor Yellow
    Write-Host "   Message: $restartResult" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[*] Attente de 10 secondes..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "[*] Methode 2: Redeploiement complet..." -ForegroundColor Yellow
Write-Host "   (Cela peut prendre quelques minutes...)" -ForegroundColor Gray
Write-Host ""

$deployResult = flyctl deploy --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Backend redeploye avec succes !" -ForegroundColor Green
    Write-Host ""
    Write-Host "[*] Attente de 30 secondes pour que l'application demarre..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "[*] Verification des logs OAuth..." -ForegroundColor Cyan
    $logs = flyctl logs --app $appName 2>&1 | Select-Object -Last 30
    $oauthLogs = $logs | Select-String -Pattern "OAuth|Google|GitHub|configured"
    
    if ($oauthLogs) {
        Write-Host ""
        Write-Host "[OK] Messages OAuth trouves dans les logs:" -ForegroundColor Green
        $oauthLogs | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "[ATTENTION] Aucun message OAuth trouve dans les logs recents" -ForegroundColor Yellow
        Write-Host "   Cela peut etre normal si l'application vient de demarrer" -ForegroundColor Gray
        Write-Host "   Essayez de tester la connexion OAuth sur votre site" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "[*] Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "   1. Attendez 1-2 minutes pour que l'application soit completement demarree" -ForegroundColor Yellow
    Write-Host "   2. Allez sur votre site Netlify" -ForegroundColor Yellow
    Write-Host "   3. Testez la connexion Google OAuth" -ForegroundColor Yellow
    Write-Host "   4. Testez la connexion GitHub OAuth" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "[ERREUR] Le redeploiement a echoue" -ForegroundColor Red
    Write-Host "   Message: $deployResult" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[*] Essayez manuellement:" -ForegroundColor Cyan
    Write-Host "   flyctl deploy --app $appName" -ForegroundColor Gray
}

Write-Host ""
