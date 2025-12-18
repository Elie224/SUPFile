// Utilitaires pour la gestion du quota utilisateur
// Assure la synchronisation entre quota_used et la taille réelle des fichiers

const FileModel = require('../models/fileModel');
const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Calculer la taille totale réelle des fichiers d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<number>} - Taille totale en bytes
 */
async function calculateRealQuotaUsed(userId) {
  try {
    const File = mongoose.models.File || mongoose.model('File');
    const ownerObjectId = new mongoose.Types.ObjectId(userId);
    
    const result = await File.aggregate([
      { $match: { owner_id: ownerObjectId, is_deleted: false } },
      { $group: { _id: null, total: { $sum: '$size' } } }
    ]);
    
    return result[0]?.total || 0;
  } catch (error) {
    logger.error('Error calculating real quota used:', error);
    return 0;
  }
}

/**
 * Synchroniser le quota_used avec la taille réelle des fichiers
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<number>} - Taille réelle calculée
 */
async function syncQuotaUsed(userId) {
  try {
    const realQuotaUsed = await calculateRealQuotaUsed(userId);
    const User = mongoose.models.User || mongoose.model('User');
    
    await User.findByIdAndUpdate(userId, { quota_used: realQuotaUsed });
    
    logger.info(`Quota synced for user ${userId}: ${realQuotaUsed} bytes`);
    return realQuotaUsed;
  } catch (error) {
    logger.error('Error syncing quota used:', error);
    throw error;
  }
}

/**
 * Mettre à jour le quota après une opération sur les fichiers
 * @param {string} userId - ID de l'utilisateur
 * @param {number} sizeChange - Changement de taille (positif pour ajout, négatif pour suppression)
 * @returns {Promise<number>} - Nouveau quota utilisé
 */
async function updateQuotaAfterOperation(userId, sizeChange) {
  try {
    const User = mongoose.models.User || mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Calculer le nouveau quota utilisé
    const currentQuotaUsed = user.quota_used || 0;
    const newQuotaUsed = Math.max(0, currentQuotaUsed + sizeChange);
    
    // Mettre à jour dans la base de données
    await User.findByIdAndUpdate(userId, { quota_used: newQuotaUsed });
    
    logger.debug(`Quota updated for user ${userId}: ${currentQuotaUsed} -> ${newQuotaUsed} (change: ${sizeChange > 0 ? '+' : ''}${sizeChange})`);
    return newQuotaUsed;
  } catch (error) {
    logger.error('Error updating quota after operation:', error);
    // En cas d'erreur, synchroniser depuis les fichiers réels
    return await syncQuotaUsed(userId);
  }
}

/**
 * Vérifier et corriger le quota si nécessaire
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<{synced: boolean, realQuota: number, storedQuota: number}>}
 */
async function verifyAndFixQuota(userId) {
  try {
    const realQuotaUsed = await calculateRealQuotaUsed(userId);
    const User = mongoose.models.User || mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const storedQuotaUsed = user.quota_used || 0;
    const difference = Math.abs(realQuotaUsed - storedQuotaUsed);
    
    // Si la différence est significative (> 1KB), synchroniser
    if (difference > 1024) {
      await User.findByIdAndUpdate(userId, { quota_used: realQuotaUsed });
      logger.warn(`Quota corrected for user ${userId}: ${storedQuotaUsed} -> ${realQuotaUsed} (difference: ${difference} bytes)`);
      return {
        synced: true,
        realQuota: realQuotaUsed,
        storedQuota: storedQuotaUsed,
        difference,
      };
    }
    
    return {
      synced: false,
      realQuota: realQuotaUsed,
      storedQuota: storedQuotaUsed,
      difference,
    };
  } catch (error) {
    logger.error('Error verifying quota:', error);
    throw error;
  }
}

module.exports = {
  calculateRealQuotaUsed,
  syncQuotaUsed,
  updateQuotaAfterOperation,
  verifyAndFixQuota,
};

