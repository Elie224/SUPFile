// Configuration centralisée du serveur
require('dotenv').config();

module.exports = {
  server: {
    port: process.env.SERVER_PORT || 5000,
    host: process.env.SERVER_HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    connectionString: process.env.DB_URI,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '1h',
    refreshExpiresIn: '7d',
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || 5368709120), // 5GB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
};
