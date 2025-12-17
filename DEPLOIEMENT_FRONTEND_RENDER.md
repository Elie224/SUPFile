# Déploiement Frontend sur Render - Configuration

## Problème courant

Le frontend ne fonctionne pas car `VITE_API_URL` n'est pas définie au moment du build.

## Solution : Ajouter VITE_API_URL dans Render

### Étape 1 : Configurer la variable d'environnement

1. Dans Render, allez dans votre service frontend (`supfile-frontend`)
2. Allez dans "Environment" → "Environment Variables"
3. Cliquez sur "Edit" ou "+ Add"
4. Ajoutez cette variable :

   **Key** : `VITE_API_URL`
   
   **Value** : `https://supfile-1.onrender.com`

5. Cliquez sur "Save"

### Étape 2 : Redéployer le service

⚠️ **IMPORTANT** : Après avoir ajouté la variable, vous devez redéployer pour que le build utilise la nouvelle variable.

1. Cliquez sur "Manual Deploy" → "Deploy latest commit"
2. Attendez que le build se termine (2-5 minutes)

### Étape 3 : Configurer CORS dans le backend

Une fois le frontend redéployé :

1. Retournez dans le backend (`supfile-1`)
2. Allez dans "Environment" → "Environment Variables"
3. Ajoutez/modifiez `CORS_ORIGIN` :
   - **Key** : `CORS_ORIGIN`
   - **Value** : `https://supfile-frontend.onrender.com`
4. Le backend redémarrera automatiquement

## Vérification

Après le redéploiement, testez :
- Frontend : https://supfile-frontend.onrender.com
- Backend : https://supfile-1.onrender.com/health

## Problèmes sur mobile

Si ça ne fonctionne pas sur mobile, vérifiez :
1. Que `VITE_API_URL` est bien configurée et que le build a été relancé
2. Que CORS est configuré dans le backend avec l'URL exacte du frontend
3. Ouvrez la console du navigateur mobile pour voir les erreurs

