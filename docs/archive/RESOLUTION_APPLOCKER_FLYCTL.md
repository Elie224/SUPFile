# 🔓 Résolution du Blocage AppLocker / Politique de Groupe

## 🚨 Problème Persistant

Même après avoir désactivé Windows Defender et le proxy, le blocage persiste avec le message :
```
Une stratégie de contrôle d'application a bloqué ce fichier
```

Cela indique que **AppLocker** ou une **politique de groupe** est active.

---

## ✅ Solutions par Ordre de Priorité

### Solution 1 : Débloquer le Fichier Manuellement (Le Plus Simple)

1. **Ouvrez l'Explorateur de fichiers**
2. **Naviguez vers** : `C:\Users\KOURO\.fly\bin\`
3. **Clic droit sur `flyctl.exe`** → **Propriétés**
4. En bas de la fenêtre, **cochez "Débloquer"** si présent
5. Cliquez **OK**

### Solution 2 : Débloquer via PowerShell (Administrateur)

Ouvrez PowerShell **en tant qu'administrateur** et exécutez :

```powershell
# Débloquer le fichier
Unblock-File -Path "$env:USERPROFILE\.fly\bin\flyctl.exe"

# Vérifier que ça fonctionne
& "$env:USERPROFILE\.fly\bin\flyctl.exe" version
```

### Solution 3 : Désactiver AppLocker Temporairement (Administrateur)

⚠️ **Nécessite des droits administrateur**

```powershell
# Ouvrir PowerShell en tant qu'administrateur
# Désactiver AppLocker temporairement
Set-AppLockerPolicy -XmlPolicy $null

# Tester flyctl
& "$env:USERPROFILE\.fly\bin\flyctl.exe" version

# Si ça fonctionne, AppLocker était la cause
```

**⚠️ Important :** Réactivez AppLocker après utilisation si vous êtes sur un réseau d'entreprise.

### Solution 4 : Ajouter une Exception AppLocker (Administrateur)

Si vous ne pouvez pas désactiver AppLocker complètement :

```powershell
# Créer une règle d'exception pour flyctl.exe
# (Nécessite des connaissances en AppLocker)
```

**Alternative :** Contactez votre administrateur système pour ajouter une exception.

### Solution 5 : Utiliser l'Interface Web Fly.io (Recommandé si AppLocker ne peut pas être désactivé)

Si vous ne pouvez pas modifier AppLocker (réseau d'entreprise), utilisez l'interface web :

1. Allez sur https://fly.io/dashboard
2. Sélectionnez votre application
3. **Settings** → **Secrets**
4. Ajoutez les variables d'environnement manuellement

**Les erreurs "has invalid format" sont souvent des faux positifs** - les variables fonctionneront quand même.

---

## 🔧 Script de Résolution Automatique

Créez et exécutez ce script **en tant qu'administrateur** :

```powershell
# resolution-applocker.ps1
# Exécuter avec : powershell -ExecutionPolicy Bypass -File resolution-applocker.ps1

Write-Host "`n🔓 RÉSOLUTION DU BLOCAGE APPLOCKER`n" -ForegroundColor Cyan

$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"

# Vérifier les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Ce script nécessite des droits administrateur" -ForegroundColor Yellow
    Write-Host "   Relancez PowerShell en tant qu'administrateur" -ForegroundColor Yellow
    exit 1
}

# 1. Débloquer le fichier
Write-Host "1. Déblocage du fichier..." -ForegroundColor Yellow
try {
    Unblock-File -Path $flyctlPath -Force
    Write-Host "   ✅ Fichier débloqué" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur : $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Vérifier AppLocker
Write-Host "`n2. Vérification AppLocker..." -ForegroundColor Yellow
try {
    $applocker = Get-AppLockerPolicy -Effective -ErrorAction SilentlyContinue
    if ($applocker) {
        Write-Host "   ⚠️  AppLocker est actif" -ForegroundColor Yellow
        Write-Host "   Tentative de désactivation temporaire..." -ForegroundColor Yellow
        
        try {
            Set-AppLockerPolicy -XmlPolicy $null
            Write-Host "   ✅ AppLocker désactivé temporairement" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Impossible de désactiver AppLocker" -ForegroundColor Red
            Write-Host "   Contactez votre administrateur système" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✅ AppLocker non actif" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✅ AppLocker non accessible ou non actif" -ForegroundColor Green
}

# 3. Test d'exécution
Write-Host "`n3. Test d'exécution..." -ForegroundColor Yellow
try {
    $result = & $flyctlPath version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ flyctl fonctionne maintenant !" -ForegroundColor Green
        Write-Host "   Version : $($result -join ' ')" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Le problème persiste" -ForegroundColor Red
        Write-Host "   Message : $result" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Erreur : $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Résolution terminée`n" -ForegroundColor Green
```

---

## 🎯 Actions Immédiates

### Option A : Si vous avez les droits administrateur

1. **Ouvrez PowerShell en tant qu'administrateur** :
   - Clic droit sur PowerShell → **Exécuter en tant qu'administrateur**

2. **Exécutez ces commandes** :
   ```powershell
   # Débloquer le fichier
   Unblock-File -Path "$env:USERPROFILE\.fly\bin\flyctl.exe" -Force
   
   # Désactiver AppLocker temporairement
   Set-AppLockerPolicy -XmlPolicy $null
   
   # Tester
   & "$env:USERPROFILE\.fly\bin\flyctl.exe" version
   ```

### Option B : Si vous n'avez PAS les droits administrateur

1. **Débloquer manuellement** :
   - Clic droit sur `flyctl.exe` → Propriétés → Cocher "Débloquer"

2. **Utiliser l'interface web Fly.io** :
   - https://fly.io/dashboard
   - Settings → Secrets
   - Ajouter les variables manuellement

### Option C : Contourner avec un Script Wrapper

Créez un script qui copie flyctl dans un autre emplacement :

```powershell
# Créer un dossier local
$localPath = "$PSScriptRoot\flyctl-local"
New-Item -ItemType Directory -Path $localPath -Force | Out-Null

# Copier flyctl
Copy-Item "$env:USERPROFILE\.fly\bin\flyctl.exe" -Destination "$localPath\flyctl.exe" -Force

# Débloquer la copie
Unblock-File -Path "$localPath\flyctl.exe" -Force

# Utiliser la copie locale
& "$localPath\flyctl.exe" version
```

---

## 📋 Checklist de Résolution

- [ ] Débloquer le fichier manuellement (Propriétés → Débloquer)
- [ ] Exécuter PowerShell en tant qu'administrateur
- [ ] Désactiver AppLocker temporairement
- [ ] Tester `flyctl version`
- [ ] Si ça ne fonctionne pas, utiliser l'interface web Fly.io

---

## 💡 Alternative : Utiliser l'Interface Web

Si AppLocker ne peut pas être désactivé (réseau d'entreprise), **utilisez l'interface web Fly.io** :

1. Allez sur https://fly.io/dashboard
2. Créez ou sélectionnez votre application
3. **Settings** → **Secrets**
4. Ajoutez les variables une par une

**Les erreurs "has invalid format" sont souvent des faux positifs** - ignorez-les et déployez l'application. Les variables fonctionneront.

---

## 🔍 Vérification Finale

Après avoir appliqué les solutions, testez :

```powershell
# Test simple
& "$env:USERPROFILE\.fly\bin\flyctl.exe" version

# Si ça fonctionne, configurez les secrets
& "$env:USERPROFILE\.fly\bin\flyctl.exe" secrets set FRONTEND_URL="https://flourishing-banoffee-c0b1ad.netlify.app"
```
