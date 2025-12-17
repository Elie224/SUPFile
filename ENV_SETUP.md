# Configuration des variables d'environnement - SUPFile

Ce document décrit toutes les variables d'environnement nécessaires pour faire fonctionner SUPFile.

## Fichier .env

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# ============================================
# Base de données MongoDB
# ============================================
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=change_me_secure_password
MONGO_INITDB_DATABASE=supfile

# ============================================
# Serveur API
# ============================================
NODE_ENV=development
SERVER_PORT=5000
SERVER_HOST=0.0.0.0

# ============================================
# Sécurité JWT
# ============================================
# IMPORTANT : Générez des secrets forts et uniques !
# Utilisez : openssl rand -base64 32
JWT_SECRET=[REDACTED]
JWT_REFRESH_SECRET=[REDACTED]

# ============================================
# Upload de fichiers
# ============================================
# Taille maximale d'un fichier (en octets)
# Par défaut : 30 Go (32212254720 octets)
MAX_FILE_SIZE=32212254720
UPLOAD_DIR=./uploads

# ============================================
# CORS
# ============================================
# Origines autorisées (séparées par des virgules)
CORS_ORIGIN=http://localhost:3000,http://localhost:19000

# ============================================
# Frontend Web
# ============================================
# URL de l'API backend (utilisée par Vite)
VITE_API_URL=http://localhost:5000

# ============================================
# OAuth2 (Optionnel - pour fonctionnalité OAuth)
# ============================================
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=[REDACTED]

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=[REDACTED]

# Microsoft OAuth (optionnel)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

## Génération de secrets sécurisés

### Linux/macOS
```bash
openssl rand -base64 32
```

### Windows (PowerShell)
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)))
```

## Variables critiques

⚠️ **IMPORTANT** : Ne commitez JAMAIS le fichier `.env` dans Git ! Il contient des secrets sensibles.

Les variables les plus critiques à modifier sont :
- `MONGO_INITDB_ROOT_PASSWORD` : Mot de passe de l'administrateur MongoDB
- `JWT_SECRET` : Secret pour signer les tokens JWT
- `JWT_REFRESH_SECRET` : Secret pour signer les refresh tokens

## Notes

- Le fichier `.env` est déjà dans `.gitignore` pour éviter les commits accidentels
- Les valeurs par défaut dans `docker-compose.yml` sont uniquement pour le développement
- En production, utilisez des secrets gérés par votre plateforme (Docker Secrets, Kubernetes Secrets, etc.)







