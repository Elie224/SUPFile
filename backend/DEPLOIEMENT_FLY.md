# Déploiement backend SUPFile sur Fly.io

## 1. Secrets obligatoires

Sans ces secrets, **connexion et inscription ne fonctionnent pas** (l’app peut démarrer puis crasher au premier chargement des routes).

À définir depuis le dossier `backend` :

```bash
fly secrets set MONGO_URI="[REDACTED]"
fly secrets set JWT_SECRET="[REDACTED]"
fly secrets set JWT_REFRESH_SECRET="[REDACTED]"
fly secrets set SESSION_SECRET="[REDACTED]"
```

Vérifier les secrets : `fly secrets list`

## 2. Optionnel : CORS

Si votre frontend est sur une autre origine, ajoutez-la :

```bash
fly secrets set CORS_ORIGIN="https://votre-frontend.netlify.app,http://localhost:5173"
```

## 3. Optionnel : OAuth (Google / GitHub)

Si vous utilisez la connexion avec Google ou GitHub, définir les redirect URI sur **https://supfile.fly.dev** (pas Render) et les secrets :

```bash
fly secrets set GOOGLE_CLIENT_ID="..."
fly secrets set GOOGLE_CLIENT_SECRET="[REDACTED]"
fly secrets set GOOGLE_REDIRECT_URI="https://supfile.fly.dev/api/auth/google/callback"

# Recommandé : autoriser plusieurs client IDs (Web + Android + iOS) pour la vérification des tokens mobiles
fly secrets set GOOGLE_ALLOWED_CLIENT_IDS="<CLIENT_ID_WEB>,<CLIENT_ID_ANDROID>,<CLIENT_ID_IOS>"

fly secrets set GITHUB_CLIENT_ID="..."
fly secrets set GITHUB_CLIENT_SECRET="[REDACTED]"
fly secrets set GITHUB_REDIRECT_URI="https://supfile.fly.dev/api/auth/github/callback"
```

## 4. Déploiement

```bash
cd backend
flyctl deploy --app supfile --dns-checks=false
```

## 5. Vérifier

- Health : https://supfile.fly.dev/health → doit retourner `{"status":"ok"}`
- Logs : `fly logs --app supfile`
- Si l’app crash au démarrage : vérifier que tous les secrets ci-dessus sont bien définis (`fly secrets list`).

## 6. Frontend

Le frontend doit appeler l’API à **https://supfile.fly.dev** :

- En build : `VITE_API_URL=https://supfile.fly.dev npm run build`
- Ou dans `.env` : `VITE_API_URL=https://supfile.fly.dev`

La config par défaut du frontend pointe déjà sur `https://supfile.fly.dev` si `VITE_API_URL` n’est pas défini.
