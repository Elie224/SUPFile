# 🔧 Correction Téléchargement Dossier et Boutons Non Cliquables

## ✅ Problèmes Identifiés

1. **Téléchargement de dossier affiche "downloadTimeout"** même si ce n'est pas un vrai timeout
   - Le backend retourne 503 (Service Unavailable) car les machines Fly.io sont arrêtées
   - La gestion d'erreur interprétait toutes les erreurs comme des timeouts

2. **Boutons Renommer et Supprimer non cliquables** pour les dossiers
   - La détection `isRootFolder` était correcte mais peut-être trop restrictive

---

## 🔧 Solutions Appliquées

### 1. Configuration Fly.io - Machines Toujours Actives

**Fichier** : `backend/fly.toml`

**Problème** : `min_machines_running = 0` permettait aux machines de s'arrêter automatiquement, causant des erreurs 503.

**Solution** : Changé à `min_machines_running = 1` pour qu'au moins une machine reste active.

```toml
[http_service]
  internal_port = 5000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 1  # ← Changé de 0 à 1
  processes = ['app']
```

---

### 2. Amélioration de la Gestion d'Erreur

**Fichier** : `frontend-web/src/pages/Files.jsx`

**Problème** : Toutes les erreurs étaient interprétées comme des timeouts, même les erreurs 503/502.

**Solution** : Ajout d'une détection spécifique pour les erreurs serveur avant de vérifier les timeouts.

**Avant** :
```javascript
if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
  errorMsg = 'downloadTimeout';
}
```

**Après** :
```javascript
// Vérifier d'abord les erreurs serveur (503, 502)
if (err.response?.status === 503) {
  errorMsg = 'Le serveur est temporairement indisponible. Les machines sont peut-être en veille.';
} else if (err.response?.status === 502) {
  errorMsg = 'Erreur de passerelle. Le serveur ne répond pas correctement.';
} else if (err.code === 'ECONNABORTED') {
  // Distinguer timeout réel vs connexion interrompue
  if (err.message?.includes('timeout')) {
    errorMsg = 'Le téléchargement a pris trop de temps (plus de 10 minutes).';
  } else {
    errorMsg = 'La connexion a été interrompue. Vérifiez votre connexion.';
  }
}
```

---

### 3. Script de Démarrage des Machines

**Fichier** : `backend/demarrer-machines-fly.ps1`

Script PowerShell pour démarrer manuellement les machines Fly.io si elles sont arrêtées.

**Utilisation** :
```powershell
cd backend
.\demarrer-machines-fly.ps1
```

**Actions** :
1. Vérifie l'état de l'application
2. Démarre les machines (`flyctl scale count 1`)
3. Attend que les machines soient prêtes
4. Vérifie que l'endpoint `/health` répond

---

### 4. Logs de Debug pour Détection Root

**Fichier** : `frontend-web/src/pages/Files.jsx`

Ajout de logs de debug (en développement) pour vérifier la détection du dossier Root.

```javascript
if (itemType === 'folder' && process.env.NODE_ENV === 'development') {
  console.log('Folder debug:', {
    name: item.name,
    parent_id: item.parent_id,
    isRootFolder,
    itemType
  });
}
```

---

## 📋 Vérifications

### Backend - Configuration

- ✅ `fly.toml` : `min_machines_running = 1` (machines toujours actives)
- ✅ `internal_port = 5000` (correspond au PORT dans les secrets)
- ✅ Health check configuré sur `/health`

### Frontend - Gestion d'Erreur

- ✅ Détection spécifique pour erreurs 503/502
- ✅ Distinction entre timeout réel et connexion interrompue
- ✅ Messages d'erreur plus précis

### Boutons Dossiers

- ✅ Détection `isRootFolder` vérifie le nom "Root" ET `parent_id === null`
- ✅ Logs de debug ajoutés pour diagnostiquer

---

## 🚀 Actions à Effectuer

### 1. Redéployer le Backend avec la Nouvelle Configuration

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
flyctl deploy --app supfile
```

**OU** utiliser le script :
```powershell
.\demarrer-machines-fly.ps1
```

### 2. Vérifier que les Machines sont Actives

```powershell
flyctl status --app supfile
```

**Vérifiez** :
- Au moins 1 machine en état "started"
- Pas d'erreurs dans les logs

### 3. Tester le Backend

```powershell
curl https://supfile.fly.dev/health
```

**Résultat attendu** : `{"status":"OK","message":"SUPFile API is running"}`

### 4. Tester le Téléchargement de Dossier

1. **Connectez-vous** à l'application
2. **Créez un dossier** avec quelques fichiers
3. **Cliquez sur "Télécharger (ZIP)"**
4. **Vérifiez** :
   - Si erreur 503 : Les machines sont peut-être encore en train de démarrer
   - Si timeout réel : Le dossier est peut-être trop volumineux
   - Si succès : Le fichier ZIP se télécharge

### 5. Tester les Boutons Renommer/Supprimer

1. **Créez un dossier** à la racine (pas "Root")
2. **Vérifiez** que :
   - Le bouton "Renommer" est cliquable (pas grisé)
   - Le bouton "Supprimer" est cliquable (pas grisé)
3. **Ouvrez la console** (F12) en développement
4. **Vérifiez** les logs "Folder debug" pour voir la détection

---

## 🆘 Si le Problème Persiste

### Erreur 503 Persistante

1. **Vérifiez** que les machines sont démarrées :
   ```powershell
   flyctl status --app supfile
   flyctl scale count 1 --app supfile
   ```

2. **Vérifiez** les logs pour voir si l'application démarre :
   ```powershell
   flyctl logs --app supfile | Select-String -Pattern "listening|error|Error"
   ```

3. **Attendez** 30-60 secondes après le démarrage des machines

### Boutons Toujours Non Cliquables

1. **Ouvrez** la console du navigateur (F12)
2. **Allez sur** la page Fichiers
3. **Vérifiez** les logs "Folder debug" pour voir :
   - Le nom du dossier
   - La valeur de `parent_id`
   - La valeur de `isRootFolder`

4. **Si `isRootFolder` est `true` pour un dossier normal** :
   - Vérifiez que le nom n'est pas exactement "Root" ou "root"
   - Vérifiez que `parent_id` n'est pas `null` si ce n'est pas le dossier Root système

### Téléchargement Échoue Toujours

1. **Vérifiez** les logs du backend :
   ```powershell
   flyctl logs --app supfile | Select-String -Pattern "download|folder|zip|archiver"
   ```

2. **Vérifiez** la console du navigateur (F12) :
   - Regardez l'onglet "Network"
   - Vérifiez le statut de la requête vers `/api/folders/:id/download`
   - Vérifiez les en-têtes de réponse

3. **Vérifiez** que le dossier contient des fichiers :
   - Un dossier vide peut causer des problèmes

---

## 📋 Checklist

- [x] `min_machines_running` changé à 1 dans `fly.toml`
- [x] Gestion d'erreur améliorée (détection 503/502 avant timeout)
- [x] Script de démarrage des machines créé
- [x] Logs de debug ajoutés pour détection Root
- [ ] Backend redéployé avec nouvelle configuration
- [ ] Machines démarrées et actives
- [ ] Backend accessible (health check OK)
- [ ] Téléchargement de dossier testé
- [ ] Boutons renommer/supprimer testés

---

Une fois le backend redéployé et les machines démarrées, les erreurs 503 devraient disparaître et le téléchargement devrait fonctionner ! 🚀
