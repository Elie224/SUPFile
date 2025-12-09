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
  return jwt.verify(token, secret);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
