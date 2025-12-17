# Préparation pour le Développement de l'Application Mobile SUPFile

## 📋 Checklist Préalable

### 1. Choix de la Technologie Mobile

#### Option 1 : React Native (Recommandé)
**Avantages** :
- ✅ Partage de code avec React (web)
- ✅ Développement cross-platform (iOS + Android)
- ✅ Grande communauté et documentation
- ✅ Compatible avec Expo (développement rapide)

**Prérequis** :
- Node.js installé
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app sur smartphone (pour tester)

#### Option 2 : Flutter
**Avantages** :
- ✅ Performance native
- ✅ UI moderne et fluide
- ✅ Un seul codebase pour iOS et Android

**Prérequis** :
- Flutter SDK installé
- Android Studio / Xcode

#### Option 3 : Expo (React Native simplifié) ⭐ RECOMMANDÉ
**Avantages** :
- ✅ Développement très rapide
- ✅ Pas besoin de configurer Android Studio/Xcode au début
- ✅ Hot reload
- ✅ Accès facile aux APIs natives

**Prérequis** :
- Node.js installé
- Expo CLI (`npm install -g expo-cli` ou `npx create-expo-app`)
- Expo Go app sur smartphone

### 2. Structure du Projet

#### Structure recommandée :
```
SUPFile/
├── backend/          (déjà existant)
├── frontend-web/     (déjà existant)
├── mobile-app/       (à créer)
│   ├── src/
│   │   ├── screens/      (pages de l'app)
│   │   ├── components/   (composants réutilisables)
│   │   ├── services/     (appels API)
│   │   ├── navigation/   (routing)
│   │   ├── contexts/     (état global)
│   │   ├── utils/        (utilitaires)
│   │   └── assets/        (images, fonts)
│   ├── app.json          (config Expo)
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

### 3. Prérequis Techniques

#### A. Outils à installer

1. **Node.js** (déjà installé si vous avez développé le web)
   ```bash
   node --version  # Vérifier la version (>= 16 recommandé)
   ```

2. **Expo CLI** (si choix Expo/React Native)
   ```bash
   npm install -g expo-cli
   # ou utiliser npx (pas besoin d'installer globalement)
   ```

3. **Android Studio** (pour tester sur Android)
   - Télécharger depuis : https://developer.android.com/studio
   - Installer Android SDK et émulateur

4. **Xcode** (pour tester sur iOS - macOS uniquement)
   - Disponible sur Mac App Store
   - Nécessaire uniquement si vous développez sur Mac

5. **Expo Go** (application mobile pour tester)
   - iOS : App Store
   - Android : Google Play Store

#### B. Configuration de l'API Backend

Vérifier que l'API backend est accessible depuis le mobile :
- ✅ CORS configuré pour accepter les requêtes depuis le mobile
- ✅ URL de l'API configurable (dev/prod)
- ✅ Endpoints API documentés

**À vérifier dans `backend/config.js`** :
```javascript
cors: {
  origin: function (origin, callback) {
    // Ajouter les origines mobile si nécessaire
    const allowedOrigins = [
      'http://localhost:3000',
      'exp://localhost:19000',  // Expo dev server
      // Ajouter d'autres origines si nécessaire
    ];
    // ...
  }
}
```

### 4. Fonctionnalités à Implémenter

#### Liste complète (identique au web) :

**2.2.1 - Connexion & Identité**
- [ ] Inscription avec email/mot de passe
- [ ] Connexion sécurisée
- [ ] OAuth2 (Google, GitHub)
- [ ] Accès aux liens de partage publics

**2.2.2 - Gestionnaire de fichiers**
- [ ] Navigation dans l'arborescence
- [ ] Breadcrumbs (fil d'Ariane)
- [ ] Création de dossiers
- [ ] Upload de fichiers avec barre de progression
- [ ] Drag & Drop (si supporté par la plateforme)
- [ ] Renommage
- [ ] Déplacement
- [ ] Suppression (corbeille)
- [ ] Téléchargement de fichiers
- [ ] Téléchargement de dossiers (ZIP)

**2.2.3 - Prévisualisation & Média**
- [ ] Prévisualisation des images
- [ ] Prévisualisation des PDF
- [ ] Prévisualisation des fichiers texte
- [ ] Streaming audio
- [ ] Streaming vidéo
- [ ] Galerie d'images
- [ ] Détails techniques

**2.2.4 - Partage & Collaboration**
- [ ] Génération de liens publics
- [ ] Partage avec mot de passe
- [ ] Partage avec date d'expiration
- [ ] Partage interne entre utilisateurs

**2.2.5 - Recherche & Filtres**
- [ ] Recherche par nom/extension
- [ ] Filtrage par type
- [ ] Filtrage par date

**2.2.6 - Dashboard & Activité**
- [ ] Visualisation du quota
- [ ] Graphique de répartition
- [ ] Fichiers récents

**2.2.7 - Paramètres**
- [ ] Modification du profil (avatar, email)
- [ ] Changement de mot de passe
- [ ] Préférences (langue, notifications)
- [ ] Thème (clair/sombre) - optionnel

### 5. Bibliothèques Recommandées

#### Pour React Native / Expo :

**Navigation** :
```json
"@react-navigation/native": "^6.x",
"@react-navigation/stack": "^6.x",
"@react-navigation/bottom-tabs": "^6.x"
```

**État global** :
```json
"zustand": "^4.x"  // Déjà utilisé dans le web
```

**Appels API** :
```json
"axios": "^1.x"  // Déjà utilisé dans le web
```

**UI Components** :
```json
"react-native-paper": "^5.x"  // Material Design
// ou
"react-native-elements": "^3.x"  // UI components
// ou
"@rneui/themed": "^4.x"
```

**Upload de fichiers** :
```json
"expo-image-picker": "~14.x",  // Pour sélectionner des fichiers
"expo-document-picker": "~11.x"  // Pour sélectionner des documents
```

**Stockage local** :
```json
"@react-native-async-storage/async-storage": "^1.x"
```

**Prévisualisation** :
```json
"react-native-pdf": "^6.x",  // Pour PDF
"react-native-video": "^5.x",  // Pour vidéo
"expo-av": "~13.x"  // Pour audio/vidéo (Expo)
```

**Graphiques** :
```json
"react-native-chart-kit": "^6.x"
// ou
"victory-native": "^36.x"
```

**Internationalisation** :
```json
"i18next": "^23.x",
"react-i18next": "^13.x"
```

### 6. Configuration Docker

#### Dockerfile pour l'app mobile (Expo) :

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Installer Expo CLI
RUN npm install -g expo-cli

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Exposer les ports Expo
EXPOSE 19000 19001 19002

# Démarrer Expo
CMD ["expo", "start", "--tunnel"]
```

