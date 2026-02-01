const FolderModel = require('../models/folderModel');
const FileModel = require('../models/fileModel');
const ShareModel = require('../models/shareModel');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs').promises;
const { calculateRealQuotaUsed, syncQuotaUsed, updateQuotaAfterOperation } = require('../utils/quota');

// Lister les dossiers (GET /api/folders?parent_id=xxx)
async function listFolders(req, res, next) {
  try {
    const userId = req.user.id;
    let parentId = req.query.parent_id === 'root' || req.query.parent_id === '' || !req.query.parent_id
      ? null
      : req.query.parent_id;

    // Anti-injection / DoS : parent_id doit être null ou un ObjectId valide (sinon findByOwner lance)
    if (parentId != null && (typeof parentId !== 'string' || parentId.length !== 24 || !require('mongoose').Types.ObjectId.isValid(parentId))) {
      return res.status(400).json({ error: { message: 'Invalid parent_id format' } });
    }

    const folders = await FolderModel.findByOwner(userId, parentId, false);

    // À la racine : ajouter les dossiers partagés avec moi
    if (parentId === null) {
      const internalShares = await ShareModel.findBySharedWith(userId);
      const folderShareIds = internalShares
        .filter(s => s.folder_id)
        .map(s => s.folder_id.toString());
      const uniqueFolderIds = [...new Set(folderShareIds)];
      if (uniqueFolderIds.length > 0) {
        const sharedFolders = await Promise.all(
          uniqueFolderIds.map(fid => FolderModel.findById(fid))
        );
        const validShared = sharedFolders.filter(Boolean);
        const sharedWithMe = validShared.map(f => ({ ...f, shared_with_me: true }));
        folders.push(...sharedWithMe);
      }
    }

    res.status(200).json({ data: folders });
  } catch (err) {
    next(err);
  }
}

// Créer un dossier
async function createFolder(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, parent_id } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: { message: 'Folder name is required' } });
    }

    let parentId = parent_id || null;

    if (parentId != null && (typeof parentId !== 'string' || !require('mongoose').Types.ObjectId.isValid(parentId))) {
      return res.status(400).json({ error: { message: 'Invalid parent_id format' } });
    }

    // Vérifier le dossier parent s'il est spécifié
    if (parentId) {
      const parent = await FolderModel.findById(parentId);
      if (!parent) {
        return res.status(404).json({ error: { message: 'Parent folder not found' } });
      }
      
      // Comparer les ObjectId correctement
      const parentOwnerId = parent.owner_id?.toString ? parent.owner_id.toString() : parent.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      
      if (parentOwnerId !== userOwnerId) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }
    } else {
      // Créer ou récupérer le dossier racine si nécessaire
      let rootFolder = await FolderModel.findRootFolder(userId);
      if (!rootFolder) {
        rootFolder = await FolderModel.create({ name: 'Root', ownerId: userId, parentId: null });
      }
    }

    const folder = await FolderModel.create({ name: name.trim(), ownerId: userId, parentId });
    res.status(201).json({ data: folder, message: 'Folder created' });
  } catch (err) {
    next(err);
  }
}

// Renommer un dossier
async function updateFolder(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, parent_id } = req.body;

    const folder = await FolderModel.findById(id);
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } });
    }

    // Comparer les ObjectId correctement
    const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    
    if (folderOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (parent_id !== undefined) {
      if (parent_id != null && parent_id !== '') {
        if (typeof parent_id !== 'string' || !require('mongoose').Types.ObjectId.isValid(parent_id)) {
          return res.status(400).json({ error: { message: 'Invalid parent_id format' } });
        }
        const parent = await FolderModel.findById(parent_id);
        if (!parent) {
          return res.status(404).json({ error: { message: 'Parent folder not found' } });
        }
        
        // Comparer les ObjectId correctement
        const parentOwnerId = parent.owner_id?.toString ? parent.owner_id.toString() : parent.owner_id;
        if (parentOwnerId !== userOwnerId) {
          return res.status(403).json({ error: { message: 'Access denied' } });
        }
        // Vérifier qu'on ne crée pas de boucle
        if (parent_id === id) {
          return res.status(400).json({ error: { message: 'Cannot move folder into itself' } });
        }
      }
      updates.parent_id = parent_id || null;
    }

    const updated = await FolderModel.update(id, updates);
    res.status(200).json({ data: updated, message: 'Folder updated' });
  } catch (err) {
    next(err);
  }
}

