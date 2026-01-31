# Fonctionnement hors ligne complet - SUPFile

## 🎯 Objectif

L'application SUPFile fonctionne **entièrement hors ligne** après une première synchronisation en ligne. Toutes les fonctionnalités sont disponibles sans connexion Internet.

## ✨ Fonctionnalités hors ligne

### Ce qui fonctionne sans Internet

✅ **Navigation complète** - Toutes les pages de l'application  
✅ **Consultation des fichiers** - Liste, recherche, aperçu  
✅ **Upload de fichiers** - Sauvegardés localement, synchronisés plus tard  
✅ **Création de dossiers** - Créés localement, synchronisés plus tard  
✅ **Suppression** - Fichiers et dossiers supprimés localement  
✅ **Renommage** - Fichiers et dossiers renommés localement  
✅ **Déplacement** - Fichiers et dossiers déplacés localement  
✅ **Téléchargement** - Fichiers déjà en cache (< 10 MB)  
✅ **Paramètres** - Thème, préférences, profil (stockés localement)  
✅ **Authentification** - Session maintenue localement  

### Synchronisation automatique

🔄 **Au retour en ligne** : Toutes les opérations effectuées hors ligne sont automatiquement synchronisées avec le serveur.

## 🏗️ Architecture technique

### 1. IndexedDB - Stockage local

**Base de données** : `SUPFileOfflineDB`

**Stores** :
- `files` - Métadonnées des fichiers (id, name, size, folder_id, etc.)
- `folders` - Métadonnées des dossiers (id, name, parent_id, etc.)
- `fileContents` - Contenu des fichiers (Blob) pour fichiers < 10 MB
- `pendingOperations` - Queue d'opérations en attente de synchronisation
- `userMeta` - Métadonnées utilisateur (lastSyncDate, etc.)

### 2. Service Worker - Cache des assets

**Fichier** : `public/sw-fallback.js` (fallback) ou généré par `vite-plugin-pwa`

**Stratégie** :
- **App shell** : Précaché (HTML, JS, CSS, images)
- **API** : Pas de cache (toujours réseau)
- **Navigation** : Fallback sur index.html si hors ligne

### 3. Services offline-first

**`offlineDB.js`** :
- Gestion de la base IndexedDB
- CRUD sur files, folders, fileContents, pendingOperations

**`syncService.js`** :
- Synchronisation bidirectionnelle (serveur ↔ local)
- Exécution des opérations en attente
- Gestion des événements de sync

**`offlineFileService.js`** :
- Wrapper autour de `fileService` et `folderService`
- Détection automatique du mode (online/offline)
- Utilise le cache local quand hors ligne
- Ajoute les opérations à la queue quand hors ligne

### 4. Composants UI

**`OfflineBanner`** : Bannière en haut de l'écran quand hors ligne  
**`SyncIndicator`** : Indicateur en bas à droite avec :
- État de la connexion (vert = en ligne, orange = hors ligne)
- Nombre d'opérations en attente
- Bouton de synchronisation manuelle
- Animation pendant la sync

## 🔄 Flux de synchronisation

### Première visite (en ligne)

1. L'utilisateur se connecte
2. L'application télécharge les métadonnées de tous les fichiers et dossiers
3. Les fichiers < 10 MB sont téléchargés et mis en cache
4. Les assets (JS, CSS, HTML) sont mis en cache par le Service Worker

### Utilisation hors ligne

1. L'utilisateur ouvre l'application (chargée depuis le cache)
2. Les fichiers et dossiers sont chargés depuis IndexedDB
3. Les opérations (upload, delete, rename, etc.) sont effectuées localement
4. Chaque opération est ajoutée à la queue `pendingOperations`

### Retour en ligne

1. Détection automatique du retour en ligne
2. Synchronisation automatique déclenchée
3. Toutes les opérations en attente sont exécutées dans l'ordre
4. Les données du serveur sont re-téléchargées
5. Le cache local est mis à jour

## 📱 Utilisation

### Pour l'utilisateur

1. **Première connexion** : Se connecter avec Internet pour synchroniser les données
2. **Travailler hors ligne** : Toutes les fonctionnalités marchent normalement
3. **Synchronisation** : 
   - Automatique au retour en ligne
   - Manuelle via le bouton "Sync" dans Files ou l'indicateur en bas à droite
