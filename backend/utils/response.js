// Utilitaires pour les réponses HTTP standardisées
// Assure la cohérence des réponses de l'API

/**
 * Format de réponse standard pour succès
 */
function successResponse(res, data, message = null, statusCode = 200) {
  // Normaliser certains messages historiques en français.
  if (typeof message === 'string' && message) {
    message = translateMessageToFrench(message);
  }
  const response = {
    data,
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Format de réponse standard pour erreur
 */
function errorResponse(res, message, statusCode = 400, details = null) {
  if (typeof message === 'string' && message) {
    message = translateMessageToFrench(message);
  }
  const response = {
    error: {
      status: statusCode,
      message,
    },
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Format de réponse pour pagination
 */
function paginatedResponse(res, items, pagination, message = null) {
  return successResponse(res, {
    items,
    pagination: {
      total: pagination.total,
      skip: pagination.skip || 0,
      limit: pagination.limit || 50,
      hasMore: pagination.hasMore || false,
      page: pagination.page || null,
      pages: pagination.pages || null,
    },
  }, message);
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};

function translateMessageToFrench(message) {
  // Traductions exactes (éviter les remplacements approximatifs).
  const directMap = {
    'Access denied': 'Accès refusé.',
    'File not found': 'Fichier introuvable.',
    'Folder not found': 'Dossier introuvable.',
    'Parent folder not found': 'Dossier parent introuvable.',
    'Invalid credentials': 'Identifiants incorrects.',
    'Password required': 'Mot de passe requis.',
    'Invalid password': 'Mot de passe invalide.',
    'Share expired': 'Partage expiré.',
    'Share deactivated': 'Partage désactivé.',
    'Share created': 'Partage créé.',
    'User not authenticated': 'Utilisateur non authentifié.',
  };

  if (directMap[message]) return directMap[message];

  // Quelques patterns simples.
  if (typeof message === 'string') {
    if (message.startsWith('Either file_id or folder_id is required')) {
      return 'Vous devez fournir file_id ou folder_id.';
    }
  }

  return message;
}


