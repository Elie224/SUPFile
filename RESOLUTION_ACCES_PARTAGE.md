# Résolution : Problème d'accès au lien partagé

## Problèmes possibles

### 1. Service Render en veille (Plan gratuit)

Sur le plan gratuit, Render met les services en veille après 15 minutes d'inactivité. Le premier accès peut prendre 30-60 secondes.

**Solution** :
- Attendre 30-60 secondes lors du premier accès
- Ou passer au plan payant pour éviter la mise en veille

### 2. VITE_API_URL non configurée

Si `VITE_API_URL` n'est pas définie au moment du build, le frontend essaie de se connecter à `http://localhost:5000` au lieu du backend déployé.

**Vérification** :
1. Dans Render, allez dans le service frontend (`supfile-frontend`)
2. "Environment" → "Environment Variables"
3. Vérifiez que `VITE_API_URL` existe avec la valeur `https://supfile-1.onrender.com`
4. Si elle n'existe pas, ajoutez-la et **redéployez** (important !)

### 3. CORS non configuré

Le backend doit autoriser les requêtes depuis le frontend.

**Vérification** :
1. Dans le backend (`supfile-1`)
2. "Environment" → "Environment Variables"
3. Vérifiez que `CORS_ORIGIN` = `https://supfile-frontend.onrender.com`

### 4. Erreurs dans la console du navigateur

Ouvrez la console du navigateur (F12) pour voir les erreurs exactes.

## Solutions rapides

### Solution 1 : Vérifier les variables d'environnement

**Frontend** :
- `VITE_API_URL` = `https://supfile-1.onrender.com`

**Backend** :
- `CORS_ORIGIN` = `https://supfile-frontend.onrender.com`
- `MONGO_URI` = votre chaîne MongoDB
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET` = générés
- `NODE_ENV` = `production`

### Solution 2 : Redéployer après modification

⚠️ **IMPORTANT** : Après avoir ajouté/modifié `VITE_API_URL`, vous devez redéployer le frontend pour que le changement soit pris en compte (car Vite intègre les variables au moment du build).

### Solution 3 : Tester l'accès

1. Testez le backend : `https://supfile-1.onrender.com/health`
2. Testez le frontend : `https://supfile-frontend.onrender.com`
3. Ouvrez la console (F12) et vérifiez les erreurs réseau

## Message d'erreur spécifique ?

Si vous avez un message d'erreur précis, partagez-le et je pourrai vous aider plus précisément.

