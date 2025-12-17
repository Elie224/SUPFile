const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs').promises;
const session = require('express-session');
const passport = require('passport');
const config = require('./config');
const { errorHandler } = require('./middlewares/errorHandler');

// Initialize MongoDB connection
const db = require('./models/db');

// Initialize Passport OAuth strategies
const configurePassport = require('./config/passport');
configurePassport(); // Appeler immédiatement pour configurer les stratégies
configurePassport();

// Créer le répertoire d'upload au démarrage
async function ensureUploadDir() {
  try {
    const uploadDir = path.resolve(config.upload.uploadDir);
    await fs.mkdir(uploadDir, { recursive: true });
    console.log(`✓ Upload directory ready: ${uploadDir}`);
  } catch (err) {
    console.error('❌ Failed to create upload directory:', err.message);
  }
}
ensureUploadDir();

// Attendre que MongoDB soit connecté avant de démarrer le serveur
async function startServer() {
  try {
    // Attendre la connexion MongoDB (max 30 secondes)
    const maxWait = 30000;
    const startTime = Date.now();
    
    // Attendre que la promesse de connexion soit résolue
    try {
      await db.connectionPromise;
      console.log('✅ MongoDB ready, starting server...');
    } catch (connErr) {
      // Si la connexion échoue, attendre un peu et vérifier l'état
      while (db.connection.readyState !== 1 && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (db.connection.readyState !== 1) {
        console.error('❌ MongoDB connection timeout. Server will start but database operations may fail.');
        console.error('   Please ensure MongoDB is running and accessible.');
      } else {
        console.log('✅ MongoDB ready, starting server...');
      }
    }
  } catch (err) {
    console.error('❌ Error waiting for MongoDB:', err.message);
  }
}

const app = express();

// Security middleware avec configuration pour permettre les ressources cross-origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false, // Désactivé pour permettre les ressources externes
  contentSecurityPolicy: false, // Désactivé pour éviter les problèmes avec les ressources statiques
}));

// CORS middleware - doit être avant les routes
app.use(cors(config.cors));

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
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SUPFile API is running' });
});

// Page d'accueil de l'API - Réponse JSON simple
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
    frontend: 'http://localhost:3000'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/files', require('./routes/files'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/share', require('./routes/share'));
app.use('/api/search', require('./routes/search'));
app.use('/api/dashboard', require('./routes/dashboard'));

// 404 handler (doit être avant errorHandler)
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found', status: 404 } });
});

// Error handling middleware (DOIT être en dernier)
app.use(errorHandler);

const PORT = config.server.port;
const HOST = config.server.host;

// Démarrer le serveur après vérification MongoDB
startServer().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`✓ SUPFile API listening on http://${HOST}:${PORT}`);
    console.log(`✓ Environment: ${config.server.nodeEnv}`);
  });
}).catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

module.exports = app;
