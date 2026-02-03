# Analyse de sécurité - Application SUPFile

## Résumé exécutif

Analyse approfondie des vulnérabilités (injection NoSQL, SQL, brute force, etc.) et des corrections appliquées.

---

## 1. Injections NoSQL (MongoDB)

### Vulnérabilités identifiées et corrigées

| Endpoint | Risque | Correction |
|----------|--------|------------|
| **Admin/users** `search` | `$regex` avec entrée utilisateur non échappée → ReDoS, injection | `sanitizeSearchInput()` échappe les caractères spéciaux, limite 200 car. |
| **Users/list** `search` | Même risque | Idem |
| **Search** `q` | Paramètre passé à File/Folder search | `sanitizeSearchInput()` appliqué |
| **Query body/params** | Opérateurs `$where`, `$ne`, etc. | `sanitizeQuery` supprime les clés `$` et `.` |
| **sort_by / sort_order** | Valeurs arbitraires → injection dans tri | Whitelist `ALLOWED_SORT_FIELDS` |
| **skip / limit** | Valeurs non bornées → DoS | Borne max (skip≤10000, limit≤100) |

### Mécanismes en place

- **escapeRegexString()** : échappe `.*+?^${}()|[\]\` pour éviter ReDoS
- **sanitizeQuery** : rejette `__proto__`, `constructor`, `prototype` et clés commençant par `$`
- **sanitizePaginationSort()** : whitelist des champs de tri + bornes pagination

---

## 2. SQL (non applicable)

L’application utilise **MongoDB** (NoSQL). Aucun risque d’injection SQL classique.

---

## 3. Brute force

### Rate limiting configuré

| Route | Limite | Fenêtre |
|-------|--------|---------|
| **Auth** (login, signup, 2FA, refresh) | 10 req | 15 min |
| **forgot-password** | 5 req | 1 h |
| **resend-verification** | 5 req | 1 h |
| **Upload** | 50 req | 1 h |
| **Share** | 20 req | 1 h |
| **Global** | 500 req | 15 min |

### Détails

- **authLimiter** : `skipSuccessfulRequests: true` → les connexions réussies ne comptent pas
- **emailSensitiveLimiter** : protection contre l’abus de mails (forgot-password, resend-verification)
- **authLimiter** sur `/api/auth` : appliqué à login, signup, verify-2fa, refresh, etc.

---

## 4. Open Redirect (OAuth)

### Vulnérabilités corrigées

| Emplacement | Risque | Correction |
|-------------|--------|------------|
| **Backend** `req.query.redirect` | Redirection vers site externe | Validation : uniquement chemins commençant par `/`, sans `:`, `//`, `http` |
| **Frontend** OAuthCallback | `navigate(redirectParam)` avec URL externe | Vérification : rejet de `http`, `https`, `//`, `javascript:` |
| **OAuth mobile** `redirect_uri` | Deep link arbitraire | Regex stricte : `^supfile:\/\/oauth\/(google|github)\/callback` |

---

## 5. Path traversal

- **sanitizePath()** : rejette les chemins contenant `..`
- **validateFilePath** : appliqué avant accès aux fichiers
- **validateFileName** : caractères interdits, noms réservés Windows

---

## 6. JWT

- Algorithme fixé : `HS256`
- Vérification de l’existence de l’utilisateur à chaque requête authentifiée
- Refresh token : même vérification d’existence utilisateur

---

## 7. Autres mesures

- **Helmet** : CSP, HSTS, XSS, noSniff, referrerPolicy
- **CORS** : origine contrôlée (Netlify, Render, Fly, localhost)
- **Validation Joi** : signup, login, création de dossiers, partages, changement de mot de passe
- **ObjectId** : validation sur routes files, folders, share, admin
- **Validation noms** : caractères interdits, longueur max 255, noms réservés
- **Bcrypt** : hachage des mots de passe (SALT_ROUNDS=10)

---

## Recommandations supplémentaires

1. **JWT_SECRET** : générer un secret fort et unique en production
2. **HTTPS** : imposer HTTPS en production
3. **Logs** : éviter de logger tokens, mots de passe ou données sensibles
4. **Dépendances** : `npm audit` régulier pour vulnérabilités connues
