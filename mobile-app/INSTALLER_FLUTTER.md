# 📱 Installation et Configuration de Flutter

## ❌ Problème Actuel

Flutter n'est pas reconnu dans votre terminal PowerShell. Cela signifie que :
- Flutter n'est pas installé, OU
- Flutter est installé mais n'est pas dans le PATH système

---

## 🔍 Vérifier si Flutter est Installé

### Option 1 : Vérifier dans le Terminal

```powershell
flutter --version
```

**Si ça fonctionne** : Flutter est installé et dans le PATH ✅  
**Si ça ne fonctionne pas** : Flutter n'est pas installé ou pas dans le PATH ❌

### Option 2 : Chercher Flutter Manuellement

Flutter est généralement installé dans un de ces emplacements :

- `C:\src\flutter\`
- `C:\flutter\`
- `%USERPROFILE%\flutter\` (ex: `C:\Users\KOURO\flutter\`)
- `%LOCALAPPDATA%\flutter\` (ex: `C:\Users\KOURO\AppData\Local\flutter\`)

**Cherchez le dossier `flutter`** qui contient un sous-dossier `bin` avec `flutter.bat` à l'intérieur.

---

## 📥 Installer Flutter (Si Pas Installé)

### Étape 1 : Télécharger Flutter SDK

1. **Allez sur** : https://docs.flutter.dev/get-started/install/windows
2. **Téléchargez** le SDK Flutter (fichier ZIP)
3. **Extrayez** le ZIP dans un dossier (ex: `C:\src\flutter`)

⚠️ **Important** : N'extrayez PAS dans un dossier avec des espaces ou des caractères spéciaux (comme `C:\Program Files\`)

### Étape 2 : Ajouter Flutter au PATH

1. **Ouvrez** "Variables d'environnement" :
   - Appuyez sur `Windows + R`
   - Tapez `sysdm.cpl` et appuyez sur Entrée
   - Cliquez sur l'onglet "Avancé"
   - Cliquez sur "Variables d'environnement"

2. **Dans "Variables système"**, trouvez `Path` et cliquez sur "Modifier"

3. **Cliquez sur "Nouveau"** et ajoutez le chemin vers Flutter :
   ```
   C:\src\flutter\bin
   ```
   (Remplacez par votre chemin réel si différent)

4. **Cliquez sur "OK"** pour fermer toutes les fenêtres

5. **Redémarrez** votre terminal PowerShell

### Étape 3 : Vérifier l'Installation

```powershell
flutter --version
flutter doctor
```

---

## 🔧 Configurer Flutter (Si Déjà Installé mais Pas dans le PATH)

### Option A : Ajouter au PATH (Recommandé)

Suivez les étapes 2-5 ci-dessus pour ajouter Flutter au PATH.

### Option B : Utiliser le Chemin Complet

Si vous ne voulez pas modifier le PATH, vous pouvez utiliser le chemin complet :

```powershell
# Exemple si Flutter est dans C:\src\flutter
C:\src\flutter\bin\flutter.bat build apk --release
```

### Option C : Définir FLUTTER_HOME

1. **Ouvrez** "Variables d'environnement"
2. **Dans "Variables système"**, cliquez sur "Nouveau"
3. **Nom** : `FLUTTER_HOME`
4. **Valeur** : `C:\src\flutter` (remplacez par votre chemin)
5. **Cliquez sur "OK"**
6. **Redémarrez** votre terminal

---

## ✅ Vérification Finale

Après avoir installé/configuré Flutter :

```powershell
# Vérifier la version
flutter --version

# Vérifier la configuration
flutter doctor
```

**Vous devriez voir** :
- ✅ Flutter (Channel stable, version)
- ✅ Android toolchain
- ✅ Android Studio / VS Code
- ⚠️ Connected device (optionnel pour le build APK)

---

## 🚀 Une Fois Flutter Configuré

Vous pourrez utiliser le script de build :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app
.\build-apk-release.ps1
```

---

## 🆘 Besoin d'Aide ?

Si vous avez des problèmes :
1. Vérifiez que Flutter est bien installé dans un dossier accessible
2. Vérifiez que le chemin est correct dans le PATH
3. Redémarrez complètement votre terminal après avoir modifié le PATH
4. Exécutez `flutter doctor` pour voir les problèmes de configuration
