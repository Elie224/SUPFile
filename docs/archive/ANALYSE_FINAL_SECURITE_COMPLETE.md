# Analyse finale de sécurité – Application complète

Audit très approfondi de toutes les pages et de l’ensemble de l’application (backend, frontend web, mobile) : **injections NoSQL**, **failles de sécurité**, **vecteurs de piratage / hack**.

---

## 1. Injections NoSQL – Synthèse

### 1.1 Entrées utilisateur passant dans des requêtes MongoDB

| Source | Utilisation | Protection |
|--------|-------------|------------|
| **req.query.q** (recherche) | `FileModel.search`, `FolderModel.search` → `$regex` | `sanitizeSearchInput(q)` + `safeQ` (échappement regex, max 200 caractères). |
| **req.query.search** (admin / users) | `$regex` sur email, display_name | `sanitizeSearchInput(search)`. |
| **req.query.mime_type** | Filtre recherche → `$regex` ou égalité | `_sanitizeMimeType()` (whitelist + format type/subtype). |
| **req.query.date_from / date_to** | `$gte` / `$lte` sur updated_at | `_parseSafeDate()` (date valide, années 1970–2100). |
| **req.query.sort_by, skip, limit** | Tri et pagination | `sanitizePaginationSort()` (liste blanche, bornes). |
| **req.body / req.query (global)** | Toute requête MongoDB construite à partir du body/query | Middleware **sanitizeQuery** : suppression des clés `$`, `__proto__`, `constructor`, `prototype`, `.`, et liste d’opérateurs dangereux. |
| **req.params.id, file_id, folder_id, user_id, share_id** | findById, findOne, etc. | **validateObjectId** sur les routes concernées. |
| **req.body.file_id, folder_id, shared_with_user_id** | Partages, upload, etc. | **validateObjectId** (vérifie le body lorsque le middleware est utilisé). |
| **req.query.parent_id** (GET /api/folders) | `FolderModel.findByOwner(userId, parentId)` → `new ObjectId(parentId)` | **Corrigé** : validation dans le contrôleur ; si non null/root, doit être un ObjectId valide (sinon 400). |
| **req.body.parent_id** (createFolder, updateFolder) | `FolderModel.findById(parentId)` | **Corrigé** : validation ObjectId dans le contrôleur avant utilisation. |
| **req.body.file_id, folder_id** (POST /share/public) | `FileModel.findById`, `FolderModel.findById` | **Corrigé** : **validateObjectId** ajouté sur la route. |

### 1.2 Protections globales

- **sanitizeQuery** (security.js) : appliqué à toutes les routes ; nettoie récursivement body et query (opérateurs `$`, prototype pollution, clés avec `.`).
- **validateFileName / validateName** : noms de fichiers/dossiers (caractères interdits, path traversal).
- **sanitizePath** : chemins de fichiers (pas de `..`).
- Aucune utilisation de **$where** ou de requêtes construites à partir de chaînes non échappées.

### 1.3 Risque SQL

- **Aucun** : base MongoDB uniquement (NoSQL).

---

## 2. Failles corrigées lors de cette analyse

### 2.1 searchController.js (déjà corrigé précédemment)

- Variable **safeQ** non définie → `safeQ = sanitizeSearchInput(q)`.
- **mime_type** non validé → `_sanitizeMimeType(mime_type)`.
- **date_from / date_to** non validés → `_parseSafeDate()`.

### 2.2 foldersController.js

- **listFolders** : `parent_id` (query) passé à `findByOwner` ; si invalide, `new ObjectId(parentId)` pouvait lancer une exception (DoS / erreur 500).  
  → Validation : si `parent_id` n’est pas null/root/vide, il doit être un ObjectId valide (24 caractères hex) ; sinon 400.
- **createFolder** : `parent_id` (body) utilisé dans `findById(parentId)` sans vérification.  
  → Validation : si présent, doit être un ObjectId valide ; sinon 400.
- **updateFolder** : `parent_id` (body) utilisé dans `findById(parent_id)` sans vérification.  
  → Validation : si présent et non vide, doit être un ObjectId valide ; sinon 400.

### 2.3 Routes partage

- **POST /api/share/public** : `file_id` et `folder_id` dans le body n’étaient pas validés par **validateObjectId**.  
  → Middleware **validateObjectId** ajouté sur cette route (vérification body).

---

## 3. Autres vecteurs de piratage / hack analysés

### 3.1 Authentification et autorisation

