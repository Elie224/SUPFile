# 🔧 Résolution Erreur CORS sur Render

## ❌ Problème

Erreur CORS lors de l'accès à l'API depuis le frontend déployé sur Render :

```
Access to XMLHttpRequest at 'https://supfile-1.onrender.com/api/dashboard' 
from origin 'https://supfile-frontend.onrender.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solution

### Option 1 : Configuration automatique (Recommandé)

Le backend a été mis à jour pour autoriser automatiquement les domaines Render (`.onrender.com`) en production. **Redéployez simplement le backend** et cela devrait fonctionner.

### Option 2 : Configuration manuelle de CORS_ORIGIN

Si vous voulez être plus strict, configurez manuellement la variable d'environnement `CORS_ORIGIN` sur Render :

1. **Aller sur le Dashboard Render** : https://dashboard.render.com/
2. **Sélectionner le service `supfile-backend`**
3. **Aller dans "Environment"**
4. **Ajouter/Modifier la variable `CORS_ORIGIN`** :
   ```
   https://supfile-frontend.onrender.com
   ```
   
   **Pour plusieurs origines**, séparer par des virgules :
   ```
   https://supfile-frontend.onrender.com,https://supfile-frontend-1.onrender.com
   ```

5. **Redémarrer le service** (Render redémarrera automatiquement après la modification)

## 🔍 Vérification

Après configuration, testez l'API depuis votre frontend. L'erreur CORS devrait disparaître.

Pour vérifier si CORS est correctement configuré, vous pouvez tester avec curl :

```bash
curl -H "Origin: https://supfile-frontend.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://supfile-1.onrender.com/api/dashboard \
     -v
```

Vous devriez voir dans la réponse :
```
Access-Control-Allow-Origin: https://supfile-frontend.onrender.com
```

## 📝 Configuration Actuelle

Le backend autorise maintenant automatiquement :
- ✅ Tous les sous-domaines `.onrender.com` en production
- ✅ Les origines définies dans `CORS_ORIGIN` (si configuré)
- ✅ Les requêtes sans origine (pour compatibilité mobile)

## ⚠️ Notes Importantes

- **Redéploiement nécessaire** : Après modification de `backend/config.js`, redéployez le backend sur Render
- **Variables d'environnement** : La variable `CORS_ORIGIN` est optionnelle mais recommandée pour plus de contrôle
- **Sécurité** : En production, seules les origines autorisées peuvent accéder à l'API

---

**Date de création** : Décembre 2025