#### Mise à jour de docker-compose.yml :

Le service mobile est déjà présent dans votre `docker-compose.yml` :
```yaml
mobile:
  build:
    context: ./mobile-app
    dockerfile: Dockerfile
  container_name: supfile-mobile
  environment:
    EXPO_PUBLIC_API_URL: ${VITE_API_URL}
  ports:
    - "19000:19000"
    - "19001:19001"
  volumes:
    - ./mobile-app/src:/app/src
    - /app/node_modules
  networks:
    - supfile-network
  restart: unless-stopped
```

### 7. Configuration de l'Environnement

#### Variables d'environnement pour le mobile :

Créer `mobile-app/.env` :
```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

**Note** : Avec Expo, les variables doivent commencer par `EXPO_PUBLIC_` pour être accessibles côté client.

### 8. Plan de Développement Recommandé

#### Phase 1 : Setup Initial (Jour 1)
1. ✅ Créer le projet Expo
2. ✅ Configurer la structure de dossiers
3. ✅ Installer les dépendances de base
4. ✅ Configurer la navigation
5. ✅ Configurer les appels API
6. ✅ Tester la connexion à l'API backend

#### Phase 2 : Authentification (Jour 2-3)
1. ✅ Page de connexion
2. ✅ Page d'inscription
3. ✅ OAuth (Google, GitHub)
4. ✅ Gestion des tokens JWT
5. ✅ Stockage local des tokens

#### Phase 3 : Navigation & Fichiers (Jour 4-6)
1. ✅ Page Dashboard
2. ✅ Page de navigation des fichiers
3. ✅ Upload de fichiers
4. ✅ Création de dossiers
5. ✅ Actions sur fichiers (renommer, déplacer, supprimer)

#### Phase 4 : Prévisualisation & Partage (Jour 7-8)
1. ✅ Prévisualisation des fichiers
2. ✅ Partage de fichiers/dossiers
3. ✅ Accès aux liens de partage

#### Phase 5 : Recherche & Paramètres (Jour 9-10)
1. ✅ Page de recherche
2. ✅ Page de paramètres
3. ✅ Corbeille

#### Phase 6 : Polish & Tests (Jour 11-12)
1. ✅ Amélioration de l'UI/UX
2. ✅ Tests sur différents appareils
3. ✅ Correction des bugs
4. ✅ Optimisation des performances

### 9. Points d'Attention Spécifiques au Mobile

#### A. Permissions
- 📷 Accès à la caméra (pour prendre des photos)
- 📁 Accès aux fichiers (pour sélectionner des fichiers)
- 📍 Accès à la localisation (si nécessaire)

#### B. Performance
- ⚡ Optimiser les images (compression, lazy loading)
- ⚡ Pagination pour les listes longues
- ⚡ Cache des données fréquemment utilisées

#### C. UX Mobile
- 📱 Design adaptatif (portrait/paysage)
- 📱 Gestes natifs (swipe, pull-to-refresh)
- 📱 Feedback visuel (loading, erreurs)
- 📱 Navigation intuitive (tabs, stack)

#### D. Synchronisation
- 🔄 Gestion de la connexion réseau
- 🔄 Mode hors ligne (si nécessaire)
- 🔄 Synchronisation des données

### 10. Commandes Utiles

#### Créer le projet Expo :
```bash
cd C:\Users\PC\OneDrive\Bureau\SUPFile
npx create-expo-app mobile-app
cd mobile-app
```

#### Démarrer en développement :
```bash
npm start
# ou
expo start
```

#### Tester sur appareil physique :
```bash
expo start
# Scanner le QR code avec Expo Go
```

#### Build pour production :
```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

