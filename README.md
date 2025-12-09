# SUPFile - Cloud Storage Platform

Une plateforme de stockage cloud distribuée, moderne et sécurisée, concurrente de Dropbox et Google Drive.

## 📋 Table des matières

- [Structure du projet](#structure-du-projet)
- [Installation et prérequis](#installation-et-prérequis)
- [Déploiement avec Docker](#déploiement-avec-docker)
- [Architecture générale](#architecture-générale)
- [Documentation API](#documentation-api)
- [Contribuer](#contribuer)

---

## 📁 Structure du projet

```
SUPFile/
├─ backend/                 # API serveur (Node.js/Express)
│  ├─ controllers/          # Logique métier des endpoints
│  ├─ models/               # Schémas BDD (PostgreSQL)
│  ├─ routes/               # Définition des routes API
│  ├─ middlewares/          # Auth, validation, gestion d'erreurs
│  ├─ utils/                # Utilitaires (ZIP, prévisualisation, etc.)
│  ├─ app.js                # Point d'entrée serveur
│  ├─ config.js             # Configuration centralisée
│  ├─ package.json
│  └─ Dockerfile
│
├─ frontend-web/            # Client web (React + Vite)
│  ├─ src/
│  │  ├─ components/        # Composants réutilisables
│  │  ├─ pages/             # Pages principales
│  │  ├─ services/          # Appels API
│  │  └─ main.jsx
│  ├─ vite.config.js
│  ├─ package.json
│  └─ Dockerfile
│
├─ mobile-app/              # Client mobile (React Native/Expo)
│  ├─ src/
│  │  ├─ screens/           # Écrans de navigation
│  │  ├─ components/        # Composants réutilisables
│  │  └─ services/          # Appels API
│  ├─ package.json
│  └─ Dockerfile
│
├─ docker-compose.yml       # Orchestration des services
├─ .env.example             # Exemple de variables d'environnement
├─ .gitignore
└─ README.md                # Ce fichier
```

---

## ⚙️ Installation et prérequis

### Pré-requis

- **Docker** (v20.10+) et **Docker Compose** (v1.29+)
- **Node.js** (v18+) - pour développement local (optionnel si Docker)
- **Git**

### Étapes d'installation

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-depot>
   cd SUPFile
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   ⚠️ **IMPORTANT** : Éditer le fichier `.env` et changer les valeurs par défaut, notamment :
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

3. **Vérifier que Docker est en cours d'exécution**
   ```bash
   docker --version
   docker compose --version
   ```

---

## 🐳 Déploiement avec Docker

### Lancer l'application complète

```bash
docker compose up -d
```

Cela va :
- ✓ Créer et démarrer la base de données PostgreSQL
- ✓ Compiler et démarrer le serveur API (backend)
- ✓ Compiler et démarrer le client web (frontend)
- ✓ Compiler et démarrer le client mobile (Expo)

### Vérifier le statut des services

```bash
docker compose ps
```

### Accéder aux applications

| Service | URL | Statut |
|---------|-----|--------|
| API Backend | http://localhost:5000/health | [Vérifier](http://localhost:5000/health) |
| Web Frontend | http://localhost:3000 | [Ouvrir](http://localhost:3000) |
| Mobile (Expo) | http://localhost:19000 | [Ouvrir](http://localhost:19000) |
| PostgreSQL | localhost:5432 | - |

### Arrêter l'application

```bash
docker compose down
```

### Nettoyer les volumes (réinitialiser la BDD et les fichiers)

```bash
docker compose down -v
```

---

## 🏗️ Architecture générale

### Vue d'ensemble

```
┌─────────────────┐         ┌──────────────────┐
│  Frontend Web   │         │ Mobile App       │
│  (React/Vite)   │         │ (React Native)   │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   API REST (Express)    │
         │   - Auth & Sécurité     │
         │   - Gestion fichiers    │
         │   - Partage & BDD       │
         └────────────┬────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
    ┌──────────┐         ┌──────────────────┐
    │PostgreSQL│         │ Volume Docker    │
    │   BDD    │         │ (Fichiers)       │
    └──────────┘         └──────────────────┘
```

### Composants principaux

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Backend** | Node.js + Express | API REST, logique métier, authentification |
| **Frontend Web** | React + Vite | Interface utilisateur web |
| **Mobile** | React Native + Expo | Application mobile (iOS/Android) |
| **BDD** | PostgreSQL | Stockage des métadonnées |
| **Stockage** | Volume Docker | Fichiers utilisateurs |

---

## 📡 Documentation API

### Endpoints principaux

**Note** : Tous les endpoints (sauf login/signup) nécessitent un JWT valide dans le header `Authorization: Bearer <token>`

#### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/signup` | Créer un compte (email/mdp) |
| POST | `/api/auth/login` | Connexion standard |
| POST | `/api/auth/oauth` | Connexion OAuth2 (Google, GitHub) |
| POST | `/api/auth/refresh` | Rafraîchir le token JWT |
| POST | `/api/auth/logout` | Déconnexion |

#### Fichiers et dossiers

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/files` | Lister fichiers/dossiers |
| POST | `/api/files/upload` | Uploader un fichier |
| POST | `/api/folders` | Créer un dossier |
| PATCH | `/api/files/:id` | Renommer/déplacer |
| DELETE | `/api/files/:id` | Supprimer |
| GET | `/api/files/:id/download` | Télécharger fichier |
| GET | `/api/files/:id/preview` | Prévisualiser (image/PDF/texte) |
| GET | `/api/files/:id/stream` | Streaming audio/vidéo |

#### Partage

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/share/public` | Générer lien public |
| POST | `/api/share/internal` | Partager avec un utilisateur |
| GET | `/api/share/:token` | Accéder lien public (sans login) |

#### Dashboard et recherche

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/dashboard` | Quota, fichiers récents |
| GET | `/api/search` | Recherche par nom/type/date |

Voir la documentation complète dans `docs/API.md` (à créer).

---

## 🔐 Sécurité

### Points importants

- ✓ **Pas de secrets en clair** : Utiliser `.env` et Docker secrets
- ✓ **Hachage des mots de passe** : bcryptjs avec salt
- ✓ **JWT** : Tokens expirables (1h) avec refresh tokens (7j)
- ✓ **CORS** : Configuré pour les domaines autorisés
- ✓ **Validation** : Tous les inputs validés côté serveur
- ✓ **Rate limiting** : À implémenter pour les endpoints sensibles

### Secrets à ne JAMAIS commiter

```
.env              # Variables d'environnement
.env.local        # Config locale
*.key             # Clés privées
.aws/             # Credentials AWS
```

---

## 📚 Documentation supplémentaire

Voir le dossier `docs/` pour :
- `ARCHITECTURE.md` - Diagrammes UML et architecture détaillée
- `API.md` - Spécification complète de l'API
- `DATABASE.md` - Schéma BDD et migrations
- `INSTALLATION.md` - Guide d'installation avancé
- `CONTRIBUTING.md` - Guide de contribution

---

## 🚀 Commandes utiles

### Développement local (sans Docker)

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (nouveau terminal)
cd frontend-web
npm install
npm run dev

# Mobile (nouveau terminal)
cd mobile-app
npm install
npm start
```

### Logs et débogage

```bash
# Voir logs d'un service
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f frontend

# Accéder au shell d'un conteneur
docker exec -it supfile-backend sh
docker exec -it supfile-db psql -U supfile_user -d supfile
```

### Tests

```bash
# Tests backend
cd backend
npm test

# Tests frontend
cd frontend-web
npm test

# Tests mobile
cd mobile-app
npm test
```

---

## 📝 Git et versioning

Historique de commits : Consultez `git log` pour l'historique de développement.

```bash
git log --oneline --graph --all
```

---

## 📞 Support et questions

Pour toute question :
1. Consulter la documentation dans `docs/`
2. Vérifier les logs Docker
3. Ouvrir une issue sur le dépôt (si configuration disponible)

---

## 📄 Licence

Ce projet est développé pour SUPFile.

**Date de création** : Décembre 2025
**Dernière mise à jour** : Décembre 2025

---

## Checklist de démarrage

- [ ] Cloner le dépôt
- [ ] Copier `.env.example` → `.env` et configurer
- [ ] Exécuter `docker compose up -d`
- [ ] Vérifier que tous les services sont UP (`docker compose ps`)
- [ ] Accéder à http://localhost:3000 (frontend web)
- [ ] Accéder à http://localhost:5000/health (API)
- [ ] Lire la documentation complète dans `docs/`
