# ARCHITECTURE - SUPFile

## 1. Vue d'ensemble générale

```
┌──────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                        │
│                                                               │
│  ┌─────────────────────┐         ┌──────────────────────┐   │
│  │   Frontend Web      │         │   Mobile App        │   │
│  │   React + Vite      │         │   Flutter            │   │
│  │                     │         │                      │   │
│  │ - File Manager      │         │ - Navigation         │   │
│  │ - Dashboard         │         │ - Upload/Download    │   │
│  │ - Preview           │         │ - File Browser       │   │
│  │ - Settings          │         │ - Preview            │   │
│  └──────────┬──────────┘         └──────────┬───────────┘   │
└─────────────┼────────────────────────────────┼────────────────┘
              │                                │
              └────────────┬───────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼────────────────────────────────────┐
│                    COUCHE API/MÉTIER                          │
│                   Node.js + Express                           │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              API REST Endpoints                        │   │
│  │  /api/auth, /api/files, /api/folders, /api/share...   │   │
│  └─────────────────────┬─────────────────────────────────┘   │
│                        │                                      │
│  ┌─────────────────────┴────────────────────────────────┐    │
│  │          Middlewares & Logique Métier                │    │
│  │                                                      │    │
│  │  - Authentication (JWT)    - Validation             │    │
│  │  - Authorization (ACL)     - Error Handling         │    │
│  │  - File Upload Handler     - Caching                │    │
│  │  - Compression/ZIP         - Rate Limiting          │    │
│  │  - Image/PDF Preview       - Request Logging        │    │
│  └──────────────────────────────────────────────────────┘    │
└──────┬──────────────────────────────────────┬─────────────────┘
       │                                      │
       │ Mongoose / MongoDB                   │ File I/O
       │                                      │
┌──────▼──────────────────┐      ┌───────────▼──────────────┐
│   MongoDB (BDD)          │      │  Docker Volume           │
│                         │      │  (File Storage)          │
│  Collections:            │      │                          │
│  - users                │      │  /uploads/               │
│  - folders              │      │  └─ user1/               │
│  - files                │      │  └─ user2/               │
│  - shares               │      │  └─ ...                  │
│  - sessions (optional)   │      │  (quota par user)        │
│                         │      │                          │
└─────────────────────────┘      └──────────────────────────┘
```

## 2. Architecture en trois niveaux

### 2.1 Présentation (Frontend)

**Web (React + Vite)**
- SPAssemble d'une seule page (SPA)
- Composants réutilisables
- Gestion d'état (Zustand)
- Responsive design (mobile-first)

**Mobile (Flutter)**
- Même API REST que le web
- Navigation native (iOS / Android)
- Gestion des permissions (stockage, caméra)
- Support hors ligne (cache, session persistée)

### 2.2 Logique métier (API)

**Node.js / Express**
```
Routes → Middlewares → Controllers → Services/Modèles → BDD
```

Structure des controlleurs :
```javascript
// controllers/authController.js
exports.signup = async (req, res) => {
  // Validation → Hash password → Insert DB → JWT → Response
}

exports.login = async (req, res) => {
  // Validation → Check password → JWT → Response
}
```

### 2.3 Persistance (BDD + Stockage)

**MongoDB**
- Métadonnées (utilisateurs, dossiers, fichiers, partages)
- Schéma flexible (Mongoose), index pour les requêtes fréquentes
- Pas de schéma SQL ; collections : users, folders, files, shares, sessions

**Stockage physique (Docker Volume)**
- Fichiers réels stockés sur `/uploads`
- Chemin physique stocké dans la collection `files`
- Quota par utilisateur (ex. 30 Go)

---

## 3. Schéma de la Base de Données

### 3.1 Diagramme ER (Entity-Relationship)

```
┌──────────────────┐
│      users       │
├──────────────────┤
│ id (PK)          │
│ email (UNIQUE)   │
│ password_hash    │
│ oauth_provider   │
│ oauth_id         │
│ avatar_url       │
│ preferences      │
│ quota_used       │◄─────┐
│ created_at       │      │ (FK)
│ updated_at       │      │
└────────┬─────────┘      │
         │ (1:N)          │
         │                │
    ┌────▼──────────────┐ │
    │     folders       │ │
    ├───────────────────┤ │
    │ id (PK)           │ │
    │ name              │ │
    │ parent_id (FK)    │ │ (parent folder)
    │ owner_id (FK)────────┘
    │ created_at        │
    │ updated_at        │
    └────────┬──────────┘
             │ (1:N)
             │
         ┌───▼──────────────┐
         │      files       │
         ├───────────────────┤
         │ id (PK)           │
         │ name              │
         │ folder_id (FK)    │
         │ owner_id (FK)─────┐
         │ mime_type         │ (FK back to users)
         │ size              │
         │ path              │
         │ deleted           │
         │ created_at        │
         │ updated_at        │
         └───────────────────┘

┌──────────────────┐
│     shares       │
├──────────────────┤
│ id (PK)          │
│ file_or_folder   │
│ type (public)    │
│ token (UNIQUE)   │
│ password_hash    │
│ expires_at       │
│ shared_with_user │
│ created_at       │
└──────────────────┘
```

