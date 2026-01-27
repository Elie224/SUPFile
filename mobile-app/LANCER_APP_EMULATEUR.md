# 🚀 Lancer l'Application sur l'Émulateur

## 📱 État Actuel

- ✅ **Émulateur lancé** : `emulator-5554` (Android 16)
- ✅ **Émulateur visible** : Écran d'accueil Android affiché
- ⏳ **Application** : En cours de compilation et lancement

## 🔄 Lancer l'Application

### Commande

```powershell
cd mobile-app
flutter run -d emulator-5554
```

### Ce qui va se passer

1. **Compilation** : Flutter compile l'application (2-5 minutes la première fois)
2. **Installation** : L'application est installée sur l'émulateur
3. **Lancement** : SUPFile s'ouvre automatiquement sur l'émulateur
4. **Hot Reload** : Vous verrez les logs de compilation dans le terminal

### Après le lancement

L'application SUPFile devrait s'ouvrir automatiquement sur l'émulateur avec :

1. **Écran de connexion** : Formulaire email/password
2. **Boutons OAuth** :
   - "Continuer avec Google" 
   - "Continuer avec GitHub"
3. **Lien inscription** : "Pas encore de compte ? Inscription"

## ✅ Tester Google OAuth

Une fois l'application ouverte :

1. Cliquer sur **"Continuer avec Google"**
2. Google Sign-In s'ouvre
3. Sélectionner un compte Google
4. Vérifier la connexion réussie

## 🐛 Si l'application ne se lance pas

### Vérifier l'émulateur

```powershell
flutter devices
```

Vous devriez voir : `emulator-5554 • android-x64 • Android 16 (emulator)`

### Relancer l'application

```powershell
flutter run -d emulator-5554
```

### Nettoyer et relancer

```powershell
flutter clean
flutter pub get
flutter run -d emulator-5554
```

## 📝 Notes

- **Première compilation** : Peut prendre 5-10 minutes
- **Compilations suivantes** : Plus rapides (30 secondes - 2 minutes)
- **Logs** : Vérifier le terminal pour les erreurs éventuelles

---

**Date** : Janvier 2025
