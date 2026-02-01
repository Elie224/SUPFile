// Service client pour appels API
// À utiliser dans tous les composants React

import axios from 'axios';
import { API_URL } from '../config';

// API_URL est maintenant importé depuis config.js avec la valeur par défaut pour la production

// Créer une instance axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 s : éviter chargement infini si le backend ne répond pas (CORS, crash, etc.)
});

// Instance séparée pour les uploads (sans Content-Type par défaut)
const uploadClient = axios.create({
  baseURL: `${API_URL}/api`,
});

// Intercepteur pour ajouter le JWT à chaque requête
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Ne pas logger l'URL ni l'absence de token en production (éviter fuite d'infos)
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepteur pour les uploads - ajouter le token mais laisser Content-Type géré par le navigateur
uploadClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Ne pas définir Content-Type - laisser le navigateur le faire pour FormData
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepteur pour gérer les erreurs (notamment 401) et mode hors ligne - pour apiClient
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Détection mode hors ligne : message explicite pour l'utilisateur
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineError = new Error('Vous êtes hors ligne. Les données ne sont pas disponibles sans connexion Internet.');
      offlineError.isOffline = true;
      return Promise.reject(offlineError);
    }
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const networkError = new Error('Connexion impossible. Vérifiez votre connexion Internet.');
      networkError.isOffline = true;
      return Promise.reject(networkError);
    }
    if (error.response?.status === 401) {
      const code = error.response?.data?.error?.code;
      const msg = error.response?.data?.error?.message;
      const setDeletedMsgAndRedirect = (message) => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.setItem('deleted_account_message', message || 'Veuillez vous inscrire et vous connecter pour accéder à Supfile, votre espace de stockage.');
        window.location.href = '/login';
      };
      // Compte supprimé : ne pas tenter refresh, déconnecter et afficher le message approprié
      if (code === 'USER_DELETED') {
        setDeletedMsgAndRedirect(msg || 'Votre compte a été supprimé.');
        return Promise.reject(error);
      }
      // Token expiré - essayer de rafraîchir
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await authService.refresh(refreshToken);
          const { access_token, refresh_token } = response.data.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return apiClient.request(error.config);
        } catch (refreshError) {
          const refreshCode = refreshError.response?.data?.error?.code;
          const refreshMsg = refreshError.response?.data?.error?.message;
          if (refreshCode === 'USER_DELETED') {
            setDeletedMsgAndRedirect(refreshMsg);
          } else {
            setDeletedMsgAndRedirect(null);
          }
        }
      } else {
        setDeletedMsgAndRedirect(null);
      }
    }
    return Promise.reject(error);
  },
);

// Services d'authentification
export const authService = {
  signup: (email, password, first_name, last_name, country) =>
    apiClient.post('/auth/signup', { email, password, first_name, last_name, country }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  refresh: (refreshToken) =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refresh_token: refreshToken }),
  verifyEmail: (token) =>
    apiClient.get('/auth/verify-email', { params: { token } }),
  resendVerification: (email) =>
    apiClient.post('/auth/resend-verification', { email }),
};

// Services fichiers
export const fileService = {
  list: (folderId = null) =>
    apiClient.get('/files', { params: { folder_id: folderId } }),
  get: (fileId) => apiClient.get(`/files/${fileId}`),
  upload: (file, folderId = null, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folder_id', folderId);
    
    const config = {};
    
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      };
    }
    
    // Utiliser uploadClient qui n'a pas de Content-Type par défaut
    return uploadClient.post('/files/upload', formData, config);
  },
  initChunkedUpload: ({ name, size, mimeType, folderId }) => {
    return apiClient.post('/files/upload/init', {
      name,
      size,
      mime_type: mimeType,
      folder_id: folderId,
    });
  },
  uploadChunk: ({ uploadId, chunkIndex, totalChunks, chunk, signal }, onProgress = null) => {
    const formData = new FormData();
    formData.append('upload_id', uploadId);
    formData.append('chunk_index', String(chunkIndex));
    formData.append('total_chunks', String(totalChunks));
    formData.append('chunk', chunk);

    const config = {};
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      };
    }
    if (signal) {
      config.signal = signal;
    }

    return uploadClient.post('/files/upload/chunk', formData, config);
  },
  completeChunkedUpload: ({ uploadId, totalChunks }) => {
    return apiClient.post('/files/upload/complete', {
      upload_id: uploadId,
      total_chunks: totalChunks,
    });
  },
  getChunkedUploadStatus: (uploadId) =>
    apiClient.get('/files/upload/status', { params: { upload_id: uploadId } }),
  download: (fileId) => apiClient.get(`/files/${fileId}/download`),
  delete: (fileId) => apiClient.delete(`/files/${fileId}`),
  restore: (fileId) => apiClient.post(`/files/${fileId}/restore`),
  listTrash: () => apiClient.get('/files/trash'),
  rename: (fileId, newName) =>
    apiClient.patch(`/files/${fileId}`, { name: newName }),
  move: (fileId, newFolderId) =>
    apiClient.patch(`/files/${fileId}`, { folder_id: newFolderId }),
  preview: (fileId) => apiClient.get(`/files/${fileId}/preview`),
  stream: (fileId) => apiClient.get(`/files/${fileId}/stream`),
};

// Services dossiers
export const folderService = {
  create: (name, parentId = null) =>
    apiClient.post('/folders', { name, parent_id: parentId }),
  get: (folderId) => apiClient.get(`/folders/${folderId}`),
  rename: (folderId, newName) =>
    apiClient.patch(`/folders/${folderId}`, { name: newName }),
  move: (folderId, newParentId) =>
    apiClient.patch(`/folders/${folderId}`, { parent_id: newParentId }),
  delete: (folderId) => apiClient.delete(`/folders/${folderId}`),
  restore: (folderId) => apiClient.post(`/folders/${folderId}/restore`),
  listTrash: () => apiClient.get('/folders/trash'),
  list: (parentId = null) =>
    apiClient.get('/folders', { params: { parent_id: parentId || null } }),
};

// Services partage
export const shareService = {
  generatePublicLink: (fileId, options = {}) =>
    apiClient.post('/share/public', {
      file_id: fileId,
      password: options.password,
      expires_at: options.expiresAt,
    }),
  generateFolderLink: (folderId, options = {}) =>
    apiClient.post('/share/public', {
      folder_id: folderId,
      password: options.password,
      expires_at: options.expiresAt,
    }),
  shareWithUser: (fileId, folderId, userId) =>
    apiClient.post('/share/internal', { 
      file_id: fileId || null, 
      folder_id: folderId || null,
      shared_with_user_id: userId 
    }),
  getPublicShare: (token, password = null) => {
    const params = password ? { password } : {};
    return apiClient.get(`/share/${token}`, {
      params,
      validateStatus: () => true, // Autoriser 404, etc.
    });
  },
};

// Services utilisateur
export const userService = {
  getMe: () => apiClient.get('/users/me'),
  listUsers: (search = '') =>
    apiClient.get('/users', { params: { search } }),
  updateProfile: (data) =>
    apiClient.patch('/users/me', data),
  changePassword: (currentPassword, newPassword) =>
    apiClient.patch('/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
  // Le backend attend un objet { preferences: {...} }
  updatePreferences: (preferences) =>
    apiClient.patch('/users/me/preferences', { preferences }),
};

// Services dashboard
export const dashboardService = {
  getStats: () => apiClient.get('/dashboard'),
  search: (query, filters = {}) =>
    apiClient.get('/search', {
      params: { q: query, ...filters },
    }),
};

export default apiClient;
