// Middleware de gestion d'erreurs
const logger = require('../utils/logger');

/**
 * Classe personnalisée pour les erreurs de l'API
 */
class AppError extends Error {
  constructor(message, status = 500, code = null, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
    this.isOperational = true; // Marquer comme erreur opérationnelle (attendue)
    
    // Capturer le stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware global de gestion d'erreurs
 * DOIT être enregistré en DERNIER dans app.js
 */
function errorHandler(err, req, res, next) {
  // Si la réponse a déjà été envoyée, déléguer au handler Express par défaut
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || 'Erreur interne du serveur';
  const code = err.code || null;
  const details = err.details || null;

  // Logger l'erreur avec contexte
  if (status >= 500) {
    logger.logError(err, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('user-agent'),
    });
  } else {
    logger.logWarn(`[${status}] ${message}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
      code,
    });
  }

  // En-têtes CORS sur les réponses d'erreur (sinon le navigateur bloque et affiche "No Access-Control-Allow-Origin")
  const origin = req.get('Origin');
  if (origin && (origin.includes('.netlify.app') || origin.includes('.onrender.com') || origin.includes('.fly.dev') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  }

  // Répondre avec erreur JSON standardisée
  const errorResponse = {
    error: {
      status,
      message,
      ...(code && { code }),
      ...(details && { details }),
      // En développement, exposer le stack pour le debugging
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        ...(err.name !== 'AppError' && { type: err.name }),
      }),
    },
  };

  res.status(status).json(errorResponse);
}

/**
 * Wrapper pour les routes async pour capturer les erreurs
 * @deprecated Utiliser asyncHandler de utils/asyncHandler.js à la place
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
