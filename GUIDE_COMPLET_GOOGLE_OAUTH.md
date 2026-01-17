# 📘 Guide complet : Créer un projet Google OAuth depuis zéro

## 🎯 Objectif
Créer un nouveau projet Google Cloud et configurer l'authentification OAuth pour SUPFile.

---

## 📋 ÉTAPE 1 : Créer un projet Google Cloud

### 1.1 Accéder à Google Cloud Console

1. Ouvrez votre navigateur
2. Allez sur : **https://console.cloud.google.com/**
3. Connectez-vous avec votre compte Google si nécessaire

### 1.2 Créer un nouveau projet

1. En haut à gauche, cliquez sur le **sélecteur de projet** (à côté de "Google Cloud")
   - Il affiche probablement "Select a project" ou le nom d'un projet existant
2. Dans la fenêtre qui s'ouvre, cliquez sur **"NEW PROJECT"** (Nouveau projet)
   - Ou directement : https://console.cloud.google.com/projectcreate
3. Remplissez le formulaire :
   - **Project name** : `SUPFile-App` (ou un autre nom unique de votre choix)
     - Suggestions alternatives : `SUPFile-2025`, `SUPFile-Production`, `SUPFile-OAuth`
   - **Organization** : Laissez par défaut (sélectionnez "No organization" si vous n'avez pas d'organisation)
   - **Location** : Laissez par défaut
4. Cliquez sur **"CREATE"** (Créer)
5. Attendez 10-30 secondes que le projet soit créé
6. Une notification apparaît en haut : "Project created successfully"
7. Le nouveau projet est automatiquement sélectionné

---

## 📋 ÉTAPE 2 : Activer l'API Google Identity

### 2.1 Accéder à la bibliothèque d'APIs

1. Dans le menu latéral gauche, cliquez sur **"APIs & Services"**
2. Cliquez sur **"Library"** (Bibliothèque)
   - Ou directement : https://console.cloud.google.com/apis/library

### 2.2 Rechercher et activer l'API

1. Dans la barre de recherche en haut, tapez : **"Google Identity Services API"**
2. Cliquez sur **"Google Identity Services API"** dans les résultats
3. Sur la page de l'API, cliquez sur le bouton bleu **"ENABLE"** (Activer)
4. Attendez quelques secondes
5. Un message de confirmation apparaît : "API enabled"
6. Vous êtes maintenant sur la page de l'API activée

---

## 📋 ÉTAPE 3 : Configurer l'écran de consentement OAuth

### 3.1 Accéder à l'écran de consentement

1. Dans le menu latéral, cliquez sur **"APIs & Services"**
2. Cliquez sur **"OAuth consent screen"** (Écran de consentement OAuth)
   - Ou directement : https://console.cloud.google.com/apis/credentials/consent

### 3.2 Choisir le type d'utilisateurs

1. Vous verrez deux options :
   - **Internal** : Pour les utilisateurs de votre organisation Google Workspace uniquement
   - **External** : Pour tous les utilisateurs Google
2. Sélectionnez **"External"** (Externe)
3. Cliquez sur **"CREATE"** (Créer)

### 3.3 Remplir les informations de l'application (App information)

