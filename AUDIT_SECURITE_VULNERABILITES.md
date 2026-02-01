# Audit de sécurité – Vulnérabilités et vecteurs d’attaque détectés

Rapport d’audit réalisé pour identifier les **moyens d’accès**, **secrets**, **codes sensibles** et **lignes à risque** pouvant être exploités par un attaquant.

---

## 1. Secrets et valeurs par défaut dangereuses

### 1.1 Session secret (CRITIQUE si non surchargé en prod)

| Fichier | Ligne | Détail |
|---------|-------|--------|
| `backend/app.js` | 182 | `secret: process.env.SESSION_SECRET \|\| config.jwt.secret \|\| 'supfile-session-secret-change-in-production'` |

**Risque :** Si `SESSION_SECRET` et `JWT_SECRET` ne sont pas définis en production, le secret de session est **prévisible**. Un attaquant peut forger des cookies de session.

**Action :** En production, refuser de démarrer si `SESSION_SECRET` (ou `JWT_SECRET`) est absent ; ne jamais utiliser de fallback en prod.

---

### 1.2 JWT secrets

| Fichier | Ligne | Détail |
|---------|-------|--------|
| `backend/config.js` | 21-22 | `secret: process.env.JWT_SECRET`, `refreshSecret: process.env.JWT_REFRESH_SECRET` |

**Risque :** Si non définis, `jwt.sign()` reçoit `undefined` et peut lever une erreur ou avoir un comportement indéfini. En dev, les tests utilisent des secrets fixes (`jest.setup.js`).

**Action :** Au démarrage, en production, vérifier que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont définis et d’au moins 32 caractères.

---

### 1.3 Fichiers / scripts exposant la config

