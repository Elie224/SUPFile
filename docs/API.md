# API Documentation - SUPFile

Version: 1.0.0  
Last Updated: Décembre 2025

## Base URL

- **Development** : `http://localhost:5000/api`
- **Production (Fly.io)** : `https://supfile.fly.dev/api`

## Authentication

Tous les endpoints (sauf mention contraire) nécessitent un JWT valide :

```
Authorization: Bearer <access_token>
```

Le token est obtenu via `/api/auth/login`.
Si la 2FA est activée, l'appel à `/api/auth/login` renvoie `requires_2fa: true` puis les tokens sont délivrés après validation du code via `/api/auth/verify-2fa-login`.

### Token Format

```json
{
  "id": "64f0c2e6c9a1b1b5b0e8c123",
  "email": "user@example.com",
  "iat": 1702200000,
  "exp": 1702203600
}
```

**Durée de vie** :
- Access token : 1 heure
- Refresh token : 7 jours

---

## Conventions

### Requêtes

- **Format** : JSON
- **Encoding** : UTF-8
- **Content-Type** : `application/json` (sauf multipart)

### Réponses

La majorité des endpoints répondent en JSON. Selon les routes, la présence de `message` varie.

Notes importantes (conformes au code actuel) :
- Certaines routes de téléchargement/preview/stream renvoient un flux binaire (pas du JSON).
- Certaines erreurs historiques renvoient `{ error: '...', message: '...' }` ou `{ error: { message: '...' } }`.
- Les erreurs « non gérées » passées à `next(err)` sont normalisées par le middleware global.

**Succès** (2xx) — format courant :
```json
{
  "data": { ... },
  "message": "Message (optionnel)"
}
```

**Erreur** (4xx/5xx) — format normalisé (middleware global) :
```json
{
  "error": {
    "status": 400,
    "message": "Error description",
    "details": [ ... ]  // Optionnel
  }
}
```

### Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (token invalide) |
| 403 | Forbidden (pas de permission) |
| 404 | Not Found |
| 409 | Conflict (ressource existe déjà) |
| 413 | Payload Too Large |
| 500 | Internal Server Error |

---

## Endpoints

### 🔐 AUTHENTIFICATION

#### POST `/auth/signup`

Créer un compte avec email/mot de passe.

**Authentification** : Non requise

