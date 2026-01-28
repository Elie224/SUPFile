# 🔧 Correction : Application N'Écoute Pas sur le Port 5000

## ⚠️ Problème Identifié

Lors du déploiement Fly.io, l'avertissement suivant apparaît :
```
WARNING The app is not listening on the expected address and will not be reachable by fly-proxy.
You can fix this by configuring your app to listen on the following addresses:
  - 0.0.0.0:5000
```

**Cause** : L'application attend que MongoDB se connecte avant de démarrer le serveur HTTP. Si MongoDB ne se connecte pas (timeout, erreur de connexion, etc.), le serveur ne démarre jamais.

---

## ✅ Solutions Appliquées

### 1. Amélioration de la Fonction `startServer()`

**Fichier** : `backend/app.js`

**Problème** : Si MongoDB ne se connecte pas, le serveur ne démarre jamais.

**Solution** : Amélioration de la gestion d'erreur pour que le serveur démarre même si MongoDB échoue, avec des avertissements appropriés.

**Avant** :
```javascript
async function startServer() {
  try {
    await db.connectionPromise;
    logger.logInfo('MongoDB ready, starting server...');
  } catch (connErr) {
    // Si la connexion échoue, attendre un peu
    while (db.connection.readyState !== 1 && (Date.now() - startTime) < MAX_WAIT_TIME) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
    // Si toujours pas connecté, le serveur ne démarre pas
  }
}
```

**Après** :
```javascript
async function startServer() {
  try {
    const connectionResult = await db.connectionPromise;
    
    // Vérifier si la connexion a réussi
    if (connectionResult === null) {
      logger.logWarn('MongoDB connection failed, but starting server anyway...');
    } else {
      // Vérifier l'état de la connexion
      if (db.connection.readyState === 1) {
        logger.logInfo('MongoDB ready, starting server...');
      } else {
        // Attendre un peu pour voir si la connexion se stabilise
        while (db.connection.readyState !== 1 && (Date.now() - startTime) < MAX_WAIT_TIME) {
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        }
        
        if (db.connection.readyState === 1) {
          logger.logInfo('MongoDB ready, starting server...');
        } else {
          logger.logWarn('MongoDB connection timeout, but starting server anyway...', {
            readyState: db.connection.readyState,
            message: 'Server will start but database operations may fail'
          });
        }
      }
    }
  } catch (connErr) {
    // Si la connexion échoue, attendre un peu et vérifier l'état
    logger.logWarn('MongoDB connection error, checking status...', { error: connErr.message });
    
    // On vérifie périodiquement si la connexion est établie
    while (db.connection.readyState !== 1 && (Date.now() - startTime) < MAX_WAIT_TIME) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
    
    if (db.connection.readyState === 1) {
      logger.logInfo('MongoDB ready, starting server...');
    } else {
      logger.logWarn('MongoDB connection timeout, but starting server anyway...', {
        readyState: db.connection.readyState,
        message: 'Server will start but database operations may fail'
      });
    }
  }
  
  // ✅ Toujours démarrer le serveur, même si MongoDB n'est pas connecté
  logger.logInfo('Starting HTTP server...');
}
```

**Améliorations** :
- ✅ Le serveur démarre toujours, même si MongoDB échoue
- ✅ Gestion améliorée des cas où `connectionPromise` retourne `null`
- ✅ Logs plus détaillés pour diagnostiquer les problèmes
- ✅ Avertissements appropriés si MongoDB n'est pas connecté

---

### 2. Amélioration de la Gestion d'Erreur au Démarrage

**Fichier** : `backend/app.js`

**Problème** : Si `startServer()` échoue, l'application s'arrête complètement.

**Solution** : Ajout d'un fallback pour démarrer le serveur même en cas d'erreur dans `startServer()`.

