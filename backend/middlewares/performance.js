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
    if (res.headersSent) {
      return res; // Déjà envoyé (ex. express-session rappelle end), ne rien faire
    }
    const duration = performance.now() - startTime;
    if (duration > 1000 && process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️ Slow request: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`);
    }
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
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


