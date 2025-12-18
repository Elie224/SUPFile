// Route de health check pour vérifier l'état de l'application
// Améliore la stabilité et le monitoring

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Health check simple
 * GET /api/health
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
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
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        limit: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
      },
    };

    // Si MongoDB n'est pas connecté, retourner un statut dégradé
    if (mongoose.connection.readyState !== 1) {
      health.status = 'degraded';
      health.database.status = 'disconnected';
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