### 3.2 Relations

| Table | Relation | Cardinalité | Description |
|-------|----------|-------------|-------------|
| users → folders | 1:N | Un utilisateur a plusieurs dossiers |
| users → files | 1:N | Un utilisateur a plusieurs fichiers |
| folders → folders | 1:N (self) | Dossiers imbriqués (arborescence) |
| folders → files | 1:N | Un dossier contient plusieurs fichiers |
| files/folders → shares | 1:N | Un fichier/dossier peut avoir plusieurs partages |

---

## 4. Cas d'usage (Use Cases)

### 4.1 Diagramme de cas d'usage

```
         ┌─────────────────────────────────────┐
         │    Utilisateur non inscrit          │
         └──────────────┬──────────────────────┘
                        │
                        ▼
        ┌──────────────────────────────────┐
        │  Accéder à lien public partagé   │
        │  (Download fichier/dossier)      │
        └──────────────────────────────────┘


         ┌─────────────────────────────────────┐
         │    Utilisateur inscrit              │
         └──────────────┬──────────────────────┘
                        │
        ┌───────────────┼───────────────────┐
        │               │                   │
        ▼               ▼                   ▼
    ┌───────┐      ┌────────┐         ┌──────────┐
    │ S'inscrire   │ Se connecter     │ Oublier MdP
    │ (email/mdp)  │ (email/mdp)      │
    │              │ (OAuth2)         │
    └──────────────────┬──────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Accéder à l'espace personnel │
        │ (Dashboard + File Explorer)  │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┼──────────────────────┐
        │              │                      │
        ▼              ▼                      ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │Gérer fichiers│ │Prévisualiser  │  │Partager      │
    │- Upload     │  │- Image        │  │- Lien public │
    │- Download   │  │- PDF/Texte    │  │- Utilisateur │
    │- Rename     │  │- Audio/Vidéo  │  │- Expiration  │
    │- Delete     │  │               │  │- Mot de passe│
    │- Move       │  │               │  │              │
    └─────────────┘  └──────────────┘  └──────────────┘

    ┌─────────────────────────────────┐
    │ Modifier paramètres personnels  │
    │ - Profil (Avatar, Email)        │
    │ - Mot de passe                  │
    │ - Préférences (Thème, langue)   │
    └─────────────────────────────────┘
```

---

## 5. Flux d'authentification

### 5.1 Inscription

```
User Input (email, password)
        │
        ▼
┌─────────────────────────┐
│ POST /api/auth/signup   │
└────────────┬────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Validation Email │ → Regex, unique check
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Hash Password    │ → bcryptjs (10 rounds)
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Insert en BDD    │ → users table
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Générer JWT      │ → 1h expiration
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Créer dossier    │ → /uploads/user_123/
    │ racine           │
    └────────┬─────────┘
             │
             ▼
    HTTP 201 + JWT Token
```

### 5.2 Connexion

```
Email + Password
        │
        ▼
┌──────────────────────┐
│ POST /api/auth/login │
└─────────────┬────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Find user by email  │ → DB query
    └──────────┬──────────┘
               │
         ┌─────┴──────┐
         │ Not found? │
         └─────┬──────┘
               │
         ┌─────▼─────┐
      YES│           │NO
         │           │
         ▼           ▼
    401 Error  ┌─────────────────────┐
               │ Compare password    │ → bcryptjs
               │ (hash from DB)      │
               └──────────┬──────────┘
                          │
                      ┌───┴───┐
                     NO       YES
                      │       │
                      ▼       ▼
                   401 Error  ┌──────────────┐
                              │ Generate JWT │
                              │ + Refresh    │
                              └────────┬─────┘
                                       │
                                       ▼
                              HTTP 200 + Tokens
```

### 5.3 OAuth2 (Google/GitHub)