**Body** :
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "passwordConfirm": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "country": "FR"
}
```

**Validation** :
- Email : format valide, unique
- Password : min 8 chars, 1 uppercase, 1 number

**Réponse** (201) :
```json
{
  "data": {
    "email": "user@example.com"
  },
  "message": "Compte créé. Veuillez vérifier votre boîte e-mail et cliquer sur le lien de vérification avant de vous connecter."
}
```

**Note** : l'API ne renvoie pas de tokens à l'inscription (vérification e-mail obligatoire avant connexion).

**Erreurs possibles** :
- 409 : Email déjà existant
- 400 : Validation échouée
- 403 : Email bloqué
- 503 : Base de données indisponible

---

#### POST `/auth/login`

Connexion avec email/mot de passe.

**Authentification** : Non requise

**Body** :
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse** (200) — cas standard (sans 2FA) :
```json
{
  "data": {
    "user": {
      "id": "64f0c2e6c9a1b1b5b0e8c123",
      "email": "user@example.com",
      "display_name": "John Doe",
      "avatar_url": "https://...",
      "quota_used": 1000000,
      "quota_limit": 32212254720,
      "preferences": {
        "theme": "light",
        "language": "en"
      },
      "is_admin": false,
      "created_at": "2025-12-09T10:00:00Z",
      "last_login_at": "2025-12-09T10:05:00Z"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  },
  "message": "Connexion réussie."
}
```

**Réponse** (200) — si la 2FA est activée :
```json
{
  "data": {
    "requires_2fa": true,
    "user_id": "64f0c2e6c9a1b1b5b0e8c123",
    "email": "user@example.com"
  },
  "message": "Code 2FA requis"
}
```

**Erreurs possibles** :
- 401 : Email ou mot de passe incorrect
- 403 : E-mail non vérifié (`code: EMAIL_NOT_VERIFIED`)
- 403 : Email bloqué
- 503 : Base de données indisponible

---

#### POST `/auth/refresh`

Rafraîchir l'access token avec un refresh token.

**Authentification** : Non requise (refresh token fourni dans body)

**Body** :
```json
{
  "refresh_token": "eyJ..."
}
```

**Réponse** (200) :
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  },
  "message": "Jeton rafraîchi avec succès."
}
```

**Erreurs possibles** :
- 401 : Refresh token invalide ou expiré
- 400 : Refresh token manquant

---

#### POST `/auth/verify-2fa-login`

Finaliser la connexion quand la 2FA est activée.

**Authentification** : Non requise

**Body** :
```json
{
  "userId": "64f0c2e6c9a1b1b5b0e8c123",
  "token": "123456"
}
```

**Réponse** (200) :
```json
{
  "data": {
    "user": { ... },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  },
  "message": "Connexion 2FA réussie"
}
```

**Erreurs possibles** :
- 400 : Champs manquants / utilisateur non trouvé / 2FA non activée
- 401 : Code 2FA invalide

---

#### OAuth (Google / GitHub)

L'OAuth se fait via des routes **de redirection** (pas de `POST /auth/oauth`).

- **Web** :
  - `GET /auth/google` puis callback `GET /auth/google/callback`
  - `GET /auth/github` puis callback `GET /auth/github/callback`
  - En succès, le backend redirige vers le frontend (ex. `/auth/callback?tokens=...`).

- **Mobile** :
  - Google : `POST /auth/google/callback` avec `id_token` ou `access_token`.
  - GitHub : flux navigateur + deep link (le endpoint `POST /auth/github/callback` renvoie un message explicatif si utilisé).

---

#### POST `/auth/logout`

Déconnexion et révocation du refresh token.

**Authentification** : Non requise (le `refresh_token` est fourni dans le body)

**Body** :
```json
{
  "refresh_token": "eyJ..."
}
```

**Réponse** (200) :
```json
{
  "message": "Déconnexion réussie."
}
```

---

### 👤 UTILISATEUR

#### GET `/users/me`

Récupérer les infos du profil utilisateur actuel.

**Authentification** : Requise

**Réponse** (200) :
```json
{
  "data": {
    "id": "64f0c2e6c9a1b1b5b0e8c123",
    "email": "user@example.com",
    "display_name": "John Doe",
    "avatar_url": "https://...",
    "quota_used": 1000000,
    "quota_limit": 32212254720,
    "preferences": {
      "theme": "light",
      "language": "en",
      "notifications_enabled": true
    },
    "is_admin": false,
    "two_factor_enabled": false,
    "created_at": "2025-12-09T10:00:00Z",
    "last_login_at": "2025-12-09T15:30:00Z"
  }
}
```

---

#### PATCH `/users/me`

Modifier le profil utilisateur.

**Authentification** : Requise

**Body** (tous les champs optionnels) :
```json
{
  "email": "user@example.com",
  "display_name": "Jane Doe"
}
```

**Réponse** (200) :
```json
{
  "data": {
    "id": "64f0c2e6c9a1b1b5b0e8c123",
    "email": "user@example.com",
    "display_name": "Jane Doe",
    "avatar_url": "/avatars/....png",
    "quota_used": 123,
    "quota_limit": 32212254720,
    "preferences": {
      "theme": "light",
      "language": "en",
      "notifications_enabled": true
    }
  },
  "message": "Profile updated"
}
```

**Erreurs possibles** :
- 400 : Données invalides
- 409 : Email déjà utilisé

---

#### POST `/users/me/avatar`

Uploader/modifier l'avatar de l'utilisateur.

**Authentification** : Requise

**Content-Type** : `multipart/form-data`

**Form Data** :
```
avatar: <binary_image>
```

**Réponse** (200) :
```json
{
  "data": { "avatar_url": "/avatars/<filename>" },
  "message": "Avatar uploaded"
}
```

---

#### PATCH `/users/me/password`

Changer le mot de passe.

**Authentification** : Requise

**Body** :
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Réponse** (200) :
```json
{
  "message": "Password changed successfully"
}
```

**Erreurs possibles** :
- 401 : Mot de passe actuel incorrect
- 400 : Validation échouée

---

#### PATCH `/users/me/preferences`

Mettre à jour les préférences utilisateur.

**Authentification** : Requise

**Body** :
```json
{
  "preferences": {
    "theme": "dark",
    "language": "fr",
    "notifications_enabled": false
  }
}
```

**Réponse** (200) :
```json
{
  "data": {
    "preferences": {
      "theme": "dark",
      "language": "fr",
      "notifications_enabled": false
    }
  },
  "message": "Preferences updated"
}
```

---

### 📁 DOSSIERS

#### GET `/folders`

Lister les dossiers (enfants d'un parent).

**Authentification** : Requise

**Query Parameters** :
- `parent_id` : `root` / vide / omis = racine, sinon `ObjectId`

**Réponse** (200) :
```json
{
  "data": [
    {
      "id": "64f0c2e6c9a1b1b5b0e8c999",
      "name": "Documents",
      "owner_id": "64f0c2e6c9a1b1b5b0e8c123",
      "parent_id": null,
      "is_deleted": false,
      "deleted_at": null,
      "created_at": "2025-12-09T10:00:00.000Z",
      "updated_at": "2025-12-09T10:00:00.000Z"
    }
  ]
}
```

---

#### GET `/folders/all`

Lister tous les dossiers de l'utilisateur (liste à plat).

**Authentification** : Requise

**Réponse** (200) : `{ "data": [ ... ] }`

#### POST `/folders`

Créer un nouveau dossier.

**Authentification** : Requise

**Body** :
```json
{
  "name": "Mon Dossier",
  "parent_id": null
}
```

**Réponse** (201) :
```json
{
  "data": {
    "id": "64f0c2e6c9a1b1b5b0e8c999",
    "name": "Mon Dossier",
    "owner_id": "64f0c2e6c9a1b1b5b0e8c123",
    "parent_id": null,
    "is_deleted": false,
    "deleted_at": null,
    "created_at": "2025-12-09T10:00:00.000Z",
    "updated_at": "2025-12-09T10:00:00.000Z"
  },
  "message": "Folder created"
}
```

**Erreurs possibles** :
- 400 : Nom de dossier vide
- 404 : Dossier parent non trouvé
- 403 : Pas de permission sur le dossier parent

---

#### GET `/folders/trash`

Lister les dossiers supprimés (corbeille).

**Authentification** : Requise

**Réponse** (200) :
```json
{
  "data": {
    "items": [ { "id": "...", "name": "...", "deleted_at": "..." } ],
    "total": 1
  }
}
```

---

#### GET `/folders/:id`

Récupérer un dossier.

**Authentification** : Requise

**Notes** : si le dossier est partagé avec l'utilisateur (partage interne), la réponse inclut `shared_with_me: true`.

---

#### GET `/folders/:id/download`

Télécharger un dossier en ZIP (streaming).

**Authentification** : Requise

**JWT** :
- Header : `Authorization: Bearer <access_token>`
- ou query : `?access_token=<access_token>` (préféré)
- ou query : `?token=<access_token>`

**Réponse** :
- 200 `application/zip` (flux)
- 503 si trop de téléchargements ZIP concurrents (concurrency limiter)

---

#### PATCH `/folders/:id`

Renommer ou déplacer un dossier.

**Authentification** : Requise

**Body** (au moins un champ) :
```json
{
  "name": "Nouveau Nom",
  "parent_id": "64f0c2e6c9a1b1b5b0e8c111"
}
```

**Réponse** (200) : `{ "data": { ... }, "message": "Folder updated" }`

---

#### DELETE `/folders/:id`

Supprimer un dossier et son contenu.

**Authentification** : Requise

**Réponse** (200) :
```json
{ "message": "Folder deleted" }
```

**Notes** :
- Soft delete (corbeille) au premier DELETE ; suppression définitive si déjà en corbeille.

---

#### POST `/folders/:id/restore`

Restaurer un dossier supprimé.

**Authentification** : Requise

**Réponse** (200) :
```json
{ "message": "Folder restored" }
```

---

### 📄 FICHIERS

#### GET `/files`

Lister les fichiers d'un dossier.

**Authentification** : Requise

**Query Parameters** :
- `folder_id` : `ObjectId` du dossier. Si omis / vide / `root`, la route liste la « racine » (voir implémentation).
- `skip` : Offset (défaut : 0, max : 10000)
- `limit` : Taille de page (défaut : 50, max : 100)
- `sort_by` : `name`, `updated_at`, `created_at`, `size`, `mime_type`
- `sort_order` : `asc` ou `desc`

**Réponse** (200) :
```json
{
  "data": {
    "items": [
      {
        "id": "64f0c2e6c9a1b1b5b0e8caaa",
        "type": "file",
        "name": "document.pdf",
        "mime_type": "application/pdf",
        "size": 1024000,
        "folder_id": "64f0c2e6c9a1b1b5b0e8c999",
        "owner_id": "64f0c2e6c9a1b1b5b0e8c123",
        "file_path": "<server_path>",
        "is_deleted": false,
        "deleted_at": null,
        "created_at": "2025-12-09T10:00:00.000Z",
        "updated_at": "2025-12-09T10:00:00.000Z"
      },
      {
        "type": "folder",
        "id": "64f0c2e6c9a1b1b5b0e8cbbb",
        "name": "Images",
        "owner_id": "64f0c2e6c9a1b1b5b0e8c123",
        "parent_id": "64f0c2e6c9a1b1b5b0e8c999",
        "is_deleted": false,
        "deleted_at": null,
        "created_at": "2025-12-08T10:00:00.000Z",
        "updated_at": "2025-12-08T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "skip": 0,
      "limit": 50
    }
  }
}
```

---

#### POST `/files/upload/init`

Initialiser un upload chunké (reprise possible).

**Authentification** : Requise

**Body** :
```json
{
  "name": "video.mp4",
  "size": 123456789,
  "mime_type": "video/mp4",
  "folder_id": "64f0c2e6c9a1b1b5b0e8c999"
}
```

**Réponse** (201) :
```json
{ "data": { "upload_id": "<uuid>", "chunk_size": 5242880 } }
```

---

#### GET `/files/upload/status`

Statut d'un upload chunké.

**Authentification** : Requise

**Query Parameters** :
- `upload_id` : UUID

**Réponse** (200) :
```json
{ "data": { "upload_id": "<uuid>", "uploaded_chunks": [0, 1, 2] } }
```

---

#### POST `/files/upload/chunk`

Uploader un chunk.

**Authentification** : Requise

**Content-Type** : `multipart/form-data`

**Form Data** :
```
upload_id: <uuid>
chunk_index: 0
total_chunks: 10
chunk: <binary>
```

**Réponse** (200) : `{ "data": { "upload_id": "<uuid>", "chunk_index": 0 } }`

---

#### POST `/files/upload/complete`

Finaliser un upload chunké (assemblage + création BDD).

**Authentification** : Requise

**Body** :
```json
{ "upload_id": "<uuid>", "total_chunks": 10 }
```

**Réponse** (201) : `{ "data": { ...file }, "message": "File uploaded successfully" }`

---

#### POST `/files/upload`

Uploader un fichier.

**Authentification** : Requise

**Content-Type** : `multipart/form-data`

**Form Data** :
```
file: <binary_file>
folder_id: (optionnel)
```

**Réponse** (201) :
```json
{
  "data": {
    "id": "64f0c2e6c9a1b1b5b0e8caaa",
    "name": "photo.jpg",
    "mime_type": "image/jpeg",
    "size": 2048000,
    "folder_id": "64f0c2e6c9a1b1b5b0e8c999",
    "owner_id": "64f0c2e6c9a1b1b5b0e8c123",
    "file_path": "<server_path>",
    "is_deleted": false,
    "deleted_at": null,
    "created_at": "2025-12-09T10:00:00.000Z",
    "updated_at": "2025-12-09T10:00:00.000Z"
  },
  "message": "File uploaded successfully"
}
```

**Erreurs possibles** :
- 400 : Fichier manquant
- 413 : Fichier trop gros (> 5GB)
- 507 : Quota utilisateur dépassé
- 400 : Type de fichier non autorisé

**Limites** :
- Taille max : 5 GB
- Quota utilisateur : 30 GB

---

#### PATCH `/files/:id`

Renommer ou déplacer un fichier.

**Authentification** : Requise

**Body** (au moins un champ) :
```json
{
  "name": "nouveau_nom.pdf",
  "folder_id": "64f0c2e6c9a1b1b5b0e8c999"
}
```

**Réponse** (200) : `{ "data": { ... }, "message": "File updated" }`

---

#### DELETE `/files/:id`

Supprimer un fichier (corbeille).

**Authentification** : Requise

**Réponse** (200) :
```json
{ "message": "File deleted" }
```

**Notes** : soft delete au premier DELETE ; suppression définitive si déjà en corbeille.

---

#### POST `/files/:id/restore`

Restaurer un fichier supprimé.

**Authentification** : Requise

**Réponse** (200) :
```json
{ "message": "File restored" }
```

**Erreurs possibles** :
- 404 : Fichier non trouvé dans la corbeille
- 507 : Pas assez de quota pour restaurer

---

#### GET `/files/:id/download`

Télécharger un fichier.

**Authentification** : Requise (sauf accès via partage public)

Accès public (partage) :
- `?token=<public_token>`
- `&password=<password>` si protégé

Accès avec JWT en query (recommandé) :
- `?access_token=<access_token>`

Note : `token` est aussi utilisé par les partages publics ; pour éviter les ambiguïtés, utilisez `access_token` pour un JWT.

**Réponse** (200) : Fichier en streaming

**Content-Type** : Basé sur le MIME type du fichier

---

#### GET `/files/:id/preview`

Prévisualiser un fichier (image, PDF, texte).

**Authentification** :
- propriétaire via JWT (header ou `access_token`), ou
- via partage public (`token=<public_token>` + `password` optionnel).

**Réponse** (200) : flux binaire `inline` (pas du JSON) pour :
- images (`image/*`)
- PDF (`application/pdf`)
- fichiers texte (ex: `text/*`, `application/json`, `application/xml`, `application/yaml`, `application/javascript`, ...)

**Réponse** (400) : si le type n'est pas prévisualisable.

**Types supportés** :
- Images : JPG, PNG, GIF, WebP
- Documents : PDF, TXT, MD
- Code : JS, JSON, HTML, CSS, etc.

---

#### GET `/files/:id/stream`

Streamer un fichier audio/vidéo.

**Authentification** :
- propriétaire via JWT (header ou `access_token`), ou
- via partage public (`token=<public_token>` + `password` optionnel).

**Headers** :
- `Range: bytes=<start>-<end>` (optionnel) pour le seek

**Réponse** (200 ou 206) :
- 200 : Streaming complet
- 206 : Partial content (seek)

**Content-Type** : Basé sur le fichier

---

#### GET `/files/trash`

Lister les fichiers supprimés (corbeille).

**Authentification** : Requise

**Réponse** (200) :
```json
{
  "data": {
    "items": [ { "id": "...", "name": "...", "deleted_at": "..." } ],
    "total": 1
  }
}
```

---

### 🔗 PARTAGE

#### POST `/share/public`

Générer un lien public pour partager un fichier ou dossier.

**Authentification** : Requise

**Body** :
```json
{
  "file_id": "64f0c2e6c9a1b1b5b0e8caaa",
  "password": "secure_pass",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

**Optionnel** :
- `password` : Protéger le lien par mot de passe
- `expires_at` : Date d'expiration (null = jamais)

**Réponse** (201) :
```json
{
  "data": {
    "id": "64f0c2e6c9a1b1b5b0e8cddd",
    "file_id": "64f0c2e6c9a1b1b5b0e8caaa",
    "folder_id": null,
    "created_by_id": "64f0c2e6c9a1b1b5b0e8c123",
    "share_type": "public",
    "public_token": "<hex>",
    "requires_password": true,
    "expires_at": "2025-12-31T23:59:59.000Z",
    "is_active": true,
    "access_count": 0,
    "created_at": "2025-12-09T10:00:00.000Z",
    "updated_at": "2025-12-09T10:00:00.000Z",
    "share_url": "https://<frontend>/share/<public_token>"
  },
  "message": "Partage créé"
}
```

---

#### POST `/share/internal`

Partager un dossier avec un autre utilisateur inscrit.

**Authentification** : Requise

**Body** :
```json
{
  "folder_id": "64f0c2e6c9a1b1b5b0e8cbbb",
  "shared_with_user_id": "64f0c2e6c9a1b1b5b0e8c222"
}
```

**Réponse** (201) : `{ "data": { ...share }, "message": "Partage créé" }`

**Erreurs possibles** :
- 404 : Utilisateur ou dossier non trouvé
- 409 : Dossier déjà partagé avec cet utilisateur

---

#### GET `/share/:token`

Accéder à un lien public partagé (sans authentification).

**Authentification** : Non requise

**Query Parameters** :
- `password` : Mot de passe si le lien est protégé

**Réponse** (200) :
```json
{
  "data": {
    "share": { "id": "...", "public_token": "...", "requires_password": false, "expires_at": null },
    "resource": { "id": "...", "type": "file", "name": "photo.jpg", "mime_type": "image/jpeg" }
  }
}
```

**Erreurs possibles** :
- 404 : Lien inexistant
- 401 : Mot de passe requis/incorrect (`requires_password: true` peut être renvoyé)
- 403 : Lien expiré

---

#### GET `/share`

Lister les partages.

**Authentification** : Requise

**Query Parameters** :
- `type` : `public` ou `internal` (optionnel)

**Réponse** (200) : `{ "data": [ ...shares ] }`

---

#### DELETE `/share/:id`

Désactiver un partage (le créateur seulement).

**Authentification** : Requise

**Réponse** (200) : `{ "message": "Share deactivated" }`

---

### 🔍 RECHERCHE

#### GET `/search`

Rechercher des fichiers et dossiers.

**Authentification** : Requise

**Query Parameters** :
- `q` : Terme de recherche (optionnel mais recommandé)
- `type` : `file`, `folder`, `all` (optionnel)
- `mime_type` : Filtrer par MIME type (optionnel)
- `date_from` : Date de début (optionnel)
- `date_to` : Date de fin (optionnel)
- `sort_by`, `sort_order`, `skip`, `limit` : pagination/tri (mêmes règles que `/files`)

**Exemples** :
```
GET /search?q=rapport&type=file&mime_type=application/pdf
GET /search?q=2024&date_from=2024-01-01&date_to=2024-12-31
GET /search?q=.jpg&type=file
```

**Réponse** (200) :
```json
{
  "data": {
    "items": [
      {
        "id": "64f0c2e6c9a1b1b5b0e8caaa",
        "name": "rapport_2024.pdf",
        "type": "file",
        "mime_type": "application/pdf",
        "size": 512000,
        "updated_at": "2025-12-09T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "totalFiles": 4,
      "totalFolders": 1,
      "skip": 0,
      "limit": 50,
      "hasMore": false
    }
  }
}
```

---

### 📊 DASHBOARD

#### GET `/dashboard`

Récupérer les statistiques du dashboard utilisateur.

**Authentification** : Requise

**Réponse** (200) :
```json
{
  "data": {
    "quota": {
      "used": 5368709120,
      "limit": 32212254720,
      "available": 26843545600,
      "percentage": 17,
      "percentageRaw": 16.6667
    },
    "breakdown": {
      "images": 1073741824,
      "videos": 3221225472,
      "documents": 536870912,
      "audio": 0,
      "other": 536870912,
      "total": 5368709120
    },
    "recent_files": [
      {
        "id": "64f0c2e6c9a1b1b5b0e8caaa",
        "name": "video.mp4",
        "size": 1073741824,
        "mime_type": "video/mp4",
        "updated_at": "2025-12-09T15:30:00.000Z"
      }
    ],
    "total_files": 42,
    "total_folders": 10
  }
}
```

---

## Rate Limiting

Le rate limiting est appliqué côté backend (valeurs configurables via variables d'environnement).

Valeurs par défaut (code actuel) :

| Groupe | Limite | Fenêtre |
|-------|--------|---------|
| Global (`generalLimiter`) | 2000 req / IP | 15 min |
| Auth (`authLimiter`) | 30 tentatives (échecs) / IP | 15 min |
| Upload (`uploadLimiter`) | 50 uploads / IP | 1 h |
| Upload chunks (`chunkUploadLimiter`) | 5000 req / IP | 1 h |
| Partage (`shareLimiter`) | 20 créations / IP | 1 h |
| Emails sensibles (`emailSensitiveLimiter`) | 5 req / IP | 1 h |
| Reset flow (`resetFlowLimiter`) | 20 req / IP | 1 h |

**En cas de dépassement** : 429 avec un JSON `{ error: { message, status: 429 } }`.

---

## Webhooks (Optionnel - Bonus)

À implémenter pour futures notifications :

```
POST /webhooks/subscribe
Body: {
  "event": "file_uploaded",
  "url": "https://myapp.com/webhook"
}
```

**Événements possibles** :
- `file_uploaded`
- `file_deleted`
- `file_shared`
- `folder_created`
- `storage_limit_reached`

---

## Erreurs courantes

### 401 Unauthorized

```json
{
  "error": {
    "status": 401,
    "message": "Token expired",
    "details": "Please refresh your token using /auth/refresh"
  }
}
```

**Solutions** :
- Rafraîchir le token avec `/auth/refresh`
- Se reconnecter avec `/auth/login`

### 413 Payload Too Large

```json
{
  "error": {
    "status": 413,
    "message": "File size exceeds limit",
    "details": "Maximum file size is 5GB"
  }
}
```

### 507 Insufficient Storage

```json
{
  "error": {
    "status": 507,
    "message": "Insufficient storage quota",
    "details": "You have used 30GB out of 30GB"
  }
}
```

---

## Changelog API

### v1.0.0 (Initial)
- ✅ Authentication (signup, login, OAuth2)
- ✅ File management (upload, download, delete)
- ✅ Folder management
- ✅ Public sharing
- ✅ Search
- ✅ Dashboard

### v1.1.0 (Planned)
- Internal sharing with permissions
- Webhooks
- API keys for third-party integrations

---

Document créé : Décembre 2025
