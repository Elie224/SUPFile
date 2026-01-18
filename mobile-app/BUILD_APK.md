# 📦 Guide de Build APK - SUPFile Mobile

## 📋 Prérequis

1. **Flutter SDK** installé et configuré
   ```bash
   flutter --version  # Vérifier que Flutter est installé
   flutter doctor     # Vérifier la configuration
   ```

2. **Java JDK 17** installé
   - Windows : Télécharger depuis https://adoptium.net/
   - Vérifier : `java -version`

3. **Android Studio** ou **Android SDK Command Line Tools**
   - Configurer les variables d'environnement `ANDROID_HOME`

## 🔧 Configuration

### 1. Vérifier la configuration Flutter

```bash
cd mobile-app
flutter doctor -v
```

Assurez-vous que tout est OK (✅) :
- ✅ Flutter (Channel stable, version)
- ✅ Android toolchain (Android SDK)
- ✅ Android Studio / VS Code
- ✅ Connected device / Emulator

### 2. Nettoyer le projet

```bash
flutter clean
flutter pub get
```

## 🏗️ Build APK

### Option 1 : Build APK Debug (pour tester)

```bash
cd mobile-app
flutter build apk --debug
```

L'APK sera généré dans : `mobile-app/build/app/outputs/flutter-apk/app-debug.apk`

### Option 2 : Build APK Release (pour distribution)

```bash
cd mobile-app
flutter build apk --release
```

L'APK sera généré dans : `mobile-app/build/app/outputs/flutter-apk/app-release.apk`

### Option 3 : Build APK Split par ABI (plus petit)

```bash
cd mobile-app
flutter build apk --split-per-abi --release
```

Génère 3 APK séparés :
- `app-armeabi-v7a-release.apk` (ARM 32-bit)
- `app-arm64-v8a-release.apk` (ARM 64-bit) - **Recommandé pour la plupart des appareils**
- `app-x86_64-release.apk` (x86 64-bit)

### Option 4 : Build Bundle (AAB) pour Google Play Store

```bash
cd mobile-app
flutter build appbundle --release
```

Le fichier `.aab` sera dans : `mobile-app/build/app/outputs/bundle/release/app-release.aab`

## 📱 Installation de l'APK

### Sur un appareil Android physique :

1. **Activer les sources inconnues** :
   - Paramètres → Sécurité → Sources inconnues (activer)
   - Ou Paramètres → Applications → Installation d'applications → Autoriser depuis cette source

2. **Transférer l'APK** sur l'appareil (USB, email, cloud, etc.)

3. **Installer l'APK** :
   - Ouvrir le fichier APK
   - Suivre les instructions d'installation

### Via ADB (Android Debug Bridge) :

```bash
# Connecter l'appareil via USB
adb devices  # Vérifier que l'appareil est détecté

# Installer l'APK
adb install mobile-app/build/app/outputs/flutter-apk/app-release.apk
```

## 🔐 Signer l'APK (pour production)

### 1. Générer une clé de signature

```bash
keytool -genkey -v -keystore supfile-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias supfile
```

Renseigner les informations demandées.

### 2. Créer un fichier `key.properties`

Créer `mobile-app/android/key.properties` :

```properties
storePassword=<mot-de-passe-du-keystore>
keyPassword=<mot-de-passe-de-la-clé>
keyAlias=supfile
storeFile=<chemin-vers-supfile-keystore.jks>
```

⚠️ **Important** : Ajouter `key.properties` au `.gitignore` pour ne pas commiter les secrets !

### 3. Configurer `build.gradle.kts`

Le fichier est déjà configuré pour lire `key.properties` si présent. Sinon, il utilisera la clé de debug.

### 4. Build l'APK signé

```bash
flutter build apk --release
```

## 📊 Informations de l'APK

- **Nom de l'app** : SUPFile
- **Package ID** : `com.example.supfile_mobile`
- **Version** : `1.0.0` (build `1`)
- **Min SDK** : 21 (Android 5.0)
- **Target SDK** : Automatique (dernière version Flutter)

## 🔍 Vérification de l'APK

### Vérifier la taille :

```bash
# Windows PowerShell
(Get-Item mobile-app/build/app/outputs/flutter-apk/app-release.apk).Length / 1MB

# Linux/Mac
ls -lh mobile-app/build/app/outputs/flutter-apk/app-release.apk
```

### Vérifier les informations :

```bash
aapt dump badging mobile-app/build/app/outputs/flutter-apk/app-release.apk
```

## 🚀 Utiliser le Script PowerShell

Un script `build-apk.ps1` a été créé pour automatiser le build :

```powershell
cd mobile-app
.\build-apk.ps1
```

Le script :
- Nettoie le projet
- Récupère les dépendances
- Build l'APK Release
- Ouvre le dossier contenant l'APK

## 📝 Notes Importantes

1. **Logo Flutter** : Les icônes par défaut (`@mipmap/ic_launcher`) doivent être remplacées par les icônes SUPFile personnalisées dans `android/app/src/main/res/mipmap-*/`

2. **Nom de l'application** : Configuré comme "SUPFile" dans AndroidManifest.xml

3. **Version** : Modifier dans `pubspec.yaml` : `version: 1.0.0+1` (version+build)

4. **Permissions** : Vérifier `AndroidManifest.xml` pour les permissions nécessaires

5. **ProGuard/R8** : En production, configurer la minification dans `build.gradle.kts`

---

**Date de création** : Décembre 2025