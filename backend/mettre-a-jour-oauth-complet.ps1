# Script PowerShell pour mettre à jour tous les secrets OAuth sur Fly.io

Write-Host "`n=== MISE À JOUR COMPLÈTE OAUTH - FLY.IO ===" -ForegroundColor Cyan
Write-Host ""

$appName = "supfile"

# Vérifier que flyctl est disponible
try {
    $null = Get-Command flyctl -ErrorAction Stop
} catch {
    Write-Host "❌ Erreur: flyctl n'est pas trouvé dans le PATH" -ForegroundColor Red
    Write-Host "   Installez flyctl depuis: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

# Nouveaux identifiants OAuth (à renseigner AVANT d'exécuter le script, ne jamais les committer)
$googleClientId = "YOUR_GOOGLE_CLIENT_ID"
$googleClientSecret = "YOUR_GOOGLE_CLIENT_SECRET"
$githubClientId = "YOUR_GITHUB_CLIENT_ID"
$githubClientSecret = "YOUR_GITHUB_CLIENT_SECRET"

Write-Host "🔑 Mise à jour des secrets OAuth..." -ForegroundColor Cyan
Write-Host ""

# Google OAuth
Write-Host "📱 Google OAuth..." -ForegroundColor Yellow
Write-Host "   Mise à jour de GOOGLE_CLIENT_ID..." -ForegroundColor Gray
$result1 = flyctl secrets set GOOGLE_CLIENT_ID="$googleClientId" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ GOOGLE_CLIENT_ID mis à jour" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur: $result1" -ForegroundColor Red
    exit 1
}

Write-Host "   Mise à jour de GOOGLE_CLIENT_SECRET..." -ForegroundColor Gray
$result2 = flyctl secrets set GOOGLE_CLIENT_SECRET="$googleClientSecret" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ GOOGLE_CLIENT_SECRET mis à jour" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur: $result2" -ForegroundColor Red
    exit 1
}

Write-Host ""

# GitHub OAuth
Write-Host "🐙 GitHub OAuth..." -ForegroundColor Yellow
Write-Host "   Mise à jour de GITHUB_CLIENT_ID..." -ForegroundColor Gray
$result3 = flyctl secrets set GITHUB_CLIENT_ID="$githubClientId" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ GITHUB_CLIENT_ID mis à jour" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur: $result3" -ForegroundColor Red
    exit 1
}

Write-Host "   Mise à jour de GITHUB_CLIENT_SECRET..." -ForegroundColor Gray
$result4 = flyctl secrets set GITHUB_CLIENT_SECRET="$githubClientSecret" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ GITHUB_CLIENT_SECRET mis à jour" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur: $result4" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Tous les secrets OAuth ont été mis à jour !" -ForegroundColor Green
Write-Host ""

# Vérifier les secrets
Write-Host "🔍 Vérification des secrets configurés..." -ForegroundColor Cyan
flyctl secrets list --app $appName | Select-String -Pattern "GOOGLE|GITHUB"

Write-Host ""
Write-Host "🔄 Redéploiement du backend..." -ForegroundColor Cyan
Write-Host "   (Cela peut prendre quelques minutes...)" -ForegroundColor Yellow
Write-Host ""

$deployResult = flyctl deploy --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Backend redéployé avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Vérifiez que les Redirect URIs sont configurés dans Google Cloud Console" -ForegroundColor Yellow
    Write-Host "      - Redirect URI: https://supfile.fly.dev/api/auth/google/callback" -ForegroundColor Gray
    Write-Host "      - JavaScript origins: https://supfile.fly.dev et https://flourishing-banoffee-c0b1ad.netlify.app" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Vérifiez que le Redirect URI est configuré dans GitHub" -ForegroundColor Yellow
    Write-Host "      - Authorization callback URL: https://supfile.fly.dev/api/auth/github/callback" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. Testez les connexions OAuth sur votre site Netlify" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "⚠️  Les secrets ont été mis à jour, mais le redéploiement a échoué" -ForegroundColor Yellow
    Write-Host "   Redéployez manuellement avec: flyctl deploy --app $appName" -ForegroundColor Cyan
    Write-Host "   Message: $deployResult" -ForegroundColor Gray
}

Write-Host ""
