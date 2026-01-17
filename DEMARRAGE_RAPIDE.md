# 🚀 Guide de Démarrage Rapide - SUPFile

## Prérequis

1. **Node.js** (v18 ou supérieur) installé
2. **MongoDB** démarré et accessible sur `localhost:27017`
3. **npm** ou **yarn** installé

## Démarrage du Backend (Étape 1)

### Option 1 : Script automatique (Recommandé)

Depuis la racine du projet :

```powershell
.\start-backend.ps1
```

Ce script va :
- ✅ Vérifier que MongoDB est accessible
- ✅ Configurer automatiquement le `.env` avec les meilleures pratiques
- ✅ Installer les dépendances si nécessaire
- ✅ Démarrer le backend en mode développement

### Option 2 : Démarrage manuel

```powershell
# 1. Aller dans le dossier backend
cd backend

# 2. Installer les dépendances (première fois seulement)
npm install

# 3. Vérifier que MongoDB est démarré
Test-NetConnection -ComputerName localhost -Port 27017

# 4. Démarrer le backend
npm run dev
```

## Configuration MongoDB Optimale

Pour le développement local, la meilleure configuration est :

**Fichier `backend/.env` :**
```env
MONGO_URI=[REDACTED]
SERVER_PORT=5000
NODE_ENV=development
JWT_SECRET=[REDACTED]
JWT_REFRESH_SECRET=[REDACTED]
```

## Démarrer MongoDB

### Si MongoDB est installé comme service Windows :

```powershell
net start MongoDB
```

### Si MongoDB est dans Docker :

```powershell
docker compose up -d db
```

### Si MongoDB n'est pas installé :

1. Téléchargez MongoDB Community Server : https://www.mongodb.com/try/download/community
2. Installez-le
3. Démarrez le service : `net start MongoDB`

## Vérification

Une fois le backend démarré, vous devriez voir :

```
✅ MongoDB connected
✅ SUPFile API listening on http://0.0.0.0:5000
✓ Environment: development
```

## Problèmes courants

### ❌ "MongoDB connection timeout"

**Solution :**
1. Vérifiez que MongoDB est démarré : `Test-NetConnection localhost -Port 27017`
2. Vérifiez votre `MONGO_URI` dans `backend/.env`
3. Pour développement local sans auth : `MONGO_URI=[REDACTED]

### ❌ "Port 5000 already in use"

**Solution :**
- Arrêtez l'autre processus utilisant le port 5000
- Ou changez `SERVER_PORT` dans `backend/.env`

### ❌ "Cannot find module"

**Solution :**
```powershell
cd backend
npm install
```

## Prochaines étapes

Une fois le backend démarré avec succès :

1. ✅ Backend : http://localhost:5000
2. 🔄 Démarrer le frontend web
3. 📱 Démarrer l'application mobile

---

**Note :** Le script `start-backend.ps1` configure automatiquement tout ce qui est nécessaire pour un environnement de développement optimal.


