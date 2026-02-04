# Google OAuth (SUPFile) — Fix `401: deleted_client`

## Pourquoi l’erreur arrive

Si tu vois **"Accès bloqué : erreur d'autorisation"** avec :

- `The OAuth client was deleted.`
- `Erreur 401: deleted_client`

alors le **Client ID OAuth** utilisé par l’app **n’existe plus** (supprimé côté Google Cloud). Ce n’est pas un bug Flutter/React : il faut **créer un nouveau client OAuth** et **mettre à jour les variables d’environnement/secrets**.

---

## 1) Créer un nouveau Client OAuth (Google Cloud)

1. Va sur : https://console.cloud.google.com/apis/credentials
2. Sélectionne ton projet (ou crée-en un)
3. (Si demandé) Configure l’**écran de consentement OAuth**
4. Clique **Create credentials** → **OAuth client ID**
5. Type : **Web application**

### Redirect URIs (important)
Ajoute au minimum :
- `https://supfile.fly.dev/api/auth/google/callback`

Pour le dev local (optionnel) :
- `http://localhost:5000/api/auth/google/callback`

Récupère ensuite :
- **Client ID** (se termine par `.apps.googleusercontent.com`)
- **Client Secret** (commence souvent par `GOCSPX-...`)

---

## 2) Mettre à jour le backend sur Fly.io (obligatoire pour le Web)

Le frontend web (React) redirige vers le backend : `GET /api/auth/google`.
Donc le backend doit avoir des secrets Google valides.

### Option A — Script (recommandé)
Dans PowerShell :

- Lance : `backend/mettre-a-jour-google-oauth.ps1`
- Colle ton **Client ID** et **Client Secret** quand demandé

Le script met à jour :
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (sur `https://supfile.fly.dev/api/auth/google/callback`)

### Option B — Manuel

- `flyctl secrets set GOOGLE_CLIENT_ID="<TON_CLIENT_ID>" --app supfile`
- `flyctl secrets set GOOGLE_CLIENT_SECRET="<TON_CLIENT_SECRET>" --app supfile`
- `flyctl secrets set GOOGLE_REDIRECT_URI="https://supfile.fly.dev/api/auth/google/callback" --app supfile`
- `flyctl deploy --app supfile --dns-checks=false`

---

## 3) Flutter Web (si tu utilises GoogleSignIn côté Flutter)

Si tu utilises le bouton Google dans Flutter Web via `google_sign_in_web`, il faut un client web valide.

Lance Flutter Web avec :

- `flutter run -d chrome --web-port=64137 --dart-define=API_URL=https://supfile.fly.dev --dart-define=GOOGLE_WEB_CLIENT_ID="<TON_CLIENT_ID_WEB>"`

Notes :
- Le Client ID **peut** être le même que celui utilisé côté backend (Web application) tant qu’il est valide.
- Si tu déploies Flutter Web sur un domaine (Netlify, etc.), ajoute ce domaine dans la configuration OAuth si nécessaire.

---

## 4) Check rapide

- Si l’erreur `deleted_client` disparaît mais tu obtiens `redirect_uri_mismatch`, alors le **redirect URI** n’est pas exactement celui configuré dans Google Cloud.
- Si tu as `invalid_client`, c’est souvent le **Client Secret** incorrect (ou pas celui associé au Client ID).
