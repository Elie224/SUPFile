const express = require('express');
const app = express();
const config = require('./config');
const cors = require('cors');

// Fly.io : écouter immédiatement sur /health pour que le health check réussisse
app.set('trust proxy', 1);
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
const PORT = parseInt(process.env.PORT, 10) || 5000;

// CORS et prévolée OPTIONS AVANT listen() pour que toute requête (y compris preflight) ait les en-têtes
app.use(cors(config.cors));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.get('Origin') || '';
    const allowed = origin === 'https://supfile.com' || origin.match(/\.netlify\.app$/) || origin.match(/\.fly\.dev$/) || origin.includes('localhost');
    const allowOrigin = allowed ? origin : (process.env.CORS_ORIGIN || '').split(',')[0].trim();
    if (allowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, Range, Cache-Control, Pragma, X-Request-Nonce, X-Request-Timestamp'
    );
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  next();
});

// Fly.io : répondre 503 tant que loadRestOfApp n'a pas fini (évite requêtes perdues)
let appReady = false;
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  if (!appReady) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(503).json({ error: { message: 'Starting up' } });
  }
  next();
});

function loadRestOfApp() {
  const { ensureProductionSecrets } = require('./utils/securityCheck');
  ensureProductionSecrets();

  const helmet = require('helmet');
  const hpp = require('hpp');
  const path = require('path');
  const fs = require('fs').promises;
  const session = require('express-session');
  const passport = require('passport');
const { errorHandler } = require('./middlewares/errorHandler');
const { generalLimiter, authLimiter, uploadLimiter, shareLimiter } = require('./middlewares/rateLimiter');
const { sanitizeQuery, validateName } = require('./middlewares/security');
const compressionMiddleware = require('./middlewares/compression');
const { performanceMiddleware } = require('./middlewares/performance');
const { requestTimeout } = require('./middlewares/requestTimeout');
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
    logger.logInfo('Upload directory ready', { uploadDir, note: 'UPLOAD_DIR / file_path must point here in production (e.g. Fly volume)' });
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
    const allowed = origin === 'https://supfile.com' || origin.match(/\.netlify\.app$/) || origin.match(/\.fly\.dev$/) || origin.includes('localhost');
    const allowOrigin = allowed ? origin : (process.env.CORS_ORIGIN || '').split(',')[0].trim();
    if (allowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, X-Request-Nonce, X-Request-Timestamp'
    );
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  next();
});

// Compression HTTP - Réduit la taille des réponses (DOIT être avant les routes)
app.use(compressionMiddleware);

// Timeouts best-effort - protège contre requêtes lentes/bloquées (hors streaming)
app.use(requestTimeout({ defaultTimeoutMs: 120000 }));

// Performance monitoring - Mesure les temps de réponse
app.use(performanceMiddleware);

// Security middleware - Protection contre les vulnérabilités courantes
// NOTE: crossOriginResourcePolicy doit être "cross-origin" pour permettre les requêtes CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false, // Désactivé pour permettre les ressources externes
  // On désactive frameguard globalement pour pouvoir autoriser l'embed (iframe) sur /api/files/:id/preview.
  // On réapplique ensuite X-Frame-Options=SAMEORIGIN sur toutes les autres routes via un middleware dédié.
  frameguard: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        'https://supfile.com',
        'https://*.netlify.app',
        'https://*.fly.dev',
        'http://localhost:*',
        'http://127.0.0.1:*',
        'https://localhost:*',
        'https://127.0.0.1:*',
      ],
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

// X-Frame-Options / frame-ancestors
// - Par défaut: SAMEORIGIN (anti-clickjacking)
// - Exception: /api/files/:id/preview doit pouvoir être affiché dans un iframe (Flutter Web)
app.use((req, res, next) => {
  const path = (req.originalUrl || '').split('?')[0];
  const isFilePreview = /^\/api\/files\/[a-f0-9]{24}\/preview$/i.test(path);

  if (isFilePreview) {
    res.removeHeader('X-Frame-Options');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://*.netlify.app https://*.fly.dev https://supfile.com"
    );
  } else {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }

  next();
});

// Rate limiting global
app.use(generalLimiter);

// Protection contre HTTP Parameter Pollution (ex: ?id=1&id[$ne]=2)
// Valeur par défaut: garde le dernier paramètre, empêche les tableaux inattendus.
app.use(hpp());

