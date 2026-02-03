# Analyse du projet SUPFile – Conformité au cahier des charges

## 1. Contexte et livrables

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Application web** | ✅ Oui | `frontend-web/` (React, Vite), pages : Dashboard, Fichiers, Recherche, Corbeille, Paramètres, Admin, Preview, Partage, Auth. |
| **Application mobile** | ✅ Oui | `mobile-app/` (Flutter), écrans équivalents (auth, dashboard, fichiers, recherche, corbeille, paramètres, admin, partage, preview). |
| **Stockage temporaire sur volume Docker** | ✅ Oui | `docker-compose.yml` : volume `backend_data:/usr/src/app/uploads` ; `fly.toml` : volume `uploads_data` monté sur `/usr/src/app/uploads`. Les fichiers sont sur disque, pas en base. |
| **Charte graphique** | ✅ Oui | Variables CSS (thème clair/sombre), design system dans `frontend-web/src/design-system/`, Bootstrap + styles personnalisés. |

---

## 2. Fonctionnalités métier

### 2.1 Espace personnel et quota (30 Go)

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Quota par utilisateur (30 Go)** | ✅ Oui | `userModel.js` : `quota_limit: 32212254720` (30 × 1024³ octets), `quota_used`. |
| **Vérification du quota à l’upload** | ✅ Oui | `filesController.js` : avant création du fichier, `calculateRealQuotaUsed` + comparaison à `quota_limit` ; si dépassement → 507 + suppression du fichier uploadé. |
| **Mise à jour du quota** | ✅ Oui | `utils/quota.js` : `updateQuotaAfterOperation`, `syncQuotaUsed`, `calculateRealQuotaUsed` (calcul depuis les fichiers réels). Dashboard et paramètres affichent quota utilisé / limite. |

### 2.2 Stockage : pointeurs, pas de fichiers en base

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Fichiers non stockés “en vrac” en base** | ✅ Oui | `fileModel.js` : champs `name`, `mime_type`, `size`, `folder_id`, `owner_id`, **`file_path`** (chemin sur disque). Pas de contenu binaire en base. |
| **Stockage physique sur disque** | ✅ Oui | `filesController.js` (multer) : destination `uploadDir/user_${userId}` ; enregistrement en base avec `filePath: req.file.path`. Lecture via `path.resolve(file.file_path)` pour preview/download/stream. |

### 2.2.2 Gestionnaire de fichiers

Navigation intuitive, dossiers, upload, déplacement, corbeille, téléchargement (fichier unitaire et dossier ZIP).

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Création / renommage / déplacement / suppression de dossiers** | ✅ Oui | Backend : `foldersController.js` (create, update avec name/parent_id, delete, restore). Web : `Files.jsx` + `folderService` (create, rename, move, delete). Mobile : `FilesProvider` + `ApiService` (createFolder, renameFolder, moveFile/moveFolder, delete avec corbeille). |
| **Navigation type « Fil d'Ariane »** | ✅ Oui | Web : `Files.jsx` — breadcrumbs (Racine / dossier1 / dossier2) avec **chaque segment cliquable** pour remonter dans l’arborescence. Mobile : `files_screen.dart` — fil d’Ariane avec chevrons et dossiers cliquables. |
| **Upload avec barre de progression** | ✅ Oui | Web : `Files.jsx` — `uploadProgress` par fichier, `onUploadProgress` dans `api.js`, barres de progression affichées pendant l’upload. |
| **Déplacement drag & drop** | ✅ Oui | Web : `Files.jsx` — glisser-déposer de fichiers vers la zone d’upload ; **drag & drop d’items (fichiers/dossiers) vers un dossier** pour déplacer (`handleItemDragStart`, `handleFolderDrop`). Mobile : déplacement via menu (pas de drag & drop, UX mobile). |
| **Suppression avec corbeille et restauration** | ✅ Oui | Backend : routes `DELETE` (soft delete) et `POST …/restore` pour fichiers et dossiers. Web : `Trash.jsx` (liste corbeille, restaurer fichier/dossier, vider la corbeille). Mobile : `TrashScreen` (idem). |
| **Téléchargement fichier unitaire** | ✅ Oui | Backend : `GET /api/files/:id/download`. Web : bouton « Télécharger » dans `Files.jsx` et `Preview.jsx`. Mobile : `_downloadFile` dans `files_screen.dart`, `preview_screen.dart`, `optimized_file_item.dart`. |
| **Téléchargement dossier (ZIP à la volée)** | ✅ Oui | Backend : `foldersController.downloadFolder` — génération ZIP en stream avec `archiver`, pas de fichier temporaire. Web : `folderService.downloadAsZip`, bouton « Télécharger (ZIP) » dans `Files.jsx`. Mobile : `ApiService.downloadFolder`, option « Télécharger (ZIP) » dans le menu dossier. |

