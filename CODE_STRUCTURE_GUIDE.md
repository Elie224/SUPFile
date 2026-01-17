# Guide de Structure du Code - SUPFile

## 📋 Principes Généraux

### 1. Lisibilité
- Code clair et explicite
- Noms de variables/fonctions descriptifs
- Commentaires pour expliquer le "pourquoi", pas le "quoi"

### 2. Organisation
- Structure cohérente dans tous les fichiers
- Imports organisés par catégories
- Séparation logique des responsabilités

### 3. Documentation
- JSDoc pour toutes les fonctions publiques
- Commentaires pour logique complexe
- README pour chaque module si nécessaire

---

## 🏗️ Structure Standard d'un Fichier

### Backend (Node.js/Express)

```javascript
/**
 * Description du module/fichier
 * @module nomDuModule
 */

// ============================================================
// 1. IMPORTS - Organisés par catégories
// ============================================================

// - Imports Node.js natifs
const path = require('path');
const fs = require('fs').promises;

// - Imports tiers (packages npm)
const express = require('express');
const mongoose = require('mongoose');

// - Imports locaux (modules de l'application)
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

// ============================================================
// 2. CONSTANTES
// ============================================================

const MAX_FILE_SIZE = 32212254720; // 30 GB en bytes
const SALT_ROUNDS = 10;

// ============================================================
// 3. CONFIGURATION
// ============================================================

const storage = multer.diskStorage({
  // Configuration...
});

// ============================================================
// 4. FONCTIONS UTILITAIRES (si nécessaire)
// ============================================================

/**
 * Description de la fonction utilitaire
 * @param {string} param1 - Description du paramètre
 * @returns {Promise<Object>} Description du retour
 */
async function utilityFunction(param1) {
  // Logique...
}

// ============================================================
// 5. FONCTIONS PRINCIPALES / CONTROLLERS
// ============================================================

/**
 * Description de la fonction principale
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Promise<void>}
 */
async function mainFunction(req, res, next) {
  try {
    // Logique principale
    logger.logInfo('Action effectuée', { userId: req.user?.id });
    
    res.status(200).json({
      data: result,
      message: 'Succès'
    });
  } catch (error) {
    logger.logError(error, { context: 'mainFunction', userId: req.user?.id });
    next(error);
  }
}

// ============================================================
// 6. EXPORTS
// ============================================================

module.exports = {
  mainFunction,
  utilityFunction
};
```

---

## 📝 Conventions de Nommage

### Variables
- **camelCase** pour variables normales : `userId`, `filePath`
- **UPPER_SNAKE_CASE** pour constantes : `MAX_FILE_SIZE`, `SALT_ROUNDS`
- **descriptifs** : `userEmail` au lieu de `email`, `fileSize` au lieu de `size`

### Fonctions
- **verbe + nom** : `getUserById`, `createFile`, `updateQuota`
- **async** : toujours préfixer si asynchrone ou retourner Promise

### Classes
- **PascalCase** : `UserModel`, `FileController`

### Fichiers
- **camelCase.js** : `authController.js`, `userModel.js`

---

## 💬 Commentaires et Documentation

### JSDoc pour toutes les fonctions

```javascript
/**
 * Crée un nouvel utilisateur dans la base de données
 * @param {Object} userData - Données de l'utilisateur
 * @param {string} userData.email - Email de l'utilisateur (unique)
 * @param {string} userData.passwordHash - Hash du mot de passe (bcrypt)
 * @param {string} [userData.displayName] - Nom d'affichage (optionnel)
 * @returns {Promise<Object>} Objet utilisateur créé avec id, email, etc.
 * @throws {Error} Si l'email existe déjà ou erreur de validation
 * @example
 * const user = await createUser({ email: 'user@example.com', passwordHash: '...' });
 */
async function createUser(userData) {
  // ...
}
```

### Commentaires explicatifs

```javascript
// ✅ BON - Explique le "pourquoi"
// On attend 2 secondes pour laisser MongoDB établir la connexion
// avant de vérifier l'état, car readyState peut être temporairement 2
await new Promise(resolve => setTimeout(resolve, 2000));

// ❌ MAUVAIS - Dit juste "quoi"
// Attendre 2 secondes
await new Promise(resolve => setTimeout(resolve, 2000));
```

---

## 🔍 Logging

### Utiliser le logger, pas console.log

