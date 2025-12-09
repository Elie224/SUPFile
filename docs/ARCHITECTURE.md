# ARCHITECTURE - SUPFile

## 1. Vue d'ensemble générale

```
┌──────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                        │
│                                                               │
│  ┌─────────────────────┐         ┌──────────────────────┐   │
│  │   Frontend Web      │         │   Mobile App (Expo)  │   │
│  │   React + Vite      │         │   React Native       │   │
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
       │ SQL Queries / ORM                    │ File I/O
       │                                      │
┌──────▼──────────────────┐      ┌───────────▼──────────────┐
│   PostgreSQL (BDD)      │      │  Docker Volume           │
│                         │      │  (File Storage)          │
│  Tables:                │      │                          │
│  - users                │      │  /uploads/               │
│  - folders              │      │  └─ user1/               │
│  - files                │      │  └─ user2/               │
│  - shares               │      │  └─ ...                  │
│  - sessions (optional)  │      │                          │
│                         │      │  (5GB per user)          │
└─────────────────────────┘      └──────────────────────────┘
```

## 2. Architecture en trois niveaux

### 2.1 Présentation (Frontend)

**Web (React + Vite)**
- SPAssemble d'une seule page (SPA)
- Composants réutilisables
- Gestion d'état (Zustand)
- Responsive design (mobile-first)

**Mobile (React Native + Expo)**
- Même API client que web
- Navigation native
- Permission system (caméra, stockage, etc.)
- Offline support (optionnel - bonus)

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

**PostgreSQL**
- Métadonnées (utilisateurs, structure de dossiers)
- Indices pour performances rapides
- Transactions pour intégrité

**Stockage physique (Docker Volume)**
- Fichiers réels stockés sur `/uploads`
- Chemin relatif stocké en BDD
- Gestion du quota (30 Go par utilisateur)

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
  db (PostgreSQL)
    → volume db_data pour persistance
    → healthcheck pour readiness
  
  backend (Node.js)
    → volume backend_data pour uploads
    → depends_on db (healthcheck)
    → env vars depuis .env
  
  frontend (React/Vite)
    → livereload en dev
    → dist/ volume en prod
  
  mobile (Expo)
    → tunnel Expo pour testing
```

### 9.2 Volumes

```
db_data       → /var/lib/postgresql/data
backend_data  → /usr/src/app/uploads
```

---

## 10. Stack technologique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Backend** | Node.js + Express | Léger, performant, asynchrone |
| **Frontend Web** | React + Vite | Réactif, SPA, dev experience |
| **Mobile** | React Native + Expo | Code sharing, support iOS/Android |
| **BDD** | PostgreSQL | Relationnel, fiable, queryable |
| **Auth** | JWT + bcryptjs | Standard, without session server |
| **File Upload** | Multer | Middleware fiable et populaire |
| **Zip** | Archiver | Génération efficace en stream |
| **Image** | Sharp | Redimensionnement léger |
| **Containerization** | Docker | Portabilité, isolation, CI/CD |

---

## Next Steps

1. Implémenter les modèles BDD (migrations SQL)
2. Créer les routes d'authentification
3. Ajouter middlewares (auth, validation)
4. Implémenter upload/download
5. Créer l'UI web basique
6. Tester end-to-end

---

Document créé : Décembre 2025
