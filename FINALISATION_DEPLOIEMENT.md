# 🚀 Finalisation du Déploiement - Guide Complet

## ✅ Statut Actuel

- ✅ **Backend déployé** : https://supfile.fly.dev/
- ✅ **Secrets configurés** : 14/14 secrets sur Fly.io
- ✅ **API fonctionnelle** : Health check répond correctement
- ✅ **Fichiers mis à jour** : `constants.dart` et `config.js` mis à jour avec la nouvelle URL

---

## 📋 Étapes de Finalisation

### 1. 🔧 Mettre à Jour les Redirect URIs OAuth

Les Redirect URIs doivent être mis à jour dans les consoles OAuth pour que l'authentification fonctionne.

#### Google Cloud Console

1. **Accéder à la console** :
   - Allez sur https://console.cloud.google.com/apis/credentials
   - Connectez-vous avec votre compte Google

2. **Sélectionner votre OAuth Client** :
   - Cliquez sur votre OAuth 2.0 Client ID (celui avec `GOOGLE_CLIENT_ID`)

3. **Ajouter le Redirect URI** :
   - Dans la section "Authorized redirect URIs", cliquez sur "+ ADD URI"
   - Ajoutez : `https://supfile.fly.dev/api/auth/google/callback`
   - Cliquez sur "Save"

4. **Vérifier** :
   - Le Redirect URI doit maintenant apparaître dans la liste

#### GitHub Developer Settings

1. **Accéder aux paramètres** :
   - Allez sur https://github.com/settings/developers
   - Cliquez sur "OAuth Apps" dans le menu de gauche

2. **Sélectionner votre application** :
   - Cliquez sur votre OAuth App (celui avec `GITHUB_CLIENT_ID`)

3. **Mettre à jour le Redirect URI** :
   - Dans "Authorization callback URL", remplacez l'ancienne URL par :
     ```
     https://supfile.fly.dev/api/auth/github/callback
     ```
   - Cliquez sur "Update application"

4. **Vérifier** :
   - La nouvelle URL doit être affichée dans les paramètres

---

### 2. 🌐 Mettre à Jour Netlify (Frontend Web)

#### Option A : Via l'Interface Web (Recommandé)

1. **Accéder à Netlify** :
   - Allez sur https://app.netlify.com
   - Connectez-vous avec votre compte

2. **Sélectionner votre site** :
   - Cliquez sur votre site (probablement `flourishing-banoffee-c0b1ad`)

3. **Accéder aux variables d'environnement** :
   - Allez dans **Site settings** (en haut à droite)
   - Cliquez sur **Environment variables** dans le menu de gauche

4. **Mettre à jour VITE_API_URL** :
   - Trouvez la variable `VITE_API_URL`
   - Cliquez sur "Edit"
   - Remplacez la valeur par : `https://supfile.fly.dev`
   - Cliquez sur "Save"

5. **Redéployer** :
   - Allez dans **Deploys**
   - Cliquez sur **Trigger deploy** → **Deploy site**
   - Attendez que le déploiement se termine

#### Option B : Via le fichier netlify.toml (Si présent)

Si vous avez un fichier `netlify.toml` à la racine du projet, vous pouvez y ajouter :

```toml
[build.environment]
  VITE_API_URL = "https://supfile.fly.dev"
```

Puis poussez les changements sur GitHub pour déclencher un nouveau déploiement.

---

### 3. 📱 Mettre à Jour l'Application Mobile

✅ **Déjà fait** : Le fichier `mobile-app/lib/utils/constants.dart` a été mis à jour avec la nouvelle URL.

#### Reconstruire l'APK

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app
flutter clean
flutter pub get
flutter build apk --release
```

**Note** : L'APK sera généré dans `mobile-app/build/app/outputs/flutter-apk/app-release.apk`

#### Tester l'Application Mobile

1. **Installer l'APK** sur votre appareil Android
2. **Tester la connexion** :
   - Ouvrir l'application
   - Essayer de se connecter avec Google OAuth
   - Essayer de se connecter avec GitHub OAuth
   - Vérifier que les requêtes API fonctionnent

---

## 🧪 Tests de Vérification

### Test 1 : Backend API

```powershell
# Health check
curl https://supfile.fly.dev/health

# Devrait retourner :
# {"status":"OK","message":"SUPFile API is running"}
```

### Test 2 : Frontend Web

1. Ouvrez votre site Netlify dans le navigateur
2. Essayez de vous connecter avec Google OAuth
3. Essayez de vous connecter avec GitHub OAuth
4. Vérifiez que les données se chargent correctement

### Test 3 : Application Mobile

1. Installez l'APK sur votre appareil
2. Testez la connexion OAuth
3. Testez l'upload de fichiers
4. Vérifiez que tout fonctionne

---

## ✅ Checklist Finale

### Backend
- [x] Application déployée sur Fly.io
- [x] Secrets configurés (14/14)
- [x] API fonctionnelle
- [x] Health check répond

### OAuth
- [ ] Redirect URI Google mis à jour dans Google Cloud Console
- [ ] Redirect URI GitHub mis à jour dans GitHub Developer Settings

### Frontend Web
- [x] Fichier `config.js` mis à jour
- [ ] Variable `VITE_API_URL` mise à jour sur Netlify
- [ ] Frontend redéployé sur Netlify
- [ ] Test de connexion OAuth réussi

### Application Mobile
- [x] Fichier `constants.dart` mis à jour
- [ ] APK reconstruit
- [ ] Test de connexion OAuth réussi
- [ ] Test des fonctionnalités réussi

---

## 🎯 Actions Immédiates

1. **Mettre à jour les Redirect URIs OAuth** (Google et GitHub)
2. **Mettre à jour `VITE_API_URL` sur Netlify**
3. **Redéployer le frontend sur Netlify**
4. **Reconstruire l'APK mobile**
5. **Tester tout** (Web et Mobile)

---

## 🆘 En Cas de Problème

### OAuth ne fonctionne pas

- Vérifiez que les Redirect URIs sont exactement : `https://supfile.fly.dev/api/auth/[google|github]/callback`
- Vérifiez que les secrets `GOOGLE_REDIRECT_URI` et `GITHUB_REDIRECT_URI` sont corrects sur Fly.io
- Vérifiez les logs : `flyctl logs --app supfile`

### Frontend ne se connecte pas au backend

- Vérifiez que `VITE_API_URL` est bien défini sur Netlify
- Vérifiez que le frontend a été redéployé après la modification
- Ouvrez la console du navigateur (F12) pour voir les erreurs

### Application mobile ne se connecte pas

- Vérifiez que l'APK a été reconstruit après la modification
- Vérifiez que `API_URL` est bien utilisé dans le code
- Vérifiez les logs de l'application avec `flutter logs`

---

## 🎉 Une Fois Terminé

Votre application SUPFile sera complètement déployée et fonctionnelle sur :
- **Backend** : https://supfile.fly.dev/
- **Frontend Web** : Votre URL Netlify
- **Application Mobile** : APK installable sur Android

Tous les services seront connectés et l'authentification OAuth fonctionnera ! 🚀
