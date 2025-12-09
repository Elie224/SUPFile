# SUPFile - Project Status & Checklist

## 📊 État du projet (Décembre 2025)

**Phase actuelle** : ✅ Infrastructure & Foundation (100%)  
**Prochaine phase** : 🔄 Backend API Implementation

---

## ✅ Completed

### Projet Setup
- [x] Dépôt Git initialisé (privé)
- [x] Structure de dossiers complète
- [x] Docker Compose configuré (backend, frontend, mobile, db)
- [x] Variables d'environnement (.env.example)
- [x] .gitignore configurable

### Documentation
- [x] README principal
- [x] QUICKSTART.md pour démarrage rapide
- [x] ARCHITECTURE.md avec diagrammes
- [x] API.md complète (tous les endpoints)
- [x] DATABASE.md (schéma, requêtes SQL)
- [x] INSTALLATION.md (déploiement)
- [x] CONTRIBUTING.md (workflow git & standards)

### Configuration initiale
- [x] Backend : Express app + config
- [x] Frontend Web : React + Vite setup
- [x] Mobile : React Native + Expo setup
- [x] Middlewares de base : Auth, ErrorHandler, Validation
- [x] Utilitaires : JWT, Logger
- [x] API Client (React) avec intercepteurs
- [x] Zustand store pour auth
- [x] Schéma BDD SQL (migrations)

### Infrastructure
- [x] Dockerfile backend
- [x] Dockerfile frontend
- [x] Dockerfile mobile
- [x] docker-compose.yml avec healthchecks
- [x] Volumes pour persistance (db_data, backend_data)
- [x] Network bridge

---

## 🔄 In Progress / Todo

### 1. Backend API - Authentication (PRIORITY 1)
**Estimation** : 1-2 jours  
**Points** : 30 pts (signup/login standard + 20 pts OAuth2)

```
[ ] POST /api/auth/signup
    - [ ] Validation email unique
    - [ ] Hash password (bcryptjs)
    - [ ] Créer utilisateur en BDD
    - [ ] Générer JWT + Refresh token
    - [ ] Créer dossier racine utilisateur
    - [ ] Tests (unit + integration)
    - [ ] Error handling (400, 409)

[ ] POST /api/auth/login
    - [ ] Trouver utilisateur par email
    - [ ] Vérifier password hash
    - [ ] Générer tokens
    - [ ] Mettre à jour last_login_at
    - [ ] Tests
    - [ ] Error handling (401, 404)

[ ] POST /api/auth/refresh
    - [ ] Vérifier refresh token valide
    - [ ] Générer nouveau access token
    - [ ] Optionnel : rotate refresh token

[ ] POST /api/auth/logout
    - [ ] Révoquer refresh token (session table)
    - [ ] Clear client-side tokens

[ ] POST /api/auth/oauth (Google/GitHub)
    - [ ] Valider code OAuth
    - [ ] Récupérer user info du provider
    - [ ] Auto-créer user si première connexion
    - [ ] Connecter utilisateur existant
```

**Tests requis** :
- Signup avec email valide ✓
- Signup avec email déjà existant (409) ✓
- Signup avec password faible (400) ✓
- Login avec bon credentials ✓
- Login avec mauvais password (401) ✓
- Refresh token invalide (401) ✓

---

### 2. Backend API - File Management (PRIORITY 1)
**Estimation** : 2-3 jours  
**Points** : 50 pts

