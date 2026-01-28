# Script pour Extraire les Secrets du .env et les Configurer sur Fly.io
# Ce script lit backend/.env et configure automatiquement les secrets sur Fly.io

Write-Host "`n🔍 EXTRACTION ET CONFIGURATION AUTOMATIQUE DES SECRETS`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$flyctlPath = Join-Path $env:USERPROFILE ".fly\bin\flyctl.exe"
$envFile = Join-Path $PSScriptRoot ".env"

# Vérifier que le fichier .env existe
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Fichier .env non trouvé : $envFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichier .env trouvé" -ForegroundColor Green

# Lire et parser le fichier .env
Write-Host "`n📖 Lecture du fichier .env..." -ForegroundColor Yellow
$secrets = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$' -and -not $_.Trim().StartsWith('#')) {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            $secrets[$key] = $value
        }
    }
}

Write-Host "   ✅ $($secrets.Count) variables trouvées" -ForegroundColor Green

# Afficher les secrets importants trouvés
Write-Host "`n📋 Secrets importants trouvés :" -ForegroundColor Yellow
$importantKeys = @("JWT_SECRET", "JWT_REFRESH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
foreach ($key in $importantKeys) {
    if ($secrets.ContainsKey($key)) {
        $value = $secrets[$key]
        $display = if ($value.Length -gt 30) { $value.Substring(0, 30) + "..." } else { $value }
        Write-Host "   ✅ $key = $display" -ForegroundColor Green
    }
}

# Vérifier flyctl
Write-Host "`n🔧 Vérification de flyctl..." -ForegroundColor Yellow
try {
    $null = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "flyctl failed" }
    Write-Host "   ✅ flyctl fonctionne" -ForegroundColor Green
} catch {
    Write-Host "   ❌ flyctl ne fonctionne pas" -ForegroundColor Red
    exit 1
}

# Vérifier la connexion
Write-Host "`n🔐 Vérification de la connexion..." -ForegroundColor Yellow
$whoami = & $flyctlPath auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Connexion en cours..." -ForegroundColor Yellow
    & $flyctlPath auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Échec de la connexion" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ Connecté" -ForegroundColor Green
}

# Demander le nom de l'application
Write-Host "`n📝 Nom de l'application (Entrée pour 'supfile') : " -ForegroundColor Cyan -NoNewline
$appName = Read-Host
if ([string]::IsNullOrWhiteSpace($appName)) {
    $appName = "supfile"
}

# Préparer les secrets à configurer
Write-Host "`n🔐 Configuration des secrets..." -ForegroundColor Yellow

# Secrets fixes
$secretsToSet = @{
    "NODE_ENV" = "production"
    "PORT" = "5000"
    "MONGO_URI" = 'mongodb+srv://[REDACTED]'
    "FRONTEND_URL" = "https://flourishing-banoffee-c0b1ad.netlify.app"
    "CORS_ORIGIN" = "https://flourishing-banoffee-c0b1ad.netlify.app"
    "GOOGLE_REDIRECT_URI" = "https://$appName.fly.dev/api/auth/google/callback"
    "GITHUB_REDIRECT_URI" = "https://$appName.fly.dev/api/auth/github/callback"
}

# Ajouter les secrets du .env
if ($secrets.ContainsKey("JWT_SECRET")) {
    $secretsToSet["JWT_SECRET"] = $secrets["JWT_SECRET"]
}
if ($secrets.ContainsKey("JWT_REFRESH_SECRET")) {
    $secretsToSet["JWT_REFRESH_SECRET"] = $secrets["JWT_REFRESH_SECRET"]
}
# SESSION_SECRET=[REDACTED] JWT_SECRET si pas défini
if ($secrets.ContainsKey("SESSION_SECRET")) {
    $secretsToSet["SESSION_SECRET"] = $secrets["SESSION_SECRET"]
} elseif ($secrets.ContainsKey("JWT_SECRET")) {
    $secretsToSet["SESSION_SECRET"] = $secrets["JWT_SECRET"] + "_session"
}
if ($secrets.ContainsKey("GOOGLE_CLIENT_ID")) {
    $secretsToSet["GOOGLE_CLIENT_ID"] = $secrets["GOOGLE_CLIENT_ID"]
}
if ($secrets.ContainsKey("GOOGLE_CLIENT_SECRET")) {
    $secretsToSet["GOOGLE_CLIENT_SECRET"] = $secrets["GOOGLE_CLIENT_SECRET"]
}
if ($secrets.ContainsKey("GITHUB_CLIENT_ID")) {
    $secretsToSet["GITHUB_CLIENT_ID"] = $secrets["GITHUB_CLIENT_ID"]
}
if ($secrets.ContainsKey("GITHUB_CLIENT_SECRET")) {
    $secretsToSet["GITHUB_CLIENT_SECRET"] = $secrets["GITHUB_CLIENT_SECRET"]
}

# Configurer les secrets
$successCount = 0
$failCount = 0

foreach ($key in $secretsToSet.Keys) {
    $value = $secretsToSet[$key]
    Write-Host "   $key..." -ForegroundColor Gray -NoNewline
    
    $result = & $flyctlPath secrets set --app $appName "$key=$value" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host " ❌" -ForegroundColor Red
        $failCount++
    }
}

# Résumé
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "📊 RÉSUMÉ : $successCount/$($secretsToSet.Count) secrets configurés" -ForegroundColor Cyan
if ($failCount -gt 0) {
    Write-Host "   ⚠️  $failCount erreur(s)" -ForegroundColor Yellow
}

# Afficher la liste
Write-Host "`n📋 Liste des secrets :" -ForegroundColor Yellow
& $flyctlPath secrets list --app $appName

Write-Host "`nTermine !`n" -ForegroundColor Green
