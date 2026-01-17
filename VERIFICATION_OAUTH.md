# Vérification des URLs OAuth

## ✅ URLs Correctes pour la Production

### Backend
- **URL Backend** : `https://supfile-1.onrender.com`
- **Callback Google** : `https://supfile-1.onrender.com/api/auth/google/callback` ✅
- **Callback GitHub** : `https://supfile-1.onrender.com/api/auth/github/callback` ✅

### Frontend
- **URL Frontend** : `https://supfile-frontend.onrender.com`
- **Page de callback** : `https://supfile-frontend.onrender.com/auth/callback`

---

## 🔍 Vérification de la Configuration

### 1. Variables d'environnement dans Render (Backend)

Assurez-vous que ces variables sont définies dans le service backend sur Render :

```
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=https://supfile-1.onrender.com/api/auth/google/callback

GITHUB_CLIENT_ID=votre_client_id_github
GITHUB_CLIENT_SECRET=votre_client_secret_github
GITHUB_REDIRECT_URI=https://supfile-1.onrender.com/api/auth/github/callback

FRONTEND_URL=https://supfile-frontend.onrender.com
```

### 2. Configuration Google Cloud Console

Dans [Google Cloud Console](https://console.cloud.google.com/) :

1. Allez dans **APIs & Services** > **Credentials**
2. Sélectionnez votre OAuth 2.0 Client ID
3. Vérifiez que dans **Authorized redirect URIs** vous avez :
   ```
   https://supfile-1.onrender.com/api/auth/google/callback
   ```
4. Vérifiez que dans **Authorized JavaScript origins** vous avez :
   ```
   https://supfile-1.onrender.com
   https://supfile-frontend.onrender.com
   ```

### 3. Configuration GitHub OAuth App

Dans [GitHub Developer Settings](https://github.com/settings/developers) :

1. Sélectionnez votre OAuth App
2. Vérifiez que dans **Authorization callback URL** vous avez :
   ```
   https://supfile-1.onrender.com/api/auth/github/callback
   ```
3. Vérifiez que dans **Homepage URL** vous avez :
   ```
   https://supfile-frontend.onrender.com
   ```

---

## 🧪 Test des URLs

### Test Google OAuth
1. Allez sur : `https://supfile-frontend.onrender.com/login`
2. Cliquez sur "Continuer avec Google"
3. Vous devriez être redirigé vers Google
4. Après authentification, vous devriez être redirigé vers : `https://supfile-1.onrender.com/api/auth/google/callback`
5. Puis vers : `https://supfile-frontend.onrender.com/auth/callback`
6. Et enfin vers : `https://supfile-frontend.onrender.com/dashboard`

### Test GitHub OAuth
1. Allez sur : `https://supfile-frontend.onrender.com/login`
2. Cliquez sur "Continuer avec GitHub"
3. Vous devriez être redirigé vers GitHub
4. Après authentification, vous devriez être redirigé vers : `https://supfile-1.onrender.com/api/auth/github/callback`
5. Puis vers : `https://supfile-frontend.onrender.com/auth/callback`
6. Et enfin vers : `https://supfile-frontend.onrender.com/dashboard`

---

## ⚠️ Problèmes Courants

### Erreur : "redirect_uri_mismatch"
- **Cause** : L'URL de callback dans Google/GitHub ne correspond pas exactement à celle configurée
- **Solution** : Vérifiez que l'URL dans Google Cloud Console / GitHub correspond EXACTEMENT à `https://supfile-1.onrender.com/api/auth/google/callback` (sans slash final, avec https)

### Erreur : "OAuth is not configured"
- **Cause** : Les variables d'environnement ne sont pas définies dans Render
- **Solution** : Vérifiez que toutes les variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` sont définies

### Erreur : "Invalid client"
- **Cause** : Le Client ID ou Client Secret est incorrect
- **Solution** : Vérifiez que vous avez copié les bonnes valeurs depuis Google Cloud Console / GitHub

---

## 📝 Résumé

✅ **L'URL que vous avez fournie est CORRECTE** : `https://supfile-1.onrender.com/api/auth/google/callback`

Assurez-vous simplement que :
1. Cette URL est configurée dans Google Cloud Console comme redirect URI autorisé
2. Cette URL est définie dans la variable `GOOGLE_REDIRECT_URI` dans Render (ou laissez-la vide pour utiliser la valeur par défaut)
3. Les variables `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définies dans Render


