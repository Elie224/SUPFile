const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { v4: uuidv4 } = require('uuid');
const FileModel = require('../models/fileModel');
const { sanitizePaginationSort } = require('../middlewares/security');
const FolderModel = require('../models/folderModel');
const ShareModel = require('../models/shareModel');
const UserModel = require('../models/userModel');
const config = require('../config');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { compareObjectIds } = require('../utils/objectId');
const { successResponse, errorResponse } = require('../utils/response');
const { calculateRealQuotaUsed, updateQuotaAfterOperation } = require('../utils/quota');
const mongoose = require('mongoose');

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
      logger.logError(error, { context: 'upload directory creation' });
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
    // Validation basique du nom de fichier
    if (!file.originalname || file.originalname.length > 255) {
      return cb(new AppError('Invalid filename', 400));
    }
    
    // En développement, accepter tous les types pour faciliter les tests
    // En production, la validation stricte sera faite par validateFileUpload
    cb(null, true);
  },
}).single('file');

// Configuration multer pour l'upload de chunks (mémoire, taille limitée)
const CHUNK_SIZE_BYTES = parseInt(process.env.CHUNK_SIZE_BYTES || (5 * 1024 * 1024), 10); // 5 MB par défaut
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CHUNK_SIZE_BYTES + (512 * 1024) }, // marge de sécurité
}).single('chunk');

// Middleware pour gérer l'upload
const uploadMiddleware = (req, res, next) => {
  // Vérifier que l'utilisateur est authentifié
  if (!req.user || !req.user.id) {
    logger.logWarn('Upload middleware: User not authenticated', { user: req.user });
    return errorResponse(res, 'Authentication required', 401);
  }
  
  logger.logDebug('Upload middleware: Starting upload', {
    userId: req.user.id,
    contentType: req.headers['content-type'],
    hasFile: !!req.file,
  });
  
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.logError(err, { context: 'multer error', code: err.code });
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File too large', 413, 'FILE_TOO_LARGE'));
      }
      return next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
    }
    if (err) {
      logger.logError(err, { context: 'upload middleware' });
      return next(err);
    }
    
    // Vérifier que le fichier a bien été reçu
    if (!req.file) {
      logger.logWarn('Upload middleware: No file received', {
        body: req.body,
        files: req.files,
      });
      return errorResponse(res, 'No file provided. Please ensure the file is sent with the field name "file"', 400);
    }
    
    logger.logInfo('Upload middleware: File received successfully', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
    
    next();
  });
};

// Middleware pour gérer l'upload d'un chunk
const chunkUploadMiddleware = (req, res, next) => {
  if (!req.user || !req.user.id) {
    logger.logWarn('Chunk upload middleware: User not authenticated', { user: req.user });
    return errorResponse(res, 'Authentication required', 401);
  }

  chunkUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.logError(err, { context: 'chunk upload multer error', code: err.code });
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('Chunk too large', 413, 'CHUNK_TOO_LARGE'));
      }
      return next(new AppError(err.message, 400, 'CHUNK_UPLOAD_ERROR'));
    }
    if (err) {
      logger.logError(err, { context: 'chunk upload middleware' });
      return next(err);
    }
    if (!req.file) {
      return errorResponse(res, 'No chunk provided', 400);
    }
    next();
  });
};

