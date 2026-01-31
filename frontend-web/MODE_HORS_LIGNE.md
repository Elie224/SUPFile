# Mode hors ligne - SUPFile

## Vue d'ensemble

L'application web SUPFile est conçue pour **fonctionner sans connexion Internet** après une première visite en ligne. L'interface, la navigation et les paramètres restent utilisables hors ligne.

## Ce qui fonctionne hors ligne

- **Navigation** : Toutes les pages déjà visitées (accueil, connexion, inscription, paramètres, etc.)
- **Interface** : Thème (clair/sombre), langue, préférences stockées localement
- **Authentification** : Session conservée dans le stockage local (Zustand persist)
- **Page dédiée** : `/offline` explique le mode hors ligne et ce qui est disponible

## Ce qui nécessite Internet

- Connexion / Inscription
- Upload et téléchargement de fichiers
- Synchronisation des données (liste des fichiers, recherche, corbeille)
- Toute requête API

## Mise en œuvre technique

### 1. Service Worker

- **Avec plugin PWA** (`vite-plugin-pwa`) : precache de tous les assets au build, mise à jour automatique.
- **Sans plugin** : Service Worker de secours (`public/sw-fallback.js`) qui met en cache la page d’accueil et les ressources au fur et à mesure des visites.

### 2. Bannière hors ligne

Le composant `OfflineBanner` affiche une bannière en haut de l’écran lorsque `navigator.onLine` est `false`, pour indiquer que l’utilisateur est hors ligne.

### 3. Détection des erreurs réseau

Le client API (`api.js`) détecte les erreurs réseau et l’état hors ligne et renvoie un message explicite (« Vous êtes hors ligne », « Connexion impossible ») pour que les pages affichent un message clair.

### 4. Données locales

- **Auth** : `auth-storage` (Zustand persist) dans `localStorage`
- **Thème** : `theme` dans `localStorage`
- **Préférences** : synchronisées avec le backend quand en ligne, lues depuis le store quand hors ligne

## Installation (optionnel, pour un precache complet)

Pour precacher tous les assets au build et améliorer le mode hors ligne :

```bash
cd frontend-web
npm install vite-plugin-pwa --save-dev
npm run build
```

Sans le plugin, l’application utilise quand même le Service Worker de secours (`sw-fallback.js`) après la première visite en ligne.

## Test du mode hors ligne

1. Ouvrir l’application en étant connecté (au moins une fois).
2. Dans les outils de développement (F12) : onglet **Network** → cocher **Offline**.
3. Recharger ou naviguer : l’interface doit se charger depuis le cache et la bannière « Vous êtes hors ligne » s’afficher.
4. Aller sur `/offline` pour voir la page explicative.

## Fichiers concernés

- `src/main.jsx` : enregistrement du Service Worker (PWA ou fallback)
- `src/components/OfflineBanner.jsx` : bannière hors ligne
- `src/pages/Offline.jsx` : page `/offline`
- `src/hooks/useOnlineStatus.js` : hook état réseau
- `src/services/api.js` : intercepteur erreurs réseau / hors ligne
- `public/sw-fallback.js` : Service Worker minimal (sans plugin PWA)
- `vite.config.js` : configuration `VitePWA` (si plugin installé)
