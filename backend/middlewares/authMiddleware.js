// Middleware d'authentification JWT
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config');
require('../models/userModel');
const BlockedEmailModel = require('../models/blockedEmailModel');

/**
 * Vérifie que le token JWT est valide, que l'utilisateur existe encore en BDD,
 * et l'ajoute à req.user. Si l'utilisateur a été supprimé, renvoie 401.
 */
async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Veuillez fournir un jeton JWT dans l’en-tête Authorization.',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Le contenu du jeton est invalide.',
      });
    }

    // Vérifier que l'utilisateur existe encore (n'a pas été supprimé par un admin)
    const User = mongoose.models.User || mongoose.model('User');
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      const userEmail = decoded.email || '';
      const isBlocked = await BlockedEmailModel.isBlocked(userEmail);
      const message = isBlocked
        ? 'Vous ne pouvez pas vous connecter. Cette adresse a été bloquée par notre système.'
        : 'Veuillez vous inscrire et vous connecter pour accéder à Supfile, votre espace de stockage.';
      return res.status(401).json({
        error: 'User deleted',
        code: 'USER_DELETED',
        email_blocked: isBlocked,
        message
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Votre session a expiré. Veuillez vous reconnecter.',
      });
    }

    return res.status(403).json({
      error: 'Invalid token',
      message: 'Le jeton fourni est invalide ou mal formé.',
    });
  }
}

function getTokenFromHeaderOrQuery(req) {
  return req.headers.authorization?.split(' ')[1] || req.query.access_token || req.query.token;
}

/**
 * Auth stricte mais compatible téléchargement direct.
 * Accepte le token depuis :
 *   - Authorization: Bearer <token>
 *   - Query param ?access_token=<token> ou ?token=<token>
 */
async function authHeaderOrQueryMiddleware(req, res, next) {
  try {
    const token = getTokenFromHeaderOrQuery(req);

    if (!token) {
      console.warn('[DL-AUTH] missing_token', {
        path: req.originalUrl?.split('?')?.[0],
        folderId: req.params?.id,
        hasAuthHeader: Boolean(req.headers.authorization),
        hasAccessTokenQuery: Boolean(req.query?.access_token),
        hasTokenQuery: Boolean(req.query?.token),
      });
      return res.status(401).json({
        error: 'No token provided',
        message: 'Veuillez fournir un jeton JWT dans l’en-tête Authorization ou via le paramètre access_token.',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Le contenu du jeton est invalide.',
      });
    }

    // Vérifier que l'utilisateur existe encore (n'a pas été supprimé par un admin)
    const User = mongoose.models.User || mongoose.model('User');
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      const userEmail = decoded.email || '';
      const isBlocked = await BlockedEmailModel.isBlocked(userEmail);
      const message = isBlocked
        ? 'Vous ne pouvez pas vous connecter. Cette adresse a été bloquée par notre système.'
        : 'Veuillez vous inscrire et vous connecter pour accéder à Supfile, votre espace de stockage.';
      return res.status(401).json({
        error: 'User deleted',
        code: 'USER_DELETED',
        email_blocked: isBlocked,
        message,
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.warn('[DL-AUTH] token_expired', {
        path: req.originalUrl?.split('?')?.[0],
        folderId: req.params?.id,
      });
      return res.status(401).json({
        error: 'Token expired',
        message: 'Votre session a expiré. Veuillez vous reconnecter.',
      });
    }

    console.warn('[DL-AUTH] invalid_token', {
      path: req.originalUrl?.split('?')?.[0],
      folderId: req.params?.id,
      name: err?.name,
    });
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Le jeton fourni est invalide ou mal formé.',
    });
  }
}

/**
 * Optionnel : middleware pour les routes publiques qui acceptent optionnellement un token
 * Accepte le token depuis :
 *   1. Header Authorization: Bearer <token>
 *   2. Query param ?token=<token> (utile pour <video src="...?token=xxx">)
 *   3. Query param ?access_token=<token> (utile pour téléchargement direct)
 */
function optionalAuthMiddleware(req, res, next) {
  try {
    // Priorité au header, puis au query param
    const token = req.headers.authorization?.split(' ')[1] || req.query.token || req.query.access_token;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
        req.user = decoded;
      } catch (err) {
        // Ignorer l'erreur - route publique
      }
    }

    next();
  } catch (err) {
    // Ignorer l'erreur - route publique
    next();
  }
}

module.exports = {
  authMiddleware,
  authHeaderOrQueryMiddleware,
  optionalAuthMiddleware,
};







