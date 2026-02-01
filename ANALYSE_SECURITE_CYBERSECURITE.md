# Analyse de sécurité - Audit expert cybersécurité

## Résumé exécutif

Audit réalisé sur l'application SUPFile (Node.js/Express + MongoDB + React). L'application utilise **MongoDB (NoSQL)** — il n'y a pas d'injection SQL classique, mais des vulnérabilités NoSQL équivalentes ont été identifiées et corrigées.

---

## 1. INJECTIONS NoSQL

### Vulnérabilités identifiées et corrigées

| Endpoint | Risque | Correction |
|----------|--------|------------|
| **Admin/Users search** | `$regex` avec entrée utilisateur non échappée → ReDoS / injection | `sanitizeSearchInput()` échappe les caractères spéciaux, limite à 200 caractères |
| **listUsers search** | Même risque | Même correction |
| **Search files/folders** | Paramètre `q` passé à `$regex` | `sanitizeSearchInput()` appliqué |
| **sort_by / sort_order** | Clés utilisateur dans `sort()` → injection / prototype pollution | Whitelist stricte (`name`, `updated_at`, etc.) + `sanitizePaginationSort()` |
| **req.body / req.query** | Opérateurs `$where`, `$ne`, etc. | `sanitizeQuery` bloque les clés `$`, `.`, `__proto__` |

### Mécanismes de protection

- **escapeRegexString()** : Échappement des caractères `.*+?^${}()|[]\` avant utilisation dans `$regex`
- **sanitizeQuery** : Suppression récursive des clés dangereuses dans body/query
- **validateObjectId** : Validation des ID MongoDB sur toutes les routes sensibles
- **Whitelist sort** : Seuls `name`, `updated_at`, `created_at`, `size`, `mime_type` acceptés

---

## 2. ATTAQUES PAR FORCE BRUTE

### Rate limiting en place

| Route | Limite | Fenêtre |
|-------|--------|---------|
| **Auth globale** (login, signup, 2FA, refresh) | 10 requêtes | 15 min |
| **forgot-password** | 5 requêtes | 1 heure |
| **resend-verification** | 5 requêtes | 1 heure |
| **Upload** | 50 requêtes | 1 heure |
| **Partage** | 20 requêtes | 1 heure |
| **Général** | 500 requêtes | 15 min |

### Protections supplémentaires

- `skipSuccessfulRequests: true` sur auth → les connexions réussies ne comptent pas
- JWT avec expiration courte (1h) + refresh token (7j)
- Vérification en BDD à chaque requête authentifiée (utilisateur supprimé = 401)

---

## 3. OPEN REDIRECT (OAuth)

### Vulnérabilité critique corrigée

**Avant** : `?redirect=https://evil.com` → redirection post-OAuth vers un site malveillant (phishing).

**Corrections** :
- **Frontend (OAuthCallback)** : Validation stricte — uniquement chemins relatifs commençant par `/`. Blocage de `http`, `//`, `javascript:`, ou toute URL contenant `:`
- **Backend (OAuth)** : Stockage de `redirect` uniquement si chemin relatif (`/dashboard`, `/files`, etc.)
- **Mobile deep link** : Validation par regex `^supfile:\/\/oauth\/(google|github)\/callback` — rejet de `supfile://evil.com`

---

## 4. DOS / ABUS DE REQUÊTES

### Protections

- **Pagination** : `skip` ≤ 10000, `limit` ≤ 100
- **search** : Chaîne limitée à 200 caractères
- **admin** : `page` ≤ 1000, `limit` ≤ 100
- **Rate limiting** global et par type de route

---

## 5. AUTRES FAIBLESSES TRAITÉES

| Vulnérabilité | Protection |
|---------------|------------|
| **Prototype pollution** | Blocage des clés `__proto__`, `constructor`, `prototype` |
| **Path traversal** | `sanitizePath()` bloque `../` |
| **Noms de fichiers** | `validateFileName()` — caractères interdits, noms réservés Windows |
| **ObjectId invalides** | `validateObjectId` sur routes admin, files, folders, share |
| **folder_id (query)** | Validation ObjectId dans `listFiles` |

---

## 6. DÉJÀ EN PLACE (VÉRIFIÉ)

- **Helmet** : CSP, HSTS, X-Content-Type-Options, etc.
- **CORS** : Origines autorisées (Netlify, Fly, localhost)
- **JWT** : Algorithme HS256 explicite (pas de "none")
- **Bcrypt** : Hachage des mots de passe
- **Validation Joi** : signup, login, création de dossiers, partage
- **Session** : httpOnly, secure en prod, sameSite: lax

---

## 7. RECOMMANDATIONS SUPPLÉMENTAIRES

1. **JWT Secret** : Utiliser un secret fort (32+ caractères aléatoires), distinct en prod
2. **HTTPS** : S'assurer que tout le trafic est en HTTPS en production
3. **Logs** : Ne pas logger les tokens, mots de passe ou données sensibles
4. **Dépendances** : Exécuter régulièrement `npm audit` et corriger les vulnérabilités
5. **2FA** : La vérification 2FA est couverte par authLimiter ; envisager un rate limit dédié si besoin