### 2.2.3 Prévisualisation & média

Consultation directe des fichiers supportés dans l’application sans téléchargement explicite ; visionneuse PDF/texte ; streaming audio/vidéo ; galerie images ; détails techniques.

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Consultation sans téléchargement** | ✅ Oui | Backend : `previewFile` (images, PDF, text/* en `inline`) et `streamFile` (audio/vidéo avec **Range**). Web : `Preview.jsx` selon type. Mobile : `PreviewScreen` avec `_buildPreview()` selon type. |
| **Visionneuse PDF et textes (TXT, MD)** | ✅ Oui | Backend : `previewFile` sert PDF et `text/*` (dont TXT, MD si type `text/plain` ou `text/markdown`). Web : `PdfPreview` (iframe/embed), `TextPreview` (fetch + `<pre>`). Mobile : `SfPdfViewer.network` pour PDF, `_buildTextPreview` (API preview + `SelectableText`). |
| **Streaming audio/vidéo** | ✅ Oui | Backend : `streamFile` avec requêtes **Range**, stream par chunks. Web : `VideoPreview` et `AudioPreview` avec `file.streamUrl`. Mobile : `VideoPlayer.networkUrl(streamUrl)`, `AudioPlayer` avec stream URL. |
| **Galerie pour les images** | ✅ Oui | Web : `Preview.jsx` — vignettes des autres images du même dossier, navigation par clic. Mobile : `ImageGalleryScreen` (PageView, navigation entre images du dossier) ; ouverture depuis la liste fichiers. |
| **Détails techniques (taille, date, type MIME)** | ✅ Oui | Web : bloc « Détails techniques » dans `Preview.jsx` (nom, type MIME, taille, **date de modification**, ID). Mobile : bouton « Détails techniques » dans `PreviewScreen` (bottom sheet : nom, taille, type MIME, date de modification) ; galerie : `_showImageInfo` (taille, type, modifié le). |

### 2.2.4 Partage & collaboration

Système de partage pour diffuser du contenu : lien public (fichier ou dossier), expiration / mot de passe, partage interne (dossier dans la racine de l’autre utilisateur).

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Lien unique accessible aux non-utilisateurs** | ✅ Oui | Backend : `shareController.createPublicShare` (fichier ou dossier), token unique ; `getPublicShare` sans auth. Web : `Share.jsx` (accès par token), téléchargement fichier/dossier. Mobile : `PublicShareScreen` (accès par token, téléchargement). |
| **Date d’expiration ou mot de passe pour le lien** | ✅ Oui | Backend : `ShareModel` (`expires_at`, `password_hash`) ; `getPublicShare` vérifie expiration et mot de passe (bcrypt). Web : modal partage dans `Files.jsx` (option mot de passe, date d’expiration) ; `Share.jsx` demande le mot de passe si requis. Mobile : `ShareScreen` (mot de passe, date d’expiration) ; `PublicShareScreen` (saisie mot de passe si requis). |
| **Partage d’un dossier avec un autre utilisateur (dossier à la racine)** | ✅ Oui | Backend : `POST /api/share/internal` (folder_id, shared_with_user_id) ; `listFiles` à la racine inclut les dossiers partagés avec l’utilisateur ; accès au contenu d’un dossier partagé autorisé (getFolder, listFiles avec partage interne). Web : `Files.jsx` — partage « interne », recherche utilisateur, badge « Partagé avec moi » sur les dossiers reçus. Mobile : `ShareScreen` — partage interne, recherche utilisateur, badge « Partagé avec moi » sur les dossiers reçus à la racine. |

### 2.2.5 Recherche & filtres

Recherche unifiée pour trouver rapidement des fichiers (par nom ou extension) et filtrage par type ou par date.

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Recherche par nom ou extension** | ✅ Oui | Backend : `searchController.search` (GET /search) ; `FileModel.search` avec regex sur le nom (inclut l’extension dans le nom). Web : `Search.jsx` — champ recherche + debounce, appel `dashboardService.search`. Mobile : `SearchScreen` — champ recherche + debounce, `ApiService.search`. |
| **Filtrage par type (ex. « Afficher uniquement les images »)** | ✅ Oui | Backend : paramètre `mime_type` (image/, video/, audio/, application/pdf, text/). Web : filtre « Format » (Tous / Images / Vidéos / Audio / Documents). Mobile : filtre « Format » (Tous / Images / Vidéos / Audio / PDF / Texte) avec valeurs mime correctes (image/, video/, etc.). |
| **Filtrage par date (ex. « Modifié la semaine dernière »)** | ✅ Oui | Backend : paramètres `date_from`, `date_to` sur `updated_at`. Web : champs « Date début » / « Date fin » + **raccourcis** : Aujourd’hui, Cette semaine, **La semaine dernière**, Ce mois, Le mois dernier. Mobile : sélecteurs de date « Date début » / « Date fin ». Recherche possible avec uniquement les filtres (sans texte). |

### 2.2.6 Dashboard & activité

Tableau de bord pour visualiser l’état du compte : répartition de l’espace disque (ex. 10 Go Vidéos, 5 Go Documents) et accès rapide aux 5 derniers fichiers modifiés ou uploadés.

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Tableau de bord (état du compte)** | ✅ Oui | Backend : `GET /dashboard` (quota, breakdown, recent_files, total_files, total_folders). Web : `Dashboard.jsx` — cartes quota (utilisé, disponible, barre), total fichiers/dossiers. Mobile : `DashboardScreen` — quota, barre de progression, stats. |
| **Graphique de répartition de l’espace disque** | ✅ Oui | Backend : agrégation MongoDB par type (images, vidéos, documents, audio, other) en octets. Web : `StorageChart.jsx` (graphique circulaire) + barres par type (Images, Vidéos, Documents, Audio, Autres) avec taille (ex. 10 Go Vidéos, 5 Go Documents). Mobile : carte « Répartition par type » avec `_buildBreakdownItem` (Images, Vidéos, Documents, Audio, Autres) en Go + pourcentage. |
| **Accès rapide aux 5 derniers fichiers modifiés** | ✅ Oui | Backend : `recent_files` = 5 derniers par `updated_at`. Web : bloc « Fichiers récents » avec lien vers `/preview/:id` au clic et bouton « Voir tout » vers `/files`. Mobile : bloc « Fichiers récents » avec **accès rapide** (tap → `/preview/:id`) et bouton « Voir tout » vers `/files`. |

### 2.2.7 Paramètres utilisateurs

Modification des informations personnelles (avatar, email), changement de mot de passe, préférences d’interface (thème clair/sombre).

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Modification des infos personnelles (Avatar, Email)** | ✅ Oui | Backend : `PATCH /api/users/me` (email, display_name) ; `POST /api/users/me/avatar` (upload image). Web : `Settings.jsx` — formulaire Profil (email, nom affiché), sauvegarde via `updateProfile` ; avatar (input file + upload vers API). Mobile : `SettingsScreen` — formulaire (email, nom affiché) avec `_updateProfile` ; avatar (CircleAvatar + `_uploadAvatar` via image_picker). |
| **Changement de mot de passe** | ✅ Oui | Backend : `PATCH /api/users/me/password` (current_password, new_password) avec bcrypt. Web : `Settings.jsx` — formulaire « Changer le mot de passe » (mot actuel, nouveau, confirmation) avec `handleChangePassword`. Mobile : `SettingsScreen` — section mot de passe avec `_changePassword` et `ApiService.changePassword`. |
| **Préférences d’interface (Thème Clair/Sombre)** | ✅ Oui | Backend : `User.preferences` (theme, language, etc.) ; `PATCH /api/users/me/preferences` pour sauvegarder. Web : `Settings.jsx` — section « Préférences » avec boutons Clair / Sombre, `handleSavePreferences` (updatePreferences + `data-theme` + localStorage). Mobile : `ThemeProvider` + `SettingsScreen` — Switch « Mode sombre » avec `setThemeMode` et `updatePreferences` pour persister le thème côté API. |

### 2.3 Déploiement

#### 2.3.1 Architecture

Trois briques distinctes : serveur (logique, droits, stockage), deux clients (web + mobile) parlant uniquement à l’API, base de données pour les métadonnées. Pas de logique métier critique côté clients ; fichiers sur volume serveur, pas en base.

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Serveur (logique, droits, stockage)** | ✅ Oui | **Backend** Node.js/Express (`backend/`) : routes API (auth, files, folders, share, users, dashboard, search, 2FA, admin), middlewares (auth, droits, validation, rate limit, etc.), interface avec le stockage physique (multer → `uploads/`, lecture/stream pour preview/download). Pas d’API Gateway externe ; monolithe API unique. |
| **Deux clients distincts (web + mobile)** | ✅ Oui | **Client web** : `frontend-web/` (React, Vite), appelle uniquement l’API (authService, fileService, folderService, shareService, userService, dashboardService). **Client mobile** : `mobile-app/` (Flutter), appelle uniquement l’API (`ApiService`). Aucune logique métier critique côté clients (validation, quotas, ACL, partage = côté serveur). |
| **Base de données pour métadonnées** | ✅ Oui | **MongoDB** (NoSQL) : utilisateurs, structure des dossiers (Folder), noms et métadonnées des fichiers (File : name, mime_type, size, folder_id, owner_id, **file_path**), liens de partage (Share). Modèles dans `backend/models/`. |
| **Fichiers hors base, sur volume serveur** | ✅ Oui | Fichiers stockés sur disque : `backend/uploads/` (ou volume Docker `backend_data`). En base : uniquement le **chemin** (`file_path`). Lecture/écriture via `path.resolve(file.file_path)` et multer `destination`. |

#### 2.3.2 Containérisation

`docker-compose.yml` à la racine, au moins 3 services (serveur, client web, BDD), application fonctionnelle avec `docker compose up`, persistance BDD et fichiers via volumes Docker.

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **docker-compose.yml à la racine** | ✅ Oui | Fichier `docker-compose.yml` à la racine du projet. |
| **Au moins 3 services : serveur, client web, BDD** | ✅ Oui | **db** : MongoDB 6.0 (image `mongo:6.0`). **backend** : serveur API (build `./backend`, Dockerfile Node 18). **frontend** : client web (build `./frontend-web`, Dockerfile.dev, `npm run dev`, port 3000). Optionnel : **mobile** (Flutter) en 4ᵉ service. |
| **Application fonctionnelle avec docker compose up** | ✅ Oui | `depends_on` : backend → db, frontend → backend. Variables d’environnement via `.env` (MONGO_*, JWT_*, CORS_ORIGIN, VITE_API_URL, etc.). Backend écoute sur 5000, frontend sur 3000, db sur 27017. Commande : `docker compose up` (avec `.env` rempli). |
| **Persistance BDD et fichiers via volumes** | ✅ Oui | **Volumes** : `db_data` → `/data/db` (MongoDB). `backend_data` → `/usr/src/app/uploads` (fichiers uploadés). Déclarés dans `volumes:` et montés sur les services concernés. Les données survivent aux redémarrages des conteneurs. |

### 2.4 Flux de données (upload / download)

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Upload performant** | ✅ Oui | Multer `diskStorage`, limite globale 30 Go, validation type/taille. Quota vérifié avant écriture. |
| **Download** | ✅ Oui | `downloadFile` : envoi du fichier via chemin disque (stream ou sendFile). Partage public avec token/password. |
| **Download dossier (ZIP)** | ✅ Oui | `foldersController.downloadFolder` : archive ZIP streamée (`archive.pipe(res)`), fichiers lus depuis `file_path`. |

### 2.5 Arborescence et navigation

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Arborescence de dossiers** | ✅ Oui | Modèle `Folder` (parent_id, owner_id), `FolderModel` (findRootFolder, hiérarchie). |
| **Navigation fluide** | ✅ Oui | `Files.jsx` : `currentFolder`, `folderHistory`, `openFolder`, `goBack`, breadcrumbs (Racine / dossier1 / dossier2), URL `?folder=id`. |
| **Liste fichiers/dossiers par dossier** | ✅ Oui | API `GET /api/files?folder_id=`, `GET /api/folders` ; frontend et mobile consomment ces endpoints. |

### 2.6 Prévisualisation sans téléchargement complet

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Prévisualisation instantanée** | ✅ Oui | `filesController.previewFile` : images, PDF, texte servis en `inline` (sans téléchargement forcé). |
| **Streaming audio/vidéo** | ✅ Oui | `streamFile` : support des requêtes **Range** ; `createReadStream(filePath, { start, end }).pipe(res)` pour ne pas charger le fichier en entier. |
| **Page Preview (web)** | ✅ Oui | `Preview.jsx` : affichage selon type (image, PDF, texte, vidéo, audio) via URL `/api/files/:id/preview` ou stream. |

### 2.7 Sécurisation et partage

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Sécurisation des fichiers** | ✅ Oui | Auth JWT, vérification `owner_id` ou partage sur toutes les routes fichiers/dossiers. Partage par lien (token, optionnellement mot de passe / expiration). |
| **Partage** | ✅ Oui | Routes share (création lien, accès public avec token). Web : `Share.jsx` ; mobile : partage et accès aux liens partagés. |

### 2.8 Synchronisation Web / Mobile

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Même API pour Web et Mobile** | ✅ Oui | Backend unique (Node/Express) ; frontend-web et mobile-app appellent les mêmes endpoints (auth, files, folders, dashboard, search, share, 2FA, admin). |
| **Synchronisation des données** | ✅ Oui | **Web** : `syncService.js` (syncFromServer, fullSync, cache IndexedDB, offline-first). **Mobile** : `sync_service.dart` (syncToServer, file d’opérations en attente, cache Hive). Au retour en ligne, envoi des opérations en attente. |
| **Expérience hors ligne** | ✅ Oui | Web : cache local, navigation possible sans connexion (session persistée, ProtectedRoute après réhydratation). Mobile : idem (session conservée si erreur réseau, pas seulement 401). |

---

## 3. Le rendu

Le rendu est une **archive ZIP** contenant le code source, les assets, la documentation technique et le manuel utilisateur. Aucun secret en clair ; dépôt Git avec historique cohérent, **privé** jusqu’à l’échéance.

### 3.1 Contenu du rendu

| Exigence | Implémenté | Détail |
|----------|------------|--------|
| **Archive ZIP (code, assets, doc technique, manuel utilisateur)** | ✅ À produire au rendu | Le projet contient : code source (`backend/`, `frontend-web/`, `mobile-app/`), assets (images, logos dans `public/`, `assets/`), documentation technique dans `docs/`. Un **manuel utilisateur** est fourni dans `docs/MANUEL_UTILISATEUR.md`. Au rendu : créer une archive ZIP du dépôt (ou d’une release) incluant tout, sans `node_modules` ni `.env`. |
| **Documentation technique : procédure d’installation et pré-requis** | ✅ Oui | `docs/INSTALLATION.md` : pré-requis (Docker, Git, Node.js par plateforme), étapes (cloner, copier `.env.example` → `.env`, éditer les secrets, `docker compose up`). `README.md` et `QUICKSTART.md` complètent. |
| **Documentation technique : guide de déploiement** | ✅ Oui | `docs/INSTALLATION.md` contient le déploiement Docker (`docker compose up`). Des guides détaillés existent en racine (ex. `DEPLOIEMENT_RENDER.md`, `DEMARRER_MONGODB.md`) pour des scénarios spécifiques. |
| **Documentation technique : justification des choix technologiques** | ⚠️ Partiel | `docs/ARCHITECTURE.md` décrit l’architecture (Node/Express, React/Vite, MongoDB, volumes). Une section dédiée « Justification des choix » (Node.js, MongoDB, React, Flutter) peut être ajoutée dans `docs/ARCHITECTURE.md` ou dans un fichier `docs/CHOIX_TECHNIQUES.md`. |
| **Documentation technique : diagrammes UML (cas d’utilisation, schéma BDD)** | ⚠️ Partiel | `docs/ARCHITECTURE.md` : schéma ASCII de l’architecture. `docs/DATABASE.md` : structure des collections/tables (logique). Des **diagrammes UML** explicites (cas d’utilisation, schéma relationnel/collections BDD) au format Mermaid ou image peuvent être ajoutés dans `docs/` pour conformité complète. |
| **Documentation technique : architecture de l’API (endpoints principaux)** | ✅ Oui | `docs/API.md` : base URL, authentification, conventions, **liste des endpoints** (auth, files, folders, share, users, dashboard, search, 2FA, admin) avec méthodes, body et réponses. |
| **Manuel utilisateur (fonctionnalités + guide nouvel arrivant)** | ✅ Oui | `docs/MANUEL_UTILISATEUR.md` : présentation des fonctionnalités (connexion, fichiers, partage, recherche, paramètres, etc.) et guide pas à pas pour un nouvel utilisateur. |
| **Aucun secret en clair dans le code** | ✅ Oui | Tous les secrets (JWT_SECRET, JWT_REFRESH_SECRET, MONGO_*, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_SECRET, SMTP_*, etc.) sont lus via **variables d’environnement** (`process.env` / `import.meta.env`). Fichier `.env.example` fourni avec des **placeholders** (ex. `changeme_secure_password_here`). Fichier `.env` non versionné (`.gitignore`). En test uniquement : `backend/jest.setup.js` utilise des valeurs de test (non production). |
| **Dépôt Git avec historique cohérent** | ✅ À vérifier au rendu | Le projet est versionné (structure Git). La documentation doit **indiquer l’URL du dépôt Git** rendu (privé jusqu’à l’échéance). Un historique de commits cohérent est requis ; en cas d’absence de dépôt accessible dans le rendu, le projet ne sera pas corrigé. |
| **Dépôt Git privé jusqu’à la fin du rendu** | ⚠️ Règle à respecter | Le dépôt doit rester **privé** jusqu’à la date d’échéance sur Moodle. Ne pas le rendre public avant cette date (risque de plagiat et sanction des deux groupes). Mention dans `docs/INSTALLATION.md` et/ou README. |

### 3.2 Synthèse rendu

- **Archive** : créer une ZIP du dépôt (ou tag release) en excluant `node_modules`, `.env`, `__pycache__`, etc.
- **Documentation technique** : installation et pré-requis ✅ ; guide de déploiement ✅ ; API (endpoints) ✅ ; justification des choix et diagrammes UML à compléter si exigés.
- **Manuel utilisateur** : `docs/MANUEL_UTILISATEUR.md` ✅.
- **Secrets** : aucun en clair dans le code ✅ ; utiliser `.env` dérivé de `.env.example`.
- **Git** : dépôt avec historique cohérent, indiqué dans la doc, rester privé jusqu’à l’échéance.

---

## 4. Synthèse

- **Contexte et livrables** : application web + mobile, stockage sur volume Docker, charte graphique en place.
- **Quota 30 Go** : défini, vérifié à l’upload, mis à jour et affiché.
- **Pointeurs vers stockage physique** : modèles File/Folder avec `file_path` ; aucun contenu binaire en base.
- **Upload / download** : gérés (fichier et dossier ZIP en stream).
- **Navigation dans l’arborescence** : breadcrumbs (fil d’Ariane cliquable), historique, racine/dossiers.
- **Gestionnaire de fichiers (2.2.2)** : dossiers (création, renommage, déplacement, suppression), upload avec progression, drag & drop (web), corbeille avec restauration, téléchargement fichier unitaire et dossier en ZIP.
- **Prévisualisation & média (2.2.3)** : consultation sans téléchargement (PDF, texte TXT/MD, images, streaming audio/vidéo), galerie images, affichage des détails techniques (taille, date de modification, type MIME) sur web et mobile.
- **Partage & collaboration (2.2.4)** : lien public (fichier/dossier) pour non-utilisateurs, expiration et mot de passe sur le lien ; partage interne (dossier avec un utilisateur) — les dossiers partagés apparaissent à la racine du destinataire et sont accessibles en lecture.
- **Recherche & filtres (2.2.5)** : recherche unifiée par nom/extension ; filtres par type (images, vidéos, audio, etc.) et par date (plage + raccourcis web « Modifié la semaine dernière », etc.).
- **Dashboard & activité (2.2.6)** : tableau de bord avec quota, graphique de répartition par type (Images, Vidéos, Documents, Audio, Autres) en Go, et accès rapide aux 5 derniers fichiers modifiés (web + mobile avec navigation vers prévisualisation et « Voir tout »).
- **Paramètres utilisateurs (2.2.7)** : modification des infos personnelles (avatar, email, nom affiché), changement de mot de passe, préférences d’interface (thème Clair/Sombre) avec persistance (localStorage web + API preferences pour synchronisation multi-appareils).
- **Déploiement (2.3)** : architecture en trois briques (serveur Node/Express, clients web + mobile, BDD MongoDB) ; logique et droits côté serveur, fichiers sur volume ; **containérisation** : `docker-compose.yml` à la racine avec au moins 3 services (db, backend, frontend), `docker compose up`, persistance BDD et fichiers via volumes Docker (`db_data`, `backend_data`).
- **Prévisualisation** : preview inline (images, PDF, texte) et streaming avec Range (audio/vidéo).
- **Synchronisation** : même API ; services de sync et mode hors ligne sur web et mobile.

**Conclusion** : Les points du cahier des charges (contexte, description générale, quota, flux, navigation, prévisualisation, synchronisation, déploiement, rendu) sont couverts. Utiliser ce document pour la relecture (UX, performances) et pour le rendu final (archive ZIP, doc technique, manuel utilisateur, pas de secrets, dépôt Git privé).
