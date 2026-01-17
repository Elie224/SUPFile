# Guide de Démarrage du Backend

## Problème
L'erreur `ERR_CONNECTION_REFUSED` signifie que le backend n'est pas démarré.

## Solution

### Option 1 : Utiliser le script PowerShell (Recommandé)

```powershell
.\start-backend.ps1
```

### Option 2 : Démarrer manuellement

1. **Ouvrir un terminal PowerShell dans le dossier du projet**

2. **Aller dans le dossier backend**
```powershell
cd backend
```

3. **Vérifier que MongoDB est démarré**
```powershell
docker compose up -d db
```

4. **Vérifier que le fichier .env existe**
Le fichier `backend/.env` doit contenir au minimum :
```
MONGO_URI=[REDACTED]
JWT_SECRET=[REDACTED]
JWT_REFRESH_SECRET=[REDACTED]
```

5. **Installer les dépendances (si nécessaire)**
```powershell
npm install
```

6. **Démarrer le backend**
```powershell
npm run dev
```

Le backend devrait démarrer sur `http://localhost:5000`

## Vérification

Une fois le backend démarré, vous devriez voir :
```
✅ MongoDB ready, starting server...
✓ Upload directory ready: ...
✓ SUPFile API listening on http://0.0.0.0:5000
```

## Test

Ouvrez un navigateur et allez sur :
- `http://localhost:5000/health` - Devrait retourner `{"status":"OK","message":"SUPFile API is running"}`

Si cela fonctionne, la corbeille devrait maintenant se charger correctement !








