// Wrapper pour les routes async pour capturer les erreurs automatiquement
// Évite d'avoir à répéter try/catch dans chaque contrôleur

/**
 * Wrapper pour les fonctions async qui capture automatiquement les erreurs
 * @param {Function} fn - Fonction async à wrapper
 * @returns {Function} - Fonction wrapper qui passe les erreurs au middleware d'erreur
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;

