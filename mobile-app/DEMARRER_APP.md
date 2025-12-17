# 🚀 Guide de Démarrage - Application Mobile SUPFile

## ✅ Vérifications préalables

1. **Flutter installé** : `flutter doctor` doit afficher au moins Android toolchain ✓
2. **Android Studio installé** : Pour le développement Android
3. **Backend démarré** : Le serveur backend doit être en cours d'exécution sur le port 5000

## 📱 Configuration de l'URL de l'API

L'application mobile utilise une variable d'environnement pour l'URL de l'API. Par défaut, elle utilise `http://localhost:5000`.

### Pour tester sur un émulateur Android :

```powershell
cd mobile-app
flutter run --dart-define=API_URL=http://10.0.2.2:5000
```

**Note** : `10.0.2.2` est l'adresse IP spéciale qui correspond à `localhost` de votre machine hôte depuis l'émulateur Android.

### Pour tester sur un appareil physique Android :

1. **Trouver l'IP de votre machine** :
```powershell
ipconfig
```
Cherchez l'adresse IPv4 de votre carte réseau (ex: `192.168.1.100`)

2. **S'assurer que le backend accepte les connexions depuis votre réseau local** :
   - Vérifiez que le backend écoute sur `0.0.0.0:5000` et non seulement `localhost:5000`
   - Vérifiez le pare-feu Windows pour autoriser le port 5000

3. **Lancer l'application avec l'IP de votre machine** :
```powershell
cd mobile-app
flutter run --dart-define=API_URL=http://192.168.1.100:5000
```
(Remplacez `192.168.1.100` par votre IP réelle)

### Pour tester sur Chrome (Web) :

```powershell
cd mobile-app
flutter run -d chrome --dart-define=API_URL=http://localhost:5000
```

## 🏃 Démarrer l'application

### 1. Installer les dépendances (si pas déjà fait)

```powershell
cd mobile-app
flutter pub get
```

### 2. Vérifier les appareils disponibles

```powershell
flutter devices
```

Vous devriez voir :
- Windows (desktop)
- Chrome (web)
- Edge (web)
- Un émulateur Android (si configuré)
- Votre appareil Android (si connecté via USB avec débogage activé)

### 3. Lancer l'application

**Sur un émulateur Android** :
```powershell
flutter run --dart-define=API_URL=http://10.0.2.2:5000
```

**Sur un appareil physique Android** :
```powershell
flutter run --dart-define=API_URL=http://VOTRE_IP:5000
```

**Sur Chrome** :
```powershell
flutter run -d chrome --dart-define=API_URL=http://localhost:5000
```

## 🔧 Configuration du Backend pour l'accès mobile

Pour que l'application mobile puisse se connecter au backend depuis un appareil physique, vous devez :

1. **Modifier le backend pour écouter sur toutes les interfaces** :
   - Vérifiez que le backend écoute sur `0.0.0.0:5000` et non `localhost:5000`
   - Dans `backend/app.js` ou votre fichier de démarrage, utilisez :
   ```javascript
   app.listen(5000, '0.0.0.0', () => {
     console.log('Server running on http://0.0.0.0:5000');
   });
   ```

2. **Configurer CORS** :
   - Le backend doit autoriser les requêtes depuis l'application mobile
   - Vérifiez que CORS est configuré pour accepter les requêtes depuis n'importe quelle origine (pour le développement)

3. **Vérifier le pare-feu** :
   - Autorisez le port 5000 dans le pare-feu Windows
   - Paramètres Windows > Pare-feu Windows Defender > Paramètres avancés > Règles de trafic entrant > Nouvelle règle

## 📝 Première utilisation

1. **Lancer l'application** avec la commande appropriée ci-dessus
2. **Créer un compte** : Cliquez sur "Inscription" et créez un compte
3. **Se connecter** : Utilisez vos identifiants pour vous connecter
4. **Explorer** : Vous pouvez maintenant naviguer dans l'application

## 🐛 Dépannage

### L'application ne peut pas se connecter au backend

1. Vérifiez que le backend est démarré : `http://localhost:5000/api/health` (ou votre endpoint de santé)
2. Vérifiez l'URL utilisée dans la commande `flutter run`
3. Vérifiez que le backend écoute sur `0.0.2.2` (émulateur) ou votre IP locale (appareil physique)
4. Vérifiez le pare-feu Windows

### Erreur "No devices found"

1. Pour Android : Activez le mode développeur et le débogage USB sur votre téléphone
2. Pour émulateur : Créez un AVD (Android Virtual Device) dans Android Studio
3. Vérifiez avec `flutter devices`

### Erreur de build

```powershell
flutter clean
flutter pub get
flutter run
```

## 📦 Build pour production

### Build APK Android

```powershell
cd mobile-app
flutter build apk --release --dart-define=API_URL=http://votre-serveur.com:5000
```

Le fichier APK sera généré dans `mobile-app/build/app/outputs/flutter-apk/app-release.apk`

### Build App Bundle (pour Google Play Store)

```powershell
flutter build appbundle --release --dart-define=API_URL=http://votre-serveur.com:5000
```

## 🔗 Ressources

- [Documentation Flutter](https://docs.flutter.dev/)
- [Flutter pour Android](https://docs.flutter.dev/get-started/install/windows)
- [API Backend SUPFile](../docs/API.md)

## ⚠️ Notes importantes

1. **Sécurité** : Pour la production, utilisez HTTPS au lieu de HTTP
2. **URL de l'API** : Configurez l'URL de l'API selon votre environnement (développement/production)
3. **Tokens** : Les tokens JWT sont stockés localement dans `SharedPreferences`
4. **État** : L'état de l'application est géré avec Provider

---

**Bon développement ! 🎉**




