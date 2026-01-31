const express = require('express');
const app = express();

// Fly.io : écouter immédiatement sur /health pour que le health check réussisse
app.set('trust proxy', 1);
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
const PORT = parseInt(process.env.PORT, 10) || 5000;

function loadRestOfApp() {
  const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs').promises;
const session = require('express-session');
const passport = require('passport');
const config = require('./config');
const { errorHandler } = require('./middlewares/errorHandler');
const { generalLimiter, authLimiter, uploadLimiter, shareLimiter } = require('./middlewares/rateLimiter');
const { sanitizeQuery, validateName } = require('./middlewares/security');
const compressionMiddleware = require('./middlewares/compression');
const { performanceMiddleware } = require('./middlewares/performance');
const { cacheMiddleware, invalidateUserCache } = require('./utils/cache');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

const db = require('./models/db');
const configurePassport = require('./config/passport');
configurePassport();

/**
 * Crée le répertoire d'upload s'il n'existe pas
 * Cette fonction est appelée au démarrage du serveur pour s'assurer
 * que le dossier d'upload est prêt à recevoir des fichiers
 */
async function ensureUploadDir() {
  try {
    const uploadDir = path.resolve(config.upload.uploadDir);
    await fs.mkdir(uploadDir, { recursive: true });
    logger.logInfo('Upload directory ready', { uploadDir });
  } catch (err) {
    logger.logError(err, { context: 'ensureUploadDir' });
  }
}
ensureUploadDir();

/**
 * Attend que MongoDB soit connecté avant de démarrer le serveur HTTP
 * Cette fonction vérifie l'état de la connexion MongoDB et attend
 * un maximum de 30 secondes avant de continuer
 * @returns {Promise<void>}
 */
async function startServer() {
  try {
    // Démarrer le serveur rapidement - ne pas attendre MongoDB trop longtemps
    // Fly.io vérifie rapidement si l'application écoute, donc on démarre le serveur rapidement
    const MAX_WAIT_TIME = 5000; // 5 secondes maximum (réduit de 30s pour démarrer plus vite)
    const POLL_INTERVAL = 200; // Vérifier toutes les 200ms (plus rapide)
    const startTime = Date.now();
    
    // Vérifier rapidement l'état de MongoDB sans bloquer
    try {
      // Utiliser Promise.race pour ne pas attendre trop longtemps
      const connectionResult = await Promise.race([
        db.connectionPromise,
        new Promise(resolve => setTimeout(() => resolve(null), MAX_WAIT_TIME))
      ]);
      
      // Vérifier si la connexion a réussi
      if (connectionResult === null) {
        logger.logWarn('MongoDB connection pending or failed, starting server anyway...');
      } else {
        // Vérifier l'état de la connexion
        if (db.connection.readyState === 1) {
          logger.logInfo('MongoDB ready, starting server...');
        } else {
          logger.logWarn('MongoDB connection pending, starting server anyway...', {
            readyState: db.connection.readyState,
            message: 'Server will start but database operations may fail until MongoDB connects'
          });
        }
      }
    } catch (connErr) {
      // Si la connexion échoue, démarrer le serveur quand même
      logger.logWarn('MongoDB connection error, starting server anyway...', { error: connErr.message });
    }
    
    // Toujours démarrer le serveur rapidement, même si MongoDB n'est pas connecté
    logger.logInfo('Starting HTTP server...');
  } catch (err) {
    logger.logError(err, { context: 'startServer' });
    // Ne pas bloquer le démarrage du serveur même en cas d'erreur
    logger.logWarn('Error in startServer, but continuing with server startup...');
  }
}

// ============================================================
// MIDDLEWARES GLOBAUX
// ============================================================

// CORS en premier pour que toutes les réponses (y compris erreurs) aient les en-têtes
app.use(cors(config.cors));

// Réponse explicite aux preflight OPTIONS (évite blocage CORS quand le navigateur envoie OPTIONS avant GET/POST)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.get('Origin') || '';
    const allowed = origin.match(/\.netlify\.app$/) || origin.match(/\.onrender\.com$/) || origin.includes('localhost');
    const allowOrigin = allowed ? origin : (process.env.CORS_ORIGIN || '').split(',')[0].trim();
    if (allowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  next();
});

