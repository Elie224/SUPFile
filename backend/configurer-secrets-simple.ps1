# Script pour Extraire les Secrets du .env et les Configurer sur Fly.io
# Version simplifiee sans emojis pour eviter les erreurs de parsing

Write-Host ""
Write-Host "EXTRACTION ET CONFIGURATION AUTOMATIQUE DES SECRETS" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

$flyctlPath = Join-Path $env:USERPROFILE ".fly\bin\flyctl.exe"
$envFile = Join-Path $PSScriptRoot ".env"

# Verifier que le fichier .env existe
if (-not (Test-Path $envFile)) {
    Write-Host "ERREUR: Fichier .env non trouve : $envFile" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Fichier .env trouve" -ForegroundColor Green

# Lire et parser le fichier .env
Write-Host ""
Write-Host "Lecture du fichier .env..." -ForegroundColor Yellow
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

Write-Host "   OK: $($secrets.Count) variables trouvees" -ForegroundColor Green

# Afficher les secrets importants trouves
Write-Host ""
Write-Host "Secrets importants trouves :" -ForegroundColor Yellow
$importantKeys = @("JWT_SECRET", "JWT_REFRESH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
foreach ($key in $importantKeys) {
    if ($secrets.ContainsKey($key)) {
        $value = $secrets[$key]
        $display = if ($value.Length -gt 30) { $value.Substring(0, 30) + "..." } else { $value }
        Write-Host "   OK: $key = $display" -ForegroundColor Green
    }
}

# Verifier flyctl
Write-Host ""
Write-Host "Verification de flyctl..." -ForegroundColor Yellow
try {
    $null = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "flyctl failed" }
    Write-Host "   OK: flyctl fonctionne" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR: flyctl ne fonctionne pas" -ForegroundColor Red
    exit 1
}

# Verifier la connexion
Write-Host ""
Write-Host "Verification de la connexion..." -ForegroundColor Yellow
$whoami = & $flyctlPath auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Connexion en cours..." -ForegroundColor Yellow
    & $flyctlPath auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ERREUR: Echec de la connexion" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   OK: Connecte" -ForegroundColor Green
}

# Demander le nom de l'application
Write-Host ""
Write-Host "Nom de l'application (Entree pour 'supfile') : " -ForegroundColor Cyan -NoNewline
$appName = Read-Host
if ([string]::IsNullOrWhiteSpace($appName)) {
    $appName = "supfile"
}

# Verifier si l'application existe
Write-Host ""
Write-Host "Verification de l'application '$appName'..." -ForegroundColor Yellow
$appsList = & $flyctlPath apps list 2>&1
$appExists = $appsList | Select-String -Pattern $appName -Quiet

if (-not $appExists) {
    Write-Host "   L'application '$appName' n'existe pas" -ForegroundColor Yellow
    Write-Host "   Creation de l'application..." -ForegroundColor Yellow
    $createResult = & $flyctlPath apps create $appName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK: Application creee" -ForegroundColor Green
    } else {
        Write-Host "   ERREUR: Impossible de creer l'application" -ForegroundColor Red
        Write-Host "   Message: $createResult" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Vous pouvez creer l'application manuellement avec:" -ForegroundColor Cyan
        Write-Host "   flyctl apps create $appName" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "   OK: Application trouvee" -ForegroundColor Green
}

# Preparer les secrets a configurer
Write-Host ""
Write-Host "Configuration des secrets..." -ForegroundColor Yellow

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
# SESSION_SECRET=[REDACTED] JWT_SECRET si pas defini
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
        Write-Host " OK" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host " ERREUR" -ForegroundColor Red
        $failCount++
    }
}

# Resume
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "RESUME : $successCount/$($secretsToSet.Count) secrets configures" -ForegroundColor Cyan
if ($failCount -gt 0) {
    Write-Host "   ATTENTION: $failCount erreur(s)" -ForegroundColor Yellow
}

# Afficher la liste
Write-Host ""
Write-Host "Liste des secrets :" -ForegroundColor Yellow
& $flyctlPath secrets list --app $appName

Write-Host ""
Write-Host "Termine !" -ForegroundColor Green
Write-Host ""
