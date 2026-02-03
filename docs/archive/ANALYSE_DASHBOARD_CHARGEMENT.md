# Analyse : Dashboard bloqué sur « Chargement... »

## 1. Contexte

- **Frontend** : https://flourishing-banoffee-c0b1ad.netlify.app (Netlify)
- **Backend** : https://supfile.fly.dev (Fly.io)
- **Symptôme** : La page Tableau de bord affiche « Chargement... » indéfiniment. Le footer affiche « Mode hors ligne » (lien vers la page offline, pas un état détecté).

---

## 2. Causes possibles (analyse profonde)

### 2.1 Requête API jamais terminée

- **GET /api/dashboard** sans timeout côté client → la promesse ne resolve ni ne reject → `loading` reste `true`.
- **Correction** : timeout 20 s sur `apiClient` (api.js) + filet de sécurité 15 s dans le Dashboard (force `setLoading(false)` et message d’erreur).

### 2.2 Branche « hors ligne » qui bloque

- Si `navigator.onLine === false` (ou détection incorrecte), le Dashboard utilise uniquement le cache (offlineDB).
- Si **offlineDB.init()** ou **getUserMeta('dashboardStats')** ne termine jamais (IndexedDB bloquée, erreur non gérée), on ne appelle jamais **setLoading(false)** → chargement infini.
- **Correction** : `Promise.race([offlineDB.init(), timeout(5000)])` dans la branche offline ; après 5 s on sort avec erreur.

### 2.3 CORS / prévolée OPTIONS

- Le navigateur envoie d’abord **OPTIONS** vers `https://supfile.fly.dev/api/dashboard`. Si la réponse n’a pas les en-têtes CORS, le **GET** réel n’est pas envoyé et la requête « échoue » côté navigateur (souvent une erreur réseau/CORS) → la promesse **reject** → normalement `catch` + `finally` → `setLoading(false)`.
- Si l’ancien build n’a pas de timeout, une prévolée qui reste sans réponse pourrait faire attendre indéfiniment. Le filet 15 s doit alors afficher l’erreur.

### 2.4 401 + refresh token

- Si le backend renvoie **401**, l’intercepteur axios tente un **refresh** puis relance la requête. Si le refresh pend (sans timeout), on pourrait rester en attente ; avec le timeout 20 s sur apiClient, on finit par avoir une erreur et `setLoading(false)`.

### 2.5 Build Netlify pas à jour

- Si le site Netlify sert un **ancien build** (sans timeout, sans filet 15 s, sans gestion d’erreur), le Dashboard peut rester en « Chargement... » tant que la requête ne termine pas.
- **À faire** : vérifier que le dernier commit (timeout + filet + erreur) est bien déployé sur Netlify (onglet Deploys).

---

## 3. Vérifications côté navigateur (F12)

1. **Onglet Network (Réseau)**  
   - Recharger la page Dashboard.
   - Chercher une requête vers **supfile.fly.dev** (par ex. `dashboard` ou `api/dashboard`).
   - **Si la requête n’apparaît pas** : CORS (prévolée bloquée), ou script qui ne lance pas l’appel (vérifier la Console).
   - **Si la requête est en pending** : backend ne répond pas ou très lent ; après 15 s le filet doit afficher l’erreur (si le build est à jour).
   - **Si la requête est en rouge (failed)** : cliquer dessus et regarder **Status** (0, 401, 502, CORS, etc.) et l’onglet **Headers** pour les en-têtes CORS.

2. **Onglet Console**  
   - Erreurs en rouge (CORS, 401, réseau, timeout).
   - Messages du type `Failed to load dashboard:` ou erreurs axios.

3. **Application / Stockage**  
   - Vérifier que **localStorage** contient bien `access_token` et éventuellement `refresh_token` (sinon 401 garanti).

---

## 4. Vérifications côté backend (logs Fly.io)

Pour voir si la requête atteint le serveur et ce qu’il répond :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
fly logs --app supfile --no-tail
```

**À repérer dans les logs :**

- **`[Dashboard] GET /api/dashboard`** avec `userId` et `timestamp`  
  → La requête est bien reçue. Si le front reste en chargement, le problème est côté front (réponse non reçue, CORS, ou ancien build).
- **Aucune ligne `[Dashboard] GET /api/dashboard`**  
  → La requête n’arrive pas au backend : CORS (prévolée), réseau, ou URL incorrecte côté front (vérifier `VITE_API_URL` / config).
- Erreurs **401**, **500**, **502** autour de `/api/dashboard` ou `/api/auth/refresh`  
  → À corriger côté auth ou backend.

---

## 5. Corrections déjà appliquées dans le code

| Fichier | Modification |
|--------|---------------|
| **backend/controllers/dashboardController.js** | Log `[Dashboard] GET /api/dashboard` avec `userId` et `timestamp` pour les logs Fly. |
| **frontend-web/src/pages/Dashboard.jsx** | Branche offline : `Promise.race([offlineDB.init(), timeout(5000)])` pour ne pas rester bloqué sur IndexedDB. |
| **frontend-web/src/pages/Dashboard.jsx** | Filet de sécurité **15 s** : si `loading` est encore `true`, on force erreur + `setLoading(false)`. |
| **frontend-web/src/services/api.js** | Timeout **20 s** sur `apiClient` pour éviter les requêtes sans fin. |
| **frontend-web/src/pages/Dashboard.jsx** | État `error` + écran « Erreur » + bouton « Réessayer » en cas d’échec. |

---

## 6. Checklist rapide

- [ ] Netlify : dernier déploiement = commit avec timeout + filet 15 s + erreur/retry.
- [ ] Netlify : variable d’environnement `VITE_API_URL=https://supfile.fly.dev` (optionnel si défaut déjà correct).
- [ ] Navigateur : F12 → Network → une requête vers `supfile.fly.dev` (status, CORS, pending).
- [ ] Navigateur : F12 → Console → erreurs CORS, 401, timeout.
- [ ] Fly.io : `fly logs --app supfile --no-tail` → présence de `[Dashboard] GET /api/dashboard`.
- [ ] Attendre au moins **15 secondes** sur le Dashboard : le filet doit afficher un message d’erreur et « Réessayer » si le build est à jour.

---

## 7. Après déploiement

1. **Pousser les changements** (backend + frontend) et laisser Netlify redéployer.
2. **Redéployer le backend** sur Fly si besoin : `fly deploy --app supfile`.
3. **Tester** : ouvrir le Dashboard, attendre 15 s max. Soit les données s’affichent, soit un message d’erreur + « Réessayer ».
4. **Consulter les logs** : `fly logs --app supfile --no-tail` et chercher `[Dashboard] GET /api/dashboard` pour confirmer que la requête atteint le backend.
