const mongoose = require('mongoose');
const config = require('../config');

const mongoUri = config.database.mongoUri || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ MongoDB connection string not found. Set MONGO_URI in environment.');
  process.exit(1);
}

console.log('🔄 Attempting to connect to MongoDB...');
console.log('📍 Connection URI:', mongoUri.replace(/:[^:]*@/, ':****@'));

mongoose.set('strictQuery', false);
// Note: bufferCommands et bufferMaxEntries ne sont plus supportés dans Mongoose 6+
// Le buffering est géré automatiquement par Mongoose

const options = {
  serverSelectionTimeoutMS: 30000, // 30 secondes
  socketTimeoutMS: 45000, // 45 secondes
  connectTimeoutMS: 30000, // Timeout de connexion initiale
  maxPoolSize: 50, // Augmenté pour meilleure scalabilité
  minPoolSize: 5, // Pool minimum pour performances
  maxIdleTimeMS: 30000, // Fermer les connexions inactives après 30s
  serverSelectionRetryMS: 5000, // Réessayer la sélection de serveur
  heartbeatFrequencyMS: 10000, // Vérifier la santé toutes les 10s
};

// Fonction pour vérifier si MongoDB est connecté
function isConnected() {
  return mongoose.connection.readyState === 1;
}

// Fonction pour attendre la connexion
async function waitForConnection(maxWait = 30000) {
  const startTime = Date.now();
  while (!isConnected() && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!isConnected()) {
    throw new Error('MongoDB connection timeout');
  }
}

// Connecter à MongoDB avec gestion d'erreur améliorée
let connectionPromise = mongoose.connect(mongoUri, options)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    return mongoose.connection;
  })
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err.message || err);
    console.error('Ensure MongoDB is running on the configured URI.');
    // Ne pas throw l'erreur pour permettre au serveur de démarrer quand même
    return null;
  });

// Exposer la promesse de connexion
mongoose.connectionPromise = connectionPromise;

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✓ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ MongoDB error:', err.message || err);
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
