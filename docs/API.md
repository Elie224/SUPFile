# API Documentation - SUPFile

Version: 1.0.0  
Last Updated: Décembre 2025

## Base URL

- **Development** : `http://localhost:5000/api`
- **Production** : `https://api.supfile.com/api`

## Authentication

Tous les endpoints (sauf mention contraire) nécessitent un JWT valide :

```
Authorization: Bearer <access_token>
```

Le token est obtenu via `/api/auth/login` ou `/api/auth/signup`.

### Token Format

```json
{
  "id": 1,
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

Toutes les réponses sont en JSON avec structure uniforme :

**Succès** (2xx) :
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Erreur** (4xx/5xx) :
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
  "passwordConfirm": "SecurePassword123!"
}
```

**Validation** :
- Email : format valide, unique
- Password : min 8 chars, 1 uppercase, 1 number

**Réponse** (201) :
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "display_name": null,
      "avatar_url": null,
      "created_at": "2025-12-09T10:00:00Z"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  },
  "message": "Account created successfully"
}
```

**Erreurs possibles** :
- 400 : Email déjà existant
- 400 : Validation échouée

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

**Réponse** (200) :
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "display_name": "John Doe",
      "avatar_url": "https://...",
      "quota_used": 1000000,
      "quota_limit": 32212254720,
      "preferences": {
        "theme": "light",
        "language": "en"
      }
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  },
  "message": "Login successful"
}
```

**Erreurs possibles** :
- 401 : Email ou mot de passe incorrect
- 404 : Utilisateur non trouvé

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
  "message": "Token refreshed"
}
```

**Erreurs possibles** :
- 401 : Refresh token invalide ou expiré

---

#### POST `/auth/oauth`

Connexion via OAuth2 (Google, GitHub, etc.).

**Authentification** : Non requise

**Body** :
```json
{
  "provider": "google",
  "code": "4/0AY0e..."
}
```

**Providers supportés** :
- `google`
- `github`
- `microsoft` (optionnel)

**Réponse** (200 ou 201) :
```json
{
  "data": {
    "user": { ... },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  },
  "message": "OAuth login successful"
}
```

**Notes** :
- Si c'est la première connexion → 201 (compte créé)
- Si le compte existe → 200 (connexion)

---

#### POST `/auth/logout`

Déconnexion et révocation du refresh token.

**Authentification** : Requise

**Réponse** (204) : Pas de contenu

---

### 👤 UTILISATEUR

#### GET `/users/me`

Récupérer les infos du profil utilisateur actuel.

**Authentification** : Requise

**Réponse** (200) :
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "display_name": "John Doe",
    "avatar_url": "https://...",
    "oauth_provider": null,
    "quota_used": 1000000,
    "quota_limit": 32212254720,
    "preferences": {
      "theme": "light",
      "language": "en",
      "notifications_enabled": true
    },
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
  "display_name": "Jane Doe",
  "avatar_url": "https://..."
}
```

**Réponse** (200) : Utilisateur mis à jour

**Erreurs possibles** :
- 400 : Données invalides
- 409 : Avatar URL non accessible

---

#### PATCH `/users/me/password`

Changer le mot de passe.

**Authentification** : Requise

**Body** :
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!",
  "new_password_confirm": "NewPassword456!"
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
  "theme": "dark",
  "language": "fr",
  "notifications_enabled": false
}
```

**Réponse** (200) : Préférences mises à jour

---

### 📁 DOSSIERS

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
    "id": 42,
    "name": "Mon Dossier",
    "owner_id": 1,
    "parent_id": null,
    "created_at": "2025-12-09T10:00:00Z",
    "updated_at": "2025-12-09T10:00:00Z"
  },
  "message": "Folder created"
}
```

**Erreurs possibles** :
- 400 : Nom de dossier vide
- 404 : Dossier parent non trouvé
- 403 : Pas de permission sur le dossier parent

---

#### PATCH `/folders/:id`

Renommer ou déplacer un dossier.

**Authentification** : Requise

**Body** (au moins un champ) :
```json
{
  "name": "Nouveau Nom",
  "parent_id": 10
}
```

**Réponse** (200) : Dossier mis à jour

---

#### DELETE `/folders/:id`

Supprimer un dossier et son contenu.

**Authentification** : Requise

**Réponse** (204) : Pas de contenu

**Notes** :
- Soft delete (peut être restauré)
- Cascade : tous les fichiers du dossier sont aussi supprimés

---

#### GET `/folders/:id/download`

Télécharger un dossier entier en ZIP.

**Authentification** : Requise

**Query Parameters** :
- `format` : `zip` (défaut), `tar`

**Réponse** (200) : Fichier ZIP en streaming

**Content-Type** : `application/zip`

---

### 📄 FICHIERS

#### GET `/files`

Lister les fichiers d'un dossier.

**Authentification** : Requise

**Query Parameters** :
- `folder_id` : ID du dossier (défaut : racine)
- `skip` : Nombre d'éléments à ignorer (défaut : 0)
- `limit` : Nombre d'éléments à retourner (défaut : 50, max : 200)
- `sort_by` : `name`, `date`, `size` (défaut : `date`)
- `sort_order` : `asc`, `desc` (défaut : `desc`)

**Réponse** (200) :
```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "name": "document.pdf",
        "type": "file",
        "mime_type": "application/pdf",
        "size": 1024000,
        "created_at": "2025-12-09T10:00:00Z",
        "updated_at": "2025-12-09T10:00:00Z"
      },
      {
        "id": 2,
        "name": "Images",
        "type": "folder",
        "created_at": "2025-12-08T10:00:00Z",
        "updated_at": "2025-12-08T10:00:00Z"
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
    "id": 123,
    "name": "photo.jpg",
    "mime_type": "image/jpeg",
    "size": 2048000,
    "file_path": "/uploads/user_1/uuid-123.jpg",
    "created_at": "2025-12-09T10:00:00Z"
  },
  "message": "File uploaded"
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
  "folder_id": 42
}
```

