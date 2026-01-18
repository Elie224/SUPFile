# 🔧 Correction OAuth Mobile - SUPFile

## 🐛 Problèmes Identifiés et Corrigés

### 1. ✅ **linkStream non défini** (Corrigé)
**Problème** : `linkStream` était utilisé sans être initialisé dans `oauth_service.dart`  
**Solution** : Initialisation correcte avec `getUriLinksStream()` et gestion de `getInitialUri()`

### 2. ✅ **Deep Links non configurés** (Corrigé)
**Problème** : AndroidManifest.xml ne déclarait pas les deep links `supfile://`  
**Solution** : Ajout d'un `intent-filter` pour `supfile://oauth/*`

### 3. ✅ **API URL par défaut incorrecte** (Corrigé)
**Problème** : `http://localhost:5000` ne fonctionne pas sur mobile  
**Solution** : URL par défaut changée vers `https://supfile-1.onrender.com`

### 4. ✅ **Route POST OAuth manquante** (Corrigé)
**Problème** : Le backend n'avait que des routes GET pour OAuth (Passport)  
**Solution** : Ajout de `POST /api/auth/google/callback` pour Google Sign-In natif mobile

### 5. ✅ **Deep links non supportés dans callback** (Corrigé)
**Problème** : Le callback OAuth redirigait toujours vers le frontend web  
**Solution** : Détection des deep links mobiles et redirection vers `supfile://oauth/...`

---

## 📝 Modifications Appliquées

### Mobile App (`mobile-app/`)

#### `lib/services/oauth_service.dart`
- ✅ Initialisation correcte de `getUriLinksStream()`
- ✅ Vérification de `getInitialUri()` pour les deep links initiaux
- ✅ Correction du parsing des paramètres de callback

#### `lib/utils/constants.dart`
- ✅ URL API par défaut : `https://supfile-1.onrender.com` (au lieu de `localhost`)

#### `android/app/src/main/AndroidManifest.xml`
- ✅ Ajout d'`intent-filter` pour deep links `supfile://oauth/*`

### Backend (`backend/`)

#### `routes/auth.js`
- ✅ Ajout de `POST /api/auth/google/callback` (mobile natif)
- ✅ Ajout de `POST /api/auth/github/callback` (pour compatibilité)

#### `controllers/oauthController.js`
- ✅ Détection des deep links mobiles dans le callback GET
- ✅ Redirection vers `supfile://oauth/...` si `redirect_uri` est un deep link

#### `controllers/oauthMobileController.js` (NOUVEAU)
- ✅ Route POST pour Google Sign-In natif mobile
- ✅ Vérification des tokens Google avec l'API Google
- ✅ Création/authentification utilisateur
- ✅ Retour des tokens JWT en JSON

---

## 🔍 Vérifications Nécessaires

### Configuration Google OAuth

Le backend a besoin que le **Client ID Google** soit configuré pour accepter :
- **Type d'application** : Android
- **Package name** : `com.example.supfile_mobile`
- **SHA-1/SHA-256** : Obtenir avec `keytool -list -v -keystore ...`

**Pour obtenir le SHA-1** :
```powershell
cd mobile-app/android
keytool -list -v -keystore .\app\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Configuration GitHub OAuth

Dans les paramètres GitHub OAuth App, ajouter :
- **Authorization callback URL** : `supfile://oauth/github/callback`

---

## 🚀 Test de l'OAuth Mobile

### Google OAuth (Natif)
1. L'utilisateur clique sur "Continuer avec Google"
2. Google Sign-In natif s'ouvre
3. L'utilisateur sélectionne son compte
4. Le mobile obtient `id_token` et `access_token`
5. Le mobile envoie POST `/api/auth/google/callback` avec les tokens
6. Le backend vérifie les tokens avec Google
7. Le backend retourne les tokens JWT en JSON
8. ✅ Connexion réussie

### GitHub OAuth (Navigateur + Deep Link)
1. L'utilisateur clique sur "Continuer avec GitHub"
2. Le navigateur s'ouvre avec `/api/auth/github?redirect_uri=supfile://oauth/github/callback`
3. L'utilisateur s'authentifie sur GitHub
4. GitHub redirige vers le backend avec le code
5. Le backend échange le code contre des tokens
6. Le backend redirige vers `supfile://oauth/github/callback?token=...&refresh_token=...`
7. L'app mobile capture le deep link
8. ✅ Connexion réussie

---

## ⚠️ Prochaines Étapes

1. **Rebuild l'APK** avec les corrections :
   ```powershell
   $env:GRADLE_USER_HOME = "C:\gradle-cache"
   cd mobile-app
   flutter build apk --release
   ```

2. **Tester sur un appareil physique** :
   - Google OAuth (natif)
   - GitHub OAuth (navigateur)
   - Connexion/Inscription classique

3. **Vérifier la configuration OAuth** :
   - Google Client ID configuré pour Android
   - GitHub OAuth App avec callback `supfile://oauth/github/callback`

---

**Date de correction** : Janvier 2025