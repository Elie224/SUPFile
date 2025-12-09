# Installation et Déploiement - SUPFile

## Pré-requis système

### Windows
- **Docker Desktop for Windows** (v4.0+)
- **Git for Windows** (v2.30+)
- **Node.js** (v18+) - optionnel, pour dev local

Télécharger :
- Docker : https://www.docker.com/products/docker-desktop
- Git : https://git-scm.com/download/win

### macOS
- **Docker Desktop for Mac** (v4.0+)
- **Git** (inclu dans Xcode Command Line Tools)
- **Node.js** (v18+) - optionnel

```bash
# Installer via Homebrew
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

**Note** : Assurez-vous que le dépôt est **PRIVÉ** jusqu'à la date de rendu !

### 2️⃣ Configurer les variables d'environnement

```bash
cp .env.example .env
```

**Éditer `.env`** et modifier les secrets (TRÈS IMPORTANT) :

```env
# Générer des secrets forts
POSTGRES_PASSWORD=your_secure_password_here_32_chars
JWT_SECRET=[REDACTED]
JWT_REFRESH_SECRET=[REDACTED]
```

**Générer des secrets forts** :

```bash
# Linux/macOS
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)))
```

### 3️⃣ Démarrer l'application

```bash
docker compose up -d
```

Attendre ~30 secondes que tout démarre.

Vérifier le statut :
```bash
docker compose ps
```

Tous les services doivent être **UP**.

---

## Accès aux applications

| Service | URL | Description |
|---------|-----|-------------|
| **API Backend** | http://localhost:5000/health | Endpoint de vérification |
| **Web Frontend** | http://localhost:3000 | Application web |
| **Mobile (Expo)** | http://localhost:19000 | Tunnel Expo |
| **PostgreSQL** | localhost:5432 | Base de données (port interne) |

### Vérifier la santé de l'API

```bash
curl http://localhost:5000/health
# Réponse attendue : {"status":"OK","message":"SUPFile API is running"}
```

---

## Développement local (sans Docker)

Pour développer directement sur la machine (plus rapide que Docker) :

### Backend

```bash
cd backend
npm install
cp ../.env .env.local    # Copier et adapter les vars

npm run dev              # Démarre sur port 5000
```

### Frontend Web

```bash
cd frontend-web
npm install
npm run dev              # Démarre sur port 3000
```

### Mobile

```bash
cd mobile-app
npm install
npm start                # Démarre Expo CLI
```

**Pour PostgreSQL en dev** : Vous aurez besoin d'une instance postgres locale ou via Docker :

```bash
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=supfile \
  -p 5432:5432 \
  postgres:16-alpine
```

---

## Gestion des données

### Initialiser la base de données

Les tables sont créées automatiquement au premier démarrage du backend.

Pour initialiser manuellement :

```bash
# Copier le schéma SQL dans la BDD
docker exec supfile-db psql -U supfile_user -d supfile < backend/migrations/001_initial_schema.sql
```

### Accéder à PostgreSQL

```bash
# Connexion interactif
docker exec -it supfile-db psql -U supfile_user -d supfile

# Commandes utiles dans psql
\dt              # Lister tables
\d users         # Décrire table users
SELECT * FROM users;
\q              # Quitter
```

### Sauvegarder la BDD

```bash
# Dump complet
docker exec supfile-db pg_dump -U supfile_user supfile > backup.sql

# Restaurer
docker exec -i supfile-db psql -U supfile_user supfile < backup.sql
```

### Nettoyer les données

```bash
# Supprimer TOUS les volumes (= réinitialiser BDD et fichiers)
docker compose down -v

# Relancer
docker compose up -d
```

---

## Logs et débogage

### Voir les logs en temps réel

```bash
# Tous les services
docker compose logs -f

# Service spécifique
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f frontend
```

### Entrer dans un conteneur

```bash
# Shell backend
docker exec -it supfile-backend sh

