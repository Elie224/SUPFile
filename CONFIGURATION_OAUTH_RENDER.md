# Configuration OAuth Google et GitHub pour Render

Ce guide vous explique comment configurer l'authentification OAuth avec Google et GitHub pour votre application déployée sur Render.

## URLs de production

- **Backend** : `https://supfile-1.onrender.com`
- **Frontend** : `https://supfile-frontend.onrender.com`
- **Callback Google** : `https://supfile-1.onrender.com/api/auth/google/callback`
- **Callback GitHub** : `https://supfile-1.onrender.com/api/auth/github/callback`

---

## 🔵 Configuration Google OAuth

### Étape 1 : Créer un projet dans Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Donnez un nom à votre projet (ex: "SUPFile")

### Étape 2 : Activer l'API Google Identity

1. Dans le menu latéral, allez dans **"APIs & Services"** > **"Library"**
2. Recherchez **"Google Identity Services API"** ou **"Google+ API"**
3. Cliquez sur **"Enable"** pour activer l'API

### Étape 3 : Créer les identifiants OAuth

1. Allez dans **"APIs & Services"** > **"Credentials"**
2. Cliquez sur **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. Si c'est la première fois, configurez l'écran de consentement OAuth :
   - Choisissez **"External"** (pour les tests)
   - Remplissez les informations requises (nom de l'application, email de support)
   - Cliquez sur **"Save and Continue"** jusqu'à la fin

### Étape 4 : Configurer l'application OAuth

1. **Application type** : Sélectionnez **"Web application"**
2. **Name** : Donnez un nom (ex: "SUPFile Web Client")
3. **Authorized JavaScript origins** : Ajoutez :
   ```
   https://supfile-1.onrender.com
   https://supfile-frontend.onrender.com
   ```
4. **Authorized redirect URIs** : Ajoutez :
   ```
   https://supfile-1.onrender.com/api/auth/google/callback
   ```
5. Cliquez sur **"Create"**

### Étape 5 : Copier les identifiants

1. Une fenêtre s'ouvre avec votre **Client ID** et **Client Secret**
2. **⚠️ IMPORTANT** : Copiez-les immédiatement, vous ne pourrez plus voir le Client Secret après !
3. Notez-les quelque part de sûr

---

## 🐙 Configuration GitHub OAuth

### Étape 1 : Créer une OAuth App sur GitHub

1. Allez sur [GitHub Developer Settings](https://github.com/settings/developers)
2. Cliquez sur **"OAuth Apps"** dans le menu de gauche
3. Cliquez sur **"New OAuth App"**

### Étape 2 : Remplir les informations

1. **Application name** : `SUPFile` (ou le nom de votre choix)
2. **Homepage URL** : `https://supfile-frontend.onrender.com`
3. **Authorization callback URL** : `https://supfile-1.onrender.com/api/auth/github/callback`
4. Cliquez sur **"Register application"**

### Étape 3 : Générer le Client Secret

1. Sur la page de votre application OAuth, vous verrez votre **Client ID**
2. Cliquez sur **"Generate a new client secret"**
3. **⚠️ IMPORTANT** : Copiez le **Client Secret** immédiatement, vous ne pourrez plus le voir après !

---

## ⚙️ Configuration dans Render

### Ajouter les variables d'environnement

1. Dans Render, ouvrez votre service backend (`supfile-1`)
2. Allez dans l'onglet **"Environment"**
3. Ajoutez les variables suivantes :

#### Variables Google OAuth

- **Key** : `GOOGLE_CLIENT_ID`
- **Value** : Votre Client ID Google (copié à l'étape 5 de Google)

- **Key** : `GOOGLE_CLIENT_SECRET`
- **Value** : Votre Client Secret Google (copié à l'étape 5 de Google)

- **Key** : `GOOGLE_REDIRECT_URI`
- **Value** : `https://supfile-1.onrender.com/api/auth/google/callback`

#### Variables GitHub OAuth

- **Key** : `GITHUB_CLIENT_ID`
- **Value** : Votre Client ID GitHub (copié à l'étape 3 de GitHub)

- **Key** : `GITHUB_CLIENT_SECRET`
- **Value** : Votre Client Secret GitHub (copié à l'étape 3 de GitHub)

- **Key** : `GITHUB_REDIRECT_URI`
- **Value** : `https://supfile-1.onrender.com/api/auth/github/callback`

### Redéployer

1. Après avoir ajouté toutes les variables, cliquez sur **"Save rebuild and deploy"**
2. Attendez 2-3 minutes que Render redéploie le service
3. Vérifiez les logs : vous ne devriez plus voir les avertissements OAuth

---

## ✅ Vérification

### Dans les logs Render

Après le redéploiement, les logs devraient montrer :
```
[OAuth google] Configuration OK, initiating authentication...
[OAuth github] Configuration OK, initiating authentication...
```

Au lieu de :
```
⚠️  Google OAuth not configured
⚠️  GitHub OAuth not configured
```

### Test sur l'application

1. Ouvrez `https://supfile-frontend.onrender.com` sur votre téléphone
2. Allez sur la page de connexion
3. Cliquez sur **"Continuer avec Google"** ou **"Continuer avec GitHub"**
4. Vous devriez être redirigé vers Google/GitHub pour autoriser l'application
5. Après autorisation, vous devriez être connecté automatiquement

---

## 🔒 Sécurité

- ⚠️ **Ne partagez jamais** vos Client Secrets publiquement
- ⚠️ **Ne commitez jamais** les secrets dans Git
- ✅ Utilisez toujours les variables d'environnement dans Render
- ✅ Les secrets sont automatiquement masqués dans l'interface Render

---

## 🆘 Dépannage

### Erreur "redirect_uri_mismatch"

- Vérifiez que l'URL de callback dans Render correspond exactement à celle configurée dans Google/GitHub
- Les URLs doivent être identiques (même avec/sans slash à la fin)

### Erreur "invalid_client"

- Vérifiez que le Client ID et Client Secret sont corrects dans Render
- Assurez-vous qu'il n'y a pas d'espaces avant/après les valeurs

### OAuth ne fonctionne toujours pas

- Vérifiez les logs Render pour voir les erreurs exactes
- Assurez-vous que toutes les variables d'environnement sont bien configurées
- Redéployez le service après avoir ajouté les variables

