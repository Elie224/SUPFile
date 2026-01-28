# Script PowerShell pour vérifier si Google OAuth est maintenant configuré

Write-Host "`n=== VERIFICATION GOOGLE OAUTH ===" -ForegroundColor Cyan
Write-Host ""

$appName = "supfile"

# Attendre un peu pour que l'application soit complètement démarrée
Write-Host "[*] Attente de 10 secondes..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host "[*] Verification des logs OAuth..." -ForegroundColor Cyan
Write-Host ""

# Récupérer les logs récents
$logs = flyctl logs --app $appName 2>&1 | Select-Object -Last 50

# Chercher les messages Google OAuth
$googleLogs = $logs | Select-String -Pattern "Google OAuth configured|Google OAuth not configured|OAuth google"

if ($googleLogs) {
    Write-Host "[*] Messages Google OAuth trouves:" -ForegroundColor Yellow
    Write-Host ""
    
    $configured = $googleLogs | Select-String -Pattern "Google OAuth configured|OAuth google.*Configuration OK"
    $notConfigured = $googleLogs | Select-String -Pattern "Google OAuth not configured|OAuth google not configured"
    
    if ($configured) {
        Write-Host "[OK] Google OAuth est maintenant configure !" -ForegroundColor Green
        Write-Host ""
        Write-Host "[*] Derniers messages:" -ForegroundColor Cyan
        $googleLogs | Select-Object -Last 3 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "[*] Vous pouvez maintenant tester la connexion Google sur votre site Netlify" -ForegroundColor Yellow
    } elseif ($notConfigured) {
        Write-Host "[ERREUR] Google OAuth n'est toujours pas configure" -ForegroundColor Red
        Write-Host ""
        Write-Host "[*] Derniers messages:" -ForegroundColor Cyan
        $googleLogs | Select-Object -Last 3 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "[*] Le probleme persiste. Verifions les secrets..." -ForegroundColor Yellow
        
        # Vérifier les secrets
        Write-Host ""
        Write-Host "[*] Verification des secrets sur Fly.io..." -ForegroundColor Cyan
        $secrets = flyctl secrets list --app $appName 2>&1
        
        $googleClientId = $secrets | Select-String -Pattern "GOOGLE_CLIENT_ID"
        $googleClientSecret = $secrets | Select-String -Pattern "GOOGLE_CLIENT_SECRET"
        
        if ($googleClientId -and $googleClientSecret) {
            Write-Host "[OK] Les secrets sont bien configures sur Fly.io" -ForegroundColor Green
            Write-Host "[ATTENTION] Mais l'application ne les charge pas" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "[*] Solution: Essayez de redemarrer manuellement:" -ForegroundColor Cyan
            Write-Host "   flyctl apps restart $appName" -ForegroundColor Gray
            Write-Host "   flyctl deploy --app $appName" -ForegroundColor Gray
        } else {
            Write-Host "[ERREUR] Les secrets ne sont pas configures sur Fly.io" -ForegroundColor Red
            Write-Host "[*] Reconfigurez-les avec:" -ForegroundColor Yellow
            Write-Host "   .\corriger-google-oauth.ps1" -ForegroundColor Gray
        }
    } else {
        Write-Host "[ATTENTION] Messages OAuth trouves mais statut incertain" -ForegroundColor Yellow
        $googleLogs | Select-Object -Last 5 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "[ATTENTION] Aucun message Google OAuth trouve dans les logs recents" -ForegroundColor Yellow
    Write-Host "[*] L'application vient peut-etre de demarrer" -ForegroundColor Gray
    Write-Host "[*] Attendez 1-2 minutes et reessayez" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[*] Pour voir tous les logs:" -ForegroundColor Cyan
Write-Host "   flyctl logs --app $appName | Select-String -Pattern 'Google'" -ForegroundColor Gray
Write-Host ""
