# ✅ Déploiement Réussi sur Fly.io !

## 🎉 Statut : Application Déployée

**URL de l'application** : https://supfile.fly.dev/

**Nom de l'application** : `supfile`

---

## ⚠️ Point Important : Secrets

Les secrets ont été configurés sur `backend-sparkling-sun-1539`, mais l'application déployée s'appelle maintenant `supfile` (grâce à la correction du `fly.toml`).

**Action requise** : Vérifier si les secrets sont bien utilisés par `supfile`, ou les copier si nécessaire.

### Option 1 : Vérifier les Secrets de `supfile`

```powershell
flyctl secrets list --app supfile
```

Si la liste est vide ou incomplète, copiez les secrets depuis `backend-sparkling-sun-1539` :

```powershell
# Lister les secrets de backend-sparkling-sun-1539
flyctl secrets list --app backend-sparkling-sun-1539

# Pour chaque secret, le copier vers supfile
# (Vous devrez les lire depuis votre fichier .env et les configurer)
```

### Option 2 : Utiliser le Script de Configuration

Le script `configurer-secrets-simple.ps1` peut être utilisé pour configurer les secrets sur `supfile` :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\configurer-secrets-simple.ps1
# Quand on vous demande le nom de l'application, entrez : supfile
```

---

## 🧪 Tester l'API

```powershell
# Tester l'endpoint health
curl https://supfile.fly.dev/health

# Devrait retourner :
# {"status":"ok","timestamp":"...","uptime":...}
```

Si l'API ne répond pas ou retourne une erreur, vérifiez les logs :

```powershell
flyctl logs --app supfile
```

---

## 🔧 Mettre à Jour les Redirect URIs OAuth

Une fois que vous avez confirmé que l'API fonctionne, mettez à jour les Redirect URIs avec la nouvelle URL :

### Google Cloud Console

1. Allez sur https://console.cloud.google.com/apis/credentials
2. Sélectionnez votre OAuth 2.0 Client ID
3. Dans "Authorized redirect URIs", ajoutez :
   ```
   https://supfile.fly.dev/api/auth/google/callback
   ```
4. Cliquez sur "Save"

### GitHub Developer Settings

1. Allez sur https://github.com/settings/developers
2. Sélectionnez votre OAuth App
3. Dans "Authorization callback URL", mettez à jour avec :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```
4. Cliquez sur "Update application"

### Mettre à Jour les Secrets sur Fly.io

```powershell
flyctl secrets set --app supfile GOOGLE_REDIRECT_URI="https://supfile.fly.dev/api/auth/google/callback"
flyctl secrets set --app supfile GITHUB_REDIRECT_URI="https://supfile.fly.dev/api/auth/github/callback"
```

---

## 🌐 Mettre à Jour Netlify (Frontend)

1. Allez sur https://app.netlify.com
2. Sélectionnez votre site
3. **Site settings** → **Environment variables**
4. Mettez à jour `VITE_API_URL` avec :
   ```
   https://supfile.fly.dev
   ```
5. **Trigger deploy** → **Deploy site** pour redéployer avec la nouvelle URL

---

## 📱 Mettre à Jour l'Application Mobile

Mettez à jour `mobile-app/lib/utils/constants.dart` :

```dart
static const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://supfile.fly.dev',
);
```

Puis reconstruisez l'APK :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app
flutter build apk --release
```

---

## ⚠️ Note sur l'Avertissement

L'avertissement "The app is not listening on the expected address" peut apparaître, mais c'est normal si :
- Le serveur écoute sur `0.0.0.0:5000` (déjà configuré dans `config.js`)
- Le `fly.toml` a `internal_port = 5000`

Si l'application ne répond pas, vérifiez les logs :

```powershell
flyctl logs --app supfile
```

---

## ✅ Checklist

- [x] Application déployée sur Fly.io
- [x] URL : https://supfile.fly.dev/
- [ ] Vérifier/copier les secrets vers `supfile`
- [ ] Tester l'API (`/health`)
- [ ] Vérifier les logs (si nécessaire)
- [ ] Mettre à jour les Redirect URIs OAuth (Google et GitHub)
- [ ] Mettre à jour les secrets `GOOGLE_REDIRECT_URI` et `GITHUB_REDIRECT_URI` sur Fly.io
- [ ] Mettre à jour `VITE_API_URL` sur Netlify
- [ ] Redéployer le frontend sur Netlify
- [ ] Mettre à jour `API_URL` dans l'application mobile
- [ ] Reconstruire l'APK mobile

---

## 🎯 Actions Immédiates

1. **Vérifier les secrets** :
   ```powershell
   flyctl secrets list --app supfile
   ```

2. **Tester l'API** :
   ```powershell
   curl https://supfile.fly.dev/health
   ```

3. **Si les secrets manquent, les configurer** :
   ```powershell
   cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
   .\configurer-secrets-simple.ps1
   # Entrez : supfile
   ```

Une fois que l'API fonctionne, suivez les étapes ci-dessus pour finaliser la configuration ! 🚀
