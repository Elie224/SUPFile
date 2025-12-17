const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const FileModel = require('../models/fileModel');
const FolderModel = require('../models/folderModel');
const UserModel = require('../models/userModel');
const config = require('../config');
const { AppError } = require('../middlewares/errorHandler');

// Configuration multer pour l'upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return cb(new Error('User not authenticated'));
      }
      
      // Résoudre le chemin absolu du répertoire d'upload
      const baseDir = path.resolve(config.upload.uploadDir);
      const uploadDir = path.join(baseDir, `user_${userId}`);
      
      // Créer le répertoire s'il n'existe pas
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Vérifier que le répertoire existe et est accessible
      await fs.access(uploadDir);
      
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    // Accepter tous les types de fichiers
    cb(null, true);
  },
}).single('file');

// Middleware pour gérer l'upload
const uploadMiddleware = (req, res, next) => {
  // Vérifier que l'utilisateur est authentifié
  if (!req.user || !req.user.id) {
    console.error('Upload middleware: User not authenticated', { user: req.user });
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }
  
  console.log('Upload middleware: Starting upload for user', req.user.id);
  console.log('Upload middleware: Content-Type:', req.headers['content-type']);
  console.log('Upload middleware: Has file in request?', !!req.file);
  
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err.code, err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File too large', 413));
      }
      return next(new AppError(err.message, 400));
    }
    if (err) {
      console.error('Upload middleware error:', err);
      return next(err);
    }
    
    // Vérifier que le fichier a bien été reçu
    if (!req.file) {
      console.error('Upload middleware: No file received after multer processing');
      console.error('Request body:', req.body);
      console.error('Request files:', req.files);
      return res.status(400).json({ 
        error: { 
          message: 'No file provided. Please ensure the file is sent with the field name "file"' 
        } 
      });
    }
    
    console.log('Upload middleware: File received successfully', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });
    
    next();
  });
};