// Compression HTTP - Réduit la taille des réponses (DOIT être avant les routes)
app.use(compressionMiddleware);

// Performance monitoring - Mesure les temps de réponse
app.use(performanceMiddleware);

// Security middleware - Protection contre les vulnérabilités courantes
// NOTE: crossOriginResourcePolicy doit être "cross-origin" pour permettre les requêtes CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false, // Désactivé pour permettre les ressources externes
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.onrender.com"], // Autoriser les connexions vers Render
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// Rate limiting global
app.use(generalLimiter);

// Nettoyage des requêtes contre les injections NoSQL
app.use(sanitizeQuery);

// Session middleware pour OAuth (doit être avant Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || config.jwt.secret || 'supfile-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    sameSite: 'lax',
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Body parser middleware - ne pas parser pour multipart/form-data (géré par multer)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 10000 }));

// Servir les fichiers statiques avec les bons en-têtes CORS
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// Servir les avatars
app.use('/avatars', express.static(path.join(__dirname, 'uploads', 'avatars'), {
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Favicon handler - retourne un favicon avec les bons en-têtes CORS
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
  
  // Vérifier si le fichier existe
  fs.access(faviconPath)
    .then(() => {
      res.setHeader('Content-Type', 'image/x-icon');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.sendFile(faviconPath);
    })
    .catch(() => {
      // Si le fichier n'existe pas, retourner un favicon minimal en mémoire
      const minimalFavicon = Buffer.from([
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00,
        0x20, 0x00, 0x68, 0x04, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00,
        0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
      
      res.setHeader('Content-Type', 'image/x-icon');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.status(200).send(minimalFavicon);
    });
});

// ============================================================
// ROUTES DE BASE (avant /api)
// ============================================================

/**
 * Health check endpoint
 * Utilisé par les systèmes de monitoring pour vérifier que l'API est en ligne
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SUPFile API is running' });
});

/**
 * Page d'accueil de l'API
 * Retourne les informations sur l'API et les endpoints disponibles
 */
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'SUPFile API',
    version: '1.0.0',
    description: 'API REST pour le stockage cloud',
    status: 'online',
    environment: config.server.nodeEnv,
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh'
      },
      files: {
        list: 'GET /api/files',
        upload: 'POST /api/files/upload',
        get: 'GET /api/files/:id',
        delete: 'DELETE /api/files/:id'
      },
      folders: {
        list: 'GET /api/folders',
        create: 'POST /api/folders',
        get: 'GET /api/folders/:id',
        delete: 'DELETE /api/folders/:id'
      },
      dashboard: 'GET /api/dashboard',
      search: 'GET /api/search',
      share: 'GET /api/share'
    },
    documentation: 'Consultez les fichiers dans le dossier docs/ pour plus d\'informations',
    frontend: process.env.FRONTEND_URL || 'https://supfile-frontend.onrender.com'
  });
});

// ============================================================
// ROUTES API
// ============================================================

// Health check - Monitoring de l'API (avant les autres routes)
app.use('/api/health', require('./routes/health'));

// Authentification - Rate limiting strict pour éviter les attaques par force brute
app.use('/api/auth', authLimiter, require('./routes/auth'));

// Utilisateurs - Gestion des profils utilisateurs
app.use('/api/users', require('./routes/users'));

// Fichiers - Upload, téléchargement, gestion des fichiers
app.use('/api/files', require('./routes/files'));

// Dossiers - Création, modification, suppression de dossiers
// Log middleware pour tracer toutes les requêtes vers /api/folders
app.use('/api/folders', (req, res, next) => {
  console.log('[APP] Request to /api/folders:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    params: req.params,
    query: req.query,
    hasAuth: !!req.headers.authorization,
    timestamp: new Date().toISOString()
  });
  next();
}, validateName, require('./routes/folders'));

// Partage - Gestion des liens de partage (rate limiting pour éviter les abus)
app.use('/api/share', shareLimiter, require('./routes/share'));

// Recherche - Recherche de fichiers et dossiers
app.use('/api/search', require('./routes/search'));

// Dashboard - Statistiques utilisateur (cache 5 minutes pour performance)
app.use('/api/dashboard', cacheMiddleware(300000), require('./routes/dashboard'));

