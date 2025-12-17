# SUPFile Mobile Application (Flutter)

Application mobile développée avec Flutter pour SUPFile.

## 📋 Prérequis

### 1. Installer Flutter SDK

**Windows** :
1. Télécharger Flutter SDK depuis : https://docs.flutter.dev/get-started/install/windows
2. Extraire dans `C:\src\flutter` (ou autre emplacement)
3. Ajouter `C:\src\flutter\bin` au PATH système
4. Redémarrer le terminal

**Vérifier l'installation** :
```bash
flutter doctor
```

### 2. Installer les dépendances

```bash
cd mobile-app
flutter pub get
```

### 3. Configuration

Créer un fichier `.env` à la racine de `mobile-app/` :

```env
API_URL=http://localhost:5000
```

**Note** : Pour tester sur un appareil physique, remplacer `localhost` par l'IP de votre machine :
```env
API_URL=http://192.168.1.X:5000
```

## 🚀 Commandes disponibles

```bash
# Vérifier la configuration
flutter doctor

# Installer les dépendances
flutter pub get

# Démarrer en développement
flutter run

# Démarrer sur un appareil spécifique
flutter run -d <device-id>

# Lister les appareils disponibles
flutter devices

# Build pour Android
flutter build apk

# Build pour iOS (macOS uniquement)
flutter build ios

# Build pour Web
flutter build web
```

## 📱 Tester sur un appareil physique

### Android :
1. Activer le mode développeur sur votre téléphone
2. Activer le débogage USB
3. Connecter le téléphone via USB
4. Exécuter : `flutter run`

### iOS (macOS uniquement) :
1. Ouvrir Xcode
2. Connecter votre iPhone
3. Faire confiance à l'ordinateur sur l'iPhone
4. Exécuter : `flutter run`

## 🏗️ Structure du projet

```
lib/
├── main.dart                 # Point d'entrée
├── models/                   # Modèles de données
│   ├── user.dart
│   ├── file.dart
│   └── folder.dart
├── providers/                # Gestion d'état (Provider)
│   ├── auth_provider.dart
│   ├── files_provider.dart
│   └── language_provider.dart
├── screens/                  # Pages de l'application
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── signup_screen.dart
│   ├── dashboard/
│   │   └── dashboard_screen.dart
│   ├── files/
│   │   ├── files_screen.dart
│   │   └── preview_screen.dart
│   ├── search/
│   │   └── search_screen.dart
│   ├── settings/
│   │   └── settings_screen.dart
│   └── trash/
│       └── trash_screen.dart
├── services/                 # Appels API
│   └── api_service.dart
├── routes/                   # Navigation
│   └── app_router.dart
└── utils/                    # Utilitaires
    └── constants.dart
```

## 📋 Fonctionnalités à implémenter

- [x] Structure de base
- [x] Authentification (Login/Signup)
- [x] Navigation
- [x] Dashboard
- [ ] Upload de fichiers
- [ ] Prévisualisation complète
- [ ] Partage
- [ ] Recherche
- [ ] Paramètres complets
- [ ] Corbeille

## 🔗 Liens utiles

- [Documentation Flutter](https://docs.flutter.dev/)
- [API Backend SUPFile](../docs/API.md)
