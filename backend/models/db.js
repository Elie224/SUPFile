const mongoose = require('mongoose');
const config = require('../config');

const mongoUri = config.database.mongoUri || process.env.MONGO_URI;

// Ne jamais faire process.exit(1) : permettre au serveur HTTP de démarrer (Fly.io / Render)
// pour que le health check réponde. La base sera connectée quand MONGO_URI est défini.
if (!mongoUri) {
  console.warn('⚠️ MONGO_URI non défini : le serveur démarrera mais la base sera indisponible. Définissez MONGO_URI.');
  mongoose.connectionPromise = Promise.resolve(null);
  module.exports = mongoose;
  module.exports.isConnected = () => false;
  module.exports.waitForConnection = () => Promise.reject(new Error('MONGO_URI not set'));
} else {
if (process.env.NODE_ENV !== 'production') {
  console.log('🔄 Attempting to connect to MongoDB...');
  console.log('📍 Connection URI:', mongoUri.replace(/:[^:]*@/, ':****@'));
} else {
  console.log('🔄 Connecting to MongoDB...');
}

mongoose.set('strictQuery', false);

const options = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  heartbeatFrequencyMS: 10000,
};

function isConnected() {
  return mongoose.connection.readyState === 1;
}

async function waitForConnection(maxWait = 30000) {
  const startTime = Date.now();
  while (!isConnected() && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!isConnected()) {
    throw new Error('MongoDB connection timeout');
  }
}

let connectionPromise = mongoose.connect(mongoUri, options)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    return mongoose.connection;
  })
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err.message || err);
    console.error('Ensure MongoDB is running on the configured URI.');
    return null;
  });

mongoose.connectionPromise = connectionPromise;

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✓ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('✗ MongoDB error:', err.message || err);
  } else {
    console.error('✗ MongoDB error');
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✓ MongoDB reconnected');
});

// Middleware pour vérifier la connexion avant les requêtes
mongoose.connection.on('connecting', () => {
  console.log('🔄 MongoDB connecting...');
});

// Export avec fonction de vérification
module.exports = mongoose;
module.exports.isConnected = isConnected;
module.exports.waitForConnection = waitForConnection;
}