// Supprimer définitivement un dossier et son contenu (fichiers + sous-dossiers)
async function permanentDeleteFolder(userId, folderId) {
  const filesInFolder = await FileModel.findByFolder(folderId, true);
  for (const f of filesInFolder) {
    if (f.file_path) {
      try {
        await fs.unlink(path.resolve(f.file_path));
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Could not remove file from disk:', f.file_path, e?.message);
        }
      }
    }
    await FileModel.delete(f.id);
    await updateQuotaAfterOperation(userId, -(f.size || 0));
  }

  const subfolders = await FolderModel.findByOwner(userId, folderId, true);
  for (const sub of subfolders) {
    await permanentDeleteFolder(userId, sub.id);
  }
  await FolderModel.delete(folderId);
}

// Supprimer un dossier : soft delete (corbeille) ou hard delete si déjà en corbeille
async function deleteFolder(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const folder = await FolderModel.findByIdIncludeDeleted(id);
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } });
    }

    const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    if (folderOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    if (folder.is_deleted) {
      await permanentDeleteFolder(userId, id);
      await syncQuotaUsed(userId);
    } else {
      await FolderModel.softDelete(id);
      await syncQuotaUsed(userId);
    }

    const { invalidateUserCache } = require('../utils/cache');
    invalidateUserCache(userId);
    res.status(200).json({ message: 'Folder deleted' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error deleting folder:', err);
    }
    next(err);
  }
}

// Télécharger un dossier en ZIP (authentifié ou partage public avec token)
async function downloadFolder(req, res, next) {
  try {
    const userId = req.user?.id ?? req.user?._id;
    const { id } = req.params;
    const { token, password } = req.query;
    const mongoose = require('mongoose');

    if (!id || typeof id !== 'string' || id.length !== 24 || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: { message: 'Invalid folder ID format' } });
    }
    let folderId;
    try {
      folderId = new mongoose.Types.ObjectId(id);
    } catch {
      return res.status(400).json({ error: { message: 'Invalid folder ID format' } });
    }

    const folder = await FolderModel.findById(folderId);
    if (!folder) {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: { message: 'Database connection error' } });
      }
      return res.status(404).json({ error: { message: 'Folder not found' } });
    }

    const folderOwnerId = String(folder.owner_id || '');
    let hasAccess = false;
    if (userId && String(userId) === folderOwnerId) {
      hasAccess = true;
    }
    if (!hasAccess && token) {
      const share = await ShareModel.findByToken(token);
      if (share) {
        const shareFolderId = share.folder_id?.toString ? share.folder_id.toString() : share.folder_id;
        const idStr = id.toString ? id.toString() : id;
        if (shareFolderId === idStr) {
          if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return res.status(410).json({ error: { message: 'Share expired' } });
          }
          if (share.is_active === false) {
            return res.status(403).json({ error: { message: 'Share deactivated' } });
          }
          if (share.password_hash) {
            if (!password) return res.status(401).json({ error: { message: 'Password required' } });
            const bcrypt = require('bcryptjs');
            const isValid = await bcrypt.compare(password, share.password_hash);
            if (!isValid) return res.status(401).json({ error: { message: 'Invalid password' } });
          }
          hasAccess = true;
        }
      }
    }
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    async function getAllFiles(fid, basePath = '') {
      const files = await FileModel.findByFolder(fid, false);
      const subfolders = await FolderModel.findByOwner(folderOwnerId, fid, false);
      const result = [];
      for (const file of files) {
        result.push({ ...file, path: `${basePath}/${file.name}` });
      }
      for (const sub of subfolders) {
        const subFiles = await getAllFiles(sub.id, `${basePath}/${sub.name}`);
        result.push(...subFiles);
      }
      return result;
    }

    const allFiles = await getAllFiles(id, folder.name);
    if (allFiles.length === 0) {
      return res.status(400).json({ error: { message: 'Folder is empty' } });
    }

    // Un seul passage : ne garder que les fichiers présents sur le disque (évite double boucle + accélère)
    const filesToZip = [];
    for (const file of allFiles) {
      try {
        await fs.access(file.file_path);
        filesToZip.push(file);
      } catch {
        // ignoré
      }
    }
    if (filesToZip.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Le dossier ne contient aucun fichier accessible sur le serveur.',
          code: 'FOLDER_EMPTY_OR_ORPHANED'
        }
      });
    }

    // CORS explicite pour les réponses streamées (le middleware peut ne pas s'appliquer)
    const origin = req.get('Origin') || '';
    const allowed = origin === 'https://supfile.com' || origin.match(/\.netlify\.app$/) || origin.match(/\.onrender\.com$/) || origin.match(/\.fly\.dev$/) || origin.includes('localhost');
    const allowOrigin = allowed ? origin : (process.env.CORS_ORIGIN || '').split(',')[0].trim() || '*';
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(folder.name)}.zip"`);

    // Niveau 0 = stockage seul (pas de compression) : beaucoup plus rapide pour dossiers avec beaucoup de fichiers
    const archive = archiver('zip', { zlib: { level: 0 } });
    archive.on('error', (err) => {
      if (!res.headersSent) res.status(500).json({ error: { message: 'Failed to create archive' } });
    });
    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') console.warn('[downloadFolder] warning:', err.code, err.message);
    });
    archive.pipe(res);

    for (const file of filesToZip) {
      archive.file(file.file_path, { name: file.path });
    }
    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) next(err);
  }
}

