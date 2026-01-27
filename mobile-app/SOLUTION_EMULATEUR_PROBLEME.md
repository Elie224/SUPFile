# 🐛 Problème Émulateur Android - Solutions

## ❌ Problème Identifié

L'émulateur Android ne démarre pas correctement :
- **Erreur** : "The Android emulator exited with code 1 during startup"
- **Message** : "Address these issues and try again."

## ✅ Solutions Alternatives

### Option 1 : Utiliser un Téléphone Physique (RECOMMANDÉ)

**Avantages** :
- ✅ Plus rapide et fiable
- ✅ Test en conditions réelles
- ✅ Pas de problèmes d'émulateur

**Étapes** :

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
   Vous devriez voir votre téléphone dans la liste

5. **Lancer l'application** :
   ```powershell
   cd mobile-app
   flutter run
   ```

6. **Tester Google OAuth** :
   - L'application s'ouvre sur votre téléphone
   - Cliquer sur "Continuer avec Google"
   - Tester la connexion

---

### Option 2 : Générer un APK et Installer sur Téléphone

**Avantages** :
- ✅ Pas besoin de connexion USB continue
- ✅ Peut être testé plusieurs fois facilement

**Étapes** :

1. **Générer un APK debug** :
   ```powershell
   cd mobile-app
   flutter build apk --debug
   ```

2. **Trouver l'APK** :
   - Fichier : `build/app/outputs/flutter-apk/app-debug.apk`

3. **Transférer sur votre téléphone** :
   - Via USB, email, cloud, etc.

4. **Installer l'APK** :
   - Ouvrir le gestionnaire de fichiers
   - Taper sur `app-debug.apk`
   - Autoriser l'installation depuis "Sources inconnues"

5. **Tester Google OAuth** :
   - Ouvrir l'application SUPFile
   - Cliquer sur "Continuer avec Google"
   - Tester la connexion

---

### Option 3 : Lancer l'Émulateur depuis Android Studio

**Étapes** :

1. **Ouvrir Android Studio**

2. **Ouvrir Device Manager** :
   - Tools → Device Manager
   - Ou clic droit sur l'icône de l'émulateur

3. **Lancer l'émulateur** :
   - Trouver "Medium Phone API 36.1"
   - Cliquer sur le bouton "Play" (▶️)

4. **Attendre le démarrage** (30-60 secondes)

5. **Vérifier l'état** :
   ```powershell
   flutter devices
   ```

6. **Lancer l'application** :
   ```powershell
   flutter run -d emulator-5554
   ```

---

### Option 4 : Diagnostic et Réparation de l'Émulateur

**Vérifier les logs** :
```powershell
# Chercher les logs de l'émulateur
# Peut nécessiter Android Studio pour voir les erreurs détaillées
```

**Réinitialiser l'émulateur** :
- Android Studio → Device Manager
- Cliquer sur "Edit" (icône crayon) sur l'émulateur
- Vérifier les paramètres (RAM, stockage, etc.)
- "Cold Boot Now" pour redémarrer proprement

**Vérifier les prérequis** :
- RAM suffisante (minimum 4 GB)
- CPU avec virtualisation activée
- Espace disque suffisant (minimum 2 GB)

---

## 🎯 Recommandation

**Pour tester Google OAuth rapidement** : Utiliser **Option 1 (Téléphone Physique)** ou **Option 2 (APK)**.

Ces options sont plus rapides et fiables que de dépanner l'émulateur.

---

**Date** : Janvier 2025
