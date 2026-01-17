# Configuration OAuth Rapide pour Render

## ⚠️ Erreur actuelle
```
OAuth google is not configured. Please contact the administrator.
```

## ✅ Solution : Configurer les variables d'environnement dans Render

### Étape 1 : Obtenir les identifiants OAuth

#### Pour Google :
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez un projet existant
3. Activez l'API "Google Identity Services API"
4. Créez des identifiants OAuth 2.0 :
   - Type : Application Web
   - URI de redirection autorisés : `https://supfile-1.onrender.com/api/auth/google/callback`
5. Copiez le **Client ID** et le **Client Secret**

#### Pour GitHub :
1. Allez sur [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Cliquez sur "New OAuth App"
3. Remplissez :
   - **Application name** : SUPFile
   - **Homepage URL** : `https://supfile-frontend.onrender.com`
   - **Authorization callback URL** : `https://supfile-1.onrender.com/api/auth/github/callback`
4. Cliquez sur "Register application"
5. Copiez le **Client ID** et générez un **Client Secret**

### Étape 2 : Ajouter les variables dans Render

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Sélectionnez votre service backend (`supfile-backend`)
3. Allez dans l'onglet **"Environment"**
4. Cliquez sur **"Add Environment Variable"**
5. Ajoutez ces variables une par une :

#### Variables Google OAuth :
```
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=[REDACTED]
GOOGLE_REDIRECT_URI=https://supfile-1.onrender.com/api/auth/google/callback
```

#### Variables GitHub OAuth :
```
GITHUB_CLIENT_ID=votre_client_id_github
GITHUB_CLIENT_SECRET=[REDACTED]
GITHUB_REDIRECT_URI=https://supfile-1.onrender.com/api/auth/github/callback
```

#### Variable Frontend (si pas déjà définie) :
```
FRONTEND_URL=https://supfile-frontend.onrender.com
```

### Étape 3 : Redéployer le service

**IMPORTANT** : Après avoir ajouté les variables, vous DEVEZ redéployer :

1. Dans le dashboard Render, allez dans votre service backend
2. Cliquez sur **"Manual Deploy"** > **"Deploy latest commit"**
3. Attendez que le déploiement se termine (2-3 minutes)

### Étape 4 : Vérifier les logs

Après le redéploiement, vérifiez les logs. Vous devriez voir :
```
✅ Google OAuth configured
✅ GitHub OAuth configured
📋 Registered Passport strategies: google, github
```

Si vous voyez toujours :
```
⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)
```

Cela signifie que les variables ne sont pas correctement définies. Vérifiez :
- Que les noms des variables sont exacts (sensible à la casse)
- Qu'il n'y a pas d'espaces avant/après les valeurs
- Que les valeurs sont bien copiées (pas de caractères invisibles)

## 🧪 Test

1. Allez sur : `https://supfile-frontend.onrender.com/login`
2. Cliquez sur "Continuer avec Google"
3. Vous devriez être redirigé vers Google pour l'authentification
4. Après connexion, vous serez redirigé vers le dashboard

## 📝 Checklist

- [ ] Projet créé dans Google Cloud Console
- [ ] API Google Identity activée
- [ ] OAuth Client ID créé avec le bon redirect URI
- [ ] Client ID et Secret Google copiés
- [ ] OAuth App GitHub créé avec le bon callback URL
- [ ] Client ID et Secret GitHub copiés
- [ ] Toutes les variables ajoutées dans Render
- [ ] Service backend redéployé
- [ ] Logs vérifiés (stratégies configurées)
- [ ] Test de connexion OAuth réussi


