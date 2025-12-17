const UserModel = require('../models/userModel');
const FileModel = require('../models/fileModel');
const FolderModel = require('../models/folderModel');

// Obtenir les statistiques du dashboard
async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Calculer la répartition par type
    const allFiles = await FileModel.findByOwner(userId, null, false);
    
    const breakdown = {
      images: 0,
      videos: 0,
      documents: 0,
      audio: 0,
      other: 0,
    };

    for (const file of allFiles) {
      if (file.mime_type?.startsWith('image/')) {
        breakdown.images += file.size;
      } else if (file.mime_type?.startsWith('video/')) {
        breakdown.videos += file.size;
      } else if (file.mime_type?.startsWith('audio/')) {
        breakdown.audio += file.size;
      } else if (
        file.mime_type?.includes('pdf') ||
        file.mime_type?.includes('document') ||
        file.mime_type?.includes('text') ||
        file.mime_type?.includes('spreadsheet')
      ) {
        breakdown.documents += file.size;
      } else {
        breakdown.other += file.size;
      }
    }

    // Récupérer les 5 derniers fichiers modifiés
    const recentFiles = allFiles
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5);

    // Calculer le pourcentage avec gestion des cas limites
    const quotaUsed = user.quota_used || 0;
    const quotaLimit = user.quota_limit || 32212254720; // 30 Go par défaut si non défini
    // Calculer le pourcentage brut (avec décimales)
    const rawPercentage = quotaLimit > 0 && quotaUsed > 0 
      ? (quotaUsed / quotaLimit) * 100 
      : 0;
    // Pour l'affichage, arrondir à 2 décimales si < 1%, sinon arrondir à l'entier
    const percentageDisplay = rawPercentage < 1 
      ? Math.max(0.01, parseFloat(rawPercentage.toFixed(2)))
      : Math.round(rawPercentage);
    
    res.status(200).json({
      data: {
        quota: {
          used: quotaUsed,
          limit: quotaLimit,
          available: Math.max(0, quotaLimit - quotaUsed),
          percentage: percentageDisplay,
          percentageRaw: rawPercentage, // Pourcentage brut pour la barre de progression
        },
        breakdown: {
          images: breakdown.images,
          videos: breakdown.videos,
          documents: breakdown.documents,
          audio: breakdown.audio,
          other: breakdown.other,
          total: breakdown.images + breakdown.videos + breakdown.documents + breakdown.audio + breakdown.other,
        },
        recent_files: recentFiles,
        total_files: allFiles.length,
        total_folders: (await FolderModel.findByOwner(userId, null, false)).length,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
};

