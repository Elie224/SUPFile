# Diagnostic OAuth - Erreur "Unknown authentication strategy"

## 🔴 Erreur rencontrée

```
"error": {
  "status": 500,
  "message": "Unknown authentication strategy \"google\""
}
```

ou

```
"error": {
  "status": 500,
  "message": "Unknown authentication strategy \"github\""
}
```

## 🔍 Causes possibles

Cette erreur signifie que Passport n'a pas trouvé la stratégie OAuth correspondante. Cela peut arriver si :

1. **Les variables d'environnement ne sont pas définies dans Render**
2. **Les stratégies ne sont pas enregistrées au démarrage du serveur**
3. **Les credentials OAuth sont invalides**

## ✅ Solution : Vérifier la configuration dans Render

### Étape 1 : Vérifier les variables d'environnement

Dans le dashboard Render, pour votre service backend (`supfile-backend`), vérifiez que ces variables sont définies :

#### Pour Google OAuth :
```
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=https://supfile-1.onrender.com/api/auth/google/callback
```

#### Pour GitHub OAuth :
```
GITHUB_CLIENT_ID=votre_client_id_github
GITHUB_CLIENT_SECRET=votre_client_secret_github
GITHUB_REDIRECT_URI=https://supfile-1.onrender.com/api/auth/github/callback
```

### Étape 2 : Vérifier les logs du serveur

Après avoir redéployé, vérifiez les logs du backend dans Render. Vous devriez voir :

```
🔧 Configuring OAuth strategies...
✅ Google OAuth configured
✅ GitHub OAuth configured
📋 Registered Passport strategies: google, github
🔧 OAuth strategies configuration completed
```

Si vous voyez :
```
⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)
⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)
```

Cela signifie que les variables d'environnement ne sont pas définies ou sont vides.

### Étape 3 : Redéployer après configuration

**IMPORTANT** : Après avoir ajouté ou modifié les variables d'environnement dans Render, vous devez **redéployer le service** pour que les changements prennent effet.

1. Allez dans le dashboard Render
2. Sélectionnez votre service backend
3. Cliquez sur **"Manual Deploy"** > **"Deploy latest commit"**

## 🧪 Test de la configuration

### Test 1 : Vérifier que les routes répondent

1. Allez sur : `https://supfile-1.onrender.com/api/auth/google`
   - Devrait rediriger vers Google (si configuré)
   - Ou rediriger vers `/login?error=oauth_not_configured` (si non configuré)

2. Allez sur : `https://supfile-1.onrender.com/api/auth/github`
   - Devrait rediriger vers GitHub (si configuré)
   - Ou rediriger vers `/login?error=oauth_not_configured` (si non configuré)

### Test 2 : Vérifier depuis le frontend

1. Allez sur : `https://supfile-frontend.onrender.com/login`
2. Cliquez sur "Continuer avec Google" ou "Continuer avec GitHub"
3. Si configuré correctement : redirection vers le provider OAuth
4. Si non configuré : message d'erreur sur la page de login

## 📝 Checklist de configuration

- [ ] `GOOGLE_CLIENT_ID` défini dans Render
- [ ] `GOOGLE_CLIENT_SECRET` défini dans Render
- [ ] `GOOGLE_REDIRECT_URI` défini dans Render (ou laissé vide pour utiliser la valeur par défaut)
- [ ] `GITHUB_CLIENT_ID` défini dans Render
- [ ] `GITHUB_CLIENT_SECRET` défini dans Render
- [ ] `GITHUB_REDIRECT_URI` défini dans Render (ou laissé vide pour utiliser la valeur par défaut)
- [ ] Service backend redéployé après configuration
- [ ] URLs de callback configurées dans Google Cloud Console
- [ ] URLs de callback configurées dans GitHub OAuth App

## 🔧 Correction automatique

Le code a été modifié pour :
1. Enregistrer les stratégies avec des noms explicites (`'google'` et `'github'`)
2. Vérifier que les stratégies existent avant de les utiliser
3. Afficher des messages d'erreur plus clairs dans les logs
4. Utiliser automatiquement les URLs de production si `NODE_ENV=production`

## ⚠️ Important

Si les variables d'environnement ne sont **pas** définies dans Render, les stratégies OAuth ne seront **pas** enregistrées, et vous obtiendrez l'erreur "Unknown authentication strategy".

**Solution** : Définissez toutes les variables d'environnement OAuth dans Render et redéployez le service.


