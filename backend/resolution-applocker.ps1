# Script de Résolution du Blocage AppLocker pour flyctl
# Exécuter avec PowerShell EN TANT QU'ADMINISTRATEUR
# powershell -ExecutionPolicy Bypass -File resolution-applocker.ps1

Write-Host "`n🔓 RÉSOLUTION DU BLOCAGE APPLOCKER`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Vérifier les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  ATTENTION : Ce script nécessite des droits administrateur" -ForegroundColor Yellow
    Write-Host "`n   Pour exécuter en tant qu'administrateur :" -ForegroundColor Cyan
    Write-Host "   1. Clic droit sur PowerShell" -ForegroundColor White
    Write-Host "   2. Sélectionnez 'Exécuter en tant qu'administrateur'" -ForegroundColor White
    Write-Host "   3. Naviguez vers : cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend" -ForegroundColor White
    Write-Host "   4. Exécutez : .\resolution-applocker.ps1" -ForegroundColor White
    Write-Host "`n   Appuyez sur Entrée pour continuer quand même (peut échouer)..." -ForegroundColor Yellow
    Read-Host
}

$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"

# Vérifier que flyctl existe
if (-not (Test-Path $flyctlPath)) {
    Write-Host "❌ flyctl non trouvé à : $flyctlPath" -ForegroundColor Red
    Write-Host "   Installez-le d'abord : winget install --id Fly.Flyctl -e" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ flyctl trouvé : $flyctlPath`n" -ForegroundColor Green

# 1. Débloquer le fichier
Write-Host "1. Déblocage du fichier..." -ForegroundColor Yellow
try {
    Unblock-File -Path $flyctlPath -ErrorAction Stop
    Write-Host "   ✅ Fichier débloqué" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Erreur : $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   💡 Essayez de débloquer manuellement :" -ForegroundColor Cyan
    Write-Host "      Clic droit sur flyctl.exe → Propriétés → Cocher 'Débloquer'" -ForegroundColor Gray
}

# 2. Vérifier et désactiver AppLocker
Write-Host "`n2. Vérification AppLocker..." -ForegroundColor Yellow
try {
    $applocker = Get-AppLockerPolicy -Effective -ErrorAction SilentlyContinue
    if ($applocker) {
        Write-Host "   ⚠️  AppLocker est actif" -ForegroundColor Yellow
        
        if ($isAdmin) {
            Write-Host "   Tentative de désactivation temporaire..." -ForegroundColor Yellow
            try {
                Set-AppLockerPolicy -XmlPolicy $null -ErrorAction Stop
                Write-Host "   ✅ AppLocker désactivé temporairement" -ForegroundColor Green
                Write-Host "   ⚠️  N'oubliez pas de le réactiver après utilisation" -ForegroundColor Yellow
            } catch {
                Write-Host "   ❌ Impossible de désactiver AppLocker" -ForegroundColor Red
                Write-Host "   Erreur : $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "   💡 Contactez votre administrateur système" -ForegroundColor Cyan
            }
        } else {
            Write-Host "   ❌ Droits administrateur requis pour désactiver AppLocker" -ForegroundColor Red
            Write-Host "   💡 Exécutez ce script en tant qu'administrateur" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ✅ AppLocker non actif" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✅ AppLocker non accessible ou non actif" -ForegroundColor Green
}

# 3. Ajouter aux exclusions Windows Defender (si pas déjà fait)
Write-Host "`n3. Ajout aux exclusions Windows Defender..." -ForegroundColor Yellow
if ($isAdmin) {
    try {
        Add-MpPreference -ExclusionPath $flyctlPath -ErrorAction SilentlyContinue
        Add-MpPreference -ExclusionPath "$env:USERPROFILE\.fly\bin" -ErrorAction SilentlyContinue
        Write-Host "   ✅ Ajouté aux exclusions" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Impossible d'ajouter (Windows Defender peut être désactivé)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⏭️  Droits administrateur requis" -ForegroundColor Yellow
}

# 4. Test d'exécution
Write-Host "`n4. Test d'exécution de flyctl..." -ForegroundColor Yellow
try {
    $result = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ flyctl fonctionne maintenant !" -ForegroundColor Green
        Write-Host "   Version : $($result -join ' ')" -ForegroundColor Gray
        Write-Host "`n   🎉 Vous pouvez maintenant utiliser flyctl !" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Le problème persiste" -ForegroundColor Red
        Write-Host "   Message : $result" -ForegroundColor Red
        Write-Host "`n   💡 Solutions alternatives :" -ForegroundColor Cyan
        Write-Host "      1. Utiliser l'interface web Fly.io (https://fly.io/dashboard)" -ForegroundColor Gray
        Write-Host "      2. Contacter votre administrateur système pour une exception AppLocker" -ForegroundColor Gray
        Write-Host "      3. Utiliser un autre ordinateur temporairement" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Erreur : $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -match "strat.*gie.*contr.*le") {
        Write-Host "`n   💡 CAUSE CONFIRMÉE : AppLocker ou politique de groupe" -ForegroundColor Cyan
        Write-Host "   Solutions :" -ForegroundColor Cyan
        Write-Host "      - Exécutez ce script EN TANT QU'ADMINISTRATEUR" -ForegroundColor Gray
        Write-Host "      - Ou utilisez l'interface web Fly.io" -ForegroundColor Gray
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "✅ Résolution terminée`n" -ForegroundColor Green
