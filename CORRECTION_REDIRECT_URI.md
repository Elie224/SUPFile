# 🔧 Correction des erreurs redirect_uri_mismatch

## ❌ Erreurs rencontrées

- **Google** : `Erreur 400 : redirect_uri_mismatch`
- **GitHub** : `The redirect_uri is not associated with this application`

## ✅ Solution : Corriger les URI de redirection

### 🔵 Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **"APIs & Services"** > **"Credentials"**
4. Trouvez votre **OAuth 2.0 Client ID** (celui avec le Client ID : `860515202678-rae4pot74t5jmbs12c2012ivki3neron.apps.googleusercontent.com`)
5. Cliquez sur l'icône **✏️ (Edit)** à droite
6. Dans la section **"Authorized redirect URIs"**, vérifiez et ajoutez/modifiez pour avoir **EXACTEMENT** :
   ```
   https://supfile-1.onrender.com/api/auth/google/callback
   ```
   ⚠️ **IMPORTANT** :
   - Pas de slash à la fin
   - Pas d'espaces
   - Utilisez `https://` (pas `http://`)
   - Le chemin doit être `/api/auth/google/callback` exactement

7. Cliquez sur **"SAVE"** en bas de la page
8. Attendez 1-2 minutes pour que les changements soient propagés

### 🐙 GitHub OAuth App

1. Allez sur [GitHub Developer Settings](https://github.com/settings/developers)
2. Cliquez sur **"OAuth Apps"** dans le menu de gauche
3. Trouvez votre application **SUPFile** (ou celle avec le Client ID : `Ov23ligHjSi2qTjUNtCc`)
4. Cliquez sur l'application pour l'éditer
5. Dans le champ **"Authorization callback URL"**, mettez **EXACTEMENT** :
   ```
   https://supfile-1.onrender.com/api/auth/github/callback
   ```
   ⚠️ **IMPORTANT** :
   - Pas de slash à la fin
   - Pas d'espaces
   - Utilisez `https://` (pas `http://`)
   - Le chemin doit être `/api/auth/github/callback` exactement

6. Cliquez sur **"Update application"** en bas de la page
7. Les changements sont immédiats

### ⚙️ Vérifier dans Render

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Sélectionnez votre service backend (`supfile-backend` ou `supfile-1`)
3. Allez dans l'onglet **"Environment"**
4. Vérifiez que ces variables existent avec les **EXACTES** valeurs :

| Variable | Valeur exacte |
|----------|---------------|
| `GOOGLE_REDIRECT_URI` | `https://supfile-1.onrender.com/api/auth/google/callback` |
| `GITHUB_REDIRECT_URI` | `https://supfile-1.onrender.com/api/auth/github/callback` |

5. Si elles n'existent pas ou sont incorrectes, modifiez-les et sauvegardez
6. Redéployez le service si nécessaire

## 🧪 Test

1. Attendez 2-3 minutes après les modifications
2. Allez sur https://supfile-frontend.onrender.com/login
3. Testez **"Se connecter avec Google"** → Devrait fonctionner ✅
4. Testez **"Se connecter avec GitHub"** → Devrait fonctionner ✅

## 📋 Checklist de vérification

- [ ] Google Cloud Console : URI de callback = `https://supfile-1.onrender.com/api/auth/google/callback`
- [ ] GitHub OAuth App : Authorization callback URL = `https://supfile-1.onrender.com/api/auth/github/callback`
- [ ] Render : `GOOGLE_REDIRECT_URI` = `https://supfile-1.onrender.com/api/auth/google/callback`
- [ ] Render : `GITHUB_REDIRECT_URI` = `https://supfile-1.onrender.com/api/auth/github/callback`
- [ ] Toutes les URLs sont identiques (pas de différences de casse, pas de slash final, pas d'espaces)

## ⚠️ Erreurs courantes à éviter

❌ **FAUX** :
- `https://supfile-1.onrender.com/api/auth/google/callback/` (slash final)
- `https://supfile-1.onrender.com/api/auth/google/callback ` (espace)
- `http://supfile-1.onrender.com/api/auth/google/callback` (http au lieu de https)
- `https://supfile-1.onrender.com/api/auth/google/callback` (différence de casse)

✅ **CORRECT** :
- `https://supfile-1.onrender.com/api/auth/google/callback`
- `https://supfile-1.onrender.com/api/auth/github/callback`

