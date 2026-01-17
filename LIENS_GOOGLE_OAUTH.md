# 🔗 Tous les liens pour configurer Google OAuth

## 📍 Liens Google Cloud Console

### Page principale
https://console.cloud.google.com/

### Créer un nouveau projet
https://console.cloud.google.com/projectcreate

### Sélectionner un projet existant
https://console.cloud.google.com/home/dashboard

### Bibliothèque d'APIs (pour activer Google Identity)
https://console.cloud.google.com/apis/library

### Écran de consentement OAuth
https://console.cloud.google.com/apis/credentials/consent

### Identifiants OAuth (Credentials)
https://console.cloud.google.com/apis/credentials

### Créer un OAuth Client ID
https://console.cloud.google.com/apis/credentials/oauthclient

---

## 📍 Liens Render

### Dashboard Render
https://dashboard.render.com/

### Liste des services
https://dashboard.render.com/web

### Variables d'environnement (remplacer SERVICE_NAME par votre nom de service)
https://dashboard.render.com/web/SERVICE_NAME/env-vars

---

## 📍 Liens de l'application

### Frontend - Page de connexion
https://supfile-frontend.onrender.com/login

### Backend API
https://supfile-1.onrender.com

### Callback Google OAuth
https://supfile-1.onrender.com/api/auth/google/callback

---

## 📋 URLs à configurer

### Dans Google Cloud Console - Authorized JavaScript origins
```
https://supfile-1.onrender.com
https://supfile-frontend.onrender.com
```

### Dans Google Cloud Console - Authorized redirect URIs
```
https://supfile-1.onrender.com/api/auth/google/callback
```

### Dans Render - Variables d'environnement
```
GOOGLE_CLIENT_ID = (votre Client ID)
GOOGLE_CLIENT_SECRET = (votre Client Secret)
GOOGLE_REDIRECT_URI = https://supfile-1.onrender.com/api/auth/google/callback
```

---

## 🚀 Ordre des étapes avec liens

### Étape 1 : Créer le projet
👉 https://console.cloud.google.com/projectcreate

### Étape 2 : Activer l'API
👉 https://console.cloud.google.com/apis/library
- Rechercher : "Google Identity Services API"
- Cliquer sur "ENABLE"

### Étape 3 : Configurer l'écran de consentement
👉 https://console.cloud.google.com/apis/credentials/consent

### Étape 4 : Créer les identifiants OAuth
👉 https://console.cloud.google.com/apis/credentials
- Cliquer sur "+ CREATE CREDENTIALS" → "OAuth client ID"

### Étape 5 : Configurer dans Render
👉 https://dashboard.render.com/
- Sélectionner votre service backend
- Aller dans l'onglet "Environment"

### Étape 6 : Tester
👉 https://supfile-frontend.onrender.com/login

---

## 📝 Notes importantes

- ⚠️ Tous les liens utilisent `https://` (pas `http://`)
- ⚠️ Pas de slash final dans les URIs de callback
- ⚠️ Les URLs doivent être identiques dans Google Cloud Console et Render


