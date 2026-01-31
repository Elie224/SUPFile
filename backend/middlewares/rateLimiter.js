// Rate limiting middleware pour protéger contre les attaques de force brute
const rateLimit = require('express-rate-limit');

// Rate limiter général pour toutes les routes (éviter 429 en usage normal)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requêtes / 15 min par IP (usage normal : dashboard, fichiers, preview, etc.)
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
      status: 429,
    },
  },
  standardHeaders: true, // Retourner les headers de rate limit dans `RateLimit-*`
  legacyHeaders: false, // Désactiver les headers `X-RateLimit-*`
});

// Rate limiter pour l'authentification (configurable via env)
const AUTH_WINDOW_MS = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 min par défaut
const AUTH_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10; // 10 tentatives par défaut (au lieu de 5)

const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  message: {
    error: {
      message: `Too many login attempts from this IP, please try again after ${Math.round(AUTH_WINDOW_MS / 60000)} minutes.`,
      status: 429,
    },
  },
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50, // Limite de 50 uploads par IP par heure
  message: {
    error: {
      message: 'Too many uploads from this IP, please try again later.',
      status: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les partages publics (protection contre abus)
const shareLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // Limite de 20 partages créés par IP par heure
  message: {
    error: {
      message: 'Too many shares created from this IP, please try again later.',
      status: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  shareLimiter,
};


