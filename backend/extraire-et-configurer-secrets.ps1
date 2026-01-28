# Script pour Extraire les Secrets du .env et les Configurer sur Fly.io
# Ce script lit backend/.env et configure automatiquement les secrets sur Fly.io

Write-Host "`n🔍 EXTRACTION ET CONFIGURATION DES SECRETS FLY.IO`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$flyctlPath = Join-Path $env:USERPROFILE ".fly\bin\flyctl.exe"
$envFile = Join-Path $PSScriptRoot ".env"

# Vérifier que le fichier .env existe
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Fichier .env non trouvé : $envFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichier .env trouvé : $envFile" -ForegroundColor Green

# Lire le fichier .env
Write-Host "`n📖 Lecture du fichier .env..." -ForegroundColor Yellow
$envContent = Get-Content $envFile

# Parser les variables d'environnement
$secrets = @{}
foreach ($line in $envContent) {
    # Ignorer les commentaires et lignes vides
    if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) {
        continue
    }
    
    # Parser KEY=VALUE
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Ignorer les valeurs vides ou commentées
        if (-not [string]::IsNullOrWhiteSpace($value) -and -not $value.StartsWith('#')) {
            $secrets[$key] = $value
        }
    }
}

Write-Host "   ✅ $($secrets.Count) variables trouvées" -ForegroundColor Green

# Afficher les secrets trouvés (masquer les valeurs sensibles)
Write-Host "`n📋 Secrets trouvés :" -ForegroundColor Yellow
$importantSecrets = @("JWT_SECRET", "JWT_REFRESH_SECRET", "SESSION_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
foreach ($key in $importantSecrets) {
    if ($secrets.ContainsKey($key)) {
        $value = $secrets[$key]
        $displayValue = if ($value.Length -gt 20) { $value.Substring(0, 20) + "..." } else { $value }
        Write-Host "   ✅ $key = $displayValue" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $key = NON TROUVÉ" -ForegroundColor Yellow
    }
}

# Vérifier flyctl
Write-Host "`n🔧 Vérification de flyctl..." -ForegroundColor Yellow
try {
    $version = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ flyctl ne fonctionne pas" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ flyctl fonctionne" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Vérifier la connexion
Write-Host "`n🔐 Vérification de la connexion Fly.io..." -ForegroundColor Yellow
$whoami = & $flyctlPath auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Vous n'êtes pas connecté" -ForegroundColor Yellow
    & $flyctlPath auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Échec de la connexion" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ Connecté : $whoami" -ForegroundColor Green
}

# Demander le nom de l'application
Write-Host "`n📝 Nom de l'application Fly.io" -ForegroundColor Yellow
Write-Host "   (Appuyez sur Entrée pour 'supfile') : " -ForegroundColor Cyan -NoNewline
$appName = Read-Host
if ([string]::IsNullOrWhiteSpace($appName)) {
    $appName = "supfile"
}

# Mapping des secrets à configurer
$secretsToSet = @{
    "NODE_ENV" = "production"
    "PORT" = "5000"
    "MONGO_URI" = "mongodb+srv://kouroumaelisee_db_user:3mvU3jm97uBaEDEt@cluster0.u3cxqhm.mongodb.net/supfile?retryWrites=true&w=majority"
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
if ($secrets.ContainsKey("SESSION_SECRET")) {
    $secretsToSet["SESSION_SECRET"] = $secrets["SESSION_SECRET"]
} else {
    # Utiliser JWT_SECRET comme fallback si SESSION_SECRET n'existe pas
    if ($secrets.ContainsKey("JWT_SECRET")) {
        $secretsToSet["SESSION_SECRET"] = $secrets["JWT_SECRET"] + "_session"
    }
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
Write-Host "`n🔐 Configuration des secrets sur Fly.io..." -ForegroundColor Yellow
$successCount = 0
$failCount = 0

foreach ($key in $secretsToSet.Keys) {
    $value = $secretsToSet[$key]
    Write-Host "   Définition de $key..." -ForegroundColor Gray -NoNewline
    
    try {
        $result = & $flyctlPath secrets set --app $appName "$key=$value" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " ❌" -ForegroundColor Red
            Write-Host "      Erreur : $result" -ForegroundColor Gray
            $failCount++
        }
    } catch {
        Write-Host " ❌" -ForegroundColor Red
        Write-Host "      Exception : $($_.Exception.Message)" -ForegroundColor Gray
        $failCount++
    }
}

# Résumé
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "   ✅ Secrets configurés : $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "   ❌ Erreurs : $failCount" -ForegroundColor Red
}

# Afficher la liste des secrets
Write-Host "`n📋 Liste des secrets configurés sur Fly.io :" -ForegroundColor Yellow
& $flyctlPath secrets list --app $appName

Write-Host "`n✅ Configuration terminée !`n" -ForegroundColor Green
