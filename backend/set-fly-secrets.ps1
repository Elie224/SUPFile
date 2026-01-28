# Script PowerShell pour configurer les secrets Fly.io
# Exécuter avec : powershell -ExecutionPolicy Bypass -File set-fly-secrets.ps1

Write-Host "`n🔐 Configuration des Secrets Fly.io`n" -ForegroundColor Cyan

# Chemin vers flyctl
$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"

# Vérifier si flyctl existe
if (-not (Test-Path $flyctlPath)) {
    Write-Host "❌ flyctl non trouvé à : $flyctlPath" -ForegroundColor Red
    Write-Host "`nInstallez flyctl avec : winget install --id Fly.Flyctl -e" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ flyctl trouvé : $flyctlPath" -ForegroundColor Green

# Débloquer le fichier
Write-Host "`n🔓 Déblocage de flyctl.exe..." -ForegroundColor Yellow
try {
    Unblock-File -Path $flyctlPath -ErrorAction Stop
    Write-Host "✅ flyctl débloqué avec succès" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Impossible de débloquer automatiquement. Essayez en tant qu'administrateur." -ForegroundColor Yellow
    Write-Host "   Ou débloquez manuellement : Clic droit sur le fichier → Propriétés → Débloquer" -ForegroundColor Yellow
}

# Demander le nom de l'application
Write-Host "`n📝 Nom de l'application Fly.io (appuyez sur Entrée pour 'supfile') : " -ForegroundColor Cyan -NoNewline
$appName = Read-Host
if ([string]::IsNullOrWhiteSpace($appName)) {
    $appName = "supfile"
}

Write-Host "`n🔧 Utilisation de l'application : $appName" -ForegroundColor Cyan

# Vérifier la connexion
Write-Host "`n🔍 Vérification de la connexion Fly.io..." -ForegroundColor Yellow
$checkAuth = & $flyctlPath auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Vous n'êtes pas connecté à Fly.io" -ForegroundColor Yellow
    Write-Host "   Connexion en cours..." -ForegroundColor Yellow
    & $flyctlPath auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec de la connexion" -ForegroundColor Red
        exit 1
    }
}

# Liste des secrets à définir
$secrets = @{
    "NODE_ENV" = "production"
    "PORT" = "5000"
    "MONGO_URI" = "mongodb+srv://[REDACTED]"
    "FRONTEND_URL" = "https://flourishing-banoffee-c0b1ad.netlify.app"
    "CORS_ORIGIN" = "https://flourishing-banoffee-c0b1ad.netlify.app"
    "GOOGLE_REDIRECT_URI" = "https://$appName.fly.dev/api/auth/google/callback"
    "GITHUB_REDIRECT_URI" = "https://$appName.fly.dev/api/auth/github/callback"
}

# Secrets qui nécessitent une saisie utilisateur
$userSecrets = @{
    "JWT_SECRET" = "Clé secrète JWT (64 caractères recommandés)"
    "JWT_REFRESH_SECRET" = "Clé secrète pour refresh tokens (différente de JWT_SECRET)"
    "SESSION_SECRET" = "Clé secrète pour les sessions (différente des autres)"
    "GOOGLE_CLIENT_ID" = "Google OAuth Client ID"
    "GOOGLE_CLIENT_SECRET" = "Google OAuth Client Secret"
    "GITHUB_CLIENT_ID" = "GitHub OAuth Client ID"
    "GITHUB_CLIENT_SECRET" = "GitHub OAuth Client Secret"
}

Write-Host "`n📋 Configuration des secrets automatiques..." -ForegroundColor Cyan
foreach ($key in $secrets.Keys) {
    $value = $secrets[$key]
    Write-Host "   Définition de $key..." -ForegroundColor Gray
    & $flyctlPath secrets set --app $appName "$key=$value" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $key défini" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur pour $key" -ForegroundColor Red
    }
}

Write-Host "`n🔑 Secrets nécessitant une saisie manuelle :" -ForegroundColor Yellow
Write-Host "   (Appuyez sur Entrée pour ignorer un secret si vous ne l'avez pas encore)" -ForegroundColor Gray
Write-Host ""

foreach ($key in $userSecrets.Keys) {
    Write-Host "$($userSecrets[$key]) : " -ForegroundColor Cyan -NoNewline
    $value = Read-Host
    
    if (-not [string]::IsNullOrWhiteSpace($value)) {
        Write-Host "   Définition de $key..." -ForegroundColor Gray
        & $flyctlPath secrets set --app $appName "$key=$value" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $key défini" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Erreur pour $key" -ForegroundColor Red
        }
    } else {
        Write-Host "   ⏭️  $key ignoré (sera défini plus tard)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Configuration terminée !`n" -ForegroundColor Green

# Afficher la liste des secrets
Write-Host "📋 Liste des secrets configurés :" -ForegroundColor Cyan
& $flyctlPath secrets list --app $appName

Write-Host "`n💡 Pour générer des secrets JWT aléatoires, exécutez :" -ForegroundColor Yellow
Write-Host "   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})" -ForegroundColor Gray