**Réponse** (200) : Fichier mis à jour

---

#### DELETE `/files/:id`

Supprimer un fichier (corbeille).

**Authentification** : Requise

**Réponse** (204) : Pas de contenu

**Notes** : Soft delete - peut être restauré via `/files/:id/restore`

---

#### POST `/files/:id/restore`

Restaurer un fichier supprimé.

**Authentification** : Requise

**Réponse** (200) : Fichier restauré

**Erreurs possibles** :
- 404 : Fichier non trouvé dans la corbeille
- 507 : Pas assez de quota pour restaurer

---

#### GET `/files/:id/download`

Télécharger un fichier.

**Authentification** : Requise (sauf si accès via lien public)

**Réponse** (200) : Fichier en streaming

**Content-Type** : Basé sur le MIME type du fichier

---

#### GET `/files/:id/preview`

Prévisualiser un fichier (image, PDF, texte).

**Authentification** : Requise

**Query Parameters** :
- `size` : `small`, `medium`, `large` (pour images)

**Réponse** (200) :
```json
{
  "data": {
    "content": "base64_encoded_image_or_text",
    "mime_type": "image/jpeg",
    "size": 1024
  }
}
```

**Types supportés** :
- Images : JPG, PNG, GIF, WebP
- Documents : PDF, TXT, MD
- Code : JS, JSON, HTML, CSS, etc.

---

#### GET `/files/:id/stream`

Streamer un fichier audio/vidéo.

**Authentification** : Requise

**Query Parameters** :
- `range` : HTTP Range Header (optionnel, pour seek)

**Réponse** (200 ou 206) :
- 200 : Streaming complet
- 206 : Partial content (seek)

**Content-Type** : Basé sur le fichier

---

### 🔗 PARTAGE

#### POST `/share/public`

Générer un lien public pour partager un fichier ou dossier.

**Authentification** : Requise

**Body** :
```json
{
  "file_id": 123,
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
    "id": 456,
    "token": "abc123xyz...",
    "share_url": "https://supfile.com/s/abc123xyz",
    "expires_at": "2025-12-31T23:59:59Z",
    "created_at": "2025-12-09T10:00:00Z"
  },
  "message": "Share link created"
}
```

---

#### POST `/share/internal`

Partager un dossier avec un autre utilisateur inscrit.

**Authentification** : Requise

**Body** :
```json
{
  "folder_id": 42,
  "user_id": 2
}
```

**Réponse** (201) : Partage créé

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
    "file_or_folder": {
      "id": 123,
      "name": "photo.jpg",
      "size": 2048000,
      "created_at": "2025-12-09T10:00:00Z"
    },
    "download_token": "xyz789..."  // Token temporaire pour download
  }
}
```

**Erreurs possibles** :
- 404 : Lien inexistant
- 401 : Mot de passe requis/incorrect
- 403 : Lien expiré

---

### 🔍 RECHERCHE

#### GET `/search`

Rechercher des fichiers et dossiers.

**Authentification** : Requise

**Query Parameters** :
- `q` : Terme de recherche (obligatoire)
- `type` : `file`, `folder` (optionnel)
- `mime_type` : Filtrer par MIME type (optionnel)
- `from_date` : Date de début (optionnel, ISO format)
- `to_date` : Date de fin (optionnel, ISO format)
- `min_size` : Taille minimale en bytes (optionnel)
- `max_size` : Taille maximale en bytes (optionnel)
- `skip` : Offset (optionnel)
- `limit` : Limite (optionnel)

**Exemples** :
```
GET /search?q=rapport&type=file&mime_type=application/pdf
GET /search?q=2024&from_date=2024-01-01&to_date=2024-12-31
GET /search?q=.jpg&type=file&min_size=1000000&max_size=5000000
```

**Réponse** (200) :
```json
{
  "data": {
    "results": [
      {
        "id": 1,
        "name": "rapport_2024.pdf",
        "type": "file",
        "mime_type": "application/pdf",
        "size": 512000,
        "folder_path": "/Documents/Annuel",
        "created_at": "2025-12-09T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "skip": 0,
      "limit": 50
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
    "user_quota": {
      "used": 5368709120,
      "limit": 32212254720,
      "percentage": 16.66,
      "available": 26844545600
    },
    "storage_breakdown": [
      {
        "type": "video",
        "size": 3221225472,
        "count": 15,
        "percentage": 60
      },
      {
        "type": "image",
        "size": 1073741824,
        "count": 250,
        "percentage": 20
      },
      {
        "type": "document",
        "size": 536870912,
        "count": 45,
        "percentage": 10
      },
      {
        "type": "other",
        "size": 536870912,
        "count": 100,
        "percentage": 10
      }
    ],
    "recent_files": [
      {
        "id": 1,
        "name": "video.mp4",
        "type": "file",
        "size": 1073741824,
        "modified_at": "2025-12-09T15:30:00Z"
      }
    ],
    "shared_count": 12,
    "public_links_count": 5
  }
}
```

---

## Rate Limiting

Pour éviter les abus :

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `/auth/login` | 5 tentatives | 15 minutes |
| `/auth/signup` | 3 compte/heure | 1 heure |
| `/files/upload` | 100 files/heure | 1 heure |
| Autres GET | 1000 req/heure | 1 heure |
| Autres POST/PATCH/DELETE | 500 req/heure | 1 heure |

**En cas de dépassement** : Réponse 429 Too Many Requests

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
