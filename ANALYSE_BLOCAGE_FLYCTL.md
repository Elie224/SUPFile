# 🔍 Analyse Complète du Blocage de flyctl.exe

## 🎯 Causes Possibles du Blocage

Le blocage de `flyctl.exe` peut provenir de plusieurs sources. Voici une analyse complète :

---

## 1. 🛡️ Windows Defender / SmartScreen

### Symptômes
- Message : "Une stratégie de contrôle d'application a bloqué ce fichier"
- L'exécutable est téléchargé depuis Internet

### Diagnostic
```powershell
# Vérifier si Windows Defender bloque
Get-MpPreference | Select-Object -Property DisableRealtimeMonitoring, DisableBehaviorMonitoring

# Vérifier les exclusions
Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
```

### Solution
```powershell
# Ajouter flyctl.exe aux exclusions Windows Defender
Add-MpPreference -ExclusionPath "$env:USERPROFILE\.fly\bin\flyctl.exe"
Add-MpPreference -ExclusionPath "$env:USERPROFILE\.fly\bin"
```

---

## 2. 🔒 AppLocker / Software Restriction Policies

### Symptômes
- Blocage systématique même après déblocage
- Message mentionnant "stratégie de contrôle d'application"

### Diagnostic
```powershell
# Vérifier si AppLocker est actif (nécessite admin)
Get-AppLockerPolicy -Effective

# Vérifier les politiques de groupe
gpresult /R | Select-String -Pattern "AppLocker"
```

### Solution
```powershell
# Option 1 : Désactiver temporairement (ADMIN requis)
Set-AppLockerPolicy -XmlPolicy $null

# Option 2 : Ajouter une exception (ADMIN requis)
# Créer une règle d'exception pour flyctl.exe
```

---

## 3. 🌐 Proxy / Firewall d'Entreprise

### ⚠️ IMPORTANT : Vous avez mentionné avoir activé un proxy

Le proxy peut causer plusieurs problèmes :

#### A. Blocage par Proxy d'Entreprise
- Certains proxies d'entreprise bloquent l'exécution d'applications
- Le proxy peut scanner et bloquer les exécutables téléchargés

#### B. Variables d'Environnement Proxy
- Les variables `HTTP_PROXY`, `HTTPS_PROXY` peuvent interférer
- Certains proxies nécessitent une authentification

### Diagnostic Proxy
```powershell
# Vérifier les variables d'environnement proxy
Get-ChildItem Env: | Where-Object { $_.Name -like "*PROXY*" }

# Vérifier les paramètres proxy système
netsh winhttp show proxy

# Vérifier les paramètres proxy Internet Explorer (utilisés par Windows)
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
```

### Solutions Proxy

#### Solution 1 : Désactiver temporairement le proxy pour flyctl
```powershell
# Sauvegarder les variables proxy actuelles
$env:HTTP_PROXY_BACKUP = $env:HTTP_PROXY
$env:HTTPS_PROXY_BACKUP = $env:HTTPS_PROXY
$env:NO_PROXY_BACKUP = $env:NO_PROXY

# Désactiver le proxy temporairement
$env:HTTP_PROXY = ""
$env:HTTPS_PROXY = ""
$env:NO_PROXY = ""

# Exécuter flyctl
& "$env:USERPROFILE\.fly\bin\flyctl.exe" version

# Restaurer le proxy
$env:HTTP_PROXY = $env:HTTP_PROXY_BACKUP
$env:HTTPS_PROXY = $env:HTTPS_PROXY_BACKUP
$env:NO_PROXY = $env:NO_PROXY_BACKUP
```

#### Solution 2 : Configurer flyctl pour utiliser le proxy
```powershell
# Si votre proxy nécessite une authentification
$env:HTTP_PROXY = "http://username:password@proxy-server:port"
$env:HTTPS_PROXY = "http://username:password@proxy-server:port"

# Ou si le proxy est sans authentification
$env:HTTP_PROXY = "http://proxy-server:port"
$env:HTTPS_PROXY = "http://proxy-server:port"
```

