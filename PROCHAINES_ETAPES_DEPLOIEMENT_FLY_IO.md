# 🚀 Prochaines Étapes - Déploiement Fly.io

## ✅ Étape 1 : Secrets Configurés

Tous les secrets sont maintenant configurés sur Fly.io pour l'application `supfile`.

**Secrets configurés (14/14) :**
- ✅ NODE_ENV, PORT, MONGO_URI
- ✅ FRONTEND_URL, CORS_ORIGIN
- ✅ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
- ✅ GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI
- ✅ JWT_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET

---

## 📋 Étape 2 : Créer le fichier fly.toml

Avant de déployer, vous devez créer un fichier `fly.toml` dans le dossier `backend/`.

### Option A : Utiliser `flyctl launch` (Recommandé)

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
flyctl launch
```

**Répondez aux questions :**
- App name: `supfile` (ou appuyez sur Entrée)
- Region: Choisissez la région la plus proche (ex: `cdg` pour Paris)
- Database: `n` (non, vous utilisez MongoDB Atlas)
- Redis: `n` (non)
- Postgres: `n` (non)

### Option B : Créer manuellement `fly.toml`

Créez le fichier `backend/fly.toml` :

```toml
app = "supfile"
primary_region = "cdg"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  NODE_ENV = "production"
  PORT = "5000"

[[services]]
  internal_port = 5000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/health"
```

---

## 🚀 Étape 3 : Déployer l'Application

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
flyctl deploy
```

**Note :** Le premier déploiement peut prendre plusieurs minutes.

---

## 🔗 Étape 4 : Récupérer l'URL de l'Application

Après le déploiement, récupérez l'URL de votre application :

```powershell
flyctl status
```

Ou vérifiez dans le dashboard Fly.io : https://fly.io/dashboard

L'URL sera probablement : `https://supfile.fly.dev` ou `https://supfile-xxxxx.fly.dev`

---

## 🔧 Étape 5 : Mettre à Jour les Redirect URIs OAuth

Une fois que vous avez l'URL réelle de votre application Fly.io, mettez à jour les Redirect URIs dans :

### Google Cloud Console

1. Allez sur https://console.cloud.google.com/apis/credentials
2. Sélectionnez votre OAuth 2.0 Client ID
3. Dans "Authorized redirect URIs", ajoutez :
   ```
   https://[VOTRE-APP].fly.dev/api/auth/google/callback
   ```
4. Cliquez sur "Save"

### GitHub Developer Settings

1. Allez sur https://github.com/settings/developers
2. Sélectionnez votre OAuth App
3. Dans "Authorization callback URL", mettez à jour avec :
   ```
   https://[VOTRE-APP].fly.dev/api/auth/github/callback
   ```
4. Cliquez sur "Update application"

### Mettre à Jour les Secrets sur Fly.io

Après avoir mis à jour les Redirect URIs, mettez à jour les secrets sur Fly.io :

```powershell
flyctl secrets set --app supfile GOOGLE_REDIRECT_URI="https://[VOTRE-APP].fly.dev/api/auth/google/callback"
flyctl secrets set --app supfile GITHUB_REDIRECT_URI="https://[VOTRE-APP].fly.dev/api/auth/github/callback"
```

---

## 🌐 Étape 6 : Mettre à Jour Netlify (Frontend)

1. Allez sur https://app.netlify.com
2. Sélectionnez votre site
3. **Site settings** → **Environment variables**
4. Mettez à jour `VITE_API_URL` avec l'URL de votre API Fly.io :
   ```
   https://[VOTRE-APP].fly.dev
   ```
5. **Trigger deploy** → **Deploy site** pour redéployer avec la nouvelle URL

---

## 📱 Étape 7 : Mettre à Jour l'Application Mobile

Mettez à jour `mobile-app/lib/utils/constants.dart` :

```dart
static const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://[VOTRE-APP].fly.dev', // Remplacez par votre URL Fly.io
);
```

Puis reconstruisez l'APK :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app
flutter build apk --release
```

---

## ✅ Étape 8 : Vérifier le Déploiement

### Tester l'API

```powershell
# Tester l'endpoint health
curl https://[VOTRE-APP].fly.dev/health

# Devrait retourner :
# {"status":"ok","timestamp":"...","uptime":...}
```

### Vérifier les Logs

```powershell
flyctl logs --app supfile
```

---

## 🔍 Étape 9 : Générer de Nouveaux Secrets JWT pour la Production

⚠️ **IMPORTANT** : Les secrets JWT actuels sont des valeurs de développement.

Pour la production, générez de nouveaux secrets :

```powershell
# Générer JWT_SECRET
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "JWT_SECRET: $jwtSecret"

# Générer JWT_REFRESH_SECRET
$jwtRefresh = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "JWT_REFRESH_SECRET: $jwtRefresh"

# Générer SESSION_SECRET
$sessionSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "SESSION_SECRET: $sessionSecret"
```

Puis mettez à jour sur Fly.io :

```powershell
flyctl secrets set --app supfile JWT_SECRET="$jwtSecret"
flyctl secrets set --app supfile JWT_REFRESH_SECRET="$jwtRefresh"
flyctl secrets set --app supfile SESSION_SECRET="$sessionSecret"
```

---

## 📝 Checklist Finale

- [ ] Créer `fly.toml` (via `flyctl launch` ou manuellement)
- [ ] Déployer avec `flyctl deploy`
- [ ] Récupérer l'URL réelle de l'application
- [ ] Mettre à jour les Redirect URIs dans Google Cloud Console
- [ ] Mettre à jour les Redirect URIs dans GitHub Developer Settings
- [ ] Mettre à jour `GOOGLE_REDIRECT_URI` et `GITHUB_REDIRECT_URI` sur Fly.io
- [ ] Mettre à jour `VITE_API_URL` sur Netlify
- [ ] Redéployer le frontend sur Netlify
- [ ] Mettre à jour `API_URL` dans l'application mobile
- [ ] Reconstruire l'APK mobile
- [ ] Tester l'API : `curl https://[VOTRE-APP].fly.dev/health`
- [ ] Générer de nouveaux secrets JWT pour la production

---

## 🎯 Commandes Rapides

```powershell
# Créer fly.toml
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
flyctl launch

# Déployer
flyctl deploy

# Vérifier le statut
flyctl status

# Voir les logs
flyctl logs --app supfile

# Lister les secrets
flyctl secrets list --app supfile

# Mettre à jour un secret
flyctl secrets set --app supfile GOOGLE_REDIRECT_URI="https://supfile.fly.dev/api/auth/google/callback"
```

---

## 🆘 En Cas de Problème

### L'application ne démarre pas

```powershell
# Voir les logs
flyctl logs --app supfile

# Vérifier les secrets
flyctl secrets list --app supfile
```

### Erreur de connexion MongoDB

Vérifiez que `MONGO_URI` est correctement configuré :
```powershell
flyctl secrets list --app supfile | Select-String MONGO_URI
```

### Erreur OAuth

Vérifiez que les Redirect URIs dans Google/GitHub correspondent exactement à ceux configurés sur Fly.io.

---

## ✅ Résumé

1. ✅ **Secrets configurés** (14/14)
2. ⏭️ **Créer fly.toml** (`flyctl launch`)
3. ⏭️ **Déployer** (`flyctl deploy`)
4. ⏭️ **Mettre à jour les Redirect URIs OAuth**
5. ⏭️ **Mettre à jour Netlify et Mobile**

Une fois ces étapes terminées, votre application sera complètement déployée ! 🎉
