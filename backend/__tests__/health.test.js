// Tests unitaires pour les health checks (app minimale pour éviter de charger toute l'app)

const express = require('express');
const request = require('supertest');
const healthRouter = require('../routes/health');

const app = express();
app.use('/api/health', healthRouter);

describe('Health Check Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      if (process.env.NODE_ENV !== 'production') {
        expect(response.body).toHaveProperty('uptime');
      }
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect((res) => {
          // 200 si DB connectée, 503 si dégradé
          if (res.status !== 200 && res.status !== 503) throw new Error(`Expected 200 or 503, got ${res.status}`);
        });

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('database');
      if (process.env.NODE_ENV !== 'production') {
        expect(response.body).toHaveProperty('memory');
        expect(response.body.memory).toHaveProperty('used');
        expect(response.body.memory).toHaveProperty('total');
      }
    });
  });
});


