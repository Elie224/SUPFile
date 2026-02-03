// Rate limiting middleware pour protéger contre les attaques de force brute
const rateLimit = require('express-rate-limit');

// Rate limiter général pour toutes les routes (configurable via env pour éviter 429 en usage pro)
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 min par défaut
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 2000; // 2000 requêtes / fenêtre par IP (usage pro : dashboard, dossiers, preview, avatars, etc.)
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: {
    error: {
      message: 'Trop de requêtes depuis cette adresse IP. Veuillez réessayer plus tard.',
      status: 429,
    },
  },
  standardHeaders: true, // Retourner les headers de rate limit dans `RateLimit-*`
  legacyHeaders: false, // Désactiver les headers `X-RateLimit-*`
});

// Rate limiter pour l'authentification (configurable via env)
const AUTH_WINDOW_MS = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 min par défaut
const AUTH_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 30; // 30 tentatives / 15 min par défaut (seules les échecs comptent)

const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  message: {
    error: {
      message: `Trop de tentatives de connexion depuis cette adresse IP. Veuillez réessayer dans ${Math.round(AUTH_WINDOW_MS / 60000)} minute(s).`,
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
      message: 'Trop d\'uploads depuis cette adresse IP. Veuillez réessayer plus tard.',
      status: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les chunks (beaucoup plus permissif)
const CHUNK_UPLOAD_WINDOW_MS = parseInt(process.env.CHUNK_UPLOAD_WINDOW_MS, 10) || 60 * 60 * 1000; // 1 heure
const CHUNK_UPLOAD_MAX = parseInt(process.env.CHUNK_UPLOAD_MAX, 10) || 5000; // 5000 requêtes / heure par IP
const chunkUploadLimiter = rateLimit({
  windowMs: CHUNK_UPLOAD_WINDOW_MS,
  max: CHUNK_UPLOAD_MAX,
  message: {
    error: {
      message: 'Trop d\'uploads de chunks depuis cette adresse IP. Veuillez réessayer plus tard.',
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
      message: 'Trop de partages créés depuis cette adresse IP. Veuillez réessayer plus tard.',
      status: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter strict pour forgot-password et resend-verification (anti email bombing)
const emailSensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // 5 demandes max par IP par heure
  message: {
    error: {
      message: 'Trop de demandes. Réessayez dans une heure.',
      status: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour vérification et usage des tokens de réinitialisation (anti brute-force / anti-DB hammering)
const RESET_FLOW_WINDOW_MS = parseInt(process.env.RESET_FLOW_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000; // 1 heure
const RESET_FLOW_MAX = parseInt(process.env.RESET_FLOW_RATE_LIMIT_MAX, 10) || 20; // 20 req / heure par IP
const resetFlowLimiter = rateLimit({
  windowMs: RESET_FLOW_WINDOW_MS,
  max: RESET_FLOW_MAX,
  message: {
    error: {
      message: 'Trop de tentatives. Réessayez plus tard.',
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
  chunkUploadLimiter,
  shareLimiter,
  emailSensitiveLimiter,
  resetFlowLimiter,
};


