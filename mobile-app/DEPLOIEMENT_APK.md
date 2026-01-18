# 🚀 Guide Complet de Déploiement APK - SUPFile Mobile

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration Initiale](#configuration-initiale)
3. [Génération de l'APK](#génération-de-lapk)
4. [Signature de l'APK](#signature-de-lapk)
5. [Distribution de l'APK](#distribution-de-lapk)
6. [Vérification de l'APK](#vérification-de-lapk)
7. [Dépannage](#dépannage)

---

## 📋 Prérequis

### 1. Outils Requis

- ✅ **Flutter SDK** (version stable recommandée)
  ```bash
  flutter --version
  ```
- ✅ **Java JDK 17** ou supérieur
  ```bash
  java -version
  ```
- ✅ **Android Studio** avec Android SDK
- ✅ **Git** (pour versioning)

### 2. Vérification de l'Environnement

```bash
cd mobile-app
flutter doctor -v
```

Assurez-vous que tous les composants sont ✅ :
- ✅ Flutter (Channel stable)
- ✅ Android toolchain
- ✅ Android Studio / IntelliJ
- ✅ VS Code (optionnel)

---

## 🔧 Configuration Initiale

### 1. Nettoyer le Projet

```bash
cd mobile-app
flutter clean
flutter pub get
```

### 2. Vérifier la Configuration Android

#### **AndroidManifest.xml** ✅
- Nom de l'app : `SUPFile` ✅
- Package ID : `com.example.supfile_mobile`
- Permissions : Internet, Network State ✅

#### **build.gradle.kts**
- Min SDK : 21 (Android 5.0)
- Target SDK : Automatique (dernière version Flutter)
- Java 17 ✅

#### **pubspec.yaml**
- Version : `1.0.0+1` (version+build number)
- Nom : `supfile_mobile` ✅

---

## 🏗️ Génération de l'APK

### Option 1 : Script Automatique (Recommandé)

```powershell
cd mobile-app
.\build-apk.ps1
```

Le script :
- Nettoie le projet
- Récupère les dépendances
- Vérifie Flutter
- Build l'APK Release
- Ouvre le dossier contenant l'APK

### Option 2 : Commandes Manuelles

#### APK Debug (pour tests)
```bash
cd mobile-app
flutter build apk --debug
```
📁 **Emplacement** : `build/app/outputs/flutter-apk/app-debug.apk`

#### APK Release (pour distribution)
```bash
cd mobile-app
flutter build apk --release
```
📁 **Emplacement** : `build/app/outputs/flutter-apk/app-release.apk`

#### APK Split par ABI (recommandé pour distribution)
```bash
cd mobile-app
flutter build apk --split-per-abi --release
```

Génère 3 APK optimisés :
- `app-armeabi-v7a-release.apk` (~20 MB) - ARM 32-bit (anciens appareils)
- `app-arm64-v8a-release.apk` (~22 MB) - ARM 64-bit ⭐ **Recommandé pour la plupart**
- `app-x86_64-release.apk` (~23 MB) - x86 64-bit (émulateurs/PC)

💡 **Avantage** : APK plus petits, installation plus rapide

#### Bundle AAB (pour Google Play Store)
```bash
cd mobile-app
flutter build appbundle --release
```
📁 **Emplacement** : `build/app/outputs/bundle/release/app-release.aab`

---

## 🔐 Signature de l'APK

### Pour Tests (Debug - Déjà configuré)
L'APK debug est automatiquement signé avec la clé de debug.

### Pour Production (Release)

#### 1. Générer une Clé de Signature

```bash
keytool -genkey -v -keystore supfile-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias supfile
```

**Informations à renseigner :**
- Mot de passe du keystore : **À CONSERVER PRÉCIEUSEMENT** 🔒
- Mot de passe de la clé : **Peut être le même**
- Nom, Organisation, Ville, Pays, etc.

⚠️ **Important** : 
- Conservez le fichier `.jks` en lieu sûr
- Notez les mots de passe (utilisez un gestionnaire de mots de passe)
- **NE PAS** commiter le keystore sur Git

#### 2. Créer `key.properties`

Créer `mobile-app/android/key.properties` :

```properties
storePassword=<VOTRE_MOT_DE_PASSE_KEYSTORE>
keyPassword=<VOTRE_MOT_DE_PASSE_CLE>
keyAlias=supfile
storeFile=../supfile-release-key.jks
```

⚠️ **Sécurité** : 
- Ajouter `key.properties` au `.gitignore`
- Ne jamais commiter ce fichier
- Garder une copie sécurisée du keystore

#### 3. Configurer `build.gradle.kts` (à faire)

Le fichier `build.gradle.kts` doit être modifié pour utiliser `key.properties` si présent.

Actuellement, il utilise la clé de debug. Pour la production, voir la section suivante.

#### 4. Build l'APK Signé

```bash
flutter build apk --release
```

L'APK sera automatiquement signé avec votre clé si `key.properties` est configuré.

---

## 📦 Distribution de l'APK

### 1. Installation Directe sur Appareil

#### Via USB (ADB)

```bash
# Connecter l'appareil via USB
adb devices  # Vérifier que l'appareil est détecté

# Installer l'APK
adb install build/app/outputs/flutter-apk/app-release.apk
```

#### Via Transfert Manuel

1. **Transférer l'APK** sur l'appareil (email, cloud, USB, etc.)
2. **Activer "Sources inconnues"** :
   - Paramètres → Sécurité → Installer des applications inconnues
   - Autoriser depuis la source utilisée
3. **Installer** : Ouvrir le fichier APK et suivre les instructions

### 2. Distribution via Google Play Store

1. **Générer un Bundle AAB** :
   ```bash
   flutter build appbundle --release
   ```

2. **Créer un compte développeur Google Play** ($25 USD unique)

3. **Uploader le `.aab`** sur Google Play Console

4. **Remplir les informations** :
   - Titre : SUPFile
   - Description courte/longue
   - Icônes, captures d'écran
   - Catégorie, etc.

5. **Soumettre pour révision**

### 3. Distribution Alternative (F-Droid, etc.)

Les APK peuvent être distribués via :
- **F-Droid** (store open-source)
- **Votre propre site web**
- **GitHub Releases** (pour versions bêta)

---

## ✅ Vérification de l'APK

### 1. Vérifier la Taille

```powershell
# Windows PowerShell
$apk = Get-Item "build/app/outputs/flutter-apk/app-release.apk"
$sizeMB = [math]::Round($apk.Length / 1MB, 2)
Write-Host "Taille APK: $sizeMB MB"
```

**Tailles typiques** :
- Debug : ~50-80 MB
- Release (split) : ~20-25 MB par ABI
- Release (universel) : ~50-60 MB

### 2. Vérifier les Informations

```bash
# Sur Windows (avec Android SDK)
aapt dump badging build/app/outputs/flutter-apk/app-release.apk
```

Informations affichées :
- Package name : `com.example.supfile_mobile`
- Version : `1.0.0` (build `1`)
- Permissions requises
- Min SDK, Target SDK

### 3. Tester l'Installation

```bash
# Installer sur appareil connecté
adb install -r build/app/outputs/flutter-apk/app-release.apk

# Vérifier que l'app démarre
adb shell am start -n com.example.supfile_mobile/.MainActivity
```

### 4. Vérifier la Signature

```bash
# Vérifier le signataire de l'APK
jarsigner -verify -verbose -certs build/app/outputs/flutter-apk/app-release.apk
```

---

## 🔧 Dépannage

### Erreur : "Gradle build failed"

**Solution** :
```bash
cd mobile-app
flutter clean
flutter pub get
cd android
./gradlew clean  # Linux/Mac
# Ou gradlew.bat clean  # Windows
cd ..
flutter build apk --release
```

### Erreur : "SDK not found"

**Solution** :
1. Installer Android Studio
2. Configurer `ANDROID_HOME` :
   ```powershell
   # Windows PowerShell
   $env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
   [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $env:ANDROID_HOME, 'User')
   ```
3. Vérifier : `flutter doctor`

### Erreur : "Keystore not found"

**Solution** :
- Vérifier que `key.properties` existe dans `mobile-app/android/`
- Vérifier le chemin `storeFile` dans `key.properties`
- Vérifier que le fichier `.jks` existe

### APK trop volumineux

**Solutions** :
- Utiliser `--split-per-abi` pour générer des APK séparés
- Configurer ProGuard/R8 pour la minification (dans `build.gradle.kts`)
- Vérifier les assets/images non compressés

### L'app crash au démarrage

**Vérifications** :
- Tester sur un appareil physique (pas seulement émulateur)
- Vérifier les logs : `adb logcat | grep flutter`
- Vérifier les permissions dans `AndroidManifest.xml`
- Vérifier la configuration de l'API backend

---

## 📝 Checklist Finale avant Déploiement

- [ ] Flutter doctor : Tous les composants ✅
- [ ] Version mise à jour dans `pubspec.yaml`
- [ ] Nom de l'app correct ("SUPFile")
- [ ] Icônes personnalisées (optionnel mais recommandé)
- [ ] APK testé sur appareil physique
- [ ] Tous les fonctionnalités testées
- [ ] Configuration backend correcte (URL API)
- [ ] Keystore de production créé et sécurisé (si distribution publique)
- [ ] `.gitignore` configuré (key.properties, .jks)
- [ ] Documentation à jour

---

## 🎯 Informations de l'Application

- **Nom** : SUPFile
- **Package ID** : `com.example.supfile_mobile`
- **Version actuelle** : `1.0.0+1`
- **Min SDK** : 21 (Android 5.0 Lollipop)
- **Target SDK** : Automatique (dernière version Flutter)

---

## 📚 Ressources

- [Documentation Flutter - Build APK](https://docs.flutter.dev/deployment/android)
- [Google Play Console](https://play.google.com/console)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)

---

**Date de création** : Janvier 2025  
**Dernière mise à jour** : Janvier 2025