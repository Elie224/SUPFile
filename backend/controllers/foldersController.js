const FolderModel = require('../models/folderModel');
const FileModel = require('../models/fileModel');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs').promises;

// Créer un dossier
async function createFolder(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, parent_id } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: { message: 'Folder name is required' } });
    }

    let parentId = parent_id || null;

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
      if (parent_id) {
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

// Supprimer un dossier
async function deleteFolder(req, res, next) {
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

    await FolderModel.softDelete(id);
    res.status(200).json({ message: 'Folder deleted' });
  } catch (err) {
    next(err);
  }
}

// Télécharger un dossier en ZIP
async function downloadFolder(req, res, next) {
  try {
    const userId = req.user?.id; // Peut être undefined pour les partages publics
    const { id } = req.params;
    const { token, password } = req.query;

    const folder = await FolderModel.findById(id);
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } });
    }

    // Vérifier la propriété ou le partage public
    let hasAccess = false;
    
    // Vérifier si l'utilisateur est le propriétaire
    if (userId) {
      const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      if (folderOwnerId === userOwnerId) {
        hasAccess = true;
      }
    }
    
    // Si pas propriétaire, vérifier le partage public
    if (!hasAccess && token) {
      const ShareModel = require('../models/shareModel');
      const share = await ShareModel.findByToken(token);
      
      if (share) {
        const shareFolderId = share.folder_id?.toString ? share.folder_id.toString() : share.folder_id;
        const folderId = id?.toString ? id.toString() : id;
        
        if (shareFolderId === folderId) {
          // Vérifier si le partage est expiré ou désactivé
          if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return res.status(410).json({ error: { message: 'Share expired' } });
          }
          if (share.is_active === false) {
            return res.status(403).json({ error: { message: 'Share deactivated' } });
          }
          // Vérifier le mot de passe si requis
          if (share.password_hash) {
            if (!password) {
              return res.status(401).json({ error: { message: 'Password required' } });
            }
            const bcrypt = require('bcryptjs');
            const isValid = await bcrypt.compare(password, share.password_hash);
            if (!isValid) {
              return res.status(401).json({ error: { message: 'Invalid password' } });
            }
          }
          hasAccess = true;
        }
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Utiliser le owner_id du dossier pour récupérer les fichiers (même pour les partages)
    const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;

    // Récupérer récursivement tous les fichiers du dossier
    async function getAllFiles(folderId, basePath = '') {
      const files = await FileModel.findByFolder(folderId, false);
      const subfolders = await FolderModel.findByOwner(folderOwnerId, folderId, false);
      
      const result = [];
      
      for (const file of files) {
        result.push({ ...file, path: `${basePath}/${file.name}` });
      }
      
      for (const subfolder of subfolders) {
        const subFiles = await getAllFiles(subfolder.id, `${basePath}/${subfolder.name}`);
        result.push(...subFiles);
      }
      
      return result;
    }

    const allFiles = await getAllFiles(id, folder.name);

    // Créer l'archive ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folder.name}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const file of allFiles) {
      try {
        await fs.access(file.file_path);
        archive.file(file.file_path, { name: file.path });
      } catch (err) {
        console.error(`File not found: ${file.file_path}`);
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
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
    res.status(200).json({ message: 'Folder restored' });
  } catch (err) {
    console.error('Error restoring folder:', err);
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
    console.error('Error listing trash folders:', err);
    console.error('Error details:', err.message, err.stack);
    next(err);
  }
}

module.exports = {
  createFolder,
  updateFolder,
  deleteFolder,
  restoreFolder,
  downloadFolder,
  listTrash,
};

