# 🆕 Guide complet : Créer un nouveau projet Google OAuth

## 📋 Étapes complètes

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Si vous n'êtes pas connecté, connectez-vous avec votre compte Google
3. En haut à gauche, cliquez sur le sélecteur de projet (à côté de "Google Cloud")
4. Cliquez sur **"NEW PROJECT"** (Nouveau projet)
5. Remplissez les informations :
   - **Project name** : `SUPFile-App` (ou un autre nom unique pour éviter les conflits)
     - Suggestions : `SUPFile-2025`, `SUPFile-Production`, `SUPFile-OAuth`, `supfile-app`
   - **Organization** : Laissez par défaut si vous n'avez pas d'organisation
   - **Location** : Laissez par défaut
   
   ⚠️ **Note** : Le nom du projet Google Cloud peut être différent du nom de votre application. C'est juste pour l'organisation dans Google Cloud Console. Le nom de l'application (App name) dans l'écran de consentement peut rester "SUPFile".
6. Cliquez sur **"CREATE"** (Créer)
7. Attendez quelques secondes que le projet soit créé
8. Sélectionnez le nouveau projet dans le sélecteur de projet en haut

---

### Étape 2 : Activer l'API Google Identity

1. Dans le menu latéral gauche, allez dans **"APIs & Services"** > **"Library"**
   - Ou directement : https://console.cloud.google.com/apis/library
2. Dans la barre de recherche, tapez : **"Google Identity Services API"** ou **"Google+ API"**
3. Cliquez sur **"Google Identity Services API"** ou **"Google+ API"**
4. Cliquez sur le bouton **"ENABLE"** (Activer)
5. Attendez quelques secondes que l'API soit activée

---

### Étape 3 : Configurer l'écran de consentement OAuth

1. Dans le menu latéral, allez dans **"APIs & Services"** > **"OAuth consent screen"**
   - Ou directement : https://console.cloud.google.com/apis/credentials/consent
2. Sélectionnez **"External"** (Externe) pour les tests
   - ⚠️ Si vous voyez "Internal", c'est que vous êtes dans une organisation Google Workspace. Choisissez "External" si possible.
