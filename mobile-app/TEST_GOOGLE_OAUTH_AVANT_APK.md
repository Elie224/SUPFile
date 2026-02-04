# 🧪 Test Google OAuth Avant Génération APK Final

## 📋 Objectif

Tester la connexion Google OAuth sur l'application mobile **AVANT** de générer l'APK release final pour s'assurer que tout fonctionne.

## ✅ Corrections OAuth Appliquées dans le Code

Les corrections suivantes ont été faites dans le code source :

### Mobile (`mobile-app/`)
- ✅ **Deep Links** : Configuration dans `AndroidManifest.xml` pour `supfile://oauth/*`
- ✅ **linkStream** : Correction dans `oauth_service.dart` 
- ✅ **API URL** : Par défaut `https://supfile.fly.dev` (ou une URL définie au build) au lieu de `localhost`

### Backend (`backend/`)
- ✅ **Route POST** : `POST /api/auth/google/callback` pour Google Sign-In natif mobile
- ✅ **Deep links support** : Redirection vers `supfile://oauth/...` pour mobile
- ✅ **Controller mobile** : `oauthMobileController.js` pour gérer les callbacks OAuth mobile

## 🚀 Génération APK Debug pour Test

L'APK debug est en cours de génération avec toutes ces corrections incluses.

**Fichier généré** :
```
build/app/outputs/flutter-apk/app-debug.apk
```

## 📱 Installation et Test

### 1. Installer l'APK Debug sur votre téléphone

**Option A : Transfert manuel**
- Copier `app-debug.apk` sur votre téléphone
- Installer depuis le gestionnaire de fichiers

**Option B : Via USB**
- Connecter le téléphone via USB
- Activer le débogage USB
- `adb install build/app/outputs/flutter-apk/app-debug.apk`

### 2. Tester Google OAuth

1. **Ouvrir l'application SUPFile**
2. **Sur l'écran de connexion** : Cliquer sur "Continuer avec Google"
3. **Résultat attendu** :
   - ✅ Google Sign-In natif s'ouvre
   - ✅ Liste des comptes Google disponibles
   - ✅ Sélection du compte → Connexion réussie
   - ✅ Redirection vers Dashboard

### 3. Si erreur "DEVELOPER_ERROR"

**Cause** : Le SHA-1 du keystore debug n'est pas configuré dans Google Cloud Console

**Solution** :
1. Obtenir le SHA-1 :
   ```powershell
   keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
2. Ajouter dans Google Cloud Console :
   - https://console.cloud.google.com/apis/credentials
   - OAuth 2.0 Client ID Android
   - Package name : `com.example.supfile_mobile`
   - SHA-1 : [le SHA-1 obtenu]
3. Attendre 5-10 minutes pour la propagation

## ✅ Si le test réussit

Une fois que Google OAuth fonctionne sur l'APK debug :

1. ✅ **Les corrections OAuth sont validées**
2. ✅ **On peut générer l'APK release final** avec confiance
3. ✅ **Le déploiement peut se faire**

## ❌ Si le test échoue

Analyser l'erreur et corriger :
- Erreur réseau → Vérifier la connexion API
- Erreur DEVELOPER_ERROR → Configurer le SHA-1 (voir ci-dessus)
- Autre erreur → Vérifier les logs dans la console

---

**Date** : Janvier 2025