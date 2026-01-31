const UserModel = require('../models/userModel');
const FileModel = require('../models/fileModel');
const FolderModel = require('../models/folderModel');
const { calculateRealQuotaUsed, syncQuotaUsed } = require('../utils/quota');

// Obtenir les statistiques du dashboard
async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Utiliser des agrégations MongoDB pour meilleures performances
    const mongoose = require('mongoose');
    const File = mongoose.models.File || mongoose.model('File');
    const Folder = mongoose.models.Folder || mongoose.model('Folder');
    const ownerObjectId = new mongoose.Types.ObjectId(userId);

    // Calculer la répartition par type avec agrégation MongoDB (plus rapide)
    const breakdownAggregation = await File.aggregate([
      { $match: { owner_id: ownerObjectId, is_deleted: false } },
      {
        $group: {
          _id: null,
          images: {
            $sum: {
              $cond: [{ $regexMatch: { input: '$mime_type', regex: '^image/' } }, '$size', 0]
            }
          },
          videos: {
            $sum: {
              $cond: [{ $regexMatch: { input: '$mime_type', regex: '^video/' } }, '$size', 0]
            }
          },
          audio: {
            $sum: {
              $cond: [{ $regexMatch: { input: '$mime_type', regex: '^audio/' } }, '$size', 0]
            }
          },
          documents: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $regexMatch: { input: '$mime_type', regex: 'pdf' } },
                    { $regexMatch: { input: '$mime_type', regex: 'document' } },
                    { $regexMatch: { input: '$mime_type', regex: 'text' } },
                    { $regexMatch: { input: '$mime_type', regex: 'spreadsheet' } }
                  ]
                },
                '$size',
                0
              ]
            }
          },
          total: { $sum: '$size' }
        }
      }
    ]);

    const breakdown = breakdownAggregation[0] || {
      images: 0,
      videos: 0,
      documents: 0,
      audio: 0,
      total: 0
    };
    breakdown.other = breakdown.total - breakdown.images - breakdown.videos - breakdown.documents - breakdown.audio;

    // Récupérer les 5 derniers fichiers modifiés avec requête optimisée
    const recentFiles = await File.find({ owner_id: ownerObjectId, is_deleted: false })
      .sort({ updated_at: -1 })
      .limit(5)
      .select('name size mime_type updated_at')
      .lean()
      .hint({ owner_id: 1, is_deleted: 1, updated_at: -1 });

    // Compter les fichiers et dossiers avec countDocuments (plus rapide)
    const [totalFiles, totalFolders] = await Promise.all([
      File.countDocuments({ owner_id: ownerObjectId, is_deleted: false }),
      Folder.countDocuments({ owner_id: ownerObjectId, is_deleted: false })
    ]);

    // Calculer le quota utilisé depuis les fichiers réels (toujours à jour)
    // Cela garantit que le pourcentage est toujours correct
    const quotaUsedReal = await calculateRealQuotaUsed(userId);
    
    // Synchroniser le quota_used dans la base de données avec la réalité
    // Si la différence est significative (> 1KB), synchroniser
    const storedQuotaUsed = user.quota_used || 0;
    if (Math.abs(quotaUsedReal - storedQuotaUsed) > 1024) {
      await syncQuotaUsed(userId);
    }

    // Utiliser le quota réel pour les calculs (toujours précis)
    const quotaUsed = Number(quotaUsedReal) || 0;
    const quotaLimit = Number(user.quota_limit) || 32212254720; // 30 Go par défaut si non défini
    // Calculer le pourcentage brut : plafonné à 100 %, pas de division par zéro
    const rawPercentage = quotaLimit > 0 && quotaUsed >= 0
      ? Math.min(100, (quotaUsed / quotaLimit) * 100)
      : 0;
    const safeRaw = Number.isFinite(rawPercentage) ? rawPercentage : 0;
    // Pour l'affichage : 2 décimales si < 1 %, sinon entier
    const percentageDisplay = quotaUsed === 0 ? 0 : (safeRaw < 1
      ? Math.max(0, parseFloat(safeRaw.toFixed(2)))
      : Math.round(safeRaw));
    
    res.status(200).json({
      data: {
        quota: {
          used: quotaUsed,
          limit: quotaLimit,
          available: Math.max(0, quotaLimit - quotaUsed),
          percentage: percentageDisplay,
          percentageRaw: safeRaw, // Pourcentage brut pour la barre de progression (0–100)
        },
        breakdown: {
          images: breakdown.images,
          videos: breakdown.videos,
          documents: breakdown.documents,
          audio: breakdown.audio,
          other: breakdown.other,
          total: breakdown.images + breakdown.videos + breakdown.documents + breakdown.audio + breakdown.other,
        },
        recent_files: recentFiles.map(f => ({
          id: f._id.toString(),
          name: f.name,
          size: f.size,
          mime_type: f.mime_type,
          updated_at: f.updated_at,
        })),
        total_files: totalFiles,
        total_folders: totalFolders,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
};