```
[ ] GET /api/files
    - [ ] Lister fichiers d'un dossier
    - [ ] Pagination (skip, limit)
    - [ ] Sorting (name, date, size)
    - [ ] Filtrer soft-deleted
    - [ ] Tests pagination

[ ] POST /api/files/upload
    - [ ] Multipart upload handler (multer)
    - [ ] Validation fichier (taille, type)
    - [ ] Vérifier quota utilisateur
    - [ ] Générer unique filename (UUID)
    - [ ] Sauvegarder en volume Docker
    - [ ] Créer entry BDD
    - [ ] Mettre à jour quota_used
    - [ ] Progress events
    - [ ] Error handling (413, 507, 400)

[ ] POST /api/folders
    - [ ] Validation nom dossier
    - [ ] Créer folder en BDD
    - [ ] Vérifier parent folder (si spécifié)
    - [ ] Vérifier ownership parent

[ ] PATCH /api/files/:id (rename/move)
    - [ ] Vérifier ownership
    - [ ] Mise à jour nom/folder
    - [ ] Soft delete handling

[ ] DELETE /api/files/:id (soft delete)
    - [ ] Soft delete file (is_deleted = true)
    - [ ] Marquer deleted_at
    - [ ] Supporter restore

[ ] POST /api/files/:id/restore
    - [ ] Restaurer depuis corbeille
    - [ ] Vérifier quota (si suppression a été comptabilisée)
    - [ ] Update is_deleted = false

[ ] GET /api/files/:id/download
    - [ ] Vérifier ownership ou public share
    - [ ] Streaming du fichier
    - [ ] Content-Type correct
    - [ ] Content-Disposition avec filename

[ ] GET /api/folders/:id/download
    - [ ] Générer ZIP à la volée (archiver)
    - [ ] Streamer ZIP (pas de temp file)
    - [ ] Gestion erreur si trop gros
```

**Tests requis** :
- Upload fichier + progress ✓
- Upload avec quota dépassé (507) ✓
- Lister fichiers avec pagination ✓
- Télécharger fichier ✓
- Télécharger dossier en ZIP ✓

---

### 3. Backend API - Preview & Streaming (PRIORITY 2)
**Estimation** : 1-2 jours  
**Points** : 40 pts

```
[ ] GET /api/files/:id/preview
    - [ ] Image (redimensionner avec sharp)
    - [ ] PDF (convertir pages en images)
    - [ ] Texte/Markdown (retourner contenu)
    - [ ] Code (syntax highlighting optionnel)

[ ] GET /api/files/:id/stream
    - [ ] Audio/Vidéo (HTTP Range requests)
    - [ ] Streaming efficace (pas de chargement complet)
    - [ ] Seek support
```

---

### 4. Backend API - Sharing (PRIORITY 2)
**Estimation** : 1-2 jours  
**Points** : 40 pts

```
[ ] POST /api/share/public
    - [ ] Générer token unique
    - [ ] Optionnel : hash password
    - [ ] Optionnel : set expiration
    - [ ] Créer entry BDD (shares table)

[ ] POST /api/share/internal
    - [ ] Partager avec autre utilisateur
    - [ ] Dossier apparaît dans racine destinataire

[ ] GET /api/share/:token
    - [ ] Vérifier token valide
    - [ ] Vérifier pas expiré
    - [ ] Optionnel : check password
    - [ ] Retourner métadonnées + download token
    - [ ] Incrémenter access_count
```

---

### 5. Backend API - Search & Dashboard (PRIORITY 2)
**Estimation** : 1 jour  
**Points** : 30 pts

```
[ ] GET /api/search
    - [ ] Full-text search (nom)
    - [ ] Filtrer par type (file/folder)
    - [ ] Filtrer par date
    - [ ] Filtrer par taille

[ ] GET /api/dashboard
    - [ ] Quota utilisé/disponible
    - [ ] Breakdown par type (video, image, doc)
    - [ ] 5 derniers fichiers
    - [ ] Nombre partages publics
```

---

### 6. Frontend Web - Pages & Components (PRIORITY 1)
**Estimation** : 2-3 jours  
**Points** : Qua lité UI/UX (20 pts)

```
[ ] Layout principal
    - [ ] Sidebar navigation
    - [ ] Top bar (profil, settings)
    - [ ] Responsive design

[ ] Pages
    - [ ] /login (formulaire + OAuth buttons)
    - [ ] /signup (formulaire)
    - [ ] / (file explorer)
    - [ ] /settings (profil, password, theme)
    - [ ] /share/:token (public share access)

[ ] Composants
    - [ ] FileExplorer (breadcrumb, list, grid)
    - [ ] FileUploadZone (drag & drop + button)
    - [ ] ContextMenu (rename, delete, share)
    - [ ] Modals (créer dossier, etc.)
    - [ ] ProgressBar
```

