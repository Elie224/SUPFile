// Middlewares de performance et monitoring
const { performance } = require('perf_hooks');

/**
 * Middleware pour mesurer le temps de réponse
 */
function performanceMiddleware(req, res, next) {
  const startTime = performance.now();

  // Intercepter res.end pour mesurer le temps (éviter ERR_HTTP_HEADERS_SENT si express-session appelle end() après la route)
  const originalEnd = res.end.bind(res);
  res.end = function(...args) {
    const duration = performance.now() - startTime;
    if (duration > 1000 && process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️ Slow request: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`);
    }

    // On ne doit jamais bloquer la fin de la réponse.
    // Si les headers sont déjà envoyés (streaming, downloads, etc.), on ne peut plus ajouter d'en-tête.
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }

    return originalEnd(...args);
  };

  next();
}

/**
 * Middleware pour optimiser les requêtes MongoDB
 * Ajoute des hints pour les requêtes fréquentes
 */
function optimizeQuery(req, res, next) {
  // Ajouter des hints pour les requêtes de fichiers/dossiers
  if (req.query.folder_id || req.query.parent_id) {
    req.queryOptimization = {
      hint: { owner_id: 1, folder_id: 1, is_deleted: 1 },
    };
  }

  next();
}

module.exports = {
  performanceMiddleware,
  optimizeQuery,
};


