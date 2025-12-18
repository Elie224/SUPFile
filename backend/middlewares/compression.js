// Middleware de compression HTTP pour améliorer les performances
const compression = require('compression');

/**
 * Configuration de la compression HTTP
 * Compresse les réponses pour réduire la bande passante et améliorer les performances
 */
const compressionMiddleware = compression({
  // Seuil minimum de taille pour compresser (1KB)
  threshold: 1024,
  
  // Niveau de compression (1-9, 6 est un bon compromis)
  level: 6,
  
  // Filtrer les types de contenu à compresser
  filter: (req, res) => {
    // Ne pas compresser si le client ne le supporte pas
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    const contentType = res.getHeader('content-type') || '';
    
    // Compresser JSON, HTML, CSS, JS, XML, texte
    if (
      contentType.includes('application/json') ||
      contentType.includes('text/html') ||
      contentType.includes('text/css') ||
      contentType.includes('text/javascript') ||
      contentType.includes('application/javascript') ||
      contentType.includes('text/xml') ||
      contentType.includes('application/xml') ||
      contentType.includes('text/plain')
    ) {
      return true;
    }
    
    // Utiliser la fonction de filtrage par défaut pour les autres types
    return compression.filter(req, res);
  },
});

module.exports = compressionMiddleware;

