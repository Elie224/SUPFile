const bcrypt = require('bcryptjs');
const ShareModel = require('../models/shareModel');
const FileModel = require('../models/fileModel');
const FolderModel = require('../models/folderModel');
const { normalizePublicShareToken, normalizeSharePasswordForCompare } = require('../utils/shareSecurity');
const { getFrontendBaseUrl } = require('../utils/frontendUrl');
const foldersController = require('./foldersController');

function normalizeOptionalId(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseAndValidateExpiry(expires_at) {
  if (!expires_at) return null;

  let expiresAtDate;

  if (expires_at instanceof Date) {
    expiresAtDate = expires_at;
  } else if (typeof expires_at === 'string' && expires_at.trim() !== '') {
    expiresAtDate = new Date(expires_at.trim());
  } else {
    expiresAtDate = new Date(expires_at);
  }

  if (Number.isNaN(expiresAtDate.getTime())) {
    return { error: 'Format de date d\'expiration invalide' };
  }

  // Refuser les dates passées ou trop lointaines (anti-abus / cohérence)
  const now = Date.now();
  if (expiresAtDate.getTime() < now) {
    return { error: 'La date d\'expiration doit être dans le futur' };
  }
  const maxFutureMs = 5 * 365 * 24 * 60 * 60 * 1000; // 5 ans
  if (expiresAtDate.getTime() > now + maxFutureMs) {
    return { error: 'La date d\'expiration est trop éloignée dans le futur' };
  }

  return { value: expiresAtDate };
}

// Créer un partage public
async function createPublicShare(req, res, next) {
  try {
    const userId = req.user.id;
    const body = req.validatedBody || req.body;
    const { file_id, folder_id, password, expires_at } = body;

    const fileId = normalizeOptionalId(file_id);
    const folderId = normalizeOptionalId(folder_id);

    if (!fileId && !folderId) {
      return res.status(400).json({ error: { message: 'Vous devez fournir file_id ou folder_id.' } });
    }

    // Vérifier la propriété
    if (fileId) {
      const file = await FileModel.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: { message: 'Fichier introuvable.' } });
      }
      const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      if (fileOwnerId !== userOwnerId) {
        return res.status(403).json({ error: { message: 'Accès refusé.' } });
      }
    }

    if (folderId) {
      const folder = await FolderModel.findById(folderId);
      if (!folder) {
        return res.status(404).json({ error: { message: 'Dossier introuvable.' } });
      }
      const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      if (folderOwnerId !== userOwnerId) {
        return res.status(403).json({ error: { message: 'Accès refusé.' } });
      }
    }

    // Hasher le mot de passe si fourni
    let passwordHash = null;
    if (password && typeof password === 'string' && password.trim() !== '') {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const expiry = parseAndValidateExpiry(expires_at);
    if (expiry?.error) {
      return res.status(400).json({ error: { message: expiry.error } });
    }
    const expiresAtDate = expiry?.value || null;

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
        share_url: `${getFrontendBaseUrl(req)}/share/${share.public_token}`,
      },
      message: 'Partage créé',
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
      if (!file) {
        return res.status(404).json({ error: { message: 'File not found' } });
      }
      const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      if (fileOwnerId !== userOwnerId) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }
    }

    if (folder_id) {
      const folder = await FolderModel.findById(folder_id);
      if (!folder) {
        return res.status(404).json({ error: { message: 'Folder not found' } });
      }
      const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      if (folderOwnerId !== userOwnerId) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }
    }

    const share = await ShareModel.createInternalShare({
      fileId: file_id,
      folderId: folder_id,
      createdById: userId,
      sharedWithUserId: shared_with_user_id,
    });

    res.status(201).json({ data: share, message: 'Partage créé' });
  } catch (err) {
    next(err);
  }
}

