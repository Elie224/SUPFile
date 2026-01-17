// Configuration Jest setup
// S'exécute avant chaque test

// Mock des variables d'environnement
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/supfile-test';

// Augmenter le timeout pour les tests
jest.setTimeout(10000);


