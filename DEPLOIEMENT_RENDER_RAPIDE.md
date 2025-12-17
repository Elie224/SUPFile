# Déploiement Rapide sur Render - Backend

## Checklist de déploiement

### ✅ 1. Préparer MongoDB Atlas (5 minutes)

1. Créez un compte sur https://www.mongodb.com/cloud/atlas
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur (Database Access)
4. Autorisez l'accès réseau : `0.0.0.0/0` (Network Access)
5. Obtenez la chaîne de connexion (Connect → Connect your application)
   ```
   mongodb+srv://[REDACTED]
   ```

### ✅ 2. Préparer le code Git

```bash
git add .
git commit -m "Préparation déploiement Render"
git push origin main
```

### ✅ 3. Créer le service sur Render

1. Allez sur https://dashboard.render.com
2. Cliquez sur "New +" → "Web Service"
3. Connectez votre dépôt Git (GitHub/GitLab/Bitbucket)
4. Sélectionnez votre dépôt SUPFile

### ✅ 4. Configurer le service

**Paramètres importants :**

- **Name** : `supfile-backend`
- **Root Directory** : `backend` ⚠️ **IMPORTANT**
- **Environment** : `Node`
- **Build Command** : `npm install` (Render le fait automatiquement si Root Directory = backend)
- **Start Command** : `npm start`

### ✅ 5. Variables d'environnement (Obligatoires)

Dans "Environment Variables", ajoutez :

| Variable | Valeur | Notes |
|----------|--------|-------|
| `MONGO_URI` | `mongodb+srv://[REDACTED] | Votre chaîne MongoDB Atlas |
| `JWT_SECRET` | *(générer)* | Cliquez sur "Generate" |
| `JWT_REFRESH_SECRET` | *(générer)* | Cliquez sur "Generate" |
| `SESSION_SECRET` | *(générer)* | Cliquez sur "Generate" |
| `NODE_ENV` | `production` | - |

### ✅ 6. Variables d'environnement (Optionnelles)

| Variable | Valeur | Quand l'ajouter |
|----------|--------|-----------------|
| `CORS_ORIGIN` | `https://votre-frontend.onrender.com` | Après avoir déployé le frontend |
| `GOOGLE_CLIENT_ID` | Votre ID Google | Si OAuth Google |
| `GOOGLE_CLIENT_SECRET` | Votre secret Google | Si OAuth Google |
| `GITHUB_CLIENT_ID` | Votre ID GitHub | Si OAuth GitHub |
| `GITHUB_CLIENT_SECRET` | Votre secret GitHub | Si OAuth GitHub |

### ✅ 7. Déployer

1. Cliquez sur "Create Web Service"
2. Attendez 2-5 minutes pour le build
3. Vérifiez les logs pour voir si tout fonctionne

### ✅ 8. Tester

Une fois déployé, testez :

```bash
curl https://votre-backend.onrender.com/health
```

Vous devriez voir :
```json
{"status":"ok","timestamp":"..."}
```

## URL de votre backend

Une fois déployé, votre backend sera accessible sur :
```
https://supfile-backend.onrender.com
```
(ou le nom que vous avez choisi)

## ⚠️ Notes importantes

1. **Plan gratuit** : Le service se met en veille après 15 min d'inactivité
2. **Stockage éphémère** : Les fichiers uploadés seront perdus lors des redéploiements
3. **CORS** : N'oubliez pas de configurer `CORS_ORIGIN` avec l'URL de votre frontend

## Problèmes ?

Consultez `DEPLOIEMENT_RENDER.md` pour plus de détails et le dépannage.

