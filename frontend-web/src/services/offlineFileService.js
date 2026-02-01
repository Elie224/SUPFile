/**
 * Service de gestion des fichiers avec support offline-first.
 * Utilise automatiquement le cache local quand hors ligne.
 */

import { fileService, folderService } from './api';
import { API_URL } from '../config';
import offlineDB from './offlineDB';
import syncService from './syncService';

/**
 * Wrapper pour fileService qui gère le mode hors ligne
 */
export const offlineFileService = {
  /**
   * Liste les fichiers d'un dossier (local si hors ligne, serveur si en ligne)
   */
  async list(folderId = null) {
    if (!navigator.onLine) {
      // Mode hors ligne : récupérer depuis IndexedDB
      const files = await offlineDB.getFilesByFolder(folderId);
      const folders = await offlineDB.getAllFolders();
      
      // Filtrer les dossiers par parent_id
      const filteredFolders = folders.filter(f => 
        (folderId === null && !f.parent_id) || f.parent_id === folderId
      );

      return {
        data: {
          data: {
            items: [...filteredFolders, ...files],
            folder: folderId ? folders.find(f => f.id === folderId) : null
          }
        },
        fromCache: true
      };
    }

    try {
      // Mode en ligne : récupérer depuis le serveur
      const response = await fileService.list(folderId);
      
      // Sauvegarder dans le cache local
      const items = response.data.data.items || [];
      for (const item of items) {
        if (item.type === 'folder' || !item.folder_id) {
          await offlineDB.saveFolder(item);
        } else {
          await offlineDB.saveFile(item);
        }
      }

      return { ...response, fromCache: false };
    } catch (err) {
      // Erreur réseau : basculer sur le cache
      if (import.meta.env.DEV) console.warn('[OfflineFileService] Erreur réseau, utilisation du cache local');
      const files = await offlineDB.getFilesByFolder(folderId);
      const folders = await offlineDB.getAllFolders();
      const filteredFolders = folders.filter(f => 
        (folderId === null && !f.parent_id) || f.parent_id === folderId
      );

      return {
        data: {
          data: {
            items: [...filteredFolders, ...files],
            folder: folderId ? folders.find(f => f.id === folderId) : null
          }
        },
        fromCache: true
      };
    }
  },

  /**
   * Upload d'un fichier
   */
  async upload(file, folderId = null, onProgress = null) {
    return await syncService.uploadFile(file, folderId);
  },

  /**
   * Téléchargement d'un fichier
   */
  async download(fileId) {
    // Essayer le cache local d'abord
    const cachedBlob = await offlineDB.getFileContent(fileId);
    if (cachedBlob) {
      return { blob: cachedBlob, fromCache: true };
    }

    if (!navigator.onLine) {
      throw new Error('Fichier non disponible hors ligne. Connectez-vous pour le télécharger.');
    }

    // Télécharger depuis le serveur (URL API centralisée dans config)
    const apiBase = (typeof API_URL === 'string' && API_URL) ? API_URL : 'https://supfile.fly.dev';
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${apiBase}/api/files/${fileId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement');
    }

    const blob = await response.blob();
    
    // Sauvegarder dans le cache
    await offlineDB.saveFileContent(fileId, blob);

    return { blob, fromCache: false };
  },

  /**
   * Suppression d'un fichier
   */
  async delete(fileId) {
    return await syncService.deleteFile(fileId);
  },

  /**
   * Renommage d'un fichier
   */
  async rename(fileId, newName) {
    return await syncService.renameFile(fileId, newName);
  },

  /**
   * Déplacement d'un fichier
   */
  async move(fileId, destinationFolderId) {
    if (navigator.onLine) {
      try {
        const response = await fileService.move(fileId, destinationFolderId);
        // Mettre à jour localement
        const files = await offlineDB.getAllFiles();
        const file = files.find(f => f.id === fileId);
        if (file) {
          file.folder_id = destinationFolderId;
          file.updated_at = new Date().toISOString();
          await offlineDB.saveFile(file);
        }
        return { ...response, mode: 'online' };
      } catch (err) {
        if (import.meta.env.DEV) console.error('[OfflineFileService] Erreur déplacement en ligne:', err?.message || err);
      }
    }

    // Hors ligne
    const files = await offlineDB.getAllFiles();
    const file = files.find(f => f.id === fileId);
    if (file) {
      file.folder_id = destinationFolderId;
      file.updated_at = new Date().toISOString();
      await offlineDB.saveFile(file);
    }

    await offlineDB.addPendingOperation({
      type: 'move-file',
      data: { fileId, destinationFolderId }
    });

    return { success: true, mode: 'offline' };
  }
};

/**
 * Wrapper pour folderService qui gère le mode hors ligne
 */
export const offlineFolderService = {
  /**
   * Liste les dossiers
   */
  async list(parentId = null) {
    if (!navigator.onLine) {
      const folders = await offlineDB.getAllFolders();
      const filtered = folders.filter(f => 
        (parentId === null && !f.parent_id) || f.parent_id === parentId
      );
      return {
        data: { data: { items: filtered } },
        fromCache: true
      };
    }

    try {
      const response = await folderService.list(parentId);
      const items = response.data.data?.items || [];
      for (const folder of items) {
        await offlineDB.saveFolder(folder);
      }
      return { ...response, fromCache: false };
    } catch (err) {
      const folders = await offlineDB.getAllFolders();
      const filtered = folders.filter(f => 
        (parentId === null && !f.parent_id) || f.parent_id === parentId
      );
      return {
        data: { data: { items: filtered } },
        fromCache: true
      };
    }
  },

  /**
   * Création d'un dossier
   */
  async create(name, parentId = null) {
    return await syncService.createFolder(name, parentId);
  },

  /**
   * Suppression d'un dossier
   */
  async delete(folderId) {
    await offlineDB.deleteFolder(folderId);

    if (navigator.onLine) {
      try {
        await folderService.delete(folderId);
        return { success: true, mode: 'online' };
      } catch (err) {
        if (import.meta.env.DEV) console.error('[OfflineFileService] Erreur suppression dossier en ligne:', err?.message || err);
      }
    }

    await offlineDB.addPendingOperation({
      type: 'delete-folder',
      data: { folderId }
    });

    return { success: true, mode: 'offline' };
  },

  /**
   * Renommage d'un dossier
   */
  async rename(folderId, newName) {
    if (navigator.onLine) {
      try {
        await folderService.rename(folderId, newName);
        const folders = await offlineDB.getAllFolders();
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
          folder.name = newName;
          folder.updated_at = new Date().toISOString();
          await offlineDB.saveFolder(folder);
        }
        return { success: true, mode: 'online' };
      } catch (err) {
        if (import.meta.env.DEV) console.error('[OfflineFileService] Erreur renommage dossier en ligne:', err?.message || err);
      }
    }

    const folders = await offlineDB.getAllFolders();
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      folder.name = newName;
      folder.updated_at = new Date().toISOString();
      await offlineDB.saveFolder(folder);
    }

    await offlineDB.addPendingOperation({
      type: 'rename-folder',
      data: { folderId, newName }
    });

    return { success: true, mode: 'offline' };
  }
};