// Session middleware pour OAuth (doit être avant Passport)
// En production, aucun fallback : ensureProductionSecrets() a déjà vérifié SESSION_SECRET ou JWT_SECRET
const sessionSecret = process.env.SESSION_SECRET || config.jwt.secret;

let sessionStore;
if (process.env.NODE_ENV === 'production') {
  try {
    const MongoStore = require('connect-mongo');
    const mongoUrl = process.env.MONGO_URI || config.database.mongoUri;
    if (mongoUrl) {
      sessionStore = MongoStore.create({
        mongoUrl,
        touchAfter: 24 * 3600,
      });
    }
  } catch {
    // connect-mongo not installed or not usable; fallback to MemoryStore
  }
}

app.use(session({
  secret: process.env.NODE_ENV === 'production' ? sessionSecret : (sessionSecret || 'supfile-session-secret-change-in-production'),
  store: sessionStore,
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
// Défaut plus strict pour limiter les abus (uploads passent par multipart/multer)
const bodyLimit = process.env.JSON_BODY_LIMIT || '2mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ limit: bodyLimit, extended: true, parameterLimit: 10000 }));

// Nettoyage des requêtes contre les injections NoSQL (après parsing du body)
app.use(sanitizeQuery);

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
 * En production : infos minimales (pas de liste d'endpoints ni d'URL frontend)
 */
app.get('/', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const payload = {
    name: 'SUPFile API',
    version: '1.0.0',
    status: 'online',
    ...(isProduction ? {} : {
      description: 'API REST pour le stockage cloud',
      environment: config.server.nodeEnv,
      endpoints: {
        health: 'GET /health',
        auth: { register: 'POST /api/auth/register', login: 'POST /api/auth/login', logout: 'POST /api/auth/logout', refresh: 'POST /api/auth/refresh' },
        files: { list: 'GET /api/files', upload: 'POST /api/files/upload', get: 'GET /api/files/:id', delete: 'DELETE /api/files/:id' },
        folders: { list: 'GET /api/folders', create: 'POST /api/folders', get: 'GET /api/folders/:id', delete: 'DELETE /api/folders/:id' },
        dashboard: 'GET /api/dashboard',
        search: 'GET /api/search',
        share: 'GET /api/share'
      },
      documentation: 'Consultez les fichiers dans le dossier docs/ pour plus d\'informations',
      frontend: process.env.FRONTEND_URL || 'http://localhost:3000'
    })
  };
  res.status(200).json(payload);
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
app.use('/api/folders', validateName, require('./routes/folders'));

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
  if (origin && (origin === 'https://supfile.com' || origin.includes('.netlify.app') || origin.includes('.onrender.com') || origin.includes('.fly.dev') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(404).json({ error: { message: 'Route introuvable', status: 404 } });
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

} // fin loadRestOfApp

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================

/**
 * Démarre le serveur HTTP.
 * Fly.io : listen() immédiatement pour que le health check réussisse tout de suite,
 * puis loadRestOfApp() dans le callback (MongoDB, OAuth, routes).
 */
let server;

if (process.env.NODE_ENV === 'test') {
  loadRestOfApp();
} else {
  const host = '0.0.0.0';
  server = app.listen(PORT, host, () => {
    console.log('✓ Listening on ' + host + ':' + PORT);
    try {
      loadRestOfApp();
      appReady = true;
    } catch (err) {
      console.error('✗ Startup error:', err.message);
      console.error(err.stack);
      process.exit(1);
    }
  });

  // Server-level timeouts (best-effort hardening under load)
  // Keep permissive to avoid breaking large uploads/downloads.
  try {
    server.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS, 10) || 65000;
    server.headersTimeout = parseInt(process.env.HEADERS_TIMEOUT_MS, 10) || 66000;
    server.requestTimeout = parseInt(process.env.SERVER_REQUEST_TIMEOUT_MS, 10) || 0; // 0 = no hard cap
  } catch {
    // ignore
  }

  server.on('error', (err) => {
    console.error('✗ Server error:', err.message);
    if (err.code === 'EADDRINUSE') console.error('✗ Port', PORT, 'already in use');
    process.exit(1);
  });
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = app;
