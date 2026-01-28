# Script de Diagnostic Complet pour le Blocage de flyctl.exe
# Exécuter avec : powershell -ExecutionPolicy Bypass -File diagnostic-flyctl.ps1

Write-Host "`n🔍 DIAGNOSTIC COMPLET DU BLOCAGE FLYCTL`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 1. Vérifier l'existence du fichier
$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"
Write-Host "`n1. Vérification du fichier..." -ForegroundColor Yellow
if (Test-Path $flyctlPath) {
    Write-Host "   ✅ Fichier trouvé : $flyctlPath" -ForegroundColor Green
    $fileInfo = Get-Item $flyctlPath
    Write-Host "   📅 Date de modification : $($fileInfo.LastWriteTime)" -ForegroundColor Gray
    Write-Host "   📦 Taille : $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Fichier non trouvé" -ForegroundColor Red
    Write-Host "   💡 Installez flyctl : winget install --id Fly.Flyctl -e" -ForegroundColor Yellow
    exit 1
}

# 2. Vérifier le blocage de zone
Write-Host "`n2. Vérification du blocage de zone..." -ForegroundColor Yellow
try {
    $zone = Get-Item $flyctlPath -Stream Zone.Identifier -ErrorAction SilentlyContinue
    if ($zone) {
        Write-Host "   ⚠️  Fichier bloqué par zone de sécurité" -ForegroundColor Yellow
        Write-Host "   Solution : Unblock-File -Path '$flyctlPath'" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ Fichier non bloqué par zone" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✅ Fichier non bloqué par zone" -ForegroundColor Green
}

# 3. Vérifier Windows Defender
Write-Host "`n3. Vérification Windows Defender..." -ForegroundColor Yellow
try {
    $defender = Get-MpPreference -ErrorAction SilentlyContinue
    if ($defender) {
        $exclusions = Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
        $isExcluded = $exclusions -contains $flyctlPath -or 
                     ($exclusions | Where-Object { $_ -like "*\.fly\bin*" })
        if ($isExcluded) {
            Write-Host "   ✅ flyctl dans les exclusions Windows Defender" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  flyctl PAS dans les exclusions" -ForegroundColor Yellow
            Write-Host "   Solution : Add-MpPreference -ExclusionPath '$flyctlPath'" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  Windows Defender non accessible (peut nécessiter admin)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Impossible de vérifier Windows Defender : $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Vérifier AppLocker
Write-Host "`n4. Vérification AppLocker..." -ForegroundColor Yellow
try {
    $applocker = Get-AppLockerPolicy -Effective -ErrorAction SilentlyContinue
    if ($applocker) {
        Write-Host "   ⚠️  AppLocker est actif" -ForegroundColor Yellow
        Write-Host "   Solution : Désactiver temporairement ou ajouter exception (ADMIN requis)" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ AppLocker non actif" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✅ AppLocker non actif ou non accessible" -ForegroundColor Green
}

# 5. Vérifier les variables PROXY (IMPORTANT)
Write-Host "`n5. ⚠️  VÉRIFICATION DES VARIABLES PROXY (IMPORTANT)..." -ForegroundColor Yellow
$proxyVars = Get-ChildItem Env: | Where-Object { $_.Name -like "*PROXY*" }
if ($proxyVars) {
    Write-Host "   ⚠️  Variables proxy détectées :" -ForegroundColor Yellow
    $proxyVars | ForEach-Object {
        $value = if ($_.Value.Length -gt 50) { $_.Value.Substring(0, 50) + "..." } else { $_.Value }
        Write-Host "      $($_.Name) = $value" -ForegroundColor Gray
    }
    Write-Host "`n   💡 Le proxy peut bloquer l'exécution de flyctl !" -ForegroundColor Cyan
    Write-Host "   Solutions possibles :" -ForegroundColor Cyan
    Write-Host "      1. Désactiver temporairement : `$env:HTTP_PROXY = ''; `$env:HTTPS_PROXY = ''" -ForegroundColor Gray
    Write-Host "      2. Configurer flyctl pour utiliser le proxy" -ForegroundColor Gray
    Write-Host "      3. Ajouter fly.io aux exceptions : `$env:NO_PROXY = 'fly.io,*.fly.dev'" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Aucune variable proxy détectée" -ForegroundColor Green
}

# 6. Vérifier les paramètres proxy système
Write-Host "`n6. Vérification proxy système (WinHTTP)..." -ForegroundColor Yellow
try {
    $winhttpProxy = netsh winhttp show proxy 2>&1
    if ($winhttpProxy -match "Direct access") {
        Write-Host "   ✅ Pas de proxy système configuré" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Proxy système configuré :" -ForegroundColor Yellow
        $winhttpProxy | ForEach-Object {
            Write-Host "      $_" -ForegroundColor Gray
        }
        Write-Host "   💡 Ce proxy peut interférer avec flyctl" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Impossible de vérifier le proxy système" -ForegroundColor Yellow
}

# 7. Vérifier les paramètres proxy Internet Explorer
Write-Host "`n7. Vérification proxy Internet Explorer..." -ForegroundColor Yellow
try {
    $ieProxy = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -ErrorAction SilentlyContinue
    if ($ieProxy) {
        if ($ieProxy.ProxyEnable -eq 1) {
            Write-Host "   ⚠️  Proxy IE activé : $($ieProxy.ProxyServer)" -ForegroundColor Yellow
            Write-Host "   💡 Ce proxy peut affecter les applications Windows" -ForegroundColor Cyan
        } else {
            Write-Host "   ✅ Proxy IE désactivé" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ⚠️  Impossible de vérifier le proxy IE" -ForegroundColor Yellow
}

# 8. Vérifier la signature numérique
Write-Host "`n8. Vérification signature numérique..." -ForegroundColor Yellow
try {
    $signature = Get-AuthenticodeSignature $flyctlPath
    if ($signature.Status -eq "Valid") {
        Write-Host "   ✅ Signature valide : $($signature.SignerCertificate.Subject)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Signature invalide ou absente : $($signature.Status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Impossible de vérifier la signature" -ForegroundColor Yellow
}

# 9. Test d'exécution
Write-Host "`n9. Test d'exécution de flyctl..." -ForegroundColor Yellow
Write-Host "   (Ce test peut échouer si le blocage est actif)" -ForegroundColor Gray
try {
    $result = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ flyctl s'exécute correctement !" -ForegroundColor Green
        Write-Host "   Version : $($result -join ' ')" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Erreur d'exécution (code: $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "   Message : $result" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Impossible d'exécuter flyctl :" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -match "strat.*gie.*contr.*le") {
        Write-Host "`n   💡 CAUSE PROBABLE : AppLocker ou politique de sécurité" -ForegroundColor Cyan
    }
}

# 10. Test avec proxy désactivé (si proxy détecté)
if ($proxyVars) {
    Write-Host "`n10. Test avec proxy désactivé temporairement..." -ForegroundColor Yellow
    $originalHTTP = $env:HTTP_PROXY
    $originalHTTPS = $env:HTTPS_PROXY
    $env:HTTP_PROXY = ""
    $env:HTTPS_PROXY = ""
    
    try {
        $result = & $flyctlPath version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ flyctl fonctionne SANS proxy !" -ForegroundColor Green
            Write-Host "   💡 Le proxy est la cause du blocage" -ForegroundColor Cyan
        } else {
            Write-Host "   ❌ Le problème persiste même sans proxy" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Le problème persiste même sans proxy" -ForegroundColor Red
    } finally {
        $env:HTTP_PROXY = $originalHTTP
        $env:HTTPS_PROXY = $originalHTTPS
    }
}

# Résumé et recommandations
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "📋 RÉSUMÉ ET RECOMMANDATIONS" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$recommendations = @()

if ($proxyVars) {
    $recommendations += "1. Le proxy est probablement la cause principale"
    $recommendations += "   → Désactivez temporairement le proxy pour tester"
    $recommendations += "   → Ou configurez flyctl pour utiliser votre proxy"
}

if (-not (Test-Path $flyctlPath)) {
    $recommendations += "2. flyctl n'est pas installé"
    $recommendations += "   → Installez avec : winget install --id Fly.Flyctl -e"
}

$recommendations += "3. Actions immédiates :"
$recommendations += "   → Unblock-File -Path '$flyctlPath'"
$recommendations += "   → Add-MpPreference -ExclusionPath '$flyctlPath' (admin requis)"

foreach ($rec in $recommendations) {
    Write-Host "   $rec" -ForegroundColor Yellow
}

Write-Host "`n✅ Diagnostic terminé`n" -ForegroundColor Green
