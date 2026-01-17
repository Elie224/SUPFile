# Guide de déploiement sur Render

Ce guide vous explique comment déployer le backend SUPFile sur Render.

## Prérequis

1. Un compte Render (gratuit) : https://render.com
2. MongoDB Atlas (gratuit) : https://www.mongodb.com/cloud/atlas
   - OU un service MongoDB sur Render

## Étape 1 : Préparer MongoDB

### Option A : MongoDB Atlas (Recommandé)

1. Créez un compte sur MongoDB Atlas
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur de base de données
4. Autorisez l'accès réseau (ajoutez `0.0.0.0/0` pour développement ou votre IP)
5. Obtenez la chaîne de connexion :
   ```
   mongodb+srv://[REDACTED]
   ```

### Option B : MongoDB sur Render

1. Dans Render Dashboard, créez un nouveau service "MongoDB"
2. Notez la chaîne de connexion interne fournie

## Étape 2 : Préparer le dépôt Git

Assurez-vous que votre code est sur GitHub, GitLab ou Bitbucket :

```bash
git add .
git commit -m "Préparation pour déploiement Render"
git push origin main
```

## Étape 3 : Créer le service sur Render

1. Connectez-vous à https://dashboard.render.com
2. Cliquez sur "New +" → "Web Service"
3. Connectez votre dépôt Git
4. Configurez le service :
   - **Name** : `supfile-backend`
   - **Environment** : `Node`
   - **Root Directory** : `backend` (important !)
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`

## Étape 4 : Configurer les variables d'environnement

Dans les paramètres du service Render, ajoutez ces variables d'environnement :

### Variables obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGO_URI` | Chaîne de connexion MongoDB | `mongodb+srv://[REDACTED] |
| `JWT_SECRET` | Secret pour les tokens JWT (générez un secret fort) | Utilisez "Generate" dans Render |
| `JWT_REFRESH_SECRET` | Secret pour les refresh tokens | Utilisez "Generate" dans Render |
| `SESSION_SECRET` | Secret pour les sessions OAuth | Utilisez "Generate" dans Render |
| `NODE_ENV` | Environnement | `production` |

### Variables optionnelles

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `CORS_ORIGIN` | Origines autorisées (séparées par des virgules) | `http://localhost:3000` |
| `UPLOAD_DIR` | Répertoire pour les uploads | `./uploads` |
| `MAX_FILE_SIZE` | Taille max des fichiers (en bytes) | `32212254720` (30 GB) |
| `GOOGLE_CLIENT_ID` | ID client Google OAuth (optionnel) | - |
| `GOOGLE_CLIENT_SECRET` | Secret client Google OAuth (optionnel) | - |
| `GITHUB_CLIENT_ID` | ID client GitHub OAuth (optionnel) | - |
| `GITHUB_CLIENT_SECRET` | Secret client GitHub OAuth (optionnel) | - |

### Générer des secrets sécurisés

Pour générer des secrets JWT sécurisés, vous pouvez utiliser :

```bash
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Ou en ligne de commande Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Étape 5 : Configurer CORS

Une fois le backend déployé, notez l'URL (ex: `https://supfile-backend.onrender.com`).

Pour le frontend, vous devrez configurer `CORS_ORIGIN` avec l'URL de votre frontend :

```
CORS_ORIGIN=https://votre-frontend.onrender.com,https://votre-domaine.com
```

## Étape 6 : Déployer

1. Cliquez sur "Create Web Service"
2. Render va automatiquement :
   - Cloner votre dépôt
   - Installer les dépendances (`npm install`)
   - Démarrer le service (`npm start`)

## Étape 7 : Vérifier le déploiement

1. Attendez que le build soit terminé (2-5 minutes)
2. Vérifiez les logs pour voir si le serveur démarre correctement
3. Testez l'endpoint de santé :
   ```
   https://votre-backend.onrender.com/health
   ```

Vous devriez voir une réponse JSON :
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

## Problèmes courants

### Le service ne démarre pas

1. Vérifiez les logs dans Render Dashboard
2. Vérifiez que `MONGO_URI` est correctement configuré
3. Vérifiez que MongoDB Atlas autorise les connexions depuis `0.0.0.0/0`

### Erreur de connexion MongoDB

1. Vérifiez que la chaîne de connexion est correcte
2. Vérifiez que votre IP est autorisée dans MongoDB Atlas (Network Access)
3. Pour Render, vous pouvez utiliser `0.0.0.0/0` temporairement

### Erreur CORS

1. Vérifiez que `CORS_ORIGIN` contient l'URL exacte de votre frontend
2. Les URLs doivent inclure le protocole (`https://`)

### Le service se met en veille (Free Plan)

Sur le plan gratuit, Render met les services en veille après 15 minutes d'inactivité. Le premier démarrage peut prendre 30-60 secondes.

Pour éviter cela, vous pouvez :
- Utiliser un service de ping automatique (UptimeRobot, etc.)
- Passer au plan payant

## Configuration OAuth (Optionnel)

Si vous voulez activer l'authentification OAuth :

1. Créez des applications OAuth sur Google/GitHub
2. Configurez les URLs de callback :
   - Google : `https://votre-backend.onrender.com/api/auth/google/callback`
   - GitHub : `https://votre-backend.onrender.com/api/auth/github/callback`
3. Ajoutez les variables d'environnement dans Render

## Stockage des fichiers

⚠️ **Important** : Sur Render (plan gratuit), le stockage est **éphémère**. Les fichiers uploadés seront perdus lors des redéploiements.

Pour un stockage persistant, utilisez :
- AWS S3
- Cloudinary
- Google Cloud Storage
- Autre service de stockage cloud

## Prochaines étapes

Une fois le backend déployé :

1. Notez l'URL du backend (ex: `https://supfile-backend.onrender.com`)
2. Déployez le frontend et configurez-le pour utiliser cette URL
3. Mettez à jour `CORS_ORIGIN` dans le backend avec l'URL du frontend

## Support

- Documentation Render : https://render.com/docs
- Logs du service : Dashboard Render → Votre service → Logs


