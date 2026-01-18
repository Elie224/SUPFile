# 🔧 Résolution : Problème OneDrive avec Gradle

## 🚨 Problème Identifié

**Erreur** : `java.io.IOException: L'opération de cloud n'est pas valide`

**Cause** : Le projet est dans un dossier OneDrive (`C:\Users\KOURO\OneDrive\Desktop\SUPFile`), et OneDrive synchronise les fichiers pendant que Gradle essaie d'écrire dans le cache `.gradle`, ce qui cause des conflits.

---

## ✅ Solutions

### Solution 1 : Exclure les dossiers Gradle de OneDrive (Recommandé)

1. **Ouvrir les paramètres OneDrive**
   - Clic droit sur l'icône OneDrive dans la barre des tâches
   - Paramètres → Compte → Gérer la sauvegarde

2. **Exclure les dossiers suivants** :
   - `SUPFile\mobile-app\.gradle`
   - `SUPFile\mobile-app\build`
   - `SUPFile\mobile-app\.dart_tool`
   - `SUPFile\mobile-app\android\.gradle`

3. **Ou exclure le dossier `SUPFile` entier** si vous ne voulez pas synchroniser le projet

---

### Solution 2 : Déplacer le cache Gradle hors de OneDrive

Configurer Gradle pour utiliser un cache global en dehors de OneDrive :

1. **Créer une variable d'environnement** :
   - `GRADLE_USER_HOME=C:\gradle-cache` (ou un autre chemin hors OneDrive)

2. **Ou modifier `gradle.properties`** :
   Créer/modifier `mobile-app/android/gradle.properties` :
   ```properties
   org.gradle.user.home=C:\\gradle-cache
   ```

---

### Solution 3 : Désactiver temporairement OneDrive pendant le build

**Note** : Solution temporaire uniquement

1. Pause OneDrive pendant le build
2. Lancer `flutter build apk --release`
3. Réactiver OneDrive après

---

### Solution 4 : Déplacer le projet hors de OneDrive (Meilleure solution long terme)

**Recommandation** : Déplacer `SUPFile` vers un dossier hors OneDrive, par exemple :
- `C:\Projects\SUPFile`
- `D:\Dev\SUPFile`
- `C:\Users\KOURO\Documents\SUPFile`

**Avantages** :
- ✅ Aucun conflit de synchronisation
- ✅ Build plus rapide
- ✅ Meilleure performance générale

---

## 🚀 Solution Rapide (Maintenant)

Pour générer l'APK immédiatement, vous pouvez :

1. **Configurer GRADLE_USER_HOME** (dans la session PowerShell actuelle) :
   ```powershell
   $env:GRADLE_USER_HOME = "C:\gradle-cache"
   cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app
   flutter build apk --release
   ```

2. **Ou exclure temporairement de OneDrive** :
   - Clic droit sur le dossier `mobile-app\.gradle` → OneDrive → Libérer l'espace
   - Puis relancer le build

---

## 📝 Configuration Permanente

### Option A : Variable d'environnement système

1. Ouvrir "Variables d'environnement" (Win + R → `sysdm.cpl` → Avancé)
2. Nouvelle variable utilisateur :
   - Nom : `GRADLE_USER_HOME`
   - Valeur : `C:\gradle-cache`
3. Redémarrer le terminal/PowerShell

### Option B : Fichier gradle.properties local

Créer `mobile-app/android/gradle.properties` :
```properties
# Cache Gradle hors de OneDrive
org.gradle.user.home=C:\\gradle-cache

# Performance
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true
```

---

## 🔍 Vérification

Après configuration, vérifier :

```powershell
# Vérifier la variable
echo $env:GRADLE_USER_HOME

# Vérifier que Gradle utilise le bon cache
cd mobile-app\android
.\gradlew --version
```

Le cache Gradle devrait être dans `C:\gradle-cache` au lieu de `.gradle` dans le projet.

---

## ✅ Après Configuration

Relancer le build :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app
flutter build apk --release
```

Le build devrait maintenant fonctionner sans erreurs OneDrive.

---

**Date de création** : Janvier 2025