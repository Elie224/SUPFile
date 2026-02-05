# Google OAuth (SUPFile) — Configuration & dépannage

Ce guide couvre :

- Le **backend** (Node/Express) qui réalise le flow OAuth (Google/GitHub)
- Le **Flutter Web** (si Google Sign-In est utilisé côté Flutter Web)
- Le **Flutter Mobile** (Google Sign-In → `idToken` vérifié côté backend)

## Règle d’or (sécurité)

- Ne jamais mettre `GOOGLE_CLIENT_SECRET` dans un frontend (React/Flutter Web).
- Les secrets OAuth doivent être configurés côté backend (Fly.io) via `flyctl secrets`.

---

## 1) Créer les identifiants OAuth (Google Cloud)

Console : https://console.cloud.google.com/apis/credentials

Créer un **OAuth client ID** (type **Web application**).

### Redirect URI (backend)

Ajouter dans “Authorized redirect URIs” :

- `https://supfile.fly.dev/api/auth/google/callback`

(Option dev local) :

- `http://localhost:5000/api/auth/google/callback`

Récupérer :

- **Client ID** : `...apps.googleusercontent.com`
- **Client Secret** : `GOCSPX-...`

---

## 2) Backend (Fly.io) — variables à définir

Depuis le dossier `backend` :

```bash
fly secrets set GOOGLE_CLIENT_ID="<CLIENT_ID_WEB>"
fly secrets set GOOGLE_CLIENT_SECRET="<CLIENT_SECRET>"
fly secrets set GOOGLE_REDIRECT_URI="https://supfile.fly.dev/api/auth/google/callback"
```

Pour la vérification des tokens Google envoyés par mobile (recommandé) :

```bash
fly secrets set GOOGLE_ALLOWED_CLIENT_IDS="<CLIENT_ID_WEB>,<CLIENT_ID_ANDROID>,<CLIENT_ID_IOS>"
```

Déployer :

```bash
flyctl deploy --app supfile --dns-checks=false
```

---

## 3) Flutter Web — config au runtime (si Google Sign-In est utilisé côté Flutter Web)

Flutter Web a besoin d’un **Client ID Web** (pas de secret), injecté au runtime :

```bash
cd mobile-app
flutter run -d chrome --web-port=64137 \
	--dart-define=API_URL=https://supfile.fly.dev \
	--dart-define=GOOGLE_WEB_CLIENT_ID="<CLIENT_ID_WEB>"
```

---

## 4) Flutter Mobile — API URL

L’app mobile utilise `API_URL` via `--dart-define` (valeur par défaut : `https://supfile.fly.dev`).

Exemples :

```bash
cd mobile-app

# Dev local (appareil/émulateur)
flutter run --dart-define=API_URL=http://192.168.1.X:5000

# Prod
flutter run --dart-define=API_URL=https://supfile.fly.dev
```

---

## 5) Dépannage rapide (erreurs fréquentes)

### `401: deleted_client`

Le client OAuth a été supprimé dans Google Cloud.

- Créer un nouveau client OAuth
- Mettre à jour `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` côté Fly

### `401: invalid_client`

Le couple `client_id`/`client_secret` ne correspond pas, ou vous utilisez le mauvais type de client.

- Vérifier que `GOOGLE_CLIENT_SECRET` correspond exactement au `GOOGLE_CLIENT_ID`
- Vérifier que le client est bien de type **Web application** pour le backend

### `redirect_uri_mismatch`

L’URI de callback n’est pas strictement identique à celui configuré.

- Vérifier `GOOGLE_REDIRECT_URI`
- Vérifier la liste “Authorized redirect URIs” dans Google Cloud

### Popup fermée (Flutter Web)

Si l’utilisateur ferme la popup Google, c’est un “cancel” normal (pas une panne). Réessayez.
