// Middleware de gestion d'erreurs
const logger = require('../utils/logger');

/**
 * Classe personnalisée pour les erreurs de l'API
 */
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}

/**
 * Middleware global de gestion d'erreurs
 * DOIT être enregistré en DERNIER dans app.js
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Logger l'erreur
  if (status >= 500) {
    logger.error(`[${status}] ${message}`, err);
  } else {
    logger.warn(`[${status}] ${message}`);
  }

  // Répondre avec erreur JSON
  res.status(status).json({
    error: {
      status,
      message,
      // En production, ne pas exposer le stack
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

/**
 * Wrapper pour les routes async pour capturer les erreurs
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
};
