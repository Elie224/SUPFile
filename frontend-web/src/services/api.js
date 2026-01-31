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

// Instance séparée pour les téléchargements (timeout plus long pour les gros fichiers)
const downloadClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 600000, // 10 minutes pour les téléchargements de dossiers volumineux
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

// Intercepteur pour les téléchargements - ajouter le token
downloadClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  
  // Logs très visibles pour debug
  console.log('========================================');
  console.log('🔑 DOWNLOAD CLIENT INTERCEPTOR');
  console.log('========================================');
  console.log('URL:', config.url);
  console.log('Method:', config.method);
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length || 0);
  console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'NONE');
  console.log('Headers before:', JSON.stringify(config.headers, null, 2));
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token added to headers');
  } else {
    console.error('❌ No access token found in localStorage for download request:', config.url);
    console.error('localStorage keys:', Object.keys(localStorage));
  }
  
  console.log('Headers after:', JSON.stringify(config.headers, null, 2));
  console.log('========================================');
  
  return config;
}, (error) => {
  console.error('❌ Download client interceptor error:', error);
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

// Intercepteur pour gérer les erreurs (notamment 401) - pour downloadClient
downloadClient.interceptors.response.use(
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
          return downloadClient.request(error.config);
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
  downloadAsZip: (folderId) => {
    // Validation stricte de l'ID
    if (folderId === null || folderId === undefined || folderId === '') {
      console.error('❌ downloadAsZip: folderId is null/undefined/empty');
      console.error('folderId value:', folderId);
      console.error('folderId type:', typeof folderId);
      return Promise.reject(new Error('Folder ID is required'));
    }
    
    // Vérifier que l'ID est une string valide
    const folderIdStr = String(folderId).trim();
    
    // Vérifier que la conversion a fonctionné
    if (folderIdStr === 'null' || folderIdStr === 'undefined' || folderIdStr === '') {
      console.error('❌ downloadAsZip: folderId converted to invalid string:', { 
        original: folderId,
        converted: folderIdStr,
        type: typeof folderId 
      });
      return Promise.reject(new Error(`Invalid folder ID: ${folderIdStr}`));
    }
    
    // Vérifier la longueur (ObjectId MongoDB = 24 caractères hex)
    if (folderIdStr.length !== 24) {
      console.error('❌ downloadAsZip: Invalid folderId length:', { 
        folderId, 
        folderIdStr, 
        length: folderIdStr.length,
        expectedLength: 24,
        type: typeof folderId 
      });
      return Promise.reject(new Error(`Invalid folder ID format: length ${folderIdStr.length} instead of 24`));
    }
    
    // Vérifier que l'ID ne contient que des caractères hexadécimaux
    if (!/^[0-9a-fA-F]{24}$/.test(folderIdStr)) {
      console.error('❌ downloadAsZip: folderId contains invalid characters:', { 
        folderId, 
        folderIdStr,
        regexTest: /^[0-9a-fA-F]{24}$/.test(folderIdStr)
      });
      return Promise.reject(new Error(`Invalid folder ID format: contains non-hexadecimal characters`));
    }
    
    // Vérifier que baseURL est défini et valide
    if (!downloadClient.defaults.baseURL) {
      console.error('❌ downloadAsZip: baseURL is not defined!');
      return Promise.reject(new Error('API baseURL is not configured'));
    }
    
    // Construire l'URL de manière sécurisée
    const url = `/folders/${encodeURIComponent(folderIdStr)}/download`;
    const fullUrl = `${downloadClient.defaults.baseURL}${url}`;
    
    // Vérifier que l'URL est valide
    try {
      new URL(fullUrl);
    } catch (urlError) {
      console.error('❌ downloadAsZip: Invalid URL constructed:', { 
        fullUrl, 
        baseURL: downloadClient.defaults.baseURL,
        url,
        error: urlError.message
      });
      return Promise.reject(new Error(`Invalid URL: ${fullUrl}`));
    }
    
    // Logs très visibles pour debug
    console.log('========================================');
    console.log('✅ CALLING downloadAsZip');
    console.log('========================================');
    console.log('folderId:', folderIdStr);
    console.log('folderId length:', folderIdStr.length);
    console.log('folderId charCodes:', Array.from(folderIdStr).map(c => c.charCodeAt(0)).join(','));
    console.log('url:', url);
    console.log('url length:', url.length);
    console.log('fullUrl:', fullUrl);
    console.log('fullUrl length:', fullUrl.length);
    console.log('baseURL:', downloadClient.defaults.baseURL);
    console.log('========================================');
    
    // Vérifier que l'URL est correcte avant l'appel
    if (!url.includes(folderIdStr)) {
      console.error('❌ CRITICAL: folderId not in URL!', { folderIdStr, url });
      return Promise.reject(new Error('URL construction failed: folderId not in URL'));
    }
    
    // Vérifier que l'URL fait la bonne longueur (base + /folders/ + 24 chars + /download)
    const expectedUrlLength = `/folders/`.length + 24 + `/download`.length;
    if (url.length !== expectedUrlLength) {
      console.error('❌ CRITICAL: URL length incorrect!', { 
        url, 
        urlLength: url.length, 
        expectedLength: expectedUrlLength 
      });
      return Promise.reject(new Error(`URL length incorrect: ${url.length} instead of ${expectedUrlLength}`));
    }
    
    console.log('✅ URL validation passed, making request...');
    return downloadClient.get(url, { responseType: 'blob' });
  },
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
