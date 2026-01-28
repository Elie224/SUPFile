# Script PowerShell pour déboguer le problème Google OAuth

Write-Host "`n=== DEBUG GOOGLE OAUTH ===" -ForegroundColor Cyan
Write-Host ""

$appName = "supfile"

# Vérifier les secrets
Write-Host "[*] Verification des secrets sur Fly.io..." -ForegroundColor Cyan
$secrets = flyctl secrets list --app $appName 2>&1

$googleClientId = $secrets | Select-String -Pattern "GOOGLE_CLIENT_ID"
$googleClientSecret = $secrets | Select-String -Pattern "GOOGLE_CLIENT_SECRET"

Write-Host ""
if ($googleClientId) {
    Write-Host "[OK] GOOGLE_CLIENT_ID trouve:" -ForegroundColor Green
    Write-Host "   $googleClientId" -ForegroundColor Gray
} else {
    Write-Host "[ERREUR] GOOGLE_CLIENT_ID non trouve" -ForegroundColor Red
}

if ($googleClientSecret) {
    Write-Host "[OK] GOOGLE_CLIENT_SECRET trouve:" -ForegroundColor Green
    Write-Host "   (masque pour securite)" -ForegroundColor Gray
} else {
    Write-Host "[ERREUR] GOOGLE_CLIENT_SECRET non trouve" -ForegroundColor Red
}

Write-Host ""
Write-Host "[*] Les secrets Google doivent etre configures sur Fly.io (valeurs non affichees ici pour securite)." -ForegroundColor Yellow

Write-Host ""
Write-Host "[*] Solution: Reconfigurer les secrets Google..." -ForegroundColor Cyan
Write-Host ""

# Reconfigurer les secrets (remplacez par vos vraies valeurs AVANT d'exécuter le script,
# et NE les commitez jamais dans Git)
$googleClientIdValue = "YOUR_GOOGLE_CLIENT_ID"
$googleClientSecretValue = "YOUR_GOOGLE_CLIENT_SECRET"

Write-Host "[*] Mise a jour de GOOGLE_CLIENT_ID..." -ForegroundColor Yellow
$result1 = flyctl secrets set GOOGLE_CLIENT_ID="$googleClientIdValue" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] GOOGLE_CLIENT_ID mis a jour" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] $result1" -ForegroundColor Red
}

Write-Host "[*] Mise a jour de GOOGLE_CLIENT_SECRET..." -ForegroundColor Yellow
$result2 = flyctl secrets set GOOGLE_CLIENT_SECRET="[REDACTED]" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] GOOGLE_CLIENT_SECRET mis a jour" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] $result2" -ForegroundColor Red
}

Write-Host ""
Write-Host "[*] Forcer un redemarrage complet..." -ForegroundColor Cyan

# Arrêter complètement
Write-Host "[*] Arret de l'application..." -ForegroundColor Yellow
flyctl scale count 0 --app $appName 2>&1 | Out-Null
Start-Sleep -Seconds 5

# Redémarrer
Write-Host "[*] Redemarrage de l'application..." -ForegroundColor Yellow
flyctl scale count 1 --app $appName 2>&1 | Out-Null
Start-Sleep -Seconds 10

# Redéployer
Write-Host "[*] Redeploiement..." -ForegroundColor Yellow
flyctl deploy --app $appName 2>&1 | Out-Null

Write-Host ""
Write-Host "[OK] Redemarrage termine" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Attendez 1-2 minutes puis testez la connexion Google" -ForegroundColor Yellow
Write-Host ""
