# 🔧 Résolution Complète des Problèmes OAuth

## 📋 Résumé des Problèmes

1. **Google OAuth** : `Erreur 401: deleted_client` - Le Client ID a été supprimé
2. **GitHub OAuth** : `redirect_uri is not associated` - Le Redirect URI n'est pas configuré

---

## ✅ Solutions Rapides

### 1. Google OAuth - Créer un Nouveau Client ID

**Guide complet** : Voir `CORRECTION_OAUTH_GOOGLE.md`

**Actions rapides** :
1. Allez sur : https://console.cloud.google.com/apis/credentials
2. Créez un nouveau "OAuth client ID" (type "Web application")
3. Configurez :
   - **Redirect URI** : `https://supfile.fly.dev/api/auth/google/callback`
   - **JavaScript origins** : `https://supfile.fly.dev` et `https://flourishing-banoffee-c0b1ad.netlify.app`
4. Copiez le **Client ID** et **Client Secret**
5. Mettez à jour sur Fly.io :
   ```powershell
   cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
   flyctl secrets set GOOGLE_CLIENT_ID="VOTRE_CLIENT_ID" --app supfile
   flyctl secrets set GOOGLE_CLIENT_SECRET="VOTRE_CLIENT_SECRET" --app supfile
   flyctl deploy --app supfile
   ```

### 2. GitHub OAuth - Configurer le Redirect URI

**Guide complet** : Voir `CORRECTION_OAUTH_GITHUB.md`

**Actions rapides** :
1. Allez sur : https://github.com/settings/developers/oauth-apps
2. Cliquez sur votre application OAuth (Client ID : `Ov23ligHjSi2qTjUNtCc`)
3. Mettez à jour :
   - **Authorization callback URL** : `https://supfile.fly.dev/api/auth/github/callback`
   - **Homepage URL** : `https://flourishing-banoffee-c0b1ad.netlify.app`
4. Cliquez sur "Update application"

---

## 🔄 Ordre d'Exécution Recommandé

### Étape 1 : Corriger GitHub OAuth (Plus Rapide)

1. ✅ Configurer le Redirect URI dans GitHub
2. ✅ Tester la connexion GitHub

**Temps estimé** : 2-3 minutes

### Étape 2 : Corriger Google OAuth (Plus Long)

1. ✅ Créer un nouveau Client ID dans Google Cloud Console
2. ✅ Configurer les Redirect URIs et JavaScript origins
3. ✅ Copier le Client ID et Client Secret
4. ✅ Mettre à jour les secrets sur Fly.io
5. ✅ Redéployer le backend
6. ✅ Tester la connexion Google

**Temps estimé** : 5-10 minutes

---

## 📋 Checklist Complète

### Google OAuth
- [ ] Nouveau Client ID créé dans Google Cloud Console
- [ ] Redirect URI configuré : `https://supfile.fly.dev/api/auth/google/callback`
- [ ] JavaScript origins configurés
- [ ] Client ID et Client Secret copiés
- [ ] Secrets mis à jour sur Fly.io
- [ ] Backend redéployé
- [ ] Test de connexion Google réussi

### GitHub OAuth
- [ ] Accédé à GitHub Developer Settings → OAuth Apps
- [ ] Trouvé l'application OAuth
- [ ] Redirect URI mis à jour : `https://supfile.fly.dev/api/auth/github/callback`
- [ ] Homepage URL mis à jour : `https://flourishing-banoffee-c0b1ad.netlify.app`
- [ ] Application sauvegardée
- [ ] Test de connexion GitHub réussi

---

## 🧪 Tests de Vérification

### Test 1 : GitHub OAuth

1. **Allez sur** votre site Netlify
2. **Cliquez sur** "Se connecter avec GitHub"
3. **Autorisez** l'application sur GitHub
4. **Vérifiez** que vous êtes connecté

### Test 2 : Google OAuth

1. **Allez sur** votre site Netlify
2. **Cliquez sur** "Se connecter avec Google"
3. **Sélectionnez** votre compte Google
4. **Autorisez** l'application
5. **Vérifiez** que vous êtes connecté

---

## 🆘 En Cas de Problème

### Google OAuth ne fonctionne toujours pas

1. **Vérifiez** que les secrets sont bien configurés :
   ```powershell
   flyctl secrets list --app supfile | Select-String "GOOGLE"
   ```

2. **Vérifiez** les logs du backend :
   ```powershell
   flyctl logs --app supfile
   ```

3. **Vérifiez** que le Redirect URI dans Google Cloud Console est exactement :
   ```
   https://supfile.fly.dev/api/auth/google/callback
   ```

### GitHub OAuth ne fonctionne toujours pas

1. **Vérifiez** que le Redirect URI dans GitHub est exactement :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```

2. **Vérifiez** que le secret `GITHUB_REDIRECT_URI` sur Fly.io est correct :
   ```powershell
   flyctl secrets list --app supfile | Select-String "GITHUB"
   ```

3. **Redéployez** le backend si nécessaire :
   ```powershell
   flyctl deploy --app supfile
   ```

---

## 📚 Guides Détaillés

- **Google OAuth** : `CORRECTION_OAUTH_GOOGLE.md`
- **GitHub OAuth** : `CORRECTION_OAUTH_GITHUB.md`

---

## 🎯 URLs Exactes à Utiliser

### Google OAuth
- **Redirect URI** : `https://supfile.fly.dev/api/auth/google/callback`
- **JavaScript Origins** :
  - `https://supfile.fly.dev`
  - `https://flourishing-banoffee-c0b1ad.netlify.app`

### GitHub OAuth
- **Authorization callback URL** : `https://supfile.fly.dev/api/auth/github/callback`
- **Homepage URL** : `https://flourishing-banoffee-c0b1ad.netlify.app`

⚠️ **Important** : Copiez-collez exactement ces URLs, sans modification, sans slash à la fin.

---

Une fois ces corrections appliquées, les connexions OAuth (Google et GitHub) devraient fonctionner correctement ! 🚀
