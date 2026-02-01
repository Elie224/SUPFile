// Configuration centralisée du serveur
require('dotenv').config();

module.exports = {
  server: {
    // Render utilise PORT, sinon SERVER_PORT, sinon 5000 par défaut
    port: process.env.PORT || process.env.SERVER_PORT || 5000,
    host: process.env.SERVER_HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    // MongoDB connection string (mongodb://[REDACTED]
    mongoUri: process.env.MONGO_URI || process.env.DB_URI,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 27017,
    user: process.env.MONGO_INITDB_ROOT_USERNAME,
    password: process.env.MONGO_INITDB_ROOT_PASSWORD,
    database: process.env.POSTGRES_DB || process.env.MONGO_INITDB_DATABASE,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '1h',
    refreshExpiresIn: '7d',
  },
  cors: {
    origin: function (origin, callback) {
      // Liste des origines autorisées par défaut
      let defaultOrigins = '';
      
      if (process.env.NODE_ENV === 'production') {
        // En production : Render, Netlify, Fly, + localhost pour tests locaux
        defaultOrigins = 'https://supfile.com,https://supfile-frontend.onrender.com,https://supfile-frontend-1.onrender.com,https://flourishing-banoffee-c0b1ad.netlify.app,https://supfile.netlify.app,https://supfile.fly.dev,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000';
      } else {
        // En développement, autoriser localhost
        defaultOrigins = 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:19000,exp://localhost:19000';
      }
      
      // Construire la liste des origines autorisées
      const envOrigins = process.env.CORS_ORIGIN || '';
      const allOriginsString = envOrigins 
        ? `${envOrigins},${defaultOrigins}` 
        : defaultOrigins;
      
      const allowedOrigins = allOriginsString
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0);
      
      // Autoriser les requêtes sans origine (comme les requêtes depuis Postman, curl, ou applications mobiles)
      // En production, être plus strict mais permettre si l'origine est définie dans CORS_ORIGIN
      if (!origin) {
        if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
          // Si CORS_ORIGIN n'est pas défini en production, permettre les requêtes sans origine
          // pour la compatibilité avec les applications mobiles
          return callback(null, true);
        }
        return callback(null, true);
      }
      
      // Vérifier si l'origine est autorisée
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // En développement, autoriser localhost, 127.0.0.1, et les adresses IP locales (192.168.x.x, 10.x.x.x)
        if (process.env.NODE_ENV !== 'production') {
          if (origin.includes('localhost') || 
              origin.includes('127.0.0.1') ||
              origin.match(/^http:\/\/192\.168\.\d+\.\d+/) ||
              origin.match(/^http:\/\/10\.\d+\.\d+\.\d+/)) {
            return callback(null, true);
          }
        }
        
        // En production, autoriser aussi les sous-domaines Render, Netlify et Fly (au cas où NODE_ENV ou CORS_ORIGIN ne sont pas définis)
        if (process.env.NODE_ENV === 'production' || !process.env.NODE_ENV) {
          if (origin && (origin.match(/^https:\/\/.*\.onrender\.com$/) ||
              origin.match(/^https:\/\/.*\.netlify\.app$/) ||
              origin.match(/^https:\/\/.*\.fly\.dev$/))) {
            return callback(null, true);
          }
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.warn('CORS blocked origin');
        }
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    // Autoriser toutes les méthodes HTTP nécessaires
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // Autoriser tous les headers de requête (y compris Authorization, Content-Type, etc.)
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    // Exposer les headers de réponse nécessaires pour les téléchargements
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges'],
    // S'assurer que les réponses OPTIONS ont le bon code de statut
    optionsSuccessStatus: 200,
    // Préflight continue pendant 24 heures
    maxAge: 86400,
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || 32212254720), // 30 Go par défaut (30 * 1024 * 1024 * 1024 bytes)
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || (process.env.NODE_ENV === 'production' 
        ? 'https://supfile-1.onrender.com/api/auth/google/callback'
        : 'http://localhost:5000/api/auth/google/callback'),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri: process.env.GITHUB_REDIRECT_URI || (process.env.NODE_ENV === 'production'
        ? 'https://supfile-1.onrender.com/api/auth/github/callback'
        : 'http://localhost:5000/api/auth/github/callback'),
    },
  },
};
