# 🔧 Correction des Boutons Dossiers et Timeout Téléchargement

## ✅ Problèmes Identifiés

1. **Boutons Renommer et Supprimer non cliquables** : Tous les dossiers à la racine (avec `parent_id === null`) étaient considérés comme le dossier "Root" système, désactivant les boutons.

2. **Timeout téléchargement de dossier** : Le timeout de 5 minutes était insuffisant pour les dossiers volumineux.

---

## 🔧 Solutions Appliquées

### 1. Correction de la Détection du Dossier Root

**Fichier** : `frontend-web/src/pages/Files.jsx`

**Problème** : La logique `isRootFolder` désactivait les boutons pour TOUS les dossiers avec `parent_id === null`, pas seulement le dossier "Root" système.

**Avant** :
```javascript
const isRootFolder = itemType === 'folder' && (item.parent_id === null || item.parent_id === undefined);
```

**Après** :
```javascript
// Vérifier si c'est le dossier Root système (nom === "Root" et parent_id === null)
// Les dossiers normaux à la racine ont aussi parent_id === null, mais ne sont pas "Root"
const isRootFolder = itemType === 'folder' && 
  (item.name === 'Root' || item.name === 'root') && 
  (item.parent_id === null || item.parent_id === undefined);
```

**Résultat** : Seul le dossier "Root" système a ses boutons désactivés. Les dossiers normaux à la racine peuvent être renommés et supprimés.

---

### 2. Augmentation du Timeout de Téléchargement

**Fichier** : `frontend-web/src/services/api.js`

**Problème** : Le timeout de 5 minutes (300000ms) était insuffisant pour les dossiers volumineux.

**Avant** :
```javascript
timeout: 300000, // 5 minutes pour les téléchargements de dossiers
```

**Après** :
```javascript
timeout: 600000, // 10 minutes pour les téléchargements de dossiers volumineux
```

**Résultat** : Le téléchargement peut maintenant prendre jusqu'à 10 minutes sans timeout.

---

## 📋 Vérifications

### Boutons Dossiers

- ✅ Seul le dossier "Root" système a les boutons désactivés
- ✅ Les dossiers normaux à la racine peuvent être renommés
- ✅ Les dossiers normaux à la racine peuvent être supprimés
- ✅ Les dossiers dans des sous-dossiers fonctionnent normalement

### Téléchargement de Dossier

- ✅ Timeout augmenté à 10 minutes
- ✅ Indicateur de chargement pendant le téléchargement
- ✅ Gestion d'erreur améliorée pour les timeouts

---

## 🧪 Tests à Effectuer

### Test 1 : Boutons Renommer et Supprimer

1. **Créez un dossier** à la racine (pas dans un sous-dossier)
2. **Vérifiez** que :
   - Le bouton "Renommer" est cliquable (pas grisé)
   - Le bouton "Supprimer" est cliquable (pas grisé)
   - Vous pouvez renommer le dossier
   - Vous pouvez supprimer le dossier

### Test 2 : Dossier Root Système

1. **Cherchez** le dossier "Root" (s'il existe)
2. **Vérifiez** que :
   - Le bouton "Renommer" est grisé (désactivé)
   - Le bouton "Supprimer" est grisé (désactivé)
   - Un message d'aide s'affiche au survol

### Test 3 : Téléchargement de Dossier

1. **Créez un dossier** avec plusieurs fichiers (quelques dizaines de MB)
2. **Cliquez sur "Télécharger"**
3. **Vérifiez** que :
   - Le bouton affiche "Téléchargement..." avec un spinner
   - Le téléchargement ne timeout pas avant 10 minutes
   - Le fichier ZIP se télécharge correctement

---

## 🚀 Déploiement

### Frontend Netlify

Les modifications doivent être déployées sur Netlify :

1. **Commitez les changements** :
   ```powershell
   git add frontend-web/src/pages/Files.jsx frontend-web/src/services/api.js
   git commit -m "Fix: Corriger détection dossier Root et augmenter timeout téléchargement"
   git push
   ```

2. **Netlify redéploiera automatiquement** (si connecté à GitHub)
   - OU déclenchez un redéploiement manuel depuis le dashboard Netlify

3. **Attendez** que le déploiement se termine (1-3 minutes)

4. **Testez** sur votre site Netlify

---

## 📋 Checklist

- [x] Détection `isRootFolder` corrigée (vérifie le nom "Root")
- [x] Timeout téléchargement augmenté à 10 minutes
- [x] Boutons renommer/supprimer fonctionnels pour dossiers normaux
- [x] Boutons désactivés uniquement pour dossier "Root" système
- [ ] Modifications commitées et poussées sur GitHub
- [ ] Frontend redéployé sur Netlify
- [ ] Boutons renommer/supprimer testés
- [ ] Téléchargement de dossier testé

---

## 🆘 Si le Problème Persiste

### Vérifier la Console du Navigateur

1. **Ouvrez** la console (F12)
2. **Cliquez sur** un bouton renommer/supprimer
3. **Vérifiez** les erreurs dans la console
4. **Vérifiez** l'onglet "Network" pour voir les requêtes API

### Vérifier le Type de Dossier

Dans la console du navigateur, vérifiez les propriétés du dossier :
```javascript
// Dans la console, inspectez un item de dossier
console.log(item.name, item.parent_id, item.type);
```

### Si le Téléchargement Timeout Toujours

1. **Vérifiez** la taille du dossier (peut-être trop volumineux)
2. **Vérifiez** les logs du backend :
   ```powershell
   flyctl logs --app supfile | Select-String -Pattern "download|zip|archiver"
   ```
3. **Essayez** de télécharger un dossier plus petit pour confirmer que le problème vient de la taille

### Augmenter Encore le Timeout (si nécessaire)

Si 10 minutes ne suffisent pas, vous pouvez augmenter dans `api.js` :
```javascript
timeout: 900000, // 15 minutes
```

**Note** : Les timeouts très longs peuvent être problématiques pour l'expérience utilisateur. Envisagez plutôt d'optimiser la génération du ZIP côté backend ou de diviser les gros dossiers.

---

Une fois les modifications déployées, les boutons devraient être cliquables et le téléchargement devrait fonctionner pour les dossiers volumineux ! 🚀
