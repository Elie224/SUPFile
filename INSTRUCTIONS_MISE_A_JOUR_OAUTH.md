# 🔑 Instructions pour Mettre à Jour les Secrets OAuth

## ✅ Identifiants Reçus

### Google OAuth
- **Client ID** : `YOUR_GOOGLE_CLIENT_ID`
- **Client Secret** : `YOUR_GOOGLE_CLIENT_SECRET`

### GitHub OAuth
- **Client ID** : `YOUR_GITHUB_CLIENT_ID`
- **Client Secret** : `YOUR_GITHUB_CLIENT_SECRET`

---

## 🚀 Mise à Jour Automatique (Recommandé)

Exécutez le script PowerShell :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\mettre-a-jour-oauth-complet.ps1
```

Le script va :
1. ✅ Mettre à jour `GOOGLE_CLIENT_ID`
2. ✅ Mettre à jour `GOOGLE_CLIENT_SECRET`
3. ✅ Mettre à jour `GITHUB_CLIENT_ID`
4. ✅ Mettre à jour `GITHUB_CLIENT_SECRET`
5. ✅ Redéployer le backend automatiquement

---

## 🔧 Mise à Jour Manuelle

Si le script ne fonctionne pas, exécutez ces commandes une par une :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend

# Google OAuth
flyctl secrets set GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID" --app supfile
flyctl secrets set GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET" --app supfile

# GitHub OAuth
flyctl secrets set GITHUB_CLIENT_ID="YOUR_GITHUB_CLIENT_ID" --app supfile
flyctl secrets set GITHUB_CLIENT_SECRET="YOUR_GITHUB_CLIENT_SECRET" --app supfile

# Redéployer
flyctl deploy --app supfile
```

---

## ✅ Vérification des Redirect URIs

### Google Cloud Console

**Vérifiez que ces URLs sont configurées** :

1. **Allez sur** : https://console.cloud.google.com/apis/credentials
2. **Cliquez sur votre Client ID** : `YOUR_GOOGLE_CLIENT_ID`
3. **Vérifiez** :
   - **Authorized redirect URIs** : `https://supfile.fly.dev/api/auth/google/callback`
   - **Authorized JavaScript origins** :
     - `https://supfile.fly.dev`
     - `https://flourishing-banoffee-c0b1ad.netlify.app`

### GitHub Developer Settings

**Vérifiez que cette URL est configurée** :

1. **Allez sur** : https://github.com/settings/developers/oauth-apps
2. **Cliquez sur votre application OAuth** (Client ID : `YOUR_GITHUB_CLIENT_ID`)
3. **Vérifiez** :
   - **Authorization callback URL** : `https://supfile.fly.dev/api/auth/github/callback`
   - **Homepage URL** : `https://flourishing-banoffee-c0b1ad.netlify.app`

---

## 🧪 Test

Après le redéploiement :

1. **Allez sur** votre site Netlify
2. **Testez la connexion Google** :
   - Cliquez sur "Se connecter avec Google"
   - Vous devriez être redirigé vers Google pour autoriser
   - Après autorisation, vous devriez être connecté
3. **Testez la connexion GitHub** :
   - Cliquez sur "Se connecter avec GitHub"
   - Vous devriez être redirigé vers GitHub pour autoriser
   - Après autorisation, vous devriez être connecté

---

## 📋 Checklist

- [ ] Secrets mis à jour sur Fly.io (Google et GitHub)
- [ ] Backend redéployé
- [ ] Redirect URI Google configuré : `https://supfile.fly.dev/api/auth/google/callback`
- [ ] JavaScript origins Google configurés
- [ ] Redirect URI GitHub configuré : `https://supfile.fly.dev/api/auth/github/callback`
- [ ] Test de connexion Google réussi
- [ ] Test de connexion GitHub réussi

---

## 🆘 En Cas de Problème

### Erreur de permissions avec flyctl

Si vous avez une erreur "Accès refusé" avec le dossier `.fly` :

1. **Fermez** tous les terminaux PowerShell
2. **Ouvrez** un nouveau terminal PowerShell **en tant qu'administrateur**
3. **Réessayez** les commandes

### Les connexions OAuth ne fonctionnent toujours pas

1. **Vérifiez** que les Redirect URIs sont **exactement** comme indiqué ci-dessus
2. **Vérifiez** les logs du backend :
   ```powershell
   flyctl logs --app supfile
   ```
3. **Vérifiez** que les secrets sont bien configurés :
   ```powershell
   flyctl secrets list --app supfile | Select-String "GOOGLE|GITHUB"
   ```

---

C'est tout ! Une fois les secrets mis à jour et les Redirect URIs configurés, les connexions OAuth devraient fonctionner ! 🚀
