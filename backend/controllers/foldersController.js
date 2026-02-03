const FolderModel = require('../models/folderModel');
const FileModel = require('../models/fileModel');
const ShareModel = require('../models/shareModel');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const fsp = fs.promises;
const archiver = require('archiver');
const { calculateRealQuotaUsed, syncQuotaUsed, updateQuotaAfterOperation } = require('../utils/quota');

function sanitizeZipEntryName(name) {
  const raw = (name ?? '').toString().trim();
  if (!raw) return 'unnamed';
  // Empêcher la traversée de répertoires et les noms invalides
  const cleaned = raw
    .replace(/[\\/]+/g, '_')
    .replace(/\.+/g, '.')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
  return cleaned || 'unnamed';
}

async function addFolderToArchive({ archive, ownerId, folderId, zipPrefix, visited, stats, shouldAbort }) {
  if (typeof shouldAbort === 'function' && shouldAbort()) return;
  const folderKey = String(folderId);
  if (visited.has(folderKey)) {
    // Cycle détecté : éviter boucle infinie
    stats.skippedCycles += 1;
    return;
  }
  visited.add(folderKey);

  // Limiter la charge (éviter que de très gros dossiers fassent "tourner" indéfiniment)
  if (stats.foldersVisited >= stats.maxFolders) {
    stats.abortedByLimit = true;
    return;
  }
  stats.foldersVisited += 1;

  const files = await FileModel.findByFolder(folderId, false);
  let fileLoopCount = 0;
  for (const file of files) {
    if (typeof shouldAbort === 'function' && shouldAbort()) return;
    fileLoopCount += 1;
    // Important: sur de gros dossiers, cette boucle peut être très longue et bloquer l'event loop.
    // On yield régulièrement pour permettre à Archiver/HTTP de flusher des chunks.
    if (fileLoopCount % 200 === 0) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setImmediate(resolve));
    }
    if (stats.filesAdded >= stats.maxFiles) {
      stats.abortedByLimit = true;
      break;
    }
    // Ne zipper que les fichiers du propriétaire du dossier (sécurité).
    if (file.owner_id && file.owner_id.toString && file.owner_id.toString() !== ownerId.toString()) {
      continue;
    }
    if (!file.file_path) continue;

    const entryName = path.posix.join(zipPrefix, sanitizeZipEntryName(file.name));
    const diskPath = path.resolve(file.file_path);
    // Éviter un fs.access() par fichier (très coûteux sur de gros dossiers/volumes).
    // Archiver gère déjà les fichiers manquants via un warning (ENOENT) sans casser le zip.
    try {
      archive.file(diskPath, { name: entryName });
      stats.filesAdded += 1;
    } catch {
      continue;
    }
  }

  // FolderModel.findByOwner() est paginé (limit max 100). Pour le ZIP, on page pour ne rien rater.
  const pageSize = 100;
  let skip = 0;
  while (!stats.abortedByLimit) {
    if (typeof shouldAbort === 'function' && shouldAbort()) return;

    // Yield aussi entre pages pour éviter un long traitement sans flush.
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => setImmediate(resolve));

    // Ne pas fetch plus de sous-dossiers que la limite globale.
    const remainingFolders = Math.max(stats.maxFolders - stats.foldersVisited, 0);
    if (remainingFolders === 0) {
      stats.abortedByLimit = true;
      break;
    }

    const limit = Math.min(pageSize, remainingFolders);
    const subfolders = await FolderModel.findByOwner(ownerId, folderId, false, { skip, limit, sortBy: 'name', sortOrder: 'asc' });
    if (!subfolders || subfolders.length === 0) break;

    for (const sub of subfolders) {
      if (typeof shouldAbort === 'function' && shouldAbort()) return;
      if (stats.abortedByLimit) break;
      const subPrefix = path.posix.join(zipPrefix, sanitizeZipEntryName(sub.name));
      // Ajoute une entrée dossier vide pour qu'il apparaisse dans le zip
      archive.append('', { name: `${subPrefix}/` });
      await addFolderToArchive({ archive, ownerId, folderId: sub.id, zipPrefix: subPrefix, visited, stats, shouldAbort });
    }

    skip += subfolders.length;
    if (subfolders.length < limit) break;
  }
}

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
        await fsp.unlink(path.resolve(f.file_path));
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

