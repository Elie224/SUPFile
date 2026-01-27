# 🧪 Test Google OAuth - SUPFile Mobile

## 📋 Prérequis pour le test

### 1. API Backend en ligne ✅
L'API est accessible sur : `https://supfile-1.onrender.com`

### 2. Package Name de l'application
- **Package Name** : `com.example.supfile_mobile`
- **Application ID** : `com.example.supfile_mobile`

### 3. Configuration Google OAuth (À VÉRIFIER)

Pour que Google OAuth fonctionne, le **Google Client ID** doit être configuré dans la Google Cloud Console :

1. Aller sur : https://console.cloud.google.com/apis/credentials
2. Sélectionner le projet OAuth de SUPFile
3. Dans "OAuth 2.0 Client IDs", trouver le Client ID Android
4. Vérifier que :
   - **Package name** : `com.example.supfile_mobile`
   - **SHA-1 certificate fingerprint** : [Obtenir avec la commande ci-dessous]

### 4. Obtenir le SHA-1 du keystore debug

**Windows (PowerShell)** :
```powershell
cd mobile-app/android
keytool -list -v -keystore app\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Chercher la ligne** : `SHA1: XX:XX:XX:...`

**Si le keystore n'existe pas encore** :
- Il sera créé automatiquement lors du premier `flutter run` ou `flutter build`
- Relancer la commande après le premier build

---

## 🚀 Étapes de test

### Option A : Avec l'émulateur Android

1. **Lancer l'émulateur** :
   ```powershell
   cd mobile-app
   flutter emulators --launch Medium_Phone_API_36.1
   ```

2. **Attendre que l'émulateur démarre** (30-60 secondes)

3. **Lancer l'application** :
   ```powershell
   flutter run
   ```

### Option B : Avec un appareil physique

1. **Activer le mode développeur** :
   - Settings → About phone
   - Appuyer 7 fois sur "Build number"

2. **Activer le débogage USB** :
   - Settings → Developer options → USB debugging

3. **Connecter le téléphone via USB**

4. **Vérifier la connexion** :
   ```powershell
   flutter devices
   ```

5. **Lancer l'application** :
   ```powershell
   flutter run
   ```

---

## ✅ Test de Google OAuth

### 1. Sur l'écran de connexion
- L'application s'ouvre sur l'écran de connexion

### 2. Cliquer sur "Continuer avec Google"
- Le bouton OAuth Google est visible

### 3. Résultat attendu

**Si Google OAuth est configuré correctement** :
- ✅ Google Sign-In natif s'ouvre
- ✅ Liste des comptes Google disponibles
- ✅ Après sélection du compte → Connexion réussie
- ✅ Redirection vers le Dashboard

**Si Google OAuth n'est pas configuré** :
- ❌ Erreur : "DEVELOPER_ERROR" ou "10"
- ❌ Message : "Google Sign-In failed"

---

## 🐛 Dépannage

### Erreur : "DEVELOPER_ERROR" (Code 10)

**Cause** : Le SHA-1 ou le Package Name ne correspondent pas dans Google Cloud Console

**Solution** :
1. Vérifier le SHA-1 avec `keytool -list -v ...`
2. Vérifier que le SHA-1 est ajouté dans Google Cloud Console
3. Vérifier que le Package Name est `com.example.supfile_mobile`
4. **Attendre 5-10 minutes** après modification (Google met du temps à propager)

### Erreur : "API not enabled"

**Cause** : L'API Google Sign-In n'est pas activée

**Solution** :
1. Aller sur : https://console.cloud.google.com/apis/library
2. Chercher "Google Sign-In API"
3. Cliquer sur "Enable"

### Erreur : "Network error" ou "Connection failed"

**Cause** : L'application ne peut pas se connecter au backend

**Solution** :
1. Vérifier que l'API est en ligne : `https://supfile-1.onrender.com/health`
2. Vérifier la connexion internet de l'émulateur/appareil
3. Vérifier que `AppConstants.apiBaseUrl` est bien `https://supfile-1.onrender.com`

### L'application ne démarre pas

**Vérifier** :
```powershell
flutter doctor
flutter clean
flutter pub get
flutter run --verbose
```

---

## 📝 Notes importantes

1. **Pour le développement** : Utiliser le SHA-1 du keystore **debug**
2. **Pour la production** : Utiliser le SHA-1 du keystore **release** (différent !)
3. **Google met du temps** : Les modifications dans Google Cloud Console peuvent prendre 5-10 minutes pour être effectives
4. **Test sans configuration** : Vous pouvez tester la connexion/inscription classique même si Google OAuth n'est pas configuré

---

## ✅ Checklist avant de générer l'APK

- [ ] Google OAuth fonctionne sur l'émulateur/appareil
- [ ] GitHub OAuth fonctionne (navigateur + deep link)
- [ ] Connexion classique (email/password) fonctionne
- [ ] Inscription fonctionne
- [ ] API backend accessible depuis le mobile

---

**Date** : Janvier 2025