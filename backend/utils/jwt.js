// Utilitaires JWT
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Générer un JWT pour un utilisateur
 * @param {Object} payload - Données à encoder (id, email, etc.)
 * @returns {string} Token JWT
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    algorithm: 'HS256', // Spécifier explicitement l'algorithme pour la sécurité
  });
}

/**
 * Générer un refresh token (validité plus longue)
 * @param {Object} payload - Données à encoder
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    algorithm: 'HS256', // Spécifier explicitement l'algorithme pour la sécurité
  });
}

/**
 * Vérifier et décoder un token
 * @param {string} token
 * @param {boolean} isRefresh - Si c'est un refresh token
 * @returns {Object} Payload décodé
 */
function verifyToken(token, isRefresh = false) {
  const secret = isRefresh ? config.jwt.refreshSecret : config.jwt.secret;
  // Spécifier explicitement l'algorithme pour éviter la vulnérabilité de bypass
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
