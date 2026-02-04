# Installation et Déploiement - SUPFile

## Pré-requis système

### Windows
- **Docker Desktop for Windows** (v4.0+)
- **Git for Windows** (v2.30+)
- **Node.js** (v18+) – optionnel, pour le développement local

Télécharger :
- Docker : https://www.docker.com/products/docker-desktop
- Git : https://git-scm.com/download/win

### macOS
- **Docker Desktop for Mac** (v4.0+)
- **Git** (inclus dans Xcode Command Line Tools)
- **Node.js** (v18+) – optionnel

```bash
brew install docker git node
```

### Linux (Ubuntu/Debian)
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Git et Node
sudo apt-get update
sudo apt-get install git nodejs npm
```

---

## Installation en 3 étapes

### 1️⃣ Cloner le dépôt

```bash
git clone <URL_DEPOT_PRIVÉ>
cd SUPFile
```

**Important** : le dépôt doit rester **privé** jusqu’à la date de rendu du projet.

### 2️⃣ Configurer les variables d’environnement

```bash
cp .env.example .env
```

Éditer **`.env`** et remplacer les valeurs par défaut (aucun secret ne doit rester en clair) :

```env
# Base de données MongoDB (Docker)
MONGO_INITDB_ROOT_USERNAME=supfile_root
MONGO_INITDB_ROOT_PASSWORD=votre_mot_de_passe_mongo_secure
MONGO_INITDB_DATABASE=supfile
MONGO_URI=[REDACTED]

# JWT (générer des secrets forts, au moins 32 caractères)
JWT_SECRET=[REDACTED]
JWT_REFRESH_SECRET=[REDACTED]
```

**Générer des secrets forts** :

```bash
# Linux / macOS
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

### 3️⃣ Démarrer l’application

```bash
docker compose up -d
```

Attendre environ 30 secondes que les services démarrent.

Vérifier le statut :

```bash
docker compose ps
```

Tous les services doivent être **Up**.

---

## Accès aux applications

| Service           | URL                         | Description        |
|-------------------|-----------------------------|--------------------|
| **API Backend**   | http://localhost:5000/health | Vérification santé |
| **Frontend Web**  | http://localhost:3000       | Application web    |
| **MongoDB**       | localhost:27017             | Base de données (interne) |

### Vérifier la santé de l’API

```bash
curl http://localhost:5000/health
# Réponse attendue : {"status":"OK","message":"SUPFile API is running"}
```

---

## Développement local (sans Docker)

Pour développer directement sur la machine :

### Backend

```bash
cd backend
npm install
cp ../.env .env   # ou .env.local, et adapter MONGO_URI pour localhost

npm run dev       # Démarre sur le port 5000
```

MongoDB doit être accessible (Docker : `docker compose up -d db` ou instance locale).

### Frontend Web

```bash
cd frontend-web
npm install
npm run dev       # Démarre sur le port 3000
```

### Application mobile (Flutter)

```bash
cd mobile-app
flutter pub get
flutter run        # Ou ouvrir avec Android Studio / Xcode
```

Configurer l’URL de l’API dans `mobile-app/lib/utils/constants.dart` (ou via variables d’environnement) pour pointer vers le backend (ex. `http://10.0.2.2:5000` pour l’émulateur Android).

---

## Gestion des données

### Initialisation de la base de données

MongoDB crée les collections à la demande au premier usage. Le backend initialise les index au démarrage.

Pour réinitialiser complètement :

```bash
docker compose down -v
docker compose up -d
```

### Connexion à MongoDB (debug)

```bash
# Connexion au conteneur
docker exec -it supfile-db mongosh -u supfile_root -p --authenticationDatabase admin

# Dans mongosh : utiliser la base supfile
use supfile
show collections
db.users.find().limit(5)
exit
```

### Nettoyage des données

```bash
# Supprimer tous les volumes (BDD et fichiers uploadés)
docker compose down -v

# Redémarrer
docker compose up -d
```

---

## Logs et débogage

### Consulter les logs

```bash
# Tous les services
docker compose logs -f

# Par service
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f frontend
```

### Accéder à un conteneur

```bash
docker exec -it supfile-backend sh
docker exec -it supfile-db mongosh -u supfile_root -p --authenticationDatabase admin
```

---

## Tests

### Backend

```bash
cd backend
npm install
npm test
```

### Frontend

```bash
cd frontend-web
npm install
npm test
```

---

## Déploiement en production

### Checklist avant mise en production

- [ ] Tous les secrets dans des variables d’environnement (jamais dans le code ni dans Git)
- [ ] HTTPS activé (certificats SSL)
- [ ] CORS configuré pour les domaines autorisés uniquement
- [ ] Rate limiting activé
- [ ] Logs et monitoring en place
- [ ] Sauvegardes régulières de la BDD et du volume des fichiers

### Options de déploiement

- **Render / Railway / Fly.io** : déploiement du backend et du frontend ; MongoDB managé (MongoDB Atlas) ou conteneur.
- **VPS (DigitalOcean, OVH, etc.)** : installer Docker, utiliser `docker compose` avec un reverse proxy (Nginx) et Let’s Encrypt pour le HTTPS.
- **MongoDB Atlas** : pour la base de données, utiliser une URI du type `mongodb+srv://[REDACTED]` dans `MONGO_URI`.

Voir aussi `backend/DEPLOIEMENT_FLY.md` pour le déploiement du backend sur Fly.io.

---

## Dépannage

### Port 5000 déjà utilisé

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS / Linux
lsof -i :5000
kill -9 <PID>
```

### La base de données ne démarre pas

```bash
docker compose logs db
docker compose down -v
docker compose up -d
```

### Le frontend ne se connecte pas à l’API

- Vérifier `VITE_API_URL` dans `.env` (ou dans la config du frontend).
- Vérifier que le backend est démarré : `docker compose ps`.
- Vérifier la configuration CORS dans le backend.

### Erreur JWT

- Vérifier que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont définis dans `.env`.
- Ils doivent contenir au moins 32 caractères et être suffisamment aléatoires.

---

Document créé : Décembre 2025
