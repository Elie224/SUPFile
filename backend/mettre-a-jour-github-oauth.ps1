# Script PowerShell pour mettre à jour les secrets GitHub OAuth sur Fly.io

Write-Host "`n=== MISE À JOUR GITHUB OAUTH - FLY.IO ===" -ForegroundColor Cyan
Write-Host ""

$appName = "supfile"

# Vérifier que flyctl est disponible
try {
    $null = Get-Command flyctl -ErrorAction Stop
} catch {
    Write-Host "[ERREUR] flyctl n'est pas trouve dans le PATH" -ForegroundColor Red
    Write-Host "   Installez flyctl depuis: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

# Nouveaux identifiants GitHub OAuth
$githubClientId = "Ov23liHlxn1IFFA0hIkJ"
$githubClientSecret = "aa74fb7cf13b1ef443ab54479220ab8a53354681"

Write-Host "[*] Mise a jour des secrets GitHub OAuth..." -ForegroundColor Cyan
Write-Host ""

# GitHub OAuth
Write-Host "[*] GitHub OAuth..." -ForegroundColor Yellow
Write-Host "   Mise a jour de GITHUB_CLIENT_ID..." -ForegroundColor Gray
$result1 = flyctl secrets set GITHUB_CLIENT_ID="$githubClientId" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] GITHUB_CLIENT_ID mis a jour" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] $result1" -ForegroundColor Red
    exit 1
}

Write-Host "   Mise a jour de GITHUB_CLIENT_SECRET..." -ForegroundColor Gray
$result2 = flyctl secrets set GITHUB_CLIENT_SECRET="[REDACTED]" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] GITHUB_CLIENT_SECRET mis a jour" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] $result2" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Secrets GitHub OAuth mis a jour !" -ForegroundColor Green
Write-Host ""

# Vérifier les secrets
Write-Host "[*] Verification des secrets GitHub configures..." -ForegroundColor Cyan
flyctl secrets list --app $appName | Select-String -Pattern "GITHUB"

Write-Host ""
Write-Host "[*] Redeploiement du backend..." -ForegroundColor Cyan
Write-Host "   (Cela peut prendre quelques minutes...)" -ForegroundColor Yellow
Write-Host ""

$deployResult = flyctl deploy --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Backend redeploye avec succes !" -ForegroundColor Green
    Write-Host ""
    Write-Host "[*] Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "   1. Verifiez que le Redirect URI est configure dans GitHub" -ForegroundColor Yellow
    Write-Host "      - Authorization callback URL: https://supfile.fly.dev/api/auth/github/callback" -ForegroundColor Gray
    Write-Host "      - Homepage URL: https://flourishing-banoffee-c0b1ad.netlify.app" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Testez la connexion GitHub sur votre site Netlify" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "[ATTENTION] Les secrets ont ete mis a jour, mais le redeploiement a echoue" -ForegroundColor Yellow
    Write-Host "   Redeployez manuellement avec: flyctl deploy --app $appName" -ForegroundColor Cyan
    Write-Host "   Message: $deployResult" -ForegroundColor Gray
}

Write-Host ""
