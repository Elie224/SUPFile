# 🔧 Guide de refactoring - Code propre

## 📋 Règles de refactoring

### 1. Remplacer console.log/error par logger

**Pattern à chercher** :
```javascript
console.log(...)
console.error(...)
console.warn(...)
```

**Remplacer par** :
```javascript
const logger = require('../utils/logger');

// Pour les logs d'info
logger.logInfo('Message', { context: 'additional data' });

// Pour les erreurs
logger.logError(error, { context: 'where it happened' });

// Pour les warnings
logger.logWarn('Warning message', { context: 'data' });

// Pour le debug (seulement en développement)
logger.logDebug('Debug message', { context: 'data' });
```

### 2. Utiliser compareObjectIds au lieu de comparaisons manuelles

**Pattern à chercher** :
```javascript
const id1 = obj1.id?.toString ? obj1.id.toString() : obj1.id;
const id2 = obj2.id?.toString ? obj2.id.toString() : obj2.id;
if (id1 !== id2) { ... }
```

**Remplacer par** :
```javascript
const { compareObjectIds } = require('../utils/objectId');
if (!compareObjectIds(obj1.id, obj2.id)) { ... }
```

### 3. Utiliser les réponses standardisées

**Pattern à chercher** :
```javascript
res.status(200).json({ data: result, message: 'Success' });
res.status(400).json({ error: { message: 'Error' } });
```

**Remplacer par** :
```javascript
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Succès simple
successResponse(res, data, 'Message optionnel', 200);

// Erreur
errorResponse(res, 'Error message', 400, details);

// Pagination
paginatedResponse(res, items, { total, skip, limit, hasMore }, 'Message optionnel');
```

### 4. Utiliser asyncHandler pour éviter try/catch

**Pattern à chercher** :
```javascript
async function myFunction(req, res, next) {
  try {
    // code
  } catch (err) {
    next(err);
  }
}
```

**Remplacer par** :
```javascript
const asyncHandler = require('../utils/asyncHandler');

const myFunction = asyncHandler(async (req, res, next) => {
  // code (pas besoin de try/catch)
});
```

### 5. Utiliser extractId pour obtenir les IDs

**Pattern à chercher** :
```javascript
const id = obj._id?.toString() || obj.id?.toString();
```

**Remplacer par** :
```javascript
const { extractId } = require('../utils/objectId');
const id = extractId(obj);
```

---

## 📝 Exemple complet de refactoring

### AVANT
```javascript
async function listFiles(req, res, next) {
  try {
    const userId = req.user.id;
    const file = await FileModel.findById(id);
    
    const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    
    if (fileOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }
    
    console.log('File accessed:', file.name);
    res.status(200).json({ data: file });
  } catch (err) {
    console.error('Error:', err);
    next(err);
  }
}
```

### APRÈS
```javascript
const asyncHandler = require('../utils/asyncHandler');
const { compareObjectIds } = require('../utils/objectId');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const listFiles = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const file = await FileModel.findById(id);
  
  if (!compareObjectIds(file.owner_id, userId)) {
    return errorResponse(res, 'Access denied', 403);
  }
  
  logger.logInfo('File accessed', { fileName: file.name, userId });
  successResponse(res, file);
});
```

---

## ✅ Checklist par fichier

### backend/controllers/filesController.js
- [x] Importer logger, objectId utils, response utils
- [x] Remplacer console.log/error dans uploadMiddleware
- [ ] Remplacer toutes les comparaisons ObjectId
- [ ] Remplacer toutes les réponses par les utils
- [ ] Utiliser asyncHandler où possible

### backend/controllers/authController.js
- [ ] Remplacer console.log/error
- [ ] Utiliser les réponses standardisées
- [ ] Utiliser asyncHandler

### backend/controllers/oauthController.js
- [ ] Remplacer console.log/error
- [ ] Utiliser les réponses standardisées
- [ ] Utiliser asyncHandler

### backend/controllers/foldersController.js
- [ ] Remplacer console.log/error
- [ ] Utiliser compareObjectIds
- [ ] Utiliser les réponses standardisées

---

**Note** : Ce refactoring peut être fait progressivement, fichier par fichier.

