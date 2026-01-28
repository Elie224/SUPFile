# 🔍 Diagnostic de l'Erreur de Port

## ⚠️ Avertissement Observé

```
WARNING The app is not listening on the expected address and will not be reachable by fly-proxy.
You can fix this by configuring your app to listen on the following addresses:
  - 0.0.0.0:5000
```

## ✅ Corrections Appliquées

1. ✅ **Health check ajouté dans `fly.toml`** : Fly.io peut maintenant vérifier que l'application répond
2. ✅ **Configuration vérifiée** : Le code écoute déjà sur `0.0.0.0:5000` (défini dans `config.js`)

## 🔍 Causes Possibles

### 1. Application Non Démarrée (Secrets Manquants)

Si les secrets ne sont pas configurés pour `supfile`, l'application peut ne pas démarrer correctement.

**Solution** : Vérifier et configurer les secrets :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\verifier-et-copier-secrets-supfile.ps1
```

### 2. Erreur au Démarrage

L'application peut avoir une erreur au démarrage (connexion MongoDB, variables d'environnement manquantes, etc.).

**Solution** : Vérifier les logs :

```powershell
flyctl logs --app supfile
```

### 3. Application en Cours de Démarrage

L'avertissement peut apparaître pendant le démarrage. Attendez quelques secondes et testez :

```powershell
curl https://supfile.fly.dev/health
```

## 🧪 Tests à Effectuer

### 1. Vérifier les Secrets

```powershell
flyctl secrets list --app supfile
```

Si la liste est vide ou incomplète, configurez-les :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\verifier-et-copier-secrets-supfile.ps1
```

### 2. Vérifier les Logs

```powershell
flyctl logs --app supfile
```

Recherchez :
- ✅ `SUPFile API listening on http://0.0.0.0:5000` → Application démarrée correctement
- ❌ Erreurs de connexion MongoDB → Vérifier `MONGO_URI`
- ❌ Erreurs de variables d'environnement → Vérifier les secrets

### 3. Tester l'API

```powershell
# Test simple
curl https://supfile.fly.dev/health

# Test avec détails
curl https://supfile.fly.dev/api/health

# Devrait retourner :
# {"status":"ok","timestamp":"...","uptime":...}
```

### 4. Vérifier le Statut de l'Application

```powershell
flyctl status --app supfile
```

## 🔧 Solutions selon le Problème

### Si les Secrets Manquent

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\verifier-et-copier-secrets-supfile.ps1
```

Puis redéployez :

```powershell
flyctl deploy
```

### Si l'Application Ne Démarre Pas

1. Vérifiez les logs pour identifier l'erreur
2. Vérifiez que `MONGO_URI` est correct
3. Vérifiez que tous les secrets requis sont configurés
4. Redéployez après correction

### Si l'Application Démarre Mais Ne Répond Pas

1. Vérifiez que le health check dans `fly.toml` est correct
2. Attendez quelques secondes (l'application peut être en cours de démarrage)
3. Vérifiez les logs pour voir si l'application écoute bien sur `0.0.0.0:5000`

## ✅ Checklist de Diagnostic

- [ ] Vérifier les secrets : `flyctl secrets list --app supfile`
- [ ] Vérifier les logs : `flyctl logs --app supfile`
- [ ] Tester l'API : `curl https://supfile.fly.dev/health`
- [ ] Vérifier le statut : `flyctl status --app supfile`
- [ ] Configurer les secrets si nécessaire : `.\verifier-et-copier-secrets-supfile.ps1`
- [ ] Redéployer si nécessaire : `flyctl deploy`

---

## 🎯 Action Immédiate

**Commencez par vérifier les logs** pour identifier la cause exacte :

```powershell
flyctl logs --app supfile
```

Cela vous dira si :
- L'application démarre correctement
- Il y a des erreurs de connexion MongoDB
- Il y a des variables d'environnement manquantes
- L'application écoute bien sur `0.0.0.0:5000`
