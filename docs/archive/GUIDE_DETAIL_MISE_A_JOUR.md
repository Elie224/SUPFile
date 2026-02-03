# 📋 Guide Détaillé - Mise à Jour OAuth et Netlify

## 🔧 Partie 1 : Mettre à Jour les Redirect URIs OAuth

### 1.1 Google Cloud Console

#### Étape 1 : Accéder à la Console

1. **Ouvrez votre navigateur** (Chrome, Firefox, Edge, etc.)
2. **Allez sur** : https://console.cloud.google.com/
3. **Connectez-vous** avec votre compte Google (celui utilisé pour créer le projet OAuth)

#### Étape 2 : Naviguer vers les Credentials

1. **Dans le menu de gauche**, cherchez "APIs & Services"
2. **Cliquez sur "APIs & Services"**
3. **Dans le sous-menu**, cliquez sur **"Credentials"**

   **Alternative** : Accès direct via https://console.cloud.google.com/apis/credentials

#### Étape 3 : Trouver votre OAuth Client

1. **Dans la page "Credentials"**, vous verrez une liste de vos credentials
2. **Cherchez** votre OAuth 2.0 Client ID
   - Il devrait contenir dans son nom ou son ID : `860515202678-rae4pot74t5jmbs12c2012ivki3neron`
   - Ou cherchez "OAuth 2.0 Client ID" dans le type
