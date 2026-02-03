# 🔧 Correction OAuth Google - Client Supprimé

## ❌ Problème

**Erreur** : `Erreur 401: deleted_client` - "The OAuth client was deleted"

Le Client ID Google utilisé (`860515202678-rae4pot74t5jmbs12c2012ivki3neron.apps.googleusercontent.com`) a été supprimé de Google Cloud Console.

---

## ✅ Solution : Créer un Nouveau Client ID OAuth

### Étape 1 : Accéder à Google Cloud Console

1. **Allez sur** : https://console.cloud.google.com/apis/credentials
2. **Connectez-vous** avec votre compte Google (`<SUPER_ADMIN_EMAIL>`)
3. **Sélectionnez votre projet** (ou créez-en un nouveau si nécessaire)

### Étape 2 : Créer un Nouveau Client ID OAuth 2.0

1. **Cliquez sur** "+ CREATE CREDENTIALS" (en haut)
2. **Sélectionnez** "OAuth client ID"

**Si c'est la première fois** :
- Vous devrez configurer l'écran de consentement OAuth
- Suivez les étapes pour configurer l'écran de consentement
- Type d'application : "Externe" (ou "Interne" si vous êtes dans une organisation Google Workspace)
- Nom de l'application : `SUPFile`
- Email de support : Votre email
- Cliquez sur "Save and Continue" jusqu'à la fin

### Étape 3 : Configurer le Client ID

1. **Type d'application** : Sélectionnez "Web application"

2. **Nom** : `SUPFile Web Client` (ou un nom de votre choix)

3. **Authorized JavaScript origins** :
   - Cliquez sur "+ ADD URI"
   - Ajoutez : `https://supfile.fly.dev`
   - Ajoutez aussi : `https://flourishing-banoffee-c0b1ad.netlify.app` (frontend)

4. **Authorized redirect URIs** :
   - Cliquez sur "+ ADD URI"
   - Ajoutez : `https://supfile.fly.dev/api/auth/google/callback`
   - ⚠️ **Important** : Exactement cette URL, sans slash à la fin

5. **Cliquez sur "CREATE"** (ou "Créer")

### Étape 4 : Récupérer les Identifiants

Après la création, vous verrez :
- **Client ID** : `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret** : `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Important** : Copiez ces valeurs immédiatement, vous ne pourrez plus voir le Client Secret après !

---

## 🔑 Mettre à Jour les Secrets sur Fly.io

### Option A : Via l'Interface Web Fly.io

1. **Allez sur** : https://fly.io/apps/supfile
2. **Cliquez sur "Secrets"** dans le menu
3. **Mettez à jour** :
   - `GOOGLE_CLIENT_ID` : Votre nouveau Client ID
   - `GOOGLE_CLIENT_SECRET` : Votre nouveau Client Secret

### Option B : Via PowerShell (Recommandé)

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend

# Mettre à jour GOOGLE_CLIENT_ID
flyctl secrets set GOOGLE_CLIENT_ID="VOTRE_NOUVEAU_CLIENT_ID" --app supfile

# Mettre à jour GOOGLE_CLIENT_SECRET
flyctl secrets set GOOGLE_CLIENT_SECRET="[REDACTED]" --app supfile
```

**Remplacez** :
- `VOTRE_NOUVEAU_CLIENT_ID` par le Client ID que vous avez copié
- `VOTRE_NOUVEAU_CLIENT_SECRET` par le Client Secret que vous avez copié

### Option C : Via Script Automatique

Créez un fichier `backend/mettre-a-jour-google-oauth.ps1` :

```powershell
# Mettre à jour Google OAuth sur Fly.io
$appName = "supfile"

Write-Host "🔑 Mise à jour des secrets Google OAuth..." -ForegroundColor Cyan

$clientId = Read-Host "Nouveau Google Client ID"
$clientSecret = Read-Host "Nouveau Google Client Secret"

flyctl secrets set GOOGLE_CLIENT_ID="$clientId" --app $appName
flyctl secrets set GOOGLE_CLIENT_SECRET="[REDACTED]" --app $appName

Write-Host "✅ Secrets mis à jour !" -ForegroundColor Green
Write-Host "🔄 Redéploiement en cours..." -ForegroundColor Yellow
flyctl deploy --app $appName
```

---

## 🔄 Redéployer le Backend

Après avoir mis à jour les secrets, redéployez :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
flyctl deploy --app supfile
```

---

## ✅ Vérification

1. **Attendez** que le déploiement se termine
2. **Testez la connexion Google** :
   - Allez sur votre site Netlify
   - Cliquez sur "Se connecter avec Google"
   - Vous devriez être redirigé vers Google pour autoriser
   - Après autorisation, vous devriez être connecté

---

## 📋 Checklist

- [ ] Nouveau Client ID OAuth créé dans Google Cloud Console
- [ ] Redirect URI configuré : `https://supfile.fly.dev/api/auth/google/callback`
- [ ] JavaScript origins configurés : `https://supfile.fly.dev` et `https://flourishing-banoffee-c0b1ad.netlify.app`
- [ ] Client ID et Client Secret copiés
- [ ] Secrets mis à jour sur Fly.io (`GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`)
- [ ] Backend redéployé
- [ ] Test de connexion Google réussi

---

## 🆘 En Cas de Problème

### Le Client Secret n'est plus visible

Si vous avez fermé la fenêtre sans copier le Client Secret :
1. **Allez sur** : https://console.cloud.google.com/apis/credentials
2. **Cliquez sur votre Client ID**
3. **Cliquez sur "Reset Secret"** (Réinitialiser le secret)
4. **Copiez le nouveau secret** immédiatement

### Erreur "redirect_uri_mismatch"

Vérifiez que le Redirect URI dans Google Cloud Console est **exactement** :
```
https://supfile.fly.dev/api/auth/google/callback
```

- Pas de slash `/` à la fin
- Commence par `https://`
- Pas d'espace avant ou après

---

C'est tout ! Une fois les secrets mis à jour et le backend redéployé, la connexion Google devrait fonctionner ! 🚀
