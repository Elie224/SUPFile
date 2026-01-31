/**
 * Service de base de données locale (IndexedDB) pour le mode hors ligne complet.
 * Stocke les fichiers, dossiers, et opérations en attente de synchronisation.
 */

const DB_NAME = 'SUPFileOfflineDB';
const DB_VERSION = 1;

class OfflineDB {
  constructor() {
    this.db = null;
  }

  /**
   * Initialise la base de données IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store pour les fichiers
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('folder_id', 'folder_id', { unique: false });
          fileStore.createIndex('name', 'name', { unique: false });
          fileStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Store pour les dossiers
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          folderStore.createIndex('parent_id', 'parent_id', { unique: false });
          folderStore.createIndex('name', 'name', { unique: false });
        }

        // Store pour les contenus de fichiers (Blob)
        if (!db.objectStoreNames.contains('fileContents')) {
          db.createObjectStore('fileContents', { keyPath: 'fileId' });
        }

        // Store pour les opérations en attente (queue de synchronisation)
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const opStore = db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true });
          opStore.createIndex('timestamp', 'timestamp', { unique: false });
          opStore.createIndex('type', 'type', { unique: false });
        }

        // Store pour les métadonnées utilisateur
        if (!db.objectStoreNames.contains('userMeta')) {
          db.createObjectStore('userMeta', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Sauvegarde un fichier (métadonnées)
   */
  async saveFile(file) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['files'], 'readwrite');
      const store = tx.objectStore('files');
      const request = store.put(file);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sauvegarde le contenu d'un fichier (Blob)
   */
  async saveFileContent(fileId, blob) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['fileContents'], 'readwrite');
      const store = tx.objectStore('fileContents');
      const request = store.put({ fileId, blob, savedAt: new Date() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Récupère le contenu d'un fichier
   */
  async getFileContent(fileId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['fileContents'], 'readonly');
      const store = tx.objectStore('fileContents');
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Récupère tous les fichiers d'un dossier
   */
  async getFilesByFolder(folderId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['files'], 'readonly');
      const store = tx.objectStore('files');
      const index = store.index('folder_id');
      const request = index.getAll(folderId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Récupère tous les fichiers
   */
  async getAllFiles() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['files'], 'readonly');
      const store = tx.objectStore('files');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(fileId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['files', 'fileContents'], 'readwrite');
      tx.objectStore('files').delete(fileId);
      tx.objectStore('fileContents').delete(fileId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Sauvegarde un dossier
   */
  async saveFolder(folder) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['folders'], 'readwrite');
      const store = tx.objectStore('folders');
      const request = store.put(folder);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Récupère tous les dossiers
   */
  async getAllFolders() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['folders'], 'readonly');
      const store = tx.objectStore('folders');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Supprime un dossier
   */
  async deleteFolder(folderId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['folders'], 'readwrite');
      const store = tx.objectStore('folders');
      const request = store.delete(folderId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ajoute une opération en attente (pour synchronisation ultérieure)
   */
  async addPendingOperation(operation) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['pendingOperations'], 'readwrite');
      const store = tx.objectStore('pendingOperations');
      const request = store.add({
        ...operation,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Récupère toutes les opérations en attente
   */
  async getPendingOperations() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['pendingOperations'], 'readonly');
      const store = tx.objectStore('pendingOperations');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Supprime une opération en attente
   */
  async deletePendingOperation(id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['pendingOperations'], 'readwrite');
      const store = tx.objectStore('pendingOperations');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sauvegarde une métadonnée utilisateur
   */
  async setUserMeta(key, value) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['userMeta'], 'readwrite');
      const store = tx.objectStore('userMeta');
      const request = store.put({ key, value, updatedAt: new Date() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Récupère une métadonnée utilisateur
   */
  async getUserMeta(key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['userMeta'], 'readonly');
      const store = tx.objectStore('userMeta');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Vide toutes les données (pour déconnexion ou reset)
   */
  async clearAll() {
    if (!this.db) await this.init();
    const stores = ['files', 'folders', 'fileContents', 'pendingOperations', 'userMeta'];
    return Promise.all(
      stores.map(storeName => {
        return new Promise((resolve, reject) => {
          const tx = this.db.transaction([storeName], 'readwrite');
          const request = tx.objectStore(storeName).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      })
    );
  }
}

// Instance singleton
const offlineDB = new OfflineDB();

export default offlineDB;
