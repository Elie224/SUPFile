// Service client pour appels API
// À utiliser dans tous les composants React

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Créer une instance axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le JWT à chaque requête
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs (notamment 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré - rediriger vers login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
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
  logout: () => apiClient.post('/auth/logout'),
  oauthGoogle: (code) => apiClient.post('/auth/oauth', { provider: 'google', code }),
  oauthGithub: (code) => apiClient.post('/auth/oauth', { provider: 'github', code }),
};

// Services fichiers
export const fileService = {
  list: (folderId = null) =>
    apiClient.get('/files', { params: { folder_id: folderId } }),
  upload: (file, folderId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folder_id', folderId);
    return apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        // Retourner le progrès pour utilisation dans composant
        return percentCompleted;
      },
    });
  },
  download: (fileId) => apiClient.get(`/files/${fileId}/download`),
  delete: (fileId) => apiClient.delete(`/files/${fileId}`),
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
  rename: (folderId, newName) =>
    apiClient.patch(`/folders/${folderId}`, { name: newName }),
  delete: (folderId) => apiClient.delete(`/folders/${folderId}`),
  downloadAsZip: (folderId) =>
    apiClient.get(`/folders/${folderId}/download`, { responseType: 'blob' }),
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
  shareWithUser: (fileId, userId) =>
    apiClient.post('/share/internal', { file_id: fileId, user_id: userId }),
  getPublicShare: (token) =>
    apiClient.get(`/share/${token}`, {
      validateStatus: () => true, // Autoriser 404, etc.
    }),
};

// Services utilisateur
export const userService = {
  getMe: () => apiClient.get('/users/me'),
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