```
User clicks "Login with Google"
        │
        ▼
┌─────────────────────────────────┐
│ Browser → Google Auth URL       │
└────────────┬────────────────────┘
             │
             ▼
┌──────────────────────┐
│ User accepts consent │
│ (Google redirects)   │
└─────────────┬────────┘
              │
              ▼
┌──────────────────────────┐
│ POST /api/auth/oauth     │
│ (code from Google)       │
└────────────┬─────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Exchange code for  │ → POST to Google API
    │ access_token       │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Get user info      │ → Google API
    │ (email, avatar)    │
    └────────┬───────────┘
             │
             ▼
    ┌─────────────────────┐
    │ User exists in DB?  │
    └──────────┬──────────┘
               │
           ┌───┴────┐
           │        │
          YES      NO
           │        │
           ▼        ▼
        Login    ┌──────────┐
                 │Auto-create
                 │user account
                 │+ Generate JWT
                 └────┬─────┘
                      │
                      ▼
              HTTP 200 + JWT Token
```

---

## 6. Flux de gestion de fichiers

### 6.1 Upload d'un fichier

```
User selects file(s)
        │
        ▼
┌─────────────────────────┐
│ POST /api/files/upload  │
│ (multipart/form-data)   │
└────────────┬────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Auth middleware      │ → Verify JWT
    │ Validate token       │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Check file size          │ → Max 5GB
    │ Check user quota         │ → 30GB limit
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Generate unique name │ → UUID
    │ + extension          │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Save file to volume  │ → /uploads/user_123/file_uuid.ext
    │ (streaming)          │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Create DB entry      │ → files table
    │ (name, path, size,   │   (meta-données)
    │ mime_type, folder_id)│
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Update quota_used    │ → users table
    └────────┬─────────────┘
             │
             ▼
    HTTP 201 + File metadata
    {
      id, name, size, created_at, etc.
    }
```

### 6.2 Prévisualisation

```
User clicks on file
        │
        ▼
┌──────────────────────────┐
│ GET /api/files/:id/...   │
│ - /preview (image/PDF)   │
│ - /stream  (audio/video) │
└────────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Auth + Check access  │ → Ownership or share
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ MIME type check      │
    └────┬───┬───┬─────┬──┘
         │   │   │     │
    ┌────▼┐  │   │     │
    │Image│  │   │     │
    └────┬┘  │   │     │
         │   │   │     │
         ▼   │   │     │
    ┌──────┐ │   │     │
    │ Resize│ │   │     │
    │Optimize
    └──┬────┘ │   │     │
       │ ┌────▼┐  │     │
       │ │ PDF │  │     │
       │ └────┬┘  │     │
       │      │   │     │
       │      ▼   │     │
       │   ┌──────┐     │
       │   │Convert     │
       │   │to images   │
       │   └──┬─────────┘
       │      │ ┌────▼┐
       │      │ │Video/Audio
       │      │ └────┬─────┘
       │      │      │
       │      │      ▼
       │      │  ┌────────┐
       │      │  │ Streaming
       │      │  │ (chunks)
       │      │  └────┬────┘
       │      │       │
       └──────┴───────┬─────┐
                      │     │
                      ▼     ▼
              HTTP 200 + File/Stream
              (via base64 ou streaming)
```

---

## 7. Flux de partage

### 7.1 Partage public (lien)

```
User selects file/folder
        │
        ▼
┌──────────────────────────┐
│ POST /api/share/public   │
│ {                        │
│   file_id, password?,    │
│   expires_at?            │
│ }                        │
└────────────┬─────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Generate unique    │ → Random 32 chars
    │ token              │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Hash password      │ → bcryptjs (if provided)
    │ (optionnel)        │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Insert share entry │ → shares table
    │ in BDD             │
    └────────┬───────────┘
             │
             ▼
    HTTP 201 + Share link
    {
      share_url: "https://supfile.com/s/abc123xyz"
    }
```

### 7.2 Accès au lien public

```
External user receives link
        │
        ▼
┌────────────────────────────┐
│ GET /api/share/:token      │
│ (no auth required)         │
└────────────┬───────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Check token exists │ → shares table
    │ + not expired      │
    └────────┬───────────┘
             │
    ┌────────┴────────┐
    │ Has password?   │
    └────────┬────────┘
             │
         ┌───┴────┐
        YES      NO
         │        │
         ▼        ▼
    ┌──────────┐ ┌────────────────┐
    │ Prompt   │ │ Return file/   │
    │ password │ │folder metadata │
    └──┬───────┘ └────────┬───────┘
       │                  │
       ▼                  │
    ┌──────────┐          │
    │ Verify   │          │
    │ password │          │
    └──┬───────┘          │
       │                  │
       ├────────┬─────────┘
       │        │
    FAIL    SUCCESS
       │        │
       ▼        ▼
    403     HTTP 200 + File/Folder
             + Download token
```