// Lister les fichiers d'un dossier
async function listFiles(req, res, next) {
  try {
    const userId = req.user.id;
    const { folder_id, skip = 0, limit = 50, sort_by = 'name', sort_order = 'asc' } = req.query;

    const folderId = folder_id === 'root' || !folder_id ? null : folder_id;

    // Vérifier que le dossier appartient à l'utilisateur
    if (folderId) {
      const folder = await FolderModel.findById(folderId);
      if (!folder) {
        return res.status(404).json({ error: { message: 'Folder not found' } });
      }
      
      // Comparer les ObjectId correctement
      const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      
      if (folderOwnerId !== userOwnerId) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }
    }

    // Récupérer les fichiers et dossiers
    const files = await FileModel.findByOwner(userId, folderId, false);
    const folders = await FolderModel.findByOwner(userId, folderId, false);

    // Combiner et trier
    const items = [
      ...folders.map(f => ({ ...f, type: 'folder' })),
      ...files.map(f => ({ ...f, type: 'file' })),
    ];

    // Trier
    items.sort((a, b) => {
      const aVal = a[sort_by] || a.name;
      const bVal = b[sort_by] || b.name;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort_order === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const paginated = items.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.status(200).json({
      data: {
        items: paginated,
        pagination: {
          total: items.length,
          skip: parseInt(skip),
          limit: parseInt(limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// Uploader un fichier
async function uploadFile(req, res, next) {
  try {
    const userId = req.user.id;
    const { folder_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided' } });
    }

    // Vérifier le quota utilisateur
    const user = await UserModel.findById(userId);
    const currentUsed = await FileModel.getTotalSizeByOwner(userId);
    const fileSize = req.file.size;

    if (currentUsed + fileSize > user.quota_limit) {
      // Supprimer le fichier uploadé
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(507).json({ error: { message: 'Insufficient storage quota' } });
    }

    // Vérifier le dossier parent
    let folderId = folder_id || null;
    if (folderId) {
      const folder = await FolderModel.findById(folderId);
      if (!folder) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ error: { message: 'Folder not found' } });
      }
      
      // Comparer les ObjectId correctement
      const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      
      if (folderOwnerId !== userOwnerId) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(403).json({ error: { message: 'Access denied' } });
      }
    } else {
      // Créer ou récupérer le dossier racine
      let rootFolder = await FolderModel.findRootFolder(userId);
      if (!rootFolder) {
        rootFolder = await FolderModel.create({ name: 'Root', ownerId: userId, parentId: null });
      }
      folderId = rootFolder.id;
    }

    // Vérifier que le fichier existe physiquement
    try {
      await fs.access(req.file.path);
    } catch (accessErr) {
      console.error('Uploaded file not accessible:', req.file.path);
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(500).json({ error: { message: 'Failed to save file' } });
    }

    // Créer l'entrée en base de données
    const file = await FileModel.create({
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      size: fileSize,
      folderId,
      ownerId: userId,
      filePath: req.file.path,
    });

    // Mettre à jour le quota utilisé
    const mongoose = require('mongoose');
    const User = mongoose.models.User;
    await User.findByIdAndUpdate(userId, { quota_used: currentUsed + fileSize });

    res.status(201).json({
      data: file,
      message: 'File uploaded successfully',
    });
  } catch (err) {
    // Supprimer le fichier en cas d'erreur
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(err);
  }
}

// Télécharger un fichier
async function downloadFile(req, res, next) {
  try {
    const userId = req.user?.id; // Peut être undefined pour les partages publics
    const { id } = req.params;
    const { token, password } = req.query;

    const file = await FileModel.findById(id);
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    // Vérifier la propriété ou le partage public
    let hasAccess = false;
    
    // Vérifier si l'utilisateur est le propriétaire
    if (userId) {
      const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
      const userOwnerId = userId?.toString ? userId.toString() : userId;
      if (fileOwnerId === userOwnerId) {
        hasAccess = true;
      }
    }
    
    // Si pas propriétaire, vérifier le partage public
    if (!hasAccess && token) {
      const ShareModel = require('../models/shareModel');
      const share = await ShareModel.findByToken(token);
      
      if (share) {
        const shareFileId = share.file_id?.toString ? share.file_id.toString() : share.file_id;
        const fileId = id?.toString ? id.toString() : id;
        
        if (shareFileId === fileId) {
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

    // Vérifier que le fichier existe physiquement
    try {
      await fs.access(file.file_path);
    } catch {
      return res.status(404).json({ error: { message: 'File not found on disk' } });
    }

    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Length', file.size);

    res.sendFile(path.resolve(file.file_path));
  } catch (err) {
    next(err);
  }
}

// Prévisualiser un fichier
async function previewFile(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const file = await FileModel.findById(id);
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    // Comparer les ObjectId correctement
    const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    
    if (fileOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Pour les images, PDF, texte - servir directement
    if (file.mime_type?.startsWith('image/') || 
        file.mime_type === 'application/pdf' ||
        file.mime_type?.startsWith('text/')) {
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
      return res.sendFile(path.resolve(file.file_path));
    }

    return res.status(400).json({ error: { message: 'Preview not available for this file type' } });
  } catch (err) {
    next(err);
  }
}

// Stream audio/vidéo
async function streamFile(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const file = await FileModel.findById(id);
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    // Comparer les ObjectId correctement
    const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    
    if (fileOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    if (!file.mime_type?.startsWith('audio/') && !file.mime_type?.startsWith('video/')) {
      return res.status(400).json({ error: { message: 'Streaming only available for audio/video files' } });
    }

    // Support des Range requests pour le streaming
    const range = req.headers.range;
    if (range) {
      const filePath = path.resolve(file.file_path);
      const stat = await fs.stat(filePath);
      const fileSize = stat.size;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.mime_type,
      });

      const stream = require('fs').createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Length', file.size);
      res.sendFile(path.resolve(file.file_path));
    }
  } catch (err) {
    next(err);
  }
}

// Renommer ou déplacer un fichier
async function updateFile(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, folder_id } = req.body;

    const file = await FileModel.findById(id);
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    // Comparer les ObjectId correctement
    const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    
    if (fileOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const updates = {};
    if (name) updates.name = name;
    if (folder_id !== undefined) {
      if (folder_id) {
        const folder = await FolderModel.findById(folder_id);
        if (!folder) {
          return res.status(404).json({ error: { message: 'Folder not found' } });
        }
        
        // Comparer les ObjectId correctement
        const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
        if (folderOwnerId !== userOwnerId) {
          return res.status(403).json({ error: { message: 'Access denied' } });
        }
      }
      updates.folder_id = folder_id || null;
    }

    const updated = await FileModel.update(id, updates);
    res.status(200).json({ data: updated, message: 'File updated' });
  } catch (err) {
    next(err);
  }
}

// Supprimer un fichier (soft delete)
async function deleteFile(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const file = await FileModel.findById(id);
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    // Comparer les ObjectId correctement
    const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    
    if (fileOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    await FileModel.softDelete(id);
    
    // Mettre à jour le quota utilisé (soustraire la taille du fichier)
    const currentUsed = await FileModel.getTotalSizeByOwner(userId);
    const mongoose = require('mongoose');
    const User = mongoose.models.User;
    await User.findByIdAndUpdate(userId, { quota_used: currentUsed });
    
    res.status(200).json({ message: 'File deleted' });
  } catch (err) {
    console.error('Error deleting file:', err);
    next(err);
  }
}

// Restaurer un fichier
async function restoreFile(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const file = await FileModel.findById(id);
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    // Comparer les ObjectId correctement
    const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    
    if (fileOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    await FileModel.restore(id);
    
    // Mettre à jour le quota utilisé
    const currentUsed = await FileModel.getTotalSizeByOwner(userId);
    const mongoose = require('mongoose');
    const User = mongoose.models.User;
    await User.findByIdAndUpdate(userId, { quota_used: currentUsed });
    
    res.status(200).json({ message: 'File restored' });
  } catch (err) {
    console.error('Error restoring file:', err);
    next(err);
  }
}

// Lister les fichiers supprimés (corbeille)
async function listTrash(req, res, next) {
  try {
    const userId = req.user.id;
    
    // Convertir userId en ObjectId si nécessaire
    const mongoose = require('mongoose');
    const File = mongoose.models.File;
    const userIdObj = userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId);
    
    // Récupérer tous les fichiers de l'utilisateur supprimés
    const files = await File.find({ 
      owner_id: userIdObj,
      is_deleted: true 
    }).sort({ deleted_at: -1 }).lean();
    
    const deletedFiles = files.map(f => FileModel.toDTO(f));
    
    res.status(200).json({
      data: {
        items: deletedFiles,
        total: deletedFiles.length,
      },
    });
  } catch (err) {
    console.error('Error listing trash files:', err);
    console.error('Error details:', err.message, err.stack);
    next(err);
  }
}

module.exports = {
  uploadMiddleware,
  listFiles,
  uploadFile,
  downloadFile,
  previewFile,
  streamFile,
  updateFile,
  deleteFile,
  restoreFile,
  listTrash,
};

