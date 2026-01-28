# 🔧 Correction du Déploiement Fly.io

## ✅ Problèmes Identifiés

1. **Nom d'application incorrect** : L'application a été créée avec le nom `backend-sparkling-sun-1539` au lieu de `supfile`
2. **Secrets non liés** : Les secrets sont configurés pour `supfile`, mais l'application déployée est `backend-sparkling-sun-1539`
3. **URL différente** : L'URL est `https://backend-sparkling-sun-1539.fly.dev/` au lieu de `https://supfile.fly.dev/`

## ✅ Corrections Appliquées

1. ✅ **fly.toml corrigé** : Le nom de l'application est maintenant `supfile`

## 📋 Solutions Possibles

### Option A : Copier les Secrets (Recommandé)

Copier les secrets de `supfile` vers `backend-sparkling-sun-1539` :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\copier-secrets-vers-nouvelle-app.ps1
```

Puis redéployer :

```powershell
flyctl deploy
```

### Option B : Supprimer et Recréer avec le Bon Nom

Si vous préférez utiliser le nom `supfile` :

1. **Supprimer l'application actuelle** :
   ```powershell
   flyctl apps destroy backend-sparkling-sun-1539
   ```

2. **Créer une nouvelle application avec le nom `supfile`** :
   ```powershell
   flyctl apps create supfile
   ```

3. **Redéployer** :
   ```powershell
   flyctl deploy
   ```

   Les secrets sont déjà configurés pour `supfile`, donc ils seront automatiquement utilisés.

## 🎯 Solution Recommandée : Option A

L'Option A est plus simple et préserve l'historique de déploiement. Voici les étapes :

### 1. Configurer les Secrets

Le script lit les secrets depuis votre fichier `.env` local et les configure sur `backend-sparkling-sun-1539` :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\copier-secrets-vers-nouvelle-app.ps1
```

**Note** : Le script configure automatiquement les Redirect URIs avec l'URL `https://backend-sparkling-sun-1539.fly.dev`.

### 2. Redéployer

```powershell
flyctl deploy
```

### 3. Vérifier le Déploiement

```powershell
# Vérifier le statut
flyctl status

# Tester l'endpoint health
curl https://backend-sparkling-sun-1539.fly.dev/health
```

### 4. Mettre à Jour les Redirect URIs OAuth

Une fois que vous avez confirmé que l'application fonctionne, mettez à jour les Redirect URIs :

#### Google Cloud Console

1. Allez sur https://console.cloud.google.com/apis/credentials
2. Sélectionnez votre OAuth 2.0 Client ID
3. Dans "Authorized redirect URIs", ajoutez :
   ```
   https://backend-sparkling-sun-1539.fly.dev/api/auth/google/callback
   ```
4. Cliquez sur "Save"

#### GitHub Developer Settings

1. Allez sur https://github.com/settings/developers
2. Sélectionnez votre OAuth App
3. Dans "Authorization callback URL", mettez à jour avec :
   ```
   https://backend-sparkling-sun-1539.fly.dev/api/auth/github/callback
   ```
4. Cliquez sur "Update application"

#### Mettre à Jour les Secrets sur Fly.io

```powershell
flyctl secrets set --app backend-sparkling-sun-1539 GOOGLE_REDIRECT_URI="https://backend-sparkling-sun-1539.fly.dev/api/auth/google/callback"
flyctl secrets set --app backend-sparkling-sun-1539 GITHUB_REDIRECT_URI="https://backend-sparkling-sun-1539.fly.dev/api/auth/github/callback"
```

### 5. Mettre à Jour Netlify

1. Allez sur https://app.netlify.com
2. Sélectionnez votre site
3. **Site settings** → **Environment variables**
4. Mettez à jour `VITE_API_URL` avec :
   ```
   https://backend-sparkling-sun-1539.fly.dev
   ```
5. **Trigger deploy** → **Deploy site**

### 6. Mettre à Jour l'Application Mobile

Mettez à jour `mobile-app/lib/utils/constants.dart` :

```dart
static const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://backend-sparkling-sun-1539.fly.dev',
);
```

Puis reconstruisez l'APK :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app
flutter build apk --release
```

## ⚠️ Note sur l'Écoute du Serveur

L'avertissement "The app is not listening on the expected address" peut apparaître, mais c'est normal si :
- Le serveur écoute sur `0.0.0.0:5000` (déjà configuré dans `config.js`)
- Le `fly.toml` a `internal_port = 5000`

Si l'application ne répond pas, vérifiez les logs :

```powershell
flyctl logs --app backend-sparkling-sun-1539
```

## 🔍 Vérification Finale

```powershell
# Vérifier le statut
flyctl status

# Vérifier les secrets
flyctl secrets list --app backend-sparkling-sun-1539

# Tester l'API
curl https://backend-sparkling-sun-1539.fly.dev/health

# Devrait retourner :
# {"status":"ok","timestamp":"...","uptime":...}
```

## ✅ Checklist

- [x] Corriger `fly.toml` (nom de l'application)
- [ ] Copier les secrets vers `backend-sparkling-sun-1539`
- [ ] Redéployer l'application
- [ ] Vérifier que l'API répond (`/health`)
- [ ] Mettre à jour les Redirect URIs OAuth (Google et GitHub)
- [ ] Mettre à jour les secrets `GOOGLE_REDIRECT_URI` et `GITHUB_REDIRECT_URI` sur Fly.io
- [ ] Mettre à jour `VITE_API_URL` sur Netlify
- [ ] Redéployer le frontend sur Netlify
- [ ] Mettre à jour `API_URL` dans l'application mobile
- [ ] Reconstruire l'APK mobile

---

## 🎯 Prochaines Actions Immédiates

1. **Exécuter le script de copie des secrets** :
   ```powershell
   cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
   .\copier-secrets-vers-nouvelle-app.ps1
   ```

2. **Redéployer** :
   ```powershell
   flyctl deploy
   ```

3. **Tester** :
   ```powershell
   curl https://backend-sparkling-sun-1539.fly.dev/health
   ```

Une fois que l'API fonctionne, suivez les étapes 4-6 ci-dessus pour finaliser la configuration ! 🚀
