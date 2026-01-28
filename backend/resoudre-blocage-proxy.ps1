# Script pour Résoudre le Blocage de flyctl causé par le Proxy
# Exécuter avec : powershell -ExecutionPolicy Bypass -File resoudre-blocage-proxy.ps1

Write-Host "`n🔧 RÉSOLUTION DU BLOCAGE FLYCTL (PROXY)`n" -ForegroundColor Cyan

$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"

# Vérifier que flyctl existe
if (-not (Test-Path $flyctlPath)) {
    Write-Host "❌ flyctl non trouvé. Installez-le d'abord." -ForegroundColor Red
    exit 1
}

# 1. Débloquer le fichier
Write-Host "1. Déblocage du fichier..." -ForegroundColor Yellow
try {
    Unblock-File -Path $flyctlPath -ErrorAction Stop
    Write-Host "   ✅ Fichier débloqué" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Impossible de débloquer (peut nécessiter admin)" -ForegroundColor Yellow
}

# 2. Ajouter aux exclusions Windows Defender
Write-Host "`n2. Ajout aux exclusions Windows Defender..." -ForegroundColor Yellow
try {
    Add-MpPreference -ExclusionPath $flyctlPath -ErrorAction SilentlyContinue
    Add-MpPreference -ExclusionPath "$env:USERPROFILE\.fly\bin" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Ajouté aux exclusions" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Impossible d'ajouter (peut nécessiter admin)" -ForegroundColor Yellow
}

# 3. Gestion du PROXY
Write-Host "`n3. Configuration du PROXY..." -ForegroundColor Yellow

$proxyVars = Get-ChildItem Env: | Where-Object { $_.Name -like "*PROXY*" }
if ($proxyVars) {
    Write-Host "   ⚠️  Variables proxy détectées" -ForegroundColor Yellow
    
    Write-Host "`n   Choisissez une option :" -ForegroundColor Cyan
    Write-Host "   1. Désactiver temporairement le proxy pour flyctl" -ForegroundColor White
    Write-Host "   2. Configurer flyctl pour utiliser le proxy" -ForegroundColor White
    Write-Host "   3. Ajouter fly.io aux exceptions de proxy" -ForegroundColor White
    Write-Host "   4. Ne rien faire" -ForegroundColor White
    
    $choice = Read-Host "`n   Votre choix (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Host "`n   Désactivation temporaire du proxy..." -ForegroundColor Yellow
            $env:HTTP_PROXY = ""
            $env:HTTPS_PROXY = ""
            $env:http_proxy = ""
            $env:https_proxy = ""
            Write-Host "   ✅ Proxy désactivé pour cette session PowerShell" -ForegroundColor Green
            Write-Host "   💡 Pour rendre permanent, supprimez les variables dans les paramètres système" -ForegroundColor Cyan
        }
        "2" {
            Write-Host "`n   Configuration du proxy pour flyctl..." -ForegroundColor Yellow
            $currentProxy = $env:HTTP_PROXY
            if ([string]::IsNullOrWhiteSpace($currentProxy)) {
                $proxyUrl = Read-Host "   Entrez l'URL du proxy (ex: http://proxy:8080)"
                $env:HTTP_PROXY = $proxyUrl
                $env:HTTPS_PROXY = $proxyUrl
            }
            Write-Host "   ✅ Proxy configuré : $env:HTTP_PROXY" -ForegroundColor Green
        }
        "3" {
            Write-Host "`n   Ajout de fly.io aux exceptions..." -ForegroundColor Yellow
            $currentNoProxy = $env:NO_PROXY
            if ([string]::IsNullOrWhiteSpace($currentNoProxy)) {
                $env:NO_PROXY = "fly.io,*.fly.dev,localhost,127.0.0.1"
            } else {
                $env:NO_PROXY = "$currentNoProxy,fly.io,*.fly.dev"
            }
            Write-Host "   ✅ Exceptions ajoutées : $env:NO_PROXY" -ForegroundColor Green
        }
        "4" {
            Write-Host "   ⏭️  Aucune modification du proxy" -ForegroundColor Yellow
        }
        default {
            Write-Host "   ❌ Choix invalide" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ✅ Aucune variable proxy détectée" -ForegroundColor Green
}

# 4. Test d'exécution
Write-Host "`n4. Test d'exécution de flyctl..." -ForegroundColor Yellow
try {
    $result = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ flyctl fonctionne maintenant !" -ForegroundColor Green
        Write-Host "   Version : $($result -join ' ')" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Le problème persiste" -ForegroundColor Red
        Write-Host "   Message : $result" -ForegroundColor Red
        Write-Host "`n   💡 Essayez :" -ForegroundColor Cyan
        Write-Host "      - Exécuter PowerShell en tant qu'administrateur" -ForegroundColor Gray
        Write-Host "      - Désactiver temporairement l'antivirus" -ForegroundColor Gray
        Write-Host "      - Vérifier les politiques de groupe (AppLocker)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Erreur : $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Créer un script wrapper pour utiliser flyctl avec proxy désactivé
Write-Host "`n5. Création d'un script wrapper..." -ForegroundColor Yellow
$wrapperScript = @"
# Wrapper pour flyctl avec proxy désactivé
# Utilisation : .\flyctl-wrapper.ps1 [commandes flyctl]

`$env:HTTP_PROXY = ""
`$env:HTTPS_PROXY = ""
`$env:http_proxy = ""
`$env:https_proxy = ""

& "$flyctlPath" `$args
"@

$wrapperPath = "$PSScriptRoot\flyctl-wrapper.ps1"
$wrapperScript | Out-File -FilePath $wrapperPath -Encoding UTF8
Write-Host "   ✅ Script wrapper créé : $wrapperPath" -ForegroundColor Green
Write-Host "   💡 Utilisez : .\flyctl-wrapper.ps1 secrets set FRONTEND_URL=..." -ForegroundColor Cyan

Write-Host "`n✅ Configuration terminée !`n" -ForegroundColor Green
