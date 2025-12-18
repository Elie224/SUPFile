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
  } else {
    console.warn('No access token found in localStorage for request:', config.url);
  }
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

// Intercepteur pour gérer les erreurs (notamment 401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré - essayer de rafraîchir
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await authService.refresh(refreshToken);
          const { access_token, refresh_token } = response.data.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          // Réessayer la requête originale
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return apiClient.request(error.config);
        } catch (refreshError) {
          // Refresh échoué - rediriger vers login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        // Pas de refresh token - rediriger vers login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Services d'authentification
export const authService = {
  signup: (email, password) =>
    apiClient.post('/auth/signup', { email, password }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  refresh: (refreshToken) =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refresh_token: refreshToken }),
};

// Services fichiers
export const fileService = {
  list: (folderId = null) =>
    apiClient.get('/files', { params: { folder_id: folderId } }),
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
  downloadAsZip: (folderId) =>
    apiClient.get(`/folders/${folderId}/download`, { responseType: 'blob' }),
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
  updatePreferences: (preferences) =>
    apiClient.patch('/users/me/preferences', preferences),
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