| Fichier | Détail |
|---------|--------|
| `backend/scripts/test-oauth-config.js` | Affiche si Client ID/Secret sont configurés et **Redirect URI** (lignes 5-28). À ne pas exécuter sur un serveur exposé. |
| `.env.example` | Contient des mots de passe d’exemple (`changeme_secure_password_here`, `your_jwt_secret_key_here_min_32_chars_strong`). Ne doit jamais être copié en `.env` sans être modifié. |
| `backend/scripts/checkUser.js` | Ligne 10 : `mongodb://[REDACTED] en fallback si `MONGO_URI` absent. |

**Action :** Ne pas déployer les scripts de diagnostic (test-oauth-config, checkUser) sur l’environnement de production, ou les désactiver par variable d’environnement.

---

## 2. Points d’accès (routes) sensibles

### 2.1 Routes publiques (sans authentification)

| Méthode | Route | Usage |
|---------|--------|--------|
| GET | `/health` | Health check minimal (OK pour monitoring). |
| GET | `/api/health` | Statut + timestamp + uptime + **environment**. |
| GET | `/api/health/detailed` | Statut + **memory**, **database.readyState**, environment. |
| POST | `/api/auth/register` | Inscription (rate limité). |
| POST | `/api/auth/login` | Connexion (rate limité, 10 req/15 min par défaut). |
| GET | `/api/files/:id/download` | **Optionnel auth** : accès avec `?token=...` (partage public). |
| GET | `/api/folders/:id/download` | **Optionnel auth** : idem, partage par token. |
| GET | `/api/share/:token` | Accès au partage public par token (optionnel auth). |
| GET | `/api/auth/google`, `/api/auth/github` | Démarrage OAuth (redirection). |
| GET | `/api/auth/google/callback`, `/api/auth/github/callback` | Callback OAuth. |

**Risques :**
- **`/api/health/detailed`** : en production, exposition de `environment`, `memory`, `database.readyState` peut aider un attaquant à cartographier l’infra. Recommandation : en prod, retourner uniquement `status` et éventuellement `database.status` sans détails mémoire/environnement.
- **Download par token** : l’accès repose sur le secret du lien (`token`). Si le token est deviné ou fuité (URL partagée, logs, Referer), le fichier/dossier est accessible. Les partages protégés par mot de passe sont renforcés (bcrypt).

---

### 2.2 Routes protégées (authentification requise)

- `/api/users`, `/api/files`, `/api/folders`, `/api/dashboard`, `/api/search` : **authMiddleware**.
- `/api/admin/*` : **authMiddleware + adminMiddleware** (vérification `is_admin`).
- `/api/2fa/*` : **authMiddleware**.

Aucune route sensible n’est exposée sans contrôle d’accès.

---

## 3. Lignes et codes à risque (déjà mitigés ou à surveiller)

### 3.1 NoSQL / ReDoS

| Fichier | Lignes | Détail |
|---------|--------|--------|
| `backend/controllers/adminController.js` | 87-88 | `$regex: safeSearch` avec `sanitizeSearchInput()` (safe). |
| `backend/controllers/usersController.js` | 240-241 | Idem. |
| `backend/models/fileModel.js` | 188, 193, 195, 197 | `$regex: escapedQuery` / patterns fixes (`^image/`, etc.). |
| `backend/models/folderModel.js` | 142 | `$regex: escapedQuery` (échappé). |
| `backend/middlewares/security.js` | 153-206 | `sanitizeQuery()` supprime `$`, `__proto__`, `.` dans les clés. |

**État :** Entrées utilisateur passant par `escapeRegexString` / `sanitizeSearchInput` et requêtes nettoyées par `sanitizeQuery`. Pas d’injection NoSQL évidente.

---

### 3.2 Authentification JWT

| Fichier | Lignes | Détail |
|---------|--------|--------|
| `backend/utils/jwt.js` | 11, 23, 36-38 | `jwt.sign` / `jwt.verify` avec **algorithm: 'HS256'** explicite (pas de “alg:none”). |
| `backend/middlewares/authMiddleware.js` | 23, 76 | `jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] })`. |

**État :** Algorithme fixé, pas de bypass par en-tête `alg`.

---

### 3.3 Redirection (Open Redirect)

| Fichier | Lignes | Détail |
|---------|--------|--------|
| `frontend-web/src/pages/OAuthCallback.jsx` | 19-23 | Rejet des `redirect` en `http`, `//`, `javascript:`, et chemins non relatifs. |
| `backend/controllers/oauthController.js` | 41-46 | Stockage en session de `redirect` uniquement si chemin relatif sûr. |

**État :** Risque d’open redirect limité côté front et back.

---

### 3.4 Exposition d’informations

| Fichier | Lignes | Détail |
|---------|--------|--------|
| `backend/app.js` | 273-305 | `GET /` renvoie **environment**, **endpoints**, **frontend** URL. Utile pour doc, mais révèle la structure de l’API. |
| `backend/middlewares/errorHandler.js` | 70-74 | Stack trace et type d’erreur **uniquement en development**. |

**Recommandation :** En production, réduire les infos exposées sur `GET /` (par ex. pas de liste d’endpoints détaillée).

---

## 4. Synthèse des moyens d’attaque et parades

| Vecteur | Moyen d’accès / secret | Parade actuelle | Action recommandée |
|--------|------------------------|----------------|---------------------|
| **Session forgée** | Secret de session prévisible si env non défini | Fallback codé en dur | Refuser le démarrage en prod sans `SESSION_SECRET` |
| **JWT forgé** | Secret JWT faible ou absent | Algorithme fixé HS256 | Vérifier présence et force des secrets au démarrage |
| **Force brute login** | POST `/api/auth/login` | authLimiter (10/15 min) | Conserver ; optionnel : 2FA pour tous les comptes sensibles |
| **Email bombing** | POST forgot-password / resend-verification | emailSensitiveLimiter (5/h) | Déjà en place |
| **Injection NoSQL** | Body/query dans requêtes MongoDB | sanitizeQuery + escape regex | Déjà en place |
| **Accès fichier/dossier** | Token de partage dans l’URL | Token long et aléatoire | Éviter de logger ou d’exposer l’URL complète |
| **Infos techniques** | GET `/`, `/api/health/detailed` | Réponse JSON détaillée | Réduire en prod (health détaillé, racine) |
| **Scripts config** | test-oauth-config.js, checkUser.js | Logs Redirect URI / présence secrets | Ne pas exécuter en prod ; ou désactiver par env |

---

## 5. Checklist de durcissement (corrections appliquées)

- [x] **En production** : ne pas démarrer si `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET` sont absents ou trop courts → **`backend/utils/securityCheck.js`** + appel au démarrage dans `loadRestOfApp()`.
- [x] **Health** : en prod, limiter `/api/health` et `/api/health/detailed` (pas de memory, readyState, environment) → **`backend/routes/health.js`**.
- [x] **Racine API** : en prod, réduire `GET /` (pas de liste d’endpoints ni frontend URL) → **`backend/app.js`**.
- [x] **Session secret** : en prod, aucun fallback codé en dur → **`backend/app.js`** (secret = SESSION_SECRET ou JWT_SECRET uniquement).
- [x] **Scripts** : refus d’exécution en production pour `test-oauth-config.js` et `checkUser.js` → garde en tête du script.
- [ ] **.env** : s’assurer que `.env` est ignoré par Git et que `.env.example` ne contient jamais de vrais secrets.
- [ ] **Partages** : rappeler aux utilisateurs de ne pas partager les liens de partage (URL + token) sur des canaux non sécurisés.

---

## 6. Vulnérabilités supplémentaires détectées et corrigées

### 6.1 Fuite d’informations côté frontend (CRITIQUE – corrigée)

| Fichier | Détail |
|---------|--------|
| `frontend-web/src/services/api.js` | L’intercepteur du **downloadClient** loguait en console : URL de la requête, présence du token, **longueur du token**, **aperçu du token (20 premiers caractères)**, en-têtes avant/après, clés du localStorage. En production (ou si la console est partagée), un attaquant pouvait récupérer un fragment du JWT et tenter des attaques. |

**Correction appliquée :** Suppression de tous les `console.log` / `console.warn` / `console.error` sensibles dans l’intercepteur de téléchargement. Aucun log d’URL, de token ou de headers. Suppression du `console.warn` exposant l’URL dans l’intercepteur principal (apiClient).

### 6.2 Vecteurs à garder en tête (non corrigés par code)

| Vecteur | Détail |
|--------|--------|
| **JWT dans localStorage** | Les tokens sont stockés dans `localStorage` (comportement courant). En cas de **XSS**, un script peut les voler. Mitigation : pas d’injection de HTML non échappé côté frontend ; CSP et bonnes pratiques XSS. |
| **Tokens OAuth dans l’URL** | Après callback OAuth, les tokens sont passés dans l’URL (`/auth/callback?tokens=...`). Ils peuvent apparaître dans l’historique du navigateur, le Referer ou les logs serveur. Mitigation idéale : flux “authorization code” côté backend (échange code → tokens côté serveur). |
| **Validation MIME stricte** | La validation MIME des uploads n’est active que si `STRICT_MIME_VALIDATION=true`. Par défaut, seules les extensions dangereuses sont bloquées ; le type MIME envoyé par le client peut être trompeur. |

---

## 7. Application mobile (Flutter) – Audit et état

### 7.1 Points vérifiés (déjà sécurisés)

| Élément | Fichier / pratique | État |
|--------|---------------------|------|
| **Stockage des tokens** | `lib/utils/secure_storage.dart` – FlutterSecureStorage avec chiffrement (Android : RSA + AES-GCM, iOS : Keychain) | ✅ Tokens jamais en clair sur disque |
| **Logs** | `lib/utils/secure_logger.dart` – Logs uniquement en `kDebugMode`, sanitization des clés sensibles (password, token, authorization, etc.), redaction Bearer/JWT dans les chaînes | ✅ Aucune fuite de secrets en release |
| **Pas de print/debugPrint** | Aucun `print()` ou `debugPrint()` dans `lib/` | ✅ Pas de logs bruts en production |
| **API URL** | `lib/utils/constants.dart` – `String.fromEnvironment('API_URL', defaultValue: 'https://supfile.fly.dev')` | ✅ Pas de secret codé en dur ; URL configurable au build |
| **Validation des entrées** | `lib/utils/input_validator.dart` – validation mot de passe, token de partage | ✅ En place |
| **Rate limiting** | `lib/utils/rate_limiter.dart` + intercepteur Dio | ✅ Limite les abus côté client |
| **HTTPS** | Dio avec `validateStatus` ; pas de désactivation SSL | ✅ Connexions chiffrées |

### 7.2 Recommandations mobile

- En **release**, les builds Flutter n’incluent pas les logs (SecureLogger utilise `kDebugMode`).
- Ne pas exposer l’URL de l’API avec des secrets en query (déjà le cas).
- Pour les builds de production, utiliser `--dart-define=API_URL=https://votre-api.com` pour fixer l’endpoint.

---

## 8. Synthèse audit – Moyens, accès, lignes, secrets, codes

| Domaine | Détecté | Fermé / Mitigé |
|---------|---------|-----------------|
| **Secrets backend** | JWT/SESSION en env, fallback codé en dur | Vérification au démarrage en prod ; pas de fallback session |
| **Logs backend** | Params, query, auth, chemins, stack, URI, config OAuth | Supprimés ou conditionnés à `NODE_ENV !== 'production'` |
| **Logs frontend web** | Token, URL, headers, email, IDs, réponses API | Supprimés ou limités à `import.meta.env.DEV` |
| **Health / racine API** | Détails mémoire, environnement, liste d’endpoints | Réduits en production |
| **Scripts** | test-oauth-config, checkUser exposent config/URI | Refus d’exécution si `NODE_ENV === 'production'` |
| **Routes** | Toutes protégées par auth/admin + rate limiting | Aucune route sensible sans contrôle |
| **Mobile** | Tokens, logs, API URL | SecureStorage, SecureLogger (kDebugMode), pas de print |

*Rapport d’audit de sécurité (web + mobile). Les corrections listées ont été implémentées ; les accès identifiés ont été fermés ou réduits au minimum.*
