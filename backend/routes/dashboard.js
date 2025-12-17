const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Obtenir les statistiques du dashboard
router.get('/', dashboardController.getDashboard);

module.exports = router;

