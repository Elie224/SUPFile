/**
 * Service de synchronisation pour le mode offline-first.
 * Gère la synchronisation bidirectionnelle entre le serveur et le stockage local.
 */

import offlineDB from './offlineDB';
import { fileService, folderService } from './api';
import { API_URL } from '../config';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
  }

  /**
   * Ajoute un listener pour les événements de synchronisation
   */
  addSyncListener(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifie tous les listeners
   */
  notifyListeners(event) {
    this.syncListeners.forEach(cb => cb(event));
  }

  /**
   * Vérifie si l'utilisateur est en ligne
   */
  isOnline() {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  /**
   * Synchronise les données depuis le serveur vers le local
   */
  async syncFromServer() {
    if (!this.isOnline()) {
      console.log('[Sync] Hors ligne - synchronisation impossible');
      return { success: false, reason: 'offline' };
    }

    try {
      this.isSyncing = true;
      this.notifyListeners({ type: 'sync-start', direction: 'from-server' });

      // 1. Récupérer tous les dossiers
      const foldersResponse = await folderService.list(null);
      const folders = foldersResponse.data.data?.items || [];
      
      for (const folder of folders) {
        await offlineDB.saveFolder(folder);
      }

      // 2. Récupérer tous les fichiers
      const filesResponse = await fileService.list(null);
      const files = filesResponse.data.data?.items || [];
      
      for (const file of files) {
        if (file.type === 'file') {
          await offlineDB.saveFile(file);
          
          // Télécharger le contenu du fichier si pas trop gros (< 10 MB)
          if (file.size && file.size < 10 * 1024 * 1024) {
            try {
              const token = localStorage.getItem('access_token');
              const response = await fetch(`${API_URL}/api/files/${file.id}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (response.ok) {
                const blob = await response.blob();
                await offlineDB.saveFileContent(file.id, blob);
              }
            } catch (err) {
              console.warn(`[Sync] Impossible de télécharger le fichier ${file.name}:`, err);
            }
          }
        }
      }

      // Sauvegarder la date de dernière sync
      await offlineDB.setUserMeta('lastSyncDate', new Date().toISOString());

      this.notifyListeners({ type: 'sync-complete', direction: 'from-server', filesCount: files.length, foldersCount: folders.length });
      
      return { success: true, filesCount: files.length, foldersCount: folders.length };
    } catch (error) {
      console.error('[Sync] Erreur lors de la synchronisation depuis le serveur:', error);
      this.notifyListeners({ type: 'sync-error', direction: 'from-server', error });
      return { success: false, error };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Synchronise les opérations en attente vers le serveur
   */
  async syncToServer() {
    if (!this.isOnline()) {
      console.log('[Sync] Hors ligne - impossible d\'envoyer les opérations en attente');
      return { success: false, reason: 'offline' };
    }

    try {
      this.isSyncing = true;
      this.notifyListeners({ type: 'sync-start', direction: 'to-server' });

      const operations = await offlineDB.getPendingOperations();
      let successCount = 0;
      let errorCount = 0;

      for (const op of operations) {
        try {
          await this.executePendingOperation(op);
          await offlineDB.deletePendingOperation(op.id);
          successCount++;
        } catch (err) {
          console.error(`[Sync] Erreur lors de l'exécution de l'opération ${op.type}:`, err);
          errorCount++;
        }
      }

      this.notifyListeners({ 
        type: 'sync-complete', 
        direction: 'to-server', 
        successCount, 
        errorCount 
      });

      return { success: true, successCount, errorCount };
    } catch (error) {
      console.error('[Sync] Erreur lors de la synchronisation vers le serveur:', error);
      this.notifyListeners({ type: 'sync-error', direction: 'to-server', error });
      return { success: false, error };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Exécute une opération en attente
   */
  async executePendingOperation(op) {
    switch (op.type) {
      case 'upload':
        return await fileService.upload(op.data.file, op.data.folderId);
      
      case 'delete-file':
        return await fileService.delete(op.data.fileId);
      
      case 'delete-folder':
        return await folderService.delete(op.data.folderId);
      
      case 'rename-file':
        return await fileService.rename(op.data.fileId, op.data.newName);
      
      case 'rename-folder':
        return await folderService.rename(op.data.folderId, op.data.newName);
      
      case 'create-folder':
        return await folderService.create(op.data.name, op.data.parentId);
      
      case 'move-file':
        return await fileService.move(op.data.fileId, op.data.destinationFolderId);
      
      case 'move-folder':
        return await folderService.move(op.data.folderId, op.data.destinationFolderId);
      
      default:
        console.warn(`[Sync] Type d'opération inconnu: ${op.type}`);
    }
  }

  /**
   * Synchronisation complète (bidirectionnelle)
   */
  async fullSync() {
    if (!this.isOnline()) {
      return { success: false, reason: 'offline' };
    }

    // D'abord envoyer les opérations en attente
    const toServerResult = await this.syncToServer();
    
    // Puis récupérer les données du serveur
    const fromServerResult = await this.syncFromServer();

    return {
      success: toServerResult.success && fromServerResult.success,
      toServer: toServerResult,
      fromServer: fromServerResult
    };
  }

  /**
   * Récupère les fichiers depuis le cache local
   */
  async getLocalFiles(folderId = null) {
    if (folderId) {
      return await offlineDB.getFilesByFolder(folderId);
    }
    return await offlineDB.getAllFiles();
  }

  /**
   * Récupère les dossiers depuis le cache local
   */
  async getLocalFolders() {
    return await offlineDB.getAllFolders();
  }

  /**
   * Upload d'un fichier (en ligne ou hors ligne)
   */
  async uploadFile(file, folderId = null) {
    if (this.isOnline()) {
      try {
        // En ligne : upload direct
        const response = await fileService.upload(file, folderId);
        const uploadedFile = response.data.data;
        
        // Sauvegarder localement
        await offlineDB.saveFile(uploadedFile);
        const blob = new Blob([file], { type: file.type });
        await offlineDB.saveFileContent(uploadedFile.id, blob);
        
        return { success: true, file: uploadedFile, mode: 'online' };
      } catch (err) {
        console.error('[Sync] Erreur upload en ligne:', err);
        // Si erreur, basculer en mode hors ligne
      }
    }

    // Hors ligne : sauvegarder localement et ajouter à la queue
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fileMetadata = {
      id: tempId,
      name: file.name,
      size: file.size,
      type: 'file',
      mime_type: file.type,
      folder_id: folderId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_temp: true // Marqueur pour les fichiers temporaires
    };

    await offlineDB.saveFile(fileMetadata);
    const blob = new Blob([file], { type: file.type });
    await offlineDB.saveFileContent(tempId, blob);

    // Ajouter à la queue de synchronisation
    await offlineDB.addPendingOperation({
      type: 'upload',
      data: { file, folderId },
      tempId
    });

    return { success: true, file: fileMetadata, mode: 'offline' };
  }

  /**
   * Suppression d'un fichier (en ligne ou hors ligne)
   */
  async deleteFile(fileId) {
    // Supprimer localement immédiatement
    await offlineDB.deleteFile(fileId);

    if (this.isOnline()) {
      try {
        await fileService.delete(fileId);
        return { success: true, mode: 'online' };
      } catch (err) {
        console.error('[Sync] Erreur suppression en ligne:', err);
      }
    }

    // Hors ligne : ajouter à la queue
    await offlineDB.addPendingOperation({
      type: 'delete-file',
      data: { fileId }
    });

    return { success: true, mode: 'offline' };
  }

  /**
   * Création d'un dossier (en ligne ou hors ligne)
   */
  async createFolder(name, parentId = null) {
    if (this.isOnline()) {
      try {
        const response = await folderService.create(name, parentId);
        const folder = response.data.data;
        await offlineDB.saveFolder(folder);
        return { success: true, folder, mode: 'online' };
      } catch (err) {
        console.error('[Sync] Erreur création dossier en ligne:', err);
      }
    }

    // Hors ligne : créer localement
    const tempId = `temp-folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const folder = {
      id: tempId,
      name,
      parent_id: parentId,
      type: 'folder',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_temp: true
    };

    await offlineDB.saveFolder(folder);
    await offlineDB.addPendingOperation({
      type: 'create-folder',
      data: { name, parentId },
      tempId
    });

    return { success: true, folder, mode: 'offline' };
  }

  /**
   * Renommage d'un fichier (en ligne ou hors ligne)
   */
  async renameFile(fileId, newName) {
    if (this.isOnline()) {
      try {
        await fileService.rename(fileId, newName);
        // Mettre à jour localement
        const files = await offlineDB.getAllFiles();
        const file = files.find(f => f.id === fileId);
        if (file) {
          file.name = newName;
          file.updated_at = new Date().toISOString();
          await offlineDB.saveFile(file);
        }
        return { success: true, mode: 'online' };
      } catch (err) {
        console.error('[Sync] Erreur renommage en ligne:', err);
      }
    }

    // Hors ligne : mettre à jour localement et ajouter à la queue
    const files = await offlineDB.getAllFiles();
    const file = files.find(f => f.id === fileId);
    if (file) {
      file.name = newName;
      file.updated_at = new Date().toISOString();
      await offlineDB.saveFile(file);
    }

    await offlineDB.addPendingOperation({
      type: 'rename-file',
      data: { fileId, newName }
    });

    return { success: true, mode: 'offline' };
  }
}

const syncService = new SyncService();

export default syncService;
