# 📱 Installer l'APK pour tester Google OAuth

## 📦 APK Disponible

L'APK release est disponible ici :
```
C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app\build\app\outputs\flutter-apk\app-release.apk
```

**Taille** : ~66 MB  
**Contient** : Toutes les corrections OAuth (deep links, API URL, routes backend)

---

## 🚀 Installation sur Téléphone Android

### Option 1 : Via USB (ADB)

1. **Connecter votre téléphone via USB**
2. **Activer le débogage USB** :
   - Settings → Developer options → USB debugging
3. **Installer l'APK** :
   ```powershell
   # Depuis le dossier mobile-app
   adb install build\app\outputs\flutter-apk\app-release.apk
   ```

### Option 2 : Transfert Manuel

1. **Transférer l'APK** :
   - Copier `app-release.apk` sur votre téléphone (via USB, email, cloud, etc.)
   
2. **Installer sur le téléphone** :
   - Ouvrir le gestionnaire de fichiers
   - Trouver `app-release.apk`
   - Autoriser l'installation depuis "Sources inconnues" si demandé
   - Taper sur le fichier pour installer

3. **Désinstaller l'ancienne version** (si présente) :
   - Settings → Apps → SUPFile → Uninstall

---

## ✅ Test Google OAuth

### 1. Ouvrir l'application SUPFile

### 2. Sur l'écran de connexion, cliquer sur "Continuer avec Google"

### 3. Résultat attendu

**Si Google OAuth est configuré** ✅ :
- Google Sign-In natif s'ouvre
- Liste des comptes Google
- Sélection du compte → Connexion réussie
- Redirection vers Dashboard

**Si erreur "DEVELOPER_ERROR"** ❌ :
- Le SHA-1 du keystore **release** n'est pas configuré dans Google Cloud Console
- Solution : Voir section "Configuration Google OAuth" ci-dessous

---

## 🔧 Configuration Google OAuth (si nécessaire)

### Pour que Google OAuth fonctionne :

1. **Obtenir le SHA-1 du keystore release** :
   ```powershell
   # Si vous avez un keystore release
   keytool -list -v -keystore android\app\release.keystore -alias key
   
   # Pour l'APK actuel (signé avec debug keystore)
   keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

2. **Configurer dans Google Cloud Console** :
   - Aller sur : https://console.cloud.google.com/apis/credentials
   - Sélectionner le projet OAuth SUPFile
   - Dans "OAuth 2.0 Client IDs", trouver le Client ID Android
   - Ajouter :
     - **Package name** : `com.example.supfile_mobile`
     - **SHA-1** : [le SHA-1 obtenu ci-dessus]
   - **Important** : Attendre 5-10 minutes pour la propagation

---

## 🧪 Autres Tests

### Test GitHub OAuth
1. Cliquer sur "Continuer avec GitHub"
2. Le navigateur s'ouvre
3. Authentification GitHub
4. Deep link `supfile://oauth/github/callback` redirige vers l'app
5. ✅ Connexion réussie

### Test Connexion/Inscription Classique
1. Tester l'inscription avec email/password
2. Tester la connexion avec email/password
3. ✅ Doit fonctionner même sans OAuth configuré

---

## 📝 Notes

- **APK actuel** : Signé avec le keystore **debug** (pour tester uniquement)
- **Pour production** : Il faudra générer un APK signé avec un keystore release
- **API Backend** : `https://supfile-1.onrender.com` (en ligne ✅)

---

## 🐛 Si l'installation échoue

### "App not installed" ou "Package appears to be invalid"

**Solution** :
1. Désinstaller l'ancienne version de SUPFile
2. Vérifier que l'APK n'est pas corrompu (vérifier la taille ~66 MB)
3. Réessayer l'installation

### "Parse error"

**Solution** :
- L'APK est corrompu ou incompatible avec votre version Android
- Régénérer l'APK

---

**Date** : Janvier 2025