| Élément | État |
|--------|------|
| Routes protégées | authMiddleware sur /api/users, /api/files, /api/folders, /api/dashboard, /api/search, /api/share (liste), /api/admin, /api/2fa. |
| Admin | adminMiddleware vérifie `is_admin` ; suppression utilisateur limitée à l’admin principal (email fixe). |
| Propriété des ressources | Vérification owner_id avant accès/modification (fichiers, dossiers, partages). |
| JWT | Algorithme fixé HS256 ; pas de fallback « none » ; vérification de l’existence de l’utilisateur. |
| Sessions OAuth | Secret de session sans fallback en prod ; secrets vérifiés au démarrage (securityCheck.js). |

### 3.2 Rate limiting

- Global, auth, upload, share, forgot-password / resend-verification (emailSensitiveLimiter).
- Réduction des attaques par force brute et abus d’envoi d’emails.

### 3.3 Validation des entrées (Joi)

- Signup, login, createFolder, rename, publicShare, changePassword, etc.
- Réduction des données malformées et des champs inattendus (stripUnknown).

### 3.4 Frontend web

- Aucun **dangerouslySetInnerHTML**, **eval**, **document.write** détecté → pas de vecteur XSS direct identifié.
- Logs sensibles supprimés ou limités au mode développement (token, URL, email, IDs).
- Redirection OAuth : validation du paramètre redirect (chemin relatif uniquement).

### 3.5 Upload et fichiers

- Extensions dangereuses bloquées (fileValidation.js).
- Validation MIME optionnelle (STRICT_MIME_VALIDATION).
- Path traversal : sanitizePath, validateFileName.
- validateFilePath sur la route d’upload.

### 3.6 Partages publics

- Accès par token : `findByToken(token)` (égalité sur `public_token`, pas de regex utilisateur).
- Mot de passe partage : bcrypt.
- Expiration : vérification `expires_at`.

### 3.7 Scripts et config

- test-oauth-config.js, checkUser.js : refus d’exécution si `NODE_ENV === 'production'`.
- Health et racine API : réponses limitées en production (pas de memory, readyState, liste d’endpoints détaillée).
- Pas de stack trace ni d’URI/config exposés en production (errorHandler, db, logs).

---

## 4. Recommandations restantes

| Priorité | Recommandation |
|----------|-----------------|
| Moyenne | Activer **STRICT_MIME_VALIDATION=true** en production pour les uploads (validation stricte des types MIME). |
| Basse | Limiter la longueur du paramètre **token** (GET /api/share/:token) pour éviter des URLs démesurées (ex. 200 caractères max). |
| Basse | Flux OAuth en « authorization code » côté backend pour éviter de passer les tokens dans l’URL du callback. |
| Bonnes pratiques | Conserver Joi + validateObjectId + sanitizeQuery sur toutes les routes qui prennent des IDs ou des filtres. |

---

## 5. Récapitulatif des fichiers modifiés (cette analyse)

- **backend/controllers/searchController.js** : safeQ, _sanitizeMimeType, _parseSafeDate (déjà fait).
- **backend/controllers/foldersController.js** : validation de `parent_id` (query et body) pour listFolders, createFolder, updateFolder.
- **backend/routes/share.js** : ajout de **validateObjectId** sur POST /public.

---

## 6. Tableau de synthèse – Injections et failles

| Type de faille | Détecté | Statut |
|----------------|---------|--------|
| Injection NoSQL (opérateurs $, body/query) | Oui | Mitigé (sanitizeQuery). |
| Injection NoSQL ($regex, chaîne de recherche) | Oui | Mitigé (sanitizeSearchInput, safeQ, escape dans les modèles). |
| ReDoS (regex utilisateur) | Oui | Mitigé (échappement + limite longueur). |
| Prototype pollution (__proto__, constructor) | Oui | Mitigé (sanitizeQuery). |
| ObjectId invalide (crash / DoS) | Oui | Mitigé (validateObjectId + validations parent_id). |
| Path traversal | Oui | Mitigé (sanitizePath, validateFileName). |
| IDOR (accès à une ressource d’un autre utilisateur) | Vérifié | Mitigé (vérification owner_id, authMiddleware). |
| XSS (frontend) | Vérifié | Aucun vecteur évident (pas de dangerouslySetInnerHTML, etc.). |
| Exposition de secrets (logs, health, config) | Oui | Mitigé (logs conditionnés, health/racine limités, scripts protégés). |
| Force brute / email bombing | Oui | Mitigé (rate limiting). |

---

*Rapport d’analyse finale de sécurité. Toutes les failles d’injection NoSQL et les vecteurs de piratage identifiés ont été traités ou documentés avec des corrections appliquées dans le code.*
