# 🚀 Guide de Déploiement Local - Application Mobile SUPFile

Ce guide explique comment créer et déployer l'application mobile en local pour Android et Web.

## 📋 Prérequis

1. ✅ Flutter SDK installé et configuré
2. ✅ Backend démarré et accessible
3. ✅ Java JDK installé (pour Android)
4. ✅ Android SDK configuré (pour Android)

## 🔧 Configuration

### 1. Vérifier la configuration de l'API

L'URL de l'API est définie via `--dart-define=API_URL=...` lors du build.

**Pour localhost (développement)** :
- Web : `http://localhost:5000`
- Android Emulator : `http://10.0.2.2:5000`
- Android Physique : `http://VOTRE_IP_LOCALE:5000` (ex: `http://192.168.1.100:5000`)

**Pour production locale** :
- Utilisez l'IP de votre machine sur le réseau local
- Exemple : `http://192.168.1.100:5000`

### 2. Trouver votre IP locale

**Windows** :
```powershell
ipconfig
# Cherchez "Adresse IPv4" sous votre carte réseau active
```

**Linux/Mac** :
```bash
ifconfig
# ou
ip addr show
```

## 📱 Build Android (APK)

### Build Release APK

```powershell
cd mobile-app
flutter build apk --release --dart-define=API_URL=http://VOTRE_IP:5000
```

**Fichier généré** :
- `build/app/outputs/flutter-apk/app-release.apk`

### Build APK Split (par architecture - plus léger)

```powershell
flutter build apk --split-per-abi --release --dart-define=API_URL=http://VOTRE_IP:5000
```

**Fichiers générés** :
- `build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk` (32-bit)
- `build/app/outputs/flutter-apk/app-arm64-v8a-release.apk` (64-bit)
- `build/app/outputs/flutter-apk/app-x86_64-release.apk` (x86_64)

### Installer l'APK sur un appareil

1. Transférez l'APK sur votre téléphone Android
2. Activez "Sources inconnues" dans les paramètres de sécurité
3. Ouvrez l'APK et installez

## 🌐 Build Web

### Build Web Release

```powershell
cd mobile-app
flutter build web --release --dart-define=API_URL=http://VOTRE_IP:5000
```

**Fichiers générés** :
- `build/web/` (dossier contenant tous les fichiers web)

### Servir le build web localement

**Option 1 : Avec Python** :
```powershell
cd build/web
python -m http.server 8080
```

**Option 2 : Avec Node.js (http-server)** :
```powershell
npm install -g http-server
cd build/web
http-server -p 8080
```

**Option 3 : Avec Flutter** :
```powershell
flutter run -d chrome --release --dart-define=API_URL=http://localhost:5000
```

**Accès** :
- Ouvrez votre navigateur : `http://localhost:8080`

## 🐳 Déploiement avec Docker (Optionnel)

### Build Docker Image

```powershell
cd mobile-app
docker build -t supfile-mobile:latest .
```

### Lancer le conteneur

```powershell
docker run -d -p 8080:8080 --name supfile-mobile supfile-mobile:latest
```

**Accès** :
- `http://localhost:8080`

## 📦 Scripts de Build Automatisés

### Script PowerShell (build-all.ps1)

Créez un fichier `build-all.ps1` dans `mobile-app/` :

```powershell
# Configuration
$API_URL = "http://192.168.1.100:5000"  # Remplacez par votre IP
$BUILD_DIR = "build"

Write-Host "🚀 Démarrage du build de production..." -ForegroundColor Green

# Nettoyer les builds précédents
Write-Host "🧹 Nettoyage..." -ForegroundColor Yellow
flutter clean

# Récupérer les dépendances
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
flutter pub get

# Build Android APK
Write-Host "📱 Build Android APK..." -ForegroundColor Yellow
flutter build apk --release --dart-define=API_URL=$API_URL

# Build Web
Write-Host "🌐 Build Web..." -ForegroundColor Yellow
flutter build web --release --dart-define=API_URL=$API_URL

Write-Host "✅ Build terminé !" -ForegroundColor Green
Write-Host "📱 APK Android : build/app/outputs/flutter-apk/app-release.apk" -ForegroundColor Cyan
Write-Host "🌐 Web : build/web/" -ForegroundColor Cyan
```

**Utilisation** :
```powershell
cd mobile-app
.\build-all.ps1
```

## 🔐 Configuration de Sécurité pour Production

### 1. Utiliser HTTPS

Pour la production, configurez HTTPS sur votre backend et utilisez :
```
--dart-define=API_URL=https://votre-domaine.com
```

### 2. Obfuscation du Code

```powershell
flutter build apk --release --obfuscate --split-debug-info=build/debug-info --dart-define=API_URL=...
```

### 3. Signature de l'APK

Pour signer l'APK pour la production, configurez `android/app/build.gradle.kts` :

```kotlin
signingConfigs {
    create("release") {
        storeFile = file("keystore.jks")
        storePassword = System.getenv("KEYSTORE_PASSWORD")
        keyAlias = System.getenv("KEY_ALIAS")
        keyPassword = System.getenv("KEY_PASSWORD")
    }
}

buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
    }
}
```

## 📊 Vérification du Build

### Vérifier la taille de l'APK

```powershell
Get-Item build/app/outputs/flutter-apk/app-release.apk | Select-Object Name, Length
```

### Analyser le build

```powershell
flutter build apk --analyze-size --dart-define=API_URL=...
```

## 🚀 Déploiement Rapide

### Commande unique pour tout builder

```powershell
cd mobile-app; flutter clean; flutter pub get; flutter build apk --release --dart-define=API_URL=http://192.168.1.100:5000; flutter build web --release --dart-define=API_URL=http://192.168.1.100:5000
```

**Remplacez `192.168.1.100` par votre IP locale !**

## 📝 Checklist de Déploiement

- [ ] Backend démarré et accessible
- [ ] IP locale identifiée
- [ ] Build Android APK créé
- [ ] Build Web créé
- [ ] APK testé sur appareil Android
- [ ] Application Web testée dans le navigateur
- [ ] Configuration API correcte
- [ ] HTTPS configuré (pour production)

## 🆘 Dépannage

### Erreur "API_URL not found"

Assurez-vous d'utiliser `--dart-define=API_URL=...` lors du build.

### Erreur de connexion API

1. Vérifiez que le backend est démarré
2. Vérifiez l'IP dans l'URL de l'API
3. Vérifiez le pare-feu Windows
4. Pour Android physique, assurez-vous que le téléphone et l'ordinateur sont sur le même réseau

### Build échoue

```powershell
flutter clean
flutter pub get
flutter doctor
```

---

**Bon déploiement ! 🎉**




