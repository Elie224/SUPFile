# 🔌 Routes API complètes - SUPFile

## 📋 Index des routes

**Base URL** : `/api`
**Total** : **37 routes**

---

## 🔐 AUTHENTIFICATION (`/api/auth`)

| Méthode | Route | Description | Auth | Rate Limit |
|---------|-------|-------------|------|------------|
| POST | `/auth/signup` | Inscription | ❌ | ✅ (5/5min) |
| POST | `/auth/login` | Connexion | ❌ | ✅ (5/5min) |
| POST | `/auth/refresh` | Rafraîchir token | ❌ | ❌ |
| POST | `/auth/logout` | Déconnexion | ✅ | ❌ |
| GET | `/auth/google` | Initier OAuth Google | ❌ | ❌ |
| GET | `/auth/google/callback` | Callback Google | ❌ | ❌ |
| GET | `/auth/github` | Initier OAuth GitHub | ❌ | ❌ |
| GET | `/auth/github/callback` | Callback GitHub | ❌ | ❌ |

---

## 📁 FICHIERS (`/api/files`)

| Méthode | Route | Description | Auth | Rate Limit |
|---------|-------|-------------|------|------------|
| GET | `/files` | Liste fichiers/dossiers | ✅ | ❌ |
| POST | `/files/upload` | Upload fichier | ✅ | ✅ (10/10min) |
| GET | `/files/trash` | Liste corbeille | ✅ | ❌ |
| GET | `/files/:id/download` | Télécharger | ⚠️* | ❌ |
| GET | `/files/:id/preview` | Prévisualiser | ✅ | ❌ |
| GET | `/files/:id/stream` | Stream audio/vidéo | ✅ | ❌ |
| PATCH | `/files/:id` | Renommer/Déplacer | ✅ | ❌ |
| DELETE | `/files/:id` | Supprimer | ✅ | ❌ |
| POST | `/files/:id/restore` | Restaurer | ✅ | ❌ |

*Optionnel (pour partages publics)

---

## 📂 DOSSIERS (`/api/folders`)

| Méthode | Route | Description | Auth | Rate Limit |
|---------|-------|-------------|------|------------|
| POST | `/folders` | Créer dossier | ✅ | ❌ |
| GET | `/folders/trash` | Liste corbeille | ✅ | ❌ |
| GET | `/folders/:id/download` | Télécharger ZIP | ⚠️* | ❌ |
| PATCH | `/folders/:id` | Renommer/Déplacer | ✅ | ❌ |
| DELETE | `/folders/:id` | Supprimer | ✅ | ❌ |
| POST | `/folders/:id/restore` | Restaurer | ✅ | ❌ |

*Optionnel (pour partages publics)

---

## 🔗 PARTAGE (`/api/share`)

| Méthode | Route | Description | Auth | Rate Limit |
|---------|-------|-------------|------|------------|
| POST | `/share/public` | Créer partage public | ✅ | ❌ |
| POST | `/share/internal` | Créer partage interne | ✅ | ❌ |
| GET | `/share/:token` | Accéder à un partage | ⚠️* | ✅ (20/15min) |
| GET | `/share` | Liste des partages | ✅ | ❌ |
| DELETE | `/share/:id` | Désactiver partage | ✅ | ❌ |

*Optionnel (pour partages publics)

---

## 🔍 RECHERCHE (`/api/search`)

| Méthode | Route | Description | Auth | Rate Limit |
|---------|-------|-------------|------|------------|
| GET | `/search` | Rechercher fichiers/dossiers | ✅ | ❌ |

**Paramètres** :
- `q` : Terme de recherche
- `type` : `all`, `file`, `folder`
- `mime_type` : Type MIME (`image/`, `video/`, etc.)
- `date_from` : Date début (ISO)
- `date_to` : Date fin (ISO)
- `sort_by` : `name`, `updated_at`, `size`
- `sort_order` : `asc`, `desc`
- `skip` : Offset pagination
- `limit` : Limite résultats (défaut: 50)

---

## 📊 DASHBOARD (`/api/dashboard`)

| Méthode | Route | Description | Auth | Rate Limit | Cache |
|---------|-------|-------------|------|------------|-------|
| GET | `/dashboard` | Statistiques utilisateur | ✅ | ❌ | ✅ (5min) |

---

## 👤 UTILISATEURS (`/api/users`)

| Méthode | Route | Description | Auth | Rate Limit |
|---------|-------|-------------|------|------------|
| GET | `/users/me` | Informations utilisateur | ✅ | ❌ |
| PATCH | `/users/me` | Modifier profil | ✅ | ❌ |
| POST | `/users/me/avatar` | Upload avatar | ✅ | ❌ |
| PATCH | `/users/me/password` | Changer mot de passe | ✅ | ❌ |
| PATCH | `/users/me/preferences` | Préférences | ✅ | ❌ |
| GET | `/users` | Liste utilisateurs | ✅ | ❌ |

**Paramètres GET `/users`** :
- `search` : Recherche email/nom

---

## 👨‍💼 ADMINISTRATION (`/api/admin`)

| Méthode | Route | Description | Auth | Admin | Rate Limit |
|---------|-------|-------------|------|-------|------------|
| GET | `/admin/stats` | Statistiques générales | ✅ | ✅ | ❌ |
| GET | `/admin/users` | Liste utilisateurs | ✅ | ✅ | ❌ |
| GET | `/admin/users/:id` | Détails utilisateur | ✅ | ✅ | ❌ |
| PUT | `/admin/users/:id` | Modifier utilisateur | ✅ | ✅ | ❌ |
| DELETE | `/admin/users/:id` | Supprimer utilisateur | ✅ | ✅ | ❌ |

**Paramètres GET `/admin/users`** :
- `page` : Numéro de page (défaut: 1)
- `limit` : Résultats par page (défaut: 20)
- `search` : Recherche email/nom

---

## 🏥 HEALTH CHECKS (`/api/health`)

| Méthode | Route | Description | Auth | Rate Limit |
|---------|-------|-------------|------|------------|
| GET | `/health` | Health check simple | ❌ | ❌ |
| GET | `/health/detailed` | Health check détaillé | ❌ | ❌ |

---

## 📝 Codes de réponse HTTP

- **200** : Succès
- **201** : Créé
- **400** : Requête invalide
- **401** : Non authentifié
- **403** : Accès refusé
- **404** : Non trouvé
- **409** : Conflit (email déjà utilisé)
- **413** : Fichier trop volumineux
- **500** : Erreur serveur
- **503** : Service indisponible

---

## 🔒 Authentification

Toutes les routes marquées **✅** nécessitent un token JWT dans le header :
```
Authorization: Bearer <access_token>
```

Les routes marquées **⚠️*** acceptent un token optionnel (pour partages publics).

---

## 📊 Format des réponses

### Succès
```json
{
  "data": { ... },
  "message": "Message optionnel"
}
```

### Erreur
```json
{
  "error": {
    "status": 400,
    "message": "Message d'erreur",
    "details": { ... }
  }
}
```

### Pagination
```json
{
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 100,
      "skip": 0,
      "limit": 50,
      "hasMore": true
    }
  }
}
```

---

**Total** : **37 routes API**