// Accéder à un partage public (sans authentification)
async function getPublicShare(req, res, next) {
  try {
    const token = normalizePublicShareToken(req.params.token);
    if (!token) {
      return res.status(404).json({ error: { message: 'Share not found or expired' } });
    }

    let password = req.query.password; // Récupérer depuis query string pour GET
    if (password !== undefined && password !== null) {
      const normalized = normalizeSharePasswordForCompare(password);
      if (!normalized) {
        return res.status(400).json({ error: { message: 'Invalid password format' } });
      }
      password = normalized;
    }

    const mongoose = require('mongoose');
    const Share = mongoose.models.Share;
    const shareDoc = await Share.findOne({ public_token: token }).lean();
    if (!shareDoc) {
      return res.status(404).json({ error: { message: 'Share not found or expired' } });
    }

    // Vérifier si le partage est expiré
    if (shareDoc.expires_at && new Date(shareDoc.expires_at) < new Date()) {
      return res.status(410).json({ error: { message: 'Share expired' } });
    }

    // Vérifier si le partage est désactivé
    if (shareDoc.is_active === false) {
      return res.status(403).json({ error: { message: 'Share deactivated' } });
    }

    const share = ShareModel.toDTO(shareDoc);

    // Vérifier le mot de passe si requis
    if (shareDoc.password_hash) {
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
      const isValid = await bcrypt.compare(password, shareDoc.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: { message: 'Invalid password' } });
      }
    }

    // Récupérer les détails du fichier ou dossier
    let resource = null;
    if (shareDoc.file_id) {
      resource = await FileModel.findById(shareDoc.file_id);
      if (!resource) {
        return res.status(404).json({ error: { message: 'File not found' } });
      }
      resource.type = 'file';
    } else if (shareDoc.folder_id) {
      resource = await FolderModel.findById(shareDoc.folder_id);
      if (!resource) {
        return res.status(404).json({ error: { message: 'Folder not found' } });
      }
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

// Télécharger un partage public
// - fichier : redirection vers /api/files/:id/download?token=... (+ password)
// - dossier : ZIP streaming via foldersController.downloadFolderZip (en se faisant passer pour le propriétaire)
async function downloadPublicShare(req, res, next) {
  try {
    const token = normalizePublicShareToken(req.params.token);
    if (!token) {
      return res.status(404).json({ error: { message: 'Share not found or expired' } });
    }

    let password = req.query.password;
    if (password !== undefined && password !== null) {
      const normalized = normalizeSharePasswordForCompare(password);
      if (!normalized) {
        return res.status(400).json({ error: { message: 'Invalid password format' } });
      }
      password = normalized;
    }

    const mongoose = require('mongoose');
    const Share = mongoose.models.Share;
    const shareDoc = await Share.findOne({ public_token: token }).lean();
    if (!shareDoc) {
      return res.status(404).json({ error: { message: 'Share not found or expired' } });
    }

    if (shareDoc.expires_at && new Date(shareDoc.expires_at) < new Date()) {
      return res.status(410).json({ error: { message: 'Share expired' } });
    }

    if (shareDoc.is_active === false) {
      return res.status(403).json({ error: { message: 'Share deactivated' } });
    }

    if (shareDoc.password_hash) {
      if (!password) {
        return res.status(401).json({
          error: { message: 'Password required' },
          requires_password: true,
        });
      }
      const isValid = await bcrypt.compare(password, shareDoc.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: { message: 'Invalid password' }, requires_password: true });
      }
    }

    await ShareModel.incrementAccessCount(token);

    if (shareDoc.file_id) {
      const qs = new URLSearchParams({ token });
      if (password) qs.set('password', String(password));
      return res.redirect(302, `/api/files/${encodeURIComponent(String(shareDoc.file_id))}/download?${qs.toString()}`);
    }

    if (shareDoc.folder_id) {
      // createPublicShare valide que le créateur est propriétaire => created_by_id est autorisé par downloadFolderZip.
      req.user = { id: shareDoc.created_by_id?.toString ? shareDoc.created_by_id.toString() : String(shareDoc.created_by_id) };
      req.params.id = shareDoc.folder_id?.toString ? shareDoc.folder_id.toString() : String(shareDoc.folder_id);
      return foldersController.downloadFolderZip(req, res, next);
    }

    return res.status(404).json({ error: { message: 'Share not found or expired' } });
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
      shares = await ShareModel.findByCreator(userId, { type });
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
  downloadPublicShare,
  listShares,
  deactivateShare,
};

