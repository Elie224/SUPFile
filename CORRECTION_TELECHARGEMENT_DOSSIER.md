# 🔧 Correction du Téléchargement de Dossier - "Request Aborted"

## ✅ Problème Identifié

**Erreur** : `request aborted` lors du téléchargement d'un dossier

**Causes** :
1. **Timeout trop court** : `apiClient` utilisait le timeout par défaut d'axios (généralement 0 ou très court)
2. **Pas de gestion spécifique** pour les téléchargements volumineux
3. **Pas d'indicateur visuel** pendant le téléchargement
4. **Gestion d'erreur insuffisante** pour les cas de timeout/abort

---

## 🔧 Solutions Appliquées

### 1. Client Axios Dédié pour les Téléchargements

**Fichier** : `frontend-web/src/services/api.js`

Création d'un `downloadClient` avec un timeout de **5 minutes** (300000ms) pour permettre le téléchargement de dossiers volumineux.

```javascript
// Instance séparée pour les téléchargements (timeout plus long pour les gros fichiers)
const downloadClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 300000, // 5 minutes pour les téléchargements de dossiers
});
```

**Intercepteur d'authentification** :
```javascript
downloadClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
```

**Service modifié** :
```javascript
downloadAsZip: (folderId) =>
  downloadClient.get(`/folders/${folderId}/download`, { responseType: 'blob' }),
```

---

### 2. Amélioration de l'UI du Téléchargement

**Fichier** : `frontend-web/src/pages/Files.jsx`

**Ajouts** :
- État `downloadingFolder` pour suivre quel dossier est en cours de téléchargement
- Désactivation du bouton pendant le téléchargement
- Indicateur de chargement (spinner) avec texte "Téléchargement..."
- Message informatif au début du téléchargement

**Code** :
```javascript
const [downloadingFolder, setDownloadingFolder] = useState(null);

// Dans le bouton de téléchargement
disabled={downloadingFolder === itemId}
// Affiche un spinner si en cours de téléchargement
{downloadingFolder === itemId ? (
  <>
    <span className="spinner-border spinner-border-sm me-1"></span>
    {t('downloading') || 'Téléchargement...'}
  </>
) : (
  <>
    <i className="bi bi-download me-1"></i>
    {t('downloadZip')}
  </>
)}
```

---

### 3. Gestion d'Erreur Améliorée

**Gestion spécifique des erreurs** :
- **Timeout** : Message spécifique si le téléchargement prend trop de temps
- **Request Aborted** : Détection et message approprié
- **Blob vide** : Vérification que le fichier ZIP n'est pas vide
- **Erreurs serveur** : Gestion des erreurs blob (essai de parsing JSON si possible)

**Code** :
```javascript
catch (err) {
  let errorMsg = t('downloadError') || 'Erreur lors du téléchargement';
  
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    errorMsg = t('downloadTimeout') || 'Le téléchargement a pris trop de temps. Veuillez réessayer.';
  } else if (err.message?.includes('aborted') || err.message?.includes('canceled')) {
    errorMsg = t('downloadAborted') || 'Le téléchargement a été annulé.';
  } else if (err.response?.data instanceof Blob) {
    // Essayer de parser l'erreur depuis le blob
    try {
      const text = await err.response.data.text();
      const json = JSON.parse(text);
      errorMsg = json.error?.message || errorMsg;
    } catch {
      errorMsg = err.response.status === 403 
        ? t('accessDenied') || 'Accès refusé'
        : errorMsg;
    }
  }
  
  toast.error(errorMsg);
}
```

---

## 📋 Vérifications

### Backend - Route de Téléchargement

- ✅ `GET /api/folders/:id/download` - Utilise `archiver` pour créer un ZIP
- ✅ Streaming direct vers la réponse HTTP
- ✅ Pas de limite de taille côté backend (géré par le timeout)

### Frontend - Configuration

