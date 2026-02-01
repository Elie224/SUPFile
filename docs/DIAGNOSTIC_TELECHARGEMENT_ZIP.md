# Diagnostic : téléchargement de dossiers en ZIP

## Ce qui est en place (et renforcé pour éviter les blocages)

- **Backend** : route `GET /api/folders/:id/download`, contrôleur `downloadFolder` (archiver, niveau 0, CORS, gestion dossiers vides).
- **Frontend** : appel `fetch` + `downloadBlob()` pour déclencher le téléchargement du `.zip`.
- **Chemins** : le backend utilise `path.resolve(file.file_path)` pour que les fichiers soient trouvés même si le CWD change en production.
- **URL API** : une seule source (`config.js` / `VITE_API_URL`) ; tous les appels (Files, Share, Preview, Login, Settings, Signup, OAuth, offline) utilisent la même URL pour éviter d’appeler un mauvais backend.
- **CORS** : pour la réponse streamée ZIP, les origines autorisées sont alignées sur `config.cors` + `CORS_ORIGIN` (liste explicite + patterns `.netlify.app`, `.onrender.com`, `.fly.dev`, `supfile.com`, `localhost`).
- **Upload dir** : au démarrage, le backend log le chemin résolu d’upload pour vérifier en prod (volume Fly, etc.).
- **Auth** : en cas de 401, le frontend affiche « Session expirée. Veuillez vous reconnecter. ».
- **Timeout** : 2 min pour le téléchargement de dossier (frontend), délai pro.

## Ce qui peut empêcher le téléchargement

| Cause | Symptôme / vérification | Solution |
|-------|-------------------------|----------|
| **Dossier vide ou sans fichier sur le disque** | Message « Le dossier ne contient aucun fichier accessible sur le serveur » (404, code `FOLDER_EMPTY_OR_ORPHANED`). | Vérifier que les fichiers existent bien sur le serveur (répertoire d’upload, volume persistant). |
| **Accès refusé (403)** | « Accès refusé » ou 403. | Être connecté (token valide) ou utiliser le lien de partage avec `?token=...` (et mot de passe si nécessaire). |
| **Token expiré / invalide** | 401 ou 403. | Se reconnecter ou régénérer le lien de partage. |
| **CORS** | Erreur réseau côté navigateur (blocage CORS). | Vérifier que l’origine du front (ex. `https://xxx.netlify.app`) est autorisée côté backend (CORS). |
| **Timeout** | « Le téléchargement a pris trop de temps » après 2 min. | Dossier très volumineux : réduire la taille ou augmenter `FOLDER_DOWNLOAD_TIMEOUT_MS` (2 min par défaut) côté frontend. |
| **Fichiers absents sur le serveur** | Tous les `file_path` en base pointent vers des fichiers qui n’existent plus (supprimés, autre volume). | Vérifier le répertoire d’upload et le volume persistant sur l’hébergement (ex. Fly.io). |
| **URL API incorrecte** | Requête vers un mauvais domaine (ex. ancien backend). | Vérifier `VITE_API_URL` / `config.js` (ex. `https://supfile.fly.dev`). |
| **429 Too many requests** | « Too many requests from this IP ». | Augmenter `RATE_LIMIT_MAX` côté backend (défaut 2000/15 min) ou attendre la fin de la fenêtre. |

## Vérifications rapides

1. **Console navigateur (F12)** : lors du clic sur « Télécharger le dossier », regarder l’onglet Network pour la requête `GET .../folders/:id/download`. Vérifier le statut (200 = OK, 403/404 = voir le corps de la réponse JSON).
2. **Backend** : s’assurer que le répertoire d’upload (ex. `uploads/` ou chemin configuré) est bien monté/persistant sur l’instance qui sert l’API.
3. **Test direct** : avec un token valide, tester en ligne de commande :  
   `curl -H "Authorization: Bearer TOKEN" "https://VOTRE_API/api/folders/ID_DOSSIER/download" -o test.zip`

## Fichiers absents sur le serveur : éviter le problème

Pour que le téléchargement ZIP trouve bien les fichiers sur le disque :

1. **Backend (config)** : le répertoire d’upload est défini par `UPLOAD_DIR` (défaut : `./uploads`). En production, utiliser **le même chemin absolu** que le volume monté pour que les `file_path` en base pointent vers des fichiers existants.
2. **Fly.io** : `fly.toml` monte le volume `uploads_data` sur `/usr/src/app/uploads`. S’assurer que le backend tourne avec un répertoire de travail tel que `./uploads` = ce chemin (ex. `WORKDIR /usr/src/app` dans le Dockerfile), ou définir `UPLOAD_DIR=/usr/src/app/uploads` dans les variables d’environnement / secrets Fly.
3. **Render / autre hébergeur** : configurer un volume persistant et définir `UPLOAD_DIR` sur le chemin de montage (ex. `/data/uploads`) pour que les fichiers survivent aux redéploiements et que le ZIP les trouve.
