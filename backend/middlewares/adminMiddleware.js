const UserModel = require('../models/userModel');

/**
 * Middleware pour vérifier que l'utilisateur est administrateur
 */
async function adminMiddleware(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: { message: 'Non authentifié' }
      });
    }

    const user = await UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'Utilisateur non trouvé' }
      });
    }

    if (!user.is_admin) {
      return res.status(403).json({
        error: { message: 'Accès refusé. Droits administrateur requis.' }
      });
    }

    // Ajouter les infos admin à req.user
    req.user.is_admin = true;
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    return res.status(500).json({
      error: { message: 'Erreur lors de la vérification des droits administrateur' }
    });
  }
}

module.exports = adminMiddleware;

