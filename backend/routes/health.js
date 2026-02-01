// Route de health check pour vérifier l'état de l'application
// Améliore la stabilité et le monitoring

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Health check simple
 * GET /api/health
 * En production : pas d'exposition de l'environnement
 */
router.get('/', async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      ...(isProduction ? {} : { uptime: process.uptime(), environment: process.env.NODE_ENV || 'development' }),
    };

    res.status(200).json(health);
  } catch (error) {
    logger.logError(error, { context: 'health check' });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
    });
  }
});

/**
 * Health check détaillé avec vérification MongoDB
 * GET /api/health/detailed
 * En production : uniquement status, timestamp et database.status (pas de memory, readyState, environment)
 */
router.get('/detailed', async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const dbConnected = mongoose.connection.readyState === 1;
    const health = {
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: { status: dbConnected ? 'connected' : 'disconnected' },
    };

    if (!isProduction) {
      health.uptime = process.uptime();
      health.environment = process.env.NODE_ENV || 'development';
      health.memory = {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        limit: Math.round(process.memoryUsage().rss / 1024 / 1024),
      };
      health.database.readyState = mongoose.connection.readyState;
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.logError(error, { context: 'detailed health check' });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;