// Télécharger un dossier complet en ZIP (streaming)
// GET /api/folders/:id/download
async function downloadFolderZip(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    const startedAt = Date.now();
    let aborted = false;

    const folder = await FolderModel.findById(id);
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } });
    }

    const folderOwnerId = folder.owner_id?.toString ? folder.owner_id.toString() : folder.owner_id;
    const userOwnerId = userId?.toString ? userId.toString() : userId;

    // Autoriser le propriétaire
    let effectiveOwnerId = folderOwnerId;
    if (folderOwnerId !== userOwnerId) {
      // Autoriser lecture si dossier partagé avec moi (partage interne)
      const internalShares = await ShareModel.findBySharedWith(userId);
      const hasAccess = internalShares.some(
        s => s.folder_id && s.folder_id.toString() === id
      );
      if (!hasAccess) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }
      // Pour zipper, on parcourt le contenu du propriétaire réel du dossier
      effectiveOwnerId = folderOwnerId;
    }

    const zipBaseName = sanitizeZipEntryName(folder.name);
    const fileName = `${zipBaseName}.zip`;

    const stats = {
      maxFolders: 5000,
      maxFiles: 20000,
      foldersVisited: 0,
      filesAdded: 0,
      skippedCycles: 0,
      abortedByLimit: false,
    };

    res.status(200);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-store');

    // Éviter que Node coupe une réponse longue (grands dossiers).
    try {
      if (typeof req.setTimeout === 'function') req.setTimeout(0);
      if (typeof res.setTimeout === 'function') res.setTimeout(0);
      if (req.socket && typeof req.socket.setTimeout === 'function') req.socket.setTimeout(0);
    } catch {
      // ignore
    }

    // Compression légère: réduit fortement le CPU (important sur Fly 1 CPU) et accélère le démarrage du flux.
    // La plupart des gros fichiers (mp4, jpg, pdf) sont déjà compressés, donc level élevé ralentit sans gain.
    const archive = archiver('zip', { zlib: { level: 1 } });

    // Logs de diagnostic (sans token). Toujours actifs pour diagnostiquer la prod.
    console.log('[ZIP] start', {
      requestId,
      folderId: id,
      userId,
      zipBaseName,
      shared: folderOwnerId !== userOwnerId,
    });

    // Log de fin (installer tôt pour ne pas rater les zips rapides)
    res.on('finish', () => {
      console.log('[ZIP] finish', {
        requestId,
        folderId: id,
        userId,
        elapsedMs: Date.now() - startedAt,
        ...stats,
      });
    });

    // Si le client coupe la connexion, on arrête de générer le zip.
    req.on('aborted', () => {
      aborted = true;
      try {
        archive.abort();
      } catch {
        // ignore
      }
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        aborted = true;
      }
      try {
        archive.abort();
      } catch {
        // ignore
      }

      if (aborted) {
        console.warn('[ZIP] client_aborted', {
          requestId,
          folderId: id,
          userId,
          elapsedMs: Date.now() - startedAt,
        });
      }
    });

    archive.on('error', (err) => {
      console.error('[ZIP] error', {
        requestId,
        folderId: id,
        userId,
        message: err?.message,
      });

      // Si headers déjà envoyés, on ne peut plus répondre en JSON
      if (!res.headersSent) {
        return res.status(500).json({ error: { message: 'ZIP generation failed' } });
      }

      try {
        res.destroy(err);
      } catch {
        // ignore
      }
    });

    archive.on('warning', (warn) => {
      // Archiver peut émettre des warnings (ex: fichier manquant) : ne pas casser le zip.
      // Les fichiers manquants sont déjà ignorés dans addFolderToArchive, donc on log et on continue.
      console.warn('[ZIP] warning', {
        requestId,
        folderId: id,
        userId,
        message: warn?.message,
      });
    });

    archive.pipe(res);

    // Forcer l'envoi des headers dès que possible.
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    // Mettre tout le contenu sous un dossier racine dans le zip
    archive.append('', { name: `${zipBaseName}/` });
    const visited = new Set();
    const shouldAbort = () => aborted || res.writableEnded || res.destroyed;
    await addFolderToArchive({ archive, ownerId: effectiveOwnerId, folderId: id, zipPrefix: zipBaseName, visited, stats, shouldAbort });

    if (stats.abortedByLimit) {
      archive.append(
        'ZIP partiel: trop d\'éléments dans ce dossier.\n',
        { name: `${zipBaseName}/_ZIP_LIMIT.txt` },
      );
    }

    await archive.finalize();
  } catch (err) {
    // Si une erreur survient après envoi des headers, Express ne peut pas renvoyer un JSON propre.
    if (res.headersSent) {
      console.error('[ZIP] uncaught_after_headers', {
        folderId: req.params?.id,
        userId: req.user?.id,
        message: err?.message,
      });
      try {
        res.destroy(err);
      } catch {
        // ignore
      }
      return;
    }
    next(err);
  }
}

module.exports = {
  listFolders,
  createFolder,
  getFolder,
  downloadFolderZip,
  updateFolder,
  deleteFolder,
  restoreFolder,
  listTrash,
};