```javascript
// ✅ BON
logger.logInfo('File uploaded successfully', {
  fileId: file.id,
  userId: req.user.id,
  size: file.size
});

logger.logError(error, {
  context: 'uploadFile',
  userId: req.user?.id,
  fileName: req.file?.originalname
});

// ❌ MAUVAIS
console.log('File uploaded');
console.error(error);
```

---

## 🎯 Gestion d'Erreurs

### Utiliser AppError pour les erreurs applicatives

```javascript
// ✅ BON
if (!file) {
  throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
}

// ❌ MAUVAIS
if (!file) {
  throw new Error('File not found');
}
```

### Try/Catch avec contexte

```javascript
// ✅ BON
try {
  const result = await someOperation();
  logger.logInfo('Operation successful', { resultId: result.id });
} catch (error) {
  logger.logError(error, {
    context: 'someOperation',
    userId: req.user?.id,
    additionalData: relevantData
  });
  next(error);
}

// ❌ MAUVAIS
try {
  const result = await someOperation();
} catch (error) {
  console.error(error);
  next(error);
}
```

---

## 📦 Organisation des Imports

### Ordre standardisé

```javascript
// 1. Node.js core modules
const path = require('path');
const fs = require('fs').promises;

// 2. Packages npm (triés alphabétiquement)
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

// 3. Modules locaux - Config et utils en premier
const config = require('../config');
const logger = require('../utils/logger');

// 4. Modules locaux - Models
const UserModel = require('../models/userModel');
const FileModel = require('../models/fileModel');

// 5. Modules locaux - Middlewares
const { authMiddleware } = require('../middlewares/authMiddleware');
const { AppError } = require('../middlewares/errorHandler');

// 6. Modules locaux - Utilitaires spécifiques
const { generateToken } = require('../utils/jwt');
```

---

## 🎨 Formatage et Style

### Indentation
- **2 espaces** (pas de tabs)

### Lignes vides
- Ligne vide entre sections logiques
- Ligne vide avant return dans fonctions longues

### Parenthèses et accolades
```javascript
// ✅ BON
if (condition) {
  // Code
}

// Fonction avec plusieurs paramètres sur plusieurs lignes
function complexFunction(
  param1,
  param2,
  param3
) {
  // Code
}

// ❌ MAUVAIS
if(condition){
// Code
}
```

---

## 📚 Exemples par Type de Fichier

### Controller
```javascript
/**
 * Controller pour la gestion des fichiers
 * @module filesController
 */

const FileModel = require('../models/fileModel');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Upload un nouveau fichier
 * @param {Object} req - Requête Express
 * @param {Object} req.user - Utilisateur authentifié
 * @param {Object} req.file - Fichier uploadé (multer)
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
async function uploadFile(req, res, next) {
  try {
    // Validation
    if (!req.file) {
      throw new AppError('No file provided', 400, 'NO_FILE');
    }

    // Logique métier
    const file = await FileModel.create({
      // ...
    });

    logger.logInfo('File uploaded', {
      fileId: file.id,
      userId: req.user.id
    });

    res.status(201).json({
      data: { file },
      message: 'File uploaded successfully'
    });
  } catch (error) {
    logger.logError(error, {
      context: 'uploadFile',
      userId: req.user?.id
    });
    next(error);
  }
}

module.exports = { uploadFile };
```

### Model
```javascript
/**
 * Modèle de données pour les fichiers
 * @module fileModel
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schéma Mongoose
const FileSchema = new Schema({
  // ...
}, { timestamps: true });

const File = mongoose.models.File || mongoose.model('File', FileSchema);

/**
 * Crée un nouveau fichier
 * @param {Object} fileData - Données du fichier
 * @returns {Promise<Object>} Fichier créé
 */
async function create(fileData) {
  const file = new File(fileData);
  return await file.save();
}

module.exports = {
  create,
  // Autres méthodes...
};
```

---

## ✅ Checklist de Révision

Avant de commiter du code :

- [ ] Tous les `console.log/error` remplacés par `logger`
- [ ] JSDoc ajouté pour toutes les fonctions publiques
- [ ] Commentaires explicatifs pour logique complexe
- [ ] Noms de variables/fonctions clairs et descriptifs
- [ ] Imports organisés selon le standard
- [ ] Gestion d'erreurs avec AppError et logger
- [ ] Code formaté avec 2 espaces
- [ ] Pas de code commenté inutile
- [ ] Tests passent (si applicable)

---

**Date de création** : Décembre 2025
**Dernière mise à jour** : Décembre 2025