// Lister les fichiers d'un dossier
async function listFiles(req, res, next) {
  try {
    const userId = req.user.id;
    const { folder_id } = req.query;
    const { sortBy: sort_by, sortOrder: sort_order, skip, limit } = sanitizePaginationSort(req.query);

    let folderId = folder_id === 'root' || !folder_id ? null : folder_id;
    if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ error: { message: 'Invalid folder_id format' } });
    }

    let effectiveOwnerId = userId;
    let isSharedFolder = false;

    // Vérifier accès au dossier : propriétaire ou partage interne (dossier partagé avec moi)
    if (folderId) {
      const folder = await FolderModel.findById(folderId);
      if (!folder) {
        return res.status(404).json({ error: { message: 'Folder not found' } });
      }
      if (compareObjectIds(folder.owner_id, userId)) {
        effectiveOwnerId = userId;
      } else {
        const internalShares = await ShareModel.findBySharedWith(userId);
        const sharedFolder = internalShares.find(s => s.folder_id && s.folder_id.toString() === folderId.toString());
        if (!sharedFolder) {
          return errorResponse(res, 'Access denied', 403);
        }
        effectiveOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
        isSharedFolder = true;
      }
    }

    // Récupérer les fichiers et dossiers avec pagination côté base de données
    const skipNum = parseInt(skip);
    const limitNum = parseInt(limit);
    
    // Récupérer en parallèle avec pagination optimisée (contenu du propriétaire effectif)
    const [files, folders, totalFiles, totalFolders] = await Promise.all([
      FileModel.findByOwner(effectiveOwnerId, folderId, false, { skip, limit, sortBy: sort_by, sortOrder: sort_order }),
      FolderModel.findByOwner(effectiveOwnerId, folderId, false, { skip, limit, sortBy: sort_by, sortOrder: sort_order }),
      FileModel.countByOwner(effectiveOwnerId, folderId, false),
      FolderModel.countByOwner(effectiveOwnerId, folderId, false),
    ]);

    // Combiner et trier (tri déjà fait côté DB, mais combiner pour l'affichage)
    let items = [
      ...folders.map(f => ({ ...f, type: 'folder', shared_with_me: isSharedFolder })),
      ...files.map(f => ({ ...f, type: 'file', shared_with_me: isSharedFolder })),
    ];

    // À la racine : ajouter les dossiers partagés avec moi (ils apparaissent dans la racine du destinataire)
    let sharedFoldersCount = 0;
    if (!folderId && skip === 0) {
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
        sharedFoldersCount = validShared.length;
        const sharedItems = validShared.map(f => ({
          ...f,
          type: 'folder',
          shared_with_me: true,
        }));
        items = [...sharedItems, ...items];
      }
    }

    // Trier à nouveau pour combiner fichiers et dossiers (si nécessaire)
    if (sort_by === 'name') {
      items.sort((a, b) => {
        const aVal = a.name || '';
        const bVal = b.name || '';
        const comparison = aVal.localeCompare(bVal, 'fr', { sensitivity: 'base' });
        return sort_order === 'asc' ? comparison : -comparison;
      });
    }

    const total = totalFiles + totalFolders + sharedFoldersCount;

    res.status(200).json({
      data: {
        items,
        pagination: {
          total,
          skip,
          limit,
          hasMore: (skip + limit) < total,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// Initialiser un upload chunké (resumable)
async function initChunkedUpload(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, size, mime_type, folder_id } = req.body || {};

    if (!name || !size) {
      return res.status(400).json({ error: { message: 'Missing file metadata' } });
    }

    const fileSize = parseInt(size, 10);
    if (!fileSize || fileSize <= 0) {
      return res.status(400).json({ error: { message: 'Invalid file size' } });
    }

    if (fileSize > config.upload.maxFileSize) {
      return res.status(413).json({ error: { message: 'File too large' } });
    }

    // Vérifier le quota utilisateur
    const user = await UserModel.findById(userId);
    const currentUsed = await calculateRealQuotaUsed(userId);
    const quotaLimit = user.quota_limit || 32212254720;
    if (currentUsed + fileSize > quotaLimit) {
      return res.status(507).json({ error: { message: 'Insufficient storage quota' } });
    }

    // Vérifier le dossier parent
    let folderId = folder_id || null;
    if (folderId) {
      const folder = await FolderModel.findById(folderId);
      if (!folder) {
        return res.status(404).json({ error: { message: 'Folder not found' } });
      }
      if (!compareObjectIds(folder.owner_id, userId)) {
        return errorResponse(res, 'Access denied', 403);
      }
    } else {
      let rootFolder = await FolderModel.findRootFolder(userId);
      if (!rootFolder) {
        rootFolder = await FolderModel.create({ name: 'Root', ownerId: userId, parentId: null });
      }
      folderId = rootFolder.id;
    }

    const uploadId = uuidv4();
    const baseDir = path.resolve(config.upload.uploadDir);
    const tmpDir = path.join(baseDir, 'tmp', `user_${userId}`, `upload_${uploadId}`);
    await fs.mkdir(tmpDir, { recursive: true });

    const metadata = {
      upload_id: uploadId,
      name,
      size: fileSize,
      mime_type: mime_type || 'application/octet-stream',
      folder_id: folderId,
      owner_id: userId,
      created_at: new Date().toISOString(),
      total_chunks: null,
    };

    await fs.writeFile(path.join(tmpDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    res.status(201).json({
      data: {
        upload_id: uploadId,
        chunk_size: CHUNK_SIZE_BYTES,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Statut d'un upload chunké (liste des chunks reçus)
async function getChunkedUploadStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const { upload_id } = req.query || {};
    if (!upload_id) {
      return res.status(400).json({ error: { message: 'upload_id required' } });
    }

    const baseDir = path.resolve(config.upload.uploadDir);
    const tmpDir = path.join(baseDir, 'tmp', `user_${userId}`, `upload_${upload_id}`);
    const metadataPath = path.join(tmpDir, 'metadata.json');

    try {
      await fs.access(metadataPath);
    } catch {
      return res.status(404).json({ error: { message: 'Upload not found' } });
    }

    const files = await fs.readdir(tmpDir);
    const uploadedChunks = files
      .filter(name => name.startsWith('chunk_'))
      .map(name => parseInt(name.replace('chunk_', ''), 10))
      .filter(num => !Number.isNaN(num))
      .sort((a, b) => a - b);

    res.status(200).json({ data: { upload_id, uploaded_chunks: uploadedChunks } });
  } catch (err) {
    next(err);
  }
}

// Upload d'un chunk
async function uploadChunk(req, res, next) {
  try {
    const userId = req.user.id;
    const { upload_id, chunk_index, total_chunks } = req.body || {};

    if (!upload_id || chunk_index === undefined || total_chunks === undefined) {
      return res.status(400).json({ error: { message: 'Missing chunk metadata' } });
    }

    const index = parseInt(chunk_index, 10);
    const total = parseInt(total_chunks, 10);
    if (Number.isNaN(index) || Number.isNaN(total) || index < 0 || total <= 0) {
      return res.status(400).json({ error: { message: 'Invalid chunk index/total' } });
    }

    const baseDir = path.resolve(config.upload.uploadDir);
    const tmpDir = path.join(baseDir, 'tmp', `user_${userId}`, `upload_${upload_id}`);
    const metadataPath = path.join(tmpDir, 'metadata.json');

    let metadata;
    try {
      const metadataRaw = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataRaw);
    } catch {
      return res.status(404).json({ error: { message: 'Upload not found' } });
    }

    if (String(metadata.owner_id) !== String(userId)) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    if (!metadata.total_chunks) {
      metadata.total_chunks = total;
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }

    const chunkPath = path.join(tmpDir, `chunk_${index}`);
    await fs.writeFile(chunkPath, req.file.buffer);

    res.status(200).json({ data: { upload_id, chunk_index: index } });
  } catch (err) {
    next(err);
  }
}

// Finaliser un upload chunké (assembler + créer l'entrée BDD)
async function completeChunkedUpload(req, res, next) {
  try {
    const userId = req.user.id;
    const { upload_id, total_chunks } = req.body || {};

    if (!upload_id || total_chunks === undefined) {
      return res.status(400).json({ error: { message: 'Missing upload_id or total_chunks' } });
    }

    const total = parseInt(total_chunks, 10);
    if (Number.isNaN(total) || total <= 0) {
      return res.status(400).json({ error: { message: 'Invalid total_chunks' } });
    }

    const baseDir = path.resolve(config.upload.uploadDir);
    const tmpDir = path.join(baseDir, 'tmp', `user_${userId}`, `upload_${upload_id}`);
    const metadataPath = path.join(tmpDir, 'metadata.json');

    let metadata;
    try {
      const metadataRaw = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataRaw);
    } catch {
      return res.status(404).json({ error: { message: 'Upload not found' } });
    }

    if (String(metadata.owner_id) !== String(userId)) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const missing = [];
    for (let i = 0; i < total; i += 1) {
      const chunkPath = path.join(tmpDir, `chunk_${i}`);
      try {
        await fs.access(chunkPath);
      } catch {
        missing.push(i);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({ error: { message: 'Missing chunks', missing } });
    }

    // Vérifier quota une dernière fois
    const user = await UserModel.findById(userId);
    const currentUsed = await calculateRealQuotaUsed(userId);
    const quotaLimit = user.quota_limit || 32212254720;
    if (currentUsed + metadata.size > quotaLimit) {
      return res.status(507).json({ error: { message: 'Insufficient storage quota' } });
    }

    const userUploadDir = path.join(baseDir, `user_${userId}`);
    await fs.mkdir(userUploadDir, { recursive: true });

    const ext = path.extname(metadata.name || '') || '';
    const finalName = `${uuidv4()}${ext}`;
    const finalPath = path.join(userUploadDir, finalName);

    const writeStream = fsSync.createWriteStream(finalPath, { flags: 'w' });
    let writeStreamError = null;
    writeStream.on('error', (err) => {
      writeStreamError = err;
    });
    for (let i = 0; i < total; i += 1) {
      const chunkPath = path.join(tmpDir, `chunk_${i}`);
      await new Promise((resolve, reject) => {
        if (writeStreamError) return reject(writeStreamError);
        const readStream = fsSync.createReadStream(chunkPath);
        readStream.on('error', reject);
        readStream.on('end', resolve);
        readStream.pipe(writeStream, { end: false });
      });
    }
    writeStream.end();

    // Attendre la fin d'écriture
    await new Promise((resolve, reject) => {
      if (writeStreamError) return reject(writeStreamError);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Vérifier que le fichier existe physiquement
    try {
      await fs.access(finalPath);
    } catch (accessErr) {
      logger.logError(accessErr, { context: 'completeChunkedUpload - file not accessible', finalPath });
      return res.status(500).json({ error: { message: 'Failed to assemble file' } });
    }

    const file = await FileModel.create({
      name: metadata.name,
      mimeType: metadata.mime_type,
      size: metadata.size,
      folderId: metadata.folder_id,
      ownerId: userId,
      filePath: finalPath,
    });

    await updateQuotaAfterOperation(userId, metadata.size);

    const { invalidateUserCache } = require('../utils/cache');
    invalidateUserCache(userId);

    // Nettoyer les chunks
    await fs.rm(tmpDir, { recursive: true, force: true });

    res.status(201).json({ data: file, message: 'File uploaded successfully' });
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

    // Vérifier le quota utilisateur (calculer depuis les fichiers réels)
    const user = await UserModel.findById(userId);
    const currentUsed = await calculateRealQuotaUsed(userId);
    const fileSize = req.file.size;
    const quotaLimit = user.quota_limit || 32212254720; // 30 Go par défaut

    if (currentUsed + fileSize > quotaLimit) {
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
      
      // Vérifier que le dossier appartient à l'utilisateur
      if (!compareObjectIds(folder.owner_id, userId)) {
        await fs.unlink(req.file.path).catch(() => {});
        return errorResponse(res, 'Access denied', 403);
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
      if (process.env.NODE_ENV !== 'production') {
        console.error('Uploaded file not accessible');
      }
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

    // Mettre à jour le quota utilisé (ajouter la taille du fichier)
    await updateQuotaAfterOperation(userId, fileSize);

    // Invalider le cache du dashboard pour cet utilisateur
    const { invalidateUserCache } = require('../utils/cache');
    invalidateUserCache(userId);

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
    const fileOwnerId = String(file.owner_id || '');

    // Vérifier si l'utilisateur est le propriétaire
    if (userId) {
      const userOwnerId = String(userId);
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

// Récupérer les métadonnées d'un fichier par ID
async function getFile(req, res, next) {
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

    res.status(200).json({ data: file });
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
    // Authentification requise (via header ou query param ?token=xxx)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }
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

    // Résoudre le chemin absolu du fichier
    const filePath = path.resolve(file.file_path);
    
    // Vérifier que le fichier existe sur le disque
    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch (err) {
      logger.logError(err, { context: 'streamFile - file not found on disk', filePath, fileId: id });
      return res.status(404).json({ error: { message: 'File not found on disk' } });
    }

    const fileSize = stat.size;

    // Ajouter les headers CORS explicites pour le streaming
    const origin = req.get('Origin');
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');

    // Support des Range requests pour le streaming (lecture progressive)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      // Limiter la taille du chunk à 5 Mo pour éviter les timeouts et améliorer la réactivité
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5 Mo
      const requestedEnd = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const end = Math.min(start + CHUNK_SIZE - 1, requestedEnd, fileSize - 1);
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.mime_type,
      });

      const stream = require('fs').createReadStream(filePath, { start, end });
      stream.on('error', (err) => {
        logger.logError(err, { context: 'streamFile - read stream error', filePath });
        if (!res.headersSent) {
          res.status(500).json({ error: { message: 'Error streaming file' } });
        }
      });
      stream.pipe(res);
    } else {
      // Pas de Range header : envoyer le fichier complet avec streaming
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Length', fileSize);
      
      const stream = require('fs').createReadStream(filePath);
      stream.on('error', (err) => {
        logger.logError(err, { context: 'streamFile - full read stream error', filePath });
        if (!res.headersSent) {
          res.status(500).json({ error: { message: 'Error streaming file' } });
        }
      });
      stream.pipe(res);
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
    
    // Invalider le cache du dashboard pour cet utilisateur
    const { invalidateUserCache } = require('../utils/cache');
    invalidateUserCache(userId);
    
    res.status(200).json({ data: updated, message: 'File updated' });
  } catch (err) {
    next(err);
  }
}

// Supprimer un fichier : soft delete (corbeille) ou hard delete si déjà en corbeille
async function deleteFile(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const file = await FileModel.findByIdIncludeDeleted(id);
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    const fileOwnerId = file.owner_id?.toString ? file.owner_id.toString() : file.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;
    if (fileOwnerId !== userOwnerId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const fileSize = file.size || 0;

    if (file.is_deleted) {
      // Déjà en corbeille : suppression définitive (fichier physique + document)
      if (file.file_path) {
        try {
          await fs.unlink(path.resolve(file.file_path));
        } catch (unlinkErr) {
          if (process.env.NODE_ENV !== 'production') {
            logger.logWarn('Could not remove file from disk', { path: file.file_path, err: unlinkErr?.message });
          }
        }
      }
      await FileModel.delete(id);
      await updateQuotaAfterOperation(userId, -fileSize);
    } else {
      await FileModel.softDelete(id);
      await updateQuotaAfterOperation(userId, -fileSize);
    }

    const { invalidateUserCache } = require('../utils/cache');
    invalidateUserCache(userId);
    res.status(200).json({ message: 'File deleted' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error deleting file:', err);
    }
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

    // Récupérer la taille du fichier avant restauration
    const fileSize = file.size || 0;
    
    await FileModel.restore(id);
    
    // Mettre à jour le quota utilisé (ajouter la taille du fichier)
    await updateQuotaAfterOperation(userId, fileSize);
    
    // Invalider le cache du dashboard pour cet utilisateur
    const { invalidateUserCache } = require('../utils/cache');
    invalidateUserCache(userId);
    
    res.status(200).json({ message: 'File restored' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error restoring file:', err);
    }
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error listing trash files:', err);
    }
    next(err);
  }
}

module.exports = {
  uploadMiddleware,
  chunkUploadMiddleware,
  listFiles,
  initChunkedUpload,
  getChunkedUploadStatus,
  uploadChunk,
  completeChunkedUpload,
  getFile,
  uploadFile,
  downloadFile,
  previewFile,
  streamFile,
  updateFile,
  deleteFile,
  restoreFile,
  listTrash,
};

