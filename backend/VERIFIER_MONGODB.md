# Vérification de la connexion MongoDB

## Problème détecté
Le backend essaie de se connecter mais obtient un timeout. MongoDB est accessible sur le port 27017, mais la connexion échoue.

## Solutions possibles

### Solution 1 : MongoDB local sans authentification (Recommandé pour développement)

Si MongoDB est installé localement sans authentification, votre `.env` doit contenir :

```env
MONGO_URI=mongodb://localhost:27017/supfile
```

### Solution 2 : MongoDB avec authentification

Si MongoDB nécessite une authentification (Docker ou installation avec utilisateur), utilisez :

```env
MONGO_URI=mongodb://username:password@localhost:27017/supfile?authSource=admin
```

Remplacez `username` et `password` par vos identifiants MongoDB.

### Solution 3 : Vérifier si MongoDB est vraiment démarré

Testez la connexion MongoDB directement :

```powershell
# Si MongoDB est installé localement
mongosh mongodb://localhost:27017/supfile

# Ou avec authentification
mongosh mongodb://username:password@localhost:27017/supfile?authSource=admin
```

### Solution 4 : Redémarrer MongoDB

Si MongoDB est un service Windows :

```powershell
# Arrêter MongoDB
net stop MongoDB

# Démarrer MongoDB
net start MongoDB
```

Si MongoDB est dans Docker :

```powershell
docker compose up -d db
```

## Vérification de la configuration

1. Vérifiez votre fichier `backend/.env`
2. Assurez-vous que `MONGO_URI` est correctement configuré
3. Redémarrez le backend après modification du `.env`

## Format de MONGO_URI

- **Sans authentification** : `mongodb://localhost:27017/supfile`
- **Avec authentification** : `mongodb://user:pass@localhost:27017/supfile?authSource=admin`
- **MongoDB Atlas (Cloud)** : `mongodb+srv://user:pass@cluster.mongodb.net/supfile`


