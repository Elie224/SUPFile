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
      // Liste des origines autorisées
      const defaultOrigins = process.env.NODE_ENV === 'production' 
        ? [] 
        : 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:19000,exp://localhost:19000';
      const allowedOrigins = (process.env.CORS_ORIGIN || defaultOrigins)
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0);
      
      // Autoriser les requêtes sans origine (comme les requêtes depuis Postman, curl, ou applications mobiles)
      // En production, être plus strict
      if (!origin) {
        if (process.env.NODE_ENV === 'production') {
          return callback(new Error('No origin provided'));
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
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || 32212254720), // 30 Go par défaut (30 * 1024 * 1024 * 1024 bytes)
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/auth/github/callback',
    },
  },
};