3. **Cliquez sur le nom** de votre OAuth Client (pas sur l'icône, mais sur le texte du nom)

#### Étape 4 : Ajouter le Redirect URI

1. **Dans la page de détails** de votre OAuth Client, vous verrez plusieurs sections :
   - "Name"
   - "Authorized JavaScript origins"
   - **"Authorized redirect URIs"** ← C'est ici qu'il faut aller

2. **Dans la section "Authorized redirect URIs"** :
   - Vous verrez probablement déjà des URLs (comme `http://localhost:5000/api/auth/google/callback` ou des URLs Render)
   - **Cliquez sur le bouton "+ ADD URI"** (ou sur l'icône "+" à côté de "Authorized redirect URIs")

3. **Un nouveau champ de texte apparaît** :
   - **Tapez exactement** : `https://supfile.fly.dev/api/auth/google/callback`
   - ⚠️ **Important** : Vérifiez qu'il n'y a pas d'espace avant ou après
   - ⚠️ **Important** : Vérifiez que c'est bien `https://` (pas `http://`)

4. **Cliquez sur "Save"** en bas de la page
   - Le bouton "Save" est généralement en bleu, en bas à droite ou au centre de la page

#### Étape 5 : Vérifier

1. **Après avoir cliqué sur "Save"**, vous devriez voir un message de confirmation
2. **Vérifiez** que la nouvelle URL apparaît maintenant dans la liste "Authorized redirect URIs"
3. **Note** : Vous pouvez avoir plusieurs Redirect URIs (pour localhost, Render, et maintenant Fly.io)

---

### 1.2 GitHub Developer Settings

#### Étape 1 : Accéder aux Paramètres Développeur

1. **Ouvrez votre navigateur**
2. **Allez sur** : https://github.com/settings/developers
3. **Connectez-vous** avec votre compte GitHub (si ce n'est pas déjà fait)

#### Étape 2 : Accéder aux OAuth Apps

1. **Dans la page "Developer settings"**, vous verrez un menu à gauche avec :
   - Personal access tokens
   - Fine-grained tokens
   - **OAuth Apps** ← Cliquez ici
   - GitHub Apps
   - etc.

2. **Cliquez sur "OAuth Apps"** dans le menu de gauche

#### Étape 3 : Trouver votre Application OAuth

1. **Dans la page "OAuth Apps"**, vous verrez une liste de vos applications OAuth
2. **Cherchez** votre application
   - Elle devrait avoir le Client ID : `Ov23ligHjSi2qTjUNtCc`
   - Ou cherchez par nom (probablement "SUPFile" ou quelque chose de similaire)
3. **Cliquez sur le nom** de votre application OAuth

#### Étape 4 : Mettre à Jour le Redirect URI

1. **Dans la page de détails** de votre OAuth App, vous verrez plusieurs champs :
   - Application name
   - Homepage URL
   - Application description
   - **Authorization callback URL** ← C'est ici qu'il faut modifier

2. **Dans le champ "Authorization callback URL"** :
   - **Sélectionnez tout le texte** dans ce champ (Ctrl+A ou Cmd+A)
   - **Remplacez-le par** : `https://supfile.fly.dev/api/auth/github/callback`
   - ⚠️ **Important** : Vérifiez qu'il n'y a pas d'espace avant ou après
   - ⚠️ **Important** : Vérifiez que c'est bien `https://` (pas `http://`)

3. **Faites défiler vers le bas** de la page

4. **Cliquez sur le bouton "Update application"** (généralement en vert, en bas de la page)

#### Étape 5 : Vérifier

1. **Après avoir cliqué sur "Update application"**, vous devriez voir un message de confirmation
2. **Vérifiez** que le champ "Authorization callback URL" affiche maintenant : `https://supfile.fly.dev/api/auth/github/callback`

---

## 🌐 Partie 2 : Mettre à Jour Netlify

### 2.1 Accéder à Netlify

#### Étape 1 : Ouvrir Netlify

1. **Ouvrez votre navigateur**
2. **Allez sur** : https://app.netlify.com/
3. **Connectez-vous** avec votre compte Netlify (si ce n'est pas déjà fait)

#### Étape 2 : Trouver votre Site

1. **Dans le tableau de bord Netlify**, vous verrez une liste de vos sites
2. **Cherchez** votre site SUPFile
   - Le nom pourrait être : `flourishing-banoffee-c0b1ad` (ou un nom similaire)
   - Ou cherchez par le nom de domaine personnalisé si vous en avez un
3. **Cliquez sur le nom** de votre site (pas sur l'icône, mais sur le texte)

---

### 2.2 Accéder aux Variables d'Environnement

#### Étape 1 : Ouvrir les Paramètres du Site

1. **Dans la page de votre site**, vous verrez plusieurs onglets en haut :
   - Overview
   - Deploys
   - **Site settings** ← Cliquez ici
   - Analytics
   - Functions
   - etc.

2. **Cliquez sur "Site settings"** (ou "Paramètres du site" si votre interface est en français)

#### Étape 2 : Accéder aux Variables d'Environnement

1. **Dans le menu de gauche** de la page "Site settings", vous verrez plusieurs options :
   - General
   - Domain management
   - Build & deploy
   - **Environment variables** ← Cliquez ici
   - Identity
   - etc.

2. **Cliquez sur "Environment variables"** dans le menu de gauche

---

### 2.3 Modifier la Variable VITE_API_URL

#### Étape 1 : Trouver la Variable

1. **Dans la page "Environment variables"**, vous verrez un tableau avec :
   - **Key** (nom de la variable)
   - **Values** (valeur de la variable)
   - **Scopes** (environnements : Production, Deploy previews, Branch deploys)

2. **Cherchez** la variable `VITE_API_URL` dans la liste
   - Si elle existe, vous verrez sa valeur actuelle (probablement `https://supfile-1.onrender.com` ou une autre URL)
   - Si elle n'existe pas, vous devrez la créer (voir "Créer la Variable" ci-dessous)

#### Étape 2 : Modifier la Variable Existante

**Si la variable `VITE_API_URL` existe déjà** :

1. **Trouvez la ligne** avec `VITE_API_URL` dans le tableau
2. **Cliquez sur l'icône "Edit"** (icône de crayon) à droite de la ligne
   - Ou cliquez sur les trois points "..." puis "Edit"
3. **Un formulaire s'ouvre** :
   - **Key** : `VITE_API_URL` (ne changez pas)
   - **Value** : Remplacez la valeur actuelle par `https://supfile.fly.dev`
   - ⚠️ **Important** : Vérifiez qu'il n'y a pas d'espace avant ou après
   - ⚠️ **Important** : Vérifiez que c'est bien `https://` (pas `http://`)
   - ⚠️ **Important** : Pas de slash `/` à la fin (juste `https://supfile.fly.dev`)
4. **Vérifiez les "Scopes"** :
   - Cochez au moins "Production" (et "Deploy previews" / "Branch deploys" si vous voulez)
5. **Cliquez sur "Save"** (ou "Enregistrer")

#### Étape 3 : Créer la Variable (Si elle n'existe pas)

**Si la variable `VITE_API_URL` n'existe pas** :

1. **Cliquez sur le bouton "Add a variable"** (ou "Ajouter une variable")
   - Ce bouton est généralement en haut à droite ou en bas du tableau
2. **Remplissez le formulaire** :
   - **Key** : `VITE_API_URL`
   - **Value** : `https://supfile.fly.dev`
   - ⚠️ **Important** : Vérifiez qu'il n'y a pas d'espace avant ou après
   - ⚠️ **Important** : Vérifiez que c'est bien `https://` (pas `http://`)
   - ⚠️ **Important** : Pas de slash `/` à la fin
3. **Sélectionnez les "Scopes"** :
   - Cochez au moins "Production" (et les autres si vous voulez)
4. **Cliquez sur "Save"** (ou "Enregistrer")

#### Étape 4 : Vérifier

1. **Après avoir sauvegardé**, vous devriez voir un message de confirmation
2. **Vérifiez** que la variable `VITE_API_URL` apparaît maintenant dans le tableau avec la valeur `https://supfile.fly.dev`

---

### 2.4 Redéployer le Site

#### Étape 1 : Accéder aux Déploiements

1. **Retournez à la page principale** de votre site (cliquez sur le nom du site en haut)
2. **Cliquez sur l'onglet "Deploys"** (ou "Déploiements")

#### Étape 2 : Déclencher un Nouveau Déploiement

1. **Dans la page "Deploys"**, vous verrez une liste de vos déploiements précédents
2. **En haut à droite**, cherchez le bouton **"Trigger deploy"** (ou "Déclencher un déploiement")
3. **Cliquez sur "Trigger deploy"**
4. **Un menu déroulant apparaît**, cliquez sur **"Deploy site"** (ou "Déployer le site")

#### Étape 3 : Attendre le Déploiement

1. **Un nouveau déploiement commence** immédiatement
2. **Vous verrez** une nouvelle ligne dans la liste des déploiements avec le statut "Building" puis "Published"
3. **Attendez** que le statut passe à "Published" (cela peut prendre 1-3 minutes)
4. **Une fois "Published"**, votre site utilise maintenant la nouvelle URL API

#### Étape 4 : Vérifier le Déploiement

1. **Cliquez sur le déploiement** qui vient de se terminer
2. **Vérifiez les logs** pour vous assurer qu'il n'y a pas d'erreur
3. **Ouvrez votre site** dans le navigateur et testez la connexion

---

## ✅ Checklist de Vérification

### OAuth Google
- [ ] Connecté à Google Cloud Console
- [ ] OAuth Client trouvé et ouvert
- [ ] Redirect URI `https://supfile.fly.dev/api/auth/google/callback` ajouté
- [ ] Changements sauvegardés
- [ ] Nouvelle URL visible dans la liste

### OAuth GitHub
- [ ] Connecté à GitHub Developer Settings
- [ ] OAuth App trouvée et ouverte
- [ ] Authorization callback URL mis à jour avec `https://supfile.fly.dev/api/auth/github/callback`
- [ ] Changements sauvegardés
- [ ] Nouvelle URL visible dans les paramètres

### Netlify
- [ ] Connecté à Netlify
- [ ] Site trouvé et ouvert
- [ ] Page "Site settings" → "Environment variables" ouverte
- [ ] Variable `VITE_API_URL` trouvée ou créée
- [ ] Valeur mise à jour avec `https://supfile.fly.dev`
- [ ] Changements sauvegardés
- [ ] Nouveau déploiement déclenché
- [ ] Déploiement terminé avec succès

---

## 🧪 Tests Après Mise à Jour

### Test 1 : Vérifier les Variables Netlify

1. **Retournez** dans "Site settings" → "Environment variables"
2. **Vérifiez** que `VITE_API_URL` a bien la valeur `https://supfile.fly.dev`

### Test 2 : Tester le Frontend

1. **Ouvrez votre site Netlify** dans le navigateur
2. **Ouvrez la console du navigateur** (F12 → onglet "Console")
3. **Essayez de vous connecter** avec Google OAuth
4. **Vérifiez** qu'il n'y a pas d'erreur dans la console
5. **Essayez de vous connecter** avec GitHub OAuth
6. **Vérifiez** que la connexion fonctionne

### Test 3 : Vérifier les Requêtes API

1. **Dans la console du navigateur** (F12 → onglet "Network")
2. **Rechargez la page** ou effectuez une action
3. **Cherchez** les requêtes vers l'API
4. **Vérifiez** que les requêtes vont vers `https://supfile.fly.dev` (pas vers l'ancienne URL)

---

## 🆘 En Cas de Problème

### Le Redirect URI Google ne fonctionne pas

- **Vérifiez** que l'URL est exactement : `https://supfile.fly.dev/api/auth/google/callback` (pas d'espace, pas de slash à la fin)
- **Vérifiez** que vous avez cliqué sur "Save" après avoir ajouté l'URL
- **Attendez** 1-2 minutes (les changements peuvent prendre un peu de temps à se propager)
- **Vérifiez** que le secret `GOOGLE_REDIRECT_URI` sur Fly.io est aussi correct

### Le Redirect URI GitHub ne fonctionne pas

- **Vérifiez** que l'URL est exactement : `https://supfile.fly.dev/api/auth/github/callback` (pas d'espace, pas de slash à la fin)
- **Vérifiez** que vous avez cliqué sur "Update application"
- **Vérifiez** que le secret `GITHUB_REDIRECT_URI` sur Fly.io est aussi correct

### Netlify ne se connecte pas au backend

- **Vérifiez** que `VITE_API_URL` est bien défini avec la valeur `https://supfile.fly.dev`
- **Vérifiez** que vous avez redéployé le site après avoir modifié la variable
- **Vérifiez** que le déploiement s'est terminé avec succès
- **Ouvrez la console du navigateur** (F12) pour voir les erreurs exactes
- **Vérifiez** que les requêtes dans l'onglet "Network" vont vers `https://supfile.fly.dev`

---

## 🎉 Une Fois Terminé

Après avoir suivi toutes ces étapes :

- ✅ **OAuth Google** fonctionnera avec `https://supfile.fly.dev`
- ✅ **OAuth GitHub** fonctionnera avec `https://supfile.fly.dev`
- ✅ **Frontend Netlify** se connectera au backend Fly.io
- ✅ **Tout sera connecté** et fonctionnel !

Vous pouvez maintenant tester votre application complète ! 🚀
