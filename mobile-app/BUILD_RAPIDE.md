# ⚡ Build APK Rapide - SUPFile

## 🚀 Commande Rapide

```powershell
$env:GRADLE_USER_HOME = "C:\gradle-cache"
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app
flutter build apk --release --split-per-abi
```

**Avantages `--split-per-abi`** :
- ✅ 3 APK plus petits (~20-25 MB chacun au lieu de ~60 MB)
- ✅ Build légèrement plus rapide
- ✅ Installation plus rapide sur appareil
- ✅ Utilisez `app-arm64-v8a-release.apk` pour la plupart des appareils modernes

---

## ⏱️ Temps de Build

**Premier build** : 5-15 minutes (téléchargement des dépendances Gradle)  
**Builds suivants** : 2-5 minutes (avec cache)

**Le build actuel prend du temps car c'est la première fois avec `GRADLE_USER_HOME` configuré.**

---

## 🎯 Une Fois Terminé

L'APK sera dans : `mobile-app/build/app/outputs/flutter-apk/`

- `app-arm64-v8a-release.apk` ⭐ (utiliser celui-ci)
- `app-armeabi-v7a-release.apk`
- `app-x86_64-release.apk`

---

## ✅ Prochaines Fois

Le cache Gradle sera dans `C:\gradle-cache`, donc les builds suivants seront **beaucoup plus rapides** (2-5 minutes).

**Commande** :
```powershell
$env:GRADLE_USER_HOME = "C:\gradle-cache"
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app
flutter build apk --release --split-per-abi
```

---

## 💡 Alternative : Build Debug (Plus Rapide pour Tests)

Pour tester rapidement sans optimisations :
```powershell
flutter build apk --debug
```
**Temps** : 1-2 minutes

---

**Note** : Le premier build avec le nouveau cache Gradle prend toujours du temps. Les builds suivants seront beaucoup plus rapides !