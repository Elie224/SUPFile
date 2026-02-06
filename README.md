# SUPFile - Cloud Storage Platform

Une plateforme de stockage cloud distribuée, moderne et sécurisée, concurrente de Dropbox et Google Drive.

## 📋 Table des matières

- [Structure du projet](#structure-du-projet)
- [Installation et prérequis](#installation-et-prérequis)
- [Déploiement avec Docker](#déploiement-avec-docker)
- [Architecture générale](#architecture-générale)
- [Pages légales](#pages-légales)
- [Documentation](#documentation)
- [Documentation API](#documentation-api)
- [Contribuer](#contribuer)

---

## 📁 Structure du projet

```
SUPFile/
├─ backend/                 # API serveur (Node.js/Express)
│  ├─ controllers/          # Logique métier des endpoints
│  ├─ models/               # Schémas BDD (MongoDB / Mongoose)
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
├─ mobile-app/              # Client mobile (Flutter)
│  ├─ lib/
│  │  ├─ screens/          # Écrans
│  │  ├─ widgets/          # Composants
│  │  └─ services/         # Appels API
│  ├─ pubspec.yaml
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

2. **(Optionnel) Configurer les variables d'environnement**
   - Pour un démarrage rapide en local, **aucun `.env` n'est requis** : le `docker-compose.yml` lance MongoDB (sans auth) + backend + frontend, et le backend **génère des secrets JWT** automatiquement en mode development.
   - Pour une configuration plus réaliste (ou production), copiez le template et renseignez vos secrets via variables d'environnement :
     ```bash
     cp .env.example .env
     ```
     ⚠️ **IMPORTANT** : ne jamais commiter `.env`.

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
- ✓ Créer et démarrer la base de données MongoDB
- ✓ Compiler et démarrer le serveur API (backend)
- ✓ Compiler et démarrer le client web (frontend)

### Vérifier le statut des services

```bash
docker compose ps
```

### Accéder aux applications

| Service | URL | Statut |
|---------|-----|--------|
| API Backend | http://localhost:5000/health | [Vérifier](http://localhost:5000/health) |
| Web Frontend | http://localhost:3000 | [Ouvrir](http://localhost:3000) |
| MongoDB | localhost:27017 | (interne) |

Notes :
- En Docker Compose, le frontend reverse-proxy l'API via `http://localhost:3000/api/...` (same-origin).
- Le stockage fichiers persiste via un volume Docker monté sur le backend (`/usr/src/app/uploads`).

### Arrêter l'application

```bash
docker compose down
```

### Nettoyer les volumes (réinitialiser la BDD et les fichiers)

```bash
docker compose down -v
```

---

## ▶️ Lancer Flutter (mobile + web)

L’app Flutter lit l’URL de l’API via `--dart-define=API_URL=...` (valeur par défaut : `https://supfile.fly.dev`).

### Mobile

```bash
cd mobile-app
flutter pub get
flutter run --dart-define=API_URL=https://supfile.fly.dev
```

### Web (Chrome + port fixe)

```bash
cd mobile-app
flutter pub get
flutter run -d chrome --web-port=64137 --dart-define=API_URL=https://supfile.fly.dev
```

Pour Google Sign-In côté Flutter Web : voir `docs/GOOGLE_OAUTH.md`.

---

## 🏗️ Architecture générale

### Vue d'ensemble

```
┌─────────────────┐         ┌──────────────────┐
│  Frontend Web   │         │ Mobile App       │
│  (React/Vite)   │         │ (Flutter)        │
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
    │ MongoDB  │         │ Volume Docker    │
    │   BDD    │         │ (Fichiers)       │
    └──────────┘         └──────────────────┘
```

### Composants principaux

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Backend** | Node.js + Express | API REST, logique métier, authentification |
| **Frontend Web** | React + Vite | Interface utilisateur web |
| **Mobile** | Flutter (Dart) | Application mobile iOS/Android |
| **BDD** | MongoDB | Stockage des métadonnées (Mongoose) |
| **Stockage** | Volume Docker | Fichiers utilisateurs |

---

## 📦 Rendu du projet (section 3 – Cahier des charges)

- **Archive ZIP** : le rendu doit contenir une archive ZIP avec le code source, les assets, la documentation technique et le manuel utilisateur.
- **Documentation technique** : voir le dossier `docs/` :
  - **Installation et pré-requis** : `docs/INSTALLATION.md`
   - **Guide de déploiement** : `docs/INSTALLATION.md` (Docker) et `backend/DEPLOIEMENT_FLY.md` (Fly.io)
  - **Justification des choix technologiques** : `docs/ARCHITECTURE.md` (sections 10 et 11)
  - **Diagrammes UML** (cas d’utilisation, schéma relationnel BDD) : `docs/DIAGRAMMES_UML.md`
  - **Architecture de l’API** (endpoints principaux) : `docs/API.md` et résumé dans `docs/DIAGRAMMES_UML.md`
- **Manuel utilisateur** : `docs/MANUEL_UTILISATEUR.md` (fonctionnalités et guide pour un nouvel arrivant).
- **Secrets** : aucun secret (clés OAuth, mots de passe BDD, secrets JWT) ne doit être présent en clair dans le code. Tous les secrets sont configurés via des variables d’environnement (voir `.env.example`).
- **Dépôt Git** : un dépôt Git avec un historique de commits cohérent doit être fourni. Le dépôt doit rester **privé** jusqu’à la date d’échéance du rendu ; il peut être rendu public uniquement après cette date.

Voir **`docs/RENDU.md`** pour le détail des exigences de rendu et la checklist avant envoi.

---

## 📄 Pages légales

   - `/politique-confidentialite`
   - `/conditions-utilisation`
   - `/mentions-legales`

## 📡 Documentation API

### Endpoints principaux

**Note** : Tous les endpoints (sauf login/signup) nécessitent un JWT valide dans le header `Authorization: Bearer <token>`

## 📚 Documentation

- Configuration SMTP (Gmail/Google) : voir `docs/CONFIGURATION_SMTP.md`
- Manuel utilisateur (inclut validation email + mot de passe oublié) : voir `docs/MANUEL_UTILISATEUR.md`
- API (endpoints auth : verify-email / forgot-password / reset-password) : voir `docs/API.md`

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

Voir la documentation complète dans `docs/API.md`.

---

## 🔐 Sécurité

### Points importants

- ✓ **Pas de secrets en clair** : Utiliser `.env` et Docker secrets
- ✓ **Hachage des mots de passe** : bcryptjs avec salt
- ✓ **JWT** : Tokens expirables (1h) avec refresh tokens (7j)
- ✓ **CORS** : Configuré pour les domaines autorisés
- ✓ **Validation** : Tous les inputs validés côté serveur
- ✓ **Rate limiting** : Appliqué sur les endpoints sensibles (auth, reset, etc.)

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
- `DATABASE.md` - Modèles/collections MongoDB (vue logique + références)
- `INSTALLATION.md` - Guide d'installation avancé
- `CONTRIBUTING.md` - Guide de contribution

Documents historiques / brouillons (déplacements, diagnostics, corrections) : voir `docs/archive/`.

Scripts utiles (Windows/Linux) : voir `scripts/`.

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
flutter pub get
flutter run --dart-define=API_URL=https://supfile.fly.dev
```

### Logs et débogage

```bash
# Voir logs d'un service
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f frontend

# Accéder au shell d'un conteneur
docker exec -it supfile-backend sh
docker compose exec db mongosh
```

### Tests

```bash
# Tests backend
cd backend
npm test

# Lint frontend
cd frontend-web
npm run lint

# Tests/analyse mobile
cd mobile-app
flutter analyze
flutter test
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