#### Solution 3 : Bypass du proxy pour fly.io
```powershell
# Ajouter fly.io aux exceptions de proxy
$env:NO_PROXY = "fly.io,*.fly.dev,$env:NO_PROXY"
```

---

## 4. 🔐 Politique de Groupe (Group Policy)

### Diagnostic
```powershell
# Vérifier les politiques appliquées (nécessite admin)
gpresult /H gpresult.html
# Ouvrir gpresult.html dans un navigateur

# Vérifier spécifiquement les restrictions d'exécution
reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows\Safer\CodeIdentifiers"
```

### Solution
- Contacter l'administrateur système si vous êtes sur un réseau d'entreprise
- Demander une exception pour `flyctl.exe`

---

## 5. 📦 Zone de Sécurité Internet Explorer

### Diagnostic
```powershell
# Vérifier la zone de sécurité du fichier
# Le fichier téléchargé peut être marqué comme "non fiable"
```

### Solution
1. **Clic droit sur `flyctl.exe`** → **Propriétés**
2. En bas, cocher **"Débloquer"** si présent
3. Cliquer **OK**

Ou via PowerShell :
```powershell
Unblock-File -Path "$env:USERPROFILE\.fly\bin\flyctl.exe"
```

---

## 6. 🚫 Antivirus Tiers

### Diagnostic
```powershell
# Vérifier les processus antivirus actifs
Get-Process | Where-Object { $_.ProcessName -like "*antivirus*" -or $_.ProcessName -like "*security*" }
```

### Solution
- Ajouter `flyctl.exe` aux exclusions de l'antivirus
- Vérifier les logs de l'antivirus pour voir s'il bloque

---

## 7. 🔄 Cache de Certificats / Signature

### Diagnostic
```powershell
# Vérifier la signature numérique de flyctl.exe
Get-AuthenticodeSignature "$env:USERPROFILE\.fly\bin\flyctl.exe"
```

### Solution
Si le certificat n'est pas reconnu :
- Réinstaller flyctl depuis le site officiel
- Vérifier que le certificat de l'éditeur est valide

---

## 🔧 Script de Diagnostic Complet

Créez et exécutez ce script pour identifier la cause :

```powershell
# diagnostic-flyctl.ps1
Write-Host "`n🔍 DIAGNOSTIC COMPLET DU BLOCAGE FLYCTL`n" -ForegroundColor Cyan

# 1. Vérifier l'existence du fichier
$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"
Write-Host "1. Vérification du fichier..." -ForegroundColor Yellow
if (Test-Path $flyctlPath) {
    Write-Host "   ✅ Fichier trouvé : $flyctlPath" -ForegroundColor Green
    $fileInfo = Get-Item $flyctlPath
    Write-Host "   📅 Date de modification : $($fileInfo.LastWriteTime)" -ForegroundColor Gray
    Write-Host "   📦 Taille : $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Fichier non trouvé" -ForegroundColor Red
    exit 1
}

# 2. Vérifier le blocage de zone
Write-Host "`n2. Vérification du blocage de zone..." -ForegroundColor Yellow
$zone = (Get-Item $flyctlPath -Stream Zone.Identifier -ErrorAction SilentlyContinue).Value
if ($zone) {
    Write-Host "   ⚠️  Fichier bloqué par zone de sécurité" -ForegroundColor Yellow
    Write-Host "   Solution : Unblock-File -Path '$flyctlPath'" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Fichier non bloqué par zone" -ForegroundColor Green
}

