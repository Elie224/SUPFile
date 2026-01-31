# Voir les logs Fly.io (supfile)

## Prérequis

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installé (`fly` ou `flyctl`)
- Connexion : `fly auth login` (si besoin)
- Être dans le dossier `backend` ou avoir l’app ciblée : `fly apps list`

## 1. Derniers logs (une fois, puis sortie)

Depuis le dossier **backend** :

```powershell
fly logs --app supfile --no-tail
```

Ou avec le script :

```powershell
cd backend
.\voir-tous-logs.ps1
```

Utile pour : voir les dernières erreurs, CORS, 502, crash au démarrage.

## 2. Logs en temps réel (stream)

Depuis le dossier **backend** :

```powershell
fly logs --app supfile
```

Ou :

```powershell
.\voir-logs-temps-reel.ps1
```

Arrêter avec **Ctrl+C**.

Utile pour : reproduire une action (connexion, appel API, chargement avatar) et voir les lignes au moment où ça se passe.

## 3. Ce qu’on cherche dans les logs

- **CORS** : messages du type `CORS blocked origin`, ou absence d’erreur après une requête OPTIONS.
- **502 / avatars** : stack trace, `ENOENT` (fichier absent), erreur sur `/avatars/...`.
- **Démarrage** : `Listening on 0.0.0.0:5000`, `MongoDB ready`, ou erreur de connexion DB.
- **Routes** : `[APP] Request to /api/folders` (si ce log est toujours présent dans le code).

## 4. Si `fly` échoue

- Vérifier la session : `fly auth whoami`
- Vérifier l’app : `fly apps list` (voir `supfile`)
- Sur Windows, si "Accès refusé" sur `.fly` : lancer le terminal en tant qu’administrateur ou déplacer le projet hors d’un chemin protégé (OneDrive, dossier système).
