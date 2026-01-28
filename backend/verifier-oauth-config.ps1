# Script PowerShell pour vérifier la configuration OAuth sur Fly.io

Write-Host "`n=== VERIFICATION CONFIGURATION OAUTH ===" -ForegroundColor Cyan
Write-Host ""

$appName = "supfile"

# Vérifier que flyctl est disponible
try {
    $null = Get-Command flyctl -ErrorAction Stop
} catch {
    Write-Host "[ERREUR] flyctl n'est pas trouve dans le PATH" -ForegroundColor Red
    exit 1
}

Write-Host "[*] Verification des secrets OAuth configures..." -ForegroundColor Cyan
Write-Host ""

# Lister tous les secrets OAuth
$secrets = flyctl secrets list --app $appName 2>&1

# Vérifier Google OAuth
Write-Host "[*] Google OAuth:" -ForegroundColor Yellow
$googleClientId = $secrets | Select-String -Pattern "GOOGLE_CLIENT_ID"
$googleClientSecret = $secrets | Select-String -Pattern "GOOGLE_CLIENT_SECRET"
$googleRedirectUri = $secrets | Select-String -Pattern "GOOGLE_REDIRECT_URI"

if ($googleClientId) {
    Write-Host "   [OK] GOOGLE_CLIENT_ID configure" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] GOOGLE_CLIENT_ID manquant" -ForegroundColor Red
}

if ($googleClientSecret) {
    Write-Host "   [OK] GOOGLE_CLIENT_SECRET configure" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] GOOGLE_CLIENT_SECRET manquant" -ForegroundColor Red
}

if ($googleRedirectUri) {
    Write-Host "   [OK] GOOGLE_REDIRECT_URI configure" -ForegroundColor Green
} else {
    Write-Host "   [ATTENTION] GOOGLE_REDIRECT_URI manquant" -ForegroundColor Yellow
}

Write-Host ""

# Vérifier GitHub OAuth
Write-Host "[*] GitHub OAuth:" -ForegroundColor Yellow
$githubClientId = $secrets | Select-String -Pattern "GITHUB_CLIENT_ID"
$githubClientSecret = $secrets | Select-String -Pattern "GITHUB_CLIENT_SECRET"
$githubRedirectUri = $secrets | Select-String -Pattern "GITHUB_REDIRECT_URI"

if ($githubClientId) {
    Write-Host "   [OK] GITHUB_CLIENT_ID configure" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] GITHUB_CLIENT_ID manquant" -ForegroundColor Red
}

if ($githubClientSecret) {
    Write-Host "   [OK] GITHUB_CLIENT_SECRET configure" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] GITHUB_CLIENT_SECRET manquant" -ForegroundColor Red
}

if ($githubRedirectUri) {
    Write-Host "   [OK] GITHUB_REDIRECT_URI configure" -ForegroundColor Green
} else {
    Write-Host "   [ATTENTION] GITHUB_REDIRECT_URI manquant" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[*] Verification des logs du backend..." -ForegroundColor Cyan
Write-Host "   (Recherche des messages OAuth dans les logs...)" -ForegroundColor Gray
Write-Host ""

# Récupérer les dernières lignes des logs
$logs = flyctl logs --app $appName 2>&1 | Select-Object -Last 50

# Chercher les messages OAuth
$oauthLogs = $logs | Select-String -Pattern "OAuth|Google|GitHub|configured|missing"

if ($oauthLogs) {
    Write-Host "   Messages OAuth trouves:" -ForegroundColor Yellow
    $oauthLogs | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
} else {
    Write-Host "   Aucun message OAuth trouve dans les logs recents" -ForegroundColor Yellow
    Write-Host "   Essayez de redemarrer l'application ou verifiez les logs complets" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[*] Pour voir tous les logs:" -ForegroundColor Cyan
Write-Host "   flyctl logs --app $appName" -ForegroundColor Gray
Write-Host ""
