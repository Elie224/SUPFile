// Utilitaires pour la gestion des ObjectIds MongoDB
// Évite la duplication de code pour les comparaisons d'ObjectId

const mongoose = require('mongoose');

/**
 * Convertir une valeur en ObjectId
 * @param {string|ObjectId} value - Valeur à convertir
 * @returns {ObjectId|null} - ObjectId ou null si invalide
 */
function toObjectId(value) {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;
  }
  return null;
}

/**
 * Comparer deux ObjectIds de manière sécurisée
 * @param {string|ObjectId} id1 - Premier ID
 * @param {string|ObjectId} id2 - Deuxième ID
 * @returns {boolean} - True si égaux
 */
function compareObjectIds(id1, id2) {
  if (!id1 || !id2) return false;
  
  // Convertir en string pour comparaison
  const str1 = id1?.toString ? id1.toString() : String(id1);
  const str2 = id2?.toString ? id2.toString() : String(id2);
  
  return str1 === str2;
}

/**
 * Valider qu'une valeur est un ObjectId valide
 * @param {any} value - Valeur à valider
 * @returns {boolean} - True si valide
 */
function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

/**
 * Extraire l'ID d'un objet (supporte _id et id)
 * @param {object} obj - Objet contenant l'ID
 * @returns {string|null} - ID en string ou null
 */
function extractId(obj) {
  if (!obj) return null;
  if (obj._id) return obj._id.toString();
  if (obj.id) return typeof obj.id === 'string' ? obj.id : obj.id.toString();
  return null;
}

module.exports = {
  toObjectId,
  compareObjectIds,
  isValidObjectId,
  extractId,
};

