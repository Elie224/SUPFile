# Solution : MongoDB sans Docker

## Problème
Docker Desktop a un problème (erreur 500 de l'API). Voici des solutions alternatives.

## Solution 1 : Redémarrer Docker Desktop (Recommandé en premier)

1. **Fermer Docker Desktop complètement**
   - Clic droit sur l'icône Docker dans la barre des tâches
   - Sélectionner "Quit Docker Desktop"
   - Attendre quelques secondes

2. **Redémarrer Docker Desktop**
   - Ouvrir Docker Desktop depuis le menu Démarrer
   - Attendre qu'il soit complètement démarré (icône verte)

3. **Réessayer**
   ```powershell
   docker compose up -d db
   ```

## Solution 2 : Installer MongoDB localement (Sans Docker)

### Étape 1 : Télécharger MongoDB Community Server

1. Allez sur : https://www.mongodb.com/try/download/community
2. Sélectionnez :
   - Version : 7.0 (ou la dernière stable)
   - Platform : Windows
   - Package : MSI
3. Téléchargez et installez

### Étape 2 : Démarrer MongoDB

1. **Ouvrir PowerShell en tant qu'administrateur**
2. **Démarrer le service MongoDB**
   ```powershell
   net start MongoDB
   ```

   Si le service n'existe pas :
   ```powershell
   # Créer le service MongoDB
   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --install --dbpath "C:\data\db" --logpath "C:\data\log\mongod.log"
   net start MongoDB
   ```

### Étape 3 : Modifier la configuration du backend

Modifiez le fichier `backend/.env` :

```env
# MongoDB local sans authentification
MONGO_URI=[REDACTED]

# OU avec authentification (si vous avez créé un utilisateur)
# MONGO_URI=[REDACTED]
```

### Étape 4 : Redémarrer le backend

Dans le terminal du backend, tapez `rs` ou relancez :
```powershell
npm run dev
```

## Solution 3 : Utiliser MongoDB Atlas (Cloud - Gratuit)

### Étape 1 : Créer un compte

1. Allez sur : https://www.mongodb.com/cloud/atlas/register
2. Créez un compte gratuit

### Étape 2 : Créer un cluster

1. Cliquez sur "Build a Database"
2. Choisissez "FREE" (M0)
3. Sélectionnez un provider et une région
4. Créez le cluster (cela peut prendre quelques minutes)

### Étape 3 : Créer un utilisateur de base de données

1. Dans "Database Access", créez un utilisateur
2. Notez le nom d'utilisateur et le mot de passe

### Étape 4 : Autoriser l'accès réseau

1. Dans "Network Access", ajoutez votre IP ou `0.0.0.0/0` (pour développement uniquement)

### Étape 5 : Obtenir la chaîne de connexion

1. Dans "Database", cliquez sur "Connect"
2. Choisissez "Connect your application"
3. Copiez la chaîne de connexion (elle ressemble à : `mongodb+srv://[REDACTED]

### Étape 6 : Modifier la configuration

Modifiez `backend/.env` :
```env
MONGO_URI=[REDACTED]
```

Remplacez `username`, `password` et `cluster` par vos valeurs.

### Étape 7 : Redémarrer le backend

```powershell
npm run dev
```

## Vérification

Une fois MongoDB démarré (quelle que soit la méthode), testez :

```powershell
# Test de connexion
Test-NetConnection -ComputerName localhost -Port 27017
```

Le backend devrait maintenant se connecter et la corbeille devrait fonctionner !







