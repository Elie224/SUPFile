# Développement (SUPFile)

Ce repo contient 3 apps :

- **Backend** (Node/Express) : `backend/`
- **Web** (React + Vite) : `frontend-web/`
- **Mobile** (Flutter) : `mobile-app/`

## Prérequis

- Node.js + npm
- Flutter SDK
- (Optionnel) Docker / Docker Compose

## Variables d'environnement

Un exemple est disponible dans `.env.example`.

En prod (Fly.io), les variables sensibles (JWT, OAuth, SMTP, etc.) doivent être définies via `flyctl secrets`.

## Lancer le backend (local)

```bash
cd backend
npm install
npm run dev
```

Le backend écoute sur `http://localhost:5000`.

## Lancer le web (local)

```bash
cd frontend-web
npm install
npm run dev
```

Configurer `VITE_API_URL` si nécessaire.

## Lancer le mobile (Flutter)

```bash
cd mobile-app
flutter pub get
flutter run --dart-define=API_URL=https://supfile.fly.dev
```

### Flutter Web

```bash
flutter run -d chrome --web-port=64137 --dart-define=API_URL=https://supfile.fly.dev
```

Si Google Sign-In est utilisé côté Flutter Web, ajouter :

```bash
--dart-define=GOOGLE_WEB_CLIENT_ID="<client_id_web>"
```

## Build

### Web

```bash
cd frontend-web
npm run build
```

### Backend

Le backend est déployé sur Fly.io (voir `backend/fly.toml`).

### Android APK

```bash
cd mobile-app
flutter build apk --release --dart-define=API_URL=https://supfile.fly.dev
```

Si la signature release n'est pas configurée, générer un APK debug :

```bash
flutter build apk --debug
```