3. Cliquez sur **"CREATE"** (Créer)
4. Remplissez le formulaire :

   **App information** (Informations de l'application) :
   - **App name** : `SUPFile` (ou le nom de votre choix)
   - **User support email** : Votre email (ex: `<SUPER_ADMIN_EMAIL>`)
   - **App logo** : (Optionnel) Vous pouvez ajouter un logo plus tard
   - **App domain** : (Optionnel) Laissez vide pour l'instant
   - **Application home page** : `https://supfile-frontend.onrender.com`
   - **Authorized domains** : Ajoutez `onrender.com` (sans https://)
   - **Developer contact information** : Votre email (ex: `<SUPER_ADMIN_EMAIL>`)

5. Cliquez sur **"SAVE AND CONTINUE"** (Enregistrer et continuer)

   **Scopes** (Portées) :
   - Cliquez sur **"ADD OR REMOVE SCOPES"**
   - Cochez :
     - ✅ `.../auth/userinfo.email`
     - ✅ `.../auth/userinfo.profile`
     - ✅ `openid`
   - Cliquez sur **"UPDATE"**
   - Cliquez sur **"SAVE AND CONTINUE"**

   **Test users** (Utilisateurs de test) :
   - Si vous êtes en mode "Testing", ajoutez votre email comme utilisateur de test :
     - Cliquez sur **"ADD USERS"**
     - Entrez votre email : `<SUPER_ADMIN_EMAIL>`
     - Cliquez sur **"ADD"**
   - Cliquez sur **"SAVE AND CONTINUE"**

   **Summary** (Résumé) :
   - Vérifiez les informations
   - Cliquez sur **"BACK TO DASHBOARD"** (Retour au tableau de bord)

---

### Étape 4 : Créer les identifiants OAuth

1. Dans le menu latéral, allez dans **"APIs & Services"** > **"Credentials"**
   - Ou directement : https://console.cloud.google.com/apis/credentials
2. En haut de la page, cliquez sur **"+ CREATE CREDENTIALS"** (+ Créer des identifiants)
3. Sélectionnez **"OAuth client ID"**
4. Si c'est la première fois, vous devrez peut-être configurer l'écran de consentement (voir Étape 3)
5. Remplissez le formulaire :

   **Application type** : Sélectionnez **"Web application"** (Application Web)

   **Name** : `SUPFile Web Client` (ou le nom de votre choix)

   **Authorized JavaScript origins** (Origines JavaScript autorisées) :
   Cliquez sur **"+ ADD URI"** et ajoutez :
   ```
   https://supfile-1.onrender.com
   https://supfile-frontend.onrender.com
   ```

   **Authorized redirect URIs** (URI de redirection autorisées) :
   Cliquez sur **"+ ADD URI"** et ajoutez **EXACTEMENT** :
   ```
   https://supfile-1.onrender.com/api/auth/google/callback
   ```
   ⚠️ **IMPORTANT** :
   - Pas de slash à la fin
   - Pas d'espaces
   - Utilisez `https://` (pas `http://`)
   - Le chemin doit être `/api/auth/google/callback` exactement

6. Cliquez sur **"CREATE"** (Créer)

---

### Étape 5 : Copier les identifiants

1. Une fenêtre popup s'ouvre avec vos identifiants :
   - **Your Client ID** : Quelque chose comme `860515202678-xxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Your Client Secret** : Quelque chose comme `GOCSPX-xxxxxxxxxxxxx`

2. ⚠️ **TRÈS IMPORTANT** :
   - **Copiez immédiatement** le **Client ID** et le **Client Secret**
   - Vous ne pourrez **plus voir le Client Secret** après avoir fermé cette fenêtre !
   - Notez-les dans un endroit sûr

3. Cliquez sur **"OK"** pour fermer la fenêtre

---

### Étape 6 : Configurer dans Render

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Sélectionnez votre service backend (`supfile-backend` ou `supfile-1`)
3. Allez dans l'onglet **"Environment"**
4. Ajoutez/modifiez ces variables :

   | Variable | Valeur |
   |----------|--------|
   | `GOOGLE_CLIENT_ID` | Collez votre **Client ID** (ex: `860515202678-xxxxxxxxxxxxx.apps.googleusercontent.com`) |
   | `GOOGLE_CLIENT_SECRET` | Collez votre **Client Secret** (ex: `GOCSPX-xxxxxxxxxxxxx`) |
   | `GOOGLE_REDIRECT_URI` | `https://supfile-1.onrender.com/api/auth/google/callback` |

5. Cliquez sur **"Save Changes"** (Enregistrer les modifications)
6. Render redéploiera automatiquement le service

---

## ✅ Vérification

### Dans les logs Render

Après le redéploiement, les logs devraient montrer :
```
✅ Google OAuth configured
```

### Test

1. Attendez 2-3 minutes après le redéploiement
2. Allez sur https://supfile-frontend.onrender.com/login
3. Cliquez sur **"Se connecter avec Google"**
4. Vous devriez être redirigé vers Google pour autoriser l'application
5. Après autorisation, vous devriez être connecté automatiquement

---

## 🔒 Sécurité

- ⚠️ **Ne partagez jamais** votre Client Secret publiquement
- ⚠️ **Ne commitez jamais** les secrets dans Git
- ✅ Utilisez toujours les variables d'environnement dans Render
- ✅ Les secrets sont automatiquement masqués dans l'interface Render

---

## 🆘 Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URI dans Google Cloud Console correspond **EXACTEMENT** à celle dans Render
- Pas de slash final, pas d'espaces
- Utilisez `https://` (pas `http://`)

### Erreur "invalid_client"
- Vérifiez que le Client ID et Client Secret sont corrects dans Render
- Assurez-vous qu'il n'y a pas d'espaces avant/après les valeurs
- Vérifiez que vous avez copié le Client Secret avant de fermer la fenêtre

### L'application n'apparaît pas dans la liste Google
- Vérifiez que vous avez sélectionné le bon projet dans Google Cloud Console
- Vérifiez que l'API Google Identity est activée

---

## 📝 Résumé des liens importants

- **Google Cloud Console** : https://console.cloud.google.com/
- **Créer un projet** : https://console.cloud.google.com/projectcreate
- **Bibliothèque d'APIs** : https://console.cloud.google.com/apis/library
- **Écran de consentement** : https://console.cloud.google.com/apis/credentials/consent
- **Identifiants OAuth** : https://console.cloud.google.com/apis/credentials
- **Render Dashboard** : https://dashboard.render.com/

