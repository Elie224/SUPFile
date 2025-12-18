// Middlewares de performance et monitoring
const { performance } = require('perf_hooks');

/**
 * Middleware pour mesurer le temps de réponse
 */
function performanceMiddleware(req, res, next) {
  const startTime = performance.now();

  // Intercepter res.end pour mesurer le temps
  const originalEnd = res.end.bind(res);
  res.end = function(...args) {
    const duration = performance.now() - startTime;
    
    // Logger les requêtes lentes (> 1 seconde)
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`);
    }
    
    // Ajouter le header X-Response-Time
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