**Avant** :
```javascript
startServer().then(() => {
  server = app.listen(PORT, HOST, () => {
    logger.logInfo(`SUPFile API listening on http://${HOST}:${PORT}`);
  });
}).catch((err) => {
  logger.logError(err, { context: 'server startup' });
  process.exit(1); // ❌ Arrête l'application
});
```

**Après** :
```javascript
startServer().then(() => {
  try {
    server = app.listen(PORT, HOST, () => {
      logger.logInfo(`SUPFile API listening on http://${HOST}:${PORT}`, {
        environment: config.server.nodeEnv,
        port: PORT,
        host: HOST,
      });
      console.log(`✓ Server started successfully on ${HOST}:${PORT}`);
    });
    
    // Gérer les erreurs d'écoute
    server.on('error', (err) => {
      logger.logError(err, { context: 'server listen error' });
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error(`✗ Server error: ${err.message}`);
        process.exit(1);
      }
    });
  } catch (err) {
    logger.logError(err, { context: 'server startup' });
    console.error(`✗ Failed to start server: ${err.message}`);
    process.exit(1);
  }
}).catch((err) => {
  logger.logError(err, { context: 'server startup' });
  console.error(`✗ Failed to start server: ${err.message}`);
  // ✅ Essayer quand même de démarrer le serveur
  try {
    server = app.listen(PORT, HOST, () => {
      logger.logInfo(`SUPFile API listening on http://${HOST}:${PORT} (started despite errors)`, {
        environment: config.server.nodeEnv,
        port: PORT,
        host: HOST,
      });
      console.log(`✓ Server started on ${HOST}:${PORT} (despite startup errors)`);
    });
  } catch (listenErr) {
    logger.logError(listenErr, { context: 'server listen fallback' });
    process.exit(1);
  }
});
```

**Améliorations** :
- ✅ Fallback pour démarrer le serveur même si `startServer()` échoue
- ✅ Gestion des erreurs d'écoute (port déjà utilisé, etc.)
- ✅ Logs plus détaillés avec `console.log` pour le debugging
- ✅ Messages d'erreur plus clairs

---

### 3. Script de Diagnostic

**Fichier** : `backend/diagnostiquer-demarrage.ps1`

Script PowerShell pour diagnostiquer pourquoi l'application ne démarre pas :
- Vérifie les secrets configurés
- Affiche les logs récents
- Teste l'endpoint `/health`
- Vérifie l'état des machines Fly.io

**Utilisation** :
```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\diagnostiquer-demarrage.ps1
```

---

## 📋 Vérifications

### Configuration

- ✅ `config.js` : `port: process.env.PORT || 5000` (correct)
- ✅ `config.js` : `host: process.env.SERVER_HOST || '0.0.0.0'` (correct)
- ✅ `fly.toml` : `internal_port = 5000` (correct)
- ✅ `app.js` : Le serveur écoute sur `HOST:PORT` (correct)

### Gestion d'Erreur

- ✅ Le serveur démarre même si MongoDB échoue
- ✅ Fallback si `startServer()` échoue
- ✅ Gestion des erreurs d'écoute (port déjà utilisé)
- ✅ Logs détaillés pour diagnostiquer

---

## 🚀 Actions à Effectuer

### 1. Redéployer le Backend

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
flyctl deploy --app supfile
```

### 2. Vérifier les Logs

```powershell
flyctl logs --app supfile
```

**Recherchez** :
- ✅ `✓ Server started successfully on 0.0.0.0:5000` → Serveur démarré
- ✅ `SUPFile API listening on http://0.0.0.0:5000` → Application accessible
- ⚠️ `MongoDB connection failed, but starting server anyway...` → MongoDB non connecté mais serveur démarré
- ❌ `✗ Failed to start server` → Erreur au démarrage

### 3. Tester l'Application

```powershell
curl https://supfile.fly.dev/health
```

**Résultat attendu** : `{"status":"OK","message":"SUPFile API is running"}`

### 4. Si le Problème Persiste

Utilisez le script de diagnostic :
```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\diagnostiquer-demarrage.ps1
```

---

## 🆘 Si le Problème Persiste

### MongoDB Ne Se Connecte Pas

1. **Vérifiez** que `MONGO_URI` est configuré :
   ```powershell
   flyctl secrets list --app supfile | Select-String "MONGO_URI"
   ```

2. **Vérifiez** que l'URI MongoDB est correct :
   - Format : `mongodb+srv://[REDACTED]
   - Vérifiez que le cluster MongoDB est accessible depuis Internet

3. **Vérifiez** les logs MongoDB :
   ```powershell
   flyctl logs --app supfile | Select-String -Pattern "MongoDB|mongo"
   ```

### Port Déjà Utilisé

Si vous voyez `EADDRINUSE`, cela signifie qu'une autre instance écoute déjà sur le port 5000. Cela ne devrait pas arriver sur Fly.io, mais si c'est le cas :

1. **Redémarrez** l'application :
   ```powershell
   flyctl apps restart --app supfile
   ```

2. **Vérifiez** qu'il n'y a qu'une seule instance :
   ```powershell
   flyctl status --app supfile
   ```

### Application Crash Immédiatement

1. **Vérifiez** les logs pour voir l'erreur exacte :
   ```powershell
   flyctl logs --app supfile | Select-String -Pattern "error|Error|ERROR|exception|Exception"
   ```

2. **Vérifiez** que tous les secrets sont configurés :
   ```powershell
   flyctl secrets list --app supfile
   ```

3. **Vérifiez** que `package.json` a un script `start` :
   ```json
   {
     "scripts": {
       "start": "node app.js"
     }
   }
   ```

---

## 📋 Checklist

- [x] Fonction `startServer()` améliorée pour démarrer même si MongoDB échoue
- [x] Fallback ajouté si `startServer()` échoue
- [x] Gestion des erreurs d'écoute améliorée
- [x] Logs détaillés ajoutés
- [x] Script de diagnostic créé
- [ ] Backend redéployé
- [ ] Logs vérifiés
- [ ] Application testée (`/health`)
- [ ] Problème résolu

---

Une fois le backend redéployé, l'application devrait démarrer correctement et écouter sur `0.0.0.0:5000` ! 🚀
