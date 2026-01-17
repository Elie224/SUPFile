# Guide de démarrage rapide - SUPFile

## 🚀 Démarrage rapide

### Option 1 : Avec Docker (Recommandé)

1. **Créer le fichier .env** (si pas déjà fait)
   ```bash
   # Copier le template
   cp ENV_SETUP.md .env
   # Puis éditer .env et remplir les valeurs
   ```

2. **Lancer tous les services**
   ```bash
   docker compose up
   ```
   
   Ou en arrière-plan :
   ```bash
   docker compose up -d
   ```

3. **Accéder à l'application**
   - Frontend : http://localhost:3000
   - Backend API : http://localhost:5000
   - MongoDB : localhost:27017

### Option 2 : Développement local (sans Docker)

#### Backend

1. **Installer les dépendances**
   ```bash
   cd backend
   npm install
   ```

2. **Créer le fichier .env dans backend/**
   ```env
   NODE_ENV=development
   SERVER_PORT=5000
   SERVER_HOST=0.0.0.0
   MONGO_URI=[REDACTED]
   JWT_SECRET=[REDACTED]
   JWT_REFRESH_SECRET=[REDACTED]
   MAX_FILE_SIZE=32212254720
   UPLOAD_DIR=./uploads
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Démarrer MongoDB** (si pas déjà lancé)
   ```bash
   # Avec Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6.0
   ```

4. **Lancer le backend**
   ```bash
   cd backend
   npm run dev
   ```

#### Frontend

1. **Installer les dépendances**
   ```bash
   cd frontend-web
   npm install
   ```

2. **Créer le fichier .env.local dans frontend-web/**
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Lancer le frontend**
   ```bash
   cd frontend-web
   npm run dev
   ```

## 📝 Configuration minimale requise

### Fichier .env à la racine (pour Docker)

```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=change_me_secure_password
MONGO_INITDB_DATABASE=supfile

# JWT Secrets (GÉNÉRER DES SECRETS FORTS !)
JWT_SECRET=[REDACTED]
JWT_REFRESH_SECRET=[REDACTED]

# Upload
MAX_FILE_SIZE=32212254720

# CORS
CORS_ORIGIN=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:5000
```

### Générer des secrets sécurisés

**Windows (PowerShell) :**
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)))
```

**Linux/macOS :**
```bash
openssl rand -base64 32
```

## 🔍 Vérifier que tout fonctionne

1. **Vérifier les services Docker**
   ```bash
   docker compose ps
   ```
   Tous les services doivent être "Up"

2. **Vérifier le backend**
   ```bash
   curl http://localhost:5000/health
   ```
   Devrait retourner : `{"status":"OK","message":"SUPFile API is running"}`

3. **Vérifier le frontend**
   Ouvrir http://localhost:3000 dans le navigateur

## 🐛 Dépannage

### Erreur de connexion MongoDB
- Vérifier que MongoDB est démarré : `docker ps | grep mongo`
- Vérifier les credentials dans .env

### Erreur CORS
- Vérifier que `CORS_ORIGIN` dans .env correspond à l'URL du frontend

### Port déjà utilisé
- Changer les ports dans docker-compose.yml ou arrêter les services qui utilisent ces ports

### Erreur de build Docker
```bash
docker compose down
docker compose build --no-cache
docker compose up
```

## 📚 Commandes utiles

```bash
# Voir les logs
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f backend
docker compose logs -f frontend

# Arrêter tous les services
docker compose down

# Arrêter et supprimer les volumes (ATTENTION : supprime les données)
docker compose down -v

# Redémarrer un service
docker compose restart backend
```