### 11. Documentation à Créer

1. **README.md** pour le mobile
   - Instructions d'installation
   - Configuration
   - Commandes utiles

2. **ARCHITECTURE.md**
   - Structure du projet
   - Flux de navigation
   - Architecture des composants

3. **API.md**
   - Endpoints utilisés
   - Format des réponses
   - Gestion des erreurs

### 12. Checklist Avant de Commencer

- [ ] Node.js installé et à jour
- [ ] Expo CLI installé (ou utiliser npx)
- [ ] Expo Go installé sur smartphone
- [ ] Backend API fonctionnel et accessible
- [ ] CORS configuré pour accepter les requêtes mobile
- [ ] Structure de dossiers créée
- [ ] Variables d'environnement configurées
- [ ] Docker Compose mis à jour (déjà fait)
- [ ] Plan de développement établi

---

## 🚀 Prochaines Étapes

Une fois tous ces prérequis vérifiés, vous pouvez :

1. **Créer le projet Expo** :
   ```bash
   npx create-expo-app mobile-app --template blank
   ```

2. **Configurer la structure de base**

3. **Implémenter l'authentification en premier**

4. **Développer les fonctionnalités une par une**

---

**Besoin d'aide ?** Dites-moi quand vous êtes prêt et je vous aiderai à créer la structure initiale et à implémenter les premières fonctionnalités !





