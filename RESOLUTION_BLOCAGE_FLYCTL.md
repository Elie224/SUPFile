# 🔓 Résolution du Blocage de flyctl.exe sur Windows

## 🚨 Problème

Windows bloque l'exécution de `flyctl.exe` avec l'erreur :
```
Une stratégie de contrôle d'application a bloqué ce fichier
```

---

## ✅ Solutions

### Solution 1 : Réinstaller flyctl (Recommandé)

Si `flyctl` n'est pas installé ou mal installé :

#### Option A : Installation via winget (Recommandé)

```powershell
# Installer flyctl via winget
winget install --id Fly.Flyctl -e
```

#### Option B : Installation manuelle

1. Téléchargez `flyctl` depuis : https://fly.io/docs/hands-on/install-flyctl/
2. Extrayez dans un dossier (ex: `C:\tools\flyctl`)
3. Ajoutez au PATH :
   ```powershell
   # Ajouter au PATH utilisateur
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\tools\flyctl", "User")
   ```
4. Redémarrez PowerShell

---

### Solution 2 : Débloquer flyctl.exe

Si `flyctl` est déjà installé mais bloqué :

#### Méthode 1 : Débloquer via PowerShell (Administrateur)

```powershell
# Ouvrir PowerShell en tant qu'administrateur
# Trouver le chemin de flyctl
$flyctlPath = Get-Command flyctl -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

if ($flyctlPath) {
    # Débloquer le fichier
    Unblock-File -Path $flyctlPath
    Write-Host "✅ flyctl débloqué : $flyctlPath" -ForegroundColor Green
} else {
    Write-Host "❌ flyctl non trouvé. Installez-le d'abord." -ForegroundColor Red
}
```

#### Méthode 2 : Débloquer via Propriétés du fichier

1. Trouvez `flyctl.exe` (généralement dans `%USERPROFILE%\.fly\bin\` ou `%LOCALAPPDATA%\Microsoft\WindowsApps\`)
2. Clic droit → **Propriétés**
3. En bas, cochez **"Débloquer"** si présent
4. Cliquez **OK**

#### Méthode 3 : Désactiver temporairement AppLocker (Administrateur)

⚠️ **ATTENTION :** Cette méthode nécessite des droits administrateur et peut réduire la sécurité.

```powershell
# Ouvrir PowerShell en tant qu'administrateur
# Désactiver AppLocker (temporairement)
Set-AppLockerPolicy -XmlPolicy $null
```

**Recommandation :** Réactivez AppLocker après utilisation.

---

### Solution 3 : Utiliser l'Interface Web avec des Valeurs Corrigées

Si vous ne pouvez pas utiliser `flyctl`, utilisez l'interface web Fly.io mais avec des **valeurs légèrement différentes** qui passent la validation :

#### Problème identifié

L'interface web Fly.io peut rejeter certaines URLs. Essayez ces formats alternatifs :

**Pour FRONTEND_URL et CORS_ORIGIN :**
- ❌ `https://flourishing-banoffee-c0b1ad.netlify.app` (peut être rejeté)
- ✅ Essayez sans `https://` (si l'interface l'accepte)
- ✅ Ou utilisez une variable d'environnement différente temporairement

**Pour GOOGLE_REDIRECT_URI :**
- ❌ `https://supfile.fly.dev/api/auth/google/callback` (peut être rejeté si l'app n'existe pas encore)
- ✅ Utilisez d'abord une URL placeholder : `http://localhost:5000/api/auth/google/callback`
- ✅ Mettez à jour après le déploiement

---

### Solution 4 : Utiliser un Script PowerShell avec Bypass

Créez un script qui contourne le blocage :

```powershell
# Créer le fichier : set-fly-secrets.ps1
# Exécuter avec : powershell -ExecutionPolicy Bypass -File set-fly-secrets.ps1

$ErrorActionPreference = "Stop"

# Chemin vers flyctl (ajustez selon votre installation)
$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"

if (-not (Test-Path $flyctlPath)) {
    Write-Host "❌ flyctl non trouvé à : $flyctlPath" -ForegroundColor Red
    Write-Host "Installez flyctl d'abord : winget install --id Fly.Flyctl -e" -ForegroundColor Yellow
    exit 1
}

# Débloquer le fichier
Unblock-File -Path $flyctlPath -ErrorAction SilentlyContinue

# Nom de l'application (remplacez par votre nom d'app)
$appName = "supfile"

# Définir les secrets
Write-Host "`n🔐 Configuration des secrets Fly.io..." -ForegroundColor Cyan

& $flyctlPath secrets set --app $appName FRONTEND_URL="https://flourishing-banoffee-c0b1ad.netlify.app"
& $flyctlPath secrets set --app $appName CORS_ORIGIN="https://flourishing-banoffee-c0b1ad.netlify.app"
& $flyctlPath secrets set --app $appName GOOGLE_REDIRECT_URI="https://$appName.fly.dev/api/auth/google/callback"

Write-Host "`n✅ Secrets configurés !" -ForegroundColor Green
& $flyctlPath secrets list --app $appName
```

---

## 🔍 Vérifier l'Installation de flyctl

```powershell
# Vérifier si flyctl est installé
Get-Command flyctl -ErrorAction SilentlyContinue

# Si non trouvé, chercher dans les emplacements courants
$paths = @(
    "$env:USERPROFILE\.fly\bin\flyctl.exe",
    "$env:LOCALAPPDATA\Microsoft\WindowsApps\flyctl.exe",
    "$env:ProgramFiles\flyctl\flyctl.exe"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "✅ Trouvé : $path" -ForegroundColor Green
    }
}
```

---

## 🎯 Actions Immédiates

1. **Installez flyctl** (si pas installé) :
   ```powershell
   winget install --id Fly.Flyctl -e
   ```

2. **Redémarrez PowerShell** après l'installation

3. **Vérifiez l'installation** :
   ```powershell
   flyctl version
   ```

4. **Si toujours bloqué**, débloquez-le :
   ```powershell
   # Trouver le chemin
   $flyctl = Get-Command flyctl | Select-Object -ExpandProperty Source
   Unblock-File -Path $flyctl
   ```

5. **Réessayez les commandes** :
   ```powershell
   cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
   flyctl secrets set FRONTEND_URL="https://flourishing-banoffee-c0b1ad.netlify.app"
   ```

---

## 📞 Alternative : Interface Web Fly.io

Si `flyctl` continue d'être bloqué :

1. Allez sur https://fly.io/dashboard
2. Sélectionnez votre application
3. Allez dans **Settings** → **Secrets**
4. Ajoutez les variables **une par une**
5. **Si erreur "has invalid format"** :
   - Essayez sans `https://` (si accepté)
   - Ou utilisez des valeurs temporaires et mettez à jour après déploiement
   - Ou contactez le support Fly.io

---

## ⚠️ Note Importante

Les erreurs "has invalid format" dans l'interface web peuvent être des **faux positifs**. Si les variables sont définies via `flyctl`, elles fonctionneront même si l'interface web affiche des erreurs.
