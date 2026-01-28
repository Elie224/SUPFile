# Script pour Configurer les Secrets Fly.io
# Exécuter après avoir résolu le blocage de flyctl

Write-Host "`n🔐 CONFIGURATION DES SECRETS FLY.IO`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$flyctlPath = Join-Path $env:USERPROFILE ".fly\bin\flyctl.exe"

# Vérifier que flyctl fonctionne
Write-Host "1. Vérification de flyctl..." -ForegroundColor Yellow
try {
    $version = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ flyctl fonctionne" -ForegroundColor Green
    } else {
        Write-Host "   ❌ flyctl ne fonctionne pas. Exécutez d'abord resolution-applocker.ps1" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Erreur : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Vérifier la connexion
Write-Host "`n2. Vérification de la connexion Fly.io..." -ForegroundColor Yellow
$whoami = & $flyctlPath auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Vous n'êtes pas connecté à Fly.io" -ForegroundColor Yellow
    Write-Host "   Connexion en cours..." -ForegroundColor Yellow
    & $flyctlPath auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Échec de la connexion" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ Connecté : $whoami" -ForegroundColor Green
}

# Demander le nom de l'application
Write-Host "`n3. Nom de l'application Fly.io" -ForegroundColor Yellow
Write-Host "   (Appuyez sur Entrée pour 'supfile') : " -ForegroundColor Cyan -NoNewline
$appName = Read-Host
if ([string]::IsNullOrWhiteSpace($appName)) {
    $appName = "supfile"
}

# Vérifier si l'application existe
Write-Host "`n   Vérification de l'application '$appName'..." -ForegroundColor Gray
try {
    $appsList = & $flyctlPath apps list 2>&1
    $appExists = $appsList | Select-String -Pattern $appName -Quiet
    if (-not $appExists) {
        Write-Host "   ⚠️  L'application '$appName' n'existe pas" -ForegroundColor Yellow
        $create = Read-Host "   Voulez-vous la créer ? (O/N)"
        if ($create -eq "O" -or $create -eq "o") {
            & $flyctlPath apps create $appName 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Application créée" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Échec de la création" -ForegroundColor Red
                Write-Host "   💡 L'application sera créée lors du premier déploiement" -ForegroundColor Cyan
            }
        } else {
            Write-Host "   ⏭️  Création annulée (l'application sera créée lors du déploiement)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✅ Application trouvée" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Impossible de vérifier l'existence de l'application" -ForegroundColor Yellow
    Write-Host "   💡 L'application sera créée lors du premier déploiement si nécessaire" -ForegroundColor Cyan
}

# Secrets automatiques
Write-Host "`n4. Configuration des secrets automatiques..." -ForegroundColor Yellow
$autoSecrets = @{
    "NODE_ENV" = "production"
    "PORT" = "5000"
    "MONGO_URI" = "mongodb+srv://[REDACTED]"
    "FRONTEND_URL" = "https://flourishing-banoffee-c0b1ad.netlify.app"
    "CORS_ORIGIN" = "https://flourishing-banoffee-c0b1ad.netlify.app"
    "GOOGLE_REDIRECT_URI" = "https://$appName.fly.dev/api/auth/google/callback"
    "GITHUB_REDIRECT_URI" = "https://$appName.fly.dev/api/auth/github/callback"
}

foreach ($key in $autoSecrets.Keys) {
    $value = $autoSecrets[$key]
    Write-Host "   Définition de $key..." -ForegroundColor Gray
    $command = "secrets set --app $appName `"$key=$value`""
    $result = & $flyctlPath secrets set --app $appName "$key=$value" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $key défini" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur pour $key" -ForegroundColor Red
        Write-Host "   Message : $result" -ForegroundColor Gray
    }
}

# Secrets nécessitant une saisie
Write-Host "`n5. Secrets nécessitant une saisie manuelle" -ForegroundColor Yellow
Write-Host "   (Appuyez sur Entrée pour ignorer un secret si vous ne l'avez pas encore)" -ForegroundColor Gray
Write-Host ""

$userSecrets = @{
    "JWT_SECRET" = "Clé secrète JWT (64 caractères recommandés)"
    "JWT_REFRESH_SECRET" = "Clé secrète pour refresh tokens (différente de JWT_SECRET)"
    "SESSION_SECRET" = "Clé secrète pour les sessions (différente des autres)"
    "GOOGLE_CLIENT_ID" = "Google OAuth Client ID"
    "GOOGLE_CLIENT_SECRET" = "Google OAuth Client Secret"
    "GITHUB_CLIENT_ID" = "GitHub OAuth Client ID"
    "GITHUB_CLIENT_SECRET" = "GitHub OAuth Client Secret"
}

foreach ($key in $userSecrets.Keys) {
    Write-Host "$($userSecrets[$key]) : " -ForegroundColor Cyan -NoNewline
    $value = Read-Host
    
    if (-not [string]::IsNullOrWhiteSpace($value)) {
        Write-Host "   Définition de $key..." -ForegroundColor Gray
        $result = & $flyctlPath secrets set --app $appName "$key=$value" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $key défini" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Erreur pour $key" -ForegroundColor Red
            Write-Host "   Message : $result" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⏭️  $key ignoré (sera défini plus tard)" -ForegroundColor Yellow
    }
}

# Afficher la liste des secrets
Write-Host "`n6. Liste des secrets configurés :" -ForegroundColor Yellow
& $flyctlPath secrets list --app $appName

Write-Host "`n✅ Configuration terminée !`n" -ForegroundColor Green
Write-Host "💡 Pour générer des secrets JWT aléatoires, exécutez :" -ForegroundColor Cyan
Write-Host "   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]`$_})" -ForegroundColor Gray
