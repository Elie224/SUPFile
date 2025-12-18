// Tests unitaires pour les health checks
// Exemple de structure de tests

const request = require('supertest');
const app = require('../app');

describe('Health Check Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('database');
      expect(response.body.memory).toHaveProperty('used');
      expect(response.body.memory).toHaveProperty('total');
    });
  });
});