# 3. Vérifier Windows Defender
Write-Host "`n3. Vérification Windows Defender..." -ForegroundColor Yellow
$defender = Get-MpPreference -ErrorAction SilentlyContinue
if ($defender) {
    $exclusions = Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
    if ($exclusions -contains $flyctlPath -or $exclusions -contains "$env:USERPROFILE\.fly\bin") {
        Write-Host "   ✅ flyctl dans les exclusions" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  flyctl PAS dans les exclusions" -ForegroundColor Yellow
        Write-Host "   Solution : Add-MpPreference -ExclusionPath '$flyctlPath'" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠️  Windows Defender non accessible" -ForegroundColor Yellow
}

# 4. Vérifier AppLocker
Write-Host "`n4. Vérification AppLocker..." -ForegroundColor Yellow
try {
    $applocker = Get-AppLockerPolicy -Effective -ErrorAction Stop
    if ($applocker) {
        Write-Host "   ⚠️  AppLocker est actif" -ForegroundColor Yellow
        Write-Host "   Solution : Désactiver temporairement ou ajouter exception (ADMIN requis)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✅ AppLocker non actif ou non accessible" -ForegroundColor Green
}

# 5. Vérifier les variables proxy
Write-Host "`n5. Vérification des variables PROXY..." -ForegroundColor Yellow
$proxyVars = Get-ChildItem Env: | Where-Object { $_.Name -like "*PROXY*" }
if ($proxyVars) {
    Write-Host "   ⚠️  Variables proxy détectées :" -ForegroundColor Yellow
    $proxyVars | ForEach-Object {
        Write-Host "      $($_.Name) = $($_.Value)" -ForegroundColor Gray
    }
    Write-Host "   💡 Le proxy peut interférer avec flyctl" -ForegroundColor Cyan
    Write-Host "   Solution : Désactiver temporairement ou configurer correctement" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Aucune variable proxy détectée" -ForegroundColor Green
}

# 6. Vérifier les paramètres proxy système
Write-Host "`n6. Vérification proxy système..." -ForegroundColor Yellow
$winhttpProxy = netsh winhttp show proxy 2>&1
if ($winhttpProxy -match "Direct access") {
    Write-Host "   ✅ Pas de proxy système configuré" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Proxy système configuré :" -ForegroundColor Yellow
    Write-Host "   $winhttpProxy" -ForegroundColor Gray
}

# 7. Vérifier la signature numérique
Write-Host "`n7. Vérification signature numérique..." -ForegroundColor Yellow
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

# 8. Test d'exécution
Write-Host "`n8. Test d'exécution..." -ForegroundColor Yellow
try {
    $result = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ flyctl s'exécute correctement !" -ForegroundColor Green
        Write-Host "   $result" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Erreur d'exécution :" -ForegroundColor Red
        Write-Host "   $result" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Impossible d'exécuter flyctl :" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Diagnostic terminé`n" -ForegroundColor Cyan
```

---

## 🎯 Solutions Prioritaires selon votre Cas

### Si vous avez un PROXY activé :

1. **Désactiver temporairement le proxy pour tester** :
   ```powershell
   $env:HTTP_PROXY = ""
   $env:HTTPS_PROXY = ""
   & "$env:USERPROFILE\.fly\bin\flyctl.exe" version
   ```

2. **Si ça fonctionne sans proxy**, configurez flyctl pour utiliser votre proxy :
   ```powershell
   # Dans votre profil PowerShell ($PROFILE)
   $env:HTTP_PROXY = "http://votre-proxy:port"
   $env:HTTPS_PROXY = "http://votre-proxy:port"
   ```

3. **Ajouter fly.io aux exceptions** :
   ```powershell
   $env:NO_PROXY = "fly.io,*.fly.dev,localhost,127.0.0.1"
   ```

### Actions Immédiates :

1. **Exécuter le script de diagnostic** ci-dessus
2. **Débloquer le fichier** :
   ```powershell
   Unblock-File -Path "$env:USERPROFILE\.fly\bin\flyctl.exe"
   ```
3. **Ajouter aux exclusions Windows Defender** :
   ```powershell
   Add-MpPreference -ExclusionPath "$env:USERPROFILE\.fly\bin"
   ```
4. **Tester avec proxy désactivé** pour isoler le problème

---

## 📞 Prochaines Étapes

1. Exécutez le script de diagnostic
2. Partagez les résultats pour identifier la cause exacte
3. Appliquez la solution appropriée selon le diagnostic
