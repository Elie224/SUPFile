# Diagnostic : "Une erreur s'est produite" et téléchargement qui ne marche pas

Ce document décrit comment identifier la cause de l’erreur générique et du téléchargement qui échoue.

---

## 1. Voir l’erreur exacte (après avoir vu la page d’erreur)

Une fois que la page **« Une erreur s'est produite »** s’affiche :

- **Sur la page** : ouvrez le bloc **« Détails de l'erreur (pour diagnostic) »** : le message et la pile d’appels y sont affichés (et restent après rechargement via sessionStorage).
- **Dans la console** (F12 → Console) :
  ```js
  window.__SUPFILE_LAST_ERROR__
  ```
  Si c’est `undefined` (par ex. après un rechargement), essayez :
  ```js
  JSON.parse(sessionStorage.getItem('SUPFILE_LAST_ERROR'))
  ```
- Notez **message**, **stack** et **componentStack** pour identifier la cause.

---

## 2. Script complet à exécuter dans la console (page Fichiers)

À faire **sur** `https://supfile.netlify.app/files` (ou votre URL), **connecté**, **avant** de cliquer sur Télécharger.

1. F12 → onglet **Console**.
2. Collez tout le script ci‑dessous puis Entrée.

```js
(function diagnosticTelechargement() {
  var out = [];
  function log(msg, data) {
    var line = '[DIAG] ' + msg;
    if (data !== undefined) line += ' ' + JSON.stringify(data, null, 2);
    console.log(line);
    out.push(line + (data != null ? '\n' + JSON.stringify(data, null, 2) : ''));
  }
  log('--- Diagnostic téléchargement SUPFile ---');
  log('URL page', window.location.href);
  var token = null;
  try { token = localStorage.getItem('access_token'); } catch (e) { log('localStorage erreur', e.message); }
  log('Token présent', !!token);
  if (token) log('Token (10 premiers car.)', token.substring(0, 10) + '...');
  var apiUrl = 'https://supfile.fly.dev';
  log('API URL utilisée pour le test', apiUrl);
  log('--- Dernière erreur ErrorBoundary (si déjà affichée) ---');
  if (window.__SUPFILE_LAST_ERROR__) {
    log('Erreur capturée', window.__SUPFILE_LAST_ERROR__);
  } else {
    log('Aucune erreur stockée (page pas encore passée par ErrorBoundary)');
  }
  log('--- Listeners erreurs globales (actifs) ---');
  window.addEventListener('error', function(e) {
    log('window.onerror', { message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, error: e.error && e.error.stack });
  });
  window.addEventListener('unhandledrejection', function(e) {
    log('unhandledrejection', { reason: String(e.reason), stack: e.reason && e.reason.stack });
  });
  log('Écoute des erreurs activée. Cliquez sur "Télécharger" (fichier) puis regardez la console.');
  log('--- Test fetch GET /api/files/:id/download (ID factice) ---');
  var testId = '000000000000000000000001';
  fetch(apiUrl + '/api/files/' + encodeURIComponent(testId) + '/download', {
    method: 'GET',
    headers: token ? { Authorization: 'Bearer ' + token } : {}
  }).then(function(r) {
    log('Réponse test download', { status: r.status, ok: r.ok, contentType: r.headers.get('Content-Type'), accessControl: r.headers.get('Access-Control-Allow-Origin') });
    return r.text();
  }).then(function(text) {
    log('Corps réponse (début)', text ? text.substring(0, 300) : '(vide)');
  }).catch(function(err) {
    log('Erreur fetch test', { message: err.message, name: err.name });
  });
  console.log('[DIAG] Résumé ci-dessus. Rejouez le script puis cliquez sur Télécharger pour capturer l’erreur.');
  return out;
})();
```

3. Regardez les lignes `[DIAG]` dans la console.
4. Cliquez sur **« Télécharger »** sur un fichier.
5. Si la page d’erreur réapparaît ou si de nouvelles lignes `[DIAG]` s’affichent, notez :
   - **window.onerror** ou **unhandledrejection** : erreur JS ou promesse non gérée.
   - **Réponse test download** : statut HTTP et CORS (si 401/403/404 ou pas de CORS, le problème vient de l’API ou du token).

---

## 3. Vérifications rapides

| Vérification | Où | Attendu |
|--------------|-----|--------|
| Token présent | Console : `localStorage.getItem('access_token')` | Une chaîne non vide |
| API utilisée | Dans le script : `apiUrl` | Même domaine que le backend (ex. `https://supfile.fly.dev`) |
| CORS | Réponse test : `Access-Control-Allow-Origin` | Présent et cohérent avec l’origine du front (ex. `https://supfile.netlify.app`) |
| Dernière erreur | `window.__SUPFILE_LAST_ERROR__` après affichage de la page d’erreur | Message + stack pour identifier le fichier/ligne |

---

## 4. Tester le backend (scripts)

Pour vérifier que l’API de téléchargement répond correctement (sans passer par le navigateur).

**Node :**
```bash
cd backend
node scripts/test-download-route.js
```

**PowerShell (Windows) :**
```powershell
cd backend\scripts
.\test-download-route.ps1
```

Variables d’environnement optionnelles : `API_URL`, `TEST_FOLDER_ID`, `TEST_ACCESS_TOKEN`. Sans token ni ID valide, le script utilise un ID factice et affiche la réponse (401/404 attendu) pour confirmer que la route répond.

---

## 5. Causes fréquentes

- **Token absent ou expiré** : se déconnecter puis se reconnecter, refaire le test.
- **Mauvaise API URL** : en build Netlify, définir `VITE_API_URL` (ex. `https://supfile.fly.dev`) pour que le front appelle le bon backend.
- **CORS** : le backend doit renvoyer `Access-Control-Allow-Origin` avec l’origine du front (ex. `https://supfile.netlify.app`). Vérifier la config CORS du backend (Fly.io).
- **Erreur dans le rendu React** : `window.__SUPFILE_LAST_ERROR__.componentStack` indique le composant ; le **stack** indique la ligne de code (fichier source ou bundle).
- **Fichier ou ressource inexistante** : le test avec un ID factice renverra 404.

En cas de doute, envoyer le contenu de `window.__SUPFILE_LAST_ERROR__` et les lignes `[DIAG]` de la console pour analyse.