# Shell PostgreSQL
docker exec -it supfile-db sh

# Shell frontend
docker exec -it supfile-frontend sh
```

### Vérifier les volumes

```bash
# Lister les volumes
docker volume ls

# Inspecter un volume
docker volume inspect SUPFile_db_data
docker volume inspect SUPFile_backend_data
```

---

## Tests

### Tests backend

```bash
cd backend
npm install
npm test
```

### Tests frontend

```bash
cd frontend-web
npm install
npm test
```

### Tests e2e (à implémenter)

```bash
# Avec Cypress ou Playwright
npm run test:e2e
```

---

## Déploiement en production

### Pré-checklist

- ✅ Secrets en `.env` (jamais en git)
- ✅ HTTPS activé (certificats SSL)
- ✅ CORS configuré pour domaines autorisés
- ✅ Rate limiting activé
- ✅ Logs centralisés (syslog, ELK, etc.)
- ✅ Monitoring et alertes
- ✅ Backups BDD réguliers
- ✅ Variables d'env sécurisées (AWS Secrets Manager, etc.)

### Stack production recommandée

**Option 1 : AWS ECS**
```yaml
- ECS Cluster (Docker containers)
- RDS PostgreSQL (managed DB)
- S3 (file storage à la place du volume)
- CloudFront (CDN)
- ALB (load balancer)
- CloudWatch (logging)
```

**Option 2 : Kubernetes**
```yaml
- EKS/AKS/GKE (managed K8s)
- CloudSQL/RDS (managed DB)
- Object Storage (S3, GCS, Azure Blob)
- Ingress (routing)
- Prometheus (monitoring)
```

**Option 3 : VPS (DigitalOcean, Linode)**
```bash
# Sur VPS - installer Docker, docker-compose
# Adapter docker-compose.yml pour prod (sans volumes locaux)
# Utiliser Nginx reverse proxy + Let's Encrypt
```

### Exemple : Déploiement DigitalOcean App Platform

```yaml
# .do/app.yaml
name: supfile
services:
- name: backend
  github:
    branch: main
    repo: your-repo
  build_command: npm install
  run_command: npm start
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_URI
    scope: RUN_AND_BUILD_TIME
    value: ${db.username}:${db.password}@${db.host}:${db.port}/${db.database}

- name: frontend
  github:
    branch: main
    repo: your-repo
  build_command: cd frontend-web && npm install && npm run build
  source_dir: frontend-web

databases:
- name: db
  engine: PG
  version: "16"
  production: true
```

---

## Troubleshooting

### "Port 5000 déjà utilisé"

```bash
# Voir le processus
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # macOS/Linux

# Tuer le processus
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux
```

### "BDD ne démarre pas"

```bash
# Voir les logs
docker compose logs db

# Réinitialiser
docker compose down -v
docker compose up -d
```

### "Frontend ne se connecte pas à l'API"

- Vérifier VITE_API_URL dans `.env`
- Vérifier que backend est UP : `docker compose ps`
- Vérifier CORS dans `backend/config.js`

### "Erreur JWT"

```bash
# Vérifier que JWT_SECRET est défini
grep JWT_SECRET .env

# JWT_SECRET doit être > 32 caractères fort
```

### "Disk space full"

```bash
# Nettoyer volumes inutilisés
docker volume prune

# Nettoyer images inutilisées
docker image prune -a

# Voir l'espace utilisé
docker system df
```

---

## Continuité intégration (CI/CD)

### GitHub Actions (exemple)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: docker compose build
      
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend-web && npm test
      
      - name: Push to registry
        run: docker push ...
```

---

## Support et questions

1. Consulter `QUICKSTART.md` pour démarrage rapide
2. Lire `ARCHITECTURE.md` pour architecture détaillée
3. Vérifier les logs : `docker compose logs -f`
4. Vérifier `.env` : secrets en place?
5. Redémarrer : `docker compose restart`

---

Document créé : Décembre 2025
