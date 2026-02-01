// Middlewares de sécurité supplémentaires
const mongoose = require('mongoose');
const path = require('path');
const { AppError } = require('./errorHandler');

/**
 * Valider qu'un ID est un ObjectId MongoDB valide
 */
function validateObjectId(req, res, next) {
  const idParams = ['id', 'file_id', 'folder_id', 'user_id', 'share_id'];
  
  for (const param of idParams) {
    if (req.params[param]) {
      const paramValue = req.params[param];
      const isValid = mongoose.Types.ObjectId.isValid(paramValue);
      
      if (!isValid) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`[validateObjectId] Invalid ${param} format`);
        }
        return res.status(400).json({
          error: {
            message: `Invalid ${param} format`,
            status: 400,
          },
        });
      }
    }
  }
  
  // Vérifier aussi dans le body pour certains endpoints
  if (req.body) {
    if (req.body.file_id && !mongoose.Types.ObjectId.isValid(req.body.file_id)) {
      return res.status(400).json({
        error: {
          message: 'Invalid file_id format',
          status: 400,
        },
      });
    }
    if (req.body.folder_id && !mongoose.Types.ObjectId.isValid(req.body.folder_id)) {
      return res.status(400).json({
        error: {
          message: 'Invalid folder_id format',
          status: 400,
        },
      });
    }
    if (req.body.shared_with_user_id && !mongoose.Types.ObjectId.isValid(req.body.shared_with_user_id)) {
      return res.status(400).json({
        error: {
          message: 'Invalid shared_with_user_id format',
          status: 400,
        },
      });
    }
  }
  
  next();
}

/**
 * Protection contre les path traversal attacks
 */
function sanitizePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }
  
  // Normaliser le chemin et résoudre les ../
  const normalized = path.normalize(filePath);
  
  // Vérifier qu'il n'y a pas de tentatives de sortie du répertoire autorisé
  if (normalized.includes('..')) {
    return null;
  }
  
  return normalized;
}

/**
 * Middleware pour valider et nettoyer les chemins de fichiers
 */
function validateFilePath(req, res, next) {
  if (req.file && req.file.path) {
    const sanitized = sanitizePath(req.file.path);
    if (!sanitized) {
      return res.status(400).json({
        error: {
          message: 'Invalid file path',
          status: 400,
        },
      });
    }
    req.file.path = sanitized;
  }
  
  if (req.body && req.body.file_path) {
    const sanitized = sanitizePath(req.body.file_path);
    if (!sanitized) {
      return res.status(400).json({
        error: {
          message: 'Invalid file path',
          status: 400,
        },
      });
    }
    req.body.file_path = sanitized;
  }
  
  next();
}

/**
 * Échappe les caractères spéciaux regex pour éviter injection NoSQL/ReDoS
 * À utiliser avant de passer une entrée utilisateur dans $regex
 */
function escapeRegexString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Nettoie et valide une chaîne de recherche (pour $regex)
 * Limite la longueur et échappe les caractères spéciaux
 */
function sanitizeSearchInput(str) {
  if (!str || typeof str !== 'string') return '';
  return escapeRegexString(str);
}

/** Champs autorisés pour le tri (anti-injection NoSQL) */
const ALLOWED_SORT_FIELDS = ['name', 'updated_at', 'created_at', 'size', 'mime_type'];

function sanitizePaginationSort(params) {
  const sortBy = (params.sort_by || params.sortBy || 'name').toString().toLowerCase();
  const sortOrder = (params.sort_order || params.sortOrder || 'asc').toString().toLowerCase();
  let skip = parseInt(params.skip, 10);
  let limit = parseInt(params.limit, 10);

  const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'name';
  const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  skip = isNaN(skip) || skip < 0 ? 0 : Math.min(skip, 10000);
  limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100);

  return { sortBy: safeSortBy, sortOrder: safeSortOrder, skip, limit };
}

/**
 * Protection contre les injections NoSQL
 * Nettoie les requêtes pour éviter les opérateurs MongoDB malveillants
 */
function sanitizeQuery(req, res, next) {
  // Liste des opérateurs MongoDB à bloquer
  const dangerousOperators = [
    '$where', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$regex',
    '$exists', '$type', '$mod', '$text', '$search', '$expr', '$jsonSchema',
    '$geoIntersects', '$geoWithin', '$near', '$nearSphere', '$elemMatch',
    '$size', '$all', '$elemMatch', '$comment'
  ];
  
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Bloquer les clés __proto__, constructor, prototype (prototype pollution)
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        continue;
      }
      // Bloquer les clés commençant par $ (opérateurs MongoDB malveillants)
      if (key.startsWith('$')) {
        continue;
      }
      // Bloquer les clés contenant . (accès NoSQL injection)
      if (key.includes('.')) {
        continue;
      }
      // Bloquer les opérateurs dangereux connus
      if (dangerousOperators.includes(key)) {
        continue;
      }
      
      // Récursivement nettoyer les objets imbriqués
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'object' && item !== null ? sanitizeObject(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };
  
  // Nettoyer req.query
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Nettoyer req.body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
}

/**
 * Valider les noms de fichiers et dossiers
 */
function validateFileName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  // Longueur maximale
  if (name.length > 255) {
    return false;
  }
  
  // Caractères interdits (Windows/Linux)
  const forbiddenChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (forbiddenChars.test(name)) {
    return false;
  }
  
  // Noms réservés Windows
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(name.toUpperCase())) {
    return false;
  }
  
  return true;
}

/**
 * Middleware pour valider les noms de fichiers/dossiers
 * NOTE: Ne bloque PAS les requêtes GET (pas de body.name)
 */
function validateName(req, res, next) {
  // Valider uniquement si c'est une requête avec body.name (POST, PATCH, etc.)
  if (req.body && req.body.name) {
    if (!validateFileName(req.body.name)) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[validateName] Invalid name');
      }
      return res.status(400).json({
        error: {
          message: 'Invalid file or folder name',
          status: 400,
        },
      });
    }
  }
  
  next();
}

module.exports = {
  validateObjectId,
  sanitizePath,
  validateFilePath,
  sanitizeQuery,
  escapeRegexString,
  sanitizeSearchInput,
  sanitizePaginationSort,
  validateFileName,
  validateName,
};


