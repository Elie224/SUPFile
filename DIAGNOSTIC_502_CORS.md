# 🔍 Diagnostic Erreur 502 + CORS sur Render

## ❌ Problème

Erreur combinée lors du téléchargement de dossier :

1. **502 (Bad Gateway)** : Le backend ne répond pas correctement
2. **CORS Error** : Pas de header `Access-Control-Allow-Origin` (consequence du 502)

```
Access to fetch at 'https://supfile-1.onrender.com/api/folders/{id}/download' 
from origin 'https://supfile-frontend.onrender.com' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
GET https://supfile-1.onrender.com/api/folders/{id}/download net::ERR_FAILED 502 (Bad Gateway)
```

## 🔍 Causes Possibles

### 1. Backend pas redéployé
Le backend n'a pas été redéployé avec les nouveaux changements CORS.

### 2. Backend en cours de redémarrage
Le backend est en train de redémarrer après un déploiement.

### 3. Crash du backend
Le backend a crashé lors de l'exécution du code de téléchargement de dossier.

### 4. Timeout lors de la création du ZIP
La création de l'archive ZIP prend trop de temps (>30 secondes sur Render Free tier).

## ✅ Solutions

### Solution 1 : Vérifier l'état du service sur Render

1. **Aller sur le Dashboard Render** : https://dashboard.render.com/
2. **Sélectionner le service `supfile-backend`**
3. **Vérifier l'onglet "Logs"** pour voir les erreurs
4. **Vérifier l'onglet "Events"** pour voir les déploiements

### Solution 2 : Redéployer manuellement

Si le backend n'a pas été redéployé automatiquement :

1. **Dans le Dashboard Render**, aller sur le service `supfile-backend`
2. **Cliquer sur "Manual Deploy"**
3. **Sélectionner "Deploy latest commit"**
4. **Attendre la fin du déploiement** (2-5 minutes)

### Solution 3 : Vérifier les logs d'erreur

Dans les logs Render, chercher :

```
❌ Error creating ZIP archive
❌ File not found
❌ Memory limit exceeded
❌ Timeout
```

### Solution 4 : Tester l'endpoint directement

Tester avec curl pour voir l'erreur exacte :

```bash
curl -v -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Origin: https://supfile-frontend.onrender.com" \
     https://supfile-1.onrender.com/api/folders/694318b012a0626255de2f81/download
```

Si vous voyez `502 Bad Gateway`, le backend ne répond pas.

### Solution 5 : Vérifier la variable CORS_ORIGIN

Assurez-vous que `CORS_ORIGIN` est configurée sur Render (optionnel mais recommandé) :

1. **Dashboard Render** → `supfile-backend` → **Environment**
2. **Ajouter/Modifier** `CORS_ORIGIN` :
   ```
   https://supfile-frontend.onrender.com
   ```

## 🔧 Configuration CORS Actuelle

Le code CORS a été mis à jour pour inclure :
- ✅ Toutes les méthodes HTTP (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- ✅ Tous les headers nécessaires (Authorization, Content-Type, etc.)
- ✅ Headers exposés pour téléchargements (Content-Disposition, etc.)
- ✅ Autorisation automatique des domaines `.onrender.com`

**Le code est correct, mais le backend doit être redéployé pour prendre effet.**

## 📝 Checklist de Vérification

- [ ] Backend redéployé avec les derniers commits
- [ ] Backend accessible (tester `/api/health`)
- [ ] Pas d'erreurs dans les logs Render
- [ ] Variable `CORS_ORIGIN` configurée (optionnel)
- [ ] Le service backend est "Live" dans Render

## ⚠️ Note sur les Timeouts Render

Sur le plan **Free** de Render :
- **Request timeout** : 30 secondes
- Si la création du ZIP prend plus de 30 secondes, la requête échouera avec un 502

**Solution** : Optimiser le code de création ZIP ou passer à un plan payant.

---

**Date de création** : Décembre 2025