- ✅ `downloadClient` avec timeout de 5 minutes
- ✅ `responseType: 'blob'` pour recevoir le fichier ZIP
- ✅ Gestion d'erreur améliorée
- ✅ Indicateur visuel pendant le téléchargement

---

## 🧪 Tests à Effectuer

### Test 1 : Téléchargement d'un Petit Dossier

1. **Créez un dossier** avec 2-3 fichiers (quelques MB)
2. **Cliquez sur "Télécharger"**
3. **Vérifiez** que :
   - Le bouton affiche "Téléchargement..." avec un spinner
   - Le bouton est désactivé pendant le téléchargement
   - Un message "Téléchargement en cours..." s'affiche
   - Le fichier ZIP se télécharge correctement
   - Un message de succès s'affiche

### Test 2 : Téléchargement d'un Gros Dossier

1. **Créez un dossier** avec plusieurs fichiers (plusieurs dizaines de MB)
2. **Cliquez sur "Télécharger"**
3. **Vérifiez** que :
   - Le téléchargement ne se termine pas avec "request aborted"
   - Le téléchargement peut prendre plusieurs minutes sans erreur
   - Le fichier ZIP final est complet

### Test 3 : Gestion d'Erreur

1. **Essayez de télécharger** un dossier auquel vous n'avez pas accès
2. **Vérifiez** qu'un message d'erreur approprié s'affiche

---

## 🚀 Déploiement

### Frontend Netlify

Les modifications doivent être déployées sur Netlify :

1. **Commitez les changements** :
   ```powershell
   git add frontend-web/src/services/api.js frontend-web/src/pages/Files.jsx
   git commit -m "Fix: Corriger timeout et gestion d'erreur pour téléchargement de dossiers"
   git push
   ```

2. **Netlify redéploiera automatiquement** (si connecté à GitHub)
   - OU déclenchez un redéploiement manuel depuis le dashboard Netlify

3. **Attendez** que le déploiement se termine (1-3 minutes)

4. **Testez** sur votre site Netlify

---

## 📋 Checklist

- [x] Client axios dédié créé avec timeout de 5 minutes
- [x] Intercepteur d'authentification ajouté au downloadClient
- [x] Service `downloadAsZip` utilise `downloadClient`
- [x] État `downloadingFolder` ajouté
- [x] Bouton désactivé pendant le téléchargement
- [x] Indicateur de chargement (spinner) ajouté
- [x] Gestion d'erreur améliorée (timeout, aborted, blob vide)
- [x] Messages d'erreur spécifiques
- [ ] Modifications commitées et poussées sur GitHub
- [ ] Frontend redéployé sur Netlify
- [ ] Téléchargement de petit dossier testé
- [ ] Téléchargement de gros dossier testé
- [ ] Gestion d'erreur testée

---

## 🆘 Si le Problème Persiste

### Vérifier les Logs du Backend

```powershell
flyctl logs --app supfile | Select-String -Pattern "download|folder|zip|archiver"
```

### Vérifier la Console du Navigateur

1. **Ouvrez** la console (F12)
2. **Allez sur** l'onglet "Network"
3. **Téléchargez** un dossier
4. **Vérifiez** :
   - Le statut de la requête (200, 403, 500, etc.)
   - Le temps de réponse
   - La taille du fichier téléchargé
   - Les erreurs éventuelles

### Vérifier la Configuration

1. **Vérifiez** que `VITE_API_URL` pointe vers `https://supfile.fly.dev`
2. **Vérifiez** que le backend est accessible :
   ```powershell
   curl https://supfile.fly.dev/health
   ```

### Augmenter le Timeout (si nécessaire)

Si les dossiers sont très volumineux (> 100 MB), vous pouvez augmenter le timeout dans `api.js` :

```javascript
timeout: 600000, // 10 minutes au lieu de 5
```

---

Une fois les modifications déployées, le téléchargement de dossiers devrait fonctionner correctement, même pour les dossiers volumineux ! 🚀
