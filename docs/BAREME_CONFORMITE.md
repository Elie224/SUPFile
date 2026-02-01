# Conformité au barème – SUPFile

Ce document relie le **barème de notation (500 points + 50 bonus)** aux éléments du projet. Une fonctionnalité est considérée comme fonctionnelle si elle est implémentée sur le **serveur** et sur les **deux clients** (web et mobile).

---

## Synthèse

| Catégorie | Points | Seuil d’ajournement | Référence dans le projet |
|-----------|--------|----------------------|---------------------------|
| Documentations | 50 | < 30 | § 1 |
| Qualité interface & UX | 20 | — | § 2 |
| Déploiement | 50 | < 25 | § 3 |
| Fonctionnalités | 190 | < 100 | § 4 |
| Qualité du code | 190 | < 100 | § 5 |
| **Total** | **500** | — | |
| Bonus | jusqu’à 50 | — | § 6 |
| Malus | jusqu’à ajournement | — | § 7 |

---

## 1. Documentations (50 points) — *Note < 30 = ajournement*

| Critère | Points | Où c’est dans le projet |
|---------|--------|--------------------------|
| **Documentation technique** | 30 | `docs/INSTALLATION.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md`, `docs/DIAGRAMMES_UML.md` — Installation, déploiement, choix technologiques, diagrammes UML (cas d’usage, schéma BDD), architecture API. |
| **Manuel utilisateur** | 20 | `docs/MANUEL_UTILISATEUR.md` — Fonctionnalités et guide pour un nouvel arrivant (web et mobile). |

---

## 2. Qualité de l’interface et UX (20 points)

| Critère | Où c’est dans le projet |
|---------|--------------------------|
| Design, ergonomie et fluidité (Web & Mobile) | Web : `frontend-web/src/` (pages, composants, `styles.css`), thème clair/sombre, responsive. Mobile : `mobile-app/lib/` (screens, widgets), thème, navigation. |

---

## 3. Déploiement (50 points) — *Note < 25 = ajournement*

| Critère | Points | Où c’est dans le projet |
|---------|--------|--------------------------|
| **Architecture et abstraction** | 30 | Backend : `backend/` (routes → middlewares → controllers → models). Clients : séparation services / UI. `docs/ARCHITECTURE.md`, `docs/DIAGRAMMES_UML.md`. |
| **Containérisation (Docker)** | 20 | `docker-compose.yml` (services db MongoDB, backend, frontend), volumes `db_data` et `backend_data`. `Dockerfile` backend, `frontend-web/Dockerfile.dev`. |

---

## 4. Fonctionnalités (190 points) — *Note < 100 = ajournement*

### 4.1 Inscription et connexion (30 points)

| Critère | Points | Serveur | Web | Mobile |
|---------|--------|---------|-----|--------|
| **Connexion standard** — Inscription avec validation, connexion sécurisée, gestion des erreurs, sessions JWT, hachage des mots de passe | 10 | `backend/controllers/authController.js`, `usersController.js`, `middlewares/authMiddleware.js`, `utils/jwt.js`, modèles User | `frontend-web/src/pages/Login.jsx`, `Signup.jsx`, `services/authStore.js`, `api.js` | `mobile-app/lib/screens/auth/`, `services/api_service.dart`, `providers/auth_provider.dart` |
| **Connexion OAuth2** — Provider tiers (Google, GitHub), création automatique du compte à la première connexion | 20 | `backend/config/passport.js`, routes `auth.js` (OAuth), `authController.js` | `frontend-web/src/pages/Login.jsx`, `OAuthProxy.jsx`, `OAuthCallback.jsx` | `mobile-app/lib/services/oauth_service.dart`, écrans auth |

### 4.2 Gestion des fichiers & dossiers (50 points)

| Critère | Points | Serveur | Web | Mobile |
|---------|--------|---------|-----|--------|
| **Navigation et organisation** — Création de dossiers, navigation fluide (Breadcrumbs), affichage de l’arborescence | 15 | `backend/controllers/foldersController.js`, `filesController.js`, modèles Folder, File | `frontend-web/src/pages/Files.jsx` (fil d’Ariane cliquable, dossiers) | `mobile-app/lib/screens/files/` (breadcrumb, dossiers) |
| **Upload** — Barre de progression, gestion des erreurs et des limites de taille | 20 | `backend/controllers/filesController.js` (upload), `middlewares/fileValidation.js`, `utils/quota.js` | `frontend-web/src/pages/Files.jsx` (upload, progression) | `mobile-app/lib/screens/files/` (upload, progression) |
| **Manipulation** — Déplacement, renommage, suppression (corbeille) | 15 | `foldersController.js`, `filesController.js` (move, rename, soft delete), routes trash | `frontend-web/src/pages/Files.jsx`, `Trash.jsx` | `mobile-app/lib/screens/files/`, `TrashScreen` |

### 4.3 Prévisualisation & téléchargement (40 points)

| Critère | Points | Serveur | Web | Mobile |
|---------|--------|---------|-----|--------|
| **Visionneuse** — Images, PDF, textes sans téléchargement ; streaming audio/vidéo | 20 | `backend/controllers/filesController.js` (`previewFile`, `streamFile`) | `frontend-web/src/pages/Preview.jsx` | `mobile-app/lib/screens/` (Preview, galerie, lecteur audio/vidéo) |
| **Téléchargement** — Fichier unitaire | 20 | `filesController.js` (`downloadFile`) | `frontend-web/src/pages/Files.jsx`, `Preview.jsx` | `mobile-app/lib/screens/files/`, services |