---

## 8. Sécurité - Principes

### 8.1 Authentification

- ✓ JWT (JSON Web Tokens) pour API authentication
- ✓ Tokens expirables (Access: 1h, Refresh: 7j)
- ✓ Refresh token rotation pour revocation
- ✓ HTTPS obligatoire en production

### 8.2 Autorisation (ACL)

- ✓ Vérification propriétaire avant chaque opération
- ✓ Partages internes via table `shares`
- ✓ Pas d'accès à d'autres utilisateurs sans partage

### 8.3 Données sensibles

- ✓ Mots de passe : bcryptjs (10 rounds minimum)
- ✓ Tokens JWT : signés avec secret fort (min 32 chars)
- ✓ OAuth secrets : variables d'environnement uniquement
- ✓ BDD password : également en .env

### 8.4 Validation

- ✓ Tous les inputs validés côté serveur
- ✓ Schemas Joi pour validation stricte
- ✓ File extension whitelist

### 8.5 Rate limiting

- À implémenter : `/api/auth/login` (max 5 tentatives/15min)

---

## 9. Déploiement avec Docker

### 9.1 Services

```yaml
services:
  db (MongoDB 6)
    → volume db_data pour persistance
    → auth via MONGO_INITDB_*
  
  backend (Node.js)
    → volume backend_data pour uploads
    → depends_on db
    → variables d'environnement depuis .env
  
  frontend (React/Vite)
    → livereload en dev
    → build dist/ en prod
```

L’application mobile Flutter se build et s’exécute en dehors de Docker (APK / iOS).

### 9.2 Volumes

```
db_data       → /data/db (MongoDB)
backend_data  → /usr/src/app/uploads
```

---

## 10. Stack technologique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Backend** | Node.js + Express | Léger, asynchrone, écosystème npm riche |
| **Frontend Web** | React + Vite | SPA réactive, bon outillage (HMR, build rapide) |
| **Mobile** | Flutter (Dart) | Une codebase pour iOS et Android, performances natives |
| **BDD** | MongoDB | Schéma flexible, scalabilité horizontale, adapté aux métadonnées fichiers |
| **Auth** | JWT + bcryptjs | Sans session serveur, standard pour les API REST |
| **Upload** | Multer | Middleware standard pour multipart/form-data |
| **Zip** | Archiver | Génération de ZIP en stream |
| **Image** | Sharp | Redimensionnement et optimisation d’images |
| **Conteneurisation** | Docker | Portabilité, reproductibilité, déploiement simplifié |

---

## 11. Justification des choix technologiques

### Backend : Node.js + Express
- **Asynchrone** : adapté aux I/O (fichiers, BDD, appels externes) sans bloquer le thread.
- **Écosystème** : Multer, JWT, Mongoose, Sharp, etc. permettent de livrer rapidement.
- **API REST** : un seul backend pour le web et le mobile.

### Frontend Web : React + Vite
- **React** : composants réutilisables, état prévisible, large adoption.
- **Vite** : temps de démarrage et de build courts, HMR fluide en développement.

### Mobile : Flutter
- **Une codebase** : même projet pour Android et iOS, moins de duplication.
- **Performances** : rendu natif (Skia), pas de bridge JavaScript.
- **UI cohérente** : Material / Cupertino et widgets personnalisables.

### Base de données : MongoDB
- **Document store** : structure (users, dossiers, fichiers, partages) modélisable en documents, avec références (ObjectId).
- **Évolution** : ajout de champs (2FA, préférences, etc.) sans migrations SQL.
- **Atlas** : offre managée pour la production et la scalabilité.

### Authentification : JWT
- **Stateless** : pas de session côté serveur, adapté aux API et au scale-out.
- **Multi-client** : même token pour web et mobile.
- **Refresh token** : renouvellement sans re-saisie du mot de passe.

### Fichiers : volume Docker + métadonnées en BDD
- **Volume** : fichiers sur disque (ou NFS/S3 en prod), pas en BDD.
- **Métadonnées en MongoDB** : nom, taille, type MIME, chemin, quota, corbeille, partages.

---

## 12. Diagrammes UML (résumé)

Des diagrammes détaillés (cas d’utilisation, schéma relationnel / logique BDD) sont disponibles dans le document **`docs/DIAGRAMMES_UML.md`** (Mermaid et descriptions).

---

Document créé : Décembre 2025
