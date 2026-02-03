# 🔧 Correction OAuth GitHub - Redirect URI Non Configuré

## ❌ Problème

**Erreur** : "The `redirect_uri` is not associated with this application"

L'URL de callback `https://supfile.fly.dev/api/auth/github/callback` n'est pas configurée dans les paramètres de votre application GitHub OAuth.

---

## ✅ Solution : Ajouter le Redirect URI

### Étape 1 : Accéder aux Paramètres GitHub OAuth

**Option A : Lien Direct** (si vous connaissez votre Client ID)
- Client ID : `Ov23ligHjSi2qTjUNtCc`
- Allez sur : https://github.com/settings/developers/oauth-apps

**Option B : Navigation Manuelle**
1. **Allez sur** : https://github.com/settings
2. **Dans le menu de gauche**, cliquez sur "Developer settings"
3. **Cliquez sur "OAuth Apps"**

### Étape 2 : Trouver Votre Application

1. **Cherchez** votre application OAuth dans la liste
   - **Client ID** : `Ov23ligHjSi2qTjUNtCc`
   - Si vous ne la trouvez pas, créez-en une nouvelle (voir ci-dessous)

2. **Cliquez sur votre application** pour ouvrir ses paramètres

### Étape 3 : Mettre à Jour le Redirect URI

1. **Dans "Authorization callback URL"**, vous verrez probablement :
   - `https://supfile-1.onrender.com/api/auth/github/callback` (ancienne URL)
   - OU une autre URL

2. **Remplacez** par la nouvelle URL :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```

3. **Vérifiez aussi "Homepage URL"** :
   - Devrait être : `https://flourishing-banoffee-c0b1ad.netlify.app`
   - (URL de votre frontend Netlify)

4. **Cliquez sur "Update application"** (en bas de la page)

---

## 🆕 Si Vous Ne Trouvez Pas Votre Application

### Créer une Nouvelle Application OAuth

1. **Dans la page OAuth Apps**, cliquez sur "New OAuth App" (ou "Nouvelle application OAuth")

2. **Remplissez le formulaire** :
   - **Application name** : `SUPFile`
   - **Homepage URL** : `https://flourishing-banoffee-c0b1ad.netlify.app`
   - **Authorization callback URL** : `https://supfile.fly.dev/api/auth/github/callback`
     ⚠️ **Important** : Exactement cette URL, sans slash à la fin

3. **Cliquez sur "Register application"**

4. **Récupérez les identifiants** :
   - **Client ID** : `Ov23ligHjSi2qTjUNtCc` (ou un nouveau)
   - **Client Secret** : `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (généré automatiquement)
   - ⚠️ **Copiez le Client Secret immédiatement**, vous ne pourrez plus le voir après !

5. **Mettez à jour les secrets sur Fly.io** si vous avez créé une nouvelle application :
   ```powershell
   cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
   flyctl secrets set GITHUB_CLIENT_ID="VOTRE_NOUVEAU_CLIENT_ID" --app supfile
   flyctl secrets set GITHUB_CLIENT_SECRET="[REDACTED]" --app supfile
   ```

---

## 🔄 Redéployer le Backend (Si Nécessaire)

Si vous avez créé une nouvelle application OAuth, redéployez :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
flyctl deploy --app supfile
```

**Note** : Si vous avez seulement modifié le Redirect URI (sans créer de nouvelle app), le redéploiement n'est pas nécessaire, mais peut être utile pour s'assurer que tout est à jour.

---

## ✅ Vérification

1. **Vérifiez** que le Redirect URI est bien configuré dans GitHub
2. **Testez la connexion GitHub** :
   - Allez sur votre site Netlify
   - Cliquez sur "Se connecter avec GitHub"
   - Vous devriez être redirigé vers GitHub pour autoriser
   - Après autorisation, vous devriez être connecté

---

## 📋 Checklist

- [ ] Accédé à GitHub Developer Settings → OAuth Apps
- [ ] Trouvé l'application OAuth (Client ID : `Ov23ligHjSi2qTjUNtCc`)
- [ ] Mis à jour "Authorization callback URL" : `https://supfile.fly.dev/api/auth/github/callback`
- [ ] Mis à jour "Homepage URL" : `https://flourishing-banoffee-c0b1ad.netlify.app`
- [ ] Cliqué sur "Update application"
- [ ] (Si nouvelle app) Mis à jour les secrets sur Fly.io
- [ ] (Si nouvelle app) Redéployé le backend
- [ ] Test de connexion GitHub réussi

---

## 🆘 En Cas de Problème

### Erreur "redirect_uri_mismatch" Persiste

1. **Vérifiez** que le Redirect URI dans GitHub est **exactement** :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```
   - Pas de slash `/` à la fin
   - Commence par `https://`
   - Pas d'espace avant ou après
   - Pas de caractères spéciaux

2. **Vérifiez** que le secret `GITHUB_REDIRECT_URI` sur Fly.io est correct :
   ```powershell
   flyctl secrets list --app supfile
   ```
   Devrait afficher : `GITHUB_REDIRECT_URI=https://supfile.fly.dev/api/auth/github/callback`

3. **Redéployez** le backend :
   ```powershell
   flyctl deploy --app supfile
   ```

### Le Client Secret a été Perdu

Si vous avez créé une nouvelle application et perdu le Client Secret :
1. **Allez sur** : https://github.com/settings/developers/oauth-apps
2. **Cliquez sur votre application**
3. **Cliquez sur "Generate a new client secret"**
4. **Copiez le nouveau secret** immédiatement
5. **Mettez à jour** sur Fly.io :
   ```powershell
   flyctl secrets set GITHUB_CLIENT_SECRET="[REDACTED]" --app supfile
   ```

---

## 🎯 URL Exacte à Utiliser

**Authorization callback URL** :
```
https://supfile.fly.dev/api/auth/github/callback
```

**Homepage URL** :
```
https://flourishing-banoffee-c0b1ad.netlify.app
```

⚠️ **Important** : Copiez-collez exactement ces URLs, sans modification.

---

C'est tout ! Une fois le Redirect URI configuré dans GitHub, la connexion GitHub devrait fonctionner ! 🚀
