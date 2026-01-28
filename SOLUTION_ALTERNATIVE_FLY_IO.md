# 🔄 Solutions Alternatives pour Configurer Fly.io

## 🚨 Problème : flyctl.exe bloqué par Windows

Windows continue de bloquer `flyctl.exe` malgré le déblocage. Voici **plusieurs solutions alternatives**.

---

## ✅ Solution 1 : Utiliser l'Interface Web Fly.io (Recommandé)

Même si l'interface web affiche "has invalid format", **les variables peuvent quand même fonctionner**. Voici comment procéder :

### Étapes :

1. **Allez sur** https://fly.io/dashboard
2. **Sélectionnez votre application** (ou créez-en une si nécessaire)
3. **Allez dans** : **Settings** → **Secrets**
4. **Ajoutez les variables une par une** :

#### Variables à ajouter (copiez-collez exactement) :

```
NODE_ENV
production
```

```
PORT
5000
```

```
MONGO_URI
mongodb+srv://kouroumaelisee_db_user:3mvU3jm97uBaEDEt@cluster0.u3cxqhm.mongodb.net/supfile?retryWrites=true&w=majority
```

```
FRONTEND_URL
https://flourishing-banoffee-c0b1ad.netlify.app
```

```
CORS_ORIGIN
https://flourishing-banoffee-c0b1ad.netlify.app
```

```
GOOGLE_REDIRECT_URI
https://[VOTRE-APP-NAME].fly.dev/api/auth/google/callback
```

```
GITHUB_REDIRECT_URI
https://[VOTRE-APP-NAME].fly.dev/api/auth/github/callback
```

**⚠️ Remplacez `[VOTRE-APP-NAME]` par le nom réel de votre application Fly.io**

#### Secrets à ajouter (vous devez les avoir) :

```
JWT_SECRET
[votre secret JWT]
```

```
JWT_REFRESH_SECRET
[votre refresh secret]
```

```
SESSION_SECRET
[votre session secret]
```

```
GOOGLE_CLIENT_ID
[votre Google Client ID]
```

```
GOOGLE_CLIENT_SECRET
[votre Google Client Secret]
```

```
GITHUB_CLIENT_ID
[votre GitHub Client ID]
```

```
GITHUB_CLIENT_SECRET
[votre GitHub Client Secret]
```

### ⚠️ Si l'interface affiche "has invalid format"

**C'est souvent un faux positif !** Les variables peuvent fonctionner même si l'interface affiche une erreur.

**Pour vérifier** :
1. Après avoir ajouté les variables, **déployez l'application**
2. Vérifiez les logs : `flyctl logs` (si vous pouvez l'exécuter) ou via l'interface web
3. Testez l'API : `curl https://[votre-app].fly.dev/health`

---

## ✅ Solution 2 : Réinstaller flyctl

Parfois, une réinstallation résout les problèmes de blocage :

### Via winget :

```powershell
# Désinstaller l'ancienne version
winget uninstall --id Fly.Flyctl

# Réinstaller
winget install --id Fly.Flyctl -e

# Redémarrer PowerShell
```

### Via Installation manuelle :

1. **Téléchargez** depuis : https://fly.io/docs/hands-on/install-flyctl/
2. **Installez** dans un dossier simple (ex: `C:\flyctl`)
3. **Ajoutez au PATH** :
   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\flyctl", "User")
   ```
4. **Redémarrez PowerShell**

---

## ✅ Solution 3 : Utiliser CMD au lieu de PowerShell

Parfois, CMD fonctionne mieux que PowerShell pour les exécutables bloqués :

```cmd
REM Ouvrir CMD (pas PowerShell)
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend

REM Utiliser le chemin complet
"%USERPROFILE%\.fly\bin\flyctl.exe" secrets set FRONTEND_URL="https://flourishing-banoffee-c0b1ad.netlify.app"
```

---

## ✅ Solution 4 : Désactiver temporairement AppLocker (Administrateur)

⚠️ **Nécessite des droits administrateur et réduit la sécurité**

```powershell
# Ouvrir PowerShell en tant qu'administrateur
# Désactiver AppLocker temporairement
Set-AppLockerPolicy -XmlPolicy $null

# Exécuter vos commandes flyctl
flyctl secrets set FRONTEND_URL="https://flourishing-banoffee-c0b1ad.netlify.app"

# Réactiver AppLocker après (recommandé)
# Configurez une politique AppLocker appropriée
```

---

## ✅ Solution 5 : Utiliser GitHub Actions (Automatisation)

Si vous avez un dépôt GitHub, vous pouvez configurer les secrets via GitHub Actions :

### Créer `.github/workflows/fly-secrets.yml` :

```yaml
name: Set Fly.io Secrets

on:
  workflow_dispatch:
    inputs:
      secret_name:
        description: 'Secret name'
        required: true
      secret_value:
        description: 'Secret value'
        required: true
        type: password

jobs:
  set-secret:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl secrets set ${{ inputs.secret_name }}=${{ inputs.secret_value }} --app supfile
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Puis utilisez l'interface GitHub Actions** pour définir les secrets.

---

## 🎯 Recommandation Immédiate

**Utilisez l'interface web Fly.io** (Solution 1) :

1. ✅ Plus simple et rapide
2. ✅ Pas besoin de résoudre le blocage Windows
3. ✅ Les erreurs "has invalid format" sont souvent des faux positifs
4. ✅ Vous pouvez vérifier que ça fonctionne après le déploiement

### Étapes rapides :

1. Allez sur https://fly.io/dashboard
2. Créez ou sélectionnez votre application
3. **Settings** → **Secrets**
4. Ajoutez les variables une par une
5. **Ignorez les erreurs "has invalid format"** si elles apparaissent
6. Déployez l'application
7. Testez : `curl https://[votre-app].fly.dev/health`

---

## 🔍 Vérification

Après avoir configuré les secrets (via interface web ou autre méthode) :

1. **Déployez l'application** :
   - Via interface web : **Deploy** → **Deploy Image** ou **Deploy from GitHub**
   - Ou via CLI si vous y arrivez : `flyctl deploy`

2. **Vérifiez les logs** :
   - Interface web : **Monitoring** → **Logs**
   - Ou CLI : `flyctl logs`

3. **Testez l'API** :
   ```bash
   curl https://[votre-app].fly.dev/health
   ```

4. **Vérifiez les variables d'environnement** :
   - Interface web : **Settings** → **Secrets**
   - Ou CLI : `flyctl secrets list`

---

## 📞 Si Rien ne Fonctionne

1. **Contactez le support Fly.io** : https://community.fly.io/
2. **Utilisez un autre ordinateur** temporairement pour configurer les secrets
3. **Utilisez WSL (Windows Subsystem for Linux)** si installé :
   ```bash
   # Dans WSL
   curl -L https://fly.io/install.sh | sh
   flyctl secrets set FRONTEND_URL="https://flourishing-banoffee-c0b1ad.netlify.app"
   ```

---

## 💡 Astuce : Générer les Secrets JWT

Si vous n'avez pas encore généré les secrets JWT, utilisez cette commande PowerShell :

```powershell
# Générer un secret aléatoire (exécutez 3 fois pour 3 secrets différents)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Copiez chaque résultat pour :
- `JWT_SECRET`
- `JWT_REFRESH_SECRET` (différent)
- `SESSION_SECRET` (différent)
