# 🧪 Test Google OAuth en Local - SUPFile Mobile

## 📋 Prérequis

Pour tester Google OAuth en local, vous avez besoin de :

1. **Un appareil Android** (physique ou émulateur)
2. **Backend en cours d'exécution** (local ou production)
3. **Configuration Google OAuth** pour Android

---

## 🚀 Option 1 : Tester avec Émulateur Android

### 1. Lancer l'émulateur

```powershell
cd mobile-app
flutter emulators --launch Medium_Phone_API_36.1
```

**Attendre** : 30-60 secondes que l'émulateur démarre complètement

### 2. Vérifier que l'émulateur est prêt

```powershell
flutter devices
```

Vous devriez voir : `emulator-5554 • sdk gphone64 arm64 • android`

### 3. Lancer l'application

**Avec API backend locale** (si backend tourne sur `localhost:5000`) :
```powershell
# Trouver l'IP locale de votre machine (ex: 192.168.1.X)
flutter run --dart-define=API_URL=http://192.168.1.X:5000
```

**Avec API backend en production** (Render) :
```powershell
flutter run
# Utilisera https://supfile.fly.dev par défaut (ou l'URL définie via --dart-define)
```

### 4. Tester Google OAuth

1. L'application s'ouvre sur l'émulateur
2. Cliquer sur **"Continuer avec Google"**
3. Google Sign-In devrait s'ouvre
4. Sélectionner un compte Google
5. Vérifier la connexion

---

## 🚀 Option 2 : Tester avec Téléphone Physique

### 1. Activer le mode développeur

- **Settings** → **About phone**
- Appuyer 7 fois sur **"Build number"**
- Mode développeur activé ✅

### 2. Activer le débogage USB

- **Settings** → **Developer options**
- Activer **"USB debugging"**

### 3. Connecter le téléphone via USB

- Brancher le téléphone à votre PC
- Autoriser le débogage USB sur le téléphone (popup)

### 4. Vérifier la connexion

```powershell
flutter devices
```

Vous devriez voir votre téléphone dans la liste

### 5. Lancer l'application

**Avec API backend locale** :
```powershell
# Trouver l'IP locale de votre machine (ex: 192.168.1.X)
flutter run --dart-define=API_URL=http://192.168.1.X:5000 -d <device-id>
```

**Avec API backend en production** :
```powershell
flutter run -d <device-id>
```

### 6. Tester Google OAuth

1. L'application s'ouvre sur votre téléphone
2. Cliquer sur **"Continuer avec Google"**
3. Google Sign-In s'ouvre
4. Sélectionner un compte Google
5. Vérifier la connexion

---

## 🔧 Configuration Google OAuth pour Android

### Si erreur "DEVELOPER_ERROR" lors du test :

1. **Obtenir le SHA-1 du keystore debug** :

   ```powershell
   keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   Chercher la ligne : `SHA1: XX:XX:XX:...`

2. **Configurer dans Google Cloud Console** :
   - Aller sur : https://console.cloud.google.com/apis/credentials
   - Sélectionner le projet OAuth SUPFile
   - Dans "OAuth 2.0 Client IDs", trouver le Client ID Android
   - Cliquer sur le Client ID pour l'éditer
   - Vérifier/ajouter :
     - **Package name** : `com.example.supfile_mobile`
     - **SHA-1 certificate fingerprint** : [le SHA-1 obtenu]
   - Sauvegarder
   - ⚠️ **Important** : Attendre 5-10 minutes pour la propagation

3. **Réessayer le test Google OAuth**

---

## 📝 Configuration API Backend

### Option A : Backend en Production (Recommandé pour test)

**Avantages** :
- Pas besoin de démarrer le backend local
- Backend déjà configuré et déployé
- Les corrections OAuth sont actives

**Commande** :
```powershell
flutter run
```

### Option B : Backend en Local

**Avantages** :
- Test complet en local
- Logs backend visibles
- Pas de dépendance à Render

**Étapes** :

1. **Démarrer le backend local** :
   ```powershell
   cd backend
   npm start
   # Backend sur http://localhost:5000
   ```

2. **Trouver l'IP locale de votre machine** :
   ```powershell
   ipconfig
   # Chercher "IPv4 Address" : ex. 192.168.1.100
   ```

3. **Lancer l'application mobile avec l'IP locale** :
   ```powershell
   cd mobile-app
   flutter run --dart-define=API_URL=http://192.168.1.100:5000
   ```

**⚠️ Important** :
- Utiliser l'**IP locale** (pas `localhost`)
- Le téléphone/émulateur doit être sur le même réseau WiFi que votre PC
- Vérifier que le firewall autorise les connexions sur le port 5000

---

## ✅ Checklist de Test

- [ ] Émulateur ou téléphone Android connecté
- [ ] Application lancée avec `flutter run`
- [ ] Test "Continuer avec Google" → ✅/❌
  - [ ] Google Sign-In s'ouvre → ✅/❌
  - [ ] Sélection du compte → ✅/❌
  - [ ] Connexion réussie → ✅/❌

---

## 🐛 Dépannage

### Erreur : "No devices found"

**Solution** :
- Vérifier que l'émulateur est lancé : `flutter emulators --launch ...`
- Vérifier que le téléphone est connecté : `flutter devices`
- Attendre que l'appareil soit complètement prêt

### Erreur : "DEVELOPER_ERROR" (Google OAuth)

**Solution** :
- Vérifier que le SHA-1 est configuré dans Google Cloud Console
- Attendre 5-10 minutes après modification
- Voir section "Configuration Google OAuth" ci-dessus

### Erreur : "Network error" (Backend local)

**Solution** :
- Vérifier que le backend tourne : `http://localhost:5000/health`
- Utiliser l'IP locale (pas `localhost`)
- Vérifier que le téléphone/émulateur est sur le même réseau

---

**Date** : Janvier 2025