4. **Indicateurs visuels** :
   - Bannière orange en haut : "Vous êtes hors ligne"
   - Indicateur en bas à droite : nombre d'opérations en attente
   - Toast : "📦 [Opération] sera synchronisé en ligne"

### Opérations en attente

Quand hors ligne, les opérations sont mises en queue :
- Upload de fichiers
- Création de dossiers
- Suppression de fichiers/dossiers
- Renommage
- Déplacement

Au retour en ligne, elles sont exécutées automatiquement dans l'ordre.

## 🔧 Installation

```bash
cd frontend-web

# Installer les dépendances (optionnel : vite-plugin-pwa pour precache optimisé)
npm install vite-plugin-pwa --save-dev

# Build
npm run build
```

## 🧪 Test du mode hors ligne

### Test manuel

1. Ouvrir l'application et se connecter
2. Naviguer dans Files, créer des dossiers, uploader des fichiers
3. Dans DevTools (F12) : Network → cocher **Offline**
4. Recharger la page → l'app se charge depuis le cache
5. Créer un dossier, uploader un fichier → opérations ajoutées à la queue
6. Vérifier l'indicateur en bas à droite : "2 opérations en attente"
7. Décocher **Offline** → synchronisation automatique
8. Vérifier que les opérations ont été exécutées sur le serveur

### Vérifier IndexedDB

Dans DevTools (F12) : Application → Storage → IndexedDB → `SUPFileOfflineDB`
- Voir les stores : files, folders, fileContents, pendingOperations
- Vérifier que les données sont bien stockées

## 📊 Limites et considérations

### Taille du cache

- **Fichiers** : Seuls les fichiers < 10 MB sont mis en cache automatiquement
- **Quota IndexedDB** : Varie selon le navigateur (généralement plusieurs GB)
- **Service Worker** : Cache les assets (JS, CSS, HTML) - quelques MB

### Conflits

Si deux utilisateurs modifient le même fichier hors ligne :
- Le dernier à synchroniser écrase les modifications précédentes
- Pas de résolution de conflits automatique (à implémenter si nécessaire)

### Sécurité

- Les données sont stockées en clair dans IndexedDB (chiffrement du navigateur)
- Le token JWT est stocké dans localStorage (déjà le cas)
- Pas de chiffrement supplémentaire côté client

## 🐛 Dépannage

### "Erreur lors de l'ouverture de la base de données"

- Vérifier que IndexedDB est supporté (tous les navigateurs modernes)
- Vider le cache et recharger
- Vérifier le quota de stockage disponible

### "Les opérations ne se synchronisent pas"

- Vérifier la connexion Internet
- Cliquer manuellement sur le bouton "Sync" dans Files
- Ouvrir la console (F12) pour voir les logs de synchronisation

### "Fichier non disponible hors ligne"

- Seuls les fichiers < 10 MB sont mis en cache automatiquement
- Les fichiers plus gros nécessitent une connexion pour être téléchargés
- Solution : augmenter la limite dans `syncService.js` (ligne ~60)

## 📚 Fichiers concernés

### Services
- `src/services/offlineDB.js` - Gestion IndexedDB
- `src/services/syncService.js` - Synchronisation bidirectionnelle
- `src/services/offlineFileService.js` - Wrapper offline-first pour les fichiers

### Composants
- `src/components/SyncIndicator.jsx` - Indicateur de sync
- `src/components/OfflineBanner.jsx` - Bannière hors ligne

### Configuration
- `vite.config.js` - Configuration PWA (vite-plugin-pwa)
- `public/sw-fallback.js` - Service Worker de secours
- `public/manifest.json` - Manifeste PWA

### Pages
- `src/pages/Offline.jsx` - Page explicative mode hors ligne
- `src/pages/Files.jsx` - Utilise offlineFileService

## 🚀 Améliorations futures possibles

1. **Résolution de conflits** : Détecter et résoudre les conflits de modification
2. **Synchronisation sélective** : Choisir quels dossiers synchroniser
3. **Compression** : Compresser les fichiers avant stockage local
4. **Chiffrement** : Chiffrer les données dans IndexedDB
5. **Background Sync API** : Synchroniser en arrière-plan même quand l'app est fermée
6. **Partage hors ligne** : Permettre le partage de fichiers via Bluetooth ou NFC
