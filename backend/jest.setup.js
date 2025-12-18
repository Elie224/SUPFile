// Configuration Jest setup
// S'exécute avant chaque test

// Mock des variables d'environnement
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET='[REDACTED]';
process.env.JWT_REFRESH_SECRET='[REDACTED]';
process.env.SESSION_SECRET='[REDACTED]';
process.env.MONGO_URI='[REDACTED]';

// Augmenter le timeout pour les tests
jest.setTimeout(10000);