### 4.4 Partage & social (40 points)

| Critère | Points | Serveur | Web | Mobile |
|---------|--------|---------|-----|--------|
| **Liens publics** — URL unique pour partager fichier/dossier à l’extérieur | 20 | `backend/controllers/shareController.js`, `shareModel.js` (public_token) | `frontend-web/src/pages/Share.jsx` | `mobile-app/lib/screens/share/`, `PublicShareScreen` |
| **Partage interne** — Partage de dossiers entre utilisateurs inscrits | 20 | `shareController.js` (internal), `filesController.js` / `foldersController.js` (dossiers partagés avec moi) | `frontend-web/src/pages/Files.jsx`, `Share.jsx` | `mobile-app/lib/screens/files/`, partage interne |

### 4.5 Dashboard & Recherche (30 points)

| Critère | Points | Serveur | Web | Mobile |
|---------|--------|---------|-----|--------|
| **Tableau de bord** — Quota (espace libre/utilisé), accès rapide aux fichiers récents | 15 | `backend/controllers/dashboardController.js` ou équivalent, routes dashboard | `frontend-web/src/pages/Dashboard.jsx` | `mobile-app/lib/screens/dashboard/` |
| **Recherche** — Barre de recherche, filtres (type, date) | 15 | `backend/controllers/searchController.js`, routes search | `frontend-web/src/pages/Search.jsx` | `mobile-app/lib/screens/search/` |

---

## 5. Qualité du code (190 points) — *Note < 100 = ajournement*

Le barème item par item est **identique** à celui des fonctionnalités (§ 4). Pour un item non réalisé ou complètement dysfonctionnel, la note qualité de code correspondante est nulle.

Critères appréciés :

| Critère | Où c’est dans le projet |
|---------|--------------------------|
| Structures de données adaptées | Modèles Mongoose (`backend/models/`), DTOs, schémas de validation |
| Absence de duplication inadaptée | Services partagés, middlewares, utils (`backend/utils/`, `frontend-web/src/services/`, mobile `lib/services/`) |
| Lisibilité et nommage | Conventions cohérentes, noms explicites dans controllers, routes, composants |
| Sécurité des routes API | `authMiddleware.js`, validation (Joi), `rateLimiter.js`, pas d’exposition de `password_hash` |
| Abstraction du code | Séparation routes / controllers / models ; services API côté clients |

---

## 6. Bonus (jusqu’à 50 points)

| Exemple de bonus | Implémenté | Référence |
|------------------|------------|-----------|
| Glisser-déposer fonctionnel | Oui | Web : `frontend-web/src/pages/Files.jsx` — zone de drop pour upload, drag & drop pour déplacer fichiers/dossiers entre dossiers. |
| Partage avancé (mot de passe, date d’expiration) | Oui | Backend : `shareController.js`, `shareModel.js` (`requires_password`, `password_hash`, `expires_at`). Web : `Share.jsx`. Mobile : écrans de partage. |
| Autres (ex. chiffrement serveur, 2FA, etc.) | Partiel | 2FA : `twoFactorController.js`, paramètres web/mobile. Chiffrement fichiers côté serveur : non implémenté. |

---

## 7. Malus (jusqu’à l’ajournement)

| Risque | Prévention dans le projet |
|--------|----------------------------|
| **Secrets en clair** (clés API, mots de passe BDD, JWT) | Aucun secret en dur dans le code. Variables d’environnement uniquement ; `.env.example` avec placeholders. |
| **Injection SQL / failles critiques** | MongoDB (requêtes paramétrées via Mongoose). Validation des entrées (Joi), sanitization. |

---

## Récapitulatif des fichiers clés par thème

- **Auth (inscription, connexion, OAuth, JWT)** : `backend/controllers/authController.js`, `usersController.js`, `backend/config/passport.js`, `backend/routes/auth.js`, `backend/middlewares/authMiddleware.js`, `backend/utils/jwt.js`.
- **Fichiers & dossiers** : `backend/controllers/filesController.js`, `foldersController.js`, `backend/models/fileModel.js`, `folderModel.js`, `frontend-web/src/pages/Files.jsx`, `Trash.jsx`, mobile `lib/screens/files/`, `TrashScreen`.
- **Prévisualisation & téléchargement** : `filesController.js` (`previewFile`, `streamFile`, download, ZIP), `frontend-web/src/pages/Preview.jsx`, mobile Preview / galerie / lecteurs.
- **Partage** : `backend/controllers/shareController.js`, `shareModel.js`, `frontend-web/src/pages/Share.jsx`, `mobile-app/lib/screens/share/`, `PublicShareScreen`.
- **Dashboard & recherche** : `backend/controllers/dashboardController.js`, `searchController.js`, `frontend-web/src/pages/Dashboard.jsx`, `Search.jsx`, mobile dashboard et search.
- **Documentation** : `docs/INSTALLATION.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `DIAGRAMMES_UML.md`, `MANUEL_UTILISATEUR.md`, `RENDU.md`.

---

Document créé : Décembre 2025