// Restaurer un dossier
async function restoreFolder(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const folder = await FolderModel.findById(id);
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } });
    }

    // Comparer les ObjectId correctement
    const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    
    if (folderOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    await FolderModel.restore(id);
    
    // Synchroniser le quota après restauration du dossier
    // (les fichiers du dossier sont maintenant restaurés)
    await syncQuotaUsed(userId);
    
    // Invalider le cache du dashboard
    const { invalidateUserCache } = require('../utils/cache');
    invalidateUserCache(userId);
    
    res.status(200).json({ message: 'Folder restored' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error restoring folder:', err);
    }
    next(err);
  }
}

// Lister les dossiers supprimés (corbeille)
async function listTrash(req, res, next) {
  try {
    const userId = req.user.id;
    
    // Convertir userId en ObjectId si nécessaire
    const mongoose = require('mongoose');
    const Folder = mongoose.models.Folder;
    const userIdObj = userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId);
    
    // Récupérer tous les dossiers de l'utilisateur supprimés
    const folders = await Folder.find({ 
      owner_id: userIdObj,
      is_deleted: true 
    }).sort({ deleted_at: -1 }).lean();
    
    const deletedFolders = folders.map(f => FolderModel.toDTO(f));
    
    res.status(200).json({
      data: {
        items: deletedFolders,
        total: deletedFolders.length,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error listing trash folders:', err);
    }
    next(err);
  }
}

// Récupérer un dossier par ID (propriétaire ou partage interne)
async function getFolder(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const folder = await FolderModel.findById(id);
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } });
    }

    const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;

    if (folderOwnerId === userOwnerId) {
      return res.status(200).json({ data: folder });
    }

    // Dossier partagé avec moi (partage interne) : autoriser la lecture
    const internalShares = await ShareModel.findBySharedWith(userId);
    const hasAccess = internalShares.some(
      s => s.folder_id && s.folder_id.toString() === id
    );
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    res.status(200).json({ data: { ...folder, shared_with_me: true } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listFolders,
  createFolder,
  getFolder,
  updateFolder,
  deleteFolder,
  restoreFolder,
  downloadFolder,
  listTrash,
};