1. **App information** (Informations de l'application) :
   - **App name** : `SUPFile`
     - C'est le nom qui apparaîtra aux utilisateurs lors de la connexion
   - **User support email** : 
     - Sélectionnez votre email dans le menu déroulant
     - Exemple : `kouroumaelisee@gmail.com`
   - **App logo** : (Optionnel)
     - Vous pouvez ajouter un logo plus tard, laissez vide pour l'instant
   - **App domain** : (Optionnel)
     - Laissez vide pour l'instant
   - **Application home page** : 
     - Entrez : `https://supfile-frontend.onrender.com`
   - **Authorized domains** : 
     - Cliquez sur **"+ ADD DOMAIN"**
     - Entrez : `onrender.com`
     - ⚠️ Entrez seulement `onrender.com` (sans `https://` ni `www.`)
   - **Developer contact information** : 
     - Entrez votre email : `kouroumaelisee@gmail.com`
2. Cliquez sur **"SAVE AND CONTINUE"** (Enregistrer et continuer) en bas

### 3.4 Configurer les scopes (Portées)

1. Vous êtes maintenant sur la page **"Scopes"**
2. Cliquez sur **"ADD OR REMOVE SCOPES"** (Ajouter ou supprimer des portées)
3. Une fenêtre s'ouvre avec une liste de scopes
4. Dans la section **"Manually add scopes"** (Ajouter manuellement des portées), vous verrez des scopes déjà ajoutés
5. Vérifiez que ces scopes sont présents (ils devraient être ajoutés automatiquement) :
   - ✅ `.../auth/userinfo.email` - Voir votre adresse e-mail
   - ✅ `.../auth/userinfo.profile` - Voir vos informations de profil de base
   - ✅ `openid` - Associer votre identité avec vous
6. Si ces scopes ne sont pas présents, ajoutez-les :
   - Cliquez sur **"ADD TO TABLE"** pour chaque scope manquant
7. Cliquez sur **"UPDATE"** (Mettre à jour) en bas de la fenêtre
8. Cliquez sur **"SAVE AND CONTINUE"** (Enregistrer et continuer)

### 3.5 Ajouter des utilisateurs de test (Test users)

1. Vous êtes maintenant sur la page **"Test users"**
2. ⚠️ **Important** : En mode "Testing", seuls les utilisateurs de test peuvent se connecter
3. Cliquez sur **"ADD USERS"** (Ajouter des utilisateurs)
4. Entrez votre email : `kouroumaelisee@gmail.com`
   - Vous pouvez ajouter plusieurs emails séparés par des virgules
5. Cliquez sur **"ADD"** (Ajouter)
6. Votre email apparaît maintenant dans la liste des utilisateurs de test
7. Cliquez sur **"SAVE AND CONTINUE"** (Enregistrer et continuer)

### 3.6 Vérifier le résumé (Summary)

1. Vous êtes maintenant sur la page **"Summary"**
2. Vérifiez que toutes les informations sont correctes :
   - App name : SUPFile
   - User support email : votre email
   - Application home page : https://supfile-frontend.onrender.com
   - Authorized domains : onrender.com
   - Scopes : userinfo.email, userinfo.profile, openid
   - Test users : votre email
3. Cliquez sur **"BACK TO DASHBOARD"** (Retour au tableau de bord)

---

## 📋 ÉTAPE 4 : Créer les identifiants OAuth

### 4.1 Accéder aux identifiants

1. Dans le menu latéral, cliquez sur **"APIs & Services"**
2. Cliquez sur **"Credentials"** (Identifiants)
   - Ou directement : https://console.cloud.google.com/apis/credentials

### 4.2 Créer un OAuth Client ID

1. En haut de la page, cliquez sur **"+ CREATE CREDENTIALS"** (+ Créer des identifiants)
2. Dans le menu déroulant, sélectionnez **"OAuth client ID"**
3. Si c'est la première fois, vous verrez peut-être un message vous demandant de configurer l'écran de consentement
   - Si vous avez déjà fait l'étape 3, cliquez sur **"CONFIGURE CONSENT SCREEN"** et suivez les étapes
   - Sinon, vous pouvez continuer directement

### 4.3 Remplir le formulaire OAuth Client ID

1. **Application type** (Type d'application) :
   - Sélectionnez **"Web application"** (Application Web)
   
2. **Name** (Nom) :
   - Entrez : `SUPFile Web Client`
   - C'est juste un nom pour identifier ce client OAuth dans Google Cloud Console

3. **Authorized JavaScript origins** (Origines JavaScript autorisées) :
   - Cliquez sur **"+ ADD URI"** (+ Ajouter URI)
   - Entrez : `https://supfile-1.onrender.com`
   - Cliquez sur **"+ ADD URI"** à nouveau
   - Entrez : `https://supfile-frontend.onrender.com`
   - Vous devriez avoir deux URIs :
     ```
     https://supfile-1.onrender.com
     https://supfile-frontend.onrender.com
     ```
   - ⚠️ **Important** :
     - Utilisez `https://` (pas `http://`)
     - Pas de slash à la fin
     - Pas d'espaces

4. **Authorized redirect URIs** (URI de redirection autorisées) :
   - Cliquez sur **"+ ADD URI"** (+ Ajouter URI)
   - Entrez **EXACTEMENT** : `https://supfile-1.onrender.com/api/auth/google/callback`
   - ⚠️ **TRÈS IMPORTANT** :
     - Utilisez `https://` (pas `http://`)
     - Pas de slash à la fin (`/callback` et non `/callback/`)
     - Pas d'espaces avant ou après
     - Le chemin doit être `/api/auth/google/callback` exactement
     - Cette URI doit correspondre EXACTEMENT à celle configurée dans Render

5. Cliquez sur **"CREATE"** (Créer) en bas

### 4.4 Copier les identifiants

1. Une fenêtre popup s'ouvre avec vos identifiants OAuth :
   
   **Your Client ID** (Votre identifiant client) :
   ```
   860515202678-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```
   - C'est une longue chaîne qui se termine par `.apps.googleusercontent.com`
   
   **Your Client Secret** (Votre secret client) :
   ```
   GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - C'est une chaîne qui commence par `GOCSPX-`

2. ⚠️ **TRÈS IMPORTANT** :
   - **Copiez IMMÉDIATEMENT** le **Client ID** et le **Client Secret**
   - Vous pouvez les copier en cliquant sur l'icône de copie à droite de chaque champ
   - Ou sélectionnez le texte et copiez-le (Ctrl+C)
   - **Vous ne pourrez PLUS voir le Client Secret après avoir fermé cette fenêtre !**
   - Si vous perdez le Client Secret, vous devrez en créer un nouveau

3. Notez ces identifiants dans un endroit sûr (fichier texte, notes, etc.)

4. Cliquez sur **"OK"** pour fermer la fenêtre

---

## 📋 ÉTAPE 5 : Configurer dans Render

### 5.1 Accéder au dashboard Render

1. Ouvrez un nouvel onglet dans votre navigateur
2. Allez sur : **https://dashboard.render.com/**
3. Connectez-vous si nécessaire

### 5.2 Sélectionner le service backend

1. Dans la liste des services, trouvez votre service backend
   - Il s'appelle probablement `supfile-backend` ou `supfile-1`
2. Cliquez sur le nom du service pour l'ouvrir

### 5.3 Accéder aux variables d'environnement

1. Dans le menu horizontal en haut de la page du service, cliquez sur **"Environment"** (Environnement)
2. Vous verrez une liste de toutes les variables d'environnement configurées

### 5.4 Ajouter/modifier les variables Google OAuth

1. **Ajouter GOOGLE_CLIENT_ID** :
   - Cliquez sur **"Add Environment Variable"** (Ajouter une variable d'environnement)
   - Dans le champ **"Key"** (Clé), entrez : `GOOGLE_CLIENT_ID`
   - Dans le champ **"Value"** (Valeur), collez votre **Client ID** copié à l'étape 4.4
     - Exemple : `860515202678-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - Cliquez sur **"Save Changes"** (Enregistrer les modifications)

2. **Ajouter GOOGLE_CLIENT_SECRET** :
   - Cliquez sur **"Add Environment Variable"** à nouveau
   - Dans le champ **"Key"**, entrez : `GOOGLE_CLIENT_SECRET`
   - Dans le champ **"Value"**, collez votre **Client Secret** copié à l'étape 4.4
     - Exemple : `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ Le secret sera masqué dans l'interface Render (c'est normal)
   - Cliquez sur **"Save Changes"**

3. **Ajouter/modifier GOOGLE_REDIRECT_URI** :
   - Si la variable existe déjà, cliquez dessus pour la modifier
   - Sinon, cliquez sur **"Add Environment Variable"**
   - Dans le champ **"Key"**, entrez : `GOOGLE_REDIRECT_URI`
   - Dans le champ **"Value"**, entrez **EXACTEMENT** : `https://supfile-1.onrender.com/api/auth/google/callback`
   - ⚠️ **Vérifiez** :
     - Utilisez `https://` (pas `http://`)
     - Pas de slash à la fin
     - Pas d'espaces
     - Doit correspondre EXACTEMENT à l'URI configurée dans Google Cloud Console
   - Cliquez sur **"Save Changes"**

### 5.5 Vérifier les variables

Vous devriez maintenant avoir ces 3 variables dans Render :
- ✅ `GOOGLE_CLIENT_ID` = votre Client ID
- ✅ `GOOGLE_CLIENT_SECRET` = votre Client Secret (masqué)
- ✅ `GOOGLE_REDIRECT_URI` = `https://supfile-1.onrender.com/api/auth/google/callback`

### 5.6 Redéploiement automatique

1. Après avoir sauvegardé les variables, Render redéploiera automatiquement votre service
2. Vous verrez un message : "Redeploying service..."
3. Attendez 2-5 minutes que le redéploiement soit terminé
4. Vous pouvez suivre le déploiement dans l'onglet **"Logs"** (Journaux)

---

## 📋 ÉTAPE 6 : Vérifier la configuration

### 6.1 Vérifier les logs Render

1. Dans Render, allez dans l'onglet **"Logs"** (Journaux) de votre service backend
2. Attendez que le déploiement soit terminé
3. Recherchez ces messages dans les logs :
   ```
   🔧 Configuring OAuth strategies...
   ✅ Google OAuth configured
   🔧 OAuth strategies configuration completed
   ```
4. Si vous voyez ces messages, la configuration est réussie ✅

### 6.2 Vérifier dans Google Cloud Console

1. Retournez sur Google Cloud Console : https://console.cloud.google.com/apis/credentials
2. Vérifiez que votre OAuth Client ID est bien créé
3. Cliquez dessus pour voir les détails
4. Vérifiez que les **Authorized redirect URIs** contiennent bien :
   ```
   https://supfile-1.onrender.com/api/auth/google/callback
   ```

---

## 📋 ÉTAPE 7 : Tester l'authentification

### 7.1 Accéder à la page de connexion

1. Ouvrez votre navigateur
2. Allez sur : **https://supfile-frontend.onrender.com/login**
3. Vous devriez voir la page de connexion avec les boutons OAuth

### 7.2 Tester la connexion Google

1. Cliquez sur le bouton **"Se connecter avec Google"** ou **"Continuer avec Google"**
2. Vous devriez être redirigé vers une page Google demandant l'autorisation
3. Vérifiez que :
   - Le nom de l'application affiché est "SUPFile"
   - Les permissions demandées sont : email et profil
4. Cliquez sur **"Autoriser"** ou **"Allow"**
5. Vous devriez être redirigé vers votre application et être connecté automatiquement ✅

### 7.3 Résolution des problèmes

Si vous voyez une erreur :

**Erreur "redirect_uri_mismatch"** :
- Vérifiez que l'URI dans Google Cloud Console correspond EXACTEMENT à celle dans Render
- Pas de slash final, pas d'espaces
- Utilisez `https://` (pas `http://`)

**Erreur "invalid_client"** :
- Vérifiez que le Client ID et Client Secret sont corrects dans Render
- Assurez-vous qu'il n'y a pas d'espaces avant/après les valeurs
- Vérifiez que vous avez copié le Client Secret avant de fermer la fenêtre

**Erreur "access_denied"** :
- Si vous êtes en mode "Testing", vérifiez que votre email est dans la liste des utilisateurs de test
- Allez dans OAuth consent screen > Test users et ajoutez votre email

---

## 📝 Résumé des identifiants à noter

Après avoir terminé toutes les étapes, vous devriez avoir noté :

1. **Client ID** : `860515202678-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
2. **Client Secret** : `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`
3. **Redirect URI** : `https://supfile-1.onrender.com/api/auth/google/callback`

---

## 🔗 Liens rapides

- **Google Cloud Console** : https://console.cloud.google.com/
- **Créer un projet** : https://console.cloud.google.com/projectcreate
- **Bibliothèque d'APIs** : https://console.cloud.google.com/apis/library
- **Écran de consentement** : https://console.cloud.google.com/apis/credentials/consent
- **Identifiants OAuth** : https://console.cloud.google.com/apis/credentials
- **Render Dashboard** : https://dashboard.render.com/
- **Application frontend** : https://supfile-frontend.onrender.com/login

---

## ✅ Checklist finale

Avant de tester, vérifiez que :

- [ ] Le projet Google Cloud est créé
- [ ] L'API Google Identity est activée
- [ ] L'écran de consentement OAuth est configuré
- [ ] Les scopes sont ajoutés (email, profile, openid)
- [ ] Votre email est dans la liste des utilisateurs de test
- [ ] L'OAuth Client ID est créé
- [ ] Les Authorized JavaScript origins sont configurées
- [ ] L'Authorized redirect URI est configurée correctement
- [ ] Le Client ID et Client Secret sont copiés et sauvegardés
- [ ] Les variables d'environnement sont configurées dans Render
- [ ] Le service backend est redéployé
- [ ] Les logs montrent "Google OAuth configured"

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs Render pour voir les erreurs exactes
2. Vérifiez que toutes les URLs correspondent exactement (pas de différences de casse, pas de slash final)
3. Assurez-vous que toutes les variables d'environnement sont bien configurées
4. Redéployez le service après avoir modifié les variables

---

**Félicitations ! 🎉** Votre authentification Google OAuth est maintenant configurée !


