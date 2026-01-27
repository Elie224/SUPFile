# 🔧 Correction des Erreurs CORS et 503

## ✅ Problèmes Identifiés

1. **Erreur CORS** : `Access to fetch at 'https://supfile.fly.dev/api/files' from origin 'https://flourishing-banoffee-c0b1ad.netlify.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

2. **Erreur 503 (Service Unavailable)** : Le backend ne répond pas correctement, ce qui empêche l'envoi des en-têtes CORS.

**Causes** :
- Le backend sur Fly.io peut être en panne ou redémarré
- `CORS_ORIGIN` n'est peut-être pas correctement configuré sur Fly.io
- La configuration CORS ne supporte pas automatiquement les domaines Netlify

---

## 🔧 Solutions Appliquées

### 1. Support Automatique des Domaines Netlify

**Fichier** : `backend/config.js`

Ajout du support automatique pour les domaines Netlify (`.netlify.app`) dans la configuration CORS, similaire au support existant pour Render (`.onrender.com`).

```javascript
// En production, autoriser aussi les sous-domaines Render (.onrender.com) et Netlify (.netlify.app)
if (process.env.NODE_ENV === 'production') {
  if (origin.match(/^https:\/\/.*\.onrender\.com$/) ||
      origin.match(/^https:\/\/.*\.netlify\.app$/)) {
    return callback(null, true);
  }
}
```

**Avantage** : Même si `CORS_ORIGIN` n'est pas configuré, les domaines Netlify seront automatiquement autorisés.

---

### 2. Script de Mise à Jour CORS_ORIGIN

**Fichier** : `backend/mettre-a-jour-cors-netlify.ps1`

Script PowerShell pour mettre à jour `CORS_ORIGIN` et `FRONTEND_URL` sur Fly.io, puis redémarrer l'application.

**Utilisation** :
```powershell
cd backend
.\mettre-a-jour-cors-netlify.ps1
```

**Actions** :
1. Met à jour `CORS_ORIGIN` avec l'URL Netlify
2. Met à jour `FRONTEND_URL` avec l'URL Netlify
3. Redémarre l'application Fly.io

---

## 📋 Vérifications

### 1. Vérifier l'État du Backend

```powershell
cd backend
flyctl status --app supfile
```

**Vérifiez** :
- L'application est en état "running"
- Pas d'erreurs dans les logs

### 2. Vérifier les Secrets CORS

```powershell
cd backend
flyctl secrets list --app supfile
```

**Vérifiez** que :
- `CORS_ORIGIN` = `https://flourishing-banoffee-c0b1ad.netlify.app`
- `FRONTEND_URL` = `https://flourishing-banoffee-c0b1ad.netlify.app`

### 3. Vérifier les Logs du Backend

```powershell
cd backend
flyctl logs --app supfile
```

**Cherchez** :
- Des erreurs de démarrage
- Des messages CORS (warnings sur les origines bloquées)
- Des erreurs de connexion MongoDB

---

## 🚀 Actions à Effectuer

### Étape 1 : Mettre à Jour CORS_ORIGIN

**Exécutez le script** :
```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\mettre-a-jour-cors-netlify.ps1
```

**OU manuellement** :
```powershell
flyctl secrets set --app supfile "CORS_ORIGIN=https://flourishing-banoffee-c0b1ad.netlify.app"
flyctl secrets set --app supfile "FRONTEND_URL=https://flourishing-banoffee-c0b1ad.netlify.app"
flyctl apps restart --app supfile
```

### Étape 2 : Attendre le Redémarrage

Attendez **30-60 secondes** que l'application redémarre complètement.

### Étape 3 : Vérifier le Backend

```powershell
curl https://supfile.fly.dev/health
```

**Résultat attendu** : `{"status":"ok"}`

### Étape 4 : Tester l'Application

1. **Ouvrez** votre application Netlify : https://flourishing-banoffee-c0b1ad.netlify.app
2. **Connectez-vous**
3. **Allez sur** la page Fichiers
4. **Vérifiez** qu'il n'y a plus d'erreur CORS dans la console

---

## 🆘 Si le Problème Persiste

### Vérifier que le Backend est Accessible

```powershell
curl https://supfile.fly.dev/health
```

**Si erreur 503** :
1. Vérifiez les logs : `flyctl logs --app supfile`
2. Vérifiez l'état : `flyctl status --app supfile`
3. Redémarrez manuellement : `flyctl apps restart --app supfile`

### Vérifier la Configuration CORS

1. **Ouvrez** la console du navigateur (F12)
2. **Allez sur** l'onglet "Network"
3. **Rechargez** la page
4. **Vérifiez** la requête vers `/api/files`
5. **Regardez** les en-têtes de réponse :
   - `Access-Control-Allow-Origin` doit être présent
   - `Access-Control-Allow-Credentials` doit être `true`

### Vérifier les Logs CORS

Dans les logs du backend, cherchez :
```
CORS blocked origin: https://flourishing-banoffee-c0b1ad.netlify.app
Allowed origins: ...
```

Si vous voyez ce message, cela signifie que l'origine n'est pas autorisée. Vérifiez que `CORS_ORIGIN` est bien configuré.

---

## 📋 Checklist

- [x] Support automatique des domaines Netlify ajouté dans `config.js`
- [x] Script de mise à jour CORS créé
- [ ] `CORS_ORIGIN` mis à jour sur Fly.io
- [ ] `FRONTEND_URL` mis à jour sur Fly.io
- [ ] Backend redémarré
- [ ] Backend accessible (health check OK)
- [ ] Application Netlify testée
- [ ] Plus d'erreur CORS dans la console
- [ ] Plus d'erreur 503

---

## 🔍 Dépannage Avancé

### Si le Backend Ne Redémarre Pas

```powershell
# Forcer un redéploiement
flyctl deploy --app supfile

# OU forcer un redémarrage complet
flyctl scale count 0 --app supfile
Start-Sleep -Seconds 10
flyctl scale count 1 --app supfile
```

### Si CORS_ORIGIN Ne Fonctionne Toujours Pas

1. **Vérifiez** que l'URL est exacte (pas d'espace, pas de slash final)
2. **Vérifiez** que `NODE_ENV=production` est configuré
3. **Vérifiez** les logs pour voir quelles origines sont autorisées

### Si le Backend Retourne Toujours 503

1. **Vérifiez** les logs : `flyctl logs --app supfile | Select-String -Pattern "error|Error|ERROR"`
2. **Vérifiez** la connexion MongoDB
3. **Vérifiez** que tous les secrets requis sont configurés

---

Une fois les modifications appliquées et le backend redémarré, les erreurs CORS et 503 devraient être résolues ! 🚀
