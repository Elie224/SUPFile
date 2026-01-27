# Script pour mettre a jour CORS_ORIGIN sur Fly.io pour Netlify
# Executez ce script depuis le dossier backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "MISE A JOUR CORS_ORIGIN POUR NETLIFY - FLY.IO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

$appName = "supfile"
$netlifyUrl = "https://flourishing-banoffee-c0b1ad.netlify.app"

# Verifier que flyctl fonctionne
$flyctlPath = "flyctl"
try {
    $version = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] flyctl ne fonctionne pas. Executez d'abord resolution-applocker.ps1" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERREUR] flyctl introuvable. Installez-le ou ajoutez-le au PATH." -ForegroundColor Red
    exit 1
}

Write-Host "`n[*] Mise a jour de CORS_ORIGIN..." -ForegroundColor Yellow
Write-Host "    URL Netlify: $netlifyUrl" -ForegroundColor Gray

# Mettre a jour CORS_ORIGIN
try {
    & $flyctlPath secrets set --app $appName "CORS_ORIGIN=$netlifyUrl" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] CORS_ORIGIN mis a jour avec succes" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] Echec de la mise a jour de CORS_ORIGIN" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERREUR] Impossible de mettre a jour CORS_ORIGIN: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Mettre a jour FRONTEND_URL aussi
Write-Host "`n[*] Mise a jour de FRONTEND_URL..." -ForegroundColor Yellow
try {
    & $flyctlPath secrets set --app $appName "FRONTEND_URL=$netlifyUrl" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] FRONTEND_URL mis a jour avec succes" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] Echec de la mise a jour de FRONTEND_URL" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERREUR] Impossible de mettre a jour FRONTEND_URL: $($_.Exception.Message)" -ForegroundColor Red
}

# Redemarrer l'application pour appliquer les changements
Write-Host "`n[*] Redemarrage de l'application..." -ForegroundColor Yellow

# Methode 1: Redemarrage simple
$restartSuccess = $false
try {
    $result = & $flyctlPath apps restart --app $appName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Application redemarree avec succes (methode 1)" -ForegroundColor Green
        $restartSuccess = $true
    }
} catch {
    Write-Host "[INFO] Methode 1 echoue, tentative methode 2..." -ForegroundColor Yellow
}

# Methode 2: Scale down puis up (si methode 1 echoue)
if (-not $restartSuccess) {
    try {
        Write-Host "  - Arret de l'application (count=0)..." -ForegroundColor Gray
        & $flyctlPath scale count 0 --app $appName 2>&1 | Out-Null
        Start-Sleep -Seconds 5
        
        Write-Host "  - Redemarrage de l'application (count=1)..." -ForegroundColor Gray
        & $flyctlPath scale count 1 --app $appName 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Application redemarree avec succes (methode 2: scale)" -ForegroundColor Green
            $restartSuccess = $true
        }
    } catch {
        Write-Host "[ERREUR] Methode 2 echoue: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if (-not $restartSuccess) {
    Write-Host "[ATTENTION] Le redemarrage automatique a echoue." -ForegroundColor Yellow
    Write-Host "            Executez manuellement: .\redemarrer-backend-fly.ps1" -ForegroundColor Yellow
    Write-Host "            OU" -ForegroundColor Gray
    Write-Host "            flyctl apps restart --app $appName" -ForegroundColor Cyan
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "[OK] Configuration terminee !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "`nAttendez 30-60 secondes que l'application redemarre," -ForegroundColor Yellow
Write-Host "puis testez votre application Netlify." -ForegroundColor Yellow
Write-Host "`nURL Frontend: $netlifyUrl" -ForegroundColor Cyan
Write-Host "URL Backend: https://$appName.fly.dev" -ForegroundColor Cyan
