const bcrypt = require('bcryptjs');
const ShareModel = require('../models/shareModel');
const FileModel = require('../models/fileModel');
const FolderModel = require('../models/folderModel');
const { AppError } = require('../middlewares/errorHandler');

// Créer un partage public
async function createPublicShare(req, res, next) {
  try {
    const userId = req.user.id;
    const body = req.validatedBody || req.body;
    const { file_id, folder_id, password, expires_at } = body;

    // Nettoyer les valeurs vides (vérifier que c'est une string avant trim)
    const fileId = (file_id && typeof file_id === 'string' && file_id.trim() !== '') || (file_id && typeof file_id !== 'string') ? file_id : null;
    const folderId = (folder_id && typeof folder_id === 'string' && folder_id.trim() !== '') || (folder_id && typeof folder_id !== 'string') ? folder_id : null;

    if (!fileId && !folderId) {
      return res.status(400).json({ error: { message: 'Either file_id or folder_id is required' } });
    }

    // Vérifier la propriété
    if (fileId) {
      const file = await FileModel.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: { message: 'File not found' } });
      }
      const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      if (fileOwnerId !== userOwnerId) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }
    }

    if (folderId) {
      const folder = await FolderModel.findById(folderId);
      if (!folder) {
        return res.status(404).json({ error: { message: 'Folder not found' } });
      }
      const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      if (folderOwnerId !== userOwnerId) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }
    }

    // Hasher le mot de passe si fourni
    let passwordHash = null;
    if (password && typeof password === 'string' && password.trim() !== '') {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    // Parser la date d'expiration
    let expiresAtDate = null;
    if (expires_at) {
      // Si c'est déjà une Date, l'utiliser directement
      if (expires_at instanceof Date) {
        expiresAtDate = expires_at;
      } 
      // Si c'est une string, la parser
      else if (typeof expires_at === 'string' && expires_at.trim() !== '') {
        expiresAtDate = new Date(expires_at.trim());
        if (isNaN(expiresAtDate.getTime())) {
          return res.status(400).json({ error: { message: 'Invalid expiration date format' } });
        }
      }
      // Sinon, essayer de créer une Date
      else {
        expiresAtDate = new Date(expires_at);
        if (isNaN(expiresAtDate.getTime())) {
          return res.status(400).json({ error: { message: 'Invalid expiration date format' } });
        }
      }
    }

    const share = await ShareModel.createPublicShare({
      fileId: fileId,
      folderId: folderId,
      createdById: userId,
      password: passwordHash,
      expiresAt: expiresAtDate,
    });

    res.status(201).json({
      data: {
        ...share,
        share_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${share.public_token}`,
      },
      message: 'Share created',
    });
  } catch (err) {
    next(err);
  }
}

// Créer un partage interne
async function createInternalShare(req, res, next) {
  try {
    const userId = req.user.id;
    const { file_id, folder_id, shared_with_user_id } = req.body;

    if (!file_id && !folder_id) {
      return res.status(400).json({ error: { message: 'Either file_id or folder_id is required' } });
    }

    if (!shared_with_user_id) {
      return res.status(400).json({ error: { message: 'shared_with_user_id is required' } });
    }

    // Vérifier la propriété
    if (file_id) {
      const file = await FileModel.findById(file_id);
      if (!file || file.owner_id !== userId) {
        return res.status(404).json({ error: { message: 'File not found' } });
      }
    }

    if (folder_id) {
      const folder = await FolderModel.findById(folder_id);
      if (!folder || folder.owner_id !== userId) {
        return res.status(404).json({ error: { message: 'Folder not found' } });
      }
    }

    const share = await ShareModel.createInternalShare({
      fileId: file_id,
      folderId: folder_id,
      createdById: userId,
      sharedWithUserId: shared_with_user_id,
    });

    res.status(201).json({ data: share, message: 'Share created' });
  } catch (err) {
    next(err);
  }
}

// Accéder à un partage public (sans authentification)
async function getPublicShare(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.query; // Récupérer depuis query string pour GET

    const share = await ShareModel.findByToken(token);
    if (!share) {
      return res.status(404).json({ error: { message: 'Share not found or expired' } });
    }

    // Vérifier si le partage est expiré
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).json({ error: { message: 'Share expired' } });
    }

    // Vérifier si le partage est désactivé
    if (share.is_active === false) {
      return res.status(403).json({ error: { message: 'Share deactivated' } });
    }

    // Vérifier le mot de passe si requis
    if (share.password_hash) {
      if (!password) {
        return res.status(401).json({ 
          error: { message: 'Password required' },
          requires_password: true,
          share: {
            id: share._id || share.id,
            public_token: share.public_token,
            requires_password: true,
          }
        });
      }
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(password, share.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: { message: 'Invalid password' } });
      }
    }

    // Récupérer les détails du fichier ou dossier
    let resource = null;
    if (share.file_id) {
      resource = await FileModel.findById(share.file_id);
      resource.type = 'file';
    } else if (share.folder_id) {
      resource = await FolderModel.findById(share.folder_id);
      resource.type = 'folder';
    }

    // Incrémenter le compteur d'accès
    await ShareModel.incrementAccessCount(token);

    res.status(200).json({
      data: {
        share,
        resource,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Lister les partages de l'utilisateur
async function listShares(req, res, next) {
  try {
    const userId = req.user.id;
    const { type } = req.query; // 'public' ou 'internal'

    let shares = [];
    if (type === 'internal') {
      shares = await ShareModel.findBySharedWith(userId);
    } else {
      // Partages créés par l'utilisateur
      const fileShares = await ShareModel.findByFileOrFolder(null, null);
      shares = fileShares.filter(s => s.created_by_id === userId);
    }

    res.status(200).json({ data: shares });
  } catch (err) {
    next(err);
  }
}

// Désactiver un partage
async function deactivateShare(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const share = await ShareModel.findById(id);
    if (!share) {
      return res.status(404).json({ error: { message: 'Share not found' } });
    }

    // Vérifier que c'est le créateur du partage
    const mongoose = require('mongoose');
    if (share.created_by_id.toString() !== userId && share.created_by_id !== userId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    await ShareModel.deactivate(id);
    res.status(200).json({ message: 'Share deactivated' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPublicShare,
  createInternalShare,
  getPublicShare,
  listShares,
  deactivateShare,
};