// Administration - Endpoints réservés aux administrateurs
app.use('/api/admin', require('./routes/admin'));

// Double authentification (2FA) - Sécurité renforcée
app.use('/api/2fa', require('./routes/twoFactor'));

// ============================================================
// GESTION DES ERREURS
// ============================================================

/**
 * Handler 404 - Route non trouvée
 * DOIT être avant errorHandler pour intercepter les routes non définies
 */
app.use((req, res) => {
  const origin = req.get('Origin');
  if (origin && (origin.includes('.netlify.app') || origin.includes('.onrender.com') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(404).json({ error: { message: 'Route not found', status: 404 } });
});

/**
 * Error handler middleware
 * DOIT être en dernier pour capturer toutes les erreurs
 */
app.use(errorHandler);

const SHUTDOWN_TIMEOUT = 10000; // 10 secondes avant fermeture forcée

// ============================================================
// GESTION DU GRACEFUL SHUTDOWN
// ============================================================

/**
 * Arrêt gracieux du serveur
 * Ferme les connexions HTTP et MongoDB de manière propre
 * @param {string} signal - Signal reçu (SIGTERM, SIGINT, etc.)
 */
const gracefulShutdown = async (signal) => {
  logger.logInfo(`Received ${signal}, shutting down gracefully...`);
  
  if (server) {
    // Fermer le serveur HTTP
    server.close(async () => {
      logger.logInfo('HTTP server closed');
      
      // Fermer la connexion MongoDB
      // Mongoose 6+ : close() retourne une promesse, ne prend plus de callback
      try {
        await mongoose.connection.close(false);
        logger.logInfo('MongoDB connection closed');
        process.exit(0);
      } catch (err) {
        logger.logError(err, { context: 'MongoDB close' });
        // Sortir quand même même si la fermeture MongoDB échoue
        process.exit(0);
      }
    });
    
    // Forcer la fermeture après le timeout si nécessaire
    setTimeout(() => {
      logger.logError(new Error('Forced shutdown after timeout'), { context: 'graceful shutdown' });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);
  } else {
    // Si pas de serveur, fermer MongoDB directement
    try {
      await mongoose.connection.close(false);
      logger.logInfo('MongoDB connection closed');
    } catch (err) {
      logger.logError(err, { context: 'MongoDB close' });
    }
    process.exit(0);
  }
};

// ============================================================
// GESTION DES SIGNAUX PROCESS
// ============================================================

// Écouter les signaux de fermeture du système
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM').catch((err) => {
    logger.logError(err, { context: 'gracefulShutdown error' });
    process.exit(1);
  });
});
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT').catch((err) => {
    logger.logError(err, { context: 'gracefulShutdown error' });
    process.exit(1);
  });
});

// Gestion des erreurs non capturées - Logger et arrêt propre
process.on('uncaughtException', (err) => {
  logger.logError(err, { context: 'uncaughtException' });
  // Gérer la promesse retournée par gracefulShutdown
  gracefulShutdown('uncaughtException').catch((shutdownErr) => {
    logger.logError(shutdownErr, { context: 'gracefulShutdown error' });
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.logError(new Error(`Unhandled Rejection: ${reason}`), {
    context: 'unhandledRejection',
    promise
  });
  // Ne pas faire planter l'app au démarrage : seulement arrêt gracieux si le serveur écoute déjà
  if (server && server.listening) {
    gracefulShutdown('unhandledRejection').catch((shutdownErr) => {
      logger.logError(shutdownErr, { context: 'gracefulShutdown error' });
      process.exit(1);
    });
  }
});

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================

/**
 * Démarre le serveur HTTP après vérification de la connexion MongoDB
 * Attend que MongoDB soit prêt avant de démarrer le serveur Express
 */
  // Vérifier MongoDB en arrière-plan (serveur déjà en écoute)
  startServer().catch((err) => {
    logger.logWarn('MongoDB check failed or pending', { error: err.message });
  });
}

let server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✓ Listening on 0.0.0.0:' + PORT);
  loadRestOfApp();
});
server.on('error', (err) => {
  console.error('✗ Server error:', err.message);
  if (err.code === 'EADDRINUSE') console.error('✗ Port', PORT, 'already in use');
  process.exit(1);
});

// ============================================================
// EXPORTS
// ============================================================
module.exports = app;
