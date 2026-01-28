# Script pour verifier et copier les secrets vers 'supfile' si necessaire

Write-Host ""
Write-Host "VERIFICATION ET CONFIGURATION DES SECRETS POUR 'supfile'" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

$flyctlPath = Join-Path $env:USERPROFILE ".fly\bin\flyctl.exe"
$targetApp = "supfile"
$sourceApp = "backend-sparkling-sun-1539"
$envFile = Join-Path $PSScriptRoot ".env"

# Verifier flyctl
Write-Host "Verification de flyctl..." -ForegroundColor Yellow
try {
    $null = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "flyctl failed" }
    Write-Host "   OK: flyctl fonctionne" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR: flyctl ne fonctionne pas" -ForegroundColor Red
    exit 1
}

# Verifier les secrets de supfile
Write-Host ""
Write-Host "Verification des secrets de '$targetApp'..." -ForegroundColor Yellow
$targetSecrets = & $flyctlPath secrets list --app $targetApp 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERREUR: Impossible de lister les secrets" -ForegroundColor Red
    Write-Host "   Message: $targetSecrets" -ForegroundColor Gray
    exit 1
}

$targetSecretCount = ($targetSecrets | Select-String -Pattern '^\w+' | Where-Object { $_.Line -notmatch '^NAME' }).Count
Write-Host "   OK: $targetSecretCount secrets trouves" -ForegroundColor Green

# Si moins de 10 secrets, configurer depuis .env
if ($targetSecretCount -lt 10) {
    Write-Host ""
    Write-Host "ATTENTION: Moins de 10 secrets trouves. Configuration depuis .env..." -ForegroundColor Yellow
    
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
    
    # Preparer les secrets a configurer
    Write-Host ""
    Write-Host "Configuration des secrets sur '$targetApp'..." -ForegroundColor Yellow
    
    # Secrets fixes (NE JAMAIS mettre de vraies valeurs sensibles ici)
    $secretsToSet = @{
        "NODE_ENV" = "production"
        "PORT" = "5000"
        # IMPORTANT : Remplacez cette valeur par votre MONGO_URI réelle AVANT d'exécuter le script.
        # Ne commitez JAMAIS la vraie valeur dans GitHub.
        "MONGO_URI" = "YOUR_MONGODB_ATLAS_URI"
        "FRONTEND_URL" = "https://flourishing-banoffee-c0b1ad.netlify.app"
        "CORS_ORIGIN" = "https://flourishing-banoffee-c0b1ad.netlify.app"
        "GOOGLE_REDIRECT_URI" = "https://$targetApp.fly.dev/api/auth/google/callback"
        "GITHUB_REDIRECT_URI" = "https://$targetApp.fly.dev/api/auth/github/callback"
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
        
        $result = & $flyctlPath secrets set --app $targetApp "$key=$value" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " OK" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " ERREUR" -ForegroundColor Red
            Write-Host "      Message: $result" -ForegroundColor Gray
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
} else {
    Write-Host ""
    Write-Host "OK: Les secrets sont deja configures ($targetSecretCount secrets)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Liste des secrets :" -ForegroundColor Yellow
    & $flyctlPath secrets list --app $targetApp
}

Write-Host ""
Write-Host "Termine !" -ForegroundColor Green
Write-Host ""