---

### 7. Frontend Web - Features (PRIORITY 1)
**Estimation** : 2 jours  

```
[ ] Auth flow
    - [ ] Login page + signup
    - [ ] Redirect to /files si logged in
    - [ ] Token storage + refresh

[ ] File management
    - [ ] Lister fichiers
    - [ ] Créer dossier
    - [ ] Upload avec progress
    - [ ] Renommer
    - [ ] Supprimer
    - [ ] Breadcrumb navigation

[ ] Bonus
    - [ ] Drag & drop (move files)
    - [ ] Preview inline (images)
    - [ ] Settings page (theme, password)
```

---

### 8. Mobile App - Setup & Basic (PRIORITY 3)
**Estimation** : 2-3 jours  

```
[ ] Navigation structure
    - [ ] Bottom tab navigation
    - [ ] Stack navigators

[ ] Screens
    - [ ] LoginScreen
    - [ ] FileListScreen
    - [ ] PreviewScreen
    - [ ] SettingsScreen

[ ] Features
    - [ ] Login/Signup
    - [ ] Lister fichiers
    - [ ] Upload de photos
    - [ ] Preview basique
```

---

## 📈 Scoring Progress

### Documentations : 50 pts
- [x] Documentation technique (30 pts) ✓
- [x] Manuel utilisateur (20 pts) - À faire après features

### Qualité de l'interface : 20 pts
- [ ] Design & ergonomie - WIP
- [ ] Fluidité - Dépend des features

### Déploiement : 50 pts
- [x] Architecture & abstraction (30 pts) ✓
- [x] Containérisation (20 pts) ✓

### Fonctionnalités : 190 pts
- [ ] Auth standard (30 pts) - 🔄 En cours
- [ ] Auth OAuth2 (20 pts) - ⏳ À faire
- [ ] Gestion fichiers (50 pts) - ⏳ À faire
- [ ] Preview (40 pts) - ⏳ À faire
- [ ] Partage (40 pts) - ⏳ À faire
- [ ] Dashboard & Recherche (30 pts) - ⏳ À faire
- [ ] Code Quality (190 pts) - ⏳ Parallèle aux features

### Bonus : 50 pts
- [ ] Drag & drop
- [ ] Partage avancé (mot de passe, expiration)
- [ ] Chiffrement fichiers
- [ ] Offline sync
- [ ] Collaborative features

---

## 🎯 Timeline suggérée

**Semaine 1** :
- Jour 1-2 : Auth API (signup/login/refresh)
- Jour 3-4 : File management API (upload, delete, move)
- Jour 5 : Preview & streaming

**Semaine 2** :
- Jour 1-2 : Frontend Web auth & layout
- Jour 3-4 : Frontend Web file management
- Jour 5 : Tests & bugs fixes

**Semaine 3** :
- Jour 1-2 : Sharing & Search API
- Jour 3 : Dashboard
- Jour 4-5 : Mobile app basics

**Semaine 4** :
- Jour 1-2 : Frontend polish & tests
- Jour 3-4 : Mobile app features
- Jour 5 : Documentation finale & release

---

## 🚀 Quick Start (pour contributors)

```bash
# 1. Clone et setup
git clone <REPO_PRIVÉ>
cd SUPFile
cp .env.example .env

# 2. Lancer Docker
docker compose up -d

# 3. Créer branche feature
git checkout -b feature/auth-api

# 4. Développer
npm run dev  # terminal 1
# ... code ...

# 5. Commit & push
git add .
git commit -m "feat(auth): implement signup endpoint"
git push -u origin feature/auth-api

# 6. PR sur GitHub
# Attendre review & merge
```

---

## 📞 Notes importantes

- ✅ Git dépôt PRIVÉ jusqu'à rendu
- ✅ Pas de secrets en clair (.env, .env.local)
- ✅ Tests pour tous les endpoints critiques
- ✅ Documentation mise à jour à chaque feature
- ✅ Code review obligatoire avant merge
- ✅ Format conventional commits obligatoire

---

Document créé : Décembre 2025  
Dernière mise à jour : Décembre 2025
