# Analyse des injections NoSQL/SQL et failles de sécurité

Audit réalisé en profondeur (backend, contrôleurs, modèles) pour détecter les **injections NoSQL**, **ReDoS**, **prototype pollution** et autres failles exploitables.

---

## 1. Injections NoSQL – État par zone

### 1.1 Entrées utilisateur dans les requêtes MongoDB

| Zone | Source | Utilisation | Protection |
|------|--------|-------------|------------|
| **searchController** | `req.query.q` | Passé à `FileModel.search(userId, safeQ, filters)` et `FolderModel.search(userId, safeQ, filters)` | **Corrigé** : `safeQ = sanitizeSearchInput(q)` (échappement regex + limite 200 caractères). Avant correction : `safeQ` était **indéfini** (variable non déclarée) → risque de crash ou passage de données non sanitaires. |
| **searchController** | `req.query.mime_type` | Passé dans `filters.mimeType` → `$regex` ou égalité dans fileModel | **Corrigé** : `_sanitizeMimeType(mime_type)` – whitelist de préfixes + pattern `type/subtype` ; rejet de `.*` ou chaînes malveillantes. |
| **searchController** | `req.query.date_from`, `req.query.date_to` | Passés dans `filters.dateFrom/dateTo` → `$gte` / `$lte` dans fileModel/folderModel | **Corrigé** : `_parseSafeDate()` – validation `new Date()`, rejet NaN et années hors 1970–2100. |
| **searchController** | `req.query` (sort, skip, limit) | `sanitizePaginationSort(req.query)` | **Déjà en place** : liste blanche pour `sort_by`, `sort_order` ; bornes pour `skip` (max 10000) et `limit` (max 100). |
| **adminController** | `req.query.search` | `$regex: safeSearch` sur email / display_name | **Déjà en place** : `safeSearch = sanitizeSearchInput(search)`. |
| **usersController** | `req.query.search` (listUsers) | Idem | **Déjà en place** : `sanitizeSearchInput(search)`. |
| **fileModel.search** | Paramètre `query` | `$regex: escapedQuery` sur le nom | **Déjà en place** : échappement regex dans le modèle ; le contrôleur passe désormais `safeQ` (sanitizeSearchInput). |
| **folderModel.search** | Paramètre `query` | Idem | **Déjà en place** : échappement regex dans le modèle. |

### 1.2 Opérateurs MongoDB et prototype pollution

| Mécanisme | Fichier | Protection |
|-----------|---------|------------|
| **req.body / req.query bruts** | Global | Middleware `sanitizeQuery` (security.js) : suppression récursive des clés `$`, `__proto__`, `constructor`, `prototype`, clés contenant `.`, et liste d’opérateurs dangereux (`$where`, `$regex`, `$ne`, etc.). |
| **IDs (params)** | Routes | `validateObjectId` sur `id`, `file_id`, `folder_id`, `user_id`, `share_id` (format ObjectId). |
| **IDs (body)** | security.js | Validation ObjectId pour `file_id`, `folder_id`, `shared_with_user_id`. |

### 1.3 Autres requêtes (sans entrée utilisateur non fiable)

- **findById(id)** : `id` vient de `req.params` après `validateObjectId` ou de `req.user.id` (JWT).
- **findOne({ email })** : `email` vient du body validé par Joi (auth, signup, etc.).
- **Tokens (reset password, verify email)** : comparés après hash (sha256) ; pas d’injection.
- **dashboardController** : agrégations avec regex **fixes** (`^image/`, `^video/`, etc.) sur `mime_type` ; pas d’entrée utilisateur dans la requête.

---

## 2. Failles corrigées dans cette analyse

### 2.1 searchController.js

1. **Variable `safeQ` non définie**  
   - **Risque** : `safeQ` utilisé pour les recherches fichiers/dossiers était indéfini (référence à une variable non déclarée). Comportement indéfini et possible passage de données non contrôlées.  
   - **Correction** : `const safeQ = sanitizeSearchInput(q);` pour sanitiser le paramètre de recherche `q`.

2. **Paramètre `mime_type` non validé**  
   - **Risque** : valeur comme `.*` ou chaînes complexes pouvant être utilisées dans un contexte regex (ReDoS ou correspondance trop large).  
   - **Correction** : `_sanitizeMimeType(mime_type)` avec whitelist de préfixes et format `type/subtype` strict.

3. **Paramètres `date_from` / `date_to` non validés**  
   - **Risque** : valeurs invalides ou extrêmes donnant `Invalid Date` ou requêtes inattendues.  
   - **Correction** : `_parseSafeDate()` avec vérification de date valide et plage d’années 1970–2100.

---

## 3. Synthèse des vecteurs d’injection

| Vecteur | Statut |
|---------|--------|
| **NoSQL – opérateurs dans body/query** | Mitigé par `sanitizeQuery` (global). |
| **NoSQL – chaînes de recherche ($regex)** | Mitigé par `sanitizeSearchInput` / `escapeRegexString` et utilisation de `safeQ` dans searchController. |
| **NoSQL – tri / pagination** | Mitigé par `sanitizePaginationSort` (liste blanche + bornes). |
| **Prototype pollution** | Mitigé par `sanitizeQuery` (blocage `__proto__`, `constructor`, `prototype`). |
| **Path traversal** | Mitigé par `sanitizePath` et `validateFileName` (noms de fichiers/dossiers). |
| **ObjectId invalides** | Mitigé par `validateObjectId` sur les routes concernées. |
| **SQL** | Non applicable (MongoDB uniquement). |

---

## 4. Recommandations supplémentaires

- **Validation des schémas** : continuer à utiliser Joi (ou équivalent) sur tous les body/query critiques (auth, partage, etc.).
- **Rate limiting** : déjà en place sur auth, forgot-password, upload, share ; à conserver.
- **Logs** : ne pas logger les paramètres de recherche ni les tokens (déjà durci dans les sessions précédentes).
- **Tests** : ajouter des tests ciblés pour les paramètres de recherche (chaînes avec `.*`, `(a+)+`, opérateurs `$`, etc.) et pour les dates/mime_type invalides.

---

*Rapport généré après analyse des contrôleurs, modèles et middlewares. Les corrections listées ont été appliquées dans le code.*
