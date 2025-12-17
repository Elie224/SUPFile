# 🔄 Rebuild de l'APK avec la Bonne Configuration

## Problème
L'application mobile ne peut pas se connecter car l'APK installé a été buildé avec une ancienne URL ou configuration.

## Solution : Rebuild l'APK

### Étape 1 : Désinstaller l'ancienne application

Sur votre téléphone Android :
1. Allez dans Paramètres > Applications
2. Trouvez "SUPFile" ou "supfile_mobile"
3. Appuyez sur "Désinstaller"

### Étape 2 : Rebuild l'APK avec la bonne URL

Dans PowerShell :
```powershell
cd C:\Users\PC\OneDrive\Bureau\SUPFile\mobile-app
flutter clean
flutter pub get
flutter build apk --release --dart-define=API_URL=http://192.168.1.28:5000
```

### Étape 3 : Installer le nouvel APK

1. Transférez le nouvel APK : `build/app/outputs/flutter-apk/app-release.apk`
2. Installez-le sur votre téléphone
3. Testez la connexion

## Alternative : Installation directe via ADB

Si votre téléphone est connecté en USB avec débogage activé :

```powershell
cd C:\Users\PC\OneDrive\Bureau\SUPFile\mobile-app
flutter build apk --release --dart-define=API_URL=http://192.168.1.28:5000
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

Le flag `-r` remplace l'ancienne installation.




