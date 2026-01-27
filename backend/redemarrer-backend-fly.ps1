# Script pour redemarrer le backend sur Fly.io
# Executez ce script depuis le dossier backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "REDEMARRAGE BACKEND FLY.IO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

$appName = "supfile"

# Verifier que flyctl fonctionne
$flyctlPath = "flyctl"
try {
    $version = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] flyctl ne fonctionne pas." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERREUR] flyctl introuvable." -ForegroundColor Red
    exit 1
}

# Methode 1: Redemarrage simple
Write-Host "`n[*] Tentative de redemarrage simple..." -ForegroundColor Yellow
try {
    $result = & $flyctlPath apps restart --app $appName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Application redemarree avec succes" -ForegroundColor Green
        Write-Host "`nAttendez 30-60 secondes que l'application redemarre." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "[ERREUR] Redemarrage simple echoue, tentative avec scale..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERREUR] Redemarrage simple echoue: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Methode 2: Scale down puis up (plus agressif)
Write-Host "`n[*] Tentative de redemarrage avec scale (methode agressive)..." -ForegroundColor Yellow
try {
    Write-Host "  - Arret de l'application (count=0)..." -ForegroundColor Gray
    & $flyctlPath scale count 0 --app $appName 2>&1 | Out-Null
    
    Write-Host "  - Attente de 10 secondes..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    Write-Host "  - Redemarrage de l'application (count=1)..." -ForegroundColor Gray
    & $flyctlPath scale count 1 --app $appName 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Application redemarree avec succes (methode scale)" -ForegroundColor Green
        Write-Host "`nAttendez 30-60 secondes que l'application redemarre." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "[ERREUR] Redemarrage avec scale echoue" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERREUR] Redemarrage avec scale echoue: $($_.Exception.Message)" -ForegroundColor Red
}

# Methode 3: Redepoiement complet
Write-Host "`n[*] Tentative de redepoiement complet..." -ForegroundColor Yellow
Write-Host "    (Cela peut prendre plusieurs minutes)" -ForegroundColor Gray
try {
    $result = & $flyctlPath deploy --app $appName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Application redeployee avec succes" -ForegroundColor Green
        Write-Host "`nAttendez 2-3 minutes que le deploiement se termine." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "[ERREUR] Redepoiement echoue" -ForegroundColor Red
        Write-Host "`nSortie de la commande:" -ForegroundColor Yellow
        Write-Host $result -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERREUR] Redepoiement echoue: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "[ERREUR] Toutes les methodes de redemarrage ont echoue" -ForegroundColor Red
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "`nEssayez manuellement:" -ForegroundColor Yellow
Write-Host "  flyctl apps restart --app $appName" -ForegroundColor Cyan
Write-Host "  OU" -ForegroundColor Gray
Write-Host "  flyctl scale count 0 --app $appName" -ForegroundColor Cyan
Write-Host "  flyctl scale count 1 --app $appName" -ForegroundColor Cyan
Write-Host "  OU" -ForegroundColor Gray
Write-Host "  flyctl deploy --app $appName" -ForegroundColor Cyan
