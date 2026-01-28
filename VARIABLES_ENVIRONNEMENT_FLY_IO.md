# 🔑 Variables d'Environnement pour Fly.io

## ⚠️ IMPORTANT : Valeurs Complètes et Correctes

Les erreurs "has invalid format" dans l'interface Fly.io sont dues à des URLs tronquées. Utilisez les valeurs **COMPLÈTES** ci-dessous.

---

## ✅ Variables OBLIGATOIRES

### 1. Environnement & Serveur
```
NODE_ENV = production
PORT = 5000
```

### 2. Base de Données MongoDB
```
MONGO_URI=[REDACTED]
```

### 3. JWT & Sessions
```
JWT_SECRET=[REDACTED] clé secrète JWT - générez une chaîne aléatoire de 32+ caractères]
JWT_REFRESH_SECRET=[REDACTED] clé secrète pour refresh tokens - différente de JWT_SECRET]
SESSION_SECRET=[REDACTED] clé secrète pour les sessions - différente des autres]
```

**💡 Pour générer des secrets sécurisés :**
```bash
# Sur Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### 4. Frontend & CORS
```
FRONTEND_URL = https://flourishing-banoffee-c0b1ad.netlify.app
CORS_ORIGIN = https://flourishing-banoffee-c0b1ad.netlify.app
```

**⚠️ ATTENTION :** 
- L'URL doit être **COMPLÈTE** (pas tronquée)
- Pas d'espace avant/après
- Pas de slash final (`/`)

### 5. OAuth Google
```
GOOGLE_CLIENT_ID = [Votre Google Client ID]
GOOGLE_CLIENT_SECRET=[REDACTED] Google Client Secret]
GOOGLE_REDIRECT_URI = https://supfile.fly.dev/api/auth/google/callback
```

**⚠️ IMPORTANT :**
- Remplacez `supfile.fly.dev` par **VOTRE URL Fly.io réelle** après le déploiement
- L'URL doit être : `https://[votre-app].fly.dev/api/auth/google/callback`
- **PAS** : `https://supfile.fly.dev/api/auth/goc` (tronqué ❌)

### 6. OAuth GitHub
```
GITHUB_CLIENT_ID = [Votre GitHub Client ID]
GITHUB_CLIENT_SECRET=[REDACTED] GitHub Client Secret]
GITHUB_REDIRECT_URI = https://supfile.fly.dev/api/auth/github/callback
```

**⚠️ IMPORTANT :**
- Remplacez `supfile.fly.dev` par **VOTRE URL Fly.io réelle** après le déploiement
- L'URL doit être : `https://[votre-app].fly.dev/api/auth/github/callback`
- **PAS** : `https://supfile.fly.dev/api/auth/gith` (tronqué ❌)

---

## 📋 Variables OPTIONNELLES

### Upload
```
MAX_FILE_SIZE = 32212254720
UPLOAD_DIR = ./uploads
```

### Features (Feature Flags)
```
ENABLE_CACHE = true
ENABLE_COMPRESSION = true
ENABLE_RATE_LIMITING = true
```

---

## 🔧 Comment Corriger les Erreurs dans Fly.io

### Problème : "has invalid format"

**Causes possibles :**
1. ✅ URL tronquée (copier-coller incomplet)
2. ✅ Espaces avant/après la valeur
3. ✅ Caractères spéciaux non échappés
4. ✅ Slash final non autorisé

### Solution :

1. **Supprimez la variable avec l'erreur** (cliquez sur le X)
2. **Ajoutez-la à nouveau** avec la valeur complète
3. **Vérifiez qu'il n'y a pas d'espaces** avant/après
4. **Copiez-collez depuis ce document** pour éviter les erreurs de frappe

---

## 📝 Checklist de Configuration

Avant de déployer, vérifiez :

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`
- [ ] `MONGO_URI` est complet (avec le nom de la base de données)
- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET` sont définis et différents
- [ ] `FRONTEND_URL` est l'URL Netlify complète (sans slash final)
- [ ] `CORS_ORIGIN` est identique à `FRONTEND_URL`
- [ ] `GOOGLE_REDIRECT_URI` utilise votre URL Fly.io réelle
- [ ] `GITHUB_REDIRECT_URI` utilise votre URL Fly.io réelle
- [ ] Toutes les URLs commencent par `https://` (pas `http://`)
- [ ] Aucune URL ne se termine par `/` (sauf si nécessaire)

---

## 🚀 Après le Déploiement

Une fois que votre application Fly.io est déployée :

1. **Récupérez l'URL réelle** de votre app (ex: `https://supfile-abc123.fly.dev`)
2. **Mettez à jour** `GOOGLE_REDIRECT_URI` et `GITHUB_REDIRECT_URI` avec cette URL
3. **Mettez à jour** les Redirect URIs dans :
   - Google Cloud Console (OAuth 2.0)
   - GitHub Developer Settings (OAuth Apps)
4. **Mettez à jour** `VITE_API_URL` sur Netlify pour pointer vers Fly.io
5. **Mettez à jour** `API_URL` dans l'application mobile

---

## 🔍 Vérification

Pour vérifier que tout est correct :

```bash
# Vérifier les variables d'environnement sur Fly.io
flyctl secrets list

# Tester l'API
curl https://[votre-app].fly.dev/health
```

---

## 📞 Support

Si vous avez toujours des erreurs :
1. Vérifiez que toutes les URLs sont complètes (pas tronquées)
2. Vérifiez qu'il n'y a pas d'espaces
3. Vérifiez que les secrets sont bien définis
4. Consultez les logs : `flyctl logs`
