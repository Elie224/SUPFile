# Script PowerShell pour corriger le problème Google OAuth

Write-Host "`n=== CORRECTION GOOGLE OAUTH ===" -ForegroundColor Cyan
Write-Host ""

$appName = "supfile"

# Vérifier que flyctl est disponible
try {
    $null = Get-Command flyctl -ErrorAction Stop
} catch {
    Write-Host "[ERREUR] flyctl n'est pas trouve dans le PATH" -ForegroundColor Red
    exit 1
}

# Secrets Google OAuth (à remplir avec vos valeurs réelles, ne pas les committer)
$googleClientId = "YOUR_GOOGLE_CLIENT_ID"
$googleClientSecret = "YOUR_GOOGLE_CLIENT_SECRET"

Write-Host "[*] Reconfiguration des secrets Google OAuth..." -ForegroundColor Cyan
Write-Host ""

# Mettre à jour GOOGLE_CLIENT_ID
Write-Host "[*] Mise a jour de GOOGLE_CLIENT_ID..." -ForegroundColor Yellow
$result1 = flyctl secrets set GOOGLE_CLIENT_ID="$googleClientId" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] GOOGLE_CLIENT_ID mis a jour" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] $result1" -ForegroundColor Red
    exit 1
}

# Mettre à jour GOOGLE_CLIENT_SECRET
Write-Host "[*] Mise a jour de GOOGLE_CLIENT_SECRET..." -ForegroundColor Yellow
$result2 = flyctl secrets set GOOGLE_CLIENT_SECRET="[REDACTED]" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] GOOGLE_CLIENT_SECRET mis a jour" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] $result2" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[*] Forcer un redemarrage complet de l'application..." -ForegroundColor Cyan
Write-Host ""

# Arrêter complètement l'application
Write-Host "[*] Arret de l'application (count=0)..." -ForegroundColor Yellow
flyctl scale count 0 --app $appName 2>&1 | Out-Null
Start-Sleep -Seconds 5

# Redémarrer
Write-Host "[*] Redemarrage de l'application (count=1)..." -ForegroundColor Yellow
flyctl scale count 1 --app $appName 2>&1 | Out-Null
Start-Sleep -Seconds 10

# Redéployer pour forcer le rechargement
Write-Host "[*] Redeploiement pour forcer le rechargement des secrets..." -ForegroundColor Yellow
Write-Host "   (Cela peut prendre quelques minutes...)" -ForegroundColor Gray
Write-Host ""

$deployResult = flyctl deploy --app $appName --dns-checks=false 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Backend redeploye avec succes !" -ForegroundColor Green
    Write-Host ""
    Write-Host "[*] Attente de 30 secondes pour que l'application demarre..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "[*] Verification des logs OAuth..." -ForegroundColor Cyan
    $logs = flyctl logs --app $appName 2>&1 | Select-Object -Last 20
    $googleLogs = $logs | Select-String -Pattern "Google OAuth configured|Google OAuth not configured"
    
    if ($googleLogs) {
        Write-Host ""
        Write-Host "[*] Messages Google OAuth dans les logs:" -ForegroundColor Yellow
        $googleLogs | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        
        $configured = $googleLogs | Select-String -Pattern "Google OAuth configured"
        if ($configured) {
            Write-Host ""
            Write-Host "[OK] Google OAuth est maintenant configure !" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "[ATTENTION] Google OAuth n'est toujours pas configure" -ForegroundColor Yellow
            Write-Host "   Verifiez les logs complets avec: flyctl logs --app $appName" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "[ATTENTION] Aucun message Google OAuth trouve dans les logs recents" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "[*] Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "   1. Attendez 1-2 minutes pour que l'application soit completement demarree" -ForegroundColor Yellow
    Write-Host "   2. Allez sur votre site Netlify" -ForegroundColor Yellow
    Write-Host "   3. Testez la connexion Google OAuth" -ForegroundColor Yellow
    Write-Host "   4. Si ca ne fonctionne toujours pas, verifiez les logs:" -ForegroundColor Yellow
    Write-Host "      flyctl logs --app $appName | Select-String -Pattern 'Google'" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "[ERREUR] Le redeploiement a echoue" -ForegroundColor Red
    Write-Host "   Message: $deployResult" -ForegroundColor Gray
}

Write-Host ""
