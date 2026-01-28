# Script PowerShell pour mettre à jour les secrets Google OAuth sur Fly.io

Write-Host "`n=== MISE À JOUR GOOGLE OAUTH - FLY.IO ===" -ForegroundColor Cyan
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

Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "   1. Allez sur: https://console.cloud.google.com/apis/credentials" -ForegroundColor Cyan
Write-Host "   2. Créez un nouveau OAuth Client ID (type: Web application)" -ForegroundColor Cyan
Write-Host "   3. Configurez le Redirect URI: https://supfile.fly.dev/api/auth/google/callback" -ForegroundColor Cyan
Write-Host "   4. Copiez le Client ID et Client Secret" -ForegroundColor Cyan
Write-Host ""

$clientId = Read-Host "Nouveau Google Client ID (ou appuyez sur Entrée pour annuler)"
if ([string]::IsNullOrWhiteSpace($clientId)) {
    Write-Host "❌ Opération annulée" -ForegroundColor Red
    exit 0
}

$clientSecret = Read-Host "Nouveau Google Client Secret"
if ([string]::IsNullOrWhiteSpace($clientSecret)) {
    Write-Host "❌ Client Secret requis. Opération annulée" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔑 Mise à jour des secrets..." -ForegroundColor Cyan

# Mettre à jour GOOGLE_CLIENT_ID
Write-Host "   Mise à jour de GOOGLE_CLIENT_ID..." -ForegroundColor Gray
$result1 = flyctl secrets set GOOGLE_CLIENT_ID="$clientId" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ GOOGLE_CLIENT_ID mis à jour" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur lors de la mise à jour de GOOGLE_CLIENT_ID" -ForegroundColor Red
    Write-Host "   Message: $result1" -ForegroundColor Yellow
    exit 1
}

# Mettre à jour GOOGLE_CLIENT_SECRET
Write-Host "   Mise à jour de GOOGLE_CLIENT_SECRET..." -ForegroundColor Gray
$result2 = flyctl secrets set GOOGLE_CLIENT_SECRET="$clientSecret" --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ GOOGLE_CLIENT_SECRET mis à jour" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur lors de la mise à jour de GOOGLE_CLIENT_SECRET" -ForegroundColor Red
    Write-Host "   Message: $result2" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔄 Redéploiement du backend..." -ForegroundColor Cyan
Write-Host "   (Cela peut prendre quelques minutes...)" -ForegroundColor Yellow
Write-Host ""

$deployResult = flyctl deploy --app $appName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Backend redéployé avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Testez maintenant la connexion Google sur votre site Netlify" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️  Les secrets ont été mis à jour, mais le redéploiement a échoué" -ForegroundColor Yellow
    Write-Host "   Redéployez manuellement avec: flyctl deploy --app $appName" -ForegroundColor Cyan
    Write-Host "   Message: $deployResult" -ForegroundColor Gray
}

Write-Host ""
