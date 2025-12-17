# Configuration OAuth2 pour SUPFile

Ce document explique comment configurer l'authentification OAuth2 pour Google, GitHub et Microsoft.

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` du backend :

```env
# OAuth Google
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=[REDACTED]
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# OAuth GitHub
GITHUB_CLIENT_ID=votre_client_id_github
GITHUB_CLIENT_SECRET=[REDACTED]
GITHUB_REDIRECT_URI=http://localhost:5000/api/auth/github/callback

# OAuth Microsoft
MICROSOFT_CLIENT_ID=votre_client_id_microsoft
MICROSOFT_CLIENT_SECRET=votre_client_secret_microsoft
MICROSOFT_REDIRECT_URI=http://localhost:5000/api/auth/microsoft/callback

# Session secret (pour les sessions OAuth)
SESSION_SECRET=[REDACTED]

# URL du frontend (pour les redirections après OAuth)
FRONTEND_URL=http://localhost:3000
```

## Configuration Google OAuth2

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API "Google+ API" ou "Google Identity Services API"
4. Allez dans "Identifiants" > "Créer des identifiants" > "ID client OAuth 2.0"
5. Type d'application : Application Web
6. **IMPORTANT** : URI de redirection autorisés : 
   - Option 1 (recommandé) : `http://localhost:5000/api/auth/google/callback` (backend directement)
   - Option 2 (si vous utilisez le proxy frontend) : `http://localhost:3000/auth/callback/google` (frontend qui redirige vers le backend)
7. Copiez le Client ID et le Client Secret dans votre `.env`
8. Dans votre `.env`, définissez `GOOGLE_REDIRECT_URI` selon l'option choisie :
   - Option 1 : `GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback`
   - Option 2 : `GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback` (le backend doit toujours recevoir le callback)

## Configuration GitHub OAuth2

1. Allez sur [GitHub Developer Settings](https://github.com/settings/developers)
2. Cliquez sur "New OAuth App"
3. Remplissez :
   - Application name : SUPFile
   - Homepage URL : `http://localhost:3000`
   - Authorization callback URL : `http://localhost:5000/api/auth/github/callback`
4. Copiez le Client ID et générez un Client Secret
5. Ajoutez-les dans votre `.env`

## Configuration Microsoft OAuth2

1. Allez sur [Azure Portal](https://portal.azure.com/)
2. Allez dans "Azure Active Directory" > "App registrations" > "New registration"
3. Remplissez :
   - Name : SUPFile
   - Supported account types : Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI : `http://localhost:5000/api/auth/microsoft/callback` (type: Web)
4. Après création, allez dans "Certificates & secrets" > "New client secret"
5. Copiez le Client ID et le Client Secret dans votre `.env`

## Routes disponibles

- `GET /api/auth/google` - Initie l'authentification Google
- `GET /api/auth/google/callback` - Callback Google
- `GET /api/auth/github` - Initie l'authentification GitHub
- `GET /api/auth/github/callback` - Callback GitHub
- `GET /api/auth/microsoft` - Initie l'authentification Microsoft
- `GET /api/auth/microsoft/callback` - Callback Microsoft

## Fonctionnement

1. L'utilisateur clique sur un bouton OAuth (Google, GitHub, Microsoft)
2. Il est redirigé vers le fournisseur OAuth pour autoriser l'application
3. Après autorisation, le fournisseur redirige vers le callback backend
4. Le backend génère des tokens JWT et redirige vers le frontend avec les tokens
5. Le frontend stocke les tokens et connecte l'utilisateur

## Notes importantes

- Les comptes OAuth n'ont pas de mot de passe (`password_hash` est `null`)
- Si un utilisateur existe déjà avec le même email (compte email/password), les infos OAuth sont ajoutées au compte existant
- Un dossier racine "Root" est automatiquement créé pour chaque nouvel utilisateur OAuth
- Les secrets OAuth ne doivent JAMAIS être commités dans le dépôt Git

