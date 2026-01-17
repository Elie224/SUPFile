# Guide pour Démarrer MongoDB

## Problème
Le backend ne peut pas se connecter à MongoDB car le serveur MongoDB n'est pas démarré.

## Solutions

### Option 1 : Démarrer MongoDB via Docker Compose (Recommandé)

1. **Vérifier que Docker Desktop est démarré**
   - Ouvrez Docker Desktop
   - Attendez qu'il soit complètement démarré (icône Docker dans la barre des tâches)

2. **Démarrer MongoDB**
   ```powershell
   docker compose up -d db
   ```

3. **Vérifier que MongoDB est démarré**
   ```powershell
   docker ps
   ```
   Vous devriez voir un conteneur `supfile-db` avec le statut "Up"

4. **Vérifier les logs si nécessaire**
   ```powershell
   docker logs supfile-db
   ```

### Option 2 : Démarrer MongoDB localement (si Docker ne fonctionne pas)

Si Docker ne fonctionne pas, vous pouvez installer MongoDB localement :

1. **Télécharger MongoDB Community Server**
   - Allez sur https://www.mongodb.com/try/download/community
   - Téléchargez la version Windows
   - Installez MongoDB

2. **Démarrer MongoDB**
   ```powershell
   # Dans un terminal administrateur
   net start MongoDB
   ```

3. **Modifier le fichier backend/.env**
   ```
   MONGO_URI=[REDACTED]
   ```
   (Sans authentification si MongoDB local n'a pas d'auth configurée)

### Option 3 : Utiliser MongoDB Atlas (Cloud)

1. Créez un compte gratuit sur https://www.mongodb.com/cloud/atlas
2. Créez un cluster gratuit
3. Obtenez la chaîne de connexion
4. Modifiez `backend/.env` :
   ```
   MONGO_URI=[REDACTED]
   ```

## Vérification

Une fois MongoDB démarré, testez la connexion :

```powershell
# Test de connexion au port
Test-NetConnection -ComputerName localhost -Port 27017
```

Le résultat devrait montrer `TcpTestSucceeded : True`

## Redémarrer le Backend

Une fois MongoDB démarré, retournez dans le terminal où le backend tourne et tapez `rs` pour redémarrer nodemon, ou relancez :

```powershell
cd backend
npm run dev
```

Le backend devrait maintenant se connecter à MongoDB et la corbeille devrait fonctionner !








