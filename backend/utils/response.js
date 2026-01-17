// Utilitaires pour les réponses HTTP standardisées
// Assure la cohérence des réponses de l'API

/**
 * Format de réponse standard pour succès
 */
function successResponse(res, data, message = null, statusCode = 200) {
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


