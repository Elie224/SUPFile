// Middleware d'authentification JWT
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Vérifie que le token JWT est valide et l'ajoute à req.user
 */
function authMiddleware(req, res, next) {
  try {
    // Récupérer le token du header Authorization
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Please provide a JWT token in Authorization header',
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please refresh your token.',
      });
    }

    return res.status(403).json({
      error: 'Invalid token',
      message: 'The token provided is invalid or malformed.',
    });
  }
}

/**
 * Optionnel : middleware pour les routes publiques qui acceptent optionnellement un token
 */
function optionalAuthMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    }

    next();
  } catch (err) {
    // Ignorer l'erreur - route publique
    next();
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
